/**
 * CareerEngine — P2-3.7 事业引擎
 *
 * 基于日主五行、旺衰、用神、格局综合分析适合的行业方向。
 *
 * 核心思路：
 *   1. 用神五行所代表的行业为首选方向
 *   2. 日主五行所代表的行业为备选
 *   3. 身旺喜食伤→适合创意、技术、管理；身弱喜印比→适合稳定、协作、教育
 *   4. 格局高低影响事业天花板
 *   5. 管理能力看官杀与日主力量对比
 *   6. 创业能力看偏财与食伤是否为用
 *
 * Plugin 接入，不修改 Kernel。
 */

import type { FiveElement } from '../../types'
import { GENERATE } from '../../../core'

// ─── 类型定义 ───

export interface CareerSuggestion {
  industry: string
  roles: string[]
  reason: string
  matchScore: number
}

export interface CareerResult {
  suggestions: CareerSuggestion[]
  bestDirection: string
  managementScore: number
  entrepreneurshipScore: number
  stabilityScore: number
  classicalRef: string
}

// ─── 行业映射（按五行） ───

const INDUSTRY_MAP: Record<FiveElement, { industry: string; roles: string[] }> = {
  '木': {
    industry: '教育、出版、农业、林业、家具、服装、文创、环保',
    roles: ['教师', '作家', '编辑', '设计师', '园艺师', '环保工程师', '农业技术员', '服装设计师'],
  },
  '火': {
    industry: '互联网、电子、传媒、娱乐、餐饮、能源、电力、军警',
    roles: ['程序员', '产品经理', '导演', '主持人', '厨师', '电气工程师', '军人', '消防员'],
  },
  '土': {
    industry: '房地产、建筑、矿业、农业、仓储、酒店、咨询、公务员',
    roles: ['建筑师', '房地产经纪人', '矿工程师', '仓库管理', '酒店管理', '咨询师', '公务员', '项目经理'],
  },
  '金': {
    industry: '金融、银行、证券、法律、机械、汽车、外科医疗、安保',
    roles: ['银行家', '律师', '审计师', '机械工程师', '外科医生', '汽车工程师', '证券分析师', '安保经理'],
  },
  '水': {
    industry: '贸易、物流、航运、旅游、传播、广告、心理咨询、渔业',
    roles: ['贸易商', '物流经理', '旅游策划', '广告创意', '心理咨询师', '渔业专家', '航运管理', '公关经理'],
  },
}

// ─── 五行生克 ───

const ALL_ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水']

// ─── 古籍引用库 ───

const CLASSICAL_REFS: Record<FiveElement, string> = {
  '木': '《滴天髓》云："甲木参天，脱胎要火。"木日主以火为食伤，宜就文化教育、创意设计之业，借食伤泄秀以展才华。',
  '火': '《滴天髓》云："丙火猛烈，欺霜侮雪。"火日主光明磊落，宜就互联网、传媒能源之业，以光明之德照耀四方。',
  '土': '《滴天髓》云："戊土固重，既中且正。"土日主厚重稳健，宜就房地产、建筑咨询之业，以厚德载物之姿安顿四方。',
  '金': '《滴天髓》云："庚金带煞，刚健为最。"金日主义薄云天，宜就金融法律、机械军警之业，以果断刚毅之性成大事。',
  '水': '《滴天髓》云："壬水通河，能泄金气。"水日主智慧灵活，宜就贸易物流、旅游传播之业，以流动不居之智通天下。',
}

// ─── 核心引擎 ───

export function analyzeCareer(
  dayElement: FiveElement,
  strengthLevel: string,
  useGodElement: FiveElement,
  geJuName: string,
  elementCount: Record<FiveElement, number>,
): CareerResult {
  const isStrong = strengthLevel.includes('Strong') || strengthLevel === '极旺' || strengthLevel === '偏旺'
  const isWeak = strengthLevel.includes('Weak') || strengthLevel === '极弱' || strengthLevel === '偏弱'
  const isBalanced = !isStrong && !isWeak

  // ─── 1. 用神行业（最高匹配） ───
  const useGodIndustry = INDUSTRY_MAP[useGodElement]
  const suggestions: CareerSuggestion[] = []

  // 用神行业评分：用神越稀缺（数量越少）说明越急需，匹配度越高
  const useGodCount = elementCount[useGodElement] || 0
  const useGodBaseScore = Math.min(95, 70 + (3 - useGodCount) * 8)

  suggestions.push({
    industry: useGodIndustry.industry,
    roles: useGodIndustry.roles.slice(0, 5),
    reason: buildUseGodReason(dayElement, useGodElement, useGodCount),
    matchScore: clamp(useGodBaseScore, 0, 100),
  })

  // ─── 2. 日主行业（次选） ───
  if (useGodElement !== dayElement) {
    const dayIndustry = INDUSTRY_MAP[dayElement]
    const dayCount = elementCount[dayElement] || 0
    const dayBaseScore = isStrong ? 55 : isWeak ? 65 : 60
    suggestions.push({
      industry: dayIndustry.industry,
      roles: dayIndustry.roles.slice(0, 5),
      reason: buildDayElementReason(dayElement, isStrong, isWeak, dayCount),
      matchScore: clamp(dayBaseScore + (2 - Math.min(dayCount, 2)) * 5, 0, 100),
    })
  }

  // ─── 3. 用神所生行业（三选） ───
  const generated = GENERATE[useGodElement]
  if (generated !== dayElement && generated !== useGodElement) {
    const genIndustry = INDUSTRY_MAP[generated]
    suggestions.push({
      industry: genIndustry.industry,
      roles: genIndustry.roles.slice(0, 4),
      reason: `用神${useGodElement}生${generated}，${generated}行业为用神的延伸方向，可辅助用神发挥力量。`,
      matchScore: clamp(50 + (3 - (elementCount[generated] || 0)) * 6, 0, 100),
    })
  }

  // ─── 4. 旺衰调整角色推荐 ───
  if (isStrong) {
    // 身旺喜食伤泄秀、财星耗身
    addStrengthRoles(suggestions, useGodElement)
  } else if (isWeak) {
    // 身弱喜印比生扶
    addWeakRoles(suggestions, useGodElement, dayElement)
  }

  // ─── 5. 管理能力评估 ───
  const managementScore = calcManagementScore(isStrong, isWeak, isBalanced, elementCount, dayElement)

  // ─── 6. 创业能力评估 ───
  const entrepreneurshipScore = calcEntrepreneurshipScore(isStrong, isWeak, elementCount, useGodElement, dayElement)

  // ─── 7. 稳定就业评分 ───
  const stabilityScore = calcStabilityScore(isStrong, isWeak, isBalanced, elementCount, useGodElement, dayElement)

  // ─── 8. 最佳发展方向 ───
  const bestDirection = determineBestDirection(suggestions, managementScore, entrepreneurshipScore)

  // ─── 9. 古籍引用 ───
  const classicalRef = CLASSICAL_REFS[dayElement]

  return {
    suggestions,
    bestDirection,
    managementScore,
    entrepreneurshipScore,
    stabilityScore,
    classicalRef,
  }
}

// ─── 辅助函数 ───

function buildUseGodReason(dayElement: FiveElement, useGodElement: FiveElement, count: number): string {
  const urgency = count <= 1 ? '命局急需' : count === 2 ? '命局需要' : '命局尚需'
  const relation = useGodElement === dayElement
    ? `用神与日主同属${dayElement}，从事${dayElement}性行业可增强自身根基`
    : `日主${dayElement}以${useGodElement}为用，从事${useGodElement}性行业最为有利`
  return `${urgency}${useGodElement}之气，${relation}，能最大限度地发挥命局潜能。`
}

function buildDayElementReason(dayElement: FiveElement, isStrong: boolean, isWeak: boolean, count: number): string {
  if (isStrong) {
    return `日主${dayElement}偏旺，从事${dayElement}性行业虽为本行，但需注意竞争压力较大，建议选择其中需要创造力的细分领域。`
  }
  if (isWeak) {
    return `日主${dayElement}偏弱，从事${dayElement}性行业能借本气助力，但不宜在强竞争环境下硬拼，适合深耕专业领域。`
  }
  return `日主${dayElement}中和，从事${dayElement}性行业可稳健发展，适合在其中寻找与用神交叉的细分方向。`
}

function addStrengthRoles(suggestions: CareerSuggestion[], useGodElement: FiveElement): void {
  const creative = INDUSTRY_MAP['火']
  suggestions.push({
    industry: '创意、技术、战略规划',
    roles: ['技术总监', '产品架构师', '战略顾问', '创意总监', '独立开发者'],
    reason: `身旺之命精力充沛，宜以食伤泄秀，从事创意技术和战略类工作，避免闲置精力。`,
    matchScore: 72,
  })
}

function addWeakRoles(suggestions: CareerSuggestion[], useGodElement: FiveElement, dayElement: FiveElement): void {
  const support = INDUSTRY_MAP[dayElement]
  suggestions.push({
    industry: '教育、培训、行政、研究',
    roles: ['培训师', '行政主管', '研究员', '教务管理', '质量工程师'],
    reason: `身弱之命宜借团队和平台之力，从事需要稳扎稳打的工作，不宜单打独斗。`,
    matchScore: 68,
  })
}

function calcManagementScore(
  isStrong: boolean,
  isWeak: boolean,
  isBalanced: boolean,
  elementCount: Record<FiveElement, number>,
  dayElement: FiveElement,
): number {
  let score = 50

  // 身旺偏刚，有魄力管人，但有专断风险
  if (isStrong) score += 20
  // 身弱则精力不足，管理吃力
  if (isWeak) score -= 10
  // 中和最佳
  if (isBalanced) score += 15

  // 金水多的命主更理性果断，适合管理
  if (elementCount['金'] >= 2) score += 5
  if (elementCount['水'] >= 2) score += 3

  // 火旺则急躁，管理需修炼耐心
  if (elementCount['火'] >= 3) score -= 3

  return clamp(score, 0, 100)
}

function calcEntrepreneurshipScore(
  isStrong: boolean,
  isWeak: boolean,
  elementCount: Record<FiveElement, number>,
  useGodElement: FiveElement,
  dayElement: FiveElement,
): number {
  let score = 40

  // 身旺有根基才扛得住创业风险
  if (isStrong) score += 25
  if (isWeak) score -= 10

  // 用神为财星（土/金，取决于日主）则求财有利
  const wealthElement = getWealthElement(dayElement)
  if (useGodElement === wealthElement) score += 15

  // 水多灵活应变能力强
  if (elementCount['水'] >= 2) score += 8

  // 偏财星多则敢冒险
  // 简化：水主流动冒险
  if (elementCount['水'] >= 3 && elementCount['金'] >= 2) score += 5

  return clamp(score, 0, 100)
}

function calcStabilityScore(
  isStrong: boolean,
  isWeak: boolean,
  isBalanced: boolean,
  elementCount: Record<FiveElement, number>,
  useGodElement: FiveElement,
  dayElement: FiveElement,
): number {
  let score = 50

  // 身弱最宜稳定就业
  if (isWeak) score += 20
  // 身旺则不安分
  if (isStrong) score -= 5
  // 中和稳健
  if (isBalanced) score += 15

  // 土多稳定踏实
  if (elementCount['土'] >= 2) score += 8

  // 木多则变动多
  if (elementCount['木'] >= 3) score -= 5

  // 用神为印星则适合体制内
  const printElement = getPrintElement(dayElement)
  if (useGodElement === printElement) score += 10

  return clamp(score, 0, 100)
}

function getWealthElement(dayElement: FiveElement): FiveElement {
  // 我克者为财：木克土，火克金，土克水，金克木，水克火
  const map: Record<FiveElement, FiveElement> = {
    '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
  }
  return map[dayElement]
}

function getPrintElement(dayElement: FiveElement): FiveElement {
  // 生我者为印：水生木，木生火，火生土，土生金，金生水
  const map: Record<FiveElement, FiveElement> = {
    '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
  }
  return map[dayElement]
}

function determineBestDirection(
  suggestions: CareerSuggestion[],
  managementScore: number,
  entrepreneurshipScore: number,
): string {
  if (entrepreneurshipScore >= 70 && suggestions[0]) {
    return `建议以「${suggestions[0].industry.split('、')[0]}」领域为核心，选择创业或合伙人模式，充分发挥自身开创精神。`
  }
  if (managementScore >= 70 && suggestions[0]) {
    return `建议在「${suggestions[0].industry.split('、')[0]}」领域深耕专业后向管理层发展，以领导力带动事业突破。`
  }
  if (suggestions[0]) {
    return `建议在「${suggestions[0].industry.split('、')[0]}」领域稳扎稳打，先建立专业壁垒，再根据运势变化拓展方向。`
  }
  return '建议结合自身兴趣与市场需求，在用神相关行业中找到适合自己的定位。'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}
