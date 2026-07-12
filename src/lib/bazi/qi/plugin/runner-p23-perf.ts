/**
 * P2-3 性能测试 — 确保单盘分析300ms以内
 *
 * 对同一命盘连续分析50次，每次走完整pipeline（13个模块），
 * 统计总时间、平均时间、最快/最慢，判定是否满足300ms标准。
 */
import { runP21Engine } from '../runP21Engine'
import { calculateDayMasterStrength } from './dayMasterStrengthEngine'
import { calculateClimateAdjustment } from './climateAdjustmentEngine'
import { analyzeDiseaseMedicine } from './diseaseMedicineEngine'
import { analyzeTongGuan } from './tongGuanEngine'
import { calculateUseGod } from './useGodEngine'
import { validatePattern } from './patternValidator'
import { calculateShenSha } from './shenShaEngine'
import { analyzeRelationships } from './relationshipEngine'
import { analyzeCareer } from './careerEngine'
import { analyzeWealth } from './wealthEngine'
import { analyzeMarriage } from './marriageEngine'
import { analyzeHealth } from './healthEngine'

import type { FiveElement } from '../../types'

// ─── 基础数据 ───

const ELEMENT_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}
const CANG_GAN: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
  '子': { ben: '癸', zhong: null, yao: null }, '丑': { ben: '己', zhong: '辛', yao: '癸' },
  '寅': { ben: '甲', zhong: '丙', yao: '戊' }, '卯': { ben: '乙', zhong: null, yao: null },
  '辰': { ben: '戊', zhong: '乙', yao: '癸' }, '巳': { ben: '丙', zhong: '庚', yao: '戊' },
  '午': { ben: '丁', zhong: '己', yao: null }, '未': { ben: '己', zhong: '丁', yao: '乙' },
  '申': { ben: '庚', zhong: '壬', yao: '戊' }, '酉': { ben: '辛', zhong: null, yao: null },
  '戌': { ben: '戊', zhong: '辛', yao: '丁' }, '亥': { ben: '壬', zhong: '甲', yao: null },
}

// ─── 测试配置 ───

const PILLARS = ['辛卯', '庚寅', '丁酉', '壬寅']
const ITERATIONS = 50
const THRESHOLD_MS = 300

// ─── 工具函数 ───

function parsePillars(fourPillars: string[]) {
  const parsed = fourPillars.map(p => ({
    gan: p[0] as any,
    zhi: p[1] as any,
    element: '' as any,
    yinYang: '' as any,
    naYin: '',
  }))
  return { year: parsed[0], month: parsed[1], day: parsed[2], hour: parsed[3] }
}

function countElements(sixLines: any): Record<string, number> {
  const count: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    count[ELEMENT_MAP[pillar.gan] || '木']++
    const cg = CANG_GAN[pillar.zhi]
    if (cg) {
      count[ELEMENT_MAP[cg.ben] || '木']++
      if (cg.zhong) count[ELEMENT_MAP[cg.zhong] || '木'] += 0.5
      if (cg.yao) count[ELEMENT_MAP[cg.yao] || '木'] += 0.3
    }
  }
  return count
}

/** 完整分析一个命盘（13个模块全部调用） */
function analyzeFullPipeline(sixLines: any, dayGan: any, monthZhi: any, pillars: string[]) {
  const elementCount = countElements(sixLines)

  // 1. runP21Engine → 格局
  const p21 = runP21Engine(sixLines, dayGan, monthZhi)

  // 2. calculateDayMasterStrength → 旺衰
  const strength = calculateDayMasterStrength(sixLines, dayGan, monthZhi)

  // 3. calculateClimateAdjustment → 调候
  const climate = calculateClimateAdjustment(sixLines, dayGan, monthZhi)

  // 4. analyzeDiseaseMedicine → 病药
  const disease = analyzeDiseaseMedicine(sixLines, dayGan, monthZhi, strength.strengthScore, strength.strengthLevelCN)

  // 5. analyzeTongGuan → 通关
  const tongGuan = analyzeTongGuan(elementCount as any)

  // 6. calculateUseGod → 喜用神
  const dayElement = (ELEMENT_MAP[pillars[2][0]] || '木') as FiveElement
  const useGod = calculateUseGod(dayElement, strength, climate, disease, tongGuan)

  // 7. validatePattern → 格局校验
  const validation = validatePattern(p21.geJuResult!, strength, climate, disease)

  // 8. calculateShenSha → 神煞
  const shenSha = calculateShenSha(
    pillars[0][0], // yearGan
    pillars[0][1], // yearZhi
    pillars[1][1], // monthZhi
    pillars[2][0], // dayGan
    pillars[2][1], // dayZhi
    pillars[3][1], // hourZhi
  )

  // 9. analyzeRelationships → 关系
  const allGan = pillars.map(p => p[0] as any)
  const allZhi = pillars.map(p => p[1] as any)
  const relationships = analyzeRelationships(
    dayElement, p21.geJuResult!.name,
    strength.strengthLevel, useGod.yongShen,
    elementCount as any, allGan, allZhi,
  )

  // 10. analyzeCareer → 事业
  const career = analyzeCareer(
    dayElement, strength.strengthLevel,
    useGod.yongShen, p21.geJuResult!.name,
    elementCount as any,
  )

  // 11. analyzeWealth → 财富
  const wealth = analyzeWealth(
    dayElement, strength.strengthLevel,
    useGod.yongShen, p21.geJuResult!.name,
    strength.strengthScore, elementCount as any,
  )

  // 12. analyzeMarriage → 婚姻
  const marriage = analyzeMarriage(
    dayElement, dayGan, strength.strengthLevel,
    useGod.yongShen, p21.geJuResult!.name,
    elementCount as any, allZhi,
  )

  // 13. analyzeHealth → 健康
  const health = analyzeHealth(
    dayElement, strength.strengthLevel,
    climate.climateType, elementCount as any, allZhi,
  )

  return { p21, strength, climate, disease, tongGuan, useGod, validation, shenSha, relationships, career, wealth, marriage, health }
}

// ─── 主测试流程 ───

console.log('=== P2-3 性能测试 ===')
console.log(`命盘：${PILLARS.join(' ')}`)
console.log(`循环次数：${ITERATIONS}`)
console.log(`阈值：${THRESHOLD_MS}ms/盘\n`)

const sixLines = parsePillars(PILLARS)
const dayGan = PILLARS[2][0] as any
const monthZhi = PILLARS[1][1] as any

const times: number[] = []
let errorCount = 0

const globalStart = Date.now()

for (let i = 0; i < ITERATIONS; i++) {
  try {
    const start = Date.now()
    const result = analyzeFullPipeline(sixLines, dayGan, monthZhi, PILLARS)
    const end = Date.now()
    const elapsed = end - start
    times.push(elapsed)
  } catch (e: any) {
    errorCount++
    console.log(`  第${i + 1}次迭代异常：${e.message}`)
  }
}

const globalEnd = Date.now()
const globalTotal = globalEnd - globalStart

if (times.length === 0) {
  console.log('>>> ABORT: 所有迭代均失败 <<<')
  process.exit(1)
}

// 统计
const totalTime = times.reduce((a, b) => a + b, 0)
const avgTime = totalTime / times.length
const minTime = Math.min(...times)
const maxTime = Math.max(...times)
const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] ?? maxTime
const withinThreshold = times.filter(t => t <= THRESHOLD_MS).length

// 输出
console.log('--- 单次耗时分布 ---')
for (let i = 0; i < Math.min(10, times.length); i++) {
  const bar = '#'.repeat(Math.ceil(times[i] / 5))
  console.log(`  #${String(i + 1).padStart(2, '0')}: ${String(times[i]).padStart(3)}ms ${bar}`)
}
if (times.length > 10) {
  console.log(`  ... 省略 ${times.length - 10} 条`)
}

console.log('\n--- 统计汇总 ---')
console.log(`  实际完成：${times.length}/${ITERATIONS} 次` + (errorCount > 0 ? `（${errorCount}次异常）` : ''))
console.log(`  总耗时（含迭代开销）：${globalTotal}ms`)
console.log(`  总耗时（纯分析）：${totalTime}ms`)
console.log(`  平均耗时：${avgTime.toFixed(1)}ms/盘`)
console.log(`  最快：${minTime}ms`)
console.log(`  最慢：${maxTime}ms`)
console.log(`  P95：${p95Time}ms`)
console.log(`  达标率：${withinThreshold}/${times.length}（阈值${THRESHOLD_MS}ms）`)

if (avgTime <= THRESHOLD_MS) {
  console.log('\n>>> PASS: 平均耗时满足300ms标准 <<<')
} else {
  console.log(`\n>>> FAIL: 平均耗时${avgTime.toFixed(1)}ms 超出${THRESHOLD_MS}ms阈值 <<<`)
}
