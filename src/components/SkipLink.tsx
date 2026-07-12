/**
 * SkipLink 组件
 *
 * 跳转到主内容的快捷链接，键盘用户按 Tab 时第一个获得焦点。
 * 默认视觉隐藏，获得焦点时显现为顶部高亮按钮，点击后聚焦并滚动到目标元素。
 *
 * props:
 *   - targetId: 目标元素 id，默认 'main-content'
 *   - label: 链接文本，默认 '跳到主内容'
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { CSSProperties, MouseEvent as ReactMouseEvent, useState } from 'react'

export interface SkipLinkProps {
  /** 目标元素 id，默认 'main-content' */
  targetId?: string
  /** 链接文本，默认 '跳到主内容' */
  label?: string
}

/** 未聚焦时的隐藏样式（移出可视区域） */
const hiddenStyle: CSSProperties = {
  position: 'absolute',
  left: '-9999px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden'
}

/** 聚焦时的可见样式 */
const visibleStyle: CSSProperties = {
  position: 'fixed',
  top: '0',
  left: '0',
  zIndex: 9999,
  display: 'inline-block',
  padding: '8px 16px',
  background: '#D4AF37',
  color: '#071629',
  fontWeight: 600,
  textDecoration: 'none',
  borderRadius: '0 0 6px 0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
}

/**
 * SkipLink
 *
 * @example
 *   <SkipLink />
 *   <SkipLink targetId="analysis-root" label="跳到分析结果" />
 */
export default function SkipLink({
  targetId = 'main-content',
  label = '跳到主内容'
}: SkipLinkProps) {
  const [focused, setFocused] = useState(false)

  const handleClick = (e: ReactMouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      // 临时设置 tabindex 使元素可聚焦
      target.setAttribute('tabindex', '-1')
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <a
      href={'#' + targetId}
      style={focused ? visibleStyle : hiddenStyle}
      onClick={handleClick}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {label}
    </a>
  )
}
