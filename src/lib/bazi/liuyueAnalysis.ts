import type { SixLines, HeavenlyStem, EarthlyBranch, GanZhi, FiveElement, ShenShi } from './types'
import { getStemElement, getStemYinYang, getBranchElement, getBranchIndex, EARTHLY_BRANCHES, HEAVENLY_STEMS } from '@/lib/core'

export interface LiuYueMonth {
  monthIndex: number
  monthName: string
  ganZhi: GanZhi
  shenShi: {
    gan: ShenShi
    zhi: ShenShi
  }
  jiXiong: '大吉' | '吉' | '平' | '凶' | '大凶'
  score: number
  summary: string
  notice: string
  chong: string[]
  he: string[]
  xing: string[]
  hai: string[]
  po: string[]
}

export interface LiuYueAnalysisResult {
  year: number
  yearGanZhi: GanZhi
  months: LiuYueMonth[]
}

const MONTH_NAMES = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月'
]

const LIU_YUE_SUMMARIES: Record<ShenShi, string[]> = {
  比肩: ['朋友相助，事业平稳', '合作共赢，财运平稳', '人际和谐，诸事顺遂'],
  劫财: ['竞争激烈，注意理财', '小人作祟，谨慎行事', '破财风险，宜守不宜攻'],
  食神: ['福气满满，衣食无忧', '才华发挥，创意无限', '贵人相助，逢凶化吉'],
  伤官: ['才华横溢，口舌是非', '事业变动，机会挑战', '注意健康，防范官非'],
  偏财: ['意外之财，投资得利', '桃花运旺，人缘极佳', '财富波动，见好就收'],
  正财: ['财源稳定，事业上升', '努力付出，回报丰厚', '财运亨通，积累财富'],
  偏官: ['事业压力，挑战多多', '权力斗争，小人作祟', '化险为夷，成就非凡'],
  正官: ['事业顺遂，名利双收', '贵人提拔，步步高升', '官运亨通，地位提升'],
  偏印: ['思维活跃，灵感不断', '学习进修，技艺提升', '孤独感强，注意休息'],
  正印: ['学业有成，贵人多多', '事业稳定，名声远扬', '福气深厚，健康平安'],
}

const LIU_YUE_NOTICES: Record<ShenShi, string> = {
  比肩: '本月宜与朋友同事多交流，共同进步。但要注意财物往来，亲兄弟明算账，避免因财失义。',
  劫财: '本月竞争压力较大，需防小人暗算。不宜投资创业，不宜借钱给他人，守财为上。',
  食神: '本月心情愉悦，适合享受生活。可多陪伴家人，品尝美食，也适合学习新技能。',
  伤官: '本月才华得以展现，但容易得罪人。说话需谨慎，避免口舌是非，多做事少说话。',
  偏财: '本月偏财运佳，可适当投资。但切忌贪得无厌，见好就收，以免因贪变贫。',
  正财: '本月财运稳定，适合踏实工作。正财靠努力，付出必有回报，是积累财富的好时机。',
  偏官: '本月事业压力较大，需顶住压力。压力即是动力，熬过去必有后福，注意劳逸结合。',
  正官: '本月事业运旺，易得领导赏识。是升职加薪的好时机，要好好把握，主动争取。',
  偏印: '本月灵感丰富，适合学习研究。但容易失眠焦虑，需注意休息，多做放松运动。',
  正印: '本月贵人运旺，遇事有人帮。适合学习深造，提升自我，也适合修身养性。',
}

const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const LIU_HE: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

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

const YUE_JIAN_TABLE: Record<EarthlyBranch, EarthlyBranch> = {
  '寅': '寅', '卯': '卯', '辰': '辰', '巳': '巳', '午': '午', '未': '未',
  '申': '申', '酉': '酉', '戌': '戌', '亥': '亥', '子': '子', '丑': '丑',
}

function getYearMonthGanZhi(year: number, monthZhi: EarthlyBranch, yearGan: HeavenlyStem): GanZhi {
  const monthGanTable: Record<HeavenlyStem, EarthlyBranch[]> = {
    '甲': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '乙': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '丙': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '丁': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '戊': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '己': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '庚': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '辛': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '壬': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
    '癸': ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'],
  }

  const wuHeGanMap: Record<HeavenlyStem, HeavenlyStem> = {
    '甲': '丙', '乙': '戊', '丙': '庚', '丁': '壬', '戊': '甲',
    '己': '丙', '庚': '戊', '辛': '庚', '壬': '壬', '癸': '甲',
  }

  const firstMonthGan = wuHeGanMap[yearGan] || '甲'
  const firstMonthGanIndex = HEAVENLY_STEMS.indexOf(firstMonthGan)

  const monthZhiOrder: EarthlyBranch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  const monthZhiIndex = monthZhiOrder.indexOf(monthZhi)

  const monthGanIndex = (firstMonthGanIndex + monthZhiIndex) % 10
  const monthGan = HEAVENLY_STEMS[monthGanIndex]

  return buildGanZhi(monthGan, monthZhi)
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

function getJiXiong(score: number): '大吉' | '吉' | '平' | '凶' | '大凶' {
  if (score >= 80) return '大吉'
  if (score >= 65) return '吉'
  if (score >= 45) return '平'
  if (score >= 30) return '凶'
  return '大凶'
}

export function analyzeLiuYue(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  year: number,
): LiuYueAnalysisResult {
  const shenShiMap = getAllShenShi(dayGan)
  const yearGanZhi = getYearGanZhi(year)
  const months: LiuYueMonth[] = []

  const monthZhiOrder: EarthlyBranch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']

  for (let i = 0; i < 12; i++) {
    const monthZhi = monthZhiOrder[i]
    const monthGanZhi = getYearMonthGanZhi(year, monthZhi, yearGanZhi.gan as HeavenlyStem)
    const ganShen = shenShiMap[monthGanZhi.gan as HeavenlyStem]
    const zhiMainGan = CANG_GAN_TABLE[monthGanZhi.zhi]?.ben || monthGanZhi.zhi
    const zhiShen = shenShiMap[zhiMainGan as HeavenlyStem]

    const chong = checkChong(monthGanZhi.zhi as EarthlyBranch, sixLines)
    const he = checkHe(monthGanZhi.zhi as EarthlyBranch, sixLines)
    const xing = checkXing(monthGanZhi.zhi as EarthlyBranch, sixLines)
    const hai = checkHai(monthGanZhi.zhi as EarthlyBranch, sixLines)
    const po = checkPo(monthGanZhi.zhi as EarthlyBranch, sixLines)

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

    const summaries = LIU_YUE_SUMMARIES[ganShen] || LIU_YUE_SUMMARIES.比肩
    const summary = summaries[i % summaries.length]
    const notice = LIU_YUE_NOTICES[ganShen] || LIU_YUE_NOTICES.比肩

    months.push({
      monthIndex: i + 1,
      monthName: MONTH_NAMES[i],
      ganZhi: monthGanZhi,
      shenShi: {
        gan: ganShen,
        zhi: zhiShen,
      },
      jiXiong: getJiXiong(score),
      score,
      summary,
      notice,
      chong,
      he,
      xing,
      hai,
      po,
    })
  }

  return {
    year,
    yearGanZhi,
    months,
  }
}
