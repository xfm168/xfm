// Phase 6 Batch 2 Module 1: Product Tier — Types
// 产品版本体系：免费版 / 专业版 / VIP版

export type ProductTier = 'free' | 'professional' | 'vip'
export type ReportType = 'basic_chart' | 'simple_report' | 'master_report' | 'deep_report' | 'expert_reviewed'

export interface TierFeature {
  featureId: string
  name: string
  description: string
  availableIn: ProductTier[]
  reportTypes: ReportType[]
}

export interface ProductTierConfig {
  tier: ProductTier
  name: string
  description: string
  priceMonthly: number          // 0 for free
  priceYearly: number           // 0 for free
  maxReportsPerMonth: number
  maxExportsPerMonth: number
  features: string[]
  reportTypes: ReportType[]
  prioritySupport: boolean
  expertReview: boolean
  apiAccess: boolean
}

export interface UserSubscription {
  id: string
  userId: string
  tier: ProductTier
  startDate: number
  endDate: number
  autoRenew: boolean
  reportsUsedThisMonth: number
  reportsUsedTotal: number
  status: 'active' | 'expired' | 'cancelled' | 'trial'
  createdAt: number
}

export const PRODUCT_TIER_VERSION = '1.0.0'

export const TIER_CONFIGS: Record<ProductTier, ProductTierConfig> = {
  free: {
    tier: 'free',
    name: '免费版',
    description: '基础八字排盘与简版报告',
    priceMonthly: 0,
    priceYearly: 0,
    maxReportsPerMonth: 3,
    maxExportsPerMonth: 1,
    features: ['basic_chart', 'simple_report', 'wuxing_overview', 'shensha_basic'],
    reportTypes: ['basic_chart', 'simple_report'],
    prioritySupport: false,
    expertReview: false,
    apiAccess: false,
  },
  professional: {
    tier: 'professional',
    name: '专业版',
    description: '完整 Master Report + 大运流年 + 喜用神 + 格局分析',
    priceMonthly: 29.9,
    priceYearly: 299,
    maxReportsPerMonth: 50,
    maxExportsPerMonth: 20,
    features: ['master_report', 'fortune_analysis', 'xiYong_analysis', 'pattern_analysis', 'tenGod_detail', 'wuxing_radar', 'timeline_chart'],
    reportTypes: ['master_report'],
    prioritySupport: true,
    expertReview: false,
    apiAccess: true,
  },
  vip: {
    tier: 'vip',
    name: 'VIP版',
    description: '深度报告 + 专家审核 + 风水结合分析 + 全功能',
    priceMonthly: 99.9,
    priceYearly: 999,
    maxReportsPerMonth: Infinity,
    maxExportsPerMonth: Infinity,
    features: ['deep_report', 'expert_reviewed', 'fengshui_analysis', 'ai_chat', 'historical_comparison', 'case_library_full', 'multi_language', 'priority_support'],
    reportTypes: ['deep_report', 'expert_reviewed'],
    prioritySupport: true,
    expertReview: true,
    apiAccess: true,
  },
}