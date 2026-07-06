import type { SixLines, HeavenlyStem, EarthlyBranch, GanZhi, FiveElement, ShenShi } from './types'
import { getStemElement, getStemYinYang, getBranchElement, getBranchIndex, EARTHLY_BRANCHES, HEAVENLY_STEMS } from '@/lib/core'

export interface LiuNianYear {
  year: number
  ganZhi: GanZhi
  shenShi: {
    gan: ShenShi
    zhi: ShenShi
  }
  chong: string[]
  he: string[]
  xing: string[]
  hai: string[]
  po: string[]
  shenSha: string[]
  score: number
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

const TIAN_GAN_WU_HE: [HeavenlyStem, HeavenlyStem][] = [
  ['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸'],
]

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

function checkHe(zhi: EarthlyBranch, sixLines: SixLines, yearGan: HeavenlyStem, dayGan: HeavenlyStem): string[] {
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
  for (const [a, b] of TIAN_GAN_WU_HE) {
    if (yearGan === a) {
      const pillarsGan = [
        { name: '年干', gan: sixLines.year.gan },
        { name: '月干', gan: sixLines.month.gan },
        { name: '日干', gan: sixLines.day.gan },
        { name: '时干', gan: sixLines.hour.gan },
      ]
      for (const p of pillarsGan) {
        if (p.gan === b) result.push(`天干合${p.name}`)
      }
    }
    if (yearGan === b) {
      const pillarsGan = [
        { name: '年干', gan: sixLines.year.gan },
        { name: '月干', gan: sixLines.month.gan },
        { name: '日干', gan: sixLines.day.gan },
        { name: '时干', gan: sixLines.hour.gan },
      ]
      for (const p of pillarsGan) {
        if (p.gan === a) result.push(`天干合${p.name}`)
      }
    }
  }
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
): LiuNianAnalysisResult {
  const shenShiMap = getAllShenShi(dayGan)
  const now = new Date()
  const currentYear = now.getFullYear()
  const years: LiuNianYear[] = []

  for (let i = 0; i < yearsCount; i++) {
    const year = startYear + i
    const ganZhi = getYearGanZhi(year)
    const ganShen = shenShiMap[ganZhi.gan as HeavenlyStem]
    const zhiMainGan = CANG_GAN_TABLE[ganZhi.zhi]?.ben || ganZhi.zhi
    const zhiShen = shenShiMap[zhiMainGan as HeavenlyStem]

    const chong = checkChong(ganZhi.zhi as EarthlyBranch, sixLines)
    const he = checkHe(ganZhi.zhi as EarthlyBranch, sixLines, ganZhi.gan as HeavenlyStem, dayGan)
    const xing = checkXing(ganZhi.zhi as EarthlyBranch, sixLines)
    const hai = checkHai(ganZhi.zhi as EarthlyBranch, sixLines)
    const po = checkPo(ganZhi.zhi as EarthlyBranch, sixLines)
    const shenSha = checkLiuNianShenSha(ganZhi.zhi as EarthlyBranch, dayGan)

    let score = 50
    const shenScoreMap: Record<ShenShi, number> = {
      比肩: 0, 劫财: -10, 食神: 15, 伤官: -5, 偏财: 10,
      正财: 15, 偏官: -10, 正官: 10, 偏印: 5, 正印: 15,
    }
    score += shenScoreMap[ganShen] || 0
    score += he.length * 5
    score -= chong.length * 10
    score -= xing.length * 8
    score -= hai.length * 5
    score -= po.length * 5
    score = Math.max(0, Math.min(100, score))

    const summaries = LIU_NIAN_SUMMARIES[ganShen] || LIU_NIAN_SUMMARIES.比肩
    const summary = summaries[i % summaries.length]
    const detail = LIU_NIAN_DETAILS[ganShen] || LIU_NIAN_DETAILS.比肩

    years.push({
      year,
      ganZhi,
      shenShi: {
        gan: ganShen,
        zhi: zhiShen,
      },
      chong,
      he,
      xing,
      hai,
      po,
      shenSha,
      score,
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
