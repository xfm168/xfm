/**
 * Feng Shui Rules - 规则库入口
 * 
 * 按房间分类管理：
 * - house (房屋整体)
 * - entrance (玄关)
 * - living-room (客厅)
 * - master-bedroom (主卧)
 * - bedroom (次卧)
 * - study (书房)
 * - kitchen (厨房)
 * - bathroom (卫生间)
 * - dining-room (餐厅)
 * - balcony (阳台)
 * 
 * Rule 永远保持极简：
 * - condition
 * - priority
 * - score
 * - confidence
 * - referenceIds
 */

import type { FengShuiRule } from './types'

import { HOUSE_RULES } from './rooms/house/rules'
import { ENTRANCE_RULES } from './rooms/entrance/rules'
import { LIVING_ROOM_RULES } from './rooms/living-room/rules'
import { MASTER_BEDROOM_RULES } from './rooms/master-bedroom/rules'
import { BEDROOM_RULES } from './rooms/bedroom/rules'
import { STUDY_RULES } from './rooms/study/rules'
import { KITCHEN_RULES } from './rooms/kitchen/rules'
import { BATHROOM_RULES } from './rooms/bathroom/rules'
import { DINING_ROOM_RULES } from './rooms/dining-room/rules'
import { BALCONY_RULES } from './rooms/balcony/rules'

// ============ 所有规则 ============

export const ALL_RULES: FengShuiRule[] = [
  ...HOUSE_RULES,
  ...ENTRANCE_RULES,
  ...LIVING_ROOM_RULES,
  ...MASTER_BEDROOM_RULES,
  ...BEDROOM_RULES,
  ...STUDY_RULES,
  ...KITCHEN_RULES,
  ...BATHROOM_RULES,
  ...DINING_ROOM_RULES,
  ...BALCONY_RULES,
]

// ============ 按房间分类 ============

export const RULES_BY_ROOM = {
  house: HOUSE_RULES,
  entrance: ENTRANCE_RULES,
  'living-room': LIVING_ROOM_RULES,
  'master-bedroom': MASTER_BEDROOM_RULES,
  bedroom: BEDROOM_RULES,
  study: STUDY_RULES,
  kitchen: KITCHEN_RULES,
  bathroom: BATHROOM_RULES,
  'dining-room': DINING_ROOM_RULES,
  balcony: BALCONY_RULES,
}

// ============ 统计 ============

export const RULE_STATS = {
  total: ALL_RULES.length,
  byRoom: {
    house: HOUSE_RULES.length,
    entrance: ENTRANCE_RULES.length,
    'living-room': LIVING_ROOM_RULES.length,
    'master-bedroom': MASTER_BEDROOM_RULES.length,
    bedroom: BEDROOM_RULES.length,
    study: STUDY_RULES.length,
    kitchen: KITCHEN_RULES.length,
    bathroom: BATHROOM_RULES.length,
    'dining-room': DINING_ROOM_RULES.length,
    balcony: BALCONY_RULES.length,
  },
}

export * from './types'
export * from './executor'
