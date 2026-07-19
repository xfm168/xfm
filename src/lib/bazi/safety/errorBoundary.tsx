import React from 'react'
import { baziLogger } from './logger'

/**
 * 八字模块专用 Error Boundary
 *
 * 与全局 Error Boundary 区分：仅包裹八字命盘相关子树，
 * 在命盘 / 分析渲染抛错时不让整页白屏，而是显示黑金国风错误兜底页，
 * 并提供「重试」与「返回输入」按钮，同时记录结构化错误日志。
 *
 * 使用方式：
 * <BaziErrorBoundary>
 *   <BaziChart />
 * </BaziErrorBoundary>
 *
 * 设计要点：
 *  - fallback 使用内联样式，避免依赖 CSS 文件（CSS 加载失败时仍可用）
 *  - 错误经 BaziLogger 上报，便于后续排查
 *  - 提供 onError 回调，便于上层接入监控 / 埋点
 */

export interface BaziErrorBoundaryProps {
  children: React.ReactNode
  /** 自定义兜底 UI */
  fallback?: React.ReactNode
  /** 错误回调（上报 / 埋点） */
  onError?: (error: Error, info: React.ErrorInfo) => void
  /** 重置时回调（例如清空分析状态） */
  onReset?: () => void
}

export interface BaziErrorBoundaryState {
  hasError: boolean
  error: Error | null
  /** 重试计数，用于 fallback 显示 */
  retryCount: number
}

/** 黑金国风主题色（与项目 ErrorPages.css 一致，内联以防 CSS 加载失败） */
const THEME = {
  bgGradient: 'linear-gradient(180deg, #071629 0%, #0B1F3B 50%, #112845 100%)',
  goldGradient: 'linear-gradient(180deg, #E8C56A 0%, #D4AF37 35%, #B8860B 100%)',
  textPrimary: '#F5F1E8',
  textSecondary: '#B8C4D6',
  textTertiary: '#6B7D94',
  cardBg: 'rgba(232, 197, 106, 0.06)',
  cardBorder: 'rgba(232, 197, 106, 0.25)',
  errorText: '#E57373',
}

export class BaziErrorBoundary extends React.Component<
  BaziErrorBoundaryProps,
  BaziErrorBoundaryState
> {
  constructor(props: BaziErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<BaziErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // 记录结构化错误日志
    baziLogger.error('八字模块渲染异常', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      retryCount: this.state.retryCount,
    })
    // 上报回调
    this.props.onError?.(error, info)
  }

  /** 重试：清空错误状态并增加重试计数 */
  handleRetry = (): void => {
    this.props.onReset?.()
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }))
  }

  /** 返回输入页 */
  handleBack = (): void => {
    window.location.hash = '#/bazi'
    window.location.reload()
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    // 自定义 fallback 优先
    if (this.props.fallback) {
      return this.props.fallback
    }

    const { error, retryCount } = this.state
    const isRepeated = retryCount > 0

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 32,
          background: THEME.bgGradient,
          color: THEME.textPrimary,
          textAlign: 'center',
          fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        }}
      >
        {/* 八卦装饰符号 */}
        <div
          style={{
            fontSize: 48,
            background: THEME.goldGradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
          }}
        >
          ☰
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            background: THEME.goldGradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
          }}
        >
          命盘解析异常
        </h1>

        <p style={{ color: THEME.textSecondary, fontSize: 14, margin: 0, maxWidth: 420 }}>
          {isRepeated
            ? '该命盘在重试后仍无法解析，可能为输入数据异常，请返回重新排盘。'
            : '八字模块在渲染时遇到异常，您可以重试或返回重新排盘。错误已自动记录。'}
        </p>

        {/* 错误详情（折叠，便于排查） */}
        {error && (
          <details
            style={{
              width: '100%',
              maxWidth: 520,
              background: THEME.cardBg,
              border: `1px solid ${THEME.cardBorder}`,
              borderRadius: 8,
              padding: '12px 16px',
              color: THEME.errorText,
              fontSize: 12,
              textAlign: 'left',
            }}
          >
            <summary style={{ cursor: 'pointer', color: THEME.textSecondary }}>
              查看错误详情
            </summary>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                marginTop: 8,
                color: THEME.errorText,
              }}
            >
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              padding: '10px 28px',
              border: 'none',
              borderRadius: 24,
              background: THEME.goldGradient,
              color: '#071629',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 44,
              minWidth: 88,
            }}
          >
            重试
          </button>
          <button
            type="button"
            onClick={this.handleBack}
            style={{
              padding: '10px 28px',
              borderRadius: 24,
              background: 'transparent',
              border: `1px solid ${THEME.cardBorder}`,
              color: THEME.textPrimary,
              fontSize: 14,
              cursor: 'pointer',
              minHeight: 44,
              minWidth: 88,
            }}
          >
            返回排盘
          </button>
        </div>

        <p style={{ color: THEME.textTertiary, fontSize: 12, marginTop: 4 }}>
          玄风门 · 错误已记录，我们将持续优化
        </p>
      </div>
    )
  }
}

/**
 * 高阶组件：为目标组件包裹 BaziErrorBoundary
 *
 * @example
 * export default withBaziErrorBoundary(BaziChart)
 */
export function withBaziErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<BaziErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <BaziErrorBoundary {...options}>
      <Component {...props} />
    </BaziErrorBoundary>
  )
  Wrapped.displayName = `withBaziErrorBoundary(${Component.displayName || Component.name || 'Component'})`
  return Wrapped
}
