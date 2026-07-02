/**
 * 鉴权中间件（骨架）
 *
 * 设计目标：基于 Supabase JWT 校验请求身份，并将用户信息挂到 Hono 上下文。
 *
 * 当前状态：TODO 骨架，未接入真实 Supabase auth。
 *   - 后续需通过 @supabase/supabase-js 的 supabase.auth.getUser(jwt)
 *     或 jose 库本地校验 JWT 签名（Edge 友好）。
 *   - 通过校验后将 { id, email } 写入 c.set('user', ...)。
 *   - 失败则抛出 ApiError(unauthorized)。
 *
 * 使用方式：
 *   import { authRequired, authOptional } from './middleware/auth'
 *   app.use('/api/user/*', authRequired)
 */

import type { Context, MiddlewareHandler } from 'hono'
import { ApiError } from './error'

/** 从请求头解析 Bearer token */
export function extractBearer(c: Context): string | null {
  const header = c.req.header('authorization') || c.req.header('Authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/** 已认证用户信息（接入后由鉴权中间件填充） */
export interface AuthUser {
  id: string
  email?: string
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
 * TODO: 接入 Supabase auth.getUser(token) 完成真实校验
 */
export const authRequired: MiddlewareHandler = async (c, next) => {
  const token = extractBearer(c)
  if (!token) {
    throw ApiError.unauthorized('缺少 Authorization: Bearer <token>')
  }

  // TODO: 接入 Supabase 校验 JWT
  // const supabase = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
  // const { data, error } = await supabase.auth.getUser()
  // if (error || !data.user) throw ApiError.unauthorized('无效的登录凭证')
  // c.set('user', { id: data.user.id, email: data.user.email })

  // 临时占位：直接信任 token 头（仅用于本地开发骨架联调）
  c.set('user', { id: 'dev-user' })

  await next()
}

/**
 * 可选鉴权中间件：有 token 则校验并填充 user，无则置 null
 *
 * TODO: 接入 Supabase 校验逻辑
 */
export const authOptional: MiddlewareHandler = async (c, next) => {
  const token = extractBearer(c)
  if (token) {
    // TODO: 同 authRequired 中真实校验逻辑
    c.set('user', { id: 'dev-user' })
  } else {
    c.set('user', null)
  }
  await next()
}

/** 在路由中取出当前用户；未登录则抛 401 */
export function requireUser(c: Context): AuthUser {
  const user = c.get('user')
  if (!user) throw ApiError.unauthorized()
  return user
}
