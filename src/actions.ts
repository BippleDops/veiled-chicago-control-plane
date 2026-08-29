export type ActionGroup = "Live operations" | "World and maps" | "Applications" | "Automation";

export type ActionKind =
  | "view"
  | "note"
  | "dynamic-note"
  | "command"
  | "integration"
  | "external"
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
    id: "open-dm-control-deck",
    title: "DM Control Deck",
    description: "Open the vault's canonical operations front door.",
    group: "Live operations",
    icon: "layout-dashboard",
    kind: "note",
    target: "1-DM Toolkit/DM Control Deck.md",
    protocolSafe: true
  },
  {
    id: "open-current-state",
    title: "Current State",
    description: "Open the live factual handoff and unresolved boundaries.",
    group: "Live operations",
    icon: "activity",
    kind: "note",
    target: "1-DM Toolkit/Current State of Affairs.md",
    protocolSafe: true
  },
  {
    id: "open-current-leads",
    title: "Current Leads",
    description: "Open the player-owned deployment menu.",
    group: "Live operations",
    icon: "route",
    kind: "note",
    target: "1-Party/Current Leads.md",
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
    target: "1-Party/Campaign State Ledger.md",
    protocolSafe: true
  },
  {
    id: "open-combat-dashboard",
    title: "Combat Dashboard",
    description: "Open the fail-closed combat readiness surface.",
    group: "Live operations",
    icon: "swords",
    kind: "note",
    target: "1-DM Toolkit/Combat Dashboard.md",
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
    id: "open-campaign-board",
    title: "Campaign Board",
    description: "Open open-world deployments without promoting future prep.",
    group: "World and maps",
    icon: "network",
    kind: "note",
    target: "1-DM Toolkit/Open-World Campaign Board.md",
    protocolSafe: true
  },
  {
    id: "open-faction-fronts",
    title: "Faction Fronts",
    description: "Open faction pressures and clocks.",
    group: "World and maps",
    icon: "git-branch",
    kind: "note",
    target: "1-DM Toolkit/Faction Fronts.md",
    protocolSafe: true
  },
  {
    id: "open-npc-reference",
    title: "NPC Reference",
    description: "Open the fast NPC lookup surface.",
    group: "World and maps",
    icon: "contact-round",
    kind: "note",
    target: "1-DM Toolkit/NPC Quick Reference.md",
    protocolSafe: true
  },
  {
    id: "open-map-registry",
    title: "Map Bundle Registry",
    description: "Open readiness gates and approved map bundles.",
    group: "World and maps",
    icon: "map",
    kind: "note",
    target: "1-DM Toolkit/Map Bundles/Map Bundle Registry.md",
    protocolSafe: true
  },
  {
    id: "open-player-portal",
    title: "Player Portal",
    description: "Open the player-safe campaign surface.",
    group: "World and maps",
    icon: "door-open",
    kind: "note",
    target: "1-Party/Player Portal.md",
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
    protocolSafe: true
  },
  {
    id: "open-quick-search",
    title: "Quick Search",
    description: "Open the vault's campaign search console.",
    group: "Applications",
    icon: "search-code",
    kind: "note",
    target: "1-DM Toolkit/Quick Search.md",
    protocolSafe: true
  },
  {
    id: "open-vault-health",
    title: "Vault Health",
    description: "Open the human-readable vault health dashboard.",
    group: "Automation",
    icon: "heart-pulse",
    kind: "note",
    target: "1-DM Toolkit/Vault Health.md",
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
    id: "run-tactical-audit",
    title: "Audit Tactical Readiness",
    description: "Validate ready map contracts and fallbacks.",
    group: "Automation",
    icon: "shield-check",
    kind: "script",
    scriptId: "tactical-ready",
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
    normalized.startsWith("1-dm toolkit/") ||
    normalized === "1-party/current leads.md" ||
    /(?:dashboard|control|board|portal|quick search)/.test(basename)
  ) {
    result.add("vcg-dashboard");
  }
  if (
    normalized.startsWith("1-session journals/") &&
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
  if (["player", "players"].includes(audience) || normalized === "1-party/player portal.md" || /(?:handout|player portal)/.test(basename)) {
    result.add("vcg-handout");
  }
  return [...result];
}
