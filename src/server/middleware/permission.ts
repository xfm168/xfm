/**
 * 服务端权限 Guard 中间件
 *
 * 提供 requireCapability / requireFeatureFlag 中间件工厂函数，
 * 在路由中使用 `app.post('/', authRequired, requireCapability('VIP_REPORT'), handler)` 即可拦截无权限请求。
 *
 * 依赖 authRequired 中间件先执行（保证 c.get('user') 存在且含 membership_tier）。
 */

import type { MiddlewareHandler } from 'hono'
import { requireUser } from './auth'
import { hasCapability, isFeatureEnabled, hasPermission } from '../../lib/domain/permission'
import { ApiError } from './error'

/** 要求用户拥有某 Capability */
function requireCapability(capability: string): MiddlewareHandler {
  return async function(c, next) {
    var user = requireUser(c)
    // 从 user 对象获取 tier（由 authRequired 注入）
    var tier = (c.get('user') as any).membership_tier || 'free'
    if (!hasCapability(tier, capability)) {
      throw ApiError.forbidden('权限不足: 需要 ' + capability + ' 能力')
    }
    await next()
  }
}

/** 要求 FeatureFlag 启用 */
function requireFeatureFlag(flagName: string): MiddlewareHandler {
  return async function(c, next) {
    var user = requireUser(c)
    var tier = (c.get('user') as any).membership_tier || 'free'
    if (!isFeatureEnabled(tier, flagName)) {
      throw ApiError.forbidden('功能未启用: ' + flagName)
    }
    await next()
  }
}

/**
 * 要求管理员权限（role='admin'）
 *
 * 检查 user_profiles.role 是否为 'admin'。
 * 不依赖 membership_tier（premium/vip 不等于管理员）。
 * 使用 service_role key 查询数据库获取真实 role。
 */
function requireAdmin(): MiddlewareHandler {
  return async function(c, next) {
    var user = requireUser(c)
    var userId = user.id

    // 查询 user_profiles.role
    var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
    var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    if (!supabaseUrl || !supabaseServiceKey) {
      throw ApiError.internal('Supabase 环境变量未配置')
    }
    var { createClient } = await import('@supabase/supabase-js')
    var supabase = createClient(supabaseUrl, supabaseServiceKey)
    var { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    if (error || !profile || profile.role !== 'admin') {
      throw ApiError.forbidden('需要管理员权限')
    }
    await next()
  }
}

export { requireCapability, requireFeatureFlag, requireAdmin }
