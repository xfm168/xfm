/**
 * 管理员数据分析 API 客户端
 *
 * 调用 /api/admin/analytics/* 端点获取真实数据。
 * 使用 Supabase getSession() 获取 Bearer token。
 */

import type { OverviewData } from './types'
import type { AdminDailyMetric } from './types'
import type { RetentionData } from './types'
import type { ConversionData } from './types'
import type { TrendsData } from './types'

import { supabase as supabaseClient } from '../supabase'

var API_BASE = '/api/admin/analytics'

/** 获取 Bearer token */
async function getToken(): Promise<string> {
  if (!supabaseClient) {
    return ''
  }
  try {
    var session = await supabaseClient.auth.getSession()
    if (session.data.session) {
      return session.data.session.access_token || ''
    }
  } catch (e) {
    // ignore
  }
  return ''
}

/** 通用 GET 请求 */
async function apiGet<T>(path: string): Promise<T | null> {
  var token = await getToken()
  var headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }
  try {
    var res = await fetch(API_BASE + path, {
      method: 'GET',
      headers: headers
    })
    if (!res.ok) {
      return null
    }
    var data = await res.json()
    return data as T
  } catch (e) {
    return null
  }
}

/** 获取总览数据 */
export async function fetchOverview(): Promise<OverviewData | null> {
  return apiGet<OverviewData>('/overview')
}

/** 获取每日指标 */
export async function fetchDaily(days?: number): Promise<AdminDailyMetric[] | null> {
  var path = '/daily'
  if (days !== undefined) {
    path = '/daily?days=' + String(days)
  }
  return apiGet<AdminDailyMetric[]>(path)
}

/** 获取留存数据 */
export async function fetchRetention(): Promise<RetentionData | null> {
  return apiGet<RetentionData>('/retention')
}

/** 获取转化数据 */
export async function fetchConversion(): Promise<ConversionData | null> {
  return apiGet<ConversionData>('/conversion')
}

/** 获取趋势数据 */
export async function fetchTrends(days?: number): Promise<TrendsData | null> {
  var path = '/trends'
  if (days !== undefined) {
    path = '/trends?days=' + String(days)
  }
  return apiGet<TrendsData>(path)
}