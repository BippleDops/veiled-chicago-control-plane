import assert from "node:assert/strict";

import { ACTION_BY_ID, CONTROL_ACTIONS } from "../src/actions";
import {
  ACTION_VERBS,
  buildActionSearchText,
  isCanonicalIsoTimestamp,
  isActionVerb,
  isPrimaryRoute,
  normalizeFavoriteActionIds,
  normalizeRecentActions,
  PRIMARY_ROUTES,
  rankActionSearchResult,
  rankActionsForSearch,
  ROUTE_DEFINITIONS,
  RouteHistory,
  routeForLegacySection,
  validateActionNavigation,
  validateActionRouteAndVerb,
  type NavigationAction,
  type RecentActionRecord
} from "../src/navigation";

const V1_1_ACTION_IDS = [
  "open-control-plane",
  "open-live-edge-router",
  "open-dm-control-deck",
  "open-current-state",
  "open-current-leads",
  "open-latest-played",
  "open-next-session-control",
  "open-campaign-ledger",
  "open-combat-dashboard",
  "open-initiative-tracker",
  "open-dice-tray",
  "create-managed-note",
  "capture-quick-inbox",
  "set-active-session-room",
  "open-active-session-control",
  "scaffold-active-session-room",
  "open-session-preflight",
  "capture-player-declaration",
  "generate-session-run",
  "open-session-readiness",
  "capture-live-event",
  "open-promotion-review",
  "propose-local-transcription",
  "open-ai-context-policy",
  "open-operations-health",
  "open-campaign-board",
  "open-faction-fronts",
  "open-npc-reference",
  "open-map-registry",
  "open-player-portal",
  "open-veiled-map",
  "open-5etools",
  "open-kobold-club",
  "open-terminal",
  "open-quick-search",
  "open-vault-health",
  "run-live-edge-audit",
  "run-navigation-audit",
  "run-link-audit",
  "run-frontmatter-audit",
  "run-css-audit",
  "check-map-server",
  "start-map-server",
  "stop-map-server"
] as const;

const V1_2_ACTION_IDS = [
  ...V1_1_ACTION_IDS,
  "open-command-search",
  "open-entity-navigator",
  "open-quick-switcher",
  "open-bookmarks",
  "open-workspaces",
  "save-workspace",
  "start-audio-recorder",
  "open-sessions-base",
  "open-npcs-base",
  "open-locations-base",
  "open-review-queue-base"
] as const;

assert.deepEqual(PRIMARY_ROUTES, ["home", "session", "create", "world", "tools", "system"]);
assert.equal(new Set(PRIMARY_ROUTES).size, 6);
assert.deepEqual(
  ROUTE_DEFINITIONS.map((route) => route.id),
  PRIMARY_ROUTES
);
assert.deepEqual(
  ROUTE_DEFINITIONS.filter((route) => route.mobilePrimary).map((route) => route.id),
  ["home", "session", "create", "world"]
);
assert.equal(isPrimaryRoute("world"), true);
assert.equal(isPrimaryRoute("more"), false);
assert.equal(isPrimaryRoute(["home"]), false);
assert.deepEqual(ACTION_VERBS, ["OPEN", "RUN", "CREATE", "CAPTURE", "REVIEW", "SELECT", "START", "STOP"]);
assert.equal(isActionVerb("CAPTURE"), true);
assert.equal(isActionVerb("EXECUTE"), false);
assert.equal(isCanonicalIsoTimestamp("2026-08-29T22:00:00.000Z"), true);
assert.equal(isCanonicalIsoTimestamp("2026-02-31T00:00:00.000Z"), false);
assert.equal(isCanonicalIsoTimestamp("2025-02-29T00:00:00.000Z"), false);
assert.equal(isCanonicalIsoTimestamp("2026-08-29T22:00:00Z"), false);

assert.deepEqual(validateActionRouteAndVerb({ id: "open-test", route: "tools", verb: "OPEN" }), {
  id: "open-test",
  route: "tools",
  verb: "OPEN"
});
assert.throws(
  () => validateActionRouteAndVerb({ id: "bad-route", route: ["home", "system"], verb: "OPEN" }),
  /invalid or non-singular route/
);
assert.throws(
  () => validateActionRouteAndVerb({ id: "bad-verb", route: "home", verb: "EXECUTE" }),
  /invalid verb/
);
assert.throws(
  () =>
    validateActionNavigation([
      { id: "duplicate", route: "home", verb: "OPEN" },
      { id: "duplicate", route: "tools", verb: "RUN" }
    ]),
  /Duplicate navigation action ID/
);

assert.deepEqual(routeForLegacySection("live-edge"), { route: "home", focusTarget: "live-edge" });
assert.deepEqual(routeForLegacySection("AI Context Policy"), null);
assert.deepEqual(routeForLegacySection("ai_policy"), { route: "system", focusTarget: "ai-policy" });
assert.deepEqual(routeForLegacySection("Operations Health"), {
  route: "system",
  focusTarget: "operations-health"
});
assert.deepEqual(routeForLegacySection("Creation and session"), { route: "session" });
assert.deepEqual(routeForLegacySection("Applications"), { route: "tools" });
assert.deepEqual(routeForLegacySection("world"), { route: "world" });
assert.equal(routeForLegacySection("../../outside"), null);

const compiledIds = Array.from({ length: 16 }, (_value, index) => `action-${index + 1}`);
assert.deepEqual(
  normalizeFavoriteActionIds(
    ["action-2", "unknown", "action-1", "action-2", 12, ...compiledIds.slice(2)],
    compiledIds
  ),
  ["action-2", "action-1", ...compiledIds.slice(2, 12)]
);
assert.deepEqual(normalizeFavoriteActionIds("action-1", compiledIds), []);

const recent = normalizeRecentActions(
  [
    { actionId: "action-1", success: false, timestamp: "2026-08-29T18:00:00.000Z" },
    {
      actionId: "action-2",
      success: true,
      timestamp: "2026-08-29T20:00:00.000Z",
      arbitraryOutput: "must be discarded"
    },
    { actionId: "unknown", success: true, timestamp: "2026-08-29T21:00:00.000Z" },
    { actionId: "action-3", success: "yes", timestamp: "2026-08-29T22:00:00.000Z" },
    { actionId: "action-3", success: true, timestamp: "not-a-timestamp" },
    { actionId: "action-3", success: true, timestamp: "2026-02-31T00:00:00.000Z" },
    { actionId: "action-3", success: true, timestamp: "2025-02-29T00:00:00.000Z" },
    { actionId: "action-3", success: true, timestamp: "2026-08-29T22:00:00Z" },
    null
  ],
  compiledIds
);
assert.deepEqual(recent, [
  { actionId: "action-2", success: true, timestamp: "2026-08-29T20:00:00.000Z" },
  { actionId: "action-1", success: false, timestamp: "2026-08-29T18:00:00.000Z" }
]);
assert.deepEqual(Object.keys(recent[0] ?? {}).sort(), ["actionId", "success", "timestamp"]);
const tooManyRecent = Array.from({ length: 25 }, (_value, index) => ({
  actionId: "action-1",
  success: index % 2 === 0,
  timestamp: new Date(Date.UTC(2026, 7, 29, 0, index)).toISOString()
}));
assert.equal(normalizeRecentActions(tooManyRecent, compiledIds).length, 20);

const history = new RouteHistory("home", 3);
assert.equal(history.back(), null);
assert.equal(history.push("session"), "session");
assert.equal(history.push("session"), "session");
assert.equal(history.push("create"), "create");
assert.equal(history.back(), "session");
assert.equal(history.canGoForward, true);
assert.equal(history.push("world"), "world");
assert.equal(history.forward(), null);
assert.deepEqual(history.snapshot(), {
  entries: ["home", "session", "world"],
  cursor: 2,
  current: "world"
});
history.push("tools");
assert.deepEqual(history.snapshot().entries, ["session", "world", "tools"]);
assert.throws(() => new RouteHistory("home", 1), /capacity must be an integer/);

const actions: readonly NavigationAction[] = [
  {
    id: "open-current-state",
    title: "Current State",
    description: "Open the factual campaign handoff.",
    group: "Live operations",
    route: "home",
    verb: "OPEN",
    keywords: ["truth", "chronology"]
  },
  {
    id: "create-managed-note",
    title: "Create Managed Note",
    description: "Create a validated draft note.",
    group: "Creation and session",
    route: "create",
    verb: "CREATE",
    keywords: ["schema", "draft"]
  },
  {
    id: "open-campaign-board",
    title: "Campaign Board",
    description: "Review open-world deployments.",
    group: "World and maps",
    route: "world",
    verb: "REVIEW",
    keywords: ["factions"]
  },
  {
    id: "run-link-audit",
    title: "Audit Live Links",
    description: "Run the strict link verifier.",
    group: "Automation",
    route: "system",
    verb: "RUN",
    keywords: ["health"]
  }
];
const searchState = {
  favoriteActionIds: ["open-campaign-board", "create-managed-note"],
  recentActions: [
    {
      actionId: "run-link-audit",
      success: true,
      timestamp: "2026-08-29T20:00:00.000Z"
    },
    {
      actionId: "open-current-state",
      success: true,
      timestamp: "2026-08-29T19:00:00.000Z"
    }
  ] satisfies RecentActionRecord[]
};
assert.match(
  buildActionSearchText(actions[0]!),
  /open current state current state open the factual campaign handoff home live operations open truth chronology/
);
assert.deepEqual(
  rankActionsForSearch(actions, "", searchState).map((result) => result.action.id),
  ["open-campaign-board", "create-managed-note", "run-link-audit", "open-current-state"]
);
assert.deepEqual(
  rankActionsForSearch(actions, "favorite", searchState).map((result) => result.action.id),
  ["open-campaign-board", "create-managed-note"]
);
assert.equal(rankActionsForSearch(actions, "current state", searchState)[0]?.action.id, "open-current-state");
assert.equal(rankActionsForSearch(actions, "home truth", searchState)[0]?.action.id, "open-current-state");
assert.equal(rankActionsForSearch(actions, "strict verifier", searchState)[0]?.action.id, "run-link-audit");
assert.equal(rankActionsForSearch(actions, "does not exist", searchState).length, 0);
assert.equal(rankActionSearchResult(actions[2]!, "factions", searchState)?.favorite, true);

const tiedActions: readonly NavigationAction[] = [
  { id: "z-action", title: "Same", description: "same", route: "tools", verb: "OPEN" },
  { id: "a-action", title: "Same", description: "same", route: "tools", verb: "OPEN" }
];
assert.deepEqual(
  rankActionsForSearch(tiedActions, "same").map((result) => result.action.id),
  ["a-action", "z-action"]
);

assert.equal(V1_1_ACTION_IDS.length, 44);
assert.equal(new Set(V1_1_ACTION_IDS).size, 44);
const currentActionIds = new Set(CONTROL_ACTIONS.map((action) => action.id));
assert.deepEqual(
  V1_1_ACTION_IDS.filter((id) => !currentActionIds.has(id)),
  [],
  "Every 1.1 action ID must remain present in 1.3."
);
assert.equal(V1_2_ACTION_IDS.length, 55);
assert.equal(new Set(V1_2_ACTION_IDS).size, 55);
assert.deepEqual(
  V1_2_ACTION_IDS.filter((id) => !currentActionIds.has(id)),
  [],
  "Every 1.2 action ID must remain present in 1.3."
);
assert.equal(CONTROL_ACTIONS.length, 56);
assert.equal(currentActionIds.size, CONTROL_ACTIONS.length);
assert.equal(validateActionNavigation(CONTROL_ACTIONS).length, CONTROL_ACTIONS.length);
assert.deepEqual(
  [
    "open-omnisearch"
  ].filter((id) => !currentActionIds.has(id)),
  [],
  "The only 1.3 action addition must be compiled."
);
assert.deepEqual([...currentActionIds].filter((id) => !(V1_2_ACTION_IDS as readonly string[]).includes(id)), ["open-omnisearch"]);
assert.equal(ACTION_BY_ID.get("open-quick-switcher")?.target, "switcher:open");
assert.equal(ACTION_BY_ID.get("open-omnisearch")?.target, "omnisearch:show-modal");
assert.equal(ACTION_BY_ID.get("open-bookmarks")?.target, "bookmarks:open");
assert.equal(ACTION_BY_ID.get("open-workspaces")?.target, "workspaces:open-modal");
assert.equal(ACTION_BY_ID.get("save-workspace")?.target, "workspaces:save");
assert.equal(ACTION_BY_ID.get("start-audio-recorder")?.target, "audio-recorder:start");
assert.match(ACTION_BY_ID.get("start-audio-recorder")?.confirm ?? "", /consent/i);

console.log("navigation-tests PASS routes, normalization, history, 55-ID compatibility, and 56-action registry");
