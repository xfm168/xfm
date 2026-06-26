import { ReactNode } from 'react'
import './Tag.css'

export type TagVariant = 'default' | 'gold' | 'outline'
export type TagSize = 'sm' | 'md'

export interface TagProps {
  variant?: TagVariant
  size?: TagSize
  closable?: boolean
  onClose?: () => void
  className?: string
  children: ReactNode
}

export default function Tag({
  variant = 'default',
  size = 'md',
  closable = false,
  onClose,
  className = '',
  children,
}: TagProps) {
  const classes = [
    'xui-tag',
    `xui-tag--${variant}`,
    `xui-tag--${size}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      {children}
      {closable && (
        <button
          type="button"
          className="xui-tag__close"
          onClick={onClose}
          aria-label="移除"
        >
          ×
        </button>
      )}
    </span>
  )
}
