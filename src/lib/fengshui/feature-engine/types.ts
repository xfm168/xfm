/**
 * Feature Engine - 环境特征引擎类型定义
 * 
 * 负责提取环境特征，所有 Rule 都读取 Feature，而不是自己分析。
 * 
 * 特征分类：
 * - 阴阳五行
 * - 采光通风
 * - 空间感
 * - 聚气藏风
 * - 环境因素
 */

import type { FiveElement, Direction } from '../types'

// ============ 核心特征类型 ============

export interface EnvironmentalFeatures {
  // === 阴阳五行 ===
  yinYang: YinYangFeatures
  fiveElements: FiveElementFeatures
  
  // === 采光通风 ===
  lighting: LightingFeatures
  ventilation: VentilationFeatures
  
  // === 空间感 ===
  spatial: SpatialFeatures
  
  // === 聚气藏风 ===
  qi: QiFeatures
  
  // === 环境因素 ===
  environment: EnvironmentFeatures
  
  // === 运势特征 ===
  fortune: FortuneFeatures
  
  // === 综合特征 ===
  overall: OverallFeatures
  
  // === 来源信息 ===
  sources: FeatureSourceInfo
}

// ============ 阴阳五行 ============

export interface YinYangFeatures {
  /** 阳气值 0-100 */
  yang: number
  /** 阴气值 0-100 */
  yin: number
  /** 阴阳平衡度 0-100（越高越平衡） */
  balance: number
  /** 阴阳状态 */
  state: '平衡' | '偏阳' | '偏阴' | '阳极' | '阴极'
}

export interface FiveElementFeatures {
  wood: number     // 木 0-100
  fire: number     // 火 0-100
  earth: number    // 土 0-100
  metal: number    // 金 0-100
  water: number    // 水 0-100
  
  /** 旺元素 */
  dominant: FiveElement
  /** 弱元素 */
  weakest: FiveElement
  /** 五行平衡度 0-100 */
  balance: number
  /** 生克关系 */
  relations: ElementRelations
}

export interface ElementRelations {
  /** 相生链 */
  generating: { from: FiveElement; to: FiveElement; strength: number }[]
  /** 相克链 */
  controlling: { from: FiveElement; to: FiveElement; strength: number }[]
}

// ============ 采光通风 ============

export interface LightingFeatures {
  /** 整体采光量 0-100 */
  overall: number
  /** 自然光比例 0-100 */
  naturalLightRatio: number
  /** 光照均匀度 0-100 */
  uniformity: number
  /** 光照时长（小时/天） */
  durationHours: number
  /** 主要采光方向 */
  mainDirection: Direction
  /** 是否有暗室 */
  hasDarkRoom: boolean
  /** 暗室列表 */
  darkRooms: string[]
}

export interface VentilationFeatures {
  /** 整体通风量 0-100 */
  overall: number
  /** 空气流通速度 */
  airFlowSpeed: '慢' | '中' | '快' | '过快'
  /** 是否有穿堂风 */
  hasCrossVentilation: boolean
  /** 穿堂风强度 0-100 */
  crossVentilationStrength: number
  /** 通风死角数量 */
  deadZones: number
  /** 湿气程度 0-100（越高越湿） */
  humidity: number
}

// ============ 空间感 ============

export interface SpatialFeatures {
  /** 整体空间感 0-100 */
  overallSpaciousness: number
  /** 开阔感 0-100 */
  openness: number
  /** 压迫感 0-100（越低越好） */
  oppression: number
  /** 层高感 */
  ceilingHeight: '低' | '中' | '高'
  /** 户型方正度 0-100 */
  shapeRegularity: number
  /** 动线流畅度 0-100 */
  circulationFlow: number
  /** 空间利用率 0-100 */
  spaceUtilization: number
}

// ============ 聚气藏风 ============

export interface QiFeatures {
  /** 聚气程度 0-100 */
  gathering: number
  /** 藏风程度 0-100 */
  storing: number
  /** 纳气能力 0-100 */
  receiving: number
  /** 气场稳定性 0-100 */
  stability: number
  /** 气的流动状态 */
  flowState: '停滞' | '缓慢' | '适中' | '过快' | '散乱'
  /** 明堂开阔度 0-100 */
  mingTang: number
  /** 靠山程度 0-100 */
  backing: number
}

// ============ 环境因素 ============

export interface EnvironmentFeatures {
  /** 噪音水平 0-100（越低越好） */
  noiseLevel: number
  /** 灰尘程度 0-100（越低越好） */
  dustLevel: number
  /** 温度舒适度 0-100 */
  temperatureComfort: number
  /** 湿度舒适度 0-100 */
  humidityComfort: number
  /** 空气质量 0-100 */
  airQuality: number
  /** 外部景观 */
  externalView: '无' | '一般' | '好' | '极佳'
  /** 外部建筑距离 */
  buildingDistance: '近' | '中' | '远'
  /** 是否有天斩煞 */
  hasSkyCutter: boolean
  /** 是否有壁刀煞 */
  hasWallKnife: boolean
  /** 是否有路冲 */
  hasRoadChong: boolean
  /** 是否有反弓 */
  hasFanGong: boolean
}

// ============ 运势特征 ============

export interface FortuneFeatures {
  /** 财运指数 0-100 */
  wealth: number
  /** 健康指数 0-100 */
  health: number
  /** 事业指数 0-100 */
  career: number
  /** 感情指数 0-100 */
  relationship: number
  /** 学业指数 0-100 */
  study: number
  /** 贵人指数 0-100 */
  benefactor: number
  /** 人丁指数 0-100 */
  population: number
  /** 综合运势 0-100 */
  overall: number
}

// ============ 综合特征 ============

export interface OverallFeatures {
  /** 综合评分 0-100 */
  score: number
  /** 风水等级 */
  grade: '大吉' | '吉' | '平' | '小凶' | '凶'
  /** 主要优势 */
  strengths: string[]
  /** 主要问题 */
  issues: string[]
  /** 整体评价 */
  summary: string
}

// ============ 来源信息 ============

export interface FeatureSourceInfo {
  /** 来自视觉识别 */
  fromVision: boolean
  /** 来自户型分析 */
  fromFloorPlan: boolean
  /** 来自空间计算 */
  fromSpatial: boolean
  /** 来自家具分析 */
  fromFurniture: boolean
  /** 来自房间分析 */
  fromRoom: boolean
  /** 置信度 */
  confidence: number
}
