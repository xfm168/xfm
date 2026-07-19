/**
 * GrowthCenter -- 用户成长中心页面
 *
 * 包含签到组件、成长值和等级展示、徽章展示、排行榜、等级说明
 * 单引号 + concatenation，禁止 backtick 模板字符串
 */

import React, { useState, useEffect, useCallback } from 'react'
import CheckInWidget from '../components/business/CheckInWidget'
import BadgeShowcase from '../components/business/BadgeShowcase'
import { useGrowth } from '../hooks/useGrowth'
import './GrowthCenter.css'

var API_BASE = '/api/growth'

/** 等级阈值说明 */
var LEVEL_INFO = [
  { level: 1, points: 0, desc: '\u521d\u5165\u95e8\u5f84' },
  { level: 2, points: 100, desc: '\u7565\u6709\u5c0f\u6210' },
  { level: 3, points: 300, desc: '\u521d\u7a8d\u95e8\u5f84' },
  { level: 4, points: 600, desc: '\u767b\u5802\u5165\u5ba4' },
  { level: 5, points: 1000, desc: '\u878d\u4f1a\u8d2f\u901a' },
  { level: 6, points: 1500, desc: '\u7089\u706b\u7eaf\u9752' },
  { level: 7, points: 2100, desc: '\u51fa\u795e\u5165\u5316' },
  { level: 8, points: 2800, desc: '\u8fd4\u6734\u5f52\u771f' },
  { level: 9, points: 3600, desc: '\u5929\u4eba\u5408\u4e00' },
  { level: 10, points: 4500, desc: '\u5927\u9053\u65e0\u6781' }
]

interface LeaderboardEntry {
  userId: string
  displayName: string
  growthPoints: number
  growthLevel: number
  rank: number
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

function GrowthCenter() {
  var growth = useGrowth()

  var leaderboardHook = useState<LeaderboardEntry[]>([])
  var leaderboard = leaderboardHook[0]
  var setLeaderboard = leaderboardHook[1]

  var lbLoadingHook = useState(true)
  var lbLoading = lbLoadingHook[0]
  var setLbLoading = lbLoadingHook[1]

  var loadLeaderboard = useCallback(function() {
    var token = getToken()
    if (!token) {
      setLbLoading(false)
      return
    }
    fetch(API_BASE + '/leaderboard', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(res) { return res.json() })
    .then(function(json) {
      setLeaderboard(json.leaderboard || [])
      setLbLoading(false)
    })
    .catch(function() {
      setLbLoading(false)
    })
  }, [])

  useEffect(function() {
    loadLeaderboard()
  }, [loadLeaderboard])

  function getRankClass(rank: number): string {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'silver'
    if (rank === 3) return 'bronze'
    return 'normal'
  }

  return (
    <div className="growth-center">
      <div className="growth-center-header">
        <h1 className="growth-center-title">{'\u6210\u957f\u4e2d\u5fc3'}</h1>
        <p className="growth-center-subtitle">{'\u7b7e\u5230\u79ef\u7d2f\u6210\u957f\u503c\uff0c\u89e3\u9501\u5fbd\u7ae0\uff0c\u63d0\u5347\u7b49\u7ea7'}</p>
      </div>

      <div className="growth-center-layout">
        <div className="growth-center-left">
          <CheckInWidget />
          <BadgeShowcase />
        </div>

        <div className="growth-center-right">
          {/* Leaderboard */}
          <div className="growth-leaderboard">
            <div className="growth-leaderboard-title">{'\u6210\u957f\u699c'}</div>
            {lbLoading ? (
              <div className="growth-empty">{'\u52a0\u8f7d\u4e2d...'}</div>
            ) : leaderboard.length === 0 ? (
              <div className="growth-empty">{'\u6682\u65e0\u6392\u884c\u6570\u636e'}</div>
            ) : (
              <ul className="leaderboard-list">
                {leaderboard.map(function(entry) {
                  return (
                    <li className="leaderboard-item" key={entry.userId}>
                      <div className={'leaderboard-rank ' + getRankClass(entry.rank)}>
                        {entry.rank}
                      </div>
                      <div className="leaderboard-info">
                        <div className="leaderboard-name">{entry.displayName}</div>
                        <div className="leaderboard-level">
                          {'Lv.' + entry.growthLevel}
                        </div>
                      </div>
                      <div className="leaderboard-points">
                        {entry.growthPoints}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Level Guide */}
          <div className="growth-level-guide">
            <div className="growth-level-guide-title">{'\u7b49\u7ea7\u8bf4\u660e'}</div>
            <div className="level-guide-list">
              {LEVEL_INFO.map(function(info) {
                var isCurrent = growth.growthLevel === info.level
                return (
                  <div
                    className={'level-guide-item' + (isCurrent ? ' current' : '')}
                    key={info.level}
                  >
                    <div className="level-guide-lv">
                      {'Lv.' + info.level}
                    </div>
                    <div className="level-guide-points">
                      {info.desc + ' (' + info.points + '\u6210\u957f\u503c)'}
                    </div>
                  </div>
                )
              })}
              <div className="level-guide-item">
                <div className="level-guide-lv">{'Lv.11+'}</div>
                <div className="level-guide-points">
                  {'\u6bcf1000\u6210\u957f\u503c\u5347\u4e00\u7ea7\uff0c\u4e0a\u9650\u7b49\u7ea720'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GrowthCenter
