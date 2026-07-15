/**
 * 基础评分计算（Pipeline Step 使用）
 *
 * 从 pipeline/index.ts 提取，独立为可复用模块。
 */

import type { BaZiChart } from '../types'
import type { GeJuResult } from '../geju'

export function calculateBaZiScore(
  chart: BaZiChart,
  geJu: GeJuResult,
  xiYong: { bestElement: string; avoidedElements: string[] },
) {
  let overall = 60

  // 旺衰加分：中和偏旺最佳
  const strength = chart.dayMaster.strengthScore
  if (strength >= 40 && strength <= 60) {
    overall += 15
  } else if (strength >= 30 && strength <= 70) {
    overall += 10
  } else if (strength >= 20 && strength <= 80) {
    overall += 5
  }

  // 格局加分
  if (geJu.confidence && geJu.confidence > 70) {
    overall += 10
  } else if (geJu.confidence && geJu.confidence > 50) {
    overall += 5
  }

  // 五行平衡加分
  const elements = Object.values(chart.fiveElementCount) as number[]
  const max = Math.max(...elements)
  const min = Math.min(...elements)
  const balance = max > 0 ? min / max : 0
  if (balance > 0.5) {
    overall += 10
  } else if (balance > 0.3) {
    overall += 5
  }

  overall = Math.min(100, Math.max(0, Math.round(overall)))

  return {
    overall,
    strength: Math.round(strength),
    balance: Math.round(balance * 100),
    pattern: geJu.confidence || 0,
  }
}