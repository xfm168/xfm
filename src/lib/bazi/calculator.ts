import type {
  HeavenlyStem,
  EarthlyBranch,
  FiveElement,
  YinYang,
  ShenShi,
  BirthInfo,
  GanZhi,
  SixLines,
  FiveElementCount,
  CangGan,
  DayMasterAnalysis,
  XiYongShen,
  BaZiAnalysis,
  BaZiChart,
  ShiErChangSheng,
  WuXingWangShuai,
  SolarTermName,
} from './types'
import { DEFAULT_BAZI_ANALYSIS } from '../../constants/defaultAnalysis'

const HEAVENLY_STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EARTHLY_BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
}

const STEM_YINYANG: Record<HeavenlyStem, YinYang> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴',
}

const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
}

const BRANCH_YINYANG: Record<EarthlyBranch, YinYang> = {
  子: '阳', 寅: '阳', 辰: '阳', 午: '阳', 申: '阳', 戌: '阳',
  丑: '阴', 卯: '阴', 巳: '阴', 未: '阴', 酉: '阴', 亥: '阴',
}

const CANG_GAN: Record<EarthlyBranch, CangGan> = {
  子: { ben: '癸', zhong: null, yao: null },
  丑: { ben: '己', zhong: '辛', yao: '癸' },
  寅: { ben: '甲', zhong: '丙', yao: '戊' },
  卯: { ben: '乙', zhong: null, yao: null },
  辰: { ben: '戊', zhong: '乙', yao: '癸' },
  巳: { ben: '丙', zhong: '庚', yao: '戊' },
  午: { ben: '丁', zhong: '己', yao: null },
  未: { ben: '己', zhong: '丁', yao: '乙' },
  申: { ben: '庚', zhong: '壬', yao: '戊' },
  酉: { ben: '辛', zhong: null, yao: null },
  戌: { ben: '戊', zhong: '辛', yao: '丁' },
  亥: { ben: '壬', zhong: '甲', yao: null },
}

// 藏干权重：本气0.6，中气0.3，余气0.1
const CANG_GAN_WEIGHT = { ben: 0.6, zhong: 0.3, yao: 0.1 }

const FIVE_ELEMENT_GENERATE: Record<FiveElement, FiveElement> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}

const FIVE_ELEMENT_OVERCOME: Record<FiveElement, FiveElement> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
}

// 纳音六十甲子
const NA_YIN_TABLE: string[] = [
  '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木',
  '路旁土', '路旁土', '剑锋金', '剑锋金', '山头火', '山头火',
  '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金',
  '杨柳木', '杨柳木', '泉中水', '泉中水', '屋上土', '屋上土',
  '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
  '沙中金', '沙中金', '山下火', '山下火', '平地木', '平地木',
  '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火',
  '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金',
  '桑柘木', '桑柘木', '大溪水', '大溪水', '沙中土', '沙中土',
  '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水',
]

// 十二长生
// 阳干顺行，阴干逆行
const CHANG_SHENG_YANG: Record<FiveElement, EarthlyBranch> = {
  木: '亥', 火: '寅', 金: '巳', 水: '申', 土: '申',
}

const CHANG_SHENG_YIN: Record<FiveElement, EarthlyBranch> = {
  木: '午', 火: '酉', 金: '子', 水: '卯', 土: '卯',
}

const CHANG_SHENG_NAMES: ShiErChangSheng[] = [
  '长生', '沐浴', '冠带', '临官', '帝旺', '衰',
  '病', '死', '墓', '绝', '胎', '养',
]

// 五行旺相休囚死（按月令）
const WANG_SHUAI_TABLE: Record<FiveElement, Record<FiveElement, WuXingWangShuai>> = {
  木: { 木: '旺', 火: '相', 水: '休', 金: '囚', 土: '死' },
  火: { 火: '旺', 土: '相', 木: '休', 水: '囚', 金: '死' },
  土: { 土: '旺', 金: '相', 火: '休', 木: '囚', 水: '死' },
  金: { 金: '旺', 水: '相', 土: '休', 火: '囚', 木: '死' },
  水: { 水: '旺', 木: '相', 金: '休', 土: '囚', 火: '死' },
}

// 二十四节气近似日期（用于年柱/月柱分界）
const SOLAR_TERMS: { name: SolarTermName; month: number; day: number }[] = [
  { name: '小寒', month: 1, day: 6 },
  { name: '大寒', month: 1, day: 20 },
  { name: '立春', month: 2, day: 4 },
  { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 6 },
  { name: '春分', month: 3, day: 21 },
  { name: '清明', month: 4, day: 5 },
  { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 6 },
  { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 6 },
  { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 },
  { name: '大暑', month: 7, day: 23 },
  { name: '立秋', month: 8, day: 8 },
  { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 8 },
  { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 },
  { name: '霜降', month: 10, day: 24 },
  { name: '立冬', month: 11, day: 7 },
  { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 },
  { name: '冬至', month: 12, day: 22 },
]

const MONTH_BRANCHES: EarthlyBranch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']

// 儒略日数 (JDN)
function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

const BASE_JDN_2000 = 2451545
const BASE_INDEX_2000 = 54 // 戊午日

function getGanZhiFromIndex(index: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const normalized = ((index % 60) + 60) % 60
  return {
    gan: HEAVENLY_STEMS[normalized % 10],
    zhi: EARTHLY_BRANCHES[normalized % 12],
  }
}

function getIndexFromGanZhi(gan: HeavenlyStem, zhi: EarthlyBranch): number {
  const gIdx = HEAVENLY_STEMS.indexOf(gan)
  const zIdx = EARTHLY_BRANCHES.indexOf(zhi)
  // 找最小的 n >= 0 满足 n%10==gIdx 且 n%12==zIdx
  for (let n = 0; n < 60; n++) {
    if (n % 10 === gIdx && n % 12 === zIdx) return n
  }
  return 0
}

function getNaYin(gan: HeavenlyStem, zhi: EarthlyBranch): string {
  const idx = getIndexFromGanZhi(gan, zhi)
  return NA_YIN_TABLE[idx] || '未知'
}

function getChangSheng(dayGan: HeavenlyStem, zhi: EarthlyBranch): ShiErChangSheng {
  const element = STEM_ELEMENT[dayGan]
  const yinYang = STEM_YINYANG[dayGan]
  const changShengZhi = yinYang === '阳' ? CHANG_SHENG_YANG[element] : CHANG_SHENG_YIN[element]
  const startIdx = EARTHLY_BRANCHES.indexOf(changShengZhi)
  const zhiIdx = EARTHLY_BRANCHES.indexOf(zhi)

  let offset: number
  if (yinYang === '阳') {
    offset = (zhiIdx - startIdx + 12) % 12
  } else {
    offset = (startIdx - zhiIdx + 12) % 12
  }
  return CHANG_SHENG_NAMES[offset]
}

// 判断是否过了某节气
function isAfterSolarTerm(date: Date, termName: SolarTermName): boolean {
  const term = SOLAR_TERMS.find(t => t.name === termName)
  if (!term) return false
  const month = date.getMonth() + 1
  const day = date.getDate()
  if (month > term.month) return true
  if (month < term.month) return false
  return day >= term.day
}

// 获取年柱（立春分界）
function getYearGanZhi(date: Date): GanZhi {
  let year = date.getFullYear()
  if (!isAfterSolarTerm(date, '立春')) {
    year -= 1
  }
  const stemIndex = ((year - 4) % 10 + 10) % 10
  const branchIndex = ((year - 4) % 12 + 12) % 12
  const gan = HEAVENLY_STEMS[stemIndex]
  const zhi = EARTHLY_BRANCHES[branchIndex]
  return {
    gan,
    zhi,
    element: STEM_ELEMENT[gan],
    yinYang: STEM_YINYANG[gan],
    naYin: getNaYin(gan, zhi),
  }
}

// 获取月柱（节气分界）
function getMonthGanZhi(date: Date, yearGan: HeavenlyStem): GanZhi {
  const m = date.getMonth() + 1
  const d = date.getDate()

  // 节令按月份顺序排列（从1月到12月的节令）
  // 对应关系：节令 → 月支（从寅月开始算第几个月）
  // 小寒(1月6日) → 丑月
  // 立春(2月4日) → 寅月（正月）
  // 惊蛰(3月6日) → 卯月
  // 清明(4月5日) → 辰月
  // 立夏(5月6日) → 巳月
  // 芒种(6月6日) → 午月
  // 小暑(7月7日) → 未月
  // 立秋(8月8日) → 申月
  // 白露(9月8日) → 酉月
  // 寒露(10月8日) → 戌月
  // 立冬(11月7日) → 亥月
  // 大雪(12月7日) → 子月
  const jieList: { term: SolarTermName; monthIdx: number }[] = [
    { term: '小寒', monthIdx: 11 },  // 丑月
    { term: '立春', monthIdx: 0 },   // 寅月
    { term: '惊蛰', monthIdx: 1 },   // 卯月
    { term: '清明', monthIdx: 2 },   // 辰月
    { term: '立夏', monthIdx: 3 },   // 巳月
    { term: '芒种', monthIdx: 4 },   // 午月
    { term: '小暑', monthIdx: 5 },   // 未月
    { term: '立秋', monthIdx: 6 },   // 申月
    { term: '白露', monthIdx: 7 },   // 酉月
    { term: '寒露', monthIdx: 8 },   // 戌月
    { term: '立冬', monthIdx: 9 },   // 亥月
    { term: '大雪', monthIdx: 10 },  // 子月
  ]

  // 默认：1月1日到小寒前是子月（大雪后）
  let monthIdx = 10 // 子月

  for (const jie of jieList) {
    const term = SOLAR_TERMS.find(t => t.name === jie.term)
    if (!term) continue
    if (m > term.month || (m === term.month && d >= term.day)) {
      monthIdx = jie.monthIdx
    }
  }

  const zhi = MONTH_BRANCHES[monthIdx % 12]

  // 五虎遁：月干起法
  const yearStemIdx = HEAVENLY_STEMS.indexOf(yearGan)
  const mod = yearStemIdx % 5
  let monthStemBase = 0
  if (mod === 0) {
    monthStemBase = 2 // 甲己起丙寅
  } else if (mod === 1) {
    monthStemBase = 4 // 乙庚起戊寅
  } else if (mod === 2) {
    monthStemBase = 6 // 丙辛起庚寅
  } else if (mod === 3) {
    monthStemBase = 8 // 丁壬起壬寅
  } else {
    monthStemBase = 0 // 戊癸起甲寅
  }

  const gan = HEAVENLY_STEMS[(monthStemBase + monthIdx) % 10]

  return {
    gan,
    zhi,
    element: STEM_ELEMENT[gan],
    yinYang: STEM_YINYANG[gan],
    naYin: getNaYin(gan, zhi),
  }
}

// 获取日柱（JDN 精确算法）
function getDayGanZhi(date: Date): GanZhi {
  const jdn = toJDN(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const diff = jdn - BASE_JDN_2000
  const index = ((BASE_INDEX_2000 + diff) % 60 + 60) % 60
  const { gan, zhi } = getGanZhiFromIndex(index)
  return {
    gan,
    zhi,
    element: STEM_ELEMENT[gan],
    yinYang: STEM_YINYANG[gan],
    naYin: getNaYin(gan, zhi),
  }
}

// 获取时柱（五鼠遁）
function getHourGanZhi(date: Date, dayGan: HeavenlyStem): GanZhi {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const totalMinutes = hours * 60 + minutes

  let hourIndex = 0
  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) {
    hourIndex = 0
  } else if (totalMinutes < 3 * 60) {
    hourIndex = 1
  } else if (totalMinutes < 5 * 60) {
    hourIndex = 2
  } else if (totalMinutes < 7 * 60) {
    hourIndex = 3
  } else if (totalMinutes < 9 * 60) {
    hourIndex = 4
  } else if (totalMinutes < 11 * 60) {
    hourIndex = 5
  } else if (totalMinutes < 13 * 60) {
    hourIndex = 6
  } else if (totalMinutes < 15 * 60) {
    hourIndex = 7
  } else if (totalMinutes < 17 * 60) {
    hourIndex = 8
  } else if (totalMinutes < 19 * 60) {
    hourIndex = 9
  } else if (totalMinutes < 21 * 60) {
    hourIndex = 10
  } else {
    hourIndex = 11
  }

  const zhi = EARTHLY_BRANCHES[hourIndex]

  // 五鼠遁：时干起法
  // 甲己还加甲 → 甲子(0)
  // 乙庚丙作初 → 丙子(2)
  // 丙辛从戊起 → 戊子(4)
  // 丁壬庚子居 → 庚子(6)
  // 戊癸何方发 → 壬子(8)
  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayGan)
  let hourStemBase = 0
  const mod = dayStemIdx % 5
  if (mod === 0) {
    hourStemBase = 0 // 甲己起甲子
  } else if (mod === 1) {
    hourStemBase = 2 // 乙庚起丙子
  } else if (mod === 2) {
    hourStemBase = 4 // 丙辛起戊子
  } else if (mod === 3) {
    hourStemBase = 6 // 丁壬起庚子
  } else {
    hourStemBase = 8 // 戊癸起壬子
  }

  const gan = HEAVENLY_STEMS[(hourStemBase + hourIndex) % 10]

  return {
    gan,
    zhi,
    element: STEM_ELEMENT[gan],
    yinYang: STEM_YINYANG[gan],
    naYin: getNaYin(gan, zhi),
  }
}

// 十神计算
function calculateShenShi(dayGan: HeavenlyStem, targetGan: HeavenlyStem): ShenShi {
  const dayElement = STEM_ELEMENT[dayGan]
  const dayYY = STEM_YINYANG[dayGan]
  const targetElement = STEM_ELEMENT[targetGan]
  const targetYY = STEM_YINYANG[targetGan]
  const sameYY = dayYY === targetYY

  if (targetElement === dayElement) {
    return sameYY ? '比肩' : '劫财'
  } else if (FIVE_ELEMENT_GENERATE[dayElement] === targetElement) {
    return sameYY ? '食神' : '伤官'
  } else if (FIVE_ELEMENT_OVERCOME[dayElement] === targetElement) {
    return sameYY ? '偏财' : '正财'
  } else if (FIVE_ELEMENT_OVERCOME[targetElement] === dayElement) {
    return sameYY ? '偏官' : '正官'
  } else if (FIVE_ELEMENT_GENERATE[targetElement] === dayElement) {
    return sameYY ? '偏印' : '正印'
  }
  return '比肩'
}

// 五行统计（天干1.0 + 地支本气0.6 + 藏干加权）
function calculateFiveElementCount(sixLines: SixLines): FiveElementCount {
  const count: FiveElementCount = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }

  const pillars: GanZhi[] = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]

  for (const gz of pillars) {
    // 天干 1.0
    count[STEM_ELEMENT[gz.gan]] += 1.0

    // 地支藏干加权
    const cang = CANG_GAN[gz.zhi]
    count[STEM_ELEMENT[cang.ben]] += CANG_GAN_WEIGHT.ben
    if (cang.zhong) count[STEM_ELEMENT[cang.zhong]] += CANG_GAN_WEIGHT.zhong
    if (cang.yao) count[STEM_ELEMENT[cang.yao]] += CANG_GAN_WEIGHT.yao
  }

  return count
}

// 日主旺衰（按月令）
function getWangShuai(dayElement: FiveElement, monthZhi: EarthlyBranch): WuXingWangShuai {
  const monthElement = BRANCH_ELEMENT[monthZhi]
  return WANG_SHUAI_TABLE[monthElement][dayElement]
}

// 日主力量评分（0-100）
function calculateStrengthScore(
  fiveElementCount: FiveElementCount,
  dayElement: FiveElement,
  wangShuai: WuXingWangShuai,
): number {
  const dayCount = fiveElementCount[dayElement]
  const total = Object.values(fiveElementCount).reduce((a, b) => a + b, 0)
  const ratio = dayCount / total

  let baseScore = ratio * 100

  // 月令旺衰调整
  const adjustment: Record<WuXingWangShuai, number> = {
    旺: 15,
    相: 8,
    休: 0,
    囚: -8,
    死: -15,
  }
  baseScore += adjustment[wangShuai]

  return Math.max(0, Math.min(100, Math.round(baseScore * 1.5)))
}

// 日主分析
function calculateDayMaster(
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
  fiveElementCount: FiveElementCount,
): DayMasterAnalysis {
  const dayGanElement = STEM_ELEMENT[dayGan]
  const dayGanYinYang = STEM_YINYANG[dayGan]
  const relatedShens = {} as Record<HeavenlyStem, ShenShi>

  for (const stem of HEAVENLY_STEMS) {
    relatedShens[stem] = calculateShenShi(dayGan, stem)
  }

  const wangShuai = getWangShuai(dayGanElement, monthZhi)
  const strengthScore = calculateStrengthScore(fiveElementCount, dayGanElement, wangShuai)

  return {
    dayGan,
    dayGanElement,
    dayGanYinYang,
    relatedShens,
    wangShuai,
    strengthScore,
  }
}

// 喜用神判断
function calculateXiYongShen(
  _fiveElementCount: FiveElementCount,
  dayMaster: DayMasterAnalysis,
): XiYongShen {
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  const dayElement = dayMaster.dayGanElement
  const strength = dayMaster.strengthScore

  const generate = FIVE_ELEMENT_GENERATE[dayElement]
  const overcome = FIVE_ELEMENT_OVERCOME[dayElement]
  const generateMe = elements.find(e => FIVE_ELEMENT_GENERATE[e] === dayElement)!
  const overcomeMe = elements.find(e => FIVE_ELEMENT_OVERCOME[e] === dayElement)!

  let bestElement: FiveElement
  let avoided: FiveElement[] = []

  if (strength >= 65) {
    // 身强：喜克泄耗
    bestElement = overcome
    avoided = [dayElement, generateMe]
  } else if (strength <= 35) {
    // 身弱：喜生扶
    bestElement = generateMe
    avoided = [overcomeMe, overcome]
  } else {
    // 中和：喜泄秀
    bestElement = generate
    avoided = [overcomeMe]
  }

  const happiness = `${dayElement}日主，${dayMaster.wangShuai}于月令，${bestElement}为喜用神。`
  const usage = strength >= 65
    ? `命局身强，宜${bestElement}（克泄耗）以调和。日常可多接触${bestElement}属性的颜色、方位、行业。`
    : strength <= 35
    ? `命局身弱，宜${bestElement}（生扶）以助身。日常可多接触${bestElement}属性的颜色、方位、行业。`
    : `命局中和，宜${bestElement}泄秀生发。日常顺应自然，保持五行平衡即可。`

  return {
    bestElement,
    happiness,
    usage,
    avoidedElements: avoided,
  }
}

// 综合评分
function calculateOverallScore(
  fiveElementCount: FiveElementCount,
  dayMaster: DayMasterAnalysis,
): number {
  const values = Object.values(fiveElementCount)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const balance = 1 - (max - min) / (max + min + 1)

  // 越接近中和越好（50分最佳）
  const strengthDeviation = Math.abs(dayMaster.strengthScore - 50) / 50
  const strengthScore = 1 - strengthDeviation

  const total = Math.round(60 + balance * 20 + strengthScore * 20)
  return Math.min(100, Math.max(50, total))
}

// 为四柱补充十神和十二长生
function enrichSixLines(sixLines: SixLines, dayGan: HeavenlyStem): SixLines {
  const pillars: (keyof SixLines)[] = ['year', 'month', 'day', 'hour']
  const result = { ...sixLines }

  for (const pillar of pillars) {
    const gz = result[pillar]
    result[pillar] = {
      ...gz,
      shenShi: calculateShenShi(dayGan, gz.gan),
      changSheng: getChangSheng(dayGan, gz.zhi),
    }
  }

  return result
}

export function calculateBaZi(birthInfo: BirthInfo): BaZiChart {
  const [year, month, day] = birthInfo.birthDate.split('-').map(Number)
  const [hours, minutes] = birthInfo.birthTime.split(':').map(Number)

  const birthDate = new Date(year, month - 1, day, hours, minutes)

  const yearGanZhi = getYearGanZhi(birthDate)
  const monthGanZhi = getMonthGanZhi(birthDate, yearGanZhi.gan)
  const dayGanZhi = getDayGanZhi(birthDate)
  const hourGanZhi = getHourGanZhi(birthDate, dayGanZhi.gan)

  let sixLines: SixLines = {
    year: yearGanZhi,
    month: monthGanZhi,
    day: dayGanZhi,
    hour: hourGanZhi,
  }

  const fiveElementCount = calculateFiveElementCount(sixLines)
  const dayMaster = calculateDayMaster(dayGanZhi.gan, monthGanZhi.zhi, fiveElementCount)

  // 补充十神和十二长生
  sixLines = enrichSixLines(sixLines, dayGanZhi.gan)

  const xiYongShen = calculateXiYongShen(fiveElementCount, dayMaster)
  const analysis: BaZiAnalysis = { ...DEFAULT_BAZI_ANALYSIS }
  const overallScore = calculateOverallScore(fiveElementCount, dayMaster)

  return {
    birthInfo,
    sixLines,
    fiveElementCount,
    dayMaster,
    cangGan: CANG_GAN,
    xiYongShen,
    analysis,
    overallScore,
    version: '2.0',
    createdAt: Date.now(),
  }
}

export {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  STEM_ELEMENT,
  STEM_YINYANG,
  BRANCH_ELEMENT,
  BRANCH_YINYANG,
  CANG_GAN,
  CANG_GAN_WEIGHT,
  FIVE_ELEMENT_GENERATE,
  FIVE_ELEMENT_OVERCOME,
  NA_YIN_TABLE,
  CHANG_SHENG_NAMES,
  WANG_SHUAI_TABLE,
  SOLAR_TERMS,
  MONTH_BRANCHES,
  toJDN,
  getGanZhiFromIndex,
  getIndexFromGanZhi,
  getNaYin,
  getChangSheng,
  getYearGanZhi,
  getMonthGanZhi,
  getDayGanZhi,
  getHourGanZhi,
  calculateShenShi,
  calculateFiveElementCount,
  getWangShuai,
}
