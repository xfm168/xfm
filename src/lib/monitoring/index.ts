/**
 * 监控模块统一导出
 *
 * 包含 Sentry 异常监控与 Analytics 数据分析。
 * 在应用入口调用 initSentry() 和 initAnalytics() 完成初始化。
 */

export {
  initSentry,
  captureException,
  captureMessage,
  setUser as setSentryUser,
} from './sentry'

export {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackConversion,
  setUserProperty,
} from './analytics'
