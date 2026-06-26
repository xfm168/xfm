import './HexagramCard.css'

export interface HexagramData {
  number: number
  name: string
  symbol: string
  upper_trigram: string
  lower_trigram: string
  description?: string
}

export type HexagramCardVariant = 'default' | 'highlight' | 'compact'

export interface HexagramCardProps {
  hexagram: HexagramData
  variant?: HexagramCardVariant
  label?: string
  showLines?: boolean
  lines?: string[]
  changingPositions?: number[]
  className?: string
}

const LINE_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

export default function HexagramCard({
  hexagram,
  variant = 'default',
  label,
  showLines = false,
  lines = [],
  changingPositions = [],
  className = '',
}: HexagramCardProps) {
  const classes = [
    'xbiz-hex-card',
    `xbiz-hex-card--${variant}`,
    className,
  ].filter(Boolean).join(' ')

  const displayedLines = [...lines].reverse()
  const lineLabels = [...LINE_LABELS].reverse()

  return (
    <div className={classes}>
      {label && <div className="xbiz-hex-card__badge">{label}</div>}

      <div className="xbiz-hex-card__symbol-wrap">
        <span className="xbiz-hex-card__symbol">{hexagram.symbol}</span>
        <div className="xbiz-hex-card__symbol-glow" />
      </div>

      <div className="xbiz-hex-card__meta">
        <span className="xbiz-hex-card__num">第 {hexagram.number} 卦</span>
        <h3 className="xbiz-hex-card__name">{hexagram.name}卦</h3>
        <span className="xbiz-hex-card__tri">
          {hexagram.upper_trigram}上 · {hexagram.lower_trigram}下
        </span>
      </div>

      {showLines && lines.length > 0 && (
        <div className="xbiz-hex-card__lines">
          {displayedLines.map((line, i) => {
            const pos = 6 - i
            const isChanging = changingPositions.includes(pos)
            return (
              <div key={i} className="xbiz-hex-line">
                <span className="xbiz-hex-line__label">{lineLabels[i]}</span>
                <div className="xbiz-hex-line__bars">
                  {line === '阳' ? (
                    <span className={`xbiz-hex-line__bar xbiz-hex-line__bar--full${isChanging ? ' changing' : ''}`} />
                  ) : (
                    <>
                      <span className={`xbiz-hex-line__bar xbiz-hex-line__bar--half${isChanging ? ' changing' : ''}`} />
                      <span className="xbiz-hex-line__gap" />
                      <span className={`xbiz-hex-line__bar xbiz-hex-line__bar--half${isChanging ? ' changing' : ''}`} />
                    </>
                  )}
                </div>
                {isChanging && <span className="xbiz-hex-line__dot">◎</span>}
              </div>
            )
          })}
        </div>
      )}

      {hexagram.description && variant !== 'compact' && (
        <p className="xbiz-hex-card__desc">「{hexagram.description}」</p>
      )}
    </div>
  )
}
