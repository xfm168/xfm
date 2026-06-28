import { useDailyHexagram } from '../hooks/useDailyHexagram'
import { todayString } from '../lib/hexagram'
import { PageTitle, Badge } from '../components/ui'
import { ScoreRing } from '../components/business'
import './Daily.css'

// ── Helpers ──────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="score-bar-track">
      <div className="score-bar-fill" style={{ width: `${score}%` }} />
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────

function DailySkeleton() {
  return (
    <div className="daily-skeleton">
      <div className="skel skel-badge" />
      <div className="skel skel-title" />
      <div className="skel skel-symbol" />
      <div className="skel skel-bar" />
      <div className="skel skel-bar" />
      <div className="skel skel-bar" />
    </div>
  )
}

// ── Date formatter ────────────────────────────────────

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const CN_MONTHS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
  return `${y} 年 ${CN_MONTHS[m]} 月 ${d} 日`
}

// ── Main page ─────────────────────────────────────────

export default function Daily() {
  const { status, data, error } = useDailyHexagram()
  const today = todayString()

  return (
    <div className="daily-page">
      {/* Page header */}
      <PageTitle
        icon="☯"
        label="今日卦运"
        title={formatDate(today)}
        subtitle="专属卦象 · 每日更新 · 同一天始终如一"
      />

      <div className="container daily-container">
        {status === 'loading' && <DailySkeleton />}

        {status === 'error' && (
          <div className="daily-error">
            <span className="error-icon">⚠</span>
            <p>{error}</p>
          </div>
        )}

        {status === 'ready' && data && (
          <div className="daily-content animate-fade-in">

            {/* ── Core: hexagram symbol + name ── */}
            <section className="hex-core-card">
              <Badge variant="gold" className="daily-hex-badge">第 {data.hexagram_number} 卦</Badge>
              <div className="hex-symbol-wrap">
                <span className="hex-symbol">{data.hexagram.symbol}</span>
                <div className="hex-symbol-glow" />
              </div>
              <h2 className="hex-name">{data.hexagram.name}卦</h2>
              <p className="hex-trigrams">
                <span>上卦：{data.hexagram.upper_trigram}</span>
                <span className="trigram-dot">·</span>
                <span>下卦：{data.hexagram.lower_trigram}</span>
              </p>
              <p className="hex-description">「{data.hexagram.description}」</p>
            </section>

            {/* ── Overall score ring ── */}
            <section className="daily-card score-main-card">
              <ScoreRing score={data.score} size={160} />
              <p className="score-fortune">{data.hexagram.fortune}</p>
            </section>

            {/* ── Five dimension scores ── */}
            <section className="daily-card dimensions-card">
              <h3 className="card-title">五维指数</h3>
              <div className="dimensions-grid">
                {[
                  { label: '事业', value: data.career_score,  desc: data.hexagram.career  },
                  { label: '财运', value: data.wealth_score,  desc: data.hexagram.wealth  },
                  { label: '感情', value: data.love_score,    desc: data.hexagram.love    },
                  { label: '健康', value: data.health_score,  desc: data.hexagram.health  },
                ].map(({ label, value, desc }) => (
                  <div key={label} className="dimension-item">
                    <div className="dim-header">
                      <span className="dim-label">{label}</span>
                      <span className="dim-score">{value}</span>
                    </div>
                    <ScoreBar score={value} />
                    <p className="dim-desc">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Today's analysis ── */}
            <section className="daily-card analysis-card">
              <h3 className="card-title">今日卦解</h3>
              <p className="analysis-text">{data.analysis}</p>
            </section>

            {/* ── Advice: do / don't ── */}
            <section className="daily-card advice-card">
              <div className="advice-col do-col">
                <h3 className="advice-title do-title">
                  <span className="advice-dot do-dot" />宜
                </h3>
                <ul className="advice-list">
                  {data.hexagram.advice_do.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="advice-divider" />
              <div className="advice-col dont-col">
                <h3 className="advice-title dont-title">
                  <span className="advice-dot dont-dot" />忌
                </h3>
                <ul className="advice-list">
                  {data.hexagram.advice_dont.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* ── Lucky info ── */}
            <section className="daily-card lucky-card">
              <div className="lucky-item">
                <span className="lucky-label">幸运色</span>
                <span className="lucky-color-chip" data-color={data.lucky_color} />
                <span className="lucky-value">{data.lucky_color}</span>
              </div>
              <div className="lucky-divider" />
              <div className="lucky-item">
                <span className="lucky-label">幸运数字</span>
                <span className="lucky-number">{data.lucky_number}</span>
              </div>
            </section>

          </div>
        )}
      </div>
    </div>
  )
}
