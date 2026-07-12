/**
 * 用户信息路由
 *
 *   GET /api/user   获取当前登录用户信息
 *
 * 使用 authOptional 中间件，已登录用户返回 user_profiles 表真实数据，
 * 未登录用户返回 null user。
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authOptional } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import type { UserProfile } from '../../lib/database/types'

var app = new Hono()

/** 获取 Supabase Admin 客户端（服务端使用 service_role key） */
async function getSupabaseAdmin() {
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiError.internal('缺少 Supabase 环境变量配置')
  }
  var { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * GET /api/user
 *
 * 获取当前登录用户的 profile 信息。
 * 使用 authOptional 中间件，未登录时返回 null user。
 */
app.get('/', authOptional, async function(c) {
  var user = (c as any).get('user') as { id: string } | null

  if (!user) {
    return c.json({ user: null })
  }

  var supabase = await getSupabaseAdmin()

  var { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw ApiError.internal('获取用户资料失败: ' + error.message)
  }

  if (!profile) {
    return c.json({ user: null })
  }

  return c.json({ user: profile as UserProfile })
})

export default app
