import assert from "node:assert/strict";

import {
  buildDeclarationProposal,
  buildEventProposal,
  buildManagedNoteProposal,
  buildRunProposal,
  buildSessionRoomProposal,
  buildTargetBaseline,
  buildTranscriptionRequestProposal,
  collectRunSelectionEvidence,
  contentHash,
  contentMatchesExpected,
  CONTEXT_PROFILES,
  DM_LIVE_HANDOFF_DEPLOYMENT_MODE,
  isProtectedCanonPath,
  normalizeSessionDisplayName,
  normalizeSessionRoomPath,
  normalizeVaultPath,
  operationTargetPrecondition,
  parseExplicitNextSession,
  resolveOperationMode,
  targetMatchesBaseline,
  validateControlResult,
  validateManagedWritePath,
  validateProposal,
  validateReviewedProposal
} from "../src/operating";
import { MANAGED_NOTE_ROOTS, VAULT_PATHS } from "../src/paths";
import { CONTROL_ACTIONS } from "../src/actions";

function expectThrow(callback: () => unknown, message: RegExp): void {
  assert.throws(callback, message);
}

assert.equal(normalizeVaultPath("1-Campaign//DM/Operations Inbox/"), "1-Campaign/DM/Operations Inbox");
expectThrow(() => normalizeVaultPath("../outside"), /parent-directory/);
expectThrow(() => normalizeVaultPath(".obsidian/plugins/x"), /cannot write inside/);
expectThrow(() => normalizeVaultPath(".ObSiDiAn/plugins/x"), /cannot write inside/);
expectThrow(() => normalizeVaultPath("1-Campaign/.ObSiDiAn/x.md"), /cannot write inside/);
assert.equal(validateManagedWritePath("9-System/Docs/test.MD"), "9-System/Docs/test.MD");
expectThrow(() => validateManagedWritePath("0-Inbox/test.md"), /four managed roots|must remain below/);
expectThrow(() => validateManagedWritePath("1-Campaign/DM/test.json"), /allowlisted file extension/);
assert.equal(normalizeSessionRoomPath("1-Campaign/Sessions/Session 9"), "1-Campaign/Sessions/Session 9");
expectThrow(() => normalizeSessionRoomPath("1-Session Journals/Session 9"), /must live below/);
expectThrow(
  () => normalizeSessionRoomPath("1-Campaign/Sessions/_future-planning/Session 12"),
  /future-planning source packet/
);
assert.equal(normalizeSessionDisplayName("1-Campaign/Sessions/Session 9", "Session 9"), "Session 9");
expectThrow(
  () => normalizeSessionDisplayName("1-Campaign/Sessions/Session 9", "../Session 9"),
  /safe filename stem/
);
expectThrow(
  () => normalizeSessionDisplayName("1-Campaign/Sessions/Session 9", "Other room"),
  /match the selected folder name/
);
assert.equal(parseExplicitNextSession(null), null);
assert.equal(parseExplicitNextSession(9), 9);
assert.equal(parseExplicitNextSession("9"), null);

assert.equal(isProtectedCanonPath(VAULT_PATHS.currentState), true);
assert.equal(isProtectedCanonPath(VAULT_PATHS.currentState.toUpperCase()), true);
expectThrow(
  () =>
    validateProposal({
      id: "test",
      title: "Unsafe",
      summary: "",
      phase: "propose",
      canonImpact: "candidate-only",
      operations: [{ kind: "append", path: VAULT_PATHS.campaignLedger, contents: "bad" }]
    }),
  /Direct canon mutation is blocked/
);
assert.equal(resolveOperationMode({ kind: "create", path: "Inbox/new.md", contents: "x" }, "missing"), "create");
expectThrow(
  () => resolveOperationMode({ kind: "create", path: "Inbox/new.md", contents: "x" }, "file"),
  /already exists/
);
expectThrow(
  () => resolveOperationMode({ kind: "append", path: "Inbox/log.md", contents: "x" }, "missing"),
  /no reviewed initializer/
);
assert.equal(
  resolveOperationMode(
    { kind: "append", path: "Inbox/log.md", contents: "x", initialContents: "# Log" },
    "missing"
  ),
  "create"
);
assert.match(operationTargetPrecondition({ kind: "create", path: "1-Campaign/new.md", contents: "x" }), /must be missing/);
assert.match(
  operationTargetPrecondition({ kind: "append", path: "1-Campaign/log.md", contents: "x" }),
  /existing file/
);
expectThrow(
  () =>
    validateProposal({
      id: "bad-kind",
      title: "Bad",
      summary: "Bad operation",
      phase: "propose",
      canonImpact: "none",
      operations: [{ kind: "delete", path: "1-Campaign/test.md", contents: "x" } as never]
    }),
  /invalid operation discriminant/
);
expectThrow(
  () =>
    validateProposal({
      id: "duplicate",
      title: "Duplicate",
      summary: "Duplicate target",
      phase: "propose",
      canonImpact: "none",
      operations: [
        { kind: "create", path: "1-Campaign/test.md", contents: "x" },
        { kind: "append", path: "1-Campaign/test.md", contents: "y" }
      ]
    }),
  /Duplicate operation target/
);
assert.equal(contentMatchesExpected("reviewed", "reviewed"), true);
assert.equal(contentMatchesExpected("concurrently changed", "reviewed"), false);
assert.equal(contentHash("reviewed").length, 64);
const missingBaseline = buildTargetBaseline("1-Campaign/test.md", "missing", null, null, null);
const fileBaseline = buildTargetBaseline("1-Campaign/log.md", "file", "before", 100, 6);
assert.equal(targetMatchesBaseline(missingBaseline, "missing", null, null, null), true);
assert.equal(targetMatchesBaseline(missingBaseline, "file", "", 0, 0), false);
assert.equal(targetMatchesBaseline(fileBaseline, "file", "before", 100, 6), true);
assert.equal(targetMatchesBaseline(fileBaseline, "file", "changed", 100, 7), false);
assert.equal(targetMatchesBaseline(fileBaseline, "file", "before", 101, 6), false);
validateReviewedProposal({
  id: "reviewed",
  title: "Reviewed",
  summary: "Reviewed baselines",
  phase: "propose",
  canonImpact: "none",
  operations: [
    { kind: "create", path: "1-Campaign/test.md", contents: "new" },
    { kind: "append", path: "1-Campaign/log.md", contents: "append" }
  ],
  targetBaselines: [missingBaseline, fileBaseline]
});
expectThrow(
  () =>
    validateReviewedProposal({
      id: "stale",
      title: "Stale",
      summary: "Wrong baseline state",
      phase: "propose",
      canonImpact: "none",
      operations: [{ kind: "create", path: "1-Campaign/log.md", contents: "new" }],
      targetBaselines: [fileBaseline]
    }),
  /already exists/
);
assert.deepEqual(
  validateControlResult(
    { action: "live-edge", ok: true, exit_code: 0, stdout: "PASS", stderr: "", duration_ms: 12 },
    "live-edge"
  ).action,
  "live-edge"
);
expectThrow(
  () =>
    validateControlResult(
      { action: "navigation", ok: true, exit_code: 0, stdout: "PASS", stderr: "", duration_ms: 12 },
      "live-edge"
    ),
  /does not match/
);
expectThrow(
  () =>
    validateControlResult(
      { action: "live-edge", ok: true, exit_code: 1, stdout: "", stderr: "bad", duration_ms: 12 },
      "live-edge"
    ),
  /conflicts/
);

const note = buildManagedNoteProposal({
  schemaId: "npc",
  title: "Ada Example",
  fields: { char_race: "Human", char_status: "Unknown" },
  createdDate: "2026-08-29",
  proposalId: "vcg-test-note"
});
assert.equal(note.operations.length, 1);
assert.equal(note.operations[0]?.path, `${MANAGED_NOTE_ROOTS.npc}/ada-example.md`);
assert.match(note.operations[0]?.contents ?? "", /canon_status: "draft"/);
assert.match(note.operations[0]?.contents ?? "", /retrieval_scope: "future"/);

const room = buildSessionRoomProposal({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  createdDate: "2026-08-29",
  proposalId: "vcg-test-room"
});
assert.equal(room.operations.length, 7);
assert.ok(room.operations.every((operation) => operation.kind === "create"));
assert.ok(room.operations.every((operation) => operation.path.startsWith("1-Campaign/Sessions/Session 9/")));
assert.ok(room.operations.every((operation) => !operation.contents.includes("next_session:")));
assert.match(room.operations[0]?.contents ?? "", /exactly one supported selection authority/);
assert.match(room.operations[5]?.contents ?? "", /Player path.*or DM path/);

const declaration = buildDeclarationProposal({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  wording: "We go to the laboratory.",
  speaker: "The table",
  disposition: "accepted",
  timestamp: "2026-08-29T20:00:00.000Z",
  proposalId: "vcg-test-declaration"
});
assert.match(declaration.operations[0]?.contents ?? "", /vcg:declaration/);
assert.match(declaration.operations[0]?.contents ?? "", /We go to the laboratory\./);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      declarationEvidence: "No declaration recorded.",
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-run"
    }),
  /blocked until declaration evidence exists/
);

const run = buildRunProposal({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  declarationEvidence: "<!-- vcg:declaration vcg-test -->",
  latestPlayedLabel: "Session 8",
  createdDate: "2026-08-29",
  proposalId: "vcg-test-run"
});
assert.match(run.operations[0]?.contents ?? "", /Conditional prep only/);
assert.match(run.operations[0]?.contents ?? "", /Latest played record:\*\* Session 8/);
assert.match(run.operations[0]?.contents ?? "", /Selection authority:\*\* verbatim player declaration/);
assert.match(run.operations[0]?.contents ?? "", /Evidence marker:\*\* `vcg:declaration vcg-test`/);
assert.equal(run.evidenceSources?.length, 1);

const currentStateSelectionSource =
  "---\ndeployment_mode: dm-selected-from-live-handoff\nselected_lead: lead-from-live-handoff\n---\n";

const playerSelection = collectRunSelectionEvidence({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  decisionIntakeContents: "<!-- vcg:declaration vcg-structured-player -->",
  currentStateContents: "---\ndeployment_mode: player-selected\nselected_lead: ignored-without-dm-mode\n---\n"
});
assert.equal(playerSelection.length, 1);
assert.equal(playerSelection[0]?.authority, "player-declaration");
assert.equal(
  collectRunSelectionEvidence({
    roomPath: "1-Campaign/Sessions/Session 9",
    displayName: "Session 9",
    decisionIntakeContents: null,
    currentStateContents:
      "---\ndeployment_mode: dm-selected-without-live-handoff\nselected_lead: lead-with-wrong-mode\n---\n"
  }).length,
  0
);

const structuredPlayerRun = buildRunProposal({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  selectionEvidence: playerSelection,
  latestPlayedLabel: "Session 8",
  createdDate: "2026-08-29",
  proposalId: "vcg-test-structured-player-run"
});
assert.match(structuredPlayerRun.operations[0]?.contents ?? "", /vcg:declaration vcg-structured-player/);

const dmSelection = collectRunSelectionEvidence({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  decisionIntakeContents: null,
  currentStateContents: currentStateSelectionSource
});
assert.equal(dmSelection.length, 1);
assert.equal(dmSelection[0]?.authority, "dm-selected-from-live-handoff");

const dmRun = buildRunProposal({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  selectionEvidence: dmSelection,
  latestPlayedLabel: "Session 8",
  createdDate: "2026-08-29",
  proposalId: "vcg-test-dm-run"
});
assert.match(dmRun.operations[0]?.contents ?? "", /Selection authority:\*\* DM selection from live handoff/);
assert.match(dmRun.operations[0]?.contents ?? "", /Deployment mode:\*\* `dm-selected-from-live-handoff`/);
assert.match(dmRun.operations[0]?.contents ?? "", /Selected lead:\*\* `lead-from-live-handoff`/);
assert.match(dmRun.operations[0]?.contents ?? "", /does not claim or fabricate player intent/);
assert.equal(dmRun.evidenceSources?.[0]?.path, VAULT_PATHS.currentState);
assert.equal(dmRun.evidenceSources?.[0]?.contentHash, contentHash(currentStateSelectionSource));
const dmRunTarget = dmRun.operations[0];
assert.ok(dmRunTarget);
const dmEvidenceBaseline = buildTargetBaseline(
  VAULT_PATHS.currentState,
  "file",
  currentStateSelectionSource,
  200,
  Buffer.byteLength(currentStateSelectionSource)
);
validateReviewedProposal({
  ...dmRun,
  targetBaselines: [buildTargetBaseline(dmRunTarget.path, "missing", null, null, null)],
  evidenceBaselines: [dmEvidenceBaseline]
});
expectThrow(
  () =>
    validateReviewedProposal({
      ...dmRun,
      targetBaselines: [buildTargetBaseline(dmRunTarget.path, "missing", null, null, null)],
      evidenceBaselines: [
        buildTargetBaseline(
          VAULT_PATHS.currentState,
          "file",
          `${currentStateSelectionSource}changed\n`,
          201,
          Buffer.byteLength(`${currentStateSelectionSource}changed\n`)
        )
      ]
    }),
  /Evidence source changed before review baseline capture/
);
assert.equal(
  targetMatchesBaseline(
    dmEvidenceBaseline,
    "file",
    `${currentStateSelectionSource}changed\n`,
    201,
    Buffer.byteLength(`${currentStateSelectionSource}changed\n`)
  ),
  false
);

const ambiguousSelection = collectRunSelectionEvidence({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  decisionIntakeContents: "<!-- vcg:declaration vcg-ambiguous-player -->",
  currentStateContents:
    "---\ndeployment_mode: dm-selected-from-live-handoff\nselected_lead: dm-selected-lead\n---\n"
});
assert.equal(ambiguousSelection.length, 2);
expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: ambiguousSelection,
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-ambiguous-run"
    }),
  /multiple selection-evidence authorities/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-absent-run"
    }),
  /exactly one explicit selection-evidence authority/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [
        {
          authority: "dm-selected-from-live-handoff",
          sourcePath: VAULT_PATHS.currentState,
          contents: currentStateSelectionSource,
          deploymentMode: DM_LIVE_HANDOFF_DEPLOYMENT_MODE,
          selectedLead: null
        }
      ],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-invalid-dm-run"
    }),
  /selected_lead.*scalar identifier/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [
        {
          authority: "dm-selected-from-live-handoff",
          sourcePath: "1-Campaign/DM/Other State.md",
          contents:
            "---\ndeployment_mode: dm-selected-from-live-handoff\nselected_lead: dm-selected-lead\n---\n",
          deploymentMode: DM_LIVE_HANDOFF_DEPLOYMENT_MODE,
          selectedLead: "dm-selected-lead"
        }
      ],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-wrong-dm-source-run"
    }),
  /must come from 1-Campaign\/DM\/Current State of Affairs\.md/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [
        {
          authority: "dm-selected-from-live-handoff",
          sourcePath: VAULT_PATHS.currentState,
          contents:
            "---\ndeployment_mode: dm-selected-from-live-handoff\nselected_lead: lead-with-wrong-mode\n---\n",
          deploymentMode: "player-selected",
          selectedLead: "lead-with-wrong-mode"
        }
      ],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-wrong-dm-mode-run"
    }),
  /requires deployment_mode: dm-selected-from-live-handoff/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [
        {
          authority: "dm-selected-from-live-handoff",
          sourcePath: VAULT_PATHS.currentState,
          contents: currentStateSelectionSource,
          deploymentMode: DM_LIVE_HANDOFF_DEPLOYMENT_MODE,
          selectedLead: "different-lead"
        }
      ],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-dm-snapshot-mismatch-run"
    }),
  /fields must match the same Current State source snapshot/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [
        {
          authority: "unsupported-authority",
          sourcePath: VAULT_PATHS.currentState,
          contents: currentStateSelectionSource,
          deploymentMode: DM_LIVE_HANDOFF_DEPLOYMENT_MODE,
          selectedLead: "lead-from-live-handoff"
        } as never
      ],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-invalid-authority-run"
    }),
  /unknown authority/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [
        {
          authority: "player-declaration",
          sourcePath: "/1-Campaign/Sessions/Session 9/Session 9 Decision Intake.md",
          contents: "<!-- vcg:declaration vcg-nonnormalized-source -->"
        }
      ],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-nonnormalized-source-run"
    }),
  /source paths must already be normalized/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [
        {
          authority: "player-declaration",
          sourcePath: "1-Campaign/Sessions/Session 9/Session 9 Decision Intake.md",
          contents: "This prose mentions vcg:declaration but is not an evidence marker."
        }
      ],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-player-substring-run"
    }),
  /exact standalone vcg:declaration marker/
);

for (const [id, contents] of [
  ["mismatched-fence", "```markdown\n~~~\n<!-- vcg:declaration vcg-mismatched -->\n```"],
  ["shorter-fence", "````markdown\n```\n<!-- vcg:declaration vcg-shorter -->\n````"],
  ["indented-code", "    <!-- vcg:declaration vcg-indented -->"],
  ["unordered-list-fence", "- ```markdown\n  <!-- vcg:declaration vcg-list -->\n  ```"],
  ["ordered-list-fence", "1. ```markdown\n   <!-- vcg:declaration vcg-ordered -->\n   ```"],
  ["blockquote-fence", "> ```markdown\n> <!-- vcg:declaration vcg-quote -->\n> ```"],
  ["top-level-unordered-false-closer", "```markdown\n- ```\n<!-- vcg:declaration vcg-list-close -->\n```"],
  ["top-level-ordered-false-closer", "```markdown\n1. ```\n<!-- vcg:declaration vcg-ordered-close -->\n```"],
  ["top-level-quote-false-closer", "```markdown\n> ```\n<!-- vcg:declaration vcg-quote-close -->\n```"]
] as const) {
  expectThrow(
    () =>
      buildRunProposal({
        roomPath: "1-Campaign/Sessions/Session 9",
        displayName: "Session 9",
        selectionEvidence: [
          {
            authority: "player-declaration",
            sourcePath: "1-Campaign/Sessions/Session 9/Session 9 Decision Intake.md",
            contents
          }
        ],
        latestPlayedLabel: "Session 8",
        createdDate: "2026-08-29",
        proposalId: `vcg-test-player-${id}-run`
      }),
    /exact standalone vcg:declaration marker/
  );
}

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: [
        {
          authority: "player-declaration",
          sourcePath: "1-Campaign/Sessions/Session 9/Session 9 Decision Intake.md",
          contents: "```markdown\n<!-- vcg:declaration vcg-example-only -->\n```"
        }
      ],
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-player-fenced-run"
    }),
  /exact standalone vcg:declaration marker/
);

expectThrow(
  () =>
    buildRunProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      selectionEvidence: playerSelection,
      declarationEvidence: "<!-- vcg:declaration vcg-legacy-too -->",
      latestPlayedLabel: "Session 8",
      createdDate: "2026-08-29",
      proposalId: "vcg-test-conflicting-inputs-run"
    }),
  /multiple selection-evidence inputs/
);

const event = buildEventProposal({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  actor: "Linda",
  event: "Opened the door",
  evidence: "Table log",
  status: "contested",
  audience: "dm",
  timestamp: "2026-08-29T20:15:00.000Z",
  proposalId: "vcg-test-event"
});
assert.match(event.operations[0]?.contents ?? "", /Status:\*\* contested/);

expectThrow(
  () =>
    buildTranscriptionRequestProposal({
      roomPath: "1-Campaign/Sessions/Session 9",
      displayName: "Session 9",
      audioPath: "1-Campaign/Sessions/Session 9/audio.m4a",
      consentConfirmed: false,
      retention: "delete after review",
      timestamp: "2026-08-29T20:30:00.000Z",
      proposalId: "vcg-test-transcript"
    }),
  /consent must be confirmed/
);

const transcript = buildTranscriptionRequestProposal({
  roomPath: "1-Campaign/Sessions/Session 9",
  displayName: "Session 9",
  audioPath: "1-Campaign/Sessions/Session 9/audio.m4a",
  consentConfirmed: true,
  retention: "delete after review",
  timestamp: "2026-08-29T20:30:00.000Z",
  proposalId: "vcg-test-transcript"
});
assert.match(transcript.operations[0]?.contents ?? "", /Execution:\*\* not run/);

assert.equal(CONTEXT_PROFILES.length, 6);
assert.ok(CONTEXT_PROFILES.every((profile) => profile.mayWriteCanon === false));
assert.equal(CONTEXT_PROFILES.find((profile) => profile.id === "player-safe")?.audiences.includes("dm"), false);

const removedRoots = ["1-DM Toolkit", "1-Party", "1-Session Journals", "2-World-Chicago", "3-Mechanics"];
const compiledPaths = [
  ...Object.values(VAULT_PATHS),
  ...Object.values(MANAGED_NOTE_ROOTS),
  ...CONTEXT_PROFILES.flatMap((profile) => profile.roots),
  ...CONTROL_ACTIONS.map((action) => action.target ?? "").filter((target) => target.includes("/"))
];
assert.ok(compiledPaths.every((path) => removedRoots.every((root) => !path.startsWith(root))));
assert.equal(VAULT_PATHS.currentState, "1-Campaign/DM/Current State of Affairs.md");
assert.equal(VAULT_PATHS.controlWrapper, "9-System/Automation/scripts/vcg_control.py");
assert.equal(MANAGED_NOTE_ROOTS.npc, "2-World/Chicago/People/NPCs");
assert.equal(CONTROL_ACTIONS.find((action) => action.id === "open-terminal")?.protocolSafe, false);
assert.ok(CONTROL_ACTIONS.filter((action) => action.kind === "script").every((action) => !action.protocolSafe));
assert.equal(CONTROL_ACTIONS.some((action) => action.id === ["run", "tactical", "audit"].join("-")), false);

console.log("operating-tests PASS hardened invariants");
