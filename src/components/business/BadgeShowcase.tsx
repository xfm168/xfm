/**
 * BadgeShowcase -- 徽章展示组件
 *
 * 显示用户已获得和未获得的徽章
 * 网格布局，黑色+金色主题
 * 单引号 + concatenation，禁止 backtick 模板字符串
 */

import React, { useState, useEffect } from 'react'
import './BadgeShowcase.css'

var API_BASE = '/api/growth'

interface EarnedBadge {
  badgeKey: string
  badgeName: string
  badgeDesc: string | null
  badgeIcon: string | null
  earnedAt: string
}

interface BadgeDef {
  badgeKey: string
  badgeName: string
  badgeDesc: string
  badgeIcon: string
  requirement: string
}

interface BadgeData {
  earned: EarnedBadge[]
  allBadges: BadgeDef[]
}

function getToken(): string {
  try {
    var raw = localStorage.getItem('sb-xuanfengmen-auth-token')
    if (raw) {
      var parsed = JSON.parse(raw)
      if (parsed && parsed.access_token) return parsed.access_token
    }
  } catch {}
  return ''
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  var d = new Date(dateStr)
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

function BadgeShowcase() {
  var dataHook = useState<BadgeData | null>(null)
  var badgeData = dataHook[0]
  var setBadgeData = dataHook[1]

  var loadingHook = useState(true)
  var loading = loadingHook[0]
  var setLoading = loadingHook[1]

  useEffect(function() {
    var token = getToken()
    if (!token) {
      setLoading(false)
      return
    }

    fetch(API_BASE + '/badges', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(res) { return res.json() })
    .then(function(json) {
      setBadgeData(json)
      setLoading(false)
    })
    .catch(function() {
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="badge-showcase">
        <div className="badge-showcase-title">{'\u5fbd\u7ae0\u5c55\u793a'}</div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          {'\u52a0\u8f7d\u4e2d...'}
        </div>
      </div>
    )
  }

  if (!badgeData) {
    return (
      <div className="badge-showcase">
        <div className="badge-showcase-title">{'\u5fbd\u7ae0\u5c55\u793a'}</div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          {'\u6682\u65e0\u6570\u636e'}
        </div>
      </div>
    )
  }

  var earnedKeys: Record<string, EarnedBadge> = {}
  for (var i = 0; i < badgeData.earned.length; i++) {
    earnedKeys[badgeData.earned[i].badgeKey] = badgeData.earned[i]
  }

  var earnedCount = badgeData.earned.length
  var totalCount = badgeData.allBadges.length

  return (
    <div className="badge-showcase">
      <div className="badge-showcase-title">{'\u5fbd\u7ae0\u5c55\u793a'}</div>

      <div className="badge-stats">
        {'\u5df2\u83b7\u5f97 '}
        <span className="badge-stats-count">{earnedCount}</span>
        {' / ' + totalCount}
      </div>

      <div className="badge-grid">
        {badgeData.allBadges.map(function(badge) {
          var earned = earnedKeys[badge.badgeKey]
          return (
            <div
              className={'badge-card' + (earned ? ' earned' : ' locked')}
              key={badge.badgeKey}
            >
              <div className="badge-icon">
                {badge.badgeIcon}
              </div>
              <div className="badge-name">{badge.badgeName}</div>
              <div className="badge-desc">{badge.badgeDesc}</div>
              {earned
                ? <div className="badge-earned-date">
                    {formatDate(earned.earnedAt)}
                  </div>
                : <div className="badge-requirement">
                    {badge.requirement}
                  </div>
              }
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BadgeShowcase
