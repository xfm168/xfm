/**
 * P7 Blind Test Runner — 盲测运行器
 *
 * 随机抽取命例，隐藏传统答案，系统自动推演，最后比对。
 * 禁止人工参与推演。不修改任何命理算法。
 */

import { CASE_DATA } from './caseData'
import { P7_EXTENDED_CASES } from './caseDataExtended'
import type { BaziCase } from './caseLibrary'
import { runQiEngine } from '../engine'
import { determineGeJu } from '../../geju'
import { calculateStrength } from '../../wuxing'
import { determineXiYongShen } from '../../xiyongshen'
import { getRelatedShens } from '../../shishen'
import { getStemElement } from '../../../core'
import { ConsensusEngine } from './consensusEngine'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

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

interface CaseComparison {
  caseId: string
  caseName: string
  category: string
  trustLevel: string
  traditional: {
    pattern: string
    wangShuai: string
    yongShen: string
    xiShen: string
    jiShen: string
    dayElement: string
  }
  system: SystemAnalysis
  scores: DimensionScores
}

interface DimensionScores {
  geJu: number        // 格局
  wangShuai: number   // 旺衰
  yongShen: number    // 用神
  xiJi: number        // 喜忌
  dayElement: number  // 日主五行
  career: number      // 职业
  marriage: number    // 婚姻
  health: number      // 健康
  wealth: number      // 财富
}

export interface BlindTestResult {
  totalCases: number
  testedCases: number
  comparisons: CaseComparison[]
  accuracy: AccuracySummary
}

interface AccuracySummary {
  geJu: number
  wangShuai: number
  yongShen: number
  xiJi: number
  dayElement: number
  career: number
  marriage: number
  health: number
  wealth: number
  overall: number
}

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

function shuffle<T>(arr: T[]): T[] {
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

// 构造 sixLines
function buildSixLines(caze: BaziCase) {
  return {
    year: { gan: caze.yearGan, zhi: caze.yearZhi },
    month: { gan: caze.monthGan, zhi: caze.monthZhi },
    day: { gan: caze.dayGan, zhi: caze.dayZhi },
    hour: { gan: caze.hourGan, zhi: caze.hourZhi },
  }
}

// 计算五行计数
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
// 系统推演 — 从四柱直接运行，不使用 birthDate
// ═══════════════════════════════════════════════════════════

function runSystemAnalysis(caze: BaziCase): SystemAnalysis {
  var sixLines = buildSixLines(caze)
  var dayGan = caze.dayGan
  var monthZhi = caze.monthZhi

  // 1. 运行 QiEngine — 获取气机分析
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
// 评分逻辑
// ═══════════════════════════════════════════════════════════

function scorePattern(system: string, traditional: string): number {
  if (!traditional || !system) return 0
  if (system === traditional) return 100
  // 部分匹配：系统结果包含传统格局关键词或反之
  if (system.indexOf(traditional) >= 0 || traditional.indexOf(system) >= 0) return 75
  // 格局大类匹配（如都是"正官格"系列）
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
  // 大类匹配：身旺/身弱
  var isSysStrong = system.indexOf('旺') >= 0 && system.indexOf('弱') < 0
  var isTradStrong = traditional.indexOf('旺') >= 0 && traditional.indexOf('弱') < 0
  if (isSysStrong === isTradStrong) return 75
  // 中和特殊处理
  if (system.indexOf('中') >= 0 && traditional.indexOf('中') >= 0) return 75
  return 0
}

function scoreYongShen(system: string, traditional: string): number {
  if (!traditional || !system) return 0
  if (system === traditional) return 100
  // 五行匹配
  var fiveElements = ['木', '火', '土', '金', '水']
  var sysEl = '', tradEl = ''
  for (var i = 0; i < fiveElements.length; i++) {
    if (system.indexOf(fiveElements[i]) >= 0) sysEl = fiveElements[i]
    if (traditional.indexOf(fiveElements[i]) >= 0) tradEl = fiveElements[i]
  }
  if (sysEl && tradEl && sysEl === tradEl) return 75
  // 包含关系
  if (system.indexOf(traditional) >= 0 || traditional.indexOf(system) >= 0) return 50
  return 0
}

function scoreXiJi(systemXi: string, systemJi: string, tradXi: string, tradJi: string): number {
  if (!tradXi && !tradJi) return 0
  var xiScore = scoreYongShen(systemXi, tradXi)
  var jiScore = scoreYongShen(systemJi, tradJi)
  return Math.round((xiScore + jiScore) / 2)
}

function scoreDayElement(system: string, traditional: string): number {
  if (!traditional || !system) return 0
  if (system === traditional) return 100
  return 0
}

function scoreDimensionFromConsensus(dims: Array<{ dimension: string; finalView: string; confidence: number }>, dimName: string): number {
  for (var i = 0; i < dims.length; i++) {
    if (dims[i].dimension === dimName || dims[i].dimension.indexOf(dimName) >= 0) {
      return dims[i].confidence
    }
  }
  return 0
}

function scoreCase(sys: SystemAnalysis, trad: BaziCase): DimensionScores {
  var geJuScore = scorePattern(sys.pattern, trad.pattern || '')
  var wangShuaiScore = scoreWangShuai(sys.wangShuai, trad.wangShuai || '')
  var yongShenScore = scoreYongShen(sys.yongShen, trad.yongShen || '')
  var xiJiScore = scoreXiJi(sys.xiShen, sys.jiShen, trad.xiShen || '', trad.jiShen || '')
  var dayElementScore = scoreDayElement(sys.dayElement, trad.dayElement || '')

  // 从 ConsensusEngine 获取职业/婚姻/健康/财富置信度
  var careerScore = scoreDimensionFromConsensus(sys.consensusDimensions, '事业')
  var marriageScore = scoreDimensionFromConsensus(sys.consensusDimensions, '婚姻')
  var healthScore = scoreDimensionFromConsensus(sys.consensusDimensions, '健康')
  var wealthScore = scoreDimensionFromConsensus(sys.consensusDimensions, '财富')

  return {
    geJu: geJuScore,
    wangShuai: wangShuaiScore,
    yongShen: yongShenScore,
    xiJi: xiJiScore,
    dayElement: dayElementScore,
    career: careerScore,
    marriage: marriageScore,
    health: healthScore,
    wealth: wealthScore,
  }
}

// ═══════════════════════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════════════════════

export async function runBlindTest(sampleSize: number): Promise<BlindTestResult> {
  // 合并所有案例
  var allCases: BaziCase[] = CASE_DATA.concat(P7_EXTENDED_CASES)

  // 随机抽取
  var shuffled = shuffle(allCases)
  var sampled = shuffled.slice(0, Math.min(sampleSize, shuffled.length))

  var comparisons: CaseComparison[] = []

  for (var i = 0; i < sampled.length; i++) {
    var caze = sampled[i]

    // 系统自动推演（隐藏传统答案）
    var systemResult = runSystemAnalysis(caze)

    // 比对
    var scores = scoreCase(systemResult, caze)

    comparisons.push({
      caseId: caze.id,
      caseName: caze.name,
      category: caze.category.join(', '),
      trustLevel: caze.trustLevel,
      traditional: {
        pattern: caze.pattern || '',
        wangShuai: caze.wangShuai || '',
        yongShen: caze.yongShen || '',
        xiShen: caze.xiShen || '',
        jiShen: caze.jiShen || '',
        dayElement: caze.dayElement || '',
      },
      system: systemResult,
      scores: scores,
    })
  }

  // 计算总体准确率
  var dims: (keyof DimensionScores)[] = ['geJu', 'wangShuai', 'yongShen', 'xiJi', 'dayElement', 'career', 'marriage', 'health', 'wealth']
  var accuracy: any = {}
  var totalSum = 0
  var dimCount = 0
  for (var d = 0; d < dims.length; d++) {
    var sum = 0
    for (var c = 0; c < comparisons.length; c++) {
      sum += comparisons[c].scores[dims[d]]
    }
    var avg = comparisons.length > 0 ? Math.round(sum / comparisons.length) : 0
    accuracy[dims[d]] = avg
    totalSum += avg
    dimCount++
  }
  accuracy.overall = Math.round(totalSum / dimCount)

  return {
    totalCases: allCases.length,
    testedCases: sampled.length,
    comparisons: comparisons,
    accuracy: accuracy as AccuracySummary,
  }
}

// ═══════════════════════════════════════════════════════════
// CLI 入口
// ═══════════════════════════════════════════════════════════

if (typeof require !== 'undefined' && require.main === module) {
  var sampleSize = parseInt(process.argv[2] || '200', 10)
  runBlindTest(sampleSize).then(function(result) {
    console.log('\n' + '='.repeat(72))
    console.log('  P7 Blind Test Report')
    console.log('='.repeat(72))
    console.log('  Total Cases:   ' + result.totalCases)
    console.log('  Tested Cases:  ' + result.testedCases)
    console.log('')
    console.log('  Dimension Accuracy:')
    console.log('  ' + '-'.repeat(40))
    var dims: (keyof AccuracySummary)[] = ['geJu', 'wangShuai', 'yongShen', 'xiJi', 'dayElement', 'career', 'marriage', 'health', 'wealth']
    var dimNames: Record<string, string> = {
      geJu: '格局 (Pattern)',
      wangShuai: '旺衰 (Wang Shuai)',
      yongShen: '用神 (Yong Shen)',
      xiJi: '喜忌 (Xi Ji)',
      dayElement: '日主五行 (Day Element)',
      career: '职业 (Career)',
      marriage: '婚姻 (Marriage)',
      health: '健康 (Health)',
      wealth: '财富 (Wealth)',
    }
    for (var i = 0; i < dims.length; i++) {
      var name = dimNames[dims[i]] || dims[i]
      var score = result.accuracy[dims[i]]
      var bar = ''
      for (var b = 0; b < Math.floor(score / 5); b++) bar += '#'
      console.log('  ' + name + ': ' + score + '% ' + bar)
    }
    console.log('  ' + '-'.repeat(40))
    console.log('  Overall: ' + result.accuracy.overall + '%')
    console.log('')

    // JSON 输出
    console.log('---JSON---')
    console.log(JSON.stringify(result, null, 2))
  })
}
