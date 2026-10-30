import { unified } from "unified";
import remarkParse from "remark-parse";
import { parse as parseYaml } from "yaml";
import { validateGraph } from "../skill/scripts/validate-graph.mjs";
import { sourceSha256 } from "../skill/scripts/source.mjs";

const parser = unified().use(remarkParse);

function plain(node) {
  return node?.value ?? (node?.children || []).map(plain).join("");
}

function sourceEvidence(lines, node, fallback = "") {
  const start = node?.position?.start?.line || 1;
  const end = node?.position?.end?.line || start;
  const quote = lines.slice(start - 1, end).join("\n");
  return `SKILL.md:${start}-${end}\n${quote || fallback}`;
}

function itemText(item) {
  return (item.children || []).filter((child) => child.type !== "list").map(plain).join(" ").replace(/\s+/g, " ").trim();
}

function labelFor(text) {
  const label = text.replace(/^\[[ x]\]\s*/i, "").split(/:\s+|\s+—\s+|\s+–\s+/)[0].trim();
  return label || text.slice(0, 90);
}

function resourcePaths(text) {
  return new Set([...text.matchAll(/(?:scripts|references|assets)\/[A-Za-z0-9_./-]+/g)].map((match) => match[0]));
}

/** Deterministic, conservative Markdown outline extraction. */
export function parseSkill(markdown, fileList = []) {
  let body = markdown;
  let metadata = {};
  let headerLines = 0;
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (frontmatter) {
    metadata = parseYaml(frontmatter[1]) || {};
    body = markdown.slice(frontmatter[0].length);
    headerLines = frontmatter[0].split(/\r?\n/).length - 1;
  }
  const ast = parser.parse(body);
  const lines = markdown.split(/\r?\n/);
  const title = String(metadata.name || ast.children.find((node) => node.type === "heading")?.children.map(plain).join("") || "Untitled skill");
  const nodes = [{ id: "input", kind: "input", basis: "abstraction", rationale: "Entry point for this document preview, not a source-stated execution trigger.", label: "USER REQUEST", description: String(metadata.description || "Read the skill instructions"), evidence: frontmatter ? sourceEvidence(lines, { position: { start: { line: 1 }, end: { line: headerLines + (frontmatter[0].endsWith("\n") ? 0 : 1) } } }) : sourceEvidence(lines, ast.children.find((node) => node.type === "heading")) }];
  const edges = [];
  const warnings = [];
  const resources = new Map();
  const addEdge = (source, target, label, relation = "flow", evidence) => edges.push({ id: `e${edges.length}`, source, target, label, relation, basis: relation === "flow" ? "abstraction" : "source", ...(relation === "flow" ? { rationale: "Conservative arrangement of source content; no unstated branch or retry is inferred." } : {}), ...(evidence ? { evidence } : {}) });
  const addResources = (owner, text, evidence) => {
    for (const path of resourcePaths(text)) {
      let resource = resources.get(path);
      if (!resource) {
        resource = { id: `file:${path}`, kind: "resource", basis: "source", label: path.split("/").pop(), description: path, path, evidence };
        resources.set(path, resource);
        nodes.push(resource);
        if (!fileList.includes(path)) warnings.push(`Unverified package path: ${path}`);
      }
      addEdge(owner, resource.id, "References", "resource", evidence);
    }
  };
  let section = "";
  let workflow = false;
  let selectionStart = null;
  let sawHeading = false;
  let previous = "input";
  let index = 0;
  const explicitStageHeadings = ast.children.filter((block) => block.type === "heading" && /^step\s+\d+\b/i.test(plain(block).trim()));
  const hasExplicitStages = explicitStageHeadings.length > 0;
  for (const block of ast.children) {
    if (block.type === "heading") {
      section = plain(block).trim();
      selectionStart = null;
      sawHeading = sawHeading || block.depth >= 2;
      workflow = block.depth >= 2 && /quick start|workflow|operations|procedure|process|流程|快速/i.test(section);
      const explicit = /^step\s+\d+\b/i.test(section) || (!hasExplicitStages && workflow && /^\d+[.):]\s*/.test(section));
      if (explicit) {
        const id = `step-${++index}`;
        const start = block.position.start.line + headerLines;
        const nextHeading = ast.children.find(node => node.type === "heading" && node.depth <= block.depth && node.position.start.line > block.position.start.line);
        const end = nextHeading ? nextHeading.position.start.line + headerLines - 1 : lines.length;
        const evidence = sourceEvidence(lines, { position: { start: { line: start }, end: { line: end } } });
        const description = lines.slice(start, end).join("\n").trim() || section;
        nodes.push({ id, kind: "processing", basis: "source", label: section, description, evidence });
        addEdge(previous, id, "Next step", "flow", evidence);
        addResources(id, description, evidence);
        previous = id;
      }
      continue;
    }
    if (block.type === "paragraph" && (workflow || !sawHeading)) {
      const instruction = plain(block).trim();
      if (/^(?:to use[^,\n]*,\s*)?(?:identify|select|choose)\b[^.\n]*\boperation (?:needed|required)\b[^.\n]*\bappropriate\b|^(?:please\s+)?(?:choose|select)\s+(?:one|an?|the)\s+(?:of\s+)?(?:the\s+)?(?:following\s+)?(?:operations?|options?)\b|^(?:请选择|选择|任选)(?:一个|一种|一项)?[^。\n]*操作/i.test(instruction))
        selectionStart = block.position.start.line + headerLines;
    }
    // Lists inside explicit stage bodies are supporting detail, not workflow stages.
    // A deterministic fallback accepts only an ordered list in a named workflow
    // section, or a document with no headings at all.
    const isWorkflowList = workflow || (!sawHeading && block.ordered);
    if (block.type !== "list" || hasExplicitStages || !isWorkflowList) continue;
    const items = block.children || [];
    for (const item of items) {
      const text = itemText(item);
      if (!text) continue;
      const id = `step-${++index}`;
      const evidence = sourceEvidence(lines, { ...item, position: { ...item.position, start: { ...item.position.start, line: item.position.start.line + headerLines }, end: { ...item.position.end, line: item.position.end.line + headerLines } } });
      const description = evidence.slice(evidence.indexOf("\n") + 1);
      nodes.push({ id, kind: "processing", basis: "source", label: labelFor(text), description, evidence });
      const alternative = selectionStart !== null;
      const orderingEvidence = alternative ? sourceEvidence(lines, { position: { start: { line: selectionStart }, end: { line: item.position.end.line + headerLines } } }) : evidence;
      if (alternative || block.ordered) addEdge(alternative ? "input" : previous, id, alternative ? "Select operation" : "Next step", "flow", orderingEvidence);
      else warnings.push("Unordered list shown as a preview without an inferred execution order or choice.");
      previous = id;
      addResources(id, description, evidence);
    }
  }
  if (nodes.length === 1) {
    const headings = ast.children.filter((node) => node.type === "heading" && node.depth === 2);
    for (const heading of headings) {
      const evidence = sourceEvidence(lines, { ...heading, position: { ...heading.position, start: { ...heading.position.start, line: heading.position.start.line + headerLines }, end: { ...heading.position.end, line: heading.position.end.line + headerLines } } });
      const id = `section-${++index}`;
      nodes.push({ id, kind: "processing", basis: "abstraction", label: plain(heading), description: "Document section; execution order is not stated.", evidence, rationale: "No explicit workflow steps were found; this is an outline-only representation." });
      addEdge("input", id, "Contains section", "flow", evidence);
    }
    warnings.push("Outline only: no explicit workflow steps detected.");
  }
  return validateGraph({ title, description: String(metadata.description || ""), sourceMarkdown: markdown, nodes, edges, warnings: [...new Set(warnings)], provenance: { kind: "preview", sourceSha256: sourceSha256(markdown), mode: "Conservative Markdown preview; semantic branches and loops require Agent-audited JSON." } });
}
