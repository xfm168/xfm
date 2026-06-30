import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './FengShui.css'
import { runFullPipeline, PIPELINE_STEPS, type PipelineStep, type PipelineOutput } from '../lib/fengshui/pipeline'

type RoomType = 'living' | 'bedroom' | 'kitchen' | 'balcony' | 'study' | 'bathroom' | 'entrance' | 'dining'

interface RoomInfo {
  id: RoomType
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
  const [phase, setPhase] = useState<PagePhase>('select')
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pipeline 状态
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(
    PIPELINE_STEPS.map(s => ({ ...s, status: 'pending' as const, progress: 0 }))
  )
  const [overallProgress, setOverallProgress] = useState(0)
  const [pipelineResult, setPipelineResult] = useState<PipelineOutput | null>(null)
  
  // 报告展开状态
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overall-score']))
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleRoomSelect = (room: RoomType) => {
    setSelectedRoom(room)
    setPhase('upload')
    setUploadedImage(null)
    setError(null)
  }

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setError('请上传图片文件（JPG、PNG格式）')
    }
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
      const result = await runFullPipeline({
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
        setError(result.error || '分析失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败')
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
    setExpandedSections(new Set(['overall-score']))
  }

  // ========== 渲染 ==========

  if (phase === 'analyzing') {
    return (
      <div className="fengshui fengshui-analyzing">
        <section className="analyzing-header">
          <div className="container">
            <span className="page-label">风水分析</span>
            <h1 className="page-title">AI 正在解析您的空间</h1>
            <p className="page-desc">识别中，请稍候，整个过程约需 10-30 秒</p>
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
              <div className="error-message large">
                <span className="error-icon-inline">⚠️</span>
                <span>{error}</span>
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
              ← 重新分析
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
                  <span className="score-value">{score}</span>
                  <span className="score-label">{scoreLevel.text}</span>
                </div>
              </div>
              <div className="result-info">
                <h1 className="result-title">{report.title}</h1>
                <p className="result-confidence">置信度：{report.confidence}%</p>
                <p className="result-time">
                  分析用时：{(pipelineResult.totalTime / 1000).toFixed(1)} 秒
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 12 章节报告 */}
        <section className="report-sections">
          <div className="container">
            {report.sections.map(section => (
              <div 
                key={section.id} 
                className={`report-section section-${section.type} ${expandedSections.has(section.id) ? 'expanded' : ''}`}
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
                      dangerouslySetInnerHTML={{ __html: markdownToHtml(section.content) }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 底部操作 */}
        <section className="result-actions">
          <div className="container">
            <button className="action-btn primary" onClick={resetAll}>
              重新分析
            </button>
            <button className="action-btn" onClick={() => window.print()}>
              保存报告
            </button>
          </div>
        </section>
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
              : '上传清晰照片，AI 将自动识别并生成完整风水报告'
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
                  <img src={uploadedImage} alt="上传预览" className="preview-image" />
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
              accept="image/*"
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

// ========== 辅助函数 ==========

function getScoreLevel(score: number): { text: string; key: string } {
  if (score >= 90) return { text: '极佳', key: 'excellent' }
  if (score >= 80) return { text: '优秀', key: 'great' }
  if (score >= 70) return { text: '良好', key: 'good' }
  if (score >= 60) return { text: '中等', key: 'medium' }
  if (score >= 50) return { text: '一般', key: 'fair' }
  return { text: '较差', key: 'poor' }
}

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\|(.*)\|$/gm, (_, content) => {
      const cells = content.split('|').map((c: string) => c.trim())
      return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}
