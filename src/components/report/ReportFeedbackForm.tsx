/**
 * ReportFeedbackForm -- 报告内嵌反馈组件
 *
 * 嵌入在 ProReportPage 底部，收集用户对报告的评价。
 * 使用 JSX 语法，CSS 前缀 xf-（xuanfeng feedback）。
 *
 * 约束：
 *   - 禁止 import { type X }，使用 import type { X } 单独语句
 *   - 禁止 any，禁止 @ts-ignore
 */

import { useState, useCallback } from 'react'
import { useProFeedback } from '../../hooks/useProFeedback'
import type { ProFeedbackSubmitData } from '../../hooks/useProFeedback'
import './ReportFeedbackForm.css'

// ─── 维度定义 ───

var DIMENSIONS = [
  { key: 'accuracy', label: '准确度' },
  { key: 'personality', label: '性格符合度' },
  { key: 'career', label: '事业符合度' },
  { key: 'wealth', label: '财运符合度' },
  { key: 'marriage', label: '婚姻符合度' },
  { key: 'health', label: '健康建议参考度' },
] as const

type DimensionKey = typeof DIMENSIONS[number]['key']

// ─── StarRating 子组件 ───

function StarRating({
  value,
  onChange,
  isOverall,
}: {
  value: number
  onChange: (v: number) => void
  isOverall?: boolean
}) {
  var _hover = useState<number>(0)
  var hoverValue = _hover[0]
  var setHover = _hover[1]

  var sizeClass = isOverall ? ' xf-star--overall' : ''

  return (
    <div className="xf-rating-group__stars">
      {[1, 2, 3, 4, 5].map(function(star) {
        var isActive = star <= (hoverValue || value)
        var className = 'xf-star' + sizeClass
        if (isActive && hoverValue > 0) {
          className += ' xf-star--hover'
        } else if (star <= value) {
          className += ' xf-star--filled'
        }
        return (
          <button
            key={star}
            type="button"
            className={className}
            onClick={function() { onChange(star) }}
            onMouseEnter={function() { setHover(star) }}
            onMouseLeave={function() { setHover(0) }}
            aria-label={star + ' \u661F'}
          >
            {'\u2605'}
          </button>
        )
      })}
    </div>
  )
}

// ─── Props ───

interface ReportFeedbackFormProps {
  reportId: string
  userId?: string | null
  engineVersion?: string
  tier?: string
  onSubmitSuccess?: () => void
}

// ─── 主组件 ───

export default function ReportFeedbackForm(props: ReportFeedbackFormProps) {
  var reportId = props.reportId
  var userId = props.userId
  var engineVersion = props.engineVersion
  var tier = props.tier
  var onSubmitSuccess = props.onSubmitSuccess

  // 评分状态
  var overallState = useState<number>(0)
  var overallRating = overallState[0]
  var setOverallRating = overallState[1]

  var dimState = useState<Record<DimensionKey, number>>({
    accuracy: 0,
    personality: 0,
    career: 0,
    wealth: 0,
    marriage: 0,
    health: 0,
  })
  var dimensionRatings = dimState[0]
  var setDimensionRatings = dimState[1]

  // 文字反馈
  var accurateState = useState<string>('')
  var mostAccurate = accurateState[0]
  var setMostAccurate = accurateState[1]

  var improveState = useState<string>('')
  var improvementSuggestions = improveState[0]
  var setImprovementSuggestions = improveState[1]

  var continueState = useState<string>('yes')
  var wouldContinue = continueState[0]
  var setWouldContinue = continueState[1]

  var anonState = useState<boolean>(true)
  var isAnonymous = anonState[0]
  var setIsAnonymous = anonState[1]

  // Hook
  var feedback = useProFeedback()

  var handleDimensionChange = useCallback(function(key: DimensionKey, value: number) {
    setDimensionRatings(function(prev) {
      var next: Record<DimensionKey, number> = {
        accuracy: prev.accuracy,
        personality: prev.personality,
        career: prev.career,
        wealth: prev.wealth,
        marriage: prev.marriage,
        health: prev.health,
      }
      next[key] = value
      return next
    })
  }, [])

  var handleSubmit = useCallback(async function() {
    var submitData: ProFeedbackSubmitData = {
      report_id: reportId,
      user_id: userId || null,
      chart_id: null,
      engine_version: engineVersion || '',
      tier: tier || '',
      overall_rating: overallRating,
      dimension_ratings: {
        accuracy: dimensionRatings.accuracy,
        personality: dimensionRatings.personality,
        career: dimensionRatings.career,
        wealth: dimensionRatings.wealth,
        marriage: dimensionRatings.marriage,
        health: dimensionRatings.health,
      },
      most_accurate: mostAccurate || undefined,
      improvement_suggestions: improvementSuggestions || undefined,
      would_continue: wouldContinue,
      is_anonymous: isAnonymous,
    }
    await feedback.submitFeedback(submitData)
    if (onSubmitSuccess) {
      onSubmitSuccess()
    }
  }, [
    reportId, userId, engineVersion, tier, overallRating,
    dimensionRatings, mostAccurate, improvementSuggestions,
    wouldContinue, isAnonymous, feedback, onSubmitSuccess,
  ])

  // 感谢状态
  if (feedback.success) {
    return (
      <div className="xf-form">
        <div className="xf-thankyou">
          <span className="xf-thankyou__icon">{'\u2728'}</span>
          <h3 className="xf-thankyou__title">感谢您的反馈</h3>
          <p className="xf-thankyou__text">
            您的评价将帮助我们持续改进报告质量
          </p>
        </div>
      </div>
    )
  }

  var canSubmit = overallRating > 0

  return (
    <div className="xf-form">
      <h3 className="xf-form__title">报告评价</h3>
      <p className="xf-form__subtitle">您的反馈对我们非常重要</p>

      {/* 总体评分 */}
      <div className="xf-rating-group">
        <div className="xf-rating-group__label">总体评分（必填）</div>
        <StarRating
          value={overallRating}
          onChange={setOverallRating}
          isOverall={true}
        />
      </div>

      {/* 六维评分 */}
      <div className="xf-dimensions">
        <div className="xf-dimensions__title">分项评分</div>
        {DIMENSIONS.map(function(dim) {
          return (
            <div key={dim.key} className="xf-dimension-row">
              <span className="xf-dimension-row__name">{dim.label}</span>
              <div className="xf-dimension-row__stars">
                <StarRating
                  value={dimensionRatings[dim.key]}
                  onChange={function(v) { handleDimensionChange(dim.key, v) }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* 最准确的部分 */}
      <div className="xf-textarea-group">
        <label className="xf-textarea-group__label">最准确的部分？</label>
        <textarea
          className="xf-textarea"
          value={mostAccurate}
          onChange={function(e) { setMostAccurate(e.target.value) }}
          placeholder="请告诉我们报告中哪些部分让您印象深刻..."
        />
      </div>

      {/* 需要改进的地方 */}
      <div className="xf-textarea-group">
        <label className="xf-textarea-group__label">需要改进的地方？</label>
        <textarea
          className="xf-textarea"
          value={improvementSuggestions}
          onChange={function(e) { setImprovementSuggestions(e.target.value) }}
          placeholder="您觉得哪些内容可以更详细或更准确..."
        />
      </div>

      {/* 是否愿意继续使用 */}
      <div className="xf-select-group">
        <label className="xf-select-group__label">是否愿意继续使用？</label>
        <select
          className="xf-select"
          value={wouldContinue}
          onChange={function(e) { setWouldContinue(e.target.value) }}
        >
          <option value="yes">{'\u662F'}</option>
          <option value="no">{'\u5426'}</option>
          <option value="unsure">{'\u4E0D\u786E\u5B9A'}</option>
        </select>
      </div>

      {/* 是否匿名 */}
      <div className="xf-checkbox-group">
        <input
          type="checkbox"
          className="xf-checkbox"
          checked={isAnonymous}
          onChange={function(e) { setIsAnonymous(e.target.checked) }}
          id="xf-anonymous"
        />
        <label className="xf-checkbox-group__label" htmlFor="xf-anonymous">
          匿名提交
        </label>
      </div>

      {/* 提交按钮 */}
      <button
        className="xf-submit"
        disabled={!canSubmit || feedback.submitting}
        onClick={handleSubmit}
      >
        {feedback.submitting ? '提交中...' : '提交反馈'}
      </button>

      {/* 错误信息 */}
      {feedback.error && (
        <div className="xf-error">{feedback.error}</div>
      )}
    </div>
  )
}
