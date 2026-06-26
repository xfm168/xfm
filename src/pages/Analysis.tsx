import { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getVisitorId } from '../lib/hexagram'
import './Analysis.css'

type RoomType = 'living' | 'bedroom' | 'kitchen' | 'balcony'

interface Issue {
  id: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  location: string
  suggestion: string
  relatedObjects: string[]
}

interface AnalysisResult {
  detectedRoomType: string
  detectedObjects: string[]
  roomMatch: boolean
  mismatchReason: string
  analysisBasis: string
  score: number
  summary: string
  issues: Issue[]
}

interface PersistedState {
  image: string
  roomType: RoomType
  analysisResult: AnalysisResult
}

const roomNames: Record<RoomType, string> = {
  living: '客厅',
  bedroom: '卧室',
  kitchen: '厨房',
  balcony: '阳台'
}

const STORAGE_KEY = 'fengshui_analysis_data'

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    high: '重要',
    medium: '中等',
    low: '轻微'
  }
  return labels[severity] || severity
}

function getSeverityClass(severity: string): string {
  return `severity-${severity}`
}

function saveToStorage(data: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignore storage errors
  }
}

function loadFromStorage(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

export default function Analysis() {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [reportId, setReportId] = useState<string | null>(null)
  const [showShareCard, setShowShareCard] = useState(false)

  const [image, setImage] = useState<string | null>(location.state?.image ?? null)
  const [roomType, setRoomType] = useState<RoomType | null>(location.state?.roomType ?? null)
  const [result, setResult] = useState<AnalysisResult | undefined>(location.state?.analysisResult ?? undefined)

  // Persist to localStorage when state arrives from navigation
  useEffect(() => {
    if (location.state?.image && location.state?.roomType && location.state?.analysisResult) {
      saveToStorage({
        image: location.state.image,
        roomType: location.state.roomType,
        analysisResult: location.state.analysisResult,
      })
      setImage(location.state.image)
      setRoomType(location.state.roomType)
      setResult(location.state.analysisResult)
      // Save new record to DB (fresh analysis from navigation)
      saveReportToDB(location.state.roomType, location.state.analysisResult)
    }
  }, [location.state])

  // Restore from localStorage on page refresh (when location.state is empty)
  useEffect(() => {
    if (!image || !roomType || !result) {
      const stored = loadFromStorage()
      if (stored) {
        setImage(stored.image)
        setRoomType(stored.roomType)
        setResult(stored.analysisResult)
      }
    }
  }, [])

  async function saveReportToDB(rt: RoomType, res: AnalysisResult) {
    if (!supabase) return
    const { data } = await supabase
      .from('fengshui_reports')
      .insert({
        visitor_id: getVisitorId(),
        room_type: rt,
        basic_score: res.score,
        basic_analysis: {
          summary: res.summary,
          issues: res.issues,
          detectedObjects: res.detectedObjects,
          analysisBasis: res.analysisBasis,
        },
        payment_status: 'free',
      })
      .select('id')
      .single()
    if (data) setReportId((data as { id: string }).id)
  }

  const toggleIssue = (id: string) => {
    setExpandedIssues(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (!image || !roomType || !result) {
    return (
      <div className="analysis-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>未找到分析数据</h2>
          <p>请先上传照片进行分析</p>
          <Link to="/fengshui" className="back-btn">返回上传</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="analysis-page">
      {/* Result Header */}
      <section className="result-header">
        <div className="container">
          <span className="result-label">分析结果</span>
          <h1 className="result-title">{roomNames[roomType]}风水分析</h1>
        </div>
      </section>

      {/* Room Mismatch Warning */}
      {!result.roomMatch && (
        <section className="mismatch-section">
          <div className="container">
            <div className="mismatch-card">
              <div className="mismatch-icon">🚫</div>
              <h2 className="mismatch-title">空间类型不匹配</h2>
              <p className="mismatch-desc">
                您选择的是<strong>{roomNames[roomType]}</strong>，
                但AI识别到该照片为<strong>{result.detectedRoomType}</strong>。
              </p>
              {result.mismatchReason && (
                <p className="mismatch-reason">{result.mismatchReason}</p>
              )}
              <Link to="/fengshui" className="mismatch-btn">
                重新选择并上传
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Original Photo */}
      <section className="photo-section">
        <div className="container">
          <div className="photo-label">原始照片</div>
          <div className="photo-wrapper" onClick={() => setIsImageModalOpen(true)}>
            <img src={image} alt="房间照片" className="uploaded-photo" />
            <div className="photo-zoom-hint">
              <span>🔍</span>
              <span>点击放大</span>
            </div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="photo-modal-overlay" onClick={() => setIsImageModalOpen(false)}>
          <div className="photo-modal-content">
            <img src={image} alt="房间照片" className="photo-modal-img" />
            <button className="photo-modal-close" onClick={() => setIsImageModalOpen(false)}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* AI Detection Results */}
      {result.roomMatch && (
        <>
          {/* Score Section */}
          <section className="score-section">
            <div className="container">
              <div className="score-card">
                <div className="score-display">
                  <div className="score-ring">
                    <svg viewBox="0 0 120 120">
                      <circle
                        className="score-bg"
                        cx="60" cy="60" r="52"
                        fill="none"
                        strokeWidth="8"
                      />
                      <circle
                        className="score-fill"
                        cx="60" cy="60" r="52"
                        fill="none"
                        strokeWidth="8"
                        strokeDasharray={`${result.score * 3.27} 327`}
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div className="score-value">
                      <span className="score-number">{result.score}</span>
                      <span className="score-unit">分</span>
                    </div>
                  </div>
                </div>
                <div className="score-info">
                  <h2 className="score-level">
                    {result.score >= 80 ? '风水上佳' : result.score >= 60 ? '风水尚可' : '需要改善'}
                  </h2>
                  <p className="score-desc">{result.summary}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Detection Info Section */}
          <section className="detection-section">
            <div className="container">
              <div className="detection-card">
                <div className="detection-row">
                  <div className="detection-item">
                    <span className="detection-label">识别空间类型</span>
                    <span className="detection-value highlight">{result.detectedRoomType}</span>
                  </div>
                  <div className="detection-item">
                    <span className="detection-label">与选择类型匹配</span>
                    <span className="detection-value match-yes">✓ 匹配</span>
                  </div>
                </div>
                <div className="detection-objects">
                  <span className="detection-label">识别到的家具物品</span>
                  <div className="objects-list">
                    {result.detectedObjects.map((obj, idx) => (
                      <span key={idx} className="object-tag">{obj}</span>
                    ))}
                  </div>
                </div>
                <div className="detection-basis">
                  <span className="detection-label">分析依据</span>
                  <p className="basis-text">{result.analysisBasis}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Issues Section */}
          <section className="issues-section">
            <div className="container">
              <h2 className="section-heading">发现的问题</h2>

              <div className="issues-list">
                {result.issues.map((issue, idx) => (
                  <div
                    key={issue.id}
                    className={`issue-card ${expandedIssues.has(issue.id) ? 'expanded' : ''}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <button className="issue-header" onClick={() => toggleIssue(issue.id)}>
                      <span className={`severity-badge ${getSeverityClass(issue.severity)}`}>
                        {getSeverityLabel(issue.severity)}
                      </span>
                      <span className="issue-title">{issue.title}</span>
                      <span className="issue-icon">
                        {expandedIssues.has(issue.id) ? '−' : '+'}
                      </span>
                    </button>
                    <div className="issue-content">
                      <div className="issue-detail">
                        <h4>问题描述</h4>
                        <p>{issue.description}</p>
                      </div>
                      <div className="issue-detail location-detail">
                        <h4>位置</h4>
                        <div className="location-badge">
                          <span className="location-icon">📍</span>
                          <span>{issue.location}</span>
                        </div>
                        <p className="location-hint">点击图片查看对应区域</p>
                      </div>
                      {issue.relatedObjects && issue.relatedObjects.length > 0 && (
                        <div className="issue-detail">
                          <h4>相关物品</h4>
                          <div className="related-objects">
                            {issue.relatedObjects.map((obj, idx) => (
                              <span key={idx} className="object-tag small">{obj}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="issue-detail suggestion">
                        <h4>改善建议</h4>
                        <p>{issue.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="actions-section">
            <div className="container">
              <div className="actions-grid">
                <Link to="/fengshui" className="action-btn secondary">
                  <span>分析其他空间</span>
                </Link>
                <button className="action-btn share" onClick={() => setShowShareCard(true)}>
                  <span>生成分享卡</span>
                </button>
                <Link to="/" className="action-btn primary">
                  <span>返回首页</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Premium Report Teaser */}
          <section className="premium-teaser-section">
            <div className="container">
              <div className="premium-teaser-card">
                <div className="pt-glow" />
                <div className="pt-top">
                  <span className="pt-badge">深度报告</span>
                  <h3 className="pt-title">玄风勘测 · 深度报告</h3>
                  <p className="pt-desc">精准定位您的空间能量场，获取专属风水改善方案</p>
                </div>
                <ul className="pt-features">
                  {[
                    '明财位 · 暗财位精准定位',
                    '桃花位 · 文昌位分析',
                    '健康位 · 病符位解析',
                    '家具布局专业建议',
                    '颜色五行搭配方案',
                    'AI风水师深度解读',
                  ].map(f => (
                    <li key={f} className="pt-feature-item">
                      <span className="pt-lock">🔒</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className="pt-cta-btn"
                  onClick={() => navigate('/premium-report', {
                    state: {
                      reportId,
                      roomType,
                      score: result.score,
                      summary: result.summary,
                    },
                  })}
                >
                  查看完整风水报告
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Mismatch case: still show detected objects for reference */}
      {!result.roomMatch && (
        <section className="detection-section">
          <div className="container">
            <div className="detection-card mismatch-info">
              <div className="detection-objects">
                <span className="detection-label">识别到的物品</span>
                <div className="objects-list">
                  {result.detectedObjects.map((obj, idx) => (
                    <span key={idx} className="object-tag">{obj}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Share Card Modal */}
      {showShareCard && (
        <div className="share-modal-overlay" onClick={() => setShowShareCard(false)}>
          <div className="share-modal-wrap" onClick={e => e.stopPropagation()}>
            <button className="share-modal-close" onClick={() => setShowShareCard(false)}>✕</button>

            <div className="share-card" id="share-card">
              <div className="sc-brand">玄 风 门</div>
              <div className="sc-divider" />
              <div className="sc-score-row">
                <div className="sc-score-circle">
                  <span className="sc-score-num">{result.score}</span>
                  <span className="sc-score-unit">分</span>
                </div>
                <div className="sc-score-info">
                  <p className="sc-room">{roomNames[roomType]}风水分析</p>
                  <p className="sc-level">
                    {result.score >= 80 ? '风水上佳' : result.score >= 60 ? '风水尚可' : '需要改善'}
                  </p>
                </div>
              </div>
              <div className="sc-divider" />
              <p className="sc-summary">{result.summary}</p>
              <div className="sc-divider" />
              <p className="sc-tagline">遇事不决，可问玄风</p>
              <div className="sc-taiji">☯</div>
            </div>

            <div className="share-actions">
              {typeof navigator.share === 'function' && (
                <button
                  className="share-act-btn primary"
                  onClick={() => navigator.share({
                    title: '玄风门风水分析',
                    text: `${roomNames[roomType]}风水评分 ${result.score} 分 · ${result.summary}`,
                    url: window.location.href,
                  })}
                >
                  分享结果
                </button>
              )}
              <p className="share-hint">长按图片可保存分享卡</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
