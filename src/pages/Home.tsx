import React, { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, Variants } from 'framer-motion'
import {
  Sparkles,
  Coins,
  Home,
  Calendar,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Gauge,
  ShieldCheck,
  Zap,
  Clock4,
  Compass,
  BadgeCheck,
  FileText,
  History,
} from 'lucide-react'
import CompassComponent from '../components/business/Compass/Compass'
import FeatureCard from '../components/business/FeatureCard/FeatureCard'
import { RELEASE_BANNER } from '../config/release'
import './Home.css'

var DailyFortuneCard = React.lazy(function () {
  return import('../components/business/DailyFortuneCard').then(function (m) {
    return { default: m.DailyFortuneCard }
  })
})
var TrialEntry = React.lazy(function () {
  return import('../components/business/TrialEntry').then(function (m) {
    return { default: m.TrialEntry }
  })
})
var FAQSection = React.lazy(function () {
  return import('../components/business/FAQSection').then(function (m) {
    return { default: m.FAQSection }
  })
})
var ValueProps = React.lazy(function () {
  return import('../components/business/ValueProps').then(function (m) {
    return { default: m.ValueProps }
  })
})

const featureCards = [
  {
    icon: 'sparkles' as const,
    name: '今日卦运',
    subtitle: '每日指引 · 趋吉避凶',
    path: '/daily',
    accent: '#d4a847',
  },
  {
    icon: 'calendar' as const,
    name: '八字命理',
    subtitle: '四柱排盘 · 喜用分析',
    path: '/bazi',
    accent: '#a084ff',
  },
  {
    icon: 'coins' as const,
    name: '六爻占卜',
    subtitle: '铜钱起课 · 洞察天机',
    path: '/liuyao',
    accent: '#f0c060',
  },
  {
    icon: 'home' as const,
    name: '风水堪测',
    subtitle: '观宅察势 · 调和宅气',
    path: '/fengshui',
    accent: '#78d4b8',
  },
  {
    icon: 'history' as const,
    name: '卦象记录',
    subtitle: '历史回溯 · 洞见演变',
    path: '/records',
    accent: '#f08888',
  },
]

const brandAdvantages = [
  {
    icon: Gauge,
    title: '专业精准',
    desc: '综合十二大传统风水流派，结合现代空间工学，层层推演、步步验证。',
  },
  {
    icon: ShieldCheck,
    title: '可信可靠',
    desc: '每条结论均有规则出处与置信度标识，拒绝模糊表述与主观臆断。',
  },
  {
    icon: Zap,
    title: '秒级出结果',
    desc: '自研推理引擎 + 多级缓存，平均 3-5 秒生成完整专业风水报告。',
  },
  {
    icon: Clock4,
    title: '持续精进',
    desc: '1200+ 规则库、400+ 经典判例，每双周知识库增量更新一次。',
  },
]

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
}

/* ═══════════════════════════════════════════════════════════
   金色粒子背景（Canvas 渲染，性能友好）
   ═══════════════════════════════════════════════════════════ */
function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    interface P {
      x: number
      y: number
      vx: number
      vy: number
      r: number
      a: number
      ta: number
    }
    const count = Math.max(22, Math.floor(window.innerWidth / 70))
    const W = () => canvas.clientWidth
    const H = () => canvas.clientHeight
    const parts: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.22,
      vy: -0.18 - Math.random() * 0.35,
      r: 0.6 + Math.random() * 2.2,
      a: Math.random() * 0.5 + 0.05,
      ta: 0.15 + Math.random() * 0.6,
    }))

    const tick = () => {
      if (!running) return
      ctx.clearRect(0, 0, W(), H())
      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        p.a += (p.ta - p.a) * 0.02
        if (p.y < -10 || p.x < -20 || p.x > W() + 20) {
          p.x = Math.random() * W()
          p.y = H() + 10
          p.vx = (Math.random() - 0.5) * 0.22
          p.vy = -0.18 - Math.random() * 0.35
          p.r = 0.6 + Math.random() * 2.2
          p.a = 0.05
          p.ta = 0.15 + Math.random() * 0.6
        }
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        grad.addColorStop(0, `rgba(244, 224, 168, ${p.a * 1.0})`)
        grad.addColorStop(0.4, `rgba(212, 168, 71, ${p.a * 0.5})`)
        grad.addColorStop(1, `rgba(212, 168, 71, 0)`)
        ctx.beginPath()
        ctx.fillStyle = grad
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.fillStyle = `rgba(255, 243, 210, ${Math.min(1, p.a * 1.8)})`
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="home-v2-particles" aria-hidden />
}

/* ═══════════════════════════════════════════════════════════
   八卦暗纹（SVG 背景图，无限滚动）
   ═══════════════════════════════════════════════════════════ */
function BaguaPattern() {
  return (
    <svg className="home-v2-bagua-pattern" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="baguaTile" x="0" y="0" width="220" height="220" patternUnits="userSpaceOnUse">
          <g opacity="0.05" fill="none" stroke="#d4a847" strokeWidth="1.2">
            <circle cx="110" cy="110" r="70" />
            <circle cx="110" cy="110" r="48" />
            <circle cx="110" cy="110" r="28" />
            <path
              d="M110 40
                 A70 70 0 0 1 180 110
                 A48 48 0 0 1 110 62
                 A28 28 0 0 0 82 110
                 A70 70 0 0 1 110 180
                 A70 70 0 0 1 40 110
                 A48 48 0 0 1 110 158
                 A28 28 0 0 0 138 110
                 A70 70 0 0 1 110 40 Z"
            />
            <line x1="110" y1="40" x2="110" y2="180" />
            <line x1="40" y1="110" x2="180" y2="110" />
            <line x1="57" y1="57" x2="163" y2="163" />
            <line x1="163" y1="57" x2="57" y2="163" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#baguaTile)" />
    </svg>
  )
}

export default function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    if (import.meta.env?.DEV) {
      console.log(RELEASE_BANNER)
    }
  }, [])

  const { scrollYProgress } = useScroll()
  const heroFade = useTransform(scrollYProgress, [0, 0.25], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.985])
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -30])

  const compassDuration = useMemo(() => 60, [])

  return (
    <div className="home-v2">
      {/* ═══════ 动态背景层 ═══════ */}
      <div className="home-v2-bg" aria-hidden>
        <BaguaPattern />
        <GoldParticles />
        {/* 流光层 */}
        <div className="home-v2-flow home-v2-flow-a" />
        <div className="home-v2-flow home-v2-flow-b" />
        {/* 远山剪影 */}
        <div className="home-v2-mountains" />
        {/* 顶部到中部的柔焦渐变 */}
        <div className="home-v2-vignette" />
      </div>

      {/* ═══════ HERO ═══════ */}
      <motion.section
        style={{ opacity: heroFade, scale: heroScale, y: heroY }}
        className="home-v2-hero"
      >
        <div className="home-v2-hero-inner">
          {/* 太极罗盘 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="home-v2-compass-wrap"
          >
            <div className="home-v2-compass-glow" aria-hidden />
            <div
              className="home-v2-compass-inner"
              style={{ ['--compass-rot' as any]: `${compassDuration}s` }}
            >
              <CompassComponent size={460} />
            </div>
          </motion.div>

          {/* 品牌标题 */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="home-v2-brand"
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              className="home-v2-brand-tag"
            >
              <Compass size={14} strokeWidth={1.8} />
              <span>观其势 · 察其形 · 明其理</span>
            </motion.div>
            <motion.h1 custom={1} variants={fadeUp} className="home-v2-brand-title">
              玄风门
            </motion.h1>
            <motion.p custom={2} variants={fadeUp} className="home-v2-brand-sub">
              专业风水分析平台 · 以传统风水学理论，为现代人居空间提供科学、可追溯、可执行的改善建议。
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="home-v2-cta-group">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => navigate('/fengshui')}
                className="home-v2-cta home-v2-cta-primary"
              >
                <span>立即勘测</span>
                <ArrowRight size={18} strokeWidth={1.8} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => navigate('/liuyao')}
                className="home-v2-cta home-v2-cta-ghost"
              >
                <Coins size={16} strokeWidth={1.8} />
                <span>试试六爻占卜</span>
              </motion.button>
            </motion.div>

            <motion.div custom={4} variants={fadeUp} className="home-v2-hero-meta">
              <div className="home-v2-meta-item">
                <BadgeCheck size={15} strokeWidth={1.8} />
                <span>1200+ 风水规则</span>
              </div>
              <div className="home-v2-meta-divider" />
              <div className="home-v2-meta-item">
                <FileText size={15} strokeWidth={1.8} />
                <span>12 大维度报告</span>
              </div>
              <div className="home-v2-meta-divider" />
              <div className="home-v2-meta-item">
                <BookOpen size={15} strokeWidth={1.8} />
                <span>400+ 经典案例</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* 向下滚动提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="home-v2-scroll-hint"
          aria-hidden
        >
          <span>向下滚动</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <ChevronDown size={18} strokeWidth={1.8} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ═══════ 功能入口卡片 Grid ═══════ */}
      <section className="home-v2-features">
        <div className="home-v2-container">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            custom={0}
            className="home-v2-section-head"
          >
            <span className="home-v2-section-kicker">核心功能</span>
            <h2 className="home-v2-section-title">五大入口 · 一应俱全</h2>
            <p className="home-v2-section-desc">
              从每日指引到深度勘测，玄风门为您提供完整的传统命理与风水分析工具链。
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="home-v2-features-grid"
          >
            {featureCards.map((card, i) => (
              <motion.div
                key={card.name}
                custom={i}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              >
                <FeatureCard
                  icon={card.icon as any}
                  title={card.name}
                  subtitle={card.subtitle}
                  path={card.path}
                  accentColor={card.accent}
                  className="home-v2-feature-card"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ 品牌介绍 / 四大优势 ═══════ */}
      <section className="home-v2-advantages">
        <div className="home-v2-container">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            custom={0}
            className="home-v2-section-head"
          >
            <span className="home-v2-section-kicker">为什么选择玄风门</span>
            <h2 className="home-v2-section-title">专业 · 透明 · 可追溯</h2>
            <p className="home-v2-section-desc">
              区别于玄学娱乐站点，玄风门坚持「规则可查、过程可溯、结果可证」的产品理念。
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="home-v2-advantages-grid"
          >
            {brandAdvantages.map((item, i) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  custom={i}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="home-v2-adv-card"
                >
                  <div className="home-v2-adv-icon">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>
                  <h3 className="home-v2-adv-title">{item.title}</h3>
                  <p className="home-v2-adv-desc">{item.desc}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════ 运营组件：今日卦运 / 试用入口 / 价值主张 / FAQ ═══════ */}
      <section className="home-v2-ops">
        <div className="home-v2-container home-v2-container-narrow">
          <React.Suspense fallback={null}>
            <DailyFortuneCard />
          </React.Suspense>
        </div>
      </section>
      <section className="home-v2-ops home-v2-ops-alt">
        <div className="home-v2-container home-v2-container-narrow">
          <React.Suspense fallback={null}>
            <TrialEntry />
          </React.Suspense>
        </div>
      </section>
      <section className="home-v2-ops">
        <div className="home-v2-container home-v2-container-narrow">
          <React.Suspense fallback={null}>
            <ValueProps />
          </React.Suspense>
        </div>
      </section>
      <section className="home-v2-ops home-v2-ops-alt">
        <div className="home-v2-container home-v2-container-narrow">
          <React.Suspense fallback={null}>
            <FAQSection />
          </React.Suspense>
        </div>
      </section>

      {/* ═══════ Slogan ═══════ */}
      <section className="home-v2-slogan">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="home-v2-slogan-inner"
        >
          <motion.div custom={0} variants={fadeUp} className="home-v2-slogan-divider">
            <span className="home-v2-slogan-line" />
            <YinYangInline />
            <span className="home-v2-slogan-line" />
          </motion.div>
          <motion.h2 custom={1} variants={fadeUp} className="home-v2-slogan-text">
            遇事不决，可问玄风
          </motion.h2>
          <motion.p custom={2} variants={fadeUp} className="home-v2-slogan-sub">
            观其势 · 察其形 · 明其理
          </motion.p>
          <motion.div custom={3} variants={fadeUp} className="home-v2-slogan-divider">
            <span className="home-v2-slogan-line" />
            <YinYangInline />
            <span className="home-v2-slogan-line" />
          </motion.div>
        </motion.div>
      </section>

      <div className="home-v2-bottom-space" aria-hidden />
    </div>
  )
}

function YinYangInline() {
  return (
    <svg
      className="home-v2-slogan-diamond"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a6 6 0 0 1 0 12 3 3 0 0 1 0-6 3 3 0 0 0 0-6z" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="12" cy="16.5" r="1" />
    </svg>
  )
}
