/**
 * XuanFengMen Shared Domain Definitions
 *
 * 本目录是玄风门所有枚举、状态码、常量定义的 **唯一来源（Single Source of Truth）**。
 * 所有 API、数据库 Migration、前端组件、Dashboard、Hooks 必须统一引用这里。
 *
 * 以后新增枚举，只允许修改本目录。
 * 禁止在 API 路由、组件、Hook 中单独定义重复的枚举值。
 *
 * Version: 2.1.0
 * Updated: 2026-07-18
 * Product: PRODUCT_CONSTITUTION.md v2.2.0
 * Scope: Enterprise Domain Platform
 */

// ─────────────────────────────────────────────
//  1. AnalysisType — 分析类型
// ─────────────────────────────────────────────

/**
 * analysis_history.analysis_type 的唯一枚举定义。
 * 数据库 CHECK 约束、API 校验、前端展示统一引用此值。
 */
export enum AnalysisType {
  /** V1.x 基础分析 */
  BASIC = 'basic',
  /** V1.x 完整分析 */
  FULL = 'full',
  /** V1.x AI 分析 */
  AI = 'ai',
  /** V1.x 合盘分析 */
  COMPATIBILITY = 'compatibility',
  /** V5.0 GA Professional 专业报告 */
  PRO = 'pro',
  /** 旧版数据迁移标记（从 localStorage 迁入） */
  LEGACY = 'legacy',
  /** 预留：未来分析类型 */
  FUTURE = 'future',
}

/** AnalysisType 全部值数组，用于数据库 CHECK 约束和 API 校验 */
export const ANALYSIS_TYPE_VALUES: string[] = Object.values(AnalysisType)

// ─────────────────────────────────────────────
//  2. FeedbackStatus — 反馈状态
// ─────────────────────────────────────────────

/**
 * feedback.status 的唯一枚举定义。
 * 数据库 CHECK 约束、API 状态机、前端展示统一引用此值。
 *
 * 状态流转：
 *   open        → reviewed, resolved, closed
 *   processing  → reviewed, resolved, closed
 *   reviewed    → accepted, rejected, resolved, closed
 *   accepted    → resolved, closed
 *   rejected    → resolved, closed
 *   resolved    → closed
 *   closed      → (终点)
 */
export enum FeedbackStatus {
  /** 新建，待处理 */
  OPEN = 'open',
  /** 处理中（运营人员认领后） */
  PROCESSING = 'processing',
  /** 已审核（运营人员审核完毕） */
  REVIEWED = 'reviewed',
  /** 审核通过（专家确认有效） */
  ACCEPTED = 'accepted',
  /** 审核拒绝（专家确认无效） */
  REJECTED = 'rejected',
  /** 已解决（问题已处理） */
  RESOLVED = 'resolved',
  /** 已关闭（流程结束） */
  CLOSED = 'closed',
}

/** FeedbackStatus 全部值数组 */
export const FEEDBACK_STATUS_VALUES: string[] = Object.values(FeedbackStatus)

/** 合法状态流转定义（用于 API PATCH 校验） */
export const FEEDBACK_STATUS_TRANSITIONS: Record<string, string[]> = {
  [FeedbackStatus.OPEN]: [FeedbackStatus.REVIEWED, FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED],
  [FeedbackStatus.PROCESSING]: [FeedbackStatus.REVIEWED, FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED],
  [FeedbackStatus.REVIEWED]: [FeedbackStatus.ACCEPTED, FeedbackStatus.REJECTED, FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED],
  [FeedbackStatus.ACCEPTED]: [FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED],
  [FeedbackStatus.REJECTED]: [FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED],
  [FeedbackStatus.RESOLVED]: [FeedbackStatus.CLOSED],
  [FeedbackStatus.CLOSED]: [],
}

/** 终态集合（不可再流转） */
export const FEEDBACK_TERMINAL_STATUSES: string[] = [FeedbackStatus.CLOSED]

// ─────────────────────────────────────────────
//  3. FeedbackType — 反馈类型
// ─────────────────────────────────────────────

/**
 * feedback.type 的唯一枚举定义。
 */
export enum FeedbackType {
  /** Bug 报告 */
  BUG = 'bug',
  /** 功能建议 */
  FEATURE = 'feature',
  /** 准确度反馈（专业报告） */
  ACCURACY = 'accuracy',
  /** 其他 */
  OTHER = 'other',
}

export const FEEDBACK_TYPE_VALUES: string[] = Object.values(FeedbackType)

// ─────────────────────────────────────────────
//  4. FeedbackSeverity — 反馈严重程度
// ─────────────────────────────────────────────

/**
 * feedback.severity 的唯一枚举定义。
 */
export enum FeedbackSeverity {
  /** 低（评分 4~5） */
  LOW = 'low',
  /** 普通（评分 3） */
  NORMAL = 'normal',
  /** 高（评分 2） */
  HIGH = 'high',
  /** 严重（评分 1） */
  CRITICAL = 'critical',
}

export const FEEDBACK_SEVERITY_VALUES: string[] = Object.values(FeedbackSeverity)

/** 根据 overall_rating 映射 severity */
export function ratingToSeverity(rating: number): FeedbackSeverity {
  if (rating >= 4) return FeedbackSeverity.LOW
  if (rating >= 3) return FeedbackSeverity.NORMAL
  if (rating >= 2) return FeedbackSeverity.HIGH
  return FeedbackSeverity.CRITICAL
}

// ─────────────────────────────────────────────
//  5. FeedbackSource — 反馈来源
// ─────────────────────────────────────────────

/**
 * feedback.source 的唯一枚举定义（0003_migration 新增）。
 */
export enum FeedbackSource {
  /** 通用反馈（非报告关联） */
  GENERAL = 'general',
  /** 报告反馈（关联专业报告） */
  REPORT = 'report',
}

export const FEEDBACK_SOURCE_VALUES: string[] = Object.values(FeedbackSource)

// ─────────────────────────────────────────────
//  6. UserTier — 用户等级
// ─────────────────────────────────────────────

/**
 * users.membership_tier / feedback.user_tier 的唯一枚举定义。
 */
export enum UserTier {
  /** 免费用户 */
  FREE = 'free',
  /** 基础会员 */
  BASIC = 'basic',
  /** 高级会员 */
  PREMIUM = 'premium',
  /** VIP 用户 */
  VIP = 'vip',
}

export const USER_TIER_VALUES: string[] = Object.values(UserTier)

// ─────────────────────────────────────────────
//  7. VersionRegistry — 引擎版本注册表
// ─────────────────────────────────────────────

/**
 * 引擎版本信息。
 */
export interface VersionInfo {
  version: string
  label: string
  status: 'current' | 'legacy' | 'supported' | 'minimum_compatible' | 'deprecated' | 'removed'
  /** Format: 'YYYY-MM' or null */
  deprecatedAt: string | null
  /** Format: 'YYYY-MM' or null */
  removedAt: string | null
  /** Replacement version string or null */
  replacement: string | null
}

/**
 * 全局引擎版本注册表。
 * 所有报告生成、历史保存、反馈关联统一引用此值。
 */
export const VERSION_REGISTRY: Record<string, VersionInfo> = {
  'V5.0 GA': {
    version: 'V5.0 GA',
    label: 'Professional Engine GA',
    status: 'current',
    deprecatedAt: null,
    removedAt: null,
    replacement: null,
  },
  'pre-V5.0': {
    version: 'pre-V5.0',
    label: 'Legacy Engine',
    status: 'deprecated',
    deprecatedAt: '2026-12',
    removedAt: '2027-06',
    replacement: 'V5.0 GA',
  },
}

/** Current engine version (convenience accessor) */
export const ENGINE_VERSION = VERSION_REGISTRY['V5.0 GA'].version

/** Legacy engine version marker */
export const ENGINE_VERSION_LEGACY = VERSION_REGISTRY['pre-V5.0'].version

/** All supported versions */
export const SUPPORTED_VERSIONS: string[] = Object.values(VERSION_REGISTRY)
  .filter(v => v.status === 'current' || v.status === 'supported')
  .map(v => v.version)

/** Minimum compatible version */
export const MINIMUM_COMPATIBLE_VERSION: string | undefined = Object.values(VERSION_REGISTRY)
  .find(v => v.status === 'minimum_compatible')?.version

/** All version strings */
export const ALL_VERSIONS: string[] = Object.keys(VERSION_REGISTRY)

/** All deprecated versions */
export const DEPRECATED_VERSIONS: string[] = Object.values(VERSION_REGISTRY)
  .filter(v => v.status === 'deprecated')
  .map(v => v.version)

/** All removed versions */
export const REMOVED_VERSIONS: string[] = Object.values(VERSION_REGISTRY)
  .filter(v => v.status === 'removed')
  .map(v => v.version)

/** Check if a version is deprecated or removed */
export function isVersionDeprecated(version: string): boolean {
  const info = VERSION_REGISTRY[version]
  return !!info && (info.status === 'deprecated' || info.status === 'removed')
}

// ─────────────────────────────────────────────
//  8. ReportSource — 报告来源
// ─────────────────────────────────────────────

/**
 * 报告数据来源标记。
 */
export enum ReportSource {
  /** 在线实时生成 */
  ONLINE = 'online',
  /** 从 localStorage 迁入 */
  LOCAL_MIGRATION = 'local_migration',
  /** 从其他渠道导入 */
  IMPORT = 'import',
}

export const REPORT_SOURCE_VALUES: string[] = Object.values(ReportSource)

// ─────────────────────────────────────────────
//  9. Role — 用户角色
// ─────────────────────────────────────────────

/**
 * 用户角色定义。
 */
export enum Role {
  /** 普通用户 */
  USER = 'user',
  /** 运营人员 */
  OPERATOR = 'operator',
  /** 专家（命理师） */
  EXPERT = 'expert',
  /** 管理员 */
  ADMIN = 'admin',
  /** 服务角色（Supabase service_role） */
  SERVICE_ROLE = 'service_role',
}

export const ROLE_VALUES: string[] = Object.values(Role)

// ─────────────────────────────────────────────
//  10. Permission — 权限标识
// ─────────────────────────────────────────────

/**
 * 细粒度权限标识。
 * 用于 API 中间件和前端路由守卫。
 */
export enum Permission {
  /** 生成专业报告 */
  REPORT_GENERATE = 'report:generate',
  /** 查看专业报告 */
  REPORT_VIEW = 'report:view',
  /** 导出专业报告 */
  REPORT_EXPORT = 'report:export',
  /** 提交反馈 */
  FEEDBACK_SUBMIT = 'feedback:submit',
  /** 管理反馈 */
  FEEDBACK_MANAGE = 'feedback:manage',
  /** 审核反馈 */
  FEEDBACK_REVIEW = 'feedback:review',
  /** 查看案例库 */
  CASE_VIEW = 'case:view',
  /** 管理案例库 */
  CASE_MANAGE = 'case:manage',
  /** 提交专家验证 */
  EXPERT_REVIEW_SUBMIT = 'expert:submit',
  /** 管理专家验证 */
  EXPERT_REVIEW_MANAGE = 'expert:manage',
  /** 查看 Dashboard */
  DASHBOARD_VIEW = 'dashboard:view',
  /** 管理 Dashboard */
  DASHBOARD_MANAGE = 'dashboard:manage',
  /** 查看用户列表 */
  USER_VIEW = 'user:view',
  /** 管理用户 */
  USER_MANAGE = 'user:manage',
}

export const PERMISSION_VALUES: string[] = Object.values(Permission)

// ─────────────────────────────────────────────
//  11. PaymentStatus — 支付状态
// ─────────────────────────────────────────────

/**
 * payments.status 的唯一枚举定义。
 * 覆盖 v11_payments 表的支付生命周期。
 */
export enum PaymentStatus {
  /** 待支付 */
  PENDING = 'pending',
  /** 已支付 */
  PAID = 'paid',
  /** 支付失败 */
  FAILED = 'failed',
  /** 已退款 */
  REFUNDED = 'refunded',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

export const PAYMENT_STATUS_VALUES: string[] = Object.values(PaymentStatus)

// ─────────────────────────────────────────────
//  12. AnalysisStatus — 分析状态
// ─────────────────────────────────────────────

/**
 * analysis_history.status 的唯一枚举定义。
 */
export enum AnalysisStatus {
  /** 等待处理 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 失败 */
  FAILED = 'failed',
}

export const ANALYSIS_STATUS_VALUES: string[] = Object.values(AnalysisStatus)

// ─────────────────────────────────────────────
//  13. Gender — 性别
// ─────────────────────────────────────────────

/**
 * 性别枚举。
 * API 层使用 API 值，引擎层使用 CN 值。
 */
export const Gender = {
  /** API: male, Engine: 男 */
  MALE_API: 'male',
  MALE_CN: '\u7537',
  /** API: female, Engine: 女 */
  FEMALE_API: 'female',
  FEMALE_CN: '\u5973',
} as const

export const GENDER_API_VALUES = [Gender.MALE_API, Gender.FEMALE_API]

/** API gender → Engine gender 映射 */
export function genderApiToCn(api: string): string {
  return api === Gender.MALE_API ? Gender.MALE_CN : Gender.FEMALE_CN
}

/** Engine gender → API gender 映射 */
export function genderCnToApi(cn: string): string {
  return cn === Gender.MALE_CN ? Gender.MALE_API : Gender.FEMALE_API
}

/** Display gender for UI (CN label) */
export function genderDisplay(gender: string): string {
  if (gender === Gender.MALE_API || gender === Gender.MALE_CN) return Gender.MALE_CN
  if (gender === Gender.FEMALE_API || gender === Gender.FEMALE_CN) return Gender.FEMALE_CN
  return '未知'
}

/** Engine value for Professional Engine consumption */
export function genderEngineValue(gender: string): string {
  if (gender === Gender.MALE_API || gender === Gender.MALE_CN) return Gender.MALE_CN
  if (gender === Gender.FEMALE_API || gender === Gender.FEMALE_CN) return Gender.FEMALE_CN
  return '未知'
}

/** Validate gender value (accepts both API and CN values) */
export function isValidGender(value: string): boolean {
  return value === Gender.MALE_API
    || value === Gender.MALE_CN
    || value === Gender.FEMALE_API
    || value === Gender.FEMALE_CN
}

// ─────────────────────────────────────────────
//  14. 辅助函数
// ─────────────────────────────────────────────

/**
 * 检查值是否属于指定的枚举值集合。
 * 用于 API 参数校验，替代硬编码字符串数组。
 */
export function isValidEnumValue(value: unknown, validValues: string[]): value is string {
  return typeof value === 'string' && validValues.indexOf(value) !== -1
}

// ─────────────────────────────────────────────
//  15. OrderStatus — 订单状态
// ─────────────────────────────────────────────

/**
 * orders.status 的唯一枚举定义。
 * 订单拥有独立的生命周期，与支付状态分离。
 */
export enum OrderStatus {
  /** 待支付 */
  PENDING = 'pending',
  /** 已支付 */
  PAID = 'paid',
  /** 已取消 */
  CANCELLED = 'cancelled',
  /** 已过期 */
  EXPIRED = 'expired',
  /** 已退款 */
  REFUNDED = 'refunded',
}

export const ORDER_STATUS_VALUES: string[] = Object.values(OrderStatus)

// ─────────────────────────────────────────────
//  16. RefundStatus — 退款状态
// ─────────────────────────────────────────────

/**
 * refunds.status 的唯一枚举定义。
 * 退款拥有独立的生命周期。
 */
export enum RefundStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 退款成功 */
  SUCCEEDED = 'succeeded',
  /** 退款失败 */
  FAILED = 'failed',
}

export const REFUND_STATUS_VALUES: string[] = Object.values(RefundStatus)

// ─────────────────────────────────────────────
//  17. Capability — 能力标识
// ─────────────────────────────────────────────

/**
 * 粗粒度能力标识，介于 Role 和 Permission 之间。
 * 用于运营后台的能力控制。
 */
export enum Capability {
  /** 生成报告 */
  GENERATE_REPORT = 'generate_report',
  /** 查看历史记录 */
  VIEW_HISTORY = 'view_history',
  /** 使用高级功能 */
  USE_PREMIUM = 'use_premium',
  /** 专家审核 */
  EXPERT_REVIEW = 'expert_review',
  /** Dashboard 访问 */
  DASHBOARD_ACCESS = 'dashboard_access',
  /** 管理后台 */
  ADMIN_MANAGE = 'admin_manage',
}

export const CAPABILITY_VALUES: string[] = Object.values(Capability)

/** Role → Capability 映射 */
export const ROLE_CAPABILITIES: Record<string, Capability[]> = {
  [Role.USER]: [Capability.GENERATE_REPORT, Capability.VIEW_HISTORY],
  [Role.OPERATOR]: [Capability.VIEW_HISTORY, Capability.EXPERT_REVIEW, Capability.DASHBOARD_ACCESS],
  [Role.EXPERT]: [Capability.VIEW_HISTORY, Capability.EXPERT_REVIEW],
  [Role.ADMIN]: [Capability.GENERATE_REPORT, Capability.VIEW_HISTORY, Capability.USE_PREMIUM, Capability.EXPERT_REVIEW, Capability.DASHBOARD_ACCESS, Capability.ADMIN_MANAGE],
  [Role.SERVICE_ROLE]: CAPABILITY_VALUES as Capability[],
}

/** Capability → Permission 映射 */
export const CAPABILITY_PERMISSIONS: Record<string, Permission[]> = {
  [Capability.GENERATE_REPORT]: [Permission.REPORT_GENERATE, Permission.REPORT_VIEW],
  [Capability.VIEW_HISTORY]: [Permission.REPORT_VIEW],
  [Capability.USE_PREMIUM]: [Permission.REPORT_GENERATE, Permission.REPORT_EXPORT],
  [Capability.EXPERT_REVIEW]: [Permission.EXPERT_REVIEW_SUBMIT, Permission.FEEDBACK_SUBMIT, Permission.CASE_VIEW],
  [Capability.DASHBOARD_ACCESS]: [Permission.DASHBOARD_VIEW],
  [Capability.ADMIN_MANAGE]: [Permission.DASHBOARD_MANAGE, Permission.FEEDBACK_MANAGE, Permission.FEEDBACK_REVIEW, Permission.CASE_MANAGE, Permission.EXPERT_REVIEW_MANAGE, Permission.USER_VIEW, Permission.USER_MANAGE],
}

// ─────────────────────────────────────────────
//  18. Dictionary — 字典层
// ─────────────────────────────────────────────

/**
 * 字典条目类型定义。
 */
export interface DictionaryEntry {
  value: string
  /** Chinese label */
  labelZh: string
  /** English label (reserved for future i18n) */
  labelEn: string
  /** Chinese description */
  descriptionZh: string
  /** English description (reserved for future i18n) */
  descriptionEn: string
  color: string
  icon: string
  sortOrder: number
}

/** UserTier 字典 */
export const USER_TIER_DICTIONARY: DictionaryEntry[] = [
  { value: UserTier.FREE, labelZh: '免费版', labelEn: 'Free', descriptionZh: '基础功能，有限次数', descriptionEn: 'Basic features with limited usage', color: '#9CA3AF', icon: 'user', sortOrder: 1 },
  { value: UserTier.BASIC, labelZh: '基础会员', labelEn: 'Basic', descriptionZh: '解锁基础分析功能', descriptionEn: 'Unlock basic analysis features', color: '#3B82F6', icon: 'star', sortOrder: 2 },
  { value: UserTier.PREMIUM, labelZh: '高级会员', labelEn: 'Premium', descriptionZh: '完整分析 + AI 分析', descriptionEn: 'Full analysis + AI analysis', color: '#8B5CF6', icon: 'crown', sortOrder: 3 },
  { value: UserTier.VIP, labelZh: 'VIP', labelEn: 'VIP', descriptionZh: '全部功能 + 专属服务', descriptionEn: 'All features + exclusive service', color: '#F59E0B', icon: 'gem', sortOrder: 4 },
]

/** AnalysisType 字典 */
export const ANALYSIS_TYPE_DICTIONARY: DictionaryEntry[] = [
  { value: AnalysisType.BASIC, labelZh: '基础分析', labelEn: 'Basic Analysis', descriptionZh: 'V1.x 基础分析', descriptionEn: 'V1.x basic analysis', color: '#3B82F6', icon: 'bar-chart', sortOrder: 1 },
  { value: AnalysisType.FULL, labelZh: '完整分析', labelEn: 'Full Analysis', descriptionZh: 'V1.x 完整分析', descriptionEn: 'V1.x full analysis', color: '#6366F1', icon: 'file-text', sortOrder: 2 },
  { value: AnalysisType.AI, labelZh: 'AI分析', labelEn: 'AI Analysis', descriptionZh: 'V1.x AI 分析', descriptionEn: 'V1.x AI analysis', color: '#8B5CF6', icon: 'cpu', sortOrder: 3 },
  { value: AnalysisType.COMPATIBILITY, labelZh: '合盘分析', labelEn: 'Compatibility Analysis', descriptionZh: 'V1.x 合盘分析', descriptionEn: 'V1.x compatibility analysis', color: '#EC4899', icon: 'heart', sortOrder: 4 },
  { value: AnalysisType.PRO, labelZh: '专业报告', labelEn: 'Professional Report', descriptionZh: 'V5.0 GA Professional 专业报告', descriptionEn: 'V5.0 GA Professional report', color: '#F59E0B', icon: 'award', sortOrder: 5 },
  { value: AnalysisType.LEGACY, labelZh: '历史数据', labelEn: 'Legacy Data', descriptionZh: '旧版数据迁移标记', descriptionEn: 'Legacy data migration marker', color: '#9CA3AF', icon: 'archive', sortOrder: 6 },
  { value: AnalysisType.FUTURE, labelZh: '未来扩展', labelEn: 'Future Expansion', descriptionZh: '预留分析类型', descriptionEn: 'Reserved analysis type', color: '#6B7280', icon: 'rocket', sortOrder: 7 },
]

/** FeedbackStatus 字典 */
export const FEEDBACK_STATUS_DICTIONARY: DictionaryEntry[] = [
  { value: FeedbackStatus.OPEN, labelZh: '待处理', labelEn: 'Open', descriptionZh: '新建，待处理', descriptionEn: 'New, pending', color: '#3B82F6', icon: 'circle', sortOrder: 1 },
  { value: FeedbackStatus.PROCESSING, labelZh: '处理中', labelEn: 'Processing', descriptionZh: '运营人员认领后', descriptionEn: 'Claimed by operator', color: '#F59E0B', icon: 'loader', sortOrder: 2 },
  { value: FeedbackStatus.REVIEWED, labelZh: '已审核', labelEn: 'Reviewed', descriptionZh: '运营人员审核完毕', descriptionEn: 'Reviewed by operator', color: '#8B5CF6', icon: 'check-square', sortOrder: 3 },
  { value: FeedbackStatus.ACCEPTED, labelZh: '已通过', labelEn: 'Accepted', descriptionZh: '专家确认有效', descriptionEn: 'Confirmed valid by expert', color: '#10B981', icon: 'check-circle', sortOrder: 4 },
  { value: FeedbackStatus.REJECTED, labelZh: '已拒绝', labelEn: 'Rejected', descriptionZh: '专家确认无效', descriptionEn: 'Confirmed invalid by expert', color: '#EF4444', icon: 'x-circle', sortOrder: 5 },
  { value: FeedbackStatus.RESOLVED, labelZh: '已解决', labelEn: 'Resolved', descriptionZh: '问题已处理', descriptionEn: 'Issue resolved', color: '#06B6D4', icon: 'check-circle-2', sortOrder: 6 },
  { value: FeedbackStatus.CLOSED, labelZh: '已关闭', labelEn: 'Closed', descriptionZh: '流程结束', descriptionEn: 'Process ended', color: '#6B7280', icon: 'lock', sortOrder: 7 },
]

/** Gender 字典 */
export const GENDER_DICTIONARY: DictionaryEntry[] = [
  { value: Gender.MALE_API, labelZh: '男', labelEn: 'Male', descriptionZh: '男性', descriptionEn: 'Male', color: '#3B82F6', icon: 'user', sortOrder: 1 },
  { value: Gender.FEMALE_API, labelZh: '女', labelEn: 'Female', descriptionZh: '女性', descriptionEn: 'Female', color: '#EC4899', icon: 'user', sortOrder: 2 },
]

/** FeedbackSeverity 字典 */
export const FEEDBACK_SEVERITY_DICTIONARY: DictionaryEntry[] = [
  { value: FeedbackSeverity.LOW, labelZh: '低', labelEn: 'Low', descriptionZh: '评分 4~5', descriptionEn: 'Rating 4~5', color: '#10B981', icon: 'arrow-down', sortOrder: 1 },
  { value: FeedbackSeverity.NORMAL, labelZh: '普通', labelEn: 'Normal', descriptionZh: '评分 3', descriptionEn: 'Rating 3', color: '#F59E0B', icon: 'minus', sortOrder: 2 },
  { value: FeedbackSeverity.HIGH, labelZh: '高', labelEn: 'High', descriptionZh: '评分 2', descriptionEn: 'Rating 2', color: '#F97316', icon: 'arrow-up', sortOrder: 3 },
  { value: FeedbackSeverity.CRITICAL, labelZh: '严重', labelEn: 'Critical', descriptionZh: '评分 1', descriptionEn: 'Rating 1', color: '#EF4444', icon: 'alert-triangle', sortOrder: 4 },
]

/** FeedbackType 字典 */
export const FEEDBACK_TYPE_DICTIONARY: DictionaryEntry[] = [
  { value: FeedbackType.BUG, labelZh: 'Bug 报告', labelEn: 'Bug Report', descriptionZh: '程序错误或异常', descriptionEn: 'Program error or exception', color: '#EF4444', icon: 'bug', sortOrder: 1 },
  { value: FeedbackType.FEATURE, labelZh: '功能建议', labelEn: 'Feature Request', descriptionZh: '新功能或改进建议', descriptionEn: 'New feature or improvement suggestion', color: '#3B82F6', icon: 'lightbulb', sortOrder: 2 },
  { value: FeedbackType.ACCURACY, labelZh: '准确度反馈', labelEn: 'Accuracy Feedback', descriptionZh: '专业报告准确度', descriptionEn: 'Professional report accuracy', color: '#8B5CF6', icon: 'target', sortOrder: 3 },
  { value: FeedbackType.OTHER, labelZh: '其他', labelEn: 'Other', descriptionZh: '其他类型反馈', descriptionEn: 'Other type of feedback', color: '#6B7280', icon: 'message-square', sortOrder: 4 },
]

/** PaymentStatus 字典 */
export const PAYMENT_STATUS_DICTIONARY: DictionaryEntry[] = [
  { value: PaymentStatus.PENDING, labelZh: '待支付', labelEn: 'Pending', descriptionZh: '等待用户支付', descriptionEn: 'Waiting for user payment', color: '#F59E0B', icon: 'clock', sortOrder: 1 },
  { value: PaymentStatus.PAID, labelZh: '已支付', labelEn: 'Paid', descriptionZh: '支付成功', descriptionEn: 'Payment succeeded', color: '#10B981', icon: 'check-circle', sortOrder: 2 },
  { value: PaymentStatus.FAILED, labelZh: '支付失败', labelEn: 'Failed', descriptionZh: '支付过程出错', descriptionEn: 'Payment error occurred', color: '#EF4444', icon: 'x-circle', sortOrder: 3 },
  { value: PaymentStatus.REFUNDED, labelZh: '已退款', labelEn: 'Refunded', descriptionZh: '已退款给用户', descriptionEn: 'Refunded to user', color: '#8B5CF6', icon: 'undo', sortOrder: 4 },
  { value: PaymentStatus.CANCELLED, labelZh: '已取消', labelEn: 'Cancelled', descriptionZh: '用户取消支付', descriptionEn: 'Payment cancelled by user', color: '#6B7280', icon: 'ban', sortOrder: 5 },
]

/** OrderStatus 字典 */
export const ORDER_STATUS_DICTIONARY: DictionaryEntry[] = [
  { value: OrderStatus.PENDING, labelZh: '待支付', labelEn: 'Pending', descriptionZh: '订单等待支付', descriptionEn: 'Order waiting for payment', color: '#F59E0B', icon: 'clock', sortOrder: 1 },
  { value: OrderStatus.PAID, labelZh: '已支付', labelEn: 'Paid', descriptionZh: '订单已支付', descriptionEn: 'Order paid', color: '#10B981', icon: 'check-circle', sortOrder: 2 },
  { value: OrderStatus.CANCELLED, labelZh: '已取消', labelEn: 'Cancelled', descriptionZh: '订单已取消', descriptionEn: 'Order cancelled', color: '#6B7280', icon: 'ban', sortOrder: 3 },
  { value: OrderStatus.EXPIRED, labelZh: '已过期', labelEn: 'Expired', descriptionZh: '订单支付超时', descriptionEn: 'Order payment timed out', color: '#9CA3AF', icon: 'alert-circle', sortOrder: 4 },
  { value: OrderStatus.REFUNDED, labelZh: '已退款', labelEn: 'Refunded', descriptionZh: '订单已退款', descriptionEn: 'Order refunded', color: '#8B5CF6', icon: 'undo', sortOrder: 5 },
]

/** RefundStatus 字典 */
export const REFUND_STATUS_DICTIONARY: DictionaryEntry[] = [
  { value: RefundStatus.PENDING, labelZh: '待处理', labelEn: 'Pending', descriptionZh: '退款申请待处理', descriptionEn: 'Refund request pending', color: '#F59E0B', icon: 'clock', sortOrder: 1 },
  { value: RefundStatus.PROCESSING, labelZh: '处理中', labelEn: 'Processing', descriptionZh: '退款正在处理', descriptionEn: 'Refund being processed', color: '#3B82F6', icon: 'loader', sortOrder: 2 },
  { value: RefundStatus.SUCCEEDED, labelZh: '退款成功', labelEn: 'Succeeded', descriptionZh: '退款已到账', descriptionEn: 'Refund received', color: '#10B981', icon: 'check-circle', sortOrder: 3 },
  { value: RefundStatus.FAILED, labelZh: '退款失败', labelEn: 'Failed', descriptionZh: '退款处理失败', descriptionEn: 'Refund processing failed', color: '#EF4444', icon: 'x-circle', sortOrder: 4 },
]

// ─────────────────────────────────────────────
//  19. Tier Helper Functions — 等级辅助函数
// ─────────────────────────────────────────────

/** Get tier label (default: zh) */
export function getTierLabel(tier: string, locale?: 'zh' | 'en'): string {
  const entry = USER_TIER_DICTIONARY.find(d => d.value === tier)
  return entry ? (locale === 'en' ? entry.labelEn : entry.labelZh) : ''
}

/** 获取用户等级的颜色 */
export function getTierColor(tier: string): string {
  const entry = USER_TIER_DICTIONARY.find(d => d.value === tier)
  return entry ? entry.color : ''
}

/** Get tier description (default: zh) */
export function getTierDescription(tier: string, locale?: 'zh' | 'en'): string {
  const entry = USER_TIER_DICTIONARY.find(d => d.value === tier)
  return entry ? (locale === 'en' ? entry.descriptionEn : entry.descriptionZh) : ''
}

/** 获取用户等级的图标标识 */
export function getTierIcon(tier: string): string {
  const entry = USER_TIER_DICTIONARY.find(d => d.value === tier)
  return entry ? entry.icon : ''
}

/** 获取用户等级的完整字典条目 */
export function getTierInfo(tier: string): DictionaryEntry | undefined {
  return USER_TIER_DICTIONARY.find(d => d.value === tier)
}

// ─────────────────────────────────────────────
//  20. Domain Validators — 领域校验函数
// ─────────────────────────────────────────────

/**
 * Domain 层统一校验函数。
 * 所有 API 参数校验统一使用这些函数，禁止在 API 路由中自行判断。
 */

export type ValidationMode = 'strict' | 'loose'

/**
 * Strict: reject invalid immediately.
 * Loose: attempt auto-correction (case normalization, alias mapping).
 */

export function validateAnalysisType(value: unknown, mode?: ValidationMode): { valid: boolean; value: AnalysisType | null; error?: string; corrected?: boolean } {
  if (typeof value === 'string' && ANALYSIS_TYPE_VALUES.indexOf(value) !== -1) {
    return { valid: true, value: value as AnalysisType, corrected: false }
  }
  if (mode === 'loose' && typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    const match = ANALYSIS_TYPE_VALUES.find(v => v === lower)
    if (match) return { valid: true, value: match as AnalysisType, corrected: true }
  }
  return { valid: false, value: null, error: `Invalid AnalysisType: ${value}` }
}

export function validateFeedbackStatus(value: unknown, mode?: ValidationMode): { valid: boolean; value: FeedbackStatus | null; error?: string; corrected?: boolean } {
  if (typeof value === 'string' && FEEDBACK_STATUS_VALUES.indexOf(value) !== -1) {
    return { valid: true, value: value as FeedbackStatus, corrected: false }
  }
  if (mode === 'loose' && typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    const match = FEEDBACK_STATUS_VALUES.find(v => v === lower)
    if (match) return { valid: true, value: match as FeedbackStatus, corrected: true }
  }
  return { valid: false, value: null, error: `Invalid FeedbackStatus: ${value}` }
}

export function validatePaymentStatus(value: unknown, mode?: ValidationMode): { valid: boolean; value: PaymentStatus | null; error?: string; corrected?: boolean } {
  if (typeof value === 'string' && PAYMENT_STATUS_VALUES.indexOf(value) !== -1) {
    return { valid: true, value: value as PaymentStatus, corrected: false }
  }
  if (mode === 'loose' && typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    const match = PAYMENT_STATUS_VALUES.find(v => v === lower)
    if (match) return { valid: true, value: match as PaymentStatus, corrected: true }
  }
  return { valid: false, value: null, error: `Invalid PaymentStatus: ${value}` }
}

export function validateOrderStatus(value: unknown, mode?: ValidationMode): { valid: boolean; value: OrderStatus | null; error?: string; corrected?: boolean } {
  if (typeof value === 'string' && ORDER_STATUS_VALUES.indexOf(value) !== -1) {
    return { valid: true, value: value as OrderStatus, corrected: false }
  }
  if (mode === 'loose' && typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    const match = ORDER_STATUS_VALUES.find(v => v === lower)
    if (match) return { valid: true, value: match as OrderStatus, corrected: true }
  }
  return { valid: false, value: null, error: `Invalid OrderStatus: ${value}` }
}

export function validateRefundStatus(value: unknown, mode?: ValidationMode): { valid: boolean; value: RefundStatus | null; error?: string; corrected?: boolean } {
  if (typeof value === 'string' && REFUND_STATUS_VALUES.indexOf(value) !== -1) {
    return { valid: true, value: value as RefundStatus, corrected: false }
  }
  if (mode === 'loose' && typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    const match = REFUND_STATUS_VALUES.find(v => v === lower)
    if (match) return { valid: true, value: match as RefundStatus, corrected: true }
  }
  return { valid: false, value: null, error: `Invalid RefundStatus: ${value}` }
}

export function validateUserTier(value: unknown, mode?: ValidationMode): { valid: boolean; value: UserTier | null; error?: string; corrected?: boolean } {
  if (typeof value === 'string' && USER_TIER_VALUES.indexOf(value) !== -1) {
    return { valid: true, value: value as UserTier, corrected: false }
  }
  if (mode === 'loose' && typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    const aliasMap: Record<string, UserTier> = {
      'free': UserTier.FREE, 'pro': UserTier.PREMIUM, 'master': UserTier.VIP,
      'vip': UserTier.VIP, 'basic': UserTier.BASIC, 'premium': UserTier.PREMIUM,
    }
    const mapped = aliasMap[lower]
    if (mapped) {
      return { valid: true, value: mapped, corrected: true }
    }
  }
  return { valid: false, value: null, error: `Invalid UserTier: ${value}` }
}

export function validateGender(value: unknown, mode?: ValidationMode): { valid: boolean; value: string | null; error?: string; corrected?: boolean } {
  if (typeof value !== 'string') {
    return { valid: false, value: null, error: `Invalid Gender: ${value}` }
  }
  // Direct match
  if (isValidGender(value)) {
    return { valid: true, value, corrected: false }
  }
  // Loose mode: case normalization + alias mapping
  if (mode === 'loose') {
    const lower = value.toLowerCase().trim()
    if (lower === 'male' || lower === 'm' || lower === '\u7537') {
      return { valid: true, value: Gender.MALE_API, corrected: true }
    }
    if (lower === 'female' || lower === 'f' || lower === '\u5973') {
      return { valid: true, value: Gender.FEMALE_API, corrected: true }
    }
  }
  return { valid: false, value: null, error: `Invalid Gender: ${value}` }
}

export function validateRole(value: unknown, mode?: ValidationMode): { valid: boolean; value: Role | null; error?: string; corrected?: boolean } {
  if (typeof value === 'string' && ROLE_VALUES.indexOf(value) !== -1) {
    return { valid: true, value: value as Role, corrected: false }
  }
  if (mode === 'loose' && typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    const match = ROLE_VALUES.find(v => v === lower)
    if (match) return { valid: true, value: match as Role, corrected: true }
  }
  return { valid: false, value: null, error: `Invalid Role: ${value}` }
}

// ─────────────────────────────────────────────
//  21. FeatureFlag — 功能开关
// ─────────────────────────────────────────────

/**
 * 功能开关标识。
 * 四级权限体系：Role → Capability → FeatureFlag → Permission
 * 运营后台可通过 FeatureFlag 控制功能开启/关闭/灰度。
 */
export enum FeatureFlag {
  /** AI 解释功能 */
  AI_EXPLAIN = 'ai_explain',
  /** 报告分享功能 */
  REPORT_SHARE = 'report_share',
  /** VIP 专属报告 */
  VIP_REPORT = 'vip_report',
  /** 专家审核功能 */
  EXPERT_REVIEW = 'expert_review',
  /** 案例库功能 */
  CASE_LIBRARY = 'case_library',
  /** 数据导出功能 */
  DATA_EXPORT = 'data_export',
  /** 多语言支持 */
  MULTI_LANG = 'multi_lang',
  /** API 开放平台 */
  API_OPEN_PLATFORM = 'api_open_platform',
}

export const FEATURE_FLAG_VALUES: string[] = Object.values(FeatureFlag)

/** FeatureFlag default configuration */
export interface FeatureFlagConfig {
  enabled: boolean
  /** Optional: percentage rollout (0-100), null = full rollout */
  rolloutPercent: number | null
  /** Optional: allowed roles, null = all roles */
  allowedRoles: string[] | null
  /** Optional: allowed tiers, null = all tiers */
  allowedTiers: string[] | null
}

/** Default feature flag states (can be overridden by DB config) */
export const FEATURE_FLAG_DEFAULTS: Record<string, FeatureFlagConfig> = {
  [FeatureFlag.AI_EXPLAIN]:        { enabled: true,  rolloutPercent: null, allowedRoles: null, allowedTiers: [UserTier.PREMIUM, UserTier.VIP] },
  [FeatureFlag.REPORT_SHARE]:      { enabled: true,  rolloutPercent: null, allowedRoles: null, allowedTiers: null },
  [FeatureFlag.VIP_REPORT]:        { enabled: true,  rolloutPercent: null, allowedRoles: null, allowedTiers: [UserTier.PREMIUM, UserTier.VIP] },
  [FeatureFlag.EXPERT_REVIEW]:     { enabled: false, rolloutPercent: null, allowedRoles: [Role.OPERATOR, Role.EXPERT, Role.ADMIN], allowedTiers: null },
  [FeatureFlag.CASE_LIBRARY]:      { enabled: false, rolloutPercent: null, allowedRoles: [Role.ADMIN, Role.SERVICE_ROLE], allowedTiers: null },
  [FeatureFlag.DATA_EXPORT]:       { enabled: true,  rolloutPercent: null, allowedRoles: [Role.OPERATOR, Role.ADMIN], allowedTiers: [UserTier.PREMIUM, UserTier.VIP] },
  [FeatureFlag.MULTI_LANG]:        { enabled: false, rolloutPercent: 10, allowedRoles: null, allowedTiers: null },
  [FeatureFlag.API_OPEN_PLATFORM]: { enabled: false, rolloutPercent: null, allowedRoles: [Role.ADMIN], allowedTiers: null },
}

/** Capability → FeatureFlag mapping */
export const CAPABILITY_FEATURE_FLAGS: Record<string, FeatureFlag[]> = {
  [Capability.GENERATE_REPORT]: [FeatureFlag.AI_EXPLAIN, FeatureFlag.VIP_REPORT],
  [Capability.EXPERT_REVIEW]: [FeatureFlag.EXPERT_REVIEW, FeatureFlag.CASE_LIBRARY],
  [Capability.ADMIN_MANAGE]: [FeatureFlag.CASE_LIBRARY, FeatureFlag.DATA_EXPORT, FeatureFlag.API_OPEN_PLATFORM],
}

// ─────────────────────────────────────────────
//  21b. MonitoringCategory — 监控日志分类
// ─────────────────────────────────────────────

/**
 * monitoring_logs.category 的唯一枚举定义。
 * 数据库 CHECK 约束、API 写入统一引用此值。
 */
export enum MonitoringCategory {
  /** 前端 Web Vitals */
  WEB_VITAL = 'web_vital',
  /** 前端 JS 异常 */
  JS_ERROR = 'js_error',
  /** API 错误 */
  API_ERROR = 'api_error',
  /** API 慢请求 */
  API_SLOW = 'api_slow',
  /** 未处理异常 */
  UNHANDLED_EXCEPTION = 'unhandled_exception',
  /** 数据库迁移状态 */
  MIGRATION_STATUS = 'migration_status',
  /** 数据库慢查询 */
  SLOW_QUERY = 'slow_query',
  /** PDF 下载记录 */
  PDF_DOWNLOAD = 'pdf_download',
  /** AI 调用记录 */
  AI_USAGE = 'ai_usage',
  /** 分享事件记录 */
  SHARE = 'share',
}

export const MONITORING_CATEGORY_VALUES: string[] = Object.values(MonitoringCategory)

// ─────────────────────────────────────────────
//  22. DomainMetrics — 领域指标定义
// ─────────────────────────────────────────────

/**
 * 领域指标标识。
 * Dashboard、运营统计、事件追踪统一引用此定义。
 * 确保 KPI 指标名称永远唯一。
 */
export enum DomainMetric {
  /** 报告生成 */
  REPORT_GENERATED = 'report_generated',
  /** 报告查看 */
  REPORT_VIEWED = 'report_viewed',
  /** 报告分享 */
  REPORT_SHARED = 'report_shared',
  /** 报告保存 */
  REPORT_SAVED = 'report_saved',
  /** 报告反馈 */
  REPORT_FEEDBACK = 'report_feedback',
  /** 支付成功 */
  PAY_SUCCESS = 'pay_success',
  /** 支付失败 */
  PAY_FAILED = 'pay_failed',
  /** 用户登录 */
  USER_LOGIN = 'user_login',
  /** 用户注册 */
  USER_REGISTER = 'user_register',
  /** 反馈提交 */
  FEEDBACK_SUBMITTED = 'feedback_submitted',
  /** 专家审核 */
  EXPERT_REVIEW_COMPLETED = 'expert_review_completed',
  /** 案例入库 */
  CASE_CREATED = 'case_created',
  /** 会员升级 */
  MEMBERSHIP_UPGRADED = 'membership_upgraded',
  /** Dashboard 访问 */
  DASHBOARD_ACCESSED = 'dashboard_accessed',
}

export const DOMAIN_METRIC_VALUES: string[] = Object.values(DomainMetric)

/** Metric metadata */
export interface MetricDefinition {
  key: DomainMetric
  labelZh: string
  labelEn: string
  category: 'report' | 'payment' | 'user' | 'feedback' | 'expert' | 'membership' | 'dashboard'
  unit: string
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  { key: DomainMetric.REPORT_GENERATED,         labelZh: '报告生成量',      labelEn: 'Reports Generated',         category: 'report',     unit: 'count' },
  { key: DomainMetric.REPORT_VIEWED,            labelZh: '报告查看量',      labelEn: 'Reports Viewed',            category: 'report',     unit: 'count' },
  { key: DomainMetric.REPORT_SHARED,            labelZh: '报告分享量',      labelEn: 'Reports Shared',            category: 'report',     unit: 'count' },
  { key: DomainMetric.REPORT_SAVED,             labelZh: '报告保存量',      labelEn: 'Reports Saved',             category: 'report',     unit: 'count' },
  { key: DomainMetric.REPORT_FEEDBACK,          labelZh: '报告反馈量',      labelEn: 'Report Feedbacks',          category: 'report',     unit: 'count' },
  { key: DomainMetric.PAY_SUCCESS,              labelZh: '支付成功',        labelEn: 'Payment Success',            category: 'payment',    unit: 'count' },
  { key: DomainMetric.PAY_FAILED,               labelZh: '支付失败',        labelEn: 'Payment Failed',             category: 'payment',    unit: 'count' },
  { key: DomainMetric.USER_LOGIN,               labelZh: '用户登录',        labelEn: 'User Logins',                category: 'user',       unit: 'count' },
  { key: DomainMetric.USER_REGISTER,            labelZh: '用户注册',        labelEn: 'User Registrations',         category: 'user',       unit: 'count' },
  { key: DomainMetric.FEEDBACK_SUBMITTED,       labelZh: '反馈提交量',      labelEn: 'Feedbacks Submitted',        category: 'feedback',   unit: 'count' },
  { key: DomainMetric.EXPERT_REVIEW_COMPLETED,  labelZh: '专家审核量',      labelEn: 'Expert Reviews Completed',  category: 'expert',     unit: 'count' },
  { key: DomainMetric.CASE_CREATED,             labelZh: '案例入库量',      labelEn: 'Cases Created',              category: 'expert',     unit: 'count' },
  { key: DomainMetric.MEMBERSHIP_UPGRADED,      labelZh: '会员升级量',      labelEn: 'Membership Upgrades',        category: 'membership', unit: 'count' },
  { key: DomainMetric.DASHBOARD_ACCESSED,       labelZh: 'Dashboard 访问', labelEn: 'Dashboard Accesses',       category: 'dashboard',  unit: 'count' },
]

export function getMetricLabel(metric: DomainMetric, locale?: 'zh' | 'en'): string {
  const def = METRIC_DEFINITIONS.find(d => d.key === metric)
  return def ? (locale === 'en' ? def.labelEn : def.labelZh) : ''
}

export function getMetricsByCategory(category: MetricDefinition['category']): MetricDefinition[] {
  return METRIC_DEFINITIONS.filter(d => d.category === category)
}

// ─────────────────────────────────────────────
//  23. DomainEvent — 领域事件定义
// ─────────────────────────────────────────────

/**
 * 领域事件标识。
 * Analytics、Dashboard、日志、生命周期统一监听此事件。
 * Event-Driven Architecture 的基础。
 */
export enum DomainEvent {
  /** 报告已创建 */
  REPORT_CREATED = 'report:created',
  /** 报告已查看 */
  REPORT_VIEWED = 'report:viewed',
  /** 报告已保存 */
  REPORT_SAVED = 'report:saved',
  /** 报告已分享 */
  REPORT_SHARED = 'report:shared',
  /** 报告收到反馈 */
  REPORT_FEEDBACK = 'report:feedback',
  /** 支付成功 */
  PAY_SUCCESS = 'pay:success',
  /** 支付失败 */
  PAY_FAILED = 'pay:failed',
  /** 用户登录 */
  USER_LOGIN = 'user:login',
  /** 用户注册 */
  USER_REGISTER = 'user:register',
  /** 反馈已提交 */
  FEEDBACK_SUBMITTED = 'feedback:submitted',
  /** 反馈状态变更 */
  FEEDBACK_STATUS_CHANGED = 'feedback:status_changed',
  /** 专家审核完成 */
  EXPERT_REVIEW_COMPLETED = 'expert:review_completed',
  /** 案例创建 */
  CASE_CREATED = 'case:created',
  /** 会员等级变更 */
  MEMBERSHIP_TIER_CHANGED = 'membership:tier_changed',
}

export const DOMAIN_EVENT_VALUES: string[] = Object.values(DomainEvent)

/** Event metadata */
export interface EventDefinition {
  key: DomainEvent
  labelZh: string
  labelEn: string
  /** Event source layer */
  source: 'api' | 'webhook' | 'system'
  /** Whether this event triggers analytics tracking */
  trackAnalytics: boolean
}

export const EVENT_DEFINITIONS: EventDefinition[] = [
  { key: DomainEvent.REPORT_CREATED,            labelZh: '报告已创建',      labelEn: 'Report Created',            source: 'api',    trackAnalytics: true },
  { key: DomainEvent.REPORT_VIEWED,             labelZh: '报告已查看',      labelEn: 'Report Viewed',             source: 'webhook',trackAnalytics: true },
  { key: DomainEvent.REPORT_SAVED,              labelZh: '报告已保存',      labelEn: 'Report Saved',              source: 'webhook',trackAnalytics: true },
  { key: DomainEvent.REPORT_SHARED,             labelZh: '报告已分享',      labelEn: 'Report Shared',             source: 'webhook',trackAnalytics: true },
  { key: DomainEvent.REPORT_FEEDBACK,           labelZh: '报告收到反馈',    labelEn: 'Report Feedback Received',   source: 'api',    trackAnalytics: true },
  { key: DomainEvent.PAY_SUCCESS,               labelZh: '支付成功',        labelEn: 'Payment Success',            source: 'webhook',trackAnalytics: true },
  { key: DomainEvent.PAY_FAILED,                labelZh: '支付失败',        labelEn: 'Payment Failed',             source: 'webhook',trackAnalytics: true },
  { key: DomainEvent.USER_LOGIN,                labelZh: '用户登录',        labelEn: 'User Login',                 source: 'api',    trackAnalytics: true },
  { key: DomainEvent.USER_REGISTER,             labelZh: '用户注册',        labelEn: 'User Register',              source: 'api',    trackAnalytics: true },
  { key: DomainEvent.FEEDBACK_SUBMITTED,       labelZh: '反馈已提交',      labelEn: 'Feedback Submitted',         source: 'api',    trackAnalytics: true },
  { key: DomainEvent.FEEDBACK_STATUS_CHANGED,   labelZh: '反馈状态变更',    labelEn: 'Feedback Status Changed',   source: 'api',    trackAnalytics: false },
  { key: DomainEvent.EXPERT_REVIEW_COMPLETED,   labelZh: '专家审核完成',    labelEn: 'Expert Review Completed',    source: 'api',    trackAnalytics: true },
  { key: DomainEvent.CASE_CREATED,              labelZh: '案例已创建',      labelEn: 'Case Created',               source: 'api',    trackAnalytics: true },
  { key: DomainEvent.MEMBERSHIP_TIER_CHANGED,   labelZh: '会员等级变更',    labelEn: 'Membership Tier Changed',    source: 'api',    trackAnalytics: true },
]

export function getEventLabel(event: DomainEvent, locale?: 'zh' | 'en'): string {
  const def = EVENT_DEFINITIONS.find(d => d.key === event)
  return def ? (locale === 'en' ? def.labelEn : def.labelZh) : ''
}

// ─────────────────────────────────────────────
//  24. Domain ChangeLog — 变更日志
// ─────────────────────────────────────────────

/**
 * Domain 变更日志。
 * 每次 Domain 修改必须同步更新此日志。
 * API / Dashboard / Migration 全部据此了解变更历史。
 */
export interface DomainChangeLogEntry {
  version: string
  date: string
  type: 'added' | 'modified' | 'deprecated' | 'removed' | 'fixed'
  scope: string
  descriptionZh: string
  descriptionEn: string
}

export const DOMAIN_CHANGELOG: DomainChangeLogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-07-18',
    type: 'added',
    scope: 'Core',
    descriptionZh: '初始版本：14 个枚举/常量定义（AnalysisType, FeedbackStatus, UserTier, Gender, Role, Permission, PaymentStatus 等）',
    descriptionEn: 'Initial release: 14 enum/constant definitions',
  },
  {
    version: '2.0.0',
    date: '2026-07-18',
    type: 'added',
    scope: 'Domain v2',
    descriptionZh: '升级为 Domain v2：新增 OrderStatus, RefundStatus, Capability, VersionRegistry, Dictionary 字典层, Tier Helper, Validator 校验函数',
    descriptionEn: 'Upgraded to Domain v2: added OrderStatus, RefundStatus, Capability, VersionRegistry, Dictionary layer, Tier Helpers, Validators',
  },
  {
    version: '2.1.0',
    date: '2026-07-18',
    type: 'added',
    scope: 'Enterprise',
    descriptionZh: '升级为 Enterprise Domain Platform：新增 FeatureFlag, DomainMetrics, DomainEvent, ChangeLog, Deprecation 机制, i18n 预留, Validator Strict Mode',
    descriptionEn: 'Upgraded to Enterprise Domain Platform: added FeatureFlag, DomainMetrics, DomainEvent, ChangeLog, Deprecation, i18n, Validator Strict Mode',
  },
]
