/**
 * V5.0 RC Phase 2: 运行 Performance Benchmark + Project Dashboard
 * 输出 JSON 供验收报告使用
 */

import { runPerformanceBenchmark } from '../lib/bazi/pro/performanceBenchmarkEngine'
import { generateProjectDashboard } from '../lib/bazi/pro/projectDashboardEngine'

async function main() {
  console.log('=== Running Performance Benchmark ===')
  const perfReport = runPerformanceBenchmark({ includeBatch10000: false, concurrencyLevels: [1, 5, 10] })
  console.log('Performance Benchmark Version:', perfReport.version)
  console.log('Environment:', JSON.stringify(perfReport.environment, null, 2))
  console.log('Single totalTimeMs:', perfReport.singleBenchmark.totalTimeMs)
  console.log('Batch 100 totalTimeMs:', perfReport.batch100Benchmark.totalTimeMs)
  console.log('Batch 1000 totalTimeMs:', perfReport.batch1000Benchmark.totalTimeMs)
  console.log('Batch 1000 throughput:', perfReport.batch1000Benchmark.throughputPerSecond)
  console.log('Summary Grade:', perfReport.summary.grade)
  console.log('Summary avgPipelineTimeMs:', perfReport.summary.avgPipelineTimeMs)

  console.log('\n=== Running Project Dashboard ===')
  const dashboard = generateProjectDashboard()
  console.log('Dashboard Version:', dashboard.version)
  console.log('Overall Status:', dashboard.overallStatus)
  console.log('Overall Score:', dashboard.overallScore)
  dashboard.sections.forEach(s => {
    console.log(`\n[${s.title}]`)
    s.metrics.forEach(m => console.log(`  ${m.label}: ${m.value} (${m.status})`))
  })

  const fs = await import('fs')
  const path = await import('path')
  const outDir = path.resolve(process.cwd(), 'benchmark-output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const output = {
    generatedAt: Date.now(),
    perfReport,
    dashboard,
  }

  fs.writeFileSync(path.join(outDir, 'phase2-benchmark-data.json'), JSON.stringify(output, null, 2))
  console.log('\nResults saved to benchmark-output/phase2-benchmark-data.json')
}

main().catch(console.error)
