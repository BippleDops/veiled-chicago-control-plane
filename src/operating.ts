import { createHash } from "node:crypto";

import { MANAGED_NOTE_ROOTS, PROTECTED_CANON_PATHS, VAULT_PATHS } from "./paths";

export type CapabilityPhase = "observe" | "propose" | "execute";

export type ContextProfileId =
  | "player-safe"
  | "session-live"
  | "canon-read"
  | "conditional-prep"
  | "research-inbox"
  | "private-transcript";

export interface ContextProfile {
  id: ContextProfileId;
  title: string;
  description: string;
  audiences: readonly ("dm" | "players" | "both")[];
  retrievalScopes: readonly string[];
  roots: readonly string[];
  mayUseCloud: boolean;
  mayWriteCanon: false;
}

export const CONTEXT_PROFILES: readonly ContextProfile[] = [
  {
    id: "player-safe",
    title: "Player-safe",
    description: "Player-visible material only; DM and future material are excluded before retrieval.",
    audiences: ["players", "both"],
    retrievalScopes: ["live", "reference", "history"],
    roots: [VAULT_PATHS.partyRoot, VAULT_PATHS.handoutsRoot, VAULT_PATHS.worldRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "session-live",
    title: "Session live",
    description: "Latest played evidence, current choices, active room, and approved rules only.",
    audiences: ["dm", "both"],
    retrievalScopes: ["live", "reference"],
    roots: [VAULT_PATHS.sessionsRoot, VAULT_PATHS.partyRoot, VAULT_PATHS.dmRoot, VAULT_PATHS.mechanicsRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "canon-read",
    title: "Canon read",
    description: "Read-only canonical owners and played evidence with source citations.",
    audiences: ["dm", "both", "players"],
    retrievalScopes: ["live", "reference", "history"],
    roots: [
      VAULT_PATHS.sessionsRoot,
      VAULT_PATHS.partyRoot,
      VAULT_PATHS.dmRoot,
      VAULT_PATHS.worldRoot,
      VAULT_PATHS.mechanicsRoot
    ],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "conditional-prep",
    title: "Conditional prep",
    description: "Draft, future, and source-library material isolated from played truth.",
    audiences: ["dm"],
    retrievalScopes: ["future", "source-library"],
    roots: [VAULT_PATHS.sessionsRoot, VAULT_PATHS.modulesRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "research-inbox",
    title: "Research inbox",
    description: "Untrusted captured research; citations and prompt-injection boundaries remain visible.",
    audiences: ["dm"],
    retrievalScopes: ["reference", "source-library"],
    roots: [VAULT_PATHS.operationsInboxRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  },
  {
    id: "private-transcript",
    title: "Private transcript",
    description: "Consent-bound raw session evidence; local processing only.",
    audiences: ["dm"],
    retrievalScopes: ["audit"],
    roots: [VAULT_PATHS.sessionsRoot],
    mayUseCloud: false,
    mayWriteCanon: false
  }
] as const;

export const CAPABILITY_POLICY = {
  observe: "Read current state and policy-filtered evidence without changing the vault.",
  propose: "Render exact file operations, evidence, and policy checks for human review.",
  execute: "Apply only the reviewed proposal; never expose arbitrary shell, paths, or commands to a model.",
  aiWriteMode: "proposal-only",
  canonPromotion: "human-only"
} as const;

export interface ManagedField {
  id: string;
  label: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export interface ManagedNoteSchema {
  id: string;
  title: string;
  description: string;
  folder: string;
  tag: string;
  audience: "dm" | "players" | "both";
  fields: readonly ManagedField[];
  bodyHeading: string;
}

const CAMPAIGN_LINK = "[[a-tale-of-two-cities|A Tale of Two Cities]]";

export const MANAGED_NOTE_SCHEMAS: readonly ManagedNoteSchema[] = [
  {
    id: "npc",
    title: "NPC dossier",
    description: "Draft NPC candidate with identity and relationship prompts.",
    folder: MANAGED_NOTE_ROOTS.npc,
    tag: "Category/NPC",
    audience: "dm",
    fields: [
      { id: "char_race", label: "Ancestry / nature", required: true, defaultValue: "Unknown" },
      { id: "char_status", label: "Status", required: true, defaultValue: "Unknown" },
      { id: "faction", label: "Faction", required: false }
    ],
    bodyHeading: "Dossier"
  },
  {
    id: "location",
    title: "Location",
    description: "Draft place with district, access, and evidence prompts.",
    folder: MANAGED_NOTE_ROOTS.location,
    tag: "Category/Location",
    audience: "dm",
    fields: [
      { id: "district", label: "District / area", required: false },
      { id: "location_status", label: "Status", required: false, defaultValue: "Unknown" }
    ],
    bodyHeading: "Location brief"
  },
  {
    id: "faction",
    title: "Faction",
    description: "Draft faction with pressure, wants, and relationships.",
    folder: MANAGED_NOTE_ROOTS.faction,
    tag: "Category/Faction",
    audience: "dm",
    fields: [{ id: "faction_status", label: "Status", required: false, defaultValue: "Unknown" }],
    bodyHeading: "Faction brief"
  },
  {
    id: "item",
    title: "Item",
    description: "Draft item with provenance and ownership boundaries.",
    folder: MANAGED_NOTE_ROOTS.item,
    tag: "Category/Item",
    audience: "dm",
    fields: [{ id: "item_type", label: "Item type", required: true, defaultValue: "Unknown" }],
    bodyHeading: "Item brief"
  },
  {
    id: "clue",
    title: "Clue candidate",
    description: "Unpromoted clue with source and reveal-state fields.",
    folder: MANAGED_NOTE_ROOTS.clue,
    tag: "Category/Clue",
    audience: "dm",
    fields: [
      { id: "evidence_source", label: "Evidence source", required: true },
      { id: "reveal_state", label: "Reveal state", required: false, defaultValue: "withheld" }
    ],
    bodyHeading: "Clue candidate"
  },
  {
    id: "ruling",
    title: "Ruling candidate",
    description: "Rules question or proposed ruling awaiting source review.",
    folder: MANAGED_NOTE_ROOTS.ruling,
    tag: "Category/Ruling",
    audience: "dm",
    fields: [
      { id: "rules_source", label: "Rules source", required: false },
      { id: "rules_edition", label: "Edition / baseline", required: false }
    ],
    bodyHeading: "Ruling candidate"
  },
  {
    id: "player-knowledge",
    title: "Player knowledge",
    description: "Player-visible knowledge candidate tied to a PC.",
    folder: MANAGED_NOTE_ROOTS.playerKnowledge,
    tag: "Category/Player-Knowledge",
    audience: "players",
    fields: [{ id: "pc", label: "PC", required: true }],
    bodyHeading: "Known information"
  },
  {
    id: "research",
    title: "Research source",
    description: "Untrusted research capture with provenance fields.",
    folder: MANAGED_NOTE_ROOTS.research,
    tag: "Category/Research",
    audience: "dm",
    fields: [
      { id: "source_url", label: "Source URL", required: false },
      { id: "source_author", label: "Author", required: false },
      { id: "retrieved_on", label: "Retrieved on", required: false }
    ],
    bodyHeading: "Research notes"
  },
  {
    id: "correction",
    title: "Continuity correction",
    description: "Append-only correction proposal; never silently rewrites played evidence.",
    folder: MANAGED_NOTE_ROOTS.correction,
    tag: "Category/Correction",
    audience: "dm",
    fields: [
      { id: "evidence_source", label: "Evidence source", required: true },
      { id: "affected_owner", label: "Affected canonical owner", required: false }
    ],
    bodyHeading: "Correction proposal"
  }
] as const;

export type MutationOperation =
  | { kind: "create"; path: string; contents: string }
  | { kind: "append"; path: string; contents: string; initialContents?: string };

export type OperationTargetKind = "missing" | "file" | "folder";

export interface ProposalEvidenceSource {
  path: string;
  contentHash: string;
}

export interface MutationProposal {
  id: string;
  title: string;
  summary: string;
  phase: "propose";
  canonImpact: "none" | "candidate-only";
  operations: readonly MutationOperation[];
  evidenceSources?: readonly ProposalEvidenceSource[];
}

export interface ReviewedTargetBaseline {
  path: string;
  kind: OperationTargetKind;
  contentHash: string | null;
  mtime: number | null;
  size: number | null;
}

export interface ReviewedMutationProposal extends MutationProposal {
  targetBaselines: readonly ReviewedTargetBaseline[];
  evidenceBaselines?: readonly ReviewedTargetBaseline[];
}

export interface ManagedNoteInput {
  schemaId: string;
  title: string;
  fields: Readonly<Record<string, string>>;
  createdDate: string;
  proposalId: string;
}

export interface SessionRoomInput {
  roomPath: string;
  displayName: string;
  createdDate: string;
  proposalId: string;
}

export const DM_LIVE_HANDOFF_DEPLOYMENT_MODE = "dm-selected-from-live-handoff" as const;

export interface PlayerDeclarationSelectionEvidence {
  authority: "player-declaration";
  sourcePath: string;
  contents: string;
}

export interface DmLiveHandoffSelectionEvidence {
  authority: "dm-selected-from-live-handoff";
  sourcePath: string;
  contents: string;
  deploymentMode: unknown;
  selectedLead: unknown;
}

export type RunSelectionEvidence = PlayerDeclarationSelectionEvidence | DmLiveHandoffSelectionEvidence;

export interface CurrentStateRunEvidence {
  sourcePath: string;
  contents: string;
}

export type ResolvedRunSelectionEvidence =
  | {
      authority: "player-declaration";
      sourcePath: string;
      sourceContentHash: string;
      declarationId: string;
      selectionMarkerId: string | null;
    }
  | {
      authority: "dm-selected-from-live-handoff";
      sourcePath: string;
      sourceContentHash: string;
      selectedLead: string;
    };

export interface ControlResult {
  action: string;
  ok: boolean;
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
}

const PROTECTED_CANON_PATH_SET = new Set<string>(PROTECTED_CANON_PATHS.map((path) => path.toLocaleLowerCase("en-US")));
const MANAGED_WRITE_ROOTS = ["1-Campaign", "2-World", "3-Library", "9-System"] as const;
const MANAGED_WRITE_EXTENSIONS = new Set(["md"]);

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function inlineText(value: string, label: string): string {
  const normalized = value.replace(/\r?\n/g, " ").trim();
  if (/\p{Cc}/u.test(normalized)) throw new Error(`${label} contains unsupported control characters.`);
  return normalized;
}

type FenceContainerSegment = { kind: "quote" } | { kind: "indent"; columns: number };

interface OpenFence {
  character: "`" | "~";
  length: number;
  containers: readonly FenceContainerSegment[];
}

function visualColumns(value: string): number {
  let columns = 0;
  for (const character of value) columns = character === "\t" ? columns + (4 - (columns % 4)) : columns + 1;
  return columns;
}

function consumeExactIndent(value: string, requiredColumns: number): string | null {
  let columns = 0;
  let index = 0;
  while (index < value.length && columns < requiredColumns) {
    const character = value[index];
    if (character !== " " && character !== "\t") return null;
    columns = character === "\t" ? columns + (4 - (columns % 4)) : columns + 1;
    index += 1;
  }
  return columns === requiredColumns ? value.slice(index) : null;
}

function fenceOpening(line: string): OpenFence | null {
  let remainder = line;
  const containers: FenceContainerSegment[] = [];
  while (true) {
    const quote = remainder.match(/^ {0,3}>[ \t]?/);
    if (quote?.[0]) {
      containers.push({ kind: "quote" });
      remainder = remainder.slice(quote[0].length);
      continue;
    }
    const list = remainder.match(/^ {0,3}(?:[-+*]|\d{1,9}[.)])(?:[ \t]+|$)/);
    if (list?.[0]) {
      containers.push({ kind: "indent", columns: visualColumns(list[0]) });
      remainder = remainder.slice(list[0].length);
      continue;
    }
    break;
  }
  const opening = remainder.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  const run = opening?.[1];
  const info = opening?.[2] ?? "";
  if (!run || (run[0] === "`" && info.includes("`"))) return null;
  return { character: run[0] as "`" | "~", length: run.length, containers };
}

function fenceClosingLine(line: string, fence: OpenFence): string | null {
  let remainder = line;
  for (const container of fence.containers) {
    if (container.kind === "quote") {
      const quote = remainder.match(/^ {0,3}>[ \t]?/);
      if (!quote?.[0]) return null;
      remainder = remainder.slice(quote[0].length);
      continue;
    }
    const consumed = consumeExactIndent(remainder, container.columns);
    if (consumed === null) return null;
    remainder = consumed;
  }
  return remainder;
}

function evidenceMarkerIds(contents: string, kind: "declaration" | "selection"): string[] {
  const ids: string[] = [];
  let fence: OpenFence | null = null;
  for (const line of contents.split(/\r?\n/)) {
    if (fence) {
      const candidate = fenceClosingLine(line, fence);
      const closing = candidate?.match(/^ {0,3}(`{3,}|~{3,})[ \t]*$/);
      const run = closing?.[1];
      if (run && run[0] === fence.character && run.length >= fence.length) fence = null;
      continue;
    }
    const opening = fenceOpening(line);
    if (opening) {
      fence = opening;
      continue;
    }
    const marker = line.match(
      kind === "declaration"
        ? /^<!--\s*vcg:declaration\s+([A-Za-z0-9][A-Za-z0-9._:-]{0,127})\s*-->[ \t]*$/
        : /^<!--\s*vcg:selection\s+([A-Za-z0-9][A-Za-z0-9._:-]{0,127})\s*-->[ \t]*$/
    );
    if (marker?.[1]) ids.push(marker[1]);
  }
  return ids;
}

function declarationMarkerIds(contents: string): string[] {
  return evidenceMarkerIds(contents, "declaration");
}

function selectionMarkerIds(contents: string): string[] {
  return evidenceMarkerIds(contents, "selection");
}

function selectedLeadIdentifier(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("DM live-handoff selection requires selected_lead to be one scalar identifier.");
  }
  const selectedLead = value.trim();
  if (!/^[a-z0-9][a-z0-9._:-]{0,159}$/i.test(selectedLead)) {
    throw new Error("DM live-handoff selection requires selected_lead to be one safe scalar identifier.");
  }
  return selectedLead;
}

function strictFrontmatterScalar(contents: string, key: string): string | null {
  const lines = contents.replace(/^\uFEFF/, "").split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  const closingIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (closingIndex < 0) return null;
  const values = lines.slice(1, closingIndex + 1).flatMap((line) => {
    const separator = line.indexOf(":");
    if (separator < 0 || line.slice(0, separator).trim() !== key || /^\s/.test(line)) return [];
    const raw = line.slice(separator + 1).trim();
    if (/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(raw)) return [raw];
    if (raw.startsWith('"') && raw.endsWith('"')) {
      try {
        const parsed: unknown = JSON.parse(raw);
        return typeof parsed === "string" ? [parsed] : [];
      } catch {
        return [];
      }
    }
    if (raw.startsWith("'") && raw.endsWith("'")) return [raw.slice(1, -1).replaceAll("''", "'")];
    return [];
  });
  return values.length === 1 ? values[0] ?? null : null;
}

function resolveCurrentStateRunEvidence(evidence: CurrentStateRunEvidence): {
  sourcePath: string;
  sourceContentHash: string;
  latestPlayedLabel: string;
} {
  const sourcePath = normalizeVaultPath(evidence.sourcePath);
  if (sourcePath !== evidence.sourcePath || sourcePath !== VAULT_PATHS.currentState) {
    throw new Error(`RUN Current State evidence must come from ${VAULT_PATHS.currentState}.`);
  }
  if (!evidence.contents.trim()) throw new Error("RUN generation requires a non-empty Current State evidence snapshot.");
  const latestPlayedRecord = strictFrontmatterScalar(evidence.contents, "last_played_record");
  const match = latestPlayedRecord?.match(/^\[\[([^|\]#]+)(?:#[^|\]]*)?(?:\|([^\]]+))?\]\]$/);
  const target = match?.[1]?.trim();
  const label = match?.[2]?.trim() || target?.split("/").pop()?.replace(/\.md$/i, "").trim();
  if (!target || !label) {
    throw new Error("RUN generation requires one exact last_played_record wikilink in Current State.");
  }
  return { sourcePath, sourceContentHash: contentHash(evidence.contents), latestPlayedLabel: label };
}

export function normalizeNoteTitle(value: string): string {
  const title = inlineText(value, "Title");
  if (!title || !slugify(title)) throw new Error("A title containing letters or numbers is required.");
  if (title.length > 160) throw new Error("Title must be 160 characters or fewer.");
  return title;
}

function frontmatter(entries: Readonly<Record<string, string | readonly string[]>>): string {
  const lines = ["---"];
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) lines.push(`  - ${yamlString(item)}`);
      continue;
    }
    lines.push(`${key}: ${yamlString(value as string)}`);
  }
  lines.push("---", "");
  return lines.join("\n");
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function normalizeVaultPath(value: string): string {
  const normalized = value.trim().replaceAll("\\", "/").replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
  if (!normalized || normalized.includes("\0")) throw new Error("A non-empty vault-relative path is required.");
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("Vault paths cannot contain empty, current-directory, or parent-directory segments.");
  }
  if (segments.some((segment) => segment.toLocaleLowerCase("en-US") === ".obsidian")) {
    throw new Error("Managed workflows cannot write inside .obsidian.");
  }
  return normalized;
}

export function validateManagedWritePath(value: string): string {
  const path = normalizeVaultPath(value);
  const root = path.split("/", 1)[0];
  if (!root || !MANAGED_WRITE_ROOTS.includes(root as (typeof MANAGED_WRITE_ROOTS)[number])) {
    throw new Error(`Managed writes must remain below ${MANAGED_WRITE_ROOTS.join(", ")}.`);
  }
  const filename = path.split("/").pop() ?? "";
  const extension = filename.includes(".") ? filename.split(".").pop()?.toLocaleLowerCase("en-US") ?? "" : "";
  if (!MANAGED_WRITE_EXTENSIONS.has(extension)) {
    throw new Error(`Managed writes require an allowlisted file extension: .${[...MANAGED_WRITE_EXTENSIONS].join(", .")}.`);
  }
  return path;
}

export function normalizeSessionRoomPath(value: string): string {
  const path = normalizeVaultPath(value);
  if (!path.startsWith(`${VAULT_PATHS.sessionsRoot}/`)) {
    throw new Error(`An active session room must live below ${VAULT_PATHS.sessionsRoot}/.`);
  }
  const relative = path.slice(VAULT_PATHS.sessionsRoot.length + 1);
  const segments = relative.toLowerCase().split("/");
  if (segments.some((segment) => segment === "_future-planning" || segment === "_archive")) {
    throw new Error("An archived or future-planning source packet cannot be selected as the active session room.");
  }
  if (relative.includes("/")) throw new Error("An active session room must be a direct child of the Sessions root.");
  return path;
}

export function normalizeSessionDisplayName(roomPathValue: string, value: string): string {
  const roomPath = normalizeSessionRoomPath(roomPathValue);
  const displayName = value.trim();
  if (!displayName || displayName === "." || displayName === ".." || /[/\\\u0000-\u001f\u007f]/.test(displayName)) {
    throw new Error("Session display name must be one safe filename stem.");
  }
  if (displayName.endsWith(".")) throw new Error("Session display name cannot end with a period.");
  const folderName = roomPath.split("/").pop();
  if (displayName !== folderName) {
    throw new Error(`Session display name must match the selected folder name exactly: ${folderName ?? "unknown"}`);
  }
  return displayName;
}

export function parseExplicitNextSession(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

export function validateControlResult(value: unknown, expectedAction: string): ControlResult {
  if (!value || typeof value !== "object") throw new Error("Control wrapper returned an invalid payload shape.");
  const result = value as Record<string, unknown>;
  if (result.action !== expectedAction) throw new Error("Control wrapper action does not match the requested action.");
  if (typeof result.ok !== "boolean" || typeof result.stdout !== "string" || typeof result.stderr !== "string") {
    throw new Error("Control wrapper returned invalid status or output fields.");
  }
  if (!Number.isInteger(result.exit_code) || !Number.isFinite(result.duration_ms) || Number(result.duration_ms) < 0) {
    throw new Error("Control wrapper returned invalid numeric fields.");
  }
  if (result.ok !== (result.exit_code === 0)) {
    throw new Error("Control wrapper success status conflicts with its exit code.");
  }
  if (!result.ok && !result.stdout.trim() && !result.stderr.trim()) {
    throw new Error("Control wrapper failure did not include an error detail.");
  }
  return result as unknown as ControlResult;
}

export function isProtectedCanonPath(value: string): boolean {
  return PROTECTED_CANON_PATH_SET.has(normalizeVaultPath(value).toLocaleLowerCase("en-US"));
}

export function operationTargetPrecondition(operation: MutationOperation): string {
  if (operation.kind === "create") return "Target must be missing at execution.";
  if (operation.initialContents !== undefined) {
    return "Target must be an existing file or remain missing for the reviewed initializer.";
  }
  return "Target must be an existing file at execution.";
}

export function contentMatchesExpected(current: string, expected: string): boolean {
  return current === expected;
}

export function contentHash(contents: string): string {
  return createHash("sha256").update(contents, "utf8").digest("hex");
}

export function buildTargetBaseline(
  pathValue: string,
  kind: OperationTargetKind,
  contents: string | null,
  mtime: number | null,
  size: number | null
): ReviewedTargetBaseline {
  const path = validateManagedWritePath(pathValue);
  if (kind === "file") {
    if (contents === null || !Number.isFinite(mtime) || Number(mtime) < 0 || !Number.isFinite(size) || Number(size) < 0) {
      throw new Error(`File baseline is incomplete: ${path}`);
    }
    return { path, kind, contentHash: contentHash(contents), mtime, size };
  }
  if (contents !== null || mtime !== null || size !== null) {
    throw new Error(`Non-file baseline cannot contain file metadata: ${path}`);
  }
  return { path, kind, contentHash: null, mtime: null, size: null };
}

export function targetMatchesBaseline(
  baseline: ReviewedTargetBaseline,
  kind: OperationTargetKind,
  contents: string | null,
  mtime: number | null,
  size: number | null
): boolean {
  if (baseline.kind !== kind) return false;
  if (kind !== "file") return contents === null && mtime === null && size === null;
  return (
    contents !== null &&
    baseline.contentHash === contentHash(contents) &&
    baseline.mtime === mtime &&
    baseline.size === size
  );
}

export function validateReviewedProposal(proposal: ReviewedMutationProposal): void {
  validateProposal(proposal);
  if (!Array.isArray(proposal.targetBaselines) || proposal.targetBaselines.length !== proposal.operations.length) {
    throw new Error("Every reviewed operation requires exactly one target baseline.");
  }
  proposal.operations.forEach((operation, index) => {
    const baseline = proposal.targetBaselines[index];
    if (!baseline || baseline.path !== operation.path) {
      throw new Error(`Reviewed target baseline does not match operation ${index + 1}.`);
    }
    if (baseline.kind !== "missing" && baseline.kind !== "file" && baseline.kind !== "folder") {
      throw new Error(`Reviewed target baseline has an invalid kind: ${operation.path}`);
    }
    if (baseline.kind === "file") {
      if (
        typeof baseline.contentHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(baseline.contentHash) ||
        !Number.isFinite(baseline.mtime) ||
        Number(baseline.mtime) < 0 ||
        !Number.isFinite(baseline.size) ||
        Number(baseline.size) < 0
      ) {
        throw new Error(`Reviewed file baseline is invalid: ${operation.path}`);
      }
    } else if (baseline.contentHash !== null || baseline.mtime !== null || baseline.size !== null) {
      throw new Error(`Reviewed non-file baseline contains file metadata: ${operation.path}`);
    }
    resolveOperationMode(operation, baseline.kind);
  });
  if (proposal.evidenceBaselines !== undefined && !Array.isArray(proposal.evidenceBaselines)) {
    throw new Error("Reviewed evidence baselines must be an array.");
  }
  const evidenceSources = proposal.evidenceSources ?? [];
  const evidenceBaselines = proposal.evidenceBaselines ?? [];
  if (evidenceBaselines.length !== evidenceSources.length) {
    throw new Error("Every proposal evidence source requires exactly one reviewed file baseline.");
  }
  evidenceSources.forEach((source, index) => {
    const baseline = evidenceBaselines[index];
    if (!baseline || baseline.path !== source.path) {
      throw new Error(`Reviewed evidence baseline does not match source ${index + 1}.`);
    }
    if (
      baseline.kind !== "file" ||
      typeof baseline.contentHash !== "string" ||
      !/^[a-f0-9]{64}$/.test(baseline.contentHash) ||
      !Number.isFinite(baseline.mtime) ||
      Number(baseline.mtime) < 0 ||
      !Number.isFinite(baseline.size) ||
      Number(baseline.size) < 0
    ) {
      throw new Error(`Reviewed evidence source must be an existing valid file: ${source.path}`);
    }
    if (baseline.contentHash !== source.contentHash) {
      throw new Error(`Evidence source changed before review baseline capture: ${source.path}`);
    }
  });
}

export function validateProposal(proposal: MutationProposal): void {
  if (!proposal || typeof proposal !== "object" || !Array.isArray(proposal.operations)) {
    throw new Error("A proposal object with file operations is required.");
  }
  if (typeof proposal.id !== "string" || typeof proposal.title !== "string" || typeof proposal.summary !== "string") {
    throw new Error("Proposal ID, title, and summary must be strings.");
  }
  if (!proposal.id.trim() || !proposal.title.trim()) throw new Error("A proposal requires an ID and title.");
  if (proposal.phase !== "propose") throw new Error("Only proposal-phase mutations can be reviewed.");
  if (proposal.canonImpact !== "none" && proposal.canonImpact !== "candidate-only") {
    throw new Error("Proposal has an invalid canon-impact classification.");
  }
  if (proposal.operations.length === 0 || proposal.operations.length > 25) {
    throw new Error("A proposal must contain between 1 and 25 file operations.");
  }
  const operationPaths = new Set<string>();
  for (const operation of proposal.operations) {
    if (!operation || typeof operation !== "object" || (operation.kind !== "create" && operation.kind !== "append")) {
      throw new Error("Proposal contains an invalid operation discriminant.");
    }
    if (typeof operation.path !== "string" || typeof operation.contents !== "string") {
      throw new Error("Proposal operation path and contents must be strings.");
    }
    if (operation.kind === "append" && operation.initialContents !== undefined && typeof operation.initialContents !== "string") {
      throw new Error(`Append initializer must be a string: ${operation.path}`);
    }
    if (operation.kind === "create" && "initialContents" in operation) {
      throw new Error(`Create operation cannot define append initialization: ${operation.path}`);
    }
    const path = validateManagedWritePath(operation.path);
    if (path !== operation.path) throw new Error(`Operation path must already be normalized: ${operation.path}`);
    if (isProtectedCanonPath(path)) throw new Error(`Direct canon mutation is blocked: ${path}`);
    if (!operation.contents.trim()) throw new Error(`Operation contents are empty: ${path}`);
    if (operation.kind === "append" && operation.initialContents !== undefined && !operation.initialContents.trim()) {
      throw new Error(`Append initialization contents are empty: ${path}`);
    }
    if (operationPaths.has(path)) throw new Error(`Duplicate operation target: ${path}`);
    operationPaths.add(path);
  }
  if (proposal.evidenceSources !== undefined && !Array.isArray(proposal.evidenceSources)) {
    throw new Error("Proposal evidence sources must be an array.");
  }
  const evidenceSources = proposal.evidenceSources ?? [];
  if (evidenceSources.length > 8) throw new Error("A proposal can bind at most 8 evidence sources.");
  const evidencePaths = new Set<string>();
  for (const source of evidenceSources) {
    if (!source || typeof source !== "object" || typeof source.path !== "string") {
      throw new Error("Proposal contains an invalid evidence source.");
    }
    const path = validateManagedWritePath(source.path);
    if (path !== source.path) throw new Error(`Evidence source path must already be normalized: ${source.path}`);
    if (typeof source.contentHash !== "string" || !/^[a-f0-9]{64}$/.test(source.contentHash)) {
      throw new Error(`Evidence source requires a SHA-256 content hash: ${path}`);
    }
    if (operationPaths.has(path)) throw new Error(`Evidence source cannot also be a mutation target: ${path}`);
    if (evidencePaths.has(path)) throw new Error(`Duplicate evidence source: ${path}`);
    evidencePaths.add(path);
  }
}

export function resolveOperationMode(
  operation: MutationOperation,
  target: OperationTargetKind
): "create" | "append" {
  if (target === "folder") throw new Error(`Operation target is a folder: ${operation.path}`);
  if (operation.kind === "create") {
    if (target !== "missing") throw new Error(`Create target already exists: ${operation.path}`);
    return "create";
  }
  if (target === "file") return "append";
  if (operation.initialContents !== undefined) return "create";
  throw new Error(`Append target is missing and has no reviewed initializer: ${operation.path}`);
}

export function buildManagedNoteProposal(input: ManagedNoteInput): MutationProposal {
  const schema = MANAGED_NOTE_SCHEMAS.find((candidate) => candidate.id === input.schemaId);
  if (!schema) throw new Error(`Unknown managed note schema: ${input.schemaId}`);
  const title = normalizeNoteTitle(input.title);
  const slug = slugify(title);
  const values: Record<string, string> = {};
  for (const field of schema.fields) {
    const value = (input.fields[field.id] ?? field.defaultValue ?? "").trim();
    if (field.required && !value) throw new Error(`${field.label} is required.`);
    if (value) values[field.id] = value;
  }
  const path = `${schema.folder}/${slug}.md`;
  const contents =
    frontmatter({
      title,
      obsidianUIMode: "preview",
      tags: [schema.tag, "homebrew/campaign/chicago", "vcg/managed"],
      NoteStatus: "🟡",
      created: input.createdDate,
      audience: schema.audience,
      campaign: CAMPAIGN_LINK,
      canon_status: "draft",
      retrieval_scope: "future",
      ...values
    }) +
    `# ${title}\n\n> [!warning] Candidate only\n> Created through the Control Plane. Review evidence and canonical ownership before promotion.\n\n## ${schema.bodyHeading}\n\n- <!-- add details -->\n\n## Evidence and provenance\n\n- **Source:** <!-- add source -->\n- **Confidence:** unknown\n- **Canonical owner reviewed:** no\n`;
  const proposal: MutationProposal = {
    id: input.proposalId,
    title: `Create ${schema.title}`,
    summary: `Create one schema-validated draft at ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "create", path, contents }]
  };
  validateProposal(proposal);
  return proposal;
}

function sessionFrontmatter(title: string, date: string, tags: readonly string[]): string {
  return frontmatter({
    title,
    obsidianUIMode: "preview",
    tags: [...tags, "homebrew/campaign/chicago", "vcg/managed"],
    NoteStatus: "🟡",
    created: date,
    audience: "dm",
    campaign: CAMPAIGN_LINK,
    canon_status: "draft",
    retrieval_scope: "future"
  });
}

export function buildSessionRoomProposal(input: SessionRoomInput): MutationProposal {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const file = (suffix: string): string => `${roomPath}/${displayName} ${suffix}.md`;
  const operations: MutationOperation[] = [
    {
      kind: "create",
      path: `${roomPath}/README.md`,
      contents:
        sessionFrontmatter(`${displayName} Room`, input.createdDate, ["Category/Session-Room"]) +
        `# ${displayName} Room\n\n> [!important] Authority boundary\n> This is an explicitly selected working room. It does not set \`next_session\`, establish chronology, or promote prep into played fact.\n\n## Operating sequence\n\n1. Establish exactly one supported selection authority: a verbatim player declaration or an explicit DM selection from the live handoff.\n2. Complete preflight and readiness checks.\n3. Generate a draft RUN only after the selection evidence validates.\n4. Capture live events as confirmed, contested, or unknown.\n5. Review candidates before any canonical owner changes.\n`
    },
    {
      kind: "create",
      path: file("Control Room"),
      contents:
        sessionFrontmatter(`${displayName} Control Room`, input.createdDate, ["Category/Session-Control"]) +
        `# ${displayName} Control Room\n\n\`\`\`vcg-control\ntitle: Session references\nsubtitle: Read-only navigation from note content\nactions: open-current-state, open-current-leads, open-session-preflight, open-session-readiness, open-promotion-review\ncompact: false\n\`\`\`\n\n> Execute capture, generation, recording, process, and proposal workflows only from the first-party Control Plane or Obsidian command palette. Markdown controls are navigation-only.\n\n## Current focus\n\n- **Selection evidence:** not validated\n- **Supported authorities:** verbatim player declaration or DM-selected live handoff\n- **RUN:** blocked until exactly one supported authority validates\n- **Canon promotion:** human review only\n`
    },
    {
      kind: "create",
      path: file("Decision Intake"),
      contents:
        sessionFrontmatter(`${displayName} Decision Intake`, input.createdDate, ["Category/Decision-Intake"]) +
        `# ${displayName} Decision Intake\n\n> Player wording is append-only evidence. Corrections add a new entry; they do not replace the original. A DM-selected live-handoff authority remains in Current State and is never copied here as player intent.\n\nWhen more than one standalone declaration marker exists, RUN generation requires exactly one separate standalone selection marker naming the chosen declaration ID. The marker shape is \`vcg:selection <declaration-id>\` inside an HTML comment; examples inside code fences do not count.\n\n## Declarations\n\n_No declaration recorded._\n`
    },
    {
      kind: "create",
      path: file("Table Log"),
      contents:
        sessionFrontmatter(`${displayName} Table Log`, input.createdDate, ["Category/Table-Log"]) +
        `# ${displayName} Table Log\n\n> Live events are evidence candidates, not automatic canon.\n\n## Event stream\n`
    },
    {
      kind: "create",
      path: file("Preflight"),
      contents:
        sessionFrontmatter(`${displayName} Preflight`, input.createdDate, ["Category/Session-Preflight"]) +
        `# ${displayName} Preflight\n\n- [ ] Date and expected duration recorded\n- [ ] Attendance and character-sheet freshness recorded\n- [ ] Rules baseline and rulings of record linked\n- [ ] Safety, accessibility, and recording consent confirmed\n- [ ] Player Display route checked for DM-only leaves\n- [ ] Map and abstract-zone fallback checked\n- [ ] Unknowns remain explicitly unknown\n`
    },
    {
      kind: "create",
      path: file("Readiness Board"),
      contents:
        sessionFrontmatter(`${displayName} Readiness Board`, input.createdDate, ["Category/Session-Readiness"]) +
        `# ${displayName} Readiness Board\n\n- [ ] Exactly one supported selection-evidence authority exists\n- [ ] Player path has a verbatim declaration marker and, when multiple declarations exist, exactly one standalone selection marker; or DM path has the exact Current State deployment mode and selected lead\n- [ ] Preflight is complete\n- [ ] Draft RUN cites its selection authority, Decision Intake when applicable, and Current State snapshot\n- [ ] Map / fallback contract is ready\n- [ ] Player-facing surfaces pass the audience gate\n- [ ] Recording consent and retention are documented\n- [ ] No unresolved blocker remains hidden\n`
    },
    {
      kind: "create",
      path: file("Promotion Review"),
      contents:
        sessionFrontmatter(`${displayName} Promotion Review`, input.createdDate, ["Category/Promotion-Review"]) +
        `# ${displayName} Promotion Review\n\n> [!danger] Human gate\n> Nothing in this note is played fact until a human reviews the cited evidence and explicitly promotes the candidate through the authority chain.\n\n## Candidate events\n\n| Event ID | Evidence | Status | Audience | Proposed owner | Decision |\n| --- | --- | --- | --- | --- | --- |\n\n## Required closeout order\n\n1. Played journal\n2. Campaign State Ledger\n3. Current State\n4. Entity owners and player knowledge\n5. Operational boards\n6. Audits and rollback receipt\n`
    }
  ];
  const proposal: MutationProposal = {
    id: input.proposalId,
    title: `Scaffold ${displayName}`,
    summary: `Create seven draft workflow notes in the explicitly supplied room ${roomPath}.`,
    phase: "propose",
    canonImpact: "none",
    operations
  };
  validateProposal(proposal);
  return proposal;
}

export function buildQuickCaptureProposal(input: {
  text: string;
  timestamp: string;
  proposalId: string;
}): MutationProposal {
  const text = input.text.trim();
  if (!text) throw new Error("Capture text is required.");
  const path = VAULT_PATHS.quickCapture;
  const contents = `\n- ${input.timestamp} <!-- vcg:capture ${input.proposalId} --> ${text.replace(/\r?\n/g, " ")}\n`;
  const initialContents =
    sessionFrontmatter("Quick Capture", input.timestamp.slice(0, 10), ["Category/Operations-Inbox"]) +
    "# Quick Capture\n\n> Timestamped candidates only. Review and route them through a typed workflow before promotion.\n";
  const proposal: MutationProposal = {
    id: input.proposalId,
    title: "Append quick capture",
    summary: `Append one timestamped candidate to ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "append", path, contents, initialContents }]
  };
  validateProposal(proposal);
  return proposal;
}

export function buildDeclarationProposal(input: {
  roomPath: string;
  displayName: string;
  wording: string;
  speaker: string;
  disposition: string;
  timestamp: string;
  proposalId: string;
}): MutationProposal {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const wording = input.wording.trim();
  const speaker = inlineText(input.speaker, "Speaker");
  if (!wording || !speaker) throw new Error("Player wording and speaker are required.");
  const path = `${roomPath}/${displayName} Decision Intake.md`;
  const contents =
    `\n### Declaration ${input.timestamp}\n\n` +
    `<!-- vcg:declaration ${input.proposalId} -->\n` +
    `- **Speaker / owner:** ${speaker}\n` +
    `- **Verbatim wording:** ${inlineText(wording, "Player wording")}\n` +
    `- **Disposition:** ${input.disposition.trim() || "unclassified"}\n` +
    `- **Status:** confirmed player input; not itself a played outcome\n`;
  const proposal: MutationProposal = {
    id: input.proposalId,
    title: "Record player declaration",
    summary: `Append verbatim player-owned evidence to ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "append", path, contents }]
  };
  validateProposal(proposal);
  return proposal;
}

export function buildEventProposal(input: {
  roomPath: string;
  displayName: string;
  actor: string;
  event: string;
  evidence: string;
  status: "confirmed" | "contested" | "unknown";
  audience: "dm" | "players" | "both";
  timestamp: string;
  proposalId: string;
}): MutationProposal {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const actor = inlineText(input.actor, "Actor");
  const event = input.event.trim();
  if (!actor || !event) throw new Error("Actor and event are required.");
  const path = `${roomPath}/${displayName} Table Log.md`;
  const contents =
    `\n### ${input.timestamp} — ${input.proposalId}\n\n` +
    `<!-- vcg:event ${input.proposalId} -->\n` +
    `- **Actor:** ${actor}\n` +
    `- **Event:** ${inlineText(event, "Event")}\n` +
    `- **Status:** ${input.status}\n` +
    `- **Audience:** ${input.audience}\n` +
    `- **Evidence / witnesses:** ${inlineText(input.evidence, "Evidence") || "unknown"}\n`;
  const proposal: MutationProposal = {
    id: input.proposalId,
    title: "Capture live event",
    summary: `Append one sourced event candidate to ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "append", path, contents }]
  };
  validateProposal(proposal);
  return proposal;
}

export function buildTranscriptionRequestProposal(input: {
  roomPath: string;
  displayName: string;
  audioPath: string;
  consentConfirmed: boolean;
  retention: string;
  timestamp: string;
  proposalId: string;
}): MutationProposal {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const audioPath = normalizeVaultPath(input.audioPath);
  if (!/\.(?:aac|flac|m4a|mp3|ogg|wav|webm)$/i.test(audioPath)) {
    throw new Error("Select an audio file with an approved extension.");
  }
  if (!input.consentConfirmed) throw new Error("Recording and transcription consent must be confirmed.");
  const path = `${roomPath}/${displayName} Transcription Requests.md`;
  const contents =
    `\n### Request ${input.timestamp} — ${input.proposalId}\n\n` +
    `<!-- vcg:transcription-request ${input.proposalId} -->\n` +
    `- **Audio:** [[${audioPath}]]\n` +
    `- **Consent:** confirmed by operator\n` +
    `- **Retention:** ${inlineText(input.retention, "Retention") || "review before processing"}\n` +
    `- **Execution:** not run; proposal receipt only\n` +
    `- **Approved runtime:** loopback/local whisper-cli with a fixed reviewed model\n`;
  const initialContents =
    sessionFrontmatter(`${displayName} Transcription Requests`, input.timestamp.slice(0, 10), ["Category/Transcription-Request"]) +
    `# ${displayName} Transcription Requests\n\n> Consent-bound request receipts. Creating a receipt does not run a process.\n`;
  const proposal: MutationProposal = {
    id: input.proposalId,
    title: "Create local transcription request",
    summary: `Append a consent-bound request for ${audioPath}. No process will run.`,
    phase: "propose",
    canonImpact: "none",
    operations: [{ kind: "append", path, contents, initialContents }]
  };
  validateProposal(proposal);
  return proposal;
}

export function collectRunSelectionEvidence(input: {
  roomPath: string;
  displayName: string;
  decisionIntakeContents: string | null;
  currentStateContents: string | null;
}): RunSelectionEvidence[] {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const candidates: RunSelectionEvidence[] = [];
  if (input.decisionIntakeContents && declarationMarkerIds(input.decisionIntakeContents).length > 0) {
    candidates.push({
      authority: "player-declaration",
      sourcePath: `${roomPath}/${displayName} Decision Intake.md`,
      contents: input.decisionIntakeContents
    });
  }
  const deploymentMode = input.currentStateContents
    ? strictFrontmatterScalar(input.currentStateContents, "deployment_mode")
    : null;
  const selectedLead = input.currentStateContents
    ? strictFrontmatterScalar(input.currentStateContents, "selected_lead")
    : null;
  if (input.currentStateContents !== null && deploymentMode === DM_LIVE_HANDOFF_DEPLOYMENT_MODE) {
    candidates.push({
      authority: "dm-selected-from-live-handoff",
      sourcePath: VAULT_PATHS.currentState,
      contents: input.currentStateContents,
      deploymentMode,
      selectedLead
    });
  }
  return candidates;
}

export function resolveRunSelectionEvidence(input: {
  roomPath: string;
  displayName: string;
  selectionEvidence?: readonly RunSelectionEvidence[];
  declarationEvidence?: string;
}): ResolvedRunSelectionEvidence {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const legacyEvidenceSupplied = input.declarationEvidence !== undefined;
  if (input.selectionEvidence !== undefined && legacyEvidenceSupplied) {
    throw new Error("RUN generation is blocked because multiple selection-evidence inputs were supplied.");
  }
  const candidates: readonly RunSelectionEvidence[] =
    input.selectionEvidence ??
    (legacyEvidenceSupplied
      ? [
          {
            authority: "player-declaration",
            sourcePath: `${roomPath}/${displayName} Decision Intake.md`,
            contents: input.declarationEvidence ?? ""
          }
        ]
      : []);
  if (candidates.length === 0) {
    throw new Error("RUN generation is blocked until exactly one explicit selection-evidence authority exists.");
  }
  if (candidates.length > 1) {
    throw new Error(
      "RUN generation is blocked because multiple selection-evidence authorities are present; resolve the authority first."
    );
  }

  const candidate = candidates[0];
  if (!candidate) throw new Error("RUN generation is blocked because selection evidence could not be resolved.");
  if (candidate.authority !== "player-declaration" && candidate.authority !== "dm-selected-from-live-handoff") {
    throw new Error("RUN generation is blocked because selection evidence has an unknown authority.");
  }
  const sourcePath = normalizeVaultPath(candidate.sourcePath);
  if (sourcePath !== candidate.sourcePath) {
    throw new Error("Selection-evidence source paths must already be normalized vault-relative paths.");
  }
  if (candidate.authority === "player-declaration") {
    const expectedPath = `${roomPath}/${displayName} Decision Intake.md`;
    if (sourcePath !== expectedPath) {
      throw new Error(`Player-declaration evidence must come from the active room Decision Intake: ${expectedPath}`);
    }
    const declarationIds = declarationMarkerIds(candidate.contents);
    if (declarationIds.length === 0) {
      if (legacyEvidenceSupplied) {
        throw new Error("RUN generation is blocked until declaration evidence exists in Decision Intake.");
      }
      throw new Error("Player-declaration selection evidence requires an exact standalone vcg:declaration marker.");
    }
    if (new Set(declarationIds).size !== declarationIds.length) {
      throw new Error("Player-declaration evidence contains duplicate declaration markers.");
    }
    const selectionIds = selectionMarkerIds(candidate.contents);
    if (selectionIds.length > 1) {
      throw new Error("Player-declaration evidence requires at most one standalone vcg:selection marker.");
    }
    const selectionMarkerId = selectionIds[0] ?? null;
    if (declarationIds.length > 1 && !selectionMarkerId) {
      throw new Error(
        "Multiple player declarations require exactly one explicit standalone vcg:selection marker."
      );
    }
    const declarationId = selectionMarkerId ?? declarationIds[0];
    if (!declarationId || !declarationIds.includes(declarationId)) {
      throw new Error("The standalone vcg:selection marker must name a declaration marker in the same Decision Intake.");
    }
    return {
      authority: candidate.authority,
      sourcePath,
      sourceContentHash: contentHash(candidate.contents),
      declarationId,
      selectionMarkerId
    };
  }

  if (sourcePath !== VAULT_PATHS.currentState) {
    throw new Error(`DM live-handoff selection evidence must come from ${VAULT_PATHS.currentState}.`);
  }
  if (
    typeof candidate.deploymentMode !== "string" ||
    candidate.deploymentMode.trim() !== DM_LIVE_HANDOFF_DEPLOYMENT_MODE
  ) {
    throw new Error(
      `DM live-handoff selection requires deployment_mode: ${DM_LIVE_HANDOFF_DEPLOYMENT_MODE}.`
    );
  }
  if (!candidate.contents.trim()) {
    throw new Error("DM live-handoff selection requires the Current State source contents.");
  }
  const selectedLead = selectedLeadIdentifier(candidate.selectedLead);
  const sourceDeploymentMode = strictFrontmatterScalar(candidate.contents, "deployment_mode");
  const sourceSelectedLead = strictFrontmatterScalar(candidate.contents, "selected_lead");
  if (sourceDeploymentMode !== candidate.deploymentMode || sourceSelectedLead !== selectedLead) {
    throw new Error("DM live-handoff selection fields must match the same Current State source snapshot.");
  }
  return {
    authority: candidate.authority,
    sourcePath,
    sourceContentHash: contentHash(candidate.contents),
    selectedLead
  };
}

function runSelectionEvidenceMarkdown(evidence: ResolvedRunSelectionEvidence): string {
  if (evidence.authority === "player-declaration") {
    return (
      `- **Selection authority:** verbatim player declaration\n` +
      `- **Evidence source:** [[${evidence.sourcePath}]]\n` +
      `- **Evidence snapshot:** SHA-256 \`${evidence.sourceContentHash}\`\n` +
      `- **Evidence marker:** \`vcg:declaration ${evidence.declarationId}\`\n` +
      (evidence.selectionMarkerId
        ? `- **Selection marker:** \`vcg:selection ${evidence.selectionMarkerId}\`\n`
        : `- **Selection marker:** not required; the Decision Intake contains exactly one declaration\n`) +
      `- **Player wording:** copy the reviewed verbatim statement here\n` +
      `- **Selected lead:** do not infer; derive only from the reviewed declaration\n`
    );
  }
  return (
    `- **Selection authority:** DM selection from live handoff\n` +
    `- **Evidence source:** [[${evidence.sourcePath}]]\n` +
    `- **Evidence snapshot:** SHA-256 \`${evidence.sourceContentHash}\`\n` +
    `- **Deployment mode:** \`${DM_LIVE_HANDOFF_DEPLOYMENT_MODE}\`\n` +
    `- **Selected lead:** \`${evidence.selectedLead}\`\n` +
    `- **Player wording:** not asserted; this authority does not claim or fabricate player intent\n`
  );
}

export function buildRunProposal(input: {
  roomPath: string;
  displayName: string;
  selectionEvidence?: readonly RunSelectionEvidence[];
  declarationEvidence?: string;
  currentStateEvidence: CurrentStateRunEvidence;
  createdDate: string;
  proposalId: string;
}): MutationProposal {
  const roomPath = normalizeSessionRoomPath(input.roomPath);
  const displayName = normalizeSessionDisplayName(roomPath, input.displayName);
  const currentStateEvidence = resolveCurrentStateRunEvidence(input.currentStateEvidence);
  const selectionEvidence = resolveRunSelectionEvidence({
    roomPath,
    displayName,
    selectionEvidence: input.selectionEvidence,
    declarationEvidence: input.declarationEvidence
  });
  if (
    selectionEvidence.authority === "dm-selected-from-live-handoff" &&
    selectionEvidence.sourceContentHash !== currentStateEvidence.sourceContentHash
  ) {
    throw new Error("DM selection evidence must match the bound Current State evidence snapshot.");
  }
  const title = `${displayName} RUN`;
  const path = `${roomPath}/${title}.md`;
  const contents =
    sessionFrontmatter(title, input.createdDate, ["Category/Session-Prep"]) +
    `# ${title}\n\n> [!important] Conditional prep only\n> Generated only after exactly one explicit selection-evidence authority validated. This remains draft/future, cannot prove that anything happened, and cannot convert a DM selection into player intent.\n\n## Selection authority and evidence\n\n- **Latest played record:** ${inlineText(currentStateEvidence.latestPlayedLabel, "Latest played label")}\n- **Current State source:** [[${currentStateEvidence.sourcePath}]]\n- **Current State snapshot:** SHA-256 \`${currentStateEvidence.sourceContentHash}\`\n${runSelectionEvidenceMarkdown(selectionEvidence)}- **Current-state facts used:** <!-- add citations -->\n- **Exact gaps and safe fallbacks:** <!-- document gaps -->\n- **Source modules opened for parts:** <!-- list source modules -->\n- **Source claims explicitly excluded:** <!-- list exclusions -->\n\n## Player-facing choice set\n\n| Perceivable choice | Available modes | What may change |\n| --- | --- | --- |\n|  |  |  |\n\n## Activated toy register\n\n| ID | Perceivable evidence | Want / move | 3+ affordances | If ignored | Evidence boundary |\n| --- | --- | --- | --- | --- | --- |\n| T-01 |  |  |  |  |  |\n\n## Information resilience\n\n| Information | Witness | Object / record | Environment / consequence | Survives a missing NPC? |\n| --- | --- | --- | --- | --- |\n|  |  |  |  |  |\n\n## Map and fallback contract\n\n- **Primary map:** <!-- add map -->\n- **Abstract-zone fallback:** <!-- add fallback -->\n- **Player-safe reveal state:** <!-- add reveal state -->\n- **Unexpected approach:** <!-- add contingency -->\n\n## Outcome bands\n\n| Outcome | State change candidate | Continuing choices |\n| --- | --- | --- |\n| Success |  |  |\n| Costly / partial |  |  |\n| Refusal / departure |  |  |\n`;
  const evidenceSources: ProposalEvidenceSource[] = [
    { path: currentStateEvidence.sourcePath, contentHash: currentStateEvidence.sourceContentHash }
  ];
  if (selectionEvidence.sourcePath !== currentStateEvidence.sourcePath) {
    evidenceSources.push({ path: selectionEvidence.sourcePath, contentHash: selectionEvidence.sourceContentHash });
  }
  const proposal: MutationProposal = {
    id: input.proposalId,
    title: `Generate draft ${title}`,
    summary: `Create one explicit-selection-gated draft RUN at ${path}.`,
    phase: "propose",
    canonImpact: "candidate-only",
    operations: [{ kind: "create", path, contents }],
    evidenceSources
  };
  validateProposal(proposal);
  return proposal;
}
