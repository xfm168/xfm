/**
 * V3.1 统一规则引擎注册表
 * 汇总所有 132 条规则，提供统一查询与匹配接口
 */

import type { FengShuiRuleV31 } from '../types'
import { doorRules } from './data/door'
import { livingRules } from './data/living'
import { bedroomRules } from './data/bedroom'
import { kitchenRules } from './data/kitchen'
import { bathroomRules } from './data/bathroom'
import { balconyRules } from './data/balcony'
import { wealthRules } from './data/wealth'
import { fiveElementRules } from './data/fiveElement'
import { healthRules } from './data/health'
import { careerRules } from './data/career'
import { familyRules } from './data/family'
import { beamRules } from './data/beam'
import { shaQiRules } from './data/shaQi'
import { layoutRules } from './data/layout'

/** 全部 132 条规则 */
export const ALL_RULES_V31: FengShuiRuleV31[] = [
  ...doorRules,
  ...livingRules,
  ...bedroomRules,
  ...kitchenRules,
  ...bathroomRules,
  ...balconyRules,
  ...wealthRules,
  ...fiveElementRules,
  ...healthRules,
  ...careerRules,
  ...familyRules,
  ...beamRules,
  ...shaQiRules,
  ...layoutRules,
]


/** 按适用空间获取规则 */
function getRulesByRoom(roomType: string): FengShuiRuleV31[] {
  return ALL_RULES_V31.filter(r => r.applicableRooms.includes(roomType as any))
}

/** 按 ID 获取规则 */
export function getRuleById(id: string): FengShuiRuleV31 | undefined {
  return ALL_RULES_V31.find(r => r.id === id)
}

/** 分类统计 */
export function getRuleStats() {
  const categories = {} as Record<string, number>
  const severities = {} as Record<string, number>
  const schools = {} as Record<string, number>

  ALL_RULES_V31.forEach(r => {
    categories[r.category] = (categories[r.category] || 0) + 1
    severities[r.severity] = (severities[r.severity] || 0) + 1
    schools[r.school] = (schools[r.school] || 0) + 1
  })

  return { total: ALL_RULES_V31.length, categories, severities, schools }
}

/** 规则匹配结果 */
export interface RuleMatchResult {
  rule: FengShuiRuleV31
  matched: boolean
  confidence: number
  reason: string
}

/** 简单规则匹配器（基于关键词与 roomType） */
export function matchRules(roomType: string, detectedObjects: string[]): RuleMatchResult[] {
  const applicable = getRulesByRoom(roomType)
  return applicable.map(rule => {
    const objMatch = detectedObjects.some(obj =>
      rule.condition.target?.includes(obj) ||
      rule.tags.some(tag => obj.includes(tag))
    )
    const matched = objMatch || rule.condition.type === 'room_type'
    return {
      rule,
      matched,
      confidence: matched ? 0.8 : 0.2,
      reason: matched ? `检测到相关元素: ${rule.condition.target}` : '未检测到相关元素',
    }
  })
}
