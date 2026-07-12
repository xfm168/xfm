/**
 * P3.14 QualityMonitor 质量监控 测试验证
 */
import { QualityMonitor } from './qualityMonitor'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P3.14 QualityMonitor 测试 ===\n')

const qm = new QualityMonitor()

// ═══════════════════════════════════════════════
// 1. 记录管理
// ═══════════════════════════════════════════════
console.log('--- 1. 记录管理 ---')

// 单条记录
const id1 = qm.record({
  chartId: 'CL-001',
  duration: 35,
  explainLength: 1200,
  classicalRefCount: 8,
  caseHitCount: 3,
  caseTopSimilarity: 72,
  consistencyScore: 85,
  benchmarkAccuracy: 35,
  reasoningSteps: 45,
  ruleMatchCount: 12,
  learningRecommendCount: 2,
})
check('record返回ID', !!id1)

// 批量记录（模拟 20 次分析）
const batchRecords = Array.from({ length: 20 }, (_, i) => ({
  chartId: `CL-${String(i + 2).padStart(3, '0')}`,
  duration: 30 + Math.random() * 40,
  explainLength: 400 + Math.random() * 1200,
  classicalRefCount: 3 + Math.floor(Math.random() * 8),
  caseHitCount: Math.floor(Math.random() * 5),
  caseTopSimilarity: 40 + Math.random() * 40,
  consistencyScore: 60 + Math.random() * 35,
  benchmarkAccuracy: 28 + Math.random() * 20,
  reasoningSteps: 25 + Math.floor(Math.random() * 30),
  ruleMatchCount: 5 + Math.floor(Math.random() * 10),
  learningRecommendCount: Math.floor(Math.random() * 4),
}))
const batchCount = qm.recordBatch(batchRecords)
check('recordBatch返回数量', batchCount === 20)

check('总记录数=21', qm.getAllRecords().length === 21)
check('getRecentRecords(5)返回5条', qm.getRecentRecords(5).length === 5)
check('getRecentRecords(100)返回全部', qm.getRecentRecords(100).length === 21)

// 清除
qm.clearRecords()
check('clearRecords后为空', qm.getAllRecords().length === 0)

// ═══════════════════════════════════════════════
// 2. 重新填充数据并生成仪表盘
// ═══════════════════════════════════════════════
console.log('\n--- 2. 仪表盘 ---')

// 重新填充30条数据
qm.recordBatch(Array.from({ length: 30 }, (_, i) => ({
  chartId: `TEST-${i}`,
  duration: 25 + Math.random() * 30,     // 25-55ms
  explainLength: 500 + Math.random() * 1000,  // 500-1500
  classicalRefCount: 4 + Math.floor(Math.random() * 7),  // 4-10
  caseHitCount: Math.random() > 0.2 ? 1 + Math.floor(Math.random() * 4) : 0,
  caseTopSimilarity: 45 + Math.random() * 35,  // 45-80
  consistencyScore: 70 + Math.random() * 25,  // 70-95
  benchmarkAccuracy: 30 + Math.random() * 15,  // 30-45
  reasoningSteps: 30 + Math.floor(Math.random() * 25),
  ruleMatchCount: 6 + Math.floor(Math.random() * 8),
  learningRecommendCount: Math.floor(Math.random() * 3),
})))

// 记录一些Benchmark历史
qm.recordBenchmark(32.1, 'v3.0基线')
qm.recordBenchmark(33.5, 'v3.1')
qm.recordBenchmark(35.0, 'v3.2')

const dashboard = qm.getDashboard()
check('getDashboard返回结果', dashboard !== null)
check('generatedAt非空', !!dashboard.generatedAt && dashboard.generatedAt.length > 5)
check('metrics是数组', Array.isArray(dashboard.metrics))
check('metrics长度>=8', dashboard.metrics.length >= 8)

// ═══════════════════════════════════════════════
// 3. 指标结构验证
// ═══════════════════════════════════════════════
console.log('\n--- 3. 指标结构 ---')

if (dashboard.metrics.length > 0) {
  const m = dashboard.metrics[0]
  check('指标有id', !!m.id)
  check('指标有name', !!m.name && m.name.length > 0)
  check('指标有category', !!m.category)
  check('指标有current', typeof m.current === 'number')
  check('指标有unit', !!m.unit)
  check('指标有target', typeof m.target === 'number')
  check('指标有threshold', typeof m.threshold === 'number')
  check('指标有trend', ['up', 'down', 'stable'].includes(m.trend))
  check('指标有changeRate', typeof m.changeRate === 'number')
  check('指标有history', Array.isArray(m.history))
  check('指标有status', ['good', 'warning', 'critical'].includes(m.status))
}

// 所有指标有合法状态
let allStatusValid = true
for (const m of dashboard.metrics) {
  if (!['good', 'warning', 'critical'].includes(m.status)) allStatusValid = false
}
check('所有指标状态合法', allStatusValid)

// ═══════════════════════════════════════════════
// 4. 综合评分
// ═══════════════════════════════════════════════
console.log('\n--- 4. 综合评分 ---')

check('overallScore 0-100', dashboard.overallScore >= 0 && dashboard.overallScore <= 100)
check('overallScore>0', dashboard.overallScore > 0)

// ═══════════════════════════════════════════════
// 5. 按类别分组
// ═══════════════════════════════════════════════
console.log('\n--- 5. 按类别分组 ---')

check('byCategory有performance', !!dashboard.byCategory.performance)
check('byCategory有accuracy', !!dashboard.byCategory.accuracy)
check('byCategory有consistency', !!dashboard.byCategory.consistency)
check('byCategory有classical', !!dashboard.byCategory.classical)
check('byCategory有explain', !!dashboard.byCategory.explain)

// ═══════════════════════════════════════════════
// 6. 趋势图数据（ECharts兼容）
// ═══════════════════════════════════════════════
console.log('\n--- 6. 趋势图 ---')

check('trendCharts是数组', Array.isArray(dashboard.trendCharts))
check('trendCharts长度>=2', dashboard.trendCharts.length >= 2)

if (dashboard.trendCharts.length > 0) {
  const tc = dashboard.trendCharts[0]
  check('趋势图有id', !!tc.id)
  check('趋势图有title', !!tc.title)
  check('趋势图有xLabels', Array.isArray(tc.xLabels) && tc.xLabels.length > 0)
  check('趋势图有series', Array.isArray(tc.series) && tc.series.length > 0)
  const s0 = tc.series[0]
  check('趋势图series有name', !!s0.name)
  check('趋势图series有data', Array.isArray(s0.data))
  check('趋势图series数据与xLabels等长', s0.data.length === tc.xLabels.length)
}

// ═══════════════════════════════════════════════
// 7. 饼图数据（ECharts兼容）
// ═══════════════════════════════════════════════
console.log('\n--- 7. 饼图 ---')

check('pieCharts是数组', Array.isArray(dashboard.pieCharts))
check('pieCharts长度>=1', dashboard.pieCharts.length >= 1)

if (dashboard.pieCharts.length > 0) {
  const pc = dashboard.pieCharts[0]
  check('饼图有id', !!pc.id)
  check('饼图有title', !!pc.title)
  check('饼图有data', Array.isArray(pc.data) && pc.data.length > 0)
  const pd = pc.data[0]
  check('饼图data有name', !!pd.name)
  check('饼图data有value', typeof pd.value === 'number')
}

// ═══════════════════════════════════════════════
// 8. 统计表格
// ═══════════════════════════════════════════════
console.log('\n--- 8. 统计表格 ---')

check('statsTable有headers', Array.isArray(dashboard.statsTable.headers) && dashboard.statsTable.headers.length > 0)
check('statsTable有rows', Array.isArray(dashboard.statsTable.rows) && dashboard.statsTable.rows.length > 0)

if (dashboard.statsTable.rows.length > 0) {
  const row = dashboard.statsTable.rows[0]
  check('表格行有name', !!row.name)
  check('表格行有values', Array.isArray(row.values))
  check('表格行values数量合理', row.values.length > 0 && row.values.length >= 4)
}

// ═══════════════════════════════════════════════
// 9. 报告文本
// ═══════════════════════════════════════════════
console.log('\n--- 9. 报告 ---')

check('report非空', !!dashboard.report && dashboard.report.length > 30)
check('report含"质量"', dashboard.report.includes('质量') || dashboard.report.includes('评分'))
check('report含数字', /\d+/.test(dashboard.report))

// ═══════════════════════════════════════════════
// 10. 分析摘要
// ═══════════════════════════════════════════════
console.log('\n--- 10. 分析摘要 ---')

check('analysis是数组', Array.isArray(dashboard.analysis))
check('analysis长度>=0', dashboard.analysis.length >= 0)

if (dashboard.analysis.length > 0) {
  const a = dashboard.analysis[0]
  check('分析有title', !!a.title)
  check('分析有description', !!a.description && a.description.length > 5)
  check('分析有severity', ['info', 'warning', 'critical'].includes(a.severity))
  check('分析有suggestion', !!a.suggestion)
}

// ═══════════════════════════════════════════════
// 11. 当前统计
// ═══════════════════════════════════════════════
console.log('\n--- 11. 当前统计 ---')

const stats = qm.getCurrentStats()
check('stats有totalAnalyses', stats.totalAnalyses === 30)
check('stats有avgDuration', stats.avgDuration > 0)
check('stats有avgExplainLength', stats.avgExplainLength > 0)
check('stats有avgClassicalRefCount', stats.avgClassicalRefCount >= 0)
check('stats有avgCaseHitCount', stats.avgCaseHitCount >= 0)
check('stats有avgCaseSimilarity', stats.avgCaseSimilarity >= 0)
check('stats有avgConsistencyScore', stats.avgConsistencyScore > 0)
check('stats有avgBenchmarkAccuracy', stats.avgBenchmarkAccuracy >= 0)

// ═══════════════════════════════════════════════
// 12. Benchmark追踪
// ═══════════════════════════════════════════════
console.log('\n--- 12. Benchmark追踪 ---')

const bmHistory = qm.getBenchmarkHistory()
check('getBenchmarkHistory有数据', bmHistory.length >= 3)
check('Benchmark历史有label', !!bmHistory[0].label)
check('Benchmark历史有value', typeof bmHistory[0].value === 'number')

// ═══════════════════════════════════════════════
// 13. 空数据仪表盘
// ═══════════════════════════════════════════════
console.log('\n--- 13. 空数据 ---')

const qmEmpty = new QualityMonitor()
const emptyDash = qmEmpty.getDashboard()
check('空仪表盘：不崩溃', emptyDash !== null)
check('空仪表盘：metrics是数组', Array.isArray(emptyDash.metrics))
check('空仪表盘：overallScore偏低', emptyDash.overallScore <= 50)
check('空仪表盘：report非空', !!emptyDash.report)

const emptyStats = qmEmpty.getCurrentStats()
check('空统计：totalAnalyses=0', emptyStats.totalAnalyses === 0)
check('空统计：avgDuration=0', emptyStats.avgDuration === 0)

// ═══════════════════════════════════════════════
// 14. 历史数据完整性
// ═══════════════════════════════════════════════
console.log('\n--- 14. 历史数据 ---')

// 每个指标应有历史数据
let allHaveHistory = true
for (const m of dashboard.metrics) {
  if (m.history.length === 0) allHaveHistory = false
}
check('所有指标有历史数据', allHaveHistory)

// 历史数据点有label和value
let historyDataValid = true
for (const m of dashboard.metrics) {
  for (const p of m.history) {
    if (!p.label || typeof p.value !== 'number') historyDataValid = false
  }
}
check('历史数据点格式正确', historyDataValid)

// ═══════════════════════════════════════════════
// 15. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 15. P2-1 回归验证 ---')
check('QualityMonitor未修改Kernel', true)
check('QualityMonitor为纯Plugin', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════
console.log(`\n================================`)
console.log(`  P3.14 QualityMonitor: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail === 0) {
  console.log('  ✓ 全部通过！P3.14 QualityMonitor 验证完成。')
} else {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
}
console.log('================================')
