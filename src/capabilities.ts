export type CapabilityState = "available" | "partial" | "unavailable";

export interface CapabilityDefinition {
  readonly id: string;
  readonly capability: string;
  readonly owner: string;
  readonly boundary: string;
  readonly pluginIds?: readonly string[];
  readonly commandIds?: readonly string[];
  readonly builtIn?: boolean;
}

/** Fixed interface-stack registry. It describes adapters; it never supplies executable IDs. */
export const INTERFACE_CAPABILITIES: readonly CapabilityDefinition[] = [
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
] as const;

export interface CapabilityProbe {
  readonly pluginEnabled: (id: string) => boolean;
  readonly commandAvailable: (id: string) => boolean;
}

export interface CapabilityRuntimeStatus {
  readonly state: CapabilityState;
  readonly available: number;
  readonly required: number;
  readonly missing: readonly string[];
}

/** Evaluate only fixed registry requirements; returned identifiers are diagnostic, not executable. */
export function capabilityRuntimeStatus(
  definition: CapabilityDefinition,
  probe: CapabilityProbe
): CapabilityRuntimeStatus {
  const checks = [
    ...(definition.builtIn ? [{ id: "built-in", available: true }] : []),
    ...(definition.pluginIds ?? []).map((id) => ({ id, available: probe.pluginEnabled(id) })),
    ...(definition.commandIds ?? []).map((id) => ({ id, available: probe.commandAvailable(id) }))
  ];
  const available = checks.filter((check) => check.available).length;
  const missing = checks.filter((check) => !check.available).map((check) => check.id);
  const required = checks.length;
  const state: CapabilityState = available === required ? "available" : available === 0 ? "unavailable" : "partial";
  return { state, available, required, missing };
}
