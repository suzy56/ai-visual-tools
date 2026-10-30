# Skill Logic Circuit

Explains source documents through **original Markdown → Agent-audited semantic JSON → one fixed renderer**. The viewer also retains an independent reproduction of [SkillHub’s public skill-creator circuit](https://www.skillhub.club/skills/davepoon-buildwithclaude-skill-creator); that reference capture is not an automatic extraction result or an affiliation with SkillHub.

## Use

- `npm install && npm run dev` starts the development viewer at http://127.0.0.1:5173/.
- `npm run build` emits a self-contained `dist/index.html`.
- `node --test tests/*.test.mjs` runs parser, graph-contract, trace and portable-command regressions.
- `node skill/scripts/render.mjs acceptance/skill-development.graph.json --out acceptance/skill-development.html` renders a source-bound semantic graph.
- `node skill/scripts/render.mjs fixtures/skill-creator.graph.json --out acceptance/skill-creator.html` renders the captured reference, not an audited semantic interpretation.
- `node skill/scripts/render.mjs fixtures/pdf-editor.md --out acceptance/pdf-editor.html` generates a conservative Markdown preview.

The portable skill is `skill/`: its instructions and references, render command, validator, bundled source-fingerprint helper, HTML template and attribution. Node.js 18+ is needed for the command; npm and model credentials are not runtime dependencies. HTML works via `file://` without a server. Optional Google Fonts can fall back offline.

For semantic input, the command writes `<name>.html`, `<name>.source.md`, `<name>.graph.json` and `<name>.coverage.json`, with the source SHA-256 retained in graph and coverage metadata and printed to stdout. Existing input is never reformatted or overwritten, including when it already occupies the graph sidecar path. Invalid semantic metadata fails before artifacts are written. Markdown mode writes an HTML preview and source snapshot, not an audited semantic bundle.

After changing the app, run `npm run build` and copy `dist/index.html` to `skill/assets/circuit-viewer.html` before distributing the skill. The source of truth is `src/`; the HTML asset is a compiled distribution artifact.

## Extraction versus rendering

The [skill instructions](skill/SKILL.md) define the extraction and audit workflow. The shared [validator](skill/scripts/validate-graph.mjs) checks node/edge structure, evidence ranges against the retained source, source fingerprint, explicit classification and source-bound coverage. It rejects legacy `inferred` metadata rather than silently treating old proposals as source facts. Mechanical validation cannot prove that a quotation entails a relationship; the Agent must review each condition, ordering and return target.

Direct Markdown import is deliberately conservative: YAML + Markdown AST, explicit Step bodies, workflow lists and source-referenced resources. It retains nested details and the original Markdown. Ordinary unordered lists do not imply choices; a Quick Start heading alone does not turn a sequential list into alternatives. Ambiguous ordering is reported as a preview limitation. Code fences remain source data, never executed. Referenced paths remain explicitly unverified without a supplied package inventory.

Cards and relationships expose their classification, full evidence and any abstraction rationale in the inspector. Resources and constraints are contextual associations, not execution steps. Engineering recommendations require a recorded explicit user request, remain outside the graph, and state their purpose and added assumptions.

`fixtures/skill-creator.graph.json` is a capture of the **observed public graph**, including reference positions. It is an acceptance fixture, not proof of automated Markdown inference. `fixtures/skill-creator.md` is the original source from [davepoon/buildwithclaude](https://github.com/davepoon/buildwithclaude/tree/main/plugins/all-skills/skills/skill-creator), licensed under Apache-2.0; its license is retained in `skill/third-party/`.

`fixtures/pdf-editor-output.md` preserves the visible illustrative output from SkillHub. It names a ZIP, validation results and PDF resources, but none of those files are represented as actually generated or validated here. `fixtures/pdf-editor.md` is the Markdown inside that illustration.

## Acceptance

- Complete source, required stage details, permissions and resource ownership survive import/export and portable rendering.
- Semantic stages can split or group numbered sections; coverage records map the interpretation and deliberate example exclusions back to source ranges.
- Unknown failure targets remain source gaps; no invented repair edges or success endpoints.
- Branches, returns and long labels use the common renderer; directional execution tracing excludes resource/constraint associations.
- Actual generated HTML is opened in the configured existing CDP Chrome. Build success and structural checks alone are not semantic or visual acceptance.

The default reference capture has its own observed labels and positions; its shape is not a node quota for other topics.

The viewer adds JSON/Markdown import, JSON download, theme switching and an evidence inspector. It intentionally does not replicate advertisements, authentication, ratings, marketplace downloads, or claim a finished PDF-processing package.

## systematic-debugging example

`acceptance/systematic-debugging.html` explains obra's skill with its source snapshot and coverage record. The semantic interpretation preserves hypothesis/reproduction retries and explicitly pauses for human architectural review after repeated failed fixes rather than treating discussion as successful resolution. The captured public graph remains separate in `acceptance/systematic-debugging.reference.json`.

Topic metadata binds the title, source and any illustrative-output tab to the current input. A custom graph without source shows its own JSON; a graph without an illustrative result hides that tab. A diagram, source-referenced script or example output is never proof that the described business procedure ran.
