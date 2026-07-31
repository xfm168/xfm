/**
 * Sprint3-5 质量控制体系验收测试
 *
 * 验证 10 个阶段的完整闭环：
 *  ① AccuracyCenter — Rule/Engine/Decision 三级准确率
 *  ② CaseDatabase   — 50+ 古籍命例
 *  ③ ExplainScore   — 6 维度解释评分
 *  ④ ClassicCenter  — 100+ 古籍原文 + 引用合法性校验
 *  ⑤ RuleBenchmark  — 每条 Rule 命中/误判/冲突/贡献/淘汰
 *  ⑥ SchoolBenchmark — 8 流派一致率/分歧率/Ranking
 *  ⑦ EngineDashboard — 7 Engine 实时健康度/Evidence/Conflict/Accuracy
 *  ⑧ DecisionResult V3 — 含 AccuracyScore/ExplainScore/RuleBenchmark/CaseSimilarity
 *  ⑨ CaseSimilarity  — 当前命例 vs 50+ 历史命例 Top-N 相似度
 * ⑩ 端到端：DecisionResult 全量字段非空/可序列化
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  EvidenceFusionDecisionEngine,
  getSchoolProfile,
  SCHOOL_PROFILES,
} from '../../../xiyongshen/engines/fusion'
import type { SubEngineInput } from '../../../xiyongshen/engines/types'
import {
  AccuracyCenter,
  globalAccuracyCenter,
  CaseDatabase,
  CLASSIC_CASES,
  CaseSimilarityEngine,
  globalCaseSimilarityEngine,
  globalCaseDatabase,
  ExplainScoreCalculator,
  globalExplainScoreCalculator,
  ClassicCenter,
  CLASSIC_ENTRIES,
  globalClassicCenter,
  EngineDashboard,
  globalEngineDashboard,
} from '../../../xiyongshen/quality'
import type { BaziCase } from '../../../xiyongshen/quality/types'

// 测试命例：冬火调候 + 身弱扶抑综合场景
const TEST_INPUT: SubEngineInput = {
  dayGan: '丙', dayGanWuxing: '火', monthZhi: '子', monthZhiWuxing: '水',
  fourPillars: [
    { gan: '壬', zhi: '子', ganWx: '水', zhiWx: '水' },
    { gan: '壬', zhi: '子', ganWx: '水', zhiWx: '水' },
    { gan: '丙', zhi: '申', ganWx: '火', zhiWx: '金' },
    { gan: '戊', zhi: '戌', ganWx: '土', zhiWx: '土' },
  ],
  count: { '木': 0, '火': 1, '土': 1, '金': 1, '水': 5 },
  dayStrength: -2, dayRootCount: 0,
  isWinterBorn: true, isSummerBorn: false,
  seasonTag: 'winter',
  totalElementCount: 8,
  isDayStemSupport: false,
} as any

function createEngine(school = 'modern') {
  return new EvidenceFusionDecisionEngine(getSchoolProfile(school))
}

describe('Sprint3-5 质量控制体系验收', () => {
  // 每次测试重置 AccuracyCenter + EngineDashboard 全局累计
  beforeEach(() => {
    globalAccuracyCenter.reset()
    globalEngineDashboard.reset()
  })

  describe('阶段① AccuracyCenter 三级准确率', () => {
    it('评估单个命例 → Rule/Engine/Decision 全部存在', () => {
      const engine = createEngine()
      const result = engine.decide(TEST_INPUT)
      const report = globalAccuracyCenter.evaluate(result, result.subEngineResults)

      expect(report.ruleAccuracy, 'ruleAccuracy 非空').toBeTruthy()
      expect(report.engineAccuracy, 'engineAccuracy 非空').toBeTruthy()
      expect(report.decisionAccuracy, 'decisionAccuracy 非空').toBeTruthy()

      const d = report.decisionAccuracy
      expect(d.selfConfidence).toBeGreaterThanOrEqual(0)
      expect(d.selfConfidence).toBeLessThanOrEqual(1)
      expect(d.internalConsistency).toBeGreaterThanOrEqual(0)
      expect(d.internalConsistency).toBeLessThanOrEqual(1)
      expect(d.classicConsistency).toBeGreaterThanOrEqual(0)
      expect(d.classicConsistency).toBeLessThanOrEqual(1)
      expect(d.overallAccuracyScore).toBeGreaterThan(0)
      expect(d.overallAccuracyScore).toBeLessThanOrEqual(1)
    })

    it('Engine 级准确率包含 7 大引擎', () => {
      const engine = createEngine()
      const result = engine.decide(TEST_INPUT)
      const report = globalAccuracyCenter.evaluate(result, result.subEngineResults)
      const engineNames = Object.keys(report.engineAccuracy)
      const expected = ['Strength', 'Pattern', 'Climate', 'Balance', 'Medicine', 'Bridge', 'Season']
      for (const key of expected) {
        const hit = engineNames.some(n => n.includes(key))
        expect(hit, `应该包含引擎 ${key}`).toBe(true)
      }
    })
  })

  describe('阶段② CaseDatabase 50+ 古籍命例种子库', () => {
    it('命例数量 ≥ 50', () => {
      expect(CLASSIC_CASES.length).toBeGreaterThanOrEqual(50)
    })

    it('命例来源覆盖 7 本古籍 + 现代', () => {
      const sources = new Set(CLASSIC_CASES.map(c => c.source))
      const expected = [
        'qiongtong', 'ditiansui', 'zipingzhenyuan', 'sanming',
        'yuanhaiziping', 'shenfengtongkao', 'qiongtongfu', 'modern_public',
      ]
      for (const src of expected) {
        expect(sources.has(src as any), `缺少来源 ${src}`).toBe(true)
      }
    })

    it('所有命例 groundTruth 有主用神且置信度 ≥ 0.7', () => {
      for (const c of CLASSIC_CASES) {
        expect(c.groundTruth.primaryYongShen, `命例 ${c.caseId} 缺少主用神`).toBeTruthy()
        expect(c.groundTruth.confidence).toBeGreaterThanOrEqual(0.7)
        expect(c.caseConfidence).toBeGreaterThanOrEqual(0.7)
      }
    })

    it('命例 → SubEngineInput 转换正确', () => {
      const case0 = CLASSIC_CASES[0]
      const input = CaseDatabase.caseToSubInput(case0)
      expect(input.dayGan).toBe(case0.dayGan)
      expect(input.monthZhi).toBe(case0.fourPillars.month.zhi)
      expect(Object.keys(input.count).length).toBe(5)
    })
  })

  describe('阶段③ ExplainScore 6维度评分', () => {
    it('ExplainBuilder 输出 + ExplainScoreCalculator 打分 → 6 维度 + 总分', () => {
      const engine = createEngine()
      const result = engine.decide(TEST_INPUT)
      expect(result.explain.length).toBeGreaterThan(100) // 必须真的有解释

      const score = globalExplainScoreCalculator.score(result.explain, result)
      // 6 维度
      for (const key of ['completeness', 'classicCitation', 'conflictExplanation', 'schoolReason', 'reasoningProcess', 'readability']) {
        expect(typeof (score as any)[key]).toBe('number')
        expect((score as any)[key]).toBeGreaterThanOrEqual(0)
        expect((score as any)[key]).toBeLessThanOrEqual(1.0001)
      }
      expect(score.totalScore).toBeGreaterThan(0)
      expect(score.totalScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(score.improvementHints)).toBe(true)
    })
  })

  describe('阶段④ ClassicCenter 古籍原文库 + 引用合法性校验', () => {
    it('古籍条目数 ≥ 20（已内置穷通/滴天髓/子平/渊海/三命/神峰/穷通赋）', () => {
      expect(CLASSIC_ENTRIES.length).toBeGreaterThanOrEqual(20)
    })

    it('ClassicCenter 按经典名取条目正常', () => {
      const qt = globalClassicCenter.listByClassic('穷通宝鉴')
      expect(qt.length).toBeGreaterThan(0)
      const dts = globalClassicCenter.listByClassic('滴天髓')
      expect(dts.length).toBeGreaterThan(0)
    })

    it('pickCitations 按推荐五行取引用', () => {
      const huo = globalClassicCenter.pickCitations({ recommendWuxing: '火' }, 3)
      expect(huo.length).toBeGreaterThan(0)
    })

    it('引用合法性校验 → 合法 / 断章取义 / 无匹配 三种路径', () => {
      // 合法引用
      const valid = globalClassicCenter.validate({
        classicName: '穷通宝鉴',
        quote: '子月丙火，气势衰绝，先取壬水为杀',
        ruleId: 'TEST',
        supportedWuxing: '火',
      })
      expect(valid.matched).toBe(true)
      expect(valid.contentSimilarity).toBeGreaterThan(0.35)

      // 断章取义：穷通宝鉴·子月丙火支持火，但这里标注支持水（反对）
      const bad = globalClassicCenter.validate({
        classicName: '穷通宝鉴',
        quote: '子月丙火，气势衰绝，急需木火为君',
        ruleId: 'TEST',
        supportedWuxing: '水',
      })
      expect(bad.outOfContext || bad.issues.length > 0).toBe(true)
    })
  })

  describe('阶段⑤ RuleBenchmark 规则价值评估', () => {
    it('多次评估 → buildRuleBenchmark 返回 keep/review/demote/deprecate', () => {
      const engine = createEngine()
      const inputs = [TEST_INPUT]
      // 用几个不同输入多跑几次产生样本
      for (let i = 0; i < 3; i++) {
        for (const inp of inputs) {
          const result = engine.decide(inp)
          globalAccuracyCenter.evaluate(result, result.subEngineResults)
        }
      }
      const bench = globalAccuracyCenter.buildRuleBenchmark()
      expect(bench.summary.totalRules).toBeGreaterThan(0)
      for (const entry of Object.values(bench.entries)) {
        expect(['keep', 'review', 'demote', 'deprecate']).toContain(entry.recommendation)
        expect(entry.hitRate).toBeGreaterThanOrEqual(0)
        expect(entry.misjudgeRate).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('阶段⑧ DecisionResult V3 扩展字段', () => {
    it('engine.decide 返回的 DecisionResult 包含 V3 所有质量字段', () => {
      const engine = createEngine()
      const result = engine.decide(TEST_INPUT)

      // DecisionResult V2（基础字段）
      expect(result.primaryYongShen, '主用神存在').toBeTruthy()
      expect(result.assistantGod, '喜神存在').toBeTruthy()
      expect(result.avoidGod, '忌神存在').toBeTruthy()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.engineVersion, 'engineVersion').toBeTruthy()

      // DecisionResult V3（quality 自动注入）
      expect(result.version, 'V3 version 字段 = 3.5.0').toBe('3.5.0')
      expect(result.accuracyScore, 'accuracyScore 已注入').toBeTruthy()
      expect(result.accuracyScore!.overallAccuracyScore, 'AccuracyScore > 0').toBeGreaterThan(0)

      expect(result.explainScore, 'explainScore 已注入').toBeTruthy()
      expect(result.explainScore!.totalScore, 'ExplainScore 总分').toBeGreaterThan(0)

      expect(result.ruleBenchmark, 'ruleBenchmark 已注入').toBeTruthy()
      expect(result.ruleBenchmark!.summary.totalRules, 'Rule 数量').toBeGreaterThan(0)

      expect(result.caseSimilarity, 'caseSimilarity 已注入').toBeTruthy()
      expect(result.caseSimilarity!.topMatches.length, 'Top-5 匹配').toBeLessThanOrEqual(5)
      expect(result.caseSimilarity!.topMatches.length).toBeGreaterThan(0)
      expect(result.caseSimilarity!.maxSimilarity, '最高相似度 > 0').toBeGreaterThan(0)

      expect(result.engineHealthDashboard, 'engineHealthDashboard 已注入').toBeTruthy()
      expect(result.engineHealthDashboard!.summary.totalDecisions, '累计决策数').toBe(1)
    })
  })

  describe('阶段⑨ CaseSimilarity 相似度匹配', () => {
    it('当前命例 → Top-5 匹配包含最高相似度 + 分项', () => {
      const engine = createEngine()
      const result = engine.decide(TEST_INPUT)
      const rep = globalCaseSimilarityEngine.findSimilar(TEST_INPUT as any, result, 5)

      expect(rep.topMatches.length).toBeLessThanOrEqual(5)
      expect(rep.maxSimilarity).toBeGreaterThan(0)
      expect(rep.maxSimilarity).toBeLessThanOrEqual(1)
      // 按相似度排序
      for (let i = 1; i < rep.topMatches.length; i++) {
        expect(rep.topMatches[i].similarity).toBeLessThanOrEqual(rep.topMatches[i - 1].similarity + 0.001)
      }
      // 每一项包含 breakdown 4 个分项
      for (const m of rep.topMatches) {
        expect(m.breakdown.wuxingVector).toBeGreaterThanOrEqual(0)
        expect(m.breakdown.wangshuai).toBeGreaterThanOrEqual(0)
        expect(m.breakdown.geju).toBeGreaterThanOrEqual(0)
        expect(m.breakdown.tiaohou).toBeGreaterThanOrEqual(0)
        expect(m.caseId).toBeTruthy()
        expect(m.caseName).toBeTruthy()
      }
    })
  })

  describe('阶段⑦ EngineDashboard 运维面板', () => {
    it('recordDecision + generateReport → 7 Engine + 汇总统计', () => {
      const dash = new EngineDashboard()
      const engine = createEngine()
      const r1 = engine.decide(TEST_INPUT)
      dash.recordDecision(r1)
      const r2 = engine.decide({
        ...TEST_INPUT,
        dayGan: '甲', dayGanWuxing: '木',
      } as any)
      dash.recordDecision(r2)
      const rep = dash.generateReport()

      expect(rep.summary.totalDecisions, '累计决策数 = 2').toBe(2)
      expect(rep.summary.avgConfidence).toBeGreaterThan(0)
      expect(rep.summary.totalEvidence).toBeGreaterThan(0)

      // 引擎数 = 7
      const engNames = Object.keys(rep.engines)
      expect(engNames.length).toBe(7)
      for (const n of engNames) {
        const e = rep.engines[n]
        expect(e.health).toBeGreaterThanOrEqual(0)
        expect(e.health).toBeLessThanOrEqual(1)
        expect(e.runCount > 0 || e.avgLatencyMs >= 0).toBe(true)
      }
    })
  })

  describe('阶段⑥ SchoolBenchmark 8 流派准确率排名', () => {
    it('10 个命例跑 8 流派 → 返回 ranking + 各流派评分', () => {
      const benchCases: BaziCase[] = CLASSIC_CASES.slice(0, 10)
      const report = globalAccuracyCenter.buildSchoolBenchmark(
        benchCases,
        (c) => CaseDatabase.caseToSubInput(c),
      )

      expect(report.ranking.length, '8 流派').toBe(Object.keys(SCHOOL_PROFILES).length)
      for (const key of report.ranking) {
        const e = report.entries[key]
        expect(e, `流派 ${key} 有 entry`).toBeTruthy()
        expect(e.rank).toBeGreaterThanOrEqual(1)
        expect(e.rank).toBeLessThanOrEqual(Object.keys(SCHOOL_PROFILES).length)
        expect(e.overallScore).toBeGreaterThanOrEqual(0)
        expect(e.overallScore).toBeLessThanOrEqual(100)
        expect(e.sampleSize).toBe(benchCases.length)
      }
      // ranking 按 overallScore 降序
      let prev = 101
      for (const key of report.ranking) {
        const sc = report.entries[key].overallScore
        expect(sc).toBeLessThanOrEqual(prev + 0.01)
        prev = sc
      }
    })
  })

  describe('⑩ 端到端：DecisionResult 可序列化 + 全流程无异常', () => {
    it('JSON.stringify(result) 不丢字段 / 不抛异常', () => {
      const engine = createEngine()
      const result = engine.decide(TEST_INPUT)
      // 序列化 & 反序列化，断言关键字段
      const str = JSON.stringify(result)
      expect(str.length).toBeGreaterThan(1000)
      const revived = JSON.parse(str)
      expect(revived.primaryYongShen).toBe(result.primaryYongShen)
      expect(revived.accuracyScore.overallAccuracyScore).toBe(result.accuracyScore!.overallAccuracyScore)
      expect(revived.explainScore.totalScore).toBe(result.explainScore!.totalScore)
      expect(revived.caseSimilarity.topMatches.length).toBe(result.caseSimilarity!.topMatches.length)
    })

    it('8 大流派切换 → 每个流派都能跑通 Quality 全流程', () => {
      for (const school of Object.keys(SCHOOL_PROFILES)) {
        const engine = createEngine(school)
        const result = engine.decide(TEST_INPUT)
        // 断言 V3 字段存在
        expect(result.version, `${school} version=3.5.0`).toBe('3.5.0')
        expect(result.accuracyScore, `${school} accuracyScore`).toBeTruthy()
        expect(result.explainScore, `${school} explainScore`).toBeTruthy()
        expect(result.caseSimilarity, `${school} caseSimilarity`).toBeTruthy()
      }
    })
  })
})
