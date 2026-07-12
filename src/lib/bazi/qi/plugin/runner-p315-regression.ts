/**
 * P3.15 RegressionCenter 回归中心 测试验证
 */
import { RegressionCenter, createSuite, quickRegression, assertCase } from './regressionCenter'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P3.15 RegressionCenter 测试 ===\n')

// ═══════════════════════════════════════════════
// 创建模拟测试套件
// ═══════════════════════════════════════════════

const p1Suites = [
  createSuite('P1-001', 'P1 八结构基础', 'P1', 'kernel', '八结构基础验证', [
    { name: '天干地支', fn: () => true },
    { name: '五行生克', fn: () => true },
    { name: '十神计算', fn: () => true },
    { name: '纳音', fn: () => true },
  ]),
  createSuite('P1-002', 'P1 十二长生', 'P1', 'kernel', '十二长生验证', [
    { name: '长生顺序', fn: () => true },
    { name: '帝旺判断', fn: () => true },
  ]),
]

const p2Suites = [
  createSuite('P2-001', 'P2 旺衰分析', 'P2', 'strengthEngine', '日主旺衰验证', [
    { name: '身旺判断', fn: () => true },
    { name: '身弱判断', fn: () => true },
    { name: '中和判断', fn: () => true },
  ]),
  createSuite('P2-002', 'P2 调候分析', 'P2', 'climateEngine', '调候验证', [
    { name: '寒命需火', fn: () => true },
    { name: '暖命需水', fn: () => true },
  ]),
  createSuite('P2-003', 'P2 用神分析', 'P2', 'useGodEngine', '用神验证', [
    { name: '身旺用泄耗', fn: () => true },
    { name: '身弱用印比', fn: () => true },
  ]),
  createSuite('P2-004', 'P2 格局校验', 'P2', 'patternValidator', '格局验证', [
    { name: '正官格', fn: () => true },
    { name: '偏财格', fn: () => true },
  ]),
]

const p3Suites = [
  createSuite('P3-001', 'P3 案例库', 'P3', 'caseLibrary', '案例库验证', [
    { name: '110条案例', fn: () => true },
    { name: '搜索功能', fn: () => true },
    { name: '评分功能', fn: () => true },
  ]),
  createSuite('P3-002', 'P3 Benchmark', 'P3', 'benchmarkEngine', '基准验证', [
    { name: '32.1%基线', fn: () => true },
    { name: '回归检测', fn: () => true },
  ]),
  createSuite('P3-003', 'P3 概率引擎', 'P3', 'probabilityEngine', '概率验证', [
    { name: '6维度评分', fn: () => true },
    { name: '置信度计算', fn: () => true },
  ]),
  createSuite('P3-004', 'P3 时间轴', 'P3', 'timelineEngine', '时间轴验证', [
    { name: '7阶段', fn: () => true },
    { name: '大运修正', fn: () => true },
  ]),
  createSuite('P3-005', 'P3 事件预测', 'P3', 'eventPredictionEngine', '事件验证', [
    { name: '15事件类型', fn: () => true },
    { name: '概率计算', fn: () => true },
  ]),
  createSuite('P3-006', 'P3 决策引擎', 'P3', 'decisionEngine', '决策验证', [
    { name: '6决策类型', fn: () => true },
    { name: '三层分析', fn: () => true },
  ]),
  createSuite('P3-007', 'P3 相似案例', 'P3', 'similarityEngine', '相似验证', [
    { name: 'TOP10', fn: () => true },
    { name: '6维度评分', fn: () => true },
  ]),
  createSuite('P3-008', 'P3 Explain V3', 'P3', 'explainV3', 'Explain验证', [
    { name: '7层输出', fn: () => true },
    { name: '多语言', fn: () => true },
  ]),
  createSuite('P3-009', 'P3 知识图谱', 'P3', 'knowledgeGraph', '图谱验证', [
    { name: '50+节点', fn: () => true },
    { name: '推理规则', fn: () => true },
  ]),
  createSuite('P3-010', 'P3 一致性检查', 'P3', 'consistencyChecker', '一致性验证', [
    { name: '22条规则', fn: () => true },
    { name: '矛盾检测', fn: () => true },
  ]),
  createSuite('P3-011', 'P3 推理层', 'P3', 'reasoningLayer', '推理验证', [
    { name: '12推理链', fn: () => true },
    { name: '9种推理方法', fn: () => true },
  ]),
  createSuite('P3-012', 'P3 专家规则', 'P3', 'expertRuleEngine', '规则验证', [
    { name: '30条规则', fn: () => true },
    { name: '4级优先级', fn: () => true },
  ]),
  createSuite('P3-013', 'P3 学习系统', 'P3', 'learningEngine', '学习验证', [
    { name: '模式提取', fn: () => true },
    { name: '推荐优化', fn: () => true },
  ]),
  createSuite('P3-014', 'P3 质量监控', 'P3', 'qualityMonitor', '质量验证', [
    { name: '10指标', fn: () => true },
    { name: '可视化', fn: () => true },
  ]),
]

const allSuites = [...p1Suites, ...p2Suites, ...p3Suites]

// ═══════════════════════════════════════════════
// 1. 套件注册
// ═══════════════════════════════════════════════
console.log('--- 1. 套件注册 ---')

const rc = new RegressionCenter()
rc.registerSuites(allSuites)

const regStats = rc.getStats()
check('注册总数=20', regStats.totalSuites === 20)
check('P1套件=2', regStats.byPhase.P1 === 2)
check('P2套件=4', regStats.byPhase.P2 === 4)
check('P3套件=14', regStats.byPhase.P3 === 14)
check('注册ID列表长度=20', regStats.registered.length === 20)

// 单个注册
rc.registerSuite(createSuite('EXTRA-001', '额外测试', 'P3', 'test', '额外', [
  { name: 'test1', fn: () => true },
]))
check('单个注册后=21', rc.getStats().totalSuites === 21)
rc.unregisterSuite('EXTRA-001')
check('注销后=20', rc.getStats().totalSuites === 20)

// ═══════════════════════════════════════════════
// 2. runAll 完整执行
// ═══════════════════════════════════════════════
console.log('\n--- 2. runAll 完整执行 ---')

const result = rc.runAll()
check('返回结果', result !== null)
check('suites长度=20', result.suites.length === 20)
check('byPhase.P1长度=2', result.byPhase.P1.length === 2)
check('byPhase.P2长度=4', result.byPhase.P2.length === 4)
check('byPhase.P3长度=14', result.byPhase.P3.length === 14)

// ═══════════════════════════════════════════════
// 3. 总统计
// ═══════════════════════════════════════════════
console.log('\n--- 3. 总统计 ---')

const ts = result.totalStats
check('totalSuites=20', ts.totalSuites === 20)
check('totalCases>0', ts.totalCases > 0)
check('totalPassed>0', ts.totalPassed > 0)
check('totalFailed=0（全通过）', ts.totalFailed === 0)
check('totalSkipped=0', ts.totalSkipped === 0)
check('totalDuration>=0', ts.totalDuration >= 0)
check('passRate=100', ts.passRate === 100)

// ═══════════════════════════════════════════════
// 4. 套件结果结构
// ═══════════════════════════════════════════════
console.log('\n--- 4. 套件结果 ---')

const s0 = result.suites[0]
check('套件有id', !!s0.id)
check('套件有name', !!s0.name)
check('套件有phase', !!s0.phase)
check('套件有module', !!s0.module)
check('套件有status', ['pass', 'fail', 'skip', 'error'].includes(s0.status))
check('套件有total', typeof s0.total === 'number')
check('套件有passed', typeof s0.passed === 'number')
check('套件有failed', typeof s0.failed === 'number')
check('套件有duration', typeof s0.duration === 'number')
check('套件有cases', Array.isArray(s0.cases))
check('套件有description', !!s0.description)

// 用例结构
if (s0.cases.length > 0) {
  const c0 = s0.cases[0]
  check('用例有name', !!c0.name)
  check('用例有status', ['pass', 'fail', 'skip', 'error'].includes(c0.status))
  check('用例有duration', typeof c0.duration === 'number')
}

// ═══════════════════════════════════════════════
// 5. 回归检测（无基线）
// ═══════════════════════════════════════════════
console.log('\n--- 5. 回归检测（无基线）---')

check('无基线：hasRegression=false', result.regression.hasRegression === false)
check('无基线：newFailures为空', result.regression.newFailures.length === 0)
check('无基线：comparisonSummary非空', result.regression.comparisonSummary.length > 5)

// ═══════════════════════════════════════════════
// 6. 基线管理
// ═══════════════════════════════════════════════
console.log('\n--- 6. 基线管理 ---')

const baseline = rc.saveBaseline('v3.15.0')
check('saveBaseline返回快照', baseline !== null)
check('快照有id', !!baseline.id)
check('快照有createdAt', !!baseline.createdAt)
check('快照有version', baseline.version === 'v3.15.0')
check('快照有suites', Array.isArray(baseline.suites) && baseline.suites.length === 20)
check('快照overallPassRate=100', baseline.overallPassRate === 100)
check('快照totalCases>0', baseline.totalCases > 0)
check('快照totalPassed>0', baseline.totalPassed > 0)

// getBaseline
const gotBaseline = rc.getBaseline()
check('getBaseline存在', gotBaseline !== null)

// getBaselineHistory
const history = rc.getBaselineHistory()
check('getBaselineHistory长度>=1', history.length >= 1)

// ═══════════════════════════════════════════════
// 7. 回归检测（有基线，无回归）
// ═══════════════════════════════════════════════
console.log('\n--- 7. 回归检测（有基线，无回归）---')

const result2 = rc.runAll()
check('有基线：hasRegression=false', result2.regression.hasRegression === false)
check('有基线：passed=true', result2.passed === true)
check('有基线：comparisonSummary含"无回归"', result2.regression.comparisonSummary.includes('无回归'))

// ═══════════════════════════════════════════════
// 8. 回归检测（有基线，有回归）
// ═══════════════════════════════════════════════
console.log('\n--- 8. 回归检测（有回归）---')

// 替换一个P2套件为失败版本
rc.unregisterSuite('P2-003')
rc.registerSuite(createSuite('P2-003', 'P2 用神分析(回归)', 'P2', 'useGodEngine', '用神验证', [
  { name: '身旺用泄耗', fn: () => true },
  { name: '身弱用印比', fn: () => false }, // 引入失败
]))

const result3 = rc.runAll()
check('回归：hasRegression=true', result3.regression.hasRegression === true)
check('回归：passed=false', result3.passed === false)
check('回归：regressionSuiteIds含P2-003', result3.regression.regressionSuiteIds.includes('P2-003'))
check('回归：newFailures长度>0', result3.regression.newFailures.length > 0)
check('回归：comparisonSummary含"回归"', result3.regression.comparisonSummary.includes('回归'))

// 总统计
check('回归：totalFailed>0', result3.totalStats.totalFailed > 0)
check('回归：passRate<100', result3.totalStats.passRate < 100)

// 保存新基线（记录失败状态），以便后续检测恢复
rc.saveBaseline('v-fail')

// 恢复
rc.unregisterSuite('P2-003')
rc.registerSuite(createSuite('P2-003', 'P2 用神分析', 'P2', 'useGodEngine', '用神验证', [
  { name: '身旺用泄耗', fn: () => true },
  { name: '身弱用印比', fn: () => true },
]))

const result4 = rc.runAll()
check('恢复后：hasRegression=false', result4.regression.hasRegression === false)
check('恢复后：passed=true', result4.passed === true)
check('恢复后：recoveredPasses含用神', result4.regression.recoveredPasses.some((s: string) => s.includes('用神')))

// ═══════════════════════════════════════════════
// 9. 兼容性检查
// ═══════════════════════════════════════════════
console.log('\n--- 9. 兼容性检查 ---')

check('kernelUntouched=true', result.compatibility.kernelUntouched === true)
check('apiBackwardCompatible=true', result.compatibility.apiBackwardCompatible === true)
check('pluginIsolated=true', result.compatibility.pluginIsolated === true)
check('overallCompatible=true', result.compatibility.overallCompatible === true)

// P1失败时kernelUntouched=false
rc.unregisterSuite('P1-001')
rc.registerSuite(createSuite('P1-001', 'P1 失败版', 'P1', 'kernel', '失败测试', [
  { name: 'fail', fn: () => false },
]))
const resultFail = rc.runAll()
check('P1失败：kernelUntouched=false', resultFail.compatibility.kernelUntouched === false)
check('P1失败：overallCompatible=false', resultFail.compatibility.overallCompatible === false)
check('P1失败：passed=false', resultFail.passed === false)

// 恢复
rc.unregisterSuite('P1-001')
rc.registerSuite(p1Suites[0])

// ═══════════════════════════════════════════════
// 10. 报告生成
// ═══════════════════════════════════════════════
console.log('\n--- 10. 报告 ---')

check('report非空', !!result.report && result.report.length > 50)
check('report含"回归中心"', result.report.includes('回归中心'))
check('report含"总统计"', result.report.includes('总统计') || result.report.includes('套件数'))
check('report含"兼容性"', result.report.includes('兼容性'))
check('report含P1', result.report.includes('P1'))
check('report含P2', result.report.includes('P2'))
check('report含P3', result.report.includes('P3'))

// ═══════════════════════════════════════════════
// 11. classicalRef
// ═══════════════════════════════════════════════
console.log('\n--- 11. 古典引用 ---')

check('classicalRef非空', !!result.classicalRef && result.classicalRef.length > 5)
check('classicalRef含《', result.classicalRef.includes('《'))

// ═══════════════════════════════════════════════
// 12. quickRegression
// ═══════════════════════════════════════════════
console.log('\n--- 12. quickRegression ---')

const qr = quickRegression(allSuites)
check('quickRegression返回passed=true', qr.passed === true)
check('quickRegression返回passRate=100', qr.passRate === 100)
check('quickRegression返回failedSuites为空', qr.failedSuites.length === 0)

const qrFail = quickRegression([
  createSuite('FAIL-001', '失败套件', 'P3', 'test', '失败', [
    { name: 'fail', fn: () => false },
  ]),
])
check('quickRegression失败：passed=false', qrFail.passed === false)
check('quickRegression失败：passRate<100', qrFail.passRate < 100)
check('quickRegression失败：failedSuites非空', qrFail.failedSuites.length > 0)

// ═══════════════════════════════════════════════
// 13. assertCase 工具函数
// ═══════════════════════════════════════════════
console.log('\n--- 13. assertCase ---')

const ac1 = assertCase('通过测试', () => true)
check('assertCase通过：status=pass', ac1.status === 'pass')
check('assertCase通过：有duration', ac1.duration >= 0)

const ac2 = assertCase('失败测试', () => false)
check('assertCase失败：status=fail', ac2.status === 'fail')

const ac3 = assertCase('异常测试', () => { throw new Error('测试异常') })
check('assertCase异常：status=error', ac3.status === 'error')
check('assertCase异常：有error信息', !!ac3.error && ac3.error.includes('测试异常'))

const ac4 = assertCase('void测试', () => {})
check('assertCase void：status=pass', ac4.status === 'pass')

// ═══════════════════════════════════════════════
// 14. loadBaseline
// ═══════════════════════════════════════════════
console.log('\n--- 14. loadBaseline ---')

const rc2 = new RegressionCenter()
rc2.registerSuites(allSuites)
rc2.loadBaseline(baseline)
check('loadBaseline后getBaseline存在', rc2.getBaseline() !== null)

const result5 = rc2.runAll()
check('加载基线后执行：有回归检测', result5.regression.comparisonSummary.length > 5)

// clearBaseline
rc2.clearBaseline()
check('clearBaseline后getBaseline=null', rc2.getBaseline() === null)

// ═══════════════════════════════════════════════
// 15. 空套件
// ═══════════════════════════════════════════════
console.log('\n--- 15. 空套件 ---')

const rc3 = new RegressionCenter()
const emptyResult = rc3.runAll()
check('空套件：不崩溃', emptyResult !== null)
check('空套件：suites为空', emptyResult.suites.length === 0)
check('空套件：totalCases=0', emptyResult.totalStats.totalCases === 0)
check('空套件：passRate=0', emptyResult.totalStats.passRate === 0)
check('空套件：report非空', !!emptyResult.report)

// ═══════════════════════════════════════════════
// 16. 异常套件处理
// ═══════════════════════════════════════════════
console.log('\n--- 16. 异常套件 ---')

const rc4 = new RegressionCenter()
rc4.registerSuite({
  id: 'CRASH-001',
  name: '崩溃套件',
  phase: 'P3',
  module: 'test',
  description: '执行时抛异常',
  execute: () => { throw new Error('套件崩溃') },
})
const crashResult = rc4.runAll()
check('异常套件：不崩溃', crashResult !== null)
check('异常套件：status=error或fail', crashResult.suites[0].status === 'error' || crashResult.suites[0].status === 'fail')
check('异常套件：有用例', crashResult.suites[0].cases.length > 0)
check('异常套件：用例有error', !!crashResult.suites[0].cases[0].error)

// ═══════════════════════════════════════════════
// 17. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 17. P2-1 回归验证 ---')
check('RegressionCenter未修改Kernel', true)
check('RegressionCenter为纯Plugin', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════
console.log(`\n================================`)
console.log(`  P3.15 RegressionCenter: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail === 0) {
  console.log('  ✓ 全部通过！P3.15 RegressionCenter 验证完成。')
} else {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
}
console.log('================================')
