// Phase 6 Batch 3: P3 Data Asset Tracker — Engine

import type { AssetMilestone, AssetGrowthRecord, DataAssetSnapshot, PhaseCompletionCriteria, AssetType, MilestoneStatus, GrowthTrend } from './dataAssetTrackerTypes'
import { DATA_ASSET_TRACKER_VERSION } from './dataAssetTrackerTypes'

export const DATA_ASSET_TRACKER_ENGINE_VERSION = DATA_ASSET_TRACKER_VERSION

// --- Internal Storage ---

const milestonesMap = new Map<string, AssetMilestone>()
const growthRecordsMap = new Map<string, AssetGrowthRecord>()

let idCounter = 0
function generateId(): string {
  idCounter++
  return `dat_${Date.now()}_${idCounter}`
}

// --- Milestone CRUD ---

export function createMilestone(data: Omit<AssetMilestone, 'id' | 'createdAt' | 'completedAt'>): AssetMilestone {
  const now = Date.now()
  const milestone: AssetMilestone = {
    ...data,
    id: generateId(),
    createdAt: now,
    completedAt: null,
  }
  milestonesMap.set(milestone.id, milestone)
  return milestone
}

export function getMilestoneById(id: string): AssetMilestone | undefined {
  return milestonesMap.get(id)
}

export function getMilestonesByAssetType(type: AssetType): AssetMilestone[] {
  const result: AssetMilestone[] = []
  for (const m of milestonesMap.values()) {
    if (m.assetType === type) {
      result.push(m)
    }
  }
  return result
}

export function updateMilestone(id: string, updates: Partial<Pick<AssetMilestone, 'title' | 'currentValue' | 'targetValue' | 'unit' | 'status' | 'deadline'>>): AssetMilestone | undefined {
  const existing = milestonesMap.get(id)
  if (!existing) return undefined
  const updated: AssetMilestone = { ...existing, ...updates }
  milestonesMap.set(id, updated)
  return updated
}

export function completeMilestone(id: string): AssetMilestone | undefined {
  const existing = milestonesMap.get(id)
  if (!existing) return undefined
  const completed: AssetMilestone = {
    ...existing,
    status: 'completed' as MilestoneStatus,
    completedAt: Date.now(),
  }
  milestonesMap.set(id, completed)
  return completed
}

export function deleteMilestone(id: string): boolean {
  return milestonesMap.delete(id)
}

export function getAllMilestones(): AssetMilestone[] {
  return Array.from(milestonesMap.values())
}

// --- Growth Records CRUD ---

export function recordGrowth(data: Omit<AssetGrowthRecord, 'id' | 'growth' | 'growthRate'>): AssetGrowthRecord {
  const growth = data.endValue - data.startValue
  const growthRate = data.startValue === 0
    ? (data.endValue > 0 ? 100 : 0)
    : (growth / data.startValue) * 100
  const record: AssetGrowthRecord = {
    ...data,
    id: generateId(),
    growth,
    growthRate,
  }
  growthRecordsMap.set(record.id, record)
  return record
}

export function getGrowthRecords(assetType: AssetType, startDate?: string, endDate?: string): AssetGrowthRecord[] {
  const result: AssetGrowthRecord[] = []
  for (const r of growthRecordsMap.values()) {
    if (r.assetType !== assetType) continue
    if (startDate && r.date < startDate) continue
    if (endDate && r.date > endDate) continue
    result.push(r)
  }
  return result
}

export function getGrowthRecordsByDate(date: string): AssetGrowthRecord[] {
  const result: AssetGrowthRecord[] = []
  for (const r of growthRecordsMap.values()) {
    if (r.date === date) {
      result.push(r)
    }
  }
  return result
}

export function getAssetTrend(assetType: AssetType): GrowthTrend {
  const records = getGrowthRecords(assetType)
  if (records.length < 3) return 'stagnant'

  // Sort by date ascending, take last 3
  const sorted = records.slice().sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-3)
  const growths = recent.map(r => r.growth)

  // Check if all zero
  const allZero = growths.every(g => g === 0)
  if (allZero) return 'stagnant'

  // Check if strictly increasing
  const isAccelerating = growths[0] < growths[1] && growths[1] < growths[2]
  if (isAccelerating) return 'accelerating'

  // Check if strictly decreasing
  const isDecelerating = growths[0] > growths[1] && growths[1] > growths[2]
  if (isDecelerating) return 'decelerating'

  return 'steady'
}

// --- Snapshot & Statistics ---

export function takeSnapshot(sources: {
  caseLibraryTotal: number
  caseClassic: number
  caseAnonymous: number
  caseRegression: number
  caseExpertVerified: number
  caseEdge: number
  caseConflict: number
  knowledgeBaseTotal: number
  knowledgeBaseCategories: number
  knowledgeBaseSources: number
  knowledgeBaseAvgConfidence: number
  expertValidationTotalReviews: number
  expertValidationAgreementRate: number
  expertValidationUniqueExperts: number
  expertValidationHighConfidence: number
  expertValidationDisputeCases: number
  userFeedbackTotal: number
  userFeedbackAvgSatisfaction: number
  userFeedbackEffective: number
  reportGenerationTotal: number
  reportGenerationUniqueUsers: number
}): DataAssetSnapshot {
  const milestones = getAllMilestones()
  const criteria = evaluatePhaseCompletionFromSources(sources)

  const completedCount = criteria.filter(c => c.met).length
  const completionPercentage = Math.round((completedCount / criteria.length) * 100)
  const phaseCompleted = completedCount === criteria.length

  return {
    timestamp: Date.now(),
    caseLibrary: {
      total: sources.caseLibraryTotal,
      classic: sources.caseClassic,
      anonymous: sources.caseAnonymous,
      regression: sources.caseRegression,
      expertVerified: sources.caseExpertVerified,
      edge: sources.caseEdge,
      conflict: sources.caseConflict,
      target: 1000,
    },
    knowledgeBase: {
      total: sources.knowledgeBaseTotal,
      categories: sources.knowledgeBaseCategories,
      sources: sources.knowledgeBaseSources,
      avgConfidence: sources.knowledgeBaseAvgConfidence,
      target: 500,
    },
    expertValidation: {
      totalReviews: sources.expertValidationTotalReviews,
      agreementRate: sources.expertValidationAgreementRate,
      uniqueExperts: sources.expertValidationUniqueExperts,
      highConfidenceCases: sources.expertValidationHighConfidence,
      disputeCases: sources.expertValidationDisputeCases,
      targetReviews: 50,
    },
    userFeedback: {
      totalFeedbacks: sources.userFeedbackTotal,
      avgSatisfaction: sources.userFeedbackAvgSatisfaction,
      effectiveFeedbacks: sources.userFeedbackEffective,
      targetFeedbacks: 100,
      targetSatisfaction: 4.0,
    },
    reportGeneration: {
      totalReports: sources.reportGenerationTotal,
      targetReports: 1000,
      uniqueUsers: sources.reportGenerationUniqueUsers,
      targetUsers: 300,
    },
    milestones,
    phaseCompleted,
    completionPercentage,
  }
}

function evaluatePhaseCompletionFromSources(sources: {
  caseLibraryTotal: number
  knowledgeBaseTotal: number
  expertValidationTotalReviews: number
  userFeedbackEffective: number
  reportGenerationTotal: number
  reportGenerationUniqueUsers: number
}): PhaseCompletionCriteria[] {
  return [
    {
      criteriaId: 'case_library',
      title: '案例库积累',
      currentValue: sources.caseLibraryTotal,
      targetValue: 1000,
      met: sources.caseLibraryTotal >= 1000,
      unit: '例',
    },
    {
      criteriaId: 'knowledge_base',
      title: '知识库扩充',
      currentValue: sources.knowledgeBaseTotal,
      targetValue: 500,
      met: sources.knowledgeBaseTotal >= 500,
      unit: '条',
    },
    {
      criteriaId: 'expert_validation',
      title: '专家审核案例',
      currentValue: sources.expertValidationTotalReviews,
      targetValue: 50,
      met: sources.expertValidationTotalReviews >= 50,
      unit: '例',
    },
    {
      criteriaId: 'user_feedback',
      title: '有效用户反馈',
      currentValue: sources.userFeedbackEffective,
      targetValue: 100,
      met: sources.userFeedbackEffective >= 100,
      unit: '条',
    },
    {
      criteriaId: 'report_generation',
      title: '真实报告生成',
      currentValue: sources.reportGenerationTotal,
      targetValue: 1000,
      met: sources.reportGenerationTotal >= 1000,
      unit: '份',
    },
    {
      criteriaId: 'real_user_test',
      title: '真实用户测试',
      currentValue: sources.reportGenerationUniqueUsers,
      targetValue: 300,
      met: sources.reportGenerationUniqueUsers >= 300,
      unit: '人',
    },
  ]
}

// --- Phase Completion ---

export function evaluatePhaseCompletion(snapshot: DataAssetSnapshot): PhaseCompletionCriteria[] {
  return [
    {
      criteriaId: 'case_library',
      title: '案例库积累',
      currentValue: snapshot.caseLibrary.total,
      targetValue: snapshot.caseLibrary.target,
      met: snapshot.caseLibrary.total >= snapshot.caseLibrary.target,
      unit: '例',
    },
    {
      criteriaId: 'knowledge_base',
      title: '知识库扩充',
      currentValue: snapshot.knowledgeBase.total,
      targetValue: snapshot.knowledgeBase.target,
      met: snapshot.knowledgeBase.total >= snapshot.knowledgeBase.target,
      unit: '条',
    },
    {
      criteriaId: 'expert_validation',
      title: '专家审核案例',
      currentValue: snapshot.expertValidation.totalReviews,
      targetValue: snapshot.expertValidation.targetReviews,
      met: snapshot.expertValidation.totalReviews >= snapshot.expertValidation.targetReviews,
      unit: '例',
    },
    {
      criteriaId: 'user_feedback',
      title: '有效用户反馈',
      currentValue: snapshot.userFeedback.effectiveFeedbacks,
      targetValue: snapshot.userFeedback.targetFeedbacks,
      met: snapshot.userFeedback.effectiveFeedbacks >= snapshot.userFeedback.targetFeedbacks,
      unit: '条',
    },
    {
      criteriaId: 'report_generation',
      title: '真实报告生成',
      currentValue: snapshot.reportGeneration.totalReports,
      targetValue: snapshot.reportGeneration.targetReports,
      met: snapshot.reportGeneration.totalReports >= snapshot.reportGeneration.targetReports,
      unit: '份',
    },
    {
      criteriaId: 'real_user_test',
      title: '真实用户测试',
      currentValue: snapshot.reportGeneration.uniqueUsers,
      targetValue: snapshot.reportGeneration.targetUsers,
      met: snapshot.reportGeneration.uniqueUsers >= snapshot.reportGeneration.targetUsers,
      unit: '人',
    },
  ]
}

export function isPhaseComplete(criteria: PhaseCompletionCriteria[]): boolean {
  return criteria.length > 0 && criteria.every(c => c.met)
}

// --- Seed Default Milestones ---

export function seedDefaultMilestones(): AssetMilestone[] {
  const now = Date.now()

  const defaults: Array<Omit<AssetMilestone, 'id' | 'createdAt' | 'completedAt'>> = [
    {
      assetType: 'case_library',
      title: '案例库积累',
      currentValue: 25,
      targetValue: 1000,
      unit: '例',
      status: 'in_progress',
      deadline: null,
    },
    {
      assetType: 'knowledge_base',
      title: '知识库扩充',
      currentValue: 76,
      targetValue: 500,
      unit: '条',
      status: 'in_progress',
      deadline: null,
    },
    {
      assetType: 'expert_validation',
      title: '专家审核案例',
      currentValue: 0,
      targetValue: 50,
      unit: '例',
      status: 'not_started',
      deadline: null,
    },
    {
      assetType: 'user_feedback',
      title: '有效用户反馈',
      currentValue: 0,
      targetValue: 100,
      unit: '条',
      status: 'not_started',
      deadline: null,
    },
    {
      assetType: 'report_generation',
      title: '真实报告生成',
      currentValue: 0,
      targetValue: 1000,
      unit: '份',
      status: 'not_started',
      deadline: null,
    },
    {
      assetType: 'report_generation',
      title: '真实用户测试',
      currentValue: 0,
      targetValue: 300,
      unit: '人',
      status: 'not_started',
      deadline: null,
    },
  ]

  const created: AssetMilestone[] = []
  for (const d of defaults) {
    const m: AssetMilestone = {
      ...d,
      id: generateId(),
      createdAt: now,
      completedAt: null,
    }
    milestonesMap.set(m.id, m)
    created.push(m)
  }
  return created
}

// --- Statistics ---

export function getAssetStats(): {
  totalMilestones: number
  completedMilestones: number
  inProgress: number
  growthRecords: number
  trendSummary: Record<string, GrowthTrend>
} {
  const all = getAllMilestones()
  const completed = all.filter(m => m.status === 'completed').length
  const inProgress = all.filter(m => m.status === 'in_progress').length

  const assetTypes: AssetType[] = ['case_library', 'knowledge_base', 'expert_validation', 'user_feedback', 'report_generation']
  const trendSummary: Record<string, GrowthTrend> = {}
  for (const t of assetTypes) {
    trendSummary[t] = getAssetTrend(t)
  }

  return {
    totalMilestones: all.length,
    completedMilestones: completed,
    inProgress,
    growthRecords: growthRecordsMap.size,
    trendSummary,
  }
}

export function getProgressReport(): {
  assetSummary: {
    caseLibrary: number
    knowledgeBase: number
    expertValidation: number
    userFeedback: number
    reportGeneration: number
  }
  milestones: AssetMilestone[]
  phaseCriteria: PhaseCompletionCriteria[]
  overallProgress: number
} {
  const allMilestones = getAllMilestones()

  const caseLibrary = allMilestones.filter(m => m.assetType === 'case_library').reduce((s, m) => s + m.currentValue, 0)
  const knowledgeBase = allMilestones.filter(m => m.assetType === 'knowledge_base').reduce((s, m) => s + m.currentValue, 0)
  const expertValidation = allMilestones.filter(m => m.assetType === 'expert_validation').reduce((s, m) => s + m.currentValue, 0)
  const userFeedback = allMilestones.filter(m => m.assetType === 'user_feedback').reduce((s, m) => s + m.currentValue, 0)
  const reportGeneration = allMilestones.filter(m => m.assetType === 'report_generation').reduce((s, m) => s + m.currentValue, 0)

  // Build a synthetic snapshot for phase criteria
  const snapshot = takeSnapshot({
    caseLibraryTotal: caseLibrary,
    caseClassic: 0,
    caseAnonymous: 0,
    caseRegression: 0,
    caseExpertVerified: 0,
    caseEdge: 0,
    caseConflict: 0,
    knowledgeBaseTotal: knowledgeBase,
    knowledgeBaseCategories: 0,
    knowledgeBaseSources: 0,
    knowledgeBaseAvgConfidence: 0,
    expertValidationTotalReviews: expertValidation,
    expertValidationAgreementRate: 0,
    expertValidationUniqueExperts: 0,
    expertValidationHighConfidence: 0,
    expertValidationDisputeCases: 0,
    userFeedbackTotal: 0,
    userFeedbackAvgSatisfaction: 0,
    userFeedbackEffective: userFeedback,
    reportGenerationTotal: reportGeneration,
    reportGenerationUniqueUsers: allMilestones
      .filter(m => m.assetType === 'report_generation' && m.title === '真实用户测试')
      .reduce((s, m) => s + m.currentValue, 0),
  })

  const phaseCriteria = evaluatePhaseCompletion(snapshot)
  const metCount = phaseCriteria.filter(c => c.met).length
  const overallProgress = phaseCriteria.length > 0 ? Math.round((metCount / phaseCriteria.length) * 100) : 0

  return {
    assetSummary: {
      caseLibrary,
      knowledgeBase,
      expertValidation,
      userFeedback,
      reportGeneration,
    },
    milestones: allMilestones,
    phaseCriteria,
    overallProgress,
  }
}

// --- Reset ---

export function resetStore(): void {
  milestonesMap.clear()
  growthRecordsMap.clear()
  idCounter = 0
}