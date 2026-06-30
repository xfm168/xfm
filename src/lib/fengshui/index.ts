/**
 * 风水模块
 * 
 * 复用八字 Rule Engine 架构
 * 
 * @example
 * // 基础分析
 * import { analyzeFengShui, createDefaultContext } from '@/lib/fengshui'
 * 
 * const context = createDefaultContext({
 *   houseType: 'apartment',
 *   direction: { mainDirection: 'south', facingDirection: 'north', doorDirection: 'south' },
 *   layout: { shape: 'square', score: 85, missingCorners: [], totalArea: 100, usableArea: 90 },
 *   rooms: [...],
 *   elementDistribution: { 木: 2, 火: 2, 土: 2, 金: 2, 水: 2 },
 * })
 * 
 * const result = analyzeFengShui(context)
 * 
 * @example
 * // 图片分析完整流程
 * import { generateFengShuiReport } from '@/lib/fengshui'
 * 
 * const report = await generateFengShuiReport(imageBase64, {
 *   analysisType: 'full',
 *   includeAI: true,
 * })
 * 
 * console.log(report.fengshuiAnalysis.result)
 * console.log(report.aiSuggestions)
 * console.log(report.report.sections)
 */

export * from './types'
export * from './analyzer'
export * from './rules/fengshuiRules'
export * from './imageAnalyzer'
export * from './aiImageAnalyzer'
export * from './reportGenerator'
export * from './vision'
export * from './floor-plan'
export * from './spatial'
export * from './room-engine'
export * from './feature-engine'
export * from './score-engine'

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

/**
 * 创建示例上下文
 */
export function createExampleContext(): FengShuiContext {
  return createDefaultContext({
    houseType: 'apartment',
    houseAge: 3,
    currentFloor: 15,
    totalFloors: 33,
    totalArea: 120,
    
    direction: {
      mainDirection: 'south',
      facingDirection: 'north',
      doorDirection: 'south',
    },
    
    layout: {
      shape: 'square',
      score: 85,
      missingCorners: [],
      totalArea: 120,
      usableArea: 108,
    },
    
    rooms: [
      {
        type: 'living',
        size: 30,
        direction: 'south' as Direction,
        position: 'front',
        hasWindow: true,
        hasBalcony: true,
        floor: 15,
        furniture: [
          { type: 'sofa', direction: 'north' as Direction, position: 'center', material: '木' },
          { type: 'tv-stand', direction: 'south' as Direction, position: 'center' },
        ],
        element: '火',
      },
      {
        type: 'master-bedroom',
        size: 20,
        direction: 'east' as Direction,
        position: 'back',
        hasWindow: true,
        hasBalcony: false,
        floor: 15,
        furniture: [
          { type: 'bed', direction: 'east' as Direction, position: 'center', material: '木' },
          { type: 'wardrobe', direction: 'north' as Direction, position: 'right' },
        ],
        element: '木',
      },
      {
        type: 'kitchen',
        size: 10,
        direction: 'north' as Direction,
        position: 'left',
        hasWindow: true,
        hasBalcony: false,
        floor: 15,
        furniture: [
          { type: 'stove', direction: 'east' as Direction, position: 'center', material: '火' },
          { type: 'refrigerator', direction: 'west' as Direction, position: 'corner', material: '金' },
        ],
        element: '火',
      },
    ],
    
    elementDistribution: {
      '木': 3,
      '火': 2,
      '土': 2,
      '金': 2,
      '水': 1,
    },
    
    nearbyRoads: 0,
    nearbyTJunction: false,
    nearbyPole: false,
    nearWater: false,
    nearMountain: false,
  })
}
