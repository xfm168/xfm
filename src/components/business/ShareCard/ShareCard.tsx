import { ReactNode } from 'react'
import './ShareCard.css'

export interface ShareCardProps {
  hexagramNumber: number
  hexagramName: string
  hexagramSymbol: string
  score?: number
  date?: string
  description?: string
  children?: ReactNode
  className?: string
}

export default function ShareCard({
  hexagramNumber,
  hexagramName,
  hexagramSymbol,
  score,
  date,
  description,
  children,
  className = '',
}: ShareCardProps) {
  const classes = ['xbiz-share-card', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className="xbiz-share-card__bg" aria-hidden />
      <div className="xbiz-share-card__content">
        <div className="xbiz-share-card__header">
          <span className="xbiz-share-card__brand">玄风门</span>
          {date && <span className="xbiz-share-card__date">{date}</span>}
        </div>

        <div className="xbiz-share-card__hex">
          <span className="xbiz-share-card__symbol">{hexagramSymbol}</span>
          <div className="xbiz-share-card__hex-info">
            <span className="xbiz-share-card__num">第 {hexagramNumber} 卦</span>
            <span className="xbiz-share-card__name">{hexagramName}卦</span>
          </div>
        </div>

        {score !== undefined && (
          <div className="xbiz-share-card__score">
            <span className="xbiz-share-card__score-num">{score}</span>
            <span className="xbiz-share-card__score-lbl">玄风指数</span>
          </div>
        )}

        {description && (
          <p className="xbiz-share-card__desc">「{description}」</p>
        )}

        {children}

        <div className="xbiz-share-card__footer">
          <span className="xbiz-share-card__slogan">遇事不决，可问玄风</span>
        </div>
      </div>
    </div>
  )
}
