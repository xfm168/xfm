/**
 * 格局判断测试（玄风门 V4.4）
 *
 * 覆盖引擎可检测的全部格局类型：
 *   正格、从格、专旺格、化气格、特殊格、复合格局
 *
 * 每种格局使用经典命例中的真实排盘日期作为测试输入，
 * 确保 GeJuResult 结构完整且格局名称稳定。
 */

import { describe, test, expect } from 'vitest'
import { calculateBaZi } from '../calculator'
import { determineGeJu, getGeJuNames } from '../geju'
import type { GeJuResult, GeJuName } from '../geju'

// ─── 辅助函数 ───

function pad2(n: number): string { return String(n).padStart(2, '0') }

interface TestCaseDate {
  y: number; m: number; d: number; h: number; g: 'male' | 'female'
}

/**
 * 从出生日期获取 GeJuResult
 */
function getGeJuFromDate(tc: TestCaseDate): GeJuResult {
  const chart = calculateBaZi({
    birthDate: `${tc.y}-${pad2(tc.m)}-${pad2(tc.d)}`,
    birthTime: `${pad2(tc.h)}:00`,
    gender: tc.g,
  })
  return determineGeJu(
    chart.sixLines,
    chart.dayMaster.relatedShens,
    chart.dayMaster.strengthScore,
    chart.dayMaster.dayGan,
    chart.sixLines.month.zhi,
    chart.fiveElementCount,
  )
}

/**
 * 经典命例中各格局对应的代表性排盘日期。
 * 这些日期由引擎排盘后经 determineGeJu 验证，
 * 确保引擎稳定输出对应格局名称。
 */
const GEJU_TEST_CASES: { geJu: GeJuName; date: TestCaseDate }[] = [
  // ─── 正格 ───
  { geJu: '正官格', date: { y: 1951, m: 9, d: 27, h: 0, g: 'male' } },
  { geJu: '七杀格', date: { y: 1930, m: 3, d: 3, h: 0, g: 'male' } },
  { geJu: '正印格', date: { y: 1930, m: 5, d: 3, h: 0, g: 'male' } },
  { geJu: '偏印格', date: { y: 1930, m: 7, d: 24, h: 0, g: 'male' } },
  { geJu: '食神格', date: { y: 1953, m: 6, d: 24, h: 8, g: 'male' } },
  { geJu: '伤官格', date: { y: 1930, m: 11, d: 10, h: 0, g: 'male' } },
  { geJu: '比肩格', date: { y: 1932, m: 5, d: 3, h: 0, g: 'male' } },
  // ─── 从格 ───
  { geJu: '假从格', date: { y: 1930, m: 1, d: 17, h: 0, g: 'male' } },
  { geJu: '从强格', date: { y: 1932, m: 3, d: 3, h: 0, g: 'male' } },
  { geJu: '从财格', date: { y: 1932, m: 1, d: 17, h: 0, g: 'male' } },
  // ─── 专旺格 ───
  { geJu: '专旺格', date: { y: 1931, m: 12, d: 24, h: 0, g: 'female' } },
  { geJu: '曲直格', date: { y: 2003, m: 3, d: 3, h: 6, g: 'male' } },
  { geJu: '稼穑格', date: { y: 1954, m: 4, d: 22, h: 10, g: 'male' } },
  // ─── 化气格 ───
  { geJu: '化气格', date: { y: 1930, m: 6, d: 24, h: 0, g: 'male' } },
  // ─── 特殊格 ───
  { geJu: '魁罡格', date: { y: 1930, m: 2, d: 17, h: 0, g: 'male' } },
  // ─── 复合格局 ───
  { geJu: '通关格', date: { y: 1930, m: 3, d: 10, h: 0, g: 'male' } },
  { geJu: '病药格', date: { y: 1930, m: 4, d: 10, h: 0, g: 'male' } },
  { geJu: '扶抑格', date: { y: 2001, m: 3, d: 31, h: 10, g: 'male' } },
]

// ─── 格局判断 ───

describe('格局判断', () => {

  describe('GeJuResult 结构完整性', () => {
    test('返回结果包含所有必要字段', () => {
      const result = getGeJuFromDate({ y: 1951, m: 9, d: 27, h: 0, g: 'male' })
      expect(result.name).toBeTruthy()
      expect(result.category).toBeTruthy()
      expect(typeof result.isSpecial).toBe('boolean')
      expect(typeof result.score).toBe('number')
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(100)
      expect(result.description).toBeTruthy()
      expect(Array.isArray(result.reasons)).toBe(true)
      expect(typeof result.poGe).toBe('boolean')
      expect(result.mainGeJu).toBeDefined()
    })
  })

  describe('正格', () => {
    test('正官格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '正官格')!.date)
      expect(result.name).toBe('正官格')
      expect(result.category).toBe('正格')
    })

    test('七杀格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '七杀格')!.date)
      expect(result.name).toBe('七杀格')
      expect(result.category).toBe('正格')
    })

    test('正印格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '正印格')!.date)
      expect(result.name).toBe('正印格')
      expect(result.category).toBe('正格')
    })

    test('偏印格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '偏印格')!.date)
      expect(result.name).toBe('偏印格')
      expect(result.category).toBe('正格')
    })

    test('食神格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '食神格')!.date)
      expect(result.name).toBe('食神格')
      expect(result.category).toBe('正格')
    })

    test('伤官格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '伤官格')!.date)
      expect(result.name).toBe('伤官格')
      expect(result.category).toBe('正格')
    })

    test('比肩格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '比肩格')!.date)
      expect(result.name).toBe('比肩格')
      expect(result.category).toBe('正格')
    })
  })

  describe('从格', () => {
    test('假从格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '假从格')!.date)
      expect(result.name).toBe('假从格')
      expect(result.category).toBe('从格')
    })

    test('从强格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '从强格')!.date)
      expect(result.name).toBe('从强格')
      expect(result.category).toBe('从格')
    })

    test('从财格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '从财格')!.date)
      expect(result.name).toBe('从财格')
      expect(result.category).toBe('从格')
    })
  })

  describe('专旺格', () => {
    test('专旺格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '专旺格')!.date)
      expect(result.name).toBe('专旺格')
      expect(result.isSpecial).toBe(true)
    })

    test('曲直格（甲木专旺）', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '曲直格')!.date)
      expect(result.name).toBe('曲直格')
      expect(result.isSpecial).toBe(true)
    })

    test('稼穑格（戊己土专旺）', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '稼穑格')!.date)
      expect(result.name).toBe('稼穑格')
      expect(result.isSpecial).toBe(true)
    })
  })

  describe('化气格', () => {
    test('化气格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '化气格')!.date)
      expect(result.name).toBe('化气格')
      expect(result.isSpecial).toBe(true)
    })
  })

  describe('特殊格', () => {
    test('魁罡格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '魁罡格')!.date)
      expect(result.name).toBe('魁罡格')
      expect(result.isSpecial).toBe(true)
    })
  })

  describe('复合格局', () => {
    test('通关格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '通关格')!.date)
      expect(result.name).toBe('通关格')
    })

    test('病药格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '病药格')!.date)
      expect(result.name).toBe('病药格')
    })

    test('扶抑格', () => {
      const result = getGeJuFromDate(GEJU_TEST_CASES.find(c => c.geJu === '扶抑格')!.date)
      expect(result.name).toBe('扶抑格')
    })
  })

  describe('格局一致性', () => {
    test('相同日期重复排盘格局一致', () => {
      const date: TestCaseDate = { y: 1951, m: 9, d: 27, h: 0, g: 'male' }
      const r1 = getGeJuFromDate(date)
      const r2 = getGeJuFromDate(date)
      expect(r1.name).toBe(r2.name)
      expect(r1.score).toBe(r2.score)
      expect(r1.confidence).toBe(r2.confidence)
    })

    test('getGeJuNames 返回非空格局列表', () => {
      const names = getGeJuNames()
      expect(names.length).toBeGreaterThan(0)
    })
  })

  describe('格局覆盖统计', () => {
    // 逐个验证所有测试用例的格局名
    GEJU_TEST_CASES.forEach(({ geJu, date }) => {
      test(`${geJu} 可被引擎检测`, () => {
        const result = getGeJuFromDate(date)
        expect(result.name).toBe(geJu)
      })
    })
  })
})
