# Veiled Chicago Control Plane

A desktop-only Obsidian plugin that turns the Veiled Chicago campaign vault into an application-like control surface. It provides a six-route semantic HTML shell, native command and entity navigation, a first-party startup surface, safe Markdown compatibility renderers, fixed Obsidian adapters, and a deliberately narrow local-automation bridge.

## Install with BRAT

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat).
2. Open **Settings → BRAT → Add Beta Plugin**.
3. Enter `BippleDops/veiled-chicago-control-plane` (or the full repository URL).
4. Choose the latest release and enable **Veiled Chicago Control Plane**.
5. Use the radar ribbon icon or run **Veiled Chicago Control Plane: Control Plane** from the command palette.

BRAT installs `manifest.json`, `main.js`, and `styles.css` from the latest published release. Each release tag must exactly match the version in `manifest.json`.

## Manual install

Download `manifest.json`, `main.js`, and `styles.css` from the latest release into:

```text
<vault>/.obsidian/plugins/veiled-chicago-control-plane/
```

Reload Obsidian, enable the plugin under **Community plugins**, and open the control plane from the ribbon or command palette.

## What it does

- Builds a responsive, semantic HTML application shell with Home, Session, Create, World, Tools, and System routes.
- Registers 56 fixed navigation, creation, session, governance, installed-plugin, integration, and local-script actions while retaining all 55 version 1.2 IDs.
- Provides native fuzzy command search, capped favorites and recents, bounded in-memory route history, and a persistent observed-context pane.
- Opens or reuses exactly one Control Plane leaf at layout ready by default; the validated `startupSurface` setting can leave the saved layout unchanged.
- Groups dense route actions by their compiled taxonomy and exposes keyboard-operable in-page group links without duplicating actions.
- Provides a lazy, fixed-root entity navigator over cached frontmatter for NPCs, locations, factions, items, and session records, with debounced search and explicit result relationships; it does not read note bodies or claim semantic similarity.
- Provides a dynamic Live Edge Router that reads explicit Current State and a separately selected active room without inferring chronology.
- Creates schema-driven draft notes through preview-bound target baselines and a rollback-aware transaction broker.
- Scaffolds session rooms, captures verbatim declarations and live events, gates RUN generation on exactly one validated selection-evidence authority, and routes promotion through human review.
- Defines six guarded AI context configurations. They constrain this plugin's surfaces but do not claim provider-side retrieval enforcement.
- Renders allowlisted `vcg-control` Markdown blocks; note content cannot supply commands, paths, arguments, or shell fragments.
- Renders legacy `ad-statblock` blocks as labelled, non-executable Markdown after neutralizing HTML, embeds, executable code-block processors, Dataview expressions, and Meta Bind directives.
- Applies workflow profiles (`vcg-dashboard`, `vcg-session`, `vcg-dossier`, `vcg-data-deck`, `vcg-map-room`, and `vcg-handout`) from the active note's path and frontmatter without editing the note.
- Integrates through compiled command IDs with Omnisearch, Quick Switcher, Bookmarks, Workspaces, Audio Recorder, Dice Roller, Initiative Tracker, Custom Frames, and Lean Terminal when those capabilities are present. The Omnisearch adapter is fixed to the verified `omnisearch:show-modal` command and does not manage its index or HTTP settings.
- Shows a fixed interface-capability registry on System with owners, local availability, and explicit replacement boundaries; discovered command IDs are diagnostic only and are never executed.
- Opens native Sessions, NPC, Location, and Operational Review Queue Bases through fixed vault paths.
- Exposes navigation through the `obsidian://vc-control?action=<allowlisted-id>` protocol.

The dashboard resolves campaign state from `1-Campaign/DM/Current State of Affairs.md`. It does not infer or choose a next session when `next_session` is absent, null, malformed, or not a positive integer.

The active session room is a separate, explicit plugin-local selection. Selecting it never writes Current State, chooses a lead, establishes chronology, or promotes a draft. The room name must match the selected folder basename so workflow filenames cannot escape the room.

RUN generation accepts exactly one of two source-citing evidence authorities: an exact standalone `vcg:declaration <id>` marker in the active room's `<display name> Decision Intake.md`, or the exact `deployment_mode: dm-selected-from-live-handoff` plus one safe scalar `selected_lead` parsed from the same `1-Campaign/DM/Current State of Affairs.md` snapshot. Zero authorities, both authorities, markers inside fenced or indented code, a mismatched source path, incomplete DM fields, or fields that do not match that snapshot fail closed. The DM path is labelled as DM authority and never represented as player wording. The reviewed proposal displays a SHA-256/size/mtime evidence read set and re-reads and re-hashes it after target preflight but before any mutation. The older `declarationEvidence` builder input remains accepted as a player-declaration compatibility path, but cannot be combined with the typed evidence input.

See [FEATURE_COVERAGE.md](FEATURE_COVERAGE.md) for the exact implementation status and ownership boundary of all fifty operating upgrades.

## Markdown controls

Embed a smaller control surface in any note:

````markdown
```vcg-control
title: Table controls
subtitle: Navigation and local checks
actions: open-current-state, open-current-leads, open-dice-tray, run-live-edge-audit
compact: true
```
````

Only action IDs compiled into [`src/actions.ts`](src/actions.ts) are accepted. Unknown keys, duplicate keys, unknown actions, and empty action lists render as errors.

## Operating workflow command IDs

These IDs are stable hotkey and control-block targets. Obsidian prefixes command-palette IDs with `veiled-chicago-control-plane:`.

- `open-live-edge-router`
- `open-command-search`
- `open-omnisearch`
- `open-entity-navigator`
- `create-managed-note`
- `capture-quick-inbox`
- `set-active-session-room`
- `open-active-session-control`
- `scaffold-active-session-room`
- `open-session-preflight`
- `capture-player-declaration`
- `generate-session-run`
- `open-session-readiness`
- `capture-live-event`
- `open-promotion-review`
- `propose-local-transcription`
- `start-audio-recorder`
- `open-ai-context-policy`
- `open-operations-health`

## Optional local automation companion

Navigation, HTML surfaces, URI actions, and integrations work from the BRAT installation alone. Process actions additionally require the companion wrapper and the corresponding vault audit scripts.

Copy [`companion/vcg_control.py`](companion/vcg_control.py) to this path inside the vault:

```text
<vault>/9-System/Automation/scripts/vcg_control.py
```

The plugin invokes only:

```text
python3 9-System/Automation/scripts/vcg_control.py run <fixed-action-id> --json
```

No shell is involved. The wrapper maintains a second allowlist, accepts no arbitrary command or path, redacts the vault root from stored output, and refuses to stop a map process it cannot prove it owns. The wrapper currently requires macOS/POSIX process tools; other desktop platforms retain the non-process features.

Local automation is disabled by default. Start/stop actions require confirmation by default. Terminal and process actions are never protocol-safe and cannot run through `obsidian://vc-control`.

## Vault hierarchy contract

All paths are centralized in [`src/paths.ts`](src/paths.ts). The plugin targets only the live hierarchy:

- `1-Campaign/DM`, `1-Campaign/Party`, `1-Campaign/Sessions`, and `1-Campaign/Handouts`
- `2-World/Chicago`
- `3-Library/Mechanics`, `3-Library/Modules/Chicago`, and `3-Library/Templates`
- `9-System/Automation` and `9-System/Apps`

Deleted legacy roots are not used as write fallbacks. This prevents a stale alias from recreating the pre-migration hierarchy.

Managed mutation outputs are Markdown files below one of the four live roots only. Schema destinations are:

- NPCs: `2-World/Chicago/People/NPCs`
- Locations: `2-World/Chicago/Places`
- Factions: `2-World/Chicago/Factions`
- Items: `2-World/Chicago/Items`
- Clues: `1-Campaign/DM/Operations Inbox/Clues`
- Rulings: `1-Campaign/DM/Operations Inbox/Rulings`
- Player knowledge: `1-Campaign/Party/Knowledge`
- Research: `1-Campaign/DM/Operations Inbox/Research`
- Corrections: `1-Campaign/DM/Operations Inbox/Corrections`

Session rooms are direct children of `1-Campaign/Sessions`. Quick capture appends to `1-Campaign/DM/Operations Inbox/Quick Capture.md`.

## Security boundaries

- Styling is presentation, not access control. Maintain player-safe material separately.
- Note content cannot define executables, paths, URLs, or command arguments.
- `ad-statblock` content is passed through a narrow sanitizer before Obsidian's Markdown renderer: raw HTML, embeds, fenced processors, Dataview expressions, and Meta Bind `BUTTON`/`INPUT`/`VIEW` directives are displayed rather than invoked.
- Reviewed mutations execute from the serialized preview snapshot plus one captured target baseline per operation. Execute stays disabled until every kind/hash/size/mtime baseline is captured and shown. All targets and parent paths are preflighted before mutation, and append content is checked again inside `Vault.process`. Existing create targets, changed targets, and missing append targets without a reviewed initializer fail closed.
- Evidence-gated proposals bind each read source to the displayed SHA-256/size/mtime snapshot. Every source must remain the same existing file through the final pre-write recheck.
- The plugin blocks direct writes to Current State, Canon Decisions Log, Campaign State Ledger, and Current Leads.
- The append rollback before-state is captured inside Obsidian's atomic `Vault.process`. Rollback restores only exact expected append results and trashes only created files whose current content exactly matches the reviewed write; concurrent changes are left intact and reported.
- External application actions delegate only to compiled Obsidian command IDs or a validated loopback URL.
- The plugin sends no telemetry and performs no background network requests.
- Settings and capped recent results are stored in the plugin's local `data.json`; that file is intentionally excluded from git.
- Do not commit REST API keys, credentials, or private campaign output.

## Development

Requirements: Node.js 20 or newer.

```bash
npm install
npm run verify
```

The repository keeps the production bundle checked in because BRAT installs release assets rather than building TypeScript on the client. A dependency-free release check is also available:

```bash
node scripts/verify-release.mjs
```

CI installs from `package-lock.json` with `npm ci`, runs the full verifier, and fails if the committed `main.js` differs from the source build.

`feature-contract.json` mirrors the canonical `NAV-01` through `GOV-10` taxonomy and exposes owner, status, evidence, test, and gate fields for vault integration checks. The vault's `9-System/Docs/Vault Operations/upgrade-features.json` remains the overall authority.

## Release contract

For every release:

1. Set the same version in `manifest.json`, `package.json`, and `versions.json`.
2. Build and run `npm run verify`.
3. Tag the commit with the exact version, without a `v` prefix.
4. Attach `manifest.json`, `main.js`, and `styles.css` to the GitHub release.

## License

[MIT](LICENSE)
