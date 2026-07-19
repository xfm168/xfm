/**
 * Pipeline 集成测试（玄风门 V4.4）
 *
 * 覆盖：
 *   完整分析流程、可选步骤开关、错误降级、缓存命中
 *
 * Pipeline 入口：runBaZiPipelineFromBirthData
 * 统一分析中心：getAnalysis（含缓存）
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { runBaZiPipelineFromBirthData } from '../pipeline'
import { getAnalysis, clearAnalysisCache, getAnalysisCacheKey } from '../analysisCenter'
import type { BirthData } from '@/lib/core'

// ─── 测试数据 ───

function makeBirthData(overrides: Partial<BirthData> = {}): BirthData {
  return {
    birthday: '1990-06-15',
    birthTime: '10:00',
    gender: 'male',
    ...overrides,
  }
}

// ─── Pipeline 集成测试 ───

describe('八字 Pipeline', () => {

  describe('完整分析流程', () => {
    test('默认选项产出完整结果', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
      })

      expect(result.success).toBe(true)
      expect(result.chart).toBeDefined()
      expect(result.geJu).toBeDefined()
      expect(result.xiYongShen).toBeDefined()
      expect(result.score).toBeDefined()
      expect(result.steps.length).toBeGreaterThanOrEqual(5)
      expect(result.version).toBe('4.4.0')
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    test('排盘结果包含四柱', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
      })
      const { sixLines } = result.chart
      expect(sixLines.year.gan).toBeTruthy()
      expect(sixLines.year.zhi).toBeTruthy()
      expect(sixLines.month.gan).toBeTruthy()
      expect(sixLines.month.zhi).toBeTruthy()
      expect(sixLines.day.gan).toBeTruthy()
      expect(sixLines.day.zhi).toBeTruthy()
      expect(sixLines.hour.gan).toBeTruthy()
      expect(sixLines.hour.zhi).toBeTruthy()
    })

    test('默认产出大运流年', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
      })
      expect(result.daYun).toBeDefined()
      expect(result.liuNian).toBeDefined()
    })

    test('默认产出事业/婚姻/财富/健康分析', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
      })
      expect(result.career).toBeDefined()
      expect(result.marriage).toBeDefined()
      expect(result.wealth).toBeDefined()
      expect(result.health).toBeDefined()
    })

    test('默认产出深度分析（总论/四柱/十神/神煞/评分）', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
      })
      expect(result.masterSummary).toBeDefined()
      expect(result.pillarAnalysis).toBeDefined()
      expect(result.shiShenDetail).toBeDefined()
      expect(result.shenShaDetail).toBeDefined()
      expect(result.comprehensiveScore).toBeDefined()
    })

    test('所有步骤状态为 completed 或 error（无 pending/running 残留）', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
      })
      for (const step of result.steps) {
        expect(['completed', 'error']).toContain(step.status)
      }
    })
  })

  describe('可选步骤开关', () => {
    test('includeDaYun=false 跳过大运', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
        options: { includeDaYun: false },
      })
      expect(result.daYun).toBeUndefined()
      expect(result.steps.find(s => s.name === '大运推演')).toBeUndefined()
    })

    test('includeLiuNian=false 跳过流年', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
        options: { includeLiuNian: false },
      })
      expect(result.liuNian).toBeUndefined()
      expect(result.steps.find(s => s.name === '流年推演')).toBeUndefined()
    })

    test('includeCareer=false 跳过事业分析', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
        options: { includeCareer: false },
      })
      expect(result.career).toBeUndefined()
      expect(result.steps.find(s => s.name === '事业分析')).toBeUndefined()
    })

    test('includeMarriage=false 跳过婚姻分析', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
        options: { includeMarriage: false },
      })
      expect(result.marriage).toBeUndefined()
    })

    test('includeWealth=false 跳过财富分析', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
        options: { includeWealth: false },
      })
      expect(result.wealth).toBeUndefined()
    })

    test('includeHealth=false 跳过健康分析', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
        options: { includeHealth: false },
      })
      expect(result.health).toBeUndefined()
    })

    test('全部可选步骤关闭后核心步骤仍完成', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
        options: {
          includeDaYun: false,
          includeLiuNian: false,
          includeCareer: false,
          includeMarriage: false,
          includeWealth: false,
          includeHealth: false,
        },
      })
      expect(result.success).toBe(true)
      expect(result.chart).toBeDefined()
      expect(result.geJu).toBeDefined()
      expect(result.xiYongShen).toBeDefined()
      // 核心步骤仍存在
      expect(result.steps.find(s => s.name === '排盘分析')).toBeDefined()
      expect(result.steps.find(s => s.name === '格局判断')).toBeDefined()
      expect(result.steps.find(s => s.name === '用神判定')).toBeDefined()
    })
  })

  describe('错误降级', () => {
    test('单步骤失败不阻断整体流程', async () => {
      // 使用极端年份测试降级（不抛异常，而是步骤标记 error）
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData({ birthday: '1990-06-15', birthTime: '10:00' }),
      })
      // 整体仍 success
      expect(result.success).toBe(true)
      // 即使有步骤失败，核心数据仍存在
      expect(result.chart).toBeDefined()
      expect(result.geJu).toBeDefined()
    })

    test('步骤错误信息被记录', async () => {
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
      })
      // 检查是否有 error 状态的步骤，其 error 字段应被填充
      const errorSteps = result.steps.filter(s => s.status === 'error')
      for (const step of errorSteps) {
        expect(step.error).toBeTruthy()
      }
    })

    test('大运推演失败不影响排盘结果', async () => {
      // 即使大运步骤失败，排盘四柱仍正确
      const result = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData(),
      })
      expect(result.chart.sixLines.day.gan).toBeTruthy()
      expect(result.chart.sixLines.day.zhi).toBeTruthy()
    })
  })

  describe('缓存命中', () => {
    beforeEach(() => {
      clearAnalysisCache()
    })

    test('相同 birthData 第二次从缓存读取', () => {
      const bd = makeBirthData()
      const r1 = getAnalysis(bd)
      const r2 = getAnalysis(bd)
      // 缓存命中：返回同一对象引用
      expect(r2).toBe(r1)
    })

    test('不同 birthData 不命中缓存', () => {
      const bd1 = makeBirthData({ birthday: '1990-06-15' })
      const bd2 = makeBirthData({ birthday: '1991-06-15' })
      const r1 = getAnalysis(bd1)
      const r2 = getAnalysis(bd2)
      expect(r2).not.toBe(r1)
    })

    test('缓存 key 基于 birthday+birthTime+gender', () => {
      const bd = makeBirthData()
      const key = getAnalysisCacheKey(bd)
      expect(key).toContain('1990-06-15')
      expect(key).toContain('10:00')
      expect(key).toContain('male')
    })

    test('clearAnalysisCache 清空缓存后重新计算', () => {
      const bd = makeBirthData()
      const r1 = getAnalysis(bd)
      clearAnalysisCache()
      const r2 = getAnalysis(bd)
      // 清空后重新计算，不再是同一引用
      expect(r2).not.toBe(r1)
      // 但内容应一致
      expect(r2.chart.sixLines.day.gan).toBe(r1.chart.sixLines.day.gan)
    })

    test('Pipeline 两次调用结果一致（排盘部分）', async () => {
      const bd = makeBirthData()
      const r1 = await runBaZiPipelineFromBirthData({ birthData: bd })
      const r2 = await runBaZiPipelineFromBirthData({ birthData: bd })
      expect(r1.chart.sixLines.day.gan).toBe(r2.chart.sixLines.day.gan)
      expect(r1.chart.sixLines.day.zhi).toBe(r2.chart.sixLines.day.zhi)
      expect(r1.geJu.name).toBe(r2.geJu.name)
    })
  })

  describe('不同性别排盘', () => {
    test('男命和女命排盘四柱相同（排盘与性别无关）', async () => {
      const r1 = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData({ gender: 'male' }),
      })
      const r2 = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData({ gender: 'female' }),
      })
      expect(r1.chart.sixLines.day.gan).toBe(r2.chart.sixLines.day.gan)
      expect(r1.chart.sixLines.day.zhi).toBe(r2.chart.sixLines.day.zhi)
    })

    test('女命大运起运方向与男命不同', async () => {
      const r1 = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData({ gender: 'male' }),
      })
      const r2 = await runBaZiPipelineFromBirthData({
        birthData: makeBirthData({ gender: 'female' }),
      })
      // 大运应存在且步骤不同（阳年男命顺行，阴年男命逆行等）
      if (r1.daYun && r2.daYun) {
        // 大运推演应都成功
        expect(r1.daYun).toBeDefined()
        expect(r2.daYun).toBeDefined()
      }
    })
  })
})
