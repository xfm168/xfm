import { Link, useLocation } from 'react-router-dom'
import './ComingSoon.css'

const moduleNames: Record<string, { name: string; icon: string; desc: string }> = {
  '/daily':   { name: '今日卦运', icon: '☯', desc: '每日专属卦象，顺时而动，敬请期待' },
  '/liuyao':  { name: '六爻解卦', icon: '☰', desc: '摇卦起课，解析六爻玄机，敬请期待' },
  '/records': { name: '卦运记录', icon: '☷', desc: '历史卦运，追溯命理轨迹，敬请期待' },
}

export default function ComingSoon() {
  const { pathname } = useLocation()
  const mod = moduleNames[pathname] ?? { name: '功能开发中', icon: '☰', desc: '即将上线，敬请期待' }

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-card">
        <div className="cs-icon-wrap">
          <span className="cs-icon">{mod.icon}</span>
          <div className="cs-glow"></div>
        </div>
        <h1 className="cs-title">{mod.name}</h1>
        <p className="cs-desc">{mod.desc}</p>
        <div className="cs-divider">
          <span>◆</span>
        </div>
        <p className="cs-sub">玄风门正在精心打磨此功能</p>
        <Link to="/" className="cs-btn">返回首页</Link>
      </div>
    </div>
  )
}
