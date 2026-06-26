import './Taiji.css'

export interface TaijiProps {
  size?: number
  spinning?: boolean
  spinDuration?: number
  variant?: 'classic' | 'premium'
  className?: string
}

export default function Taiji({
  size = 100,
  spinning = false,
  spinDuration = 20,
  variant = 'premium',
  className = '',
}: TaijiProps) {
  const cx = size / 2
  const cy = size / 2
  const R = size * 0.44
  const sr = R / 2
  const er = Math.max(1.5, sr * 0.2)

  const yangPath = [
    `M ${cx} ${cy - R}`,
    `A ${R} ${R} 0 0 1 ${cx} ${cy + R}`,
    `A ${sr} ${sr} 0 0 1 ${cx} ${cy}`,
    `A ${sr} ${sr} 0 0 0 ${cx} ${cy - R}`,
    'Z',
  ].join(' ')

  const classes = [
    'xbiz-taiji',
    `xbiz-taiji--${variant}`,
    spinning ? 'xbiz-taiji--spin' : '',
    className,
  ].filter(Boolean).join(' ')

  const style: React.CSSProperties = {
    width: size,
    height: size,
    animationDuration: `${spinDuration}s`,
  }

  return (
    <svg
      className={classes}
      style={style}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="太极图"
    >
      <defs>
        <radialGradient id="xbiz-yin-grad" cx="50%" cy="60%" r="60%">
          <stop offset="0%" stopColor="#0a0f1a" />
          <stop offset="100%" stopColor="#050810" />
        </radialGradient>
        <radialGradient id="xbiz-yang-grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FAF6EC" />
          <stop offset="100%" stopColor="#E8E0CC" />
        </radialGradient>
        <radialGradient id="xbiz-gold-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#D4AF37" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
        <filter id="xbiz-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {variant === 'premium' && (
        <circle cx={cx} cy={cy} r={R + 2} fill="url(#xbiz-gold-glow)" />
      )}

      <circle cx={cx} cy={cy} r={R} fill="url(#xbiz-yin-grad)" />
      <path d={yangPath} fill="url(#xbiz-yang-grad)" />

      <circle cx={cx} cy={cy + sr} r={er} fill="url(#xbiz-yin-grad)" />
      <circle cx={cx} cy={cy - sr} r={er} fill="url(#xbiz-yang-grad)" />

      {variant === 'premium' && (
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="1.5"
          opacity="0.6"
          filter="url(#xbiz-soft-glow)"
        />
      )}

      {variant === 'classic' && (
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#D4AF37" strokeWidth="2" />
      )}
    </svg>
  )
}
