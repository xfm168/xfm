/**
 * ExplainEngine — 推演解释引擎（V2 — 推理链 + 推理树）
 *
 * P2-0 核心升级：
 * - 每个判断必须留下 Explain 记录
 * - Explain 现在包含完整推理链（ReasoningStep[]），而非扁平因素列表
 * - 支持证据式的链式输出格式
 * - Decision Log 升级为推理树（DecisionNode），可追溯依赖关系
 * - 支持向后兼容：旧版 factors 参数自动包装为单步推理链
 */

import type {
  ChartPhase,
  ExplainRecord,
  ExplainFactor,
  ExplainConclusion,
  ReasoningContext,
  ReasoningStep,
  RejectedAlternative,
  DecisionNode,
  DecisionCandidate,
  ClassicalSource,
  ConfidenceSource,
  ExplainSection,
  ExplainSectionType,
  ExplainTemplate,
} from './types'
import { SOURCE_PRIORITY } from './types'

// 重新导出 ConfidenceSource 以便外部直接从此模块引用
export type { ConfidenceSource } from './types'

// ─── 自增 ID 计数器 ───

let explainCounter = 0

export function resetExplainCounter(): void {
  explainCounter = 0
}

// ─── 向后兼容辅助 ───

/** 旧版参数签名（factors 模式） */
interface LegacyCreateExplainParams {
  phase: ChartPhase
  step: string
  subject: string
  factors: ExplainFactor[]
  conclusion: ExplainConclusion
  scores?: Record<string, number>
  rejected?: { subject: string; reason: string; score: number }[]
  references?: string[]
}

/** 新版参数签名（chain 模式） */
interface NewCreateExplainParams {
  phase: ChartPhase
  step: string
  subject: string
  chain: ReasoningStep[]
  conclusion: ExplainConclusion
  scores?: Record<string, number>
  rejected?: RejectedAlternative[]
  references?: string[]
}

/** 统一参数类型（兼容旧版 factors 和新版 chain） */
type CreateExplainParams = LegacyCreateExplainParams | NewCreateExplainParams

/**
 * 将旧版 ExplainFactor[] 自动包装为单步 ReasoningStep[]
 */
function wrapFactorsAsChain(
  factors: ExplainFactor[],
  references?: string[],
): ReasoningStep[] {
  return [
    {
      order: 1,
      name: '综合判定',
      description: `基于 ${factors.length} 个因素综合评估`,
      factors,
      partialConclusion: factors.map(f => f.detail || f.name).join('；'),
      references,
    },
  ]
}

/**
 * 检测参数是否为旧版 factors 模式
 */
function isLegacyParams(params: CreateExplainParams): params is LegacyCreateExplainParams {
  return 'factors' in params
}

// ─── 创建 ExplainRecord ───

/**
 * 创建 ExplainRecord（V2 — 支持推理链）
 *
 * 新版：传入 chain: ReasoningStep[] 完整推理链
 * 旧版兼容：传入 factors: ExplainFactor[]，自动包装为单步链
 */
export function createExplain(params: {
  phase: ChartPhase
  step: string
  subject: string
  chain: ReasoningStep[]
  scores?: Record<string, number>
  conclusion: ExplainConclusion
  rejected?: RejectedAlternative[]
  references?: string[]
}): ExplainRecord

export function createExplain(params: {
  phase: ChartPhase
  step: string
  subject: string
  factors: ExplainFactor[]
  conclusion: ExplainConclusion
  scores?: Record<string, number>
  rejected?: { subject: string; reason: string; score: number }[]
  references?: string[]
}): ExplainRecord

export function createExplain(params: CreateExplainParams): ExplainRecord {
  let chain: ReasoningStep[]
  let rejected: RejectedAlternative[] | undefined

  if (isLegacyParams(params)) {
    // 旧版 factors 模式 — 自动包装为单步推理链
    chain = wrapFactorsAsChain(params.factors, params.references)
    rejected = params.rejected?.map(r => ({
      subject: r.subject,
      reason: r.reason,
      score: r.score,
    }))
  } else {
    // 新版 chain 模式
    chain = params.chain
    rejected = params.rejected
  }

  return {
    id: `exp-${++explainCounter}`,
    phase: params.phase,
    step: params.step,
    subject: params.subject,
    chain,
    scores: params.scores,
    conclusion: params.conclusion,
    rejected,
    timestamp: Date.now(),
    traceId: `EXP-${String(explainCounter).padStart(6, '0')}`,
  }
}

// ─── 追加 Explain 到 ReasoningContext ───

export function appendExplain(ctx: ReasoningContext, record: ExplainRecord): void {
  ctx.explains.push(record)

  // 同时追加到当前阶段的 stateTree 节点
  const currentState = ctx.stateTree[ctx.stateTree.length - 1]
  if (currentState) {
    currentState.explains.push(record)
  }

  // 如果有 decisionLog 条目（兼容旧版），也追加到最近一条
  if (ctx.decisionLog.length > 0) {
    const lastDecision = ctx.decisionLog[ctx.decisionLog.length - 1]
    lastDecision.explains.push(record)
  }
}

// ─── 置信度计算工具 ───

/**
 * 计算置信度并记录来源
 */
export function calculateConfidence(
  sources: ConfidenceSource[],
): { confidence: number; breakdown: ConfidenceSource[] } {
  let total = 0
  const breakdown: ConfidenceSource[] = []

  for (const s of sources) {
    total += s.ratio
    breakdown.push({ ...s })
  }

  // 归一化
  const normalized = breakdown.map(s => ({
    ...s,
    ratio: total > 0 ? s.ratio / total : 0,
  }))

  const confidence = Math.min(1, Math.max(0, total))
  return { confidence, breakdown: normalized }
}

/**
 * 格式化置信度来源为文本
 */
export function formatConfidenceBreakdown(breakdown: ConfidenceSource[]): string {
  const parts = breakdown.map(s => `${s.name}${(s.ratio * 100).toFixed(0)}%`)
  return parts.join(' + ')
}

// ─── Explain 统一格式（Freeze+1） ───

/**
 * 创建统一格式的 Explain 段落
 *
 * 所有 Explain 遵循：Evidence → Rule → Reason → Competition → Decision → Confidence → ClassicalSource
 */
export function createExplainSection(
  type: ExplainSectionType,
  title: string,
  content: string,
  references?: string[],
): ExplainSection {
  return { type, title, content, references }
}

/**
 * 将 ExplainSection[] 包装为标准 ExplainRecord
 *
 * 确保所有模块的 Explain 输出格式一致。
 */
export function createUnifiedExplain(params: {
  phase: ChartPhase
  step: string
  subject: string
  sections: ExplainSection[]
  conclusion: ExplainConclusion
  scores?: Record<string, number>
  rejected?: RejectedAlternative[]
}): ExplainRecord {
  // 将 sections 转换为 ReasoningStep[]（每个 section 成为一步）
  const chain: ReasoningStep[] = params.sections.map((sec, idx) => ({
    order: idx + 1,
    name: sec.type,
    description: sec.title,
    factors: [{ name: sec.content, weight: 0, source: sec.references?.[0], detail: sec.content }],
    partialConclusion: sec.content,
    references: sec.references,
  }))

  return {
    id: `exp-${++explainCounter}`,
    phase: params.phase,
    step: params.step,
    subject: params.subject,
    chain,
    scores: params.scores,
    conclusion: params.conclusion,
    rejected: params.rejected,
    timestamp: Date.now(),
    traceId: `EXP-${String(explainCounter).padStart(6, '0')}`,
  }
}

/**
 * 创建标准七段式 Explain 模板
 *
 * Evidence → Rule → Reason → Competition → Decision → Confidence → ClassicalSource
 */
export function createStandardExplain(params: {
  phase: ChartPhase
  step: string
  subject: string
  evidence: string
  rule: string
  reason: string
  competition: string
  decision: string
  confidence: number
  confidenceBreakdown?: ConfidenceSource[]
  classicalSource?: string
  scores?: Record<string, number>
  rejected?: RejectedAlternative[]
}): ExplainRecord {
  const sections: ExplainSection[] = [
    createExplainSection('Evidence', '证据', params.evidence),
    createExplainSection('Rule', '规则', params.rule, params.classicalSource ? [params.classicalSource] : undefined),
    createExplainSection('Reason', '推理', params.reason),
    createExplainSection('Competition', '竞争评估', params.competition),
    createExplainSection('Decision', '决策结论', params.decision),
  ]

  const conclusion: ExplainConclusion = {
    text: params.decision,
    confidence: params.confidence,
    confidenceBreakdown: params.confidenceBreakdown,
  }

  return createUnifiedExplain({
    phase: params.phase,
    step: params.step,
    subject: params.subject,
    sections,
    conclusion,
    scores: params.scores,
    rejected: params.rejected,
  })
}

// ─── 推理链格式化工具 ───

/**
 * 将推理链中的所有 references 合并去重
 */
function collectAllReferences(chain: ReasoningStep[]): string[] {
  const refs = new Set<string>()
  for (const step of chain) {
    if (step.references) {
      for (const ref of step.references) {
        refs.add(ref)
      }
    }
  }
  return Array.from(refs)
}

/**
 * 生成单条 Explain 的推理链文本（证据式格式）
 *
 * 输出示例：
 *   [SeasonModifier] 月令季节调整
 *     Step 1: 月令司令 — 巳(火)司令当权
 *     Step 2: 藏干分析 — 本气丙火透干, 中气庚金受制
 *     Step 3: 季节调整 — 火得令+3, 金受克-2
 *     → 月令火得令加权（置信度95%）
 *     古籍依据：子平真诠·论月令
 */
export function summarizeExplainRecord(record: ExplainRecord): string {
  const lines: string[] = []

  // 标题行
  lines.push(`[${record.step}] ${record.subject}`)

  // 推理链步骤
  for (const step of record.chain) {
    const factorsStr = step.factors
      .map(f => `${f.name}(${f.weight > 0 ? '+' : ''}${f.weight})`)
      .join(', ')
    const stepLabel = `  Step ${step.order}: ${step.name}`
    if (step.description) {
      lines.push(`${stepLabel} — ${step.description}`)
    }
    if (factorsStr) {
      lines.push(`${stepLabel} [因素: ${factorsStr}]`)
    }
    if (step.partialConclusion) {
      lines.push(`${stepLabel} [部分结论: ${step.partialConclusion}]`)
    }
  }

  // 评分
  if (record.scores) {
    const scoresStr = Object.entries(record.scores)
      .map(([k, v]) => `${k}:${v.toFixed(1)}`)
      .join(' vs ')
    lines.push(`  评分: ${scoresStr}`)
  }

  // 最终结论
  const confidencePercent = (record.conclusion.confidence * 100).toFixed(0)
  lines.push(`  → ${record.conclusion.text}（置信度${confidencePercent}%）`)

  // 被否决的替代方案
  if (record.rejected?.length) {
    const rejectedStr = record.rejected
      .map(r => `${r.subject}(${r.score.toFixed(1)})`)
      .join('、')
    lines.push(`  否决：${rejectedStr}`)
  }

  // 古籍依据（从推理链各步骤收集）
  const allRefs = collectAllReferences(record.chain)
  if (allRefs.length > 0) {
    lines.push(`  古籍依据：${allRefs.join('、')}`)
  }

  // 置信度来源分解
  if (record.conclusion.confidenceBreakdown?.length) {
    lines.push(`  置信度来源：${formatConfidenceBreakdown(record.conclusion.confidenceBreakdown)}`)
  }

  return lines.join('\n')
}

/** 兼容旧调用 */
export const summarizeExplain = summarizeExplainRecord

// ─── 总结指定阶段的 Explain 记录 ───

export function summarizeExplainsByPhase(ctx: ReasoningContext, phase?: ChartPhase): string {
  const explains = phase
    ? ctx.explains.filter(e => e.phase === phase)
    : ctx.explains

  if (explains.length === 0) return '无解释记录'

  const lines: string[] = []
  lines.push(`共 ${explains.length} 条解释记录：`)

  for (const exp of explains) {
    lines.push(`  [${exp.phase}] ${exp.step}: ${exp.subject}`)
    lines.push(`    结论: ${exp.conclusion.text} (置信度 ${(exp.conclusion.confidence * 100).toFixed(0)}%)`)
    lines.push(`    推理链: ${exp.chain.length} 步`)
    if (exp.chain.length > 0) {
      lines.push(`    首步: ${exp.chain[0].name} — ${exp.chain[0].description}`)
    }
    const refs = collectAllReferences(exp.chain)
    if (refs.length > 0) {
      lines.push(`    依据: ${refs.join(', ')}`)
    }
  }

  return lines.join('\n')
}

// ─── DecisionNode 创建 ───

let decisionCounter = 0

export function resetDecisionCounter(): void {
  decisionCounter = 0
}

/**
 * 创建推理树节点
 *
 * 支持依赖关系追踪：parentId 形成父子树，
 * dependencies 形成有向无环图的依赖链。
 */
export function createDecisionNode(params: {
  parentId?: string
  dependencies?: string[]
  phase: ChartPhase
  action: string
  subject: string
  candidates: DecisionCandidate[]
  winner: string
  winnerScore: number
  loserReason: string
  explainId: string
  weight?: number
  importance?: 1 | 2 | 3 | 4 | 5
  priority?: number
  depth?: number
  order?: number
}): DecisionNode {
  // 自动计算 depth：如果有 parentId，查找父节点 depth + 1
  let depth = params.depth ?? 0
  if (params.parentId && typeof params.depth !== 'number') {
    // 默认值，调用方应显式传入 depth
    depth = 0
  }

  return {
    id: `dec-${++decisionCounter}`,
    parentId: params.parentId,
    dependencies: params.dependencies ?? [],
    phase: params.phase,
    action: params.action,
    subject: params.subject,
    candidates: params.candidates,
    winner: params.winner,
    winnerScore: params.winnerScore,
    loserReason: params.loserReason,
    explainId: params.explainId,
    weight: params.weight ?? 1.0,
    importance: params.importance ?? 3,
    priority: params.priority ?? 0,
    depth,
    order: params.order ?? 0,
    traceId: `DEC-${String(decisionCounter).padStart(6, '0')}`,
  }
}

/**
 * 将 DecisionNode 追加到 ReasoningContext.decisionTree
 */
export function appendDecisionNode(ctx: ReasoningContext, node: DecisionNode): void {
  ctx.decisionTree.push(node)
}

// ─── 推理树格式化工具 ───

/**
 * 格式化推理树摘要
 */
function formatDecisionTree(ctx: ReasoningContext): string[] {
  const lines: string[] = []

  if (ctx.decisionTree.length === 0) return lines

  lines.push(`=== 推理树 (${ctx.decisionTree.length} 个决策节点) ===`)

  // 构建父子映射以缩进展示层级
  const childrenMap = new Map<string, DecisionNode[]>()
  const roots: DecisionNode[] = []

  for (const node of ctx.decisionTree) {
    if (node.parentId) {
      const children = childrenMap.get(node.parentId) ?? []
      children.push(node)
      childrenMap.set(node.parentId, children)
    } else {
      roots.push(node)
    }
  }

  function renderNode(node: DecisionNode, depth: number): void {
    const indent = '  '.repeat(depth)
    const depStr = node.dependencies.length > 0
      ? ` [依赖: ${node.dependencies.join(', ')}]`
      : ''
    const candStr = node.candidates
      .map(c => `${c.name}(${c.score.toFixed(1)})`)
      .join(', ')

    lines.push(
      `${indent}#${node.id} [${node.phase}] ${node.action}: ${node.subject}${depStr}`,
    )
    lines.push(
      `${indent}  候选: ${candStr}`,
    )
    lines.push(
      `${indent}  胜出: ${node.winner} (${node.winnerScore.toFixed(1)}) | 败选原因: ${node.loserReason}`,
    )
    lines.push(
      `${indent}  Explain: ${node.explainId}`,
    )

    const children = childrenMap.get(node.id)
    if (children) {
      for (const child of children) {
        renderNode(child, depth + 1)
      }
    }
  }

  for (const root of roots) {
    renderNode(root, 0)
  }

  return lines
}

// ─── 生成完整报告 ───

/**
 * 生成完整推演报告（V2 — 含推理链 + 推理树）
 *
 * 包含：
 * 1. 基本信息（四柱、日主、月令、旺衰、格局）
 * 2. 状态树概要（各阶段）
 * 3. 所有 Explain 记录（完整推理链格式）
 * 4. 推理树摘要（决策节点层级关系）
 * 5. 旧版决策日志（如有，向后兼容）
 */
export function generateFullReport(ctx: ReasoningContext): string {
  const sections: string[] = []

  // 1. 基本信息
  sections.push(`=== 命局推演报告 ===`)
  sections.push(`四柱: ${ctx.sixLinesName}`)
  sections.push(`日主: ${ctx.dayGan}(${ctx.dayElement})  月令: ${ctx.monthZhi}(${ctx.monthElement})`)
  if (ctx.currentWangShuai) sections.push(`旺衰: ${ctx.currentWangShuai}`)
  if (ctx.currentStructure) sections.push(`格局: ${ctx.currentStructure}`)
  if (ctx.currentStructureDynamic) {
    const ds = ctx.currentStructureDynamic
    const prev = ds.evolution.length > 0 ? ds.evolution[ds.evolution.length - 1].previousStructure : undefined
    sections.push(`动态格局: ${ds.name}${ds.stable ? '(稳定)' : '(不稳定)'}${prev ? ` ← ${prev}` : ''}`)
  }
  if (ctx.yongShen) {
    sections.push(`用神: ${ctx.yongShen.element} (${ctx.yongShen.type}) — ${ctx.yongShen.reason}`)
  }
  if (ctx.xiShen?.length) sections.push(`喜神: ${ctx.xiShen.join('、')}`)
  if (ctx.jiShen?.length) sections.push(`忌神: ${ctx.jiShen.join('、')}`)
  if (ctx.diseases?.length) {
    sections.push(`病态: ${ctx.diseases.map(d => `${d.name}(${(d.severity * 100).toFixed(0)}%)`).join('、')}`)
  }
  if (ctx.medicines?.length) {
    sections.push(`药方: ${ctx.medicines.map(m => `${m.name}→${m.targetDisease}${m.injured ? '(受伤)' : ''}`).join('、')}`)
  }
  sections.push('')

  // 2. 阶段状态树概要
  sections.push(`=== 状态树 (${ctx.stateTree.length} 阶段) ===`)
  for (const node of ctx.stateTree) {
    const explainCount = node.explains.length
    const structureStr = node.currentStructure ? ` | ${node.currentStructure}` : ''
    const wangShuaiStr = node.currentWangShuai ? ` | ${node.currentWangShuai}` : ''
    sections.push(`  ${node.phase}: ${explainCount} 条解释${structureStr}${wangShuaiStr}`)
  }
  sections.push('')

  // 3. 所有解释记录（完整推理链格式）
  sections.push(`=== 解释记录 (${ctx.explains.length} 条) ===`)
  for (const exp of ctx.explains) {
    sections.push(summarizeExplainRecord(exp))
    sections.push('')
  }

  // 4. 推理树摘要
  const treeLines = formatDecisionTree(ctx)
  if (treeLines.length > 0) {
    sections.push('')
    sections.push(...treeLines)
    sections.push('')
  }

  // 5. 旧版决策日志（向后兼容）
  if (ctx.decisionLog.length > 0) {
    sections.push(`=== 决策日志 (${ctx.decisionLog.length} 条，旧版兼容) ===`)
    for (const entry of ctx.decisionLog) {
      sections.push(`#${entry.step} [${entry.phase}] ${entry.action}: ${entry.subject}`)
      sections.push(`  胜出: ${entry.winner} (${entry.winnerScore})`)
      sections.push(`  落选原因: ${entry.loserReason}`)
    }
  }

  return sections.join('\n')
}
