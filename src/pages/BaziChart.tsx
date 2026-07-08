import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle, Card, Badge, Button, Loading } from '../components/ui'
import { ScoreRing, ScoreBar } from '../components/business'
import { useBazi } from '../hooks/useBazi'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
import BaziPoster from '../components/business/BaziPoster'
import {
  calculateBaZiFromBirthData, type FiveElement, type BaZiAnalysis, type BaZiChart,
  determineGeJu, type GeJuResult, calculateShenSha, type ShenShaCategory,
  analyzeShenShi, type ShenShiAnalysisResult, calculateFiveElementPower,
  analyzeDaYun, analyzeLiuNian, analyzeLiuYue,
  analyzeMarriage, type MarriageAnalysisResult,
  analyzeCareer, type CareerAnalysisResult,
  analyzeWealth, type WealthAnalysisResult,
  analyzeHealth, type HealthAnalysisResult,
  analyzeFengShui, type FengShuiAnalysisResult,
  generateFullReport, type FullReportResult,
  type FiveElementPowerResult,
  exportMarkdown, exportWord, exportPdf,
  ELEMENT_COLORS,
} from '../lib/bazi'
import { DEFAULT_BAZI_ANALYSIS } from '../constants/defaultAnalysis'
import type { BirthData } from '@/lib/core'
import './BaziChart.css'

type TabKey = 'overview' | 'wuxing' | 'shenshi' | 'wangshuai' | 'geju' | 'shensha' | 'xiyong' | 'dayun' | 'liunian' | 'liuyue' | 'marriage' | 'career' | 'wealth' | 'health' | 'fengshui' | 'analysis'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '命盘' },
  { key: 'wuxing', label: '五行' },
  { key: 'shenshi', label: '十神' },
  { key: 'wangshuai', label: '旺衰' },
  { key: 'geju', label: '格局' },
  { key: 'shensha', label: '神煞' },
  { key: 'xiyong', label: '喜用神' },
  { key: 'dayun', label: '大运' },
  { key: 'liunian', label: '流年' },
  { key: 'liuyue', label: '流月' },
  { key: 'marriage', label: '婚姻' },
  { key: 'career', label: '事业' },
  { key: 'wealth', label: '财富' },
  { key: 'health', label: '健康' },
  { key: 'fengshui', label: '风水' },
  { key: 'analysis', label: '解析' },
]

function getRadarPoints(scale: number): string {
  const points: string[] = []
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90) * Math.PI / 180
    const x = 100 + 80 * scale * Math.cos(angle)
    const y = 100 + 80 * scale * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

function getRadarDataPoints(power: { elements: { element: FiveElement; percentage: number }[] }): string {
  const order: FiveElement[] = ['木', '火', '土', '金', '水']
  const points: string[] = []
  for (let i = 0; i < 5; i++) {
    const el = order[i]
    const detail = power.elements.find(e => e.element === el)
    const pct = detail ? detail.percentage / 100 : 0
    const scale = Math.min(pct * 2, 1)
    const angle = (i * 72 - 90) * Math.PI / 180
    const x = 100 + 80 * scale * Math.cos(angle)
    const y = 100 + 80 * scale * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}

export default function BaziChart() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const { saveChart, charts } = useBazi()

  const birthData = (location.state as { birthData?: BirthData } | null)?.birthData

  const [chart, setChart] = useState(() => {
    if (birthData) {
      const result = calculateBaZiFromBirthData(birthData)
      return result
    }
    if (charts.length > 0) {
      return charts[0]
    }
    return null
  })

  const [saved, setSaved] = useState(false)
  const [compareTarget, setCompareTarget] = useState<BaZiChart | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showPoster, setShowPoster] = useState(false)
  const [expandedDayun, setExpandedDayun] = useState<number | null>(null)
  const [expandedLiunian, setExpandedLiunian] = useState<number | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(() => new Set([0, 1, 2]))
  const [expandedLiuyue, setExpandedLiuyue] = useState<number | null>(null)
  const [liuYueYear, setLiuYueYear] = useState(() => new Date().getFullYear())

  // 分步 Loading 状态
  const [loadingStep, setLoadingStep] = useState(0)
  const [analysisReady, setAnalysisReady] = useState(false)
  const analysisRef = useRef<Partial<{
    geJu: GeJuResult
    shenSha: ShenShaCategory[]
    shenShiAnalysis: ShenShiAnalysisResult
    fiveElementPower: FiveElementPowerResult
    daYun: ReturnType<typeof analyzeDaYun>
    liuNian: ReturnType<typeof analyzeLiuNian>
    liuYue: ReturnType<typeof analyzeLiuYue>
    marriage: MarriageAnalysisResult
    career: CareerAnalysisResult
    wealth: WealthAnalysisResult
    health: HealthAnalysisResult
    fengshui: FengShuiAnalysisResult
    fullReport: FullReportResult
  }>>({})

  useEffect(() => {
    if (!chart && charts.length > 0) {
      setChart(charts[0])
    }
  }, [charts])

  // 分步 Loading：将所有同步计算拆分为异步步骤，避免白屏
  useEffect(() => {
    if (!chart || analysisReady) return undefined

    const timeoutIds: ReturnType<typeof setTimeout>[] = []
    const { sixLines, fiveElementCount, dayMaster, xiYongShen, birthInfo: chartBirth } = chart
    const birthDate = new Date(`${chartBirth.birthDate}T${chartBirth.birthTime}`)
    const currentYear = new Date().getFullYear()

    const steps = [
      () => { setLoadingStep(1) },
      () => {
        const g = determineGeJu(sixLines, dayMaster.relatedShens, dayMaster.strengthScore, dayMaster.dayGan, sixLines.month.zhi, fiveElementCount)
        const s = calculateShenSha(sixLines, dayMaster.dayGan, chartBirth.gender)
        analysisRef.current = { ...analysisRef.current, geJu: g, shenSha: s }
        setLoadingStep(2)
      },
      () => {
        const ss = analyzeShenShi(sixLines, dayMaster.dayGan, chartBirth.gender)
        const fe = calculateFiveElementPower(sixLines, dayMaster.dayGan)
        analysisRef.current = { ...analysisRef.current, shenShiAnalysis: ss, fiveElementPower: fe }
        setLoadingStep(3)
      },
      () => {
        const dy = analyzeDaYun(sixLines, birthDate, dayMaster.dayGan, chartBirth.gender, [xiYongShen.bestElement], xiYongShen.avoidedElements)
        const ln = analyzeLiuNian(sixLines, dayMaster.dayGan, currentYear, 100)
        analysisRef.current = { ...analysisRef.current, daYun: dy, liuNian: ln }
        setLoadingStep(4)
      },
      () => {
        const ly = analyzeLiuYue(sixLines, dayMaster.dayGan, currentYear)
        analysisRef.current = { ...analysisRef.current, liuYue: ly }
        setLoadingStep(5)
      },
      () => {
        const m = analyzeMarriage(sixLines, dayMaster.dayGan, chartBirth.gender)
        const c = analyzeCareer(sixLines, dayMaster.dayGan, chartBirth.gender, analysisRef.current.shenShiAnalysis!, analysisRef.current.geJu!, analysisRef.current.fiveElementPower!)
        analysisRef.current = { ...analysisRef.current, marriage: m, career: c }
        setLoadingStep(6)
      },
      () => {
        const w = analyzeWealth(sixLines, dayMaster.dayGan, analysisRef.current!.shenShiAnalysis, analysisRef.current!.liuNian, analysisRef.current!.geJu)
        const h = analyzeHealth(sixLines, dayMaster.dayGan, analysisRef.current!.fiveElementPower)
        const f = analyzeFengShui(sixLines, dayMaster.dayGan, xiYongShen, analysisRef.current!.fiveElementPower, analysisRef.current!.shenShiAnalysis.details[0]?.name || '')
        analysisRef.current = { ...analysisRef.current, wealth: w, health: h, fengshui: f }
        setLoadingStep(7)
      },
      () => {
        const cur = analysisRef.current!
        const r = generateFullReport({
          chart, sixLines, dayMaster,
          geJu: cur.geJu,
          wangShuai: {
            wangShuai: dayMaster.wangShuai,
            strengthScore: dayMaster.strengthScore,
            deLing: ['旺', '相'].includes(dayMaster.wangShuai),
            deDi: dayMaster.strengthScore >= 50,
            deShi: dayMaster.strengthScore >= 60,
            tongGen: dayMaster.strengthScore >= 40,
            yueLing: sixLines.month.zhi,
            bestElement: xiYongShen.bestElement,
            avoidedElements: xiYongShen.avoidedElements,
            level: dayMaster.wangShuai,
          },
          shenShiAnalysis: cur.shenShiAnalysis,
          fiveElementPower: cur.fiveElementPower,
          shenSha: cur.shenSha,
          xiYongShen: { bestElement: xiYongShen.bestElement, avoidedElements: xiYongShen.avoidedElements },
          marriage: cur.marriage,
          career: cur.career,
          wealth: cur.wealth,
          health: cur.health,
          fengshui: cur.fengshui,
          daYun: cur.daYun,
          liuNian: cur.liuNian,
          liuYue: cur.liuYue,
        })
        analysisRef.current = { ...cur, fullReport: r }
        setLoadingStep(8)
      },
      () => {
        setAnalysisReady(true)
      },
    ]

    const DELAY = 180
    let delay = 50
    for (const step of steps) {
      const id = setTimeout(step, delay)
      timeoutIds.push(id)
      delay += DELAY
    }

    return () => {
      for (const id of timeoutIds) clearTimeout(id)
    }
  }, [chart, analysisReady])

  const birthDateTime = chart ? `${chart.birthInfo.birthDate} ${chart.birthInfo.birthTime}` : ''
  const gender = chart ? (chart.birthInfo.gender === 'male' ? '男' : '女') : ''

  const {
    data: analysis,
    loading: aiLoading,
    error: aiError,
    retry: retryAnalysis,
  } = useAIAnalysis<BaZiAnalysis>({
    promptKey: 'bazi.basic',
    variables: { birthDateTime, gender },
    defaultValue: DEFAULT_BAZI_ANALYSIS,
    autoFetch: activeTab === 'analysis' && !!chart,
  })

  // 切换到解析 Tab 时触发 AI
  useEffect(() => {
    if (activeTab === 'analysis' && chart && !aiLoading && !aiError) {
      // autoFetch 已处理，此处仅用于 Tab 切换时的触发
    }
  }, [activeTab, chart, aiLoading, aiError])

  // Loading 步骤文案
  const LOADING_STEPS = [
    { step: 1, text: '正在排演四柱……', icon: '☯' },
    { step: 2, text: '正在推演格局……', icon: '◈' },
    { step: 3, text: '正在分析十神……', icon: '✦' },
    { step: 4, text: '正在推演大运……', icon: '⟳' },
    { step: 5, text: '正在推算流年流月……', icon: '☽' },
    { step: 6, text: '正在分析婚姻事业……', icon: '♡' },
    { step: 7, text: '正在分析财富健康……', icon: '✧' },
    { step: 8, text: '正在生成命书……', icon: '✎' },
  ]

  if (!analysisReady && chart) {
    const currentStep = LOADING_STEPS.find(s => s.step === loadingStep)
    const completedSteps = LOADING_STEPS.filter(s => s.step < loadingStep)
    return (
      <div className="bazi-chart-page">
        <PageTitle
          icon="☯"
          label="玄风命理"
          title="命盘推演"
          subtitle={`${chart.birthInfo.birthDate} ${chart.birthInfo.birthTime} ${chart.birthInfo.gender === 'male' ? '男命' : '女命'}`}
        />
        <div className="container bazi-chart-content">
          <div className="bazi-loading-container">
            <div className="bazi-loading-progress">
              <div className="bazi-loading-progress-bar" style={{ width: `${Math.min(loadingStep / 8 * 100, 100)}%` }} />
            </div>
            <div className="bazi-loading-steps">
              {completedSteps.map((s, i) => (
                <div key={i} className="bazi-loading-step bazi-loading-step--done">
                  <span className="bazi-loading-step-icon">{s.icon}</span>
                  <span className="bazi-loading-step-text">{s.text.replace('……', '')}</span>
                  <span className="bazi-loading-step-check">✓</span>
                </div>
              ))}
              {currentStep && (
                <div className="bazi-loading-step bazi-loading-step--active">
                  <span className="bazi-loading-step-icon bazi-loading-pulse">{currentStep.icon}</span>
                  <span className="bazi-loading-step-text">{currentStep.text}</span>
                  <span className="bazi-loading-step-dots">
                    <span className="dot">·</span>
                    <span className="dot">·</span>
                    <span className="dot">·</span>
                  </span>
                </div>
              )}
              {LOADING_STEPS.filter(s => s.step > loadingStep).map((s, i) => (
                <div key={`pending-${i}`} className="bazi-loading-step bazi-loading-step--pending">
                  <span className="bazi-loading-step-icon">{s.icon}</span>
                  <span className="bazi-loading-step-text">{s.text.replace('……', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!chart) {
    return (
      <div className="bazi-chart-page">
        <PageTitle
          icon="☰"
          label="玄风命理"
          title="命盘总览"
          subtitle="八字排盘结果"
        />
        <div className="container bazi-empty">
          <p>暂无命盘数据</p>
          <Button variant="primary" onClick={() => navigate('/bazi')}>
            立即排盘
          </Button>
        </div>
      </div>
    )
  }

  const { sixLines, fiveElementCount, dayMaster, xiYongShen, overallScore, birthInfo: chartBirth } = chart

  // 从 analysisRef 读取计算结果（分步 Loading 完成后可用）
  const a = analysisRef.current!
  const geJu = a.geJu!
  const shenSha = a.shenSha!
  const shenShiAnalysis = a.shenShiAnalysis!
  const fiveElementPower = a.fiveElementPower!
  const daYun = a.daYun!
  const liuNian = a.liuNian!
  const liuYue = a.liuYue!
  const marriage = a.marriage!
  const career = a.career!
  const wealth = a.wealth!
  const health = a.health!
  const fengshui = a.fengshui!
  const fullReport = a.fullReport!

  function handleSave() {
    if (chart) {
      const chartWithAnalysis = { ...chart, analysis }
      saveChart(chartWithAnalysis)
      setSaved(true)
    }
  }

  function renderComparePanel() {
    if (!compareTarget || !chart) return null
    const a = chart
    const b = compareTarget
    const labels = ['年柱', '月柱', '日柱', '时柱']
    const aLines = [a.sixLines.year, a.sixLines.month, a.sixLines.day, a.sixLines.hour]
    const bLines = [b.sixLines.year, b.sixLines.month, b.sixLines.day, b.sixLines.hour]

    return (
      <div className="bazi-compare-panel">
        {/* 四柱对比 */}
        <div className="bazi-compare-block">
          <h4 className="bazi-compare-block-title">四柱对比</h4>
          <div className="bazi-compare-table">
            <div className="bazi-compare-row bazi-compare-row--header">
              <span className="bazi-compare-cell">柱</span>
              <span className="bazi-compare-cell">当前命盘</span>
              <span className="bazi-compare-cell">对比命盘</span>
              <span className="bazi-compare-cell">差异</span>
            </div>
            {labels.map((label, i) => {
              const aGanZhi = `${aLines[i].gan}${aLines[i].zhi}`
              const bGanZhi = `${bLines[i].gan}${bLines[i].zhi}`
              const isSame = aGanZhi === bGanZhi
              const aEl = aLines[i].element
              const bEl = bLines[i].element
              const elDiff = aEl !== bEl
              return (
                <div key={label} className={`bazi-compare-row${!isSame || elDiff ? ' bazi-compare-row--diff' : ''}`}>
                  <span className="bazi-compare-cell">{label}</span>
                  <span className="bazi-compare-cell">{aGanZhi}<small> {aEl}</small></span>
                  <span className="bazi-compare-cell">{bGanZhi}<small> {bEl}</small></span>
                  <span className="bazi-compare-cell">
                    {isSame && !elDiff ? '—' : `${elDiff ? `${aEl}→${bEl}` : ''}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 五行对比 */}
        <div className="bazi-compare-block">
          <h4 className="bazi-compare-block-title">五行对比</h4>
          <div className="bazi-compare-table">
            <div className="bazi-compare-row bazi-compare-row--header">
              <span className="bazi-compare-cell">五行</span>
              <span className="bazi-compare-cell">当前</span>
              <span className="bazi-compare-cell">对比</span>
            </div>
            {(['木', '火', '土', '金', '水'] as FiveElement[]).map(el => {
              const aVal = a.fiveElementCount[el] || 0
              const bVal = b.fiveElementCount[el] || 0
              const isDiff = aVal !== bVal
              return (
                <div key={el} className={`bazi-compare-row${isDiff ? ' bazi-compare-row--diff' : ''}`}>
                  <span className="bazi-compare-cell" style={{ color: ELEMENT_COLORS[el] }}>{el}</span>
                  <span className="bazi-compare-cell">{aVal}</span>
                  <span className="bazi-compare-cell">{bVal}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 喜用神 + 旺衰 + 评分 */}
        <div className="bazi-compare-block">
          <h4 className="bazi-compare-block-title">命盘指标对比</h4>
          <div className="bazi-compare-table">
            <div className="bazi-compare-row bazi-compare-row--header">
              <span className="bazi-compare-cell">指标</span>
              <span className="bazi-compare-cell">当前</span>
              <span className="bazi-compare-cell">对比</span>
            </div>
            <div className="bazi-compare-row">
              <span className="bazi-compare-cell">日主</span>
              <span className="bazi-compare-cell">{a.dayMaster.dayGan}</span>
              <span className="bazi-compare-cell">{b.dayMaster.dayGan}</span>
            </div>
            <div className={`bazi-compare-row${a.dayMaster.wangShuai !== b.dayMaster.wangShuai ? ' bazi-compare-row--diff' : ''}`}>
              <span className="bazi-compare-cell">旺衰</span>
              <span className="bazi-compare-cell">{a.dayMaster.wangShuai}</span>
              <span className="bazi-compare-cell">{b.dayMaster.wangShuai}</span>
            </div>
            <div className={`bazi-compare-row${a.xiYongShen.bestElement !== b.xiYongShen.bestElement ? ' bazi-compare-row--diff' : ''}`}>
              <span className="bazi-compare-cell">喜用神</span>
              <span className="bazi-compare-cell">{a.xiYongShen.bestElement}</span>
              <span className="bazi-compare-cell">{b.xiYongShen.bestElement}</span>
            </div>
            <div className={`bazi-compare-row${a.overallScore !== b.overallScore ? ' bazi-compare-row--diff' : ''}`}>
              <span className="bazi-compare-cell">综合评分</span>
              <span className="bazi-compare-cell">{a.overallScore}</span>
              <span className="bazi-compare-cell">{b.overallScore}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pillars = [
    { label: '年柱', ...sixLines.year },
    { label: '月柱', ...sixLines.month },
    { label: '日柱', ...sixLines.day },
    { label: '时柱', ...sixLines.hour },
  ]

  return (
    <div className="bazi-chart-page">
      <PageTitle
        icon="☰"
        label="玄风命理"
        title="命盘总览"
        subtitle={`${chartBirth.birthDate} ${chartBirth.birthTime} ${chartBirth.gender === 'male' ? '男命' : '女命'}`}
      />

      <div className="container bazi-chart-content">
        <div className="bazi-score-section">
          <ScoreRing score={overallScore} size={160} />
          <p className="bazi-score-label">命盘综合指数</p>
        </div>

        {/* 历史命盘对比 */}
        {charts.length > 0 && (
          <div className="bazi-compare-section">
            {!compareTarget ? (
              <Button variant="ghost" fullWidth onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? '收起历史列表 ▲' : `历史对比（${charts.length}个命盘） ▼`}
              </Button>
            ) : (
              <div className="bazi-compare-active">
                <div className="bazi-compare-header">
                  <span className="bazi-compare-label">对比中</span>
                  <span className="bazi-compare-names">
                    当前 vs {compareTarget.birthInfo.birthDate} {compareTarget.birthInfo.birthTime}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => { setCompareTarget(null); setShowHistory(false) }}>
                    关闭对比
                  </Button>
                </div>
                {renderComparePanel()}
              </div>
            )}
            {showHistory && !compareTarget && (
              <div className="bazi-history-list">
                {charts.filter(c => c.createdAt !== chart?.createdAt).map(c => (
                  <div key={c.createdAt} className="bazi-history-item" onClick={() => { setCompareTarget(c); setShowHistory(false) }}>
                    <div className="bazi-history-info">
                      <span className="bazi-history-date">{c.birthInfo.birthDate} {c.birthInfo.birthTime}</span>
                      <span className="bazi-history-gender">{c.birthInfo.gender === 'male' ? '男' : '女'}</span>
                      <span className="bazi-history-day">{c.sixLines.day.gan}{c.sixLines.day.zhi}</span>
                      <Badge variant={c.overallScore >= 70 ? 'gold' : 'default'} size="sm">{c.overallScore}分</Badge>
                    </div>
                    <span className="bazi-history-arrow">→</span>
                  </div>
                ))}
                {charts.filter(c => c.createdAt !== chart?.createdAt).length === 0 && (
                  <p className="bazi-history-empty">暂无其他已保存命盘</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bazi-pillars">
          {pillars.map(pillar => (
            <div key={pillar.label} className="bazi-pillar">
              <div className="pillar-label">{pillar.label}</div>
              <div className="pillar-gan">{pillar.gan}</div>
              <div className="pillar-zhi">{pillar.zhi}</div>
              <div className="pillar-element">
                <Badge variant="gold" size="sm">
                  {pillar.element}
                </Badge>
              </div>
              {pillar.label === '日柱' && (
                <div className="pillar-daymaster">
                  <Badge variant="gold" size="sm">
                    日主
                  </Badge>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bazi-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`bazi-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bazi-tab-content">
          {activeTab === 'overview' && (
            <Card className="bazi-overview-card">
              <h3 className="card-title">命盘概览</h3>
              <div className="overview-row">
                <span className="overview-label">日主</span>
                <span className="overview-value">
                  {dayMaster.dayGan}{dayMaster.dayGanElement}（{dayMaster.dayGanYinYang}）
                </span>
              </div>
              <div className="overview-row">
                <span className="overview-label">年柱</span>
                <span className="overview-value">{sixLines.year.gan}{sixLines.year.zhi}</span>
              </div>
              <div className="overview-row">
                <span className="overview-label">月柱</span>
                <span className="overview-value">{sixLines.month.gan}{sixLines.month.zhi}</span>
              </div>
              <div className="overview-row">
                <span className="overview-label">日柱</span>
                <span className="overview-value">{sixLines.day.gan}{sixLines.day.zhi}</span>
              </div>
              <div className="overview-row">
                <span className="overview-label">时柱</span>
                <span className="overview-value">{sixLines.hour.gan}{sixLines.hour.zhi}</span>
              </div>
            </Card>
          )}

          {activeTab === 'wuxing' && (
            <div className="bazi-wuxing-analysis">
              <Card className="bazi-wuxing-overview-card">
                <h3 className="card-title">五行力量</h3>
                <div className="wuxing-overview-summary">
                  <div className="wuxing-overview-item">
                    <p className="wuxing-overview-label">最旺</p>
                    <span className="wuxing-overview-value" style={{ color: ELEMENT_COLORS[fiveElementPower.dominant] }}>
                      {fiveElementPower.dominant}
                    </span>
                  </div>
                  <div className="wuxing-overview-item">
                    <p className="wuxing-overview-label">最弱</p>
                    <span className="wuxing-overview-value" style={{ color: ELEMENT_COLORS[fiveElementPower.weakest] }}>
                      {fiveElementPower.weakest}
                    </span>
                  </div>
                  <div className="wuxing-overview-item">
                    <p className="wuxing-overview-label">得令</p>
                    <span className="wuxing-overview-value" style={{ color: ELEMENT_COLORS[fiveElementPower.mostWang] }}>
                      {fiveElementPower.mostWang}
                    </span>
                  </div>
                  <div className="wuxing-overview-item">
                    <p className="wuxing-overview-label">失令</p>
                    <span className="wuxing-overview-value" style={{ color: ELEMENT_COLORS[fiveElementPower.mostShuai] }}>
                      {fiveElementPower.mostShuai}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="bazi-wuxing-bar-card">
                <h3 className="card-title">五行柱状图</h3>
                <div className="wuxing-bar-chart">
                  {fiveElementPower.sortedByPower.map(el => {
                    const detail = fiveElementPower.elements.find(e => e.element === el)
                    return (
                      <div key={el} className="wuxing-bar-row">
                        <div className="wuxing-bar-label" style={{ color: ELEMENT_COLORS[el] }}>
                          {el}
                        </div>
                        <div className="wuxing-bar-track">
                          <div
                            className="wuxing-bar-fill"
                            style={{
                              width: `${detail?.percentage || 0}%`,
                              backgroundColor: ELEMENT_COLORS[el],
                            }}
                          />
                        </div>
                        <div className="wuxing-bar-score">
                          <span className="wuxing-bar-score-value">{detail?.total || 0}</span>
                          <span className="wuxing-bar-score-pct">{detail?.percentage || 0}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="bazi-wuxing-radar-card">
                <h3 className="card-title">五行雷达图</h3>
                <div className="wuxing-radar-container">
                  <svg viewBox="0 0 200 200" className="wuxing-radar-svg">
                    {[0.2, 0.4, 0.6, 0.8, 1].map(scale => (
                      <polygon
                        key={scale}
                        points={getRadarPoints(scale)}
                        className="wuxing-radar-grid"
                      />
                    ))}
                    {['木', '火', '土', '金', '水'].map((el, i) => {
                      const angle = (i * 72 - 90) * Math.PI / 180
                      const x = 100 + 80 * Math.cos(angle)
                      const y = 100 + 80 * Math.sin(angle)
                      return (
                        <line
                          key={el}
                          x1="100"
                          y1="100"
                          x2={x}
                          y2={y}
                          className="wuxing-radar-axis"
                        />
                      )
                    })}
                    <polygon
                      points={getRadarDataPoints(fiveElementPower)}
                      className="wuxing-radar-data"
                    />
                    {['木', '火', '土', '金', '水'].map((el, i) => {
                      const angle = (i * 72 - 90) * Math.PI / 180
                      const x = 100 + 92 * Math.cos(angle)
                      const y = 100 + 92 * Math.sin(angle)
                      return (
                        <text
                          key={el}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="wuxing-radar-label"
                          fill={ELEMENT_COLORS[el as FiveElement]}
                        >
                          {el}
                        </text>
                      )
                    })}
                  </svg>
                </div>
              </Card>

              <Card className="bazi-wuxing-detail-card">
                <h3 className="card-title">五行详表</h3>
                <div className="wuxing-detail-table">
                  <div className="wuxing-detail-header">
                    <span>五行</span>
                    <span>天干</span>
                    <span>月令</span>
                    <span>地支</span>
                    <span>藏干</span>
                    <span>通根</span>
                    <span>旺衰</span>
                    <span>总分</span>
                  </div>
                  {fiveElementPower.sortedByPower.map(el => {
                    const d = fiveElementPower.elements.find(e => e.element === el)
                    if (!d) return null
                    return (
                      <div key={el} className="wuxing-detail-row">
                        <span className="wuxing-detail-element" style={{ color: ELEMENT_COLORS[el] }}>
                          {el}
                        </span>
                        <span>{d.fromStems}</span>
                        <span>{d.fromMonthBen + d.fromMonthZhong + d.fromMonthYao}</span>
                        <span>{d.fromOtherBen}</span>
                        <span>{d.fromOtherZhong + d.fromOtherYao}</span>
                        <span>{d.fromTongGen}</span>
                        <span className={`wuxing-detail-wangshuai wangshuai-${d.wangShuai}`}>
                          {d.wangShuai}
                        </span>
                        <span className="wuxing-detail-total">{d.total}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="bazi-wuxing-summary-card">
                <h3 className="card-title">五行总结</h3>
                <p className="wuxing-summary-text">{xiYongShen.happiness}</p>
              </Card>
            </div>
          )}

          {activeTab === 'shenshi' && (
            <div className="bazi-shenshi-analysis">
              <Card className="bazi-shenshi-overview-card">
                <h3 className="card-title">十神分析</h3>
                <div className="shenshi-dominant">
                  <p className="shenshi-dominant-label">主导十神</p>
                  <div className="shenshi-dominant-list">
                    {shenShiAnalysis.dominantShenShi.map((shen, idx) => (
                      <Badge key={shen + idx} variant="gold" size="md">
                        {shen}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="shenshi-sorted">
                  <p className="shenshi-sorted-label">力量排序</p>
                  <div className="shenshi-sorted-list">
                    {shenShiAnalysis.sortedByPower.map((shen, idx) => {
                      const detail = shenShiAnalysis.details.find(d => d.name === shen)
                      return (
                        <div key={shen + idx} className="shenshi-sorted-item">
                          <span className="shenshi-sorted-rank">{idx + 1}</span>
                          <span className="shenshi-sorted-name">{shen}</span>
                          <div className="shenshi-sorted-bar">
                            <div
                              className="shenshi-sorted-bar-fill"
                              style={{ width: `${detail?.power || 0}%` }}
                            />
                          </div>
                          <span className="shenshi-sorted-power">{detail?.power || 0}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>

              <Card className="bazi-shenshi-details-card">
                <h3 className="card-title">十神详表</h3>
                <div className="shenshi-details-grid">
                  {shenShiAnalysis.details.filter(d => d.power > 0).map(detail => (
                    <div key={detail.name} className="shenshi-detail-item">
                      <div className="shenshi-detail-header">
                        <span className="shenshi-detail-name">{detail.name}</span>
                        <span className="shenshi-detail-power">{detail.power}分</span>
                      </div>
                      <div className="shenshi-detail-tags">
                        {detail.touGan && <Badge variant="success" size="sm">透干</Badge>}
                        {detail.deLing && <Badge variant="gold" size="sm">得令</Badge>}
                        {detail.deDi && <Badge variant="gold" size="sm">得地</Badge>}
                        {detail.youGen && <Badge variant="default" size="sm">有根</Badge>}
                        {detail.shouZhi && <Badge variant="error" size="sm">受制</Badge>}
                      </div>
                      <p className="shenshi-detail-position">
                        位置：{detail.position.length > 0 ? detail.position.join('、') : '无'}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-shenshi-personality-card">
                <h3 className="card-title">人格分析</h3>
                <div className="shenshi-personality-traits">
                  {shenShiAnalysis.personalityTraits.map((trait, idx) => (
                    <Badge key={idx} variant="gold" size="sm">
                      {trait}
                    </Badge>
                  ))}
                </div>
                <p className="shenshi-personality-text">{shenShiAnalysis.personality}</p>
              </Card>

              <Card className="bazi-shenshi-career-card">
                <h3 className="card-title">职业倾向</h3>
                <p className="shenshi-career-text">{shenShiAnalysis.careerTendency}</p>
                <div className="shenshi-career-suggestions">
                  <p className="shenshi-career-label">推荐方向：</p>
                  <div className="shenshi-career-tags">
                    {shenShiAnalysis.careerSuggestions.map((item, idx) => (
                      <Badge key={idx} variant="gold" size="sm">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="bazi-shenshi-relationship-card">
                <h3 className="card-title">婚恋特点</h3>
                <p className="shenshi-relationship-text">{shenShiAnalysis.relationshipTraits}</p>
                <div className="shenshi-relationship-section">
                  <p className="shenshi-relationship-label">优势：</p>
                  <ul className="shenshi-relationship-list">
                    {shenShiAnalysis.relationshipStrengths.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="shenshi-relationship-section">
                  <p className="shenshi-relationship-label">注意：</p>
                  <ul className="shenshi-relationship-list">
                    {shenShiAnalysis.relationshipChallenges.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>

              {shenShiAnalysis.combinations.length > 0 && (
                <Card className="bazi-shenshi-combinations-card">
                  <h3 className="card-title">十神组合</h3>
                  <div className="shenshi-combinations-list">
                    {shenShiAnalysis.combinations.map((combo, idx) => (
                      <div key={idx} className={`shenshi-combination-item ${combo.auspicious ? 'auspicious' : 'inauspicious'}`}>
                        <div className="shenshi-combination-header">
                          <span className="shenshi-combination-name">{combo.name}</span>
                          <Badge variant={combo.auspicious ? 'success' : 'error'} size="sm">
                            {combo.auspicious ? '吉' : '凶'}
                          </Badge>
                        </div>
                        <p className="shenshi-combination-desc">{combo.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'wangshuai' && (
            <Card className="bazi-wangshuai-card">
              <h3 className="card-title">日主旺衰</h3>
              <div className="wangshuai-main">
                <div className="wangshuai-score">
                  <ScoreRing score={dayMaster.strengthScore} size={140} />
                </div>
                <div className="wangshuai-info">
                  <div className="wangshuai-level" style={{ color: ELEMENT_COLORS[dayMaster.dayGanElement] }}>
                    {dayMaster.wangShuai}
                  </div>
                  <p className="wangshuai-label">旺衰等级</p>
                </div>
              </div>
              <div className="wangshuai-details">
                <p><strong>日主：</strong>{dayMaster.dayGan}{dayMaster.dayGanElement}</p>
                <p><strong>强弱得分：</strong>{dayMaster.strengthScore} 分</p>
              </div>
              <p className="wangshuai-desc">
                日主{dayMaster.wangShuai === '旺' ? '偏旺' : ['囚', '死'].includes(dayMaster.wangShuai) ? '偏弱' : dayMaster.wangShuai}，
                {dayMaster.wangShuai === '旺' ? '需克制泄耗，宜用克泄耗五行' : ['囚', '死'].includes(dayMaster.wangShuai) ? '需生扶助力，宜用生助五行' : '五行相对平衡，喜用神选择需综合判断'}。
              </p>
            </Card>
          )}

          {activeTab === 'geju' && (
            <Card className="bazi-geju-card">
              <h3 className="card-title">格局分析</h3>
              <div className="geju-main">
                <div className="geju-name">{geJu.name}</div>
                <Badge variant={geJu.isSpecial ? 'gold' : 'default'} size="sm">
                  {geJu.isSpecial ? '变格' : '正格'}
                </Badge>
              </div>
              <div className="geju-score-row">
                <div className="geju-score-item">
                  <ScoreRing score={geJu.score} size={100} />
                  <p className="geju-score-label">成格评分</p>
                </div>
                <div className="geju-score-item">
                  <ScoreRing score={geJu.confidence} size={100} />
                  <p className="geju-score-label">可信度</p>
                </div>
                <div className="geju-score-item">
                  <ScoreRing score={geJu.pureScore} size={100} />
                  <p className="geju-score-label">清纯度</p>
                </div>
              </div>
              <div className="geju-details">
                <p><strong>等级：</strong>{geJu.grade}</p>
                <p><strong>可信度原因：</strong>{geJu.confidenceReason}</p>
                <p><strong>破格：</strong>{geJu.poGe ? '是' : '否'}</p>
                {geJu.poGe && geJu.poGeReason && (
                  <p><strong>破格原因：</strong>{geJu.poGeReason}</p>
                )}
              </div>
              <div className="geju-reasons">
                <p className="geju-reasons-title">判断依据：</p>
                <ul className="geju-reasons-list">
                  {geJu.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
              <p className="geju-desc">{geJu.description}</p>
            </Card>
          )}

          {activeTab === 'shensha' && (
            <div className="bazi-shensha-list">
              {shenSha.map(category => (
                <Card key={category.name} className="bazi-shensha-card">
                  <h3 className="card-title">{category.name}</h3>
                  <div className="shensha-items">
                    {category.items.map((item, idx) => (
                      <div
                        key={item.name + idx}
                        className={`shensha-item ${item.inPosition ? 'shensha-item--hit' : ''}`}
                      >
                        <div className="shensha-header">
                          <span className="shensha-name">{item.name}</span>
                          <Badge variant={item.inPosition ? 'success' : 'default'} size="sm">
                            {item.inPosition ? '命中' : '无'}
                          </Badge>
                        </div>
                        <p className="shensha-position">位置：{item.position}</p>
                        <p className="shensha-desc">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'xiyong' && (
            <Card className="bazi-xiyong-card">
              <h3 className="card-title">喜用神</h3>
              <div className="xiyong-main">
                <div className="xiyong-element" style={{ color: ELEMENT_COLORS[xiYongShen.bestElement] }}>
                  {xiYongShen.bestElement}
                </div>
                <p className="xiyong-label">喜用神</p>
              </div>
              <div className="xiyong-details">
                <p><strong>用神：</strong>{xiYongShen.usage}</p>
                <p><strong>喜神：</strong>{xiYongShen.happiness}</p>
                {xiYongShen.avoidedElements.length > 0 && (
                  <p>
                    <strong>忌神：</strong>
                    {xiYongShen.avoidedElements.join('、')}
                  </p>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'dayun' && (
            <div className="bazi-dayun-analysis">
              <Card className="bazi-dayun-overview-card">
                <h3 className="card-title">起运信息</h3>
                <div className="dayun-overview-grid">
                  <div className="dayun-overview-item">
                    <p className="dayun-overview-label">起运年龄</p>
                    <p className="dayun-overview-value">{daYun.qiYun.qiYunAge}</p>
                  </div>
                  <div className="dayun-overview-item">
                    <p className="dayun-overview-label">起运方向</p>
                    <p className="dayun-overview-value">{daYun.qiYun.isShun ? '顺行' : '逆行'}</p>
                  </div>
                  <div className="dayun-overview-item">
                    <p className="dayun-overview-label">起运时间</p>
                    <p className="dayun-overview-value">
                      {daYun.qiYun.qiYunDate.getFullYear()}年
                      {daYun.qiYun.qiYunDate.getMonth() + 1}月
                      {daYun.qiYun.qiYunDate.getDate()}日
                    </p>
                  </div>
                  <div className="dayun-overview-item">
                    <p className="dayun-overview-label">当前大运</p>
                    <p className="dayun-overview-value">
                      {daYun.currentStepIndex >= 0
                        ? `第${daYun.currentStepIndex + 1}步`
                        : '未起运'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bazi-dayun-list-card">
                <h3 className="card-title">大运走势</h3>
                <div className="dayun-list">
                  {daYun.steps.map((step, idx) => (
                    <div
                      key={step.index}
                      className={`dayun-item ${idx === daYun.currentStepIndex ? 'dayun-item--current' : ''} ${expandedDayun === step.index ? 'dayun-item--expanded' : ''}`}
                    >
                      <div
                        className="dayun-item-header"
                        onClick={() => setExpandedDayun(expandedDayun === step.index ? null : step.index)}
                      >
                        <div className="dayun-item-index">第{step.index}步</div>
                        <div className="dayun-item-ganzhi">
                          <span className="dayun-gan">{step.ganZhi.gan}</span>
                          <span className="dayun-zhi">{step.ganZhi.zhi}</span>
                        </div>
                        <div className="dayun-item-shenshi">
                          <Badge variant="default" size="sm">{step.shenShi.gan}</Badge>
                        </div>
                        <div className="dayun-item-toggle">
                          {expandedDayun === step.index ? '收起 ▲' : '展开 ▼'}
                        </div>
                      </div>
                      <div className="dayun-item-info">
                        <div className="dayun-item-age">
                          {step.startAge}-{step.endAge}岁
                        </div>
                        <div className="dayun-item-year">
                          {step.startYear}-{step.endYear}年
                        </div>
                      </div>
                      <div className="dayun-item-tags">
                        {step.isXi && <Badge variant="success" size="sm">喜</Badge>}
                        {step.isJi && <Badge variant="error" size="sm">忌</Badge>}
                        <Badge variant="default" size="sm">{step.wangShuai}</Badge>
                      </div>
                      <div className="dayun-item-score">
                        <div className="dayun-score-bar">
                          <div
                            className="dayun-score-fill"
                            style={{
                              width: `${step.score}%`,
                              background: step.score >= 70 ? 'var(--success)' : step.score >= 50 ? 'var(--gold-500)' : 'var(--error)'
                            }}
                          />
                        </div>
                        <span className="dayun-score-value">{step.score}分</span>
                      </div>
                      <div className="dayun-item-summary">
                        {step.summary}
                      </div>
                      {expandedDayun === step.index && (
                        <div className="dayun-item-detail">
                          <p>{step.detail}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'liunian' && (
            <div className="bazi-liunian-analysis">
              <Card className="bazi-liunian-overview-card">
                <h3 className="card-title">流年概览</h3>
                <div className="liunian-overview-info">
                  <p>显示未来100年流年运势，从 {liuNian.startYear} 年到 {liuNian.endYear} 年</p>
                </div>
              </Card>

              <Card className="bazi-liunian-list-card">
                <h3 className="card-title">流年列表</h3>
                <div className="liunian-list">
                  {liuNian.years.map((year) => (
                    <div
                      key={year.year}
                      className={`liunian-item ${year.isCurrentYear ? 'liunian-item--current' : ''} ${expandedLiunian === year.year ? 'liunian-item--expanded' : ''}`}
                    >
                      <div
                        className="liunian-item-header"
                        onClick={() => setExpandedLiunian(expandedLiunian === year.year ? null : year.year)}
                      >
                        <div className="liunian-item-year">{year.year}年</div>
                        <div className="liunian-item-ganzhi">
                          <span className="liunian-gan">{year.ganZhi.gan}</span>
                          <span className="liunian-zhi">{year.ganZhi.zhi}</span>
                        </div>
                        <div className="liunian-item-shenshi">
                          <Badge variant="default" size="sm">{year.shenShi.gan}</Badge>
                        </div>
                        <div className="liunian-item-toggle">
                          {expandedLiunian === year.year ? '收起 ▲' : '展开 ▼'}
                        </div>
                      </div>
                      <div className="liunian-item-relations">
                        {year.chong.length > 0 && (
                          <Badge variant="error" size="sm">冲</Badge>
                        )}
                        {year.he.length > 0 && (
                          <Badge variant="success" size="sm">合</Badge>
                        )}
                        {year.xing.length > 0 && (
                          <Badge variant="warning" size="sm">刑</Badge>
                        )}
                        {year.hai.length > 0 && (
                          <Badge variant="error" size="sm">害</Badge>
                        )}
                        {year.po.length > 0 && (
                          <Badge variant="default" size="sm">破</Badge>
                        )}
                      </div>
                      <div className="liunian-item-score">
                        <div className="liunian-score-bar">
                          <div
                            className="liunian-score-fill"
                            style={{
                              width: `${year.score}%`,
                              background: year.score >= 70 ? 'var(--success)' : year.score >= 50 ? 'var(--gold-500)' : 'var(--error)'
                            }}
                          />
                        </div>
                        <span className="liunian-score-value">{year.score}分</span>
                      </div>
                      <div className="liunian-item-summary">
                        {year.summary}
                      </div>
                      {expandedLiunian === year.year && (
                        <div className="liunian-item-detail">
                          <p>{year.detail}</p>
                          {year.chong.length > 0 && (
                            <p><strong>冲：</strong>{year.chong.join('、')}</p>
                          )}
                          {year.he.length > 0 && (
                            <p><strong>合：</strong>{year.he.join('、')}</p>
                          )}
                          {year.xing.length > 0 && (
                            <p><strong>刑：</strong>{year.xing.join('、')}</p>
                          )}
                          {year.hai.length > 0 && (
                            <p><strong>害：</strong>{year.hai.join('、')}</p>
                          )}
                          {year.po.length > 0 && (
                            <p><strong>破：</strong>{year.po.join('、')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'liuyue' && (
            <div className="bazi-liuyue-analysis">
              <Card className="bazi-liuyue-overview-card">
                <h3 className="card-title">流月概览</h3>
                <div className="liuyue-overview-info">
                  <div className="liuyue-year-selector">
                    <Button variant="secondary" size="sm" onClick={() => setLiuYueYear(liuYueYear - 1)}>
                      上一年
                    </Button>
                    <span className="liuyue-year-display">
                      {liuYue.year}年 {liuYue.yearGanZhi.gan}{liuYue.yearGanZhi.zhi}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => setLiuYueYear(liuYueYear + 1)}>
                      下一年
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="bazi-liuyue-list-card">
                <h3 className="card-title">流月走势</h3>
                <div className="liuyue-grid">
                  {liuYue.months.map((month) => (
                    <div
                      key={month.monthIndex}
                      className={`liuyue-item ${expandedLiuyue === month.monthIndex ? 'liuyue-item--expanded' : ''}`}
                    >
                      <div
                        className="liuyue-item-header"
                        onClick={() => setExpandedLiuyue(expandedLiuyue === month.monthIndex ? null : month.monthIndex)}
                      >
                        <div className="liuyue-item-month">{month.monthName}</div>
                        <div className="liuyue-item-ganzhi">
                          <span className="liuyue-gan">{month.ganZhi.gan}</span>
                          <span className="liuyue-zhi">{month.ganZhi.zhi}</span>
                        </div>
                        <div className="liuyue-item-shenshi">
                          <Badge variant="default" size="sm">{month.shenShi.gan}</Badge>
                        </div>
                        <div className="liuyue-item-jixiong">
                          <Badge
                            variant={
                              month.jiXiong === '大吉' ? 'success' :
                              month.jiXiong === '吉' ? 'gold' :
                              month.jiXiong === '平' ? 'default' :
                              month.jiXiong === '凶' ? 'warning' : 'error'
                            }
                            size="sm"
                          >
                            {month.jiXiong}
                          </Badge>
                        </div>
                        <div className="liuyue-item-toggle">
                          {expandedLiuyue === month.monthIndex ? '▲' : '▼'}
                        </div>
                      </div>
                      <div className="liuyue-item-score">
                        <div className="liuyue-score-bar">
                          <div
                            className="liuyue-score-fill"
                            style={{
                              width: `${month.score}%`,
                              background: month.score >= 70 ? 'var(--success)' : month.score >= 50 ? 'var(--gold-500)' : 'var(--error)'
                            }}
                          />
                        </div>
                        <span className="liuyue-score-value">{month.score}分</span>
                      </div>
                      <div className="liuyue-item-summary">
                        {month.summary}
                      </div>
                      {expandedLiuyue === month.monthIndex && (
                        <div className="liuyue-item-detail">
                          <p><strong>注意事项：</strong></p>
                          <p>{month.notice}</p>
                          <div className="liuyue-item-relations">
                            {month.chong.length > 0 && (
                              <p><strong>冲：</strong>{month.chong.join('、')}</p>
                            )}
                            {month.he.length > 0 && (
                              <p><strong>合：</strong>{month.he.join('、')}</p>
                            )}
                            {month.xing.length > 0 && (
                              <p><strong>刑：</strong>{month.xing.join('、')}</p>
                            )}
                            {month.hai.length > 0 && (
                              <p><strong>害：</strong>{month.hai.join('、')}</p>
                            )}
                            {month.po.length > 0 && (
                              <p><strong>破：</strong>{month.po.join('、')}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'marriage' && (
            <div className="bazi-marriage-analysis">
              <Card className="bazi-marriage-score-card">
                <h3 className="card-title">婚恋评分</h3>
                <div className="marriage-score-main">
                  <ScoreRing score={marriage.score} size={160} />
                  <p className="marriage-score-label">婚姻综合指数</p>
                </div>
                <div className="marriage-score-level">
                  {marriage.score >= 80 ? '婚姻运势良好' :
                   marriage.score >= 60 ? '婚姻有喜有忧' : '婚姻需谨慎'}
                </div>
              </Card>

              <Card className="bazi-marriage-palace-card">
                <h3 className="card-title">夫妻宫</h3>
                <div className="marriage-palace-info">
                  <div className="marriage-palace-zhi">
                    <span className="palace-zhi-label">日支</span>
                    <span className="palace-zhi-value">{marriage.spousePalace.zhi}</span>
                    <Badge variant="gold" size="sm">{marriage.spousePalace.element}</Badge>
                  </div>
                  <p className="marriage-palace-desc">{marriage.spousePalace.description}</p>
                </div>
              </Card>

              {marriage.relations.length > 0 && (
                <Card className="bazi-marriage-relations-card">
                  <h3 className="card-title">夫妻宫关系</h3>
                  <div className="marriage-relations-list">
                    {marriage.relations.map((rel, idx) => (
                      <div key={idx} className={`marriage-relation-item severity-${rel.severity}`}>
                        <div className="marriage-relation-header">
                          <Badge
                            variant={
                              rel.type === '冲' ? 'error' :
                              rel.type === '刑' ? 'warning' :
                              rel.type === '害' ? 'warning' :
                              rel.type === '破' ? 'default' : 'success'
                            }
                            size="sm"
                          >
                            {rel.type}
                          </Badge>
                          <span className="marriage-relation-target">{rel.target}</span>
                        </div>
                        <p className="marriage-relation-desc">{rel.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="bazi-marriage-shensha-card">
                <h3 className="card-title">婚姻神煞</h3>
                <div className="marriage-shensha-grid">
                  {marriage.shenSha.map((item, idx) => (
                    <div key={idx} className={`marriage-shensha-item ${item.inPosition ? 'hit' : ''}`}>
                      <div className="marriage-shensha-header">
                        <span className="marriage-shensha-name">{item.name}</span>
                        <Badge variant={item.inPosition ? 'success' : 'default'} size="sm">
                          {item.inPosition ? '命中' : '无'}
                        </Badge>
                      </div>
                      {item.inPosition && (
                        <p className="marriage-shensha-position">位置：{item.position}</p>
                      )}
                      <p className="marriage-shensha-desc">{item.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-marriage-age-card">
                <h3 className="card-title">最佳结婚年龄</h3>
                <div className="marriage-age-main">
                  <span className="marriage-age-value">{marriage.bestMarriageAge.min}-{marriage.bestMarriageAge.max}</span>
                  <span className="marriage-age-unit">岁</span>
                </div>
                <p className="marriage-age-reason">{marriage.bestMarriageAge.reason}</p>
              </Card>

              <Card className="bazi-marriage-risks-card">
                <h3 className="card-title">婚姻风险</h3>
                <div className="marriage-risks-list">
                  {marriage.risks.map((risk, idx) => (
                    <div key={idx} className={`marriage-risk-item level-${risk.level}`}>
                      <div className="marriage-risk-header">
                        <span className="marriage-risk-name">{risk.type}</span>
                        <Badge
                          variant={risk.level === 'high' ? 'error' : risk.level === 'medium' ? 'warning' : 'default'}
                          size="sm"
                        >
                          {risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}
                        </Badge>
                      </div>
                      <p className="marriage-risk-desc">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-marriage-suggestions-card">
                <h3 className="card-title">改善建议</h3>
                <ul className="marriage-suggestions-list">
                  {marriage.suggestions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card className="bazi-marriage-summary-card">
                <h3 className="card-title">婚姻总结</h3>
                <p className="marriage-summary-text">{marriage.summary}</p>
              </Card>
            </div>
          )}

          {activeTab === 'career' && (
            <div className="bazi-career-analysis">
              <Card className="bazi-career-score-card">
                <h3 className="card-title">事业评分</h3>
                <div className="career-score-main">
                  <ScoreRing score={career.score} size={160} />
                  <p className="career-score-label">事业综合指数</p>
                </div>
                <div className="career-score-level">
                  {career.score >= 80 ? '事业运势旺盛' :
                   career.score >= 60 ? '事业有发展潜力' : '事业需稳步积累'}
                </div>
              </Card>

              <Card className="bazi-career-shishen-card">
                <h3 className="card-title">事业十神格局</h3>
                <div className="career-shishen-list">
                  {career.shishenScores.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="career-shishen-item">
                      <div className="career-shishen-header">
                        <span className="career-shishen-name">{item.name}</span>
                        <Badge variant="gold" size="sm">{item.role}</Badge>
                      </div>
                      <div className="career-shishen-bar">
                        <div
                          className="career-shishen-bar-fill"
                          style={{ width: `${item.power}%` }}
                        />
                      </div>
                      <span className="career-shishen-power">{item.power}分</span>
                      <p className="career-shishen-desc">{item.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-career-directions-card">
                <h3 className="card-title">发展方向</h3>
                <div className="career-directions-list">
                  {career.directions.map((dir, idx) => (
                    <div key={idx} className={`career-direction-item ${dir.suitable ? 'suitable' : ''}`}>
                      <div className="career-direction-header">
                        <span className="career-direction-name">{dir.name}</span>
                        <Badge variant={dir.suitable ? 'success' : 'default'} size="sm">
                          {dir.suitable ? '适合' : '一般'}
                        </Badge>
                      </div>
                      <div className="career-direction-score">
                        <div className="career-direction-bar">
                          <div
                            className="career-direction-bar-fill"
                            style={{
                              width: `${dir.score}%`,
                              background: dir.score >= 70 ? 'var(--success)' : dir.score >= 50 ? 'var(--gold-500)' : 'var(--error)'
                            }}
                          />
                        </div>
                        <span className="career-direction-score-value">{dir.score}分</span>
                      </div>
                      <p className="career-direction-desc">{dir.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-career-industries-card">
                <h3 className="card-title">适合行业</h3>
                <div className="career-industries-list">
                  {career.industries.map((item, idx) => (
                    <div key={idx} className="career-industry-item">
                      <div className="career-industry-header">
                        <span className="career-industry-name">{item.industry}</span>
                        <span className="career-industry-score">{item.score}分</span>
                      </div>
                      <div className="career-industry-tags">
                        {item.tags.map((tag, tidx) => (
                          <Badge key={tidx} variant="default" size="sm">{tag}</Badge>
                        ))}
                      </div>
                      <p className="career-industry-reason">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-career-path-card">
                <h3 className="card-title">最佳发展路径</h3>
                <p className="career-path-text">{career.bestPath}</p>
              </Card>

              <Card className="bazi-career-wealth-card">
                <h3 className="card-title">财富方向</h3>
                <p className="career-wealth-text">{career.wealthDirection}</p>
              </Card>

              <Card className="bazi-career-risks-card">
                <h3 className="card-title">事业风险</h3>
                <ul className="career-risks-list">
                  {career.risks.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card className="bazi-career-suggestions-card">
                <h3 className="card-title">发展建议</h3>
                <ul className="career-suggestions-list">
                  {career.suggestions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card className="bazi-career-summary-card">
                <h3 className="card-title">事业总结</h3>
                <p className="career-summary-text">{career.summary}</p>
              </Card>
            </div>
          )}

          {activeTab === 'wealth' && (
            <div className="bazi-wealth-analysis">
              <Card className="bazi-wealth-score-card">
                <h3 className="card-title">财富评分</h3>
                <div className="wealth-score-main">
                  <ScoreRing score={wealth.score} size={160} />
                  <p className="wealth-score-label">财富综合指数</p>
                </div>
                <div className="wealth-score-level">
                  {wealth.score >= 80 ? '财富运势旺盛' :
                   wealth.score >= 60 ? '财富有积累空间' : '财富需稳扎稳打'}
                </div>
              </Card>

              <Card className="bazi-wealth-caiyun-card">
                <h3 className="card-title">财运分析</h3>
                <div className="wealth-caiyun-grid">
                  {wealth.zhengCai && (
                    <div className="wealth-caiyun-item">
                      <div className="wealth-caiyun-header">
                        <span className="wealth-caiyun-name">正财</span>
                        <Badge variant="success" size="sm">{wealth.zhengCai.power}分</Badge>
                      </div>
                      <p className="wealth-caiyun-desc">{wealth.zhengCai.description}</p>
                    </div>
                  )}
                  {wealth.pianCai && (
                    <div className="wealth-caiyun-item">
                      <div className="wealth-caiyun-header">
                        <span className="wealth-caiyun-name">偏财</span>
                        <Badge variant="gold" size="sm">{wealth.pianCai.power}分</Badge>
                      </div>
                      <p className="wealth-caiyun-desc">{wealth.pianCai.description}</p>
                    </div>
                  )}
                  {!wealth.zhengCai && !wealth.pianCai && (
                    <div className="wealth-caiyun-item">
                      <p className="wealth-caiyun-desc">命中财星较弱，需靠技术和努力获取财富。</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="bazi-wealth-caiku-card">
                <h3 className="card-title">财库</h3>
                <div className="wealth-caiku-main">
                  <Badge variant={wealth.caiKu.hasCaiKu ? 'success' : 'default'} size="md">
                    {wealth.caiKu.hasCaiKu ? '命带财库' : '无财库'}
                  </Badge>
                  {wealth.caiKu.caiKuZhi && (
                    <span className="wealth-caiku-zhi">{wealth.caiKu.caiKuZhi}</span>
                  )}
                </div>
                <p className="wealth-caiku-desc">{wealth.caiKu.description}</p>
              </Card>

              <Card className="bazi-wealth-flags-card">
                <h3 className="card-title">财运特征</h3>
                <div className="wealth-flags-grid">
                  <div className={`wealth-flag-item ${wealth.louCai ? 'warning' : ''}`}>
                    <span className="wealth-flag-label">漏财</span>
                    <Badge variant={wealth.louCai ? 'warning' : 'default'} size="sm">
                      {wealth.louCai ? '是' : '否'}
                    </Badge>
                  </div>
                  <div className={`wealth-flag-item ${wealth.poCai ? 'error' : ''}`}>
                    <span className="wealth-flag-label">破财</span>
                    <Badge variant={wealth.poCai ? 'error' : 'default'} size="sm">
                      {wealth.poCai ? '是' : '否'}
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="bazi-wealth-style-card">
                <h3 className="card-title">赚钱方式</h3>
                <p className="wealth-style-text">{wealth.moneyMakingStyle}</p>
              </Card>

              <Card className="bazi-wealth-investment-card">
                <h3 className="card-title">投资方向</h3>
                <div className="wealth-investment-list">
                  {wealth.investmentDirections.map((item, idx) => (
                    <div key={idx} className={`wealth-investment-item ${item.suitable ? 'suitable' : ''}`}>
                      <div className="wealth-investment-header">
                        <span className="wealth-investment-name">{item.direction}</span>
                        <Badge variant={item.suitable ? 'success' : 'default'} size="sm">
                          {item.suitable ? '适合' : '一般'}
                        </Badge>
                      </div>
                      <div className="wealth-investment-score">
                        <div className="wealth-investment-bar">
                          <div
                            className="wealth-investment-bar-fill"
                            style={{
                              width: `${item.score}%`,
                              background: item.score >= 70 ? 'var(--success)' : item.score >= 50 ? 'var(--gold-500)' : 'var(--error)'
                            }}
                          />
                        </div>
                        <span className="wealth-investment-score-value">{item.score}分</span>
                      </div>
                      <p className="wealth-investment-reason">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {wealth.riskYears.length > 0 && (
                <Card className="bazi-wealth-riskyears-card">
                  <h3 className="card-title">风险年份</h3>
                  <div className="wealth-riskyears-list">
                    {wealth.riskYears.map((item, idx) => (
                      <div key={idx} className={`wealth-riskyear-item level-${item.level}`}>
                        <div className="wealth-riskyear-header">
                          <span className="wealth-riskyear-year">{item.year}年 ({item.ganZhi})</span>
                          <Badge
                            variant={item.level === 'high' ? 'error' : item.level === 'medium' ? 'warning' : 'default'}
                            size="sm"
                          >
                            {item.riskType}
                          </Badge>
                        </div>
                        <p className="wealth-riskyear-desc">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="bazi-wealth-suggestions-card">
                <h3 className="card-title">理财建议</h3>
                <ul className="wealth-suggestions-list">
                  {wealth.suggestions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </Card>

              <Card className="bazi-wealth-summary-card">
                <h3 className="card-title">财富总结</h3>
                <p className="wealth-summary-text">{wealth.summary}</p>
              </Card>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="bazi-health-analysis">
              <Card className="bazi-health-score-card">
                <h3 className="card-title">健康评分</h3>
                <div className="health-score-main">
                  <ScoreRing score={health.score} size={160} />
                  <p className="health-score-label">健康综合指数</p>
                </div>
                <div className="health-score-level">
                  {health.score >= 80 ? '健康状况良好' :
                   health.score >= 60 ? '健康需关注' : '健康需重点调养'}
                </div>
              </Card>

              <Card className="bazi-health-constitution-card">
                <h3 className="card-title">体质类型</h3>
                <div className="health-constitution-main">
                  <Badge variant="gold" size="md">{health.constitution.type}</Badge>
                </div>
                <p className="health-constitution-desc">{health.constitution.description}</p>
                <div className="health-constitution-chars">
                  {health.constitution.characteristics.map((c, idx) => (
                    <span key={idx} className="health-char-tag">{c}</span>
                  ))}
                </div>
              </Card>

              <Card className="bazi-health-tcm-card">
                <h3 className="card-title">寒热燥湿</h3>
                <div className="health-tcm-grid">
                  <div className={`health-tcm-item ${health.temperature.type === '寒' ? 'cold' : health.temperature.type === '热' ? 'hot' : ''}`}>
                    <span className="health-tcm-label">寒热</span>
                    <Badge variant={health.temperature.type === '寒' ? 'default' : health.temperature.type === '热' ? 'error' : 'success'} size="sm">
                      {health.temperature.type}
                    </Badge>
                    <p className="health-tcm-desc">{health.temperature.description}</p>
                  </div>
                  <div className={`health-tcm-item ${health.moisture.type === '燥' ? 'dry' : health.moisture.type === '湿' ? 'wet' : ''}`}>
                    <span className="health-tcm-label">燥湿</span>
                    <Badge variant={health.moisture.type === '燥' ? 'warning' : health.moisture.type === '湿' ? 'default' : 'success'} size="sm">
                      {health.moisture.type}
                    </Badge>
                    <p className="health-tcm-desc">{health.moisture.description}</p>
                  </div>
                </div>
              </Card>

              <Card className="bazi-health-disease-card">
                <h3 className="card-title">易患疾病</h3>
                <div className="health-disease-list">
                  {health.diseaseRisks.map((item, idx) => (
                    <div key={idx} className={`health-disease-item level-${item.riskLevel}`}>
                      <div className="health-disease-header">
                        <span className="health-disease-organ">{item.organ}</span>
                        <Badge
                          variant={item.riskLevel === 'high' ? 'error' : item.riskLevel === 'medium' ? 'warning' : 'success'}
                          size="sm"
                        >
                          {item.riskLevel === 'high' ? '高风险' : item.riskLevel === 'medium' ? '中风险' : '低风险'}
                        </Badge>
                      </div>
                      <p className="health-disease-desc">{item.description}</p>
                      <div className="health-disease-tags">
                        {item.diseases.map((d, didx) => (
                          <Badge key={didx} variant="default" size="sm">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-health-diet-card">
                <h3 className="card-title">饮食建议</h3>
                <div className="health-diet-list">
                  {health.dietSuggestions.map((item, idx) => (
                    <div key={idx} className="health-diet-item">
                      <div className="health-diet-header">
                        <span className="health-diet-category">{item.category}</span>
                      </div>
                      <p className="health-diet-reason">{item.reason}</p>
                      <div className="health-diet-section">
                        <span className="health-diet-section-label recommend">宜食：</span>
                        <div className="health-diet-tags">
                          {item.recommend.map((r, ridx) => (
                            <Badge key={ridx} variant="success" size="sm">{r}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="health-diet-section">
                        <span className="health-diet-section-label avoid">忌食：</span>
                        <div className="health-diet-tags">
                          {item.avoid.map((a, aidx) => (
                            <Badge key={aidx} variant="error" size="sm">{a}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-health-exercise-card">
                <h3 className="card-title">运动建议</h3>
                <div className="health-exercise-list">
                  {health.exerciseSuggestions.map((item, idx) => (
                    <div key={idx} className="health-exercise-item">
                      <Badge variant="success" size="sm">{item.type}</Badge>
                      <p className="health-exercise-reason">{item.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-health-regimen-card">
                <h3 className="card-title">调理方案</h3>
                <div className="health-regimen-list">
                  {health.regimens.map((item, idx) => (
                    <div key={idx} className="health-regimen-item">
                      <h4 className="health-regimen-aspect">{item.aspect}</h4>
                      <ul className="health-regimen-suggestions">
                        {item.suggestions.map((s, sidx) => (
                          <li key={sidx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-health-summary-card">
                <h3 className="card-title">健康总结</h3>
                <p className="health-summary-text">{health.summary}</p>
              </Card>
            </div>
          )}

          {activeTab === 'fengshui' && (
            <div className="bazi-fengshui-analysis">
              <Card className="bazi-fengshui-colors-card">
                <h3 className="card-title">喜用颜色</h3>
                <div className="fengshui-colors-grid">
                  {fengshui.luckyColors.map((item, idx) => (
                    <div key={idx} className="fengshui-color-item lucky">
                      <div className="fengshui-color-swatch" style={{ background: item.hex }} />
                      <span className="fengshui-color-name">{item.color}</span>
                      <Badge variant="success" size="sm">{item.element}</Badge>
                    </div>
                  ))}
                </div>
                {fengshui.avoidColors.length > 0 && (
                  <div className="fengshui-colors-section">
                    <h4 className="fengshui-section-title">忌讳颜色</h4>
                    <div className="fengshui-colors-grid">
                      {fengshui.avoidColors.map((item, idx) => (
                        <div key={idx} className="fengshui-color-item avoid">
                          <div className="fengshui-color-swatch" style={{ background: item.hex }} />
                          <span className="fengshui-color-name">{item.color}</span>
                          <Badge variant="default" size="sm">{item.element}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="bazi-fengshui-numbers-card">
                <h3 className="card-title">幸运数字</h3>
                <div className="fengshui-numbers-grid">
                  {fengshui.luckyNumbers.map((item, idx) => (
                    <div key={idx} className="fengshui-number-item lucky">
                      <span className="fengshui-number-value">{item.number}</span>
                      <Badge variant="success" size="sm">{item.element}</Badge>
                    </div>
                  ))}
                </div>
                {fengshui.avoidNumbers.length > 0 && (
                  <div className="fengshui-numbers-section">
                    <h4 className="fengshui-section-title">忌讳数字</h4>
                    <div className="fengshui-numbers-grid">
                      {fengshui.avoidNumbers.map((item, idx) => (
                        <div key={idx} className="fengshui-number-item avoid">
                          <span className="fengshui-number-value">{item.number}</span>
                          <Badge variant="default" size="sm">{item.element}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              <Card className="bazi-fengshui-directions-card">
                <h3 className="card-title">吉方位</h3>
                <div className="fengshui-directions-list">
                  {fengshui.directions.map((dir, idx) => (
                    <div key={idx} className="fengshui-direction-item">
                      <div className="fengshui-direction-header">
                        <span className="fengshui-direction-name">{dir.name}</span>
                        <span className="fengshui-direction-score">{dir.score}分</span>
                      </div>
                      <div className="fengshui-direction-bar">
                        <div className="fengshui-direction-bar-fill" style={{
                          width: `${dir.score}%`,
                          background: dir.score >= 70 ? 'var(--success)' : dir.score >= 50 ? 'var(--gold-500)' : 'var(--error)'
                        }} />
                      </div>
                      <p className="fengshui-direction-desc">{dir.description}</p>
                      <p className="fengshui-direction-usage">{dir.usage}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-fengshui-residence-card">
                <h3 className="card-title">住宅坐向</h3>
                <div className="fengshui-residence-main">
                  <div className="fengshui-residence-row">
                    <span className="fengshui-residence-label">最佳朝向</span>
                    <Badge variant="success" size="md">{fengshui.residence.bestFacing}</Badge>
                  </div>
                  <div className="fengshui-residence-row">
                    <span className="fengshui-residence-label">最佳坐向</span>
                    <Badge variant="gold" size="md">{fengshui.residence.bestSitting}</Badge>
                  </div>
                </div>
                <p className="fengshui-residence-desc">{fengshui.residence.description}</p>
              </Card>

              <Card className="bazi-fengshui-rooms-card">
                <h3 className="card-title">房间布局</h3>
                <div className="fengshui-rooms-list">
                  {fengshui.rooms.map((room, idx) => (
                    <div key={idx} className="fengshui-room-item">
                      <div className="fengshui-room-header">
                        <Badge variant="gold" size="sm">{room.room}</Badge>
                        <span className="fengshui-room-position">{room.position}</span>
                      </div>
                      <p className="fengshui-room-facing">朝向：{room.facing}</p>
                      <div className="fengshui-room-tips">
                        <span className="fengshui-tips-label tips">建议：</span>
                        {room.tips.map((t, tidx) => <span key={tidx}>{t}</span>)}
                      </div>
                      <div className="fengshui-room-taboos">
                        <span className="fengshui-tips-label taboo">禁忌：</span>
                        {room.taboos.map((t, tidx) => <span key={tidx}>{t}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-fengshui-special-card">
                <h3 className="card-title">特殊方位</h3>
                <div className="fengshui-special-list">
                  {fengshui.specialPositions.map((pos, idx) => (
                    <div key={idx} className="fengshui-special-item">
                      <div className="fengshui-special-header">
                        <Badge variant="gold" size="sm">{pos.name}</Badge>
                        <span className="fengshui-special-direction">{pos.direction}</span>
                      </div>
                      <p className="fengshui-special-desc">{pos.description}</p>
                      <p className="fengshui-special-usage">用途：{pos.usage}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bazi-fengshui-summary-card">
                <h3 className="card-title">风水总结</h3>
                <p className="fengshui-summary-text">{fengshui.summary}</p>
              </Card>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="bazi-full-report">
              <Card className="bazi-report-header-card">
                <h2 className="report-title">{fullReport.title}</h2>
                <p className="report-subtitle">{fullReport.subtitle}</p>
                <p className="report-wordcount">共 {fullReport.wordCount.toLocaleString()} 字</p>
                <div className="report-export-buttons">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => exportMarkdown(fullReport, {
                      birthDate: chartBirth.birthDate,
                      birthTime: chartBirth.birthTime,
                      gender: chartBirth.gender,
                    })}
                  >
                    导出命书 Markdown
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => exportWord(fullReport, {
                      birthDate: chartBirth.birthDate,
                      birthTime: chartBirth.birthTime,
                      gender: chartBirth.gender,
                    })}
                  >
                    导出命书 Word
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => exportPdf(fullReport, {
                      birthDate: chartBirth.birthDate,
                      birthTime: chartBirth.birthTime,
                      gender: chartBirth.gender,
                    })}
                  >
                    导出命书 PDF
                  </Button>
                </div>
              </Card>

              {fullReport.chapters.map((chapter, idx) => {
                const isExpanded = expandedChapters.has(idx)
                const isLong = chapter.content.length > 500
                return (
                  <Card key={idx} className="bazi-report-chapter-card" id={`chapter-${chapter.id}`}>
                    <h3 className="report-chapter-title">{chapter.title}</h3>
                    <div className={`report-chapter-content${isLong && !isExpanded ? ' collapsed' : ''}`}>
                      {chapter.content.split('\n').map((line, lidx) => {
                        if (line.startsWith('## ')) {
                          return <h4 key={lidx} className="report-section-title">{line.replace('## ', '')}</h4>
                        }
                        if (line.startsWith('### ')) {
                          return <h5 key={lidx} className="report-subsection-title">{line.replace('### ', '')}</h5>
                        }
                        if (line.startsWith('- ')) {
                          return <li key={lidx} className="report-list-item">{line.replace('- ', '')}</li>
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={lidx} className="report-bold">{line.replace(/\*\*/g, '')}</p>
                        }
                        if (line.trim() === '') {
                          return <br key={lidx} />
                        }
                        return <p key={lidx} className="report-paragraph">{line}</p>
                      })}
                    </div>
                    {isLong && !isExpanded && (
                      <div
                        className="report-collapse-toggle"
                        onClick={() => setExpandedChapters(prev => new Set(prev).add(idx))}
                      >
                        展开全文 ▼
                      </div>
                    )}
                    {isLong && isExpanded && (
                      <div
                        className="report-collapse-toggle"
                        onClick={() => {
                          setExpandedChapters(prev => {
                            const next = new Set(prev)
                            next.delete(idx)
                            return next
                          })
                        }}
                      >
                        收起 ▲
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div className="bazi-actions">
          {!saved ? (
            <Button variant="primary" fullWidth onClick={handleSave}>
              保存命盘
            </Button>
          ) : (
            <Button variant="secondary" fullWidth disabled>
              已保存
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={() => setShowPoster(true)}>
            分享海报
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate('/bazi')}>
            重新排盘
          </Button>
        </div>

        {/* 海报弹窗 */}
        {showPoster && chart && (
          <BaziPoster chart={chart} onClose={() => setShowPoster(false)} />
        )}
      </div>
    </div>
  )
}
