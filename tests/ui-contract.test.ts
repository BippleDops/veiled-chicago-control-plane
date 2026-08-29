import assert from "node:assert/strict";

import { INTERFACE_CAPABILITIES, capabilityRuntimeStatus } from "../src/capabilities";
import {
  ENTITY_SEARCH_DEBOUNCE_MS,
  escapeSurface,
  groupRouteActions,
  normalizeStartupSurface,
  parseAdStatblock,
  sanitizeAdStatblockMarkdown,
  shouldGroupRouteActions,
  stableDomIdToken
} from "../src/ui-contract";

assert.equal(normalizeStartupSurface("control-plane"), "control-plane");
assert.equal(normalizeStartupSurface("none"), "none");
assert.equal(normalizeStartupSurface("homepage"), "control-plane");
assert.equal(normalizeStartupSurface(null), "control-plane");

assert.equal(shouldGroupRouteActions(8), false);
assert.equal(shouldGroupRouteActions(9), true);
assert.deepEqual(
  groupRouteActions([
    { id: "a", group: "Applications" as const },
    { id: "b", group: "Automation" as const },
    { id: "c", group: "Applications" as const }
  ]).map((bucket) => ({ group: bucket.group, ids: bucket.actions.map((action) => action.id) })),
  [
    { group: "Applications", ids: ["a", "c"] },
    { group: "Automation", ids: ["b"] }
  ]
);

assert.equal(escapeSurface(true, true), "context");
assert.equal(escapeSurface(false, true), "more");
assert.equal(escapeSurface(false, false), null);
assert.equal(ENTITY_SEARCH_DEBOUNCE_MS, 180);
assert.equal(stableDomIdToken("2-World/Chicago/People/NPCs/A.md"), stableDomIdToken("2-World/Chicago/People/NPCs/A.md"));
assert.notEqual(stableDomIdToken("A"), stableDomIdToken("B"));

assert.deepEqual(parseAdStatblock("title: The Ashen Judge\n**Armor:** 17\n\n| Stat | Value |\n| --- | --- |"), {
  title: "The Ashen Judge",
  markdown: "**Armor:** 17\n\n| Stat | Value |\n| --- | --- |"
});
assert.deepEqual(parseAdStatblock("Title appears later\ntitle: remains body"), {
  title: "Statblock",
  markdown: "Title appears later\ntitle: remains body"
});
assert.equal(parseAdStatblock("title: <img src=x onerror=alert(1)>").title, "<img src=x onerror=alert(1)>");

const sanitized = sanitizeAdStatblockMarkdown([
  "<script>alert(1)</script>",
  "![[Secret Note]]",
  "```dataviewjs",
  "dv.table([], [])",
  "```",
  "`= this.file.name`",
  "BUTTON[danger] INPUT[select(option(a))] VIEW[{file.path}] button[lowercase]",
  "[Normal vault link](Some Note.md)"
].join("\n"));
assert.match(sanitized, /&lt;script&gt;/);
assert.doesNotMatch(sanitized, /!\[\[/);
assert.match(sanitized, /^    ```dataviewjs$/m);
assert.match(sanitized, /`\\= this\.file\.name`/);
assert.doesNotMatch(sanitized, /\b(?:BUTTON|INPUT|VIEW)\[/);
assert.match(sanitized, /BUTTON\u2060\[danger\]/u);
assert.match(sanitized, /button\u2060\[lowercase\]/u);
assert.match(sanitized, /\[Normal vault link\]\(Some Note\.md\)/);

assert.equal(new Set(INTERFACE_CAPABILITIES.map((capability) => capability.id)).size, INTERFACE_CAPABILITIES.length);
const omnisearch = INTERFACE_CAPABILITIES.find((capability) => capability.id === "body-search");
assert.ok(omnisearch);
assert.deepEqual(
  capabilityRuntimeStatus(omnisearch, {
    pluginEnabled: (id) => id === "omnisearch",
    commandAvailable: () => false
  }),
  {
    state: "partial",
    available: 1,
    required: 2,
    missing: ["omnisearch:show-modal"]
  }
);

console.log("ui-contract-tests PASS startup, grouping, disclosure, statblock, semantics, and capabilities");
