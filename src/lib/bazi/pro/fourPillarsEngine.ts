/**
 * H3 Module 1: Professional Four Pillars Engine
 *
 * 商业级四柱排盘引擎。
 *
 * 数据流：
 *   BirthData → 四柱排盘 → 规则引擎 → 命局结果(JSON)
 *
 * 所有计算可追溯，结果带完整推导链。
 * 不调用 AI，纯规则引擎。
 */

import type { BirthData } from '@/lib/core/types/birth'
import { STEM_ELEMENT, STEM_YINYANG, CANG_GAN } from '@/lib/core/constants'
import type { HeavenlyStem, EarthlyBranch, FiveElement } from '@/lib/core/types/base'

import type {
  ProfessionalFourPillarsResult, GanZhi, SixLines, PillarDetail,
  DerivationStep, DerivationChain,
} from './types'
import { createChain } from './types'
import {
  getNaYin, getChangSheng, getStemElement,
  calculateFiveElementCount, getKongWang, getShenShi,
} from './helpers'
import { calculateMingGong, calculateShenGong } from './palace'
import { calculateTaiYuan, calculateTaiXi } from './taiyuan'

// 复用现有 calculator 的排盘核心
import { calculateBaZiFromBirthData } from '../calculator'

export const FOUR_PILLARS_VERSION = '1.0.0'

/**
 * Professional Four Pillars Engine 主入口
 *
 * 输入 BirthData，输出完整的 ProfessionalFourPillarsResult。
 * 内部复用现有 calculator 的四柱排盘，在其基础上增加：
 * - 命宫 / 身宫 / 胎元 / 胎息
 * - 四柱详解（纳音 + 十二长生 + 藏干 + 十神）
 * - 完整推导链
 */
export function calculateProfessionalFourPillars(birthData: BirthData): ProfessionalFourPillarsResult {
  const engineStart = Date.now()
  const allSteps: DerivationStep[] = []

  // Step 1: 复用现有排盘核心（不重复造轮子）
  const chart = calculateBaZiFromBirthData(birthData)
  const sixLines: SixLines = {
    year: { gan: chart.sixLines.year.gan, zhi: chart.sixLines.year.zhi },
    month: { gan: chart.sixLines.month.gan, zhi: chart.sixLines.month.zhi },
    day: { gan: chart.sixLines.day.gan, zhi: chart.sixLines.day.zhi },
    hour: { gan: chart.sixLines.hour.gan, zhi: chart.sixLines.hour.zhi },
  }

  allSteps.push({
    id: 'base-pillars',
    name: '四柱排盘',
    input: { birthday: birthData.birthday, birthTime: birthData.birthTime, useTrueSolarTime: birthData.useTrueSolarTime },
    output: { year: `${chart.sixLines.year.gan}${chart.sixLines.year.zhi}`, month: `${chart.sixLines.month.gan}${chart.sixLines.month.zhi}`, day: `${chart.sixLines.day.gan}${chart.sixLines.day.zhi}`, hour: `${chart.sixLines.hour.gan}${chart.sixLines.hour.zhi}` },
    ruleId: 'calculator-engine',
    ruleDescription: 'JDN日柱 + 立春分年 + 节气定月 + 五鼠遁时',
    confidence: 0.98,
    algorithmVersion: 'v1.0-classic',
    source: 'Modern Rule',
    timestamp: Date.now(),
  })

  // Step 2: 日主信息
  const dayMaster = sixLines.day.gan
  const dayMasterElement = getStemElement(dayMaster)
  const dayMasterYinYang = STEM_YINYANG[dayMaster]

  // Step 3: 四柱详解
  const dayGan = sixLines.day.gan
  const makePillarDetail = (pillar: GanZhi): PillarDetail => ({
    ganZhi: pillar,
    naYin: getNaYin(pillar.gan, pillar.zhi),
    changSheng: getChangSheng(dayGan, pillar.zhi),
    cangGan: CANG_GAN[pillar.zhi],
    wuxing: STEM_ELEMENT[pillar.gan],
    yinYang: STEM_YINYANG[pillar.gan],
    shenShi: getShenShi(dayGan, pillar.gan) as PillarDetail['shenShi'],
  })

  const pillars = {
    year: makePillarDetail(sixLines.year),
    month: makePillarDetail(sixLines.month),
    day: makePillarDetail(sixLines.day),
    hour: makePillarDetail(sixLines.hour),
  }

  allSteps.push({
    id: 'pillar-details',
    name: '四柱详解',
    input: { dayMaster },
    output: {
      yearNaYin: pillars.year.naYin,
      monthNaYin: pillars.month.naYin,
      dayNaYin: pillars.day.naYin,
      hourNaYin: pillars.hour.naYin,
    },
    ruleId: 'pillar-enrichment',
    ruleDescription: '纳音 + 十二长生 + 藏干 + 十神',
    confidence: 0.98,
    algorithmVersion: 'v1.0-classic',
    source: '三命通会',
    timestamp: Date.now(),
  })

  // Step 4: 纳音
  const naYin = {
    year: pillars.year.naYin,
    month: pillars.month.naYin,
    day: pillars.day.naYin,
    hour: pillars.hour.naYin,
  }

  // Step 5: 十二长生
  const changSheng = {
    year: pillars.year.changSheng,
    month: pillars.month.changSheng,
    day: pillars.day.changSheng,
    hour: pillars.hour.changSheng,
  }

  // Step 6: 五行统计
  const fiveElementCount = calculateFiveElementCount(sixLines)

  allSteps.push({
    id: 'five-element-count',
    name: '五行统计',
    input: { sixLines },
    output: { ...fiveElementCount },
    ruleId: 'five-element-weighted',
    ruleDescription: '天干×1.0 + 本气×0.6 + 中气×0.3 + 余气×0.1',
    confidence: 0.95,
    algorithmVersion: 'v1.0-classic',
    source: '渊海子平',
    timestamp: Date.now(),
  })

  // Step 7: 空亡
  const kongWang = getKongWang(sixLines)

  allSteps.push({
    id: 'kongwang',
    name: '空亡',
    input: { dayGanZhi: `${sixLines.day.gan}${sixLines.day.zhi}`, yearGanZhi: `${sixLines.year.gan}${sixLines.year.zhi}` },
    output: { kongWang },
    ruleId: 'kongwang-formula',
    ruleDescription: '日柱空亡 + 年柱空亡',
    confidence: 0.95,
    algorithmVersion: 'v1.0-classic',
    source: '渊海子平',
    timestamp: Date.now(),
  })

  // Step 8: 命宫
  const mingGong = calculateMingGong(sixLines.year.gan, sixLines.month.zhi, sixLines.hour.zhi)
  allSteps.push(...mingGong.derivation.steps.map(s => ({ ...s, id: `minggong-${s.id}` })))

  // Step 9: 身宫
  const shenGong = calculateShenGong(sixLines.year.gan, sixLines.month.zhi, sixLines.hour.zhi)
  allSteps.push(...shenGong.derivation.steps.map(s => ({ ...s, id: `shengong-${s.id}` })))

  // Step 10: 胎元
  const taiYuan = calculateTaiYuan(sixLines.month.gan, sixLines.month.zhi)
  allSteps.push(...taiYuan.derivation.steps.map(s => ({ ...s, id: `taiyuan-${s.id}` })))

  // Step 11: 胎息
  const taiXi = calculateTaiXi(sixLines.day.gan, sixLines.day.zhi)
  allSteps.push(...taiXi.derivation.steps.map(s => ({ ...s, id: `taixi-${s.id}` })))

  // 藏干表
  const cangGanMap = CANG_GAN

  // 收集警告
  const warnings: string[] = []
  if (!birthData.useTrueSolarTime) warnings.push('TRUE_SOLAR_TIME_MISSING')
  if (!birthData.timezone) warnings.push('TIMEZONE_MISSING')

  // 子时边界检查（23:00-01:00）
  if (birthData.birthTime) {
    const hourMatch = birthData.birthTime.match(/(\d{1,2}):/)
    if (hourMatch) {
      const hour = parseInt(hourMatch[1], 10)
      if (hour === 23 || hour === 0) {
        warnings.push('CHILD_HOUR_BOUNDARY')
      }
    }
    // 夏令时检查：如果时区包含非固定偏移的可能（简化判断）
    if (birthData.timezone && /DST|daylight|summer/i.test(birthData.timezone)) {
      warnings.push('DST_WARNING')
    }
  }

  // 闰月处理提示
  if (birthData.birthday) {
    // 农历闰月月份通常包含"闰"字或特定编码
    if (birthData.birthday.includes('闰') || birthData.birthday.includes('leap')) {
      warnings.push('LEAP_MONTH_HANDLED')
    }
  }

  return {
    version: FOUR_PILLARS_VERSION,
    sixLines,
    pillars,
    dayMaster,
    dayMasterElement,
    dayMasterYinYang,
    fiveElementCount,
    naYin,
    changSheng,
    kongWang,
    mingGong,
    shenGong,
    taiYuan,
    taiXi,
    cangGanMap,
    derivation: createChain(allSteps, Date.now() - engineStart, {
      engineVersion: FOUR_PILLARS_VERSION,
      algorithmVersion: 'v1.0-classic',
      warnings,
    }),
    warnings,
    computedAt: Date.now(),
  }
}
