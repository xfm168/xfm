import { ReactNode } from 'react'
import './Card.css'

export type CardVariant = 'default' | 'highlight' | 'ghost' | 'feature'
export type CardPadding = 'sm' | 'md' | 'lg'

export interface CardProps {
  variant?: CardVariant
  padding?: CardPadding
  hoverable?: boolean
  onClick?: () => void
  className?: string
  children: ReactNode
}

export default function Card({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
  className = '',
  children,
}: CardProps) {
  const classes = [
    'xui-card',
    `xui-card--${variant}`,
    `xui-card--p-${padding}`,
    hoverable ? 'xui-card--hoverable' : '',
    onClick ? 'xui-card--clickable' : '',
    className,
  ].filter(Boolean).join(' ')

  const Component = onClick ? 'button' : 'div'

  return (
    <Component className={classes} onClick={onClick}>
      {children}
    </Component>
  )
}
