import { ReactNode } from 'react'
import './PageBanner.css'

export interface PageBannerProps {
  icon?: string
  label?: string
  title: string
  subtitle?: string
  children?: ReactNode
  className?: string
}

export default function PageBanner({
  icon,
  label,
  title,
  subtitle,
  children,
  className = '',
}: PageBannerProps) {
  const classes = ['xbiz-page-banner', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="xbiz-page-banner__glow" aria-hidden />
      <div className="xbiz-page-banner__mountain" aria-hidden />
      <div className="xbiz-page-banner__inner">
        {label && (
          <span className="xbiz-page-banner__label">
            {icon && <span className="xbiz-page-banner__icon">{icon}</span>}
            {label}
          </span>
        )}
        <h1 className="xbiz-page-banner__title">{title}</h1>
        {subtitle && <p className="xbiz-page-banner__subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  )
}
