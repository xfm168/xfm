/**
 * 子时换日模块 - 统一入口
 * P0-② 子时换日
 *
 * 提供三种子时换日策略：
 * - late（晚子时/子初换日）：23:00 即换日，默认策略
 * - early（早子时/子正换日）：00:00 才换日
 * - gregorian（公历换日）：00:00 换日，与 early 行为相同
 */

export * from './strategies'

import { LateZiShiStrategy, EarlyZiShiStrategy, GregorianStrategy } from './strategies'
import type { ZiShiStrategy, ChartDateResult } from './strategies'
import type { ZiShiStrategyType } from '../types'

// 策略注册表（单例）
const STRATEGY_REGISTRY: Record<ZiShiStrategyType, ZiShiStrategy> = {
  late: new LateZiShiStrategy(),
  early: new EarlyZiShiStrategy(),
  gregorian: new GregorianStrategy(),
}

// 默认策略：晚子时（子初换日）
export const DEFAULT_STRATEGY: ZiShiStrategyType = 'late'

/**
 * 根据策略类型获取策略实例
 */
export function getZiShiStrategy(type: ZiShiStrategyType): ZiShiStrategy {
  return STRATEGY_REGISTRY[type]
}

/**
 * 解析出生时间，返回用于排盘的 chartDate 与时辰索引
 *
 * @param birth 出生时间（Date 对象，使用本地时间）
 * @param strategy 子时换日策略类型，不传则使用 DEFAULT_STRATEGY（'late'）
 * @returns ChartDateResult 排盘日期结果
 */
export function resolveChartDate(birth: Date, strategy?: ZiShiStrategyType): ChartDateResult {
  const s = strategy ?? DEFAULT_STRATEGY
  return getZiShiStrategy(s).resolveChartDate(birth)
}
