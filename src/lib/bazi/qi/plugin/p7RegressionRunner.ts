/**
 * P7 Full Regression Runner — 全量回归测试运行器
 *
 * 对 1,160 个案例建立全量回归测试。运行系统分析并记录每个案例的结果 hash，
 * 保存为基线快照。以后任何修改必须全部重新验证。
 *
 * 使用单引号 + 字符串拼接，禁止模板字符串
 */

import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { CASE_DATA } from './caseData'
import { P7_EXTENDED_CASES } from './caseDataExtended'
import type { BaziCase } from './caseLibrary'
import { ConfidenceEngine } from './confidenceEngine'
import { ConsensusEngine } from './consensusEngine'
import { runQiEngine } from '../engine'
import { determineGeJu } from '../../geju'
import { calculateStrength } from '../../wuxing'
import { determineXiYongShen } from '../../xiyongshen'
import { getRelatedShens } from '../../shishen'
import { getStemElement } from '../../../core'
import { runCalibration } from './p7Calibration'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

export interface RegressionCaseResult {
  caseId: string
  caseName: string
  category: string
  trustLevel: string
  hash: string
  passed: boolean        // 与基线一致
  changed: boolean       // hash 不同
  systemPattern: string
  systemWangShuai: string
  systemYongShen: string
  systemDayElement: string
}

export interface RegressionTestResult {
  totalCases: number
  passed: number
  failed: number
  skipped: number
  passRate: number
  results: RegressionCaseResult[]
  duration: number
}

export interface BaselineSnapshot {
  version: string
  createdAt: string
  totalCases: number
  cases: Array<{ caseId: string; hash: string }>
}

export interface RegressionComparison {
  baseline: BaselineSnapshot | null
  current: RegressionTestResult
  added: number
  removed: number
  changed: number
  unchanged: number
  hasRegression: boolean    // true if any trusted case changed
}

// ═══════════════════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════════════════

var BASELINE_VERSION = '1.0.0'
var BASELINE_PATH = '/workspace/xuanfengmen1/src/golden/p7-regression-baseline.json'

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

/** 构造 sixLines */
function buildSixLines(caze: BaziCase) {
  return {
    year: { gan: caze.yearGan, zhi: caze.yearZhi },
    month: { gan: caze.monthGan, zhi: caze.monthZhi },
    day: { gan: caze.dayGan, zhi: caze.dayZhi },
    hour: { gan: caze.hourGan, zhi: caze.hourZhi },
  }
}

/** 计算五行计数 */
function countFiveElements(caze: BaziCase): Record<string, number> {
  var counts: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  var ganzhis = [
    caze.yearGan, caze.yearZhi,
    caze.monthGan, caze.monthZhi,
    caze.dayGan, caze.dayZhi,
    caze.hourGan, caze.hourZhi,
  ]
  var stemElements: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  }
  var branchElements: Record<string, string> = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
    '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
    '戌': '土', '亥': '水',
  }
  for (var i = 0; i < ganzhis.length; i++) {
    var g = ganzhis[i]
    var el = stemElements[g] || branchElements[g]
    if (el) counts[el]++
  }
  return counts
}

/** 计算 SHA-256 hash */
function computeHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/** 确保目录存在 */
function ensureDirectoryExists(filePath: string): void {
  var dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// ═══════════════════════════════════════════════════════════
// 案例分析引擎 — 单案例全流程
// ═══════════════════════════════════════════════════════════

interface CaseAnalysisOutput {
  pattern: string
  wangShuai: string
  strengthScore: number
  yongShen: string
  dayElement: string
  consensusDimensions: Array<{ dimension: string; finalView: string; confidence: number }>
  fingerprint: string
  hash: string
}

function analyzeCase(caze: BaziCase): CaseAnalysisOutput {
  var sixLines = buildSixLines(caze)
  var dayGan = caze.dayGan
  var monthZhi = caze.monthZhi

  // 1. 运行 QiEngine
  var qiResult = runQiEngine(sixLines as any, dayGan as any, monthZhi as any)

  // 2. 计算旺衰
  var strengthResult = calculateStrength(sixLines as any, dayGan, monthZhi)
  var wangShuai = safeStr(strengthResult.wangShuai)
  var strengthScore = strengthResult.strengthScore

  // 3. 计算五行计数
  var fiveElementCount = countFiveElements(caze)

  // 4. 获取十神关系
  var relatedShens = getRelatedShens(dayGan as any)

  // 5. 判断格局
  var geJuResult = determineGeJu(
    sixLines as any,
    relatedShens as any,
    strengthScore,
    dayGan,
    monthZhi,
    fiveElementCount as any,
  )
  var pattern = safeStr(geJuResult.name) || safeStr((geJuResult as any).type) || ''

  // 6. 判断喜用神
  var dayElement = getStemElement(dayGan as any)
  var xiYongResult = determineXiYongShen(
    strengthScore,
    wangShuai as any,
    (pattern || '正官格') as any,
    dayElement,
    strengthResult.heHuaResults || [],
  )
  var yongShen = safeStr(xiYongResult.bestElement) || safeStr((xiYongResult as any).firstHappy) || ''

  // 7. 构造 chartData 供 ConsensusEngine 使用
  var chartData: Record<string, unknown> = {
    yearGan: caze.yearGan, yearZhi: caze.yearZhi,
    monthGan: caze.monthGan, monthZhi: caze.monthZhi,
    dayGan: caze.dayGan, dayZhi: caze.dayZhi,
    hourGan: caze.hourGan, hourZhi: caze.hourZhi,
    dayElement: dayElement,
    dayMaster: dayGan,
    strengthScore: strengthScore,
    wangShuai: wangShuai,
    useGod: yongShen,
    pattern: pattern,
    shiShen: Object.values(relatedShens).join(','),
    fiveElementCount: fiveElementCount,
    gender: 'male',
  }

  // 8. 运行 ConsensusEngine
  var consensusDims: Array<{ dimension: string; finalView: string; confidence: number }> = []
  try {
    var consensusEngine = new ConsensusEngine()
    var consensusResult = consensusEngine.analyze(chartData)
    if (consensusResult && Array.isArray((consensusResult as any).consensus)) {
      var dims = (consensusResult as any).consensus
      for (var d = 0; d < dims.length; d++) {
        consensusDims.push({
          dimension: safeStr(dims[d].dimension),
          finalView: safeStr(dims[d].finalView),
          confidence: typeof dims[d].confidence === 'number' ? dims[d].confidence : 0,
        })
      }
    }
  } catch (e) {
    // ConsensusEngine 失败不影响核心分析
  }

  // 9. 计算指纹和 hash（仅确定性字段，排除 ConsensusEngine 非确定性输出）
  var fingerprint = JSON.stringify({
    p: pattern,
    w: wangShuai,
    s: strengthScore,
    y: yongShen,
    d: dayElement,
  })
  var hash = computeHash(fingerprint)

  return {
    pattern: pattern,
    wangShuai: wangShuai,
    strengthScore: strengthScore,
    yongShen: yongShen,
    dayElement: dayElement,
    consensusDimensions: consensusDims,
    fingerprint: fingerprint,
    hash: hash,
  }
}

// ═══════════════════════════════════════════════════════════
// 主函数 — runFullRegression
// ═══════════════════════════════════════════════════════════

export function runFullRegression(): RegressionTestResult {
  var startTime = Date.now()

  // 1. 合并所有案例
  var allCases: BaziCase[] = CASE_DATA.concat(P7_EXTENDED_CASES)

  // 2. 加载基线（如果存在）
  var baselineMap: Map<string, string> = new Map()
  try {
    if (fs.existsSync(BASELINE_PATH)) {
      var baselineData = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'))
      var baselineCases = baselineData.cases || []
      for (var b = 0; b < baselineCases.length; b++) {
        baselineMap.set(baselineCases[b].caseId, baselineCases[b].hash)
      }
    }
  } catch (e) {
    console.error('[p7RegressionRunner] 加载基线失败:', e)
  }

  // 3. 遍历全部案例
  var results: RegressionCaseResult[] = []
  var passed = 0
  var failed = 0
  var skipped = 0

  for (var i = 0; i < allCases.length; i++) {
    var caze = allCases[i]

    try {
      var output = analyzeCase(caze)
      var baselineHash = baselineMap.get(caze.id)

      var caseResult: RegressionCaseResult = {
        caseId: caze.id,
        caseName: caze.name || '',
        category: Array.isArray(caze.category) ? caze.category.join(',') : safeStr(caze.category),
        trustLevel: caze.trustLevel || '',
        hash: output.hash,
        passed: false,
        changed: false,
        systemPattern: output.pattern,
        systemWangShuai: output.wangShuai,
        systemYongShen: output.yongShen,
        systemDayElement: output.dayElement,
      }

      if (baselineHash !== undefined) {
        // 有基线，进行比对
        if (output.hash === baselineHash) {
          caseResult.passed = true
          caseResult.changed = false
          passed++
        } else {
          caseResult.passed = false
          caseResult.changed = true
          failed++
        }
      } else {
        // 无基线，标记为跳过
        caseResult.passed = true  // 无基线不算失败
        caseResult.changed = false
        skipped++
      }

      results.push(caseResult)
    } catch (e) {
      // 单个案例分析失败，记录为失败
      failed++
      results.push({
        caseId: caze.id,
        caseName: caze.name || '',
        category: Array.isArray(caze.category) ? caze.category.join(',') : safeStr(caze.category),
        trustLevel: caze.trustLevel || '',
        hash: '',
        passed: false,
        changed: false,
        systemPattern: '',
        systemWangShuai: '',
        systemYongShen: '',
        systemDayElement: '',
      })
      console.error('[p7RegressionRunner] 案例 ' + caze.id + ' 分析失败:', e)
    }
  }

  var duration = Date.now() - startTime
  var totalTested = passed + failed
  var passRate = totalTested > 0 ? Math.round(passed / totalTested * 10000) / 100 : 0

  return {
    totalCases: allCases.length,
    passed: passed,
    failed: failed,
    skipped: skipped,
    passRate: passRate,
    results: results,
    duration: duration,
  }
}

// ═══════════════════════════════════════════════════════════
// 保存基线
// ═══════════════════════════════════════════════════════════

export function saveBaseline(): BaselineSnapshot {
  var allCases: BaziCase[] = CASE_DATA.concat(P7_EXTENDED_CASES)
  var caseHashes: Array<{ caseId: string; hash: string }> = []

  console.log('[p7RegressionRunner] 保存基线, 总案例数: ' + allCases.length)

  for (var i = 0; i < allCases.length; i++) {
    var caze = allCases[i]

    try {
      var output = analyzeCase(caze)
      caseHashes.push({
        caseId: caze.id,
        hash: output.hash,
      })
    } catch (e) {
      console.error('[p7RegressionRunner] 基线生成失败 案例 ' + caze.id + ':', e)
      caseHashes.push({
        caseId: caze.id,
        hash: 'ERROR',
      })
    }
  }

  var snapshot: BaselineSnapshot = {
    version: BASELINE_VERSION,
    createdAt: new Date().toISOString(),
    totalCases: allCases.length,
    cases: caseHashes,
  }

  ensureDirectoryExists(BASELINE_PATH)
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(snapshot, null, 2), 'utf-8')
  console.log('[p7RegressionRunner] 基线已保存: ' + BASELINE_PATH)

  return snapshot
}

// ═══════════════════════════════════════════════════════════
// 与基线比对
// ═══════════════════════════════════════════════════════════

export function compareAgainstBaseline(): RegressionComparison {
  // 1. 加载基线
  var baseline: BaselineSnapshot | null = null
  try {
    if (fs.existsSync(BASELINE_PATH)) {
      baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'))
    }
  } catch (e) {
    console.error('[p7RegressionRunner] 加载基线失败:', e)
  }

  // 2. 运行全量回归
  var current = runFullRegression()

  // 3. 比对
  var baselineMap: Map<string, string> = new Map()
  if (baseline) {
    for (var b = 0; b < baseline.cases.length; b++) {
      baselineMap.set(baseline.cases[b].caseId, baseline.cases[b].hash)
    }
  }

  var currentMap: Map<string, string> = new Map()
  for (var c = 0; c < current.results.length; c++) {
    currentMap.set(current.results[c].caseId, current.results[c].hash)
  }

  var added = 0
  var removed = 0
  var changed = 0
  var unchanged = 0

  // 检查当前结果
  var currentKeys = currentMap.keys()
  var currentKey = currentKeys.next()
  while (!currentKey.done) {
    var key = currentKey.value
    if (!baselineMap.has(key)) {
      added++
    } else {
      if (currentMap.get(key) !== baselineMap.get(key)) {
        changed++
      } else {
        unchanged++
      }
    }
    currentKey = currentKeys.next()
  }

  // 检查基线中有但当前没有的
  var baselineKeys = baselineMap.keys()
  var baselineKey = baselineKeys.next()
  while (!baselineKey.done) {
    var bKey = baselineKey.value
    if (!currentMap.has(bKey)) {
      removed++
    }
    baselineKey = baselineKeys.next()
  }

  // hasRegression: 任何 trustLevel 为 S 或 A 的案例变更即为回归
  var hasRegression = false
  for (var r = 0; r < current.results.length; r++) {
    var result = current.results[r]
    if (result.changed && (result.trustLevel === 'S' || result.trustLevel === 'A')) {
      hasRegression = true
      break
    }
  }

  return {
    baseline: baseline,
    current: current,
    added: added,
    removed: removed,
    changed: changed,
    unchanged: unchanged,
    hasRegression: hasRegression,
  }
}

// ═══════════════════════════════════════════════════════════
// CLI 入口
// ═══════════════════════════════════════════════════════════

if (typeof require !== 'undefined' && require.main === module) {
  var command = 'compare'
  var cliArgs = process.argv
  for (var a = 0; a < cliArgs.length; a++) {
    if (cliArgs[a] === '--save') {
      command = 'save'
    }
    if (cliArgs[a] === '--run') {
      command = 'run'
    }
    if (cliArgs[a] === '--calibrate') {
      command = 'calibrate'
    }
  }

  if (command === 'save') {
    console.log('[p7RegressionRunner] 模式: 保存基线')
    var snapshot = saveBaseline()
    console.log(JSON.stringify({
      version: snapshot.version,
      createdAt: snapshot.createdAt,
      totalCases: snapshot.totalCases,
    }, null, 2))
  } else if (command === 'run') {
    console.log('[p7RegressionRunner] 模式: 全量回归测试')
    var regResult = runFullRegression()
    var summary = {
      totalCases: regResult.totalCases,
      passed: regResult.passed,
      failed: regResult.failed,
      skipped: regResult.skipped,
      passRate: regResult.passRate + '%',
      duration: regResult.duration + 'ms',
      changedCases: [] as string[],
    }
    for (var rc = 0; rc < regResult.results.length; rc++) {
      if (regResult.results[rc].changed) {
        (summary.changedCases as string[]).push(
          regResult.results[rc].caseId + ' (' + regResult.results[rc].caseName + ')'
        )
      }
    }
    console.log(JSON.stringify(summary, null, 2))
  } else if (command === 'calibrate') {
    console.log('[p7RegressionRunner] 模式: 校准测试')
    var calResult = runCalibration(200)
    console.log(JSON.stringify(calResult, null, 2))
  } else {
    console.log('[p7RegressionRunner] 模式: 与基线比对')
    var comparison = compareAgainstBaseline()
    var compSummary = {
      baselineVersion: comparison.baseline ? comparison.baseline.version : null,
      baselineDate: comparison.baseline ? comparison.baseline.createdAt : null,
      totalCases: comparison.current.totalCases,
      passed: comparison.current.passed,
      failed: comparison.current.failed,
      skipped: comparison.current.skipped,
      passRate: comparison.current.passRate + '%',
      added: comparison.added,
      removed: comparison.removed,
      changed: comparison.changed,
      unchanged: comparison.unchanged,
      hasRegression: comparison.hasRegression,
      duration: comparison.current.duration + 'ms',
      changedCases: [] as Array<{
        caseId: string
        name: string
        trustLevel: string
        oldHash?: string
        newHash: string
      }>,
    }
    var bMap: Map<string, string> = new Map()
    if (comparison.baseline) {
      for (var bc = 0; bc < comparison.baseline.cases.length; bc++) {
        bMap.set(comparison.baseline.cases[bc].caseId, comparison.baseline.cases[bc].hash)
      }
    }
    for (var cr = 0; cr < comparison.current.results.length; cr++) {
      if (comparison.current.results[cr].changed) {
        (compSummary.changedCases as Array<{
          caseId: string
          name: string
          trustLevel: string
          oldHash?: string
          newHash: string
        }>).push({
          caseId: comparison.current.results[cr].caseId,
          name: comparison.current.results[cr].caseName,
          trustLevel: comparison.current.results[cr].trustLevel,
          oldHash: bMap.get(comparison.current.results[cr].caseId),
          newHash: comparison.current.results[cr].hash,
        })
      }
    }
    console.log(JSON.stringify(compSummary, null, 2))
  }
}
