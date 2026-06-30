/**
 * 户型识别模块
 * 
 * @example
 * import { analyzeFloorPlan, generateFloorPlanSummary } from './floor-plan'
 * 
 * const result = await analyzeFloorPlan(imageBase64, {
 *   depth: 'standard',
 *   assessFengShui: true,
 * })
 * 
 * console.log(result.outline.shape)     // 户型形状
 * console.log(result.outline.missingCorners)  // 缺角情况
 * console.log(result.centerPoint)        // 中宫信息
 * console.log(result.fengShuiAssessment) // 风水评估
 */

export * from './types'
export * from './analyzer'
