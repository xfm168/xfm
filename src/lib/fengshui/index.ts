/**
 * 玄风风水模块 V4.3
 * 
 * 唯一 Pipeline（禁止绕过）：
 * 图片 → Vision Engine → FloorPlan Engine → Spatial Engine → Furniture Engine
 * → Room Engine → Feature Engine → Rule Engine → Score Engine → Knowledge Base
 * → Explain Engine → AI Report → Frontend
 * 
 * 核心特性：
 * - 101条精品规则（按房间分类管理）
 * - 知识库（古籍/案例/植物/颜色/材料/符号）
 * - 固定12章节报告模板
 * - 证据链（结论→Rule→古籍→改善→预计提升）
 * - 整改模拟（调整家具实时重算评分）
 * 
 * @example
 * // 图片分析完整流程（推荐入口）
 * import { runFullPipeline } from '@/lib/fengshui'
 * 
 * const result = await runFullPipeline({
 *   imageData: imageBase64,
 *   roomType: 'living',
 *   mode: 'standard',
 * })
 * 
 * @example
 * // 规则库访问
 * import { ALL_RULES, RULE_STATS } from '@/lib/fengshui'
 * console.log(RULE_STATS.total) // 101
 * 
 * @example
 * // 整改模拟
 * import { SimulationEngine } from '@/lib/fengshui'
 * const sim = new SimulationEngine(context)
 */

export type * from './types'
export { ALL_RULES, RULES_BY_ROOM, RULE_STATS, executeRules } from './rules'
export { runFullPipeline, PIPELINE_STEPS } from './pipeline'
export type { PipelineStep, PipelineInput, PipelineOutput, PipelineReport, ReportSection } from './pipeline'
export { SimulationEngine } from './simulation'
export type { SimulationState, SimulationResult } from './simulation'
export { buildEvidenceChain, evidenceChainToMarkdown } from './evidenceChain'
export { knowledgeBase } from './knowledge'
export type { KnowledgeEntry, FengShuiCase, SchoolInfo, PlantKnowledge, ColorKnowledge, MaterialKnowledge, SymbolKnowledge } from './knowledge'

import type { FengShuiContext, Direction, Room, Furniture } from './types'

/**
 * 创建默认风水上下文
 */
export function createDefaultContext(partial?: Partial<FengShuiContext>): FengShuiContext {
  return {
    houseType: partial?.houseType || 'apartment',
    houseAge: partial?.houseAge || 5,
    totalFloors: partial?.totalFloors || 30,
    currentFloor: partial?.currentFloor || 10,
    totalArea: partial?.totalArea || 100,
    
    direction: partial?.direction || {
      mainDirection: 'south',
      facingDirection: 'north',
      doorDirection: 'south',
    },
    
    layout: partial?.layout || {
      shape: 'square',
      score: 80,
      missingCorners: [],
      totalArea: 100,
      usableArea: 90,
    },
    
    rooms: partial?.rooms || [],
    
    elementDistribution: partial?.elementDistribution || {
      '木': 2,
      '火': 2,
      '土': 2,
      '金': 2,
      '水': 2,
    },
    
    nearbyRoads: partial?.nearbyRoads || 0,
    nearbyTJunction: partial?.nearbyTJunction || false,
    nearbyPole: partial?.nearbyPole || false,
    nearWater: partial?.nearWater || false,
    nearMountain: partial?.nearMountain || false,
    
    ownerBazi: partial?.ownerBazi,
  }
}
