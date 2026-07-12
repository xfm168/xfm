/**
 * ScreenReaderOnly 组件
 *
 * 仅对屏幕阅读器可见、视觉上隐藏的文本容器。使用标准的 visually-hidden
 * 技术将其移出可视区域但保留可访问性，适用于为图标按钮补充说明、
 * 表单错误提示等场景。
 *
 * 通过 'as' 可指定渲染的底层元素（默认 span）。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { CSSProperties, ElementType, ReactNode } from 'react'

export interface ScreenReaderOnlyProps {
  /** 子内容 */
  children: ReactNode
  /** 渲染的底层元素，默认 'span' */
  as?: ElementType
  /** 附加 className */
  className?: string
}

/** visually-hidden 标准样式 */
const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: '0'
}

/**
 * ScreenReaderOnly
 *
 * @example
 *   <ScreenReaderOnly>关闭对话框</ScreenReaderOnly>
 *   <ScreenReaderOnly as="p">操作已成功完成</ScreenReaderOnly>
 */
export default function ScreenReaderOnly({
  children,
  as,
  className
}: ScreenReaderOnlyProps) {
  const Tag: ElementType = as || 'span'
  const classes = ['sr-only', className].filter(Boolean).join(' ')
  return (
    <Tag className={classes} style={visuallyHiddenStyle}>
      {children}
    </Tag>
  )
}
