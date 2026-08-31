import { readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";

const requiredAssets = ["manifest.json", "main.js", "styles.css"];
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
const featureContract = JSON.parse(readFileSync("feature-contract.json", "utf8"));
const errors = [];

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

requireEqual("manifest.id", manifest.id, "veiled-chicago-control-plane");
requireEqual("package version", packageJson.version, manifest.version);
requireEqual("package-lock version", packageLock.version, manifest.version);
requireEqual("package-lock root version", packageLock.packages?.[""]?.version, manifest.version);
requireEqual("versions mapping", versions[manifest.version], manifest.minAppVersion);

if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) {
  errors.push(`manifest.version is not an exact semantic version: ${JSON.stringify(manifest.version)}`);
}

for (const asset of requiredAssets) {
  try {
    if (statSync(asset).size === 0) errors.push(`${asset} is empty`);
  } catch {
    errors.push(`${asset} is missing`);
  }
}

const syntax = spawnSync(process.execPath, ["--check", "main.js"], { encoding: "utf8" });
if (syntax.status !== 0) {
  errors.push(`main.js syntax check failed: ${(syntax.stderr || syntax.stdout).trim()}`);
}

const privatePathPatterns = [
  /\/Users\/[^/\s]+\/Library\/Mobile Documents\/iCloud~md~obsidian\/Documents\/Veiled Chicago/,
  /[A-Za-z]:\\Users\\[^\\\s]+\\.*Veiled Chicago/
];
for (const file of ["README.md", "main.js", "styles.css", "manifest.json"]) {
  const contents = readFileSync(file, "utf8");
  for (const pattern of privatePathPatterns) {
    if (pattern.test(contents)) errors.push(`${file} contains private absolute path material`);
  }
}

const removedVaultRoots = ["1-DM Toolkit", "1-Party", "1-Session Journals", "2-World-Chicago", "3-Mechanics"];
for (const file of [
  "README.md",
  "CONTROL_PLANE_1_4_SPEC.md",
  "main.js",
  "FEATURE_COVERAGE.md",
  "src/actions.ts",
  "src/command-search.ts",
  "src/entity-navigator.ts",
  "src/main.ts",
  "src/navigation.ts",
  "src/operating.ts",
  "src/paths.ts",
  "src/ui-contract.ts",
  "src/capabilities.ts"
]) {
  const contents = readFileSync(file, "utf8");
  for (const root of removedVaultRoots) {
    if (contents.includes(root)) errors.push(`${file} references removed vault root: ${root}`);
  }
}

const actionSource = readFileSync("src/actions.ts", "utf8");
const actionIds = [...actionSource.matchAll(/^\s{4}id: "([a-z0-9-]+)",$/gm)].map((match) => match[1]);
const duplicateActionIds = actionIds.filter((id, index) => actionIds.indexOf(id) !== index);
if (duplicateActionIds.length > 0) errors.push(`duplicate action IDs: ${[...new Set(duplicateActionIds)].join(", ")}`);
if (actionIds.length !== 56) errors.push(`compiled action registry must contain exactly 56 actions; got ${actionIds.length}`);
for (const file of ["src/actions.ts", "main.js", "companion/vcg_control.py"]) {
  const contents = readFileSync(file, "utf8");
  for (const retiredToken of ["tactical-ready", "--strict-ready"]) {
    if (contents.includes(retiredToken)) errors.push(`${file} exposes retired automation: ${retiredToken}`);
  }
}
for (const requiredAction of [
  "open-live-edge-router",
  "open-command-search",
  "open-omnisearch",
  "open-entity-navigator",
  "open-quick-switcher",
  "open-bookmarks",
  "open-workspaces",
  "save-workspace",
  "start-audio-recorder",
  "open-sessions-base",
  "open-npcs-base",
  "open-locations-base",
  "open-review-queue-base",
  "create-managed-note",
  "capture-quick-inbox",
  "set-active-session-room",
  "scaffold-active-session-room",
  "capture-player-declaration",
  "generate-session-run",
  "capture-live-event",
  "propose-local-transcription",
  "open-ai-context-policy",
  "open-operations-health"
]) {
  if (!actionIds.includes(requiredAction)) errors.push(`required action is missing: ${requiredAction}`);
  if (!readFileSync("main.js", "utf8").includes(requiredAction)) {
    errors.push(`built main.js is missing action: ${requiredAction}`);
  }
}

const coverageSource = readFileSync("FEATURE_COVERAGE.md", "utf8");
const coverageRows = [...coverageSource.matchAll(/^\|\s+(\d+)\s+\|/gm)].map((match) => Number(match[1]));
if (coverageRows.length !== 50 || coverageRows.some((value, index) => value !== index + 1)) {
  errors.push(`FEATURE_COVERAGE.md must map features 1 through 50 exactly; got ${coverageRows.join(",")}`);
}
const expectedFeatureIds = ["NAV", "CAP", "SESSION", "AI", "GOV"].flatMap((prefix) =>
  Array.from({ length: 10 }, (_, index) => `${prefix}-${String(index + 1).padStart(2, "0")}`)
);
const contractFeatures = Array.isArray(featureContract.features) ? featureContract.features : [];
const contractIds = contractFeatures.map((feature) => feature?.id);
if (contractIds.length !== 50 || contractIds.some((id, index) => id !== expectedFeatureIds[index])) {
  errors.push(`feature-contract.json IDs must match the canonical taxonomy exactly; got ${contractIds.join(",")}`);
}
for (const feature of contractFeatures) {
  for (const field of ["id", "owner", "status", "evidence", "test", "gate"]) {
    if (typeof feature?.[field] !== "string" || !feature[field].trim()) {
      errors.push(`feature-contract.json feature ${feature?.id ?? "unknown"} is missing ${field}`);
    }
  }
  if (typeof feature?.id === "string" && !coverageSource.includes(`| ${feature.id} |`)) {
    errors.push(`FEATURE_COVERAGE.md is missing stable ID ${feature.id}`);
  }
}

const mainSource = readFileSync("src/main.ts", "utf8");
const mainBundle = readFileSync("main.js", "utf8");
const commandSearchSource = readFileSync("src/command-search.ts", "utf8");
const companionSource = readFileSync("companion/vcg_control.py", "utf8");
const operatingSource = readFileSync("src/operating.ts", "utf8");
const workflowSource = readFileSync("src/workflow-ui.ts", "utf8");
const stylesSource = readFileSync("styles.css", "utf8");
const uiContractSource = readFileSync("src/ui-contract.ts", "utf8");
const capabilitiesSource = readFileSync("src/capabilities.ts", "utf8");
if (mainSource.includes("findLatestPlayedFallback")) errors.push("src/main.ts retains forbidden latest-played filename inference");
if (!mainSource.includes("transactionInProgress")) errors.push("src/main.ts is missing the transaction mutex");
if (!mainSource.includes("targetMatchesBaseline") || !mainSource.includes("contentHash(current)")) {
  errors.push("src/main.ts is missing preview-baseline preflight or atomic append verification");
}
if (!mainSource.includes("pendingWorkflowModals") || !mainSource.includes("pendingProposalModals")) {
  errors.push("src/main.ts does not track all workflow and proposal modals");
}
if (!mainSource.includes('aria-disabled') || !stylesSource.includes('prefers-reduced-motion: reduce')) {
  errors.push("control-plane sources are missing accessible disabled-state or reduced-motion behavior");
}
if (
  !workflowSource.includes('aria-describedby') ||
  !workflowSource.includes('aria-required') ||
  !workflowSource.includes('aria-invalid') ||
  !workflowSource.includes('missing[0]') ||
  !workflowSource.includes('captureBaselines') ||
  !workflowSource.includes('submitting')
) {
  errors.push("src/workflow-ui.ts is missing modal associations, required controls, or submit guard");
}
if (!operatingSource.includes('MANAGED_WRITE_ROOTS') || !operatingSource.includes('MANAGED_WRITE_EXTENSIONS')) {
  errors.push("src/operating.ts is missing the central managed-write allowlist");
}
if (!actionSource.match(/id: "open-terminal"[\s\S]*?protocolSafe: false/)) {
  errors.push("open-terminal must remain protocol-unsafe");
}
if (
  !actionSource.includes('export type ActionSource = "view" | "block" | "command" | "protocol"') ||
  !actionSource.includes("allowedSources: readonly ActionSource[]") ||
  !actionSource.includes("CONTROL_BLOCK_LIMITS") ||
  !actionSource.includes('allowedSources.includes("block")') ||
  !mainSource.includes("sourceBlockReason(action, source)")
) {
  errors.push("1.4 sources are missing the typed action-source policy or bounded Markdown parser");
}
if (
  !commandSearchSource.includes("getSuggestions(query: string)") ||
  !commandSearchSource.includes("rankActionsForSearch(this.options.actions, query,")
) {
  errors.push("1.4 command search is not wired to query-aware ranking");
}
if (
  !mainSource.includes("class SessionRoomSuggestModal extends FuzzySuggestModal") ||
  !mainSource.includes("root.children") ||
  !mainSource.includes("selectExistingSessionRoom") ||
  !mainSource.includes("folder instanceof TFolder")
) {
  errors.push("1.4 sources are missing native existing-folder session selection and revalidation");
}
if (
  !operatingSource.includes("selectionMarkerIds") ||
  !operatingSource.includes("Multiple player declarations require exactly one explicit standalone vcg:selection marker") ||
  !operatingSource.includes("currentStateEvidence: CurrentStateRunEvidence") ||
  !operatingSource.includes("DM selection evidence must match the bound Current State evidence snapshot")
) {
  errors.push("1.4 sources are missing snapshot-complete RUN evidence or explicit multi-declaration selection");
}
if (!actionSource.match(/id: "open-omnisearch"[\s\S]*?target: "omnisearch:show-modal"/)) {
  errors.push("open-omnisearch must remain bound to the verified fixed Omnisearch command");
}
if (
  !mainSource.includes('startupSurface: StartupSurface') ||
  !mainSource.includes('normalizeStartupSurface(saved.startupSurface)') ||
  !mainSource.includes('this.activationPromise')
) {
  errors.push("src/main.ts is missing startup-surface normalization or singleton activation");
}
if (
  !mainSource.includes('setAttribute("role", "status")') ||
  !mainSource.includes('escapeSurface(this.contextOpen, this.moreOpen)') ||
  !mainSource.includes('ENTITY_SEARCH_DEBOUNCE_MS') ||
  !mainSource.includes('aria-labelledby') ||
  !mainSource.includes('aria-describedby')
) {
  errors.push("src/main.ts is missing 1.3 live-region, disclosure, or entity-search accessibility contracts");
}
if (
  !mainSource.includes('registerMarkdownCodeBlockProcessor("ad-statblock"') ||
  !mainSource.includes('MarkdownRenderer.render') ||
  !uiContractSource.includes("sanitizeAdStatblockMarkdown") ||
  !uiContractSource.includes("BUTTON|INPUT|VIEW")
) {
  errors.push("1.3 sources are missing the non-executable ad-statblock renderer");
}
for (const retiredCompatSelector of ['data-type^="custom-frames-"', 'data-type="terminal-view"']) {
  if (stylesSource.includes(retiredCompatSelector)) {
    errors.push(`styles.css owns third-party chrome that belongs in vcg-compat.css: ${retiredCompatSelector}`);
  }
}
if (!mainSource.includes("INTERFACE_CAPABILITIES") || !capabilitiesSource.includes("omnisearch:show-modal")) {
  errors.push("1.3 sources are missing the fixed local capability registry");
}
if (
  !mainSource.includes('env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" }') ||
  !mainBundle.includes("PYTHONDONTWRITEBYTECODE")
) {
  errors.push("plugin source or distributable does not enforce no-bytecode mode for the Python wrapper");
}
if (
  !companionSource.includes("environment = os.environ.copy()") ||
  !companionSource.includes('environment["PYTHONDONTWRITEBYTECODE"] = "1"') ||
  !companionSource.includes("env=_python_child_environment()")
) {
  errors.push("companion wrapper does not preserve the parent environment and enforce no-bytecode mode");
}
if (stylesSource.includes("@media (max-width:")) {
  errors.push("styles.css uses viewport width for leaf-dependent reflow; use the control-plane container");
}
if (/\.vc-control-(?:action|command-result)[^{]*is-unavailable[^}]*opacity/s.test(stylesSource)) {
  errors.push("styles.css applies parent opacity to unavailable controls");
}
for (const requiredStyle of [".vc-ad-statblock", "@container vc-ad-statblock", ".vc-control-group-nav", ".vc-control-capability-list"]) {
  if (!stylesSource.includes(requiredStyle)) errors.push(`styles.css is missing 1.3 surface: ${requiredStyle}`);
}

if (errors.length > 0) {
  console.error("release-check FAIL");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`release-check PASS ${manifest.id}@${manifest.version}`);
console.log(`assets ${requiredAssets.join(", ")}`);
