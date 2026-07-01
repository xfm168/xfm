/**
 * 卧室分析器 (Bedroom Engine)
 * 
 * 负责：
 * - 床位
 * - 睡眠
 * - 健康
 * - 桃花
 * - 子女
 * - 夫妻
 */

import type { RoomEngineInput, RoomAnalysisResult, RoomIssue } from '../types'

export function analyzeBedroom(input: RoomEngineInput): RoomAnalysisResult {
  const issues: RoomIssue[] = []
  const strengths: string[] = []
  const suggestions: string[] = []
  
  // 1. 采光分析
  const lightingScore = calculateLightingScore(input, issues, strengths)
  
  // 2. 通风分析
  const ventilationScore = calculateVentilationScore(input, issues, strengths)
  
  // 3. 空间分析
  const spaceScore = calculateSpaceScore(input, issues, strengths)
  
  // 4. 布局分析
  const layoutScore = calculateLayoutScore(input, issues, strengths, suggestions)
  
  // 5. 风水吉凶
  const fengShuiScore = calculateFengShuiScore(input, issues, strengths, suggestions)
  
  // 综合评分
  const overallScore = Math.round(
    lightingScore * 0.15 +
    ventilationScore * 0.15 +
    spaceScore * 0.2 +
    layoutScore * 0.25 +
    fengShuiScore * 0.25
  )
  
  return {
    roomId: input.roomId,
    roomType: input.roomType,
    roomName: input.roomName || (input.roomType === 'master-bedroom' ? '主卧' : '卧室'),
    overallScore,
    dimensionScores: {
      lighting: lightingScore,
      ventilation: ventilationScore,
      space: spaceScore,
      layout: layoutScore,
      fengShui: fengShuiScore,
    },
    strengths,
    issues,
    suggestions,
    relevantRules: [],
    confidence: 80,
    element: '木',
    direction: input.spatial.direction,
  }
}

function calculateLightingScore(input: RoomEngineInput, issues: RoomIssue[], strengths: string[]): number {
  let score = 60
  
  if (input.spatial.hasWindow) {
    score += 20
    strengths.push('卧室有窗户，采光良好')
  } else {
    issues.push({
      type: 'lighting',
      severity: 'moderate',
      description: '卧室无窗户，采光不足',
      suggestion: '增加人工照明，选择暖色调灯光',
    })
  }
  
  if (input.spatial.windowCount >= 2) {
    score += 10
  }
  
  return Math.min(100, score)
}

function calculateVentilationScore(input: RoomEngineInput, issues: RoomIssue[], strengths: string[]): number {
  let score = 60
  
  if (input.spatial.hasWindow) {
    score += 25
    strengths.push('卧室通风良好')
  } else {
    issues.push({
      type: 'ventilation',
      severity: 'moderate',
      description: '卧室通风不佳，容易积聚浊气',
      suggestion: '安装新风系统或使用空气净化器',
    })
  }
  
  if (input.spatial.hasBalcony) {
    score += 10
  }
  
  return Math.min(100, score)
}

function calculateSpaceScore(input: RoomEngineInput, issues: RoomIssue[], strengths: string[]): number {
  let score = 70
  const area = input.spatial.area
  
  if (area >= 15) {
    score += 15
    strengths.push('卧室空间宽敞')
  } else if (area >= 10) {
    score += 5
  } else {
    issues.push({
      type: 'space',
      severity: 'mild',
      description: '卧室空间偏小，容易有压迫感',
      suggestion: '使用浅色家具和墙面，增加空间感',
    })
  }
  
  if (input.spatial.shape === 'square' || input.spatial.shape === 'rectangle') {
    score += 10
  } else {
    score -= 10
  }
  
  return Math.max(0, Math.min(100, score))
}

function calculateLayoutScore(input: RoomEngineInput, issues: RoomIssue[], strengths: string[], suggestions: string[]): number {
  let score = 70
  
  const bed = input.furniture.find(f => f.type === 'bed')
  const mirror = input.furniture.find(f => f.type.includes('mirror'))
  const wardrobe = input.furniture.find(f => f.type === 'wardrobe')
  
  // 检查床位
  if (bed) {
    // 床头靠墙
    if (bed.position.x < 0.5 || bed.position.x > 9.5 || 
        bed.position.y < 0.5 || bed.position.y > 9.5) {
      score += 10
      strengths.push('床头靠墙，有靠山')
    }
    
    // 床不对门
    const door = input.doors.find(d => d.type === 'main')
    if (door) {
      const bedFacingDoor = Math.abs(Number(bed.direction) - Number(door.direction)) < 45
      if (bedFacingDoor) {
        score -= 15
        issues.push({
          type: 'sha-qi',
          severity: 'mild',
          description: '床正对房门，缺乏安全感',
          suggestion: '调整床位或设置屏风遮挡',
          caseId: 'case-chuang-dui-men',
        })
      }
    }
  }
  
  // 镜子不对床
  if (mirror && bed) {
    score -= 10
    issues.push({
      type: 'sha-qi',
      severity: 'mild',
      description: '镜子正对床，夜半容易惊吓',
      suggestion: '调整镜子位置或用布帘遮挡',
      caseId: 'case-jing-zi-dui-chuang',
    })
  }
  
  return Math.max(0, Math.min(100, score))
}

function calculateFengShuiScore(input: RoomEngineInput, issues: RoomIssue[], strengths: string[], suggestions: string[]): number {
  let score = 70
  
  // 梁压床检测
  const bed = input.furniture.find(f => f.type === 'bed')
  const beams = input.structural.filter(s => s.type === 'beam')
  
  if (bed && beams.length > 0) {
    for (const beam of beams) {
      const dist = Math.sqrt(
        Math.pow(bed.position.x - beam.position.x, 2) + 
        Math.pow(bed.position.y - beam.position.y, 2)
      )
      if (dist < 2) {
        score -= 25
        issues.push({
          type: 'sha-qi',
          severity: 'moderate',
          description: '床上方有横梁压迫',
          suggestion: '吊顶遮挡或调整床位',
          caseId: 'case-beam-press',
        })
        break
      }
    }
  }
  
  // 卧室靠近卫生间不好
  const nearBathroom = input.relations.some(r => 
    r.targetRoomType === 'bathroom' && r.distance < 3
  )
  if (nearBathroom) {
    score -= 10
    issues.push({
      type: 'position',
      severity: 'mild',
      description: '卧室靠近卫生间，湿气较重',
      suggestion: '保持卫生间干燥通风，使用除湿机',
    })
  }
  
  // 卧室朝南好
  if (input.spatial.direction === 'south') {
    score += 10
    strengths.push('卧室朝南，阳光充足')
  }
  
  return Math.max(0, Math.min(100, score))
}
