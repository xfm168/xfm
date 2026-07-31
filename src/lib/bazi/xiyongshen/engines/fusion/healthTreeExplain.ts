/**
 * EngineHealth + EvidenceTree V2 + ExplainBuilder
 *
 * 三个配套模块：
 * 1. EngineHealth  - 每个引擎的健康度评估（Dashboard 用）
 * 2. EvidenceTreeV2Builder - 构建真正的树结构（Decision → Engine → Rule/Evidence/Classic）
 * 3. ExplainBuilder - 基于 Trace + Conflict + Classic + Voting + Meta 自动生成自然语言说明
 */

import type { Wuxing } from '../../types'
import type { SubEngineResult } from '../types'
import type { ClassicEvidenceRef } from '../../../ruleEngine/types'
import type {
  EngineHealthReport, EngineHealthEntry, EngineHealthStatus,
  EvidenceTree, EvidenceTreeNode, TreeNodeType,
  RulePriorityMatrix, GateReport, KillReport,
  MetaDecision, ConflictReport, RuleVoteSummary,
  DecisionResult, SchoolProfile, FinalDecisionScoreBreakdown,
} from './types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const ENGINE_NAMES = [
  'StrengthEngine', 'PatternEngine', 'ClimateEngine', 'BalanceEngine',
  'MedicineEngine', 'BridgeEngine', 'SeasonEngine',
] as const

// ============================================================
// EngineHealth：引擎健康度
// ============================================================

export class EngineHealthEvaluator {
  /**
   * 评估所有引擎健康度（当前命局 + 全局统计的简单版本）
   * 更完整的 Dashboard 统计会在 Sprint3-5 批量回归后完善。
   */
  evaluate(
    subResults: SubEngineResult[],
    gate: GateReport,
    kill: KillReport,
    priorityMatrix: RulePriorityMatrix,
    conflictReport: ConflictReport,
  ): EngineHealthReport {
    const engines: Record<string, EngineHealthEntry> = {}
    let healthyCount = 0, warningCount = 0, unhealthyCount = 0

    // 计算每个引擎的冲突次数
    const perEngineConflicts: Record<string, number> = {}
    for (const c of conflictReport.conflicts) {
      perEngineConflicts[c.engineA] = (perEngineConflicts[c.engineA] ?? 0) + 1
      perEngineConflicts[c.engineB] = (perEngineConflicts[c.engineB] ?? 0) + 1
    }

    const totalEngines = subResults.length

    for (const r of subResults) {
      const entry = this.evaluateOne(r, gate, kill, priorityMatrix, perEngineConflicts)
      engines[r.engineName] = entry
      if (entry.status === 'healthy') healthyCount++
      else if (entry.status === 'warning') warningCount++
      else unhealthyCount++
    }

    // 整体健康度 = 各引擎 healthScore 按 priority 加权
    let weightedSum = 0, weightSum = 0
    for (const name of ENGINE_NAMES) {
      const e = engines[name]
      const pri = priorityMatrix.byEngine[name]?.priority ?? 0
      if (e && pri > 0) {
        weightedSum += e.healthScore * pri
        weightSum += pri
      }
    }
    const overallHealth = weightSum > 0
      ? Number((weightedSum / weightSum).toFixed(2))
      : Number(((healthyCount * 100 + warningCount * 60 + unhealthyCount * 20) / Math.max(totalEngines, 1)).toFixed(2))

    const recommendations: string[] = []
    if (unhealthyCount > 0) {
      const names = Object.values(engines).filter(e => e.status === 'unhealthy').map(e => e.engineName).join(', ')
      recommendations.push(`不健康引擎（${unhealthyCount}个）：${names}，建议检查 Evidence 输入与阈值设置`)
    }
    if (warningCount > 0) {
      const names = Object.values(engines).filter(e => e.status === 'warning').map(e => e.engineName).join(', ')
      recommendations.push(`警告引擎（${warningCount}个）：${names}，Sprint3-5 回归时关注其表现`)
    }
    if (conflictReport.totalConflicts >= 3) {
      recommendations.push(`冲突数量（${conflictReport.totalConflicts}）较多，建议核查命局`)
    }
    if (recommendations.length === 0) {
      recommendations.push('引擎整体健康度良好，可推进命例回归')
    }

    return {
      engines,
      overallHealth,
      healthyCount,
      warningCount,
      unhealthyCount,
      recommendations,
      generatedAt: Date.now(),
    }
  }

  private evaluateOne(
    r: SubEngineResult,
    gate: GateReport,
    kill: KillReport,
    priorityMatrix: RulePriorityMatrix,
    perEngineConflicts: Record<string, number>,
  ): EngineHealthEntry {
    const engineName = r.engineName
    const applicable = r.applicable ? 1 : 0
    const evidenceCount = r.evidence.length
    const satisfiedCount = r.evidence.filter(e => e.satisfied).length
    const classicCount = r.classicEvidence.length
    const confidence = r.confidence
    const priority = priorityMatrix.byEngine[engineName]?.priority ?? 0
    const conflicts = perEngineConflicts[engineName] ?? 0

    // 各维度得分（0~100）
    const applicability = applicable * 100
    const evidenceQuality = evidenceCount > 0
      ? Number(((satisfiedCount / Math.max(evidenceCount, 1)) * 100).toFixed(2))
      : 10
    const classicSupport = Math.min(classicCount * 25, 100)
    const conf = Number((confidence * 100).toFixed(2))
    const stability = Math.max(100 - conflicts * 25, 0) // 每次冲突扣 25

    const dimensionScores = { applicability, evidenceQuality, classicSupport, confidence: conf, stability }

    // 健康总分（加权）
    const healthScore = Number((
      applicability * 0.15 +
      evidenceQuality * 0.25 +
      classicSupport * 0.15 +
      conf * 0.25 +
      stability * 0.20
    ).toFixed(2))

    // 健康状态
    let status: EngineHealthStatus
    if (kill.entries[engineName]?.killed) {
      status = 'unhealthy'
    } else if (healthScore >= 75 && gate.results[engineName]?.passed) {
      status = 'healthy'
    } else if (healthScore >= 45) {
      status = 'warning'
    } else {
      status = 'unhealthy'
    }

    const notes = kill.entries[engineName]?.killed
      ? `本轮被 Rule Kill：${kill.entries[engineName].killDescription}`
      : !gate.results[engineName]?.passed
        ? `未通过 Rule Gate：${gate.results[engineName].rejectReason}`
        : undefined

    return {
      engineName,
      status,
      healthScore,
      applicableRate: applicable,
      conflictRate: Number((conflicts / Math.max(ENGINE_NAMES.length - 1, 1)).toFixed(4)),
      avgEvidenceCount: evidenceCount,
      avgSatisfiedEvidenceCount: satisfiedCount,
      avgClassicCount: classicCount,
      avgConfidence: Number(confidence.toFixed(4)),
      avgPriority: Number(priority.toFixed(4)),
      gateRejectCount: gate.results[engineName]?.passed ? 0 : 1,
      killCount: kill.entries[engineName]?.killed ? 1 : 0,
      dimensionScores,
      notes,
    }
  }
}

// ============================================================
// EvidenceTree V2 Builder：真正的树结构
// Decision → Engines（7个） → Rules（Evidence分组） → Evidences / Classics
// ============================================================

export class EvidenceTreeV2Builder {
  /**
   * 构建真正的树结构 EvidenceTree（同时保留 V1 扁平 nodes 以兼容）
   */
  build(
    subResults: SubEngineResult[],
    priorityMatrix: RulePriorityMatrix,
    decision: DecisionResult | null = null,
  ): EvidenceTree {
    // ===== V2 树结构 =====
    const engineNodes: Record<string, EvidenceTreeNode> = {}
    const engineTreeNodes: EvidenceTreeNode[] = []

    for (const r of subResults) {
      const engineNode = this.buildEngineNode(r, priorityMatrix)
      engineNodes[r.engineName] = engineNode
      engineTreeNodes.push(engineNode)
    }

    const root: EvidenceTreeNode = {
      nodeId: 'root',
      nodeType: 'decision',
      label: decision ? `最终决策：用神=${decision.primaryYongShen}${decision.secondaryYongShen ? '/' + decision.secondaryYongShen : ''}（confidence=${decision.confidence.toFixed(2)}）` : 'Evidence Fusion 决策',
      expandable: true,
      expanded: true,
      description: decision?.strategy ?? '玄风门统一命理决策核心',
      children: engineTreeNodes,
    }

    // 统计
    const { totalNodeCount, maxDepth } = this.measureTree(root)

    // ===== V1 扁平结构（兼容） =====
    const nodes = subResults.map(r => ({
      engineName: r.engineName,
      applicable: r.applicable,
      skipReason: r.skipReason,
      evidence: r.evidence,
      classicEvidence: r.classicEvidence,
      confidence: r.confidence,
      weight: priorityMatrix.byEngine[r.engineName]?.priority ?? r.weight,
      scores: r.scores,
      summary: r.summary,
    }))

    const totalEvidence = subResults.reduce((sum, r) => sum + r.evidence.length, 0)
    const satisfiedEvidence = subResults.reduce((sum, r) => sum + r.evidence.filter(e => e.satisfied).length, 0)
    const completeness = totalEvidence > 0 ? Number((satisfiedEvidence / totalEvidence).toFixed(4)) : 0

    const classicsSet = new Set<string>()
    let totalClassicRefs = 0
    for (const r of subResults) {
      for (const ce of r.classicEvidence) {
        classicsSet.add(ce.classicName)
        totalClassicRefs++
      }
    }

    return {
      // V2
      root,
      engineNodes,
      maxDepth,
      totalNodeCount,
      // V1（兼容）
      nodes,
      totalEvidence,
      satisfiedEvidence,
      completeness,
      classics: [...classicsSet],
      totalClassicRefs,
    }
  }

  /** 构建单个引擎节点（含子节点） */
  private buildEngineNode(r: SubEngineResult, priorityMatrix: RulePriorityMatrix): EvidenceTreeNode {
    const engineName = r.engineName
    const pri = priorityMatrix.byEngine[engineName]

    // --- Sub-Nodes: Rule（按 Evidence.step 前缀分组） ---
    const ruleGroups = new Map<string, typeof r.evidence>()
    for (const e of r.evidence) {
      const key = e.step.split('：')[0] ?? e.step
      if (!ruleGroups.has(key)) ruleGroups.set(key, [])
      ruleGroups.get(key)!.push(e)
    }

    const ruleNodes: EvidenceTreeNode[] = []
    let ruleIdx = 0
    for (const [ruleName, groupEvidence] of ruleGroups.entries()) {
      const satisfiedInRule = groupEvidence.filter(e => e.satisfied).length
      const ruleScore = groupEvidence.length > 0 ? Number((satisfiedInRule / groupEvidence.length).toFixed(2)) : 0

      // Evidence 子节点
      const evidenceNodes: EvidenceTreeNode[] = groupEvidence.map((e, i) => ({
        nodeId: `${engineName}-rule${ruleIdx}-ev${i}`,
        nodeType: 'evidence' as TreeNodeType,
        label: `[${e.step}] ${e.text}${e.citation ? `（引自《${e.citation}》）` : ''}`,
        expandable: false,
        satisfied: e.satisfied,
        score: e.satisfied ? 1 : 0,
        evidenceStep: e.step,
        engineName,
        wuxing: this.extractWuxing(e.text),
      }))

      // Classic 子节点（当前 rule 命中的经典证据，或引擎全局）
      const classicNodes: EvidenceTreeNode[] = []
      const classicsForEngine = r.classicEvidence.filter(c =>
        groupEvidence.some(e => e.citation === c.classicName || c.ruleName?.includes(ruleName)),
      )
      classicsForEngine.forEach((c, i) => {
        classicNodes.push({
          nodeId: `${engineName}-rule${ruleIdx}-cl${i}`,
          nodeType: 'classic' as TreeNodeType,
          label: `📜 《${c.classicName}》·${c.ruleName ?? '原文'}：${c.content ?? c.originalText ?? ''}`,
          expandable: false,
          satisfied: true,
          citation: c,
          description: `卷${c.juan ?? '?'} · 条${c.tiao ?? '?'}`,
          engineName,
        })
      })

      ruleNodes.push({
        nodeId: `${engineName}-rule${ruleIdx}`,
        nodeType: 'rule' as TreeNodeType,
        label: `${ruleName}（${satisfiedInRule}/${groupEvidence.length} 条满足 · 得分 ${ruleScore}）`,
        expandable: true,
        satisfied: ruleScore >= 0.5,
        score: ruleScore,
        engineName,
        children: [...evidenceNodes, ...classicNodes],
      })
      ruleIdx++
    }

    // --- 全局 Classics（未分配到 rule 的） ---
    const unassignedClassics = r.classicEvidence.filter(c =>
      !ruleNodes.some(rn => rn.children?.some(ch => ch.nodeType === 'classic' && ch.citation?.classicName === c.classicName && ch.citation?.ruleName === c.ruleName)),
    )
    if (unassignedClassics.length > 0) {
      const globalClassicNodes: EvidenceTreeNode[] = unassignedClassics.map((c, i) => ({
        nodeId: `${engineName}-global-cl${i}`,
        nodeType: 'classic' as TreeNodeType,
        label: `📜 《${c.classicName}》·${c.ruleName ?? '原文'}：${c.content ?? c.originalText ?? ''}`,
        expandable: false,
        satisfied: true,
        citation: c,
        engineName,
      }))
      ruleNodes.push({
        nodeId: `${engineName}-global-classics`,
        nodeType: 'rule' as TreeNodeType,
        label: `经典依据（${unassignedClassics.length} 条）`,
        expandable: true,
        satisfied: true,
        engineName,
        children: globalClassicNodes,
      })
    }

    const engineHealthText = r.applicable
      ? `适用 · confidence=${r.confidence.toFixed(2)} · 权重=${pri?.priority ? pri.priority.toFixed(3) : r.weight.toFixed(3)}`
      : `不适用：${r.skipReason ?? '未知'}`

    return {
      nodeId: engineName,
      nodeType: 'engine' as TreeNodeType,
      label: `${engineName.replace('Engine', '')}（${engineHealthText}）`,
      expandable: true,
      satisfied: r.applicable,
      score: Number(r.confidence.toFixed(2)),
      description: r.summary,
      engineName,
      children: ruleNodes,
      metadata: {
        baseWeight: pri?.baseWeight ?? r.weight,
        adjustmentFactor: pri?.adjustmentFactor,
        priorityReason: pri?.reason,
      },
    }
  }

  /** 从文本中提取五行（用于前端高亮） */
  private extractWuxing(text: string): Wuxing | undefined {
    for (const wx of WUXING_LIST) {
      if (text.includes(wx)) return wx
    }
    return undefined
  }

  /** 统计树的节点总数与最大深度 */
  private measureTree(root: EvidenceTreeNode): { totalNodeCount: number; maxDepth: number } {
    let total = 0
    let maxD = 0
    const dfs = (node: EvidenceTreeNode, depth: number) => {
      total++
      maxD = Math.max(maxD, depth)
      if (node.children) {
        for (const ch of node.children) dfs(ch, depth + 1)
      }
    }
    dfs(root, 0)
    return { totalNodeCount: total, maxDepth: maxD }
  }
}

// ============================================================
// ExplainBuilder：基于 DecisionTrace/Conflict/Classic/Voting/Meta
// 自动生成自然语言说明（AI 只负责润色，绝不重新推理）
// ============================================================

export class ExplainBuilder {
  /**
   * 构建完整 Explain 文本（结构化自然语言）
   */
  build(params: {
    result: DecisionResult
    priorityMatrix: RulePriorityMatrix
    gateReport: GateReport
    killReport: KillReport
    metaDecision: MetaDecision
    scoreBreakdown: FinalDecisionScoreBreakdown[]
    votingSummary: Record<Wuxing, RuleVoteSummary>
    subResults: SubEngineResult[]
    profile: SchoolProfile
  }): string {
    const {
      result, priorityMatrix, gateReport, killReport, metaDecision,
      scoreBreakdown, votingSummary, subResults, profile,
    } = params

    const lines: string[] = []
    const L = (s: string) => lines.push(s)

    L('【玄风门·统一命理决策核心 Explain V2】')
    L('（本 Explain 由 ExplainBuilder 自动生成，AI 仅负责润色，绝不重新推理）')
    L('')
    L(`流派：${profile.name} · ${profile.description}`)
    L(`引擎版本：UnifiedDecisionCore V2（${result.engineVersion}）`)
    L('')

    // ===== 一、元决策结论 =====
    L('━━━ 一、MetaDecision 元决策（玄风门大脑）━━━')
    L(`  主策略：${this.strategyToCN(metaDecision.primaryStrategy)}`)
    if (metaDecision.secondaryStrategies.length > 0) {
      L(`  次策略：${metaDecision.secondaryStrategies.map(s => this.strategyToCN(s)).join(' / ')}`)
    }
    L(`  命局特征识别：${priorityMatrix.patternSummary}`)
    if (metaDecision.shouldUseMultiYongShen && metaDecision.multiYongShenMode) {
      L(`  用神模式：多用神（${this.modeToCN(metaDecision.multiYongShenMode)}）`)
    } else {
      L('  用神模式：单用神为主')
    }
    L(`  说明：${metaDecision.strategyExplanation}`)
    L('')

    // ===== 二、最终结论 =====
    L('━━━ 二、最终用神裁决（依据 DecisionResult）━━━')
    if (result.isMultiYongShen && result.secondaryYongShen) {
      L(`  主用神：${result.primaryYongShen}`)
      L(`  次用神：${result.secondaryYongShen}（${result.multiYongShenPattern ?? '并用'}）`)
    } else {
      L(`  用神：${result.primaryYongShen}`)
    }
    L(`  喜神（辅助）：${result.assistantGod}`)
    L(`  忌神：${result.avoidGod}`)
    L(`  闲神：${result.idleGod}`)
    L(`  综合可信度：${(result.confidence * 100).toFixed(1)}%`)
    L('')

    // ===== 三、Rule Priority Matrix（动态优先级） =====
    L('━━━ 三、Rule Priority Matrix（动态优先级，非固定 Weight）━━━')
    const sortedEntries = [...priorityMatrix.entries].sort((a, b) => b.priority - a.priority)
    for (const e of sortedEntries) {
      const name = e.engineName.replace('Engine', '')
      const bar = this.makeBar(e.priority * 50)
      L(`  ${name.padEnd(8)} priority=${e.priority.toFixed(3)} ${bar} | ${e.reason}`)
    }
    L('')

    // ===== 四、Rule Gate & Rule Kill =====
    L('━━━ 四、Rule Gate（准入） & Rule Kill（淘汰）━━━')
    L(`  Gate：${gateReport.summary}`)
    for (const r of subResults) {
      const g = gateReport.results[r.engineName]
      const k = killReport.entries[r.engineName]
      const status =
        k?.killed ? `❌ KILLED → ${k.killDescription}`
          : g?.passed ? `✅ PASS`
            : `🚫 GATE-REJECT → ${g?.rejectReason ?? '未知'}`
      L(`    · ${r.engineName.replace('Engine', '').padEnd(8)} ${status}`)
    }
    L(`  Kill：${killReport.summary}`)
    L('')

    // ===== 五、Weighted Voting（加权投票） =====
    L('━━━ 五、Weighted Voting（加权投票 V2）━━━')
    for (const wx of WUXING_LIST) {
      const vs = votingSummary[wx]
      const bd = scoreBreakdown.find(b => b.wuxing === wx)!
      const pluses = this.makePluses(vs.supportRate)
      L(`  ${wx}：支持 ${vs.supportCount} · 反对 ${vs.opposeCount} · 有效票 ${vs.validVoteCount}（Gate拒绝${vs.gatedVoteCount}/Kill${vs.killedVoteCount}） → 支持率 ${(vs.supportRate * 100).toFixed(0)}%${pluses} | 投票分=${bd.voteScore.toFixed(3)}`)
    }
    L('')

    // ===== 六、Conflict Report（完整链路） =====
    L('━━━ 六、Conflict Resolver（冲突裁决·完整链路）━━━')
    if (result.conflictReport.totalConflicts === 0) {
      L('  无引擎间显著冲突，决策一致性良好。')
    } else {
      L(`  共检测到 ${result.conflictReport.totalConflicts} 处冲突（已裁决 ${result.conflictReport.adjudicatedCount}，未裁决 ${result.conflictReport.unadjudicatedCount}），最大强度=${result.conflictReport.maxIntensity}，冲突惩罚=${result.conflictReport.conflictPenalty.toFixed(3)}`)
      for (const c of result.conflictReport.conflicts) {
        L('')
        L(`  ▸ ${c.wuxing} 冲突：${c.engineA.replace('Engine', '')} vs ${c.engineB.replace('Engine', '')}`)
        L(`    · ${c.engineA}：评${c.scoreA.toFixed(1)}（${c.stanceA}） priority=${c.priorityA?.toFixed(3) ?? '?'} | Evidence ${c.evidenceA?.length ?? '?'}条 · Classics ${c.classicsA?.length ?? '?'}条`)
        L(`    · ${c.engineB}：评${c.scoreB.toFixed(1)}（${c.stanceB}） priority=${c.priorityB?.toFixed(3) ?? '?'} | Evidence ${c.evidenceB?.length ?? '?'}条 · Classics ${c.classicsB?.length ?? '?'}条`)
        L(`    · 冲突来源：${c.conflictSource}`)
        L(`    · 优先级依据：${c.priorityBasis ?? '流派配置优先级 × 权重'}`)
        L(`    · 裁决 → 采纳：${c.adoptionReason}`)
        L(`    · 裁决 → 舍弃：${c.rejectionReason}`)
        if (c.adjudicatingClassics?.length) {
          L(`    · 裁决经典依据：${c.adjudicatingClassics.map(n => '《' + n + '》').join(' · ')}`)
        }
      }
    }
    L('')

    // ===== 七、FinalDecisionScore（各五行综合分） =====
    L('━━━ 七、FinalDecisionScore 综合评分构成（Evidence Fusion Formula）━━━')
    L('  Formula: (加权 + 投票 + 古籍 + 证据 + 共识) × PriorityFactor − ConflictPenalty = FinalScore')
    for (const bd of [...scoreBreakdown].sort((a, b) => b.finalScore - a.finalScore)) {
      L(`  ${bd.wuxing}：`)
      L(`    加权=${bd.weightedScore.toFixed(3)} + 投票=${bd.voteScore.toFixed(3)} + 古籍=${bd.classicScore.toFixed(3)} + 证据=${bd.evidenceScore.toFixed(3)} + 共识=${bd.consensusScore.toFixed(3)}`)
      L(`    × PriorityFactor=${bd.priorityFactor.toFixed(3)} − ConflictPenalty=${bd.conflictPenalty.toFixed(3)} → 最终 FinalScore=${bd.finalScore.toFixed(3)}`)
    }
    L('')

    // ===== 八、各引擎 Evidence 摘要 =====
    L('━━━ 八、7 × Evidence Engine 证据摘要（点击 EvidenceTree 展开详情）━━━')
    for (const r of subResults) {
      const pri = priorityMatrix.byEngine[r.engineName]?.priority.toFixed(3) ?? r.weight.toFixed(3)
      if (!r.applicable) {
        L(`  · ${r.engineName.replace('Engine', '').padEnd(8)} [不适用 · priority=${pri}]：${r.skipReason ?? ''}`)
        continue
      }
      const topWuxing = this.topWuxingOfEngine(r)
      L(`  · ${r.engineName.replace('Engine', '').padEnd(8)} [priority=${pri} · conf=${r.confidence.toFixed(2)} · Evd=${r.evidence.filter(e => e.satisfied).length}/${r.evidence.length} · Cls=${r.classicEvidence.length}] 推荐→${topWuxing} | ${r.summary}`)
    }
    L('')

    // ===== 九、DecisionTrace 指引 =====
    L('━━━ 九、DecisionTrace & EvidenceTree & ClassicSupport ━━━')
    L('  · 每个五行的完整决策过程，请查阅 decisionTraces 字段（逐步骤可回放）')
    L('  · 每条 Evidence/古籍原文树状展开，请查阅 evidenceTree.root（点击展开）')
    L('  · 古籍支持度详情，请查阅 classicSupport（按五行分组）')
    L('  · 跨流派共识，请查阅 schoolConsensus（各流派评分对比）')
    L('  · 引擎健康度详情，请查阅 engineHealth（Dashboard 统计入口）')
    L('')

    return lines.join('\n')
  }

  /** 引擎最推荐的五行 */
  private topWuxingOfEngine(r: SubEngineResult): string {
    const entries = WUXING_LIST.map(wx => ({ wx, s: r.scores[wx] ?? 0 }))
      .sort((a, b) => b.s - a.s)
    const top3 = entries.slice(0, 3).filter(e => e.s > 0).map(e => e.wx)
    return top3.length > 0 ? top3.join('/') : '（无正向推荐）'
  }

  private strategyToCN(s: string): string {
    const m: Record<string, string> = {
      climate_first: '调候优先',
      balance_first: '扶抑优先',
      pattern_first: '格局优先',
      medicine_first: '病药优先',
      bridge_first: '通关优先',
      season_first: '寒暖燥湿优先',
      multi_yongshen: '多用神策略',
      single_yongshen: '单用神策略',
      comprehensive: '综合权衡',
    }
    return m[s] ?? s
  }

  private modeToCN(m: string): string {
    const map: Record<string, string> = {
      combined_use: '并用',
      dual_image: '两神成象',
      mutual_generation: '相生并用',
      bridge_use: '通关并用',
      climate_assist: '调候+辅助',
    }
    return map[m] ?? m
  }

  private makeBar(value: number): string {
    const n = Math.max(0, Math.min(50, Math.round(value)))
    return '█'.repeat(n) + '░'.repeat(Math.max(0, 20 - n))
  }

  private makePluses(rate: number): string {
    const n = Math.round(rate * 5)
    return ' ' + '+'.repeat(Math.max(1, n))
  }
}

/** 全局默认实例 */
export const globalEngineHealthEvaluator = new EngineHealthEvaluator()
export const globalEvidenceTreeV2Builder = new EvidenceTreeV2Builder()
export const globalExplainBuilder = new ExplainBuilder()
