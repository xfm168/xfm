/**
 * 生产监控中间件
 * 记录 API 响应时间和未捕获异常
 */

import type { Context, Next } from 'hono'

var MONITOR_ENABLED = (typeof process !== 'undefined') && (process.env.MONITOR_ENABLED === '1')

// 内存中的慢请求缓冲区（批量写入，减少 DB 压力）
var slowLogBuffer: Array<Record<string, unknown>> = []
var SLOW_LOG_FLUSH_INTERVAL = 10000 // 10 秒
var slowLogTimer: ReturnType<typeof setInterval> | null = null

function getSupabaseUrl(): string {
  return (typeof process !== 'undefined') ? (process.env.VITE_SUPABASE_URL || '') : ''
}

function getSupabaseServiceKey(): string {
  return (typeof process !== 'undefined') ? (process.env.SUPABASE_SERVICE_ROLE_KEY || '') : ''
}

async function flushSlowLogs(): Promise<void> {
  if (slowLogBuffer.length === 0) return
  var logs = slowLogBuffer.splice(0, slowLogBuffer.length)
  var supabaseUrl = getSupabaseUrl()
  var serviceKey = getSupabaseServiceKey()
  if (!supabaseUrl || !serviceKey) return
  try {
    var { createClient } = await import('@supabase/supabase-js')
    var supabase = createClient(supabaseUrl, serviceKey)
    await supabase.from('monitoring_logs').insert(logs)
  } catch (e) {
    // 静默失败，不影响业务
  }
}

/** 监控中间件：记录 API 响应时间 */
async function monitoringMiddleware(c: Context, next: Next): Promise<void> {
  if (!MONITOR_ENABLED) {
    await next()
    return
  }
  var start = Date.now()
  var path = c.req.path
  var method = c.req.method
  try {
    await next()
  } catch (e) {
    var elapsed = Date.now() - start
    var errorRecord: Record<string, unknown> = {
      source: 'backend',
      category: 'unhandled_exception',
      level: 'error',
      name: 'unhandled:' + method + ':' + path,
      value: elapsed,
      unit: 'ms',
      path: path,
      message: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack || null : null,
    }
    slowLogBuffer.push(errorRecord)
    throw e
  }
  var elapsed = Date.now() - start
  var status = c.res.status

  // 慢请求 > 2 秒
  if (elapsed > 2000) {
    slowLogBuffer.push({
      source: 'backend',
      category: 'api_slow',
      level: 'warn',
      name: method + ':' + path,
      value: elapsed,
      unit: 'ms',
      path: path,
      message: '慢请求: ' + elapsed + 'ms, status=' + status,
    })
  }

  // 错误响应
  if (status >= 500) {
    slowLogBuffer.push({
      source: 'backend',
      category: 'api_error',
      level: 'error',
      name: method + ':' + path,
      value: status,
      unit: 'status',
      path: path,
      message: 'API 错误响应: ' + status + ', 耗时 ' + elapsed + 'ms',
    })
  }
}

/** 启动定时刷新 */
function startMonitoringFlush(): void {
  if (!MONITOR_ENABLED || slowLogTimer) return
  slowLogTimer = setInterval(flushSlowLogs, SLOW_LOG_FLUSH_INTERVAL)
}

/** 停止定时刷新 */
function stopMonitoringFlush(): void {
  if (slowLogTimer) {
    clearInterval(slowLogTimer)
    slowLogTimer = null
  }
  flushSlowLogs()
}

/** 手动记录 Web Vitals（供前端 API 调用） */
async function recordWebVitals(payload: {
  name: string
  value: number
  unit: string
  path: string
  rating: string
}): Promise<void> {
  if (!MONITOR_ENABLED) return
  var level = payload.rating === 'good' ? 'info' : payload.rating === 'needs-improvement' ? 'warn' : 'error'
  slowLogBuffer.push({
    source: 'frontend',
    category: 'web_vital',
    level: level,
    name: payload.name,
    value: payload.value,
    unit: payload.unit,
    path: payload.path,
    message: payload.name + '=' + payload.value + payload.unit + ' (' + payload.rating + ')',
    metadata: { rating: payload.rating },
  })
}

/** 手动记录前端 JS 错误 */
async function recordJsError(payload: {
  message: string
  filename: string
  lineno: number
  colno: number
  stack: string
  path: string
}): Promise<void> {
  if (!MONITOR_ENABLED) return
  slowLogBuffer.push({
    source: 'frontend',
    category: 'js_error',
    level: 'error',
    name: 'js_error:' + payload.filename + ':' + payload.lineno,
    path: payload.path,
    message: payload.message,
    stack: payload.stack || null,
    metadata: {
      filename: payload.filename,
      lineno: payload.lineno,
      colno: payload.colno,
    },
  })
}

export { monitoringMiddleware, startMonitoringFlush, stopMonitoringFlush, recordWebVitals, recordJsError }