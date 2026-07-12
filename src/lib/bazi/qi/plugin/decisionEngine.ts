/**
 * P3.6 DecisionEngine — 决策辅助引擎
 *
 * 古籍依据（源自《滴天髓》《三命通会》《子平真诠》）：
 *   《滴天髓》云："命不可先定，运有穷通。"
 *   《三命通会》云："大运者，人生之枢纽也。十年一变，主宰阶段性运势。"
 *   《子平真诠》云："用神为命之枢纽。"
 *
 * 核心功能：
 *   支持六类人生决策——创业、换工作、买房、投资、结婚、出国。
 *   每类决策从三个层面综合分析：
 *     1. 命局层面（natalScore）：原局禀赋、格局、十神力量
 *     2. 大运层面（luckScore）：当前大运五行与用神、十二长生、阶段趋势
 *     3. 流年层面（yearScore）：流年五行、与大运配合、流年神煞
 *   加权得出 overallScore（0-100），映射为五档推荐等级。
 *
 * 设计原则：
 *   - Plugin 方式接入，不修改 Kernel
 *   - 禁止模板回答：所有分析文字均基于 context 中的实际数据动态生成
 *   - 同一命盘多次调用使用随机表达选择器，保证措辞多样
 *   - advice 必含五行方位、时间段、注意事项三项
 *   - alternatives 基于用神五行给出替代方案
 *   - 古籍引用贯穿始终
 */

import type { ProbabilityResult } from './probabilityEngine'
import type { TimelineResult, DaYunInfo, TimelineStage } from './timelineEngine'
import type { EventPredictionResult } from './eventPredictionEngine'
import type { UseGodResult } from './useGodEngine'
import type { PatternValidationResult } from './patternValidator'
import { STEM_ELEMENT, BRANCH_ELEMENT, GENERATE, OVERCOME } from '../../../core'

// ─── 类型定义 ───

export type DecisionType = '创业' | '换工作' | '买房' | '投资' | '结婚' | '出国'

export type Recommendation = '强烈建议' | '建议' | '中性' | '不建议' | '强烈不建议'

export interface DecisionFactor {
  /** 因素名称 */
  name: string
  /** 权重 0-1 */
  weight: number
  /** 评分 0-100 */
  score: number
  /** 说明 */
  description: string
  /** 是否利好 */
  isPositive: boolean
}

export interface DecisionResult {
  type: DecisionType
  recommendation: Recommendation
  /** 0-100 */
  overallScore: number
  /** 0-100 */
  confidence: number
  /** 影响因素列表 */
  factors: DecisionFactor[]

  // 命局层面分析
  natalAnalysis: string
  /** 0-100 */
  natalScore: number

  // 大运层面分析
  luckAnalysis: string
  /** 0-100 */
  luckScore: number
  currentLuckName?: string

  // 流年层面分析
  yearAnalysis: string
  /** 0-100 */
  yearScore: number
  currentYearName?: string

  // 综合建议
  advice: string
  timing: string
  alternatives: string[]
  risks: string[]
  classicalRef: string
}

export interface DecisionResultAll {
  decisions: DecisionResult[]
  bestDecision: DecisionResult
  worstDecision: DecisionResult
  summary: string
}

export interface DecisionContext {
  dayGan: string
  dayElement: string
  /** 当前年龄 */
  age: number
  /** 当前年份 */
  currentYear: number

  // 引擎结果
  probabilityResult: ProbabilityResult
  timelineResult: TimelineResult
  eventResult: EventPredictionResult
  patternResult?: PatternValidationResult
  useGodResult?: UseGodResult
  shenShaResult?: any
  careerResult?: any
  wealthResult?: any
  marriageResult?: any

  // 大运流年
  /** 当前大运如 "甲申" */
  currentDaYun?: string
  /** 当前流年如 "丙午" */
  currentLiuNian?: string
  /** 大运列表 */
  daYunList?: string[]

  // 修正函数（可选）
  /** modifyByLuck */
  luckModifierFn?: Function
  /** calculateDynamicUseGod */
  dynamicUseGodFn?: Function
}

// ─── 五行生克关系 ───

/** 生我者为印 */
const PRINT_OF: Record<string, string> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
}
/** 克我者为官杀 */
const OFFICER_OF: Record<string, string> = {
  '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
}

// ─── 六冲 / 六合 ───

const LIU_CHONG: Record<string, string> = {
  '子': '午', '午': '子', '卯': '酉', '酉': '卯',
  '寅': '申', '申': '寅', '巳': '亥', '亥': '巳',
  '辰': '戌', '戌': '辰', '丑': '未', '未': '丑',
}

const LIU_HE: Record<string, string> = {
  '子': '丑', '丑': '子', '寅': '亥', '亥': '寅',
  '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰',
  '巳': '申', '申': '巳', '午': '未', '未': '午',
}

// ─── 五行方位 / 行业（用于建议与替代方案） ───

const ELEMENT_DIRECTION: Record<string, string> = {
  '木': '东方', '火': '南方', '土': '中央', '金': '西方', '水': '北方',
}

const ELEMENT_INDUSTRY: Record<string, string> = {
  '木': '教育、文创、农林、出版',
  '火': '互联网、传媒、能源、餐饮',
  '土': '房地产、建筑、咨询、公务',
  '金': '金融、法律、机械、医疗',
  '水': '贸易、物流、旅游、传播',
}

// 四正（桃花） / 四马（驿马）地支
const TAO_HUA_BRANCHES = ['子', '午', '卯', '酉']
const YI_MA_BRANCHES = ['寅', '申', '巳', '亥']

// ─── 古籍引用（三类决策共用三本典） ───

const CLASSICAL_BASE: Record<string, string> = {
  '滴天髓': '《滴天髓》云："命不可先定，运有穷通。"',
  '三命通会': '《三命通会》云："大运者，人生之枢纽也。"',
  '子平真诠': '《子平真诠》云："用神为命之枢纽。"',
}

// ─── 基础工具 ───

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function r2(v: number): number {
  return Math.round(v)
}

function num(v: any, def: number): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : def
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function strengthLabel(s: '身旺' | '身弱' | '中和'): string {
  return s
}

// ─── 概率维度提取 ───

function getDimension(prob: any, name: string): any {
  if (!prob || !Array.isArray(prob.dimensions)) return null
  return prob.dimensions.find((d: any) => d && d.name === name) || null
}

function dimScore(prob: any, name: string, def = 55): number {
  const d = getDimension(prob, name)
  return d && typeof d.score === 'number' ? d.score : def
}

// ─── 事件提取 ───

function getEvent(ev: any, type: string): any {
  if (!ev || !Array.isArray(ev.events)) return null
  return ev.events.find((e: any) => e && e.type === type) || null
}

function eventProb(ev: any, type: string, def = 50): number {
  const e = getEvent(ev, type)
  return e && typeof e.probability === 'number' ? e.probability : def
}

// ─── 神煞提取 ───

function hasShenSha(ss: any, name: string): boolean {
  if (!ss || !Array.isArray(ss.shenShaList)) return false
  return ss.shenShaList.some((s: any) => s && typeof s.name === 'string' && s.name.includes(name))
}

function shenShaNote(ctx: DecisionContext, names: string[]): string {
  const found = names.filter((n) => hasShenSha(ctx.shenShaResult, n))
  if (found.length === 0) return ''
  return `命带${found.join('、')}，`
}

// ─── 时间轴 / 大运提取 ───

type AgeRange = '0-10' | '11-20' | '21-30' | '31-40' | '41-50' | '51-60' | '61+'

function ageToRange(age: number): AgeRange {
  if (age <= 10) return '0-10'
  if (age <= 20) return '11-20'
  if (age <= 30) return '21-30'
  if (age <= 40) return '31-40'
  if (age <= 50) return '41-50'
  if (age <= 60) return '51-60'
  return '61+'
}

function findCurrentStage(tl: any, age: number): TimelineStage | null {
  if (!tl || !Array.isArray(tl.stages)) return null
  const ar = ageToRange(age)
  return tl.stages.find((s: any) => s && s.ageRange === ar) || tl.stages[0] || null
}

function findCurrentDaYunInfo(tl: any, age: number, daYunName?: string): DaYunInfo | null {
  if (!tl || !Array.isArray(tl.stages)) return null
  if (daYunName) {
    for (const s of tl.stages) {
      if (s?.daYun?.name === daYunName) return s.daYun
    }
  }
  for (const s of tl.stages) {
    const dy = s?.daYun
    if (dy && typeof dy.ageStart === 'number' && typeof dy.ageEnd === 'number'
      && age >= dy.ageStart && age <= dy.ageEnd) {
      return dy
    }
  }
  const stage = findCurrentStage(tl, age)
  return (stage?.daYun as DaYunInfo) || null
}

function trendScore(trend: string | undefined): number {
  switch (trend) {
    case '峰值': return 88
    case '上升': return 75
    case '平稳': return 60
    case '下降': return 40
    case '谷底': return 28
    default: return 55
  }
}

function stageScoreOf(stage: any, field: string, def = 55): number {
  if (!stage || !stage.score) return def
  const v = stage.score[field]
  return typeof v === 'number' ? v : def
}

// ─── 干支五行解析 ───

function ganZhiElements(gz: string | undefined): {
  gan: string; zhi: string; ganElement: string; zhiElement: string
} {
  if (!gz || typeof gz !== 'string' || gz.length < 2) {
    return { gan: '', zhi: '', ganElement: '', zhiElement: '' }
  }
  const gan = gz[0]
  const zhi = gz[1]
  return { gan, zhi, ganElement: (STEM_ELEMENT as any)[gan] || '', zhiElement: (BRANCH_ELEMENT as any)[zhi] || '' }
}

function elementRelation(a: string, b: string): '生' | '克' | '同' | '无关' {
  if (!a || !b) return '无关'
  if (a === b) return '同'
  if ((GENERATE as any)[a] === b || (GENERATE as any)[b] === a) return '生'
  if ((OVERCOME as any)[a] === b || (OVERCOME as any)[b] === a) return '克'
  return '无关'
}

/** 某五行与用神关系的有利度 0-100 */
function elementRelationScore(element: string, ug: any): number {
  if (!element) return 55
  if (!ug) return 55
  if (element === ug.yongShen) return 88
  if (element === ug.xiShen) return 72
  if (element === ug.xianShen) return 55
  if (element === ug.chouShen) return 35
  if (element === ug.jiShen) return 25
  return 55
}

// ─── 旺衰 / 十神推断 ───

function inferStrength(ctx: DecisionContext): '身旺' | '身弱' | '中和' {
  const ug = ctx.useGodResult
  const de = ctx.dayElement
  if (!ug || !ug.yongShen) return '中和'
  const yong = ug.yongShen
  if (yong === PRINT_OF[de] || yong === de) return '身弱'
  if (yong === (GENERATE as any)[de] || yong === (OVERCOME as any)[de] || yong === OFFICER_OF[de]) return '身旺'
  return '中和'
}

function bodyStrengthScore(ctx: DecisionContext): number {
  const s = inferStrength(ctx)
  return s === '身旺' ? 78 : s === '中和' ? 55 : 32
}

function tenGodElement(de: string, tenGod: '印' | '比' | '食伤' | '财' | '官'): string {
  switch (tenGod) {
    case '印': return PRINT_OF[de] || de
    case '比': return de
    case '食伤': return (GENERATE as any)[de] || de
    case '财': return (OVERCOME as any)[de] || de
    case '官': return OFFICER_OF[de] || de
  }
}

/** 十神力量 0-100：为用/喜则有力，为忌则成祸 */
function tenGodPower(ctx: DecisionContext, tenGod: '印' | '比' | '食伤' | '财' | '官'): number {
  const ug = ctx.useGodResult
  const de = ctx.dayElement
  if (!ug) return 50
  const el = tenGodElement(de, tenGod)
  const fav = ug.scores?.[el] ?? 50
  let base = 52
  if (el === ug.yongShen) base = 82
  else if (el === ug.xiShen) base = 70
  else if (el === ug.jiShen) base = 33
  else if (el === ug.chouShen) base = 40
  base = base * 0.7 + fav * 0.3
  return clamp(base, 0, 100)
}

/** 身旺担财能力 0-100 */
function bodyCanCarryWealth(ctx: DecisionContext): number {
  const s = inferStrength(ctx)
  const de = ctx.dayElement
  const ug = ctx.useGodResult
  const wealthEl = (OVERCOME as any)[de] || de
  let base = s === '身旺' ? 75 : s === '中和' ? 58 : 33
  if (ug && (wealthEl === ug.yongShen || wealthEl === ug.xiShen)) base += 8
  const fav = ug?.scores?.[wealthEl] ?? 50
  base = base * 0.75 + fav * 0.25
  return clamp(base, 0, 100)
}

function strengthLabelToScore(label: string | undefined): number {
  if (!label) return 50
  if (/强|旺|有力|盛|厚/.test(label)) return 82
  if (/弱|衰|无力|虚|薄/.test(label)) return 35
  if (/中|平|和|均/.test(label)) return 58
  return 55
}

/** 偏财力量 0-100（财富引擎偏财描述 + 十神财力量） */
function pianCaiPowerOf(ctx: DecisionContext): number {
  const wr = ctx.wealthResult
  let s = 50
  if (wr?.pianCai?.strength) s = strengthLabelToScore(wr.pianCai.strength)
  const tg = tenGodPower(ctx, '财')
  return clamp(s * 0.5 + tg * 0.5, 0, 100)
}

function hasCaiKu(ctx: DecisionContext): boolean {
  const ck = ctx.wealthResult?.caiKu
  if (!ck) return false
  const s = String(ck)
  return /有/.test(s) && !/无/.test(s)
}

function waterAbundant(ctx: DecisionContext): boolean {
  const ug = ctx.useGodResult
  if (!ug) return false
  return ug.jiShen === '水' || ug.chouShen === '水'
}

// ─── 大运 / 流年 评分 ───

function daYunUseGodScore(dy: string | undefined, ug: any): number {
  if (!dy) return 55
  const { ganElement, zhiElement } = ganZhiElements(dy)
  return elementRelationScore(ganElement, ug) * 0.4 + elementRelationScore(zhiElement, ug) * 0.6
}

/** 大运地支十二长生近似分（取自时间轴 DaYunInfo.score，-20~+20） */
function daYunChangShengScore(dyInfo: DaYunInfo | null): number {
  if (dyInfo && typeof dyInfo.score === 'number') {
    return clamp(50 + dyInfo.score * 2.5, 0, 100)
  }
  return 55
}

function yearDaYunHarmony(ln: string | undefined, dy: string | undefined): number {
  if (!ln || !dy) return 55
  const lnEl = ganZhiElements(ln).zhiElement
  const dyEl = ganZhiElements(dy).zhiElement
  const rel = elementRelation(lnEl, dyEl)
  if (rel === '生') return 75
  if (rel === '同') return 68
  if (rel === '克') return 35
  return 55
}

function branchIsTaoHua(br: string | undefined): boolean {
  return !!br && TAO_HUA_BRANCHES.includes(br)
}

function branchIsYiMa(br: string | undefined): boolean {
  return !!br && YI_MA_BRANCHES.includes(br)
}

/** 流年针对性评分 */
function liuNianScore(ctx: DecisionContext, focus: '用神' | '财' | '偏财' | '事业' | '婚姻'): number {
  const ln = ctx.currentLiuNian
  const ug = ctx.useGodResult
  const de = ctx.dayElement
  if (!ln) return 55
  const { ganElement, zhiElement } = ganZhiElements(ln)
  let s = 55
  switch (focus) {
    case '用神':
      s = elementRelationScore(ganElement, ug) * 0.4 + elementRelationScore(zhiElement, ug) * 0.6
      break
    case '财': {
      const wealthEl = (OVERCOME as any)[de] || de
      s = elementRelationScore(zhiElement, ug) * 0.5
        + (zhiElement === wealthEl ? 80 : 50) * 0.3
        + elementRelationScore(ganElement, ug) * 0.2
      break
    }
    case '偏财': {
      const wealthEl = (OVERCOME as any)[de] || de
      s = (zhiElement === wealthEl ? 82 : 48) * 0.5
        + elementRelationScore(zhiElement, ug) * 0.3
        + elementRelationScore(ganElement, ug) * 0.2
      break
    }
    case '事业':
      s = elementRelationScore(zhiElement, ug) * 0.5
        + dimScore(ctx.probabilityResult, '事业', 55) * 0.3
        + elementRelationScore(ganElement, ug) * 0.2
      break
    case '婚姻':
      s = (branchIsTaoHua(zhiElement) ? 72 : 50) * 0.4
        + dimScore(ctx.probabilityResult, '婚姻', 55) * 0.4
        + elementRelationScore(zhiElement, ug) * 0.2
      break
  }
  return clamp(s, 0, 100)
}

// ─── 修正函数（可选） ───

function luckModifierAdjust(
  ctx: DecisionContext,
  baseLuckScore: number,
): { score: number; change: number; desc: string } {
  const fn = ctx.luckModifierFn
  if (typeof fn !== 'function') return { score: baseLuckScore, change: 0, desc: '' }
  try {
    const ug = ctx.useGodResult
    const dy = ctx.currentDaYun || ''
    const ln = ctx.currentLiuNian || ''
    const dyEl = ganZhiElements(dy)
    const lnEl = ganZhiElements(ln)
    const r = fn(
      50,                                 // originalScore 基准
      ctx.dayElement,
      ctx.dayGan,
      ug?.yongShen || ctx.dayElement,     // useGodElement
      ug?.jiShen || '',                   // jiShen
      ug?.jiShen || '',                   // jiElement
      dyEl.gan,                           // luckGan
      dyEl.zhi,                           // luckZhi
      lnEl.gan,                           // yearGan
      lnEl.zhi,                           // yearZhi
    )
    if (r && typeof r.modifiedScore === 'number') {
      const change = r.modifiedScore - 50
      return {
        score: clamp(baseLuckScore + change * 0.5, 0, 100),
        change,
        desc: typeof r.description === 'string' ? r.description : '',
      }
    }
  } catch {
    // 修正函数签名不匹配或异常时静默回退
  }
  return { score: baseLuckScore, change: 0, desc: '' }
}

function dynamicUseGodOf(ctx: DecisionContext): any {
  const fn = ctx.dynamicUseGodFn
  if (typeof fn !== 'function') return null
  try {
    const ug = ctx.useGodResult
    const dy = ctx.currentDaYun || ''
    const dyGan = dy[0] || ''
    const r = fn(
      ctx.dayElement,
      bodyStrengthScore(ctx),
      ug?.yongShen || ctx.dayElement,
      ug?.xiShen || ctx.dayElement,
      ug?.jiShen || ctx.dayElement,
      ctx.age,
      dyGan,
    )
    return r || null
  } catch {
    return null
  }
}

function getYongShen(ctx: DecisionContext): string {
  const dyn = dynamicUseGodOf(ctx)
  if (dyn?.currentUseGod) return dyn.currentUseGod
  return ctx.useGodResult?.yongShen || ctx.dayElement
}

// ─── 推荐等级映射 ───

function scoreToRecommendation(s: number): Recommendation {
  if (s >= 80) return '强烈建议'
  if (s >= 65) return '建议'
  if (s >= 50) return '中性'
  if (s >= 35) return '不建议'
  return '强烈不建议'
}

function pickClassical(type: DecisionType): string {
  const tail: Record<DecisionType, string> = {
    '创业': '创业成败，系于大运之穷通与命局食伤偏财之厚薄。',
    '换工作': '择业更替，亦随大运枢纽而转。',
    '买房': '置业安家，以用神财库为衡。',
    '投资': '偏财之道，运通则进、运穷则守。',
    '结婚': '姻缘之至，随大运流年桃花而显。',
    '出国': '驿马远行，运主其期，命主其势。',
  }
  const baseKey: Record<DecisionType, keyof typeof CLASSICAL_BASE> = {
    '创业': '滴天髓',
    '换工作': '三命通会',
    '买房': '子平真诠',
    '投资': '滴天髓',
    '结婚': '三命通会',
    '出国': '滴天髓',
  }
  return `${CLASSICAL_BASE[baseKey[type]]}${tail[type]}`
}

// ─── 因素构造 ───

function factor(
  name: string,
  weight: number,
  score: number,
  description: string,
  isPositive?: boolean,
): DecisionFactor {
  return {
    name,
    weight,
    score: r2(score),
    description,
    isPositive: isPositive ?? score >= 55,
  }
}

// ─── 置信度 ───

function computeConfidence(ctx: DecisionContext): number {
  const items: { v: number; w: number }[] = []
  const pc = ctx.probabilityResult?.overallConfidence
  if (typeof pc === 'number') items.push({ v: pc, w: 3 })
  const stage = findCurrentStage(ctx.timelineResult, ctx.age)
  if (typeof stage?.confidence === 'number') items.push({ v: stage.confidence, w: 2 })
  if (ctx.patternResult) items.push({ v: 75, w: 2 })
  if (ctx.useGodResult) items.push({ v: 78, w: 2 })
  if (ctx.eventResult) items.push({ v: 70, w: 1.5 })
  if (ctx.careerResult) items.push({ v: 72, w: 1 })
  if (ctx.wealthResult) items.push({ v: 72, w: 1 })
  if (ctx.marriageResult) items.push({ v: 72, w: 1 })
  if (items.length === 0) return 50
  const sw = items.reduce((s, i) => s + i.w, 0)
  const sv = items.reduce((s, i) => s + i.v * i.w, 0)
  let conf = sv / sw
  if (!ctx.useGodResult) conf -= 5
  if (!ctx.timelineResult) conf -= 8
  if (!ctx.currentDaYun) conf -= 3
  return clamp(Math.round(conf), 10, 98)
}

// ─── 分析文字生成（数据驱动，非模板） ───

function buildNatalAnalysis(type: DecisionType, ctx: DecisionContext, c: any): string {
  const de = ctx.dayElement
  const strength = inferStrength(ctx)
  const rank = ctx.patternResult?.rank || '中等'
  const ps = num(ctx.patternResult?.totalScore, 55)
  const isZhenGe = !!ctx.patternResult?.isZhenGe
  const intro = `日主${ctx.dayGan}（${de}）${strengthLabel(strength)}，格局${rank}（${r2(ps)}分${isZhenGe ? '、真格' : ''}）。`
  switch (type) {
    case '创业':
      return `${intro}${randomPick(['创业禀赋', '自主立业之资', '开创之气'])}评${r2(c.entrepScore)}分，食伤（${tenGodElement(de, '食伤')}）泄秀之力${r2(c.shishangPower)}分、偏财${r2(c.pianCaiPower)}分，担财能力${r2(c.carryWealth)}分。${shenShaNote(ctx, ['驿马', '羊刃', '将星'])}${strength === '身旺' ? '身旺可任财官，创业有根底。' : strength === '身弱' ? '身弱须借印比扶身，不宜独力冒进。' : '中和之造，进退有度，宜谋定后动。'}`
    case '换工作': {
      const mg = num(ctx.careerResult?.managementScore, 55)
      return `${intro}事业概率${r2(c.careerScore)}分，管理才干${r2(mg)}分，食伤（${tenGodElement(de, '食伤')}）${r2(c.shishangPower)}分，身旺度${r2(c.bodyStr)}分。${shenShaNote(ctx, ['将星', '驿马', '天乙'])}${c.careerScore >= 65 ? '事业禀赋颇佳，跳槽有本。' : '事业禀赋平平，更替须择良机。'}`
    }
    case '买房': {
      const ck = hasCaiKu(ctx) ? '有财库' : '财库不显'
      return `${intro}财富概率${r2(c.wealthScore)}分，家庭运${r2(c.familyScore)}分，${ck}，身旺度${r2(c.bodyStr)}分。${shenShaNote(ctx, ['天乙', '国印'])}${hasCaiKu(ctx) ? '财库既成，置业可守。' : '财库未现，置产宜审。'}`
    }
    case '投资': {
      const wr = ctx.wealthResult
      const leakage = wr?.leakageRisk ? `漏财风险${wr.leakageRisk}，` : ''
      return `${intro}偏财禀赋${r2(c.pianCaiScore)}分，正财${r2(c.wealthScore)}分，身旺度${r2(c.bodyStr)}分，偏财十神（${tenGodElement(de, '财')}）${r2(c.pianCaiTenGod)}分。${leakage}${shenShaNote(ctx, ['劫煞', '羊刃', '天乙'])}${strength === '身旺' ? '身旺可搏偏财，然须控仓。' : '身弱财虚，投机多损。'}`
    }
    case '结婚': {
      const mq = ctx.marriageResult?.marriageQuality || '中等'
      const peach = ctx.marriageResult?.peachBlossom || ''
      const qingChun = ctx.patternResult?.isPoGe ? '格局有破' : '格局尚清纯'
      return `${intro}婚姻质量${mq}（${r2(c.marriageScore)}分），${qingChun}，${peach ? `桃花${peach}，` : ''}身${strength === '中和' ? '中和' : strength === '身旺' ? '偏旺' : '偏弱'}，日支稳定性${r2(c.dayZhiStable)}分。${shenShaNote(ctx, ['桃花', '红鸾', '天喜', '孤辰', '寡宿'])}${c.marriageScore >= 60 ? '姻缘之象可期。' : '姻缘尚须待运。'}`
    }
    case '出国': {
      const yi = hasShenSha(ctx.shenShaResult, '驿马')
      const wen = hasShenSha(ctx.shenShaResult, '文昌')
      return `${intro}驿马${yi ? '在命' : '不显'}，学业${r2(c.studyScore)}分、事业${r2(c.careerScore)}分，命局水气${waterAbundant(ctx) ? '偏旺' : '不盛'}，年龄适配${r2(c.ageScore)}分。${shenShaNote(ctx, ['驿马', '文昌', '华盖'])}${wen ? '文昌照命，远方求学有助。' : ''}${yi ? '驿马动人，远行有机。' : '驿马未动，远行须借运催。'}`
    }
  }
}

function buildLuckAnalysis(type: DecisionType, ctx: DecisionContext, c: any): string {
  const dy = ctx.currentDaYun || c.dyInfo?.name || '当前大运'
  const stage = c.stage
  const trend = stage?.trend || '平稳'
  const dyEl = ganZhiElements(ctx.currentDaYun)
  const ug = ctx.useGodResult
  const ugEl = ug?.yongShen || ctx.dayElement
  const head = `今行${dy}大运（干${dyEl.ganElement || '?'}支${dyEl.zhiElement || '?'}），`
  switch (type) {
    case '创业':
      return `${head}与用神${ugEl}之关系${r2(c.dyUseGod)}分，地支十二长生约${r2(c.dyChangSheng)}分，事业阶段（${trend}）影响${r2(c.dyCareerImpact)}分。${c.lmDesc ? c.lmDesc + '。' : ''}${c.dyUseGod >= 65 ? '运助用神，创业可乘势。' : c.dyUseGod <= 40 ? '运逢忌神，创业多阻。' : '运不偏不倚，宜稳中求进。'}`
    case '换工作':
      return `${head}事业关系${r2(c.dyCareerRel)}分，运中驿马${c.dyYiMa ? '动' : '静'}（${r2(c.dyYiMaScore)}分），趋势${trend}（${r2(c.dyTrend)}分）。${c.lmDesc ? c.lmDesc + '。' : ''}${trend === '上升' || trend === '峰值' ? '大运正处上升期，跳槽顺势。' : trend === '下降' || trend === '谷底' ? '大运势颓，不宜轻动。' : '运势平稳，更替无大碍。'}`
    case '买房':
      return `${head}财运${r2(c.dyWealth)}分，稳定度${r2(c.dyStable)}分，趋势${trend}（${r2(c.dyTrend)}分）。${c.lmDesc ? c.lmDesc + '。' : ''}${c.dyInfo?.effect === '凶' ? '大运偏凶，置业恐受拖累。' : c.dyWealth >= 60 ? '运中财气渐聚，置产得其时。' : '运中财气平平，置产宜缓。'}`
    case '投资':
      return `${head}偏财气${r2(c.dyPianCai)}分，与用神${r2(c.dyUseGod)}分，趋势${trend}（${r2(c.dyTrend)}分）。${c.lmDesc ? c.lmDesc + '。' : ''}${c.dyPianCai >= 62 ? '运带偏财，投机可图。' : '运无偏财，宜守不宜攻。'}`
    case '结婚': {
      const th = c.dyTaoHua ? '运逢桃花' : '桃花未动'
      const hl = (hasShenSha(ctx.shenShaResult, '红鸾') || hasShenSha(ctx.shenShaResult, '天喜')) ? '红鸾天喜照命' : '红鸾未显'
      return `${head}婚姻宫${r2(c.dyMarriage)}分，${th}（${r2(c.dyTaoHuaScore)}分），${hl}，稳定度${r2(c.dyStable)}分。${c.lmDesc ? c.lmDesc + '。' : ''}${c.dyMarriage >= 60 ? '运助姻缘，婚事可成。' : '运未助婚，宜待佳期。'}`
    }
    case '出国':
      return `${head}运中驿马${c.dyYiMa ? '动' : '静'}（${r2(c.dyYiMaScore)}分），与用神${r2(c.dyUseGod)}分，趋势${trend}（${r2(c.dyTrend)}分）。${c.lmDesc ? c.lmDesc + '。' : ''}${c.dyYiMa ? '驿马运至，远行正当其时。' : '驿马运未至，远行须待。'}`
  }
}

function buildYearAnalysis(type: DecisionType, ctx: DecisionContext, c: any): string {
  const ln = ctx.currentLiuNian || '本流年'
  const lnEl = ganZhiElements(ctx.currentLiuNian)
  const head = `流年${ln}（干${lnEl.ganElement || '?'}支${lnEl.zhiElement || '?'}），`
  switch (type) {
    case '创业':
      return `${head}与用神${r2(c.lnUseGod)}分，与大运${ctx.currentDaYun || ''}配合${r2(c.lnDyHarmony)}分，干支综合${r2(c.lnGanZhi)}分。${c.lnUseGod >= 65 ? '流年助用，今年可启其业。' : c.lnUseGod <= 40 ? '流年逆用，今年不宜起事。' : '流年平平，起事可在下半年。'}`
    case '换工作':
      return `${head}与事业${r2(c.lnCareer)}分，驿马${c.lnYiMa ? '动' : '静'}（${r2(c.lnYiMaScore)}分），趋势${r2(c.lnTrend)}分。${c.lnChongDy ? `流年冲大运，更替生变。` : c.lnCareer >= 60 ? '流年助事业，跳槽有得。' : '流年事业平平，跳槽宜慎。'}`
    case '买房':
      return `${head}财运${r2(c.lnWealth)}分，稳定${r2(c.lnStable)}分，趋势${r2(c.lnTrend)}分。${c.lnWealth >= 62 ? '流年财至，今年置业可期。' : '流年财未至，置业宜待。'}`
    case '投资':
      return `${head}偏财${r2(c.lnPianCai)}分，与用神${r2(c.lnUseGod)}分，趋势${r2(c.lnTrend)}分。${c.lnPianCai >= 62 ? '流年偏财现，短线可图。' : '流年偏财弱，宜观望。'}`
    case '结婚': {
      const th = c.lnTaoHua ? '流年桃花动' : '桃花未动'
      const hl = (hasShenSha(ctx.shenShaResult, '红鸾') || hasShenSha(ctx.shenShaResult, '天喜')) ? '红鸾天喜有应' : '红鸾未应'
      const he = c.lnHe ? '流年与大运相合' : c.lnChong ? '流年与大运相冲' : '流年与大运无显著合冲'
      return `${head}婚姻${r2(c.lnMarriage)}分，${th}（${r2(c.lnTaoHuaScore)}分），${hl}，${he}。${c.lnMarriage >= 60 && !c.lnChong ? '流年助婚，今年可议嫁娶。' : '流年未助婚，宜待来年。'}`
    }
    case '出国':
      return `${head}驿马${c.lnYiMa ? '动' : '静'}（${r2(c.lnYiMaScore)}分），与用神${r2(c.lnUseGod)}分，趋势${r2(c.lnTrend)}分。${c.lnYiMa ? '流年驿马动，远行有机。' : '流年驿马静，远行宜缓。'}`
  }
}

// ─── 综合建议 / 时机 / 替代方案 ───

function typeSpecificAction(type: DecisionType, score: number, ind: string): string {
  const favorable = score >= 60
  switch (type) {
    case '创业':
      return favorable
        ? randomPick([`可择${ind}等用神行业起步`, `宜小试牛刀于${ind}领域`, `以${ind}为切入，循序渐进`])
        : randomPick([`暂以${ind}相关岗位积累`, `先在${ind}业内磨砺再图自立`, `宜副业试水${ind}，勿贸然全职`])
    case '换工作':
      return favorable
        ? randomPick(['可主动寻觅更佳平台', '宜借势跳槽至更大平台', '可向用神行业靠拢'])
        : randomPick(['宜暂守现职蓄势', '可内部转岗而非外跳', '宜精进技能待运而动'])
    case '买房':
      return favorable
        ? randomPick(['今明两年可择机置产', '宜选购自住型房产', '可分步置业先小后大'])
        : randomPick(['宜先租房观望', '可待财运大运再购', '宜优先储蓄降负债'])
    case '投资':
      return favorable
        ? randomPick([`可适度配置${ind}相关资产`, `宜中长线布局${ind}`, `可分散投资${ind}领域`])
        : randomPick(['宜以稳健理财为主', '远离杠杆与投机', `暂以存款/债基守成为主`])
    case '结婚':
      return favorable
        ? randomPick(['今明两年可议婚嫁', '宜积极相亲拓展良缘', '可推进既有感情至婚姻'])
        : randomPick(['宜先立业后成家', '可先修身理顺感情', '宜待婚姻大运再议'])
    case '出国':
      return favorable
        ? randomPick(['可着手办理远行手续', '宜把握驿马运远行求学/发展', '可向用神方位之地出发'])
        : randomPick(['宜先国内积累再谋远行', '可短途游学试水', '宜待驿马运至再行动'])
  }
}

function buildAdvice(
  type: DecisionType,
  ctx: DecisionContext,
  score: number,
  risks: string[],
): string {
  const yongShen = getYongShen(ctx)
  const dir = ELEMENT_DIRECTION[yongShen] || '中央'
  const ind = ELEMENT_INDUSTRY[yongShen] || ''
  const peakAge = ctx.probabilityResult?.peakAge || ctx.timelineResult?.peakAge || ''
  const cautionAge = ctx.probabilityResult?.cautionAge || ctx.timelineResult?.cautionAge || ''
  const rec = scoreToRecommendation(score)

  const dirSeg = randomPick([
    `五行用神属${yongShen}，宜向${dir}发展`,
    `既以${yongShen}为用，${dir}为利方`,
    `方位上取${dir}（${yongShen}之位）为佳`,
  ])
  const timeSeg = peakAge
    ? randomPick([
        `人生峰值约在${peakAge}，`,
        `据推运，鼎盛期落在${peakAge}，`,
        `${peakAge}前后运势最厚，`,
      ])
    : '依大运流年节奏，'
  const actionSeg = typeSpecificAction(type, score, ind)
  const cautionSeg = risks.length
    ? `须警惕：${risks.join('；')}。`
    : '暂未见重大隐患，仍宜量力而行。'
  const cautionAgeSeg = cautionAge ? `另需留意${cautionAge}前后之波折。` : ''

  return `${rec}之局。${dirSeg}，涉${ind}相关领域更合用神。${timeSeg}${actionSeg}。${cautionSeg}${cautionAgeSeg}`
}

function buildTiming(type: DecisionType, ctx: DecisionContext): string {
  const peakAge = ctx.probabilityResult?.peakAge || ctx.timelineResult?.peakAge || ''
  const cautionAge = ctx.probabilityResult?.cautionAge || ctx.timelineResult?.cautionAge || ''
  const stage = findCurrentStage(ctx.timelineResult, ctx.age)
  const trend = stage?.trend || '平稳'
  const dy = ctx.currentDaYun || ''
  const ln = ctx.currentLiuNian || ''
  const age = ctx.age

  const peak = peakAge || '运势厚处'
  const caution = cautionAge || '运势薄处'
  const base = `${type}之机，宜择${peak}行之；避${caution}行之。`

  switch (type) {
    case '创业':
      return `${base}今${dy ? '行' + dy + '运' : '运'}趋势${trend}，${trend === '上升' || trend === '峰值' ? '正处于可为之机，宜速图之。' : trend === '下降' || trend === '谷底' ? '势已过峰，宜暂缓起事，蓄势待运。' : '势平，可徐图不必急。'}流年${ln || '未知'}为短期窗口，下半年干支转助时更佳。`
    case '换工作':
      return `${base}大运${trend === '上升' || trend === '峰值' ? '上升期宜动' : trend === '下降' || trend === '谷底' ? '下行期宜守' : '平稳期动守皆可'}。流年驿马动时跳槽最利，约在${age + 1}-${age + 3}岁间择流年驿马或合用神之岁更替。`
    case '买房':
      return `${base}置产宜择财运大运、流年财星透干之岁。今运${trend}，${trend === '上升' || trend === '峰值' ? '近两年可入手。' : '宜再待一两个流年财气透出之时。'}避开${caution}之破财岁。`
    case '投资':
      return `${base}偏财之道，宜择偏财大运+偏财流年叠加之岁加仓，忌忌神流年。今运${trend}，短期${ln ? `流年${ln}` : '本年'}偏财气为主基调，宜中短线、严控止损。`
    case '结婚':
      return `${base}姻缘宜择桃花/红鸾/天喜流年，或流年合日支、合大运之岁。今${age}岁，${trend === '上升' || trend === '峰值' ? '正值婚嫁佳期，' : '婚姻运未至峰，'}可于近一两个桃花流年议婚。`
    case '出国':
      return `${base}远行宜择驿马大运+驿马流年叠加之岁，${age}岁正值${trend}之势。年轻（18-30）求学远行最佳；若已中年，宜以发展为目的、择用神方位之地。`
  }
}

function buildAlternatives(type: DecisionType, ctx: DecisionContext, score: number): string[] {
  const yongShen = getYongShen(ctx)
  const dir = ELEMENT_DIRECTION[yongShen] || '中央'
  const ind = ELEMENT_INDUSTRY[yongShen] || ''
  const peakAge = ctx.probabilityResult?.peakAge || ctx.timelineResult?.peakAge || '运势厚处'
  switch (type) {
    case '创业':
      return score >= 60
        ? [`先在${ind}行业打工摸清门道再自立`, `在${dir}以副业试水${ind}`, `与人合伙借比劫之力分摊风险`]
        : [`暂守主业，于${ind}领域做轻资产副业`, `在${dir}积累资源，待${peakAge}再创业`, `先做${ind}相关自由职业过渡`]
    case '换工作':
      return [`暂守现职，待${peakAge}大运再动`, `转向${ind}方向内部转岗`, `在${dir}寻觅机会但勿裸辞`]
    case '买房':
      return [`先租房观望，待财运大运再购`, `选择${dir}小户型过渡`, `以投资${ind}相关稳健资产替代买房`]
    case '投资':
      return [`以稳健理财为主，远离杠杆`, `投资${ind}相关领域（${dir}）`, `待偏财大运再加仓`]
    case '结婚':
      return [`先立业后成家，待婚姻大运`, `在${dir}寻觅良缘`, `修身养性、化解感情阻力`]
    case '出国':
      return [`国内${ind}方向发展亦可`, `短途游学试水再决`, `待驿马流年再行动`]
  }
}

// ─── 组装 ───

interface AssembleParts {
  natalScore: number
  luckScore: number
  yearScore: number
  wN: number
  wL: number
  wY: number
  factors: DecisionFactor[]
  risks: string[]
  natalAnalysis: string
  luckAnalysis: string
  yearAnalysis: string
}

function assemble(
  type: DecisionType,
  ctx: DecisionContext,
  parts: AssembleParts,
): DecisionResult {
  const overall = parts.natalScore * parts.wN + parts.luckScore * parts.wL + parts.yearScore * parts.wY
  const overallScore = clamp(r2(overall), 0, 100)
  const recommendation = scoreToRecommendation(overallScore)
  const confidence = computeConfidence(ctx)
  const advice = buildAdvice(type, ctx, overallScore, parts.risks)
  const timing = buildTiming(type, ctx)
  const alternatives = buildAlternatives(type, ctx, overallScore)

  return {
    type,
    recommendation,
    overallScore,
    confidence,
    factors: parts.factors,
    natalAnalysis: parts.natalAnalysis,
    natalScore: r2(parts.natalScore),
    luckAnalysis: parts.luckAnalysis,
    luckScore: r2(parts.luckScore),
    currentLuckName: ctx.currentDaYun,
    yearAnalysis: parts.yearAnalysis,
    yearScore: r2(parts.yearScore),
    currentYearName: ctx.currentLiuNian,
    advice,
    timing,
    alternatives,
    risks: parts.risks,
    classicalRef: pickClassical(type),
  }
}

// ─── 公共大运/流年计算（各决策复用） ───

interface LuckCtx {
  dyInfo: DaYunInfo | null
  stage: TimelineStage | null
  dyUseGod: number
  dyChangSheng: number
  dyCareerImpact: number
  dyCareerRel: number
  dyWealth: number
  dyPianCai: number
  dyMarriage: number
  dyYiMa: boolean
  dyYiMaScore: number
  dyTaoHua: boolean
  dyTaoHuaScore: number
  dyStable: number
  dyTrend: number
  lmDesc: string
}

function computeLuckCtx(ctx: DecisionContext): LuckCtx {
  const dyInfo = findCurrentDaYunInfo(ctx.timelineResult, ctx.age, ctx.currentDaYun)
  const stage = findCurrentStage(ctx.timelineResult, ctx.age)
  const dy = ctx.currentDaYun
  const dyEl = ganZhiElements(dy)
  const ug = ctx.useGodResult
  const de = ctx.dayElement
  const wealthEl = (OVERCOME as any)[de] || de

  const dyUseGod = daYunUseGodScore(dy, ug)
  const dyChangSheng = daYunChangShengScore(dyInfo)
  const dyCareerImpact = clamp(trendScore(stage?.trend) * 0.6 + stageScoreOf(stage, 'career') * 0.4, 0, 100)
  const dyCareerRel = clamp(dyUseGod * 0.6 + stageScoreOf(stage, 'career') * 0.4, 0, 100)
  const dyWealth = clamp(stageScoreOf(stage, 'wealth') * 0.6 + dyUseGod * 0.4, 0, 100)
  const dyPianCai = clamp(stageScoreOf(stage, 'wealth') * 0.6 + (dyEl.zhiElement === wealthEl ? 75 : 50) * 0.4, 0, 100)
  const dyMarriage = clamp(stageScoreOf(stage, 'marriage') * 0.6 + dyUseGod * 0.4, 0, 100)
  const dyYiMa = branchIsYiMa(dyEl.zhi)
  const dyYiMaScore = dyYiMa ? 78 : hasShenSha(ctx.shenShaResult, '驿马') ? 58 : 42
  const dyTaoHua = branchIsTaoHua(dyEl.zhi)
  const dyTaoHuaScore = dyTaoHua ? 75 : hasShenSha(ctx.shenShaResult, '桃花') ? 60 : 45
  const trend = stage?.trend
  const dyStable = trend === '平稳' || trend === '峰值' ? 75 : trend === '上升' ? 65 : 35
  const dyTrend = trendScore(trend)

  return {
    dyInfo, stage, dyUseGod, dyChangSheng, dyCareerImpact, dyCareerRel,
    dyWealth, dyPianCai, dyMarriage, dyYiMa, dyYiMaScore, dyTaoHua,
    dyTaoHuaScore, dyStable, dyTrend, lmDesc: '',
  }
}

interface YearCtx {
  lnUseGod: number
  lnGanZhi: number
  lnDyHarmony: number
  lnCareer: number
  lnWealth: number
  lnPianCai: number
  lnMarriage: number
  lnYiMa: boolean
  lnYiMaScore: number
  lnTaoHua: boolean
  lnTaoHuaScore: number
  lnTrend: number
  lnStable: number
  lnHe: boolean
  lnChong: boolean
  lnChongDy: boolean
}

function computeYearCtx(ctx: DecisionContext): YearCtx {
  const ln = ctx.currentLiuNian
  const lnEl = ganZhiElements(ln)
  const dy = ctx.currentDaYun
  const dyEl = ganZhiElements(dy)
  const stage = findCurrentStage(ctx.timelineResult, ctx.age)
  const trend = stage?.trend

  const lnUseGod = liuNianScore(ctx, '用神')
  const lnGanZhi = lnUseGod
  const lnDyHarmony = yearDaYunHarmony(ln, dy)
  const lnCareer = liuNianScore(ctx, '事业')
  const lnWealth = liuNianScore(ctx, '财')
  const lnPianCai = liuNianScore(ctx, '偏财')
  const lnMarriage = liuNianScore(ctx, '婚姻')
  const lnYiMa = branchIsYiMa(lnEl.zhi)
  const lnYiMaScore = lnYiMa ? 78 : 42
  const lnTaoHua = branchIsTaoHua(lnEl.zhi)
  const lnTaoHuaScore = lnTaoHua ? 75 : 45
  const lnTrend = trendScore(trend)
  const lnStable = trend === '平稳' || trend === '峰值' ? 70 : 40
  const lnHe = !!lnEl.zhi && !!dyEl.zhi && LIU_HE[lnEl.zhi] === dyEl.zhi
  const lnChong = !!lnEl.zhi && !!dyEl.zhi && LIU_CHONG[lnEl.zhi] === dyEl.zhi
  const lnChongDy = lnChong

  return {
    lnUseGod, lnGanZhi, lnDyHarmony, lnCareer, lnWealth, lnPianCai,
    lnMarriage, lnYiMa, lnYiMaScore, lnTaoHua, lnTaoHuaScore, lnTrend,
    lnStable, lnHe, lnChong, lnChongDy,
  }
}

// ─── 六类决策分析器 ───

/** ① 创业决策 */
function decideEntrepreneurship(ctx: DecisionContext): DecisionResult {
  const de = ctx.dayElement
  const strength = inferStrength(ctx)
  const patternScore = num(ctx.patternResult?.totalScore, 55)
  const rank = ctx.patternResult?.rank || '中等'
  const entrepScore = num(ctx.careerResult?.entrepreneurshipScore, dimScore(ctx.probabilityResult, '事业', 55))
  const carryWealth = bodyCanCarryWealth(ctx)
  const shishangPower = tenGodPower(ctx, '食伤')
  const pianCaiPower = pianCaiPowerOf(ctx)

  // 命局：entrepreneurshipScore(40%) + 格局贵气(20%) + 身旺担财(20%) + 食伤力量(10%) + 偏财力量(10%)
  const natalScore =
    entrepScore * 0.4 + patternScore * 0.2 + carryWealth * 0.2 + shishangPower * 0.1 + pianCaiPower * 0.1

  // 大运：大运五行与用神(50%) + 大运地支十二长生(30%) + 大运对事业阶段影响(20%)
  const lc = computeLuckCtx(ctx)
  let luckScore = lc.dyUseGod * 0.5 + lc.dyChangSheng * 0.3 + lc.dyCareerImpact * 0.2
  const lm = luckModifierAdjust(ctx, luckScore)
  luckScore = lm.score

  // 流年：流年五行与用神(40%) + 流年与大运配合(30%) + 流年天干地支(30%)
  const yc = computeYearCtx(ctx)
  const yearScore = yc.lnUseGod * 0.4 + yc.lnDyHarmony * 0.3 + yc.lnGanZhi * 0.3

  const factors: DecisionFactor[] = [
    factor('创业禀赋', 0.4, entrepScore, `事业引擎创业评分${r2(entrepScore)}分`),
    factor('格局贵气', 0.2, patternScore, `格局${rank}，总分${r2(patternScore)}`),
    factor('身旺担财', 0.2, carryWealth, `${strength}，担财能力${r2(carryWealth)}分`),
    factor('食伤力量', 0.1, shishangPower, `食伤（${tenGodElement(de, '食伤')}）力量${r2(shishangPower)}分`),
    factor('偏财力量', 0.1, pianCaiPower, `偏财力量${r2(pianCaiPower)}分`),
    factor('大运用神', 0.35, lc.dyUseGod, `大运${ctx.currentDaYun || '未知'}与用神关系${r2(lc.dyUseGod)}分`),
    factor('流年配合', 0.15, yearScore, `流年${ctx.currentLiuNian || '未知'}综合${r2(yearScore)}分`),
  ]

  const risks: string[] = []
  if (strength === '身弱' && dimScore(ctx.probabilityResult, '财富', 55) > 65) risks.push('身弱财多，恐难任财')
  if (ctx.patternResult?.defects?.some((d: any) => /官杀混杂/.test(String(d)))) risks.push('官杀混杂，主事多波折')
  if (ctx.currentDaYun && elementRelationScore(ganZhiElements(ctx.currentDaYun).zhiElement, ctx.useGodResult) < 40) {
    risks.push(`大运${ctx.currentDaYun}地支为忌神，运势受抑`)
  }
  if (hasShenSha(ctx.shenShaResult, '羊刃')) risks.push('羊刃在命，逢冲易破财伤身')

  const natalAnalysis = buildNatalAnalysis('创业', ctx, { strength, rank, patternScore, entrepScore, carryWealth, shishangPower, pianCaiPower })
  const luckAnalysis = buildLuckAnalysis('创业', ctx, {
    dyInfo: lc.dyInfo, stage: lc.stage, dyUseGod: lc.dyUseGod, dyChangSheng: lc.dyChangSheng,
    dyCareerImpact: lc.dyCareerImpact, lmDesc: lm.desc,
  })
  const yearAnalysis = buildYearAnalysis('创业', ctx, { lnUseGod: yc.lnUseGod, lnDyHarmony: yc.lnDyHarmony, lnGanZhi: yc.lnGanZhi })

  return assemble('创业', ctx, {
    natalScore, luckScore, yearScore, wN: 0.5, wL: 0.35, wY: 0.15,
    factors, risks, natalAnalysis, luckAnalysis, yearAnalysis,
  })
}

/** ② 换工作决策 */
function decideJobChange(ctx: DecisionContext): DecisionResult {
  const de = ctx.dayElement
  const strength = inferStrength(ctx)
  const careerScore = dimScore(ctx.probabilityResult, '事业', 55)
  const managementScore = num(ctx.careerResult?.managementScore, 55)
  const patternScore = num(ctx.patternResult?.totalScore, 55)
  const bodyStr = bodyStrengthScore(ctx)
  const shishangPower = tenGodPower(ctx, '食伤')

  // 命局：careerScore(35%) + managementScore(25%) + 格局(20%) + 身旺(10%) + 食伤(10%)
  const natalScore =
    careerScore * 0.35 + managementScore * 0.25 + patternScore * 0.2 + bodyStr * 0.1 + shishangPower * 0.1

  // 大运：大运五行与事业关系(40%) + 大运驿马(20%) + 大运趋势(40%)
  const lc = computeLuckCtx(ctx)
  let luckScore = lc.dyCareerRel * 0.4 + lc.dyYiMaScore * 0.2 + lc.dyTrend * 0.4
  const lm = luckModifierAdjust(ctx, luckScore)
  luckScore = lm.score

  // 流年：流年与事业(40%) + 流年驿马(20%) + 流年趋势(40%)
  const yc = computeYearCtx(ctx)
  const yearScore = yc.lnCareer * 0.4 + yc.lnYiMaScore * 0.2 + yc.lnTrend * 0.4

  const factors: DecisionFactor[] = [
    factor('事业概率', 0.35, careerScore, `事业维度评分${r2(careerScore)}分`),
    factor('管理才干', 0.25, managementScore, `管理能力评分${r2(managementScore)}分`),
    factor('格局', 0.2, patternScore, `格局总分${r2(patternScore)}分`),
    factor('身旺度', 0.1, bodyStr, `${strength}，身旺度${r2(bodyStr)}分`),
    factor('食伤力量', 0.1, shishangPower, `食伤（${tenGodElement(de, '食伤')}）${r2(shishangPower)}分`),
    factor('大运趋势', 0.35, lc.dyTrend, `大运趋势${lc.stage?.trend || '平稳'}（${r2(lc.dyTrend)}分）`),
    factor('流年事业', 0.2, yc.lnCareer, `流年事业${r2(yc.lnCareer)}分`),
  ]

  const risks: string[] = []
  const trend = lc.stage?.trend
  if (trend === '下降' || trend === '谷底') risks.push('当前大运峰值已过，势颓不宜轻动')
  if (yc.lnChongDy) risks.push(`流年${ctx.currentLiuNian || ''}冲大运，跳槽生变`)
  if (strength === '身弱' && careerScore < 50) risks.push('身弱且事业禀赋不足，跳槽难有跃升')

  const natalAnalysis = buildNatalAnalysis('换工作', ctx, { strength, careerScore, managementScore, shishangPower, bodyStr })
  const luckAnalysis = buildLuckAnalysis('换工作', ctx, {
    dyInfo: lc.dyInfo, stage: lc.stage, dyCareerRel: lc.dyCareerRel, dyYiMa: lc.dyYiMa,
    dyYiMaScore: lc.dyYiMaScore, dyTrend: lc.dyTrend, lmDesc: lm.desc,
  })
  const yearAnalysis = buildYearAnalysis('换工作', ctx, {
    lnCareer: yc.lnCareer, lnYiMa: yc.lnYiMa, lnYiMaScore: yc.lnYiMaScore,
    lnTrend: yc.lnTrend, lnChongDy: yc.lnChongDy,
  })

  return assemble('换工作', ctx, {
    natalScore, luckScore, yearScore, wN: 0.45, wL: 0.35, wY: 0.2,
    factors, risks, natalAnalysis, luckAnalysis, yearAnalysis,
  })
}

/** ③ 买房决策 */
function decideBuyHouse(ctx: DecisionContext): DecisionResult {
  const de = ctx.dayElement
  const strength = inferStrength(ctx)
  const wealthScore = num(ctx.wealthResult?.wealthScore, dimScore(ctx.probabilityResult, '财富', 55))
  const stage = findCurrentStage(ctx.timelineResult, ctx.age)
  const familyScore = stageScoreOf(stage, 'family', 55)
  const caiKuScore = hasCaiKu(ctx) ? 80 : 45
  const patternScore = num(ctx.patternResult?.totalScore, 55)
  const bodyStr = bodyStrengthScore(ctx)

  // 命局：wealthScore(40%) + familyScore(20%) + 财库(15%) + 格局(15%) + 身旺(10%)
  const natalScore =
    wealthScore * 0.4 + familyScore * 0.2 + caiKuScore * 0.15 + patternScore * 0.15 + bodyStr * 0.1

  // 大运：大运财运(50%) + 大运稳定度(30%) + 大运趋势(20%)
  const lc = computeLuckCtx(ctx)
  let luckScore = lc.dyWealth * 0.5 + lc.dyStable * 0.3 + lc.dyTrend * 0.2
  const lm = luckModifierAdjust(ctx, luckScore)
  luckScore = lm.score

  // 流年：流年财运(50%) + 流年稳定(30%) + 流年趋势(20%)
  const yc = computeYearCtx(ctx)
  const yearScore = yc.lnWealth * 0.5 + yc.lnStable * 0.3 + yc.lnTrend * 0.2

  const factors: DecisionFactor[] = [
    factor('财富概率', 0.4, wealthScore, `财富评分${r2(wealthScore)}分`),
    factor('家庭运', 0.2, familyScore, `家庭维度${r2(familyScore)}分`),
    factor('财库', 0.15, caiKuScore, hasCaiKu(ctx) ? '命有财库，财可守' : '财库不显'),
    factor('格局', 0.15, patternScore, `格局总分${r2(patternScore)}分`),
    factor('身旺度', 0.1, bodyStr, `${strength}，身旺度${r2(bodyStr)}分`),
    factor('大运财运', 0.3, lc.dyWealth, `大运财运${r2(lc.dyWealth)}分`),
    factor('流年财运', 0.15, yc.lnWealth, `流年财运${r2(yc.lnWealth)}分`),
  ]

  const risks: string[] = []
  const leakage = ctx.wealthResult?.leakageRisk
  if (leakage && /高|严重|大/.test(String(leakage))) risks.push(`漏财风险${leakage}，置业恐难守财`)
  if (strength === '身弱' && wealthScore > 60) risks.push('身弱财多，置产反成负担')
  if (lc.dyInfo?.effect === '凶') risks.push('当前大运偏凶，大额支出不宜')

  const natalAnalysis = buildNatalAnalysis('买房', ctx, { strength, wealthScore, familyScore, bodyStr })
  const luckAnalysis = buildLuckAnalysis('买房', ctx, {
    dyInfo: lc.dyInfo, stage: lc.stage, dyWealth: lc.dyWealth, dyStable: lc.dyStable,
    dyTrend: lc.dyTrend, lmDesc: lm.desc,
  })
  const yearAnalysis = buildYearAnalysis('买房', ctx, { lnWealth: yc.lnWealth, lnStable: yc.lnStable, lnTrend: yc.lnTrend })

  return assemble('买房', ctx, {
    natalScore, luckScore, yearScore, wN: 0.55, wL: 0.3, wY: 0.15,
    factors, risks, natalAnalysis, luckAnalysis, yearAnalysis,
  })
}

/** ④ 投资决策 */
function decideInvestment(ctx: DecisionContext): DecisionResult {
  const de = ctx.dayElement
  const strength = inferStrength(ctx)
  const pianCaiScore = pianCaiPowerOf(ctx)
  const wealthScore = num(ctx.wealthResult?.wealthScore, dimScore(ctx.probabilityResult, '财富', 55))
  const bodyStr = bodyStrengthScore(ctx)
  const patternScore = num(ctx.patternResult?.totalScore, 55)
  const pianCaiTenGod = tenGodPower(ctx, '财')

  // 命局：pianCaiScore(35%) + wealthScore(25%) + 身旺(20%) + 格局(10%) + 偏财(10%)
  const natalScore =
    pianCaiScore * 0.35 + wealthScore * 0.25 + bodyStr * 0.2 + patternScore * 0.1 + pianCaiTenGod * 0.1

  // 大运：大运偏财(40%) + 大运与用神(35%) + 大运趋势(25%)
  const lc = computeLuckCtx(ctx)
  let luckScore = lc.dyPianCai * 0.4 + lc.dyUseGod * 0.35 + lc.dyTrend * 0.25
  const lm = luckModifierAdjust(ctx, luckScore)
  luckScore = lm.score

  // 流年：流年偏财(40%) + 流年与用神(35%) + 流年趋势(25%)
  const yc = computeYearCtx(ctx)
  const yearScore = yc.lnPianCai * 0.4 + yc.lnUseGod * 0.35 + yc.lnTrend * 0.25

  const factors: DecisionFactor[] = [
    factor('偏财禀赋', 0.35, pianCaiScore, `偏财力量${r2(pianCaiScore)}分`),
    factor('财富概率', 0.25, wealthScore, `财富评分${r2(wealthScore)}分`),
    factor('身旺度', 0.2, bodyStr, `${strength}，身旺度${r2(bodyStr)}分`),
    factor('格局', 0.1, patternScore, `格局总分${r2(patternScore)}分`),
    factor('偏财十神', 0.1, pianCaiTenGod, `偏财（${tenGodElement(de, '财')}）${r2(pianCaiTenGod)}分`),
    factor('大运偏财', 0.35, lc.dyPianCai, `大运偏财气${r2(lc.dyPianCai)}分`),
    factor('流年偏财', 0.25, yc.lnPianCai, `流年偏财${r2(yc.lnPianCai)}分`),
  ]

  const risks: string[] = []
  if (hasShenSha(ctx.shenShaResult, '劫煞')) risks.push('命带劫煞，投机易遭劫夺')
  if (hasShenSha(ctx.shenShaResult, '羊刃')) risks.push('羊刃在命，高风险投资易破财')
  if (eventProb(ctx.eventResult, '官非', 0) > 50) risks.push(`官非概率偏高（${r2(eventProb(ctx.eventResult, '官非', 0))}%），投资恐引纠纷`)
  if (strength === '身弱') risks.push('身弱不任财，投机多损')

  const natalAnalysis = buildNatalAnalysis('投资', ctx, { strength, pianCaiScore, wealthScore, bodyStr, pianCaiTenGod })
  const luckAnalysis = buildLuckAnalysis('投资', ctx, {
    dyInfo: lc.dyInfo, stage: lc.stage, dyPianCai: lc.dyPianCai, dyUseGod: lc.dyUseGod,
    dyTrend: lc.dyTrend, lmDesc: lm.desc,
  })
  const yearAnalysis = buildYearAnalysis('投资', ctx, { lnPianCai: yc.lnPianCai, lnUseGod: yc.lnUseGod, lnTrend: yc.lnTrend })

  return assemble('投资', ctx, {
    natalScore, luckScore, yearScore, wN: 0.4, wL: 0.35, wY: 0.25,
    factors, risks, natalAnalysis, luckAnalysis, yearAnalysis,
  })
}

/** ⑤ 结婚决策 */
function decideMarriage(ctx: DecisionContext): DecisionResult {
  const de = ctx.dayElement
  const strength = inferStrength(ctx)
  const marriageScore = num(ctx.marriageResult?.marriageScore, dimScore(ctx.probabilityResult, '婚姻', 55))
  const taoHuaScore = hasShenSha(ctx.shenShaResult, '桃花')
    ? 80
    : ctx.marriageResult?.peachBlossom && /有|旺/.test(String(ctx.marriageResult.peachBlossom))
      ? 65
      : 45
  const patternScore = num(ctx.patternResult?.totalScore, 55)
  const qingChun = ctx.patternResult?.isPoGe
    ? 35
    : clamp(patternScore - (ctx.patternResult?.defects?.length || 0) * 6, 30, 100)
  const bodyZhongHe = strength === '中和' ? 82 : 50
  const dayZhiStable = ctx.marriageResult?.riskFactors?.some((r: any) => /冲|刑|害/.test(String(r)))
    ? 35
    : 70

  // 命局：marriageScore(40%) + 桃花(20%) + 格局清纯(15%) + 身中和(15%) + 日支稳定(10%)
  const natalScore =
    marriageScore * 0.4 + taoHuaScore * 0.2 + qingChun * 0.15 + bodyZhongHe * 0.15 + dayZhiStable * 0.1

  // 大运：大运婚姻(40%) + 大运桃花(20%) + 大运红鸾天喜(20%) + 大运稳定(20%)
  const lc = computeLuckCtx(ctx)
  const hongLuanScore = (hasShenSha(ctx.shenShaResult, '红鸾') || hasShenSha(ctx.shenShaResult, '天喜')) ? 70 : 50
  let luckScore = lc.dyMarriage * 0.4 + lc.dyTaoHuaScore * 0.2 + hongLuanScore * 0.2 + lc.dyStable * 0.2
  const lm = luckModifierAdjust(ctx, luckScore)
  luckScore = lm.score

  // 流年：流年婚姻(40%) + 流年桃花(20%) + 流年红鸾(20%) + 流年合(20%)
  const yc = computeYearCtx(ctx)
  const lnHeScore = yc.lnHe ? 75 : yc.lnChong ? 30 : 50
  const yearScore = yc.lnMarriage * 0.4 + yc.lnTaoHuaScore * 0.2 + hongLuanScore * 0.2 + lnHeScore * 0.2

  const factors: DecisionFactor[] = [
    factor('婚姻概率', 0.4, marriageScore, `婚姻评分${r2(marriageScore)}分`),
    factor('桃花', 0.2, taoHuaScore, hasShenSha(ctx.shenShaResult, '桃花') ? '命带桃花' : '桃花未显'),
    factor('格局清纯', 0.15, qingChun, ctx.patternResult?.isPoGe ? '格局有破' : '格局尚清纯'),
    factor('身中和', 0.15, bodyZhongHe, `${strength}，身中和度${r2(bodyZhongHe)}分`),
    factor('日支稳定', 0.1, dayZhiStable, `日支稳定性${r2(dayZhiStable)}分`),
    factor('大运婚姻', 0.3, lc.dyMarriage, `大运婚姻宫${r2(lc.dyMarriage)}分`),
    factor('流年桃花', 0.25, yc.lnTaoHuaScore, `流年桃花${r2(yc.lnTaoHuaScore)}分`),
  ]

  const risks: string[] = []
  if (hasShenSha(ctx.shenShaResult, '孤辰') || hasShenSha(ctx.shenShaResult, '寡宿')) risks.push('孤辰寡宿照命，姻缘易迟')
  if (ctx.marriageResult?.riskFactors?.some((r: any) => /冲/.test(String(r)))) risks.push('日支逢冲，婚姻多波折')
  if (ctx.patternResult?.defects?.some((d: any) => /官杀混杂/.test(String(d)))) risks.push('官杀混杂，感情易纠葛')

  const natalAnalysis = buildNatalAnalysis('结婚', ctx, { strength, marriageScore, dayZhiStable })
  const luckAnalysis = buildLuckAnalysis('结婚', ctx, {
    dyInfo: lc.dyInfo, stage: lc.stage, dyMarriage: lc.dyMarriage, dyTaoHua: lc.dyTaoHua,
    dyTaoHuaScore: lc.dyTaoHuaScore, dyStable: lc.dyStable, lmDesc: lm.desc,
  })
  const yearAnalysis = buildYearAnalysis('结婚', ctx, {
    lnMarriage: yc.lnMarriage, lnTaoHua: yc.lnTaoHua, lnTaoHuaScore: yc.lnTaoHuaScore,
    lnHe: yc.lnHe, lnChong: yc.lnChong,
  })

  return assemble('结婚', ctx, {
    natalScore, luckScore, yearScore, wN: 0.45, wL: 0.3, wY: 0.25,
    factors, risks, natalAnalysis, luckAnalysis, yearAnalysis,
  })
}

/** ⑥ 出国决策 */
function decideGoAbroad(ctx: DecisionContext): DecisionResult {
  const de = ctx.dayElement
  const strength = inferStrength(ctx)
  const yiMaScore = hasShenSha(ctx.shenShaResult, '驿马') ? 80 : 40
  const studyScore = dimScore(ctx.probabilityResult, '学业', 55)
  const careerScore = dimScore(ctx.probabilityResult, '事业', 55)
  const waterScore = waterAbundant(ctx) ? 78 : 42
  const ageScore = clamp(100 - Math.abs(ctx.age - 24) * 2.2, 30, 95)

  // 命局：驿马(30%) + 学业(20%) + 事业(20%) + 命局水多(15%) + 年龄(15%)
  const natalScore =
    yiMaScore * 0.3 + studyScore * 0.2 + careerScore * 0.2 + waterScore * 0.15 + ageScore * 0.15

  // 大运：大运驿马(35%) + 大运与用神(35%) + 大运趋势(30%)
  const lc = computeLuckCtx(ctx)
  let luckScore = lc.dyYiMaScore * 0.35 + lc.dyUseGod * 0.35 + lc.dyTrend * 0.3
  const lm = luckModifierAdjust(ctx, luckScore)
  luckScore = lm.score

  // 流年：流年驿马(35%) + 流年与用神(35%) + 流年趋势(30%)
  const yc = computeYearCtx(ctx)
  const yearScore = yc.lnYiMaScore * 0.35 + yc.lnUseGod * 0.35 + yc.lnTrend * 0.3

  const factors: DecisionFactor[] = [
    factor('命局驿马', 0.3, yiMaScore, hasShenSha(ctx.shenShaResult, '驿马') ? '命带驿马' : '驿马不显'),
    factor('学业', 0.2, studyScore, `学业评分${r2(studyScore)}分`),
    factor('事业', 0.2, careerScore, `事业评分${r2(careerScore)}分`),
    factor('命局水多', 0.15, waterScore, waterAbundant(ctx) ? '水气偏旺主流动' : '水气不盛'),
    factor('年龄适配', 0.15, ageScore, `${ctx.age}岁，远行适配${r2(ageScore)}分`),
    factor('大运驿马', 0.35, lc.dyYiMaScore, `大运驿马${lc.dyYiMa ? '动' : '静'}（${r2(lc.dyYiMaScore)}分）`),
    factor('流年驿马', 0.25, yc.lnYiMaScore, `流年驿马${yc.lnYiMa ? '动' : '静'}（${r2(yc.lnYiMaScore)}分）`),
  ]

  const risks: string[] = []
  if (!hasShenSha(ctx.shenShaResult, '驿马') && !lc.dyYiMa) risks.push('命局与大运皆无驿马，远行机缘薄')
  if (strength === '身弱') risks.push('身弱远行多劳顿，须防健康损耗')
  if (hasShenSha(ctx.shenShaResult, '华盖')) risks.push('华盖重者恋家内省，远行易生孤独')

  const natalAnalysis = buildNatalAnalysis('出国', ctx, { strength, studyScore, careerScore, ageScore })
  const luckAnalysis = buildLuckAnalysis('出国', ctx, {
    dyInfo: lc.dyInfo, stage: lc.stage, dyYiMa: lc.dyYiMa, dyYiMaScore: lc.dyYiMaScore,
    dyUseGod: lc.dyUseGod, dyTrend: lc.dyTrend, lmDesc: lm.desc,
  })
  const yearAnalysis = buildYearAnalysis('出国', ctx, { lnYiMa: yc.lnYiMa, lnYiMaScore: yc.lnYiMaScore, lnUseGod: yc.lnUseGod, lnTrend: yc.lnTrend })

  return assemble('出国', ctx, {
    natalScore, luckScore, yearScore, wN: 0.4, wL: 0.35, wY: 0.25,
    factors, risks, natalAnalysis, luckAnalysis, yearAnalysis,
  })
}

// ─── 决策分发表 ───

const DECISION_DISPATCH: Record<DecisionType, (ctx: DecisionContext) => DecisionResult> = {
  '创业': decideEntrepreneurship,
  '换工作': decideJobChange,
  '买房': decideBuyHouse,
  '投资': decideInvestment,
  '结婚': decideMarriage,
  '出国': decideGoAbroad,
}

// ─── 对外核心函数 ───

/**
 * 单类决策分析
 * @param type 决策类型
 * @param context 决策上下文（含各引擎结果）
 */
export function makeDecision(type: DecisionType, context: DecisionContext): DecisionResult {
  const handler = DECISION_DISPATCH[type]
  if (!handler) {
    throw new Error(`不支持的决策类型：${type}`)
  }
  return handler(context)
}

/**
 * 全部六类决策分析，并给出最佳/最不建议决策与总评
 */
export function makeAllDecisions(context: DecisionContext): DecisionResultAll {
  const types: DecisionType[] = ['创业', '换工作', '买房', '投资', '结婚', '出国']
  const decisions = types.map((t) => makeDecision(t, context))

  let best = decisions[0]
  let worst = decisions[0]
  for (const d of decisions) {
    if (d.overallScore > best.overallScore) best = d
    if (d.overallScore < worst.overallScore) worst = d
  }

  const summary = buildSummary(context, decisions, best, worst)

  return {
    decisions,
    bestDecision: best,
    worstDecision: worst,
    summary,
  }
}

function buildSummary(
  ctx: DecisionContext,
  decisions: DecisionResult[],
  best: DecisionResult,
  worst: DecisionResult,
): string {
  const yongShen = getYongShen(ctx)
  const dir = ELEMENT_DIRECTION[yongShen] || '中央'
  const ind = ELEMENT_INDUSTRY[yongShen] || ''
  const strength = inferStrength(ctx)
  const peakAge = ctx.probabilityResult?.peakAge || ctx.timelineResult?.peakAge || ''

  const top3 = [...decisions].sort((a, b) => b.overallScore - a.overallScore).slice(0, 3)
  const top3Text = top3
    .map((d) => `${d.type}(${d.recommendation}${d.overallScore}分)`)
    .join('、')

  return [
    `日主${ctx.dayGan}（${ctx.dayElement}）${strength}，用神属${yongShen}，利${dir}、宜${ind}。`,
    `六类决策综合排序居前者：${top3Text}。`,
    `其中以${best.type}最为可图（${best.overallScore}分，${best.recommendation}），`,
    worst.overallScore < 40
      ? `${worst.type}则宜暂缓（${worst.overallScore}分，${worst.recommendation}）。`
      : `${worst.type}相对最弱（${worst.overallScore}分），量力而行。`,
    peakAge ? `人生峰值约在${peakAge}，决策宜顺势而为。` : '决策宜顺大运流年之势而为。',
    `${CLASSICAL_BASE['滴天髓']}`,
  ].join('')
}

// ─── 导出内部分析器（便于单测） ───

export {
  decideEntrepreneurship,
  decideJobChange,
  decideBuyHouse,
  decideInvestment,
  decideMarriage,
  decideGoAbroad,
}
