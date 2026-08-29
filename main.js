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
var import_obsidian2 = require("obsidian");
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

// src/actions.ts
var CONTROL_ACTIONS = [
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
    description: "Create conditional prep only after declaration evidence exists.",
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
    title: "Operations Health",
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
    title: "Vault Health",
    description: "Open the human-readable vault health dashboard.",
    group: "Automation",
    icon: "heart-pulse",
    kind: "note",
    target: VAULT_PATHS.vaultHealth,
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

1. Record the player declaration verbatim.
2. Complete preflight and readiness checks.
3. Generate a draft RUN only after declaration evidence exists.
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

- **Player declaration:** not recorded
- **RUN:** blocked until declaration evidence exists
- **Canon promotion:** human review only
`
    },
    {
      kind: "create",
      path: file("Decision Intake"),
      contents: sessionFrontmatter(`${displayName} Decision Intake`, input.createdDate, ["Category/Decision-Intake"]) + `# ${displayName} Decision Intake

> Player wording is append-only evidence. Corrections add a new entry; they do not replace the original.

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

- [ ] Verbatim declaration evidence exists
- [ ] Preflight is complete
- [ ] Draft RUN cites the declaration and current-state sources
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
function buildRunProposal(input) {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const evidence = input.declarationEvidence.trim();
  if (!evidence.includes("vcg:declaration")) {
    throw new Error("RUN generation is blocked until declaration evidence exists in Decision Intake.");
  }
  const title = `${displayName} RUN`;
  const path = `${roomPath}/${title}.md`;
  const contents = sessionFrontmatter(title, input.createdDate, ["Category/Session-Prep"]) + `# ${title}

> [!important] Conditional prep only
> Generated only after an explicit declaration was recorded. This remains draft/future and cannot prove that anything happened.

## Declaration and evidence

- **Latest played record:** ${inlineText(input.latestPlayedLabel, "Latest played label")}
- **Decision intake:** [[${roomPath}/${displayName} Decision Intake]]
- **Player wording:** copy the reviewed verbatim statement here
- **Current-state facts used:** <!-- add citations -->
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
    summary: `Create one declaration-gated draft RUN at ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "create", path, contents }]
  };
  validateProposal(proposal);
  return proposal;
}

// src/workflow-ui.ts
var import_obsidian = require("obsidian");
var WorkflowFormModal = class extends import_obsidian.Modal {
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
      const setting = new import_obsidian.Setting(this.contentEl).setName(`${field.label}${field.required ? " *" : ""}`);
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
      new import_obsidian.Notice(message);
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
      new import_obsidian.Notice(`Control Plane: ${message}`, 1e4);
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
var ProposalReviewModal = class extends import_obsidian.Modal {
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
    const list = this.contentEl.createEl("ol", { cls: "vc-control-proposal-list" });
    for (const operation of this.proposal.operations) {
      const item = list.createEl("li");
      const details = item.createEl("details");
      const summary = details.createEl("summary");
      summary.createEl("code", { text: operation.kind.toUpperCase() });
      summary.createSpan({ text: operation.path });
      const target = this.app.vault.getAbstractFileByPath(operation.path);
      const observed = target instanceof import_obsidian.TFile ? "existing file" : target instanceof import_obsidian.TFolder ? "folder (blocked)" : "missing";
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
      new import_obsidian.Notice(`Control Plane transaction failed: ${message}`, 12e3);
    }
  }
  async captureBaselines(button) {
    try {
      const targetBaselines = await Promise.all(
        this.proposal.operations.map(async (operation) => {
          const target = this.app.vault.getAbstractFileByPath(operation.path);
          if (target instanceof import_obsidian.TFolder) return buildTargetBaseline(operation.path, "folder", null, null, null);
          if (!(target instanceof import_obsidian.TFile)) return buildTargetBaseline(operation.path, "missing", null, null, null);
          const contents = await this.app.vault.read(target);
          return buildTargetBaseline(operation.path, "file", contents, target.stat.mtime, target.stat.size);
        })
      );
      const reviewed = { ...this.proposal, targetBaselines };
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
      this.previewSnapshot = JSON.stringify(reviewed);
      button.disabled = false;
      button.setAttr("aria-busy", "false");
    } catch (error) {
      if (this.closed) return;
      const message = error instanceof Error ? error.message : String(error);
      this.errorEl?.removeAttribute("hidden");
      this.errorEl?.setText(`Target baseline capture failed: ${message}`);
      button.disabled = true;
      button.setAttr("aria-busy", "false");
    }
  }
};

// src/main.ts
var VIEW_TYPE = "veiled-chicago-control-plane";
var CURRENT_STATE_PATH = VAULT_PATHS.currentState;
var CURRENT_LEADS_PATH = VAULT_PATHS.currentLeads;
var GROUPS = [
  "Live operations",
  "Creation and session",
  "AI and governance",
  "World and maps",
  "Applications",
  "Automation"
];
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
function isRunRecord(value) {
  const record = asRecord(value);
  return typeof record.actionId === "string" && ACTION_BY_ID.has(record.actionId) && typeof record.title === "string" && typeof record.ok === "boolean" && typeof record.timestamp === "string" && Number.isFinite(Date.parse(record.timestamp)) && typeof record.durationMs === "number" && Number.isFinite(record.durationMs) && record.durationMs >= 0 && typeof record.output === "string";
}
function isTransactionRecord(value) {
  const record = asRecord(value);
  return typeof record.id === "string" && typeof record.title === "string" && typeof record.ok === "boolean" && typeof record.timestamp === "string" && Number.isFinite(Date.parse(record.timestamp)) && typeof record.operationCount === "number" && Number.isInteger(record.operationCount) && record.operationCount >= 0 && typeof record.summary === "string";
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
var ConfirmActionModal = class extends import_obsidian2.Modal {
  constructor(app, message, onConfirm, onDismiss) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
    this.onDismiss = onDismiss;
  }
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
      this.close();
      this.onConfirm();
    });
    window.setTimeout(() => confirm.focus(), 0);
  }
  onClose() {
    this.onDismiss();
    this.contentEl.empty();
  }
};
var ControlPlaneView = class extends import_obsidian2.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
  }
  filter = "";
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
    await this.render();
  }
  async render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vc-control-plane");
    contentEl.setAttr("aria-label", "Veiled Chicago campaign control plane");
    const live = await this.plugin.readLiveState();
    const header = contentEl.createEl("header", { cls: "vc-control-hero" });
    const identity = header.createDiv({ cls: "vc-control-identity" });
    identity.createDiv({ cls: "vc-control-eyebrow", text: "VEILED CHICAGO / LOCAL CONTROL PLANE" });
    identity.createEl("h1", { text: "Campaign systems online" });
    identity.createEl("p", {
      text: "A live HTML surface over canonical notes, installed plugins, and explicit local automation."
    });
    const telemetry = header.createEl("dl", { cls: "vc-control-telemetry" });
    this.addMetric(telemetry, "Latest played", live.latestLabel);
    this.addMetric(telemetry, "Deployment", live.deploymentMode);
    this.addMetric(telemetry, "Next session", live.nextSession === null ? "NOT DECLARED" : `SESSION ${live.nextSession}`);
    this.addMetric(telemetry, "Open lead tasks", String(live.openLeadTasks));
    this.addMetric(telemetry, "Active room", live.activeSessionName ?? "NOT SELECTED");
    this.renderLiveEdgeRouter(contentEl, live);
    const toolbar = contentEl.createEl("nav", {
      cls: "vc-control-toolbar",
      attr: { "aria-label": "Control plane filters and primary actions" }
    });
    const filterLabel = toolbar.createEl("label", { cls: "vc-control-filter" });
    filterLabel.createSpan({ text: "Filter controls" });
    const filterInput = filterLabel.createEl("input", {
      type: "search",
      placeholder: "Search actions\u2026",
      value: this.filter
    });
    filterInput.addEventListener("input", () => {
      this.filter = filterInput.value;
      this.applyFilter(contentEl);
    });
    const refresh = toolbar.createEl("button", { cls: "vc-control-icon-button" });
    refresh.type = "button";
    refresh.setAttr("aria-label", "Refresh control plane state");
    refresh.setAttr("title", "Refresh control plane state");
    (0, import_obsidian2.setIcon)(refresh, "refresh-cw");
    refresh.addEventListener("click", () => void this.render());
    const main = contentEl.createEl("main", { cls: "vc-control-main" });
    for (const group of GROUPS) this.renderGroup(main, group);
    this.renderContextPolicy(contentEl);
    this.renderHealth(contentEl);
    this.renderTransactions(contentEl);
    this.renderRecentRuns(contentEl);
    this.applyFilter(contentEl);
  }
  scrollToSection(section) {
    const target = this.contentEl.querySelector(`[data-vc-section="${section}"]`);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  }
  addMetric(container, label, value) {
    const item = container.createDiv({ cls: "vc-control-metric" });
    item.createEl("dt", { text: label });
    item.createEl("dd", { text: value });
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
      ["Player deployment", live.deploymentMode],
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
      if (action) actions.appendChild(this.plugin.createActionButton(action, "view"));
    }
  }
  renderGroup(container, group) {
    const section = container.createEl("section", { cls: "vc-control-section" });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: group });
    heading.createSpan({ text: `${CONTROL_ACTIONS.filter((action) => action.group === group).length} controls` });
    const grid = section.createDiv({ cls: "vc-control-grid" });
    for (const action of CONTROL_ACTIONS.filter((candidate) => candidate.group === group)) {
      grid.appendChild(this.plugin.createActionButton(action, "view"));
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
      card.toggleClass("is-active", profile.id === this.plugin.settings.activeContextProfile);
      card.setAttr("aria-pressed", String(profile.id === this.plugin.settings.activeContextProfile));
      card.createEl("strong", { text: profile.title });
      card.createEl("small", { text: "Guarded configuration; provider enforcement is not verified." });
      card.createEl("span", { text: profile.description });
      card.createEl("code", { text: `${profile.audiences.join("+")} / ${profile.retrievalScopes.join("+")}` });
      this.plugin.registerDomEvent(card, "click", () => void this.plugin.setActiveContextProfile(profile.id));
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
  applyFilter(container) {
    const query = this.filter.trim().toLowerCase();
    for (const button of container.querySelectorAll(".vc-control-action")) {
      const haystack = button.dataset.search ?? "";
      button.toggleClass("is-filtered", Boolean(query) && !haystack.includes(query));
    }
    for (const section of container.querySelectorAll(".vc-control-section")) {
      const visible = section.querySelector(".vc-control-action:not(.is-filtered)");
      section.toggleClass("is-filtered", !visible);
    }
  }
};
var ControlPlaneSettingTab = class extends import_obsidian2.PluginSettingTab {
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
    new import_obsidian2.Setting(containerEl).setName("Automatic workflow profiles").setDesc("Apply existing vcg-dashboard/session/dossier/data/map/handout classes by path and frontmatter without rewriting notes.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoProfiles).onChange(async (value) => {
        this.plugin.settings.autoProfiles = value;
        await this.plugin.saveSettings();
        this.plugin.applyProfilesToAllLeaves();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Active AI context profile").setDesc("Retrieval policy contract only. Every profile remains read-only toward canonical owners.").addDropdown((dropdown) => {
      for (const profile of CONTEXT_PROFILES) dropdown.addOption(profile.id, profile.title);
      dropdown.setValue(this.plugin.settings.activeContextProfile).onChange(async (value) => {
        if (!isContextProfileId(value)) return;
        await this.plugin.setActiveContextProfile(value);
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Explicit active session room").setDesc(
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
    new import_obsidian2.Setting(containerEl).setName("Open notes in new tabs").setDesc("Keep the control plane visible while opening campaign surfaces.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.openNotesInNewTab).onChange(async (value) => {
        this.plugin.settings.openNotesInNewTab = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Enable local automation").setDesc("Allow the desktop app to call the audited Python wrapper with exact action IDs. Navigation remains available when disabled.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.automationEnabled).onChange(async (value) => {
        this.plugin.settings.automationEnabled = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshViews();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Confirm process actions").setDesc("Require an in-app confirmation before starting or stopping the local map server.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.confirmScriptActions).onChange(async (value) => {
        this.plugin.settings.confirmScriptActions = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Local map URL").setDesc("Loopback HTTP URL used only as a fallback when the Veiled Chicago Map Custom Frame command is unavailable.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.mapUrl).setValue(this.plugin.settings.mapUrl).onChange(async (value) => {
        const trimmed = value.trim();
        if (trimmed && isSafeMapUrl(trimmed)) {
          this.plugin.settings.mapUrl = trimmed;
          await this.plugin.saveSettings();
        }
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Automation timeout").setDesc("Seconds before a foreground audit is terminated. Range: 5\u2013300.").addText(
      (text) => text.setValue(String(this.plugin.settings.scriptTimeoutSeconds)).onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 300) {
          this.plugin.settings.scriptTimeoutSeconds = parsed;
          await this.plugin.saveSettings();
        }
      })
    );
  }
};
var VeiledChicagoControlPlane = class extends import_obsidian2.Plugin {
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
      })
    );
    this.app.workspace.onLayoutReady(() => this.scheduleRefresh(0));
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
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (section && leaf.view instanceof ControlPlaneView) leaf.view.scrollToSection(section);
  }
  async setActiveContextProfile(profile) {
    this.settings.activeContextProfile = profile;
    await this.saveSettings();
    await this.refreshViews();
  }
  async refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof ControlPlaneView) await view.render();
    }
    await this.updateStatusButton();
  }
  scheduleRefresh(delay = 80) {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      this.applyProfilesToAllLeaves();
      void this.refreshViews();
    }, delay);
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
  createActionButton(action, source) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "vc-control-action";
    button.dataset.action = action.id;
    button.dataset.search = `${action.id} ${action.title} ${action.description} ${action.group}`.toLowerCase();
    const availability = this.getAvailability(action);
    button.setAttribute("aria-disabled", String(!availability.available));
    button.setAttribute(
      "aria-label",
      `${action.title}. ${action.description}${availability.reason ? ` Unavailable: ${availability.reason}` : ""}`
    );
    if (availability.reason) button.setAttribute("title", availability.reason);
    const icon = button.createSpan({ cls: "vc-control-action-icon" });
    (0, import_obsidian2.setIcon)(icon, this.runningActions.has(action.id) ? "loader-circle" : action.icon);
    const copy = button.createSpan({ cls: "vc-control-action-copy" });
    copy.createSpan({ cls: "vc-control-action-title", text: action.title });
    copy.createSpan({
      cls: "vc-control-action-description",
      text: availability.reason ?? action.description
    });
    const state = button.createSpan({
      cls: "vc-control-action-state",
      text: this.runningActions.has(action.id) ? "RUNNING" : availability.available ? source === "block" ? "RUN" : "OPEN" : "OFFLINE"
    });
    if (this.runningActions.has(action.id)) button.addClass("is-running");
    this.registerDomEvent(button, "click", () => void this.executeAction(action.id, source));
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
  getAvailability(action) {
    if (this.runningActions.has(action.id)) return { available: false, reason: "Action is already running." };
    if (action.desktopOnly && !import_obsidian2.Platform.isDesktopApp) return { available: false, reason: "Desktop Obsidian is required." };
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
        if (!import_obsidian2.Platform.isMacOS) {
          return { available: false, reason: "The reviewed automation wrapper currently requires macOS/POSIX process tools." };
        }
        if (!(this.app.vault.adapter instanceof import_obsidian2.FileSystemAdapter)) {
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
      new import_obsidian2.Notice(`Veiled Chicago Control Plane: unknown action '${actionId || "(empty)"}'.`);
      return;
    }
    const protocolBlock = this.protocolBlockReason(action, source);
    if (protocolBlock) {
      new import_obsidian2.Notice(protocolBlock);
      return;
    }
    const availability = this.getAvailability(action);
    if (!availability.available) {
      new import_obsidian2.Notice(availability.reason ?? `${action.title} is unavailable.`);
      return;
    }
    if (action.confirm && this.settings.confirmScriptActions) {
      let modal;
      modal = new ConfirmActionModal(
        this.app,
        action.confirm,
        () => {
          if (this.unloading) return;
          const currentProtocolBlock = this.protocolBlockReason(action, source);
          if (currentProtocolBlock) {
            new import_obsidian2.Notice(currentProtocolBlock);
            return;
          }
          const currentAvailability = this.getAvailability(action);
          if (!currentAvailability.available) {
            new import_obsidian2.Notice(currentAvailability.reason ?? `${action.title} is unavailable.`);
            return;
          }
          void this.performAction(action).catch((error) => this.reportActionError(action.title, error));
        },
        () => this.pendingConfirmationModals.delete(modal)
      );
      this.pendingConfirmationModals.add(modal);
      modal.open();
      return;
    }
    try {
      await this.performAction(action);
    } catch (error) {
      this.reportActionError(action.title, error);
    }
  }
  reportActionError(title, error) {
    const message = error instanceof Error ? error.message : String(error);
    new import_obsidian2.Notice(`${title}: ${message}`, 12e3);
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
          new import_obsidian2.Notice(`Could not execute ${action.title}.`);
        }
        break;
      case "integration":
        if (action.target && this.commandAvailable(action.target)) {
          this.executeCommand(action.target);
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
      new import_obsidian2.Notice("The requested campaign note could not be resolved.");
      return;
    }
    const existing = this.app.workspace.getLeavesOfType("markdown").find((leaf2) => {
      const view = leaf2.view;
      return view instanceof import_obsidian2.MarkdownView && view.file?.path === file.path;
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
        new import_obsidian2.Notice(`Unknown workflow action: ${id}`);
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
        new import_obsidian2.Notice(`Active session room selected: ${displayName}. No canon or next-session field changed.`, 7e3);
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
      if (existing instanceof import_obsidian2.TFolder) throw new Error(`A folder blocks scaffold file: ${operation.path}`);
      return !(existing instanceof import_obsidian2.TFile);
    });
    if (operations.length === 0) {
      new import_obsidian2.Notice(`${active.displayName} already contains every scaffold file; nothing was proposed.`, 7e3);
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
    if (!intake) throw new Error(`Decision Intake is missing: ${intakePath}`);
    const declarationEvidence = await this.app.vault.cachedRead(intake);
    const live = await this.readLiveState();
    this.reviewProposal(
      buildRunProposal({
        roomPath: active.roomPath,
        displayName: active.displayName,
        declarationEvidence,
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
      new import_obsidian2.Notice("No approved audio file exists in the vault. Nothing was selected or executed.", 8e3);
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
        const targetKind = target instanceof import_obsidian2.TFile ? "file" : target instanceof import_obsidian2.TFolder ? "folder" : "missing";
        const contents = target instanceof import_obsidian2.TFile ? await this.app.vault.read(target) : null;
        const mtime = target instanceof import_obsidian2.TFile ? target.stat.mtime : null;
        const size = target instanceof import_obsidian2.TFile ? target.stat.size : null;
        if (!targetMatchesBaseline(baseline, targetKind, contents, mtime, size)) {
          throw new Error(`Target changed after preview: ${operation.path}`);
        }
        return { operation, baseline, mode: resolveOperationMode(operation, baseline.kind) };
      }));
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
        if (!(appendTarget instanceof import_obsidian2.TFile) || item.operation.kind !== "append") {
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
      new import_obsidian2.Notice(`${proposal.title}: applied ${plan.length} reviewed operation(s).`, 7e3);
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
  preflightParentFolders(filePath) {
    const segments = normalizeVaultPath(filePath).split("/").slice(0, -1);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (this.app.vault.getAbstractFileByPath(current) instanceof import_obsidian2.TFile) {
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
      if (existing instanceof import_obsidian2.TFile) throw new Error(`A file blocks required folder: ${current}`);
      if (existing instanceof import_obsidian2.TFolder) continue;
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
      new import_obsidian2.Notice(`${action.title}: ${payload.ok ? "PASS" : "attention required"}.`, payload.ok ? 4e3 : 1e4);
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
      new import_obsidian2.Notice(`${action.title} failed: ${message}`, 12e3);
    } finally {
      this.runningActions.delete(action.id);
      if (!this.unloading) await this.refreshViews();
    }
  }
  invokeControlWrapper(scriptId) {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian2.FileSystemAdapter)) return Promise.reject(new Error("Local filesystem access is unavailable."));
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
      if (!(view instanceof import_obsidian2.MarkdownView) || !view.file) continue;
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
    if (!(adapter instanceof import_obsidian2.FileSystemAdapter)) return value;
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
    return candidate instanceof import_obsidian2.TFile ? candidate : null;
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
  executeCommand(id) {
    const manager = this.commandManager();
    return typeof manager?.executeCommandById === "function" && manager.executeCommandById(id);
  }
};
