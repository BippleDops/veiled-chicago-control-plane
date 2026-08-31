import { VAULT_PATHS } from "./paths";
import { validateActionNavigation, type ActionVerb, type PrimaryRoute } from "./navigation";
import { FIXED_WEB_VIEWER_URLS } from "./web-viewer";

export type ActionGroup =
  | "Live operations"
  | "Creation and session"
  | "AI and governance"
  | "World and maps"
  | "Applications"
  | "Automation";

export type ActionKind =
  | "view"
  | "note"
  | "dynamic-note"
  | "command"
  | "integration"
  | "external"
  | "workflow"
  | "script";

export type ActionSource = "view" | "block" | "command" | "protocol";

interface ControlActionBase {
  id: string;
  title: string;
  description: string;
  group: ActionGroup;
  icon: string;
  kind: ActionKind;
  target?: string;
  fallback?: string;
  scriptId?: string;
  confirm?: string;
  desktopOnly?: boolean;
  protocolSafe?: boolean;
}

export interface ControlAction extends ControlActionBase {
  route: PrimaryRoute;
  verb: ActionVerb;
  keywords?: readonly string[];
  allowedSources: readonly ActionSource[];
}

const BASE_CONTROL_ACTIONS = [
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
    description: "Open the validated loopback map app in Obsidian's core Web Viewer.",
    group: "Applications",
    icon: "map-pinned",
    kind: "integration",
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
    description: "Open the fixed 5eTools reference URL in Obsidian's core Web Viewer.",
    group: "Applications",
    icon: "book-open-text",
    kind: "integration",
    target: FIXED_WEB_VIEWER_URLS["open-5etools"],
    protocolSafe: true
  },
  {
    id: "open-kobold-club",
    title: "Kobold+ Fight Club",
    description: "Open the fixed encounter-builder URL in Obsidian's core Web Viewer.",
    group: "Applications",
    icon: "shield-plus",
    kind: "integration",
    target: FIXED_WEB_VIEWER_URLS["open-kobold-club"],
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
] as const satisfies readonly ControlActionBase[];

type ControlActionId = (typeof BASE_CONTROL_ACTIONS)[number]["id"];
type ActionNavigation = {
  readonly route: PrimaryRoute;
  readonly verb: ActionVerb;
  readonly keywords?: readonly string[];
};

const ACTION_NAVIGATION = {
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
  "open-veiled-map": { route: "tools", verb: "OPEN", keywords: ["chicago", "web viewer", "vite"] },
  "open-quick-switcher": { route: "tools", verb: "OPEN", keywords: ["native", "files", "navigate"] },
  "open-omnisearch": { route: "tools", verb: "OPEN", keywords: ["full text", "body search", "local index"] },
  "open-bookmarks": { route: "tools", verb: "OPEN", keywords: ["native", "saved links"] },
  "open-workspaces": { route: "tools", verb: "OPEN", keywords: ["native", "layout", "panes"] },
  "save-workspace": { route: "tools", verb: "CAPTURE", keywords: ["native", "layout", "snapshot"] },
  "open-5etools": { route: "tools", verb: "OPEN", keywords: ["rules", "reference", "web viewer"] },
  "open-kobold-club": { route: "tools", verb: "OPEN", keywords: ["encounter", "builder", "web viewer"] },
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
} as const satisfies Record<ControlActionId, ActionNavigation>;

const MARKDOWN_SAFE_ACTION_KINDS = new Set<ActionKind>(["view", "note", "dynamic-note"]);

function allowedSourcesForAction(action: ControlActionBase): readonly ActionSource[] {
  const sources: ActionSource[] = ["view", "command"];
  if (MARKDOWN_SAFE_ACTION_KINDS.has(action.kind)) sources.push("block");
  if (action.protocolSafe === true) sources.push("protocol");
  return sources;
}

export const CONTROL_ACTIONS: readonly ControlAction[] = BASE_CONTROL_ACTIONS.map((action) => ({
  ...action,
  ...ACTION_NAVIGATION[action.id],
  allowedSources: allowedSourcesForAction(action)
}));

validateActionNavigation(CONTROL_ACTIONS);

export const ACTION_BY_ID = new Map(CONTROL_ACTIONS.map((action) => [action.id, action]));

export interface ControlBlockSpec {
  title: string;
  subtitle: string;
  actions: string[];
  compact: boolean;
}

const CONTROL_BLOCK_KEYS = new Set(["title", "subtitle", "actions", "compact"]);

export const CONTROL_BLOCK_LIMITS = {
  sourceCharacters: 4096,
  lines: 64,
  titleCharacters: 120,
  subtitleCharacters: 240,
  actions: 12
} as const;

export function parseControlBlock(source: string): ControlBlockSpec {
  if (source.length > CONTROL_BLOCK_LIMITS.sourceCharacters) {
    throw new Error(`Control blocks are limited to ${CONTROL_BLOCK_LIMITS.sourceCharacters} characters.`);
  }
  const lines = source.split(/\r?\n/);
  if (lines.length > CONTROL_BLOCK_LIMITS.lines) {
    throw new Error(`Control blocks are limited to ${CONTROL_BLOCK_LIMITS.lines} lines.`);
  }
  const values = new Map<string, string>();
  for (const [index, rawLine] of lines.entries()) {
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

  const actionIds = (values.get("actions") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (actionIds.length === 0) throw new Error("At least one allowlisted action is required.");
  if (actionIds.length > CONTROL_BLOCK_LIMITS.actions) {
    throw new Error(`Control blocks are limited to ${CONTROL_BLOCK_LIMITS.actions} actions.`);
  }
  if (new Set(actionIds).size !== actionIds.length) throw new Error("Control block actions must be unique.");
  const unknown = actionIds.filter((id) => !ACTION_BY_ID.has(id));
  if (unknown.length > 0) throw new Error(`Unknown action: ${unknown.join(", ")}`);
  const sourceBlocked = actionIds.filter((id) => !ACTION_BY_ID.get(id)?.allowedSources.includes("block"));
  if (sourceBlocked.length > 0) {
    throw new Error(`Action is not permitted from Markdown: ${sourceBlocked.join(", ")}`);
  }

  const title = values.get("title") || "Veiled Chicago controls";
  const subtitle = values.get("subtitle") || "Allowlisted vault actions";
  if (title.length > CONTROL_BLOCK_LIMITS.titleCharacters) {
    throw new Error(`Control block titles are limited to ${CONTROL_BLOCK_LIMITS.titleCharacters} characters.`);
  }
  if (subtitle.length > CONTROL_BLOCK_LIMITS.subtitleCharacters) {
    throw new Error(`Control block subtitles are limited to ${CONTROL_BLOCK_LIMITS.subtitleCharacters} characters.`);
  }

  return {
    title,
    subtitle,
    actions: actionIds,
    compact: /^(?:true|yes|1)$/i.test(values.get("compact") ?? "false")
  };
}

export const MANAGED_PROFILE_CLASSES = [
  "vcg-dashboard",
  "vcg-session",
  "vcg-dossier",
  "vcg-data-deck",
  "vcg-map-room",
  "vcg-handout"
] as const;

export function profilesForPath(path: string, frontmatter: Record<string, unknown> = {}): string[] {
  const result = new Set<string>();
  const normalized = path.toLowerCase();
  const basename = normalized.split("/").pop() ?? normalized;
  const audience = String(frontmatter.audience ?? "").toLowerCase();

  if (
    normalized.startsWith(`${VAULT_PATHS.dmRoot.toLowerCase()}/`) ||
    normalized === VAULT_PATHS.currentLeads.toLowerCase() ||
    /(?:dashboard|control|board|portal|quick search)/.test(basename)
  ) {
    result.add("vcg-dashboard");
  }
  if (
    normalized.startsWith(`${VAULT_PATHS.sessionsRoot.toLowerCase()}/`) &&
    /(?:control room|table log|quick sheet|full prep| run )/.test(` ${basename} `)
  ) {
    result.add("vcg-session");
  }
  if (
    /(?:\/people\/|\/factions\/|\/places\/|\/items\/)/.test(normalized) ||
    /(?:dossier|profile)/.test(basename)
  ) {
    result.add("vcg-dossier");
  }
  if (/(?:dashboard|ledger|registry|index|matrix|catalog|inventory|reference)/.test(basename)) {
    result.add("vcg-data-deck");
  }
  if (/(?:\/maps\/|\/map bundles\/)/.test(normalized) || /(?:map room|map index|atlas)/.test(basename)) {
    result.add("vcg-map-room");
  }
  if (
    ["player", "players"].includes(audience) ||
    normalized === VAULT_PATHS.playerPortal.toLowerCase() ||
    /(?:handout|player portal)/.test(basename)
  ) {
    result.add("vcg-handout");
  }
  return [...result];
}
