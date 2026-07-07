import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle, Card, Badge, Button, Loading } from '../components/ui'
import { ScoreRing, ScoreBar } from '../components/business'
import { useBazi } from '../hooks/useBazi'
import { useAIAnalysis } from '../hooks/useAIAnalysis'
import { calculateBaZiFromBirthData, type FiveElement, type BaZiAnalysis, determineGeJu, type GeJuResult, calculateShenSha, type ShenShaCategory, analyzeShenShi, type ShenShiAnalysisResult, calculateFiveElementPower, analyzeDaYun, analyzeLiuNian, analyzeLiuYue, analyzeMarriage, type MarriageAnalysisResult } from '../lib/bazi'
import { DEFAULT_BAZI_ANALYSIS } from '../constants/defaultAnalysis'
import type { BirthData } from '@/lib/core'
import './BaziChart.css'

type TabKey = 'overview' | 'wuxing' | 'shenshi' | 'wangshuai' | 'geju' | 'shensha' | 'xiyong' | 'dayun' | 'liunian' | 'liuyue' | 'marriage' | 'analysis'

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
  { key: 'analysis', label: '解析' },
]

const ELEMENT_COLORS: Record<FiveElement, string> = {
  木: '#4a9c6d',
  火: '#d4573a',
  土: '#c4956a',
  金: '#d4af37',
  水: '#4a7ab8',
}

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
  const [expandedDayun, setExpandedDayun] = useState<number | null>(null)
  const [expandedLiunian, setExpandedLiunian] = useState<number | null>(null)
  const [expandedLiuyue, setExpandedLiuyue] = useState<number | null>(null)

  useEffect(() => {
    if (!chart && charts.length > 0) {
      setChart(charts[0])
    }
  }, [charts])

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

  const geJu = determineGeJu(
    sixLines,
    dayMaster.relatedShens,
    dayMaster.strengthScore,
    dayMaster.dayGan,
    sixLines.month.zhi,
    fiveElementCount,
  )

  const shenSha = calculateShenSha(
    sixLines,
    dayMaster.dayGan,
    chartBirth.gender,
  )

  const shenShiAnalysis = analyzeShenShi(
    sixLines,
    dayMaster.dayGan,
    chartBirth.gender,
  )

  const fiveElementPower = calculateFiveElementPower(
    sixLines,
    dayMaster.dayGan,
  )

  const birthDate = new Date(`${chartBirth.birthDate}T${chartBirth.birthTime}`)
  const daYun = analyzeDaYun(
    sixLines,
    birthDate,
    dayMaster.dayGan,
    chartBirth.gender,
    [xiYongShen.bestElement],
    xiYongShen.avoidedElements,
  )

  const currentYear = new Date().getFullYear()
  const liuNian = analyzeLiuNian(
    sixLines,
    dayMaster.dayGan,
    currentYear,
    100,
  )

  const [liuYueYear, setLiuYueYear] = useState(currentYear)
  const liuYue = analyzeLiuYue(
    sixLines,
    dayMaster.dayGan,
    liuYueYear,
  )

  const marriage = analyzeMarriage(
    sixLines,
    dayMaster.dayGan,
    chartBirth.gender,
  )

  function handleSave() {
    if (chart) {
      const chartWithAnalysis = { ...chart, analysis }
      saveChart(chartWithAnalysis)
      setSaved(true)
    }
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
                日主{dayMaster.wangShuai === '旺' ? '偏旺' : dayMaster.wangShuai === '弱' ? '偏弱' : dayMaster.wangShuai}，
                {dayMaster.wangShuai === '旺' ? '需克制泄耗，宜用克泄耗五行' : dayMaster.wangShuai === '弱' ? '需生扶助力，宜用生助五行' : '五行相对平衡，喜用神选择需综合判断'}。
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

          {activeTab === 'analysis' && (
            <div className="bazi-analysis-list">
              {aiLoading && (
                <Card className="analysis-card">
                  <div className="ai-loading">
                    <Loading size="md" />
                    <p>命盘推演中，请稍候...</p>
                  </div>
                </Card>
              )}

              {aiError && !aiLoading && (
                <Card className="analysis-card">
                  <h3 className="card-title">解析失败</h3>
                  <p className="analysis-text error">{aiError}</p>
                  <Button variant="secondary" onClick={retryAnalysis}>
                    重新生成
                  </Button>
                </Card>
              )}

              {!aiLoading && (
                <>
                  <Card className="analysis-card">
                    <h3 className="card-title">总体命格</h3>
                    <p className="analysis-text">{analysis.overall}</p>
                  </Card>
                  <Card className="analysis-card">
                    <h3 className="card-title">性格分析</h3>
                    <p className="analysis-text">{analysis.personality}</p>
                  </Card>
                  <Card className="analysis-card">
                    <h3 className="card-title">事业分析</h3>
                    <p className="analysis-text">{analysis.career}</p>
                  </Card>
                  <Card className="analysis-card">
                    <h3 className="card-title">财运分析</h3>
                    <p className="analysis-text">{analysis.wealth}</p>
                  </Card>
                  <Card className="analysis-card">
                    <h3 className="card-title">婚姻感情</h3>
                    <p className="analysis-text">{analysis.relationship}</p>
                  </Card>
                  <Card className="analysis-card">
                    <h3 className="card-title">健康建议</h3>
                    <p className="analysis-text">{analysis.health}</p>
                  </Card>
                  <Card className="analysis-card">
                    <h3 className="card-title">五行建议</h3>
                    <p className="analysis-text">{analysis.wuxingAdvice}</p>
                  </Card>
                  <Card className="analysis-card">
                    <h3 className="card-title">综合总结</h3>
                    <p className="analysis-text">{analysis.summary}</p>
                  </Card>
                </>
              )}
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
          <Button variant="ghost" fullWidth onClick={() => navigate('/bazi')}>
            重新排盘
          </Button>
        </div>
      </div>
    </div>
  )
}
