/**
 * P3.2 BenchmarkEngine 首次运行
 *
 * 对CaseLibrary中110个案例运行完整Benchmark，
 * 输出各维度准确率、按可信度分层、错误案例、回基线快照。
 */
import { BenchmarkEngine } from './benchmarkEngine'
import { CASE_DATA } from './caseData'

console.log('╔════════════════════════════════════════════════════════════╗')
console.log('║        XuanFeng Core — P3.2 Benchmark 首次运行          ║')
console.log('╚════════════════════════════════════════════════════════════╝\n')

const startTime = Date.now()

const engine = new BenchmarkEngine({
  version: 'v3.0.0',
  threshold: 25,     // 初次运行，建立baseline
  saveSnapshot: true,
})

console.log(`案例总数: ${CASE_DATA.length}`)
console.log('开始运行Benchmark...\n')

const report = engine.run(CASE_DATA)

const elapsed = Date.now() - startTime

// 输出报告
console.log(engine.formatReport(report))
console.log(`\nBenchmark 总耗时: ${elapsed}ms (${(elapsed / CASE_DATA.length).toFixed(1)}ms/例)`)

// 保存快照
const snapshotPath = engine.saveSnapshot(report)
console.log(`快照已保存: ${snapshotPath}`)

// 退出码
if (report.passed) {
  console.log('\n>>> BENCHMARK PASSED <<<')
  process.exit(0)
} else {
  console.log('\n>>> BENCHMARK FAILED <<<')
  process.exit(1)
}
