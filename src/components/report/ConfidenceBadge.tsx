import type { ProConfidenceSummary, ProTraceSummary } from '../../types/proReport'
import Card from '../ui/Card/Card'
import Badge from '../ui/Badge/Badge'
import ScoreBar from '../business/ScoreBar/ScoreBar'
import './ConfidenceBadge.css'

/** ConfidenceBadge 的 Props 类型 */
interface ConfidenceBadgeProps {
  confidence: ProConfidenceSummary
  trace: ProTraceSummary
  onShowTrace?: () => void
}

/**
 * ConfidenceBadge - 置信度展示组件
 *
 * 展示报告置信度总览（交叉验证状态、总体置信度百分比）、
 * 警告列表及可展开的 TraceChain 入口。
 * 适合放在报告底部。
 */
export default function ConfidenceBadge({
  confidence,
  trace,
  onShowTrace,
}: ConfidenceBadgeProps) {
  return (
    <Card variant="default" padding="sm">
      <div className="xr-cf">
        {/* 总览区域 */}
        <div className="xr-cf__overview">
          <div
            className={`xr-cf__status${
              confidence.crossValidationPassed ? ' xr-cf__status--passed' : ' xr-cf__status--failed'
            }`}
          >
            <Badge
              variant={confidence.crossValidationPassed ? 'success' : 'error'}
              size="sm"
            >
              {confidence.crossValidationPassed ? '交叉验证通过' : '交叉验证未通过'}
            </Badge>
            {confidence.supportingModules.length > 0 && (
              <span>({confidence.supportingModules.length} 个模块支持)</span>
            )}
          </div>
        </div>

        {/* 置信度百分比 + 进度条 */}
        <div className="xr-cf__percentage">
          {Math.round(confidence.overallConfidence)}%
        </div>
        <div className="xr-cf__percentage-label">总体置信度</div>
        <div className="xr-cf__bar">
          <ScoreBar
            score={confidence.overallConfidence}
            showValue={false}
            height={6}
          />
        </div>

        {/* 警告列表 */}
        {confidence.warnings.length > 0 && (
          <div className="xr-cf__warnings">
            <div className="xr-cf__warnings-title">
              警告 ({confidence.warnings.length})
            </div>
            {confidence.warnings.map((w, i) => (
              <div key={i} className="xr-cf__warning">
                {w}
              </div>
            ))}
          </div>
        )}

        {/* 矛盾列表 */}
        {confidence.contradictions.length > 0 && (
          <div className="xr-cf__warnings">
            <div className="xr-cf__warnings-title">
              矛盾 ({confidence.contradictions.length})
            </div>
            {confidence.contradictions.map((c, i) => (
              <div key={i} className="xr-cf__warning">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* TraceChain 入口 */}
        <div className="xr-cf__trace">
          <button
            type="button"
            className="xr-cf__trace-btn"
            onClick={onShowTrace}
          >
            查看执行追踪
            <span className="xr-cf__trace-steps">
              ({trace.totalSteps} 步 / {trace.modules.length} 模块)
            </span>
          </button>
        </div>
      </div>
    </Card>
  )
}
