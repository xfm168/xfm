/**
 * Rate Limiter 中间件（服务端）
 *
 * 基于内存的滑动窗口限流器，用于 Hono 框架。
 * 使用 Map 存储每个 IP + 路径的请求计数，窗口 60 秒。
 * 超限返回 429 JSON 响应。
 *
 * 注意：内存存储在多实例部署时不共享，生产环境建议使用 Redis。
 */

import type { MiddlewareHandler } from 'hono'

/** 单个客户端的限流记录 */
interface RateLimitRecord {
  count: number
  windowStart: number
}

/** 限流器配置 */
interface RateLimiterOptions {
  /** 时间窗口（毫秒），默认 60000（60秒） */
  windowMs?: number
  /** 窗口内最大请求数，默认 100 */
  maxRequests?: number
}

/** 存储所有客户端的请求记录，key = ip + path */
const store = new Map<string, RateLimitRecord>()

/** 定期清理过期记录，避免内存泄漏 */
const CLEANUP_INTERVAL_MS = 60000

setInterval(function () {
  const now = Date.now()
  store.forEach(function (record, key) {
    if (now - record.windowStart > CLEANUP_INTERVAL_MS * 2) {
      store.delete(key)
    }
  })
}, CLEANUP_INTERVAL_MS)

/**
 * 创建 Rate Limiter 中间件
 *
 * @param options - 配置项（windowMs, maxRequests）
 * @returns Hono 中间件
 *
 * @example
 *   app.use('/api/bazi', rateLimiter({ maxRequests: 30, windowMs: 60000 }))
 */
export function rateLimiter(options?: RateLimiterOptions): MiddlewareHandler {
  const windowMs = options?.windowMs ?? 60000
  const maxRequests = options?.maxRequests ?? 100

  return async function (c, next) {
    const ip = c.req.header('x-forwarded-for') || 'unknown'
    const path = c.req.path
    const key = ip + ':' + path
    const now = Date.now()

    var record = store.get(key)

    if (!record || (now - record.windowStart) >= windowMs) {
      // 窗口已过期或首次请求，重置计数
      record = { count: 1, windowStart: now }
      store.set(key, record)
    } else {
      record.count++
    }

    // 设置限流相关响应头
    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)))
    c.header('X-RateLimit-Reset', String(Math.ceil((record.windowStart + windowMs) / 1000)))

    if (record.count > maxRequests) {
      c.status(429)
      return c.json({
        error: 'Too Many Requests',
        message: '请求频率超过限制，请稍后再试',
        retryAfter: Math.ceil((record.windowStart + windowMs - now) / 1000)
      }, 429)
    }

    await next()
    return undefined
  }
}
