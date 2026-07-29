import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBazi } from '../hooks/useBazi'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
import { calculateBaZiFromBirthData } from '../lib/bazi'
import { runBaZiPipelineFromBirthData } from '../lib/bazi/pipeline'
import type { BaZiPipelineResult } from '../lib/bazi/pipeline/types'
import type { BaZiChart, BaZiAnalysis } from '../lib/bazi/types'
import type { BirthData } from '@/lib/core'
import { DEFAULT_BAZI_ANALYSIS } from '../constants/defaultAnalysis'
import { usePageSEO } from '../hooks/usePageSEO'
import type { ReactNode } from 'react'
import {
  ChevronDown, ChevronRight, Loader2, Sparkles, Crown,
  FileText, Table2, BookOpen, LayoutGrid,
  Calendar, User, RefreshCw, Lock,
} from 'lucide-react'
import './BaziChart.css'

// ===== 常量 =====
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: string[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const STEM_ELEMENT: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
  庚: '金', 辛: '金', 壬: '水', 癸: '水',
}
const BRANCH_ELEMENT: Record<string, string> = {
  寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金',
  亥: '水', 子: '水', 辰: '土', 丑: '土', 未: '土', 戌: '土',
}

const ELEMENT_COLORS: Record<string, string> = {
  木: '#4ade80', 火: '#f87171', 土: '#fbbf24', 金: '#e2e8f0', 水: '#60a5fa',
}

const PILLAR_KEYS = ['year', 'month', 'day', 'hour'] as const
type PillarKey = typeof PILLAR_KEYS[number]
const PILLAR_NAMES = ['年柱', '月柱', '日柱', '时柱']
const PILLAR_KEYWORD: Record<PillarKey, string> = { year: '年', month: '月', day: '日', hour: '时' }

const ZODIAC: Record<string, string> = {
  子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇',
  午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪',
}

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

// ===== 空亡计算（内联实现） =====
function getKongwang(gan: string, zhi: string): string[] {
  const ganIdx = STEMS.indexOf(gan)
  const zhiIdx = BRANCHES.indexOf(zhi)
  const offset = (zhiIdx - ganIdx + 12) % 12
  return [BRANCHES[(offset + 10) % 12], BRANCHES[(offset + 11) % 12]]
}

function elColor(el?: string | null): string {
  if (!el) return '#e8e0d0'
  return ELEMENT_COLORS[el] || '#e8e0d0'
}

function stemEl(gan?: string | null): string {
  if (!gan) return ''
  return STEM_ELEMENT[gan] || ''
}
function branchEl(zhi?: string | null): string {
  if (!zhi) return ''
  return BRANCH_ELEMENT[zhi] || ''
}

// 将长文本按段落拆分（去掉 markdown 标题行）
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

  const birthData = (location.state as { birthData?: BirthData } | null)?.birthData

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
    const bd: BirthData = {
      birthday: chart.birthInfo.birthDate,
      birthTime: chart.birthInfo.birthTime,
      gender: chart.birthInfo.gender,
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
    autoFetch: activeTab === 'full' && !!chart,
  })

  // 无数据
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
          <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
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
              <Tab1BasicInfo chart={chart} pipelineResult={pipelineResult} />
            ) : activeTab === 'detail' ? (
              <Tab2DetailChart chart={chart} pipelineResult={pipelineResult} />
            ) : activeTab === 'brief' ? (
              <Tab3BriefAnalysis chart={chart} pipelineResult={pipelineResult} />
            ) : (
              <Tab4FullReport
                chart={chart}
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

// ===== Tab 1: 基本信息（排盘表格） =====
function Tab1BasicInfo({
  chart,
  pipelineResult,
}: {
  chart: BaZiChart
  pipelineResult: BaZiPipelineResult | null
}) {
  const { sixLines, cangGan, dayMaster, fiveElementCount, xiYongShen } = chart
  const pillars = PILLAR_KEYS.map((k) => sixLines[k])

  // 空亡：从日柱计算
  const kongwang = useMemo(
    () => getKongwang(sixLines.day.gan, sixLines.day.zhi),
    [sixLines.day],
  )
  const kongSet = useMemo(() => new Set(kongwang), [kongwang])

  // 神煞按柱筛选
  const shenShaItems = pipelineResult?.shenShaDetail?.items ?? []
  const shenShaByPillar = useMemo(() => {
    const map: Record<PillarKey, string[]> = { year: [], month: [], day: [], hour: [] }
    for (const item of shenShaItems) {
      const pos = item.position || ''
      ;(PILLAR_KEYS as readonly PillarKey[]).forEach((k) => {
        if (pos.includes(PILLAR_KEYWORD[k])) map[k].push(item.name)
      })
    }
    return map
  }, [shenShaItems])

  const geJu = pipelineResult?.geJu

  const rows: { label: string; cells: ReactNode[] }[] = [
    {
      label: '天干',
      cells: pillars.map((p) => (
        <span className="cell-el" style={{ color: elColor(stemEl(p.gan)) }}>
          {p.gan}
          <small className="cell-sub">{stemEl(p.gan)}</small>
        </span>
      )),
    },
    {
      label: '地支',
      cells: pillars.map((p) => (
        <span className="cell-el" style={{ color: elColor(branchEl(p.zhi)) }}>
          {p.zhi}
          <small className="cell-sub">{branchEl(p.zhi)}</small>
        </span>
      )),
    },
    {
      label: '藏干',
      cells: pillars.map((p) => {
        const cg = cangGan?.[p.zhi]
        const parts = [cg?.ben, cg?.zhong, cg?.yao].filter(Boolean) as string[]
        return <span className="cell-text">{parts.length ? parts.join(' · ') : '-'}</span>
      }),
    },
    {
      label: '纳音',
      cells: pillars.map((p) => <span className="cell-text">{p.naYin || '-'}</span>),
    },
    {
      label: '空亡',
      cells: pillars.map((p) => (
        <span className={kongSet.has(p.zhi) ? 'cell-kong' : 'cell-text'}>
          {kongSet.has(p.zhi) ? '空亡' : '-'}
        </span>
      )),
    },
    {
      label: '神煞',
      cells: PILLAR_KEYS.map((k) => {
        const list = shenShaByPillar[k]
        return (
          <span className="cell-shensha">
            {list.length ? list.join('、') : '-'}
          </span>
        )
      }),
    },
    {
      label: '十神',
      cells: PILLAR_KEYS.map((k, i) => (
        <span className="cell-text">{k === 'year' ? '-' : pillars[i].shenShi || '-'}</span>
      )),
    },
    {
      label: '旺衰',
      cells: pillars.map((p) => (
        <span className="cell-text">{p.changSheng || '-'}</span>
      )),
    },
  ]

  return (
    <div className="tab1">
      <div className="tab1-scroll">
        <table className="paipan-table">
          <thead>
            <tr>
              <th className="col-label">柱位</th>
              {PILLAR_NAMES.map((n) => (
                <th key={n} className="col-pillar">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="row-label">{r.label}</td>
                {r.cells.map((c, i) => (
                  <td key={i} className="row-cell">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="kongwang-note">日柱空亡：{kongwang.join('、')}</div>

      {/* 底部信息 */}
      <div className="tab1-info">
        <div className="info-block">
          <div className="info-block-title">
            <Crown size={14} /> 日主
          </div>
          <div className="info-block-body">
            <span style={{ color: elColor(dayMaster.dayGanElement) }}>
              {dayMaster.dayGan}（{dayMaster.dayGanElement} · {dayMaster.dayGanYinYang}）
            </span>
            <span className="info-tag">旺衰 {dayMaster.wangShuai}</span>
            <span className="info-tag">强度 {dayMaster.strengthScore}</span>
          </div>
        </div>

        <div className="info-block">
          <div className="info-block-title">
            <Sparkles size={14} /> 五行分布
          </div>
          <div className="wuxing-row">
            {(['木', '火', '土', '金', '水'] as const).map((el) => {
              const v = fiveElementCount?.[el] ?? 0
              const total = Object.values(fiveElementCount ?? {}).reduce((a, b) => a + (b || 0), 0) || 1
              const pct = Math.round((v / total) * 100)
              return (
                <div className="wuxing-item" key={el}>
                  <span className="wuxing-name" style={{ color: elColor(el) }}>{el}</span>
                  <div className="wuxing-bar">
                    <motion.div
                      className="wuxing-bar-fill"
                      style={{ background: elColor(el) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="wuxing-count">{v}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="info-block">
          <div className="info-block-title">
            <Sparkles size={14} /> 喜用神
          </div>
          <div className="info-block-body">
            <span className="info-tag info-tag-gold">喜用 {xiYongShen?.bestElement ?? '-'}</span>
            <span className="info-tag">忌神 {(xiYongShen?.avoidedElements ?? []).join('、') || '-'}</span>
            <span className="info-tag">仇神 {(xiYongShen?.enemyElements ?? []).join('、') || '-'}</span>
            <span className="info-tag">闲神 {(xiYongShen?.idleElements ?? []).join('、') || '-'}</span>
          </div>
        </div>

        <div className="info-block">
          <div className="info-block-title">
            <Crown size={14} /> 格局
          </div>
          <div className="info-block-body">
            <span className="info-tag info-tag-gold">{geJu?.name ?? '分析中…'}</span>
            <span className="info-tag">{geJu?.category ?? ''}</span>
            <span className="info-tag">成格 {geJu?.score ?? '-'}</span>
            <span className="info-tag">可信 {geJu?.confidence ?? '-'}%</span>
            {geJu?.poGe && <span className="info-tag info-tag-warn">破格</span>}
          </div>
          {geJu?.description && <p className="info-desc">{geJu.description}</p>}
        </div>
      </div>
    </div>
  )
}

// ===== Tab 2: 细盘模式 =====
function Tab2DetailChart({
  chart,
  pipelineResult,
}: {
  chart: BaZiChart
  pipelineResult: BaZiPipelineResult | null
}) {
  const daYun = pipelineResult?.daYun
  const liuNian = pipelineResult?.liuNian
  const liuYue = pipelineResult?.liuYue

  const birthYear = useMemo(() => {
    const m = chart.birthInfo.birthDate?.match(/(\d{4})/)
    return m ? Number(m[1]) : new Date().getFullYear()
  }, [chart.birthInfo.birthDate])

  const [selectedDy, setSelectedDy] = useState<number>(
    daYun?.currentStepIndex != null && daYun.currentStepIndex >= 0
      ? daYun.currentStepIndex
      : 0,
  )

  // 当前选中的大运
  const curDy = daYun?.steps?.[selectedDy] ?? null

  // 当前大运下的流年
  const filteredLiuNian = useMemo(() => {
    const years = liuNian?.years ?? []
    if (!curDy) return years
    return years.filter(
      (y) => y.year >= (curDy.startYear ?? 0) && y.year <= (curDy.endYear ?? 9999),
    )
  }, [liuNian, curDy])

  const months = liuYue?.months ?? []
  const liuYueYear = liuYue?.year

  return (
    <div className="tab2">
      <section className="detail-section">
        <div className="detail-section-title">
          <Table2 size={15} /> 大运
          {daYun?.qiYun && (
            <span className="detail-section-meta">
              起运 {daYun.qiYun.qiYunAge}岁 · {daYun.qiYun.isShun ? '顺行' : '逆行'}
            </span>
          )}
        </div>
        <div className="tab2-scroll">
          <table className="detail-table">
            <thead>
              <tr>
                <th>序</th>
                <th>起运</th>
                <th>止运</th>
                <th>起始年</th>
                <th>终止年</th>
                <th>天干</th>
                <th>地支</th>
                <th>十神</th>
              </tr>
            </thead>
            <tbody>
              {(daYun?.steps ?? []).map((s, i) => {
                const isCur = i === daYun?.currentStepIndex
                const isSel = i === selectedDy
                return (
                  <tr
                    key={i}
                    className={`detail-row ${isSel ? 'sel' : ''} ${isCur ? 'cur' : ''}`}
                    onClick={() => setSelectedDy(i)}
                  >
                    <td>{i + 1}{isCur && <span className="cur-mark">●</span>}</td>
                    <td>{s.startAge}</td>
                    <td>{s.endAge}</td>
                    <td>{s.startYear}</td>
                    <td>{s.endYear}</td>
                    <td style={{ color: elColor(stemEl(s.ganZhi?.gan)) }}>{s.ganZhi?.gan ?? '-'}</td>
                    <td style={{ color: elColor(branchEl(s.ganZhi?.zhi)) }}>{s.ganZhi?.zhi ?? '-'}</td>
                    <td>{s.shenShi?.gan ?? '-'}/{s.shenShi?.zhi ?? '-'}</td>
                  </tr>
                )
              })}
              {(!daYun?.steps || daYun.steps.length === 0) && (
                <tr>
                  <td colSpan={8} className="empty-row">大运数据加载中…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-title">
          <Table2 size={15} /> 流年
          {curDy && (
            <span className="detail-section-meta">
              当前大运：{curDy.ganZhi?.gan}{curDy.ganZhi?.zhi}（{curDy.startYear}–{curDy.endYear}）
            </span>
          )}
        </div>
        <div className="tab2-scroll">
          <table className="detail-table">
            <thead>
              <tr>
                <th>年份</th>
                <th>年龄</th>
                <th>流年干支</th>
                <th>十神</th>
              </tr>
            </thead>
            <tbody>
              {filteredLiuNian.map((y) => (
                <tr key={y.year} className={y.isCurrentYear ? 'cur' : ''}>
                  <td>{y.year}{y.isCurrentYear && <span className="cur-mark">●</span>}</td>
                  <td>{y.year - birthYear}</td>
                  <td>
                    <span style={{ color: elColor(stemEl(y.ganZhi?.gan)) }}>{y.ganZhi?.gan}</span>
                    <span style={{ color: elColor(branchEl(y.ganZhi?.zhi)) }}>{y.ganZhi?.zhi}</span>
                  </td>
                  <td>{y.shenShi?.gan ?? '-'}/{y.shenShi?.zhi ?? '-'}</td>
                </tr>
              ))}
              {filteredLiuNian.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">暂无流年数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-section">
        <div className="detail-section-title">
          <Table2 size={15} /> 流月
          {liuYueYear && <span className="detail-section-meta">{liuYueYear}年</span>}
        </div>
        <div className="tab2-scroll">
          <table className="detail-table">
            <thead>
              <tr>
                <th>月份</th>
                <th>月干支</th>
                <th>十神</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.monthIndex}>
                  <td>{m.monthName ?? `${m.monthIndex + 1}月`}</td>
                  <td>
                    <span style={{ color: elColor(stemEl(m.ganZhi?.gan)) }}>{m.ganZhi?.gan}</span>
                    <span style={{ color: elColor(branchEl(m.ganZhi?.zhi)) }}>{m.ganZhi?.zhi}</span>
                  </td>
                  <td>{m.shenShi?.gan ?? '-'}/{m.shenShi?.zhi ?? '-'}</td>
                </tr>
              ))}
              {months.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-row">暂无流月数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ===== Tab 3: 简析测试 =====
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
          `日主为${dayMaster.dayGan}，五行属${dayMaster.dayGanElement}（${dayMaster.dayGanYinYang}干）。` +
            `当前旺衰为「${dayMaster.wangShuai}」，日主强度评分约 ${dayMaster.strengthScore} 分。`,
          `日柱为${sixLines.day.gan}${sixLines.day.zhi}，纳音「${sixLines.day.naYin || '—'}」，` +
            `代表命主自身的先天禀赋与中年运势走向。`,
        ],
      },
      {
        title: '生肖分析',
        icon: User,
        paragraphs: [
          `命主生于${sixLines.year.gan}${sixLines.year.zhi}年，` +
            `生肖属${zodiac || '—'}，年柱纳音「${sixLines.year.naYin || '—'}」。`,
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
            ? `得令：${fp.deLing ? '是' : '否'}；得地：${fp.deDi ? '是' : '否'}；得势：${fp.deShi ? '是' : '否'}。` +
              `主导五行为${fp.dominant ?? '—'}，最弱五行为${fp.weakest ?? '—'}。`
            : `日主${dayMaster.dayGan}${dayMaster.dayGanElement}的力量需结合月令、通根、透干综合判定。`,
        ],
      },
      {
        title: '财运格局',
        icon: Crown,
        paragraphs: [
          geJu?.name
            ? `命局主格为「${geJu.name}」（${geJu.category ?? ''}），` +
              `成格评分 ${geJu.score ?? '-'}，可信度 ${geJu.confidence ?? '-'}%。` +
              `${geJu.poGe ? '此格存在破格之象。' : ''}`
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
            ? `夫妻宫为${marriage.spousePalace.zhi}（${marriage.spousePalace.element ?? ''}）：` +
              `${marriage.spousePalace.description ?? ''}`
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
            .map((ind) => `· 适合行业：${ind.industry}（${ind.score}分）`),
          ...(career?.risks ?? []).slice(0, 2).map((r) => `· 风险提示：${r}`),
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
            .map((d) => `· 需注意：${d.organ}（${d.diseases?.join('、') ?? ''}）`),
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

// ===== Tab 4: 详解分析 =====
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

  // 章节列表
  const chapters = useMemo(() => {
    if (hasReport && fullReport) {
      return fullReport.chapters.map((c) => ({
        id: c.id,
        title: c.title,
        paragraphs: toParagraphs(c.content),
      }))
    }
    // 回退：使用 AI 分析
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
        {chapters.map((ch, i) => (
          <section className="chapter" key={ch.id || i}>
            <h3 className="chapter-title">
              <span className="chapter-no">{i + 1}</span>
              {ch.title}
            </h3>
            <div className="chapter-body">
              {ch.paragraphs.length > 0 ? (
                ch.paragraphs.map((p, j) => (
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
