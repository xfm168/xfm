/**
 * 统一输入验证中间件（服务端）
 *
 * 提供请求 body 类型校验、query 参数白名单、字符串消毒、数值范围校验等功能。
 * 防止恶意输入和注入攻击。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import type { MiddlewareHandler } from 'hono'

/**
 * 校验请求 body 是否符合指定的类型要求
 *
 * @param schema - 字段名到期望类型的映射，如 { name: 'string', age: 'number' }
 * @returns Hono 中间件
 *
 * @example
 *   app.post('/api/bazi', validateBody({ birthDate: 'string', gender: 'string' }), handler)
 */
export function validateBody(schema: Record<string, string>): MiddlewareHandler {
  return async function (c, next) {
    var body: any = undefined
    try {
      body = await c.req.json()
    } catch (e) {
      c.status(400)
      return c.json({ error: 'Invalid Request', message: '请求 body 无法解析为 JSON' }, 400)
    }

    var errors: string[] = []

    for (var field in schema) {
      if (!schema.hasOwnProperty(field)) {
        continue
      }
      var expectedType = schema[field]

      if (!(field in body)) {
        errors.push('缺少必填字段: ' + field)
        continue
      }

      var actualType = typeof body[field]
      if (actualType !== expectedType) {
        errors.push('字段 ' + field + ' 期望类型 ' + expectedType + '，实际类型 ' + actualType)
      }
    }

    if (errors.length > 0) {
      c.status(400)
      return c.json({
        error: 'Validation Error',
        message: '输入验证失败',
        details: errors
      }, 400)
    }

    // 将校验通过的 body 存入上下文
    c.set('validatedBody', body)
    await next()
    return undefined
  }
}

/**
 * 校验 query 参数是否只包含允许的字段
 *
 * @param allowed - 允许的 query 参数名列表
 * @returns Hono 中间件
 *
 * @example
 *   app.get('/api/history', validateQuery(['page', 'limit', 'type']), handler)
 */
export function validateQuery(allowed: string[]): MiddlewareHandler {
  return async function (c, next) {
    var queryParams = new URL(c.req.url).searchParams
    var extraParams: string[] = []

    queryParams.forEach(function (_value, key) {
      if (allowed.indexOf(key) === -1) {
        extraParams.push(key)
      }
    })

    if (extraParams.length > 0) {
      c.status(400)
      return c.json({
        error: 'Validation Error',
        message: '包含不允许的查询参数: ' + extraParams.join(', '),
        allowed: allowed
      }, 400)
    }

    await next()
    return undefined
  }
}

/**
 * 消毒字符串输入
 *
 * - 转义 HTML 特殊字符（&, <, >, ", '）
 * - 去除前后空白
 * - 限制最大长度为 10000 字符
 *
 * @param input - 待消毒的字符串
 * @returns 消毒后的安全字符串
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // 限制长度
  var result = input.length > 10000 ? input.substring(0, 10000) : input

  // 去除前后空白
  result = result.trim()

  // 转义 HTML 特殊字符
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  return result
}

/**
 * 数值范围校验
 *
 * @param input - 待校验的数值
 * @param min - 可选最小值（包含）
 * @param max - 可选最大值（包含）
 * @returns 校验后的数值，如果不合法则返回 NaN
 */
export function sanitizeNumber(input: number, min?: number, max?: number): number {
  if (typeof input !== 'number' || isNaN(input)) {
    return NaN
  }

  if (min !== undefined && input < min) {
    return NaN
  }

  if (max !== undefined && input > max) {
    return NaN
  }

  return input
}
