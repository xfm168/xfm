import './ScoreRing.css'

export interface ScoreRingProps {
  score: number
  label?: string
  size?: number
  strokeWidth?: number
  className?: string
}

export default function ScoreRing({
  score,
  label = '玄风指数',
  size = 120,
  strokeWidth = 8,
  className = '',
}: ScoreRingProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circ

  const classes = ['xbiz-score-ring', className].filter(Boolean).join(' ')

  return (
    <div className={classes} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="xbiz-score-ring__svg">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="xbiz-score-ring__bg"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="xbiz-score-ring__fg"
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ * 0.25}
        />
        <text
          x={size / 2}
          y={size / 2 - 2}
          className="xbiz-score-ring__num"
          textAnchor="middle"
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 16}
          className="xbiz-score-ring__label"
          textAnchor="middle"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
