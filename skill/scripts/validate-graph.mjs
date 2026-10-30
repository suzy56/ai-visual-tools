import { sourceSha256 } from './source.mjs';

export function validateGraph(graph) {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
    throw new Error('Graph requires nodes and edges arrays.');
  for (const field of ['title', 'description', 'author', 'sourceMarkdown', 'illustrativeOutput']) {
    if (graph[field] !== undefined && typeof graph[field] !== 'string')
      throw new Error(`Graph ${field} must be text.`);
  }
  if (graph.warnings !== undefined && (!Array.isArray(graph.warnings) || graph.warnings.some(w => typeof w !== 'string')))
    throw new Error('Graph warnings must be an array of text.');
  if (!['semantic', 'preview', 'reference'].includes(graph.provenance?.kind))
    throw new Error('Graph provenance kind must be semantic, preview, or reference.');
  if (typeof graph.provenance.mode !== 'string' || !graph.provenance.mode.trim())
    throw new Error('Graph provenance mode must be nonempty text.');
  if (graph.provenance.kind !== 'reference' && !graph.sourceMarkdown?.trim())
    throw new Error('A source snapshot is required for semantic graphs and previews.');
  if (graph.sourceMarkdown !== undefined && graph.provenance.sourceSha256 !== sourceSha256(graph.sourceMarkdown))
    throw new Error('Source snapshot SHA-256 does not match its fingerprint.');
  if (graph.provenance?.url !== undefined && (typeof graph.provenance.url !== 'string' || !/^https?:\/\//i.test(graph.provenance.url)))
    throw new Error('Graph reference URL must use http or https.');
  const ids = new Set(), kinds = new Map();
  const sourceLines = graph.sourceMarkdown?.split(/\r?\n/);
  const validateEvidence = (evidence, owner) => {
    if (typeof evidence !== 'string' || !evidence.trim())
      throw new Error(`${owner}: evidence is required.`);
    if (graph.provenance.kind === 'reference') return;
    const match = /^SKILL\.md:(\d+)-(\d+)\r?\n([\s\S]*)$/.exec(evidence);
    if (!match) throw new Error(`${owner}: evidence requires an exact source line range and quote.`);
    const start = Number(match[1]), end = Number(match[2]);
    if (start < 1 || end < start || end > sourceLines.length)
      throw new Error(`${owner}: evidence range is outside the source snapshot.`);
    if (match[3].replace(/\r\n/g, '\n') !== sourceLines.slice(start - 1, end).join('\n'))
      throw new Error(`${owner}: evidence quote does not match the source snapshot.`);
  };
  if (graph.recommendationsRequested !== undefined && typeof graph.recommendationsRequested !== 'boolean')
    throw new Error('recommendationsRequested must record an explicit request as a boolean.');
  if (graph.recommendations !== undefined) {
    if (!Array.isArray(graph.recommendations)) throw new Error('Recommendations must be a list outside the graph.');
    if (graph.recommendations.length && graph.recommendationsRequested !== true)
      throw new Error('Engineering recommendations require a recorded explicit user request.');
    for (const recommendation of graph.recommendations) {
      if (!recommendation || ['summary', 'purpose'].some(field => typeof recommendation[field] !== 'string' || !recommendation[field].trim()))
        throw new Error('Each recommendation requires a summary and purpose.');
      if (!Array.isArray(recommendation.assumptions) || recommendation.assumptions.some(assumption => typeof assumption !== 'string' || !assumption.trim()))
        throw new Error('Recommendation assumptions must be an explicit list of text.');
      if (recommendation.evidence !== undefined) validateEvidence(recommendation.evidence, 'Recommendation');
    }
  }
  const validateMetadata = (value, owner) => {
    if ('inferred' in value)
      throw new Error(`${owner}: legacy inferred metadata must be migrated to basis.`);
    if (!['source', 'abstraction'].includes(value.basis))
      throw new Error(`${owner}: basis must be source or abstraction.`);
    for (const field of ['rationale', 'evidence']) {
      if (value[field] !== undefined && typeof value[field] !== 'string')
        throw new Error(`${owner}: ${field} must be text.`);
    }
    validateEvidence(value.evidence, owner);
    if (value.basis === 'abstraction' && (!value.rationale?.trim() || !value.evidence?.trim()))
      throw new Error(`${owner}: abstraction requires nonempty rationale and evidence.`);
  };
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id || ids.has(node.id))
      throw new Error(`Missing or duplicate node ID: ${node?.id}`);
    if (!['input', 'processing', 'decision', 'config', 'output', 'resource'].includes(node.kind))
      throw new Error(`Unknown node kind: ${node.kind}`);
    if (typeof node.label !== 'string' || !node.label.trim())
      throw new Error(`Node ${node.id} requires a label.`);
    for (const field of ['description', 'evidence']) {
      if (node[field] !== undefined && typeof node[field] !== 'string')
        throw new Error(`Node ${node.id}: ${field} must be text.`);
    }
    validateMetadata(node, `Node ${node.id}`);
    if (node.position && (!Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)))
      throw new Error(`Node ${node.id}: position requires finite x and y.`);
    ids.add(node.id); kinds.set(node.id, node.kind);
  }
  const edges = new Set();
  for (const edge of graph.edges) {
    if (!edge || typeof edge.id !== 'string' || !edge.id || edges.has(edge.id))
      throw new Error(`Missing or duplicate edge ID: ${edge?.id}`);
    edges.add(edge.id);
    if (!ids.has(edge.source) || !ids.has(edge.target))
      throw new Error(`Dangling edge: ${edge.id}`);
    if (edge.label !== undefined && typeof edge.label !== 'string')
      throw new Error(`Edge ${edge.id}: label must be text.`);
    if (edge.relation !== undefined && !['flow', 'constraint', 'resource'].includes(edge.relation))
      throw new Error(`Edge ${edge.id}: relation must be flow, constraint, or resource.`);
    validateMetadata(edge, `Edge ${edge.id}`);
    if (kinds.get(edge.source) === 'decision' && !edge.label?.trim())
      throw new Error(`Decision branch ${edge.id} requires a condition label.`);
  }
  if (!ids.size) throw new Error('Graph has no nodes.');
  const coverage = graph.coverage;
  if (graph.provenance.kind === 'semantic' && !coverage)
    throw new Error('Semantic delivery requires source-bound coverage.');
  if (coverage !== undefined) {
    if (!sourceLines || !coverage || coverage.sourceSha256 !== graph.provenance.sourceSha256 || !Array.isArray(coverage.entries))
      throw new Error('Coverage must be bound to the same source snapshot.');
    const accounted = new Uint8Array(sourceLines.length);
    const coveredNodes = new Set(), coveredEdges = new Set();
    for (const entry of coverage.entries) {
      if (!entry || !Number.isInteger(entry.startLine) || !Number.isInteger(entry.endLine) || entry.startLine < 1 || entry.endLine < entry.startLine || entry.endLine > sourceLines.length)
        throw new Error('Coverage entry range is outside the source snapshot.');
      if (!['represented', 'grouped', 'example', 'gap', 'context'].includes(entry.treatment) || typeof entry.reason !== 'string' || !entry.reason.trim())
        throw new Error('Coverage entries require a treatment and reason.');
      if (!Array.isArray(entry.nodeIds) || !Array.isArray(entry.edgeIds))
        throw new Error('Coverage entries require explicit node and edge references.');
      const represented = entry.treatment === 'represented' || entry.treatment === 'grouped';
      if (!represented && (entry.nodeIds.length || entry.edgeIds.length))
        throw new Error('Coverage gaps, examples and context cannot claim represented graph objects.');
      if (represented && !entry.nodeIds.length && !entry.edgeIds.length)
        throw new Error('Represented coverage must identify graph objects.');
      for (const id of entry.nodeIds) {
        if (!ids.has(id)) throw new Error(`Coverage references an unknown node: ${id}`);
        coveredNodes.add(id);
      }
      for (const id of entry.edgeIds) {
        if (!edges.has(id)) throw new Error(`Coverage references an unknown edge: ${id}`);
        coveredEdges.add(id);
      }
      accounted.fill(1, entry.startLine - 1, entry.endLine);
    }
    if (graph.provenance.kind === 'semantic') {
      for (const id of ids) if (!coveredNodes.has(id)) throw new Error(`Coverage omits node: ${id}`);
      for (const id of edges) if (!coveredEdges.has(id)) throw new Error(`Coverage omits edge: ${id}`);
      for (let index = 0; index < sourceLines.length; index++)
        if (sourceLines[index].trim() && !accounted[index]) throw new Error(`Coverage omits source line: ${index + 1}`);
    }
  }
  return graph;
}
