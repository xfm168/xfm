import type { SixLines, HeavenlyStem, FiveElement } from './types'
import type { FiveElementPowerResult } from './fiveElementPower'
import { getStemElement } from '@/lib/core'

export interface BodyConstitution {
  type: string
  description: string
  characteristics: string[]
}

export interface DiseaseRisk {
  organ: string
  riskLevel: 'high' | 'medium' | 'low'
  diseases: string[]
  description: string
}

export interface DietSuggestion {
  category: string
  recommend: string[]
  avoid: string[]
  reason: string
}

export interface ExerciseSuggestion {
  type: string
  suitable: boolean
  reason: string
}

export interface HealthRegimen {
  aspect: string
  suggestions: string[]
}

export interface HealthAnalysisResult {
  score: number
  constitution: BodyConstitution
  temperature: { type: '寒' | '热' | '平'; level: number; description: string }
  moisture: { type: '燥' | '湿' | '平'; level: number; description: string }
  diseaseRisks: DiseaseRisk[]
  dietSuggestions: DietSuggestion[]
  exerciseSuggestions: ExerciseSuggestion[]
  regimens: HealthRegimen[]
  summary: string
}

// 五行对应脏腑
const ELEMENT_ORGAN_MAP: Record<FiveElement, { organs: string[]; diseases: string[] }> = {
  '木': {
    organs: ['肝', '胆'],
    diseases: ['肝气郁结', '脂肪肝', '胆囊炎', '眼部疾病', '筋骨酸痛'],
  },
  '火': {
    organs: ['心', '小肠'],
    diseases: ['心血不足', '失眠', '心悸', '口腔溃疡', '咽喉炎'],
  },
  '土': {
    organs: ['脾', '胃'],
    diseases: ['脾胃虚弱', '消化不良', '胃痛', '腹胀', '肌肉酸痛'],
  },
  '金': {
    organs: ['肺', '大肠'],
    diseases: ['肺虚咳嗽', '支气管炎', '鼻炎', '便秘', '皮肤干燥'],
  },
  '水': {
    organs: ['肾', '膀胱'],
    diseases: ['肾虚', '腰膝酸软', '尿频', '耳鸣', '骨质疏松'],
  },
}

// 五行饮食
const ELEMENT_DIET_MAP: Record<FiveElement, { recommend: string[]; avoid: string[] }> = {
  '木': {
    recommend: ['绿色蔬菜', '酸味食物', '枸杞', '菊花茶', '绿叶菜', '芹菜', '菠菜'],
    avoid: ['过度辛辣', '过量饮酒', '油炸食品'],
  },
  '火': {
    recommend: ['苦味食物', '红色食材', '莲子', '绿豆', '西瓜', '番茄', '草莓'],
    avoid: ['过于燥热', '辛辣刺激', '过量咖啡'],
  },
  '土': {
    recommend: ['黄色食物', '甘味食物', '山药', '小米', '南瓜', '红薯', '玉米'],
    avoid: ['生冷寒凉', '暴饮暴食', '过甜食物'],
  },
  '金': {
    recommend: ['白色食物', '辛味食物', '百合', '银耳', '雪梨', '白萝卜', '杏仁'],
    avoid: ['过多寒凉', '过度干燥', '烟酒刺激'],
  },
  '水': {
    recommend: ['黑色食物', '咸味食物', '黑豆', '黑芝麻', '核桃', '海带', '紫菜'],
    avoid: ['过度咸味', '生冷食物', '大量饮水伤肾'],
  },
}

// 五行运动
const ELEMENT_EXERCISE_MAP: Record<FiveElement, { suitable: string[]; avoid: string[] }> = {
  '木': { suitable: ['太极拳', '瑜伽', '散步', '羽毛球', '登山'], avoid: ['过度剧烈运动'] },
  '火': { suitable: ['游泳', '慢跑', '舞蹈', '骑自行车', '有氧运动'], avoid: ['高温环境运动'] },
  '土': { suitable: ['散步', '太极', '瑜伽', ' gardening', '轻体力劳动'], avoid: ['饭后立即运动'] },
  '金': { suitable: ['跑步', '呼吸练习', '登山', '乒乓球', '器械训练'], avoid: ['空气污浊环境'] },
  '水': { suitable: ['游泳', '太极', '散步', '拉伸', '气功', '冥想'], avoid: ['过度出汗', '冬泳（肾虚者）'] },
}

function determineConstitution(fiveElementPower: FiveElementPowerResult): BodyConstitution {
  const sorted = fiveElementPower.sortedByPower
  const dominant = sorted[0]
  const weakest = sorted[sorted.length - 1]

  const constitutionMap: Record<FiveElement, { type: string; description: string; characteristics: string[] }> = {
    '木': {
      type: '木型体质',
      description: '木主肝胆，性格多愁善感，易抑郁或急躁。',
      characteristics: ['体形偏瘦', '面色偏青', '性情急躁', '易紧张焦虑', '睡眠质量差'],
    },
    '火': {
      type: '火型体质',
      description: '火主心小肠，性格热情奔放，易上火急躁。',
      characteristics: ['面色偏红', '精力旺盛', '易心烦失眠', '口干舌燥', '大便偏干'],
    },
    '土': {
      type: '土型体质',
      description: '土主脾胃，性格稳重踏实，易思虑过度。',
      characteristics: ['体形偏胖', '肌肉松软', '消化较弱', '易疲劳', '嗜睡'],
    },
    '金': {
      type: '金型体质',
      description: '金主肺大肠，性格坚毅果断，易悲忧。',
      characteristics: ['体形适中', '皮肤偏白', '呼吸较浅', '易感冒咳嗽', '鼻敏感'],
    },
    '水': {
      type: '水型体质',
      description: '水主肾膀胱，性格沉稳内敛，易恐惧焦虑。',
      characteristics: ['面色偏黑', '怕冷', '腰膝酸软', '尿频', '记忆力减退'],
    },
  }

  const constitution = constitutionMap[dominant]

  // 结合最弱五行补充特征
  if (weakest !== dominant) {
    const weakOrgan = ELEMENT_ORGAN_MAP[weakest]
    constitution.characteristics.push(`${weakOrgan.organs.join('')}功能偏弱，需重点保养。`)
  }

  return {
    type: constitution.type,
    description: constitution.description,
    characteristics: constitution.characteristics,
  }
}

function analyzeTemperature(
  fiveElementPower: FiveElementPowerResult
): { type: '寒' | '热' | '平'; level: number; description: string } {
  const fire = fiveElementPower.powerMap['火'] || 0
  const water = fiveElementPower.powerMap['水'] || 0

  if (fire > water + 15) {
    return {
      type: '热',
      level: Math.min(10, Math.round((fire - water) / 10)),
      description: `火旺于水（火${fire} 水${water}），体质偏热，易上火、口干、便秘。应多食清凉降火之物。`,
    }
  }
  if (water > fire + 15) {
    return {
      type: '寒',
      level: Math.min(10, Math.round((water - fire) / 10)),
      description: `水旺于火（水${water} 火${fire}），体质偏寒，畏寒怕冷，手脚冰凉。应多食温补之物。`,
    }
  }
  return {
    type: '平',
    level: Math.abs(fire - water),
    description: `水火相对平衡（火${fire} 水${water}），寒热适中，体质较为平和。`,
  }
}

function analyzeMoisture(
  fiveElementPower: FiveElementPowerResult
): { type: '燥' | '湿' | '平'; level: number; description: string } {
  const earth = fiveElementPower.powerMap['土'] || 0
  const metal = fiveElementPower.powerMap['金'] || 0
  const water = fiveElementPower.powerMap['水'] || 0

  if (earth > water + metal - 10) {
    return {
      type: '湿',
      level: Math.min(10, Math.round((earth - water) / 8)),
      description: `土旺偏湿（土${earth}），体内湿气较重，易有沉重感、水肿、关节不适。应利湿健脾。`,
    }
  }
  if (metal > water + 10 && earth < metal) {
    return {
      type: '燥',
      level: Math.min(10, Math.round((metal - earth) / 8)),
      description: `金旺偏燥（金${metal} 土${earth}），体质偏燥，皮肤干、口干鼻燥。应润肺养阴。`,
    }
  }
  return {
    type: '平',
    level: Math.abs(earth - metal),
    description: `燥湿相对平衡（土${earth} 金${metal}），无明显燥湿偏颇。`,
  }
}

function analyzeDiseaseRisks(fiveElementPower: FiveElementPowerResult): DiseaseRisk[] {
  const risks: DiseaseRisk[] = []

  for (const element of ['木', '火', '土', '金', '水'] as FiveElement[]) {
    const power = fiveElementPower.powerMap[element] || 0
    const info = ELEMENT_ORGAN_MAP[element]

    let riskLevel: 'high' | 'medium' | 'low'
    if (power > 35) {
      riskLevel = 'high'
    } else if (power > 20) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    // 五行过旺也致病
    let desc = ''
    if (power > 35) {
      desc = `${element}行过旺（${power}分），${info.organs.join('和')}负荷过重，容易引发相关疾病。`
    } else if (power < 10) {
      desc = `${element}行过弱（${power}分），${info.organs.join('和')}功能不足，容易引发相关疾病。`
    } else {
      desc = `${element}行力量适中（${power}分），${info.organs.join('和')}功能正常。`
    }

    risks.push({
      organ: info.organs.join(' / '),
      riskLevel,
      diseases: info.diseases,
      description: desc,
    })
  }

  return risks
}

function analyzeDietSuggestions(
  fiveElementPower: FiveElementPowerResult,
  temperature: { type: '寒' | '热' | '平' }
): DietSuggestion[] {
  const suggestions: DietSuggestion[] = []

  // 根据喜用五行推荐饮食
  for (const element of fiveElementPower.sortedByPower.slice(0, 2) as FiveElement[]) {
    const diet = ELEMENT_DIET_MAP[element]
    suggestions.push({
      category: `补益${element}行（${ELEMENT_ORGAN_MAP[element].organs.join('/')}）`,
      recommend: diet.recommend,
      avoid: diet.avoid,
      reason: `${element}行${fiveElementPower.powerMap[element] > 25 ? '偏旺' : '需补益'}，宜多食${element}行对应食材。`,
    })
  }

  // 根据寒热调整
  if (temperature.type === '寒') {
    suggestions.push({
      category: '温补驱寒',
      recommend: ['姜茶', '红枣', '桂圆', '羊肉', '核桃', '生姜', '葱白'],
      avoid: ['冰饮', '生冷食物', '寒性水果（西瓜、梨）'],
      reason: '体质偏寒，宜多食温补食物，驱散寒气。',
    })
  } else if (temperature.type === '热') {
    suggestions.push({
      category: '清热降火',
      recommend: ['绿豆汤', '菊花茶', '苦瓜', '黄瓜', '冬瓜', '荷叶', '薏米'],
      avoid: ['辛辣食物', '烧烤', '羊肉', '榴莲', '酒类'],
      reason: '体质偏热，宜多食清凉降火食物，减少上火。',
    })
  }

  // 通用建议
  suggestions.push({
    category: '通用养生',
    recommend: ['粗粮杂粮', '应季蔬果', '适量坚果', '温水', '规律三餐'],
    avoid: ['暴饮暴食', '过度节食', '高糖高脂', '加工食品'],
    reason: '保持均衡饮食是养生之本，配合五行调理效果更佳。',
  })

  return suggestions
}

function analyzeExerciseSuggestions(
  fiveElementPower: FiveElementPowerResult,
  constitution: BodyConstitution
): ExerciseSuggestion[] {
  const suggestions: ExerciseSuggestion[] = []

  for (const element of fiveElementPower.sortedByPower.slice(0, 2) as FiveElement[]) {
    const exMap = ELEMENT_EXERCISE_MAP[element]
    for (const sport of exMap.suitable.slice(0, 2)) {
      suggestions.push({
        type: sport,
        suitable: true,
        reason: `${element}行体质适合${sport}，有助于调和${ELEMENT_ORGAN_MAP[element].organs.join('和')}。`,
      })
    }
  }

  // 根据体质推荐
  if (constitution.type.includes('土')) {
    suggestions.push({ type: '饭后散步', suitable: true, reason: '土型体质脾胃弱，饭后散步有助消化。' })
  }
  if (constitution.type.includes('金')) {
    suggestions.push({ type: '呼吸练习/腹式呼吸', suitable: true, reason: '金型体质肺主气，呼吸练习可增强肺功能。' })
  }
  if (constitution.type.includes('水')) {
    suggestions.push({ type: '游泳/温水浴', suitable: true, reason: '水型体质肾主水，游泳有助于温养肾阳。' })
  }

  return suggestions
}

function generateRegimens(
  constitution: BodyConstitution,
  temperature: { type: '寒' | '热' | '平'; level: number },
  moisture: { type: '燥' | '湿' | '平'; level: number },
  diseaseRisks: DiseaseRisk[]
): HealthRegimen[] {
  const regimens: HealthRegimen[] = []

  // 作息调理
  regimens.push({
    aspect: '作息调理',
    suggestions: [
      '子时（23点-1点）前入睡，有利于肝胆排毒修复。',
      '午时（11点-13点）小憩15-30分钟，有助于养心安神。',
      '保持规律作息，避免熬夜伤身。',
    ],
  })

  // 情志调理
  const dominantElement = constitution.type.charAt(0) as FiveElement
  if (dominantElement === '木') {
    regimens.push({
      aspect: '情志调理',
      suggestions: ['保持心情舒畅，避免生闷气。', '多接触大自然，散步赏花。', '练习冥想或瑜伽释放压力。'],
    })
  } else if (dominantElement === '火') {
    regimens.push({
      aspect: '情志调理',
      suggestions: ['控制情绪，避免急躁暴怒。', '听轻音乐、练书法以静心。', '保持心态平和，避免过度兴奋。'],
    })
  } else if (dominantElement === '土') {
    regimens.push({
      aspect: '情志调理',
      suggestions: ['避免过度思虑，学会放空。', '培养兴趣爱好，转移注意力。', '多社交，避免独处久坐。'],
    })
  } else if (dominantElement === '金') {
    regimens.push({
      aspect: '情志调理',
      suggestions: ['避免过度悲忧，保持乐观心态。', '多听欢快音乐，参加集体活动。', '适当表达情感，不要压抑。'],
    })
  } else {
    regimens.push({
      aspect: '情志调理',
      suggestions: ['克服恐惧心理，增强自信。', '练习站桩或太极以固肾气。', '保持规律生活，避免过度惊恐。'],
    })
  }

  // 季节调理
  regimens.push({
    aspect: '季节养生',
    suggestions: [
      '春季（木旺）：养肝护肝，多食绿色蔬菜，早睡早起。',
      '夏季（火旺）：养心安神，多食清凉之物，避免高温暴晒。',
      '秋季（金旺）：润肺养阴，多食白色食材，防燥保湿。',
      '冬季（水旺）：补肾固本，多食温补之物，注意保暖。',
    ],
  })

  // 针对高风险脏腑
  const highRisks = diseaseRisks.filter(d => d.riskLevel === 'high')
  if (highRisks.length > 0) {
    const organTips = highRisks.map(d => `重点保养${d.organ}：${d.diseases.slice(0, 2).join('、')}`)
    regimens.push({
      aspect: '重点保养',
      suggestions: organTips,
    })
  }

  return regimens
}

function generateHealthSummary(
  score: number,
  constitution: BodyConstitution,
  temperature: { type: '寒' | '热' | '平' },
  moisture: { type: '燥' | '湿' | '平' },
  diseaseRisks: DiseaseRisk[]
): string {
  const parts: string[] = []

  parts.push(`健康综合评分${score}分。`)
  parts.push(`体质类型为「${constitution.type}」，${constitution.description}`)

  if (temperature.type !== '平') {
    parts.push(`体质偏${temperature.type}，`)
  }
  if (moisture.type !== '平') {
    parts.push(`偏${moisture.type}，`)
  }

  const highRisks = diseaseRisks.filter(d => d.riskLevel === 'high')
  if (highRisks.length > 0) {
    parts.push(`需重点关注${highRisks.map(d => d.organ).join('、')}健康。`)
  }

  if (score >= 80) {
    parts.push('整体健康状况较好，保持良好生活习惯即可。')
  } else if (score >= 60) {
    parts.push('健康状况需关注，注意饮食调理和适量运动。')
  } else {
    parts.push('健康需重点调养，建议结合中医调理，定期体检。')
  }

  return parts.join('')
}

export function analyzeHealth(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  fiveElementPower: FiveElementPowerResult
): HealthAnalysisResult {
  const constitution = determineConstitution(fiveElementPower)
  const temperature = analyzeTemperature(fiveElementPower)
  const moisture = analyzeMoisture(fiveElementPower)
  const diseaseRisks = analyzeDiseaseRisks(fiveElementPower)
  const dietSuggestions = analyzeDietSuggestions(fiveElementPower, temperature)
  const exerciseSuggestions = analyzeExerciseSuggestions(fiveElementPower, constitution)
  const regimens = generateRegimens(constitution, temperature, moisture, diseaseRisks)

  // 健康评分
  let score = 70
  const highRisks = diseaseRisks.filter(d => d.riskLevel === 'high')
  const medRisks = diseaseRisks.filter(d => d.riskLevel === 'medium')
  score -= highRisks.length * 8
  score -= medRisks.length * 3
  if (temperature.type === '平') score += 3
  if (moisture.type === '平') score += 3
  score = Math.min(95, Math.max(35, score))

  const summary = generateHealthSummary(score, constitution, temperature, moisture, diseaseRisks)

  return {
    score,
    constitution,
    temperature,
    moisture,
    diseaseRisks,
    dietSuggestions,
    exerciseSuggestions,
    regimens,
    summary,
  }
}
