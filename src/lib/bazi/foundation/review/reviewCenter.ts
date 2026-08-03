/**
 * P0-5 Part 5: ReviewCenter — 命理知识审核系统
 *
 * 五维审核：古籍(classic) / 准确率(accuracy) / 冲突(conflict) / Explain(explain) / Quality(quality)
 *
 * 新规则必须通过审核才能进入正式规则库：
 *   1. 古籍审核 — 是否引用古籍？引用是否合法？
 *   2. 准确率审核 — 是否有足够的准确率数据？
 *   3. 冲突审核 — 是否与已有规则冲突？（按类别 + support/oppose 五行重叠检测）
 *   4. Explain 审核 — 是否有充分的解释和追溯？
 *   5. Quality 审核 — 综合质量评分
 *
 * 通过条件：总分 >= 70 且无维度严重失败
 */

import type {
  RuleDSLDefinition,
  DSLCondition,
  DSLConditionGroup,
  ReviewDimension,
  ReviewStatus,
  ReviewDimensionResult,
  ReviewReport,
} from '../types'

// ============================================================
// 审核选项
// ============================================================

/** 单规则审核选项 */
export interface ReviewOptions {
  /** 样本准确率分数 0~100（来自命例库验证） */
  sampleAccuracyScore?: number
  /** 审核人 */
  reviewer?: string
  /** 用于冲突检测的额外已有规则 */
  existingRules?: RuleDSLDefinition[]
  /** 是否跳过冲突检测（首次注册时） */
  skipConflictCheck?: boolean
}

// ============================================================
// 已知古籍列表（用于引用合法性校验）
// ============================================================

const KNOWN_CLASSICS = new Set<string>([
  '滴天髓', '子平真诠', '穷通宝鉴', '三命通会', '渊海子平',
  '神峰通考', '穷通赋', '命理约言', '拦江网', '星平会海',
  '李虚中命书', '珞琭子三命消息赋', '徐氏珞琭子赋注', '宝鉴',
])

// ============================================================
// ReviewCenter 核心类
// ============================================================

/**
 * 命理知识审核中心
 *
 * 对每条新规则执行五维审核，生成 ReviewReport。
 * 已审核规则自动注册，供后续冲突检测使用。
 */
export class ReviewCenter {
  /** 审核历史记录（全量，按时间顺序） */
  private _history: ReviewReport[] = []
  /** 每条规则的最新审核报告 */
  private _latestReport: Map<string, ReviewReport> = new Map()
  /** 已注册规则（用于冲突检测） */
  private _registeredRules: Map<string, RuleDSLDefinition> = new Map()

  // ============================================================
  // 公开方法
  // ============================================================

  /**
   * 单规则审核
   *
   * 执行五维审核：古籍 / 准确率 / 冲突 / Explain / Quality
   * 返回完整 ReviewReport，并将规则注册到内部表（用于后续冲突检测）
   */
  review(rule: RuleDSLDefinition, options?: ReviewOptions): ReviewReport {
    const reviewer = options?.reviewer ?? 'system'
    const now = Date.now()

    // ===== 五维审核 =====
    const classicResult = this._reviewClassic(rule)
    const accuracyResult = this._reviewAccuracy(rule, options)
    const conflictResult = this._reviewConflict(rule, options)
    const explainResult = this._reviewExplain(rule)
    const qualityResult = this._reviewQuality([
      classicResult,
      accuracyResult,
      conflictResult,
      explainResult,
    ])

    const dimensions: ReviewDimensionResult[] = [
      classicResult,
      accuracyResult,
      conflictResult,
      explainResult,
      qualityResult,
    ]

    // ===== 总分（五维平均） =====
    const totalScore = Math.round(
      dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length,
    )

    // ===== 是否通过 =====
    // 通过条件：总分 >= 70 且无维度严重失败（score < 40 且 status = failed）
    const hasCriticalFailure = dimensions.some(
      d => d.status === 'failed' && d.score < 40,
    )
    const approved = totalScore >= 70 && !hasCriticalFailure

    // ===== 总体状态 =====
    const overallStatus: ReviewStatus = approved
      ? 'passed'
      : totalScore >= 50
        ? 'warning'
        : 'failed'

    // ===== 构建报告 =====
    const report: ReviewReport = {
      ruleId: rule.id,
      ruleVersion: rule.version,
      reviewedAt: now,
      reviewer,
      dimensions,
      overallStatus,
      totalScore,
      approved,
      summary: this._buildSummary(rule, dimensions, totalScore, approved),
    }

    // ===== 记录历史 & 注册规则 =====
    this._history.push(report)
    this._latestReport.set(rule.id, report)
    this._registeredRules.set(rule.id, rule)

    return report
  }

  /**
   * 批量审核
   *
   * 按顺序审核多条规则（后续规则可检测到前面已注册规则的冲突）
   */
  batchReview(rules: RuleDSLDefinition[], options?: ReviewOptions): ReviewReport[] {
    return rules.map(rule => this.review(rule, options))
  }

  /**
   * 获取审核历史
   *
   * @param ruleId 可选，按规则 ID 过滤
   */
  getReviewHistory(ruleId?: string): ReviewReport[] {
    if (ruleId) {
      return this._history.filter(r => r.ruleId === ruleId)
    }
    return [...this._history]
  }

  /**
   * 规则是否已通过审核
   */
  isApproved(ruleId: string): boolean {
    const report = this._latestReport.get(ruleId)
    return report?.approved ?? false
  }

  /**
   * 获取规则审核状态（返回最新审核报告）
   */
  getApprovalStatus(ruleId: string): ReviewReport | undefined {
    return this._latestReport.get(ruleId)
  }

  // ============================================================
  // 各维度审核实现
  // ============================================================

  /**
   * 古籍审核（classic）
   *
   * 检查：是否引用古籍？引用是否合法？（classicName/quotedText/supports 齐全）
   */
  private _reviewClassic(rule: RuleDSLDefinition): ReviewDimensionResult {
    const comments: string[] = []
    const issues: string[] = []
    let score = 0

    const sources = rule.source ?? []
    const citations = rule.classicEvidence ?? []

    // ---- 检查来源 ----
    if (sources.length === 0) {
      issues.push('未指定任何古籍来源（source）')
    } else {
      const knownSources = sources.filter(s => KNOWN_CLASSICS.has(s))
      const unknownSources = sources.filter(s => !KNOWN_CLASSICS.has(s))
      if (knownSources.length > 0) {
        comments.push(`引用了已知古籍：${knownSources.join('、')}`)
        score += Math.min(30, knownSources.length * 15)
      }
      if (unknownSources.length > 0) {
        comments.push(`引用了未知来源：${unknownSources.join('、')}（建议核实）`)
        score += unknownSources.length * 5
      }
    }

    // ---- 检查古籍引用证据 ----
    if (citations.length === 0) {
      issues.push('缺少古籍引用证据（classicEvidence）')
    } else {
      let validCount = 0
      for (const cite of citations) {
        // 校验引用完整性
        if (!cite.classicName || !cite.quotedText) {
          issues.push('存在不完整的引用（缺少 classicName 或 quotedText）')
          continue
        }
        if (!cite.supports) {
          issues.push(`引用「${cite.classicName}」缺少 supports 字段`)
          continue
        }
        validCount++
        if (KNOWN_CLASSICS.has(cite.classicName)) {
          comments.push(`有效引用：${cite.classicName}${cite.chapter ? `·${cite.chapter}` : ''}`)
        } else {
          comments.push(`引用非标准古籍：${cite.classicName}（建议核实）`)
        }
      }

      // 根据有效引用数评分
      if (validCount >= 3) score += 70
      else if (validCount === 2) score += 55
      else if (validCount === 1) score += 40
      else score += 10
    }

    score = Math.min(100, score)
    const status: ReviewStatus = score >= 70 ? 'passed' : score >= 40 ? 'warning' : 'failed'

    return { dimension: 'classic', status, score, comments, issues }
  }

  /**
   * 准确率审核（accuracy）
   *
   * 检查：是否有足够的准确率数据？（接受 sampleAccuracyScore 参数）
   */
  private _reviewAccuracy(
    _rule: RuleDSLDefinition,
    options?: ReviewOptions,
  ): ReviewDimensionResult {
    const comments: string[] = []
    const issues: string[] = []
    let score = 0
    let status: ReviewStatus = 'pending'

    const sampleScore = options?.sampleAccuracyScore

    if (sampleScore === undefined) {
      // 无准确率数据
      issues.push('未提供样本准确率数据（sampleAccuracyScore）')
      comments.push('建议在命例库中验证后再提交审核')
      score = 40
      status = 'pending'
    } else {
      // 有准确率数据
      score = Math.max(0, Math.min(100, sampleScore))
      if (score >= 75) {
        comments.push(`准确率优秀：${score.toFixed(1)}%`)
        status = 'passed'
      } else if (score >= 60) {
        comments.push(`准确率合格：${score.toFixed(1)}%`)
        status = 'passed'
      } else if (score >= 40) {
        issues.push(`准确率偏低：${score.toFixed(1)}%（建议优化规则条件）`)
        status = 'warning'
      } else {
        issues.push(`准确率过低：${score.toFixed(1)}%（不建议进入正式库）`)
        status = 'failed'
      }
    }

    return { dimension: 'accuracy', status, score, comments, issues }
  }

  /**
   * 冲突审核（conflict）
   *
   * 检查：是否与已有规则冲突？
   * 检测方式：按类别 + support/oppose 五行重叠
   *   - 新规则 support 的五行 vs 已有规则 oppose 的五行
   *   - 新规则 oppose 的五行 vs 已有规则 support 的五行
   */
  private _reviewConflict(
    rule: RuleDSLDefinition,
    options?: ReviewOptions,
  ): ReviewDimensionResult {
    const comments: string[] = []
    const issues: string[] = []

    if (options?.skipConflictCheck) {
      return {
        dimension: 'conflict',
        status: 'passed',
        score: 100,
        comments: ['已跳过冲突检测'],
        issues: [],
      }
    }

    // 收集所有已有规则（已注册的 + 额外传入的）
    const existingRules: RuleDSLDefinition[] = []
    for (const [id, r] of this._registeredRules) {
      if (id !== rule.id) existingRules.push(r)
    }
    if (options?.existingRules) {
      for (const r of options.existingRules) {
        if (r.id !== rule.id) existingRules.push(r)
      }
    }

    // 提取新规则的 support/oppose 五行
    const newSupport = (rule.support ?? []).map(s => s.wuxing)
    const newOppose = (rule.oppose ?? []).map(s => s.wuxing)

    let conflictCount = 0
    const conflictDetails: string[] = []

    for (const existing of existingRules) {
      const sameCategory = existing.category === rule.category
      const exSupport = (existing.support ?? []).map(s => s.wuxing)
      const exOppose = (existing.oppose ?? []).map(s => s.wuxing)

      // 新规则支持 vs 已有规则反对
      const supportOpposeConflict = newSupport.filter(w => exOppose.includes(w))
      // 新规则反对 vs 已有规则支持
      const opposeSupportConflict = newOppose.filter(w => exSupport.includes(w))

      if (supportOpposeConflict.length > 0 || opposeSupportConflict.length > 0) {
        conflictCount++
        const parts: string[] = []
        if (supportOpposeConflict.length > 0) {
          parts.push(`新规则支持 ${supportOpposeConflict.join('/')} 与 ${existing.id} 反对冲突`)
        }
        if (opposeSupportConflict.length > 0) {
          parts.push(`新规则反对 ${opposeSupportConflict.join('/')} 与 ${existing.id} 支持冲突`)
        }
        conflictDetails.push(
          `${existing.id}（${existing.name}）：${parts.join('；')}${sameCategory ? ' [同类]' : ''}`,
        )
      }
    }

    // 评分：每个冲突扣 20 分
    const score = Math.max(0, 100 - conflictCount * 20)

    if (conflictCount === 0) {
      comments.push(`未发现与已有规则冲突（检测了 ${existingRules.length} 条已有规则）`)
    } else {
      issues.push(`发现 ${conflictCount} 处规则冲突`)
      conflictDetails.forEach(d => issues.push(d))
    }

    const status: ReviewStatus =
      conflictCount === 0 ? 'passed' : conflictCount <= 2 ? 'warning' : 'failed'

    return { dimension: 'conflict', status, score, comments, issues }
  }

  /**
   * Explain 审核（explain）
   *
   * 检查：是否有充分的解释和追溯？
   *   - description 是否充分
   *   - result 是否明确
   *   - conditions 是否可追溯
   *   - confidence 是否有说明
   *   - author / reviewer 信息
   */
  private _reviewExplain(rule: RuleDSLDefinition): ReviewDimensionResult {
    const comments: string[] = []
    const issues: string[] = []
    let score = 0

    // ---- 检查描述 ----
    if (rule.description && rule.description.length >= 20) {
      score += 30
      comments.push('规则描述充分')
    } else if (rule.description) {
      score += 15
      issues.push('规则描述过于简短（建议 >= 20 字）')
    } else {
      issues.push('缺少规则描述')
    }

    // ---- 检查结论 ----
    if (rule.result && rule.result.length >= 10) {
      score += 30
      comments.push('规则结论明确')
    } else if (rule.result) {
      score += 15
      issues.push('规则结论过于简短')
    } else {
      issues.push('缺少规则结论')
    }

    // ---- 检查条件可追溯性 ----
    // 兼容 DSL 格式 (conditions) 和 RuleDefinition 格式 (condition)
    const conditions = this._flattenConditions((rule as any).conditions ?? (rule as any).condition)
    if (conditions.length > 0) {
      const traceableCount = conditions.filter(c => c.description).length
      const traceableRate = traceableCount / conditions.length
      score += Math.round(20 * traceableRate)
      if (traceableRate === 1) {
        comments.push(`所有 ${conditions.length} 个条件均可追溯`)
      } else {
        issues.push(`${conditions.length - traceableCount} 个条件缺少可追溯描述`)
      }
    } else {
      issues.push('未定义成立条件')
    }

    // ---- 检查置信度说明 ----
    if (rule.confidence?.note) {
      score += 10
      comments.push('包含置信度说明')
    } else if (rule.confidence?.components && Object.keys(rule.confidence.components).length > 0) {
      score += 5
    }

    // ---- 检查作者信息 ----
    if (rule.author) {
      comments.push(`作者：${rule.author}`)
    } else {
      issues.push('缺少作者信息')
    }

    score = Math.min(100, score)
    const status: ReviewStatus = score >= 70 ? 'passed' : score >= 40 ? 'warning' : 'failed'

    return { dimension: 'explain', status, score, comments, issues }
  }

  /**
   * Quality 审核（quality）
   *
   * 综合质量评分：加权合成上述四维
   *   古籍 25% / 准确率 25% / 冲突 20% / Explain 30%
   */
  private _reviewQuality(dimensions: ReviewDimensionResult[]): ReviewDimensionResult {
    const comments: string[] = []
    const issues: string[] = []

    // 各维度权重
    const weights: Record<ReviewDimension, number> = {
      classic: 0.25,
      accuracy: 0.25,
      conflict: 0.20,
      explain: 0.30,
      quality: 0, // 自身不参与加权
    }

    let weightedScore = 0
    let totalWeight = 0
    for (const d of dimensions) {
      const w = weights[d.dimension] ?? 0
      weightedScore += d.score * w
      totalWeight += w
    }
    const score = Math.round(totalWeight > 0 ? weightedScore / totalWeight : 0)

    // 汇总各维度状态
    const passedCount = dimensions.filter(d => d.status === 'passed').length
    const warningCount = dimensions.filter(d => d.status === 'warning').length
    const failedCount = dimensions.filter(d => d.status === 'failed').length

    comments.push(`四维通过 ${passedCount} / 警告 ${warningCount} / 失败 ${failedCount}`)
    comments.push(`加权质量分：${score}`)

    // 收集所有维度的问题
    for (const d of dimensions) {
      if (d.issues.length > 0) {
        issues.push(`[${d.dimension}] ${d.issues.join('；')}`)
      }
    }

    const status: ReviewStatus = score >= 70 ? 'passed' : score >= 50 ? 'warning' : 'failed'

    return { dimension: 'quality', status, score, comments, issues }
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /** 展平条件组为单个条件列表（兼容 DSLConditionGroup 和 RuleCondition[]） */
  private _flattenConditions(group: any): DSLCondition[] {
    // 如果传入的是 RuleCondition[]（来自 RuleDefinition），直接转换
    if (Array.isArray(group)) {
      return (group as any[]).map(c => ({
        field: c.description ?? c.formula ?? 'unknown',
        operator: '==' as const,
        value: true,
        description: c.description,
      }))
    }
    // DSLConditionGroup 格式
    if (!group || !group.conditions) return []
    const result: DSLCondition[] = []
    const flatten = (g: DSLConditionGroup) => {
      for (const c of g.conditions) {
        if ('logic' in c) {
          flatten(c as DSLConditionGroup)
        } else {
          result.push(c as DSLCondition)
        }
      }
    }
    flatten(group)
    return result
  }

  /** 构建审核摘要 */
  private _buildSummary(
    rule: RuleDSLDefinition,
    dimensions: ReviewDimensionResult[],
    totalScore: number,
    approved: boolean,
  ): string {
    const dimSummary = dimensions
      .map(d => `${d.dimension}=${d.score}(${d.status})`)
      .join('，')
    const verdict = approved ? '✓ 通过审核' : '✗ 未通过审核'
    return `规则 ${rule.id}（${rule.name}）审核${verdict}。总分：${totalScore}。各维度：${dimSummary}。`
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局 ReviewCenter 单例（全项目共享审核状态） */
export const globalReviewCenter = new ReviewCenter()
