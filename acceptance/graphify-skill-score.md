# graphify local skill render score

Date: 2026-10-30

## Input

- Installed source: `/Users/pugge/.agents/skills/graphify/SKILL.md`
- Snapshot: 1,193 lines / 48,399 bytes
- SHA-256: `8ced269b8a52d43b9feb409af80694fce7448c0e8433003111e0059d187aa25c`
- Output: `acceptance/graphify-skill.html`
- Source sidecar: `acceptance/graphify-skill.source.md`

## Observed result

- Mode: conservative Markdown `preview`
- Nodes: 10 total: request plus nine explicit Step headings
- Edges: 9 sequential preview edges
- Card/label overlaps: 0
- Label/label overlaps: 0
- Source tab: exact snapshot match
- SHA-256 display: match
- Stage inspection: Step 3 retained its full long body in the inspector
- No source-described graphify commands, package installs, LLM extraction, Neo4j pushes or watchers were executed

## Score

**Overall: 7.5 / 10** for this preview delivery.

| Dimension | Score | Reason |
|---|---:|---|
| Source fidelity | 10/10 | Complete 1,193-line snapshot, exact source tab and matching hash. |
| Visual readability | 9/10 | Nine ordered stages rendered without measured card/label collisions; long Step 3 remains inspectable. |
| Stage outline | 8/10 | Explicit Step 1–9 headings are retained as a readable sequence. |
| Semantic completeness | 5/10 | Preview does not model `--mode`, size thresholds, opt-in flags, parallel extraction, retry/iteration, or Neo4j/MCP/watch branches as decisions. |
| Resource/context mapping | 6/10 | Source text remains available, but referenced files and command outputs are not independently represented or verified in Markdown mode. |
| Safety/provenance | 10/10 | Preview status is explicit and the described operational commands were treated as source data. |

The preview is strong as a source-preserving outline and intentionally not equivalent to a semantic audit. A semantic delivery should be produced from the complete installed skill with exact edge evidence, coverage entries for conditional branches and examples, and explicit separation of source facts from abstractions. The current score does not claim the graphify workflow itself is correct or that any of its commands ran successfully.
