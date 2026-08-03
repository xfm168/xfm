/**
 * P0-5 Part 6: Knowledge Benchmark — 知识基准系统
 *
 * 评估每条规则的知识质量，判定稳定性等级：
 *   - classicConformance    古籍符合度（引用数 + 有效性）
 *   - modernCaseConformance  现代命例符合度（命中率）
 *   - controversyLevel       争议度（古籍分歧 / 流派分歧）
 *
 * 稳定性判定：
 *   - stable       : classicConformance > 0.7 AND controversyLevel < 0.3
 *   - deprecated   : classicConformance < 0.3 OR controversyLevel > 0.7
 *   - experimental : 介于两者之间
 *
 * 建议：
 *   - keep      → stable
 *   - review    → experimental
 *   - deprecate → deprecated
 */

import type {
  RuleDSLDefinition,
  KnowledgeStability,
  RuleKnowledgeBenchmark,
} from '../types'

// ============================================================
// 评估选项
// ============================================================

/** 单规则知识评估选项 */
export interface BenchmarkOptions {
  /** 命例命中率 0~1（来自 CaseDatabase 验证） */
  hitRate?: number
  /** 支持的流派列表 */
  supportingSchools?: string[]
  /** 反对的流派列表 */
  opposingSchools?: string[]
  /** 争议说明 */
  controversyNote?: string
  /** 争议度覆盖 0~1（如已知则直接传入） */
  controversyLevel?: number
}

// ============================================================
// 已知古籍列表（用于引用有效性校验）
// ============================================================

const KNOWN_CLASSICS = new Set<string>([
  '滴天髓', '子平真诠', '穷通宝鉴', '三命通会', '渊海子平',
  '神峰通考', '穷通赋', '命理约言', '拦江网', '星平会海',
  '李虚中命书', '珞琭子三命消息赋', '徐氏珞琭子赋注', '宝鉴',
])

// ============================================================
// KnowledgeBenchmark 核心类
// ============================================================

/**
 * 知识基准评估系统
 *
 * 对每条规则评估古籍符合度、现代命例符合度、争议度，
 * 判定稳定性等级（stable / experimental / deprecated），
 * 并给出 keep / review / deprecate 建议。
 */
export class KnowledgeBenchmark {
  /** 每条规则的最新评估结果 */
  private _assessments: Map<string, RuleKnowledgeBenchmark> = new Map()
  /** 评估历史记录 */
  private _history: RuleKnowledgeBenchmark[] = []

  // ============================================================
  // 公开方法
  // ============================================================

  /**
   * 单规则知识评估
   *
   * @param rule 规则 DSL 定义
   * @param options 评估选项（可传入命中率、流派信息、争议度等）
   * @returns 知识基准评估结果
   */
  assess(rule: RuleDSLDefinition, options?: BenchmarkOptions): RuleKnowledgeBenchmark {
    const citations = rule.classicEvidence ?? []
    const sources = rule.source ?? []

    // ===== 1. 古籍符合度 =====
    const classicConformance = this._calcClassicConformance(citations, sources)

    // ===== 2. 现代命例符合度 =====
    const modernCaseConformance = this._clamp(options?.hitRate ?? 0.5, 0, 1)

    // ===== 3. 争议度 =====
    const controversyLevel = this._calcControversyLevel(citations, sources, options)

    // ===== 4. 古籍支持/反对计数 =====
    const { classicSupportCount, classicOpposeCount } = this._countClassicCitations(citations)

    // ===== 5. 流派信息 =====
    const supportingSchools = options?.supportingSchools ?? []
    const opposingSchools = options?.opposingSchools ?? []

    // ===== 6. 稳定性判定 =====
    const stability = this._determineStability(classicConformance, controversyLevel)

    // ===== 7. 建议 =====
    const recommendation = this._determineRecommendation(stability)

    // ===== 构建结果 =====
    const result: RuleKnowledgeBenchmark = {
      ruleId: rule.id,
      stability,
      classicConformance: round4(classicConformance),
      modernCaseConformance: round4(modernCaseConformance),
      controversyLevel: round4(controversyLevel),
      classicSupportCount,
      classicOpposeCount,
      supportingSchools,
      opposingSchools,
      controversyNote: options?.controversyNote,
      recommendation,
      lastAssessedAt: Date.now(),
    }

    // 记录历史 & 更新最新
    this._history.push(result)
    this._assessments.set(rule.id, result)

    return result
  }

  /**
   * 批量评估
   */
  batchAssess(rules: RuleDSLDefinition[], options?: BenchmarkOptions): RuleKnowledgeBenchmark[] {
    return rules.map(rule => this.assess(rule, options))
  }

  /**
   * 获取规则的稳定性等级
   */
  getStability(ruleId: string): KnowledgeStability | undefined {
    return this._assessments.get(ruleId)?.stability
  }

  /**
   * 获取争议规则（controversyLevel >= 0.5）
   */
  getControversialRules(): RuleKnowledgeBenchmark[] {
    return [...this._assessments.values()].filter(a => a.controversyLevel >= 0.5)
  }

  /**
   * 获取稳定规则（stability = 'stable'）
   */
  getStableRules(): RuleKnowledgeBenchmark[] {
    return [...this._assessments.values()].filter(a => a.stability === 'stable')
  }

  /**
   * 获取实验性规则（stability = 'experimental'）
   */
  getExperimentalRules(): RuleKnowledgeBenchmark[] {
    return [...this._assessments.values()].filter(a => a.stability === 'experimental')
  }

  /**
   * 获取已弃用规则（stability = 'deprecated'）
   */
  getDeprecatedRules(): RuleKnowledgeBenchmark[] {
    return [...this._assessments.values()].filter(a => a.stability === 'deprecated')
  }

  /**
   * 获取排名（按综合质量分降序）
   *
   * 综合分 = classicConformance × 0.4 + modernCaseConformance × 0.4 − controversyLevel × 0.2
   */
  getRanking(): RuleKnowledgeBenchmark[] {
    return [...this._assessments.values()].sort((a, b) => {
      const scoreA = a.classicConformance * 0.4 + a.modernCaseConformance * 0.4 - a.controversyLevel * 0.2
      const scoreB = b.classicConformance * 0.4 + b.modernCaseConformance * 0.4 - b.controversyLevel * 0.2
      return scoreB - scoreA
    })
  }

  // ============================================================
  // 内部计算方法
  // ============================================================

  /**
   * 计算古籍符合度
   *
   * 基于有效引用数量和已知古籍来源
   */
  private _calcClassicConformance(
    citations: NonNullable<RuleDSLDefinition['classicEvidence']>,
    sources: string[],
  ): number {
    // 统计有效引用
    let validCount = 0
    for (const cite of citations) {
      if (cite.classicName && cite.quotedText && cite.supports) {
        validCount++
      }
    }

    // 基础分（按有效引用数）
    let conformance: number
    if (validCount === 0) {
      conformance = 0.15
    } else if (validCount === 1) {
      conformance = 0.45
    } else if (validCount === 2) {
      conformance = 0.7
    } else if (validCount === 3) {
      conformance = 0.82
    } else {
      conformance = 0.9
    }

    // 已知古籍来源加成
    const knownSourceCount = sources.filter(s => KNOWN_CLASSICS.has(s)).length
    conformance += knownSourceCount * 0.03

    // 来源数多但引用少 = 可能拼凑，略降
    if (sources.length >= 3 && validCount <= 1) {
      conformance -= 0.05
    }

    return this._clamp(conformance, 0, 1)
  }

  /**
   * 计算争议度
   *
   * 基于：
   *   - 引用 supports 字段的分歧程度
   *   - 来源数量（多来源可能多分歧）
   *   - 反对流派数
   *   - 可由 options.controversyLevel 直接覆盖
   */
  private _calcControversyLevel(
    citations: NonNullable<RuleDSLDefinition['classicEvidence']>,
    sources: string[],
    options?: BenchmarkOptions,
  ): number {
    // 允许直接覆盖
    if (options?.controversyLevel !== undefined) {
      return this._clamp(options.controversyLevel, 0, 1)
    }

    let level = 0

    // 1. 引用 supports 分歧度
    // 不同引用支持不同结论 → 争议度高
    const supportsSet = new Set(citations.map(c => c.supports))
    const uniqueSupports = supportsSet.size
    if (citations.length > 1) {
      // 多引用但结论分歧大
      const divergence = (uniqueSupports - 1) / Math.max(1, citations.length)
      level += divergence * 0.3
    }

    // 2. 来源数量影响
    // 来源越多，涉及流派越多，潜在争议越大
    if (sources.length >= 4) {
      level += 0.15
    } else if (sources.length >= 2) {
      level += 0.05
    }

    // 3. 反对流派
    if (options?.opposingSchools && options.opposingSchools.length > 0) {
      level += Math.min(0.3, options.opposingSchools.length * 0.1)
    }

    // 4. 支持流派与反对流派比例
    const supCount = options?.supportingSchools?.length ?? 0
    const oppCount = options?.opposingSchools?.length ?? 0
    const totalSchools = supCount + oppCount
    if (totalSchools > 0) {
      // 流派对半分时争议最大
      const balance = Math.abs(supCount - oppCount) / totalSchools
      level += (1 - balance) * 0.2
    }

    // 5. 无引用时基础争议度
    if (citations.length === 0) {
      level += 0.1
    }

    return this._clamp(level, 0, 1)
  }

  /**
   * 统计古籍支持/反对引用数
   *
   * supports 字段包含"忌"/"反对"/"不宜"等关键词 → 反对引用
   */
  private _countClassicCitations(
    citations: NonNullable<RuleDSLDefinition['classicEvidence']>,
  ): { classicSupportCount: number; classicOpposeCount: number } {
    let classicSupportCount = 0
    let classicOpposeCount = 0

    const opposeKeywords = ['忌', '反对', '不宜', '不可', '勿用']

    for (const cite of citations) {
      if (!cite.classicName || !cite.quotedText || !cite.supports) continue
      const isOppose = opposeKeywords.some(kw => cite.supports.includes(kw))
      if (isOppose) {
        classicOpposeCount++
      } else {
        classicSupportCount++
      }
    }

    return { classicSupportCount, classicOpposeCount }
  }

  /**
   * 稳定性判定
   *
   * - deprecated : classicConformance < 0.3 OR controversyLevel > 0.7
   * - stable     : classicConformance > 0.7 AND controversyLevel < 0.3
   * - experimental : 介于两者之间
   */
  private _determineStability(
    classicConformance: number,
    controversyLevel: number,
  ): KnowledgeStability {
    if (classicConformance < 0.3 || controversyLevel > 0.7) {
      return 'deprecated'
    }
    if (classicConformance > 0.7 && controversyLevel < 0.3) {
      return 'stable'
    }
    return 'experimental'
  }

  /**
   * 建议操作
   *
   * - stable → keep
   * - experimental → review
   * - deprecated → deprecate
   */
  private _determineRecommendation(
    stability: KnowledgeStability,
  ): RuleKnowledgeBenchmark['recommendation'] {
    switch (stability) {
      case 'stable': return 'keep'
      case 'experimental': return 'review'
      case 'deprecated': return 'deprecate'
    }
  }

  /** 数值钳制 */
  private _clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }
}

// ============================================================
// 辅助函数
// ============================================================

/** 保留 4 位小数 */
function round4(n: number): number {
  return Number(n.toFixed(4))
}

// ============================================================
// 全局单例
// ============================================================

/** 全局 KnowledgeBenchmark 单例（全项目共享评估状态） */
export const globalKnowledgeBenchmark = new KnowledgeBenchmark()
