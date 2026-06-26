import Taiji from '../Taiji/Taiji'
import Bagua, { BAGUA_ORDER } from '../Bagua/Bagua'
import './Compass.css'

export interface CompassProps {
  size?: number
  taijiSize?: number
  rings?: number
  goldBreath?: boolean
  className?: string
}

export default function Compass({
  size = 400,
  taijiSize,
  rings = 3,
  goldBreath = true,
  className = '',
}: CompassProps) {
  const actualTaijiSize = taijiSize ?? size * 0.35

  const ringSizes = [0.92, 0.78, 0.62].slice(0, rings)

  const classes = [
    'xbiz-compass',
    goldBreath ? 'xbiz-compass--breath' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      style={{ width: size, height: size }}
      aria-label="太极八卦罗盘"
    >
      {goldBreath && <div className="xbiz-compass__glow" />}

      {ringSizes.map((ratio, i) => (
        <div
          key={i}
          className={`xbiz-compass__ring xbiz-compass__ring--${i + 1}`}
          style={{
            width: `${ratio * 100}%`,
            height: `${ratio * 100}%`,
          }}
        />
      ))}

      <Bagua
        size={size * 0.85}
        trigrams={BAGUA_ORDER}
        showNames={true}
        showSymbols={false}
        className="xbiz-compass__bagua"
      />

      <div className="xbiz-compass__taiji">
        <Taiji
          size={actualTaijiSize}
          spinning={true}
          spinDuration={20}
          variant="premium"
        />
      </div>
    </div>
  )
}
