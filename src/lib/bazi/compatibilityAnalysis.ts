/**
 * 合婚系统 Ultimate — V4.3
 *
 * 九维度量化合婚分析：四柱/十神/纳音/神煞/夫妻宫/子女宫/大运同步/五行互补
 * 含未来10年婚运预测与万字完整报告生成
 */

import type {
  BaZiChart,
  GanZhi,
  FiveElement,
  HeavenlyStem,
  EarthlyBranch,
  ShenShi,
} from './types'

// ═══════════════════════════════════════
// 接口定义
// ═══════════════════════════════════════

export interface CompatibilityInput {
  chart1: BaZiChart
  chart2: BaZiChart
  gender1?: 'male' | 'female'
  gender2?: 'male' | 'female'
}

export interface CompatibilityResult {
  overallScore: number
  overallLevel: string
  dimensions: {
    fourPillar: DimensionResult
    tenGod: DimensionResult
    nayin: DimensionResult
    shensha: DimensionResult
    spousePalace: DimensionResult
    childPalace: DimensionResult
    daYunSync: DimensionResult
    fiveElement: DimensionResult
  }
  marriageFortune: MarriageFortune[]
  strengths: string[]
  weaknesses: string[]
  advice: string[]
  summary: string
  fullReport: string
}

export interface DimensionResult {
  score: number
  level: string
  description: string
}

export interface MarriageFortune {
  year: number
  score: number
  description: string
}

// ═══════════════════════════════════════
// 常量表
// ═══════════════════════════════════════

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const FIVE_ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水']

const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

const STEM_YINYANG: Record<HeavenlyStem, '阳' | '阴'> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴',
  '戊': '阳', '己': '阴', '庚': '阳', '辛': '阴',
  '壬': '阳', '癸': '阴',
}

const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

// 五行相生：A 生 B
const GENERATE: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

// 五行相克：A 克 B
const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

// 天干五合
const TIAN_GAN_WU_HE: [HeavenlyStem, HeavenlyStem, FiveElement][] = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'],
  ['丁', '壬', '木'], ['戊', '癸', '火'],
]

// 地支六合
const DI_ZHI_LIU_HE: [EarthlyBranch, EarthlyBranch, FiveElement][] = [
  ['子', '丑', '土'], ['寅', '亥', '木'], ['卯', '戌', '火'],
  ['辰', '酉', '金'], ['巳', '申', '水'], ['午', '未', '土'],
]

// 地支三合
const DI_ZHI_SAN_HE: [EarthlyBranch, EarthlyBranch, EarthlyBranch, FiveElement][] = [
  ['申', '子', '辰', '水'], ['亥', '卯', '未', '木'],
  ['寅', '午', '戌', '火'], ['巳', '酉', '丑', '金'],
]

// 地支六冲
const DI_ZHI_LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

// 地支三刑
const DI_ZHI_SAN_XING: [EarthlyBranch, EarthlyBranch, EarthlyBranch][] = [
  ['寅', '巳', '申'], ['丑', '戌', '未'], ['子', '卯', '辰'],
]

// 地支六害
const DI_ZHI_LIU_HAI: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

// 纳音五行映射
const NAYIN_ELEMENT_MAP: Record<string, FiveElement> = {
  '海中金': '金', '炉中火': '火', '大林木': '木', '路旁土': '土',
  '剑锋金': '金', '山头火': '火', '涧下水': '水', '城头土': '土',
  '白蜡金': '金', '杨柳木': '木', '泉中水': '水', '屋上土': '土',
  '霹雳火': '火', '松柏木': '木', '长流水': '水', '沙中金': '金',
  '山下火': '火', '平地木': '木', '壁上土': '土', '金箔金': '金',
  '覆灯火': '火', '天河水': '水', '大驿土': '土', '钗钏金': '金',
  '桑柘木': '木', '大溪水': '水', '沙中土': '土', '天上火': '火',
  '石榴木': '木', '大海水': '水',
}

// 桃花查法
const TAOHUA_MAP: Record<number, number> = {
  2: 3, 6: 3, 10: 3,
  5: 6, 9: 6, 1: 6,
  8: 9, 0: 9, 4: 9,
  11: 0, 3: 0, 7: 0,
}

// 红鸾查法（年支+3）
// 天喜查法（年支+9）

// ═══════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════

function scoreToLevel(score: number): string {
  if (score >= 90) return '极佳'
  if (score >= 75) return '良好'
  if (score >= 55) return '一般'
  if (score >= 35) return '较差'
  return '大凶'
}

function overallScoreToLevel(score: number): string {
  if (score >= 90) return '天作之合'
  if (score >= 75) return '佳配'
  if (score >= 55) return '般配'
  if (score >= 35) return '不合'
  return '大忌'
}

function isGenerating(a: FiveElement, b: FiveElement): boolean {
  return GENERATE[a] === b
}

function isOvercoming(a: FiveElement, b: FiveElement): boolean {
  return OVERCOME[a] === b
}

function checkTianGanHe(a: HeavenlyStem, b: HeavenlyStem): FiveElement | null {
  for (const [g1, g2, hua] of TIAN_GAN_WU_HE) {
    if ((a === g1 && b === g2) || (a === g2 && b === g1)) return hua
  }
  return null
}

function checkDiZhiHe(a: EarthlyBranch, b: EarthlyBranch): FiveElement | null {
  for (const [z1, z2, hua] of DI_ZHI_LIU_HE) {
    if ((a === z1 && b === z2) || (a === z2 && b === z1)) return hua
  }
  return null
}

function checkDiZhiSanHe(a: EarthlyBranch, b: EarthlyBranch, c: EarthlyBranch): FiveElement | null {
  const set = new Set([a, b, c])
  for (const [z1, z2, z3, hua] of DI_ZHI_SAN_HE) {
    if (set.has(z1) && set.has(z2) && set.has(z3)) return hua
  }
  return null
}

function isDiZhiChong(a: EarthlyBranch, b: EarthlyBranch): boolean {
  for (const [z1, z2] of DI_ZHI_LIU_CHONG) {
    if ((a === z1 && b === z2) || (a === z2 && b === z1)) return true
  }
  return false
}

function isDiZhiHai(a: EarthlyBranch, b: EarthlyBranch): boolean {
  for (const [z1, z2] of DI_ZHI_LIU_HAI) {
    if ((a === z1 && b === z2) || (a === z2 && b === z1)) return true
  }
  return false
}

function getNaYinElement(naYin: string): FiveElement {
  return NAYIN_ELEMENT_MAP[naYin] ?? '土'
}

function getTaohuaBranch(yearZhi: EarthlyBranch): EarthlyBranch {
  const idx = BRANCHES.indexOf(yearZhi)
  return BRANCHES[TAOHUA_MAP[idx]]
}

function getHongluanBranch(yearZhi: EarthlyBranch): EarthlyBranch {
  const idx = BRANCHES.indexOf(yearZhi)
  return BRANCHES[(idx + 3) % 12]
}

function getTianxiBranch(yearZhi: EarthlyBranch): EarthlyBranch {
  const idx = BRANCHES.indexOf(yearZhi)
  return BRANCHES[(idx + 9) % 12]
}

function getAllZhi(sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi }): EarthlyBranch[] {
  return [sixLines.year.zhi, sixLines.month.zhi, sixLines.day.zhi, sixLines.hour.zhi]
}

function getAllGan(sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi }): HeavenlyStem[] {
  return [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan]
}

// 十神→五行映射（相对日主）
function shenshiToElement(shenshi: ShenShi): FiveElement | null {
  const map: Partial<Record<ShenShi, FiveElement>> = {
    '比肩': null, '劫财': null,
    '食神': null, '伤官': null,
    '偏财': null, '正财': null,
    '偏官': null, '正官': null,
    '偏印': null, '正印': null,
  }
  return map[shenshi] ?? null
}

// 获取十神对应的五行类别
function shenshiCategory(shenshi: ShenShi): string {
  if (shenshi === '比肩' || shenshi === '劫财') return '比劫'
  if (shenshi === '食神' || shenshi === '伤官') return '食伤'
  if (shenshi === '偏财' || shenshi === '正财') return '财星'
  if (shenshi === '偏官' || shenshi === '正官') return '官杀'
  if (shenshi === '偏印' || shenshi === '正印') return '印星'
  return '未知'
}

// 获取某人四柱中各十神类别的天干
function getShenShiByCategory(
  chart: BaZiChart,
): Record<string, HeavenlyStem[]> {
  const result: Record<string, HeavenlyStem[]> = {
    '比劫': [], '食伤': [], '财星': [], '官杀': [], '印星': [],
  }
  const dayGan = chart.sixLines.day.gan
  const related = chart.dayMaster.relatedShens
  const allGans = getAllGan(chart.sixLines)

  for (const gan of allGans) {
    if (gan === dayGan) continue
    const shenshi = related[gan]
    if (shenshi) {
      const cat = shenshiCategory(shenshi)
      if (cat !== '未知') result[cat].push(gan)
    }
  }
  return result
}

// ═══════════════════════════════════════
// 维度一：四柱匹配
// ═══════════════════════════════════════

function scoreFourPillar(chart1: BaZiChart, chart2: BaZiChart): DimensionResult {
  let score = 50
  const details: string[] = []

  const gan1 = getAllGan(chart1.sixLines)
  const gan2 = getAllGan(chart2.sixLines)
  const zhi1 = getAllZhi(chart1.sixLines)
  const zhi2 = getAllZhi(chart2.sixLines)

  // 天干合
  for (let i = 0; i < 4; i++) {
    const he = checkTianGanHe(gan1[i], gan2[i])
    if (he) {
      score += 8
      details.push(`${gan1[i]}与${gan2[i]}天干五合化${he}，感情融洽`)
    }
  }

  // 地支合
  for (let i = 0; i < 4; i++) {
    const he = checkDiZhiHe(zhi1[i], zhi2[i])
    if (he) {
      score += 8
      details.push(`${zhi1[i]}与${zhi2[i]}地支六合化${he}，根基稳固`)
    }
  }

  // 地支冲
  for (let i = 0; i < 4; i++) {
    if (isDiZhiChong(zhi1[i], zhi2[i])) {
      score -= 12
      details.push(`${zhi1[i]}与${zhi2[i]}六冲，易生矛盾`)
    }
  }

  // 地支害
  for (let i = 0; i < 4; i++) {
    if (isDiZhiHai(zhi1[i], zhi2[i])) {
      score -= 6
      details.push(`${zhi1[i]}与${zhi2[i]}六害，暗中相克`)
    }
  }

  // 天干相生
  for (let i = 0; i < 4; i++) {
    const e1 = STEM_ELEMENT[gan1[i]]
    const e2 = STEM_ELEMENT[gan2[i]]
    if (isGenerating(e1, e2)) {
      score += 4
      details.push(`${gan1[i]}(${e1})生${gan2[i]}(${e2})，相互扶持`)
    } else if (isGenerating(e2, e1)) {
      score += 4
      details.push(`${gan2[i]}(${e2})生${gan1[i]}(${e1})，相互扶持`)
    }
  }

  // 同柱干支合（天地德合）
  for (let i = 0; i < 4; i++) {
    const ganHe = checkTianGanHe(gan1[i], gan2[i])
    const zhiHe = checkDiZhiHe(zhi1[i], zhi2[i])
    if (ganHe && zhiHe) {
      score += 10
      details.push(`第${i + 1}柱天地双合，缘分深厚`)
    }
  }

  score = Math.max(0, Math.min(100, score))

  const pillarNames = ['年柱', '月柱', '日柱', '时柱']
  let description = `四柱匹配分析：`
  if (details.length === 0) {
    description += `双方四柱干支无明显合冲关系，属于平淡组合。感情发展需靠后天培养与经营，先天命理助力有限。建议双方在日常生活中多沟通、多包容，以性格互补弥补命理上的平淡配合。`
  } else {
    description += details.join('；') + '。'
    description += `综合来看，双方四柱${score >= 70 ? '配合较好' : score >= 50 ? '尚可配合' : '存在冲突'}，`
    description += `${score >= 70 ? '先天缘分较深，婚姻基础稳固' : score >= 50 ? '需后天努力维系感情' : '易有摩擦，需特别注意经营'}。`
  }

  return { score, level: scoreToLevel(score), description }
}

// ═══════════════════════════════════════
// 维度二：十神匹配
// ═══════════════════════════════════════

function scoreTenGod(
  chart1: BaZiChart,
  chart2: BaZiChart,
  gender1?: 'male' | 'female',
  gender2?: 'male' | 'female',
): DimensionResult {
  let score = 50
  const details: string[] = []

  const maleChart = gender1 === 'male' ? chart1 : gender2 === 'male' ? chart2 : chart1
  const femaleChart = gender1 === 'female' ? chart1 : gender2 === 'female' ? chart2 : chart2

  const maleShenShi = getShenShiByCategory(maleChart)
  const femaleShenShi = getShenShiByCategory(femaleChart)

  // 男方官杀多 → 女方财星多 → 佳（男方以财为妻，女方以官为夫）
  const maleGuanZha = maleShenShi['官杀'].length
  const femaleCaiXing = femaleShenShi['财星'].length
  if (maleGuanZha > 0 && femaleCaiXing > 0) {
    score += 12
    details.push('男方官杀星与女方财星呼应，阴阳调和')
  }

  // 女方食伤多 → 能生男方财星
  const femaleShiShang = femaleShenShi['食伤'].length
  if (femaleShiShang > 0 && femaleCaiXing > 0) {
    score += 8
    details.push('女方食伤生财，利于双方经济')
  }

  // 男方财星多 → 女方官杀多
  const maleCaiXing = maleShenShi['财星'].length
  const femaleGuanZha = femaleShenShi['官杀'].length
  if (maleCaiXing > 0 && femaleGuanZha > 0) {
    score += 10
    details.push('男方财星配女方官杀，夫妻星对应')
  }

  // 双方印星均多 → 都重感情
  const maleYinXing = maleShenShi['印星'].length
  const femaleYinXing = femaleShenShi['印星'].length
  if (maleYinXing >= 2 && femaleYinXing >= 2) {
    score += 8
    details.push('双方印星均旺，重视家庭与感情')
  }

  // 比劫过重 → 争夺
  const maleBiJie = maleShenShi['比劫'].length
  const femaleBiJie = femaleShenShi['比劫'].length
  if (maleBiJie >= 3 || femaleBiJie >= 3) {
    score -= 8
    details.push('一方比劫过重，性格固执，易生争执')
  }

  // 食伤过重克官 → 不利婚姻
  if (femaleShiShang >= 3) {
    score -= 6
    details.push('女方食伤过旺，恐有克夫之嫌')
  }

  score = Math.max(0, Math.min(100, score))

  let description = `十神匹配分析：`
  if (details.length === 0) {
    description += `双方十神配置无特殊呼应关系，属中性组合。婚姻质量更多取决于双方性格修养与后天经营。`
  } else {
    description += details.join('；') + '。'
  }
  description += `从十神角度看，双方${score >= 70 ? '命理配合默契' : score >= 50 ? '基本协调' : '存在一定矛盾'}，`
  description += `${score >= 70 ? '夫妻宫与十神配置相得益彰' : score >= 50 ? '需相互理解包容' : '建议多关注对方感受'}。`

  return { score, level: scoreToLevel(score), description }
}

// ═══════════════════════════════════════
// 维度三：纳音匹配
// ═══════════════════════════════════════

function scoreNayin(chart1: BaZiChart, chart2: BaZiChart): DimensionResult {
  let score = 50
  const details: string[] = []

  const naYin1 = [
    chart1.sixLines.year.naYin,
    chart1.sixLines.month.naYin,
    chart1.sixLines.day.naYin,
    chart1.sixLines.hour.naYin,
  ]
  const naYin2 = [
    chart2.sixLines.year.naYin,
    chart2.sixLines.month.naYin,
    chart2.sixLines.day.naYin,
    chart2.sixLines.hour.naYin,
  ]

  for (let i = 0; i < 4; i++) {
    const e1 = getNaYinElement(naYin1[i])
    const e2 = getNaYinElement(naYin2[i])

    // 相生
    if (isGenerating(e1, e2)) {
      score += 8
      details.push(`${naYin1[i]}生${naYin2[i]}，纳音相生`)
    } else if (isGenerating(e2, e1)) {
      score += 8
      details.push(`${naYin2[i]}生${naYin1[i]}，纳音相生`)
    }

    // 相克
    if (isOvercoming(e1, e2)) {
      score -= 8
      details.push(`${naYin1[i]}克${naYin2[i]}，纳音相克`)
    } else if (isOvercoming(e2, e1)) {
      score -= 8
      details.push(`${naYin2[i]}克${naYin1[i]}，纳音相克`)
    }

    // 同类
    if (e1 === e2) {
      score += 4
      details.push(`双方${['年', '月', '日', '时'][i]}柱纳音同属${e1}，根基相类`)
    }
  }

  score = Math.max(0, Math.min(100, score))

  let description = `纳音匹配分析：双方年柱纳音分别为「${naYin1[0]}」与「${naYin2[0]}」，`
  if (details.length > 0) {
    description += details.join('；') + '。'
  }
  description += `纳音体系反映双方生命底色，${score >= 70 ? '纳音五行多相生，感情和谐美满' : score >= 50 ? '纳音配合平平，需靠后天磨合' : '纳音多相克，婚姻中摩擦较多'}。`

  return { score, level: scoreToLevel(score), description }
}

// ═══════════════════════════════════════
// 维度四：神煞匹配
// ═══════════════════════════════════════

function scoreShenSha(chart1: BaZiChart, chart2: BaZiChart): DimensionResult {
  let score = 50
  const details: string[] = []

  const zhi1 = getAllZhi(chart1.sixLines)
  const zhi2 = getAllZhi(chart2.sixLines)
  const zhiSet1 = new Set(zhi1)
  const zhiSet2 = new Set(zhi2)

  // 桃花重叠
  const taohua1 = getTaohuaBranch(chart1.sixLines.year.zhi)
  const taohua2 = getTaohuaBranch(chart2.sixLines.year.zhi)
  if (taohua1 === taohua2) {
    score += 12
    details.push(`双方桃花同在${taohua1}，人缘姻缘俱佳`)
  }
  if (zhiSet1.has(taohua2) || zhiSet2.has(taohua1)) {
    score += 8
    details.push('桃花星互见，相互吸引')
  }

  // 红鸾重叠
  const hongluan1 = getHongluanBranch(chart1.sixLines.year.zhi)
  const hongluan2 = getHongluanBranch(chart2.sixLines.year.zhi)
  if (hongluan1 === hongluan2) {
    score += 10
    details.push(`双方红鸾同在${hongluan1}，婚姻缘分深厚`)
  }
  if (zhiSet1.has(hongluan2) || zhiSet2.has(hongluan1)) {
    score += 6
    details.push('红鸾星互见，婚姻美满')
  }

  // 天喜重叠
  const tianxi1 = getTianxiBranch(chart1.sixLines.year.zhi)
  const tianxi2 = getTianxiBranch(chart2.sixLines.year.zhi)
  if (zhiSet1.has(tianxi2) || zhiSet2.has(tianxi1)) {
    score += 6
    details.push('天喜星互见，喜庆临门')
  }

  // 驿马
  const yimaMap: Record<number, number> = { 2: 10, 6: 10, 10: 10, 5: 1, 9: 1, 1: 1, 8: 4, 0: 4, 4: 4, 11: 7, 3: 7, 7: 7 }
  const yima1 = BRANCHES[yimaMap[BRANCHES.indexOf(chart1.sixLines.year.zhi)]]
  const yima2 = BRANCHES[yimaMap[BRANCHES.indexOf(chart2.sixLines.year.zhi)]]
  if (yima1 === yima2) {
    score += 4
    details.push('双方驿马同位，人生步调一致')
  }

  score = Math.max(0, Math.min(100, score))

  let description = `神煞匹配分析：`
  if (details.length > 0) {
    description += details.join('；') + '。'
  } else {
    description += '双方命盘中的桃花、红鸾、天喜等婚姻相关神煞无明显重叠与互见。'
  }
  description += `${score >= 70 ? '神煞配合极佳，婚姻路上多有贵人相助' : score >= 50 ? '神煞配合一般，婚姻运势平稳' : '婚姻相关神煞助力不足，需更用心经营'}。`

  return { score, level: scoreToLevel(score), description }
}

// ═══════════════════════════════════════
// 维度五：夫妻宫匹配
// ═══════════════════════════════════════

function scoreSpousePalace(chart1: BaZiChart, chart2: BaZiChart): DimensionResult {
  let score = 50
  const details: string[] = []

  const dayZhi1 = chart1.sixLines.day.zhi
  const dayZhi2 = chart2.sixLines.day.zhi

  // 日支六合
  const he = checkDiZhiHe(dayZhi1, dayZhi2)
  if (he) {
    score += 18
    details.push(`日支${dayZhi1}与${dayZhi2}六合化${he}，夫妻宫相合，感情深厚`)
  }

  // 日支相冲
  if (isDiZhiChong(dayZhi1, dayZhi2)) {
    score -= 18
    details.push(`日支${dayZhi1}与${dayZhi2}六冲，夫妻宫对冲，感情易有波折`)
  }

  // 日支相害
  if (isDiZhiHai(dayZhi1, dayZhi2)) {
    score -= 10
    details.push(`日支${dayZhi1}与${dayZhi2}六害，夫妻宫相害，暗生嫌隙`)
  }

  // 日支五行相生
  const e1 = BRANCH_ELEMENT[dayZhi1]
  const e2 = BRANCH_ELEMENT[dayZhi2]
  if (isGenerating(e1, e2)) {
    score += 10
    details.push(`日支${e1}生${e2}，夫妻宫五行相生，互相扶持`)
  } else if (isGenerating(e2, e1)) {
    score += 10
    details.push(`日支${e2}生${e1}，夫妻宫五行相生，互相扶持`)
  }

  // 日支五行相同
  if (e1 === e2) {
    score += 6
    details.push(`夫妻宫同属${e1}，价值观相近`)
  }

  // 日支三合
  for (const [z1, z2, z3, hua] of DI_ZHI_SAN_HE) {
    const trio = new Set([dayZhi1, dayZhi2])
    if (trio.has(z1) && trio.has(z2)) {
      score += 8
      details.push(`日支参与${z1}${z2}${z3}三合${hua}局，夫妻宫得合`)
      break
    }
  }

  score = Math.max(0, Math.min(100, score))

  let description = `夫妻宫匹配分析：甲方日支为「${dayZhi1}」，乙方日支为「${dayZhi2}」。`
  if (details.length > 0) {
    description += details.join('；') + '。'
  }
  description += `夫妻宫直接关系婚姻质量，${score >= 70 ? '双方夫妻宫配合极佳，婚姻幸福美满' : score >= 50 ? '夫妻宫配合尚可，需经营维护' : '夫妻宫冲突明显，婚姻中需多包容忍让'}。`

  return { score, level: scoreToLevel(score), description }
}

// ═══════════════════════════════════════
// 维度六：子女宫匹配
// ═══════════════════════════════════════

function scoreChildPalace(chart1: BaZiChart, chart2: BaZiChart): DimensionResult {
  let score = 50
  const details: string[] = []

  const hourZhi1 = chart1.sixLines.hour.zhi
  const hourZhi2 = chart2.sixLines.hour.zhi

  // 时柱地支合
  const he = checkDiZhiHe(hourZhi1, hourZhi2)
  if (he) {
    score += 12
    details.push(`时支${hourZhi1}与${hourZhi2}六合，子女宫相合`)
  }

  // 时支冲
  if (isDiZhiChong(hourZhi1, hourZhi2)) {
    score -= 10
    details.push(`时支${hourZhi1}与${hourZhi2}六冲，子女宫对冲`)
  }

  // 时柱五行互补
  const hourElement1 = BRANCH_ELEMENT[hourZhi1]
  const hourElement2 = BRANCH_ELEMENT[hourZhi2]

  const need1 = findLacking(chart1.fiveElementCount)
  const need2 = findLacking(chart2.fiveElementCount)

  if (need1.includes(hourElement2)) {
    score += 8
    details.push(`乙方时柱${hourElement2}补充甲方所缺五行`)
  }
  if (need2.includes(hourElement1)) {
    score += 8
    details.push(`甲方时柱${hourElement1}补充乙方所缺五行`)
  }

  // 时柱天干相生
  const hourGan1 = chart1.sixLines.hour.gan
  const hourGan2 = chart2.sixLines.hour.gan
  const heGan = checkTianGanHe(hourGan1, hourGan2)
  if (heGan) {
    score += 6
    details.push(`时干${hourGan1}与${hourGan2}五合，子女缘佳`)
  }

  score = Math.max(0, Math.min(100, score))

  let description = `子女宫匹配分析：甲方时柱为「${hourGan1}${hourZhi1}」，乙方时柱为「${hourGan2}${hourZhi2}」。`
  if (details.length > 0) {
    description += details.join('；') + '。'
  }
  description += `子女宫关乎后代缘法与家庭传承，${score >= 70 ? '双方子女宫配合佳，子息缘分深厚' : score >= 50 ? '子女宫配合一般，育儿需共同努力' : '子女宫有冲突，需特别关注子女教育问题'}。`

  return { score, level: scoreToLevel(score), description }
}

function findLacking(count: { '木': number; '火': number; '土': number; '金': number; '水': number }): FiveElement[] {
  const lacking: FiveElement[] = []
  for (const e of FIVE_ELEMENTS) {
    if (count[e] <= 1) lacking.push(e)
  }
  return lacking
}

// ═══════════════════════════════════════
// 维度七：大运同步
// ═══════════════════════════════════════

function scoreDaYunSync(chart1: BaZiChart, chart2: BaZiChart): DimensionResult {
  let score = 50
  const details: string[] = []

  // 基于双方喜用神与大运五行的模拟同步分析
  // 大运走法：阳男阴女顺排，阴男阳女逆排
  // 这里通过喜用神和五行分布来推算大运同步度

  const xiYong1 = chart1.xiYongShen
  const xiYong2 = chart2.xiYongShen

  // 双方喜用神是否有交集
  const allXi1: FiveElement[] = [xiYong1.bestElement, ...xiYong1.happiness ? [xiYong1.happiness as unknown as FiveElement].filter(Boolean) : []]
  const allXi2: FiveElement[] = [xiYong2.bestElement, ...xiYong2.happiness ? [xiYong2.happiness as unknown as FiveElement].filter(Boolean) : []]

  const commonXi = allXi1.filter(e => allXi2.includes(e))
  if (commonXi.length > 0) {
    score += 15
    details.push(`双方喜用神有交集（${commonXi.join('、')}），大运同步走好运的概率高`)
  }

  // 双方忌神是否有冲突
  const avoid1 = xiYong1.avoidedElements || []
  const avoid2 = xiYong2.avoidedElements || []
  const commonAvoid = avoid1.filter(e => avoid2.includes(e))
  if (commonAvoid.length > 0) {
    score += 5
    details.push(`双方忌神相同（${commonAvoid.join('、')}），同步走差运时需共同应对`)
  }

  // 年柱纳音五行是否相生（大运基调）
  const yearNaYin1 = chart1.sixLines.year.naYin
  const yearNaYin2 = chart2.sixLines.year.naYin
  const nyE1 = getNaYinElement(yearNaYin1)
  const nyE2 = getNaYinElement(yearNaYin2)
  if (isGenerating(nyE1, nyE2) || isGenerating(nyE2, nyE1)) {
    score += 8
    details.push(`年柱纳音相生，人生大运基调和谐`)
  }

  // 五行互补加分
  const lack1 = findLacking(chart1.fiveElementCount)
  const lack2 = findLacking(chart2.fiveElementCount)
  const mutualSupplement = lack1.filter(e => !lack2.includes(e))
  if (mutualSupplement.length > 0) {
    score += 6
    details.push(`双方五行互补（${mutualSupplement.join('、')}），可在对方大运中得到弥补`)
  }

  score = Math.max(0, Math.min(100, score))

  let description = `大运同步分析：甲方喜用神为「${xiYong1.bestElement}」，乙方喜用神为「${xiYong2.bestElement}」。`
  if (details.length > 0) {
    description += details.join('；') + '。'
  }
  description += `大运同步关系着婚姻长远的起伏节奏，${score >= 70 ? '双方大运多同步走旺，婚姻事业双丰收' : score >= 50 ? '大运同步度一般，有起有落属正常' : '大运容易错位，一方顺遂时另一方可能遇挫'}。`

  return { score, level: scoreToLevel(score), description }
}

// ═══════════════════════════════════════
// 维度八：五行互补
// ═══════════════════════════════════════

function scoreFiveElement(chart1: BaZiChart, chart2: BaZiChart): DimensionResult {
  let score = 50
  const details: string[] = []

  const count1 = chart1.fiveElementCount
  const count2 = chart2.fiveElementCount
  const lack1 = findLacking(count1)
  const lack2 = findLacking(count2)

  // 一方缺的五行另一方有
  const supplement1to2 = lack2.filter(e => count1[e] > 1)
  const supplement2to1 = lack1.filter(e => count2[e] > 1)

  if (supplement2to1.length > 0) {
    score += supplement2to1.length * 8
    details.push(`乙方可补甲方所缺${supplement2to1.join('、')}${supplement2to1.length > 1 ? '等' : ''}五行`)
  }
  if (supplement1to2.length > 0) {
    score += supplement1to2.length * 8
    details.push(`甲方补乙方所缺${supplement1to2.join('、')}${supplement1to2.length > 1 ? '等' : ''}五行`)
  }

  // 双方均缺某五行
  const bothLack = lack1.filter(e => lack2.includes(e))
  if (bothLack.length > 0) {
    score -= bothLack.length * 6
    details.push(`双方均缺${bothLack.join('、')}${bothLack.length > 1 ? '等' : ''}五行，此方面需特别注意补救`)
  }

  // 五行是否均衡
  const total1 = FIVE_ELEMENTS.reduce((s, e) => s + count1[e], 0)
  const total2 = FIVE_ELEMENTS.reduce((s, e) => s + count2[e], 0)
  const combined: Record<FiveElement, number> = {
    '木': count1['木'] + count2['木'],
    '火': count1['火'] + count2['火'],
    '土': count1['土'] + count2['土'],
    '金': count1['金'] + count2['金'],
    '水': count1['水'] + count2['水'],
  }
  const combinedTotal = total1 + total2
  const balanceScore = FIVE_ELEMENTS.reduce((s, e) => {
    const ratio = combined[e] / combinedTotal
    const deviation = Math.abs(ratio - 0.2)
    return s + (1 - deviation * 3)
  }, 0) / 5 * 30

  score += Math.round(balanceScore) - 15

  // 喜用神互补
  const xiYong1 = chart1.xiYongShen
  const xiYong2 = chart2.xiYongShen
  if (count2[xiYong1.bestElement] > count1[xiYong1.bestElement]) {
    score += 6
    details.push(`乙方五行可补甲方喜用神「${xiYong1.bestElement}」`)
  }
  if (count1[xiYong2.bestElement] > count2[xiYong2.bestElement]) {
    score += 6
    details.push(`甲方五行可补乙方喜用神「${xiYong2.bestElement}」`)
  }

  score = Math.max(0, Math.min(100, score))

  const lack1Str = lack1.length > 0 ? lack1.join('、') : '无'
  const lack2Str = lack2.length > 0 ? lack2.join('、') : '无'
  let description = `五行互补分析：甲方五行分布（木${count1['木']} 火${count1['火']} 土${count1['土']} 金${count1['金']} 水${count1['水']}），`
  description += `缺${lack1Str}；乙方五行分布（木${count2['木']} 火${count2['火']} 土${count2['土']} 金${count2['金']} 水${count2['水']}），缺${lack2Str}。`
  if (details.length > 0) {
    description += details.join('；') + '。'
  }
  description += `${score >= 70 ? '双方五行互补性极强，可谓天生一对' : score >= 50 ? '五行互补程度一般，可通过风水饮食等调理' : '五行互补不足，婚姻生活中需主动调适'}。`

  return { score, level: scoreToLevel(score), description }
}

// ═══════════════════════════════════════
// 婚运预测
// ═══════════════════════════════════════

function predictMarriageFortune(
  chart1: BaZiChart,
  chart2: BaZiChart,
  _dimensions: CompatibilityResult['dimensions'],
): MarriageFortune[] {
  const currentYear = new Date().getFullYear()
  const fortunes: MarriageFortune[] = []

  for (let i = 0; i < 10; i++) {
    const year = currentYear + i
    const yearGanIdx = (year - 4) % 10
    const yearZhiIdx = (year - 4) % 12
    const yearGan = STEMS[((yearGanIdx % 10) + 10) % 10]
    const yearZhi = BRANCHES[((yearZhiIdx % 12) + 12) % 12]
    const yearElement = STEM_ELEMENT[yearGan]

    let score = 60
    const reasons: string[] = []

    // 流年五行是否生双方喜用神
    const xi1 = chart1.xiYongShen.bestElement
    const xi2 = chart2.xiYongShen.bestElement
    if (isGenerating(yearElement, xi1)) {
      score += 10
      reasons.push(`流年${yearGan}(${yearElement})生甲方喜用神${xi1}`)
    }
    if (isGenerating(yearElement, xi2)) {
      score += 10
      reasons.push(`流年${yearGan}(${yearElement})生乙方喜用神${xi2}`)
    }

    // 流年是否冲双方日柱
    if (isDiZhiChong(yearZhi, chart1.sixLines.day.zhi)) {
      score -= 15
      reasons.push(`流年${yearZhi}冲甲方日支${chart1.sixLines.day.zhi}`)
    }
    if (isDiZhiChong(yearZhi, chart2.sixLines.day.zhi)) {
      score -= 15
      reasons.push(`流年${yearZhi}冲乙方日支${chart2.sixLines.day.zhi}`)
    }

    // 流年桃花
    const taohua1 = getTaohuaBranch(chart1.sixLines.year.zhi)
    const taohua2 = getTaohuaBranch(chart2.sixLines.year.zhi)
    if (yearZhi === taohua1 || yearZhi === taohua2) {
      score += 8
      reasons.push(`流年逢桃花，感情升温`)
    }

    // 流年红鸾
    const hongluan1 = getHongluanBranch(chart1.sixLines.year.zhi)
    const hongluan2 = getHongluanBranch(chart2.sixLines.year.zhi)
    if (yearZhi === hongluan1 || yearZhi === hongluan2) {
      score += 10
      reasons.push(`流年逢红鸾，喜事临门`)
    }

    // 流年天喜
    const tianxi1 = getTianxiBranch(chart1.sixLines.year.zhi)
    const tianxi2 = getTianxiBranch(chart2.sixLines.year.zhi)
    if (yearZhi === tianxi1 || yearZhi === tianxi2) {
      score += 8
      reasons.push(`流年逢天喜，喜庆之事`)
    }

    // 流年合双方日支
    if (checkDiZhiHe(yearZhi, chart1.sixLines.day.zhi)) {
      score += 5
      reasons.push(`流年合甲方夫妻宫`)
    }
    if (checkDiZhiHe(yearZhi, chart2.sixLines.day.zhi)) {
      score += 5
      reasons.push(`流年合乙方夫妻宫`)
    }

    score = Math.max(5, Math.min(100, score))

    let description = `${year}年（${yearGan}${yearZhi}年）：`
    if (reasons.length > 0) {
      description += reasons.join('；') + '。'
    }
    description += `综合婚运评分${score}分，`
    if (score >= 80) {
      description += '此年婚姻运势极佳，适合办喜事或增进感情。'
    } else if (score >= 60) {
      description += '此年婚姻运势平稳，日常经营即可。'
    } else if (score >= 40) {
      description += '此年需注意沟通，避免因琐事争执。'
    } else {
      description += '此年婚姻运势低迷，需格外包容忍让，共度难关。'
    }

    fortunes.push({ year, score, description })
  }

  return fortunes
}

// ═══════════════════════════════════════
// 优劣势与建议
// ═══════════════════════════════════════

function generateStrengths(dimensions: CompatibilityResult['dimensions']): string[] {
  const strengths: string[] = []

  if (dimensions.fourPillar.score >= 75) {
    strengths.push('四柱干支多合少冲，先天命理缘分深厚，感情基础稳固')
  }
  if (dimensions.tenGod.score >= 75) {
    strengths.push('十神配置相得益彰，夫妻星呼应良好，婚姻关系和谐')
  }
  if (dimensions.nayin.score >= 75) {
    strengths.push('纳音五行多相生，双方生命底色和谐，相处融洽自然')
  }
  if (dimensions.shensha.score >= 75) {
    strengths.push('桃花红鸾等婚姻神煞重叠互见，命中注定良缘')
  }
  if (dimensions.spousePalace.score >= 75) {
    strengths.push('夫妻宫相合，日支配合极佳，婚姻质量有保障')
  }
  if (dimensions.childPalace.score >= 75) {
    strengths.push('子女宫配合佳，子息缘分深厚，家庭传承有望')
  }
  if (dimensions.daYunSync.score >= 75) {
    strengths.push('大运同步走旺的概率高，婚姻事业双丰收')
  }
  if (dimensions.fiveElement.score >= 75) {
    strengths.push('五行互补性极强，一方之缺恰为另一方之有余')
  }

  if (strengths.length < 3) {
    strengths.push('双方均具有独立人格与自我成长意识，有利于婚姻成熟')
    if (strengths.length < 3) {
      strengths.push('双方命盘无严重冲克，婚姻大方向稳定')
    }
    if (strengths.length < 3) {
      strengths.push('可通过后天风水调理与行为修正弥补命理不足')
    }
  }

  return strengths.slice(0, 5)
}

function generateWeaknesses(dimensions: CompatibilityResult['dimensions']): string[] {
  const weaknesses: string[] = []

  if (dimensions.fourPillar.score < 50) {
    weaknesses.push('四柱冲克较多，性格与处事方式易生分歧，需要更多沟通与理解')
  }
  if (dimensions.tenGod.score < 50) {
    weaknesses.push('十神配置存在不利婚姻的因素，需警惕感情中的波折')
  }
  if (dimensions.nayin.score < 50) {
    weaknesses.push('纳音五行多相克，双方在深层价值观上可能存在差异')
  }
  if (dimensions.shensha.score < 50) {
    weaknesses.push('婚姻相关神煞助力不足，需更多后天努力维系感情')
  }
  if (dimensions.spousePalace.score < 50) {
    weaknesses.push('夫妻宫存在冲克，婚姻中易出现摩擦与分歧')
  }
  if (dimensions.childPalace.score < 50) {
    weaknesses.push('子女宫配合不佳，育儿观念可能存在分歧')
  }
  if (dimensions.daYunSync.score < 50) {
    weaknesses.push('大运容易错位，一方顺遂时另一方可能遇挫，需相互扶持')
  }
  if (dimensions.fiveElement.score < 50) {
    weaknesses.push('五行互补不足，双方在某些方面可能同时面临挑战')
  }

  if (weaknesses.length < 3) {
    weaknesses.push('婚姻中需注意保持个人空间，避免过度依赖')
    if (weaknesses.length < 3) {
      weaknesses.push('建议定期进行感情检视，及时化解小矛盾')
    }
    if (weaknesses.length < 3) {
      weaknesses.push('双方应尊重彼此的生活习惯与价值取向')
    }
  }

  return weaknesses.slice(0, 5)
}

function generateAdvice(
  dimensions: CompatibilityResult['dimensions'],
  chart1: BaZiChart,
  chart2: BaZiChart,
): string[] {
  const advice: string[] = []

  // 基于五行缺什么给建议
  const lack1 = findLacking(chart1.fiveElementCount)
  const lack2 = findLacking(chart2.fiveElementCount)
  const allLack = [...new Set([...lack1, ...lack2])]

  if (allLack.length > 0) {
    const elementAdvice: Record<FiveElement, string> = {
      '木': '多亲近自然，居家可摆放绿植，衣着宜选绿色系',
      '火': '保持热情开朗，居家可增加暖色调装饰，多参加社交活动',
      '土': '注重饮食健康，居家环境宜稳重厚实，培养耐心与踏实',
      '金': '注重秩序与规则，可佩戴金属饰品，保持环境整洁',
      '水': '多学习思考，保持灵活变通，可增加居家水景装饰',
    }
    advice.push(`五行调理建议：${allLack.map(e => elementAdvice[e]).join('；')}`)
  }

  // 夫妻宫建议
  if (dimensions.spousePalace.score < 60) {
    advice.push('夫妻宫需特别注意：卧室宜选在吉位，床头朝向需配合双方喜用神方位')
  }

  // 大运建议
  if (dimensions.daYunSync.score < 60) {
    advice.push('大运错位期建议：一方遇挫折时，另一方应给予更多理解与支持，共度时艰')
  }

  // 十神建议
  if (dimensions.tenGod.score < 60) {
    advice.push('感情经营建议：多关注对方的情感需求，避免因事业忙碌忽视家庭')
  }

  // 通用建议
  advice.push('婚姻是两个人的修行，命理仅为参考，真正的幸福取决于双方的努力与包容')
  advice.push('建议每年做一次命理流年分析，提前知晓运势起伏，做好应对准备')

  return advice.slice(0, 5)
}

// ═══════════════════════════════════════
// 300字总述
// ═══════════════════════════════════════

function generateSummary(
  result: CompatibilityResult,
  chart1: BaZiChart,
  chart2: BaZiChart,
): string {
  const { overallScore, overallLevel, dimensions } = result
  const dayGan1 = chart1.sixLines.day.gan
  const dayGan2 = chart2.sixLines.day.gan

  let summary = `经玄风门合婚系统Ultimate版全面分析，${dayGan1}日主与${dayGan2}日主的合婚综合评分为${overallScore}分，`
  summary += `命理等级为「${overallLevel}」。`

  const highDims = Object.entries(dimensions)
    .filter(([, d]) => d.score >= 75)
    .map(([k]) => k)
  const lowDims = Object.entries(dimensions)
    .filter(([, d]) => d.score < 45)
    .map(([k]) => k)

  const dimNames: Record<string, string> = {
    fourPillar: '四柱匹配', tenGod: '十神匹配', nayin: '纳音匹配',
    shensha: '神煞匹配', spousePalace: '夫妻宫', childPalace: '子女宫',
    daYunSync: '大运同步', fiveElement: '五行互补',
  }

  if (highDims.length > 0) {
    summary += `其中${highDims.map(d => dimNames[d]).join('、')}表现突出，`
    summary += `说明双方在这些方面天生契合，为婚姻奠定了良好基础。`
  }

  if (lowDims.length > 0) {
    summary += `需注意的是${lowDims.map(d => dimNames[d]).join('、')}评分偏低，`
    summary += `这些方面可能成为婚姻中的潜在挑战，建议双方有针对性地加强沟通与调整。`
  }

  if (overallScore >= 75) {
    summary += `总体而言，双方命理配合较好，只要在日常生活中保持良好的沟通习惯，相互尊重、彼此扶持，婚姻生活将趋于美满幸福。`
  } else if (overallScore >= 55) {
    summary += `总体而言，双方命理配合尚可，婚姻中既有先天优势也有需要克服的困难。建议双方以诚相待，用后天的努力弥补命理上的不足，共同营造和谐的家庭生活。`
  } else {
    summary += `总体而言，双方命理配合存在一定困难，婚姻路上可能面临较多挑战。但命理并非定数，双方若能深刻理解彼此的差异，以包容和智慧化解矛盾，依然可以建立起稳固的婚姻关系。`
  }

  return summary
}

// ═══════════════════════════════════════
// 万字完整报告
// ═══════════════════════════════════════

function generateFullReport(
  input: CompatibilityInput,
  result: CompatibilityResult,
): string {
  const { chart1, chart2 } = input
  const { dimensions, marriageFortune, strengths, weaknesses, advice, overallScore, overallLevel } = result

  const dayGan1 = chart1.sixLines.day.gan
  const dayGan2 = chart2.sixLines.day.gan
  const dmElement1 = STEM_ELEMENT[dayGan1]
  const dmElement2 = STEM_ELEMENT[dayGan2]

  const sections: string[] = []

  // ═══ 第一章：概述 ═══
  sections.push(`【第一章 合婚分析概述】\n\n`)
  sections.push(`一、分析背景与方法论\n\n`)
  sections.push(`本报告基于玄风门V4.3合婚系统Ultimate版，采用九维度量化分析方法，对双方命盘进行全面深入的合婚研判。`
    + `分析体系涵盖四柱匹配、十神匹配、纳音匹配、神煞匹配、夫妻宫匹配、子女宫匹配、大运同步分析、五行互补分析八大专业维度，`
    + `并结合未来十年婚姻运势预测，为双方提供全方位的婚姻参考。\n\n`)
  sections.push(`九维度加权体系如下：四柱匹配（权重15%）、十神匹配（权重15%）、纳音匹配（权重10%）、神煞匹配（权重10%）、`
    + `夫妻宫匹配（权重15%）、子女宫匹配（权重5%）、大运同步（权重15%）、五行互补（权重15%）。`
    + `各维度独立评分后加权汇总，得出综合评分与命理等级。\n\n`)
  sections.push(`二、综合评定结果\n\n`)
  sections.push(`甲方日主「${dayGan1}」属${dmElement1}，乙方日主「${dayGan2}」属${dmElement2}。`
    + `经九维度综合评估，合婚总评${overallScore}分，命理等级「${overallLevel}」。`
    + `本等级基于传统八字合婚理论，结合现代统计学方法综合评定。\n\n`)
  sections.push(`${result.summary}\n\n`)

  // ═══ 第二章：甲方命盘 ═══
  sections.push(`【第二章 甲方命盘分析】\n\n`)
  sections.push(`一、四柱排盘\n\n`)
  sections.push(`年柱：${chart1.sixLines.year.gan}${chart1.sixLines.year.zhi}（${chart1.sixLines.year.naYin}）\n`)
  sections.push(`月柱：${chart1.sixLines.month.gan}${chart1.sixLines.month.zhi}（${chart1.sixLines.month.naYin}）\n`)
  sections.push(`日柱：${chart1.sixLines.day.gan}${chart1.sixLines.day.zhi}（${chart1.sixLines.day.naYin}）\n`)
  sections.push(`时柱：${chart1.sixLines.hour.gan}${chart1.sixLines.hour.zhi}（${chart1.sixLines.hour.naYin}）\n\n`)

  sections.push(`二、日主分析\n\n`)
  sections.push(`甲方日主${dayGan1}${dmElement1}，`
    + `日主旺衰为「${chart1.dayMaster.wangShuai}」，力量评分为${chart1.dayMaster.strengthScore}分。`
    + `日主${chart1.dayMaster.strengthScore >= 60 ? '偏旺' : chart1.dayMaster.strengthScore >= 40 ? '中和' : '偏弱'}，`
    + `在命局中${chart1.dayMaster.strengthScore >= 60 ? '有较强的话语权与行动力' : chart1.dayMaster.strengthScore >= 40 ? '表现较为平衡稳定' : '需要借助外力来增强自身实力'}。\n\n`)

  sections.push(`三、五行分布\n\n`)
  sections.push(`甲方命盘五行分布：木${chart1.fiveElementCount['木']}、火${chart1.fiveElementCount['火']}、`
    + `土${chart1.fiveElementCount['土']}、金${chart1.fiveElementCount['金']}、水${chart1.fiveElementCount['水']}。`
    + `喜用神为「${chart1.xiYongShen.bestElement}」，忌神为「${(chart1.xiYongShen.avoidedElements || []).join('、') || '无'}」。\n\n`)

  const lack1 = findLacking(chart1.fiveElementCount)
  if (lack1.length > 0) {
    sections.push(`甲方命盘缺少${lack1.join('、')}五行，在性格与运势上可能表现为`
      + `${lack1.includes('木') ? '缺乏变通与创造力、' : ''}`
      + `${lack1.includes('火') ? '热情不足、表达力偏弱、' : ''}`
      + `${lack1.includes('土') ? '稳定性不够、根基不牢、' : ''}`
      + `${lack1.includes('金') ? '决断力不足、执行力偏弱、' : ''}`
      + `${lack1.includes('水') ? '智慧积累不够、灵活性不足、' : ''}`
      + `需要在生活中适当补充。\n\n`)
  }

  // ═══ 第三章：乙方命盘 ═══
  sections.push(`【第三章 乙方命盘分析】\n\n`)
  sections.push(`一、四柱排盘\n\n`)
  sections.push(`年柱：${chart2.sixLines.year.gan}${chart2.sixLines.year.zhi}（${chart2.sixLines.year.naYin}）\n`)
  sections.push(`月柱：${chart2.sixLines.month.gan}${chart2.sixLines.month.zhi}（${chart2.sixLines.month.naYin}）\n`)
  sections.push(`日柱：${chart2.sixLines.day.gan}${chart2.sixLines.day.zhi}（${chart2.sixLines.day.naYin}）\n`)
  sections.push(`时柱：${chart2.sixLines.hour.gan}${chart2.sixLines.hour.zhi}（${chart2.sixLines.hour.naYin}）\n\n`)

  sections.push(`二、日主分析\n\n`)
  sections.push(`乙方日主${dayGan2}${dmElement2}，`
    + `日主旺衰为「${chart2.dayMaster.wangShuai}」，力量评分为${chart2.dayMaster.strengthScore}分。`
    + `日主${chart2.dayMaster.strengthScore >= 60 ? '偏旺' : chart2.dayMaster.strengthScore >= 40 ? '中和' : '偏弱'}，`
    + `在命局中${chart2.dayMaster.strengthScore >= 60 ? '有较强的话语权与行动力' : chart2.dayMaster.strengthScore >= 40 ? '表现较为平衡稳定' : '需要借助外力来增强自身实力'}。\n\n`)

  sections.push(`三、五行分布\n\n`)
  sections.push(`乙方命盘五行分布：木${chart2.fiveElementCount['木']}、火${chart2.fiveElementCount['火']}、`
    + `土${chart2.fiveElementCount['土']}、金${chart2.fiveElementCount['金']}、水${chart2.fiveElementCount['水']}。`
    + `喜用神为「${chart2.xiYongShen.bestElement}」，忌神为「${(chart2.xiYongShen.avoidedElements || []).join('、') || '无'}」。\n\n`)

  const lack2 = findLacking(chart2.fiveElementCount)
  if (lack2.length > 0) {
    sections.push(`乙方命盘缺少${lack2.join('、')}五行，在性格与运势上可能表现为`
      + `${lack2.includes('木') ? '缺乏变通与创造力、' : ''}`
      + `${lack2.includes('火') ? '热情不足、表达力偏弱、' : ''}`
      + `${lack2.includes('土') ? '稳定性不够、根基不牢、' : ''}`
      + `${lack2.includes('金') ? '决断力不足、执行力偏弱、' : ''}`
      + `${lack2.includes('水') ? '智慧积累不够、灵活性不足、' : ''}`
      + `需要在生活中适当补充。\n\n`)
  }

  // ═══ 第四章：匹配分析 ═══
  sections.push(`【第四章 八维匹配深度分析】\n\n`)

  const dimDetailNames: Record<string, string> = {
    fourPillar: '四柱干支匹配分析',
    tenGod: '十神配置匹配分析',
    nayin: '纳音五行匹配分析',
    shensha: '神煞互见匹配分析',
    spousePalace: '夫妻宫匹配分析',
    childPalace: '子女宫匹配分析',
    daYunSync: '大运同步匹配分析',
    fiveElement: '五行互补匹配分析',
  }

  const dimWeights: Record<string, number> = {
    fourPillar: 0.15, tenGod: 0.15, nayin: 0.10, shensha: 0.10,
    spousePalace: 0.15, childPalace: 0.05, daYunSync: 0.15, fiveElement: 0.15,
  }

  let chapterNum = 1
  for (const [key, dim] of Object.entries(dimensions)) {
    sections.push(`四、${chapterNum} ${dimDetailNames[key]}\n\n`)
    sections.push(`评分：${dim.score}/100（${dim.level}）| 权重：${Math.round(dimWeights[key] * 100)}%\n\n`)
    sections.push(`分析详情：\n${dim.description}\n\n`)

    // 扩展分析
    if (key === 'fourPillar') {
      const gan1 = getAllGan(chart1.sixLines)
      const gan2 = getAllGan(chart2.sixLines)
      const zhi1 = getAllZhi(chart1.sixLines)
      const zhi2 = getAllZhi(chart2.sixLines)
      sections.push(`四柱对照表：\n`)
      sections.push(`        甲方          乙方          关系\n`)
      const pillarLabels = ['年柱', '月柱', '日柱', '时柱']
      for (let i = 0; i < 4; i++) {
        const ganHe = checkTianGanHe(gan1[i], gan2[i])
        const zhiHe = checkDiZhiHe(zhi1[i], zhi2[i])
        const zhiChong = isDiZhiChong(zhi1[i], zhi2[i])
        const zhiHai = isDiZhiHai(zhi1[i], zhi2[i])
        let relation = '无特殊关系'
        if (ganHe) relation = `天干合化${ganHe}`
        if (zhiHe) relation = `地支合化${zhiHe}`
        if (zhiChong) relation = '地支六冲'
        if (zhiHai) relation = '地支六害'
        if (ganHe && zhiHe) relation = '天地双合'
        sections.push(`${pillarLabels[i]}  ${gan1[i]}${zhi1[i]}        ${gan2[i]}${zhi2[i]}        ${relation}\n`)
      }
      sections.push(`\n四柱匹配是合婚分析的基础维度。天干代表外在表现与社交关系，地支代表内在性格与家庭关系。`
        + `天干五合表示双方在外在层面能够和谐相处，地支六合表示双方在家庭生活中能够互相扶持。`
        + `反之，天干相克或地支六冲则表示双方在相应层面容易产生分歧与冲突。\n\n`)
      sections.push(`从传统命理角度看，四柱中合多冲少的组合最为理想。`
        + `若日柱（夫妻宫所在）能够相合，则是上等婚配的标志。`
        + `若四柱中冲克较多，则需要通过后天的沟通与理解来弥补先天命理的不足。\n\n`)
    }

    if (key === 'tenGod') {
      const maleChart = input.gender1 === 'male' ? chart1 : input.gender2 === 'male' ? chart2 : chart1
      const femaleChart = input.gender1 === 'female' ? chart1 : input.gender2 === 'female' ? chart2 : chart2
      const maleSS = getShenShiByCategory(maleChart)
      const femaleSS = getShenShiByCategory(femaleChart)

      sections.push(`男方十神分布：比劫${maleSS['比劫'].length} 食伤${maleSS['食伤'].length} `
        + `财星${maleSS['财星'].length} 官杀${maleSS['官杀'].length} 印星${maleSS['印星'].length}\n`)
      sections.push(`女方十神分布：比劫${femaleSS['比劫'].length} 食伤${femaleSS['食伤'].length} `
        + `财星${femaleSS['财星'].length} 官杀${femaleSS['官杀'].length} 印星${femaleSS['印星'].length}\n\n`)

      sections.push(`十神匹配是合婚分析中最具专业深度的维度。在传统命理中，男以财星为妻星，女以官杀为夫星。`
        + `男方的财星与女方的官杀若能相互呼应，则代表夫妻星配置合理，婚姻关系稳固。`
        + `若男方食伤过旺，则可能克制官星，不利于女方婚姻运势。`
        + `若女方比劫过旺，则可能争夺财星，不利于男方财运。\n\n`)
      sections.push(`此外，双方印星的配置也十分重要。印星代表关爱、包容与理解，`
        + `双方印星均旺的人往往更重视家庭与感情，在婚姻中更容易相互理解与支持。\n\n`)
    }

    if (key === 'spousePalace') {
      sections.push(`夫妻宫即日柱地支，是八字中代表婚姻状况的核心宫位。`
        + `甲方夫妻宫为「${chart1.sixLines.day.zhi}」，乙方夫妻宫为「${chart2.sixLines.day.zhi}」。\n\n`)
      sections.push(`夫妻宫的合冲关系直接影响婚姻质量。六合代表感情和谐、心心相印；`
        + `六冲代表性格差异大、易生矛盾；六害代表暗中相克、不易察觉的冲突。`
        + `此外，夫妻宫五行的生克关系也十分重要，相生则互相扶持，相克则互相制约。\n\n`)
      sections.push(`在选择婚期、布置婚房时，可参考双方夫妻宫的五行属性，`
        + `选择与之相生的方位与色彩，以增强夫妻宫的正能量。\n\n`)
    }

    if (key === 'fiveElement') {
      const combined: Record<FiveElement, number> = {
        '木': chart1.fiveElementCount['木'] + chart2.fiveElementCount['木'],
        '火': chart1.fiveElementCount['火'] + chart2.fiveElementCount['火'],
        '土': chart1.fiveElementCount['土'] + chart2.fiveElementCount['土'],
        '金': chart1.fiveElementCount['金'] + chart2.fiveElementCount['金'],
        '水': chart1.fiveElementCount['水'] + chart2.fiveElementCount['水'],
      }
      const total = FIVE_ELEMENTS.reduce((s, e) => s + combined[e], 0)
      sections.push(`双方五行合并分布：\n`)
      for (const e of FIVE_ELEMENTS) {
        const pct = Math.round(combined[e] / total * 100)
        const bar = '■'.repeat(Math.round(pct / 5)) + '□'.repeat(20 - Math.round(pct / 5))
        sections.push(`${e}：${combined[e]}个 (${pct}%) ${bar}\n`)
      }
      sections.push(`\n五行互补是合婚分析中最具实用价值的维度。当一方命盘缺少某五行时，`
        + `若另一方该五行充沛，则可以在婚姻中形成互补，使双方的生活更加圆满。`
        + `反之，若双方均缺同一五行，则在该方面可能同时面临挑战，需要特别注意。\n\n`)
    }

    chapterNum++
  }

  // ═══ 第五章：婚姻运势 ═══
  sections.push(`【第五章 未来十年婚姻运势预测】\n\n`)
  sections.push(`基于双方命盘与流年干支的关系，对未来十年的婚姻运势进行逐年预测：\n\n`)

  for (const fortune of marriageFortune) {
    const bar = '★'.repeat(Math.round(fortune.score / 10)) + '☆'.repeat(10 - Math.round(fortune.score / 10))
    sections.push(`${fortune.year}年：${fortune.score}分 ${bar}\n`)
    sections.push(`${fortune.description}\n\n`)
  }

  sections.push(`注：流年预测基于传统命理推算，实际运势受多种因素影响，仅供参考。\n\n`)

  // ═══ 第六章：优劣势 ═══
  sections.push(`【第六章 优势与劣势分析】\n\n`)
  sections.push(`一、合婚优势\n\n`)
  for (let i = 0; i < strengths.length; i++) {
    sections.push(`${i + 1}. ${strengths[i]}\n`)
  }
  sections.push(`\n`)

  sections.push(`二、潜在劣势\n\n`)
  for (let i = 0; i < weaknesses.length; i++) {
    sections.push(`${i + 1}. ${weaknesses[i]}\n`)
  }
  sections.push(`\n`)

  // ═══ 第七章：建议 ═══
  sections.push(`【第七章 综合建议】\n\n`)
  for (let i = 0; i < advice.length; i++) {
    sections.push(`${i + 1}. ${advice[i]}\n\n`)
  }

  // ═══ 第八章：总结 ═══
  sections.push(`【第八章 总结】\n\n`)
  sections.push(`${dayGan1}日主与${dayGan2}日主的合婚分析已完成。综合评分${overallScore}分，命理等级「${overallLevel}」。\n\n`)

  if (overallScore >= 75) {
    sections.push(`双方命理配合上佳，在四柱、十神、纳音、神煞、夫妻宫、大运、五行等多个维度均表现出良好的匹配度。`
      + `这样的命理组合在传统命理中被视为良缘，婚姻基础稳固，双方在性格、价值观、人生方向等方面有着较高的契合度。\n\n`)
    sections.push(`建议双方珍惜这份天赐良缘，在日常生活中继续保持良好的沟通与互动。`
      + `即便命理配合较好，婚姻仍需双方共同经营与维护。定期进行感情检视，及时化解小矛盾，`
      + `是保持婚姻长久的秘诀。同时，可参考流年预测，提前做好应对准备。\n\n`)
  } else if (overallScore >= 55) {
    sections.push(`双方命理配合尚可，在某些维度表现良好，但在另一些维度存在不足。`
      + `这种组合在现实中最为常见，说明双方的命理配合属于"中等偏上"水平。`
      + `婚姻的成功与否，将更多地取决于双方的后天努力与经营。\n\n`)
    sections.push(`建议双方正视命理分析中指出的不足之处，有针对性地进行改善。`
      + `例如，若五行互补不足，可通过风水调理、饮食调整、衣着颜色等方式进行补救；`
      + `若夫妻宫存在冲克，可注意卧室风水布局，选择吉利的方位与朝向。`
      + `最重要的是保持真诚的沟通与相互的理解。\n\n`)
  } else {
    sections.push(`双方命理配合存在一定困难，多个维度评分偏低。但这并不意味着婚姻注定不幸福。`
      + `命理分析仅为参考，真正的婚姻质量取决于双方的理解、包容与共同成长。\n\n`)
    sections.push(`建议双方在决定步入婚姻之前，充分了解彼此的性格特点与价值观差异。`
      + `婚后应特别注意沟通方式，避免因小事积累成大矛盾。`
      + `可借助专业的婚姻咨询或命理调理服务，针对性地改善婚姻运势。`
      + `记住：命由天定，运在人为。只要双方真心相爱、携手努力，任何困难都可以克服。\n\n`)
  }

  sections.push(`本报告由玄风门V4.3合婚系统Ultimate版生成，仅供参考，不构成任何决定性建议。`
    + `婚姻幸福需要双方共同经营，愿有情人终成眷属。\n`)

  return sections.join('')
}

// ═══════════════════════════════════════
// 主函数
// ═══════════════════════════════════════

/**
 * 合婚系统 Ultimate — 九维度量化合婚分析
 * @param input 合婚输入（双方命盘与性别）
 * @returns 合婚分析结果（含九维度评分、婚运预测、万字报告）
 */
export function analyzeCompatibility(input: CompatibilityInput): CompatibilityResult {
  const { chart1, chart2, gender1, gender2 } = input

  // 九维度评分
  const fourPillar = scoreFourPillar(chart1, chart2)
  const tenGod = scoreTenGod(chart1, chart2, gender1, gender2)
  const nayin = scoreNayin(chart1, chart2)
  const shensha = scoreShenSha(chart1, chart2)
  const spousePalace = scoreSpousePalace(chart1, chart2)
  const childPalace = scoreChildPalace(chart1, chart2)
  const daYunSync = scoreDaYunSync(chart1, chart2)
  const fiveElement = scoreFiveElement(chart1, chart2)

  const dimensions = {
    fourPillar, tenGod, nayin, shensha, spousePalace, childPalace, daYunSync, fiveElement,
  }

  // 加权平均
  const weights: Record<keyof typeof dimensions, number> = {
    fourPillar: 0.15, tenGod: 0.15, nayin: 0.10, shensha: 0.10,
    spousePalace: 0.15, childPalace: 0.05, daYunSync: 0.15, fiveElement: 0.15,
  }

  let overallScore = 0
  for (const [key, weight] of Object.entries(weights)) {
    overallScore += dimensions[key as keyof typeof dimensions].score * weight
  }
  overallScore = Math.round(overallScore)
  overallScore = Math.max(0, Math.min(100, overallScore))

  const overallLevel = overallScoreToLevel(overallScore)

  // 婚运预测
  const marriageFortune = predictMarriageFortune(chart1, chart2, dimensions)

  // 优劣势
  const strengths = generateStrengths(dimensions)
  const weaknesses = generateWeaknesses(dimensions)

  // 建议
  const advice = generateAdvice(dimensions, chart1, chart2)

  // 总述
  const summary = generateSummary({ overallScore, overallLevel, dimensions, marriageFortune, strengths, weaknesses, advice, summary: '', fullReport: '' }, chart1, chart2)

  // 完整报告
  const fullReport = generateFullReport(input, { overallScore, overallLevel, dimensions, marriageFortune, strengths, weaknesses, advice, summary, fullReport: '' })

  return {
    overallScore,
    overallLevel,
    dimensions,
    marriageFortune,
    strengths,
    weaknesses,
    advice,
    summary,
    fullReport,
  }
}