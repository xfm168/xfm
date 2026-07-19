// V5.0 GA P1: Admin Dashboard Schema — Types

export type EntityStatus = 'active' | 'inactive' | 'suspended' | 'deleted'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'cancelled'
export type ReportStatus = 'draft' | 'completed' | 'shared' | 'archived'
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'approve' | 'reject'
export type LogSeverity = 'info' | 'warn' | 'error' | 'critical'

// ---- User Management ----
export interface AdminUser {
  id: string
  username: string
  email: string
  phone: string
  role: 'super_admin' | 'admin' | 'operator' | 'viewer'
  licenseTier: 'community' | 'professional' | 'enterprise'
  status: EntityStatus
  createdAt: number
  lastLoginAt: number | null
  totalReports: number
  totalPayments: number
}

// ---- Order Management ----
export interface AdminOrder {
  id: string
  userId: string
  reportId: string
  amount: number
  currency: string
  paymentMethod: 'wechat' | 'alipay' | 'stripe' | 'apple_pay'
  paymentStatus: PaymentStatus
  productId: string            // 'report_basic' | 'report_pro' | 'vip_monthly' | 'vip_yearly'
  createdAt: number
  paidAt: number | null
  refundedAt: number | null
}

// ---- Report Management ----
export interface AdminReport {
  id: string
  userId: string
  orderId: string | null
  title: string
  template: string
  status: ReportStatus
  language: string
  qualityScore: number
  trustScore: number
  createdAt: number
  sharedCount: number
  downloadedCount: number
}

// ---- Case Management ----
export interface AdminCase {
  id: string
  caseId: string             // 关联 Case Library ID
  title: string
  category: string
  source: string             // 'user_submitted' | 'expert_contributed' | 'classical'
  qualityScore: number
  reliabilityScore: number
  reviewStatus: string       // 'pending' | 'approved' | 'rejected'
  contributor: string | null
  createdAt: number
}

// ---- Knowledge Management ----
export interface AdminKnowledgeEntry {
  id: string
  knowledgeId: string        // 关联 Knowledge Base ID
  source: string             // 古籍来源
  category: string
  originalText: string
  confidence: number
  reviewStatus: string
  lastReviewedAt: number | null
  lastReviewedBy: string | null
}

// ---- Expert Review Management ----
export interface AdminExpertReview {
  id: string
  reviewerId: string
  reviewerName: string
  caseId: string
  reportId: string
  status: string             // 'pending' | 'in_progress' | 'completed'
  agreementRate: number
  verdict: string
  reviewedAt: number | null
}

// ---- Statistics ----
export interface AdminStatsSummary {
  period: string             // 'daily' | 'weekly' | 'monthly'
  totalUsers: number
  newUsers: number
  totalReports: number
  totalOrders: number
  totalRevenue: number
  totalCases: number
  totalKnowledgeEntries: number
  avgTrustScore: number
  avgSatisfaction: number
}

// ---- System Log ----
export interface AdminSystemLog {
  id: string
  action: AuditAction
  actorId: string
  actorName: string
  resource: string           // 'user' | 'order' | 'report' | 'case' | 'knowledge' | 'system'
  resourceId: string
  details: string
  severity: LogSeverity
  ipAddress: string
  createdAt: number
}

// ---- Permission ----
export interface AdminPermission {
  id: string
  name: string
  description: string
  module: string             // 'user' | 'order' | 'report' | 'case' | 'knowledge' | 'expert' | 'stats' | 'system'
  actions: AuditAction[]
  requiredRole: 'super_admin' | 'admin' | 'operator' | 'viewer'
}

// ---- API Key ----
export interface AdminApiKey {
  id: string
  key: string
  name: string
  userId: string
  permissions: string[]
  rateLimit: number          // requests per minute
  totalCalls: number
  lastUsedAt: number | null
  expiresAt: number | null
  status: EntityStatus
  createdAt: number
}

// ---- Dashboard Config ----
export interface AdminDashboardConfig {
  refreshInterval: number
  defaultPeriod: string
  panels: string[]
  charts: string[]
  exportedFormats: string[]
}

export const ADMIN_SCHEMA_VERSION = '1.0.0'

export const ADMIN_MODULES: Array<{module: string; description: string; permissions: string[]}> = [
  { module: 'user', description: '用户管理', permissions: ['user:read', 'user:create', 'user:update', 'user:delete'] },
  { module: 'order', description: '订单管理', permissions: ['order:read', 'order:update', 'order:refund'] },
  { module: 'report', description: '报告管理', permissions: ['report:read', 'report:update', 'report:delete', 'report:export'] },
  { module: 'case', description: '案例管理', permissions: ['case:read', 'case:create', 'case:update', 'case:delete'] },
  { module: 'knowledge', description: '知识库管理', permissions: ['knowledge:read', 'knowledge:create', 'knowledge:update', 'knowledge:delete'] },
  { module: 'expert', description: '专家审核管理', permissions: ['expert:read', 'expert:update', 'expert:approve', 'expert:reject'] },
  { module: 'stats', description: '数据统计', permissions: ['stats:read', 'stats:export'] },
  { module: 'system', description: '系统管理', permissions: ['system:read', 'system:update', 'system:config', 'system:logs'] },
]

export const ROLE_HIERARCHY: string[] = ['viewer', 'operator', 'admin', 'super_admin']
