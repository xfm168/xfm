import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBazi } from '../hooks/useBazi'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
import { calculateBaZiFromBirthData } from '../lib/bazi'
import { runBaZiPipelineFromBirthData } from '../lib/bazi/pipeline'
import type { BaZiPipelineResult } from '../lib/bazi/pipeline/types'
import type { BaZiChart, BaZiAnalysis, ShenShi } from '../lib/bazi/types'
import type { BirthData } from '@/lib/core'
import { DEFAULT_BAZI_ANALYSIS } from '../constants/defaultAnalysis'
import { usePageSEO } from '../hooks/usePageSEO'
import type { ReactNode } from 'react'
import {
  ChevronDown, ChevronRight, Loader2, Sparkles, Crown,
  FileText, Table2, BookOpen, LayoutGrid,
  Calendar, User, RefreshCw, Lock, ChevronLeft,
} from 'lucide-react'

import {
  buildProPaiPan,
  buildLiuRiForMonth,
  WUXING_COLORS,
  type ProPaiPan,
  type ProPillarInfo,
  type ProShenShaItem,
  type ProDaYunRow,
  type ProLiuNianRow,
  type ProLiuYueRow,
  type ProLiuRiRow,
} from '../lib/bazi/proPaipan'

import './BaziChart.css'

// ===== Tab 定义 =====
type TabKey = 'basic' | 'detail' | 'brief' | 'full'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'basic', label: '基本信息' },
  { key: 'detail', label: '细盘模式' },
  { key: 'brief', label: '简析测试' },
  { key: 'full', label: '详解分析' },
]
const TAB_ICONS: Record<TabKey, typeof LayoutGrid> = {
  basic: LayoutGrid,
  detail: Table2,
  brief: BookOpen,
  full: FileText,
}

// 五行颜色工具（颜色值由 proPaipan 常量统一）
function wxColor(el?: string | null): string {
  if (!el) return '#e8e0d0'
  return (WUXING_COLORS as any)[el] || '#e8e0d0'
}

// 十神简化字（用于细盘表格顶部小字展示：比肩→比，偏印→枭等）
const SHENSHI_SHORT: Record<ShenShi | string, string> = {
  比肩: '比', 劫财: '劫', 食神: '食', 伤官: '伤',
  偏财: '偏', 正财: '才', 偏官: '杀', 正官: '官',
  偏印: '枭', 正印: '印',
}

// 将长文本按段落拆分
function toParagraphs(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#') && !l.startsWith('##'))
    .map(l => l.replace(/^[-•]\s*/, ''))
}

// 主组件
export default function BaziChart() {
  const location = useLocation()
  const navigate = useNavigate()
  const { charts } = useBazi()

  const birthData = (location.state as { birthData?: BirthData } | null)?.birthData ?? null

  const [chart] = useState<BaZiChart | null>(() => {
    if (birthData) {
      try {
        return calculateBaZiFromBirthData(birthData)
      } catch {
        return null
      }
    }
    if (charts.length > 0) return charts[0]
    return null
  })

  const [activeTab, setActiveTab] = useState<TabKey>('basic')
  const [pipelineResult, setPipelineResult] = useState<BaZiPipelineResult | null>(null)
  const [analysisReady, setAnalysisReady] = useState(false)
  const [loadingText, setLoadingText] = useState('排盘分析中…')
  const [progress, setProgress] = useState(0)

  usePageSEO({
    title: '八字命盘 · 排盘解析 - 玄风门',
    description: '玄风门八字排盘，四柱八字命理分析，大运流年推演，格局喜用神详解。',
    keywords: '八字,四柱,排盘,大运,流年,格局,喜用神,命理',
  })

  // 运行 Pipeline
  useEffect(() => {
    if (!chart || analysisReady) return undefined
    let cancelled = false
    const bd: BirthData = birthData ?? {
      birthday: chart.birthInfo.birthDate,
      birthTime: chart.birthInfo.birthTime,
      gender: chart.birthInfo.gender,
      timezone: 'Asia/Shanghai',
    }
    runBaZiPipelineFromBirthData(
      {
        birthData: bd,
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
      (event) => {
        if (cancelled) return
        setLoadingText(event.stepName)
        setProgress(event.progress)
      },
    )
      .then((result) => {
        if (!cancelled) {
          setPipelineResult(result)
          setAnalysisReady(true)
        }
      })
      .catch((err) => {
        console.error('Pipeline 执行失败', err)
        if (!cancelled) setAnalysisReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [chart, analysisReady, birthData])

  // 专业排盘聚合层（基于 chart + pipelineResult）
  const proPaiPan: ProPaiPan | null = useMemo(() => {
    if (!chart) return null
    return buildProPaiPan(chart, pipelineResult, birthData)
  }, [chart, pipelineResult, birthData])

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
    autoFetch: activeTab === 'full' && !!chart,
  })

  if (!chart) {
    return (
      <div className="bazi-page">
        <div className="bazi-empty">
          <div className="bazi-empty-title">未找到命盘数据</div>
          <button className="bazi-back-btn" onClick={() => navigate('/bazi')}>
            返回排盘
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bazi-page">
      {/* 顶部返回栏 */}
      <div className="bazi-topbar">
        <button className="bazi-back-btn" onClick={() => navigate('/bazi')}>
          <ChevronLeft size={16} />
          返回
        </button>
        <div className="bazi-topbar-title">八字命盘</div>
        <div className="bazi-topbar-meta">
          <Calendar size={13} />
          <span>{chart.birthInfo.birthDate} {chart.birthInfo.birthTime}</span>
          <User size={13} />
          <span>{gender}</span>
        </div>
      </div>

      {/* Tab Bar */}
      <nav className="bazi-tabbar">
        <div className="bazi-tabbar-inner">
          {TABS.map((t) => {
            const Icon = TAB_ICONS[t.key]
            const active = activeTab === t.key
            return (
              <button
                key={t.key}
                className={`bazi-tab ${active ? 'active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 内容区 */}
      <main className="bazi-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {!analysisReady ? (
              <LoadingScreen text={loadingText} progress={progress} />
            ) : activeTab === 'basic' ? (
              proPaiPan ? <Tab1BasicInfoV2 pro={proPaiPan} /> : <LoadingScreen text="生成排盘" progress={90} />
            ) : activeTab === 'detail' ? (
              proPaiPan ? (
                <Tab2DetailChartV2
                  pro={proPaiPan}
                  chart={chart!}
                  pipeline={pipelineResult}
                />
              ) : <LoadingScreen text="生成细盘" progress={90} />
            ) : activeTab === 'brief' ? (
              <Tab3BriefAnalysis chart={chart!} pipelineResult={pipelineResult} />
            ) : (
              <Tab4FullReport
                chart={chart!}
                pipelineResult={pipelineResult}
                analysis={analysis}
                aiLoading={aiLoading}
                aiError={aiError}
                onRetry={retryAnalysis}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ===== Loading 界面 =====
function LoadingScreen({ text, progress }: { text: string; progress: number }) {
  return (
    <div className="bazi-loading">
      <div className="taiji-spin">
        <div className="taiji" />
      </div>
      <div className="bazi-loading-text">{text}…</div>
      <div className="bazi-loading-bar">
        <motion.div
          className="bazi-loading-bar-fill"
          animate={{ width: `${Math.max(8, progress)}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <div className="bazi-loading-hint">正在推演命局，请稍候</div>
    </div>
  )
}

// ============================================================================
//  Tab 1：基本信息（完全按截图一：出生头信息 + 四柱卡 + 排盘表 + 神煞表 + 留意）
// ============================================================================

function Tab1BasicInfoV2({ pro }: { pro: ProPaiPan }) {
  const [Y, M, D, H] = pro.pillars
  const b = pro.birth

  // 天干留意文字拼接：先六合+冲，再生克
  const ganLiuYi: string[] = [
    ...pro.relations.tianGanLiuYi,
    ...pro.relations.tianGanShengKe,
  ]
  // 地支留意：冲/合/三会/三合/半合/刑/害/破/穿
  const zhiLiuYi: string[] = [
    ...pro.relations.diZhiChong,
    ...pro.relations.diZhiHe,
    ...pro.relations.diZhiSanHui,
    ...pro.relations.diZhiSanHe,
    ...pro.relations.diZhiBanHe,
    ...pro.relations.diZhiXing,
    ...pro.relations.diZhiHai,
    ...pro.relations.diZhiPo,
    ...pro.relations.diZhiChuan,
  ]

  return (
    <div className="tab1v2">
      {/* === 顶部出生信息 === */}
      <section className="p-birth">
        <div className="p-birth-title">
          <span className="p-birth-ganzao">{b.ganZaoLabel}</span>
          <span className="p-birth-sep">（</span>
          <span className="p-birth-nan">{b.gender === 'male' ? '男' : '女'}</span>
          <span className="p-birth-sep">）</span>
          <span className="p-birth-sep">·</span>
          <span>生肖属{b.zodiac}</span>
          <span className="p-birth-sep">·</span>
          <span className="p-birth-nayin">{b.yearNaYin}命</span>
        </div>
        <div className="p-birth-line">
          <span className="p-birth-label">公历时间：</span>
          <span>{b.solarDate}</span>
        </div>
        <div className="p-birth-line">
          <span className="p-birth-label">农历时间：</span>
          <span>{b.lunarDate}</span>
        </div>
        <div className="p-birth-line p-birth-qiyun">
          <span>{b.qiYunLabel}</span>
        </div>
        {b.qiYunDate && (
          <div className="p-birth-line p-birth-qiyun-date">
            <span>{b.qiYunDate}</span>
          </div>
        )}
      </section>

      {/* === 四柱卡片区（按截图一的 4 列） === */}
      <section className="p-pillars">
        {pro.pillars.map((p) => (
          <PillarCardV2 key={p.pillarKey} p={p} isDay={p.pillarKey === 'day'} gender={pro.birth.gender} />
        ))}
      </section>

      {/* === 排盘数据表 === */}
      <section className="p-scroll">
        <table className="p-table">
          <thead>
            <tr>
              <th className="p-th-label">柱位</th>
              {pro.pillars.map(p => (
                <th key={p.pillarKey} className="p-th-pillar">{p.pillarName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 天干行 */}
            <tr>
              <td className="p-td-label">天干</td>
              {pro.pillars.map(p => (
                <td key={p.pillarKey} className="p-td-center">
                  <span className="p-gan-char" style={{ color: p.ganColor }}>{p.gan}</span>
                  {p.ganShenShi && <span className="p-shishen-top">{p.ganShenShi}</span>}
                </td>
              ))}
            </tr>
            {/* 地支行 */}
            <tr>
              <td className="p-td-label">地支</td>
              {pro.pillars.map(p => (
                <td key={p.pillarKey} className="p-td-center">
                  <span className="p-zhi-char" style={{ color: p.zhiColor }}>{p.zhi}</span>
                  {p.zhiShenShi && <span className="p-shishen-top">{p.zhiShenShi}</span>}
                </td>
              ))}
            </tr>
            {/* 藏干行 */}
            <tr>
              <td className="p-td-label">藏干</td>
              {pro.pillars.map(p => (
                <td key={p.pillarKey} className="p-td-center">
                  <div className="p-canggan-col">
                    {p.cangGanList.length === 0 && <span className="p-canggan-empty">-</span>}
                    {p.cangGanList.map((c, i) => (
                      <div key={i} className="p-canggan-row">
                        <span style={{ color: wxColor(c.element) }}>{c.gan}</span>
                        <span className="p-canggan-el">（{c.element}）</span>
                        {c.shenShi && <span className="p-canggan-ss">{c.shenShi}</span>}
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
            {/* 纳音行 */}
            <tr>
              <td className="p-td-label">纳音</td>
              {pro.pillars.map(p => (
                <td key={p.pillarKey} className="p-td-center">
                  <span className="p-nayin">{p.naYin}</span>
                </td>
              ))}
            </tr>
            {/* 空亡行 */}
            <tr>
              <td className="p-td-label">空亡</td>
              {pro.pillars.map(p => (
                <td key={p.pillarKey} className="p-td-center">
                  <span className="p-kongwang">{p.kongWang.join('、')}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* === 神煞按柱表 === */}
      <section className="p-scroll">
        <table className="p-table">
          <thead>
            <tr>
              <th className="p-th-label">神煞</th>
              {pro.pillars.map(p => (
                <th key={p.pillarKey} className="p-th-pillar">{p.pillarName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-td-label">本柱神煞</td>
              {pro.pillars.map(p => (
                <td key={p.pillarKey} className="p-td-center">
                  <div className="p-shensha-col">
                    {p.shenShaList.length === 0 && <span className="p-shensha-empty">-</span>}
                    {p.shenShaList.map((s, i) => (
                      <span
                        key={i}
                        className={`p-shensha-tag ${s.auspicious === '吉' ? 'ji' : s.auspicious === '凶' ? 'xiong' : ''}`}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* === 天干留意 / 地支留意 === */}
      <section className="p-liuyi">
        <div className="p-liuyi-row">
          <span className="p-liuyi-label">天干留意</span>
          <span className="p-liuyi-text">
            {ganLiuYi.length ? ganLiuYi.join(' / ') : '无明显冲合克'}
          </span>
        </div>
        <div className="p-liuyi-row">
          <span className="p-liuyi-label">地支留意</span>
          <span className="p-liuyi-text">
            {zhiLiuYi.length ? zhiLiuYi.join(' / ') : '无明显冲合刑害'}
          </span>
        </div>
      </section>
    </div>
  )
}

// 通用：渲染十神简化字+颜色（若有五行）
function ShiShenBadge({ text, color }: { text?: string | null; color: string }) {
  if (!text) return <span className="pg-shi">&nbsp;</span>
  const short = (SHENSHI_SHORT as any)[text] || text
  return <span className="pg-shi" style={{ color }}>{short}</span>
}

// Tab2 地支行格子：按截图二 100% 复刻
// 结构：顶（本气十神）+ 中央（地支大字）+ 右侧竖排（中气/余气十神）
function Tab2ZhiCell({
  zhi,
  zhiColor,
  cangGanList,
}: {
  zhi: string
  zhiColor: string
  cangGanList: { element: string; shenShi: string | null }[]
}) {
  const first = cangGanList[0]
  const rest = cangGanList.slice(1)
  return (
    <div className="pg-zhi-cell">
      {first && (
        <div className="pg-zhi-top-ss">
          <ShiShenBadge text={first.shenShi} color={wxColor(first.element)} />
        </div>
      )}
      <div className="pg-zhi-body">
        <span style={{ color: zhiColor }} className="pg-gz-zhi">{zhi}</span>
        {rest.length > 0 && (
          <div className="pg-zhi-right-ss">
            {rest.map((c, i) => (
              <ShiShenBadge key={i} text={c.shenShi} color={wxColor(c.element)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 四柱卡片（截图一上部：每柱 = 纳音 + 天干大字 + 地支大字 + 藏干 3 小字）
function PillarCardV2({ p, isDay, gender }: { p: ProPillarInfo; isDay: boolean; gender: 'male' | 'female' }) {
  return (
    <div className={`p-card ${isDay ? 'day-card' : ''}`}>
      <div className="p-card-nayin">{p.naYin}</div>
      <div className="p-card-gan-wrap">
        {p.ganShenShi && <div className="p-card-ss-top">{p.ganShenShi}</div>}
        <div className="p-card-gan" style={{ color: p.ganColor }}>
          {p.gan}
          {isDay && <span className="p-card-yuan">{gender === 'male' ? '男' : '女'}</span>}
        </div>
      </div>
      <div className="p-card-zhi-wrap">
        {p.zhiShenShi && <div className="p-card-ss-top">{p.zhiShenShi}</div>}
        <div className="p-card-zhi" style={{ color: p.zhiColor }}>{p.zhi}</div>
      </div>
      <div className="p-card-canggan">
        {p.cangGanList.map((c, i) => (
          <div key={i} className="p-card-cg-row">
            <span style={{ color: wxColor(c.element) }}>{c.gan}</span>
            {c.shenShi && <span className="p-card-cg-ss">{SHENSHI_SHORT[c.shenShi] || c.shenShi}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
//  Tab 2：细盘模式（按截图二：列=日期/流日/流月/流年/大运/年/月/日/时，行=岁年/天干/地支/空亡 + 大运行 + 流年行 + 流月行 + 流日行 + 留意 + 神煞）
// ============================================================================

function Tab2DetailChartV2({
  pro,
  chart,
  pipeline,
}: {
  pro: ProPaiPan
  chart: BaZiChart
  pipeline: BaZiPipelineResult | null
}) {
  // 列：9 列（日期、流日、流月、流年、大运、年、月、日、时）
  // 行：岁年、天干、地支、空亡、大运、流年、流月、流日、天干留意、地支留意、大运神煞、流年神煞、流月神煞、流日神煞

  const birthYear = parseInt((chart.birthInfo.birthDate || '1990').split('-')[0], 10)

  // 流月选中状态（用于展示流日）
  const [selLiuYueIdx, setSelLiuYueIdx] = useState<number>(0)
  // 流日缓存（懒加载）
  const [liuRiRows, setLiuRiRows] = useState<ProLiuRiRow[]>([])
  const [liuRiLoading, setLiuRiLoading] = useState(false)
  const selLiuYue = pro.liuYue[selLiuYueIdx] ?? null

  const loadLiuRi = useCallback((idx: number) => {
    setSelLiuYueIdx(idx)
    const yue = pro.liuYue[idx]
    if (!yue) return
    // 如果该月已在本年范围内，按当前流年的年份（或当前年）
    const baseYear = pro.liuNian.find(x => x.isCurrent)?.year ?? new Date().getFullYear()
    setLiuRiLoading(true)
    setTimeout(() => {
      const rows = buildLiuRiForMonth(chart, baseYear, yue)
      setLiuRiRows(rows)
      setLiuRiLoading(false)
    }, 30)
  }, [pro.liuYue, pro.liuNian, chart])

  // 构造列集合：前 5 列（日期、流日、流月、流年、大运）动态生成内容，后 4 列 = 四柱
  const pillarCols = pro.pillars

  // 选中的大运
  const curDaYun: ProDaYunRow | undefined = pro.daYun.find(x => x.isCurrent) ?? pro.daYun[0]
  // 选中的流年（当前年或大运首年）
  const curLiuNian: ProLiuNianRow | undefined = pro.liuNian.find(x => x.isCurrent)
    ?? (curDaYun ? pro.liuNian.find(x => x.year >= curDaYun.startYear && x.year <= curDaYun.endYear) : undefined)

  // 当前流年下的流月（如果当前 pipeline 的liuYue不是本年，则尝试匹配）
  const liuYueRows = pro.liuYue

  return (
    <div className="tab2v2">
      {/* === 主表格：前 5 列 + 4 柱 === */}
      <section className="p-scroll p-scroll-x">
        <table className="p-grid-table">
          <thead>
            <tr>
              <th className="pg-th pg-th-label">日期</th>
              <th className="pg-th">流日</th>
              <th className="pg-th">流月</th>
              <th className="pg-th">流年</th>
              <th className="pg-th">大运</th>
              {pillarCols.map(p => (
                <th key={p.pillarKey} className="pg-th pg-th-pillar">{p.pillarName}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 岁年行 */}
            <tr>
              <td className="pg-td-label">岁年</td>
              <td className="pg-td">-</td>
              <td className="pg-td">-</td>
              <td className="pg-td">
                <div className="pg-age">{curLiuNian ? `${curLiuNian.age}岁` : '-'}</div>
                <div className="pg-year">{curLiuNian?.year ?? '-'}</div>
              </td>
              <td className="pg-td">
                <div className="pg-age">{curDaYun ? `${curDaYun.startAge}岁` : '-'}</div>
                <div className="pg-year">{curDaYun?.startYear ?? '-'}</div>
              </td>
              {pillarCols.map(p => (
                <td key={p.pillarKey} className="pg-td pg-star">*</td>
              ))}
            </tr>

            {/* 天干行：十神在天干上方，十神按对应天干五行上色 */}
            <tr>
              <td className="pg-td-label">天干</td>
              <td className="pg-td">-</td>
              <td className="pg-td">
                {selLiuYue && (
                  <div className="pg-gz-stack">
                    <ShiShenBadge text={selLiuYue.ganShenShi} color={wxColor(selLiuYue.ganElement)} />
                    <span style={{ color: wxColor(selLiuYue.ganElement) }} className="pg-gz-gan">{selLiuYue.gan}</span>
                  </div>
                )}
              </td>
              <td className="pg-td">
                {curLiuNian && (
                  <div className="pg-gz-stack">
                    <ShiShenBadge text={curLiuNian.ganShenShi} color={wxColor(curLiuNian.ganElement)} />
                    <span style={{ color: wxColor(curLiuNian.ganElement) }} className="pg-gz-gan">{curLiuNian.gan}</span>
                  </div>
                )}
              </td>
              <td className="pg-td">
                {curDaYun && (
                  <div className="pg-gz-stack">
                    <ShiShenBadge text={curDaYun.ganShenShi} color={wxColor(curDaYun.ganElement)} />
                    <span style={{ color: wxColor(curDaYun.ganElement) }} className="pg-gz-gan">{curDaYun.gan}</span>
                  </div>
                )}
              </td>
              {pillarCols.map(p => (
                <td key={p.pillarKey} className="pg-td">
                  <div className="pg-gz-stack">
                    {p.pillarKey === 'day' ? (
                      <span className="pg-shi pg-shi-yuan">元</span>
                    ) : (
                      <ShiShenBadge text={p.ganShenShi} color={p.ganColor} />
                    )}
                    <span style={{ color: p.ganColor }} className="pg-gz-gan">
                      {p.gan}
                      {p.pillarKey === 'day' && <span className="pg-yuan-badge">{pro.birth.gender === 'male' ? '男' : '女'}</span>}
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* 地支行（按截图二：顶本气十神 + 大字地支 + 右侧竖排中余气十神） */}
            <tr>
              <td className="pg-td-label">地支</td>
              <td className="pg-td">-</td>
              <td className="pg-td">
                {selLiuYue && (
                  <Tab2ZhiCell
                    zhi={selLiuYue.zhi}
                    zhiColor={wxColor(selLiuYue.zhiElement)}
                    cangGanList={selLiuYue.cangGanList || [{ element: selLiuYue.zhiElement, shenShi: selLiuYue.zhiShenShi }]}
                  />
                )}
              </td>
              <td className="pg-td">
                {curLiuNian && (
                  <Tab2ZhiCell
                    zhi={curLiuNian.zhi}
                    zhiColor={wxColor(curLiuNian.zhiElement)}
                    cangGanList={curLiuNian.cangGanList || [{ element: curLiuNian.zhiElement, shenShi: curLiuNian.zhiShenShi }]}
                  />
                )}
              </td>
              <td className="pg-td">
                {curDaYun && (
                  <Tab2ZhiCell
                    zhi={curDaYun.zhi}
                    zhiColor={wxColor(curDaYun.zhiElement)}
                    cangGanList={curDaYun.cangGanList || [{ element: curDaYun.zhiElement, shenShi: curDaYun.zhiShenShi }]}
                  />
                )}
              </td>
              {pillarCols.map(p => (
                <td key={p.pillarKey} className="pg-td">
                  <Tab2ZhiCell
                    zhi={p.zhi}
                    zhiColor={p.zhiColor}
                    cangGanList={p.cangGanList}
                  />
                </td>
              ))}
            </tr>

            {/* 空亡行 */}
            <tr>
              <td className="pg-td-label">空亡</td>
              <td className="pg-td">-</td>
              <td className="pg-td pg-kw">{selLiuYue ? getKW(selLiuYue.gan, selLiuYue.zhi) : '-'}</td>
              <td className="pg-td pg-kw">{curLiuNian ? getKW(curLiuNian.gan, curLiuNian.zhi) : '-'}</td>
              <td className="pg-td pg-kw">{curDaYun ? getKW(curDaYun.gan, curDaYun.zhi) : '-'}</td>
              {pillarCols.map(p => (
                <td key={p.pillarKey} className="pg-td pg-kw">{p.kongWang.join('')}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* === 大运行（截图二：单列 7 步大运，每格=年龄/年份+长生+干支，灰色高亮当前） === */}
      <section className="p-scroll p-scroll-x">
        <table className="p-grid-table">
          <thead>
            <tr>
              <th className="pg-th pg-th-label" style={{ width: 80 }}>大运</th>
              {pro.daYun.map(d => (
                <th key={d.index} className={`pg-th ${d.isCurrent ? 'pg-th-cur' : ''}`}>{d.startAge}岁</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pg-td-label">大运</td>
              {pro.daYun.map(d => (
                <td key={d.index} className={`pg-td pg-dayun-cell ${d.isCurrent ? 'sel' : ''}`}>
                  <div className="pg-dayun-age">{d.startAge}岁</div>
                  <div className="pg-dayun-year">{d.startYear}</div>
                  <div className="pg-dayun-cs">（{d.changSheng ?? '-'}）</div>
                  <div className="pg-dayun-gz">
                    <span style={{ color: wxColor(d.ganElement) }}>{d.gan}</span>
                    <span style={{ color: wxColor(d.zhiElement) }}>{d.zhi}</span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* === 流年行（12 年，以当前流年为中心） === */}
      <section className="p-scroll p-scroll-x">
        <table className="p-grid-table">
          <thead>
            <tr>
              <th className="pg-th pg-th-label" style={{ width: 80 }}>流年</th>
              {pro.liuNian.map(ln => (
                <th key={ln.year} className={`pg-th ${ln.isCurrent ? 'pg-th-cur' : ''}`}>{ln.year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pg-td-label">流年</td>
              {pro.liuNian.map(ln => (
                <td key={ln.year} className={`pg-td ${ln.isCurrent ? 'sel' : ''}`}>
                  <div className="pg-liunian-year">{ln.year}</div>
                  <div className="pg-liunian-gz">
                    <span style={{ color: wxColor(ln.ganElement) }}>{ln.gan}</span>
                    <span style={{ color: wxColor(ln.zhiElement) }}>{ln.zhi}</span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* === 流月行（12 节气月 + 可点击切换） === */}
      <section className="p-scroll p-scroll-x">
        <table className="p-grid-table">
          <thead>
            <tr>
              <th className="pg-th pg-th-label" style={{ width: 80 }}>流月</th>
              {liuYueRows.map((ly, i) => (
                <th key={i} className={`pg-th ${i === selLiuYueIdx ? 'pg-th-cur' : ''}`}>{ly.solarTerm}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pg-td-label">流月</td>
              {liuYueRows.map((ly, i) => (
                <td
                  key={i}
                  className={`pg-td pg-clickable ${i === selLiuYueIdx ? 'sel' : ''}`}
                  onClick={() => loadLiuRi(i)}
                >
                  <div className="pg-liuyue-term">{ly.solarTerm}</div>
                  <div className="pg-liuyue-gz">
                    <span style={{ color: wxColor(ly.ganElement) }}>{ly.gan}</span>
                    <span style={{ color: wxColor(ly.zhiElement) }}>{ly.zhi}</span>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      {/* === 流日行（点击流月后出现，未选则显示"请选择流月"） === */}
      <section className="p-scroll p-scroll-x">
        <table className="p-grid-table">
          <tbody>
            <tr>
              <td className="pg-td-label" style={{ width: 80 }}>流日</td>
              <td
                colSpan={Math.max(12, liuRiRows.length)}
                className="pg-td pg-liuri-wrap"
              >
                {!selLiuYue && <span className="pg-liuri-empty">请选择流月</span>}
                {selLiuYue && liuRiLoading && (
                  <span className="pg-liuri-loading">
                    <Loader2 size={14} className="spin" /> 正在加载流日…
                  </span>
                )}
                {selLiuYue && !liuRiLoading && (
                  <div className="pg-liuri-grid">
                    {liuRiRows.map(r => (
                      <div key={r.date} className="pg-liuri-cell">
                        <div className="pg-liuri-d">{r.date.slice(5)}</div>
                        <div className="pg-liuri-gz">
                          <span style={{ color: wxColor(r.ganElement) }}>{r.gan}</span>
                          <span style={{ color: wxColor(r.zhiElement) }}>{r.zhi}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* === 天干留意 / 地支留意 / 神煞 行 === */}
      <section className="p-scroll p-scroll-x">
        <table className="p-grid-table pg-relation-table">
          <tbody>
            <tr>
              <td className="pg-td-label" style={{ width: 100 }}>天干留意</td>
              <td className="pg-td pg-left">
                {[...pro.relations.tianGanLiuYi, ...pro.relations.tianGanShengKe].join(' / ') || '无'}
              </td>
            </tr>
            <tr>
              <td className="pg-td-label">地支留意</td>
              <td className="pg-td pg-left">
                {[
                  ...pro.relations.diZhiChong,
                  ...pro.relations.diZhiHe,
                  ...pro.relations.diZhiSanHui,
                  ...pro.relations.diZhiSanHe,
                  ...pro.relations.diZhiBanHe,
                  ...pro.relations.diZhiXing,
                  ...pro.relations.diZhiHai,
                  ...pro.relations.diZhiPo,
                  ...pro.relations.diZhiChuan,
                ].join(' / ') || '无'}
              </td>
            </tr>
            <tr>
              <td className="pg-td-label">大运神煞</td>
              <td className="pg-td pg-left">
                {curDaYun ? shenShaInline(curDaYun.shenSha) : '-'}
              </td>
            </tr>
            <tr>
              <td className="pg-td-label">流年神煞</td>
              <td className="pg-td pg-left">
                {curLiuNian ? shenShaInline(curLiuNian.shenSha) : '-'}
              </td>
            </tr>
            <tr>
              <td className="pg-td-label">流月神煞</td>
              <td className="pg-td pg-left">
                {selLiuYue ? shenShaInline(selLiuYue.shenSha) : '-'}
              </td>
            </tr>
            <tr>
              <td className="pg-td-label">流日神煞</td>
              <td className="pg-td pg-left">
                {selLiuYue && liuRiRows.length > 0 ? (
                  <div className="pg-liuri-shensha">
                    {liuRiRows.slice(0, 10).map(r => (
                      <span key={r.date} className="pg-liuri-ss-cell">
                        <span className="pg-liuri-ss-date">{r.date.slice(5)}</span>
                        <span className="pg-liuri-ss-text">{shenShaInline(r.shenSha)}</span>
                      </span>
                    ))}
                    {liuRiRows.length > 10 && <span className="pg-liuri-ss-more">…等共 {liuRiRows.length} 日</span>}
                  </div>
                ) : '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}

// 工具：内联神煞展示（以空格分隔，吉金、凶红）
function shenShaInline(list: ProShenShaItem[]): string {
  if (!list || list.length === 0) return '-'
  return list.map(x => x.name).join('、')
}

// 工具：空亡计算（复用 proPaipan 里的算法）
function getKW(gan: string, zhi: string): string {
  const S = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
  const B: string[] = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
  const gi = S.indexOf(gan)
  const zi = B.indexOf(zhi)
  if (gi < 0 || zi < 0) return '-'
  const off = ((zi - gi) % 12 + 12) % 12
  return B[(off + 10) % 12] + B[(off + 11) % 12]
}

// ============================================================================
//  Tab 3：简析测试（保留原先展开式，轻量调整适配风格）
// ============================================================================

interface BriefModule {
  title: string
  icon: typeof BookOpen
  paragraphs: string[]
}
function Tab3BriefAnalysis({
  chart,
  pipelineResult,
}: {
  chart: BaZiChart
  pipelineResult: BaZiPipelineResult | null
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const ZODIAC: Record<string, string> = {
    子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇',
    午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪',
  }

  const modules: BriefModule[] = useMemo(() => {
    const { dayMaster, sixLines } = chart
    const yearZhi = sixLines?.year?.zhi
    const zodiac = yearZhi ? ZODIAC[yearZhi] : ''
    const fp = pipelineResult?.fiveElementPower
    const geJu = pipelineResult?.geJu
    const wealth = pipelineResult?.wealth
    const marriage = pipelineResult?.marriage
    const career = pipelineResult?.career
    const health = pipelineResult?.health

    return [
      {
        title: '日柱命理',
        icon: Crown,
        paragraphs: [
          `日主为${dayMaster.dayGan}，五行属${dayMaster.dayGanElement}（${dayMaster.dayGanYinYang}干）。当前旺衰为「${dayMaster.wangShuai}」，日主强度评分约 ${dayMaster.strengthScore} 分。`,
          `日柱为${sixLines.day.gan}${sixLines.day.zhi}，纳音「${sixLines.day.naYin || '—'}」，代表命主自身的先天禀赋与中年运势走向。`,
        ],
      },
      {
        title: '生肖分析',
        icon: User,
        paragraphs: [
          `命主生于${sixLines.year.gan}${sixLines.year.zhi}年，生肖属${zodiac || '—'}，年柱纳音「${sixLines.year.naYin || '—'}」。`,
          `年柱代表祖业根基与早年运势，生肖${zodiac || ''}的性格特质会在命主早年与家庭关系中有所体现。`,
        ],
      },
      {
        title: '日元旺衰',
        icon: Sparkles,
        paragraphs: [
          fp?.wangShuaiLevel
            ? `五行力量综合判定日主为「${fp.wangShuaiLevel}」。`
            : `日主旺衰为「${dayMaster.wangShuai}」，强度评分 ${dayMaster.strengthScore}。`,
          fp
            ? `得令：${fp.deLing ? '是' : '否'}；得地：${fp.deDi ? '是' : '否'}；得势：${fp.deShi ? '是' : '否'}。主导五行为${fp.dominant ?? '—'}，最弱五行为${fp.weakest ?? '—'}。`
            : `日主${dayMaster.dayGan}${dayMaster.dayGanElement}的力量需结合月令、通根、透干综合判定。`,
        ],
      },
      {
        title: '财运格局',
        icon: Crown,
        paragraphs: [
          geJu?.name
            ? `命局主格为「${geJu.name}」（${geJu.category ?? ''}），成格评分 ${geJu.score ?? '-'}，可信度 ${geJu.confidence ?? '-'}%。${geJu.poGe ? '此格存在破格之象。' : ''}`
            : '格局分析中…',
          ...(geJu?.description ? [geJu.description] : []),
          ...(geJu?.reasons?.length ? [`成格依据：${geJu.reasons.join('；')}`] : []),
        ],
      },
      {
        title: '财运建议',
        icon: Sparkles,
        paragraphs: [
          wealth?.summary
            ? `财运评分 ${wealth.score ?? '-'}。${wealth.summary}`
            : '财运分析中…',
          wealth?.moneyMakingStyle ? `求财方式：${wealth.moneyMakingStyle}` : '',
          ...(wealth?.suggestions ?? []).map((s) => `· ${s}`),
        ].filter(Boolean),
      },
      {
        title: '婚姻分析',
        icon: BookOpen,
        paragraphs: [
          marriage?.summary
            ? `婚姻评分 ${marriage.score ?? '-'}。${marriage.summary}`
            : '婚姻分析中…',
          marriage?.spousePalace
            ? `夫妻宫为${marriage.spousePalace.zhi}（${marriage.spousePalace.element ?? ''}）：${marriage.spousePalace.description ?? ''}`
            : '',
          ...(marriage?.suggestions ?? []).map((s) => `· ${s}`),
        ].filter(Boolean),
      },
      {
        title: '事业分析',
        icon: FileText,
        paragraphs: [
          career?.summary
            ? `事业评分 ${career.score ?? '-'}。${career.summary}`
            : '事业分析中…',
          career?.bestPath ? `最佳路径：${career.bestPath}` : '',
          ...(career?.industries ?? [])
            .slice(0, 3)
            .map((ind: any) => `· 适合行业：${ind.industry}（${ind.score}分）`),
          ...(career?.risks ?? []).slice(0, 2).map((r: string) => `· 风险提示：${r}`),
        ].filter(Boolean),
      },
      {
        title: '健康分析',
        icon: Sparkles,
        paragraphs: [
          health?.summary
            ? `健康评分 ${health.score ?? '-'}。${health.summary}`
            : '健康分析中…',
          health?.constitution
            ? `体质类型：${health.constitution.type ?? '—'}。${health.constitution.description ?? ''}`
            : '',
          ...(health?.diseaseRisks ?? [])
            .slice(0, 2)
            .map((d: any) => `· 需注意：${d.organ}（${d.diseases?.join('、') ?? ''}）`),
        ].filter(Boolean),
      },
    ]
  }, [chart, pipelineResult])

  return (
    <div className="tab3">
      <div className="tab3-list">
        {modules.map((m, i) => {
          const open = openIdx === i
          const Icon = m.icon
          return (
            <div key={i} className={`brief-item ${open ? 'open' : ''}`}>
              <button
                className="brief-head"
                onClick={() => setOpenIdx(open ? null : i)}
              >
                <span className="brief-icon">
                  <Icon size={16} />
                </span>
                <span className="brief-title">{m.title}</span>
                <span className="brief-arrow">
                  {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    className="brief-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="brief-body-inner">
                      {m.paragraphs.length > 0 ? (
                        m.paragraphs.map((p, j) => (
                          <p key={j} className="brief-para">{p}</p>
                        ))
                      ) : (
                        <p className="brief-para brief-empty">点击查看分析</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
//  Tab 4：详解分析（长文报告 + 会员入口）
// ============================================================================
function Tab4FullReport({
  chart,
  pipelineResult,
  analysis,
  aiLoading,
  aiError,
  onRetry,
}: {
  chart: BaZiChart
  pipelineResult: BaZiPipelineResult | null
  analysis: BaZiAnalysis
  aiLoading: boolean
  aiError: string | null
  onRetry: () => void
}) {
  const fullReport = pipelineResult?.fullReport
  const hasReport = !!fullReport && (fullReport.chapters?.length ?? 0) > 0

  const chapters = useMemo(() => {
    if (hasReport && fullReport) {
      return fullReport.chapters.map((c: any) => ({
        id: c.id,
        title: c.title,
        paragraphs: toParagraphs(c.content),
      }))
    }
    const a = analysis
    return [
      { id: 'overall', title: '命局总论', paragraphs: toParagraphs(a.overall) },
      { id: 'wuxing', title: '五行分析', paragraphs: toParagraphs(a.wuxingAdvice) },
      { id: 'personality', title: '性格分析', paragraphs: toParagraphs(a.personality) },
      { id: 'career', title: '事业分析', paragraphs: toParagraphs(a.career) },
      { id: 'wealth', title: '财运分析', paragraphs: toParagraphs(a.wealth) },
      { id: 'relationship', title: '婚姻家庭', paragraphs: toParagraphs(a.relationship) },
      { id: 'health', title: '健康分析', paragraphs: toParagraphs(a.health) },
      { id: 'summary', title: '改运建议', paragraphs: toParagraphs(a.summary) },
    ]
  }, [hasReport, fullReport, analysis])

  return (
    <div className="tab4">
      <div className="tab4-header">
        <div className="tab4-title">
          {fullReport?.title || `${chart.sixLines.day.gan}${chart.sixLines.day.zhi}日主命书`}
        </div>
        {fullReport?.subtitle && (
          <div className="tab4-subtitle">{fullReport.subtitle}</div>
        )}
      </div>

      {aiLoading && !hasReport && (
        <div className="tab4-loading">
          <Loader2 size={18} className="spin" />
          <span>正在生成详解分析…</span>
        </div>
      )}

      {aiError && !hasReport && (
        <div className="tab4-error">
          <div className="tab4-error-text">{aiError}</div>
          <button className="tab4-retry" onClick={onRetry}>
            <RefreshCw size={13} /> 重试
          </button>
        </div>
      )}

      <div className="tab4-chapters">
        {chapters.map((ch: any, i) => (
          <section className="chapter" key={ch.id || i}>
            <h3 className="chapter-title">
              <span className="chapter-no">{i + 1}</span>
              {ch.title}
            </h3>
            <div className="chapter-body">
              {ch.paragraphs.length > 0 ? (
                ch.paragraphs.map((p: string, j: number) => (
                  <p key={j} className="chapter-para">{p}</p>
                ))
              ) : (
                <p className="chapter-para chapter-empty">暂无内容</p>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* 会员入口 */}
      <div className="member-entry">
        <div className="member-entry-icon">
          <Lock size={20} />
        </div>
        <div className="member-entry-text">
          <div className="member-entry-title">解锁更深度的命理详解</div>
          <div className="member-entry-desc">
            查看完整命书、专属改运方案与年度运势详解
          </div>
        </div>
        <div className="member-entry-actions">
          <button className="member-btn member-btn-primary">
            <FileText size={14} /> 查看完整命理详解
          </button>
          <button className="member-btn member-btn-gold">
            <Crown size={14} /> 开通玄风门会员
          </button>
        </div>
      </div>
    </div>
  )
}
