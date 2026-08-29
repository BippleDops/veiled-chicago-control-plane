import { VAULT_PATHS } from "./paths";

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

export interface ControlAction {
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

export const CONTROL_ACTIONS: readonly ControlAction[] = [
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
] as const;

export const ACTION_BY_ID = new Map(CONTROL_ACTIONS.map((action) => [action.id, action]));

export interface ControlBlockSpec {
  title: string;
  subtitle: string;
  actions: string[];
  compact: boolean;
}

const CONTROL_BLOCK_KEYS = new Set(["title", "subtitle", "actions", "compact"]);

export function parseControlBlock(source: string): ControlBlockSpec {
  const values = new Map<string, string>();
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

  const actionIds = (values.get("actions") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
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
