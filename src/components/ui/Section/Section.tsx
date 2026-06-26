import { ReactNode } from 'react'
import './Section.css'

export interface SectionProps {
  title?: string
  subtitle?: string
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export default function Section({
  title,
  subtitle,
  icon,
  className = '',
  children,
}: SectionProps) {
  const classes = ['xui-section', className].filter(Boolean).join(' ')

  return (
    <section className={classes}>
      {(title || subtitle) && (
        <div className="xui-section__header">
          {icon && <span className="xui-section__icon">{icon}</span>}
          <div className="xui-section__titles">
            {title && <h3 className="xui-section__title">{title}</h3>}
            {subtitle && <p className="xui-section__subtitle">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="xui-section__body">{children}</div>
    </section>
  )
}
