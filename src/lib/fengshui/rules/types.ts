/**
 * Rule Engine - 规则类型定义
 * 
 * Rule 永远保持极简。
 * 只允许：
 * - condition
 * - score
 * - priority
 * - referenceIds
 * 
 * 禁止：
 * - 写解释
 * - 写古籍
 * - 写 Prompt
 * - 写大段文字
 */

import type { Direction, FiveElement } from '../types'

// ============ 规则定义 ============

export interface FengShuiRule {
  /** 规则ID */
  id: string
  /** 规则名称 */
  name: string
  /** 规则分类 */
  category: RuleCategory
  /** 适用位置 */
  applicableTo: RoomType[]
  /** 来源 */
  source: string[]
  /** 传承 */
  heritage: 'classical' | 'modern' | 'both'
  /** 优先级 */
  priority: number
  /** 权重 */
  weight: number
  /** 可信度 */
  confidence: number
  /** 关联的知识库ID */
  referenceIds: string[]
  /** 规则标签 */
  tags: string[]
  /** 规则来源流派 */
  schools: FengShuiSchool[]
  /** 条件函数 */
  condition: (ctx: FengShuiContext) => boolean
  /** 结果 */
  result: RuleResult
  /** 影响方面（健康/财运/事业/感情/学业） */
  impact?: RuleImpact
  /** 改善建议 */
  improvement?: string
}

export interface RuleImpact {
  health?: number
  wealth?: number
  career?: number
  relationship?: number
  study?: number
  sleep?: number
}

export interface RuleResult {
  /** 结果类型 */
  type: 'auspicious' | 'inauspicious' | 'neutral' | 'warning'
  /** 基础分 */
  score: number
  /** 标签 */
  tags?: string[]
}

export type RuleCategory = 
  | 'orientation'      // 朝向
  | 'layout'           // 布局
  | 'door'             // 门
  | 'window'           // 窗
  | 'bed'              // 床
  | 'kitchen'          // 厨房
  | 'bathroom'         // 卫生间
  | 'living'           // 客厅
  | 'study'            // 书房
  | 'dining'           // 餐厅
  | 'balcony'          // 阳台
  | 'entrance'         // 玄关
  | 'balance'          // 平衡
  | 'element'          // 五行
  | 'sha'              // 煞气
  | 'house'            // 房屋整体

export type RoomType = 
  | 'entrance'     // 玄关
  | 'living'       // 客厅
  | 'bedroom'      // 卧室
  | 'master-bedroom' // 主卧
  | 'kitchen'      // 厨房
  | 'bathroom'     // 卫生间
  | 'study'        // 书房
  | 'dining'       // 餐厅
  | 'balcony'      // 阳台
  | 'house'        // 全屋

export type FengShuiSchool = 
  | 'bazhai'       // 八宅派
  | 'xuankong'     // 玄空派
  | 'sanhe'        // 三合派
  | 'sanyuan'      // 三元派
  | 'zangfeng'     // 藏风派
  | 'modern'       // 现代风水

// ============ 规则上下文 ============

export interface FengShuiContext {
  /** 方向信息 */
  direction: {
    mainDirection: Direction
    facingDirection: Direction
  }
  /** 布局信息 */
  layout: {
    shape: LayoutShape
    missingCorners: MissingCorner[]
  }
  /** 房间信息 */
  rooms: RoomInfo[]
  /** 五行分布 */
  elementDistribution: Record<FiveElement, number>
  /** 空间分析结果（可选） */
  spatial?: any
  /** 环境特征（可选） */
  features?: any
}

export type LayoutShape = 'square' | 'rectangle' | 'L-shape' | 'irregular'

export interface MissingCorner {
  direction: Direction
  severity: 'mild' | 'moderate' | 'severe'
}

export interface RoomInfo {
  roomId: string
  roomType: RoomType
  score: number
}

// ============ 规则执行结果 ============

export interface FengShuiRuleResult {
  ruleId: string
  ruleName: string
  category: RuleCategory
  /** 是否匹配 */
  matched: boolean
  /** 得分 */
  score: number
  /** 权重 */
  weight: number
  /** 优先级 */
  priority: number
  /** 类型 */
  type: 'auspicious' | 'inauspicious' | 'neutral' | 'warning'
  /** 解释 */
  explanation?: string
  /** 古籍依据 */
  classicalRef?: string
  /** 改善建议 */
  suggestion?: string
  /** 可信度 */
  confidence: number
  /** 来源 */
  source: string[]
}

export interface RuleExecutionInput {
  context: FengShuiContext
  /** 可选：只执行特定分类的规则 */
  categories?: RuleCategory[]
  /** 可选：只执行特定房间的规则 */
  roomTypes?: RoomType[]
}

export interface RuleExecutionResult {
  /** 所有规则结果 */
  results: FengShuiRuleResult[]
  /** 综合得分 */
  overallScore: number
  /** 通过的规则数 */
  passedCount: number
  /** 失败的规则数 */
  failedCount: number
  /** 各分类得分 */
  categoryScores: Record<RuleCategory, { passed: number; total: number; avgScore: number }>
  /** 各房间得分 */
  roomScores: Record<string, { passed: number; total: number; avgScore: number }>
}
