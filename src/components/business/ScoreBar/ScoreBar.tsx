import './ScoreBar.css'

export interface ScoreBarProps {
  score: number
  label?: string
  showValue?: boolean
  height?: number
  className?: string
}

export default function ScoreBar({
  score,
  label,
  showValue = true,
  height = 8,
  className = '',
}: ScoreBarProps) {
  const safeScore = Math.max(0, Math.min(100, score))

  const classes = ['xbiz-score-bar', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {label && (
        <div className="xbiz-score-bar__header">
          <span className="xbiz-score-bar__label">{label}</span>
          {showValue && <span className="xbiz-score-bar__value">{safeScore}</span>}
        </div>
      )}
      <div className="xbiz-score-bar__track" style={{ height }}>
        <div
          className="xbiz-score-bar__fill"
          style={{ width: `${safeScore}%` }}
        />
      </div>
    </div>
  )
}
