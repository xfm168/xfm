import type { ProXiYongSummary } from '../../types/proReport'
import Card from '../ui/Card/Card'
import Badge from '../ui/Badge/Badge'
import './XiYongCard.css'

/** XiYongCard 的 Props 类型 */
interface XiYongCardProps {
  xiYong: ProXiYongSummary
}

/** 五神配置：标签名 + Badge 变体 */
const GOD_CONFIG: Array<{
  key: keyof Pick<ProXiYongSummary, 'yongShen' | 'xiShen' | 'jiShen' | 'chouShen' | 'xianShen'>
  label: string
  variant: 'gold' | 'success' | 'error' | 'warning' | 'default'
}> = [
  { key: 'yongShen', label: '用神', variant: 'gold' },
  { key: 'xiShen', label: '喜神', variant: 'success' },
  { key: 'jiShen', label: '忌神', variant: 'error' },
  { key: 'chouShen', label: '仇神', variant: 'warning' },
  { key: 'xianShen', label: '闲神', variant: 'default' },
]

/**
 * XiYongCard - 第二层：喜用神分析卡片
 *
 * 展示日主强弱、五神列表（用神/喜神/忌神/仇神/闲神）
 * 及调理方向说明。
 */
export default function XiYongCard({ xiYong }: XiYongCardProps) {
  return (
    <Card variant="default" padding="sm">
      <div className="xr-xy">
        {/* 日主强弱 */}
        <div className="xr-xy__strength">
          <span className="xr-xy__strength-label">日主强弱</span>
          <Badge variant="gold">{xiYong.dayMasterStrength}</Badge>
        </div>

        {/* 五神列表 */}
        <div className="xr-xy__gods">
          {GOD_CONFIG.map((god) => {
            const value = xiYong[god.key]
            if (!value) return null
            return (
              <div key={god.key} className="xr-xy__god-row">
                <span className="xr-xy__god-label">{god.label}</span>
                <Badge variant={god.variant} size="md">
                  {value}
                </Badge>
              </div>
            )
          })}
        </div>

        {/* 调理方向 */}
        {xiYong.regulationDirection && (
          <div className="xr-xy__direction">
            <strong>调理方向：</strong>
            {xiYong.regulationDirection}
          </div>
        )}
      </div>
    </Card>
  )
}
