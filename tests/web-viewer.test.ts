import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ACTION_BY_ID, CONTROL_ACTIONS } from "../src/actions";
import { INTERFACE_CAPABILITIES } from "../src/capabilities";
import {
  canonicalWebViewerUrl,
  CoreWebViewerController,
  CORE_WEB_VIEWER_VIEW_TYPE,
  FIXED_WEB_VIEWER_URLS,
  isSafeMapUrl,
  resolveWebViewerActionUrl,
  WEB_VIEWER_CANCELLED_MESSAGE,
  type CoreWebViewerState,
  type CoreWebViewerWorkspace
} from "../src/web-viewer";

assert.equal(CORE_WEB_VIEWER_VIEW_TYPE, "webviewer");
assert.deepEqual(FIXED_WEB_VIEWER_URLS, {
  "open-5etools": "https://5e.tools/",
  "open-kobold-club": "https://koboldplus.club/"
});

assert.equal(canonicalWebViewerUrl("https://5e.tools"), "https://5e.tools/");
assert.equal(canonicalWebViewerUrl("javascript:alert(1)"), null);
assert.equal(canonicalWebViewerUrl("https://user:pass@5e.tools/"), null);
assert.equal(isSafeMapUrl("http://127.0.0.1:5173/"), true);
assert.equal(isSafeMapUrl("http://localhost:5173/map?district=loop"), true);
assert.equal(isSafeMapUrl("http://[::1]:5173/"), true);
assert.equal(isSafeMapUrl("https://127.0.0.1:5173/"), false);
assert.equal(isSafeMapUrl("http://192.168.1.25:5173/"), false);
assert.equal(isSafeMapUrl("http://user:pass@localhost:5173/"), false);

assert.equal(resolveWebViewerActionUrl("open-veiled-map", undefined, "http://127.0.0.1:5173"), "http://127.0.0.1:5173/");
assert.equal(resolveWebViewerActionUrl("open-veiled-map", "https://example.com/", "http://127.0.0.1:5173/"), null);
assert.equal(
  resolveWebViewerActionUrl("open-5etools", FIXED_WEB_VIEWER_URLS["open-5etools"], "ignored"),
  FIXED_WEB_VIEWER_URLS["open-5etools"]
);
assert.equal(resolveWebViewerActionUrl("open-5etools", "https://example.com/", "ignored"), null);
assert.equal(
  resolveWebViewerActionUrl("open-kobold-club", FIXED_WEB_VIEWER_URLS["open-kobold-club"], "ignored"),
  FIXED_WEB_VIEWER_URLS["open-kobold-club"]
);
assert.equal(resolveWebViewerActionUrl("unknown-action", "https://5e.tools/", "ignored"), null);

assert.equal(CONTROL_ACTIONS.length, 56);
for (const id of ["open-veiled-map", "open-5etools", "open-kobold-club"]) {
  const action = ACTION_BY_ID.get(id);
  assert.equal(action?.kind, "integration", `${id} must use the core Web Viewer integration path`);
  assert.equal(action?.allowedSources.includes("block"), false, `${id} must remain blocked from Markdown`);
}
assert.equal(ACTION_BY_ID.get("open-veiled-map")?.target, undefined);
assert.equal(ACTION_BY_ID.get("open-5etools")?.target, FIXED_WEB_VIEWER_URLS["open-5etools"]);
assert.equal(ACTION_BY_ID.get("open-kobold-club")?.target, FIXED_WEB_VIEWER_URLS["open-kobold-club"]);

const worldMaps = INTERFACE_CAPABILITIES.find(({ id }) => id === "world-maps");
assert.ok(worldMaps);
assert.equal(worldMaps.owner, "Leaflet and Obsidian Web Viewer");
assert.deepEqual(worldMaps.pluginIds, ["obsidian-leaflet-plugin"]);
assert.equal(worldMaps.builtIn, true);

interface MockLeaf {
  readonly id: string;
  state: CoreWebViewerState;
}

function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let resolve = (): void => {};
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function mockWorkspace(options: {
  readonly leaves?: MockLeaf[];
  readonly setViewState?: CoreWebViewerWorkspace<MockLeaf>["setViewState"];
  readonly revealLeaf?: CoreWebViewerWorkspace<MockLeaf>["revealLeaf"];
  readonly isCancelled?: () => boolean;
} = {}): {
  readonly workspace: CoreWebViewerWorkspace<MockLeaf>;
  readonly leaves: MockLeaf[];
  readonly created: MockLeaf[];
  readonly detached: MockLeaf[];
  readonly revealed: MockLeaf[];
  readonly inputStates: Array<{ readonly type: string; readonly state: { readonly url: string; readonly navigate: true } }>;
} {
  const leaves = options.leaves ?? [];
  const created: MockLeaf[] = [];
  const detached: MockLeaf[] = [];
  const revealed: MockLeaf[] = [];
  const inputStates: Array<{
    readonly type: string;
    readonly state: { readonly url: string; readonly navigate: true };
  }> = [];
  const workspace: CoreWebViewerWorkspace<MockLeaf> = {
    forEachLeaf: (visit) => leaves.forEach(visit),
    getViewState: (leaf) => leaf.state,
    createTab: () => {
      const leaf: MockLeaf = { id: `created-${created.length + 1}`, state: { type: "empty" } };
      created.push(leaf);
      leaves.push(leaf);
      return leaf;
    },
    setViewState: async (leaf, state) => {
      inputStates.push(state);
      if (options.setViewState) return options.setViewState(leaf, state);
      leaf.state = { type: state.type, state: { url: state.state.url } };
    },
    revealLeaf: async (leaf) => {
      revealed.push(leaf);
      await options.revealLeaf?.(leaf);
    },
    detachLeaf: (leaf) => {
      detached.push(leaf);
      const index = leaves.indexOf(leaf);
      if (index >= 0) leaves.splice(index, 1);
    },
    isCancelled: options.isCancelled ?? (() => false)
  };
  return { workspace, leaves, created, detached, revealed, inputStates };
}

const delayedUrl = FIXED_WEB_VIEWER_URLS["open-5etools"];
let delayedNow = 0;
let delayedPolls = 0;
const delayedHarness = mockWorkspace({
  setViewState: async (leaf, state) => {
    leaf.state = { type: state.type, state: {} };
  }
});
const delayedController = new CoreWebViewerController(delayedHarness.workspace, {
  timeoutMs: 200,
  pollMs: 25,
  now: () => delayedNow,
  sleep: async (milliseconds) => {
    delayedNow += milliseconds;
    delayedPolls += 1;
    if (delayedPolls === 2) delayedHarness.created[0]!.state = { type: "webviewer", state: { url: delayedUrl } };
  }
});
const delayedLeaf = await delayedController.open(delayedUrl);
assert.equal(delayedLeaf, delayedHarness.created[0]);
assert.deepEqual(delayedHarness.inputStates, [{ type: "webviewer", state: { url: delayedUrl, navigate: true } }]);
assert.equal(delayedPolls, 2);
assert.deepEqual(delayedHarness.revealed, [delayedLeaf]);
assert.deepEqual(delayedHarness.detached, []);

const existingLeaf: MockLeaf = { id: "existing", state: { type: "webviewer", state: { url: delayedUrl } } };
const existingHarness = mockWorkspace({ leaves: [existingLeaf] });
const reused = await new CoreWebViewerController(existingHarness.workspace).open(delayedUrl);
assert.equal(reused, existingLeaf);
assert.deepEqual(existingHarness.created, []);
assert.deepEqual(existingHarness.revealed, [existingLeaf]);

const concurrentGate = deferred();
const concurrentHarness = mockWorkspace({
  setViewState: async (leaf, state) => {
    leaf.state = { type: state.type, state: {} };
    await concurrentGate.promise;
    leaf.state = { type: state.type, state: { url: state.state.url } };
  }
});
const concurrentController = new CoreWebViewerController(concurrentHarness.workspace);
const concurrentFirst = concurrentController.open(delayedUrl);
const concurrentSecond = concurrentController.open(delayedUrl);
assert.equal(concurrentFirst, concurrentSecond);
assert.equal(concurrentHarness.created.length, 1);
concurrentGate.resolve();
assert.equal(await concurrentFirst, await concurrentSecond);
assert.equal(concurrentHarness.inputStates.length, 1);
assert.equal(concurrentHarness.revealed.length, 1);

const rejectedHarness = mockWorkspace({
  setViewState: async (leaf) => {
    leaf.state = { type: "empty" };
  }
});
await assert.rejects(
  new CoreWebViewerController(rejectedHarness.workspace).open(delayedUrl),
  /did not accept the requested view type/
);
assert.equal(rejectedHarness.detached.length, 1);
assert.equal(rejectedHarness.revealed.length, 0);

let timeoutNow = 0;
const timeoutHarness = mockWorkspace({
  setViewState: async (leaf, state) => {
    leaf.state = { type: state.type, state: { url: "https://example.com/altered" } };
  }
});
await assert.rejects(
  new CoreWebViewerController(timeoutHarness.workspace, {
    timeoutMs: 90,
    pollMs: 40,
    now: () => timeoutNow,
    sleep: async (milliseconds) => {
      timeoutNow += milliseconds;
    }
  }).open(delayedUrl),
  /did not persist the validated URL in time/
);
assert.equal(timeoutNow, 90);
assert.equal(timeoutHarness.detached.length, 1);
assert.equal(timeoutHarness.revealed.length, 0);

let waitNow = 0;
let cancelledDuringWait = false;
const waitCancelHarness = mockWorkspace({
  isCancelled: () => cancelledDuringWait,
  setViewState: async (leaf, state) => {
    leaf.state = { type: state.type, state: {} };
  }
});
await assert.rejects(
  new CoreWebViewerController(waitCancelHarness.workspace, {
    timeoutMs: 200,
    pollMs: 25,
    now: () => waitNow,
    sleep: async (milliseconds) => {
      waitNow += milliseconds;
      cancelledDuringWait = true;
    }
  }).open(delayedUrl),
  /cancelled during plugin unload/
);
assert.equal(waitCancelHarness.detached.length, 1);
assert.equal(waitCancelHarness.revealed.length, 0);

let cancelled = false;
const unloadGate = deferred();
const unloadHarness = mockWorkspace({
  isCancelled: () => cancelled,
  setViewState: async (leaf, state) => {
    leaf.state = { type: state.type, state: {} };
    await unloadGate.promise;
  }
});
const unloading = new CoreWebViewerController(unloadHarness.workspace).open(delayedUrl);
assert.equal(unloadHarness.created.length, 1);
cancelled = true;
unloadGate.resolve();
await assert.rejects(unloading, new RegExp(WEB_VIEWER_CANCELLED_MESSAGE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.equal(unloadHarness.detached.length, 1);
assert.equal(unloadHarness.revealed.length, 0);

let cancelledDuringReveal = false;
const revealStarted = deferred();
const revealGate = deferred();
const revealHarness = mockWorkspace({
  isCancelled: () => cancelledDuringReveal,
  revealLeaf: async () => {
    revealStarted.resolve();
    await revealGate.promise;
  }
});
const revealing = new CoreWebViewerController(revealHarness.workspace).open(delayedUrl);
await revealStarted.promise;
cancelledDuringReveal = true;
revealGate.resolve();
await assert.rejects(revealing, /cancelled during plugin unload/);
assert.equal(revealHarness.detached.length, 1);
assert.equal(revealHarness.revealed.length, 1);

const cancelledBeforeOpen = mockWorkspace({ isCancelled: () => true });
await assert.rejects(
  new CoreWebViewerController(cancelledBeforeOpen.workspace).open(delayedUrl),
  /cancelled during plugin unload/
);
assert.equal(cancelledBeforeOpen.created.length, 0);
assert.equal(cancelledBeforeOpen.revealed.length, 0);

const mainSource = readFileSync("src/main.ts", "utf8");
assert.match(mainSource, /new CoreWebViewerController<WorkspaceLeaf>/);
assert.match(mainSource, /getLeaf\("tab"\)/);
assert.match(mainSource, /isCancelled: \(\) => this\.unloading/);
assert.doesNotMatch(mainSource, /obsidian-custom-frames|Custom Frame/);

console.log("web-viewer-tests PASS fixed URLs, async commit, reuse, concurrency, rejection, timeout, unload, and source guards");
