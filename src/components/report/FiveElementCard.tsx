import type { ProAnalysisSummary, ProDimensionItem } from '../../types/proReport'
import Card from '../ui/Card/Card'
import ScoreBar from '../business/ScoreBar/ScoreBar'
import Badge from '../ui/Badge/Badge'
import './FiveElementCard.css'

/** FiveElementCard 的 Props 类型 */
interface FiveElementCardProps {
  dimensions: ProAnalysisSummary['fiveDimensions']
}

/** 维度标签映射 */
const DIMENSION_LABELS: Record<string, string> = {
  career: '事业运',
  wealth: '财富运',
  marriage: '婚姻运',
  health: '健康运',
  study: '学业运',
}

/**
 * FiveElementCard - 第二层：五行分析卡片
 *
 * 展示五维评分（事业/财富/婚姻/健康/学业）的分数条和等级，
 * 以及综合总分。
 */
export default function FiveElementCard({ dimensions }: FiveElementCardProps) {
  const entries: Array<[string, ProDimensionItem]> = [
    ['career', dimensions.career],
    ['wealth', dimensions.wealth],
    ['marriage', dimensions.marriage],
    ['health', dimensions.health],
    ['study', dimensions.study],
  ]

  return (
    <Card variant="default" padding="sm">
      <div className="xr-fe">
        {/* 五维评分 */}
        <div className="xr-fe__dimensions">
          {entries.map(([key, dim]) => (
            <div key={key} className="xr-fe__dimension">
              <div className="xr-fe__dimension-header">
                <span className="xr-fe__dimension-label">
                  {DIMENSION_LABELS[key] ?? key}
                </span>
                <div className="xr-fe__dimension-meta">
                  <Badge variant="default" size="sm">{dim.level}</Badge>
                </div>
              </div>
              <ScoreBar score={dim.score} showValue height={8} />
            </div>
          ))}
        </div>

        {/* 总分 */}
        <div className="xr-fe__total">
          <span className="xr-fe__total-label">综合评分</span>
          <span className="xr-fe__total-score">{dimensions.overall}</span>
        </div>
      </div>
    </Card>
  )
}
