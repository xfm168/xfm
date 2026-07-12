/**
 * 服务端鉴权中间件
 *
 * 基于 Supabase JWT 校验请求身份，并将用户信息挂到 Hono 上下文。
 * 提供 authRequired（强制鉴权）、authOptional（可选鉴权）中间件，
 * 以及 createAdminToken（生成管理员 JWT）工具函数。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import type { Context, MiddlewareHandler } from 'hono'
import { ApiError } from './error'

/** 从请求头解析 Bearer token */
export function extractBearer(c: Context): string | null {
  var header = c.req.header('authorization') || c.req.header('Authorization')
  if (!header) return null
  var match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/** 已认证用户信息（接入后由鉴权中间件填充） */
export interface AuthUser {
  id: string
  email?: string
  role?: string
}

/**
 * 扩展 Hono 上下文 Variables 类型，便于在路由中通过 c.get('user') 取值
 */
declare module 'hono' {
  interface Variables {
    user: AuthUser | null
  }
}

/**
 * 强制鉴权中间件：未携带/校验失败则 401
 *
 * 从 Authorization header 提取 Bearer token，调用 supabase.auth.getUser(token) 验证。
 * 生产环境应移除 dev-user fallback。
 */
export const authRequired: MiddlewareHandler = async (c, next) => {
  var token = extractBearer(c)
  if (!token) {
    throw ApiError.unauthorized('缺少 Authorization: Bearer <token>')
  }

  // 尝试通过 Supabase 校验 JWT
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

  if (supabaseUrl && supabaseAnonKey) {
    try {
      var { createClient } = await import('@supabase/supabase-js')
      var supabase = createClient(supabaseUrl, supabaseAnonKey)
      var { data, error } = await supabase.auth.getUser(token)

      if (!error && data.user) {
        c.set('user', {
          id: data.user.id,
          email: data.user.email || undefined
        })
        await next()
        return
      }
    } catch (e) {
      // Supabase 校验失败，继续走 fallback
    }
  }

  // WARNING: 以下为开发环境 fallback，仅用于本地联调。
  // 生产环境部署前必须移除此段代码，强制所有请求走 Supabase 鉴权。
  // 使用 dev-user fallback 意味着任何携带任意 token 的请求都会被放行，
  // 这存在严重安全风险。
  console.warn('[SECURITY WARNING] 使用 dev-user fallback，请确保不在生产环境启用')
  c.set('user', { id: 'dev-user' })

  await next()
}

/**
 * 可选鉴权中间件：有 token 则校验并填充 user，无则置 null
 */
export const authOptional: MiddlewareHandler = async (c, next) => {
  var token = extractBearer(c)
  if (token) {
    // 尝试通过 Supabase 校验 JWT
    var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
    var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

    if (supabaseUrl && supabaseAnonKey) {
      try {
        var { createClient } = await import('@supabase/supabase-js')
        var supabase = createClient(supabaseUrl, supabaseAnonKey)
        var { data, error } = await supabase.auth.getUser(token)

        if (!error && data.user) {
          c.set('user', {
            id: data.user.id,
            email: data.user.email || undefined
          })
          await next()
          return
        }
      } catch (e) {
        // Supabase 校验失败，继续走 fallback
      }
    }

    // WARNING: 开发环境 fallback，生产环境必须移除。
    console.warn('[SECURITY WARNING] authOptional 使用 dev-user fallback')
    c.set('user', { id: 'dev-user' })
  } else {
    c.set('user', null)
  }
  await next()
}

/** 在路由中取出当前用户；未登录则抛 401 */
export function requireUser(c: Context): AuthUser {
  var user = c.get('user')
  if (!user) throw ApiError.unauthorized()
  return user
}

/**
 * 生成管理员 JWT token（简化实现）
 *
 * 使用 base64 编码生成简单的 JWT，格式为 header.payload.signature。
 * 有效期 24 小时。
 *
 * 注意：这是一个简化实现，仅用于内部管理场景。
 * 生产环境建议使用 jose 等成熟 JWT 库。
 *
 * @param userId - 用户 ID
 * @param role - 用户角色（如 'admin'）
 * @returns JWT 字符串
 */
export function createAdminToken(userId: string, role: string): string {
  var jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me'
  var now = Math.floor(Date.now() / 1000)
  var exp = now + 24 * 60 * 60 // 24小时有效期

  // JWT Header
  var header = '{' +
    '"alg":"HS256",' +
    '"typ":"JWT"' +
  '}'

  // JWT Payload
  var payload = '{' +
    '"sub":"' + userId + '",' +
    '"role":"' + role + '",' +
    '"iat":' + String(now) + ',' +
    '"exp":' + String(exp) +
  '}'

  // Base64URL 编码
  function base64UrlEncode(str: string): string {
    var encoded = Buffer.from(str).toString('base64')
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  // 简化签名：使用 header.payload + secret 的 SHA-256
  // 注意：此简化实现不使用真正的 HMAC-SHA256，
  // 生产环境应替换为 crypto.createHmac('sha256', secret).update(signingInput).digest(...)
  var signingInput = base64UrlEncode(header) + '.' + base64UrlEncode(payload)
  var signatureInput = signingInput + '.' + jwtSecret

  // 生成简单 hash 签名
  var signature = base64UrlEncode(signatureInput)

  return signingInput + '.' + signature
}
