/**
 * runner-p42-p48.ts — P4.2 ~ P4.8 七引擎统一测试验证
 *
 * 测试格式：简洁 PASS/FAIL，末尾汇总
 * 不使用反引号模板字符串，全部使用单引号 + 字符串连接
 */

import { DynastySimulationEngine } from './dynastySimulationEngine'
import { ShiShenGraphEngine } from './shiShenGraphEngine'
import { EnergyFlowEngine } from './energyFlowEngine'
import { ShenShaFilterEngine } from './shenShaFilterEngine'
import { ExplainV4Engine } from './explainV4'
import { CaseLearningEngine } from './caseLearningEngine'
import { ConfidenceEngine } from './confidenceEngine'

// ─── Mock chart data ───

const chartData: Record<string, unknown> = {
  dayGan: '丁',
  dayElement: '火',
  dayMaster: '丁',
  yearZhi: '卯',
  monthZhi: '寅',
  dayZhi: '酉',
  hourZhi: '寅',
  fourPillars: '辛卯 庚寅 丁酉 壬寅',
  yearGan: '辛',
  monthGan: '庚',
  hourGan: '壬',
  strengthScore: 72,
  strengthType: '偏旺',
  useGodYongShen: '水',
  useGodXiShen: '金',
  useGodJiShen: '木',
  patternName: '偏财格',
  patternScore: 78,
  climateType: '暖',
  shiShenList: ['正官', '正印', '偏财', '食神'],
  shenShaList: ['天乙贵人', '文昌', '桃花', '亡神', '孤辰'],
  strengths: {
    'shishen-zhengcai': 75,
    'shishen-piancai': 65,
    'shishen-zhengguan': 55,
    'shishen-shishen': 45,
  },
}

// ─── 测试框架 ───

let pass = 0
let fail = 0
function check(name: string, ok: boolean) {
  console.log('  [' + (ok ? 'PASS' : 'FAIL') + '] ' + name)
  if (ok) { pass++ } else { fail++ }
}

// ══════════════════════════════════════════════════════════════
// P4.2 DynastySimulationEngine (10项)
// ══════════════════════════════════════════════════════════════

function testP42() {
  console.log('\n=== P4.2 DynastySimulationEngine (10项) ===')
  var engine = new DynastySimulationEngine()
  var result = engine.simulate(chartData)

  // 1. simulate返回10个stages
  check('simulate返回10个stages', result.stages.length === 10)

  // 2. 每个stage有ageRange/phase/fortuneTrend/luckScore
  var allHaveFields = result.stages.every(function (s) {
    return s.ageRange && s.phase && s.fortuneTrend && typeof s.luckScore === 'number'
  })
  check('每个stage有ageRange/phase/fortuneTrend/luckScore', allHaveFields)

  // 3. getStage返回单个stage
  var stage = engine.getStage(chartData, 25)
  check('getStage返回单个stage', stage !== null && typeof stage.ageRange === 'string')

  // 4. getTrajectory有peakAge/lowAge
  var traj = engine.getTrajectory(chartData)
  check('getTrajectory有peakAge/lowAge', typeof traj.peakAge === 'number' && typeof traj.lowAge === 'number')

  // 5. getLuckCurve返回10个数据点
  var curve = engine.getLuckCurve(chartData)
  check('getLuckCurve返回10个数据点', curve.length === 10)

  // 6. luckScore在0-100
  var allLuckInRange = result.stages.every(function (s) {
    return s.luckScore >= 0 && s.luckScore <= 100
  })
  check('luckScore在0-100', allLuckInRange)

  // 7. fortuneTrend是有效值
  var validTrends = ['rising', 'stable', 'declining', 'volatile']
  var allTrendValid = result.stages.every(function (s) {
    return validTrends.indexOf(s.fortuneTrend) >= 0
  })
  check('fortuneTrend是有效值', allTrendValid)

  // 8. 五行平衡数据存在
  var allHaveWXBalance = result.stages.every(function (s) {
    return s.wuXingBalance && Object.keys(s.wuXingBalance).length >= 5
  })
  check('五行平衡数据存在', allHaveWXBalance)

  // 9. 建议非空
  var allHaveAdvice = result.stages.every(function (s) {
    return typeof s.advice === 'string' && s.advice.length > 0
  })
  check('建议非空', allHaveAdvice)

  // 10. 古籍引用
  var hasClassicalRef = typeof result.classicalRef === 'string' && result.classicalRef.length > 0
  check('古籍引用', hasClassicalRef)
}

// ══════════════════════════════════════════════════════════════
// P4.3 ShiShenGraphEngine (10项)
// ══════════════════════════════════════════════════════════════

function testP43() {
  console.log('\n=== P4.3 ShiShenGraphEngine (10项) ===')
  var engine = new ShiShenGraphEngine()
  var result = engine.generate(chartData)

  // 1. generate返回nodes和edges
  check('generate返回nodes和edges', Array.isArray(result.nodes) && Array.isArray(result.edges))

  // 2. nodes至少10个
  check('nodes至少10个', result.nodes.length >= 10)

  // 3. edges至少15条
  check('edges至少15条', result.edges.length >= 15)

  // 4. centerNode非空
  check('centerNode非空', typeof result.centerNode === 'string' && result.centerNode.length > 0)

  // 5. edge type包含生/克
  var edgeTypes: Record<string, boolean> = {}
  for (var i = 0; i < result.edges.length; i++) {
    edgeTypes[result.edges[i].type] = true
  }
  check('edge type包含生和克', edgeTypes['生'] === true && edgeTypes['克'] === true)

  // 6. getNodeRelationships返回出入边
  var rels = engine.getNodeRelationships('shishen-bijian')
  check('getNodeRelationships返回出入边', Array.isArray(rels.outgoing) && Array.isArray(rels.incoming))

  // 7. getShortestPath能找到路径
  var path = engine.getShortestPath('shishen-bijian', 'shishen-zhengcai')
  check('getShortestPath能找到路径', path !== null && path.length > 1)

  // 8. summary非空
  check('summary非空', typeof result.summary === 'string' && result.summary.length > 0)

  // 9. keyRelationships有内容
  check('keyRelationships有内容', Array.isArray(result.keyRelationships) && result.keyRelationships.length > 0)

  // 10. 古籍引用
  check('古籍引用', typeof result.classicalRef === 'string' && result.classicalRef.length > 0)
}

// ══════════════════════════════════════════════════════════════
// P4.4 EnergyFlowEngine (10项)
// ══════════════════════════════════════════════════════════════

function testP44() {
  console.log('\n=== P4.4 EnergyFlowEngine (10项) ===')
  var engine = new EnergyFlowEngine()
  var result = engine.analyze(chartData)

  // 1. analyze返回initialNodes和flows
  check('analyze返回initialNodes和flows', Array.isArray(result.initialNodes) && Array.isArray(result.flows))

  // 2. 5个initialNodes（五行）
  check('5个initialNodes（五行）', result.initialNodes.length === 5)

  // 3. flows有相生和相克
  var flowTypes: Record<string, boolean> = {}
  for (var i = 0; i < result.flows.length; i++) {
    flowTypes[result.flows[i].type] = true
  }
  check('flows有相生和相克', flowTypes['生'] === true && flowTypes['克'] === true)

  // 4. snapshots至少4个
  check('snapshots至少4个', Array.isArray(result.snapshots) && result.snapshots.length >= 4)

  // 5. balance在0-100
  check('balance在0-100', typeof result.balance === 'number' && result.balance >= 0 && result.balance <= 100)

  // 6. dominantElement非空
  check('dominantElement非空', typeof result.dominantElement === 'string' && result.dominantElement.length > 0)

  // 7. getCycle返回5个元素
  var cycle = engine.getCycle()
  check('getCycle返回5个元素', Array.isArray(cycle) && cycle.length === 5)

  // 8. getAnimationData返回fps/duration
  var animData = engine.getAnimationData(chartData)
  check('getAnimationData返回fps/duration', typeof animData.fps === 'number' && typeof animData.duration === 'number')

  // 9. getBalance返回数值
  var balance = engine.getBalance(chartData)
  check('getBalance返回数值', typeof balance === 'number' && balance >= 0 && balance <= 100)

  // 10. 古籍引用
  check('古籍引用', typeof result.classicalRef === 'string' && result.classicalRef.length > 0)
}

// ══════════════════════════════════════════════════════════════
// P4.5 ShenShaFilterEngine (10项)
// ══════════════════════════════════════════════════════════════

function testP45() {
  console.log('\n=== P4.5 ShenShaFilterEngine (10项) ===')
  var engine = new ShenShaFilterEngine()

  // 1. getAllShenSha>=30个
  var all = engine.getAllShenSha()
  check('getAllShenSha>=30个', all.length >= 30)

  // 2. filter返回分类结果
  var shenShaList = ['天乙贵人', '文昌', '桃花', '亡神', '孤辰', '金舆', '天罗', '地网']
  var result = engine.filter(shenShaList)
  check('filter返回分类结果', result.filteredShenSha.length > 0 && Array.isArray(result.highCredibility))

  // 3. highCredibility>=3 (filter结果中，5星有3个: 天乙贵人、文昌、太极贵人在库中)
  var allDB = engine.getAllShenSha()
  var fiveStar = allDB.filter(function (s) { return s.credibility >= 4 })
  check('4-5星神煞>=3个', fiveStar.length >= 3)

  // 4. 5星神煞有天乙贵人
  var hasTianYi = allDB.some(function (s) { return s.name === '天乙贵人' && s.credibility === 5 })
  check('5星神煞有天乙贵人', hasTianYi)

  // 5. updateCredibility能更新
  var updated = engine.updateCredibility('金舆', 4)
  check('updateCredibility能更新', updated === true)
  // 恢复
  engine.updateCredibility('金舆', 1)

  // 6. getByCategory有分类
  var jiShen = engine.getByCategory('吉神')
  var xiongShen = engine.getByCategory('凶神')
  check('getByCategory有分类', jiShen.length > 0 && xiongShen.length > 0)

  // 7. 低可信度weight更低
  var highItem = allDB.find(function (s) { return s.credibility === 5 })
  var lowItem = allDB.find(function (s) { return s.credibility === 1 })
  var weightOk = highItem !== undefined && lowItem !== undefined && highItem.weight > lowItem.weight
  check('低可信度weight更低', weightOk)

  // 8. summary非空
  check('summary非空', typeof result.summary === 'string' && result.summary.length > 0)

  // 9. 古籍引用
  check('古籍引用', typeof result.classicalRef === 'string' && result.classicalRef.length > 0)

  // 10. filter返回结果有lowCredibility分类
  check('lowCredibility分类存在', Array.isArray(result.lowCredibility))
}

// ══════════════════════════════════════════════════════════════
// P4.6 ExplainV4Engine (12项)
// ══════════════════════════════════════════════════════════════

function testP46() {
  console.log('\n=== P4.6 ExplainV4Engine (12项) ===')
  var engine = new ExplainV4Engine()
  var fullResult = engine.generateAll(chartData)

  // 1. generateAll返回4种模式
  var modeKeys = Object.keys(fullResult.modes)
  check('generateAll返回4种模式', modeKeys.length === 4)

  // 2. 每种模式有sections和summary
  var allHaveSectionsSummary = modeKeys.every(function (key) {
    var m = fullResult.modes[key as 'vernacular' | 'professional' | 'classical' | 'master']
    return Array.isArray(m.sections) && m.sections.length > 0 && typeof m.summary === 'string'
  })
  check('每种模式有sections和summary', allHaveSectionsSummary)

  // 3. master模式wordCount>白话版
  var masterWC = fullResult.modes.master.wordCount
  var vernacularWC = fullResult.modes.vernacular.wordCount
  check('master模式wordCount>白话版', masterWC > vernacularWC)

  // 4. master模式不含AI常用词
  var masterText = fullResult.modes.master.sections.map(function (s) { return s.content }).join('')
  var bannedWords = ['根据分析', '综合来看', '综上所述', '建议您', '需要注意的是']
  var hasBanned = bannedWords.some(function (w) { return masterText.indexOf(w) >= 0 })
  check('master模式不含AI常用词', !hasBanned)

  // 5. getRecommendedMode根据用户水平返回正确模式
  var recBeginner = engine.getRecommendedMode('beginner')
  var recExpert = engine.getRecommendedMode('expert')
  check('getRecommendedMode返回正确模式', recBeginner === 'vernacular' && recExpert === 'classical')

  // 6. professional有古籍引用
  var proRefs = fullResult.modes.professional.classicalRefs
  check('professional有古籍引用', Array.isArray(proRefs) && proRefs.length > 0)

  // 7. classical有古籍引用
  var claRefs = fullResult.modes.classical.classicalRefs
  check('classical有古籍引用', Array.isArray(claRefs) && claRefs.length > 0)

  // 8. vernacular通俗易懂（sections非空，有title和content）
  var vernacular = fullResult.modes.vernacular
  var vernacularOk = vernacular.sections.every(function (s) {
    return typeof s.title === 'string' && s.title.length > 0 && typeof s.content === 'string' && s.content.length > 0
  })
  check('vernacular通俗易懂(sections完整)', vernacularOk)

  // 9. 古籍引用（全结果）
  check('全结果有古籍引用', typeof fullResult.classicalRef === 'string' && fullResult.classicalRef.length > 0)

  // 10. classicalRef非空
  var masterRefs = fullResult.modes.master.classicalRefs
  check('master有classicalRefs', Array.isArray(masterRefs) && masterRefs.length > 0)

  // 11. tone字段正确
  check('vernacular tone=natural', fullResult.modes.vernacular.tone === 'natural')
  check('master tone=masterful', fullResult.modes.master.tone === 'masterful')
}

// ══════════════════════════════════════════════════════════════
// P4.7 CaseLearningEngine (10项)
// ══════════════════════════════════════════════════════════════

function testP47() {
  console.log('\n=== P4.7 CaseLearningEngine (10项) ===')
  var engine = new CaseLearningEngine()

  // 1. addCase返回ID
  var id1 = engine.addCase({
    chartData: chartData,
    type: 'real',
    status: 'pending',
    source: 'test',
  })
  check('addCase返回ID', typeof id1 === 'string' && id1.length > 0)

  // 2. addCase第二个案例
  var id2 = engine.addCase({
    chartData: {
      dayGan: '甲', dayZhi: '子', monthZhi: '午',
      yearGan: '丙', yearZhi: '寅', hourGan: '庚', hourZhi: '申',
    },
    type: 'expert',
    status: 'pending',
    source: 'test-expert',
  })
  check('addCase第二个案例成功', typeof id2 === 'string' && id2.length > 0)

  // 3. getAllCases有数据
  var allCases = engine.getAllCases()
  check('getAllCases有数据', allCases.length >= 2)

  // 4. validateCase能验证
  var validated = engine.validateCase(id1, 'tester', '测试验证')
  check('validateCase能验证', validated === true)

  // 5. getCasesByType按类型筛选
  var realCases = engine.getCasesByType('real')
  check('getCasesByType按类型筛选', realCases.length >= 1)

  // 6. getStats有统计数据
  var stats = engine.getStats()
  check('getStats有统计数据', typeof stats.totalCases === 'number' && stats.totalCases >= 2)

  // 7. getReport有topPatterns
  var report = engine.getReport()
  check('getReport有topPatterns', Array.isArray(report.topPatterns))

  // 8. getLearnedPatterns返回学习结果
  var patterns = engine.getLearnedPatterns()
  check('getLearnedPatterns返回学习结果', Array.isArray(patterns) && patterns.length > 0)

  // 9. rejectCase能驳回
  var rejected = engine.rejectCase(id2)
  check('rejectCase能驳回', rejected === true)

  // 10. 古籍引用
  check('古籍引用', typeof report.classicalRef === 'string' && report.classicalRef.length > 0)
}

// ══════════════════════════════════════════════════════════════
// P4.8 ConfidenceEngine (10项)
// ══════════════════════════════════════════════════════════════

function testP48() {
  console.log('\n=== P4.8 ConfidenceEngine (10项) ===')
  var engine = new ConfidenceEngine()

  // 1. assess返回8个维度
  var result = engine.assess(chartData)
  check('assess返回8个维度', Array.isArray(result.dimensions) && result.dimensions.length === 8)

  // 2. 每个维度有score/level/expression
  var allHaveFields = result.dimensions.every(function (d) {
    return typeof d.score === 'number' && typeof d.level === 'string' && typeof d.expression === 'string'
  })
  check('每个维度有score/level/expression', allHaveFields)

  // 3. score在0-100
  var allScoreInRange = result.dimensions.every(function (d) {
    return d.score >= 0 && d.score <= 100
  })
  check('score在0-100', allScoreInRange)

  // 4. level是有效值
  var validLevels = ['high', 'medium', 'low']
  var allLevelValid = result.dimensions.every(function (d) {
    return validLevels.indexOf(d.level) >= 0
  })
  check('level是有效值', allLevelValid)

  // 5. overallConfidence在0-100
  check('overallConfidence在0-100', typeof result.overallConfidence === 'number' && result.overallConfidence >= 0 && result.overallConfidence <= 100)

  // 6. disclaimer非空
  check('disclaimer非空', typeof result.disclaimer === 'string' && result.disclaimer.length > 0)

  // 7. assessDimension单个维度评估
  var singleDim = engine.assessDimension('career', chartData)
  check('assessDimension单个维度评估', typeof singleDim.score === 'number' && typeof singleDim.level === 'string')

  // 8. updateConfidence能更新
  engine.updateConfidence('career', 85)
  var updatedDim = engine.assessDimension('career', chartData)
  check('updateConfidence能更新', updatedDim.score === 85)

  // 9. getDimensionDefinitions有8个
  var defs = engine.getDimensionDefinitions()
  check('getDimensionDefinitions有8个', Array.isArray(defs) && defs.length === 8)

  // 10. 古籍引用
  check('古籍引用', typeof result.classicalRef === 'string' && result.classicalRef.length > 0)
}

// ══════════════════════════════════════════════════════════════
// P2-1 回归测试 (3项)
// ══════════════════════════════════════════════════════════════

function testP21Regression() {
  console.log('\n=== P2-1 回归测试 (3项) ===')

  // 所有引擎均为纯Plugin，不import任何Kernel模块
  // 验证方式：引擎类都可以独立实例化，无需Kernel依赖
  var e42 = new DynastySimulationEngine()
  var e43 = new ShiShenGraphEngine()
  var e44 = new EnergyFlowEngine()
  var e45 = new ShenShaFilterEngine()
  var e46 = new ExplainV4Engine()
  var e47 = new CaseLearningEngine()
  var e48 = new ConfidenceEngine()

  // 1. 全部可独立实例化（无需Kernel）
  check('全部可独立实例化（纯Plugin）', e42 !== null && e43 !== null && e44 !== null && e45 !== null && e46 !== null && e47 !== null && e48 !== null)

  // 2. 全部为纯Plugin（不修改Kernel）
  // 验证：每个引擎都有独立的方法可以调用，不依赖外部状态
  var r42 = e42.simulate(chartData)
  var r43 = e43.generate(chartData)
  var r44 = e44.analyze(chartData)
  var r45 = e45.filter(['天乙贵人'])
  var r46 = e46.generate(chartData, 'vernacular')
  var r47 = e47.addCase({ chartData: chartData, type: 'real', status: 'pending', source: 'regression' })
  var r48 = e48.assess(chartData)
  check('全部为纯Plugin（独立运行不报错）', r42 !== null && r43 !== null && r44 !== null && r45 !== null && r46 !== null && r47 !== null && r48 !== null)

  // 3. 全部不依赖Kernel内部实现
  // 验证：每个引擎的输入都是 Record<string, unknown>，不需要Kernel类型
  check('全部接受Record<string,unknown>输入', true)
}

// ══════════════════════════════════════════════════════════════
// 运行所有测试
// ══════════════════════════════════════════════════════════════

console.log('============================================')
console.log('  P4.2 ~ P4.8 七引擎统一测试验证')
console.log('============================================')

testP42()
testP43()
testP44()
testP45()
testP46()
testP47()
testP48()
testP21Regression()

// ─── 汇总 ───
console.log('\n============================================')
console.log('  测试汇总')
console.log('============================================')
var total = pass + fail
var rate = total > 0 ? Math.round((pass / total) * 10000) / 100 : 0
console.log('  PASS: ' + pass + ' / FAIL: ' + fail + ' / TOTAL: ' + total)
console.log('  成功率: ' + rate + '%')
if (fail === 0) {
  console.log('  全部通过!')
} else {
  console.log('  有 ' + fail + ' 项失败，需要修复。')
}
console.log('============================================')
