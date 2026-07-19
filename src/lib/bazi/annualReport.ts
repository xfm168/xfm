/**
 * annualReport.ts — 年度运势报告模块
 *
 * 基于命盘数据 + 流年干支与日主的十神关系、喜用神生克、
 * 大运叠加、冲克命盘关键柱等因素，生成 12 个月的详细运势分析。
 * 全部基于模板+数据插值，不调用外部 AI API。
 */

import type {
  BaZiChart,
  FiveElement,
  ShenShi,
  HeavenlyStem,
  EarthlyBranch,
  GanZhi,
} from './types'
import type { DaYunAnalysisResult } from './dayunAnalysis'

// ---------------------------------------------------------------------------
// 接口定义
// ---------------------------------------------------------------------------

export interface AnnualReportInput {
  chart: BaZiChart
  year: number
  xiYongShen?: any
  daYun?: DaYunAnalysisResult
}

export interface AnnualReportMonth {
  month: number              // 1-12
  monthName: string          // "正月" / "二月" 等
  lunarAnimal: string        // 生肖
  overall: { score: number; description: string }
  career: { score: number; description: string }
  wealth: { score: number; description: string }
  relationship: { score: number; description: string }
  health: { score: number; description: string }
  study: { score: number; description: string }
  noble: { score: number; description: string }
  risk: string[]             // 风险提示
  advice: string[]           // 建议
}

export interface AnnualReportResult {
  year: number
  title: string              // "2026丙午年运势总览"
  overallScore: number
  overallLevel: string
  summary: string            // 年度总述，300字
  months: AnnualReportMonth[]
  keyMonths: { type: 'best' | 'worst'; month: number; reason: string }[]
  suggestions: string[]     // 年度建议，5条
}

// ---------------------------------------------------------------------------
// 常量映射表
// ---------------------------------------------------------------------------

/** 天干 */
const HEAVENLY_STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

/** 地支 */
const EARTHLY_BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 生肖 */
const LUNAR_ANIMALS: string[] = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']

/** 农历月份名称 */
const LUNAR_MONTH_NAMES: string[] = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
]

/** 天干五行 */
const STEM_ELEMENT_MAP: Record<HeavenlyStem, FiveElement> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

/** 天干阴阳 */
const STEM_YINYANG_MAP: Record<HeavenlyStem, '阳' | '阴'> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
  '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴',
}

/** 地支五行 */
const BRANCH_ELEMENT_MAP: Record<EarthlyBranch, FiveElement> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

/** 地支方位 */
const BRANCH_DIRECTION_MAP: Record<EarthlyBranch, string> = {
  '子': '正北', '丑': '东北偏北', '寅': '东北', '卯': '正东',
  '辰': '东南偏东', '巳': '东南', '午': '正南', '未': '西南偏南',
  '申': '西南', '酉': '正西', '戌': '西北偏西', '亥': '西北',
}

/** 五行生克关系 */
const ELEMENT_GENERATE: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}
const ELEMENT_OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

/** 十神 → 流年运势关键词 */
const SHISHI_MONTH_CAREER: Record<ShenShi, { score: number; description: string }> = {
  '正官': { score: 80, description: '正官主事，工作顺利，有贵人提拔，适合推进重要项目' },
  '偏官': { score: 70, description: '七杀当值，工作压力增大但机遇并存，需勇挑重担' },
  '正印': { score: 82, description: '正印主事，学业运佳，考试顺利，适合学习和考证' },
  '偏印': { score: 65, description: '偏印主事，思维活跃但容易多想，适合研究但不适合做决策' },
  '食神': { score: 85, description: '食神主事，灵感充沛，创意发挥顺畅，人际关系和谐' },
  '伤官': { score: 60, description: '伤官主事，才华外露但易生口舌，注意言行谨慎' },
  '正财': { score: 83, description: '正财主事，收入稳定，适合谈加薪或签约合同' },
  '偏财': { score: 75, description: '偏财主事，有意外财机，投资可小试牛刀' },
  '比肩': { score: 68, description: '比肩主事，同辈助力，团队合作顺利但竞争加剧' },
  '劫财': { score: 55, description: '劫财主事，注意破财风险，不宜借贷或大额支出' },
}

const SHISHI_MONTH_WEALTH: Record<ShenShi, { score: number; description: string }> = {
  '正官': { score: 70, description: '正官护财，收入稳定，工资性收入为主' },
  '偏官': { score: 60, description: '七杀耗财，不宜冒进投资，以守为攻' },
  '正印': { score: 72, description: '正印生身，财运温和，以积攒为主' },
  '偏印': { score: 58, description: '偏印夺食，注意防止被骗或投资失误' },
  '食神': { score: 85, description: '食神生财，财源广进，偏财运旺' },
  '伤官': { score: 78, description: '伤官生财，有赚钱机会但需防止冲动消费' },
  '正财': { score: 90, description: '正财当令，财源稳定，适合理财规划' },
  '偏财': { score: 88, description: '偏财主事，意外之财可期，投资运佳' },
  '比肩': { score: 55, description: '比肩争财，注意资金管理，避免冲动消费' },
  '劫财': { score: 45, description: '劫财破财，财运低迷，严防被骗和破财' },
}

const SHISHI_MONTH_RELATIONSHIP: Record<ShenShi, { score: number; description: string }> = {
  '正官': { score: 78, description: '正官主贵，异性缘好，单身者有姻缘机遇' },
  '偏官': { score: 65, description: '七杀感情有波折，需多沟通包容' },
  '正印': { score: 80, description: '正印温和，家庭和睦，适合增进亲情' },
  '偏印': { score: 60, description: '偏印主孤，感情中易有孤独感，多陪伴家人' },
  '食神': { score: 85, description: '食神主福，感情甜蜜，适合约会和社交' },
  '伤官': { score: 55, description: '伤官克官，夫妻易有争执，注意言辞' },
  '正财': { score: 82, description: '正财主妻，已婚者感情稳定，家庭幸福' },
  '偏财': { score: 75, description: '偏财主异性缘，桃花较旺，注意界限' },
  '比肩': { score: 70, description: '比肩助力，朋友间感情融洽' },
  '劫财': { score: 50, description: '劫财争合，感情中易有竞争者，需用心经营' },
}

const SHISHI_MONTH_HEALTH: Record<ShenShi, { score: number; description: string }> = {
  '正官': { score: 75, description: '身体状况良好，注意劳逸结合' },
  '偏官': { score: 65, description: '压力大影响健康，注意作息规律' },
  '正印': { score: 82, description: '正印护身，身体状况佳，养生效果显著' },
  '偏印': { score: 68, description: '思虑过多影响睡眠，注意放松心情' },
  '食神': { score: 85, description: '食神主福，食欲好，身体舒适，精力充沛' },
  '伤官': { score: 60, description: '伤官泄气，注意呼吸系统和咽喉' },
  '正财': { score: 78, description: '身体状况平稳，注意饮食卫生' },
  '偏财': { score: 72, description: '偏财耗身，注意不要过度应酬' },
  '比肩': { score: 70, description: '比肩帮身，体力充沛但注意运动安全' },
  '劫财': { score: 58, description: '劫财耗力，注意外伤和意外' },
}

const SHISHI_MONTH_STUDY: Record<ShenShi, { score: number; description: string }> = {
  '正官': { score: 78, description: '正官利于考试，发挥出色，成绩可期' },
  '偏官': { score: 62, description: '压力大影响发挥，需调节心态' },
  '正印': { score: 90, description: '正印主学，记忆力和理解力俱佳，学习效率高' },
  '偏印': { score: 75, description: '偏印主灵感，适合深入研究但常规考试需细心' },
  '食神': { score: 82, description: '食神主才，学习轻松，适合创造性学科' },
  '伤官': { score: 70, description: '伤官主才华但注意力分散，需专注' },
  '正财': { score: 73, description: '财运 distract 注意力，需平衡学习与赚钱' },
  '偏财': { score: 65, description: '偏财扰心，不宜分心他事，专注学习' },
  '比肩': { score: 72, description: '比肩互助，适合小组学习讨论' },
  '劫财': { score: 55, description: '劫财耗神，精力不济，不宜加班学习' },
}

const SHISHI_MONTH_NOBLE: Record<ShenShi, { score: number; description: string }> = {
  '正官': { score: 88, description: '正官主贵人运，有上级或长辈提携' },
  '偏官': { score: 68, description: '七杀当值，贵人不显，需靠自身努力' },
  '正印': { score: 85, description: '正印主贵人，师长和长辈助力大' },
  '偏印': { score: 62, description: '偏印贵人运一般，贵人暗中助力但不明显' },
  '食神': { score: 80, description: '食神主福泽，贵人自然到来' },
  '伤官': { score: 55, description: '伤官与贵人相冲，注意人际关系' },
  '正财': { score: 75, description: '正财主稳，贵人运平稳' },
  '偏财': { score: 72, description: '偏财主社交，贵人多在商业场合' },
  '比肩': { score: 70, description: '朋友助力，同辈贵人运好' },
  '劫财': { score: 50, description: '劫财争贵，易与小人有冲突' },
}

/** 十神 → 风险提示 */
const SHISHI_RISKS: Record<ShenShi, string[]> = {
  '正官': ['不宜过于保守，以免错失良机', '注意不要过度依赖贵人'],
  '偏官': ['注意职场权力斗争', '控制情绪，避免冲动行事', '注意身体疲劳'],
  '正印': ['不宜过于安逸，防止丧失斗志'],
  '偏印': ['注意睡眠质量', '避免胡思乱想影响判断', '不宜做重大决定'],
  '食神': ['注意饮食节制', '不宜过于享乐'],
  '伤官': ['注意言辞，避免口舌是非', '注意呼吸系统健康', '不宜顶撞上级'],
  '正财': ['不宜参与高风险投资', '注意控制消费'],
  '偏财': ['注意防范诈骗', '不宜大额投机', '异性关系需把握分寸'],
  '比肩': ['注意合伙风险', '避免盲目跟风投资', '竞争环境注意保护自己'],
  '劫财': ['严防破财', '不宜借贷担保', '注意人身安全', '远离赌博投机'],
}

/** 十神 → 建议 */
const SHISHI_ADVICE: Record<ShenShi, string[]> = {
  '正官': ['把握贵人提携的机会', '适合推进长期规划', '保持谦逊态度'],
  '偏官': ['勇敢面对挑战', '化压力为动力', '保持冷静判断'],
  '正印': ['适合学习和进修', '多听长辈建议', '保持规律作息'],
  '偏印': ['发挥创意灵感', '适合独立研究', '多阅读充实自己'],
  '食神': ['发挥才华创造价值', '享受生活保持心情愉悦', '多社交扩大人脉'],
  '伤官': ['将才华转化为成果', '注意沟通方式', '适合展示个人能力'],
  '正财': ['做好理财规划', '努力工作回报丰厚', '适合签约合同'],
  '偏财': ['把握投资机会', '扩大社交圈', '见好就收'],
  '比肩': ['寻求合作伙伴', '参加集体活动', '团结朋友共同发展'],
  '劫财': ['保守理财', '避免冒险行为', '控制支出'],
}

// ---------------------------------------------------------------------------
// 核心函数
// ---------------------------------------------------------------------------

export function generateAnnualReport(input: AnnualReportInput): AnnualReportResult {
  const { chart, year } = input
  const dm = chart.dayMaster
  const sl = chart.sixLines

  // 解析喜用神
  const xy = resolveXiYongShen(chart, input.xiYongShen)

  // 计算流年干支
  const yearGanZhi = getYearGanZhi(year)

  // 计算当前大运信息
  const currentDaYun = getCurrentDaYun(input.daYun, year)

  // 生成12个月的运势
  const months = generateMonthlyAnalysis(chart, year, xy, yearGanZhi, currentDaYun)

  // 计算年度总评分
  const scores = months.map(m => m.overall.score)
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  // 确定年度等级
  const overallLevel = getOverallLevel(overallScore)

  // 确定关键月份
  const keyMonths = findKeyMonths(months)

  // 生成年度总述
  const summary = generateYearSummary(chart, year, yearGanZhi, xy, overallScore, currentDaYun)

  // 年度建议
  const suggestions = generateYearSuggestions(chart, year, yearGanZhi, xy, overallScore)

  // 标题
  const title = `${year}${yearGanZhi.gan}${yearGanZhi.zhi}年运势总览`

  return {
    year,
    title,
    overallScore,
    overallLevel,
    summary,
    months,
    keyMonths,
    suggestions,
  }
}

// ---------------------------------------------------------------------------
// 内部函数
// ---------------------------------------------------------------------------

interface ResolvedXiYong {
  happyElements: FiveElement[]
  jiElements: FiveElement[]
  bestElement: FiveElement
}

function resolveXiYongShen(chart: BaZiChart, xiYongShen?: any): ResolvedXiYong {
  const xy = xiYongShen || chart.xiYongShen
  const bestElement: FiveElement = xy.bestElement || xy.firstHappy || '木'
  const happyElements: FiveElement[] = [
    xy.bestElement || xy.firstHappy,
    (xy as any).secondHappy,
    (xy as any).thirdHappy,
    (xy as any).usageElement || (xy as any).firstUsage,
  ].filter((el): el is FiveElement => !!el && ['木', '火', '土', '金', '水'].includes(el))

  const jiElements: FiveElement[] = (xy.avoidedElements || []).filter(
    (el: FiveElement) => ['木', '火', '土', '金', '水'].includes(el)
  )

  return { happyElements, jiElements, bestElement }
}

/** 年份 → 干支 */
function getYearGanZhi(year: number): GanZhi {
  // 以立春（约2月4日）为界，简化处理用全年干支
  const ganIdx = (year - 4) % 10
  const zhiIdx = (year - 4) % 12
  const gan = HEAVENLY_STEMS[ganIdx]
  const zhi = EARTHLY_BRANCHES[zhiIdx]
  return {
    gan,
    zhi,
    element: STEM_ELEMENT_MAP[gan],
    yinYang: STEM_YINYANG_MAP[gan],
    naYin: '',
    shenShi: undefined,
    changSheng: undefined,
  }
}

/** 流月干支（近似计算，基于年干推月干） */
function getMonthGanZhi(yearGan: HeavenlyStem, monthIndex: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  // 月支固定：正月寅、二月卯...
  const zhi = EARTHLY_BRANCHES[(monthIndex + 1) % 12] as EarthlyBranch

  // 月干推算：甲己之年丙作首，乙庚之岁戊为头，
  //          丙辛之年庚开始，丁壬壬寅顺水流，戊癸甲寅好追求
  const yearGanIdx = HEAVENLY_STEMS.indexOf(yearGan)
  const baseGanIdx = [2, 4, 6, 8, 0][yearGanIdx % 5] // 甲→丙(2), 乙→戊(4)...
  const ganIdx = (baseGanIdx + monthIndex) % 10
  const gan = HEAVENLY_STEMS[ganIdx]

  return { gan, zhi }
}

/** 获取日主对某天干的十神关系 */
function getShenShi(dayGan: HeavenlyStem, targetGan: HeavenlyStem): ShenShi {
  if (dayGan === targetGan) return STEM_YINYANG_MAP[dayGan] === STEM_YINYANG_MAP[targetGan] ? '比肩' : '劫财'

  const dayEl = STEM_ELEMENT_MAP[dayGan]
  const dayYY = STEM_YINYANG_MAP[dayGan]
  const targetEl = STEM_ELEMENT_MAP[targetGan]
  const targetYY = STEM_YINYANG_MAP[targetGan]

  // 我生者：食伤
  if (ELEMENT_GENERATE[dayEl] === targetEl) {
    return dayYY === targetYY ? '食神' : '伤官'
  }
  // 我克者：财星
  if (ELEMENT_OVERCOME[dayEl] === targetEl) {
    return dayYY === targetYY ? '偏财' : '正财'
  }
  // 克我者：官杀
  if (ELEMENT_OVERCOME[targetEl] === dayEl) {
    return dayYY === targetYY ? '偏官' : '正官'
  }
  // 生我者：印星
  if (ELEMENT_GENERATE[targetEl] === dayEl) {
    return dayYY === targetYY ? '偏印' : '正印'
  }

  return '比肩'
}

/** 获取当前大运信息 */
function getCurrentDaYun(daYun: DaYunAnalysisResult | undefined, year: number): any | null {
  if (!daYun?.steps?.length) return null
  return daYun.steps.find(s => year >= s.startYear && year <= s.endYear) || null
}

/** 生成12个月运势 */
function generateMonthlyAnalysis(
  chart: BaZiChart,
  year: number,
  xy: ResolvedXiYong,
  yearGanZhi: GanZhi,
  currentDaYun: any
): AnnualReportMonth[] {
  const months: AnnualReportMonth[] = []
  const dm = chart.dayMaster
  const sl = chart.sixLines

  for (let m = 0; m < 12; m++) {
    const monthGZ = getMonthGanZhi(yearGanZhi.gan, m)
    const monthGanSS = getShenShi(dm.dayGan, monthGZ.gan)

    // 流月五行与喜用神的关系
    const monthGanEl = STEM_ELEMENT_MAP[monthGZ.gan]
    const monthZhiEl = BRANCH_ELEMENT_MAP[monthGZ.zhi]

    // 判断流月是否生扶喜用神
    const isHelpful = xy.happyElements.includes(monthGanEl) || xy.happyElements.includes(monthZhiEl)
    const isHarmful = xy.jiElements.includes(monthGanEl) || xy.jiElements.includes(monthZhiEl)

    // 判断流月是否冲克关键柱
    const isClashDay = isClash(monthGZ.zhi, sl.day.zhi)   // 冲日柱→感情
    const isClashMonth = isClash(monthGZ.zhi, sl.month.zhi) // 冲月柱→事业
    const isClashYear = isClash(monthGZ.zhi, sl.year.zhi)   // 冲年柱→健康

    // 大运叠加效应
    const daYunBonus = currentDaYun ? getDaYunBonus(currentDaYun, monthGZ) : 0

    // 计算基础分
    let baseScore = SHISHI_MONTH_CAREER[monthGanSS]?.score || 65

    // 喜用神加成/克制
    if (isHelpful) baseScore += 8
    if (isHarmful) baseScore -= 8

    // 大运加成
    baseScore += daYunBonus

    // 冲克减分
    if (isClashDay) baseScore -= 5
    if (isClashMonth) baseScore -= 4
    if (isClashYear) baseScore -= 3

    // 限制范围
    baseScore = Math.max(25, Math.min(95, baseScore))

    // 生成各维度评分
    const careerScore = adjustScore(SHISHI_MONTH_CAREER[monthGanSS]?.score || 65, isHelpful, isHarmful, isClashMonth, daYunBonus)
    const wealthScore = adjustScore(SHISHI_MONTH_WEALTH[monthGanSS]?.score || 65, isHelpful, isHarmful, false, daYunBonus)
    const relationshipScore = adjustScore(SHISHI_MONTH_RELATIONSHIP[monthGanSS]?.score || 65, isHelpful, isHarmful, isClashDay, daYunBonus)
    const healthScore = adjustScore(SHISHI_MONTH_HEALTH[monthGanSS]?.score || 65, isHelpful, isHarmful, isClashYear, daYunBonus)
    const studyScore = adjustScore(SHISHI_MONTH_STUDY[monthGanSS]?.score || 65, isHelpful, isHarmful, false, daYunBonus)
    const nobleScore = adjustScore(SHISHI_MONTH_NOBLE[monthGanSS]?.score || 65, isHelpful, isHarmful, false, daYunBonus)
    const overallScore = Math.round((careerScore + wealthScore + relationshipScore + healthScore + studyScore + nobleScore) / 6)

    // 生成描述
    const careerDesc = generateDimensionDesc(careerScore, monthGanSS, SHISHI_MONTH_CAREER, isClashMonth, '事业')
    const wealthDesc = generateDimensionDesc(wealthScore, monthGanSS, SHISHI_MONTH_WEALTH, false, '财运')
    const relationshipDesc = generateDimensionDesc(relationshipScore, monthGanSS, SHISHI_MONTH_RELATIONSHIP, isClashDay, '感情')
    const healthDesc = generateDimensionDesc(healthScore, monthGanSS, SHISHI_MONTH_HEALTH, isClashYear, '健康')
    const studyDesc = generateDimensionDesc(studyScore, monthGanSS, SHISHI_MONTH_STUDY, false, '学业')
    const nobleDesc = generateDimensionDesc(nobleScore, monthGanSS, SHISHI_MONTH_NOBLE, false, '贵人运')
    const overallDesc = generateOverallDesc(overallScore, monthGanSS, isHelpful, isHarmful)

    // 风险提示
    const risks = [...(SHISHI_RISKS[monthGanSS] || [])]
    if (isClashDay) risks.push('本月流月冲日柱，感情方面可能有波动')
    if (isClashMonth) risks.push('本月流月冲月柱，事业方面可能有变动')
    if (isClashYear) risks.push('本月流月冲年柱，健康方面需注意')
    if (isHarmful) risks.push(`本月五行冲克喜用神，运势受压`)

    // 建议
    const advices = [...(SHISHI_ADVICE[monthGanSS] || [])]
    if (isHelpful) advices.push(`本月${monthGanEl}行旺，可穿${monthGanEl === '木' ? '绿色' : monthGanEl === '火' ? '红色' : monthGanEl === '土' ? '黄色' : monthGanEl === '金' ? '白色' : '黑色/蓝色'}衣物助运`)
    if (isHarmful) advices.push(`本月忌${monthGanEl}行，宜多接触${xy.bestElement}行元素调和`)

    // 流月生肖
    const monthZhiIdx = EARTHLY_BRANCHES.indexOf(monthGZ.zhi)
    const lunarAnimal = LUNAR_ANIMALS[(monthZhiIdx + 1) % 12] || LUNAR_ANIMALS[monthZhiIdx]

    months.push({
      month: m + 1,
      monthName: LUNAR_MONTH_NAMES[m],
      lunarAnimal,
      overall: { score: overallScore, description: overallDesc },
      career: { score: careerScore, description: careerDesc },
      wealth: { score: wealthScore, description: wealthDesc },
      relationship: { score: relationshipScore, description: relationshipDesc },
      health: { score: healthScore, description: healthDesc },
      study: { score: studyScore, description: studyDesc },
      noble: { score: nobleScore, description: nobleDesc },
      risk: risks.slice(0, 4),
      advice: advices.slice(0, 4),
    })
  }

  return months
}

/** 判断地支是否相冲 */
function isClash(zhi1: EarthlyBranch, zhi2: EarthlyBranch): boolean {
  const CLASH_PAIRS: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '午'], ['丑', '未'], ['寅', '申'],
    ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
  ]
  return CLASH_PAIRS.some(([a, b]) =>
    (zhi1 === a && zhi2 === b) || (zhi1 === b && zhi2 === a)
  )
}

/** 大运叠加加分 */
function getDaYunBonus(daYunStep: any, monthGZ: { gan: HeavenlyStem; zhi: EarthlyBranch }): number {
  if (!daYunStep) return 0
  const bonus = daYunStep.isXi ? 5 : daYunStep.isJi ? -5 : 0
  // 大运与流月同气时额外加分
  if (daYunStep.ganZhi?.gan === monthGZ.gan || daYunStep.ganZhi?.zhi === monthGZ.zhi) {
    return bonus > 0 ? bonus + 3 : bonus - 3
  }
  return bonus
}

/** 调整分数 */
function adjustScore(
  base: number,
  isHelpful: boolean,
  isHarmful: boolean,
  hasClash: boolean,
  daYunBonus: number
): number {
  let score = base
  if (isHelpful) score += 8
  if (isHarmful) score -= 8
  if (hasClash) score -= 5
  score += daYunBonus
  return Math.max(25, Math.min(95, Math.round(score)))
}

/** 生成维度描述 */
function generateDimensionDesc(
  score: number,
  shenShi: ShenShi,
  descMap: Record<ShenShi, { score: number; description: string }>,
  hasClash: boolean,
  dimName: string
): string {
  const baseDesc = descMap[shenShi]?.description || `${dimName}运势平稳`
  const level = score >= 80 ? '运势较旺' : score >= 65 ? '运势平稳' : score >= 50 ? '运势偏弱' : '运势低迷'
  const clashStr = hasClash ? `，因流月冲克需特别留意` : ''
  return `${level}，${baseDesc}${clashStr}。`
}

/** 生成综合描述 */
function generateOverallDesc(
  score: number,
  shenShi: ShenShi,
  isHelpful: boolean,
  isHarmful: boolean
): string {
  const shenShiName = `${shenShi}主事的月份`
  let quality: string
  if (score >= 80) quality = `${shenShiName}，整体运势较好`
  else if (score >= 65) quality = `${shenShiName}，整体运势尚可`
  else if (score >= 50) quality = `${shenShiName}，整体运势一般`
  else quality = `${shenShiName}，整体运势偏弱`

  let modifier = ''
  if (isHelpful) modifier = '，流月五行生扶喜用神，运势加分'
  if (isHarmful) modifier = '，流月五行克制喜用神，运势受压'

  return `${quality}${modifier}，综合评分${score}分。`
}

/** 获取年度等级 */
function getOverallLevel(score: number): string {
  if (score >= 85) return '大吉'
  if (score >= 75) return '吉'
  if (score >= 65) return '中吉'
  if (score >= 55) return '平'
  if (score >= 45) return '中凶'
  if (score >= 35) return '凶'
  return '大凶'
}

/** 寻找关键月份 */
function findKeyMonths(months: AnnualReportMonth[]): { type: 'best' | 'worst'; month: number; reason: string }[] {
  const keyMonths: { type: 'best' | 'worst'; month: number; reason: string }[] = []

  // 最佳月份（Top 2）
  const sorted = [...months].sort((a, b) => b.overall.score - a.overall.score)
  for (let i = 0; i < 2; i++) {
    keyMonths.push({
      type: 'best',
      month: sorted[i].month,
      reason: `${sorted[i].monthName}（${sorted[i].lunarAnimal}月）综合评分${sorted[i].overall.score}分，事业${sorted[i].career.score}分、财运${sorted[i].wealth.score}分、贵人运${sorted[i].noble.score}分，为年度最佳月份之一`,
    })
  }

  // 最差月份（Top 2）
  const sortedAsc = [...months].sort((a, b) => a.overall.score - b.overall.score)
  for (let i = 0; i < 2; i++) {
    keyMonths.push({
      type: 'worst',
      month: sortedAsc[i].month,
      reason: `${sortedAsc[i].monthName}（${sortedAsc[i].lunarAnimal}月）综合评分${sortedAsc[i].overall.score}分，${sortedAsc[i].risk.length > 0 ? sortedAsc[i].risk[0] : '运势低迷'}，需特别注意防范`,
    })
  }

  return keyMonths
}

/** 生成年度总述 */
function generateYearSummary(
  chart: BaZiChart,
  year: number,
  yearGanZhi: GanZhi,
  xy: ResolvedXiYong,
  overallScore: number,
  currentDaYun: any
): string {
  const dm = chart.dayMaster
  const sl = chart.sixLines

  // 流年天干十神
  const yearGanSS = getShenShi(dm.dayGan, yearGanZhi.gan)
  const yearZhiEl = BRANCH_ELEMENT_MAP[yearGanZhi.zhi]

  // 流年与喜用神关系
  const yearIsHelpful = xy.happyElements.includes(yearGanZhi.element) || xy.happyElements.includes(yearZhiEl)
  const yearIsHarmful = xy.jiElements.includes(yearGanZhi.element) || xy.jiElements.includes(yearZhiEl)

  // 流年与命局关键柱冲克
  const yearClashDay = isClash(yearGanZhi.zhi, sl.day.zhi)
  const yearClashMonth = isClash(yearGanZhi.zhi, sl.month.zhi)
  const yearClashYear = isClash(yearGanZhi.zhi, sl.year.zhi)

  const level = getOverallLevel(overallScore)

  let summary = `${year}年（${yearGanZhi.gan}${yearGanZhi.zhi}年），日主${dm.dayGan}${dm.dayGanElement}，${dm.strengthScore >= 50 ? '身强' : '身弱'}，`
  summary += `流年天干${yearGanZhi.gan}为${yearGanSS}，地支${yearGanZhi.zhi}${yearZhiEl}行。`

  summary += `流年天干${yearGanSS}主事，${yearGanSS === '正官' || yearGanSS === '正印' || yearGanSS === '食神' || yearGanSS === '正财' ? '整体运势偏向有利' : yearGanSS === '劫财' || yearGanSS === '伤官' || yearGanSS === '偏官' ? '整体运势需要谨慎应对' : '整体运势中性偏稳'}。`

  summary += `五行方面，流年天干${yearGanZhi.element}行，`
  if (yearIsHelpful) {
    summary += `与喜用神相合，运势加分。`
  } else if (yearIsHarmful) {
    summary += `与忌神相合，运势受压。`
  } else {
    summary += `与喜忌关系中性，运势平稳。`
  }

  if (yearClashDay) summary += `流年地支冲日柱（${sl.day.zhi}），感情婚姻方面需多关注。`
  if (yearClashMonth) summary += `流年地支冲月柱（${sl.month.zhi}），事业方面可能有变动。`
  if (yearClashYear) summary += `流年地支冲年柱（${sl.year.zhi}），健康方面需注意。`

  if (currentDaYun) {
    summary += `大运${currentDaYun.ganZhi?.gan || ''}${currentDaYun.ganZhi?.zhi || ''}（${currentDaYun.startAge || ''}-${currentDaYun.endAge || ''}岁）对年度运势有叠加影响，${currentDaYun.isXi ? '大运为喜用运，锦上添花' : currentDaYun.isJi ? '大运为忌神运，需更加谨慎' : '大运为平运，影响不大'}。`
  }

  summary += `\n\n年度综合评分${overallScore}分，运势等级为"${level}"。`
  summary += `${overallScore >= 70 ? '总体来看，此年运势较为顺利，可积极把握机遇。' : overallScore >= 55 ? '总体来看，此年运势稳中有变，需灵活应对。' : '总体来看，此年运势偏弱，宜保守稳健，蓄力待发。'}`

  return summary
}

/** 生成年度建议 */
function generateYearSuggestions(
  chart: BaZiChart,
  year: number,
  yearGanZhi: GanZhi,
  xy: ResolvedXiYong,
  overallScore: number
): string[] {
  const dm = chart.dayMaster
  const yearGanSS = getShenShi(dm.dayGan, yearGanZhi.gan)

  const suggestions: string[] = []

  // 通用建议
  suggestions.push(`年度核心策略：${overallScore >= 70 ? '主动出击，乘势而上' : overallScore >= 55 ? '稳中求进，灵活应变' : '保守稳健，以守为攻'}`)

  // 基于十神的建议
  if (yearGanSS === '正官' || yearGanSS === '正印') {
    suggestions.push('适合在体制内发展或考取资质证书')
  } else if (yearGanSS === '食神' || yearGanSS === '伤官') {
    suggestions.push('适合发挥创意和才华，开展副业或创作')
  } else if (yearGanSS === '正财' || yearGanSS === '偏财') {
    suggestions.push('关注理财和投资机会，但不宜贪大求全')
  } else if (yearGanSS === '偏官' || yearGanSS === '劫财') {
    suggestions.push('注意防范风险，避免冲动决策和大额支出')
  } else {
    suggestions.push('保持现状，稳步推进各项计划')
  }

  // 基于喜用神的建议
  suggestions.push(`多接触${xy.bestElement}行属性的人事物，${xy.bestElement === '木' ? '如绿植、东方方位、教育行业' : xy.bestElement === '火' ? '如阳光、南方方位、科技行业' : xy.bestElement === '土' ? '如陶瓷、中央方位、不动产行业' : xy.bestElement === '金' ? '如金属饰品、西方方位、金融行业' : '如水景、北方方位、贸易行业'}`)

  // 方位建议
  suggestions.push(`方位上以${xy.bestElement === '木' ? '东方' : xy.bestElement === '火' ? '南方' : xy.bestElement === '土' ? '中央' : xy.bestElement === '金' ? '西方' : '北方'}为有利方向，重要事项可选在此方位进行`)

  // 健康建议
  suggestions.push(`健康方面注意五行调养，${xy.jiElements[0] ? `忌${xy.jiElements[0]}行属性的过度消耗` : '保持规律作息'}，每年至少做一次全面体检`)

  return suggestions
}
