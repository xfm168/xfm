/**
 * P4.7 CaseLearningEngine — 案例学习系统引擎（纯 Plugin，不修改 Kernel）
 *
 * 核心设计理念：
 *   - 支持真实案例、匿名案例、专家案例、经典案例四大类型
 *   - 自动提取命盘 pattern（日主五行、月令、格局等）
 *   - 训练 Pattern Weight、Explain Weight、Confidence Weight 三维权重
 *   - 相同 pattern 出现越多，权重越高
 *   - 验证案例权重更高，专家案例权重最高
 *   - 提供统计报告与学习建议
 *
 * 古籍依据：
 *   《论语》："学而时习之，不亦说乎。" —— 案例学习之道，在于持续积累与温习。
 *   《荀子》："不积跬步，无以至千里。" —— 案例学习须积少成多，由量变而质变。
 *   《易经》："君子以多识前言往行，以畜其德。" —— 广识古例，畜养分析之德。
 *
 * 设计原则：纯 Plugin，不修改 Kernel，不使用反引号模板字符串，数据存储在内存中。
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 随机选取数组中一个元素（避免模板化输出） */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 随机选取数组中 N 个不重复元素（Fisher-Yates 洗牌） */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

/** 生成短唯一 ID */
function generateId(prefix: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).substring(2, 8)
  return prefix + '-' + ts + '-' + rand
}

/** 安全提取对象中的字符串字段 */
function safeStr(obj: Record<string, unknown>, field: string): string {
  const val = obj[field]
  return typeof val === 'string' && val.length > 0 ? val : ''
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 案例类型 */
export type CaseType = 'real' | 'anonymous' | 'expert' | 'classic'

/** 案例状态 */
export type CaseStatus = 'pending' | 'validated' | 'rejected'

/** 案例条目 */
export interface CaseEntry {
  id: string
  chartData: Record<string, unknown>
  type: CaseType
  status: CaseStatus
  source: string
  validatedBy?: string
  validationNote?: string
  patternWeights: Record<string, number>
  explainWeights: Record<string, number>
  confidenceWeights: Record<string, number>
  addedAt: string
}

/** 学习统计信息 */
export interface LearningStats {
  totalCases: number
  realCases: number
  expertCases: number
  classicCases: number
  validatedCases: number
  avgPatternWeight: number
  avgExplainWeight: number
  avgConfidenceWeight: number
}

/** 案例学习报告 */
export interface CaseLearningResult {
  generatedAt: string
  stats: LearningStats
  topPatterns: Array<{ pattern: string; weight: number; count: number }>
  topExplainPatterns: Array<{ pattern: string; weight: number }>
  confidenceDistribution: Record<string, number>
  suggestions: string[]
  classicalRef: string
}

// ═══════════════════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════════════════

/** 案例类型中文名 */
const CASE_TYPE_LABEL: Record<CaseType, string> = {
  real: '真实案例', anonymous: '匿名案例', expert: '专家案例', classic: '经典案例',
}

/** 案例状态中文名 */
const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  pending: '待验证', validated: '已验证', rejected: '已驳回',
}

/** 案例类型权重系数（专家案例最高） */
const CASE_TYPE_WEIGHT: Record<CaseType, number> = {
  real: 1.0, anonymous: 0.6, expert: 1.5, classic: 1.2,
}

/** 已验证案例额外权重加成 */
const VALIDATED_BONUS = 1.3

/** 单次 pattern 出现的基础权重增量 */
const BASE_W = 0.5

/** 权重上限 */
const MAX_PW = 10.0    // Pattern Weight 上限
const MAX_EW = 8.0     // Explain Weight 上限
const MAX_CW = 5.0     // Confidence Weight 上限

/** 天干 → 五行 */
const G2E: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

/** 地支 → 五行 */
const Z2E: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

/** 天干五合 */
const TG_HE: Array<[string, string, string]> = [
  ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'],
  ['丁', '壬', '木'], ['戊', '癸', '火'],
]

/** 地支六合 */
const DZ_HE: Array<[string, string]> = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

/** 地支六冲 */
const DZ_CHONG: Array<[string, string]> = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

/** 三合局 */
const SAN_HE: Record<string, string> = {
  '申子辰': '水局', '亥卯未': '木局', '寅午戌': '火局', '巳酉丑': '金局',
}

/** 三会方 */
const SAN_HUI: Record<string, string> = {
  '寅卯辰': '东方木', '巳午未': '南方火', '申酉戌': '西方金', '亥子丑': '北方水',
}

/** 三刑 */
const DZ_XING: Array<[string, string, string]> = [
  ['寅', '巳', '申'], ['丑', '戌', '未'], ['子', '卯', '卯'],
]

/** 六害 */
const DZ_HAI: Array<[string, string]> = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

/** 十天干 */
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

/** 古典学习引用集 */
const CLASSICAL_REFS: string[] = [
  '《论语》："学而时习之，不亦说乎。" —— 学之道贵在温故知新。',
  '《荀子》："不积跬步，无以至千里；不积小流，无以成江海。" —— 案例积微成著。',
  '《易经》："多识前言往行，以畜其德。" —— 广识古例，畜养分析之德。',
  '《中庸》："博学之，审问之，慎思之，明辨之，笃行之。" —— 学案例需博审慎明笃。',
  '《滴天髓》："欲识三元万法宗，先观帝载与神功。" —— 帝载即月令，神功即日主。',
  '《子平真诠》："格局为用神之本，用神为格局之辅。" —— 格局用神互证于案例。',
]

// ═══════════════════════════════════════════════════════════
// 五行关系工具
// ═══════════════════════════════════════════════════════════

/** 生我/我生/克我/我克/比和 */
function elemRel(src: string, tgt: string): string {
  if (src === tgt) return '比和'
  const sheng: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const ke: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  if (sheng[src] === tgt) return '我生'
  if (sheng[tgt] === src) return '生我'
  if (ke[src] === tgt) return '我克'
  if (ke[tgt] === src) return '克我'
  return '未知'
}

/** 十神关系 */
function shiShenRel(dayGan: string, otherGan: string): string | null {
  if (!dayGan || !otherGan) return null
  if (dayGan === otherGan) return '比肩'
  const di = TIAN_GAN.indexOf(dayGan), oi = TIAN_GAN.indexOf(otherGan)
  if (di === -1 || oi === -1) return null
  const de = G2E[dayGan], oe = G2E[otherGan]
  if (!de || !oe) return null
  const same = (di % 2) === (oi % 2)
  const pfx = same ? '偏' : '正'
  const r = elemRel(oe, de)
  if (r === '生我') return pfx + '印'
  if (r === '克我') return pfx + '官'
  if (r === '我克') return pfx + '财'
  if (r === '我生') return pfx + '食'
  if (r === '比和') return same ? '比肩' : '劫财'
  return null
}

// ═══════════════════════════════════════════════════════════
// Pattern 提取器
// ═══════════════════════════════════════════════════════════

/**
 * 从命盘数据中提取 Pattern 集合。
 * 基于日主五行、月令、格局、合冲刑害、三合三会等。
 */
function extractPatterns(cd: Record<string, unknown>): string[] {
  const ps: string[] = []

  // ── 基础四柱 ──
  const yG = safeStr(cd, 'yearGan'), yZ = safeStr(cd, 'yearZhi')
  const mG = safeStr(cd, 'monthGan'), mZ = safeStr(cd, 'monthZhi')
  const dG = safeStr(cd, 'dayGan'), dZ = safeStr(cd, 'dayZhi')
  const hG = safeStr(cd, 'hourGan'), hZ = safeStr(cd, 'hourZhi')

  const de = G2E[dG], me = Z2E[mZ]

  // ── 日主五行 ──
  if (de) { ps.push('日主:' + de); ps.push('日干:' + dG) }
  // ── 月令 ──
  if (mZ) { ps.push('月令:' + mZ); if (me) ps.push('月令五行:' + me) }
  // ── 日主与月令生克 ──
  if (de && me) { const r = elemRel(de, me); if (r !== '未知') ps.push('日主月令:' + r) }

  // ── 四柱组合 ──
  const aG = [yG, mG, dG, hG].filter(function(g) { return g.length > 0 })
  const aZ = [yZ, mZ, dZ, hZ].filter(function(z) { return z.length > 0 })
  if (aG.length === 4) ps.push('天干全:' + aG.join(''))
  if (aZ.length === 4) ps.push('地支全:' + aZ.join(''))

  // ── 天干五合 ──
  for (const he of TG_HE) {
    if (aG.includes(he[0]) && aG.includes(he[1])) ps.push('天干合:' + he[0] + he[1] + '化' + he[2])
  }
  // ── 地支六合 ──
  for (const he of DZ_HE) {
    if (aZ.includes(he[0]) && aZ.includes(he[1])) ps.push('地支合:' + he[0] + he[1])
  }
  // ── 六冲 ──
  for (const ch of DZ_CHONG) {
    if (aZ.includes(ch[0]) && aZ.includes(ch[1])) ps.push('地支冲:' + ch[0] + ch[1])
  }
  // ── 三刑 ──
  for (const x of DZ_XING) {
    if (aZ.includes(x[0]) && aZ.includes(x[1]) && aZ.includes(x[2])) ps.push('地支刑:' + x[0] + x[1] + x[2])
  }
  // ── 六害 ──
  for (const h of DZ_HAI) {
    if (aZ.includes(h[0]) && aZ.includes(h[1])) ps.push('地支害:' + h[0] + h[1])
  }
  // ── 三合局 ──
  for (const k of Object.keys(SAN_HE)) {
    if (k.split('').every(function(z) { return aZ.includes(z) })) ps.push('三合局:' + k + SAN_HE[k])
  }
  // ── 三会方 ──
  for (const k of Object.keys(SAN_HUI)) {
    if (k.split('').every(function(z) { return aZ.includes(z) })) ps.push('三会方:' + k + SAN_HUI[k])
  }
  // ── 格局 / 旺衰 / 用神 / 喜神 / 忌神 / 调候 ──
  const geJu = safeStr(cd, 'pattern') || safeStr(cd, 'geJu')
  if (geJu.length > 0) ps.push('格局:' + geJu)
  const ws = safeStr(cd, 'wangShuai')
  if (ws.length > 0) ps.push('旺衰:' + ws)
  const ys = safeStr(cd, 'yongShen')
  if (ys.length > 0) ps.push('用神:' + ys)
  const xs = safeStr(cd, 'xiShen')
  if (xs.length > 0) ps.push('喜神:' + xs)
  const js = safeStr(cd, 'jiShen')
  if (js.length > 0) ps.push('忌神:' + js)
  const th = safeStr(cd, 'tiaoHou')
  if (th.length > 0) ps.push('调候:' + th)

  // ── 日柱 ──
  if (dG.length > 0 && dZ.length > 0) ps.push('日柱:' + dG + dZ)

  // ── 纳音 ──
  const ny = safeStr(cd, 'nayin') || safeStr(cd, 'naYin')
  if (ny.length > 0) ps.push('纳音:' + ny)

  return ps
}

/**
 * 提取 Explain Pattern（解释推理 pattern，比基础 pattern 更高层次）
 * 基于日主得令/失令、格局解释、旺衰依据、用神选取、日支坐基、十神配置。
 */
function extractExplainPatterns(cd: Record<string, unknown>): string[] {
  const es: string[] = []
  const dG = safeStr(cd, 'dayGan'), mZ = safeStr(cd, 'monthZhi')
  const de = G2E[dG], me = Z2E[mZ]

  // 日主得令/失令
  if (de && me) {
    const r = elemRel(me, de)
    if (r === '生我') es.push('日主得令:' + de + '生于' + me + '月')
    else if (r === '克我') es.push('日主失令:' + de + '生于' + me + '月')
    else if (r === '比和') es.push('日主当令:' + de + '月' + me + '月同气')
  }
  // 格局解释
  const geJu = safeStr(cd, 'pattern') || safeStr(cd, 'geJu')
  if (geJu.length > 0) es.push('格局定式:' + geJu)
  // 旺衰解释
  const ws = safeStr(cd, 'wangShuai')
  if (ws.length > 0) {
    es.push('旺衰判断:' + ws)
    if (de && me) es.push('旺衰依据:月令' + me + '对日主' + de + '的影响')
  }
  // 用神解释
  const ys = safeStr(cd, 'yongShen')
  if (ys.length > 0) es.push('用神选取:' + ys)
  // 调候解释
  const th = safeStr(cd, 'tiaoHou')
  if (th.length > 0) es.push('调候需求:' + th)
  // 日支坐基
  const dZ = safeStr(cd, 'dayZhi'), dze = Z2E[dZ]
  if (de && dze) es.push('日支坐基:日主' + de + '坐' + dze + '(' + dZ + ')' + elemRel(de, dze))
  // 十神配置
  const otherGans = [safeStr(cd, 'yearGan'), safeStr(cd, 'monthGan'), safeStr(cd, 'hourGan')]
  for (const g of otherGans) {
    if (g.length > 0) {
      const sr = shiShenRel(dG, g)
      if (sr) es.push('十神配置:' + g + '为日主' + dG + '之' + sr)
    }
  }
  return es
}

/**
 * 提取 Confidence Pattern（衡量分析信心程度）
 * 基于信息完整度、格局明确度、用神明确度、旺衰明确度、四正全检测。
 */
function extractConfidencePatterns(cd: Record<string, unknown>): string[] {
  const cs: string[] = []
  const fields = [safeStr(cd, 'yearGan'), safeStr(cd, 'yearZhi'), safeStr(cd, 'monthGan'),
    safeStr(cd, 'monthZhi'), safeStr(cd, 'dayGan'), safeStr(cd, 'dayZhi'),
    safeStr(cd, 'hourGan'), safeStr(cd, 'hourZhi')]
  const filled = fields.filter(function(f) { return f.length > 0 }).length
  const ratio = filled / 8
  cs.push(ratio === 1 ? '信息完整度:完整' : ratio >= 0.75 ? '信息完整度:较高' :
    ratio >= 0.5 ? '信息完整度:中等' : '信息完整度:不足')

  const geJu = safeStr(cd, 'pattern') || safeStr(cd, 'geJu')
  cs.push(geJu.length > 0 ? '格局明确度:已确定' : '格局明确度:待定')
  cs.push(safeStr(cd, 'yongShen').length > 0 ? '用神明确度:已确定' : '用神明确度:待定')
  cs.push(safeStr(cd, 'wangShuai').length > 0 ? '旺衰明确度:已确定' : '旺衰明确度:待定')

  // 四正全检测（子午卯酉）
  const siZheng = ['子', '午', '卯', '酉']
  const allZhi = [safeStr(cd, 'yearZhi'), safeStr(cd, 'monthZhi'), safeStr(cd, 'dayZhi'), safeStr(cd, 'hourZhi')]
  const szCnt = siZheng.filter(function(z) { return allZhi.includes(z) }).length
  if (szCnt === 4) cs.push('四正全:是（大贵格局指标）')
  else if (szCnt >= 3) cs.push('四正全:三正')
  else if (szCnt >= 2) cs.push('四正全:双正')

  if (fields.every(function(f) { return f.length > 0 })) cs.push('干支齐全:是')
  return cs
}

// ═══════════════════════════════════════════════════════════
// 权重计算
// ═══════════════════════════════════════════════════════════

/** 计算初始权重：基础权重 * 累积次数 * 类型系数 */
function calcWeights(
  ps: string[], eps: string[], cps: string[],
  type: CaseType, counts: Record<string, number>
): { pw: Record<string, number>; ew: Record<string, number>; cw: Record<string, number> } {
  const pw: Record<string, number> = {}
  const ew: Record<string, number> = {}
  const cw: Record<string, number> = {}
  const tf = CASE_TYPE_WEIGHT[type]

  for (const p of ps) {
    const c = counts[p] || 0
    pw[p] = Math.round(Math.min(BASE_W * (1 + c) * tf, MAX_PW) * 100) / 100
  }
  for (const ep of eps) {
    const c = counts[ep] || 0
    ew[ep] = Math.round(Math.min(BASE_W * 0.8 * (1 + c * 0.5) * tf, MAX_EW) * 100) / 100
  }
  for (const cp of cps) {
    cw[cp] = Math.round(Math.min(BASE_W * 0.6 * tf, MAX_CW) * 100) / 100
  }
  return { pw, ew, cw }
}

// ═══════════════════════════════════════════════════════════
// 核心类：CaseLearningEngine
// ═══════════════════════════════════════════════════════════

/**
 * CaseLearningEngine — 案例学习系统引擎
 *
 * 闭环：案例收集 → Pattern 提取 → 权重训练 → 学习报告
 *   1. 收集四大类型案例（真实/匿名/专家/经典）
 *   2. 自动提取日主五行、月令、格局、合冲刑害等 pattern
 *   3. 训练三维权重（Pattern / Explain / Confidence），验证案例权重更高，专家案例最高
 *   4. 生成学习报告，提供 Top Patterns、建议、古籍引用
 */
var MAX_CASES = 5000

export class CaseLearningEngine {
  /** 案例库：id → CaseEntry（滑动窗口，超过上限自动裁剪） */
  private cases: Map<string, CaseEntry> = new Map()
  /** 全局 pattern 累计次数 */
  private pCounts: Record<string, number> = {}
  private eCounts: Record<string, number> = {}
  private cCounts: Record<string, number> = {}

  // ───────────────────────────────────────────────────────
  // 案例管理
  // ───────────────────────────────────────────────────────

  /**
   * addCase — 添加一条案例
   * 自动提取 pattern 并计算初始权重，相同 pattern 出现越多权重越高。
   * @returns 新生成的案例 ID
   */
  addCase(
    entry: Omit<CaseEntry, 'id' | 'addedAt' | 'patternWeights' | 'explainWeights' | 'confidenceWeights'>
  ): string {
    const id = generateId('case')
    const ps = extractPatterns(entry.chartData)
    const eps = extractExplainPatterns(entry.chartData)
    const cps = extractConfidencePatterns(entry.chartData)
    const w = calcWeights(ps, eps, cps, entry.type, this.pCounts)

    const full: CaseEntry = {
      ...entry, id, addedAt: new Date().toISOString(),
      patternWeights: w.pw, explainWeights: w.ew, confidenceWeights: w.cw,
    }
    this.cases.set(id, full)

    // P6-C: 滑动窗口裁剪，防止案例库无限增长
    if (this.cases.size > MAX_CASES) {
      var keys = Array.from(this.cases.keys())
      for (var i = 0; i < keys.length - MAX_CASES; i++) {
        this.cases.delete(keys[i])
      }
    }

    // 更新全局累计次数
    for (const p of ps) this.pCounts[p] = (this.pCounts[p] || 0) + 1
    for (const ep of eps) this.eCounts[ep] = (this.eCounts[ep] || 0) + 1
    for (const cp of cps) this.cCounts[cp] = (this.cCounts[cp] || 0) + 1

    // 已验证则触发全局权重重算
    if (entry.status === 'validated') this.recalcAll()
    return id
  }

  /**
   * validateCase — 验证一条案例，权重获得加成
   * @returns 是否验证成功
   */
  validateCase(caseId: string, validator: string, note: string): boolean {
    const c = this.cases.get(caseId)
    if (!c || c.status === 'validated') return false
    c.status = 'validated'
    c.validatedBy = validator
    c.validationNote = note
    this.applyBonus(c)
    this.recalcAll()
    return true
  }

  /** rejectCase — 驳回一条案例，不参与学习 */
  rejectCase(caseId: string): boolean {
    const c = this.cases.get(caseId)
    if (!c || c.status === 'rejected') return false
    c.status = 'rejected'
    return true
  }

  /** getCase — 获取单条案例 */
  getCase(caseId: string): CaseEntry | null {
    return this.cases.get(caseId) || null
  }

  /** getAllCases — 获取所有案例（按添加时间倒序） */
  getAllCases(): CaseEntry[] {
    return Array.from(this.cases.values()).sort(function(a, b) { return b.addedAt.localeCompare(a.addedAt) })
  }

  /** getCasesByType — 按类型获取案例 */
  getCasesByType(type: CaseType): CaseEntry[] {
    return this.getAllCases().filter(function(c) { return c.type === type })
  }

  // ───────────────────────────────────────────────────────
  // 统计与分析
  // ───────────────────────────────────────────────────────

  /** getStats — 获取学习统计信息 */
  getStats(): LearningStats {
    const active = this.getAllCases().filter(function(c) { return c.status !== 'rejected' })
    return {
      totalCases: active.length,
      realCases: active.filter(function(c) { return c.type === 'real' }).length,
      expertCases: active.filter(function(c) { return c.type === 'expert' }).length,
      classicCases: active.filter(function(c) { return c.type === 'classic' }).length,
      validatedCases: active.filter(function(c) { return c.status === 'validated' }).length,
      avgPatternWeight: Math.round(this.avgW(active, 'patternWeights') * 100) / 100,
      avgExplainWeight: Math.round(this.avgW(active, 'explainWeights') * 100) / 100,
      avgConfidenceWeight: Math.round(this.avgW(active, 'confidenceWeights') * 100) / 100,
    }
  }

  /** getReport — 生成完整学习报告 */
  getReport(): CaseLearningResult {
    const stats = this.getStats()
    return {
      generatedAt: new Date().toISOString(),
      stats,
      topPatterns: this.buildTopP(),
      topExplainPatterns: this.buildTopEP(),
      confidenceDistribution: this.buildConfDist(),
      suggestions: this.genSuggestions(stats),
      classicalRef: pick(CLASSICAL_REFS),
    }
  }

  /** getLearnedPatterns — 获取所有已学习的 pattern 及其权重 */
  getLearnedPatterns(): Array<{ pattern: string; weight: number }> {
    const res: Array<{ pattern: string; weight: number }> = []
    for (const k of Object.keys(this.pCounts)) {
      res.push({ pattern: k, weight: Math.round(Math.min(BASE_W * this.pCounts[k], MAX_PW) * 100) / 100 })
    }
    res.sort(function(a, b) { return b.weight - a.weight })
    return res
  }

  // ───────────────────────────────────────────────────────
  // 内部方法
  // ───────────────────────────────────────────────────────

  /** 对已验证案例应用权重加成 */
  private applyBonus(c: CaseEntry): void {
    const fields: Array<'patternWeights' | 'explainWeights' | 'confidenceWeights'> =
      ['patternWeights', 'explainWeights', 'confidenceWeights']
    const maxes: Record<string, number> = { patternWeights: MAX_PW, explainWeights: MAX_EW, confidenceWeights: MAX_CW }
    for (const f of fields) {
      for (const k of Object.keys(c[f])) {
        c[f][k] = Math.round(Math.min(c[f][k] * VALIDATED_BONUS, maxes[f]) * 100) / 100
      }
    }
  }

  /** 全局权重重算：遍历所有活跃案例，按当前全局计数重算权重 */
  private recalcAll(): void {
    const active = this.getAllCases().filter(function(c) { return c.status !== 'rejected' })
    // 第一轮：重置全局计数
    const np: Record<string, number> = {}, ne: Record<string, number> = {}, nc: Record<string, number> = {}
    for (const ce of active) {
      const ps = extractPatterns(ce.chartData)
      const eps = extractExplainPatterns(ce.chartData)
      const cps = extractConfidencePatterns(ce.chartData)
      for (const p of ps) np[p] = (np[p] || 0) + 1
      for (const ep of eps) ne[ep] = (ne[ep] || 0) + 1
      for (const cp of cps) nc[cp] = (nc[cp] || 0) + 1
    }
    // 第二轮：重算每个案例的权重
    for (const ce of active) {
      const ps = extractPatterns(ce.chartData)
      const eps = extractExplainPatterns(ce.chartData)
      const cps = extractConfidencePatterns(ce.chartData)
      const tf = CASE_TYPE_WEIGHT[ce.type]
      const val = ce.status === 'validated'

      const newPW: Record<string, number> = {}
      for (const p of ps) {
        let w = BASE_W * (1 + (np[p] || 0)) * tf
        if (val) w *= VALIDATED_BONUS
        newPW[p] = Math.round(Math.min(w, MAX_PW) * 100) / 100
      }
      ce.patternWeights = newPW

      const newEW: Record<string, number> = {}
      for (const ep of eps) {
        let w = BASE_W * 0.8 * (1 + (ne[ep] || 0) * 0.5) * tf
        if (val) w *= VALIDATED_BONUS
        newEW[ep] = Math.round(Math.min(w, MAX_EW) * 100) / 100
      }
      ce.explainWeights = newEW

      const newCW: Record<string, number> = {}
      for (const cp of cps) {
        let w = BASE_W * 0.6 * tf
        if (val) w *= VALIDATED_BONUS
        newCW[cp] = Math.round(Math.min(w, MAX_CW) * 100) / 100
      }
      ce.confidenceWeights = newCW
    }
    this.pCounts = np
    this.eCounts = ne
    this.cCounts = nc
  }

  /** 计算平均权重 */
  private avgW(active: CaseEntry[], field: 'patternWeights' | 'explainWeights' | 'confidenceWeights'): number {
    if (active.length === 0) return 0
    let total = 0, cnt = 0
    for (const c of active) {
      for (const k of Object.keys(c[field])) { total += c[field][k]; cnt += 1 }
    }
    return cnt === 0 ? 0 : total / cnt
  }

  /** 构建高频 Pattern 列表（Top 20） */
  private buildTopP(): Array<{ pattern: string; weight: number; count: number }> {
    const res: Array<{ pattern: string; weight: number; count: number }> = []
    for (const k of Object.keys(this.pCounts)) {
      const cnt = this.pCounts[k]
      res.push({ pattern: k, weight: Math.round(Math.min(BASE_W * cnt, MAX_PW) * 100) / 100, count: cnt })
    }
    res.sort(function(a, b) { return b.weight - a.weight })
    return res.slice(0, 20)
  }

  /** 构建高频 Explain Pattern 列表（Top 15） */
  private buildTopEP(): Array<{ pattern: string; weight: number }> {
    const res: Array<{ pattern: string; weight: number }> = []
    for (const k of Object.keys(this.eCounts)) {
      const cnt = this.eCounts[k]
      res.push({ pattern: k, weight: Math.round(Math.min(BASE_W * 0.8 * (1 + cnt * 0.5), MAX_EW) * 100) / 100 })
    }
    res.sort(function(a, b) { return b.weight - a.weight })
    return res.slice(0, 15)
  }

  /** 构建 Confidence 分布（按类别归类） */
  private buildConfDist(): Record<string, number> {
    const dist: Record<string, number> = {}
    for (const k of Object.keys(this.cCounts)) {
      const idx = k.indexOf(':')
      const cat = idx > 0 ? k.substring(0, idx) : k
      dist[cat] = (dist[cat] || 0) + this.cCounts[k]
    }
    return dist
  }

  /** 生成学习建议 */
  private genSuggestions(stats: LearningStats): string[] {
    const sg: string[] = []

    // 案例数量建议
    if (stats.totalCases < 10) {
      sg.push('当前案例总数仅 ' + stats.totalCases + ' 例，不足以形成可靠模式。' +
        '《荀子》云"不积跬步，无以至千里"，建议至少积累 50 例以上。')
    } else if (stats.totalCases < 50) {
      sg.push('案例总数 ' + stats.totalCases + ' 例，已有初步学习基础，继续积累可提升 Pattern 权重可靠性。')
    } else if (stats.totalCases >= 100) {
      sg.push('案例总数已达 ' + stats.totalCases + ' 例，Pattern 权重可信度较高，学习系统进入成熟阶段。')
    }

    // 验证率建议
    if (stats.totalCases > 0) {
      const vr = stats.validatedCases / stats.totalCases
      if (vr < 0.3) {
        sg.push('验证率仅 ' + Math.round(vr * 100) + '%，大量案例未经专家验证。已验证案例权重更高，建议提高验证率。')
      } else if (vr >= 0.7) {
        sg.push('验证率 ' + Math.round(vr * 100) + '%，案例质量有保障，高验证率确保 Pattern 权重可靠性。')
      }
    }

    // 类型多样性建议
    if (stats.expertCases === 0) sg.push('尚无专家案例。专家案例权重系数最高（1.5x），添加可显著提升学习效果。')
    if (stats.classicCases === 0) sg.push('尚无经典案例。建议从《滴天髓》《子平真诠》《穷通宝鉴》等录入经典命例。')

    // 权重均衡性建议
    if (stats.avgPatternWeight > 0 && stats.avgExplainWeight > 0) {
      const ratio = stats.avgPatternWeight / stats.avgExplainWeight
      if (ratio > 3) sg.push('Pattern 与 Explain 权重差距较大（比值 ' + Math.round(ratio * 100) / 100 +
        '），建议补充更详细的分析解释数据。')
    }

    // Pattern 覆盖度建议
    if (Object.keys(this.pCounts).length < 20 && stats.totalCases > 20) {
      sg.push('提取到 ' + Object.keys(this.pCounts).length + ' 种 Pattern，覆盖面不足，建议增加不同日主五行和月令的案例。')
    }

    // 持续学习鼓励
    if (stats.totalCases > 0) {
      const ecs = [
        '《论语》云"学而时习之，不亦说乎"，持续添加案例，学习之道贵在坚持。',
        '案例学习如积土成山、积水成渊，日积月累必有所成。',
        '建议定期回顾已学习 Pattern，结合实际案例验证权重准确性。',
      ]
      for (const e of pickN(ecs, 2)) sg.push(e)
    }

    return sg
  }
}

// ═══════════════════════════════════════════════════════════
// 导出辅助函数与常量
// ═══════════════════════════════════════════════════════════

export {
  extractPatterns,
  extractExplainPatterns,
  extractConfidencePatterns,
  elemRel as getElementRelation,
  shiShenRel as getShiShenRelation,
  CASE_TYPE_LABEL,
  CASE_STATUS_LABEL,
  CASE_TYPE_WEIGHT as CASE_TYPE_WEIGHT_FACTOR,
  G2E as GAN_TO_ELEMENT,
  Z2E as ZHI_TO_ELEMENT,
  TIAN_GAN,
}
