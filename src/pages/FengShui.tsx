import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './FengShui.css'
import { runV31Pipeline, type V31PipelineOutput } from '../lib/fengshui/v31/pipeline'
import { PIPELINE_STEPS, type PipelineStep } from '../lib/fengshui/pipeline'
import { validateImageType, validateFileSize } from '../lib/security/inputValidation'
import { sanitizeHtml, encodeForHtml } from '../lib/security/sanitize'
import { usePageSEO } from '../hooks/usePageSEO'
import type { ImageQualityCheck, ProfessionalFengShuiReport, FengShuiTerm } from '../lib/fengshui/types'
import { getTermExplanation } from '../lib/fengshui/knowledge/rulesKnowledgeBase'
import { clearAllFengShuiCache } from '../lib/fengshui/utils/cache'
import { saveFengShuiHistory } from '../lib/fengshui/history'
import { generatePDFReport } from '../lib/fengshui/v31/pdf'
import { saveHistoryFromReportV31 } from '../lib/fengshui/v31/history'
import AnnotationViewer from '../components/business/AnnotationViewer/AnnotationViewer'
import { SharePanel } from '../components/business'
import type { FengShuiHistoryRecordV31 } from '../lib/fengshui/v31/types'

// UI 层简化房间类型（面向用户选择）
type UIRoomType = 'living' | 'bedroom' | 'kitchen' | 'balcony' | 'study' | 'bathroom' | 'entrance' | 'dining'

interface RoomInfo {
  id: UIRoomType
  name: string
  icon: string
  desc: string
}

const roomTypes: RoomInfo[] = [
  { id: 'living', name: '客厅', icon: '🛋️', desc: '会客迎财之所' },
  { id: 'bedroom', name: '卧室', icon: '🛏️', desc: '休养生息之地' },
  { id: 'kitchen', name: '厨房', icon: '🍳', desc: '炊饮食禄之源' },
  { id: 'bathroom', name: '卫生间', icon: '🚿', desc: '清洁排污之所' },
  { id: 'study', name: '书房', icon: '📚', desc: '文昌学业之地' },
  { id: 'dining', name: '餐厅', icon: '🍽️', desc: '家庭团聚之所' },
  { id: 'balcony', name: '阳台', icon: '🌿', desc: '纳气聚财之道' },
  { id: 'entrance', name: '玄关', icon: '🚪', desc: '纳气门户之位' },
]

type PagePhase = 'select' | 'upload' | 'analyzing' | 'result'

export default function FengShui() {
  usePageSEO({
    title: '风水勘测 | 玄风门',
    description: '上传空间照片，玄风门将通过传统风水学理论为您分析空间格局、气运流动，提供专业改善建议。',
    canonical: 'https://xuanfengmen.com/fengshui'
  })

  const [phase, setPhase] = useState<PagePhase>('select')
  const [selectedRoom, setSelectedRoom] = useState<UIRoomType | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pipeline 状态
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map(s => ({ ...s, status: 'pending' as const, progress: 0 }))
  )
  const [overallProgress, setOverallProgress] = useState(0)
  const [pipelineResult, setPipelineResult] = useState<V31PipelineOutput | null>(null)

  // V3.0: 图片质量检测
  const [imageQuality, setImageQuality] = useState<ImageQualityCheck | null>(null)

  // V3.0: 术语弹窗
  const [activeTerm, setActiveTerm] = useState<FengShuiTerm | null>(null)

  // 报告展开状态
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overall-score-8d']))
  const [displayScore, setDisplayScore] = useState(0)
  const [showSections, setShowSections] = useState(false)

  // V3.2: 分享面板
  const [sharePanelOpen, setSharePanelOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultScrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // CountUp 动画 + 模块依次出现
  useEffect(() => {
    if (phase !== 'result' || !pipelineResult?.report) return

    const targetScore = pipelineResult.report.overallScore
    const duration = 1200
    const startTime = Date.now()

    function animate(): void {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutQuad
      const eased = 1 - (1 - progress) * (1 - progress)
      setDisplayScore(Math.round(targetScore * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)

    // 模块依次出现：评分 → 300ms → 问题 → 300ms → 建议 → 300ms → 总结
    const timer = setTimeout(() => setShowSections(true), 600)
    return () => clearTimeout(timer)
  }, [phase, pipelineResult?.report?.overallScore])

  // V3.0 / V3.1: 保存到历史记录
  useEffect(() => {
    if (phase !== 'result' || !pipelineResult || pipelineResult.status !== 'success') return
    if (!selectedRoom || !uploadedImage) return
    const roomName = roomTypes.find(r => r.id === selectedRoom)?.name ?? selectedRoom
    try {
      if (pipelineResult.v31) {
        saveHistoryFromReportV31({
          roomType: selectedRoom,
          roomName,
          imageData: uploadedImage,
          overallScore: pipelineResult.v31.score12D.overall,
          score12D: Object.fromEntries(
            Object.entries(pipelineResult.v31.score12D.dimensions).map(([k, v]) => [k, v.score])
          ),
          credibility: pipelineResult.v31.credibility,
          mainIssues: pipelineResult.v31.professionalReport.issues.map(i => i.title).slice(0, 5),
          remediationPlans: pipelineResult.v31.professionalReport.remediationPlans.map(p => p.issue).slice(0, 5),
          annotations: pipelineResult.v31.annotations,
          analysisDurationMs: pipelineResult.totalTime,
        })
      } else {
        saveFengShuiHistory(selectedRoom, roomName, uploadedImage, pipelineResult)
      }
    } catch {
      // 保存失败不影响用户体验
    }
  }, [phase, pipelineResult, selectedRoom, uploadedImage])

  const handleRoomSelect = (room: UIRoomType) => {
    setSelectedRoom(room)
    setPhase('upload')
    setUploadedImage(null)
    setError(null)
  }

  const handleFileSelect = useCallback((file: File) => {
    if (!file) {
      setError('请选择要上传的图片')
      return
    }
    
    if (!validateImageType(file.type)) {
      setError('请上传图片文件（JPG、PNG、WebP、GIF 格式）')
      return
    }
    
    if (!validateFileSize(file.size, 10)) {
      setError('图片大小不能超过 10MB，请压缩后重新上传')
      return
    }
    
    if (file.size < 1024) {
      setError('图片文件过小，请上传有效的图片')
      return
    }
    
    setError(null)
    setImageQuality(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setUploadedImage(dataUrl)

      // V3.0: 图片质量检测
      try {
        const { checkImageQuality } = require('../lib/fengshui/utils/imageQuality')
        const quality = checkImageQuality(dataUrl)
        setImageQuality(quality)
        if (!quality.passed) {
          const warnings = quality.checks.filter(c => !c.passed).map(c => c.message).join('；')
          setError('图片质量提醒：' + warnings)
        }
      } catch {
        // 质量检测失败不影响上传
      }
    }
    reader.onerror = () => {
      setError('图片读取失败，请重新选择文件')
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleAnalyze = async () => {
    if (!uploadedImage || !selectedRoom) return

    setPhase('analyzing')
    setError(null)
    setPipelineSteps(PIPELINE_STEPS.map(s => ({ ...s, status: 'pending' as const, progress: 0 })))
    setOverallProgress(0)

    try {
      const result = await runV31Pipeline({
        imageData: uploadedImage,
        roomType: selectedRoom,
        mode: 'standard',
        onProgress: (step, progress) => {
          setPipelineSteps(prev => 
            prev.map(s => s.id === step.id ? { ...s, ...step } : s)
          )
          setOverallProgress(progress)
        },
      })
      
      setPipelineResult(result)
      setPhase('result')
      
      if (result.status === 'error') {
        setError(result.error || '推演受阻')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '推演受阻')
      setPhase('upload')
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  const resetAll = () => {
    setPhase('select')
    setSelectedRoom(null)
    setUploadedImage(null)
    setPipelineResult(null)
    setError(null)
    setImageQuality(null)
    setExpandedSections(new Set(['overall-score-8d']))
  }

  // ========== 渲染 ==========

  if (phase === 'analyzing') {
    return (
      <div className="fengshui fengshui-analyzing">
        <section className="analyzing-header">
          <div className="container">
            <span className="page-label">风水分析</span>
            <h1 className="page-title">正在推演宅气……</h1>
            <p className="page-desc">宅气分析中，请稍候，整个过程约需 10-30 秒</p>
          </div>
        </section>

        <section className="analyzing-content">
          <div className="container">
            {/* 进度环 */}
            <div className="progress-ring-container">
              <svg className="progress-ring" viewBox="0 0 120 120">
                <circle className="progress-ring-bg" cx="60" cy="60" r="52" />
                <circle 
                  className="progress-ring-fill"
                  cx="60" cy="60" r="52"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - overallProgress / 100)}
                />
              </svg>
              <div className="progress-ring-text">
                <span className="progress-percent">{overallProgress}%</span>
                <span className="progress-label">分析中</span>
              </div>
            </div>

            {/* Pipeline 步骤 */}
            <div className="pipeline-steps">
              {pipelineSteps.map((step, idx) => (
                <div 
                  key={step.id} 
                  className={`pipeline-step ${step.status}`}
                >
                  <div className="step-icon">
                    {step.status === 'completed' ? '✓' : step.status === 'error' ? '✕' : step.icon}
                  </div>
                  <div className="step-info">
                    <span className="step-name">{step.name}</span>
                    {step.status === 'running' && (
                      <div className="step-progress-bar">
                        <div 
                          className="step-progress-fill"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <div className={`step-connector ${step.status === 'completed' ? 'done' : ''}`} />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="error-message large with-action">
                <div className="error-content">
                  <span className="error-icon-inline">⚠️</span>
                  <span>{error}</span>
                </div>
                <button className="retry-btn" onClick={handleAnalyze}>
                  重新分析
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    )
  }

  if (phase === 'result' && pipelineResult?.report) {
    const report = pipelineResult.report
    const score = report.overallScore
    const scoreLevel = getScoreLevel(score)

    return (
      <div className="fengshui fengshui-result">
        {/* 顶部摘要 */}
        <section className={`result-header level-${scoreLevel.key}`}>
          <div className="container">
            <button className="back-btn" onClick={resetAll}>
              ← 重新推演
            </button>
            <div className="result-score-area">
              <div className="result-score-ring">
                <svg viewBox="0 0 120 120">
                  <circle className="score-ring-bg" cx="60" cy="60" r="52" />
                  <circle
                    className="score-ring-fill"
                    cx="60" cy="60" r="52"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - score / 100)}
                  />
                </svg>
                <div className="score-ring-text">
                  <span className="score-value">{displayScore}</span>
                  <span className="score-label">{scoreLevel.text}</span>
                </div>
              </div>
              <div className="result-info">
                <h1 className="result-title">{report.title}</h1>
                {pipelineResult.v31 ? (
                  <div className="v31-credibility-mini">
                    <p className="result-confidence">
                      V3.1 分析可信度：{getV31CredibilityLevelText(pipelineResult.v31.credibility.level)}
                      （{pipelineResult.v31.credibility.score}分）
                    </p>
                    <div className="credibility-factors-mini">
                      {Object.entries(pipelineResult.v31.credibility.factors).map(([key, value]) => (
                        <div key={key} className="credibility-factor-mini">
                          <span className="factor-name">{getCredibilityFactorName(key)}</span>
                          <span className="factor-score">{typeof value === 'number' ? value : 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="result-confidence">
                    分析可信度：
                    {pipelineResult.professionalReport?.confidence.level === 'high' ? '高' :
                     pipelineResult.professionalReport?.confidence.level === 'fairlyHigh' ? '较高' :
                     pipelineResult.professionalReport?.confidence.level === 'moderate' ? '一般' : '低'}
                    {pipelineResult.professionalReport?.confidence.score ?
                      '（' + pipelineResult.professionalReport.confidence.score + '分）' : ''}
                  </p>
                )}
                <p className="result-time">
                  推算耗时：{(pipelineResult.totalTime / 1000).toFixed(1)} 秒
                </p>
              </div>
              {pipelineResult.v31 && (
                <div className="result-radar">
                  <ScoreRadarChart dimensions={pipelineResult.v31.score12D.dimensions} size={180} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 图片 + 分析 双栏布局 */}
        <section className="result-main">
          <div className="container">
            <div className="result-layout">
              {/* 左侧：原始图片 + 标注 */}
              <div className="result-image-panel">
                {uploadedImage && pipelineResult.v31?.annotations && pipelineResult.v31.annotations.length > 0 ? (
                  <AnnotationViewer
                    imageSrc={uploadedImage}
                    annotations={pipelineResult.v31.annotations}
                    height={500}
                  />
                ) : uploadedImage ? (
                  <div
                    className="result-image-wrapper"
                  >
                    <img
                      src={uploadedImage}
                      alt="分析空间照片"
                      className="result-image"
                      loading="eager"
                      decoding="async"
                    />
                    <p className="result-image-caption">原始空间照片</p>
                  </div>
                ) : null}
              </div>

              {/* 右侧：分析结果 */}
              <div className="result-content-panel">
                {/* 12 章节报告 */}
                <div className="report-sections">
                  {report.sections.map((section, idx) => (
                    <div 
                      key={section.id} 
                      className={`report-section section-${section.type} ${expandedSections.has(section.id) ? 'expanded' : ''} ${showSections ? 'stagger-visible' : ''}`}
                      style={{ animationDelay: showSections ? `${idx * 0.12}s` : '0s' }}
                    >
                      <button 
                        className="section-header"
                        onClick={() => toggleSection(section.id)}
                      >
                        <span className="section-title">{section.title}</span>
                        <span className="section-toggle">
                          {expandedSections.has(section.id) ? '收起 ▲' : '展开 ▼'}
                        </span>
                      </button>
                      {expandedSections.has(section.id) && (
                        <div className="section-content">
                          <div
                            className="section-markdown"
                            dangerouslySetInnerHTML={{ __html: markdownToHtml(sanitizeHtml(section.content)) }}
                            onClick={(e) => {
                              const target = e.target as HTMLElement
                              if (target.classList.contains('fengshui-term')) {
                                const term = target.getAttribute('data-term')
                                if (term) {
                                  const info = getTermExplanation(term)
                                  if (info) setActiveTerm(info)
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* V3.1: 流派融合评分 */}
        {pipelineResult.v31?.schoolScores && pipelineResult.v31.schoolScores.length > 0 && (
          <section className="result-schools">
            <div className="container">
              <h3 className="school-section-title">多流派融合分析</h3>
              <div className="school-scores-grid">
                {pipelineResult.v31.schoolScores.map(s => (
                  <div key={s.school} className="school-score-item">
                    <span className="school-name">{s.school}</span>
                    <div className="school-score-bar-wrap">
                      <div
                        className="school-score-bar"
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <span className="school-score-value">{s.score}分</span>
                    <span className="school-weight">权重 {Math.round(s.weight * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 底部操作 */}
        <section className="result-actions">
          <div className="container">
            <button className="action-btn primary" onClick={resetAll}>
              重新推演
            </button>
            <button className="action-btn" onClick={() => window.print()}>
              保存报告
            </button>
            {pipelineResult.v31 && (
              <button
                className="action-btn"
                onClick={async () => {
                  try {
                    const pdfUrl = await generatePDFReport(
                      {
                        title: '玄风门 · 风水勘测专业报告',
                        subtitle: report.title,
                        includeAnnotations: true,
                        includeClassical: true,
                        includeRadarChart: true,
                        pageSize: 'A4',
                      },
                      pipelineResult.v31.professionalReport,
                      pipelineResult.v31.annotations
                    )
                    const a = document.createElement('a')
                    a.href = pdfUrl
                    a.download = `xuanfeng_fengshui_report_${Date.now()}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                  } catch {
                    alert('PDF 生成失败，请稍后重试')
                  }
                }}
              >
                导出PDF报告
              </button>
            )}
            <button className="action-btn" onClick={() => setSharePanelOpen(true)}>
              分享
            </button>
          </div>
        </section>

        {/* V3.2: 分享面板 */}
        {pipelineResult?.report && uploadedImage && (
          <SharePanel
            open={sharePanelOpen}
            onClose={() => setSharePanelOpen(false)}
            record={{
              id: `analysis-${Date.now()}`,
              roomType: selectedRoom || 'living',
              roomName: roomTypes.find(r => r.id === selectedRoom)?.name || '客厅',
              imageData: uploadedImage,
              thumbnail: uploadedImage,
              overallScore: pipelineResult.report.overallScore,
              credibility: pipelineResult.v31?.credibility || { score: 70, level: 'medium', factors: {} as any, explanation: '' },
              mainIssues: pipelineResult.v31?.professionalReport?.issues?.map(i => i.title) || [],
              remediationPlans: pipelineResult.v31?.professionalReport?.remediationPlans?.map(r => r.title) || [],
              annotations: pipelineResult.v31?.annotations || [],
              createdAt: new Date().toISOString(),
              analysisDurationMs: pipelineResult.totalTime || 0,
              status: 'active',
              favorite: false,
              tags: [],
              notes: '',
            }}
          />
        )}

        {/* 术语解释弹窗 */}
        {activeTerm && (
          <div
            className="term-modal-overlay"
            onClick={() => setActiveTerm(null)}
            role="dialog"
            aria-label="术语解释"
            aria-modal="true"
          >
            <div className="term-modal" onClick={(e) => e.stopPropagation()}>
              <div className="term-modal-header">
                <h3 className="term-modal-title">{activeTerm.term}</h3>
                <span className="term-modal-category">{activeTerm.category}</span>
                <button
                  className="term-modal-close"
                  onClick={() => setActiveTerm(null)}
                  aria-label="关闭"
                >✕</button>
              </div>
              <div className="term-modal-body">
                <p className="term-modal-explanation">{activeTerm.explanation}</p>
                {activeTerm.classicalSource && (
                  <p className="term-modal-source">
                    <strong>古籍出处：</strong>{activeTerm.classicalSource}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }

  return (
    <div className="fengshui">
      <section className="fengshui-header">
        <div className="container">
          <span className="page-label">风水分析</span>
          <h1 className="page-title">
            {phase === 'select' ? '选择分析空间' : '上传空间照片'}
          </h1>
          <p className="page-desc">
            {phase === 'select' 
              ? '选择您要分析的空间类型，获得专业风水解读'
              : '上传清晰照片，系统将自动识别并生成完整风水报告'
            }
          </p>
        </div>
      </section>

      {phase === 'select' && (
        <section className="room-section">
          <div className="container">
            <h2 className="section-heading">选择空间类型</h2>
            <div className="room-grid">
              {roomTypes.map((room) => (
                <button
                  key={room.id}
                  className="room-card"
                  onClick={() => handleRoomSelect(room.id)}
                >
                  <span className="room-icon">{room.icon}</span>
                  <span className="room-name">{room.name}</span>
                  <span className="room-desc">{room.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {phase === 'upload' && (
        <section className="upload-section">
          <div className="container">
            <button 
              className="back-link"
              onClick={() => setPhase('select')}
            >
              ← 返回选择空间
            </button>

            <h2 className="section-heading">
              上传{selectedRoom ? roomTypes.find(r => r.id === selectedRoom)?.name : ''}照片
            </h2>

            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''} ${uploadedImage ? 'has-image' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !uploadedImage && fileInputRef.current?.click()}
            >
              {uploadedImage ? (
                <div className="preview-container">
                  <img src={uploadedImage} alt="上传预览" className="preview-image" loading="eager" decoding="async" />
                  <button
                    className="change-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setUploadedImage(null)
                      setError(null)
                    }}
                  >
                    更换照片
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <p className="upload-text">点击或拖拽上传照片</p>
                  <p className="upload-hint">支持 JPG、PNG 格式</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleInputChange}
              className="hidden-input"
            />

            {/* Tips */}
            <div className="tips-card">
              <h3 className="tips-title">拍照建议</h3>
              <ul className="tips-list">
                <li>
                  <span className="tip-icon">📸</span>
                  <span>确保光线充足，避免阴影遮盖</span>
                </li>
                <li>
                  <span className="tip-icon">📐</span>
                  <span>尽量拍摄完整空间，包含门窗位置</span>
                </li>
                <li>
                  <span className="tip-icon">🧭</span>
                  <span>如条件允许，标注大致方位</span>
                </li>
                <li>
                  <span className="tip-icon">🏠</span>
                  <span>保持空间整洁，分析更准确</span>
                </li>
              </ul>
            </div>

            {/* V3.0: 图片质量检测详情 */}
            {imageQuality && (
              <div className="image-quality-panel">
                <div className={`image-quality-header ${imageQuality.passed ? 'passed' : 'warning'}`}>
                  <span>{imageQuality.passed ? '✓' : '⚠'}</span>
                  <span>
                    图片质量检测
                    {imageQuality.passed ? '通过' : '存在提醒'}
                    {imageQuality.overallScore ? `（${imageQuality.overallScore}分）` : ''}
                  </span>
                </div>
                <div className="quality-check-list">
                  {imageQuality.checks.map((check, i) => (
                    <div key={i} className="quality-check-item">
                      <span className="check-label">{check.item}</span>
                      <span className={`check-status ${check.passed ? 'pass' : 'warn'}`}>
                        {check.passed ? '通过' : check.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="error-message">
                <span className="error-icon-inline">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              className={`analyze-btn ${!uploadedImage ? 'disabled' : ''}`}
              onClick={handleAnalyze}
              disabled={!uploadedImage}
            >
              <span>开始风水分析</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

// ========== V3.1 组件 ==========

interface ScoreRadarChartProps {
  dimensions: Record<string, { name: string; score: number }>
  size?: number
}

function ScoreRadarChart({ dimensions, size = 180 }: ScoreRadarChartProps) {
  const dimKeys = [
    'pattern', 'airFlow', 'windQi', 'lighting',
    'wealth', 'health', 'career', 'family',
    'elements', 'cleanliness', 'activityQuiet', 'shaQi'
  ]
  const dims = dimKeys.map(key => dimensions[key] ?? { name: key, score: 0 })
  const count = dims.length
  const center = size / 2
  const radius = size * 0.38
  const angleStep = (Math.PI * 2) / count

  // 网格圆
  const gridCircles = [0.2, 0.4, 0.6, 0.8, 1.0].map((ratio, i) => {
    const r = radius * ratio
    return (
      <circle
        key={`grid-${i}`}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="rgba(212, 168, 71, 0.15)"
        strokeWidth={1}
      />
    )
  })

  // 轴线
  const axisLines = dims.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2
    const x = center + radius * Math.cos(angle)
    const y = center + radius * Math.sin(angle)
    return (
      <line
        key={`axis-${i}`}
        x1={center}
        y1={center}
        x2={x}
        y2={y}
        stroke="rgba(212, 168, 71, 0.1)"
        strokeWidth={1}
      />
    )
  })

  // 数据多边形
  const points = dims.map((dim, i) => {
    const angle = i * angleStep - Math.PI / 2
    const value = Math.min(100, Math.max(0, dim.score)) / 100
    const x = center + radius * value * Math.cos(angle)
    const y = center + radius * value * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')

  // 标签
  const labels = dims.map((dim, i) => {
    const angle = i * angleStep - Math.PI / 2
    const labelRadius = radius + 14
    const x = center + labelRadius * Math.cos(angle)
    const y = center + labelRadius * Math.sin(angle)
    const anchor = x > center + 5 ? 'start' : x < center - 5 ? 'end' : 'middle'
    const dy = y > center + 5 ? '0.3em' : y < center - 5 ? '-0.3em' : '0.3em'
    return (
      <text
        key={`label-${i}`}
        x={x}
        y={y}
        textAnchor={anchor}
        dy={dy}
        fontSize={10}
        fill="var(--text-secondary)"
      >
        {dim.name}
      </text>
    )
  })

  // 数据点
  const dataDots = dims.map((dim, i) => {
    const angle = i * angleStep - Math.PI / 2
    const value = Math.min(100, Math.max(0, dim.score)) / 100
    const x = center + radius * value * Math.cos(angle)
    const y = center + radius * value * Math.sin(angle)
    return (
      <circle
        key={`dot-${i}`}
        cx={x}
        cy={y}
        r={3}
        fill="var(--accent)"
        stroke="var(--bg-card)"
        strokeWidth={1.5}
      />
    )
  })

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="score-radar-chart">
      {gridCircles}
      {axisLines}
      <polygon
        points={points}
        fill="rgba(212, 168, 71, 0.15)"
        stroke="var(--accent)"
        strokeWidth={1.5}
      />
      {dataDots}
      {labels}
    </svg>
  )
}

// ========== 辅助函数 ==========

function getScoreLevel(score: number): { text: string; key: string } {
  if (score >= 90) return { text: '极佳', key: 'excellent' }
  if (score >= 80) return { text: '优秀', key: 'great' }
  if (score >= 70) return { text: '良好', key: 'good' }
  if (score >= 60) return { text: '中等', key: 'medium' }
  if (score >= 50) return { text: '一般', key: 'fair' }
  return { text: '较差', key: 'poor' }
}

function getV31CredibilityLevelText(level: string): string {
  const map: Record<string, string> = {
    veryHigh: '极高',
    high: '高',
    medium: '中',
    low: '低',
    veryLow: '极低',
  }
  return map[level] || '中'
}

function getCredibilityFactorName(key: string): string {
  const map: Record<string, string> = {
    imageCompleteness: '图片完整度',
    recognitionAccuracy: '识别准确率',
    ruleMatchRate: '规则匹配率',
    elementRecognitionCount: '识别元素数',
    modelConsistency: '模型一致性',
  }
  return map[key] || key
}

// V3.0: 已知风水术语列表（用于渲染时添加可点击标记）
const KNOWN_TERMS = [
  '明堂', '藏风聚气', '穿堂煞', '横梁压顶', '缺角', '五行',
  '五行相生相克', '中宫', '气场', '煞气', '财位', '有靠',
  '靠山', '水火相冲', '西晒', '阳气', '阴阳', '八卦方位',
  '动线', '玄关', '聚宝盆',
]

function wrapTermsInHtml(html: string): string {
  let result = html
  for (const term of KNOWN_TERMS) {
    const regex = new RegExp('([^<>]|^)(' + term + ')([^<>]|$)', 'g')
    result = result.replace(regex, '$1<span class="fengshui-term" data-term="' + term + '">$2</span>$3')
  }
  return result
}

function markdownToHtml(md: string): string {
  var escaped = encodeForHtml(md)
  var html = escaped
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\|(.*)\|$/gm, function(_, content: string) {
      var cells = content.split('|').map(function(c: string) { return c.trim() })
      return '<tr>' + cells.map(function(c: string) { return '<td>' + c + '</td>' }).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    .replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
  // V3.0: 为术语添加可点击标记
  return wrapTermsInHtml(html)
}
