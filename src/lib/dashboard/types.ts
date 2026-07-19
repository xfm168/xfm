export interface DashboardMetrics {
  // 用户指标
  dau: number
  wau: number
  mau: number
  retentionRate: number  // 次日留存
  newUserCount: number

  // 支付指标
  paymentRate: number
  totalOrders: number
  totalRevenue: number  // 分为单位
  averageOrderValue: number

  // 功能指标
  popularFeatures: FeatureUsage[]
  averageAnalysisTime: number  // ms

  // 系统指标
  apiErrorRate: number
  cacheHitRate: number
  serverStatus: 'healthy' | 'degraded' | 'down'
  serverUptime: number  // 百分比
}

export interface FeatureUsage {
  name: string
  count: number
  percent: number
  trend: 'up' | 'down' | 'stable'
}

export interface DailyMetric {
  date: string
  dau: number
  wau: number
  mau: number
  orders: number
  revenue: number
  errors: number
  cacheHit: number
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface OverviewData {
  totalUsers: number
  newUsersToday: number
  newUsers7d: number
  totalCharts: number
  chartsToday: number
  totalAnalysis: number
  freeTrials: number
  memberPurchases: number
  totalRevenue: number
  revenueToday: number
  pdfDownloads: number
  shareCount: number
  paidMembers: number
}

export interface AdminDailyMetric {
  date: string
  newUsers: number
  logins: number
  charts: number
  analysis: number
  freeTrials: number
  orders: number
  revenue: number
  pdfDownloads: number
  shares: number
}

export interface RetentionData {
  day1Retention: number
  day7Retention: number
  day30Retention: number
}

export interface ConversionData {
  registrationRate: number
  freeTrialRate: number
  memberConversionRate: number
  paidToVipRate: number
}

export interface TrendsData {
  daily: AdminDailyMetric[]
  weekly: { weekStart: string; users: number; revenue: number; orders: number }[]
  monthly: { month: string; users: number; revenue: number; orders: number }[]
}

export interface Banner {
  id: string
  title: string
  image_url: string | null
  link_url: string | null
  position: string
  sort_order: number
  is_active: boolean
  start_at: string | null
  end_at: string | null
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: string
  is_published: boolean
  published_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  title: string
  description: string | null
  type: string
  discount_type: string
  discount_value: number
  min_tier: string | null
  is_active: boolean
  start_at: string | null
  end_at: string | null
  created_at: string
  updated_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  min_order_cents: number
  max_uses: number
  used_count: number
  is_active: boolean
  valid_start: string | null
  valid_end: string | null
  applies_to: string
  description: string | null
  created_at: string
  updated_at: string
}