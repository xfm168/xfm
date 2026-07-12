/**
 * RC3-1: React Error Boundary 组件
 *
 * 功能：
 * - 捕获子组件渲染错误，显示友好错误页面（非白屏）
 * - 错误发生前通过 localStorage 临时保存用户输入
 * - 提供"重新分析"按钮（刷新页面）
 * - 提供"返回首页"按钮
 * - 自动将错误日志写入 logger（调用 logger.error）
 * - 显示错误 ID（方便用户报告）
 * - 开发环境显示完整 stack，生产环境只显示摘要
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import React from 'react'
import { logger } from '../lib/logger'
import { getErrorId, captureError } from './GlobalErrorHandler'
import type { StandardError } from './GlobalErrorHandler'

// ══════════════════════════════════════════════════
//  常量
// ══════════════════════════════════════════════════

/** localStorage key: 错误恢复数据 */
var RECOVERY_KEY = 'xuanfengmen_error_recovery'

/** 是否开发环境 */
var IS_DEV = (function (): boolean {
  try {
    return Boolean(import.meta && (import.meta as any).env && (import.meta as any).env.DEV)
  } catch {
    return false
  }
})()

// ══════════════════════════════════════════════════
//  类型定义
// ══════════════════════════════════════════════════

interface ErrorBoundaryProps {
  children: React.ReactNode
  /** 自定义 fallback 渲染函数（可选） */
  fallback?: (error: Error, errorId: string) => React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

// ══════════════════════════════════════════════════
//  内联样式
// ══════════════════════════════════════════════════

var styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '40px 20px',
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box',
  },
  card: {
    maxWidth: '600px',
    width: '100%',
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  icon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#e94560',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#e94560',
    textAlign: 'center',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  message: {
    fontSize: '15px',
    color: '#a0a0b0',
    textAlign: 'center',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  errorIdBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f3460',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '24px',
    gap: '12px',
  },
  errorIdLabel: {
    fontSize: '12px',
    color: '#8888aa',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  errorIdValue: {
    fontSize: '14px',
    color: '#4ecca3',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  copyButton: {
    backgroundColor: 'transparent',
    border: '1px solid #4ecca3',
    color: '#4ecca3',
    borderRadius: '4px',
    padding: '4px 12px',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  detailsBox: {
    backgroundColor: '#0d1b2a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    maxHeight: '300px',
    overflow: 'auto',
  },
  detailsTitle: {
    fontSize: '13px',
    color: '#8888aa',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  detailsContent: {
    fontSize: '12px',
    color: '#a0a0b0',
    fontFamily: 'monospace',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: '#e94560',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    color: '#e0e0e0',
    border: '1px solid #444466',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '15px',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
}

// ══════════════════════════════════════════════════
//  ErrorBoundary 组件
// ══════════════════════════════════════════════════

/**
 * React Error Boundary
 *
 * 捕获子组件渲染错误，显示友好错误页面。
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    }
  }

  /**
   * 静态方法：从错误中派生状态
   * 在渲染阶段调用，不应有副作用
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  /**
   * 错误捕获后处理：
   * 1. 生成错误 ID
   * 2. 通过 captureError 写入 logger
   * 3. 保存用户输入到 localStorage
   * 4. 更新 state（errorId）
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 生成错误 ID 并记录日志
    var standardError: StandardError = captureError(error, {
      module: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
    })

    // 保存用户输入（best effort）
    this.saveRecoveryData(standardError.id)

    // 更新 state
    this.setState({ errorId: standardError.id })
  }

  /**
   * 保存用户输入到 localStorage（best effort）
   * 尝试从 DOM 读取表单数据，失败则仅保存 URL
   */
  private saveRecoveryData(errorId: string): void {
    try {
      var formData: Record<string, string> = {}

      // 尝试读取表单数据
      var inputs = document.querySelectorAll('input, textarea, select')
      for (var i = 0; i < inputs.length; i++) {
        var el = inputs[i] as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        var name = el.name || el.id || el.getAttribute('data-key') || ''
        if (name && el.value) {
          // 跳过密码字段（安全考虑）
          if (el instanceof HTMLInputElement && el.type === 'password') {
            continue
          }
          formData[name] = el.value
        }
      }

      var recovery = {
        url: window.location.href,
        timestamp: Date.now(),
        errorId,
        formData,
      }

      localStorage.setItem(RECOVERY_KEY, JSON.stringify(recovery))
    } catch {
      // Best effort — 静默忽略
    }
  }

  /**
   * 复制错误 ID 到剪贴板
   */
  private copyErrorId = (): void => {
    var errorId = this.state.errorId
    if (!errorId) return

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(errorId)
      } else {
        // 回退方案
        var textarea = document.createElement('textarea')
        textarea.value = errorId
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
    } catch {
      // ignore
    }
  }

  /**
   * 重新分析（刷新页面）
   */
  private handleRetry = (): void => {
    window.location.reload()
  }

  /**
   * 返回首页
   */
  private handleGoHome = (): void => {
    window.location.href = '/'
  }

  /**
   * 渲染错误详情
   * 开发环境：完整 stack
   * 生产环境：仅摘要
   */
  private renderErrorDetails(): React.ReactNode {
    var error = this.state.error
    if (!error) return null

    if (IS_DEV) {
      // 开发环境：显示完整堆栈
      var stack = error.stack || error.message || 'No stack available'
      return (
        <div style={styles.detailsBox}>
          <div style={styles.detailsTitle}>Error Details (Development)</div>
          <div style={styles.detailsContent}>{stack}</div>
        </div>
      )
    }

    // 生产环境：仅显示摘要
    var summary = error.name + ': ' + error.message
    return (
      <div style={styles.detailsBox}>
        <div style={styles.detailsTitle}>Error Summary</div>
        <div style={styles.detailsContent}>{summary}</div>
      </div>
    )
  }

  /**
   * 渲染错误 UI
   */
  private renderErrorUI(): React.ReactNode {
    // 如果提供了自定义 fallback，使用它
    if (this.props.fallback && this.state.error && this.state.errorId) {
      return this.props.fallback(this.state.error, this.state.errorId)
    }

    var errorId = this.state.errorId || 'generating...'

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {/* 错误图标 */}
          <div style={styles.icon}>!</div>

          {/* 标题 */}
          <h1 style={styles.title}>应用遇到了问题</h1>

          {/* 说明消息 */}
          <p style={styles.message}>
            很抱歉，应用在运行过程中遇到了意外错误。
            <br />
            您的输入已自动保存，重新分析时可恢复。
          </p>

          {/* 错误 ID */}
          <div style={styles.errorIdBox}>
            <div>
              <div style={styles.errorIdLabel}>Error ID</div>
              <div style={styles.errorIdValue}>{errorId}</div>
            </div>
            <button style={styles.copyButton} onClick={this.copyErrorId}>
              复制
            </button>
          </div>

          {/* 错误详情 */}
          {this.renderErrorDetails()}

          {/* 操作按钮 */}
          <div style={styles.buttonGroup}>
            <button style={styles.primaryButton} onClick={this.handleRetry}>
              重新分析
            </button>
            <button style={styles.secondaryButton} onClick={this.handleGoHome}>
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.renderErrorUI()
    }
    return this.props.children
  }
}

export default ErrorBoundary
