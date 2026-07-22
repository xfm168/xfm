import React, { CSSProperties, useEffect } from 'react'
import Compass from '../components/business/Compass/Compass'
import FeatureCard from '../components/business/FeatureCard/FeatureCard'
import { RELEASE_BANNER } from '../config/release'
import './Home.css'

var DailyFortuneCard = React.lazy(function() { return import('../components/business/DailyFortuneCard').then(function(m) { return { default: m.DailyFortuneCard } }) })
var TrialEntry = React.lazy(function() { return import('../components/business/TrialEntry').then(function(m) { return { default: m.TrialEntry } }) })
var FAQSection = React.lazy(function() { return import('../components/business/FAQSection').then(function(m) { return { default: m.FAQSection } }) })
var ValueProps = React.lazy(function() { return import('../components/business/ValueProps').then(function(m) { return { default: m.ValueProps } }) })

const featureCards = [
  {
    icon: 'bagua' as const,
    name: '今日卦运',
    subtitle: '每日指引 · 趋吉避凶',
    path: '/daily',
  },
  {
    icon: 'bazi' as const,
    name: '八字命理',
    subtitle: '四柱排盘 · 喜用分析',
    path: '/bazi',
  },
  {
    icon: 'coins' as const,
    name: '六爻占卜',
    subtitle: '铜钱起课 · 洞察天机',
    path: '/liuyao',
  },
  {
    icon: 'house' as const,
    name: '风水堪测',
    subtitle: '观宅察势 · 调和宅气',
    path: '/fengshui',
  },
]

export default function Home() {
  // Print release banner in development mode only
  useEffect(() => {
    if (import.meta.env?.DEV) {
      console.log(RELEASE_BANNER)
    }
  }, [])

  return (
    <div className="home">

      {/* 远山薄雾背景层 */}
      <div className="bg-layer">
        <div className="bg-fog"></div>
        <div className="bg-mountain"></div>
        <div className="bg-mist"></div>
      </div>

      {/* 主视觉区域 */}
      <section className="hero">

        {/* 太极八卦核心 */}
        <div className="taiji-wrap">
          <div className="taiji-glow"></div>
          <div className="taiji-compass">
            <Compass size={480} />
          </div>
        </div>

        {/* 品牌标题 */}
        <div className="brand-section">
          <h1 className="brand-title">玄风门</h1>
          <div className="brand-tagline">
            <p>天地有象，万事有机</p>
            <p>知其势者，顺势而行</p>
          </div>
        </div>
      </section>

      {/* 功能入口 */}
      <section className="features-section">
        <div className="features-grid">
          {featureCards.map((card, i) => (
            <FeatureCard
              key={card.name}
              icon={card.icon}
              title={card.name}
              subtitle={card.subtitle}
              path={card.path}
              className="home-feature-card"
              style={{ animationDelay: `${i * 0.15}s` } as CSSProperties}
            />
          ))}
        </div>
      </section>

      {/* V1.2 运营组件 */}
      <section className="v12-ops-section">
        <React.Suspense fallback={null}>
          <DailyFortuneCard />
        </React.Suspense>
      </section>

      <section className="v12-trial-section">
        <React.Suspense fallback={null}>
          <TrialEntry />
        </React.Suspense>
      </section>

      <section className="v12-value-section">
        <React.Suspense fallback={null}>
          <ValueProps />
        </React.Suspense>
      </section>

      <section className="v12-faq-section">
        <React.Suspense fallback={null}>
          <FAQSection />
        </React.Suspense>
      </section>

      {/* 品牌语 */}
      <section className="slogan-section">
        <div className="slogan-inner">
          <div className="slogan-divider">
            <span className="divider-line"></span>
            <span className="divider-diamond">◆</span>
            <span className="divider-line"></span>
          </div>
          <h2 className="slogan-text">遇事不决，可问玄风</h2>
          <div className="slogan-divider">
            <span className="divider-line"></span>
            <span className="divider-diamond">◆</span>
            <span className="divider-line"></span>
          </div>
        </div>
      </section>

      {/* 底部留白 */}
      <div className="bottom-space"></div>
    </div>
  )
}
