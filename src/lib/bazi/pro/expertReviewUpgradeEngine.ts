/**
 * Expert Review Upgrade Engine
 *
 * 职责：
 *   - 专家账号管理（创建、查询、统计更新）
 *   - 专家等级自动升级
 *   - 排行榜生成
 *   - 全局专家系统统计
 * 约束：
 *   - 不修改已有文件
 *   - 纯数据管理层
 */

import type {
  ExpertTier,
  ExpertSpecialty,
  ExpertAccount,
  ExpertLeaderboard,
  ExpertSystemStats,
} from './expertReviewUpgradeTypes'

import {
  EXPERT_REVIEW_UPGRADE_VERSION,
  EXPERT_TIER_REQUIREMENTS,
  EXPERT_TIERS,
} from './expertReviewUpgradeTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const EXPERT_REVIEW_UPGRADE_ENGINE_VERSION = EXPERT_REVIEW_UPGRADE_VERSION

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

const expertStore = new Map<string, ExpertAccount>()

// ═══════════════════════════════════════════
// 3. 辅助函数
// ═══════════════════════════════════════════

function generateExpertId(): string {
  const ts = Date.now()
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `EXP-${ts}-${rand}`
}

// ═══════════════════════════════════════════
// 4. 核心 API
// ═══════════════════════════════════════════

export function createExpertAccount(
  data: Omit<ExpertAccount, 'id' | 'totalReviews' | 'agreementRate' | 'avgReviewTime' | 'qualityScore' | 'joinedAt' | 'badges'>
): ExpertAccount {
  const now = Date.now()
  const account: ExpertAccount = {
    ...data,
    id: generateExpertId(),
    totalReviews: 0,
    agreementRate: 0,
    avgReviewTime: 0,
    qualityScore: 0,
    joinedAt: now,
    badges: [],
  }

  expertStore.set(account.id, account)
  return account
}

export function getExpertAccount(expertId: string): ExpertAccount | undefined {
  return expertStore.get(expertId)
}

export function updateExpertStats(
  expertId: string,
  reviewResult: { agreement: boolean; reviewTime: number; qualityScore: number }
): ExpertAccount | null {
  const account = expertStore.get(expertId)
  if (!account) return null

  const oldReviews = account.totalReviews
  const newReviews = oldReviews + 1

  // 重新计算 agreementRate（加权平均）
  const oldAgreementCount = account.agreementRate * oldReviews
  const newAgreementCount = oldAgreementCount + (reviewResult.agreement ? 1 : 0)
  const newAgreementRate = newReviews > 0 ? newAgreementCount / newReviews : 0

  // 重新计算 avgReviewTime
  const oldTotalTime = account.avgReviewTime * oldReviews
  const newAvgReviewTime = newReviews > 0
    ? (oldTotalTime + reviewResult.reviewTime) / newReviews
    : 0

  // qualityScore 取最新值
  const newQualityScore = reviewResult.qualityScore

  account.totalReviews = newReviews
  account.agreementRate = newAgreementRate
  account.avgReviewTime = newAvgReviewTime
  account.qualityScore = newQualityScore
  account.lastActiveAt = Date.now()

  expertStore.set(expertId, account)
  return account
}

export function promoteExpert(expertId: string): ExpertAccount | null {
  const account = expertStore.get(expertId)
  if (!account) return null

  const eligibleTier = checkTierEligibility(expertId)
  const tierOrder: ExpertTier[] = ['bronze', 'silver', 'gold', 'master']

  const currentIndex = tierOrder.indexOf(account.tier)
  const eligibleIndex = tierOrder.indexOf(eligibleTier)

  if (eligibleIndex > currentIndex) {
    account.tier = eligibleTier
    const requirement = EXPERT_TIER_REQUIREMENTS[eligibleTier]
    if (requirement && !account.badges.includes(requirement.title)) {
      account.badges.push(requirement.title)
    }
    expertStore.set(expertId, account)
  }

  return account
}

export function getExpertLeaderboard(dimension: string): ExpertLeaderboard {
  const experts = getAllExperts()
  const leaderboard: ExpertLeaderboard = {
    dimension,
    rankings: [],
  }

  const ranked = experts.map(expert => {
    let value = 0
    switch (dimension) {
      case 'agreement_rate':
        value = expert.agreementRate
        break
      case 'total_reviews':
        value = expert.totalReviews
        break
      case 'quality_score':
        value = expert.qualityScore
        break
      case 'avg_time':
        // 对于时间，值越小越好，后面会特殊排序
        value = expert.avgReviewTime
        break
      default:
        value = 0
    }
    return {
      expertId: expert.id,
      expertName: expert.name,
      tier: expert.tier,
      value,
    }
  })

  if (dimension === 'avg_time') {
    // 时间升序（越小越好）
    ranked.sort((a, b) => a.value - b.value)
  } else {
    // 其他降序
    ranked.sort((a, b) => b.value - a.value)
  }

  leaderboard.rankings = ranked
  return leaderboard
}

export function getExpertsByTier(tier: ExpertTier): ExpertAccount[] {
  const results: ExpertAccount[] = []
  for (const expert of expertStore.values()) {
    if (expert.tier === tier) {
      results.push(expert)
    }
  }
  return results
}

export function getExpertsBySpecialty(specialty: ExpertSpecialty): ExpertAccount[] {
  const results: ExpertAccount[] = []
  for (const expert of expertStore.values()) {
    if (expert.specialties.includes(specialty)) {
      results.push(expert)
    }
  }
  return results
}

export function getExpertSystemStats(): ExpertSystemStats {
  const allExperts = getAllExperts()
  const totalExperts = allExperts.length

  const byTier: Record<ExpertTier, number> = {
    bronze: 0,
    silver: 0,
    gold: 0,
    master: 0,
  }
  for (const expert of allExperts) {
    byTier[expert.tier]++
  }

  const totalReviews = allExperts.reduce((sum, e) => sum + e.totalReviews, 0)

  const reviewedExperts = allExperts.filter(e => e.totalReviews > 0)
  const overallAgreementRate = reviewedExperts.length > 0
    ? reviewedExperts.reduce((sum, e) => sum + e.agreementRate, 0) / reviewedExperts.length
    : 0

  // topDisagreementFields - 模拟数据
  const topDisagreementFields: Array<{field: string; count: number}> = [
    { field: 'tenGod', count: 5 },
    { field: 'pattern', count: 3 },
    { field: 'shenSha', count: 2 },
  ]

  const activeExperts = allExperts.filter(e => e.totalReviews > 0)
  const averageReviewTime = activeExperts.length > 0
    ? activeExperts.reduce((sum, e) => sum + e.avgReviewTime, 0) / activeExperts.length
    : 0

  const expertProductivity = allExperts
    .filter(e => e.totalReviews > 0)
    .map(e => ({
      expertId: e.id,
      name: e.name,
      reviews: e.totalReviews,
      avgTime: e.avgReviewTime,
    }))
    .sort((a, b) => b.reviews - a.reviews)

  return {
    totalExperts,
    byTier,
    totalReviews,
    overallAgreementRate,
    topDisagreementFields,
    averageReviewTime,
    expertProductivity,
  }
}

export function checkTierEligibility(expertId: string): ExpertTier {
  const account = expertStore.get(expertId)
  if (!account) return 'bronze'

  let eligibleTier: ExpertTier = 'bronze'

  for (const tier of EXPERT_TIERS) {
    const req = EXPERT_TIER_REQUIREMENTS[tier]
    if (
      account.totalReviews >= req.minReviews &&
      account.agreementRate >= req.minAgreement &&
      account.qualityScore >= req.minQuality
    ) {
      eligibleTier = tier
    }
  }

  return eligibleTier
}

export function getAllExperts(): ExpertAccount[] {
  return Array.from(expertStore.values())
}

export function resetExpertStore(): void {
  expertStore.clear()
  seedExpertData()
}

// ═══════════════════════════════════════════
// 5. 种子数据
// ═══════════════════════════════════════════

function seedExpertData(): void {
  // 专家1: bronze 级别
  createExpertAccount({
    name: '张见习',
    tier: 'bronze',
    specialties: ['pattern', 'shenSha'],
    lastActiveAt: Date.now(),
    bio: '新加入的见习审核员，专注格局与神煞研究',
  })

  // 专家2: silver 级别
  createExpertAccount({
    name: '李正式',
    tier: 'silver',
    specialties: ['tenGod', 'xiYong'],
    lastActiveAt: Date.now(),
    bio: '正式审核员，擅长十神和喜用分析',
  })

  // 专家3: gold 级别
  createExpertAccount({
    name: '王高级',
    tier: 'gold',
    specialties: ['career', 'marriage', 'health'],
    lastActiveAt: Date.now(),
    bio: '高级审核员，深耕事业婚姻健康领域',
  })

  // 专家4: gold 级别，另一专家
  createExpertAccount({
    name: '赵高级',
    tier: 'gold',
    specialties: ['fortune', 'pattern', 'xiYong'],
    lastActiveAt: Date.now(),
    bio: '高级审核员，精通运势和格局',
  })

  // 专家5: master 级别
  createExpertAccount({
    name: '陈宗师',
    tier: 'master',
    specialties: ['pattern', 'xiYong', 'tenGod', 'fortune', 'shenSha', 'marriage', 'career', 'health'],
    lastActiveAt: Date.now(),
    bio: '宗师级审核员，全领域精通',
  })
}

// 初始化种子数据
seedExpertData()