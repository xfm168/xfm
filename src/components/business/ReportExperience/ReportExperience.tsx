/**
 * P8 Task-2: Report Experience Component
 *
 * 重新设计分析报告，达到商业软件报告质量。
 * 13 项功能：
 *   ① 报告摘要  ② 命局总览  ③ 命理证据  ④ 推导过程
 *   ⑤ 最终结论  ⑥ 风险等级  ⑦ 调整建议  ⑧ 长期趋势
 *   ⑨ 时间轴    ⑩ PDF       ⑪ 分享卡片  ⑫ 收藏  ⑬ 打印版
 *
 * 所有内容引用 Evidence，禁止推演引擎自由发挥。
 */
import { useState, useRef, useMemo, type ReactNode } from 'react'
import type { GeJuResult } from '../../../lib/bazi/geju'
import type { XiYongShenResult } from '../../../lib/bazi/xiyongshen'
import type { DayMasterAnalysis } from '../../../lib/bazi/types'
import { ConfidenceReport } from '../ConfidenceReport/ConfidenceReport'
import './ReportExperience.css'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

export interface ReportData {
  // 基础命盘
  dayGan: string
  dayZhi: string
  monthGan: string
  monthZhi: string
  yearGan: string
  yearZhi: string
  hourGan: string
  hourZhi: string
  dayElement: string
  overallScore: number
  gender: string
  birthDate: string
  // 引擎结果
  geJu: GeJuResult | null
  xiYong: XiYongShenResult | null
  strength: DayMasterAnalysis | null
  // 扩展分析
  marriage?: any
  career?: any
  wealth?: any
  health?: any
  daYun?: any
  liuNian?: any
  fengshui?: any
  fullReport?: any
}

interface ReportExperienceProps {
  data: ReportData
  onSave?: () => void
  onShare?: () => void
}

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

function safe(v: any, fallback?: string): string {
  if (v == null) return fallback || ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}

function safeArr(v: any): string[] {
  if (Array.isArray(v)) return v
  if (v == null) return []
  return [String(v)]
}

// ═══════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════

export function ReportExperience({ data, onSave, onShare }: ReportExperienceProps) {
  const [activeSection, setActiveSection] = useState(0)
  const [saved, setSaved] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // 13 个功能区域
  const sections = [
    { key: 'summary', label: '报告摘要', icon: '①' },
    { key: 'overview', label: '命局总览', icon: '②' },
    { key: 'evidence', label: '命理证据', icon: '③' },
    { key: 'explain', label: '推导过程', icon: '④' },
    { key: 'conclusion', label: '最终结论', icon: '⑤' },
    { key: 'risk', label: '风险等级', icon: '⑥' },
    { key: 'advice', label: '调整建议', icon: '⑦' },
    { key: 'trend', label: '长期趋势', icon: '⑧' },
    { key: 'timeline', label: '时间轴', icon: '⑨' },
    { key: 'confidence', label: '可信度', icon: '★' },
  ]

  // ① 报告摘要
  var summary = useMemo(function() {
    var gejuName = safe(data.geJu?.name, '未定格局')
    var ws = safe(data.strength?.wangShuai, '未知')
    var ss = data.strength?.strengthScore ?? 0
    var yongShen = safe(data.xiYong?.bestElement, '未知')
    var xiShen = safe(data.xiYong?.firstHappy, '未知')
    var jiShen = safeArr(data.xiYong?.avoidedElements).join(', ')

    return {
      gejuName: gejuName,
      wangShuai: ws,
      strengthScore: ss,
      yongShen: yongShen,
      xiShen: xiShen,
      jiShen: jiShen,
      dayElement: data.dayElement,
      overallScore: data.overallScore,
    }
  }, [data])

  // ③ Evidence 收集
  var evidence = useMemo(function() {
    var items: { source: string; type: string; content: string }[] = []

    // 格局 evidence
    if (data.geJu) {
      var g = data.geJu as any
      if (g.reasons) {
        for (var i = 0; i < g.reasons.length; i++) {
          items.push({ source: '格局引擎', type: 'rule', content: g.reasons[i] })
        }
      }
      if (g.confidenceReason) {
        items.push({ source: '格局引擎', type: 'confidence', content: g.confidenceReason })
      }
      if (g.poGeReason) {
        items.push({ source: '格局引擎', type: 'warning', content: '破格因素: ' + g.poGeReason })
      }
      if (g.explain) {
        if (g.explain.whyMatched) items.push({ source: '格局引擎', type: 'explain', content: g.explain.whyMatched })
        if (g.explain.whyNotOthers) items.push({ source: '格局引擎', type: 'explain', content: '排除依据: ' + g.explain.whyNotOthers })
      }
    }

    // 喜用神 evidence
    if (data.xiYong) {
      var x = data.xiYong as any
      if (x.reasons) {
        for (var j = 0; j < x.reasons.length; j++) {
          items.push({ source: '喜用神引擎', type: 'rule', content: x.reasons[j] })
        }
      }
      if (x.derivationSteps) {
        for (var k = 0; k < x.derivationSteps.length; k++) {
          var step = x.derivationSteps[k]
          items.push({ source: '喜用神引擎', type: 'derivation', content: step.step + ': ' + step.result + ' (' + step.reason + ')' })
        }
      }
    }

    // 旺衰 evidence
    if (data.strength) {
      var s = data.strength as any
      if (s.reasons) {
        for (var l = 0; l < s.reasons.length; l++) {
          items.push({ source: '旺衰引擎', type: 'rule', content: s.reasons[l] })
        }
      }
      if (s.heHuaResults && s.heHuaResults.length > 0) {
        items.push({ source: '旺衰引擎', type: 'heHua', content: '合化分析: ' + s.heHuaResults.length + ' 组结果' })
      }
    }

    return items
  }, [data])

  // ⑥ 风险等级
  var risks = useMemo(function() {
    var items: { level: string; title: string; source: string }[] = []
    if (data.geJu && (data.geJu as any).poGeReason) {
      items.push({ level: 'high', title: (data.geJu as any).poGeReason, source: '格局引擎' })
    }
    if (data.marriage && data.marriage.risks) {
      for (var i = 0; i < data.marriage.risks.length; i++) {
        items.push({ level: 'medium', title: data.marriage.risks[i], source: '婚姻分析' })
      }
    }
    if (data.career && data.career.risks) {
      for (var j = 0; j < data.career.risks.length; j++) {
        items.push({ level: 'medium', title: data.career.risks[j], source: '事业分析' })
      }
    }
    if (data.wealth && data.wealth.riskYears) {
      for (var k = 0; k < data.wealth.riskYears.length; k++) {
        items.push({ level: 'low', title: data.wealth.riskYears[k], source: '财富分析' })
      }
    }
    if (data.health && data.health.diseaseRisks) {
      for (var l = 0; l < data.health.diseaseRisks.length; l++) {
        items.push({ level: 'medium', title: data.health.diseaseRisks[l], source: '健康分析' })
      }
    }
    return items
  }, [data])

  // ⑦ 调整建议
  var advices = useMemo(function() {
    var items: { category: string; content: string; source: string }[] = []
    if (data.xiYong) {
      items.push({ category: '五行调理', content: '喜用神: ' + safe(data.xiYong.bestElement) + '，宜多接触' + safe(data.xiYong.bestElement) + '属性事物', source: '喜用神引擎' })
      items.push({ category: '五行调理', content: '忌神: ' + safeArr(data.xiYong.avoidedElements).join(', ') + '，宜避免', source: '喜用神引擎' })
    }
    if (data.fengshui) {
      var f = data.fengshui
      if (f.luckyColors) items.push({ category: '颜色', content: '幸运色: ' + f.luckyColors.join(', '), source: '风水分析' })
      if (f.luckyNumbers) items.push({ category: '数字', content: '幸运数字: ' + f.luckyNumbers.join(', '), source: '风水分析' })
      if (f.directions) items.push({ category: '方位', content: '吉方位: ' + f.directions.join(', '), source: '风水分析' })
    }
    if (data.marriage && data.marriage.suggestions) {
      for (var i = 0; i < data.marriage.suggestions.length; i++) {
        items.push({ category: '婚姻', content: data.marriage.suggestions[i], source: '婚姻分析' })
      }
    }
    if (data.career && data.career.suggestions) {
      for (var j = 0; j < data.career.suggestions.length; j++) {
        items.push({ category: '事业', content: data.career.suggestions[j], source: '事业分析' })
      }
    }
    if (data.wealth && data.wealth.suggestions) {
      for (var k = 0; k < data.wealth.suggestions.length; k++) {
        items.push({ category: '财富', content: data.wealth.suggestions[k], source: '财富分析' })
      }
    }
    if (data.health) {
      if (data.health.dietSuggestions) {
        for (var l = 0; l < data.health.dietSuggestions.length; l++) {
          items.push({ category: '饮食', content: data.health.dietSuggestions[l].description || data.health.dietSuggestions[l], source: '健康分析' })
        }
      }
      if (data.health.exerciseSuggestions) {
        for (var m = 0; m < data.health.exerciseSuggestions.length; m++) {
          items.push({ category: '运动', content: data.health.exerciseSuggestions[m].description || data.health.exerciseSuggestions[m], source: '健康分析' })
        }
      }
    }
    return items
  }, [data])

  // ⑧ 长期趋势
  var trends = useMemo(function() {
    var items: { period: string; trend: string; score: number; source: string }[] = []
    if (data.daYun && data.daYun.steps) {
      for (var i = 0; i < data.daYun.steps.length; i++) {
        var step = data.daYun.steps[i]
        items.push({
          period: step.ganZhi || ('第' + (i + 1) + '步'),
          trend: step.summary || step.shenShi || '',
          score: step.score || 50,
          source: '大运引擎',
        })
      }
    }
    return items
  }, [data])

  // ⑨ 时间轴
  var timeline = useMemo(function() {
    var items: { year: string; event: string; type: string; source: string }[] = []
    if (data.liuNian && data.liuNian.years) {
      for (var i = 0; i < data.liuNian.years.length; i++) {
        var year = data.liuNian.years[i]
        var eventText = year.summary || ''
        if (year.yingQi && year.yingQi.length > 0) {
          eventText = year.yingQi.map(function(y: any) { return y.event || y.reason || '' }).filter(Boolean).join('; ')
        }
        if (eventText) {
          items.push({
            year: year.ganZhi || String(year.year || ''),
            event: eventText,
            type: year.summary ? 'normal' : 'yingqi',
            source: '流年引擎',
          })
        }
      }
    }
    return items
  }, [data])

  // ⑩ PDF 导出
  function handleExportPDF() {
    if (!printRef.current) return
    window.print()
  }

  // ⑪ 分享卡片
  function handleShareCard() {
    setShowShareCard(true)
  }

  // ⑫ 收藏
  function handleSave() {
    setSaved(true)
    if (onSave) onSave()
  }

  // ⑬ 打印版
  function handlePrint() {
    window.print()
  }

  // 渲染内容
  function renderSection(): ReactNode {
    switch (sections[activeSection].key) {
      case 'summary':
        return (
          <div className="re-section">
            <div className="re-summary-grid">
              <div className="re-summary-item">
                <div className="re-summary-label">日主</div>
                <div className="re-summary-value">{data.dayGan} ({data.dayElement})</div>
              </div>
              <div className="re-summary-item">
                <div className="re-summary-label">格局</div>
                <div className="re-summary-value">{summary.gejuName}</div>
                <div className="re-summary-source">来源: 格局引擎</div>
              </div>
              <div className="re-summary-item">
                <div className="re-summary-label">旺衰</div>
                <div className="re-summary-value">{summary.wangShuai} ({summary.strengthScore})</div>
                <div className="re-summary-source">来源: 旺衰引擎</div>
              </div>
              <div className="re-summary-item">
                <div className="re-summary-label">用神</div>
                <div className="re-summary-value">{summary.yongShen}</div>
                <div className="re-summary-source">来源: 喜用神引擎</div>
              </div>
              <div className="re-summary-item">
                <div className="re-summary-label">喜神</div>
                <div className="re-summary-value">{summary.xiShen}</div>
              </div>
              <div className="re-summary-item">
                <div className="re-summary-label">忌神</div>
                <div className="re-summary-value">{summary.jiShen}</div>
              </div>
            </div>
            <div className="re-summary-score">
              <div className="re-score-big">{summary.overallScore}</div>
              <div className="re-score-label">玄风综合指数</div>
            </div>
          </div>
        )

      case 'overview':
        return (
          <div className="re-section">
            <div className="re-pillars">
              {[
                { label: '年柱', gan: data.yearGan, zhi: data.yearZhi },
                { label: '月柱', gan: data.monthGan, zhi: data.monthZhi },
                { label: '日柱', gan: data.dayGan, zhi: data.dayZhi, highlight: true },
                { label: '时柱', gan: data.hourGan, zhi: data.hourZhi },
              ].map(function(p, i) {
                return (
                  <div key={i} className={'re-pillar' + (p.highlight ? ' re-pillar-highlight' : '')}>
                    <div className="re-pillar-label">{p.label}</div>
                    <div className="re-pillar-gan">{p.gan}</div>
                    <div className="re-pillar-zhi">{p.zhi}</div>
                  </div>
                )
              })}
            </div>
            <div className="re-evidence-note">数据来源: 命盘排盘引擎 (确定性输出)</div>
          </div>
        )

      case 'evidence':
        return (
          <div className="re-section">
            <div className="re-evidence-list">
              {evidence.map(function(e, i) {
                return (
                  <div key={i} className="re-evidence-item">
                    <div className="re-evidence-type" data-type={e.type}>{e.type}</div>
                    <div className="re-evidence-content">
                      <div className="re-evidence-text">{e.content}</div>
                      <div className="re-evidence-source">来源: {e.source}</div>
                    </div>
                  </div>
                )
              })}
              {evidence.length === 0 && <div className="re-empty">暂无结构化证据数据</div>}
            </div>
          </div>
        )

      case 'explain':
        return (
          <div className="re-section">
            <div className="re-explain-list">
              {data.xiYong && (data.xiYong as any).derivationSteps && (data.xiYong as any).derivationSteps.map(function(step: any, i: number) {
                return (
                  <div key={i} className="re-explain-step">
                    <div className="re-explain-num">{i + 1}</div>
                    <div className="re-explain-body">
                      <div className="re-explain-step-name">{step.step}</div>
                      <div className="re-explain-result">{step.result}</div>
                      <div className="re-explain-reason">依据: {step.reason}</div>
                    </div>
                  </div>
                )
              })}
              {(!data.xiYong || !(data.xiYong as any).derivationSteps || (data.xiYong as any).derivationSteps.length === 0) && (
                <div className="re-empty">暂无推导步骤数据</div>
              )}
            </div>
            <div className="re-evidence-note">推导链来源: 喜用神引擎五步推导 (调候→病药→格局→扶抑→通关)</div>
          </div>
        )

      case 'conclusion':
        return (
          <div className="re-section">
            <div className="re-conclusion">
              <div className="re-conclusion-item">
                <div className="re-conclusion-label">格局判定</div>
                <div className="re-conclusion-value">{summary.gejuName}</div>
                <div className="re-conclusion-evidence">依据: {safeArr(data.geJu?.reasons).length} 条规则证据</div>
              </div>
              <div className="re-conclusion-item">
                <div className="re-conclusion-label">旺衰判定</div>
                <div className="re-conclusion-value">{summary.wangShuai} (得分: {summary.strengthScore})</div>
                <div className="re-conclusion-evidence">依据: {safeArr(data.strength?.heHuaResults).length} 条合化证据，日主: {safe(data.strength?.dayGan)}{safe(data.strength?.dayGanElement)}</div>
              </div>
              <div className="re-conclusion-item">
                <div className="re-conclusion-label">用神判定</div>
                <div className="re-conclusion-value">{summary.yongShen}</div>
                <div className="re-conclusion-evidence">依据: {safeArr(data.xiYong?.reasons).length} 条规则证据, {(data.xiYong as any)?.derivationSteps?.length || 0} 步推导</div>
              </div>
              <div className="re-conclusion-item">
                <div className="re-conclusion-label">综合评分</div>
                <div className="re-conclusion-value">{summary.overallScore}</div>
                <div className="re-conclusion-evidence">来源: 综合评分引擎</div>
              </div>
            </div>
          </div>
        )

      case 'risk':
        return (
          <div className="re-section">
            <div className="re-risk-list">
              {risks.map(function(r, i) {
                var color = r.level === 'high' ? '#d4443b' : r.level === 'medium' ? '#d29922' : '#7a7880'
                return (
                  <div key={i} className="re-risk-item" style={{ borderLeftColor: color }}>
                    <div className="re-risk-level" style={{ color: color }}>
                      {r.level === 'high' ? '高风险' : r.level === 'medium' ? '中风险' : '低风险'}
                    </div>
                    <div className="re-risk-content">{r.title}</div>
                    <div className="re-risk-source">来源: {r.source}</div>
                  </div>
                )
              })}
              {risks.length === 0 && <div className="re-empty">未检测到显著风险因素</div>}
            </div>
          </div>
        )

      case 'advice':
        return (
          <div className="re-section">
            <div className="re-advice-list">
              {advices.map(function(a, i) {
                return (
                  <div key={i} className="re-advice-item">
                    <div className="re-advice-category">{a.category}</div>
                    <div className="re-advice-content">{a.content}</div>
                    <div className="re-advice-source">来源: {a.source}</div>
                  </div>
                )
              })}
              {advices.length === 0 && <div className="re-empty">暂无调整建议</div>}
            </div>
          </div>
        )

      case 'trend':
        return (
          <div className="re-section">
            <div className="re-trend-chart">
              {trends.map(function(t, i) {
                var color = t.score >= 60 ? '#3fb950' : t.score >= 40 ? '#d29922' : '#d4443b'
                return (
                  <div key={i} className="re-trend-bar">
                    <div className="re-trend-period">{t.period}</div>
                    <div className="re-trend-bar-container">
                      <div className="re-trend-bar-fill" style={{ height: t.score + '%', background: color }} />
                    </div>
                    <div className="re-trend-score" style={{ color: color }}>{t.score}</div>
                    <div className="re-trend-text">{t.trend.substring(0, 20)}</div>
                  </div>
                )
              })}
              {trends.length === 0 && <div className="re-empty">暂无大运趋势数据</div>}
            </div>
            <div className="re-evidence-note">趋势数据来源: 大运引擎 (确定性输出)</div>
          </div>
        )

      case 'timeline':
        return (
          <div className="re-section">
            <div className="re-timeline">
              {timeline.map(function(t, i) {
                return (
                  <div key={i} className="re-timeline-item">
                    <div className="re-timeline-dot" data-type={t.type}></div>
                    <div className="re-timeline-year">{t.year}</div>
                    <div className="re-timeline-event">{t.event}</div>
                    <div className="re-timeline-source">{t.source}</div>
                  </div>
                )
              })}
              {timeline.length === 0 && <div className="re-empty">暂无流年时间轴数据</div>}
            </div>
          </div>
        )

      case 'confidence':
        return (
          <div className="re-section">
            <ConfidenceReport geJu={data.geJu} xiYong={data.xiYong} strength={data.strength} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="re-container" ref={printRef}>
      {/* 报告头部 */}
      <div className="re-header">
        <div className="re-header-title">玄风命理分析报告</div>
        <div className="re-header-sub">{data.birthDate} {data.gender === 'male' ? '男命' : '女命'}</div>
      </div>

      {/* 操作工具栏 */}
      <div className="re-toolbar">
        <div className="re-toolbar-group">
          {sections.map(function(s, i) {
            return (
              <button
                key={s.key}
                className={'re-tab' + (activeSection === i ? ' re-tab-active' : '')}
                onClick={function() { setActiveSection(i) }}
              >
                <span className="re-tab-icon">{s.icon}</span>
                <span className="re-tab-label">{s.label}</span>
              </button>
            )
          })}
        </div>
        <div className="re-toolbar-actions">
          <button className="re-action-btn" onClick={handleExportPDF} title="导出PDF">⑩ PDF</button>
          <button className="re-action-btn" onClick={handleShareCard} title="分享卡片">⑪ 分享</button>
          <button className={'re-action-btn' + (saved ? ' re-action-saved' : '')} onClick={handleSave} title="收藏">
            {saved ? '⑫ 已收藏' : '⑫ 收藏'}
          </button>
          <button className="re-action-btn" onClick={handlePrint} title="打印">⑬ 打印</button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="re-content">
        {renderSection()}
      </div>

      {/* 分享卡片弹窗 */}
      {showShareCard && (
        <div className="re-share-overlay" onClick={function() { setShowShareCard(false) }}>
          <div className="re-share-card" onClick={function(e) { e.stopPropagation() }}>
            <div className="re-share-header">
              <div className="re-share-title">玄风命理</div>
              <div className="re-share-sub">{data.birthDate}</div>
            </div>
            <div className="re-share-score">
              <div className="re-share-score-num">{summary.overallScore}</div>
              <div className="re-share-score-label">玄风指数</div>
            </div>
            <div className="re-share-pillars">
              {data.yearGan}{data.yearZhi} {data.monthGan}{data.monthZhi} {data.dayGan}{data.dayZhi} {data.hourGan}{data.hourZhi}
            </div>
            <div className="re-share-info">
              <div>格局: {summary.gejuName}</div>
              <div>旺衰: {summary.wangShuai}</div>
              <div>用神: {summary.yongShen}</div>
            </div>
            <div className="re-share-footer">玄风门 · 传承东方智慧</div>
            <button className="re-share-close" onClick={function() { setShowShareCard(false) }}>关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}
