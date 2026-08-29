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
var import_obsidian = require("obsidian");
var import_node_child_process = require("node:child_process");

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
function profilesForPath(path, frontmatter = {}) {
  const result = /* @__PURE__ */ new Set();
  const normalized = path.toLowerCase();
  const basename = normalized.split("/").pop() ?? normalized;
  const audience = String(frontmatter.audience ?? "").toLowerCase();
  if (normalized.startsWith("1-dm toolkit/") || normalized === "1-party/current leads.md" || /(?:dashboard|control|board|portal|quick search)/.test(basename)) {
    result.add("vcg-dashboard");
  }
  if (normalized.startsWith("1-session journals/") && /(?:control room|table log|quick sheet|full prep| run )/.test(` ${basename} `)) {
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
  if (["player", "players"].includes(audience) || normalized === "1-party/player portal.md" || /(?:handout|player portal)/.test(basename)) {
    result.add("vcg-handout");
  }
  return [...result];
}

// src/main.ts
var VIEW_TYPE = "veiled-chicago-control-plane";
var CURRENT_STATE_PATH = "1-DM Toolkit/Current State of Affairs.md";
var CURRENT_LEADS_PATH = "1-Party/Current Leads.md";
var GROUPS = ["Live operations", "World and maps", "Applications", "Automation"];
var DEFAULT_SETTINGS = {
  automationEnabled: false,
  autoProfiles: true,
  openNotesInNewTab: true,
  confirmScriptActions: true,
  allowProtocolAutomation: false,
  mapUrl: "http://127.0.0.1:5173/",
  scriptTimeoutSeconds: 45,
  maxOutputCharacters: 12e3,
  recentRuns: []
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
var ConfirmActionModal = class extends import_obsidian.Modal {
  constructor(app, message, onConfirm, onDismiss) {
    super(app);
    this.message = message;
    this.onConfirm = onConfirm;
    this.onDismiss = onDismiss;
  }
  onOpen() {
    this.modalEl.addClass("vc-control-confirm-modal");
    this.titleEl.setText("Confirm local action");
    this.contentEl.createEl("p", { text: this.message });
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
var ControlPlaneView = class extends import_obsidian.ItemView {
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
    this.addMetric(telemetry, "Next session", live.nextSession === null ? "PLAYER SELECTED" : `SESSION ${live.nextSession}`);
    this.addMetric(telemetry, "Open lead tasks", String(live.openLeadTasks));
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
    (0, import_obsidian.setIcon)(refresh, "refresh-cw");
    refresh.addEventListener("click", () => void this.render());
    const main = contentEl.createEl("main", { cls: "vc-control-main" });
    for (const group of GROUPS) this.renderGroup(main, group);
    this.renderRecentRuns(contentEl);
    this.applyFilter(contentEl);
  }
  addMetric(container, label, value) {
    const item = container.createDiv({ cls: "vc-control-metric" });
    item.createEl("dt", { text: label });
    item.createEl("dd", { text: value });
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
var ControlPlaneSettingTab = class extends import_obsidian.PluginSettingTab {
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
    new import_obsidian.Setting(containerEl).setName("Automatic workflow profiles").setDesc("Apply existing vcg-dashboard/session/dossier/data/map/handout classes by path and frontmatter without rewriting notes.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoProfiles).onChange(async (value) => {
        this.plugin.settings.autoProfiles = value;
        await this.plugin.saveSettings();
        this.plugin.applyProfilesToAllLeaves();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Open notes in new tabs").setDesc("Keep the control plane visible while opening campaign surfaces.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.openNotesInNewTab).onChange(async (value) => {
        this.plugin.settings.openNotesInNewTab = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Enable local automation").setDesc("Allow the desktop app to call the audited Python wrapper with exact action IDs. Navigation remains available when disabled.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.automationEnabled).onChange(async (value) => {
        this.plugin.settings.automationEnabled = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshViews();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Confirm process actions").setDesc("Require an in-app confirmation before starting or stopping the local map server.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.confirmScriptActions).onChange(async (value) => {
        this.plugin.settings.confirmScriptActions = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Allow automation from obsidian://vc-control").setDesc("Off by default. Navigation URI actions remain available; script actions are rejected unless this is enabled.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.allowProtocolAutomation).onChange(async (value) => {
        this.plugin.settings.allowProtocolAutomation = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Local map URL").setDesc("Loopback HTTP URL used only as a fallback when the Veiled Chicago Map Custom Frame command is unavailable.").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.mapUrl).setValue(this.plugin.settings.mapUrl).onChange(async (value) => {
        const trimmed = value.trim();
        if (trimmed && isSafeMapUrl(trimmed)) {
          this.plugin.settings.mapUrl = trimmed;
          await this.plugin.saveSettings();
        }
      })
    );
    new import_obsidian.Setting(containerEl).setName("Automation timeout").setDesc("Seconds before a foreground audit is terminated. Range: 5\u2013300.").addText(
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
var VeiledChicagoControlPlane = class extends import_obsidian.Plugin {
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
    this.settings = {
      automationEnabled: typeof saved.automationEnabled === "boolean" ? saved.automationEnabled : DEFAULT_SETTINGS.automationEnabled,
      autoProfiles: typeof saved.autoProfiles === "boolean" ? saved.autoProfiles : DEFAULT_SETTINGS.autoProfiles,
      openNotesInNewTab: typeof saved.openNotesInNewTab === "boolean" ? saved.openNotesInNewTab : DEFAULT_SETTINGS.openNotesInNewTab,
      confirmScriptActions: typeof saved.confirmScriptActions === "boolean" ? saved.confirmScriptActions : DEFAULT_SETTINGS.confirmScriptActions,
      allowProtocolAutomation: typeof saved.allowProtocolAutomation === "boolean" ? saved.allowProtocolAutomation : DEFAULT_SETTINGS.allowProtocolAutomation,
      mapUrl: typeof saved.mapUrl === "string" ? saved.mapUrl : DEFAULT_SETTINGS.mapUrl,
      scriptTimeoutSeconds: timeout,
      maxOutputCharacters: outputLimit,
      recentRuns: recentRuns.slice(0, 8).map((run) => ({
        ...run,
        output: this.redactLocalOutput(run.output).slice(-outputLimit)
      }))
    };
    if (!isSafeMapUrl(this.settings.mapUrl)) this.settings.mapUrl = DEFAULT_SETTINGS.mapUrl;
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
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
    const frontmatter = stateFile ? asRecord(this.app.metadataCache.getFileCache(stateFile)?.frontmatter) : {};
    const latestValue = frontmatter.last_played_record;
    const latestTarget = wikilinkTarget(latestValue);
    const latestFile = latestTarget ? this.app.metadataCache.getFirstLinkpathDest(latestTarget, CURRENT_STATE_PATH) : this.findLatestPlayedFallback();
    const nextValue = frontmatter.next_session;
    const nextSession = typeof nextValue === "number" && Number.isInteger(nextValue) ? nextValue : null;
    return {
      latestLabel: wikilinkLabel(latestValue) || latestFile?.basename || "UNRESOLVED",
      latestFile,
      nextSession,
      deploymentMode: normalizeDeployment(frontmatter.deployment_mode),
      openLeadTasks: await this.countOpenTasks(CURRENT_LEADS_PATH),
      stateModified: stateFile?.stat.mtime ?? null
    };
  }
  findLatestPlayedFallback() {
    return this.app.vault.getMarkdownFiles().filter((file) => /^1-Session Journals\/Session \d+\/c1a-session-\d+\.md$/i.test(file.path)).sort((left, right) => right.path.localeCompare(left.path, void 0, { numeric: true }))[0] ?? null;
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
    button.disabled = !availability.available;
    button.setAttribute("aria-label", `${action.title}. ${action.description}`);
    if (availability.reason) button.setAttribute("title", availability.reason);
    const icon = button.createSpan({ cls: "vc-control-action-icon" });
    (0, import_obsidian.setIcon)(icon, this.runningActions.has(action.id) ? "loader-circle" : action.icon);
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
    if (action.desktopOnly && !import_obsidian.Platform.isDesktopApp) return { available: false, reason: "Desktop Obsidian is required." };
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
      case "script":
        if (!this.settings.automationEnabled) return { available: false, reason: "Local automation is disabled in plugin settings." };
        if (!import_obsidian.Platform.isMacOS) {
          return { available: false, reason: "The reviewed automation wrapper currently requires macOS/POSIX process tools." };
        }
        if (!(this.app.vault.adapter instanceof import_obsidian.FileSystemAdapter)) {
          return { available: false, reason: "The vault has no local filesystem adapter." };
        }
        return this.fileAt("scripts/vcg_control.py") ? { available: true } : { available: false, reason: "Missing scripts/vcg_control.py." };
      case "external":
        return action.target && /^https?:\/\//i.test(action.target) ? { available: true } : { available: false, reason: "External URL is invalid." };
      default:
        return { available: true };
    }
  }
  async executeAction(actionId, source) {
    const action = ACTION_BY_ID.get(actionId);
    if (!action) {
      new import_obsidian.Notice(`Veiled Chicago Control Plane: unknown action '${actionId || "(empty)"}'.`);
      return;
    }
    const protocolBlock = this.protocolBlockReason(action, source);
    if (protocolBlock) {
      new import_obsidian.Notice(protocolBlock);
      return;
    }
    const availability = this.getAvailability(action);
    if (!availability.available) {
      new import_obsidian.Notice(availability.reason ?? `${action.title} is unavailable.`);
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
            new import_obsidian.Notice(currentProtocolBlock);
            return;
          }
          const currentAvailability = this.getAvailability(action);
          if (!currentAvailability.available) {
            new import_obsidian.Notice(currentAvailability.reason ?? `${action.title} is unavailable.`);
            return;
          }
          void this.performAction(action);
        },
        () => this.pendingConfirmationModals.delete(modal)
      );
      this.pendingConfirmationModals.add(modal);
      modal.open();
      return;
    }
    await this.performAction(action);
  }
  async performAction(action) {
    switch (action.kind) {
      case "view":
        await this.activateView();
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
          new import_obsidian.Notice(`Could not execute ${action.title}.`);
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
      case "script":
        await this.runScriptAction(action);
        break;
    }
  }
  async openFile(file) {
    if (!file) {
      new import_obsidian.Notice("The requested campaign note could not be resolved.");
      return;
    }
    const leaf = this.app.workspace.getLeaf(this.settings.openNotesInNewTab ? "tab" : false);
    await leaf.openFile(file, { active: true });
    await this.app.workspace.revealLeaf(leaf);
  }
  resolveDynamicFile(target) {
    const stateFile = this.fileAt(CURRENT_STATE_PATH);
    const frontmatter = stateFile ? asRecord(this.app.metadataCache.getFileCache(stateFile)?.frontmatter) : {};
    if (target === "latest-played") {
      const link = wikilinkTarget(frontmatter.last_played_record);
      const file = link ? this.app.metadataCache.getFirstLinkpathDest(link, CURRENT_STATE_PATH) : this.findLatestPlayedFallback();
      return file ? { file, available: { available: true } } : { file: null, available: { available: false, reason: "No latest played journal resolves from current state." } };
    }
    if (target === "next-session") {
      const next = frontmatter.next_session;
      if (typeof next !== "number" || !Number.isInteger(next)) {
        return {
          file: null,
          available: { available: false, reason: "next_session is null; player selection remains authoritative." }
        };
      }
      const path = `1-Session Journals/Session ${next}/Session ${next} Control Room.md`;
      const file = this.fileAt(path);
      return file ? { file, available: { available: true } } : { file: null, available: { available: false, reason: `Declared next session has no control room: ${path}` } };
    }
    return { file: null, available: { available: false, reason: `Unknown dynamic target: ${target}` } };
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
      new import_obsidian.Notice(`${action.title}: ${payload.ok ? "PASS" : "attention required"}.`, payload.ok ? 4e3 : 1e4);
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
      new import_obsidian.Notice(`${action.title} failed: ${message}`, 12e3);
    } finally {
      this.runningActions.delete(action.id);
      if (!this.unloading) await this.refreshViews();
    }
  }
  invokeControlWrapper(scriptId) {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian.FileSystemAdapter)) return Promise.reject(new Error("Local filesystem access is unavailable."));
    const root = adapter.getBasePath();
    const scriptPath = `${root}/scripts/vcg_control.py`;
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
            const payload = JSON.parse(text);
            if (typeof payload.action !== "string" || typeof payload.ok !== "boolean" || typeof payload.exit_code !== "number" || typeof payload.stdout !== "string" || typeof payload.stderr !== "string" || typeof payload.duration_ms !== "number") {
              throw new Error("Control wrapper returned an invalid payload shape.");
            }
            resolve(payload);
          } catch (parseError) {
            const detail = parseError instanceof Error ? parseError.message : String(parseError);
            reject(new Error(`Could not parse control wrapper output: ${detail}`));
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
      if (!(view instanceof import_obsidian.MarkdownView) || !view.file) continue;
      const frontmatter = asRecord(this.app.metadataCache.getFileCache(view.file)?.frontmatter);
      const profiles = this.settings.autoProfiles ? profilesForPath(view.file.path, frontmatter) : [];
      for (const element of view.containerEl.querySelectorAll(".markdown-preview-view, .markdown-source-view")) {
        const added = /* @__PURE__ */ new Set();
        for (const profile of profiles) {
          if (!element.classList.contains(profile)) {
            element.classList.add(profile);
            added.add(profile);
          }
        }
        if (added.size > 0) this.profileAssignments.set(element, added);
        this.applySemanticAttributes(element, frontmatter);
      }
      this.prepareWorkflowDom(view.containerEl);
    }
  }
  applySemanticAttributes(element, frontmatter) {
    const values = {
      "data-vcg-audience": frontmatter.audience,
      "data-vcg-canon": frontmatter.canon_status,
      "data-vcg-retrieval": frontmatter.retrieval_scope,
      "data-vcg-session-state": frontmatter.session_status ?? frontmatter.status,
      "data-vcg-note-state": frontmatter.NoteStatus
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
    if (action.kind === "script" && !this.settings.allowProtocolAutomation) {
      return "Veiled Chicago Control Plane blocked protocol-triggered automation. Enable it explicitly in settings if required.";
    }
    if (action.kind !== "script" && !action.protocolSafe) {
      return "Veiled Chicago Control Plane blocked an action that is not protocol-safe.";
    }
    return null;
  }
  redactLocalOutput(value) {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian.FileSystemAdapter)) return value;
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
    return candidate instanceof import_obsidian.TFile ? candidate : null;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACTION_BY_ID,
  CONTROL_ACTIONS,
  MANAGED_PROFILE_CLASSES,
  parseControlBlock,
  profilesForPath
});
