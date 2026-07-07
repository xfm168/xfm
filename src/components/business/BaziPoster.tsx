/**
 * 命盘海报组件
 * V3.0 - 生成分享图片
 */
import { useRef } from 'react'
import html2canvas from 'html2canvas'
import type { BaZiChart } from '../lib/bazi'
import type { FiveElement } from '../lib/bazi'
import './BaziPoster.css'

interface BaziPosterProps {
  chart: BaZiChart
  onClose: () => void
}

const ELEMENT_COLORS: Record<FiveElement, string> = {
  木: '#4a9c6d',
  火: '#d4573a',
  土: '#c4956a',
  金: '#d4af37',
  水: '#4a7ab8',
}

export default function BaziPoster({ chart, onClose }: BaziPosterProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  const { sixLines, fiveElementCount, dayMaster, xiYongShen, overallScore, birthInfo } = chart
  const { year, month, day, hour } = sixLines
  const pillars = [
    { label: '年柱', ...year },
    { label: '月柱', ...month },
    { label: '日柱', ...day, isDay: true },
    { label: '时柱', ...hour },
  ]

  async function handleSave() {
    if (!posterRef.current) return
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `命盘_${birthInfo.birthDate}.png`
      a.click()
    } catch {
      // fallback
    }
  }

  async function handleShare() {
    if (!posterRef.current) return
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      })
      canvas.toBlob(async (blob) => {
        if (!blob) return
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], `命盘_${birthInfo.birthDate}.png`, { type: 'image/png' })
          try {
            await navigator.share({ files: [file], title: '玄风命理 · 命盘' })
          } catch {
            // 用户取消
          }
        } else {
          // 不支持 Web Share API，直接下载
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `命盘_${birthInfo.birthDate}.png`
          a.click()
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    } catch {
      // fallback
    }
  }

  return (
    <div className="poster-overlay" onClick={onClose}>
      <div className="poster-container" onClick={e => e.stopPropagation()}>
        <div className="poster-actions">
          <button className="poster-btn poster-btn--save" onClick={handleSave}>保存图片</button>
          <button className="poster-btn poster-btn--share" onClick={handleShare}>分享</button>
          <button className="poster-btn poster-btn--close" onClick={onClose}>关闭</button>
        </div>
        <div className="poster-card" ref={posterRef}>
          {/* 顶部装饰 */}
          <div className="poster-ornament-top">☯</div>

          {/* 标题 */}
          <h1 className="poster-title">玄风命理</h1>
          <p className="poster-subtitle">
            {birthInfo.birthDate} {birthInfo.birthTime} {birthInfo.gender === 'male' ? '男命' : '女命'}
          </p>

          {/* 评分 */}
          <div className="poster-score">
            <span className="poster-score-num">{overallScore}</span>
            <span className="poster-score-unit">分</span>
          </div>

          {/* 四柱 */}
          <div className="poster-pillars">
            {pillars.map(p => (
              <div key={p.label} className={`poster-pillar${(p as any).isDay ? ' poster-pillar--day' : ''}`}>
                <div className="poster-pillar-label">{p.label}</div>
                <div className="poster-pillar-gan">{p.gan}</div>
                <div className="poster-pillar-zhi">{p.zhi}</div>
                <div className="poster-pillar-el" style={{ color: ELEMENT_COLORS[p.element as FiveElement] }}>{p.element}</div>
              </div>
            ))}
          </div>

          {/* 五行分布 */}
          <div className="poster-wuxing">
            {(['木', '火', '土', '金', '水'] as FiveElement[]).map(el => {
              const count = fiveElementCount[el] || 0
              const pct = Math.min(count * 12, 100)
              return (
                <div key={el} className="poster-wuxing-item">
                  <span className="poster-wuxing-label" style={{ color: ELEMENT_COLORS[el] }}>{el}</span>
                  <div className="poster-wuxing-bar">
                    <div className="poster-wuxing-fill" style={{ width: `${pct}%`, backgroundColor: ELEMENT_COLORS[el] }} />
                  </div>
                  <span className="poster-wuxing-val">{count}</span>
                </div>
              )
            })}
          </div>

          {/* 关键指标 */}
          <div className="poster-info">
            <div className="poster-info-item">
              <span className="poster-info-label">日主</span>
              <span className="poster-info-value">{dayMaster.dayGan}（{dayMaster.dayGanElement}）</span>
            </div>
            <div className="poster-info-item">
              <span className="poster-info-label">旺衰</span>
              <span className="poster-info-value">{dayMaster.wangShuai}</span>
            </div>
            <div className="poster-info-item">
              <span className="poster-info-label">喜用</span>
              <span className="poster-info-value" style={{ color: ELEMENT_COLORS[xiYongShen.bestElement] }}>{xiYongShen.bestElement}</span>
            </div>
          </div>

          {/* 底部 */}
          <div className="poster-footer">
            <div className="poster-divider">◈ ◇ ◈</div>
            <p className="poster-brand">仅供娱乐参考 · 玄风命理 V3.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
