import type { ProRiskItem, ProOpportunityItem, ProRecommendationItem } from '../../types/proReport'
import Card from '../ui/Card/Card'
import Badge from '../ui/Badge/Badge'
import Section from '../ui/Section/Section'
import './RiskAdviceCard.css'

/** RiskAdviceCard 的 Props 类型 */
interface RiskAdviceCardProps {
  risks: ProRiskItem[]
  opportunities: ProOpportunityItem[]
  recommendations: ProRecommendationItem[]
}

/** 风险等级映射到 CSS 类名 */
function getRiskLevelClass(level: string): string {
  const normalized = level.toLowerCase()
  if (normalized === 'high' || normalized === '高') return 'xr-ra__risk--high'
  if (normalized === 'medium' || normalized === '中') return 'xr-ra__risk--medium'
  return 'xr-ra__risk--low'
}

/** 风险等级映射到 Badge 变体 */
function getRiskBadgeVariant(level: string): 'error' | 'warning' | 'gold' {
  const normalized = level.toLowerCase()
  if (normalized === 'high' || normalized === '高') return 'error'
  if (normalized === 'medium' || normalized === '中') return 'warning'
  return 'gold'
}

/**
 * RiskAdviceCard - 第三层：风险与建议关联卡片
 *
 * 核心商业价值组件：风险列表（关联原因/建议/规避方法）、
 * 机会列表、分类建议列表。风险和建议关联展示不分开。
 */
export default function RiskAdviceCard({
  risks,
  opportunities,
  recommendations,
}: RiskAdviceCardProps) {
  return (
    <Card variant="default" padding="sm">
      <div className="xr-ra">
        {/* ── 风险列表 ── */}
        {risks.length > 0 && (
          <Section title="风险预警" subtitle="识别并化解潜在风险">
            <div className="xr-ra__risks">
              {risks.map((risk, i) => (
                <div key={i} className={`xr-ra__risk ${getRiskLevelClass(risk.level)}`}>
                  <div className="xr-ra__risk-header">
                    <Badge variant="default" size="sm">{risk.type}</Badge>
                    <Badge variant={getRiskBadgeVariant(risk.level)} size="sm">
                      {risk.level}
                    </Badge>
                  </div>
                  <div className="xr-ra__risk-reason">{risk.reason}</div>
                  {risk.suggestion && (
                    <div className="xr-ra__risk-suggestion">
                      <strong>建议：</strong>{risk.suggestion}
                    </div>
                  )}
                  {risk.avoidance && (
                    <div className="xr-ra__risk-avoidance">
                      <span className="xr-ra__risk-avoidance-label">规避方法：</span>
                      {risk.avoidance}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── 机会列表 ── */}
        {opportunities.length > 0 && (
          <Section title="潜在机会" subtitle="把握有利时机">
            <div className="xr-ra__opportunities">
              {opportunities.map((opp, i) => (
                <div key={i} className="xr-ra__opportunity">
                  <div className="xr-ra__opportunity-header">
                    <Badge variant="success" size="sm">{opp.type}</Badge>
                    {opp.timing && (
                      <Badge variant="default" size="sm">{opp.timing}</Badge>
                    )}
                  </div>
                  <div className="xr-ra__opportunity-reason">{opp.reason}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── 建议列表 ── */}
        {recommendations.length > 0 && (
          <Section title="综合建议" subtitle="基于命盘分析的个性化建议">
            <div className="xr-ra__recommendations">
              {recommendations.map((rec, i) => (
                <div key={i} className="xr-ra__recommendation">
                  <div className="xr-ra__recommendation-header">
                    <Badge variant="gold" size="sm">{rec.category}</Badge>
                    {rec.relatedElements.map((el) => (
                      <Badge key={el} variant="default" size="sm">{el}</Badge>
                    ))}
                  </div>
                  <div className="xr-ra__recommendation-content">{rec.content}</div>
                  {rec.reasoning && (
                    <div className="xr-ra__recommendation-reasoning">
                      依据：{rec.reasoning}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </Card>
  )
}
