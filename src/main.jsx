import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useNodesState,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import {
  Zap,
  Cpu,
  GitBranch,
  LogIn,
  LogOut,
  FileCode2,
  Layers,
  Maximize2,
  Minimize2,
  Moon,
  Sun,
  Download,
  Upload,
  ArrowUpRight,
  X,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import "./style.css";
import reference from "../fixtures/skill-creator.graph.json";
import creatorMd from "../fixtures/skill-creator.md?raw";
import pdfMd from "../fixtures/pdf-editor.md?raw";
import pdfOutput from "../fixtures/pdf-editor-output.md?raw";
import { parseSkill } from './graph.js';
import { validateGraph } from '../skill/scripts/validate-graph.mjs';
import { traceAncestorsDescendants } from './trace.js';
export { traceAncestorsDescendants };

const icons = {
  input: LogIn,
  processing: Cpu,
  decision: GitBranch,
  config: Layers,
  output: LogOut,
  resource: FileCode2,
};
function Chip({ data, selected }) {
  const Icon = icons[data.kind] || Cpu;
  const basis = data.basis === "abstraction" ? "abstraction" : "source";
  return (
    <div className={`chip ${data.kind} ${selected ? "selected" : ""} ${data.visualState || ""} basis-${basis}`}>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="target" position={Position.Left} id="left-target" />
      <div className="chip-top">
        <span className="chip-icon"><Icon size={15} /></span>
        <div>
          <h3 title={data.label}>{data.label}</h3>
          <span className="chip-kind">{data.kind} · {basis}</span>
        </div>
      </div>
      <p>{data.description}</p>
      {basis === "abstraction" && <span className="inference-mark" title="Source-preserving abstraction; click for rationale and evidence">A</span>}
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="source" position={Position.Left} id="left-source" />
    </div>
  );
}
const nodeTypes = { chip: Chip };
const NODE_WIDTH = 260;

function estimateNodeHeight(node) {
  const labelLines = Math.max(1, Math.ceil((node.label || "").length / 31));
  const descriptionLines = Math.min(5, Math.max(1, Math.ceil((node.description || "").length / 43)));
  return Math.max(126, 98 + labelLines * 16 + descriptionLines * 15);
}

function nodeRect(node) {
  const measured = node.measured || {};
  const width = measured.width || node.width || NODE_WIDTH;
  const height = measured.height || node.height || estimateNodeHeight(node.data || node);
  const position = node.position || { x: 0, y: 0 };
  return { id: node.id, x: position.x, y: position.y, width, height };
}

function intersects(a, b, padding = 0) {
  return a.x < b.x + b.width + padding && a.x + a.width > b.x - padding &&
    a.y < b.y + b.height + padding && a.y + a.height > b.y - padding;
}

function placeMeasuredLabels(root) {
  if (!root) return;
  const viewport = root.querySelector('.react-flow__viewport');
  if (!viewport) return;
  const matrix = new DOMMatrix(getComputedStyle(viewport).transform);
  const origin = viewport.getBoundingClientRect();
  const scale = matrix.a || 1;
  const cards = [...root.querySelectorAll('.react-flow__node')].map((element) => {
    const rect = element.getBoundingClientRect();
    return { x: (rect.x - origin.x) / scale, y: (rect.y - origin.y) / scale, width: rect.width / scale, height: rect.height / scale };
  });
  const occupied = [];
  const edgeMap = new Map([...root.querySelectorAll('.react-flow__edge')].map((edge) => [edge.dataset.id, edge]));
  for (const element of root.querySelectorAll('.edge-label')) {
    const edge = edgeMap.get(element.dataset.edgeId);
    const path = edge?.querySelector('.react-flow__edge-path');
    if (!path) continue;
    const length = path.getTotalLength();
    const width = element.offsetWidth, height = element.offsetHeight;
    const fits = (point) => {
      const rect = { x: point.x - width / 2, y: point.y - height / 2, width, height };
      return !cards.some((card) => intersects(rect, card, 14)) && !occupied.some((label) => intersects(rect, label, 12)) ? rect : null;
    };
    let point, rect, anchor;
    const fractions = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9];
    for (let distance = 0; !rect; distance += 20) {
      for (const fraction of fractions) {
        const base = path.getPointAtLength(length * fraction);
        const offsets = distance ? [[distance, 0], [-distance, 0], [0, distance], [0, -distance]] : [[0, 0]];
        for (const [dx, dy] of offsets) {
          const candidate = { x: base.x + dx, y: base.y + dy };
          rect = fits(candidate);
          if (rect) { point = candidate; anchor = base; break; }
        }
        if (rect) break;
      }
    }
    occupied.push(rect);
    element.style.transform = `translate(-50%, -50%) translate(${point.x}px,${point.y}px)`;
    let leader = edge.querySelector('.label-leader');
    if (!leader) {
      leader = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      leader.classList.add('label-leader');
      leader.setAttribute('fill', 'none');
      leader.setAttribute('pointer-events', 'none');
      edge.append(leader);
    }
    leader.setAttribute('d', Math.hypot(point.x - anchor.x, point.y - anchor.y) > 10 ? `M ${anchor.x} ${anchor.y} L ${point.x} ${point.y}` : '');
    leader.style.stroke = path.style.stroke;
    leader.style.opacity = path.style.opacity;
    leader.style.strokeWidth = '1';
    leader.style.strokeDasharray = '3 3';
  }
}

function layout(graph, preserve = true, measured = new Map()) {
  if (preserve && graph.nodes.every((n) => n.position))
    return graph.nodes.map((n) => ({ id: n.id, type: "chip", position: n.position, data: n }));
  const d = new dagre.graphlib.Graph();
  d.setGraph({ rankdir: "TB", nodesep: 110, ranksep: 110, edgesep: 70, marginx: 50, marginy: 50 });
  d.setDefaultEdgeLabel(() => ({}));
  graph.nodes.forEach((n) => d.setNode(n.id, { width: NODE_WIDTH, height: measured.get(n.id) || estimateNodeHeight(n) }));
  graph.edges.filter((e) => e.relation !== "constraint" && e.relation !== "resource").forEach((e) => d.setEdge(e.source, e.target));
  dagre.layout(d);
  return graph.nodes.map((n) => {
    const h = measured.get(n.id) || estimateNodeHeight(n);
    return { id: n.id, type: "chip", position: { x: d.node(n.id).x - NODE_WIDTH / 2, y: d.node(n.id).y - h / 2 }, data: n };
  });
}

function deriveEdgeRouting(edges, nodes) {
  const rectMap = new Map(nodes.map((node) => [node.id, nodeRect(node)]));
  const rects = [...rectMap.values()];
  const minX = Math.min(0, ...rects.map((r) => r.x));
  const maxX = Math.max(NODE_WIDTH, ...rects.map((r) => r.x + r.width));
  let leftLane = 0, rightLane = 0;
  return edges.filter((edge) => rectMap.has(edge.source) && rectMap.has(edge.target)).map((edge) => {
    const source = rectMap.get(edge.source), target = rectMap.get(edge.target);
    const isSelf = edge.source === edge.target;
    const upward = !isSelf && source && target && target.y < source.y;
    const useRight = isSelf ? source.x + source.width / 2 >= (minX + maxX) / 2 : source?.x >= target?.x;
    const laneX = useRight ? maxX + 100 + rightLane++ * 60 : minX - 100 - leftLane++ * 60;
    return { ...edge, type: 'logic',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      data: { ...edge.data, rawEdge: edge, relation: edge.relation || 'flow', isSelf, upward, useRight, laneX, nodeRects: rects } };
  });
}

function LogicEdge({ id, source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, label, data }) {
  const isSelf = data?.isSelf;
  const upward = data?.upward;
  const laneX = data?.laneX ?? (Math.min(sourceX, targetX) - 60);
  const nodeRects = data?.nodeRects;
  const path = useMemo(() => {
    const exteriorPath = `M ${sourceX} ${sourceY} L ${sourceX} ${sourceY + 35} L ${laneX} ${sourceY + 35} L ${laneX} ${targetY - 35} L ${targetX} ${targetY - 35} L ${targetX} ${targetY}`;
    if (isSelf || upward) return exteriorPath;
    const curve = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, curvature: 0.28 })[0];
    const geometry = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    geometry.setAttribute('d', curve);
    const length = geometry.getTotalLength();
    for (let distance = 0; distance <= length; distance += 8) {
      const point = geometry.getPointAtLength(distance);
      if (nodeRects?.some((rect) => rect.id !== source && rect.id !== target && point.x > rect.x - 10 && point.x < rect.x + rect.width + 10 && point.y > rect.y - 10 && point.y < rect.y + rect.height + 10)) return exteriorPath;
    }
    return curve;
  }, [source, target, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, isSelf, upward, laneX, nodeRects]);
  const point = data?.labelPoint || { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
  return (<>
    <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
    {label && <EdgeLabelRenderer><div data-edge-id={id} className={`edge-label ${data?.relation || "flow"} ${data?.basis === "abstraction" ? "abstraction" : "source"} ${data?.visualState || ""}`}
      onClick={(event) => { event.stopPropagation(); data?.onSelect?.(); }}
      style={{ transform: `translate(-50%, -50%) translate(${point.x}px,${point.y}px)`, pointerEvents: "all", cursor: "pointer" }}
      title={data?.basis === "abstraction" ? "Source-preserving abstraction; click for rationale and evidence" : label}>{data?.basis === "abstraction" ? "Abstract · " : ""}{label}</div></EdgeLabelRenderer>}
  </>);
}

const edgeTypes = { logic: LogicEdge };

function Circuit({ graph, dark }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(layout(graph));
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const flow = useRef(null);
  const shell = useRef(null);
  const arrange = useCallback(() => placeMeasuredLabels(shell.current), []);
  const fitAll = useCallback(() => {
    arrange();
    const root = shell.current;
    const viewport = root?.querySelector('.react-flow__viewport');
    if (!viewport) return;
    const origin = viewport.getBoundingClientRect();
    const scale = new DOMMatrix(getComputedStyle(viewport).transform).a || 1;
    const rects = [...root.querySelectorAll('.react-flow__node, .edge-label, .react-flow__edge-path')].map((element) => element.getBoundingClientRect());
    if (!rects.length) return;
    const left = Math.min(...rects.map((rect) => rect.left)), top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right)), bottom = Math.max(...rects.map((rect) => rect.bottom));
    flow.current?.fitBounds({ x: (left - origin.x) / scale, y: (top - origin.y) / scale, width: (right - left) / scale, height: (bottom - top) / scale }, { padding: 0.15 });
  }, [arrange]);
  const clearFocus = useCallback(() => { setSelected(null); setHover(null); }, []);
  useEffect(() => {
    let frame;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(arrange); };
    const observer = new ResizeObserver(schedule);
    shell.current?.querySelectorAll('.chip, .edge-label').forEach((element) => observer.observe(element));
    schedule();
    document.fonts.ready.then(schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [nodes, graph, expanded, selected, hover, dark, arrange]);
  const dimensions = nodes.map((node) => `${node.id}:${node.measured?.height || 0}`).join('|');
  useEffect(() => {
    if (!nodes.length || nodes.some((node) => !node.measured?.height) || graph.nodes.every((node) => node.position)) return;
    const measured = new Map(nodes.map((node) => [node.id, node.measured.height]));
    const positioned = new Map(layout(graph, false, measured).map((node) => [node.id, node.position]));
    setNodes((current) => current.map((node) => ({ ...node, position: positioned.get(node.id) })));
  }, [dimensions, graph, setNodes]);

  useEffect(() => {
    setNodes(layout(graph));
    setSelected(null);
    setHover(null);
    const id = setTimeout(fitAll, 150);
    return () => clearTimeout(id);
  }, [graph, setNodes, fitAll]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setExpanded(false);
        setSelected(null);
        setHover(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const focusId = hover || (selected?.type === "node" ? selected.data.id : null);
  const trace = useMemo(() => (focusId ? traceAncestorsDescendants(focusId, graph.edges) : null), [focusId, graph.edges]);

  const visibleNodes = useMemo(() => {
    return nodes.map((node) => {
      let visualState = "";
      if (focusId && node.id !== focusId) {
        visualState = trace?.ancestors.has(node.id)
          ? "ancestor"
          : trace?.descendants.has(node.id)
            ? "descendant"
            : "dimmed";
      }
      return {
        ...node,
        selected: selected?.type === "node" && selected.data.id === node.id,
        data: { ...node.data, visualState },
      };
    });
  }, [nodes, focusId, selected, trace]);

  const routedEdges = useMemo(() => deriveEdgeRouting(graph.edges, nodes), [graph.edges, nodes]);
  const edges = useMemo(() => {
    return routedEdges.map((e) => {
      const isSelectedEdge = selected?.type === "edge" && selected.data.id === e.id;
      const association = e.relation === "constraint" || e.relation === "resource";
      const related = !focusId || e.source === focusId || e.target === focusId ||
        (trace?.ancestors.has(e.source) && trace?.ancestors.has(e.target)) ||
        (trace?.descendants.has(e.source) && trace?.descendants.has(e.target));
      const lit = (!focusId && isSelectedEdge) || (!focusId ? true : (!association && related));
      const color = association ? (dark ? "#c084fc" : "#7c3aed") : dark ? "#fb923c" : "#c2410c";
      return {
        ...e,
        data: { ...e.data, basis: e.basis, visualState: lit ? "" : "dimmed", onSelect: () => setSelected({ type: "edge", data: e }) },
        animated: !association,
        label: e.label || e.relation,
        style: { stroke: lit ? color : dark ? "#52525b" : "#a1a1aa", strokeWidth: isSelectedEdge ? 2.5 : association ? 1.25 : 1.6, opacity: lit ? 1 : 0.13, strokeDasharray: association ? "5 4" : undefined, cursor: "pointer" },
        markerEnd: { type: MarkerType.ArrowClosed, color: lit ? color : dark ? "#52525b" : "#a1a1aa", width: 16, height: 16 },
      };
    });
  }, [routedEdges, dark, focusId, trace, selected]);

  const toggle = () => {
    setExpanded((v) => !v);
    setTimeout(fitAll, 120);
  };

  return (
    <section ref={shell} className={`circuit-shell ${expanded ? "expanded" : ""}`} aria-label="Live Logic Circuit">
      <div className="circuit-toolbar">
        <span>
          <Zap size={14} /> LIVE LOGIC CIRCUIT
        </span>
        <div className="toolbar-right">
          <span className="basis-legend" aria-label="Evidence basis legend"><i className="legend-source" /> Source fact <i className="legend-abstraction" /> Abstraction</span>
          <span>{graph.nodes.length} NODES / {graph.edges.length} EDGES</span>
          <button onClick={toggle} title={expanded ? "Exit fullscreen" : "Fullscreen"} aria-label={expanded ? "Exit fullscreen" : "Fullscreen"}>
            {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </div>
      <div className="canvas">
        <ReactFlow
          nodes={visibleNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onInit={(instance) => {
            flow.current = instance;
          }}
          fitView
          fitViewOptions={{ padding: 0.14 }}
          minZoom={0.1}
          maxZoom={2.5}
          colorMode={dark ? "dark" : "light"}
          onNodeClick={(_, n) => setSelected({ type: "node", data: n.data })}
          onEdgeClick={(_, e) => setSelected({ type: "edge", data: e.data?.rawEdge || e })}
          onPaneClick={clearFocus}
          onMoveEnd={arrange}
          onNodeMouseEnter={(_, n) => setHover(n.id)}
          onNodeMouseLeave={() => setHover(null)}
          nodesConnectable={false}
          deleteKeyCode={null}
        >
          <Background color={dark ? "#303030" : "#cbd5e1"} gap={24} size={1} />
          <Controls showInteractive={false} showFitView={false}>
            <button className="react-flow__controls-button react-flow__controls-fitview" title="Fit View" aria-label="Fit View" onClick={fitAll}><Maximize2 size={15} /></button>
          </Controls>
        </ReactFlow>
      </div>
      {selected && (
        <aside className="inspector">
          <button title="Close details" onClick={clearFocus}>
            <X size={16} />
          </button>
          {selected.type === "node" ? (
            <>
              <b>{selected.data.label}</b>
              <span>{selected.data.kind} node · {selected.data.basis || "source"}</span>
              <p>{selected.data.description}</p>
              {selected.data.basis === "abstraction" && <><strong>Abstraction Rationale</strong><p>{selected.data.rationale}</p></>}
              <small>{selected.data.evidence}</small>
            </>
          ) : (
            <>
              <b>{selected.data.label || selected.data.id}</b>
              <span>edge ({selected.data.relation || "flow"}) · {selected.data.basis || "source"}</span>
              <p>{selected.data.source} → {selected.data.target}</p>
              {selected.data.basis === "abstraction" && <><strong>Abstraction Rationale</strong><p>{selected.data.rationale}</p></>}
              <small>{selected.data.evidence || "No attached source quote"}</small>
            </>
          )}
        </aside>
      )}
    </section>
  );
}
function download(value, name, type = "application/json") {
  const u = URL.createObjectURL(new Blob([value], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 500);
}
function App() {
  const [dark, setDark] = useState(true),
    [example, setExample] = useState("creator"),
    [tab, setTab] = useState("circuit"),
    [custom, setCustom] = useState(() => {
      if (window.__SKILL_CIRCUIT__) return validateGraph(window.__SKILL_CIRCUIT__);
      if (window.__SKILL_MARKDOWN__) return parseSkill(window.__SKILL_MARKDOWN__);
      return null;
    }),
    [error, setError] = useState("");
  const input = useRef(null);
  const graph = useMemo(
    () => custom || (example === "creator" ? reference : parseSkill(pdfMd)),
    [custom, example],
  );
  const sourceText = graph.sourceMarkdown || (custom ? JSON.stringify(graph, null, 2) : example === "creator" ? creatorMd : pdfMd);
  const outputText = custom ? graph.illustrativeOutput : (example === "pdf" ? pdfOutput : null);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  const choose = (value) => {
    setCustom(null);
    setExample(value);
    setTab("circuit");
    setError("");
  };
  async function importFile(event) {
    const f = event.target.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      setCustom(
        f.name.endsWith(".json")
          ? validateGraph(JSON.parse(text))
          : parseSkill(text),
      );
      setTab("circuit");
      setError("");
    } catch (e) {
      setError(e.message);
    }
    event.target.value = "";
  }
  return (
    <main>
      <nav>
        <a className="brand" href="#">
          <span className="brand-icon">
            <Zap size={20} />
          </span>{" "}
          SKILL CIRCUIT <span className="local-badge">LOCAL</span>
        </a>
        <div>
          <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a
            href={graph.provenance?.url || "#source"}
            target={graph.provenance?.url ? "_blank" : undefined}
            rel={graph.provenance?.url ? "noreferrer" : undefined}
            onClick={(event) => {
              if (!graph.provenance?.url) {
                event.preventDefault();
                setTab("source");
              }
            }}
          >
            {graph.provenance?.kind === "reference" ? "REFERENCE" : "SOURCE"} <ArrowUpRight size={14} />
          </a>
        </div>
      </nav>
      <header>
        <div className="eyebrow">SKILL → LOGIC → OUTPUT</div>
        <h1>{graph.title}</h1>
        <div className="byline">
          {graph.author ? `by ${graph.author}` : custom ? 'Imported locally' : example === 'creator' ? 'by davepoon' : 'Illustrative source'} <span>•</span>{' '}
          {custom
            ? "Your source stays in this browser"
            : example === "creator"
              ? "SkillHub reference reproduction"
              : "SkillHub illustrative PDF Editor example"}
        </div>
        <p>{graph.description}</p>
      </header>
      <div className="actions">
        <div className="example-switch">
          <button
            className={!custom && example === "creator" ? "active" : ""}
            onClick={() => choose("creator")}
          >
            skill-creator
          </button>
          <button
            className={!custom && example === "pdf" ? "active" : ""}
            onClick={() => choose("pdf")}
          >
            pdf-editor
          </button>
        </div>
        <div>
          <button onClick={() => input.current.click()}>
            <Upload size={15} /> Import .md / .json
          </button>
          <input
            ref={input}
            hidden
            type="file"
            accept=".md,.json,.markdown"
            onChange={importFile}
          />
          <button
            onClick={() =>
              download(
                JSON.stringify(graph, null, 2),
                `${graph.title}.graph.json`,
              )
            }
          >
            <Download size={15} /> Graph JSON
          </button>
        </div>
      </div>
      <div className="tabs">
        <button
          className={tab === "circuit" ? "active" : ""}
          onClick={() => setTab("circuit")}
        >
          Live Logic Circuit
        </button>
        <button
          className={tab === "source" ? "active" : ""}
          onClick={() => setTab("source")}
        >
          {custom && !graph.sourceMarkdown ? 'Graph JSON' : 'SKILL.md'}
        </button>
        {outputText && <button
          className={tab === 'output' ? 'active' : ''}
          onClick={() => setTab('output')}
        >
          Illustrative output
        </button>}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {tab === "circuit" ? (
        <Circuit graph={graph} dark={dark} />
      ) : tab === "source" ? (
        <pre className="source">
          {sourceText}
        </pre>
      ) : (
        <section className="output">
          <div className="output-title">
            <h2>Illustrative output</h2>
            <button
              onClick={() =>
                download(outputText, `${graph.title}-output.md`, 'text/markdown')
              }
            >
              <Download size={15} /> Save output
            </button>
          </div>
          <p className="notice">
            Illustrative example, not a recorded execution or proof of successful validation.
          </p>
          <pre>{outputText}</pre>
        </section>
      )}
      <footer>
        <div>
          <span className="live-dot" /> {graph.nodes.length} nodes ·{" "}
          {graph.edges.length} connections · Drag to pan · Scroll to zoom ·
          Click a node for evidence
        </div>
        <span>React Flow · Local rendering</span>
      </footer>
      {graph.warnings?.length > 0 && (
        <details className="warnings">
          <summary>{graph.warnings.length} source verification notes</summary>
          {graph.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </details>
      )}
      <section className="provenance">
        <h2>Source and provenance</h2>
        <p><strong>{graph.provenance?.kind || "reference"}</strong> · {graph.provenance?.mode || "No provenance mode supplied"}</p>
        {graph.provenance?.sourceSha256 && <p className="hash">SHA-256: {graph.provenance.sourceSha256}</p>}
        <p>{custom ? "This graph explains the supplied topic. Evidence and assumptions are attached to nodes and relationships; no described commands are executed by this viewer." : "The displayed graph is a reference or illustrative example, not proof of execution."}</p>
        {graph.coverage && <details className="coverage"><summary>Coverage ({graph.coverage.entries?.length || 0} entries)</summary><p>Source ranges are retained in the graph coverage record and can be audited against the SKILL.md tab.</p></details>}
        {graph.recommendationsRequested && graph.recommendations?.length > 0 && <div className="recommendations"><h3>Engineering Recommendations</h3>{graph.recommendations.map((r, i) => <article key={i}><b>{r.summary}</b><p>{r.purpose}</p>{r.assumptions?.length > 0 && <small>Assumptions: {r.assumptions.join("; ")}</small>}{r.evidence && <small>Evidence: {r.evidence}</small>}</article>)}</div>}
      </section>
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);
