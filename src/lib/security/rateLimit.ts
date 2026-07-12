/**
 * 前端 Rate Limit 工具
 *
 * 基于时间戳的简单限流器，不依赖外部库。
 * 用于前端接口调用频率控制，防止用户过度请求。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/** 限流器实例 */
interface RateLimiterInstance {
  /** 检查是否可以继续请求 */
  canProceed: () => boolean
  /** 重置限流计数器 */
  reset: () => void
}

/** 限流器内部状态 */
interface RateLimiterState {
  maxRequests: number
  windowMs: number
  timestamps: number[]
}

/**
 * 创建前端限流器
 *
 * 基于滑动窗口算法，记录每次请求的时间戳，
 * 在时间窗口内超过最大请求数时拒绝后续请求。
 *
 * @param maxRequests - 时间窗口内允许的最大请求数
 * @param windowMs - 时间窗口（毫秒）
 * @returns 限流器实例 { canProceed, reset }
 *
 * @example
 *   var limiter = createRateLimiter(5, 60000) // 5次/分钟
 *   if (limiter.canProceed()) {
 *     fetch('/api/analyze', { ... })
 *   } else {
 *     alert('请求过于频繁，请稍后再试')
 *   }
 */
export function createRateLimiter(maxRequests: number, windowMs: number): RateLimiterInstance {
  var state: RateLimiterState = {
    maxRequests: maxRequests,
    windowMs: windowMs,
    timestamps: []
  }

  return {
    canProceed: function (): boolean {
      var now = Date.now()
      var windowStart = now - state.windowMs

      // 过滤掉窗口外的时间戳
      state.timestamps = state.timestamps.filter(function (ts) {
        return ts > windowStart
      })

      if (state.timestamps.length >= state.maxRequests) {
        return false
      }

      state.timestamps.push(now)
      return true
    },

    reset: function (): void {
      state.timestamps = []
    }
  }
}
