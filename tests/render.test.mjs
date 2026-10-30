import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

async function deployment(t) {
  const root = await mkdtemp(join(tmpdir(), 'skill-delivery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await cp(new URL('../skill/', import.meta.url), join(root, 'skill'), { recursive: true });
  const graph = JSON.parse(await readFile(new URL('../acceptance/agent-creator.graph.json', import.meta.url), 'utf8'));
  const input = join(root, 'input.graph.json');
  await writeFile(input, JSON.stringify(graph));
  return { root, input, graph, command: join(root, 'skill/scripts/render.mjs'), output: join(root, 'delivery.html') };
}

test('portable rendering delivers source-bound artifacts without project dependencies', async t => {
  const run = await deployment(t);
  const result = spawnSync(process.execPath, [run.command, run.input, '--out', run.output], { cwd: run.root, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  const snapshot = await readFile(join(run.root, 'delivery.source.md'), 'utf8');
  const original = await readFile(new URL('../fixtures/skill-creator.md', import.meta.url), 'utf8');
  assert.equal(snapshot, original);
  const digest = createHash('sha256').update(snapshot).digest('hex');
  const graph = JSON.parse(await readFile(join(run.root, 'delivery.graph.json'), 'utf8'));
  const coverage = JSON.parse(await readFile(join(run.root, 'delivery.coverage.json'), 'utf8'));
  assert.equal(graph.provenance.sourceSha256, digest);
  assert.equal(coverage.sourceSha256, digest);
  assert.ok(graph.nodes.every(node => node.basis === 'source' || node.basis === 'abstraction'));
  assert.ok(graph.nodes.every(node => !('inferred' in node)));
});

test('incomplete semantic delivery is rejected before writing artifacts and preserves its input', async t => {
  const run = await deployment(t);
  delete run.graph.coverage;
  const original = JSON.stringify(run.graph);
  await writeFile(run.input, original);
  const result = spawnSync(process.execPath, [run.command, run.input, '--out', run.output], { cwd: run.root, encoding: 'utf8', timeout: 10000 });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /coverage/i);
  await assert.rejects(readFile(run.output), { code: 'ENOENT' });
  await assert.rejects(readFile(join(run.root, 'delivery.source.md')), { code: 'ENOENT' });
  assert.equal(await readFile(run.input, 'utf8'), original);
});

test('rendering beside the source graph does not rewrite the supplied input', async t => {
  const run = await deployment(t);
  const input = join(run.root, 'delivery.graph.json');
  const original = JSON.stringify(run.graph);
  await writeFile(input, original);
  const result = spawnSync(process.execPath, [run.command, input, '--out', run.output], { cwd: run.root, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(input, 'utf8'), original);
  assert.equal(await readFile(join(run.root, 'delivery.source.md'), 'utf8'), run.graph.sourceMarkdown);
});

test('an empty Markdown source is rejected rather than generating an unusable HTML preview', async t => {
  const run = await deployment(t);
  const input = join(run.root, 'empty.md');
  await writeFile(input, ' \n\t');
  const result = spawnSync(process.execPath, [run.command, input, '--out', run.output], { cwd: run.root, encoding: 'utf8', timeout: 10000 });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /empty|source/i);
  await assert.rejects(readFile(run.output), { code: 'ENOENT' });
  assert.equal(await readFile(input, 'utf8'), ' \n\t');
});
