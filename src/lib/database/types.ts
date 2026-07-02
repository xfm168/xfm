/**
 * 数据库表类型定义
 * 对应 supabase/migrations/0001_init.sql
 *
 * 这些类型描述数据库行结构，供 API 服务端与前端共用。
 * JSONB 字段（chart_data / chart_meta / result / metadata）使用 Record<string, unknown>
 * 占位，调用方可按需 narrow 为具体的算法结构（如 BaZiChart）。
 */

// ────────────────────────────────────────────────
//  枚举字面量类型
// ────────────────────────────────────────────────
export type MembershipTier = 'free' | 'basic' | 'premium' | 'vip'
export type Gender = 'male' | 'female'
export type ZiShiStrategy = 'late' | 'early' | 'gregorian'
export type AnalysisType = 'basic' | 'full' | 'ai' | 'compatibility'
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type FeedbackType = 'bug' | 'feature' | 'accuracy' | 'other'
export type FeedbackSeverity = 'low' | 'normal' | 'high' | 'critical'
export type FeedbackStatus = 'open' | 'processing' | 'resolved' | 'closed'
export type PaymentProductType = 'membership' | 'report' | 'addon' | 'credits'
export type PaymentMethod = 'wechat' | 'alipay' | 'stripe'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled'

// ────────────────────────────────────────────────
//  1. 用户表
// ────────────────────────────────────────────────
export interface User {
  id: string
  username: string | null
  avatar_url: string | null
  membership_tier: MembershipTier
  membership_expires_at: string | null
  total_charts: number
  total_analyses: number
  created_at: string
  updated_at: string
}

/** 新建用户时可传入的字段（不含数据库默认值） */
export interface UserInsert {
  id: string
  username?: string | null
  avatar_url?: string | null
  membership_tier?: MembershipTier
  membership_expires_at?: string | null
  total_charts?: number
  total_analyses?: number
}

// ────────────────────────────────────────────────
//  2. 命盘表
// ────────────────────────────────────────────────
export interface Chart {
  id: string
  user_id: string | null
  name: string | null
  birth_date: string
  birth_time: string
  birth_time_unknown: boolean
  gender: Gender
  birthplace: string | null
  timezone: string | null
  latitude: number | null
  longitude: number | null
  zishi_strategy: ZiShiStrategy
  use_solar_time: boolean
  chart_data: Record<string, unknown>
  chart_meta: Record<string, unknown> | null
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface ChartInsert {
  user_id?: string | null
  name?: string | null
  birth_date: string
  birth_time: string
  birth_time_unknown?: boolean
  gender: Gender
  birthplace?: string | null
  timezone?: string | null
  latitude?: number | null
  longitude?: number | null
  zishi_strategy?: ZiShiStrategy
  use_solar_time?: boolean
  chart_data: Record<string, unknown>
  chart_meta?: Record<string, unknown> | null
  is_public?: boolean
}

// ────────────────────────────────────────────────
//  3. 分析历史表
// ────────────────────────────────────────────────
export interface AnalysisHistory {
  id: string
  user_id: string | null
  chart_id: string | null
  analysis_type: AnalysisType
  result: Record<string, unknown>
  ai_model: string | null
  ai_tokens_used: number | null
  duration_ms: number | null
  status: AnalysisStatus
  error_message: string | null
  created_at: string
}

export interface AnalysisHistoryInsert {
  user_id?: string | null
  chart_id?: string | null
  analysis_type: AnalysisType
  result: Record<string, unknown>
  ai_model?: string | null
  ai_tokens_used?: number | null
  duration_ms?: number | null
  status?: AnalysisStatus
  error_message?: string | null
}

// ────────────────────────────────────────────────
//  4. 用户反馈表
// ────────────────────────────────────────────────
export interface Feedback {
  id: string
  user_id: string | null
  chart_id: string | null
  type: FeedbackType
  severity: FeedbackSeverity
  title: string
  content: string
  contact: string | null
  status: FeedbackStatus
  resolved_at: string | null
  resolved_by: string | null
  resolution: string | null
  created_at: string
  updated_at: string
}

export interface FeedbackInsert {
  user_id?: string | null
  chart_id?: string | null
  type: FeedbackType
  severity?: FeedbackSeverity
  title: string
  content: string
  contact?: string | null
}

// ────────────────────────────────────────────────
//  5. 使用日志表
// ────────────────────────────────────────────────
export interface UsageLog {
  id: number
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  tokens_used: number
  cost_cents: number
  created_at: string
}

export interface UsageLogInsert {
  user_id?: string | null
  action: string
  resource_type?: string | null
  resource_id?: string | null
  ip_address?: string | null
  user_agent?: string | null
  metadata?: Record<string, unknown> | null
  tokens_used?: number
  cost_cents?: number
}

// ────────────────────────────────────────────────
//  6. 支付记录表
// ────────────────────────────────────────────────
export interface Payment {
  id: string
  user_id: string
  order_no: string
  product_type: PaymentProductType
  product_id: string | null
  amount_cents: number
  currency: string
  payment_method: PaymentMethod | null
  payment_provider_order_id: string | null
  payment_provider_transaction_id: string | null
  paid_at: string | null
  status: PaymentStatus
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface PaymentInsert {
  user_id: string
  order_no: string
  product_type: PaymentProductType
  product_id?: string | null
  amount_cents: number
  currency?: string
  payment_method?: PaymentMethod | null
  payment_provider_order_id?: string | null
  payment_provider_transaction_id?: string | null
  paid_at?: string | null
  status?: PaymentStatus
  metadata?: Record<string, unknown> | null
}
