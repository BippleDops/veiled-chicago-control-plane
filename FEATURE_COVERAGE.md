# 50-Feature Delivery Map

This plugin map mirrors the canonical vault taxonomy at `9-System/Docs/Vault Operations/upgrade-features.json`. Stable IDs are machine-readable in `feature-contract.json`; the vault contract remains authoritative for overall ownership. A policy or button is not counted as an operating external service.

Status vocabulary:

- **Plugin delivered** — executable behavior exists in this repository and is included in the BRAT bundle.
- **Vault/theme companion** — implemented or configured in the Veiled Chicago vault/theme, not duplicated here.
- **Guarded contract** — the plugin exposes the safe boundary or receipt, but an external system must still perform the work.
- **Future implementation** — intentionally not represented as complete.

| # | Stable ID | Upgrade | Status | Release surface |
| ---: | --- | --- | --- | --- |
| 1 | NAV-01 | Repair current navigation failures | Vault/theme companion | `run-navigation-audit` exposes the audited vault check; content repairs stay outside the plugin. |
| 2 | NAV-02 | Semantic freshness auditor | Vault/theme companion | Audit results appear in Recent automation; audit logic remains the vault script. |
| 3 | NAV-03 | Dynamic Live Edge Router | Plugin delivered | `open-live-edge-router`; shows explicit Current State and plugin-local active room without filename inference. |
| 4 | NAV-04 | Stable front doors | Vault/theme companion | Existing stable-note commands remain fixed and versioned. |
| 5 | NAV-05 | Named operating workspaces | Vault/theme companion | Fixed native Workspaces open/save adapters are delivered; workspace definitions remain vault-owned. |
| 6 | NAV-06 | Fail-closed Player Display | Guarded contract | `player-safe` context excludes DM/future scopes; styling is explicitly not access control. A full workspace-leaf gate remains external. |
| 7 | NAV-07 | Singleton tabs and layout preservation | Plugin delivered | Note actions reveal existing leaves; the validated startup surface reuses one Control Plane leaf or opens one guarded tab. |
| 8 | NAV-08 | Authority strip and semantic breadcrumbs | Vault/theme companion | Automatic `data-vcg-*` attributes and profile classes provide the theme contract. |
| 9 | NAV-09 | Faceted entity navigator | Plugin delivered | Lazy fixed-root index uses cached frontmatter, debounced search, associated labels/results, type/status facets, and a hard 100-result render cap without body reads. |
| 10 | NAV-10 | Rebuild Chicago Bases suite | Vault/theme companion | Fixed Sessions, NPC, Location, and Operational Review Queue actions are delivered; Base schemas and data remain vault-owned. |
| 11 | CAP-01 | Schema and template registry | Plugin delivered | `MANAGED_NOTE_SCHEMAS` is the typed creation contract. |
| 12 | CAP-02 | Guided New Note wizard | Plugin delivered | `create-managed-note` two-step wizard and exact proposal preview. |
| 13 | CAP-03 | Typed entity forms | Plugin delivered | NPC, location, faction, item, clue, ruling, player knowledge, research, and correction schemas. |
| 14 | CAP-04 | Canonical owner and link picker | Future implementation | No automatic relationship or reciprocal-link writes are claimed. |
| 15 | CAP-05 | Daily operational cockpit | Vault/theme companion | Core Daily Notes configuration belongs to the vault. |
| 16 | CAP-06 | Fixed Obsidian URI captures | Guarded contract | Every action compiles typed `allowedSources`; protocol and dispatch guards fail closed, while bounded Markdown controls expose navigation-only actions and no workflows, commands, integrations, external URLs, recording, processes, or scripts. |
| 17 | CAP-07 | Allowlisted Obsidian CLI adapter | Guarded contract | Existing fixed Python wrapper remains allowlisted; arbitrary CLI text is not accepted. |
| 18 | CAP-08 | Research capture with Web Clipper | Vault/theme companion | `research` schema supplies a safe destination; browser capture configuration remains in the vault. |
| 19 | CAP-09 | Media and document intake | Guarded contract | `propose-local-transcription` accepts an explicit vault audio selection and consent, then creates a receipt only. |
| 20 | CAP-10 | Transactional creation engine | Plugin delivered | Preview-bound kind/hash/size/mtime baselines, all-target preflight, atomic append recheck, safe rollback, and local receipts. |
| 21 | SESSION-01 | Active session-room registry | Plugin delivered | Native fuzzy chooser lists only existing direct-child session folders; selection and every later use revalidate the exact `TFolder`, while plugin-local state never writes `next_session`. |
| 22 | SESSION-02 | Session workspace scaffolder | Plugin delivered | `scaffold-active-session-room` previews only missing files from the seven-note draft/future contract; existing files remain untouched. |
| 23 | SESSION-03 | Preflight wizard | Plugin delivered | Scaffolded Preflight checklist and `open-session-preflight`. |
| 24 | SESSION-04 | Verbatim declaration capture | Plugin delivered | `capture-player-declaration` appends immutable evidence markers and wording; multiple declarations require one separate standalone selector before RUN generation. |
| 25 | SESSION-05 | Bounded session context pack | Guarded contract | `session-live` profile defines roots/scopes; retrieval implementation must enforce it before model context. |
| 26 | SESSION-06 | Evidence-gated RUN generator | Plugin delivered | `generate-session-run` always binds Current State, additionally binds Decision Intake for player authority, requires one standalone `vcg:selection` marker when multiple declarations exist, and requires DM authority fields to match the same Current State snapshot; zero, invalid, ambiguous, incomplete, or changed evidence fails closed. |
| 27 | SESSION-07 | Readiness board and table launcher | Plugin delivered | Fail-closed Readiness Board and `open-session-readiness`; workspace launch remains vault-owned. |
| 28 | SESSION-08 | Append-only live event capture | Plugin delivered | `capture-live-event` records actor, event, status, audience, witnesses, timestamp, and event ID. |
| 29 | SESSION-09 | Consent-aware audio and transcript pipeline | Guarded contract | Confirmed native Audio Recorder start plus explicit audio picker, consent gate, retention field, and fixed-runtime receipt; no background or implicit transcription. |
| 30 | SESSION-10 | Candidate review and atomic closeout | Guarded contract | Promotion Review enforces the human order; direct canonical-owner mutations are blocked in this release. |
| 31 | AI-01 | One AI gateway | Future implementation | No provider network client is bundled or silently activated. |
| 32 | AI-02 | Secret and egress management | Guarded contract | No credentials are collected; all profiles default local and canon writes are false. |
| 33 | AI-03 | Guarded context configurations | Guarded contract | Six compiled configurations describe intended audience, scope, roots, cloud, and canon-write policy; provider-side enforcement is not verified. |
| 34 | AI-04 | Versioned hybrid retrieval | Future implementation | Requires an indexed retrieval service and evaluation corpus. |
| 35 | AI-05 | Semantic related-note sidecar | Future implementation | No similarity result is presented as evidence. |
| 36 | AI-06 | Citation-first Ask Vault | Future implementation | Requires the retrieval gateway in feature 34. |
| 37 | AI-07 | Canon contradiction detector | Vault/theme companion | `run-live-edge-audit` and strict audit receipts expose existing evidence-backed checks. |
| 38 | AI-08 | Metadata, alias, and link suggestion queue | Guarded contract | Operations Inbox schemas provide candidate destinations; no automatic repair is claimed. |
| 39 | AI-09 | Role-specific copilots | Future implementation | Requires citation-first retrieval and the evaluation gate. |
| 40 | AI-10 | Provenance, trace, and evaluation system | Guarded contract | Reviewed mutation IDs and receipts are delivered; model/prompt evaluation remains external. |
| 41 | GOV-01 | Observe / Propose / Execute broker | Plugin delivered | Compiled policy, proposal-only AI boundary, exact preview, and explicit execute confirmation. |
| 42 | GOV-02 | Hardened REST/MCP bridge | Guarded contract | The plugin does not manage REST credentials or listeners; deployment hardening remains an external prerequisite. |
| 43 | GOV-03 | Local-model security perimeter | Guarded contract | Health UI documents loopback-only contract without background probing or network egress. |
| 44 | GOV-04 | Physical and desktop command surfaces | Guarded contract | Fifty-six stable Obsidian command IDs, query-ranked native command search, grouped route controls, and fixed native/retrieval adapters are available for reviewed desktop bindings. |
| 45 | GOV-05 | Calendar and task bridge | Future implementation | Requires a separately reviewed n8n workflow and constrained endpoint. |
| 46 | GOV-06 | D&D Beyond provenance snapshots | Future implementation | No undocumented API or scraping behavior is bundled. |
| 47 | GOV-07 | Map, combat, dice, and handout adapters | Plugin delivered | Fixed combat/dice commands, core Web Viewer leaves with two fixed HTTPS targets, loopback-only map URL validation, and allowlisted map lifecycle actions. |
| 48 | GOV-08 | Controlled AI media queue | Future implementation | Requires an external ComfyUI/Piper worker and provenance store. |
| 49 | GOV-09 | Player-safe release and export service | Future implementation | Requires feature 6's complete workspace/content gate and explicit recipient review. |
| 50 | GOV-10 | Operations, rollback, and health dashboard | Plugin delivered | Fixed interface-capability ownership/status, workflow gates, recent automation, mutation receipts, and rollback behavior. |

## Non-negotiable invariants

1. `next_session` is read only when Current State explicitly supplies a positive integer. The plugin never derives it from folders or filenames.
2. The active room is explicitly selected and stored only in plugin settings. Its display name must exactly match its folder basename.
3. Generated notes are `canon_status: draft` and `retrieval_scope: future`.
4. Current State, Canon Decisions Log, Campaign State Ledger, and Current Leads are blocked mutation targets.
5. AI context configurations have `mayWriteCanon: false`; they are plugin guardrails, not verified provider enforcement. No model provider or credential is bundled.
6. A reviewed proposal executes from the serialized preview snapshot plus one displayed target baseline per operation. Missing/create state and existing-file hashes are rechecked before mutation; append hashes are checked again inside `Vault.process`.
7. Multi-file failure atomically restores only unchanged appends and trashes only created files whose content still exactly matches the reviewed write. Concurrently changed data is left intact and reported.
8. RUN generation accepts exactly one validated selection-evidence authority. A DM-selected live handoff is cited and labelled separately from player wording; neither path may be inferred from filenames or prose, and its source read set must remain byte-identical from review through the pre-write check.
