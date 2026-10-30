# skill-development: source-to-graph coverage

> Historical coverage notes, not the current machine-checkable coverage record. In particular, the improvement-request gate described below was a mistaken restriction and has been removed. Current mappings are in `skill-development.coverage.json`; observed checks are in [current verification](skill-optimization-verification.md).

Source: https://github.com/anthropics/claude-plugins-official/blob/main/plugins/plugin-dev/skills/skill-development/SKILL.md
Snapshot: `../fixtures/skill-development.md`. Graph: `skill-development.graph.json`. Output: `skill-development.html`.

## Backbone and granularity

The primary backbone is **Skill Creation Process**, Steps 1–6. This is a semantic extraction of that workflow, not a graph copied from another website. Each JSON node and edge includes exact source text and line ranges. The source is embedded unchanged in the HTML source tab.

| Original source | Graph representation |
|---|---|
| Frontmatter trigger, lines 1–5 | request input |
| Step 1, lines 91–106 | explicit understood/skip condition and understand concrete examples |
| Step 2, lines 108–135 | plan reusable resources; illustrative PDF/frontend/query examples remain source examples, not executable graph stages |
| Step 3, lines 137–146 | create plugin skill structure manually, no init_skill.py |
| Step 4, lines 148–210 | reusable contents first, then SKILL.md; writing/frontmatter/disclosure rules remain attached descriptions/evidence |
| Step 5, lines 212–230 | validation/test node with all eight checks and skill-reviewer |
| Plugin testing, lines 282–292 | local plugin/trigger testing is attached to validation, not an invented new stage |
| Validation Checklist, lines 415–449 | supporting validation requirements attached to the same node |
| Step 6, lines 232–247 | real tasks → requested improvement iteration: notice struggles → identify updates → implement changes/test again |
| No Packaging Needed, lines 278–280 | constraint; no ZIP/output-packaging action added |
| Definitions, discovery model, file organization, examples and writing guidance | supporting context and embedded original source, not extra runtime stages |
| Final Implementation Workflow, lines 621–637 | alternate summary preserved in original text; its write-before-add-resources ordering differs from detailed Step 4 and is explicitly recorded in graph warnings |

## Fidelity limits explicitly retained

- The source permits skipping inapplicable stages for a clear reason but gives only Step 1 a specific skip predicate. No arbitrary skip routes were invented.
- The detailed Step 4 says to start with reusable contents; the final summary says Write SKILL.md before Add resources. The graph follows the detailed numbered section and records this discrepancy rather than blending the two.
- Iteration occurs in the context of improvements after real use. The graph does not invent a negative outcome, completed terminal, validation-failure retry, or guarantee that testing passes.
- Optional resources remain optional; diagrams of example packages are not represented as actual created files.
- No illustrative result was supplied by the original Skill. No result was invented; the viewer hides that tab.

## Standardization correction

The prior failure was source/diagram conflation: reading another generated graph, adding convenient outcomes, and changing presentation for each case. The updated installed skill instead requires original source → evidence-linked JSON → semantic audit → unchanged renderer → browser verification. The original skill is data; its shell commands are never executed as part of visualization.

Renderer checksums before and after are saved separately in `skill-development-render-proof.json`. No HTML, CSS, React component, renderer command or validator is modified for this case. Updating the installed `SKILL.md` changes the extraction procedure only.

## Verification result

- Final graph: 13 nodes and 14 edges, all carrying source quotations and line ranges.
- Independent source review required an explicit improvement-request guard; it was added in JSON only. Follow-up confirmed the conditional iteration and absence of an invented no-improvement/output edge match the source.
- Browser: all 14 edge endpoints/labels match JSON; descriptions stay within chips; source tab preserves the original text; zoom, fit, fullscreen/Escape and evidence inspection were exercised.
- No fabricated illustrative output: the output tab is absent for this source.
- SHA-256 checks confirm the installed render command, validator and bundled HTML template are identical before and after this task. No build or case-specific HTML patch was used.
- Rule application audit confirmed no borrowed packaging/initialization, no unspecified validation retries, explicit treatment of conflicting source order, and JSON-only rendering changes.
