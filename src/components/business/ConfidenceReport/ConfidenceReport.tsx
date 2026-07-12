/**
 * P8 Task-3: Confidence Report Component
 *
 * 展示可信度来源，不显示固定数字。
 * 展示5个维度的可信度分析：
 *   1. Rule 一致性
 *   2. Evidence 覆盖率
 *   3. Engine 共识
 *   4. Regression 命中
 *   5. Explain 完整度
 */
import { useState, useMemo } from 'react'
import type { GeJuResult } from '../../../lib/bazi/geju'
import type { XiYongShenResult } from '../../../lib/bazi/xiyongshen'
import type { DayMasterAnalysis } from '../../../lib/bazi/types'
import { buildConfidenceReport, type ConfidenceReport as ConfidenceReportData } from '../../../lib/bazi/qi/plugin/confidenceReportBuilder'
import './ConfidenceReport.css'

interface ConfidenceReportProps {
  geJu: GeJuResult | null
  xiYong: XiYongShenResult | null
  strength: DayMasterAnalysis | null
}

export function ConfidenceReport({ geJu, xiYong, strength }: ConfidenceReportProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null)

  const report: ConfidenceReportData = useMemo(() => {
    return buildConfidenceReport(geJu, xiYong, strength)
  }, [geJu, xiYong, strength])

  var avgScore = Math.round(
    (report.ruleConsistency + report.evidenceCoverage + report.engineConsensus +
     report.regressionHit + report.explainCompleteness) / 5
  )

  var levelColor = avgScore >= 70 ? '#3fb950' : avgScore >= 40 ? '#d29922' : '#d4443b'

  return (
    <div className="cr-container">
      <div className="cr-header">
        <h3 className="cr-title">可信度报告</h3>
        <p className="cr-subtitle">基于5维度证据分析，非固定数字</p>
      </div>

      {/* 总览 */}
      <div className="cr-overview" style={{ borderColor: levelColor }}>
        <div className="cr-overview-level" style={{ color: levelColor }}>
          {report.overallLevel}
        </div>
        <div className="cr-overview-desc">{report.overallDescription}</div>
        <div className="cr-overview-evidence">
          总证据数: <strong>{report.totalEvidenceCount}</strong> 条
        </div>
      </div>

      {/* 5 维度雷达图 */}
      <div className="cr-radar">
        <svg viewBox="0 0 200 200" className="cr-radar-svg">
          {/* 网格 */}
          {[20, 40, 60, 80, 100].map(function(r) {
            var pts = []
            for (var i = 0; i < 5; i++) {
              var angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
              var x = 100 + Math.cos(angle) * (r * 0.7)
              var y = 100 + Math.sin(angle) * (r * 0.7)
              pts.push(x.toFixed(1) + ',' + y.toFixed(1))
            }
            return <polygon key={r} points={pts.join(' ')} fill="none" stroke="#2a2a35" strokeWidth="0.5" />
          })}
          {/* 数据多边形 */}
          {function() {
            var vals = [report.ruleConsistency, report.evidenceCoverage, report.engineConsensus, report.regressionHit, report.explainCompleteness]
            var pts = []
            for (var i = 0; i < 5; i++) {
              var angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
              var x = 100 + Math.cos(angle) * (vals[i] * 0.7)
              var y = 100 + Math.sin(angle) * (vals[i] * 0.7)
              pts.push(x.toFixed(1) + ',' + y.toFixed(1))
            }
            return <polygon points={pts.join(' ')} fill={levelColor + '33'} stroke={levelColor} strokeWidth="2" />
          }()}
          {/* 标签 */}
          {['规则一致', 'Evidence', 'Engine共识', 'Regression', 'Explain'].map(function(label, i) {
            var angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
            var x = 100 + Math.cos(angle) * 85
            var y = 100 + Math.sin(angle) * 85
            return <text key={i} x={x} y={y} fill="#7a7880" fontSize="9" textAnchor="middle" dominantBaseline="middle">{label}</text>
          })}
        </svg>
      </div>

      {/* 5 个来源 */}
      <div className="cr-sources">
        {report.sources.map(function(src) {
          var isExpanded = expandedSource === src.key
          var srcColor = src.level === 'high' ? '#3fb950' : src.level === 'medium' ? '#d29922' : '#d4443b'
          return (
            <div key={src.key} className="cr-source" onClick={function() { setExpandedSource(isExpanded ? null : src.key) }}>
              <div className="cr-source-header">
                <div className="cr-source-label">{src.label}</div>
                <div className="cr-source-bar">
                  <div className="cr-source-bar-fill" style={{ width: src.score + '%', background: srcColor }} />
                </div>
                <div className="cr-source-score" style={{ color: srcColor }}>{src.score}</div>
                <div className="cr-source-expand">{isExpanded ? '▼' : '▶'}</div>
              </div>
              <div className="cr-source-desc">{src.description}</div>
              {isExpanded && (
                <div className="cr-source-details">
                  {src.details.map(function(d, i) {
                    return <div key={i} className="cr-detail-item">• {d}</div>
                  })}
                  <div className="cr-detail-evidence">证据数: {src.evidenceCount} 条</div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 建议 */}
      <div className="cr-recommendation">
        <div className="cr-rec-label">分析建议</div>
        <div className="cr-rec-text">{report.recommendation}</div>
      </div>
    </div>
  )
}
