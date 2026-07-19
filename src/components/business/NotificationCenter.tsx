/**
 * NotificationCenter 通知列表组件
 *
 * 显示通知列表，支持标记已读、全部已读、删除、分页加载更多。
 * 不同类型通知显示不同图标。
 * 禁止模板字符串。
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNotifications } from '../../hooks/useNotifications'
import type { NotificationItem } from '../../hooks/useNotifications'
import './NotificationCenter.css'

/** 通知类型对应图标 */
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

/** 格式化时间为相对时间 */
function formatTime(dateStr: string): string {
  if (!dateStr) return ''
  var now = Date.now()
  var then = new Date(dateStr).getTime()
  var diffMs = now - then
  var diffSec = Math.floor(diffMs / 1000)
  var diffMin = Math.floor(diffSec / 60)
  var diffHour = Math.floor(diffMin / 60)
  var diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '刚刚'
  if (diffMin < 60) return diffMin + ' 分钟前'
  if (diffHour < 24) return diffHour + ' 小时前'
  if (diffDay < 30) return diffDay + ' 天前'

  var d = new Date(dateStr)
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

/** 单条通知项 */
function NotificationRow(props: {
  item: NotificationItem
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  var item = props.item
  var icon = TYPE_ICONS[item.type] || '\uD83D\uDCE2'
  var isUnread = !item.isRead

  function handleClick() {
    if (isUnread) {
      props.onRead(item.id)
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    props.onDelete(item.id)
  }

  return React.createElement('div', {
    className: 'nc-item ' + (isUnread ? 'unread' : 'read'),
    onClick: handleClick,
  },
    React.createElement('div', { className: 'nc-icon' }, icon),
    React.createElement('div', { className: 'nc-body' },
      React.createElement('div', { className: 'nc-item-title' }, item.title),
      React.createElement('div', { className: 'nc-item-content' }, item.content),
      React.createElement('div', { className: 'nc-item-time' }, formatTime(item.createdAt))
    ),
    React.createElement('div', { className: 'nc-actions' },
      React.createElement('button', {
        className: 'nc-delete-btn',
        onClick: handleDelete,
        title: '删除',
      }, '\u2715')
    )
  )
}

/** NotificationCenter 组件 */
export default function NotificationCenter() {
  var notifHook = useNotifications()
  var unreadCount = notifHook.unreadCount
  var notifications = notifHook.notifications
  var loading = notifHook.loading
  var fetchNotifications = notifHook.fetchNotifications
  var markAsRead = notifHook.markAsRead
  var markAllAsRead = notifHook.markAllAsRead
  var deleteNotification = notifHook.deleteNotification

  var pageState = useState(1)
  var page = pageState[0]
  var setPage = pageState[1]

  var totalState = useState(0)
  var total = totalState[0]
  var setTotal = totalState[1]

  var hasMore = notifications.length < total

  useEffect(function() {
    fetchNotifications(1, 20).then(function(json) {
      if (json) {
        setTotal(json.total || 0)
        setPage(1)
      }
    })
  }, [])

  var handleLoadMore = useCallback(function() {
    var nextPage = page + 1
    fetchNotifications(nextPage, 20).then(function(json) {
      if (json) {
        setTotal(json.total || 0)
        setPage(nextPage)
      }
    })
  }, [page, fetchNotifications])

  var handleMarkAll = useCallback(function() {
    markAllAsRead()
  }, [markAllAsRead])

  if (loading && notifications.length === 0) {
    return React.createElement('div', { className: 'nc-container' },
      React.createElement('div', { className: 'nc-loading' }, '\u52A0\u8F7D\u4E2D...')
    )
  }

  return React.createElement('div', { className: 'nc-container' },
    React.createElement('div', { className: 'nc-header' },
      React.createElement('div', { className: 'nc-header-left' },
        React.createElement('span', { className: 'nc-title' }, '\u901A\u77E5\u4E2D\u5FC3'),
        unreadCount > 0
          ? React.createElement('span', { className: 'nc-unread-badge' }, String(unreadCount))
          : null
      ),
      unreadCount > 0
        ? React.createElement('button', {
            className: 'nc-mark-all-btn',
            onClick: handleMarkAll,
          }, '\u5168\u90E8\u6807\u4E3A\u5DF2\u8BFB')
        : null
    ),
    notifications.length === 0
      ? React.createElement('div', { className: 'nc-empty' },
          React.createElement('div', { className: 'nc-empty-icon' }, '\uD83D\uDCE2'),
          React.createElement('div', null, '\u6682\u65E0\u901A\u77E5')
        )
      : React.createElement('div', { className: 'nc-list' },
          notifications.map(function(item) {
            return React.createElement(NotificationRow, {
              key: item.id,
              item: item,
              onRead: markAsRead,
              onDelete: deleteNotification,
            })
          })
        ),
    hasMore
      ? React.createElement('button', {
          className: 'nc-load-more',
          onClick: handleLoadMore,
        }, '\u52A0\u8F7D\u66F4\u591A')
      : null
  )
}