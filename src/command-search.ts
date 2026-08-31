import { App, FuzzySuggestModal, type FuzzyMatch } from "obsidian";

import { buildActionSearchText, rankActionsForSearch, type RecentActionRecord } from "./navigation";
import type { ControlAction } from "./actions";

export interface CommandSearchAvailability {
  readonly available: boolean;
  readonly reason?: string;
}

export interface CommandSearchOptions {
  readonly actions: readonly ControlAction[];
  readonly favoriteActionIds: readonly string[];
  readonly recentActions: readonly RecentActionRecord[];
  readonly opener: HTMLElement | null;
  readonly getAvailability: (action: ControlAction) => CommandSearchAvailability;
  readonly onChoose: (action: ControlAction) => void;
  readonly onUnavailable: (action: ControlAction, reason: string) => void;
  readonly onDismiss: () => void;
}

/** Native Obsidian action search over the fixed, compiled control registry. */
export class ControlActionSearchModal extends FuzzySuggestModal<ControlAction> {
  private readonly favorites: ReadonlySet<string>;
  private readonly recents: ReadonlySet<string>;
  private choseAction = false;

  constructor(app: App, private readonly options: CommandSearchOptions) {
    super(app);
    this.favorites = new Set(options.favoriteActionIds);
    this.recents = new Set(options.recentActions.map((record) => record.actionId));
    this.setPlaceholder("Search control-plane actions…");
    this.setInstructions([
      { command: "↑↓", purpose: "navigate" },
      { command: "↵", purpose: "run available action" },
      { command: "esc", purpose: "close" }
    ]);
  }

  onOpen(): void {
    super.onOpen();
    this.modalEl.addClass("vc-control-command-modal");
    this.inputEl.setAttr("aria-label", "Search control-plane actions");
  }

  getItems(): ControlAction[] {
    return rankActionsForSearch(this.options.actions, "", {
      favoriteActionIds: this.options.favoriteActionIds,
      recentActions: this.options.recentActions
    }).map(({ action }) => action);
  }

  getSuggestions(query: string): FuzzyMatch<ControlAction>[] {
    return rankActionsForSearch(this.options.actions, query, {
      favoriteActionIds: this.options.favoriteActionIds,
      recentActions: this.options.recentActions
    }).map(({ action, score }) => ({ item: action, match: { score, matches: [] } }));
  }

  getItemText(action: ControlAction): string {
    return buildActionSearchText(action, {
      favorite: this.favorites.has(action.id),
      recent: this.recents.has(action.id)
    });
  }

  renderSuggestion({ item: action }: FuzzyMatch<ControlAction>, element: HTMLElement): void {
    const availability = this.options.getAvailability(action);
    element.addClass("vc-control-command-result");
    element.toggleClass("is-unavailable", !availability.available);
    element.setAttr("aria-disabled", String(!availability.available));

    const header = element.createDiv({ cls: "vc-control-command-result-header" });
    header.createEl("strong", { text: action.title });
    header.createSpan({ cls: "vc-control-command-result-verb", text: action.verb });
    const meta = element.createDiv({ cls: "vc-control-command-result-meta" });
    meta.createSpan({ text: action.route.toUpperCase() });
    if (this.favorites.has(action.id)) meta.createSpan({ text: "FAVORITE" });
    if (this.recents.has(action.id)) meta.createSpan({ text: "RECENT" });
    element.createEl("small", {
      cls: "vc-control-command-result-description",
      text: availability.reason ?? action.description
    });
  }

  onChooseItem(action: ControlAction): void {
    const availability = this.options.getAvailability(action);
    if (!availability.available) {
      this.options.onUnavailable(action, availability.reason ?? `${action.title} is unavailable.`);
      return;
    }
    this.choseAction = true;
    this.options.onChoose(action);
  }

  onClose(): void {
    super.onClose();
    this.options.onDismiss();
    if (!this.choseAction && this.options.opener?.isConnected) {
      window.setTimeout(() => this.options.opener?.focus({ preventScroll: true }), 0);
    }
  }
}
