/**
 * Feedback 反馈页面 — Bug提交 / 意见反馈 / 满意度评分
 * 使用单引号 + concatenation
 */

import React, { useState, useCallback } from 'react'
import type { FeedbackType, FeedbackSeverity } from '../lib/database/types'
import './Feedback.css'

var FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'bug', label: 'Bug 报告' },
  { value: 'feature', label: '功能建议' },
  { value: 'accuracy', label: '准确度反馈' },
  { value: 'other', label: '其他' }
]

var SEVERITY_LABELS: Record<FeedbackSeverity, string> = {
  low: '低',
  normal: '中',
  high: '高',
  critical: '紧急'
}

var RATING_LABELS = ['', '非常不满意', '不满意', '一般', '满意', '非常满意']

function Feedback() {
  var typeHook = useState<FeedbackType>('bug')
  var feedbackType = typeHook[0]
  var setFeedbackType = typeHook[1]

  var severityHook = useState<FeedbackSeverity>('normal')
  var severity = severityHook[0]
  var setSeverity = severityHook[1]

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

  var handleSubmit = useCallback(async function(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('请填写标题和详细描述')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      await new Promise(function(resolve) { setTimeout(resolve, 1200) })
      // 模拟提交成功
      setSuccess(true)
    } catch (err) {
      setError('提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }, [title, content])

  var handleReset = useCallback(function() {
    setFeedbackType('bug')
    setSeverity('normal')
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

      // 严重程度（Bug 时显示）
      feedbackType === 'bug' && React.createElement('div', { className: 'feedback-field' },
        React.createElement('label', null, '严重程度'),
        React.createElement('select', {
          className: 'feedback-select',
          value: severity,
          onChange: function(e: React.ChangeEvent<HTMLSelectElement>) { setSeverity(e.target.value as FeedbackSeverity) }
        },
          Object.keys(SEVERITY_LABELS).map(function(key) {
            return React.createElement('option', { key: key, value: key }, SEVERITY_LABELS[key as FeedbackSeverity])
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
    )
  )
}

export default Feedback
