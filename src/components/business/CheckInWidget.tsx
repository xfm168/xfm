/**
 * CheckInWidget -- 签到组件
 *
 * 显示连续签到天数、签到按钮、等级进度、7天签到日历
 * 黑色+金色主题
 * 单引号 + concatenation，禁止 backtick 模板字符串
 */

import React, { useState, useCallback } from 'react'
import { useGrowth } from '../../hooks/useGrowth'
import './CheckInWidget.css'

/** 等级阈值（与后端一致） */
var LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]

/** 计算当前等级进度百分比 */
function getLevelProgress(points: number, level: number): number {
  var currentMin = 0
  var nextMin = 100

  if (level <= 10) {
    var idx = level - 1
    currentMin = LEVEL_THRESHOLDS[idx] || 0
    nextMin = LEVEL_THRESHOLDS[idx + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  } else {
    currentMin = 4500 + (level - 10) * 1000
    nextMin = currentMin + 1000
  }

  if (points >= nextMin) return 100
  if (points <= currentMin) return 0

  var range = nextMin - currentMin
  if (range <= 0) return 100
  var progress = points - currentMin
  return Math.floor(progress / range * 100)
}

/** 获取最近7天的日期（含今天） */
function getRecentDays(): Array<{ dateStr: string; label: string }> {
  var dayLabels = ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d']
  var days: Array<{ dateStr: string; label: string }> = []
  for (var i = 6; i >= 0; i--) {
    var d = new Date()
    d.setDate(d.getDate() - i)
    var yyyy = String(d.getFullYear())
    var mm = String(d.getMonth() + 1).padStart(2, '0')
    var dd = String(d.getDate()).padStart(2, '0')
    days.push({
      dateStr: yyyy + '-' + mm + '-' + dd,
      label: dayLabels[d.getDay()]
    })
  }
  return days
}

function CheckInWidget() {
  var growth = useGrowth()
  var loadingHook = useState(false)
  var checking = loadingHook[0]
  var setChecking = loadingHook[1]
  var rewardHook = useState<number | null>(null)
  var reward = rewardHook[0]
  var setReward = rewardHook[1]

  var handleCheckIn = useCallback(async function() {
    if (checking) return
    setChecking(true)
    try {
      var result = await growth.checkIn()
      if (result.success) {
        setReward(result.reward)
      }
    } finally {
      setChecking(false)
    }
  }, [checking, growth])

  var recentDays = getRecentDays()
  var todayStr = (function() {
    var d = new Date()
    return String(d.getFullYear()) + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
  })()

  var levelProgress = getLevelProgress(growth.growthPoints, growth.growthLevel)

  return (
    <div className={'checkin-widget' + (reward !== null ? ' checkin-success-animation' : '')}>
      <div className="checkin-widget-title">{'\u6bcf\u65e5\u7b7e\u5230'}</div>

      <div className="checkin-streak-area">
        <div className="checkin-streak-number">{growth.streak}</div>
        <div className="checkin-streak-label">{'\u8fde\u7eed\u7b7e\u5230\u5929\u6570'}</div>
      </div>

      <div className={'checkin-status' + (growth.todayCheckedIn ? ' checked' : '')}>
        {growth.todayCheckedIn
          ? '\u4eca\u65e5\u5df2\u7b7e\u5230'
          : '\u4eca\u65e5\u5c1a\u672a\u7b7e\u5230'}
      </div>

      <button
        className={
          'checkin-btn' +
          (growth.todayCheckedIn ? ' checked-in' : '') +
          (checking ? ' checking' : '')
        }
        disabled={growth.todayCheckedIn || checking}
        onClick={handleCheckIn}
      >
        {checking
          ? '\u7b7e\u5230\u4e2d...'
          : growth.todayCheckedIn
            ? '\u5df2\u7b7e\u5230'
            : '\u7acb\u5373\u7b7e\u5230'}
      </button>

      {reward !== null && (
        <div className="checkin-reward-toast">
          {'\u7b7e\u5230\u6210\u529f\uff01\u83b7\u5f97 ' + reward + ' \u79ef\u5206'}
        </div>
      )}

      <div className="checkin-level-area">
        <div className="checkin-level-header">
          <span className="checkin-level-label">
            {'Lv.' + growth.growthLevel}
          </span>
          <span className="checkin-level-value">
            {growth.growthPoints + ' \u6210\u957f\u503c'}
          </span>
        </div>
        <div className="checkin-progress-bar">
          <div
            className="checkin-progress-fill"
            style={{ width: levelProgress + '%' }}
          />
        </div>
      </div>

      <div className="checkin-week-area">
        <div className="checkin-week-title">{'\u8fd1\u4e03\u5929\u7b7e\u5230'}</div>
        <div className="checkin-week-grid">
          {recentDays.map(function(day) {
            var isToday = day.dateStr === todayStr
            var iconClass = 'checkin-week-day-icon'
            // Show done for past days that are before or equal to streak
            var isDone = false
            if (growth.todayCheckedIn && isToday) {
              isDone = true
            }
            var iconContent = '-'

            return (
              <div className="checkin-week-day" key={day.dateStr}>
                <div className="checkin-week-day-label">{day.label}</div>
                <div className={iconClass + (isDone ? ' done' : '') + (isToday ? ' today' : '') + (!isDone ? ' empty' : '')}>
                  {isDone ? '\u2713' : iconContent}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CheckInWidget
