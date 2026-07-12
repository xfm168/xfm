/**
 * RC3-3: 性能 Profiler - 统一导出
 *
 * 统一性能分析入口：
 * - PerformanceProfiler: 通用性能追踪
 * - EngineProfiler: 命理引擎专用追踪
 *
 * @example
 * import { performanceProfiler, engineProfiler } from '@/lib/profiler'
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

export { PerformanceProfiler, performanceProfiler } from './PerformanceProfiler'
export type { ProfilerEntry, ProfilerStats } from './PerformanceProfiler'

export { EngineProfiler, engineProfiler } from './EngineProfiler'
