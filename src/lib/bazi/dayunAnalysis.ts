import type { SixLines, HeavenlyStem, EarthlyBranch, GanZhi, FiveElement, ShenShi, WuXingWangShuai } from './types'
import { generateDaYun, calcDaYunStart, type DaYunStep, type QiYunResult } from './rules/dashunRules'
import { getStemElement, getStemYinYang, getBranchElement, WANG_SHUAI_TABLE } from '@/lib/core'

export interface DaYunAnalysisStep {
  index: number
  ganZhi: GanZhi
  startAge: number
  endAge: number
  startYear: number
  endYear: number
  startDate: Date
  shenShi: {
    gan: ShenShi
    zhi: ShenShi
  }
  wangShuai: WuXingWangShuai
  isXi: boolean
  isJi: boolean
  score: number
  summary: string
  detail: string
  // 应期分析
  yingQiYears: { year: number; ganZhi: string; event: string; intensity: '高' | '中' | '低' }[]
  // 大运与命局关系
  vsMingJu: {
    chong: string[]
    he: string[]
    xing: string[]
    hai: string[]
  }
}

export interface DaYunAnalysisResult {
  qiYun: QiYunResult
  steps: DaYunAnalysisStep[]
  currentStepIndex: number
  totalSteps: number
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

function getAllShenShi(dayGan: HeavenlyStem): Record<HeavenlyStem, ShenShi> {
  const dayElement = getStemElement(dayGan)
  const dayYinYang = getStemYinYang(dayGan)
  const stems: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
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

function getShenShiFromGan(dayGan: HeavenlyStem, targetGan: HeavenlyStem): ShenShi {
  const allMap = getAllShenShi(dayGan)
  return allMap[targetGan]
}

const DAYUN_SUMMARIES: Record<ShenShi, string[]> = {
  比肩: ['比肩运，朋友相助，事业平稳', '比劫争财，注意破财', '兄弟同心，其利断金'],
  劫财: ['劫财运，竞争激烈，注意小人', '破财风险，不宜投资', '合作需谨慎'],
  食神: ['食神运，福气满满，衣食无忧', '才华发挥，创意无限', '贵人相助，逢凶化吉'],
  伤官: ['伤官运，才华横溢，口舌是非', '事业变动，创业机会', '注意健康，防官非'],
  偏财: ['偏财运，意外之财，投资得利', '桃花运旺，人缘好', '财富波动，见好就收'],
  正财: ['正财运，财源稳定，事业上升', '努力付出，回报丰厚', '财运亨通，家业兴旺'],
  偏官: ['偏官运，事业压力大，挑战多', '权力斗争，小人作祟', '化险为夷，成就非凡'],
  正官: ['正官运，事业顺遂，名利双收', '贵人提拔，步步高升', '官运亨通，地位提升'],
  偏印: ['偏印运，思维活跃，灵感多', '学习进修，技艺提升', '孤独感强，注意休息'],
  正印: ['正印运，学业有成，贵人多', '事业稳定，名声好', '福气深厚，健康平安'],
}

// 大运与命局刑冲合害
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

function checkChong(zhi: EarthlyBranch, mingZhis: EarthlyBranch[]): string[] {
  const result: string[] = []
  for (const [a, b] of LIU_CHONG) {
    if (zhi === a && mingZhis.includes(b)) result.push(`冲${b}`)
    if (zhi === b && mingZhis.includes(a)) result.push(`冲${a}`)
  }
  return result
}

function checkHe(zhi: EarthlyBranch, mingZhis: EarthlyBranch[]): string[] {
  const result: string[] = []
  for (const [a, b] of LIU_HE) {
    if (zhi === a && mingZhis.includes(b)) result.push(`合${b}`)
    if (zhi === b && mingZhis.includes(a)) result.push(`合${a}`)
  }
  return result
}

function checkXing(zhi: EarthlyBranch, mingZhis: EarthlyBranch[]): string[] {
  const result: string[] = []
  for (const combo of SAN_XING) {
    if (combo.includes(zhi)) {
      const count = combo.filter(z => z === zhi || mingZhis.includes(z)).length
      if (count >= 2) result.push('三刑')
    }
  }
  return result
}

function checkHai(zhi: EarthlyBranch, mingZhis: EarthlyBranch[]): string[] {
  const result: string[] = []
  for (const [a, b] of LIU_HAI) {
    if (zhi === a && mingZhis.includes(b)) result.push(`害${b}`)
    if (zhi === b && mingZhis.includes(a)) result.push(`害${a}`)
  }
  return result
}

// 应期分析：找出大运中冲太岁、合太岁等关键年份
function analyzeYingQi(
  startYear: number,
  endYear: number,
  dayZhi: EarthlyBranch,
  stepGanZhi: GanZhi,
): { year: number; ganZhi: string; event: string; intensity: '高' | '中' | '低' }[] {
  const yingQi: { year: number; ganZhi: string; event: string; intensity: '高' | '中' | '低' }[] = []
  for (let y = startYear; y <= endYear; y++) {
    const yearGanZhi = getYearGanZhi(y)
    const gzStr = `${yearGanZhi.gan}${yearGanZhi.zhi}`

    // 冲太岁（流年支冲日支）
    for (const [a, b] of LIU_CHONG) {
      if ((yearGanZhi.zhi === a && dayZhi === b) || (yearGanZhi.zhi === b && dayZhi === a)) {
        yingQi.push({ year: y, ganZhi: gzStr, event: '冲太岁（日支逢冲）', intensity: '高' })
      }
    }
    // 合太岁（流年支合日支）
    for (const [a, b] of LIU_HE) {
      if ((yearGanZhi.zhi === a && dayZhi === b) || (yearGanZhi.zhi === b && dayZhi === a)) {
        yingQi.push({ year: y, ganZhi: gzStr, event: '合太岁（日支逢合）', intensity: '中' })
      }
    }
    // 大运天干与流年天干相同（伏吟）
    if (stepGanZhi.gan === yearGanZhi.gan) {
      yingQi.push({ year: y, ganZhi: gzStr, event: '天干伏吟', intensity: '中' })
    }
    // 大运地支与流年地支相同（伏吟）
    if (stepGanZhi.zhi === yearGanZhi.zhi) {
      yingQi.push({ year: y, ganZhi: gzStr, event: '地支伏吟', intensity: '中' })
    }
  }
  // 去重（同年多事件取最高强度）
  const yearMap = new Map<number, { year: number; ganZhi: string; event: string; intensity: '高' | '中' | '低' }>()
  for (const yq of yingQi) {
    const existing = yearMap.get(yq.year)
    if (!existing || (yq.intensity === '高' && existing.intensity !== '高') || (yq.intensity === '中' && existing.intensity === '低')) {
      yearMap.set(yq.year, yq)
    }
  }
  return Array.from(yearMap.values()).sort((a, b) => a.year - b.year)
}

function getYearGanZhi(year: number): { gan: HeavenlyStem; zhi: EarthlyBranch } {
  const stems: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const branches: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const stemIndex = ((year - 4) % 10 + 10) % 10
  const branchIndex = ((year - 4) % 12 + 12) % 12
  return {
    gan: stems[stemIndex],
    zhi: branches[branchIndex],
  }
}

const DAYUN_DETAILS: Record<ShenShi, string> = {
  比肩: '此十年为比肩运，命主自我意识增强，有主见，做事有担当。朋友缘好，易得同辈相助，但也易因朋友之事破财。事业上竞争较大，需靠实力取胜。感情中易有竞争者出现，需多加注意。财运平稳，不宜大笔投资，宜守不宜攻。',
  劫财: '此十年为劫财运，命主竞争意识强烈，凡事都要争个高低。事业上竞争激烈，小人较多，易有口舌是非。财运起伏大，易有破财之事发生，不宜投资创业，不宜借钱给他人。感情中易有第三者插足，需用心经营。',
  食神: '此十年为食神运，命主福气深厚，衣食无忧。才华得以发挥，创意灵感不断，适合从事艺术、创作类工作。贵人运旺，遇事总能逢凶化吉。财运稳定，收入可观。感情美满，家庭和睦。健康状况良好，心情愉悦。',
  伤官: '此十年为伤官运，命主才华横溢，聪明过人，但也易恃才傲物，得罪他人。事业上多变动，有创业机会，但也易因冲动而失败。注意口舌是非，防官非诉讼。感情中易有波折，需多沟通理解。',
  偏财: '此十年为偏财运，命主偏财运旺，易得意外之财，投资、博彩皆有斩获。人缘好，桃花运旺盛，异性缘佳。但财运起伏较大，来的快去的也快，需注意理财，见好就收。事业上有贵人相助，机会多多。',
  正财: '此十年为正财运，命主财运亨通，财源稳定。事业蒸蒸日上，努力付出必有丰厚回报。正财代表正当收入，适合踏实工作，稳步发展。感情稳定，家庭美满。此运是积累财富的好时机，宜储蓄、置产。',
  偏官: '此十年为偏官运，命主事业心强，有冲劲，敢于挑战。事业上压力较大，竞争激烈，但也易在压力中脱颖而出。权力斗争频繁，需防小人暗算。若能化险为夷，必能成就非凡。注意身体健康，劳逸结合。',
  正官: '此十年为正官运，命主官运亨通，事业顺遂。易得贵人提拔，步步高升。正官代表正统、规矩，适合在政府、国企、大公司发展。名声好，受人尊重。感情稳定，婚姻美满。此运是事业发展的黄金期。',
  偏印: '此十年为偏印运，命主思维活跃，灵感不断。适合学习进修，提升技艺。但偏印也主孤独，此运中人缘稍差，知心朋友少。事业上适合从事研究、技术、玄学类工作。注意休息，避免过度思虑。',
  正印: '此十年为正印运，命主学业有成，智慧大开。贵人运极旺，总能得到长辈、上司的赏识和帮助。事业稳定发展，名声远扬。福气深厚，健康平安。正印代表文化、教育，适合从事教育、文化、公职类工作。',
}

export function analyzeDaYun(
  sixLines: SixLines,
  birthDate: Date,
  dayGan: HeavenlyStem,
  gender: 'male' | 'female',
  xiYongShen: FiveElement[],
  jiShen: FiveElement[],
): DaYunAnalysisResult {
  const monthZhi = sixLines.month.zhi as EarthlyBranch
  const qiYun = calcDaYunStart(birthDate, dayGan, gender)
  const rawSteps = generateDaYun(birthDate, dayGan, gender, monthZhi, 8)

  const shenShiMap = getAllShenShi(dayGan)
  const monthElement = getBranchElement(monthZhi)
  const now = new Date()
  const currentAge = now.getFullYear() - birthDate.getFullYear()

  const mingZhis = [
    sixLines.year.zhi as EarthlyBranch,
    sixLines.month.zhi as EarthlyBranch,
    sixLines.day.zhi as EarthlyBranch,
    sixLines.hour.zhi as EarthlyBranch,
  ]
  const dayZhi = sixLines.day.zhi as EarthlyBranch

  let currentStepIndex = -1
  const steps: DaYunAnalysisStep[] = rawSteps.map((step, idx) => {
    const ganShen = shenShiMap[step.ganZhi.gan as HeavenlyStem]
    const zhiMainGan = CANG_GAN_TABLE[step.ganZhi.zhi]?.ben || step.ganZhi.zhi
    const zhiShen = shenShiMap[zhiMainGan as HeavenlyStem]

    const zhiElement = getBranchElement(step.ganZhi.zhi as EarthlyBranch)
    const wangShuai = WANG_SHUAI_TABLE[monthElement][zhiElement] as WuXingWangShuai

    const ganElement = getStemElement(step.ganZhi.gan as HeavenlyStem)
    const isXi = xiYongShen.includes(ganElement) || xiYongShen.includes(zhiElement)
    const isJi = jiShen.includes(ganElement) || jiShen.includes(zhiElement)

    let score = 50
    const wangScoreMap: Record<WuXingWangShuai, number> = { '旺': 20, '相': 10, '休': 0, '囚': -10, '死': -20 }
    score += wangScoreMap[wangShuai] || 0
    if (isXi) score += 20
    if (isJi) score -= 20
    score = Math.max(0, Math.min(100, score))

    const summaries = DAYUN_SUMMARIES[ganShen] || DAYUN_SUMMARIES.比肩
    const summary = summaries[idx % summaries.length]
    const detail = DAYUN_DETAILS[ganShen] || DAYUN_DETAILS.比肩

    // 大运与命局关系
    const stepZhi = step.ganZhi.zhi as EarthlyBranch
    const vsMingJu = {
      chong: checkChong(stepZhi, mingZhis),
      he: checkHe(stepZhi, mingZhis),
      xing: checkXing(stepZhi, mingZhis),
      hai: checkHai(stepZhi, mingZhis),
    }

    // 应期分析
    const yingQiYears = analyzeYingQi(step.startYear, step.endYear, dayZhi, step.ganZhi)

    if (currentAge >= step.startAge && currentAge < step.endAge) {
      currentStepIndex = idx
    }

    return {
      index: step.index,
      ganZhi: step.ganZhi,
      startAge: step.startAge,
      endAge: step.endAge,
      startYear: step.startYear,
      endYear: step.endYear,
      startDate: step.startDate,
      shenShi: {
        gan: ganShen,
        zhi: zhiShen,
      },
      wangShuai,
      isXi,
      isJi,
      score,
      summary,
      detail,
      yingQiYears,
      vsMingJu,
    }
  })

  return {
    qiYun,
    steps,
    currentStepIndex,
    totalSteps: steps.length,
  }
}
