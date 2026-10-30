# SkillHub reference acceptance

Reference: https://www.skillhub.club/skills/davepoon-buildwithclaude-skill-creator

## Exercised results

| Check | Observed result |
|---|---|
| Original skill-creator circuit | 12/12 node IDs, labels and descriptions match the captured reference |
| Original topology | 14/14 edge IDs, endpoint pairs and labels match |
| Branches and loops | New/Existing, Pass/Fail, Errors Fixed, Needs Improvement retained |
| Installed skill command | Generated `installed-skill-creator.html` from the installed personal skill; opened successfully through `file://` |
| PDF Editor parsing | 9 nodes, 8 edges; four alternative operations each point to the correct script |
| Illustrative output | ZIP name and all listed script/reference/asset names retained; marked illustrative rather than executed |
| Real UI interactions | Zoom changes viewport transform; drag pans it; fit, fullscreen/Escape and theme switching exercised |
| Evidence interaction | Node click opens its source description; hovered decision has 3 lit and 11 dimmed edges |
| Markdown file upload | Local `fixtures/pdf-editor.md` imported through the actual file input; resource verification notes remain visible |
| Long text | Descriptions remain inside chip boundaries; full text remains available in the inspector |
| Independent skill application | A fresh agent read only the skill instructions and original creator Markdown; generated a separate 12-node/15-edge graph with evidenced retry and improvement loops; rendered and opened successfully |
| Regression suite | `node --test tests/graph.test.mjs`: 5 passed, 0 failed |
| Production build | `npm run build` succeeds and emits inlined HTML |
| Review findings | CLI/browser validator divergence and unlabeled decision branches fixed through a shared validator; focused follow-up confirmed both fixes |

## Artifacts

- `installed-skill-creator.html`: output of the actual installed local skill command.
- `skill-creator.html`: exact captured graph rendered by the project copy.
- `pdf-editor.html`: conservative Markdown conversion of the supplied illustrative example.
- `agent-creator.html`: independent semantic extraction, not a copied reference graph.
- `reference-creator.webp`, `replica-creator.webp`, `replica-pdf-editor.webp`: browser captures.
- `../skillhub-reference.json`: original public DOM capture for traceability.

## Limits

This verifies a public-behavior reconstruction, not access to SkillHub's private graph extraction code or pixel-perfect CSS identity. The exact reference graph is an acceptance fixture. Semantic extraction for other topics is performed by the agent following the installed skill; direct Markdown mode is intentionally less inferential. No PDF ZIP, real PDF manipulation, or website-listed validation report was executed. Optional web fonts can fall back offline.
