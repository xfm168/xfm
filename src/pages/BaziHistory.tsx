import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTitle, Card, Button } from '../components/ui'
import { useBazi } from '../hooks/useBazi'
import type { BaZiChart } from '../lib/bazi'
import './BaziHistory.css'

export default function BaziHistory() {
  const navigate = useNavigate()
  const { charts, deleteChart } = useBazi()
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

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
            <p>暂无历史记录</p>
            <Button variant="primary" onClick={() => navigate('/bazi')}>
              立即排盘
            </Button>
          </div>
        ) : (
          <div className="bazi-history-list">
            {charts.map(chart => (
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
        )}
      </div>
    </div>
  )
}
