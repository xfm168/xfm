import { ReactNode } from 'react'
import './ResultCard.css'

export interface AdviceItem {
  label: string
  items: string[]
  type: 'do' | 'dont'
}

export interface ResultCardProps {
  title: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export default function ResultCard({
  title,
  icon,
  children,
  className = '',
}: ResultCardProps) {
  const classes = ['xbiz-result-card', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="xbiz-result-card__header">
        {icon && <span className="xbiz-result-card__icon">{icon}</span>}
        <h3 className="xbiz-result-card__title">{title}</h3>
      </div>
      <div className="xbiz-result-card__body">{children}</div>
    </div>
  )
}
