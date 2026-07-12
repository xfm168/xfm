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
