import { Link } from 'react-router-dom'
import './Home.css'

const featureCards = [
  {
    icon: '☰',
    name: '六爻解卦',
    subtitle: '洞察天机',
    desc: '铜钱起课，一事一问，六爻断卦',
    path: '/liuyao',
  },
  {
    icon: '☷',
    name: '风水勘测',
    subtitle: '观宅察势',
    desc: 'AI识别空间，调和宅气',
    path: '/fengshui',
  },
  {
    icon: '☯',
    name: '今日卦象',
    subtitle: '每日指引',
    desc: '每日专属卦象，顺时而动',
    path: '/daily',
  },
  {
    icon: '⚹',
    name: '每日运势',
    subtitle: '趋吉避凶',
    desc: '运势推演，把握时机',
    path: '/daily',
  },
]

const baguaTrigrams = [
  { name: '乾', symbol: '☰', angle: 0 },
  { name: '兑', symbol: '☱', angle: 45 },
  { name: '离', symbol: '☲', angle: 90 },
  { name: '震', symbol: '☳', angle: 135 },
  { name: '巽', symbol: '☴', angle: 180 },
  { name: '坎', symbol: '☵', angle: 225 },
  { name: '艮', symbol: '☶', angle: 270 },
  { name: '坤', symbol: '☷', angle: 315 },
]

export default function Home() {
  const radius = 140

  return (
    <div className="home">
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-glow-1"></div>
          <div className="hero-glow-2"></div>
          <div className="hero-mountain"></div>
        </div>

        <div className="container hero-inner">
          {/* Bagua Visual */}
          <div className="hero-visual">
            <div className="bagua-wrap">
              {/* Outer rotating ring */}
              <div className="bagua-ring ring-outer"></div>
              <div className="bagua-ring ring-middle"></div>
              <div className="bagua-ring ring-inner"></div>

              {/* Cloud patterns */}
              <div className="cloud-pattern cloud-1"></div>
              <div className="cloud-pattern cloud-2"></div>

              {/* Trigrams */}
              {baguaTrigrams.map((t, i) => {
                const rad = (t.angle * Math.PI) / 180
                const tx = Math.cos(rad) * radius
                const ty = Math.sin(rad) * radius
                return (
                  <div
                    key={t.name}
                    className="trigram-item"
                    style={{
                      transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px))`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  >
                    <span className="trigram-symbol">{t.symbol}</span>
                    <span className="trigram-name">{t.name}</span>
                  </div>
                )
              })}

              {/* Center Taiji */}
              <div className="bagua-center">
                <div className="taichi-glow"></div>
                <div className="taichi-symbol">☯</div>
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="hero-content">
            <div className="hero-ornament-top">
              <span className="ornament-line"></span>
              <span className="ornament-dot">◆</span>
              <span className="ornament-line"></span>
            </div>

            <h1 className="hero-title">
              <span className="title-line">玄风门</span>
            </h1>

            <div className="hero-subtitle-wrap">
              <p className="hero-subtitle">天地有象，万事有机</p>
              <p className="hero-subtitle">知其势者，顺势而行</p>
            </div>

            <div className="hero-divider">
              <span className="divider-line"></span>
              <span className="divider-symbol">☯</span>
              <span className="divider-line"></span>
            </div>

            <p className="hero-desc">
              传承千年易学智慧，融汇先天八卦、六爻、形势风水等多门体系，
              以现代科技诠释东方玄学，为您指引方向，调和阴阳。
            </p>

            <div className="hero-actions">
              <Link to="/liuyao" className="btn btn-primary">
                <span>起卦问事</span>
              </Link>
              <Link to="/daily" className="btn btn-secondary">
                <span>今日卦象</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint">
          <span className="scroll-line"></span>
          <span className="scroll-text">向下探索</span>
        </div>
      </section>

      {/* ── Feature Cards Section ── */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">四 大 功 能</span>
            <h2 className="section-title">
              <span className="title-ornament-left">❖</span>
              &nbsp;全方位玄学服务&nbsp;
              <span className="title-ornament-right">❖</span>
            </h2>
            <p className="section-desc">
              集六爻解卦、风水勘测、今日卦象、每日运势于一体，
              为您构建完整的东方玄学体验
            </p>
          </div>

          <div className="features-grid">
            {featureCards.map((card, index) => (
              <Link
                key={card.name}
                to={card.path}
                className="feature-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-corner tl"></div>
                <div className="card-corner tr"></div>
                <div className="card-corner bl"></div>
                <div className="card-corner br"></div>

                <div className="card-icon-wrap">
                  <span className="card-icon">{card.icon}</span>
                </div>

                <div className="card-content">
                  <h3 className="card-name">{card.name}</h3>
                  <p className="card-subtitle">{card.subtitle}</p>
                  <p className="card-desc">{card.desc}</p>
                </div>

                <div className="card-footer">
                  <span className="card-enter">进 入</span>
                  <span className="card-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Philosophy Section ── */}
      <section className="philosophy-section">
        <div className="container">
          <div className="philosophy-inner">
            <div className="philosophy-visual">
              <div className="philosophy-circle c1"></div>
              <div className="philosophy-circle c2"></div>
              <div className="philosophy-circle c3"></div>
              <div className="philosophy-symbol">☯</div>
            </div>

            <div className="philosophy-content">
              <span className="section-label">品 牌 理 念</span>
              <h2 className="philosophy-title">天人合一 · 和谐共处</h2>
              <p className="philosophy-desc">
                风水之道，在于顺应自然、调和阴阳。玄风门秉承这一古老智慧，
                通过现代化手段帮助人们创造更和谐的生活空间。
              </p>
              <p className="philosophy-desc">
                我们相信，良好的空间布局与卦象指引能够改善人的身心状态，
                进而影响生活的方方面面。
              </p>

              <ul className="philosophy-list">
                <li>
                  <span className="list-mark">✦</span>
                  传承千年风水理论与实践经验
                </li>
                <li>
                  <span className="list-mark">✦</span>
                  六十四卦演绎，洞察日月运势
                </li>
                <li>
                  <span className="list-mark">✦</span>
                  结合现代科技与AI图像分析
                </li>
                <li>
                  <span className="list-mark">✦</span>
                  提供实际可行的改善方案
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Brand Slogan Section ── */}
      <section className="slogan-section">
        <div className="container">
          <div className="slogan-inner">
            <div className="slogan-ornament top">
              <span className="slogan-line"></span>
              <span className="slogan-dots">◆ ◇ ◆</span>
              <span className="slogan-line"></span>
            </div>

            <h2 className="slogan-text">遇事不决，可问玄风</h2>

            <div className="slogan-ornament bottom">
              <span className="slogan-line"></span>
              <span className="slogan-dots">◆ ◇ ◆</span>
              <span className="slogan-line"></span>
            </div>

            <p className="slogan-sub">天地有象 · 万事有机 · 知其势者 · 顺势而行</p>
          </div>
        </div>
      </section>
    </div>
  )
}
