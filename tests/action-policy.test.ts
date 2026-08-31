import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ACTION_BY_ID, CONTROL_ACTIONS, CONTROL_BLOCK_LIMITS, parseControlBlock } from "../src/actions";

for (const action of CONTROL_ACTIONS) {
  assert.equal(action.allowedSources.includes("view"), true, `${action.id} must remain available in the first-party view`);
  assert.equal(
    action.allowedSources.includes("command"),
    true,
    `${action.id} must remain available from its registered Obsidian command`
  );
  assert.equal(action.allowedSources.includes("protocol"), action.protocolSafe === true);
  assert.equal(
    action.allowedSources.includes("block"),
    ["view", "note", "dynamic-note"].includes(action.kind),
    `${action.id} has an unexpected Markdown source policy`
  );
}

for (const id of [
  "run-live-edge-audit",
  "check-map-server",
  "start-map-server",
  "open-5etools",
  "open-kobold-club",
  "open-veiled-map",
  "open-terminal",
  "start-audio-recorder",
  "capture-player-declaration",
  "generate-session-run",
  "capture-live-event"
]) {
  assert.equal(ACTION_BY_ID.get(id)?.allowedSources.includes("block"), false, `${id} must be blocked from Markdown`);
}
assert.ok(CONTROL_ACTIONS.filter(({ kind }) => kind === "workflow").every(({ allowedSources }) => !allowedSources.includes("block")));

assert.deepEqual(
  parseControlBlock("title: Read only\nsubtitle: Fixed navigation\nactions: open-current-state, open-current-leads\ncompact: true"),
  {
    title: "Read only",
    subtitle: "Fixed navigation",
    actions: ["open-current-state", "open-current-leads"],
    compact: true
  }
);
assert.throws(() => parseControlBlock("actions: run-live-edge-audit"), /not permitted from Markdown/);
assert.throws(() => parseControlBlock("actions: open-current-state, open-current-state"), /must be unique/);
assert.throws(
  () => parseControlBlock(`title: ${"x".repeat(CONTROL_BLOCK_LIMITS.titleCharacters + 1)}\nactions: open-current-state`),
  /titles are limited/
);
assert.throws(
  () => parseControlBlock(`${"#".repeat(CONTROL_BLOCK_LIMITS.sourceCharacters + 1)}`),
  /limited to 4096 characters/
);
assert.throws(
  () => parseControlBlock(Array.from({ length: CONTROL_BLOCK_LIMITS.lines + 1 }, () => "#").join("\n")),
  /limited to 64 lines/
);
const tooManyBlockActions = CONTROL_ACTIONS.filter(({ allowedSources }) => allowedSources.includes("block"))
  .slice(0, CONTROL_BLOCK_LIMITS.actions + 1)
  .map(({ id }) => id);
assert.equal(tooManyBlockActions.length, CONTROL_BLOCK_LIMITS.actions + 1);
assert.throws(() => parseControlBlock(`actions: ${tooManyBlockActions.join(", ")}`), /limited to 12 actions/);

const commandSearchSource = readFileSync("src/command-search.ts", "utf8");
assert.match(commandSearchSource, /getSuggestions\(query: string\)/);
assert.match(commandSearchSource, /rankActionsForSearch\(this\.options\.actions, query,/);

const mainSource = readFileSync("src/main.ts", "utf8");
assert.match(mainSource, /class SessionRoomSuggestModal extends FuzzySuggestModal/);
assert.match(mainSource, /root\.children/);
assert.match(mainSource, /folder instanceof TFolder/);
assert.match(mainSource, /sourceBlockReason\(action, source\)/);
assert.match(mainSource, /const activeSession = this\.plugin\.activeSession\(\)/);
assert.match(mainSource, /Stored selection is unavailable or no longer an existing direct-child session folder/);
assert.doesNotMatch(
  mainSource,
  /\.setDesc\(\s*this\.plugin\.settings\.activeSessionRoom\s*\?/,
  "settings must not present an unvalidated stored room as active"
);

console.log("action-policy-tests PASS source guards, Markdown limits, query wiring, and native session selection");
