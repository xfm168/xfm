import type { SixLines, HeavenlyStem, EarthlyBranch, ShenShi, FiveElement } from './types'
import type { ShenShiAnalysisResult } from './shishenAnalysis'
import type { GeJuResult } from './geju'
import type { FiveElementPowerResult } from './fiveElementPower'
import { getStemElement, getStemYinYang } from '@/lib/core'

export interface CareerShiShenScore {
  name: ShenShi
  power: number
  role: string
  description: string
}

export interface CareerDirection {
  name: string
  score: number
  description: string
  suitable: boolean
}

export interface IndustryMatch {
  industry: string
  score: number
  reason: string
  tags: string[]
}

export interface CareerAnalysisResult {
  score: number
  shishenScores: CareerShiShenScore[]
  dominantShiShen: ShenShi[]
  directions: CareerDirection[]
  industries: IndustryMatch[]
  bestPath: string
  wealthDirection: string
  risks: string[]
  suggestions: string[]
  summary: string
}

const SHI_SHEN_CAREER_MAP: Record<ShenShi, { role: string; description: string }> = {
  '正官': { role: '管理者', description: '正官代表规矩、正统、管理能力，适合体制内、管理岗位。' },
  '偏官': { role: '开拓者', description: '偏官代表魄力、竞争力、执行力，适合创业、销售、军警。' },
  '正印': { role: '学者', description: '正印代表学问、文化、贵人，适合教育、研究、文化类工作。' },
  '偏印': { role: '技术专才', description: '偏印代表独特技能、研究精神，适合技术、玄学、艺术创作。' },
  '比肩': { role: '合作者', description: '比肩代表合作、平等，适合合伙创业、团队协作类工作。' },
  '劫财': { role: '竞争者', description: '劫财代表竞争、冒险，适合竞争激烈的行业、投资类工作。' },
  '食神': { role: '创意者', description: '食神代表才华、福气、表达，适合艺术、餐饮、娱乐、写作。' },
  '伤官': { role: '创新者', description: '伤官代表才华、口才、变革，适合创意、技术、演讲、演艺。' },
  '正财': { role: '稳健者', description: '正财代表稳定收入、踏实，适合财务、会计、稳定行业。' },
  '偏财': { role: '投资者', description: '偏财代表投资、偏门财路，适合金融、投资、经商、自由职业。' },
}

const INDUSTRY_RULES: { industry: string; shishen: ShenShi[]; elements: FiveElement[]; tags: string[] }[] = [
  { industry: '互联网/科技', shishen: ['伤官', '偏印', '食神'], elements: ['火', '金'], tags: ['技术', '创新'] },
  { industry: '教育/培训', shishen: ['正印', '食神'], elements: ['木', '火'], tags: ['文化', '传授'] },
  { industry: '金融/投资', shishen: ['偏财', '正财', '偏官'], elements: ['金', '水'], tags: ['财富', '风险'] },
  { industry: '医疗/健康', shishen: ['正印', '食神', '正官'], elements: ['木', '水'], tags: ['仁心', '技术'] },
  { industry: '法律/咨询', shishen: ['正官', '伤官', '比肩'], elements: ['金', '土'], tags: ['专业', '公正'] },
  { industry: '艺术/设计', shishen: ['食神', '伤官', '偏印'], elements: ['木', '火'], tags: ['创意', '审美'] },
  { industry: '建筑/工程', shishen: ['偏印', '比肩', '劫财'], elements: ['土', '金'], tags: ['实干', '技术'] },
  { industry: '餐饮/服务', shishen: ['食神', '正财', '偏财'], elements: ['火', '土'], tags: ['服务', '美食'] },
  { industry: '销售/市场', shishen: ['偏财', '伤官', '偏官'], elements: ['火', '金'], tags: ['沟通', '拓展'] },
  { industry: '政府/公务', shishen: ['正官', '正印'], elements: ['土', '金'], tags: ['稳定', '权威'] },
  { industry: '管理/行政', shishen: ['正官', '正印', '比肩'], elements: ['土', '金'], tags: ['组织', '协调'] },
  { industry: '玄学/命理', shishen: ['偏印', '伤官', '食神'], elements: ['水', '木'], tags: ['神秘', '智慧'] },
]

function calculateShiShenScores(shenShiAnalysis: ShenShiAnalysisResult): CareerShiShenScore[] {
  return shenShiAnalysis.details
    .filter(d => d.power > 0)
    .map(d => ({
      name: d.name,
      power: d.power,
      role: SHI_SHEN_CAREER_MAP[d.name]?.role || '未知',
      description: SHI_SHEN_CAREER_MAP[d.name]?.description || '',
    }))
    .sort((a, b) => b.power - a.power)
}

function analyzeCareerDirections(
  shishenScores: CareerShiShenScore[],
  geJu: GeJuResult,
  gender: string
): CareerDirection[] {
  const directions: CareerDirection[] = []

  const topShiShen = shishenScores.slice(0, 3).map(s => s.name)
  const hasGuan = topShiShen.some(s => s === '正官' || s === '偏官')
  const hasCai = topShiShen.some(s => s === '正财' || s === '偏财')
  const hasYin = topShiShen.some(s => s === '正印' || s === '偏印')
  const hasShiShang = topShiShen.some(s => s === '食神' || s === '伤官')
  const hasBiJie = topShiShen.some(s => s === '比肩' || s === '劫财')

  // 创业
  const startupScore = (hasShiShang ? 20 : 0) + (hasCai ? 15 : 0) + (hasBiJie ? 10 : 0) + (geJu.isSpecial ? 10 : 0)
  directions.push({
    name: '创业',
    score: Math.min(95, startupScore + 40),
    description: hasShiShang && hasCai
      ? '食伤生财，创业能力强，有商业头脑，适合自主创业。'
      : hasCai
      ? '财星有力，有赚钱意识，但需配合食伤才华方可创业。'
      : '创业需谨慎，建议先积累经验再考虑。',
    suitable: startupScore >= 30,
  })

  // 打工/职场
  const employeeScore = (hasGuan ? 20 : 0) + (hasYin ? 15 : 0) + (hasCai ? 10 : 0)
  directions.push({
    name: '职场发展',
    score: Math.min(95, employeeScore + 50),
    description: hasGuan
      ? '官杀有力，职场竞争力强，易获升迁。'
      : hasYin
      ? '印星有力，专业技能强，靠技术立身。'
      : '职场平稳发展，需靠积累逐步提升。',
    suitable: employeeScore >= 20,
  })

  // 公务员/体制内
  const civilScore = (hasGuan ? 25 : 0) + (hasYin ? 15 : 0) + (geJu.name.includes('官') ? 10 : 0)
  directions.push({
    name: '公务员/体制内',
    score: Math.min(95, civilScore + 35),
    description: hasGuan && hasYin
      ? '官印相生，天生适合体制内工作，易得官运。'
      : hasGuan
      ? '正官有力，有管理能力，适合考公务员。'
      : '体制内工作较为平稳，但不是最佳选择。',
    suitable: civilScore >= 30,
  })

  // 技术/专业
  const techScore = (hasYin ? 20 : 0) + (hasShiShang ? 15 : 0) + (hasBiJie ? 10 : 0)
  directions.push({
    name: '技术/专业',
    score: Math.min(95, techScore + 45),
    description: hasYin && hasShiShang
      ? '食伤配印，技术才华出众，适合专业技术路线。'
      : hasYin
      ? '印星有力，学习能力强，适合研究型工作。'
      : '技术路线可行，但需持续学习提升。',
    suitable: techScore >= 25,
  })

  // 管理
  const manageScore = (hasGuan ? 25 : 0) + (hasBiJie ? 15 : 0) + (hasCai ? 10 : 0)
  directions.push({
    name: '管理岗位',
    score: Math.min(95, manageScore + 40),
    description: hasGuan && hasBiJie
      ? '官杀有力且比劫强，有领导才能，适合管理团队。'
      : hasGuan
      ? '正官有力，有管理意识，可向管理方向发展。'
      : '管理能力一般，需培养领导力。',
    suitable: manageScore >= 30,
  })

  // 艺术/创意
  const artScore = (hasShiShang ? 25 : 0) + (hasYin ? 10 : 0) + (hasCai ? 5 : 0)
  directions.push({
    name: '艺术/创意',
    score: Math.min(95, artScore + 40),
    description: hasShiShang
      ? '食伤旺盛，才华横溢，适合艺术创作类工作。'
      : '艺术天赋一般，可作为业余爱好发展。',
    suitable: artScore >= 25,
  })

  // 销售/业务
  const salesScore = (hasCai ? 20 : 0) + (hasShiShang ? 15 : 0) + (hasBiJie ? 10 : 0)
  directions.push({
    name: '销售/业务',
    score: Math.min(95, salesScore + 40),
    description: hasCai && hasShiShang
      ? '食伤生财，口才好，善于开拓客户，适合做销售。'
      : hasCai
      ? '财星有力，有赚钱动力，可尝试销售类工作。'
      : '销售能力一般，需培养沟通能力。',
    suitable: salesScore >= 25,
  })

  return directions.sort((a, b) => b.score - a.score)
}

function analyzeIndustries(
  shishenScores: CareerShiShenScore[],
  fiveElementPower: FiveElementPowerResult
): IndustryMatch[] {
  const topShiShen = shishenScores.slice(0, 4).map(s => s.name)
  const topElements = fiveElementPower.sortedByPower.slice(0, 2)

  const results: IndustryMatch[] = []

  for (const rule of INDUSTRY_RULES) {
    let score = 50
    let reasons: string[] = []

    // 十神匹配
    const matchedShiShen = rule.shishen.filter(s => topShiShen.includes(s))
    score += matchedShiShen.length * 12
    if (matchedShiShen.length > 0) {
      reasons.push(`十神匹配：${matchedShiShen.join('、')}`)
    }

    // 五行匹配
    const matchedElements = rule.elements.filter(e => topElements.includes(e))
    score += matchedElements.length * 8
    if (matchedElements.length > 0) {
      reasons.push(`五行匹配：${matchedElements.join('、')}`)
    }

    results.push({
      industry: rule.industry,
      score: Math.min(98, score),
      reason: reasons.length > 0 ? reasons.join('；') : '与命局有一定关联',
      tags: rule.tags,
    })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 8)
}

function determineBestPath(directions: CareerDirection[]): string {
  const top = directions[0]
  if (top.suitable) {
    return `最适合的发展路径是「${top.name}」，${top.description}`
  }
  return `建议先从「${directions.find(d => d.suitable)?.name || '职场发展'}」入手，逐步积累经验后再考虑其他方向。`
}

function determineWealthDirection(
  shishenScores: CareerShiShenScore[],
  fiveElementPower: FiveElementPowerResult
): string {
  const hasZhengCai = shishenScores.some(s => s.name === '正财')
  const hasPianCai = shishenScores.some(s => s.name === '偏财')
  const dominantElement = fiveElementPower.dominant

  let direction = ''

  if (hasPianCai && hasZhengCai) {
    direction = '正偏财皆旺，既可靠稳定收入积累财富，也可通过投资理财增加收入。'
  } else if (hasPianCai) {
    direction = '偏财有力，适合投资理财、副业增收，财富来源多元化。'
  } else if (hasZhengCai) {
    direction = '正财有力，适合踏实工作、稳步积累，靠专业技能获得稳定收入。'
  } else {
    direction = '财星一般，建议提升专业技能，靠技术或服务获取收入。'
  }

  direction += ` 喜用五行「${dominantElement}」相关行业更容易获得财富。`

  return direction
}

function analyzeCareerRisks(shishenScores: CareerShiShenScore[], geJu: GeJuResult): string[] {
  const risks: string[] = []
  const topNames = shishenScores.slice(0, 3).map(s => s.name)

  if (topNames.includes('伤官') && topNames.includes('偏官')) {
    risks.push('伤官见官，职场中易与上司冲突，需注意处理人际关系。')
  }
  if (topNames.includes('劫财') && topNames.includes('偏财')) {
    risks.push('劫财夺财，投资需谨慎，易有财务纠纷。')
  }
  if (geJu.poGe) {
    risks.push(`格局${geJu.name}有破格之象，事业发展可能多波折。`)
  }
  if (shishenScores.length > 0 && shishenScores[0].power > 80) {
    risks.push(`${shishenScores[0].name}过旺，性格偏激，易因个性问题影响事业发展。`)
  }

  if (risks.length === 0) {
    risks.push('事业运势总体平稳，但仍需持续努力，防范小人。')
  }

  return risks
}

function generateCareerSuggestions(directions: CareerDirection[], shishenScores: CareerShiShenScore[]): string[] {
  const suggestions: string[] = []
  const topDirection = directions[0]

  suggestions.push(`首选发展方向：${topDirection.name}，${topDirection.description}`)

  const secondChoice = directions.find(d => d.suitable && d.name !== topDirection.name)
  if (secondChoice) {
    suggestions.push(`备选方向：${secondChoice.name}，可作为转型或副业方向。`)
  }

  const guanShas = shishenScores.filter(s => s.name === '正官' || s.name === '偏官')
  if (guanShas.length > 0 && guanShas[0].power > 50) {
    suggestions.push('官杀有力，适合考取专业资格证书，提升职场竞争力。')
  }

  const yins = shishenScores.filter(s => s.name === '正印' || s.name === '偏印')
  if (yins.length > 0 && yins[0].power > 50) {
    suggestions.push('印星有力，持续学习进修，考取高学历或专业证书有利于事业发展。')
  }

  const cais = shishenScores.filter(s => s.name === '正财' || s.name === '偏财')
  if (cais.length > 0 && cais[0].power > 50) {
    suggestions.push('财星有力，可适当进行理财投资，增加被动收入。')
  }

  suggestions.push('把握大运流年中官杀、财星旺的年份，是事业发展的关键时机。')
  suggestions.push('事业成功需要天时地利人和，除了命理因素，更需自身努力。')

  return suggestions
}

function generateCareerSummary(
  score: number,
  directions: CareerDirection[],
  shishenScores: CareerShiShenScore[]
): string {
  const parts: string[] = []

  parts.push(`事业综合评分${score}分。`)

  const topShiShen = shishenScores[0]
  if (topShiShen) {
    parts.push(`命局以${topShiShen.name}为主，${topShiShen.description}`)
  }

  const bestDirection = directions[0]
  parts.push(`最适合的发展方向是「${bestDirection.name}」。`)

  if (score >= 80) {
    parts.push('事业运势较旺，把握机遇，必能成就一番事业。')
  } else if (score >= 60) {
    parts.push('事业有发展潜力，需找准方向，持之以恒。')
  } else {
    parts.push('事业之路需更多努力，建议选择稳健路线，厚积薄发。')
  }

  return parts.join('')
}

export function analyzeCareer(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  gender: string,
  shenShiAnalysis: ShenShiAnalysisResult,
  geJu: GeJuResult,
  fiveElementPower: FiveElementPowerResult
): CareerAnalysisResult {
  const shishenScores = calculateShiShenScores(shenShiAnalysis)
  const dominantShiShen = shishenScores.slice(0, 3).map(s => s.name)
  const directions = analyzeCareerDirections(shishenScores, geJu, gender)
  const industries = analyzeIndustries(shishenScores, fiveElementPower)
  const bestPath = determineBestPath(directions)
  const wealthDirection = determineWealthDirection(shishenScores, fiveElementPower)
  const risks = analyzeCareerRisks(shishenScores, geJu)
  const suggestions = generateCareerSuggestions(directions, shishenScores)

  // 事业综合评分
  let score = 70
  if (directions[0].suitable) score += 10
  if (directions.filter(d => d.suitable).length >= 3) score += 10
  if (shishenScores[0]?.power > 60) score += 5
  if (!geJu.poGe) score += 5
  score = Math.min(95, Math.max(40, score))

  const summary = generateCareerSummary(score, directions, shishenScores)

  return {
    score,
    shishenScores,
    dominantShiShen,
    directions,
    industries,
    bestPath,
    wealthDirection,
    risks,
    suggestions,
    summary,
  }
}
