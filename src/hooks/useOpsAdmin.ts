/**
 * useOpsAdmin -- Stage 8 运营工具管理 Hook
 *
 * 封装 Banner / Announcement / Campaign / Coupon 的数据加载和操作。
 * 状态：idle -> loading -> ready / error
 */

import { useState, useCallback, useEffect } from 'react'
import { fetchBanners, fetchAnnouncements, fetchCampaigns, fetchCoupons, createCoupon, createAnnouncement, toggleAnnouncementPublish } from '../lib/dashboard/opsApi'
import type { Banner } from '../lib/dashboard/types'
import type { Announcement } from '../lib/dashboard/types'
import type { Campaign } from '../lib/dashboard/types'
import type { Coupon } from '../lib/dashboard/types'

type OpsStatus = 'idle' | 'loading' | 'ready' | 'error'

interface OpsState {
  status: OpsStatus
  banners: Banner[]
  announcements: Announcement[]
  campaigns: Campaign[]
  coupons: Coupon[]
  error: string | null
}

interface OpsResult {
  status: OpsStatus
  banners: Banner[]
  announcements: Announcement[]
  campaigns: Campaign[]
  coupons: Coupon[]
  error: string | null
  refresh: () => void
  addCoupon: (data: any) => Promise<boolean>
  addAnnouncement: (data: any) => Promise<boolean>
  togglePublish: (id: string, isPublished: boolean) => Promise<boolean>
}

var initialState: OpsState = {
  status: 'idle',
  banners: [],
  announcements: [],
  campaigns: [],
  coupons: [],
  error: null
}

function useOpsAdmin(): OpsResult {
  var stateHook = useState<OpsState>(initialState)
  var state = stateHook[0]
  var setState = stateHook[1]

  var loadAll = useCallback(function() {
    setState(function(prev) {
      return {
        status: 'loading',
        banners: prev.banners,
        announcements: prev.announcements,
        campaigns: prev.campaigns,
        coupons: prev.coupons,
        error: null
      }
    })

    var pBanners = fetchBanners()
    var pAnnouncements = fetchAnnouncements()
    var pCampaigns = fetchCampaigns()
    var pCoupons = fetchCoupons()

    Promise.all([pBanners, pAnnouncements, pCampaigns, pCoupons])
      .then(function(results) {
        setState({
          status: 'ready',
          banners: results[0],
          announcements: results[1],
          campaigns: results[2],
          coupons: results[3],
          error: null
        })
      })
      .catch(function() {
        setState(function(prev) {
          return {
            status: 'error',
            banners: prev.banners,
            announcements: prev.announcements,
            campaigns: prev.campaigns,
            coupons: prev.coupons,
            error: '加载运营工具数据失败'
          }
        })
      })
  }, [])

  var refresh = useCallback(function() {
    loadAll()
  }, [loadAll])

  var addCoupon = useCallback(async function(data: any): Promise<boolean> {
    var result = await createCoupon(data)
    if (result) {
      loadAll()
      return true
    }
    return false
  }, [loadAll])

  var addAnnouncement = useCallback(async function(data: any): Promise<boolean> {
    var result = await createAnnouncement(data)
    if (result) {
      loadAll()
      return true
    }
    return false
  }, [loadAll])

  var togglePublish = useCallback(async function(id: string, isPublished: boolean): Promise<boolean> {
    var result = await toggleAnnouncementPublish(id, isPublished)
    if (result) {
      loadAll()
      return true
    }
    return false
  }, [loadAll])

  useEffect(function() {
    if (state.status === 'idle') {
      loadAll()
    }
  }, [state.status, loadAll])

  return {
    status: state.status,
    banners: state.banners,
    announcements: state.announcements,
    campaigns: state.campaigns,
    coupons: state.coupons,
    error: state.error,
    refresh: refresh,
    addCoupon: addCoupon,
    addAnnouncement: addAnnouncement,
    togglePublish: togglePublish
  }
}

export default useOpsAdmin