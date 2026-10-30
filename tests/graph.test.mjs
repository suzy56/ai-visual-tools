import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseSkill } from '../src/graph.js';
import { validateGraph } from '../skill/scripts/validate-graph.mjs';
import { traceAncestorsDescendants } from '../src/trace.js';

function referenceGraph(nodes, edges = []) {
  const metadata = { basis: 'source', evidence: 'Synthetic reference graph for import boundary checks.' };
  return { provenance: { kind: 'reference', mode: 'Import boundary fixture' }, nodes: nodes.map(node => ({ ...metadata, ...node })), edges: edges.map(edge => ({ ...metadata, ...edge })) };
}

test('PDF operations are alternatives, and each routes only to its script',async()=>{
  const md=await readFile(new URL('../fixtures/pdf-editor.md',import.meta.url),'utf8');
  const g=parseSkill(md);
  for(const [label,path] of [['Rotation','scripts/rotate_pdf.py'],['Merging','scripts/merge_pdfs.py'],['Text Extraction','scripts/extract_text.py'],['Compression','scripts/compress_pdf.py']]){
    const op=g.nodes.find(n=>n.label===label);assert.ok(op,label);
    assert.ok(g.edges.some(e=>e.source==='input'&&e.target===op.id));
    assert.deepEqual(g.edges.filter(e=>e.source===op.id).map(e=>e.target),['file:'+path]);
  }
  assert.equal(g.edges.filter(e=>/^step-/.test(e.source)&&/^step-/.test(e.target)).length,0);
});
test('fenced example Markdown is not treated as workflow and multiline YAML is parsed',()=>{
  const g=parseSkill('---\nname: test\ndescription: >\n  first line\n  second line\n---\n# Test\n\n```md\n## Workflow\n1. forged step\n```\n\n## Workflow\n1. Real first\n2. Real second');
  assert.match(g.description,/first line second line/);
  assert.ok(!g.nodes.some(n=>n.label.includes('forged')));
  assert.ok(g.edges.some(e=>e.source==='step-1'&&e.target==='step-2'));
});
test('shared resources are deduplicated and unavailable paths stay explicit',()=>{
  const md='# Shared\n## Quick Start\n- **One**: Use `scripts/a.py`\n- **Two**: Use `scripts/a.py`';
  const g=parseSkill(md,['scripts/a.py']);assert.equal(g.nodes.filter(n=>n.path==='scripts/a.py').length,1);
  assert.ok(!g.warnings.some(warning=>warning.includes('scripts/a.py')));
  assert.ok(parseSkill(md).warnings.some(warning=>/Unverified package path/.test(warning)&&warning.includes('scripts/a.py')));
});
test('graph import rejects dangling edges, duplicate IDs, and unknown relations',()=>{
  const n={id:'a',kind:'input',label:'A'};
  assert.throws(()=>validateGraph(referenceGraph([n,n])),/duplicate/);
  assert.throws(()=>validateGraph(referenceGraph([n],[{id:'e',source:'a',target:'absent'}])),/Dangling/);
  assert.throws(()=>validateGraph(referenceGraph([n],[{id:'e',source:'a',target:'a',relation:'unknown'}])),/relation/);
});

test('unlabeled decision outcomes and unrenderable field types are rejected',()=>{
  const graph=referenceGraph([{id:'check',kind:'decision',label:'Check'},{id:'done',kind:'output',label:'Done'}],[{id:'result',source:'check',target:'done'}]);
  assert.throws(()=>validateGraph(graph),/condition label/);
  graph.edges[0].label='Pass';
  graph.nodes[0].description={text:'not renderable'};
  assert.throws(()=>validateGraph(graph),/description must be text/);
  graph.nodes[0].description='Check the result';
  graph.nodes[0].position={x:null,y:0};
  assert.throws(()=>validateGraph(graph),/finite x and y/);
});

test('ordered workflow extraction uses source evidence and never hardcodes plugin stages',()=>{
  const g=parseSkill('# Backup\n\n1. Copy the backup\n2. Verify the archive');
  assert.deepEqual(g.nodes.filter((node)=>node.kind==='processing').map((node)=>node.label),['Copy the backup','Verify the archive']);
  assert.ok(!g.nodes.some((node)=>/plugin|skill-reviewer|progressive disclosure/i.test(node.label)));
  assert.match(g.nodes.find(node => node.id === 'step-1').description, /Copy the backup/);
  assert.equal(g.edges.find(edge => edge.source === 'input' && edge.target === 'step-1').relation, 'flow');
  assert.equal(validateGraph(g), g);
});



test('directional trace correctly separates ancestors and descendants, handles cycles, and ignores associations', () => {
  const edges = [
    { id: 'e1', source: 'root', target: 'branchA' },
    { id: 'e2', source: 'root', target: 'branchB' },
    { id: 'e3', source: 'branchA', target: 'stepA2' },
    { id: 'e4', source: 'stepA2', target: 'branchA' }, // feedback cycle
    { id: 'e5', source: 'stepA2', target: 'endA' },
    { id: 'e6', source: 'branchB', target: 'endB' },
    { id: 'c1', source: 'config', target: 'branchA', relation: 'constraint' },
    { id: 'r1', source: 'branchA', target: 'res1', relation: 'resource' },
  ];

  const traceA = traceAncestorsDescendants('branchA', edges);
  // Ancestors of branchA: root, stepA2 (via cycle); NOT config (constraint ignored)
  assert.ok(traceA.ancestors.has('root'));
  assert.ok(traceA.ancestors.has('stepA2'));
  assert.ok(!traceA.ancestors.has('config'), 'constraint association should not be an ancestor');
  assert.ok(!traceA.ancestors.has('branchB'), 'sibling branch should not be an ancestor');

  // Descendants of branchA: stepA2, endA, branchA (via cycle); NOT res1 (resource ignored)
  assert.ok(traceA.descendants.has('stepA2'));
  assert.ok(traceA.descendants.has('endA'));
  assert.ok(!traceA.descendants.has('res1'), 'resource association should not be a descendant');
  assert.ok(!traceA.descendants.has('branchB'), 'sibling branch should not be a descendant');
  assert.ok(!traceA.descendants.has('endB'), 'sibling descendant should not be a descendant');
});

test('Markdown preview preserves the exact source snapshot through JSON export', () => {
  const markdown = '---\r\nname: 备份\r\ndescription: Keep permissions\r\n---\r\n# Backup\r\n\r\n## Step 1: Prepare\r\nRequire authorization before copying.\r\n';
  const exported = JSON.parse(JSON.stringify(parseSkill(markdown)));
  assert.equal(exported.sourceMarkdown, markdown);
});

test('source fingerprint binds the exact Unicode and line-ending snapshot', async () => {
  const { createHash } = await import('node:crypto');
  const markdown = '# 备份\r\n\r\n1. Require authorization\r\n2. Save the archive\r\n';
  const graph = parseSkill(markdown);
  assert.equal(graph.provenance.sourceSha256, createHash('sha256').update(markdown).digest('hex'));
});

test('explicit stage details retain permissions, nested instructions, and owning resources', () => {
  const markdown = '# Backup\n\n## Step 1: Prepare\nRequire authorization before accessing the source.\n\n1. Read `references/policy.md`.\n   - Retain the access restrictions.\n2. Run `scripts/backup.sh` only after approval.\n\n## Step 2: Verify\nCompare the restored checksum.\n';
  const graph = parseSkill(markdown, ['references/policy.md', 'scripts/backup.sh']);
  const prepare = graph.nodes.find(node => node.label === 'Step 1: Prepare');
  assert.match(prepare.description, /Require authorization before accessing/);
  assert.match(prepare.description, /Retain the access restrictions/);
  assert.match(prepare.description, /only after approval/);
  assert.match(prepare.evidence, /Retain the access restrictions/);
  const resources = graph.edges.filter(edge => edge.source === prepare.id && edge.relation === 'resource');
  assert.deepEqual(resources.map(edge => graph.nodes.find(node => node.id === edge.target).path).sort(), ['references/policy.md', 'scripts/backup.sh']);
  assert.ok(!graph.edges.some(edge => edge.source !== prepare.id && resources.some(resource => resource.target === edge.target)));
});

test('an ordinary unordered workflow list does not create execution choices', () => {
  const graph = parseSkill('# Setup\n\n## Workflow\n- Load the configuration\n- Validate the configuration\n');
  assert.deepEqual(graph.edges.filter(edge => edge.relation === 'flow'), []);
  assert.match(graph.warnings.join('\n'), /order|ambiguous|preview/i);
});

test('an ordered Quick Start stays sequential without an explicit selection instruction', () => {
  const graph = parseSkill('# Setup\n\n## Quick Start\n1. Load the configuration\n2. Validate the configuration\n');
  const load = graph.nodes.find(node => node.description.includes('Load the configuration'));
  const validate = graph.nodes.find(node => node.description.includes('Validate the configuration'));
  assert.ok(graph.edges.some(edge => edge.source === load.id && edge.target === validate.id && edge.relation === 'flow'));
  assert.ok(!graph.edges.some(edge => edge.source === 'input' && edge.target === validate.id));
});

test('workflow list stages retain nested conditions and resource ownership', () => {
  const markdown = '# Backup\n\n## Workflow\n1. Obtain authorization.\n   - Read `references/policy.md` before accessing the source.\n   - Run `scripts/backup.sh` only after approval.\n2. Verify the archive.\n';
  const graph = parseSkill(markdown);
  const prepare = graph.nodes.find(node => node.kind === 'processing' && node.description.includes('Obtain authorization'));
  assert.match(prepare.description, /before accessing the source/);
  assert.match(prepare.description, /only after approval/);
  const resources = graph.edges.filter(edge => edge.source === prepare.id && edge.relation === 'resource');
  assert.deepEqual(resources.map(edge => graph.nodes.find(node => node.id === edge.target).path).sort(), ['references/policy.md', 'scripts/backup.sh']);
});

test('frontmatter-only source without a terminal newline retains valid source evidence', () => {
  const markdown = '---\nname: metadata-only\n---';
  const graph = parseSkill(markdown);
  assert.equal(graph.sourceMarkdown, markdown);
  assert.equal(graph.nodes[0].evidence, `SKILL.md:1-3\n${markdown}`);
});

test('selecting a workflow argument does not turn ordered actions into alternatives', () => {
  const graph = parseSkill('# Copy workflow\n\n## Workflow\nChoose a destination directory.\n1. Copy files\n2. Verify the copy\n');
  const actions = graph.nodes.filter(node => node.kind === 'processing');
  assert.ok(graph.edges.some(edge => edge.source === actions[0].id && edge.target === actions[1].id));
  assert.equal(graph.edges.filter(edge => edge.source === 'input' && edge.target.startsWith('step-')).length, 1);
});
