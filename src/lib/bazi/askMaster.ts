/**
 * askMaster.ts — 基于规则的智能命理问答系统
 *
 * 不调用外部 AI API，通过关键词匹配 + 模板插值 + 命盘数据驱动
 * 生成专业命理师口吻的个性化回答。
 */

import type {
  BaZiChart,
  FiveElement,
  ShenShi,
  HeavenlyStem,
  EarthlyBranch,
} from './types'
import type { DaYunAnalysisResult } from './dayunAnalysis'

// ---------------------------------------------------------------------------
// 接口定义
// ---------------------------------------------------------------------------

export interface AskMasterInput {
  chart: BaZiChart
  question: string
  geJu?: any
  xiYongShen?: any
  daYun?: DaYunAnalysisResult
  currentYear?: number
}

export interface AskMasterResult {
  answer: string           // 回答正文，300-800 字
  relatedAspects: string[] // 涉及的命理维度
  confidence: number      // 0-100
  suggestions: string[]   // 建议，2-4 条
}

// ---------------------------------------------------------------------------
// 内部常量 / 映射表
// ---------------------------------------------------------------------------

/** 问题类别 */
type QuestionCategory =
  | 'career'     // 事业
  | 'marriage'   // 婚姻
  | 'wealth'     // 财富
  | 'health'     // 健康
  | 'direction'  // 方位
  | 'study'      // 学业
  | 'luck'       // 大运
  | 'general'    // 通用

const CATEGORY_KEYWORDS: Record<QuestionCategory, string[]> = {
  career: ['创业', '上班', '行业', '职业', '工作', '发展方向', '升职', '跳槽', '事业', '职场', '老板', '做老板'],
  marriage: ['结婚', '恋爱', '感情', '配偶', '另一半', '婚姻', '姻缘', '桃花', '对象', '老公', '老婆', '相亲'],
  wealth: ['投资', '理财', '财运', '赚钱', '偏财', '正财', '股票', '基金', '买房', '存钱', '破财'],
  health: ['健康', '身体', '疾病', '养生', '医院', '手术', '失眠', '头疼', '肠胃', '心脏'],
  direction: ['方位', '城市', '发展', '搬迁', '出国', '去哪', '搬家', '坐向', '朝向'],
  study: ['学业', '考试', '学习', '升学', '读书', '高考', '考研', '考公', '博士', '文昌'],
  luck: ['运势', '流年', '什么时候', '何时', '今年', '明年', '未来', '大运', '运气'],
  general: [],
}

/** 五行 → 脏腑映射 */
const ELEMENT_ORGAN_MAP: Record<FiveElement, string> = {
  '木': '肝胆',
  '火': '心脏、小肠',
  '土': '脾胃、消化系统',
  '金': '肺、大肠、呼吸系统',
  '水': '肾、膀胱、泌尿系统',
}

/** 五行 → 方位映射 */
const ELEMENT_DIRECTION_MAP: Record<FiveElement, string> = {
  '木': '东方',
  '火': '南方',
  '土': '中央（四隅）',
  '金': '西方',
  '水': '北方',
}

/** 五行 → 行业映射 */
const ELEMENT_INDUSTRY_MAP: Record<FiveElement, string[]> = {
  '木': ['教育', '培训', '文学出版', '林业', '园林', '服装设计', '家具', '环保'],
  '火': ['互联网', '电子科技', '传媒影视', '餐饮', '能源', '照明', '心理咨询'],
  '土': ['房地产', '建筑', '农业', '矿业', '仓储物流', '物业管理', '保险'],
  '金': ['金融', '银行证券', '机械制造', '法律', '外科医疗', '珠宝', '汽车'],
  '水': ['物流贸易', '航运', '旅游', '水利', '酒水饮料', '传媒传播', '咨询策划'],
}

/** 十神 → 事业倾向 */
const SHISHI_CAREER_MAP: Record<string, string> = {
  '正官': '体制内、管理岗、行政管理',
  '偏官': '军警、执法、竞技体育、创业',
  '正印': '教育、学术、文化事业',
  '偏印': '技术研究、创意设计、玄学命理',
  '食神': '艺术创作、美食、休闲娱乐',
  '伤官': '律师、演艺、自由职业、技术专家',
  '正财': '财务会计、银行业务、稳定行业',
  '偏财': '投资、贸易、销售、商业经营',
  '比肩': '合伙经营、团队协作型行业',
  '劫财': '竞技类、高风险高回报行业',
}

/** 五行 → 河图洛书数字 */
const ELEMENT_NUMBER_MAP: Record<FiveElement, number[]> = {
  '水': [1, 6],
  '火': [2, 7],
  '木': [3, 8],
  '金': [4, 9],
  '土': [5, 10],
}

/** 免责声明后缀 */
const DISCLAIMER = '\n\n以上基于传统命理学分析，仅供参考，不构成任何决策建议。命由己造，运靠人为，祝您一切顺利。'

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

/** 根据关键词匹配问题类别 */
function classifyQuestion(question: string): QuestionCategory {
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'general') continue
    for (const kw of keywords) {
      if (question.includes(kw)) return cat as QuestionCategory
    }
  }
  return 'general'
}

/** 获取四柱十神列表 */
function getShenShiList(chart: BaZiChart): ShenShi[] {
  const sl = chart.sixLines
  return [sl.year.shenShi, sl.month.shenShi, sl.day.shenShi, sl.hour.shenShi].filter(Boolean) as ShenShi[]
}

/** 获取喜用神信息（兼容 XiYongShenResult 和 XiYongShen） */
function resolveXiYongShen(input: AskMasterInput) {
  const xy = input.xiYongShen ?? input.chart.xiYongShen
  return {
    bestElement: xy.bestElement || xy.firstHappy || (xy as any).usageElement || '',
    usageElement: (xy as any).usageElement || (xy as any).firstUsage || '',
    avoidedElements: xy.avoidedElements || [],
    happyElements: [
      xy.bestElement || (xy as any).firstHappy,
      (xy as any).secondHappy,
      (xy as any).thirdHappy,
    ].filter(Boolean) as FiveElement[],
  }
}

/** 判断日主强弱 */
function getStrengthLabel(score: number): string {
  if (score >= 70) return '身强'
  if (score >= 50) return '身中和偏强'
  if (score >= 30) return '身中和偏弱'
  return '身弱'
}

/** 获取当前大运信息 */
function getCurrentDaYunInfo(input: AskMasterInput): string {
  if (!input.daYun?.steps?.length) return ''
  const currentYear = input.currentYear || new Date().getFullYear()
  const step = input.daYun.steps.find(
    s => currentYear >= s.startYear && currentYear <= s.endYear
  )
  if (!step) return ''
  return `${step.ganZhi.gan}${step.ganZhi.zhi}运（${step.startAge}-${step.endAge}岁）`
}

/** 获取十神中指定十神的数量 */
function countShenShi(chart: BaZiChart, targets: ShenShi[]): number {
  const list = getShenShiList(chart)
  return list.filter(s => targets.includes(s)).length
}

/** 基于数据完整度计算置信度 */
function calcConfidence(input: AskMasterInput): number {
  let score = 50
  if (input.chart.dayMaster?.strengthScore != null) score += 15
  if (input.xiYongShen || input.chart.xiYongShen) score += 15
  if (input.daYun?.steps?.length) score += 10
  if (input.geJu) score += 10
  return Math.min(100, score)
}

// ---------------------------------------------------------------------------
// 模板系统 — 每个类别 4 种变体
// ---------------------------------------------------------------------------

interface TemplateContext {
  dayGan: string
  dayElement: FiveElement
  strength: string
  strengthScore: number
  bestElement: FiveElement | string
  avoidedElements: FiveElement[]
  happyElements: FiveElement[]
  geJuName: string
  currentDaYun: string
  shenShiList: ShenShi[]
  yearZhi: string
  monthZhi: string
  dayZhi: string
  hourZhi: string
  fiveElements: Record<string, number>
  overallScore: number
  question: string
  daYunSteps: any[]
  currentYear: number
}

function buildContext(input: AskMasterInput): TemplateContext {
  const dm = input.chart.dayMaster
  const xy = resolveXiYongShen(input)
  const sl = input.chart.sixLines
  return {
    dayGan: dm.dayGan,
    dayElement: dm.dayGanElement,
    strength: getStrengthLabel(dm.strengthScore),
    strengthScore: dm.strengthScore,
    bestElement: xy.bestElement,
    avoidedElements: xy.avoidedElements,
    happyElements: xy.happyElements,
    geJuName: input.geJu?.name || input.geJu?.mainGeJu?.name || '正格',
    currentDaYun: getCurrentDaYunInfo(input),
    shenShiList: getShenShiList(input.chart),
    yearZhi: sl.year.zhi,
    monthZhi: sl.month.zhi,
    dayZhi: sl.day.zhi,
    hourZhi: sl.hour.zhi,
    fiveElements: { ...input.chart.fiveElementCount } as Record<string, number>,
    overallScore: input.chart.overallScore,
    question: input.question,
    daYunSteps: input.daYun?.steps || [],
    currentYear: input.currentYear || new Date().getFullYear(),
  }
}

// ————— 事业类模板 —————
const CAREER_TEMPLATES: ((c: TemplateContext) => string)[] = [
  (c) => {
    const hasGuan = countShenShiFromList(c.shenShiList, ['正官', '偏官'])
    const industry = c.bestElement ? ELEMENT_INDUSTRY_MAP[c.bestElement as FiveElement]?.slice(0, 3).join('、') : '多行业均可'
    const careerType = hasGuan >= 1 ? '适合走管理路线或在体制内发展' : '更适合自主创业或走专业技术路线'
    const daYunPart = c.currentDaYun ? `目前行${c.currentDaYun}，${c.happyElements.includes(c.bestElement as FiveElement) ? '运势助事业发展，应把握时机' : '事业运平稳，宜蓄力待发'}。` : ''
    return `观您命盘，日主${c.dayGan}${c.dayElement}，${c.strength}，${c.geJuName}格。命局中官杀${hasGuan >= 1 ? '透出有力' : '不显'}，${careerType}。

从五行喜用来看，您的喜神为${c.bestElement}行，适合从事${c.bestElement}行相关行业，如${industry}等。${c.bestElement === '金' ? '金主义气精准，金融、法律类行业可发挥所长' : c.bestElement === '水' ? '水主智慧灵活，贸易、咨询类行业可如鱼得水' : c.bestElement === '木' ? '木主生发仁慈，教育、文化类行业最为契合' : c.bestElement === '火' ? '火主光明礼仪，科技、传媒类行业大有可为' : '土主厚重信实，建筑、农业类行业根基稳固'}。

${daYunPart}

总体而言，${c.strengthScore >= 50 ? '您日主有力，可承担重任，适合挑战性较强的工作' : '您日主偏弱，宜选择稳健发展的路径，不宜冒进'}。建议在事业上升期多积累人脉，${c.happyElements.includes('水' as FiveElement) ? '尤其宜往北方发展' : c.happyElements.includes('木' as FiveElement) ? '尤其宜往东方发展' : c.happyElements.includes('火' as FiveElement) ? '尤其宜往南方发展' : c.happyElements.includes('金' as FiveElement) ? '尤其宜往西方发展' : '中央或本地发展亦佳'}。${DISCLAIMER}`
  },
  (c) => {
    const hasShiShang = countShenShiFromList(c.shenShiList, ['食神', '伤官'])
    const hasCai = countShenShiFromList(c.shenShiList, ['正财', '偏财'])
    const hasYin = countShenShiFromList(c.shenShiList, ['正印', '偏印'])
    const talent = hasShiShang >= 1 ? '食伤旺盛，才华出众，创意灵感充沛' : hasYin >= 1 ? '印星有力，学习能力突出，适合知识密集型行业' : '命局十神分布均衡，综合能力较强'
    const bizAdvice = hasCai >= 1 ? '命带财星，有商业头脑，创业是不错的选择' : '财星不显，创业需谨慎，建议先在职场积累经验'
    return `观您命盘，日主${c.dayGan}${c.dayElement}生于${c.monthZhi}月，${c.strength}。${talent}，${bizAdvice}。

十神方面，${hasShiShang >= 1 ? '食伤主才华技艺，适合从事需要创造力的工作' : '印星主学识涵养，适合从事需要专业知识的工作'}。${c.bestElement}为您的喜用五行，与之相关的行业都能助您事业腾飞。

${c.currentDaYun ? `当前大运${c.currentDaYun}，` : '综合来看，'}${c.strengthScore >= 50 ? '正值事业发力期，应积极拓展' : '宜韬光养晦、提升自我'}。${c.avoidedElements.length ? `命局忌${c.avoidedElements.join('、')}行，应避免从事相关行业的重资产投入。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const bizOrWork = c.question.includes('创业') || c.question.includes('做老板') ? '创业' : '事业'
    const strengthAdvice = c.strengthScore >= 50
      ? '身强能扛风险，适合独立开创事业，或在团队中担任领导角色'
      : '身弱宜依托平台发展，借力打力，先站稳脚跟再图发展'
    return `观您命盘，${c.dayGan}${c.dayElement}日主，${c.strength}，格局为${c.geJuName}。

关于您的${bizOrWork}方向：${strengthAdvice}。从喜用神分析，${c.bestElement}行为您命局的贵人五行，${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] || '本地'}方位对您事业最为有利。

${bizOrWork === '创业' ? `创业时机方面，${c.currentDaYun ? `当前${c.currentDaYun}${c.happyElements.includes(c.bestElement as FiveElement) ? '，正是创业的好时机' : '，宜观望等待'}，` : ''}建议选择与${c.bestElement}行相关的领域切入。` : `职场发展方面，${c.currentDaYun ? `当前${c.currentDaYun}，` : ''}${c.strengthScore >= 50 ? '可以主动争取更大责任，展现领导才能' : '不宜过于激进，稳中求进更稳妥'}。`}

职业建议：${c.bestElement ? ELEMENT_INDUSTRY_MAP[c.bestElement as FiveElement]?.slice(0, 3).join('、') || '多元化发展' : '根据个人兴趣选择'}等领域均可考虑。${DISCLAIMER}`
  },
  (c) => {
    const hasGuan = countShenShiFromList(c.shenShiList, ['正官', '偏官'])
    const hasShiShang = countShenShiFromList(c.shenShiList, ['食神', '伤官'])
    const gejuAdvice = c.geJuName.includes('食神') || c.geJuName.includes('伤官')
      ? '格局偏重才华发挥，事业方向宜选择创意型、技术型领域'
      : c.geJuName.includes('正官') || c.geJuName.includes('七杀')
      ? '格局偏重权势管理，事业方向宜选择管理型、领导型领域'
      : c.geJuName.includes('正财') || c.geJuName.includes('偏财')
      ? '格局偏重财富积累，事业方向宜选择商业型、金融型领域'
      : '格局清正，适合在正规行业中稳扎稳打'
    return `观您命盘，${c.dayGan}${c.dayElement}日主，生于${c.monthZhi}月，${c.strength}，成${c.geJuName}格。

命局中官杀${hasGuan >= 1 ? '有根有力，事业心强，有领导潜质' : '力量平和，不喜争斗，适合专业技术路线'}。食伤${hasShiShang >= 1 ? '透出发挥，口才与创意俱佳' : '内敛含蓄，适合深度钻研'}。${gejuAdvice}。

五行喜用为${c.bestElement}，从事${c.bestElement}行相关的${ELEMENT_INDUSTRY_MAP[c.bestElement as FiveElement]?.[0] || '行业'}最为有利。${c.avoidedElements.length ? `应尽量避开${c.avoidedElements[0]}行相关行业，以免事倍功半。` : ''}

${c.currentDaYun ? `大运${c.currentDaYun}期间，${c.strengthScore >= 50 ? '事业运势逐步走高，宜乘势而上' : '运势平稳上升，需耐心积累'}。` : ''}${DISCLAIMER}`
  },
]

function countShenShiFromList(list: ShenShi[], targets: ShenShi[]): number {
  return list.filter(s => s && targets.includes(s)).length
}

// ————— 婚姻类模板 —————
const MARRIAGE_TEMPLATES: ((c: TemplateContext) => string)[] = [
  (c) => {
    const fuGong = c.dayZhi
    const spouseElement = getBranchElement(fuGong as EarthlyBranch)
    const matchQuality = c.happyElements.includes(spouseElement)
      ? '夫妻宫坐喜用五行，配偶对您助力较大'
      : c.avoidedElements.includes(spouseElement)
      ? '夫妻宫坐忌神五行，婚姻中需多包容磨合'
      : '夫妻宫五行中性，婚姻运势平稳'
    const peachBranches = ['子', '午', '卯', '酉']
    const hasPeach = peachBranches.some(b => c.yearZhi === b || c.monthZhi === b || c.dayZhi === b || c.hourZhi === b)
    return `观您命盘，日主${c.dayGan}${c.dayElement}，日支${fuGong}为夫妻宫。${matchQuality}。

${hasPeach ? '命带桃花星，异性缘佳，社交场合易遇到心仪之人。' : '命局桃花不显，感情发展较为含蓄内敛，多以工作或朋友介绍为主。'}配偶特征方面，日支${fuGong}${spouseElement === '木' ? '暗示配偶性格温和大方、有修养' : spouseElement === '火' ? '暗示配偶热情开朗、善于交际' : spouseElement === '土' ? '暗示配偶踏实稳重、持家有方' : spouseElement === '金' ? '暗示配偶果断干练、有事业心' : '暗示配偶聪慧灵动、善于沟通'}。

${c.currentDaYun ? `当前大运${c.currentDaYun}，${c.happyElements.includes(spouseElement) ? '感情运上升，是增进感情的好时期' : '感情方面需多用心经营'}。` : ''}建议择偶时多关注对方与您五行是否互补，${c.bestElement}行属性强的人对您更为有利。${DISCLAIMER}`
  },
  (c) => {
    const fuGongElement = getBranchElement(c.dayZhi as EarthlyBranch)
    const idealAge = c.strengthScore >= 50 ? '稍晚结婚为宜，让事业根基更稳固' : '适时而婚，稳定的家庭能给您带来力量支撑'
    const timing = c.currentDaYun ? `结合当前${c.currentDaYun}，` : ''
    return `观您命盘，${c.dayGan}日主坐${c.dayZhi}，夫妻宫${fuGongElement}行。${timing}${idealAge}。

从命局分析，${fuGongElement === c.bestElement ? '夫妻宫为喜用，婚姻质量较高，配偶贤能有助' : '夫妻宫五行与喜用有差距，婚姻中需要双方更多理解与调整'}。日主${c.strength}，${c.strengthScore >= 50 ? '个性独立有主见，在婚姻中需学会适当柔和' : '心思细腻敏感，在婚姻中宜增强自信'}。

婚姻方位方面，${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] || '本地'}方位遇到良缘的机会较大。感情中切忌急躁，缘分到时自然水到渠成。${DISCLAIMER}`
  },
  (c) => {
    const peachYears = findPeachYears(c)
    return `观您命盘，日柱${c.dayGan}${c.dayZhi}，${c.strength}。夫妻宫坐${c.dayZhi}，${getBranchElement(c.dayZhi as EarthlyBranch)}行属性主导配偶特质。

从大运流年来看，${peachYears.length > 0 ? `${peachYears.join('、')}年前后为桃花较旺的时段，感情中易有进展。` : '桃花年份分布均匀，感情机缘需主动争取。'}配偶大概率${c.dayZhi === '子' || c.dayZhi === '午' ? '外貌出众、社交能力强' : c.dayZhi === '寅' || c.dayZhi === '申' ? '事业心强、行动力足' : c.dayZhi === '卯' || c.dayZhi === '酉' ? '注重生活品质、审美佳' : '性格温和、持家能力突出'}。

感情建议：${c.happyElements.includes('水' as FiveElement) || c.happyElements.includes('木' as FiveElement) ? '遇事多沟通，以柔克刚' : '主动表达爱意，给予对方安全感'}。${c.avoidedElements.length ? `忌${c.avoidedElements[0]}行方位的姻缘，易有波折。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const spouseHint = getSpouseDirectionHint(c.dayZhi)
    return `观您命盘，${c.dayGan}${c.dayElement}日主，${c.strength}，${c.geJuName}格。婚姻宫（日支）${c.dayZhi}，${spouseHint}。

综合命局分析，您在感情中${c.strengthScore >= 50 ? '属于主动型，有担当有责任感，是可靠的伴侣' : '属于细腻型，善解人意，注重感情的深度交流'}。${c.bestElement}为喜用五行，${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] || '本地'}方向利于姻缘。

婚姻中的注意事项：${c.avoidedElements.length ? `命局忌${c.avoidedElements.join('、')}行，夫妻争吵时避免在该方位加剧矛盾。` : ''}${c.currentDaYun ? `当前${c.currentDaYun}，${c.happyElements.includes(c.bestElement as FiveElement) ? '感情运势有利，适合增进关系' : '感情运势平淡，宜多制造浪漫'}。` : ''}缘分天注定，但经营在人为。${DISCLAIMER}`
  },
]

function findPeachYears(c: TemplateContext): string[] {
  const peachBranches = ['子', '午', '卯', '酉']
  const years: string[] = []
  const base = c.currentYear
  for (let i = 0; i < 10; i++) {
    const y = base + i
    const idx = (y - 4) % 12
    if (idx >= 0 && peachBranches.includes(['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'][idx])) {
      years.push(`${y}`)
      if (years.length >= 3) break
    }
  }
  return years
}

function getSpouseDirectionHint(dayZhi: string): string {
  const map: Record<string, string> = {
    '子': '配偶可能来自北方或从事水行相关行业',
    '丑': '配偶可能来自本地或从事土行相关行业',
    '寅': '配偶可能来自东北方或从事木行相关行业',
    '卯': '配偶可能来自东方或从事木行相关行业',
    '辰': '配偶可能来自东南方或从事土行相关行业',
    '巳': '配偶可能来自东南方或从事火行相关行业',
    '午': '配偶可能来自南方或从事火行相关行业',
    '未': '配偶可能来自西南方或从事土行相关行业',
    '申': '配偶可能来自西南方或从事金行相关行业',
    '酉': '配偶可能来自西方或从事金行相关行业',
    '戌': '配偶可能来自西北方或从事土行相关行业',
    '亥': '配偶可能来自西北方或从事水行相关行业',
  }
  return map[dayZhi] || '配偶来源方位信息需结合更多参数分析'
}

// ————— 财富类模板 —————
const WEALTH_TEMPLATES: ((c: TemplateContext) => string)[] = [
  (c) => {
    const hasCai = countShenShiFromList(c.shenShiList, ['正财', '偏财'])
    const hasShiShang = countShenShiFromList(c.shenShiList, ['食神', '伤官'])
    return `观您命盘，日主${c.dayGan}${c.dayElement}，${c.strength}。${hasCai >= 2 ? '命带双财星，正偏财俱全，求财之路广阔' : hasCai >= 1 ? '命带财星，财运有根基' : '财星不显，财运需后天努力开拓'}。${hasShiShang >= 1 ? '食伤生财格局，才华可以变现，创意类收入渠道通畅' : ''}。

喜用神为${c.bestElement}行，${c.bestElement}行相关的投资领域较为有利，如${ELEMENT_INDUSTRY_MAP[c.bestElement as FiveElement]?.[0] || '稳健型'}等。正财${hasCai >= 1 ? '稳定，工资收入可观' : '平平，以副业补充为主'}；偏财${hasCai >= 2 ? '活跃，投资运佳' : '需谨慎，不宜投机'}。

理财建议：${c.strengthScore >= 50 ? '身强可承受一定风险，可适当配置进取型资产' : '身弱宜保守理财，以稳健保本为首要目标'}。${c.avoidedElements.length ? `忌${c.avoidedElements.join('、')}行相关的投机行为。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const hasZhengCai = c.shenShiList.includes('正财')
    const hasPianCai = c.shenShiList.includes('偏财')
    return `观您命盘，${c.dayGan}${c.dayElement}日主，${c.strength}，${c.geJuName}格。

财运方面，${hasZhengCai ? '正财有根，主业收入稳定，适合深耕一个领域积累财富' : '正财不显，工资收入需靠技能提升来增加'}。${hasPianCai ? '偏财透出，有投资理财的天赋，副业收入可期' : '偏财不显，不宜大额投机，见好就收为上策'}。

${c.currentDaYun ? `当前${c.currentDaYun}，${c.happyElements.includes(c.bestElement as FiveElement) ? '财运呈上升趋势，可适当扩大投资' : '财运平稳期，以守财为主'}。` : ''}投资方向建议聚焦${c.bestElement}行行业，${c.bestElement === '金' ? '如金融、证券等' : c.bestElement === '水' ? '如贸易、物流等' : c.bestElement === '木' ? '如教育、文化等' : c.bestElement === '火' ? '如科技、传媒等' : '如房产、农业等'}领域。${DISCLAIMER}`
  },
  (c) => {
    const hasShiShang = countShenShiFromList(c.shenShiList, ['食神', '伤官'])
    const hasCai = countShenShiFromList(c.shenShiList, ['正财', '偏财'])
    const wealthStructure = hasShiShang >= 1 && hasCai >= 1
      ? '食伤生财，属于"才华致富"型，靠技能和创意赚钱最为轻松'
      : hasCai >= 1
      ? '财星有根，属于"勤恳致富"型，靠踏实工作积累财富'
      : '财星不显但身强，可通过后天努力和方位调整来增强财运'
    return `观您命盘，${c.dayGan}${c.dayElement}，${c.strength}。${wealthStructure}。

您的财运密码在于${c.bestElement}行。${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] || '本地'}方位为您求财的有利方向，${ELEMENT_NUMBER_MAP[c.bestElement as FiveElement]?.join('、') || ''}为您的财星数字，可用于手机号、楼层等选择。

守财方面，${c.avoidedElements.length ? `应避开${c.avoidedElements.join('、')}行相关的投资陷阱` : '宜定期储蓄、量入为出'}。${c.currentDaYun ? `${c.currentDaYun}期间，${c.strengthScore >= 50 ? '正财运上升期，加薪升职可期' : '偏财运一般，以主业收入为主'}。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const isInvestQ = c.question.includes('投资') || c.question.includes('股票') || c.question.includes('基金')
    return `观您命盘，日主${c.dayGan}${c.dayElement}，${c.strength}，${c.geJuName}格。

${isInvestQ ? '关于投资方向：' : '关于财运分析：'}喜用${c.bestElement}行为您的财富密码五行。${c.bestElement === '金' ? '金主收敛聚财，金融投资类可重点关注' : c.bestElement === '水' ? '水主流动智慧，贸易流通类最为有利' : c.bestElement === '木' ? '木主生长发展，长期投资项目可考虑' : c.bestElement === '火' ? '火主爆发上升，科技类新兴领域有机会' : '土主稳重积累，不动产类投资较为稳妥'}。

${isInvestQ
  ? `${c.strengthScore >= 50 ? '身强能担财，可适度承担风险进行投资' : '身弱财重需谨慎，建议以保守型投资为主'}。${c.avoidedElements.length ? `尤其忌讳${c.avoidedElements[0]}行相关的投机品种。` : ''}`
  : `${c.strengthScore >= 50 ? '您的财运潜力较大，关键在于选对行业和方向' : '财运需稳扎稳打，不建议一次性投入过大'}。`}

建议财富管理采用"三七法则"：七成稳守、三成进取，${c.bestElement}行领域作为重点配置方向。${DISCLAIMER}`
  },
]

// ————— 健康类模板 —————
const HEALTH_TEMPLATES: ((c: TemplateContext) => string)[] = [
  (c) => {
    const weakest = findWeakestElement(c.fiveElements)
    const organ = weakest ? ELEMENT_ORGAN_MAP[weakest as FiveElement] : '需综合调理'
    return `观您命盘，日主${c.dayGan}${c.dayElement}，${c.strength}。五行分布中，${weakest ? `${weakest}行偏弱（${c.fiveElements[weakest] || 0}分）` : '五行较为均衡'}，对应脏腑为${organ}，需特别关注。

${c.strengthScore >= 60 ? '日主偏强，气血旺盛，但注意不要过度劳累' : c.strengthScore >= 40 ? '日主中和，身体状况总体平稳，注意季节变化' : '日主偏弱，元气不足，需注重调养和作息规律'}。

养生建议：${weakest === '木' ? '多食绿色蔬菜，适当运动，避免熬夜伤肝' : weakest === '火' ? '注意心脏保养，避免过度激动，适量红色食物' : weakest === '土' ? '注意饮食规律，忌生冷，适当食用黄色食物调理脾胃' : weakest === '金' ? '注意呼吸系统保养，多做有氧运动，秋季尤需防燥' : '注意肾脏保养，多饮水，避免过度劳累，冬季注意保暖'}。${c.avoidedElements.length ? `忌讳${c.avoidedElements[0]}行属性的过度消耗。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const weakest = findWeakestElement(c.fiveElements)
    const strongest = findStrongestElement(c.fiveElements)
    return `观您命盘五行分布：木${c.fiveElements['木'] || 0}、火${c.fiveElements['火'] || 0}、土${c.fiveElements['土'] || 0}、金${c.fiveElements['金'] || 0}、水${c.fiveElements['水'] || 0}。${weakest ? `${weakest}行最弱，需重点关注${ELEMENT_ORGAN_MAP[weakest as FiveElement]}方面的健康。` : '五行较为均衡，身体状况基础良好。'}${strongest && strongest !== weakest ? `${strongest}行偏旺，${ELEMENT_ORGAN_MAP[strongest as FiveElement]}方面反而容易因过旺而失衡。` : ''}

从日主${c.dayGan}${c.dayElement}${c.strength}来看，${c.strengthScore >= 50 ? '体质偏实，不易生病但病则较重，需定期体检' : '体质偏虚，容易疲劳，宜注重日常保健'}。

方位养生：宜往${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] || '本地'}方位居住或运动，有助于调理五行平衡。颜色养生：多穿戴${c.bestElement}行对应颜色的衣物，如${c.bestElement === '木' ? '绿色系' : c.bestElement === '火' ? '红色系' : c.bestElement === '土' ? '黄色系' : c.bestElement === '金' ? '白色系' : '黑色/蓝色系'}。${DISCLAIMER}`
  },
  (c) => {
    const missing = findMissingElements(c.fiveElements)
    const weak = findWeakElements(c.fiveElements)
    const focusOrgans = [...(missing.length > 0 ? missing : weak)].map(el => ELEMENT_ORGAN_MAP[el as FiveElement])
    return `观您命盘，${c.dayGan}${c.dayElement}日主，五行${missing.length > 0 ? `缺${missing.join('、')}，` : '无显著缺失，'}${weak.length > 0 ? `${weak.join('、')}行偏弱` : '分布较为均匀'}。

健康方面需重点关注：${focusOrgans.length > 0 ? focusOrgans.join('、') : '整体体质调养'}。${missing.length > 0 ? `五行缺${missing.join('、')}，可通过日常饮食起居来弥补：${missing.includes('木') ? '多吃绿色蔬菜、早睡早起养肝' : ''}${missing.includes('火') ? '适当阳光照射、红色食物养心' : ''}${missing.includes('土') ? '规律饮食、黄色食物健脾' : ''}${missing.includes('金') ? '深呼吸练习、白色食物润肺' : ''}${missing.includes('水') ? '充足饮水、黑色食物补肾' : ''}` : '五行虽无缺失，但仍需注意平衡调理。'}

${c.currentDaYun ? `当前${c.currentDaYun}，${c.happyElements.includes(c.bestElement as FiveElement) ? '整体健康运势尚可，保持良好习惯即可' : '健康方面需格外注意，建议增加体检频次'}。` : ''}${DISCLAIMER}`
  },
  (c) => {
    return `观您命盘，日主${c.dayGan}${c.dayElement}，${c.strength}，${c.geJuName}格。五行之中，${c.bestElement}行为喜用，养生当以培补${c.bestElement}行为主。

${c.bestElement === '木' ? '养肝为先：春季尤需注意，宜绿色饮食，晨起运动，避免郁怒伤肝。适合太极拳、散步等舒缓运动。' : c.bestElement === '火' ? '养心为要：夏季注意防暑降温，宜红色饮食，保持心情愉悦，避免过劳伤心。适合游泳、瑜伽等运动。' : c.bestElement === '土' ? '养脾为本：换季时节注意饮食卫生，宜黄色食物，定时定量，忌暴饮暴食。适合慢跑、登山等运动。' : c.bestElement === '金' ? '养肺为主：秋季干燥注意润肺，宜白色食物，多做深呼吸练习。适合跑步、球类运动。' : '养肾为根：冬季注意保暖，宜黑色食物，避免过度疲劳。适合太极、气功等内养运动。'}

${c.avoidedElements.length ? `忌${c.avoidedElements.join('、')}行属性的过度消耗，如${c.avoidedElements[0] === '木' ? '过度用眼、熬夜' : c.avoidedElements[0] === '火' ? '高温环境、辛辣饮食' : c.avoidedElements[0] === '土' ? '暴饮暴食、甜食过量' : c.avoidedElements[0] === '金' ? '悲忧伤肺、干燥环境' : '寒冷刺激、过度劳累'}。` : ''}${DISCLAIMER}`
  },
]

function findWeakestElement(fe: Record<string, number>): FiveElement | '' {
  let weakest: FiveElement = '木'
  let min = Infinity
  for (const el of ['木', '火', '土', '金', '水'] as FiveElement[]) {
    if ((fe[el] || 0) < min) { min = fe[el] || 0; weakest = el }
  }
  return min < 20 ? weakest : ''
}

function findStrongestElement(fe: Record<string, number>): FiveElement | '' {
  let strongest: FiveElement = '木'
  let max = -Infinity
  for (const el of ['木', '火', '土', '金', '水'] as FiveElement[]) {
    if ((fe[el] || 0) > max) { max = fe[el] || 0; strongest = el }
  }
  return max > 40 ? strongest : ''
}

function findMissingElements(fe: Record<string, number>): FiveElement[] {
  return (['木', '火', '土', '金', '水'] as FiveElement[]).filter(el => !fe[el] || fe[el] === 0)
}

function findWeakElements(fe: Record<string, number>): FiveElement[] {
  const avg = Object.values(fe).reduce((s, v) => s + v, 0) / 5
  return (['木', '火', '土', '金', '水'] as FiveElement[]).filter(el => (fe[el] || 0) < avg * 0.6)
}

// ————— 方位类模板 —————
const DIRECTION_TEMPLATES: ((c: TemplateContext) => string)[] = [
  (c) => {
    const bestDir = c.bestElement ? ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] : '本地'
    const badDir = c.avoidedElements[0] ? ELEMENT_DIRECTION_MAP[c.avoidedElements[0]] : ''
    return `观您命盘，日主${c.dayGan}${c.dayElement}，喜用${c.bestElement}行，忌${c.avoidedElements.join('、') || '无显著忌讳'}。

有利方位：${bestDir}（喜用${c.bestElement}行方位），该方位能助旺您的运势，适合作为发展、居住、工作的首选方向。${c.happyElements.length > 1 ? `其次${c.happyElements.slice(1).map(el => ELEMENT_DIRECTION_MAP[el]).join('、')}方位也可考虑。` : ''}

${badDir ? `不利方位：${badDir}（忌神${c.avoidedElements[0]}行方位），该方位可能压制运势，重要决策宜避开此方向。` : ''}

${c.question.includes('出国') ? `关于出国发展：${c.bestElement === '金' ? '西方（欧美）对您有利' : c.bestElement === '水' ? '北方（北美、北欧）对您有利' : c.bestElement === '木' ? '东方（日韩、东南亚东部）对您有利' : c.bestElement === '火' ? '南方（东南亚、澳洲）对您有利' : '中央（国内发展）最为稳妥'}。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const dirList = c.happyElements.map(el => `${ELEMENT_DIRECTION_MAP[el]}（${el}行）`).join('、')
    const avoidDirList = c.avoidedElements.map(el => ELEMENT_DIRECTION_MAP[el]).join('、')
    return `观您命盘五行喜忌，为您分析方位布局：

推荐方位（按优先级）：${dirList || '本地'}。这些方位的五行属性与您命局喜用相合，在此方位发展事业、定居安家，更容易获得助力。

${avoidDirList ? `应避开的方位：${avoidDirList}。这些方位的五行与您命局忌神相冲，长期在此方位可能影响运势。` : ''}

城市选择方面，${c.bestElement === '木' ? '东方城市（如上海、杭州等沿海城市）较为有利' : c.bestElement === '火' ? '南方城市（如深圳、广州等）较为有利' : c.bestElement === '土' ? '中部城市（如武汉、成都等）较为有利' : c.bestElement === '金' ? '西方城市（如西安、乌鲁木齐等）较为有利' : '北方城市（如北京、天津等）较为有利'}。${DISCLAIMER}`
  },
  (c) => {
    return `观您命盘，日主${c.dayGan}${c.dayElement}，${c.strength}，喜用${c.bestElement}行。

方位总评：${c.bestElement}行位于${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement]}，这是您的第一吉方。${c.happyElements.filter(el => el !== c.bestElement).map(el => `${el}行位于${ELEMENT_DIRECTION_MAP[el]}，也是您的吉利方位`).join('；')}。${c.avoidedElements.map(el => `${el}行位于${ELEMENT_DIRECTION_MAP[el]}，为凶方，宜避之`).join('；')}。

${c.question.includes('搬迁') ? '搬迁建议：择吉日向喜用方位搬迁，新居宜坐忌神方、向喜用方，方能纳吉避凶。' : ''}旅行或出差时，若有选择余地，优先选择喜用方位的目的地。办公室座位宜面向喜用方位，能有效提升工作运势。${DISCLAIMER}`
  },
  (c) => {
    const dayZhiDir = BRANCH_DIRECTION_SIMPLE[c.dayZhi] || '正中'
    return `观您命盘，日柱${c.dayGan}${c.dayZhi}，夫妻宫在${dayZhiDir}方位，日主${c.dayGan}${c.dayElement}${c.strength}。

从五行喜用推算，${c.bestElement}行为您的贵人方位，对应${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement]}。此方位对您的事业、财运、人际关系均有助力。

${c.question.includes('城市') ? '城市选择：' : ''}${c.bestElement === '木' ? '东方沿海城市如上海、宁波、青岛等是您的福地' : c.bestElement === '火' ? '南方经济活跃城市如深圳、厦门、珠海等是您的福地' : c.bestElement === '土' ? '中原腹地城市如武汉、郑州、长沙等是您的福地' : c.bestElement === '金' ? '西部城市如西安、兰州、昆明等是您的福地' : '北方城市如北京、大连、哈尔滨等是您的福地'}。若在此方位发展，事业和财运都会更加顺畅。${DISCLAIMER}`
  },
]

const BRANCH_DIRECTION_SIMPLE: Record<string, string> = {
  '子': '正北', '丑': '东北', '寅': '东北', '卯': '正东',
  '辰': '东南', '巳': '东南', '午': '正南', '未': '西南',
  '申': '西南', '酉': '正西', '戌': '西北', '亥': '西北',
}

// ————— 学业类模板 —————
const STUDY_TEMPLATES: ((c: TemplateContext) => string)[] = [
  (c) => {
    const hasYin = countShenShiFromList(c.shenShiList, ['正印', '偏印'])
    const hasGuan = countShenShiFromList(c.shenShiList, ['正官', '偏官'])
    return `观您命盘，日主${c.dayGan}${c.dayElement}，${c.strength}。印星${hasYin >= 1 ? '有力透出，学业根基扎实，记忆力与理解力俱佳' : '力量平和，学习需后天加倍努力'}。官杀${hasGuan >= 1 ? '有根，考试运较好，临场发挥出色' : '不显，考试运平平，需靠实力取胜'}。

文昌方面，${c.bestElement}行为喜用，${c.bestElement === '水' ? '北方城市求学环境更佳，学习时可面向北方' : c.bestElement === '木' ? '东方城市求学有利，书桌宜面向东方' : c.bestElement === '火' ? '南方城市求学有助，宜在明亮温暖的环境中学习' : c.bestElement === '金' ? '西方城市求学有利，书桌宜整洁简约' : '本地或中部城市求学为宜，学习环境宜稳重安静'}。

${c.currentDaYun ? `当前${c.currentDaYun}，${c.happyElements.includes(c.bestElement as FiveElement) ? '学业运势上扬，是考试、升学的好时机' : '学业运平稳，需保持恒心毅力'}。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const hasYin = countShenShiFromList(c.shenShiList, ['正印', '偏印'])
    const hasShiShang = countShenShiFromList(c.shenShiList, ['食神', '伤官'])
    return `观您命盘，${c.dayGan}${c.dayElement}日主，${c.geJuName}格。

学习能力分析：${hasYin >= 1 ? '印星主学识，命局中有印星，说明您天生具备较好的学习能力和吸收信息的能力' : '印星力量一般，学习需靠勤奋和方法取胜'}。${hasShiShang >= 1 ? '食伤主才华表达，您不仅有学习能力，还有很强的创造力和表达能力' : ''}。

${c.question.includes('考试') ? '考试运势：' : ''}${c.strengthScore >= 50 ? '日主身强能担财官，考试中容易发挥出正常甚至超常水平' : '日主偏弱，考试时注意调节心态，避免过度紧张影响发挥'}。建议考试时穿着${c.bestElement === '木' ? '绿色系' : c.bestElement === '火' ? '红色系' : c.bestElement === '土' ? '黄色系' : c.bestElement === '金' ? '白色系' : '黑色/蓝色系'}衣物，座位选择面向喜用方位。${DISCLAIMER}`
  },
  (c) => {
    return `观您命盘，日主${c.dayGan}${c.dayElement}，五行喜用为${c.bestElement}行。

学业方面，${c.bestElement}行旺则学业顺遂。${c.bestElement === '水' ? '水主智，您适合理论性、研究型学科，如数学、物理、哲学等' : c.bestElement === '木' ? '木主仁，您适合人文社科类学科，如文学、教育、法学等' : c.bestElement === '火' ? '火主礼，您适合传媒艺术类学科，如影视、设计、传媒等' : c.bestElement === '金' ? '金主义，您适合工科技术类学科，如计算机、工程、金融等' : '土主信，您适合管理实践类学科，如MBA、行政管理、经济学等'}。

学习环境建议：书桌面向${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] || '采光好的方向'}，桌面保持整洁。${c.avoidedElements.length ? `避免在${c.avoidedElements[0]}行方位（${ELEMENT_DIRECTION_MAP[c.avoidedElements[0]]}）长时间学习，容易分心。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const peachYears = findPeachYears(c)
    const examYears = peachYears.length > 0 ? peachYears.map(y => `${y}年`).join('、') : '近期年份'
    return `观您命盘，${c.dayGan}${c.dayElement}${c.strength}，${c.geJuName}格。印星力量${countShenShiFromList(c.shenShiList, ['正印', '偏印']) >= 1 ? '充沛，读书考试有天赋优势' : '尚可，需后天努力弥补'}。

升学考试建议：${c.currentDaYun ? `当前${c.currentDaYun}，` : ''}${c.happyElements.includes(c.bestElement as FiveElement) ? '学业运处于上升通道，把握机会' : '学业运平平，需加倍付出'}。${c.question.includes('高考') || c.question.includes('考研') || c.question.includes('考公') ? `从流年来看，${examYears}前后为考试运势较好的时段，若考试时间在此期间则较为有利。` : ''}

文昌位调理：书桌或学习座位宜设在房间的${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] || '正'}方。学习时可多穿戴${c.bestElement}行颜色的配饰，有助于集中精力、提升效率。${DISCLAIMER}`
  },
]

// ————— 大运/流年类模板 —————
const LUCK_TEMPLATES: ((c: TemplateContext) => string)[] = [
  (c) => {
    const daYunInfo = c.daYunSteps.length > 0 ? formatDaYunSummary(c.daYunSteps, c.currentYear) : '暂无大运数据'
    return `观您命盘，日主${c.dayGan}${c.dayElement}，${c.strength}，${c.geJuName}格。喜用${c.bestElement}行，忌${c.avoidedElements.join('、') || '无'}。

${c.currentDaYun ? `当前行${c.currentDaYun}，` : ''}${daYunInfo}

运势总体走势：${c.strengthScore >= 50 ? '日主身强，一生运势前高后稳，中年为事业巅峰期' : '日主偏弱，运势前平后升，晚年最为安定'}。${c.happyElements.length > 1 ? `喜神${c.happyElements.join('、')}行，当大运流年行至此五行时，运势最为顺利。` : ''}

${c.avoidedElements.length > 0 ? `需特别注意${c.avoidedElements[0]}行大运流年，此时宜保守行事，避免重大决策。` : '五行配置尚可，无明显的大运凶险期。'}把握喜用五行当旺的年份，顺势而为，自然事半功倍。${DISCLAIMER}`
  },
  (c) => {
    return `观您命盘，${c.dayGan}${c.dayElement}日主，${c.strength}。${c.question.includes('今年') || c.question.includes('明年') ? `${c.currentYear}年为流年，` : ''}结合命局与大运综合分析：

${c.currentDaYun ? `大运层面：当前${c.currentDaYun}，${c.happyElements.includes(c.bestElement as FiveElement) ? '此运为喜用运，事业财运均有提升空间' : '此运需谨慎行事，以守为攻'}。` : ''}

流年层面：${c.currentYear}年天干地支与命局的互动${c.strengthScore >= 50 ? '总体有利，可把握机遇' : '平平，需稳中求进'}。${c.bestElement}行旺的月份运势较好，${c.avoidedElements[0] || ''}行旺的月份需注意防范风险。

建议：${c.currentYear}年重点把握上半年${c.bestElement === '木' || c.bestElement === '火' ? '春夏季' : c.bestElement === '金' || c.bestElement === '水' ? '秋冬季' : '四季交接之时'}的机遇，下半年以巩固为主。${DISCLAIMER}`
  },
  (c) => {
    const nextSteps = c.daYunSteps.filter(s => s.startYear > c.currentYear).slice(0, 2)
    return `观您命盘，${c.dayGan}${c.dayElement}，${c.strength}，${c.geJuName}格。

大运分析：${c.currentDaYun ? `当前${c.currentDaYun}，运势${c.strengthScore >= 50 ? '稳健向好' : '处于蓄力期'}。` : ''}${nextSteps.length > 0 ? `未来大运走向：${nextSteps.map(s => `${s.startYear}-${s.endYear}年${s.ganZhi.gan}${s.ganZhi.zhi}运（${s.isXi ? '喜用运，运势大好' : s.isJi ? '忌神运，需谨慎' : '平运，稳中求进'}）`).join('；')}。` : ''}

${c.question.includes('何时') || c.question.includes('什么时候') ? `关于您关心的时机问题：从命局大运流年推断，${c.bestElement}行大运或流年到来之时，即为运势转折的关键节点。${c.happyElements.map(el => `${el}行年份`).join('、')}为您的幸运年份区间。` : ''}${DISCLAIMER}`
  },
  (c) => {
    const nextPeach = findPeachYears(c).slice(0, 2)
    return `观您命盘大运流年走势：日主${c.dayGan}${c.dayElement}，${c.strength}，喜${c.bestElement}行，忌${c.avoidedElements.join('、') || '无'}。

运势节奏：${c.currentDaYun ? `当前${c.currentDaYun}为您${c.daYunSteps.find(s => s.startYear <= c.currentYear && s.endYear >= c.currentYear)?.isXi ? '运势上扬期，事事顺遂' : c.daYunSteps.find(s => s.startYear <= c.currentYear && s.endYear >= c.currentYear)?.isJi ? '运势低谷期，凡事不宜强求' : '运势平稳期，不温不火'}。` : ''}

近期关键年份：${nextPeach.length > 0 ? `${nextPeach.join('、')}年前后为重要转折期，届时事业、感情、财运均有变化。` : '需结合具体事项进一步分析。'}

总体运势建议：逢${c.bestElement}行旺的年月积极行动，逢${c.avoidedElements[0] || '忌神'}行旺的年月收敛蓄力。此乃命理学"趋吉避凶"之要义。${DISCLAIMER}`
  },
]

function formatDaYunSummary(steps: any[], currentYear: number): string {
  const nearby = steps.filter(s => Math.abs(s.startYear - currentYear) <= 20)
  return nearby.map(s =>
    `${s.startYear}-${s.endYear}年${s.ganZhi.gan}${s.ganZhi.zhi}运（${s.isXi ? '喜' : s.isJi ? '忌' : '平'}，${s.startAge}-${s.endAge}岁）`
  ).join('；')
}

// ————— 通用类模板 —————
const GENERAL_TEMPLATES: ((c: TemplateContext) => string)[] = [
  (c) => {
    return `观您命盘，日主${c.dayGan}${c.dayElement}，生于${c.monthZhi}月，${c.strength}，成${c.geJuName}格。

命局总论：${c.strengthScore >= 50 ? '日主身强，命局根基扎实，一生多有建树' : '日主偏弱，命局需后天补益，但弱而有救，反而更具韧性'}。喜用五行${c.bestElement}，${c.bestElement === '木' ? '木主仁慈生发，宜培养慈悲之心、积极进取' : c.bestElement === '火' ? '火主光明热情，宜保持乐观积极、广结善缘' : c.bestElement === '土' ? '土主厚重诚信，宜脚踏实地、守正出奇' : c.bestElement === '金' ? '金主义气果断，宜重信守诺、果敢前行' : '水主智慧灵活，宜多学多思、以柔克刚'}。

五行分布：木${c.fiveElements['木'] || 0}、火${c.fiveElements['火'] || 0}、土${c.fiveElements['土'] || 0}、金${c.fiveElements['金'] || 0}、水${c.fiveElements['水'] || 0}。${c.avoidedElements.length ? `忌${c.avoidedElements.join('、')}行，生活中注意规避相关的不利因素。` : ''}

总体而言，您的命盘${c.overallScore >= 70 ? '格局清正、五行和合，属于上等命局' : c.overallScore >= 50 ? '格局尚可、五行基本平衡，属于中等偏上命局' : '格局需调理、五行有所偏颇，但通过后天努力可大为改善'}。${DISCLAIMER}`
  },
  (c) => {
    return `观您命盘四柱：${c.yearZhi ? c.yearZhi : ''}年${c.monthZhi}月${c.dayZhi}日${c.hourZhi}时。日主${c.dayGan}${c.dayElement}，${c.strength}。

综合评分${c.overallScore || 0}/100。${c.geJuName}格${c.strengthScore >= 50 ? '，日主有力，格局成全度高' : '，格局有成但需后天助益'}。

性格特征：${c.dayElement === '木' ? '仁慈好善，有上进心，但有时固执己见' : c.dayElement === '火' ? '热情开朗，重礼仪，但脾气急躁' : c.dayElement === '土' ? '忠厚老实，重信誉，但变化较慢' : c.dayElement === '金' ? '果断义气，重承诺，但有时过于刚硬' : '聪慧灵活，善于应变，但有时优柔寡断'}。

改运方向：多接触${c.bestElement}行属性的人、事、物，方位上以${ELEMENT_DIRECTION_MAP[c.bestElement as FiveElement] || '本地'}为佳，${c.happyElements.map(el => `${el}行颜色`).join('、')}为幸运色。${DISCLAIMER}`
  },
  (c) => {
    return `观您命盘，日主${c.dayGan}${c.dayElement}，综合命局分析如下：

一、格局：${c.geJuName}格，${c.overallScore >= 60 ? '格局清正，命运基础良好' : '格局需调理，需借助后天努力弥补'}。
二、日主：${c.strength}，${c.strengthScore >= 50 ? '根基稳固，能承担事业与家庭重任' : '根基偏弱，宜借外力帮扶'}。
三、喜用：喜${c.bestElement}行，${c.bestElement === '木' ? '多接触绿色植物、东方方位、木行行业' : c.bestElement === '火' ? '多接触阳光、南方方位、火行行业' : c.bestElement === '土' ? '注重稳定、中部方位、土行行业' : c.bestElement === '金' ? '多接触金属饰品、西方方位、金行行业' : '多接触水景、北方方位、水行行业'}。
四、忌讳：${c.avoidedElements.length > 0 ? `忌${c.avoidedElements.join('、')}行，尽量避免相关的不利因素` : '无明显忌讳，五行较为均衡'}。

${c.currentDaYun ? `当前大运${c.currentDaYun}，正值${c.happyElements.includes(c.bestElement as FiveElement) ? '运势上升期，宜积极进取' : '运势调整期，宜稳中求进'}。` : ''}${DISCLAIMER}`
  },
  (c) => {
    return `观您命盘，${c.dayGan}${c.dayElement}日主，${c.strength}。综合各方面为您做一个总体分析：

命局特点：${c.geJuName}格，五行${c.fiveElements['木'] || 0}/${c.fiveElements['火'] || 0}/${c.fiveElements['土'] || 0}/${c.fiveElements['金'] || 0}/${c.fiveElements['水'] || 0}分布。${c.overallScore >= 70 ? '命盘质量上乘，先天禀赋优越' : c.overallScore >= 50 ? '命盘中规中矩，通过后天调理可达上佳状态' : '命盘需后天大力调理，但"命由己造"，改运空间反而更大'}。

人生建议：
- 事业上：${c.bestElement}行方位和行业最为有利
- 财运上：${c.strengthScore >= 50 ? '可适度投资，富贵可期' : '以稳健为主，积少成多'}
- 感情上：夫妻宫${c.dayZhi}，${c.happyElements.includes(getBranchElement(c.dayZhi as EarthlyBranch)) ? '配偶助力大' : '需双方多包容'}
- 健康上：注意${findWeakestElement(c.fiveElements) || '全面'}调养

把握${c.bestElement}行旺的时机顺势而为，自然诸事顺遂。${DISCLAIMER}`
  },
]

// ---------------------------------------------------------------------------
// 模板选择器（基于数据特征选择变体）
// ---------------------------------------------------------------------------

const TEMPLATES_MAP: Record<QuestionCategory, ((c: TemplateContext) => string)[]> = {
  career: CAREER_TEMPLATES,
  marriage: MARRIAGE_TEMPLATES,
  wealth: WEALTH_TEMPLATES,
  health: HEALTH_TEMPLATES,
  direction: DIRECTION_TEMPLATES,
  study: STUDY_TEMPLATES,
  luck: LUCK_TEMPLATES,
  general: GENERAL_TEMPLATES,
}

/** 根据上下文特征选择模板索引 */
function selectTemplateIndex(category: QuestionCategory, ctx: TemplateContext): number {
  // 基于日主强弱和喜用神组合选择不同变体
  const shiShiCount = ctx.shenShiList.filter(Boolean).length
  const hasDaYun = ctx.daYunSteps.length > 0

  switch (category) {
    case 'career':
      if (ctx.question.includes('创业') || ctx.question.includes('做老板')) return 2
      if (ctx.strengthScore >= 60) return 0
      if (shiShiCount >= 3) return 3
      return 1
    case 'marriage':
      if (ctx.question.includes('桃花') || ctx.question.includes('姻缘')) return 2
      if (ctx.strengthScore >= 60) return 0
      return hasDaYun ? 3 : 1
    case 'wealth':
      if (ctx.question.includes('投资') || ctx.question.includes('股票')) return 3
      if (ctx.strengthScore >= 60) return 0
      return hasDaYun ? 1 : 2
    case 'health':
      if (ctx.question.includes('养生')) return 3
      if (findMissingElements(ctx.fiveElements).length > 0) return 2
      return ctx.strengthScore >= 60 ? 0 : 1
    case 'direction':
      if (ctx.question.includes('出国') || ctx.question.includes('搬迁')) return 0
      if (ctx.question.includes('城市')) return 1
      return ctx.strengthScore >= 60 ? 2 : 3
    case 'study':
      if (ctx.question.includes('考试') || ctx.question.includes('高考') || ctx.question.includes('考研')) return 1
      if (ctx.question.includes('文昌')) return 3
      return ctx.strengthScore >= 60 ? 0 : 2
    case 'luck':
      if (ctx.question.includes('何时') || ctx.question.includes('什么时候')) return 2
      if (ctx.question.includes('今年') || ctx.question.includes('明年')) return 1
      return hasDaYun ? 0 : 3
    default:
      if (ctx.question.includes('性格') || ctx.question.includes('命')) return 1
      if (ctx.strengthScore >= 60) return 0
      return hasDaYun ? 2 : 3
  }
}

// ---------------------------------------------------------------------------
// 建议生成
// ---------------------------------------------------------------------------

function generateSuggestions(category: QuestionCategory, ctx: TemplateContext): string[] {
  const base: Record<QuestionCategory, string[]> = {
    career: [
      `事业发展宜选${ELEMENT_DIRECTION_MAP[ctx.bestElement as FiveElement] || '本地'}方位`,
      `从事${ELEMENT_INDUSTRY_MAP[ctx.bestElement as FiveElement]?.[0] || '适合自身五行'}相关行业最为有利`,
      ctx.strengthScore >= 50 ? '可以适当接受挑战，拓宽事业边界' : '稳中求进，在擅长的领域深耕',
      ctx.currentDaYun ? `当前${ctx.currentDaYun}，把握运势窗口期` : '把握喜用五行旺的年份发力',
    ],
    marriage: [
      `择偶宜选${ctx.bestElement}行属性强的人`,
      `${ELEMENT_DIRECTION_MAP[ctx.bestElement as FiveElement] || '本地'}方位利于姻缘`,
      '婚姻中多包容理解，以和为贵',
      '感情之事不可强求，缘分到时自然水到渠成',
    ],
    wealth: [
      `${ctx.bestElement}行方位和行业为求财首选`,
      ctx.strengthScore >= 50 ? '可适度进取投资，但不建议全部押注' : '理财以稳健为主，量入为出',
      `幸运数字${ELEMENT_NUMBER_MAP[ctx.bestElement as FiveElement]?.join('、') || '根据喜用五行选定'}`,
      ctx.avoidedElements.length > 0 ? `避开${ctx.avoidedElements[0]}行相关投机` : '定期储蓄，积少成多',
    ],
    health: [
      `重点关注${findWeakestElement(ctx.fiveElements) ? ELEMENT_ORGAN_MAP[findWeakestElement(ctx.fiveElements) as FiveElement] : '全面'}健康`,
      '保持规律作息，适度运动',
      `多穿戴${ctx.bestElement === '木' ? '绿色系' : ctx.bestElement === '火' ? '红色系' : ctx.bestElement === '土' ? '黄色系' : ctx.bestElement === '金' ? '白色系' : '黑色/蓝色系'}衣物助运`,
      '每年定期体检，防患于未然',
    ],
    direction: [
      `居住和工作首选${ELEMENT_DIRECTION_MAP[ctx.bestElement as FiveElement] || '本地'}方位`,
      ctx.avoidedElements.length > 0 ? `避开${ctx.avoidedElements.map(el => ELEMENT_DIRECTION_MAP[el]).join('、')}方位` : '方位选择以舒适为主',
      '重要决策面向喜用方位',
      '旅行出差优先选择喜用方位目的地',
    ],
    study: [
      `学习座位面向${ELEMENT_DIRECTION_MAP[ctx.bestElement as FiveElement] || '采光好的方向'}`,
      `适合${ctx.bestElement === '水' ? '理论研究' : ctx.bestElement === '木' ? '人文社科' : ctx.bestElement === '火' ? '艺术传媒' : ctx.bestElement === '金' ? '工程技术' : '管理经济'}方向深造`,
      '保持专注力，避免分心',
      '考试前面向喜用方位温习',
    ],
    luck: [
      `把握${ctx.bestElement}行大运流年的机遇期`,
      ctx.avoidedElements.length > 0 ? `${ctx.avoidedElements[0]}行年份保守行事` : '顺势而为，不可逆势强求',
      '逢喜用年份积极行动，逢忌神年份蓄力待发',
      ctx.currentDaYun ? `当前${ctx.currentDaYun}，顺势而为` : '把握当下的每一个机遇',
    ],
    general: [
      `多接触${ctx.bestElement}行属性的人事物`,
      `${ELEMENT_DIRECTION_MAP[ctx.bestElement as FiveElement] || '本地'}方位对您最有利`,
      `幸运色为${ctx.bestElement === '木' ? '绿色' : ctx.bestElement === '火' ? '红色' : ctx.bestElement === '土' ? '黄色' : ctx.bestElement === '金' ? '白色' : '黑色/蓝色'}系`,
      '保持积极心态，命由己造',
    ],
  }

  return base[category].slice(0, 4)
}

// ---------------------------------------------------------------------------
// 命理维度映射
// ---------------------------------------------------------------------------

const CATEGORY_ASPECTS: Record<QuestionCategory, string[]> = {
  career: ['十神', '日主强弱', '喜用神', '大运'],
  marriage: ['日支', '桃花', '喜用神', '大运'],
  wealth: ['财星', '食伤', '喜用神', '大运'],
  health: ['五行平衡', '日主强弱', '脏腑映射'],
  direction: ['喜用神', '五行方位', '日支'],
  study: ['印星', '官杀', '文昌', '大运'],
  luck: ['大运', '流年', '喜用神', '日主强弱'],
  general: ['日主', '格局', '喜用神', '五行分布'],
}

// ---------------------------------------------------------------------------
// 核心函数
// ---------------------------------------------------------------------------

export function askMaster(input: AskMasterInput): AskMasterResult {
  const category = classifyQuestion(input.question)
  const ctx = buildContext(input)

  const templates = TEMPLATES_MAP[category]
  const templateIndex = selectTemplateIndex(category, ctx)
  const template = templates[templateIndex % templates.length]

  const answer = template(ctx)
  const relatedAspects = CATEGORY_ASPECTS[category]
  const confidence = calcConfidence(input)
  const suggestions = generateSuggestions(category, ctx)

  return {
    answer,
    relatedAspects,
    confidence,
    suggestions,
  }
}

// ---------------------------------------------------------------------------
// 辅助：地支五行（避免 core 依赖）
// ---------------------------------------------------------------------------

const BRANCH_ELEMENT_MAP: Record<string, FiveElement> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

function getBranchElement(branch: EarthlyBranch): FiveElement {
  return BRANCH_ELEMENT_MAP[branch] || '土'
}
