/**
 * API 健康仪表盘（ApiHealthDashboard）
 *
 * 基于真实探测（fetch）和缓存对 API 端点进行健康检查，
 * 给出 healthy / degraded / down 状态，并支持整体健康概览与仪表盘数据生成。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/** 单个端点的健康状态 */
export interface HealthStatus {
  /** 端点 URL */
  endpoint: string
  /** 健康状态 */
  status: 'healthy' | 'degraded' | 'down'
  /** 最近一次探测延迟（ms） */
  latency: number
  /** 错误率（0-1） */
  errorRate: number
  /** 最近一次检查时间戳（ms） */
  lastCheck: number
  /** 可用率（0-100，healthy=100 / degraded=50 / down=0） */
  uptime: number
}

/** 整体健康概览 */
export interface OverallHealth {
  /** 整体状态 */
  status: 'healthy' | 'degraded' | 'down'
  /** 各端点状态列表 */
  endpoints: HealthStatus[]
  /** 健康端点数 */
  healthyCount: number
  /** 降级端点数 */
  degradedCount: number
  /** 宕机端点数 */
  downCount: number
}

/** 仪表盘数据 */
export interface DashboardData {
  /** 生成时间（ISO 字符串） */
  generatedAt: string
  /** 整体健康概览 */
  overall: OverallHealth
  /** 各端点健康状态 */
  endpoints: HealthStatus[]
}

/** 健康探测超时时间（ms） */
const HEALTH_TIMEOUT_MS: number = 5000
/** 健康延迟阈值（ms）：低于此值视为健康 */
const HEALTHY_LATENCY_MS: number = 1000
/** 降级延迟阈值（ms）：低于此值视为降级，超过则视为严重降级 */
const DEGRADED_LATENCY_MS: number = 3000

/**
 * API 健康仪表盘
 *
 * 用法示例：
 *   const dashboard = new ApiHealthDashboard(['/api/health', '/api/bazi'])
 *   await dashboard.checkAll()
 *   const overall = dashboard.getOverallHealth()
 */
export class ApiHealthDashboard {
  private statuses: Map<string, HealthStatus> = new Map()
  private endpoints: string[]

  constructor(endpoints?: string[]) {
    this.endpoints = endpoints ? endpoints.slice() : []
  }

  /** 注册一个需要监控的端点 */
  registerEndpoint(endpoint: string): void {
    if (this.endpoints.indexOf(endpoint) === -1) {
      this.endpoints.push(endpoint)
    }
  }

  /**
   * 检查单个 API 端点健康状态
   *
   * 通过 fetch 发起一次 GET 探测（带超时），根据响应与延迟判定状态：
   * - healthy：响应成功且延迟 < 1000ms
   * - degraded：响应成功但延迟较高，或响应 4xx
   * - down：请求失败 / 超时 / 响应 5xx
   *
   * @param endpoint - 端点 URL
   * @returns 健康状态
   */
  async checkHealth(endpoint: string): Promise<HealthStatus> {
    const start = Date.now()
    let status: 'healthy' | 'degraded' | 'down' = 'down'
    let errorRate = 1
    let latency = 0

    try {
      const controller = new AbortController()
      const timer = setTimeout(function () {
        controller.abort()
      }, HEALTH_TIMEOUT_MS)
      const res = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      })
      clearTimeout(timer)
      latency = Date.now() - start

      if (res.ok) {
        if (latency < HEALTHY_LATENCY_MS) {
          status = 'healthy'
          errorRate = 0
        } else if (latency < DEGRADED_LATENCY_MS) {
          status = 'degraded'
          errorRate = 0.1
        } else {
          status = 'degraded'
          errorRate = 0.3
        }
      } else if (res.status >= 400 && res.status < 500) {
        status = 'degraded'
        errorRate = 0.5
      } else {
        status = 'down'
        errorRate = 1
      }
    } catch (_e) {
      latency = Date.now() - start
      status = 'down'
      errorRate = 1
    }

    const uptime =
      status === 'healthy' ? 100 : status === 'degraded' ? 50 : 0

    const health: HealthStatus = {
      endpoint: endpoint,
      status: status,
      latency: latency,
      errorRate: errorRate,
      lastCheck: Date.now(),
      uptime: uptime
    }
    this.statuses.set(endpoint, health)
    return health
  }

  /** 检查所有已注册端点 */
  async checkAll(): Promise<HealthStatus[]> {
    const results: HealthStatus[] = []
    for (let i = 0; i < this.endpoints.length; i++) {
      const h = await this.checkHealth(this.endpoints[i])
      results.push(h)
    }
    return results
  }

  /** 获取整体健康状态（基于缓存） */
  getOverallHealth(): OverallHealth {
    const list: HealthStatus[] = []
    const keys = Array.from(this.statuses.keys())
    for (let i = 0; i < keys.length; i++) {
      list.push(this.statuses.get(keys[i]) as HealthStatus)
    }

    let downCount = 0
    let degradedCount = 0
    let healthyCount = 0
    for (let i = 0; i < list.length; i++) {
      if (list[i].status === 'down') {
        downCount++
      } else if (list[i].status === 'degraded') {
        degradedCount++
      } else {
        healthyCount++
      }
    }

    let overall: 'healthy' | 'degraded' | 'down'
    if (list.length === 0) {
      overall = 'healthy'
    } else if (downCount > 0 && downCount === list.length) {
      overall = 'down'
    } else if (downCount > 0 || degradedCount > 0) {
      overall = 'degraded'
    } else {
      overall = 'healthy'
    }

    return {
      status: overall,
      endpoints: list,
      healthyCount: healthyCount,
      degradedCount: degradedCount,
      downCount: downCount
    }
  }

  /** 生成仪表盘数据 */
  generateDashboard(): DashboardData {
    return {
      generatedAt: new Date().toISOString(),
      overall: this.getOverallHealth(),
      endpoints: Array.from(this.statuses.values())
    }
  }
}
