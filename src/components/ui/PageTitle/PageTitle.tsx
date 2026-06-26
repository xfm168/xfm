import { ReactNode } from 'react'
import './PageTitle.css'

export interface PageTitleProps {
  label?: string
  icon?: string
  title: string
  subtitle?: string
  className?: string
  children?: ReactNode
}

export default function PageTitle({
  label,
  icon,
  title,
  subtitle,
  className = '',
  children,
}: PageTitleProps) {
  const classes = ['xui-page-title', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="xui-page-title__glow" aria-hidden />
      <div className="xui-page-title__inner">
        {label && (
          <span className="xui-page-title__label">
            {icon && <span className="xui-page-title__icon">{icon}</span>}
            {label}
          </span>
        )}
        <h1 className="xui-page-title__title">{title}</h1>
        {subtitle && <p className="xui-page-title__subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
