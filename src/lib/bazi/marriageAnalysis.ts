import type { SixLines, EarthlyBranch, HeavenlyStem, GanZhi } from './types'
import { checkTaohua } from './shensha/taohua'
import { checkHongluan } from './shensha/hongluan'
import { checkGuChenGuaSu } from './shensha/guchen'
import { getBranchElement, getBranchIndex, EARTHLY_BRANCHES, HEAVENLY_STEMS } from '@/lib/core'

// 地支六冲
const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

// 地支六合
const LIU_HE: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

// 地支三刑（无恩/恃势/无礼）
const SAN_XING: EarthlyBranch[][] = [
  ['寅', '巳', '申'], // 无恩之刑
  ['丑', '戌', '未'], // 恃势之刑
  ['子', '卯'],       // 无礼之刑
]

// 地支六害
const LIU_HAI: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

// 地支六破
const LIU_PO: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['戌', '未'],
]

export interface MarriageShenSha {
  name: string
  inPosition: boolean
  position: string
  description: string
}

export interface SpousePalaceRelation {
  type: '冲' | '合' | '刑' | '害' | '破'
  target: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

export interface MarriageRisk {
  type: string
  level: 'high' | 'medium' | 'low'
  description: string
}

export interface MarriageAnalysisResult {
  spousePalace: {
    zhi: EarthlyBranch
    element: string
    description: string
  }
  relations: SpousePalaceRelation[]
  shenSha: MarriageShenSha[]
  score: number
  bestMarriageAge: {
    min: number
    max: number
    reason: string
  }
  risks: MarriageRisk[]
  suggestions: string[]
  summary: string
}

function hasRelation(
  zhi1: EarthlyBranch,
  zhi2: EarthlyBranch,
  relations: [EarthlyBranch, EarthlyBranch][]
): boolean {
  return relations.some(([a, b]) => (a === zhi1 && b === zhi2) || (a === zhi2 && b === zhi1))
}

function hasXing(zhi1: EarthlyBranch, zhi2: EarthlyBranch): boolean {
  for (const group of SAN_XING) {
    if (group.length === 2) {
      if ((group[0] === zhi1 && group[1] === zhi2) || (group[0] === zhi2 && group[1] === zhi1)) {
        return true
      }
    } else if (group.length === 3) {
      if (group.includes(zhi1) && group.includes(zhi2) && zhi1 !== zhi2) {
        return true
      }
    }
  }
  return false
}

function getXingType(zhi1: EarthlyBranch, zhi2: EarthlyBranch): string {
  if ((zhi1 === '寅' && zhi2 === '巳') || (zhi1 === '巳' && zhi2 === '寅') ||
      (zhi1 === '巳' && zhi2 === '申') || (zhi1 === '申' && zhi2 === '巳') ||
      (zhi1 === '寅' && zhi2 === '申') || (zhi1 === '申' && zhi2 === '寅')) {
    return '无恩之刑'
  }
  if ((zhi1 === '丑' && zhi2 === '戌') || (zhi1 === '戌' && zhi2 === '丑') ||
      (zhi1 === '戌' && zhi2 === '未') || (zhi1 === '未' && zhi2 === '戌') ||
      (zhi1 === '丑' && zhi2 === '未') || (zhi1 === '未' && zhi2 === '丑')) {
    return '恃势之刑'
  }
  if ((zhi1 === '子' && zhi2 === '卯') || (zhi1 === '卯' && zhi2 === '子')) {
    return '无礼之刑'
  }
  return '相刑'
}

function analyzeSpousePalaceRelations(sixLines: SixLines): SpousePalaceRelation[] {
  const relations: SpousePalaceRelation[] = []
  const spouseZhi = sixLines.day.zhi

  const otherBranches = [
    { key: '年支', zhi: sixLines.year.zhi },
    { key: '月支', zhi: sixLines.month.zhi },
    { key: '时支', zhi: sixLines.hour.zhi },
  ]

  for (const { key, zhi } of otherBranches) {
    if (hasRelation(spouseZhi, zhi, LIU_CHONG)) {
      relations.push({
        type: '冲',
        target: key,
        description: `夫妻宫（日支${spouseZhi}）与${key}（${zhi}）相冲，婚姻易有波动，感情不稳定。`,
        severity: 'high',
      })
    }
    if (hasRelation(spouseZhi, zhi, LIU_HE)) {
      relations.push({
        type: '合',
        target: key,
        description: `夫妻宫（日支${spouseZhi}）与${key}（${zhi}）相合，婚姻和谐，配偶关系融洽。`,
        severity: 'low',
      })
    }
    if (hasXing(spouseZhi, zhi)) {
      relations.push({
        type: '刑',
        target: key,
        description: `夫妻宫（日支${spouseZhi}）与${key}（${zhi}）${getXingType(spouseZhi, zhi)}，婚姻中易有矛盾摩擦，需多沟通。`,
        severity: 'high',
      })
    }
    if (hasRelation(spouseZhi, zhi, LIU_HAI)) {
      relations.push({
        type: '害',
        target: key,
        description: `夫妻宫（日支${spouseZhi}）与${key}（${zhi}）相害，婚姻中易有暗中的伤害或误解。`,
        severity: 'medium',
      })
    }
    if (hasRelation(spouseZhi, zhi, LIU_PO)) {
      relations.push({
        type: '破',
        target: key,
        description: `夫妻宫（日支${spouseZhi}）与${key}（${zhi}）相破，婚姻中易有琐碎的破坏或损耗。`,
        severity: 'medium',
      })
    }
  }

  return relations
}

function analyzeMarriageShenSha(sixLines: SixLines, dayGan: HeavenlyStem, gender: string): MarriageShenSha[] {
  const result: MarriageShenSha[] = []

  const taohua = checkTaohua(sixLines, dayGan, gender)
  const hongluan = checkHongluan(sixLines, dayGan, gender)
  const guchen = checkGuChenGuaSu(sixLines, dayGan, gender)

  for (const item of taohua) {
    result.push({
      name: item.name,
      inPosition: item.inPosition,
      position: item.position,
      description: item.description,
    })
  }

  for (const item of hongluan) {
    result.push({
      name: item.name,
      inPosition: item.inPosition,
      position: item.position,
      description: item.description,
    })
  }

  for (const item of guchen) {
    result.push({
      name: item.name,
      inPosition: item.inPosition,
      position: item.position,
      description: item.description,
    })
  }

  return result
}

function calculateMarriageScore(
  relations: SpousePalaceRelation[],
  shenSha: MarriageShenSha[],
  dayGan: HeavenlyStem
): number {
  let score = 70

  // 夫妻宫关系加减分
  for (const r of relations) {
    if (r.type === '冲') score -= 15
    if (r.type === '刑') score -= 12
    if (r.type === '害') score -= 8
    if (r.type === '破') score -= 5
    if (r.type === '合') score += 10
  }

  // 神煞加减分
  const hasTaohua = shenSha.some(s => s.name.includes('桃花') && s.inPosition)
  const hasHongluan = shenSha.some(s => s.name === '红鸾' && s.inPosition)
  const hasTianxi = shenSha.some(s => s.name === '天喜' && s.inPosition)
  const hasGuChen = shenSha.some(s => s.name === '孤辰' && s.inPosition)
  const hasGuaSu = shenSha.some(s => s.name === '寡宿' && s.inPosition)

  if (hasTaohua) score -= 5
  if (hasHongluan) score += 8
  if (hasTianxi) score += 6
  if (hasGuChen) score -= 10
  if (hasGuaSu) score -= 10

  // 日主影响（男命看正财，女命看正官）
  const dayElement = getBranchElement(dayGan as unknown as EarthlyBranch)
  if (dayElement === '火' || dayElement === '土') {
    score += 2
  }

  return Math.max(30, Math.min(95, score))
}

function calculateBestMarriageAge(
  sixLines: SixLines,
  gender: string
): { min: number; max: number; reason: string } {
  const yearZhiIdx = EARTHLY_BRANCHES.indexOf(sixLines.year.zhi)
  const hongluanIdx = (yearZhiIdx + 3) % 12
  const hongluanZhi = EARTHLY_BRANCHES[hongluanIdx]

  // 根据红鸾所在位置推算结婚年龄
  const baseAge = gender === 'male' ? 28 : 25
  const offset = (hongluanIdx - yearZhiIdx + 12) % 12

  const minAge = Math.max(20, baseAge + offset - 3)
  const maxAge = Math.min(40, baseAge + offset + 5)

  const reason = `根据红鸾星位置（${hongluanZhi}），结合八字命局分析，${gender === 'male' ? '男命' : '女命'}在 ${minAge}-${maxAge} 岁期间结婚较为有利。此期间红鸾星动，婚姻运势较旺。`

  return { min: minAge, max: maxAge, reason }
}

function analyzeRisks(
  relations: SpousePalaceRelation[],
  shenSha: MarriageShenSha[]
): MarriageRisk[] {
  const risks: MarriageRisk[] = []

  const chongCount = relations.filter(r => r.type === '冲').length
  const xingCount = relations.filter(r => r.type === '刑').length

  if (chongCount >= 1) {
    risks.push({
      type: '夫妻宫受冲',
      level: 'high',
      description: '夫妻宫被冲，婚姻稳定性差，易有分居、离婚风险。建议婚后多沟通，避免长期异地。',
    })
  }

  if (xingCount >= 1) {
    risks.push({
      type: '夫妻宫受刑',
      level: 'high',
      description: '夫妻宫受刑，夫妻之间易有矛盾冲突，性格不合。建议婚前多了解对方，婚后互相包容。',
    })
  }

  const hasGuChen = shenSha.some(s => s.name === '孤辰' && s.inPosition)
  const hasGuaSu = shenSha.some(s => s.name === '寡宿' && s.inPosition)

  if (hasGuChen || hasGuaSu) {
    risks.push({
      type: '孤辰寡宿',
      level: 'medium',
      description: '命带孤辰或寡宿，感情之路较为坎坷，易有孤独感。建议主动社交，不要封闭自己。',
    })
  }

  const hasTaohua = shenSha.some(s => s.name.includes('桃花') && s.inPosition)
  if (hasTaohua) {
    risks.push({
      type: '桃花过多',
      level: 'medium',
      description: '命带桃花，异性缘旺，但也容易招惹感情纠纷。婚后需注意与异性保持适当距离。',
    })
  }

  if (risks.length === 0) {
    risks.push({
      type: '总体平稳',
      level: 'low',
      description: '夫妻宫无明显冲克，婚姻基础较好。但仍需用心经营，不可掉以轻心。',
    })
  }

  return risks
}

function generateSuggestions(
  relations: SpousePalaceRelation[],
  shenSha: MarriageShenSha[],
  score: number
): string[] {
  const suggestions: string[] = []

  if (score < 50) {
    suggestions.push('婚姻运势较弱，建议晚婚，待运势好转后再考虑婚姻大事。')
    suggestions.push('婚前可进行八字合婚，选择命理相合的配偶。')
  } else if (score < 70) {
    suggestions.push('婚姻有波折，建议多了解对方后再决定。')
    suggestions.push('婚后注意沟通方式，避免因小事引发大矛盾。')
  } else {
    suggestions.push('婚姻基础较好，把握机会，珍惜良缘。')
  }

  const hasChong = relations.some(r => r.type === '冲')
  if (hasChong) {
    suggestions.push('夫妻宫受冲，建议婚后避免长期分居，多陪伴对方。')
    suggestions.push('可佩戴五行调和饰品，化解冲克之力。')
  }

  const hasXing = relations.some(r => r.type === '刑')
  if (hasXing) {
    suggestions.push('夫妻宫受刑，建议婚后多参加夫妻共同活动，增进感情。')
  }

  const hasGuChen = shenSha.some(s => s.name === '孤辰' && s.inPosition)
  const hasGuaSu = shenSha.some(s => s.name === '寡宿' && s.inPosition)
  if (hasGuChen || hasGuaSu) {
    suggestions.push('命带孤辰寡宿，建议主动扩大社交圈，多参加聚会活动。')
    suggestions.push('培养兴趣爱好，丰富内心世界，减少孤独感。')
  }

  const hasTaohua = shenSha.some(s => s.name.includes('桃花') && s.inPosition)
  if (hasTaohua) {
    suggestions.push('命带桃花，异性缘旺，婚后需注意分寸，避免引起配偶误会。')
  }

  suggestions.push('选择吉利的日子结婚，可请教专业命理师择日。')
  suggestions.push('保持积极心态，相信美好的姻缘终将到来。')

  return suggestions
}

function generateSummary(
  spouseZhi: EarthlyBranch,
  score: number,
  relations: SpousePalaceRelation[],
  shenSha: MarriageShenSha[]
): string {
  const parts: string[] = []

  parts.push(`夫妻宫为${spouseZhi}，婚姻综合评分${score}分。`)

  const hasChong = relations.some(r => r.type === '冲')
  const hasHe = relations.some(r => r.type === '合')
  const hasXing = relations.some(r => r.type === '刑')

  if (hasChong) {
    parts.push('夫妻宫受冲，婚姻易有波动，需谨慎对待感情。')
  } else if (hasXing) {
    parts.push('夫妻宫受刑，婚姻中易有矛盾，需多包容理解。')
  } else if (hasHe) {
    parts.push('夫妻宫有合，婚姻和谐，配偶关系融洽。')
  } else {
    parts.push('夫妻宫无明显冲克，婚姻基础平稳。')
  }

  const hasHongluan = shenSha.some(s => s.name === '红鸾' && s.inPosition)
  const hasTianxi = shenSha.some(s => s.name === '天喜' && s.inPosition)

  if (hasHongluan && hasTianxi) {
    parts.push('命中红鸾天喜同现，婚姻喜事临门，良缘可期。')
  } else if (hasHongluan) {
    parts.push('命中带红鸾，婚姻运势较旺，易遇良缘。')
  }

  if (score >= 80) {
    parts.push('综合来看，婚姻运势良好，珍惜眼前人，用心经营婚姻。')
  } else if (score >= 60) {
    parts.push('综合来看，婚姻有喜有忧，把握好时机，化解不利因素。')
  } else {
    parts.push('综合来看，婚姻之路较为坎坷，需多加努力，晚婚为宜。')
  }

  return parts.join('')
}

export function analyzeMarriage(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  gender: string
): MarriageAnalysisResult {
  const spouseZhi = sixLines.day.zhi
  const relations = analyzeSpousePalaceRelations(sixLines)
  const shenSha = analyzeMarriageShenSha(sixLines, dayGan, gender)
  const score = calculateMarriageScore(relations, shenSha, dayGan)
  const bestMarriageAge = calculateBestMarriageAge(sixLines, gender)
  const risks = analyzeRisks(relations, shenSha)
  const suggestions = generateSuggestions(relations, shenSha, score)
  const summary = generateSummary(spouseZhi, score, relations, shenSha)

  return {
    spousePalace: {
      zhi: spouseZhi,
      element: getBranchElement(spouseZhi),
      description: `日支${spouseZhi}为夫妻宫，代表配偶和婚姻状况。`,
    },
    relations,
    shenSha,
    score,
    bestMarriageAge,
    risks,
    suggestions,
    summary,
  }
}
