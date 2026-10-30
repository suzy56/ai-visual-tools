# Current optimization verification

Date: 2026-10-30

## Automated checks

- `node --test tests/*.test.mjs`: **24 tests, 24 passed** after the conservative-preview selection fix.
- `npm run build`: passed; final `dist/index.html` was copied to `skill/assets/circuit-viewer.html` after the theme-effect dependency fix.
- `validateGraph`: passed for backup, backup recommendation, PDF alternatives, agent-creator, skill-development (three variants), and systematic-debugging graphs.
- Renderer checksums are recorded in `acceptance/skill-optimization-renderer-checksums.json`; the renderer was held constant while regenerating the listed HTML inputs.

## Browser checks

Using the configured existing CDP Chrome and task-owned HTML pages:

- `acceptance/agent-creator.html`, `skill-development.html`, both skill-development variants, `systematic-debugging.html`, `skill-creator.html`, and `smoke-test.html` matched their graph node IDs, edge IDs and labels.
- Measured card-label, label-label, card-card and routed-path/card intersections were zero in each checked artifact.
- Source-backed artifacts showed the exact retained Markdown and matching SHA-256; the plugin graph retained the `No Packaging Needed` constraint and displayed no recommendation panel.
- A long-title branch/return/self-loop/resource stress graph produced zero measured overlaps; the PNG evidence is retained outside the repository by the browser session.
- The installed semantic delivery was opened through `file://`; its source tab matched the graph snapshot exactly, provenance showed `semantic`, and no recommendation panel appeared for the ordinary request.

## Source and delivery

- `skill/references/backup-workflow.graph.json` is a semantic split/merge example with policy and script resources, exact source evidence, coverage and an unspecified checksum-mismatch gap.
- `skill/references/backup-workflow-recommendation.graph.json` keeps the same source-backed graph and places one explicit-request recommendation outside nodes/edges.
- `skill/references/pdf-alternatives.graph.json` retains the complete `fixtures/pdf-editor.md` snapshot and isolates each operation's script.
- Installed package parity was checked for `SKILL.md`, scripts, final HTML template, references, notices and licenses after the final build. The installed package is synchronized; its generated semantic HTML was opened and checked in the configured Chrome.

## Known boundary

The installed skill cannot be committed because this working directory and its parents are not a Git repository. No repository was initialized and no commit was fabricated.
