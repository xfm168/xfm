/**
 * 格局判断（规则引擎驱动）
 * 完整格局体系：正格、从格、专旺格、化气格、调候格、病药格、扶抑格、通关格
 *
 * 所有格局规则定义在 rules/gejuRules.ts
 * 本文件仅负责流程编排和对外暴露接口
 */

import type { GanZhi, ShenShi, FiveElement } from './types'
import {
  determineGeJu as runGeJuRules,
  type GeJuResult,
  type GeJuName,
  type GeJuCategory,
  buildGeJuContext,
  GEJU_RULES,
} from './rules/gejuRules'

export type { GeJuName, GeJuCategory, GeJuResult }
export { buildGeJuContext, GEJU_RULES }

/**
 * 判断命局格局
 * 内部通过规则引擎执行，新增格局只需在 gejuRules.ts 添加规则
 */
export function determineGeJu(
  sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi },
  relatedShens: Record<string, ShenShi>,
  strengthScore: number,
  dayGan: string,
  monthZhi: string,
  fiveElementCount: Record<FiveElement, number>,
): GeJuResult {
  return runGeJuRules(sixLines, relatedShens, strengthScore, dayGan, monthZhi, fiveElementCount)
}

/**
 * 获取格局名称列表
 */
export function getGeJuNames(): GeJuName[] {
  return GEJU_RULES.map(r => r.result.name as GeJuName).filter(Boolean)
}
