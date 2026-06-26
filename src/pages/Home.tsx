import { Link } from 'react-router-dom'
import './Home.css'

const featureCards = [
  {
    icon: 'bagua',
    name: '今日卦象',
    subtitle: '每日指引 · 趋吉避凶',
    path: '/daily',
  },
  {
    icon: 'coins',
    name: '六爻占卜',
    subtitle: '铜钱起课 · 洞察天机',
    path: '/liuyao',
  },
  {
    icon: 'house',
    name: '风水堪测',
    subtitle: '观宅察势 · 调和宅气',
    path: '/fengshui',
  },
  {
    icon: 'chart',
    name: '八字命理',
    subtitle: '命盘推演 · 指点迷津',
    path: '/daily',
  },
]

// 八卦符号：严格等角排列
const baguaOrder = [
  { name: '乾', lines: [1, 1, 1], angle: 270 },   // 顶
  { name: '兑', lines: [1, 1, 0], angle: 315 },
  { name: '离', lines: [1, 0, 1], angle: 0 },     // 右
  { name: '震', lines: [1, 0, 0], angle: 45 },
  { name: '巽', lines: [0, 1, 1], angle: 90 },   // 底
  { name: '坎', lines: [0, 1, 0], angle: 135 },
  { name: '艮', lines: [0, 0, 1], angle: 180 },  // 左
  { name: '坤', lines: [0, 0, 0], angle: 225 },
]

export default function Home() {
  return (
    <div className="home">

      {/* ── 远山薄雾背景层 ── */}
      <div className="bg-layer">
        <div className="bg-fog"></div>
        <div className="bg-mountain"></div>
        <div className="bg-mist"></div>
      </div>

      {/* ── 主视觉区域 ── */}
      <section className="hero">

        {/* 太极八卦核心 */}
        <div className="taiji-wrap">
          {/* 外层神光 */}
          <div className="taiji-glow"></div>

          <svg
            className="taiji-svg"
            viewBox="0 0 500 500"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="太极八卦图"
          >
            <defs>
              {/* 古铜金渐变 */}
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#E8C56A" />
                <stop offset="50%"  stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>

              {/* 阳鱼渐变（黑） */}
              <radialGradient id="yinFishGrad" cx="50%" cy="60%" r="60%">
                <stop offset="0%"   stopColor="#1a2233" />
                <stop offset="100%" stopColor="#0a1020" />
              </radialGradient>

              {/* 阴鱼渐变（白） */}
              <radialGradient id="yangFishGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%"   stopColor="#F5F1E8" />
                <stop offset="100%" stopColor="#D4CFC0" />
              </radialGradient>

              {/* 外环金辉 */}
              <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.2" />
                <stop offset="70%"  stopColor="#D4AF37" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </radialGradient>

              {/* 柔和光晕 */}
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* 内阴影 */}
              <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feOffset dx="0" dy="2" />
                <feGaussianBlur stdDeviation="3" result="shadow" />
                <feComposite in2="SourceGraphic" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="shadow" />
                <feComposite in2="shadow" in="SourceGraphic" operator="over" />
              </filter>
            </defs>

            {/* 外层神光 */}
            <circle cx="250" cy="250" r="240" fill="url(#ringGlow)" />

            {/* 双层金色圆环 */}
            <circle cx="250" cy="250" r="228" fill="none" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.6" />
            <circle cx="250" cy="250" r="220" fill="none" stroke="url(#goldGrad)" strokeWidth="0.8" opacity="0.4" />

            {/* 四正方位标记 */}
            {[0, 90, 180, 270].map(deg => {
              const rad = (deg * Math.PI) / 180
              const x1 = 250 + Math.cos(rad) * 210
              const y1 = 250 + Math.sin(rad) * 210
              const x2 = 250 + Math.cos(rad) * 224
              const y2 = 250 + Math.sin(rad) * 224
              return (
                <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" />
              )
            })}

            {/* 内层金色圆环 */}
            <circle cx="250" cy="250" r="180" fill="none" stroke="url(#goldGrad)" strokeWidth="0.5" opacity="0.3" />

            {/* 八卦爻位 - 围绕太极等角排列 */}
            {baguaOrder.map((t, i) => {
              const rad = (t.angle * Math.PI) / 180
              const cx  = 250 + Math.cos(rad) * 155
              const cy  = 250 + Math.sin(rad) * 155
              return (
                <g key={i} className="bagua-gua">
                  {/* 卦名 */}
                  <text x={cx} y={cy - 26} textAnchor="middle"
                    fill="url(#goldGrad)" fontSize="17" fontWeight="500"
                    fontFamily="'Noto Serif SC', serif" letterSpacing="0.05em">
                    {t.name}
                  </text>

                  {/* 三爻符号 */}
                  {t.lines.map((l, j) => {
                    const ly = cy - 16 + j * 8
                    return l === 1 ? (
                      <g key={j}>
                        {/* 阳爻：两段实线 */}
                        <line x1={cx - 9} y1={ly} x2={cx - 2.5} y2={ly}
                          stroke="url(#goldGrad)" strokeWidth="2.2" strokeLinecap="round" />
                        <line x1={cx + 2.5} y1={ly} x2={cx + 9} y2={ly}
                          stroke="url(#goldGrad)" strokeWidth="2.2" strokeLinecap="round" />
                      </g>
                    ) : (
                      <g key={j}>
                        {/* 阴爻：两段实线 + 中间断点 */}
                        <line x1={cx - 9} y1={ly} x2={cx - 2.5} y2={ly}
                          stroke="url(#goldGrad)" strokeWidth="2.2" strokeLinecap="round" />
                        <line x1={cx + 2.5} y1={ly} x2={cx + 9} y2={ly}
                          stroke="url(#goldGrad)" strokeWidth="2.2" strokeLinecap="round" />
                        <circle cx={cx} cy={ly} r="1.5" fill="#071629" />
                      </g>
                    )
                  })}
                </g>
              )
            })}

            {/* 中心太极圆底 */}
            <circle cx="250" cy="250" r="90" fill="#071629" />
            <circle cx="250" cy="250" r="88" fill="none" stroke="url(#goldGrad)" strokeWidth="1.2" opacity="0.7" />

            {/* 太极本体 */}
            <g className="taiji-body">
              {/* 上半阴（白） */}
              <path
                d="M 250 162
                   A 88 88 0 0 1 250 338
                   A 44 44 0 0 0 250 250
                   A 44 44 0 0 1 250 162 Z"
                fill="url(#yangFishGrad)"
              />
              {/* 下半阳（黑） */}
              <path
                d="M 250 338
                   A 44 44 0 0 0 250 250
                   A 44 44 0 0 1 250 162
                   A 88 88 0 0 1 250 338 Z"
                fill="url(#yinFishGrad)"
              />
              {/* 白鱼眼（黑点） */}
              <circle cx="250" cy="206" r="13" fill="url(#yinFishGrad)" />
              <circle cx="250" cy="206" r="12" fill="url(#yinFishGrad)" />
              <circle cx="249" cy="204" r="4" fill="rgba(255,255,255,0.15)" />
              {/* 黑鱼眼（白点） */}
              <circle cx="250" cy="294" r="13" fill="url(#yangFishGrad)" />
              <circle cx="250" cy="294" r="12" fill="url(#yangFishGrad)" />
              <circle cx="249" cy="292" r="4" fill="rgba(0,0,0,0.1)" />
            </g>

            {/* 太极外圈高光 */}
            <circle cx="250" cy="250" r="88" fill="none"
              stroke="url(#goldGrad)" strokeWidth="0.6" opacity="0.5"
              filter="url(#softGlow)" />
          </svg>
        </div>

        {/* 品牌标题 */}
        <div className="brand-section">
          <h1 className="brand-title">玄风门</h1>
          <div className="brand-tagline">
            <p>天地有象，万事有机</p>
            <p>知其势者，顺势而行</p>
          </div>
        </div>
      </section>

      {/* ── 功能入口 ── */}
      <section className="features-section">
        <div className="features-grid">
          {featureCards.map((card, i) => (
            <Link
              key={card.name}
              to={card.path}
              className="feature-card"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="card-icon-wrap">
                <FeatureIcon type={card.icon} />
              </div>
              <div className="card-text">
                <h3>{card.name}</h3>
                <p>{card.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 品牌语 ── */}
      <section className="slogan-section">
        <div className="slogan-inner">
          <div className="slogan-divider">
            <span className="divider-line"></span>
            <span className="divider-diamond">◆</span>
            <span className="divider-line"></span>
          </div>
          <h2 className="slogan-text">遇事不决，可问玄风</h2>
          <div className="slogan-divider">
            <span className="divider-line"></span>
            <span className="divider-diamond">◆</span>
            <span className="divider-line"></span>
          </div>
        </div>
      </section>

      {/* 底部留白 */}
      <div className="bottom-space"></div>
    </div>
  )
}

// ── 功能图标（古铜金线稿） ──
function FeatureIcon({ type }: { type: string }) {
  switch (type) {
    case 'bagua':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
          <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
          {/* 八卦小符号 */}
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
                const ly = t.y - 3 + j * 3.5
                return l === 1 ? (
                  <g key={j}>
                    <line x1={t.x - 3.5} y1={ly} x2={t.x - 1} y2={ly} stroke="currentColor" strokeWidth="1" />
                    <line x1={t.x + 1} y1={ly} x2={t.x + 3.5} y2={ly} stroke="currentColor" strokeWidth="1" />
                  </g>
                ) : (
                  <g key={j}>
                    <line x1={t.x - 3.5} y1={ly} x2={t.x - 1} y2={ly} stroke="currentColor" strokeWidth="1" />
                    <line x1={t.x + 1} y1={ly} x2={t.x + 3.5} y2={ly} stroke="currentColor" strokeWidth="1" />
                  </g>
                )
              })}
            </g>
          ))}
          <circle cx="32" cy="32" r="7" stroke="currentColor" strokeWidth="1" />
          <path d="M32 25 A 7 3.5 0 0 1 32 39 A 3.5 3.5 0 0 0 32 32 A 3.5 3.5 0 0 1 32 25 Z" fill="currentColor" />
        </svg>
      )
    case 'coins':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="22" cy="46" rx="16" ry="5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="22" cy="46" rx="16" ry="5" fill="currentColor" opacity="0.06" />
          <ellipse cx="32" cy="34" rx="16" ry="5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="32" cy="34" rx="16" ry="5" fill="currentColor" opacity="0.06" />
          <ellipse cx="42" cy="22" rx="16" ry="5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="42" cy="22" rx="16" ry="5" fill="currentColor" opacity="0.06" />
          <rect x="29" y="31" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="#071629" />
          <rect x="19" y="43" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="#071629" />
          <rect x="39" y="19" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="#071629" />
        </svg>
      )
    case 'house':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 50 L20 36 L28 44 L40 28 L56 50 Z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.06" />
          <path d="M24 44 L24 32 L40 32 L40 44" stroke="currentColor" strokeWidth="1.2" />
          <line x1="20" y1="32" x2="44" y2="32" stroke="currentColor" strokeWidth="1.2" />
          <line x1="22" y1="28" x2="42" y2="28" stroke="currentColor" strokeWidth="1.2" />
          <path d="M20 32 L24 28 L40 28 L44 32" stroke="currentColor" strokeWidth="1.2" />
          <path d="M24 28 L26 24 L38 24 L40 28" stroke="currentColor" strokeWidth="1.2" />
          <path d="M28 24 L30 20 L34 20 L36 24" stroke="currentColor" strokeWidth="1.2" />
          <path d="M30 20 L32 16 L32 14" stroke="currentColor" strokeWidth="1.2" />
          <rect x="30" y="38" width="4" height="6" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.12" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 天干地支图 */}
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
          {/* 中心点 */}
          <circle cx="32" cy="32" r="3" fill="currentColor" />
          {/* 放射线 */}
          {[0, 60, 120, 180, 240, 300].map(deg => {
            const rad = (deg * Math.PI) / 180
            const x = 32 + Math.cos(rad) * 22
            const y = 32 + Math.sin(rad) * 22
            return <circle key={deg} cx={x} cy={y} r="2" fill="currentColor" opacity="0.6" />
          })}
          {/* 八字符号 */}
          <text x="32" y="18" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">命</text>
          <text x="46" y="36" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">运</text>
          <text x="32" y="50" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">盘</text>
          <text x="18" y="36" textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="500">推</text>
        </svg>
      )
    default:
      return null
  }
}
