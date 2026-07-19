/**
 * 八字模块性能优化入口
 *
 * 统一导出缓存、队列、懒加载、性能监控、虚拟列表与图片懒加载。
 */

export {
  BaziAnalysisCache,
  ReportGenerationQueue,
  createLazyAnalyzer,
  PerformanceMonitor,
  performanceMonitor,
  useVirtualList,
  useVirtualScroll,
  LazyImage,
} from './baziPerformance'

export type {
  CacheEntry,
  CacheStats,
  TaskStatus,
  QueueTask,
  QueueOptions,
  LazyAnalyzer,
  PerformanceMetric,
  VirtualListResult,
  LazyImageProps,
} from './baziPerformance'

export {
  getCacheKey,
  getAnalysisCacheKey,
  cacheChart,
  getCachedChart,
  invalidateChart,
  cacheAnalysis,
  getCachedAnalysis,
  invalidateAnalysis,
  clearChartCache,
  clearAnalysisCache,
  clearAllBaziCache,
  getBaziCacheStats,
  cachedCalculate,
  cachedAnalyze,
  CHART_CACHE_TTL,
  ANALYSIS_CACHE_TTL,
} from './baziCache'
