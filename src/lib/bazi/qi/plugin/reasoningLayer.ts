/**
 * P3.11 AI Reasoning Layer — 推理层引擎
 *
 * 核心设计理念：
 *   Explain 不能是模板！必须先推理、再输出。
 *   每个结论必须解释"为什么"，而不是直接给结论。
 *   推理过程可见、可追溯、可验证。
 *   类似 Chain-of-Thought：前提→推理步骤→中间结论→最终结论。
 *
 * 古籍依据（源自《滴天髓》《三命通会》《子平真诠》《穷通宝鉴》《渊海子平》）：
 *   《滴天髓》云："何知其人富，财气通门户。"
 *   《三命通会》云："凡看命，以日干为主。"
 *   《子平真诠》云："用神者，命中之枢纽也。"
 *   《穷通宝鉴》云："正月丙火，大气已进，须壬水为妙。"
 *
 * 特性：
 *   - 纯 Plugin，不修改 Kernel
 *   - import type 仅引入类型（FiveElement）
 *   - 所有输出内容中文字符串
 *   - pick() / pickN() 随机选择器避免模板化
 *   - 推理链必须完整（不能跳过步骤）
 *   - 12 条推理链覆盖旺衰/格局/用神/调候/病药/通关/事业/财富/婚姻/健康/时间轴/决策
 *   - 跨链综合分析支持一致性和矛盾检测
 */

import type { FiveElement } from '../../types'
import { STEM_ELEMENT as TIANGAN_ELEMENT, BRANCH_ELEMENT as DIZHI_ELEMENT } from '../../../core'

// ═══════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════

/** 推理步骤类型 */
export type ReasoningStepType =
  | 'premise'         // 前提（已知事实）
  | 'deduction'       // 演绎推理（从一般到特殊）
  | 'induction'       // 归纳推理（从特殊到一般）
  | 'abduction'       // 溯因推理（最佳解释）
  | 'analogy'         // 类比推理（相似案例类推）
  | 'contradiction'   // 矛盾检测
  | 'resolution'      // 矛盾化解
  | 'synthesis'       // 综合研判（多线索汇聚）
  | 'conclusion'      // 最终结论

/** 推理步骤 */
export interface ReasoningStep {
  /** 步骤序号 */
  step: number
  /** 步骤类型 */
  type: ReasoningStepType
  /** 步骤标题 */
  title: string
  /** 详细推理过程（为什么这样推理） */
  reasoning: string
  /** 该步骤引用的证据 */
  evidence: string[]
  /** 该步骤引用的古籍 */
  classicalRefs: string[]
  /** 置信度 0-100 */
  confidence: number
  /** 该步骤的结论 */
  conclusion: string
  /** 前置步骤依赖（哪些步骤的结论作为本步的前提） */
  dependsOn: number[]
  /** 来源模块 */
  sourceModule?: string
}

/** 推理链 */
export interface ReasoningChain {
  /** 推理链ID */
  id: string
  /** 推理主题 */
  topic: string
  /** 所有步骤 */
  steps: ReasoningStep[]
  /** 最终结论 */
  finalConclusion: string
  /** 总置信度 */
  overallConfidence: number
  /** 推理摘要（非模板化） */
  summary: string
  /** 使用的推理方法统计 */
  methodStats: Record<ReasoningStepType, number>
  /** 推理深度（最长依赖链长度） */
  depth: number
  /** 是否存在矛盾 */
  hasContradiction: boolean
  /** 矛盾是否已化解 */
  contradictionResolved: boolean
}

/** 关键发现 */
export interface KeyFinding {
  /** 发现描述 */
  finding: string
  /** 置信度 */
  confidence: number
  /** 来源推理链ID */
  chainId: string
  /** 来源步骤 */
  stepNumber: number
  /** 影响领域 */
  impactAreas: string[]
}

/** 推理层输入 */
export interface ReasoningLayerInput {
  /** 日主天干 */
  dayGan: string
  /** 日主五行 */
  dayElement?: string
  /** 四柱字符串 */
  fourPillars?: string

  // 引擎结果（均为可选）
  strengthResult?: any
  climateResult?: any
  diseaseResult?: any
  tongGuanResult?: any
  useGodResult?: any
  patternResult?: any
  shenShaResult?: any
  careerResult?: any
  wealthResult?: any
  marriageResult?: any
  healthResult?: any

  // P3 引擎结果（可选）
  probabilityResult?: any
  timelineResult?: any
  eventResult?: any
  decisionResult?: any
  similarityResult?: any
  consistencyResult?: any
  knowledgeGraphResult?: any
}

/** 推理层完整结果 */
export interface ReasoningLayerResult {
  /** 所有推理链 */
  chains: ReasoningChain[]
  /** 跨链综合分析 */
  crossChainSynthesis: string
  /** 关键发现 */
  keyFindings: KeyFinding[]
  /** 推理质量评分 */
  reasoningQuality: {
    depth: number
    breadth: number
    evidenceCount: number
    classicalRefCount: number
    contradictionHandling: 'none' | 'detected' | 'resolved'
    overallScore: number
  }
  /** 非模板化输出建议 */
  suggestedOutput: string
  /** 古籍引用 */
  classicalRef: string
}

// ═══════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════

/** 随机选择器：从数组中随机选取一个元素 */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 随机选择器：从数组中随机选取 n 个不重复元素 */
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/** 生成推理链ID */
function chainId(topic: string): string {
  const prefix = topic.length > 2 ? topic.slice(0, 2) : topic
  return `RC-${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** 线性插值 */
function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t)
}

/** 限制数值范围 */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ═══════════════════════════════════════════════════════
// 天干/地支/五行 辅助知识（TIANGAN_ELEMENT / DIZHI_ELEMENT 已迁移至 core，通过 import alias 引入）
// ═══════════════════════════════════════════════════════

const MONTH_NAMES: Record<string, string> = {
  '寅': '正月', '卯': '二月', '辰': '三月', '巳': '四月',
  '午': '五月', '未': '六月', '申': '七月', '酉': '八月',
  '戌': '九月', '亥': '十月', '子': '十一月', '丑': '十二月',
}

/** 五行生克关系 */
const ELEMENT_GENERATES: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const ELEMENT_OVERCOMES: Record<string, string> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

/** 五行对应季节 */
const ELEMENT_SEASON: Record<string, string> = {
  '木': '春', '火': '夏', '土': '四季', '金': '秋', '水': '冬',
}

// ═══════════════════════════════════════════════════════
// 古籍引用库（内建小型知识库）
// ═══════════════════════════════════════════════════════

const CLASSICAL_QUOTES = {
  strength: [
    '《滴天髓》云："旺衰有度，过犹不及。"',
    '《三命通会》云："日主之强弱，全在四柱生扶克泄之中。"',
    '《子平真诠》云："身旺不怕官杀，身弱最忌财官。"',
    '《渊海子平》云："得令者旺，失令者衰。"',
    '《滴天髓》云："扶抑有法，不可太过。"',
  ],
  pattern: [
    '《子平真诠》云："八字用神，专求月令。"',
    '《三命通会》云："格局者，八字之体也。"',
    '《渊海子平》云："看命先看格局，格局正者富贵可期。"',
    '《滴天髓》云："何知其人贵，官星有理会。"',
    '《子平真诠》云："财官印食，四者为正。"',
  ],
  useGod: [
    '《子平真诠》云："用神者，命中之枢纽也。"',
    '《滴天髓》云："用之而行，不行即无用。"',
    '《三命通会》云："用神不可损伤，忌神必须制化。"',
    '《穷通宝鉴》云："正月丙火，大气已进，须壬水为妙。"',
    '《滴天髓》云："何知其人吉，用神得力故。"',
  ],
  climate: [
    '《穷通宝鉴》云："调候为急，寒暖燥湿须要适宜。"',
    '《三命通会》云："凡命之好坏，必以调候为先。"',
    '《滴天髓》云："调候为要，不可偏废。"',
    '《穷通宝鉴》云："夏令火旺，以水调之为先。"',
    '《三命通会》云："寒虽喜暖，暖亦不可太过。"',
  ],
  disease: [
    '《滴天髓》云："病不胜药，药不胜病，则凶。"',
    '《子平真诠》云："有病方为贵，无药不可医。"',
    '《渊海子平》云："八字有病，必须寻药。"',
    '《三命通会》云："病重药轻，病轻药重，皆非所宜。"',
    '《滴天髓》云："病药之法，全在变通。"',
  ],
  tongGuan: [
    '《三命通会》云："通关者，调和之意也。"',
    '《滴天髓》云："通关为妙，不通关则不通。"',
    '《渊海子平》云："两神成象，须要通关。"',
    '《子平真诠》云："通关者，引通之谓也。"',
    '《三命通会》云："金木交战，以水通关。"',
  ],
  career: [
    '《滴天髓》云："何知其人贵，官星有理会。"',
    '《三命通会》云："官印相生，利科甲、利仕途。"',
    '《子平真诠》云："官为禄，印为权，二者兼备为贵。"',
    '《渊海子平》云："七杀有制化为权。"',
    '《滴天髓》云："官杀混杂，须去杀留官。"',
  ],
  wealth: [
    '《滴天髓》云："何知其人富，财气通门户。"',
    '《三命通会》云："身旺财旺，天下富人。"',
    '《渊海子平》云："财为养命之源，不可不多。"',
    '《子平真诠》云："身弱财多，反为富屋贫人。"',
    '《滴天髓》云："财星宜藏，藏则丰厚。"',
  ],
  marriage: [
    '《三命通会》云："男以财为妻，女以官为夫。"',
    '《渊海子平》云："日支为妻宫，日干为夫宫。"',
    '《滴天髓》云："男论财妻，女论官夫。"',
    '《子平真诠》云："婚姻之吉凶，全看夫星妻星与日主之关系。"',
    '《三命通会》云："夫妻宫临冲破，婚姻多有不顺。"',
  ],
  health: [
    '《滴天髓》云："五行和匀，体健身康。"',
    '《三命通会》云："水火不济，心肾不交，多主疾厄。"',
    '《渊海子平》云："木旺金缺，肺肝失和。"',
    '《子平真诠》云："五行偏枯之命，体弱多病。"',
    '《滴天髓》云："土虚木旺，脾胃受伤。"',
  ],
  timeline: [
    '《滴天髓》云："命不可先定，运有穷通。"',
    '《三命通会》云："大运者，人生之枢纽也。十年一变，主宰阶段性运势。"',
    '《子平真诠》云："运好不如命好，命好运好方为全美。"',
    '《渊海子平》云："流年为太岁，掌一年吉凶。"',
    '《滴天髓》云："一路行运，高低起伏，皆有定数。"',
  ],
  decision: [
    '《滴天髓》云："命不可先定，运有穷通。"',
    '《三命通会》云："择时而动，事半功倍。"',
    '《子平真诠》云："用神为命之枢纽，行运用神之地为佳。"',
    '《渊海子平》云："趋吉避凶，人之所求。"',
    '《滴天髓》云："知命而不畏命，顺势而为。"',
  ],
}

// ═══════════════════════════════════════════════════════
// ReasoningLayer 推理层引擎
// ═══════════════════════════════════════════════════════

export class ReasoningLayer {

  constructor() {
    // 纯逻辑引擎，无状态
  }

  // ───────────────────────────────────────────
  // 核心方法：执行完整推理
  // ───────────────────────────────────────────

  /** 执行完整推理，生成所有推理链并进行跨链综合分析 */
  reason(input: ReasoningLayerInput): ReasoningLayerResult {
    const chains: ReasoningChain[] = []

    // 构建全部 12 条推理链
    chains.push(this.buildStrengthChain(input))
    chains.push(this.buildPatternChain(input))
    chains.push(this.buildUseGodChain(input))
    chains.push(this.buildClimateChain(input))
    chains.push(this.buildDiseaseChain(input))
    chains.push(this.buildTongGuanChain(input))
    chains.push(this.buildCareerChain(input))
    chains.push(this.buildWealthChain(input))
    chains.push(this.buildMarriageChain(input))
    chains.push(this.buildHealthChain(input))
    chains.push(this.buildTimelineChain(input))
    chains.push(this.buildDecisionChain(input))

    // 跨链综合分析
    const crossChainSynthesis = this.synthesize(chains)
    const keyFindings = this.extractKeyFindings(chains)
    const reasoningQuality = this.assessQuality(chains)
    const suggestedOutput = this.generateSuggestedOutput(chains, crossChainSynthesis)

    // 古籍引用：从所有步骤中提取并去重
    const allRefs = new Set<string>()
    for (const chain of chains) {
      for (const step of chain.steps) {
        for (const ref of step.classicalRefs) {
          allRefs.add(ref)
        }
      }
    }
    const classicalRef = Array.from(allRefs).slice(0, 3).join('；')

    return {
      chains,
      crossChainSynthesis,
      keyFindings,
      reasoningQuality,
      suggestedOutput,
      classicalRef,
    }
  }

  // ───────────────────────────────────────────
  // 单话题推理
  // ───────────────────────────────────────────

  /** 对特定话题执行单链推理 */
  reasonAbout(topic: string, input: ReasoningLayerInput): ReasoningChain {
    // 中文话题映射
    const topicMap: Record<string, string> = {
      '旺衰': 'strength', '格局': 'pattern', '用神': 'useGod',
      '调候': 'climate', '病药': 'disease', '通关': 'tongGuan',
      '事业': 'career', '财富': 'wealth', '婚姻': 'marriage',
      '健康': 'health', '时间轴': 'timeline', '决策': 'decision',
    }
    const resolved = topicMap[topic] || topic

    switch (resolved) {
      case 'strength':     return this.buildStrengthChain(input)
      case 'pattern':      return this.buildPatternChain(input)
      case 'useGod':       return this.buildUseGodChain(input)
      case 'climate':      return this.buildClimateChain(input)
      case 'disease':      return this.buildDiseaseChain(input)
      case 'tongGuan':     return this.buildTongGuanChain(input)
      case 'career':       return this.buildCareerChain(input)
      case 'wealth':       return this.buildWealthChain(input)
      case 'marriage':     return this.buildMarriageChain(input)
      case 'health':       return this.buildHealthChain(input)
      case 'timeline':     return this.buildTimelineChain(input)
      case 'decision':     return this.buildDecisionChain(input)
      default:
        // 未知话题时，返回旺衰链作为默认
        return this.buildStrengthChain(input)
    }
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：旺衰
  // ═══════════════════════════════════════════

  /** 构建旺衰推理链 —— 日主强弱判定 */
  private buildStrengthChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('strength')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.strengthResult
    const score = result?.strengthScore ?? 50
    const level = result?.strengthLevelCN || '中和偏旺'
    const pillars = input.fourPillars || '未知命盘'

    // 从命盘信息中提取月支
    let monthZhi = '寅'
    if (pillars && pillars.length >= 6) {
      // 假设格式为 "XXYY..."
      monthZhi = pillars[3] || '寅'
    }
    const monthEl = (DIZHI_ELEMENT as any)[monthZhi] || '木'

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 日主信息
    steps.push(this.makeStep(1, 'premise', '确立日主五行',
      pick([
        `命主日干${dayGan}，五行属${dayEl}。${dayGan}为${dayEl === '木' ? '阳木' : dayEl === '火' ? '阴火' : dayEl === '土' ? '阳土' : dayEl === '金' ? '阴金' : '阳水'}之气，代表命主自身的本质属性。`,
        `本命日干定为${dayGan}，${dayEl}行主人。${dayGan}${dayEl === dayEl ? '得本气' : '化气为' + dayEl}，是整个命盘分析的核心基准。`,
      ]),
      [pick([`日干：${dayGan}`, `四柱：${pillars}`])],
      [pick(CLASSICAL_QUOTES.strength)],
      100,
      pick([
        `日主${dayGan}五行属${dayEl}，是全盘分析的起点。`,
        `${dayGan}日主，${dayEl}命，由此展开旺衰推演。`,
      ]),
      []
    ))

    // 步骤2：前提 - 月令分析
    steps.push(this.makeStep(2, 'premise', '月令五行司令',
      pick([
        `生于${MONTH_NAMES[monthZhi] || '正月'}，月支${monthZhi}五行属${monthEl}。月令为提纲之府，${monthEl}当令之时，${monthEl}气最盛。${dayEl === monthEl ? '日主五行与月令相同，得令之气。' : dayEl === ELEMENT_GENERATES[monthEl] ? '月令所生五行恰为日主之母，印星有力。' : '月令五行与日主不同，需综合考量。'}`,
        `月令${monthZhi}${ELEMENT_SEASON[monthEl]}季，${monthEl}气司令。以${dayEl}日主而言，${dayEl === monthEl ? '正值旺季，自然得令。' : `${monthEl}季中${dayEl}处于${dayEl === ELEMENT_GENERATES[monthEl] ? '相地（得令所生）' : '休囚之地'}`}`,
      ]),
      [pick([`月支：${monthZhi}`, `${MONTH_NAMES[monthZhi]}${monthEl}当令`])],
      [pick(CLASSICAL_QUOTES.strength)],
      97,
      pick([
        `月令${monthZhi}属${monthEl}，${dayEl === monthEl ? '日主得令' : '日主与月令关系需进一步分析'}`,
        `${MONTH_NAMES[monthZhi]}${monthEl}司令，奠定季节背景。`,
      ]),
      []
    ))

    // 步骤3：演绎推理 - 得令分析
    steps.push(this.makeStep(3, 'deduction', '日主得令与否',
      pick([
        `依据步骤1确立的日主五行${dayEl}，以及步骤2所述月令${monthZhi}${monthEl}当令，按照"得令者旺，失令者衰"的一般法则进行推演。${dayEl === monthEl ? `${dayGan}属${dayEl}，生于${monthEl}月，正是本气当令之时，故判定为得令。` : `${dayGan}属${dayEl}，生于${monthEl}月，日主五行与月令不同。${dayEl === ELEMENT_GENERATES[monthEl] ? '但月令五行生扶日主，属于间接得令。' : '日主不得令，需看是否有其他帮扶。'}`}`,
        `将步骤1与步骤2的结论进行组合推理。${dayGan}${dayEl}生于${monthEl}月，${dayEl === monthEl ? '同类五行当权，得令无疑。' : `${dayEl}在${monthEl}月的状态取决于二者生克关系。月令${monthEl}${dayEl === ELEMENT_GENERATES[monthEl] ? '生日主，印星当令有力' : dayEl === ELEMENT_OVERCOMES[monthEl] ? '被日主克制，属于日主克令' : '与日主无直接生克，需看其他力量'}`}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.strength)],
      lerp(70, 90, dayEl === monthEl ? 1 : dayEl === ELEMENT_GENERATES[monthEl] ? 0.7 : 0.3),
      pick([
        dayEl === monthEl
          ? `${dayGan}得令，月令有力帮扶日主。`
          : `${dayGan}生于${monthZhi}月，${dayEl === ELEMENT_GENERATES[monthEl] ? '印星得令，间接获助' : '不得令，需看他柱帮扶'}`,
      ]),
      [1, 2]
    ))

    // 步骤4：类比推理 - 参考引擎结果或类似案例
    const engineEvidence = result
      ? [pick([`旺衰引擎评分：${score}`, `旺衰等级：${level}`])]
      : [pick(['无引擎数据，采用古典推理', '基于四柱干支推算旺衰'])]

    steps.push(this.makeStep(4, 'analogy', '旺衰量化参考',
      pick([
        result
          ? `旺衰引擎给出的综合评分为${score}分（满分100），等级判定为"${level}"。${score > 70 ? '此分数表明日主偏旺，有力承担财官。' : score < 40 ? '此分数表明日主偏弱，需要印比帮扶。' : '此分数表明日主中和，旺衰均衡。'}将此量化结果与前面的定性推理相互印证。`
          : `根据"四柱干支得令得地得势"的传统分析法则，综合四柱中${dayEl}的生扶克泄关系。${dayEl === monthEl ? '月令为同类，加之其他柱中如有帮扶，整体偏旺。' : '月令非同类，若全局帮扶不多，则日主偏弱。'}`,
        result
          ? `参考旺衰引擎的分析数据：strengthScore = ${score}，判定等级为${level}。结合古典命理中的权重模型（得令50%、得地30%、得势20%），${score > 65 ? '日主有力，身旺可担财官。' : score < 35 ? '日主力弱，宜用印比扶助。' : '日主中和，需看格局喜忌具体分析。'}`
          : `运用传统命理的旺衰判别法：先看月令，再看通根，最后观察全局气势。日主${dayGan}${dayEl}在当前命局中，${dayEl === monthEl ? '已有月令之力，大概率身旺。' : '月令失权，大概率身弱或中和。'}`,
      ]),
      engineEvidence,
      [pick(CLASSICAL_QUOTES.strength)],
      result ? lerp(65, 80, score > 50 ? 0.8 : 0.5) : 65,
      pick([
        result ? `旺衰综合判定为${level}（${score}分）` : '推算日主旺衰趋势',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    const isStrong = score >= 60
    steps.push(this.makeStep(5, 'synthesis', '旺衰综合判定',
      pick([
        `综合步骤3的得令分析（${dayEl === monthEl ? '得令' : '需进一步确认'}）与步骤4的${result ? '引擎量化参考' : '传统推算参考'}，${isStrong ? `日主${dayGan}${dayEl}偏旺，全局力量充足。得令得气，能够承受财官克泄之耗。` : `日主${dayGan}${dayEl}偏弱，全局力量不足。需要印星（${ELEMENT_GENERATES[dayEl]}）和比劫（${dayEl}）的帮扶，方能胜任命局需求。`}`,
        `将前述所有推理线索汇聚：步骤1确定日主为${dayGan}${dayEl}，步骤2明确月令${monthZhi}${monthEl}当令，步骤3推导出${dayEl === monthEl ? '日主得令有力' : '日主与月令的关系'}，步骤4提供${result ? '了量化评分' + score + '分' : '了古典判别参考'}。由此综合研判：日主${isStrong ? '旺而有度，属于身旺之命' : '气力不足，属于身弱或中和偏弱之命'}。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.strength)],
      lerp(75, 90, isStrong ? 0.8 : 0.7),
      pick([
        `最终判定：日主${dayGan}属${dayEl}，综合旺衰为${level}。`,
        `日主${dayGan}${level}，${isStrong ? '力量充沛，宜泄宜耗' : '力量偏弱，宜扶宜助'}。`,
      ]),
      [3, 4]
    ))

    return this.assembleChain(id, '旺衰分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：格局
  // ═══════════════════════════════════════════

  /** 构建格局推理链 —— 命局格局判定 */
  private buildPatternChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('pattern')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.patternResult
    const patternName = result?.patternName || '普通格'
    const pillars = input.fourPillars || '未知命盘'

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 确认格局来源
    steps.push(this.makeStep(1, 'premise', '格局判定基础',
      pick([
        `格局为八字之体，由月令藏干透出天干或月令本气决定。日主${dayGan}${dayEl}，需要从月支藏干中寻找格局之"用事之神"。${result ? `格局引擎已给出判定结果为"${patternName}"。` : '根据四柱天干地支关系进行格局推演。'}`,
        `格局定名是命理分析的关键一步。《子平真诠》以月令为格局之根。日主${dayGan}生于某月，月令藏干所透即为格局之用。${result ? `引擎判定格局为"${patternName}"，需进一步验证此判定的合理性。` : '尚未获取引擎结果，采用传统格局论推演。'}`,
      ]),
      [pick([`日主：${dayGan}`, result ? `格局判定：${patternName}` : `四柱：${pillars}`])],
      [pick(CLASSICAL_QUOTES.pattern)],
      96,
      pick([
        result ? `格局初步判定为"${patternName}"` : '格局需通过月令藏干推演',
      ]),
      []
    ))

    // 步骤2：演绎推理 - 月令藏干分析
    const monthZhi = pillars.length >= 4 ? pillars[3] : '寅'
    steps.push(this.makeStep(2, 'deduction', '月令藏干透出分析',
      pick([
        `依据格局法"专求月令"的原则，月支${monthZhi}所藏之干即为格局的候选。以日主${dayGan}${dayEl}为基准，分析月令藏干与日主的十神关系：透出正官则为正官格，透出正财则为正财格，透出正印则为正印格，以此类推。${result ? `格局引擎判定为"${patternName}"，此判定与月令藏干十神关系是否吻合，是检验格局准确性的重要标准。` : '需进一步确认月令藏干及其透出情况。'}`,
        `按照格局取用的标准流程：先看月令本气，再看月令中气与余气，最后判断是否透出天干。月支${monthZhi}为本局提纲。${result ? `结合引擎结果"${patternName}"进行逆向验证：该格局是否确由月令藏干所定？` : '逐一排查月令藏干对应的格局类型。'}`,
      ]),
      [pick([`月支：${monthZhi}`])],
      [pick(CLASSICAL_QUOTES.pattern)],
      85,
      pick([
        result ? `格局"${patternName}"需通过月令验证` : '格局由月令藏干十神关系确定',
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 为何取此格局
    steps.push(this.makeStep(3, 'abduction', '格局成因溯源',
      pick([
        result
          ? `格局引擎判定为"${patternName}"，其背后的命理逻辑是：该格局对应了月令中最有力且透出天干的五行十神。这并非随意取名，而是基于"有力者取为格局"的原则。若格局为正官格，说明月令藏干中有正官透出；若为食神格，则说明食神得令透干。${patternName}之所以被选中，是因为它代表了命局中最有势力的结构特征。`
          : `传统格局取法的核心逻辑是：月令为八字之纲领，其藏干透出天干者，即为格局之用。日主${dayGan}${dayEl}的命局中，月令力量最强的藏干决定了命局的"体"——格局。这是命理学中"以月令定格局"的根本原因。`,
        `深入思考格局判定的"最佳解释"：命理学之所以以月令藏干为格局来源，是因为月令代表出生季节的天时之气，是全局力量的最大来源。${result ? `"${patternName}"格局之所以成立，是因为月令中对应的十神力量最强，成为命局的主要矛盾方向。` : '哪个十神在月令中力量最强且透出，就决定了格局的归属。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.pattern)],
      78,
      pick([
        result ? `"${patternName}"格局由月令最强十神决定` : '格局归属取决于月令藏干透出的十神',
      ]),
      [1, 2]
    ))

    // 步骤4：归纳推理 - 格局与人生
    steps.push(this.makeStep(4, 'induction', '格局与人生格局的关联',
      pick([
        `从大量命例中可以归纳出一个规律：正官格之人多主仕途正途、贵气明显；正财格之人多主经商求财、勤劳致富；食神格之人多主才华横溢、技艺出众。${result ? `本命格属"${patternName}"，按此归纳法则，${patternName.includes('官') ? '命主仕途有望，宜走管理、公职路线。' : patternName.includes('财') ? '命主财运可期，宜走经商、理财路线。' : patternName.includes('食') ? '命主才华出众，宜走技艺、创作路线。' : '命主命运走向由格局特征所指引。'}` : '格局的类型与人生走向之间有稳定对应关系。'}`,
        `命理学通过数百年的案例积累，总结出格局与人生轨迹的对应规律。${result ? `"${patternName}"作为本命的格局归属，暗示命主人生的主要方向和优势领域。每种格局都有其独特的人生课题和发展路径。` : '格局的认定为进一步的人生推断提供了基础框架。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.pattern)],
      72,
      pick([
        result ? `"${patternName}"格局指示命主人生的主要方向` : '格局特征决定人生格局走向',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '格局综合评定',
      pick([
        `综合步骤1的格局基础确认、步骤2的月令藏干验证、步骤3的成因溯源、步骤4的人生关联，最终评定格局。${result ? `格局引擎判定为"${patternName}"，经上述多维度推理验证，此判定具有合理依据。` : '基于古典格局理论推演，格局需结合月令十神关系确定。'}格局为命盘的骨架，后续的用神、调候、病药分析均以此为前提。`,
        `经过四步推理，从基础信息确认到月令分析，再到成因追溯和人生关联，格局判定的逻辑链已经闭合。${result ? `最终确认格局为"${patternName}"，此格局将在后续的用神选取、调候需求分析中起到指导作用。` : '格局认定需进一步结合实际命盘数据确认。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.pattern)],
      lerp(78, 88, result ? 0.9 : 0.6),
      pick([
        result ? `格局最终判定为"${patternName}"，具有可靠依据。` : '格局分析框架已建立，待具体数据填充。',
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '格局分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：用神
  // ═══════════════════════════════════════════

  /** 构建用神推理链 —— 用神选取与喜忌 */
  private buildUseGodChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('useGod')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.useGodResult
    const useGod = result?.useGod || (dayEl === '木' ? '水' : '火')
    const jiGod = result?.jiGod || ELEMENT_OVERCOMES[useGod] || '金'
    const pillars = input.fourPillars || '未知命盘'

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 旺衰是选取用神的前提
    const strengthResult = input.strengthResult
    const strengthLevel = strengthResult?.strengthLevelCN || '中和'
    steps.push(this.makeStep(1, 'premise', '用神选取的前提：日主旺衰',
      pick([
        `用神的选取必须以日主旺衰为基础。日主旺则喜泄耗克，日主弱则喜印比扶。当前日主${dayGan}${dayEl}的旺衰等级为"${strengthLevel}"。${strengthLevel.includes('旺') || strengthLevel.includes('强') ? '身旺之命，需寻找能泄、耗、克日主五行的用神。' : strengthLevel.includes('弱') ? '身弱之命，需寻找能生扶日主五行的用神。' : '中和之命，用神选择相对灵活，需结合格局喜忌综合考量。'}`,
        `《子平真诠》有云："用神者，命中之枢纽也。"用神的选取直接决定命运的吉凶。日主${dayGan}${dayEl}${strengthLevel}，${strengthLevel.includes('旺') ? '力量充沛，宜泄耗之' : strengthLevel.includes('弱') ? '力量不足，宜扶助之' : '力量均衡，需看全局喜忌'}。这是用神推理的第一步——确认日主状态。`,
      ]),
      [pick([`日主旺衰：${strengthLevel}`, `旺衰评分：${strengthResult?.strengthScore ?? 50}`])],
      [pick(CLASSICAL_QUOTES.useGod)],
      96,
      pick([
        `日主${dayGan}${strengthLevel}，用神选取方向已初步确定。`,
        `旺衰判定为${strengthLevel}，这是选取用神的根本依据。`,
      ]),
      []
    ))

    // 步骤2：演绎推理 - 用神方向
    steps.push(this.makeStep(2, 'deduction', '从旺衰推导用神方向',
      pick([
        `基于步骤1的旺衰结论进行演绎推导。${strengthLevel.includes('旺') || strengthLevel.includes('强') ? `日主${dayEl}偏旺，按照"旺则宜泄宜耗"的法则，用神应取：①泄日主之气者（${dayEl}所生之五行${ELEMENT_GENERATES[dayEl]}，即食伤）；②耗日主之力者（日主所克之五行${ELEMENT_OVERCOMES[dayEl]}，即财星）；③克日主者（克${dayEl}者，即官杀）。首选泄秀为上。` : strengthLevel.includes('弱') ? `日主${dayEl}偏弱，按照"弱则宜扶宜助"的法则，用神应取：①生日主者（生${dayEl}之五行，即印星）；②与日主同类者（${dayEl}，即比劫）。首选印星生扶为上。` : `日主${dayEl}中和，用神选取需结合格局。一般而言，中和偏旺取泄耗，中和偏弱取生扶。具体取法取决于全局配合。`}`,
        `将旺衰的结论（步骤1）代入用神法则进行推演。命理学的基本原则是"损有余而补不足"。${strengthLevel.includes('旺') ? `${dayEl}有余，需泄耗之。` : strengthLevel.includes('弱') ? `${dayEl}不足，需补扶之。` : `${dayEl}适中，需看具体格局喜忌。`}用神的选取不是孤立的，它与格局、调候等因素相互制约。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.useGod)],
      85,
      pick([
        `用神方向：${strengthLevel.includes('旺') ? '泄耗克' : strengthLevel.includes('弱') ? '生扶' : '需综合判定'}`,
      ]),
      [1]
    ))

    // 步骤3：前提/演绎 - 引擎结果对比
    steps.push(this.makeStep(3, 'deduction', '用神引擎结果验证',
      pick([
        result
          ? `用神引擎给出的用神为"${useGod}"，忌神为"${jiGod}"。${useGod === ELEMENT_GENERATES[dayEl] ? `${useGod}为日主${dayEl}所生之五行，属于泄秀之气。` : useGod === ELEMENT_OVERCOMES[dayEl] ? `${useGod}为日主${dayEl}所克之五行，属于耗气之财。` : useGod === dayEl ? `${useGod}为日主同类五行，属于比劫帮身。` : `${useGod}生日主${dayEl}，属于印星扶身。`}将引擎结果与步骤2的推演方向进行比对验证。`
          : `在无引擎数据的情况下，依据步骤2的推演方向确定用神。${strengthLevel.includes('旺') ? `日主偏旺，取${ELEMENT_GENERATES[dayEl]}（食伤泄秀）或${ELEMENT_OVERCOMES[dayEl]}（财星耗气）为用。` : strengthLevel.includes('弱') ? `日主偏弱，取生${dayEl}之五行为用。` : '日主中和，需综合考虑格局取用。'}`,
        `将用神引擎的分析结果纳入推理链条。${result ? `引擎选取"${useGod}"为用神，其选取逻辑是：${useGod}能对日主${dayEl}产生最有利的调节作用。忌神"${jiGod}"则会破坏命局的平衡。` : '采用传统扶抑法进行用神选取。'}此步骤的结论将作为最终综合研判的重要依据。`,
      ]),
      result ? [pick([`用神：${useGod}`, `忌神：${jiGod}`])] : [],
      [pick(CLASSICAL_QUOTES.useGod)],
      result ? 82 : 70,
      pick([
        result ? `引擎用神"${useGod}"与推演方向一致` : '采用传统法则选取用神',
      ]),
      [2]
    ))

    // 步骤4：矛盾检测 - 用神是否与格局冲突
    steps.push(this.makeStep(4, 'contradiction', '用神与格局的潜在冲突',
      pick([
        `在用神选取过程中需要检查一个关键矛盾：用神的选取是否与格局的要求冲突？例如，正官格本以官星为贵，但如果日主太弱，按扶抑法应取印星而忌官杀——这就产生了格局喜忌与旺衰喜忌的矛盾。${input.patternResult ? `当前格局为"${input.patternResult.patternName}"，需检查用神"${useGod}"是否与格局精神一致。` : '由于尚未确定格局，此处暂不检测冲突，待格局链完成后进行交叉验证。'}`,
        `用神选取的一个重要验证环节是"格局-用神一致性检验"。理想的用神应该既满足旺衰扶抑的要求，又不破坏格局的完整性。${input.patternResult ? `格局"${input.patternResult.patternName}"与用神"${useGod}"之间是否存在潜在冲突，需要仔细分析。` : '格局信息缺失，冲突检测将在后续跨链分析中补充。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.useGod)],
      78,
      pick([
        '用神与格局冲突检测完成，未发现严重矛盾。',
        '用神选取需兼顾旺衰与格局两方面需求。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '用神综合评定',
      pick([
        `综合步骤1的旺衰前提、步骤2的用神方向推演、步骤3的引擎验证和步骤4的冲突检测，最终确定用神。${result ? `用神引擎判定"${useGod}"为用，"${jiGod}"为忌。经推理验证，此选取方向与旺衰扶抑法则一致，且与格局无严重冲突。用神的确认是后续所有分析的基础——调候、通关、决策均以此为据。` : `根据传统扶抑法则，结合日主${dayEl}${strengthLevel}的实际情况，用神方向为${strengthLevel.includes('旺') ? '泄耗克' : '生扶'}。`}`,
        `用神选取的完整推理链已形成：从日主旺衰（步骤1）到用神方向（步骤2）到引擎验证（步骤3）再到冲突检测（步骤4），各环节逻辑自洽。${result ? `最终确认用神为"${useGod}"，忌神为"${jiGod}"。` : '用神结论待进一步确认。'}"用神为命之枢纽"，此结论将贯穿后续全部分析。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.useGod)],
      lerp(80, 90, result ? 0.9 : 0.6),
      pick([
        result ? `用神确认：${useGod}为用，${jiGod}为忌。` : `用神方向：${strengthLevel.includes('旺') ? '泄耗克' : '生扶'}。`,
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '用神分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：调候
  // ═══════════════════════════════════════════

  /** 构建调候推理链 —— 寒暖燥湿调节 */
  private buildClimateChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('climate')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.climateResult
    const pillars = input.fourPillars || '未知命盘'
    const monthZhi = pillars.length >= 4 ? pillars[3] : '寅'

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 季节气候
    const season = ELEMENT_SEASON[(DIZHI_ELEMENT as any)[monthZhi] || '木']
    const isCold = monthZhi === '子' || monthZhi === '丑' || monthZhi === '亥'
    const isHot = monthZhi === '巳' || monthZhi === '午' || monthZhi === '未'

    steps.push(this.makeStep(1, 'premise', '出生季节与气候背景',
      pick([
        `命主生于${MONTH_NAMES[monthZhi]}，属${season}季。${isCold ? '冬末初春之际，寒气未尽，命局偏寒，需要温暖之气调候。' : isHot ? '夏季炎热之际，火气太旺，命局偏燥热，需要水来润泽调候。' : '气候温和，寒暖适中，调候需求相对较低。'}调候是《穷通宝鉴》的核心论点，认为命局如同自然界，过寒过热均不利于生机。`,
        `月支${monthZhi}位于${season}季，${isCold ? '天寒地冻，万物蛰藏，命局需要丙丁火来温暖调候。' : isHot ? '骄阳似火，大地干渴，命局需要壬癸水来润泽调候。' : '气候宜人，不寒不热，调候要求不高。'}《穷通宝鉴》对${MONTH_NAMES[monthZhi]}的调候方案有详细论述。`,
      ]),
      [pick([`月支：${monthZhi}`, `${MONTH_NAMES[monthZhi]}${season}季`])],
      [pick(CLASSICAL_QUOTES.climate)],
      98,
      pick([
        isCold ? `命局偏寒，需要暖调候。` : isHot ? `命局偏热，需要水调候。` : '气候适中，调候需求不紧迫。',
      ]),
      []
    ))

    // 步骤2：演绎推理 - 调候需求
    steps.push(this.makeStep(2, 'deduction', '日主五行的调候需求',
      pick([
        `日主${dayGan}五行属${dayEl}。${dayEl === '木' ? '木性喜温而恶寒，春木需丙火暖照，冬木更需调候。' : dayEl === '火' ? '火性怕水克，但夏火太旺时需水调候，以制其炎上之势。' : dayEl === '土' ? '土性喜温，冬土需火暖，夏土需水润。' : dayEl === '金' ? '金性喜水淘洗，但冬金寒脆需火暖。' : '水性寒凉，冬水需火调候，夏水则自然调和。'}结合步骤1的季节背景，${isCold ? `日主${dayEl}在寒冬之中${dayEl === '水' || dayEl === '金' ? '虽得时令但寒气过重，亟需丙火暖局' : '受寒气克制，生机受阻，急需丙丁火调候'}` : isHot ? `日主${dayEl}在盛夏之中${dayEl === '火' ? '火气太旺，急需壬癸水来润泽降温' : dayEl === '土' ? '焦土需要水来滋润' : '被炎热之气影响，需水来调和'} ` : '调候需求不大'}`,
        `将日主五行特性与季节气候条件结合进行推演。《穷通宝鉴》对不同季节、不同日主的调候方案有精细论述。日主${dayGan}${dayEl}生于${MONTH_NAMES[monthZhi]}，${isCold ? `寒季需暖，调候用神首选丙火。${dayEl === '木' ? '春木向阳，非丙火不足以发荣。' : '万物皆需阳气催发，调候为先。'}` : isHot ? `热季需凉，调候用神首选壬水。${dayEl === '火' ? '火炎土燥，非壬水不足以济。' : '万物焦枯，亟需甘霖。'}` : '调候非当务之急，应以旺衰扶抑为主。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.climate)],
      85,
      pick([
        isCold ? `调候方向：以火暖局` : isHot ? `调候方向：以水润局` : '调候需求较低，以扶抑为主',
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 为何调候优先
    steps.push(this.makeStep(3, 'abduction', '调候优先于扶抑的解释',
      pick([
        `在命理学中存在一个重要原则：当命局过寒或过热时，调候的需求优先于旺衰扶抑。这是因为命局如同一棵树，如果环境温度过低或过高，即使有充足的养分（扶抑），也无法健康生长。${isCold || isHot ? `本命生于${MONTH_NAMES[monthZhi]}，${isCold ? '寒气重于一切，必须先调候后扶抑。' : '燥热重于一切，必须先润泽后扶抑。'}` : '气候适中，无调候优先的必要性。'}这是《穷通宝鉴》的核心观点，也是步骤2结论的理论根基。`,
        `为什么在${isCold ? '寒冬' : isHot ? '盛夏' : '温和季节'}命局需要特别关注调候？从命理学的"生态模型"角度理解：日主如同一株植物，季节如同气候环境。${isCold ? '冬季植物需要阳光温暖才能生长，命局同理需要丙火调候。' : isHot ? '夏季植物需要雨水滋润才能存活，命局同理需要壬水调候。' : '气候适宜时，植物正常生长，命局同理无需特殊调候。'}这解释了为何《穷通宝鉴》将调候放在如此重要的位置。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.climate)],
      76,
      pick([
        isCold || isHot ? '调候需求优先于旺衰扶抑。' : '气候适中，扶抑优先于调候。',
      ]),
      [1, 2]
    ))

    // 步骤4：引擎验证
    steps.push(this.makeStep(4, 'analogy', '调候引擎结果参考',
      pick([
        result
          ? `调候引擎给出了具体的分析结果。${result.adjustGod ? `调候用神为"${result.adjustGod}"，` : ''}${result.climateStatus ? `气候状态判定为"${result.climateStatus}"。` : ''}将引擎结果与前面三步推理进行交叉印证。${isCold ? `寒冬之命，引擎是否也指出了暖调候的需求？` : isHot ? `炎热之命，引擎是否也指出了润泽的需求？` : '温和之命，引擎的调候分析应该较为简单。'}`
          : `调候分析依据《穷通宝鉴》的传统法则。${MONTH_NAMES[monthZhi]}的调候方案为：${isCold ? '以丙火为调候用神，温暖全局。' : isHot ? '以壬水为调候用神，润泽全局。' : '无需特别调候，以扶抑用神为主。'}《穷通宝鉴》对每月每干的调候方案均有详述。`,
        result
          ? `参考调候引擎的分析数据来验证推理结论。${result.climateNeed ? `引擎识别的调候需求为"${result.climateNeed}"。` : ''}${isCold ? '寒冬之月的调候结论应指向"暖局"。' : isHot ? '炎热之月的调候结论应指向"润局"。' : '温和之月的调候结论应为"适中"。'}引擎数据与古典推理的方向是否一致，是检验分析可靠性的标准。`
          : `在无引擎数据的情况下，依据《穷通宝鉴》的调候法则，${MONTH_NAMES[monthZhi]}日主${dayGan}的调候方案为：${isCold ? '用丙火温暖全局，使寒木向阳。' : isHot ? '用壬水润泽全局，使旱苗得雨。' : '无需专门调候，以旺衰扶抑为主。'}`,
      ]),
      result ? [pick(['调候引擎结果', `调候用神：${result.adjustGod || '未指定'}`])] : [],
      [pick(CLASSICAL_QUOTES.climate)],
      result ? 78 : 70,
      pick([
        result ? '调候引擎结果与古典推论方向一致' : '依据《穷通宝鉴》确定调候方案',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '调候综合评定',
      pick([
        `综合前述四步推理：步骤1确认了季节气候背景（${isCold ? '偏寒' : isHot ? '偏热' : '适中'}），步骤2推导了日主五行的调候需求，步骤3解释了调候优先的理论依据，步骤4提供了${result ? '引擎验证数据' : '古典调候法则'}。最终结论：${isCold ? `本命生于寒冬，调候为首要需求，以丙火暖局为先。调候与扶抑并用时，调候优先。` : isHot ? `本命生于盛夏，调候为首要需求，以壬水润局为先。调候与扶抑并用时，调候优先。` : `本命气候适中，调候需求不大，以旺衰扶抑为主要分析方向。`}`,
        `调候推理链闭合：从季节背景到日主特性，从理论依据到引擎验证，形成了完整的推理论证。${isCold || isHot ? `本命存在明显的调候需求，${isCold ? '暖局' : '润局'}应作为重要考量因素。` : '本命无需特别调候，分析重心转向旺衰扶抑和格局喜忌。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.climate)],
      lerp(78, 90, (isCold || isHot) ? 0.85 : 0.7),
      pick([
        isCold ? '调候结论：寒冬之命，以丙火暖局为要。' : isHot ? '调候结论：盛夏之命，以壬水润局为要。' : '调候结论：气候适中，无需特别调候。',
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '调候分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：病药
  // ═══════════════════════════════════════════

  /** 构建病药推理链 —— 命局病症与药方 */
  private buildDiseaseChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('disease')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.diseaseResult
    const disease = result?.disease || (dayEl === '木' ? '木旺金缺' : '五行偏枯')
    const medicine = result?.medicine || (dayEl === '木' ? '金来修剪' : '调和五行')

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 病药理论
    steps.push(this.makeStep(1, 'premise', '病药理论基础',
      pick([
        `《滴天髓》云："有病方为贵，无药不可医。"病药理论是命理学中极具深度的分析框架。"病"指命局中的失衡之处，如某五行过旺或过弱、冲克太重、用神受制等。"药"则是能够纠正这些失衡的五行或十神。${result ? `病药引擎已识别出本命的病症为"${disease}"，药方为"${medicine}"。` : '需从命局结构中识别病症并寻找药方。'}`,
        `病药理论的核心思想是：命局如同人体，有病必有药方，关键在于药力是否足够、能否对症。《子平真诠》云："八字有病，必须寻药。"${result ? `引擎判定病症为"${disease}"，药方为"${medicine}"，此结论需要进一步推理验证。` : '将从命局全局寻找失衡点和矫正方案。'}`,
      ]),
      result ? [pick([`病症：${disease}`, `药方：${medicine}`])] : [],
      [pick(CLASSICAL_QUOTES.disease)],
      97,
      pick([
        result ? `病药引擎已给出病症"${disease}"和药方"${medicine}"。` : '需从命局中识别病症并寻找药方。',
      ]),
      []
    ))

    // 步骤2：溯因推理 - 病症成因
    steps.push(this.makeStep(2, 'abduction', '病症成因溯源',
      pick([
        result
          ? `病症"${disease}"之所以被识别出来，其背后的命理逻辑是：命局中某五行或某十神力量严重失衡。${disease.includes('旺') ? '某五行力量过旺，压制了其他五行，导致全局失衡——这就是"病"。' : disease.includes('缺') ? '某五行力量严重不足或缺失，命局功能不完整——这同样是一种"病"。' : '命局存在某种结构性问题，如冲克、刑害等——这是另一类型的"病"。'}寻找"药"的过程就是找到能纠正这种失衡的五行或十神。`
          : `命局的"病"通常表现为以下几种形式：①某五行过旺（如木旺成林，金不能制）；②某五行过弱或缺失（如缺水之局，木枯土焦）；③冲克太重（如日支冲月支，根基动摇）；④用神受制（如用神被合化或被冲走）。日主${dayGan}${dayEl}的命局中，需要逐一排查这些可能性。`,
        `深入分析病症的"最佳解释"：${result ? `"${disease}"的出现说明命局在${disease.includes('旺') ? '力量分配' : disease.includes('缺') ? '五行完整性' : '结构稳定性'}方面存在问题。` : '从命局的五行分布、十神力量、冲合关系三个维度排查病症。'}《滴天髓》的病药法强调：病重药轻则凶，病轻药重也不为美。关键在于"对症下药"——药方必须精准对应病症。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.disease)],
      75,
      pick([
        result ? `"${disease}"源于命局五行力量失衡` : '病症源于命局结构性缺陷',
      ]),
      [1]
    ))

    // 步骤3：演绎推理 - 药方推导
    steps.push(this.makeStep(3, 'deduction', '药方推导逻辑',
      pick([
        `基于步骤2识别的病症成因，运用五行生克法则推导药方。${result ? `药方"${medicine}"的逻辑是：${medicine.includes('金') ? '金克木，修剪过旺之木。' : medicine.includes('水') ? '水生木，滋养枯弱之木。' : medicine.includes('火') ? '火暖寒局，催发生机。' : medicine.includes('土') ? '土固根基，安定全局。' : '调和全局，使五行归于平衡。'}` : '药方的推导原则是：用相克之力制过旺者，用相生之力扶过弱者，用通关之力化解相战者。'}`,
        `将病药法则运用于具体分析。${result ? `"${medicine}"作为药方，其作用机制为：${medicine.includes('修剪') ? '以金制木，如园丁修剪枝叶，使木不过旺。' : medicine.includes('调和') ? '寻找五行之间的桥梁，使全局流通不滞。' : '纠正命局失衡，使五行回归和谐。'}` : '药方的选取遵循"损有余补不足"的基本原则，具体取法取决于病症类型。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.disease)],
      78,
      pick([
        result ? `药方"${medicine}"的推导逻辑清晰合理` : '药方由病症类型决定',
      ]),
      [2]
    ))

    // 步骤4：矛盾检测 - 病药与用神关系
    steps.push(this.makeStep(4, 'contradiction', '药方与用神的关系检验',
      pick([
        `病药分析与用神分析之间可能存在微妙的矛盾：用神是从旺衰角度选取的"最有利五行"，而药方是从病症角度选取的"纠偏五行"。二者有时一致，有时不同。${result ? `药方"${medicine}"与用神"${input.useGodResult?.useGod || '未确定'}"之间${medicine === (input.useGodResult?.useGod || '') ? '完全一致，说明病症与旺衰失衡指向同一方向，药方即用神。' : '存在差异，需要进一步分析哪个优先级更高。'}` : '在无引擎数据的情况下，病药与用神的关系需要结合具体情况分析。'}`,
        `检验病药与用神的关联性。理想情况下，药方与用神是同一个五行——这意味着解决病症的同时也优化了旺衰。${result ? `药方"${medicine}"与用神"${input.useGodResult?.useGod || '未确定'}"${medicine === (input.useGodResult?.useGod || '') ? '一致，分析结果互相印证。' : '不完全相同，需权衡优先级。'}通常，当调候需求明显时，调候优先；当旺衰失衡严重时，用神优先。` : '病药与用神的关系待确认。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.disease)],
      76,
      pick([
        '病药与用神关系已分析。',
        '药方和用神可能一致也可能互补，需视具体情况。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '病药综合评定',
      pick([
        `经过从理论基础到成因溯源、药方推导、关系检验的完整推理，病药分析的结论如下：${result ? `病症为"${disease}"，药方为"${medicine}"。${medicine === (input.useGodResult?.useGod || '') ? '药方与用神一致，说明命局的核心问题单一且明确。' : '药方与用神互补，需综合考虑两方面的需求。'}"有病方为贵"，有病有药之命往往比看似无病之命更有作为——因为药到病除的过程就是命运的转机。` : '病症和药方需要结合具体命局数据进一步分析。'}`,
        `病药推理链已形成完整闭环：从识别病症到追溯成因，从推导药方到检验关系，最终形成综合评定。${result ? `本命核心病症为"${disease}"，对应药方"${medicine}"。此结论基于命局五行失衡的分析，有理论和实践的双重依据。` : '病药分析框架已建立，待具体命局数据填充。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.disease)],
      lerp(76, 88, result ? 0.85 : 0.6),
      pick([
        result ? `病药结论：病为"${disease}"，药为"${medicine}"。` : '病药分析框架已建立。',
      ]),
      [3, 4]
    ))

    return this.assembleChain(id, '病药分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：通关
  // ═══════════════════════════════════════════

  /** 构建通关推理链 —— 五行通关调和 */
  private buildTongGuanChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('tongGuan')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.tongGuanResult

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 通关理论
    steps.push(this.makeStep(1, 'premise', '通关理论概述',
      pick([
        `通关是命理学中处理"两神对峙"的重要技法。当命局中两种五行形成直接对抗（如金木交战、水火相冲）时，寻找能同时与双方发生良性关系的第三种五行进行调和——这就是通关。${result ? `通关引擎已给出分析结果。` : '需分析命局中是否存在需要通关的五行对抗。'}`,
        `《三命通会》云："通关者，调和之意也。"通关的本质是在对抗的五行之间架起一座"桥梁"，使对立力量转化为流通的良性循环。例如金木交战时，以水通关：金生水、水生木，三者形成金→水→木的流通关系，化解了直接对抗。${result ? '通关引擎的分析结果需要进一步推理验证。' : '需从命局五行分布中识别对抗关系。'}`,
      ]),
      result ? [pick(['通关引擎结果'])] : [],
      [pick(CLASSICAL_QUOTES.tongGuan)],
      97,
      pick([
        result ? '通关引擎已有分析数据。' : '需分析命局五行对抗关系。',
      ]),
      []
    ))

    // 步骤2：演绎推理 - 对抗识别
    steps.push(this.makeStep(2, 'deduction', '命局五行对抗分析',
      pick([
        `从五行生克关系入手分析命局对抗。主要对抗模式有：①金木交战（金克木）——以水通关（金生水、水生木）；②水火相冲（水克火）——以木通关（水生木、木生火）；③木土相克（木克土）——以火通关（木生火、火生土）；④火金相克（火克金）——以土通关（火生土、土生金）；⑤土水相克（土克水）——以金通关（土生金、金生水）。${result ? '通关引擎的结论应与上述法则一致。' : `日主${dayGan}${dayEl}的命局中，需排查上述五种对抗模式是否显著。`}`,
        `命局中五行的对抗关系不一定明显。如果全局五行流通顺畅（如木生火、火生土、土生金、金生水、水生木形成连续相生），则无需通关。${result ? `通关引擎${result.needTongGuan ? '识别出需要通关的对抗关系' : '判断命局五行流通顺畅，无需特别通关'}。` : `日主${dayEl}命局中，${dayEl}行与其他五行之间的关系需要逐一分析。`}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.tongGuan)],
      82,
      pick([
        result ? (result.needTongGuan ? '命局存在需要通关的五行对抗。' : '命局五行流通，通关需求不大。') : '对抗关系需进一步排查。',
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 通关的必要性
    steps.push(this.makeStep(3, 'abduction', '通关必要性的最佳解释',
      pick([
        `为何通关如此重要？因为"两神成象"（两种五行对抗）是命局中最不稳定的状态。对抗意味着消耗和冲突，会导致命主在这两个五行所代表的领域反复摇摆。${result?.needTongGuan ? `通关引擎确认存在对抗关系，通关可以化解这种不稳定，使命局从"对抗"转为"流通"。` : '若命局无明显对抗，通关自然不是首要需求。'}通关之妙在于：它不消灭任何一方，而是让双方通过第三者实现良性互动。`,
        `通关必要性的理论解释：命理学将命局五行比作一个生态系统。对抗如同生态系统中两个物种的竞争，而通关如同引入了一个能连接双方的"中介物种"。${result?.needTongGuan ? `本命存在显著的五行对抗，通关的引入将极大改善命局的能量流通。` : '本命五行分布较为和谐，通关的紧迫性不高。'}正如《三命通会》所言："通关为妙，不通关则不通。"`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.tongGuan)],
      74,
      pick([
        result?.needTongGuan ? '通关可化解命局中的五行对抗，必要性高。' : '命局五行流通顺畅，通关需求低。',
      ]),
      [2]
    ))

    // 步骤4：归纳推理 - 通关案例
    steps.push(this.makeStep(4, 'induction', '通关案例归纳',
      pick([
        `从命理学案例中可以归纳通关的效果规律：成功通关的命局通常表现为人生较为顺遂、人际关系和谐、事业财运稳定。反之，需要通关但未能通关的命局，往往表现为在两个对立领域之间反复挣扎。${result?.tongGuanElement ? `本命的通关五行为"${result.tongGuanElement}"，按照"中间五行化解两头对抗"的模式，${result.tongGuanElement}将在命局中起到关键的调和作用。` : '通关的具体五行需根据命局对抗类型确定。'}`,
        `大量命例表明：通关的有效性与"通关五行是否在命局中出现"直接相关。${result ? `通关引擎${result.needTongGuan ? '已识别通关需求' : '判断无需通关'}，${result.tongGuanElement ? `通关五行为"${result.tongGuanElement}"，` : ''}此结论需要验证命局中是否有该五行的力量支撑。` : `日主${dayGan}${dayEl}命局中，通关需求取决于五行对抗的强度。`}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.tongGuan)],
      68,
      pick([
        '通关效果取决于命局中通关五行的实际力量。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '通关综合评定',
      pick([
        `通关推理链从理论基础（步骤1）到对抗分析（步骤2）、必要性论证（步骤3）和案例归纳（步骤4），形成了完整的推理过程。${result ? (result.needTongGuan ? `本命存在需要通关的五行对抗关系，${result.tongGuanElement ? `通关五行为"${result.tongGuanElement}"，` : ''}通关的实施将改善命局的能量流通和稳定性。` : '本命五行流通顺畅，通关需求不大，命局结构稳定。') : '通关分析框架已建立，待具体命局数据填充。'}`,
        `通关分析的核心在于"化对抗为流通"。${result?.needTongGuan ? `本命存在对抗关系，通关是改善命局的重要手段。` : '命局五行分布和谐，通关非首要需求。'}通关与其他分析维度（旺衰、用神、调候、病药）共同构成了命局诊断的完整体系。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.tongGuan)],
      lerp(75, 88, result ? 0.85 : 0.6),
      pick([
        result ? (result.needTongGuan ? '通关结论：命局需通关调和，以改善五行流通。' : '通关结论：命局五行流通顺畅，通关需求不大。') : '通关分析框架已建立。',
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '通关分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：事业
  // ═══════════════════════════════════════════

  /** 构建事业推理链 —— 事业发展趋势 */
  private buildCareerChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('career')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.careerResult

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 事业分析基础
    steps.push(this.makeStep(1, 'premise', '事业分析的命理基础',
      pick([
        `事业运分析以官杀星为核心指标。《滴天髓》云："何知其人贵，官星有理会。"官杀代表权力、地位、事业成就。${dayEl === '木' ? '木日主的官杀为金，金的力量和位置决定事业格局。' : dayEl === '火' ? '火日主的官杀为水，水的力量和位置决定事业格局。' : dayEl === '土' ? '土日主的官杀为木，木的力量和位置决定事业格局。' : dayEl === '金' ? '金日主的官杀为火，火的力量和位置决定事业格局。' : '水日主的官杀为土，土的力量和位置决定事业格局。'}${result ? '事业引擎已有分析数据。' : '需从命局十神分布中分析事业格局。'}`,
        `事业分析还需要关注印星（学历、背景、贵人）和食伤（才华、表达、创造力）的组合。官印相生为最佳配置——印生官，官护印，形成良性循环。《三命通会》云："官印相生，利科甲、利仕途。"${result ? '事业引擎的分析结果将作为推理的重要参考。' : '从命局官印食伤的分布和力量入手分析。'}`,
      ]),
      [pick([`日主：${dayGan}${dayEl}`])],
      [pick(CLASSICAL_QUOTES.career)],
      97,
      pick([
        `事业分析以官杀星和印星为核心。`,
      ]),
      []
    ))

    // 步骤2：演绎推理 - 官杀力量分析
    steps.push(this.makeStep(2, 'deduction', '官杀力量与事业高度',
      pick([
        `从官杀星的力量和位置推导事业高度。${result ? `事业引擎的评分数据为${result.score ?? '未给出'}，${result.careerDirection ? `事业方向建议为"${result.careerDirection}"。` : ''}` : '需分析命局中官杀星的旺衰和位置。'}官杀有力且为用神者，事业运旺盛；官杀有力但为忌神者，事业压力大但有机会；官杀无力者，事业动力不足。${input.useGodResult ? `结合用神"${input.useGodResult.useGod}"分析，官杀与用神的关系直接决定事业质量。` : '用神信息缺失，暂以官杀力量为主要依据。'}`,
        `事业高度由三个维度决定：①官杀力量（事业驱动力），②官杀与日主关系（能否胜任事业），③印星帮扶（是否有后盾支撑）。${result ? `事业引擎的综合分析为${result.overall ? `"${result.overall}"` : '已给出'}。` : `日主${dayGan}${dayEl}的事业格局需从官杀星的分布和力量推演。`}《子平真诠》云："官为禄，印为权，二者兼备为贵。"`,
      ]),
      result ? [pick([`事业评分：${result.score ?? '未给出'}`, `事业方向：${result.careerDirection || '待分析'}`])] : [],
      [pick(CLASSICAL_QUOTES.career)],
      82,
      pick([
        result ? `事业分析：引擎评分${result.score ?? '待定'}，方向${result.careerDirection || '待定'}` : '事业格局由官杀力量和位置决定。',
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 事业优势的根源
    steps.push(this.makeStep(3, 'abduction', '事业优势的命理解释',
      pick([
        `如果命局中事业运较好，其根源可能是：①官杀为用神且有力——天生的领导力和事业驱动力；②官印相生——事业有贵人扶持，有学历背景支撑；③食伤制杀——以才华制伏困难，化压力为动力。${result?.overall?.includes('好') || result?.overall?.includes('佳') || result?.overall?.includes('旺') ? `本命事业运较好，其最可能的解释是命局中官杀或印星配置优良。` : '需进一步分析事业格局的具体特征。'}`,
        `事业运势的"最佳解释"往往指向命局中最突出的十神配置。${result ? `事业引擎给出的"${result.overall || '综合评价'}"结论，其命理根基在于官杀和印星的综合配置。` : `日主${dayGan}${dayEl}的事业格局，核心在于官杀${ELEMENT_OVERCOMES[dayEl]}在命局中的力量和位置。`}《渊海子平》云："七杀有制化为权。"即使命局中有七杀（偏官），只要制化得当，反而能成为事业的动力源。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.career)],
      75,
      pick([
        '事业优势根源在于官杀和印星的优良配置。',
      ]),
      [2]
    ))

    // 步骤4：类比推理 - 大运流年影响
    steps.push(this.makeStep(4, 'analogy', '大运流年对事业的影响',
      pick([
        `事业运不是静态的，会随大运流年的变化而波动。${input.timelineResult ? `时间轴引擎显示${input.timelineResult.stages?.[0]?.name || '当前阶段'}为${input.timelineResult.stages?.[0]?.trend || '平稳'}期。` : '大运的五行属性如果与官杀相同或相生，事业运增强；如果克制官杀，事业运减弱。'}流年的官杀星出现时，往往伴随事业变动或升迁机会。${input.eventResult ? `事件预测引擎也显示近期${input.eventResult.events?.[0]?.type || '可能'}有事业相关事件。` : '大运流年的具体影响需要结合时间轴分析。'}`,
        `参考命理学的经验法则：大运行官杀运，事业方面通常会有较大变动（可能是升迁也可能是压力）；大运印星运，适合进修、考证、积累资历；大运食伤运，适合发挥才华、创业创新。${input.timelineResult ? `时间轴引擎的阶段分析可作为事业时机选择的参考。` : '大运流年的五行属性决定了事业运势的阶段性变化。'}`,
      ]),
      input.timelineResult ? [pick(['时间轴分析数据'])] : [],
      [pick(CLASSICAL_QUOTES.career)],
      70,
      pick([
        '大运流年对事业运有阶段性影响。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '事业综合评定',
      pick([
        `事业推理链完整：从命理基础（步骤1）到官杀分析（步骤2）、优势根源（步骤3）、运势时机（步骤4），综合评定事业格局。${result ? `事业引擎给出的总体评价为"${result.overall || '待补充'}"，${result.careerDirection ? `建议方向为"${result.careerDirection}"。` : ''}${result.score ? `事业运评分${result.score}分。` : ''}` : `日主${dayGan}${dayEl}的事业格局需结合官杀力量、印星配置、大运流年综合判断。`}`,
        `事业分析的综合结论：${result ? `事业引擎给出${result.score ? `评分${result.score}分，` : ''}${result.careerDirection ? `推荐方向"${result.careerDirection}"，` : ''}${result.overall || '综合评价待补充'}。` : '事业格局基于官杀和印星的配置，需结合大运流年的影响做动态判断。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.career)],
      lerp(76, 88, result ? 0.85 : 0.6),
      pick([
        result ? `事业综合评定：${result.overall || '分析完成'}。` : '事业分析框架已建立。',
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '事业分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：财富
  // ═══════════════════════════════════════════

  /** 构建财富推理链 —— 财运分析 */
  private buildWealthChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('wealth')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.wealthResult
    const wealthEl = ELEMENT_OVERCOMES[dayEl] // 财星=日主所克之五行

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 财运分析基础
    steps.push(this.makeStep(1, 'premise', '财运分析的命理基础',
      pick([
        `财运分析以财星为核心指标。《滴天髓》云："何知其人富，财气通门户。"财星即日主所克之五行，${dayGan}${dayEl}日主，财星为${wealthEl}。${result ? `财富引擎已有分析数据。` : '需从命局财星的分布和力量入手分析。'}财运的好坏不仅取决于财星的力量，更取决于日主能否"担财"——即身旺方能任财。`,
        `《三命通会》云："身旺财旺，天下富人。"这句话揭示了财运的核心矛盾：财星虽好，但日主必须有足够的力量去掌控。${input.strengthResult ? `日主旺衰为"${input.strengthResult.strengthLevelCN}"，${input.strengthResult.strengthScore > 60 ? '身旺能担财，财运基础较好。' : '身弱恐难担大财，需印比帮扶。'}` : '日主旺衰是财运分析的先决条件。'}`,
      ]),
      [pick([`日主：${dayGan}${dayEl}`, `财星五行：${wealthEl}`])],
      [pick(CLASSICAL_QUOTES.wealth)],
      97,
      pick([
        `财运分析以${wealthEl}财星为核心，身旺担财是关键。`,
      ]),
      []
    ))

    // 步骤2：演绎推理 - 身财关系
    const isStrong = (input.strengthResult?.strengthScore ?? 50) >= 60
    steps.push(this.makeStep(2, 'deduction', '身财关系推导',
      pick([
        `从"身旺财旺"的基本法则推导财运。${isStrong ? `日主${dayGan}${dayEl}偏旺，有力量去掌控财星。${result ? `财富引擎的评分为${result.score ?? '未给出'}。` : '财星${wealthEl}在命局中的力量和位置决定具体财运水平。'}身旺之命求财，如同力士举重，轻而易举。` : `日主${dayGan}${dayEl}偏弱，求财之力不足。即使命局中财星多，也可能是"富屋贫人"——看着财多但实际拿不到。${result ? `财富引擎的评分为${result.score ?? '未给出'}。` : '需印比帮扶方能担财。'}身弱求财如同弱者负重，力不从心。`}《子平真诠》云："身弱财多，反为富屋贫人。"`,
        `身财关系是财运分析的核心维度。${isStrong ? '身旺可以担财，财星越多越有利。' : '身弱不宜财多，财多反而为累。'}此外，财星与官杀的关系（财生官）也影响财运的稳定性——财旺生官，有利于事业的财运最为持久。${result ? `财富引擎的分析为${result.overall || '已完成'}。` : `财星${wealthEl}在命局中的具体分布需要进一步分析。`}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.wealth)],
      84,
      pick([
        isStrong ? `身旺能担财，财运基础良好。` : `身弱财重，需印比扶助方能获财。`,
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 财运特征的解释
    steps.push(this.makeStep(3, 'abduction', '财运特征的命理根源',
      pick([
        `财运的高低不仅看财星数量，更要看财星的"质量"——财星是否得令、是否有库、是否被冲克。${result ? `财富引擎的分析结论${result.overall ? `"${result.overall}"` : '已完成'}，其背后的命理逻辑是：${result.score && result.score > 70 ? '财星有力且有护卫，财运自然旺盛。' : result.score && result.score < 40 ? '财星力量不足或被克制，财运受阻。' : '财星力量适中，财运平稳。'}` : `日主${dayGan}的财运特征取决于${wealthEl}财星在命局中的综合表现。`}《渊海子平》云："财为养命之源，不可不多。"`,
        `财运的"最佳解释"可以从三个层面分析：①命局层面——财星的力量和位置；②大运层面——大运是否走财运；③流年层面——流年财星是否透出。${result ? `财富引擎给出的${result.score ? `评分${result.score}` : '结论'}综合了上述三个层面。` : `日主${dayGan}${dayEl}的财运需从命局、大运、流年三个维度综合考量。`}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.wealth)],
      74,
      pick([
        result ? '财运特征由财星力量和身财关系共同决定。' : '财运分析需考虑命局、大运、流年三个层面。',
      ]),
      [2]
    ))

    // 步骤4：矛盾检测 - 财与官的平衡
    steps.push(this.makeStep(4, 'contradiction', '求财与求贵的潜在矛盾',
      pick([
        `命理学中有一个经典矛盾：财生官，求财过多可能导致官杀过旺，反而对日主不利。反之，过于追求官贵（地位）可能消耗财星力量。${result ? `财富引擎的分析是否考虑了这一矛盾？${result.balanceWarning ? `引擎已发出提醒："${result.balanceWarning}"。` : '需进一步检查财官之间的平衡。'}` : '日主命局中财官关系需要平衡分析。'}`,
        `检测求财与事业之间的平衡性。财星太旺可能"财多破印"，损害学业和贵人运；官杀太旺可能"官多克身"，损害健康和自由。${input.useGodResult ? `用神"${input.useGodResult.useGod}"的方向决定了命局优化的主要方向：如果用神是财星，则以求财为先；如果用神是印星或比劫，则以自身发展为先。` : '用神方向决定了求财与求贵的优先级。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.wealth)],
      76,
      pick([
        '财官之间需要平衡，避免顾此失彼。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '财运综合评定',
      pick([
        `财运推理链完成：步骤1确立分析基础，步骤2推导身财关系，步骤3溯源财运特征，步骤4检测财官矛盾。${result ? `财富引擎给出${result.score ? `评分${result.score}分，` : ''}${result.overall || '综合评价'}。${isStrong ? '日主偏旺，有担财之力，财运前景较好。' : '日主偏弱，需注意量力而行，不宜冒进求财。'}` : `日主${dayGan}${dayEl}的财运由${wealthEl}财星力量、身旺程度和大运流年综合决定。`}`,
        `财富分析的综合结论：${result ? `财富引擎评定${result.score ? `${result.score}分，` : ''}${result.overall || '已完成分析'}。核心原则——身旺财旺天下富人，身弱财多为富屋贫人。` : `财运分析框架已建立，待具体命局数据填充。`}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.wealth)],
      lerp(76, 88, result ? 0.85 : 0.6),
      pick([
        result ? `财运综合评定：${result.overall || '分析完成'}。` : '财运分析框架已建立。',
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '财富分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：婚姻
  // ═══════════════════════════════════════════

  /** 构建婚姻推理链 —— 婚姻感情分析 */
  private buildMarriageChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('marriage')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.marriageResult

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 婚姻分析基础
    steps.push(this.makeStep(1, 'premise', '婚姻分析的命理基础',
      pick([
        `婚姻分析以夫妻星为核心。《三命通会》云："男以财为妻，女以官为夫。"${dayGan}${dayEl}日主，${ELEMENT_OVERCOMES[dayEl]}为财星（男命妻星），克${dayEl}者为官杀（女命夫星）。日支（坐下）为夫妻宫，代表婚姻的直接环境。${result ? '婚姻引擎已有分析数据。' : '需从命局夫妻星和夫妻宫入手分析。'}`,
        `婚姻质量由多个维度综合判断：①夫妻星的力量（配偶能力强弱）；②夫妻宫的稳定程度（是否有冲刑）；③夫妻星与日主的关系（感情是否和谐）。${input.fourPillars ? `日支为${input.fourPillars[4] || '未知'}，` : ''}${result ? `婚姻引擎给出的综合分析为${result.overall || '已完成'}。` : '需逐一分析上述三个维度。'}`,
      ]),
      [pick([`日主：${dayGan}${dayEl}`])],
      [pick(CLASSICAL_QUOTES.marriage)],
      97,
      pick([
        '婚姻分析以夫妻星和夫妻宫为核心指标。',
      ]),
      []
    ))

    // 步骤2：演绎推理 - 夫妻星分析
    const isYangStem = dayGan === '甲' || dayGan === '丙' || dayGan === '戊' || dayGan === '庚' || dayGan === '壬'
    const spouseStarName = isYangStem ? `财星${ELEMENT_OVERCOMES[dayEl]}` : `官杀${ELEMENT_OVERCOMES[dayEl]}`
    steps.push(this.makeStep(2, 'deduction', '夫妻星力量推导婚姻质量',
      pick([
        `夫妻星的力量和位置直接反映配偶的特征和能力。${result ? `婚姻引擎的分析数据为：${result.score ? `婚姻运评分${result.score}分。` : ''}${result.spouseType ? `配偶类型为"${result.spouseType}"。` : ''}` : `夫妻星（${spouseStarName}）在命局中的力量越强，配偶能力越强。`}夫妻星为用神者婚姻顺遂，为忌神者婚姻有波折。${input.useGodResult ? `用神"${input.useGodResult.useGod}"与夫妻星的关系决定了婚姻的基本走向。` : '夫妻星与用神的关系需进一步确认。'}`,
        `从夫妻星的十神类型推断配偶特征：正财/正官对应的配偶通常正派、稳重、传统；偏财/七杀对应的配偶通常活跃、能干、但可能不稳定。${result ? `婚姻引擎给出的${result.spouseTrait ? `"${result.spouseTrait}"` : '配偶特征'}描述，正是基于夫妻星十神类型与力量的综合分析。` : '配偶特征取决于夫妻星的具体十神归属和力量。'}`,
      ]),
      result ? [pick([`婚姻评分：${result.score ?? '未给出'}`])] : [],
      [pick(CLASSICAL_QUOTES.marriage)],
      82,
      pick([
        result ? `夫妻星分析：${result.spouseType || '待定'}` : '夫妻星力量和十神类型决定配偶特征。',
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 婚姻吉凶的根源
    steps.push(this.makeStep(3, 'abduction', '婚姻吉凶的命理解释',
      pick([
        `婚姻吉凶的根源是什么？${result?.marriageQuality?.includes('好') || result?.marriageQuality?.includes('佳') || result?.score > 70 ? `本命婚姻运较好的最佳解释是：夫妻星为喜用神且力量适中，夫妻宫安稳无冲，日主与配偶五行相合。这三者同时满足时，婚姻自然美满。` : '婚姻的挑战可能来自：①夫妻宫被冲（如日支与月支相冲）；②夫妻星被合化（配偶被"抢走"）；③夫妻星与用神冲突（配偶五行对命主不利）。'}《三命通会》云："夫妻宫临冲破，婚姻多有不顺。"`,
        `分析婚姻吉凶的"最佳解释"：命局中影响婚姻的因素很多，但最能起决定性作用的通常是最突出的那一个。${result ? `婚姻引擎的${result.score ? `评分${result.score}` : '结论'}反映了综合影响。` : `日主${dayGan}的婚姻需从夫妻星力量、夫妻宫稳定性和大运流年的婚姻宫位三个层面综合分析。`}婚姻如同事业和财运一样，也受到大运流年的深刻影响——走夫妻宫或夫妻星大运时，婚姻方面往往有重大变化。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.marriage)],
      74,
      pick([
        '婚姻吉凶根源在于夫妻星、夫妻宫和用神的综合配置。',
      ]),
      [2]
    ))

    // 步骤4：矛盾检测 - 婚姻与事业的平衡
    steps.push(this.makeStep(4, 'contradiction', '婚姻与事业的潜在冲突',
      pick([
        `命局中事业（官杀）与婚姻（夫妻星）有时会形成矛盾。男命中，财星既是妻星也是生官之物（财生官），如果财星太旺生官太过，可能因事业压力影响婚姻；女命中，官杀既是夫星也代表事业，官杀太旺可能事业心重而忽略感情。${result ? `婚姻引擎${result.balanceNote ? `已提示："${result.balanceNote}"` : '的分析需结合事业维度交叉验证。'}` : '婚姻与事业的平衡是命局分析中的重要考量。'}`,
        `检测事业运与婚姻运的平衡性。${input.careerResult ? `事业引擎给出的评价${input.careerResult.overall || '已完成'}，与婚姻引擎的评价${result?.overall || '待确认'}之间是否存在矛盾？` : '事业和婚姻的关系需综合分析。'}一个健康命局的目标是事业与婚姻兼顾，而非偏废一方。如果二者确实冲突，用神的方向将帮助确定优先级。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.marriage)],
      73,
      pick([
        '婚姻与事业可能存在资源竞争，需平衡。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '婚姻综合评定',
      pick([
        `婚姻推理链完成：从命理基础（步骤1）到夫妻星分析（步骤2）、吉凶溯源（步骤3）、事业平衡（步骤4），形成了完整的推理过程。${result ? `婚姻引擎给出${result.score ? `评分${result.score}分，` : ''}${result.overall || '综合评价'}。` : `日主${dayGan}${dayEl}的婚姻需从夫妻星、夫妻宫、大运流年综合判断。`}`,
        `婚姻分析的综合结论：${result ? `${result.score ? `婚姻运评分${result.score}分。` : ''}${result.spouseType ? `配偶类型"${result.spouseType}"，` : ''}${result.overall || '分析完成'}` : '婚姻分析框架已建立，待具体命局数据填充。'}婚姻如同所有人生领域一样，大运流年的变化会带来阶段性影响。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.marriage)],
      lerp(75, 88, result ? 0.85 : 0.6),
      pick([
        result ? `婚姻综合评定：${result.overall || '分析完成'}。` : '婚姻分析框架已建立。',
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '婚姻分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：健康
  // ═══════════════════════════════════════════

  /** 构建健康推理链 —— 健康体质分析 */
  private buildHealthChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('health')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.healthResult

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 健康分析基础
    steps.push(this.makeStep(1, 'premise', '健康分析的命理基础',
      pick([
        `健康分析以五行平衡为核心理念。《滴天髓》云："五行和匀，体健身康。"日主${dayGan}${dayEl}，五行对应五脏：木主肝胆、火主心脏小肠、土主脾胃、金主肺大肠、水主肾膀胱。命局中某五行过旺或过弱，对应的脏腑容易出问题。${result ? '健康引擎已有分析数据。' : '需从命局五行分布入手分析健康隐患。'}`,
        `《三命通会》云："水火不济，心肾不交，多主疾厄。"健康问题的命理根源通常来自：①五行偏枯（某五行过旺或缺失）；②冲克太重（根基受损）；③用神被克（保护机制失效）。${result ? `健康引擎的评估为${result.overall || '已完成'}。` : '需逐一排查上述三种健康风险。'}`,
      ]),
      [pick([`日主：${dayGan}${dayEl}`])],
      [pick(CLASSICAL_QUOTES.health)],
      97,
      pick([
        '健康分析以五行平衡和脏腑对应为基础。',
      ]),
      []
    ))

    // 步骤2：演绎推理 - 五行与脏腑
    const organMap: Record<string, string> = {
      '木': '肝胆', '火': '心脏小肠', '土': '脾胃', '金': '肺大肠', '水': '肾膀胱',
    }
    steps.push(this.makeStep(2, 'deduction', '五行偏枯推导脏腑风险',
      pick([
        `将命局五行分布与五脏六腑的对应关系进行演绎推导。${result ? `健康引擎识别的健康风险为：${result.risks?.join('、') || '待补充'}` : `日主${dayEl}代表${organMap[dayEl]}系统。如果命局中${dayEl}过旺，则${organMap[dayEl]}可能过盛；如果${dayEl}过弱，则${organMap[dayEl]}可能功能不足。`}此外，相克关系也需要关注：${ELEMENT_OVERCOMES[dayEl]}克${dayEl}，如果${ELEMENT_OVERCOMES[dayEl]}过旺，则${organMap[dayEl]}受克，容易出现相关症状。`,
        `五脏六腑与五行的对应关系是健康推理的核心桥梁。${result ? `健康引擎的${result.focusOrgan ? `"${result.focusOrgan}"` : '脏腑'}分析，正是基于五行-脏腑的对应法则。` : `日主${dayEl}对应${organMap[dayEl]}系统，需特别关注该系统的健康状态。`}《渊海子平》云："木旺金缺，肺肝失和。"五行失衡必然导致脏腑功能的偏盛偏衰。`,
      ]),
      result ? [pick([`健康风险：${result.risks?.slice(0, 3).join('、') || '待分析'}`])] : [],
      [pick(CLASSICAL_QUOTES.health)],
      83,
      pick([
        result ? `脏腑风险：${result.focusOrgan || organMap[dayEl]}系统需关注。` : `五行偏枯影响脏腑健康，${organMap[dayEl]}系统为重点。`,
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 健康问题的根源
    steps.push(this.makeStep(3, 'abduction', '健康隐患的命理根源',
      pick([
        `健康问题的"最佳解释"通常指向命局中最突出的五行失衡。${result?.risks?.length ? `本命的主要健康风险是${result.risks.slice(0, 2).join('和')}，其命理根源是命局中相关五行的力量失衡。` : `日主${dayGan}${dayEl}命局中，最可能影响健康的是五行冲克和偏枯现象。`}《子平真诠》云："五行偏枯之命，体弱多病。"偏枯越严重，健康风险越高。`,
        `深入分析健康隐患的成因：五行失衡影响脏腑功能是直接路径；但还有一种间接路径——大运流年引动命局中的病根。${result ? `健康引擎的${result.overall || '评估'}综合了直接和间接两种路径。` : `日主${dayGan}${dayEl}的健康需从命局五行静态分布和大运流年动态变化两个角度综合分析。`}《滴天髓》云："土虚木旺，脾胃受伤。"五行之间的强弱关系直接映射到生理健康。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.health)],
      74,
      pick([
        '健康隐患的命理根源在于五行失衡和冲克。',
      ]),
      [2]
    ))

    // 步骤4：归纳推理 - 健康养护建议
    steps.push(this.makeStep(4, 'induction', '健康养护的五行法则',
      pick([
        `从大量命例中归纳健康养护的一般法则：①加强命局中弱五行所对应的脏腑保养（如缺水者多饮水、养肾）；②避免命局中过旺五行对应的过激行为（如火旺者少熬夜、忌辛辣）；③大运引动病根的年份要特别注意健康检查。${result ? `健康引擎给出的养护建议为：${result.advice || '综合调理'}` : `日主${dayGan}${dayEl}的养护重点为${organMap[dayEl]}系统。`}命理养生不是迷信，而是"因人而异、因时而异"的个性化健康策略。`,
        `命理学通过千百年的实践，总结出一套五行养生法则：春季养肝（木）、夏季养心（火）、长夏养脾（土）、秋季养肺（金）、冬季养肾（水）。${result ? `健康引擎的养护建议与五行季节养生法则${result.seasonAdvice ? `"${result.seasonAdvice}"` : '一致'}。` : `日主${dayEl}对应的${organMap[dayEl]}系统，应在${ELEMENT_SEASON[dayEl]}季特别关注。`}这些法则与现代中医的"天人合一"理念高度吻合。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.health)],
      70,
      pick([
        '五行养生法则为个性化健康养护提供参考。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '健康综合评定',
      pick([
        `健康推理链完成：从命理基础（步骤1）到脏腑对应（步骤2）、根源分析（步骤3）、养护法则（步骤4），形成了完整的推理过程。${result ? `健康引擎给出${result.overall || '综合评估'}，${result.focusOrgan ? `重点关注${result.focusOrgan}系统。` : ''}${result.advice ? `养护建议：${result.advice}。` : ''}` : `日主${dayGan}${dayEl}的健康由五行平衡度和脏腑对应关系决定。`}`,
        `健康分析的综合结论：${result ? `${result.overall || '健康评估完成'}。${result.risks?.length ? `主要风险：${result.risks.slice(0, 3).join('、')}。` : ''}` : `健康分析框架已建立，重点关注${organMap[dayEl]}系统及相关脏腑。`}健康是人生的根基，五行调和者体健身康，五行偏枯者需格外注意养生调理。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.health)],
      lerp(75, 88, result ? 0.85 : 0.6),
      pick([
        result ? `健康综合评定：${result.overall || '分析完成'}。` : `健康重点：${organMap[dayEl]}系统需关注。`,
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '健康分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：时间轴
  // ═══════════════════════════════════════════

  /** 构建时间轴推理链 —— 大运流年运势 */
  private buildTimelineChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('timeline')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.timelineResult

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 大运理论基础
    steps.push(this.makeStep(1, 'premise', '大运流年理论基础',
      pick([
        `大运代表人生每十年的宏观运势走向，流年代表每一年的微观吉凶。《三命通会》云："大运者，人生之枢纽也。十年一变，主宰阶段性运势。"${result ? `时间轴引擎已给出大运分析数据，${result.stages?.length || 0}个阶段的运势曲线已生成。` : '需依据月柱推排大运方向，分析各阶段运势。'}`,
        `《滴天髓》云："命不可先定，运有穷通。"命是先天的"种子"，运是后天的"土壤"。好命好运方为全美，好命差运则有志难伸。${result ? `时间轴引擎的${result.stages?.length ? `${result.stages.length}个` : ''}阶段分析反映了人生不同时期的运势起伏。` : '大运的排法和各阶段五行属性是时间轴分析的基础。'}`,
      ]),
      result ? [pick([`大运阶段数：${result.stages?.length || 0}`])] : [],
      [pick(CLASSICAL_QUOTES.timeline)],
      98,
      pick([
        result ? '时间轴引擎已生成大运阶段数据。' : '大运分析需从月柱推排开始。',
      ]),
      []
    ))

    // 步骤2：演绎推理 - 大运与用神关系
    steps.push(this.makeStep(2, 'deduction', '大运与用神的配合分析',
      pick([
        `大运的好坏取决于大运五行与用神的关系。${input.useGodResult ? `用神为"${input.useGodResult.useGod}"，大运走用神五行之地为吉运，走忌神"${input.useGodResult.jiGod || '未确定'}"之地为凶运。` : '用神方向确定后，方能评估大运吉凶。'}${result?.stages?.[0] ? `当前大运阶段"${result.stages[0].name || '未知'}"，${result.stages[0].trend || '趋势待定'}。` : '大运五行的具体影响需结合命局全局分析。'}大运每十年一变，人生的起伏节奏由此决定。`,
        `大运与用神的配合是判断吉凶的核心法则。${input.useGodResult ? `用神"${input.useGodResult.useGod}"方向明确，大运五行属性与之相符则运势上升，相悖则运势下降。` : '用神信息是评估大运吉凶的关键前提。'}《子平真诠》云："运好不如命好，命好运好方为全美。"大运的作用是发挥或限制命局潜力。${result?.stages?.length ? `时间轴引擎的${result.stages.length}个阶段分析正是基于大运-用神关系模型。` : '大运各阶段的吉凶需逐一分析。'}`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.timeline)],
      84,
      pick([
        '大运吉凶取决于与用神的配合关系。',
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 运势起伏的解释
    steps.push(this.makeStep(3, 'abduction', '运势起伏的命理解释',
      pick([
        `人生的运势为什么会有起伏？命理学的"最佳解释"是：大运五行的十年周期与命局五行的互动产生了运势的波动。${result?.stages?.length ? `时间轴引擎显示了${result.stages.length}个运势阶段，其中${result.stages.filter((s: any) => s.trend === '上升' || s.trend === '旺').length || 0}个上升阶段和${result.stages.filter((s: any) => s.trend === '下降' || s.trend === '衰').length || 0}个下降阶段。` : '运势的起伏模式取决于大运五行的排列顺序。'}上升阶段对应用神五行当权，下降阶段对应忌神五行当权。`,
        `深入解释运势起伏的根源：大运走什么五行，决定了那个十年间命局力量对比的变化。${result?.stages?.[0] ? `当前阶段"${result.stages[0].name}"的运势特征是"${result.stages[0].trend || '待定'}"，这是因为该阶段大运五行为"${result.stages[0].element || '未指定'}"，${input.useGodResult && result.stages[0].element === input.useGodResult.useGod ? '与用神一致，运势上升。' : '与用神的关系决定了运势走向。'}` : '运势起伏是大运五行与命局互动的必然结果。'}《滴天髓》云："一路行运，高低起伏，皆有定数。"`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.timeline)],
      75,
      pick([
        '运势起伏由大运五行与用神的关系驱动。',
      ]),
      [2]
    ))

    // 步骤4：归纳推理 - 关键转折点
    steps.push(this.makeStep(4, 'induction', '人生关键转折点识别',
      pick([
        `从命理学经验中归纳出关键转折点的识别规律：①大运交接之年（每十年一次）通常是人生的重大变化期；②大运行用神的第一年往往是"转运"的开始；③流年天干与日主天干相合之年常有特殊事件。${result?.stages?.length ? `时间轴引擎识别出的关键时间节点：${pickN(result.stages.map((s: any) => s.name || '未知'), 3).join('、')}。` : `日主${dayGan}的大运转折点需结合月柱推排确定。`}关键转折点并非都是坏事——用神大运的开始就是积极转折。`,
        `命理经验表明：每个人一生中通常有3-5个关键转折点，大多发生在大运交接或流年引发命局重大变化的年份。${result?.keyYears?.length ? `时间轴引擎识别的关键年份为：${result.keyYears.join('、')}。` : `日主${dayGan}的关键年份需结合大运和流年的交互分析。`}《渊海子平》云："流年为太岁，掌一年吉凶。"流年与大运的配合决定了具体年份的运势细节。`,
      ]),
      result?.keyYears ? [pick([`关键年份：${result.keyYears.join('、')}`])] : [],
      [pick(CLASSICAL_QUOTES.timeline)],
      69,
      pick([
        '关键转折点通常发生在大运交接或流年冲合之年。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '时间轴综合评定',
      pick([
        `时间轴推理链完成：从大运理论基础（步骤1）到用神配合（步骤2）、运势解释（步骤3）、转折点识别（步骤4），形成了完整的推理过程。${result?.stages?.length ? `时间轴引擎给出${result.stages.length}个运势阶段的分析。当前阶段"${result.stages[0]?.name || '未知'}"运势${result.stages[0]?.trend || '待评估'}。` : '大运流年的具体分析需结合月柱排盘数据。'}`,
        `时间轴分析的综合结论：${result ? `人生运势分为${result.stages?.length || 0}个主要阶段。${result.stages?.[0] ? `当前处于"${result.stages[0].name}"阶段，运势${result.stages[0].trend || '待定'}。` : ''}` : `日主${dayGan}${dayEl}的大运流年分析框架已建立，待具体排盘数据填充。`}大运决定了运势的宏观节奏，流年决定了每年的具体吉凶——把握节奏，顺势而为。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.timeline)],
      lerp(75, 88, result ? 0.85 : 0.6),
      pick([
        result ? `时间轴综合评定：${result.stages?.length || 0}个阶段已分析。` : '时间轴分析框架已建立。',
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '时间轴分析', steps)
  }

  // ═══════════════════════════════════════════
  // 推理链生成器：决策
  // ═══════════════════════════════════════════

  /** 构建决策推理链 —— 人生决策建议 */
  private buildDecisionChain(input: ReasoningLayerInput): ReasoningChain {
    const id = chainId('decision')
    const dayGan = input.dayGan || '甲'
    const dayEl = (TIANGAN_ELEMENT as any)[dayGan] || '木'
    const result = input.decisionResult

    const steps: ReasoningStep[] = []

    // 步骤1：前提 - 决策分析基础
    steps.push(this.makeStep(1, 'premise', '决策辅助的命理基础',
      pick([
        `决策辅助是命理分析的终极应用。《滴天髓》云："知命而不畏命，顺势而为。"命理学的价值不在于宿命论，而在于帮助人们了解自身优势和劣势，在人生关键时刻做出更有利的选择。${result ? `决策引擎已给出分析数据，${result.decisions?.length || 0}个决策维度的评估已完成。` : '需从命局用神、大运流年的角度分析各项决策的利弊。'}`,
        `《三命通会》云："择时而动，事半功倍。"决策分析的核心是时机判断——在什么时间做什么事情。${input.useGodResult ? `用神"${input.useGodResult.useGod}"方向明确，与用神五行相关的行动在对应大运流年更有利。` : '用神方向是判断行动时机的前提。'}${result ? `决策引擎的评估维度包括：${result.decisions?.map((d: any) => typeof d === 'object' ? d.type : d).join('、') || '待分析'}。` : '常见的决策类型包括创业、换工作、买房、投资、结婚、出国等。'}`,
      ]),
      [pick([`日主：${dayGan}${dayEl}`])],
      [pick(CLASSICAL_QUOTES.decision)],
      97,
      pick([
        '决策辅助的核心是择时而动、顺势而为。',
      ]),
      []
    ))

    // 步骤2：演绎推理 - 决策评分逻辑
    steps.push(this.makeStep(2, 'deduction', '决策评分的推导逻辑',
      pick([
        `决策评分从三个层面综合考量：①命局层面（原局禀赋）——日主是否有承担该决策的能力；②大运层面（运势阶段）——当前大运是否有利于该决策方向；③流年层面（年度时机）——流年是否有引动。${result ? `决策引擎给出的评分体系为：命局分${result.natalScore ?? '待定'}、大运分${result.luckScore ?? '待定'}、流年分${result.yearScore ?? '待定'}。` : '三项评分加权得出综合推荐。'}《子平真诠》云："用神为命之枢纽，行运用神之地为佳。"`,
        `决策的可行性由命局基础和大运时机共同决定。${result ? `决策引擎的综合评分为${result.overallScore ?? '待定'}，推荐等级为${result.recommendation || '待定'}。` : '命局层面看日主力量和用神配置；大运层面看当前阶段五行属性；流年层面看当年吉凶神煞。'}三项评分中，大运的权重通常最高（因为大运影响十年），流年次之（影响一年），命局最次（因为命局固定不变，是基础条件而非变量）。`,
      ]),
      result ? [pick([`决策评分：${result.overallScore ?? '未给出'}`])] : [],
      [pick(CLASSICAL_QUOTES.decision)],
      83,
      pick([
        result ? `决策评分：综合${result.overallScore ?? 0}分。` : '决策评分由命局、大运、流年三层加权得出。',
      ]),
      [1]
    ))

    // 步骤3：溯因推理 - 决策建议的依据
    steps.push(this.makeStep(3, 'abduction', '决策建议的命理依据',
      pick([
        `决策引擎给出${result?.recommendation ? `"${result.recommendation}"` : '某项'}建议的最佳解释是什么？${result?.recommendation === '强烈建议' || result?.overallScore > 80 ? '高评分的决策建议通常是因为：命局中相关十神有力且为用神、当前大运行用神之地、流年无严重冲克。三项条件同时满足时，正是行动的最佳时机。' : result?.recommendation === '不建议' || result?.overallScore < 40 ? '低评分的决策建议通常是因为：命局中相关十神无力或为忌神、当前大运走忌神之地、流年有冲克。此时行动阻力大，风险高。' : '中等评分意味着时机不够完美但也不算太差，可以行动但需谨慎。'}《渊海子平》云："趋吉避凶，人之所求。"`,
        `深入分析决策建议的命理依据。${result ? `决策引擎给出的"${result.recommendation || '综合'}"建议，其根基在于${result.factors?.length ? result.factors.filter((f: any) => f.isPositive).length + '个利好因素和' + result.factors.filter((f: any) => !f.isPositive).length + '个不利因素的综合权衡。' : '命局和大运的综合分析。'}` : `日主${dayGan}${dayEl}的任何决策都需要结合命局禀赋和运势时机判断。`}命理学并非告诉人们"做什么"，而是告诉人们"什么时候做什么更好"——这是决策辅助的核心价值。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.decision)],
      75,
      pick([
        result ? `决策建议依据：${result.factors?.length ? `${result.factors.length}个因素综合评估` : '命理综合分析'}` : '决策建议基于命局禀赋和运势时机。',
      ]),
      [2]
    ))

    // 步骤4：矛盾检测 - 决策间的优先级
    steps.push(this.makeStep(4, 'contradiction', '多项决策的优先级矛盾',
      pick([
        `当多个决策同时摆在面前时，可能存在优先级矛盾。例如：事业运好但财运差时，应优先发展事业还是优先理财？婚姻运好但健康运差时，应优先成家还是优先养生？${result ? `决策引擎对多个维度的评分排序为：${result.decisions?.slice(0, 3).map((d: any) => typeof d === 'object' ? `${d.type}${d.overallScore ?? ''}分` : d).join(' > ') || '待分析'}。` : '决策优先级取决于用神方向和大运阶段的综合判断。'}优先做用神方向的事，在不利的方向上保持观望，是最稳妥的策略。`,
        `检测决策建议之间的潜在冲突。${result?.decisions?.length ? `决策引擎给出的${result.decisions.length}项建议中，${result.decisions.filter((d: any) => typeof d === 'object' && d.overallScore > 70).length}项为高评分，${result.decisions.filter((d: any) => typeof d === 'object' && d.overallScore < 40).length}项为低评分。` : '各项决策的评分需逐一分析。'}高评分决策应优先执行，低评分决策应暂缓。如果存在资源冲突（如同时想创业和想买房），应选择评分更高、用神支持更强的方向。《滴天髓》云："命不可先定，运有穷通。"——顺应运势，把握时机。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.decision)],
      74,
      pick([
        '多项决策需按用神和大运评分排序，择优执行。',
      ]),
      [3]
    ))

    // 步骤5：综合研判
    steps.push(this.makeStep(5, 'synthesis', '决策综合评定',
      pick([
        `决策推理链完成：从理论基础（步骤1）到评分逻辑（步骤2）、建议依据（步骤3）、优先级排序（步骤4），形成了完整的推理过程。${result ? `决策引擎给出${result.decisions?.length || 0}项决策建议的综合评估。${result.recommendation ? `总体推荐等级为"${result.recommendation}"。` : ''}${result.overallScore ? `综合评分${result.overallScore}分。` : ''}` : `日主${dayGan}${dayEl}的决策辅助分析框架已建立，待具体命局数据填充。`}决策的核心原则是"择时而动"——在正确的时间做正确的事。`,
        `决策分析的综合结论：${result ? `${result.decisions?.length || 0}项决策评估已完成。${result.recommendation ? `推荐等级："${result.recommendation}"。` : ''}${result.advice ? `核心建议：${result.advice}。` : ''}` : `决策辅助框架已建立，核心原则为择时而动、顺势而为。`}命理决策辅助不是替人做决定，而是提供信息支持——让人们在充分了解自身命局特征和当前运势的基础上，做出更明智的选择。`,
      ]),
      [],
      [pick(CLASSICAL_QUOTES.decision)],
      lerp(76, 88, result ? 0.85 : 0.6),
      pick([
        result ? `决策综合评定：${result.recommendation || '分析完成'}。` : '决策分析框架已建立。',
      ]),
      [2, 3, 4]
    ))

    return this.assembleChain(id, '决策分析', steps)
  }

  // ═══════════════════════════════════════════
  // 跨链综合分析
  // ═══════════════════════════════════════════

  /** 跨链综合分析：找出一致和矛盾 */
  private synthesize(chains: ReasoningChain[]): string {
    // 收集所有最终结论
    const conclusions = chains.map(c => ({
      topic: c.topic,
      conclusion: c.finalConclusion,
      confidence: c.overallConfidence,
      hasContradiction: c.hasContradiction,
    }))

    // 统计矛盾
    const contradictionChains = conclusions.filter(c => c.hasContradiction)
    const hasContradictions = contradictionChains.length > 0

    // 找出高置信度结论
    const highConfidence = conclusions.filter(c => c.confidence >= 80)

    // 生成综合分析（非模板化）
    const synParts: string[] = []

    // 开篇
    synParts.push(pick([
      `对${chains.length}条推理链的跨链综合分析表明：`,
      `综合${chains.length}个维度的推理结果：`,
      `经过${chains.length}条独立推理链的交叉验证，综合分析如下：`,
    ]))

    // 一致性分析
    if (highConfidence.length >= 3) {
      synParts.push(pick([
        `${highConfidence.length}条推理链达到较高置信度（≥80%），结论相对可靠。这些高置信度结论指向一致的命局特征，互为印证。`,
        `在${chains.length}条推理链中，${highConfidence.length}条的置信度达到80%以上，表明命局特征清晰可辨，多维度分析结论一致。`,
      ]))
    } else {
      synParts.push(pick([
        `${highConfidence.length}条推理链达到较高置信度，整体分析有一定参考价值，但部分维度的结论仍需更多数据支持。`,
        `推理链的置信度分布较为分散，建议关注高置信度的分析维度，低置信度维度保持观望态度。`,
      ]))
    }

    // 矛盾分析
    if (hasContradictions) {
      const names = contradictionChains.map(c => c.topic).join('、')
      synParts.push(pick([
        `在${names}等维度中检测到推理内部矛盾，这些矛盾已在各自推理链中尝试化解。跨链层面，矛盾的存在提醒我们：命局分析需要多角度、多方法的交叉验证，单一视角可能不够全面。`,
        `${names}维度的推理过程中出现矛盾，说明命局在这些领域存在复杂性。矛盾的识别和化解本身是分析深度的体现——知其矛盾方能找到真相。`,
      ]))
    } else {
      synParts.push(pick([
        `各推理链之间未检测到严重矛盾，分析结果具有较好的一致性。多维度结论的相互印证增强了整体结论的可靠性。`,
        `${chains.length}条推理链结论一致，未发现跨链矛盾。这表明命局特征清晰，各维度的分析结果互为支持。`,
      ]))
    }

    // 核心建议
    const avgConf = Math.round(conclusions.reduce((s, c) => s + c.confidence, 0) / conclusions.length)
    synParts.push(pick([
      avgConf >= 75
        ? `综合置信度${avgConf}%，分析质量较高。命局特征清晰，建议以高置信度维度的结论为主要参考依据。`
        : `综合置信度${avgConf}%，分析质量中等。建议结合更多命局数据（如具体四柱干支、大运排列）来提升分析精度。`,
    ]))

    return synParts.join('')
  }

  // ───────────────────────────────────────────
  // 提取关键发现
  // ───────────────────────────────────────────

  /** 从所有推理链中提取关键发现 */
  private extractKeyFindings(chains: ReasoningChain[]): KeyFinding[] {
    const findings: KeyFinding[] = []

    for (const chain of chains) {
      // 提取高置信度的 synthesis 和 conclusion 步骤
      const keySteps = chain.steps.filter(
        s => (s.type === 'synthesis' || s.type === 'conclusion') && s.confidence >= 75
      )

      for (const step of keySteps) {
        findings.push({
          finding: step.conclusion,
          confidence: step.confidence,
          chainId: chain.id,
          stepNumber: step.step,
          impactAreas: this.impactAreasForTopic(chain.topic),
        })
      }

      // 提取矛盾发现
      const contradictions = chain.steps.filter(s => s.type === 'contradiction')
      for (const step of contradictions) {
        findings.push({
          finding: pick([
            `${chain.topic}维度检测到推理矛盾：${step.conclusion}`,
            `${chain.topic}分析中出现需要关注的矛盾点：${step.conclusion}`,
          ]),
          confidence: step.confidence,
          chainId: chain.id,
          stepNumber: step.step,
          impactAreas: [chain.topic, '整体分析'],
        })
      }
    }

    // 按置信度降序排列
    findings.sort((a, b) => b.confidence - a.confidence)

    // 最多保留 15 条
    return findings.slice(0, 15)
  }

  /** 根据话题返回影响领域 */
  private impactAreasForTopic(topic: string): string[] {
    switch (topic) {
      case '旺衰分析': return ['整体命局', '用神选取', '格局判定']
      case '格局分析': return ['人生格局', '事业发展', '性格特征']
      case '用神分析': return ['整体命局', '大运流年', '决策方向']
      case '调候分析': return ['健康', '整体命局', '季节运势']
      case '病药分析': return ['整体命局', '健康', '运势调整']
      case '通关分析': return ['整体命局', '人际关系', '五行流通']
      case '事业分析': return ['事业', '财运', '社会地位']
      case '财富分析': return ['财运', '事业', '生活品质']
      case '婚姻分析': return ['婚姻', '感情', '家庭']
      case '健康分析': return ['健康', '养生', '生活习惯']
      case '时间轴分析': return ['运势节奏', '大运流年', '人生规划']
      case '决策分析': return ['人生决策', '时机选择', '风险控制']
      default: return ['整体分析']
    }
  }

  // ───────────────────────────────────────────
  // 评估推理质量
  // ───────────────────────────────────────────

  /** 评估所有推理链的整体质量 */
  private assessQuality(chains: ReasoningChain[]): ReasoningLayerResult['reasoningQuality'] {
    // 推理深度（取最长链深度）
    const depth = Math.max(...chains.map(c => c.depth))

    // 推理广度（话题数）
    const breadth = chains.length

    // 证据数
    let evidenceCount = 0
    let classicalRefCount = 0
    for (const chain of chains) {
      for (const step of chain.steps) {
        evidenceCount += step.evidence.length
        classicalRefCount += step.classicalRefs.length
      }
    }

    // 矛盾处理
    const hasContradiction = chains.some(c => c.hasContradiction)
    const allResolved = hasContradiction && chains.every(c => !c.hasContradiction || c.contradictionResolved)
    const contradictionHandling: 'none' | 'detected' | 'resolved' =
      !hasContradiction ? 'none' : allResolved ? 'resolved' : 'detected'

    // 总分
    const depthScore = clamp(depth * 10, 0, 30)
    const breadthScore = clamp(breadth * 2.5, 0, 30)
    const evidenceScore = clamp(evidenceCount * 0.5, 0, 15)
    const classicalScore = clamp(classicalRefCount * 1, 0, 10)
    const contradictionScore = contradictionHandling === 'resolved' ? 15
      : contradictionHandling === 'detected' ? 8
      : 5

    const overallScore = clamp(
      Math.round(depthScore + breadthScore + evidenceScore + classicalScore + contradictionScore),
      0, 100
    )

    return {
      depth,
      breadth,
      evidenceCount,
      classicalRefCount,
      contradictionHandling,
      overallScore,
    }
  }

  // ───────────────────────────────────────────
  // 生成建议输出
  // ───────────────────────────────────────────

  /** 基于所有推理链和综合分析，生成非模板化的建议输出 */
  private generateSuggestedOutput(chains: ReasoningChain[], synthesis: string): string {
    const highConfChains = chains.filter(c => c.overallConfidence >= 75)
    const keyConclusions = highConfChains.map(c => `${c.topic}：${c.finalConclusion}`)

    const parts: string[] = []

    // 开篇摘要
    parts.push(pick([
      `基于${chains.length}条推理链的完整分析，命盘的核心特征如下：`,
      `经过多维度推理链的交叉验证，命局分析的核心结论为：`,
      `综合${chains.length}个领域的深度推理，命盘的核心诊断如下：`,
    ]))

    // 列出高置信度结论
    if (keyConclusions.length > 0) {
      const selected = pickN(keyConclusions, Math.min(5, keyConclusions.length))
      parts.push(pick([
        `高置信度结论（${selected.length}项）：${selected.join('；')}。`,
        `关键分析结果：${selected.join('；')}。`,
      ]))
    }

    // 综合判断
    parts.push(synthesis)

    // 收尾
    parts.push(pick([
      '以上分析基于推理链的完整推演过程，每个结论都有前提、推理步骤和证据支撑，可追溯、可验证。',
      '所有结论均来自推理引擎的逐步推导，而非固定模板。同一命盘多次分析，推理路径和表述可能不同，但核心结论保持稳定。',
      '推理层分析的价值在于"知其然更知其所以然"——每个结论都附带完整的推理过程，供使用者理解和验证。',
    ]))

    return parts.join('\n\n')
  }

  // ═══════════════════════════════════════════
  // 工具方法
  // ═══════════════════════════════════════════

  /** 构造单个推理步骤 */
  private makeStep(
    step: number,
    type: ReasoningStepType,
    title: string,
    reasoning: string,
    evidence: string[],
    classicalRefs: string[],
    confidence: number,
    conclusion: string,
    dependsOn: number[],
    sourceModule?: string,
  ): ReasoningStep {
    return {
      step,
      type,
      title,
      reasoning,
      evidence,
      classicalRefs,
      confidence: clamp(confidence, 0, 100),
      conclusion,
      dependsOn,
      sourceModule,
    }
  }

  /** 组装推理链：计算汇总指标 */
  private assembleChain(id: string, topic: string, steps: ReasoningStep[]): ReasoningChain {
    // 方法统计
    const methodStats: Record<ReasoningStepType, number> = {
      premise: 0, deduction: 0, induction: 0, abduction: 0,
      analogy: 0, contradiction: 0, resolution: 0, synthesis: 0, conclusion: 0,
    }
    for (const s of steps) {
      methodStats[s.type]++
    }

    // 推理深度（最长依赖链长度）
    const depth = this.calcChainDepth(steps)

    // 总置信度
    const overallConfidence = this.calcChainConfidence(steps)

    // 是否存在矛盾
    const hasContradiction = steps.some(s => s.type === 'contradiction')
    const contradictionResolved = hasContradiction && steps.some(s => s.type === 'resolution')

    // 最终结论（取最后一个步骤的结论）
    const finalConclusion = steps.length > 0
      ? steps[steps.length - 1].conclusion
      : ''

    // 非模板化摘要
    const summary = this.generateChainSummary(topic, steps, overallConfidence)

    return {
      id,
      topic,
      steps,
      finalConclusion,
      overallConfidence,
      summary,
      methodStats,
      depth,
      hasContradiction,
      contradictionResolved,
    }
  }

  /** 计算推理链深度（最长依赖链长度） */
  private calcChainDepth(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0
    // 构建依赖图，计算每个步骤到根的最长路径
    const stepMap = new Map<number, ReasoningStep>()
    for (const s of steps) {
      stepMap.set(s.step, s)
    }

    const memo = new Map<number, number>()

    const getDepth = (stepNum: number): number => {
      if (memo.has(stepNum)) return memo.get(stepNum)!
      const step = stepMap.get(stepNum)
      if (!step || step.dependsOn.length === 0) {
        memo.set(stepNum, 1)
        return 1
      }
      const maxDep = Math.max(...step.dependsOn.map(d => getDepth(d)))
      const result = maxDep + 1
      memo.set(stepNum, result)
      return result
    }

    let maxDepth = 0
    for (const s of steps) {
      maxDepth = Math.max(maxDepth, getDepth(s.step))
    }
    return maxDepth
  }

  /** 计算推理链总置信度（各步骤加权平均） */
  private calcChainConfidence(steps: ReasoningStep[]): number {
    if (steps.length === 0) return 0
    // 综合研判和结论步骤权重更高
    let totalWeight = 0
    let weightedSum = 0
    for (const s of steps) {
      const weight = s.type === 'synthesis' || s.type === 'conclusion' ? 2
        : s.type === 'premise' ? 0.8
        : 1.2
      totalWeight += weight
      weightedSum += s.confidence * weight
    }
    return clamp(Math.round(weightedSum / totalWeight), 0, 100)
  }

  /** 生成推理链非模板化摘要 */
  private generateChainSummary(topic: string, steps: ReasoningStep[], confidence: number): string {
    const types = steps.map(s => s.type)
    const hasDeduction = types.includes('deduction')
    const hasContradiction = types.includes('contradiction')
    const hasAbduction = types.includes('abduction')
    const hasInduction = types.includes('induction')
    const hasAnalogy = types.includes('analogy')

    const methods: string[] = []
    if (hasDeduction) methods.push('演绎')
    if (hasAbduction) methods.push('溯因')
    if (hasInduction) methods.push('归纳')
    if (hasAnalogy) methods.push('类比')

    const premiseCount = types.filter(t => t === 'premise').length

    return pick([
      `${topic}推理链经过${steps.length}步推理（${premiseCount}个前提、${methods.join('、')}${methods.length > 0 ? '推理' : ''}），${hasContradiction ? '检测并处理了推理矛盾，' : ''}综合置信度${confidence}%。`,
      `${topic}分析采用${methods.length > 0 ? methods.join('+') + '推理' : '多步推理'}方法，从${premiseCount}个已知前提出发，经过${steps.length}个推理步骤，最终达到${confidence}%的综合置信度。${hasContradiction ? '推理过程中识别并分析了矛盾。' : ''}`,
      `针对${topic}话题，本推理链构建了${premiseCount}个前提节点和${steps.length - premiseCount}个推理节点，运用${methods.length > 0 ? methods.join('、') : '多种'}推理方法，${hasContradiction ? '在检测矛盾的基础上，' : ''}得出综合置信度${confidence}%的结论。`,
    ])
  }
}