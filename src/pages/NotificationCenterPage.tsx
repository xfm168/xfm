/**
 * NotificationCenterPage 通知中心独立页面
 *
 * 使用 NotificationCenter 组件，支持分页加载更多。
 * 禁止模板字符串。
 */

import React, { useState } from 'react'
import NotificationCenter from '../components/business/NotificationCenter'
import './NotificationCenterPage.css'

function NotificationCenterPage() {
  var filterState = useState<'all' | 'unread'>('all')
  var filter = filterState[0]
  var setFilter = filterState[1]

  return React.createElement('div', { className: 'ncp-page' },
    React.createElement('h1', null, '\u901A\u77E5\u4E2D\u5FC3'),
    React.createElement('div', { className: 'ncp-card' },
      React.createElement('div', { className: 'ncp-filter-bar' },
        React.createElement('button', {
          className: 'ncp-filter-btn' + (filter === 'all' ? ' active' : ''),
          onClick: function() { setFilter('all') },
        }, '\u5168\u90E8'),
        React.createElement('button', {
          className: 'ncp-filter-btn' + (filter === 'unread' ? ' active' : ''),
          onClick: function() { setFilter('unread') },
        }, '\u672A\u8BFB')
      ),
      React.createElement(NotificationCenter, null)
    )
  )
}

export default NotificationCenterPage