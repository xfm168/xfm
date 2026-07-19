/**
 * 格局升级引擎 V4.3 — 玄风门
 *
 * 30+格局判定系统，基于真实命理规则判断命局格局。
 * 包含：正格系列(8)、从格系列(4)、化气格(5)、专旺格(5)、
 *       特殊格(3)、假从格(2)、杂气格(3)、兼格(6)
 *
 * 规则来源：《子平真诠》《三命通会》《渊海子平》《穷通宝鉴》
 */

import type { BaZiChart, FiveElement, HeavenlyStem, EarthlyBranch, ShenShi, WuXingWangShuai } from './types'
import {
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  CANG_GAN,
  GENERATE,
  OVERCOME,
  BE_OVERCOME,
  BE_GENERATE,
  WANG_SHUAI_TABLE,
  FIVE_ELEMENTS,
} from '@/lib/core'

// ========== 类型定义 ==========

export type GeJuCategoryV2 =
  | 'normal'       // 正格
  | 'congenital'   // 从格
  | 'special'      // 专旺格
  | 'transformed'  // 化气格
  | 'pseudo'       // 假从格
  | 'miscellaneous' // 杂气格
  | 'combined'     // 兼格（复合格局）

export interface GeJuResultV2 {
  /** 格局名称 */
  name: string
  /** 格局大类 */
  category: GeJuCategoryV2
  /** 子类（如 从强格/从弱格） */
  subCategory: string
  /** 成格可信度 0-100 */
  confidence: number
  /** 格局清纯度 0-100 */
  purity: number
  /** 是否破格 */
  broken: boolean
  /** 破格原因 */
  brokenReason?: string
  /** 格局详解（约200字） */
  description: string
  /** 格局建议（约100字） */
  advice: string
  /** 命中的判定规则 */
  matchedRules: string[]
  /** 副格（同时存在的其他格局） */
  subGeJu: GeJuResultV2[]
}

// 格局判定规则接口
interface GeJuRuleV2 {
  name: string
  category: GeJuCategoryV2
  subCategory: string
  /** 判定条件 */
  condition: (ctx: GeJuContext) => boolean
  /** 破格条件 */
  brokenCondition?: (ctx: GeJuContext) => string | null
  /** 可信度计算 */
  calcConfidence: (ctx: GeJuContext) => number
  /** 清纯度计算 */
  calcPurity: (ctx: GeJuContext) => number
  /** 格局描述 */
  description: (ctx: GeJuContext) => string
  /** 格局建议 */
  advice: (ctx: GeJuContext) => string
  /** 规则来源 */
  source: string
  /** 优先级（数字越高越优先判断） */
  priority: number
}

// 判定上下文
interface GeJuContext {
  chart: BaZiChart
  dayGan: HeavenlyStem
  dayElement: FiveElement
  monthZhi: EarthlyBranch
  monthGan: HeavenlyStem
  monthElement: FiveElement
  yearGan: HeavenlyStem
  yearZhi: EarthlyBranch
  hourGan: HeavenlyStem
  hourZhi: EarthlyBranch
  strengthScore: number
  wangShuai: WuXingWangShuai
  relatedShens: Record<HeavenlyStem, ShenShi>
  fiveElementCount: Record<FiveElement, number>
  allStems: HeavenlyStem[]
  allBranches: EarthlyBranch[]
}

// ========== 辅助函数 ==========

/** 构建判定上下文 */
function buildContext(chart: BaZiChart): GeJuContext {
  const sixLines = chart.sixLines
  const dayGan = chart.dayMaster.dayGan
  const dayElement = chart.dayMaster.dayGanElement
  const monthZhi = sixLines.month.zhi
  const monthElement = BRANCH_ELEMENT[monthZhi]

  // 构建十神映射
  const relatedShens: Record<string, ShenShi> = {}
  for (const stem of HEAVENLY_STEMS) {
    relatedShens[stem] = calcShiShen(dayElement, STEM_ELEMENT[stem], dayGan === stem)
  }

  return {
    chart,
    dayGan,
    dayElement,
    monthZhi,
    monthGan: sixLines.month.gan,
    monthElement,
    yearGan: sixLines.year.gan,
    yearZhi: sixLines.year.zhi,
    hourGan: sixLines.hour.gan,
    hourZhi: sixLines.hour.zhi,
    strengthScore: chart.dayMaster.strengthScore,
    wangShuai: chart.dayMaster.wangShuai,
    relatedShens: relatedShens as Record<HeavenlyStem, ShenShi>,
    fiveElementCount: chart.fiveElementCount as Record<FiveElement, number>,
    allStems: [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan] as HeavenlyStem[],
    allBranches: [sixLines.year.zhi, sixLines.month.zhi, sixLines.day.zhi, sixLines.hour.zhi] as EarthlyBranch[],
  }
}

/** 计算十神关系 */
function calcShiShen(dayEl: FiveElement, targetEl: FiveElement, isSelf: boolean): ShenShi {
  if (isSelf) return dayEl === STEM_ELEMENT[HEAVENLY_STEMS[0]] ? '比肩' : '比肩'
  if (targetEl === dayEl) return '比肩'
  if (targetEl === BE_GENERATE[dayEl]) return '正印'
  if (targetEl === GENERATE[dayEl]) return '食神'
  if (targetEl === BE_OVERCOME[dayEl]) return '正官'
  if (targetEl === OVERCOME[dayEl]) return '正财'
  return '比肩'
}

/** 统计十神数量 */
function countShiShen(ctx: GeJuContext, targetNames: ShenShi[]): number {
  let count = 0
  for (const stem of ctx.allStems) {
    if (stem === ctx.dayGan) continue
    const ss = ctx.relatedShens[stem]
    if (ss && targetNames.includes(ss)) count++
  }
  // 藏干
  for (const branch of ctx.allBranches) {
    const cangGan = CANG_GAN[branch]
    if (!cangGan) continue
    for (const gan of [cangGan.ben, cangGan.zhong, cangGan.yao] as (HeavenlyStem | null)[]) {
      if (!gan || gan === ctx.dayGan) continue
      const ss = ctx.relatedShens[gan]
      if (ss && targetNames.includes(ss)) count += 0.6 // 藏干权重较低
    }
  }
  return count
}

/** 检查某五行力量 */
function elementPower(ctx: GeJuContext, element: FiveElement): number {
  let power = (ctx.fiveElementCount[element] || 0) * 10
  for (const stem of ctx.allStems) {
    if (STEM_ELEMENT[stem] === element) power += 12
  }
  for (const branch of ctx.allBranches) {
    if (BRANCH_ELEMENT[branch] === element) power += 8
  }
  return power
}

/** 检查日主是否有根（在地支中有同类五行） */
function hasRoot(ctx: GeJuContext): boolean {
  const rootBranches = ctx.allBranches.filter(b => BRANCH_ELEMENT[b] === ctx.dayElement)
  return rootBranches.length >= 1
}

/** 检查日主是否有强根 */
function hasStrongRoot(ctx: GeJuContext): boolean {
  const rootBranches = ctx.allBranches.filter(b => BRANCH_ELEMENT[b] === ctx.dayElement)
  if (rootBranches.length === 0) return false
  // 月支同类为强根
  return rootBranches.includes(ctx.monthZhi)
}

/** 统计特定天干是否出现 */
function hasStem(ctx: GeJuContext, stems: HeavenlyStem[]): boolean {
  return ctx.allStems.some(s => stems.includes(s))
}

/** 统计特定地支是否出现 */
function hasBranch(ctx: GeJuContext, branches: EarthlyBranch[]): boolean {
  return ctx.allBranches.some(b => branches.includes(b))
}

/** 统计特定五行力量占比 */
function elementRatio(ctx: GeJuContext, element: FiveElement): number {
  const total = Object.values(ctx.fiveElementCount).reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  return (ctx.fiveElementCount[element] || 0) / total
}

// ========== 30+ 格局规则定义 ==========

function buildGeJuRules(): GeJuRuleV2[] {
  const rules: GeJuRuleV2[] = []

  // ==================== 一、正格系列（8格）====================

  // 1. 正官格
  rules.push({
    name: '正官格', category: 'normal', subCategory: '正官格', source: '《子平真诠》', priority: 70,
    condition: (ctx) => {
      // 月令藏干中正官为当令之气
      const monthCangGan = CANG_GAN[ctx.monthZhi]
      if (!monthCangGan) return false
      const zhengGuan = monthCangGan.ben || monthCangGan.zhong
      return zhengGuan !== null && STEM_ELEMENT[zhengGuan] === BE_OVERCOME[ctx.dayElement]
    },
    brokenCondition: (ctx) => {
      // 伤官破格
      const shangGuanCount = countShiShen(ctx, ['伤官'])
      if (shangGuanCount >= 2) return '伤官见官，破格'
      // 官杀混杂
      const zhengGuanCount = countShiShen(ctx, ['正官'])
      const qiShaCount = countShiShen(ctx, ['偏官'])
      if (zhengGuanCount >= 1 && qiShaCount >= 2) return '官杀混杂，破格'
      return null
    },
    calcConfidence: (ctx) => {
      const count = countShiShen(ctx, ['正官'])
      return Math.min(95, 60 + count * 15)
    },
    calcPurity: (ctx) => {
      const zhengGuanCount = countShiShen(ctx, ['正官'])
      const qiShaCount = countShiShen(ctx, ['偏官'])
      const total = zhengGuanCount + qiShaCount
      if (total === 0) return 50
      return Math.round((zhengGuanCount / total) * 100)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主生于${ctx.monthZhi}月，月令正官当令，取正官格。` +
      `《子平真诠》云：「正官者，乃本气之所禀，周天之星宿也」` +
      `。正官格主人端正严明，处事循规蹈矩，有管理才能。` +
      `喜印星护官，忌伤官破格。官印相生者最贵。`,
    advice: (ctx) =>
      `正官格之人，宜走仕途或从事管理工作。` +
      `为人宜正直守规，不可太过刻板。` +
      `逢官运大发，逢伤官运需谨慎。`,
  })

  // 2. 七杀格
  rules.push({
    name: '七杀格', category: 'normal', subCategory: '七杀格', source: '《子平真诠》', priority: 70,
    condition: (ctx) => {
      const monthCangGan = CANG_GAN[ctx.monthZhi]
      if (!monthCangGan) return false
      const qiSha = monthCangGan.ben || monthCangGan.zhong
      return qiSha !== null && STEM_ELEMENT[qiSha] === BE_OVERCOME[ctx.dayElement]
        && qiSha !== ctx.allStems.find(s => ctx.relatedShens[s] === '正官')
    },
    brokenCondition: (ctx) => {
      const shiShenCount = countShiShen(ctx, ['食神'])
      const yinCount = countShiShen(ctx, ['正印', '偏印'])
      // 七杀无制
      if (shiShenCount < 1 && yinCount < 1) return '七杀无制无化，破格'
      return null
    },
    calcConfidence: (ctx) => {
      const count = countShiShen(ctx, ['偏官'])
      return Math.min(95, 60 + count * 12)
    },
    calcPurity: (ctx) => {
      const qiSha = countShiShen(ctx, ['偏官'])
      const zhengGuan = countShiShen(ctx, ['正官'])
      const total = qiSha + zhengGuan
      if (total === 0) return 50
      return Math.round((qiSha / total) * 100)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主生于${ctx.monthZhi}月，月令七杀当权，取七杀格。` +
      `《三命通会》云：「七杀者，偏官也，主权柄威严」` +
      `。七杀格主人威严肃穆，决断力强，适合军事、法律、管理类工作。` +
      `有食神制杀或印星化杀方为成格。`,
    advice: (ctx) =>
      `七杀格之人，适合从事需要魄力和果断力的职业。` +
      `为人宜刚柔并济，不可太过专横。` +
      `有制化者大发，无制化者多灾。`,
  })

  // 3. 正财格
  rules.push({
    name: '正财格', category: 'normal', subCategory: '正财格', source: '《子平真诠》', priority: 65,
    condition: (ctx) => {
      const monthCangGan = CANG_GAN[ctx.monthZhi]
      if (!monthCangGan) return false
      const zhengCai = monthCangGan.ben || monthCangGan.zhong
      return zhengCai !== null && STEM_ELEMENT[zhengCai] === OVERCOME[ctx.dayElement]
    },
    brokenCondition: (ctx) => {
      const biJieCount = countShiShen(ctx, ['比肩', '劫财'])
      if (biJieCount >= 3) return '比劫争财，破格'
      return null
    },
    calcConfidence: (ctx) => {
      const count = countShiShen(ctx, ['正财'])
      return Math.min(95, 60 + count * 15)
    },
    calcPurity: (ctx) => {
      const zhengCai = countShiShen(ctx, ['正财'])
      const pianCai = countShiShen(ctx, ['偏财'])
      const total = zhengCai + pianCai
      if (total === 0) return 50
      return Math.round((zhengCai / total) * 100)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主生于${ctx.monthZhi}月，月令正财当权，取正财格。` +
      `《子平真诠》云：「正财者，乃月令本气之财，主人勤劳致富」` +
      `。正财格为人踏实稳重，善于理财，收入稳定。` +
      `忌比劫争财，喜食伤生财。`,
    advice: (ctx) =>
      `正财格之人，宜从事稳定的商业或财务工作。` +
      `理财需谨慎，避免高风险投资。` +
      `逢财运大发，逢比劫运需防破财。`,
  })

  // 4. 偏财格
  rules.push({
    name: '偏财格', category: 'normal', subCategory: '偏财格', source: '《子平真诠》', priority: 65,
    condition: (ctx) => {
      const monthCangGan = CANG_GAN[ctx.monthZhi]
      if (!monthCangGan) return false
      const pianCai = monthCangGan.ben || monthCangGan.zhong
      return pianCai !== null && STEM_ELEMENT[pianCai] === OVERCOME[ctx.dayElement]
    },
    brokenCondition: (ctx) => {
      const biJieCount = countShiShen(ctx, ['比肩', '劫财'])
      if (biJieCount >= 3) return '比劫争财，破格'
      return null
    },
    calcConfidence: (ctx) => Math.min(90, 55 + countShiShen(ctx, ['偏财']) * 15),
    calcPurity: (ctx) => {
      const pianCai = countShiShen(ctx, ['偏财'])
      const zhengCai = countShiShen(ctx, ['正财'])
      const total = pianCai + zhengCai
      if (total === 0) return 50
      return Math.round((pianCai / total) * 100)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主生于${ctx.monthZhi}月，月令偏财当权，取偏财格。` +
      `《三命通会》云：「偏财者，众人之财，主横发」` +
      `。偏财格为人豪爽大方，善交际，财运多变但终可获丰。`,
    advice: (ctx) =>
      `偏财格之人，适合经商投资，善于抓住机遇。` +
      `理财需节制，不可过于豪爽。` +
      `逢财运大发，注意不要挥霍。`,
  })

  // 5. 食神格
  rules.push({
    name: '食神格', category: 'normal', subCategory: '食神格', source: '《子平真诠》', priority: 68,
    condition: (ctx) => {
      const monthCangGan = CANG_GAN[ctx.monthZhi]
      if (!monthCangGan) return false
      const shiShen = monthCangGan.ben || monthCangGan.zhong
      return shiShen !== null && STEM_ELEMENT[shiShen] === GENERATE[ctx.dayElement]
    },
    brokenCondition: (ctx) => {
      const pianYinCount = countShiShen(ctx, ['偏印'])
      if (pianYinCount >= 2) return '枭印夺食，破格'
      return null
    },
    calcConfidence: (ctx) => Math.min(90, 55 + countShiShen(ctx, ['食神']) * 15),
    calcPurity: (ctx) => {
      const shiShen = countShiShen(ctx, ['食神'])
      const shangGuan = countShiShen(ctx, ['伤官'])
      const total = shiShen + shangGuan
      if (total === 0) return 50
      return Math.round((shiShen / total) * 100)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主生于${ctx.monthZhi}月，月令食神当权，取食神格。` +
      `《三命通会》云：「食神者，福气之星也，主食禄寿考」` +
      `。食神格为福星高照之命，主人聪明温厚，衣食不愁。` +
      `忌枭印夺食，喜财星护食。`,
    advice: (ctx) =>
      `食神格之人，适合从事文艺、教育、餐饮等行业。` +
      `一生衣食丰足，少灾少难。` +
      `逢枭印运需注意健康和子女。`,
  })

  // 6. 伤官格
  rules.push({
    name: '伤官格', category: 'normal', subCategory: '伤官格', source: '《子平真诠》', priority: 68,
    condition: (ctx) => {
      const monthCangGan = CANG_GAN[ctx.monthZhi]
      if (!monthCangGan) return false
      const shangGuan = monthCangGan.ben || monthCangGan.zhong
      return shangGuan !== null && STEM_ELEMENT[shangGuan] === GENERATE[ctx.dayElement]
    },
    brokenCondition: (ctx) => {
      const zhengGuanCount = countShiShen(ctx, ['正官'])
      if (zhengGuanCount >= 1) return '伤官见官，破格'
      return null
    },
    calcConfidence: (ctx) => Math.min(90, 55 + countShiShen(ctx, ['伤官']) * 15),
    calcPurity: (ctx) => {
      const shangGuan = countShiShen(ctx, ['伤官'])
      const shiShen = countShiShen(ctx, ['食神'])
      const total = shangGuan + shiShen
      if (total === 0) return 50
      return Math.round((shangGuan / total) * 100)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主生于${ctx.monthZhi}月，月令伤官当权，取伤官格。` +
      `《子平真诠》云：「伤官者，我生之异性，主人聪明傲物」` +
      `。伤官格主人才华横溢，思维敏捷，但性格叛逆。` +
      `伤官佩印者贵，伤官见官者凶。`,
    advice: (ctx) =>
      `伤官格之人，适合自由职业或技术专家路线。` +
      `才华出众但需注意人际沟通。` +
      `佩印运大发，见官运需谨慎。`,
  })

  // 7. 正印格
  rules.push({
    name: '正印格', category: 'normal', subCategory: '正印格', source: '《子平真诠》', priority: 66,
    condition: (ctx) => {
      const monthCangGan = CANG_GAN[ctx.monthZhi]
      if (!monthCangGan) return false
      const zhengYin = monthCangGan.ben || monthCangGan.zhong
      return zhengYin !== null && STEM_ELEMENT[zhengYin] === BE_GENERATE[ctx.dayElement]
    },
    brokenCondition: (ctx) => {
      const caiCount = countShiShen(ctx, ['正财', '偏财'])
      if (caiCount >= 3) return '财星破印，破格'
      return null
    },
    calcConfidence: (ctx) => Math.min(90, 55 + countShiShen(ctx, ['正印']) * 15),
    calcPurity: (ctx) => {
      const zhengYin = countShiShen(ctx, ['正印'])
      const pianYin = countShiShen(ctx, ['偏印'])
      const total = zhengYin + pianYin
      if (total === 0) return 50
      return Math.round((zhengYin / total) * 100)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主生于${ctx.monthZhi}月，月令正印当权，取正印格。` +
      `《子平真诠》云：「正印者，生我之吉神，主文章学问」` +
      `。正印格为人温文尔雅，好学深思，一生多得贵人提携。` +
      `忌财星破印，喜官星护印。`,
    advice: (ctx) =>
      `正印格之人，适合从事学术、教育、文化工作。` +
      `善于学习，逢印运学业事业双丰收。` +
      `逢财运需防因贪废学。`,
  })

  // 8. 偏印格（枭神格）
  rules.push({
    name: '偏印格', category: 'normal', subCategory: '偏印格', source: '《子平真诠》', priority: 64,
    condition: (ctx) => {
      const monthCangGan = CANG_GAN[ctx.monthZhi]
      if (!monthCangGan) return false
      const pianYin = monthCangGan.ben || monthCangGan.zhong
      return pianYin !== null && STEM_ELEMENT[pianYin] === BE_GENERATE[ctx.dayElement]
    },
    brokenCondition: (ctx) => {
      const shiShenCount = countShiShen(ctx, ['食神'])
      if (shiShenCount >= 1) return '枭印夺食，破格'
      return null
    },
    calcConfidence: (ctx) => Math.min(85, 50 + countShiShen(ctx, ['偏印']) * 15),
    calcPurity: (ctx) => {
      const pianYin = countShiShen(ctx, ['偏印'])
      const zhengYin = countShiShen(ctx, ['正印'])
      const total = pianYin + zhengYin
      if (total === 0) return 50
      return Math.round((pianYin / total) * 100)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主生于${ctx.monthZhi}月，月令偏印当权，取偏印格。` +
      `《三命通会》云：「偏印者，枭神也，主孤僻多变」` +
      `。偏印格主人思维独特，善于逆向思维，适合研究创新工作。` +
      `有制化时为偏印，无制化时为枭神。`,
    advice: (ctx) =>
      `偏印格之人，适合从事研究、发明、艺术创作。` +
      `独立思考能力强，但需注意人际关系。` +
      `有制化运大发，无制化运多孤独。`,
  })

  // ==================== 二、从格系列（4格）====================

  // 9. 从强格
  rules.push({
    name: '从强格', category: 'congenital', subCategory: '从强格', source: '《子平真诠》', priority: 80,
    condition: (ctx) => {
      // 日主极旺，无官杀克制
      return ctx.strengthScore >= 75 && !hasStem(ctx, ctx.allStems.filter(s => STEM_ELEMENT[s] === BE_OVERCOME[ctx.dayElement]))
    },
    brokenCondition: (ctx) => {
      if (hasStrongRoot(ctx) && countShiShen(ctx, ['正官', '偏官']) >= 1) return '有官杀克制，不成从格'
      return null
    },
    calcConfidence: (ctx) => Math.min(95, ctx.strengthScore + 10),
    calcPurity: (ctx) => {
      const enemyCount = countShiShen(ctx, ['正官', '偏官', '正财', '偏财'])
      return Math.max(20, 100 - enemyCount * 20)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主极旺，四柱皆同类帮扶，无官杀克制，成从强格。` +
      `《子平真诠》云：「从强者，顺势而从也」` +
      `。从强之命，宜顺水推舟，不可逆势而为。` +
      `喜走比劫印星之运，忌官杀财星之运。`,
    advice: (ctx) =>
      `从强格之人，宜顺势发展，不宜强出头。` +
      `事业宜走大平台，借助集体力量。` +
      `忌走官运财运，喜走比劫运。`,
  })

  // 10. 从弱格（弃命从势）
  rules.push({
    name: '从弱格', category: 'congenital', subCategory: '从弱格', source: '《子平真诠》', priority: 80,
    condition: (ctx) => {
      return ctx.strengthScore <= 25 && !hasRoot(ctx)
    },
    brokenCondition: (ctx) => {
      if (hasRoot(ctx)) return '日主有根，不成从格'
      return null
    },
    calcConfidence: (ctx) => Math.min(95, 100 - ctx.strengthScore + 15),
    calcPurity: (ctx) => {
      const friendCount = countShiShen(ctx, ['比肩', '劫财', '正印', '偏印'])
      return Math.max(20, 100 - friendCount * 25)
    },
    description: (ctx) =>
      `${ctx.dayGan}日主极弱，无根无帮，弃命从势，成从弱格。` +
      `《子平真诠》云：「从弱者，日主无力，从势而从之」` +
      `。从弱之命，宜借力发展，以异党为用。` +
      `喜走官杀财星食伤之运，忌印比之运。`,
    advice: (ctx) =>
      `从弱格之人，宜在外地发展，借助他人力量。` +
      `事业宜选择需要合作的项目。` +
      `忌印比运，喜官财运。`,
  })

  // 11. 从财格
  rules.push({
    name: '从财格', category: 'congenital', subCategory: '从财格', source: '《子平真诠》', priority: 82,
    condition: (ctx) => {
      const caiPower = elementPower(ctx, OVERCOME[ctx.dayElement])
      return ctx.strengthScore <= 30 && !hasRoot(ctx) && caiPower >= 50
    },
    brokenCondition: (ctx) => {
      if (hasRoot(ctx)) return '日主有根，不成从财格'
      return null
    },
    calcConfidence: (ctx) => Math.min(95, 50 + elementPower(ctx, OVERCOME[ctx.dayElement]) / 3),
    calcPurity: (ctx) => Math.min(100, elementPower(ctx, OVERCOME[ctx.dayElement])),
    description: (ctx) =>
      `${ctx.dayGan}日主极弱，命局财星旺盛，弃命从财，成从财格。` +
      `《子平真诠》云：「弃命从财，富贵可期」` +
      `。从财格之人，一生与财有缘，经商致富。` +
      `喜财运食伤运，忌印比运。`,
    advice: (ctx) =>
      `从财格之人，最适合经商投资，财富来势汹涌。` +
      `事业宜走金融、商业路线。` +
      `逢财运大发，逢印比运需防破财。`,
  })

  // 12. 从官格（从杀格）
  rules.push({
    name: '从官格', category: 'congenital', subCategory: '从官格', source: '《子平真诠》', priority: 82,
    condition: (ctx) => {
      const guanPower = elementPower(ctx, BE_OVERCOME[ctx.dayElement])
      return ctx.strengthScore <= 30 && !hasRoot(ctx) && guanPower >= 50
    },
    brokenCondition: (ctx) => {
      if (hasRoot(ctx)) return '日主有根，不成从官格'
      return null
    },
    calcConfidence: (ctx) => Math.min(95, 50 + elementPower(ctx, BE_OVERCOME[ctx.dayElement]) / 3),
    calcPurity: (ctx) => Math.min(100, elementPower(ctx, BE_OVERCOME[ctx.dayElement])),
    description: (ctx) =>
      `${ctx.dayGan}日主极弱，命局官杀旺盛，弃命从官，成从官格。` +
      `《三命通会》云：「弃命从官，非贵即荣」` +
      `。从官格之人，宜从政或从事管理，可掌握实权。` +
      `喜官杀印运，忌食伤财运。`,
    advice: (ctx) =>
      `从官格之人，适合在体制内发展，或从事管理执法类工作。` +
      `贵人运好，仕途有望。` +
      `逢官运大发，逢食伤运需防口舌。`,
  })

  // ==================== 三、化气格（5格）====================

  // 天干五合化气规则
  const HUA_RULES: { combo: [HeavenlyStem, HeavenlyStem]; name: string; element: FiveElement }[] = [
    { combo: ['甲', '己'], name: '甲己化土格', element: '土' },
    { combo: ['乙', '庚'], name: '乙庚化金格', element: '金' },
    { combo: ['丙', '辛'], name: '丙辛化水格', element: '水' },
    { combo: ['丁', '壬'], name: '丁壬化木格', element: '木' },
    { combo: ['戊', '癸'], name: '戊癸化火格', element: '火' },
  ]

  for (const hr of HUA_RULES) {
    rules.push({
      name: hr.name, category: 'transformed', subCategory: hr.name, source: '《三命通会》', priority: 75,
      condition: (ctx) => {
        // 天干有合 + 化神得月令
        return hasStem(ctx, hr.combo) && ctx.monthElement === hr.element
      },
      brokenCondition: (ctx) => {
        // 冲合之神
        if (ctx.monthElement !== hr.element) return '化神不得月令，不成化气格'
        return null
      },
      calcConfidence: (ctx) => {
        const bothPresent = ctx.allStems.includes(hr.combo[0]) && ctx.allStems.includes(hr.combo[1])
        return bothPresent && ctx.monthElement === hr.element ? 85 : 50
      },
      calcPurity: (ctx) => ctx.monthElement === hr.element ? 85 : 40,
      description: (ctx) =>
        `天干${hr.combo[0]}${hr.combo[1]}相合，化气为${hr.element}，月令${ctx.monthZhi}属${hr.element}，` +
        `化神得令，成${hr.name}。` +
        `《三命通会》云：「天干合化，化神得令方真」` +
        `。化气格主人浑厚/刚毅/聪慧/仁慈/热情（按五行论），命运因此改观。`,
      advice: (ctx) =>
        `${hr.name}之人，行事宜顺应化气${hr.element}之性。` +
        `喜走${hr.element}之运，忌冲克化神之运。` +
        `化气成真者，命运层次提升。`,
    })
  }

  // ==================== 四、专旺格（5格）====================

  const ZHUAN_WANG_RULES: { name: string; element: FiveElement; branches: EarthlyBranch[]; desc: string }[] = [
    { name: '曲直格', element: '木', branches: ['寅', '卯', '辰'], desc: '曲直格者，寅卯辰全，木势成林' },
    { name: '炎上格', element: '火', branches: ['巳', '午', '未'], desc: '炎上格者，巳午未全，火势燎原' },
    { name: '稼穑格', element: '土', branches: ['辰', '戌', '丑', '未'], desc: '稼穑格者，辰戌丑未全，土势敦厚' },
    { name: '从革格', element: '金', branches: ['申', '酉', '戌'], desc: '从革格者，申酉戌全，金势肃杀' },
    { name: '润下格', element: '水', branches: ['亥', '子', '丑'], desc: '润下格者，亥子丑全，水势浩荡' },
  ]

  for (const zr of ZHUAN_WANG_RULES) {
    rules.push({
      name: zr.name, category: 'special', subCategory: zr.name, source: '《三命通会》', priority: 78,
      condition: (ctx) => {
        // 日主为该五行 + 四柱地支该五行旺 + 身旺
        if (ctx.dayElement !== zr.element) return false
        const matchedBranches = ctx.allBranches.filter(b => zr.branches.includes(b))
        return matchedBranches.length >= 3 && ctx.strengthScore >= 70
      },
      brokenCondition: (ctx) => {
        const enemyEl: FiveElement[] = (['木', '火', '土', '金', '水'] as FiveElement[]).filter(e => e !== zr.element)
        for (const el of enemyEl) {
          if (elementPower(ctx, el) >= 40) return `${el}气过重，破专旺格`
        }
        return null
      },
      calcConfidence: (ctx) => {
        const matched = ctx.allBranches.filter(b => zr.branches.includes(b)).length
        return Math.min(95, matched * 25 + 20)
      },
      calcPurity: (ctx) => {
        const ownPower = elementPower(ctx, zr.element)
        const totalPower = FIVE_ELEMENTS.reduce((sum, el) => sum + elementPower(ctx, el), 0)
        return totalPower > 0 ? Math.round((ownPower / totalPower) * 100) : 50
      },
      description: (ctx) =>
        `${ctx.dayGan}${zr.element}日主，地支见${zr.branches.filter(b => ctx.allBranches.includes(b)).join('、')}，` +
        `${zr.desc}，成${zr.name}。` +
        `《三命通会》云：「专旺格者，一气专旺，势不可挡」` +
        `。专旺格之人，专注一领域，可得大成就。`,
      advice: (ctx) =>
        `${zr.name}之人，宜深耕${zr.element}所代表的行业领域。` +
        `不可分散精力，专注则成，分散则败。` +
        `喜走同五行之运。`,
    })
  }

  // ==================== 五、特殊格（3格）====================

  // 13. 天元一气格
  rules.push({
    name: '天元一气格', category: 'special', subCategory: '天元一气格', source: '《三命通会》', priority: 85,
    condition: (ctx) => {
      return ctx.allStems.every(s => s === ctx.dayGan)
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => 95,
    calcPurity: (ctx) => 100,
    description: (ctx) =>
      `四柱天干皆为${ctx.dayGan}，天元一气。` +
      `《三命通会》云：「天元一气，清奇之格，非富即贵」` +
      `。此格极为罕见，主人一生专注一事，命运格局清奇。`,
    advice: (ctx) =>
      `天元一气格之人，宜选择专业领域深耕。` +
      `人生格局清奇，不可用常理推断。` +
      `宜从命理整体判断运势。`,
  })

  // 14. 两气成像格（两神成象）
  rules.push({
    name: '两气成像格', category: 'special', subCategory: '两气成像格', source: '《子平真诠》', priority: 72,
    condition: (ctx) => {
      const present = FIVE_ELEMENTS.filter(el => elementPower(ctx, el) > 10)
      return present.length === 2 && present.every(el => elementPower(ctx, el) >= 30)
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => {
      const present = FIVE_ELEMENTS.filter(el => elementPower(ctx, el) > 10)
      return present.length === 2 ? 80 : 40
    },
    calcPurity: (ctx) => {
      const present = FIVE_ELEMENTS.filter(el => elementPower(ctx, el) > 10)
      if (present.length !== 2) return 40
      const p1 = elementPower(ctx, present[0])
      const p2 = elementPower(ctx, present[1])
      const total = p1 + p2
      return total > 0 ? Math.round((Math.abs(p1 - p2) < 10 ? 90 : 60)) : 50
    },
    description: (ctx) =>
      `命局仅两种五行对立，成两气成像格。` +
      `《子平真诠》云：「两气成象，清则贵，浊则富」` +
      `。此格主人一生与某一领域结缘极深，非此即彼。`,
    advice: (ctx) =>
      `两气成像格之人，一生事业多集中在两个领域。` +
      `宜把握主导五行，顺势发展。` +
      `清格主贵，浊格主富。`,
  })

  // 15. 刑冲破害格
  rules.push({
    name: '刑冲破害格', category: 'special', subCategory: '刑冲破害格', source: '《渊海子平》', priority: 60,
    condition: (ctx) => {
      const chongPairs: [EarthlyBranch, EarthlyBranch][] = [
        ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
      ]
      let chongCount = 0
      for (const [a, b] of chongPairs) {
        if (ctx.allBranches.includes(a) && ctx.allBranches.includes(b)) chongCount++
      }
      return chongCount >= 2
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => {
      const chongPairs: [EarthlyBranch, EarthlyBranch][] = [
        ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
      ]
      let count = 0
      for (const [a, b] of chongPairs) {
        if (ctx.allBranches.includes(a) && ctx.allBranches.includes(b)) count++
      }
      return Math.min(90, count * 25 + 30)
    },
    calcPurity: (ctx) => 50,
    description: (ctx) =>
      `命局多冲多刑，成刑冲破害格。` +
      `《渊海子平》云：「刑冲破害，主人多灾多难」` +
      `。此格命局动荡，一生多变，然冲中亦有化合之机。`,
    advice: (ctx) =>
      `刑冲破害格之人，一生多奔波变动。` +
      `宜外出发展，不宜安守一方。` +
      `逢合运可解冲，反主发展。`,
  })

  // ==================== 六、假从格（2格）====================

  // 16. 假从强格
  rules.push({
    name: '假从强格', category: 'pseudo', subCategory: '假从强格', source: '《三命通会》', priority: 62,
    condition: (ctx) => {
      return ctx.strengthScore >= 65 && ctx.strengthScore < 75 && hasRoot(ctx)
    },
    brokenCondition: (ctx) => {
      if (countShiShen(ctx, ['正官', '偏官']) >= 2) return '官杀太重，不成假从'
      return null
    },
    calcConfidence: (ctx) => Math.min(70, ctx.strengthScore - 10),
    calcPurity: (ctx) => 45,
    description: (ctx) =>
      `${ctx.dayGan}日主偏旺但有暗根，看似从强实则不然，成假从强格。` +
      `《三命通会》云：「假从格不如真从格纯粹」` +
      `。假从之命，运势起伏较大，需观大运配合。`,
    advice: (ctx) =>
      `假从强格之人，运途多变，不宜盲目跟风。` +
      `需综合判断真用神，随运而化。` +
      `运至暗根被冲则发力。`,
  })

  // 17. 假从弱格
  rules.push({
    name: '假从弱格', category: 'pseudo', subCategory: '假从弱格', source: '《三命通会》', priority: 62,
    condition: (ctx) => {
      return ctx.strengthScore > 25 && ctx.strengthScore <= 40 && hasRoot(ctx)
    },
    brokenCondition: (ctx) => {
      if (ctx.strengthScore > 40) return '日主有根有力，不成假从'
      return null
    },
    calcConfidence: (ctx) => Math.min(65, 50 - ctx.strengthScore / 2),
    calcPurity: (ctx) => 40,
    description: (ctx) =>
      `${ctx.dayGan}日主偏弱但有弱根，看似从弱实则不然，成假从弱格。` +
      `《三命通会》云：「假从格运至暗根被冲则发」` +
      `。假从之命，需观大运来定真用神。`,
    advice: (ctx) =>
      `假从弱格之人，运途起伏较大，需谨慎行事。` +
      `真用神需根据大运来调整。` +
      `逢吉运可成大器。`,
  })

  // ==================== 七、杂气格（3格）====================

  // 18. 杂气正官格
  rules.push({
    name: '杂气正官格', category: 'miscellaneous', subCategory: '杂气正官格', source: '《子平真诠》', priority: 55,
    condition: (ctx) => {
      // 辰戌丑未月，藏干中有正官
      const zaYue: EarthlyBranch[] = ['辰', '戌', '丑', '未']
      if (!zaYue.includes(ctx.monthZhi)) return false
      const cangGan = CANG_GAN[ctx.monthZhi]
      return cangGan !== undefined &&
        [cangGan.ben, cangGan.zhong, cangGan.yao].some(
          g => g !== null && STEM_ELEMENT[g] === BE_OVERCOME[ctx.dayElement]
        )
    },
    brokenCondition: (ctx) => {
      if (countShiShen(ctx, ['伤官']) >= 2) return '伤官破格'
      return null
    },
    calcConfidence: (ctx) => Math.min(75, 50 + countShiShen(ctx, ['正官']) * 10),
    calcPurity: (ctx) => {
      const zhengGuan = countShiShen(ctx, ['正官'])
      const qiSha = countShiShen(ctx, ['偏官'])
      return (zhengGuan + qiSha) > 0 ? Math.round((zhengGuan / (zhengGuan + qiSha)) * 100) : 50
    },
    description: (ctx) =>
      `月令${ctx.monthZhi}为杂气月，藏干中有正官之气，取杂气正官格。` +
      `《子平真诠》云：「杂气者，辰戌丑未月，藏干复杂」` +
      `。杂气格不如正气格清纯，但仍主贵。`,
    advice: (ctx) =>
      `杂气正官格之人，仕途有希望但可能波折较多。` +
      `需注意人际关系，逢官运可望发展。`,
  })

  // 19. 杂气财格
  rules.push({
    name: '杂气财格', category: 'miscellaneous', subCategory: '杂气财格', source: '《子平真诠》', priority: 55,
    condition: (ctx) => {
      const zaYue = ['辰', '戌', '丑', '未']
      if (!zaYue.includes(ctx.monthZhi)) return false
      const cangGan = CANG_GAN[ctx.monthZhi]
      return cangGan !== undefined &&
        [cangGan.ben, cangGan.zhong, cangGan.yao].some(
          g => g !== null && STEM_ELEMENT[g] === OVERCOME[ctx.dayElement]
        )
    },
    brokenCondition: (ctx) => {
      if (countShiShen(ctx, ['比肩', '劫财']) >= 3) return '比劫争财'
      return null
    },
    calcConfidence: (ctx) => Math.min(75, 50 + countShiShen(ctx, ['正财', '偏财']) * 10),
    calcPurity: (ctx) => 60,
    description: (ctx) =>
      `月令${ctx.monthZhi}为杂气月，藏干中有财星之气，取杂气财格。` +
      `《子平真诠》云：「杂气财格，财运多曲折但终可获丰」` +
      `。杂气财格主人善于理财，财运较稳。`,
    advice: (ctx) =>
      `杂气财格之人，财运稳定但不宜冒险。` +
      `适合稳健投资，不宜投机。逢财运可进取。`,
  })

  // 20. 杂气印格
  rules.push({
    name: '杂气印格', category: 'miscellaneous', subCategory: '杂气印格', source: '《子平真诠》', priority: 55,
    condition: (ctx) => {
      const zaYue = ['辰', '戌', '丑', '未']
      if (!zaYue.includes(ctx.monthZhi)) return false
      const cangGan = CANG_GAN[ctx.monthZhi]
      return cangGan !== undefined &&
        [cangGan.ben, cangGan.zhong, cangGan.yao].some(
          g => g !== null && STEM_ELEMENT[g] === BE_GENERATE[ctx.dayElement]
        )
    },
    brokenCondition: (ctx) => {
      if (countShiShen(ctx, ['正财', '偏财']) >= 3) return '财星破印'
      return null
    },
    calcConfidence: (ctx) => Math.min(75, 50 + countShiShen(ctx, ['正印', '偏印']) * 10),
    calcPurity: (ctx) => {
      const zhengYin = countShiShen(ctx, ['正印'])
      const pianYin = countShiShen(ctx, ['偏印'])
      return (zhengYin + pianYin) > 0 ? Math.round((zhengYin / (zhengYin + pianYin)) * 100) : 50
    },
    description: (ctx) =>
      `月令${ctx.monthZhi}为杂气月，藏干中有印星之气，取杂气印格。` +
      `《子平真诠》云：「杂气印格，主人学业有成」` +
      `。杂气印格虽不如正气印格清纯，但仍主学业发达。`,
    advice: (ctx) =>
      `杂气印格之人，适合从事教育学术工作。` +
      `逢印运学业事业双丰收。忌财运破印。`,
  })

  // ==================== 八、兼格（6格）====================

  // 21. 官印相生格
  rules.push({
    name: '官印相生格', category: 'combined', subCategory: '官印相生格', source: '《三命通会》', priority: 68,
    condition: (ctx) => {
      return countShiShen(ctx, ['正官']) >= 1 && countShiShen(ctx, ['正印']) >= 1
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => Math.min(90, countShiShen(ctx, ['正官']) * 20 + countShiShen(ctx, ['正印']) * 20),
    calcPurity: (ctx) => 75,
    description: (ctx) =>
      `命局正官正印并见，官印相生，成官印相生格。` +
      `《三命通会》云：「官印相生，非富即贵」` +
      `。此格主人有权有柄，仕途有望，贵人提携。`,
    advice: (ctx) =>
      `官印相生格之人，适合走仕途或管理路线。` +
      `一生多贵人，逢官印运大发。`,
  })

  // 22. 杀印相生格
  rules.push({
    name: '杀印相生格', category: 'combined', subCategory: '杀印相生格', source: '《三命通会》', priority: 68,
    condition: (ctx) => {
      return countShiShen(ctx, ['偏官']) >= 1 && countShiShen(ctx, ['正印', '偏印']) >= 1
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => Math.min(90, countShiShen(ctx, ['偏官']) * 20 + countShiShen(ctx, ['正印', '偏印']) * 15),
    calcPurity: (ctx) => 70,
    description: (ctx) =>
      `命局七杀印星并见，杀印相生，成杀印相生格。` +
      `《子平真诠》云：「杀印相生，转祸为福」` +
      `。七杀本凶，得印化之，反为权力之源。`,
    advice: (ctx) =>
      `杀印相生格之人，适合军警法律等需要魄力的行业。` +
      `有化险为夷的命格特征。逢印运可化杀为权。`,
  })

  // 23. 食伤生财格
  rules.push({
    name: '食伤生财格', category: 'combined', subCategory: '食伤生财格', source: '《子平真诠》', priority: 66,
    condition: (ctx) => {
      return (countShiShen(ctx, ['食神', '伤官']) >= 1) && (countShiShen(ctx, ['正财', '偏财']) >= 1)
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => Math.min(90, countShiShen(ctx, ['食神', '伤官']) * 15 + countShiShen(ctx, ['正财', '偏财']) * 15),
    calcPurity: (ctx) => 75,
    description: (ctx) =>
      `命局食伤与财星并见，食伤生财，成食伤生财格。` +
      `《子平真诠》云：「食伤生财，富贵自天排」` +
      `。此格以才华创造财富，主人才商兼备。`,
    advice: (ctx) =>
      `食伤生财格之人，适合创业或从事创意产业。` +
      `才财兼备，逢食财运大发。`,
  })

  // 24. 财生官杀格
  rules.push({
    name: '财生官杀格', category: 'combined', subCategory: '财生官杀格', source: '《三命通会》', priority: 66,
    condition: (ctx) => {
      return (countShiShen(ctx, ['正财', '偏财']) >= 1) && (countShiShen(ctx, ['正官', '偏官']) >= 1)
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => Math.min(90, countShiShen(ctx, ['正财', '偏财']) * 15 + countShiShen(ctx, ['正官', '偏官']) * 15),
    calcPurity: (ctx) => 70,
    description: (ctx) =>
      `命局财星与官杀并见，财生官杀，成财生官杀格。` +
      `《三命通会》云：「财为官之根，官为财之护」` +
      `。此格主人富而且贵，财运官运双通。`,
    advice: (ctx) =>
      `财生官杀格之人，适合经商从政两相宜。` +
      `财官双全，命运层次较高。`,
  })

  // 25. 食神制杀格
  rules.push({
    name: '食神制杀格', category: 'combined', subCategory: '食神制杀格', source: '《三命通会》', priority: 70,
    condition: (ctx) => {
      return countShiShen(ctx, ['食神']) >= 1 && countShiShen(ctx, ['偏官']) >= 1
    },
    brokenCondition: (ctx) => {
      if (countShiShen(ctx, ['偏印']) >= 1) return '枭印夺食，制杀之力减弱'
      return null
    },
    calcConfidence: (ctx) => Math.min(90, countShiShen(ctx, ['食神']) * 20 + countShiShen(ctx, ['偏官']) * 15),
    calcPurity: (ctx) => 75,
    description: (ctx) =>
      `命局食神与七杀并见，食神制杀，成食神制杀格。` +
      `《三命通会》云：「食神制杀，英雄独压万人」` +
      `。此格主人有将帅之才，武职显贵。`,
    advice: (ctx) =>
      `食神制杀格之人，适合军事、法律、管理等行业。` +
      `以智慧化解危机，逢食神运大发。`,
  })

  // 26. 伤官佩印格
  rules.push({
    name: '伤官佩印格', category: 'combined', subCategory: '伤官佩印格', source: '《三命通会》', priority: 69,
    condition: (ctx) => {
      return countShiShen(ctx, ['伤官']) >= 1 && countShiShen(ctx, ['正印', '偏印']) >= 1
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => Math.min(90, countShiShen(ctx, ['伤官']) * 20 + countShiShen(ctx, ['正印']) * 15),
    calcPurity: (ctx) => 70,
    description: (ctx) =>
      `命局伤官与印星并见，印星制伤，成伤官佩印格。` +
      `《三命通会》云：「伤官佩印，化凶为吉」` +
      `。伤官本凶，得印制约，反成大才。`,
    advice: (ctx) =>
      `伤官佩印格之人，才华出众且行事有度。` +
      `适合从事自由职业或创意产业。逢印运可大展宏图。`,
  })

  // 27. 伤官见财格
  rules.push({
    name: '伤官见财格', category: 'combined', subCategory: '伤官见财格', source: '《子平真诠》', priority: 64,
    condition: (ctx) => {
      return countShiShen(ctx, ['伤官']) >= 1 && countShiShen(ctx, ['正财', '偏财']) >= 1 && countShiShen(ctx, ['正官']) === 0
    },
    brokenCondition: (ctx) => {
      if (countShiShen(ctx, ['正官']) >= 1) return '伤官见官，不成伤官见财'
      return null
    },
    calcConfidence: (ctx) => Math.min(85, countShiShen(ctx, ['伤官']) * 20 + countShiShen(ctx, ['正财', '偏财']) * 12),
    calcPurity: (ctx) => 65,
    description: (ctx) =>
      `命局伤官生财，无正官混杂，成伤官见财格。` +
      `《子平真诠》云：「伤官生财，无官混杂为上」` +
      `。此格主人以才华求财，富贵双全。`,
    advice: (ctx) =>
      `伤官见财格之人，适合经商或自由职业。` +
      `财运亨通，逢食财运大发财。`,
  })

  // 28. 印绶护身格
  rules.push({
    name: '印绶护身格', category: 'combined', subCategory: '印绶护身格', source: '《三命通会》', priority: 62,
    condition: (ctx) => {
      return ctx.strengthScore <= 40 && countShiShen(ctx, ['正印', '偏印']) >= 2
    },
    brokenCondition: (ctx) => {
      if (countShiShen(ctx, ['正财', '偏财']) >= 2) return '财星破印，护身失败'
      return null
    },
    calcConfidence: (ctx) => Math.min(85, countShiShen(ctx, ['正印', '偏印']) * 20),
    calcPurity: (ctx) => 70,
    description: (ctx) =>
      `日主身弱，印星有力护卫，成印绶护身格。` +
      `《三命通会》云：「印绶护身，一生逢凶化吉」` +
      `。此格主人一生多得贵人保护，遇难呈祥。`,
    advice: (ctx) =>
      `印绶护身格之人，一生多遇贵人。` +
      `逢印运事业学业双丰收，忌财运。`,
  })

  // 29. 比劫帮身格
  rules.push({
    name: '比劫帮身格', category: 'combined', subCategory: '比劫帮身格', source: '《渊海子平》', priority: 60,
    condition: (ctx) => {
      return ctx.strengthScore <= 45 && countShiShen(ctx, ['比肩', '劫财']) >= 2 && hasRoot(ctx)
    },
    brokenCondition: () => null,
    calcConfidence: (ctx) => Math.min(80, countShiShen(ctx, ['比肩', '劫财']) * 15),
    calcPurity: (ctx) => 55,
    description: (ctx) =>
      `日主身弱，比劫帮身有力，成比劫帮身格。` +
      `《渊海子平》云：「比劫帮身，可担财官」` +
      `。此格主人有兄弟朋友帮助，遇困难有人扶持。`,
    advice: (ctx) =>
      `比劫帮身格之人，宜借助团队力量发展。` +
      `逢比劫运事业合作顺利。注意防比劫争财。`,
  })

  // 30. 财官双美格
  rules.push({
    name: '财官双美格', category: 'combined', subCategory: '财官双美格', source: '《三命通会》', priority: 73,
    condition: (ctx) => {
      return countShiShen(ctx, ['正财']) >= 1 && countShiShen(ctx, ['正官']) >= 1 && ctx.strengthScore >= 40 && ctx.strengthScore <= 65
    },
    brokenCondition: (ctx) => {
      if (countShiShen(ctx, ['伤官']) >= 1) return '伤官见官，财官不美'
      if (countShiShen(ctx, ['比肩', '劫财']) >= 2) return '比劫争财，财官不美'
      return null
    },
    calcConfidence: (ctx) => Math.min(95, countShiShen(ctx, ['正财']) * 20 + countShiShen(ctx, ['正官']) * 20 + 20),
    calcPurity: (ctx) => {
      const noSha = countShiShen(ctx, ['偏官']) === 0
      const noShang = countShiShen(ctx, ['伤官']) === 0
      return (noSha && noShang) ? 90 : 65
    },
    description: (ctx) =>
      `命局正财正官并见，清纯无损，成财官双美格。` +
      `《三命通会》云：「财官双美，非富则贵」` +
      `。此格为命理中上等格局，主人富而且贵。`,
    advice: (ctx) =>
      `财官双美格之人，事业财运双丰收。` +
      `宜走仕途或正规行业。逢财官运大发。`,
  })

  return rules
}

// ========== 缓存规则 ==========

let _rules: GeJuRuleV2[] | null = null

function getGeJuRules(): GeJuRuleV2[] {
  if (!_rules) {
    _rules = buildGeJuRules()
  }
  return _rules
}

// ========== 核心导出函数 ==========

/**
 * 判定命局格局（V2升级版）
 * 30+ 格局判定，基于真实命理规则
 */
export function determineGeJuV2(chart: BaZiChart): GeJuResultV2 {
  const ctx = buildContext(chart)
  const rules = getGeJuRules()

  // 按优先级排序，逐个判断
  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)
  const results: { rule: GeJuRuleV2; confidence: number; purity: number; broken: boolean; brokenReason?: string }[] = []

  for (const rule of sortedRules) {
    if (rule.condition(ctx)) {
      const confidence = rule.calcConfidence(ctx)
      const purity = rule.calcPurity(ctx)
      const brokenResult = rule.brokenCondition?.(ctx)
      const broken = brokenResult !== null && brokenResult !== undefined

      results.push({
        rule,
        confidence: Math.round(confidence),
        purity: Math.round(purity),
        broken,
        brokenReason: broken ? brokenResult : undefined,
      })
    }
  }

  // 取可信度最高的为主格
  results.sort((a, b) => {
    // 优先未破格的
    if (a.broken !== b.broken) return a.broken ? 1 : -1
    return b.confidence - a.confidence
  })

  const best = results[0]
  if (!best) {
    // 无格局命中，返回普通格局
    return {
      name: '普通格局',
      category: 'normal',
      subCategory: '普通格局',
      confidence: 30,
      purity: 30,
      broken: false,
      description: `${ctx.dayGan}日主，命局无明显格局特征，取普通格局。` +
        `《子平真诠》云：「无格者，以扶抑为用」` +
        `。普通格局之人，命运层次取决于五行平衡和喜用神是否得力。`,
      advice: `普通格局之人，需综合分析五行喜忌。` +
        `以扶抑用神为主，调候为辅。大运流年配合喜用神则吉。`,
      matchedRules: [],
      subGeJu: [],
    }
  }

  // 副格（第二及以后匹配到的格局）
  const subGeJu: GeJuResultV2[] = results.slice(1, 4).map(r => ({
    name: r.rule.name,
    category: r.rule.category,
    subCategory: r.rule.subCategory,
    confidence: r.confidence,
    purity: r.purity,
    broken: r.broken,
    brokenReason: r.brokenReason,
    description: r.rule.description(ctx),
    advice: r.rule.advice(ctx),
    matchedRules: [r.rule.name],
    subGeJu: [],
  }))

  return {
    name: best.rule.name,
    category: best.rule.category,
    subCategory: best.rule.subCategory,
    confidence: best.confidence,
    purity: best.purity,
    broken: best.broken,
    brokenReason: best.brokenReason,
    description: best.rule.description(ctx),
    advice: best.rule.advice(ctx),
    matchedRules: [best.rule.name, ...results.slice(1).map(r => r.rule.name)],
    subGeJu,
  }
}

/**
 * 获取所有支持的格局列表
 */
export function getGeJuListV2(): string[] {
  const rules = getGeJuRules()
  return rules.map(r => r.name)
}

// ========== 导出 ==========

export { buildContext, getGeJuRules }
export type { GeJuContext, GeJuRuleV2 }
