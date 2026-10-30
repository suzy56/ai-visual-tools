# systematic-debugging rendering check

> Historical check of the preceding implementation, not acceptance of the current source-bound schema or renderer. Counts and screenshots below describe that older artifact. See [current verification](skill-optimization-verification.md).

- Author: obra.
- Original skill: https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/SKILL.md
- Reference: https://www.skillhub.club/skills/obra-superpowers-systematic-debugging
- Render command: `node /Users/pugge/.agents/skills/visualizing-skill-packages/scripts/render.mjs acceptance/systematic-debugging.graph.json --out acceptance/systematic-debugging.html`.

## Observed

- Installed local skill command produced the HTML and the browser rendered 22 nodes and 26 edges.
- Every rendered edge endpoint and label matches the generated source-backed graph.
- Author is obra; source tab preserves all 9,506 source characters exactly.
- Illustrative output shows the CI/CD signing failure case, not the old PDF Editor example. This was reproduced as wrong before the viewer update and checked as correct afterward.
- All card descriptions remain contained. Fullscreen, fit, zoom, canvas pan, node inspection and Escape were exercised.
- Inspection of the failed-fix counter shows the exact evidence: fewer than three returns to Phase 1; three or more stops for architectural discussion.
- Five existing graph regression tests pass; production bundle builds successfully.

## Artifacts

- [Interactive HTML](systematic-debugging.html)
- [Whole-graph screenshot](systematic-debugging-overview.webp)
- [Readable retry/architecture detail](systematic-debugging-detail.webp)
- [Semantic graph](systematic-debugging.graph.json)

## Fidelity boundaries

This is a semantic rendering, not a blind copy of the website. The captured site graph has 18 nodes/21 edges and contains shortcuts that disagree with the current original Skill. This rendering adds an explicit reproduction/data loop and failed-fix counter, returns fewer-than-three failures to Phase 1, and ends architecture escalation in a paused review state rather than falsely claiming resolution. Component tracing is conditional and may involve both techniques. The illustrative signing output is not an actual CI execution; no credentials, certificate imports, or debugging commands were run.
