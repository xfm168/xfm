import { Link } from 'react-router-dom'
import './Home.css'

const featureCards = [
  {
    icon: 'bagua',
    name: '今日卦运',
    subtitle: '每日指引  趋吉避凶',
    path: '/daily',
  },
  {
    icon: 'coin',
    name: '六爻解卦',
    subtitle: '洞察天机  指点迷津',
    path: '/liuyao',
  },
  {
    icon: 'house',
    name: '风水勘测',
    subtitle: '观宅察势  趋吉避凶',
    path: '/fengshui',
  },
  {
    icon: 'book',
    name: '卦运记录',
    subtitle: '记录卦象  追踪运势',
    path: '/records',
  },
]

// 八卦符号
const baguaSymbols = [
  { name: '乾', lines: [1, 1, 1], angle: 270 },   // top
  { name: '兑', lines: [1, 1, 0], angle: 315 },
  { name: '离', lines: [1, 0, 1], angle: 0 },     // right
  { name: '震', lines: [1, 0, 0], angle: 45 },
  { name: '巽', lines: [0, 1, 1], angle: 90 },    // bottom
  { name: '坎', lines: [0, 1, 0], angle: 135 },
  { name: '艮', lines: [0, 0, 1], angle: 180 },   // left
  { name: '坤', lines: [0, 0, 0], angle: 225 },
]

export default function Home() {
  return (
    <div className="home">
      {/* ── Hero Section ── */}
      <section className="hero">
        {/* Background layers */}
        <div className="hero-bg">
          <div className="bg-stars"></div>
          <div className="bg-glow"></div>
          <div className="bg-clouds">
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="cloud cloud-3"></div>
            <div className="cloud cloud-4"></div>
          </div>
          <div className="bg-mountain"></div>
          <div className="bg-palace"></div>
        </div>

        {/* Hero content */}
        <div className="hero-content">
          {/* Big calligraphic title */}
          <div className="title-block">
            <h1 className="hero-title">玄风门</h1>
            <span className="title-seal">玄风</span>
          </div>

          {/* Subtitle */}
          <p className="hero-subtitle">天地有象，万事有机</p>
          <p className="hero-subtitle">知其势者，顺势而行</p>
        </div>

        {/* Taiji Bagua Visual */}
        <div className="bagua-wrap">
          <div className="bagua-rays"></div>
          <svg className="bagua-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="baguaGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#c9a24a" stopOpacity="0.3" />
                <stop offset="60%" stopColor="#c9a24a" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#c9a24a" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="taijiGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f5e6b8" />
                <stop offset="50%" stopColor="#c9a24a" />
                <stop offset="100%" stopColor="#92630a" />
              </linearGradient>
            </defs>

            {/* Outer glow */}
            <circle cx="200" cy="200" r="190" fill="url(#baguaGlow)" />

            {/* Outer ring with dots */}
            <circle cx="200" cy="200" r="185" fill="none" stroke="#c9a24a" strokeWidth="0.5" strokeOpacity="0.4" />
            <circle cx="200" cy="200" r="170" fill="none" stroke="#c9a24a" strokeWidth="0.3" strokeOpacity="0.3" />

            {/* Cardinal direction marks */}
            {[0, 90, 180, 270].map(deg => {
              const rad = (deg * Math.PI) / 180
              const x1 = 200 + Math.cos(rad) * 168
              const y1 = 200 + Math.sin(rad) * 168
              const x2 = 200 + Math.cos(rad) * 178
              const y2 = 200 + Math.sin(rad) * 178
              return (
                <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#c9a24a" strokeWidth="1" strokeOpacity="0.6" />
              )
            })}

            {/* 8 trigram positions */}
            {baguaSymbols.map((t, i) => {
              const rad = (t.angle * Math.PI) / 180
              const cx = 200 + Math.cos(rad) * 135
              const cy = 200 + Math.sin(rad) * 135
              return (
                <g key={i}>
                  <text x={cx} y={cy - 22} textAnchor="middle"
                    fill="#c9a24a" fontSize="16" fontWeight="500"
                    fontFamily="'Noto Serif SC', serif" opacity="0.9">
                    {t.name}
                  </text>
                  {/* Mini trigram icon */}
                  {t.lines.map((l, j) => {
                    const ly = cy - 12 + j * 6
                    return l === 1 ? (
                      <g key={j}>
                        <rect x={cx - 8} y={ly} width="6" height="3" fill="#c9a24a" opacity="0.8" />
                        <rect x={cx + 2} y={ly} width="6" height="3" fill="#c9a24a" opacity="0.8" />
                      </g>
                    ) : (
                      <g key={j}>
                        <rect x={cx - 8} y={ly} width="6" height="3" fill="#c9a24a" opacity="0.8" />
                        <rect x={cx + 2} y={ly} width="6" height="3" fill="#c9a24a" opacity="0.8" />
                        <circle cx={cx} cy={ly + 1.5} r="0.8" fill="#0b172e" />
                      </g>
                    )
                  })}
                </g>
              )
            })}

            {/* Inner circle for taiji */}
            <circle cx="200" cy="200" r="60" fill="#0b172e" />
            <circle cx="200" cy="200" r="58" fill="none" stroke="#c9a24a" strokeWidth="0.8" strokeOpacity="0.5" />

            {/* Taiji symbol */}
            <g transform="translate(200 200)">
              {/* Outer circle */}
              <circle r="52" fill="none" stroke="url(#taijiGold)" strokeWidth="1.2" />
              {/* Top half - light */}
              <path d="M 0,-50 A 50,50 0 0,1 0,50 A 25,25 0 0,1 0,0 A 25,25 0 0,0 0,-50 Z"
                fill="url(#taijiGold)" />
              {/* Bottom half - dark (simulated by gold ring + dark fill) */}
              <path d="M 0,-50 A 25,25 0 0,0 0,0 A 25,25 0 0,1 0,50 A 50,50 0 0,1 0,-50 Z"
                fill="#0b172e" stroke="url(#taijiGold)" strokeWidth="0.6" />
              {/* Light dot in dark */}
              <circle cx="0" cy="25" r="5" fill="url(#taijiGold)" />
              {/* Dark dot in light */}
              <circle cx="0" cy="-25" r="5" fill="#0b172e" stroke="url(#taijiGold)" strokeWidth="0.5" />
            </g>
          </svg>

          {/* Light beam under bagua */}
          <div className="bagua-beam"></div>
        </div>
      </section>

      {/* ── Feature Cards Section ── */}
      <section className="features-section">
        <div className="features-grid">
          {featureCards.map((card, index) => (
            <Link
              key={card.name}
              to={card.path}
              className="feature-card"
              style={{ animationDelay: `${index * 0.12}s` }}
            >
              {/* Corner decorations */}
              <div className="card-corner tl"></div>
              <div className="card-corner tr"></div>
              <div className="card-corner bl"></div>
              <div className="card-corner br"></div>

              {/* Cloud decoration */}
              <div className="card-cloud top"></div>
              <div className="card-cloud bottom"></div>

              {/* Icon */}
              <div className="card-icon-wrap">
                <CardIcon type={card.icon} />
              </div>

              {/* Content */}
              <div className="card-content">
                <h3 className="card-name">{card.name}</h3>
                <p className="card-subtitle">{card.subtitle}</p>
              </div>

              {/* Arrow */}
              <div className="card-arrow">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Brand Slogan Section ── */}
      <section className="slogan-section">
        <div className="slogan-inner">
          <div className="slogan-ornament">
            <span className="slogan-line"></span>
            <span className="slogan-diamond">◇</span>
            <span className="slogan-line"></span>
          </div>
          <h2 className="slogan-text">遇事不决，可问玄风</h2>
          <div className="slogan-seal">玄</div>
        </div>
      </section>

      {/* ── Bottom Spacer for Tab Bar ── */}
      <div className="bottom-spacer"></div>
    </div>
  )
}

// ── Custom SVG Icons (Gold Line) ──
function CardIcon({ type }: { type: string }) {
  switch (type) {
    case 'bagua':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
          <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          {/* trigrams around */}
          {[
            { x: 32, y: 8, lines: [1, 1, 1] },
            { x: 50, y: 14, lines: [1, 1, 0] },
            { x: 56, y: 32, lines: [1, 0, 1] },
            { x: 50, y: 50, lines: [1, 0, 0] },
            { x: 32, y: 56, lines: [0, 1, 1] },
            { x: 14, y: 50, lines: [0, 1, 0] },
            { x: 8, y: 32, lines: [0, 0, 1] },
            { x: 14, y: 14, lines: [0, 0, 0] },
          ].map((t, i) => (
            <g key={i}>
              {t.lines.map((l, j) => {
                const ly = t.y - 4 + j * 4
                return l === 1 ? (
                  <g key={j}>
                    <rect x={t.x - 5} y={ly} width="4" height="2" fill="currentColor" />
                    <rect x={t.x + 1} y={ly} width="4" height="2" fill="currentColor" />
                  </g>
                ) : (
                  <g key={j}>
                    <rect x={t.x - 5} y={ly} width="4" height="2" fill="currentColor" />
                    <rect x={t.x + 1} y={ly} width="4" height="2" fill="currentColor" />
                  </g>
                )
              })}
            </g>
          ))}
          {/* center taiji */}
          <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="1" />
          <path d="M32 24 A 8,4 0 0,1 32,40 A 4,4 0 0,0 32,32 A 4,4 0 0,1 32,24 Z" fill="currentColor" />
        </svg>
      )
    case 'coin':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 3 coins stacked */}
          <ellipse cx="22" cy="46" rx="16" ry="5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="22" cy="46" rx="16" ry="5" fill="currentColor" opacity="0.1" />
          <ellipse cx="32" cy="34" rx="16" ry="5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="32" cy="34" rx="16" ry="5" fill="currentColor" opacity="0.1" />
          <ellipse cx="42" cy="22" rx="16" ry="5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="42" cy="22" rx="16" ry="5" fill="currentColor" opacity="0.1" />
          {/* Square holes */}
          <rect x="29" y="31" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="#0b172e" />
          <rect x="19" y="43" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="#0b172e" />
          <rect x="39" y="19" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="#0b172e" />
        </svg>
      )
    case 'house':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Mountain base */}
          <path d="M8 50 L20 36 L28 44 L40 28 L56 50 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
          {/* Pagoda */}
          <path d="M24 44 L24 32 L40 32 L40 44" stroke="currentColor" strokeWidth="1.2" />
          <path d="M20 32 L44 32" stroke="currentColor" strokeWidth="1.2" />
          <path d="M22 28 L42 28" stroke="currentColor" strokeWidth="1.2" />
          <path d="M20 32 L24 28 L40 28 L44 32" stroke="currentColor" strokeWidth="1.2" />
          <path d="M24 28 L26 24 L38 24 L40 28" stroke="currentColor" strokeWidth="1.2" />
          <path d="M28 24 L30 20 L34 20 L36 24" stroke="currentColor" strokeWidth="1.2" />
          <path d="M30 20 L32 16 L32 14" stroke="currentColor" strokeWidth="1.2" />
          {/* door */}
          <rect x="30" y="38" width="4" height="6" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.2" />
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Book */}
          <path d="M16 14 L48 14 L48 50 L16 50 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.05" />
          <path d="M32 14 L32 50" stroke="currentColor" strokeWidth="1.2" />
          {/* Pages */}
          <line x1="20" y1="22" x2="28" y2="22" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="20" y1="28" x2="28" y2="28" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="20" y1="34" x2="28" y2="34" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="20" y1="40" x2="28" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="36" y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="36" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="36" y1="34" x2="44" y2="34" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
          <line x1="36" y1="40" x2="44" y2="40" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        </svg>
      )
    default:
      return null
  }
}
