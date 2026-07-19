import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getVisitorId, getOfflineDailyRecords, type DailyHexagramWithDetail } from '../lib/hexagram'
import { getFengShuiHistory, deleteFengShuiHistory, exportFengShuiHistoryForShare, type FengShuiHistoryRecord } from '../lib/fengshui/history'
import {
  getHistoryV31,
  deleteHistoryV31,
  searchHistoryV31,
  filterHistoryByCategory,
  filterHistoryByStatus,
  toggleFavorite,
  updateStatus,
  exportHistoryToJSON,
  generateShareTextV31,
} from '../lib/fengshui/v31/history'
import { generatePDFReport as generatePDF, downloadPDF } from '../lib/fengshui/v31/pdf'
import type { FengShuiHistoryRecordV31, PDFReportConfig, ProfessionalReportV31 } from '../lib/fengshui/v31/types'
import './History.css'
import { usePageSEO } from '../hooks/usePageSEO'

// ── Record type system (extensible for future record types) ──

type RecordType = 'daily' | 'divination' | 'fengshui'

type TimelineRecord =
  | { id: string; record_type: 'daily'; date: string; created_at: string; payload: DailyRecord }
  | { id: string; record_type: 'fengshui'; date: string; created_at: string; payload: FengshuiRecord; source: 'v30' | 'v31' }

interface DailyRecord {
  hexagram_number: number
  hexagram_name: string
  hexagram_symbol: string
  lines: string[]
  score: number
  career_score: number
  wealth_score: number
  love_score: number
  health_score: number
}

interface FengshuiRecord {
  roomType: string
  roomName: string
  imageData: string
  overallScore: number
  confidenceLevel?: string
  confidenceScore?: number
  mainIssues: string[]
  mainSuggestions?: string[]
  remediationPlans?: string[]
  tags?: string[]
  notes?: string
  status?: 'active' | 'remediated' | 'archived'
  favorite?: boolean
  credibility?: { score: number; level: string; explanation: string }
}

const RECORD_TYPE_META: Record<RecordType, { label: string; icon: string; detailPath: string; color: string }> = {
  daily:      { label: '今日卦运', icon: '\u262f', detailPath: '/daily',      color: 'var(--accent)' },
  divination: { label: '六爻解卦', icon: '\u2630', detailPath: '/liuyao',     color: '#7ec8e3' },
  fengshui:   { label: '风水勘测', icon: '\u2302', detailPath: '/fengshui',   color: '#7ecb7e' },
}

// ── Filters ───────────────────────────────────────────

type FilterRange = '7d' | '30d' | 'all'
type TypeFilter = 'all' | 'daily' | 'fengshui'
type FsStatusFilter = 'all' | 'active' | 'remediated' | 'favorite'
type RoomTypeFilter = 'all' | 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'study' | 'dining' | 'balcony' | 'entryway'
type SortOption = 'newest' | 'oldest' | 'scoreHigh' | 'scoreLow'

const FILTER_OPTIONS: { value: FilterRange; label: string }[] = [
  { value: '7d',  label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: 'all', label: '全部记录' },
]

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'daily', label: '今日卦运' },
  { value: 'fengshui', label: '风水勘测' },
]

const FS_STATUS_OPTIONS: { value: FsStatusFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '待整改' },
  { value: 'remediated', label: '已整改' },
  { value: 'favorite', label: '已收藏' },
]

const ROOM_TYPE_OPTIONS: { value: RoomTypeFilter; label: string }[] = [
  { value: 'all', label: '全部房型' },
  { value: 'living', label: '客厅' },
  { value: 'bedroom', label: '卧室' },
  { value: 'kitchen', label: '厨房' },
  { value: 'bathroom', label: '卫生间' },
  { value: 'study', label: '书房' },
  { value: 'dining', label: '餐厅' },
  { value: 'balcony', label: '阳台' },
  { value: 'entryway', label: '玄关' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: '时间最新' },
  { value: 'oldest', label: '时间最早' },
  { value: 'scoreHigh', label: '评分最高' },
  { value: 'scoreLow', label: '评分最低' },
]

const ROOM_TYPE_MAP: Record<string, string> = {
  living: '客厅',
  bedroom: '卧室',
  kitchen: '厨房',
  bathroom: '卫生间',
  study: '书房',
  dining: '餐厅',
  balcony: '阳台',
  entryway: '玄关',
}

function isWithinRange(dateStr: string, range: FilterRange): boolean {
  if (range === 'all') return true
  const recordDate = new Date(dateStr)
  const now = new Date()
  const days = range === '7d' ? 7 : 30
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
  return recordDate >= cutoff
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const CN_M = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
  return `${y} 年 ${CN_M[m]} 月 ${d} 日`
}

function buildMinimalReport(record: FengShuiHistoryRecordV31): ProfessionalReportV31 {
  return {
    score12D: {
      dimensions: {} as any,
      overall: record.overallScore,
      level: record.overallScore >= 80 ? '优' : record.overallScore >= 60 ? '良' : '平',
      summary: `${record.roomName} 综合评分 ${record.overallScore} 分`,
    },
    patternAnalysis: {
      description: '基于历史记录重建的格局分析',
      principle: '格局为风水之本',
      explanation: '此报告由历史记录重建，详细分析请参阅原始报告。',
      strength: [],
      weakness: record.mainIssues,
    },
    windQiAnalysis: {
      description: '气流与聚气分析',
      qiFlow: '信息需重新分析',
      windGathering: '信息需重新分析',
      suggestions: [],
    },
    wealthAnalysis: {
      description: '财位分析',
      wealthPositions: [],
      suggestions: [],
    },
    healthAnalysis: {
      description: '健康影响分析',
      healthFactors: [],
      riskAreas: [],
      suggestions: [],
    },
    careerAnalysis: {
      description: '事业影响分析',
      careerFactors: [],
      opportunities: [],
      obstacles: [],
      suggestions: [],
    },
    familyAnalysis: {
      description: '家庭关系分析',
      harmonyFactors: [],
      tensionAreas: [],
      suggestions: [],
    },
    issues: record.mainIssues.map((title, i) => ({
      id: `hist_issue_${i}`,
      title,
      severity: 'moderate' as const,
      category: 'living' as const,
      description: title,
      principle: '',
      ruleId: '',
    })),
    remediationPlans: [],
    classicalInterpretation: {
      theories: [],
      summary: '',
    },
    summary: record.roomName + ' 的风水勘测历史记录',
    credibility: record.credibility,
    annotations: record.annotations,
    schools: [],
  }
}

// ── Mini hexagram lines ───────────────────────────────

function MiniLines({ lines }: { lines: string[] }) {
  const displayed = [...lines].reverse()
  return (
    <div className="mini-lines">
      {displayed.map((line, i) => (
        <div key={i} className={`mini-line ${line === '阳' ? 'yang' : 'yin'}`}>
          {line === '阳' ? (
            <span className="mini-bar yang-full" />
          ) : (
            <>
              <span className="mini-bar yin-half" />
              <span className="mini-gap" />
              <span className="mini-bar yin-half" />
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Score pill ────────────────────────────────────────

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-pill">
      <span className="pill-label">{label}</span>
      <span className="pill-value">{value}</span>
    </div>
  )
}

// ── Status badge ──────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: '待整改', cls: 'status-active' },
    remediated: { label: '已整改', cls: 'status-remediated' },
    archived: { label: '已归档', cls: 'status-archived' },
  }
  const info = map[status]
  if (!info) return null
  return <span className={`fs-status-badge ${info.cls}`}>{info.label}</span>
}

// ── Favorite button ───────────────────────────────────

function FavoriteButton({ favorite, onToggle }: { favorite?: boolean; onToggle: () => void }) {
  return (
    <button
      className={`fs-favorite-btn ${favorite ? 'active' : ''}`}
      onClick={onToggle}
      title={favorite ? '取消收藏' : '收藏'}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill={favorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  )
}

// ── Daily record card ─────────────────────────────────

function DailyCard({ record }: { record: TimelineRecord & { record_type: 'daily' } }) {
  const meta = RECORD_TYPE_META[record.record_type]
  const p = record.payload

  return (
    <div className="tl-card">
      <div className="tl-card-head">
        <div className="tl-type-badge" style={{ color: meta.color, borderColor: meta.color }}>
          <span className="tl-type-icon">{meta.icon}</span>
          <span>{meta.label}</span>
        </div>
        <Link to={meta.detailPath} className="tl-detail-btn" title="查看详情">
          查看详情 &rarr;
        </Link>
      </div>

      <div className="tl-card-body">
        <div className="tl-hex-info">
          <span className="tl-symbol">{p.hexagram_symbol}</span>
          <div className="tl-hex-text">
            <span className="tl-hex-num">第 {p.hexagram_number} 卦</span>
            <span className="tl-hex-name">{p.hexagram_name}卦</span>
          </div>
        </div>

        <MiniLines lines={p.lines} />

        <div className="tl-scores">
          <div className="tl-score-main">
            <span className="tl-score-num">{p.score}</span>
            <span className="tl-score-lbl">玄风指数</span>
          </div>
          <div className="tl-score-dims">
            <ScorePill label="事业" value={p.career_score} />
            <ScorePill label="财运" value={p.wealth_score} />
            <ScorePill label="感情" value={p.love_score} />
            <ScorePill label="健康" value={p.health_score} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── FengShui record card ──────────────────────────────

function FengShuiCard({
  record,
  v31Record,
  onDelete,
  onToggleFavorite,
  onUpdateStatus,
  onExportPDF,
  batchMode,
  selected,
  onToggleSelect,
}: {
  record: TimelineRecord & { record_type: 'fengshui' }
  v31Record?: FengShuiHistoryRecordV31
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onUpdateStatus: (id: string, status: 'active' | 'remediated') => void
  onExportPDF: (record: FengShuiHistoryRecordV31) => void
  batchMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
}) {
  const meta = RECORD_TYPE_META[record.record_type]
  const p = record.payload
  const navigate = useNavigate()
  const isV31 = record.source === 'v31'

  const handleShare = () => {
    if (isV31 && v31Record) {
      const text = generateShareTextV31(v31Record)
      if (navigator.share) {
        navigator.share({ title: '玄风门风水勘测', text })
      } else {
        navigator.clipboard.writeText(text).then(() => alert('报告摘要已复制到剪贴板'))
      }
      return
    }
    const fsRecord: FengShuiHistoryRecord = {
      id: record.id,
      roomType: p.roomType,
      roomName: p.roomName,
      imageData: p.imageData,
      overallScore: p.overallScore,
      confidenceLevel: p.confidenceLevel as any,
      confidenceScore: p.confidenceScore ?? 0,
      mainIssues: p.mainIssues,
      mainSuggestions: p.mainSuggestions ?? [],
      createdAt: record.created_at,
      analysisDurationMs: 0,
    }
    const text = exportFengShuiHistoryForShare(fsRecord)
    if (navigator.share) {
      navigator.share({ title: '玄风门风水勘测', text })
    } else {
      navigator.clipboard.writeText(text).then(() => alert('报告摘要已复制到剪贴板'))
    }
  }

  const handleExportPDF = () => {
    if (v31Record) {
      onExportPDF(v31Record)
    }
  }

  return (
    <div className={`tl-card tl-card-fengshui ${selected ? 'selected' : ''}`}>
      <div className="tl-card-head">
        <div className="tl-card-head-left">
          {batchMode && (
            <label className="batch-checkbox">
              <input type="checkbox" checked={selected} onChange={() => onToggleSelect(record.id)} />
            </label>
          )}
          <div className="tl-type-badge" style={{ color: meta.color, borderColor: meta.color }}>
            <span className="tl-type-icon">{meta.icon}</span>
            <span>{meta.label}</span>
          </div>
          {isV31 && p.status && <StatusBadge status={p.status} />}
        </div>
        <div className="tl-card-head-right">
          {isV31 && (
            <FavoriteButton favorite={p.favorite} onToggle={() => onToggleFavorite(record.id)} />
          )}
          <span className="tl-detail-btn" style={{ color: meta.color }}>
            {p.roomName}
          </span>
        </div>
      </div>

      <div className="tl-card-body">
        <div className="fs-card-main">
          {p.imageData && (
            <div className="fs-thumb-wrap">
              <img src={p.imageData} alt="风水勘测空间" className="fs-thumb" loading="lazy" />
            </div>
          )}
          <div className="fs-info">
            <div className="fs-score-row">
              <div className="fs-score-main">
                <span className="fs-score-num">{p.overallScore}</span>
                <span className="fs-score-lbl">综合评分</span>
              </div>
              <div className="fs-confidence">
                <span className="fs-conf-label">可信度</span>
                <span className="fs-conf-value">
                  {p.credibility
                    ? p.credibility.score + ' 分'
                    : p.confidenceLevel === 'high'
                      ? '高'
                      : p.confidenceLevel === 'fairlyHigh'
                        ? '较高'
                        : p.confidenceLevel === 'moderate'
                          ? '一般'
                          : '低'}
                </span>
              </div>
            </div>

            {p.mainIssues.length > 0 && (
              <div className="fs-mini-section">
                <span className="fs-mini-title">主要问题</span>
                <ul className="fs-mini-list">
                  {p.mainIssues.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {(p.mainSuggestions && p.mainSuggestions.length > 0) && (
              <div className="fs-mini-section">
                <span className="fs-mini-title">主要建议</span>
                <ul className="fs-mini-list">
                  {p.mainSuggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {isV31 && p.tags && p.tags.length > 0 && (
              <div className="fs-tags">
                {p.tags.map((tag, i) => (
                  <span key={i} className="fs-tag">{tag}</span>
                ))}
              </div>
            )}

            {isV31 && p.notes && (
              <div className="fs-notes">
                <span className="fs-mini-title">备注</span>
                <p>{p.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="fs-actions">
          <button className="fs-action-btn" onClick={() => navigate('/fengshui')}>
            再次查看
          </button>
          <button className="fs-action-btn primary" onClick={() => navigate('/fengshui')}>
            重新分析
          </button>
          <button className="fs-action-btn" onClick={handleShare}>
            分享
          </button>
          {isV31 && v31Record && (
            <button className="fs-action-btn" onClick={handleExportPDF}>
              导出PDF
            </button>
          )}
          {isV31 && p.status === 'active' && (
            <button className="fs-action-btn success" onClick={() => onUpdateStatus(record.id, 'remediated')}>
              标记整改
            </button>
          )}
          {isV31 && p.status === 'remediated' && (
            <button className="fs-action-btn warn" onClick={() => onUpdateStatus(record.id, 'active')}>
              撤销整改
            </button>
          )}
          <button className="fs-action-btn danger" onClick={() => onDelete(record.id)}>
            删除
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Record card dispatcher ────────────────────────────

function RecordCard({
  record,
  v31Record,
  onDelete,
  onToggleFavorite,
  onUpdateStatus,
  onExportPDF,
  batchMode,
  selected,
  onToggleSelect,
}: {
  record: TimelineRecord
  v31Record?: FengShuiHistoryRecordV31
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onUpdateStatus: (id: string, status: 'active' | 'remediated') => void
  onExportPDF: (record: FengShuiHistoryRecordV31) => void
  batchMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
}) {
  if (record.record_type === 'daily') {
    return <DailyCard record={record} />
  }
  return (
    <FengShuiCard
      record={record}
      v31Record={v31Record}
      onDelete={onDelete}
      onToggleFavorite={onToggleFavorite}
      onUpdateStatus={onUpdateStatus}
      onExportPDF={onExportPDF}
      batchMode={batchMode}
      selected={selected}
      onToggleSelect={onToggleSelect}
    />
  )
}

// ── Timeline node ─────────────────────────────────────

function TimelineNode({
  record,
  v31Record,
  onDelete,
  onToggleFavorite,
  onUpdateStatus,
  onExportPDF,
  batchMode,
  selected,
  onToggleSelect,
}: {
  record: TimelineRecord
  v31Record?: FengShuiHistoryRecordV31
  onDelete: (id: string) => void
  onToggleFavorite: (id: string) => void
  onUpdateStatus: (id: string, status: 'active' | 'remediated') => void
  onExportPDF: (record: FengShuiHistoryRecordV31) => void
  batchMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
}) {
  const meta = RECORD_TYPE_META[record.record_type]
  return (
    <div className="tl-node">
      <div className="tl-node-left">
        <div className="tl-date-label">{formatDisplayDate(record.date)}</div>
        <div className="tl-dot-wrap">
          <div className="tl-dot" style={{ borderColor: meta.color, boxShadow: `0 0 8px ${meta.color}55` }}>
            <span className="tl-dot-icon">{meta.icon}</span>
          </div>
          <div className="tl-line-segment" />
        </div>
      </div>
      <div className="tl-node-right">
        <RecordCard
          record={record}
          v31Record={v31Record}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onUpdateStatus={onUpdateStatus}
          onExportPDF={onExportPDF}
          batchMode={batchMode}
          selected={selected}
          onToggleSelect={onToggleSelect}
        />
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────

function HistorySkeleton() {
  return (
    <div className="history-skeleton">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skel-node">
          <div className="skel-left">
            <div className="skel skel-date" />
            <div className="skel skel-dot-circle" />
          </div>
          <div className="skel skel-card" />
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────

function EmptyState({
  range,
  typeFilter,
  searchQuery,
  fsStatusFilter,
  roomTypeFilter,
}: {
  range: FilterRange
  typeFilter: TypeFilter
  searchQuery: string
  fsStatusFilter: FsStatusFilter
  roomTypeFilter: RoomTypeFilter
}) {
  const rangeLabel = FILTER_OPTIONS.find(f => f.value === range)?.label ?? ''
  const typeLabel = typeFilter === 'all' ? '' : TYPE_OPTIONS.find(t => t.value === typeFilter)?.label + '\u00b7'
  const hasFilters = searchQuery || fsStatusFilter !== 'all' || roomTypeFilter !== 'all'
  return (
    <div className="history-empty">
      <span className="empty-symbol">&#x2637;</span>
      <p className="empty-title">
        {hasFilters ? '未找到匹配记录' : `${rangeLabel}${typeLabel}暂无记录`}
      </p>
      <p className="empty-sub">
        {hasFilters
          ? '尝试调整搜索关键词或筛选条件'
          : typeFilter === 'fengshui'
            ? '前往「风水勘测」进行空间分析，记录将自动保存于此'
            : '每日访问「今日卦运」，记录将自动保存于此'}
      </p>
      {!hasFilters && (
        <Link to={typeFilter === 'fengshui' ? '/fengshui' : '/daily'} className="empty-cta">
          前往{typeFilter === 'fengshui' ? '风水勘测' : '今日卦运'}
        </Link>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────

export default function History() {
  usePageSEO({
    title: '历史记录 | 玄风门',
    description: '查看您的六爻占卜、每日卦运和风水勘测历史记录，回顾推演结果与运势变化。',
    canonical: 'https://xuanfengmen.com/records',
    noindex: true
  })

  const [records, setRecords] = useState<TimelineRecord[]>([])
  const [v31Records, setV31Records] = useState<FengShuiHistoryRecordV31[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [filter, setFilter] = useState<FilterRange>('30d')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [fsStatusFilter, setFsStatusFilter] = useState<FsStatusFilter>('all')
  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomTypeFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    try {
      const visitorId = getVisitorId()
      let dailyRecords: TimelineRecord[] = []

      if (!supabase) {
        const offlineRecords = getOfflineDailyRecords(visitorId)
        dailyRecords = offlineRecords.map((row: DailyHexagramWithDetail) => ({
          id:          row.id,
          record_type: 'daily' as const,
          date:        row.date,
          created_at:  row.created_at,
          payload: {
            hexagram_number: row.hexagram_number,
            hexagram_name:   row.hexagram.name,
            hexagram_symbol: row.hexagram.symbol,
            lines:           row.hexagram.lines,
            score:           row.score,
            career_score:    row.career_score,
            wealth_score:    row.wealth_score,
            love_score:      row.love_score,
            health_score:    row.health_score,
          },
        }))
      } else {
        const { data, error: fetchErr } = await supabase
          .from('daily_hexagrams')
          .select(`*, hexagram:hexagrams(number, name, symbol, lines)`)
          .eq('visitor_id', visitorId)
          .order('date', { ascending: false })

        if (fetchErr) throw fetchErr

        dailyRecords = (data ?? []).map((row: DailyHexagramWithDetail) => ({
          id:          row.id,
          record_type: 'daily' as const,
          date:        row.date,
          created_at:  row.created_at,
          payload: {
            hexagram_number: row.hexagram_number,
            hexagram_name:   row.hexagram.name,
            hexagram_symbol: row.hexagram.symbol,
            lines:           row.hexagram.lines,
            score:           row.score,
            career_score:    row.career_score,
            wealth_score:    row.wealth_score,
            love_score:      row.love_score,
            health_score:    row.health_score,
          },
        }))
      }

      const v30Records = getFengShuiHistory().map((row): TimelineRecord => ({
        id: row.id,
        record_type: 'fengshui',
        date: row.createdAt.slice(0, 10),
        created_at: row.createdAt,
        source: 'v30',
        payload: {
          roomType: row.roomType,
          roomName: row.roomName,
          imageData: row.imageData,
          overallScore: row.overallScore,
          confidenceLevel: row.confidenceLevel,
          confidenceScore: row.confidenceScore,
          mainIssues: row.mainIssues,
          mainSuggestions: row.mainSuggestions,
        },
      }))

      const v31Raw = getHistoryV31()
      setV31Records(v31Raw)

      const v31RecordsMapped = v31Raw.map((row): TimelineRecord => ({
        id: row.id,
        record_type: 'fengshui',
        date: row.createdAt.slice(0, 10),
        created_at: row.createdAt,
        source: 'v31',
        payload: {
          roomType: row.roomType,
          roomName: row.roomName,
          imageData: row.imageData,
          overallScore: row.overallScore,
          mainIssues: row.mainIssues,
          remediationPlans: row.remediationPlans,
          tags: row.tags,
          notes: row.notes,
          status: row.status,
          favorite: row.favorite,
          credibility: row.credibility,
        },
      }))

      const merged = [...dailyRecords, ...v30Records, ...v31RecordsMapped].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setRecords(merged)
      setStatus('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取失败，请刷新重试')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleDelete = useCallback((id: string) => {
    if (!confirm('确定删除这条记录吗？此操作不可恢复。')) return
    const record = records.find(r => r.id === id)
    if (!record || record.record_type !== 'fengshui') return
    if (record.source === 'v31') {
      deleteHistoryV31(id)
    } else {
      deleteFengShuiHistory(id)
    }
    setRecords(prev => prev.filter(r => r.id !== id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [records])

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id)
    const updatedV31 = getHistoryV31()
    setV31Records(updatedV31)
    setRecords(prev => prev.map(r => {
      if (r.id === id && r.record_type === 'fengshui' && r.source === 'v31') {
        return { ...r, payload: { ...r.payload, favorite: !r.payload.favorite } }
      }
      return r
    }))
  }, [])

  const handleUpdateStatus = useCallback((id: string, statusVal: 'active' | 'remediated') => {
    updateStatus(id, statusVal)
    const updatedV31 = getHistoryV31()
    setV31Records(updatedV31)
    setRecords(prev => prev.map(r => {
      if (r.id === id && r.record_type === 'fengshui' && r.source === 'v31') {
        return { ...r, payload: { ...r.payload, status: statusVal } }
      }
      return r
    }))
  }, [])

  const handleExportPDF = useCallback(async (v31Record: FengShuiHistoryRecordV31) => {
    try {
      const config: PDFReportConfig = {
        title: '玄风门 \u00b7 风水勘测专业报告',
        subtitle: v31Record.roomName,
        includeAnnotations: true,
        includeClassical: true,
        includeRadarChart: true,
        pageSize: 'A4',
      }
      const report = buildMinimalReport(v31Record)
      const dataUrl = await generatePDF(config, report, v31Record.annotations)
      downloadPDF(dataUrl, `玄风门风水报告_${v31Record.roomName}_${Date.now()}.pdf`)
    } catch (e) {
      alert('PDF 导出失败，请稍后重试')
    }
  }, [])

  const handleExportJSON = useCallback(() => {
    const json = exportHistoryToJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuanfeng_fengshui_history_v31_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    if (!confirm(`确定删除选中的 ${selectedIds.size} 条记录吗？此操作不可恢复。`)) return
    selectedIds.forEach(id => {
      const record = records.find(r => r.id === id)
      if (!record || record.record_type !== 'fengshui') return
      if (record.source === 'v31') {
        deleteHistoryV31(id)
      } else {
        deleteFengShuiHistory(id)
      }
    })
    setRecords(prev => prev.filter(r => !selectedIds.has(r.id)))
    setSelectedIds(new Set())
    setBatchMode(false)
  }, [selectedIds, records])

  const filtered = useMemo(() => {
    let result = records

    if (typeFilter !== 'all') {
      result = result.filter(r => r.record_type === typeFilter)
    }

    result = result.filter(r => isWithinRange(r.date, filter))

    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter(r => {
        if (r.record_type === 'daily') {
          const p = r.payload
          return (
            p.hexagram_name.includes(q) ||
            p.hexagram_symbol.includes(q)
          )
        }
        const p = r.payload
        const fields = [
          p.roomName,
          ...p.mainIssues,
          ...(p.mainSuggestions || []),
          ...(p.remediationPlans || []),
          ...(p.tags || []),
          p.notes,
        ]
        return fields.some(f => f?.toLowerCase().includes(q))
      })
    }

    if (fsStatusFilter !== 'all') {
      result = result.filter(r => {
        if (r.record_type !== 'fengshui') return false
        if (fsStatusFilter === 'favorite') return r.payload.favorite === true
        return r.payload.status === fsStatusFilter
      })
    }

    if (roomTypeFilter !== 'all') {
      result = result.filter(r => {
        if (r.record_type !== 'fengshui') return false
        const rt = r.payload.roomType.toLowerCase()
        const target = roomTypeFilter.toLowerCase()
        return rt === target || rt === (ROOM_TYPE_MAP[target] || '').toLowerCase()
      })
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'scoreHigh': {
          const sa = a.record_type === 'fengshui' ? a.payload.overallScore : a.record_type === 'daily' ? a.payload.score : 0
          const sb = b.record_type === 'fengshui' ? b.payload.overallScore : b.record_type === 'daily' ? b.payload.score : 0
          return sb - sa
        }
        case 'scoreLow': {
          const sa = a.record_type === 'fengshui' ? a.payload.overallScore : a.record_type === 'daily' ? a.payload.score : 0
          const sb = b.record_type === 'fengshui' ? b.payload.overallScore : b.record_type === 'daily' ? b.payload.score : 0
          return sa - sb
        }
        default:
          return 0
      }
    })

    return result
  }, [records, typeFilter, filter, searchQuery, fsStatusFilter, roomTypeFilter, sortBy])

  const hasFengShui = records.some(r => r.record_type === 'fengshui')
  const hasDaily = records.some(r => r.record_type === 'daily')
  const showFsFilters = (typeFilter === 'all' || typeFilter === 'fengshui') && hasFengShui

  return (
    <div className="history-page">

      {/* Page header */}
      <div className="history-header">
        <div className="container">
          <span className="section-label">&#x2637; 历史记录</span>
          <h1 className="history-title">卦运与勘测</h1>
          <p className="history-sub">每一次推演，皆有迹可循</p>
        </div>
      </div>

      <div className="container history-container">

        {/* Search */}
        <div className="history-search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="history-search-input"
            placeholder="搜索空间名称、问题、建议、标签或备注..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')} title="清空">
              &times;
            </button>
          )}
        </div>

        {/* Type filter */}
        {(hasDaily || hasFengShui) && (
          <div className="filter-bar type-filter">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`filter-btn ${typeFilter === opt.value ? 'active' : ''}`}
                onClick={() => setTypeFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Fengshui status & room type filters */}
        {showFsFilters && (
          <>
            <div className="filter-bar status-filter">
              {FS_STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`filter-btn ${fsStatusFilter === opt.value ? 'active' : ''}`}
                  onClick={() => setFsStatusFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="filter-bar room-filter">
              <span className="filter-label">房型</span>
              <select
                className="filter-select"
                value={roomTypeFilter}
                onChange={e => setRoomTypeFilter(e.target.value as RoomTypeFilter)}
              >
                {ROOM_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Date filter + Sort + Batch + Export */}
        <div className="filter-bar date-sort-filter">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-btn ${filter === opt.value ? 'active' : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          <div className="filter-spacer" />
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {hasFengShui && (
            <>
              <button
                className={`filter-btn batch-toggle ${batchMode ? 'active' : ''}`}
                onClick={() => {
                  setBatchMode(!batchMode)
                  setSelectedIds(new Set())
                }}
              >
                {batchMode ? '取消批量' : '批量操作'}
              </button>
              {batchMode && (
                <button
                  className="filter-btn danger"
                  onClick={handleBatchDelete}
                  disabled={selectedIds.size === 0}
                >
                  批量删除 ({selectedIds.size})
                </button>
              )}
              <button className="filter-btn export-btn" onClick={handleExportJSON}>
                导出JSON
              </button>
            </>
          )}
        </div>

        {/* States */}
        {status === 'loading' && <HistorySkeleton />}

        {status === 'error' && (
          <div className="history-error">
            <span className="error-icon">&#x26A0;</span>
            <p>{error}</p>
          </div>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <EmptyState
            range={filter}
            typeFilter={typeFilter}
            searchQuery={searchQuery}
            fsStatusFilter={fsStatusFilter}
            roomTypeFilter={roomTypeFilter}
          />
        )}

        {/* Timeline */}
        {status === 'ready' && filtered.length > 0 && (
          <div className="timeline">
            {filtered.map((record, idx) => (
              <div key={record.id} className={`tl-node-wrap ${idx === filtered.length - 1 ? 'last' : ''}`}>
                <TimelineNode
                  record={record}
                  v31Record={v31Records.find(r => r.id === record.id)}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                  onUpdateStatus={handleUpdateStatus}
                  onExportPDF={handleExportPDF}
                  batchMode={batchMode}
                  selected={selectedIds.has(record.id)}
                  onToggleSelect={toggleSelect}
                />
              </div>
            ))}
            <div className="tl-end-dot" />
          </div>
        )}

        {/* Record count */}
        {status === 'ready' && records.length > 0 && (
          <p className="record-count">
            共 {records.length} 条记录
            {filter !== 'all' && ` \u00b7 当前显示 ${filtered.length} 条`}
          </p>
        )}
      </div>
    </div>
  )
}
