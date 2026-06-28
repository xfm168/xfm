import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageTitle, Card, Badge, Button } from '../components/ui'
import { ScoreRing, ScoreBar } from '../components/business'
import { useBazi } from '../hooks/useBazi'
import { calculateBaZi, type FiveElement, type BirthInfo, type BaZiAnalysis } from '../lib/bazi'
import { getAIService } from '../services/ai'
import { Loading } from '../components/ui'
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
  const [aiContent, setAiContent] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    if (!chart && charts.length > 0) {
      setChart(charts[0])
    }
  }, [charts])

  // 解析 AI 返回内容，填充 BaZiAnalysis 各字段
  const parseAIAnalysis = useCallback((content: string): BaZiAnalysis => {
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

    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)

    // 尝试识别各段落
    let currentSection = ''
    const sections: Record<string, string[]> = {}

    for (const line of lines) {
      // 检查是否是标题行（包含关键词）
      const titleMatch = line.match(/^[一二三四五六七八九十\d]+[.、:：]\s*(.+)/)
        || line.match(/^(总体|命格|性格|事业|财运|婚姻|感情|健康|五行|综合)[：:]/i)

      if (titleMatch) {
        currentSection = titleMatch[1] || titleMatch[0]
        if (!sections[currentSection]) {
          sections[currentSection] = []
        }
      } else if (currentSection && line.length > 10) {
        sections[currentSection].push(line)
      }
    }

    // 根据关键词匹配字段
    const matched: Partial<BaZiAnalysis> = {}

    for (const [key, lines] of Object.entries(sections)) {
      const text = lines.join('')
      const lowerKey = key.toLowerCase()

      if (lowerKey.includes('总体') || lowerKey.includes('命格') || lowerKey.includes('格局')) {
        matched.overall = text
      } else if (lowerKey.includes('性格') || lowerKey.includes('个性') || lowerKey.includes('特质')) {
        matched.personality = text
      } else if (lowerKey.includes('事业') || lowerKey.includes('工作') || lowerKey.includes('职业')) {
        matched.career = text
      } else if (lowerKey.includes('财运') || lowerKey.includes('财富') || lowerKey.includes('金钱')) {
        matched.wealth = text
      } else if (lowerKey.includes('婚姻') || lowerKey.includes('感情') || lowerKey.includes('爱情')) {
        matched.relationship = text
      } else if (lowerKey.includes('健康') || lowerKey.includes('身体') || lowerKey.includes('疾病')) {
        matched.health = text
      } else if (lowerKey.includes('五行')) {
        matched.wuxingAdvice = text
      } else if (lowerKey.includes('综合') || lowerKey.includes('总结') || lowerKey.includes('总评')) {
        matched.summary = text
      }
    }

    // 如果没有匹配到任何段落，将整个内容作为总体命格
    if (Object.keys(matched).length === 0) {
      matched.overall = content.slice(0, 200)
    }

    return { ...defaultAnalysis, ...matched }
  }, [])

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
        {
          birthDateTime,
          gender,
        }
      )

      const content = response.content || ''
      setAiContent(content)

      // 解析并更新 chart
      const newAnalysis = parseAIAnalysis(content)
      setChart(prev => prev ? { ...prev, analysis: newAnalysis } : null)
    } catch (err) {
      console.error('[AI] 八字解析失败:', err)
      setAiError('AI解析服务暂时不可用，请稍后再试')
    } finally {
      setAiLoading(false)
    }
  }, [chart, parseAIAnalysis])

  // 切换到解析 Tab 时自动调用 AI
  useEffect(() => {
    if (activeTab === 'analysis' && !aiContent && !aiLoading) {
      fetchAIAnalysis()
    }
  }, [activeTab, aiContent, aiLoading, fetchAIAnalysis])

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
