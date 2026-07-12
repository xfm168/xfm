/**
 * API 追踪器（ApiTracer）
 *
 * 提供 API 请求的全链路追踪能力：记录每次请求的方法、URL、耗时、状态码、
 * 错误信息等，并支持统计聚合（成功率、平均/P95/P99 延迟、错误率、按端点分组）
 * 以及 HTML / JSON 报告导出。最多保留最近 500 条追踪记录。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/** 单次 API 追踪记录 */
export interface ApiTrace {
  /** 请求 ID（每次请求唯一） */
  requestId: string
  /** 追踪 ID（一次请求链路的标识） */
  traceId: string
  /** HTTP 方法 */
  method: string
  /** 请求 URL */
  url: string
  /** 开始时间戳（ms） */
  startTime: number
  /** 结束时间戳（ms），未结束时为 null */
  endTime: number | null
  /** 耗时（ms），未结束时为 null */
  duration: number | null
  /** 请求状态 */
  status: 'pending' | 'success' | 'error'
  /** HTTP 状态码 */
  statusCode: number | null
  /** 错误信息 */
  error: string | null
  /** 附加元数据 */
  metadata: Record<string, unknown>
}

/** 端点维度统计 */
export interface EndpointStats {
  /** 总请求数 */
  total: number
  /** 成功数 */
  success: number
  /** 错误数 */
  error: number
  /** 平均延迟（ms） */
  avgLatency: number
  /** 错误率（0-1） */
  errorRate: number
}

/** API 统计聚合结果 */
export interface ApiStats {
  /** 总请求数 */
  totalRequests: number
  /** 成功率（0-1） */
  successRate: number
  /** 平均延迟（ms） */
  avgLatency: number
  /** P95 延迟（ms） */
  p95Latency: number
  /** P99 延迟（ms） */
  p99Latency: number
  /** 错误率（0-1） */
  errorRate: number
  /** 按端点分组的统计 */
  byEndpoint: Record<string, EndpointStats>
}

/** 最大保留追踪条数 */
const MAX_TRACES: number = 500

/**
 * 生成 UUID v4 格式字符串
 *
 * 优先使用 crypto.randomUUID；不可用时使用 crypto.getRandomValues；
 * 均不可用时回退到基于 Math.random 的实现。
 */
function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex: string[] = []
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i].toString(16)
      hex.push(b.length === 1 ? '0' + b : b)
    }
    return (
      hex.slice(0, 4).join('') + '-' +
      hex.slice(4, 6).join('') + '-' +
      hex.slice(6, 8).join('') + '-' +
      hex.slice(8, 10).join('') + '-' +
      hex.slice(10, 16).join('')
    )
  }
  // 回退实现（非加密安全，仅用于无 crypto 的环境）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** 计算已排序数组的分位数 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0
  }
  if (sorted.length === 1) {
    return sorted[0]
  }
  let idx = Math.ceil(p * sorted.length) - 1
  if (idx < 0) {
    idx = 0
  }
  if (idx >= sorted.length) {
    idx = sorted.length - 1
  }
  return sorted[idx]
}

/** HTML 转义（用于报告输出，防止注入） */
function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * API 追踪器
 *
 * 用法示例：
 *   const tracer = new ApiTracer()
 *   const traceId = tracer.startTrace('GET', '/api/bazi')
 *   // ... 执行请求 ...
 *   tracer.endTrace(traceId, 'success', 200)
 *   const stats = tracer.getStats()
 */
export class ApiTracer {
  private traces: ApiTrace[] = []
  private readonly maxTraces: number = MAX_TRACES

  /** 生成请求 ID（uuid 格式） */
  generateRequestId(): string {
    return uuid()
  }

  /** 生成追踪 ID（uuid 格式） */
  generateTraceId(): string {
    return uuid()
  }

  /**
   * 开始一次追踪
   *
   * @param method - HTTP 方法（GET/POST 等）
   * @param url - 请求 URL
   * @returns traceId（用于后续 endTrace）
   */
  startTrace(method: string, url: string): string {
    const traceId = this.generateTraceId()
    const requestId = this.generateRequestId()
    const trace: ApiTrace = {
      requestId: requestId,
      traceId: traceId,
      method: method.toUpperCase(),
      url: url,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'pending',
      statusCode: null,
      error: null,
      metadata: {}
    }
    this.traces.push(trace)
    // 超出上限时丢弃最早的记录
    while (this.traces.length > this.maxTraces) {
      this.traces.shift()
    }
    return traceId
  }

  /**
   * 完成一次追踪
   *
   * @param traceId - 追踪 ID
   * @param status - 最终状态 'success' | 'error'
   * @param statusCode - HTTP 状态码（可选）
   * @param error - 错误信息（可选）
   */
  endTrace(
    traceId: string,
    status: 'success' | 'error',
    statusCode: number | null,
    error?: string
  ): void {
    const trace = this.traces.find(function (t) {
      return t.traceId === traceId
    })
    if (!trace) {
      return
    }
    trace.endTime = Date.now()
    trace.duration = trace.endTime - trace.startTime
    trace.status = status
    trace.statusCode = statusCode
    trace.error = error || null
  }

  /** 获取最近 500 条追踪记录（按时间正序） */
  getTraces(): ApiTrace[] {
    return this.traces.slice()
  }

  /** 计算统计聚合 */
  getStats(): ApiStats {
    const traces = this.traces
    const total = traces.length
    if (total === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        avgLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        errorRate: 0,
        byEndpoint: {}
      }
    }

    let successCount = 0
    let errorCount = 0
    const latencies: number[] = []
    const byEndpoint: Record<string, EndpointStats> = {}
    let latencySum = 0
    let latencyCount = 0

    for (let i = 0; i < traces.length; i++) {
      const t = traces[i]
      if (t.status === 'success') {
        successCount++
      } else if (t.status === 'error') {
        errorCount++
      }
      if (t.duration !== null) {
        latencies.push(t.duration)
        latencySum += t.duration
        latencyCount++
      }
      const endpoint = t.method + ' ' + t.url
      if (!byEndpoint[endpoint]) {
        byEndpoint[endpoint] = {
          total: 0,
          success: 0,
          error: 0,
          avgLatency: 0,
          errorRate: 0
        }
      }
      const ep = byEndpoint[endpoint]
      ep.total++
      if (t.status === 'success') {
        ep.success++
      }
      if (t.status === 'error') {
        ep.error++
      }
    }

    // 计算端点维度统计
    const epKeys = Object.keys(byEndpoint)
    for (let k = 0; k < epKeys.length; k++) {
      const epStat = byEndpoint[epKeys[k]]
      epStat.errorRate = epStat.total > 0 ? epStat.error / epStat.total : 0
    }

    latencies.sort(function (a, b) {
      return a - b
    })
    const avgLatency = latencyCount > 0 ? latencySum / latencyCount : 0
    const p95Latency = percentile(latencies, 0.95)
    const p99Latency = percentile(latencies, 0.99)

    return {
      totalRequests: total,
      successRate: successCount / total,
      avgLatency: avgLatency,
      p95Latency: p95Latency,
      p99Latency: p99Latency,
      errorRate: errorCount / total,
      byEndpoint: byEndpoint
    }
  }

  /** 导出 JSON 格式报告 */
  exportJSON(): string {
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        stats: this.getStats(),
        traces: this.getTraces()
      },
      null,
      2
    )
  }

  /** 导出 HTML 格式报告（自包含页面） */
  exportHTML(): string {
    const stats = this.getStats()
    const traces = this.getTraces()
    const generatedAt = new Date().toISOString()

    let rows = ''
    for (let i = 0; i < traces.length; i++) {
      const t = traces[i]
      const dur = t.duration !== null ? String(t.duration) + 'ms' : '-'
      const code = t.statusCode !== null ? String(t.statusCode) : '-'
      rows +=
        '<tr>' +
        '<td>' + escapeHtml(t.traceId.substring(0, 8)) + '</td>' +
        '<td>' + escapeHtml(t.method) + '</td>' +
        '<td>' + escapeHtml(t.url) + '</td>' +
        '<td>' + dur + '</td>' +
        '<td>' + code + '</td>' +
        '<td>' + escapeHtml(t.status) + '</td>' +
        '<td>' + (t.error ? escapeHtml(t.error) : '-') + '</td>' +
        '</tr>'
    }

    let epRows = ''
    const epKeys = Object.keys(stats.byEndpoint)
    for (let j = 0; j < epKeys.length; j++) {
      const ep = stats.byEndpoint[epKeys[j]]
      epRows +=
        '<tr>' +
        '<td>' + escapeHtml(epKeys[j]) + '</td>' +
        '<td>' + String(ep.total) + '</td>' +
        '<td>' + String(ep.success) + '</td>' +
        '<td>' + String(ep.error) + '</td>' +
        '<td>' + (ep.errorRate * 100).toFixed(2) + '%</td>' +
        '<td>' + ep.avgLatency.toFixed(2) + 'ms</td>' +
        '</tr>'
    }

    return (
      '<!DOCTYPE html>' +
      '<html lang="zh">' +
      '<head>' +
      '<meta charset="utf-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
      '<title>API 追踪报告</title>' +
      '<style>' +
      'body{font-family:system-ui,Arial,sans-serif;margin:24px;color:#222}' +
      'h1{color:#071629;margin-bottom:4px}' +
      'table{border-collapse:collapse;width:100%;margin:12px 0}' +
      'th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}' +
      'th{background:#f5f5f5}' +
      '.stats{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}' +
      '.stat{background:#f9f9f9;padding:12px 16px;border-radius:6px;min-width:140px}' +
      '.stat span{font-size:12px;color:#6B7D94}' +
      '.stat b{display:block;font-size:20px;color:#D4AF37;margin-top:4px}' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<h1>API 追踪报告</h1>' +
      '<p>生成时间：' + escapeHtml(generatedAt) + '</p>' +
      '<div class="stats">' +
      '<div class="stat"><span>总请求数</span><b>' + String(stats.totalRequests) + '</b></div>' +
      '<div class="stat"><span>成功率</span><b>' + (stats.successRate * 100).toFixed(2) + '%</b></div>' +
      '<div class="stat"><span>错误率</span><b>' + (stats.errorRate * 100).toFixed(2) + '%</b></div>' +
      '<div class="stat"><span>平均延迟</span><b>' + stats.avgLatency.toFixed(2) + 'ms</b></div>' +
      '<div class="stat"><span>P95 延迟</span><b>' + stats.p95Latency.toFixed(2) + 'ms</b></div>' +
      '<div class="stat"><span>P99 延迟</span><b>' + stats.p99Latency.toFixed(2) + 'ms</b></div>' +
      '</div>' +
      '<h2>端点统计</h2>' +
      '<table><thead><tr><th>端点</th><th>总数</th><th>成功</th><th>错误</th><th>错误率</th><th>平均延迟</th></tr></thead><tbody>' +
      epRows +
      '</tbody></table>' +
      '<h2>追踪明细</h2>' +
      '<table><thead><tr><th>TraceId</th><th>方法</th><th>URL</th><th>耗时</th><th>状态码</th><th>状态</th><th>错误</th></tr></thead><tbody>' +
      rows +
      '</tbody></table>' +
      '</body>' +
      '</html>'
    )
  }
}
