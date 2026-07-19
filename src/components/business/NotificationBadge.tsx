/**
 * NotificationBadge 未读通知角标组件
 *
 * 显示未读数量红色角标，点击展开最近 5 条通知下拉列表。
 * 自动每 30 秒轮询刷新未读数。
 * 禁止模板字符串。
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import type { NotificationItem } from '../../hooks/useNotifications'
import './NotificationBadge.css'

/** 通知类型图标 */
var TYPE_ICONS: Record<string, string> = {
  'membership_expiry': '\u23F0',
  'membership_upgraded': '\u2B50',
  'order_paid': '\uD83D\uDCB0',
  'order_failed': '\u274C',
  'daily_fortune': '\uD83C\uDF1F',
  'report_ready': '\uD83D\uDCCB',
  'system': '\uD83D\uDCE2',
  'promotion': '\uD83C\uDF89',
  'feedback_reply': '\uD83D\uDCAC',
  'checkin_reward': '\u2705',
  'badge_earned': '\uD83C\uDFC6',
}

/** 格式化相对时间 */
function formatTimeShort(dateStr: string): string {
  if (!dateStr) return ''
  var now = Date.now()
  var then = new Date(dateStr).getTime()
  var diffMs = now - then
  var diffSec = Math.floor(diffMs / 1000)
  var diffMin = Math.floor(diffSec / 60)
  var diffHour = Math.floor(diffMin / 60)
  var diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '\u521A\u521A'
  if (diffMin < 60) return diffMin + '\u5206\u949F\u524D'
  if (diffHour < 24) return diffHour + '\u5C0F\u65F6\u524D'
  if (diffDay < 7) return diffDay + '\u5929\u524D'
  var d = new Date(dateStr)
  return (d.getMonth() + 1) + '/' + d.getDate()
}

function NotificationBadge() {
  var navigate = useNavigate()
  var notifHook = useNotifications()
  var unreadCount = notifHook.unreadCount
  var notifications = notifHook.notifications
  var fetchNotifications = notifHook.fetchNotifications
  var markAsRead = notifHook.markAsRead
  var refreshUnreadCount = notifHook.refreshUnreadCount

  var openState = useState(false)
  var isOpen = openState[0]
  var setOpen = openState[1]

  var dropdownRef = useRef<HTMLDivElement>(null)

  // 30 秒轮询刷新未读数
  useEffect(function() {
    var timer = setInterval(function() {
      refreshUnreadCount()
    }, 30000)
    return function() { clearInterval(timer) }
  }, [refreshUnreadCount])

  // 点击外部关闭下拉
  useEffect(function() {
    if (!isOpen) return undefined
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return function() { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isOpen])

  var handleToggle = useCallback(function() {
    if (!isOpen) {
      setOpen(true)
      // 加载最近 5 条
      fetchNotifications(1, 5)
    } else {
      setOpen(false)
    }
  }, [isOpen, fetchNotifications])

  var handleItemClick = useCallback(function(item: NotificationItem) {
    if (!item.isRead) {
      markAsRead(item.id)
    }
    setOpen(false)
    navigate('/notifications')
  }, [markAsRead, navigate])

  var handleViewAll = useCallback(function() {
    setOpen(false)
    navigate('/notifications')
  }, [navigate])

  // 最近 5 条通知
  var recentItems = notifications.slice(0, 5)

  return React.createElement('div', { className: 'nb-wrap', ref: dropdownRef },
    React.createElement('button', {
      className: 'nb-bell-btn',
      onClick: handleToggle,
      'aria-label': '\u901A\u77E5',
    }, '\uD83D\uDD14',
      unreadCount > 0
        ? React.createElement('span', { className: 'nb-dot' },
            unreadCount > 99 ? '99+' : String(unreadCount)
          )
        : null
    ),
    isOpen
      ? React.createElement('div', { className: 'nb-dropdown' },
          React.createElement('div', { className: 'nb-dropdown-header' },
            React.createElement('span', { className: 'nb-dropdown-title' }, '\u901A\u77E5'),
            React.createElement('span', { className: 'nb-dropdown-count' },
              unreadCount > 0
                ? unreadCount + ' \u6761\u672A\u8BFB'
                : '\u6682\u65E0\u672A\u8BFB'
            )
          ),
          React.createElement('div', { className: 'nb-dropdown-list' },
            recentItems.length === 0
              ? React.createElement('div', { className: 'nb-dropdown-empty' }, '\u6682\u65E0\u901A\u77E5')
              : recentItems.map(function(item) {
                  var icon = TYPE_ICONS[item.type] || '\uD83D\uDCE2'
                  return React.createElement('div', {
                    key: item.id,
                    className: 'nb-dropdown-item' + (item.isRead ? '' : ' unread'),
                    onClick: function() { handleItemClick(item) },
                  },
                    React.createElement('div', { className: 'nb-item-icon' }, icon),
                    React.createElement('div', { className: 'nb-item-body' },
                      React.createElement('div', { className: 'nb-item-title' }, item.title),
                      React.createElement('div', { className: 'nb-item-content' }, item.content),
                      React.createElement('div', { className: 'nb-item-time' }, formatTimeShort(item.createdAt))
                    )
                  )
                })
          ),
          React.createElement('div', { className: 'nb-dropdown-footer' },
            React.createElement('span', {
              className: 'nb-view-all-link',
              onClick: handleViewAll,
            }, '\u67E5\u770B\u5168\u90E8')
          )
        )
      : null
  )
}

export { NotificationBadge }