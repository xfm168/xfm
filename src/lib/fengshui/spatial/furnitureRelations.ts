/**
 * Spatial Engine - 家具空间关系计算
 * 
 * 负责：
 * - 家具之间的空间关系
 * - 家具与房间的空间关系
 * - 梁压床、镜照床等空间煞气
 */

import {
  distance,
  isBoxOverlapping,
  overlapRatio,
  getRelativeDirection,
  isDirectFacing,
  isPointInBox,
} from './geometry'

import type {
  FurnitureSpatial,
  DoorSpatial,
  WindowSpatial,
  FurnitureRelation,
  FurnitureToRoomRelation,
  SpatialShaDetection,
} from './types'

/**
 * 计算所有家具之间的空间关系
 */
export function calculateFurnitureRelations(
  furniture: FurnitureSpatial[]
): FurnitureRelation[] {
  const relations: FurnitureRelation[] = []

  for (let i = 0; i < furniture.length; i++) {
    for (let j = i + 1; j < furniture.length; j++) {
      const rel = calculateSingleFurnitureRelation(furniture[i], furniture[j])
      if (rel.distance < 10) { // 只记录距离较近的关系
        relations.push(rel)
      }
    }
  }

  return relations
}

/**
 * 计算两件家具之间的空间关系
 */
function calculateSingleFurnitureRelation(
  f1: FurnitureSpatial,
  f2: FurnitureSpatial
): FurnitureRelation {
  const p1 = {
    x: f1.boundingBox.x + f1.boundingBox.width / 2,
    y: f1.boundingBox.y + f1.boundingBox.height / 2,
  }
  const p2 = {
    x: f2.boundingBox.x + f2.boundingBox.width / 2,
    y: f2.boundingBox.y + f2.boundingBox.height / 2,
  }

  const dist = distance(p1, p2)
  const overlapping = isBoxOverlapping(f1.boundingBox, f2.boundingBox)
  const facing = isDirectFacing(f1.direction, f2.direction)
  const relativePos = getRelativeDirection(p1, p2)

  return {
    furnitureAId: f1.id,
    furnitureBId: f2.id,
    distance: dist,
    isFacing: facing,
    isOverlapping: overlapping,
    relativePosition: relativePos,
  }
}

/**
 * 计算家具与房间的空间关系
 * 
 * 包括：
 * - 距离门
 * - 距离窗
 * - 距离厕所
 * - 距离厨房
 * - 是否压梁
 * - 是否被镜照
 * - 是否冲门
 * - 是否靠墙
 * - 是否靠窗
 */
export function calculateFurnitureRoomRelations(
  furniture: FurnitureSpatial[],
  doors: DoorSpatial[],
  windows: WindowSpatial[],
  roomFurniture: FurnitureSpatial[]
): FurnitureToRoomRelation[] {
  const results: FurnitureToRoomRelation[] = []

  // 找出梁和镜子
  const beams = furniture.filter(f => f.type === 'beam')
  const mirrors = furniture.filter(f => 
    f.type === 'bedroom-mirror' || f.type === 'living-mirror'
  )

  for (const f of furniture) {
    if (f.type === 'beam') continue // 梁本身不算家具

    const furnitureCenter = {
      x: f.boundingBox.x + f.boundingBox.width / 2,
      y: f.boundingBox.y + f.boundingBox.height / 2,
    }

    // 距离最近的门
    const nearestDoor = findNearestDoor(furnitureCenter, doors)
    const nearestWindow = findNearestWindow(furnitureCenter, windows)

    // 距离厕所（简化：找toilet类型的家具）
    const nearestBathroom = furniture.find(f2 => f2.type === 'toilet')
    const distToBathroom = nearestBathroom 
      ? distance(furnitureCenter, {
          x: nearestBathroom.boundingBox.x + nearestBathroom.boundingBox.width / 2,
          y: nearestBathroom.boundingBox.y + nearestBathroom.boundingBox.height / 2,
        })
      : Infinity

    // 距离厨房（简化：找stove类型的家具）
    const nearestKitchen = furniture.find(f2 => f2.type === 'stove')
    const distToKitchen = nearestKitchen
      ? distance(furnitureCenter, {
          x: nearestKitchen.boundingBox.x + nearestKitchen.boundingBox.width / 2,
          y: nearestKitchen.boundingBox.y + nearestKitchen.boundingBox.height / 2,
        })
      : Infinity

    // 是否压梁
    const underBeam = isUnderBeam(f, beams)

    // 是否被镜照
    const facedByMirror = isFacedByMirror(f, mirrors)

    // 是否冲门
    const facingDoor = isFacingDoor(f, nearestDoor)

    // 是否靠墙
    const againstWall = isAgainstWall(f, roomFurniture)

    // 是否靠窗
    const nearWindow = nearestWindow ? nearestWindow.distance < 1.5 : false

    results.push({
      furnitureId: f.id,
      roomId: f.roomId,
      distanceToDoor: nearestDoor?.distance || Infinity,
      distanceToWindow: nearestWindow?.distance || Infinity,
      distanceToBathroom: distToBathroom,
      distanceToKitchen: distToKitchen,
      isUnderBeam: underBeam,
      isFacedByMirror: facedByMirror,
      isFacingDoor: facingDoor,
      isAgainstWall: againstWall,
      isNearWindow: nearWindow,
    })
  }

  return results
}

function findNearestDoor(
  point: { x: number; y: number },
  doors: DoorSpatial[]
): { door: DoorSpatial; distance: number } | null {
  if (doors.length === 0) return null

  let nearest = doors[0]
  let minDist = distance(point, doors[0].position)

  for (const door of doors.slice(1)) {
    const dist = distance(point, door.position)
    if (dist < minDist) {
      minDist = dist
      nearest = door
    }
  }

  return { door: nearest, distance: minDist }
}

function findNearestWindow(
  point: { x: number; y: number },
  windows: WindowSpatial[]
): { window: WindowSpatial; distance: number } | null {
  if (windows.length === 0) return null

  let nearest = windows[0]
  let minDist = distance(point, windows[0].position)

  for (const w of windows.slice(1)) {
    const dist = distance(point, w.position)
    if (dist < minDist) {
      minDist = dist
      nearest = w
    }
  }

  return { window: nearest, distance: minDist }
}

function isUnderBeam(furniture: FurnitureSpatial, beams: FurnitureSpatial[]): boolean {
  for (const beam of beams) {
    const ratio = overlapRatio(furniture.boundingBox, beam.boundingBox)
    if (ratio > 0.3) { // 重叠超过30%就算压
      return true
    }
  }
  return false
}

function isFacedByMirror(furniture: FurnitureSpatial, mirrors: FurnitureSpatial[]): boolean {
  const furnitureCenter = {
    x: furniture.boundingBox.x + furniture.boundingBox.width / 2,
    y: furniture.boundingBox.y + furniture.boundingBox.height / 2,
  }

  for (const mirror of mirrors) {
    const mirrorCenter = {
      x: mirror.boundingBox.x + mirror.boundingBox.width / 2,
      y: mirror.boundingBox.y + mirror.boundingBox.height / 2,
    }

    // 镜子朝向家具
    const mirrorToFurn = getRelativeDirection(mirrorCenter, furnitureCenter)
    if (mirror.direction === mirrorToFurn || 
        isDirectFacing(mirror.direction, furniture.direction)) {
      return true
    }
  }
  return false
}

function isFacingDoor(
  furniture: FurnitureSpatial,
  nearestDoor: { door: DoorSpatial; distance: number } | null
): boolean {
  if (!nearestDoor) return false
  if (nearestDoor.distance > 3) return false // 太远不算

  return isDirectFacing(furniture.direction, nearestDoor.door.direction)
}

function isAgainstWall(furniture: FurnitureSpatial, _allFurniture: FurnitureSpatial[]): boolean {
  // 简化判断：根据 boundingBox 位置判断是否靠墙
  // 实际应该根据墙的位置判断
  const { boundingBox } = furniture
  if (!boundingBox) return false
  const centerX = (boundingBox.x + boundingBox.width / 2)
  const centerY = (boundingBox.y + boundingBox.height / 2)
  return centerX < 20 || centerX > 80 || centerY < 20 || centerY > 80
}

// ============ 家具类空间煞气检测 ============

/**
 * 检测横梁压顶
 */
export function detectLiangYaDing(
  furniture: FurnitureSpatial[],
  furnitureRelations: FurnitureRelation[]
): SpatialShaDetection[] {
  const results: SpatialShaDetection[] = []

  const beds = furniture.filter(f => f.type === 'bed')
  const desks = furniture.filter(f => f.type === 'desk')
  const sofas = furniture.filter(f => f.type === 'sofa')
  const beams = furniture.filter(f => f.type === 'beam')

  // 检查床
  for (const bed of beds) {
    for (const beam of beams) {
      const ratio = overlapRatio(bed.boundingBox, beam.boundingBox)
      if (ratio > 0.3) {
        const severity = ratio > 0.7 ? 'severe' : ratio > 0.5 ? 'moderate' : 'mild'
        results.push({
          type: 'liang-ya-ding',
          severity,
          confidence: 80 + ratio * 10,
          description: `床上方有横梁压迫（重叠${Math.round(ratio * 100)}%）`,
          involvedElements: [bed.id, beam.id],
          spatialEvidence: {
            overlapRatio: ratio,
          },
        })
      }
    }
  }

  return results
}

/**
 * 检测镜照床
 */
export function detectJingZhaoChuang(
  furniture: FurnitureSpatial[],
  furnitureRoomRelations: FurnitureToRoomRelation[]
): SpatialShaDetection[] {
  const results: SpatialShaDetection[] = []

  const beds = furniture.filter(f => f.type === 'bed')

  for (const bed of beds) {
    const rel = furnitureRoomRelations.find(r => r.furnitureId === bed.id)
    if (rel?.isFacedByMirror) {
      results.push({
        type: 'jing-zhao-chuang',
        severity: 'mild',
        confidence: 70,
        description: '镜子正对床铺，夜半容易惊吓',
        involvedElements: [bed.id],
        spatialEvidence: {
          isStraight: true,
        },
      })
    }
  }

  return results
}

/**
 * 检测门冲床/门冲灶
 */
export function detectMenChong(
  furniture: FurnitureSpatial[],
  doors: DoorSpatial[],
  furnitureRoomRelations: FurnitureToRoomRelation[]
): SpatialShaDetection[] {
  const results: SpatialShaDetection[] = []

  const beds = furniture.filter(f => f.type === 'bed')
  const stoves = furniture.filter(f => f.type === 'stove')

  // 门冲床
  for (const bed of beds) {
    const rel = furnitureRoomRelations.find(r => r.furnitureId === bed.id)
    if (rel?.isFacingDoor && rel.distanceToDoor < 3) {
      results.push({
        type: 'men-chong-chuang',
        severity: 'mild',
        confidence: 75,
        description: '床正对房门，缺乏安全感',
        involvedElements: [bed.id],
        spatialEvidence: {
          distance: rel.distanceToDoor,
          isStraight: true,
        },
      })
    }
  }

  // 门冲灶
  for (const stove of stoves) {
    const rel = furnitureRoomRelations.find(r => r.furnitureId === stove.id)
    if (rel?.isFacingDoor && rel.distanceToDoor < 3) {
      results.push({
        type: 'men-chong-zao',
        severity: 'mild',
        confidence: 70,
        description: '灶台正对厨房门，火气外泄',
        involvedElements: [stove.id],
        spatialEvidence: {
          distance: rel.distanceToDoor,
          isStraight: true,
        },
      })
    }
  }

  return results
}

/**
 * 检测水火相冲（厨房内）
 */
export function detectHuoShuiXiangChong(
  furniture: FurnitureSpatial[]
): SpatialShaDetection[] {
  const results: SpatialShaDetection[] = []

  const stoves = furniture.filter(f => f.type === 'stove')
  const sinks = furniture.filter(f => f.type === 'sink')
  const refrigerators = furniture.filter(f => f.type === 'refrigerator')

  for (const stove of stoves) {
    const stoveCenter = {
      x: stove.boundingBox.x + stove.boundingBox.width / 2,
      y: stove.boundingBox.y + stove.boundingBox.height / 2,
    }

    // 灶台与水槽
    for (const sink of sinks) {
      const sinkCenter = {
        x: sink.boundingBox.x + sink.boundingBox.width / 2,
        y: sink.boundingBox.y + sink.boundingBox.height / 2,
      }
      const dist = distance(stoveCenter, sinkCenter)
      if (dist < 0.5) { // 太近
        results.push({
          type: 'huo-shui-xiang-chong',
          severity: 'moderate',
          confidence: 75,
          description: '灶台与水槽距离太近，水火相冲',
          involvedElements: [stove.id, sink.id],
          spatialEvidence: {
            distance: dist,
          },
        })
      }
    }

    // 灶台与冰箱
    for (const fridge of refrigerators) {
      const fridgeCenter = {
        x: fridge.boundingBox.x + fridge.boundingBox.width / 2,
        y: fridge.boundingBox.y + fridge.boundingBox.height / 2,
      }
      const dist = distance(stoveCenter, fridgeCenter)
      if (dist < 0.5) {
        results.push({
          type: 'huo-shui-xiang-chong',
          severity: 'mild',
          confidence: 70,
          description: '灶台与冰箱距离太近，火气遇寒气相冲',
          involvedElements: [stove.id, fridge.id],
          spatialEvidence: {
            distance: dist,
          },
        })
      }
    }
  }

  return results
}

/**
 * 综合检测家具类空间煞气
 */
export function detectFurnitureSha(
  furniture: FurnitureSpatial[],
  doors: DoorSpatial[],
  windows: WindowSpatial[],
  roomFurniture: FurnitureSpatial[]
): SpatialShaDetection[] {
  const furnitureRelations = calculateFurnitureRelations(furniture)
  const furnitureRoomRelations = calculateFurnitureRoomRelations(
    furniture, doors, windows, roomFurniture
  )

  const results: SpatialShaDetection[] = [
    ...detectLiangYaDing(furniture, furnitureRelations),
    ...detectJingZhaoChuang(furniture, furnitureRoomRelations),
    ...detectMenChong(furniture, doors, furnitureRoomRelations),
    ...detectHuoShuiXiangChong(furniture),
  ]

  return results
}
