/**
 * 性能测试（玄风门 V4.4）
 *
 * 基准：
 *   排盘 < 500ms
 *   完整分析 < 2000ms
 *   报告生成 < 3000ms
 *
 * 额外：
 *   批量排盘平均 < 100ms/例
 *   经典命例全量验证 < 30s
 */

import { describe, test, expect } from 'vitest'
import { calculateBaZi } from '../calculator'
import { runBaZiPipelineFromBirthData } from '../pipeline'
import { generateBaZiReport } from '../report'
import { validateAllCases } from '../testData/caseValidator'
import { classicCases } from '../testData/classicCases'
import type { BirthData } from '@/lib/core'

// ─── 辅助 ───

function pad2(n: number): string { return String(n).padStart(2, '0') }

function now(): number {
  return performance.now()
}

const TEST_BIRTH: BirthData = {
  birthday: '1990-06-15',
  birthTime: '10:00',
  gender: 'male',
}

// ─── 性能测试 ───

describe('性能测试', () => {

  describe('排盘性能', () => {
    test('单次排盘 < 500ms', () => {
      const start = now()
      calculateBaZi({
        birthDate: '1990-06-15',
        birthTime: '10:00',
        gender: 'male',
      })
      const elapsed = now() - start
      expect(elapsed).toBeLessThan(500)
    })

    test('批量排盘 50 例平均 < 100ms/例', () => {
      const dates = classicCases.slice(0, 50).map(c => ({
        birthDate: `${c.birthData.year}-${pad2(c.birthData.month)}-${pad2(c.birthData.day)}`,
        birthTime: `${pad2(c.birthData.hour)}:00`,
        gender: c.birthData.gender,
      }))

      const start = now()
      for (const d of dates) {
        calculateBaZi(d)
      }
      const elapsed = now() - start
      const avg = elapsed / dates.length
      expect(avg).toBeLessThan(100)
    })
  })

  describe('完整分析性能', () => {
    test('完整 Pipeline 分析 < 2000ms', async () => {
      const start = now()
      await runBaZiPipelineFromBirthData({ birthData: TEST_BIRTH })
      const elapsed = now() - start
      expect(elapsed).toBeLessThan(2000)
    })

    test('含全部可选步骤分析 < 2000ms', async () => {
      const start = now()
      await runBaZiPipelineFromBirthData({
        birthData: TEST_BIRTH,
        options: {
          includeDaYun: true,
          includeLiuNian: true,
          includeCareer: true,
          includeMarriage: true,
          includeWealth: true,
          includeHealth: true,
        },
      })
      const elapsed = now() - start
      expect(elapsed).toBeLessThan(2000)
    })
  })

  describe('报告生成性能', () => {
    test('报告生成 < 3000ms', async () => {
      // 先运行 Pipeline 获取结果
      const pipelineResult = await runBaZiPipelineFromBirthData({ birthData: TEST_BIRTH })

      const start = now()
      const report = generateBaZiReport(pipelineResult)
      const elapsed = now() - start

      expect(elapsed).toBeLessThan(3000)
      expect(report).toBeDefined()
      expect(report.sections.length).toBeGreaterThan(0)
    })

    test('完整分析 + 报告生成 < 5000ms', async () => {
      const start = now()
      const pipelineResult = await runBaZiPipelineFromBirthData({ birthData: TEST_BIRTH })
      generateBaZiReport(pipelineResult)
      const elapsed = now() - start

      expect(elapsed).toBeLessThan(5000)
    })
  })

  describe('经典命例全量验证性能', () => {
    test('150 例全量验证 < 30s', () => {
      const start = now()
      const report = validateAllCases()
      const elapsed = now() - start

      expect(elapsed).toBeLessThan(30000)
      expect(report.totalCases).toBe(150)
    })
  })
})
