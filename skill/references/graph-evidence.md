# Graph evidence and coverage

Use the graph validator as the contract. A semantic graph is an audited interpretation of one immutable `sourceMarkdown` snapshot. Every node and edge carries exact evidence in the form `SKILL.md:start-end`, followed by the verbatim newline-preserved quote. `basis: source` means the object is directly stated; `basis: abstraction` means the object reorganizes source material without adding behavior and must include `rationale`.

Coverage is exhaustive for semantic delivery: every nonblank source line receives a `represented`, `grouped`, `example`, `gap`, or `context` entry, and every node and edge is named by a represented/grouped entry. Use `gap` when the source leaves a destination or outcome unspecified; do not invent a route to make the graph look complete. Use `example` for sample commands or code that remain data, and explain why they are not execution steps.

`flow` edges alone participate in execution tracing. `constraint` and `resource` edges provide context and evidence without creating a preceding or following action. Recommendations are outside the graph and require an explicit `recommendationsRequested: true` request.
