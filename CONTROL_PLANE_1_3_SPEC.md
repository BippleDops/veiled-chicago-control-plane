# Veiled Chicago Control Plane 1.3 specification

Status: frozen for implementation
Date: 2026-08-29
Target release: `1.3.0`

## Outcome

Make the four-root vault feel like one application while reducing overlapping runtime code. The Control Plane remains the workflow and mutation authority; contextual controls, content retrieval, core Obsidian views, and retained specialist plugins become adapters around it.

This release will retire unused plugins by evidence, add only two narrow capabilities, replace Homepage with a first-party startup route, repair runtime accessibility defects, render the otherwise-unhandled `ad-statblock` corpus, and make the Glass/compatibility layer visually coherent across the retained stack.

## Baseline

- Source release: `1.2.0`, commit `9b28e8313df6d41f518e93b56e5e9c1bf8a0af84`.
- Vault roots: `1-Campaign`, `2-World`, `3-Library`, and `9-System` only.
- Live campaign authority at freeze: Session 8 last played, Session 9 next, deployment mode `dm-selected-from-live-handoff`, selected lead `cullerton-audit-and-stockyards-first-record`.
- Installed community packages: 29; configured enabled set: 27; runtime enabled set: 29 because `buttons` and `open-in-terminal` were never disabled in the running app.
- Control Plane: six routes and 55 compiled actions.
- The current HTML visual fixture is a design facsimile, not runtime proof. It contains behaviors absent from `src/main.ts`.

## Non-negotiable invariants

1. Preserve every 1.2 action ID, setting field, view type, proposal gate, transaction guard, and path authority.
2. Never infer chronology, lead choice, canon, audience safety, player knowledge, or table consent.
3. Never execute toolbar text, note content, discovered command IDs, arbitrary URLs, model calls, or shell text.
4. Never publish, replace, initialize, or manually edit the deployed Control Plane `data.json`.
5. Keep Local REST credential material untouched and out of logs, documentation, commits, and release assets.
6. Keep the four-root layout; do not recreate retired roots, root `logs/`, caches, `node_modules`, `.generated`, `dist-dm`, or stale workspace-history paths.
7. CSS remains presentation only. Behavior stays in native plugin APIs, fixed Obsidian commands, reviewed workflows, or the allowlisted companion.
8. Third-party packages disabled in this release remain installed for one rollback window unless explicitly identified otherwise.
9. RUN generation requires exactly one explicit, source-citing selection authority. Preserve the verbatim player-declaration path and also accept the exact Current State `dm-selected-from-live-handoff` mode plus a scalar `selected_lead`; zero, invalid, or simultaneous authorities fail closed, and DM selection is never presented as player intent.

## Capability ownership

| Surface | Owner | Contract |
| --- | --- | --- |
| Campaign actions, creation, session capture, reviewed writes | Control Plane | Sole workflow authority |
| Contextual note actions | Note Toolbar | Command/file launcher only; no JavaScript, DataviewJS, Templater, or URI scripts |
| Full-text note retrieval | Omnisearch | Local index only; optional HTTP server disabled |
| Filename navigation | Core Quick Switcher | Retained |
| Structured indexes | Core Bases plus Dataview | Bases-first for new work; no bulk migration |
| Maps | Leaflet plus the existing local map frame | Retained; no false replacement claim |
| D&D runtime | Dice Roller, Fantasy Statblocks, Initiative Tracker, D&D UI Toolkit | Retained until contract-equivalent migrations exist |
| External local automation bridge | Obsidian CLI, Local REST, Lean Terminal, reviewed companion | Explicit and local; no new AI agent plugin |

## Plugin rationalization

### Add

1. `note-toolbar` at the current stable `1.34.15` line.
   - Use folder/rule mappings to expose one coherent command/file toolbar across campaign, world, library, and system contexts.
   - Toolbar items may invoke only fixed Control Plane commands, core Obsidian commands, or fixed vault files.
   - Do not enable script items, toolbar ribbon items, or another creation engine.
2. `omnisearch` at the current stable `1.30.1` line.
   - Add one fixed Control Plane action for the verified Omnisearch command.
   - Keep its optional HTTP server disabled.
   - Exclude the imported CLI compendium, recovery material, archives, and generated paths from indexing where supported.

These have distinct jobs: Note Toolbar exposes the existing governed actions where work happens; Omnisearch retrieves note bodies. Neither owns writes.

### Disable now, retain packages for rollback

- `buttons` and `open-in-terminal`: configured disabled but still runtime-loaded; complete the 1.2 retirement.
- `aprils-automatic-timelines`: no timeline blocks or properties; existing Dataview/Bases surfaces replace it.
- `folder-notes`: sparse same-name-note use; File Explorer, README indexes, Bookmarks, and Control Plane navigation replace it.
- `helpmate`: no active dependency; core Web Viewer and local runbooks replace it.
- `markdown-attributes`: no syntax use.
- `pane-relief`: no meaningful leaf history; native navigation and Control Plane history replace it.
- `obsidian-icon-folder`: no rules or icons; Glass and Control Plane own visual identity.
- `obsidian-regex-pipeline`: no rulesets; audited scripts own deterministic rewrites.
- `supercharged-links-obsidian`: no rules; disable its empty generated CSS snippet.
- `zoom-map`: no blocks or assets; Leaflet and the local map app already own mapping. Remove it from BRAT tracking after backup.
- `homepage`: disable only after the Control Plane startup surface passes a reload test.
- `image-window`: trial-disable for the rollback window; core pop-out windows are the replacement.

### Keep

Keep BRAT, Custom Frames, Dataview, Dice Roller, D&D UI Toolkit, Fantasy Statblocks, Force View Mode by Frontmatter, Initiative Tracker, Leaflet, Meta Bind, Templater, Style Settings, Various Complements, Lean Terminal, Local REST, and the Control Plane. Templater remains because two live Meta Bind actions call it. Various Complements remains because interaction-only use cannot be disproved safely.

Custom Frames remains because three compiled Control Plane actions depend on it. Its three direct ribbon icons will be disabled so the Control Plane/toolbar becomes the launcher.

### Deferred pilots

- Official Maps: defer until a canonical coordinate/property schema exists; it does not replace the 265-note Leaflet corpus.
- Notebook Navigator: defer to an isolated performance canary because this is a 14,000-plus-note iCloud vault.
- Smart Connections or another AI plugin: do not install. Index cost, context routing, privacy, canon review, and provider custody require a separate measured design.
- QuickAdd, Modal Forms, Commander, another workspace plugin, or another D&D suite: do not install because they duplicate current authority.

## Control Plane 1.3 product scope

### 1. Startup and unified navigation

- Add a validated `startupSurface` setting: `control-plane` or `none`.
- Default existing/missing configuration to `control-plane` for this vault migration.
- On layout ready, reuse the existing Control Plane leaf or open exactly one tab. Do not create duplicate views.
- Group dense route actions by the existing `action.group` taxonomy and add in-page group links only when a route has more than eight actions.
- Keep every compiled action visible exactly once on its owner route and searchable in command search.

### 2. Contextual toolbar

Create four command-only toolbar contexts:

- Campaign/session: Control Plane, command search, current state, current leads, active session control, live-event capture, audio recording, promotion review.
- World: Control Plane, entity navigator, campaign board, map registry, local map.
- Library: Control Plane, Omnisearch, Quick Switcher, Bookmarks.
- System: Control Plane, operations health, vault health, terminal, Workspaces.

Prefer folder mappings or rules over inserting frontmatter into thousands of notes. Toolbar commands remain adapters; missing commands fail closed in the owning plugin.

### 3. Retrieval and capability registry

- Add the fixed `open-omnisearch` action only after verifying the installed command ID.
- Add a System-route interface-stack panel showing each retained capability, its owner, enabled/available state, and replacement boundary.
- Do not enumerate and execute runtime-discovered commands.

### 4. `ad-statblock` compatibility renderer

- Register a non-executable `ad-statblock` Markdown code-block processor.
- Parse only an optional first-line `title:` field; render the remaining source as ordinary Markdown inside a labelled statblock section.
- Use Obsidian's Markdown renderer so links and tables retain normal vault behavior.
- Never evaluate code, YAML, HTML, or arbitrary plugin commands.
- Scope styling to `.vc-ad-statblock` and support print, forced colors, reduced transparency, narrow leaves, and long content.

### 5. Runtime accessibility and responsive correctness

- Escape closes the narrow-layout More panel and restores its trigger.
- More is a labelled region, not a fake APG menu.
- The persistent live region uses `role="status"`; background refresh is silent.
- Entity search is debounced; controls identify their count/results targets; structured result labels/descriptions use stable IDs.
- Remove parent opacity from unavailable actions/results; all normal text must meet 4.5:1 contrast in Glass light and dark themes.
- Move leaf-width-dependent reflow to `@container vc-control-plane`; viewport queries remain only for device/environment concerns.
- Correct runtime heading selectors and keep 44 px coarse-pointer targets.
- The current fixture must be labelled a design fixture unless it shares runtime state helpers. Add source-level UI contract tests and inspect actual Obsidian DOM before release.

### 6. Visual cohesion

- Bump Veiled Chicago Glass to `2.1.0` with clearer HTML-document layers, stronger translucent seams, readable solid fallbacks, and no access-control claims.
- Put third-party compatibility selectors in `vcg-compat.css`, not the Control Plane release stylesheet.
- Add restrained adapters for Note Toolbar and Omnisearch plus retained Meta Bind, Custom Frames, and Lean Terminal chrome.
- Do not style cross-origin iframe contents or recolor terminal/map content.
- Disable the empty `supercharged-links-gen` snippet.

### 7. Selection-evidence gate

- Replace the raw declaration-substring check with a typed evidence union.
- Accept a player authority only from an exact standalone `vcg:declaration <id>` marker outside fenced and indented code in the active room's Decision Intake.
- Accept a DM authority only from one `1-Campaign/DM/Current State of Affairs.md` content snapshot when `deployment_mode` exactly equals `dm-selected-from-live-handoff` and `selected_lead` is one nonempty safe scalar identifier in that same snapshot.
- Cite the validated source and authority in the generated RUN. For the DM path, state explicitly that no player wording or intent is asserted.
- Bind the source SHA-256/size/mtime into the human review and re-read/re-hash it after target preflight but before any mutation.
- Reject missing, malformed, wrong-source, unknown-authority, mixed legacy/typed, simultaneous player/DM, and post-review-changed evidence.

## Verification and acceptance

### Static and unit

- `npm run verify` passes at `1.3.0`.
- All prior 55 action IDs remain; `open-omnisearch` is the only new action.
- Startup-setting normalization, More-panel state, group membership, and statblock title parsing have tests.
- Release sources contain no retired roots, credentials, arbitrary execution, or retired tactical pipeline.

### Runtime

- Configured and runtime enabled-plugin sets match exactly.
- Note Toolbar and Omnisearch load once at the pinned stable versions; Omnisearch HTTP is off; toolbar contains no script items.
- Homepage opens no competing front door; startup creates/reuses one Control Plane leaf.
- Real Control Plane DOM passes keyboard, focus, semantics, 320/480/800/1280 leaf-width, 200% zoom, light/dark, reduced-motion, reduced-transparency, and forced-color smoke checks.
- Custom Frame ribbon icons are absent; fixed Control Plane frame actions still work.
- One representative `ad-statblock` renders as structured Markdown rather than raw code.
- Live `data.json` is unchanged before intentional settings migration and remains structurally valid afterward.

### Vault

- Weekly gate and focused plugin/config/CSS tests pass with `PYTHONDONTWRITEBYTECODE=1`.
- Current State and selected-lead authority remain byte-for-byte unchanged.
- Exactly four visible roots; no root `logs/`, caches, generated artifacts, old canvas path, or stale workspace-history entries.
- Organization-owned audit/test changes remain intact.

## Release plan

1. Implement and verify in the public source repository.
2. Install/configure the two selected plugins, then disable the retired set through Obsidian's runtime API/CLI.
3. Deploy Control Plane and Glass/compatibility updates without overwriting Control Plane `data.json`.
4. Reload and perform actual Obsidian runtime checks.
5. Mirror finalized source/distributables to `9-System/Apps/veiled-chicago-control-plane` without copying `data.json`.
6. Commit, tag, push, and publish exactly `manifest.json`, `main.js`, and `styles.css` for `1.3.0`.
7. Perform a BRAT update/install check and re-verify live hashes, plugin state, campaign authority, and four-root cleanliness.

## Rollback

- Preflight copies of plugin/config files live outside the vault in a unique temporary directory for this run.
- Re-enable a retired plugin from its retained package only if a concrete workflow regression appears.
- Restore the previous JSON/config file from the preflight copy, reload the affected plugin, and confirm the runtime/configured sets match.
- Reinstall Control Plane `1.2.0` from its published release if the first-party runtime fails; never restore or overwrite `data.json` as part of that rollback.
