/**
 * 运营工具管理 API 客户端
 *
 * 调用 /api/admin/* 和 /api/* 运营端点。
 * 使用 Supabase getSession() 获取 Bearer token。
 */

import type { Banner } from './types'
import type { Announcement } from './types'
import type { Campaign } from './types'
import type { Coupon } from './types'

import { createClient } from '@supabase/supabase-js'

var supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
var supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

var supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

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

/** 通用请求 */
async function apiRequest<T>(method: string, path: string, body?: any): Promise<T | null> {
  var token = await getToken()
  var headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = 'Bearer ' + token
  }
  try {
    var opts: any = { method: method, headers: headers }
    if (body !== undefined) {
      opts.body = JSON.stringify(body)
    }
    var res = await fetch(path, opts)
    if (!res.ok) {
      return null
    }
    var data = await res.json()
    return data as T
  } catch (e) {
    return null
  }
}

// ─── Banner ───

export async function fetchBanners(): Promise<Banner[]> {
  var result = await apiRequest<Banner[]>('GET', '/api/admin/banners')
  return result || []
}

export async function createBanner(data: any): Promise<Banner | null> {
  return apiRequest<Banner>('POST', '/api/admin/banners', data)
}

// ─── Announcements ───

export async function fetchAnnouncements(): Promise<Announcement[]> {
  var result = await apiRequest<Announcement[]>('GET', '/api/admin/announcements')
  return result || []
}

export async function createAnnouncement(data: any): Promise<Announcement | null> {
  return apiRequest<Announcement>('POST', '/api/admin/announcements', data)
}

export async function toggleAnnouncementPublish(id: string, isPublished: boolean): Promise<boolean> {
  var result = await apiRequest<any>('PATCH', '/api/admin/announcements/' + id, {
    is_published: isPublished
  })
  return result !== null
}

// ─── Campaigns ───

export async function fetchCampaigns(): Promise<Campaign[]> {
  var result = await apiRequest<Campaign[]>('GET', '/api/admin/campaigns')
  return result || []
}

export async function createCampaign(data: any): Promise<Campaign | null> {
  return apiRequest<Campaign>('POST', '/api/admin/campaigns', data)
}

// ─── Coupons ───

export async function fetchCoupons(): Promise<Coupon[]> {
  var result = await apiRequest<Coupon[]>('GET', '/api/admin/coupons')
  return result || []
}

export async function createCoupon(data: any): Promise<Coupon | null> {
  return apiRequest<Coupon>('POST', '/api/admin/coupons', data)
}