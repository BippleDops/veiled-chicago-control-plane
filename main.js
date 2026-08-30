"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  ACTION_BY_ID: () => ACTION_BY_ID,
  CONTROL_ACTIONS: () => CONTROL_ACTIONS,
  MANAGED_PROFILE_CLASSES: () => MANAGED_PROFILE_CLASSES,
  default: () => VeiledChicagoControlPlane,
  parseControlBlock: () => parseControlBlock,
  profilesForPath: () => profilesForPath
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");
var import_node_child_process = require("node:child_process");
var import_node_fs = require("node:fs");

// src/paths.ts
var VAULT_PATHS = {
  campaignRoot: "1-Campaign",
  dmRoot: "1-Campaign/DM",
  partyRoot: "1-Campaign/Party",
  sessionsRoot: "1-Campaign/Sessions",
  handoutsRoot: "1-Campaign/Handouts",
  operationsInboxRoot: "1-Campaign/DM/Operations Inbox",
  worldRoot: "2-World/Chicago",
  mechanicsRoot: "3-Library/Mechanics",
  modulesRoot: "3-Library/Modules/Chicago",
  templatesRoot: "3-Library/Templates",
  systemRoot: "9-System",
  automationRoot: "9-System/Automation",
  automationScriptsRoot: "9-System/Automation/scripts",
  mapAppRoot: "9-System/Apps/veiled-chicago-map",
  currentState: "1-Campaign/DM/Current State of Affairs.md",
  currentLeads: "1-Campaign/Party/Current Leads.md",
  campaignLedger: "1-Campaign/Party/Campaign State Ledger.md",
  canonDecisions: "1-Campaign/DM/Canon Decisions Log.md",
  dmControlDeck: "1-Campaign/DM/DM Control Deck.md",
  combatDashboard: "1-Campaign/DM/Combat Dashboard.md",
  campaignBoard: "1-Campaign/DM/Open-World Campaign Board.md",
  factionFronts: "1-Campaign/DM/Faction Fronts.md",
  npcReference: "1-Campaign/DM/NPC Quick Reference.md",
  mapRegistry: "1-Campaign/DM/Map Bundles/Map Bundle Registry.md",
  playerPortal: "1-Campaign/Party/Player Portal.md",
  quickSearch: "1-Campaign/DM/Quick Search.md",
  vaultHealth: "1-Campaign/DM/Vault Health.md",
  quickCapture: "1-Campaign/DM/Operations Inbox/Quick Capture.md",
  sessionsBase: "1-Campaign/DM/Databases/Sessions Database.base",
  npcBase: "1-Campaign/DM/Databases/NPC Database.base",
  locationBase: "1-Campaign/DM/Databases/Location Database.base",
  reviewQueueBase: "1-Campaign/DM/Databases/Operational Review Queue.base",
  controlWrapper: "9-System/Automation/scripts/vcg_control.py"
};
var MANAGED_NOTE_ROOTS = {
  npc: "2-World/Chicago/People/NPCs",
  location: "2-World/Chicago/Places",
  faction: "2-World/Chicago/Factions",
  item: "2-World/Chicago/Items",
  clue: "1-Campaign/DM/Operations Inbox/Clues",
  ruling: "1-Campaign/DM/Operations Inbox/Rulings",
  playerKnowledge: "1-Campaign/Party/Knowledge",
  research: "1-Campaign/DM/Operations Inbox/Research",
  correction: "1-Campaign/DM/Operations Inbox/Corrections"
};
var PROTECTED_CANON_PATHS = [
  VAULT_PATHS.canonDecisions,
  VAULT_PATHS.currentState,
  VAULT_PATHS.campaignLedger,
  VAULT_PATHS.currentLeads
];
function sessionRoomPath(session) {
  return `${VAULT_PATHS.sessionsRoot}/Session ${session}`;
}
function sessionControlRoomPath(session) {
  return `${sessionRoomPath(session)}/Session ${session} Control Room.md`;
}

// src/navigation.ts
var PRIMARY_ROUTES = ["home", "session", "create", "world", "tools", "system"];
var ACTION_VERBS = ["OPEN", "RUN", "CREATE", "CAPTURE", "REVIEW", "SELECT", "START", "STOP"];
var ROUTE_DEFINITIONS = [
  {
    id: "home",
    label: "Home",
    mobileLabel: "Home",
    description: "Observed campaign state, favorites, recents, and primary live operations.",
    icon: "house",
    mobilePrimary: true
  },
  {
    id: "session",
    label: "Session",
    mobileLabel: "Session",
    description: "Explicit active-room controls and review-gated session operations.",
    icon: "panel-top-open",
    mobilePrimary: true
  },
  {
    id: "create",
    label: "Create",
    mobileLabel: "Create",
    description: "Managed-note schemas, capture, research intake, and transcription proposals.",
    icon: "file-plus-2",
    mobilePrimary: true
  },
  {
    id: "world",
    label: "World",
    mobileLabel: "World",
    description: "Scoped entities, campaign boards, factions, maps, and player surfaces.",
    icon: "globe-2",
    mobilePrimary: true
  },
  {
    id: "tools",
    label: "Tools",
    mobileLabel: "Tools",
    description: "Installed vault navigation, tabletop utilities, applications, and terminal adapters.",
    icon: "wrench",
    mobilePrimary: false
  },
  {
    id: "system",
    label: "System",
    mobileLabel: "System",
    description: "Capability policy, health, audits, process controls, and activity receipts.",
    icon: "settings-2",
    mobilePrimary: false
  }
];
function isPrimaryRoute(value) {
  return typeof value === "string" && PRIMARY_ROUTES.includes(value);
}
function isActionVerb(value) {
  return typeof value === "string" && ACTION_VERBS.includes(value);
}
function validateActionRouteAndVerb(action) {
  if (typeof action.id !== "string" || action.id.trim() !== action.id || action.id.length === 0) {
    throw new Error("Navigation action IDs must be non-empty strings without surrounding whitespace.");
  }
  if (!isPrimaryRoute(action.route)) {
    throw new Error(`Action ${action.id} has an invalid or non-singular route.`);
  }
  if (!isActionVerb(action.verb)) {
    throw new Error(`Action ${action.id} has an invalid verb.`);
  }
  return { id: action.id, route: action.route, verb: action.verb };
}
function validateActionNavigation(actions) {
  const seen = /* @__PURE__ */ new Set();
  return actions.map((action) => {
    const validated = validateActionRouteAndVerb(action);
    if (seen.has(validated.id)) throw new Error(`Duplicate navigation action ID: ${validated.id}`);
    seen.add(validated.id);
    return validated;
  });
}
var LEGACY_SECTION_ROUTES = {
  "live-edge": { route: "home", focusTarget: "live-edge" },
  "ai-policy": { route: "system", focusTarget: "ai-policy" },
  "operations-health": { route: "system", focusTarget: "operations-health" },
  "live-operations": { route: "home" },
  "creation-and-session": { route: "session" },
  "ai-and-governance": { route: "system" },
  "world-and-maps": { route: "world" },
  applications: { route: "tools" },
  automation: { route: "system" }
};
function normalizeLegacySection(section) {
  return section.trim().toLowerCase().replace(/[\s_]+/g, "-");
}
function routeForLegacySection(section) {
  if (typeof section !== "string" || section.trim().length === 0) return null;
  const normalized = normalizeLegacySection(section);
  if (isPrimaryRoute(normalized)) return { route: normalized };
  return LEGACY_SECTION_ROUTES[normalized] ?? null;
}
var MAX_FAVORITE_ACTIONS = 12;
var MAX_RECENT_ACTIONS = 20;
function compiledActionIds(values) {
  const result = /* @__PURE__ */ new Set();
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) result.add(value);
  }
  return result;
}
function normalizeFavoriteActionIds(value, validActionIds) {
  if (!Array.isArray(value)) return [];
  const valid = compiledActionIds(validActionIds);
  const result = [];
  const seen = /* @__PURE__ */ new Set();
  for (const candidate of value) {
    if (typeof candidate !== "string" || !valid.has(candidate) || seen.has(candidate)) continue;
    seen.add(candidate);
    result.push(candidate);
    if (result.length === MAX_FAVORITE_ACTIONS) break;
  }
  return result;
}
var ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function isCanonicalIsoTimestamp(value) {
  if (typeof value !== "string" || !ISO_TIMESTAMP.test(value)) return false;
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === value;
}
function parseIsoTimestamp(value) {
  if (!isCanonicalIsoTimestamp(value)) return null;
  const epoch = Date.parse(value);
  return { value, epoch };
}
function normalizeRecentActions(value, validActionIds) {
  if (!Array.isArray(value)) return [];
  const valid = compiledActionIds(validActionIds);
  const records = [];
  for (const [sourceIndex, candidate] of value.entries()) {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) continue;
    const record = candidate;
    if (typeof record.actionId !== "string" || !valid.has(record.actionId)) continue;
    if (typeof record.success !== "boolean") continue;
    const timestamp = parseIsoTimestamp(record.timestamp);
    if (!timestamp) continue;
    records.push({
      actionId: record.actionId,
      success: record.success,
      timestamp: timestamp.value,
      epoch: timestamp.epoch,
      sourceIndex
    });
  }
  records.sort((left, right) => right.epoch - left.epoch || left.sourceIndex - right.sourceIndex);
  return records.slice(0, MAX_RECENT_ACTIONS).map(({ actionId, success, timestamp }) => ({
    actionId,
    success,
    timestamp
  }));
}
var RouteHistory = class {
  constructor(initialRoute = "home", capacity = 50) {
    this.capacity = capacity;
    if (!isPrimaryRoute(initialRoute)) throw new Error("Route history requires a compiled initial route.");
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 100) {
      throw new Error("Route history capacity must be an integer from 2 through 100.");
    }
    this.entries = [initialRoute];
  }
  entries;
  cursor = 0;
  /** The route currently selected by the history cursor. */
  get current() {
    return this.entries[this.cursor] ?? "home";
  }
  /** Whether a previous route is available. */
  get canGoBack() {
    return this.cursor > 0;
  }
  /** Whether a later route remains after a backward traversal. */
  get canGoForward() {
    return this.cursor < this.entries.length - 1;
  }
  /** Add a route, discarding forward history and consecutive duplicates. */
  push(route) {
    if (!isPrimaryRoute(route)) throw new Error("Cannot add an uncompiled route to history.");
    if (route === this.current) return this.current;
    this.entries = this.entries.slice(0, this.cursor + 1);
    this.entries.push(route);
    if (this.entries.length > this.capacity) this.entries.splice(0, this.entries.length - this.capacity);
    this.cursor = this.entries.length - 1;
    return this.current;
  }
  /** Traverse one route backward, or return null when already at the beginning. */
  back() {
    if (!this.canGoBack) return null;
    this.cursor -= 1;
    return this.current;
  }
  /** Traverse one route forward, or return null when already at the end. */
  forward() {
    if (!this.canGoForward) return null;
    this.cursor += 1;
    return this.current;
  }
  /** Return a defensive snapshot suitable for tests and non-persistent diagnostics. */
  snapshot() {
    return { entries: [...this.entries], cursor: this.cursor, current: this.current };
  }
};
function searchStateIndex(state) {
  const favoriteIndex = /* @__PURE__ */ new Map();
  for (const [index, id] of (state.favoriteActionIds ?? []).entries()) {
    if (!favoriteIndex.has(id)) favoriteIndex.set(id, index);
  }
  const recentIndex = /* @__PURE__ */ new Map();
  for (const [index, record] of (state.recentActions ?? []).entries()) {
    if (!recentIndex.has(record.actionId)) recentIndex.set(record.actionId, index);
  }
  return { favoriteIndex, recentIndex };
}
function normalizeSearchValue(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function buildActionSearchText(action, state = {}) {
  const values = [
    action.id,
    action.title,
    action.description,
    action.route,
    action.group ?? "",
    action.verb,
    ...(action.keywords ?? []).filter((keyword) => typeof keyword === "string"),
    state.favorite ? "favorite" : "",
    state.recent ? "recent" : ""
  ];
  return normalizeSearchValue(values.join(" "));
}
function fieldScore(field, query, exact, prefix, contains) {
  if (field.length === 0) return 0;
  if (field === query) return exact;
  if (field.startsWith(query)) return prefix;
  if (field.includes(query)) return contains;
  return 0;
}
function tokenScore(action, token) {
  const title = normalizeSearchValue(action.title);
  const id = normalizeSearchValue(action.id);
  const keywords = normalizeSearchValue((action.keywords ?? []).join(" "));
  const route = normalizeSearchValue(action.route);
  const verb = normalizeSearchValue(action.verb);
  const group = normalizeSearchValue(action.group ?? "");
  const description = normalizeSearchValue(action.description);
  return Math.max(
    fieldScore(title, token, 220, 190, 150),
    fieldScore(id, token, 210, 180, 140),
    fieldScore(keywords, token, 180, 150, 120),
    fieldScore(route, token, 130, 110, 90),
    fieldScore(verb, token, 130, 110, 90),
    fieldScore(group, token, 100, 80, 60),
    fieldScore(description, token, 70, 50, 30)
  );
}
function rankOne(action, query, state) {
  const favoriteIndex = state.favoriteIndex.get(action.id);
  const recentIndex = state.recentIndex.get(action.id);
  const favorite = favoriteIndex !== void 0;
  const recent = recentIndex !== void 0;
  const normalizedQuery = normalizeSearchValue(query);
  if (normalizedQuery.length === 0) {
    const score2 = favorite ? 3e4 - favoriteIndex * 100 + (recent ? Math.max(1, 20 - recentIndex) : 0) : recent ? 2e4 - recentIndex * 100 : 0;
    return { action, score: score2, favorite, recent };
  }
  const searchText = buildActionSearchText(action, { favorite, recent });
  const tokens = [...new Set(normalizedQuery.split(" "))];
  if (tokens.some((token) => !searchText.includes(token))) return null;
  const title = normalizeSearchValue(action.title);
  const id = normalizeSearchValue(action.id);
  let score = fieldScore(title, normalizedQuery, 2e3, 1700, 1300);
  score = Math.max(score, fieldScore(id, normalizedQuery, 1900, 1600, 1200));
  score += tokens.reduce((total, token) => total + tokenScore(action, token), 0);
  if (favorite) score += Math.max(1, 40 - favoriteIndex);
  if (recent) score += Math.max(1, 20 - recentIndex);
  return { action, score, favorite, recent };
}
function compareStableText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}
function rankActionsForSearch(actions, query, state = {}) {
  const index = searchStateIndex(state);
  const ranked = actions.flatMap((action, sourceIndex) => {
    const result = rankOne(action, query, index);
    return result ? [{ ...result, sourceIndex }] : [];
  });
  ranked.sort(
    (left, right) => right.score - left.score || compareStableText(normalizeSearchValue(left.action.title), normalizeSearchValue(right.action.title)) || compareStableText(left.action.id, right.action.id) || left.sourceIndex - right.sourceIndex
  );
  return ranked.map(({ sourceIndex: _sourceIndex, ...result }) => result);
}

// src/actions.ts
var BASE_CONTROL_ACTIONS = [
  {
    id: "open-control-plane",
    title: "Control Plane",
    description: "Open the live HTML campaign console.",
    group: "Live operations",
    icon: "radar",
    kind: "view",
    protocolSafe: true
  },
  {
    id: "open-command-search",
    title: "Command Search",
    description: "Search every compiled control-plane action with availability, favorites, and recent context.",
    group: "Applications",
    icon: "search",
    kind: "view",
    target: "command-search"
  },
  {
    id: "open-live-edge-router",
    title: "Live Edge Router",
    description: "Open the truth-aware router without inferring a next session.",
    group: "Live operations",
    icon: "waypoints",
    kind: "view",
    target: "live-edge",
    protocolSafe: true
  },
  {
    id: "open-dm-control-deck",
    title: "DM Control Deck",
    description: "Open the vault's canonical operations front door.",
    group: "Live operations",
    icon: "layout-dashboard",
    kind: "note",
    target: VAULT_PATHS.dmControlDeck,
    protocolSafe: true
  },
  {
    id: "open-current-state",
    title: "Current State",
    description: "Open the live factual handoff and unresolved boundaries.",
    group: "Live operations",
    icon: "activity",
    kind: "note",
    target: VAULT_PATHS.currentState,
    protocolSafe: true
  },
  {
    id: "open-current-leads",
    title: "Current Leads",
    description: "Open the player-owned deployment menu.",
    group: "Live operations",
    icon: "route",
    kind: "note",
    target: VAULT_PATHS.currentLeads,
    protocolSafe: true
  },
  {
    id: "open-latest-played",
    title: "Latest Played Record",
    description: "Resolve the latest played journal from current-state frontmatter.",
    group: "Live operations",
    icon: "history",
    kind: "dynamic-note",
    target: "latest-played",
    protocolSafe: true
  },
  {
    id: "open-next-session-control",
    title: "Next Session Control",
    description: "Open the declared next-session room only when one exists.",
    group: "Live operations",
    icon: "panel-top-open",
    kind: "dynamic-note",
    target: "next-session",
    protocolSafe: true
  },
  {
    id: "open-campaign-ledger",
    title: "Campaign State Ledger",
    description: "Open evidence-backed state deltas and uncertainty records.",
    group: "Live operations",
    icon: "notebook-tabs",
    kind: "note",
    target: VAULT_PATHS.campaignLedger,
    protocolSafe: true
  },
  {
    id: "open-combat-dashboard",
    title: "Combat Dashboard",
    description: "Open the fail-closed combat readiness surface.",
    group: "Live operations",
    icon: "swords",
    kind: "note",
    target: VAULT_PATHS.combatDashboard,
    protocolSafe: true
  },
  {
    id: "open-initiative-tracker",
    title: "Initiative Tracker",
    description: "Open the installed encounter tracker view.",
    group: "Live operations",
    icon: "list-ordered",
    kind: "command",
    target: "initiative-tracker:open-tracker",
    protocolSafe: true
  },
  {
    id: "open-dice-tray",
    title: "Dice Tray",
    description: "Open the installed Dice Roller view.",
    group: "Live operations",
    icon: "dices",
    kind: "command",
    target: "obsidian-dice-roller:open-view",
    protocolSafe: true
  },
  {
    id: "create-managed-note",
    title: "Create Managed Note",
    description: "Create a schema-validated draft through a reviewed proposal.",
    group: "Creation and session",
    icon: "file-plus-2",
    kind: "workflow"
  },
  {
    id: "capture-quick-inbox",
    title: "Quick Capture",
    description: "Append one timestamped candidate to the operations inbox.",
    group: "Creation and session",
    icon: "inbox",
    kind: "workflow"
  },
  {
    id: "set-active-session-room",
    title: "Select Active Session Room",
    description: "Select an explicit working room without changing next_session or canon.",
    group: "Creation and session",
    icon: "folder-key",
    kind: "workflow"
  },
  {
    id: "open-active-session-control",
    title: "Active Session Control",
    description: "Open the explicitly selected room's control surface.",
    group: "Creation and session",
    icon: "panel-top-open",
    kind: "dynamic-note",
    target: "active-session-control",
    protocolSafe: true
  },
  {
    id: "scaffold-active-session-room",
    title: "Scaffold Session Room",
    description: "Preview and create the seven draft operating notes for the explicit room.",
    group: "Creation and session",
    icon: "folder-cog",
    kind: "workflow"
  },
  {
    id: "open-session-preflight",
    title: "Session Preflight",
    description: "Open the selected room's safety, access, rules, and readiness checklist.",
    group: "Creation and session",
    icon: "list-checks",
    kind: "dynamic-note",
    target: "active-session-preflight",
    protocolSafe: true
  },
  {
    id: "capture-player-declaration",
    title: "Record Player Declaration",
    description: "Append verbatim player wording as review-gated evidence.",
    group: "Creation and session",
    icon: "message-square-quote",
    kind: "workflow"
  },
  {
    id: "generate-session-run",
    title: "Generate Draft RUN",
    description: "Create conditional prep only after exactly one supported selection authority validates.",
    group: "Creation and session",
    icon: "file-lock-2",
    kind: "workflow"
  },
  {
    id: "open-session-readiness",
    title: "Session Readiness",
    description: "Open the active room's fail-closed readiness board.",
    group: "Creation and session",
    icon: "shield-check",
    kind: "dynamic-note",
    target: "active-session-readiness",
    protocolSafe: true
  },
  {
    id: "capture-live-event",
    title: "Capture Live Event",
    description: "Append a sourced confirmed, contested, or unknown event candidate.",
    group: "Creation and session",
    icon: "radio-tower",
    kind: "workflow"
  },
  {
    id: "open-promotion-review",
    title: "Promotion Review",
    description: "Open the human-only evidence and canon-promotion gate.",
    group: "Creation and session",
    icon: "git-pull-request-draft",
    kind: "dynamic-note",
    target: "active-session-review",
    protocolSafe: true
  },
  {
    id: "propose-local-transcription",
    title: "Propose Local Transcription",
    description: "Create a consent receipt for an explicitly selected vault audio file; does not run transcription.",
    group: "Creation and session",
    icon: "audio-lines",
    kind: "workflow"
  },
  {
    id: "start-audio-recorder",
    title: "Start Audio Recorder",
    description: "Start Obsidian's local audio recorder after confirming table consent and storage readiness.",
    group: "Creation and session",
    icon: "mic",
    kind: "command",
    target: "audio-recorder:start",
    confirm: "Start Obsidian Audio Recorder? Confirm table consent and recording storage before continuing."
  },
  {
    id: "open-sessions-base",
    title: "Sessions Database",
    description: "Open the native Bases index for session records.",
    group: "Creation and session",
    icon: "table-properties",
    kind: "note",
    target: VAULT_PATHS.sessionsBase,
    protocolSafe: true
  },
  {
    id: "open-ai-context-policy",
    title: "AI Context Policy",
    description: "Open guarded context configurations and proposal-only boundaries.",
    group: "AI and governance",
    icon: "brain-circuit",
    kind: "view",
    target: "ai-policy",
    protocolSafe: true
  },
  {
    id: "open-operations-health",
    title: "Runtime & Tool Health",
    description: "Open runtime capabilities, workflow gates, and recent transaction status.",
    group: "AI and governance",
    icon: "heart-pulse",
    kind: "view",
    target: "operations-health",
    protocolSafe: true
  },
  {
    id: "open-campaign-board",
    title: "Campaign Board",
    description: "Open open-world deployments without promoting future prep.",
    group: "World and maps",
    icon: "network",
    kind: "note",
    target: VAULT_PATHS.campaignBoard,
    protocolSafe: true
  },
  {
    id: "open-entity-navigator",
    title: "Entity Navigator",
    description: "Search fixed NPC, location, faction, item, and session roots from cached frontmatter.",
    group: "World and maps",
    icon: "list-filter",
    kind: "view",
    target: "entity-navigator",
    protocolSafe: true
  },
  {
    id: "open-faction-fronts",
    title: "Faction Fronts",
    description: "Open faction pressures and clocks.",
    group: "World and maps",
    icon: "git-branch",
    kind: "note",
    target: VAULT_PATHS.factionFronts,
    protocolSafe: true
  },
  {
    id: "open-npc-reference",
    title: "NPC Reference",
    description: "Open the fast NPC lookup surface.",
    group: "World and maps",
    icon: "contact-round",
    kind: "note",
    target: VAULT_PATHS.npcReference,
    protocolSafe: true
  },
  {
    id: "open-npcs-base",
    title: "NPC Database",
    description: "Open the native Bases index for NPC records.",
    group: "World and maps",
    icon: "contact-round",
    kind: "note",
    target: VAULT_PATHS.npcBase,
    protocolSafe: true
  },
  {
    id: "open-locations-base",
    title: "Location Database",
    description: "Open the native Bases index for location records.",
    group: "World and maps",
    icon: "map-pin",
    kind: "note",
    target: VAULT_PATHS.locationBase,
    protocolSafe: true
  },
  {
    id: "open-map-registry",
    title: "Map Bundle Registry",
    description: "Open readiness gates and approved map bundles.",
    group: "World and maps",
    icon: "map",
    kind: "note",
    target: VAULT_PATHS.mapRegistry,
    protocolSafe: true
  },
  {
    id: "open-player-portal",
    title: "Player Portal",
    description: "Open the player-safe campaign surface.",
    group: "World and maps",
    icon: "door-open",
    kind: "note",
    target: VAULT_PATHS.playerPortal,
    protocolSafe: true
  },
  {
    id: "open-veiled-map",
    title: "Veiled Chicago Map",
    description: "Open the local map app in its Custom Frame or browser fallback.",
    group: "Applications",
    icon: "map-pinned",
    kind: "integration",
    target: "obsidian-custom-frames:open-custom-frames-veiled-chicago-map",
    fallback: "map-url",
    desktopOnly: true,
    protocolSafe: true
  },
  {
    id: "open-quick-switcher",
    title: "Quick Switcher",
    description: "Open Obsidian's native file and command navigator.",
    group: "Applications",
    icon: "search",
    kind: "command",
    target: "switcher:open",
    protocolSafe: true
  },
  {
    id: "open-omnisearch",
    title: "Omnisearch",
    description: "Search indexed note bodies with the installed local-only Omnisearch view.",
    group: "Applications",
    icon: "scan-search",
    kind: "command",
    target: "omnisearch:show-modal",
    protocolSafe: true
  },
  {
    id: "open-bookmarks",
    title: "Bookmarks",
    description: "Open Obsidian's native bookmarks view.",
    group: "Applications",
    icon: "bookmark",
    kind: "command",
    target: "bookmarks:open",
    protocolSafe: true
  },
  {
    id: "open-workspaces",
    title: "Workspaces",
    description: "Open Obsidian's native workspace manager.",
    group: "Applications",
    icon: "panels-top-left",
    kind: "command",
    target: "workspaces:open-modal",
    protocolSafe: true
  },
  {
    id: "save-workspace",
    title: "Save Workspace",
    description: "Capture the current Obsidian layout with the native Workspaces command.",
    group: "Applications",
    icon: "save",
    kind: "command",
    target: "workspaces:save"
  },
  {
    id: "open-5etools",
    title: "5eTools",
    description: "Open the configured 5eTools Custom Frame.",
    group: "Applications",
    icon: "book-open-text",
    kind: "command",
    target: "obsidian-custom-frames:open-custom-frames-5etools",
    protocolSafe: true
  },
  {
    id: "open-kobold-club",
    title: "Kobold+ Fight Club",
    description: "Open the configured encounter builder Custom Frame.",
    group: "Applications",
    icon: "shield-plus",
    kind: "command",
    target: "obsidian-custom-frames:open-custom-frames-kobold+-fight-club",
    protocolSafe: true
  },
  {
    id: "open-terminal",
    title: "Lean Terminal",
    description: "Open an embedded terminal rooted in the vault.",
    group: "Applications",
    icon: "terminal-square",
    kind: "command",
    target: "lean-terminal:open-terminal",
    desktopOnly: true,
    protocolSafe: false
  },
  {
    id: "open-quick-search",
    title: "Quick Search",
    description: "Open the vault's campaign search console.",
    group: "Applications",
    icon: "search-code",
    kind: "note",
    target: VAULT_PATHS.quickSearch,
    protocolSafe: true
  },
  {
    id: "open-vault-health",
    title: "Vault Content Health",
    description: "Open the human-readable vault content and metadata health dashboard.",
    group: "Automation",
    icon: "heart-pulse",
    kind: "note",
    target: VAULT_PATHS.vaultHealth,
    protocolSafe: true
  },
  {
    id: "open-review-queue-base",
    title: "Operational Review Queue",
    description: "Open the native Bases queue for review-gated operational proposals.",
    group: "Automation",
    icon: "list-checks",
    kind: "note",
    target: VAULT_PATHS.reviewQueueBase,
    protocolSafe: true
  },
  {
    id: "run-live-edge-audit",
    title: "Audit Live Edge",
    description: "Check played truth, player-owned deployment, and future-script leaks.",
    group: "Automation",
    icon: "scan-search",
    kind: "script",
    scriptId: "live-edge",
    desktopOnly: true
  },
  {
    id: "run-navigation-audit",
    title: "Audit Navigation",
    description: "Validate required hubs and operational routes.",
    group: "Automation",
    icon: "signpost",
    kind: "script",
    scriptId: "navigation",
    desktopOnly: true
  },
  {
    id: "run-link-audit",
    title: "Audit Live Links",
    description: "Run the strict live-scope link verifier.",
    group: "Automation",
    icon: "link-2",
    kind: "script",
    scriptId: "links-live",
    desktopOnly: true
  },
  {
    id: "run-frontmatter-audit",
    title: "Audit Frontmatter",
    description: "Run strict live-scope metadata validation.",
    group: "Automation",
    icon: "braces",
    kind: "script",
    scriptId: "frontmatter-live",
    desktopOnly: true
  },
  {
    id: "run-css-audit",
    title: "Audit CSS System",
    description: "Parse every theme, snippet, and control-plane stylesheet.",
    group: "Automation",
    icon: "paintbrush",
    kind: "script",
    scriptId: "css-audit",
    desktopOnly: true
  },
  {
    id: "check-map-server",
    title: "Map Server Status",
    description: "Check the locally managed map process and port.",
    group: "Automation",
    icon: "server-cog",
    kind: "script",
    scriptId: "map-status",
    desktopOnly: true
  },
  {
    id: "start-map-server",
    title: "Start Map Server",
    description: "Start the reviewed local Vite map app on loopback only.",
    group: "Automation",
    icon: "play",
    kind: "script",
    scriptId: "map-start",
    confirm: "Start the local Veiled Chicago map server on 127.0.0.1:5173?",
    desktopOnly: true
  },
  {
    id: "stop-map-server",
    title: "Stop Map Server",
    description: "Stop only the map process recorded by the control wrapper.",
    group: "Automation",
    icon: "square",
    kind: "script",
    scriptId: "map-stop",
    confirm: "Stop the locally managed Veiled Chicago map server?",
    desktopOnly: true
  }
];
var ACTION_NAVIGATION = {
  "open-control-plane": { route: "home", verb: "OPEN", keywords: ["dashboard", "console", "app"] },
  "open-command-search": { route: "tools", verb: "OPEN", keywords: ["palette", "launcher", "find action"] },
  "open-live-edge-router": { route: "home", verb: "OPEN", keywords: ["truth", "observed", "handoff"] },
  "open-dm-control-deck": { route: "home", verb: "OPEN", keywords: ["front door", "operations"] },
  "open-current-state": { route: "home", verb: "OPEN", keywords: ["truth", "chronology", "handoff"] },
  "open-current-leads": { route: "home", verb: "OPEN", keywords: ["player choice", "deployment"] },
  "open-latest-played": { route: "home", verb: "OPEN", keywords: ["journal", "played", "session"] },
  "open-next-session-control": { route: "session", verb: "OPEN", keywords: ["declared", "control room"] },
  "open-campaign-ledger": { route: "home", verb: "OPEN", keywords: ["evidence", "deltas", "uncertainty"] },
  "open-combat-dashboard": { route: "session", verb: "OPEN", keywords: ["encounter", "readiness"] },
  "open-initiative-tracker": { route: "tools", verb: "OPEN", keywords: ["combat", "encounter"] },
  "open-dice-tray": { route: "tools", verb: "OPEN", keywords: ["roll", "tabletop"] },
  "create-managed-note": { route: "create", verb: "CREATE", keywords: ["schema", "draft", "entity"] },
  "capture-quick-inbox": { route: "create", verb: "CAPTURE", keywords: ["inbox", "intake", "idea"] },
  "set-active-session-room": { route: "session", verb: "SELECT", keywords: ["explicit", "working room"] },
  "open-active-session-control": { route: "session", verb: "OPEN", keywords: ["selected room", "control"] },
  "scaffold-active-session-room": { route: "session", verb: "CREATE", keywords: ["draft", "operating notes"] },
  "open-session-preflight": { route: "session", verb: "REVIEW", keywords: ["safety", "access", "readiness"] },
  "capture-player-declaration": { route: "session", verb: "CAPTURE", keywords: ["verbatim", "choice", "evidence"] },
  "generate-session-run": {
    route: "session",
    verb: "CREATE",
    keywords: ["conditional prep", "selection evidence", "declaration", "dm handoff"]
  },
  "open-session-readiness": { route: "session", verb: "REVIEW", keywords: ["fail closed", "board"] },
  "capture-live-event": { route: "session", verb: "CAPTURE", keywords: ["table log", "confirmed", "contested"] },
  "open-promotion-review": { route: "session", verb: "REVIEW", keywords: ["canon", "evidence", "gate"] },
  "propose-local-transcription": { route: "create", verb: "CREATE", keywords: ["audio", "consent", "receipt"] },
  "start-audio-recorder": { route: "session", verb: "START", keywords: ["record", "microphone", "consent"] },
  "open-sessions-base": { route: "session", verb: "OPEN", keywords: ["database", "base", "records"] },
  "open-ai-context-policy": { route: "system", verb: "REVIEW", keywords: ["guardrails", "retrieval", "local ai"] },
  "open-operations-health": { route: "system", verb: "REVIEW", keywords: ["capabilities", "gates", "status"] },
  "open-campaign-board": { route: "world", verb: "OPEN", keywords: ["open world", "deployments"] },
  "open-entity-navigator": { route: "world", verb: "OPEN", keywords: ["facets", "npc", "location", "faction", "item"] },
  "open-faction-fronts": { route: "world", verb: "OPEN", keywords: ["clocks", "pressures"] },
  "open-npc-reference": { route: "world", verb: "OPEN", keywords: ["people", "lookup"] },
  "open-npcs-base": { route: "world", verb: "OPEN", keywords: ["database", "base", "people"] },
  "open-locations-base": { route: "world", verb: "OPEN", keywords: ["database", "base", "places"] },
  "open-map-registry": { route: "world", verb: "OPEN", keywords: ["bundles", "readiness", "atlas"] },
  "open-player-portal": { route: "world", verb: "OPEN", keywords: ["player safe", "handout"] },
  "open-veiled-map": { route: "tools", verb: "OPEN", keywords: ["chicago", "custom frame", "vite"] },
  "open-quick-switcher": { route: "tools", verb: "OPEN", keywords: ["native", "files", "navigate"] },
  "open-omnisearch": { route: "tools", verb: "OPEN", keywords: ["full text", "body search", "local index"] },
  "open-bookmarks": { route: "tools", verb: "OPEN", keywords: ["native", "saved links"] },
  "open-workspaces": { route: "tools", verb: "OPEN", keywords: ["native", "layout", "panes"] },
  "save-workspace": { route: "tools", verb: "CAPTURE", keywords: ["native", "layout", "snapshot"] },
  "open-5etools": { route: "tools", verb: "OPEN", keywords: ["rules", "reference", "custom frame"] },
  "open-kobold-club": { route: "tools", verb: "OPEN", keywords: ["encounter", "builder"] },
  "open-terminal": { route: "tools", verb: "OPEN", keywords: ["lean terminal", "shell", "embedded"] },
  "open-quick-search": { route: "tools", verb: "OPEN", keywords: ["campaign", "lookup"] },
  "open-vault-health": { route: "system", verb: "REVIEW", keywords: ["dashboard", "validation"] },
  "open-review-queue-base": { route: "system", verb: "REVIEW", keywords: ["database", "base", "proposals"] },
  "run-live-edge-audit": { route: "system", verb: "RUN", keywords: ["truth", "canon", "future leaks"] },
  "run-navigation-audit": { route: "system", verb: "RUN", keywords: ["routes", "hubs"] },
  "run-link-audit": { route: "system", verb: "RUN", keywords: ["links", "broken"] },
  "run-frontmatter-audit": { route: "system", verb: "RUN", keywords: ["metadata", "schema"] },
  "run-css-audit": { route: "system", verb: "RUN", keywords: ["theme", "snippets", "styles"] },
  "check-map-server": { route: "system", verb: "RUN", keywords: ["process", "port", "status"] },
  "start-map-server": { route: "system", verb: "START", keywords: ["process", "vite", "loopback"] },
  "stop-map-server": { route: "system", verb: "STOP", keywords: ["process", "vite", "loopback"] }
};
var CONTROL_ACTIONS = BASE_CONTROL_ACTIONS.map((action) => ({
  ...action,
  ...ACTION_NAVIGATION[action.id]
}));
validateActionNavigation(CONTROL_ACTIONS);
var ACTION_BY_ID = new Map(CONTROL_ACTIONS.map((action) => [action.id, action]));
var CONTROL_BLOCK_KEYS = /* @__PURE__ */ new Set(["title", "subtitle", "actions", "compact"]);
function parseControlBlock(source) {
  const values = /* @__PURE__ */ new Map();
  for (const [index, rawLine] of source.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator < 1) throw new Error(`Line ${index + 1} must use key: value syntax.`);
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (!CONTROL_BLOCK_KEYS.has(key)) throw new Error(`Unsupported key on line ${index + 1}: ${key}`);
    if (values.has(key)) throw new Error(`Duplicate key on line ${index + 1}: ${key}`);
    values.set(key, value);
  }
  const actionIds = (values.get("actions") ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  if (actionIds.length === 0) throw new Error("At least one allowlisted action is required.");
  const unknown = actionIds.filter((id) => !ACTION_BY_ID.has(id));
  if (unknown.length > 0) throw new Error(`Unknown action: ${unknown.join(", ")}`);
  return {
    title: values.get("title") || "Veiled Chicago controls",
    subtitle: values.get("subtitle") || "Allowlisted vault actions",
    actions: [...new Set(actionIds)],
    compact: /^(?:true|yes|1)$/i.test(values.get("compact") ?? "false")
  };
}
var MANAGED_PROFILE_CLASSES = [
  "vcg-dashboard",
  "vcg-session",
  "vcg-dossier",
  "vcg-data-deck",
  "vcg-map-room",
  "vcg-handout"
];
function profilesForPath(path, frontmatter2 = {}) {
  const result = /* @__PURE__ */ new Set();
  const normalized = path.toLowerCase();
  const basename = normalized.split("/").pop() ?? normalized;
  const audience = String(frontmatter2.audience ?? "").toLowerCase();
  if (normalized.startsWith(`${VAULT_PATHS.dmRoot.toLowerCase()}/`) || normalized === VAULT_PATHS.currentLeads.toLowerCase() || /(?:dashboard|control|board|portal|quick search)/.test(basename)) {
    result.add("vcg-dashboard");
  }
  if (normalized.startsWith(`${VAULT_PATHS.sessionsRoot.toLowerCase()}/`) && /(?:control room|table log|quick sheet|full prep| run )/.test(` ${basename} `)) {
    result.add("vcg-session");
  }
  if (/(?:\/people\/|\/factions\/|\/places\/|\/items\/)/.test(normalized) || /(?:dossier|profile)/.test(basename)) {
    result.add("vcg-dossier");
  }
  if (/(?:dashboard|ledger|registry|index|matrix|catalog|inventory|reference)/.test(basename)) {
    result.add("vcg-data-deck");
  }
  if (/(?:\/maps\/|\/map bundles\/)/.test(normalized) || /(?:map room|map index|atlas)/.test(basename)) {
    result.add("vcg-map-room");
  }
  if (["player", "players"].includes(audience) || normalized === VAULT_PATHS.playerPortal.toLowerCase() || /(?:handout|player portal)/.test(basename)) {
    result.add("vcg-handout");
  }
  return [...result];
}

// src/command-search.ts
var import_obsidian = require("obsidian");
var ControlActionSearchModal = class extends import_obsidian.FuzzySuggestModal {
  constructor(app, options) {
    super(app);
    this.options = options;
    this.favorites = new Set(options.favoriteActionIds);
    this.recents = new Set(options.recentActions.map((record) => record.actionId));
    this.setPlaceholder("Search control-plane actions\u2026");
    this.setInstructions([
      { command: "\u2191\u2193", purpose: "navigate" },
      { command: "\u21B5", purpose: "run available action" },
      { command: "esc", purpose: "close" }
    ]);
  }
  favorites;
  recents;
  choseAction = false;
  onOpen() {
    super.onOpen();
    this.modalEl.addClass("vc-control-command-modal");
    this.inputEl.setAttr("aria-label", "Search control-plane actions");
  }
  getItems() {
    return rankActionsForSearch(this.options.actions, "", {
      favoriteActionIds: this.options.favoriteActionIds,
      recentActions: this.options.recentActions
    }).map(({ action }) => action);
  }
  getItemText(action) {
    return buildActionSearchText(action, {
      favorite: this.favorites.has(action.id),
      recent: this.recents.has(action.id)
    });
  }
  renderSuggestion({ item: action }, element) {
    const availability = this.options.getAvailability(action);
    element.addClass("vc-control-command-result");
    element.toggleClass("is-unavailable", !availability.available);
    element.setAttr("aria-disabled", String(!availability.available));
    const header = element.createDiv({ cls: "vc-control-command-result-header" });
    header.createEl("strong", { text: action.title });
    header.createSpan({ cls: "vc-control-command-result-verb", text: action.verb });
    const meta = element.createDiv({ cls: "vc-control-command-result-meta" });
    meta.createSpan({ text: action.route.toUpperCase() });
    if (this.favorites.has(action.id)) meta.createSpan({ text: "FAVORITE" });
    if (this.recents.has(action.id)) meta.createSpan({ text: "RECENT" });
    element.createEl("small", {
      cls: "vc-control-command-result-description",
      text: availability.reason ?? action.description
    });
  }
  onChooseItem(action) {
    const availability = this.options.getAvailability(action);
    if (!availability.available) {
      this.options.onUnavailable(action, availability.reason ?? `${action.title} is unavailable.`);
      return;
    }
    this.choseAction = true;
    this.options.onChoose(action);
  }
  onClose() {
    super.onClose();
    this.options.onDismiss();
    if (!this.choseAction && this.options.opener?.isConnected) {
      window.setTimeout(() => this.options.opener?.focus({ preventScroll: true }), 0);
    }
  }
};

// src/capabilities.ts
var INTERFACE_CAPABILITIES = [
  {
    id: "workflow-authority",
    capability: "Campaign workflow and reviewed creation",
    owner: "Veiled Chicago Control Plane",
    boundary: "Sole mutation authority; note content cannot add actions.",
    builtIn: true
  },
  {
    id: "context-toolbar",
    capability: "Contextual note controls",
    owner: "Note Toolbar",
    boundary: "Fixed command and file launchers only; no script items.",
    pluginIds: ["note-toolbar"]
  },
  {
    id: "body-search",
    capability: "Local full-text retrieval",
    owner: "Omnisearch",
    boundary: "Read-only local index; optional HTTP server is outside this plugin.",
    pluginIds: ["omnisearch"],
    commandIds: ["omnisearch:show-modal"]
  },
  {
    id: "filename-navigation",
    capability: "Filename navigation and saved routes",
    owner: "Obsidian Quick Switcher, Bookmarks, and Workspaces",
    boundary: "Native navigation only; no workflow writes.",
    commandIds: ["switcher:open", "bookmarks:open", "workspaces:open-modal"]
  },
  {
    id: "structured-indexes",
    capability: "Structured indexes",
    owner: "Obsidian Bases and Dataview",
    boundary: "Bases-first for new indexes; no bulk query migration.",
    pluginIds: ["dataview"]
  },
  {
    id: "world-maps",
    capability: "World maps and local map application",
    owner: "Leaflet and Custom Frames",
    boundary: "Existing map corpus and fixed frame commands; no inferred geography.",
    pluginIds: ["obsidian-leaflet-plugin", "obsidian-custom-frames"]
  },
  {
    id: "tabletop-runtime",
    capability: "Tabletop runtime",
    owner: "Dice Roller, Fantasy Statblocks, Initiative Tracker, and D&D UI Toolkit",
    boundary: "Retained until contract-equivalent first-party migrations exist.",
    pluginIds: ["obsidian-dice-roller", "obsidian-5e-statblocks", "initiative-tracker", "dnd-ui-toolkit"]
  },
  {
    id: "managed-interactions",
    capability: "Managed note interactions",
    owner: "Meta Bind and Templater",
    boundary: "Retained for existing reviewed bindings; not a second creation authority.",
    pluginIds: ["obsidian-meta-bind-plugin", "templater-obsidian"]
  },
  {
    id: "local-operations",
    capability: "Local operations bridge",
    owner: "Lean Terminal and Local REST API",
    boundary: "Local, explicit adapters; credentials and listeners remain externally managed.",
    pluginIds: ["lean-terminal", "obsidian-local-rest-api"]
  },
  {
    id: "presentation-policy",
    capability: "Presentation and view-mode policy",
    owner: "Style Settings and Force View Mode",
    boundary: "Presentation only; never an audience or access-control boundary.",
    pluginIds: ["obsidian-style-settings", "obsidian-view-mode-by-frontmatter"]
  }
];
function capabilityRuntimeStatus(definition, probe) {
  const checks = [
    ...definition.builtIn ? [{ id: "built-in", available: true }] : [],
    ...(definition.pluginIds ?? []).map((id) => ({ id, available: probe.pluginEnabled(id) })),
    ...(definition.commandIds ?? []).map((id) => ({ id, available: probe.commandAvailable(id) }))
  ];
  const available = checks.filter((check) => check.available).length;
  const missing = checks.filter((check) => !check.available).map((check) => check.id);
  const required = checks.length;
  const state = available === required ? "available" : available === 0 ? "unavailable" : "partial";
  return { state, available, required, missing };
}

// src/entity-navigator.ts
var ENTITY_RESULT_LIMIT = 100;
var ENTITY_TYPES = ["npc", "location", "faction", "item", "session"];
var ENTITY_ROOT_REGISTRY = Object.freeze([
  Object.freeze({ type: "npc", root: MANAGED_NOTE_ROOTS.npc, label: "NPCs" }),
  Object.freeze({ type: "location", root: MANAGED_NOTE_ROOTS.location, label: "Locations" }),
  Object.freeze({ type: "faction", root: MANAGED_NOTE_ROOTS.faction, label: "Factions" }),
  Object.freeze({ type: "item", root: MANAGED_NOTE_ROOTS.item, label: "Items" }),
  Object.freeze({ type: "session", root: VAULT_PATHS.sessionsRoot, label: "Sessions" })
]);
var STATUS_FIELDS = {
  npc: ["char_status", "status"],
  location: ["location_status", "status"],
  faction: ["faction_status", "status"],
  item: ["item_status", "status"],
  session: ["session_status", "status"]
};
var TYPE_LABELS = Object.fromEntries(
  ENTITY_ROOT_REGISTRY.map(({ type, label }) => [type, label])
);
function normalizePath(path) {
  const normalized = path.trim();
  if (normalized.length === 0 || normalized.startsWith("/") || normalized.includes("\\") || normalized.includes("\0")) {
    return null;
  }
  const segments = normalized.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) return null;
  if (!normalized.toLowerCase().endsWith(".md")) return null;
  return normalized;
}
function ownMetadata(frontmatter2, key) {
  if (frontmatter2 === null || frontmatter2 === void 0) return void 0;
  return Object.prototype.hasOwnProperty.call(frontmatter2, key) ? frontmatter2[key] : void 0;
}
function normalizeDisplayString(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/gu, " ");
  return normalized.length > 0 ? normalized : null;
}
function collectStrings(value, splitTags) {
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item, splitTags));
  const scalar = normalizeDisplayString(value);
  if (scalar === null) return [];
  if (!splitTags) return [scalar];
  return scalar.split(/[\s,]+/u).map((tag) => tag.replace(/^#+/u, "").trim()).filter((tag) => tag.length > 0);
}
function uniqueStrings(values) {
  const seen = /* @__PURE__ */ new Set();
  const unique = [];
  for (const value of values) {
    const key = normalizeSearchText(value);
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique;
}
function firstMetadataString(frontmatter2, keys) {
  for (const key of keys) {
    const value = normalizeDisplayString(ownMetadata(frontmatter2, key));
    if (value !== null) return value;
  }
  return null;
}
function metadataBadge(frontmatter2, key) {
  const values = uniqueStrings(collectStrings(ownMetadata(frontmatter2, key), false));
  return values.length > 0 ? values.join(", ") : null;
}
function inferredBasename(path) {
  const filename = path.split("/").at(-1) ?? path;
  return filename.replace(/\.md$/iu, "");
}
function normalizeSearchText(value) {
  return value.normalize("NFKC").toLowerCase();
}
function compareText(left, right) {
  const normalizedLeft = normalizeSearchText(left);
  const normalizedRight = normalizeSearchText(right);
  if (normalizedLeft < normalizedRight) return -1;
  if (normalizedLeft > normalizedRight) return 1;
  return left < right ? -1 : left > right ? 1 : 0;
}
function isEntityType(value) {
  return typeof value === "string" && ENTITY_TYPES.includes(value);
}
function deriveEntityType(path) {
  const normalized = normalizePath(path);
  if (normalized === null) return null;
  for (const definition of ENTITY_ROOT_REGISTRY) {
    if (normalized.startsWith(`${definition.root}/`)) return definition.type;
  }
  return null;
}
function buildEntityIndex(files) {
  const entries = /* @__PURE__ */ new Map();
  for (const file of files) {
    const path = normalizePath(file.path);
    if (path === null || entries.has(path)) continue;
    const type = deriveEntityType(path);
    if (type === null) continue;
    const frontmatter2 = file.frontmatter;
    const basename = normalizeDisplayString(file.basename) ?? inferredBasename(path);
    const title = firstMetadataString(frontmatter2, ["title"]) ?? basename;
    const aliases = uniqueStrings([
      ...collectStrings(ownMetadata(frontmatter2, "aliases"), false),
      ...collectStrings(ownMetadata(frontmatter2, "alias"), false)
    ]);
    const tags = uniqueStrings([
      ...collectStrings(ownMetadata(frontmatter2, "tags"), true),
      ...collectStrings(ownMetadata(frontmatter2, "tag"), true)
    ]);
    entries.set(path, {
      path,
      basename,
      title,
      type,
      aliases,
      tags,
      status: firstMetadataString(frontmatter2, STATUS_FIELDS[type]),
      audience: metadataBadge(frontmatter2, "audience"),
      canonStatus: metadataBadge(frontmatter2, "canon_status")
    });
  }
  return [...entries.values()].sort(
    (left, right) => compareText(left.title, right.title) || compareText(left.path, right.path)
  );
}
function entitySearchText(entry) {
  return normalizeSearchText(
    [
      entry.title,
      entry.basename,
      ...entry.aliases,
      ...entry.tags.flatMap((tag) => [tag, `#${tag}`]),
      entry.status ?? "",
      entry.path
    ].join("\n")
  );
}
function queryTerms(query) {
  if (query === void 0) return [];
  return uniqueStrings(
    normalizeSearchText(query).split(/\s+/u).map((term) => term.trim()).filter((term) => term.length > 0)
  );
}
function matchesQuery(entry, terms) {
  if (terms.length === 0) return true;
  const searchText = entitySearchText(entry);
  return terms.every((term) => searchText.includes(term));
}
function facetsFor(entries) {
  const typeCounts = new Map(ENTITY_TYPES.map((type) => [type, 0]));
  const statusCounts = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    typeCounts.set(entry.type, (typeCounts.get(entry.type) ?? 0) + 1);
    if (entry.status === null) continue;
    const key = normalizeSearchText(entry.status);
    const current = statusCounts.get(key);
    statusCounts.set(key, {
      label: current === void 0 || compareText(entry.status, current.label) < 0 ? entry.status : current.label,
      count: (current?.count ?? 0) + 1
    });
  }
  return {
    types: ENTITY_TYPES.map((type) => ({ value: type, label: TYPE_LABELS[type], count: typeCounts.get(type) ?? 0 })),
    statuses: [...statusCounts.entries()].sort(([left], [right]) => compareText(left, right)).map(([value, { label, count }]) => ({ value, label, count }))
  };
}
function normalizedLimit(limit) {
  if (limit === void 0 || !Number.isFinite(limit)) return ENTITY_RESULT_LIMIT;
  return Math.min(ENTITY_RESULT_LIMIT, Math.max(1, Math.floor(limit)));
}
function filterEntityIndex(index, filters = {}) {
  const terms = queryTerms(filters.query);
  const queryMatches = index.filter((entry) => matchesQuery(entry, terms));
  const facets = facetsFor(queryMatches);
  const requestedTypes = filters.types ?? [];
  const validTypes = new Set(requestedTypes.filter(isEntityType));
  const invalidTypeFilter = requestedTypes.some((type) => !isEntityType(type));
  const requestedStatuses = filters.statuses ?? [];
  const invalidStatusFilter = requestedStatuses.some(
    (status) => typeof status !== "string" || normalizeSearchText(status.trim()).length === 0
  );
  const validStatuses = new Set(
    requestedStatuses.map((status) => typeof status === "string" ? normalizeSearchText(status.trim()) : "").filter((status) => status.length > 0)
  );
  const matches = invalidTypeFilter || invalidStatusFilter ? [] : queryMatches.filter((entry) => {
    if (validTypes.size > 0 && !validTypes.has(entry.type)) return false;
    if (validStatuses.size > 0 && (entry.status === null || !validStatuses.has(normalizeSearchText(entry.status)))) {
      return false;
    }
    return true;
  });
  const limit = normalizedLimit(filters.limit);
  const items = matches.slice(0, limit);
  return {
    items,
    total: matches.length,
    shown: items.length,
    limit,
    truncated: matches.length > items.length,
    facets
  };
}

// src/operating.ts
var import_node_crypto = require("node:crypto");
var CONTEXT_PROFILES = [
  {
    id: "player-safe",
    title: "Player-safe",
    description: "Player-visible material only; DM and future material are excluded before retrieval.",
    audiences: ["players", "both"],
    retrievalScopes: ["live", "reference", "history"],
    roots: [VAULT_PATHS.partyRoot, VAULT_PATHS.handoutsRoot, VAULT_PATHS.worldRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "session-live",
    title: "Session live",
    description: "Latest played evidence, current choices, active room, and approved rules only.",
    audiences: ["dm", "both"],
    retrievalScopes: ["live", "reference"],
    roots: [VAULT_PATHS.sessionsRoot, VAULT_PATHS.partyRoot, VAULT_PATHS.dmRoot, VAULT_PATHS.mechanicsRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "canon-read",
    title: "Canon read",
    description: "Read-only canonical owners and played evidence with source citations.",
    audiences: ["dm", "both", "players"],
    retrievalScopes: ["live", "reference", "history"],
    roots: [
      VAULT_PATHS.sessionsRoot,
      VAULT_PATHS.partyRoot,
      VAULT_PATHS.dmRoot,
      VAULT_PATHS.worldRoot,
      VAULT_PATHS.mechanicsRoot
    ],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "conditional-prep",
    title: "Conditional prep",
    description: "Draft, future, and source-library material isolated from played truth.",
    audiences: ["dm"],
    retrievalScopes: ["future", "source-library"],
    roots: [VAULT_PATHS.sessionsRoot, VAULT_PATHS.modulesRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "research-inbox",
    title: "Research inbox",
    description: "Untrusted captured research; citations and prompt-injection boundaries remain visible.",
    audiences: ["dm"],
    retrievalScopes: ["reference", "source-library"],
    roots: [VAULT_PATHS.operationsInboxRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "private-transcript",
    title: "Private transcript",
    description: "Consent-bound raw session evidence; local processing only.",
    audiences: ["dm"],
    retrievalScopes: ["audit"],
    roots: [VAULT_PATHS.sessionsRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  }
];
var CAPABILITY_POLICY = {
  observe: "Read current state and policy-filtered evidence without changing the vault.",
  propose: "Render exact file operations, evidence, and policy checks for human review.",
  execute: "Apply only the reviewed proposal; never expose arbitrary shell, paths, or commands to a model.",
  aiWriteMode: "proposal-only",
  canonPromotion: "human-only"
};
var CAMPAIGN_LINK = "[[a-tale-of-two-cities|A Tale of Two Cities]]";
var MANAGED_NOTE_SCHEMAS = [
  {
    id: "npc",
    title: "NPC dossier",
    description: "Draft NPC candidate with identity and relationship prompts.",
    folder: MANAGED_NOTE_ROOTS.npc,
    tag: "Category/NPC",
    audience: "dm",
    fields: [
      { id: "char_race", label: "Ancestry / nature", required: true, defaultValue: "Unknown" },
      { id: "char_status", label: "Status", required: true, defaultValue: "Unknown" },
      { id: "faction", label: "Faction", required: false }
    ],
    bodyHeading: "Dossier"
  },
  {
    id: "location",
    title: "Location",
    description: "Draft place with district, access, and evidence prompts.",
    folder: MANAGED_NOTE_ROOTS.location,
    tag: "Category/Location",
    audience: "dm",
    fields: [
      { id: "district", label: "District / area", required: false },
      { id: "location_status", label: "Status", required: false, defaultValue: "Unknown" }
    ],
    bodyHeading: "Location brief"
  },
  {
    id: "faction",
    title: "Faction",
    description: "Draft faction with pressure, wants, and relationships.",
    folder: MANAGED_NOTE_ROOTS.faction,
    tag: "Category/Faction",
    audience: "dm",
    fields: [{ id: "faction_status", label: "Status", required: false, defaultValue: "Unknown" }],
    bodyHeading: "Faction brief"
  },
  {
    id: "item",
    title: "Item",
    description: "Draft item with provenance and ownership boundaries.",
    folder: MANAGED_NOTE_ROOTS.item,
    tag: "Category/Item",
    audience: "dm",
    fields: [{ id: "item_type", label: "Item type", required: true, defaultValue: "Unknown" }],
    bodyHeading: "Item brief"
  },
  {
    id: "clue",
    title: "Clue candidate",
    description: "Unpromoted clue with source and reveal-state fields.",
    folder: MANAGED_NOTE_ROOTS.clue,
    tag: "Category/Clue",
    audience: "dm",
    fields: [
      { id: "evidence_source", label: "Evidence source", required: true },
      { id: "reveal_state", label: "Reveal state", required: false, defaultValue: "withheld" }
    ],
    bodyHeading: "Clue candidate"
  },
  {
    id: "ruling",
    title: "Ruling candidate",
    description: "Rules question or proposed ruling awaiting source review.",
    folder: MANAGED_NOTE_ROOTS.ruling,
    tag: "Category/Ruling",
    audience: "dm",
    fields: [
      { id: "rules_source", label: "Rules source", required: false },
      { id: "rules_edition", label: "Edition / baseline", required: false }
    ],
    bodyHeading: "Ruling candidate"
  },
  {
    id: "player-knowledge",
    title: "Player knowledge",
    description: "Player-visible knowledge candidate tied to a PC.",
    folder: MANAGED_NOTE_ROOTS.playerKnowledge,
    tag: "Category/Player-Knowledge",
    audience: "players",
    fields: [{ id: "pc", label: "PC", required: true }],
    bodyHeading: "Known information"
  },
  {
    id: "research",
    title: "Research source",
    description: "Untrusted research capture with provenance fields.",
    folder: MANAGED_NOTE_ROOTS.research,
    tag: "Category/Research",
    audience: "dm",
    fields: [
      { id: "source_url", label: "Source URL", required: false },
      { id: "source_author", label: "Author", required: false },
      { id: "retrieved_on", label: "Retrieved on", required: false }
    ],
    bodyHeading: "Research notes"
  },
  {
    id: "correction",
    title: "Continuity correction",
    description: "Append-only correction proposal; never silently rewrites played evidence.",
    folder: MANAGED_NOTE_ROOTS.correction,
    tag: "Category/Correction",
    audience: "dm",
    fields: [
      { id: "evidence_source", label: "Evidence source", required: true },
      { id: "affected_owner", label: "Affected canonical owner", required: false }
    ],
    bodyHeading: "Correction proposal"
  }
];
var DM_LIVE_HANDOFF_DEPLOYMENT_MODE = "dm-selected-from-live-handoff";
var PROTECTED_CANON_PATH_SET = new Set(PROTECTED_CANON_PATHS.map((path) => path.toLocaleLowerCase("en-US")));
var MANAGED_WRITE_ROOTS = ["1-Campaign", "2-World", "3-Library", "9-System"];
var MANAGED_WRITE_EXTENSIONS = /* @__PURE__ */ new Set(["md"]);
function yamlString(value) {
  return JSON.stringify(value);
}
function inlineText(value, label) {
  const normalized = value.replace(/\r?\n/g, " ").trim();
  if (/\p{Cc}/u.test(normalized)) throw new Error(`${label} contains unsupported control characters.`);
  return normalized;
}
function visualColumns(value) {
  let columns = 0;
  for (const character of value) columns = character === "	" ? columns + (4 - columns % 4) : columns + 1;
  return columns;
}
function consumeExactIndent(value, requiredColumns) {
  let columns = 0;
  let index = 0;
  while (index < value.length && columns < requiredColumns) {
    const character = value[index];
    if (character !== " " && character !== "	") return null;
    columns = character === "	" ? columns + (4 - columns % 4) : columns + 1;
    index += 1;
  }
  return columns === requiredColumns ? value.slice(index) : null;
}
function fenceOpening(line) {
  let remainder = line;
  const containers = [];
  while (true) {
    const quote = remainder.match(/^ {0,3}>[ \t]?/);
    if (quote?.[0]) {
      containers.push({ kind: "quote" });
      remainder = remainder.slice(quote[0].length);
      continue;
    }
    const list = remainder.match(/^ {0,3}(?:[-+*]|\d{1,9}[.)])(?:[ \t]+|$)/);
    if (list?.[0]) {
      containers.push({ kind: "indent", columns: visualColumns(list[0]) });
      remainder = remainder.slice(list[0].length);
      continue;
    }
    break;
  }
  const opening = remainder.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  const run = opening?.[1];
  const info = opening?.[2] ?? "";
  if (!run || run[0] === "`" && info.includes("`")) return null;
  return { character: run[0], length: run.length, containers };
}
function fenceClosingLine(line, fence) {
  let remainder = line;
  for (const container of fence.containers) {
    if (container.kind === "quote") {
      const quote = remainder.match(/^ {0,3}>[ \t]?/);
      if (!quote?.[0]) return null;
      remainder = remainder.slice(quote[0].length);
      continue;
    }
    const consumed = consumeExactIndent(remainder, container.columns);
    if (consumed === null) return null;
    remainder = consumed;
  }
  return remainder;
}
function declarationMarkerIds(contents) {
  const ids = [];
  let fence = null;
  for (const line of contents.split(/\r?\n/)) {
    if (fence) {
      const candidate = fenceClosingLine(line, fence);
      const closing = candidate?.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      const run = closing?.[1];
      if (run && run[0] === fence.character && run.length >= fence.length) fence = null;
      continue;
    }
    const opening = fenceOpening(line);
    if (opening) {
      fence = opening;
      continue;
    }
    const marker = line.match(
      /^<!--\s*vcg:declaration\s+([A-Za-z0-9][A-Za-z0-9._:-]{0,127})\s*-->[ \t]*$/
    );
    if (marker?.[1]) ids.push(marker[1]);
  }
  return ids;
}
function selectedLeadIdentifier(value) {
  if (typeof value !== "string") {
    throw new Error("DM live-handoff selection requires selected_lead to be one scalar identifier.");
  }
  const selectedLead = value.trim();
  if (!/^[a-z0-9][a-z0-9._:-]{0,159}$/i.test(selectedLead)) {
    throw new Error("DM live-handoff selection requires selected_lead to be one safe scalar identifier.");
  }
  return selectedLead;
}
function strictFrontmatterScalar(contents, key) {
  const lines = contents.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const closingIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (closingIndex < 0) return null;
  const values = lines.slice(1, closingIndex + 1).flatMap((line) => {
    const separator = line.indexOf(":");
    if (separator < 0 || line.slice(0, separator).trim() !== key || /^\s/.test(line)) return [];
    const raw = line.slice(separator + 1).trim();
    if (/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(raw)) return [raw];
    if (raw.startsWith('"') && raw.endsWith('"')) {
      try {
        const parsed = JSON.parse(raw);
        return typeof parsed === "string" ? [parsed] : [];
      } catch {
        return [];
      }
    }
    if (raw.startsWith("'") && raw.endsWith("'")) return [raw.slice(1, -1).replaceAll("''", "'")];
    return [];
  });
  return values.length === 1 ? values[0] ?? null : null;
}
function normalizeNoteTitle(value) {
  const title = inlineText(value, "Title");
  if (!title || !slugify(title)) throw new Error("A title containing letters or numbers is required.");
  if (title.length > 160) throw new Error("Title must be 160 characters or fewer.");
  return title;
}
function frontmatter(entries) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${yamlString(item)}`);
      continue;
    }
    lines.push(`${key}: ${yamlString(value)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}
function slugify(value) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
}
function normalizeVaultPath(value) {
  const normalized = value.trim().replaceAll("\\", "/").replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
  if (!normalized || normalized.includes("\0")) throw new Error("A non-empty vault-relative path is required.");
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Vault paths cannot contain empty, current-directory, or parent-directory segments.");
  }
  if (segments.some((segment) => segment.toLocaleLowerCase("en-US") === ".obsidian")) {
    throw new Error("Managed workflows cannot write inside .obsidian.");
  }
  return normalized;
}
function validateManagedWritePath(value) {
  const path = normalizeVaultPath(value);
  const root = path.split("/", 1)[0];
  if (!root || !MANAGED_WRITE_ROOTS.includes(root)) {
    throw new Error(`Managed writes must remain below ${MANAGED_WRITE_ROOTS.join(", ")}.`);
  }
  const filename = path.split("/").pop() ?? "";
  const extension = filename.includes(".") ? filename.split(".").pop()?.toLocaleLowerCase("en-US") ?? "" : "";
  if (!MANAGED_WRITE_EXTENSIONS.has(extension)) {
    throw new Error(`Managed writes require an allowlisted file extension: .${[...MANAGED_WRITE_EXTENSIONS].join(", .")}.`);
  }
  return path;
}
function normalizeSessionRoomPath(value) {
  const path = normalizeVaultPath(value);
  if (!path.startsWith(`${VAULT_PATHS.sessionsRoot}/`)) {
    throw new Error(`An active session room must live below ${VAULT_PATHS.sessionsRoot}/.`);
  }
  const relative = path.slice(VAULT_PATHS.sessionsRoot.length + 1);
  const segments = relative.toLowerCase().split("/");
  if (segments.some((segment) => segment === "_future-planning" || segment === "_archive")) {
    throw new Error("An archived or future-planning source packet cannot be selected as the active session room.");
  }
  if (relative.includes("/")) throw new Error("An active session room must be a direct child of the Sessions root.");
  return path;
}
function normalizeSessionDisplayName(roomPathValue, value) {
  const roomPath = normalizeSessionRoomPath(roomPathValue);
  const displayName = value.trim();
  if (!displayName || displayName === "." || displayName === ".." || /[/\\\u0000-\u001f\u007f]/.test(displayName)) {
    throw new Error("Session display name must be one safe filename stem.");
  }
  if (displayName.endsWith(".")) throw new Error("Session display name cannot end with a period.");
  const folderName = roomPath.split("/").pop();
  if (displayName !== folderName) {
    throw new Error(`Session display name must match the selected folder name exactly: ${folderName ?? "unknown"}`);
  }
  return displayName;
}
function parseExplicitNextSession(value) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}
function validateControlResult(value, expectedAction) {
  if (!value || typeof value !== "object") throw new Error("Control wrapper returned an invalid payload shape.");
  const result = value;
  if (result.action !== expectedAction) throw new Error("Control wrapper action does not match the requested action.");
  if (typeof result.ok !== "boolean" || typeof result.stdout !== "string" || typeof result.stderr !== "string") {
    throw new Error("Control wrapper returned invalid status or output fields.");
  }
  if (!Number.isInteger(result.exit_code) || !Number.isFinite(result.duration_ms) || Number(result.duration_ms) < 0) {
    throw new Error("Control wrapper returned invalid numeric fields.");
  }
  if (result.ok !== (result.exit_code === 0)) {
    throw new Error("Control wrapper success status conflicts with its exit code.");
  }
  if (!result.ok && !result.stdout.trim() && !result.stderr.trim()) {
    throw new Error("Control wrapper failure did not include an error detail.");
  }
  return result;
}
function isProtectedCanonPath(value) {
  return PROTECTED_CANON_PATH_SET.has(normalizeVaultPath(value).toLocaleLowerCase("en-US"));
}
function operationTargetPrecondition(operation) {
  if (operation.kind === "create") return "Target must be missing at execution.";
  if (operation.initialContents !== void 0) {
    return "Target must be an existing file or remain missing for the reviewed initializer.";
  }
  return "Target must be an existing file at execution.";
}
function contentMatchesExpected(current, expected) {
  return current === expected;
}
function contentHash(contents) {
  return (0, import_node_crypto.createHash)("sha256").update(contents, "utf8").digest("hex");
}
function buildTargetBaseline(pathValue, kind, contents, mtime, size) {
  const path = validateManagedWritePath(pathValue);
  if (kind === "file") {
    if (contents === null || !Number.isFinite(mtime) || Number(mtime) < 0 || !Number.isFinite(size) || Number(size) < 0) {
      throw new Error(`File baseline is incomplete: ${path}`);
    }
    return { path, kind, contentHash: contentHash(contents), mtime, size };
  }
  if (contents !== null || mtime !== null || size !== null) {
    throw new Error(`Non-file baseline cannot contain file metadata: ${path}`);
  }
  return { path, kind, contentHash: null, mtime: null, size: null };
}
function targetMatchesBaseline(baseline, kind, contents, mtime, size) {
  if (baseline.kind !== kind) return false;
  if (kind !== "file") return contents === null && mtime === null && size === null;
  return contents !== null && baseline.contentHash === contentHash(contents) && baseline.mtime === mtime && baseline.size === size;
}
function validateReviewedProposal(proposal) {
  validateProposal(proposal);
  if (!Array.isArray(proposal.targetBaselines) || proposal.targetBaselines.length !== proposal.operations.length) {
    throw new Error("Every reviewed operation requires exactly one target baseline.");
  }
  proposal.operations.forEach((operation, index) => {
    const baseline = proposal.targetBaselines[index];
    if (!baseline || baseline.path !== operation.path) {
      throw new Error(`Reviewed target baseline does not match operation ${index + 1}.`);
    }
    if (baseline.kind !== "missing" && baseline.kind !== "file" && baseline.kind !== "folder") {
      throw new Error(`Reviewed target baseline has an invalid kind: ${operation.path}`);
    }
    if (baseline.kind === "file") {
      if (typeof baseline.contentHash !== "string" || !/^[a-f0-9]{64}$/.test(baseline.contentHash) || !Number.isFinite(baseline.mtime) || Number(baseline.mtime) < 0 || !Number.isFinite(baseline.size) || Number(baseline.size) < 0) {
        throw new Error(`Reviewed file baseline is invalid: ${operation.path}`);
      }
    } else if (baseline.contentHash !== null || baseline.mtime !== null || baseline.size !== null) {
      throw new Error(`Reviewed non-file baseline contains file metadata: ${operation.path}`);
    }
    resolveOperationMode(operation, baseline.kind);
  });
  if (proposal.evidenceBaselines !== void 0 && !Array.isArray(proposal.evidenceBaselines)) {
    throw new Error("Reviewed evidence baselines must be an array.");
  }
  const evidenceSources = proposal.evidenceSources ?? [];
  const evidenceBaselines = proposal.evidenceBaselines ?? [];
  if (evidenceBaselines.length !== evidenceSources.length) {
    throw new Error("Every proposal evidence source requires exactly one reviewed file baseline.");
  }
  evidenceSources.forEach((source, index) => {
    const baseline = evidenceBaselines[index];
    if (!baseline || baseline.path !== source.path) {
      throw new Error(`Reviewed evidence baseline does not match source ${index + 1}.`);
    }
    if (baseline.kind !== "file" || typeof baseline.contentHash !== "string" || !/^[a-f0-9]{64}$/.test(baseline.contentHash) || !Number.isFinite(baseline.mtime) || Number(baseline.mtime) < 0 || !Number.isFinite(baseline.size) || Number(baseline.size) < 0) {
      throw new Error(`Reviewed evidence source must be an existing valid file: ${source.path}`);
    }
    if (baseline.contentHash !== source.contentHash) {
      throw new Error(`Evidence source changed before review baseline capture: ${source.path}`);
    }
  });
}
function validateProposal(proposal) {
  if (!proposal || typeof proposal !== "object" || !Array.isArray(proposal.operations)) {
    throw new Error("A proposal object with file operations is required.");
  }
  if (typeof proposal.id !== "string" || typeof proposal.title !== "string" || typeof proposal.summary !== "string") {
    throw new Error("Proposal ID, title, and summary must be strings.");
  }
  if (!proposal.id.trim() || !proposal.title.trim()) throw new Error("A proposal requires an ID and title.");
  if (proposal.phase !== "propose") throw new Error("Only proposal-phase mutations can be reviewed.");
  if (proposal.canonImpact !== "none" && proposal.canonImpact !== "candidate-only") {
    throw new Error("Proposal has an invalid canon-impact classification.");
  }
  if (proposal.operations.length === 0 || proposal.operations.length > 25) {
    throw new Error("A proposal must contain between 1 and 25 file operations.");
  }
  const operationPaths = /* @__PURE__ */ new Set();
  for (const operation of proposal.operations) {
    if (!operation || typeof operation !== "object" || operation.kind !== "create" && operation.kind !== "append") {
      throw new Error("Proposal contains an invalid operation discriminant.");
    }
    if (typeof operation.path !== "string" || typeof operation.contents !== "string") {
      throw new Error("Proposal operation path and contents must be strings.");
    }
    if (operation.kind === "append" && operation.initialContents !== void 0 && typeof operation.initialContents !== "string") {
      throw new Error(`Append initializer must be a string: ${operation.path}`);
    }
    if (operation.kind === "create" && "initialContents" in operation) {
      throw new Error(`Create operation cannot define append initialization: ${operation.path}`);
    }
    const path = validateManagedWritePath(operation.path);
    if (path !== operation.path) throw new Error(`Operation path must already be normalized: ${operation.path}`);
    if (isProtectedCanonPath(path)) throw new Error(`Direct canon mutation is blocked: ${path}`);
    if (!operation.contents.trim()) throw new Error(`Operation contents are empty: ${path}`);
    if (operation.kind === "append" && operation.initialContents !== void 0 && !operation.initialContents.trim()) {
      throw new Error(`Append initialization contents are empty: ${path}`);
    }
    if (operationPaths.has(path)) throw new Error(`Duplicate operation target: ${path}`);
    operationPaths.add(path);
  }
  if (proposal.evidenceSources !== void 0 && !Array.isArray(proposal.evidenceSources)) {
    throw new Error("Proposal evidence sources must be an array.");
  }
  const evidenceSources = proposal.evidenceSources ?? [];
  if (evidenceSources.length > 8) throw new Error("A proposal can bind at most 8 evidence sources.");
  const evidencePaths = /* @__PURE__ */ new Set();
  for (const source of evidenceSources) {
    if (!source || typeof source !== "object" || typeof source.path !== "string") {
      throw new Error("Proposal contains an invalid evidence source.");
    }
    const path = validateManagedWritePath(source.path);
    if (path !== source.path) throw new Error(`Evidence source path must already be normalized: ${source.path}`);
    if (typeof source.contentHash !== "string" || !/^[a-f0-9]{64}$/.test(source.contentHash)) {
      throw new Error(`Evidence source requires a SHA-256 content hash: ${path}`);
    }
    if (operationPaths.has(path)) throw new Error(`Evidence source cannot also be a mutation target: ${path}`);
    if (evidencePaths.has(path)) throw new Error(`Duplicate evidence source: ${path}`);
    evidencePaths.add(path);
  }
}
function resolveOperationMode(operation, target) {
  if (target === "folder") throw new Error(`Operation target is a folder: ${operation.path}`);
  if (operation.kind === "create") {
    if (target !== "missing") throw new Error(`Create target already exists: ${operation.path}`);
    return "create";
  }
  if (target === "file") return "append";
  if (operation.initialContents !== void 0) return "create";
  throw new Error(`Append target is missing and has no reviewed initializer: ${operation.path}`);
}
function buildManagedNoteProposal(input) {
  const schema = MANAGED_NOTE_SCHEMAS.find((candidate) => candidate.id === input.schemaId);
  if (!schema) throw new Error(`Unknown managed note schema: ${input.schemaId}`);
  const title = normalizeNoteTitle(input.title);
  const slug = slugify(title);
  const values = {};
  for (const field of schema.fields) {
    const value = (input.fields[field.id] ?? field.defaultValue ?? "").trim();
    if (field.required && !value) throw new Error(`${field.label} is required.`);
    if (value) values[field.id] = value;
  }
  const path = `${schema.folder}/${slug}.md`;
  const contents = frontmatter({
    title,
    obsidianUIMode: "preview",
    tags: [schema.tag, "homebrew/campaign/chicago", "vcg/managed"],
    NoteStatus: "\u{1F7E1}",
    created: input.createdDate,
    audience: schema.audience,
    campaign: CAMPAIGN_LINK,
    canon_status: "draft",
    retrieval_scope: "future",
    ...values
  }) + `# ${title}

> [!warning] Candidate only
> Created through the Control Plane. Review evidence and canonical ownership before promotion.

## ${schema.bodyHeading}

- <!-- add details -->

## Evidence and provenance

- **Source:** <!-- add source -->
- **Confidence:** unknown
- **Canonical owner reviewed:** no
`;
  const proposal = {
    id: input.proposalId,
    title: `Create ${schema.title}`,
    summary: `Create one schema-validated draft at ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "create", path, contents }]
  };
  validateProposal(proposal);
  return proposal;
}
function sessionFrontmatter(title, date, tags) {
  return frontmatter({
    title,
    obsidianUIMode: "preview",
    tags: [...tags, "homebrew/campaign/chicago", "vcg/managed"],
    NoteStatus: "\u{1F7E1}",
    created: date,
    audience: "dm",
    campaign: CAMPAIGN_LINK,
    canon_status: "draft",
    retrieval_scope: "future"
  });
}
function buildSessionRoomProposal(input) {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const file = (suffix) => `${roomPath}/${displayName} ${suffix}.md`;
  const operations = [
    {
      kind: "create",
      path: `${roomPath}/README.md`,
      contents: sessionFrontmatter(`${displayName} Room`, input.createdDate, ["Category/Session-Room"]) + `# ${displayName} Room

> [!important] Authority boundary
> This is an explicitly selected working room. It does not set \`next_session\`, establish chronology, or promote prep into played fact.

## Operating sequence

1. Establish exactly one supported selection authority: a verbatim player declaration or an explicit DM selection from the live handoff.
2. Complete preflight and readiness checks.
3. Generate a draft RUN only after the selection evidence validates.
4. Capture live events as confirmed, contested, or unknown.
5. Review candidates before any canonical owner changes.
`
    },
    {
      kind: "create",
      path: file("Control Room"),
      contents: sessionFrontmatter(`${displayName} Control Room`, input.createdDate, ["Category/Session-Control"]) + `# ${displayName} Control Room

\`\`\`vcg-control
title: Session operations
subtitle: Explicit, review-gated workflow actions
actions: capture-player-declaration, open-session-preflight, generate-session-run, open-session-readiness, capture-live-event, open-promotion-review
compact: false
\`\`\`

## Current focus

- **Selection evidence:** not validated
- **Supported authorities:** verbatim player declaration or DM-selected live handoff
- **RUN:** blocked until exactly one supported authority validates
- **Canon promotion:** human review only
`
    },
    {
      kind: "create",
      path: file("Decision Intake"),
      contents: sessionFrontmatter(`${displayName} Decision Intake`, input.createdDate, ["Category/Decision-Intake"]) + `# ${displayName} Decision Intake

> Player wording is append-only evidence. Corrections add a new entry; they do not replace the original. A DM-selected live-handoff authority remains in Current State and is never copied here as player intent.

## Declarations

_No declaration recorded._
`
    },
    {
      kind: "create",
      path: file("Table Log"),
      contents: sessionFrontmatter(`${displayName} Table Log`, input.createdDate, ["Category/Table-Log"]) + `# ${displayName} Table Log

> Live events are evidence candidates, not automatic canon.

## Event stream
`
    },
    {
      kind: "create",
      path: file("Preflight"),
      contents: sessionFrontmatter(`${displayName} Preflight`, input.createdDate, ["Category/Session-Preflight"]) + `# ${displayName} Preflight

- [ ] Date and expected duration recorded
- [ ] Attendance and character-sheet freshness recorded
- [ ] Rules baseline and rulings of record linked
- [ ] Safety, accessibility, and recording consent confirmed
- [ ] Player Display route checked for DM-only leaves
- [ ] Map and abstract-zone fallback checked
- [ ] Unknowns remain explicitly unknown
`
    },
    {
      kind: "create",
      path: file("Readiness Board"),
      contents: sessionFrontmatter(`${displayName} Readiness Board`, input.createdDate, ["Category/Session-Readiness"]) + `# ${displayName} Readiness Board

- [ ] Exactly one supported selection-evidence authority exists
- [ ] Player path has a verbatim declaration marker, or DM path has the exact Current State deployment mode and selected lead
- [ ] Preflight is complete
- [ ] Draft RUN cites its selection authority and current-state sources
- [ ] Map / fallback contract is ready
- [ ] Player-facing surfaces pass the audience gate
- [ ] Recording consent and retention are documented
- [ ] No unresolved blocker remains hidden
`
    },
    {
      kind: "create",
      path: file("Promotion Review"),
      contents: sessionFrontmatter(`${displayName} Promotion Review`, input.createdDate, ["Category/Promotion-Review"]) + `# ${displayName} Promotion Review

> [!danger] Human gate
> Nothing in this note is played fact until a human reviews the cited evidence and explicitly promotes the candidate through the authority chain.

## Candidate events

| Event ID | Evidence | Status | Audience | Proposed owner | Decision |
| --- | --- | --- | --- | --- | --- |

## Required closeout order

1. Played journal
2. Campaign State Ledger
3. Current State
4. Entity owners and player knowledge
5. Operational boards
6. Audits and rollback receipt
`
    }
  ];
  const proposal = {
    id: input.proposalId,
    title: `Scaffold ${displayName}`,
    summary: `Create seven draft workflow notes in the explicitly supplied room ${roomPath}.`,
    phase: "propose",
    canonImpact: "none",
    operations
  };
  validateProposal(proposal);
  return proposal;
}
function buildQuickCaptureProposal(input) {
  const text = input.text.trim();
  if (!text) throw new Error("Capture text is required.");
  const path = VAULT_PATHS.quickCapture;
  const contents = `
- ${input.timestamp} <!-- vcg:capture ${input.proposalId} --> ${text.replace(/\r?\n/g, " ")}
`;
  const initialContents = sessionFrontmatter("Quick Capture", input.timestamp.slice(0, 10), ["Category/Operations-Inbox"]) + "# Quick Capture\n\n> Timestamped candidates only. Review and route them through a typed workflow before promotion.\n";
  const proposal = {
    id: input.proposalId,
    title: "Append quick capture",
    summary: `Append one timestamped candidate to ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "append", path, contents, initialContents }]
  };
  validateProposal(proposal);
  return proposal;
}
function buildDeclarationProposal(input) {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const wording = input.wording.trim();
  const speaker = inlineText(input.speaker, "Speaker");
  if (!wording || !speaker) throw new Error("Player wording and speaker are required.");
  const path = `${roomPath}/${displayName} Decision Intake.md`;
  const contents = `
### Declaration ${input.timestamp}

<!-- vcg:declaration ${input.proposalId} -->
- **Speaker / owner:** ${speaker}
- **Verbatim wording:** ${inlineText(wording, "Player wording")}
- **Disposition:** ${input.disposition.trim() || "unclassified"}
- **Status:** confirmed player input; not itself a played outcome
`;
  const proposal = {
    id: input.proposalId,
    title: "Record player declaration",
    summary: `Append verbatim player-owned evidence to ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "append", path, contents }]
  };
  validateProposal(proposal);
  return proposal;
}
function buildEventProposal(input) {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const actor = inlineText(input.actor, "Actor");
  const event = input.event.trim();
  if (!actor || !event) throw new Error("Actor and event are required.");
  const path = `${roomPath}/${displayName} Table Log.md`;
  const contents = `
### ${input.timestamp} \u2014 ${input.proposalId}

<!-- vcg:event ${input.proposalId} -->
- **Actor:** ${actor}
- **Event:** ${inlineText(event, "Event")}
- **Status:** ${input.status}
- **Audience:** ${input.audience}
- **Evidence / witnesses:** ${inlineText(input.evidence, "Evidence") || "unknown"}
`;
  const proposal = {
    id: input.proposalId,
    title: "Capture live event",
    summary: `Append one sourced event candidate to ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "append", path, contents }]
  };
  validateProposal(proposal);
  return proposal;
}
function buildTranscriptionRequestProposal(input) {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const audioPath = normalizeVaultPath(input.audioPath);
  if (!/\.(?:aac|flac|m4a|mp3|ogg|wav|webm)$/i.test(audioPath)) {
    throw new Error("Select an audio file with an approved extension.");
  }
  if (!input.consentConfirmed) throw new Error("Recording and transcription consent must be confirmed.");
  const path = `${roomPath}/${displayName} Transcription Requests.md`;
  const contents = `
### Request ${input.timestamp} \u2014 ${input.proposalId}

<!-- vcg:transcription-request ${input.proposalId} -->
- **Audio:** [[${audioPath}]]
- **Consent:** confirmed by operator
- **Retention:** ${inlineText(input.retention, "Retention") || "review before processing"}
- **Execution:** not run; proposal receipt only
- **Approved runtime:** loopback/local whisper-cli with a fixed reviewed model
`;
  const initialContents = sessionFrontmatter(`${displayName} Transcription Requests`, input.timestamp.slice(0, 10), ["Category/Transcription-Request"]) + `# ${displayName} Transcription Requests

> Consent-bound request receipts. Creating a receipt does not run a process.
`;
  const proposal = {
    id: input.proposalId,
    title: "Create local transcription request",
    summary: `Append a consent-bound request for ${audioPath}. No process will run.`,
    phase: "propose",
    canonImpact: "none",
    operations: [{ kind: "append", path, contents, initialContents }]
  };
  validateProposal(proposal);
  return proposal;
}
function collectRunSelectionEvidence(input) {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const candidates = [];
  if (input.decisionIntakeContents && declarationMarkerIds(input.decisionIntakeContents).length > 0) {
    candidates.push({
      authority: "player-declaration",
      sourcePath: `${roomPath}/${displayName} Decision Intake.md`,
      contents: input.decisionIntakeContents
    });
  }
  const deploymentMode = input.currentStateContents ? strictFrontmatterScalar(input.currentStateContents, "deployment_mode") : null;
  const selectedLead = input.currentStateContents ? strictFrontmatterScalar(input.currentStateContents, "selected_lead") : null;
  if (input.currentStateContents !== null && deploymentMode === DM_LIVE_HANDOFF_DEPLOYMENT_MODE) {
    candidates.push({
      authority: "dm-selected-from-live-handoff",
      sourcePath: VAULT_PATHS.currentState,
      contents: input.currentStateContents,
      deploymentMode,
      selectedLead
    });
  }
  return candidates;
}
function resolveRunSelectionEvidence(input) {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const legacyEvidenceSupplied = input.declarationEvidence !== void 0;
  if (input.selectionEvidence !== void 0 && legacyEvidenceSupplied) {
    throw new Error("RUN generation is blocked because multiple selection-evidence inputs were supplied.");
  }
  const candidates = input.selectionEvidence ?? (legacyEvidenceSupplied ? [
    {
      authority: "player-declaration",
      sourcePath: `${roomPath}/${displayName} Decision Intake.md`,
      contents: input.declarationEvidence ?? ""
    }
  ] : []);
  if (candidates.length === 0) {
    throw new Error("RUN generation is blocked until exactly one explicit selection-evidence authority exists.");
  }
  if (candidates.length > 1) {
    throw new Error(
      "RUN generation is blocked because multiple selection-evidence authorities are present; resolve the authority first."
    );
  }
  const candidate = candidates[0];
  if (!candidate) throw new Error("RUN generation is blocked because selection evidence could not be resolved.");
  if (candidate.authority !== "player-declaration" && candidate.authority !== "dm-selected-from-live-handoff") {
    throw new Error("RUN generation is blocked because selection evidence has an unknown authority.");
  }
  const sourcePath = normalizeVaultPath(candidate.sourcePath);
  if (sourcePath !== candidate.sourcePath) {
    throw new Error("Selection-evidence source paths must already be normalized vault-relative paths.");
  }
  if (candidate.authority === "player-declaration") {
    const expectedPath = `${roomPath}/${displayName} Decision Intake.md`;
    if (sourcePath !== expectedPath) {
      throw new Error(`Player-declaration evidence must come from the active room Decision Intake: ${expectedPath}`);
    }
    const declarationIds = declarationMarkerIds(candidate.contents);
    const declarationId = declarationIds.at(-1);
    if (!declarationId) {
      if (legacyEvidenceSupplied) {
        throw new Error("RUN generation is blocked until declaration evidence exists in Decision Intake.");
      }
      throw new Error("Player-declaration selection evidence requires an exact standalone vcg:declaration marker.");
    }
    return {
      authority: candidate.authority,
      sourcePath,
      sourceContentHash: contentHash(candidate.contents),
      declarationId
    };
  }
  if (sourcePath !== VAULT_PATHS.currentState) {
    throw new Error(`DM live-handoff selection evidence must come from ${VAULT_PATHS.currentState}.`);
  }
  if (typeof candidate.deploymentMode !== "string" || candidate.deploymentMode.trim() !== DM_LIVE_HANDOFF_DEPLOYMENT_MODE) {
    throw new Error(
      `DM live-handoff selection requires deployment_mode: ${DM_LIVE_HANDOFF_DEPLOYMENT_MODE}.`
    );
  }
  if (!candidate.contents.trim()) {
    throw new Error("DM live-handoff selection requires the Current State source contents.");
  }
  const selectedLead = selectedLeadIdentifier(candidate.selectedLead);
  const sourceDeploymentMode = strictFrontmatterScalar(candidate.contents, "deployment_mode");
  const sourceSelectedLead = strictFrontmatterScalar(candidate.contents, "selected_lead");
  if (sourceDeploymentMode !== candidate.deploymentMode || sourceSelectedLead !== selectedLead) {
    throw new Error("DM live-handoff selection fields must match the same Current State source snapshot.");
  }
  return {
    authority: candidate.authority,
    sourcePath,
    sourceContentHash: contentHash(candidate.contents),
    selectedLead
  };
}
function runSelectionEvidenceMarkdown(evidence) {
  if (evidence.authority === "player-declaration") {
    return `- **Selection authority:** verbatim player declaration
- **Evidence source:** [[${evidence.sourcePath}]]
- **Evidence snapshot:** SHA-256 \`${evidence.sourceContentHash}\`
- **Evidence marker:** \`vcg:declaration ${evidence.declarationId}\`
- **Player wording:** copy the reviewed verbatim statement here
- **Selected lead:** do not infer; derive only from the reviewed declaration
`;
  }
  return `- **Selection authority:** DM selection from live handoff
- **Evidence source:** [[${evidence.sourcePath}]]
- **Evidence snapshot:** SHA-256 \`${evidence.sourceContentHash}\`
- **Deployment mode:** \`${DM_LIVE_HANDOFF_DEPLOYMENT_MODE}\`
- **Selected lead:** \`${evidence.selectedLead}\`
- **Player wording:** not asserted; this authority does not claim or fabricate player intent
`;
}
function buildRunProposal(input) {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const selectionEvidence = resolveRunSelectionEvidence({
    roomPath,
    displayName,
    selectionEvidence: input.selectionEvidence,
    declarationEvidence: input.declarationEvidence
  });
  const title = `${displayName} RUN`;
  const path = `${roomPath}/${title}.md`;
  const contents = sessionFrontmatter(title, input.createdDate, ["Category/Session-Prep"]) + `# ${title}

> [!important] Conditional prep only
> Generated only after exactly one explicit selection-evidence authority validated. This remains draft/future, cannot prove that anything happened, and cannot convert a DM selection into player intent.

## Selection authority and evidence

- **Latest played record:** ${inlineText(input.latestPlayedLabel, "Latest played label")}
${runSelectionEvidenceMarkdown(selectionEvidence)}- **Current-state facts used:** <!-- add citations -->
- **Exact gaps and safe fallbacks:** <!-- document gaps -->
- **Source modules opened for parts:** <!-- list source modules -->
- **Source claims explicitly excluded:** <!-- list exclusions -->

## Player-facing choice set

| Perceivable choice | Available modes | What may change |
| --- | --- | --- |
|  |  |  |

## Activated toy register

| ID | Perceivable evidence | Want / move | 3+ affordances | If ignored | Evidence boundary |
| --- | --- | --- | --- | --- | --- |
| T-01 |  |  |  |  |  |

## Information resilience

| Information | Witness | Object / record | Environment / consequence | Survives a missing NPC? |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Map and fallback contract

- **Primary map:** <!-- add map -->
- **Abstract-zone fallback:** <!-- add fallback -->
- **Player-safe reveal state:** <!-- add reveal state -->
- **Unexpected approach:** <!-- add contingency -->

## Outcome bands

| Outcome | State change candidate | Continuing choices |
| --- | --- | --- |
| Success |  |  |
| Costly / partial |  |  |
| Refusal / departure |  |  |
`;
  const proposal = {
    id: input.proposalId,
    title: `Generate draft ${title}`,
    summary: `Create one explicit-selection-gated draft RUN at ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "create", path, contents }],
    evidenceSources: [{ path: selectionEvidence.sourcePath, contentHash: selectionEvidence.sourceContentHash }]
  };
  validateProposal(proposal);
  return proposal;
}

// src/workflow-ui.ts
var import_obsidian2 = require("obsidian");
var WorkflowFormModal = class extends import_obsidian2.Modal {
  constructor(app, heading, description, fields, submitLabel, onSubmit, onDismiss = () => void 0) {
    super(app);
    this.heading = heading;
    this.description = description;
    this.fields = fields;
    this.submitLabel = submitLabel;
    this.onSubmit = onSubmit;
    this.onDismiss = onDismiss;
    for (const field of fields) this.values[field.id] = field.value ?? (field.type === "toggle" ? false : "");
  }
  values = {};
  controls = /* @__PURE__ */ new Map();
  submitting = false;
  errorEl = null;
  errorId = "";
  submitButton = null;
  onOpen() {
    this.modalEl.addClass("vc-control-workflow-modal");
    const titleId = `vcg-workflow-title-${crypto.randomUUID()}`;
    const descriptionId = `vcg-workflow-description-${crypto.randomUUID()}`;
    const errorId = `vcg-workflow-error-${crypto.randomUUID()}`;
    this.errorId = errorId;
    this.titleEl.id = titleId;
    this.titleEl.setText(this.heading);
    this.contentEl.createEl("p", { cls: "vc-control-workflow-intro", text: this.description, attr: { id: descriptionId } });
    this.modalEl.setAttr("aria-labelledby", titleId);
    this.modalEl.setAttr("aria-describedby", `${descriptionId} ${errorId}`);
    this.errorEl = this.contentEl.createEl("p", {
      cls: "vc-control-workflow-error",
      attr: { id: errorId, role: "alert", "aria-live": "assertive", hidden: "" }
    });
    for (const field of this.fields) {
      const setting = new import_obsidian2.Setting(this.contentEl).setName(`${field.label}${field.required ? " *" : ""}`);
      if (field.description) setting.setDesc(field.description);
      const fieldId = `vcg-field-${field.id}-${crypto.randomUUID()}`;
      const labelId = `${fieldId}-label`;
      setting.nameEl.id = labelId;
      const describeControl = (control) => {
        control.id = fieldId;
        this.controls.set(field.id, control);
        control.setAttr("aria-labelledby", labelId);
        if (field.required) control.setAttr("aria-required", "true");
        if (field.description) {
          const descriptionElement = setting.descEl;
          descriptionElement.id = `${fieldId}-description`;
          control.setAttr("aria-describedby", descriptionElement.id);
        }
      };
      if (field.type === "text") {
        setting.addText((component) => {
          describeControl(component.inputEl);
          component.setValue(String(this.values[field.id] ?? ""));
          if (field.placeholder) component.setPlaceholder(field.placeholder);
          component.onChange((value) => {
            this.updateValue(field, value);
          });
        });
      } else if (field.type === "textarea") {
        setting.addTextArea((component) => {
          describeControl(component.inputEl);
          component.setValue(String(this.values[field.id] ?? ""));
          if (field.placeholder) component.setPlaceholder(field.placeholder);
          component.onChange((value) => {
            this.updateValue(field, value);
          });
        });
      } else if (field.type === "select") {
        setting.addDropdown((component) => {
          describeControl(component.selectEl);
          component.addOptions({ ...field.options });
          component.setValue(String(this.values[field.id] ?? ""));
          component.onChange((value) => {
            this.updateValue(field, value);
          });
        });
      } else {
        setting.addToggle((component) => {
          describeControl(component.toggleEl);
          component.setValue(Boolean(this.values[field.id])).onChange((value) => {
            this.updateValue(field, value);
          });
        });
      }
    }
    const actions = this.contentEl.createDiv({ cls: "vc-control-confirm-actions" });
    const cancel = actions.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    this.submitButton = actions.createEl("button", { cls: "mod-cta", text: this.submitLabel });
    this.submitButton.type = "button";
    this.submitButton.addEventListener("click", () => void this.submit());
    window.setTimeout(() => this.modalEl.querySelector("input, textarea, select")?.focus(), 0);
  }
  onClose() {
    this.onDismiss();
    this.controls.clear();
    this.errorEl = null;
    this.errorId = "";
    this.submitButton = null;
    this.contentEl.empty();
  }
  async submit() {
    if (this.submitting) return;
    const missing = this.fields.filter((field) => this.isMissing(field));
    if (missing.length > 0) {
      const message = `Required: ${missing.map((field) => field.label).join(", ")}.`;
      for (const field of missing) this.markInvalid(field.id);
      this.showError(message);
      this.controls.get(missing[0]?.id ?? "")?.focus();
      new import_obsidian2.Notice(message);
      return;
    }
    this.submitting = true;
    if (this.submitButton) this.submitButton.disabled = true;
    try {
      await this.onSubmit({ ...this.values });
      this.close();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.showError(message);
      new import_obsidian2.Notice(`Control Plane: ${message}`, 1e4);
    } finally {
      this.submitting = false;
      if (this.submitButton) this.submitButton.disabled = false;
    }
  }
  showError(message) {
    if (!this.errorEl) return;
    this.errorEl.removeAttribute("hidden");
    this.errorEl.setText(message);
  }
  updateValue(field, value) {
    this.values[field.id] = value;
    if (!this.isMissing(field)) this.clearInvalid(field.id);
  }
  isMissing(field) {
    if (!field.required) return false;
    const value = this.values[field.id];
    return typeof value === "boolean" ? !value : typeof value !== "string" || !value.trim();
  }
  markInvalid(fieldId) {
    const control = this.controls.get(fieldId);
    if (!control) return;
    control.setAttr("aria-invalid", "true");
    const descriptions = new Set((control.getAttr("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
    descriptions.add(this.errorId);
    control.setAttr("aria-describedby", [...descriptions].join(" "));
  }
  clearInvalid(fieldId) {
    const control = this.controls.get(fieldId);
    if (!control || control.getAttr("aria-invalid") !== "true") return;
    control.removeAttribute("aria-invalid");
    const descriptions = (control.getAttr("aria-describedby") ?? "").split(/\s+/).filter((id) => id && id !== this.errorId);
    if (descriptions.length > 0) control.setAttr("aria-describedby", descriptions.join(" "));
    else control.removeAttribute("aria-describedby");
    const remaining = this.fields.filter((field) => this.controls.get(field.id)?.getAttr("aria-invalid") === "true");
    if (remaining.length > 0) {
      this.showError(`Required: ${remaining.map((field) => field.label).join(", ")}.`);
      return;
    }
    this.errorEl?.setAttr("hidden", "");
    this.errorEl?.setText("");
  }
};
var ProposalReviewModal = class extends import_obsidian2.Modal {
  constructor(app, proposal, onExecute, onDismiss = () => void 0) {
    super(app);
    this.proposal = proposal;
    this.onExecute = onExecute;
    this.onDismiss = onDismiss;
  }
  submitted = false;
  closed = false;
  previewSnapshot = "";
  errorEl = null;
  baselineElements = /* @__PURE__ */ new Map();
  evidenceBaselineElements = /* @__PURE__ */ new Map();
  onOpen() {
    this.closed = false;
    validateProposal(this.proposal);
    this.modalEl.addClass("vc-control-proposal-modal");
    const titleId = `vcg-proposal-title-${crypto.randomUUID()}`;
    const descriptionId = `vcg-proposal-description-${crypto.randomUUID()}`;
    const errorId = `vcg-proposal-error-${crypto.randomUUID()}`;
    this.titleEl.id = titleId;
    this.titleEl.setText(`Review: ${this.proposal.title}`);
    const policy = this.contentEl.createDiv({ cls: "vc-control-proposal-policy" });
    policy.id = descriptionId;
    this.modalEl.setAttr("aria-labelledby", titleId);
    this.modalEl.setAttr("aria-describedby", `${descriptionId} ${errorId}`);
    policy.createEl("strong", { text: "PROPOSE \u2192 HUMAN REVIEW \u2192 EXECUTE" });
    policy.createEl("p", { text: this.proposal.summary });
    policy.createEl("p", {
      text: this.proposal.canonImpact === "candidate-only" ? "This creates or appends candidates only. It does not promote canon." : "This operation does not change canonical owners."
    });
    this.errorEl = this.contentEl.createEl("p", {
      cls: "vc-control-workflow-error",
      attr: { id: errorId, role: "alert", "aria-live": "assertive", hidden: "" }
    });
    const evidenceSources = this.proposal.evidenceSources ?? [];
    if (evidenceSources.length > 0) {
      const evidence = this.contentEl.createEl("section", { cls: "vc-control-proposal-evidence" });
      evidence.createEl("h3", { text: "Evidence read set" });
      evidence.createEl("p", {
        text: "Each source must remain the same existing file from review through execution."
      });
      const evidenceList = evidence.createEl("ul");
      for (const source of evidenceSources) {
        const item = evidenceList.createEl("li");
        item.createEl("code", { text: source.path });
        const baseline = item.createEl("p", {
          text: `Expected SHA-256 ${source.contentHash.slice(0, 16)}\u2026; capturing file baseline\u2026`
        });
        this.evidenceBaselineElements.set(source.path, baseline);
      }
    }
    const list = this.contentEl.createEl("ol", { cls: "vc-control-proposal-list" });
    for (const operation of this.proposal.operations) {
      const item = list.createEl("li");
      const details = item.createEl("details");
      const summary = details.createEl("summary");
      summary.createEl("code", { text: operation.kind.toUpperCase() });
      summary.createSpan({ text: operation.path });
      const target = this.app.vault.getAbstractFileByPath(operation.path);
      const observed = target instanceof import_obsidian2.TFile ? "existing file" : target instanceof import_obsidian2.TFolder ? "folder (blocked)" : "missing";
      details.createEl("p", { text: `Precondition: ${operationTargetPrecondition(operation)}` });
      const baseline = details.createEl("p", { text: `Reviewed baseline: capturing ${observed}\u2026` });
      this.baselineElements.set(operation.path, baseline);
      if (operation.kind === "append" && operation.initialContents !== void 0) {
        details.createEl("h4", { text: "Initializer used only if the target is missing" });
        details.createEl("pre", { text: operation.initialContents });
      }
      details.createEl("h4", { text: operation.kind === "create" ? "New file" : "Append" });
      details.createEl("pre", { text: operation.contents });
    }
    const actions = this.contentEl.createDiv({ cls: "vc-control-confirm-actions" });
    const cancel = actions.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const execute = actions.createEl("button", { cls: "mod-cta", text: "Execute reviewed proposal" });
    execute.type = "button";
    execute.disabled = true;
    execute.setAttr("aria-busy", "true");
    execute.setAttr("aria-describedby", errorId);
    execute.addEventListener("click", () => void this.execute(execute));
    window.setTimeout(() => cancel.focus(), 0);
    void this.captureBaselines(execute);
  }
  onClose() {
    this.closed = true;
    this.onDismiss();
    this.errorEl = null;
    this.baselineElements.clear();
    this.evidenceBaselineElements.clear();
    this.contentEl.empty();
  }
  async execute(button) {
    if (this.submitted) return;
    this.submitted = true;
    button.disabled = true;
    try {
      if (!this.previewSnapshot) throw new Error("Reviewed target baselines are not ready.");
      const reviewed = JSON.parse(this.previewSnapshot);
      validateReviewedProposal(reviewed);
      await this.onExecute(reviewed);
      this.close();
    } catch (error) {
      this.submitted = false;
      button.disabled = false;
      const message = error instanceof Error ? error.message : String(error);
      this.errorEl?.removeAttribute("hidden");
      this.errorEl?.setText(message);
      new import_obsidian2.Notice(`Control Plane transaction failed: ${message}`, 12e3);
    }
  }
  async captureBaselines(button) {
    try {
      const capture = async (path) => {
        const target = this.app.vault.getAbstractFileByPath(path);
        if (target instanceof import_obsidian2.TFolder) return buildTargetBaseline(path, "folder", null, null, null);
        if (!(target instanceof import_obsidian2.TFile)) return buildTargetBaseline(path, "missing", null, null, null);
        const contents = await this.app.vault.read(target);
        return buildTargetBaseline(path, "file", contents, target.stat.mtime, target.stat.size);
      };
      const [targetBaselines, evidenceBaselines] = await Promise.all([
        Promise.all(this.proposal.operations.map((operation) => capture(operation.path))),
        Promise.all((this.proposal.evidenceSources ?? []).map((source) => capture(source.path)))
      ]);
      const reviewed = { ...this.proposal, targetBaselines, evidenceBaselines };
      validateReviewedProposal(reviewed);
      if (this.closed) return;
      for (const baseline of targetBaselines) {
        const element = this.baselineElements.get(baseline.path);
        if (!element) continue;
        const summary = baseline.kind === "file" ? `file \xB7 SHA-256 ${baseline.contentHash?.slice(0, 16)}\u2026 \xB7 ${baseline.size} bytes \xB7 mtime ${new Date(
          baseline.mtime ?? 0
        ).toISOString()}` : baseline.kind;
        element.setText(`Reviewed baseline: ${summary}.`);
      }
      for (const baseline of evidenceBaselines) {
        const element = this.evidenceBaselineElements.get(baseline.path);
        if (!element) continue;
        element.setText(
          `Reviewed evidence: file \xB7 SHA-256 ${baseline.contentHash?.slice(0, 16)}\u2026 \xB7 ${baseline.size} bytes \xB7 mtime ${new Date(
            baseline.mtime ?? 0
          ).toISOString()}.`
        );
      }
      this.previewSnapshot = JSON.stringify(reviewed);
      button.disabled = false;
      button.setAttr("aria-busy", "false");
    } catch (error) {
      if (this.closed) return;
      const message = error instanceof Error ? error.message : String(error);
      this.errorEl?.removeAttribute("hidden");
      this.errorEl?.setText(`Target or evidence baseline capture failed: ${message}`);
      button.disabled = true;
      button.setAttr("aria-busy", "false");
    }
  }
};

// src/ui-contract.ts
var STARTUP_SURFACES = ["control-plane", "none"];
function normalizeStartupSurface(value) {
  return typeof value === "string" && STARTUP_SURFACES.includes(value) ? value : "control-plane";
}
function shouldGroupRouteActions(actionCount) {
  return Number.isInteger(actionCount) && actionCount > 8;
}
function groupRouteActions(actions) {
  const buckets = /* @__PURE__ */ new Map();
  for (const action of actions) {
    const bucket = buckets.get(action.group);
    if (bucket) bucket.push(action);
    else buckets.set(action.group, [action]);
  }
  return [...buckets].map(([group, groupedActions]) => ({ group, actions: groupedActions }));
}
function escapeSurface(contextOpen, moreOpen) {
  if (contextOpen) return "context";
  if (moreOpen) return "more";
  return null;
}
function stableDomIdToken(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
var AD_STATBLOCK_TITLE = /^\s*title\s*:\s*(.*?)\s*$/i;
function parseAdStatblock(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const firstLine = lines[0] ?? "";
  const titleMatch = firstLine.match(AD_STATBLOCK_TITLE);
  const title = (titleMatch?.[1] ?? "").trim().slice(0, 160) || "Statblock";
  return {
    title,
    markdown: (titleMatch ? lines.slice(1) : lines).join("\n").trim()
  };
}
function sanitizeAdStatblockMarkdown(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let fence = null;
  const safeLines = lines.map((rawLine) => {
    const line = rawLine.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/!\[\[/g, "[[");
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      const isClose = marker?.[1]?.[0] === fence.character && marker[1].length >= fence.length;
      if (isClose) fence = null;
      return `    ${line}`;
    }
    if (marker?.[1]) {
      fence = { character: marker[1][0], length: marker[1].length };
      return `    ${line}`;
    }
    return line.replace(/`([=$])([^`\n]*)`/g, "`\\$1$2`").replace(/\b(BUTTON|INPUT|VIEW)\[/gi, "$1\u2060[");
  });
  return safeLines.join("\n");
}
var ENTITY_SEARCH_DEBOUNCE_MS = 180;

// src/main.ts
var VIEW_TYPE = "veiled-chicago-control-plane";
var CURRENT_STATE_PATH = VAULT_PATHS.currentState;
var CURRENT_LEADS_PATH = VAULT_PATHS.currentLeads;
var APPROVED_AUDIO_EXTENSIONS = /* @__PURE__ */ new Set(["aac", "flac", "m4a", "mp3", "ogg", "wav", "webm"]);
var DEFAULT_SETTINGS = {
  automationEnabled: false,
  autoProfiles: true,
  openNotesInNewTab: true,
  confirmScriptActions: true,
  mapUrl: "http://127.0.0.1:5173/",
  scriptTimeoutSeconds: 45,
  maxOutputCharacters: 12e3,
  activeSessionRoom: null,
  activeSessionName: null,
  activeContextProfile: "session-live",
  activeRoute: "home",
  startupSurface: "control-plane",
  favoriteActionIds: [],
  recentActions: [],
  recentRuns: [],
  recentTransactions: [],
  proposalReplayIds: []
};
function asRecord(value) {
  return value && typeof value === "object" ? value : {};
}
function wikilinkTarget(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|[^\]]*)?\]\]/);
  return match?.[1]?.trim() || null;
}
function wikilinkLabel(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/\[\[[^\]]+\|([^\]]+)\]\]/);
  if (match?.[1]) return match[1].trim();
  return wikilinkTarget(value)?.split("/").pop() ?? null;
}
function normalizeDeployment(value) {
  if (typeof value !== "string" || !value.trim()) return "UNDECLARED";
  return value.trim().replace(/[-_]+/g, " ").toUpperCase();
}
function isSafeMapUrl(raw) {
  try {
    const url = new URL(raw);
    const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    return url.protocol === "http:" && loopback && !url.username && !url.password;
  } catch {
    return false;
  }
}
function openExternalUrl(raw) {
  window.open(raw, "_blank", "noopener,noreferrer");
}
function attributeToken(value) {
  if (typeof value !== "string") return null;
  const token = value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return token || null;
}
function setFieldValidation(input, error, valid, message) {
  input.setAttr("aria-invalid", String(!valid));
  input.toggleClass("is-invalid", !valid);
  error.hidden = valid;
  error.setText(valid ? "" : message);
}
function isRunRecord(value) {
  const record = asRecord(value);
  return typeof record.actionId === "string" && ACTION_BY_ID.has(record.actionId) && typeof record.title === "string" && typeof record.ok === "boolean" && isCanonicalIsoTimestamp(record.timestamp) && typeof record.durationMs === "number" && Number.isFinite(record.durationMs) && record.durationMs >= 0 && typeof record.output === "string";
}
function isTransactionRecord(value) {
  const record = asRecord(value);
  return typeof record.id === "string" && typeof record.title === "string" && typeof record.ok === "boolean" && isCanonicalIsoTimestamp(record.timestamp) && typeof record.operationCount === "number" && Number.isInteger(record.operationCount) && record.operationCount >= 0 && typeof record.summary === "string";
}
function isContextProfileId(value) {
  return typeof value === "string" && CONTEXT_PROFILES.some((profile) => profile.id === value);
}
function stringValue(values, id) {
  const value = values[id];
  return typeof value === "string" ? value : "";
}
function isEventStatus(value) {
  return value === "confirmed" || value === "contested" || value === "unknown";
}
function isAudience(value) {
  return value === "dm" || value === "players" || value === "both";
}
function isEditableEventTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}
function successfulActionReceipt(action) {
  switch (action.kind) {
    case "script":
      return { label: "SUCCESS", announcement: "completed" };
    case "command":
    case "integration":
    case "external":
      return { label: "DISPATCHED", announcement: "adapter dispatched" };
    default:
      return { label: "OPENED", announcement: "opened" };
  }
}
var ConfirmActionModal = class extends import_obsidian3.Modal {
  constructor(app, message, onConfirm, onDismiss) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
    this.onDismiss = onDismiss;
  }
  confirmed = false;
  onOpen() {
    this.modalEl.addClass("vc-control-confirm-modal");
    const titleId = `vcg-confirm-title-${crypto.randomUUID()}`;
    const descriptionId = `vcg-confirm-description-${crypto.randomUUID()}`;
    this.titleEl.id = titleId;
    this.titleEl.setText("Confirm local action");
    this.contentEl.createEl("p", { text: this.message, attr: { id: descriptionId } });
    this.modalEl.setAttr("aria-labelledby", titleId);
    this.modalEl.setAttr("aria-describedby", descriptionId);
    this.contentEl.createEl("p", {
      cls: "vc-control-confirm-note",
      text: "Only the named allowlisted action will run. No note content can supply a shell command."
    });
    const footer = this.contentEl.createDiv({ cls: "vc-control-confirm-actions" });
    const cancel = footer.createEl("button", { text: "Cancel" });
    cancel.type = "button";
    cancel.addEventListener("click", () => this.close());
    const confirm = footer.createEl("button", { cls: "mod-cta", text: "Run action" });
    confirm.type = "button";
    confirm.addEventListener("click", () => {
      this.confirmed = true;
      this.close();
      this.onConfirm();
    });
    window.setTimeout(() => confirm.focus(), 0);
  }
  onClose() {
    this.onDismiss(this.confirmed);
    this.contentEl.empty();
  }
};
var ControlPlaneView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.routeHistory = new RouteHistory(plugin.settings.activeRoute);
  }
  instanceId = crypto.randomUUID().slice(0, 8);
  routeHistory;
  liveRegion = null;
  contextTrigger = null;
  moreTrigger = null;
  contextOpen = false;
  moreOpen = false;
  entityQuery = "";
  entityType = "";
  entityStatus = "";
  renderGeneration = 0;
  entitySearchTimer = null;
  contextResizeObserver = null;
  handleKeydown = (event) => {
    if (event.key === "Tab" && this.contextOpen && this.trapContextFocus(event)) return;
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
      event.preventDefault();
      this.openCommandSearch(event.target instanceof HTMLElement ? event.target : null);
      return;
    }
    if (event.altKey && !event.metaKey && !event.ctrlKey && event.key === "ArrowLeft") {
      if (isEditableEventTarget(event.target)) return;
      event.preventDefault();
      const route = this.routeHistory.back();
      if (!route) return;
      void this.navigate(route, false);
      return;
    }
    if (event.altKey && !event.metaKey && !event.ctrlKey && event.key === "ArrowRight") {
      if (isEditableEventTarget(event.target)) return;
      event.preventDefault();
      const route = this.routeHistory.forward();
      if (!route) return;
      void this.navigate(route, false);
      return;
    }
    if (event.key === "Escape") {
      const surface = escapeSurface(this.contextOpen, this.moreOpen);
      if (surface === "context") {
        event.preventDefault();
        this.closeContext(true);
      } else if (surface === "more") {
        event.preventDefault();
        this.setMoreOpen(false, true);
      }
    }
  };
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Veiled Chicago Control Plane";
  }
  getIcon() {
    return "radar";
  }
  async onOpen() {
    this.contentEl.addEventListener("keydown", this.handleKeydown);
    await this.render();
    this.contextResizeObserver = new ResizeObserver(() => this.reconcileContextPresentation());
    this.contextResizeObserver.observe(this.contentEl);
  }
  async onClose() {
    this.contentEl.removeEventListener("keydown", this.handleKeydown);
    if (this.entitySearchTimer !== null) window.clearTimeout(this.entitySearchTimer);
    this.entitySearchTimer = null;
    this.contextResizeObserver?.disconnect();
    this.contextResizeObserver = null;
  }
  async render(announcement) {
    if (this.entitySearchTimer !== null) window.clearTimeout(this.entitySearchTimer);
    this.entitySearchTimer = null;
    const generation = ++this.renderGeneration;
    const { contentEl } = this;
    const activeElement = document.activeElement;
    const focusKey = activeElement instanceof HTMLElement && contentEl.contains(activeElement) ? activeElement.dataset.vcFocus ?? null : null;
    const scrollTop = contentEl.scrollTop;
    const persistentLiveRegion = this.liveRegion ?? document.createElement("div");
    persistentLiveRegion.className = "vc-control-live-region";
    persistentLiveRegion.setAttribute("role", "status");
    persistentLiveRegion.setAttribute("aria-live", "polite");
    persistentLiveRegion.setAttribute("aria-atomic", "true");
    persistentLiveRegion.remove();
    this.liveRegion = persistentLiveRegion;
    if (this.routeHistory.current !== this.plugin.settings.activeRoute) {
      this.routeHistory.push(this.plugin.settings.activeRoute);
    }
    const live = await this.plugin.readLiveState();
    if (generation !== this.renderGeneration) return;
    contentEl.empty();
    contentEl.addClass("vc-control-plane");
    contentEl.setAttr("aria-label", "Veiled Chicago campaign control plane");
    const route = ROUTE_DEFINITIONS.find((candidate) => candidate.id === this.plugin.settings.activeRoute) ?? ROUTE_DEFINITIONS[0];
    if (!route) return;
    const shell = contentEl.createDiv({ cls: "vc-control-shell" });
    const mainId = `vc-control-route-main-${this.instanceId}`;
    const skip = shell.createEl("a", { cls: "vc-control-skip-link", text: "Skip to route content", href: `#${mainId}` });
    skip.dataset.vcFocus = "skip-link";
    skip.addEventListener("click", () => {
      window.setTimeout(() => this.focusRouteHeading(), 0);
    });
    const appHeader = shell.createEl("header", { cls: "vc-control-app-header" });
    const brand = appHeader.createDiv({ cls: "vc-control-brand" });
    brand.createEl("h1", { text: "Veiled Chicago" });
    brand.createEl("p", { text: "Local campaign control plane / observed state only" });
    const commandTrigger = appHeader.createEl("button", { cls: "vc-control-command-trigger" });
    commandTrigger.type = "button";
    commandTrigger.dataset.vcFocus = "command-search";
    const commandIcon = commandTrigger.createSpan();
    commandIcon.setAttr("aria-hidden", "true");
    (0, import_obsidian3.setIcon)(commandIcon, "search");
    commandTrigger.createSpan({ text: "Search actions" });
    commandTrigger.createEl("kbd", { text: import_obsidian3.Platform.isMacOS ? "\u2318 K" : "Ctrl K" });
    commandTrigger.addEventListener("click", () => this.openCommandSearch(commandTrigger));
    const grid = shell.createDiv({ cls: "vc-control-shell-grid" });
    this.renderRouteNavigation(grid, route.id);
    const main = grid.createEl("main", { cls: "vc-control-route-main", attr: { id: mainId } });
    const routeHeader = main.createEl("header", { cls: "vc-control-route-header" });
    const routeCopy = routeHeader.createDiv();
    routeCopy.createEl("h2", {
      text: route.label,
      attr: { id: `vc-control-route-heading-${this.instanceId}`, tabindex: "-1" }
    }).dataset.vcFocus = `route-heading-${route.id}`;
    routeCopy.createEl("p", { text: route.description });
    this.contextTrigger = routeHeader.createEl("button", { cls: "vc-control-context-toggle" });
    this.contextTrigger.type = "button";
    this.contextTrigger.dataset.vcFocus = "context-toggle";
    this.contextTrigger.setAttr("aria-label", "Open observed context");
    this.contextTrigger.setAttr("aria-expanded", String(this.contextOpen));
    this.contextTrigger.setAttr("aria-controls", `vc-control-context-${this.instanceId}`);
    const contextIcon = this.contextTrigger.createSpan();
    contextIcon.setAttr("aria-hidden", "true");
    (0, import_obsidian3.setIcon)(contextIcon, "panel-right-open");
    this.contextTrigger.addEventListener("click", () => this.openContext());
    this.renderRoute(main, route.id, live);
    this.renderContext(grid, live);
    this.renderBottomNavigation(shell, route.id);
    shell.appendChild(persistentLiveRegion);
    contentEl.scrollTop = scrollTop;
    if (focusKey) this.restoreFocus(focusKey);
    if (announcement) this.announce(announcement);
  }
  async navigateTo(section) {
    if (section === "command-search") {
      const active = document.activeElement;
      const opener = active instanceof HTMLElement && this.contentEl.contains(active) ? active : this.contentEl.querySelector('[data-vc-focus="command-search"]') ?? this.contentEl.querySelector(`#vc-control-route-heading-${this.instanceId}`);
      this.openCommandSearch(opener);
      return;
    }
    const target = section === "entity-navigator" ? { route: "world", focusTarget: "entity-navigator" } : routeForLegacySection(section ?? this.plugin.settings.activeRoute);
    if (!target) return;
    await this.navigate(target.route, true, target.focusTarget);
  }
  announce(message) {
    const region = this.liveRegion;
    if (!region) return;
    region.setText("");
    window.setTimeout(() => {
      if (region.isConnected) region.setText(message);
    }, 0);
  }
  renderRouteNavigation(container, activeRoute) {
    const nav = container.createEl("nav", {
      cls: "vc-control-route-nav",
      attr: { "aria-label": "Control plane routes" }
    });
    const list = nav.createEl("ul", { cls: "vc-control-route-nav-list" });
    for (const route of ROUTE_DEFINITIONS) {
      const item = list.createEl("li");
      const button = item.createEl("button", { cls: "vc-control-route-nav-button" });
      button.type = "button";
      button.dataset.vcFocus = `route-${route.id}`;
      if (route.id === activeRoute) button.setAttr("aria-current", "page");
      const icon = button.createSpan({ cls: "vc-control-route-nav-icon" });
      icon.setAttr("aria-hidden", "true");
      (0, import_obsidian3.setIcon)(icon, route.icon);
      button.createSpan({ cls: "vc-control-route-nav-label", text: route.label });
      button.createSpan({
        cls: "vc-control-route-count",
        text: String(CONTROL_ACTIONS.filter((action) => action.route === route.id).length)
      });
      button.addEventListener("click", () => void this.navigate(route.id));
    }
  }
  renderBottomNavigation(container, activeRoute) {
    const nav = container.createEl("nav", {
      cls: "vc-control-bottom-nav",
      attr: { "aria-label": "Mobile control plane routes" }
    });
    const list = nav.createEl("ul", { cls: "vc-control-bottom-nav-list" });
    for (const route of ROUTE_DEFINITIONS.filter((candidate) => candidate.mobilePrimary)) {
      const item = list.createEl("li");
      const button = item.createEl("button");
      button.type = "button";
      button.dataset.vcFocus = `mobile-route-${route.id}`;
      if (route.id === activeRoute) button.setAttr("aria-current", "page");
      const icon = button.createSpan();
      icon.setAttr("aria-hidden", "true");
      (0, import_obsidian3.setIcon)(icon, route.icon);
      button.createSpan({ text: route.mobileLabel });
      button.addEventListener("click", () => void this.navigate(route.id));
    }
    const moreItem = list.createEl("li");
    const more = moreItem.createEl("button");
    this.moreTrigger = more;
    more.type = "button";
    more.dataset.vcFocus = "mobile-more";
    more.setAttr("aria-expanded", String(this.moreOpen));
    more.setAttr("aria-controls", `vc-control-more-${this.instanceId}`);
    if (activeRoute === "tools" || activeRoute === "system") more.setAttr("aria-current", "page");
    const moreIcon = more.createSpan();
    moreIcon.setAttr("aria-hidden", "true");
    (0, import_obsidian3.setIcon)(moreIcon, "ellipsis");
    more.createSpan({ text: "More" });
    more.addEventListener("click", () => this.setMoreOpen(!this.moreOpen, false));
    const panel = nav.createDiv({
      cls: `vc-control-more-panel${this.moreOpen ? " is-open" : ""}`,
      attr: {
        id: `vc-control-more-${this.instanceId}`,
        "data-open": String(this.moreOpen),
        "aria-hidden": String(!this.moreOpen),
        "aria-label": "Additional control plane routes",
        role: "region"
      }
    });
    for (const route of ROUTE_DEFINITIONS.filter((candidate) => !candidate.mobilePrimary)) {
      const button = panel.createEl("button", { text: route.label });
      button.type = "button";
      button.dataset.vcFocus = `more-route-${route.id}`;
      if (route.id === activeRoute) button.setAttr("aria-current", "page");
      button.addEventListener("click", () => void this.navigate(route.id));
    }
  }
  setMoreOpen(open, restoreFocus) {
    this.moreOpen = open;
    const panel = this.contentEl.querySelector(`#vc-control-more-${this.instanceId}`);
    panel?.toggleClass("is-open", open);
    panel?.setAttr("data-open", String(open));
    panel?.setAttr("aria-hidden", String(!open));
    this.moreTrigger?.setAttr("aria-expanded", String(open));
    if (restoreFocus) window.setTimeout(() => this.moreTrigger?.focus({ preventScroll: true }), 0);
  }
  renderRoute(container, route, live) {
    switch (route) {
      case "home":
        this.renderLiveSummary(container, live);
        this.renderLiveEdgeRouter(container, live);
        this.renderFavorites(container);
        this.renderRecentActions(container, 5);
        this.renderRouteActions(container, route, /* @__PURE__ */ new Set([
          "open-latest-played",
          "open-current-state",
          "open-current-leads"
        ]));
        return;
      case "world":
        this.renderEntityNavigator(container);
        this.renderRouteActions(container, route);
        return;
      case "system":
        this.renderRouteActions(container, route);
        this.renderCapabilityInventory(container);
        this.renderContextPolicy(container);
        this.renderHealth(container);
        this.renderRecentActions(container, 20);
        this.renderTransactions(container);
        this.renderRecentRuns(container);
        return;
      default:
        this.renderRouteActions(container, route);
    }
  }
  renderContext(container, live) {
    const scrim = container.createDiv({
      cls: `vc-control-context-scrim${this.contextOpen ? " is-open" : ""}`,
      attr: { "data-open": String(this.contextOpen), "aria-hidden": "true" }
    });
    scrim.addEventListener("click", () => this.closeContext(true));
    const aside = container.createEl("aside", {
      cls: `vc-control-context${this.contextOpen ? " is-open" : ""}`,
      attr: {
        id: `vc-control-context-${this.instanceId}`,
        "data-open": String(this.contextOpen),
        "aria-label": "Observed campaign context",
        role: this.contextOpen ? "dialog" : "complementary",
        ...this.contextOpen ? { "aria-modal": "true" } : {}
      }
    });
    const header = aside.createEl("header");
    header.createEl("h2", { text: "Observed context" });
    const close = header.createEl("button", { cls: "vc-control-context-close" });
    close.type = "button";
    close.dataset.vcFocus = "context-close";
    close.setAttr("aria-label", "Close observed context");
    const closeIcon = close.createSpan();
    closeIcon.setAttr("aria-hidden", "true");
    (0, import_obsidian3.setIcon)(closeIcon, "x");
    close.addEventListener("click", () => this.closeContext(true));
    const truth = aside.createEl("section", { cls: "vc-control-context-section" });
    truth.createEl("h3", { text: "Live truth" });
    const truthList = truth.createEl("dl");
    this.addMetric(truthList, "Latest", live.latestLabel);
    this.addMetric(truthList, "Deployment", live.deploymentMode);
    this.addMetric(truthList, "Next", live.nextSession === null ? "Not declared" : `Session ${live.nextSession}`);
    this.addMetric(truthList, "Lead tasks", String(live.openLeadTasks));
    const room = aside.createEl("section", { cls: "vc-control-context-section" });
    room.createEl("h3", { text: "Explicit active room" });
    room.createEl("strong", { text: live.activeSessionName ?? "Not selected" });
    room.createEl("code", { text: live.activeSessionRoom ?? "No plugin-local room is active." });
    const policy = aside.createEl("section", { cls: "vc-control-context-section" });
    policy.createEl("h3", { text: "Guardrails" });
    policy.createEl("p", {
      text: `${this.plugin.settings.activeContextProfile}; ${CAPABILITY_POLICY.aiWriteMode}; ${CAPABILITY_POLICY.canonPromotion}.`
    });
  }
  async navigate(route, pushHistory = true, focusTarget) {
    if (pushHistory) this.routeHistory.push(route);
    this.contextOpen = false;
    this.moreOpen = false;
    await this.plugin.setActiveRoute(route);
    const target = focusTarget ? this.contentEl.querySelector(`[data-vc-section="${focusTarget}"]`) : null;
    if (target) {
      target.scrollIntoView({ block: "start" });
      target.focus({ preventScroll: true });
    } else {
      this.contentEl.scrollTop = 0;
      this.focusRouteHeading();
    }
    const definition = ROUTE_DEFINITIONS.find((candidate) => candidate.id === route);
    this.announce(`${definition?.label ?? route} route opened.`);
  }
  openCommandSearch(opener) {
    this.announce("Command search opened.");
    this.plugin.openCommandSearch(opener, (message) => this.announce(message));
  }
  openContext() {
    this.contextOpen = true;
    const aside = this.contentEl.querySelector(`#vc-control-context-${this.instanceId}`);
    const scrim = this.contentEl.querySelector(".vc-control-context-scrim");
    aside?.addClass("is-open");
    aside?.setAttr("data-open", "true");
    aside?.setAttr("role", "dialog");
    aside?.setAttr("aria-modal", "true");
    scrim?.addClass("is-open");
    scrim?.setAttr("data-open", "true");
    this.contextTrigger?.setAttr("aria-expanded", "true");
    window.setTimeout(() => aside?.querySelector(".vc-control-context-close")?.focus(), 0);
  }
  closeContext(restoreFocus) {
    this.contextOpen = false;
    const aside = this.contentEl.querySelector(`#vc-control-context-${this.instanceId}`);
    const scrim = this.contentEl.querySelector(".vc-control-context-scrim");
    aside?.removeClass("is-open");
    aside?.setAttr("data-open", "false");
    aside?.setAttr("role", "complementary");
    aside?.removeAttribute("aria-modal");
    scrim?.removeClass("is-open");
    scrim?.setAttr("data-open", "false");
    this.contextTrigger?.setAttr("aria-expanded", "false");
    if (restoreFocus) window.setTimeout(() => this.contextTrigger?.focus({ preventScroll: true }), 0);
  }
  trapContextFocus(event) {
    const aside = this.contentEl.querySelector(`#vc-control-context-${this.instanceId}`);
    if (!aside) return false;
    const focusable = [...aside.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter(
      (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true" && element.getClientRects().length > 0
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return false;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !aside.contains(active))) {
      event.preventDefault();
      last.focus();
      return true;
    }
    if (!event.shiftKey && (active === last || !aside.contains(active))) {
      event.preventDefault();
      first.focus();
      return true;
    }
    return false;
  }
  reconcileContextPresentation() {
    const morePanel = this.contentEl.querySelector(`#vc-control-more-${this.instanceId}`);
    if (this.moreOpen && morePanel && window.getComputedStyle(morePanel).display === "none") {
      this.setMoreOpen(false, false);
    }
    if (!this.contextOpen) return;
    const aside = this.contentEl.querySelector(`#vc-control-context-${this.instanceId}`);
    const close = aside?.querySelector(".vc-control-context-close");
    if (!aside || !close || window.getComputedStyle(close).display !== "none") return;
    const restoreHeading = aside.contains(document.activeElement);
    this.closeContext(false);
    if (restoreHeading) window.setTimeout(() => this.focusRouteHeading(), 0);
    this.announce("Observed context changed from a modal drawer to the persistent context pane.");
  }
  focusRouteHeading() {
    this.contentEl.querySelector(`#vc-control-route-heading-${this.instanceId}`)?.focus({ preventScroll: true });
  }
  restoreFocus(key) {
    const target = [...this.contentEl.querySelectorAll("[data-vc-focus]")].find(
      (element) => element.dataset.vcFocus === key
    );
    if (target) window.setTimeout(() => target.focus({ preventScroll: true }), 0);
  }
  addMetric(container, label, value) {
    const item = container.createDiv({ cls: "vc-control-metric" });
    item.createEl("dt", { text: label });
    item.createEl("dd", { text: value });
  }
  renderLiveSummary(container, live) {
    const header = container.createEl("section", { cls: "vc-control-hero", attr: { "aria-label": "Campaign summary" } });
    const identity = header.createDiv({ cls: "vc-control-identity" });
    identity.createDiv({ cls: "vc-control-eyebrow", text: "LOCAL / OBSERVED / NO INFERENCE" });
    identity.createEl("h2", { text: "Campaign systems online" });
    identity.createEl("p", { text: "Canonical notes, installed capabilities, and reviewed local automation in one shell." });
    const telemetry = header.createEl("dl", { cls: "vc-control-telemetry" });
    this.addMetric(telemetry, "Latest played", live.latestLabel);
    this.addMetric(telemetry, "Deployment", live.deploymentMode);
    this.addMetric(telemetry, "Next session", live.nextSession === null ? "NOT DECLARED" : `SESSION ${live.nextSession}`);
    this.addMetric(telemetry, "Open lead tasks", String(live.openLeadTasks));
    this.addMetric(telemetry, "Active room", live.activeSessionName ?? "NOT SELECTED");
  }
  renderLiveEdgeRouter(container, live) {
    const section = container.createEl("section", {
      cls: "vc-control-router",
      attr: { "data-vc-section": "live-edge", tabindex: "-1", "aria-label": "Live Edge Router" }
    });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "Live Edge Router" });
    heading.createSpan({ text: "OBSERVE / NO INFERENCE" });
    const grid = section.createDiv({ cls: "vc-control-router-grid" });
    const facts = [
      ["Latest played", live.latestLabel],
      ["Deployment mode", live.deploymentMode],
      ["Current State next_session", live.nextSession === null ? "not declared as a positive integer" : String(live.nextSession)],
      ["Explicit active room", live.activeSessionRoom ?? "not selected"]
    ];
    for (const [label, value] of facts) {
      const card = grid.createDiv({ cls: "vc-control-router-card" });
      card.createEl("strong", { text: label });
      card.createEl("span", { text: value });
    }
    const actions = section.createDiv({ cls: "vc-control-router-actions" });
    for (const id of ["open-latest-played", "open-current-state", "open-current-leads", "set-active-session-room"]) {
      const action = ACTION_BY_ID.get(id);
      if (action) this.renderActionShell(actions, action, true, "router");
    }
  }
  renderRouteActions(container, route, excluded = /* @__PURE__ */ new Set()) {
    const actions = CONTROL_ACTIONS.filter((action) => action.route === route && !excluded.has(action.id));
    const section = container.createEl("section", { cls: "vc-control-section" });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "Route actions" });
    heading.createSpan({ text: `${actions.length} compiled controls` });
    if (!shouldGroupRouteActions(actions.length)) {
      const grid = section.createDiv({ cls: "vc-control-grid" });
      for (const action of actions) this.renderActionShell(grid, action, false, `route-${route}`);
      return;
    }
    const groups = groupRouteActions(actions);
    const groupNav = section.createEl("nav", {
      cls: "vc-control-group-nav",
      attr: { "aria-label": `${route} action groups` }
    });
    const groupLinks = groupNav.createEl("ul");
    for (const bucket of groups) {
      const groupId = `vc-control-action-group-${this.instanceId}-${route}-${attributeToken(bucket.group) ?? "group"}`;
      const item = groupLinks.createEl("li");
      const link = item.createEl("a", { href: `#${groupId}`, text: `${bucket.group} (${bucket.actions.length})` });
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const target = this.contentEl.querySelector(`#${groupId}`);
        target?.scrollIntoView({ block: "start" });
        target?.focus({ preventScroll: true });
      });
    }
    for (const bucket of groups) {
      const groupId = `vc-control-action-group-${this.instanceId}-${route}-${attributeToken(bucket.group) ?? "group"}`;
      const group = section.createEl("section", { cls: "vc-control-action-group" });
      group.createEl("h3", { text: bucket.group, attr: { id: groupId, tabindex: "-1" } });
      const grid = group.createDiv({ cls: "vc-control-grid" });
      for (const action of bucket.actions) this.renderActionShell(grid, action, false, `route-${route}`);
    }
  }
  renderActionShell(container, action, compact, scope) {
    const shell = container.createDiv({ cls: "vc-control-action-shell" });
    shell.appendChild(this.plugin.createActionButton(action, "view", `${scope}-${action.id}`, compact));
    const favorite = shell.createEl("button", { cls: "vc-control-favorite-toggle" });
    const selected = this.plugin.settings.favoriteActionIds.includes(action.id);
    favorite.type = "button";
    favorite.dataset.vcFocus = `favorite-${scope}-${action.id}`;
    favorite.setAttr("aria-label", `${selected ? "Remove" : "Add"} ${action.title} ${selected ? "from" : "to"} favorites`);
    favorite.setAttr("aria-pressed", String(selected));
    const icon = favorite.createSpan();
    icon.setAttr("aria-hidden", "true");
    (0, import_obsidian3.setIcon)(icon, "star");
    favorite.addEventListener("click", () => void this.plugin.toggleFavoriteAction(action.id));
  }
  renderFavorites(container) {
    const section = container.createEl("section", { cls: "vc-control-favorites" });
    const header = section.createEl("header");
    header.createEl("h2", { text: "Favorites" });
    header.createSpan({ text: `${this.plugin.settings.favoriteActionIds.length} / 12` });
    const actions = this.plugin.settings.favoriteActionIds.flatMap((id) => {
      const action = ACTION_BY_ID.get(id);
      return action ? [action] : [];
    });
    section.toggleClass("is-empty", actions.length === 0);
    if (actions.length === 0) {
      section.createEl("p", { cls: "vc-control-empty", text: "Use the star beside any route action to pin it here." });
      return;
    }
    const list = section.createEl("ul", { cls: "vc-control-compact-list" });
    for (const action of actions) {
      const item = list.createEl("li");
      this.renderActionShell(item, action, true, "favorite");
    }
  }
  renderRecentActions(container, limit) {
    const section = container.createEl("section", { cls: "vc-control-recents" });
    const header = section.createEl("header");
    header.createEl("h2", { text: limit === 5 ? "Recent actions" : "Activity stream" });
    header.createSpan({ text: "Plugin-local metadata only" });
    const records = this.plugin.settings.recentActions.slice(0, limit);
    section.toggleClass("is-empty", records.length === 0);
    if (records.length === 0) {
      section.createEl("p", { cls: "vc-control-empty", text: "No control-plane action has been attempted yet." });
      return;
    }
    const list = section.createEl("ol", { cls: "vc-control-compact-list" });
    for (const record of records) {
      const action = ACTION_BY_ID.get(record.actionId);
      if (!action) continue;
      const item = list.createEl("li", { cls: `vc-control-recent-item${record.success ? "" : " is-fail"}` });
      item.createEl("strong", { text: action.title });
      item.createEl("time", { text: new Date(record.timestamp).toLocaleString(), attr: { datetime: record.timestamp } });
      const resultLabel = record.success ? successfulActionReceipt(action).label : "ATTENTION";
      item.createSpan({ text: `${action.verb} / ${action.route.toUpperCase()} / ${resultLabel}` });
      item.createEl("code", { text: action.id });
    }
  }
  renderEntityNavigator(container) {
    const headingId = `vc-control-entity-heading-${this.instanceId}`;
    const countId = `vc-control-entity-count-${this.instanceId}`;
    const resultsId = `vc-control-entity-results-${this.instanceId}`;
    const section = container.createEl("section", {
      cls: "vc-control-section",
      attr: { "data-vc-section": "entity-navigator", tabindex: "-1", "aria-labelledby": headingId }
    });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "Entity Navigator", attr: { id: headingId } });
    heading.createSpan({ text: "CACHED FRONTMATTER / FIXED ROOTS" });
    const index = this.plugin.getEntityIndex();
    const toolbar = section.createDiv({ cls: "vc-control-entity-toolbar" });
    const searchLabel = toolbar.createEl("label", { cls: "vc-control-entity-search" });
    searchLabel.createSpan({ text: "Search entities" });
    const search = searchLabel.createEl("input", {
      type: "search",
      value: this.entityQuery,
      placeholder: "Title, alias, tag, status, or path"
    });
    search.dataset.vcFocus = "entity-search";
    search.setAttr("aria-controls", `${countId} ${resultsId}`);
    search.setAttr("aria-describedby", countId);
    const filters = toolbar.createDiv({ cls: "vc-control-entity-filters" });
    const typeLabel = filters.createEl("label", { cls: "vc-control-entity-filter" });
    typeLabel.createSpan({ text: "Type" });
    const typeSelect = typeLabel.createEl("select");
    typeSelect.dataset.vcFocus = "entity-type";
    typeSelect.setAttr("aria-controls", `${countId} ${resultsId}`);
    typeSelect.setAttr("aria-describedby", countId);
    const statusLabel = filters.createEl("label", { cls: "vc-control-entity-filter" });
    statusLabel.createSpan({ text: "Status" });
    const statusSelect = statusLabel.createEl("select");
    statusSelect.dataset.vcFocus = "entity-status";
    statusSelect.setAttr("aria-controls", `${countId} ${resultsId}`);
    statusSelect.setAttr("aria-describedby", countId);
    const count = section.createEl("p", { cls: "vc-control-entity-count", attr: { id: countId } });
    const results = section.createEl("ul", {
      cls: "vc-control-entity-results",
      attr: { id: resultsId, "aria-labelledby": headingId, "aria-describedby": countId }
    });
    const cancelPendingSearch = () => {
      if (this.entitySearchTimer !== null) window.clearTimeout(this.entitySearchTimer);
      this.entitySearchTimer = null;
      results.removeClass("is-loading");
    };
    const update = (announce = true) => {
      const filtered = filterEntityIndex(index, {
        query: this.entityQuery,
        types: this.entityType ? [this.entityType] : [],
        statuses: this.entityStatus ? [this.entityStatus] : []
      });
      typeSelect.empty();
      typeSelect.createEl("option", { text: "All types", value: "" });
      for (const facet of filtered.facets.types) {
        typeSelect.createEl("option", { text: `${facet.label} (${facet.count})`, value: facet.value });
      }
      typeSelect.value = this.entityType;
      statusSelect.empty();
      statusSelect.createEl("option", { text: "All statuses", value: "" });
      for (const facet of filtered.facets.statuses) {
        statusSelect.createEl("option", { text: `${facet.label} (${facet.count})`, value: facet.value });
      }
      if (this.entityStatus && !filtered.facets.statuses.some((facet) => facet.value === this.entityStatus)) {
        statusSelect.createEl("option", { text: `${this.entityStatus} (0)`, value: this.entityStatus });
      }
      statusSelect.value = this.entityStatus;
      count.setText(
        filtered.truncated ? `Showing ${filtered.shown} of ${filtered.total} matching entities (render cap ${filtered.limit}).` : `Showing ${filtered.shown} of ${filtered.total} matching entities.`
      );
      results.empty();
      results.toggleClass("is-empty", filtered.items.length === 0);
      if (filtered.items.length === 0) {
        results.createEl("li", { text: "No indexed entity matches the current fixed filters." });
      } else {
        for (const entry of filtered.items) this.renderEntityResult(results, entry);
      }
      if (announce) this.announce(`${filtered.total} entities match; ${filtered.shown} shown.`);
    };
    search.addEventListener("input", () => {
      this.entityQuery = search.value;
      cancelPendingSearch();
      results.addClass("is-loading");
      this.entitySearchTimer = window.setTimeout(() => {
        this.entitySearchTimer = null;
        results.removeClass("is-loading");
        update();
      }, ENTITY_SEARCH_DEBOUNCE_MS);
    });
    typeSelect.addEventListener("change", () => {
      cancelPendingSearch();
      this.entityType = ENTITY_TYPES.includes(typeSelect.value) ? typeSelect.value : "";
      update();
    });
    statusSelect.addEventListener("change", () => {
      cancelPendingSearch();
      this.entityStatus = statusSelect.value;
      update();
    });
    update(false);
  }
  renderEntityResult(container, entry) {
    const token = `${this.instanceId}-${stableDomIdToken(entry.path)}`;
    const titleId = `vc-control-entity-title-${token}`;
    const pathId = `vc-control-entity-path-${token}`;
    const badgesId = `vc-control-entity-badges-${token}`;
    const item = container.createEl("li");
    const button = item.createEl("button", { cls: "vc-control-entity-result" });
    button.type = "button";
    button.dataset.vcFocus = `entity-${entry.path}`;
    button.setAttr("aria-labelledby", titleId);
    button.setAttr("aria-describedby", `${pathId} ${badgesId}`);
    const copy = button.createSpan({ cls: "vc-control-entity-result-copy" });
    copy.createSpan({ cls: "vc-control-entity-result-title", text: entry.title, attr: { id: titleId } });
    copy.createSpan({ cls: "vc-control-entity-result-path", text: entry.path, attr: { id: pathId } });
    const badges = button.createSpan({ cls: "vc-control-entity-badges", attr: { id: badgesId } });
    badges.createSpan({ cls: "vc-control-entity-badge", text: entry.type.toUpperCase() });
    if (entry.status) badges.createSpan({ cls: "vc-control-entity-badge", text: entry.status });
    if (entry.audience) badges.createSpan({ cls: "vc-control-entity-badge", text: `AUDIENCE ${entry.audience}` });
    if (entry.canonStatus) badges.createSpan({ cls: "vc-control-entity-badge", text: `CANON ${entry.canonStatus}` });
    button.addEventListener("click", () => void this.plugin.openEntityPath(entry.path));
  }
  renderCapabilityInventory(container) {
    const section = container.createEl("section", {
      cls: "vc-control-health vc-control-capabilities",
      attr: { "aria-label": "Interface capability registry" }
    });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "Interface stack" });
    heading.createSpan({ text: "FIXED OWNERS / LOCAL STATUS / REPLACEMENT BOUNDARIES" });
    const list = section.createEl("ul", { cls: "vc-control-capability-list" });
    for (const capability of INTERFACE_CAPABILITIES) {
      const status = capabilityRuntimeStatus(capability, {
        pluginEnabled: (id) => this.plugin.pluginEnabled(id),
        commandAvailable: (id) => this.plugin.commandAvailable(id)
      });
      const item = list.createEl("li", { cls: `is-${status.state}` });
      item.createEl("span", {
        cls: "vc-control-health-state",
        text: status.state.toUpperCase()
      });
      const copy = item.createDiv({ cls: "vc-control-capability-copy" });
      copy.createEl("strong", { text: capability.capability });
      copy.createSpan({ text: `Owner: ${capability.owner}` });
      copy.createEl("small", { text: capability.boundary });
      copy.createEl("code", {
        text: status.required === 0 ? "No runtime requirements" : `${status.available}/${status.required} fixed requirements${status.missing.length ? `; missing ${status.missing.join(", ")}` : ""}`
      });
    }
  }
  renderRecentRuns(container) {
    const section = container.createEl("section", {
      cls: "vc-control-runs",
      attr: { "aria-label": "Recent local automation results" }
    });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "Recent automation" });
    heading.createSpan({ text: "Local; vault path redacted" });
    if (this.plugin.settings.recentRuns.length === 0) {
      section.createEl("p", {
        cls: "vc-control-empty",
        text: "No automation has run from this plugin yet."
      });
      return;
    }
    const list = section.createEl("ol", { cls: "vc-control-run-list" });
    for (const run of this.plugin.settings.recentRuns) {
      const item = list.createEl("li", { cls: run.ok ? "is-pass" : "is-fail" });
      const summary = item.createEl("details");
      const label = summary.createEl("summary");
      label.createSpan({ cls: "vc-control-run-state", text: run.ok ? "PASS" : "ATTENTION" });
      label.createSpan({ cls: "vc-control-run-title", text: run.title });
      label.createEl("time", { text: new Date(run.timestamp).toLocaleString() });
      summary.createEl("pre", { text: run.output || "No output." });
    }
  }
  renderContextPolicy(container) {
    const section = container.createEl("section", {
      cls: "vc-control-policy",
      attr: { "data-vc-section": "ai-policy", tabindex: "-1", "aria-label": "AI context policy" }
    });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "AI context and capability guardrails" });
    heading.createSpan({ text: `${CAPABILITY_POLICY.aiWriteMode} / ${CAPABILITY_POLICY.canonPromotion}` });
    const phases = section.createEl("ol", { cls: "vc-control-phase-list" });
    for (const phase of ["observe", "propose", "execute"]) {
      const item = phases.createEl("li");
      item.createEl("strong", { text: phase.toUpperCase() });
      item.createSpan({ text: CAPABILITY_POLICY[phase] });
    }
    const profiles = section.createDiv({ cls: "vc-control-profile-grid" });
    for (const profile of CONTEXT_PROFILES) {
      const card = profiles.createEl("button", { cls: "vc-control-profile" });
      card.type = "button";
      card.dataset.vcFocus = `context-profile-${profile.id}`;
      card.toggleClass("is-active", profile.id === this.plugin.settings.activeContextProfile);
      card.setAttr("aria-pressed", String(profile.id === this.plugin.settings.activeContextProfile));
      card.createEl("strong", { text: profile.title });
      card.createEl("small", { text: "Guarded configuration; provider enforcement is not verified." });
      card.createEl("span", { text: profile.description });
      card.createEl("code", { text: `${profile.audiences.join("+")} / ${profile.retrievalScopes.join("+")}` });
      card.addEventListener("click", () => void this.plugin.setActiveContextProfile(profile.id));
    }
  }
  renderHealth(container) {
    const section = container.createEl("section", {
      cls: "vc-control-health",
      attr: { "data-vc-section": "operations-health", tabindex: "-1", "aria-label": "Operations health" }
    });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "Operations health" });
    heading.createSpan({ text: "LOCAL CAPABILITY CONTRACT" });
    const list = section.createEl("ul", { cls: "vc-control-health-list" });
    for (const check of this.plugin.getHealthChecks()) {
      const item = list.createEl("li", { cls: `is-${check.state}` });
      item.createEl("span", { cls: "vc-control-health-state", text: check.state.toUpperCase() });
      item.createEl("strong", { text: check.label });
      item.createSpan({ text: check.detail });
    }
  }
  renderTransactions(container) {
    const section = container.createEl("section", { cls: "vc-control-transactions" });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "Reviewed transactions" });
    heading.createSpan({ text: "PLUGIN-LOCAL AUDIT RECEIPTS" });
    if (this.plugin.settings.recentTransactions.length === 0) {
      section.createEl("p", { cls: "vc-control-empty", text: "No reviewed mutation has executed yet." });
      return;
    }
    const list = section.createEl("ol", { cls: "vc-control-transaction-list" });
    for (const transaction of this.plugin.settings.recentTransactions) {
      const item = list.createEl("li", { cls: transaction.ok ? "is-pass" : "is-fail" });
      item.createEl("strong", { text: transaction.ok ? "APPLIED" : "ROLLED BACK" });
      item.createSpan({ text: `${transaction.title} \xB7 ${transaction.operationCount} operation(s)` });
      item.createEl("time", { text: new Date(transaction.timestamp).toLocaleString() });
      item.createEl("code", { text: transaction.id });
    }
  }
};
var ControlPlaneSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("vc-control-settings");
    containerEl.createEl("h2", { text: "Veiled Chicago Control Plane" });
    containerEl.createEl("p", {
      text: "The plugin never executes commands supplied by notes. Markdown control blocks can reference only compiled action IDs."
    });
    new import_obsidian3.Setting(containerEl).setName("Automatic workflow profiles").setDesc("Apply existing vcg-dashboard/session/dossier/data/map/handout classes by path and frontmatter without rewriting notes.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoProfiles).onChange(async (value) => {
        this.plugin.settings.autoProfiles = value;
        await this.plugin.saveSettings();
        this.plugin.applyProfilesToAllLeaves();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Startup surface").setDesc("Open or reuse one Control Plane tab when Obsidian's layout is ready, or leave the saved layout unchanged.").addDropdown(
      (dropdown) => dropdown.addOption("control-plane", "Control Plane").addOption("none", "Saved layout only").setValue(this.plugin.settings.startupSurface).onChange(async (value) => {
        this.plugin.settings.startupSurface = normalizeStartupSurface(value);
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Active AI context profile").setDesc("Retrieval policy contract only. Every profile remains read-only toward canonical owners.").addDropdown((dropdown) => {
      for (const profile of CONTEXT_PROFILES) dropdown.addOption(profile.id, profile.title);
      dropdown.setValue(this.plugin.settings.activeContextProfile).onChange(async (value) => {
        if (!isContextProfileId(value)) return;
        await this.plugin.setActiveContextProfile(value);
      });
    });
    new import_obsidian3.Setting(containerEl).setName("Explicit active session room").setDesc(
      this.plugin.settings.activeSessionRoom ? `${this.plugin.settings.activeSessionName ?? "Session room"}: ${this.plugin.settings.activeSessionRoom}` : "Not selected. The plugin will not infer a room from filenames or next_session."
    ).addButton(
      (button) => button.setButtonText("Select").onClick(() => void this.plugin.executeAction("set-active-session-room", "command"))
    ).addButton(
      (button) => button.setButtonText("Clear").setDisabled(!this.plugin.settings.activeSessionRoom).onClick(async () => {
        this.plugin.settings.activeSessionRoom = null;
        this.plugin.settings.activeSessionName = null;
        await this.plugin.saveSettings();
        this.display();
        await this.plugin.refreshViews();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Open notes in new tabs").setDesc("Keep the control plane visible while opening campaign surfaces.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.openNotesInNewTab).onChange(async (value) => {
        this.plugin.settings.openNotesInNewTab = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Enable local automation").setDesc("Allow the desktop app to call the audited Python wrapper with exact action IDs. Navigation remains available when disabled.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.automationEnabled).onChange(async (value) => {
        this.plugin.settings.automationEnabled = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshViews();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("Confirm process actions").setDesc("Require an in-app confirmation before starting or stopping the local map server.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.confirmScriptActions).onChange(async (value) => {
        this.plugin.settings.confirmScriptActions = value;
        await this.plugin.saveSettings();
      })
    );
    const mapSetting = new import_obsidian3.Setting(containerEl).setName("Local map URL").setDesc("Loopback HTTP URL used only as a fallback when the Veiled Chicago Map Custom Frame command is unavailable.");
    const mapErrorId = `vc-control-map-url-error-${crypto.randomUUID()}`;
    const mapError = mapSetting.descEl.createDiv({
      cls: "vc-control-setting-error",
      attr: { id: mapErrorId, role: "status", "aria-live": "polite" }
    });
    mapSetting.addText((text) => {
      text.inputEl.setAttr("aria-describedby", mapErrorId);
      const validate = (value) => {
        const trimmed = value.trim();
        const valid = Boolean(trimmed && isSafeMapUrl(trimmed));
        setFieldValidation(
          text.inputEl,
          mapError,
          valid,
          "Enter an http://127.0.0.1, http://localhost, or http://[::1] URL without credentials."
        );
        return valid;
      };
      text.setPlaceholder(DEFAULT_SETTINGS.mapUrl).setValue(this.plugin.settings.mapUrl).onChange(async (value) => {
        const trimmed = value.trim();
        if (validate(value)) {
          this.plugin.settings.mapUrl = trimmed;
          await this.plugin.saveSettings();
        }
      });
      validate(this.plugin.settings.mapUrl);
    });
    const timeoutSetting = new import_obsidian3.Setting(containerEl).setName("Automation timeout").setDesc("Seconds before a foreground audit is terminated. Range: 5\u2013300.");
    const timeoutErrorId = `vc-control-timeout-error-${crypto.randomUUID()}`;
    const timeoutError = timeoutSetting.descEl.createDiv({
      cls: "vc-control-setting-error",
      attr: { id: timeoutErrorId, role: "status", "aria-live": "polite" }
    });
    timeoutSetting.addText((text) => {
      text.inputEl.setAttr("aria-describedby", timeoutErrorId);
      const validate = (value) => {
        const parsed = Number.parseInt(value, 10);
        const valid = /^\d+$/.test(value.trim()) && Number.isFinite(parsed) && parsed >= 5 && parsed <= 300;
        setFieldValidation(text.inputEl, timeoutError, valid, "Enter a whole number from 5 through 300.");
        return valid ? parsed : null;
      };
      text.setValue(String(this.plugin.settings.scriptTimeoutSeconds)).onChange(async (value) => {
        const parsed = validate(value);
        if (parsed !== null) {
          this.plugin.settings.scriptTimeoutSeconds = parsed;
          await this.plugin.saveSettings();
        }
      });
      validate(String(this.plugin.settings.scriptTimeoutSeconds));
    });
  }
};
var VeiledChicagoControlPlane = class extends import_obsidian3.Plugin {
  settings = { ...DEFAULT_SETTINGS };
  runningActions = /* @__PURE__ */ new Set();
  profileAssignments = /* @__PURE__ */ new Map();
  attributeAssignments = /* @__PURE__ */ new Map();
  tabSelectSnapshots = /* @__PURE__ */ new Map();
  tabBoxSnapshots = /* @__PURE__ */ new Map();
  tabPanelSnapshots = /* @__PURE__ */ new Map();
  insertedStateLabels = /* @__PURE__ */ new Set();
  activeChildren = /* @__PURE__ */ new Set();
  pendingConfirmationModals = /* @__PURE__ */ new Set();
  pendingWorkflowModals = /* @__PURE__ */ new Set();
  pendingProposalModals = /* @__PURE__ */ new Set();
  pendingCommandSearchModals = /* @__PURE__ */ new Set();
  commandSearchRefreshPending = false;
  activationPromise = null;
  entityIndex = null;
  transactionInProgress = false;
  refreshTimer = null;
  statusButton = null;
  unloading = false;
  async onload() {
    this.unloading = false;
    await this.loadSettings();
    this.registerView(VIEW_TYPE, (leaf) => new ControlPlaneView(leaf, this));
    this.addRibbonIcon("radar", "Open Veiled Chicago Control Plane", () => void this.activateView());
    this.addSettingTab(new ControlPlaneSettingTab(this.app, this));
    for (const action of CONTROL_ACTIONS) {
      this.addCommand({
        id: action.id,
        name: action.title,
        checkCallback: (checking) => {
          const availability = this.getAvailability(action);
          if (!availability.available) return false;
          if (!checking) void this.executeAction(action.id, "command");
          return true;
        }
      });
    }
    this.registerMarkdownCodeBlockProcessor("vcg-control", (source, element) => {
      this.renderControlBlock(source, element);
    });
    this.registerMarkdownCodeBlockProcessor("ad-statblock", async (source, element, context) => {
      await this.renderAdStatblock(source, element, context.sourcePath);
    });
    this.registerMarkdownPostProcessor(() => this.scheduleRefresh(0));
    this.registerObsidianProtocolHandler("vc-control", (parameters) => {
      const actionId = typeof parameters.action === "string" ? parameters.action : "";
      void this.executeAction(actionId, "protocol");
    });
    const statusContainer = this.addStatusBarItem();
    this.statusButton = statusContainer.createEl("button", {
      cls: "vc-control-status-button",
      text: "VC / loading"
    });
    this.statusButton.type = "button";
    this.statusButton.setAttr("aria-label", "Open Veiled Chicago Control Plane");
    this.registerDomEvent(this.statusButton, "click", () => void this.activateView());
    this.registerEvent(this.app.workspace.on("file-open", () => this.scheduleRefresh()));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.scheduleRefresh()));
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file.path === CURRENT_STATE_PATH || file.path === CURRENT_LEADS_PATH) this.scheduleRefresh();
        if (deriveEntityType(file.path)) this.invalidateEntityIndex();
      })
    );
    this.app.workspace.onLayoutReady(() => {
      if (this.unloading) return;
      this.registerEvent(
        this.app.vault.on("create", (file) => {
          if (this.isEntityScopePath(file.path)) this.invalidateEntityIndex();
        })
      );
      this.registerEvent(
        this.app.vault.on("delete", (file) => {
          if (this.isEntityScopePath(file.path)) this.invalidateEntityIndex();
        })
      );
      this.registerEvent(
        this.app.vault.on("rename", (file, oldPath) => {
          if (this.isEntityScopePath(file.path) || this.isEntityScopePath(oldPath)) this.invalidateEntityIndex();
        })
      );
      this.scheduleRefresh(0);
      if (this.settings.startupSurface === "control-plane") void this.activateView();
    });
  }
  onunload() {
    this.unloading = true;
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    for (const modal of this.pendingConfirmationModals) modal.close();
    this.pendingConfirmationModals.clear();
    for (const modal of this.pendingWorkflowModals) modal.close();
    this.pendingWorkflowModals.clear();
    for (const modal of this.pendingProposalModals) modal.close();
    this.pendingProposalModals.clear();
    for (const modal of this.pendingCommandSearchModals) modal.close();
    this.pendingCommandSearchModals.clear();
    this.commandSearchRefreshPending = false;
    for (const child of this.activeChildren) {
      if (!child.killed) child.kill("SIGTERM");
    }
    this.activeChildren.clear();
    this.runningActions.clear();
    this.clearManagedProfiles();
    this.restoreWorkflowDom();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
  async loadSettings() {
    const saved = asRecord(await this.loadData());
    const actionIds = ACTION_BY_ID.keys();
    const timeout = Math.min(300, Math.max(5, Number(saved.scriptTimeoutSeconds) || DEFAULT_SETTINGS.scriptTimeoutSeconds));
    const outputLimit = Math.min(
      5e4,
      Math.max(2e3, Number(saved.maxOutputCharacters) || DEFAULT_SETTINGS.maxOutputCharacters)
    );
    const recentRuns = Array.isArray(saved.recentRuns) ? saved.recentRuns.filter(isRunRecord) : [];
    const recentTransactions = Array.isArray(saved.recentTransactions) ? saved.recentTransactions.filter(isTransactionRecord) : [];
    let activeSessionRoom = null;
    let activeSessionName = null;
    if (typeof saved.activeSessionRoom === "string") {
      try {
        activeSessionRoom = normalizeSessionRoomPath(saved.activeSessionRoom);
        if (typeof saved.activeSessionName !== "string") throw new Error("Missing active session name.");
        activeSessionName = normalizeSessionDisplayName(activeSessionRoom, saved.activeSessionName);
      } catch {
        activeSessionRoom = null;
        activeSessionName = null;
      }
    }
    this.settings = {
      automationEnabled: typeof saved.automationEnabled === "boolean" ? saved.automationEnabled : DEFAULT_SETTINGS.automationEnabled,
      autoProfiles: typeof saved.autoProfiles === "boolean" ? saved.autoProfiles : DEFAULT_SETTINGS.autoProfiles,
      openNotesInNewTab: typeof saved.openNotesInNewTab === "boolean" ? saved.openNotesInNewTab : DEFAULT_SETTINGS.openNotesInNewTab,
      confirmScriptActions: typeof saved.confirmScriptActions === "boolean" ? saved.confirmScriptActions : DEFAULT_SETTINGS.confirmScriptActions,
      mapUrl: typeof saved.mapUrl === "string" ? saved.mapUrl : DEFAULT_SETTINGS.mapUrl,
      scriptTimeoutSeconds: timeout,
      maxOutputCharacters: outputLimit,
      activeSessionRoom,
      activeSessionName,
      activeContextProfile: isContextProfileId(saved.activeContextProfile) ? saved.activeContextProfile : DEFAULT_SETTINGS.activeContextProfile,
      activeRoute: isPrimaryRoute(saved.activeRoute) ? saved.activeRoute : DEFAULT_SETTINGS.activeRoute,
      startupSurface: normalizeStartupSurface(saved.startupSurface),
      favoriteActionIds: normalizeFavoriteActionIds(saved.favoriteActionIds, actionIds),
      recentActions: normalizeRecentActions(saved.recentActions, ACTION_BY_ID.keys()),
      recentRuns: recentRuns.slice(0, 8).map((run) => ({
        ...run,
        output: this.redactLocalOutput(run.output).slice(-outputLimit)
      })),
      recentTransactions: recentTransactions.slice(0, 12),
      proposalReplayIds: Array.isArray(saved.proposalReplayIds) ? saved.proposalReplayIds.filter(
        (value) => typeof value === "string" && /^vcg-[a-z-]+-\d+-[a-f0-9]{8}$/.test(value)
      ).slice(0, 256) : []
    };
    if (!isSafeMapUrl(this.settings.mapUrl)) this.settings.mapUrl = DEFAULT_SETTINGS.mapUrl;
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async activateView(section) {
    let leaf;
    if (this.activationPromise) {
      leaf = await this.activationPromise;
    } else {
      const activation = this.activateControlPlaneLeaf();
      this.activationPromise = activation;
      try {
        leaf = await activation;
      } finally {
        if (this.activationPromise === activation) this.activationPromise = null;
      }
    }
    if (section && leaf.view instanceof ControlPlaneView) await leaf.view.navigateTo(section);
  }
  async activateControlPlaneLeaf() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    return leaf;
  }
  async setActiveRoute(route) {
    if (!isPrimaryRoute(route)) return;
    this.settings.activeRoute = route;
    await this.saveSettings();
    await this.refreshViews();
  }
  async setActiveContextProfile(profile) {
    this.settings.activeContextProfile = profile;
    await this.saveSettings();
    await this.refreshViews(`Context profile changed to ${profile}.`);
  }
  async refreshViews(announcement) {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof ControlPlaneView) await view.render(announcement);
    }
    await this.updateStatusButton();
  }
  scheduleRefresh(delay = 80) {
    if (this.unloading) return;
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      if (this.unloading) return;
      this.applyProfilesToAllLeaves();
      void this.refreshViews();
    }, delay);
  }
  openCommandSearch(opener, announce) {
    let modal;
    modal = new ControlActionSearchModal(this.app, {
      actions: CONTROL_ACTIONS,
      favoriteActionIds: this.settings.favoriteActionIds,
      recentActions: this.settings.recentActions,
      opener,
      getAvailability: (action) => this.getAvailability(action),
      onChoose: (action) => void this.executeAction(action.id, "view"),
      onUnavailable: (action, reason) => {
        new import_obsidian3.Notice(reason, 7e3);
        void this.tryRecordRecentAction(action.id, false);
        announce(`${action.title} is unavailable. ${reason}`);
      },
      onDismiss: () => {
        this.pendingCommandSearchModals.delete(modal);
        announce("Command search closed.");
        if (this.pendingCommandSearchModals.size === 0 && this.commandSearchRefreshPending) {
          this.commandSearchRefreshPending = false;
          window.setTimeout(() => {
            if (!this.unloading) void this.refreshViews();
          }, 50);
        }
      }
    });
    this.pendingCommandSearchModals.add(modal);
    modal.open();
  }
  async toggleFavoriteAction(actionId) {
    if (!ACTION_BY_ID.has(actionId)) return;
    const selected = this.settings.favoriteActionIds.includes(actionId);
    if (!selected && this.settings.favoriteActionIds.length >= 12) {
      new import_obsidian3.Notice("Favorites are limited to 12 compiled actions.", 6e3);
      this.announceToViews("Favorites remain unchanged; the 12-action limit is reached.");
      return;
    }
    const next = selected ? this.settings.favoriteActionIds.filter((candidate) => candidate !== actionId) : [...this.settings.favoriteActionIds, actionId];
    this.settings.favoriteActionIds = normalizeFavoriteActionIds(next, ACTION_BY_ID.keys());
    await this.saveSettings();
    const title = ACTION_BY_ID.get(actionId)?.title ?? actionId;
    await this.refreshViews(`${title} ${selected ? "removed from" : "added to"} favorites.`);
  }
  getEntityIndex() {
    if (this.entityIndex) return this.entityIndex;
    this.entityIndex = buildEntityIndex(
      this.app.vault.getMarkdownFiles().filter((file) => deriveEntityType(file.path) !== null).map((file) => ({
        path: file.path,
        basename: file.basename,
        frontmatter: asRecord(this.app.metadataCache.getFileCache(file)?.frontmatter)
      }))
    );
    return this.entityIndex;
  }
  async openEntityPath(path) {
    if (!deriveEntityType(path)) {
      new import_obsidian3.Notice("Entity navigation blocked a path outside the compiled roots.", 7e3);
      return;
    }
    try {
      await this.openFile(this.fileAt(path));
    } catch (error) {
      new import_obsidian3.Notice(error instanceof Error ? error.message : String(error), 7e3);
    }
  }
  invalidateEntityIndex() {
    this.entityIndex = null;
    if (this.settings.activeRoute === "world") this.scheduleRefresh();
  }
  isEntityScopePath(path) {
    if (deriveEntityType(path)) return true;
    return ENTITY_ROOT_REGISTRY.some(
      ({ root }) => path === root || path.startsWith(`${root}/`) || root.startsWith(`${path}/`)
    );
  }
  announceToViews(message) {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      if (leaf.view instanceof ControlPlaneView) leaf.view.announce(message);
    }
  }
  async readLiveState() {
    const stateFile = this.fileAt(CURRENT_STATE_PATH);
    const frontmatter2 = stateFile ? asRecord(this.app.metadataCache.getFileCache(stateFile)?.frontmatter) : {};
    const latestValue = frontmatter2.last_played_record;
    const latestTarget = wikilinkTarget(latestValue);
    const latestFile = latestTarget ? this.app.metadataCache.getFirstLinkpathDest(latestTarget, CURRENT_STATE_PATH) : null;
    const nextSession = parseExplicitNextSession(frontmatter2.next_session);
    return {
      latestLabel: wikilinkLabel(latestValue) || latestFile?.basename || "UNRESOLVED",
      latestFile,
      nextSession,
      deploymentMode: normalizeDeployment(frontmatter2.deployment_mode),
      openLeadTasks: await this.countOpenTasks(CURRENT_LEADS_PATH),
      stateModified: stateFile?.stat.mtime ?? null,
      activeSessionRoom: this.settings.activeSessionRoom,
      activeSessionName: this.settings.activeSessionName
    };
  }
  async countOpenTasks(path) {
    const file = this.fileAt(path);
    if (!file) return 0;
    const content = await this.app.vault.cachedRead(file);
    return (content.match(/^\s*[-*]\s+\[ \]\s+/gm) ?? []).length;
  }
  createActionButton(action, source, focusKey, compact = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vc-control-action";
    button.toggleClass("is-compact", compact);
    button.dataset.action = action.id;
    if (focusKey) button.dataset.vcFocus = focusKey;
    button.dataset.search = [
      action.id,
      action.title,
      action.description,
      action.group,
      action.route,
      action.verb,
      ...action.keywords ?? []
    ].join(" ").toLowerCase();
    const availability = this.getAvailability(action);
    const running = this.runningActions.has(action.id);
    const titleId = `vc-control-action-title-${crypto.randomUUID()}`;
    const descriptionId = `vc-control-action-description-${crypto.randomUUID()}`;
    const reasonId = availability.reason ? `vc-control-action-reason-${crypto.randomUUID()}` : null;
    button.setAttribute("aria-disabled", String(!availability.available));
    button.setAttribute("aria-busy", String(running));
    button.setAttribute("aria-labelledby", titleId);
    button.setAttribute("aria-describedby", [descriptionId, reasonId].filter(Boolean).join(" "));
    if (availability.reason) button.setAttribute("title", availability.reason);
    const icon = button.createSpan({ cls: "vc-control-action-icon" });
    icon.setAttr("aria-hidden", "true");
    (0, import_obsidian3.setIcon)(icon, running ? "loader-circle" : action.icon);
    const copy = button.createSpan({ cls: "vc-control-action-copy" });
    copy.createSpan({ cls: "vc-control-action-title", text: action.title, attr: { id: titleId } });
    copy.createSpan({
      cls: "vc-control-action-description",
      text: action.description,
      attr: { id: descriptionId }
    });
    if (availability.reason && reasonId) {
      copy.createSpan({
        cls: "vc-control-action-reason",
        text: `${availability.available ? "Fallback" : "Unavailable"}: ${availability.reason}`,
        attr: { id: reasonId }
      });
    }
    const state = button.createSpan({
      cls: "vc-control-action-state",
      text: running ? "RUNNING" : availability.available ? action.verb : "UNAVAILABLE"
    });
    if (running) button.addClass("is-running");
    button.addEventListener("click", () => void this.executeAction(action.id, source));
    return button;
  }
  renderControlBlock(source, element) {
    element.empty();
    element.addClass("vc-control-block-host");
    try {
      const spec = parseControlBlock(source);
      const section = element.createEl("section", {
        cls: `vc-control-block${spec.compact ? " is-compact" : ""}`,
        attr: { "aria-label": spec.title }
      });
      const header = section.createEl("header");
      header.createEl("h3", { text: spec.title });
      header.createEl("p", { text: spec.subtitle });
      const grid = section.createDiv({ cls: "vc-control-block-grid" });
      for (const actionId of spec.actions) {
        const action = ACTION_BY_ID.get(actionId);
        if (action) grid.appendChild(this.createActionButton(action, "block"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const alert = element.createEl("div", {
        cls: "vc-control-block-error",
        attr: { role: "alert" }
      });
      alert.createEl("strong", { text: "Invalid vcg-control block" });
      alert.createEl("p", { text: message });
    }
  }
  async renderAdStatblock(source, element, sourcePath) {
    element.empty();
    element.addClass("vc-ad-statblock-host");
    const spec = parseAdStatblock(source);
    const section = element.createEl("section", { cls: "vc-ad-statblock" });
    const titleId = `vc-ad-statblock-title-${crypto.randomUUID()}`;
    section.setAttr("aria-labelledby", titleId);
    const header = section.createEl("header", { cls: "vc-ad-statblock-header" });
    header.createEl("h3", { text: spec.title, attr: { id: titleId } });
    header.createSpan({ text: "REFERENCE / NON-EXECUTABLE MARKDOWN" });
    const body = section.createDiv({ cls: "vc-ad-statblock-body" });
    const safeMarkdown = sanitizeAdStatblockMarkdown(spec.markdown);
    if (!safeMarkdown) {
      body.createEl("p", { cls: "vc-control-empty", text: "No statblock details were supplied." });
      return;
    }
    try {
      await import_obsidian3.MarkdownRenderer.render(this.app, safeMarkdown, body, sourcePath, this);
    } catch (error) {
      body.empty();
      const alert = body.createEl("div", { cls: "vc-control-block-error", attr: { role: "alert" } });
      alert.createEl("strong", { text: "Statblock rendering failed" });
      alert.createEl("p", { text: error instanceof Error ? error.message : String(error) });
    }
  }
  getAvailability(action) {
    if (this.runningActions.has(action.id)) return { available: false, reason: "Action is already running." };
    if (action.desktopOnly && !import_obsidian3.Platform.isDesktopApp) return { available: false, reason: "Desktop Obsidian is required." };
    switch (action.kind) {
      case "note":
        return this.fileAt(action.target ?? "") ? { available: true } : { available: false, reason: `Missing note: ${action.target ?? "unknown"}` };
      case "dynamic-note": {
        const target = this.resolveDynamicFile(action.target ?? "");
        return target.available;
      }
      case "command":
        return action.target && this.commandAvailable(action.target) ? { available: true } : { available: false, reason: `Required plugin command is unavailable: ${action.target ?? "unknown"}` };
      case "integration":
        if (action.target && this.commandAvailable(action.target)) return { available: true };
        return isSafeMapUrl(this.settings.mapUrl) ? { available: true, reason: "Custom Frame unavailable; opens the configured browser URL." } : { available: false, reason: "No valid integration URL or Custom Frame command." };
      case "workflow":
        if (["create-managed-note", "capture-quick-inbox", "set-active-session-room"].includes(action.id)) {
          return { available: true };
        }
        return this.settings.activeSessionRoom && this.settings.activeSessionName ? { available: true } : { available: false, reason: "Select an explicit active session room first." };
      case "script":
        if (!this.settings.automationEnabled) return { available: false, reason: "Local automation is disabled in plugin settings." };
        if (!import_obsidian3.Platform.isMacOS) {
          return { available: false, reason: "The reviewed automation wrapper currently requires macOS/POSIX process tools." };
        }
        if (!(this.app.vault.adapter instanceof import_obsidian3.FileSystemAdapter)) {
          return { available: false, reason: "The vault has no local filesystem adapter." };
        }
        return this.fileAt(VAULT_PATHS.controlWrapper) ? { available: true } : { available: false, reason: `Missing ${VAULT_PATHS.controlWrapper}.` };
      case "external":
        return action.target && /^https?:\/\//i.test(action.target) ? { available: true } : { available: false, reason: "External URL is invalid." };
      default:
        return { available: true };
    }
  }
  async executeAction(actionId, source) {
    const action = ACTION_BY_ID.get(actionId);
    if (!action) {
      new import_obsidian3.Notice(`Veiled Chicago Control Plane: unknown action '${actionId || "(empty)"}'.`);
      return;
    }
    const protocolBlock = this.protocolBlockReason(action, source);
    if (protocolBlock) {
      new import_obsidian3.Notice(protocolBlock);
      await this.tryRecordRecentAction(action.id, false);
      this.announceToViews(`${action.title} was blocked by protocol policy.`);
      return;
    }
    const availability = this.getAvailability(action);
    if (!availability.available) {
      new import_obsidian3.Notice(availability.reason ?? `${action.title} is unavailable.`);
      await this.tryRecordRecentAction(action.id, false);
      this.announceToViews(`${action.title} is unavailable. ${availability.reason ?? ""}`.trim());
      return;
    }
    if (action.confirm && (action.id === "start-audio-recorder" || this.settings.confirmScriptActions)) {
      let modal;
      modal = new ConfirmActionModal(
        this.app,
        action.confirm,
        () => {
          if (this.unloading) return;
          const currentProtocolBlock = this.protocolBlockReason(action, source);
          if (currentProtocolBlock) {
            new import_obsidian3.Notice(currentProtocolBlock);
            void this.tryRecordRecentAction(action.id, false);
            return;
          }
          const currentAvailability = this.getAvailability(action);
          if (!currentAvailability.available) {
            new import_obsidian3.Notice(currentAvailability.reason ?? `${action.title} is unavailable.`);
            void this.tryRecordRecentAction(action.id, false);
            return;
          }
          void this.performAndRecordAction(action);
        },
        (confirmed) => {
          this.pendingConfirmationModals.delete(modal);
          if (confirmed || this.unloading) return;
          void this.tryRecordRecentAction(action.id, false);
          this.announceToViews(`${action.title} was canceled.`);
        }
      );
      this.pendingConfirmationModals.add(modal);
      modal.open();
      return;
    }
    await this.performAndRecordAction(action);
  }
  async performAndRecordAction(action) {
    try {
      await this.performAction(action);
      const success = action.kind !== "script" || this.settings.recentRuns.find((record) => record.actionId === action.id)?.ok === true;
      await this.tryRecordRecentAction(action.id, success);
      const outcome = success ? successfulActionReceipt(action).announcement : "attention required";
      this.announceToViews(`${action.title}: ${outcome}.`);
    } catch (error) {
      await this.tryRecordRecentAction(action.id, false);
      this.reportActionError(action.title, error);
    }
  }
  async tryRecordRecentAction(actionId, success) {
    try {
      await this.recordRecentAction(actionId, success);
    } catch (error) {
      new import_obsidian3.Notice(
        `Activity receipt could not be saved: ${error instanceof Error ? error.message : String(error)}`,
        1e4
      );
    }
  }
  async recordRecentAction(actionId, success) {
    this.settings.recentActions = normalizeRecentActions(
      [{ actionId, success, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, ...this.settings.recentActions],
      ACTION_BY_ID.keys()
    );
    await this.saveSettings();
    if (this.pendingCommandSearchModals.size === 0) {
      await this.refreshViews();
    } else {
      this.commandSearchRefreshPending = true;
    }
  }
  reportActionError(title, error) {
    const message = error instanceof Error ? error.message : String(error);
    new import_obsidian3.Notice(`${title}: ${message}`, 12e3);
    this.announceToViews(`${title} failed. ${message}`);
  }
  async performAction(action) {
    switch (action.kind) {
      case "view":
        await this.activateView(action.target);
        break;
      case "note":
        await this.openFile(this.fileAt(action.target ?? ""));
        break;
      case "dynamic-note": {
        const resolution = this.resolveDynamicFile(action.target ?? "");
        await this.openFile(resolution.file);
        break;
      }
      case "command":
        if (!action.target || !this.executeCommand(action.target)) {
          throw new Error(`Could not execute the fixed command adapter for ${action.title}.`);
        }
        break;
      case "integration":
        if (action.target && this.commandAvailable(action.target)) {
          if (!this.executeCommand(action.target)) {
            throw new Error(`Could not execute the fixed integration adapter for ${action.title}.`);
          }
        } else {
          openExternalUrl(this.settings.mapUrl);
        }
        break;
      case "external":
        if (action.target) openExternalUrl(action.target);
        break;
      case "workflow":
        await this.executeWorkflow(action.id);
        break;
      case "script":
        await this.runScriptAction(action);
        break;
    }
  }
  async openFile(file) {
    if (!file) {
      throw new Error("The requested campaign note could not be resolved.");
    }
    let existing = null;
    this.app.workspace.iterateAllLeaves((leaf2) => {
      if (existing) return;
      const view = leaf2.view;
      if (view instanceof import_obsidian3.FileView && view.file?.path === file.path) existing = leaf2;
    });
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return;
    }
    const leaf = this.app.workspace.getLeaf(this.settings.openNotesInNewTab ? "tab" : false);
    await leaf.openFile(file, { active: true });
    await this.app.workspace.revealLeaf(leaf);
  }
  resolveDynamicFile(target) {
    const stateFile = this.fileAt(CURRENT_STATE_PATH);
    const frontmatter2 = stateFile ? asRecord(this.app.metadataCache.getFileCache(stateFile)?.frontmatter) : {};
    if (target === "latest-played") {
      const link = wikilinkTarget(frontmatter2.last_played_record);
      const file = link ? this.app.metadataCache.getFirstLinkpathDest(link, CURRENT_STATE_PATH) : null;
      return file ? { file, available: { available: true } } : { file: null, available: { available: false, reason: "No latest played journal resolves from current state." } };
    }
    if (target === "next-session") {
      const next = parseExplicitNextSession(frontmatter2.next_session);
      if (next === null) {
        return {
          file: null,
          available: { available: false, reason: "Current State has no valid positive-integer next_session declaration." }
        };
      }
      const path = sessionControlRoomPath(next);
      const file = this.fileAt(path);
      return file ? { file, available: { available: true } } : { file: null, available: { available: false, reason: `Declared next session has no control room: ${path}` } };
    }
    const active = this.activeSession();
    const suffixes = {
      "active-session-control": "Control Room",
      "active-session-preflight": "Preflight",
      "active-session-readiness": "Readiness Board",
      "active-session-review": "Promotion Review"
    };
    const suffix = suffixes[target];
    if (suffix) {
      if (!active) {
        return {
          file: null,
          available: { available: false, reason: "No explicit active session room is selected." }
        };
      }
      const path = `${active.roomPath}/${active.displayName} ${suffix}.md`;
      const file = this.fileAt(path);
      return file ? { file, available: { available: true } } : { file: null, available: { available: false, reason: `Active room is missing ${suffix}: ${path}` } };
    }
    return { file: null, available: { available: false, reason: `Unknown dynamic target: ${target}` } };
  }
  getHealthChecks() {
    const active = this.activeSession();
    const fixedTools = [
      ["Obsidian CLI", "/opt/homebrew/bin/obsidian"],
      ["n8n", "/opt/homebrew/bin/n8n"],
      ["ffmpeg", "/opt/homebrew/bin/ffmpeg"],
      ["whisper-cli", "/opt/homebrew/bin/whisper-cli"]
    ];
    const checks = [
      {
        label: "Active session registry",
        state: active ? "pass" : "attention",
        detail: active ? `${active.displayName} \xB7 ${active.roomPath}` : "Not selected; filename inference remains disabled."
      },
      {
        label: "AI mutation policy",
        state: "info",
        detail: "Plugin mutations are proposal-only; external AI/provider enforcement is not verified."
      },
      {
        label: "Context profile",
        state: "info",
        detail: `${this.settings.activeContextProfile}; guarded configuration, not provider-enforced.`
      },
      {
        label: "Ollama contract",
        state: "info",
        detail: "Expected at 127.0.0.1:11434; this plugin performs no background network probe."
      },
      {
        label: "Automation wrapper",
        state: this.fileAt(VAULT_PATHS.controlWrapper) ? "pass" : "attention",
        detail: this.fileAt(VAULT_PATHS.controlWrapper) ? "Fixed-action wrapper present." : `${VAULT_PATHS.controlWrapper} is missing.`
      }
    ];
    for (const [label, path] of fixedTools) {
      checks.push({
        label,
        state: (0, import_node_fs.existsSync)(path) ? "pass" : "attention",
        detail: (0, import_node_fs.existsSync)(path) ? `Available at ${path}.` : `Not found at reviewed path ${path}.`
      });
    }
    checks.push({
      label: "Whisper model",
      state: (0, import_node_fs.existsSync)(`${process.env.HOME ?? ""}/.cache/openwhispr/whisper-models/ggml-base.bin`) ? "pass" : "attention",
      detail: "Transcription remains receipt-only until a separate reviewed runner is enabled."
    });
    return checks;
  }
  activeSession() {
    if (!this.settings.activeSessionRoom || !this.settings.activeSessionName) return null;
    return { roomPath: this.settings.activeSessionRoom, displayName: this.settings.activeSessionName };
  }
  async executeWorkflow(id) {
    switch (id) {
      case "create-managed-note":
        this.openManagedNoteWizard();
        return;
      case "capture-quick-inbox":
        this.openQuickCapture();
        return;
      case "set-active-session-room":
        this.openSessionRoomSelector();
        return;
      case "scaffold-active-session-room":
        this.proposeSessionScaffold();
        return;
      case "capture-player-declaration":
        this.openDeclarationCapture();
        return;
      case "generate-session-run":
        await this.proposeSessionRun();
        return;
      case "capture-live-event":
        this.openEventCapture();
        return;
      case "propose-local-transcription":
        this.openTranscriptionRequest();
        return;
      default:
        new import_obsidian3.Notice(`Unknown workflow action: ${id}`);
    }
  }
  openManagedNoteWizard() {
    const options = Object.fromEntries(MANAGED_NOTE_SCHEMAS.map((schema) => [schema.id, schema.title]));
    this.openWorkflowModal(
      "Create managed note",
      "Choose a schema and title. A second step collects required fields before an exact proposal is shown.",
      [
        { id: "schema", label: "Note type", type: "select", required: true, value: MANAGED_NOTE_SCHEMAS[0]?.id, options },
        { id: "title", label: "Title", type: "text", required: true, placeholder: "Canonical display title" }
      ],
      "Continue",
      (values) => {
        const schemaId = stringValue(values, "schema");
        const title = stringValue(values, "title");
        const schema = MANAGED_NOTE_SCHEMAS.find((candidate) => candidate.id === schemaId);
        if (!schema) throw new Error("The selected note schema is unavailable.");
        window.setTimeout(() => {
          if (this.unloading) return;
          this.openWorkflowModal(
            schema.title,
            `${schema.description} The result remains draft/future until separately reviewed.`,
            schema.fields.map((field) => ({
              id: field.id,
              label: field.label,
              type: "text",
              required: field.required,
              placeholder: field.placeholder,
              value: field.defaultValue
            })),
            "Review proposal",
            (fieldValues) => {
              const proposal = buildManagedNoteProposal({
                schemaId,
                title,
                fields: Object.fromEntries(
                  Object.entries(fieldValues).map(([key, value]) => [key, typeof value === "string" ? value : String(value)])
                ),
                createdDate: this.today(),
                proposalId: this.proposalId("note")
              });
              this.reviewProposal(proposal);
            }
          );
        }, 0);
      }
    );
  }
  openQuickCapture() {
    this.openWorkflowModal(
      "Quick capture",
      "Capture goes to the operations inbox as a timestamped candidate, never directly to canon.",
      [{ id: "text", label: "Capture", type: "textarea", required: true, placeholder: "Observation, question, correction, or idea" }],
      "Review proposal",
      (values) => {
        this.reviewProposal(
          buildQuickCaptureProposal({
            text: stringValue(values, "text"),
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            proposalId: this.proposalId("capture")
          })
        );
      }
    );
  }
  openSessionRoomSelector() {
    const active = this.activeSession();
    this.openWorkflowModal(
      "Select active session room",
      "This registry is plugin-local. It does not modify next_session, select a lead, establish chronology, or promote prep.",
      [
        {
          id: "path",
          label: "Vault-relative room path",
          type: "text",
          required: true,
          placeholder: `${VAULT_PATHS.sessionsRoot}/Session 9`,
          value: active?.roomPath ?? `${VAULT_PATHS.sessionsRoot}/`
        },
        {
          id: "name",
          label: "Display name",
          type: "text",
          required: true,
          placeholder: "Session 9",
          value: active?.displayName ?? ""
        }
      ],
      "Select room",
      async (values) => {
        const roomPath = normalizeSessionRoomPath(stringValue(values, "path"));
        const displayName = normalizeSessionDisplayName(roomPath, stringValue(values, "name"));
        this.settings.activeSessionRoom = roomPath;
        this.settings.activeSessionName = displayName;
        await this.saveSettings();
        await this.refreshViews();
        new import_obsidian3.Notice(`Active session room selected: ${displayName}. No canon or next-session field changed.`, 7e3);
      }
    );
  }
  proposeSessionScaffold() {
    const active = this.requireActiveSession();
    const proposal = buildSessionRoomProposal({
      roomPath: active.roomPath,
      displayName: active.displayName,
      createdDate: this.today(),
      proposalId: this.proposalId("room")
    });
    const operations = proposal.operations.filter((operation) => {
      const existing = this.app.vault.getAbstractFileByPath(operation.path);
      if (existing instanceof import_obsidian3.TFolder) throw new Error(`A folder blocks scaffold file: ${operation.path}`);
      return !(existing instanceof import_obsidian3.TFile);
    });
    if (operations.length === 0) {
      new import_obsidian3.Notice(`${active.displayName} already contains every scaffold file; nothing was proposed.`, 7e3);
      return;
    }
    this.reviewProposal({
      ...proposal,
      summary: `Create ${operations.length} missing draft workflow note(s) in ${active.roomPath}; existing files remain untouched.`,
      operations
    });
  }
  openDeclarationCapture() {
    const active = this.requireActiveSession();
    this.openWorkflowModal(
      "Record player declaration",
      "Record exact player wording. Corrections append new evidence and do not replace the original.",
      [
        { id: "speaker", label: "Speaker / owner", type: "text", required: true, placeholder: "Player, PC, or table consensus" },
        { id: "wording", label: "Verbatim wording", type: "textarea", required: true },
        {
          id: "disposition",
          label: "Disposition",
          type: "select",
          required: true,
          value: "accepted",
          options: {
            accepted: "Accepted",
            combined: "Combined",
            delegated: "Delegated",
            deferred: "Deferred",
            "player-named": "Player named"
          }
        }
      ],
      "Review evidence append",
      (values) => {
        this.reviewProposal(
          buildDeclarationProposal({
            roomPath: active.roomPath,
            displayName: active.displayName,
            wording: stringValue(values, "wording"),
            speaker: stringValue(values, "speaker"),
            disposition: stringValue(values, "disposition"),
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            proposalId: this.proposalId("declaration")
          })
        );
      }
    );
  }
  async proposeSessionRun() {
    const active = this.requireActiveSession();
    const intakePath = `${active.roomPath}/${active.displayName} Decision Intake.md`;
    const intake = this.fileAt(intakePath);
    const currentState = this.fileAt(CURRENT_STATE_PATH);
    const [decisionIntakeContents, currentStateContents] = await Promise.all([
      intake ? this.app.vault.read(intake) : Promise.resolve(null),
      currentState ? this.app.vault.read(currentState) : Promise.resolve(null)
    ]);
    const live = await this.readLiveState();
    const selectionEvidence = collectRunSelectionEvidence({
      roomPath: active.roomPath,
      displayName: active.displayName,
      decisionIntakeContents,
      currentStateContents
    });
    this.reviewProposal(
      buildRunProposal({
        roomPath: active.roomPath,
        displayName: active.displayName,
        selectionEvidence,
        latestPlayedLabel: live.latestLabel,
        createdDate: this.today(),
        proposalId: this.proposalId("run")
      })
    );
  }
  openEventCapture() {
    const active = this.requireActiveSession();
    this.openWorkflowModal(
      "Capture live event",
      "Events enter the append-only table log as sourced candidates. They do not update canonical owners.",
      [
        { id: "actor", label: "Actor", type: "text", required: true },
        { id: "event", label: "Action or statement", type: "textarea", required: true },
        { id: "evidence", label: "Witnesses / evidence", type: "text", required: false, placeholder: "Unknown is allowed" },
        {
          id: "status",
          label: "Evidence status",
          type: "select",
          required: true,
          value: "confirmed",
          options: { confirmed: "Confirmed", contested: "Contested", unknown: "Unknown" }
        },
        {
          id: "audience",
          label: "Audience",
          type: "select",
          required: true,
          value: "dm",
          options: { dm: "DM", players: "Players", both: "Both" }
        }
      ],
      "Review event append",
      (values) => {
        const status = stringValue(values, "status");
        const audience = stringValue(values, "audience");
        if (!isEventStatus(status)) throw new Error("Invalid event status.");
        if (!isAudience(audience)) throw new Error("Invalid event audience.");
        this.reviewProposal(
          buildEventProposal({
            roomPath: active.roomPath,
            displayName: active.displayName,
            actor: stringValue(values, "actor"),
            event: stringValue(values, "event"),
            evidence: stringValue(values, "evidence"),
            status,
            audience,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            proposalId: this.proposalId("event")
          })
        );
      }
    );
  }
  openTranscriptionRequest() {
    const active = this.requireActiveSession();
    const audioFiles = this.app.vault.getFiles().filter((file) => APPROVED_AUDIO_EXTENSIONS.has(file.extension.toLowerCase())).sort((left, right) => left.path.localeCompare(right.path));
    if (audioFiles.length === 0) {
      new import_obsidian3.Notice("No approved audio file exists in the vault. Nothing was selected or executed.", 8e3);
      return;
    }
    const options = Object.fromEntries(audioFiles.map((file) => [file.path, file.path]));
    this.openWorkflowModal(
      "Propose local transcription",
      "Select a vault audio file and confirm consent. This release creates a receipt only; it does not launch whisper-cli.",
      [
        { id: "audio", label: "Audio file", type: "select", required: true, value: audioFiles[0]?.path, options },
        { id: "consent", label: "Recording and transcription consent confirmed", type: "toggle", required: true, value: false },
        { id: "retention", label: "Retention instruction", type: "text", required: true, placeholder: "Delete after reviewed transcript" }
      ],
      "Review request",
      (values) => {
        this.reviewProposal(
          buildTranscriptionRequestProposal({
            roomPath: active.roomPath,
            displayName: active.displayName,
            audioPath: stringValue(values, "audio"),
            consentConfirmed: values.consent === true,
            retention: stringValue(values, "retention"),
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            proposalId: this.proposalId("transcript")
          })
        );
      }
    );
  }
  requireActiveSession() {
    const active = this.activeSession();
    if (!active) throw new Error("Select an explicit active session room first.");
    return active;
  }
  reviewProposal(proposal) {
    let modal;
    modal = new ProposalReviewModal(
      this.app,
      proposal,
      (reviewed) => this.executeReviewedProposal(reviewed),
      () => this.pendingProposalModals.delete(modal)
    );
    this.pendingProposalModals.add(modal);
    modal.open();
  }
  openWorkflowModal(heading, description, fields, submitLabel, onSubmit) {
    let modal;
    modal = new WorkflowFormModal(
      this.app,
      heading,
      description,
      fields,
      submitLabel,
      onSubmit,
      () => this.pendingWorkflowModals.delete(modal)
    );
    this.pendingWorkflowModals.add(modal);
    modal.open();
  }
  proposalId(kind) {
    return `vcg-${kind}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  }
  today() {
    return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  }
  async executeReviewedProposal(proposal) {
    if (this.unloading) throw new Error("The plugin is unloading; transaction execution is blocked.");
    validateReviewedProposal(proposal);
    if (this.transactionInProgress) throw new Error("Another reviewed transaction is already in progress.");
    this.transactionInProgress = true;
    const createdFiles = [];
    const appends = [];
    try {
      if (this.settings.proposalReplayIds.includes(proposal.id)) {
        throw new Error(`Proposal ${proposal.id} has already executed or attempted execution; create a new proposal to retry.`);
      }
      const plan = await Promise.all(proposal.operations.map(async (operation, index) => {
        this.preflightParentFolders(operation.path);
        const baseline = proposal.targetBaselines[index];
        if (!baseline) throw new Error(`Reviewed target baseline is missing: ${operation.path}`);
        const target = this.app.vault.getAbstractFileByPath(operation.path);
        const targetKind = target instanceof import_obsidian3.TFile ? "file" : target instanceof import_obsidian3.TFolder ? "folder" : "missing";
        const contents = target instanceof import_obsidian3.TFile ? await this.app.vault.read(target) : null;
        const mtime = target instanceof import_obsidian3.TFile ? target.stat.mtime : null;
        const size = target instanceof import_obsidian3.TFile ? target.stat.size : null;
        if (!targetMatchesBaseline(baseline, targetKind, contents, mtime, size)) {
          throw new Error(`Target changed after preview: ${operation.path}`);
        }
        return { operation, baseline, mode: resolveOperationMode(operation, baseline.kind) };
      }));
      await this.assertEvidenceSourcesUnchanged(proposal);
      if (this.unloading) throw new Error("The plugin unloaded after transaction preflight.");
      for (const item of plan) {
        if (this.unloading) throw new Error("The plugin unloaded before all reviewed operations completed.");
        await this.ensureParentFolders(item.operation.path);
        if (this.unloading) throw new Error("The plugin unloaded before the next reviewed operation.");
        if (item.mode === "create") {
          if (this.app.vault.getAbstractFileByPath(item.operation.path)) {
            throw new Error(`Reviewed create target changed after preflight: ${item.operation.path}`);
          }
          const contents = item.operation.kind === "append" ? `${item.operation.initialContents ?? ""}${item.operation.contents}` : item.operation.contents;
          await this.app.vault.create(item.operation.path, contents);
          createdFiles.push({ path: item.operation.path, expected: contents });
          continue;
        }
        const appendTarget = this.app.vault.getAbstractFileByPath(item.operation.path);
        if (!(appendTarget instanceof import_obsidian3.TFile) || item.operation.kind !== "append") {
          throw new Error(`Reviewed append target changed before execution: ${item.operation.path}`);
        }
        if (appendTarget.stat.mtime !== item.baseline.mtime || appendTarget.stat.size !== item.baseline.size) {
          throw new Error(`Reviewed append metadata changed before execution: ${item.operation.path}`);
        }
        let before = null;
        let expected = null;
        let baselineMatched = false;
        await this.app.vault.process(appendTarget, (current) => {
          if (contentHash(current) !== item.baseline.contentHash) return current;
          baselineMatched = true;
          before = current;
          expected = `${current}${item.operation.contents}`;
          return expected;
        });
        if (!baselineMatched) {
          throw new Error(`Reviewed append content changed before atomic write: ${item.operation.path}`);
        }
        if (before === null || expected === null) {
          throw new Error(`Append baseline was not captured atomically: ${item.operation.path}`);
        }
        appends.push({ path: item.operation.path, before, expected });
      }
      if (this.unloading) throw new Error("The plugin unloaded before the transaction receipt was recorded.");
      await this.recordTransaction(proposal, true);
      new import_obsidian3.Notice(`${proposal.title}: applied ${plan.length} reviewed operation(s).`, 7e3);
    } catch (error) {
      const rollbackErrors = await this.rollbackProposal(createdFiles, appends);
      try {
        await this.recordTransaction(proposal, false);
      } catch (receiptError) {
        rollbackErrors.push(
          `transaction receipt could not be saved: ${receiptError instanceof Error ? receiptError.message : String(receiptError)}`
        );
      }
      const message = error instanceof Error ? error.message : String(error);
      const detail = rollbackErrors.length > 0 ? ` Rollback attention: ${rollbackErrors.join("; ")}` : " Rollback completed.";
      throw new Error(`${message}.${detail}`);
    } finally {
      this.transactionInProgress = false;
      if (!this.unloading) await this.refreshViews();
    }
  }
  async assertEvidenceSourcesUnchanged(proposal) {
    for (const baseline of proposal.evidenceBaselines ?? []) {
      const source = this.app.vault.getAbstractFileByPath(baseline.path);
      if (!(source instanceof import_obsidian3.TFile)) throw new Error(`Reviewed evidence source is no longer a file: ${baseline.path}`);
      const contents = await this.app.vault.read(source);
      if (!targetMatchesBaseline(baseline, "file", contents, source.stat.mtime, source.stat.size)) {
        throw new Error(`Evidence source changed after preview: ${baseline.path}`);
      }
    }
  }
  preflightParentFolders(filePath) {
    const segments = normalizeVaultPath(filePath).split("/").slice(0, -1);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (this.app.vault.getAbstractFileByPath(current) instanceof import_obsidian3.TFile) {
        throw new Error(`A file blocks required folder: ${current}`);
      }
    }
  }
  async ensureParentFolders(filePath) {
    const segments = normalizeVaultPath(filePath).split("/").slice(0, -1);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      const existing = this.app.vault.getAbstractFileByPath(current);
      if (existing instanceof import_obsidian3.TFile) throw new Error(`A file blocks required folder: ${current}`);
      if (existing instanceof import_obsidian3.TFolder) continue;
      await this.app.vault.createFolder(current);
    }
  }
  async rollbackProposal(createdFiles, appends) {
    const errors = [];
    for (const append of [...appends].reverse()) {
      const file = this.fileAt(append.path);
      if (!file) {
        errors.push(`append target disappeared: ${append.path}`);
        continue;
      }
      try {
        let restored = false;
        await this.app.vault.process(file, (current) => {
          if (!contentMatchesExpected(current, append.expected)) return current;
          restored = true;
          return append.before;
        });
        if (!restored) {
          errors.push(`append target changed after write; left intact: ${append.path}`);
        }
      } catch (error) {
        errors.push(`${append.path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    for (const created of [...createdFiles].reverse()) {
      const file = this.fileAt(created.path);
      if (!file) continue;
      try {
        let unchanged = false;
        await this.app.vault.process(file, (current) => {
          unchanged = contentMatchesExpected(current, created.expected);
          return current;
        });
        if (!unchanged) {
          errors.push(`created target changed after write; left intact: ${created.path}`);
          continue;
        }
        const verifiedMtime = file.stat.mtime;
        const verifiedSize = file.stat.size;
        const currentTarget = this.app.vault.getAbstractFileByPath(created.path);
        if (currentTarget !== file || file.stat.mtime !== verifiedMtime || file.stat.size !== verifiedSize) {
          errors.push(`created target identity changed before trash; left intact: ${created.path}`);
          continue;
        }
        await this.app.fileManager.trashFile(file);
      } catch (error) {
        errors.push(`${created.path}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return errors;
  }
  async recordTransaction(proposal, ok) {
    const record = {
      id: proposal.id,
      title: proposal.title,
      ok,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      operationCount: proposal.operations.length,
      summary: proposal.summary
    };
    this.settings.recentTransactions = [
      record,
      ...this.settings.recentTransactions.filter((candidate) => candidate.id !== proposal.id)
    ].slice(0, 12);
    this.settings.proposalReplayIds = [
      proposal.id,
      ...this.settings.proposalReplayIds.filter((candidate) => candidate !== proposal.id)
    ].slice(0, 256);
    await this.saveSettings();
  }
  async runScriptAction(action) {
    if (this.unloading || !action.scriptId || this.runningActions.has(action.id)) return;
    this.runningActions.add(action.id);
    await this.refreshViews();
    try {
      const payload = await this.invokeControlWrapper(action.scriptId);
      if (this.unloading) return;
      const combined = this.redactLocalOutput(
        [payload.stdout.trim(), payload.stderr.trim()].filter(Boolean).join("\n\n")
      );
      const output = combined.slice(-this.settings.maxOutputCharacters);
      const record = {
        actionId: action.id,
        title: action.title,
        ok: payload.ok,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        durationMs: payload.duration_ms,
        output
      };
      this.settings.recentRuns = [record, ...this.settings.recentRuns.filter((run) => run.actionId !== action.id)].slice(0, 8);
      await this.saveSettings();
      new import_obsidian3.Notice(`${action.title}: ${payload.ok ? "PASS" : "attention required"}.`, payload.ok ? 4e3 : 1e4);
    } catch (error) {
      if (this.unloading) return;
      const message = error instanceof Error ? error.message : String(error);
      this.settings.recentRuns = [
        {
          actionId: action.id,
          title: action.title,
          ok: false,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          durationMs: 0,
          output: this.redactLocalOutput(message).slice(-this.settings.maxOutputCharacters)
        },
        ...this.settings.recentRuns.filter((run) => run.actionId !== action.id)
      ].slice(0, 8);
      await this.saveSettings();
      new import_obsidian3.Notice(`${action.title} failed: ${message}`, 12e3);
    } finally {
      this.runningActions.delete(action.id);
      if (!this.unloading) await this.refreshViews();
    }
  }
  invokeControlWrapper(scriptId) {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian3.FileSystemAdapter)) return Promise.reject(new Error("Local filesystem access is unavailable."));
    const root = adapter.getBasePath();
    const scriptPath = `${root}/${VAULT_PATHS.controlWrapper}`;
    return new Promise((resolve, reject) => {
      let child;
      child = (0, import_node_child_process.execFile)(
        "python3",
        [
          scriptPath,
          "run",
          scriptId,
          "--json",
          "--timeout-seconds",
          String(Math.max(2, this.settings.scriptTimeoutSeconds - 3))
        ],
        {
          cwd: root,
          env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
          timeout: this.settings.scriptTimeoutSeconds * 1e3,
          maxBuffer: 2 * 1024 * 1024,
          encoding: "utf8"
        },
        (error, stdout, stderr) => {
          this.activeChildren.delete(child);
          if (this.unloading) {
            reject(new Error("The control-plane plugin unloaded before the action completed."));
            return;
          }
          const text = stdout.trim();
          if (!text) {
            reject(new Error(stderr.trim() || error?.message || "Control wrapper returned no output."));
            return;
          }
          try {
            const payload = validateControlResult(JSON.parse(text), scriptId);
            if (error && payload.ok) throw new Error("Control wrapper process error conflicts with a successful payload.");
            resolve(payload);
          } catch (parseError) {
            const detail = parseError instanceof Error ? parseError.message : String(parseError);
            reject(new Error(`Could not parse or validate control wrapper output: ${detail}`));
          }
        }
      );
      this.activeChildren.add(child);
    });
  }
  applyProfilesToAllLeaves() {
    this.clearManagedProfiles();
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const view = leaf.view;
      if (!(view instanceof import_obsidian3.MarkdownView) || !view.file) continue;
      const frontmatter2 = asRecord(this.app.metadataCache.getFileCache(view.file)?.frontmatter);
      const profiles = this.settings.autoProfiles ? profilesForPath(view.file.path, frontmatter2) : [];
      for (const element of view.containerEl.querySelectorAll(".markdown-preview-view, .markdown-source-view")) {
        const added = /* @__PURE__ */ new Set();
        for (const profile of profiles) {
          if (!element.classList.contains(profile)) {
            element.classList.add(profile);
            added.add(profile);
          }
        }
        if (added.size > 0) this.profileAssignments.set(element, added);
        this.applySemanticAttributes(element, frontmatter2);
      }
      this.prepareWorkflowDom(view.containerEl);
    }
  }
  applySemanticAttributes(element, frontmatter2) {
    const values = {
      "data-vcg-audience": frontmatter2.audience,
      "data-vcg-canon": frontmatter2.canon_status,
      "data-vcg-retrieval": frontmatter2.retrieval_scope,
      "data-vcg-session-state": frontmatter2.session_status ?? frontmatter2.status,
      "data-vcg-note-state": frontmatter2.NoteStatus
    };
    const snapshots = /* @__PURE__ */ new Map();
    for (const [name, raw] of Object.entries(values)) {
      const token = attributeToken(raw);
      if (!token) continue;
      snapshots.set(name, element.getAttribute(name));
      element.setAttribute(name, token);
    }
    if (snapshots.size > 0) this.attributeAssignments.set(element, snapshots);
  }
  prepareWorkflowDom(root) {
    this.prepareTabbedCallouts(root);
    const stateLabels = {
      "vcg-live": "Live",
      "vcg-blocked": "Blocked",
      "vcg-closeout": "Closeout"
    };
    for (const [type, label] of Object.entries(stateLabels)) {
      for (const callout of root.querySelectorAll(`.callout[data-callout="${type}"]`)) {
        const title = callout.querySelector(":scope > .callout-title");
        if (!title || title.querySelector(".vc-control-sr-state")) continue;
        const state = title.createSpan({ cls: "vc-control-sr-state", text: `Status: ${label}.` });
        this.insertedStateLabels.add(state);
      }
    }
  }
  prepareTabbedCallouts(root) {
    const selects = root.querySelectorAll(
      ".tabbed select, select.tabbed, .mb-input.tabbed select, .mb-input-wrapper.tabbed select"
    );
    for (const select of selects) {
      if (select.dataset.vcgTabsBound === "true") continue;
      const owner = select.closest(".callout") ?? select.parentElement;
      const box = owner?.querySelector('.callout[data-callout="tabbed-box"]');
      if (!box) continue;
      const panels = [...box.querySelectorAll('.callout[data-callout="div-m"]')].filter(
        (panel) => panel.closest('.callout[data-callout="tabbed-box"]') === box
      );
      if (panels.length === 0) continue;
      this.tabSelectSnapshots.set(select, {
        bound: select.getAttribute("data-vcg-tabs-bound"),
        controls: select.getAttribute("aria-controls")
      });
      if (!this.tabBoxSnapshots.has(box)) {
        this.tabBoxSnapshots.set(box, {
          id: box.getAttribute("id"),
          ready: box.getAttribute("data-vcg-tabs-ready")
        });
      }
      for (const panel of panels) {
        if (this.tabPanelSnapshots.has(panel)) continue;
        this.tabPanelSnapshots.set(panel, {
          hidden: panel.getAttribute("hidden"),
          ariaHidden: panel.getAttribute("aria-hidden")
        });
      }
      const boxId = box.id || `vcg-tabs-${Math.random().toString(36).slice(2, 10)}`;
      box.id = boxId;
      box.dataset.vcgTabsReady = "true";
      select.dataset.vcgTabsBound = "true";
      select.setAttribute("aria-controls", boxId);
      const update = () => {
        const numeric = Number.parseInt(select.value, 10);
        const active = Number.isFinite(numeric) && numeric >= 1 ? numeric - 1 : Math.max(0, select.selectedIndex);
        panels.forEach((panel, index) => {
          panel.hidden = index !== active;
          panel.setAttribute("aria-hidden", String(index !== active));
        });
      };
      this.registerDomEvent(select, "change", update);
      update();
    }
  }
  clearManagedProfiles() {
    for (const [element, classes] of this.profileAssignments) {
      for (const className of classes) element.classList.remove(className);
    }
    this.profileAssignments.clear();
    for (const [element, snapshots] of this.attributeAssignments) {
      for (const [name, value] of snapshots) this.restoreAttribute(element, name, value);
    }
    this.attributeAssignments.clear();
  }
  restoreWorkflowDom() {
    for (const state of this.insertedStateLabels) state.remove();
    this.insertedStateLabels.clear();
    for (const [panel, snapshot] of this.tabPanelSnapshots) {
      this.restoreAttribute(panel, "hidden", snapshot.hidden);
      this.restoreAttribute(panel, "aria-hidden", snapshot.ariaHidden);
    }
    this.tabPanelSnapshots.clear();
    for (const [box, snapshot] of this.tabBoxSnapshots) {
      this.restoreAttribute(box, "id", snapshot.id);
      this.restoreAttribute(box, "data-vcg-tabs-ready", snapshot.ready);
    }
    this.tabBoxSnapshots.clear();
    for (const [select, snapshot] of this.tabSelectSnapshots) {
      this.restoreAttribute(select, "data-vcg-tabs-bound", snapshot.bound);
      this.restoreAttribute(select, "aria-controls", snapshot.controls);
    }
    this.tabSelectSnapshots.clear();
  }
  restoreAttribute(element, name, value) {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }
  protocolBlockReason(action, source) {
    if (source !== "protocol") return null;
    if (!action.protocolSafe) {
      return "Veiled Chicago Control Plane blocked an action that is not protocol-safe.";
    }
    return null;
  }
  redactLocalOutput(value) {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian3.FileSystemAdapter)) return value;
    const root = adapter.getBasePath();
    const variants = /* @__PURE__ */ new Set([root, root.replaceAll("\\", "/"), root.replaceAll("/", "\\")]);
    let redacted = value;
    for (const variant of variants) {
      if (variant) redacted = redacted.split(variant).join("<vault>");
    }
    return redacted;
  }
  async updateStatusButton() {
    if (!this.statusButton) return;
    const live = await this.readLiveState();
    const sessionMatch = live.latestLabel.match(/(?:session|s)\s*0?(\d+)/i);
    const session = sessionMatch?.[1] ? `S${sessionMatch[1].padStart(2, "0")}` : "S?";
    this.statusButton.setText(`VC / ${session} / ${live.deploymentMode}`);
    this.statusButton.setAttr(
      "aria-label",
      `Open Veiled Chicago Control Plane. Latest ${session}; deployment ${live.deploymentMode}.`
    );
  }
  fileAt(path) {
    const candidate = this.app.vault.getAbstractFileByPath(path);
    return candidate instanceof import_obsidian3.TFile ? candidate : null;
  }
  commandManager() {
    const manager = this.app.commands;
    return manager && typeof manager === "object" ? manager : null;
  }
  commandAvailable(id) {
    const manager = this.commandManager();
    if (!manager) return false;
    if (typeof manager.findCommand === "function") return Boolean(manager.findCommand(id));
    return Boolean(manager.commands && Object.prototype.hasOwnProperty.call(manager.commands, id));
  }
  pluginEnabled(id) {
    const manager = this.app.plugins;
    if (!manager || typeof manager !== "object") return false;
    return Boolean(manager.enabledPlugins?.has(id) || manager.plugins?.[id]);
  }
  executeCommand(id) {
    const manager = this.commandManager();
    return typeof manager?.executeCommandById === "function" && manager.executeCommandById(id);
  }
};
