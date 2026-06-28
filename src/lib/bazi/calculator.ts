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
} from './types'

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

const SHENSHI_MAP: Record<YinYang, Record<string, ShenShi>> = {
  阳: {
    sameYang: '比肩', sameYin: '劫财',
    genYang: '食神', genYin: '伤官',
    keYang: '偏财', keYin: '正财',
    beiKeYang: '偏官', beiKeYin: '正官',
    shengYang: '偏印', shengYin: '正印',
  },
  阴: {
    sameYin: '比肩', sameYang: '劫财',
    genYin: '食神', genYang: '伤官',
    keYin: '偏财', keYang: '正财',
    beiKeYin: '偏官', beiKeYang: '正官',
    shengYin: '偏印', shengYang: '正印',
  },
}

const FIVE_ELEMENT_GENERATE: Record<FiveElement, FiveElement> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}

const FIVE_ELEMENT_OVERCOME: Record<FiveElement, FiveElement> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
}

function daysBetween(date1: Date, date2: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const d1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const d2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
  return Math.floor((d2 - d1) / MS_PER_DAY)
}

function getGanZhiFromIndex(index: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const normalized = ((index % 60) + 60) % 60
  return {
    gan: HEAVENLY_STEMS[normalized % 10],
    zhi: EARTHLY_BRANCHES[normalized % 12],
  }
}

function getYearGanZhi(date: Date): GanZhi {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  
  let ganzhiYear = year
  if (month < 1 || (month === 1 && day < 4)) {
    ganzhiYear = year - 1
  }
  
  const stemIndex = ((ganzhiYear - 4) % 10 + 10) % 10
  const branchIndex = ((ganzhiYear - 4) % 12 + 12) % 12
  
  const gan = HEAVENLY_STEMS[stemIndex]
  const zhi = EARTHLY_BRANCHES[branchIndex]
  
  return { gan, zhi, element: STEM_ELEMENT[gan] }
}

const MONTH_BRANCHES: EarthlyBranch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']

function getMonthGanZhi(date: Date, yearGan: HeavenlyStem): GanZhi {
  const month = date.getMonth()
  const day = date.getDate()
  
  let monthIndex = month
  if (day < 6) {
    monthIndex = month - 1
  }
  
  if (monthIndex < 0) monthIndex = 11
  if (monthIndex > 11) monthIndex = 0
  
  const zhi = MONTH_BRANCHES[monthIndex]
  
  const yearStemIndex = HEAVENLY_STEMS.indexOf(yearGan)
  let monthStemBase = 0
  if (yearStemIndex % 5 === 0 || yearStemIndex % 5 === 4) {
    monthStemBase = 2
  } else if (yearStemIndex % 5 === 1 || yearStemIndex % 5 === 5) {
    monthStemBase = 4
  } else if (yearStemIndex % 5 === 2 || yearStemIndex % 5 === 6) {
    monthStemBase = 6
  } else if (yearStemIndex % 5 === 3 || yearStemIndex % 5 === 7) {
    monthStemBase = 8
  } else {
    monthStemBase = 0
  }
  
  const monthStemIndex = (monthStemBase + monthIndex) % 10
  const gan = HEAVENLY_STEMS[monthStemIndex]
  
  return { gan, zhi, element: STEM_ELEMENT[gan] }
}

function getDayGanZhi(date: Date): GanZhi {
  const BASE_DATE = new Date(2000, 0, 1)
  const BASE_INDEX = 54
  
  const diff = daysBetween(BASE_DATE, date)
  const index = BASE_INDEX + diff
  
  const { gan, zhi } = getGanZhiFromIndex(index)
  return { gan, zhi, element: STEM_ELEMENT[gan] }
}

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
  const dayStemIndex = HEAVENLY_STEMS.indexOf(dayGan)
  
  let hourStemBase = 0
  if (dayStemIndex % 5 === 0 || dayStemIndex % 5 === 4) {
    hourStemBase = 0
  } else if (dayStemIndex % 5 === 1 || dayStemIndex % 5 === 5) {
    hourStemBase = 2
  } else if (dayStemIndex % 5 === 2 || dayStemIndex % 5 === 6) {
    hourStemBase = 4
  } else if (dayStemIndex % 5 === 3 || dayStemIndex % 5 === 7) {
    hourStemBase = 6
  } else {
    hourStemBase = 8
  }
  
  const hourStemIndex = (hourStemBase + hourIndex) % 10
  const gan = HEAVENLY_STEMS[hourStemIndex]
  
  return { gan, zhi, element: STEM_ELEMENT[gan] }
}

function calculateFiveElementCount(sixLines: SixLines): FiveElementCount {
  const count: FiveElementCount = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  
  const pillars: GanZhi[] = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]
  
  for (const gz of pillars) {
    count[STEM_ELEMENT[gz.gan]] += 1
    count[BRANCH_ELEMENT[gz.zhi]] += 1
    
    const cang = CANG_GAN[gz.zhi]
    count[STEM_ELEMENT[cang.ben]] += 0.5
    if (cang.zhong) count[STEM_ELEMENT[cang.zhong]] += 0.3
    if (cang.yao) count[STEM_ELEMENT[cang.yao]] += 0.2
  }
  
  return count
}

function calculateDayMaster(dayGan: HeavenlyStem): DayMasterAnalysis {
  const dayGanElement = STEM_ELEMENT[dayGan]
  const dayGanYinYang = STEM_YINYANG[dayGan]
  const relatedShens = {} as Record<HeavenlyStem, ShenShi>
  
  const shens = SHENSHI_MAP[dayGanYinYang]
  
  for (const stem of HEAVENLY_STEMS) {
    const stemElement = STEM_ELEMENT[stem]
    const stemYinYang = STEM_YINYANG[stem]
    
    if (stemElement === dayGanElement) {
      if (stemYinYang === dayGanYinYang) {
        relatedShens[stem] = shens.sameYang || shens.sameYin || '比肩'
      } else {
        relatedShens[stem] = shens.sameYin || shens.sameYang || '劫财'
      }
    } else if (FIVE_ELEMENT_GENERATE[dayGanElement] === stemElement) {
      if (stemYinYang === dayGanYinYang) {
        relatedShens[stem] = shens.genYang || shens.genYin || '食神'
      } else {
        relatedShens[stem] = shens.genYin || shens.genYang || '伤官'
      }
    } else if (FIVE_ELEMENT_OVERCOME[dayGanElement] === stemElement) {
      if (stemYinYang === dayGanYinYang) {
        relatedShens[stem] = shens.keYang || shens.keYin || '偏财'
      } else {
        relatedShens[stem] = shens.keYin || shens.keYang || '正财'
      }
    } else if (FIVE_ELEMENT_OVERCOME[stemElement] === dayGanElement) {
      if (stemYinYang === dayGanYinYang) {
        relatedShens[stem] = shens.beiKeYang || shens.beiKeYin || '偏官'
      } else {
        relatedShens[stem] = shens.beiKeYin || shens.beiKeYang || '正官'
      }
    } else if (FIVE_ELEMENT_GENERATE[stemElement] === dayGanElement) {
      if (stemYinYang === dayGanYinYang) {
        relatedShens[stem] = shens.shengYang || shens.shengYin || '偏印'
      } else {
        relatedShens[stem] = shens.shengYin || shens.shengYang || '正印'
      }
    }
  }
  
  return { dayGan, dayGanElement, dayGanYinYang, relatedShens }
}

function calculateXiYongShen(fiveElementCount: FiveElementCount, dayMaster: DayMasterAnalysis): XiYongShen {
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  
  const dayElement = dayMaster.dayGanElement
  const dayYinYang = dayMaster.dayGanYinYang
  
  let bestElement: FiveElement
  let avoided: FiveElement[] = []
  
  const generate = FIVE_ELEMENT_GENERATE[dayElement]
  const overcome = FIVE_ELEMENT_OVERCOME[dayElement]
  const generateMe = elements.find(e => FIVE_ELEMENT_GENERATE[e] === dayElement)!
  const overcomeMe = elements.find(e => FIVE_ELEMENT_OVERCOME[e] === dayElement)!
  
  const dayCount = fiveElementCount[dayElement]
  
  if (dayCount >= 5) {
    bestElement = overcome
    avoided = [dayElement, generate]
  } else if (dayCount <= 2) {
    bestElement = generateMe
    avoided = [overcomeMe, overcome]
  } else {
    bestElement = generate
    avoided = [overcomeMe]
  }
  
  const happiness = `${dayElement}日主，${bestElement}为喜用神，${dayYinYang === '阳' ? '阳刚' : '阴柔'}之性，宜${bestElement}相关之物以调和。`
  const usage = `命局中${bestElement}力量${dayCount >= 5 ? '偏弱需生扶' : dayCount <= 2 ? '偏旺需泄耗' : '中和，宜顺势'}。日常可多接触${bestElement}属性的颜色、方位、行业，以增强运势。`
  
  return {
    bestElement,
    happiness,
    usage,
    avoidedElements: avoided,
  }
}

function generateDefaultAnalysis(): BaZiAnalysis {
  return {
    overall: '命格深厚，需结合大运综合分析。',
    personality: '命主性格坚毅，有主见，做事有条理。待人真诚，重情重义。',
    career: '事业上有贵人相助，宜稳扎稳打，不宜冒进。中年之后运势渐佳。',
    wealth: '财运平稳，正财为主，偏财为辅。量入为出，方能积累。',
    relationship: '感情专一，重视家庭。与伴侣相处宜多沟通，避免误会。',
    health: '身体底子不错，但需注意作息规律，劳逸结合。',
    wuxingAdvice: '五行平衡为佳，宜根据命局喜忌调整。',
    summary: '整体命局平稳，用神得力，中晚年运势渐入佳境。',
  }
}

function calculateOverallScore(fiveElementCount: FiveElementCount): number {
  const values = Object.values(fiveElementCount)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const balance = 1 - (max - min) / (max + min + 1)
  return Math.round(60 + balance * 40)
}

export function calculateBaZi(birthInfo: BirthInfo): BaZiChart {
  const [year, month, day] = birthInfo.birthDate.split('-').map(Number)
  const [hours, minutes] = birthInfo.birthTime.split(':').map(Number)
  
  const birthDate = new Date(year, month - 1, day, hours, minutes)
  
  const yearGanZhi = getYearGanZhi(birthDate)
  const monthGanZhi = getMonthGanZhi(birthDate, yearGanZhi.gan)
  const dayGanZhi = getDayGanZhi(birthDate)
  const hourGanZhi = getHourGanZhi(birthDate, dayGanZhi.gan)
  
  const sixLines: SixLines = {
    year: yearGanZhi,
    month: monthGanZhi,
    day: dayGanZhi,
    hour: hourGanZhi,
  }
  
  const fiveElementCount = calculateFiveElementCount(sixLines)
  const dayMaster = calculateDayMaster(dayGanZhi.gan)
  const xiYongShen = calculateXiYongShen(fiveElementCount, dayMaster)
  const analysis = generateDefaultAnalysis()
  const overallScore = calculateOverallScore(fiveElementCount)
  
  return {
    birthInfo,
    sixLines,
    fiveElementCount,
    dayMaster,
    cangGan: CANG_GAN,
    xiYongShen,
    analysis,
    overallScore,
    version: '1.0',
    createdAt: Date.now(),
  }
}

export { HEAVENLY_STEMS, EARTHLY_BRANCHES, STEM_ELEMENT, STEM_YINYANG, BRANCH_ELEMENT, CANG_GAN }
