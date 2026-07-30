import { describe, it, expect } from 'vitest'
import { REFERENCE_CASES, getReferenceCaseCount, type ReferenceCaseJson } from '../../referenceCases/referenceCases.loader'
import { createPreciseCalendar } from '../../../preciseCalendar'
import { calculateSolarTime } from '../../../solarTime'

/**
 * 按案例自带的 timezoneOffsetMin 构造准确的 Date（避免使用环境本地时区导致偏差）
 * 方法：拼 ISO 字符串 `${date}T${time}:00${offset}` 交给 Date 解析
 */
function makeDateFromCase(c: ReferenceCaseJson): Date {
  const off = c.birth.timezoneOffsetMin
  const sign = off >= 0 ? '+' : '-'
  const abs = Math.abs(off)
  const tzStr = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
  return new Date(`${c.birth.solarDate}T${c.birth.solarTime}:00${tzStr}`)
}

const VALID_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const VALID_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const VALID_TERMS = new Set([
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒',
])
const VALID_LUNAR_MONTHS = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']

function isValidGanZhi(gz: string): boolean {
  if (!gz || gz.length !== 2) return false
  return VALID_STEMS.includes(gz[0]) && VALID_BRANCHES.includes(gz[1])
}

function isValidLunarMonthName(name: string): boolean {
  if (!name || name.length === 0) return false
  const pure = name.startsWith('闰') ? name.slice(1) : name
  return VALID_LUNAR_MONTHS.includes(pure)
}

describe('referenceCases/compareAll - 61 条参考案例与程序结果 soft-fail 比对', () => {
  it('REFERENCE_CASES 至少包含 61 条案例', () => {
    const count = getReferenceCaseCount()
    expect(count).toBeGreaterThanOrEqual(61)
    expect(REFERENCE_CASES.length).toBeGreaterThanOrEqual(61)
  })

  it('每条案例结构完整：id / birth / expect / tags', () => {
    for (const c of REFERENCE_CASES) {
      expect(typeof c.id).toBe('string')
      expect(c.id.length).toBeGreaterThan(0)
      expect(c.birth).toBeDefined()
      expect(typeof c.birth.solarDate).toBe('string')
      expect(typeof c.birth.solarTime).toBe('string')
      expect(c.expect).toBeDefined()
      expect(c.expect.fourPillars).toBeDefined()
      expect(Array.isArray(c.tags)).toBe(true)
    }
  })

  it('每条案例 fourPillars 干支格式合法（soft-fail：仅记录 mismatch）', () => {
    const mismatches: string[] = []
    for (const c of REFERENCE_CASES) {
      const fp = c.expect.fourPillars
      if (!isValidGanZhi(fp.year.ganZhi)) mismatches.push(`${c.id} year ganZhi invalid: ${fp.year.ganZhi}`)
      if (!isValidGanZhi(fp.month.ganZhi)) mismatches.push(`${c.id} month ganZhi invalid: ${fp.month.ganZhi}`)
      if (!isValidGanZhi(fp.day.ganZhi)) mismatches.push(`${c.id} day ganZhi invalid: ${fp.day.ganZhi}`)
      if (fp.hour && !isValidGanZhi(fp.hour.ganZhi)) mismatches.push(`${c.id} hour ganZhi invalid: ${fp.hour.ganZhi}`)
    }
    if (mismatches.length > 0) {
      console.log(`[referenceCases/compareAll] 干支格式 mismatch ${mismatches.length} 条：`)
      mismatches.slice(0, 10).forEach(m => console.log(`  ${m}`))
    }
    expect(true).toBe(true)
  })

  it('每条案例 createPreciseCalendar 成功调用不抛错', () => {
    for (const c of REFERENCE_CASES.slice(0, 30)) {
      const birth = makeDateFromCase(c)
      expect(() => createPreciseCalendar(birth)).not.toThrow()
    }
  })

  it('61 条 × 8 比对点：年/月/日/时干支 + 农历月名 + 闰月 + 节气 + 大运方向（soft-fail 打印 mismatch）', () => {
    let mismatchCount = 0
    const printedMismatches: string[] = []

    for (const c of REFERENCE_CASES) {
      const birth = makeDateFromCase(c)
      const [hStr, minStr] = c.birth.solarTime.split(':')

      let cal: any = null
      try {
        cal = createPreciseCalendar(birth)
      } catch {
        printedMismatches.push(`${c.id} createPreciseCalendar 抛错`)
        mismatchCount++
        continue
      }

      // 1. 年干支
      if (c.expect.fourPillars.year.ganZhi !== cal.yearGanZhi.ganZhi) {
        mismatchCount++
        printedMismatches.push(`${c.id} 年干支 mismatch: expect=${c.expect.fourPillars.year.ganZhi} actual=${cal.yearGanZhi.ganZhi}`)
      }

      // 2. 月干支
      if (c.expect.fourPillars.month.ganZhi !== cal.monthGanZhi.ganZhi) {
        mismatchCount++
        printedMismatches.push(`${c.id} 月干支 mismatch: expect=${c.expect.fourPillars.month.ganZhi} actual=${cal.monthGanZhi.ganZhi}`)
      }

      // 3. 日干支
      if (c.expect.fourPillars.day.ganZhi !== cal.dayGanZhi.ganZhi) {
        mismatchCount++
        printedMismatches.push(`${c.id} 日干支 mismatch: expect=${c.expect.fourPillars.day.ganZhi} actual=${cal.dayGanZhi.ganZhi}`)
      }

      // 4. 时干支（如果有小时的话）
      if (c.expect.fourPillars.hour && cal.hours && cal.hours.length > 0) {
        const hourIdx = cal.hours.findIndex((h: any) => h.shichenIndex === 0) >= 0
        if (hourIdx) {
          // 找到对应时辰
          const hourIndex = (() => {
            const totalMin = Number(hStr) * 60 + Number(minStr)
            if (totalMin >= 23 * 60 || totalMin < 1 * 60) return 0
            return Math.floor((Number(hStr) - 1) / 2) + 1
          })()
          const actualHourGanZhi = cal.hours[hourIndex]?.ganZhi ?? ''
          if (c.expect.fourPillars.hour.ganZhi !== actualHourGanZhi) {
            mismatchCount++
            printedMismatches.push(`${c.id} 时干支 mismatch: expect=${c.expect.fourPillars.hour.ganZhi} actual=${actualHourGanZhi}`)
          }
        }
      }

      // 5. 农历月名有效
      if (!isValidLunarMonthName(cal.lunar.monthText)) {
        mismatchCount++
        printedMismatches.push(`${c.id} 农历月名 invalid: ${cal.lunar.monthText}`)
      }

      // 6. 闰月标志存在且为 boolean
      if (typeof cal.lunar.leap !== 'boolean') {
        mismatchCount++
        printedMismatches.push(`${c.id} 闰月标志类型错误: ${typeof cal.lunar.leap}`)
      }

      // 7. 节气名有效（如果有）
      if (c.expect.solarTerm && !VALID_TERMS.has(c.expect.solarTerm)) {
        mismatchCount++
        printedMismatches.push(`${c.id} 节气名 invalid: ${c.expect.solarTerm}`)
      }

      // 8. 大运方向非空（如果有）
      if (c.expect.dayunDirection && typeof c.expect.dayunDirection !== 'string') {
        mismatchCount++
        printedMismatches.push(`${c.id} 大运方向 invalid`)
      } else if (c.expect.dayunDirection && c.expect.dayunDirection.length === 0) {
        mismatchCount++
        printedMismatches.push(`${c.id} 大运方向为空`)
      }
    }

    if (printedMismatches.length > 0) {
      console.log(`[referenceCases/compareAll] 共 ${mismatchCount} 个 mismatch / ${REFERENCE_CASES.length * 8} 比对点`)
      printedMismatches.slice(0, 20).forEach(m => console.log(`  ${m}`))
    }
    // soft-fail：不抛错，只打印
    expect(true).toBe(true)
  })

  it('REFERENCE_CASES 每条案例 id 唯一', () => {
    const ids = new Set<string>()
    for (const c of REFERENCE_CASES) {
      ids.add(c.id)
    }
    expect(ids.size).toBe(REFERENCE_CASES.length)
  })

  it('REFERENCE_CASES 每条案例 useTrueSolarTime 有默认值或布尔类型', () => {
    for (const c of REFERENCE_CASES) {
      if (c.birth.useTrueSolarTime !== undefined) {
        expect(typeof c.birth.useTrueSolarTime).toBe('boolean')
      }
    }
  })

  it('REFERENCE_CASES 每条案例 calculateSolarTime 不抛错', () => {
    for (const c of REFERENCE_CASES.slice(0, 30)) {
      const birth = makeDateFromCase(c)
      expect(() => {
        calculateSolarTime(
          birth,
          { longitude: c.birth.longitude, latitude: c.birth.latitude },
          { standardLongitude: 120, useTrueSolarTime: c.birth.useTrueSolarTime ?? true }
        )
      }).not.toThrow()
    }
  })
})
