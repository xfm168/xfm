import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getVisitorId, type DailyHexagramWithDetail } from '../lib/hexagram'
import './History.css'

// ── Record type system (extensible for future record types) ──

type RecordType = 'daily' | 'divination' | 'fengshui'

interface TimelineRecord {
  id: string
  record_type: RecordType
  date: string           // YYYY-MM-DD
  created_at: string
  payload: DailyRecord   // union-ready: DailyRecord | DivinationRecord | FengshuiRecord
}

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

const RECORD_TYPE_META: Record<RecordType, { label: string; icon: string; detailPath: string; color: string }> = {
  daily:      { label: '今日卦运', icon: '☯', detailPath: '/daily',      color: 'var(--accent)' },
  divination: { label: '六爻解卦', icon: '☰', detailPath: '/liuyao',     color: '#7ec8e3' },
  fengshui:   { label: '风水勘测', icon: '⌂', detailPath: '/fengshui',   color: '#7ecb7e' },
}

// ── Filter ────────────────────────────────────────────

type FilterRange = '7d' | '30d' | 'all'

const FILTER_OPTIONS: { value: FilterRange; label: string }[] = [
  { value: '7d',  label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: 'all', label: '全部记录' },
]

function isWithinRange(dateStr: string, range: FilterRange): boolean {
  if (range === 'all') return true
  const recordDate = new Date(dateStr)
  const now = new Date()
  const days = range === '7d' ? 7 : 30
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1))
  return recordDate >= cutoff
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

// ── Daily record card ─────────────────────────────────

function DailyCard({ record }: { record: TimelineRecord }) {
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
          查看详情 →
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

// ── Timeline node ─────────────────────────────────────

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const CN_M = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
  return `${y} 年 ${CN_M[m]} 月 ${d} 日`
}

function TimelineNode({ record }: { record: TimelineRecord }) {
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
        <DailyCard record={record} />
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

function EmptyState({ range }: { range: FilterRange }) {
  const rangeLabel = FILTER_OPTIONS.find(f => f.value === range)?.label ?? ''
  return (
    <div className="history-empty">
      <span className="empty-symbol">☷</span>
      <p className="empty-title">{rangeLabel}暂无记录</p>
      <p className="empty-sub">每日访问「今日卦运」，记录将自动保存于此</p>
      <Link to="/daily" className="empty-cta">前往今日卦运</Link>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────

export default function History() {
  const [records, setRecords] = useState<TimelineRecord[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [filter, setFilter] = useState<FilterRange>('30d')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const visitorId = getVisitorId()

        const { data, error: fetchErr } = await supabase
          .from('daily_hexagrams')
          .select(`*, hexagram:hexagrams(number, name, symbol, lines)`)
          .eq('visitor_id', visitorId)
          .order('date', { ascending: false })

        if (fetchErr) throw fetchErr
        if (cancelled) return

        const mapped: TimelineRecord[] = (data ?? []).map((row: DailyHexagramWithDetail) => ({
          id:          row.id,
          record_type: 'daily' as RecordType,
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

        setRecords(mapped)
        setStatus('ready')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败，请刷新重试')
          setStatus('error')
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const filtered = records.filter(r => isWithinRange(r.date, filter))

  return (
    <div className="history-page">

      {/* Page header */}
      <div className="history-header">
        <div className="container">
          <span className="section-label">☷ 卦运记录</span>
          <h1 className="history-title">历史卦象</h1>
          <p className="history-sub">每一次起卦，皆有迹可循</p>
        </div>
      </div>

      <div className="container history-container">

        {/* Filter bar */}
        <div className="filter-bar">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`filter-btn ${filter === opt.value ? 'active' : ''}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* States */}
        {status === 'loading' && <HistorySkeleton />}

        {status === 'error' && (
          <div className="history-error">
            <span className="error-icon">⚠</span>
            <p>{error}</p>
          </div>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <EmptyState range={filter} />
        )}

        {/* Timeline */}
        {status === 'ready' && filtered.length > 0 && (
          <div className="timeline">
            {filtered.map((record, idx) => (
              <div key={record.id} className={`tl-node-wrap ${idx === filtered.length - 1 ? 'last' : ''}`}>
                <TimelineNode record={record} />
              </div>
            ))}
            <div className="tl-end-dot" />
          </div>
        )}

        {/* Record count */}
        {status === 'ready' && records.length > 0 && (
          <p className="record-count">
            共 {records.length} 条记录
            {filter !== 'all' && ` · 当前显示 ${filtered.length} 条`}
          </p>
        )}
      </div>
    </div>
  )
}
