/**
 * 风水模块 - 类型定义
 * 
 * 复用八字模块的Rule Engine架构
 */

import type { BaseRule, RuleContext, RuleResult } from '../bazi/rules/engine'

// ============ 基础类型 ============

export type FiveElement = '木' | '火' | '土' | '金' | '水'

export type Direction = 
  | 'north'          // 北
  | 'northeast'      // 东北
  | 'east'           // 东
  | 'southeast'      // 东南
  | 'south'          // 南
  | 'southwest'      // 西南
  | 'west'           // 西
  | 'northwest'      // 西北
  | 'center'         // 中

export type HouseType = 'apartment' | 'house' | 'villa' | 'commercial' | 'unknown'

export type LayoutShape = 'square' | 'rectangle' | 'L-shape' | 'irregular' | 'U-shape'

export type RoomType = 
  | 'living'          // 客厅
  | 'master-bedroom'  // 主卧
  | 'secondary-bedroom' // 次卧
  | 'children-bedroom'  // 儿童房
  | 'elder-bedroom'   // 老人房
  | 'kitchen'         // 厨房
  | 'dining'          // 餐厅
  | 'bathroom'        // 卫生间
  | 'master-bathroom' // 主卫
  | 'study'           // 书房
  | 'balcony'         // 阳台
  | 'storage'         // 储物间
  | 'corridor'        // 走廊
  | 'entrance'        // 入户门厅

export type FurnitureType = 
  | 'bed'             // 床
  | 'sofa'            // 沙发
  | 'tv-stand'        // 电视柜
  | 'dining-table'    // 餐桌
  | 'desk'            // 书桌/办公桌
  | 'wardrobe'        // 衣柜
  | 'stove'           // 灶台
  | 'refrigerator'    // 冰箱
  | 'water-heater'    // 热水器
  | 'mirror'          // 镜子
  | 'plant'           // 植物
  | 'aquarium'        // 鱼缸
  | 'desk-lamp'       // 台灯
  | 'chandelier'      // 吊灯

export type FurnitureMaterial = '木' | '火' | '土' | '金' | '水'

export type Position = 'front' | 'back' | 'left' | 'right' | 'center' | 'corner'

// ============ 复合类型 ============

export interface DirectionInfo {
  mainDirection: Direction
  facingDirection: Direction
  doorDirection: Direction
}

export interface LayoutInfo {
  shape: LayoutShape
  score: number
  missingCorners: Direction[]
  totalArea: number
  usableArea: number
}

export interface Furniture {
  type: FurnitureType
  direction: Direction
  position: Position
  material?: FurnitureMaterial
  size?: number
}

export interface Room {
  type: RoomType
  size: number
  direction: Direction
  position: Position
  hasWindow: boolean
  hasBalcony: boolean
  floor: number
  furniture: Furniture[]
  element: FiveElement
}

export interface ElementDistribution {
  木: number
  火: number
  土: number
  金: number
  水: number
}

export interface FengShuiContext {
  // 房屋基本信息
  houseType: HouseType
  houseAge: number
  totalFloors: number
  currentFloor: number
  totalArea: number
  
  // 朝向信息
  direction: DirectionInfo
  
  // 户型信息
  layout: LayoutInfo
  
  // 房间列表
  rooms: Room[]
  
  // 五行分布
  elementDistribution: ElementDistribution
  
  // 外部环境
  nearbyRoads: number
  nearbyTJunction: boolean
  nearbyPole: boolean
  nearWater: boolean
  nearMountain: boolean
  
  // 命主信息（可选）
  ownerBazi?: {
    dayGan: string
    dayElement: FiveElement
    xiYongShen: FiveElement
  }
  
  // 扩展：图片识别结果（可选）
  _vision?: {
    detectedObjects?: any[]
    detectedSha?: any[]
    confidence?: number
    rawAnalysis?: any
  }
}

// ============ 分析结果类型 ============

export type FengShuiCategory = 
  | '朝向' 
  | '户型' 
  | '房间' 
  | '布局' 
  | '五行' 
  | '环境' 
  | '综合'

export interface FengShuiPattern {
  id: string
  name: string
  category: FengShuiCategory
  description: string
  matched: boolean
}

export interface FengShuiExplain {
  whyGood: string[]
  whyBad: string[]
  suggestions: string[]
  matchedPatterns: string[]
  warnings: string[]
  tips: string[]
}

export interface FengShuiResult {
  // 主格局
  mainPattern: FengShuiPattern
  patternScore: number
  confidence: number
  confidenceReason: string
  matchedPatterns: FengShuiPattern[]
  matchedRuleNames: string[]
  
  // 各项评分
  houseScore: number       // 房屋整体评分
  directionScore: number   // 朝向评分
  layoutScore: number      // 户型评分
  roomScore: number       // 房间评分
  elementScore: number    // 五行评分
  environmentScore: number // 环境评分
  overallScore: number     // 综合评分
  
  // 分析内容
  strengths: string[]      // 优点
  weaknesses: string[]      // 缺点
  warnings: string[]       // 注意事项
  suggestions: string[]    // 改善建议
  explain: FengShuiExplain
  
  // 详细分析
  directionAnalysis: DirectionAnalysis
  layoutAnalysis: LayoutAnalysis
  roomAnalysis: RoomAnalysis[]
  elementAnalysis: ElementAnalysis
}

export interface DirectionAnalysis {
  mainDirection: Direction
  facingDirection: Direction
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  score: number
  reasons: string[]
  suggestions: string[]
}

export interface LayoutAnalysis {
  shape: LayoutShape
  score: number
  missingCorners: { direction: Direction; severity: number }[]
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export interface RoomAnalysis {
  roomType: RoomType
  name: string
  score: number
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  furnitureAnalysis: FurnitureAnalysis[]
}

export interface FurnitureAnalysis {
  type: FurnitureType
  position: string
  direction: Direction
  quality: 'good' | 'fair' | 'poor'
  issues: string[]
  suggestions: string[]
}

export interface ElementAnalysis {
  distribution: ElementDistribution
  balance: number
  dominant: FiveElement
  deficient: FiveElement
  suggestions: string[]
}

// ============ 规则相关类型 ============

export type RuleHeritage = 'classical' | 'modern' | 'verified'
export type RuleLayer = 'classical' | 'practical' | 'modern'
export type FengShuiSchool = 'bazhai' | 'xuankong' | 'sanhe' | 'sanyuan' | 'zangfeng' | 'modern'

export interface FengShuiRuleResult extends RuleResult {
  type: string
  score: number
  explanation: string
  classicalRef: string
  practicalAdvice: string
}

export interface FengShuiRule extends BaseRule<FengShuiContext, FengShuiRuleResult> {
  id: string
  name: string
  category: FengShuiCategory
  
  source: string[]
  heritage: RuleHeritage
  layer: RuleLayer
  schools: FengShuiSchool[]
  
  priority: number
  weight: number
  confidence: number
  
  referenceIds: string[]
  
  condition: (ctx: FengShuiContext) => boolean
  
  result: FengShuiRuleResult
  
  tags: string[]
}

// ============ Explain 三段式 ============

export interface ClassicalReference {
  source: string
  quote: string
  school: FengShuiSchool
}

export interface FengShuiExplain {
  classicalRefs: ClassicalReference[]
  practicalExplanation: string[]
  suggestions: string[]
  matchedPatterns: string[]
  warnings: string[]
  tips: string[]
  
  whyGood: string[]
  whyBad: string[]
}

// ============ 分析选项 ============

export interface FengShuiAnalysisOptions {
  includeAI?: boolean
  detailed?: boolean
  prioritizeWarnings?: boolean
}

// ============ 辅助函数 ============

export function getDirectionName(dir: Direction): string {
  const names: Record<Direction, string> = {
    north: '北',
    northeast: '东北',
    east: '东',
    southeast: '东南',
    south: '南',
    southwest: '西南',
    west: '西',
    northwest: '西北',
    center: '中',
  }
  return names[dir]
}

export function getRoomName(roomType: RoomType): string {
  const names: Record<RoomType, string> = {
    'living': '客厅',
    'master-bedroom': '主卧',
    'secondary-bedroom': '次卧',
    'children-bedroom': '儿童房',
    'elder-bedroom': '老人房',
    'kitchen': '厨房',
    'dining': '餐厅',
    'bathroom': '卫生间',
    'master-bathroom': '主卫',
    'study': '书房',
    'balcony': '阳台',
    'storage': '储物间',
    'corridor': '走廊',
    'entrance': '入户门厅',
  }
  return names[roomType]
}

export function getFurnitureName(type: FurnitureType): string {
  const names: Record<FurnitureType, string> = {
    'bed': '床',
    'sofa': '沙发',
    'tv-stand': '电视柜',
    'dining-table': '餐桌',
    'desk': '书桌',
    'wardrobe': '衣柜',
    'stove': '灶台',
    'refrigerator': '冰箱',
    'water-heater': '热水器',
    'mirror': '镜子',
    'plant': '植物',
    'aquarium': '鱼缸',
    'desk-lamp': '台灯',
    'chandelier': '吊灯',
  }
  return names[type]
}

export function getElementName(elem: FiveElement): string {
  const names: Record<FiveElement, string> = {
    '木': '木',
    '火': '火',
    '土': '土',
    '金': '金',
    '水': '水',
  }
  return names[elem]
}
