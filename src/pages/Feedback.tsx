/**
 * Feedback 反馈页面 — Bug提交 / 意见反馈 / 满意度评分
 * Stage 5: 使用真实 API 调用
 * 使用单引号 + concatenation
 */

import React, { useState, useCallback, useEffect } from 'react'
import type { FeedbackType } from '../lib/database/types'
import './Feedback.css'

var FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug 报告' },
  { value: 'feature', label: '功能建议' },
  { value: 'accuracy', label: '命理解读反馈' },
  { value: 'other', label: '其他' }
]

var STATUS_LABELS: Record<string, string> = {
  open: '待处理',
  processing: '处理中',
  reviewed: '已审核',
  accepted: '已通过',
  rejected: '已拒绝',
  resolved: '已解决',
  closed: '已关闭'
}

var TYPE_LABELS: Record<string, string> = {
  bug: 'Bug',
  feature: '建议',
  accuracy: '反馈',
  other: '其他'
}

var RATING_LABELS = ['', '非常不满意', '不满意', '一般', '满意', '非常满意']

function getToken() {
  try {
    var raw = localStorage.getItem('sb-xuanfengmen-auth-token')
    if (raw) {
      var parsed = JSON.parse(raw)
      return parsed.access_token || ''
    }
  } catch (e) { /* ignore */ }
  return ''
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  var d = new Date(dateStr)
  var month = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  var hour = String(d.getHours()).padStart(2, '0')
  var minute = String(d.getMinutes()).padStart(2, '0')
  return month + '-' + day + ' ' + hour + ':' + minute
}

function Feedback() {
  var typeHook = useState<FeedbackType>('bug')
  var feedbackType = typeHook[0]
  var setFeedbackType = typeHook[1]

  var titleHook = useState('')
  var title = titleHook[0]
  var setTitle = titleHook[1]

  var contentHook = useState('')
  var content = contentHook[0]
  var setContent = contentHook[1]

  var contactHook = useState('')
  var contact = contactHook[0]
  var setContact = contactHook[1]

  var ratingHook = useState(0)
  var rating = ratingHook[0]
  var setRating = ratingHook[1]

  var hoverRatingHook = useState(0)
  var hoverRating = hoverRatingHook[0]
  var setHoverRating = hoverRatingHook[1]

  var submittingHook = useState(false)
  var submitting = submittingHook[0]
  var setSubmitting = submittingHook[1]

  var successHook = useState(false)
  var success = successHook[0]
  var setSuccess = successHook[1]

  var errorHook = useState('')
  var error = errorHook[0]
  var setError = errorHook[1]

  // 我的反馈列表
  var myListHook = useState<Record<string, unknown>[]>([])
  var myList = myListHook[0]
  var setMyList = myListHook[1]

  var myListLoadingHook = useState(false)
  var myListLoading = myListLoadingHook[0]
  var setMyListLoading = myListLoadingHook[1]

  var handleSubmit = useCallback(async function(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('请填写标题和详细描述')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      var token = getToken()
      var body: Record<string, unknown> = {
        type: feedbackType,
        title: title.trim(),
        content: content.trim(),
      }
      if (contact.trim()) {
        body.contact = contact.trim()
      }
      if (rating > 0) {
        body.satisfaction = rating
      }

      var resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(body),
      })
      var json = await resp.json()

      if (resp.ok && json.success) {
        setSuccess(true)
        // 刷新我的反馈列表
        loadMyList()
      } else {
        setError(json.error ? json.error.message || '提交失败' : '提交失败，请稍后再试')
      }
    } catch (err) {
      setError('提交失败，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }, [title, content, contact, feedbackType, rating])

  var loadMyList = useCallback(function() {
    var token = getToken()
    if (!token) return
    setMyListLoading(true)
    fetch('/api/feedback/mine', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function(r) { return r.json() })
      .then(function(json) {
        if (json.items) {
          setMyList(json.items)
        }
      })
      .catch(function() { /* ignore */ })
      .finally(function() { setMyListLoading(false) })
  }, [])

  // 加载我的反馈列表
  useEffect(function() {
    loadMyList()
  }, [])

  var handleReset = useCallback(function() {
    setFeedbackType('bug')
    setTitle('')
    setContent('')
    setContact('')
    setRating(0)
    setHoverRating(0)
    setSuccess(false)
    setError('')
  }, [])

  var renderStars = function() {
    var stars = []
    for (var i = 1; i <= 5; i++) {
      var filled = i <= rating
      var hovered = i <= hoverRating
      var starClass = 'feedback-star'
      if (filled) starClass += ' filled'
      if (hovered && !filled) starClass += ' hovered'

      stars.push(
        React.createElement('span', {
          key: 'star-' + i,
          className: starClass,
          onClick: function() { setRating(i) },
          onMouseEnter: function() { setHoverRating(i) },
          onMouseLeave: function() { setHoverRating(0) }
        }, '\u2605')
      )
    }
    return stars
  }

  var renderMyList = function() {
    if (myList.length === 0) {
      return React.createElement('div', { className: 'feedback-empty-list' },
        React.createElement('p', null, '暂无反馈记录')
      )
    }

    var items = []
    for (var i = 0; i < myList.length; i++) {
      var item = myList[i]
      var statusClass = 'feedback-my-status'
      var st = item.status as string || 'open'
      if (st === 'resolved' || st === 'closed') statusClass += ' feedback-my-status-done'
      else if (st === 'processing') statusClass += ' feedback-my-status-processing'

      items.push(
        React.createElement('div', { key: 'item-' + String(i), className: 'feedback-my-item' },
          React.createElement('div', { className: 'feedback-my-item-header' },
            React.createElement('span', { className: 'feedback-my-type' },
              TYPE_LABELS[item.type as string] || String(item.type)
            ),
            React.createElement('span', { className: statusClass },
              STATUS_LABELS[st] || st
            ),
            React.createElement('span', { className: 'feedback-my-date' },
              formatDate(item.created_at as string)
            )
          ),
          React.createElement('div', { className: 'feedback-my-title' }, String(item.title || '')),
          item.satisfaction ? React.createElement('div', { className: 'feedback-my-satisfaction' },
            '\u2605 '.repeat(item.satisfaction as number)
          ) : null
        )
      )
    }

    return React.createElement('div', { className: 'feedback-my-list' }, items)
  }

  if (success) {
    return React.createElement('div', { className: 'feedback-page' },
      React.createElement('h1', null, '反馈提交'),
      React.createElement('div', { className: 'feedback-success' },
        React.createElement('div', { className: 'feedback-success-icon' }, '\u2713'),
        React.createElement('h2', null, '感谢您的反馈'),
        React.createElement('p', null, '我们已收到您的反馈，会尽快处理。'),
        React.createElement('button', {
          className: 'feedback-another-btn',
          onClick: handleReset
        }, '继续提交反馈')
      )
    )
  }

  return React.createElement('div', { className: 'feedback-page' },
    React.createElement('h1', null, '反馈中心'),
    React.createElement('p', { className: 'feedback-subtitle' },
      '您的反馈对我们非常重要，帮助我们不断改进'
    ),

    React.createElement('form', {
      className: 'feedback-form-card',
      onSubmit: handleSubmit
    },
      React.createElement('h2', null,
        feedbackType === 'bug' ? 'Bug 报告' : feedbackType === 'feature' ? '功能建议' : '意见反馈'
      ),

      error && React.createElement('div', { className: 'feedback-error' }, error),

      // 问题分类
      React.createElement('div', { className: 'feedback-field' },
        React.createElement('label', null, '问题分类'),
        React.createElement('select', {
          className: 'feedback-select',
          value: feedbackType,
          onChange: function(e: React.ChangeEvent<HTMLSelectElement>) { setFeedbackType(e.target.value as FeedbackType) }
        },
          FEEDBACK_TYPES.map(function(t) {
            return React.createElement('option', { key: t.value, value: t.value }, t.label)
          })
        )
      ),

      // 标题
      React.createElement('div', { className: 'feedback-field' },
        React.createElement('label', null, '标题'),
        React.createElement('input', {
          className: 'feedback-input',
          type: 'text',
          placeholder: '简要描述您的问题或建议',
          value: title,
          onChange: function(e) { setTitle(e.target.value) }
        })
      ),

      // 详细描述
      React.createElement('div', { className: 'feedback-field' },
        React.createElement('label', null, '详细描述'),
        React.createElement('textarea', {
          className: 'feedback-textarea',
          placeholder: '请详细描述问题、复现步骤或您的建议...',
          value: content,
          onChange: function(e: React.ChangeEvent<HTMLTextAreaElement>) { setContent(e.target.value) }
        })
      ),

      // 满意度评分
      React.createElement('div', { className: 'feedback-field' },
        React.createElement('label', null, '满意度评分'),
        React.createElement('div', { className: 'feedback-rating' },
          React.createElement('div', { className: 'feedback-stars' }, renderStars()),
          React.createElement('span', { className: 'feedback-rating-label' },
            (hoverRating || rating) > 0 ? RATING_LABELS[hoverRating || rating] : '请选择评分'
          )
        )
      ),

      // 联系方式
      React.createElement('div', { className: 'feedback-field' },
        React.createElement('label', null, '联系方式（可选）'),
        React.createElement('input', {
          className: 'feedback-input',
          type: 'text',
          placeholder: '邮箱或手机号',
          value: contact,
          onChange: function(e) { setContact(e.target.value) }
        })
      ),

      // 提交
      React.createElement('button', {
        type: 'submit',
        className: 'feedback-submit',
        disabled: submitting
      }, submitting ? '提交中...' : '提交反馈')
    ),

    // 我的反馈记录
    React.createElement('div', { className: 'feedback-my-section' },
      React.createElement('h2', { className: 'feedback-my-heading' }, '我的反馈记录'),
      myListLoading
        ? React.createElement('div', { className: 'feedback-empty-list' }, React.createElement('p', null, '加载中...'))
        : renderMyList()
    )
  )
}

export default Feedback
