/**
 * Spatial Engine - 空间关系引擎类型定义
 * 
 * 所有空间计算统一由 Spatial Engine 提供，Rule 不允许重复计算。
 * 
 * 负责：
 * - 房屋基础空间属性
 * - 门窗空间关系
 * - 家具空间关系
 * - 动线分析
 */

import type { Direction, LayoutShape } from '../types'

export type { Direction, LayoutShape }

// ============ 基础空间类型 ============

export interface Point2D {
  x: number
  y: number
}

export interface Point3D extends Point2D {
  z: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface Polygon {
  points: Point2D[]
}

// ============ 房屋空间结构 ============

export interface HouseSpatial {
  /** 房屋轮廓 */
  outline: Polygon
  /** 户型形状 */
  shape: LayoutShape
  /** 总面积（平方米） */
  totalArea: number
  /** 可用面积 */
  usableArea: number
  /** 朝向 */
  orientation: Direction
  /** 坐向（与朝向相反） */
  sittingDirection: Direction
  /** 中宫位置 */
  centerPoint: Point2D
  /** 中宫区域 */
  centerArea: BoundingBox
  /** 缺角列表 */
  missingCorners: SpatialMissingCorner[]
  /** 凸角列表 */
  protrudingCorners: SpatialProtrudingCorner[]
  /** 楼层信息 */
  floorInfo: FloorInfo
  /** 电梯位置 */
  elevatorPosition?: Point2D
  /** 楼梯位置 */
  stairsPosition?: Point2D
  /** 动线分析 */
  circulation: CirculationAnalysis
}

export interface SpatialMissingCorner {
  direction: Direction
  severity: 'mild' | 'moderate' | 'severe'
  areaRatio: number
  boundingBox: BoundingBox
  description: string
}

export interface SpatialProtrudingCorner {
  direction: Direction
  size: 'small' | 'medium' | 'large'
  areaRatio: number
  boundingBox: BoundingBox
}

export interface FloorInfo {
  currentFloor: number
  totalFloors: number
  buildingType: 'apartment' | 'house' | 'villa' | 'commercial'
  houseAge: number
}

export interface CirculationAnalysis {
  mainEntrance: Point2D
  mainPath: Point2D[]
  deadEnds: Point2D[]
  mainTrafficFlow: string[]
  trafficCongestionZones: BoundingBox[]
}

// ============ 门窗空间关系 ============

export interface DoorSpatial {
  id: string
  type: DoorType
  position: Point2D
  direction: Direction
  width: number
  height: number
  isOpen: boolean
  roomFrom?: string
  roomTo?: string
}

export type DoorType = 
  | 'main-entrance'      // 大门
  | 'back-door'          // 后门
  | 'bedroom-door'       // 卧室门
  | 'kitchen-door'       // 厨房门
  | 'bathroom-door'      // 卫生间门
  | 'balcony-door'       // 阳台门
  | 'study-door'         // 书房门
  | 'dining-door'        // 餐厅门

export interface WindowSpatial {
  id: string
  type: WindowType
  position: Point2D
  direction: Direction
  width: number
  height: number
  area: number
  roomId?: string
}

export type WindowType = 
  | 'normal'              // 普通窗户
  | 'french-window'       // 落地窗
  | 'bay-window'          // 飘窗
  | 'skylight'            // 天窗
  | 'balcony'             // 阳台（当大窗处理）

export interface DoorWindowRelation {
  doorId: string
  windowId: string
  /** 是否正对 */
  isDirectFacing: boolean
  /** 是否穿堂 */
  isStraightThrough: boolean
  /** 距离（米） */
  distance: number
  /** 夹角（度） */
  angle: number
  /** 中间是否有遮挡 */
  hasObstruction: boolean
}

export interface DoorDoorRelation {
  doorAId: string
  doorBId: string
  /** 是否正对 */
  isFacing: boolean
  /** 距离（米） */
  distance: number
  /** 关系类型 */
  relationType: DoorDoorRelationType
}

export type DoorDoorRelationType = 
  | '门冲'               // 两扇门正对
  | '相邻'
  | '成90度'
  | '成180度'
  | '无直接关系'

// ============ 家具空间关系 ============

export interface FurnitureSpatial {
  id: string
  type: FurnitureType
  name: string
  /** 房间ID */
  roomId: string
  /** 边界框 */
  boundingBox: BoundingBox
  /** 朝向 */
  direction: Direction
  /** 材质 */
  material?: FurnitureMaterial
  /** 尺寸估算 */
  size: 'small' | 'medium' | 'large'
}

export type FurnitureType = 
  // 卧室
  | 'bed' | 'bed-head' | 'bed-foot' | 'wardrobe' | 'dresser' | 'bedroom-mirror'
  // 客厅
  | 'sofa' | 'coffee-table' | 'tv' | 'tv-stand' | 'fortune-position' | 'shrine'
  | 'fish-tank' | 'plant' | 'living-ac'
  // 厨房
  | 'stove' | 'sink' | 'refrigerator' | 'microwave' | 'oven' | 'dining-table' | 'kitchen-cabinet'
  // 卫生间
  | 'toilet' | 'wash-basin' | 'shower' | 'bathtub'
  // 书房
  | 'desk' | 'bookshelf' | 'computer' | 'chair'
  // 其他
  | 'beam' | 'column' | 'living-mirror' | 'ac-unit'

export type FurnitureMaterial = '木' | '火' | '土' | '金' | '水'

export interface FurnitureRelation {
  furnitureAId: string
  furnitureBId: string
  /** 距离（米） */
  distance: number
  /** 是否正对 */
  isFacing: boolean
  /** 是否重叠（压） */
  isOverlapping: boolean
  /** 相对位置 */
  relativePosition: Direction
}

export interface FurnitureToRoomRelation {
  furnitureId: string
  roomId: string
  /** 距离门 */
  distanceToDoor: number
  /** 距离窗 */
  distanceToWindow: number
  /** 距离厕所 */
  distanceToBathroom: number
  /** 距离厨房 */
  distanceToKitchen: number
  /** 是否压梁 */
  isUnderBeam: boolean
  /** 是否被镜照 */
  isFacedByMirror: boolean
  /** 是否冲门 */
  isFacingDoor: boolean
  /** 是否靠墙 */
  isAgainstWall: boolean
  /** 是否靠窗 */
  isNearWindow: boolean
}

// ============ 煞气空间判断 ============

export interface SpatialShaDetection {
  type: SpatialShaType
  severity: 'mild' | 'moderate' | 'severe'
  confidence: number
  description: string
  /** 涉及的元素ID */
  involvedElements: string[]
  /** 空间证据 */
  spatialEvidence: SpatialShaEvidence
}

export type SpatialShaType = 
  // 门窗类
  | 'chuan-tang-sha'       // 穿堂煞
  | 'men-chuang-chong'      // 门窗冲
  | 'men-men-chong'        // 门门冲
  // 家具类
  | 'jing-zhao-chuang'      // 镜照床
  | 'liang-ya-ding'        // 梁压顶
  | 'men-chong-chuang'     // 门冲床
  | 'men-chong-zao'        // 门冲灶
  // 位置类
  | 'ce-ya-zhong-gong'     // 厕压中宫
  | 'zao-ya-zhong-gong'    // 灶压中宫
  | 'que-jiao'             // 缺角
  // 其他
  | 'huo-shui-xiang-chong'  // 水火相冲
  | 'unknown'

export interface SpatialShaEvidence {
  distance?: number
  angle?: number
  isStraight?: boolean
  hasObstruction?: boolean
  overlapRatio?: number
  direction?: Direction
}

// ============ Spatial Engine 输出 ============

export interface SpatialAnalysisResult {
  /** 房屋空间结构 */
  house: HouseSpatial
  /** 所有门 */
  doors: DoorSpatial[]
  /** 所有窗 */
  windows: WindowSpatial[]
  /** 所有家具 */
  furniture: FurnitureSpatial[]
  /** 门窗关系 */
  doorWindowRelations: DoorWindowRelation[]
  /** 门门关系 */
  doorDoorRelations: DoorDoorRelation[]
  /** 家具关系 */
  furnitureRelations: FurnitureRelation[]
  /** 家具-房间关系 */
  furnitureRoomRelations: FurnitureToRoomRelation[]
  /** 空间煞气检测 */
  spatialSha: SpatialShaDetection[]
  /** 整体置信度 */
  confidence: number
}
