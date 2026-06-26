import { ReactNode } from 'react'
import './Badge.css'

export type BadgeVariant = 'default' | 'gold' | 'success' | 'warning' | 'error'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
  dot?: boolean
  className?: string
  children: ReactNode
}

export default function Badge({
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  className = '',
  children,
}: BadgeProps) {
  const classes = [
    'xui-badge',
    `xui-badge--${variant}`,
    `xui-badge--${size}`,
    dot ? 'xui-badge--dot' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      {dot && <span className="xui-badge__dot" />}
      {icon && <span className="xui-badge__icon">{icon}</span>}
      {children}
    </span>
  )
}
