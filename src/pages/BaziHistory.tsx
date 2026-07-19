import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle, Card, Button } from '../components/ui'
import { useBazi } from '../hooks/useBazi'
import type { BaZiChart } from '../lib/bazi'
import './BaziHistory.css'

type SortMode = 'time' | 'score'

export default function BaziHistory() {
  const navigate = useNavigate()
  const { charts, deleteChart, clearAllCharts } = useBazi()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('time')

  const sortedCharts = useMemo(() => {
    if (sortMode === 'score') {
      return [...charts].sort((a, b) => b.overallScore - a.overallScore)
    }
    return charts // 默认按时间倒序（charts 本身就是按 createdAt 降序）
  }, [charts, sortMode])

  function formatDate(createdAt: number): string {
    const date = new Date(createdAt)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  function handleView(chart: BaZiChart) {
    navigate('/bazi/chart', { state: { birthInfo: chart.birthInfo } })
  }

  function handleDelete(createdAt: number) {
    deleteChart(createdAt)
    setConfirmDelete(null)
  }

  function handleClearAll() {
    clearAllCharts()
    setConfirmClearAll(false)
  }

  return (
    <div className="bazi-history-page">
      <PageTitle
        icon="☰"
        label="玄风命理"
        title="历史记录"
        subtitle="已保存的命盘"
      />

      <div className="container bazi-history-content">
        {charts.length === 0 ? (
          <div className="bazi-history-empty">
            <div className="bazi-history-empty-icon">☯</div>
            <p className="bazi-history-empty-title">暂无历史记录</p>
            <p className="bazi-history-empty-desc">排盘后将自动保存在此</p>
            <Button variant="primary" onClick={() => navigate('/bazi')}>
              立即排盘
            </Button>
          </div>
        ) : (
          <>
            {/* 工具栏 */}
            <div className="bazi-history-toolbar">
              <div className="bazi-history-sort">
                <button
                  className={`sort-btn ${sortMode === 'time' ? 'sort-btn--active' : ''}`}
                  onClick={() => setSortMode('time')}
                >
                  按时间
                </button>
                <button
                  className={`sort-btn ${sortMode === 'score' ? 'sort-btn--active' : ''}`}
                  onClick={() => setSortMode('score')}
                >
                  按评分
                </button>
              </div>
              <div className="bazi-history-clear">
                {confirmClearAll ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={handleClearAll}>
                      确认清空
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmClearAll(false)}>
                      取消
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setConfirmClearAll(true)}>
                    清空全部
                  </Button>
                )}
              </div>
            </div>

            {/* 列表 */}
            <div className="bazi-history-list">
              {sortedCharts.map(chart => (
                <Card
                  key={chart.createdAt}
                  className="bazi-history-item"
                >
                  <div className="history-item-header">
                    <div className="history-item-info">
                      <div className="history-item-date">
                        {chart.birthInfo.birthDate} {chart.birthInfo.birthTime}
                      </div>
                      <div className="history-item-gender">
                        {chart.birthInfo.gender === 'male' ? '男命' : '女命'}
                      </div>
                    </div>
                    <div className="history-item-score">
                      <span className="score-value">{chart.overallScore}</span>
                      <span className="score-label">分</span>
                    </div>
                  </div>

                  {/* 增强信息：日主/格局/喜用神 */}
                  <div className="history-item-details">
                    <span className="detail-tag">
                      {chart.dayMaster.dayGan}{chart.dayMaster.dayGanElement}
                    </span>
                    {chart.dayMaster.wangShuai && (
                      <span className="detail-tag detail-tag--subtle">
                        {chart.dayMaster.wangShuai}
                      </span>
                    )}
                    {chart.xiYongShen && (
                      <span className="detail-tag detail-tag--accent">
                        喜 {chart.xiYongShen.bestElement}
                      </span>
                    )}
                  </div>

                  <div className="history-item-pillars">
                    <span className="pillar-tag">{chart.sixLines.year.gan}{chart.sixLines.year.zhi}</span>
                    <span className="pillar-tag">{chart.sixLines.month.gan}{chart.sixLines.month.zhi}</span>
                    <span className="pillar-tag day">{chart.sixLines.day.gan}{chart.sixLines.day.zhi}</span>
                    <span className="pillar-tag">{chart.sixLines.hour.gan}{chart.sixLines.hour.zhi}</span>
                  </div>

                  <div className="history-item-time">
                    保存于 {formatDate(chart.createdAt)}
                  </div>

                  <div className="history-item-actions">
                    <Button variant="primary" size="sm" onClick={() => handleView(chart)}>
                      查看详情
                    </Button>
                    {confirmDelete === chart.createdAt ? (
                      <>
                        <Button variant="secondary" size="sm" onClick={() => handleDelete(chart.createdAt)}>
                          确认删除
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                          取消
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(chart.createdAt)}>
                        删除
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
