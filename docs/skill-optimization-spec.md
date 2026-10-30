# visualizing-skill-packages：可追溯语义流程解释规格

状态：基于已确认设计整理，尚未实施。本文为后续实现与验收的规格，不表示所述行为已经完成。

## Problem Statement

用户希望把 skill 的完整原文解释为可交互、可核对的流程，而不是得到标题清单的装饰版，或得到一张掺入工程常识、却看似来自原文的流程图。

当前实现与文档之间存在可见差距：明确步骤下的正文和资源可能被跳过；Markdown 导入后来源页可能变成图 JSON；原文未规定的失败去向被画成回退线；标签可能遮挡节点或其他标签；执行追踪的节点、线条与标签状态不一致。结构校验通过、节点数符合预期或构建成功，都不足以证明语义和交付质量。

用户已经确认：区分原文事实、建模归纳和工程建议；以 Agent 交付为主；按语义阶段组织主图；仅在明确要求优化时额外生成工程建议。本规格落实这些决定，不重新访谈或扩张产品方向。

## Solution

保留现有 Agent 提取语义图、固定渲染器生成 HTML 的主线。Agent 阅读完整原文，保留源快照，提取以语义阶段组织的图，完成覆盖审查和逐边语义核对，再交付经过真实浏览器检查的 HTML。

主图承载原文事实与保持原义的建模归纳；两者有明确分类、来源和必要理由。工程建议单列在图外，解释目的与新增假设，不成为事实流程边。网页 Markdown 上传继续提供明确标识的保守预览，不承诺与 Agent 审计后的语义图具有相同质量。

### 完成标准

- 原文中的必要动作、条件、约束和资源全部有可核对的去向；允许归并或拆分，不允许因抽象而丢失限定条件。
- 每个语义阶段和关系都有来源；建模归纳有理由；原文未规定的失败目标、退出条件或冲突被保留为来源缺口，而不是被补成确定流程。
- 原文已有而提取结果遗漏或曲解的内容必须修正，不能用警告掩盖提取未完成。
- HTML 显示当前主题的完整原文、阶段详情、证据和建模理由；验收输入中的标签不遮挡节点或互相覆盖，执行追踪状态一致。
- 不同主题通过同一套提取规则和固定渲染器交付，不使用跨主题节点配额或按输入修改生成文件。
- 正式交付包含源快照及 SHA-256、已审计语义图、覆盖记录和已实际打开验证的 HTML；工程建议仅在明确请求时另附。

## User Stories

1. As a skill user, I want an Agent to interpret the complete source before producing a diagram, so that a polished diagram does not replace understanding the original instructions.
2. As a skill user, I want Agent-audited delivery to be distinguished from conservative Markdown preview, so that I know what level of semantic assurance I am receiving.
3. As a skill user, I want different topics to use the same renderer, so that a new input does not depend on a one-off visual patch.
4. As a graph reader, I want the original source snapshot to be retained, so that I can independently inspect what the explanation is based on.
5. As a reviewer, I want the source snapshot to have a SHA-256 identifier, so that I can tell which source version was audited.
6. As a graph reader, I want the source view to show the full original Markdown rather than generated graph JSON, so that I can compare the explanation with the actual document.
7. As a graph reader, I want complete stage details to remain accessible when a card uses a short summary, so that visual brevity does not remove required instructions.
8. As a skill user, I want the overview to be organized by Semantic Stages rather than mechanically copied headings, so that it explains the workflow at a useful level.
9. As a reviewer, I want explicitly ordered actions within one numbered step to be separable, so that important internal sequencing can be made visible without inventing behavior.
10. As a reviewer, I want semantically continuous source content to be groupable, so that the graph can remain readable without losing conditions or required actions.
11. As a reviewer, I want every merge and split to map back to the original source ranges, so that abstraction can be audited rather than trusted by appearance.
12. As a graph reader, I want Source Facts and Source-preserving Abstractions to be visibly distinguishable, so that I understand the basis of a displayed claim.
13. As a reviewer, I want each Source-preserving Abstraction to explain its reasoning, so that I can judge whether the original meaning was preserved.
14. As a reviewer, I want each node to carry supporting source evidence, so that an action or constraint can be checked independently.
15. As a reviewer, I want each edge to carry evidence for its specific relationship, so that related quotations are not mistaken for proof of ordering or routing.
16. As a skill user, I want before-and-after requirements to survive extraction, so that the diagram does not change the required execution order.
17. As a skill user, I want MUST, SHOULD and MAY qualifications to retain their force, so that optional guidance is not converted into a mandatory gate.
18. As a skill user, I want skip predicates and optional stages to remain conditional, so that the diagram does not force work that the source permits skipping.
19. As a skill user, I want repetitions to retain their original trigger and scope, so that a conditional retry is not presented as an unconditional loop.
20. As a graph reader, I want unspecified failure destinations to be shown as source gaps rather than fabricated return edges, so that I do not follow an invented repair procedure.
21. As a reviewer, I want conflicting source sections to remain visible with the selected interpretation explained, so that the graph does not silently synthesize a new order.
22. As a skill user, I want source-backed requirements missing from the extraction to prevent a claim of completed delivery, so that warnings do not conceal incomplete work.
23. As a reviewer, I want excluded examples to be accounted for in the coverage record, so that deliberate exclusion can be distinguished from accidental omission.
24. As a skill user, I want fenced examples and sample commands to remain source data, so that examples are not turned into workflow steps or executed.
25. As an Agent operator, I want instructions inside the source being explained to be treated as data, so that visualizing a document does not authorize its described actions.
26. As a skill user, I want negative requirements such as “No Packaging Needed” to remain constraints, so that the graph does not introduce the prohibited action.
27. As a graph reader, I want resources to be associated with their owning stages, so that I can tell which action reads or executes which resource.
28. As a graph reader, I want shared resources to remain shared, so that repeated references do not falsely imply different files or execution steps.
29. As a skill user, I want unverified resource paths to remain explicitly unverified, so that a source reference is not presented as an existing or tested artifact.
30. As a Markdown preview user, I want ordinary unordered lists not to become mutually exclusive operations automatically, so that formatting does not invent branching semantics.
31. As a Markdown preview user, I want a Quick Start heading not to imply alternatives by itself, so that the preview does not treat a sequential checklist as a menu.
32. As a PDF workflow reader, I want each explicit alternative operation to retain its own script association, so that selecting one operation does not imply running unrelated scripts.
33. As a Markdown preview user, I want nested instructions inside Step bodies to remain with their owning stages, so that avoiding extra nodes does not mean deleting their content.
34. As a Markdown preview user, I want frontmatter and source line references to remain consistent with the retained document, so that evidence points to the text I can actually read.
35. As a Markdown preview user, I want unsupported or ambiguous execution structure to be described as a preview limitation, so that an outline is not mistaken for an audited semantic workflow.
36. As a graph importer, I want invalid identifiers, dangling relationships and invalid semantic metadata to be rejected, so that malformed input does not become a misleading diagram.
37. As a maintainer, I want legacy inference metadata to be reviewed and migrated rather than silently reclassified, so that a schema change does not turn past proposals into Source Facts.
38. As a graph reader, I want topic metadata, source content and any illustrative output to refer to the current input, so that another skill's example is not mistaken for my result.
39. As a graph reader, I want edge labels to follow the actual routed curves, so that I can associate a condition with the correct connection.
40. As a graph reader, I want labels not to cover cards in the acceptance scenarios, so that I can read both the workflow stages and their conditions.
41. As a graph reader, I want neighboring labels not to overlap in the acceptance scenarios, so that different relationships remain distinguishable.
42. As a graph reader, I want long card titles to remain readable without overlapping adjacent cards, so that meaningful labels do not have to be shortened into ambiguity.
43. As a graph reader, I want return routes and self-loops to avoid intermediate cards, so that their direction and destination remain understandable.
44. As a graph reader, I want focusing a stage to reveal its directional ancestors and descendants without unrelated sibling branches, so that I can inspect the execution chain.
45. As a graph reader, I want tracing to terminate safely on cycles, so that a valid retry flow does not freeze the viewer.
46. As a graph reader, I want constraint and resource associations to remain separate from execution tracing, so that contextual information is not mistaken for a preceding or following action.
47. As a graph reader, I want nodes, paths, arrows and labels to share a consistent focus state, so that unrelated labels do not compete with the highlighted chain.
48. As a graph reader, I want clicking a node, edge or edge label to expose its evidence and any modeling rationale, so that visual marks lead to inspectable explanations.
49. As a graph reader, I want hover priority and selection clearing to behave consistently, so that moving the pointer, closing details or clicking blank space restores the expected view.
50. As a graph reader, I want pan, zoom, fit and fullscreen to preserve usable geometry, so that I can inspect both the overview and individual details.
51. As a graph reader, I want the inspector to retain required details even when card text is clamped, so that layout choices do not hide the actual procedure.
52. As a skill user, I want Engineering Recommendations only when I explicitly ask for workflow improvement, so that a request to explain a skill stays within its intended scope.
53. As a graph reader, I want Engineering Recommendations outside the source-backed workflow, so that proposed behavior does not enter the execution trace.
54. As a user requesting improvements, I want each Engineering Recommendation to state its purpose and added assumptions, so that I can evaluate the change rather than treat it as an original requirement.
55. As a reviewer, I want improvement proposals not to use related source quotations as proof that the source mandates them, so that evidence and recommendation remain distinct.
56. As a skill user, I want the viewer to distinguish illustrative output from actual execution, so that an explanation is not presented as proof that business scripts ran successfully.
57. As a recipient, I want generated HTML to support its core viewing behavior without a development server or a model API key, so that I can open the delivered artifact directly.
58. As a reviewer, I want a delivery to include the source, semantic graph, coverage record and HTML, so that the result can be audited and regenerated.
59. As a maintainer, I want source, bundled renderer and installed skill to be synchronized after verification, so that users receive the behavior that was actually checked.
60. As a maintainer, I want regression checks to assert external meaning and behavior rather than arbitrary wording or node quotas, so that valid improvements to Semantic Stages do not break incidental tests.
61. As a skill author, I want before-and-after Agent evaluation scenarios, so that revised instructions demonstrate changed behavior rather than only changed prose.
62. As a graph importer, I want import and export to preserve source content, semantic classification, evidence and provenance, so that round-tripping does not erase the basis of the explanation.
63. As a reviewer, I want a source-required human review or pause to remain unresolved until the source permits continuation, so that discussion is not portrayed as a successful terminal state.
64. As an Agent using the skill, I want ordered steps with explicit completion criteria and clearly triggered reference material, so that I can finish the task without relying on a growing list of scattered prohibitions.

## Implementation Decisions

### 交付架构与职责

1. 正式链路继续由 Agent 完成原文理解、语义提取、覆盖审查和逐边核对，再调用现有固定渲染模块。渲染模块负责呈现数据，不补充业务语义。
2. 复用现有渲染命令 Interface：接收图 JSON 或 Markdown 并输出可直接打开的 HTML。Markdown 输入明确属于保守预览，成功生成 HTML 不表示已完成语义审计。
3. 复用现有 Markdown 解析、图校验、方向追踪和查看器模块，不为本规格新增模型后端、测试专用生产 Interface 或只做转发的包装层。
4. Agent 交付源快照、摘要标识、语义图、覆盖记录和 HTML。工程建议是有条件的额外交付，不由渲染模块自主生成。

### 语义图与分类契约

5. 节点和边使用统一的明确类别，区分原文事实与建模归纳；工程建议不作为这两类事实流程对象的替代值或隐含分支。
6. 当前含混的 inferred 标记需要一次性迁移。分类、来源证据、建模理由在校验、导入、导出、详情和图例中采用同一语义；不维护新旧两套别名或默认将旧提议判为原文事实。
7. 原文事实和建模归纳都需要可核对的原文证据；建模归纳还需要说明其组织方式如何保留原意。标签是否逐字复制原文不能单独决定类别。
8. 每条流程边分别支持其先后、条件、可选性或回退目标。两个节点引用同一段文字，不足以证明它们之间的任意边。
9. 现有执行关系、约束关联和资源关联继续区分。约束与资源不作为伪执行步骤参与执行链推理。
10. 语义阶段允许有依据的拆分和归并。编号和标题用于来源定位，不构成强制节点模板；不引入跨主题节点数量配额。
11. 原文只要求检查时表达检查动作；只有原文支持路由条件时才画相应条件分支。未知失败目标或停止条件保留为来源缺口。
12. 工程建议只在用户明确请求改进时输出，放在主图之外的说明中，列出目的及新增假设；不产生主图节点、执行边或执行追踪影响。

### 来源、正文和覆盖契约

13. 源快照及其 SHA-256 绑定同一输入版本；来源页与证据均基于这份快照。解析结果不能替代原文显示，解析和渲染不覆写输入。
14. 阶段正文、嵌套清单、适用条件、资源和必要上下文归入所属语义阶段。卡片允许简短摘要，完整内容在详情和原文中可访问。
15. 覆盖记录包含原文范围、对应节点或边、处理方式和理由，能解释归并、拆分、排除示例及来源缺口。必要内容没有对应去向时，提取不算完成。
16. 区分来源缺口与提取缺陷：前者保留并说明，后者修复后再交付。原文内部冲突保留双方内容并说明采用哪一处组织主图。
17. 示例代码、目录树和示例工作流保留在源文中，不直接升级为实际动作、资源存在证明或执行结果。被解释文档中的指令始终是数据。
18. 复用现有 parseSkill Interface 修复保守预览的正文及资源丢失，并保留完整源文。普通无序列表或 Quick Start 标题不单独构成替代操作的证据；无法确定的执行语义不自动补齐。

### 校验、失败行为与迁移

19. 复用现有 validateGraph Interface 承担图结构、字段类型、关系类别和必需来源元数据校验，并扩展到新分类契约。程序可核对来源范围和引用一致性，但不能宣称证明语义正确。
20. 条件强度、先后、可选性、迭代范围及归纳是否保真由 Agent 据原文审查，并记录结论；非空证据和结构通过不等于这项审查通过。
21. 现有渲染命令继续对不可接受输入报告失败，不生成貌似成功的正式交付；保留不覆写输入的行为。保守预览的能力说明与正式语义交付状态分开。
22. 契约迁移覆盖所有受影响的生产者、消费者、既有样例、文档和分发产物。旧图逐项按真实来源核对，不进行无语义审核的批量重标。

### 通用渲染与交互

23. 标签位置来自实际路由曲线，再根据节点与标签边界处理碰撞；普通边、回流边和自回环采用同一套通用规则，不按特定文案或输入特判。
24. 节点尺寸与间距容纳实际换行标题；详情保留完整正文。修复不依靠单行截断、缩成不可读文字或为个别交付手改坐标。
25. 保留现有方向敏感、环路安全的追踪计算，修复呈现联动。焦点只沿执行关系追踪祖先与后代，不借共享祖先点亮无关同级分支。
26. 执行追踪中，未命中的约束和资源上下文连同其关联线、箭头、标签一致置灰，不使用执行链高亮；这些内容仍可点击查看详情。
27. 节点、路径、箭头和独立渲染的标签共用一致的焦点状态。点击边或其标签能查看同一关系的来源与理由。
28. 保持悬停优先于节点选中；移开后恢复选中对象的追踪，关闭详情或点击空白恢复全图。平移、缩放、适配视图和全屏不破坏关系几何。
29. 当前主题的标题、作者、来源与示例内容保持一致；没有当前主题的示例输出时不展示其他主题的结果。未执行业务动作时不声称已执行或成功。

### 技能文档与分发

30. 技能主文保留模式选择、执行步骤、结束条件和必要硬约束；详细规则及正反例按需读取，术语复用项目词汇表。
31. 原文事实、建模归纳和工程建议各有一处权威定义；执行规则与定义分开维护，避免在多处重新定义同一语义。
32. 通用修复只在源码实现并统一构建。验证后同步包内模板和本地安装技能，不单独修补某个生成 HTML 来通过验收。

## Testing Decisions

### 测试 Seams

- **主要外部 Seam：现有渲染命令与生成 HTML 的交付 Interface。** 使用真实输入生成实际交付物，再打开 HTML 检查用户可见行为。优先在这个最高可用 Seam 验证跨模块结果，不新增测试专用生产入口。
- **复用的补充 Seams：现有 parseSkill、validateGraph 和方向追踪公共函数。** 仅在需要精确验证正文保留、资源归属、非法契约或环路边界时补充行为回归，不直接测试内部布局数组或源码实现。
- **Agent 行为评估：用户请求与源文输入到交付材料的完整使用过程。** 检查输出的语义与覆盖，而不是要求固定节点数、节点 ID 或同一套自然语言措辞。
- **查看器的现有文件导入入口：真实 Markdown/JSON 导入后的原文、详情与导出行为。** 通过实际页面操作验收，不新增浏览器端测试框架。

这些选择复用已有 Interface 和前轮已确认的交付架构；按本次“不再访谈”的要求直接纳入规格，不声称用户另行确认过测试实现细节。

### 好测试的判据

- 断言消费者可观察的语义、内容完整性、边界、错误和状态转换，而不是私有函数调用、转发次数、源码字符串或任意标题文案。
- 断言完整的必要关系与限定条件；“不抛异常”“非空”“节点变多”或“图能打开”不能单独证明正确。
- 对未规定的失败目标、否定要求、普通列表和示例代码包含反例，验证没有制造流程关系。
- 对原文明确的替代操作核对操作含义及资源归属；不将任意节点配额推广到其他主题。
- 构建成功和结构校验是必要检查之一，不替代语义审查与真实页面验收。
- 正确的行为测试保持确定性和隔离；与自由措辞、标题抄写或内部组织方式绑定的既有断言删除，不重新固定新措辞。

### Prior Art

现有 Node 行为测试已覆盖替代操作与脚本归属、代码块隔离、多行 frontmatter、共享资源去重、非法图结构、推导元数据和方向追踪。正文清单的既有测试主要证明没有被平铺成新节点，尚不足以证明正文被保留；本次实现需要增加内容与归属断言，而不只保留旧的节点清单断言。

现有渲染命令已经接受图 JSON 和 Markdown，生成单文件 HTML。此前真实页面检查已验证标签点击可打开理由和证据，也发现了标签碰撞、原文页丢失和追踪视觉不一致；这些观察用于选定回归场景，不等于缺陷已经修复。

### 验收矩阵

| 场景 | 验收要求 |
|---|---|
| 含步骤正文、权限条件和资源的备份流程 | 完整保留正文、限定条件及资源归属；不出现插件开发阶段；原文页可核对完整输入 |
| 编号与语义阶段不一一对应 | 拆分和归并保持原有顺序与条件；覆盖记录能回到原文；不以固定节点数判定正确 |
| 原文只要求检查、未规定失败目标 | 表达检查与来源缺口，不出现无依据的失败回退或成功终点 |
| 明确请求流程改进 | 事实流程保持不变；工程建议单列目的与新增假设，不进入执行追踪 |
| 普通解释请求 | 不主动增加工程建议；原文中的“优化”等词不作为用户授权 |
| 插件技能开发 | 保留写作、资源与分发约束；“No Packaging Needed”不变成打包步骤 |
| 调试流程 | 保留假设验证、条件重试和原文要求的人工架构复核，不将暂停讨论画成成功 |
| PDF 替代操作 | 每种明确操作关联自己的脚本；示例代码不进入执行链；不把所有 Quick Start 都当成替代操作 |
| 普通无序列表与模糊预览 | 不凭列表格式制造互斥分支；预览能力限制清楚可见 |
| 源文与引用 | frontmatter、正文和引用范围一致；源快照及摘要标识对应同一版本；导出不丢失来源信息 |
| 非法图或来源元数据 | 明确拒绝不符合契约的输入，不产生伪成功交付；有效错误路径保持输入不被覆写 |
| 长标题、长标签、普通分支、回流和自回环 | 验收图中标签不覆盖节点或彼此重叠，标题可读，箭头方向与路由正确 |
| 默认样例的既有标签碰撞 | “Already understood: skip”不覆盖 understand 节点；“Functionality clear”不与“Constrains content”重叠 |
| 执行追踪与关联上下文 | 祖先后代正确、环路终止、无关同级分支不亮；节点、路径、箭头、标签状态一致 |
| 点击、悬停、清除与视图操作 | 节点、边及标签能查看来源；悬停优先与清除行为正确；平移缩放、适配和全屏可用 |
| 主题与示例隔离 | 当前来源和示例与当前图一致；没有示例时不借用其他主题输出；不虚构执行业务结果 |
| 分发一致性 | 验证使用的通用构建与包内模板、安装版本一致；新主题不依赖特制页面或坐标 |

### 执行方式与证据

- 实现前在当前技能上运行有针对性的 Agent 场景并保留旧行为；更新后用相同语义要求复核变化。
- 对正文丢失、资源归属、分类契约和方向边界使用现有 Node 测试入口；UI 使用实际生成 HTML 和真实导入操作验收。
- 浏览器检查复用当前配置指定的现有 CDP Chrome，不另起浏览器进程；验证结束释放本任务标签页，不关闭共享 Chrome。
- 页面验收观察实际可读的卡片、标签、详情和状态变化；全图缩略截图不能单独证明可读性。截图与实际几何检查用于记录结果，不为源码布局细节建立永久测试。
- 本轮仅编写规格，未运行新的功能回归或宣称上述验收已经通过。

## Out of Scope

- 独立网页上传任意 Markdown 后自动获得完整语义理解的产品能力。
- 新模型网关、LLM API 后端、凭据配置、托管或在线执行系统。
- 新的图形输出格式或重写现有其他输出路径；现有路径保留。
- 自动执行业务脚本、安装被解释技能的依赖，或将说明性示例生成的文件冒充真实交付。
- 默认主动改进被解释流程，或把工程建议合入事实主图。
- 以固定节点配额、门禁数量或回路数量定义图质量。
- 声称程序结构校验能够自动证明语义正确。
- 针对一个输入修改生成 HTML、使用特定文案特判或手工坐标修补来通过验收。
- 为本规格引入新的测试专用生产 Interface、浏览器测试框架或替代现有正确追踪算法的重写。
- 本轮实施功能、修改运行时代码、构建分发产物或同步安装技能；本轮交付为规格文档。

## Further Notes

- 术语遵循项目 [领域词汇表](../GLOSSARY.md)。已确认的产品取舍、范围及实施顺序见 [优化方案](skill-optimization-plan.md)。本次未发现适用的 ADR 文档。
- 建议实施顺序为：统一语义契约与规则；修复正文、来源与覆盖；修复通用渲染与追踪呈现；精简技能材料并验证分发。该顺序不表示允许只交付其中一部分。
- 公共参考图可用于视觉对照，但不能替代原文成为语义真值；既有样例迁移必须说明真实来源，不能声称它们全部来自自动 Markdown 推理。
- 此前实际页面与解析检查为当前问题提供证据，既有报告中的“彻底修复”不作为本规格的通过结论。
- Issue 发布目标尚未提供，项目文档和发布元数据中也未找到可确认的 tracker 地址或项目标识。请运行 `/setup-matt-pocock-skills` 完成关联；发布时使用 `ready-for-agent` 标签，无需额外 triage。本地规格已经形成，不将第三方资源仓库猜作发布目标，也不声称 issue 或标签已发布。
