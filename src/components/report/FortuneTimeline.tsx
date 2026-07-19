import type { ProTimelineStage } from '../../types/proReport'
import Card from '../ui/Card/Card'
import './FortuneTimeline.css'

/** FortuneTimeline 的 Props 类型 */
interface FortuneTimelineProps {
  timeline: ProTimelineStage[]
}

/**
 * FortuneTimeline - 第三层：大运流年时间轴
 *
 * 竖向时间轴展示人生各阶段的运势、喜用影响及关键事件。
 * 左侧竖线 + 圆点 + 内容区域，移动端友好。
 */
export default function FortuneTimeline({ timeline }: FortuneTimelineProps) {
  if (timeline.length === 0) return null

  return (
    <Card variant="default" padding="sm">
      <div className="xr-ft">
        <div className="xr-ft__list">
          {timeline.map((stage, index) => (
            <div key={`${stage.stage}-${index}`} className="xr-ft__stage">
              {/* 圆点 */}
              <div className="xr-ft__dot" />

              {/* 头部：阶段名 + 年龄段 */}
              <div className="xr-ft__header">
                <span className="xr-ft__stage-name">{stage.stage}</span>
                <span className="xr-ft__age-range">{stage.ageRange}</span>
              </div>

              {/* 摘要 */}
              <div className="xr-ft__summary">{stage.summary}</div>

              {/* 大运/流年影响 */}
              {(stage.fortuneInfluence || stage.xiYongInfluence) && (
                <div className="xr-ft__influence">
                  {stage.fortuneInfluence && (
                    <p>大运影响：{stage.fortuneInfluence}</p>
                  )}
                  {stage.xiYongInfluence && (
                    <p>喜用影响：{stage.xiYongInfluence}</p>
                  )}
                </div>
              )}

              {/* 关键事件 */}
              {stage.keyEvents.length > 0 && (
                <div className="xr-ft__events">
                  {stage.keyEvents.map((event, ei) => (
                    <div key={ei} className="xr-ft__event">
                      {event}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
