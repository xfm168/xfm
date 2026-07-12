import type { SixLines, HeavenlyStem, EarthlyBranch, GanZhi, FiveElement, ShenShi } from './types'
import { getStemElement, getStemYinYang, getBranchElement, getBranchIndex, EARTHLY_BRANCHES, HEAVENLY_STEMS } from '@/lib/core'

/** 天干互动关系 */
export interface TianGanRelation {
  type: '伏吟' | '五合' | '争合' | '合化' | '生' | '克' | '比和'
  target: string
  description: string
  isAuspicious: boolean | null
  strength: number
}

export interface LiuNianYear {
  year: number
  ganZhi: GanZhi
  shenShi: {
    gan: ShenShi
    zhi: ShenShi
  }
  // 流年与命局关系
  vsMingJu: {
    chong: string[]
    he: string[]
    xing: string[]
    hai: string[]
    chuan: string[]
    po: string[]
  }
  // 流年与大运关系
  vsDaYun: {
    chong: string[]
    he: string[]
    xing: string[]
    hai: string[]
    chuan: string[]
    po: string[]
    fuYin: string[]
  }
  // V3.3 新增：天干互动关系
  tianGanRelations: TianGanRelation[]
  // 应期事件
  yingQi: {
    event: string
    intensity: '高' | '中' | '低'
    reason: string
    implications: string[]
  }[]
  shenSha: string[]
  // V3.3 新增：综合评分与吉凶
  score: number
  jiXiong: '大吉' | '吉' | '平' | '凶' | '大凶'
  summary: string
  detail: string
  isCurrentYear: boolean
}

export interface LiuNianAnalysisResult {
  startYear: number
  endYear: number
  years: LiuNianYear[]
  currentYear: number
}

const LIU_NIAN_SUMMARIES: Record<ShenShi, string[]> = {
  比肩: ['比肩之年，朋友相助，事业平稳', '比劫争财，注意理财', '兄弟同心，共渡难关'],
  劫财: ['劫财之年，竞争激烈，注意小人', '破财风险，投资谨慎', '合作需小心'],
  食神: ['食神之年，福气满满，衣食无忧', '才华发挥，创意无限', '贵人相助，逢凶化吉'],
  伤官: ['伤官之年，才华横溢，口舌是非', '事业变动，机会与挑战并存', '注意健康，防官非'],
  偏财: ['偏财之年，意外之财，投资得利', '桃花运旺，人缘好', '财富波动，见好就收'],
  正财: ['正财之年，财源稳定，事业上升', '努力付出，回报丰厚', '财运亨通，积累财富'],
  偏官: ['偏官之年，事业压力大，挑战多', '权力斗争，小人作祟', '化险为夷，成就非凡'],
  正官: ['正官之年，事业顺遂，名利双收', '贵人提拔，步步高升', '官运亨通，地位提升'],
  偏印: ['偏印之年，思维活跃，灵感多', '学习进修，技艺提升', '孤独感强，注意休息'],
  正印: ['正印之年，学业有成，贵人多', '事业稳定，名声好', '福气深厚，健康平安'],
}

const LIU_NIAN_DETAILS: Record<ShenShi, string> = {
  比肩: '今年为比肩年，命主自我意识较强，有主见，做事有担当。朋友缘不错，易得同辈朋友的帮助和支持。但也要注意因朋友之事而破财，或因竞争而与人产生矛盾。事业上竞争较大，需靠实力取胜。感情方面易有竞争者出现，需多加注意。财运平稳，不宜大笔投资，宜守不宜攻。',
  劫财: '今年为劫财年，命主竞争意识强烈，凡事都要争个高低。事业上竞争激烈，小人较多，容易有口舌是非。财运起伏较大，容易有破财之事发生，不宜投资创业，不宜借钱给他人。感情中容易有第三者插足，需用心经营。',
  食神: '今年为食神年，命主福气深厚，衣食无忧。才华得以发挥，创意灵感不断，适合从事艺术、创作类工作。贵人运旺，遇事总能逢凶化吉。财运稳定，收入可观。感情美满，家庭和睦。健康状况良好，心情愉悦。',
  伤官: '今年为伤官年，命主才华横溢，聪明过人，但也容易恃才傲物，得罪他人。事业上多变动，有新的机会，但也容易因冲动而失败。注意口舌是非，防范官非诉讼。感情中容易有波折，需多沟通理解。',
  偏财: '今年为偏财年，命主偏财运旺，容易得到意外之财，投资、博彩皆有斩获。人缘好，桃花运旺盛，异性缘佳。但财运起伏较大，来的快去的也快，需注意理财，见好就收。事业上有贵人相助，机会多多。',
  正财: '今年为正财年，命主财运亨通，财源稳定。事业蒸蒸日上，努力付出必有丰厚回报。正财代表正当收入，适合踏实工作，稳步发展。感情稳定，家庭美满。今年是积累财富的好时机，宜储蓄、置产。',
  偏官: '今年为偏官年，命主事业心强，有冲劲，敢于挑战。事业上压力较大，竞争激烈，但也容易在压力中脱颖而出。权力斗争频繁，需防小人暗算。若能化险为夷，必能成就非凡。注意身体健康，劳逸结合。',
  正官: '今年为正官年，命主官运亨通，事业顺遂。易得贵人提拔，步步高升。正官代表正统、规矩，适合在政府、国企、大公司发展。名声好，受人尊重。感情稳定，婚姻美满。今年是事业发展的好时机。',
  偏印: '今年为偏印年，命主思维活跃，灵感不断。适合学习进修，提升技艺。但偏印也主孤独，今年人缘稍差，知心朋友少。事业上适合从事研究、技术、玄学类工作。注意休息，避免过度思虑。',
  正印: '今年为正印年，命主学业有成，智慧大开。贵人运极旺，总能得到长辈、上司的赏识和帮助。事业稳定发展，名声远扬。福气深厚，健康平安。正印代表文化、教育，适合从事教育、文化、公职类工作。',
}

const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const LIU_HE: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

const SAN_HE: Record<FiveElement, EarthlyBranch[]> = {
  木: ['亥', '卯', '未'],
  火: ['寅', '午', '戌'],
  土: ['辰', '戌', '丑', '未'],
  金: ['巳', '酉', '丑'],
  水: ['申', '子', '辰'],
}

const SAN_XING: EarthlyBranch[][] = [
  ['寅', '巳', '申'],
  ['丑', '戌', '未'],
]

const LIU_HAI: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

const LIU_PO: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['戌', '未'],
]

const LIU_CHUAN: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

const TIAN_GAN_WU_HE: [HeavenlyStem, HeavenlyStem][] = [
  ['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸'],
]

/** 天干五合化出五行 */
const TIAN_GAN_WU_HE_HUA: Record<string, FiveElement> = {
  '甲己': '土', '己甲': '土',
  '乙庚': '金', '庚乙': '金',
  '丙辛': '水', '辛丙': '水',
  '丁壬': '木', '壬丁': '木',
  '戊癸': '火', '癸戊': '火',
}

/** 天干相生 */
const TIAN_GAN_SHENG: Record<HeavenlyStem, HeavenlyStem[]> = {
  '甲': ['丙', '丁'], '乙': ['丙', '丁'],
  '丙': ['戊', '己'], '丁': ['戊', '己'],
  '戊': ['庚', '辛'], '己': ['庚', '辛'],
  '庚': ['壬', '癸'], '辛': ['壬', '癸'],
  '壬': ['甲', '乙'], '癸': ['甲', '乙'],
}

/** 天干相克 */
const TIAN_GAN_KE: Record<HeavenlyStem, HeavenlyStem[]> = {
  '甲': ['戊', '己'], '乙': ['戊', '己'],
  '丙': ['庚', '辛'], '丁': ['庚', '辛'],
  '戊': ['壬', '癸'], '己': ['壬', '癸'],
  '庚': ['甲', '乙'], '辛': ['甲', '乙'],
  '壬': ['丙', '丁'], '癸': ['丙', '丁'],
}

function getAllShenShi(dayGan: HeavenlyStem): Record<HeavenlyStem, ShenShi> {
  const dayElement = getStemElement(dayGan)
  const dayYinYang = getStemYinYang(dayGan)
  const stems = HEAVENLY_STEMS
  const result = {} as Record<HeavenlyStem, ShenShi>
  for (const gan of stems) {
    const ganElement = getStemElement(gan)
    const ganYinYang = getStemYinYang(gan)
    result[gan] = getShenShiByRelation(dayElement, dayYinYang, ganElement, ganYinYang)
  }
  return result
}

function getShenShiByRelation(
  dayEl: FiveElement,
  dayYY: string,
  ganEl: FiveElement,
  ganYY: string,
): ShenShi {
  const generate: Record<FiveElement, FiveElement> = {
    木: '火', 火: '土', 土: '金', 金: '水', 水: '木'
  }
  const overcome: Record<FiveElement, FiveElement> = {
    木: '土', 土: '水', 水: '火', 火: '金', 金: '木'
  }
  const sameYY = dayYY === ganYY
  if (dayEl === ganEl) {
    return sameYY ? '比肩' : '劫财'
  }
  if (generate[dayEl] === ganEl) {
    return sameYY ? '食神' : '伤官'
  }
  if (overcome[dayEl] === ganEl) {
    return sameYY ? '偏财' : '正财'
  }
  if (overcome[ganEl] === dayEl) {
    return sameYY ? '偏官' : '正官'
  }
  if (generate[ganEl] === dayEl) {
    return sameYY ? '偏印' : '正印'
  }
  return '比肩'
}

function buildGanZhi(gan: HeavenlyStem, zhi: EarthlyBranch): GanZhi {
  return {
    gan,
    zhi,
    element: getStemElement(gan),
    yinYang: getStemYinYang(gan),
    naYin: '',
  } as GanZhi
}

function getYearGanZhi(year: number): GanZhi {
  const stemIndex = ((year - 4) % 10 + 10) % 10
  const branchIndex = ((year - 4) % 12 + 12) % 12
  const gan = HEAVENLY_STEMS[stemIndex]
  const zhi = EARTHLY_BRANCHES[branchIndex]
  return buildGanZhi(gan, zhi)
}

const CANG_GAN_TABLE: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
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

function checkChong(zhi: EarthlyBranch, sixLines: SixLines): string[] {
  const result: string[] = []
  const pillars = [
    { name: '年支', zhi: sixLines.year.zhi },
    { name: '月支', zhi: sixLines.month.zhi },
    { name: '日支', zhi: sixLines.day.zhi },
    { name: '时支', zhi: sixLines.hour.zhi },
  ]
  for (const [a, b] of LIU_CHONG) {
    if (zhi === a) {
      for (const p of pillars) {
        if (p.zhi === b) result.push(`冲${p.name}`)
      }
    }
    if (zhi === b) {
      for (const p of pillars) {
        if (p.zhi === a) result.push(`冲${p.name}`)
      }
    }
  }
  return result
}

function checkHe(zhi: EarthlyBranch, sixLines: SixLines): string[] {
  const result: string[] = []
  const pillars = [
    { name: '年支', zhi: sixLines.year.zhi },
    { name: '月支', zhi: sixLines.month.zhi },
    { name: '日支', zhi: sixLines.day.zhi },
    { name: '时支', zhi: sixLines.hour.zhi },
  ]
  for (const [a, b] of LIU_HE) {
    if (zhi === a) {
      for (const p of pillars) {
        if (p.zhi === b) result.push(`合${p.name}`)
      }
    }
    if (zhi === b) {
      for (const p of pillars) {
        if (p.zhi === a) result.push(`合${p.name}`)
      }
    }
  }
  // 天干五合已移至 tianGanRelations，不再混入地支合
  return result
}

function checkXing(zhi: EarthlyBranch, sixLines: SixLines): string[] {
  const result: string[] = []
  const zhiList = [sixLines.year.zhi, sixLines.month.zhi, sixLines.day.zhi, sixLines.hour.zhi]
  for (const combo of SAN_XING) {
    const count = combo.filter(z => zhiList.includes(z as EarthlyBranch) || z === zhi).length
    if (count >= 2) {
      if (combo.includes(zhi)) {
        result.push('三刑')
        break
      }
    }
  }
  return result
}

function checkHai(zhi: EarthlyBranch, sixLines: SixLines): string[] {
  const result: string[] = []
  const pillars = [
    { name: '年支', zhi: sixLines.year.zhi },
    { name: '月支', zhi: sixLines.month.zhi },
    { name: '日支', zhi: sixLines.day.zhi },
    { name: '时支', zhi: sixLines.hour.zhi },
  ]
  for (const [a, b] of LIU_HAI) {
    if (zhi === a) {
      for (const p of pillars) {
        if (p.zhi === b) result.push(`害${p.name}`)
      }
    }
    if (zhi === b) {
      for (const p of pillars) {
        if (p.zhi === a) result.push(`害${p.name}`)
      }
    }
  }
  return result
}

function checkPo(zhi: EarthlyBranch, sixLines: SixLines): string[] {
  const result: string[] = []
  const pillars = [
    { name: '年支', zhi: sixLines.year.zhi },
    { name: '月支', zhi: sixLines.month.zhi },
    { name: '日支', zhi: sixLines.day.zhi },
    { name: '时支', zhi: sixLines.hour.zhi },
  ]
  for (const [a, b] of LIU_PO) {
    if (zhi === a) {
      for (const p of pillars) {
        if (p.zhi === b) result.push(`破${p.name}`)
      }
    }
    if (zhi === b) {
      for (const p of pillars) {
        if (p.zhi === a) result.push(`破${p.name}`)
      }
    }
  }
  return result
}

function checkChuan(zhi: EarthlyBranch, sixLines: SixLines): string[] {
  const result: string[] = []
  const pillars = [
    { name: '年支', zhi: sixLines.year.zhi },
    { name: '月支', zhi: sixLines.month.zhi },
    { name: '日支', zhi: sixLines.day.zhi },
    { name: '时支', zhi: sixLines.hour.zhi },
  ]
  for (const [a, b] of LIU_CHUAN) {
    if (zhi === a) {
      for (const p of pillars) {
        if (p.zhi === b) result.push(`穿${p.name}`)
      }
    }
    if (zhi === b) {
      for (const p of pillars) {
        if (p.zhi === a) result.push(`穿${p.name}`)
      }
    }
  }
  return result
}

// 流年与大运关系检测
function checkDaYunChong(yearZhi: EarthlyBranch, daYunZhi: EarthlyBranch): boolean {
  return LIU_CHONG.some(([a, b]) => (yearZhi === a && daYunZhi === b) || (yearZhi === b && daYunZhi === a))
}

function checkDaYunHe(yearZhi: EarthlyBranch, daYunZhi: EarthlyBranch): boolean {
  return LIU_HE.some(([a, b]) => (yearZhi === a && daYunZhi === b) || (yearZhi === b && daYunZhi === a))
}

function checkDaYunXing(yearZhi: EarthlyBranch, daYunZhi: EarthlyBranch): boolean {
  return SAN_XING.some(combo => combo.includes(yearZhi) && combo.includes(daYunZhi))
}

function checkDaYunHai(yearZhi: EarthlyBranch, daYunZhi: EarthlyBranch): boolean {
  return LIU_HAI.some(([a, b]) => (yearZhi === a && daYunZhi === b) || (yearZhi === b && daYunZhi === a))
}

function checkDaYunChuan(yearZhi: EarthlyBranch, daYunZhi: EarthlyBranch): boolean {
  return LIU_CHUAN.some(([a, b]) => (yearZhi === a && daYunZhi === b) || (yearZhi === b && daYunZhi === a))
}

function checkDaYunPo(yearZhi: EarthlyBranch, daYunZhi: EarthlyBranch): boolean {
  return LIU_PO.some(([a, b]) => (yearZhi === a && daYunZhi === b) || (yearZhi === b && daYunZhi === a))
}

// ==================== V3.3 天干互动分析 ====================

/** 检测流年天干与命局各柱天干的伏吟（完全相同） */
function checkTianGanFuYin(yearGan: HeavenlyStem, sixLines: SixLines): { pillar: string; gan: HeavenlyStem }[] {
  const result: { pillar: string; gan: HeavenlyStem }[] = []
  const pillars: { name: string; gan: HeavenlyStem }[] = [
    { name: '年干', gan: sixLines.year.gan },
    { name: '月干', gan: sixLines.month.gan },
    { name: '日干', gan: sixLines.day.gan },
    { name: '时干', gan: sixLines.hour.gan },
  ]
  for (const p of pillars) {
    if (p.gan === yearGan) {
      result.push({ pillar: p.name, gan: p.gan })
    }
  }
  return result
}

/** 检测比肩/劫财伏吟（流年天干与日主同五行） */
function checkTianGanBiJieFuYin(yearGan: HeavenlyStem, dayGan: HeavenlyStem): { type: '比肩' | '劫财'; reason: string } | null {
  const yearEl = getStemElement(yearGan)
  const dayEl = getStemElement(dayGan)
  const yearYY = getStemYinYang(yearGan)
  const dayYY = getStemYinYang(dayGan)
  if (yearEl !== dayEl) return null
  if (yearYY === dayYY) {
    return { type: '比肩', reason: `流年天干${yearGan}与日主${dayGan}同属${yearEl}且同性，为比肩伏吟` }
  }
  return { type: '劫财', reason: `流年天干${yearGan}与日主${dayGan}同属${yearEl}但异性，为劫财伏吟` }
}

/** 流年天干与命局天干五合 */
function checkTianGanWuHeVsMingJu(yearGan: HeavenlyStem, sixLines: SixLines): { pillar: string; gan: HeavenlyStem; hua: FiveElement }[] {
  const result: { pillar: string; gan: HeavenlyStem; hua: FiveElement }[] = []
  const pillars: { name: string; gan: HeavenlyStem }[] = [
    { name: '年干', gan: sixLines.year.gan },
    { name: '月干', gan: sixLines.month.gan },
    { name: '日干', gan: sixLines.day.gan },
    { name: '时干', gan: sixLines.hour.gan },
  ]
  for (const p of pillars) {
    const key1 = `${yearGan}${p.gan}` as keyof typeof TIAN_GAN_WU_HE_HUA
    const key2 = `${p.gan}${yearGan}` as keyof typeof TIAN_GAN_WU_HE_HUA
    const hua = TIAN_GAN_WU_HE_HUA[key1] || TIAN_GAN_WU_HE_HUA[key2]
    if (hua) {
      result.push({ pillar: p.name, gan: p.gan, hua })
    }
  }
  return result
}

/** 流年天干与命局天干生克 */
function checkTianGanShengKeVsMingJu(
  yearGan: HeavenlyStem,
  sixLines: SixLines,
  dayGan: HeavenlyStem,
): { type: '生' | '克' | '比和'; pillar: string; gan: HeavenlyStem; description: string }[] {
  const result: { type: '生' | '克' | '比和'; pillar: string; gan: HeavenlyStem; description: string }[] = []
  const pillars: { name: string; gan: HeavenlyStem }[] = [
    { name: '年干', gan: sixLines.year.gan },
    { name: '月干', gan: sixLines.month.gan },
    { name: '日干', gan: sixLines.day.gan },
    { name: '时干', gan: sixLines.hour.gan },
  ]
  for (const p of pillars) {
    if (p.gan === yearGan) {
      result.push({ type: '比和', pillar: p.name, gan: p.gan, description: `流年天干${yearGan}与${p.name}比和` })
      continue
    }
    if (TIAN_GAN_SHENG[yearGan]?.includes(p.gan)) {
      result.push({ type: '生', pillar: p.name, gan: p.gan, description: `流年天干${yearGan}生${p.name}${p.gan}` })
      continue
    }
    if (TIAN_GAN_KE[yearGan]?.includes(p.gan)) {
      result.push({ type: '克', pillar: p.name, gan: p.gan, description: `流年天干${yearGan}克${p.name}${p.gan}` })
      continue
    }
  }
  return result
}

/** 流年天干与大运天干五合 */
function checkTianGanWuHeVsDaYun(yearGan: HeavenlyStem, daYunGan: HeavenlyStem): { hua: FiveElement } | null {
  const key1 = `${yearGan}${daYunGan}` as keyof typeof TIAN_GAN_WU_HE_HUA
  const key2 = `${daYunGan}${yearGan}` as keyof typeof TIAN_GAN_WU_HE_HUA
  const hua = TIAN_GAN_WU_HE_HUA[key1] || TIAN_GAN_WU_HE_HUA[key2]
  if (hua) return { hua }
  return null
}

/** 流年天干与大运天干生克 */
function checkTianGanShengKeVsDaYun(
  yearGan: HeavenlyStem,
  daYunGan: HeavenlyStem,
): { type: '生' | '克' | '比和'; description: string } | null {
  if (yearGan === daYunGan) return { type: '比和', description: `流年天干${yearGan}与大运天干${daYunGan}比和` }
  if (TIAN_GAN_SHENG[yearGan]?.includes(daYunGan)) return { type: '生', description: `流年天干${yearGan}生大运天干${daYunGan}` }
  if (TIAN_GAN_KE[yearGan]?.includes(daYunGan)) return { type: '克', description: `流年天干${yearGan}克大运天干${daYunGan}` }
  if (TIAN_GAN_SHENG[daYunGan]?.includes(yearGan)) return { type: '生', description: `大运天干${daYunGan}生流年天干${yearGan}` }
  if (TIAN_GAN_KE[daYunGan]?.includes(yearGan)) return { type: '克', description: `大运天干${daYunGan}克流年天干${yearGan}` }
  return null
}

/** 争合检测：命局中已有天干与流年天干形成五合，且另一柱也有相同天干 */
function checkTianGanZhengHe(yearGan: HeavenlyStem, sixLines: SixLines): { type: string; description: string } | null {
  // 找流年天干在命局中的五合对象
  const hePartners: string[] = []
  const pillars = [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan]
  for (const gan of pillars) {
    const key1 = `${yearGan}${gan}` as keyof typeof TIAN_GAN_WU_HE_HUA
    const key2 = `${gan}${yearGan}` as keyof typeof TIAN_GAN_WU_HE_HUA
    if (TIAN_GAN_WU_HE_HUA[key1] || TIAN_GAN_WU_HE_HUA[key2]) {
      hePartners.push(gan)
    }
  }
  // 如果命局中有两个或以上天干能与流年五合，则形成争合
  if (hePartners.length >= 2) {
    return {
      type: '争合',
      description: `流年天干${yearGan}与命局${hePartners.join('、')}均有合意，形成争合，合而不专`,
    }
  }
  return null
}

/** 合化成功判断：五合成化需要月令支持或化神透出 */
function checkTianGanHeHua(
  ganA: HeavenlyStem,
  ganB: HeavenlyStem,
  monthZhi: EarthlyBranch,
  sixLines: SixLines,
): { success: boolean; huaElement: FiveElement | null; reason: string } {
  const key1 = `${ganA}${ganB}` as keyof typeof TIAN_GAN_WU_HE_HUA
  const key2 = `${ganB}${ganA}` as keyof typeof TIAN_GAN_WU_HE_HUA
  const huaElement = TIAN_GAN_WU_HE_HUA[key1] || TIAN_GAN_WU_HE_HUA[key2]
  if (!huaElement) {
    return { success: false, huaElement: null, reason: '非五合关系，无从化' }
  }

  // 成化条件1：月令是化神当令或生助化神
  const monthEl = getBranchElement(monthZhi)
  const GENERATE: Record<FiveElement, FiveElement> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const isMonthSupport = monthEl === huaElement || GENERATE[monthEl] === huaElement

  // 成化条件2：化神在天干透出
  const stems = [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan]
  const huaShenTouGan = stems.some(g => getStemElement(g) === huaElement)

  // 成化条件3：无克制化神的天干（如甲己合土，遇甲乙木克土则化神受损）
  const OVERCOME: Record<FiveElement, FiveElement> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  const keHuaShen = OVERCOME[huaElement]
  const huaShenShouKe = stems.some(g => getStemElement(g) === keHuaShen)

  if (isMonthSupport && huaShenTouGan && !huaShenShouKe) {
    return { success: true, huaElement, reason: `月令${monthZhi}生助化神${huaElement}，且化神透干无克，合化成功` }
  }
  if (isMonthSupport || huaShenTouGan) {
    return { success: false, huaElement, reason: `虽有合意，但成化条件不足（月令${isMonthSupport ? '支持' : '不支持'}、化神${huaShenTouGan ? '透干' : '不透'}、${huaShenShouKe ? '化神受克' : '化神无克'}），合而不化` }
  }
  return { success: false, huaElement, reason: '合意虽存，但无月令支持且化神不透，合而不化' }
}

/** 综合流年评分：十神变化 + 天干关系 + 地支关系 + 神煞 */
function calculateLiuNianScore(
  shenShiGan: ShenShi,
  tianGanRelations: TianGanRelation[],
  vsMingJu: LiuNianYear['vsMingJu'],
  vsDaYun: LiuNianYear['vsDaYun'],
  shenSha: string[],
): { score: number; jiXiong: '大吉' | '吉' | '平' | '凶' | '大凶' } {
  let score = 50 // 基准分

  // 1. 十神基础分
  const jiShen: ShenShi[] = ['正官', '正印', '偏财', '正财', '食神']
  const xiongShen: ShenShi[] = ['偏官', '偏印', '伤官', '劫财']
  const zhongXing: ShenShi[] = ['比肩']
  if (jiShen.includes(shenShiGan)) score += 10
  if (xiongShen.includes(shenShiGan)) score -= 8
  if (zhongXing.includes(shenShiGan)) score -= 2

  // 2. 天干关系加减分
  for (const rel of tianGanRelations) {
    if (rel.isAuspicious === true) score += rel.strength
    if (rel.isAuspicious === false) score -= rel.strength
  }

  // 3. 地支关系加减分
  score -= vsMingJu.chong.length * 8
  score -= vsMingJu.xing.length * 7
  score -= vsMingJu.chuan.length * 6
  score -= vsMingJu.po.length * 4
  score -= vsMingJu.hai.length * 3
  score += vsMingJu.he.length * 4

  // 4. 大运关系加减分
  score -= vsDaYun.chong.length * 6
  score -= vsDaYun.xing.length * 5
  score += vsDaYun.he.length * 3
  score -= vsDaYun.fuYin.length * 3

  // 5. 神煞加减分
  if (shenSha.includes('太岁')) score -= 3
  if (shenSha.includes('岁破')) score -= 5

  score = Math.min(100, Math.max(0, Math.round(score)))

  let jiXiong: '大吉' | '吉' | '平' | '凶' | '大凶'
  if (score >= 85) jiXiong = '大吉'
  else if (score >= 70) jiXiong = '吉'
  else if (score >= 45) jiXiong = '平'
  else if (score >= 25) jiXiong = '凶'
  else jiXiong = '大凶'

  return { score, jiXiong }
}

// 生成流年应期事件
function buildYingQi(
  year: number,
  yearGanZhi: GanZhi,
  vsMingJu: LiuNianYear['vsMingJu'],
  vsDaYun: LiuNianYear['vsDaYun'],
  dayZhi: EarthlyBranch,
  dayGan: HeavenlyStem,
  sixLines: SixLines,
  tianGanRelations: TianGanRelation[],
): LiuNianYear['yingQi'] {
  const yingQi: LiuNianYear['yingQi'] = []

  // 冲日支（夫妻宫）
  if (vsMingJu.chong.some(s => s.includes('日支'))) {
    yingQi.push({
      event: '冲夫妻宫',
      intensity: '高',
      reason: `流年${yearGanZhi.zhi}冲日支${dayZhi}，夫妻宫受冲`,
      implications: ['婚姻感情有波动', '事业环境有变动', '注意健康，防意外'],
    })
  }

  // 合日支
  if (vsMingJu.he.some(s => s.includes('日支'))) {
    yingQi.push({
      event: '合夫妻宫',
      intensity: '中',
      reason: `流年${yearGanZhi.zhi}合日支${dayZhi}，夫妻宫逢合`,
      implications: ['人际关系和谐', '婚姻感情有进展', '有合作机会'],
    })
  }

  // 流年冲大运
  if (vsDaYun.chong.length > 0) {
    yingQi.push({
      event: '流年冲大运',
      intensity: '高',
      reason: `流年地支${yearGanZhi.zhi}与大运地支相冲`,
      implications: ['大运与流年相冲，变动加剧', '事业、居住环境可能变化', '注意人际关系'],
    })
  }

  // 流年合大运
  if (vsDaYun.he.length > 0) {
    yingQi.push({
      event: '流年合大运',
      intensity: '中',
      reason: `流年地支${yearGanZhi.zhi}与大运地支相合`,
      implications: ['大运与流年相合，机遇增多', '适合合作、签约', '贵人助力'],
    })
  }

  // 流年刑命局
  if (vsMingJu.xing.length > 0) {
    yingQi.push({
      event: '流年刑命局',
      intensity: '高',
      reason: `流年地支${yearGanZhi.zhi}与命局地支相刑`,
      implications: ['官非口舌，注意法律风险', '人际关系紧张', '注意身体健康'],
    })
  }

  // 流年害命局
  if (vsMingJu.hai.length > 0) {
    yingQi.push({
      event: '流年害命局',
      intensity: '中',
      reason: `流年地支${yearGanZhi.zhi}与命局地支相害`,
      implications: ['小人暗害，注意防范', '健康有损', '合作关系受损'],
    })
  }

  // 流年穿命局
  if (vsMingJu.chuan.length > 0) {
    yingQi.push({
      event: '流年穿命局',
      intensity: '高',
      reason: `流年地支${yearGanZhi.zhi}与命局地支相穿`,
      implications: ['暗伤暗藏，防突发变故', '注意内部矛盾', '事业有暗阻'],
    })
  }

  // 流年破命局
  if (vsMingJu.po.length > 0) {
    yingQi.push({
      event: '流年破命局',
      intensity: '中',
      reason: `流年地支${yearGanZhi.zhi}与命局地支相破`,
      implications: ['破财耗损，注意理财', '合作关系破裂', '计划受阻'],
    })
  }

  // ==================== V3.3 天干伏吟与互动应期 ====================

  // 1. 天干伏吟（流年干与命局各柱天干相同）
  const ganFuYin = checkTianGanFuYin(yearGanZhi.gan, sixLines)
  for (const fy of ganFuYin) {
    const isDayMaster = fy.pillar === '日干'
    yingQi.push({
      event: isDayMaster ? '日干伏吟' : `${fy.pillar}伏吟`,
      intensity: isDayMaster ? '高' : '中',
      reason: `流年天干${yearGanZhi.gan}与命局${fy.pillar}${fy.gan}相同，${isDayMaster ? '日主伏吟主反复纠结、情绪起伏大' : '天干伏吟主该柱所代表的人事有反复'}`,
      implications: isDayMaster
        ? ['自我意识强烈，容易固执己见', '情绪波动大，注意心理健康', '事情反复，重要决策宜缓']
        : [`${fy.pillar}所代表的人事有变动或反复`, '需防旧事重提', '做事宜稳扎稳打'],
    })
  }

  // 2. 比肩/劫财伏吟（流年天干与日主同五行）
  const biJieFuYin = checkTianGanBiJieFuYin(yearGanZhi.gan, dayGan)
  if (biJieFuYin) {
    yingQi.push({
      event: `${biJieFuYin.type}伏吟`,
      intensity: '中',
      reason: biJieFuYin.reason,
      implications: biJieFuYin.type === '比肩'
        ? ['竞争加剧，同辈压力增大', '自我意识强烈，合作需注意', '财运平稳但不宜投机']
        : ['破财风险增加，不宜借贷', '小人暗算，防范竞争', '感情中有第三者迹象'],
    })
  }

  // 3. 天干五合应期
  const wuHeList = checkTianGanWuHeVsMingJu(yearGanZhi.gan, sixLines)
  for (const wh of wuHeList) {
    const isDayMaster = wh.pillar === '日干'
    const heHua = checkTianGanHeHua(yearGanZhi.gan, wh.gan, sixLines.month.zhi as EarthlyBranch, sixLines)
    yingQi.push({
      event: isDayMaster ? '天干合日主' : `天干合${wh.pillar}`,
      intensity: isDayMaster ? '高' : '中',
      reason: `流年天干${yearGanZhi.gan}与${wh.pillar}${wh.gan}五合，欲化${heHua.huaElement || wh.hua}。${heHua.reason}`,
      implications: isDayMaster
        ? ['人际关系变化显著', '感情婚姻有重要转折', '合作机会增多，但需防合而不化']
        : [`${wh.pillar}所代表的人事有合作或牵绊`, '贵人缘分出现', '合化成功则吉，合而不化则滞'],
    })
  }

  // 4. 争合应期
  const zhengHe = checkTianGanZhengHe(yearGanZhi.gan, sixLines)
  if (zhengHe) {
    yingQi.push({
      event: '天干争合',
      intensity: '中',
      reason: zhengHe.description,
      implications: ['感情或合作对象不专一', '机会多但难以抉择', '人际关系复杂，需明辨是非'],
    })
  }

  // 5. 天干生克应期
  const shengKeList = checkTianGanShengKeVsMingJu(yearGanZhi.gan, sixLines, dayGan)
  for (const sk of shengKeList) {
    if (sk.pillar === '日干') {
      // 流年天干对日主的直接作用
      if (sk.type === '生') {
        yingQi.push({
          event: '流年天干生助日主',
          intensity: '中',
          reason: sk.description,
          implications: ['得贵人相助，运势提升', '学业事业有进展', '身心健康，精力充沛'],
        })
      } else if (sk.type === '克') {
        yingQi.push({
          event: '流年天干克制日主',
          intensity: '高',
          reason: sk.description,
          implications: ['压力增大，挑战增多', '注意健康和意外', '凡事谨慎，不可冒进'],
        })
      }
    }
  }

  // 6. 天干重复（命局中已有两个或以上相同天干，流年再来）
  const ganCounts: Record<string, number> = {}
  const allGan = [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan]
  for (const g of allGan) ganCounts[g] = (ganCounts[g] || 0) + 1
  if (ganCounts[yearGanZhi.gan] && ganCounts[yearGanZhi.gan] >= 2) {
    yingQi.push({
      event: '天干三重（重复）',
      intensity: '高',
      reason: `命局中已有${ganCounts[yearGanZhi.gan]}个${yearGanZhi.gan}，流年天干再来${yearGanZhi.gan}，形成天干三重`,
      implications: ['该五行力量过旺，易走极端', '所代表的十神事项被极度强化', '好事过头变坏事，需防物极必反'],
    })
  }

  return yingQi
}

function checkLiuNianShenSha(yearZhi: EarthlyBranch, dayGan: HeavenlyStem): string[] {
  const result: string[] = []
  const taiSuiMap: Record<EarthlyBranch, string> = {
    子: '太岁', 丑: '太岁', 寅: '太岁', 卯: '太岁', 辰: '太岁', 巳: '太岁',
    午: '太岁', 未: '太岁', 申: '太岁', 酉: '太岁', 戌: '太岁', 亥: '太岁',
  }
  result.push(taiSuiMap[yearZhi] || '太岁')
  const idx = getBranchIndex(yearZhi)
  const suiPoIdx = (idx + 6) % 12
  const suiPo = EARTHLY_BRANCHES[suiPoIdx]
  if (suiPo) result.push('岁破')
  return result
}

export function analyzeLiuNian(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  startYear: number,
  yearsCount: number = 100,
  daYunSteps?: { ganZhi: GanZhi; startYear: number; endYear: number }[],
): LiuNianAnalysisResult {
  const shenShiMap = getAllShenShi(dayGan)
  const now = new Date()
  const currentYear = now.getFullYear()
  const years: LiuNianYear[] = []
  const dayZhi = sixLines.day.zhi as EarthlyBranch

  for (let i = 0; i < yearsCount; i++) {
    const year = startYear + i
    const ganZhi = getYearGanZhi(year)
    const ganShen = shenShiMap[ganZhi.gan as HeavenlyStem]
    const zhiMainGan = CANG_GAN_TABLE[ganZhi.zhi]?.ben || ganZhi.zhi
    const zhiShen = shenShiMap[zhiMainGan as HeavenlyStem]

    // 流年与命局关系
    const vsMingJu = {
      chong: checkChong(ganZhi.zhi as EarthlyBranch, sixLines),
      he: checkHe(ganZhi.zhi as EarthlyBranch, sixLines),
      xing: checkXing(ganZhi.zhi as EarthlyBranch, sixLines),
      hai: checkHai(ganZhi.zhi as EarthlyBranch, sixLines),
      chuan: checkChuan(ganZhi.zhi as EarthlyBranch, sixLines),
      po: checkPo(ganZhi.zhi as EarthlyBranch, sixLines),
    }

    // 流年与大运关系
    const vsDaYun: LiuNianYear['vsDaYun'] = {
      chong: [],
      he: [],
      xing: [],
      hai: [],
      chuan: [],
      po: [],
      fuYin: [],
    }

    // 找到当前年份所在的大运
    const currentDaYun = daYunSteps?.find(step => year >= step.startYear && year <= step.endYear)
    if (currentDaYun) {
      const dyZhi = currentDaYun.ganZhi.zhi as EarthlyBranch
      const dyGan = currentDaYun.ganZhi.gan as HeavenlyStem

      if (checkDaYunChong(ganZhi.zhi as EarthlyBranch, dyZhi)) vsDaYun.chong.push(`冲大运${dyZhi}`)
      if (checkDaYunHe(ganZhi.zhi as EarthlyBranch, dyZhi)) vsDaYun.he.push(`合大运${dyZhi}`)
      if (checkDaYunXing(ganZhi.zhi as EarthlyBranch, dyZhi)) vsDaYun.xing.push(`刑大运${dyZhi}`)
      if (checkDaYunHai(ganZhi.zhi as EarthlyBranch, dyZhi)) vsDaYun.hai.push(`害大运${dyZhi}`)
      if (checkDaYunChuan(ganZhi.zhi as EarthlyBranch, dyZhi)) vsDaYun.chuan.push(`穿大运${dyZhi}`)
      if (checkDaYunPo(ganZhi.zhi as EarthlyBranch, dyZhi)) vsDaYun.po.push(`破大运${dyZhi}`)
      if (ganZhi.gan === dyGan) vsDaYun.fuYin.push('天干伏吟')
      if (ganZhi.zhi === dyZhi) vsDaYun.fuYin.push('地支伏吟')
    }

    // ==================== V3.3 天干互动分析 ====================
    const tianGanRelations: TianGanRelation[] = []

    // 1. 天干伏吟
    const ganFuYin = checkTianGanFuYin(ganZhi.gan as HeavenlyStem, sixLines)
    for (const fy of ganFuYin) {
      tianGanRelations.push({
        type: '伏吟',
        target: `${fy.pillar}${fy.gan}`,
        description: `流年天干${ganZhi.gan}与${fy.pillar}${fy.gan}伏吟`,
        isAuspicious: null,
        strength: fy.pillar === '日干' ? 5 : 3,
      })
    }

    // 2. 比肩/劫财伏吟
    const biJieFuYin = checkTianGanBiJieFuYin(ganZhi.gan as HeavenlyStem, dayGan)
    if (biJieFuYin) {
      tianGanRelations.push({
        type: '伏吟',
        target: `日主${dayGan}`,
        description: biJieFuYin.reason,
        isAuspicious: biJieFuYin.type === '比肩' ? null : false,
        strength: biJieFuYin.type === '比肩' ? 3 : 5,
      })
    }

    // 3. 天干五合
    const wuHeList = checkTianGanWuHeVsMingJu(ganZhi.gan as HeavenlyStem, sixLines)
    for (const wh of wuHeList) {
      const heHua = checkTianGanHeHua(ganZhi.gan as HeavenlyStem, wh.gan, sixLines.month.zhi as EarthlyBranch, sixLines)
      tianGanRelations.push({
        type: heHua.success ? '合化' : '五合',
        target: `${wh.pillar}${wh.gan}`,
        description: `流年天干${ganZhi.gan}与${wh.pillar}${wh.gan}${heHua.success ? '合化' : '五合'}${heHua.success ? `为${heHua.huaElement}` : ''}。${heHua.reason}`,
        isAuspicious: heHua.success ? true : null,
        strength: heHua.success ? 4 : 2,
      })
    }

    // 4. 争合
    const zhengHe = checkTianGanZhengHe(ganZhi.gan as HeavenlyStem, sixLines)
    if (zhengHe) {
      tianGanRelations.push({
        type: '争合',
        target: '命局天干',
        description: zhengHe.description,
        isAuspicious: false,
        strength: 4,
      })
    }

    // 5. 天干生克（命局）
    const skMingJu = checkTianGanShengKeVsMingJu(ganZhi.gan as HeavenlyStem, sixLines, dayGan)
    for (const sk of skMingJu) {
      if (sk.type === '生') {
        tianGanRelations.push({
          type: '生',
          target: `${sk.pillar}${sk.gan}`,
          description: sk.description,
          isAuspicious: true,
          strength: sk.pillar === '日干' ? 4 : 2,
        })
      } else if (sk.type === '克') {
        tianGanRelations.push({
          type: '克',
          target: `${sk.pillar}${sk.gan}`,
          description: sk.description,
          isAuspicious: false,
          strength: sk.pillar === '日干' ? 5 : 3,
        })
      } else if (sk.type === '比和') {
        tianGanRelations.push({
          type: '比和',
          target: `${sk.pillar}${sk.gan}`,
          description: sk.description,
          isAuspicious: null,
          strength: sk.pillar === '日干' ? 2 : 1,
        })
      }
    }

    // 6. 天干与大运关系
    if (currentDaYun) {
      const dyGan = currentDaYun.ganZhi.gan as HeavenlyStem
      // 大运五合
      const dyWuHe = checkTianGanWuHeVsDaYun(ganZhi.gan as HeavenlyStem, dyGan)
      if (dyWuHe) {
        const dyHeHua = checkTianGanHeHua(ganZhi.gan as HeavenlyStem, dyGan, sixLines.month.zhi as EarthlyBranch, sixLines)
        tianGanRelations.push({
          type: dyHeHua.success ? '合化' : '五合',
          target: `大运天干${dyGan}`,
          description: `流年天干${ganZhi.gan}与大运天干${dyGan}${dyHeHua.success ? '合化' : '五合'}。${dyHeHua.reason}`,
          isAuspicious: dyHeHua.success ? true : null,
          strength: dyHeHua.success ? 5 : 3,
        })
      }
      // 大运生克
      const dyShengKe = checkTianGanShengKeVsDaYun(ganZhi.gan as HeavenlyStem, dyGan)
      if (dyShengKe) {
        tianGanRelations.push({
          type: dyShengKe.type as '生' | '克' | '比和',
          target: `大运天干${dyGan}`,
          description: dyShengKe.description,
          isAuspicious: dyShengKe.type === '生' ? true : dyShengKe.type === '克' ? false : null,
          strength: 4,
        })
      }
    }

    // ==================== 应期事件 ====================
    const yingQi = buildYingQi(year, ganZhi, vsMingJu, vsDaYun, dayZhi, dayGan, sixLines, tianGanRelations)

    const shenSha = checkLiuNianShenSha(ganZhi.zhi as EarthlyBranch, dayGan)

    // ==================== V3.3 综合评分 ====================
    const { score, jiXiong } = calculateLiuNianScore(ganShen, tianGanRelations, vsMingJu, vsDaYun, shenSha)

    // 生成摘要和详情（基于应期事件 + 天干关系 + 评分）
    let summary = ''
    let detail = ''

    if (yingQi.length > 0) {
      const topEvent = yingQi[0]
      summary = `${year}年为${ganShen}年，${topEvent.event}，${topEvent.intensity === '高' ? '变动较大' : '有变化'}。综合评分${score}分（${jiXiong}）。`
      detail = `${year}年为${ganShen}年，天干${ganZhi.gan}、地支${ganZhi.zhi}。`
      if (currentDaYun) {
        detail += `当前大运为${currentDaYun.ganZhi.gan}${currentDaYun.ganZhi.zhi}。`
      }
      detail += `\n综合评分：${score}分（${jiXiong}）。`
      detail += `\n\n天干互动：`
      if (tianGanRelations.length > 0) {
        for (const rel of tianGanRelations) {
          detail += `\n- ${rel.type}：${rel.description}${rel.isAuspicious === true ? '（吉）' : rel.isAuspicious === false ? '（凶）' : '（平）'}`
        }
      } else {
        detail += '\n流年天干与命局、大运无显著互动。'
      }
      detail += `\n\n本年度应期分析：`
      for (const yq of yingQi) {
        detail += `\n- ${yq.event}（${yq.intensity}）：${yq.reason}`
        detail += `\n  影响：${yq.implications.join('、')}`
      }
      if (vsDaYun.chong.length > 0 || vsDaYun.he.length > 0 || vsDaYun.fuYin.length > 0) {
        detail += `\n\n流年与大运关系：` + [...vsDaYun.chong, ...vsDaYun.he, ...vsDaYun.xing, ...vsDaYun.hai, ...vsDaYun.chuan, ...vsDaYun.po, ...vsDaYun.fuYin].join('、')
      }
      if (vsMingJu.chong.length > 0 || vsMingJu.he.length > 0) {
        detail += `\n\n流年与命局关系：` + [...vsMingJu.chong, ...vsMingJu.he, ...vsMingJu.xing, ...vsMingJu.hai, ...vsMingJu.chuan, ...vsMingJu.po].join('、')
      }
    } else {
      summary = `${year}年为${ganShen}年，运势平稳。综合评分${score}分（${jiXiong}）。`
      detail = `${year}年为${ganShen}年，天干${ganZhi.gan}、地支${ganZhi.zhi}。本年度无显著刑冲合害，运势相对平稳。综合评分${score}分（${jiXiong}）。`
      if (currentDaYun) {
        detail += `当前大运为${currentDaYun.ganZhi.gan}${currentDaYun.ganZhi.zhi}，流年与大运无冲合。`
      }
      if (tianGanRelations.length > 0) {
        detail += `\n\n天干互动：` + tianGanRelations.map(r => `${r.type}：${r.description}`).join('；')
      }
    }

    years.push({
      year,
      ganZhi,
      shenShi: {
        gan: ganShen,
        zhi: zhiShen,
      },
      vsMingJu,
      vsDaYun,
      tianGanRelations,
      yingQi,
      shenSha,
      score,
      jiXiong,
      summary,
      detail,
      isCurrentYear: year === currentYear,
    })
  }

  return {
    startYear,
    endYear: startYear + yearsCount - 1,
    years,
    currentYear,
  }
}
