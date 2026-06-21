import { Link } from 'react-router-dom'
import './Home.css'

const modules = [
  {
    icon: '☯',
    name: '今日卦运',
    desc: '每日专属卦象，顺时而动',
    path: '/daily',
    key: 'daily',
  },
  {
    icon: '☰',
    name: '问事起卦',
    desc: '铜钱起课，一事一问，六爻断卦',
    path: '/liuyao',
    key: 'liuyao',
  },
  {
    icon: '⌂',
    name: '风水勘测',
    desc: 'AI识别空间，调和宅气',
    path: '/fengshui',
    key: 'fengshui',
  },
  {
    icon: '☷',
    name: '卦运记录',
    desc: '历史卦运，追溯命理轨迹',
    path: '/records',
    key: 'records',
  },
]

const trigrams = [
  { symbol: '☰', name: '乾', offsetX: 0,    offsetY: -130 },
  { symbol: '☱', name: '兌', offsetX: 92,   offsetY: -92  },
  { symbol: '☲', name: '離', offsetX: 130,  offsetY: 0    },
  { symbol: '☳', name: '震', offsetX: 92,   offsetY: 92   },
  { symbol: '☷', name: '坤', offsetX: 0,    offsetY: 130  },
  { symbol: '☶', name: '艮', offsetX: -92,  offsetY: 92   },
  { symbol: '☵', name: '坎', offsetX: -130, offsetY: 0    },
  { symbol: '☴', name: '巽', offsetX: -92,  offsetY: -92  },
]

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2l2.4 7.5H22l-6.4 4.6 2.4 7.5L12 17l-6 4.6 2.4-7.5L2 9.5h7.6L12 2z"/>
      </svg>
    ),
    title: '传承古法',
    desc: '融汇先天八卦、六爻、形势风水等多门易学体系',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: '当下即知',
    desc: '上传即析、摇卦即解，无需等待，随问随答',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    ),
    title: '精准指引',
    desc: '针对问题提供改善方案，有据可依，实操性强',
  },
]

export default function Home() {
  return (
    <div className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient"></div>
          <div className="hero-grid-pattern"></div>
        </div>

        <div className="hero-inner container">
          {/* Left: text + module cards */}
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              传承东方智慧 · 第四代玄学平台
            </div>

            <h1 className="hero-title">
              <span className="gold-gradient">玄风门</span>
            </h1>
            <p className="hero-subtitle">观其势 · 察其形 · 明其理</p>

            <div className="hero-manifesto">
              <div className="manifesto-ornament">◆</div>
              <div className="manifesto-text">
                <span>天地有象，万事有机。</span>
                <span>知其势者，顺势而行。</span>
              </div>
              <div className="manifesto-ornament">◆</div>
            </div>

            <div className="modules-grid">
              {modules.map((mod) => (
                <Link key={mod.key} to={mod.path} className="module-card">
                  <span className="module-icon">{mod.icon}</span>
                  <div className="module-info">
                    <span className="module-name">{mod.name}</span>
                    <span className="module-desc">{mod.desc}</span>
                  </div>
                  <svg className="module-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Bagua wheel */}
          <div className="hero-visual" aria-hidden="true">
            <div className="bagua-wrap">
              {/* Decorative rotating rings */}
              <div className="bagua-ring ring-d3"></div>
              <div className="bagua-ring ring-d2"></div>
              <div className="bagua-ring ring-d1"></div>

              {/* Static trigram labels */}
              {trigrams.map((t) => (
                <span
                  key={t.name}
                  className="trigram-item"
                  style={{
                    '--tx': `${t.offsetX}px`,
                    '--ty': `${t.offsetY}px`,
                  } as React.CSSProperties}
                >
                  <span className="trigram-symbol">{t.symbol}</span>
                  <span className="trigram-name">{t.name}</span>
                </span>
              ))}

              {/* Center */}
              <div className="bagua-center">
                <div className="taichi-glow"></div>
                <span className="taichi-symbol">☯</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">为何选择玄风门</span>
            <h2 className="section-title">古法智慧，现代呈现</h2>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Four Pillars ── */}
      <section className="pillars section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">四大功能</span>
            <h2 className="section-title">全方位玄学服务</h2>
            <p className="section-desc">
              集今日卦运、六爻解卦、风水勘测、卦运记录于一体，
              为您构建完整的东方玄学体验平台
            </p>
          </div>

          <div className="pillars-grid">
            {modules.map((mod, idx) => (
              <Link key={mod.key} to={mod.path} className="pillar-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="pillar-icon-wrap">
                  <span className="pillar-icon">{mod.icon}</span>
                </div>
                <h3 className="pillar-name">{mod.name}</h3>
                <p className="pillar-desc">{mod.desc}</p>
                <span className="pillar-enter">进入 →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="about section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <span className="section-label">核心理念</span>
              <h2 className="section-title">天人合一 · 和谐共处</h2>
              <p className="about-desc">
                风水之道，在于顺应自然、调和阴阳。玄风门秉承这一古老智慧，
                通过现代化手段帮助人们创造更和谐的生活空间。我们相信，
                良好的空间布局与卦象指引能够改善人的身心状态，进而影响生活的方方面面。
              </p>
              <ul className="about-list">
                <li><span className="check-icon">✓</span><span>传承千年风水理论与实践经验</span></li>
                <li><span className="check-icon">✓</span><span>六十四卦演绎，洞察日月运势</span></li>
                <li><span className="check-icon">✓</span><span>结合现代科技与AI图像分析</span></li>
                <li><span className="check-icon">✓</span><span>提供实际可行的改善方案</span></li>
              </ul>
            </div>
            <div className="about-visual">
              <div className="about-bagua">
                <div className="about-symbol">卦</div>
                <div className="about-rings">
                  <div className="about-ring r1"></div>
                  <div className="about-ring r2"></div>
                  <div className="about-ring r3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
