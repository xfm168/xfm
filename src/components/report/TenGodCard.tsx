import type { ProTenGodSummary } from '../../types/proReport'
import Card from '../ui/Card/Card'
import Badge from '../ui/Badge/Badge'
import './TenGodCard.css'

/** TenGodCard 的 Props 类型 */
interface TenGodCardProps {
  tenGod: ProTenGodSummary
}

/**
 * TenGodCard - 第二层：十神分析卡片
 *
 * 展示主要十神列表（Badge 形式）及十神结构描述。
 */
export default function TenGodCard({ tenGod }: TenGodCardProps) {
  return (
    <Card variant="default" padding="sm">
      <div className="xr-tg">
        {/* 主要十神列表 */}
        {tenGod.dominantGods.length > 0 && (
          <div className="xr-tg__list">
            {tenGod.dominantGods.map((god) => (
              <Badge key={god} variant="gold" size="md">
                {god}
              </Badge>
            ))}
          </div>
        )}

        {/* 十神结构描述 */}
        {tenGod.structure && (
          <div className="xr-tg__structure">{tenGod.structure}</div>
        )}
      </div>
    </Card>
  )
}
