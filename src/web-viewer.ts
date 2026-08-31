export const CORE_WEB_VIEWER_VIEW_TYPE = "webviewer";
export const WEB_VIEWER_COMMIT_TIMEOUT_MS = 2000;
export const WEB_VIEWER_COMMIT_POLL_MS = 50;

export const FIXED_WEB_VIEWER_URLS = {
  "open-5etools": "https://5e.tools/",
  "open-kobold-club": "https://koboldplus.club/"
} as const;

export type FixedWebViewerActionId = keyof typeof FIXED_WEB_VIEWER_URLS;

export interface WebViewerUrlWaitOptions {
  readonly timeoutMs?: number;
  readonly pollMs?: number;
  readonly now?: () => number;
  readonly sleep?: (milliseconds: number) => Promise<void>;
  readonly isCancelled?: () => boolean;
}

export interface CoreWebViewerState {
  readonly type: string;
  readonly state?: Readonly<Record<string, unknown>>;
}

export interface CoreWebViewerWorkspace<Leaf> {
  readonly forEachLeaf: (visit: (leaf: Leaf) => void) => void;
  readonly getViewState: (leaf: Leaf) => CoreWebViewerState;
  readonly createTab: () => Leaf;
  readonly setViewState: (
    leaf: Leaf,
    viewState: { readonly type: string; readonly state: { readonly url: string; readonly navigate: true } }
  ) => Promise<void>;
  readonly revealLeaf: (leaf: Leaf) => Promise<void>;
  readonly detachLeaf: (leaf: Leaf) => void;
  readonly isCancelled: () => boolean;
}

export const WEB_VIEWER_CANCELLED_MESSAGE = "Core Web Viewer activation was cancelled during plugin unload.";

/** Normalize a credential-free HTTP(S) URL for exact Web Viewer leaf comparison. */
export function canonicalWebViewerUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const url = new URL(raw);
    if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

/** The configurable campaign map remains loopback-only and credential-free. */
export function isSafeMapUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    return url.protocol === "http:" && loopback && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isFixedWebViewerActionId(actionId: string): actionId is FixedWebViewerActionId {
  return Object.prototype.hasOwnProperty.call(FIXED_WEB_VIEWER_URLS, actionId);
}

/** Resolve only the three compiled Web Viewer adapters; registry drift fails closed. */
export function resolveWebViewerActionUrl(
  actionId: string,
  target: string | undefined,
  mapUrl: string
): string | null {
  if (actionId === "open-veiled-map") {
    return target === undefined && isSafeMapUrl(mapUrl) ? canonicalWebViewerUrl(mapUrl) : null;
  }
  if (!isFixedWebViewerActionId(actionId)) return null;
  const expected = FIXED_WEB_VIEWER_URLS[actionId];
  const canonical = canonicalWebViewerUrl(target);
  return target === expected && canonical === expected && expected.startsWith("https://") ? expected : null;
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

/** Wait a bounded interval for Web Viewer to persist its asynchronously committed URL state. */
export async function waitForCanonicalWebViewerUrl(
  expectedUrl: string,
  readUrl: () => unknown,
  options: WebViewerUrlWaitOptions = {}
): Promise<boolean> {
  const expected = canonicalWebViewerUrl(expectedUrl);
  if (!expected) return false;
  const timeoutMs = options.timeoutMs ?? WEB_VIEWER_COMMIT_TIMEOUT_MS;
  const pollMs = options.pollMs ?? WEB_VIEWER_COMMIT_POLL_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 0 || !Number.isFinite(pollMs) || pollMs <= 0) return false;

  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;
  const deadline = now() + timeoutMs;
  while (true) {
    if (options.isCancelled?.()) return false;
    if (canonicalWebViewerUrl(readUrl()) === expected) return true;
    const remaining = deadline - now();
    if (remaining <= 0) return false;
    await sleep(Math.min(pollMs, remaining));
    if (options.isCancelled?.()) return false;
  }
}

/** Single-flight, fail-closed bridge from compiled URLs to Obsidian core Web Viewer leaves. */
export class CoreWebViewerController<Leaf> {
  private readonly pending = new Map<string, Promise<Leaf>>();

  constructor(
    private readonly workspace: CoreWebViewerWorkspace<Leaf>,
    private readonly waitOptions: WebViewerUrlWaitOptions = {}
  ) {}

  open(url: string): Promise<Leaf> {
    if (canonicalWebViewerUrl(url) !== url) {
      return Promise.reject(new Error("Core Web Viewer received a non-canonical or invalid URL."));
    }
    const existing = this.pending.get(url);
    if (existing) return existing;
    const activation = this.activate(url);
    this.pending.set(url, activation);
    const clear = (): void => {
      if (this.pending.get(url) === activation) this.pending.delete(url);
    };
    void activation.then(clear, clear);
    return activation;
  }

  clear(): void {
    this.pending.clear();
  }

  private assertActive(): void {
    if (this.workspace.isCancelled()) throw new Error(WEB_VIEWER_CANCELLED_MESSAGE);
  }

  private async activate(url: string): Promise<Leaf> {
    this.assertActive();
    let existing: Leaf | null = null;
    this.workspace.forEachLeaf((leaf) => {
      if (existing) return;
      const state = this.workspace.getViewState(leaf);
      if (state.type === CORE_WEB_VIEWER_VIEW_TYPE && canonicalWebViewerUrl(state.state?.url) === url) {
        existing = leaf;
      }
    });
    this.assertActive();
    if (existing) {
      await this.workspace.revealLeaf(existing);
      this.assertActive();
      return existing;
    }

    this.assertActive();
    const leaf = this.workspace.createTab();
    try {
      this.assertActive();
      await this.workspace.setViewState(leaf, {
        type: CORE_WEB_VIEWER_VIEW_TYPE,
        state: { url, navigate: true }
      });
      this.assertActive();
      if (this.workspace.getViewState(leaf).type !== CORE_WEB_VIEWER_VIEW_TYPE) {
        throw new Error("Obsidian's core Web Viewer did not accept the requested view type.");
      }
      const committed = await waitForCanonicalWebViewerUrl(
        url,
        () => this.workspace.getViewState(leaf).state?.url,
        { ...this.waitOptions, isCancelled: this.workspace.isCancelled }
      );
      this.assertActive();
      if (!committed) throw new Error("Obsidian's core Web Viewer did not persist the validated URL in time.");
      this.assertActive();
      await this.workspace.revealLeaf(leaf);
      this.assertActive();
      return leaf;
    } catch (error) {
      this.workspace.detachLeaf(leaf);
      throw error;
    }
  }
}
