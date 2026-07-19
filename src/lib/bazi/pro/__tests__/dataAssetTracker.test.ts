import { describe, test, expect, beforeEach, vi } from 'vitest'
import type { AssetMilestone, AssetGrowthRecord, DataAssetSnapshot, PhaseCompletionCriteria, AssetType, GrowthTrend } from '../dataAssetTrackerTypes'
import {
  DATA_ASSET_TRACKER_ENGINE_VERSION,
  createMilestone,
  getMilestoneById,
  getMilestonesByAssetType,
  updateMilestone,
  completeMilestone,
  deleteMilestone,
  getAllMilestones,
  recordGrowth,
  getGrowthRecords,
  getGrowthRecordsByDate,
  getAssetTrend,
  takeSnapshot,
  evaluatePhaseCompletion,
  isPhaseComplete,
  seedDefaultMilestones,
  getAssetStats,
  getProgressReport,
  resetStore,
} from '../dataAssetTrackerEngine'

describe('DataAssetTracker', () => {
  beforeEach(() => {
    resetStore()
  })

  // 1. 版本号正确
  test('版本号应为 1.0.0', () => {
    expect(DATA_ASSET_TRACKER_ENGINE_VERSION).toBe('1.0.0')
  })

  // 2. seedDefaultMilestones
  describe('seedDefaultMilestones', () => {
    test('返回6个预置里程碑', () => {
      const milestones = seedDefaultMilestones()
      expect(milestones).toHaveLength(6)
    })

    test('预置里程碑字段正确', () => {
      const milestones = seedDefaultMilestones()
      const titles = milestones.map(m => m.title)
      expect(titles).toContain('案例库积累')
      expect(titles).toContain('知识库扩充')
      expect(titles).toContain('专家审核案例')
      expect(titles).toContain('有效用户反馈')
      expect(titles).toContain('真实报告生成')
      expect(titles).toContain('真实用户测试')

      const caseMilestone = milestones.find(m => m.title === '案例库积累')!
      expect(caseMilestone.assetType).toBe('case_library')
      expect(caseMilestone.currentValue).toBe(25)
      expect(caseMilestone.targetValue).toBe(1000)
      expect(caseMilestone.status).toBe('in_progress')
      expect(caseMilestone.deadline).toBeNull()
      expect(caseMilestone.completedAt).toBeNull()
      expect(caseMilestone.id).toBeTruthy()
      expect(caseMilestone.createdAt).toBeGreaterThan(0)

      const kbMilestone = milestones.find(m => m.title === '知识库扩充')!
      expect(kbMilestone.currentValue).toBe(76)
      expect(kbMilestone.targetValue).toBe(500)

      const expertMilestone = milestones.find(m => m.title === '专家审核案例')!
      expect(expertMilestone.currentValue).toBe(0)
      expect(expertMilestone.targetValue).toBe(50)
      expect(expertMilestone.status).toBe('not_started')
    })
  })

  // 3. createMilestone
  describe('createMilestone', () => {
    test('创建里程碑并存储，自动生成id', () => {
      const m = createMilestone({
        assetType: 'case_library',
        title: '测试里程碑',
        currentValue: 10,
        targetValue: 100,
        unit: '例',
        status: 'in_progress',
        deadline: null,
      })
      expect(m.id).toBeTruthy()
      expect(m.title).toBe('测试里程碑')
      expect(m.currentValue).toBe(10)
      expect(m.targetValue).toBe(100)
      expect(m.createdAt).toBeGreaterThan(0)
      expect(m.completedAt).toBeNull()

      // 确认已存储
      const found = getMilestoneById(m.id)
      expect(found).toBeDefined()
      expect(found!.title).toBe('测试里程碑')
    })
  })

  // 4. getMilestoneById
  describe('getMilestoneById', () => {
    test('能找到已存在的里程碑', () => {
      const m = createMilestone({
        assetType: 'knowledge_base',
        title: '可找到的',
        currentValue: 5,
        targetValue: 50,
        unit: '条',
        status: 'not_started',
        deadline: null,
      })
      const found = getMilestoneById(m.id)
      expect(found).toBeDefined()
      expect(found!.id).toBe(m.id)
    })

    test('找不到不存在的里程碑返回 undefined', () => {
      const found = getMilestoneById('non_existent_id')
      expect(found).toBeUndefined()
    })
  })

  // 5. getMilestonesByAssetType
  test('按类型过滤里程碑', () => {
    createMilestone({
      assetType: 'case_library',
      title: '案例1',
      currentValue: 10,
      targetValue: 100,
      unit: '例',
      status: 'in_progress',
      deadline: null,
    })
    createMilestone({
      assetType: 'case_library',
      title: '案例2',
      currentValue: 20,
      targetValue: 200,
      unit: '例',
      status: 'in_progress',
      deadline: null,
    })
    createMilestone({
      assetType: 'knowledge_base',
      title: '知识1',
      currentValue: 5,
      targetValue: 50,
      unit: '条',
      status: 'not_started',
      deadline: null,
    })

    const caseMilestones = getMilestonesByAssetType('case_library')
    expect(caseMilestones).toHaveLength(2)

    const kbMilestones = getMilestonesByAssetType('knowledge_base')
    expect(kbMilestones).toHaveLength(1)

    const empty = getMilestonesByAssetType('expert_validation')
    expect(empty).toHaveLength(0)
  })

  // 6. updateMilestone
  test('更新里程碑的 currentValue 和 status', () => {
    const m = createMilestone({
      assetType: 'case_library',
      title: '待更新',
      currentValue: 10,
      targetValue: 100,
      unit: '例',
      status: 'in_progress',
      deadline: null,
    })
    const updated = updateMilestone(m.id, {
      currentValue: 50,
      status: 'in_progress',
    })
    expect(updated).toBeDefined()
    expect(updated!.currentValue).toBe(50)
    expect(updated!.status).toBe('in_progress')
    expect(updated!.title).toBe('待更新') // 未修改的字段保持不变

    // 更新不存在的里程碑
    const notFound = updateMilestone('nonexistent', { currentValue: 99 })
    expect(notFound).toBeUndefined()
  })

  // 7. completeMilestone
  test('完成里程碑后 status 变 completed，completedAt 非 null', () => {
    const m = createMilestone({
      assetType: 'case_library',
      title: '待完成',
      currentValue: 100,
      targetValue: 100,
      unit: '例',
      status: 'in_progress',
      deadline: null,
    })
    expect(m.completedAt).toBeNull()

    const completed = completeMilestone(m.id)
    expect(completed).toBeDefined()
    expect(completed!.status).toBe('completed')
    expect(completed!.completedAt).not.toBeNull()
    expect(completed!.completedAt).toBeGreaterThan(0)

    // 不存在的 id
    const notFound = completeMilestone('nonexistent')
    expect(notFound).toBeUndefined()
  })

  // 8. deleteMilestone
  test('删除里程碑返回 true，再删返回 false', () => {
    const m = createMilestone({
      assetType: 'case_library',
      title: '待删除',
      currentValue: 10,
      targetValue: 100,
      unit: '例',
      status: 'in_progress',
      deadline: null,
    })
    expect(deleteMilestone(m.id)).toBe(true)
    expect(deleteMilestone(m.id)).toBe(false)
    expect(getMilestoneById(m.id)).toBeUndefined()
  })

  // 9. getAllMilestones
  test('返回全部里程碑', () => {
    createMilestone({
      assetType: 'case_library',
      title: 'A',
      currentValue: 10,
      targetValue: 100,
      unit: '例',
      status: 'in_progress',
      deadline: null,
    })
    createMilestone({
      assetType: 'knowledge_base',
      title: 'B',
      currentValue: 5,
      targetValue: 50,
      unit: '条',
      status: 'not_started',
      deadline: null,
    })
    const all = getAllMilestones()
    expect(all).toHaveLength(2)
  })

  // 10. recordGrowth
  describe('recordGrowth', () => {
    test('创建增长记录，自动计算 growth 和 growthRate', () => {
      const r = recordGrowth({
        assetType: 'case_library',
        date: '2026-01-15',
        startValue: 100,
        endValue: 130,
        source: 'user_submission',
      })
      expect(r.id).toBeTruthy()
      expect(r.growth).toBe(30)
      expect(r.growthRate).toBe(30) // (30/100)*100
      expect(r.assetType).toBe('case_library')
    })

    test('startValue 为 0 且 endValue > 0 时 growthRate 为 100', () => {
      const r = recordGrowth({
        assetType: 'knowledge_base',
        date: '2026-01-15',
        startValue: 0,
        endValue: 10,
        source: 'ai_generation',
      })
      expect(r.growth).toBe(10)
      expect(r.growthRate).toBe(100)
    })

    test('startValue 为 0 且 endValue 也为 0 时 growthRate 为 0', () => {
      const r = recordGrowth({
        assetType: 'knowledge_base',
        date: '2026-01-15',
        startValue: 0,
        endValue: 0,
        source: 'manual',
      })
      expect(r.growth).toBe(0)
      expect(r.growthRate).toBe(0)
    })
  })

  // 11. getGrowthRecords
  test('按类型过滤和日期范围过滤增长记录', () => {
    recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 10, source: 'user_submission' })
    recordGrowth({ assetType: 'case_library', date: '2026-01-15', startValue: 10, endValue: 25, source: 'user_submission' })
    recordGrowth({ assetType: 'case_library', date: '2026-02-01', startValue: 25, endValue: 50, source: 'expert_review' })
    recordGrowth({ assetType: 'knowledge_base', date: '2026-01-15', startValue: 0, endValue: 5, source: 'ai_generation' })

    const caseRecords = getGrowthRecords('case_library')
    expect(caseRecords).toHaveLength(3)

    const kbRecords = getGrowthRecords('knowledge_base')
    expect(kbRecords).toHaveLength(1)

    // 日期范围过滤
    const filtered = getGrowthRecords('case_library', '2026-01-10', '2026-01-20')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].date).toBe('2026-01-15')

    // 只有起始日期
    const fromStart = getGrowthRecords('case_library', '2026-01-15')
    expect(fromStart).toHaveLength(2)
  })

  // 12. getGrowthRecordsByDate
  test('按日期过滤增长记录', () => {
    recordGrowth({ assetType: 'case_library', date: '2026-01-15', startValue: 0, endValue: 10, source: 'user_submission' })
    recordGrowth({ assetType: 'knowledge_base', date: '2026-01-15', startValue: 0, endValue: 5, source: 'ai_generation' })
    recordGrowth({ assetType: 'case_library', date: '2026-02-01', startValue: 10, endValue: 20, source: 'expert_review' })

    const records = getGrowthRecordsByDate('2026-01-15')
    expect(records).toHaveLength(2)

    const empty = getGrowthRecordsByDate('2026-03-01')
    expect(empty).toHaveLength(0)
  })

  // 13. getAssetTrend
  describe('getAssetTrend', () => {
    test('少于3条记录时返回 stagnant', () => {
      recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 10, source: 'user_submission' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-02', startValue: 10, endValue: 20, source: 'user_submission' })
      expect(getAssetTrend('case_library')).toBe('stagnant')
    })

    test('递增增长返回 accelerating', () => {
      recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 5, source: 'manual' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-02', startValue: 5, endValue: 15, source: 'manual' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-03', startValue: 15, endValue: 30, source: 'manual' })
      // growths: 5, 10, 15 => accelerating
      expect(getAssetTrend('case_library')).toBe('accelerating')
    })

    test('平稳增长返回 steady', () => {
      recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 10, source: 'manual' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-02', startValue: 10, endValue: 20, source: 'manual' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-03', startValue: 20, endValue: 30, source: 'manual' })
      // growths: 10, 10, 10 => steady
      expect(getAssetTrend('case_library')).toBe('steady')
    })

    test('递减增长返回 decelerating', () => {
      recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 30, source: 'manual' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-02', startValue: 30, endValue: 50, source: 'manual' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-03', startValue: 50, endValue: 60, source: 'manual' })
      // growths: 30, 20, 10 => decelerating
      expect(getAssetTrend('case_library')).toBe('decelerating')
    })

    test('全部零增长返回 stagnant', () => {
      recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 0, source: 'manual' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-02', startValue: 0, endValue: 0, source: 'manual' })
      recordGrowth({ assetType: 'case_library', date: '2026-01-03', startValue: 0, endValue: 0, source: 'manual' })
      expect(getAssetTrend('case_library')).toBe('stagnant')
    })
  })

  // 14. takeSnapshot — 完整 snapshot
  test('传入完整 sources 返回完整 snapshot', () => {
    const snapshot = takeSnapshot({
      caseLibraryTotal: 100,
      caseClassic: 30,
      caseAnonymous: 20,
      caseRegression: 10,
      caseExpertVerified: 15,
      caseEdge: 5,
      caseConflict: 2,
      knowledgeBaseTotal: 200,
      knowledgeBaseCategories: 10,
      knowledgeBaseSources: 5,
      knowledgeBaseAvgConfidence: 0.85,
      expertValidationTotalReviews: 10,
      expertValidationAgreementRate: 90,
      expertValidationUniqueExperts: 3,
      expertValidationHighConfidence: 8,
      expertValidationDisputeCases: 1,
      userFeedbackTotal: 50,
      userFeedbackAvgSatisfaction: 4.2,
      userFeedbackEffective: 30,
      reportGenerationTotal: 80,
      reportGenerationUniqueUsers: 20,
    })

    expect(snapshot.timestamp).toBeGreaterThan(0)
    expect(snapshot.caseLibrary.total).toBe(100)
    expect(snapshot.caseLibrary.classic).toBe(30)
    expect(snapshot.caseLibrary.target).toBe(1000)
    expect(snapshot.knowledgeBase.total).toBe(200)
    expect(snapshot.knowledgeBase.categories).toBe(10)
    expect(snapshot.knowledgeBase.avgConfidence).toBe(0.85)
    expect(snapshot.knowledgeBase.target).toBe(500)
    expect(snapshot.expertValidation.totalReviews).toBe(10)
    expect(snapshot.expertValidation.agreementRate).toBe(90)
    expect(snapshot.expertValidation.targetReviews).toBe(50)
    expect(snapshot.userFeedback.totalFeedbacks).toBe(50)
    expect(snapshot.userFeedback.avgSatisfaction).toBe(4.2)
    expect(snapshot.userFeedback.effectiveFeedbacks).toBe(30)
    expect(snapshot.userFeedback.targetFeedbacks).toBe(100)
    expect(snapshot.userFeedback.targetSatisfaction).toBe(4.0)
    expect(snapshot.reportGeneration.totalReports).toBe(80)
    expect(snapshot.reportGeneration.targetReports).toBe(1000)
    expect(snapshot.reportGeneration.uniqueUsers).toBe(20)
    expect(snapshot.reportGeneration.targetUsers).toBe(300)
  })

  // 15. takeSnapshot — milestone 字段自动填充
  test('takeSnapshot 的 milestones 字段包含当前所有里程碑', () => {
    seedDefaultMilestones()
    const snapshot = takeSnapshot({
      caseLibraryTotal: 25,
      caseClassic: 0,
      caseAnonymous: 0,
      caseRegression: 0,
      caseExpertVerified: 0,
      caseEdge: 0,
      caseConflict: 0,
      knowledgeBaseTotal: 76,
      knowledgeBaseCategories: 0,
      knowledgeBaseSources: 0,
      knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 0,
      expertValidationAgreementRate: 0,
      expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0,
      expertValidationDisputeCases: 0,
      userFeedbackTotal: 0,
      userFeedbackAvgSatisfaction: 0,
      userFeedbackEffective: 0,
      reportGenerationTotal: 0,
      reportGenerationUniqueUsers: 0,
    })
    expect(snapshot.milestones).toHaveLength(6)
    expect(snapshot.milestones[0].title).toBeTruthy()
  })

  // 16. takeSnapshot — completionPercentage 正确计算
  test('completionPercentage 正确计算', () => {
    // 0/6 met => 0%
    const snap0 = takeSnapshot({
      caseLibraryTotal: 0, caseClassic: 0, caseAnonymous: 0, caseRegression: 0,
      caseExpertVerified: 0, caseEdge: 0, caseConflict: 0,
      knowledgeBaseTotal: 0, knowledgeBaseCategories: 0, knowledgeBaseSources: 0, knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 0, expertValidationAgreementRate: 0, expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0, expertValidationDisputeCases: 0,
      userFeedbackTotal: 0, userFeedbackAvgSatisfaction: 0, userFeedbackEffective: 0,
      reportGenerationTotal: 0, reportGenerationUniqueUsers: 0,
    })
    expect(snap0.completionPercentage).toBe(0)

    // 1/6 met => 17%
    const snap1 = takeSnapshot({
      caseLibraryTotal: 1000, caseClassic: 0, caseAnonymous: 0, caseRegression: 0,
      caseExpertVerified: 0, caseEdge: 0, caseConflict: 0,
      knowledgeBaseTotal: 0, knowledgeBaseCategories: 0, knowledgeBaseSources: 0, knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 0, expertValidationAgreementRate: 0, expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0, expertValidationDisputeCases: 0,
      userFeedbackTotal: 0, userFeedbackAvgSatisfaction: 0, userFeedbackEffective: 0,
      reportGenerationTotal: 0, reportGenerationUniqueUsers: 0,
    })
    expect(snap1.completionPercentage).toBe(17)

    // 6/6 met => 100%
    const snap6 = takeSnapshot({
      caseLibraryTotal: 1000, caseClassic: 0, caseAnonymous: 0, caseRegression: 0,
      caseExpertVerified: 0, caseEdge: 0, caseConflict: 0,
      knowledgeBaseTotal: 500, knowledgeBaseCategories: 0, knowledgeBaseSources: 0, knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 50, expertValidationAgreementRate: 0, expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0, expertValidationDisputeCases: 0,
      userFeedbackTotal: 0, userFeedbackAvgSatisfaction: 0, userFeedbackEffective: 100,
      reportGenerationTotal: 1000, reportGenerationUniqueUsers: 300,
    })
    expect(snap6.completionPercentage).toBe(100)
  })

  // 17. takeSnapshot — phaseCompleted 判定
  test('phaseCompleted 在全部达标时为 true，否则为 false', () => {
    const snapFalse = takeSnapshot({
      caseLibraryTotal: 1000, caseClassic: 0, caseAnonymous: 0, caseRegression: 0,
      caseExpertVerified: 0, caseEdge: 0, caseConflict: 0,
      knowledgeBaseTotal: 500, knowledgeBaseCategories: 0, knowledgeBaseSources: 0, knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 50, expertValidationAgreementRate: 0, expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0, expertValidationDisputeCases: 0,
      userFeedbackTotal: 0, userFeedbackAvgSatisfaction: 0, userFeedbackEffective: 99,
      reportGenerationTotal: 1000, reportGenerationUniqueUsers: 300,
    })
    expect(snapFalse.phaseCompleted).toBe(false)

    const snapTrue = takeSnapshot({
      caseLibraryTotal: 1000, caseClassic: 0, caseAnonymous: 0, caseRegression: 0,
      caseExpertVerified: 0, caseEdge: 0, caseConflict: 0,
      knowledgeBaseTotal: 500, knowledgeBaseCategories: 0, knowledgeBaseSources: 0, knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 50, expertValidationAgreementRate: 0, expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0, expertValidationDisputeCases: 0,
      userFeedbackTotal: 0, userFeedbackAvgSatisfaction: 0, userFeedbackEffective: 100,
      reportGenerationTotal: 1000, reportGenerationUniqueUsers: 300,
    })
    expect(snapTrue.phaseCompleted).toBe(true)
  })

  // 18. evaluatePhaseCompletion — 返回 6 条
  test('evaluatePhaseCompletion 返回 6 条 PhaseCompletionCriteria', () => {
    const snapshot = takeSnapshot({
      caseLibraryTotal: 100,
      caseClassic: 0, caseAnonymous: 0, caseRegression: 0,
      caseExpertVerified: 0, caseEdge: 0, caseConflict: 0,
      knowledgeBaseTotal: 50, knowledgeBaseCategories: 0, knowledgeBaseSources: 0, knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 10, expertValidationAgreementRate: 0, expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0, expertValidationDisputeCases: 0,
      userFeedbackTotal: 0, userFeedbackAvgSatisfaction: 0, userFeedbackEffective: 20,
      reportGenerationTotal: 30, reportGenerationUniqueUsers: 10,
    })
    const criteria = evaluatePhaseCompletion(snapshot)
    expect(criteria).toHaveLength(6)
    expect(criteria[0].criteriaId).toBe('case_library')
    expect(criteria[1].criteriaId).toBe('knowledge_base')
    expect(criteria[2].criteriaId).toBe('expert_validation')
    expect(criteria[3].criteriaId).toBe('user_feedback')
    expect(criteria[4].criteriaId).toBe('report_generation')
    expect(criteria[5].criteriaId).toBe('real_user_test')
  })

  // 19. evaluatePhaseCompletion — met 字段正确判定
  test('met 字段在 current >= target 时为 true', () => {
    const snapshot = takeSnapshot({
      caseLibraryTotal: 1000, caseClassic: 0, caseAnonymous: 0, caseRegression: 0,
      caseExpertVerified: 0, caseEdge: 0, caseConflict: 0,
      knowledgeBaseTotal: 200, knowledgeBaseCategories: 0, knowledgeBaseSources: 0, knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 50, expertValidationAgreementRate: 0, expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0, expertValidationDisputeCases: 0,
      userFeedbackTotal: 0, userFeedbackAvgSatisfaction: 0, userFeedbackEffective: 50,
      reportGenerationTotal: 500, reportGenerationUniqueUsers: 150,
    })
    const criteria = evaluatePhaseCompletion(snapshot)
    expect(criteria[0].met).toBe(true)   // 1000 >= 1000
    expect(criteria[1].met).toBe(false)  // 200 < 500
    expect(criteria[2].met).toBe(true)   // 50 >= 50
    expect(criteria[3].met).toBe(false)  // 50 < 100
    expect(criteria[4].met).toBe(false)  // 500 < 1000
    expect(criteria[5].met).toBe(false)  // 150 < 300
  })

  // 20. isPhaseComplete — 全部 met 时 true
  test('全部 met 时 isPhaseComplete 返回 true', () => {
    const criteria: PhaseCompletionCriteria[] = [
      { criteriaId: 'a', title: 'A', currentValue: 100, targetValue: 100, met: true, unit: '例' },
      { criteriaId: 'b', title: 'B', currentValue: 200, targetValue: 200, met: true, unit: '条' },
    ]
    expect(isPhaseComplete(criteria)).toBe(true)
  })

  // 21. isPhaseComplete — 部分未 met 时 false
  test('部分未 met 时 isPhaseComplete 返回 false', () => {
    const criteria: PhaseCompletionCriteria[] = [
      { criteriaId: 'a', title: 'A', currentValue: 100, targetValue: 100, met: true, unit: '例' },
      { criteriaId: 'b', title: 'B', currentValue: 100, targetValue: 200, met: false, unit: '条' },
    ]
    expect(isPhaseComplete(criteria)).toBe(false)
  })

  // 22. getAssetStats
  test('getAssetStats 返回正确统计', () => {
    seedDefaultMilestones()
    recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 10, source: 'manual' })
    recordGrowth({ assetType: 'case_library', date: '2026-01-02', startValue: 10, endValue: 20, source: 'manual' })

    const stats = getAssetStats()
    expect(stats.totalMilestones).toBe(6)
    expect(stats.completedMilestones).toBe(0)
    expect(stats.inProgress).toBe(2) // 案例库和知识库是 in_progress
    expect(stats.growthRecords).toBe(2)
    expect(stats.trendSummary).toHaveProperty('case_library')
    expect(stats.trendSummary).toHaveProperty('knowledge_base')
    expect(stats.trendSummary).toHaveProperty('expert_validation')
    expect(stats.trendSummary).toHaveProperty('user_feedback')
    expect(stats.trendSummary).toHaveProperty('report_generation')
  })

  // 23. getProgressReport
  test('getProgressReport 返回完整结构', () => {
    seedDefaultMilestones()
    const report = getProgressReport()

    expect(report.assetSummary).toHaveProperty('caseLibrary')
    expect(report.assetSummary).toHaveProperty('knowledgeBase')
    expect(report.assetSummary).toHaveProperty('expertValidation')
    expect(report.assetSummary).toHaveProperty('userFeedback')
    expect(report.assetSummary).toHaveProperty('reportGeneration')
    expect(report.milestones).toHaveLength(6)
    expect(report.phaseCriteria).toHaveLength(6)
    expect(typeof report.overallProgress).toBe('number')

    // 预置数据：案例库 25, 知识库 76, 其余 0 => 0/6 met => 0%
    expect(report.overallProgress).toBe(0)
    expect(report.assetSummary.caseLibrary).toBe(25)
    expect(report.assetSummary.knowledgeBase).toBe(76)
  })

  // 24. resetStore
  test('resetStore 清空后里程碑和增长记录都为 0', () => {
    seedDefaultMilestones()
    recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 10, source: 'manual' })

    expect(getAllMilestones()).toHaveLength(6)
    expect(getGrowthRecords('case_library')).toHaveLength(1)

    resetStore()

    expect(getAllMilestones()).toHaveLength(0)
    expect(getGrowthRecords('case_library')).toHaveLength(0)
  })

  // 25. 多次调用 recordGrowth + getAssetTrend
  test('多次 recordGrowth 后 getAssetTrend 计算正确', () => {
    // 增长递增: 5, 10, 20 => growths: 5, 10, 20 => accelerating
    recordGrowth({ assetType: 'case_library', date: '2026-01-01', startValue: 0, endValue: 5, source: 'manual' })
    recordGrowth({ assetType: 'case_library', date: '2026-01-02', startValue: 5, endValue: 15, source: 'manual' })
    recordGrowth({ assetType: 'case_library', date: '2026-01-03', startValue: 15, endValue: 35, source: 'manual' })
    expect(getAssetTrend('case_library')).toBe('accelerating')

    resetStore()

    // 增长递减: 30, 20, 10 => growths: 30, 20, 10 => decelerating
    recordGrowth({ assetType: 'knowledge_base', date: '2026-01-01', startValue: 0, endValue: 30, source: 'manual' })
    recordGrowth({ assetType: 'knowledge_base', date: '2026-01-02', startValue: 30, endValue: 50, source: 'manual' })
    recordGrowth({ assetType: 'knowledge_base', date: '2026-01-03', startValue: 50, endValue: 60, source: 'manual' })
    expect(getAssetTrend('knowledge_base')).toBe('decelerating')
  })

  // 26. updateMilestone 后 takeSnapshot 反映最新数据
  test('updateMilestone 后 takeSnapshot 反映最新里程碑数据', () => {
    const m = createMilestone({
      assetType: 'case_library',
      title: '动态更新测试',
      currentValue: 500,
      targetValue: 1000,
      unit: '例',
      status: 'in_progress',
      deadline: null,
    })

    expect(m.currentValue).toBe(500)

    updateMilestone(m.id, { currentValue: 1000 })
    completeMilestone(m.id)

    const snapshot = takeSnapshot({
      caseLibraryTotal: 1000, caseClassic: 0, caseAnonymous: 0, caseRegression: 0,
      caseExpertVerified: 0, caseEdge: 0, caseConflict: 0,
      knowledgeBaseTotal: 500, knowledgeBaseCategories: 0, knowledgeBaseSources: 0, knowledgeBaseAvgConfidence: 0,
      expertValidationTotalReviews: 50, expertValidationAgreementRate: 0, expertValidationUniqueExperts: 0,
      expertValidationHighConfidence: 0, expertValidationDisputeCases: 0,
      userFeedbackTotal: 0, userFeedbackAvgSatisfaction: 0, userFeedbackEffective: 100,
      reportGenerationTotal: 1000, reportGenerationUniqueUsers: 300,
    })

    const updatedMilestone = snapshot.milestones.find(ms => ms.id === m.id)
    expect(updatedMilestone).toBeDefined()
    expect(updatedMilestone!.currentValue).toBe(1000)
    expect(updatedMilestone!.status).toBe('completed')
    expect(updatedMilestone!.completedAt).not.toBeNull()
  })
})