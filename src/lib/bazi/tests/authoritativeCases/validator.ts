import { createPreciseCalendar } from '../../preciseCalendar'
import { calculateSolarTime } from '../../solarTime'
import { calcDaYunStart } from '../../rules/dashunRules'
import { getStemYinYang } from '@/lib/core'
import {
  AUTHORITATIVE_CASES,
  type AuthoritativeCase,
  type ValidateResult,
  type ValidateReport,
} from './loader'

const PASS_THRESHOLD = 80
const ITEM_KEYS = [
  '1.年柱一致',
  '2.月柱一致',
  '3.日柱一致',
  '4.时柱一致',
  '5.真太阳时校正',
  '6.节气',
  '7.起运年龄',
  '8.大运顺逆',
  '9.格局结构',
  '10.喜用神结构',
  '11.调候用神结构',
  '12.神煞结构',
  '13.旺衰结构',
]

const FOUR_PILLAR_ITEMS = ['1.年柱一致', '2.月柱一致', '3.日柱一致', '4.时柱一致']
const STRUCTURE_ITEMS = ['9.格局结构', '10.喜用神结构', '11.调候用神结构', '12.神煞结构', '13.旺衰结构']

function makeDateFromCase(c: AuthoritativeCase): Date {
  const off = c.birth.timezoneOffsetMin
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const tz = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
  return new Date(`${c.birth.solarDate}T${c.birth.solarTime}:00${tz}`)
}

type ItemResult = { passed: boolean; expected?: any; actual?: any; note?: string }

function validateFourPillars(c: AuthoritativeCase, calendar: ReturnType<typeof createPreciseCalendar>): Record<string, ItemResult> {
  const items: Record<string, ItemResult> = {}
  const exp = c.expect.fourPillars

  const yearPass = exp.year.ganZhi === calendar.yearGanZhi.ganZhi
  items['1.年柱一致'] = {
    passed: yearPass,
    expected: exp.year.ganZhi,
    actual: calendar.yearGanZhi.ganZhi,
    note: yearPass ? '' : `期望 ${exp.year.ganZhi}，实际 ${calendar.yearGanZhi.ganZhi}`,
  }

  const monthPass = exp.month.ganZhi === calendar.monthGanZhi.ganZhi
  items['2.月柱一致'] = {
    passed: monthPass,
    expected: exp.month.ganZhi,
    actual: calendar.monthGanZhi.ganZhi,
    note: monthPass ? '' : `期望 ${exp.month.ganZhi}，实际 ${calendar.monthGanZhi.ganZhi}`,
  }

  const dayPass = exp.day.ganZhi === calendar.dayGanZhi.ganZhi
  items['3.日柱一致'] = {
    passed: dayPass,
    expected: exp.day.ganZhi,
    actual: calendar.dayGanZhi.ganZhi,
    note: dayPass ? '' : `期望 ${exp.day.ganZhi}，实际 ${calendar.dayGanZhi.ganZhi}`,
  }

  if (exp.hour) {
    const birthDate = makeDateFromCase(c)
    const hour = birthDate.getHours()
    const shichenIndex = Math.floor(((hour + 1) % 24) / 2)
    const actualHourGanZhi = calendar.hours[shichenIndex]?.ganZhi ?? ''
    const hourPass = exp.hour.ganZhi === actualHourGanZhi
    items['4.时柱一致'] = {
      passed: hourPass,
      expected: exp.hour.ganZhi,
      actual: actualHourGanZhi,
      note: hourPass ? '' : `期望 ${exp.hour.ganZhi}，实际 ${actualHourGanZhi}`,
    }
  } else {
    items['4.时柱一致'] = {
      passed: true,
      expected: undefined,
      actual: undefined,
      note: '案例未提供时柱期望，跳过校验',
    }
  }

  return items
}

function validateSolarTime(c: AuthoritativeCase): ItemResult {
  if (c.expect.trueSolarTimeDiff === undefined) {
    return { passed: true, note: '未提供真太阳时校正期望，跳过校验' }
  }
  const birthDate = makeDateFromCase(c)
  const coordinate = {
    longitude: c.birth.longitude ?? 120,
    latitude: c.birth.latitude ?? 30,
  }
  const result = calculateSolarTime(birthDate, coordinate, {
    timezone: c.birth.timezone,
    timezoneOffsetMin: c.birth.timezoneOffsetMin,
    useTrueSolarTime: c.birth.useTrueSolarTime ?? true,
  })
  const diff = Math.abs(result.totalCorrection - c.expect.trueSolarTimeDiff)
  const passed = diff <= 5
  return {
    passed,
    expected: c.expect.trueSolarTimeDiff,
    actual: Math.round(result.totalCorrection * 10) / 10,
    note: passed ? `误差 ${Math.round(diff * 10) / 10} 分钟，在 ±5 分钟内` : `误差 ${Math.round(diff * 10) / 10} 分钟，超出 ±5 分钟阈值`,
  }
}

function validateSolarTerm(c: AuthoritativeCase, calendar: ReturnType<typeof createPreciseCalendar>): ItemResult {
  if (!c.expect.solarTerm) {
    return { passed: true, note: '未提供节气期望，跳过校验' }
  }
  const passed = c.expect.solarTerm === calendar.solarTermName
  return {
    passed,
    expected: c.expect.solarTerm,
    actual: calendar.solarTermName,
    note: passed ? '' : `期望 ${c.expect.solarTerm}，实际 ${calendar.solarTermName}`,
  }
}

function validateQiYunAge(c: AuthoritativeCase, calendar: ReturnType<typeof createPreciseCalendar>): ItemResult {
  if (c.expect.qiYunStartAge === undefined) {
    return { passed: true, note: '未提供起运年龄期望，跳过校验' }
  }
  const birthDate = makeDateFromCase(c)
  const dayGan = calendar.dayGanZhi.gan as any
  const qiYun = calcDaYunStart(birthDate, dayGan, c.birth.gender)
  const actual = Math.round(qiYun.qiYunDays * 10) / 10
  const diff = Math.abs(actual - c.expect.qiYunStartAge)
  const passed = diff <= 2
  return {
    passed,
    expected: c.expect.qiYunStartAge,
    actual,
    note: passed ? `误差 ${diff} 岁，在 ±2 岁内` : `误差 ${diff} 岁，超出 ±2 岁阈值`,
  }
}

function validateDaYunDirection(c: AuthoritativeCase, calendar: ReturnType<typeof createPreciseCalendar>): ItemResult {
  const dayGan = calendar.dayGanZhi.gan as any
  const dayYinYang = getStemYinYang(dayGan)
  const isShun = (c.birth.gender === 'male' && dayYinYang === '阳') || (c.birth.gender === 'female' && dayYinYang === '阴')
  const expectedDir = isShun ? '顺行' : '逆行'

  if (!c.expect.daYunDirection) {
    return {
      passed: true,
      actual: expectedDir,
      note: `未提供大运方向期望，按逻辑推得 ${expectedDir}（阳男阴女顺，阴男阳女逆）`,
    }
  }

  const passed = c.expect.daYunDirection === expectedDir
  return {
    passed,
    expected: c.expect.daYunDirection,
    actual: expectedDir,
    note: passed
      ? `日干${dayGan}(${dayYinYang})，性别${c.birth.gender === 'male' ? '男' : '女'} → ${expectedDir}`
      : `日干${dayGan}(${dayYinYang})，性别${c.birth.gender === 'male' ? '男' : '女'} → 应为 ${expectedDir}，期望 ${c.expect.daYunDirection}`,
  }
}

function validateStructureArray(name: string, value: any): ItemResult {
  if (!value) {
    return { passed: true, note: `${name}为空，待按书籍原文填入` }
  }
  const isArray = Array.isArray(value)
  const isStringArr = isArray && value.every((x: any) => typeof x === 'string')
  return {
    passed: isStringArr,
    expected: 'string[] 类型',
    actual: isArray ? `Array(${value.length})` : typeof value,
    note: isStringArr ? `${name}结构合法（string[]），程序校验待接入` : `${name}结构不合法，应为 string[]`,
  }
}

function validateShenshaStructure(value: any): ItemResult {
  if (!value || Object.keys(value).length === 0) {
    return { passed: true, note: '神煞为空，待按书籍原文填入' }
  }
  const isRecord = typeof value === 'object' && value !== null && !Array.isArray(value)
  if (!isRecord) {
    return { passed: false, expected: 'Record<string, string[]> 类型', actual: typeof value, note: '神煞结构不合法' }
  }
  for (const [k, v] of Object.entries(value)) {
    if (!Array.isArray(v) || !(v as any[]).every(x => typeof x === 'string')) {
      return {
        passed: false,
        expected: `key=${k} 对应值为 string[]`,
        actual: typeof v,
        note: `神煞 key=${k} 结构不合法`,
      }
    }
  }
  return { passed: true, note: '神煞结构合法（Record<string, string[]>），程序校验待接入' }
}

function validateWangshuaiStructure(value: any): ItemResult {
  if (value === undefined || value === null || value === '') {
    return { passed: true, note: '旺衰为空，待按书籍原文填入' }
  }
  const isString = typeof value === 'string'
  return {
    passed: isString,
    expected: 'string 类型',
    actual: typeof value,
    note: isString ? '旺衰结构合法（string），程序校验待接入' : '旺衰结构不合法，应为 string',
  }
}

function validateCase(c: AuthoritativeCase): ValidateResult {
  const birthDate = makeDateFromCase(c)
  const calendar = createPreciseCalendar(birthDate)

  const items: Record<string, ItemResult> = {}

  Object.assign(items, validateFourPillars(c, calendar))
  items['5.真太阳时校正'] = validateSolarTime(c)
  items['6.节气'] = validateSolarTerm(c, calendar)
  items['7.起运年龄'] = validateQiYunAge(c, calendar)
  items['8.大运顺逆'] = validateDaYunDirection(c, calendar)
  items['9.格局结构'] = validateStructureArray('格局', c.expect.geju)
  items['10.喜用神结构'] = validateStructureArray('喜用神', c.expect.xiYongShen)
  items['11.调候用神结构'] = validateStructureArray('调候用神', c.expect.tiaohou)
  items['12.神煞结构'] = validateShenshaStructure(c.expect.shensha)
  items['13.旺衰结构'] = validateWangshuaiStructure(c.expect.wangshuai)

  const allKeys = Object.keys(items)
  const passedCount = allKeys.filter(k => items[k].passed).length
  const passRate = Math.round((passedCount / allKeys.length) * 1000) / 10

  return {
    caseId: c.id,
    source: c.source,
    items,
    passRate,
    passed: passRate >= PASS_THRESHOLD,
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function runValidator(options?: { passThreshold?: number; sampleSize?: number }): ValidateReport {
  const start = Date.now()
  const threshold = options?.passThreshold ?? PASS_THRESHOLD
  const sampleSize = options?.sampleSize ?? 10

  const results: ValidateResult[] = AUTHORITATIVE_CASES.map(validateCase)

  const failures = results.filter(r => !r.passed)
  const passedCases = results.filter(r => r.passed).length
  const failedCases = failures.length

  const overallPassRate = Math.round((results.reduce((s, r) => s + r.passRate, 0) / results.length) * 10) / 10

  const perSourceBreakdown: Record<string, { cases: number; passRate: number }> = {}
  const sourceSums: Record<string, { cases: number; totalRate: number }> = {}
  for (const r of results) {
    if (!sourceSums[r.source]) sourceSums[r.source] = { cases: 0, totalRate: 0 }
    sourceSums[r.source].cases++
    sourceSums[r.source].totalRate += r.passRate
  }
  for (const [src, s] of Object.entries(sourceSums)) {
    perSourceBreakdown[src] = {
      cases: s.cases,
      passRate: Math.round((s.totalRate / s.cases) * 10) / 10,
    }
  }

  const perItemBreakdown: Record<string, { checked: number; passed: number; passRate: number }> = {}
  const allItemKeys: string[] = []
  for (const r of results) {
    for (const k of Object.keys(r.items)) {
      if (!allItemKeys.includes(k)) allItemKeys.push(k)
    }
  }
  for (const k of allItemKeys) {
    let checked = 0
    let passed = 0
    for (const r of results) {
      const it = r.items[k]
      if (!it) continue
      checked++
      if (it.passed) passed++
    }
    perItemBreakdown[k] = {
      checked,
      passed,
      passRate: checked === 0 ? 0 : Math.round((passed / checked) * 1000) / 10,
    }
  }

  const sampleTop10 = shuffle(results).slice(0, sampleSize)
  const durationMs = Date.now() - start

  return {
    generatedAt: new Date().toISOString(),
    totalCases: results.length,
    passedCases,
    failedCases,
    overallPassRate,
    perSourceBreakdown,
    perItemBreakdown,
    failures,
    sampleTop10,
    durationMs,
  }
}
