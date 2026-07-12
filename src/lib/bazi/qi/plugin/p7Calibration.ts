/**
 * P7 Confidence Calibration — 可信度校准
 *
 * 验证 ConfidenceEngine 输出的 confidence 分数是否真实反映分析质量。
 * confidence 衡量的是"数据完整性+一致性+依据充分性"（非预测概率），
 * calibration 策略是将 confidence 分段，对比每段的"系统分析与传统答案的一致性"。
 *
 * 使用单引号 + 字符串拼接，禁止模板字符串
 */

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

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

export interface CalibrationBucket {
  range: string          // "0-20", "20-40", etc.
  avgConfidence: number  // 该 bucket 平均 confidence
  avgAccuracy: number     // 该 bucket 平均实际准确率
  count: number           // 案例数
}

export interface CalibrationResult {
  totalTested: number
  buckets: CalibrationBucket[]
  correlation: number      // confidence vs accuracy 的相关系数
  isWellCalibrated: boolean  // 相关性 > 0.3 认为校准良好
  analysis: string         // 文字分析
}

// 内部使用的系统分析结果
interface SystemAnalysis {
  pattern: string
  wangShuai: string
  strengthScore: number
  yongShen: string
  xiShen: string
  jiShen: string
  dayElement: string
  consensusDimensions: Array<{ dimension: string; finalView: string; confidence: number }>
}

// 内部使用的评分结果
interface DimensionScores {
  geJu: number
  wangShuai: number
  yongShen: number
  dayElement: number
}

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** Fisher-Yates shuffle */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  var result = arr.slice()
  for (var i = result.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

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

// ═══════════════════════════════════════════════════════════
// 系统推演 — 复用 blindTestRunner 的完整路径
// ═══════════════════════════════════════════════════════════

function runSystemAnalysis(caze: BaziCase): SystemAnalysis {
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
  var xiShen = safeStr((xiYongResult as any).firstHappy) + ',' + safeStr((xiYongResult as any).secondHappy)
  var jiShen = Array.isArray((xiYongResult as any).avoidedElements)
    ? (xiYongResult as any).avoidedElements.join(',')
    : safeStr((xiYongResult as any).avoidedElements)

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
    // ConsensusEngine 失败不影响核心评分
  }

  return {
    pattern: pattern,
    wangShuai: wangShuai,
    strengthScore: strengthScore,
    yongShen: yongShen,
    xiShen: xiShen,
    jiShen: jiShen,
    dayElement: dayElement,
    consensusDimensions: consensusDims,
  }
}

// ═══════════════════════════════════════════════════════════
// 评分逻辑 — 复用 blindTestRunner 的 string match 评分
// ═══════════════════════════════════════════════════════════

function scorePattern(system: string, traditional: string): number {
  if (!traditional || !system) return 0
  if (system === traditional) return 100
  if (system.indexOf(traditional) >= 0 || traditional.indexOf(system) >= 0) return 75
  var geJuCategories: Record<string, string[]> = {
    '正格': ['正官格', '偏官格', '正财格', '偏财格', '正印格', '偏印格', '食神格', '伤官格', '建禄格', '阳刃格'],
    '从格': ['从财格', '从官格', '从儿格', '从杀格', '从旺格', '从强格'],
    '化格': ['化气格', '化土格', '化金格', '化水格', '化木格', '化火格'],
    '专旺': ['专旺格', '曲直格', '炎上格', '稼穑格', '从革格', '润下格'],
  }
  var sysCat = '', tradCat = ''
  for (var cat in geJuCategories) {
    if (geJuCategories[cat].indexOf(system) >= 0) sysCat = cat
    if (geJuCategories[cat].indexOf(traditional) >= 0) tradCat = cat
  }
  if (sysCat && tradCat && sysCat === tradCat) return 50
  return 0
}

function scoreWangShuai(system: string, traditional: string): number {
  if (!traditional || !system) return 0
  if (system === traditional) return 100
  var isSysStrong = system.indexOf('旺') >= 0 && system.indexOf('弱') < 0
  var isTradStrong = traditional.indexOf('旺') >= 0 && traditional.indexOf('弱') < 0
  if (isSysStrong === isTradStrong) return 75
  if (system.indexOf('中') >= 0 && traditional.indexOf('中') >= 0) return 75
  return 0
}

function scoreYongShen(system: string, traditional: string): number {
  if (!traditional || !system) return 0
  if (system === traditional) return 100
  var fiveElements = ['木', '火', '土', '金', '水']
  var sysEl = '', tradEl = ''
  for (var i = 0; i < fiveElements.length; i++) {
    if (system.indexOf(fiveElements[i]) >= 0) sysEl = fiveElements[i]
    if (traditional.indexOf(fiveElements[i]) >= 0) tradEl = fiveElements[i]
  }
  if (sysEl && tradEl && sysEl === tradEl) return 75
  if (system.indexOf(traditional) >= 0 || traditional.indexOf(system) >= 0) return 50
  return 0
}

function scoreDayElement(system: string, traditional: string): number {
  if (!traditional || !system) return 0
  if (system === traditional) return 100
  return 0
}

/** 计算案例的格局/旺衰/用神三维平均准确率 */
function scoreCaseAccuracy(sys: SystemAnalysis, trad: BaziCase): number {
  var geJuScore = scorePattern(sys.pattern, trad.pattern || '')
  var wangShuaiScore = scoreWangShuai(sys.wangShuai, trad.wangShuai || '')
  var yongShenScore = scoreYongShen(sys.yongShen, trad.yongShen || '')
  var dayElementScore = scoreDayElement(sys.dayElement, trad.dayElement || '')
  return Math.round((geJuScore + wangShuaiScore + yongShenScore + dayElementScore) / 4)
}

// ═══════════════════════════════════════════════════════════
// 相关系数计算
// ═══════════════════════════════════════════════════════════

function pearsonCorrelation(x: number[], y: number[]): number {
  var n = x.length
  if (n < 2) return 0

  var sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (var i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] * x[i]
    sumY2 += y[i] * y[i]
  }

  var numerator = n * sumXY - sumX * sumY
  var denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  if (denominator === 0) return 0
  return numerator / denominator
}

// ═══════════════════════════════════════════════════════════
// Bucket 定义
// ═══════════════════════════════════════════════════════════

var BUCKET_RANGES = [
  { min: 0, max: 20, label: '0-20' },
  { min: 20, max: 40, label: '20-40' },
  { min: 40, max: 60, label: '40-60' },
  { min: 60, max: 80, label: '60-80' },
  { min: 80, max: 100, label: '80-100' },
]

function assignBucket(confidence: number): number {
  for (var i = 0; i < BUCKET_RANGES.length; i++) {
    if (confidence >= BUCKET_RANGES[i].min && confidence < BUCKET_RANGES[i].max) {
      return i
    }
  }
  // 100 分归入最后一个 bucket
  return BUCKET_RANGES.length - 1
}

// ═══════════════════════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════════════════════

export function runCalibration(sampleSize: number): CalibrationResult {
  // 1. 合并所有案例
  var allCases: BaziCase[] = CASE_DATA.concat(P7_EXTENDED_CASES)

  // 2. 随机抽样（Fisher-Yates）
  var shuffled = fisherYatesShuffle(allCases)
  var sampled = shuffled.slice(0, Math.min(sampleSize, shuffled.length))

  // 3. 收集数据
  var confidenceValues: number[] = []
  var accuracyValues: number[] = []
  var bucketData: Array<Array<{ confidence: number; accuracy: number }>> = []

  for (var i = 0; i < BUCKET_RANGES.length; i++) {
    bucketData.push([])
  }

  // 4. 运行 ConfidenceEngine
  var confidenceEngine = new ConfidenceEngine()

  for (var s = 0; s < sampled.length; s++) {
    var caze = sampled[s]

    try {
      // 运行系统分析
      var sysResult = runSystemAnalysis(caze)

      // 构造 chartData 用于 ConfidenceEngine
      var chartData: Record<string, unknown> = {
        yearGan: caze.yearGan, yearZhi: caze.yearZhi,
        monthGan: caze.monthGan, monthZhi: caze.monthZhi,
        dayGan: caze.dayGan, dayZhi: caze.dayZhi,
        hourGan: caze.hourGan, hourZhi: caze.hourZhi,
        dayElement: sysResult.dayElement,
        dayMaster: caze.dayGan,
        strengthScore: sysResult.strengthScore,
        wangShuai: sysResult.wangShuai,
        useGod: sysResult.yongShen,
        pattern: sysResult.pattern,
      }

      // 获取 confidence
      var confResult = confidenceEngine.assess(chartData)
      var avgConfidence = confResult.overallConfidence

      // 计算实际准确率
      var accuracy = scoreCaseAccuracy(sysResult, caze)

      // 收集
      confidenceValues.push(avgConfidence)
      accuracyValues.push(accuracy)

      // 分配到 bucket
      var bucketIdx = assignBucket(avgConfidence)
      bucketData[bucketIdx].push({ confidence: avgConfidence, accuracy: accuracy })
    } catch (e) {
      // 单个案例失败不影响整体
      console.error('[p7Calibration] 案例 ' + caze.id + ' 分析失败:', e)
    }
  }

  // 5. 计算 bucket 统计
  var buckets: CalibrationBucket[] = []
  for (var b = 0; b < BUCKET_RANGES.length; b++) {
    var items = bucketData[b]
    if (items.length === 0) {
      buckets.push({
        range: BUCKET_RANGES[b].label,
        avgConfidence: 0,
        avgAccuracy: 0,
        count: 0,
      })
      continue
    }
    var sumConf = 0, sumAcc = 0
    for (var k = 0; k < items.length; k++) {
      sumConf += items[k].confidence
      sumAcc += items[k].accuracy
    }
    buckets.push({
      range: BUCKET_RANGES[b].label,
      avgConfidence: Math.round(sumConf / items.length * 10) / 10,
      avgAccuracy: Math.round(sumAcc / items.length * 10) / 10,
      count: items.length,
    })
  }

  // 6. 计算相关系数
  var correlation = pearsonCorrelation(confidenceValues, accuracyValues)
  var isWellCalibrated = correlation > 0.3

  // 7. 生成文字分析
  var analysis = generateAnalysis(buckets, correlation, confidenceValues.length)

  return {
    totalTested: confidenceValues.length,
    buckets: buckets,
    correlation: Math.round(correlation * 1000) / 1000,
    isWellCalibrated: isWellCalibrated,
    analysis: analysis,
  }
}

// ═══════════════════════════════════════════════════════════
// 文字分析生成
// ═══════════════════════════════════════════════════════════

function generateAnalysis(
  buckets: CalibrationBucket[],
  correlation: number,
  totalTested: number,
): string {
  var lines: string[] = []
  lines.push('=== Confidence Calibration 报告 ===')
  lines.push('测试案例数: ' + totalTested)
  lines.push('Pearson 相关系数: ' + (Math.round(correlation * 1000) / 1000))
  lines.push('校准状态: ' + (correlation > 0.3 ? '良好 (相关系数 > 0.3)' : '需改进 (相关系数 <= 0.3)'))
  lines.push('')

  for (var i = 0; i < buckets.length; i++) {
    var b = buckets[i]
    if (b.count === 0) {
      lines.push('Bucket [' + b.range + ']: 无案例')
    } else {
      lines.push(
        'Bucket [' + b.range + ']: ' +
        '案例数=' + b.count +
        ', 平均confidence=' + b.avgConfidence +
        ', 平均准确率=' + b.avgAccuracy +
        ', 差值=' + (Math.round((b.avgConfidence - b.avgAccuracy) * 10) / 10)
      )
    }
  }

  lines.push('')

  // 判断是否 monotonic
  var monotonicCount = 0
  var nonEmptyBuckets: CalibrationBucket[] = []
  for (var j = 0; j < buckets.length; j++) {
    if (buckets[j].count > 0) {
      nonEmptyBuckets.push(buckets[j])
    }
  }
  for (var m = 1; m < nonEmptyBuckets.length; m++) {
    if (nonEmptyBuckets[m].avgAccuracy >= nonEmptyBuckets[m - 1].avgAccuracy) {
      monotonicCount++
    }
  }
  var monotonicRatio = nonEmptyBuckets.length > 1
    ? monotonicCount / (nonEmptyBuckets.length - 1)
    : 0
  lines.push('单调性: ' + (Math.round(monotonicRatio * 100)) + '% 的相邻 bucket 准确率递增')
  lines.push('(理想状态: confidence 越高, 准确率越高)')

  return lines.join('\n')
}

// ═══════════════════════════════════════════════════════════
// CLI 入口
// ═══════════════════════════════════════════════════════════

if (typeof require !== 'undefined' && require.main === module) {
  var sampleSize = 200
  var args = process.argv
  for (var a = 0; a < args.length; a++) {
    if (args[a] === '--sample' && args[a + 1]) {
      sampleSize = parseInt(args[a + 1], 10) || 200
    }
  }
  console.log('[p7Calibration] 开始校准, 抽样数=' + sampleSize)
  var startTime = Date.now()
  var result = runCalibration(sampleSize)
  var elapsed = Date.now() - startTime
  console.log('[p7Calibration] 耗时 ' + elapsed + 'ms')
  console.log(JSON.stringify(result, null, 2))
}
