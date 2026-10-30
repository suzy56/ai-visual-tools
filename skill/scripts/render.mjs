#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { validateGraph } from './validate-graph.mjs';
import { sourceSha256 } from './source.mjs';

const args=process.argv.slice(2);
if(args.includes('--help')||!args.length){
  console.log('Usage: node render.mjs <graph.json|SKILL.md> --out <diagram.html>\nSemantic JSON emits HTML, source, graph and coverage artifacts. Markdown emits a conservative HTML preview and source snapshot; it does not perform semantic auditing.');
  process.exit(args.length?0:1);
}
try {
  const input=resolve(args[0]);const oi=args.indexOf('--out');
  if(oi<0||!args[oi+1])throw new Error('--out <diagram.html> is required.');
  const out=resolve(args[oi+1]);if(out===input)throw new Error('Output must not overwrite the input.');
  if(!out.endsWith('.html'))throw new Error('Output must have an .html extension.');
  const text = await readFile(input, 'utf8');
  if (!text.trim()) throw new Error('Source input must not be empty.');
  let payload, key;
  if (input.endsWith('.json')) {
    payload = validateGraph(JSON.parse(text));
    key = '__SKILL_CIRCUIT__';
  } else {
    payload = text;
    key = '__SKILL_MARKDOWN__';
  }
  const snapshot = key === '__SKILL_MARKDOWN__' ? text : payload.sourceMarkdown;
  const serialized = JSON.stringify(payload).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const template = await readFile(new URL('../assets/circuit-viewer.html', import.meta.url), 'utf8');
  const html = template.replace('<head>', `<head><script>window.${key}=${serialized};</script>`);
  const prefix = out.slice(0, -5);
  const artifacts = [];
  if (snapshot !== undefined) artifacts.push([`${prefix}.source.md`, snapshot]);
  if (key === '__SKILL_CIRCUIT__') {
    artifacts.push([`${prefix}.graph.json`, `${JSON.stringify(payload, null, 2)}\n`]);
    if (payload.coverage) artifacts.push([`${prefix}.coverage.json`, `${JSON.stringify(payload.coverage, null, 2)}\n`]);
  }
  artifacts.push([out, html]);
  await mkdir(dirname(out), { recursive: true });
  for (const [path, content] of artifacts) {
    if (path !== input) await writeFile(path, content);
  }
  const kind = key === '__SKILL_MARKDOWN__' ? 'preview' : payload.provenance.kind;
  console.log(`Rendered ${out}\nMode: ${kind}. Source content is displayed, never executed.`);
  if (snapshot !== undefined) console.log(`Source SHA-256: ${sourceSha256(snapshot)}`);
}catch(error){console.error(`Render failed: ${error.message}`);process.exitCode=1}
