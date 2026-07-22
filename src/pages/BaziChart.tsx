import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle, Card, Badge, Button, Loading } from '../components/ui'
import { ScoreRing, ScoreBar } from '../components/business'
import { useBazi } from '../hooks/useBazi'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
// V4.4 性能优化：懒加载重型可视化组件，减小首屏 JS 体积
const BaziPoster = lazy(() => import('../components/business/BaziPoster'))
const ReportExperience = lazy(() =>
  import('../components/business/ReportExperience/ReportExperience').then(m => ({ default: m.ReportExperience }))
)
// V4.4 性能优化：虚拟列表工具（大运 / 流年长列表）
import { useVirtualList } from '../lib/bazi/performance'
// V4.4 Enterprise: BaziChart 统一通过 Pipeline 获取所有分析数据
// 禁止直接调用底层分析函数，形成 Single Source of Truth
import { runBaZiPipelineFromBirthData, type PipelineProgressCallback } from '../lib/bazi/pipeline'
import type { BaZiPipelineResult } from '../lib/bazi/pipeline/types'
import { calculateBaZiFromBirthData, exportMarkdown, exportWord, exportPdf, ELEMENT_COLORS } from '../lib/bazi'
import type {
  FiveElement, BaZiChart, BaZiAnalysis, GeJuResult,
  ShenShiAnalysisResult, FiveElementPowerResult,
  MarriageAnalysisResult, CareerAnalysisResult, WealthAnalysisResult,
  HealthAnalysisResult, FengShuiAnalysisResult, FullReportResult,
} from '../lib/bazi'
import { DEFAULT_BAZI_ANALYSIS } from '../constants/defaultAnalysis'
import type { BirthData } from '@/lib/core'
// V4.2 新增导入
import { askMaster } from '../lib/bazi/askMaster'
import type { AskMasterResult } from '../lib/bazi/askMaster'
import { generateAnnualReport } from '../lib/bazi/annualReport'
import type { AnnualReportResult } from '../lib/bazi/annualReport'
import { generateBaziFengShuiLink } from '../lib/bazi/baziFengShuiLink'
import type { BaziFengShuiLinkResult } from '../lib/bazi/baziFengShuiLink'
import { exportProfessionalReport } from '../lib/bazi/report/professionalReport'
import {
  generateNineGridImage, generateLongImage, generateWeChatShareCard,
  downloadShareImage,
} from '../lib/bazi/shareUtils'
import { recordView, incrementStat } from '../lib/bazi/statistics'
import { FiveElementRing } from '../components/business/BaziVisualization'
import './BaziChart.css'
// V4.4 移动端专项优化（独立文件，不修改 BaziChart.css）
import './BaziChart.mobile.css'

type TabKey = 'overview' | 'wuxing' | 'shenshi' | 'wangshuai' | 'geju' | 'shensha' | 'xiyong' | 'master' | 'pillars' | 'shishen-detail' | 'shensha-detail' | 'score' | 'dayun' | 'dayun-detail' | 'liunian' | 'liunian-detail' | 'liuyue' | 'liuyue-detail' | 'marriage' | 'career' | 'wealth' | 'health' | 'fengshui' | 'analysis' | 'report' | 'ask' | 'fengshui-link' | 'annual'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '命盘' },
  { key: 'wuxing', label: '五行' },
  { key: 'shenshi', label: '十神' },
  { key: 'wangshuai', label: '旺衰' },
  { key: 'geju', label: '格局' },
  { key: 'shensha', label: '神煞' },
  { key: 'xiyong', label: '喜用神' },
  { key: 'master', label: '命局总论' },
  { key: 'pillars', label: '四柱详解' },
  { key: 'shishen-detail', label: '十神详解' },
  { key: 'shensha-detail', label: '神煞详解' },
  { key: 'score', label: '综合评分' },
  { key: 'dayun', label: '大运' },
  { key: 'dayun-detail', label: '大运详解' },
  { key: 'liunian', label: '流年' },
  { key: 'liunian-detail', label: '流年详解' },
  { key: 'liuyue', label: '流月' },
  { key: 'liuyue-detail', label: '流月详解' },
  { key: 'marriage', label: '婚姻' },
  { key: 'career', label: '事业' },
  { key: 'wealth', label: '财富' },
  { key: 'health', label: '健康' },
  { key: 'fengshui', label: '风水' },
  { key: 'analysis', label: '解析' },
  { key: 'report', label: '报告' },
  { key: 'ask', label: '玄机问命' },
  { key: 'fengshui-link', label: '风水建议' },
  { key: 'annual', label: '年度运势' },
]

/* V4.4 虚拟列表参数（大运 / 流年长列表性能优化）
 * - 当列表条目数超过 VIRTUAL_THRESHOLD 时启用虚拟化
 * - 展开某项时退回全量渲染（保证可变高度正确）
 * - 大运通常 ~8 步，不触发虚拟化；流年 100 年，触发虚拟化
 */
const DAYUN_ITEM_HEIGHT = 96
const DAYUN_CONTAINER_HEIGHT = 520
const LIUNIAN_ITEM_HEIGHT = 84
const LIUNIAN_CONTAINER_HEIGHT = 560
const VIRTUAL_THRESHOLD = 30

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

/** 10 维度雷达图顶点计算 */
function getScoreRadarPoints(data: number[], cx: number, cy: number, r: number): string {
  return data.map((v, i) => {
    const angle = (i * 36 - 90) * Math.PI / 180
    const scale = Math.max(0, Math.min(1, v / 100))
    const x = cx + r * scale * Math.cos(angle)
    const y = cy + r * scale * Math.sin(angle)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

/** 10 维度雷达图网格线 */
function getScoreRadarGrid(cx: number, cy: number, r: number, levels: number = 4): string[] {
  const grids: string[] = []
  for (let l = 1; l <= levels; l++) {
    const lr = (r / levels) * l
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const angle = (i * 36 - 90) * Math.PI / 180
      pts.push(`${(cx + lr * Math.cos(angle)).toFixed(2)},${(cy + lr * Math.sin(angle)).toFixed(2)}`)
    }
    grids.push(pts.join(' '))
  }
  return grids
}

/** 复制文本到剪贴板 */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
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
  const [expandedMaster, setExpandedMaster] = useState<Set<number>>(() => new Set([0]))
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(() => new Set(['year']))
  const [expandedShiShenDetail, setExpandedShiShenDetail] = useState<Set<number>>(() => new Set([0]))
  const [expandedShenShaDetail, setExpandedShenShaDetail] = useState<Set<number>>(() => new Set([0]))
  const [expandedDayunDetail, setExpandedDayunDetail] = useState<number | null>(null)
  const [expandedLiuNianDetail, setExpandedLiuNianDetail] = useState<number | null>(null)
  const [expandedLiuYueDetail, setExpandedLiuYueDetail] = useState<number | null>(null)
  const [showToc, setShowToc] = useState(false)

  // V4.2 新增状态
  const [askQuestion, setAskQuestion] = useState('')
  const [askHistory, setAskHistory] = useState<AskMasterResult[]>([])
  const [askLoading, setAskLoading] = useState(false)
  const [annualYear, setAnnualYear] = useState(() => new Date().getFullYear())
  const [annualResult, setAnnualResult] = useState<AnnualReportResult | null>(null)
  const [fengShuiLinkResult, setFengShuiLinkResult] = useState<BaziFengShuiLinkResult | null>(null)

  // V4.4 虚拟列表滚动位置（大运 / 流年长列表）
  const [dayunScrollTop, setDayunScrollTop] = useState(0)
  const [liunianScrollTop, setLiunianScrollTop] = useState(0)

  // 分步 Loading 状态
  const [loadingStep, setLoadingStep] = useState(0)
  const [loadingText, setLoadingText] = useState('排盘分析...')
  const [analysisReady, setAnalysisReady] = useState(false)
  // V4.4 Enterprise: 统一通过 Pipeline 获取所有分析数据
  const [pipelineResult, setPipelineResult] = useState<BaZiPipelineResult | null>(null)

  useEffect(() => {
    if (!chart && charts.length > 0) {
      setChart(charts[0])
    }
  }, [charts])

  // V4.4 虚拟列表：展开/收起切换时重置滚动位置，避免虚拟窗口与全量渲染切换时窗口错位
  useEffect(() => {
    setDayunScrollTop(0)
    setLiunianScrollTop(0)
  }, [expandedDayun, expandedLiunian])

  // V4.4 Enterprise: 统一通过 Pipeline 获取所有分析数据 + 真实进度
  useEffect(() => {
    if (!chart || analysisReady) return undefined

    let cancelled = false
    setLoadingStep(1)

    const birthData: BirthData = {
      birthday: chart.birthInfo.birthDate,
      birthTime: chart.birthInfo.birthTime,
      gender: chart.birthInfo.gender,
    }

    runBaZiPipelineFromBirthData(
      {
        birthData,
        options: {
          includeDaYun: true,
          includeLiuNian: true,
          includeCareer: true,
          includeMarriage: true,
          includeWealth: true,
          includeHealth: true,
          detailed: true,
        },
      },
      // 真实 Pipeline Progress 回调
      (event) => {
        if (cancelled) return
        const stepIndex = Math.min(Math.floor(event.progress / 5), 8)
        setLoadingStep(stepIndex)
        setLoadingText(event.stepName)
      },
    ).then(result => {
      if (!cancelled) {
        setPipelineResult(result)
        setAnalysisReady(true)
      }
    }).catch(err => {
      console.error('Pipeline 执行失败', err)
      if (!cancelled) setAnalysisReady(true)
    })

    return () => { cancelled = true }
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

  // 切换到解析 Tab 时触发推演
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
                  <span className="bazi-loading-step-text">{loadingText}</span>
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

  // V4.4 Enterprise: 所有分析数据统一从 Pipeline Result 读取
  // 禁止直接调用底层分析函数，形成 Single Source of Truth
  const p = pipelineResult
  const geJu = p?.geJu!

  // shenShaDetail 由下方 useMemo 提供
  const shenShiAnalysis = p?.shenShiAnalysis!
  const fiveElementPower = p?.fiveElementPower!
  const daYun = p?.daYun!
  const liuNian = p?.liuNian!
  const liuYue = p?.liuYue!
  const marriage = p?.marriage!
  const career = p?.career!
  const wealth = p?.wealth!
  const health = p?.health!
  const fengshui = p?.fengshui!
  const fullReport = p?.fullReport

  // ===== V4.4 虚拟列表（大运 / 流年长列表性能优化） =====
  // useVirtualList 为纯函数，可在此直接调用；列表短或展开某项时退回全量渲染
  const dayunSteps = daYun.steps
  const dayunVirtual = useVirtualList(
    dayunSteps,
    DAYUN_ITEM_HEIGHT,
    DAYUN_CONTAINER_HEIGHT,
    dayunScrollTop,
    3
  )
  // 大运条目少（通常 8 步），不触发虚拟化；保留接口以便统一处理
  const dayunVirtualized = dayunSteps.length > VIRTUAL_THRESHOLD && expandedDayun === null

  const liunianYears = liuNian.years
  const liunianVirtual = useVirtualList(
    liunianYears,
    LIUNIAN_ITEM_HEIGHT,
    LIUNIAN_CONTAINER_HEIGHT,
    liunianScrollTop,
    4
  )
  // 流年 100 年，触发虚拟化；展开某项时退回全量渲染
  const liunianVirtualized = liunianYears.length > VIRTUAL_THRESHOLD && expandedLiunian === null

  // ===== 新 Tab 数据（从 Pipeline Result 读取，不直接调用底层函数） =====
  const masterSummary = useMemo(() => {
    return p?.masterSummary ?? null
  }, [p])

  const pillarAnalysis = useMemo(() => {
    return p?.pillarAnalysis ?? null
  }, [p])

  const shiShenDetail = useMemo(() => {
    return p?.shiShenDetail ?? null
  }, [p])

  const shenShaDetail = useMemo(() => {
    return p?.shenShaDetail ?? null
  }, [p])

  // 神煞分类视图：从 shenShaDetail 派生（吉神 / 凶煞）
  const shenShaCategories = useMemo(() => {
    if (!shenShaDetail?.items) return []
    const auspicious = shenShaDetail.items.filter(s => s.isAuspicious)
    const inauspicious = shenShaDetail.items.filter(s => !s.isAuspicious)
    return [
      { name: '吉神贵神', items: auspicious },
      { name: '凶煞', items: inauspicious },
    ].filter(c => c.items.length > 0)
  }, [shenShaDetail])

  const compScore = useMemo(() => {
    return p?.comprehensiveScore ?? null
  }, [p])

  const dayunDetails = useMemo(() => {
    return p?.dayunDetails ?? []
  }, [p])

  const liunianDetails = useMemo(() => {
    return p?.liunianDetails ?? []
  }, [p])

  // 复制按钮状态
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const handleCopy = useCallback(async (text: string, id: string) => {
    const ok = await copyText(text)
    if (ok) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }, [])

  function handleSave() {
    if (chart) {
      const chartWithAnalysis = { ...chart, analysis }
      saveChart(chartWithAnalysis)
      setSaved(true)
      recordView(chart.birthInfo.birthDate)
    }
  }

  // V4.2 新增处理函数

  /** 玄机问命 */
  const handleAskQuestion = useCallback(() => {
    if (!chart || !askQuestion.trim()) return
    setAskLoading(true)
    try {
      const result = askMaster({
        chart,
        question: askQuestion.trim(),
        geJu,
        xiYongShen,
        daYun,
        currentYear: new Date().getFullYear(),
      })
      setAskHistory(prev => [result, ...prev].slice(0, 20))
      setAskQuestion('')
    } catch (e) {
      console.error('玄机问命失败', e)
    } finally {
      setAskLoading(false)
    }
  }, [chart, askQuestion, geJu, xiYongShen, daYun])

  /** 生成年度运势 */
  const handleGenerateAnnual = useCallback(() => {
    if (!chart) return
    try {
      const result = generateAnnualReport({
        chart,
        year: annualYear,
        xiYongShen,
        daYun,
      })
      setAnnualResult(result)
    } catch (e) {
      console.error('年度运势生成失败', e)
    }
  }, [chart, annualYear, xiYongShen, daYun])

  /** 计算风水建议 */
  const fengShuiLinkMemo = useMemo(() => {
    if (!chart) return null
    try {
      return generateBaziFengShuiLink(chart, xiYongShen)
    } catch {
      return null
    }
  }, [chart, xiYongShen])

  /** 导出专业报告 */
  const handleExportProfessional = useCallback(async () => {
    if (!chart) return
    try {
      const blob = await exportProfessionalReport({
        chart,
        masterSummary: masterSummary,
        comprehensiveScore: compScore,
        daYun,
        liuNian,
        baziFengShuiLink: fengShuiLinkMemo,
        generateDate: new Date().toISOString(),
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `玄风门命理报告_${chartBirth.birthDate}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      incrementStat('export')
    } catch (e) {
      console.error('导出专业报告失败', e)
    }
  }, [chart, masterSummary, compScore, daYun, liuNian, fengShuiLinkMemo, chartBirth.birthDate])

  /** 下载九宫格分享图 */
  const handleDownloadNineGrid = useCallback(() => {
    if (!chart) return
    const canvas = generateNineGridImage({
      chart,
      geJu: geJu.name,
      dayMasterDesc: `日元 ${dayMaster.dayGan}${dayMaster.dayGanElement}`,
      xiYongShenDesc: `喜${xiYongShen.happiness} 用${xiYongShen.usage}`,
      overallScore: overallScore,
      fortuneSummary: chart.analysis?.summary,
    })
    downloadShareImage(canvas, `命盘九宫格_${chartBirth.birthDate}`)
    incrementStat('share')
  }, [chart, geJu, dayMaster, xiYongShen, overallScore, chartBirth.birthDate])

  /** 下载长图海报 */
  const handleDownloadLongImage = useCallback(() => {
    if (!chart) return
    const canvas = generateLongImage({
      chart,
      geJu: geJu.name,
      dayMasterDesc: `日元 ${dayMaster.dayGan}${dayMaster.dayGanElement}`,
      xiYongShenDesc: `喜${xiYongShen.happiness} 用${xiYongShen.usage}`,
      overallScore: overallScore,
      fiveElementPower: fiveElementPower.elements.map(e => ({ element: e.element, percentage: e.percentage })),
      daYun: daYun.steps.map(s => ({ ganZhi: `${s.ganZhi.gan}${s.ganZhi.zhi}`, startYear: s.startYear, endYear: s.endYear })),
      fortuneSummary: chart.analysis?.summary,
    })
    downloadShareImage(canvas, `命盘长图_${chartBirth.birthDate}`)
    incrementStat('share')
  }, [chart, geJu, dayMaster, xiYongShen, overallScore, fiveElementPower, daYun, chartBirth.birthDate])

  /** 下载微信卡片 */
  const handleDownloadWeChatCard = useCallback(() => {
    if (!chart) return
    const canvas = generateWeChatShareCard({
      chart,
      geJu: geJu.name,
      dayMasterDesc: `日元 ${dayMaster.dayGan}${dayMaster.dayGanElement}`,
      xiYongShenDesc: `喜${xiYongShen.happiness} 用${xiYongShen.usage}`,
      overallScore: overallScore,
    })
    downloadShareImage(canvas, `命盘分享_${chartBirth.birthDate}`)
    incrementStat('share')
  }, [chart, geJu, dayMaster, xiYongShen, overallScore, chartBirth.birthDate])

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

  // V4.4 虚拟列表项渲染器（大运 / 流年复用，避免虚拟化分支与全量分支的 JSX 重复）
  const renderDayunItem = (step: typeof daYun.steps[number], absIdx: number) => (
    <div
      key={step.index}
      className={`dayun-item ${absIdx === daYun.currentStepIndex ? 'dayun-item--current' : ''} ${expandedDayun === step.index ? 'dayun-item--expanded' : ''}`}
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
  )

  const renderLiunianItem = (year: typeof liuNian.years[number]) => (
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
        {year.vsMingJu.chong.length > 0 && (
          <Badge variant="error" size="sm">冲</Badge>
        )}
        {year.vsMingJu.he.length > 0 && (
          <Badge variant="success" size="sm">合</Badge>
        )}
        {year.vsMingJu.xing.length > 0 && (
          <Badge variant="warning" size="sm">刑</Badge>
        )}
        {year.vsMingJu.hai.length > 0 && (
          <Badge variant="error" size="sm">害</Badge>
        )}
        {year.vsMingJu.chuan.length > 0 && (
          <Badge variant="warning" size="sm">穿</Badge>
        )}
        {year.vsMingJu.po.length > 0 && (
          <Badge variant="default" size="sm">破</Badge>
        )}
        {year.vsDaYun.chong.length > 0 && (
          <Badge variant="error" size="sm">冲运</Badge>
        )}
        {year.vsDaYun.he.length > 0 && (
          <Badge variant="success" size="sm">合运</Badge>
        )}
      </div>
      <div className="liunian-item-summary">
        {year.summary}
      </div>
      {expandedLiunian === year.year && (
        <div className="liunian-item-detail">
          <p>{year.detail}</p>
          {year.yingQi.length > 0 && (
            <div className="liunian-yingqi">
              <p><strong>应期事件：</strong></p>
              {year.yingQi.map((yq, idx) => (
                <div key={idx} className="yingqi-item">
                  <p>• {yq.event}（强度：{yq.intensity}）</p>
                  <p>　原因：{yq.reason}</p>
                  <p>　影响：{yq.implications.join('、')}</p>
                </div>
              ))}
            </div>
          )}
          {year.vsMingJu.chong.length > 0 && (
            <p><strong>流年冲命局：</strong>{year.vsMingJu.chong.join('、')}</p>
          )}
          {year.vsMingJu.he.length > 0 && (
            <p><strong>流年合命局：</strong>{year.vsMingJu.he.join('、')}</p>
          )}
          {year.vsMingJu.xing.length > 0 && (
            <p><strong>流年刑命局：</strong>{year.vsMingJu.xing.join('、')}</p>
          )}
          {year.vsMingJu.hai.length > 0 && (
            <p><strong>流年害命局：</strong>{year.vsMingJu.hai.join('、')}</p>
          )}
          {year.vsMingJu.chuan.length > 0 && (
            <p><strong>流年穿命局：</strong>{year.vsMingJu.chuan.join('、')}</p>
          )}
          {year.vsMingJu.po.length > 0 && (
            <p><strong>流年破命局：</strong>{year.vsMingJu.po.join('、')}</p>
          )}
          {(year.vsDaYun.chong.length > 0 || year.vsDaYun.he.length > 0 || year.vsDaYun.xing.length > 0 || year.vsDaYun.hai.length > 0 || year.vsDaYun.chuan.length > 0 || year.vsDaYun.po.length > 0 || year.vsDaYun.fuYin.length > 0) && (
            <p><strong>流年与大运：</strong>{[...year.vsDaYun.chong, ...year.vsDaYun.he, ...year.vsDaYun.xing, ...year.vsDaYun.hai, ...year.vsDaYun.chuan, ...year.vsDaYun.po, ...year.vsDaYun.fuYin].join('、')}</p>
          )}
        </div>
      )}
    </div>
  )

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

        {/* 可折叠目录导航 */}
        <div className="bazi-toc-section">
          <button className="bazi-toc-toggle" onClick={() => setShowToc(!showToc)}>
            {showToc ? '收起目录 ▲' : '展开目录 ▼'}
          </button>
          {showToc && (
            <div className="bazi-toc-list">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`bazi-toc-item ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => { setActiveTab(tab.key); setShowToc(false) }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
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
            <>
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
            {/* V4.2 五行能量环可视化 */}
            <Card className="bazi-overview-card" style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              <FiveElementRing
                fiveElementCount={fiveElementCount}
                dayMasterElement={dayMaster.dayGanElement}
                size={200}
              />
            </Card>
            </>
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
              {shenShaCategories.map(category => (
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
                {/* V4.4 虚拟列表：大运条目少（~8 步）通常走全量渲染；超阈值时启用虚拟化 */}
                {dayunVirtualized ? (
                  <div
                    className="dayun-list dayun-list--virtual"
                    style={{ maxHeight: DAYUN_CONTAINER_HEIGHT, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
                    onScroll={(e) => setDayunScrollTop(e.currentTarget.scrollTop)}
                  >
                    <div style={{ height: dayunVirtual.total * DAYUN_ITEM_HEIGHT, position: 'relative' }}>
                      <div style={{ transform: `translateY(${dayunVirtual.offsetY}px)` }}>
                        {dayunVirtual.visibleItems.map((step, relIdx) =>
                          renderDayunItem(step, dayunVirtual.startIndex + relIdx)
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="dayun-list">
                    {daYun.steps.map((step, idx) => renderDayunItem(step, idx))}
                  </div>
                )}
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
                {/* V4.4 虚拟列表：流年 100 年长列表，超阈值启用虚拟化；展开某项时退回全量渲染 */}
                {liunianVirtualized ? (
                  <div
                    className="liunian-list liunian-list--virtual"
                    style={{ maxHeight: LIUNIAN_CONTAINER_HEIGHT, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
                    onScroll={(e) => setLiunianScrollTop(e.currentTarget.scrollTop)}
                  >
                    <div style={{ height: liunianVirtual.total * LIUNIAN_ITEM_HEIGHT, position: 'relative' }}>
                      <div style={{ transform: `translateY(${liunianVirtual.offsetY}px)` }}>
                        {liunianVirtual.visibleItems.map((year) => renderLiunianItem(year))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="liunian-list">
                    {liuNian.years.map((year) => renderLiunianItem(year))}
                  </div>
                )}
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

          {/* ===== 新增 8 个 Tab ===== */}

          {/* 命局总论 */}
          {activeTab === 'master' && masterSummary && (
            <div className="bazi-master-analysis">
              <Card className="bazi-master-card">
                <h3 className="card-title">命局总论</h3>
                {masterSummary.sections.map((sec, idx) => (
                  <div key={idx} className="bazi-master-section">
                    <div
                      className="bazi-master-section-header"
                      onClick={() => {
                        const next = new Set(expandedMaster)
                        next.has(idx) ? next.delete(idx) : next.add(idx)
                        setExpandedMaster(next)
                      }}
                    >
                      <h4 className="section-title">{sec.title}</h4>
                      <span className="bazi-master-section-toggle">
                        {expandedMaster.has(idx) ? '收起 ▲' : '展开 ▼'}
                      </span>
                    </div>
                    {expandedMaster.has(idx) && (
                      <div className="bazi-master-section-body">
                        {sec.content.split('\n').map((p, pi) => (
                          <p key={pi} className="section-text">{p}</p>
                        ))}
                        <button
                          className="bazi-copy-btn"
                          onClick={() => handleCopy(sec.content, `master-${idx}`)}
                        >
                          {copiedId === `master-${idx}` ? '已复制' : '复制文本'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  className="bazi-copy-btn"
                  onClick={() => handleCopy(masterSummary.fullText, 'master-full')}
                >
                  {copiedId === 'master-full' ? '已复制全文' : '复制全文'}
                </button>
              </Card>
            </div>
          )}

          {/* 四柱详解 */}
          {activeTab === 'pillars' && pillarAnalysis && (
            <div className="bazi-pillars-analysis">
              {(['year', 'month', 'day', 'hour'] as const).map(key => {
                const p = pillarAnalysis[key]
                const isOpen = expandedPillars.has(key)
                return (
                  <Card key={key} className="bazi-pillar-card">
                    <div
                      className="bazi-pillar-card-header"
                      onClick={() => {
                        const next = new Set(expandedPillars)
                        next.has(key) ? next.delete(key) : next.add(key)
                        setExpandedPillars(next)
                      }}
                    >
                      <h3 className="card-title">{p.label} ({p.gan}{p.zhi})</h3>
                      <span className="bazi-master-section-toggle">
                        {isOpen ? '收起 ▲' : '展开 ▼'}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="bazi-pillar-card-body">
                        {p.sections.map((s, si) => (
                          <div key={si} className="bazi-pillar-section">
                            <h4 className="section-title">{s.title}</h4>
                            <p className="section-text">{s.content}</p>
                          </div>
                        ))}
                        <div className="bazi-pillar-summary">
                          <h4 className="section-title">总评</h4>
                          <p className="section-text">{p.summary}</p>
                        </div>
                        <button
                          className="bazi-copy-btn"
                          onClick={() => handleCopy(p.sections.map(s => `${s.title}\n${s.content}`).join('\n\n'), `pillar-${key}`)}
                        >
                          {copiedId === `pillar-${key}` ? '已复制' : '复制文本'}
                        </button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* 十神详解 */}
          {activeTab === 'shishen-detail' && shiShenDetail && (
            <div className="bazi-shishen-detail-analysis">
              {shiShenDetail.items.map((item, idx) => {
                const isOpen = expandedShiShenDetail.has(idx)
                return (
                  <Card key={idx} className="bazi-shishen-detail-card">
                    <div
                      className="bazi-shishen-detail-header"
                      onClick={() => {
                        const next = new Set(expandedShiShenDetail)
                        next.has(idx) ? next.delete(idx) : next.add(idx)
                        setExpandedShiShenDetail(next)
                      }}
                    >
                      <h3 className="card-title">
                        {item.name}
                        <Badge variant={item.isFavorable ? 'success' : 'error'} size="sm">
                          {item.isFavorable ? '喜' : '忌'}
                        </Badge>
                        <Badge variant="default" size="sm">{item.element}</Badge>
                      </h3>
                      <span className="bazi-master-section-toggle">
                        {isOpen ? '收起 ▲' : '展开 ▼'}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="bazi-shishen-detail-body">
                        <p className="section-text">出现位置：{item.positions.join('、')}</p>
                        {item.analysis.map((a, ai) => (
                          <div key={ai} className="bazi-shishen-detail-section">
                            <h4 className="section-title">{a.title}</h4>
                            <p className="section-text">{a.content}</p>
                          </div>
                        ))}
                        <div className="bazi-shishen-detail-summary">
                          <h4 className="section-title">总体影响</h4>
                          <p className="section-text">{item.summary}</p>
                        </div>
                        <button
                          className="bazi-copy-btn"
                          onClick={() => handleCopy(item.summary, `shishen-${idx}`)}
                        >
                          {copiedId === `shishen-${idx}` ? '已复制' : '复制文本'}
                        </button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* 神煞详解 */}
          {activeTab === 'shensha-detail' && shenShaDetail && (
            <div className="bazi-shensha-detail-analysis">
              {shenShaDetail.items.map((item, idx) => {
                const isOpen = expandedShenShaDetail.has(idx)
                return (
                  <Card key={idx} className="bazi-shensha-detail-card">
                    <div
                      className="bazi-shensha-detail-header"
                      onClick={() => {
                        const next = new Set(expandedShenShaDetail)
                        next.has(idx) ? next.delete(idx) : next.add(idx)
                        setExpandedShenShaDetail(next)
                      }}
                    >
                      <h3 className="card-title">
                        {item.name}
                        <Badge variant={item.isAuspicious ? 'success' : 'error'} size="sm">
                          {item.isAuspicious ? '吉神' : '凶煞'}
                        </Badge>
                      </h3>
                      <span className="bazi-master-section-toggle">
                        {isOpen ? '收起 ▲' : '展开 ▼'}
                      </span>
                    </div>
                    {isOpen && (
                      <div className="bazi-shensha-detail-body">
                        <p className="section-text">出现位置：{item.position}</p>
                        {item.detail.map((d, di) => (
                          <div key={di} className="bazi-shensha-detail-section">
                            <h4 className="section-title">{d.title}</h4>
                            <p className="section-text">{d.content}</p>
                          </div>
                        ))}
                        <button
                          className="bazi-copy-btn"
                          onClick={() => handleCopy(item.detail.map(d => `${d.title}\n${d.content}`).join('\n\n'), `shensha-${idx}`)}
                        >
                          {copiedId === `shensha-${idx}` ? '已复制' : '复制文本'}
                        </button>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* 综合评分 */}
          {activeTab === 'score' && compScore && (
            <div className="bazi-score-analysis">
              <Card className="bazi-score-overview-card">
                <h3 className="card-title">综合评分</h3>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <svg width="280" height="280" viewBox="0 0 300 300" style={{ maxWidth: '100%' }}>
                    {/* 网格 */}
                    {getScoreRadarGrid(150, 150, 110, 4).map((pts, i) => (
                      <polygon key={`grid-${i}`} points={pts} fill="none" stroke="var(--border)" strokeWidth="0.5" />
                    ))}
                    {/* 轴线 */}
                    {compScore.radarData.map((_, i) => {
                      const angle = (i * 36 - 90) * Math.PI / 180
                      const x = 150 + 110 * Math.cos(angle)
                      const y = 150 + 110 * Math.sin(angle)
                      return <line key={`axis-${i}`} x1={150} y1={150} x2={x} y2={y} stroke="var(--border)" strokeWidth="0.5" />
                    })}
                    {/* 数据多边形 */}
                    <polygon
                      points={getScoreRadarPoints(compScore.radarData, 150, 150, 110)}
                      fill="rgba(99,102,241,0.2)"
                      stroke="var(--primary)"
                      strokeWidth="2"
                    />
                    {/* 顶点圆点 + 标签 */}
                    {compScore.dimensions.map((dim, i) => {
                      const angle = (i * 36 - 90) * Math.PI / 180
                      const val = compScore.radarData[i] / 100
                      const cx = 150 + 110 * val * Math.cos(angle)
                      const cy = 150 + 110 * val * Math.sin(angle)
                      const lx = 150 + 128 * Math.cos(angle)
                      const ly = 150 + 128 * Math.sin(angle)
                      return (
                        <g key={`label-${i}`}>
                          <circle cx={cx} cy={cy} r="3" fill="var(--primary)" />
                          <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="var(--text-secondary)">
                            {dim.name}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{compScore.overallScore}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: '4px' }}>{compScore.overallLevel}</span>
                  </div>
                </div>
              </Card>

              <Card className="bazi-score-bars-card">
                <h3 className="card-title">维度评分明细</h3>
                {compScore.dimensions.map((dim, idx) => (
                  <div key={idx} className="bazi-score-dim-row">
                    <div className="bazi-score-dim-label">{dim.name}</div>
                    <div className="bazi-score-dim-bar">
                      <div
                        className="dayun-score-fill"
                        style={{
                          width: `${dim.score}%`,
                          background: dim.score >= 80 ? 'var(--success)' : dim.score >= 60 ? 'var(--gold-500)' : dim.score >= 40 ? 'var(--warning)' : 'var(--error)',
                        }}
                      />
                    </div>
                    <div className="bazi-score-dim-value">{dim.score}分</div>
                    <div className="bazi-score-dim-level">
                      <Badge variant={dim.score >= 80 ? 'success' : dim.score >= 60 ? 'gold' : 'default'} size="sm">{dim.level}</Badge>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* 大运详解 */}
          {activeTab === 'dayun-detail' && dayunDetails.length > 0 && (
            <div className="bazi-dayun-detail-analysis">
              <Card className="bazi-dayun-detail-card">
                <h3 className="card-title">大运深度解析</h3>
                <div className="dayun-list">
                  {dayunDetails.map((detail: any, idx: number) => {
                    const step = daYun.steps[idx]
                    const isOpen = expandedDayunDetail === idx
                    return (
                      <div key={idx} className={`dayun-item ${idx === daYun.currentStepIndex ? 'dayun-item--current' : ''} ${isOpen ? 'dayun-item--expanded' : ''}`}>
                        <div
                          className="dayun-item-header"
                          onClick={() => setExpandedDayunDetail(isOpen ? null : idx)}
                        >
                          <div className="dayun-item-ganzhi">
                            <span className="dayun-gan">{detail.ganZhi}</span>
                          </div>
                          <div className="dayun-item-info">
                            <span className="dayun-item-age">{detail.ageRange}</span>
                            <span className="dayun-item-year">{detail.yearRange}</span>
                          </div>
                          <div className="dayun-item-score">
                            <Badge variant={detail.overallScore >= 70 ? 'success' : detail.overallScore >= 50 ? 'gold' : 'error'} size="sm">
                              {detail.overallScore}分
                            </Badge>
                          </div>
                          <span className="dayun-item-toggle">{isOpen ? '收起 ▲' : '展开 ▼'}</span>
                        </div>
                        {isOpen && (
                          <div className="dayun-item-detail">
                            <div className="dayun-detail-sections">
                              {detail.sections.map((s: any, si: number) => (
                                <div key={si} className="dayun-detail-section">
                                  <h4 className="section-title">{s.title}</h4>
                                  <p className="section-text">{s.content}</p>
                                </div>
                              ))}
                            </div>
                            <div className="dayun-detail-summary">
                              <h4 className="section-title">总体评述</h4>
                              <p className="section-text">{detail.summary}</p>
                            </div>
                            <button
                              className="bazi-copy-btn"
                              onClick={() => handleCopy(detail.sections.map((s: any) => `${s.title}\n${s.content}`).join('\n\n') + '\n\n总体评述\n' + detail.summary, `dayun-detail-${idx}`)}
                            >
                              {copiedId === `dayun-detail-${idx}` ? '已复制' : '复制文本'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* 流年详解 */}
          {activeTab === 'liunian-detail' && liunianDetails.length > 0 && (
            <div className="bazi-liunian-detail-analysis">
              <Card className="bazi-liunian-detail-card">
                <h3 className="card-title">流年深度解析</h3>
                <div className="liunian-list">
                  {liunianDetails.map((detail: any, idx: number) => {
                    const isOpen = expandedLiuNianDetail === idx
                    const year = liuNian.years[idx]
                    return (
                      <div key={idx} className={`liunian-item ${year?.isCurrentYear ? 'liunian-item--current' : ''} ${isOpen ? 'liunian-item--expanded' : ''}`}>
                        <div
                          className="liunian-item-header"
                          onClick={() => setExpandedLiuNianDetail(isOpen ? null : idx)}
                        >
                          <div className="liunian-item-year">{detail.year}年</div>
                          <div className="liunian-item-ganzhi">
                            <span className="liunian-gan">{detail.ganZhi}</span>
                          </div>
                          <div className="dayun-item-score">
                            <Badge variant={detail.overallScore >= 70 ? 'success' : detail.overallScore >= 50 ? 'gold' : 'error'} size="sm">
                              {detail.overallScore}分
                            </Badge>
                          </div>
                          <span className="liunian-item-toggle">{isOpen ? '收起 ▲' : '展开 ▼'}</span>
                        </div>
                        {isOpen && (
                          <div className="liunian-item-detail">
                            <div className="liunian-detail-sections">
                              {detail.sections.map((s: any, si: number) => (
                                <div key={si} className="liunian-detail-section">
                                  <h4 className="section-title">{s.title}</h4>
                                  <p className="section-text">{s.content}</p>
                                </div>
                              ))}
                            </div>
                            <div className="liunian-detail-summary">
                              <h4 className="section-title">总体评述</h4>
                              <p className="section-text">{detail.summary}</p>
                            </div>
                            <button
                              className="bazi-copy-btn"
                              onClick={() => handleCopy(detail.sections.map((s: any) => `${s.title}\n${s.content}`).join('\n\n') + '\n\n总体评述\n' + detail.summary, `liunian-detail-${idx}`)}
                            >
                              {copiedId === `liunian-detail-${idx}` ? '已复制' : '复制文本'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* 流月详解 */}
          {activeTab === 'liuyue-detail' && (
            <div className="bazi-liuyue-detail-analysis">
              <Card className="bazi-liuyue-detail-card">
                <h3 className="card-title">流月逐月分析</h3>
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
                <div className="liuyue-grid">
                  {liuYue.months.map((month) => {
                    const isOpen = expandedLiuYueDetail === month.monthIndex
                    return (
                      <div key={month.monthIndex} className={`liuyue-item ${isOpen ? 'liuyue-item--expanded' : ''}`}>
                        <div
                          className="liuyue-item-header"
                          onClick={() => setExpandedLiuYueDetail(isOpen ? null : month.monthIndex)}
                        >
                          <div className="liuyue-item-month">{month.monthName}</div>
                          <div className="liuyue-item-ganzhi">
                            <span className="liuyue-gan">{month.ganZhi.gan}</span>
                            <span className="liuyue-zhi">{month.ganZhi.zhi}</span>
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
                            {isOpen ? '▲' : '▼'}
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
                        {isOpen && (
                          <div className="liuyue-item-detail">
                            <h4 className="section-title">月份概述</h4>
                            <p className="section-text">{month.summary}</p>
                            <h4 className="section-title">注意事项</h4>
                            <p className="section-text">{month.notice}</p>
                            <div className="liuyue-item-relations">
                              {month.chong.length > 0 && <p><strong>冲：</strong>{month.chong.join('、')}</p>}
                              {month.he.length > 0 && <p><strong>合：</strong>{month.he.join('、')}</p>}
                              {month.xing.length > 0 && <p><strong>刑：</strong>{month.xing.join('、')}</p>}
                              {month.hai.length > 0 && <p><strong>害：</strong>{month.hai.join('、')}</p>}
                            </div>
                            <button
                              className="bazi-copy-btn"
                              onClick={() => handleCopy(`${month.monthName} ${month.ganZhi.gan}${month.ganZhi.zhi}\n${month.summary}\n注意事项：${month.notice}`, `liuyue-detail-${month.monthIndex}`)}
                            >
                              {copiedId === `liuyue-detail-${month.monthIndex}` ? '已复制' : '复制文本'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'report' && (
            <div>
              {/* V4.2 导出专业报告按钮 */}
              <div style={{ marginBottom: 12 }}>
                <Button variant="primary" onClick={handleExportProfessional}>
                  导出专业报告
                </Button>
              </div>
              <Suspense fallback={<Loading />}>
              <ReportExperience
                data={{
                dayGan: sixLines.day.gan,
                dayZhi: sixLines.day.zhi,
                monthGan: sixLines.month.gan,
                monthZhi: sixLines.month.zhi,
                yearGan: sixLines.year.gan,
                yearZhi: sixLines.year.zhi,
                hourGan: sixLines.hour.gan,
                hourZhi: sixLines.hour.zhi,
                dayElement: dayMaster.dayGanElement,
                overallScore: overallScore,
                gender: chartBirth.gender,
                birthDate: chartBirth.birthDate + ' ' + chartBirth.birthTime,
                geJu: geJu,
                xiYong: p?.xiYongShen!,
                strength: dayMaster,
                marriage: marriage,
                career: career,
                wealth: wealth,
                health: health,
                daYun: daYun,
                liuNian: liuNian,
                fengshui: fengshui,
                fullReport: fullReport,
              }}
              onSave={function() { handleSave() }}
            />
            </Suspense>
            </div>
          )}

          {/* ===== V4.2 新增 Tab ===== */}

          {/* 玄机问命 */}
          {activeTab === 'ask' && (
            <Card className="bazi-overview-card">
              <h3 className="card-title">玄机问命</h3>
              <p style={{ color: '#a89f8a', fontSize: 14, marginBottom: 16 }}>
                基于命盘数据的玄机推演，输入您的问题获得个性化命理解读
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <input
                  type="text"
                  className="bazi-ask-input"
                  value={askQuestion}
                  onChange={e => setAskQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskQuestion()}
                  placeholder="例如：我的事业运势如何？今年财运好吗？"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: '#141210',
                    border: '1px solid #3D3527',
                    borderRadius: 6,
                    color: '#F5F0E1',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
                <Button
                  variant="primary"
                  onClick={handleAskQuestion}
                  disabled={askLoading || !askQuestion.trim()}
                >
                  {askLoading ? '推演中...' : '问命'}
                </Button>
              </div>
              {askHistory.length > 0 && (
                <div className="bazi-ask-history">
                  <h4 style={{ color: '#D4A843', fontSize: 14, marginBottom: 12 }}>问答记录</h4>
                  {askHistory.map((item, i) => (
                    <div key={i} className="bazi-ask-item" style={{
                      background: i === 0 ? '#1A1714' : '#141210',
                      border: '1px solid #2A2520',
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ color: '#D4A843', fontSize: 12 }}>
                          {item.relatedAspects.join(' / ')}
                        </span>
                        <span style={{ color: '#6B6354', fontSize: 12 }}>
                          置信度 {item.confidence}%
                        </span>
                      </div>
                      <p style={{ color: '#F5F0E1', fontSize: 14, lineHeight: 1.8, marginBottom: 10 }}>
                        {item.answer}
                      </p>
                      {item.suggestions.length > 0 && (
                        <div style={{ borderTop: '1px solid #2A2520', paddingTop: 8 }}>
                          {item.suggestions.map((s, si) => (
                            <p key={si} style={{ color: '#A89F8A', fontSize: 13, margin: '4px 0' }}>
                              &bull; {s}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* 风水建议（baziFengShuiLink） */}
          {activeTab === 'fengshui-link' && fengShuiLinkMemo && (
            <div className="bazi-fengshui-link">
              <Card className="bazi-overview-card">
                <h3 className="card-title">八字风水联动建议</h3>
                <p style={{ color: '#a89f8a', fontSize: 14, marginBottom: 16 }}>
                  基于命盘喜用神五行推算的风水布局建议
                </p>

                {/* 有利方位 */}
                {fengShuiLinkMemo.favorableDirections.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ color: '#D4A843', fontSize: 15, marginBottom: 10 }}>有利方位</h4>
                    {fengShuiLinkMemo.favorableDirections.map((d, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', background: d.isFavorable ? '#1A1714' : '#141210',
                        border: '1px solid #2A2520', borderRadius: 6, marginBottom: 6,
                      }}>
                        <span style={{ color: '#F5F0E1', fontSize: 14 }}>
                          {d.direction}（{d.element}）
                        </span>
                        <span style={{
                          color: d.isFavorable ? '#5B8C5A' : '#C4453A',
                          fontSize: 13, fontWeight: 'bold',
                        }}>
                          {d.score}分
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 幸运颜色 */}
                {fengShuiLinkMemo.luckyColors.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ color: '#D4A843', fontSize: 15, marginBottom: 10 }}>幸运颜色</h4>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {fengShuiLinkMemo.luckyColors.map((c, i) => (
                        <span key={i} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 12px', background: '#1A1714', borderRadius: 20,
                          border: '1px solid #2A2520', fontSize: 13, color: '#F5F0E1',
                        }}>
                          <span style={{
                            width: 14, height: 14, borderRadius: '50%',
                            background: c.hex, display: 'inline-block',
                          }} />
                          {c.color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 幸运数字 */}
                {fengShuiLinkMemo.luckyNumbers.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ color: '#D4A843', fontSize: 15, marginBottom: 10 }}>幸运数字</h4>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {fengShuiLinkMemo.luckyNumbers.map((n, i) => (
                        <span key={i} style={{
                          width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: '#1A1714', border: '1px solid #3D3527', borderRadius: 6,
                          color: '#D4A843', fontSize: 16, fontWeight: 'bold',
                        }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 总体建议 */}
                {fengShuiLinkMemo.summary && (
                  <div style={{
                    padding: 16, background: '#141210', border: '1px solid #2A2520',
                    borderRadius: 8, marginTop: 12,
                  }}>
                    <h4 style={{ color: '#D4A843', fontSize: 15, marginBottom: 8 }}>总体建议</h4>
                    <p style={{ color: '#F5F0E1', fontSize: 14, lineHeight: 1.8 }}>
                      {fengShuiLinkMemo.summary}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* 年度运势 */}
          {activeTab === 'annual' && (
            <Card className="bazi-overview-card">
              <h3 className="card-title">年度运势</h3>
              <p style={{ color: '#a89f8a', fontSize: 14, marginBottom: 16 }}>
                基于命盘与流年干支的详细年度运势分析
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
                <label style={{ color: '#A89F8A', fontSize: 14 }}>选择年份：</label>
                <input
                  type="number"
                  value={annualYear}
                  onChange={e => setAnnualYear(parseInt(e.target.value) || new Date().getFullYear())}
                  min={1900}
                  max={2100}
                  style={{
                    width: 100, padding: '8px 12px',
                    background: '#141210', border: '1px solid #3D3527',
                    borderRadius: 6, color: '#F5F0E1', fontSize: 14, outline: 'none',
                  }}
                />
                <Button variant="primary" onClick={handleGenerateAnnual}>
                  生成运势
                </Button>
              </div>
              {annualResult && (
                <div className="bazi-annual-result">
                  <div style={{
                    padding: 16, background: '#1A1714', borderRadius: 8,
                    border: '1px solid #3D3527', marginBottom: 16,
                  }}>
                    <h4 style={{ color: '#D4A843', fontSize: 18, marginBottom: 8 }}>
                      {annualResult.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <span style={{ color: '#F5F0E1', fontSize: 20, fontWeight: 'bold' }}>
                        {annualResult.overallScore}分
                      </span>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: 13,
                        background: annualResult.overallScore >= 70 ? '#2E4A2E' : annualResult.overallScore >= 50 ? '#4A3E2E' : '#4A2E2E',
                        color: '#F5F0E1',
                      }}>
                        {annualResult.overallLevel}
                      </span>
                    </div>
                    <p style={{ color: '#A89F8A', fontSize: 14, lineHeight: 1.8 }}>
                      {annualResult.summary}
                    </p>
                  </div>

                  {/* 关键月份 */}
                  {annualResult.keyMonths.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ color: '#D4A843', fontSize: 15, marginBottom: 10 }}>关键月份</h4>
                      {annualResult.keyMonths.map((km, i) => (
                        <div key={i} style={{
                          padding: '8px 12px', background: km.type === 'best' ? '#1A2E1A' : '#2E1A1A',
                          border: '1px solid #2A2520', borderRadius: 6, marginBottom: 6,
                          display: 'flex', justifyContent: 'space-between',
                        }}>
                          <span style={{ color: km.type === 'best' ? '#5B8C5A' : '#C4453A', fontSize: 14, fontWeight: 'bold' }}>
                            {km.type === 'best' ? '吉' : '凶'} · {km.month}月
                          </span>
                          <span style={{ color: '#A89F8A', fontSize: 13 }}>{km.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 年度建议 */}
                  {annualResult.suggestions.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ color: '#D4A843', fontSize: 15, marginBottom: 10 }}>年度建议</h4>
                      {annualResult.suggestions.map((s, i) => (
                        <p key={i} style={{ color: '#F5F0E1', fontSize: 14, lineHeight: 1.6, marginBottom: 4 }}>
                          {i + 1}. {s}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* 月度运势概览 */}
                  {annualResult.months.length > 0 && (
                    <div>
                      <h4 style={{ color: '#D4A843', fontSize: 15, marginBottom: 10 }}>月度运势</h4>
                      {annualResult.months.map(m => (
                        <div key={m.month} style={{
                          padding: '10px 12px', background: '#141210',
                          border: '1px solid #2A2520', borderRadius: 6, marginBottom: 6,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ color: '#F5F0E1', fontSize: 14, fontWeight: 'bold' }}>
                              {m.monthName}
                            </span>
                            <span style={{ color: '#D4A843', fontSize: 13 }}>
                              综合 {m.overall.score}分
                            </span>
                          </div>
                          <p style={{ color: '#A89F8A', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                            {m.overall.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
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
          {/* V4.2 新增分享选项 */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" style={{ flex: 1 }} onClick={handleDownloadNineGrid}>
              九宫格
            </Button>
            <Button variant="ghost" style={{ flex: 1 }} onClick={handleDownloadLongImage}>
              长图海报
            </Button>
            <Button variant="ghost" style={{ flex: 1 }} onClick={handleDownloadWeChatCard}>
              微信卡片
            </Button>
          </div>
          {/* V4.2 导出专业报告 */}
          <Button variant="ghost" fullWidth onClick={handleExportProfessional}>
            导出专业报告
          </Button>
          <Button variant="ghost" fullWidth onClick={() => navigate('/bazi')}>
            重新排盘
          </Button>
        </div>

        {/* 海报弹窗 */}
        {showPoster && chart && (
          <Suspense fallback={null}>
          <BaziPoster
            chart={chart}
            onClose={() => setShowPoster(false)}
            geJu={p?.geJu?.name}
            dayMaster={`日元 ${chart.dayMaster.dayGan}${chart.dayMaster.dayGanElement}`}
            xiYongShen={`喜 ${chart.xiYongShen.happiness} 用 ${chart.xiYongShen.usage}`}
          />
          </Suspense>
        )}
      </div>
    </div>
  )
}
