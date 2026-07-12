/**
 * P6-C Pipeline Benchmark — 性能基准测试
 *
 * 测量 Pipeline 15 步骤的执行时间、调用次数。
 * 不修改任何命理算法，仅测量现有性能。
 */

import { XuanFengPipelineEngine } from './pipelineEngine'

interface StepBenchmark {
  engine: string
  avgMs: number
  minMs: number
  maxMs: number
  calls: number
  totalMs: number
}

const TEST_INPUT = {
  birthday: '1990-01-15',
  birthTime: '10:00',
  gender: 'male' as const,
  locale: 'zh-CN',
}

const WARMUP_ROUNDS = 1
const MEASURED_ROUNDS = 4

export async function runPipelineBenchmark(): Promise<{
  totalTime: number
  steps: StepBenchmark[]
  memoryEstimate: string
}> {
  var allSteps: Map<string, number[]> = new Map()

  // Warmup — 预热一轮，消除冷启动影响
  var warmupEngine = new XuanFengPipelineEngine()
  await warmupEngine.runMasterAnalysis(TEST_INPUT)

  // Measured runs — 正式测量多轮
  for (var i = 0; i < MEASURED_ROUNDS; i++) {
    var engine = new XuanFengPipelineEngine()
    var start = Date.now()
    var result = await engine.runMasterAnalysis(TEST_INPUT)
    var elapsed = Date.now() - start

    var perf = engine.getPerformanceReport()
    var records = (perf && perf.pipelineRecords) ? perf.pipelineRecords : (perf && perf.records ? perf.records : [])
    if (Array.isArray(records)) {
      for (var j = 0; j < records.length; j++) {
        var r = records[j]
        if (!allSteps.has(r.engine)) {
          allSteps.set(r.engine, [])
        }
        allSteps.get(r.engine)!.push(r.durationMs)
      }
    }
  }

  // Aggregate — 汇总统计
  var steps: StepBenchmark[] = []
  var totalTime = 0
  allSteps.forEach(function(times, engine) {
    var total = 0
    var min = Infinity
    var max = 0
    for (var k = 0; k < times.length; k++) {
      total += times[k]
      if (times[k] < min) min = times[k]
      if (times[k] > max) max = times[k]
    }
    var avg = total / times.length
    totalTime += avg
    steps.push({
      engine: engine,
      avgMs: Math.round(avg * 100) / 100,
      minMs: min,
      maxMs: max,
      calls: times.length,
      totalMs: Math.round(total * 100) / 100,
    })
  })

  // Sort by avgMs descending — 按平均耗时降序排列
  steps.sort(function(a, b) { return b.avgMs - a.avgMs })

  var memUsed = process.memoryUsage ? process.memoryUsage() : null
  var memoryEstimate = memUsed
    ? (memUsed.heapUsed / 1024 / 1024).toFixed(1) + ' MB'
    : 'N/A'

  return { totalTime: Math.round(totalTime * 100) / 100, steps, memoryEstimate }
}

// CLI entry — 命令行入口
if (typeof require !== 'undefined' && require.main === module) {
  runPipelineBenchmark().then(function(result) {
    console.log('\n' + '='.repeat(60))
    console.log('  P6-C Pipeline Benchmark')
    console.log('='.repeat(60))
    console.log('')
    console.log('Step                        Avg(ms)   Min(ms)   Max(ms)   Calls')
    console.log('-'.repeat(65))
    for (var i = 0; i < result.steps.length; i++) {
      var s = result.steps[i]
      var name = (s.engine + '                         ').substring(0, 27)
      var avgStr = String(s.avgMs)
      var minStr = String(s.minMs)
      var maxStr = String(s.maxMs)
      var callsStr = String(s.calls)
      var avgPad = avgStr.length < 9 ? avgStr + ' '.repeat(9 - avgStr.length) : avgStr.substring(0, 9)
      var minPad = minStr.length < 10 ? minStr + ' '.repeat(10 - minStr.length) : minStr.substring(0, 10)
      var maxPad = maxStr.length < 10 ? maxStr + ' '.repeat(10 - maxStr.length) : maxStr.substring(0, 10)
      var callsPad = callsStr.length < 8 ? callsStr + ' '.repeat(8 - callsStr.length) : callsStr.substring(0, 8)
      console.log(
        name + avgPad + minPad + maxPad + callsPad
      )
    }
    console.log('-'.repeat(65))
    console.log('Total: ' + result.totalTime + ' ms | Memory: ' + result.memoryEstimate)
  })
}
