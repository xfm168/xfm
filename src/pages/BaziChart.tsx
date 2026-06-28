import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle, Card, Badge, Button, Loading } from '../components/ui'
import { ScoreRing, ScoreBar } from '../components/business'
import { useBazi } from '../hooks/useBazi'
import { calculateBaZi, type FiveElement, type BirthInfo, type BaZiAnalysis } from '../lib/bazi'
import { getAIService } from '../services/ai'
import { safeParseAIJson } from '../utils/aiJson'
import './BaziChart.css'

type TabKey = 'overview' | 'wuxing' | 'shenshi' | 'xiyong' | 'analysis'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '命盘' },
  { key: 'wuxing', label: '五行' },
  { key: 'shenshi', label: '十神' },
  { key: 'xiyong', label: '喜用神' },
  { key: 'analysis', label: '解析' },
]

const ELEMENT_COLORS: Record<FiveElement, string> = {
  木: '#4a9c6d',
  火: '#d4573a',
  土: '#c4956a',
  金: '#d4af37',
  水: '#4a7ab8',
}

export default function BaziChart() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const { saveChart, charts } = useBazi()

  const birthInfo = (location.state as { birthInfo?: BirthInfo } | null)?.birthInfo

  const [chart, setChart] = useState(() => {
    if (birthInfo) {
      const result = calculateBaZi(birthInfo)
      return result
    }
    if (charts.length > 0) {
      return charts[0]
    }
    return null
  })

  const [saved, setSaved] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiFetched, setAiFetched] = useState(false)

  useEffect(() => {
    if (!chart && charts.length > 0) {
      setChart(charts[0])
    }
  }, [charts])

  // 默认解析文案（降级用）
  const defaultAnalysis: BaZiAnalysis = {
    overall: '命格深厚，需结合大运综合分析',
    personality: '性格内敛含蓄，思考缜密，富有耐心与毅力。',
    career: '事业心强，善于规划，宜从事稳定型职业。',
    wealth: '财运平稳，理财观念保守，积少成多。',
    relationship: '感情细腻，重视家庭，婚恋缘分需耐心等待。',
    health: '注意脾胃调理，平时多加锻炼即可。',
    wuxingAdvice: '宜补木火，忌金水过旺。',
    summary: '整体命局平衡，用神得力，中晚年运势渐入佳境。',
  }

  // 调用 AI 解析
  const fetchAIAnalysis = useCallback(async () => {
    if (!chart) return

    setAiLoading(true)
    setAiError(null)

    try {
      const aiService = getAIService()
      const birthDateTime = `${chart.birthInfo.birthDate} ${chart.birthInfo.birthTime}`
      const gender = chart.birthInfo.gender === 'male' ? '男' : '女'

      const response = await aiService.generateWithPrompt(
        'bazi.basic',
        { birthDateTime, gender }
      )

      const json = safeParseAIJson<Partial<BaZiAnalysis>>(response.content || '')

      // 统一字段补全，保证所有字段存在
      const newAnalysis: BaZiAnalysis = {
        overall: '',
        personality: '',
        career: '',
        wealth: '',
        relationship: '',
        health: '',
        wuxingAdvice: '',
        summary: '',
        ...json,
      }

      // 空字段用默认文案补全
      for (const key of Object.keys(newAnalysis) as (keyof BaZiAnalysis)[]) {
        if (!newAnalysis[key]) {
          newAnalysis[key] = defaultAnalysis[key]
        }
      }

      setChart(prev => prev ? { ...prev, analysis: newAnalysis } : null)
      setAiFetched(true)
    } catch (err) {
      console.warn('[AI] 八字解析失败，使用默认文案')
      setAiError('AI 暂时不可用，请稍后重试')
      // 失败时使用默认文案，页面继续可用
      setChart(prev => prev ? { ...prev, analysis: defaultAnalysis } : null)
      setAiFetched(true)
    } finally {
      setAiLoading(false)
    }
  }, [chart])

  // 切换到解析 Tab 时自动调用 AI
  useEffect(() => {
    if (activeTab === 'analysis' && !aiFetched && !aiLoading) {
      fetchAIAnalysis()
    }
  }, [activeTab, aiFetched, aiLoading, fetchAIAnalysis])

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

  const { sixLines, fiveElementCount, dayMaster, xiYongShen, analysis, overallScore, birthInfo: chartBirth } = chart

  function handleSave() {
    if (chart) {
      saveChart(chart)
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
            <Card className="bazi-wuxing-card">
              <h3 className="card-title">五行分析</h3>
              <div className="wuxing-list">
                {(['木', '火', '土', '金', '水'] as FiveElement[]).map(el => (
                  <div key={el} className="wuxing-item">
                    <div className="wuxing-header">
                      <span className="wuxing-name" style={{ color: ELEMENT_COLORS[el] }}>
                        {el}
                      </span>
                      <span className="wuxing-count">{fiveElementCount[el].toFixed(1)}</span>
                    </div>
                    <ScoreBar score={(fiveElementCount[el] / 10) * 100} height={8} showValue={false} />
                  </div>
                ))}
              </div>
              <p className="wuxing-summary">
                {xiYongShen.happiness}
              </p>
            </Card>
          )}

          {activeTab === 'shenshi' && (
            <Card className="bazi-shenshi-card">
              <h3 className="card-title">十神分析</h3>
              <p className="shenshi-intro">
                日主 <strong style={{ color: 'var(--accent)' }}>{dayMaster.dayGan}</strong> 天干十神关系：
              </p>
              <div className="shenshi-grid">
                {(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const).map(gan => (
                  <div key={gan} className="shenshi-item">
                    <div className="shenshi-gan">{gan}</div>
                    <div className="shenshi-name">{dayMaster.relatedShens[gan]}</div>
                  </div>
                ))}
              </div>
            </Card>
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
                  <Button variant="secondary" onClick={fetchAIAnalysis}>
                    重试
                  </Button>
                </Card>
              )}

              {!aiLoading && !aiError && (
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
