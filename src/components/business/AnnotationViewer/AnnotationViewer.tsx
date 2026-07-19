import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import './AnnotationViewer.css'
import type { ImageAnnotation, Severity } from '../../../lib/fengshui/v31/types'

/* ──────────────────────────────────────────────────
   类型定义
   ────────────────────────────────────────────────── */

export interface AnnotationViewerProps {
  imageSrc: string
  annotations: ImageAnnotation[]
  width?: string | number
  height?: string | number
  className?: string
}

type FilterSeverity = 'all' | 'critical-severe' | 'significant-moderate' | 'suggestion'

/* ──────────────────────────────────────────────────
   颜色分级系统
   ────────────────────────────────────────────────── */

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#ef4444',
  severe: '#ef4444',
  significant: '#f97316',
  moderate: '#eab308',
  suggestion: '#3b82f6',
}

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: '严重',
  severe: '严重',
  significant: '重要',
  moderate: '中等',
  suggestion: '建议',
}

const SEVERITY_ORDER: Severity[] = ['critical', 'severe', 'significant', 'moderate', 'suggestion']

/* ──────────────────────────────────────────────────
   工具函数
   ────────────────────────────────────────────────── */

function getSeverityColor(anno: ImageAnnotation): string {
  return SEVERITY_COLORS[anno.severity] || anno.color || '#3b82f6'
}

function sortBySeverity(annotations: ImageAnnotation[]): ImageAnnotation[] {
  return [...annotations].sort((a, b) => {
    const idxA = SEVERITY_ORDER.indexOf(a.severity)
    const idxB = SEVERITY_ORDER.indexOf(b.severity)
    if (idxA !== idxB) return idxA - idxB
    return a.label.localeCompare(b.label)
  })
}

function filterAnnotations(
  annotations: ImageAnnotation[],
  filter: FilterSeverity
): ImageAnnotation[] {
  switch (filter) {
    case 'critical-severe':
      return annotations.filter(a => a.severity === 'critical' || a.severity === 'severe')
    case 'significant-moderate':
      return annotations.filter(a => a.severity === 'significant' || a.severity === 'moderate')
    case 'suggestion':
      return annotations.filter(a => a.severity === 'suggestion')
    default:
      return annotations
  }
}

/* ──────────────────────────────────────────────────
   主组件
   ────────────────────────────────────────────────── */

export default function AnnotationViewer({
  imageSrc,
  annotations,
  width = '100%',
  height = 'auto',
  className = '',
}: AnnotationViewerProps) {
  /* ---------- 状态 ---------- */
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [showAnnotatedImage, setShowAnnotatedImage] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterSeverity>('all')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const issueListRef = useRef<HTMLDivElement>(null)
  const issueItemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  /* ---------- 派生数据 ---------- */
  const sortedAnnotations = useMemo(() => sortBySeverity(annotations), [annotations])
  const visibleAnnotations = useMemo(
    () => filterAnnotations(sortedAnnotations, filter),
    [sortedAnnotations, filter]
  )

  /* ---------- 图片加载 ---------- */
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    setImageLoaded(true)
  }, [])

  /* ---------- 缩放 ---------- */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setScale(prev => Math.min(3, Math.max(0.5, prev + delta)))
  }, [])

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.25))
  }, [])

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.25))
  }, [])

  const resetView = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  /* ---------- 拖拽平移 ---------- */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }, [scale, offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  /* ---------- 触摸手势（双指缩放 + 拖拽） ---------- */
  const touchStateRef = useRef({
    initialDistance: 0,
    initialScale: 1,
    initialOffset: { x: 0, y: 0 },
    initialTouch: { x: 0, y: 0 },
    isPinching: false,
  })

  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStateRef.current = {
        initialDistance: getTouchDistance(e.touches),
        initialScale: scale,
        initialOffset: { ...offset },
        initialTouch: { x: 0, y: 0 },
        isPinching: true,
      }
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      })
    }
  }, [scale, offset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      const distance = getTouchDistance(e.touches)
      const ratio = distance / touchStateRef.current.initialDistance
      const newScale = Math.min(3, Math.max(0.5, touchStateRef.current.initialScale * ratio))
      setScale(newScale)
    } else if (e.touches.length === 1 && isDragging) {
      setOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }, [isDragging, dragStart])

  const handleTouchEnd = useCallback(() => {
    touchStateRef.current.isPinching = false
    setIsDragging(false)
  }, [])

  /* ---------- 全屏 ---------- */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        document.exitFullscreen?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  /* ---------- 选中联动 ---------- */
  const handleAnnotationClick = useCallback((id: string) => {
    setSelectedId(id)
    // 滚动问题列表到对应项
    const el = issueItemRefs.current.get(id)
    if (el && issueListRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [])

  const handleIssueClick = useCallback((id: string) => {
    setSelectedId(id)
    // 定位图片到标注位置（居中显示）
    const anno = annotations.find(a => a.id === id)
    if (anno && imageContainerRef.current && naturalSize.width > 0) {
      const containerRect = imageContainerRef.current.getBoundingClientRect()
      const imgDisplayWidth = containerRect.width
      const imgDisplayHeight = containerRect.height

      // 计算标注框中心在图片上的位置（像素）
      const annoCenterX = (anno.bbox.x + anno.bbox.width / 2) * imgDisplayWidth * scale
      const annoCenterY = (anno.bbox.y + anno.bbox.height / 2) * imgDisplayHeight * scale

      // 计算使标注居中需要的偏移
      const targetX = containerRect.width / 2 - annoCenterX
      const targetY = containerRect.height / 2 - annoCenterY

      // 放大到合适比例
      if (scale < 1.5) {
        setScale(1.8)
      }
      setOffset({ x: targetX, y: targetY })
    }
  }, [annotations, scale, naturalSize])

  /* ---------- 渲染 ---------- */

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  return (
    <div
      ref={containerRef}
      className={`annotation-viewer ${isFullscreen ? 'av-fullscreen' : ''} ${className}`}
      style={containerStyle}
    >
      {/* 工具栏 */}
      <div className="av-toolbar">
        <div className="av-toolbar-left">
          <button
            className={`av-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            aria-label="显示全部标注"
          >
            全部
          </button>
          <button
            className={`av-filter-btn av-filter-critical ${filter === 'critical-severe' ? 'active' : ''}`}
            onClick={() => setFilter('critical-severe')}
            aria-label="仅显示严重问题"
          >
            严重
          </button>
          <button
            className={`av-filter-btn av-filter-warning ${filter === 'significant-moderate' ? 'active' : ''}`}
            onClick={() => setFilter('significant-moderate')}
            aria-label="仅显示警告"
          >
            警告
          </button>
          <button
            className={`av-filter-btn av-filter-suggestion ${filter === 'suggestion' ? 'active' : ''}`}
            onClick={() => setFilter('suggestion')}
            aria-label="仅显示建议"
          >
            建议
          </button>
        </div>
        <div className="av-toolbar-right">
          <button
            className={`av-icon-btn ${!showAnnotations ? 'off' : ''}`}
            onClick={() => setShowAnnotations(v => !v)}
            aria-label={showAnnotations ? '隐藏所有标注' : '显示所有标注'}
            title={showAnnotations ? '隐藏标注' : '显示标注'}
          >
            {showAnnotations ? '👁' : '🙈'}
          </button>
          <button
            className={`av-icon-btn ${showAnnotatedImage ? 'active' : ''}`}
            onClick={() => setShowAnnotatedImage(v => !v)}
            aria-label="切换原图/标注图"
            title={showAnnotatedImage ? '显示原图' : '显示标注图'}
          >
            🖼
          </button>
          <button
            className="av-icon-btn"
            onClick={zoomOut}
            aria-label="缩小"
            title="缩小"
          >
            −
          </button>
          <span className="av-zoom-level">{Math.round(scale * 100)}%</span>
          <button
            className="av-icon-btn"
            onClick={zoomIn}
            aria-label="放大"
            title="放大"
          >
            +
          </button>
          <button
            className="av-icon-btn"
            onClick={resetView}
            aria-label="重置视图"
            title="重置"
          >
            ⟲
          </button>
          <button
            className="av-icon-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? '退出全屏' : '全屏查看'}
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="av-body">
        {/* 图片区域 */}
        <div
          ref={imageContainerRef}
          className={`av-image-area ${isDragging ? 'dragging' : ''}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <div
            className="av-image-wrapper"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
          >
            <img
              src={imageSrc}
              alt="风水分析图"
              className="av-image"
              onLoad={handleImageLoad}
              draggable={false}
            />

            {/* 标注层 */}
            {imageLoaded && showAnnotations && (
              <div className="av-annotation-layer">
                {visibleAnnotations.map((anno, idx) => {
                  const color = getSeverityColor(anno)
                  const isSelected = selectedId === anno.id
                  const isHovered = hoveredId === anno.id

                  return (
                    <div
                      key={anno.id}
                      className={`av-annotation-box ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                      style={{
                        left: `${anno.bbox.x * 100}%`,
                        top: `${anno.bbox.y * 100}%`,
                        width: `${anno.bbox.width * 100}%`,
                        height: `${anno.bbox.height * 100}%`,
                        borderColor: color,
                        backgroundColor: `${color}20`,
                        boxShadow: isSelected ? `0 0 0 2px ${color}, 0 0 20px ${color}80` : 'none',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAnnotationClick(anno.id)
                      }}
                      onMouseEnter={() => setHoveredId(anno.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      role="button"
                      tabIndex={0}
                      aria-label={`标注 ${idx + 1}: ${anno.label}`}
                    >
                      {/* 序号角标 */}
                      <span
                        className="av-anno-index"
                        style={{ backgroundColor: color }}
                      >
                        {idx + 1}
                      </span>

                      {/* 悬停浮层 */}
                      {isHovered && (
                        <div className="av-anno-tooltip" style={{ borderColor: color }}>
                          <div className="av-anno-tooltip-title" style={{ color }}>
                            {anno.label}
                          </div>
                          {anno.suggestion && (
                            <div className="av-anno-tooltip-desc">
                              {anno.suggestion}
                            </div>
                          )}
                          <div className="av-anno-tooltip-severity">
                            <span
                              className="av-anno-severity-dot"
                              style={{ backgroundColor: color }}
                            />
                            {SEVERITY_LABELS[anno.severity] || anno.severity}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 图片未加载占位 */}
          {!imageLoaded && (
            <div className="av-image-loading">加载中...</div>
          )}
        </div>

        {/* 问题列表 */}
        <div
          ref={issueListRef}
          className={`av-issue-list ${isFullscreen ? 'av-issue-list-floating' : ''}`}
        >
          <div className="av-issue-list-header">
            <span>问题列表</span>
            <span className="av-issue-count">{visibleAnnotations.length} 项</span>
          </div>
          <div className="av-issue-list-body">
            {visibleAnnotations.length === 0 ? (
              <div className="av-empty-state">
                暂无匹配的标注
              </div>
            ) : (
              visibleAnnotations.map((anno, idx) => {
                const color = getSeverityColor(anno)
                const isSelected = selectedId === anno.id

                return (
                  <div
                    key={anno.id}
                    ref={(el) => {
                      if (el) issueItemRefs.current.set(anno.id, el)
                    }}
                    className={`av-issue-item ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderLeftColor: color,
                      backgroundColor: isSelected ? `${color}10` : undefined,
                    }}
                    onClick={() => handleIssueClick(anno.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="av-issue-index" style={{ backgroundColor: color }}>
                      {idx + 1}
                    </div>
                    <div className="av-issue-content">
                      <div className="av-issue-title">{anno.label}</div>
                      {anno.suggestion && (
                        <div className="av-issue-desc">{anno.suggestion}</div>
                      )}
                      <div className="av-issue-meta">
                        <span
                          className="av-issue-severity"
                          style={{ color, borderColor: color }}
                        >
                          {SEVERITY_LABELS[anno.severity] || anno.severity}
                        </span>
                        <span className="av-issue-type">{anno.type}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
