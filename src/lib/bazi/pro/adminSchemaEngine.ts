/**
 * V5.0 GA P1: Admin Dashboard Schema — Engine
 *
 * 职责：Schema 验证、权限检查、角色层级判断、模块 Schema 定义生成
 * 约束：不涉及数据库连接，纯 TypeScript 层验证
 */

import type {
  AdminUser,
  AdminOrder,
  AdminReport,
  AdminCase,
  AdminApiKey,
} from './adminSchemaTypes'

import {
  ADMIN_SCHEMA_VERSION,
  ADMIN_MODULES,
  ROLE_HIERARCHY,
} from './adminSchemaTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const ADMIN_SCHEMA_ENGINE_VERSION = '1.0.0'

// ═══════════════════════════════════════════════════════════
// 内部常量 — 枚举合法值
// ═══════════════════════════════════════════════════════════

const VALID_ENTITY_STATUS = ['active', 'inactive', 'suspended', 'deleted'] as const
const VALID_PAYMENT_STATUS = ['pending', 'paid', 'refunded', 'failed', 'cancelled'] as const
const VALID_REPORT_STATUS = ['draft', 'completed', 'shared', 'archived'] as const
const VALID_USER_ROLES = ['super_admin', 'admin', 'operator', 'viewer'] as const
const VALID_LICENSE_TIERS = ['community', 'professional', 'enterprise'] as const
const VALID_PAYMENT_METHODS = ['wechat', 'alipay', 'stripe', 'apple_pay'] as const
const VALID_REVIEW_STATUS = ['pending', 'approved', 'rejected'] as const

// ═══════════════════════════════════════════════════════════
// 内部辅助
// ═══════════════════════════════════════════════════════════

type ValidationError = { field: string; error: string }

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

function isNonEmptyString(value: unknown): boolean {
  return isString(value) && value.length > 0
}

function isValidEnum<T extends readonly string[]>(value: unknown, validValues: T): boolean {
  return isString(value) && (validValues as readonly string[]).includes(value)
}

function isNonNegativeNumber(value: unknown): boolean {
  return isNumber(value) && value >= 0
}

// ═══════════════════════════════════════════════════════════
// 1. validateAdminUser
// ═══════════════════════════════════════════════════════════

export function validateAdminUser(data: Partial<AdminUser>): ValidationError[] {
  const errors: ValidationError[] = []

  if (data.id !== undefined && !isNonEmptyString(data.id)) {
    errors.push({ field: 'id', error: 'id 必须是非空字符串' })
  }

  if (data.username !== undefined && !isNonEmptyString(data.username)) {
    errors.push({ field: 'username', error: 'username 必须是非空字符串' })
  }

  if (data.email !== undefined && !isNonEmptyString(data.email)) {
    errors.push({ field: 'email', error: 'email 必须是非空字符串' })
  }

  if (data.phone !== undefined && !isNonEmptyString(data.phone)) {
    errors.push({ field: 'phone', error: 'phone 必须是非空字符串' })
  }

  if (data.role !== undefined && !isValidEnum(data.role, VALID_USER_ROLES)) {
    errors.push({ field: 'role', error: `role 必须是 ${VALID_USER_ROLES.join(', ')} 之一` })
  }

  if (data.licenseTier !== undefined && !isValidEnum(data.licenseTier, VALID_LICENSE_TIERS)) {
    errors.push({ field: 'licenseTier', error: `licenseTier 必须是 ${VALID_LICENSE_TIERS.join(', ')} 之一` })
  }

  if (data.status !== undefined && !isValidEnum(data.status, VALID_ENTITY_STATUS)) {
    errors.push({ field: 'status', error: `status 必须是 ${VALID_ENTITY_STATUS.join(', ')} 之一` })
  }

  if (data.createdAt !== undefined && !isNumber(data.createdAt)) {
    errors.push({ field: 'createdAt', error: 'createdAt 必须是数字' })
  }

  if (data.lastLoginAt !== undefined && data.lastLoginAt !== null && !isNumber(data.lastLoginAt)) {
    errors.push({ field: 'lastLoginAt', error: 'lastLoginAt 必须是数字或 null' })
  }

  if (data.totalReports !== undefined && !isNonNegativeNumber(data.totalReports)) {
    errors.push({ field: 'totalReports', error: 'totalReports 必须是非负数' })
  }

  if (data.totalPayments !== undefined && !isNonNegativeNumber(data.totalPayments)) {
    errors.push({ field: 'totalPayments', error: 'totalPayments 必须是非负数' })
  }

  return errors
}

// ═══════════════════════════════════════════════════════════
// 2. validateAdminOrder
// ═══════════════════════════════════════════════════════════

export function validateAdminOrder(data: Partial<AdminOrder>): ValidationError[] {
  const errors: ValidationError[] = []

  if (data.id !== undefined && !isNonEmptyString(data.id)) {
    errors.push({ field: 'id', error: 'id 必须是非空字符串' })
  }

  if (data.userId !== undefined && !isNonEmptyString(data.userId)) {
    errors.push({ field: 'userId', error: 'userId 必须是非空字符串' })
  }

  if (data.reportId !== undefined && !isNonEmptyString(data.reportId)) {
    errors.push({ field: 'reportId', error: 'reportId 必须是非空字符串' })
  }

  if (data.amount !== undefined && !isNonNegativeNumber(data.amount)) {
    errors.push({ field: 'amount', error: 'amount 必须是非负数' })
  }

  if (data.currency !== undefined && !isNonEmptyString(data.currency)) {
    errors.push({ field: 'currency', error: 'currency 必须是非空字符串' })
  }

  if (data.paymentMethod !== undefined && !isValidEnum(data.paymentMethod, VALID_PAYMENT_METHODS)) {
    errors.push({ field: 'paymentMethod', error: `paymentMethod 必须是 ${VALID_PAYMENT_METHODS.join(', ')} 之一` })
  }

  if (data.paymentStatus !== undefined && !isValidEnum(data.paymentStatus, VALID_PAYMENT_STATUS)) {
    errors.push({ field: 'paymentStatus', error: `paymentStatus 必须是 ${VALID_PAYMENT_STATUS.join(', ')} 之一` })
  }

  if (data.productId !== undefined && !isNonEmptyString(data.productId)) {
    errors.push({ field: 'productId', error: 'productId 必须是非空字符串' })
  }

  if (data.createdAt !== undefined && !isNumber(data.createdAt)) {
    errors.push({ field: 'createdAt', error: 'createdAt 必须是数字' })
  }

  if (data.paidAt !== undefined && data.paidAt !== null && !isNumber(data.paidAt)) {
    errors.push({ field: 'paidAt', error: 'paidAt 必须是数字或 null' })
  }

  if (data.refundedAt !== undefined && data.refundedAt !== null && !isNumber(data.refundedAt)) {
    errors.push({ field: 'refundedAt', error: 'refundedAt 必须是数字或 null' })
  }

  return errors
}

// ═══════════════════════════════════════════════════════════
// 3. validateAdminReport
// ═══════════════════════════════════════════════════════════

export function validateAdminReport(data: Partial<AdminReport>): ValidationError[] {
  const errors: ValidationError[] = []

  if (data.id !== undefined && !isNonEmptyString(data.id)) {
    errors.push({ field: 'id', error: 'id 必须是非空字符串' })
  }

  if (data.userId !== undefined && !isNonEmptyString(data.userId)) {
    errors.push({ field: 'userId', error: 'userId 必须是非空字符串' })
  }

  if (data.orderId !== undefined && data.orderId !== null && !isNonEmptyString(data.orderId)) {
    errors.push({ field: 'orderId', error: 'orderId 必须是非空字符串或 null' })
  }

  if (data.title !== undefined && !isNonEmptyString(data.title)) {
    errors.push({ field: 'title', error: 'title 必须是非空字符串' })
  }

  if (data.template !== undefined && !isNonEmptyString(data.template)) {
    errors.push({ field: 'template', error: 'template 必须是非空字符串' })
  }

  if (data.status !== undefined && !isValidEnum(data.status, VALID_REPORT_STATUS)) {
    errors.push({ field: 'status', error: `status 必须是 ${VALID_REPORT_STATUS.join(', ')} 之一` })
  }

  if (data.language !== undefined && !isNonEmptyString(data.language)) {
    errors.push({ field: 'language', error: 'language 必须是非空字符串' })
  }

  if (data.qualityScore !== undefined && !isNonNegativeNumber(data.qualityScore)) {
    errors.push({ field: 'qualityScore', error: 'qualityScore 必须是非负数' })
  }

  if (data.trustScore !== undefined && !isNonNegativeNumber(data.trustScore)) {
    errors.push({ field: 'trustScore', error: 'trustScore 必须是非负数' })
  }

  if (data.createdAt !== undefined && !isNumber(data.createdAt)) {
    errors.push({ field: 'createdAt', error: 'createdAt 必须是数字' })
  }

  if (data.sharedCount !== undefined && !isNonNegativeNumber(data.sharedCount)) {
    errors.push({ field: 'sharedCount', error: 'sharedCount 必须是非负数' })
  }

  if (data.downloadedCount !== undefined && !isNonNegativeNumber(data.downloadedCount)) {
    errors.push({ field: 'downloadedCount', error: 'downloadedCount 必须是非负数' })
  }

  return errors
}

// ═══════════════════════════════════════════════════════════
// 4. validateAdminCase
// ═══════════════════════════════════════════════════════════

export function validateAdminCase(data: Partial<AdminCase>): ValidationError[] {
  const errors: ValidationError[] = []

  if (data.id !== undefined && !isNonEmptyString(data.id)) {
    errors.push({ field: 'id', error: 'id 必须是非空字符串' })
  }

  if (data.caseId !== undefined && !isNonEmptyString(data.caseId)) {
    errors.push({ field: 'caseId', error: 'caseId 必须是非空字符串' })
  }

  if (data.title !== undefined && !isNonEmptyString(data.title)) {
    errors.push({ field: 'title', error: 'title 必须是非空字符串' })
  }

  if (data.category !== undefined && !isNonEmptyString(data.category)) {
    errors.push({ field: 'category', error: 'category 必须是非空字符串' })
  }

  if (data.source !== undefined && !isNonEmptyString(data.source)) {
    errors.push({ field: 'source', error: 'source 必须是非空字符串' })
  }

  if (data.qualityScore !== undefined && !isNonNegativeNumber(data.qualityScore)) {
    errors.push({ field: 'qualityScore', error: 'qualityScore 必须是非负数' })
  }

  if (data.reliabilityScore !== undefined && !isNonNegativeNumber(data.reliabilityScore)) {
    errors.push({ field: 'reliabilityScore', error: 'reliabilityScore 必须是非负数' })
  }

  if (data.reviewStatus !== undefined && !isValidEnum(data.reviewStatus, VALID_REVIEW_STATUS)) {
    errors.push({ field: 'reviewStatus', error: `reviewStatus 必须是 ${VALID_REVIEW_STATUS.join(', ')} 之一` })
  }

  if (data.contributor !== undefined && data.contributor !== null && !isNonEmptyString(data.contributor)) {
    errors.push({ field: 'contributor', error: 'contributor 必须是非空字符串或 null' })
  }

  if (data.createdAt !== undefined && !isNumber(data.createdAt)) {
    errors.push({ field: 'createdAt', error: 'createdAt 必须是数字' })
  }

  return errors
}

// ═══════════════════════════════════════════════════════════
// 5. validateApiKey
// ═══════════════════════════════════════════════════════════

export function validateApiKey(data: Partial<AdminApiKey>): ValidationError[] {
  const errors: ValidationError[] = []

  if (data.id !== undefined && !isNonEmptyString(data.id)) {
    errors.push({ field: 'id', error: 'id 必须是非空字符串' })
  }

  if (data.key !== undefined && !isNonEmptyString(data.key)) {
    errors.push({ field: 'key', error: 'key 必须是非空字符串' })
  }

  if (data.name !== undefined && !isNonEmptyString(data.name)) {
    errors.push({ field: 'name', error: 'name 必须是非空字符串' })
  }

  if (data.userId !== undefined && !isNonEmptyString(data.userId)) {
    errors.push({ field: 'userId', error: 'userId 必须是非空字符串' })
  }

  if (data.permissions !== undefined && !Array.isArray(data.permissions)) {
    errors.push({ field: 'permissions', error: 'permissions 必须是数组' })
  } else if (data.permissions !== undefined) {
    for (const perm of data.permissions) {
      if (!isString(perm)) {
        errors.push({ field: 'permissions', error: 'permissions 中的每一项必须是字符串' })
        break
      }
    }
  }

  if (data.rateLimit !== undefined && !isNonNegativeNumber(data.rateLimit)) {
    errors.push({ field: 'rateLimit', error: 'rateLimit 必须是非负数' })
  }

  if (data.totalCalls !== undefined && !isNonNegativeNumber(data.totalCalls)) {
    errors.push({ field: 'totalCalls', error: 'totalCalls 必须是非负数' })
  }

  if (data.lastUsedAt !== undefined && data.lastUsedAt !== null && !isNumber(data.lastUsedAt)) {
    errors.push({ field: 'lastUsedAt', error: 'lastUsedAt 必须是数字或 null' })
  }

  if (data.expiresAt !== undefined && data.expiresAt !== null && !isNumber(data.expiresAt)) {
    errors.push({ field: 'expiresAt', error: 'expiresAt 必须是数字或 null' })
  }

  if (data.status !== undefined && !isValidEnum(data.status, VALID_ENTITY_STATUS)) {
    errors.push({ field: 'status', error: `status 必须是 ${VALID_ENTITY_STATUS.join(', ')} 之一` })
  }

  if (data.createdAt !== undefined && !isNumber(data.createdAt)) {
    errors.push({ field: 'createdAt', error: 'createdAt 必须是数字' })
  }

  return errors
}

// ═══════════════════════════════════════════════════════════
// 6. checkPermission
// ═══════════════════════════════════════════════════════════

/**
 * 检查指定角色是否有权限对某模块执行某操作
 * 规则：viewer 只能 read，operator 可以 CRUD + export，admin 额外可以 approve/reject，super_admin 全部
 */
export function checkPermission(userRole: string, module: string, action: string): boolean {
  const roleIndex = ROLE_HIERARCHY.indexOf(userRole)
  if (roleIndex === -1) return false

  // viewer 仅能 read
  if (userRole === 'viewer') {
    return action === 'read'
  }

  // operator: read, create, update, delete, export
  if (userRole === 'operator') {
    return ['read', 'create', 'update', 'delete', 'export'].includes(action)
  }

  // admin: read, create, update, delete, export, approve, reject
  if (userRole === 'admin') {
    return ['read', 'create', 'update', 'delete', 'export', 'approve', 'reject'].includes(action)
  }

  // super_admin: 全部通过
  return true
}

// ═══════════════════════════════════════════════════════════
// 7. hasMinimumRole
// ═══════════════════════════════════════════════════════════

/**
 * 判断 userRole 是否达到或超过 requiredRole 的层级
 * ROLE_HIERARCHY: viewer < operator < admin < super_admin
 */
export function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole)
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole)
  if (userIndex === -1 || requiredIndex === -1) return false
  return userIndex >= requiredIndex
}

// ═══════════════════════════════════════════════════════════
// 8. generateSchemaDefinition
// ═══════════════════════════════════════════════════════════

/**
 * 生成各模块的 Schema 定义（字段列表 + 必填字段列表）
 */
export function generateSchemaDefinition(): Record<string, { fields: string[]; required: string[] }> {
  return {
    AdminUser: {
      fields: ['id', 'username', 'email', 'phone', 'role', 'licenseTier', 'status', 'createdAt', 'lastLoginAt', 'totalReports', 'totalPayments'],
      required: ['id', 'username', 'email', 'role', 'licenseTier', 'status', 'createdAt'],
    },
    AdminOrder: {
      fields: ['id', 'userId', 'reportId', 'amount', 'currency', 'paymentMethod', 'paymentStatus', 'productId', 'createdAt', 'paidAt', 'refundedAt'],
      required: ['id', 'userId', 'reportId', 'amount', 'currency', 'paymentMethod', 'paymentStatus', 'productId', 'createdAt'],
    },
    AdminReport: {
      fields: ['id', 'userId', 'orderId', 'title', 'template', 'status', 'language', 'qualityScore', 'trustScore', 'createdAt', 'sharedCount', 'downloadedCount'],
      required: ['id', 'userId', 'title', 'template', 'status', 'language', 'createdAt'],
    },
    AdminCase: {
      fields: ['id', 'caseId', 'title', 'category', 'source', 'qualityScore', 'reliabilityScore', 'reviewStatus', 'contributor', 'createdAt'],
      required: ['id', 'caseId', 'title', 'category', 'source', 'reviewStatus', 'createdAt'],
    },
    AdminKnowledgeEntry: {
      fields: ['id', 'knowledgeId', 'source', 'category', 'originalText', 'confidence', 'reviewStatus', 'lastReviewedAt', 'lastReviewedBy'],
      required: ['id', 'knowledgeId', 'source', 'category', 'originalText', 'confidence', 'reviewStatus'],
    },
    AdminExpertReview: {
      fields: ['id', 'reviewerId', 'reviewerName', 'caseId', 'reportId', 'status', 'agreementRate', 'verdict', 'reviewedAt'],
      required: ['id', 'reviewerId', 'reviewerName', 'caseId', 'reportId', 'status', 'verdict'],
    },
    AdminStatsSummary: {
      fields: ['period', 'totalUsers', 'newUsers', 'totalReports', 'totalOrders', 'totalRevenue', 'totalCases', 'totalKnowledgeEntries', 'avgTrustScore', 'avgSatisfaction'],
      required: ['period', 'totalUsers', 'newUsers', 'totalReports', 'totalOrders', 'totalRevenue'],
    },
    AdminSystemLog: {
      fields: ['id', 'action', 'actorId', 'actorName', 'resource', 'resourceId', 'details', 'severity', 'ipAddress', 'createdAt'],
      required: ['id', 'action', 'actorId', 'resource', 'severity', 'createdAt'],
    },
    AdminPermission: {
      fields: ['id', 'name', 'description', 'module', 'actions', 'requiredRole'],
      required: ['id', 'name', 'module', 'actions', 'requiredRole'],
    },
    AdminApiKey: {
      fields: ['id', 'key', 'name', 'userId', 'permissions', 'rateLimit', 'totalCalls', 'lastUsedAt', 'expiresAt', 'status', 'createdAt'],
      required: ['id', 'key', 'name', 'userId', 'permissions', 'rateLimit', 'status', 'createdAt'],
    },
    AdminDashboardConfig: {
      fields: ['refreshInterval', 'defaultPeriod', 'panels', 'charts', 'exportedFormats'],
      required: ['refreshInterval', 'defaultPeriod'],
    },
  }
}

// ═══════════════════════════════════════════════════════════
// 9. getModulePermissions
// ═══════════════════════════════════════════════════════════

/**
 * 获取指定模块的权限列表
 * 若模块不存在则返回空数组
 */
export function getModulePermissions(module: string): string[] {
  const mod = ADMIN_MODULES.find(m => m.module === module)
  return mod ? [...mod.permissions] : []
}

// ═══════════════════════════════════════════════════════════
// 10. validateAllSchemas
// ═══════════════════════════════════════════════════════════

/**
 * 全模块 Schema 验证 — 对每个模块用样本有效数据做一次校验
 * 返回各模块验证结果
 */
export function validateAllSchemas(): Record<string, { valid: boolean; errors: string[] }> {
  const now = Date.now()
  const result: Record<string, { valid: boolean; errors: string[] }> = {}

  // AdminUser
  const userErrors = validateAdminUser({
    id: 'u1', username: 'admin', email: 'a@b.com', phone: '13800138000',
    role: 'admin', licenseTier: 'professional', status: 'active',
    createdAt: now, lastLoginAt: null, totalReports: 0, totalPayments: 0,
  })
  result['AdminUser'] = { valid: userErrors.length === 0, errors: userErrors.map(e => `${e.field}: ${e.error}`) }

  // AdminOrder
  const orderErrors = validateAdminOrder({
    id: 'o1', userId: 'u1', reportId: 'r1', amount: 99.9, currency: 'CNY',
    paymentMethod: 'wechat', paymentStatus: 'paid', productId: 'report_pro',
    createdAt: now, paidAt: now, refundedAt: null,
  })
  result['AdminOrder'] = { valid: orderErrors.length === 0, errors: orderErrors.map(e => `${e.field}: ${e.error}`) }

  // AdminReport
  const reportErrors = validateAdminReport({
    id: 'r1', userId: 'u1', orderId: 'o1', title: '八字报告', template: 'pro',
    status: 'completed', language: 'zh', qualityScore: 85, trustScore: 90,
    createdAt: now, sharedCount: 0, downloadedCount: 0,
  })
  result['AdminReport'] = { valid: reportErrors.length === 0, errors: reportErrors.map(e => `${e.field}: ${e.error}`) }

  // AdminCase
  const caseErrors = validateAdminCase({
    id: 'c1', caseId: 'case-001', title: '经典案例', category: 'career',
    source: 'classical', qualityScore: 88, reliabilityScore: 92,
    reviewStatus: 'approved', contributor: null, createdAt: now,
  })
  result['AdminCase'] = { valid: caseErrors.length === 0, errors: caseErrors.map(e => `${e.field}: ${e.error}`) }

  // AdminApiKey
  const apiKeyErrors = validateApiKey({
    id: 'k1', key: 'sk-test-key', name: '测试Key', userId: 'u1',
    permissions: ['user:read'], rateLimit: 60, totalCalls: 0,
    lastUsedAt: null, expiresAt: now + 86400000, status: 'active', createdAt: now,
  })
  result['AdminApiKey'] = { valid: apiKeyErrors.length === 0, errors: apiKeyErrors.map(e => `${e.field}: ${e.error}`) }

  return result
}
