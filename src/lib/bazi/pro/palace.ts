/**
 * H3 Module 1: 命宫 / 身宫
 *
 * 命宫：以生月地支起子，逆数到生时地支落宫，再以生年天干遁干。
 * 身宫：以生月地支起子，顺数到生时地支落宫，再以生年天干遁干。
 *
 * 公式来源：《三命通会》《渊海子平》
 */

import { HEAVENLY_STEMS, MONTH_BRANCHES, EARTHLY_BRANCHES } from '@/lib/core/constants'
import type { HeavenlyStem, EarthlyBranch } from '@/lib/core/types/base'
import type { PalaceResult, DerivationStep, DerivationChain } from './types'
import { createChain } from './types'

// 十二宫位名称（寅为首位，即命盘十二宫）
const PALACE_NAMES = [
  '命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄',
  '迁移', '交友', '官禄', '田宅', '福德', '父母',
]

/**
 * 计算命宫
 *
 * 算法：
 * 1. 以月支在十二地支中的位置为起点
 * 2. 从寅位起子时，逆数到生时
 * 3. 落宫位置即为命宫地支
 * 4. 以年干按五虎遁起寅宫天干
 */
export function calculateMingGong(
  yearGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
  hourZhi: EarthlyBranch,
): PalaceResult {
  const startTime = Date.now()
  const steps: DerivationStep[] = []

  // 月支在 EARTHLY_BRANCHES 中的索引
  const monthIdx = EARTHLY_BRANCHES.indexOf(monthZhi)
  // 时支索引
  const hourIdx = EARTHLY_BRANCHES.indexOf(hourZhi)

  // 命宫地支 = 寅位 + 月支索引 - 时支索引（从寅起子，逆数）
  // 寅的索引是 2
  // 从寅位起子时的宫位 = 寅位（月支方向从寅到月支，即 monthIdx-2 步）
  // 逆数时支步数 = hourIdx 步
  // 命宫地支索引 = 2 + (monthIdx - 2) - hourIdx
  // 化简 = monthIdx - hourIdx
  // 但要确保从寅顺时针逆数
  // 实际公式：宫位 = (月支 - 时支) mod 12，然后映射到地支
  // 从寅宫开始，子时在寅宫，丑时在丑宫... 逆时针
  let gongIdx = (monthIdx - hourIdx + 24) % 12

  // 映射到地支（寅=0 的宫位系统，所以 +2 转回地支索引）
  // 命宫地支 = (寅 + gongIdx) % 12 = (2 + gongIdx) % 12
  const mingZhi = EARTHLY_BRANCHES[(2 + gongIdx) % 12] as EarthlyBranch

  // 五虎遁：以年干起寅宫天干
  const yearGanIdx = HEAVENLY_STEMS.indexOf(yearGan)
  // 阳年起丙寅，阴年起壬寅
  const isYangYear = yearGanIdx % 2 === 0
  const startGanIdx = isYangYear ? 2 : 8 // 丙=2, 壬=8
  // 命宫天干 = (startGanIdx + gongIdx) % 10
  const mingGan = HEAVENLY_STEMS[(startGanIdx + gongIdx) % 10] as HeavenlyStem

  const palaceName = PALACE_NAMES[gongIdx % 12]

  steps.push({
    id: 'ming-gong-zhi',
    name: '命宫地支',
    input: { monthZhi, hourZhi, monthIdx, hourIdx },
    output: { mingZhi, gongIdx },
    ruleId: 'ming-gong-zhi-formula',
    ruleDescription: '月支逆数到时支落宫',
    confidence: 0.95,
    algorithmVersion: 'v1.0-classic',
    source: '三命通会',
    timestamp: Date.now(),
  })

  steps.push({
    id: 'ming-gong-gan',
    name: '命宫天干',
    input: { yearGan, isYangYear, startGanIdx, gongIdx },
    output: { mingGan },
    ruleId: 'wu-hu-dun',
    ruleDescription: '五虎遁年起寅宫天干',
    confidence: 0.95,
    algorithmVersion: 'v1.0-classic',
    source: '三命通会',
    timestamp: Date.now(),
  })

  const chain: DerivationChain = createChain(steps, Date.now() - startTime)

  return { ganZhi: { gan: mingGan, zhi: mingZhi }, palaceName, derivation: chain }
}

/**
 * 计算身宫
 *
 * 算法：
 * 1. 以月支起子，顺数到生时
 * 2. 落宫即为身宫地支
 * 3. 以年干五虎遁起天干
 */
export function calculateShenGong(
  yearGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
  hourZhi: EarthlyBranch,
): PalaceResult {
  const startTime = Date.now()
  const steps: DerivationStep[] = []

  const monthIdx = EARTHLY_BRANCHES.indexOf(monthZhi)
  const hourIdx = EARTHLY_BRANCHES.indexOf(hourZhi)

  // 身宫：从寅起子时，顺数到时支
  // 顺数：月支 + 时支
  let gongIdx = (monthIdx + hourIdx) % 12
  const shenZhi = EARTHLY_BRANCHES[(2 + gongIdx) % 12] as EarthlyBranch

  // 五虎遁
  const yearGanIdx = HEAVENLY_STEMS.indexOf(yearGan)
  const isYangYear = yearGanIdx % 2 === 0
  const startGanIdx = isYangYear ? 2 : 8
  const shenGan = HEAVENLY_STEMS[(startGanIdx + gongIdx) % 10] as HeavenlyStem

  const palaceName = PALACE_NAMES[gongIdx % 12]

  steps.push({
    id: 'shen-gong-zhi',
    name: '身宫地支',
    input: { monthZhi, hourZhi },
    output: { shenZhi, gongIdx },
    ruleId: 'shen-gong-zhi-formula',
    ruleDescription: '月支顺数到时支落宫',
    confidence: 0.95,
    algorithmVersion: 'v1.0-classic',
    source: '三命通会',
    timestamp: Date.now(),
  })

  steps.push({
    id: 'shen-gong-gan',
    name: '身宫天干',
    input: { yearGan, isYangYear, startGanIdx, gongIdx },
    output: { shenGan },
    ruleId: 'wu-hu-dun',
    ruleDescription: '五虎遁年起寅宫天干',
    confidence: 0.95,
    algorithmVersion: 'v1.0-classic',
    source: '三命通会',
    timestamp: Date.now(),
  })

  return {
    ganZhi: { gan: shenGan, zhi: shenZhi },
    palaceName,
    derivation: createChain(steps, Date.now() - startTime),
  }
}
