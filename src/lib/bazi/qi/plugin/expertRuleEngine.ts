/**
 * P3.12 ExpertRuleEngine — 专家规则引擎
 *
 * 古籍依据（源自《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《渊海子平》等）：
 *   《滴天髓》云："五阳皆阳丙为最，五阴皆阴癸为极。"
 *   《子平真诠》云："八字用神，专求月令，以月令地支藏干分清用神。"
 *   《穷通宝鉴》云："调候为急，寒暖燥湿，各有所宜。"
 *   《三命通会》云："凡看命，以日为主，取格局为用。"
 *   《渊海子平》云："伤官见官，为祸百端。"
 *
 * 核心设计理念：
 *   - 规则优先级体系：经典规则 > 组合规则 > 专家规则 > AI推理
 *   - AI推理不能覆盖经典规则（经典规则具有最高优先级和否决权）
 *   - 所有规则带古籍来源，可追溯
 *   - 规则之间可以有冲突，高优先级规则胜出
 *
 * 设计原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - import type 仅导入类型
 *   - 所有文本中文字符串
 *   - 用 pick() / pickN() 随机选择器避免模板化
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 随机选取数组中一个元素 */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 随机选取数组中 N 个不重复元素 */
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 规则优先级 */
export type RulePriority =
  | 'classic'     // 经典规则 — 最高优先级，古籍铁律，不可覆盖
  | 'combo'       // 组合规则 — 多条件组合判断，较高优先级
  | 'expert'      // 专家规则 — 命理名家经验总结
  | 'ai'          // AI推理 — 引擎计算结果，最低优先级

/** 规则来源 */
export type RuleSource =
  | '滴天髓' | '子平真诠' | '穷通宝鉴' | '三命通会' | '渊海子平'
  | '神峰通考' | '穷通秘诀' | '命理正宗' | '命理约言' | '穷通宝鉴摘要'
  | '张神峰' | '徐乐吾' | '韦千里' | '袁树珊'
  | 'engine_probability' | 'engine_timeline' | 'engine_decision'
  | 'engine_similarity' | 'engine_consistency' | 'engine_reasoning'

/** 规则状态 */
export type RuleStatus = 'active' | 'inactive' | 'overridden' | 'conflict'

/** 单条规则 */
export interface ExpertRule {
  /** 规则ID */
  id: string
  /** 规则名称 */
  name: string
  /** 优先级 */
  priority: RulePriority
  /** 来源 */
  source: RuleSource
  /** 来源具体章节/原文 */
  sourceDetail: string
  /** 规则描述 */
  description: string
  /** 适用条件（函数式判断） */
  condition: (input: RuleEngineInput) => boolean
  /** 规则结论 */
  conclusion: string
  /** 结论生成（可根据输入动态生成） */
  generateConclusion?: (input: RuleEngineInput) => string
  /** 影响维度 */
  dimensions: string[]
  /** 置信度 0-100 */
  confidence: number
  /** 可被什么优先级覆盖（classic不可被覆盖） */
  overridableBy?: RulePriority[]
  /** 当前状态 */
  status?: RuleStatus
  /** 标签 */
  tags: string[]
}

/** 规则引擎输入 */
export interface RuleEngineInput {
  dayGan: string
  dayElement?: string
  yearZhi?: string
  monthZhi?: string
  dayZhi?: string
  hourZhi?: string
  fourPillars?: string
  /** 性别（用于婚姻等规则） */
  gender?: 'male' | 'female'
  /** 五行计数 */
  elementCount?: Record<string, number>
  /** 旺衰评分 0-100 */
  strengthScore?: number
  /** 身强/身弱判定 */
  strengthType?: '身旺' | '身弱' | '中和'
  /** 用神方向 */
  useGodDirection?: string
  /** 用神五行 */
  useGodElement?: string
  /** 忌神五行 */
  jiShenElement?: string
  /** 格局结果 */
  patternResult?: any
  /** 调候结果 */
  climateResult?: any
  /** 病药结果 */
  diseaseResult?: any
  /** 通关结果 */
  tongGuanResult?: any
  /** 神煞结果 */
  shenShaResult?: any
  /** 十神信息 */
  shiShenInfo?: Record<string, string[]>
  /** 柱内冲合关系 */
  pillarClash?: string[]
  /** 冲的信息 */
  clashInfo?: string[]
  /** 合的信息 */
  combineInfo?: string[]
  /** 羊刃信息 */
  yangRenList?: string[]
  /** 有力十神列表 */
  strongShiShen?: string[]
  /** 有力五行 */
  strongElements?: string[]
  /** 弱势五行 */
  weakElements?: string[]
  /** 概率引擎结果 */
  probabilityResult?: any
  /** 事件预测结果 */
  eventResult?: any
  /** 决策引擎结果 */
  decisionResult?: any
  /** 一致性检查结果 */
  consistencyResult?: any
}

/** 规则执行结果 */
export interface RuleExecutionResult {
  /** 规则ID */
  ruleId: string
  /** 规则名称 */
  ruleName: string
  /** 优先级 */
  priority: RulePriority
  /** 是否匹配（条件满足） */
  matched: boolean
  /** 结论 */
  conclusion: string
  /** 置信度 */
  confidence: number
  /** 来源 */
  source: RuleSource
  /** 来源详情 */
  sourceDetail: string
  /** 状态（是否被高优先级覆盖） */
  status: RuleStatus
  /** 被谁覆盖 */
  overriddenBy?: string
  /** 覆盖原因 */
  overrideReason?: string
}

/** 规则引擎完整结果 */
export interface ExpertRuleEngineResult {
  /** 所有执行的规则结果（按优先级排序） */
  results: RuleExecutionResult[]
  /** 按优先级分组 */
  byPriority: {
    classic: RuleExecutionResult[]
    combo: RuleExecutionResult[]
    expert: RuleExecutionResult[]
    ai: RuleExecutionResult[]
  }
  /** 最终裁决（高优先级覆盖低优先级） */
  finalDecisions: FinalDecision[]
  /** 被覆盖的规则 */
  overriddenRules: RuleExecutionResult[]
  /** 冲突摘要 */
  conflictSummary: string
  /** 总评 */
  summary: string
  /** 古籍引用 */
  classicalRef: string
  /** 规则统计 */
  stats: {
    totalRules: number
    matchedRules: number
    overriddenRules: number
    conflicts: number
    byPriority: Record<RulePriority, number>
  }
}

/** 最终裁决 */
export interface FinalDecision {
  /** 裁决维度 */
  dimension: string
  /** 裁决结论 */
  conclusion: string
  /** 来源规则ID */
  ruleId: string
  /** 优先级 */
  priority: RulePriority
  /** 置信度 */
  confidence: number
  /** 裁决理由 */
  reason: string
}

// ═══════════════════════════════════════════════════════════
// 优先级映射
// ═══════════════════════════════════════════════════════════

/** 优先级数值映射（越小越高） */
const PRIORITY_ORDER: Record<RulePriority, number> = {
  classic: 0,  // 最高
  combo: 1,
  expert: 2,
  ai: 3,      // 最低
}

/** 优先级中文名映射 */
const PRIORITY_LABEL: Record<RulePriority, string> = {
  classic: '经典规则',
  combo: '组合规则',
  expert: '专家规则',
  ai: 'AI推理',
}

// ═══════════════════════════════════════════════════════════
// 辅助：从输入中提取信息
// ═══════════════════════════════════════════════════════════

/** 判断是否身旺 */
function isStrong(input: RuleEngineInput): boolean {
  return (input.strengthScore !== undefined && input.strengthScore > 55) ||
    input.strengthType === '身旺'
}

/** 判断是否身弱 */
function isWeak(input: RuleEngineInput): boolean {
  return (input.strengthScore !== undefined && input.strengthScore < 45) ||
    input.strengthType === '身弱'
}

/** 判断是否中和 */
function isBalanced(input: RuleEngineInput): boolean {
  return (input.strengthScore !== undefined && input.strengthScore >= 45 && input.strengthScore <= 55) ||
    input.strengthType === '中和'
}

/** 检查是否有某个十神 */
function hasShiShen(input: RuleEngineInput, name: string): boolean {
  if (!input.shiShenInfo) return false
  return (input.shiShenInfo[name] || []).length > 0
}

/** 检查是否有某个十神且有力 */
function hasStrongShiShen(input: RuleEngineInput, name: string): boolean {
  if (!input.strongShiShen) return false
  return input.strongShiShen.includes(name)
}

/** 检查是否有某个神煞 */
function hasShenSha(input: RuleEngineInput, name: string): boolean {
  if (!input.shenShaResult) return false
  const result = input.shenShaResult
  if (result.details) return result.details.some((d: any) => d.name === name)
  if (result.list) return result.list.includes(name)
  if (typeof result === 'object' && name in result) return true
  return false
}

/** 检查是否有某个神煞且数量达标 */
function shenShaCount(input: RuleEngineInput, name: string): number {
  if (!input.shenShaResult) return 0
  const result = input.shenShaResult
  if (result.details) return result.details.filter((d: any) => d.name === name).length
  if (result.counts && typeof result.counts[name] === 'number') return result.counts[name]
  return 0
}

/** 检查是否有羊刃 */
function hasYangRen(input: RuleEngineInput): boolean {
  if (input.yangRenList && input.yangRenList.length > 0) return true
  if (input.shenShaResult) return hasShenSha(input, '羊刃')
  return false
}

/** 检查是否有冲 */
function hasClash(input: RuleEngineInput): boolean {
  if (input.clashInfo && input.clashInfo.length > 0) return true
  if (input.pillarClash && input.pillarClash.length > 0) return true
  return false
}

/** 检查指定柱是否被冲 */
function isClashed(input: RuleEngineInput, pillar: string): boolean {
  if (!input.clashInfo) return false
  return input.clashInfo.some(c => c.includes(pillar))
}

/** 检查日支是否被冲 */
function isDayZhiClashed(input: RuleEngineInput): boolean {
  return isClashed(input, '日') || isClashed(input, '日支') ||
    !!(input.dayZhi !== undefined && input.clashInfo && input.clashInfo.some((c: string) => c.includes(input.dayZhi!)))
}

/** 检查五行偏枯 */
function isElementExtreme(input: RuleEngineInput): boolean {
  if (!input.elementCount) return false
  const counts = Object.values(input.elementCount)
  if (counts.length === 0) return false
  const max = Math.max(...counts)
  const min = Math.min(...counts)
  return max >= 5 && min <= 0
}

/** 检查某五行是否旺 */
function isElementStrong(input: RuleEngineInput, element: string): boolean {
  if (input.strongElements) return input.strongElements.includes(element)
  if (input.elementCount) return (input.elementCount[element] || 0) >= 3
  return false
}

/** 获取调候类型 */
function getClimateType(input: RuleEngineInput): string | undefined {
  if (!input.climateResult) return undefined
  if (input.climateResult.climateType) return input.climateResult.climateType
  if (input.climateResult.type) return input.climateResult.type
  return undefined
}

/** 获取概率引擎中某维度分数 */
function getProbabilityScore(input: RuleEngineInput, dimension: string): number | undefined {
  if (!input.probabilityResult) return undefined
  if (input.probabilityResult.dimensions) {
    const dim = input.probabilityResult.dimensions[dimension]
    if (dim !== undefined) return typeof dim === 'number' ? dim : dim.score
  }
  if (input.probabilityResult.scores) {
    return input.probabilityResult.scores[dimension]
  }
  return undefined
}

/** 检查事件预测中是否有高风险事件 */
function hasHighRiskEvent(input: RuleEngineInput, threshold: number = 60): boolean {
  if (!input.eventResult) return false
  if (input.eventResult.events) {
    return input.eventResult.events.some(
      (e: any) => (e.probability ?? e.score ?? 0) > threshold
    )
  }
  if (input.eventResult.highRisk) return true
  return false
}

/** 检查决策引擎中是否有高分决策 */
function hasHighScoreDecision(input: RuleEngineInput, threshold: number = 80): boolean {
  if (!input.decisionResult) return false
  if (Array.isArray(input.decisionResult)) {
    return input.decisionResult.some(
      (d: any) => (d.overallScore ?? d.score ?? 0) > threshold
    )
  }
  if (input.decisionResult.overallScore !== undefined) {
    return input.decisionResult.overallScore > threshold
  }
  return false
}

/** 检查一致性是否通过 */
function isConsistencyPassed(input: RuleEngineInput): boolean {
  if (!input.consistencyResult) return true
  if (typeof input.consistencyResult.passed === 'boolean') return input.consistencyResult.passed
  if (input.consistencyResult.status === 'passed') return true
  return true
}

// ═══════════════════════════════════════════════════════════
// 核心类：ExpertRuleEngine
// ═══════════════════════════════════════════════════════════

export class ExpertRuleEngine {
  private rules: Map<string, ExpertRule> = new Map()

  constructor() {
    this.initClassicRules()
    this.initComboRules()
    this.initExpertRules()
    this.initAIRules()
  }

  // ───────────────────────────────────────────────────────
  // 初始化经典规则（10条）
  // ───────────────────────────────────────────────────────

  private initClassicRules(): void {
    // C001: 身旺喜泄耗，身弱喜生扶
    this.rules.set('C001', {
      id: 'C001',
      name: '身旺喜泄耗，身弱喜生扶',
      priority: 'classic',
      source: '滴天髓',
      sourceDetail: '《滴天髓》云："旺极宜泄不宜克，弱极宜扶不宜泻。"',
      description: '身旺之人宜食伤泄秀或财星耗力，身弱之人宜印星生扶或比劫帮身。',
      condition: (input) => isStrong(input) || isWeak(input),
      conclusion: '',
      generateConclusion: (input) => {
        if (isStrong(input)) {
          const directions = [
            '身旺宜泄耗，用神取食伤泄秀为佳，以耗日主旺气',
            '日主身旺，宜取财星耗身或食伤泄秀为用神',
            '旺气过盛需疏导，以食伤泄秀或财星耗力为上策',
          ]
          return pick(directions)
        }
        const directions = [
          '身弱宜生扶，用神取印星生身或比劫帮身为佳',
          '日主身弱，宜取印星生扶或比劫助力为用神',
          '弱不胜财官，需印比生扶方可担财官之任',
        ]
        return pick(directions)
      },
      dimensions: ['用神', '旺衰'],
      confidence: 95,
      tags: ['用神', '身旺身弱', '滴天髓'],
    })

    // C002: 用神不可与忌神同论
    this.rules.set('C002', {
      id: 'C002',
      name: '用神不可与忌神同论',
      priority: 'classic',
      source: '子平真诠',
      sourceDetail: '《子平真诠》云："用神者，命局之枢纽也。用忌不可混同。"',
      description: '用神与忌神在命局中作用相反，不可混淆。用神扶抑太过或不及，忌神加重失衡。',
      condition: (input) => {
        return input.useGodElement !== undefined &&
          input.jiShenElement !== undefined &&
          input.useGodElement === input.jiShenElement
      },
      conclusion: '用神与忌神不可同属一五行，此为命理基本法则。若用忌同论，则命局取用有误，需重新审度格局旺衰。',
      dimensions: ['用神'],
      confidence: 100,
      tags: ['用神', '忌神', '子平真诠', '铁律'],
    })

    // C003: 月令取格，格局以月支藏干透干为定
    this.rules.set('C003', {
      id: 'C003',
      name: '月令取格',
      priority: 'classic',
      source: '子平真诠',
      sourceDetail: '《子平真诠》云："八字用神，专求月令，以月令地支藏干分清用神。"',
      description: '格局以月令地支藏干透出天干者取格。月令为命局之提纲，格局之根基。',
      condition: (input) => {
        return input.monthZhi !== undefined && input.patternResult !== undefined
      },
      conclusion: '',
      generateConclusion: (input) => {
        const patterns = [
          `月令${input.monthZhi || '未定'}为命局提纲，格局以此为准。月支藏干透干者定格，此为子平取格之大法。`,
          `《子平真诠》以月令取格为正途。月支${input.monthZhi || ''}之中，藏干透出天干者即为格局之所在。`,
          `格局之判定以月令为第一要义，月支${input.monthZhi || ''}决定了命局的基本结构。`,
        ]
        return pick(patterns)
      },
      dimensions: ['格局'],
      confidence: 95,
      tags: ['格局', '月令', '子平真诠'],
    })

    // C004: 调候有急缓，寒需暖、燥需润
    this.rules.set('C004', {
      id: 'C004',
      name: '调候有急缓，寒需暖、燥需润',
      priority: 'classic',
      source: '穷通宝鉴',
      sourceDetail: '《穷通宝鉴》云："调候为急，寒暖燥湿，各有所宜。冬生之人，非丙不暖；夏生之人，非壬不润。"',
      description: '冬季生人命局寒凝，急需火来调候；夏季生人命局燥热，需水来润泽。调候为命局基本需求。',
      condition: (input) => {
        const climateType = getClimateType(input)
        return climateType === '寒' || climateType === '燥' ||
          climateType === '寒湿' || climateType === '燥热'
      },
      conclusion: '',
      generateConclusion: (input) => {
        const climateType = getClimateType(input)
        if (climateType === '寒' || climateType === '寒湿') {
          const texts = [
            '命局寒凝，急需丙火调候暖身。《穷通宝鉴》云："冬生非丙不暖"，调候之火为第一要务。',
            '寒气过重需火来暖局，调候用神取火为上，此为《穷通宝鉴》调候之大法。',
            '命局偏寒，五行失和，以火调候为急务。寒需暖，此乃天地自然之理。',
          ]
          return pick(texts)
        }
        const texts = [
          '命局燥热，急需壬水调候润局。《穷通宝鉴》云："夏生非壬不润"，调候之水为第一要务。',
          '燥气过重需水来润局，调候用神取水为上，此为《穷通宝鉴》调候之大法。',
          '命局偏燥，五行失和，以水调候为急务。燥需润，此乃天地自然之理。',
        ]
        return pick(texts)
      },
      dimensions: ['调候', '用神'],
      confidence: 92,
      tags: ['调候', '穷通宝鉴', '寒暖燥湿'],
    })

    // C005: 五行偏枯为病，中和为药
    this.rules.set('C005', {
      id: 'C005',
      name: '五行偏枯为病，中和为药',
      priority: 'classic',
      source: '滴天髓',
      sourceDetail: '《滴天髓》云："五行和匀，富贵双全。偏枯之局，纵发不久。"',
      description: '五行分布均衡为上，偏枯则命局有病。某五行过多或缺失皆属偏枯之象。',
      condition: (input) => isElementExtreme(input),
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '五行偏枯为命局之大病。《滴天髓》云："五行和匀为贵"，今命局五行失衡严重，需以缺弱之五行为药方调之。',
          '命局五行分布不均，有偏枯之象。偏枯者纵有一时之发，终难持久，需补偏救弊方可言吉。',
          '五行中和为上，偏枯为下。命局中某五行过旺或缺失，需取所缺或最弱之五行为用神以调和之。',
        ]
        return pick(texts)
      },
      dimensions: ['旺衰', '病药'],
      confidence: 90,
      tags: ['五行', '中和', '偏枯', '滴天髓'],
    })

    // C006: 阳刃不喜逢冲
    this.rules.set('C006', {
      id: 'C006',
      name: '阳刃不喜逢冲',
      priority: 'classic',
      source: '三命通会',
      sourceDetail: '《三命通会》云："阳刃者，劫财之极也。刃逢冲，灾祸立至。"',
      description: '阳刃本为凶煞，若再逢冲则凶上加凶。阳刃逢冲主刑伤、破财、血光之灾。',
      condition: (input) => hasYangRen(input) && hasClash(input),
      conclusion: '',
      generateConclusion: (input) => {
        const bladePositions = input.yangRenList || ['命局']
        const texts = [
          `命局见阳刃（${pick(bladePositions)}），又逢冲克，凶上加凶。《三命通会》云："刃逢冲，灾祸立至"，需特别注意身体健康与破财之险。`,
          `阳刃逢冲，如刀出鞘、火上浇油。${pick(bladePositions)}之阳刃被冲动，主有刑伤灾厄之患，宜静不宜动。`,
          `阳刃本为劫财之极，今又逢冲，其势更猛。《三命通会》告诫"刃逢冲灾祸立至"，需谨慎行事，避免冒险。`,
        ]
        return pick(texts)
      },
      dimensions: ['神煞', '旺衰'],
      confidence: 90,
      tags: ['羊刃', '阳刃', '冲', '三命通会'],
    })

    // C007: 伤官见官为祸百端
    this.rules.set('C007', {
      id: 'C007',
      name: '伤官见官为祸百端',
      priority: 'classic',
      source: '渊海子平',
      sourceDetail: '《渊海子平》云："伤官见官，为祸百端。伤官者，克制官星之物也。"',
      description: '伤官克制正官，正官为贵星，被克则贵人受损。伤官见官主是非、官非、事业波折。',
      condition: (input) => hasShiShen(input, '伤官') && hasShiShen(input, '正官'),
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '命局伤官见正官，为祸百端。《渊海子平》以此为命理大忌，主事业多波折、易惹是非官非，需以印星制伤或财星通关解之。',
          '伤官克正官，官星受制则贵气受损。此格局需审慎看待事业运势，避免与官府体制冲突，宜以技术立身。',
          '伤官见官，古云"为祸百端"。命局中伤官与正官并见，需以印星化伤生官，或以财星泄伤通关，方可解此不利局面。',
        ]
        return pick(texts)
      },
      dimensions: ['格局', '事业'],
      confidence: 88,
      tags: ['伤官', '正官', '渊海子平'],
    })

    // C008: 日支为妻宫，不宜冲破
    this.rules.set('C008', {
      id: 'C008',
      name: '日支为妻宫，不宜冲破',
      priority: 'classic',
      source: '三命通会',
      sourceDetail: '《三命通会》云："日支为妻宫，最忌冲破。冲则婚姻不稳，夫妻不和。"',
      description: '日支为配偶宫，代表婚姻关系。若日支被冲，则婚姻宫不安，主婚姻波折。',
      condition: (input) => isDayZhiClashed(input),
      conclusion: '',
      generateConclusion: (input) => {
        const dayZhi = input.dayZhi || '日支'
        const texts = [
          `日支${dayZhi}为配偶宫，今见冲克，婚姻宫不安。《三命通会》云："日支最忌冲破"，主婚姻感情多波折，需用心经营。`,
          `配偶宫日支${dayZhi}被冲动，婚姻根基不稳。古诀云"日支逢冲，婚恋多艰"，需双方多沟通谅解，方可化解。`,
          `日支为婚姻之宫位，被冲则宫位动摇。${dayZhi}逢冲，预示感情之路多坎坷，但逢冲亦可逢动，关键在于化解之道。`,
        ]
        return pick(texts)
      },
      dimensions: ['婚姻'],
      confidence: 87,
      tags: ['婚姻', '日支', '妻宫', '冲', '三命通会'],
    })

    // C009: 身弱不担财官
    this.rules.set('C009', {
      id: 'C009',
      name: '身弱不担财官',
      priority: 'classic',
      source: '滴天髓',
      sourceDetail: '《滴天髓》云："身弱不胜财官，财官旺而身弱，反为祸害。"',
      description: '身弱之人命局若财官过旺，则无法承受，反而为害。财多身弱富屋贫人，官旺身弱有职无权。',
      condition: (input) => {
        return isWeak(input) && (
          hasStrongShiShen(input, '正财') || hasStrongShiShen(input, '偏财') ||
          hasStrongShiShen(input, '正官') || hasStrongShiShen(input, '七杀')
        )
      },
      conclusion: '',
      generateConclusion: (input) => {
        const strongNames: string[] = []
        if (hasStrongShiShen(input, '正财') || hasStrongShiShen(input, '偏财')) strongNames.push('财')
        if (hasStrongShiShen(input, '正官') || hasStrongShiShen(input, '七杀')) strongNames.push('官')
        const nameStr = strongNames.length > 0 ? strongNames.join('、') : '财官'
        const texts = [
          `身弱而${nameStr}旺，乃"富屋贫人"之象。《滴天髓》云："身弱不胜财官"，日主难以担起旺${nameStr}之重任，宜取印比生扶为用。`,
          `日主身弱，命局${nameStr}星过旺，反成累赘。《滴天髓》明示"财官旺而身弱，反为祸害"，需以印星化${nameStr}生身，方能转祸为福。`,
          `身弱不担旺${nameStr}，犹如力小而负重。《滴天髓》此条为千古不易之理，宜守不宜攻，待印比运到方可施展。`,
        ]
        return pick(texts)
      },
      dimensions: ['旺衰', '财富', '事业'],
      confidence: 93,
      tags: ['身弱', '财官', '滴天髓'],
    })

    // C010: 印为学业之根基，印旺利于科名
    this.rules.set('C010', {
      id: 'C010',
      name: '印为学业根基，印旺利科名',
      priority: 'classic',
      source: '渊海子平',
      sourceDetail: '《渊海子平》云："印绶者，生我之神也。印旺利于学业，利于科名。" 又云："印绶相生，文章华国。"',
      description: '印星代表学业、文凭、知识。印星有力且为用神，利于考试升学、学术研究。',
      condition: (input) => hasStrongShiShen(input, '正印') || hasStrongShiShen(input, '偏印'),
      conclusion: '',
      generateConclusion: (input) => {
        const hasZheng = hasStrongShiShen(input, '正印')
        const hasPian = hasStrongShiShen(input, '偏印')
        const texts = [
          '印星有力，学业根基深厚。《渊海子平》云"印绶相生，文章华国"，利于考试升学、学术发展，宜勤勉向学。',
          `${hasZheng && hasPian ? '正偏印皆有' : hasZheng ? '正印' : '偏印'}显耀于命局，主人聪慧好学。《渊海子平》以印绶为学业之根基，印旺则科名有望。`,
          `印星为生我之神，主智慧与学业。命局中${hasZheng ? '正印' : '偏印'}有力，利于攻读深造，学术之路可期。`,
        ]
        return pick(texts)
      },
      dimensions: ['学业', '事业'],
      confidence: 86,
      tags: ['印星', '学业', '科名', '渊海子平'],
    })
  }

  // ───────────────────────────────────────────────────────
  // 初始化组合规则（8条）
  // ───────────────────────────────────────────────────────

  private initComboRules(): void {
    // M001: 官印相生，事业稳定
    this.rules.set('M001', {
      id: 'M001',
      name: '官印相生，事业稳定',
      priority: 'combo',
      source: '子平真诠',
      sourceDetail: '《子平真诠》云："官印相生，主贵人提携，事业安稳。" 官星生印，印星生日主，层层相生。',
      description: '正官与正印同见且有力，官生印、印生身，层层相生，主事业稳定、贵人运旺。',
      condition: (input) => {
        return (hasStrongShiShen(input, '正官') || hasStrongShiShen(input, '七杀')) &&
          (hasStrongShiShen(input, '正印') || hasStrongShiShen(input, '偏印'))
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '官印相生，贵人之象。《子平真诠》云："官印相生，主贵人提携"，命局中官星生印星、印星生日主，层层相生，事业平稳上升，仕途可期。',
          '正官配正印，为官印双清之格。官星生印、印星护身，主事业稳定、上级赏识、贵人运旺。此为《子平真诠》所推崇之贵格。',
          '官印相生格局成立，事业根基稳固。印星泄官星之过于生日主，既得官星之权贵，又得印星之庇护，职场发展顺风顺水。',
        ]
        return pick(texts)
      },
      dimensions: ['事业', '贵人运'],
      confidence: 85,
      overridableBy: ['classic'],
      tags: ['官印相生', '事业', '子平真诠'],
    })

    // M002: 食神生财，富命之征
    this.rules.set('M002', {
      id: 'M002',
      name: '食神生财，富命之征',
      priority: 'combo',
      source: '滴天髓',
      sourceDetail: '《滴天髓》云："食神生财，富贵自来。食神者，财之源头也。"',
      description: '食神与财星同见，食神为财之源头，源源不断生财，主富命。',
      condition: (input) => {
        return hasShiShen(input, '食神') &&
          (hasShiShen(input, '正财') || hasShiShen(input, '偏财'))
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '食神生财，富命之征。《滴天髓》以食神为财之源头，食神旺而生财，则财富源源不断，经商理财皆宜。',
          '命局食神与财星相生，财有源头。《滴天髓》云"食神生财，富贵自来"，主人善经营、有才华，财路广开。',
          '食神为秀气之星，生财为实用之途。食神生财格局成者，主人聪明灵活、善于生财之道，经济状况良好。',
        ]
        return pick(texts)
      },
      dimensions: ['财富'],
      confidence: 83,
      overridableBy: ['classic'],
      tags: ['食神', '财星', '财富', '滴天髓'],
    })

    // M003: 财官双美，富贵双全
    this.rules.set('M003', {
      id: 'M003',
      name: '财官双美，富贵双全',
      priority: 'combo',
      source: '三命通会',
      sourceDetail: '《三命通会》云："财官双美，富贵双全。正财配正官，名利兼收。"',
      description: '正财与正官同见且有力，财以养命、官以立身，主名利双收。',
      condition: (input) => {
        return hasStrongShiShen(input, '正财') && hasStrongShiShen(input, '正官')
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '正财正官双显，富贵双全之象。《三命通会》云"财官双美，名利兼收"，命局中正财养命、正官立身，事业财富两相宜。',
          '财官双美格局成立。《三命通会》以此为富贵之征，正财主正当之财、正官主正当之权，二者并见，主人品端行正、名利兼得。',
          '正财与正官皆为吉神，双显则富贵可期。《三命通会》云："财官双美者，一生富足显达"，为命理上等格局。',
        ]
        return pick(texts)
      },
      dimensions: ['事业', '财富'],
      confidence: 84,
      overridableBy: ['classic'],
      tags: ['财官双美', '正财', '正官', '三命通会'],
    })

    // M004: 杀印相生，化杀为权
    this.rules.set('M004', {
      id: 'M004',
      name: '杀印相生，化杀为权',
      priority: 'combo',
      source: '神峰通考',
      sourceDetail: '《神峰通考》云："七杀有制化为权，无制则七杀为祸。印星制杀，化杀为权。"',
      description: '七杀与偏印同见，印星克制七杀之凶性，将杀之威权化为自身权力。',
      condition: (input) => {
        return hasStrongShiShen(input, '七杀') && hasStrongShiShen(input, '偏印')
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '杀印相生，化杀为权。《神峰通考》云："七杀有制化为权"，偏印制七杀，将七杀之凶威化为自身权柄，主掌权有术、威震四方。',
          '七杀本为凶神，有偏印制之则化凶为吉。《神峰通考》以此格局为权贵之征，主事业有魄力、能担当重任。',
          '偏印化杀，转危为机。七杀虽凶，得偏印克制反而成为驱动力。《神峰通考》称此为"化杀为权"，主大权在握。',
        ]
        return pick(texts)
      },
      dimensions: ['事业'],
      confidence: 82,
      overridableBy: ['classic'],
      tags: ['七杀', '偏印', '化杀为权', '神峰通考'],
    })

    // M005: 身旺财旺，富而有福
    this.rules.set('M005', {
      id: 'M005',
      name: '身旺财旺，富而有福',
      priority: 'combo',
      source: '滴天髓',
      sourceDetail: '《滴天髓》云："身旺能胜财，财旺身亦旺，富而有福。"',
      description: '日主身旺又能担起旺财，主富裕且能享福，非"富屋贫人"之象。',
      condition: (input) => {
        return isStrong(input) &&
          (hasStrongShiShen(input, '正财') || hasStrongShiShen(input, '偏财'))
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '身旺能担旺财，真富之命。《滴天髓》云："身旺能胜财，富而有福"，日主有力且财星丰盈，主经济富足且能享用。',
          '身旺财旺，二者得宜。不同于身弱财旺之"富屋贫人"，此格局主人既有赚钱之能，又有守财之力，财运亨通。',
          '日主身旺则能胜财官重任，财旺则资财丰盈。《滴天髓》以此格局为真正富足之象，主一生衣食无忧、富裕安康。',
        ]
        return pick(texts)
      },
      dimensions: ['财富', '旺衰'],
      confidence: 85,
      overridableBy: ['classic'],
      tags: ['身旺', '财旺', '财富', '滴天髓'],
    })

    // M006: 身弱杀重，需印化杀
    this.rules.set('M006', {
      id: 'M006',
      name: '身弱杀重，需印化杀',
      priority: 'combo',
      source: '穷通宝鉴',
      sourceDetail: '《穷通宝鉴》云："身弱杀重，若无印星化杀，恐有灾殃。印星化杀生身，转危为安。"',
      description: '身弱而七杀过旺，需要印星来化解七杀之凶，同时生扶日主。',
      condition: (input) => {
        return isWeak(input) && hasStrongShiShen(input, '七杀')
      },
      conclusion: '',
      generateConclusion: (input) => {
        const hasYin = hasShiShen(input, '正印') || hasShiShen(input, '偏印')
        const texts = [
          `身弱杀重，乃命局之病。《穷通宝鉴》云"身弱杀重需印化杀"${hasYin ? '，命局中有印星可化杀生身，尚属有救' : '，命局中未见印星化杀，需待印运到方可解厄'}。`,
          `日主身弱而七杀过旺，杀克身日甚。《穷通宝鉴》告诫需印星来化杀生身，${hasYin ? '幸有印星可解此困' : '惜无印星通关，宜多积德行善以待好运'}。`,
          `身弱不敌七杀之威，亟需印星调和。《穷通宝鉴》以此为用药之方，化杀生身一举两得。${hasYin ? '印星在局，可保安宁' : '缺印则需外力相助'}。`,
        ]
        return pick(texts)
      },
      dimensions: ['旺衰', '病药'],
      confidence: 84,
      overridableBy: ['classic'],
      tags: ['身弱', '七杀', '印星', '化杀', '穷通宝鉴'],
    })

    // M007: 桃花带杀，感情多波折
    this.rules.set('M007', {
      id: 'M007',
      name: '桃花带杀，感情多波折',
      priority: 'combo',
      source: '渊海子平',
      sourceDetail: '《渊海子平》云："桃花带杀，主感情多波折，女命尤甚。桃花为情欲之星，遇杀则情路坎坷。"',
      description: '桃花与七杀同见，感情运势多波折。桃花主风流浪漫，七杀主激烈冲突，二者叠加感情多坎坷。',
      condition: (input) => {
        return hasShenSha(input, '桃花') || hasShenSha(input, '咸池')
      },
      conclusion: '',
      generateConclusion: (input) => {
        const hasKill = hasShiShen(input, '七杀')
        const texts = hasKill ? [
          '桃花带杀，感情多波折。《渊海子平》以此为婚姻之忌，桃花主风流浪漫，七杀主激烈变化，二者叠加则感情之路坎坷曲折，需以理智驾驭情感。',
          '命局桃花与七杀并见，情缘多变。《渊海子平》云"桃花带杀主感情多波折"，宜晚婚以求稳定，感情中多一分冷静少一分冲动。',
          '桃花逢杀，情路多艰。此格局者感情丰富但波折不断，需学会珍惜真情、远离烂桃花，方得良缘。',
        ] : [
          '命局见桃花，主人异性缘佳。《渊海子平》云桃花为风流之星，人缘好但需注意感情上的取舍，不可因桃花而误正途。',
          '桃花入命，情缘不断。虽非桃花带杀之凶格，亦需在感情中保持清醒，避免因多情而伤情。',
          '桃花星现于命局，主人风度翩翩、人缘出众。善用此星之正面力量，可在社交艺术领域有所建树。',
        ]
        return pick(texts)
      },
      dimensions: ['婚姻', '神煞'],
      confidence: 78,
      overridableBy: ['classic'],
      tags: ['桃花', '七杀', '感情', '渊海子平'],
    })

    // M008: 华盖文昌同见，学业出众
    this.rules.set('M008', {
      id: 'M008',
      name: '华盖文昌同见，学业出众',
      priority: 'combo',
      source: '三命通会',
      sourceDetail: '《三命通会》云："华盖入命，主人聪明好学。文昌又见，文章盖世。二者同宫，学业大成。"',
      description: '华盖代表智慧与悟性，文昌代表学业与文才。二者同见主学业出众、才华横溢。',
      condition: (input) => {
        return hasShenSha(input, '华盖') && hasShenSha(input, '文昌')
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '华盖文昌同见，学业出众之象。《三命通会》云"华盖主聪明悟性，文昌主文学才华"，二者并见主天资聪颖、学业超群，宜在学术研究领域深耕。',
          '命局中华盖与文昌并见，主人文才斐然、思维敏捷。《三命通会》以此为学业大成之征，考试升学运佳，学术道路畅通。',
          '华盖入命主聪慧，文昌入命利文章。二星同见，犹如有天赋加勤勉，学业成就可期，适合从事文化教育研究类工作。',
        ]
        return pick(texts)
      },
      dimensions: ['学业'],
      confidence: 80,
      overridableBy: ['classic'],
      tags: ['华盖', '文昌', '学业', '三命通会'],
    })
  }

  // ───────────────────────────────────────────────────────
  // 初始化专家规则（7条）
  // ───────────────────────────────────────────────────────

  private initExpertRules(): void {
    // E001: 男命以财为妻，财旺则妻美能干
    this.rules.set('E001', {
      id: 'E001',
      name: '男命以财为妻，财旺则妻美能干',
      priority: 'expert',
      source: '韦千里',
      sourceDetail: '韦千里《命理约言》云："男命以财星为妻，财旺者妻子贤惠能干，财弱者妻子平庸或难得佳偶。"',
      description: '男命中财星代表妻子。正财为正妻，偏财为偏房或情人。财星有力主妻美能干。',
      condition: (input) => {
        return input.gender === 'male' &&
          (hasStrongShiShen(input, '正财') || hasStrongShiShen(input, '偏财'))
      },
      conclusion: '',
      generateConclusion: (input) => {
        const hasZ = hasStrongShiShen(input, '正财')
        const hasP = hasStrongShiShen(input, '偏财')
        const texts = [
          `韦千里论男命婚姻："男以财为妻"。命局中${hasZ && hasP ? '正偏财皆有' : hasZ ? '正财' : '偏财'}有力，主配偶贤惠能干、容貌不俗。`,
          `男命财星代表婚姻之缘。韦千里云"财旺则妻美能干"，命局中财星得力，主婚姻中能得贤内助之益。`,
          `韦千里命理经验总结：男命财星为妻星，${hasZ ? '正财有力主正妻贤能' : '偏财有力主异性缘佳'}，财旺者感情婚姻较为顺遂。`,
        ]
        return pick(texts)
      },
      dimensions: ['婚姻'],
      confidence: 78,
      overridableBy: ['classic', 'combo'],
      tags: ['男命', '财星', '婚姻', '韦千里'],
    })

    // E002: 女命以官为夫，官旺则夫贵
    this.rules.set('E002', {
      id: 'E002',
      name: '女命以官为夫，官旺则夫贵',
      priority: 'expert',
      source: '韦千里',
      sourceDetail: '韦千里《命理约言》云："女命以官星为夫，官旺者丈夫有权有势，官弱者丈夫平庸或难得佳婿。"',
      description: '女命中官星代表丈夫。正官为正夫，七杀为偏夫或情人。官星有力主夫贵有权。',
      condition: (input) => {
        return input.gender === 'female' &&
          (hasStrongShiShen(input, '正官') || hasStrongShiShen(input, '七杀'))
      },
      conclusion: '',
      generateConclusion: (input) => {
        const hasZ = hasStrongShiShen(input, '正官')
        const hasP = hasStrongShiShen(input, '七杀')
        const texts = [
          `韦千里论女命婚姻："女以官为夫"。命局中${hasZ && hasP ? '正官七杀皆有' : hasZ ? '正官' : '七杀'}有力，主配偶有能力有地位。`,
          `女命官星代表婚姻之缘。韦千里云"官旺则夫贵"，命局中官星得力，主能嫁有为之夫，婚姻稳定。`,
          `韦千里命理经验：女命官星为夫星，${hasZ ? '正官有力主夫品端正有地位' : '七杀有力主异性缘强但需注意感情波折'}，官旺者婚姻美满。`,
        ]
        return pick(texts)
      },
      dimensions: ['婚姻'],
      confidence: 78,
      overridableBy: ['classic', 'combo'],
      tags: ['女命', '官星', '婚姻', '韦千里'],
    })

    // E003: 驿马逢冲，一生多迁徙
    this.rules.set('E003', {
      id: 'E003',
      name: '驿马逢冲，一生多迁徙',
      priority: 'expert',
      source: '袁树珊',
      sourceDetail: '袁树珊《命理正宗》云："驿马主动，逢冲则更动。驿马逢冲者，一生多迁徙变动，离乡背井。"',
      description: '驿马主奔波走动，逢冲则动上加动。驿马逢冲者一生多外出远行、搬家迁徙。',
      condition: (input) => {
        return hasShenSha(input, '驿马') && hasClash(input)
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '驿马逢冲，一生多迁徙。袁树珊云："驿马主动，逢冲则更动"，命局中驿马被冲动，主一生奔波在外、多次迁居，适合从事需经常出差或外派的工作。',
          '命局见驿马且逢冲，主远行走动频繁。袁树珊以此为离乡背井之征，但驿马逢冲亦可理解为"动中求财"的机遇，适合在外地发展。',
          '驿马本为走动之星，逢冲则更加躁动不安。袁树珊告诫驿马逢冲者宜主动适应变动，将奔波化为机遇，方为上策。',
        ]
        return pick(texts)
      },
      dimensions: ['迁徙', '神煞'],
      confidence: 75,
      overridableBy: ['classic', 'combo'],
      tags: ['驿马', '冲', '迁徙', '袁树珊'],
    })

    // E004: 天乙贵人多见，一生多贵人相助
    this.rules.set('E004', {
      id: 'E004',
      name: '天乙贵人多见，一生多贵人相助',
      priority: 'expert',
      source: '徐乐吾',
      sourceDetail: '徐乐吾《子平真诠评注》云："天乙贵人为命中最吉之神，多见者一生贵人提携、遇难呈祥。"',
      description: '天乙贵人为命理第一吉神，若命局中出现两处以上，一生多贵人相助。',
      condition: (input) => {
        return shenShaCount(input, '天乙贵人') >= 2
      },
      conclusion: '',
      generateConclusion: (input) => {
        const count = shenShaCount(input, '天乙贵人')
        const texts = [
          `命局中天乙贵人多达${count}处，徐乐吾云："天乙贵人为最吉之神，多见者一生逢凶化吉。"主一生多得贵人提携、危难之际有人相助。`,
          `天乙贵人${count}处入命，贵人运极佳。徐乐吾《子平真诠评注》以为命中有此吉星，主社会关系良好、关键时刻总有贵人伸出援手。`,
          `天乙贵人为逢凶化吉之星，命局中${count}处出现，贵人运旺盛。徐乐吾经验总结：天乙贵人多见者，一生多得长上、上司、朋友的帮助。`,
        ]
        return pick(texts)
      },
      dimensions: ['贵人运'],
      confidence: 76,
      overridableBy: ['classic', 'combo'],
      tags: ['天乙贵人', '贵人运', '徐乐吾'],
    })

    // E005: 羊刃倒戈，不禄之征
    this.rules.set('E005', {
      id: 'E005',
      name: '羊刃倒戈，不禄之征',
      priority: 'expert',
      source: '张神峰',
      sourceDetail: '张神峰《神峰通考》云："羊刃者，劫财之极也。刃旺无制，谓之倒戈，主凶灾血光。"',
      description: '羊刃过旺而全局无制（无官杀制、无食伤泄），称为"倒戈"，主有刑灾血光之祸。',
      condition: (input) => {
        return hasYangRen(input) && isStrong(input) &&
          !hasShiShen(input, '正官') && !hasShiShen(input, '七杀') &&
          !hasShiShen(input, '食神')
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '羊刃过旺而无制，张神峰称之为"倒戈"。《神峰通考》云："刃旺无制谓之倒戈，主凶灾。"命局中羊刃无官杀克制也无食伤泄秀，需特别注意身体健康与安全。',
          '羊刃倒戈之象，张神峰《神峰通考》引以为大忌。刃旺而全局无制化，犹如利刃无鞘，主人性急刚烈，易有血光刑伤之灾。宜修身养性、避免冒险。',
          '张神峰论羊刃倒戈："不禄之征"。命局中羊刃旺盛而缺乏制化，需谨慎行事，注意身体健康，可从事武职或需要魄力的工作以化其刚烈之气。',
        ]
        return pick(texts)
      },
      dimensions: ['旺衰', '健康'],
      confidence: 77,
      overridableBy: ['classic', 'combo'],
      tags: ['羊刃', '倒戈', '健康', '张神峰'],
    })

    // E006: 金水相生，主人聪明秀气
    this.rules.set('E006', {
      id: 'E006',
      name: '金水相生，主人聪明秀气',
      priority: 'expert',
      source: '命理约言',
      sourceDetail: '《命理约言》云："金水相生，主人聪明秀气，才思敏捷，言语清丽。"',
      description: '命局中金水两旺且相生，主人聪明伶俐、才思敏捷、外貌清秀。',
      condition: (input) => {
        return isElementStrong(input, '金') && isElementStrong(input, '水')
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '金水相生，主人聪明秀气。《命理约言》云"金水相生者才思敏捷"，命局中金旺生水，水主智，主人思维灵活、学识出众。',
          '命局金水两旺，金白水清之象。《命理约言》以此为聪明秀气之征，主人头脑灵活、口齿伶俐，适合从事文化教育、艺术创作等领域。',
          '金水相生格局，主人才智过人。《命理约言》总结金水相生者"聪明秀气、言语清丽"，命局中金生水旺，智慧如泉涌不绝。',
        ]
        return pick(texts)
      },
      dimensions: ['性格', '学业'],
      confidence: 74,
      overridableBy: ['classic', 'combo'],
      tags: ['金水', '聪明', '性格', '命理约言'],
    })

    // E007: 木火通明，文才焕发
    this.rules.set('E007', {
      id: 'E007',
      name: '木火通明，文才焕发',
      priority: 'expert',
      source: '穷通宝鉴摘要',
      sourceDetail: '《穷通宝鉴摘要》云："木火通明，文才焕发。木为文星，火为光明，木火相生则文采斐然。"',
      description: '命局中木火两旺且相生，主人文采出众、表达力强、声名远播。',
      condition: (input) => {
        return isElementStrong(input, '木') && isElementStrong(input, '火')
      },
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '木火通明，文才焕发。《穷通宝鉴摘要》云"木火通明者文采斐然"，命局中木旺生火，火主光明，主人文章出众、才名远扬。',
          '命局木火两旺，木火通明之象。《穷通宝鉴摘要》以此为文学才华之征，主人善于表达、文笔优美，适合从事写作、教育、传媒等行业。',
          '木为文曲之星，火为文明之光。木火相生则文才焕发，《穷通宝鉴摘要》总结此格局主人有才华、有文采、有声名。',
        ]
        return pick(texts)
      },
      dimensions: ['学业', '事业'],
      confidence: 74,
      overridableBy: ['classic', 'combo'],
      tags: ['木火', '文才', '学业', '穷通宝鉴摘要'],
    })
  }

  // ───────────────────────────────────────────────────────
  // 初始化AI推理规则（5条）
  // ───────────────────────────────────────────────────────

  private initAIRules(): void {
    // AI001: 概率引擎 — 事业分高
    this.rules.set('AI001', {
      id: 'AI001',
      name: '概率引擎：事业运佳',
      priority: 'ai',
      source: 'engine_probability',
      sourceDetail: '基于概率引擎对事业维度的综合评分，事业分高于75分则事业运势良好。',
      description: '概率引擎计算事业维度综合得分超过75，表明命局中事业发展条件优越。',
      condition: (input) => {
        const score = getProbabilityScore(input, '事业') ?? getProbabilityScore(input, 'career')
        return score !== undefined && score > 75
      },
      conclusion: '',
      generateConclusion: (input) => {
        const score = getProbabilityScore(input, '事业') ?? getProbabilityScore(input, 'career') ?? 0
        const texts = [
          `概率引擎综合评估事业维度得分${score}分（满分100），高于75分阈值，表明命局中事业发展条件优越，事业运佳。`,
          `经概率引擎多维度计算，事业运势综合评分为${score}分，处于较高水平。命局结构对事业发展较为有利。`,
          `概率引擎分析显示事业维度评分达${score}分，超过75分优秀线。结合命局整体结构，事业发展前景良好。`,
        ]
        return pick(texts)
      },
      dimensions: ['事业'],
      confidence: 70,
      overridableBy: ['classic', 'combo', 'expert'],
      tags: ['概率引擎', '事业'],
    })

    // AI002: 概率引擎 — 财富分低
    this.rules.set('AI002', {
      id: 'AI002',
      name: '概率引擎：财运需注意',
      priority: 'ai',
      source: 'engine_probability',
      sourceDetail: '基于概率引擎对财富维度的综合评分，财富分低于40分则财运需注意。',
      description: '概率引擎计算财富维度综合得分低于40，表明命局中财富积累条件需关注。',
      condition: (input) => {
        const score = getProbabilityScore(input, '财富') ?? getProbabilityScore(input, 'wealth')
        return score !== undefined && score < 40
      },
      conclusion: '',
      generateConclusion: (input) => {
        const score = getProbabilityScore(input, '财富') ?? getProbabilityScore(input, 'wealth') ?? 0
        const texts = [
          `概率引擎综合评估财富维度得分${score}分，低于40分警示线，表明命局中财富积累面临一定挑战，需注意理财策略。`,
          `经概率引擎计算，财富运势综合评分为${score}分，处于较低水平。建议稳健理财、量入为出，避免高风险投资。`,
          `概率引擎分析显示财富维度评分仅${score}分，低于40分需关注线。财运方面宜保守为主、厚积薄发。`,
        ]
        return pick(texts)
      },
      dimensions: ['财富'],
      confidence: 68,
      overridableBy: ['classic', 'combo', 'expert'],
      tags: ['概率引擎', '财富'],
    })

    // AI003: 事件预测 — 高风险事件
    this.rules.set('AI003', {
      id: 'AI003',
      name: '事件预测：高风险事件需防范',
      priority: 'ai',
      source: 'engine_probability',
      sourceDetail: '基于事件预测引擎分析，当高风险事件概率超过60%时需提前做好防范准备。',
      description: '事件预测引擎发现存在高风险事件，概率超过60%，需引起重视并提前应对。',
      condition: (input) => hasHighRiskEvent(input, 60),
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '事件预测引擎检测到存在高风险事件（概率超过60%），建议提前做好应对准备。可根据用神五行方向选择有利时机进行重要决策。',
          '经事件预测引擎分析，命局中存在较高概率的风险事件，需未雨绸缪。建议在行为上谨慎行事，在时机上选择有利的流年大运。',
          '事件预测显示有风险事件概率偏高，需提高警惕。引擎建议：避开不利月份、增强自身旺运、多行善积德以化解不利因素。',
        ]
        return pick(texts)
      },
      dimensions: ['风险'],
      confidence: 65,
      overridableBy: ['classic', 'combo', 'expert'],
      tags: ['事件预测', '风险'],
    })

    // AI004: 决策引擎 — 高分决策建议执行
    this.rules.set('AI004', {
      id: 'AI004',
      name: '决策引擎：强烈建议执行',
      priority: 'ai',
      source: 'engine_decision',
      sourceDetail: '基于决策引擎综合评分，当某决策得分超过80分时建议积极执行。',
      description: '决策引擎对某项决策给出高分评价（>80），建议积极把握时机执行。',
      condition: (input) => hasHighScoreDecision(input, 80),
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '决策引擎综合评分超过80分，建议积极执行该决策。命局当前格局对该项决策较为有利，时机成熟，宜果断行动。',
          '经决策引擎从命局、大运、流年三层面综合评估，该项决策得分优异（>80分），强烈建议把握当前有利时机。',
          '决策引擎分析显示该项决策整体评分超过80分优秀线，命局结构与时机配合良好，建议坚定执行。',
        ]
        return pick(texts)
      },
      dimensions: ['决策'],
      confidence: 67,
      overridableBy: ['classic', 'combo', 'expert'],
      tags: ['决策引擎', '决策'],
    })

    // AI005: 一致性检查未通过
    this.rules.set('AI005', {
      id: 'AI005',
      name: '一致性检查未通过',
      priority: 'ai',
      source: 'engine_consistency',
      sourceDetail: '一致性检查引擎对各模块输出进行交叉验证，未通过则表明引擎结果可信度可能降低。',
      description: '一致性检查发现各模块之间存在矛盾，引擎分析结果的可信度受到影响。',
      condition: (input) => !isConsistencyPassed(input),
      conclusion: '',
      generateConclusion: (input) => {
        const texts = [
          '一致性检查未通过，表明各分析模块之间存在矛盾。建议以经典古籍规则为最终参考，引擎计算结果可信度有所降低。',
          '经一致性检查，部分推演模块之间存在不一致。此情况下应优先遵循经典古籍之结论，其余推演结果需审慎参酌。',
          '引擎一致性校验未通过，可能原因包括命局结构复杂或特殊格局影响。建议重点关注经典规则和组合规则的结论，以古籍铁律为准绳。',
        ]
        return pick(texts)
      },
      dimensions: ['可信度'],
      confidence: 60,
      overridableBy: ['classic', 'combo', 'expert'],
      tags: ['一致性检查', '可信度'],
    })
  }

  // ───────────────────────────────────────────────────────
  // 核心方法：执行所有规则
  // ───────────────────────────────────────────────────────

  /**
   * evaluate — 执行所有规则，返回完整结果
   *
   * 流程：
   *   1. 遍历所有规则，执行 condition 检查
   *   2. 按优先级排序
   *   3. 检测冲突
   *   4. 裁决冲突
   *   5. 生成最终裁决
   *   6. 生成报告摘要
   */
  evaluate(input: RuleEngineInput): ExpertRuleEngineResult {
    // 1. 执行所有规则
    const allResults: RuleExecutionResult[] = []

    for (const rule of this.rules.values()) {
      // 跳过未启用的规则
      if (rule.status === 'inactive') continue

      const matched = rule.condition(input)
      if (!matched) continue

      const conclusion = rule.generateConclusion
        ? rule.generateConclusion(input)
        : rule.conclusion

      const result: RuleExecutionResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        priority: rule.priority,
        matched: true,
        conclusion,
        confidence: rule.confidence,
        source: rule.source,
        sourceDetail: rule.sourceDetail,
        status: 'active',
      }

      allResults.push(result)
    }

    // 2. 按优先级排序
    allResults.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

    // 3. 冲突检测与裁决
    this.detectConflicts(allResults)
    this.resolveConflicts(allResults)

    // 4. 按优先级分组
    const byPriority = {
      classic: allResults.filter(r => r.priority === 'classic'),
      combo: allResults.filter(r => r.priority === 'combo'),
      expert: allResults.filter(r => r.priority === 'expert'),
      ai: allResults.filter(r => r.priority === 'ai'),
    }

    // 5. 生成最终裁决
    const finalDecisions = this.buildFinalDecisions(allResults)

    // 6. 被覆盖的规则
    const overriddenRules = allResults.filter(r => r.status === 'overridden')

    // 7. 冲突统计
    const conflictCount = allResults.filter(
      r => r.status === 'conflict' || r.status === 'overridden'
    ).length

    // 8. 冲突摘要
    const conflictSummary = this.buildConflictSummary(overriddenRules, allResults)

    // 9. 总评
    const summary = this.buildSummary(allResults, finalDecisions, overriddenRules)

    // 10. 古籍引用
    const classicalRef = this.buildClassicalRef(allResults)

    // 11. 规则统计
    const stats = {
      totalRules: this.rules.size,
      matchedRules: allResults.length,
      overriddenRules: overriddenRules.length,
      conflicts: conflictCount,
      byPriority: {
        classic: byPriority.classic.length,
        combo: byPriority.combo.length,
        expert: byPriority.expert.length,
        ai: byPriority.ai.length,
      },
    }

    return {
      results: allResults,
      byPriority,
      finalDecisions,
      overriddenRules,
      conflictSummary,
      summary,
      classicalRef,
      stats,
    }
  }

  // ───────────────────────────────────────────────────────
  // 冲突检测
  // ───────────────────────────────────────────────────────

  /**
   * detectConflicts — 检测同一维度上的规则冲突
   *
   * 同一维度有多条规则匹配时标记为 conflict。
   */
  private detectConflicts(results: RuleExecutionResult[]): void {
    const dimensionMap = new Map<string, RuleExecutionResult[]>()

    for (const result of results) {
      for (const dim of this.getRuleDimensions(result.ruleId)) {
        if (!dimensionMap.has(dim)) {
          dimensionMap.set(dim, [])
        }
        dimensionMap.get(dim)!.push(result)
      }
    }

    // 同一维度有多条规则时标记冲突
    for (const [, rules] of dimensionMap) {
      if (rules.length > 1) {
        for (const rule of rules) {
          rule.status = 'conflict'
        }
      }
    }
  }

  /**
   * resolveConflicts — 裁决冲突
   *
   * 规则：
   *   1. 按 priority 排序，高优先级胜出
   *   2. classic 规则不可被任何规则覆盖
   *   3. 同优先级内 confidence 高的胜出
   *   4. 生成 overrideReason
   */
  private resolveConflicts(results: RuleExecutionResult[]): void {
    const dimensionMap = new Map<string, RuleExecutionResult[]>()

    for (const result of results) {
      for (const dim of this.getRuleDimensions(result.ruleId)) {
        if (!dimensionMap.has(dim)) {
          dimensionMap.set(dim, [])
        }
        dimensionMap.get(dim)!.push(result)
      }
    }

    for (const [dimension, rules] of dimensionMap) {
      if (rules.length <= 1) {
        // 无冲突，恢复 active 状态
        if (rules.length === 1 && rules[0].status === 'conflict') {
          rules[0].status = 'active'
        }
        continue
      }

      // 按优先级排序（高优先级在前），同优先级按置信度降序
      rules.sort((a, b) => {
        const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
        if (pDiff !== 0) return pDiff
        return b.confidence - a.confidence
      })

      // 找到胜出者（第一个 classic 规则或排序后的第一个）
      const winner = rules[0]

      // classic 规则不可被覆盖
      if (winner.priority === 'classic') {
        winner.status = 'active'
        for (let i = 1; i < rules.length; i++) {
          rules[i].status = 'overridden'
          rules[i].overriddenBy = winner.ruleId
          rules[i].overrideReason = this.buildOverrideReason(winner, rules[i], dimension)
        }
        continue
      }

      // 非 classic 的情况：按排序后的优先级裁决
      winner.status = 'active'
      for (let i = 1; i < rules.length; i++) {
        const loser = rules[i]
        // 检查胜出者是否允许被更高优先级覆盖
        const winnerRule = this.rules.get(winner.ruleId)
        if (winnerRule && winnerRule.overridableBy) {
          if (winnerRule.overridableBy.includes(loser.priority)) {
            // 胜出者可被败者优先级覆盖 — 不太可能但处理边界情况
            continue
          }
        }
        loser.status = 'overridden'
        loser.overriddenBy = winner.ruleId
        loser.overrideReason = this.buildOverrideReason(winner, loser, dimension)
      }
    }
  }

  /**
   * 生成覆盖原因说明
   */
  private buildOverrideReason(
    winner: RuleExecutionResult,
    loser: RuleExecutionResult,
    dimension: string
  ): string {
    if (winner.priority === 'classic') {
      const reasons = [
        `经典规则${winner.ruleId}（${winner.ruleName}）在"${dimension}"维度具有最高优先级，${PRIORITY_LABEL[loser.priority]}${loser.ruleId}不可覆盖`,
        `古籍铁律${winner.ruleId}在"${dimension}"维度上拥有否决权，${PRIORITY_LABEL[loser.priority]}${loser.ruleId}的结论被否决`,
        `经典规则具有最高优先级和否决权，${PRIORITY_LABEL[loser.priority]}${loser.ruleId}在"${dimension}"维度不可覆盖经典规则${winner.ruleId}（${winner.ruleName}）`,
      ]
      return pick(reasons)
    }

    const samePriority = winner.priority === loser.priority
    if (samePriority) {
      const reasons = [
        `同属${PRIORITY_LABEL[winner.priority]}，规则${winner.ruleId}（置信度${winner.confidence}）高于规则${loser.ruleId}（置信度${loser.confidence}），在"${dimension}"维度胜出`,
        `同优先级内按置信度裁决，规则${winner.ruleId}（${winner.confidence}%）胜过规则${loser.ruleId}（${loser.confidence}%）`,
      ]
      return pick(reasons)
    }

    const reasons = [
      `${PRIORITY_LABEL[winner.priority]}${winner.ruleId}（${winner.ruleName}）优先级高于${PRIORITY_LABEL[loser.priority]}${loser.ruleId}（${loser.ruleName}），在"${dimension}"维度胜出`,
      `按优先级体系裁决：${PRIORITY_LABEL[winner.priority]}（${winner.ruleId}）> ${PRIORITY_LABEL[loser.priority]}（${loser.ruleId}），高优先级规则在"${dimension}"维度胜出`,
      `规则${winner.ruleId}的优先级（${PRIORITY_LABEL[winner.priority]}）高于规则${loser.ruleId}（${PRIORITY_LABEL[loser.priority]}），在"${dimension}"维度以高优先级胜出`,
    ]
    return pick(reasons)
  }

  /**
   * 获取规则的影响维度
   */
  private getRuleDimensions(ruleId: string): string[] {
    const rule = this.rules.get(ruleId)
    if (!rule) return []
    return rule.dimensions
  }

  // ───────────────────────────────────────────────────────
  // 生成最终裁决
  // ───────────────────────────────────────────────────────

  /**
   * buildFinalDecisions — 按维度生成最终裁决
   *
   * 每个维度只保留最高优先级胜出的规则作为最终裁决。
   */
  private buildFinalDecisions(results: RuleExecutionResult[]): FinalDecision[] {
    const dimensionMap = new Map<string, RuleExecutionResult[]>()

    for (const result of results) {
      for (const dim of this.getRuleDimensions(result.ruleId)) {
        if (!dimensionMap.has(dim)) {
          dimensionMap.set(dim, [])
        }
        dimensionMap.get(dim)!.push(result)
      }
    }

    const decisions: FinalDecision[] = []

    for (const [dimension, rules] of dimensionMap) {
      // 取 active 状态的规则作为裁决
      const activeRule = rules.find(r => r.status === 'active')
      if (!activeRule) continue

      const reason = this.buildDecisionReason(activeRule, dimension, rules)

      decisions.push({
        dimension,
        conclusion: activeRule.conclusion,
        ruleId: activeRule.ruleId,
        priority: activeRule.priority,
        confidence: activeRule.confidence,
        reason,
      })
    }

    // 按优先级排序
    decisions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

    return decisions
  }

  /**
   * 生成裁决理由
   */
  private buildDecisionReason(
    winner: RuleExecutionResult,
    dimension: string,
    allRules: RuleExecutionResult[]
  ): string {
    const totalRules = allRules.length
    if (totalRules === 1) {
      const reasons = [
        `规则${winner.ruleId}（${winner.ruleName}）为"${dimension}"维度唯一匹配的规则，直接作为裁决依据。来源：${winner.source}`,
        `在"${dimension}"维度上仅有${PRIORITY_LABEL[winner.priority]}${winner.ruleId}匹配，其结论作为该维度的最终裁决。`,
      ]
      return pick(reasons)
    }

    const overridden = allRules.filter(r => r.status === 'overridden')
    const overriddenIds = overridden.map(r => r.ruleId).join('、')

    if (winner.priority === 'classic') {
      const reasons = [
        `经典规则${winner.ruleId}（${winner.ruleName}）在"${dimension}"维度具有最高优先级，覆盖了${overriddenIds}。经典规则来源于${winner.source}，具有否决权。`,
        `"${dimension}"维度上共${totalRules}条规则匹配，经典规则${winner.ruleId}凭借最高优先级胜出，${overriddenIds}被否决。古籍原文：${winner.sourceDetail}`,
      ]
      return pick(reasons)
    }

    const reasons = [
      `"${dimension}"维度上共${totalRules}条规则匹配，${PRIORITY_LABEL[winner.priority]}${winner.ruleId}（置信度${winner.confidence}%）优先级最高，胜出并覆盖了${overriddenIds}。`,
      `在"${dimension}"维度，${PRIORITY_LABEL[winner.priority]}${winner.ruleId}优先于${overriddenIds}，以${winner.source}为依据做出裁决。`,
    ]
    return pick(reasons)
  }

  // ───────────────────────────────────────────────────────
  // 报告生成
  // ───────────────────────────────────────────────────────

  /**
   * buildConflictSummary — 生成冲突摘要
   */
  private buildConflictSummary(
    overridden: RuleExecutionResult[],
    allResults: RuleExecutionResult[]
  ): string {
    if (overridden.length === 0) {
      return '本次分析未检测到规则冲突，所有匹配规则的结论保持一致，可直接采用。'
    }

    const parts: string[] = [
      `本次分析共检测到${overridden.length}条规则冲突，已按优先级体系裁决完毕。`,
    ]

    for (const rule of overridden) {
      parts.push(
        `${PRIORITY_LABEL[rule.priority]}${rule.ruleId}（${rule.ruleName}）被${rule.overriddenBy}覆盖：${rule.overrideReason}`
      )
    }

    parts.push(
      '裁决原则：经典古籍（classic）> 组合规则（combo）> 专家规则（expert）> 推演计算（ai）。经典古籍具有否决权，不可被任何规则覆盖。'
    )

    return parts.join('\n')
  }

  /**
   * buildSummary — 生成总评
   */
  private buildSummary(
    allResults: RuleExecutionResult[],
    finalDecisions: FinalDecision[],
    overridden: RuleExecutionResult[]
  ): string {
    const parts: string[] = []

    // 开头
    const openers = [
      '专家规则引擎已完成命局全面推演，综合运用经典古籍、组合规则、专家经验及推演计算四层体系，得出以下综合评估。',
      '本次推演通过四层体系（经典→组合→专家→推演计算）对命局进行全方位扫描，以下为综合评估结果。',
      '经专家规则引擎分析，命局在多个维度均有规则匹配，以下为按优先级裁决后的综合评估。',
    ]
    parts.push(pick(openers))

    // 匹配统计
    const classicCount = allResults.filter(r => r.priority === 'classic').length
    const comboCount = allResults.filter(r => r.priority === 'combo').length
    const expertCount = allResults.filter(r => r.priority === 'expert').length
    const aiCount = allResults.filter(r => r.priority === 'ai').length

    if (classicCount > 0) {
      const classicTexts = [
        `本次分析有${classicCount}条经典规则匹配，经典规则来自古籍铁律，具有最高优先级，其结论为各维度之定论。`,
        `共命中${classicCount}条经典规则，这些规则源自《滴天髓》《子平真诠》等命理经典，结论具有否决权。`,
      ]
      parts.push(pick(classicTexts))
    }

    if (overridden.length > 0) {
      parts.push(
        `共发生${overridden.length}次规则冲突，已按优先级体系裁决。经典规则的结论在冲突中均胜出。`
      )
    }

    // 关键维度
    const keyDecisions = finalDecisions.filter(d => d.priority === 'classic')
    if (keyDecisions.length > 0) {
      parts.push('核心裁决（经典规则）：')
      for (const decision of keyDecisions.slice(0, 3)) {
        parts.push(`  · ${decision.dimension}：${decision.conclusion}`)
      }
    }

    // 结尾
    const closers = [
      '以上推演严格遵循"经典优先、古籍铁律不可动摇"之原则，推演计算仅作辅助参酌，不可覆盖经典古籍之结论。',
      '依古法综合而论，本命局之推演以古籍经典为根基，以组合规则为补充，以专家经验为印证，以推演计算为参酌，形成完整的四级判断体系。',
    ]
    parts.push(pick(closers))

    return parts.join('\n')
  }

  /**
   * buildClassicalRef — 生成古籍引用
   */
  private buildClassicalRef(allResults: RuleExecutionResult[]): string {
    const refs: string[] = []

    for (const result of allResults) {
      if (result.priority === 'classic') {
        refs.push(`〔${result.source}〕${result.sourceDetail}`)
      }
    }

    if (refs.length === 0) {
      return '本次分析未触发经典古籍规则。'
    }

    const openers = [
      '本次分析所引用的古籍原文如下，供查阅考证：',
      '相关古籍原文出处如下：',
      '经典古籍引用（作为本次分析之权威依据）：',
    ]

    return pick(openers) + '\n' + refs.join('\n')
  }

  // ───────────────────────────────────────────────────────
  // 规则管理方法
  // ───────────────────────────────────────────────────────

  /**
   * addRule — 添加自定义规则
   */
  addRule(rule: ExpertRule): void {
    // 验证规则完整性
    if (!rule.id || !rule.name || !rule.priority || !rule.source) {
      throw new Error('规则必须包含 id、name、priority、source')
    }
    if (!rule.condition || typeof rule.condition !== 'function') {
      throw new Error('规则必须包含 condition 函数')
    }
    if (!rule.dimensions || rule.dimensions.length === 0) {
      throw new Error('规则必须至少指定一个影响维度')
    }
    if (rule.confidence < 0 || rule.confidence > 100) {
      throw new Error('规则置信度必须在 0-100 之间')
    }
    // classic 规则不可被覆盖
    if (rule.priority === 'classic') {
      rule.overridableBy = undefined
    }
    this.rules.set(rule.id, rule)
  }

  /**
   * removeRule — 移除规则
   */
  removeRule(id: string): boolean {
    return this.rules.delete(id)
  }

  /**
   * setRuleStatus — 启用/禁用规则
   */
  setRuleStatus(id: string, active: boolean): boolean {
    const rule = this.rules.get(id)
    if (!rule) return false
    rule.status = active ? 'active' : 'inactive'
    return true
  }

  /**
   * getAllRules — 获取所有规则
   */
  getAllRules(): ExpertRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * getRulesByPriority — 按优先级获取规则
   */
  getRulesByPriority(priority: RulePriority): ExpertRule[] {
    return Array.from(this.rules.values()).filter(r => r.priority === priority)
  }

  /**
   * getStats — 获取规则统计
   */
  getStats(): { total: number; byPriority: Record<RulePriority, number>; active: number } {
    const all = this.getAllRules()
    return {
      total: all.length,
      byPriority: {
        classic: all.filter(r => r.priority === 'classic').length,
        combo: all.filter(r => r.priority === 'combo').length,
        expert: all.filter(r => r.priority === 'expert').length,
        ai: all.filter(r => r.priority === 'ai').length,
      },
      active: all.filter(r => r.status !== 'inactive').length,
    }
  }

  // ───────────────────────────────────────────────────────
  // 格式化报告
  // ───────────────────────────────────────────────────────

  /**
   * formatReport — 将引擎结果格式化为可读报告
   */
  formatReport(result: ExpertRuleEngineResult): string {
    const lines: string[] = []

    // 标题
    lines.push('╔══════════════════════════════════════════════════╗')
    lines.push('║           专家规则引擎分析报告                   ║')
    lines.push('╚══════════════════════════════════════════════════╝')
    lines.push('')

    // 统计概览
    lines.push(`【规则统计】`)
    lines.push(`  总规则数：${result.stats.totalRules}`)
    lines.push(`  匹配规则：${result.stats.matchedRules}`)
    lines.push(`  覆盖规则：${result.stats.overriddenRules}`)
    lines.push(`  冲突数量：${result.stats.conflicts}`)
    lines.push(`  按优先级：经典${result.stats.byPriority.classic} / 组合${result.stats.byPriority.combo} / 专家${result.stats.byPriority.expert} / AI${result.stats.byPriority.ai}`)
    lines.push('')

    // 最终裁决
    lines.push('【最终裁决】')
    if (result.finalDecisions.length === 0) {
      lines.push('  无匹配规则，无裁决。')
    } else {
      for (const decision of result.finalDecisions) {
        lines.push(`  [${PRIORITY_LABEL[decision.priority]}] ${decision.dimension}：${decision.conclusion}`)
        lines.push(`    来源：${decision.ruleId}（置信度${decision.confidence}%）`)
        lines.push(`    裁决理由：${decision.reason}`)
        lines.push('')
      }
    }

    // 所有匹配规则详情
    lines.push('【匹配规则详情】（按优先级排序）')
    for (const r of result.results) {
      const statusMark = r.status === 'active' ? '✓ 有效' :
        r.status === 'overridden' ? `✗ 被${r.overriddenBy}覆盖` :
        r.status === 'conflict' ? '⚠ 冲突' : '○ 未激活'
      lines.push(`  ${statusMark} | ${r.priority.toUpperCase()} | ${r.ruleId} | ${r.ruleName}`)
      lines.push(`    结论：${r.conclusion}`)
      if (r.overrideReason) {
        lines.push(`    覆盖原因：${r.overrideReason}`)
      }
      lines.push('')
    }

    // 冲突摘要
    lines.push('【冲突摘要】')
    lines.push(result.conflictSummary)
    lines.push('')

    // 总评
    lines.push('【综合总评】')
    lines.push(result.summary)
    lines.push('')

    // 古籍引用
    lines.push('【古籍引用】')
    lines.push(result.classicalRef)
    lines.push('')

    return lines.join('\n')
  }
}
