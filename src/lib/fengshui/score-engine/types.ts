/**
 * Score Engine - 统一评分引擎类型定义
 * 
 * 统一负责：
 * - 总分
 * - 房间分
 * - 五行分
 * - 空间分
 * - 采光分
 * - 家具分
 * - 健康分
 * - 财运分
 * - 事业分
 * - 感情分
 * - 可信度
 * 
 * 以后任何模块都走这里，不让 Rule 自己算最终分。
 */

import type { FiveElement, Direction } from '../types'

// ============ 评分结果 ============

export interface ScoreEngineResult {
  /** 综合总分 */
  overall: OverallScore
  
  /** 维度评分 */
  dimensions: DimensionScores
  
  /** 运势评分 */
  fortune: FortuneScores
  
  /** 房间评分 */
  rooms: RoomScores
  
  /** 五行评分 */
  elements: ElementScores
  
  /** 空间评分 */
  spatial: SpatialScores
  
  /** 可信度 */
  confidence: ConfidenceInfo
  
  /** 评分明细 */
  breakdown: ScoreBreakdown[]
}

// ============ 综合评分 ============

export interface OverallScore {
  /** 总分 0-100 */
  score: number
  /** 等级 */
  grade: '大吉' | '吉' | '平' | '小凶' | '凶'
  /** 评语 */
  comment: string
  /** 击败百分比（模拟） */
  percentile: number
}

// ============ 维度评分 ============

export interface DimensionScores {
  /** 采光 */
  lighting: number
  /** 通风 */
  ventilation: number
  /** 空间感 */
  spaciousness: number
  /** 布局合理性 */
  layout: number
  /** 风水吉凶 */
  fengShui: number
  /** 居住舒适度 */
  comfort: number
  /** 安全性 */
  safety: number
}

// ============ 运势评分 ============

export interface FortuneScores {
  /** 财运 */
  wealth: number
  /** 事业运 */
  career: number
  /** 健康运 */
  health: number
  /** 感情运 */
  relationship: number
  /** 学业运 */
  study: number
  /** 贵人运 */
  benefactor: number
  /** 人丁运 */
  population: number
  /** 综合运势 */
  overall: number
}

// ============ 房间评分 ============

export interface RoomScores {
  /** 各房间得分 */
  byRoom: {
    roomId: string
    roomName: string
    roomType: string
    score: number
    rank: number
    isBest: boolean
    isWorst: boolean
  }[]
  
  /** 最高分房间 */
  bestRoom: { roomName: string; score: number }
  /** 最低分房间 */
  worstRoom: { roomName: string; score: number }
  /** 房间平均得分 */
  average: number
}

// ============ 五行评分 ============

export interface ElementScores {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
  
  /** 旺元素 */
  dominant: FiveElement
  /** 弱元素 */
  weakest: FiveElement
  /** 五行平衡度 0-100 */
  balance: number
  /** 五行状态 */
  state: '平衡' | '偏旺' | '偏弱' | '过旺' | '过弱'
}

// ============ 空间评分 ============

export interface SpatialScores {
  /** 户型方正度 */
  shapeRegularity: number
  /** 缺角影响 */
  missingCornersImpact: number
  /** 空间利用率 */
  spaceUtilization: number
  /** 动线流畅度 */
  circulationFlow: number
  /** 聚气程度 */
  qiGathering: number
  /** 中宫状态 */
  centerPalace: number
}

// ============ 可信度 ============

export interface ConfidenceInfo {
  /** 整体可信度 0-100 */
  overall: number
  /** 各来源可信度 */
  sources: {
    vision: number
    floorPlan: number
    spatial: number
    furniture: number
    room: number
    userInput: number
  }
  /** 数据完整度 0-100 */
  dataCompleteness: number
  /** 置信等级 */
  level: '极高' | '高' | '中' | '低' | '极低'
}

// ============ 评分明细 ============

export interface ScoreBreakdown {
  category: string
  item: string
  score: number
  weight: number
  weightedScore: number
  description: string
  isPositive: boolean
  source: string
}

// ============ 评分输入 ============

export interface ScoreEngineInput {
  /** 环境特征 */
  features?: any // EnvironmentalFeatures
  /** 空间分析结果 */
  spatial?: any // SpatialAnalysisResult
  /** 房间分析结果 */
  rooms?: any // HouseRoomAnalysisResult
  /** 规则执行结果 */
  ruleResults?: any[] // FengShuiRuleResult[]
  /** 用户提供信息 */
  userProvided?: {
    totalArea?: number
    floor?: number
    totalFloors?: number
    orientation?: string
    houseType?: string
  }
}

// ============ V3.0 八维评分体系 ============

/** 八维评分维度 */
export interface ScoreDimension8D {
  /** 格局评分 - 户型方正度、缺角情况、整体结构 */
  pattern: ScoreDimension
  /** 藏风评分 - 气流回旋、穿堂风防护、门窗关系 */
  windGathering: ScoreDimension
  /** 聚气评分 - 明堂开阔、财位通畅、能量聚集 */
  qiGathering: ScoreDimension
  /** 明堂评分 - 入户区域、玄关设计、第一印象 */
  mingHall: ScoreDimension
  /** 动线评分 - 通行顺畅、家具布局、空间利用率 */
  flowPath: ScoreDimension
  /** 光线评分 - 自然采光、人工照明、阴阳平衡 */
  lighting: ScoreDimension
  /** 五行协调评分 - 元素分布、五行平衡、相生相克 */
  elementHarmony: ScoreDimension
  /** 综合建议评分 - 可执行性、改善潜力、整体提升空间 */
  advice: ScoreDimension
}

/** 单个维度评分详情 */
export interface ScoreDimension {
  score: number              // 0-100
  maxScore: number           // 满分100
  weight: number             // 该维度权重
  weightedScore: number      // 加权后得分
  level: 'excellent' | 'good' | 'fair' | 'poor'
  description: string         // 该维度评价描述
  factors: { name: string; impact: number; positive: boolean }[]
}

/** 八维评分结果 */
export interface Score8DResult {
  dimensions: ScoreDimension8D
  overallScore: number
  overallLevel: 'excellent' | 'good' | 'fair' | 'poor'
  summary: string
}
