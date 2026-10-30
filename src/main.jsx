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

const UI = {
  en: {
    language: "Language",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    reference: "REFERENCE",
    source: "SOURCE",
    importedLocally: "Imported locally",
    sourceStays: "Your source stays in this browser",
    illustrativeSource: "Illustrative source",
    referenceReproduction: "SkillHub reference reproduction",
    pdfExample: "SkillHub illustrative PDF Editor example",
    liveCircuit: "LIVE LOGIC CIRCUIT",
    sourceFact: "Source fact",
    abstraction: "Abstraction",
    nodes: "NODES",
    edges: "EDGES",
    exitFullscreen: "Exit fullscreen",
    fullscreen: "Fullscreen",
    fitView: "Fit View",
    closeDetails: "Close details",
    abstractionRationale: "Abstraction Rationale",
    noSourceQuote: "No attached source quote",
    importFile: "Import .md / .json",
    graphJson: "Graph JSON",
    liveLogicCircuit: "Live Logic Circuit",
    skillMarkdown: "SKILL.md",
    illustrativeOutput: "Illustrative output",
    saveOutput: "Save output",
    outputNotice: "Illustrative example, not a recorded execution or proof of successful validation.",
    nodesSummary: (nodes, edges) => `${nodes} nodes · ${edges} connections · Drag to pan · Scroll to zoom · Click a node for evidence`,
    localRendering: "React Flow · Local rendering",
    verificationNotes: (count) => `${count} source verification notes`,
    sourceAndProvenance: "Source and provenance",
    noProvenance: "No provenance mode supplied",
    customGraphNotice: "This graph explains the supplied topic. Evidence and assumptions are attached to nodes and relationships; no described commands are executed by this viewer.",
    referenceGraphNotice: "The displayed graph is a reference or illustrative example, not proof of execution.",
    coverage: (count) => `Coverage (${count} entries)`,
    coverageNote: "Source ranges are retained in the graph coverage record and can be audited against the SKILL.md tab.",
    engineeringRecommendations: "Engineering Recommendations",
    assumptions: "Assumptions",
    evidence: "Evidence",
    kinds: { input: "input", processing: "processing", decision: "decision", config: "config", output: "output", resource: "resource" },
  },
  zh: {
    language: "语言",
    switchToLight: "切换浅色模式",
    switchToDark: "切换深色模式",
    reference: "参考来源",
    source: "源文档",
    importedLocally: "本地导入",
    sourceStays: "源文档仅保留在当前浏览器",
    illustrativeSource: "示例来源",
    referenceReproduction: "SkillHub 参考复现",
    pdfExample: "SkillHub PDF Editor 示例",
    liveCircuit: "实时逻辑电路",
    sourceFact: "源事实",
    abstraction: "抽象整理",
    nodes: "节点",
    edges: "连接",
    exitFullscreen: "退出全屏",
    fullscreen: "全屏",
    fitView: "适应视图",
    closeDetails: "关闭详情",
    abstractionRationale: "抽象依据",
    noSourceQuote: "没有附加源文档引文",
    importFile: "导入 .md / .json",
    graphJson: "图 JSON",
    liveLogicCircuit: "实时逻辑电路",
    skillMarkdown: "SKILL.md",
    illustrativeOutput: "示例输出",
    saveOutput: "保存输出",
    outputNotice: "这是示例内容，不代表真实执行，也不能证明验证成功。",
    nodesSummary: (nodes, edges) => `${nodes} 个节点 · ${edges} 条连接 · 拖动平移 · 滚轮缩放 · 点击节点查看证据`,
    localRendering: "React Flow · 本地渲染",
    verificationNotes: (count) => `${count} 条源文档校验说明`,
    sourceAndProvenance: "源文档与溯源",
    noProvenance: "未提供溯源模式",
    customGraphNotice: "此图解释了当前提供的主题。节点和关系附带证据与假设；查看器不会执行源文档中的命令。",
    referenceGraphNotice: "当前图是参考或示例，不代表真实执行结果。",
    coverage: (count) => `覆盖记录（${count} 条）`,
    coverageNote: "源文档范围保留在覆盖记录中，可与 SKILL.md 标签页交叉审计。",
    engineeringRecommendations: "工程建议",
    assumptions: "假设",
    evidence: "证据",
    kinds: { input: "输入", processing: "处理", decision: "决策", config: "配置", output: "输出", resource: "资源" },
  },
};

function inlineMarkdown(value) {
  const tokens = String(value ?? "").split(/(`[^`]*`|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|_[^_]+_)/g);
  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith("`") && token.endsWith("`")) return <code key={index}>{token.slice(1, -1)}</code>;
    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) return <strong key={index}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("~~") && token.endsWith("~~")) return <del key={index}>{token.slice(2, -2)}</del>;
    if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) return <em key={index}>{token.slice(1, -1)}</em>;
    return <React.Fragment key={index}>{token}</React.Fragment>;
  });
}

function MarkdownContent({ value, compact = false }) {
  const lines = String(value ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  let code = [];
  let inCode = false;
  const flushParagraph = () => {
    if (paragraph.length) blocks.push(<p key={`p-${blocks.length}`}>{inlineMarkdown(paragraph.join(" "))}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push(<ul key={`l-${blocks.length}`}>{list.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}</ul>);
    list = [];
  };
  const flushCode = () => {
    if (code.length) blocks.push(<pre key={`c-${blocks.length}`}><code>{code.join("\n")}</code></pre>);
    code = [];
  };
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      flushParagraph();
      flushList();
      if (inCode) flushCode();
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(<h4 key={`h-${blocks.length}`}>{inlineMarkdown(heading[2])}</h4>);
      continue;
    }
    const item = /^(?:[-*+] |\d+\. )(.+)$/.exec(line);
    if (item) {
      flushParagraph();
      list.push(item[1]);
      continue;
    }
    if (/^\s*(?:---+|___+|\*\*\*+)\s*$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(<hr key={`r-${blocks.length}`} />);
      continue;
    }
    flushList();
    paragraph.push(line.trim());
  }
  flushParagraph();
  flushList();
  flushCode();
  return <div className={`markdown-content${compact ? " compact" : ""}`}>{blocks}</div>;
}

function basisLabel(basis, t) {
  return basis === "abstraction" ? t.abstraction : t.sourceFact;
}

function Chip({ data, selected, t }) {
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
          <span className="chip-kind">{t.kinds[data.kind] || data.kind} · {basisLabel(basis, t)}</span>
        </div>
      </div>
      <MarkdownContent value={data.description} compact />
      {basis === "abstraction" && <span className="inference-mark" title={t.customGraphNotice}>A</span>}
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="source" position={Position.Left} id="left-source" />
    </div>
  );
}
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
  const t = data?.ui || UI.en;
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
      title={data?.basis === "abstraction" ? t.customGraphNotice : label}>{data?.basis === "abstraction" ? `${t.abstraction} · ` : ""}{label}</div></EdgeLabelRenderer>}
  </>);
}

const edgeTypes = { logic: LogicEdge };

function Circuit({ graph, dark, t }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(layout(graph));
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const flow = useRef(null);
  const shell = useRef(null);
  const nodeTypes = useMemo(() => ({ chip: (props) => <Chip {...props} t={t} /> }), [t]);
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
        data: { ...e.data, basis: e.basis, ui: t, visualState: lit ? "" : "dimmed", onSelect: () => setSelected({ type: "edge", data: e }) },
        animated: !association,
        label: e.label || e.relation,
        style: { stroke: lit ? color : dark ? "#52525b" : "#a1a1aa", strokeWidth: isSelectedEdge ? 2.5 : association ? 1.25 : 1.6, opacity: lit ? 1 : 0.13, strokeDasharray: association ? "5 4" : undefined, cursor: "pointer" },
        markerEnd: { type: MarkerType.ArrowClosed, color: lit ? color : dark ? "#52525b" : "#a1a1aa", width: 16, height: 16 },
      };
    });
  }, [routedEdges, dark, focusId, trace, selected, t]);

  const toggle = () => {
    setExpanded((v) => !v);
    setTimeout(fitAll, 120);
  };

  return (
    <section ref={shell} className={`circuit-shell ${expanded ? "expanded" : ""}`} aria-label={t.liveLogicCircuit}>
      <div className="circuit-toolbar">
        <span>
          <Zap size={14} /> {t.liveCircuit}
        </span>
        <div className="toolbar-right">
          <span className="basis-legend" aria-label={t.sourceFact}><i className="legend-source" /> {t.sourceFact} <i className="legend-abstraction" /> {t.abstraction}</span>
          <span>{graph.nodes.length} {t.nodes} / {graph.edges.length} {t.edges}</span>
          <button onClick={toggle} title={expanded ? t.exitFullscreen : t.fullscreen} aria-label={expanded ? t.exitFullscreen : t.fullscreen}>
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
            <button className="react-flow__controls-button react-flow__controls-fitview" title={t.fitView} aria-label={t.fitView} onClick={fitAll}><Maximize2 size={15} /></button>
          </Controls>
        </ReactFlow>
      </div>
      {selected && (
        <aside className="inspector">
          <button title={t.closeDetails} onClick={clearFocus}>
            <X size={16} />
          </button>
          {selected.type === "node" ? (
            <>
              <b>{selected.data.label}</b>
              <span>{t.kinds[selected.data.kind] || selected.data.kind} · {basisLabel(selected.data.basis, t)}</span>
              <MarkdownContent value={selected.data.description} />
              {selected.data.basis === "abstraction" && <><strong>{t.abstractionRationale}</strong><MarkdownContent value={selected.data.rationale} /></>}
              <small>{selected.data.evidence}</small>
            </>
          ) : (
            <>
              <b>{selected.data.label || selected.data.id}</b>
              <span>{selected.data.relation || "flow"} · {basisLabel(selected.data.basis, t)}</span>
              <p>{selected.data.source} → {selected.data.target}</p>
              {selected.data.basis === "abstraction" && <><strong>{t.abstractionRationale}</strong><MarkdownContent value={selected.data.rationale} /></>}
              <small>{selected.data.evidence || t.noSourceQuote}</small>
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
    [locale, setLocale] = useState(() => {
      try {
        const stored = window.localStorage.getItem("skill-circuit-locale");
        if (stored === "en" || stored === "zh") return stored;
      } catch {}
      return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
    }),
    [example, setExample] = useState("creator"),
    [tab, setTab] = useState("circuit"),
    [custom, setCustom] = useState(() => {
      if (window.__SKILL_CIRCUIT__) return validateGraph(window.__SKILL_CIRCUIT__);
      if (window.__SKILL_MARKDOWN__) return parseSkill(window.__SKILL_MARKDOWN__);
      return null;
    }),
    [error, setError] = useState("");
  const t = UI[locale];
  const input = useRef(null);
  const graph = useMemo(
    () => custom || (example === "creator" ? reference : parseSkill(pdfMd)),
    [custom, example],
  );
  const sourceText = graph.sourceMarkdown || (custom ? JSON.stringify(graph, null, 2) : example === "creator" ? creatorMd : pdfMd);
  const outputText = custom ? graph.illustrativeOutput : (example === "pdf" ? pdfOutput : null);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.locale = locale;
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    try { window.localStorage.setItem("skill-circuit-locale", locale); } catch {}
  }, [dark, locale]);
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
            className="locale-toggle"
            onClick={() => setLocale(locale === "en" ? "zh" : "en")}
            aria-label={t.language}
            title={t.language}
          >
            <span className={locale === "en" ? "active" : ""}>EN</span>
            <span className={locale === "zh" ? "active" : ""}>中</span>
          </button>
          <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label={dark ? t.switchToLight : t.switchToDark}
            title={dark ? t.switchToLight : t.switchToDark}
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
            {graph.provenance?.kind === "reference" ? t.reference : t.source} <ArrowUpRight size={14} />
          </a>
        </div>
      </nav>
      <header>
        <div className="eyebrow">SKILL → LOGIC → OUTPUT</div>
        <h1>{graph.title}</h1>
        <div className="byline">
          {graph.author ? `by ${graph.author}` : custom ? t.importedLocally : example === "creator" ? "by davepoon" : t.illustrativeSource} <span>•</span>{" "}
          {custom
            ? t.sourceStays
            : example === "creator"
              ? t.referenceReproduction
              : t.pdfExample}
        </div>
        <MarkdownContent value={graph.description} />
      </header>
      <div className="actions">
        {!custom && <div className="example-switch">
          <button
            className={example === "creator" ? "active" : ""}
            onClick={() => choose("creator")}
          >
            skill-creator
          </button>
          <button
            className={example === "pdf" ? "active" : ""}
            onClick={() => choose("pdf")}
          >
            pdf-editor
          </button>
        </div>}
        <div className="primary-actions">
          <button onClick={() => input.current.click()}>
            <Upload size={15} /> {t.importFile}
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
            <Download size={15} /> {t.graphJson}
          </button>
        </div>
      </div>
      <div className="tabs">
        <button
          className={tab === "circuit" ? "active" : ""}
          onClick={() => setTab("circuit")}
        >
          {t.liveLogicCircuit}
        </button>
        <button
          className={tab === "source" ? "active" : ""}
          onClick={() => setTab("source")}
        >
          {custom && !graph.sourceMarkdown ? t.graphJson : t.skillMarkdown}
        </button>
        {outputText && <button
          className={tab === "output" ? "active" : ""}
          onClick={() => setTab("output")}
        >
          {t.illustrativeOutput}
        </button>}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {tab === "circuit" ? (
        <Circuit graph={graph} dark={dark} t={t} />
      ) : tab === "source" ? (
        <pre className="source">
          {sourceText}
        </pre>
      ) : (
        <section className="output">
          <div className="output-title">
            <h2>{t.illustrativeOutput}</h2>
            <button
              onClick={() =>
                download(outputText, `${graph.title}-output.md`, "text/markdown")
              }
            >
              <Download size={15} /> {t.saveOutput}
            </button>
          </div>
          <p className="notice">
            {t.outputNotice}
          </p>
          <pre>{outputText}</pre>
        </section>
      )}
      <footer>
        <div>
          <span className="live-dot" /> {t.nodesSummary(graph.nodes.length, graph.edges.length)}
        </div>
        <span>{t.localRendering}</span>
      </footer>
      {graph.warnings?.length > 0 && (
        <details className="warnings">
          <summary>{t.verificationNotes(graph.warnings.length)}</summary>
          {graph.warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </details>
      )}
      <section className="provenance">
        <h2>{t.sourceAndProvenance}</h2>
        <p><strong>{graph.provenance?.kind || "reference"}</strong> · {graph.provenance?.mode || t.noProvenance}</p>
        {graph.provenance?.sourceSha256 && <p className="hash">SHA-256: {graph.provenance.sourceSha256}</p>}
        <p>{custom ? t.customGraphNotice : t.referenceGraphNotice}</p>
        {graph.coverage && <details className="coverage"><summary>{t.coverage(graph.coverage.entries?.length || 0)}</summary><p>{t.coverageNote}</p></details>}
        {graph.recommendationsRequested && graph.recommendations?.length > 0 && <div className="recommendations"><h3>{t.engineeringRecommendations}</h3>{graph.recommendations.map((r, i) => <article key={i}><b>{r.summary}</b><p>{r.purpose}</p>{r.assumptions?.length > 0 && <small>{t.assumptions}: {r.assumptions.join("; ")}</small>}{r.evidence && <small>{t.evidence}: {r.evidence}</small>}</article>)}</div>}
      </section>
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);
