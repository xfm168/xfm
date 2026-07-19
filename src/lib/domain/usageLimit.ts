/**
 * 使用次数限制
 * 基于 Domain UserTier 定义每日/每月使用上限
 *
 * 代码风格：var、单引号、字符串拼接
 */

var TIER_LIMITS: Record<string, { dailyCharts: number; dailyAnalysis: number; monthlyAiCredits: number; historyLimit: number }> = {
  'free': { dailyCharts: 3, dailyAnalysis: 1, monthlyAiCredits: 0, historyLimit: 5 },
  'basic': { dailyCharts: 10, dailyAnalysis: 5, monthlyAiCredits: 3, historyLimit: 50 },
  'premium': { dailyCharts: 999, dailyAnalysis: 999, monthlyAiCredits: 20, historyLimit: 999 },
  'vip': { dailyCharts: 999, dailyAnalysis: 999, monthlyAiCredits: 999, historyLimit: 999 },
}

function getTierLimits(tier: string) {
  return TIER_LIMITS[tier] || TIER_LIMITS['free']
}

function canPerformAction(tier: string, action: 'chart' | 'analysis' | 'ai' | 'pdf' | 'history'): boolean {
  var limits = getTierLimits(tier)
  switch (action) {
    case 'chart': return limits.dailyCharts > 5
    case 'analysis': return limits.dailyAnalysis > 5
    case 'ai': return limits.monthlyAiCredits > 0
    case 'pdf': return tier === 'basic' || tier === 'premium' || tier === 'vip'
    case 'history': return limits.historyLimit > 5
    default: return false
  }
}

function getRequiredTier(action: string): string {
  switch (action) {
    case 'pdf': return 'basic'
    case 'ai': return 'basic'
    case 'vip_report': return 'premium'
    case 'pro_engine': return 'premium'
    case 'compatibility': return 'free'
    default: return 'free'
  }
}

export { getTierLimits, canPerformAction, getRequiredTier, TIER_LIMITS }
