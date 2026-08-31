import {
  App,
  FileView,
  FileSystemAdapter,
  FuzzySuggestModal,
  ItemView,
  MarkdownRenderer,
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
  type FuzzyMatch,
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
  type ActionSource,
  type ControlAction
} from "./actions";
import { ControlActionSearchModal } from "./command-search";
import { INTERFACE_CAPABILITIES, capabilityRuntimeStatus } from "./capabilities";
import {
  buildEntityIndex,
  deriveEntityType,
  ENTITY_ROOT_REGISTRY,
  ENTITY_TYPES,
  filterEntityIndex,
  type EntityIndexEntry,
  type EntityType
} from "./entity-navigator";
import {
  isCanonicalIsoTimestamp,
  isPrimaryRoute,
  normalizeFavoriteActionIds,
  normalizeRecentActions,
  ROUTE_DEFINITIONS,
  routeForLegacySection,
  RouteHistory,
  type PrimaryRoute,
  type RecentActionRecord
} from "./navigation";
import {
  buildDeclarationProposal,
  buildEventProposal,
  buildManagedNoteProposal,
  buildQuickCaptureProposal,
  buildRunProposal,
  buildSessionRoomProposal,
  buildTranscriptionRequestProposal,
  CAPABILITY_POLICY,
  collectRunSelectionEvidence,
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
import {
  ENTITY_SEARCH_DEBOUNCE_MS,
  escapeSurface,
  groupRouteActions,
  normalizeStartupSurface,
  parseAdStatblock,
  sanitizeAdStatblockMarkdown,
  shouldGroupRouteActions,
  stableDomIdToken,
  type StartupSurface
} from "./ui-contract";
import {
  CoreWebViewerController,
  isSafeMapUrl,
  resolveWebViewerActionUrl,
  WEB_VIEWER_CANCELLED_MESSAGE
} from "./web-viewer";

const VIEW_TYPE = "veiled-chicago-control-plane";
const CURRENT_STATE_PATH = VAULT_PATHS.currentState;
const CURRENT_LEADS_PATH = VAULT_PATHS.currentLeads;
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
  activeRoute: PrimaryRoute;
  startupSurface: StartupSurface;
  favoriteActionIds: string[];
  recentActions: RecentActionRecord[];
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

interface SessionRoomChoice {
  roomPath: string;
  displayName: string;
}

interface CommandManagerCompat {
  findCommand?: (id: string) => unknown;
  executeCommandById?: (id: string) => boolean;
  commands?: Record<string, unknown>;
}

interface PluginManagerCompat {
  enabledPlugins?: ReadonlySet<string>;
  plugins?: Record<string, unknown>;
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
  activeRoute: "home",
  startupSurface: "control-plane",
  favoriteActionIds: [],
  recentActions: [],
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

function setFieldValidation(
  input: HTMLInputElement,
  error: HTMLElement,
  valid: boolean,
  message: string
): void {
  input.setAttr("aria-invalid", String(!valid));
  input.toggleClass("is-invalid", !valid);
  error.hidden = valid;
  error.setText(valid ? "" : message);
}

function isRunRecord(value: unknown): value is RunRecord {
  const record = asRecord(value);
  return (
    typeof record.actionId === "string" &&
    ACTION_BY_ID.has(record.actionId) &&
    typeof record.title === "string" &&
    typeof record.ok === "boolean" &&
    isCanonicalIsoTimestamp(record.timestamp) &&
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
    isCanonicalIsoTimestamp(record.timestamp) &&
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

function isEditableEventTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function successfulActionReceipt(action: ControlAction): { readonly label: string; readonly announcement: string } {
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

class ConfirmActionModal extends Modal {
  private confirmed = false;

  constructor(
    app: App,
    private readonly message: string,
    private readonly onConfirm: () => void,
    private readonly onDismiss: (confirmed: boolean) => void
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
      this.confirmed = true;
      this.close();
      this.onConfirm();
    });
    window.setTimeout(() => confirm.focus(), 0);
  }

  onClose(): void {
    this.onDismiss(this.confirmed);
    this.contentEl.empty();
  }
}

class SessionRoomSuggestModal extends FuzzySuggestModal<SessionRoomChoice> {
  constructor(
    app: App,
    private readonly choices: readonly SessionRoomChoice[],
    private readonly onChoose: (choice: SessionRoomChoice) => void,
    private readonly onDismiss: () => void
  ) {
    super(app);
    this.setPlaceholder("Select an existing session folder…");
    this.setInstructions([
      { command: "↑↓", purpose: "navigate" },
      { command: "↵", purpose: "select existing folder" },
      { command: "esc", purpose: "close" }
    ]);
  }

  onOpen(): void {
    super.onOpen();
    this.modalEl.addClass("vc-control-session-room-modal");
    this.inputEl.setAttr("aria-label", "Select an existing direct-child session folder");
  }

  getItems(): SessionRoomChoice[] {
    return [...this.choices];
  }

  getItemText(choice: SessionRoomChoice): string {
    return `${choice.displayName} ${choice.roomPath}`;
  }

  renderSuggestion({ item: choice }: FuzzyMatch<SessionRoomChoice>, element: HTMLElement): void {
    element.createEl("strong", { text: choice.displayName });
    element.createEl("small", { text: choice.roomPath });
  }

  onChooseItem(choice: SessionRoomChoice): void {
    this.onChoose(choice);
  }

  onClose(): void {
    super.onClose();
    this.onDismiss();
  }
}

class ControlPlaneView extends ItemView {
  private readonly instanceId = crypto.randomUUID().slice(0, 8);
  private readonly routeHistory: RouteHistory;
  private liveRegion: HTMLElement | null = null;
  private contextTrigger: HTMLButtonElement | null = null;
  private moreTrigger: HTMLButtonElement | null = null;
  private contextOpen = false;
  private moreOpen = false;
  private entityQuery = "";
  private entityType: EntityType | "" = "";
  private entityStatus = "";
  private renderGeneration = 0;
  private entitySearchTimer: number | null = null;
  private contextResizeObserver: ResizeObserver | null = null;
  private readonly handleKeydown = (event: KeyboardEvent): void => {
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

  constructor(leaf: WorkspaceLeaf, private readonly plugin: VeiledChicagoControlPlane) {
    super(leaf);
    this.routeHistory = new RouteHistory(plugin.settings.activeRoute);
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
    this.contentEl.addEventListener("keydown", this.handleKeydown);
    await this.render();
    this.contextResizeObserver = new ResizeObserver(() => this.reconcileContextPresentation());
    this.contextResizeObserver.observe(this.contentEl);
  }

  async onClose(): Promise<void> {
    this.contentEl.removeEventListener("keydown", this.handleKeydown);
    if (this.entitySearchTimer !== null) window.clearTimeout(this.entitySearchTimer);
    this.entitySearchTimer = null;
    this.contextResizeObserver?.disconnect();
    this.contextResizeObserver = null;
  }

  async render(announcement?: string): Promise<void> {
    if (this.entitySearchTimer !== null) window.clearTimeout(this.entitySearchTimer);
    this.entitySearchTimer = null;
    const generation = ++this.renderGeneration;
    const { contentEl } = this;
    const activeElement = document.activeElement;
    const focusKey =
      activeElement instanceof HTMLElement && contentEl.contains(activeElement)
        ? activeElement.dataset.vcFocus ?? null
        : null;
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
    setIcon(commandIcon, "search");
    commandTrigger.createSpan({ text: "Search actions" });
    commandTrigger.createEl("kbd", { text: Platform.isMacOS ? "⌘ K" : "Ctrl K" });
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
    setIcon(contextIcon, "panel-right-open");
    this.contextTrigger.addEventListener("click", () => this.openContext());

    this.renderRoute(main, route.id, live);
    this.renderContext(grid, live);
    this.renderBottomNavigation(shell, route.id);
    shell.appendChild(persistentLiveRegion);

    contentEl.scrollTop = scrollTop;
    if (focusKey) this.restoreFocus(focusKey);
    if (announcement) this.announce(announcement);
  }

  async navigateTo(section?: string): Promise<void> {
    if (section === "command-search") {
      const active = document.activeElement;
      const opener =
        active instanceof HTMLElement && this.contentEl.contains(active)
          ? active
          : this.contentEl.querySelector<HTMLElement>('[data-vc-focus="command-search"]') ??
            this.contentEl.querySelector<HTMLElement>(`#vc-control-route-heading-${this.instanceId}`);
      this.openCommandSearch(opener);
      return;
    }
    const target = section === "entity-navigator" ? { route: "world" as const, focusTarget: "entity-navigator" as const } : routeForLegacySection(section ?? this.plugin.settings.activeRoute);
    if (!target) return;
    await this.navigate(target.route, true, target.focusTarget);
  }

  announce(message: string): void {
    const region = this.liveRegion;
    if (!region) return;
    region.setText("");
    window.setTimeout(() => {
      if (region.isConnected) region.setText(message);
    }, 0);
  }

  private renderRouteNavigation(container: HTMLElement, activeRoute: PrimaryRoute): void {
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
      setIcon(icon, route.icon);
      button.createSpan({ cls: "vc-control-route-nav-label", text: route.label });
      button.createSpan({
        cls: "vc-control-route-count",
        text: String(CONTROL_ACTIONS.filter((action) => action.route === route.id).length)
      });
      button.addEventListener("click", () => void this.navigate(route.id));
    }
  }

  private renderBottomNavigation(container: HTMLElement, activeRoute: PrimaryRoute): void {
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
      setIcon(icon, route.icon);
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
    setIcon(moreIcon, "ellipsis");
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

  private setMoreOpen(open: boolean, restoreFocus: boolean): void {
    this.moreOpen = open;
    const panel = this.contentEl.querySelector<HTMLElement>(`#vc-control-more-${this.instanceId}`);
    panel?.toggleClass("is-open", open);
    panel?.setAttr("data-open", String(open));
    panel?.setAttr("aria-hidden", String(!open));
    this.moreTrigger?.setAttr("aria-expanded", String(open));
    if (restoreFocus) window.setTimeout(() => this.moreTrigger?.focus({ preventScroll: true }), 0);
  }

  private renderRoute(container: HTMLElement, route: PrimaryRoute, live: LiveState): void {
    switch (route) {
      case "home":
        this.renderLiveSummary(container, live);
        this.renderLiveEdgeRouter(container, live);
        this.renderFavorites(container);
        this.renderRecentActions(container, 5);
        this.renderRouteActions(container, route, new Set([
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

  private renderContext(container: HTMLElement, live: LiveState): void {
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
        ...(this.contextOpen ? { "aria-modal": "true" } : {})
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
    setIcon(closeIcon, "x");
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

  private async navigate(route: PrimaryRoute, pushHistory = true, focusTarget?: string): Promise<void> {
    if (pushHistory) this.routeHistory.push(route);
    this.contextOpen = false;
    this.moreOpen = false;
    await this.plugin.setActiveRoute(route);
    const target = focusTarget
      ? this.contentEl.querySelector<HTMLElement>(`[data-vc-section="${focusTarget}"]`)
      : null;
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

  private openCommandSearch(opener: HTMLElement | null): void {
    this.announce("Command search opened.");
    this.plugin.openCommandSearch(opener, (message) => this.announce(message));
  }

  private openContext(): void {
    this.contextOpen = true;
    const aside = this.contentEl.querySelector<HTMLElement>(`#vc-control-context-${this.instanceId}`);
    const scrim = this.contentEl.querySelector<HTMLElement>(".vc-control-context-scrim");
    aside?.addClass("is-open");
    aside?.setAttr("data-open", "true");
    aside?.setAttr("role", "dialog");
    aside?.setAttr("aria-modal", "true");
    scrim?.addClass("is-open");
    scrim?.setAttr("data-open", "true");
    this.contextTrigger?.setAttr("aria-expanded", "true");
    window.setTimeout(() => aside?.querySelector<HTMLButtonElement>(".vc-control-context-close")?.focus(), 0);
  }

  private closeContext(restoreFocus: boolean): void {
    this.contextOpen = false;
    const aside = this.contentEl.querySelector<HTMLElement>(`#vc-control-context-${this.instanceId}`);
    const scrim = this.contentEl.querySelector<HTMLElement>(".vc-control-context-scrim");
    aside?.removeClass("is-open");
    aside?.setAttr("data-open", "false");
    aside?.setAttr("role", "complementary");
    aside?.removeAttribute("aria-modal");
    scrim?.removeClass("is-open");
    scrim?.setAttr("data-open", "false");
    this.contextTrigger?.setAttr("aria-expanded", "false");
    if (restoreFocus) window.setTimeout(() => this.contextTrigger?.focus({ preventScroll: true }), 0);
  }

  private trapContextFocus(event: KeyboardEvent): boolean {
    const aside = this.contentEl.querySelector<HTMLElement>(`#vc-control-context-${this.instanceId}`);
    if (!aside) return false;
    const focusable = [...aside.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter(
      (element) =>
        !element.hasAttribute("disabled") &&
        element.getAttribute("aria-hidden") !== "true" &&
        element.getClientRects().length > 0
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

  private reconcileContextPresentation(): void {
    const morePanel = this.contentEl.querySelector<HTMLElement>(`#vc-control-more-${this.instanceId}`);
    if (this.moreOpen && morePanel && window.getComputedStyle(morePanel).display === "none") {
      this.setMoreOpen(false, false);
    }
    if (!this.contextOpen) return;
    const aside = this.contentEl.querySelector<HTMLElement>(`#vc-control-context-${this.instanceId}`);
    const close = aside?.querySelector<HTMLElement>(".vc-control-context-close");
    if (!aside || !close || window.getComputedStyle(close).display !== "none") return;
    const restoreHeading = aside.contains(document.activeElement);
    this.closeContext(false);
    if (restoreHeading) window.setTimeout(() => this.focusRouteHeading(), 0);
    this.announce("Observed context changed from a modal drawer to the persistent context pane.");
  }

  private focusRouteHeading(): void {
    this.contentEl.querySelector<HTMLElement>(`#vc-control-route-heading-${this.instanceId}`)?.focus({ preventScroll: true });
  }

  private restoreFocus(key: string): void {
    const target = [...this.contentEl.querySelectorAll<HTMLElement>("[data-vc-focus]")].find(
      (element) => element.dataset.vcFocus === key
    );
    if (target) window.setTimeout(() => target.focus({ preventScroll: true }), 0);
  }

  private addMetric(container: HTMLElement, label: string, value: string): void {
    const item = container.createDiv({ cls: "vc-control-metric" });
    item.createEl("dt", { text: label });
    item.createEl("dd", { text: value });
  }

  private renderLiveSummary(container: HTMLElement, live: LiveState): void {
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
      ["Deployment mode", live.deploymentMode],
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
      if (action) this.renderActionShell(actions, action, true, "router");
    }
  }

  private renderRouteActions(container: HTMLElement, route: PrimaryRoute, excluded = new Set<string>()): void {
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
        const target = this.contentEl.querySelector<HTMLElement>(`#${groupId}`);
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

  private renderActionShell(container: HTMLElement, action: ControlAction, compact: boolean, scope: string): void {
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
    setIcon(icon, "star");
    favorite.addEventListener("click", () => void this.plugin.toggleFavoriteAction(action.id));
  }

  private renderFavorites(container: HTMLElement): void {
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

  private renderRecentActions(container: HTMLElement, limit: number): void {
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

  private renderEntityNavigator(container: HTMLElement): void {
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
    const cancelPendingSearch = (): void => {
      if (this.entitySearchTimer !== null) window.clearTimeout(this.entitySearchTimer);
      this.entitySearchTimer = null;
      results.removeClass("is-loading");
    };
    const update = (announce = true): void => {
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
        filtered.truncated
          ? `Showing ${filtered.shown} of ${filtered.total} matching entities (render cap ${filtered.limit}).`
          : `Showing ${filtered.shown} of ${filtered.total} matching entities.`
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
      this.entityType = ENTITY_TYPES.includes(typeSelect.value as EntityType) ? (typeSelect.value as EntityType) : "";
      update();
    });
    statusSelect.addEventListener("change", () => {
      cancelPendingSearch();
      this.entityStatus = statusSelect.value;
      update();
    });
    update(false);
  }

  private renderEntityResult(container: HTMLElement, entry: EntityIndexEntry): void {
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

  private renderCapabilityInventory(container: HTMLElement): void {
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
        text:
          status.required === 0
            ? "No runtime requirements"
            : `${status.available}/${status.required} fixed requirements${status.missing.length ? `; missing ${status.missing.join(", ")}` : ""}`
      });
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
      .setName("Startup surface")
      .setDesc("Open or reuse one Control Plane tab when Obsidian's layout is ready, or leave the saved layout unchanged.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("control-plane", "Control Plane")
          .addOption("none", "Saved layout only")
          .setValue(this.plugin.settings.startupSurface)
          .onChange(async (value) => {
            this.plugin.settings.startupSurface = normalizeStartupSurface(value);
            await this.plugin.saveSettings();
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

    const activeSession = this.plugin.activeSession();
    const hasStoredSession = Boolean(
      this.plugin.settings.activeSessionRoom || this.plugin.settings.activeSessionName
    );
    new Setting(containerEl)
      .setName("Explicit active session room")
      .setDesc(
        activeSession
          ? `${activeSession.displayName}: ${activeSession.roomPath}`
          : hasStoredSession
            ? "Stored selection is unavailable or no longer an existing direct-child session folder. Select another room or clear it."
            : "Not selected. The plugin will not infer a room from filenames or next_session."
      )
      .addButton((button) =>
        button.setButtonText("Select").onClick(() => void this.plugin.executeAction("set-active-session-room", "command"))
      )
      .addButton((button) =>
        button
          .setButtonText("Clear")
          .setDisabled(!hasStoredSession)
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

    const mapSetting = new Setting(containerEl)
      .setName("Local map URL")
      .setDesc("Loopback HTTP URL opened only in Obsidian's core Web Viewer.");
    const mapErrorId = `vc-control-map-url-error-${crypto.randomUUID()}`;
    const mapError = mapSetting.descEl.createDiv({
      cls: "vc-control-setting-error",
      attr: { id: mapErrorId, role: "status", "aria-live": "polite" }
    });
    mapSetting.addText((text) => {
      text.inputEl.setAttr("aria-describedby", mapErrorId);
      const validate = (value: string): boolean => {
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

    const timeoutSetting = new Setting(containerEl)
      .setName("Automation timeout")
      .setDesc("Seconds before a foreground audit is terminated. Range: 5–300.");
    const timeoutErrorId = `vc-control-timeout-error-${crypto.randomUUID()}`;
    const timeoutError = timeoutSetting.descEl.createDiv({
      cls: "vc-control-setting-error",
      attr: { id: timeoutErrorId, role: "status", "aria-live": "polite" }
    });
    timeoutSetting.addText((text) => {
      text.inputEl.setAttr("aria-describedby", timeoutErrorId);
      const validate = (value: string): number | null => {
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
  private readonly pendingCommandSearchModals = new Set<ControlActionSearchModal>();
  private readonly pendingSessionRoomModals = new Set<SessionRoomSuggestModal>();
  private commandSearchRefreshPending = false;
  private activationPromise: Promise<WorkspaceLeaf> | null = null;
  private webViewerController: CoreWebViewerController<WorkspaceLeaf> | null = null;
  private entityIndex: readonly EntityIndexEntry[] | null = null;
  private transactionInProgress = false;
  private refreshTimer: number | null = null;
  private statusButton: HTMLButtonElement | null = null;
  private unloading = false;

  async onload(): Promise<void> {
    this.unloading = false;
    this.webViewerController = new CoreWebViewerController<WorkspaceLeaf>({
      forEachLeaf: (visit) => this.app.workspace.iterateAllLeaves(visit),
      getViewState: (leaf) => leaf.getViewState(),
      createTab: () => this.app.workspace.getLeaf("tab"),
      setViewState: (leaf, viewState) => leaf.setViewState(viewState),
      revealLeaf: (leaf) => this.app.workspace.revealLeaf(leaf),
      detachLeaf: (leaf) => leaf.detach(),
      isCancelled: () => this.unloading
    });
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
          if (file.parent?.path === VAULT_PATHS.sessionsRoot) this.scheduleRefresh();
        })
      );
      this.registerEvent(
        this.app.vault.on("delete", (file) => {
          if (this.isEntityScopePath(file.path)) this.invalidateEntityIndex();
          if (file.path === this.settings.activeSessionRoom || file.parent?.path === VAULT_PATHS.sessionsRoot) {
            this.scheduleRefresh();
          }
        })
      );
      this.registerEvent(
        this.app.vault.on("rename", (file, oldPath) => {
          if (this.isEntityScopePath(file.path) || this.isEntityScopePath(oldPath)) this.invalidateEntityIndex();
          if (
            oldPath === this.settings.activeSessionRoom ||
            file.path === this.settings.activeSessionRoom ||
            file.parent?.path === VAULT_PATHS.sessionsRoot ||
            oldPath.startsWith(`${VAULT_PATHS.sessionsRoot}/`)
          ) {
            this.scheduleRefresh();
          }
        })
      );
      this.scheduleRefresh(0);
      if (this.settings.startupSurface === "control-plane") void this.activateView();
    });
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
    for (const modal of this.pendingCommandSearchModals) modal.close();
    this.pendingCommandSearchModals.clear();
    for (const modal of this.pendingSessionRoomModals) modal.close();
    this.pendingSessionRoomModals.clear();
    this.commandSearchRefreshPending = false;
    for (const child of this.activeChildren) {
      if (!child.killed) child.kill("SIGTERM");
    }
    this.activeChildren.clear();
    this.runningActions.clear();
    this.webViewerController?.clear();
    this.webViewerController = null;
    this.clearManagedProfiles();
    this.restoreWorkflowDom();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    const saved = asRecord(await this.loadData());
    const actionIds = ACTION_BY_ID.keys();
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
      activeRoute: isPrimaryRoute(saved.activeRoute) ? saved.activeRoute : DEFAULT_SETTINGS.activeRoute,
      startupSurface: normalizeStartupSurface(saved.startupSurface),
      favoriteActionIds: normalizeFavoriteActionIds(saved.favoriteActionIds, actionIds),
      recentActions: normalizeRecentActions(saved.recentActions, ACTION_BY_ID.keys()),
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
    let leaf: WorkspaceLeaf;
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

  private async activateControlPlaneLeaf(): Promise<WorkspaceLeaf> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    await this.app.workspace.revealLeaf(leaf);
    return leaf;
  }

  async setActiveRoute(route: PrimaryRoute): Promise<void> {
    if (!isPrimaryRoute(route)) return;
    this.settings.activeRoute = route;
    await this.saveSettings();
    await this.refreshViews();
  }

  async setActiveContextProfile(profile: ContextProfileId): Promise<void> {
    this.settings.activeContextProfile = profile;
    await this.saveSettings();
    await this.refreshViews(`Context profile changed to ${profile}.`);
  }

  async refreshViews(announcement?: string): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof ControlPlaneView) await view.render(announcement);
    }
    await this.updateStatusButton();
  }

  private scheduleRefresh(delay = 80): void {
    if (this.unloading) return;
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      if (this.unloading) return;
      this.applyProfilesToAllLeaves();
      void this.refreshViews();
    }, delay);
  }

  openCommandSearch(opener: HTMLElement | null, announce: (message: string) => void): void {
    let modal: ControlActionSearchModal;
    modal = new ControlActionSearchModal(this.app, {
      actions: CONTROL_ACTIONS,
      favoriteActionIds: this.settings.favoriteActionIds,
      recentActions: this.settings.recentActions,
      opener,
      getAvailability: (action) => this.getAvailability(action),
      onChoose: (action) => void this.executeAction(action.id, "view"),
      onUnavailable: (action, reason) => {
        new Notice(reason, 7000);
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

  async toggleFavoriteAction(actionId: string): Promise<void> {
    if (!ACTION_BY_ID.has(actionId)) return;
    const selected = this.settings.favoriteActionIds.includes(actionId);
    if (!selected && this.settings.favoriteActionIds.length >= 12) {
      new Notice("Favorites are limited to 12 compiled actions.", 6000);
      this.announceToViews("Favorites remain unchanged; the 12-action limit is reached.");
      return;
    }
    const next = selected
      ? this.settings.favoriteActionIds.filter((candidate) => candidate !== actionId)
      : [...this.settings.favoriteActionIds, actionId];
    this.settings.favoriteActionIds = normalizeFavoriteActionIds(next, ACTION_BY_ID.keys());
    await this.saveSettings();
    const title = ACTION_BY_ID.get(actionId)?.title ?? actionId;
    await this.refreshViews(`${title} ${selected ? "removed from" : "added to"} favorites.`);
  }

  getEntityIndex(): readonly EntityIndexEntry[] {
    if (this.entityIndex) return this.entityIndex;
    this.entityIndex = buildEntityIndex(
      this.app.vault
        .getMarkdownFiles()
        .filter((file) => deriveEntityType(file.path) !== null)
        .map((file) => ({
          path: file.path,
          basename: file.basename,
          frontmatter: asRecord(this.app.metadataCache.getFileCache(file)?.frontmatter)
        }))
    );
    return this.entityIndex;
  }

  async openEntityPath(path: string): Promise<void> {
    if (!deriveEntityType(path)) {
      new Notice("Entity navigation blocked a path outside the compiled roots.", 7000);
      return;
    }
    try {
      await this.openFile(this.fileAt(path));
    } catch (error) {
      new Notice(error instanceof Error ? error.message : String(error), 7000);
    }
  }

  private invalidateEntityIndex(): void {
    this.entityIndex = null;
    if (this.settings.activeRoute === "world") this.scheduleRefresh();
  }

  private isEntityScopePath(path: string): boolean {
    if (deriveEntityType(path)) return true;
    return ENTITY_ROOT_REGISTRY.some(
      ({ root }) => path === root || path.startsWith(`${root}/`) || root.startsWith(`${path}/`)
    );
  }

  private announceToViews(message: string): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      if (leaf.view instanceof ControlPlaneView) leaf.view.announce(message);
    }
  }

  async readLiveState(): Promise<LiveState> {
    const stateFile = this.fileAt(CURRENT_STATE_PATH);
    const frontmatter = stateFile ? asRecord(this.app.metadataCache.getFileCache(stateFile)?.frontmatter) : {};
    const latestValue = frontmatter.last_played_record;
    const latestTarget = wikilinkTarget(latestValue);
    const latestFile = latestTarget ? this.app.metadataCache.getFirstLinkpathDest(latestTarget, CURRENT_STATE_PATH) : null;
    const nextSession = parseExplicitNextSession(frontmatter.next_session);
    const active = this.activeSession();

    return {
      latestLabel: wikilinkLabel(latestValue) || latestFile?.basename || "UNRESOLVED",
      latestFile,
      nextSession,
      deploymentMode: normalizeDeployment(frontmatter.deployment_mode),
      openLeadTasks: await this.countOpenTasks(CURRENT_LEADS_PATH),
      stateModified: stateFile?.stat.mtime ?? null,
      activeSessionRoom: active?.roomPath ?? null,
      activeSessionName: active?.displayName ?? null
    };
  }

  private async countOpenTasks(path: string): Promise<number> {
    const file = this.fileAt(path);
    if (!file) return 0;
    const content = await this.app.vault.cachedRead(file);
    return (content.match(/^\s*[-*]\s+\[ \]\s+/gm) ?? []).length;
  }

  createActionButton(
    action: ControlAction,
    source: "view" | "block",
    focusKey?: string,
    compact = false
  ): HTMLButtonElement {
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
      ...(action.keywords ?? [])
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
    setIcon(icon, running ? "loader-circle" : action.icon);
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

  private async renderAdStatblock(source: string, element: HTMLElement, sourcePath: string): Promise<void> {
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
      await MarkdownRenderer.render(this.app, safeMarkdown, body, sourcePath, this);
    } catch (error) {
      body.empty();
      const alert = body.createEl("div", { cls: "vc-control-block-error", attr: { role: "alert" } });
      alert.createEl("strong", { text: "Statblock rendering failed" });
      alert.createEl("p", { text: error instanceof Error ? error.message : String(error) });
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
        return resolveWebViewerActionUrl(action.id, action.target, this.settings.mapUrl)
          ? { available: true }
          : { available: false, reason: "The compiled Web Viewer URL is invalid or outside its allowlist." };
      case "workflow":
        if (["create-managed-note", "capture-quick-inbox", "set-active-session-room"].includes(action.id)) {
          return { available: true };
        }
        return this.activeSession()
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

  async executeAction(actionId: string, source: ActionSource): Promise<void> {
    const action = ACTION_BY_ID.get(actionId);
    if (!action) {
      new Notice(`Veiled Chicago Control Plane: unknown action '${actionId || "(empty)"}'.`);
      return;
    }
    const sourceBlock = this.sourceBlockReason(action, source);
    if (sourceBlock) {
      new Notice(sourceBlock);
      await this.tryRecordRecentAction(action.id, false);
      this.announceToViews(`${action.title} was blocked by action-source policy.`);
      return;
    }

    const availability = this.getAvailability(action);
    if (!availability.available) {
      new Notice(availability.reason ?? `${action.title} is unavailable.`);
      await this.tryRecordRecentAction(action.id, false);
      this.announceToViews(`${action.title} is unavailable. ${availability.reason ?? ""}`.trim());
      return;
    }
    if (action.confirm && (action.id === "start-audio-recorder" || this.settings.confirmScriptActions)) {
      let modal: ConfirmActionModal;
      modal = new ConfirmActionModal(
        this.app,
        action.confirm,
        () => {
          if (this.unloading) return;
          const currentSourceBlock = this.sourceBlockReason(action, source);
          if (currentSourceBlock) {
            new Notice(currentSourceBlock);
            void this.tryRecordRecentAction(action.id, false);
            return;
          }
          const currentAvailability = this.getAvailability(action);
          if (!currentAvailability.available) {
            new Notice(currentAvailability.reason ?? `${action.title} is unavailable.`);
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

  private async performAndRecordAction(action: ControlAction): Promise<void> {
    try {
      await this.performAction(action);
      const success =
        action.kind !== "script" ||
        this.settings.recentRuns.find((record) => record.actionId === action.id)?.ok === true;
      await this.tryRecordRecentAction(action.id, success);
      const outcome = success ? successfulActionReceipt(action).announcement : "attention required";
      this.announceToViews(`${action.title}: ${outcome}.`);
    } catch (error) {
      await this.tryRecordRecentAction(action.id, false);
      this.reportActionError(action.title, error);
    }
  }

  private async tryRecordRecentAction(actionId: string, success: boolean): Promise<void> {
    try {
      await this.recordRecentAction(actionId, success);
    } catch (error) {
      new Notice(
        `Activity receipt could not be saved: ${error instanceof Error ? error.message : String(error)}`,
        10000
      );
    }
  }

  private async recordRecentAction(actionId: string, success: boolean): Promise<void> {
    this.settings.recentActions = normalizeRecentActions(
      [{ actionId, success, timestamp: new Date().toISOString() }, ...this.settings.recentActions],
      ACTION_BY_ID.keys()
    );
    await this.saveSettings();
    if (this.pendingCommandSearchModals.size === 0) {
      await this.refreshViews();
    } else {
      this.commandSearchRefreshPending = true;
    }
  }

  private reportActionError(title: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    new Notice(`${title}: ${message}`, 12000);
    this.announceToViews(`${title} failed. ${message}`);
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
          throw new Error(`Could not execute the fixed command adapter for ${action.title}.`);
        }
        break;
      case "integration":
        await this.openWebViewer(action);
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
      throw new Error("The requested campaign note could not be resolved.");
    }
    let existing: WorkspaceLeaf | null = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (existing) return;
      const view = leaf.view;
      if (view instanceof FileView && view.file?.path === file.path) existing = leaf;
    });
    if (existing) {
      await this.app.workspace.revealLeaf(existing);
      return;
    }
    const leaf = this.app.workspace.getLeaf(this.settings.openNotesInNewTab ? "tab" : false);
    await leaf.openFile(file, { active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  private async openWebViewer(action: ControlAction): Promise<void> {
    const url = resolveWebViewerActionUrl(action.id, action.target, this.settings.mapUrl);
    if (!url) throw new Error(`The compiled Web Viewer URL for ${action.title} is invalid or outside its allowlist.`);
    await this.activateWebViewerLeaf(url);
  }

  private async activateWebViewerLeaf(url: string): Promise<WorkspaceLeaf> {
    if (this.unloading || !this.webViewerController) throw new Error(WEB_VIEWER_CANCELLED_MESSAGE);
    return await this.webViewerController.open(url);
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

  activeSession(): { roomPath: string; displayName: string } | null {
    if (!this.settings.activeSessionRoom || !this.settings.activeSessionName) return null;
    try {
      const roomPath = normalizeSessionRoomPath(this.settings.activeSessionRoom);
      const displayName = normalizeSessionDisplayName(roomPath, this.settings.activeSessionName);
      const folder = this.app.vault.getAbstractFileByPath(roomPath);
      if (!(folder instanceof TFolder) || folder.name !== displayName) return null;
      return { roomPath, displayName };
    } catch {
      return null;
    }
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
    const root = this.app.vault.getAbstractFileByPath(VAULT_PATHS.sessionsRoot);
    if (!(root instanceof TFolder)) {
      new Notice(`Sessions root is unavailable: ${VAULT_PATHS.sessionsRoot}`, 7000);
      return;
    }
    const choices = root.children
      .flatMap((child): SessionRoomChoice[] => {
        if (!(child instanceof TFolder)) return [];
        try {
          const roomPath = normalizeSessionRoomPath(child.path);
          return [{ roomPath, displayName: normalizeSessionDisplayName(roomPath, child.name) }];
        } catch {
          return [];
        }
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName, "en-US", { numeric: true }));
    if (choices.length === 0) {
      new Notice(`No selectable direct-child folders exist below ${VAULT_PATHS.sessionsRoot}.`, 7000);
      return;
    }

    let modal: SessionRoomSuggestModal;
    modal = new SessionRoomSuggestModal(
      this.app,
      choices,
      (choice) => {
        void this.selectExistingSessionRoom(choice).catch((error) => this.reportActionError("Select active session room", error));
      },
      () => this.pendingSessionRoomModals.delete(modal)
    );
    this.pendingSessionRoomModals.add(modal);
    modal.open();
  }

  private async selectExistingSessionRoom(choice: SessionRoomChoice): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(choice.roomPath);
    if (!(folder instanceof TFolder)) throw new Error("The selected session folder no longer exists.");
    const roomPath = normalizeSessionRoomPath(folder.path);
    const displayName = normalizeSessionDisplayName(roomPath, folder.name);
    if (roomPath !== choice.roomPath || displayName !== choice.displayName) {
      throw new Error("The selected session folder changed before selection was committed.");
    }
    this.settings.activeSessionRoom = roomPath;
    this.settings.activeSessionName = displayName;
    await this.saveSettings();
    await this.refreshViews();
    new Notice(`Active session room selected: ${displayName}. No canon or next-session field changed.`, 7000);
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
    const currentState = this.fileAt(CURRENT_STATE_PATH);
    const [decisionIntakeContents, currentStateContents] = await Promise.all([
      intake ? this.app.vault.read(intake) : Promise.resolve(null),
      currentState ? this.app.vault.read(currentState) : Promise.resolve(null)
    ]);
    if (currentStateContents === null) throw new Error(`RUN generation requires ${CURRENT_STATE_PATH}.`);
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
        currentStateEvidence: { sourcePath: CURRENT_STATE_PATH, contents: currentStateContents },
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

  private async assertEvidenceSourcesUnchanged(proposal: ReviewedMutationProposal): Promise<void> {
    for (const baseline of proposal.evidenceBaselines ?? []) {
      const source = this.app.vault.getAbstractFileByPath(baseline.path);
      if (!(source instanceof TFile)) throw new Error(`Reviewed evidence source is no longer a file: ${baseline.path}`);
      const contents = await this.app.vault.read(source);
      if (!targetMatchesBaseline(baseline, "file", contents, source.stat.mtime, source.stat.size)) {
        throw new Error(`Evidence source changed after preview: ${baseline.path}`);
      }
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
          env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
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

  private sourceBlockReason(action: ControlAction, source: ActionSource): string | null {
    if (action.allowedSources.includes(source)) return null;
    return `Veiled Chicago Control Plane blocked ${action.title} from the ${source} action source.`;
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

  commandAvailable(id: string): boolean {
    const manager = this.commandManager();
    if (!manager) return false;
    if (typeof manager.findCommand === "function") return Boolean(manager.findCommand(id));
    return Boolean(manager.commands && Object.prototype.hasOwnProperty.call(manager.commands, id));
  }

  pluginEnabled(id: string): boolean {
    const manager = (this.app as App & { plugins?: PluginManagerCompat }).plugins;
    if (!manager || typeof manager !== "object") return false;
    return Boolean(manager.enabledPlugins?.has(id) || manager.plugins?.[id]);
  }

  private executeCommand(id: string): boolean {
    const manager = this.commandManager();
    return typeof manager?.executeCommandById === "function" && manager.executeCommandById(id);
  }
}

export { ACTION_BY_ID, CONTROL_ACTIONS, MANAGED_PROFILE_CLASSES, parseControlBlock, profilesForPath };
