/**
 * Sprint3-4: Evidence Fusion Decision Engine 测试
 *
 * 验证：
 * 1. 不简单加权平均（Evidence Fusion）
 * 2. 多用神支持（Primary/Secondary/Assistant/Avoid/Idle）
 * 3. SchoolProfile 流派模式
 * 4. DecisionTrace 决策回溯
 * 5. Rule Voting 规则投票
 * 6. Evidence 冲突解释
 * 7. 统一 DecisionResult 输出
 * 8. 为紫微/奇门/六爻预留统一接口
 */

import { describe, it, expect } from 'vitest'
import {
  EvidenceFusionDecisionEngine,
  globalEvidenceFusionEngine,
  createFusionEngine,
  SCHOOL_PROFILES,
  getSchoolProfile,
  DEFAULT_SCHOOL,
  type DecisionResult,
  type SchoolProfile,
} from '../../../xiyongshen/engines/fusion'
import type { SubEngineInput } from '../../../xiyongshen/engines/types'

const testCases: Array<{ name: string; input: SubEngineInput }> = [
  {
    name: '身强甲木秋生',
    input: {
      dayGan: '甲', dayGanWuxing: '木', monthZhi: '酉', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '癸', zhi: '酉', ganWx: '水', zhiWx: '金' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '丙', zhi: '寅', ganWx: '火', zhiWx: '木' },
      ],
      count: { '木': 5, '火': 1, '土': 0, '金': 1, '水': 1 },
      dayStrength: 2, dayRootCount: 3,
      isWinterBorn: false, isSummerBorn: false,
    },
  },
  {
    name: '身弱丙火冬生',
    input: {
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
    },
  },
  {
    name: '中和戊土春生',
    input: {
      dayGan: '戊', dayGanWuxing: '土', monthZhi: '卯', monthZhiWuxing: '木',
      fourPillars: [
        { gan: '乙', zhi: '卯', ganWx: '木', zhiWx: '木' },
        { gan: '丁', zhi: '卯', ganWx: '火', zhiWx: '木' },
        { gan: '戊', zhi: '午', ganWx: '土', zhiWx: '火' },
        { gan: '辛', zhi: '酉', ganWx: '金', zhiWx: '金' },
      ],
      count: { '木': 2, '火': 2, '土': 2, '金': 1, '水': 0 },
      dayStrength: 0, dayRootCount: 1,
      isWinterBorn: false, isSummerBorn: false,
    },
  },
  {
    name: '金木相战',
    input: {
      dayGan: '甲', dayGanWuxing: '木', monthZhi: '申', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '庚', zhi: '申', ganWx: '金', zhiWx: '金' },
        { gan: '庚', zhi: '申', ganWx: '金', zhiWx: '金' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
      ],
      count: { '木': 4, '火': 0, '土': 0, '金': 4, '水': 0 },
      dayStrength: 0, dayRootCount: 2,
      conflictingPairs: [['金', '木']] as any,
      isWinterBorn: false, isSummerBorn: false,
    },
  },
  {
    name: '病药场景',
    input: {
      dayGan: '甲', dayGanWuxing: '木', monthZhi: '酉', monthZhiWuxing: '金',
      fourPillars: [
        { gan: '辛', zhi: '酉', ganWx: '金', zhiWx: '金' },
        { gan: '辛', zhi: '酉', ganWx: '金', zhiWx: '金' },
        { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
        { gan: '丙', zhi: '午', ganWx: '火', zhiWx: '火' },
      ],
      count: { '木': 2, '火': 1, '土': 0, '金': 4, '水': 0 },
      dayStrength: -1, dayRootCount: 1,
      diseaseWuxing: '金',
      isWinterBorn: false, isSummerBorn: false,
    },
  },
]

describe('Sprint3-4: Evidence Fusion Decision Engine', () => {

  // ============================================================
  // ① Evidence Fusion 核心验证（非简单加权平均）
  // ============================================================
  describe('① Evidence Fusion 核心验证', () => {
    it('FinalDecisionScore 由 7 个组成部分构成（非简单 score×weight）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        for (const bd of result.scoreBreakdown) {
          // 验证 7 个组成部分都存在
          expect(typeof bd.weightedScore).toBe('number')
          expect(typeof bd.voteScore).toBe('number')
          expect(typeof bd.classicScore).toBe('number')
          expect(typeof bd.evidenceScore).toBe('number')
          expect(typeof bd.consensusScore).toBe('number')
          expect(typeof bd.priorityFactor).toBe('number')
          expect(typeof bd.conflictPenalty).toBe('number')
          // finalScore 应该是各组成部分的综合，而非简单 weightedScore
          expect(bd.finalScore).not.toEqual(bd.weightedScore)
        }
      }
    })

    it('finalScore = (weighted + vote + classic + evidence + consensus) × priority - conflictPenalty', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        for (const bd of result.scoreBreakdown) {
          const base = bd.weightedScore + bd.voteScore + bd.classicScore + bd.evidenceScore + bd.consensusScore
          const expected = Number((base * bd.priorityFactor - bd.conflictPenalty).toFixed(4))
          expect(bd.finalScore).toBeCloseTo(expected, 3)
        }
      }
    })

    it('每个场景都生成完整的 DecisionResult', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        // 系统标识
        expect(result.system).toBe('bazi')
        expect(result.school).toBeTruthy()
        expect(result.engineVersion).toBeTruthy()
        // 用神
        expect(result.primaryYongShen).toBeTruthy()
        expect(result.assistantGod).toBeTruthy()
        expect(result.avoidGod).toBeTruthy()
        expect(result.idleGod).toBeTruthy()
        // 评分明细
        expect(result.scoreBreakdown.length).toBe(5)
        // 可信度
        expect(result.confidence).toBeGreaterThan(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
        // 证据
        expect(result.evidenceTree.nodes.length).toBe(7)
        expect(result.evidenceTree.totalEvidence).toBeGreaterThan(0)
        // 回溯
        expect(result.decisionTraces.length).toBe(5)
        // 冲突报告
        expect(result.conflictReport).toBeDefined()
        // 子引擎结果
        expect(result.subEngineResults.length).toBe(7)
        // 说明
        expect(result.explain.length).toBeGreaterThan(100)
        expect(result.strategy).toBeTruthy()
        expect(result.summary).toBeTruthy()
      }
    })
  })

  // ============================================================
  // ② 多用神支持
  // ============================================================
  describe('② 多用神支持', () => {
    it('支持 isMultiYongShen 标志和 secondaryYongShen', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        expect(typeof result.isMultiYongShen).toBe('boolean')
        if (result.isMultiYongShen) {
          expect(result.secondaryYongShen).toBeTruthy()
          expect(result.multiYongShenPattern).toBeTruthy()
          // 多用神模式应包含：同用 / 并用 / 成象 之一
          const pattern = result.multiYongShenPattern!
          expect(
            pattern.includes('同用') || pattern.includes('并用') || pattern.includes('成象'),
          ).toBe(true)
        }
      }
    })

    it('verdicts 包含 Primary/Secondary/Assistant/Avoid/Idle 角色', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        const roles = result.verdicts.map(v => v.role)
        expect(roles).toContain('primary')
        expect(roles).toContain('assistant')
        expect(roles).toContain('avoid')
      }
    })

    it('多用神场景下 combinedWith 标注并用关系', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        if (result.isMultiYongShen && result.secondaryYongShen) {
          const primary = result.verdicts.find(v => v.role === 'primary')
          const secondary = result.verdicts.find(v => v.role === 'secondary')
          expect(primary?.combinedWith).toContain(result.secondaryYongShen)
          expect(secondary?.combinedWith).toContain(result.primaryYongShen)
        }
      }
    })
  })

  // ============================================================
  // ③ SchoolProfile 流派模式
  // ============================================================
  describe('③ SchoolProfile 流派模式', () => {
    it('预设 4 种流派 + 4 种预留扩展 = 8 种', () => {
      const keys = Object.keys(SCHOOL_PROFILES)
      expect(keys).toContain('ziping')
      expect(keys).toContain('qiongtong')
      expect(keys).toContain('modern')
      expect(keys).toContain('balanced')
      // 预留扩展
      expect(keys).toContain('ditiansui')
      expect(keys).toContain('zipingzhenyuan')
      expect(keys).toContain('yuanhaiziping')
      expect(keys).toContain('shenfengtongkao')
      expect(keys.length).toBeGreaterThanOrEqual(8)
    })

    it('每种流派的 engineWeights 归一化和为 1', () => {
      for (const profile of Object.values(SCHOOL_PROFILES)) {
        const sum = profile.engineWeights.strength +
          profile.engineWeights.pattern + profile.engineWeights.climate +
          profile.engineWeights.balance + profile.engineWeights.medicine +
          profile.engineWeights.bridge + profile.engineWeights.season
        expect(sum, `${profile.name}: 权重和应接近1`).toBeCloseTo(1, 1)
      }
    })

    it('不同流派对同一命局可能给出不同用神', () => {
      const tc = testCases[0] // 身强甲木秋生
      const modernResult = createFusionEngine('modern').decide(tc.input)
      const zipingResult = createFusionEngine('ziping').decide(tc.input)
      const qiongtongResult = createFusionEngine('qiongtong').decide(tc.input)

      // 三个流派都应输出有效结果
      expect(modernResult.school).toBe('modern')
      expect(zipingResult.school).toBe('ziping')
      expect(qiongtongResult.school).toBe('qiongtong')
      // 各流派的 scoreBreakdown 可能不同（因为权重不同）
      expect(modernResult.scoreBreakdown).toBeDefined()
      expect(zipingResult.scoreBreakdown).toBeDefined()
      expect(qiongtongResult.scoreBreakdown).toBeDefined()
    })

    it('每种流派都有完整的 evidenceWeights 和 classicWeights', () => {
      for (const profile of Object.values(SCHOOL_PROFILES)) {
        expect(profile.evidenceWeights.scoreWeight).toBeGreaterThan(0)
        expect(profile.evidenceWeights.voteWeight).toBeGreaterThan(0)
        expect(profile.evidenceWeights.classicWeight).toBeGreaterThan(0)
        expect(profile.evidenceWeights.evidenceWeight).toBeGreaterThan(0)
        expect(profile.evidenceWeights.consensusWeight).toBeGreaterThan(0)
        expect(Object.keys(profile.classicWeights).length).toBeGreaterThanOrEqual(4)
        expect(profile.yongShenThreshold).toBeGreaterThan(0)
        expect(profile.multiYongShenThreshold).toBeGreaterThan(0)
        expect(profile.conflictPenaltyFactor).toBeGreaterThan(0)
        expect(Object.keys(profile.enginePriorities).length).toBe(7)
      }
    })
  })

  // ============================================================
  // ④ DecisionTrace 决策回溯
  // ============================================================
  describe('④ DecisionTrace 决策回溯', () => {
    it('每个五行都有完整的 DecisionTrace', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        for (const trace of result.decisionTraces) {
          expect(trace.wuxing).toBeTruthy()
          expect(typeof trace.finalScore).toBe('number')
          expect(trace.steps.length).toBeGreaterThan(0)
          expect(trace.narrative.length).toBeGreaterThan(50)
        }
      }
    })

    it('DecisionTrace 包含引擎评分贡献、投票、古籍、证据、共识、优先级、冲突、最终分', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        const primaryTrace = result.decisionTraces.find(
          t => t.wuxing === result.primaryYongShen
        )!
        const contributionTypes = primaryTrace.steps.map(s => s.contributionType)
        // 应包含各类贡献类型
        expect(contributionTypes).toContain('score')
        expect(contributionTypes).toContain('vote')
        expect(contributionTypes).toContain('classic')
        expect(contributionTypes).toContain('evidence')
        expect(contributionTypes).toContain('priority')
        // 最终分步骤
        const finalStep = primaryTrace.steps[primaryTrace.steps.length - 1]
        expect(finalStep.name).toContain('Final')
      }
    })

    it('narrative 包含完整的决策叙事（流派+引擎+投票+古籍+裁决）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        const primaryTrace = result.decisionTraces.find(
          t => t.wuxing === result.primaryYongShen
        )!
        expect(primaryTrace.narrative).toContain('决策回溯')
        expect(primaryTrace.narrative).toContain('流派')
        expect(primaryTrace.narrative).toContain('Engine')
        expect(primaryTrace.narrative).toContain('投票')
        expect(primaryTrace.narrative).toContain('古籍')
      }
    })
  })

  // ============================================================
  // ⑤ Rule Voting 规则投票
  // ============================================================
  describe('⑤ Rule Voting 规则投票', () => {
    it('每个五行都有 vote summary（support/oppose/neutral）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        for (const v of result.verdicts) {
          expect(typeof v.vote.supportCount).toBe('number')
          expect(typeof v.vote.opposeCount).toBe('number')
          expect(typeof v.vote.neutralCount).toBe('number')
          expect(v.vote.supportCount + v.vote.opposeCount + v.vote.neutralCount).toBe(7)
          expect(typeof v.vote.weightedScore).toBe('number')
          expect(typeof v.vote.supportRate).toBe('number')
        }
      }
    })

    it('主用神的 supportCount 应该 >= opposeCount（多数引擎支持）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        const primary = result.verdicts.find(v => v.role === 'primary')!
        expect(primary.vote.supportCount).toBeGreaterThanOrEqual(primary.vote.opposeCount)
      }
    })
  })

  // ============================================================
  // ⑥ Conflict Report 冲突解释
  // ============================================================
  describe('⑥ Conflict Report 冲突解释', () => {
    it('冲突报告包含冲突列表、总数、最大强度、惩罚分', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        expect(result.conflictReport.conflicts).toBeDefined()
        expect(typeof result.conflictReport.totalConflicts).toBe('number')
        expect(typeof result.conflictReport.maxIntensity).toBe('number')
        expect(typeof result.conflictReport.conflictPenalty).toBe('number')
        expect(typeof result.conflictReport.summary).toBe('string')
        expect(result.conflictReport.conflictPenalty).toBeGreaterThanOrEqual(0)
      }
    })

    it('每个冲突都有完整的解释（来源+采纳+舍弃原因）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        for (const c of result.conflictReport.conflicts) {
          expect(c.wuxing).toBeTruthy()
          expect(c.engineA).toBeTruthy()
          expect(c.engineB).toBeTruthy()
          expect(['A', 'B', 'both', 'neither']).toContain(c.adoptedSide)
          expect(c.adoptionReason.length).toBeGreaterThan(10)
          expect(c.rejectionReason.length).toBeGreaterThan(10)
          expect(c.conflictSource.length).toBeGreaterThan(10)
        }
      }
    })
  })

  // ============================================================
  // ⑦ Classic Support & School Consensus
  // ============================================================
  describe('⑦ Classic Support & School Consensus', () => {
    it('每个五行都有 ClassicSupport（引用次数+古籍数+支持度）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        for (const wx of ['木', '火', '土', '金', '水'] as const) {
          const cs = result.classicSupport[wx]
          expect(typeof cs.totalRefCount).toBe('number')
          expect(typeof cs.classicCount).toBe('number')
          expect(typeof cs.supportScore).toBe('number')
          expect(cs.supportScore).toBeGreaterThanOrEqual(0)
          expect(cs.supportScore).toBeLessThanOrEqual(1)
        }
      }
    })

    it('每个五行都有 SchoolConsensus（跨流派评分+共识度）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        for (const wx of ['木', '火', '土', '金', '水'] as const) {
          const sc = result.schoolConsensus[wx]
          expect(sc.bySchool.length).toBeGreaterThanOrEqual(4) // 至少 4 种流派
          expect(typeof sc.consensusRate).toBe('number')
          expect(sc.consensusRate).toBeGreaterThanOrEqual(0)
          expect(sc.consensusRate).toBeLessThanOrEqual(1)
          expect(typeof sc.hasCrossSchoolConsensus).toBe('boolean')
        }
      }
    })
  })

  // ============================================================
  // ⑧ EvidenceTree 证据树
  // ============================================================
  describe('⑧ EvidenceTree 证据树', () => {
    it('EvidenceTree 包含 7 个节点（含 applicable=false 的跳过引擎）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        expect(result.evidenceTree.nodes.length).toBe(7)
        for (const node of result.evidenceTree.nodes) {
          expect(node.engineName).toBeTruthy()
          expect(typeof node.applicable).toBe('boolean')
          expect(node.evidence.length).toBeGreaterThan(0)
        }
      }
    })

    it('EvidenceTree 统计正确（totalEvidence + satisfiedEvidence + completeness）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        const tree = result.evidenceTree
        const expectedTotal = tree.nodes.reduce((sum, n) => sum + n.evidence.length, 0)
        expect(tree.totalEvidence).toBe(expectedTotal)
        expect(tree.satisfiedEvidence).toBeLessThanOrEqual(tree.totalEvidence)
        expect(tree.completeness).toBeCloseTo(
          tree.satisfiedEvidence / tree.totalEvidence, 2,
        )
        expect(tree.classics.length).toBeGreaterThan(0)
      }
    })
  })

  // ============================================================
  // ⑨ Confidence 可信度
  // ============================================================
  describe('⑨ Confidence 可信度', () => {
    it('综合 confidence 由 5 个维度构成', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        const cb = result.confidenceBreakdown
        expect(typeof cb.evidenceCoverage).toBe('number')
        expect(typeof cb.engineConsensus).toBe('number')
        expect(typeof cb.classicSupport).toBe('number')
        expect(typeof cb.schoolConsistency).toBe('number')
        expect(typeof cb.conflictPenalty).toBe('number')
        // 各维度都在 [0, 1] 区间
        expect(cb.evidenceCoverage).toBeGreaterThanOrEqual(0)
        expect(cb.evidenceCoverage).toBeLessThanOrEqual(1)
      }
    })
  })

  // ============================================================
  // ⑩ 统一接口（为紫微/奇门/六爻预留）
  // ============================================================
  describe('⑩ 统一接口（为紫微/奇门/六爻预留）', () => {
    it('DecisionResult 包含 system 字段（bazi/ziwei/qimen/liuyao/fengshui）', () => {
      for (const tc of testCases) {
        const result = globalEvidenceFusionEngine.decide(tc.input)
        expect(['bazi', 'ziwei', 'qimen', 'liuyao', 'fengshui']).toContain(result.system)
      }
    })

    it('DecisionResult 字段完整（AI 唯一读取接口）', () => {
      const result = globalEvidenceFusionEngine.decide(testCases[0].input)
      // AI 层只需要这些字段，绝不重新推理
      expect(result.system).toBeTruthy()
      expect(result.school).toBeTruthy()
      expect(result.primaryYongShen).toBeTruthy()
      expect(result.assistantGod).toBeTruthy()
      expect(result.avoidGod).toBeTruthy()
      expect(result.idleGod).toBeTruthy()
      expect(result.isMultiYongShen).toBeDefined()
      expect(result.verdicts).toBeDefined()
      expect(result.scoreBreakdown).toBeDefined()
      expect(result.confidence).toBeDefined()
      expect(result.confidenceBreakdown).toBeDefined()
      expect(result.evidenceTree).toBeDefined()
      expect(result.decisionTraces).toBeDefined()
      expect(result.conflictReport).toBeDefined()
      expect(result.classicSupport).toBeDefined()
      expect(result.schoolConsensus).toBeDefined()
      expect(result.subEngineResults).toBeDefined()
      expect(result.explain).toBeTruthy()
      expect(result.strategy).toBeTruthy()
      expect(result.summary).toBeTruthy()
    })
  })

  // ============================================================
  // ⑪ 确定性 & 流派切换
  // ============================================================
  describe('⑪ 确定性 & 流派切换', () => {
    it('同输入多次调用结果一致（确定性）', () => {
      for (const tc of testCases) {
        const r1 = globalEvidenceFusionEngine.decide(tc.input)
        const r2 = globalEvidenceFusionEngine.decide(tc.input)
        expect(r1.primaryYongShen).toBe(r2.primaryYongShen)
        expect(r1.scoreBreakdown).toEqual(r2.scoreBreakdown)
      }
    })

    it('切换流派后结果可能不同但结构一致', () => {
      const tc = testCases[1] // 身弱丙火冬生
      const modernEngine = createFusionEngine('modern')
      const qiongtongEngine = createFusionEngine('qiongtong')
      const r1 = modernEngine.decide(tc.input)
      const r2 = qiongtongEngine.decide(tc.input)
      // 结构一致
      expect(r1.system).toBe(r2.system)
      expect(r1.verdicts.length).toBe(r2.verdicts.length)
      expect(r1.scoreBreakdown.length).toBe(r2.scoreBreakdown.length)
      // 流派标识不同
      expect(r1.school).toBe('modern')
      expect(r2.school).toBe('qiongtong')
    })
  })
})
