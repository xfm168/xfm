import React from 'react'
import { Link } from 'react-router-dom'
import './ErrorPages.css'

/**
 * 404 页面 — 页面未找到
 */
export function NotFoundPage(): React.ReactElement {
  return (
    <div className="error-page" role="alert">
      <p className="error-page__code">404</p>
      <h1 className="error-page__title">{'页面未找到'}</h1>
      <p className="error-page__message">
        {'您访问的页面不存在或已被移除，请检查地址是否正确。'}
      </p>
      <Link to="/" className="error-page__btn">
        {'返回首页'}
      </Link>
    </div>
  )
}

/**
 * 500 页面 — 服务器错误
 */
export function ServerErrorPage(): React.ReactElement {
  function handleRetry(): void {
    window.location.reload()
  }

  return (
    <div className="error-page" role="alert">
      <p className="error-page__code">500</p>
      <h1 className="error-page__title">{'服务器错误'}</h1>
      <p className="error-page__message">
        {'服务暂时不可用，请稍后再试。如果问题持续存在，请联系客服。'}
      </p>
      <p className="error-page__detail">
        {'错误已自动上报，我们会尽快处理。'}
      </p>
      <button
        className="error-page__btn"
        onClick={handleRetry}
        type="button"
      >
        {'重新加载'}
      </button>
    </div>
  )
}

/**
 * 维护页面 — 系统维护中
 *
 * @param estimatedRecoveryTime - 预计恢复时间（ISO 字符串），可选
 */
export function MaintenancePage({
  estimatedRecoveryTime,
}: {
  estimatedRecoveryTime?: string
}): React.ReactElement {
  const recoveryDisplay = estimatedRecoveryTime
    ? new Date(estimatedRecoveryTime).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '敬请等待'

  return (
    <div className="error-page" role="status" aria-live="polite">
      <div className="error-page__icon" aria-hidden="true">
        {String.fromCodePoint(0x1F527)}
      </div>
      <h1 className="error-page__title">{'系统维护中'}</h1>
      <p className="error-page__message">
        {'我们正在升级系统以提供更好的服务，请稍后再访问。'}
      </p>
      <p className="error-page__detail">
        {'预计恢复时间：'}
      </p>
      <p className="error-page__countdown">
        {recoveryDisplay}
      </p>
    </div>
  )
}
