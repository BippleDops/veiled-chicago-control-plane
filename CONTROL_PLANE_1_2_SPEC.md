# Veiled Chicago Control Plane 1.2 specification

Status: frozen for implementation  
Date: 2026-08-29  
Target release: `1.2.0`

## Outcome

Turn the existing control plane into the vault's application shell without replacing Obsidian, duplicating core features, weakening local-first boundaries, or changing campaign authority.

The release will make navigation faster, expose more of the existing plugin set through one coherent surface, and retire only integrations whose lack of use can be proven. It will not add a general AI plugin, another command-button system, another workspace plugin, or another search index.

## Baseline

- Source release: `1.1.0`, commit `3cba78b15199bec356646af603ac71a1a743ddac`.
- Compatibility surface: one view type, `veiled-chicago-control-plane`, plus all 44 existing action and command IDs.
- Existing settings: automation flags, map URL and limits, explicit active-session room, context profile, recent script receipts, transaction receipts, and replay IDs.
- Vault roots: `1-Campaign`, `2-World`, `3-Library`, and `9-System` only.
- Community plugins: 29 enabled. No new third-party dependency is justified for 1.2.
- Current navigation sources: Control Plane, Homepage, Workspaces, Bookmarks, File Explorer, Folder Notes, Iconize, Pane Relief, Quick Switcher, Bases, Dataview, and maintained front-door notes.

## Non-negotiable invariants

1. Retain every 1.1 action ID, setting field, and the existing view type.
2. Never infer `next_session`, the selected lead, played canon, audience safety, or player knowledge.
3. Keep the explicitly selected active room separate from Current State chronology.
4. Never replace, initialize, commit, or publish the deployed `data.json`.
5. Keep all writes inside the existing reviewed proposal and transaction broker.
6. Keep protocol, installed-command, external URL, and local-process execution allowlisted and fail closed.
7. Add no arbitrary command IDs, shell text, paths, URLs, model providers, credentials, telemetry, or network calls.
8. Preserve the four-root path authority in `src/paths.ts`; navigation configuration may reference action IDs, not duplicate vault paths.
9. CSS remains presentation only. It does not become an access-control or execution layer.

## Product scope

### 1. Application shell

Create six stable primary routes:

| Route | Purpose |
| --- | --- |
| `home` | Observed campaign state, Live Edge Router, favorites, recent actions, primary live operations |
| `session` | Explicit active-room controls, declaration, preflight, readiness, live-event, RUN, review, and recording actions |
| `create` | Managed-note schemas, quick capture, research intake, and transcription proposal |
| `world` | Entity navigator, campaign board, factions, NPCs, maps, Bases, and player portal |
| `tools` | Quick Switcher, Bookmarks, Workspaces, map app, 5e tools, encounter tools, dice, initiative, and terminal |
| `system` | AI policy, capability inventory, audits, map-process controls, receipts, transactions, and plugin health |

Desktop uses a labelled left rail, central route content, and a persistent observed-context pane. Narrow leaves use a compact rail and context drawer. Mobile/narrow mode uses Home, Session, Create, World, and More navigation; More contains Tools and System.

Navigation controls use native buttons inside a labelled `nav` landmark with `aria-current="page"`. Route changes update and focus a real route heading.

### 2. Native command search

Add the stable action/command `open-command-search` and implement it with Obsidian's `FuzzySuggestModal`.

Searchable fields:

- action title and ID;
- description;
- route and existing group;
- explicit keywords;
- action verb;
- recent and favorite state.

Empty search prioritizes favorites and recents. Results show route, verb, availability, and the unavailable reason. Unavailable actions remain discoverable but cannot execute. Escape restores focus to the opener.

`Cmd/Ctrl+K` opens search only when the control-plane view owns focus. No global default hotkey is registered.

### 3. Recents and favorites

Add validated settings:

- `activeRoute`: one of the six compiled routes;
- `favoriteActionIds`: at most 12 compiled action IDs;
- `recentActions`: at most 20 records containing only action ID, success state, and ISO timestamp.

Invalid route IDs, action IDs, timestamps, or record shapes are dropped during settings normalization. No arbitrary note path, user-entered content, or process output is added to this history.

The Home route shows favorites and the five most recent actions. The System route shows the unified activity stream alongside existing automation and mutation receipts.

### 4. Scoped entity navigator

Deliver the previously gated faceted navigator without a new search plugin or semantic-index claim.

- Build the index only when the World route is opened.
- Use `TFile` path plus cached frontmatter; do not read every note body.
- Scope to known entity/session roots from compiled path constants.
- Derive entity type from a fixed root registry.
- Search title, basename, aliases, tags, status, and path.
- Provide type and status filters.
- Render at most 100 results at a time and disclose the total.
- Open the selected note through the existing singleton note router.
- Display audience/canon metadata as informational badges only.
- Make no similarity, privacy, completeness, or canonical-owner claim.

### 5. Existing-plugin capability adapters

Add fixed actions for installed/core capabilities whose runtime command IDs were verified:

- Quick Switcher: `switcher:open`;
- Bookmarks: `bookmarks:open`;
- Workspaces: `workspaces:open-modal`;
- Save workspace: `workspaces:save`;
- Audio recorder: `audio-recorder:start`, with explicit confirmation;
- Sessions Base;
- NPC Base;
- Location Base;
- Operational Review Queue Base.

The System route shows a compiled capability inventory with available/unavailable state. It never executes discovered command IDs; only the fixed action registry can execute.

### 6. Action semantics

Extend `ControlAction` with:

- one primary `route`;
- one visible `verb` such as `OPEN`, `RUN`, `CREATE`, `CAPTURE`, `REVIEW`, `SELECT`, `START`, or `STOP`;
- optional search `keywords`.

Every action must belong to exactly one route. Home favorites may reference actions without duplicating their definitions.

Existing IDs, kinds, targets, confirmations, desktop guards, and protocol policy remain unchanged.

### 7. Interaction continuity and accessibility

Required behavior:

- persistent skip link to route content;
- persistent polite live region for route, search, refresh, and action-result announcements;
- `role="alert"` only for actionable failures;
- visible title supplies each action's accessible name;
- action description and availability reason use `aria-describedby`;
- decorative icons are `aria-hidden="true"`;
- running actions use `aria-busy="true"` plus visible `RUNNING` text;
- 44 px coarse-pointer targets and at least 24 px otherwise;
- route activation focuses the route heading;
- Escape closes the context drawer and restores its trigger;
- `Alt+Left` and `Alt+Right` traverse in-memory route history only;
- refresh preserves active route, scroll, search text, and focus when the target still exists;
- forced-colors, reduced-motion, reduced-transparency, print, 200% zoom, and 320 px layout remain supported.

Use container queries because an Obsidian leaf may be narrow on a wide monitor.

## Plugin-set changes

No new third-party plugin will be installed in 1.2.

After exact dependency checks:

1. Disable `buttons` if the vault still contains zero `button` code blocks. Keep its package installed for rollback.
2. Disable `open-in-terminal` if no hotkey, command URI, or workflow depends on it. Keep Lean Terminal as the single embedded terminal; operational process actions remain brokered.
3. Set BRAT `enableAfterInstall` to `false` while preserving its repository list, frozen versions, and update policy.
4. Keep Homepage as a startup adapter for now; do not synthesize unreviewed Workspaces.
5. Keep Dataview, Meta Bind, Templater, Regex Pipeline, timeline, view-mode, map, and D&D plugins unchanged until each executable or rendered dependency receives a separate exhaustive audit.
6. Keep Local REST HTTPS-only and its credential state untracked and untouched.

Do not untrack or delete existing plugin configuration in this release. Configuration custody and Git-history review are a separate migration because they may require credential rotation and portability decisions.

## Architecture

Add pure modules:

- `src/navigation.ts`: route model, route/action validation, search text, history, favorite and recent normalization;
- `src/entity-navigator.ts`: scoped cached-frontmatter index and filters;
- `src/command-search.ts`: native fuzzy modal and result presentation.

Keep mutation/domain logic in `src/operating.ts`, vault paths in `src/paths.ts`, and forms in `src/workflow-ui.ts`.

`src/main.ts` owns Obsidian lifecycle, view rendering, settings persistence, and action execution. It must not gain another path registry or free-form command broker.

## Performance contract

- No network or model work during plugin load.
- No full-vault body reads during load, navigation, or search.
- Register vault-create listeners only after layout ready.
- Build the entity index lazily and invalidate it from metadata/vault events.
- Cap rendered results and persisted histories.
- Production bundle remains dependency-light and minified by the existing build.

## Verification and acceptance

### Static and unit

- All existing hardened operating tests pass.
- All 44 existing action IDs remain present.
- All actions have a valid route and verb.
- New route/action IDs are unique.
- Legacy section targets still resolve to the appropriate route/focus target.
- 1.1 settings normalize into 1.2 without losing fields.
- Invalid route, favorite, and recent-action data fail closed.
- Entity indexing never escapes fixed roots and never reads bodies.
- Protocol safety remains opt-in.
- Release sources contain no retired roots, tactical-ready pipeline, credentials, telemetry, or arbitrary execution.

### Visual and accessibility

- Dedicated control-plane fixture at container widths 1280, 800, 480, and 320 px.
- No horizontal page overflow at 320 px or 200% zoom.
- Keyboard route navigation, search, context drawer, and focus restoration tested.
- Route and result-count announcements tested.
- Light, dark, forced-colors, reduced-motion, and reduced-transparency states checked.
- Glass QA is regenerated only after the active snippet set is de-duplicated.

### Runtime

- Plugin reloads in Obsidian with the existing `data.json` hash unchanged before intentional settings migration.
- Existing 44 commands remain registered; new commands appear exactly once.
- View type reopens from the saved workspace.
- Every fixed installed-command adapter reports available or fails closed.
- BRAT still tracks the same repositories after update.
- `main.js` and `styles.css` match published release assets byte-for-byte.

### Vault

- Exactly four visible roots.
- No root `logs/`, generated caches, `node_modules`, or build products.
- Current State remains Session 8 played, Session 9 next, and preserves the selected lead verbatim unless the user changes it.
- Strict navigation, link, live-edge, CSS, and delivery-contract checks pass within their documented scopes.

## Release plan

1. Implement and test in the public source repository.
2. Update version fields and feature coverage to `1.2.0`.
3. Build and run the complete release verifier.
4. Sync source/distributables to `9-System/Apps/veiled-chicago-control-plane` without touching `data.json`.
5. Back up the live plugin.
6. Install/reload the live plugin and run runtime smoke tests.
7. Commit, tag `1.2.0`, push, and publish exactly `manifest.json`, `main.js`, and `styles.css`.
8. Perform an actual BRAT update and restore BRAT configuration byte-for-byte.
9. Recheck live bundle hashes, settings preservation, four-root shape, and generated-artifact absence.

## Deferred work

- autonomous AI/RAG, semantic similarity, OCR, and generative copilots;
- cloud or external-account integrations;
- calendar, outbound messaging, D&D Beyond, or media-worker automation;
- player-safe access enforcement;
- mass workspace synthesis;
- executable-code policy changes for DataviewJS, Meta Bind, Templater, or Regex Pipeline;
- tracked-plugin-data and Git-history cleanup;
- adding Omnisearch, QuickAdd, Commander, Workspaces Plus, Modal Forms, Smart Connections, or Text Generator.

These remain separate because they require benchmarks, exhaustive dependency scans, credentials, recipient approval, privacy controls, or data-custody decisions beyond this release.
