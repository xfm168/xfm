/**
 * H3 Module 1: 胎元 / 胎息
 *
 * 胎元：月干进一位、月支进三位。
 *   天干：月干 + 1（阳进阳，阴进阴）
 *   地支：月支 + 3（顺行三位）
 *
 * 胎息：日干进一位、日支进三位。
 *   天干：日干 + 1
 *   地支：日支 + 3
 *
 * 公式来源：《三命通会》《珞琭子》
 */

import { HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/lib/core/constants'
import type { HeavenlyStem, EarthlyBranch, NaYin } from '@/lib/core/types/base'
import type { TaiYuanResult, TaiXiResult, DerivationStep } from './types'
import { createChain } from './types'
import { getNaYin } from './helpers'

/**
 * 计算胎元
 *
 * 胎元天干 = 月干顺进一位
 * 胎元地支 = 月支顺进三位
 */
export function calculateTaiYuan(
  monthGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
): TaiYuanResult {
  const startTime = Date.now()
  const steps: DerivationStep[] = []

  const mGanIdx = HEAVENLY_STEMS.indexOf(monthGan)
  const mZhiIdx = EARTHLY_BRANCHES.indexOf(monthZhi)

  // 天干顺进一位
  const taiGan = HEAVENLY_STEMS[(mGanIdx + 1) % 10] as HeavenlyStem
  // 地支顺进三位
  const taiZhi = EARTHLY_BRANCHES[(mZhiIdx + 3) % 12] as EarthlyBranch
  const taiNaYin = getNaYin(taiGan, taiZhi)

  steps.push({
    id: 'taiyuan-gan',
    name: '胎元天干',
    input: { monthGan, mGanIdx },
    output: { taiGan, formula: '(月干+1) % 10' },
    ruleId: 'taiyuan-gan-formula',
    ruleDescription: '月干顺进一位',
    confidence: 0.90,
    algorithmVersion: 'v1.0-classic',
    source: '珞琭子',
    timestamp: Date.now(),
  })

  steps.push({
    id: 'taiyuan-zhi',
    name: '胎元地支',
    input: { monthZhi, mZhiIdx },
    output: { taiZhi, formula: '(月支+3) % 12' },
    ruleId: 'taiyuan-zhi-formula',
    ruleDescription: '月支顺进三位',
    confidence: 0.90,
    algorithmVersion: 'v1.0-classic',
    source: '珞琭子',
    timestamp: Date.now(),
  })

  return {
    ganZhi: { gan: taiGan, zhi: taiZhi },
    naYin: taiNaYin,
    derivation: createChain(steps, Date.now() - startTime),
  }
}

/**
 * 计算胎息
 *
 * 胎息天干 = 日干顺进一位
 * 胎息地支 = 日支顺进三位
 */
export function calculateTaiXi(
  dayGan: HeavenlyStem,
  dayZhi: EarthlyBranch,
): TaiXiResult {
  const startTime = Date.now()
  const steps: DerivationStep[] = []

  const dGanIdx = HEAVENLY_STEMS.indexOf(dayGan)
  const dZhiIdx = EARTHLY_BRANCHES.indexOf(dayZhi)

  // 天干顺进一位
  const xiGan = HEAVENLY_STEMS[(dGanIdx + 1) % 10] as HeavenlyStem
  // 地支顺进三位
  const xiZhi = EARTHLY_BRANCHES[(dZhiIdx + 3) % 12] as EarthlyBranch
  const xiNaYin = getNaYin(xiGan, xiZhi)

  steps.push({
    id: 'taixi-gan',
    name: '胎息天干',
    input: { dayGan, dGanIdx },
    output: { xiGan, formula: '(日干+1) % 10' },
    ruleId: 'taixi-gan-formula',
    ruleDescription: '日干顺进一位',
    confidence: 0.90,
    algorithmVersion: 'v1.0-classic',
    source: '珞琭子',
    timestamp: Date.now(),
  })

  steps.push({
    id: 'taixi-zhi',
    name: '胎息地支',
    input: { dayZhi, dZhiIdx },
    output: { xiZhi, formula: '(日支+3) % 12' },
    ruleId: 'taixi-zhi-formula',
    ruleDescription: '日支顺进三位',
    confidence: 0.90,
    algorithmVersion: 'v1.0-classic',
    source: '珞琭子',
    timestamp: Date.now(),
  })

  return {
    ganZhi: { gan: xiGan, zhi: xiZhi },
    naYin: xiNaYin,
    derivation: createChain(steps, Date.now() - startTime),
  }
}
