import type { ActionGroup, ControlAction } from "./actions";

/** The only startup surfaces accepted from untrusted persisted settings. */
export const STARTUP_SURFACES = ["control-plane", "none"] as const;

export type StartupSurface = (typeof STARTUP_SURFACES)[number];

/** Missing or malformed 1.2 settings migrate to the first-party control plane. */
export function normalizeStartupSurface(value: unknown): StartupSurface {
  return typeof value === "string" && (STARTUP_SURFACES as readonly string[]).includes(value)
    ? (value as StartupSurface)
    : "control-plane";
}

/** Dense routes gain in-page group navigation; short routes keep one compact grid. */
export function shouldGroupRouteActions(actionCount: number): boolean {
  return Number.isInteger(actionCount) && actionCount > 8;
}

export interface ActionGroupBucket<TAction extends Pick<ControlAction, "group"> = ControlAction> {
  readonly group: ActionGroup;
  readonly actions: readonly TAction[];
}

/** Group actions without changing either first-group order or action order. */
export function groupRouteActions<TAction extends Pick<ControlAction, "group">>(
  actions: readonly TAction[]
): readonly ActionGroupBucket<TAction>[] {
  const buckets = new Map<ActionGroup, TAction[]>();
  for (const action of actions) {
    const bucket = buckets.get(action.group);
    if (bucket) bucket.push(action);
    else buckets.set(action.group, [action]);
  }
  return [...buckets].map(([group, groupedActions]) => ({ group, actions: groupedActions }));
}

/** Escape closes the modal context first, then the mobile More disclosure. */
export function escapeSurface(contextOpen: boolean, moreOpen: boolean): "context" | "more" | null {
  if (contextOpen) return "context";
  if (moreOpen) return "more";
  return null;
}

/** Deterministic, CSS-safe token for stable runtime label/description IDs. */
export function stableDomIdToken(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export interface AdStatblockSpec {
  readonly title: string;
  readonly markdown: string;
}

const AD_STATBLOCK_TITLE = /^\s*title\s*:\s*(.*?)\s*$/i;

/** Parse only the optional first-line title field; all other text remains body Markdown. */
export function parseAdStatblock(source: string): AdStatblockSpec {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const firstLine = lines[0] ?? "";
  const titleMatch = firstLine.match(AD_STATBLOCK_TITLE);
  const title = (titleMatch?.[1] ?? "").trim().slice(0, 160) || "Statblock";
  return {
    title,
    markdown: (titleMatch ? lines.slice(1) : lines).join("\n").trim()
  };
}

/**
 * Neutralize executable Markdown extensions before handing content to Obsidian.
 * Normal links, tables, emphasis, and lists remain available. HTML, embeds, and
 * fenced processors are displayed as source instead of being invoked.
 */
export function sanitizeAdStatblockMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  let fence: { readonly character: "`" | "~"; readonly length: number } | null = null;
  const safeLines = lines.map((rawLine) => {
    const line = rawLine.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/!\[\[/g, "[[");
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      const isClose = marker?.[1]?.[0] === fence.character && marker[1].length >= fence.length;
      if (isClose) fence = null;
      return `    ${line}`;
    }
    if (marker?.[1]) {
      fence = { character: marker[1][0] as "`" | "~", length: marker[1].length };
      return `    ${line}`;
    }
    return line
      .replace(/`([=$])([^`\n]*)`/g, "`\\$1$2`")
      .replace(/\b(BUTTON|INPUT|VIEW)\[/gi, "$1\u2060[");
  });
  return safeLines.join("\n");
}

export const ENTITY_SEARCH_DEBOUNCE_MS = 180;
