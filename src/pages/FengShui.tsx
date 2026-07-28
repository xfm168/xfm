import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, Variants } from 'framer-motion'
import {
  Sofa,
  Bed,
  ChefHat,
  ShowerHead,
  BookOpen,
  UtensilsCrossed,
  TreePine,
  DoorOpen,
  UploadCloud,
  Camera,
  Ruler,
  Compass,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Printer,
  FileText,
  Share2,
  X,
  Clock,
  Target,
} from 'lucide-react'
import './FengShui.css'
import { runV31Pipeline, type V31PipelineOutput } from '../lib/fengshui/v31/pipeline'
import { PIPELINE_STEPS, type PipelineStep } from '../lib/fengshui/pipeline'
import { validateImageType, validateFileSize } from '../lib/security/inputValidation'
import { sanitizeHtml, encodeForHtml } from '../lib/security/sanitize'
import { usePageSEO } from '../hooks/usePageSEO'
import type { ImageQualityCheck, ProfessionalFengShuiReport, FengShuiTerm } from '../lib/fengshui/types'
import { getTermExplanation } from '../lib/fengshui/knowledge/rulesKnowledgeBase'
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
  icon: React.ComponentType<{ className?: string; size?: number }>
  desc: string
  accent: string
}

const roomTypes: RoomInfo[] = [
  { id: 'living', name: '客厅', icon: Sofa, desc: '会客迎财之所', accent: '#d4a847' },
  { id: 'bedroom', name: '卧室', icon: Bed, desc: '休养生息之地', accent: '#a084ff' },
  { id: 'kitchen', name: '厨房', icon: ChefHat, desc: '炊饮食禄之源', accent: '#f08860' },
  { id: 'bathroom', name: '卫生间', icon: ShowerHead, desc: '清洁排污之所', accent: '#60b8f0' },
  { id: 'study', name: '书房', icon: BookOpen, desc: '文昌学业之地', accent: '#78d4b8' },
  { id: 'dining', name: '餐厅', icon: UtensilsCrossed, desc: '家庭团聚之所', accent: '#f0c060' },
  { id: 'balcony', name: '阳台', icon: TreePine, desc: '纳气聚财之道', accent: '#8fd478' },
  { id: 'entrance', name: '玄关', icon: DoorOpen, desc: '纳气门户之位', accent: '#f08888' },
]

const photoTips = [
  { icon: Camera, title: '光线充足', desc: '确保光线充足，避免阴影遮盖关键区域' },
  { icon: Ruler, title: '全景拍摄', desc: '尽量拍摄完整空间，包含门窗与整体格局' },
  { icon: Compass, title: '标注方位', desc: '如条件允许，可标注大致方位朝向' },
  { icon: Sparkles, title: '整洁空间', desc: '保持空间整洁，减少杂物干扰分析' },
]

type PagePhase = 'select' | 'upload' | 'analyzing' | 'result'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

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
      const eased = 1 - (1 - progress) * (1 - progress)
      setDisplayScore(Math.round(targetScore * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)

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
      <div className="fengshui fengshui-analyzing xfm-fs-v2">
        <motion.section
          className="analyzing-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="container">
            <span className="page-label">风水分析</span>
            <h1 className="page-title">正在推演宅气……</h1>
            <p className="page-desc">宅气分析中，请稍候，整个过程约需 10-30 秒</p>
          </div>
        </motion.section>

        <section className="analyzing-content">
          <div className="container">
            {/* 进度环 */}
            <motion.div
              className="progress-ring-container"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
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
            </motion.div>

            {/* Pipeline 步骤 */}
            <motion.div
              className="pipeline-steps"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {pipelineSteps.map((step, idx) => (
                <motion.div
                  key={step.id}
                  custom={idx}
                  variants={fadeUp}
                  className={`pipeline-step xfm-step-v2 ${step.status}`}
                >
                  <div className="step-icon">
                    {step.status === 'completed'
                      ? <CheckCircle2 size={20} />
                      : step.status === 'error'
                        ? <XCircle size={20} />
                        : <Clock size={20} />}
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
                </motion.div>
              ))}
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message large with-action xfm-error-v2"
              >
                <div className="error-content">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
                <button className="retry-btn xfm-retry-btn-v2" onClick={handleAnalyze}>
                  重新分析
                </button>
              </motion.div>
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
      <div className="fengshui fengshui-result xfm-fs-v2" ref={resultScrollRef}>
        {/* 顶部摘要 */}
        <section className={`result-header level-${scoreLevel.key}`}>
          <div className="container">
            <button className="back-btn xfm-back-btn-v2" onClick={resetAll}>
              <ChevronLeft size={18} />
              重新推演
            </button>
            <div className="result-score-area">
              <motion.div
                className="result-score-ring"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
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
              </motion.div>
              <div className="result-info">
                <motion.h1
                  className="result-title"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {report.title}
                </motion.h1>
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
                <motion.div
                  className="result-radar"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <ScoreRadarChart dimensions={pipelineResult.v31.score12D.dimensions} size={180} />
                </motion.div>
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
                  <div className="result-image-wrapper">
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
                    <motion.div
                      key={section.id}
                      custom={idx}
                      variants={fadeUp}
                      initial="hidden"
                      animate={showSections ? 'visible' : 'hidden'}
                      className={`report-section xfm-section-v2 section-${section.type} ${expandedSections.has(section.id) ? 'expanded' : ''}`}
                    >
                      <button
                        className="section-header"
                        onClick={() => toggleSection(section.id)}
                      >
                        <span className="section-title">{section.title}</span>
                        <span className="section-toggle-icon">
                          {expandedSections.has(section.id)
                            ? <ChevronUp size={18} />
                            : <ChevronDown size={18} />}
                        </span>
                      </button>
                      {expandedSections.has(section.id) && (
                        <motion.div
                          className="section-content"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
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
                        </motion.div>
                      )}
                    </motion.div>
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
                {pipelineResult.v31.schoolScores.map((s, idx) => (
                  <motion.div
                    key={s.school}
                    custom={idx}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    className="school-score-item xfm-school-item-v2"
                  >
                    <span className="school-name">{s.school}</span>
                    <div className="school-score-bar-wrap">
                      <div
                        className="school-score-bar"
                        style={{ width: `${s.score}%` }}
                      />
                    </div>
                    <span className="school-score-value">{s.score}分</span>
                    <span className="school-weight">权重 {Math.round(s.weight * 100)}%</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 底部操作 */}
        <section className="result-actions">
          <div className="container">
            <button className="action-btn primary xfm-action-btn-v2" onClick={resetAll}>
              <RotateCcw size={18} />
              重新推演
            </button>
            <button className="action-btn xfm-action-btn-v2" onClick={() => window.print()}>
              <Printer size={18} />
              保存报告
            </button>
            {pipelineResult.v31 && (
              <button
                className="action-btn xfm-action-btn-v2"
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
                <FileText size={18} />
                导出PDF报告
              </button>
            )}
            <button className="action-btn xfm-action-btn-v2" onClick={() => setSharePanelOpen(true)}>
              <Share2 size={18} />
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
          <motion.div
            className="term-modal-overlay"
            onClick={() => setActiveTerm(null)}
            role="dialog"
            aria-label="术语解释"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="term-modal xfm-term-modal-v2"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="term-modal-header">
                <div className="term-modal-title-wrap">
                  <h3 className="term-modal-title">{activeTerm.term}</h3>
                  <span className="term-modal-category">{activeTerm.category}</span>
                </div>
                <button
                  className="term-modal-close"
                  onClick={() => setActiveTerm(null)}
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="term-modal-body">
                <p className="term-modal-explanation">{activeTerm.explanation}</p>
                {activeTerm.classicalSource && (
                  <p className="term-modal-source">
                    <Target size={14} />
                    <strong>古籍出处：</strong>{activeTerm.classicalSource}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

      </div>
    )
  }

  return (
    <div className="fengshui xfm-fs-v2">
      <motion.section
        className="fengshui-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
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
      </motion.section>

      {phase === 'select' && (
        <section className="room-section">
          <div className="container">
            <motion.h2
              className="section-heading"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              选择空间类型
            </motion.h2>
            <motion.div
              className="room-grid"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {roomTypes.map((room, idx) => {
                const IconComp = room.icon
                return (
                  <motion.button
                    key={room.id}
                    custom={idx}
                    variants={fadeUp}
                    whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                    whileTap={{ scale: 0.97 }}
                    className="room-card xfm-room-card-v2"
                    onClick={() => handleRoomSelect(room.id)}
                    style={{ ['--xfm-room-accent' as string]: room.accent }}
                  >
                    <div className="room-icon-wrap">
                      <IconComp className="room-icon-lucide" size={28} />
                    </div>
                    <span className="room-name">{room.name}</span>
                    <span className="room-desc">{room.desc}</span>
                    <div className="room-card-glow" aria-hidden />
                  </motion.button>
                )
              })}
            </motion.div>
          </div>
        </section>
      )}

      {phase === 'upload' && (
        <section className="upload-section">
          <div className="container">
            <motion.button
              className="back-link xfm-back-link-v2"
              onClick={() => setPhase('select')}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{ x: -4 }}
            >
              <ChevronLeft size={18} />
              返回选择空间
            </motion.button>

            <motion.h2
              className="section-heading"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              上传{selectedRoom ? roomTypes.find(r => r.id === selectedRoom)?.name : ''}照片
            </motion.h2>

            <motion.div
              className={`upload-zone xfm-upload-zone-v2 ${isDragging ? 'dragging' : ''} ${uploadedImage ? 'has-image' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {uploadedImage ? (
                <motion.div
                  className="preview-container"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <img src={uploadedImage} alt="上传预览" className="preview-image" loading="eager" decoding="async" />
                  <label className="change-btn xfm-change-btn-v2">
                    <UploadCloud size={16} />
                    更换照片
                    <input
                      type="file"
                      accept="image/*"
                      className="xfm-upload-input-native"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </motion.div>
              ) : (
                <div className="upload-placeholder">
                  <motion.div
                    className="upload-icon xfm-upload-icon-v2"
                    animate={{
                      y: [0, -6, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <UploadCloud size={40} />
                  </motion.div>
                  <p className="upload-text">点击下方按钮上传照片</p>
                  <p className="upload-hint">支持 JPG、PNG、WebP 格式 · 最大 10MB</p>

                  <label className="upload-trigger-btn xfm-upload-trigger-v2">
                    <Camera size={20} />
                    <span>上传图片</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="xfm-upload-input-native"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelect(file)
                        e.target.value = ''
                      }}
                    />
                  </label>

                  <p className="upload-drag-hint">
                    或将图片拖拽到此处
                  </p>
                </div>
              )}
            </motion.div>

            {/* Tips */}
            <motion.div
              className="tips-card xfm-tips-card-v2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="tips-title">
                <Sparkles size={16} />
                拍照建议
              </h3>
              <div className="tips-grid">
                {photoTips.map((tip, idx) => {
                  const TipIcon = tip.icon
                  return (
                    <motion.div
                      key={idx}
                      custom={idx}
                      variants={fadeUp}
                      initial="hidden"
                      animate="visible"
                      className="tip-item xfm-tip-item-v2"
                    >
                      <div className="tip-icon-wrap">
                        <TipIcon size={20} />
                      </div>
                      <div className="tip-text-wrap">
                        <span className="tip-title">{tip.title}</span>
                        <span className="tip-desc">{tip.desc}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* V3.0: 图片质量检测详情 */}
            {imageQuality && (
              <motion.div
                className="image-quality-panel xfm-quality-panel-v2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className={`image-quality-header ${imageQuality.passed ? 'passed' : 'warning'}`}>
                  {imageQuality.passed
                    ? <CheckCircle2 size={20} />
                    : <AlertTriangle size={20} />}
                  <span>
                    图片质量检测{imageQuality.passed ? '通过' : '存在提醒'}
                    {imageQuality.overallScore ? `（${imageQuality.overallScore}分）` : ''}
                  </span>
                </div>
                <div className="quality-check-list">
                  {imageQuality.checks.map((check, i) => (
                    <div key={i} className="quality-check-item xfm-quality-item-v2">
                      <span className="check-label">{check.item}</span>
                      <span className={`check-status ${check.passed ? 'pass' : 'warn'}`}>
                        {check.passed
                          ? <><CheckCircle2 size={14} />通过</>
                          : <><AlertTriangle size={14} />{check.message}</>}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message xfm-error-v2"
              >
                <AlertTriangle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <motion.button
              type="button"
              className={`analyze-btn xfm-analyze-btn-v2 ${!uploadedImage ? 'disabled' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: uploadedImage ? 1 : 0.6, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              whileHover={uploadedImage ? { y: -3, boxShadow: '0 10px 40px rgba(212, 168, 71, 0.45)' } : {}}
              whileTap={uploadedImage ? { scale: 0.98 } : {}}
              onClick={handleAnalyze}
              disabled={!uploadedImage}
            >
              <span>开始风水分析</span>
              <ArrowRight size={20} />
            </motion.button>
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

  const points = dims.map((dim, i) => {
    const angle = i * angleStep - Math.PI / 2
    const value = Math.min(100, Math.max(0, dim.score)) / 100
    const x = center + radius * value * Math.cos(angle)
    const y = center + radius * value * Math.sin(angle)
    return `${x},${y}`
  }).join(' ')

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

// V3.0: 已知风水术语列表
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
    .replace(/^\|(.*)\|$/gm, function (_, content: string) {
      var cells = content.split('|').map(function (c: string) { return c.trim() })
      return '<tr>' + cells.map(function (c: string) { return '<td>' + c + '</td>' }).join('') + '</tr>'
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, '<table>$&</table>')
    .replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
  return wrapTermsInHtml(html)
}
