/**
 * P3.2 Benchmark 回归对比测试
 * 加载baseline快照，运行当前版本，对比差异。
 */
import * as fs from 'fs'
import * as path from 'path'
import { BenchmarkEngine } from './benchmarkEngine'
import { CASE_DATA } from './caseData'

const SNAPSHOT_DIR = '/data/user/work/benchmark-snapshots'

// 查找最新快照
const files = fs.readdirSync(SNAPSHOT_DIR)
  .filter(f => f.startsWith('snapshot-v') && f.endsWith('.json'))
  .sort()
  .reverse()

if (files.length === 0) {
  console.error('未找到快照文件，请先运行 runner-p32-benchmark.ts')
  process.exit(1)
}

const latestSnapshot = path.join(SNAPSHOT_DIR, files[0])
console.log(`加载基线快照: ${files[0]}`)

const engine = new BenchmarkEngine({
  version: 'v3.0.0',
  threshold: 25,
})

// 加载基线
const baseline = engine.loadSnapshot(latestSnapshot)
if (!baseline) {
  console.error('快照加载失败')
  process.exit(1)
}

console.log(`基线: ${baseline.totalCases}例, 准确率 ${baseline.overallAccuracy}%\n`)

// 运行当前版本
const current = engine.run(CASE_DATA)

// 输出报告
console.log(engine.formatReport(current))

// 对比
console.log('━'.repeat(50))
console.log('  新旧版本对比')
console.log('━'.repeat(50))
const comparison = engine.compareWithPrevious(current, baseline)
console.log(comparison.summary)

if (comparison.regressions.length > 0) {
  console.log('\n⚠ 回归警告:')
  for (const r of comparison.regressions) {
    console.log(`  ${r.dimension}: -${r.drop.toFixed(1)}%`)
  }
}

if (comparison.improvements.length > 0) {
  console.log('\n✓ 提升:')
  for (const i of comparison.improvements) {
    console.log(`  ${i.dimension}: +${i.improvement.toFixed(1)}%`)
  }
}

// 退出
if (comparison.regressions.length > 0) {
  console.log('\n>>> REGRESSION DETECTED <<<')
  process.exit(1)
} else {
  console.log('\n>>> NO REGRESSION <<<')
  process.exit(0)
}
