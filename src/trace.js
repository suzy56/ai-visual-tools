/**
 * Directional transitive ancestry and descendant tracer.
 * Cycles are handled cleanly with visited sets.
 * Constraint and resource associations are excluded from execution trace.
 */
export function traceAncestorsDescendants(nodeId, edges) {
  const incoming = new Map();
  const outgoing = new Map();

  for (const edge of edges) {
    if (edge.relation === "constraint" || edge.relation === "resource") continue;
    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
    incoming.get(edge.target).push(edge.source);
    outgoing.get(edge.source).push(edge.target);
  }

  const walk = (adj) => {
    const seen = new Set();
    const stack = [nodeId];
    while (stack.length) {
      const current = stack.pop();
      for (const next of adj.get(current) || []) {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      }
    }
    return seen;
  };

  return {
    ancestors: walk(incoming),
    descendants: walk(outgoing),
  };
}
