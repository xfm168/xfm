/**
 * P8 成长体系模块
 * 纯逻辑函数，无副作用，不耦合 Engine
 */

import type { GrowthLevel } from './types'

// ────────────────────────────────────────────────
//  成长等级常量（0~9级）
// ────────────────────────────────────────────────
export var growthLevels: GrowthLevel[] = [
  {
    level: 0,
    title: '初入江湖',
    minPoints: 0,
    maxCharts: 3,
    aiCreditsBonus: 0,
    discountPercent: 0,
    icon: 'seedling',
  },
  {
    level: 1,
    title: '略有小成',
    minPoints: 100,
    maxCharts: 5,
    aiCreditsBonus: 10,
    discountPercent: 2,
    icon: 'sprout',
  },
  {
    level: 2,
    title: '初窥门径',
    minPoints: 500,
    maxCharts: 8,
    aiCreditsBonus: 20,
    discountPercent: 3,
    icon: 'leaf',
  },
  {
    level: 3,
    title: '登堂入室',
    minPoints: 1500,
    maxCharts: 10,
    aiCreditsBonus: 30,
    discountPercent: 5,
    icon: 'tree',
  },
  {
    level: 4,
    title: '融会贯通',
    minPoints: 3000,
    maxCharts: 15,
    aiCreditsBonus: 50,
    discountPercent: 7,
    icon: 'fire',
  },
  {
    level: 5,
    title: '炉火纯青',
    minPoints: 6000,
    maxCharts: 20,
    aiCreditsBonus: 80,
    discountPercent: 8,
    icon: 'star',
  },
  {
    level: 6,
    title: '出神入化',
    minPoints: 10000,
    maxCharts: -1,
    aiCreditsBonus: 120,
    discountPercent: 10,
    icon: 'lightning',
  },
  {
    level: 7,
    title: '返璞归真',
    minPoints: 18000,
    maxCharts: -1,
    aiCreditsBonus: 180,
    discountPercent: 12,
    icon: 'gem',
  },
  {
    level: 8,
    title: '天人合一',
    minPoints: 30000,
    maxCharts: -1,
    aiCreditsBonus: 250,
    discountPercent: 15,
    icon: 'crown',
  },
  {
    level: 9,
    title: '大道无极',
    minPoints: 50000,
    maxCharts: -1,
    aiCreditsBonus: 500,
    discountPercent: 20,
    icon: 'universe',
  },
]

// ────────────────────────────────────────────────
//  核心业务函数
// ────────────────────────────────────────────────

/** 根据累计积分计算当前成长等级 */
export function calculateGrowthLevel(totalPoints: number): GrowthLevel {
  var result = growthLevels[0]
  for (var i = 0; i < growthLevels.length; i++) {
    if (totalPoints >= growthLevels[i].minPoints) {
      result = growthLevels[i]
    } else {
      break
    }
  }
  return result
}

/** 获取某等级的权益 */
export function getGrowthBenefits(level: number): {
  maxCharts: number
  aiCreditsBonus: number
  discountPercent: number
} {
  var growth = growthLevels[0]
  for (var i = 0; i < growthLevels.length; i++) {
    if (growthLevels[i].level === level) {
      growth = growthLevels[i]
      break
    }
  }
  return {
    maxCharts: growth.maxCharts,
    aiCreditsBonus: growth.aiCreditsBonus,
    discountPercent: growth.discountPercent,
  }
}

/**
 * 计算到下一级的进度
 * @returns current 当前积分, target 下一级所需积分, percent 百分比进度
 */
export function getNextLevelProgress(
  points: number,
  level: number
): { current: number; target: number; percent: number } {
  // 查找当前等级在数组中的索引
  var currentIdx = 0
  for (var i = 0; i < growthLevels.length; i++) {
    if (growthLevels[i].level === level) {
      currentIdx = i
      break
    }
  }

  // 已经是最高级
  if (currentIdx >= growthLevels.length - 1) {
    return {
      current: points,
      target: growthLevels[currentIdx].minPoints,
      percent: 100,
    }
  }

  var currentLevel = growthLevels[currentIdx]
  var nextLevel = growthLevels[currentIdx + 1]
  var range = nextLevel.minPoints - currentLevel.minPoints
  var progress = points - currentLevel.minPoints

  var percent = 0
  if (range > 0) {
    percent = Math.floor(progress / range * 100)
    if (percent > 100) {
      percent = 100
    }
    if (percent < 0) {
      percent = 0
    }
  }

  return {
    current: points,
    target: nextLevel.minPoints,
    percent: percent,
  }
}
