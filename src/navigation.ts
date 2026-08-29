/** Stable application-shell routes in desktop rail and mobile navigation order. */
export const PRIMARY_ROUTES = ["home", "session", "create", "world", "tools", "system"] as const;

/** A compiled route accepted by control-plane navigation state. */
export type PrimaryRoute = (typeof PRIMARY_ROUTES)[number];

/** Fixed action labels used by navigation, command search, and activity history. */
export const ACTION_VERBS = ["OPEN", "RUN", "CREATE", "CAPTURE", "REVIEW", "SELECT", "START", "STOP"] as const;

/** A visible, compiled action verb. */
export type ActionVerb = (typeof ACTION_VERBS)[number];

/** Presentation metadata for one application-shell route. */
export interface RouteDefinition {
  readonly id: PrimaryRoute;
  readonly label: string;
  readonly mobileLabel: string;
  readonly description: string;
  readonly icon: string;
  readonly mobilePrimary: boolean;
}

/**
 * Compiled route registry. Tools and System intentionally live below the mobile
 * More affordance while remaining first-class routes in navigation state.
 */
export const ROUTE_DEFINITIONS: readonly RouteDefinition[] = [
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
] as const;

/** Runtime-safe route guard for untrusted settings data. */
export function isPrimaryRoute(value: unknown): value is PrimaryRoute {
  return typeof value === "string" && (PRIMARY_ROUTES as readonly string[]).includes(value);
}

/** Runtime-safe action-verb guard for compiled registries and migrated data. */
export function isActionVerb(value: unknown): value is ActionVerb {
  return typeof value === "string" && (ACTION_VERBS as readonly string[]).includes(value);
}

/** Minimal runtime shape required to validate action navigation semantics. */
export interface ActionRouteVerbCandidate {
  readonly id: unknown;
  readonly route: unknown;
  readonly verb: unknown;
}

/** Validated route and verb metadata for one compiled action. */
export interface ValidatedActionSemantics {
  readonly id: string;
  readonly route: PrimaryRoute;
  readonly verb: ActionVerb;
}

/**
 * Validate the singular route and visible verb on one action.
 *
 * @throws If the identifier is empty or the route or verb is not compiled.
 */
export function validateActionRouteAndVerb(action: ActionRouteVerbCandidate): ValidatedActionSemantics {
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

/**
 * Validate a complete action registry and reject duplicate action identifiers.
 * The returned array contains only the navigation metadata required by the shell.
 */
export function validateActionNavigation(
  actions: readonly ActionRouteVerbCandidate[]
): readonly ValidatedActionSemantics[] {
  const seen = new Set<string>();
  return actions.map((action) => {
    const validated = validateActionRouteAndVerb(action);
    if (seen.has(validated.id)) throw new Error(`Duplicate navigation action ID: ${validated.id}`);
    seen.add(validated.id);
    return validated;
  });
}

/** A route plus an optional legacy focus anchor within that route. */
export interface LegacyRouteTarget {
  readonly route: PrimaryRoute;
  readonly focusTarget?: "live-edge" | "ai-policy" | "operations-health";
}

/**
 * Fixed migration map for 1.1 section targets and group labels. Keys are the
 * normalized legacy values; no vault paths or arbitrary destinations are stored.
 */
export const LEGACY_SECTION_ROUTES: Readonly<Record<string, LegacyRouteTarget>> = {
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

function normalizeLegacySection(section: string): string {
  return section.trim().toLowerCase().replace(/[\s_]+/g, "-");
}

/** Resolve a route or known 1.1 section/group without accepting free-form targets. */
export function routeForLegacySection(section: unknown): LegacyRouteTarget | null {
  if (typeof section !== "string" || section.trim().length === 0) return null;
  const normalized = normalizeLegacySection(section);
  if (isPrimaryRoute(normalized)) return { route: normalized };
  return LEGACY_SECTION_ROUTES[normalized] ?? null;
}

const MAX_FAVORITE_ACTIONS = 12;
const MAX_RECENT_ACTIONS = 20;

function compiledActionIds(values: Iterable<string>): ReadonlySet<string> {
  const result = new Set<string>();
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) result.add(value);
  }
  return result;
}

/**
 * Normalize untrusted favorite settings against compiled action IDs.
 * Order is retained, duplicates are removed, and output is capped at twelve.
 */
export function normalizeFavoriteActionIds(value: unknown, validActionIds: Iterable<string>): string[] {
  if (!Array.isArray(value)) return [];
  const valid = compiledActionIds(validActionIds);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== "string" || !valid.has(candidate) || seen.has(candidate)) continue;
    seen.add(candidate);
    result.push(candidate);
    if (result.length === MAX_FAVORITE_ACTIONS) break;
  }
  return result;
}

/** Minimal, sanitized action execution history persisted by the application shell. */
export interface RecentActionRecord {
  readonly actionId: string;
  readonly success: boolean;
  readonly timestamp: string;
}

interface RankedRecentAction extends RecentActionRecord {
  readonly epoch: number;
  readonly sourceIndex: number;
}

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** Accept only the exact UTC timestamp shape emitted by `Date.toISOString()`. */
export function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_TIMESTAMP.test(value)) return false;
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) && new Date(epoch).toISOString() === value;
}

function parseIsoTimestamp(value: unknown): { readonly value: string; readonly epoch: number } | null {
  if (!isCanonicalIsoTimestamp(value)) return null;
  const epoch = Date.parse(value);
  return { value, epoch };
}

/**
 * Normalize recent-action settings against compiled IDs. Malformed records are
 * dropped, unknown properties are discarded, records are newest-first, and the
 * sanitized output is capped at twenty entries.
 */
export function normalizeRecentActions(value: unknown, validActionIds: Iterable<string>): RecentActionRecord[] {
  if (!Array.isArray(value)) return [];
  const valid = compiledActionIds(validActionIds);
  const records: RankedRecentAction[] = [];

  for (const [sourceIndex, candidate] of value.entries()) {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) continue;
    const record = candidate as Record<string, unknown>;
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

/** Read-only diagnostic snapshot of in-memory route traversal. */
export interface RouteHistorySnapshot {
  readonly entries: readonly PrimaryRoute[];
  readonly cursor: number;
  readonly current: PrimaryRoute;
}

/**
 * Bounded, in-memory route history for Alt+Left and Alt+Right traversal.
 * It stores only compiled route IDs and never persists navigation state.
 */
export class RouteHistory {
  private entries: PrimaryRoute[];
  private cursor = 0;

  constructor(initialRoute: PrimaryRoute = "home", private readonly capacity = 50) {
    if (!isPrimaryRoute(initialRoute)) throw new Error("Route history requires a compiled initial route.");
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 100) {
      throw new Error("Route history capacity must be an integer from 2 through 100.");
    }
    this.entries = [initialRoute];
  }

  /** The route currently selected by the history cursor. */
  get current(): PrimaryRoute {
    return this.entries[this.cursor] ?? "home";
  }

  /** Whether a previous route is available. */
  get canGoBack(): boolean {
    return this.cursor > 0;
  }

  /** Whether a later route remains after a backward traversal. */
  get canGoForward(): boolean {
    return this.cursor < this.entries.length - 1;
  }

  /** Add a route, discarding forward history and consecutive duplicates. */
  push(route: PrimaryRoute): PrimaryRoute {
    if (!isPrimaryRoute(route)) throw new Error("Cannot add an uncompiled route to history.");
    if (route === this.current) return this.current;
    this.entries = this.entries.slice(0, this.cursor + 1);
    this.entries.push(route);
    if (this.entries.length > this.capacity) this.entries.splice(0, this.entries.length - this.capacity);
    this.cursor = this.entries.length - 1;
    return this.current;
  }

  /** Traverse one route backward, or return null when already at the beginning. */
  back(): PrimaryRoute | null {
    if (!this.canGoBack) return null;
    this.cursor -= 1;
    return this.current;
  }

  /** Traverse one route forward, or return null when already at the end. */
  forward(): PrimaryRoute | null {
    if (!this.canGoForward) return null;
    this.cursor += 1;
    return this.current;
  }

  /** Return a defensive snapshot suitable for tests and non-persistent diagnostics. */
  snapshot(): RouteHistorySnapshot {
    return { entries: [...this.entries], cursor: this.cursor, current: this.current };
  }
}

/** Structural action shape consumed by pure command-search helpers. */
export interface NavigationAction {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly route: PrimaryRoute;
  readonly verb: ActionVerb;
  readonly group?: string;
  readonly keywords?: readonly string[];
}

/** Favorite and recent state that may affect command-search ranking. */
export interface ActionSearchState {
  readonly favoriteActionIds?: readonly string[];
  readonly recentActions?: readonly RecentActionRecord[];
}

/** One deterministic command-search result and its ranking metadata. */
export interface RankedAction<TAction extends NavigationAction = NavigationAction> {
  readonly action: TAction;
  readonly score: number;
  readonly favorite: boolean;
  readonly recent: boolean;
}

interface SearchStateIndex {
  readonly favoriteIndex: ReadonlyMap<string, number>;
  readonly recentIndex: ReadonlyMap<string, number>;
}

function searchStateIndex(state: ActionSearchState): SearchStateIndex {
  const favoriteIndex = new Map<string, number>();
  for (const [index, id] of (state.favoriteActionIds ?? []).entries()) {
    if (!favoriteIndex.has(id)) favoriteIndex.set(id, index);
  }
  const recentIndex = new Map<string, number>();
  for (const [index, record] of (state.recentActions ?? []).entries()) {
    if (!recentIndex.has(record.actionId)) recentIndex.set(record.actionId, index);
  }
  return { favoriteIndex, recentIndex };
}

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Build normalized searchable text from explicitly approved action metadata.
 * Optional state labels allow literal `favorite` and `recent` queries.
 */
export function buildActionSearchText(
  action: NavigationAction,
  state: { readonly favorite?: boolean; readonly recent?: boolean } = {}
): string {
  const values = [
    action.id,
    action.title,
    action.description,
    action.route,
    action.group ?? "",
    action.verb,
    ...(action.keywords ?? []).filter((keyword): keyword is string => typeof keyword === "string"),
    state.favorite ? "favorite" : "",
    state.recent ? "recent" : ""
  ];
  return normalizeSearchValue(values.join(" "));
}

function fieldScore(field: string, query: string, exact: number, prefix: number, contains: number): number {
  if (field.length === 0) return 0;
  if (field === query) return exact;
  if (field.startsWith(query)) return prefix;
  if (field.includes(query)) return contains;
  return 0;
}

function tokenScore(action: NavigationAction, token: string): number {
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

function rankOne<TAction extends NavigationAction>(
  action: TAction,
  query: string,
  state: SearchStateIndex
): RankedAction<TAction> | null {
  const favoriteIndex = state.favoriteIndex.get(action.id);
  const recentIndex = state.recentIndex.get(action.id);
  const favorite = favoriteIndex !== undefined;
  const recent = recentIndex !== undefined;
  const normalizedQuery = normalizeSearchValue(query);

  if (normalizedQuery.length === 0) {
    const score = favorite
      ? 30_000 - favoriteIndex * 100 + (recent ? Math.max(1, 20 - recentIndex) : 0)
      : recent
        ? 20_000 - recentIndex * 100
        : 0;
    return { action, score, favorite, recent };
  }

  const searchText = buildActionSearchText(action, { favorite, recent });
  const tokens = [...new Set(normalizedQuery.split(" "))];
  if (tokens.some((token) => !searchText.includes(token))) return null;

  const title = normalizeSearchValue(action.title);
  const id = normalizeSearchValue(action.id);
  let score = fieldScore(title, normalizedQuery, 2_000, 1_700, 1_300);
  score = Math.max(score, fieldScore(id, normalizedQuery, 1_900, 1_600, 1_200));
  score += tokens.reduce((total, token) => total + tokenScore(action, token), 0);
  if (favorite) score += Math.max(1, 40 - favoriteIndex);
  if (recent) score += Math.max(1, 20 - recentIndex);
  return { action, score, favorite, recent };
}

/** Rank one action for a query, returning null when every query token does not match. */
export function rankActionSearchResult<TAction extends NavigationAction>(
  action: TAction,
  query: string,
  state: ActionSearchState = {}
): RankedAction<TAction> | null {
  return rankOne(action, query, searchStateIndex(state));
}

function compareStableText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Rank actions deterministically. Score, normalized title, action ID, and source
 * order form explicit tie-breakers, so results do not depend on host locale.
 */
export function rankActionsForSearch<TAction extends NavigationAction>(
  actions: readonly TAction[],
  query: string,
  state: ActionSearchState = {}
): RankedAction<TAction>[] {
  const index = searchStateIndex(state);
  const ranked = actions.flatMap((action, sourceIndex) => {
    const result = rankOne(action, query, index);
    return result ? [{ ...result, sourceIndex }] : [];
  });
  ranked.sort(
    (left, right) =>
      right.score - left.score ||
      compareStableText(normalizeSearchValue(left.action.title), normalizeSearchValue(right.action.title)) ||
      compareStableText(left.action.id, right.action.id) ||
      left.sourceIndex - right.sourceIndex
  );
  return ranked.map(({ sourceIndex: _sourceIndex, ...result }) => result);
}
