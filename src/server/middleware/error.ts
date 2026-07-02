/**
 * 统一错误处理中间件
 *
 * - 自定义 ApiError 携带 HTTP 状态码与业务错误码
 * - errorHandler 作为 Hono app.onError 使用，统一输出 JSON 错误结构
 */

import type { Context } from 'hono'

/** 业务错误码 */
export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'internal_error'

/** 统一 API 错误响应体 */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

/** 业务异常：携带 HTTP 状态码与错误码 */
export class ApiError extends Error {
  readonly statusCode: number
  readonly code: ApiErrorCode
  readonly details?: unknown

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }

  /** 400 参数错误 */
  static badRequest(message = '请求参数错误', details?: unknown): ApiError {
    return new ApiError(400, 'bad_request', message, details)
  }

  /** 401 未认证 */
  static unauthorized(message = '未登录或登录已失效'): ApiError {
    return new ApiError(401, 'unauthorized', message)
  }

  /** 403 无权限 */
  static forbidden(message = '无权访问该资源'): ApiError {
    return new ApiError(403, 'forbidden', message)
  }

  /** 404 资源不存在 */
  static notFound(message = '资源不存在'): ApiError {
    return new ApiError(404, 'not_found', message)
  }

  /** 422 校验失败 */
  static validationError(message = '数据校验失败', details?: unknown): ApiError {
    return new ApiError(422, 'validation_error', message, details)
  }

  /** 500 内部错误 */
  static internal(message = '服务器内部错误', details?: unknown): ApiError {
    return new ApiError(500, 'internal_error', message, details)
  }
}

/**
 * Hono 全局错误处理器（app.onError）
 * 将异常转换为统一的 JSON 错误结构
 */
export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof ApiError) {
    const body: ApiErrorBody = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    }
    return c.json(body, err.statusCode as 400)
  }

  // 未知异常统一 500，隐藏内部细节
  console.error('[api] 未捕获错误:', err)
  const body: ApiErrorBody = {
    error: {
      code: 'internal_error',
      message: '服务器内部错误',
    },
  }
  return c.json(body, 500)
}
