/**
 * V5.0 RC Phase 5 Module J: License Manager — 许可证管理引擎
 *
 * 职责：许可证生成、验证、功能权限检查、层级升级、门禁控制
 * 约束：不做命理计算，仅提供许可证管理基础设施
 */

import type {
  LicenseInfo,
  LicenseTier,
  LicenseStatus,
  LicenseValidationResult,
  LicenseCheckResult,
  FeaturePermission,
  TierLimits,
} from './licenseManagerTypes'

import {
  LICENSE_MANAGER_VERSION,
  LICENSE_FEATURES,
  TIER_LIMITS,
  TIER_ORDER,
} from './licenseManagerTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const LICENSE_MANAGER_ENGINE_VERSION = '1.0.0'

// ═══════════════════════════════════════════════════════════
// 内部存储
// ═══════════════════════════════════════════════════════════

const licenseStore = new Map<string, LicenseInfo>()

let customFeatures: FeaturePermission[] = []

// ═══════════════════════════════════════════════════════════
// 种子数据
// ═══════════════════════════════════════════════════════════

function seedLicenses(): void {
  const now = Date.now()

  // Community trial
  const communityLicense: LicenseInfo = {
    tier: 'community',
    status: 'trial',
    issuedAt: now,
    expiresAt: now + 14 * 24 * 3600 * 1000,
    licenseKey: 'XF-community-trial-000001',
    licensee: '社区试用用户',
    features: ['basic-report'],
  }
  licenseStore.set(communityLicense.licenseKey, communityLicense)

  // Professional active
  const professionalLicense: LicenseInfo = {
    tier: 'professional',
    status: 'active',
    issuedAt: now - 30 * 24 * 3600 * 1000,
    expiresAt: now + 335 * 24 * 3600 * 1000,
    licenseKey: 'XF-professional-active-000002',
    licensee: '专业版用户',
    features: ['basic-report', 'professional-report', 'case-library-full', 'api-access', 'export-pdf'],
  }
  licenseStore.set(professionalLicense.licenseKey, professionalLicense)

  // Enterprise active
  const enterpriseLicense: LicenseInfo = {
    tier: 'enterprise',
    status: 'active',
    issuedAt: now - 90 * 24 * 3600 * 1000,
    expiresAt: now + 275 * 24 * 3600 * 1000,
    licenseKey: 'XF-enterprise-active-000003',
    licensee: '企业版用户',
    features: [
      'basic-report', 'professional-report', 'enterprise-report',
      'case-library-full', 'expert-review-access', 'api-access',
      'export-pdf', 'export-all', 'multi-language', 'benchmark',
    ],
  }
  licenseStore.set(enterpriseLicense.licenseKey, enterpriseLicense)
}

// 初始化种子
seedLicenses()

// ═══════════════════════════════════════════════════════════
// 内部辅助
// ═══════════════════════════════════════════════════════════

function generateRandom6Digits(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString()
  return digits
}

function getAllFeatures(): FeaturePermission[] {
  return [...LICENSE_FEATURES, ...customFeatures]
}

// ═══════════════════════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════════════════════

/**
 * 生成许可证
 */
export function generateLicense(tier: LicenseTier, licensee: string, durationDays: number): LicenseInfo {
  const now = Date.now()
  const licenseKey = `XF-${tier}-${now}-${generateRandom6Digits()}`

  // 确定该层级可用的功能
  const tierIndex = TIER_ORDER.indexOf(tier)
  const features: string[] = []
  for (const f of getAllFeatures()) {
    const fTierIndex = TIER_ORDER.indexOf(f.requiredTier)
    if (fTierIndex <= tierIndex) {
      features.push(f.featureId)
    }
  }

  const license: LicenseInfo = {
    tier,
    status: 'active',
    issuedAt: now,
    expiresAt: now + durationDays * 24 * 3600 * 1000,
    licenseKey,
    licensee,
    features,
  }

  licenseStore.set(licenseKey, license)
  return license
}

/**
 * 验证许可证有效性
 */
export function validateLicense(licenseKey: string): LicenseValidationResult {
  const license = licenseStore.get(licenseKey)

  if (!license) {
    return {
      valid: false,
      tier: 'community',
      status: 'expired',
      warnings: ['许可证不存在'],
      expiresDays: 0,
    }
  }

  const now = Date.now()
  const expiresDays = Math.max(0, Math.ceil((license.expiresAt - now) / (24 * 3600 * 1000)))
  const warnings: string[] = []

  if (license.status === 'revoked') {
    return {
      valid: false,
      tier: license.tier,
      status: 'revoked',
      warnings: ['许可证已被吊销'],
      expiresDays,
    }
  }

  if (now > license.expiresAt) {
    return {
      valid: false,
      tier: license.tier,
      status: 'expired',
      warnings: ['许可证已过期'],
      expiresDays: 0,
    }
  }

  if (expiresDays <= 30) {
    warnings.push(`许可证将在 ${expiresDays} 天后过期`)
  }

  return {
    valid: true,
    tier: license.tier,
    status: license.status,
    warnings,
    expiresDays,
  }
}

/**
 * 检查功能权限
 */
export function checkFeatureAccess(featureId: string, license: LicenseInfo): LicenseCheckResult {
  const allFeatures = getAllFeatures()
  const feature = allFeatures.find(f => f.featureId === featureId)

  if (!feature) {
    return {
      featureId,
      allowed: false,
      reason: `功能 ${featureId} 未定义`,
      requiredTier: 'community',
      currentTier: license.tier,
    }
  }

  const currentTierIndex = TIER_ORDER.indexOf(license.tier)
  const requiredTierIndex = TIER_ORDER.indexOf(feature.requiredTier)

  if (currentTierIndex >= requiredTierIndex) {
    return {
      featureId,
      allowed: true,
      reason: `当前层级 ${license.tier} 满足要求 ${feature.requiredTier}`,
      requiredTier: feature.requiredTier,
      currentTier: license.tier,
    }
  }

  return {
    featureId,
    allowed: false,
    reason: `功能 ${featureId} 需要 ${feature.requiredTier} 或更高层级，当前为 ${license.tier}`,
    requiredTier: feature.requiredTier,
    currentTier: license.tier,
  }
}

/**
 * 返回该层级可用功能
 */
export function getFeaturePermissions(tier: LicenseTier): FeaturePermission[] {
  const tierIndex = TIER_ORDER.indexOf(tier)
  return getAllFeatures().filter(f => TIER_ORDER.indexOf(f.requiredTier) <= tierIndex)
}

/**
 * 吊销许可证
 */
export function revokeLicense(licenseKey: string): boolean {
  const license = licenseStore.get(licenseKey)
  if (!license) {
    return false
  }
  license.status = 'revoked'
  return true
}

/**
 * 升级许可证
 */
export function upgradeLicense(licenseKey: string, newTier: LicenseTier): LicenseInfo | null {
  const license = licenseStore.get(licenseKey)
  if (!license) {
    return null
  }

  const currentTierIndex = TIER_ORDER.indexOf(license.tier)
  const newTierIndex = TIER_ORDER.indexOf(newTier)

  if (newTierIndex <= currentTierIndex) {
    return null
  }

  license.tier = newTier

  // 更新可用功能
  const features: string[] = []
  for (const f of getAllFeatures()) {
    const fTierIndex = TIER_ORDER.indexOf(f.requiredTier)
    if (fTierIndex <= newTierIndex) {
      features.push(f.featureId)
    }
  }
  license.features = features

  return license
}

/**
 * 门禁：不允许则抛 Error
 */
export function enforceLicenseGate(featureId: string, license: LicenseInfo): void {
  const allFeatures = getAllFeatures()
  const feature = allFeatures.find(f => f.featureId === featureId)

  if (!feature || !feature.isGate) {
    return
  }

  const result = checkFeatureAccess(featureId, license)
  if (!result.allowed) {
    throw new Error(`许可证门禁拒绝：${result.reason}`)
  }
}

/**
 * 通过 key 获取许可证
 */
export function getLicenseByKey(licenseKey: string): LicenseInfo | undefined {
  return licenseStore.get(licenseKey)
}

/**
 * 获取所有许可证
 */
export function getAllLicenses(): LicenseInfo[] {
  return Array.from(licenseStore.values())
}

/**
 * 获取层级限制
 */
export function getTierLimits(tier: LicenseTier): TierLimits {
  return TIER_LIMITS[tier]
}

/**
 * 注册自定义功能
 */
export function registerCustomFeatures(features: FeaturePermission[]): void {
  customFeatures = [...customFeatures, ...features]
}

/**
 * 重置许可证存储（用于测试）
 */
export function resetLicenseStore(): void {
  licenseStore.clear()
  customFeatures = []
  seedLicenses()
}
