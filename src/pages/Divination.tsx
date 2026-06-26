import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getVisitorId } from '../lib/hexagram'
import type { Hexagram } from '../lib/hexagram'
import {
  buildAnalysis,
  rawToPolarity,
  CATEGORY_OPTIONS,
  type RawLine,
  type DivinationCategory,
  type DivinationWithDetail,
} from '../lib/divination'
import './Divination.css'

// ── Types ─────────────────────────────────────────
type Phase  = 'prepare' | 'ceremony' | 'result'
type CStage = 1 | 2 | 3 | 4 | 5 | 6

// ── Stage labels ──────────────────────────────────
const STAGE_TEXT: Record<CStage, string[]> = {
  1: ['太极生两仪'],
  2: ['两仪生四象'],
  3: ['四象生八卦'],
  4: ['八卦演六爻'],
  5: ['六爻既成', '演算天机'],
  6: [],
}

// ── 8 trigrams, clockwise from top (Fuxi sequence) ──
const TRIGRAMS_8 = [
  { sym: '☰', name: '乾' },  // 0° — top
  { sym: '☱', name: '兌' },  // 45°
  { sym: '☲', name: '離' },  // 90° — right
  { sym: '☳', name: '震' },  // 135°
  { sym: '☷', name: '坤' },  // 180° — bottom
  { sym: '☶', name: '艮' },  // 225°
  { sym: '☵', name: '坎' },  // 270° — left
  { sym: '☴', name: '巽' },  // 315°
]

// Spin period (ms per revolution) per ceremony stage
const SPIN_MS = {
  prepare: 12000,
  s1: 12000,
  s2: 12000,
  s3: 8000,
  s4: 5500,
  s5: 3000,
  s6: 80000,
}

// Ceremony timing (ms from click)
const T2  =  3000   // stage 1 → 2
const T3  =  7000   // stage 2 → 3
const T4  = 11000   // stage 3 → 4
const DL  =   320   // interval per line
const T5  = T4 + 6 * DL + 200   // ~13200
const T6  = T5 + 5000            // ~18200
const TAD = T6 + 2800            // ~21000 — advance to result

// ── Hex lookup ────────────────────────────────────
const TRIGRAM_NUM: Record<string, number> = {
  '111': 1, '000': 2, '010': 3, '101': 4,
  '100': 5, '001': 6, '110': 7, '011': 8,
}
const HEX_TABLE: number[][] = [
  [ 1, 11,  5, 14, 34, 26, 43,  9],
  [12,  2,  8, 35, 16, 23, 45, 20],
  [ 6,  7, 29, 64, 40,  4, 47, 59],
  [13, 36, 63, 30, 55, 22, 49, 37],
  [25, 24,  3, 21, 51, 27, 17, 42],
  [33, 15, 39, 56, 62, 52, 31, 53],
  [10, 19, 60, 38, 54, 41, 58, 61],
  [44, 46, 48, 50, 32, 18, 28, 57],
]

function linesToNum(lines: string[]): number {
  const lo = (TRIGRAM_NUM[lines.slice(0, 3).map(p => p === '阳' ? '1' : '0').join('')] ?? 1) - 1
  const uo = (TRIGRAM_NUM[lines.slice(3, 6).map(p => p === '阳' ? '1' : '0').join('')] ?? 1) - 1
  return HEX_TABLE[lo][uo]
}

function throwOneLine(): RawLine {
  const t = [0, 1, 2].reduce(s => s + (Math.random() < 0.5 ? 3 : 2), 0)
  return t === 6 ? '老阴' : t === 7 ? '少阳' : t === 8 ? '少阴' : '老阳'
}

// ── Traditional taiji SVG ─────────────────────────
// Construction: outer circle radius R, two fish bodies each bounded by
// a half-outer-arc and two opposite small-circle (radius R/2) arcs.
// Arc flag notation: A rx ry 0 large-arc sweep x y
//   sweep=1 → clockwise in screen space (SVG Y-axis points down)
//   sweep=0 → counter-clockwise
function TaijiSVG({ size = 90, spinning = false }: { size?: number; spinning?: boolean }) {
  const cx = size / 2
  const cy = size / 2
  const R  = size * 0.44         // outer radius
  const sr = R / 2               // small-circle radius (fish body)
  const er = Math.max(1.5, sr * 0.20)  // eye radius — small, traditional proportion

  // Yang fish (white): right outer arc → lower small-circle left arc → upper small-circle right arc
  const yangPath = [
    `M ${cx} ${cy - R}`,
    `A ${R} ${R} 0 0 1 ${cx} ${cy + R}`,    // right half of outer circle (CW)
    `A ${sr} ${sr} 0 0 1 ${cx} ${cy}`,      // lower small circle, left-side arc (CW)
    `A ${sr} ${sr} 0 0 0 ${cx} ${cy - R}`,  // upper small circle, right-side arc (CCW)
    'Z',
  ].join(' ')

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={`taiji-svg${spinning ? ' taiji-spin' : ''}`}
    >
      {/* Yin base: fill entire circle black so yin area reads as solid against dark backgrounds */}
      <circle cx={cx} cy={cy} r={R} fill="#000000" />
      {/* Yang fish — pure white, drawn on top of the black base */}
      <path d={yangPath} fill="#FFFFFF" />
      {/* Yin eye: black dot enclosed within the yang (white) fish — lower body region */}
      <circle cx={cx} cy={cy + sr} r={er} fill="#000000" />
      {/* Yang eye: white dot enclosed within the yin (black) fish — upper body region */}
      <circle cx={cx} cy={cy - sr} r={er} fill="#FFFFFF" />
      {/* Gold outer border */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#D4AF37" strokeWidth="2" />
    </svg>
  )
}

// ── Hexagram lines (center, grows bottom-up) ──────
function HexLines({ lines, castCount }: { lines: RawLine[]; castCount: number }) {
  return (
    <div className="hcl-wrap">
      {[5, 4, 3, 2, 1, 0].map(idx => {
        const cast = idx < castCount
        const raw  = cast ? lines[idx] : undefined
        const pol  = raw ? rawToPolarity(raw) : null
        const chg  = raw === '老阳' || raw === '老阴'
        return (
          <div key={idx} className={`hcl-row${cast ? ' cast' : ' uncast'}`}>
            {cast && pol === '阳' && <span className={`hcl-bar hcl-full${chg ? ' hcl-chg' : ''}`} />}
            {cast && pol === '阴' && (
              <>
                <span className={`hcl-bar hcl-half${chg ? ' hcl-chg' : ''}`} />
                <span className="hcl-gap" />
                <span className={`hcl-bar hcl-half${chg ? ' hcl-chg' : ''}`} />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step bar ──────────────────────────────────────
const STEPS = [
  { num: '①', label: '问卦' },
  { num: '②', label: '观象成卦' },
  { num: '③', label: '卦象解读' },
]

function StepBar({ current }: { current: 0 | 1 | 2 }) {
  return (
    <div className="step-bar">
      {STEPS.map((s, i) => (
        <div key={i} className={`sb-item${i === current ? ' active' : i < current ? ' done' : ''}`}>
          <span className="sb-num">{s.num}</span>
          <span className="sb-lbl">{s.label}</span>
          {i < 2 && <span className="sb-conn" />}
        </div>
      ))}
    </div>
  )
}

// ── Result hexagram card ───────────────────────────
const LINE_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

function HexCard({
  hexagram, label, lines, changingPositions,
}: {
  hexagram: Hexagram; label: string; lines: string[]; changingPositions?: number[]
}) {
  const disp = [...lines].reverse()
  const lbls = ['上爻', '五爻', '四爻', '三爻', '二爻', '初爻']
  return (
    <div className="hxcard">
      <div className="hxcard-badge">{label}</div>
      <span className="hxcard-sym">{hexagram.symbol}</span>
      <div className="hxcard-meta">
        <span className="hxcard-num">第 {hexagram.number} 卦</span>
        <span className="hxcard-name">{hexagram.name}卦</span>
        <span className="hxcard-tri">{hexagram.upper_trigram}上 · {hexagram.lower_trigram}下</span>
      </div>
      <div className="hxcard-lines">
        {disp.map((line, i) => {
          const pos  = 6 - i
          const isCh = changingPositions?.includes(pos)
          return (
            <div key={i} className="hxl-row">
              <span className="hxl-lbl">{lbls[i]}</span>
              <div className="hxl-bars">
                {line === '阳' ? (
                  <span className={`hxl-bar hxl-full${isCh ? ' hxl-chg' : ''}`} />
                ) : (
                  <>
                    <span className={`hxl-bar hxl-half${isCh ? ' hxl-chg' : ''}`} />
                    <span className="hxl-gap" />
                    <span className={`hxl-bar hxl-half${isCh ? ' hxl-chg' : ''}`} />
                  </>
                )}
              </div>
              {isCh && <span className="hxl-dot" />}
            </div>
          )
        })}
      </div>
      <p className="hxcard-desc">「{hexagram.description}」</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────
export default function Divination() {
  const [phase, setPhase]                   = useState<Phase>('prepare')
  const [question, setQuestion]             = useState('')
  const [category, setCategory]             = useState<DivinationCategory>('general')

  // Ceremony
  const [cStage, setCStage]                 = useState<CStage>(1)
  const [allLines, setAllLines]             = useState<RawLine[]>([])
  const [revealedLines, setRevealedLines]   = useState(0)
  const [coinKey, setCoinKey]               = useState(0)
  const [spinMs, setSpinMs]                 = useState(SPIN_MS.prepare)
  const [ringDim, setRingDim]               = useState(false)
  const [showHexName, setShowHexName]       = useState(false)

  // Result
  const [result, setResult]                 = useState<DivinationWithDetail | null>(null)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [saveStatus, setSaveStatus]         = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function at(ms: number, fn: () => void) {
    timers.current.push(setTimeout(fn, ms))
  }
  function clearAll() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => {
    if (revealedLines > 0) setCoinKey(k => k + 1)
  }, [revealedLines])

  useEffect(() => {
    if (pendingAdvance && result) setPhase('result')
  }, [pendingAdvance, result])

  // ── Start ceremony ─────────────────────────────
  function startCeremony() {
    clearAll()
    setPhase('ceremony')
    setCStage(1)
    setRevealedLines(0)
    setCoinKey(0)
    setShowHexName(false)
    setPendingAdvance(false)
    setRingDim(true)          // ring dims during stages 1-2
    setSpinMs(SPIN_MS.s1)

    const lines: RawLine[] = Array.from({ length: 6 }, throwOneLine)
    setAllLines(lines)
    fetchResult(lines)

    at(T2, () => {
      setCStage(2)
    })

    at(T3, () => {
      setCStage(3)
      setRingDim(false)       // ring brightens back as trigrams form
      setSpinMs(SPIN_MS.s3)
    })

    at(T4, () => {
      setCStage(4)
      setSpinMs(SPIN_MS.s4)
    })

    for (let n = 1; n <= 6; n++) {
      const count = n
      at(T4 + count * DL, () => setRevealedLines(count))
    }

    at(T5, () => {
      setCStage(5)
      setSpinMs(SPIN_MS.s5)
    })

    at(T6, () => {
      setCStage(6)
      setSpinMs(SPIN_MS.s6)
      setShowHexName(true)
    })

    at(TAD, () => setPendingAdvance(true))
  }

  // ── Fetch / build result ───────────────────────
  async function fetchResult(lines: RawLine[]) {
    const primaryLines      = lines.map(rawToPolarity)
    const changingPositions = lines
      .map((r, i) => (r === '老阳' || r === '老阴' ? i + 1 : 0))
      .filter(Boolean)

    const hexagramNumber = linesToNum(primaryLines)

    let changedHexagramNumber: number | null = null
    if (changingPositions.length > 0) {
      const changedLines = primaryLines.map((p, i) =>
        changingPositions.includes(i + 1) ? (p === '阳' ? '阴' : '阳') : p
      )
      const cn = linesToNum(changedLines)
      if (cn !== hexagramNumber) changedHexagramNumber = cn
    }

    let hexagram
    let changedHexagram: Hexagram | null = null

    if (!supabase) {
      const { getHexagramByNumber } = await import('../lib/hexagram')
      hexagram = getHexagramByNumber(hexagramNumber)
      if (changedHexagramNumber) {
        changedHexagram = getHexagramByNumber(changedHexagramNumber)
      }
    } else {
      const [{ data: hexRow }, changedRow] = await Promise.all([
        supabase.from('hexagrams').select('*').eq('number', hexagramNumber).single(),
        changedHexagramNumber
          ? supabase.from('hexagrams').select('*').eq('number', changedHexagramNumber).single()
          : Promise.resolve({ data: null }),
      ])
      if (!hexRow) return
      hexagram = hexRow as Hexagram
      changedHexagram = changedRow.data as Hexagram | null
    }

    setResult({
      id:                      '',
      visitor_id:              getVisitorId(),
      question,
      category,
      hexagram_id:             hexagram.id,
      hexagram_number:         hexagramNumber,
      changed_hexagram_id:     changedHexagram?.id ?? null,
      changed_hexagram_number: changedHexagramNumber,
      raw_lines:               lines,
      changing_lines:          changingPositions,
      ai_analysis:             buildAnalysis(hexagram, changedHexagram, category, question),
      analysis_status:         'pending',
      created_at:              new Date().toISOString(),
      hexagram,
      changed_hexagram:        changedHexagram,
    })
  }

  // ── Save record ────────────────────────────────
  async function saveRecord() {
    if (!result) return
    if (!supabase) {
      setSaveStatus('saved')
      return
    }
    setSaveStatus('saving')
    const { data: ins, error } = await supabase
      .from('divinations')
      .insert({
        visitor_id:              result.visitor_id,
        question:                result.question,
        category:                result.category,
        hexagram_id:             result.hexagram_id,
        hexagram_number:         result.hexagram_number,
        changed_hexagram_id:     result.changed_hexagram_id,
        changed_hexagram_number: result.changed_hexagram_number,
        raw_lines:               result.raw_lines,
        changing_lines:          result.changing_lines,
        ai_analysis:             result.ai_analysis,
        analysis_status:         result.analysis_status,
      })
      .select()
      .single()
    if (error || !ins) { setSaveStatus('error'); return }
    setResult(prev => prev ? { ...prev, id: (ins as { id: string }).id } : prev)
    setSaveStatus('saved')
  }

  // ── Reset ──────────────────────────────────────
  function reset() {
    clearAll()
    setPhase('prepare')
    setQuestion('')
    setCategory('general')
    setCStage(1)
    setAllLines([])
    setRevealedLines(0)
    setCoinKey(0)
    setSpinMs(SPIN_MS.prepare)
    setRingDim(false)
    setShowHexName(false)
    setResult(null)
    setPendingAdvance(false)
    setSaveStatus('idle')
  }

  const primaryLines = result ? result.raw_lines.map(rawToPolarity) : []
  const changedLines = result?.changed_hexagram
    ? result.raw_lines.map((r, i) =>
        result.changing_lines.includes(i + 1)
          ? (rawToPolarity(r) === '阳' ? '阴' : '阳')
          : rawToPolarity(r)
      )
    : []

  const stepIdx: 0 | 1 | 2 = phase === 'prepare' ? 0 : phase === 'result' ? 2 : 1

  // ── Bagua ring: always rendered, hidden/dim when appropriate ──
  const BaguaRing = (
    <div className={`orbit-wrapper${ringDim ? ' dim' : ''}`}>
      <div className="orbit-ring" style={{ animationDuration: `${spinMs}ms` }}>
        {TRIGRAMS_8.map((item, i) => {
          const deg = i * 45
          return (
            <div
              key={item.name}
              className="orbit-slot"
              style={{ '--deg': `${deg}deg` } as React.CSSProperties}
            >
              {/* 1st layer: cancel static item rotation */}
              <div className="orbit-derotate" style={{ transform: `rotate(${-deg}deg)` }}>
                {/* 2nd layer: cancel ring's dynamic rotation */}
                <div className="orbit-inner" style={{ animationDuration: `${spinMs}ms` }}>
                  <span className="orbit-sym">{item.sym}</span>
                  <span className="orbit-nm">{item.name}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="div-page">
      <div className="div-header">
        <div className="container">
          <span className="section-label">六爻解卦</span>
          <h1 className="div-title">六爻算尽天下事</h1>
          <p className="div-sub">一事一问，一卦一断</p>
        </div>
      </div>

      <div className="container div-container">
        <StepBar current={stepIdx} />

        {/* ══ Prepare ══════════════════════════════ */}
        {phase === 'prepare' && (
          <div className="phase-prepare animate-fade-in">
            <div className="stage-wrap">
              <div className="bagua-stage">
                {/* Layer 2: gold ring glow */}
                <div className="taiji-gold-ring" />
                {/* Layer 3: dashed orbit track */}
                <div className="orbit-track-ring vis" />
                {/* Layer 3: rotating bagua ring */}
                {BaguaRing}
                {/* Layer 1 + center: yin-yang + text */}
                <button className="stage-center clickable" onClick={startCeremony}>
                  <TaijiSVG size={96} spinning />
                  <div className="center-prepare-text">
                    <span className="ctr-main">心诚则灵</span>
                    <span className="ctr-sub">点击起卦</span>
                  </div>
                </button>
              </div>
              <p className="stage-caption">默念所问之事，点击太极起卦</p>
            </div>

            <div className="step-card">
              <div className="form-field">
                <label className="field-label">所问之事（可不填）</label>
                <input
                  className="field-input"
                  type="text"
                  placeholder="例：近期事业发展如何？"
                  maxLength={60}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="field-label">问卦类别</label>
                <div className="category-grid">
                  {CATEGORY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`cat-btn${category === opt.value ? ' active' : ''}`}
                      onClick={() => setCategory(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ Ceremony ═════════════════════════════ */}
        {phase === 'ceremony' && (
          <div className="phase-ceremony animate-fade-in">
            <div className="stage-wrap">
              <div className="bagua-stage">
                {/* Layer 2: gold ring glow */}
                <div className="taiji-gold-ring" />
                {/* Layer 3: dashed orbit track */}
                <div className={`orbit-track-ring${!ringDim ? ' vis' : ''}`} />
                {/* Layer 3: rotating bagua ring */}
                {BaguaRing}

                {/* Layer 1: taiji always visible */}
                <div className="stage-center">
                  <TaijiSVG size={96} spinning />

                  {/* Stage 1: yin/yang labels on taiji */}
                  {cStage === 1 && (
                    <div className="liangyi-overlay">
                      <span className="ly-yang-lbl">阳</span>
                      <span className="ly-yin-lbl">阴</span>
                    </div>
                  )}
                </div>

                {/* Stage 2: four phenomena float between taiji and ring */}
                {cStage === 2 && (
                  <div className="stage-sixiang">
                    <span key="n" className="sxq sxq-n">太阳</span>
                    <span key="e" className="sxq sxq-e">少阴</span>
                    <span key="s" className="sxq sxq-s">太阴</span>
                    <span key="w" className="sxq sxq-w">少阳</span>
                  </div>
                )}

                {/* Stages 4-6: hex lines overlay */}
                {cStage >= 4 && (
                  <div className={`stage-hexlines${cStage === 5 ? ' hexlines-glow' : ''}`}>
                    {coinKey > 0 && (
                      <div key={coinKey} className="coin-anim" aria-hidden>
                        <div className="coin-disc">乾</div>
                      </div>
                    )}
                    <HexLines lines={allLines} castCount={revealedLines} />
                    {showHexName && result && (
                      <div className="cc-name-overlay animate-fade-in">
                        <span className="ccn-num">第 {result.hexagram_number} 卦</span>
                        <span className="ccn-sym">{result.hexagram.symbol}</span>
                        <span className="ccn-name">{result.hexagram.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Stage label */}
              {STAGE_TEXT[cStage].length > 0 && (
                <div key={cStage} className="ceremony-label animate-fade-in">
                  {STAGE_TEXT[cStage].map(t => (
                    <span key={t} className="ceremony-text">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ Result ═══════════════════════════════ */}
        {phase === 'result' && result && (
          <div className="phase-result animate-fade-in">
            <div className={`hx-row${result.changed_hexagram ? ' with-changed' : ''}`}>
              <HexCard
                hexagram={result.hexagram}
                label="本卦"
                lines={primaryLines}
                changingPositions={result.changing_lines}
              />
              {result.changed_hexagram && (
                <>
                  <div className="hx-arrow">→</div>
                  <HexCard
                    hexagram={result.changed_hexagram}
                    label="变卦"
                    lines={changedLines}
                  />
                </>
              )}
            </div>

            <div className={`changing-note${result.changing_lines.length === 0 ? ' no-chg' : ''}`}>
              {result.changing_lines.length > 0
                ? <><span className="chg-icon">◎</span> 变爻：{result.changing_lines.map(p => LINE_LABELS[p - 1]).join('、')}</>
                : <span>无变爻，卦象纯正</span>
              }
            </div>

            <div className="step-card analysis-section">
              <h3 className="analysis-title">卦象解析</h3>
              {result.question && (
                <p className="analysis-q">
                  「{result.question}」
                  <span className="analysis-cat"> · {CATEGORY_OPTIONS.find(o => o.value === result.category)?.label}</span>
                </p>
              )}
              <p className="analysis-body">{result.ai_analysis}</p>
              <div className="dim-rows">
                {([
                  { lbl: '总运', txt: result.hexagram.fortune },
                  {
                    lbl: CATEGORY_OPTIONS.find(o => o.value === result.category)?.label ?? '综合',
                    txt: result.category === 'career' ? result.hexagram.career
                       : result.category === 'wealth' ? result.hexagram.wealth
                       : result.category === 'love'   ? result.hexagram.love
                       : result.category === 'health' ? result.hexagram.health
                       : result.hexagram.fortune,
                  },
                  { lbl: '宜', txt: result.hexagram.advice_do.join('、') },
                  { lbl: '忌', txt: result.hexagram.advice_dont.join('、') },
                ] as { lbl: string; txt: string }[]).map(({ lbl, txt }) => (
                  <div key={lbl} className="score-row">
                    <span className="score-row-label">{lbl}</span>
                    <p className="score-row-text">{txt}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="result-actions">
              {saveStatus === 'idle'   && <button className="save-btn" onClick={saveRecord}>存入卦运记录</button>}
              {saveStatus === 'saving' && <button className="save-btn saving" disabled>存入中…</button>}
              {saveStatus === 'saved'  && <span className="save-done">✓ 已保存至卦运记录</span>}
              {saveStatus === 'error'  && <span className="save-err">保存失败，请重试</span>}
              <button className="reset-btn" onClick={reset}>重新起卦</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
