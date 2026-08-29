import {
  App,
  FileSystemAdapter,
  ItemView,
  MarkdownView,
  Modal,
  Notice,
  Platform,
  Plugin,
  PluginSettingTab,
  Setting,
  setIcon,
  TFile,
  WorkspaceLeaf
} from "obsidian";
import { execFile, type ChildProcess } from "node:child_process";

import {
  ACTION_BY_ID,
  CONTROL_ACTIONS,
  MANAGED_PROFILE_CLASSES,
  parseControlBlock,
  profilesForPath,
  type ActionGroup,
  type ControlAction
} from "./actions";

const VIEW_TYPE = "veiled-chicago-control-plane";
const CURRENT_STATE_PATH = "1-DM Toolkit/Current State of Affairs.md";
const CURRENT_LEADS_PATH = "1-Party/Current Leads.md";
const GROUPS: readonly ActionGroup[] = ["Live operations", "World and maps", "Applications", "Automation"];

interface ControlPlaneSettings {
  automationEnabled: boolean;
  autoProfiles: boolean;
  openNotesInNewTab: boolean;
  confirmScriptActions: boolean;
  allowProtocolAutomation: boolean;
  mapUrl: string;
  scriptTimeoutSeconds: number;
  maxOutputCharacters: number;
  recentRuns: RunRecord[];
}

interface RunRecord {
  actionId: string;
  title: string;
  ok: boolean;
  timestamp: string;
  durationMs: number;
  output: string;
}

interface ScriptPayload {
  action: string;
  ok: boolean;
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
}

interface LiveState {
  latestLabel: string;
  latestFile: TFile | null;
  nextSession: number | null;
  deploymentMode: string;
  openLeadTasks: number;
  stateModified: number | null;
}

interface Availability {
  available: boolean;
  reason?: string;
}

interface CommandManagerCompat {
  findCommand?: (id: string) => unknown;
  executeCommandById?: (id: string) => boolean;
  commands?: Record<string, unknown>;
}

const DEFAULT_SETTINGS: ControlPlaneSettings = {
  automationEnabled: false,
  autoProfiles: true,
  openNotesInNewTab: true,
  confirmScriptActions: true,
  allowProtocolAutomation: false,
  mapUrl: "http://127.0.0.1:5173/",
  scriptTimeoutSeconds: 45,
  maxOutputCharacters: 12000,
  recentRuns: []
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function wikilinkTarget(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|[^\]]*)?\]\]/);
  return match?.[1]?.trim() || null;
}

function wikilinkLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/\[\[[^\]]+\|([^\]]+)\]\]/);
  if (match?.[1]) return match[1].trim();
  return wikilinkTarget(value)?.split("/").pop() ?? null;
}

function normalizeDeployment(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "UNDECLARED";
  return value.trim().replace(/[-_]+/g, " ").toUpperCase();
}

function isSafeMapUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    return url.protocol === "http:" && loopback && !url.username && !url.password;
  } catch {
    return false;
  }
}

function openExternalUrl(raw: string): void {
  window.open(raw, "_blank", "noopener,noreferrer");
}

function attributeToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return token || null;
}

function isRunRecord(value: unknown): value is RunRecord {
  const record = asRecord(value);
  return (
    typeof record.actionId === "string" &&
    ACTION_BY_ID.has(record.actionId) &&
    typeof record.title === "string" &&
    typeof record.ok === "boolean" &&
    typeof record.timestamp === "string" &&
    Number.isFinite(Date.parse(record.timestamp)) &&
    typeof record.durationMs === "number" &&
    Number.isFinite(record.durationMs) &&
    record.durationMs >= 0 &&
    typeof record.output === "string"
  );
}

class ConfirmActionModal extends Modal {
  constructor(
    app: App,
    private readonly message: string,
    private readonly onConfirm: () => void,
    private readonly onDismiss: () => void
  ) {
    super(app);
  }

  onOpen(): void {
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

  onClose(): void {
    this.onDismiss();
    this.contentEl.empty();
  }
}

class ControlPlaneView extends ItemView {
  private filter = "";

  constructor(leaf: WorkspaceLeaf, private readonly plugin: VeiledChicagoControlPlane) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Veiled Chicago Control Plane";
  }

  getIcon(): string {
    return "radar";
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  async render(): Promise<void> {
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
      placeholder: "Search actions…",
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
    setIcon(refresh, "refresh-cw");
    refresh.addEventListener("click", () => void this.render());

    const main = contentEl.createEl("main", { cls: "vc-control-main" });
    for (const group of GROUPS) this.renderGroup(main, group);

    this.renderRecentRuns(contentEl);
    this.applyFilter(contentEl);
  }

  private addMetric(container: HTMLElement, label: string, value: string): void {
    const item = container.createDiv({ cls: "vc-control-metric" });
    item.createEl("dt", { text: label });
    item.createEl("dd", { text: value });
  }

  private renderGroup(container: HTMLElement, group: ActionGroup): void {
    const section = container.createEl("section", { cls: "vc-control-section" });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: group });
    heading.createSpan({ text: `${CONTROL_ACTIONS.filter((action) => action.group === group).length} controls` });
    const grid = section.createDiv({ cls: "vc-control-grid" });
    for (const action of CONTROL_ACTIONS.filter((candidate) => candidate.group === group)) {
      grid.appendChild(this.plugin.createActionButton(action, "view"));
    }
  }

  private renderRecentRuns(container: HTMLElement): void {
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

  private applyFilter(container: HTMLElement): void {
    const query = this.filter.trim().toLowerCase();
    for (const button of container.querySelectorAll<HTMLElement>(".vc-control-action")) {
      const haystack = button.dataset.search ?? "";
      button.toggleClass("is-filtered", Boolean(query) && !haystack.includes(query));
    }
    for (const section of container.querySelectorAll<HTMLElement>(".vc-control-section")) {
      const visible = section.querySelector(".vc-control-action:not(.is-filtered)");
      section.toggleClass("is-filtered", !visible);
    }
  }
}

class ControlPlaneSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: VeiledChicagoControlPlane) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("vc-control-settings");
    containerEl.createEl("h2", { text: "Veiled Chicago Control Plane" });
    containerEl.createEl("p", {
      text: "The plugin never executes commands supplied by notes. Markdown control blocks can reference only compiled action IDs."
    });

    new Setting(containerEl)
      .setName("Automatic workflow profiles")
      .setDesc("Apply existing vcg-dashboard/session/dossier/data/map/handout classes by path and frontmatter without rewriting notes.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoProfiles).onChange(async (value) => {
          this.plugin.settings.autoProfiles = value;
          await this.plugin.saveSettings();
          this.plugin.applyProfilesToAllLeaves();
        })
      );

    new Setting(containerEl)
      .setName("Open notes in new tabs")
      .setDesc("Keep the control plane visible while opening campaign surfaces.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.openNotesInNewTab).onChange(async (value) => {
          this.plugin.settings.openNotesInNewTab = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable local automation")
      .setDesc("Allow the desktop app to call the audited Python wrapper with exact action IDs. Navigation remains available when disabled.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.automationEnabled).onChange(async (value) => {
          this.plugin.settings.automationEnabled = value;
          await this.plugin.saveSettings();
          await this.plugin.refreshViews();
        })
      );

    new Setting(containerEl)
      .setName("Confirm process actions")
      .setDesc("Require an in-app confirmation before starting or stopping the local map server.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.confirmScriptActions).onChange(async (value) => {
          this.plugin.settings.confirmScriptActions = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Allow automation from obsidian://vc-control")
      .setDesc("Off by default. Navigation URI actions remain available; script actions are rejected unless this is enabled.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.allowProtocolAutomation).onChange(async (value) => {
          this.plugin.settings.allowProtocolAutomation = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Local map URL")
      .setDesc("Loopback HTTP URL used only as a fallback when the Veiled Chicago Map Custom Frame command is unavailable.")
      .addText((text) =>
        text.setPlaceholder(DEFAULT_SETTINGS.mapUrl).setValue(this.plugin.settings.mapUrl).onChange(async (value) => {
          const trimmed = value.trim();
          if (trimmed && isSafeMapUrl(trimmed)) {
            this.plugin.settings.mapUrl = trimmed;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName("Automation timeout")
      .setDesc("Seconds before a foreground audit is terminated. Range: 5–300.")
      .addText((text) =>
        text.setValue(String(this.plugin.settings.scriptTimeoutSeconds)).onChange(async (value) => {
          const parsed = Number.parseInt(value, 10);
          if (Number.isFinite(parsed) && parsed >= 5 && parsed <= 300) {
            this.plugin.settings.scriptTimeoutSeconds = parsed;
            await this.plugin.saveSettings();
          }
        })
      );
  }
}

export default class VeiledChicagoControlPlane extends Plugin {
  settings: ControlPlaneSettings = { ...DEFAULT_SETTINGS };
  private readonly runningActions = new Set<string>();
  private readonly profileAssignments = new Map<HTMLElement, Set<string>>();
  private readonly attributeAssignments = new Map<HTMLElement, Map<string, string | null>>();
  private readonly tabSelectSnapshots = new Map<HTMLSelectElement, { bound: string | null; controls: string | null }>();
  private readonly tabBoxSnapshots = new Map<HTMLElement, { id: string | null; ready: string | null }>();
  private readonly tabPanelSnapshots = new Map<HTMLElement, { hidden: string | null; ariaHidden: string | null }>();
  private readonly insertedStateLabels = new Set<HTMLElement>();
  private readonly activeChildren = new Set<ChildProcess>();
  private readonly pendingConfirmationModals = new Set<ConfirmActionModal>();
  private refreshTimer: number | null = null;
  private statusButton: HTMLButtonElement | null = null;
  private unloading = false;

  async onload(): Promise<void> {
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

  onunload(): void {
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

  async loadSettings(): Promise<void> {
    const saved = asRecord(await this.loadData());
    const timeout = Math.min(300, Math.max(5, Number(saved.scriptTimeoutSeconds) || DEFAULT_SETTINGS.scriptTimeoutSeconds));
    const outputLimit = Math.min(
      50000,
      Math.max(2000, Number(saved.maxOutputCharacters) || DEFAULT_SETTINGS.maxOutputCharacters)
    );
    const recentRuns = Array.isArray(saved.recentRuns) ? saved.recentRuns.filter(isRunRecord) : [];
    this.settings = {
      automationEnabled:
        typeof saved.automationEnabled === "boolean" ? saved.automationEnabled : DEFAULT_SETTINGS.automationEnabled,
      autoProfiles: typeof saved.autoProfiles === "boolean" ? saved.autoProfiles : DEFAULT_SETTINGS.autoProfiles,
      openNotesInNewTab:
        typeof saved.openNotesInNewTab === "boolean" ? saved.openNotesInNewTab : DEFAULT_SETTINGS.openNotesInNewTab,
      confirmScriptActions:
        typeof saved.confirmScriptActions === "boolean"
          ? saved.confirmScriptActions
          : DEFAULT_SETTINGS.confirmScriptActions,
      allowProtocolAutomation:
        typeof saved.allowProtocolAutomation === "boolean"
          ? saved.allowProtocolAutomation
          : DEFAULT_SETTINGS.allowProtocolAutomation,
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

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async activateView(): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
  }

  async refreshViews(): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof ControlPlaneView) await view.render();
    }
    await this.updateStatusButton();
  }

  private scheduleRefresh(delay = 80): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      this.applyProfilesToAllLeaves();
      void this.refreshViews();
    }, delay);
  }

  async readLiveState(): Promise<LiveState> {
    const stateFile = this.fileAt(CURRENT_STATE_PATH);
    const frontmatter = stateFile ? asRecord(this.app.metadataCache.getFileCache(stateFile)?.frontmatter) : {};
    const latestValue = frontmatter.last_played_record;
    const latestTarget = wikilinkTarget(latestValue);
    const latestFile = latestTarget
      ? this.app.metadataCache.getFirstLinkpathDest(latestTarget, CURRENT_STATE_PATH)
      : this.findLatestPlayedFallback();
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

  private findLatestPlayedFallback(): TFile | null {
    return (
      this.app.vault
        .getMarkdownFiles()
        .filter((file) => /^1-Session Journals\/Session \d+\/c1a-session-\d+\.md$/i.test(file.path))
        .sort((left, right) => right.path.localeCompare(left.path, undefined, { numeric: true }))[0] ?? null
    );
  }

  private async countOpenTasks(path: string): Promise<number> {
    const file = this.fileAt(path);
    if (!file) return 0;
    const content = await this.app.vault.cachedRead(file);
    return (content.match(/^\s*[-*]\s+\[ \]\s+/gm) ?? []).length;
  }

  createActionButton(action: ControlAction, source: "view" | "block"): HTMLButtonElement {
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
    setIcon(icon, this.runningActions.has(action.id) ? "loader-circle" : action.icon);
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

  private renderControlBlock(source: string, element: HTMLElement): void {
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

  getAvailability(action: ControlAction): Availability {
    if (this.runningActions.has(action.id)) return { available: false, reason: "Action is already running." };
    if (action.desktopOnly && !Platform.isDesktopApp) return { available: false, reason: "Desktop Obsidian is required." };

    switch (action.kind) {
      case "note":
        return this.fileAt(action.target ?? "")
          ? { available: true }
          : { available: false, reason: `Missing note: ${action.target ?? "unknown"}` };
      case "dynamic-note": {
        const target = this.resolveDynamicFile(action.target ?? "");
        return target.available;
      }
      case "command":
        return action.target && this.commandAvailable(action.target)
          ? { available: true }
          : { available: false, reason: `Required plugin command is unavailable: ${action.target ?? "unknown"}` };
      case "integration":
        if (action.target && this.commandAvailable(action.target)) return { available: true };
        return isSafeMapUrl(this.settings.mapUrl)
          ? { available: true, reason: "Custom Frame unavailable; opens the configured browser URL." }
          : { available: false, reason: "No valid integration URL or Custom Frame command." };
      case "script":
        if (!this.settings.automationEnabled) return { available: false, reason: "Local automation is disabled in plugin settings." };
        if (!Platform.isMacOS) {
          return { available: false, reason: "The reviewed automation wrapper currently requires macOS/POSIX process tools." };
        }
        if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
          return { available: false, reason: "The vault has no local filesystem adapter." };
        }
        return this.fileAt("scripts/vcg_control.py")
          ? { available: true }
          : { available: false, reason: "Missing scripts/vcg_control.py." };
      case "external":
        return action.target && /^https?:\/\//i.test(action.target)
          ? { available: true }
          : { available: false, reason: "External URL is invalid." };
      default:
        return { available: true };
    }
  }

  async executeAction(actionId: string, source: "view" | "block" | "command" | "protocol"): Promise<void> {
    const action = ACTION_BY_ID.get(actionId);
    if (!action) {
      new Notice(`Veiled Chicago Control Plane: unknown action '${actionId || "(empty)"}'.`);
      return;
    }
    const protocolBlock = this.protocolBlockReason(action, source);
    if (protocolBlock) {
      new Notice(protocolBlock);
      return;
    }

    const availability = this.getAvailability(action);
    if (!availability.available) {
      new Notice(availability.reason ?? `${action.title} is unavailable.`);
      return;
    }
    if (action.confirm && this.settings.confirmScriptActions) {
      let modal: ConfirmActionModal;
      modal = new ConfirmActionModal(
        this.app,
        action.confirm,
        () => {
          if (this.unloading) return;
          const currentProtocolBlock = this.protocolBlockReason(action, source);
          if (currentProtocolBlock) {
            new Notice(currentProtocolBlock);
            return;
          }
          const currentAvailability = this.getAvailability(action);
          if (!currentAvailability.available) {
            new Notice(currentAvailability.reason ?? `${action.title} is unavailable.`);
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

  private async performAction(action: ControlAction): Promise<void> {
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
          new Notice(`Could not execute ${action.title}.`);
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

  private async openFile(file: TFile | null): Promise<void> {
    if (!file) {
      new Notice("The requested campaign note could not be resolved.");
      return;
    }
    const leaf = this.app.workspace.getLeaf(this.settings.openNotesInNewTab ? "tab" : false);
    await leaf.openFile(file, { active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  private resolveDynamicFile(target: string): { file: TFile | null; available: Availability } {
    const stateFile = this.fileAt(CURRENT_STATE_PATH);
    const frontmatter = stateFile ? asRecord(this.app.metadataCache.getFileCache(stateFile)?.frontmatter) : {};
    if (target === "latest-played") {
      const link = wikilinkTarget(frontmatter.last_played_record);
      const file = link ? this.app.metadataCache.getFirstLinkpathDest(link, CURRENT_STATE_PATH) : this.findLatestPlayedFallback();
      return file
        ? { file, available: { available: true } }
        : { file: null, available: { available: false, reason: "No latest played journal resolves from current state." } };
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
      return file
        ? { file, available: { available: true } }
        : { file: null, available: { available: false, reason: `Declared next session has no control room: ${path}` } };
    }
    return { file: null, available: { available: false, reason: `Unknown dynamic target: ${target}` } };
  }

  private async runScriptAction(action: ControlAction): Promise<void> {
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
      const record: RunRecord = {
        actionId: action.id,
        title: action.title,
        ok: payload.ok,
        timestamp: new Date().toISOString(),
        durationMs: payload.duration_ms,
        output
      };
      this.settings.recentRuns = [record, ...this.settings.recentRuns.filter((run) => run.actionId !== action.id)].slice(0, 8);
      await this.saveSettings();
      new Notice(`${action.title}: ${payload.ok ? "PASS" : "attention required"}.`, payload.ok ? 4000 : 10000);
    } catch (error) {
      if (this.unloading) return;
      const message = error instanceof Error ? error.message : String(error);
      this.settings.recentRuns = [
        {
          actionId: action.id,
          title: action.title,
          ok: false,
          timestamp: new Date().toISOString(),
          durationMs: 0,
          output: this.redactLocalOutput(message).slice(-this.settings.maxOutputCharacters)
        },
        ...this.settings.recentRuns.filter((run) => run.actionId !== action.id)
      ].slice(0, 8);
      await this.saveSettings();
      new Notice(`${action.title} failed: ${message}`, 12000);
    } finally {
      this.runningActions.delete(action.id);
      if (!this.unloading) await this.refreshViews();
    }
  }

  private invokeControlWrapper(scriptId: string): Promise<ScriptPayload> {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) return Promise.reject(new Error("Local filesystem access is unavailable."));
    const root = adapter.getBasePath();
    const scriptPath = `${root}/scripts/vcg_control.py`;

    return new Promise((resolve, reject) => {
      let child: ChildProcess;
      child = execFile(
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
          timeout: this.settings.scriptTimeoutSeconds * 1000,
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
            const payload = JSON.parse(text) as ScriptPayload;
            if (
              typeof payload.action !== "string" ||
              typeof payload.ok !== "boolean" ||
              typeof payload.exit_code !== "number" ||
              typeof payload.stdout !== "string" ||
              typeof payload.stderr !== "string" ||
              typeof payload.duration_ms !== "number"
            ) {
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

  applyProfilesToAllLeaves(): void {
    this.clearManagedProfiles();
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const view = leaf.view;
      if (!(view instanceof MarkdownView) || !view.file) continue;
      const frontmatter = asRecord(this.app.metadataCache.getFileCache(view.file)?.frontmatter);
      const profiles = this.settings.autoProfiles ? profilesForPath(view.file.path, frontmatter) : [];
      for (const element of view.containerEl.querySelectorAll<HTMLElement>(".markdown-preview-view, .markdown-source-view")) {
        const added = new Set<string>();
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

  private applySemanticAttributes(element: HTMLElement, frontmatter: Record<string, unknown>): void {
    const values: Record<string, unknown> = {
      "data-vcg-audience": frontmatter.audience,
      "data-vcg-canon": frontmatter.canon_status,
      "data-vcg-retrieval": frontmatter.retrieval_scope,
      "data-vcg-session-state": frontmatter.session_status ?? frontmatter.status,
      "data-vcg-note-state": frontmatter.NoteStatus
    };
    const snapshots = new Map<string, string | null>();
    for (const [name, raw] of Object.entries(values)) {
      const token = attributeToken(raw);
      if (!token) continue;
      snapshots.set(name, element.getAttribute(name));
      element.setAttribute(name, token);
    }
    if (snapshots.size > 0) this.attributeAssignments.set(element, snapshots);
  }

  private prepareWorkflowDom(root: HTMLElement): void {
    this.prepareTabbedCallouts(root);
    const stateLabels: Record<string, string> = {
      "vcg-live": "Live",
      "vcg-blocked": "Blocked",
      "vcg-closeout": "Closeout"
    };
    for (const [type, label] of Object.entries(stateLabels)) {
      for (const callout of root.querySelectorAll<HTMLElement>(`.callout[data-callout="${type}"]`)) {
        const title = callout.querySelector<HTMLElement>(":scope > .callout-title");
        if (!title || title.querySelector(".vc-control-sr-state")) continue;
        const state = title.createSpan({ cls: "vc-control-sr-state", text: `Status: ${label}.` });
        this.insertedStateLabels.add(state);
      }
    }
  }

  private prepareTabbedCallouts(root: HTMLElement): void {
    const selects = root.querySelectorAll<HTMLSelectElement>(
      ".tabbed select, select.tabbed, .mb-input.tabbed select, .mb-input-wrapper.tabbed select"
    );
    for (const select of selects) {
      if (select.dataset.vcgTabsBound === "true") continue;
      const owner = select.closest<HTMLElement>(".callout") ?? select.parentElement;
      const box = owner?.querySelector<HTMLElement>('.callout[data-callout="tabbed-box"]');
      if (!box) continue;
      const panels = [...box.querySelectorAll<HTMLElement>('.callout[data-callout="div-m"]')].filter(
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
      const update = (): void => {
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

  private clearManagedProfiles(): void {
    for (const [element, classes] of this.profileAssignments) {
      for (const className of classes) element.classList.remove(className);
    }
    this.profileAssignments.clear();
    for (const [element, snapshots] of this.attributeAssignments) {
      for (const [name, value] of snapshots) this.restoreAttribute(element, name, value);
    }
    this.attributeAssignments.clear();
  }

  private restoreWorkflowDom(): void {
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

  private restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }

  private protocolBlockReason(
    action: ControlAction,
    source: "view" | "block" | "command" | "protocol"
  ): string | null {
    if (source !== "protocol") return null;
    if (action.kind === "script" && !this.settings.allowProtocolAutomation) {
      return "Veiled Chicago Control Plane blocked protocol-triggered automation. Enable it explicitly in settings if required.";
    }
    if (action.kind !== "script" && !action.protocolSafe) {
      return "Veiled Chicago Control Plane blocked an action that is not protocol-safe.";
    }
    return null;
  }

  private redactLocalOutput(value: string): string {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) return value;
    const root = adapter.getBasePath();
    const variants = new Set([root, root.replaceAll("\\", "/"), root.replaceAll("/", "\\")]);
    let redacted = value;
    for (const variant of variants) {
      if (variant) redacted = redacted.split(variant).join("<vault>");
    }
    return redacted;
  }

  private async updateStatusButton(): Promise<void> {
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

  private fileAt(path: string): TFile | null {
    const candidate = this.app.vault.getAbstractFileByPath(path);
    return candidate instanceof TFile ? candidate : null;
  }

  private commandManager(): CommandManagerCompat | null {
    const manager = (this.app as App & { commands?: CommandManagerCompat }).commands;
    return manager && typeof manager === "object" ? manager : null;
  }

  private commandAvailable(id: string): boolean {
    const manager = this.commandManager();
    if (!manager) return false;
    if (typeof manager.findCommand === "function") return Boolean(manager.findCommand(id));
    return Boolean(manager.commands && Object.prototype.hasOwnProperty.call(manager.commands, id));
  }

  private executeCommand(id: string): boolean {
    const manager = this.commandManager();
    return typeof manager?.executeCommandById === "function" && manager.executeCommandById(id);
  }
}

export { ACTION_BY_ID, CONTROL_ACTIONS, MANAGED_PROFILE_CLASSES, parseControlBlock, profilesForPath };
