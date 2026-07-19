/**
 * 命例验证系统（玄风门 V4.4）
 *
 * 将经典命例的预期结果与引擎实际计算结果逐项比对，
 * 输出 ValidationResult / ValidationReport，用于衡量引擎准确性。
 *
 * 验证策略：
 *  - dayMaster（日主）：硬性检查，排盘正确性的核心指标
 *  - strength / geJu / xiYongShen / shiShen：软性检查，统计准确率
 *  - JDN 日柱交叉验证：独立实现 JDN 公式，防止排盘回归
 *
 * 注意：classicCases.ts 中的 expected 注解由独立命理规则计算
 * （见该文件头注释），与引擎算法独立，二者比对可真实反映
 * 引擎是否符合典籍学说。
 */

import type { ClassicCase } from './classicCases'
import { classicCases } from './classicCases'
import { calculateBaZi } from '../calculator'
import { determineGeJu } from '../geju'
import { determineXiYongShen } from '../xiyongshen'
import type { BaZiChart, FiveElement } from '../types'

// ─── 公开类型 ───

export interface ValidationCheck {
  field: string
  expected: string
  actual: string
  passed: boolean
}

export interface ValidationResult {
  caseId: string
  source: string
  passed: boolean
  checks: ValidationCheck[]
  accuracy: number
}

export interface ValidationReport {
  totalCases: number
  passedCases: number
  failedCases: number
  successRate: number
  accuracyByField: {
    dayMaster: number
    strength: number
    geJu: number
    xiYongShen: number
    shiShen: number
  }
  failures: ValidationResult[]
  generatedAt: string
}

// ─── 常量 ───

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

const ELEMENT_OF_STEM: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

/**
 * 典籍格局名 → 引擎格局名 的别名映射。
 * 引擎使用「比肩格/劫财格」代替典籍的「建禄格/阳刃格」，
 * 引擎使用「财格」代替典籍的「正财格/偏财格」，
 * 引擎使用复合格局名（杀印相生/财生官杀等）表示兼格，
 * 此处做等价转换以便公平比对。
 */
const GEJU_ALIASES: Record<string, string[]> = {
  '阳刃格': ['劫财格'],
  '月刃格': ['劫财格'],
  '建禄格': ['比肩格'],
  '禄刃格': ['比肩格', '劫财格'],
  '杂气建禄格': ['比肩格'],
  '杂气阳刃格': ['劫财格'],
  // 引擎「财格」泛指正财/偏财
  '正财格': ['财格', '正财格'],
  '偏财格': ['财格', '偏财格'],
  // 引擎复合格局包含核心十神
  '七杀格': ['七杀格', '杀印相生', '财生官杀'],
  '正官格': ['正官格', '财生官杀', '财官双美'],
  '食神格': ['食神格', '食伤生财'],
  '伤官格': ['伤官格', '食伤生财'],
}

// ─── 农历 → 公历转换 ───

/**
 * 将农历日期转换为公历日期。
 * 使用 date-chinese 库的 CalendarChinese 实现。
 *
 * @param year  公历年份（用于定位农历循环）
 * @param month 农历月份（1-12）；负数表示闰月（如 -2 = 闰二月）
 * @param day   农历日（1-30）
 */
function lunarToSolar(year: number, month: number, day: number): { year: number; month: number; day: number } {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CalendarChinese } = require('date-chinese') as typeof import('date-chinese')
  const c = new CalendarChinese()
  // 获取该公历年份的农历新年 JDE，以确定 cycle 和 yearInCycle
  c.fromJDE(c.newYear(year))
  const [cycle, yearInCycle] = c.get()

  const isLeap = month < 0
  const lunarMonth = Math.abs(month)

  const c2 = new CalendarChinese()
  c2.set(cycle, yearInCycle, lunarMonth, isLeap ? 1 : 0, day)
  return c2.toGregorian(year)
}

// ─── JDN 日柱独立交叉验证 ───
// 独立实现 JDN 公式，与 calculator.ts 中的算法同源但代码独立，
// 用于检测日柱计算回归。

function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

const BASE_JDN_2000 = 2451545
const BASE_INDEX_2000 = 54 // 戊午

function jdnDayGanZhi(year: number, month: number, day: number): { gan: string; zhi: string } {
  const jdn = toJDN(year, month, day)
  const diff = jdn - BASE_JDN_2000
  const index = ((BASE_INDEX_2000 + diff) % 60 + 60) % 60
  return {
    gan: STEMS[index % 10],
    zhi: BRANCHES[index % 12],
  }
}

// ─── 辅助函数 ───

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * 将引擎的 strengthScore（0-100）映射为 strong/weak/balanced。
 * 阈值：≥55 为身强，≤45 为身弱，46-54 为中和。
 */
function strengthFromScore(score: number): 'strong' | 'weak' | 'balanced' {
  if (score >= 55) return 'strong'
  if (score <= 45) return 'weak'
  return 'balanced'
}

/**
 * 解析 "喜水用火" / "喜木用水" 格式的喜用神字符串。
 */
function parseXiYong(s: string): { happy?: string; usage?: string } {
  const happyMatch = s.match(/喜(.)/)
  const usageMatch = s.match(/用(.)/)
  return {
    happy: happyMatch ? happyMatch[1] : undefined,
    usage: usageMatch ? usageMatch[1] : undefined,
  }
}

/**
 * 格局名模糊匹配。
 * 典籍命名（阳刃格/建禄格/杂气X格）与引擎命名（劫财格/比肩格/X格）
 * 可能不同，此处做等价转换后再比较。
 */
function geJuMatch(expected: string, actual: string): boolean {
  if (expected === actual) return true

  // 去掉「杂气」前缀
  const e = expected.replace(/^杂气/, '')
  if (e === actual) return true

  // 别名映射
  const aliases = GEJU_ALIASES[e] || GEJU_ALIASES[expected]
  if (aliases && aliases.includes(actual)) return true

  // 模糊包含：去掉「格」后缀，检查核心词是否包含
  const eCore = e.replace(/格$/, '')
  const aCore = actual.replace(/格$/, '')
  if (eCore.length >= 2 && aCore.includes(eCore)) return true
  if (aCore.length >= 2 && eCore.includes(aCore)) return true

  return false
}

/**
 * 将 FiveElement 类型转换为中文字符。
 */
function elementChar(el: FiveElement): string {
  return el
}

// ─── 核心验证逻辑 ───

/**
 * 验证单个命例。
 *
 * 流程：
 * 1. 农历→公历转换（如需要）
 * 2. 调用 calculateBaZi 排盘
 * 3. JDN 日柱独立交叉验证
 * 4. 日主检查（硬性门控）
 * 5. 身强身弱检查（软性）
 * 6. 格局检查（软性）
 * 7. 喜用神检查（软性）
 * 8. 十神检查（软性）
 *
 * @returns ValidationResult，passed = 日主 + JDN 日柱均通过
 */
export function validateCase(caseData: ClassicCase): ValidationResult {
  const { birthData, expectedResults } = caseData
  const checks: ValidationCheck[] = []

  // 1. 农历→公历转换
  let solarYear = birthData.year
  let solarMonth = birthData.month
  let solarDay = birthData.day
  if (birthData.useLunarCalendar) {
    try {
      const solar = lunarToSolar(birthData.year, birthData.month, birthData.day)
      solarYear = solar.year
      solarMonth = solar.month
      solarDay = solar.day
    } catch (err: any) {
      return {
        caseId: caseData.id,
        source: caseData.source,
        passed: false,
        checks: [{
          field: 'lunarConversion',
          expected: `农历 ${birthData.year}-${birthData.month}-${birthData.day} → 公历`,
          actual: `转换失败: ${err?.message || String(err)}`,
          passed: false,
        }],
        accuracy: 0,
      }
    }
  }

  // 2. 调用引擎排盘
  const birthInfo = {
    birthDate: `${solarYear}-${pad2(solarMonth)}-${pad2(solarDay)}`,
    birthTime: `${pad2(birthData.hour)}:00`,
    gender: birthData.gender,
  }

  let chart: BaZiChart
  try {
    chart = calculateBaZi(birthInfo)
  } catch (err: any) {
    return {
      caseId: caseData.id,
      source: caseData.source,
      passed: false,
      checks: [{
        field: 'engine',
        expected: '排盘成功',
        actual: `排盘异常: ${err?.message || String(err)}`,
        passed: false,
      }],
      accuracy: 0,
    }
  }

  // 3. JDN 日柱独立交叉验证
  const jdnDay = jdnDayGanZhi(solarYear, solarMonth, solarDay)
  const engineDay = `${chart.sixLines.day.gan}${chart.sixLines.day.zhi}`
  const jdnDayStr = `${jdnDay.gan}${jdnDay.zhi}`
  checks.push({
    field: 'jdnDayPillar',
    expected: jdnDayStr,
    actual: engineDay,
    passed: jdnDayStr === engineDay,
  })

  // 4. 日主检查（硬性）
  const actualDayMaster = `${chart.sixLines.day.gan}${chart.dayMaster.dayGanElement}`
  if (expectedResults.dayMaster) {
    checks.push({
      field: 'dayMaster',
      expected: expectedResults.dayMaster,
      actual: actualDayMaster,
      passed: expectedResults.dayMaster === actualDayMaster,
    })
  }

  // 5. 身强身弱检查（软性）
  if (expectedResults.strength) {
    const actualStrength = strengthFromScore(chart.dayMaster.strengthScore)
    checks.push({
      field: 'strength',
      expected: expectedResults.strength,
      actual: actualStrength,
      passed: expectedResults.strength === actualStrength,
    })
  }

  // 预计算格局结果（供 geJu 和 xiYongShen 检查共用）
  const geJuResult = determineGeJu(
    chart.sixLines,
    chart.dayMaster.relatedShens,
    chart.dayMaster.strengthScore,
    chart.dayMaster.dayGan,
    chart.sixLines.month.zhi,
    chart.fiveElementCount,
  )

  // 6. 格局检查（软性）
  if (expectedResults.geJu) {
    checks.push({
      field: 'geJu',
      expected: expectedResults.geJu,
      actual: geJuResult.name,
      passed: geJuMatch(expectedResults.geJu, geJuResult.name),
    })
  }

  // 7. 喜用神检查（软性）
  // 引擎的 firstHappy 与 firstUsage 通常相同（单一 bestElement），
  // 而典籍学说的喜神/用神可能不同。此处：引擎 bestElement 匹配
  // 预期喜神或用神之一即视为通过，以公平反映引擎选取方向是否合理。
  if (expectedResults.xiYongShen) {
    const xiYongResult = determineXiYongShen(
      chart.dayMaster.strengthScore,
      chart.dayMaster.wangShuai,
      geJuResult.name,
      chart.dayMaster.dayGanElement,
      chart.dayMaster.heHuaResults,
    )
    const expectedParsed = parseXiYong(expectedResults.xiYongShen)
    const actualElement = elementChar(xiYongResult.firstHappy)

    // 引擎 bestElement 匹配预期喜神或用神之一即通过
    const matchesHappy = expectedParsed.happy && expectedParsed.happy === actualElement
    const matchesUsage = expectedParsed.usage && expectedParsed.usage === actualElement
    const xiPassed = !!(matchesHappy || matchesUsage)

    const actualStr = expectedParsed.usage
      ? `喜${actualElement}用${actualElement}`
      : `喜${actualElement}`

    checks.push({
      field: 'xiYongShen',
      expected: expectedResults.xiYongShen,
      actual: actualStr,
      passed: xiPassed,
    })
  }

  // 8. 十神检查（软性）
  // 检查预期关键十神是否都出现在四柱天干中
  if (expectedResults.shiShen && expectedResults.shiShen.length > 0) {
    const actualShiShen = [
      chart.sixLines.year.shenShi,
      chart.sixLines.month.shenShi,
      chart.sixLines.day.shenShi,
      chart.sixLines.hour.shenShi,
    ].filter(Boolean) as string[]
    const actualSet = [...new Set(actualShiShen)]
    const allPresent = expectedResults.shiShen.every(s => actualSet.includes(s))
    checks.push({
      field: 'shiShen',
      expected: expectedResults.shiShen.join('、'),
      actual: actualSet.join('、'),
      passed: allPresent,
    })
  }

  // 9. 计算 accuracy 和 passed
  const totalChecks = checks.length
  const passedChecks = checks.filter(c => c.passed).length
  const accuracy = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0

  // passed = 日主检查通过（如有）且 JDN 日柱通过
  const dayMasterCheck = checks.find(c => c.field === 'dayMaster')
  const jdnCheck = checks.find(c => c.field === 'jdnDayPillar')
  const passed = (!dayMasterCheck || dayMasterCheck.passed) && (!jdnCheck || jdnCheck.passed)

  return {
    caseId: caseData.id,
    source: caseData.source,
    passed,
    checks,
    accuracy,
  }
}

/**
 * 验证全部命例，生成汇总报告。
 */
export function validateAllCases(cases: ClassicCase[] = classicCases): ValidationReport {
  const results = cases.map(validateCase)
  const passedCases = results.filter(r => r.passed).length
  const failedCases = results.length - passedCases
  const successRate = results.length > 0 ? Math.round((passedCases / results.length) * 100) : 0

  // 按字段统计准确率
  const fieldNames: (keyof ValidationReport['accuracyByField'])[] = [
    'dayMaster', 'strength', 'geJu', 'xiYongShen', 'shiShen',
  ]
  const accuracyByField: Record<string, number> = {}
  for (const field of fieldNames) {
    const fieldChecks = results.flatMap(r => r.checks.filter(c => c.field === field))
    const fieldPassed = fieldChecks.filter(c => c.passed).length
    accuracyByField[field] = fieldChecks.length > 0 ? Math.round((fieldPassed / fieldChecks.length) * 100) : 0
  }

  const failures = results.filter(r => !r.passed)

  return {
    totalCases: results.length,
    passedCases,
    failedCases,
    successRate,
    accuracyByField: {
      dayMaster: accuracyByField.dayMaster || 0,
      strength: accuracyByField.strength || 0,
      geJu: accuracyByField.geJu || 0,
      xiYongShen: accuracyByField.xiYongShen || 0,
      shiShen: accuracyByField.shiShen || 0,
    },
    failures,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * 生成 Markdown 格式的验证报告。
 */
export function generateReportMarkdown(report: ValidationReport): string {
  const lines: string[] = []
  lines.push('# 经典命例验证报告')
  lines.push('')
  lines.push(`**生成时间：** ${report.generatedAt}`)
  lines.push('')
  lines.push('## 总览')
  lines.push('')
  lines.push('| 指标 | 数值 |')
  lines.push('|------|------|')
  lines.push(`| 命例总数 | ${report.totalCases} |`)
  lines.push(`| 通过数 | ${report.passedCases} |`)
  lines.push(`| 失败数 | ${report.failedCases} |`)
  lines.push(`| 通过率 | ${report.successRate}% |`)
  lines.push('')
  lines.push('## 各字段准确率')
  lines.push('')
  lines.push('| 字段 | 准确率 |')
  lines.push('|------|--------|')
  lines.push(`| 日主 (dayMaster) | ${report.accuracyByField.dayMaster}% |`)
  lines.push(`| 身强弱 (strength) | ${report.accuracyByField.strength}% |`)
  lines.push(`| 格局 (geJu) | ${report.accuracyByField.geJu}% |`)
  lines.push(`| 喜用神 (xiYongShen) | ${report.accuracyByField.xiYongShen}% |`)
  lines.push(`| 十神 (shiShen) | ${report.accuracyByField.shiShen}% |`)
  lines.push('')

  if (report.failures.length > 0) {
    lines.push('## 失败命例明细')
    lines.push('')
    for (const f of report.failures) {
      const failedChecks = f.checks.filter(c => !c.passed)
      lines.push(`### ${f.caseId} (${f.source})`)
      lines.push('')
      lines.push('| 字段 | 预期 | 实际 | 结果 |')
      lines.push('|------|------|------|------|')
      for (const c of failedChecks) {
        lines.push(`| ${c.field} | ${c.expected} | ${c.actual} | ${c.passed ? 'PASS' : 'FAIL'} |`)
      }
      lines.push('')
    }
  } else {
    lines.push('所有命例均通过验证。')
  }

  return lines.join('\n')
}
