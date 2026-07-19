// V5.0 RC Phase 5 Module J: License Manager — Types
// 三层许可：Community / Professional / Enterprise

export type LicenseTier = 'community' | 'professional' | 'enterprise'
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'trial'

export interface LicenseInfo {
  tier: LicenseTier
  status: LicenseStatus
  issuedAt: number
  expiresAt: number
  licenseKey: string
  licensee: string
  features: string[]
}

export interface FeaturePermission {
  featureId: string
  name: string
  description: string
  requiredTier: LicenseTier
  isGate: boolean
}

export interface LicenseCheckResult {
  featureId: string
  allowed: boolean
  reason: string
  requiredTier: LicenseTier
  currentTier: LicenseTier
}

export interface LicenseValidationResult {
  valid: boolean
  tier: LicenseTier
  status: LicenseStatus
  warnings: string[]
  expiresDays: number
}

export interface TierLimits {
  maxCases: number
  maxReports: number
  maxExports: number
  apiAccess: boolean
  expertReview: boolean
  fullKnowledgeBase: boolean
  reportTemplates: string[]
}

export const LICENSE_MANAGER_VERSION = '1.0.0'

export const LICENSE_FEATURES: FeaturePermission[] = [
  { featureId: 'basic-report', name: '基础报告', description: '生成基础命理报告', requiredTier: 'community', isGate: false },
  { featureId: 'professional-report', name: '专业报告', description: '生成专业级命理报告', requiredTier: 'professional', isGate: true },
  { featureId: 'enterprise-report', name: '企业报告', description: '生成企业级命理报告（含全部模板）', requiredTier: 'enterprise', isGate: true },
  { featureId: 'case-library-full', name: '完整案例库', description: '访问全部案例数据', requiredTier: 'professional', isGate: false },
  { featureId: 'expert-review-access', name: '专家审核', description: '使用专家审核工作流', requiredTier: 'enterprise', isGate: true },
  { featureId: 'api-access', name: 'API 调用', description: 'REST API 接口访问', requiredTier: 'professional', isGate: true },
  { featureId: 'export-pdf', name: 'PDF 导出', description: '导出 PDF 格式报告', requiredTier: 'professional', isGate: false },
  { featureId: 'export-all', name: '全格式导出', description: '导出所有格式', requiredTier: 'enterprise', isGate: false },
  { featureId: 'multi-language', name: '多语言', description: '多语言报告支持', requiredTier: 'enterprise', isGate: false },
  { featureId: 'benchmark', name: '行业基准', description: '行业基准对比功能', requiredTier: 'enterprise', isGate: false },
]

export const TIER_LIMITS: Record<LicenseTier, TierLimits> = {
  community: { maxCases: 10, maxReports: 5, maxExports: 2, apiAccess: false, expertReview: false, fullKnowledgeBase: false, reportTemplates: ['basic'] },
  professional: { maxCases: 500, maxReports: 200, maxExports: 50, apiAccess: true, expertReview: false, fullKnowledgeBase: true, reportTemplates: ['basic', 'professional'] },
  enterprise: { maxCases: Infinity, maxReports: Infinity, maxExports: Infinity, apiAccess: true, expertReview: true, fullKnowledgeBase: true, reportTemplates: ['basic', 'professional', 'enterprise', 'vip'] },
}

export const TIER_ORDER: LicenseTier[] = ['community', 'professional', 'enterprise']
