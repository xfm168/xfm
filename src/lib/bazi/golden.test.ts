/**
 * 金标准命例回归测试
 * V4.8.1 Baseline
 *
 * CI 必须全部通过，任何失败阻断 Merge。
 * Boundary Case 永远不能失败。
 */

import { describe, it, expect } from 'vitest'
import { calculateBaZi } from './calculator'
import { GOLDEN_CASES, getGoldenCaseStats } from './caseLibrary/golden'
import type { GoldenCase } from './caseLibrary/golden'

function runCase(testCase: GoldenCase) {
  const chart = calculateBaZi({
    birthDate: testCase.birthDate,
    birthTime: testCase.birthTime,
    gender: testCase.gender,
  })

  const yearGanZhi = `${chart.sixLines.year.gan}${chart.sixLines.year.zhi}`
  const monthGanZhi = `${chart.sixLines.month.gan}${chart.sixLines.month.zhi}`
  const dayGanZhi = `${chart.sixLines.day.gan}${chart.sixLines.day.zhi}`
  const hourGanZhi = `${chart.sixLines.hour.gan}${chart.sixLines.hour.zhi}`

  return { yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi }
}

describe('金标准命例回归测试', () => {
  const stats = getGoldenCaseStats()

  it('金标准命例集完整性', () => {
    expect(GOLDEN_CASES.length).toBeGreaterThan(0)
    expect(stats.boundary).toBeGreaterThan(0)
  })

  // 全量验证
  for (const testCase of GOLDEN_CASES) {
    const isBoundary = testCase.importance === 'boundary'
    const label = isBoundary ? '[边界]' : `[${testCase.importance}]`

    it(`${label} ${testCase.id}: ${testCase.birthDate} ${testCase.birthTime} - ${testCase.note || ''}`, () => {
      const result = runCase(testCase)
      const expected = testCase.expected

      const failures: string[] = []

      if (result.yearGanZhi !== expected.yearGanZhi) {
        failures.push(`年柱: 期望 ${expected.yearGanZhi}, 实际 ${result.yearGanZhi}`)
      }
      if (result.monthGanZhi !== expected.monthGanZhi) {
        failures.push(`月柱: 期望 ${expected.monthGanZhi}, 实际 ${result.monthGanZhi}`)
      }
      if (result.dayGanZhi !== expected.dayGanZhi) {
        failures.push(`日柱: 期望 ${expected.dayGanZhi}, 实际 ${result.dayGanZhi}`)
      }
      if (result.hourGanZhi !== expected.hourGanZhi) {
        failures.push(`时柱: 期望 ${expected.hourGanZhi}, 实际 ${result.hourGanZhi}`)
      }

      if (failures.length > 0) {
        // 边界命例失败是最高优先级
        if (isBoundary) {
          expect.fail(`[边界命例失败] ${testCase.id}\n${failures.join('\n')}`)
        } else {
          expect.fail(`${testCase.id} 四柱不匹配:\n${failures.join('\n')}`)
        }
      }

      // 全部匹配
      expect(result.yearGanZhi).toBe(expected.yearGanZhi)
      expect(result.monthGanZhi).toBe(expected.monthGanZhi)
      expect(result.dayGanZhi).toBe(expected.dayGanZhi)
      expect(result.hourGanZhi).toBe(expected.hourGanZhi)
    })
  }
})
