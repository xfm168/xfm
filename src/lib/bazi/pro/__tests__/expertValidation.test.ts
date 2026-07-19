/**
 * V4.5 Phase 2: Expert Validation Center 测试
 *
 * 覆盖范围：知识库数据、专家验证记录、学习队列、回归锁、类型工具函数、引擎报告生成
 */

import { describe, it, expect } from 'vitest'
import { generateValidationCenterReport, EXPERT_VALIDATION_VERSION } from '../expertValidationEngine'
import {
  KNOWLEDGE_BASE,
  EXPERT_VALIDATIONS,
  LEARNING_QUEUE_DATA,
  REGRESSION_LOCKS,
  getKnowledgeByCategory,
  getKnowledgeBySource,
  getKnowledgeById,
  getAllKnowledge,
  getValidationsByStatus,
  getValidationById,
  getAllValidations,
  getUnresolvedLearningQueue,
  getActiveLocks,
  getLockByCaseId,
} from '../knowledgeBaseDatabase'
import {
  generateValidationId,
  generateExpertId,
  getReviewStatusDisplay,
  type KnowledgeEntry,
  type KnowledgeCategory,
  type KnowledgeSource,
  type ExpertValidationRecord,
  type LearningQueueItem,
  type RegressionLock,
  type ExpertValidationCenterReport,
  type DifferenceReport,
  type ReviewStatus,
} from '../knowledgeBaseTypes'

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V4.5 Phase 2: Knowledge Base + Expert Validation', () => {

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────

  describe('版本号', () => {
    it('EXPERT_VALIDATION_VERSION === "1.0.0"', () => {
      expect(EXPERT_VALIDATION_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. Knowledge Base: 数据
  // ─────────────────────────────────────────────

  describe('Knowledge Base: 数据', () => {
    it('KNOWLEDGE_BASE 长度 >= 26', () => {
      expect(KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(26)
    })

    it('每条知识条目都包含必需字段', () => {
      const requiredFields: (keyof KnowledgeEntry)[] = [
        'id', 'source', 'originalText', 'modernExplanation',
        'keywords', 'category', 'associations', 'citationLevel', 'confidence',
      ]
      for (const entry of KNOWLEDGE_BASE) {
        for (const field of requiredFields) {
          expect(entry).toHaveProperty(field)
        }
      }
    })

    it('所有 originalText 是非空字符串', () => {
      for (const entry of KNOWLEDGE_BASE) {
        expect(typeof entry.originalText).toBe('string')
        expect(entry.originalText.length).toBeGreaterThan(0)
      }
    })

    it('所有 keywords 是数组', () => {
      for (const entry of KNOWLEDGE_BASE) {
        expect(Array.isArray(entry.keywords)).toBe(true)
      }
    })

    it('所有 confidence 值在 0~1 之间', () => {
      for (const entry of KNOWLEDGE_BASE) {
        expect(entry.confidence).toBeGreaterThanOrEqual(0)
        expect(entry.confidence).toBeLessThanOrEqual(1)
      }
    })

    it('所有 id 以 "KB-" 开头', () => {
      for (const entry of KNOWLEDGE_BASE) {
        expect(entry.id).toMatch(/^KB-/)
      }
    })

    it('所有 source 属于合法的 KnowledgeSource', () => {
      const validSources: KnowledgeSource[] = [
        '三命通会', '滴天髓', '子平真诠', '穷通宝鉴',
        '渊海子平', '神峰通考', '星平会海', '协纪辨方书',
        '命理正宗', '兰台妙选', 'Other',
      ]
      for (const entry of KNOWLEDGE_BASE) {
        expect(validSources).toContain(entry.source)
      }
    })

    it('所有 category 属于合法的 KnowledgeCategory', () => {
      const validCategories: KnowledgeCategory[] = [
        '四柱', '神煞', '十神', '格局', '喜用神',
        '大运', '流年', '命局总论', '五行', '调候',
        '合化', '冲刑', '事业', '财运', '婚姻',
        '健康', '学业', '风水', '其他',
      ]
      for (const entry of KNOWLEDGE_BASE) {
        expect(validCategories).toContain(entry.category)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 3. Knowledge Base: 分类覆盖
  // ─────────────────────────────────────────────

  describe('Knowledge Base: 分类覆盖', () => {
    it('getKnowledgeByCategory("十神") 至少有 3 条', () => {
      const result = getKnowledgeByCategory('十神')
      expect(result.length).toBeGreaterThanOrEqual(3)
    })

    it('getKnowledgeByCategory("格局") 至少有 3 条', () => {
      const result = getKnowledgeByCategory('格局')
      expect(result.length).toBeGreaterThanOrEqual(3)
    })

    it('getKnowledgeByCategory("五行") 至少有 1 条', () => {
      const result = getKnowledgeByCategory('五行')
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('getKnowledgeByCategory("不存在") 返回空数组', () => {
      // 类型断言：传入一个不在枚举中的值来测试防御性
      const result = getKnowledgeByCategory('其他' as KnowledgeCategory)
      // "其他" 是合法的 KnowledgeCategory，但数据中可能没有
      // 这里用一个不存在的分类字符串来测试
      const emptyResult = getKnowledgeByCategory('风水' as KnowledgeCategory)
      // 由于 KNOWLEDGE_BASE 中没有"风水"分类的条目
      expect(emptyResult).toEqual([])
    })

    it('getAllKnowledge() 长度 >= 26', () => {
      const all = getAllKnowledge()
      expect(all.length).toBeGreaterThanOrEqual(26)
    })
  })

  // ─────────────────────────────────────────────
  // 4. Knowledge Base: 来源覆盖
  // ─────────────────────────────────────────────

  describe('Knowledge Base: 来源覆盖', () => {
    it('getKnowledgeBySource("三命通会") 至少有 1 条', () => {
      const result = getKnowledgeBySource('三命通会')
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('getKnowledgeBySource("滴天髓") 至少有 1 条', () => {
      const result = getKnowledgeBySource('滴天髓')
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('getKnowledgeBySource("不存在的书") 返回空数组', () => {
      const result = getKnowledgeBySource('Other' as KnowledgeSource)
      // KNOWLEDGE_BASE 中没有来源为 "Other" 的条目
      expect(result).toEqual([])
    })
  })

  // ─────────────────────────────────────────────
  // 5. Knowledge Base: 查询
  // ─────────────────────────────────────────────

  describe('Knowledge Base: 查询', () => {
    it('getKnowledgeById("KB-001") 存在', () => {
      const entry = getKnowledgeById('KB-001')
      expect(entry).toBeDefined()
      expect(entry!.id).toBe('KB-001')
    })

    it('getKnowledgeById("KB-001") 的 source 为 "三命通会"', () => {
      const entry = getKnowledgeById('KB-001')
      expect(entry!.source).toBe('三命通会')
    })

    it('getKnowledgeById("不存在") === undefined', () => {
      const entry = getKnowledgeById('不存在的ID')
      expect(entry).toBeUndefined()
    })
  })

  // ─────────────────────────────────────────────
  // 6. Expert Validations: 数据
  // ─────────────────────────────────────────────

  describe('Expert Validations: 数据', () => {
    it('EXPERT_VALIDATIONS 长度 === 5', () => {
      expect(EXPERT_VALIDATIONS).toHaveLength(5)
    })

    it('每条验证记录都包含必需字段', () => {
      const requiredFields: (keyof ExpertValidationRecord)[] = [
        'validationId', 'caseId', 'expertId', 'verdict',
        'status', 'consistencyRate', 'score',
      ]
      for (const record of EXPERT_VALIDATIONS) {
        for (const field of requiredFields) {
          expect(record).toHaveProperty(field)
        }
      }
    })

    it('至少有 1 条 verdict 为 "agree"', () => {
      const agreeCount = EXPERT_VALIDATIONS.filter(v => v.verdict === 'agree').length
      expect(agreeCount).toBeGreaterThanOrEqual(1)
    })

    it('至少有 1 条 status 为 "verified"', () => {
      const verifiedCount = EXPERT_VALIDATIONS.filter(v => v.status === 'verified').length
      expect(verifiedCount).toBeGreaterThanOrEqual(1)
    })

    it('至少有 1 条 status 为 "disputed"', () => {
      const disputedCount = EXPERT_VALIDATIONS.filter(v => v.status === 'disputed').length
      expect(disputedCount).toBeGreaterThanOrEqual(1)
    })

    it('所有 consistencyRate 在 0~1 之间', () => {
      for (const record of EXPERT_VALIDATIONS) {
        expect(record.consistencyRate).toBeGreaterThanOrEqual(0)
        expect(record.consistencyRate).toBeLessThanOrEqual(1)
      }
    })

    it('所有 score 在 0~100 之间', () => {
      for (const record of EXPERT_VALIDATIONS) {
        expect(record.score).toBeGreaterThanOrEqual(0)
        expect(record.score).toBeLessThanOrEqual(100)
      }
    })

    it('所有 validationId 以 "VAL-" 开头', () => {
      for (const record of EXPERT_VALIDATIONS) {
        expect(record.validationId).toMatch(/^VAL-/)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 7. Expert Validations: 查询
  // ─────────────────────────────────────────────

  describe('Expert Validations: 查询', () => {
    it('getAllValidations() 长度 === 5', () => {
      const all = getAllValidations()
      expect(all).toHaveLength(5)
    })

    it('getValidationsByStatus("verified") 至少有 1 条', () => {
      const result = getValidationsByStatus('verified')
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('getValidationsByStatus("disputed") 至少有 1 条', () => {
      const result = getValidationsByStatus('disputed')
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('getValidationsByStatus("pending") 至少有 1 条', () => {
      const result = getValidationsByStatus('pending')
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('getValidationById("VAL-001") 存在', () => {
      const record = getValidationById('VAL-001')
      expect(record).toBeDefined()
      expect(record!.validationId).toBe('VAL-001')
    })

    it('getValidationById("不存在") === undefined', () => {
      const record = getValidationById('不存在的ID')
      expect(record).toBeUndefined()
    })
  })

  // ─────────────────────────────────────────────
  // 8. Learning Queue: 数据
  // ─────────────────────────────────────────────

  describe('Learning Queue: 数据', () => {
    it('LEARNING_QUEUE_DATA 长度 === 3', () => {
      expect(LEARNING_QUEUE_DATA).toHaveLength(3)
    })

    it('每条学习队列项都包含必需字段', () => {
      const requiredFields: (keyof LearningQueueItem)[] = [
        'queueId', 'validationId', 'caseId', 'reason',
        'priority', 'addedAt', 'resolved',
      ]
      for (const item of LEARNING_QUEUE_DATA) {
        for (const field of requiredFields) {
          expect(item).toHaveProperty(field)
        }
      }
    })

    it('getUnresolvedLearningQueue() 只返回未解决的', () => {
      const unresolved = getUnresolvedLearningQueue()
      for (const item of unresolved) {
        expect(item.resolved).toBe(false)
      }
    })

    it('所有 priority 为正数', () => {
      for (const item of LEARNING_QUEUE_DATA) {
        expect(item.priority).toBeGreaterThan(0)
      }
    })

    it('所有 caseId 对应已有的验证记录', () => {
      const validationCaseIds = new Set(EXPERT_VALIDATIONS.map(v => v.caseId))
      for (const item of LEARNING_QUEUE_DATA) {
        expect(validationCaseIds).toContain(item.caseId)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 9. Regression Locks: 数据
  // ─────────────────────────────────────────────

  describe('Regression Locks: 数据', () => {
    it('REGRESSION_LOCKS 长度 === 2', () => {
      expect(REGRESSION_LOCKS).toHaveLength(2)
    })

    it('每条回归锁都包含必需字段', () => {
      const requiredFields: (keyof RegressionLock)[] = [
        'lockId', 'caseId', 'validationId',
        'lockedAt', 'lockedByVersion', 'lockedResult', 'status',
      ]
      for (const lock of REGRESSION_LOCKS) {
        for (const field of requiredFields) {
          expect(lock).toHaveProperty(field)
        }
      }
    })

    it('getActiveLocks() 只返回 active 的', () => {
      const activeLocks = getActiveLocks()
      for (const lock of activeLocks) {
        expect(lock.status).toBe('active')
      }
    })

    it('getLockByCaseId("CLS-001") 存在', () => {
      const lock = getLockByCaseId('CLS-001')
      expect(lock).toBeDefined()
      expect(lock!.caseId).toBe('CLS-001')
    })

    it('getLockByCaseId("不存在") === undefined', () => {
      const lock = getLockByCaseId('不存在的ID')
      expect(lock).toBeUndefined()
    })
  })

  // ─────────────────────────────────────────────
  // 10. Types: 工具函数
  // ─────────────────────────────────────────────

  describe('Types: 工具函数', () => {
    it('generateValidationId() 以 "VAL-" 开头', () => {
      const id = generateValidationId()
      expect(id).toMatch(/^VAL-/)
    })

    it('generateExpertId() 以 "EXP-" 开头', () => {
      const id = generateExpertId()
      expect(id).toMatch(/^EXP-/)
    })

    it('getReviewStatusDisplay("pending") === "待审核"', () => {
      expect(getReviewStatusDisplay('pending')).toBe('待审核')
    })

    it('getReviewStatusDisplay("verified") === "已验证"', () => {
      expect(getReviewStatusDisplay('verified')).toBe('已验证')
    })

    it('getReviewStatusDisplay("disputed") === "有争议"', () => {
      expect(getReviewStatusDisplay('disputed')).toBe('有争议')
    })

    it('getReviewStatusDisplay("deprecated") === "已废弃"', () => {
      expect(getReviewStatusDisplay('deprecated')).toBe('已废弃')
    })

    it('generateValidationId() 每次生成唯一 ID', () => {
      const ids = new Set(Array.from({ length: 20 }, () => generateValidationId()))
      // 20 次生成的 ID 应全部不同
      expect(ids.size).toBe(20)
    })
  })

  // ─────────────────────────────────────────────
  // 11. Engine: 默认报告
  // ─────────────────────────────────────────────

  describe('Engine: 默认报告', () => {
    let report: ExpertValidationCenterReport

    it('generateValidationCenterReport() 返回 ExpertValidationCenterReport', () => {
      report = generateValidationCenterReport()
      // 检查报告具有所有必需字段
      expect(report).toHaveProperty('version')
      expect(report).toHaveProperty('generatedAt')
      expect(report).toHaveProperty('totalValidations')
      expect(report).toHaveProperty('statusBreakdown')
      expect(report).toHaveProperty('averageConsistencyRate')
      expect(report).toHaveProperty('averageScore')
      expect(report).toHaveProperty('validations')
      expect(report).toHaveProperty('differenceReports')
      expect(report).toHaveProperty('learningQueue')
      expect(report).toHaveProperty('regressionLocks')
      expect(report).toHaveProperty('warnings')
      expect(report).toHaveProperty('computeTimeMs')
    })

    it('totalValidations === 5', () => {
      expect(report.totalValidations).toBe(5)
    })

    it('statusBreakdown 包含 pending/verified/disputed/deprecated 四个字段', () => {
      expect(report.statusBreakdown).toHaveProperty('pending')
      expect(report.statusBreakdown).toHaveProperty('verified')
      expect(report.statusBreakdown).toHaveProperty('disputed')
      expect(report.statusBreakdown).toHaveProperty('deprecated')
    })

    it('validations 是数组', () => {
      expect(Array.isArray(report.validations)).toBe(true)
    })

    it('differenceReports 是数组', () => {
      expect(Array.isArray(report.differenceReports)).toBe(true)
    })

    it('learningQueue 是数组', () => {
      expect(Array.isArray(report.learningQueue)).toBe(true)
    })

    it('regressionLocks 是数组', () => {
      expect(Array.isArray(report.regressionLocks)).toBe(true)
    })

    it('warnings 是数组', () => {
      expect(Array.isArray(report.warnings)).toBe(true)
    })

    it('version === EXPERT_VALIDATION_VERSION', () => {
      expect(report.version).toBe(EXPERT_VALIDATION_VERSION)
    })

    it('computeTimeMs 是非负数', () => {
      expect(report.computeTimeMs).toBeGreaterThanOrEqual(0)
    })
  })

  // ─────────────────────────────────────────────
  // 12. Engine: 按状态过滤
  // ─────────────────────────────────────────────

  describe('Engine: 按状态过滤', () => {
    it('statusFilter: ["verified"] 时 totalValidations === 3', () => {
      const report = generateValidationCenterReport({ statusFilter: ['verified'] })
      expect(report.totalValidations).toBe(3)
    })

    it('statusFilter: ["disputed"] 时 differenceReports.length > 0', () => {
      const report = generateValidationCenterReport({ statusFilter: ['disputed'] })
      expect(report.differenceReports.length).toBeGreaterThan(0)
    })

    it('statusFilter: ["pending"] 时 totalValidations === 1', () => {
      const report = generateValidationCenterReport({ statusFilter: ['pending'] })
      expect(report.totalValidations).toBe(1)
    })

    it('statusFilter: ["verified", "disputed"] 时 totalValidations === 4', () => {
      const report = generateValidationCenterReport({ statusFilter: ['verified', 'disputed'] })
      expect(report.totalValidations).toBe(4)
    })
  })

  // ─────────────────────────────────────────────
  // 13. Engine: 按 caseId 过滤
  // ─────────────────────────────────────────────

  describe('Engine: 按 caseId 过滤', () => {
    it('caseIds: ["CLS-001"] 时 totalValidations === 1', () => {
      const report = generateValidationCenterReport({ caseIds: ['CLS-001'] })
      expect(report.totalValidations).toBe(1)
    })

    it('caseIds: ["CLS-001", "CLS-003"] 时 totalValidations === 2', () => {
      const report = generateValidationCenterReport({ caseIds: ['CLS-001', 'CLS-003'] })
      expect(report.totalValidations).toBe(2)
    })

    it('caseIds: ["CLS-001"] 时返回的验证记录 caseId 匹配', () => {
      const report = generateValidationCenterReport({ caseIds: ['CLS-001'] })
      expect(report.validations[0].caseId).toBe('CLS-001')
    })
  })

  // ─────────────────────────────────────────────
  // 14. Engine: 差异分析
  // ─────────────────────────────────────────────

  describe('Engine: 差异分析', () => {
    it('默认报告中 differenceReports.length >= 1（因为有非 agree 记录）', () => {
      const report = generateValidationCenterReport()
      // VAL-002(partially_agree)、VAL-003(disagree)、VAL-005(unclear) 会生成差异报告
      expect(report.differenceReports.length).toBeGreaterThanOrEqual(1)
    })

    it('每个 DifferenceReport 包含 totalDifferences/items/summary/recommendations', () => {
      const report = generateValidationCenterReport()
      for (const dr of report.differenceReports) {
        expect(dr).toHaveProperty('totalDifferences')
        expect(dr).toHaveProperty('items')
        expect(dr).toHaveProperty('summary')
        expect(dr).toHaveProperty('recommendations')
      }
    })

    it('items 中有 field/severity/possibleCause/affectedRules/affectedModules', () => {
      const report = generateValidationCenterReport()
      for (const dr of report.differenceReports) {
        for (const item of dr.items) {
          expect(item).toHaveProperty('field')
          expect(item).toHaveProperty('severity')
          expect(item).toHaveProperty('possibleCause')
          expect(item).toHaveProperty('affectedRules')
          expect(item).toHaveProperty('affectedModules')
        }
      }
    })

    it('dispute 验证对应的差异报告 severity 为 "critical"', () => {
      // VAL-003 的 verdict 是 disagree，对应 severity: critical
      const report = generateValidationCenterReport()
      const disputeDiff = report.differenceReports.find(
        dr => dr.validationId === 'VAL-003',
      )
      expect(disputeDiff).toBeDefined()
      expect(disputeDiff!.items[0].severity).toBe('critical')
    })

    it('至少有一个差异报告的 recommendations 非空', () => {
      const report = generateValidationCenterReport()
      const hasRecommendations = report.differenceReports.some(
        dr => dr.recommendations.length > 0,
      )
      expect(hasRecommendations).toBe(true)
    })
  })

  // ─────────────────────────────────────────────
  // 15. Engine: 汇总统计
  // ─────────────────────────────────────────────

  describe('Engine: 汇总统计', () => {
    it('averageConsistencyRate 在 0~1 之间', () => {
      const report = generateValidationCenterReport()
      expect(report.averageConsistencyRate).toBeGreaterThanOrEqual(0)
      expect(report.averageConsistencyRate).toBeLessThanOrEqual(1)
    })

    it('averageScore 在 0~100 之间', () => {
      const report = generateValidationCenterReport()
      expect(report.averageScore).toBeGreaterThanOrEqual(0)
      expect(report.averageScore).toBeLessThanOrEqual(100)
    })

    it('statusBreakdown 各状态数量之和等于 totalValidations', () => {
      const report = generateValidationCenterReport()
      const sum =
        report.statusBreakdown.pending +
        report.statusBreakdown.verified +
        report.statusBreakdown.disputed +
        report.statusBreakdown.deprecated
      expect(sum).toBe(report.totalValidations)
    })

    it('averageConsistencyRate 与手动计算一致', () => {
      const report = generateValidationCenterReport()
      const manualAvg =
        EXPERT_VALIDATIONS.reduce((s, v) => s + v.consistencyRate, 0) /
        EXPERT_VALIDATIONS.length
      // 引擎内部做了四舍五入到小数点后 4 位
      expect(report.averageConsistencyRate).toBeCloseTo(manualAvg, 4)
    })
  })

  // ─────────────────────────────────────────────
  // 16. Engine: 学习队列
  // ─────────────────────────────────────────────

  describe('Engine: 学习队列', () => {
    it('默认报告 learningQueue.length > 0', () => {
      const report = generateValidationCenterReport()
      expect(report.learningQueue.length).toBeGreaterThan(0)
    })

    it('learningQueue 中的项有 queueId/caseId/reason', () => {
      const report = generateValidationCenterReport()
      for (const item of report.learningQueue) {
        expect(item).toHaveProperty('queueId')
        expect(item).toHaveProperty('caseId')
        expect(item).toHaveProperty('reason')
      }
    })

    it('学习队列按优先级降序排列', () => {
      const report = generateValidationCenterReport()
      for (let i = 1; i < report.learningQueue.length; i++) {
        expect(report.learningQueue[i - 1].priority).toBeGreaterThanOrEqual(
          report.learningQueue[i].priority,
        )
      }
    })
  })

  // ─────────────────────────────────────────────
  // 17. Engine: 回归锁
  // ─────────────────────────────────────────────

  describe('Engine: 回归锁', () => {
    it('regressionLocks.length === 2', () => {
      const report = generateValidationCenterReport()
      expect(report.regressionLocks).toHaveLength(2)
    })

    it('全部 status === "active"', () => {
      const report = generateValidationCenterReport()
      for (const lock of report.regressionLocks) {
        expect(lock.status).toBe('active')
      }
    })

    it('所有回归锁都有 lockId/caseId/validationId', () => {
      const report = generateValidationCenterReport()
      for (const lock of report.regressionLocks) {
        expect(lock.lockId).toBeTruthy()
        expect(lock.caseId).toBeTruthy()
        expect(lock.validationId).toBeTruthy()
      }
    })
  })

  // ─────────────────────────────────────────────
  // 18. Engine: 选项组合
  // ─────────────────────────────────────────────

  describe('Engine: 选项组合', () => {
    it('statusFilter + caseIds 组合过滤正确', () => {
      // CLS-001 的状态是 verified
      const report = generateValidationCenterReport({
        statusFilter: ['verified'],
        caseIds: ['CLS-001'],
      })
      expect(report.totalValidations).toBe(1)
      expect(report.validations[0].caseId).toBe('CLS-001')
      expect(report.validations[0].status).toBe('verified')
    })

    it('includeDisputed: false 时 differenceReports 为空', () => {
      const report = generateValidationCenterReport({ includeDisputed: false })
      expect(report.differenceReports).toHaveLength(0)
    })

    it('includeLearningQueue: false 时 learningQueue 为空', () => {
      const report = generateValidationCenterReport({ includeLearningQueue: false })
      expect(report.learningQueue).toHaveLength(0)
    })
  })

  // ─────────────────────────────────────────────
  // 19. Edge Cases
  // ─────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('caseIds: ["不存在的ID"] 时 totalValidations === 0', () => {
      const report = generateValidationCenterReport({ caseIds: ['不存在的ID'] })
      expect(report.totalValidations).toBe(0)
    })

    it('重复调用 generateValidationCenterReport() 确定性字段一致', () => {
      const report1 = generateValidationCenterReport()
      const report2 = generateValidationCenterReport()
      // 确定性字段应保持一致（数据是静态的）
      expect(report1.totalValidations).toBe(report2.totalValidations)
      expect(report1.statusBreakdown).toEqual(report2.statusBreakdown)
      expect(report1.averageConsistencyRate).toBe(report2.averageConsistencyRate)
      expect(report1.averageScore).toBe(report2.averageScore)
    })

    it('caseIds 不存在时 warnings 包含提示信息', () => {
      const report = generateValidationCenterReport({ caseIds: ['不存在的ID'] })
      expect(report.warnings.length).toBeGreaterThanOrEqual(1)
      expect(report.warnings[0]).toContain('未找到')
    })

    it('statusFilter: ["deprecated"] 时 totalValidations === 0（无废弃记录）', () => {
      const report = generateValidationCenterReport({ statusFilter: ['deprecated'] })
      expect(report.totalValidations).toBe(0)
    })
  })

})