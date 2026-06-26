import { CSSProperties } from 'react'
import './Bagua.css'

export interface Trigram {
  name: string
  symbol: string
  lines: number[]
}

export const BAGUA_ORDER: Trigram[] = [
  { name: '乾', symbol: '☰', lines: [1, 1, 1] },
  { name: '兑', symbol: '☱', lines: [1, 1, 0] },
  { name: '离', symbol: '☲', lines: [1, 0, 1] },
  { name: '震', symbol: '☳', lines: [1, 0, 0] },
  { name: '巽', symbol: '☴', lines: [0, 1, 1] },
  { name: '坎', symbol: '☵', lines: [0, 1, 0] },
  { name: '艮', symbol: '☶', lines: [0, 0, 1] },
  { name: '坤', symbol: '☷', lines: [0, 0, 0] },
]

export interface BaguaProps {
  size?: number
  trigrams?: Trigram[]
  showNames?: boolean
  showSymbols?: boolean
  spinning?: boolean
  spinDuration?: number
  className?: string
}

export default function Bagua({
  size = 300,
  trigrams = BAGUA_ORDER,
  showNames = true,
  showSymbols = false,
  spinning = false,
  spinDuration = 60,
  className = '',
}: BaguaProps) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.42

  const classes = [
    'xbiz-bagua',
    spinning ? 'xbiz-bagua--spin' : '',
    className,
  ].filter(Boolean).join(' ')

  const style: CSSProperties = {
    width: size,
    height: size,
    animationDuration: `${spinDuration}s`,
  }

  return (
    <div
      className={classes}
      style={style}
      aria-label="八卦图"
    >
      {trigrams.map((trigram, i) => {
        const angle = (i * 45 - 90) * (Math.PI / 180)
        const x = cx + radius * Math.cos(angle)
        const y = cy + radius * Math.sin(angle)
        const textAngle = i * 45

        return (
          <div
            key={trigram.name}
            className="xbiz-bagua__item"
            style={{
              left: `${(x / size) * 100}%`,
              top: `${(y / size) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${textAngle}deg)`,
            }}
          >
            <div
              className="xbiz-bagua__inner"
              style={{ transform: `rotate(${-textAngle}deg)` }}
            >
              {showSymbols && (
                <span className="xbiz-bagua__symbol">{trigram.symbol}</span>
              )}
              {showNames && (
                <span className="xbiz-bagua__name">{trigram.name}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
