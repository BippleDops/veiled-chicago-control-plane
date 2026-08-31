# Veiled Chicago Control Plane 1.4

## Intent

Version 1.4 hardens existing operating contracts without adding commands, choosing campaign direction, or expanding the mutation authority. All 56 version 1.3 action IDs remain stable.

## Command search

- `ControlActionSearchModal.getSuggestions(query)` must call the shared `rankActionsForSearch` model with the current query.
- Favorite and recent boosts remain inputs to both empty and non-empty searches.
- The modal must not discover commands or execute an ID outside the compiled action registry.

## Action-source policy

Every compiled action has typed `allowedSources` drawn from `view`, `block`, `command`, and `protocol`.

- The first-party view and registered Obsidian command remain valid sources for all compiled actions.
- Protocol access remains opt-in through the existing `protocolSafe` registry field.
- Markdown `vcg-control` blocks may expose only `view`, `note`, and `dynamic-note` actions.
- Markdown must not directly expose workflows, Obsidian commands, integrations, external URLs, recording, terminal or process actions, or scripts.
- The parser and the final dispatcher both enforce source policy. A parser bypass therefore cannot weaken the dispatch boundary.

`vcg-control` inputs are limited to 4,096 characters, 64 lines, a 120-character title, a 240-character subtitle, and 12 unique compiled actions.

## Active session selection

`set-active-session-room` opens a native fuzzy chooser populated only from existing `TFolder` direct children of `1-Campaign/Sessions`.

- Future-planning, archive, nested, missing, and non-folder paths are excluded.
- The chosen folder is looked up again and normalized immediately before settings are saved.
- Stored settings are looked up and normalized again before display and whenever availability, live state, or a workflow consumes them. A stale stored path is labelled unavailable rather than presented as the active room, and remains explicitly clearable.
- Renaming or deleting a selected folder makes the active-room contract unavailable; filenames and chronology are never inferred.

## RUN evidence contract

Every RUN proposal binds a byte-stable Current State snapshot from `1-Campaign/DM/Current State of Affairs.md` and derives the displayed latest-played label from its exact `last_played_record` wikilink.

Player authority:

- Decision Intake is a second bound evidence source.
- One standalone `vcg:declaration <id>` marker is unambiguous.
- More than one declaration requires exactly one standalone `vcg:selection <declaration-id>` marker.
- The selector must name a declaration in the same source. Duplicate declarations, multiple selectors, unknown selectors, and markers in fenced or indented code fail closed.

DM live-handoff authority:

- `deployment_mode` must equal `dm-selected-from-live-handoff`.
- `selected_lead` must be one safe scalar identifier.
- Both fields must come from the same Current State contents bound by the proposal.
- This authority never asserts or fabricates player wording.

Exactly one authority is permitted. The proposal remains draft/future and human-reviewed; it does not promote canon.

## Bounded material contract

- Backdrop blur is capped at 18px and belongs only to the short application header, mobile bottom navigation, and floating More panel.
- Persistent route/context rails, ordinary cards, routers, favorites, recents, and entity controls remain opaque tonal surfaces.
- Route display titles are compact, and running actions use a quiet two-pixel signal datum plus authored state text instead of a decorative hazard field.
- Reduced-transparency, forced-colors, and print fallbacks continue to remove backdrop work.

## Acceptance

`npm run verify` must prove strict type checking, source-policy/parser limits, query wiring, session-folder guards, RUN evidence ambiguity failures, distributable rebuild, version alignment, and the unchanged 56-action registry.
