/**
 * 可观测性（Observability）统一导出
 *
 * 汇总导出 ApiTracer 与 ApiHealthDashboard 模块的全部公开接口，
 * 便于外部统一引用。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

// ApiTracer 模块导出
export {
  ApiTracer
} from './ApiTracer'
export type {
  ApiTrace,
  ApiStats,
  EndpointStats
} from './ApiTracer'

// ApiHealthDashboard 模块导出
export { ApiHealthDashboard } from './ApiHealthDashboard'
export type {
  HealthStatus,
  OverallHealth,
  DashboardData
} from './ApiHealthDashboard'
