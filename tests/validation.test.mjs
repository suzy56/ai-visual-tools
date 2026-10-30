import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { validateGraph } from '../skill/scripts/validate-graph.mjs';

function preview() {
  const sourceMarkdown = '# Backup\n\nObtain authorization before copying.\n';
  return {
    title: 'Backup', sourceMarkdown,
    provenance: { kind: 'preview', mode: 'Conservative source preview', sourceSha256: createHash('sha256').update(sourceMarkdown).digest('hex') },
    nodes: [{ id: 'copy', kind: 'processing', basis: 'abstraction', label: 'Copy authorized source', description: 'Obtain authorization before copying.', evidence: 'SKILL.md:3-3\nObtain authorization before copying.' }],
    edges: [],
  };
}

test('an abstraction without its source-preserving rationale is rejected', () => {
  assert.throws(() => validateGraph(preview()), /rationale/i);
});

test('missing, engineering, and legacy inference classifications cannot enter the graph', () => {
  for (const mutate of [
    node => { delete node.basis; },
    node => { node.basis = 'engineering'; },
    node => { node.inferred = false; },
  ]) {
    const graph = preview();
    graph.nodes[0].basis = 'source';
    mutate(graph.nodes[0]);
    assert.throws(() => validateGraph(graph), /basis|inferred|legacy/i);
  }
});

test('a changed source fingerprint or a quote from another source is rejected', () => {
  const changedHash = preview();
  changedHash.nodes[0].basis = 'source';
  changedHash.provenance.sourceSha256 = '0'.repeat(64);
  assert.throws(() => validateGraph(changedHash), /SHA|fingerprint|snapshot/i);
  const forgedQuote = preview();
  forgedQuote.nodes[0].basis = 'source';
  forgedQuote.nodes[0].evidence = 'SKILL.md:3-3\nCopy without authorization.';
  assert.throws(() => validateGraph(forgedQuote), /evidence|quote|source/i);
});

test('engineering recommendations require a recorded explicit request', () => {
  const graph = preview();
  graph.nodes[0].basis = 'source';
  graph.recommendations = [{ summary: 'Retry backup after a mismatch', purpose: 'Propose a repair workflow', assumptions: ['Re-running the backup is safe.'] }];
  assert.throws(() => validateGraph(graph), /request/i);
});

function semantic() {
  const graph = preview();
  graph.nodes[0].basis = 'source';
  graph.nodes.unshift({ ...graph.nodes[0], id: 'authorize', label: 'Obtain authorization' });
  graph.edges = [{ id: 'order', source: 'authorize', target: 'copy', label: 'Before copying', basis: 'source', evidence: graph.nodes[0].evidence }];
  graph.provenance.kind = 'semantic';
  graph.coverage = { sourceSha256: graph.provenance.sourceSha256, entries: [{ startLine: 1, endLine: 3, nodeIds: ['authorize', 'copy'], edgeIds: ['order'], treatment: 'represented', reason: 'Both source actions and their required order are represented.' }] };
  return graph;
}

test('semantic delivery rejects unbound coverage, omitted objects, and unaccounted source', () => {
  for (const mutate of [
    graph => { delete graph.coverage; },
    graph => { graph.coverage.sourceSha256 = '0'.repeat(64); },
    graph => { graph.coverage.entries[0].nodeIds = ['copy']; },
    graph => { graph.coverage.entries[0].edgeIds = []; },
    graph => { graph.coverage.entries[0].startLine = 3; },
    graph => { graph.coverage.entries[0].nodeIds.push('missing'); },
    graph => { graph.coverage.entries[0].treatment = 'gap'; },
  ]) {
    const graph = semantic();
    mutate(graph);
    assert.throws(() => validateGraph(graph), /coverage/i);
  }
});
