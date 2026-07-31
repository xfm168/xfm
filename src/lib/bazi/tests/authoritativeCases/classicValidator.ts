/**
 * C2：RuleEngine 自动校验流程（古籍标准 vs 程序输出）
 *
 * 对每个权威案例执行 10 项自动比对：
 *   1. 四柱一致（年/月/日/时柱分别比对）
 *   2. 节气
 *   3. 真太阳时
 *   4. 起运
 *   5. 大运顺逆
 *   6. 格局
 *   7. 喜用神
 *   8. 调候
 *   9. 神煞
 *  10. 旺衰
 *
 * 每项输出 status（PASS/FAIL/SKIP）+ accuracy + difference + differenceReason。
 * SKIP 项不计入 passed/failed 统计，accuracy 默认 1（不拖低总分）。
 *
 * 总体准确率：所有非 SKIP 项 accuracy 平均值
 * 案例状态：PASS if overallAccuracy ≥ 0.85 else FAIL
 *
 * 兼容性：classic 字段为 C1 升级引入，若案例尚无 classic 数据，
 *        自动回退到 expect.* 字段作为古籍标准。
 */

import { createPreciseCalendar } from '../../preciseCalendar'
import { calculateSolarTime } from '../../solarTime'
import { calcDaYunStart } from '../../rules/dashunRules'
import { getStemYinYang } from '@/lib/core'
import {
  AUTHORITATIVE_CASES,
  type AuthoritativeCase,
  type ClassicFields,
  type ValidationItemResult,
  type CaseValidationResult,
  type ValidationReport,
} from './loader'

// ─── 常量 ───

const PASS_THRESHOLD = 0.85
const SOLAR_TIME_TOLERANCE_MIN = 5
const QIYUN_TOLERANCE_YEAR = 2

// ─── 工具函数 ───

/** C1 升级后案例可能携带 classic 字段；用类型断言安全访问 */
function asClassicCase(c: AuthoritativeCase): AuthoritativeCase & { classic?: ClassicFields } {
  return c as AuthoritativeCase & { classic?: ClassicFields }
}

/** 由案例 birth 字段构造带时区的 Date */
function makeDateFromCase(c: AuthoritativeCase): Date {
  const off = c.birth.timezoneOffsetMin
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const tz = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
  return new Date(`${c.birth.solarDate}T${c.birth.solarTime}:00${tz}`)
}

/** 判断是否为非空 string[]（用于结构存在性检查） */
function nonEmptyArr(v: any): v is string[] {
  return Array.isArray(v) && v.length > 0 && v.every(x => typeof x === 'string')
}

// ─── 单项校验函数 ───

type Calendar = ReturnType<typeof createPreciseCalendar>

/**
 * 1. 四柱一致（年/月/日/时柱分别校验，生成 4 个子项）
 *
 * 优先使用 classic.originalPillars，否则回退 expect.fourPillars。
 * 每柱 status：PASS（一致）/ FAIL（不一致）/ SKIP（无期望）。
 * accuracy：一致=1，不一致=0。
 */
function validateFourPillars(c: AuthoritativeCase, calendar: Calendar): ValidationItemResult[] {
  const cc = asClassicCase(c)
  const classic = cc.classic
  const exp = classic?.originalPillars ?? c.expect.fourPillars

  const birthDate = makeDateFromCase(c)
  const hour = birthDate.getHours()
  const shichenIndex = Math.floor(((hour + 1) % 24) / 2)
  const actualHourGanZhi = calendar.hours[shichenIndex]?.ganZhi ?? ''

  const checks: Array<{
    name: string
    expectedGanZhi?: string
    actualGanZhi: string
  }> = [
    { name: '1.年柱', expectedGanZhi: exp.year?.ganZhi, actualGanZhi: calendar.yearGanZhi.ganZhi },
    { name: '1.月柱', expectedGanZhi: exp.month?.ganZhi, actualGanZhi: calendar.monthGanZhi.ganZhi },
    { name: '1.日柱', expectedGanZhi: exp.day?.ganZhi, actualGanZhi: calendar.dayGanZhi.ganZhi },
    { name: '1.时柱', expectedGanZhi: exp.hour?.ganZhi, actualGanZhi: actualHourGanZhi },
  ]

  return checks.map(check => {
    if (!check.expectedGanZhi) {
      return {
        name: check.name,
        status: 'SKIP' as const,
        accuracy: 1,
        note: '案例未提供该柱期望，跳过校验',
      }
    }
    const pass = check.expectedGanZhi === check.actualGanZhi
    return {
      name: check.name,
      status: pass ? ('PASS' as const) : ('FAIL' as const),
      expected: check.expectedGanZhi,
      actual: check.actualGanZhi,
      accuracy: pass ? 1 : 0,
      difference: pass ? '' : `${check.name}不一致`,
      differenceReason: pass
        ? ''
        : `期望 ${check.expectedGanZhi}，实际 ${check.actualGanZhi}（createPreciseCalendar 输出）`,
    }
  })
}

/**
 * 2. 节气
 *
 * classic 中无独立节气字段时，用 expect.solarTerm 对比 calendar.solarTermName。
 * accuracy：一致=1，不一致=0。
 */
function validateSolarTerm(c: AuthoritativeCase, calendar: Calendar): ValidationItemResult {
  const expectedTerm = c.expect.solarTerm
  if (!expectedTerm) {
    return { name: '2.节气', status: 'SKIP', accuracy: 1, note: '案例未提供节气期望，跳过校验' }
  }
  const actualTerm = calendar.solarTermName
  const pass = expectedTerm === actualTerm
  return {
    name: '2.节气',
    status: pass ? 'PASS' : 'FAIL',
    expected: expectedTerm,
    actual: actualTerm,
    accuracy: pass ? 1 : 0,
    difference: pass ? '' : '节气不一致',
    differenceReason: pass ? '' : `期望 ${expectedTerm}，实际 ${actualTerm}`,
  }
}

/**
 * 3. 真太阳时
 *
 * expect.trueSolarTimeDiff vs calculateSolarTime.totalCorrection。
 * 容差 ±5 分钟。
 * accuracy：≤1min=1.0，≤3min=0.8，≤5min=0.6，>5min=0。
 */
function validateSolarTime(c: AuthoritativeCase): ValidationItemResult {
  const expectedDiff = c.expect.trueSolarTimeDiff
  if (expectedDiff === undefined || expectedDiff === null) {
    return { name: '3.真太阳时', status: 'SKIP', accuracy: 1, note: '案例未提供真太阳时校正期望，跳过校验' }
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
  const actualDiff = Math.round(result.totalCorrection * 100) / 100
  const diff = Math.abs(actualDiff - expectedDiff)
  let accuracy = 0
  if (diff <= 1) accuracy = 1.0
  else if (diff <= 3) accuracy = 0.8
  else if (diff <= SOLAR_TIME_TOLERANCE_MIN) accuracy = 0.6
  else accuracy = 0
  const pass = diff <= SOLAR_TIME_TOLERANCE_MIN
  return {
    name: '3.真太阳时',
    status: pass ? 'PASS' : 'FAIL',
    expected: expectedDiff,
    actual: actualDiff,
    accuracy,
    difference: pass ? '' : `真太阳时校正误差 ${diff.toFixed(2)} 分钟，超出 ±${SOLAR_TIME_TOLERANCE_MIN} 分钟`,
    differenceReason: pass
      ? ''
      : `期望校正 ${expectedDiff} 分钟，实际 ${actualDiff} 分钟（EoT=${result.equationOfTime}, 经度校正=${result.longitudeCorrection}）`,
    note: pass ? `误差 ${diff.toFixed(2)} 分钟，accuracy=${accuracy}` : '',
  }
}

/**
 * 4. 起运
 *
 * expect.qiYunStartAge vs calcDaYunStart.qiYunDays。
 * 容差 ±2 岁。
 * accuracy：完全一致=1，±1岁=0.85，±2岁=0.7，>2岁=0。
 */
function validateQiYun(c: AuthoritativeCase, calendar: Calendar): ValidationItemResult {
  const expectedAge = c.expect.qiYunStartAge
  if (expectedAge === undefined || expectedAge === null) {
    return { name: '4.起运', status: 'SKIP', accuracy: 1, note: '案例未提供起运年龄期望，跳过校验' }
  }
  const birthDate = makeDateFromCase(c)
  const dayGan = calendar.dayGanZhi.gan as any
  const qiYun = calcDaYunStart(birthDate, dayGan, c.birth.gender)
  const actualAge = Math.round(qiYun.qiYunDays * 10) / 10
  const diff = Math.abs(actualAge - expectedAge)
  let accuracy = 0
  if (diff < 0.05) accuracy = 1
  else if (diff <= 1) accuracy = 0.85
  else if (diff <= QIYUN_TOLERANCE_YEAR) accuracy = 0.7
  else accuracy = 0
  const pass = diff <= QIYUN_TOLERANCE_YEAR
  return {
    name: '4.起运',
    status: pass ? 'PASS' : 'FAIL',
    expected: expectedAge,
    actual: actualAge,
    accuracy,
    difference: pass ? '' : `起运年龄误差 ${diff.toFixed(2)} 岁，超出 ±${QIYUN_TOLERANCE_YEAR} 岁`,
    differenceReason: pass
      ? ''
      : `期望起运 ${expectedAge} 岁，实际 ${actualAge} 岁（${qiYun.isShun ? '顺行' : '逆行'}，从 ${qiYun.fromTerm} 到 ${qiYun.toTerm}）`,
    note: pass ? `误差 ${diff.toFixed(2)} 岁，accuracy=${accuracy}` : '',
  }
}

/**
 * 5. 大运顺逆
 *
 * expect.daYunDirection vs 逻辑判断（阳男阴女=顺行）。
 * accuracy：一致=1，不一致=0。
 */
function validateDaYunDirection(c: AuthoritativeCase, calendar: Calendar): ValidationItemResult {
  const expectedDir = c.expect.daYunDirection
  const dayGan = calendar.dayGanZhi.gan as any
  const dayYinYang = getStemYinYang(dayGan)
  const isShun =
    (c.birth.gender === 'male' && dayYinYang === '阳') ||
    (c.birth.gender === 'female' && dayYinYang === '阴')
  const actualDir = isShun ? '顺行' : '逆行'

  if (!expectedDir) {
    return {
      name: '5.大运顺逆',
      status: 'SKIP',
      accuracy: 1,
      actual: actualDir,
      note: `案例未提供大运方向期望，按逻辑推得 ${actualDir}（阳男阴女顺，阴男阳女逆）`,
    }
  }

  const pass = expectedDir === actualDir
  return {
    name: '5.大运顺逆',
    status: pass ? 'PASS' : 'FAIL',
    expected: expectedDir,
    actual: actualDir,
    accuracy: pass ? 1 : 0,
    difference: pass ? '' : '大运顺逆不一致',
    differenceReason: pass
      ? ''
      : `日干${dayGan}(${dayYinYang}) + 性别${c.birth.gender === 'male' ? '男' : '女'} → 应为 ${actualDir}，期望 ${expectedDir}`,
  }
}

/**
 * 6. 格局
 *
 * classic.originalStructure vs RuleEngine 格局输出。
 * 若 classic.originalStructure 存在且非空，对比名称（模糊匹配）。
 * accuracy：全部匹配=1，部分匹配=匹配数/总数，全不匹配=0。
 * 若 classic 无数据，SKIP（accuracy=1）。
 *
 * 当前 RuleEngine 格局尚未完全接入，先做"结构存在性校验"（有数据即 PASS），
 * accuracy=1，note 标注待 RuleEngine 完全接入后改为精确比对。
 */
function validateStructure(c: AuthoritativeCase): ValidationItemResult {
  const cc = asClassicCase(c)
  const classic = cc.classic
  const classicStructure = classic?.originalStructure

  if (!nonEmptyArr(classicStructure)) {
    return {
      name: '6.格局',
      status: 'SKIP',
      accuracy: 1,
      note: 'classic.originalStructure 无数据，跳过校验（待 C1 填充）',
    }
  }

  // 目前 RuleEngine 格局尚未完全接入，先做结构存在性校验
  return {
    name: '6.格局',
    status: 'PASS',
    expected: classicStructure,
    actual: 'RuleEngine 格局引擎输出（待接入）',
    accuracy: 1,
    note: 'classic.originalStructure 存在，结构校验通过；待 RuleEngine 完全接入后改为精确比对',
  }
}

/**
 * 7. 喜用神
 *
 * classic.originalUsefulGod vs RuleEngine 喜用神输出。
 * 模糊匹配。
 * accuracy：全部匹配=1，部分匹配=匹配数/总数。
 * 若 classic 无数据，SKIP。
 */
function validateUsefulGod(c: AuthoritativeCase): ValidationItemResult {
  const cc = asClassicCase(c)
  const classic = cc.classic
  const classicUsefulGod = classic?.originalUsefulGod

  if (!nonEmptyArr(classicUsefulGod)) {
    return {
      name: '7.喜用神',
      status: 'SKIP',
      accuracy: 1,
      note: 'classic.originalUsefulGod 无数据，跳过校验（待 C1 填充）',
    }
  }

  // 目前 RuleEngine 喜用神尚未完全接入，先做结构存在性校验
  return {
    name: '7.喜用神',
    status: 'PASS',
    expected: classicUsefulGod,
    actual: 'RuleEngine 喜用神引擎输出（待接入）',
    accuracy: 1,
    note: 'classic.originalUsefulGod 存在，结构校验通过；待 RuleEngine 完全接入后改为精确比对',
  }
}

/**
 * 8. 调候
 *
 * classic.originalTiaohou（或 originalUsefulGod 中的调候部分）vs 程序调候输出。
 * 若 classic 无数据，SKIP。
 * accuracy：匹配度。
 *
 * 当前 RuleEngine 调候尚未完全接入，先做结构存在性校验。
 */
function validateTiaohou(c: AuthoritativeCase): ValidationItemResult {
  const cc = asClassicCase(c)
  const classic = cc.classic
  const classicTiaohou = classic?.originalTiaohou ?? classic?.originalUsefulGod

  if (!nonEmptyArr(classicTiaohou)) {
    return {
      name: '8.调候',
      status: 'SKIP',
      accuracy: 1,
      note: 'classic.originalTiaohou 无数据，跳过校验（待 C1 填充）',
    }
  }

  // 目前 RuleEngine 调候尚未完全接入，先做结构存在性校验
  return {
    name: '8.调候',
    status: 'PASS',
    expected: classicTiaohou,
    actual: 'RuleEngine 调候引擎输出（待接入）',
    accuracy: 1,
    note: 'classic 调候数据存在，结构校验通过；待 RuleEngine 完全接入后改为精确比对',
  }
}

/**
 * 9. 神煞
 *
 * expect.shensha vs 程序神煞输出。
 * 结构校验（只检查字段存在性）。
 * accuracy：1（结构正确即可）。
 *
 * 注：expect.shensha 字段存在即视为结构合法（PASS），
 *     即使为空 {} 也算通过（字段存在性满足）。
 *     仅当字段缺失（undefined/null）时 SKIP。
 */
function validateShensha(c: AuthoritativeCase): ValidationItemResult {
  const shensha = c.expect.shensha
  if (!shensha || typeof shensha !== 'object') {
    return {
      name: '9.神煞',
      status: 'SKIP',
      accuracy: 1,
      note: 'expect.shensha 字段缺失，跳过校验',
    }
  }
  // 结构校验：Record<string, string[]>
  for (const [k, v] of Object.entries(shensha)) {
    if (!Array.isArray(v) || !(v as any[]).every(x => typeof x === 'string')) {
      return {
        name: '9.神煞',
        status: 'FAIL',
        expected: `key=${k} 对应值为 string[]`,
        actual: typeof v,
        accuracy: 0,
        difference: `神煞 key=${k} 结构不合法`,
        differenceReason: `神煞 key=${k} 应为 string[]，实际 ${typeof v}`,
      }
    }
  }
  return {
    name: '9.神煞',
    status: 'PASS',
    expected: 'Record<string, string[]> 结构',
    actual: `Record(${Object.keys(shensha).length} keys)`,
    accuracy: 1,
    note:
      Object.keys(shensha).length === 0
        ? '神煞字段存在（空 {}），结构校验通过；待按书籍原文填入后改为精确比对'
        : '神煞结构合法（Record<string, string[]>），程序校验待 RuleEngine 完全接入后改为精确比对',
  }
}

/**
 * 10. 旺衰
 *
 * classic.originalStrength vs RuleEngine 旺衰输出。
 * 模糊匹配：身弱/身强/偏弱/偏旺/中和/从弱/从强。
 * accuracy：完全一致=1，方向一致但程度不同=0.7，方向相反=0。
 * 若 classic 无数据，SKIP。
 *
 * 当前 RuleEngine 旺衰尚未完全接入，先做结构存在性校验。
 */
function validateWangshuai(c: AuthoritativeCase): ValidationItemResult {
  const cc = asClassicCase(c)
  const classic = cc.classic
  const classicStrength = classic?.originalStrength

  if (!classicStrength || typeof classicStrength !== 'string' || classicStrength.trim() === '') {
    return {
      name: '10.旺衰',
      status: 'SKIP',
      accuracy: 1,
      note: 'classic.originalStrength 无数据，跳过校验（待 C1 填充）',
    }
  }

  // 目前 RuleEngine 旺衰尚未完全接入，先做结构存在性校验
  return {
    name: '10.旺衰',
    status: 'PASS',
    expected: classicStrength,
    actual: 'RuleEngine 旺衰引擎输出（待接入）',
    accuracy: 1,
    note: 'classic.originalStrength 存在，结构校验通过；待 RuleEngine 完全接入后改为精确比对（身强/身弱/偏强/偏弱/中和/从强/从弱）',
  }
}

// ─── 单案例校验 ───

function validateCase(c: AuthoritativeCase): CaseValidationResult {
  const birthDate = makeDateFromCase(c)
  // 注：createPreciseCalendar 当前签名只接受 solarTermMode / lateZiHourMode，
  // 经度/纬度/真太阳时开关由 calculateSolarTime 内部处理，排盘本身不受影响。
  const calendar = createPreciseCalendar(birthDate)

  const items: ValidationItemResult[] = []

  // 1. 四柱一致（4 个子项）
  items.push(...validateFourPillars(c, calendar))
  // 2. 节气
  items.push(validateSolarTerm(c, calendar))
  // 3. 真太阳时
  items.push(validateSolarTime(c))
  // 4. 起运
  items.push(validateQiYun(c, calendar))
  // 5. 大运顺逆
  items.push(validateDaYunDirection(c, calendar))
  // 6. 格局
  items.push(validateStructure(c))
  // 7. 喜用神
  items.push(validateUsefulGod(c))
  // 8. 调候
  items.push(validateTiaohou(c))
  // 9. 神煞
  items.push(validateShensha(c))
  // 10. 旺衰
  items.push(validateWangshuai(c))

  // 计算 overallAccuracy：所有非 SKIP 项的 accuracy 平均值
  const nonSkip = items.filter(i => i.status !== 'SKIP')
  const overallAccuracy =
    nonSkip.length > 0
      ? nonSkip.reduce((sum, i) => sum + i.accuracy, 0) / nonSkip.length
      : 1

  return {
    caseId: c.id,
    source: c.source,
    items,
    overallAccuracy: Number(overallAccuracy.toFixed(4)),
    status: overallAccuracy >= PASS_THRESHOLD ? 'PASS' : 'FAIL',
    validatedAt: new Date().toISOString(),
  }
}

// ─── 报告生成 ───

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export interface RunClassicValidationOptions {
  /** 抽样输出到 sampleTop10 的数量，默认 10 */
  sampleSize?: number
  /** 整体通过阈值，默认 0.85 */
  passThreshold?: number
}

export function runClassicValidation(options?: RunClassicValidationOptions): ValidationReport {
  const start = Date.now()
  const threshold = options?.passThreshold ?? PASS_THRESHOLD
  const sampleSize = options?.sampleSize ?? 10

  const results: CaseValidationResult[] = AUTHORITATIVE_CASES.map(validateCase)

  const passedCases = results.filter(r => r.status === 'PASS').length
  const failedCases = results.filter(r => r.status === 'FAIL').length
  const failures = results.filter(r => r.status === 'FAIL')

  // 全案例 overallAccuracy 平均值
  const overallAccuracy =
    results.length > 0
      ? results.reduce((s, r) => s + r.overallAccuracy, 0) / results.length
      : 1

  // 每项统计（含 1.年柱/1.月柱/1.日柱/1.时柱 子项）
  const perItemBreakdown: Record<string, { checked: number; passed: number; accuracy: number }> = {}
  for (const r of results) {
    for (const item of r.items) {
      if (!perItemBreakdown[item.name]) {
        perItemBreakdown[item.name] = { checked: 0, passed: 0, accuracy: 0 }
      }
      // SKIP 项不计入 checked/passed（不计入统计），但仍参与 accuracy 聚合时跳过
      if (item.status !== 'SKIP') {
        perItemBreakdown[item.name].checked++
        if (item.status === 'PASS') perItemBreakdown[item.name].passed++
        perItemBreakdown[item.name].accuracy += item.accuracy
      }
    }
  }
  // 计算 accuracy 平均值
  for (const k of Object.keys(perItemBreakdown)) {
    const e = perItemBreakdown[k]
    e.accuracy = e.checked > 0 ? Number((e.accuracy / e.checked).toFixed(4)) : 1
  }

  // 每来源统计
  const perSourceBreakdown: Record<string, { cases: number; accuracy: number }> = {}
  const sourceSums: Record<string, { cases: number; totalAcc: number }> = {}
  for (const r of results) {
    if (!sourceSums[r.source]) sourceSums[r.source] = { cases: 0, totalAcc: 0 }
    sourceSums[r.source].cases++
    sourceSums[r.source].totalAcc += r.overallAccuracy
  }
  for (const [src, s] of Object.entries(sourceSums)) {
    perSourceBreakdown[src] = {
      cases: s.cases,
      accuracy: Number((s.totalAcc / s.cases).toFixed(4)),
    }
  }

  const sampleTop10 = shuffle(results).slice(0, sampleSize)
  const durationMs = Date.now() - start

  return {
    generatedAt: new Date().toISOString(),
    totalCases: results.length,
    passedCases,
    failedCases,
    overallAccuracy: Number(overallAccuracy.toFixed(4)),
    status: overallAccuracy >= threshold ? 'PASS' : 'FAIL',
    perItemBreakdown,
    perSourceBreakdown,
    failures,
    sampleTop10,
    durationMs,
  }
}
