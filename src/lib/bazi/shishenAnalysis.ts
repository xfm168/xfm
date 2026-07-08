import type { SixLines, HeavenlyStem, EarthlyBranch, ShenShi, FiveElement, CangGan } from './types'
import { getShenShiPowers, getAllShenShi, SHISHEN_COMBINATION_RULES } from './rules/shishenRules'
import type { ShenShiPower, ShenShiCombination } from './rules/shishenRules'

export type { ShenShiPower, ShenShiCombination }

export interface ShenShiDetail {
  name: ShenShi
  power: number
  touGan: boolean
  touGanCount: number
  deLing: boolean
  deDi: boolean
  youGen: boolean
  shouZhi: boolean
  position: string[]
}

export interface ShenShiShengKeLink {
  from: ShenShi
  to: ShenShi
  type: '生' | '克'
  strength: number
  description: string
}

export interface ShenShiAnalysisResult {
  details: ShenShiDetail[]
  sortedByPower: ShenShi[]
  dominantShenShi: ShenShi[]
  // 十神主次分类
  primaryShenShi: ShenShi[]   // 主导十神
  secondaryShenShi: ShenShi[] // 辅助十神
  tertiaryShenShi: ShenShi[]  // 次要十神
  // 十神力量星级
  starRatings: Record<ShenShi, string>
  personality: string
  personalityTraits: string[]
  careerTendency: string
  careerSuggestions: string[]
  relationshipTraits: string
  relationshipStrengths: string[]
  relationshipChallenges: string[]
  combinations: ShenShiCombination[]
  shengKeLinks: ShenShiShengKeLink[] // 十神生克链
  shengKeAnalysis: string // 生克链完整分析文本
}

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const CANG_GAN_TABLE: Record<EarthlyBranch, CangGan> = {
  '子': { ben: '癸', zhong: null, yao: null },
  '丑': { ben: '己', zhong: '辛', yao: '癸' },
  '寅': { ben: '甲', zhong: '丙', yao: '戊' },
  '卯': { ben: '乙', zhong: null, yao: null },
  '辰': { ben: '戊', zhong: '乙', yao: '癸' },
  '巳': { ben: '丙', zhong: '庚', yao: '戊' },
  '午': { ben: '丁', zhong: '己', yao: null },
  '未': { ben: '己', zhong: '丁', yao: '乙' },
  '申': { ben: '庚', zhong: '壬', yao: '戊' },
  '酉': { ben: '辛', zhong: null, yao: null },
  '戌': { ben: '戊', zhong: '辛', yao: '丁' },
  '亥': { ben: '壬', zhong: '甲', yao: null },
}

const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

const BRANCH_MAIN_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水',
  '辰': '土', '丑': '土', '未': '土', '戌': '土',
}

const GENERATE: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

const SHENSHI_PERSONALITY: Record<ShenShi, { traits: string[]; positive: string; negative: string }> = {
  '比肩': {
    traits: ['独立自主', '刚强自信', '重情重义', '争强好胜', '自尊心强'],
    positive: '有主见，不随波逐流，做事有担当',
    negative: '刚愎自用，易与人冲突，独断专行',
  },
  '劫财': {
    traits: ['积极进取', '善于交际', '慷慨大方', '好胜心强', '敢于冒险'],
    positive: '有开拓精神，人脉广，行动力强',
    negative: '花钱大手大脚，易因朋友破财',
  },
  '食神': {
    traits: ['温和宽厚', '聪明睿智', '品味高雅', '乐观开朗', '享受生活'],
    positive: '有口福，有才华，人缘好，长寿',
    negative: '贪图享乐，缺乏进取心，懒散',
  },
  '伤官': {
    traits: ['才华横溢', '思维敏捷', '口才出众', '叛逆创新', '自信张扬'],
    positive: '创造力强，适合艺术创作，表现力强',
    negative: '傲慢任性，得罪人多，不守规矩',
  },
  '偏财': {
    traits: ['善于理财', '商业头脑', '慷慨大方', '人缘好', '把握机会'],
    positive: '财运佳，善于投资，商业嗅觉敏锐',
    negative: '财来财去，不稳定，好投机',
  },
  '正财': {
    traits: ['踏实肯干', '勤俭持家', '诚实守信', '稳重可靠', '务实'],
    positive: '财运稳定，适合正途求财，家庭责任感强',
    negative: '过于保守，缺乏冒险精神，小气',
  },
  '偏官': {
    traits: ['有魄力', '胆识过人', '果断坚决', '叛逆好斗', '权力欲强'],
    positive: '适合军政执法，有领导才能，执行力强',
    negative: '脾气暴躁，易招灾祸，压力大',
  },
  '正官': {
    traits: ['品行端正', '责任心强', '诚实守信', '守规矩', '重视名誉'],
    positive: '适合公职管理，社会地位高，受人尊敬',
    negative: '过于保守，墨守成规，缺乏灵活性',
  },
  '偏印': {
    traits: ['思维独特', '灵感丰富', '内省深刻', '孤独内省', '求知欲强'],
    positive: '适合研究玄学，有特殊天赋，直觉敏锐',
    negative: '孤僻多疑，与家人不和，想法偏激',
  },
  '正印': {
    traits: ['学识渊博', '品德高尚', '仁慈善良', '稳重踏实', '乐于助人'],
    positive: '学业有成，贵人相助，事业稳定',
    negative: '依赖性强，缺乏主见，过于老实',
  },
}

const SHENSHI_CAREER: Record<ShenShi, string[]> = {
  '比肩': ['自主创业', '自由职业', '合伙人', '体育竞技', '销售业务'],
  '劫财': ['金融投资', '销售业务', '创业开拓', '公关社交', '市场营销'],
  '食神': ['餐饮美食', '教育培训', '文化艺术', '科研技术', '医药健康'],
  '伤官': ['艺术创作', '表演娱乐', '律师咨询', '市场营销', '产品设计'],
  '偏财': ['金融投资', '国际贸易', '房地产', '创业', '中介服务'],
  '正财': ['财务管理', '会计审计', '商业运营', '实业经营', '银行业务'],
  '偏官': ['军警政法', '企业管理', '创业', '工程建设', '体育竞技'],
  '正官': ['政府公职', '企业管理', '法律事务', '行政管理', '教育管理'],
  '偏印': ['玄学命理', '科研创新', '设计创意', '心理咨询', '文化研究'],
  '正印': ['教育学术', '文化出版', '医疗健康', '行政管理', '咨询顾问'],
}

const SHENSHI_RELATIONSHIP: Record<ShenShi, { strengths: string[]; challenges: string[] }> = {
  '比肩': {
    strengths: ['重情重义', '有担当', '能与伴侣共患难'],
    challenges: ['好胜心强', '易争执', '不够体贴'],
  },
  '劫财': {
    strengths: ['热情主动', '善于表达', '懂得浪漫'],
    challenges: ['花钱大手', '异性缘太好', '易有桃花纠纷'],
  },
  '食神': {
    strengths: ['温柔体贴', '懂得享受生活', '有口福'],
    challenges: ['懒散', '过于追求享受', '缺乏激情'],
  },
  '伤官': {
    strengths: ['浪漫多情', '有才华', '生活有情趣'],
    challenges: ['感情不稳定', '挑剔', '易有婚外情'],
  },
  '偏财': {
    strengths: ['慷慨大方', '懂得制造惊喜', '物质条件好'],
    challenges: ['感情不稳定', '异性缘复杂', '不够专一'],
  },
  '正财': {
    strengths: ['踏实可靠', '有家庭责任感', '理财能力强'],
    challenges: ['不够浪漫', '过于务实', '缺乏情趣'],
  },
  '偏官': {
    strengths: ['有担当', '保护欲强', '有魄力'],
    challenges: ['脾气暴躁', '控制欲强', '易有冲突'],
  },
  '正官': {
    strengths: ['品行端正', '责任感强', '家庭观念重'],
    challenges: ['过于严肃', '缺乏浪漫', '生活单调'],
  },
  '偏印': {
    strengths: ['思维细腻', '懂得关心', '精神共鸣强'],
    challenges: ['孤僻多疑', '不善表达', '易生误会'],
  },
  '正印': {
    strengths: ['包容体贴', '有爱心', '家庭和谐'],
    challenges: ['过于溺爱', '依赖心重', '缺乏主见'],
  },
}

function getShenShiFromGan(dayGan: HeavenlyStem, targetGan: HeavenlyStem): ShenShi {
  const allMap = getAllShenShi(dayGan) as Record<HeavenlyStem, ShenShi>
  return allMap[targetGan]
}

function buildCangGanData(sixLines: SixLines): Record<EarthlyBranch, CangGan> {
  const result = {} as Record<EarthlyBranch, CangGan>
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    result[pillar.zhi] = CANG_GAN_TABLE[pillar.zhi]
  }
  return result
}

function checkDeLing(shen: ShenShi, sixLines: SixLines, dayGan: HeavenlyStem): boolean {
  const monthZhi = sixLines.month.zhi
  const monthMainGan = CANG_GAN_TABLE[monthZhi].ben
  const monthShen = getShenShiFromGan(dayGan, monthMainGan)
  return monthShen === shen
}

function checkDeDi(shen: ShenShi, sixLines: SixLines, dayGan: HeavenlyStem): number {
  let count = 0
  const pillars = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]
  for (const pillar of pillars) {
    const cangGan = CANG_GAN_TABLE[pillar.zhi]
    if (getShenShiFromGan(dayGan, cangGan.ben) === shen) {
      count++
    }
    if (cangGan.zhong && getShenShiFromGan(dayGan, cangGan.zhong) === shen) {
      count++
    }
    if (cangGan.yao && getShenShiFromGan(dayGan, cangGan.yao) === shen) {
      count++
    }
  }
  return count
}

function checkYouGen(shen: ShenShi, sixLines: SixLines, dayGan: HeavenlyStem): boolean {
  const shenElement = getShenShiElement(shen, dayGan)
  const pillars = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]
  for (const pillar of pillars) {
    if (BRANCH_MAIN_ELEMENT[pillar.zhi] === shenElement) {
      return true
    }
  }
  return false
}

function getShenShiElement(shen: ShenShi, dayGan: HeavenlyStem): FiveElement {
  const dayElement = STEM_ELEMENT[dayGan]
  const dayYinYang = STEMS.indexOf(dayGan) % 2 === 0 ? '阳' : '阴'

  const mapping: Record<ShenShi, { element: FiveElement; yinYang: 'same' | 'diff' }> = {
    '比肩': { element: dayElement, yinYang: 'same' },
    '劫财': { element: dayElement, yinYang: 'diff' },
    '食神': { element: GENERATE[dayElement], yinYang: 'same' },
    '伤官': { element: GENERATE[dayElement], yinYang: 'diff' },
    '偏财': { element: OVERCOME[dayElement], yinYang: 'same' },
    '正财': { element: OVERCOME[dayElement], yinYang: 'diff' },
    '偏官': { element: getOvercomer(dayElement), yinYang: 'same' },
    '正官': { element: getOvercomer(dayElement), yinYang: 'diff' },
    '偏印': { element: getGenerator(dayElement), yinYang: 'same' },
    '正印': { element: getGenerator(dayElement), yinYang: 'diff' },
  }

  return mapping[shen].element
}

function getOvercomer(el: FiveElement): FiveElement {
  for (const [k, v] of Object.entries(OVERCOME)) {
    if (v === el) return k as FiveElement
  }
  return '土'
}

function getGenerator(el: FiveElement): FiveElement {
  for (const [k, v] of Object.entries(GENERATE)) {
    if (v === el) return k as FiveElement
  }
  return '水'
}

function checkShouZhi(shen: ShenShi, sixLines: SixLines, dayGan: HeavenlyStem): boolean {
  const shenElement = getShenShiElement(shen, dayGan)
  const overcomer = getOvercomer(shenElement)
  const pillars = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]
  let overcomerCount = 0
  for (const pillar of pillars) {
    if (STEM_ELEMENT[pillar.gan] === overcomer) {
      overcomerCount++
    }
    if (BRANCH_MAIN_ELEMENT[pillar.zhi] === overcomer) {
      overcomerCount++
    }
  }
  return overcomerCount >= 2
}

function getPositions(shen: ShenShi, sixLines: SixLines, dayGan: HeavenlyStem): string[] {
  const positions: string[] = []
  const pillarNames: { key: string; pillar: typeof sixLines.year }[] = [
    { key: '年干', pillar: sixLines.year },
    { key: '月干', pillar: sixLines.month },
    { key: '日干', pillar: sixLines.day },
    { key: '时干', pillar: sixLines.hour },
  ]
  for (const { key, pillar } of pillarNames) {
    if (getShenShiFromGan(dayGan, pillar.gan) === shen) {
      positions.push(key)
    }
  }
  const zhiPillars: { key: string; zhi: EarthlyBranch }[] = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '日支', zhi: sixLines.day.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]
  for (const { key, zhi } of zhiPillars) {
    const cangGan = CANG_GAN_TABLE[zhi]
    if (getShenShiFromGan(dayGan, cangGan.ben) === shen) {
      positions.push(key + '(本气)')
    }
  }
  return positions
}

export function analyzeShenShi(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  gender: string,
): ShenShiAnalysisResult {
  const cangGanData = buildCangGanData(sixLines)
  const powers = getShenShiPowers(sixLines, dayGan, cangGanData as any) as Record<ShenShi, ShenShiPower>

  const allShenShi: ShenShi[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '偏官', '正官', '偏印', '正印']

  const details: ShenShiDetail[] = allShenShi.map(shen => {
    const power = powers[shen] || { count: 0, touGan: 0, cangGan: 0, power: 0 }
    return {
      name: shen,
      power: power.power,
      touGan: power.touGan > 0,
      touGanCount: power.touGan,
      deLing: checkDeLing(shen, sixLines, dayGan),
      deDi: checkDeDi(shen, sixLines, dayGan) > 0,
      youGen: checkYouGen(shen, sixLines, dayGan),
      shouZhi: checkShouZhi(shen, sixLines, dayGan),
      position: getPositions(shen, sixLines, dayGan),
    }
  })

  const sortedByPower = [...details]
    .sort((a, b) => b.power - a.power)
    .filter(d => d.power > 0)
    .map(d => d.name)

  const maxPower = Math.max(...details.map(d => d.power))
  const dominantShenShi = details
    .filter(d => d.power > 0 && d.power >= maxPower * 0.6)
    .sort((a, b) => b.power - a.power)
    .map(d => d.name)

  const topShen = sortedByPower[0] || '正印'
  const secondShen = sortedByPower[1]

  const personalityTraits = SHENSHI_PERSONALITY[topShen].traits.slice(0, 3)
  if (secondShen) {
    personalityTraits.push(...SHENSHI_PERSONALITY[secondShen].traits.slice(0, 2))
  }

  const personality = generatePersonality(sortedByPower)
  const careerTendency = generateCareer(sortedByPower)
  const careerSuggestions = generateCareerSuggestions(sortedByPower)
  const relationshipTraits = generateRelationship(sortedByPower, gender)
  const relationshipStrengths = SHENSHI_PERSONALITY[topShen].positive.split('，').slice(0, 3)
  const relationshipChallenges = SHENSHI_PERSONALITY[topShen].negative.split('，').slice(0, 3)

  const combinations = analyzeCombinations(sixLines, dayGan, cangGanData, powers)
  const shengKeLinks = analyzeShengKeLinks(sortedByPower, details)
  const shengKeAnalysis = generateShengKeAnalysis(shengKeLinks, sortedByPower)

  // 十神力量星级
  const maxPowerVal = Math.max(...details.map(d => d.power), 1)
  const starRatings: Record<ShenShi, string> = {} as Record<ShenShi, string>
  for (const d of details) {
    const ratio = d.power / maxPowerVal
    if (ratio >= 0.9) starRatings[d.name] = '★★★★★'
    else if (ratio >= 0.7) starRatings[d.name] = '★★★★☆'
    else if (ratio >= 0.5) starRatings[d.name] = '★★★☆☆'
    else if (ratio >= 0.3) starRatings[d.name] = '★★☆☆☆'
    else if (ratio > 0) starRatings[d.name] = '★☆☆☆☆'
    else starRatings[d.name] = '☆☆☆☆☆'
  }

  // 十神主次分类
  const primaryShenShi = sortedByPower.slice(0, 2)
  const secondaryShenShi = sortedByPower.slice(2, 5)
  const tertiaryShenShi = sortedByPower.slice(5)

  return {
    details,
    sortedByPower,
    dominantShenShi: dominantShenShi.length > 0 ? dominantShenShi : [topShen],
    primaryShenShi,
    secondaryShenShi,
    tertiaryShenShi,
    starRatings,
    personality,
    personalityTraits,
    careerTendency,
    careerSuggestions,
    relationshipTraits,
    relationshipStrengths,
    relationshipChallenges,
    combinations,
    shengKeLinks,
    shengKeAnalysis,
  }
}

function generatePersonality(sorted: ShenShi[]): string {
  if (sorted.length === 0) return '八字平和，性格中庸。'

  const top = sorted[0]
  const p = SHENSHI_PERSONALITY[top]
  let result = `命局以${top}为主导，${p.positive}。`

  if (sorted.length > 1) {
    const second = sorted[1]
    const p2 = SHENSHI_PERSONALITY[second]
    result += `兼带${second}之气，${p2.positive.split('，')[0]}。`
  }

  result += `不足之处：${p.negative}。`

  return result
}

function generateCareer(sorted: ShenShi[]): string {
  if (sorted.length === 0) return '适合多种行业，需结合具体格局判断。'

  const careers = new Set<string>()
  for (const shen of sorted.slice(0, 3)) {
    SHENSHI_CAREER[shen].slice(0, 2).forEach(c => careers.add(c))
  }
  return `适合方向：${Array.from(careers).slice(0, 5).join('、')}。`
}

function generateCareerSuggestions(sorted: ShenShi[]): string[] {
  const suggestions: string[] = []
  for (const shen of sorted.slice(0, 3)) {
    suggestions.push(...SHENSHI_CAREER[shen].slice(0, 2))
  }
  return [...new Set(suggestions)].slice(0, 6)
}

function generateRelationship(sorted: ShenShi[], gender: string): string {
  if (sorted.length === 0) return '感情生活平稳，无大起大落。'

  const top = sorted[0]
  const r = SHENSHI_RELATIONSHIP[top]
  const pronoun = gender === 'male' ? '他' : '她'
  return `在感情中，${pronoun}${r.strengths[0]}，${r.strengths[1]}。但需注意${r.challenges[0]}，${r.challenges[1]}。`
}

// 十神生克链分析
function analyzeShengKeLinks(
  sorted: ShenShi[],
  details: ShenShiDetail[],
): ShenShiShengKeLink[] {
  const links: ShenShiShengKeLink[] = []
  const powerMap = new Map<ShenShi, number>()
  for (const d of details) powerMap.set(d.name, d.power)

  const SHENG_MAP: Record<ShenShi, ShenShi[]> = {
    '比肩': ['食神', '伤官'],
    '劫财': ['食神', '伤官'],
    '食神': ['偏财', '正财'],
    '伤官': ['偏财', '正财'],
    '偏财': ['正官', '偏官'],
    '正财': ['正官', '偏官'],
    '偏官': ['正印', '偏印'],
    '正官': ['正印', '偏印'],
    '偏印': ['比肩', '劫财'],
    '正印': ['比肩', '劫财'],
  }

  const KE_MAP: Record<ShenShi, ShenShi[]> = {
    '比肩': ['偏财', '正财'],
    '劫财': ['偏财', '正财'],
    '食神': ['偏官', '正官'],
    '伤官': ['偏官', '正官'],
    '偏财': ['正印', '偏印'],
    '正财': ['正印', '偏印'],
    '偏官': ['比肩', '劫财'],
    '正官': ['比肩', '劫财'],
    '偏印': ['食神', '伤官'],
    '正印': ['食神', '伤官'],
  }

  const SHENG_DESC: Record<string, string> = {
    '比劫生食伤': '才华泄秀，创造力强',
    '食伤生财': '财源有源，求财有道',
    '财生官杀': '财官相生，贵气流通',
    '官杀生印': '杀印相生，化煞为权',
    '印生比劫': '比劫有根，自身有力',
  }

  for (const shen of sorted.slice(0, 5)) {
    const fromPower = powerMap.get(shen) || 0
    if (fromPower <= 0) continue

    // 生链
    for (const target of SHENG_MAP[shen]) {
      const toPower = powerMap.get(target) || 0
      if (toPower > 0) {
        const key = `${shen}生${target}`
        const groupKey = `${shen.includes('比肩') || shen.includes('劫财') ? '比劫' : shen.includes('食神') || shen.includes('伤官') ? '食伤' : shen.includes('偏财') || shen.includes('正财') ? '财' : shen.includes('偏官') || shen.includes('正官') ? '官杀' : '印'}生${target.includes('食神') || target.includes('伤官') ? '食伤' : target.includes('偏财') || target.includes('正财') ? '财' : target.includes('偏官') || target.includes('正官') ? '官杀' : target.includes('偏印') || target.includes('正印') ? '印' : '比劫'}`
        links.push({
          from: shen,
          to: target,
          type: '生',
          strength: Math.min(100, Math.round((fromPower + toPower) / 2)),
          description: SHENG_DESC[groupKey] || `${shen}生${target}，力量流通`,
        })
      }
    }

    // 克链（只取主要克制关系）
    for (const target of KE_MAP[shen]) {
      const toPower = powerMap.get(target) || 0
      if (toPower > 0 && fromPower > toPower * 1.5) {
        links.push({
          from: shen,
          to: target,
          type: '克',
          strength: Math.min(100, Math.round(fromPower - toPower)),
          description: `${shen}克${target}，制约有力`,
        })
      }
    }
  }

  return links.sort((a, b) => b.strength - a.strength)
}

function generateShengKeAnalysis(links: ShenShiShengKeLink[], sorted: ShenShi[]): string {
  if (links.length === 0) return '命局十神力量较为均衡，生克关系不显著。'

  const shengLinks = links.filter(l => l.type === '生')
  const keLinks = links.filter(l => l.type === '克')

  let analysis = ''

  if (shengLinks.length > 0) {
    analysis += '命局中十神相生关系如下：'
    const topSheng = shengLinks.slice(0, 3)
    for (const link of topSheng) {
      analysis += `${link.from}生${link.to}，${link.description}；`
    }
    analysis += '生链流通，气机顺畅。'
  }

  if (keLinks.length > 0) {
    if (analysis) analysis += '\n'
    analysis += '命局中十神相克关系如下：'
    const topKe = keLinks.slice(0, 2)
    for (const link of topKe) {
      analysis += `${link.from}克${link.to}，${link.description}；`
    }
    analysis += '克泄适度，方能成器。'
  }

  // 分析主导十神的生克流向
  if (sorted.length >= 2) {
    const main = sorted[0]
    const mainSheng = shengLinks.filter(l => l.from === main)
    const mainKe = keLinks.filter(l => l.from === main)
    if (mainSheng.length > 0 || mainKe.length > 0) {
      analysis += `\n主导十神${main}的流向：`
      if (mainSheng.length > 0) {
        analysis += `生${mainSheng.map(l => l.to).join('、')}；`
      }
      if (mainKe.length > 0) {
        analysis += `克${mainKe.map(l => l.to).join('、')}。`
      }
    }
  }

  return analysis
}

function analyzeCombinations(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  cangGanData: Record<EarthlyBranch, CangGan>,
  powers: Record<ShenShi, ShenShiPower>,
): ShenShiCombination[] {
  const results: ShenShiCombination[] = []

  for (const rule of SHISHEN_COMBINATION_RULES) {
    try {
      const ctx = {
        sixLines,
        dayGan,
        cangGanData: cangGanData as any,
        shenShiPowers: powers as any,
      }
      if (rule.condition(ctx as any)) {
        const r = rule.result as any
        results.push({
          id: rule.id,
          name: r.name || rule.name,
          description: r.description || rule.description,
          auspicious: r.auspicious !== false,
          strength: r.strength || 50,
          confidence: r.confidence || rule.weight || 80,
          mainShens: r.mainShens || [],
          reference: r.reference || rule.reference || '',
        })
      }
    } catch {
      // skip
    }
  }

  return results.sort((a, b) => b.strength - a.strength)
}
