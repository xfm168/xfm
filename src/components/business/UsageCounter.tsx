/**
 * UsageCounter 使用次数显示
 * 显示当前等级剩余使用次数
 */
import React, { useState, useEffect } from 'react'
import './UsageCounter.css'

function UsageCounter(props: any) {
  var tier = props.tier || 'free'
  var remaining = props.remaining != null ? props.remaining : null
  var dailyLimit = props.dailyLimit != null ? props.dailyLimit : null

  if (remaining === null || dailyLimit === null) return null

  var isUnlimited = dailyLimit >= 999
  var percent = isUnlimited ? 100 : Math.round((remaining / dailyLimit) * 100)
  var colorClass = percent > 50 ? 'uc-good' : percent > 20 ? 'uc-warn' : 'uc-danger'

  return React.createElement('div', { className: 'uc-counter' },
    React.createElement('div', { className: 'uc-label' },
      '今日剩余次数'
    ),
    React.createElement('div', { className: 'uc-bar-wrap' },
      React.createElement('div', {
        className: 'uc-bar ' + colorClass,
        style: { width: percent + '%' }
      })
    ),
    React.createElement('div', { className: 'uc-text ' + colorClass },
      isUnlimited ? '无限' : (remaining + ' / ' + dailyLimit)
    )
  )
}

export { UsageCounter }