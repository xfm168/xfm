/**
 * P4.8 ConfidenceEngine — 可信度引擎
 *
 * 古籍依据：
 *   《易经》："吉凶悔吝者，生乎动者也。" — 吉凶有程度，非绝对定论
 *   《道德经》："多言数穷，不如守中。" — 避免绝对化，持中道
 *   《滴天髓》："何知其人富，财气通门户。" — 有条件才能下断语
 *   《子平真诠》："命之好坏，全在格局纯杂。" — 依据充分才可评判
 *
 * 设计原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - 每一个结论必须输出可信度，避免绝对化表达
 *   - 八大人生维度独立评估
 *   - 所有可信度表述使用限定性语言
 *   - 古籍引用贯穿始终
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 随机选取数组中一个元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 随机选取数组中 N 个不重复元素 */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

/** 安全获取 chartData 中的字符串字段 */
function getStr(data: Record<string, unknown>, key: string): string {
  return (data[key] as string) ?? ''
}

/** 安全获取 chartData 中的数字字段 */
function getNum(data: Record<string, unknown>, key: string): number {
  return (data[key] as number) ?? 0
}

/** 安全获取 chartData 中的数组字段 */
function getArr(data: Record<string, unknown>, key: string): unknown[] {
  const val = data[key]
  if (Array.isArray(val)) return val
  return []
}

/** 安全获取 chartData 中的布尔字段 */
function getBool(data: Record<string, unknown>, key: string): boolean {
  return (data[key] as boolean) ?? false
}

/** 将数值限制在 0-100 范围内 */
function clampScore(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)))
}

/** 计算数组的平均值 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0
  return Math.round(arr.reduce(function (s, v) { return s + v }, 0) / arr.length)
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 可信度等级 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

/** 单个维度的可信度评估结果 */
export interface ConfidenceDimension {
  /** 维度名称：事业/婚姻/财富/健康/学业/人际/运势/性格 */
  dimension: string
  /** 可信度分数 0-100 */
  score: number
  /** 可信度等级 */
  level: ConfidenceLevel
  /** 适合的表述方式 */
  expression: string
  /** 附加说明/限定条件 */
  caveats: string[]
  /** 依据来源 */
  evidence: string[]
}

/** 整体可信度评估结果 */
export interface ConfidenceResult {
  /** 生成时间 */
  generatedAt: string
  /** 各维度可信度 */
  dimensions: ConfidenceDimension[]
  /** 平均可信度 */
  overallConfidence: number
  /** 免责声明 */
  disclaimer: string
  /** 古典引用 */
  classicalRef: string
}

/** 维度定义 */
export interface DimensionDefinition {
  /** 维度标识 */
  dimension: string
  /** 维度中文名 */
  description: string
  /** 该维度的主要判断依据字段 */
  keyFields: string[]
  /** 基础可信度（无数据时的默认值） */
  baseConfidence: number
  /** 维度说明 */
  notes: string
}

// ═══════════════════════════════════════════════════════════
// 常量定义
// ═══════════════════════════════════════════════════════════

/** 八大维度标识 */
export const DIMENSIONS = [
  'career', 'marriage', 'wealth', 'health',
  'study', 'relationship', 'fortune', 'personality',
] as const

/** 八大维度中文名映射 */
const DIM_NAMES: Record<string, string> = {
  career: '事业',
  marriage: '婚姻',
  wealth: '财富',
  health: '健康',
  study: '学业',
  relationship: '人际',
  fortune: '运势',
  personality: '性格',
}

/** 可信度等级对应表述 */
const LEVEL_EXPRESSIONS: Record<string, string[]> = {
  high: [
    '高度确定，多个流派一致支持此结论',
    '基于充分命理依据，可信度较高',
    '多方验证后形成的高度一致性判断',
  ],
  medium: [
    '较为确定，但存在一定变数',
    '部分依据支持此结论，需综合考虑',
    '有一定命理基础，但应关注可能的变化因素',
  ],
  low: [
    '此维度依据不足，宜审慎论断',
    '依据尚欠充实，宜多方参证',
    '该维度信息有限，结论需谨慎对待',
  ],
}

/** 可信度分值区间对应的等级 */
function scoreToLevel(score: number): ConfidenceLevel {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

/** 可信度分值区间对应的面向用户表述 */
function scoreToExpression(score: number): string {
  if (score >= 90) return '高度确定'
  if (score >= 70) return '较为确定'
  if (score >= 50) return '宜参酌参考'
  if (score >= 30) return '存在不确定性'
  return '信息不足，难以判断'
}

/** 各维度的限定条件模板 */
const CAVEAT_TEMPLATES: Record<string, string[]> = {
  career: [
    '事业运受大运流年影响较大，需结合当前运势周期综合判断',
    '职业选择与个人努力密切相关，命理仅为参考因素之一',
    '不同行业对八字的要求不同，需结合具体行业分析',
    '时代环境变化可能对事业格局产生影响',
  ],
  marriage: [
    '婚姻美满需双方共同努力，命理仅反映潜在趋势',
    '现代社会婚姻观念多元，不可简单以古法断言',
    '婚配需结合双方八字合婚综合分析',
    '感情运受个人选择和际遇影响，并非完全注定',
  ],
  wealth: [
    '财富积累受多种因素影响，命理仅为其中一个维度',
    '理财能力和机遇把握同样重要',
    '正财偏财的格局需结合大运流年具体分析',
    '经济环境变化对财运有显著影响',
  ],
  health: [
    '健康预测不可替代专业医学诊断',
    '命理健康分析主要反映先天体质倾向',
    '后天的养生习惯对健康有重大影响',
    '定期体检和科学健康管理最为重要',
  ],
  study: [
    '学业成就受个人努力和教育资源影响极大',
    '命理反映的是学习倾向和潜力，非绝对结果',
    '不同学科领域可能呈现不同的命理特征',
    '现代社会教育体系与古代科考差异较大',
  ],
  relationship: [
    '人际关系复杂多变，命理分析仅为趋势参考',
    '个人修养和社交技巧对人际运影响显著',
    '贵人运需结合具体大运流年判断',
    '人际关系的改善可以通过后天努力实现',
  ],
  fortune: [
    '整体运势呈周期性变化，当前阶段并非永久定论',
    '运势分析应结合大运流年动态观察',
    '个人抉择对运势走向有重要影响',
    '风水环境等因素也会对运势产生作用',
  ],
  personality: [
    '性格分析反映先天倾向，后天环境同样塑造性格',
    '性格无绝对好坏，各有所长亦各有所短',
    '自我认知和反省是性格完善的重要途径',
    '不同生活阶段性格特征可能有所变化',
  ],
}

/** 各维度的古籍依据 */
const DIM_EVIDENCE: Record<string, string[]> = {
  career: [
    '《滴天髓》："何知其人贵，官星有理会。" — 官星为事业之要',
    '《子平真诠》："财官印食，为四大用神。" — 用神有力则事业顺遂',
    '《三命通会》："命带天乙贵人，多主仕途顺达。"',
    '《穷通宝鉴》："调候得宜，事业自然亨通。"',
  ],
  marriage: [
    '《滴天髓》："何知其人富，财气通门户。" — 男命以财为妻',
    '《子平真诠》："男以财为妻，女以官为夫。"',
    '《三命通会》："咸池桃花论婚姻，不可一概而论。"',
    '《渊海子平》："日支为配偶宫，宜生扶不宜冲克。"',
  ],
  wealth: [
    '《滴天髓》："何知其人富，财气通门户。" — 财星通根为富贵之基',
    '《穷通宝鉴》："身旺财旺，天下富翁。"',
    '《三命通会》："财为养命之源，不可无也。"',
    '《渊海子平》："身弱财多反为累，身旺财多真富贵。"',
  ],
  health: [
    '《滴天髓》："五行和者，身体健康。" — 五行平衡为健康之本',
    '《穷通宝鉴》："过于旺者病，过于衰者亦病。"',
    '《三命通会》："水火不调主心病，金木相战主筋骨。"',
    '《黄帝内经》："阴阳平秘，精神乃治。"',
  ],
  study: [
    '《滴天髓》："印绶为学问之源。" — 印星主学业',
    '《子平真诠》："印绶相生，聪明秀发。"',
    '《三命通会》："文昌学堂主文运。"',
    '《渊海子平》："官印相生，多为读书人。"',
  ],
  relationship: [
    '《滴天髓》："何知其人吉，顺逆之机也。" — 人际顺畅源于五行调和',
    '《三命通会》："天乙贵人与天德月德，皆主贵人运。"',
    '《渊海子平》："食神为人缘之星，主和气。"',
    '《穷通宝鉴》："通关有力，人际自然通达。"',
  ],
  fortune: [
    '《滴天髓》："命中用神，运岁助之则吉。" — 运势随大运流年变化',
    '《子平真诠》："命好不如运好，运好不如流年好。"',
    '《三命通会》："大运十年一变，流年逐年不同。"',
    '《穷通宝鉴》："行运与命局相辅相成方为上运。"',
  ],
  personality: [
    '《滴天髓》："五阳皆阳丙为最，五阴皆阴癸为至。" — 日主决定性格基调',
    '《子平真诠》："十干各有性情，不可不察。"',
    '《三命通会》："甲木性直，乙木性柔，丙火性烈，丁火性温。"',
    '《渊海子平》："日干为本命之主，其性自禀。"',
  ],
}

/** 免责声明候选（随机选取避免重复） */
const DISCLAIMER_OPTIONS: string[] = [
  '本推演依古法而论，以传统命理理论为根基。知命而不认命，修德以补命运之不足。',
  '命理分析自古讲究"信则有，不信则无"，本结果旨在提供传统文化视角的参考，不替代专业咨询。',
  '《荀子》曰："天行有常，不为尧存，不为桀亡。" 命理为参考之一，个人修为与抉择更为重要。',
  '古人云："一命二运三风水，四积阴德五读书。" 命仅为诸多因素之一，后天努力不可忽视。',
  '本分析仅供传统文化爱好者参考，具体人生决策请结合实际情况和专业建议综合考量。',
]

/** 古籍引用候选 */
const CLASSICAL_REF_OPTIONS: string[] = [
  '《易经》："吉凶悔吝者，生乎动者也。" — 一切判断皆有其条件和限度',
  '《道德经》："多言数穷，不如守中。" — 持中道，避免绝对化论断',
  '《滴天髓》："三才既定，吉凶可知。" — 知命而不宿命，方为正道',
  '《子平真诠》："命理之学，贵在变通。" — 不可执一而论',
  '《三命通会》："命不可不信，亦不可全信。" — 取其精华，去其迷信',
]

// ═══════════════════════════════════════════════════════════
// ConfidenceEngine 主类
// ═══════════════════════════════════════════════════════════

/**
 * 可信度引擎
 *
 * 对八字命理分析结果进行可信度评估，确保每个结论
 * 都带有适当的限定条件和置信度标记，避免绝对化表达。
 */
export class ConfidenceEngine {
  /** 内部维度可信度缓存 */
  private dimensionScores: Map<string, number> = new Map()

  /** 维度定义表 */
  private static readonly DIM_DEFINITIONS: DimensionDefinition[] = [
    {
      dimension: 'career',
      description: '事业运',
      keyFields: ['careerScore', 'careerProbability', 'careerFactors', 'officialStar', 'powerStar'],
      baseConfidence: 45,
      notes: '事业维度的可信度受官星、印星及格局纯杂影响',
    },
    {
      dimension: 'marriage',
      description: '婚姻运',
      keyFields: ['marriageScore', 'marriageProbability', 'marriageFactors', 'spousePalace', 'peachBlossom'],
      baseConfidence: 40,
      notes: '婚姻维度的可信度受日支、财官星及大运影响较大',
    },
    {
      dimension: 'wealth',
      description: '财富运',
      keyFields: ['wealthScore', 'wealthProbability', 'wealthFactors', 'wealthStar', 'incomeStar'],
      baseConfidence: 45,
      notes: '财富维度的可信度受财星、食伤及身旺衰综合影响',
    },
    {
      dimension: 'health',
      description: '健康运',
      keyFields: ['healthScore', 'healthProbability', 'healthFactors', 'elementBalance', 'diseaseStar'],
      baseConfidence: 50,
      notes: '健康维度的可信度受五行平衡、调候及病药关系影响',
    },
    {
      dimension: 'study',
      description: '学业运',
      keyFields: ['studyScore', 'studyProbability', 'studyFactors', 'sealStar', 'wenChang'],
      baseConfidence: 45,
      notes: '学业维度的可信度受印星、文昌及官印相生格局影响',
    },
    {
      dimension: 'relationship',
      description: '人际关系',
      keyFields: ['relationshipScore', 'relationshipFactors', 'nobleStar', 'foodGod'],
      baseConfidence: 35,
      notes: '人际维度的可信度受贵人星、食神及五行通关情况影响',
    },
    {
      dimension: 'fortune',
      description: '整体运势',
      keyFields: ['fortuneScore', 'luckCycle', 'majorLuck', 'yearLuck', 'overallScore'],
      baseConfidence: 40,
      notes: '运势维度的可信度受大运流年与命局的配合关系影响',
    },
    {
      dimension: 'personality',
      description: '性格特征',
      keyFields: ['personalityTraits', 'dayMasterElement', 'dayMasterStrength', 'tenGodProfile'],
      baseConfidence: 55,
      notes: '性格维度的可信度相对较高，因日主特征较为稳定',
    },
  ]

  /**
   * 评估所有维度的可信度，生成完整报告
   * @param chartData 八字分析数据（包含各引擎的输出结果）
   * @returns 完整的可信度评估结果
   */
  assess(chartData: Record<string, unknown>): ConfidenceResult {
    var dimensions: ConfidenceDimension[] = []
    var totalScore = 0

    // 遍历八大维度逐一评估
    for (var i = 0; i < DIMENSIONS.length; i++) {
      var dim = DIMENSIONS[i]
      var result = this.assessDimension(dim, chartData)
      dimensions.push(result)
      totalScore += result.score
    }

    // 计算平均可信度
    var overallConfidence = dimensions.length > 0
      ? Math.round(totalScore / dimensions.length)
      : 0

    return {
      generatedAt: new Date().toISOString(),
      dimensions: dimensions,
      overallConfidence: overallConfidence,
      disclaimer: pick(DISCLAIMER_OPTIONS),
      classicalRef: pick(CLASSICAL_REF_OPTIONS),
    }
  }

  /**
   * 评估单个维度的可信度
   * @param dimension 维度标识
   * @param chartData 八字分析数据
   * @returns 该维度的可信度评估结果
   */
  assessDimension(dimension: string, chartData: Record<string, unknown>): ConfidenceDimension {
    // 查找维度定义
    var dimDef = ConfidenceEngine.DIM_DEFINITIONS.find(function (d) {
      return d.dimension === dimension
    })

    // 若维度不存在，返回最低可信度
    if (!dimDef) {
      return {
        dimension: dimension,
        score: 10,
        level: 'low',
        expression: '未知维度，无法评估',
        caveats: ['该维度不在已定义的八个分析维度之内'],
        evidence: [],
      }
    }

    // 检查是否有缓存的更新分数
    var cachedScore = this.dimensionScores.get(dimension)
    if (cachedScore !== undefined) {
      var cachedLevel = scoreToLevel(cachedScore)
      return this.buildDimensionResult(
        dimension, cachedScore, cachedLevel, chartData, dimDef
      )
    }

    // 基于数据完整性和一致性计算原始可信度
    var rawScore = this.calculateRawScore(dimension, chartData, dimDef)

    // 应用调节因子
    var adjustedScore = this.applyAdjustments(rawScore, dimension, chartData)

    var level = scoreToLevel(adjustedScore)

    return this.buildDimensionResult(
      dimension, adjustedScore, level, chartData, dimDef
    )
  }

  /**
   * 构建维度的可信度评估结果
   */
  private buildDimensionResult(
    dimension: string,
    score: number,
    level: ConfidenceLevel,
    chartData: Record<string, unknown>,
    dimDef: DimensionDefinition
  ): ConfidenceDimension {
    var expression = this.getExpression(score, level)
    var caveats = this.getCaveats(dimension, score, chartData)
    var evidence = this.getEvidence(dimension, chartData, dimDef)

    return {
      dimension: dimension,
      score: score,
      level: level,
      expression: expression,
      caveats: caveats,
      evidence: evidence,
    }
  }

  /**
   * 计算原始可信度分数
   *
   * 从三个层面评估：
   *   1. 数据完整性 — 关键字段是否存在
   *   2. 数据一致性 — 各引擎给出的结论是否一致
   *   3. 依据充分性 — 支持该结论的命理依据数量
   */
  private calculateRawScore(
    dimension: string,
    chartData: Record<string, unknown>,
    dimDef: DimensionDefinition
  ): number {
    var completenessScore = this.assessCompleteness(chartData, dimDef)
    var consistencyScore = this.assessConsistency(dimension, chartData)
    var sufficiencyScore = this.assessSufficiency(dimension, chartData)

    // 三个权重：完整性 30%，一致性 40%，充分性 30%
    var rawScore = Math.round(
      completenessScore * 0.3 +
      consistencyScore * 0.4 +
      sufficiencyScore * 0.3
    )

    // 若命局基础数据都不存在，大幅降低可信度
    var hasBasicChart = getStr(chartData, 'yearPillar') !== '' ||
      getStr(chartData, 'fourPillars') !== '' ||
      getStr(chartData, 'dayMaster') !== ''

    if (!hasBasicChart) {
      rawScore = Math.min(rawScore, 15)
    }

    return clampScore(rawScore)
  }

  /**
   * 评估数据完整性
   *
   * 检查该维度所需的关键字段在 chartData 中是否存在且非空
   */
  private assessCompleteness(
    chartData: Record<string, unknown>,
    dimDef: DimensionDefinition
  ): number {
    var keyFields = dimDef.keyFields
    var filledCount = 0

    for (var i = 0; i < keyFields.length; i++) {
      var field = keyFields[i]
      var val = chartData[field]

      if (val !== undefined && val !== null && val !== '') {
        // 如果是数字且非零，视为有数据
        if (typeof val === 'number' && val !== 0) {
          filledCount++
        } else if (typeof val === 'string' && val.length > 0) {
          filledCount++
        } else if (Array.isArray(val) && val.length > 0) {
          filledCount++
        } else if (typeof val === 'boolean') {
          filledCount++
        } else if (typeof val === 'number' && val === 0) {
          // 零值可能是有意义的（如概率为0），也计入
          filledCount++
        }
      }
    }

    // 完整度 = 已填字段数 / 总字段数 * 100
    var ratio = keyFields.length > 0 ? filledCount / keyFields.length : 0
    return Math.round(ratio * 100)
  }

  /**
   * 评估数据一致性
   *
   * 若 chartData 中包含多个引擎对同一维度的评分，检查它们的一致性。
   * 一致性越高，可信度越高；分歧越大，可信度越低。
   */
  private assessConsistency(
    dimension: string,
    chartData: Record<string, unknown>
  ): number {
    // 收集该维度所有相关分数字段
    var scoreFields = this.findScoreFields(dimension, chartData)
    var scores: number[] = []

    for (var i = 0; i < scoreFields.length; i++) {
      var field = scoreFields[i]
      var numVal = getNum(chartData, field)
      if (numVal > 0) {
        scores.push(numVal)
      }
    }

    // 只有一个分数来源，一致性为中等
    if (scores.length <= 1) return 55

    // 多个分数来源，计算标准差来衡量一致性
    var avg = average(scores)
    var variance = 0
    for (var j = 0; j < scores.length; j++) {
      var diff = scores[j] - avg
      variance += diff * diff
    }
    variance = variance / scores.length
    var stdDev = Math.sqrt(variance)

    // 标准差越小，一致性越高
    // 标准差 < 10 → 高一致性 (90)
    // 标准差 < 20 → 中等一致性 (65)
    // 标准差 < 35 → 低一致性 (40)
    // 标准差 >= 35 → 很低一致性 (20)
    if (stdDev < 10) return 90
    if (stdDev < 20) return 65
    if (stdDev < 35) return 40
    return 20
  }

  /**
   * 查找与指定维度相关的分数字段
   */
  private findScoreFields(
    dimension: string,
    chartData: Record<string, unknown>
  ): string[] {
    var fields: string[] = []
    var suffixes = ['Score', 'Probability', 'Confidence', 'Level', 'Rating']
    var keys = Object.keys(chartData)

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      // 检查是否为该维度的分数字段
      for (var j = 0; j < suffixes.length; j++) {
        if (key.indexOf(dimension) !== -1 && key.indexOf(suffixes[j]) !== -1) {
          fields.push(key)
          break
        }
      }
    }

    // 也检查维度中文名相关的字段
    var dimName = DIM_NAMES[dimension] ?? ''
    if (dimName) {
      for (var k = 0; k < keys.length; k++) {
        var key2 = keys[k]
        if (key2.indexOf(dimName) !== -1 && fields.indexOf(key2) === -1) {
          var val = chartData[key2]
          if (typeof val === 'number') {
            fields.push(key2)
          }
        }
      }
    }

    return fields
  }

  /**
   * 评估依据充分性
   *
   * 检查支持该维度结论的命理依据数量和深度。
   * 依据越多、来源越权威，充分性越高。
   */
  private assessSufficiency(
    dimension: string,
    chartData: Record<string, unknown>
  ): number {
    var factors = 0

    // 检查是否有 Factors 类型的字段（利好/风险因素）
    var factorField = dimension + 'Factors'
    var factorArr = getArr(chartData, factorField)
    factors += Math.min(factorArr.length, 5)

    // 检查是否有 positiveFactors / negativeFactors
    var posArr = getArr(chartData, 'positiveFactors')
    var negArr = getArr(chartData, 'negativeFactors')
    factors += Math.min(posArr.length, 3)
    factors += Math.min(negArr.length, 3)

    // 检查是否有古典引用
    var refs = getArr(chartData, 'classicalRefs')
    factors += Math.min(refs.length, 3)

    // 检查是否有 advice 字段
    var advice = getStr(chartData, 'advice')
    if (advice.length > 10) factors += 2

    // 检查是否有 summary 字段
    var summary = getStr(chartData, 'summary')
    if (summary.length > 10) factors += 1

    // 检查该维度的古籍依据数量
    var dimEvidence = DIM_EVIDENCE[dimension]
    if (dimEvidence) {
      factors += Math.min(dimEvidence.length, 4)
    }

    // 将因素数量映射到 0-100 分
    // 0个因素 → 10分，15个以上因素 → 95分
    if (factors <= 0) return 10
    if (factors >= 15) return 95
    return Math.round(10 + (factors / 15) * 85)
  }

  /**
   * 应用调节因子
   *
   * 对原始可信度进行一些上下文相关的调节
   */
  private applyAdjustments(
    rawScore: number,
    dimension: string,
    chartData: Record<string, unknown>
  ): number {
    var adjusted = rawScore

    // 如果有共识引擎的输出，参考共识度
    var consensusScore = getNum(chartData, 'consensusScore')
    if (consensusScore > 0) {
      // 共识度高则提升可信度
      var consensusBonus = Math.round((consensusScore - 50) * 0.2)
      adjusted = adjusted + consensusBonus
    }

    // 如果有概率引擎的输出，参考其置信度
    var probConfidence = getNum(chartData, 'overallConfidence')
    if (probConfidence > 0) {
      var probBonus = Math.round((probConfidence - 50) * 0.15)
      adjusted = adjusted + probBonus
    }

    // 性格维度的可信度通常高于其他维度（日主特征较为稳定）
    if (dimension === 'personality') {
      adjusted = adjusted + 5
    }

    // 运势维度的可信度通常较低（受时间因素影响大）
    if (dimension === 'fortune') {
      adjusted = adjusted - 5
    }

    // 如果数据中有明确的 strengthResult（日主旺衰），所有维度小幅加分
    if (getStr(chartData, 'strengthResult') !== '') {
      adjusted = adjusted + 3
    }

    // 如果有 useGodResult（用神分析），所有维度小幅加分
    if (getStr(chartData, 'useGod') !== '') {
      adjusted = adjusted + 3
    }

    return clampScore(adjusted)
  }

  /**
   * 获取可信度表述
   *
   * 结合分值和等级，生成适当的表述
   */
  private getExpression(score: number, level: ConfidenceLevel): string {
    var baseExpr = scoreToExpression(score)

    // 从对应等级的表述池中选取一个详细表述
    var detailedExpr = pick(LEVEL_EXPRESSIONS[level])

    // 组合为完整表述
    return baseExpr + '。' + detailedExpr
  }

  /**
   * 获取限定条件和附加说明
   *
   * 根据维度和可信度高低，生成相应的限定条件。
   * 可信度越低，限定条件越多。
   */
  private getCaveats(
    dimension: string,
    score: number,
    chartData: Record<string, unknown>
  ): string[] {
    var caveats: string[] = []
    var templates = CAVEAT_TEMPLATES[dimension]

    if (!templates || templates.length === 0) return caveats

    // 根据可信度决定限定条件数量
    // 低可信度：3条限定条件
    // 中可信度：2条限定条件
    // 高可信度：1条限定条件
    var count: number
    if (score < 40) {
      count = 3
    } else if (score < 70) {
      count = 2
    } else {
      count = 1
    }

    var selected = pickN(templates, count)
    for (var i = 0; i < selected.length; i++) {
      caveats.push(selected[i])
    }

    // 如果有特殊注意事项，追加
    var specialNote = getStr(chartData, 'specialNote')
    if (specialNote.length > 0) {
      caveats.push('特别说明：' + specialNote)
    }

    return caveats
  }

  /**
   * 获取命理依据
   *
   * 根据维度返回相关的古籍依据和命理推理过程
   */
  private getEvidence(
    dimension: string,
    chartData: Record<string, unknown>,
    dimDef: DimensionDefinition
  ): string[] {
    var evidence: string[] = []
    var classicalSources = DIM_EVIDENCE[dimension]

    // 从古籍依据中选取 2 条
    if (classicalSources && classicalSources.length > 0) {
      var selectedRefs = pickN(classicalSources, 2)
      for (var i = 0; i < selectedRefs.length; i++) {
        evidence.push(selectedRefs[i])
      }
    }

    // 添加维度说明作为依据
    if (dimDef.notes) {
      evidence.push('分析原则：' + dimDef.notes)
    }

    // 如果数据中有推理过程，添加进来
    var reasoning = getArr(chartData, 'reasoningSteps')
    if (reasoning.length > 0) {
      var topReasoning = reasoning.slice(0, 2)
      for (var j = 0; j < topReasoning.length; j++) {
        var step = String(topReasoning[j])
        if (step.length > 0) {
          evidence.push('推理依据：' + step)
        }
      }
    }

    return evidence
  }

  /**
   * 手动更新某个维度的可信度分数
   *
   * 用于外部模块在获得新信息后，更新特定维度的可信度。
   * 更新后的分数将在下次 assess 时使用。
   *
   * @param dimension 维度标识
   * @param score 新的可信度分数（0-100）
   */
  updateConfidence(dimension: string, score: number): void {
    var clamped = clampScore(score)
    this.dimensionScores.set(dimension, clamped)
  }

  /**
   * 获取所有维度的定义信息
   *
   * @returns 维度定义数组，包含维度标识和描述
   */
  getDimensionDefinitions(): Array<{ dimension: string; description: string }> {
    var result: Array<{ dimension: string; description: string }> = []

    for (var i = 0; i < ConfidenceEngine.DIM_DEFINITIONS.length; i++) {
      var def = ConfidenceEngine.DIM_DEFINITIONS[i]
      result.push({
        dimension: def.dimension,
        description: def.description,
      })
    }

    return result
  }
}
