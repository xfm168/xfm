/**
 * useAuth -- V1.1-B 认证 Hook
 *
 * 基于 Supabase Auth 提供完整认证功能：
 *   - login / register（邮箱密码）
 *   - loginWithOtp / verifyOtp（Email OTP）
 *   - loginWithSocial（微信 / Google / Apple）
 *   - logout
 *   - getProfile / updateProfile
 *   - onAuthStateChange
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { UserProfile } from '../lib/database/types'

export type SocialProvider = 'wechat' | 'google' | 'apple'

interface AuthUser {
  id: string
  email: string | null
}

interface UseAuthResult {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isGuest: boolean
  login: (email: string, password: string) => Promise<AuthUser | null>
  register: (email: string, password: string) => Promise<AuthUser | null>
  loginWithOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, token: string) => Promise<AuthUser | null>
  loginWithSocial: (provider: SocialProvider) => Promise<AuthUser | null>
  logout: () => Promise<void>
  getProfile: () => Promise<UserProfile | null>
  updateProfile: (data: { display_name?: string | null; avatar_url?: string | null }) => Promise<UserProfile | null>
  onAuthStateChange: (callback: (user: AuthUser | null) => void) => () => void
}

var supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
var supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

var supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

var API_BASE = '/api/auth'

/** 通用 fetch 封装 */
async function apiFetch(path: string, options: Record<string, unknown> = {}): Promise<any> {
  var url = API_BASE + path
  var headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // 附加 Bearer token
  if (supabaseClient) {
    var session = await supabaseClient.auth.getSession()
    var token = session.data.session ? session.data.session.access_token : ''
    if (token) {
      headers['Authorization'] = 'Bearer ' + token
    }
  }

  var fetchOptions: Record<string, unknown> = {
    method: options.method || 'GET',
    headers: headers,
  }

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  var res = await fetch(url, fetchOptions as RequestInit)
  var json = await res.json()

  if (!res.ok) {
    var errMsg = json && json.error && json.error.message
      ? json.error.message
      : '请求失败'
    throw new Error(errMsg)
  }

  return json
}

export function useAuth(): UseAuthResult {
  var userHook = useState<AuthUser | null>(null)
  var user = userHook[0]
  var setUser = userHook[1]

  var profileHook = useState<UserProfile | null>(null)
  var profile = profileHook[0]
  var setProfile = profileHook[1]

  var loadingHook = useState<boolean>(true)
  var loading = loadingHook[0]
  var setLoading = loadingHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var initializedRef = useRef(false)

  // 初始化：检查当前认证状态
  useEffect(function() {
    if (!supabaseClient || initializedRef.current) return
    initializedRef.current = true

    supabaseClient.auth.getSession().then(function(session) {
      var sessionUser = session.data.session ? session.data.session.user : null
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email || null,
        })
        // 加载 profile
        loadProfile(sessionUser.id).then(function(p) {
          setProfile(p)
          setLoading(false)
        }).catch(function() {
          setLoading(false)
        })
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }).catch(function() {
      setLoading(false)
    })
  }, [])

  /** 加载 user_profile */
  async function loadProfile(userId: string): Promise<UserProfile | null> {
    if (!supabaseClient) return null
    var { data, error: _profileError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data || null
  }

  /** 邮箱密码登录 */
  var login = useCallback(async function(email: string, password: string): Promise<AuthUser | null> {
    setLoading(true)
    setError(null)
    try {
      var res = await apiFetch('/login', {
        method: 'POST',
        body: { email: email, password: password },
      })
      if (res.success && res.user) {
        setUser(res.user)
        var p = await loadProfile(res.user.id)
        setProfile(p)
        return res.user
      }
      setError(res.message || '登录失败')
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : '登录失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 邮箱注册 */
  var register = useCallback(async function(email: string, password: string): Promise<AuthUser | null> {
    setLoading(true)
    setError(null)
    try {
      var res = await apiFetch('/register', {
        method: 'POST',
        body: { email: email, password: password },
      })
      if (res.success && res.user) {
        setUser(res.user)
        var p = await loadProfile(res.user.id)
        setProfile(p)
        return res.user
      }
      setError(res.message || '注册失败')
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : '注册失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 发送 Email OTP */
  var loginWithOtp = useCallback(async function(email: string): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      await apiFetch('/otp', {
        method: 'POST',
        body: { email: email },
      })
    } catch (e) {
      var msg = e instanceof Error ? e.message : '发送 OTP 失败'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  /** 验证 Email OTP */
  var verifyOtp = useCallback(async function(email: string, token: string): Promise<AuthUser | null> {
    setLoading(true)
    setError(null)
    try {
      var res = await apiFetch('/otp/verify', {
        method: 'POST',
        body: { email: email, token: token },
      })
      if (res.success && res.user) {
        setUser(res.user)
        var p = await loadProfile(res.user.id)
        setProfile(p)
        return res.user
      }
      setError('OTP 验证失败')
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : 'OTP 验证失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 社交登录 */
  var loginWithSocial = useCallback(async function(provider: SocialProvider): Promise<AuthUser | null> {
    setLoading(true)
    setError(null)
    try {
      if (provider === 'wechat') {
        // 微信需要跳转到微信授权页面，暂时返回提示
        setError('微信登录请使用客户端 OAuth 跳转')
        return null
      }

      // Google / Apple 通过 OAuth URL 跳转
      if (!supabaseClient) {
        setError('Supabase 未配置')
        return null
      }

      var providerName: string = provider === 'google' ? 'google' : 'apple'
      var { error: oauthError } = await supabaseClient.auth.signInWithOAuth({
        provider: providerName as any,
      })

      if (oauthError) {
        setError(oauthError.message)
        return null
      }

      // OAuth 会自动跳转，此处不等待回调
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : '社交登录失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 登出 */
  var logout = useCallback(async function(): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      if (supabaseClient) {
        var session = await supabaseClient.auth.getSession()
        var refreshToken = session.data.session ? session.data.session.refresh_token : ''
        await apiFetch('/logout', {
          method: 'POST',
          body: { refresh_token: refreshToken },
        })
        await supabaseClient.auth.signOut()
      }
      setUser(null)
      setProfile(null)
    } catch (e) {
      var msg = e instanceof Error ? e.message : '登出失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  /** 获取 user_profile */
  var getProfile = useCallback(async function(): Promise<UserProfile | null> {
    try {
      var res = await apiFetch('/me')
      if (res.success && res.profile) {
        setProfile(res.profile)
        return res.profile
      }
      return null
    } catch (e) {
      return null
    }
  }, [])

  /** 更新用户资料 */
  var updateProfile = useCallback(async function(
    data: { display_name?: string | null; avatar_url?: string | null }
  ): Promise<UserProfile | null> {
    setLoading(true)
    setError(null)
    try {
      var res = await apiFetch('/profile', {
        method: 'POST',
        body: data,
      })
      if (res.success && res.profile) {
        setProfile(res.profile)
        return res.profile
      }
      setError('更新资料失败')
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : '更新资料失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 监听认证状态变化 */
  var onAuthStateChange = useCallback(function(callback: (user: AuthUser | null) => void): () => void {
    if (!supabaseClient) {
      callback(null)
      return function() {}
    }

    var subscription = supabaseClient.auth.onAuthStateChange(function(_event, session) {
      var sessionUser = session ? session.user : null
      var authUser: AuthUser | null = sessionUser
        ? { id: sessionUser.id, email: sessionUser.email || null }
        : null
      setUser(authUser)
      callback(authUser)

      if (authUser) {
        loadProfile(authUser.id).then(function(p) {
          setProfile(p)
        })
      } else {
        setProfile(null)
      }
    })

    return function() {
      subscription.data.subscription.unsubscribe()
    }
  }, [])

  var isAuthenticated = !!user
  var isGuest = !user

  return {
    user: user,
    profile: profile,
    loading: loading,
    error: error,
    isAuthenticated: isAuthenticated,
    isGuest: isGuest,
    login: login,
    register: register,
    loginWithOtp: loginWithOtp,
    verifyOtp: verifyOtp,
    loginWithSocial: loginWithSocial,
    logout: logout,
    getProfile: getProfile,
    updateProfile: updateProfile,
    onAuthStateChange: onAuthStateChange,
  }
}
