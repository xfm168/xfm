/**
 * useNotifications — 通知管理 Hook
 *
 * 提供通知列表查询、标记已读、删除、未读数刷新等功能。
 * 代码风格：React 组件中允许 const/let，禁止模板字符串。
 */

import { useState, useCallback, useEffect, useRef } from 'react'

var API_BASE = '/api/notifications'

/** 从 localStorage 获取 Supabase access_token */
function getToken(): string {
  try {
    var raw = localStorage.getItem('sb-xuanfengmen-auth-token')
    if (raw) {
      var parsed = JSON.parse(raw)
      if (parsed && parsed.access_token) return parsed.access_token
    }
  } catch (_e) { /* ignore */ }
  return ''
}

/** 通用 fetch 封装（带 Bearer token） */
async function apiFetch(path: string, options: Record<string, unknown> = {}): Promise<any> {
  var url = API_BASE + path
  var token = getToken()
  var headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token

  var fetchOptions: Record<string, unknown> = { method: options.method || 'GET', headers: headers }
  if (options.body !== undefined) fetchOptions.body = JSON.stringify(options.body)

  var res = await fetch(url, fetchOptions as RequestInit)
  var json = await res.json()

  if (!res.ok) {
    var errMsg = json && json.error && json.error.message ? json.error.message : '请求失败'
    throw new Error(errMsg)
  }
  return json
}

export interface NotificationItem {
  id: string
  type: string
  title: string
  content: string
  isRead: boolean
  metadata: Record<string, any>
  createdAt: string
}

export interface NotificationsState {
  unreadCount: number
  notifications: NotificationItem[]
  loading: boolean
}

export function useNotifications() {
  var unreadCountState = useState<number>(0)
  var unreadCount = unreadCountState[0]
  var setUnreadCount = unreadCountState[1]

  var notificationsState = useState<NotificationItem[]>([])
  var notifications = notificationsState[0]
  var setNotifications = notificationsState[1]

  var loadingState = useState<boolean>(false)
  var loading = loadingState[0]
  var setLoading = loadingState[1]

  // 初始化时自动加载未读数
  var mountedRef = useRef(true)
  useEffect(function() {
    mountedRef.current = true
    refreshUnreadCount()
    return function() { mountedRef.current = false }
  }, [])

  var refreshUnreadCount = useCallback(async function() {
    try {
      var json = await apiFetch('/unread-count')
      if (mountedRef.current) {
        setUnreadCount(json.count || 0)
      }
    } catch (_e) { /* ignore */ }
  }, [])

  var fetchNotifications = useCallback(async function(page?: number, pageSize?: number, unreadOnly?: boolean) {
    setLoading(true)
    try {
      var params: string[] = []
      if (page != null) params.push('page=' + page)
      if (pageSize != null) params.push('pageSize=' + pageSize)
      if (unreadOnly) params.push('unread=true')
      var qs = params.length > 0 ? '?' + params.join('&') : ''
      var json = await apiFetch(qs)
      if (mountedRef.current) {
        setNotifications(json.items || [])
        setUnreadCount(json.unreadCount || 0)
      }
      return json
    } catch (_e) {
      // ignore
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
    return null
  }, [])

  var markAsRead = useCallback(async function(id: string) {
    try {
      await apiFetch('/' + id + '/read', { method: 'PATCH' })
      if (mountedRef.current) {
        setNotifications(function(prev) {
          return prev.map(function(n) {
            if (n.id === id) {
              return Object.assign({}, n, { isRead: true })
            }
            return n
          })
        })
        setUnreadCount(function(prev) { return Math.max(0, prev - 1) })
      }
    } catch (_e) { /* ignore */ }
  }, [])

  var markAllAsRead = useCallback(async function() {
    try {
      await apiFetch('/read-all', { method: 'PATCH' })
      if (mountedRef.current) {
        setNotifications(function(prev) {
          return prev.map(function(n) {
            return Object.assign({}, n, { isRead: true })
          })
        })
        setUnreadCount(0)
      }
    } catch (_e) { /* ignore */ }
  }, [])

  var deleteNotification = useCallback(async function(id: string) {
    try {
      await apiFetch('/' + id, { method: 'DELETE' })
      if (mountedRef.current) {
        setNotifications(function(prev) {
          return prev.filter(function(n) { return n.id !== id })
        })
      }
    } catch (_e) { /* ignore */ }
  }, [])

  return {
    unreadCount: unreadCount,
    notifications: notifications,
    loading: loading,
    fetchNotifications: fetchNotifications,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    deleteNotification: deleteNotification,
    refreshUnreadCount: refreshUnreadCount,
  }
}