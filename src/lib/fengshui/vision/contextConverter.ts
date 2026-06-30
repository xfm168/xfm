/**
 * 图片分析结果 → FengShuiContext 转换器
 * 
 * 将 AI 识别的图片结果转换为规则引擎可用的 FengShuiContext
 */

import type { FengShuiContext } from '../types'
import type {
  ImageAnalysisResult,
  DetectedObject,
  RoomAnalysisResult,
  DetectedSha,
  ElementAnalysisResult,
  VisionToContextResult,
} from './types'

/**
 * 核心转换函数
 */
export function convertToFengShuiContext(
  analysis: ImageAnalysisResult,
  houseInfo?: {
    totalFloors?: number
    currentFloor?: number
    totalArea?: number
    houseType?: any
    houseAge?: number
  }
): VisionToContextResult {
  const warnings: string[] = []
  
  // 1. 提取房间信息
  const roomInfo = analysis.roomInfo
  
  // 2. 构建基本 DirectionInfo
  const direction = {
    mainDirection: roomInfo.mainDirection || 'south',
    facingDirection: roomInfo.mainDirection || 'south', // 假设面向就是主方向
    doorDirection: detectDoorDirection(analysis.detectedObjects),
  }
  
  // 3. 构建 LayoutInfo
  const layout = {
    shape: roomInfo.shape || 'rectangle',
    score: calculateLayoutScore(roomInfo),
    missingCorners: roomInfo.missingCorners || [],
    totalArea: roomInfo.estimatedArea || houseInfo?.totalArea || 100,
    usableArea: (roomInfo.estimatedArea || houseInfo?.totalArea || 100) * 0.8,
  }
  
  // 4. 构建房间列表
  const rooms = buildRooms(analysis, houseInfo)
  
  // 5. 构建五行分布
  const elementDistribution = analysis.elementDistribution || {
    wood: 2, fire: 2, earth: 2, metal: 2, water: 2,
    dominant: '土' as const,
    deficient: '土' as const,
  }
  
  // 6. 检测外部环境（从识别结果推断）
  const nearbyRoads = detectNearbyRoads(analysis.detectedObjects)
  const nearbyTJunction = detectTJunction(analysis.detectedObjects)
  
  // 7. 生成警告
  if (analysis.detectedSha?.length > 0) {
    warnings.push(`检测到 ${analysis.detectedSha.length} 种风水煞气`)
  }
  
  if (layout.shape === 'irregular' || layout.shape === 'L-shape') {
    warnings.push('户型不方正，可能影响气场稳定')
  }
  
  // 8. 构建完整 Context
  const context: FengShuiContext = {
    // 房屋基本信息
    houseType: houseInfo?.houseType || 'apartment',
    houseAge: houseInfo?.houseAge || 5,
    totalFloors: houseInfo?.totalFloors || 30,
    currentFloor: houseInfo?.currentFloor || 10,
    totalArea: houseInfo?.totalArea || layout.totalArea,
    
    // 朝向信息
    direction,
    
    // 户型信息
    layout,
    
    // 房间列表
    rooms,
    
    // 五行分布
    elementDistribution,
    
    // 外部环境
    nearbyRoads,
    nearbyTJunction,
    nearbyPole: false,
    nearWater: false,
    nearMountain: false,
    
    // 扩展：识别结果
    _vision: {
      detectedObjects: analysis.detectedObjects,
      detectedSha: analysis.detectedSha,
      confidence: analysis.confidence,
    },
  }
  
  return {
    context,
    analysis,
    detectedSha: analysis.detectedSha || [],
    elements: analysis.elementDistribution || elementDistribution,
    warnings,
    confidence: analysis.confidence,
  }
}

// ============ 辅助函数 ============

function detectDoorDirection(objects: DetectedObject[]): any {
  const door = objects.find(o => o.type === 'door' || o.type === 'entrance')
  return door?.direction || 'south'
}

function calculateLayoutScore(room: RoomAnalysisResult): number {
  let score = 80
  
  // 形状扣分
  if (room.shape === 'irregular') score -= 20
  else if (room.shape === 'L-shape') score -= 10
  
  // 缺角扣分
  if (room.missingCorners && room.missingCorners.length > 0) {
    score -= room.missingCorners.length * 5
  }
  
  // 光照加分
  if (room.hasNaturalLight) score += 10
  if (room.lightIntensity === 'strong') score += 5
  
  return Math.max(0, Math.min(100, score))
}

function buildRooms(
  analysis: ImageAnalysisResult,
  houseInfo?: any
): FengShuiContext['rooms'] {
  const rooms: any[] = []
  
  // 从识别的物体推断房间
  const detected = analysis.detectedObjects || []
  
  // 客厅
  const hasLiving = detected.some(o => o.type === 'living-room' || o.type === 'sofa')
  if (hasLiving || detected.length > 0) {
    rooms.push({
      id: 'living-1',
      type: 'living',
      size: detectRoomSize(detected, 'living-room'),
      direction: analysis.roomInfo.mainDirection || 'south',
      position: 'center',
      hasWindow: detected.some(o => o.type === 'window'),
      hasBalcony: detected.some(o => o.type === 'balcony'),
      floor: houseInfo?.currentFloor || 10,
      furniture: extractFurniture(detected, 'living-room'),
      element: '火',
    })
  }
  
  // 卧室
  const beds = detected.filter(o => o.type === 'bed')
  beds.forEach((bed, i) => {
    rooms.push({
      id: `bedroom-${i + 1}`,
      type: i === 0 ? 'master-bedroom' : 'secondary-bedroom',
      size: detectRoomSize(detected, 'bedroom'),
      direction: bed.direction || 'north',
      position: 'back',
      hasWindow: detected.some(o => o.type === 'window'),
      hasBalcony: false,
      floor: houseInfo?.currentFloor || 10,
      furniture: extractFurniture(detected, 'bedroom'),
      element: '木',
    })
  })
  
  // 厨房
  const hasKitchen = detected.some(o => o.type === 'kitchen' || o.type === 'stove')
  if (hasKitchen) {
    rooms.push({
      id: 'kitchen-1',
      type: 'kitchen',
      size: detectRoomSize(detected, 'kitchen'),
      direction: 'west',
      position: 'right',
      hasWindow: detected.some(o => o.type === 'window'),
      hasBalcony: false,
      floor: houseInfo?.currentFloor || 10,
      furniture: extractFurniture(detected, 'kitchen'),
      element: '火',
    })
  }
  
  // 卫生间
  const hasBathroom = detected.some(o => o.type === 'bathroom' || o.type === 'toilet')
  if (hasBathroom) {
    rooms.push({
      id: 'bathroom-1',
      type: 'bathroom',
      size: detectRoomSize(detected, 'bathroom'),
      direction: 'northwest',
      position: 'corner',
      hasWindow: detected.some(o => o.type === 'window'),
      hasBalcony: false,
      floor: houseInfo?.currentFloor || 10,
      furniture: [],
      element: '水',
    })
  }
  
  return rooms.length > 0 ? rooms : []
}

function detectRoomSize(objects: DetectedObject[], roomType: string): number {
  // 简单估算，实际应该根据边界框计算
  const roomObj = objects.find(o => o.type === roomType)
  if (roomObj?.boundingBox) {
    const { width, height } = roomObj.boundingBox
    return Math.round(width * height / 10000) // 假设每单位=1像素
  }
  return 15 // 默认中等大小
}

function extractFurniture(objects: DetectedObject[], roomType: string): any[] {
  const furnitureTypeMap: Record<string, string[]> = {
    'living-room': ['sofa', 'television', 'desk', 'plant'],
    'bedroom': ['bed', 'wardrobe', 'desk'],
    'kitchen': ['stove', 'refrigerator'],
    'bathroom': ['mirror'],
  }
  
  const relevantTypes = furnitureTypeMap[roomType] || []
  
  return objects
    .filter(o => relevantTypes.includes(o.type))
    .map(o => ({
      type: o.type,
      direction: o.direction || 'south',
      position: o.position || 'center',
      material: inferMaterial(o.type),
    }))
}

function inferMaterial(objType: string): any {
  const materialMap: Record<string, any> = {
    'bed': '木',
    'sofa': '木',
    'desk': '木',
    'wardrobe': '木',
    'stove': '火',
    'refrigerator': '金',
    'television': '火',
    'mirror': '金',
    'plant': '木',
    'aquarium': '水',
  }
  return materialMap[objType] || '土'
}

function detectNearbyRoads(objects: DetectedObject[]): number {
  // 从识别结果推断
  const roadIndicators = objects.filter(o => 
    o.type === 'entrance' || o.type === 'corridor'
  )
  return roadIndicators.length > 0 ? 1 : 0
}

function detectTJunction(objects: DetectedObject[]): boolean {
  // 简化检测，实际应该从布局分析
  return objects.some(o => o.type === 'corridor' && o.metadata?.isTJunction)
}

// ============ 辅助函数：检测煞气 ============

export function detectShaFromAnalysis(analysis: ImageAnalysisResult): DetectedSha[] {
  const shaList: DetectedSha[] = []
  const objects = analysis.detectedObjects || []
  
  // 1. 穿堂煞：门对窗/门对门
  const doors = objects.filter(o => o.type === 'door' || o.type === 'entrance')
  const windows = objects.filter(o => o.type === 'window')
  const balconies = objects.filter(o => o.type === 'balcony')
  
  if (doors.length > 0 && (windows.length > 0 || balconies.length > 0)) {
    // 简单判断：如果门和窗/阳台在对面位置
    const door = doors[0]
    const opposite = windows[0] || balconies[0]
    
    if (isOpposite(door.position, opposite.position)) {
      shaList.push({
        type: 'chuan-tang-sha',
        severity: 'moderate',
        confidence: 75,
        description: '大门与窗户/阳台相对，气流直进直出',
        suggestions: ['设置屏风遮挡', '摆放绿植缓冲气流'],
        relatedRules: ['practical-chuan-tang'],
      })
    }
  }
  
  // 2. 横梁压顶
  const beams = objects.filter(o => o.type === 'beam')
  const beds = objects.filter(o => o.type === 'bed')
  const desks = objects.filter(o => o.type === 'desk')
  
  for (const beam of beams) {
    for (const bed of beds) {
      if (isOverlapping(beam.boundingBox, bed.boundingBox)) {
        shaList.push({
          type: 'heng-liang-ya-ding',
          severity: 'moderate',
          confidence: 80,
          description: '床上方有横梁压迫',
          suggestions: ['吊顶遮挡', '调整床位'],
          relatedRules: ['practical-beam-press'],
        })
      }
    }
    for (const desk of desks) {
      if (isOverlapping(beam.boundingBox, desk.boundingBox)) {
        shaList.push({
          type: 'heng-liang-ya-ding',
          severity: 'mild',
          confidence: 75,
          description: '书桌上方有横梁',
          suggestions: ['调整书桌位置', '安装假天花'],
          relatedRules: [],
        })
      }
    }
  }
  
  // 3. 镜子对床/对门
  const mirrors = objects.filter(o => o.type === 'mirror')
  for (const mirror of mirrors) {
    for (const bed of beds) {
      if (isFacingEachOther(mirror, bed)) {
        shaList.push({
          type: 'jing-zi-dui-chuang',
          severity: 'mild',
          confidence: 70,
          description: '镜子正对床铺',
          suggestions: ['调整镜子位置', '用布帘遮挡'],
          relatedRules: [],
        })
      }
    }
    const door = doors[0]
    if (door && isFacingEachOther(mirror, door)) {
      shaList.push({
        type: 'jing-zi-dui-men',
        severity: 'mild',
        confidence: 65,
        description: '镜子正对大门',
        suggestions: ['调整镜子位置', '用布帘遮挡'],
        relatedRules: [],
      })
    }
  }
  
  // 4. 厕压中宫
  const toilets = objects.filter(o => o.type === 'toilet')
  if (toilets.length > 0) {
    const toilet = toilets[0]
    if (toilet.position === 'center' || toilet.metadata?.isInCenter) {
      shaList.push({
        type: 'ce-ya-zhong-gong',
        severity: 'severe',
        confidence: 85,
        description: '卫生间位于房屋中心',
        suggestions: ['保持清洁', '安装排气扇', '摆放绿植净化'],
        relatedRules: ['practical-toilet-center'],
      })
    }
  }
  
  // 5. 开门见灶
  const stoves = objects.filter(o => o.type === 'stove')
  for (const door of doors) {
    for (const stove of stoves) {
      if (isFacingEachOther(door, stove)) {
        shaList.push({
          type: 'kai-men-jian-zao',
          severity: 'mild',
          confidence: 70,
          description: '大门正对厨房灶台',
          suggestions: ['设置屏风遮挡', '安装厨房门帘'],
          relatedRules: ['practical-open-stove'],
        })
      }
    }
  }
  
  // 6. 床对门
  for (const bed of beds) {
    for (const door of doors) {
      if (door.type === 'entrance' && isFacingEachOther(bed, door)) {
        shaList.push({
          type: 'chuang-dui-men',
          severity: 'mild',
          confidence: 70,
          description: '床正对房门',
          suggestions: ['调整床位', '设置屏风'],
          relatedRules: [],
        })
      }
    }
  }
  
  // 7. 缺角
  if (analysis.roomInfo.missingCorners && analysis.roomInfo.missingCorners.length > 0) {
    shaList.push({
      type: 'que-jiao',
      severity: 'moderate',
      confidence: 80,
      description: `户型存在缺角：${analysis.roomInfo.missingCorners.join(', ')}`,
      suggestions: ['放置泰山石敢当', '摆放高大绿植'],
      relatedRules: [],
    })
  }
  
  return shaList
}

// ============ 几何辅助函数 ============

function isOpposite(pos1?: string, pos2?: string): boolean {
  if (!pos1 || !pos2) return false
  const opposites: Record<string, string> = {
    'front': 'back',
    'back': 'front',
    'left': 'right',
    'right': 'left',
  }
  return opposites[pos1] === pos2
}

function isOverlapping(box1?: BoundingBox, box2?: BoundingBox): boolean {
  if (!box1 || !box2) return false
  // 检查两个边界框是否重叠
  return !(
    box1.x + box1.width < box2.x ||
    box2.x + box2.width < box1.x ||
    box1.y + box1.height < box2.y ||
    box2.y + box2.height < box1.y
  )
}

function isFacingEachOther(obj1: DetectedObject, obj2: DetectedObject): boolean {
  // 简化判断：检查是否在相对位置
  return isOpposite(obj1.position, obj2.position) ||
         (obj1.direction && obj2.direction && isOpposite(obj1.direction, obj2.direction))
}

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}
