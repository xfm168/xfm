/**
 * V1.1-B 认证路由
 *
 *   POST /api/auth/register        邮箱注册
 *   POST /api/auth/login           邮箱密码登录
 *   POST /api/auth/otp             Email OTP 发送
 *   POST /api/auth/otp/verify      Email OTP 验证
 *   POST /api/auth/social/wechat   微信 OAuth
 *   POST /api/auth/social/google   Google OAuth
 *   POST /api/auth/social/apple    Apple OAuth
 *   GET  /api/auth/me              获取当前用户信息（含 user_profile）
 *   POST /api/auth/profile         更新用户资料
 *   POST /api/auth/logout          登出
 *
 * 使用 supabase.auth.admin API。
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authRequired, authOptional, requireUser } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'
import { ApiError } from '../middleware/error'

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

/** 生成 6 位邀请码 */
function generateInvitationCode(): string {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  var code = ''
  for (var i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/** 确保 user_profile 存在 */
async function ensureUserProfile(adminClient: any, userId: string, email: string | undefined) {
  var { data: existing } = await adminClient
    .from('user_profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (!existing) {
    var invitationCode = generateInvitationCode()
    var displayName = email ? email.split('@')[0] : null
    await adminClient.from('user_profiles').insert({
      id: userId,
      display_name: displayName,
      invitation_code: invitationCode,
    })
  }
}

// ───────────────────────────────────────────────
//  路由
// ───────────────────────────────────────────────

/**
 * POST /api/auth/register
 *
 * 邮箱注册：使用 supabase.auth.admin 创建用户，同时创建 user_profile。
 */
app.post('/register', async function(c) {
  var body = await c.req.json()
  var email = body.email as string || ''
  var password = body.password as string || ''
  var displayName = body.display_name as string || null

  if (!email) {
    throw ApiError.badRequest('缺少 email')
  }
  if (!password || password.length < 6) {
    throw ApiError.badRequest('密码长度至少 6 位')
  }

  var supabase = await getSupabaseAdmin()

  // 使用 admin API 创建用户
  var { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
    },
  })

  if (error) {
    if (error.message.indexOf('already registered') !== -1 ||
        error.message.indexOf('already exists') !== -1) {
      throw ApiError.badRequest('该邮箱已被注册')
    }
    throw ApiError.badRequest('注册失败: ' + error.message)
  }

  if (!data.user) {
    throw ApiError.internal('注册失败: 未返回用户数据')
  }

  // 创建 user_profile
  var invitationCode = generateInvitationCode()
  await supabase.from('user_profiles').insert({
    id: data.user.id,
    display_name: displayName || email.split('@')[0],
    invitation_code: invitationCode,
  })

  // 检查是否有邀请码
  var invitedBy = body.invited_by as string || null
  if (invitedBy) {
    await supabase
      .from('user_profiles')
      .update({ invited_by: invitedBy })
      .eq('id', data.user.id)
  }

  return c.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    message: '注册成功',
  })
})

/**
 * POST /api/auth/login
 *
 * 邮箱密码登录：返回 session 和 user。
 */
app.post('/login', async function(c) {
  var body = await c.req.json()
  var email = body.email as string || ''
  var password = body.password as string || ''

  if (!email) {
    throw ApiError.badRequest('缺少 email')
  }
  if (!password) {
    throw ApiError.badRequest('缺少 password')
  }

  var supabase = await getSupabaseAdmin()

  // 使用 auth.admin API 验证用户凭据
  // 注意: admin API 没有 signInWithPassword，需要用客户端方式
  // 这里改用 anon client 的 signInWithPassword
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
  var { createClient } = await import('@supabase/supabase-js')
  var anonClient = createClient(supabaseUrl, supabaseAnonKey)

  var { data, error } = await anonClient.auth.signInWithPassword({
    email: email,
    password: password,
  })

  if (error) {
    if (error.message.indexOf('Invalid login') !== -1 ||
        error.message.indexOf('invalid') !== -1) {
      throw ApiError.badRequest('邮箱或密码错误')
    }
    throw ApiError.badRequest('登录失败: ' + error.message)
  }

  if (!data.user || !data.session) {
    throw ApiError.internal('登录失败: 未返回用户数据')
  }

  // 确保 profile 存在
  await ensureUserProfile(supabase, data.user.id, data.user.email)

  return c.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  })
})

/**
 * POST /api/auth/otp
 *
 * 发送 Email OTP 验证码。
 */
app.post('/otp', async function(c) {
  var body = await c.req.json()
  var email = body.email as string || ''

  if (!email) {
    throw ApiError.badRequest('缺少 email')
  }

  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
  var { createClient } = await import('@supabase/supabase-js')
  var anonClient = createClient(supabaseUrl, supabaseAnonKey)

  var { error } = await anonClient.auth.signInWithOtp({
    email: email,
  })

  if (error) {
    throw ApiError.badRequest('发送 OTP 失败: ' + error.message)
  }

  return c.json({
    success: true,
    message: 'OTP 已发送至 ' + email,
  })
})

/**
 * POST /api/auth/otp/verify
 *
 * 验证 Email OTP。
 */
app.post('/otp/verify', async function(c) {
  var body = await c.req.json()
  var email = body.email as string || ''
  var token = body.token as string || ''

  if (!email) {
    throw ApiError.badRequest('缺少 email')
  }
  if (!token) {
    throw ApiError.badRequest('缺少 token')
  }

  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
  var { createClient } = await import('@supabase/supabase-js')
  var anonClient = createClient(supabaseUrl, supabaseAnonKey)

  var { data, error } = await anonClient.auth.verifyOtp({
    email: email,
    token: token,
    type: 'email',
  })

  if (error) {
    throw ApiError.badRequest('OTP 验证失败: ' + error.message)
  }

  if (!data.user || !data.session) {
    throw ApiError.internal('OTP 验证失败: 未返回用户数据')
  }

  var supabase = await getSupabaseAdmin()
  await ensureUserProfile(supabase, data.user.id, data.user.email)

  return c.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  })
})

/**
 * POST /api/auth/social/wechat
 *
 * 微信 OAuth 登录。
 */
app.post('/social/wechat', async function(c) {
  var body = await c.req.json()
  var code = body.code as string || ''

  if (!code) {
    throw ApiError.badRequest('缺少微信授权 code')
  }

  // TODO: 调用微信 API 获取 access_token 和 openid
  // var wxAppId = process.env.WECHAT_APP_ID || ''
  // var wxAppSecret = process.env.WECHAT_APP_SECRET || ''
  // var wxRes = await fetch('https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + wxAppId + '&secret=' + wxAppSecret + '&code=' + code + '&grant_type=authorization_code')
  // var wxData = await wxRes.json()
  // var openid = wxData.openid
  // var unionid = wxData.unionid

  // TODO: 根据 unionid/openid 查找或创建用户
  // 当前返回占位响应
  return c.json({
    success: false,
    message: '微信 OAuth 尚未接入，请等待后续版本',
  })
})

/**
 * POST /api/auth/social/google
 *
 * Google OAuth 登录。
 */
app.post('/social/google', async function(c) {
  var body = await c.req.json()
  var idToken = body.id_token as string || ''

  if (!idToken) {
    throw ApiError.badRequest('缺少 Google id_token')
  }

  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
  var { createClient } = await import('@supabase/supabase-js')
  var anonClient = createClient(supabaseUrl, supabaseAnonKey)

  var { data, error } = await anonClient.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  })

  if (error) {
    throw ApiError.badRequest('Google 登录失败: ' + error.message)
  }

  if (!data.user || !data.session) {
    throw ApiError.internal('Google 登录失败: 未返回用户数据')
  }

  var supabase = await getSupabaseAdmin()
  await ensureUserProfile(supabase, data.user.id, data.user.email)

  return c.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  })
})

/**
 * POST /api/auth/social/apple
 *
 * Apple OAuth 登录。
 */
app.post('/social/apple', async function(c) {
  var body = await c.req.json()
  var idToken = body.id_token as string || ''

  if (!idToken) {
    throw ApiError.badRequest('缺少 Apple id_token')
  }

  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || ''
  var { createClient } = await import('@supabase/supabase-js')
  var anonClient = createClient(supabaseUrl, supabaseAnonKey)

  var { data, error } = await anonClient.auth.signInWithIdToken({
    provider: 'apple',
    token: idToken,
  })

  if (error) {
    throw ApiError.badRequest('Apple 登录失败: ' + error.message)
  }

  if (!data.user || !data.session) {
    throw ApiError.internal('Apple 登录失败: 未返回用户数据')
  }

  var supabase = await getSupabaseAdmin()
  await ensureUserProfile(supabase, data.user.id, data.user.email)

  return c.json({
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  })
})

/**
 * GET /api/auth/me
 *
 * 获取当前用户信息（包含 user_profile）。
 */
app.get('/me', authOptional, async function(c) {
  var user = (c as any).get('user') as AuthUser | null

  if (!user) {
    return c.json({
      success: true,
      user: null,
      profile: null,
      isAuthenticated: false,
    })
  }

  var supabase = await getSupabaseAdmin()

  // 获取 auth.users 信息
  var { data: authUser } = await supabase.auth.admin.getUserById(user.id)
  var authUserData = authUser as { email?: string; created_at?: string } | null

  // 获取 user_profile
  var { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return c.json({
    success: true,
    user: {
      id: user.id,
      email: authUserData ? authUserData.email : undefined,
      created_at: authUserData ? authUserData.created_at : undefined,
    },
    profile: profile || null,
    isAuthenticated: true,
  })
})

/**
 * POST /api/auth/profile
 *
 * 更新用户资料。
 */
app.post('/profile', authRequired, async function(c) {
  var user = requireUser(c)
  var body = await c.req.json()

  var updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.display_name !== undefined) {
    updateData.display_name = body.display_name as string || null
  }
  if (body.avatar_url !== undefined) {
    updateData.avatar_url = body.avatar_url as string || null
  }

  var supabase = await getSupabaseAdmin()

  // 确保 profile 存在
  var { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  var result
  if (existing) {
    result = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()
  } else {
    // 不存在则创建
    updateData.id = user.id
    updateData.invitation_code = generateInvitationCode()
    result = await supabase
      .from('user_profiles')
      .insert(updateData)
      .select()
      .single()
  }

  if (result.error) {
    throw ApiError.internal('更新资料失败: ' + result.error.message)
  }

  return c.json({
    success: true,
    profile: result.data,
  })
})

/**
 * POST /api/auth/logout
 *
 * 登出：撤销 session。
 */
app.post('/logout', authRequired, async function(c) {
  var body = await c.req.json()
  var refreshToken = body.refresh_token as string || ''

  if (refreshToken) {
    try {
      var supabase = await getSupabaseAdmin()
      await supabase.auth.admin.signOut(refreshToken)
    } catch (e) {
      // 即使 revoke 失败也返回成功
    }
  }

  return c.json({
    success: true,
    message: '登出成功',
  })
})

export default app
