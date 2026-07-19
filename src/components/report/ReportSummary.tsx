import type { ProChartSummary, ProAnalysisSummary } from '../../types/proReport'
import Card from '../ui/Card/Card'
import Badge from '../ui/Badge/Badge'
import './ReportSummary.css'

/** ReportSummary 的 Props 类型 */
interface ReportSummaryProps {
  chart: ProChartSummary
  quickSummary: ProAnalysisSummary['quickSummary']
}

/**
 * ReportSummary - 第一层：30秒看懂的核心摘要
 *
 * 展示四柱（年/月/日/时柱干支）、命盘定位、一句话总结、
 * 人生定位、核心优势、主要风险及开发方向。
 */
export default function ReportSummary({ chart, quickSummary }: ReportSummaryProps) {
  const pillars: Array<{ label: string; gan: string; zhi: string; active: boolean }> = [
    { label: '年柱', gan: chart.yearPillar.gan, zhi: chart.yearPillar.zhi, active: false },
    { label: '月柱', gan: chart.monthPillar.gan, zhi: chart.monthPillar.zhi, active: false },
    { label: '日柱', gan: chart.dayPillar.gan, zhi: chart.dayPillar.zhi, active: true },
    { label: '时柱', gan: chart.hourPillar.gan, zhi: chart.hourPillar.zhi, active: false },
  ]

  return (
    <div className="xr-summary">
      {/* 四柱网格 */}
      <div className="xr-summary__pillars">
        {pillars.map((p) => (
          <div
            key={p.label}
            className={`xr-summary__pillar${p.active ? ' xr-summary__pillar--active' : ''}`}
          >
            <span className="xr-summary__pillar-label">{p.label}</span>
            <span className="xr-summary__pillar-gan">{p.gan}</span>
            <span className="xr-summary__pillar-zhi">{p.zhi}</span>
          </div>
        ))}
      </div>

      {/* 命盘定位标签 */}
      <div className="xr-summary__identity">
        <Badge variant="gold">{chart.dayMaster}</Badge>
        <span className="xr-summary__identity-text">{chart.dayMasterElement}</span>
        <Badge variant={chart.gender === '男' ? 'default' : 'default'}>{chart.gender + '命'}</Badge>
      </div>

      {/* 一句话总结 */}
      <Card variant="ghost" padding="sm">
        <p className="xr-summary__headline">{quickSummary.headline}</p>
      </Card>

      {/* 人生定位 */}
      <div className="xr-summary__positioning">{quickSummary.lifePositioning}</div>

      {/* 核心优势 */}
      <div className="xr-summary__strengths">
        <h4 className="xr-summary__section-title">核心优势</h4>
        {quickSummary.strengths.map((s, i) => (
          <div key={i} className="xr-summary__strength-item">
            <span className="xr-summary__strength-icon">{'\u2713'}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* 主要风险 */}
      <div className="xr-summary__risks">
        <h4 className="xr-summary__section-title">主要风险</h4>
        {quickSummary.risks.map((r, i) => (
          <div key={i} className="xr-summary__risk-item">
            <span className="xr-summary__risk-icon">{'\u26A0'}</span>
            <span>{r}</span>
          </div>
        ))}
      </div>

      {/* 开发方向 */}
      {quickSummary.developmentDirection && (
        <div className="xr-summary__direction">
          <strong>开发方向：</strong>
          {quickSummary.developmentDirection}
        </div>
      )}
    </div>
  )
}
