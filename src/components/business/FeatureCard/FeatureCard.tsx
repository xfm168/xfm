import { ReactNode, CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import './FeatureCard.css'

export type FeatureIconType = 'bagua' | 'coins' | 'house' | 'records' | 'bazi' | 'custom'

export interface FeatureCardBaseProps {
  icon: FeatureIconType | ReactNode
  title: string
  subtitle: string
  className?: string
}

export type FeatureCardProps = FeatureCardBaseProps & (
  | { path: string; style?: CSSProperties; onClick?: never }
  | { onClick: () => void; path?: string; style?: CSSProperties }
  | { path?: never; onClick?: never; style?: CSSProperties }
)

const iconSvgs: Record<Exclude<FeatureIconType, 'custom'>, ReactNode> = {
  bagua: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.2" opacity="0.3" />
      <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="24" cy="24" r="7" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.2" />
      <text x="24" y="28" textAnchor="middle" fill="currentColor" fontSize="10">☯</text>
      <text x="24" y="6" textAnchor="middle" fill="currentColor" fontSize="8">乾</text>
      <text x="42" y="27" textAnchor="middle" fill="currentColor" fontSize="8">离</text>
      <text x="24" y="46" textAnchor="middle" fill="currentColor" fontSize="8">巽</text>
      <text x="6" y="27" textAnchor="middle" fill="currentColor" fontSize="8">艮</text>
    </svg>
  ),
  coins: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="24" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <circle cx="28" cy="20" r="10" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
      <rect x="16" y="22" width="4" height="4" fill="currentColor" fillOpacity="0.3" />
      <rect x="26" y="18" width="4" height="4" fill="currentColor" fillOpacity="0.4" />
      <circle cx="36" cy="30" r="8" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.03" />
      <rect x="34" y="28" width="4" height="4" fill="currentColor" fillOpacity="0.2" />
    </svg>
  ),
  house: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 22 L24 8 L40 22 L40 38 L8 38 Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.05" />
      <path d="M18 38 L18 28 L30 28 L30 38" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.08" />
      <path d="M24 8 L24 14" stroke="currentColor" strokeWidth="1" />
      <circle cx="24" cy="11" r="1.5" fill="currentColor" fillOpacity="0.5" />
    </svg>
  ),
  records: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="28" height="36" rx="3" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.05" />
      <ellipse cx="24" cy="6" rx="14" ry="3" stroke="currentColor" strokeWidth="1.2" />
      <ellipse cx="24" cy="42" rx="14" ry="3" stroke="currentColor" strokeWidth="1.2" />
      <line x1="16" y1="16" x2="32" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="16" y1="28" x2="32" y2="28" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="34" x2="26" y2="34" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <rect x="16" y="37" width="6" height="3" rx="1" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
    </svg>
  ),
  bazi: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="8" width="36" height="32" rx="2" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.05" />
      <line x1="15" y1="8" x2="15" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="24" y1="8" x2="24" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="33" y1="8" x2="33" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <line x1="6" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <text x="10.5" y="19" textAnchor="middle" fill="currentColor" fontSize="7">年</text>
      <text x="19.5" y="19" textAnchor="middle" fill="currentColor" fontSize="7">月</text>
      <text x="28.5" y="19" textAnchor="middle" fill="currentColor" fontSize="7">日</text>
      <text x="37.5" y="19" textAnchor="middle" fill="currentColor" fontSize="7">时</text>
      <circle cx="10.5" cy="32" r="2.5" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.15" />
      <circle cx="19.5" cy="32" r="2.5" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.15" />
      <circle cx="28.5" cy="32" r="2.5" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.15" />
      <circle cx="37.5" cy="32" r="2.5" stroke="currentColor" strokeWidth="0.8" fill="currentColor" fillOpacity="0.15" />
    </svg>
  ),
}

export default function FeatureCard({
  icon,
  title,
  subtitle,
  path,
  onClick,
  className = '',
  style,
}: FeatureCardProps) {
  const classes = [
    'xbiz-feature-card',
    className,
  ].filter(Boolean).join(' ')

  const iconContent = typeof icon === 'string' && icon !== 'custom'
    ? iconSvgs[icon as Exclude<FeatureIconType, 'custom'>]
    : icon

  const content = (
    <>
      <div className="xbiz-feature-card__icon">
        {iconContent}
      </div>
      <div className="xbiz-feature-card__text">
        <h3 className="xbiz-feature-card__title">{title}</h3>
        <p className="xbiz-feature-card__subtitle">{subtitle}</p>
      </div>
      <div className="xbiz-feature-card__arrow">›</div>
    </>
  )

  if (path) {
    return (
      <Link to={path} className={classes} style={style}>
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className={classes} onClick={onClick} style={style}>
        {content}
      </button>
    )
  }

  return <div className={classes}>{content}</div>
}
