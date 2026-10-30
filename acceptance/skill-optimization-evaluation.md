# Skill optimization evaluation

## Scope

This report evaluates the revised `skill/SKILL.md` against the requested audit contract. The old skill was left unchanged in the baseline evidence; this report does not claim the old acceptance artifacts are newly regenerated.

## Micro-sample evidence

The identical prompt was run through the completion API in fresh calls before editing:

- Control (no skill): 5 successful samples.
- Old `skill/SKILL.md`: 5 successful samples.
- Revised `skill/SKILL.md`: 5 successful samples.

Prompt required independently inspectable authorization and backup stages, completion criteria, checksum-failure gap handling, no script execution, and an answer about whether recommendations were requested. Full raw responses are retained at `local://skill-baseline-evidence.json` and `local://skill-new-evidence.json`; these are evidence artifacts, not claims that every response used identical wording.

Observed baseline: control and old-skill samples generally produced two stages and completion criteria, but varied in whether they explicitly named an unresolved failure destination and whether recommendations were absent. Revised samples consistently named authorization and backup as separate stages, preserved the checksum gap/no invented recovery path, and explicitly reported that no recommendation was requested. This is a wording-behavior observation from 5+5+5 samples, not a proof of all future calls.

## Scenario evidence

The revised skill was applied in two additional completion calls:

- Plugin development: the scenario retained “No Packaging Needed” as a constraint and did not turn it into a packaging action.
- Debugging: the scenario retained the human architecture-review pause as unresolved rather than a successful terminal state.

Raw outputs are retained at `local://skill-scenario-evidence.json`. Scripts described by source material were not executed.

## Audited acceptance artifacts

- `skill/references/backup-workflow.graph.json` + `.SKILL.md`: semantic split into authorization, permission/policy resource, backup script, and checksum decision. Permissions, `references/policy.md`, `scripts/backup.sh`, and the unspecified checksum-failure destination are retained; no failure route is invented.
- `skill/references/pdf-alternatives.graph.json` + `.SKILL.md`: four explicit alternatives retain their own `rotate_pdf.py`, `merge_pdfs.py`, `extract_text.py`, and `compress_pdf.py` association. The source states alternatives; the graph does not merge scripts or execute examples.
- The backup graph demonstrates semantic split and ordered merge coverage: every nonblank source line is covered, and each flow edge has its own evidence and abstraction rationale.
- The PDF graph demonstrates alternative branching without treating unrelated scripts as one operation.

## Existing migrated acceptance audit (report only)

Reviewed `acceptance/agent-creator.graph.json`, `acceptance/skill-development.graph.json`, `acceptance/skill-development-optimized.graph.json`, and `acceptance/systematic-debugging.graph.json` against their retained source snapshots and fixture intent.

- All four visibly use the current `basis`/evidence style and retain source snapshots plus hashes and coverage sections in the inspected files.
- `agent-creator` correctly retains source-authorized packaging as a workflow operation; this must not be generalized to plugin development.
- `skill-development` and its optimized variant retain the source’s explicit `No Packaging Needed` constraint and source resource references; this is the expected plugin behavior.
- `systematic-debugging` separates the three-fix threshold, architecture discussion, and unresolved human pause; the inspected graph text explicitly says the pause is not success.
- This was a source/fixture audit, not a new validator, renderer, browser, build, test, or lint run. Parent should run the authoritative validator/CLI smoke and final cross-topic acceptance checks.

## Honest limits

The completion micro-samples demonstrate the requested authorization/backup behavior and recommendation boundary only. They do not establish complete semantic correctness for arbitrary skills. The new graph examples were authored with exact snapshot evidence and hashes, but their validator/renderer execution is intentionally left to the parent’s final verification phase.
