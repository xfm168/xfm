/**
 * 玄风门 V3.1 - 12维评分引擎
 *
 * 基于环境特征、空间分析与房间数据，计算12个维度的专业风水评分。
 * 若计算失败，自动降级至 V3.0 八维评分体系。
 */

import type { ScoreEngineInput } from '../../score-engine/types'
import type {
  Score12DResult,
  DimensionScore,
  ScoreDimension12D,
} from '../types'
import { calculateScore8D } from '../../score-engine'

// ═══════════════════════════════════════════════
// 常量配置
// ═══════════════════════════════════════════════

/** 12维权重配置（百分比） */
const DIMENSION_WEIGHTS: Record<ScoreDimension12D, number> = {
  pattern: 12,      // 整体格局
  airFlow: 12,      // 气流循环
  windQi: 12,       // 藏风聚气
  lighting: 9,      // 采光质量
  wealth: 9,        // 财位质量
  health: 9,        // 健康影响
  career: 9,        // 事业影响
  family: 5,        // 家庭关系
  elements: 5,      // 五行平衡
  cleanliness: 5,   // 空间整洁度
  activityQuiet: 5, // 动静分区
  shaQi: 5,         // 煞气指数
}

/** 维度中文名称映射 */
const DIMENSION_NAMES: Record<ScoreDimension12D, string> = {
  pattern: '整体格局',
  airFlow: '气流循环',
  windQi: '藏风聚气',
  lighting: '采光质量',
  wealth: '财位质量',
  health: '健康影响',
  career: '事业影响',
  family: '家庭关系',
  elements: '五行平衡',
  cleanliness: '空间整洁度',
  activityQuiet: '动静分区',
  shaQi: '煞气指数',
}

/** 权重总和，用于归一化 */
const TOTAL_WEIGHT = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0)

// ═══════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════

/**
 * 计算12维评分
 * @param input 评分引擎输入数据
 * @returns 12维评分结果
 */
export function calculateScore12D(input: ScoreEngineInput): Score12DResult {
  try {
    return calculateScore12DInternal(input)
  } catch (error) {
    console.warn('[V3.1 Scoring] 12维评分计算失败，降级到 V3.0 八维评分:', error)
    return fallbackTo8D(input)
  }
}

/**
 * 根据分数获取等级
 * @param score 0-100 的分数
 * @returns '优' | '良' | '平' | '差'
 */
export function getLevelFromScore(score: number): '优' | '良' | '平' | '差' {
  if (score >= 85) return '优'
  if (score >= 70) return '良'
  if (score >= 50) return '平'
  return '差'
}

/**
 * 生成12维评分总体评价
 * @param result 评分结果（无需 summary 字段）
 * @returns 总体评价文本
 */
export function generate12DSummary(
  result: Omit<Score12DResult, 'summary'>
): string {
  const { dimensions, overall, level } = result

  // 找出最强与最弱维度
  const dimList = Object.values(dimensions)
  const best = dimList.reduce((a, b) => (a.score > b.score ? a : b))
  const worst = dimList.reduce((a, b) => (a.score < b.score ? a : b))

  const levelDesc: Record<string, string> = {
    '优': '整体风水格局优良，各维度表现均衡，居住体验与运势支撑较为理想。',
    '良': '整体风水条件良好，主要维度无明显缺陷，适当优化可进一步提升。',
    '平': '整体风水表现中等，部分维度存在改善空间，建议针对性调整。',
    '差': '整体风水条件偏弱，多个维度需要关注，建议系统性地进行空间调理。',
  }

  let summary = levelDesc[level] || '整体风水条件尚可，可根据实际情况逐步优化。'
  summary += `综合评分 ${overall} 分。`
  summary += `其中「${best.name}」表现最佳（${best.score} 分），`
  summary += `「${worst.name}」相对偏弱（${worst.score} 分），建议优先关注该维度的改善。`

  // 补充严重低分维度提示
  const poorDims = dimList.filter(d => d.score < 50)
  if (poorDims.length > 0) {
    summary += `此外，${poorDims.map(d => `「${d.name}」`).join('、')}得分较低，`
    summary += `可能对居住者的日常体验产生较明显影响，宜尽早处理。`
  }

  return summary
}

// ═══════════════════════════════════════════════
// 12维评分核心计算
// ═══════════════════════════════════════════════

function calculateScore12DInternal(input: ScoreEngineInput): Score12DResult {
  const dimensions = {} as Record<ScoreDimension12D, DimensionScore>

  dimensions.pattern = calculatePattern(input)
  dimensions.airFlow = calculateAirFlow(input)
  dimensions.windQi = calculateWindQi(input)
  dimensions.lighting = calculateLighting(input)
  dimensions.wealth = calculateWealth(input)
  dimensions.health = calculateHealth(input)
  dimensions.career = calculateCareer(input)
  dimensions.family = calculateFamily(input)
  dimensions.elements = calculateElements(input)
  dimensions.cleanliness = calculateCleanliness(input)
  dimensions.activityQuiet = calculateActivityQuiet(input)
  dimensions.shaQi = calculateShaQi(input)

  // 加权综合总分（归一化）
  const overall = Math.round(
    (Object.entries(dimensions).reduce((sum, [key, dim]) => {
      return sum + dim.score * DIMENSION_WEIGHTS[key as ScoreDimension12D]
    }, 0) / TOTAL_WEIGHT)
  )

  const level = getLevelFromScore(overall)
  const summary = generate12DSummary({ dimensions, overall, level })

  return {
    dimensions,
    overall,
    level,
    summary,
  }
}

// ═══════════════════════════════════════════════
// 各维度评分计算
// ═══════════════════════════════════════════════

/** 整体格局：户型方正度、缺角影响、朝向契合 */
function calculatePattern(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let shapeScore = 70
  let cornerScore = 70
  let directionScore = 70

  if (input.spatial) {
    const shape = input.spatial.house?.shape
    if (shape === 'square') {
      shapeScore = 95
      factors.push('户型方正，气场分布均匀')
    } else if (shape === 'rectangle') {
      shapeScore = 85
      factors.push('户型基本方正，长宽比例适中')
    } else if (shape === 'L-shape') {
      shapeScore = 65
      factors.push('户型呈L形，部分区域气场可能受阻')
    } else {
      shapeScore = 50
      factors.push('户型形状不规则，气场分布可能失衡')
    }

    const missingCount = input.spatial.house?.missingCorners?.length || 0
    cornerScore = Math.max(20, 100 - missingCount * 18)
    if (missingCount === 0) {
      factors.push('无缺角，八卦方位完整')
    } else {
      factors.push(`存在 ${missingCount} 处缺角，可能影响对应方位的气场`)
    }
  } else {
    factors.push('缺少空间数据，按默认值评估')
  }

  if (input.userProvided?.orientation) {
    directionScore = 75
    factors.push(`朝向为${input.userProvided.orientation}，结合传统风水理论需具体分析`)
  }

  const score = Math.round(shapeScore * 0.45 + cornerScore * 0.35 + directionScore * 0.2)
  const clamped = clamp(score)

  return buildDimensionScore('pattern', clamped, factors)
}

/** 气流循环：通风质量、门窗关系、空气流动性 */
function calculateAirFlow(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let ventilation = 60
  let circulation = 60
  let crossWindPenalty = 0

  if (input.features?.ventilation) {
    ventilation = input.features.ventilation.overall || 60
    if (ventilation >= 80) factors.push('通风条件良好，空气新鲜度高')
    else if (ventilation >= 60) factors.push('通风条件一般，建议定期开窗换气')
    else factors.push('通风欠佳，可能需要注意空气流通')
  } else {
    factors.push('未获取通风数据，按默认值评估')
  }

  if (input.spatial) {
    circulation = input.spatial.circulationFlow || 60
    const doorCount = input.spatial.doors?.length || 1
    const windowCount = input.spatial.windows?.length || 0

    if (doorCount >= 2 && windowCount >= 2) {
      // 可能形成穿堂风
      const hasDirectPath = checkDirectWindPath(input.spatial)
      if (hasDirectPath) {
        crossWindPenalty = 15
        factors.push('门窗可能存在直通路径，气流易直进直出')
      } else {
        factors.push('门窗分布较合理，气流可在室内回旋')
      }
    }
  }

  const score = clamp(Math.round(ventilation * 0.5 + circulation * 0.4 - crossWindPenalty))

  if (score < 50) factors.push('整体气流循环偏弱，建议优化门窗关系')
  else if (score >= 80) factors.push('气流循环状态良好')

  return buildDimensionScore('airFlow', score, factors)
}

/** 藏风聚气：气场聚集、明堂状态、能量留存 */
function calculateWindQi(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let qiGathering = 60
  let mingHall = 60
  let storing = 60

  if (input.features?.qi) {
    qiGathering = input.features.qi.gathering || 60
    storing = input.features.qi.storing || 60
    if (qiGathering >= 80) factors.push('气场聚集能力良好，生气可在室内停留')
    else factors.push('聚气能力一般，可能需通过布局增强能量留存')
  }

  if (input.spatial) {
    mingHall = input.spatial.qiGathering || 60
    const centerArea = input.spatial.house?.centerArea
    if (centerArea) {
      if (centerArea.obstructed) {
        mingHall -= 15
        factors.push('中宫区域可能存在遮挡，影响整体聚气')
      } else {
        factors.push('中宫开阔，有助于整体气场稳定')
      }
    }
  }

  const score = clamp(Math.round(qiGathering * 0.45 + mingHall * 0.35 + storing * 0.2))
  return buildDimensionScore('windQi', score, factors)
}

/** 采光质量：自然采光、照明层次、阴阳平衡 */
function calculateLighting(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let naturalLight = 60
  let roomLighting = 60

  if (input.features?.lighting) {
    naturalLight = input.features.lighting.overall || 60
    if (naturalLight >= 80) factors.push('自然采光充足，空间明亮舒适')
    else if (naturalLight >= 60) factors.push('自然采光尚可，部分区域可能需要补光')
    else factors.push('自然采光偏弱，建议增加人工照明或调整窗帘')
  }

  if (input.rooms?.dimensionSummary) {
    roomLighting = input.rooms.dimensionSummary.lighting || 60
  }

  const hasDarkRoom = input.features?.lighting?.hasDarkRoom
  if (hasDarkRoom) {
    factors.push('存在采光不足的房间，可能影响居住舒适度')
  }

  const score = clamp(Math.round(naturalLight * 0.6 + roomLighting * 0.4))
  return buildDimensionScore('lighting', score, factors)
}

/** 财位质量：财位定位、通畅度、聚财能力 */
function calculateWealth(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let fortuneWealth = 60
  let layoutScore = 60

  if (input.features?.fortune) {
    fortuneWealth = input.features.fortune.wealth || 60
    if (fortuneWealth >= 80) factors.push('财运指数较高，空间布局通常有助于聚财')
    else if (fortuneWealth >= 60) factors.push('财运指数中等，可通过调整财位提升')
    else factors.push('财运指数偏低，建议重点关注财位布置')
  }

  if (input.rooms?.rooms) {
    const livingRoom = input.rooms.rooms.find((r: any) => r.roomType === 'living')
    if (livingRoom) {
      layoutScore = livingRoom.overallScore || 60
      if (layoutScore >= 75) factors.push('客厅布局良好，财位通常较为通畅')
    }
  }

  // 检查是否有财位受压的规则命中
  const wealthRules = input.ruleResults?.filter((r: any) =>
    r.ruleId?.includes('wealth') || r.category === 'wealth'
  )
  if (wealthRules?.length > 0) {
    const matchedWealth = wealthRules.filter((r: any) => r.matched)
    if (matchedWealth.length > 0) {
      factors.push(`命中 ${matchedWealth.length} 条财位相关规则，建议结合具体位置分析`)
    }
  }

  const score = clamp(Math.round(fortuneWealth * 0.6 + layoutScore * 0.4))
  return buildDimensionScore('wealth', score, factors)
}

/** 健康影响：环境健康度、卧室状态、五行调和 */
function calculateHealth(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let fortuneHealth = 65
  let bedroomScore = 60
  let envScore = 60

  if (input.features?.fortune) {
    fortuneHealth = input.features.fortune.health || 65
  }

  if (input.rooms?.rooms) {
    const bedrooms = input.rooms.rooms.filter((r: any) =>
      r.roomType?.includes('bedroom')
    )
    if (bedrooms.length > 0) {
      bedroomScore = Math.round(
        bedrooms.reduce((sum: number, r: any) => sum + (r.overallScore || 60), 0) / bedrooms.length
      )
      if (bedroomScore >= 75) factors.push('卧室布局良好，有助于休息与恢复')
      else factors.push('卧室布局有优化空间，可能间接影响睡眠质量')
    }
  }

  if (input.features?.ventilation && input.features?.lighting) {
    envScore = Math.round((input.features.ventilation.overall + input.features.lighting.overall) / 2)
  }

  // 检查卫生间位置相关规则
  const bathroomRules = input.ruleResults?.filter((r: any) =>
    r.category === 'bathroom' || r.ruleId?.includes('bathroom')
  )
  if (bathroomRules?.some((r: any) => r.matched && r.severity === 'severe')) {
    factors.push('卫生间相关规则命中严重项，可能对健康产生不利影响')
  }

  const score = clamp(Math.round(fortuneHealth * 0.4 + bedroomScore * 0.35 + envScore * 0.25))
  return buildDimensionScore('health', score, factors)
}

/** 事业影响：书房状态、朝向助力、事业运势 */
function calculateCareer(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let fortuneCareer = 60
  let studyRoomScore = 60
  let directionScore = 60

  if (input.features?.fortune) {
    fortuneCareer = input.features.fortune.career || 60
    if (fortuneCareer >= 80) factors.push('事业运势指数较高，空间环境通常有助于专注与发展')
    else factors.push('事业运势指数一般，建议优化书房与办公区域')
  }

  if (input.rooms?.rooms) {
    const study = input.rooms.rooms.find((r: any) => r.roomType === 'study')
    if (study) {
      studyRoomScore = study.overallScore || 60
      factors.push('存在独立书房，布局合理性纳入事业评分')
    } else {
      factors.push('未识别到独立书房，以整体房间均分参考')
      studyRoomScore = input.rooms.average || 60
    }
  }

  if (input.userProvided?.orientation) {
    const goodDirections = ['south', 'southeast', 'east']
    directionScore = goodDirections.includes(input.userProvided.orientation) ? 78 : 65
    factors.push(`朝向为${input.userProvided.orientation}，结合传统风水理论对事业影响需具体分析`)
  }

  const score = clamp(Math.round(fortuneCareer * 0.5 + studyRoomScore * 0.3 + directionScore * 0.2))
  return buildDimensionScore('career', score, factors)
}

/** 家庭关系：感情运势、客厅和谐度、公私分区 */
function calculateFamily(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let relationship = 65
  let livingRoomScore = 60

  if (input.features?.fortune) {
    relationship = input.features.fortune.relationship || 65
    if (relationship >= 80) factors.push('感情运势指数良好，家庭氛围通常较为和睦')
    else factors.push('感情运势指数一般，建议关注公共区域的温馨布置')
  }

  if (input.rooms?.rooms) {
    const living = input.rooms.rooms.find((r: any) => r.roomType === 'living')
    if (living) {
      livingRoomScore = living.overallScore || 60
      if (livingRoomScore >= 75) factors.push('客厅布局利于家人交流互动')
    }
  }

  const score = clamp(Math.round(relationship * 0.6 + livingRoomScore * 0.4))
  return buildDimensionScore('family', score, factors)
}

/** 五行平衡：元素分布、相生相克、调和度 */
function calculateElements(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let balance = 70

  if (input.features?.fiveElements) {
    balance = input.features.fiveElements.balance || 70
    const dominant = input.features.fiveElements.dominant
    const weakest = input.features.fiveElements.weakest
    if (balance >= 85) factors.push('五行分布均衡，环境和谐度高')
    else if (balance >= 65) factors.push(`五行略有偏颇，${dominant}偏旺、${weakest}偏弱，可通过软装调和`)
    else factors.push('五行失衡较明显，建议系统调理')
  } else {
    factors.push('未获取五行数据，按默认值评估')
  }

  const score = clamp(balance)
  return buildDimensionScore('elements', score, factors)
}

/** 空间整洁度：杂物程度、收纳状况、视觉秩序 */
function calculateCleanliness(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let score = 65

  // 通过房间评分与问题数量间接推断整洁度
  if (input.rooms?.rooms) {
    const avgScore = input.rooms.average || 65
    const issueCount = input.rooms.rooms.reduce(
      (sum: number, r: any) => sum + (r.issues?.length || 0), 0
    )
    score = Math.round(avgScore - issueCount * 3)
  }

  if (input.ruleResults) {
    const clutterRules = input.ruleResults.filter((r: any) =>
      r.matched && (r.description?.includes('杂乱') || r.description?.includes('堆积'))
    )
    if (clutterRules.length > 0) {
      score -= clutterRules.length * 5
      factors.push(`识别到 ${clutterRules.length} 处杂乱堆积问题，影响空间整洁度`)
    }
  }

  if (factors.length === 0) {
    if (score >= 75) factors.push('空间整体较为整洁，视觉秩序良好')
    else factors.push('空间整洁度一般，建议定期整理收纳')
  }

  return buildDimensionScore('cleanliness', clamp(score), factors)
}

/** 动静分区：卧室静谧度、活动区隔离、噪音控制 */
function calculateActivityQuiet(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let score = 65

  if (input.rooms?.rooms) {
    const quietRooms = input.rooms.rooms.filter((r: any) =>
      ['bedroom', 'master-bedroom', 'children-bedroom', 'elder-bedroom', 'study'].includes(r.roomType)
    )
    const activeRooms = input.rooms.rooms.filter((r: any) =>
      ['living', 'kitchen', 'dining'].includes(r.roomType)
    )

    if (quietRooms.length > 0 && activeRooms.length > 0) {
      // 简单判断：如果动静房间数量都有，认为分区基本合理
      score = 75
      factors.push('动静区域均有独立空间，分区较为明确')
    } else if (quietRooms.length === 0) {
      score = 50
      factors.push('未识别到明显静区（卧室/书房），动静分区可能不足')
    } else {
      factors.push('以现有房间结构评估动静分区')
    }

    // 检查卧室是否靠近动区
    const bedroomNearKitchen = input.ruleResults?.some((r: any) =>
      r.matched && r.description?.includes('卧室') && r.description?.includes('厨房')
    )
    if (bedroomNearKitchen) {
      score -= 12
      factors.push('卧室与厨房位置关系较近，可能影响静区私密性')
    }
  }

  return buildDimensionScore('activityQuiet', clamp(score), factors)
}

/** 煞气指数：煞气数量、严重程度、化解可能性（反向计分） */
function calculateShaQi(input: ScoreEngineInput): DimensionScore {
  const factors: string[] = []
  let penalty = 0

  if (input.ruleResults) {
    const shaRules = input.ruleResults.filter((r: any) =>
      r.matched && (r.severity === 'critical' || r.severity === 'severe' || r.severity === 'significant')
    )
    const criticalCount = shaRules.filter((r: any) => r.severity === 'critical').length
    const severeCount = shaRules.filter((r: any) => r.severity === 'severe').length
    const significantCount = shaRules.filter((r: any) => r.severity === 'significant').length

    penalty = criticalCount * 25 + severeCount * 15 + significantCount * 8

    if (criticalCount > 0) factors.push(`发现 ${criticalCount} 项严重煞气，需立即关注`)
    if (severeCount > 0) factors.push(`发现 ${severeCount} 项较严重煞气，建议优先化解`)
    if (significantCount > 0) factors.push(`发现 ${significantCount} 项显著问题，宜逐步改善`)
  }

  if (input.spatial?.spatialSha?.length > 0) {
    penalty += input.spatial.spatialSha.length * 5
    factors.push(`空间分析识别到 ${input.spatial.spatialSha.length} 处煞气`)
  }

  if (factors.length === 0) {
    factors.push('未识别到明显煞气，空间环境相对平和')
  }

  // 煞气指数是反向计分：煞气越多，分数越低
  const score = clamp(100 - penalty)
  return buildDimensionScore('shaQi', score, factors)
}

// ═══════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════

function buildDimensionScore(
  dimension: ScoreDimension12D,
  score: number,
  factors: string[]
): DimensionScore {
  const weight = DIMENSION_WEIGHTS[dimension]
  const level = getLevelFromScore(score)

  const descriptions: Record<string, Record<string, string>> = {
    pattern: {
      '优': '户型方正，结构均衡，气场分布均匀，为理想格局。',
      '良': '户型基本方正，个别区域略有不足，整体气场流通顺畅。',
      '平': '户型存在一定不规则，部分区域气场可能受阻，建议适当调整。',
      '差': '户型缺陷较明显，气场分布不均，需重点关注结构调整。',
    },
    airFlow: {
      '优': '气流循环良好，通风适中，无明显穿堂风散气现象。',
      '良': '气流整体尚可，局部区域通风略强或略弱，可通过软装微调。',
      '平': '气流存在一定问题，可能出现局部滞气或穿堂风，建议优化门窗关系。',
      '差': '气流循环较弱或散气严重，需系统性改善通风与隔断设计。',
    },
    windQi: {
      '优': '藏风聚气效果良好，明堂开阔，生气可在室内有效聚集。',
      '良': '聚气条件较好，局部区域能量略有散失，可进一步优化。',
      '平': '聚气能力一般，部分区域可能存在气场外泄，建议增设屏风或隔断。',
      '差': '聚气效果偏弱，明堂或中宫可能受压，需系统调理。',
    },
    lighting: {
      '优': '采光充足，照明层次丰富，阴阳平衡良好。',
      '良': '采光条件较好，局部区域可补充人工照明以提升舒适度。',
      '平': '采光存在一定不足，部分空间可能偏暗，建议调整窗帘或增加光源。',
      '差': '光线条件较差，可能影响居住舒适度与情绪，需重点改善。',
    },
    wealth: {
      '优': '财位定位清晰，通畅无阻，聚财能力较强。',
      '良': '财位条件尚可，局部可能存在轻微压制，适当调整即可。',
      '平': '财位表现一般，建议清理杂物并优化客厅布局以提升财运。',
      '差': '财位受压或定位不明，聚财能力偏弱，需重点规划。',
    },
    health: {
      '优': '环境健康度高，卧室舒适，五行调和，利于身心恢复。',
      '良': '健康影响总体良好，个别房间或环境因子可优化。',
      '平': '健康影响表现中等，建议关注卧室通风与卫生间位置关系。',
      '差': '环境可能存在较多不利于健康的因素，建议系统排查。',
    },
    career: {
      '优': '事业运势受空间环境正向支撑，办公与思考区域布局合理。',
      '良': '事业影响总体良好，书房或办公区可进一步优化。',
      '平': '事业运势受空间影响一般，建议关注书桌朝向与光线。',
      '差': '空间环境对事业发展的支撑偏弱，需重点调整办公区域。',
    },
    family: {
      '优': '家庭氛围和睦，公共区域利于交流，私密空间界限清晰。',
      '良': '家庭关系受空间影响良好，客厅布置温馨，卧室安静。',
      '平': '家庭关系表现一般，建议优化公共区域以促进家人互动。',
      '差': '空间布局可能对家庭关系产生不利影响，建议调整公私分区。',
    },
    elements: {
      '优': '五行分布均衡，相生关系顺畅，环境能量和谐。',
      '良': '五行基本平衡，个别元素略强或略弱，可通过软装调和。',
      '平': '五行存在一定失衡，建议通过色彩与材质补充不足元素。',
      '差': '五行失衡较明显，需系统调理以恢复环境能量平衡。',
    },
    cleanliness: {
      '优': '空间整洁有序，视觉清爽，气场流通不受阻碍。',
      '良': '整体较为整洁，个别区域可进一步整理收纳。',
      '平': '空间整洁度一般，杂物可能对局部气场产生轻微影响。',
      '差': '空间杂乱较为明显，建议彻底整理以改善气场流通。',
    },
    activityQuiet: {
      '优': '动静分区明确，卧室安静，活动区与休息区互不干扰。',
      '良': '动静分区基本合理，个别区域隔音或私密性可提升。',
      '平': '动静分区存在一定模糊，休息区可能受到动区影响。',
      '差': '动静分区不明显，休息质量可能受到明显干扰，建议重新规划。',
    },
    shaQi: {
      '优': '煞气指数极低，空间环境平和，未发现明显不利因素。',
      '良': '煞气较少，个别轻微问题不影响大局。',
      '平': '存在一定煞气，建议按优先级逐步化解。',
      '差': '煞气指数较高，存在多项需要关注的不利因素，宜尽早处理。',
    },
  }

  const desc = descriptions[dimension]?.[level] || '该维度评分已生成，建议结合实际情况参考。'

  return {
    dimension,
    name: DIMENSION_NAMES[dimension],
    score,
    weight,
    weightedScore: Math.round((score * weight) / 100),
    level,
    description: desc,
    factors: factors.length > 0 ? factors : ['基于现有数据综合评估'],
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

/** 检查是否存在门窗直通路径（简化判断） */
function checkDirectWindPath(spatial: any): boolean {
  const doors = spatial.doors || []
  const windows = spatial.windows || []
  if (doors.length >= 2) {
    // 两个门可能形成穿堂
    return true
  }
  if (doors.length >= 1 && windows.length >= 2) {
    // 门对窗可能形成直通
    const mainDoor = doors.find((d: any) => d.type === 'main-entrance')
    if (mainDoor && windows.length >= 2) return true
  }
  return false
}

// ═══════════════════════════════════════════════
// V3.0 降级策略
// ═══════════════════════════════════════════════

/**
 * 当12维评分计算失败时，降级到 V3.0 八维评分并映射为12维结果
 */
function fallbackTo8D(input: ScoreEngineInput): Score12DResult {
  const score8D = calculateScore8D(input)
  const dims8D = score8D.dimensions

  // 将8维映射到12维
  const dimensions = {} as Record<ScoreDimension12D, DimensionScore>

  // 直接映射
  dimensions.pattern = buildDimensionScore(
    'pattern',
    clamp(dims8D.pattern.score),
    ['基于 V3.0 格局评分映射']
  )
  dimensions.lighting = buildDimensionScore(
    'lighting',
    clamp(dims8D.lighting.score),
    ['基于 V3.0 光线评分映射']
  )
  dimensions.elements = buildDimensionScore(
    'elements',
    clamp(dims8D.elementHarmony.score),
    ['基于 V3.0 五行协调评分映射']
  )
  dimensions.activityQuiet = buildDimensionScore(
    'activityQuiet',
    clamp(dims8D.flowPath.score),
    ['基于 V3.0 动线评分映射']
  )

  // 拆分/合并映射
  dimensions.airFlow = buildDimensionScore(
    'airFlow',
    clamp(dims8D.windGathering.score),
    ['基于 V3.0 藏风评分映射']
  )
  dimensions.windQi = buildDimensionScore(
    'windQi',
    clamp(Math.round((dims8D.windGathering.score + dims8D.qiGathering.score) / 2)),
    ['基于 V3.0 藏风与聚气评分综合映射']
  )

  // 基于 fortune 数据或 overallScore 映射
  const overall = score8D.overallScore
  const fortune = input.features?.fortune

  dimensions.wealth = buildDimensionScore(
    'wealth',
    clamp(fortune?.wealth ?? overall),
    ['基于 V3.0 综合评分映射']
  )
  dimensions.health = buildDimensionScore(
    'health',
    clamp(fortune?.health ?? overall),
    ['基于 V3.0 综合评分映射']
  )
  dimensions.career = buildDimensionScore(
    'career',
    clamp(fortune?.career ?? overall),
    ['基于 V3.0 综合评分映射']
  )
  dimensions.family = buildDimensionScore(
    'family',
    clamp(fortune?.relationship ?? overall),
    ['基于 V3.0 综合评分映射']
  )

  // 基于 advice 反向估算
  const adviceScore = dims8D.advice.score
  dimensions.cleanliness = buildDimensionScore(
    'cleanliness',
    clamp(adviceScore),
    ['基于 V3.0 建议评分映射']
  )

  // 煞气指数基于问题数量反向估算
  const issueCount = Math.max(0, Math.round((100 - adviceScore) / 8))
  dimensions.shaQi = buildDimensionScore(
    'shaQi',
    clamp(100 - issueCount * 8),
    ['基于 V3.0 建议评分反向估算']
  )

  const level = getLevelFromScore(overall)
  const summary = generate12DSummary({ dimensions, overall, level })

  return {
    dimensions,
    overall,
    level,
    summary,
  }
}
