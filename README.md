# Veiled Chicago Control Plane

A desktop-only Obsidian plugin that turns the Veiled Chicago campaign vault into an application-like control surface. It provides a semantic HTML dashboard, automatic workflow profiles, Markdown control blocks, native Obsidian commands, and a deliberately narrow local-automation bridge.

## Install with BRAT

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat).
2. Open **Settings → BRAT → Add Beta Plugin**.
3. Enter `BippleDops/veiled-chicago-control-plane` (or the full repository URL).
4. Choose the latest release and enable **Veiled Chicago Control Plane**.
5. Use the radar ribbon icon or run **Veiled Chicago Control Plane: Control Plane** from the command palette.

BRAT installs the release assets `manifest.json`, `main.js`, and `styles.css`. Release tag `1.0.0` matches the plugin version exactly.

## Manual install

Download `manifest.json`, `main.js`, and `styles.css` from the latest release into:

```text
<vault>/.obsidian/plugins/veiled-chicago-control-plane/
```

Reload Obsidian, enable the plugin under **Community plugins**, and open the control plane from the ribbon or command palette.

## What it does

- Builds a responsive, semantic HTML campaign dashboard inside Obsidian.
- Registers 30 fixed navigation, installed-plugin, integration, and local-script actions.
- Renders allowlisted `vcg-control` Markdown blocks; note content cannot supply commands, paths, arguments, or shell fragments.
- Applies workflow profiles (`vcg-dashboard`, `vcg-session`, `vcg-dossier`, `vcg-data-deck`, `vcg-map-room`, and `vcg-handout`) from the active note's path and frontmatter without editing the note.
- Integrates with installed Obsidian commands such as Dice Roller, Initiative Tracker, Custom Frames, Lean Terminal, Meta Bind, and Local REST API when those plugins are present.
- Exposes navigation through the `obsidian://vc-control?action=<allowlisted-id>` protocol.

The dashboard resolves campaign state from `1-DM Toolkit/Current State of Affairs.md`. It does not infer or choose a next session when `next_session` is null.

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

## Optional local automation companion

Navigation, HTML surfaces, URI actions, and integrations work from the BRAT installation alone. Process actions additionally require the companion wrapper and the corresponding vault audit scripts.

Copy [`companion/vcg_control.py`](companion/vcg_control.py) to this path inside the vault:

```text
<vault>/scripts/vcg_control.py
```

The plugin invokes only:

```text
python3 scripts/vcg_control.py run <fixed-action-id> --json
```

No shell is involved. The wrapper maintains a second allowlist, accepts no arbitrary command or path, redacts the vault root from stored output, and refuses to stop a map process it cannot prove it owns. The wrapper currently requires macOS/POSIX process tools; other desktop platforms retain the non-process features.

Local automation is disabled by default. Start/stop actions require confirmation by default, and protocol-triggered scripts remain separately disabled unless explicitly enabled.

## Security boundaries

- Styling is presentation, not access control. Maintain player-safe material separately.
- Note content cannot define executables, paths, URLs, or command arguments.
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

## Release contract

For every release:

1. Set the same version in `manifest.json`, `package.json`, and `versions.json`.
2. Build and run `npm run verify`.
3. Tag the commit with the exact version, without a `v` prefix.
4. Attach `manifest.json`, `main.js`, and `styles.css` to the GitHub release.

## License

[MIT](LICENSE)
