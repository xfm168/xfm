/**
 * 服务端鉴权中间件
 *
 * 基于 Supabase JWT 校验请求身份，并将用户信息挂到 Hono 上下文。
 * 提供 authRequired（强制鉴权）、authOptional（可选鉴权）中间件，
 * 以及 createAdminToken（生成管理员 JWT）工具函数。
 *
 * 安全策略：
 *   - authRequired 强制 Supabase 鉴权，无 fallback（生产安全）
 *   - authOptional 支持 DEV_MODE_FALLBACK 环境变量（仅开发环境）
 *   - createAdminToken 使用 crypto.createHmac 真实 HMAC-SHA256 签名
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { createHmac, timingSafeEqual } from 'crypto'
import type { MiddlewareHandler } from 'hono'
import { ApiError } from './error'

/** 从请求头解析 Bearer token */
export function extractBearer(c: { req: { header: (n: string) => string | undefined } }): string | null {
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
  membership_tier?: string
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
 * 无 dev fallback — 所有请求必须通过 Supabase 鉴权。
 * 如需开发模式绕过，使用 authOptional + DEV_MODE_FALLBACK=1 环境变量。
 */
export const authRequired: MiddlewareHandler = async (c, next) => {
  var token = extractBearer(c)
  if (!token) {
    throw ApiError.unauthorized('缺少 Authorization: Bearer <token>')
  }

  // 通过 Supabase 校验 JWT
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    throw ApiError.internal('Supabase 环境变量未配置')
  }

  try {
    var { createClient } = await import('@supabase/supabase-js')
    var supabase = createClient(supabaseUrl, supabaseAnonKey)
    var { data, error } = await supabase.auth.getUser(token)

    if (!error && data.user) {
      // 查询 user_profiles 获取 membership_tier
      var membershipTier = 'free'
      try {
        var { data: profile } = await supabase
          .from('user_profiles')
          .select('membership_tier')
          .eq('id', data.user.id)
          .maybeSingle()
        if (profile && profile.membership_tier) {
          membershipTier = profile.membership_tier
        }
      } catch (_profileErr) {
        // profile 查询失败不影响鉴权，默认 free
      }

      c.set('user', {
        id: data.user.id,
        email: data.user.email || undefined,
        membership_tier: membershipTier,
      })
      await next()
      return
    }
  } catch (e) {
    // Supabase 连接异常
    throw ApiError.internal('鉴权服务暂时不可用')
  }

  throw ApiError.unauthorized('Token 校验失败')
}

/**
 * 可选鉴权中间件：有 token 则校验并填充 user，无则置 null
 *
 * 开发环境可通过设置 DEV_MODE_FALLBACK=1 环境变量启用 fallback，
 * 允许任意 token 通过。生产环境禁止使用此变量。
 */
export const authOptional: MiddlewareHandler = async (c, next) => {
  var token = extractBearer(c)
  if (token) {
    // 通过 Supabase 校验 JWT
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
        // Supabase 校验失败
      }
    }

    // 开发环境 fallback：需要显式设置 DEV_MODE_FALLBACK=1
    // 生产环境检查 NODE_ENV 防止意外启用
    if (process.env.DEV_MODE_FALLBACK === '1' && process.env.NODE_ENV !== 'production') {
      console.warn('[DEV MODE] authOptional: DEV_MODE_FALLBACK 已启用，token 校验被跳过')
      c.set('user', { id: 'dev-user' })
    } else {
      c.set('user', null)
    }
  } else {
    c.set('user', null)
  }
  await next()
}

/** 在路由中取出当前用户；未登录则抛 401 */
export function requireUser(c: { get: (k: string) => unknown }): AuthUser {
  var user = c.get('user') as AuthUser | null | undefined
  if (!user) throw ApiError.unauthorized()
  return user
}

/**
 * 生成管理员 JWT token（使用 crypto.createHmac HMAC-SHA256）
 *
 * 生成标准 JWT 格式：base64url(header).base64url(payload).base64url(signature)
 * 有效期 24 小时。
 *
 * @param userId - 用户 ID
 * @param role - 用户角色（如 'admin'）
 * @returns JWT 字符串
 */
export function createAdminToken(userId: string, role: string): string {
  var jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET 环境变量未设置，无法生成管理员 token')
  }
  var now = Math.floor(Date.now() / 1000)
  var exp = now + 24 * 60 * 60 // 24小时有效期

  // JWT Header
  var header = '{"alg":"HS256","typ":"JWT"}'

  // JWT Payload
  var payload = '{"sub":"' + userId + '","role":"' + role + '","iat":' + String(now) + ',"exp":' + String(exp) + '}'

  // Base64URL 编码
  function base64UrlEncode(str: string): string {
    var encoded = Buffer.from(str).toString('base64')
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  // HMAC-SHA256 签名
  var signingInput = base64UrlEncode(header) + '.' + base64UrlEncode(payload)
  var signature = createHmac('sha256', jwtSecret)
    .update(signingInput)
    .digest('base64url')

  return signingInput + '.' + signature
}

/**
 * 验证管理员 JWT token
 *
 * 使用 crypto.createHmac 验证签名，检查过期时间。
 *
 * @param token - JWT 字符串
 * @returns 解码后的 payload，或 null 如果验证失败
 */
export function verifyAdminToken(token: string): { sub: string; role: string; iat: number; exp: number } | null {
  var jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return null

  var parts = token.split('.')
  if (parts.length !== 3) return null

  var signingInput = parts[0] + '.' + parts[1]

  var expectedSig = createHmac('sha256', jwtSecret)
    .update(signingInput)
    .digest('base64url')

  // 恒时比较防止时序攻击
  var actualSig = Buffer.from(parts[2])
  var expectedBuf = Buffer.from(expectedSig)
  if (actualSig.length !== expectedBuf.length) return null
  if (!timingSafeEqual(actualSig, expectedBuf)) return null

  try {
    var payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'))
    var now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    return payload
  } catch (e) {
    return null
  }
}
