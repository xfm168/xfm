import type { ProPatternSummary } from '../../types/proReport'
import Card from '../ui/Card/Card'
import ScoreBar from '../business/ScoreBar/ScoreBar'
import Badge from '../ui/Badge/Badge'
import './PatternCard.css'

/** PatternCard 的 Props 类型 */
interface PatternCardProps {
  pattern: ProPatternSummary
}

/**
 * PatternCard - 第二层：格局分析卡片
 *
 * 展示主格名称、成格评分、副格列表及格局描述。
 */
export default function PatternCard({ pattern }: PatternCardProps) {
  return (
    <Card variant="default" padding="sm">
      <div className="xr-pat">
        {/* 主格名称 */}
        <div className="xr-pat__main">
          <div className="xr-pat__main-label">主格</div>
          <div className="xr-pat__main-name">{pattern.mainPattern}</div>
        </div>

        {/* 成格评分 */}
        <div className="xr-pat__score">
          <ScoreBar score={pattern.formationScore} label="成格评分" showValue height={8} />
        </div>

        {/* 副格列表 */}
        {pattern.subPatterns.length > 0 && (
          <div className="xr-pat__sub">
            <div className="xr-pat__sub-label">副格</div>
            <div className="xr-pat__sub-list">
              {pattern.subPatterns.map((sp) => (
                <Badge key={sp} variant="default" size="sm">
                  {sp}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 格局描述 */}
        {pattern.description && (
          <div className="xr-pat__desc">{pattern.description}</div>
        )}
      </div>
    </Card>
  )
}
