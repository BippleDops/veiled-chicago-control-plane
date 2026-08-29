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
  TFolder,
  WorkspaceLeaf
} from "obsidian";
import { execFile, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";

import {
  ACTION_BY_ID,
  CONTROL_ACTIONS,
  MANAGED_PROFILE_CLASSES,
  parseControlBlock,
  profilesForPath,
  type ActionGroup,
  type ControlAction
} from "./actions";
import {
  buildDeclarationProposal,
  buildEventProposal,
  buildManagedNoteProposal,
  buildQuickCaptureProposal,
  buildRunProposal,
  buildSessionRoomProposal,
  buildTranscriptionRequestProposal,
  CAPABILITY_POLICY,
  contentMatchesExpected,
  contentHash,
  CONTEXT_PROFILES,
  MANAGED_NOTE_SCHEMAS,
  normalizeSessionDisplayName,
  normalizeSessionRoomPath,
  normalizeVaultPath,
  parseExplicitNextSession,
  resolveOperationMode,
  targetMatchesBaseline,
  validateControlResult,
  validateReviewedProposal,
  type ControlResult,
  type ContextProfileId,
  type MutationProposal,
  type ReviewedMutationProposal
} from "./operating";
import {
  ProposalReviewModal,
  WorkflowFormModal,
  type WorkflowField,
  type WorkflowValues
} from "./workflow-ui";
import { sessionControlRoomPath, VAULT_PATHS } from "./paths";

const VIEW_TYPE = "veiled-chicago-control-plane";
const CURRENT_STATE_PATH = VAULT_PATHS.currentState;
const CURRENT_LEADS_PATH = VAULT_PATHS.currentLeads;
const GROUPS: readonly ActionGroup[] = [
  "Live operations",
  "Creation and session",
  "AI and governance",
  "World and maps",
  "Applications",
  "Automation"
];
const APPROVED_AUDIO_EXTENSIONS = new Set(["aac", "flac", "m4a", "mp3", "ogg", "wav", "webm"]);

interface ControlPlaneSettings {
  automationEnabled: boolean;
  autoProfiles: boolean;
  openNotesInNewTab: boolean;
  confirmScriptActions: boolean;
  mapUrl: string;
  scriptTimeoutSeconds: number;
  maxOutputCharacters: number;
  activeSessionRoom: string | null;
  activeSessionName: string | null;
  activeContextProfile: ContextProfileId;
  recentRuns: RunRecord[];
  recentTransactions: TransactionRecord[];
  proposalReplayIds: string[];
}

interface RunRecord {
  actionId: string;
  title: string;
  ok: boolean;
  timestamp: string;
  durationMs: number;
  output: string;
}

interface TransactionRecord {
  id: string;
  title: string;
  ok: boolean;
  timestamp: string;
  operationCount: number;
  summary: string;
}

interface LiveState {
  latestLabel: string;
  latestFile: TFile | null;
  nextSession: number | null;
  deploymentMode: string;
  openLeadTasks: number;
  stateModified: number | null;
  activeSessionRoom: string | null;
  activeSessionName: string | null;
}

interface HealthCheck {
  label: string;
  state: "pass" | "attention" | "info";
  detail: string;
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
  mapUrl: "http://127.0.0.1:5173/",
  scriptTimeoutSeconds: 45,
  maxOutputCharacters: 12000,
  activeSessionRoom: null,
  activeSessionName: null,
  activeContextProfile: "session-live",
  recentRuns: [],
  recentTransactions: [],
  proposalReplayIds: []
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

function isTransactionRecord(value: unknown): value is TransactionRecord {
  const record = asRecord(value);
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.ok === "boolean" &&
    typeof record.timestamp === "string" &&
    Number.isFinite(Date.parse(record.timestamp)) &&
    typeof record.operationCount === "number" &&
    Number.isInteger(record.operationCount) &&
    record.operationCount >= 0 &&
    typeof record.summary === "string"
  );
}

function isContextProfileId(value: unknown): value is ContextProfileId {
  return typeof value === "string" && CONTEXT_PROFILES.some((profile) => profile.id === value);
}

function stringValue(values: WorkflowValues, id: string): string {
  const value = values[id];
  return typeof value === "string" ? value : "";
}

function isEventStatus(value: string): value is "confirmed" | "contested" | "unknown" {
  return value === "confirmed" || value === "contested" || value === "unknown";
}

function isAudience(value: string): value is "dm" | "players" | "both" {
  return value === "dm" || value === "players" || value === "both";
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

    this.renderContextPolicy(contentEl);
    this.renderHealth(contentEl);
    this.renderTransactions(contentEl);
    this.renderRecentRuns(contentEl);
    this.applyFilter(contentEl);
  }

  scrollToSection(section: string): void {
    const target = this.contentEl.querySelector<HTMLElement>(`[data-vc-section="${section}"]`);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  }

  private addMetric(container: HTMLElement, label: string, value: string): void {
    const item = container.createDiv({ cls: "vc-control-metric" });
    item.createEl("dt", { text: label });
    item.createEl("dd", { text: value });
  }

  private renderLiveEdgeRouter(container: HTMLElement, live: LiveState): void {
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
    ] as const;
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

  private renderContextPolicy(container: HTMLElement): void {
    const section = container.createEl("section", {
      cls: "vc-control-policy",
      attr: { "data-vc-section": "ai-policy", tabindex: "-1", "aria-label": "AI context policy" }
    });
    const heading = section.createDiv({ cls: "vc-control-section-heading" });
    heading.createEl("h2", { text: "AI context and capability guardrails" });
    heading.createSpan({ text: `${CAPABILITY_POLICY.aiWriteMode} / ${CAPABILITY_POLICY.canonPromotion}` });
    const phases = section.createEl("ol", { cls: "vc-control-phase-list" });
    for (const phase of ["observe", "propose", "execute"] as const) {
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

  private renderHealth(container: HTMLElement): void {
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

  private renderTransactions(container: HTMLElement): void {
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
      item.createSpan({ text: `${transaction.title} · ${transaction.operationCount} operation(s)` });
      item.createEl("time", { text: new Date(transaction.timestamp).toLocaleString() });
      item.createEl("code", { text: transaction.id });
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
      .setName("Active AI context profile")
      .setDesc("Retrieval policy contract only. Every profile remains read-only toward canonical owners.")
      .addDropdown((dropdown) => {
        for (const profile of CONTEXT_PROFILES) dropdown.addOption(profile.id, profile.title);
        dropdown.setValue(this.plugin.settings.activeContextProfile).onChange(async (value) => {
          if (!isContextProfileId(value)) return;
          await this.plugin.setActiveContextProfile(value);
        });
      });

    new Setting(containerEl)
      .setName("Explicit active session room")
      .setDesc(
        this.plugin.settings.activeSessionRoom
          ? `${this.plugin.settings.activeSessionName ?? "Session room"}: ${this.plugin.settings.activeSessionRoom}`
          : "Not selected. The plugin will not infer a room from filenames or next_session."
      )
      .addButton((button) =>
        button.setButtonText("Select").onClick(() => void this.plugin.executeAction("set-active-session-room", "command"))
      )
      .addButton((button) =>
        button
          .setButtonText("Clear")
          .setDisabled(!this.plugin.settings.activeSessionRoom)
          .onClick(async () => {
            this.plugin.settings.activeSessionRoom = null;
            this.plugin.settings.activeSessionName = null;
            await this.plugin.saveSettings();
            this.display();
            await this.plugin.refreshViews();
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
  private readonly pendingWorkflowModals = new Set<WorkflowFormModal>();
  private readonly pendingProposalModals = new Set<ProposalReviewModal>();
  private transactionInProgress = false;
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

  async loadSettings(): Promise<void> {
    const saved = asRecord(await this.loadData());
    const timeout = Math.min(300, Math.max(5, Number(saved.scriptTimeoutSeconds) || DEFAULT_SETTINGS.scriptTimeoutSeconds));
    const outputLimit = Math.min(
      50000,
      Math.max(2000, Number(saved.maxOutputCharacters) || DEFAULT_SETTINGS.maxOutputCharacters)
    );
    const recentRuns = Array.isArray(saved.recentRuns) ? saved.recentRuns.filter(isRunRecord) : [];
    const recentTransactions = Array.isArray(saved.recentTransactions)
      ? saved.recentTransactions.filter(isTransactionRecord)
      : [];
    let activeSessionRoom: string | null = null;
    let activeSessionName: string | null = null;
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
      automationEnabled:
        typeof saved.automationEnabled === "boolean" ? saved.automationEnabled : DEFAULT_SETTINGS.automationEnabled,
      autoProfiles: typeof saved.autoProfiles === "boolean" ? saved.autoProfiles : DEFAULT_SETTINGS.autoProfiles,
      openNotesInNewTab:
        typeof saved.openNotesInNewTab === "boolean" ? saved.openNotesInNewTab : DEFAULT_SETTINGS.openNotesInNewTab,
      confirmScriptActions:
        typeof saved.confirmScriptActions === "boolean"
          ? saved.confirmScriptActions
          : DEFAULT_SETTINGS.confirmScriptActions,
      mapUrl: typeof saved.mapUrl === "string" ? saved.mapUrl : DEFAULT_SETTINGS.mapUrl,
      scriptTimeoutSeconds: timeout,
      maxOutputCharacters: outputLimit,
      activeSessionRoom,
      activeSessionName,
      activeContextProfile: isContextProfileId(saved.activeContextProfile)
        ? saved.activeContextProfile
        : DEFAULT_SETTINGS.activeContextProfile,
      recentRuns: recentRuns.slice(0, 8).map((run) => ({
        ...run,
        output: this.redactLocalOutput(run.output).slice(-outputLimit)
      })),
      recentTransactions: recentTransactions.slice(0, 12),
      proposalReplayIds: Array.isArray(saved.proposalReplayIds)
        ? saved.proposalReplayIds
            .filter(
              (value): value is string =>
                typeof value === "string" && /^vcg-[a-z-]+-\d+-[a-f0-9]{8}$/.test(value)
            )
            .slice(0, 256)
        : []
    };
    if (!isSafeMapUrl(this.settings.mapUrl)) this.settings.mapUrl = DEFAULT_SETTINGS.mapUrl;
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async activateView(section?: string): Promise<void> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    if (section && leaf.view instanceof ControlPlaneView) leaf.view.scrollToSection(section);
  }

  async setActiveContextProfile(profile: ContextProfileId): Promise<void> {
    this.settings.activeContextProfile = profile;
    await this.saveSettings();
    await this.refreshViews();
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
    const latestFile = latestTarget ? this.app.metadataCache.getFirstLinkpathDest(latestTarget, CURRENT_STATE_PATH) : null;
    const nextSession = parseExplicitNextSession(frontmatter.next_session);

    return {
      latestLabel: wikilinkLabel(latestValue) || latestFile?.basename || "UNRESOLVED",
      latestFile,
      nextSession,
      deploymentMode: normalizeDeployment(frontmatter.deployment_mode),
      openLeadTasks: await this.countOpenTasks(CURRENT_LEADS_PATH),
      stateModified: stateFile?.stat.mtime ?? null,
      activeSessionRoom: this.settings.activeSessionRoom,
      activeSessionName: this.settings.activeSessionName
    };
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
    button.setAttribute("aria-disabled", String(!availability.available));
    button.setAttribute(
      "aria-label",
      `${action.title}. ${action.description}${availability.reason ? ` Unavailable: ${availability.reason}` : ""}`
    );
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
      case "workflow":
        if (["create-managed-note", "capture-quick-inbox", "set-active-session-room"].includes(action.id)) {
          return { available: true };
        }
        return this.settings.activeSessionRoom && this.settings.activeSessionName
          ? { available: true }
          : { available: false, reason: "Select an explicit active session room first." };
      case "script":
        if (!this.settings.automationEnabled) return { available: false, reason: "Local automation is disabled in plugin settings." };
        if (!Platform.isMacOS) {
          return { available: false, reason: "The reviewed automation wrapper currently requires macOS/POSIX process tools." };
        }
        if (!(this.app.vault.adapter instanceof FileSystemAdapter)) {
          return { available: false, reason: "The vault has no local filesystem adapter." };
        }
        return this.fileAt(VAULT_PATHS.controlWrapper)
          ? { available: true }
          : { available: false, reason: `Missing ${VAULT_PATHS.controlWrapper}.` };
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
          void this.performAction(action).catch((error: unknown) => this.reportActionError(action.title, error));
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

  private reportActionError(title: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    new Notice(`${title}: ${message}`, 12000);
  }

  private async performAction(action: ControlAction): Promise<void> {
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
      case "workflow":
        await this.executeWorkflow(action.id);
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
    const existing = this.app.workspace.getLeavesOfType("markdown").find((leaf) => {
      const view = leaf.view;
      return view instanceof MarkdownView && view.file?.path === file.path;
    });
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
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
      const file = link ? this.app.metadataCache.getFirstLinkpathDest(link, CURRENT_STATE_PATH) : null;
      return file
        ? { file, available: { available: true } }
        : { file: null, available: { available: false, reason: "No latest played journal resolves from current state." } };
    }
    if (target === "next-session") {
      const next = parseExplicitNextSession(frontmatter.next_session);
      if (next === null) {
        return {
          file: null,
          available: { available: false, reason: "Current State has no valid positive-integer next_session declaration." }
        };
      }
      const path = sessionControlRoomPath(next);
      const file = this.fileAt(path);
      return file
        ? { file, available: { available: true } }
        : { file: null, available: { available: false, reason: `Declared next session has no control room: ${path}` } };
    }
    const active = this.activeSession();
    const suffixes: Readonly<Record<string, string>> = {
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
      return file
        ? { file, available: { available: true } }
        : { file: null, available: { available: false, reason: `Active room is missing ${suffix}: ${path}` } };
    }
    return { file: null, available: { available: false, reason: `Unknown dynamic target: ${target}` } };
  }

  getHealthChecks(): HealthCheck[] {
    const active = this.activeSession();
    const fixedTools = [
      ["Obsidian CLI", "/opt/homebrew/bin/obsidian"],
      ["n8n", "/opt/homebrew/bin/n8n"],
      ["ffmpeg", "/opt/homebrew/bin/ffmpeg"],
      ["whisper-cli", "/opt/homebrew/bin/whisper-cli"]
    ] as const;
    const checks: HealthCheck[] = [
      {
        label: "Active session registry",
        state: active ? "pass" : "attention",
        detail: active ? `${active.displayName} · ${active.roomPath}` : "Not selected; filename inference remains disabled."
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
        detail: this.fileAt(VAULT_PATHS.controlWrapper)
          ? "Fixed-action wrapper present."
          : `${VAULT_PATHS.controlWrapper} is missing.`
      }
    ];
    for (const [label, path] of fixedTools) {
      checks.push({
        label,
        state: existsSync(path) ? "pass" : "attention",
        detail: existsSync(path) ? `Available at ${path}.` : `Not found at reviewed path ${path}.`
      });
    }
    checks.push({
      label: "Whisper model",
      state: existsSync(`${process.env.HOME ?? ""}/.cache/openwhispr/whisper-models/ggml-base.bin`) ? "pass" : "attention",
      detail: "Transcription remains receipt-only until a separate reviewed runner is enabled."
    });
    return checks;
  }

  private activeSession(): { roomPath: string; displayName: string } | null {
    if (!this.settings.activeSessionRoom || !this.settings.activeSessionName) return null;
    return { roomPath: this.settings.activeSessionRoom, displayName: this.settings.activeSessionName };
  }

  private async executeWorkflow(id: string): Promise<void> {
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
        new Notice(`Unknown workflow action: ${id}`);
    }
  }

  private openManagedNoteWizard(): void {
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
              type: "text" as const,
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

  private openQuickCapture(): void {
    this.openWorkflowModal(
      "Quick capture",
      "Capture goes to the operations inbox as a timestamped candidate, never directly to canon.",
      [{ id: "text", label: "Capture", type: "textarea", required: true, placeholder: "Observation, question, correction, or idea" }],
      "Review proposal",
      (values) => {
        this.reviewProposal(
          buildQuickCaptureProposal({
            text: stringValue(values, "text"),
            timestamp: new Date().toISOString(),
            proposalId: this.proposalId("capture")
          })
        );
      }
    );
  }

  private openSessionRoomSelector(): void {
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
        new Notice(`Active session room selected: ${displayName}. No canon or next-session field changed.`, 7000);
      }
    );
  }

  private proposeSessionScaffold(): void {
    const active = this.requireActiveSession();
    const proposal = buildSessionRoomProposal({
      roomPath: active.roomPath,
      displayName: active.displayName,
      createdDate: this.today(),
      proposalId: this.proposalId("room")
    });
    const operations = proposal.operations.filter((operation) => {
      const existing = this.app.vault.getAbstractFileByPath(operation.path);
      if (existing instanceof TFolder) throw new Error(`A folder blocks scaffold file: ${operation.path}`);
      return !(existing instanceof TFile);
    });
    if (operations.length === 0) {
      new Notice(`${active.displayName} already contains every scaffold file; nothing was proposed.`, 7000);
      return;
    }
    this.reviewProposal({
      ...proposal,
      summary: `Create ${operations.length} missing draft workflow note(s) in ${active.roomPath}; existing files remain untouched.`,
      operations
    });
  }

  private openDeclarationCapture(): void {
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
            timestamp: new Date().toISOString(),
            proposalId: this.proposalId("declaration")
          })
        );
      }
    );
  }

  private async proposeSessionRun(): Promise<void> {
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

  private openEventCapture(): void {
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
            timestamp: new Date().toISOString(),
            proposalId: this.proposalId("event")
          })
        );
      }
    );
  }

  private openTranscriptionRequest(): void {
    const active = this.requireActiveSession();
    const audioFiles = this.app.vault
      .getFiles()
      .filter((file) => APPROVED_AUDIO_EXTENSIONS.has(file.extension.toLowerCase()))
      .sort((left, right) => left.path.localeCompare(right.path));
    if (audioFiles.length === 0) {
      new Notice("No approved audio file exists in the vault. Nothing was selected or executed.", 8000);
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
            timestamp: new Date().toISOString(),
            proposalId: this.proposalId("transcript")
          })
        );
      }
    );
  }

  private requireActiveSession(): { roomPath: string; displayName: string } {
    const active = this.activeSession();
    if (!active) throw new Error("Select an explicit active session room first.");
    return active;
  }

  private reviewProposal(proposal: MutationProposal): void {
    let modal: ProposalReviewModal;
    modal = new ProposalReviewModal(
      this.app,
      proposal,
      (reviewed) => this.executeReviewedProposal(reviewed),
      () => this.pendingProposalModals.delete(modal)
    );
    this.pendingProposalModals.add(modal);
    modal.open();
  }

  private openWorkflowModal(
    heading: string,
    description: string,
    fields: readonly WorkflowField[],
    submitLabel: string,
    onSubmit: (values: WorkflowValues) => Promise<void> | void
  ): void {
    let modal: WorkflowFormModal;
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

  private proposalId(kind: string): string {
    return `vcg-${kind}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async executeReviewedProposal(proposal: ReviewedMutationProposal): Promise<void> {
    if (this.unloading) throw new Error("The plugin is unloading; transaction execution is blocked.");
    validateReviewedProposal(proposal);
    if (this.transactionInProgress) throw new Error("Another reviewed transaction is already in progress.");
    this.transactionInProgress = true;
    const createdFiles: Array<{ path: string; expected: string }> = [];
    const appends: Array<{ path: string; before: string; expected: string }> = [];
    try {
      if (this.settings.proposalReplayIds.includes(proposal.id)) {
        throw new Error(`Proposal ${proposal.id} has already executed or attempted execution; create a new proposal to retry.`);
      }
      const plan = await Promise.all(proposal.operations.map(async (operation, index) => {
        this.preflightParentFolders(operation.path);
        const baseline = proposal.targetBaselines[index];
        if (!baseline) throw new Error(`Reviewed target baseline is missing: ${operation.path}`);
        const target = this.app.vault.getAbstractFileByPath(operation.path);
        const targetKind = target instanceof TFile ? "file" : target instanceof TFolder ? "folder" : "missing";
        const contents = target instanceof TFile ? await this.app.vault.read(target) : null;
        const mtime = target instanceof TFile ? target.stat.mtime : null;
        const size = target instanceof TFile ? target.stat.size : null;
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
          const contents =
            item.operation.kind === "append"
              ? `${item.operation.initialContents ?? ""}${item.operation.contents}`
              : item.operation.contents;
          await this.app.vault.create(item.operation.path, contents);
          createdFiles.push({ path: item.operation.path, expected: contents });
          continue;
        }
        const appendTarget = this.app.vault.getAbstractFileByPath(item.operation.path);
        if (!(appendTarget instanceof TFile) || item.operation.kind !== "append") {
          throw new Error(`Reviewed append target changed before execution: ${item.operation.path}`);
        }
        if (appendTarget.stat.mtime !== item.baseline.mtime || appendTarget.stat.size !== item.baseline.size) {
          throw new Error(`Reviewed append metadata changed before execution: ${item.operation.path}`);
        }
        let before: string | null = null;
        let expected: string | null = null;
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
      new Notice(`${proposal.title}: applied ${plan.length} reviewed operation(s).`, 7000);
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

  private preflightParentFolders(filePath: string): void {
    const segments = normalizeVaultPath(filePath).split("/").slice(0, -1);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (this.app.vault.getAbstractFileByPath(current) instanceof TFile) {
        throw new Error(`A file blocks required folder: ${current}`);
      }
    }
  }

  private async ensureParentFolders(filePath: string): Promise<void> {
    const segments = normalizeVaultPath(filePath).split("/").slice(0, -1);
    let current = "";
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      const existing = this.app.vault.getAbstractFileByPath(current);
      if (existing instanceof TFile) throw new Error(`A file blocks required folder: ${current}`);
      if (existing instanceof TFolder) continue;
      await this.app.vault.createFolder(current);
    }
  }

  private async rollbackProposal(
    createdFiles: readonly { path: string; expected: string }[],
    appends: readonly { path: string; before: string; expected: string }[]
  ): Promise<string[]> {
    const errors: string[] = [];
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

  private async recordTransaction(proposal: MutationProposal, ok: boolean): Promise<void> {
    const record: TransactionRecord = {
      id: proposal.id,
      title: proposal.title,
      ok,
      timestamp: new Date().toISOString(),
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

  private invokeControlWrapper(scriptId: string): Promise<ControlResult> {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) return Promise.reject(new Error("Local filesystem access is unavailable."));
    const root = adapter.getBasePath();
    const scriptPath = `${root}/${VAULT_PATHS.controlWrapper}`;

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
    if (!action.protocolSafe) {
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
