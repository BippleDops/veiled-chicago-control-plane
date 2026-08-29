import { MANAGED_NOTE_ROOTS, VAULT_PATHS } from "./paths";

/** Maximum number of entity records a navigator result may render. */
export const ENTITY_RESULT_LIMIT = 100;

/** Entity categories supported by the compiled navigator registry. */
export const ENTITY_TYPES = ["npc", "location", "faction", "item", "session"] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export interface EntityRootDefinition {
  readonly type: EntityType;
  readonly root: string;
  readonly label: string;
}

/**
 * Fixed path authority for entity discovery.
 *
 * The registry deliberately references compiled vault constants. Callers cannot
 * add a root at runtime or widen the navigator to the whole vault.
 */
export const ENTITY_ROOT_REGISTRY: readonly EntityRootDefinition[] = Object.freeze([
  Object.freeze({ type: "npc", root: MANAGED_NOTE_ROOTS.npc, label: "NPCs" }),
  Object.freeze({ type: "location", root: MANAGED_NOTE_ROOTS.location, label: "Locations" }),
  Object.freeze({ type: "faction", root: MANAGED_NOTE_ROOTS.faction, label: "Factions" }),
  Object.freeze({ type: "item", root: MANAGED_NOTE_ROOTS.item, label: "Items" }),
  Object.freeze({ type: "session", root: VAULT_PATHS.sessionsRoot, label: "Sessions" })
]);

/** Minimal TFile/cache projection required to build the index. */
export interface CachedFrontmatterFile {
  readonly path: string;
  readonly basename: string;
  readonly frontmatter?: Readonly<Record<string, unknown>> | null;
}

/** A body-free entity record suitable for display and filtering. */
export interface EntityIndexEntry {
  readonly path: string;
  readonly basename: string;
  readonly title: string;
  readonly type: EntityType;
  readonly aliases: readonly string[];
  readonly tags: readonly string[];
  readonly status: string | null;
  readonly audience: string | null;
  readonly canonStatus: string | null;
}

export interface EntityFacet<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count: number;
}

export interface EntityFacets {
  /** Fixed types are returned in registry order, including zero-count types. */
  readonly types: readonly EntityFacet<EntityType>[];
  /** Statuses are case-insensitively consolidated and sorted by label. */
  readonly statuses: readonly EntityFacet<string>[];
}

export interface EntityFilters {
  /** Whitespace-separated terms; all terms must match indexed fields. */
  readonly query?: string;
  /** Multiple selected types are combined with OR semantics. */
  readonly types?: readonly EntityType[];
  /** Multiple selected statuses are combined with OR semantics. */
  readonly statuses?: readonly string[];
  /** Requested render limit, clamped to 1..ENTITY_RESULT_LIMIT. */
  readonly limit?: number;
}

export interface EntityFilterResult {
  readonly items: readonly EntityIndexEntry[];
  /** Count after query, type, and status filters, before the render cap. */
  readonly total: number;
  readonly shown: number;
  readonly limit: number;
  readonly truncated: boolean;
  /** Counts for the query-matched population before type/status filters. */
  readonly facets: EntityFacets;
}

const STATUS_FIELDS: Readonly<Record<EntityType, readonly string[]>> = {
  npc: ["char_status", "status"],
  location: ["location_status", "status"],
  faction: ["faction_status", "status"],
  item: ["item_status", "status"],
  session: ["session_status", "status"]
};

const TYPE_LABELS: Readonly<Record<EntityType, string>> = Object.fromEntries(
  ENTITY_ROOT_REGISTRY.map(({ type, label }) => [type, label])
) as Readonly<Record<EntityType, string>>;

function normalizePath(path: string): string | null {
  const normalized = path.trim();
  if (
    normalized.length === 0 ||
    normalized.startsWith("/") ||
    normalized.includes("\\") ||
    normalized.includes("\0")
  ) {
    return null;
  }

  const segments = normalized.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) return null;
  if (!normalized.toLowerCase().endsWith(".md")) return null;
  return normalized;
}

function ownMetadata(frontmatter: Readonly<Record<string, unknown>> | null | undefined, key: string): unknown {
  if (frontmatter === null || frontmatter === undefined) return undefined;
  return Object.prototype.hasOwnProperty.call(frontmatter, key) ? frontmatter[key] : undefined;
}

function normalizeDisplayString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/gu, " ");
  return normalized.length > 0 ? normalized : null;
}

function collectStrings(value: unknown, splitTags: boolean): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item, splitTags));

  const scalar = normalizeDisplayString(value);
  if (scalar === null) return [];
  if (!splitTags) return [scalar];

  return scalar
    .split(/[\s,]+/u)
    .map((tag) => tag.replace(/^#+/u, "").trim())
    .filter((tag) => tag.length > 0);
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const key = normalizeSearchText(value);
    if (key.length === 0 || seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique;
}

function firstMetadataString(
  frontmatter: Readonly<Record<string, unknown>> | null | undefined,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = normalizeDisplayString(ownMetadata(frontmatter, key));
    if (value !== null) return value;
  }
  return null;
}

function metadataBadge(
  frontmatter: Readonly<Record<string, unknown>> | null | undefined,
  key: string
): string | null {
  const values = uniqueStrings(collectStrings(ownMetadata(frontmatter, key), false));
  return values.length > 0 ? values.join(", ") : null;
}

function inferredBasename(path: string): string {
  const filename = path.split("/").at(-1) ?? path;
  return filename.replace(/\.md$/iu, "");
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

function compareText(left: string, right: string): number {
  const normalizedLeft = normalizeSearchText(left);
  const normalizedRight = normalizeSearchText(right);
  if (normalizedLeft < normalizedRight) return -1;
  if (normalizedLeft > normalizedRight) return 1;
  return left < right ? -1 : left > right ? 1 : 0;
}

/** Return true only for an entity type compiled into this release. */
export function isEntityType(value: unknown): value is EntityType {
  return typeof value === "string" && (ENTITY_TYPES as readonly string[]).includes(value);
}

/**
 * Derive an entity type from the fixed root registry.
 *
 * Exact segment boundaries prevent similarly prefixed sibling folders from
 * entering the index. Non-Markdown and traversal-shaped paths fail closed.
 */
export function deriveEntityType(path: string): EntityType | null {
  const normalized = normalizePath(path);
  if (normalized === null) return null;

  for (const definition of ENTITY_ROOT_REGISTRY) {
    if (normalized.startsWith(`${definition.root}/`)) return definition.type;
  }
  return null;
}

/**
 * Build a deterministic entity index from TFile path/basename and cached
 * frontmatter only. Duplicate paths are ignored after the first occurrence.
 */
export function buildEntityIndex(files: readonly CachedFrontmatterFile[]): readonly EntityIndexEntry[] {
  const entries = new Map<string, EntityIndexEntry>();

  for (const file of files) {
    const path = normalizePath(file.path);
    if (path === null || entries.has(path)) continue;

    const type = deriveEntityType(path);
    if (type === null) continue;

    const frontmatter = file.frontmatter;
    const basename = normalizeDisplayString(file.basename) ?? inferredBasename(path);
    const title = firstMetadataString(frontmatter, ["title"]) ?? basename;
    const aliases = uniqueStrings([
      ...collectStrings(ownMetadata(frontmatter, "aliases"), false),
      ...collectStrings(ownMetadata(frontmatter, "alias"), false)
    ]);
    const tags = uniqueStrings([
      ...collectStrings(ownMetadata(frontmatter, "tags"), true),
      ...collectStrings(ownMetadata(frontmatter, "tag"), true)
    ]);

    entries.set(path, {
      path,
      basename,
      title,
      type,
      aliases,
      tags,
      status: firstMetadataString(frontmatter, STATUS_FIELDS[type]),
      audience: metadataBadge(frontmatter, "audience"),
      canonStatus: metadataBadge(frontmatter, "canon_status")
    });
  }

  return [...entries.values()].sort(
    (left, right) => compareText(left.title, right.title) || compareText(left.path, right.path)
  );
}

function entitySearchText(entry: EntityIndexEntry): string {
  return normalizeSearchText(
    [
      entry.title,
      entry.basename,
      ...entry.aliases,
      ...entry.tags.flatMap((tag) => [tag, `#${tag}`]),
      entry.status ?? "",
      entry.path
    ].join("\n")
  );
}

function queryTerms(query: string | undefined): readonly string[] {
  if (query === undefined) return [];
  return uniqueStrings(
    normalizeSearchText(query)
      .split(/\s+/u)
      .map((term) => term.trim())
      .filter((term) => term.length > 0)
  );
}

function matchesQuery(entry: EntityIndexEntry, terms: readonly string[]): boolean {
  if (terms.length === 0) return true;
  const searchText = entitySearchText(entry);
  return terms.every((term) => searchText.includes(term));
}

function facetsFor(entries: readonly EntityIndexEntry[]): EntityFacets {
  const typeCounts = new Map<EntityType, number>(ENTITY_TYPES.map((type) => [type, 0]));
  const statusCounts = new Map<string, { label: string; count: number }>();

  for (const entry of entries) {
    typeCounts.set(entry.type, (typeCounts.get(entry.type) ?? 0) + 1);
    if (entry.status === null) continue;
    const key = normalizeSearchText(entry.status);
    const current = statusCounts.get(key);
    statusCounts.set(key, {
      label: current === undefined || compareText(entry.status, current.label) < 0 ? entry.status : current.label,
      count: (current?.count ?? 0) + 1
    });
  }

  return {
    types: ENTITY_TYPES.map((type) => ({ value: type, label: TYPE_LABELS[type], count: typeCounts.get(type) ?? 0 })),
    statuses: [...statusCounts.entries()]
      .sort(([left], [right]) => compareText(left, right))
      .map(([value, { label, count }]) => ({ value, label, count }))
  };
}

function normalizedLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return ENTITY_RESULT_LIMIT;
  return Math.min(ENTITY_RESULT_LIMIT, Math.max(1, Math.floor(limit)));
}

/**
 * Search, facet, filter, and cap an entity index without reading vault files.
 * Invalid runtime filter values fail closed instead of widening the result set.
 */
export function filterEntityIndex(
  index: readonly EntityIndexEntry[],
  filters: EntityFilters = {}
): EntityFilterResult {
  const terms = queryTerms(filters.query);
  const queryMatches = index.filter((entry) => matchesQuery(entry, terms));
  const facets = facetsFor(queryMatches);

  const requestedTypes = filters.types ?? [];
  const validTypes = new Set(requestedTypes.filter(isEntityType));
  const invalidTypeFilter = requestedTypes.some((type) => !isEntityType(type));

  const requestedStatuses = filters.statuses ?? [];
  const invalidStatusFilter = requestedStatuses.some(
    (status) => typeof status !== "string" || normalizeSearchText(status.trim()).length === 0
  );
  const validStatuses = new Set(
    requestedStatuses
      .map((status) => (typeof status === "string" ? normalizeSearchText(status.trim()) : ""))
      .filter((status) => status.length > 0)
  );

  const matches =
    invalidTypeFilter || invalidStatusFilter
      ? []
      : queryMatches.filter((entry) => {
          if (validTypes.size > 0 && !validTypes.has(entry.type)) return false;
          if (
            validStatuses.size > 0 &&
            (entry.status === null || !validStatuses.has(normalizeSearchText(entry.status)))
          ) {
            return false;
          }
          return true;
        });

  const limit = normalizedLimit(filters.limit);
  const items = matches.slice(0, limit);
  return {
    items,
    total: matches.length,
    shown: items.length,
    limit,
    truncated: matches.length > items.length,
    facets
  };
}
