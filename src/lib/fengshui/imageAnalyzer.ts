/**
 * 风水图片识别 - 类型定义
 * 
 * 流程：上传图片 → AI识别 → 转换为FengShuiContext → executeRules → 输出结果
 */

import type { FengShuiContext, Room, Furniture, Direction, FiveElement } from './types'

// ============ 识别的物体类型 ============

export type DetectedObjectType =
  | 'door'           // 门
  | 'window'         // 窗户
  | 'bed'            // 床
  | 'sofa'           // 沙发
  | 'desk'           // 书桌/办公桌
  | 'stove'          // 灶台
  | 'mirror'         // 镜子
  | 'fortune-position' // 财神位
  | 'beam'           // 横梁
  | 'corridor'       // 通道
  | 'light'          // 光照
  | 'plant'          // 植物
  | 'aquarium'       // 鱼缸
  | 'wardrobe'       // 衣柜
  | 'tv'             // 电视

export interface DetectedObject {
  type: DetectedObjectType
  confidence: number           // 识别置信度 0-100
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  direction?: Direction       // 物体朝向
  position?: 'left' | 'right' | 'center' | 'corner'
}

// ============ 图片分析请求 ============

export interface ImageAnalysisRequest {
  imageData: string          // Base64编码的图片
  imageUrl?: string          // 或者图片URL
  analysisType: 'room' | 'layout' | 'furniture' | 'full'
  options?: {
    includeDirections?: boolean
    includeElementAnalysis?: boolean
    roomType?: string
  }
}

// ============ 图片分析结果 ============

export interface ImageAnalysisResult {
  // 识别的物体
  detectedObjects: DetectedObject[]
  
  // 房间信息
  roomInfo: {
    type: string
    size: string
    hasNaturalLight: boolean
    mainDirection: Direction
    shape: 'square' | 'rectangle' | 'irregular' | 'L-shape'
  }
  
  // 家具列表
  furniture: Furniture[]
  
  // 五行分布推断
  elementDistribution: Record<FiveElement, number>
  
  // 识别的置信度
  overallConfidence: number
  
  // 原始识别结果（用于调试）
  rawResult?: any
  
  // 错误信息
  error?: string
}

// ============ 完整风水报告 ============

export interface FengShuiReport {
  // 分析ID
  id: string
  createdAt: string
  
  // 原始输入
  input: {
    imageData?: string
    imageUrl?: string
    manualInput?: Partial<FengShuiContext>
  }
  
  // 图片分析结果
  imageAnalysis: ImageAnalysisResult
  
  // 风水分析结果
  fengshuiAnalysis: {
    context: FengShuiContext
    result: any  // FengShuiResult
  }
  
  // AI改善建议
  aiSuggestions: {
    summary: string
    priorities: {
      priority: number
      issue: string
      suggestion: string
      reason: string
    }[]
    tips: string[]
  }
  
  // 完整报告（富文本）
  report: {
    title: string
    sections: {
      id?: string
      title: string
      content: string
      order?: number
      type: 'summary' | 'info' | 'analysis' | 'risk' | 'evidence' | 'suggestion' | 'warning'
      data?: any
    }[]
  }
  
  // 状态
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  error?: string
}

// ============ AI识别提示词 ============

export const ROOM_ANALYSIS_PROMPT = `你是一个专业的风水图像识别AI。请分析这张图片并识别以下风水相关元素：

需要识别的物体（如果存在）：
1. 门（door）- 包括大门、房门、阳台门
2. 窗户（window）- 窗户位置和大小
3. 床（bed）- 床的位置、朝向、是否靠墙
4. 沙发（sofa）- 客厅沙发位置
5. 书桌（desk）- 书桌或办公桌位置
6. 灶台（stove）- 厨房灶台位置
7. 镜子（mirror）- 镜子的位置
8. 财神位（fortune-position）- 财神或招财物品
9. 横梁（beam）- 天花板横梁位置
10. 通道（corridor）- 房间通道
11. 光照（light）- 自然光来源和强度

请按以下JSON格式输出：
{
  "detectedObjects": [
    {
      "type": "door|window|bed|sofa|desk|stove|mirror|fortune-position|beam|corridor|light",
      "confidence": 0-100,
      "position": "left|right|center|corner",
      "direction": "north|south|east|west|northeast|northwest|southeast|southwest"
    }
  ],
  "roomInfo": {
    "type": "客厅|卧室|厨房|书房|餐厅|卫生间",
    "size": "small|medium|large",
    "hasNaturalLight": true|false,
    "mainDirection": "north|south|east|west",
    "shape": "square|rectangle|irregular|L-shape"
  },
  "elementAnalysis": {
    "wood": 0-5,
    "fire": 0-5,
    "earth": 0-5,
    "metal": 0-5,
    "water": 0-5
  },
  "confidence": 0-100
}

只输出JSON，不要输出其他内容。`

// ============ 转换为FengShuiContext ============

export function convertToFengShuiContext(
  analysis: ImageAnalysisResult,
  additionalContext?: Partial<FengShuiContext>
): FengShuiContext {
  // 从识别的物体构建房间列表
  const rooms: Room[] = []
  
  const doorObjects = analysis.detectedObjects.filter(o => o.type === 'door')
  const windowObjects = analysis.detectedObjects.filter(o => o.type === 'window')
  const bedObjects = analysis.detectedObjects.filter(o => o.type === 'bed')
  const sofaObjects = analysis.detectedObjects.filter(o => o.type === 'sofa')
  const deskObjects = analysis.detectedObjects.filter(o => o.type === 'desk')
  const stoveObjects = analysis.detectedObjects.filter(o => o.type === 'stove')
  const mirrorObjects = analysis.detectedObjects.filter(o => o.type === 'mirror')
  
  // 构建主房间
  const mainRoom: Room = {
    type: mapRoomType(analysis.roomInfo.type),
    size: mapRoomSize(analysis.roomInfo.size),
    direction: analysis.roomInfo.mainDirection || 'south',
    position: determineRoomPosition(doorObjects, windowObjects),
    hasWindow: windowObjects.length > 0,
    hasBalcony: doorObjects.some(o => o.position === 'center'),
    floor: additionalContext?.currentFloor || 1,
    furniture: [
      ...bedObjects.map(o => convertToFurniture(o, 'bed')),
      ...sofaObjects.map(o => convertToFurniture(o, 'sofa')),
      ...deskObjects.map(o => convertToFurniture(o, 'desk')),
      ...mirrorObjects.map(o => convertToFurniture(o, 'mirror')),
    ],
    element: inferRoomElement(bedObjects, sofaObjects, mirrorObjects),
  }
  
  rooms.push(mainRoom)
  
  // 构建五行分布
  const elementDistribution = analysis.elementDistribution || {
    '木': 2,
    '火': 2,
    '土': 2,
    '金': 2,
    '水': 2,
  }
  
  // 检测到的物体作为环境因素
  const hasBeam = analysis.detectedObjects.some(o => o.type === 'beam')
  const hasFortunePosition = analysis.detectedObjects.some(o => o.type === 'fortune-position')
  const corridorCount = analysis.detectedObjects.filter(o => o.type === 'corridor').length
  
  return {
    houseType: 'apartment',
    houseAge: additionalContext?.houseAge || 5,
    totalFloors: additionalContext?.totalFloors || 30,
    currentFloor: additionalContext?.currentFloor || 10,
    totalArea: additionalContext?.totalArea || 100,
    
    direction: {
      mainDirection: analysis.roomInfo.mainDirection || 'south',
      facingDirection: getOppositeDirection(analysis.roomInfo.mainDirection || 'south'),
      doorDirection: doorObjects[0]?.direction || 'south',
    },
    
    layout: {
      shape: analysis.roomInfo.shape as any,
      score: calculateLayoutScore(analysis),
      missingCorners: [],
      totalArea: additionalContext?.totalArea || 100,
      usableArea: (additionalContext?.totalArea || 100) * 0.9,
    },
    
    rooms,
    
    elementDistribution: elementDistribution as any,
    
    nearbyRoads: corridorCount,
    nearbyTJunction: false,
    nearbyPole: false,
    nearWater: false,
    nearMountain: false,
    
    ownerBazi: additionalContext?.ownerBazi,
  }
}

// ============ 辅助函数 ============

function mapRoomType(type: string): Room['type'] {
  const mapping: Record<string, Room['type']> = {
    '客厅': 'living',
    '卧室': 'master-bedroom',
    '厨房': 'kitchen',
    '书房': 'study',
    '餐厅': 'dining',
    '卫生间': 'bathroom',
    '主卧': 'master-bedroom',
    '次卧': 'secondary-bedroom',
    '儿童房': 'children-bedroom',
  }
  return mapping[type] || 'living'
}

function mapRoomSize(size: string): number {
  const mapping: Record<string, number> = {
    'small': 10,
    'medium': 20,
    'large': 40,
  }
  return mapping[size] || 20
}

function determineRoomPosition(
  doors: DetectedObject[],
  windows: DetectedObject[]
): Room['position'] {
  if (doors.length === 0 && windows.length === 0) return 'center'
  
  const leftCount = [...doors, ...windows].filter(o => o.position === 'left').length
  const rightCount = [...doors, ...windows].filter(o => o.position === 'right').length
  
  if (leftCount > rightCount) return 'left'
  if (rightCount > leftCount) return 'right'
  return 'center'
}

function convertToFurniture(obj: DetectedObject, type: Furniture['type']): Furniture {
  const furnitureTypeMapping: Record<string, Furniture['type']> = {
    'bed': 'bed',
    'sofa': 'sofa',
    'desk': 'desk',
    'mirror': 'mirror' as any,
  }
  
  return {
    type: furnitureTypeMapping[type as string] || type,
    direction: obj.direction || 'south',
    position: (obj.position || 'center') as any,
  }
}

function inferRoomElement(
  beds: DetectedObject[],
  sofas: DetectedObject[],
  mirrors: DetectedObject[]
): FiveElement {
  // 根据主要家具推断房间五行
  if (beds.length > 0) return '木'  // 木主卧室
  if (sofas.length > 0) return '火'  // 火主客厅
  if (mirrors.length > 0) return '金'  // 金主反射、镜子
  return '土'
}

function getOppositeDirection(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    north: 'south',
    south: 'north',
    east: 'west',
    west: 'east',
    northeast: 'southwest',
    southwest: 'northeast',
    northwest: 'southeast',
    southeast: 'northwest',
    center: 'center',
  }
  return opposites[dir]
}

function calculateLayoutScore(analysis: ImageAnalysisResult): number {
  let score = 70
  
  // 根据房间形状调整
  if (analysis.roomInfo.shape === 'square') score += 15
  else if (analysis.roomInfo.shape === 'rectangle') score += 10
  else if (analysis.roomInfo.shape === 'L-shape') score -= 10
  else score -= 20
  
  // 根据采光调整
  if (analysis.roomInfo.hasNaturalLight) score += 10
  
  // 根据识别置信度调整
  if (analysis.overallConfidence < 50) score -= 10
  else if (analysis.overallConfidence > 80) score += 5
  
  return Math.max(0, Math.min(100, score))
}
