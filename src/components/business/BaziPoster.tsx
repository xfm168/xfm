/**
 * 命盘海报组件
 * V4.0 - 增强版：格局/日主/喜用神/二维码
 */
import { useRef } from 'react'
import html2canvas from 'html2canvas'
import type { BaZiChart, FiveElement } from '../../lib/bazi'
import { ELEMENT_COLORS } from '../../lib/bazi'
import './BaziPoster.css'

interface BaziPosterProps {
  chart: BaZiChart
  onClose: () => void
  geJu?: string          // 格局名称，如"正官格"
  dayMaster?: string     // 日主描述，如"日元 丙火"
  xiYongShen?: string    // 喜用神描述，如"喜用：木水"
  fiveElementCount?: { [key: string]: number }  // 五行计数（已有，兼容）
}

export default function BaziPoster({
  chart,
  onClose,
  geJu,
  dayMaster: dayMasterDesc,
  xiYongShen: xiYongShenDesc,
}: BaziPosterProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  const { sixLines, fiveElementCount, dayMaster, xiYongShen, overallScore, birthInfo } = chart
  const { year, month, day, hour } = sixLines
  const pillars = [
    { label: '年柱', ...year },
    { label: '月柱', ...month },
    { label: '日柱', ...day, isDay: true },
    { label: '时柱', ...hour },
  ]

  // 日主描述：优先用传入的 prop，否则从 chart 内部生成
  const dayMasterText = dayMasterDesc || `${dayMaster.dayGan}${dayMaster.dayGanElement}`
  // 喜用神描述：优先用传入的 prop，否则从 chart 内部生成
  const xiYongShenText = xiYongShenDesc || `喜 ${xiYongShen.happiness} 用 ${xiYongShen.usage}`

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

          {/* 关键指标（增强版） */}
          <div className="poster-info poster-info--enhanced">
            <div className="poster-info-item">
              <span className="poster-info-label">日主</span>
              <span className="poster-info-value">{dayMasterText}</span>
            </div>
            <div className="poster-info-item">
              <span className="poster-info-label">旺衰</span>
              <span className="poster-info-value">{dayMaster.wangShuai}</span>
            </div>
            {geJu && (
              <div className="poster-info-item">
                <span className="poster-info-label">格局</span>
                <span className="poster-info-value poster-info-value--geju">{geJu}</span>
              </div>
            )}
            <div className="poster-info-item">
              <span className="poster-info-label">喜用</span>
              <span className="poster-info-value" style={{ color: ELEMENT_COLORS[xiYongShen.bestElement] }}>{xiYongShenText}</span>
            </div>
          </div>

          {/* 分隔 */}
          <div className="poster-divider" style={{ margin: '12px 0' }}>◈ ◇ ◈</div>

          {/* 二维码占位区域 */}
          <div className="poster-qrcode-section">
            <div className="poster-qrcode-box">
              <div className="poster-qrcode-placeholder">
                <span className="poster-qrcode-icon">I</span>
              </div>
              <p className="poster-qrcode-text">扫码查看完整命盘</p>
            </div>
          </div>

          {/* 底部 */}
          <div className="poster-footer">
            <div className="poster-divider">◈ ◇ ◈</div>
            <p className="poster-brand">仅供娱乐参考 · 玄风命理 V4.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
