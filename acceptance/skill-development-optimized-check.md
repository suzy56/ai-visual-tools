# skill-development — consistent overview extraction

> Historical extraction comparison, superseded by the semantic-stage contract. One node per numbered heading is no longer a rule, and the counts below are not current acceptance. See [current verification](skill-optimization-verification.md).

Output: [skill-development-optimized.html](skill-development-optimized.html)
Graph: [skill-development-optimized.graph.json](skill-development-optimized.graph.json)
Source: [original snapshot](../fixtures/skill-development.md)

## Changes from the preceding extraction

- One overview node per original Step 1–6. Step 4's resource/documentation details and Step 6's use/notice/identify/implement sequence are retained inside their parent descriptions, at the same abstraction level as Step 5's validation checklist.
- Only the explicitly stated Step 1 skip condition is a separate routing decision. An existing skill alone does not permit bypassing investigation.
- Removed the overly restrictive improvement-request gate. User requests are a possible context, not a prerequisite excluding improvements discovered during real use.
- The source's implement-and-test-again operation is summarized inside Step 6 and by its labeled self-loop; this describes iteration, not a mandatory infinite runtime.
- No invented success terminal, validation failure route, optional reviewer gate, packaging stage, or post-iteration disclosure stage.
- Retained the source's detailed-versus-summary ordering discrepancy in warnings.
- Evidence uses concise exact source quotations with line ranges; complete original text remains in the source tab.

## Verification

The installed skill generated this file from JSON using its existing render.mjs. Browser checks observed 8 nodes and 9 edges, each edge's endpoint/label matching JSON, contained card descriptions, and the original source text preserved exactly. Fullscreen, fit and iteration evidence inspection were exercised. The renderer command, validator and HTML asset SHA-256 checksums remained unchanged; no HTML/CSS/component edits or build were used. The installed SKILL.md now enforces equal overview granularity and source modality.

The existing renderer still uses a vertical fit-to-view overview, so zoom is needed for reading every card. This task changes semantic extraction only, not visual layout behavior. The previous HTML/JSON remain available for comparison; this optimized file is the new output.
