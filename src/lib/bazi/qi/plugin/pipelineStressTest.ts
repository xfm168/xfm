/**
 * P6-C Pipeline Stress Test — 压力基准测试
 *
 * 运行 100/500/1000/5000 次命盘推演，
 * 统计平均/P50/P95/P99 延迟、TPS、内存。
 * 不修改任何命理算法，仅测量现有性能。
 */

import { XuanFengPipelineEngine } from './pipelineEngine'

// ═══════════════════════════════════════════════════════════
// 测试输入池 — 多样化八字避免缓存命中
// ═══════════════════════════════════════════════════════════

var INPUT_POOL = [
  { birthday: '1990-01-15', birthTime: '10:00', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '1985-06-20', birthTime: '14:30', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '1978-03-08', birthTime: '02:15', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '1995-11-22', birthTime: '20:45', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '2000-07-04', birthTime: '08:00', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '1988-12-30', birthTime: '23:30', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '1972-09-18', birthTime: '11:20', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '1993-04-05', birthTime: '16:10', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '1965-02-14', birthTime: '06:00', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '2001-08-28', birthTime: '19:55', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '1980-05-01', birthTime: '13:40', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '1997-10-10', birthTime: '04:30', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '1955-01-25', birthTime: '22:00', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '2005-03-15', birthTime: '07:15', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '1983-07-07', birthTime: '15:45', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '1991-12-12', birthTime: '01:00', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '1976-04-20', birthTime: '10:30', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '1999-09-09', birthTime: '18:20', gender: 'female' as const, locale: 'zh-CN' },
  { birthday: '1968-11-03', birthTime: '05:50', gender: 'male' as const, locale: 'zh-CN' },
  { birthday: '2010-06-18', birthTime: '12:00', gender: 'female' as const, locale: 'zh-CN' },
]

function getInput(index: number) {
  return INPUT_POOL[index % INPUT_POOL.length]
}

// ═══════════════════════════════════════════════════════════
// 百分位计算
// ═══════════════════════════════════════════════════════════

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  var idx = (p / 100) * (sorted.length - 1)
  var low = Math.floor(idx)
  var high = Math.ceil(idx)
  if (low === high) return sorted[low]
  return sorted[low] + (sorted[high] - sorted[low]) * (idx - low)
}

// ═══════════════════════════════════════════════════════════
// 单轮测试
// ═══════════════════════════════════════════════════════════

interface RoundResult {
  count: number
  totalTimeMs: number
  avgMs: number
  p50Ms: number
  p95Ms: number
  p99Ms: number
  minMs: number
  maxMs: number
  tps: number
  memoryBeforeMB: number
  memoryAfterMB: number
  memoryDeltaMB: number
  errors: number
  latencies: number[]
}

async function runRound(count: number): Promise<RoundResult> {
  var latencies: number[] = []
  var errors = 0

  // 强制 GC（如果可用）
  if (typeof global.gc === 'function') {
    global.gc()
  }

  var memBefore = process.memoryUsage ? process.memoryUsage() : null
  var memBeforeMB = memBefore ? Math.round(memBefore.heapUsed / 1024 / 1024) : 0

  var startTotal = Date.now()

  for (var i = 0; i < count; i++) {
    try {
      var input = getInput(i)
      var engine = new XuanFengPipelineEngine()
      var start = Date.now()
      await engine.runMasterAnalysis(input)
      var elapsed = Date.now() - start
      latencies.push(elapsed)
    } catch (e) {
      errors++
    }
  }

  var totalTimeMs = Date.now() - startTotal

  var memAfter = process.memoryUsage ? process.memoryUsage() : null
  var memAfterMB = memAfter ? Math.round(memAfter.heapUsed / 1024 / 1024) : 0

  latencies.sort(function(a, b) { return a - b })

  return {
    count: count,
    totalTimeMs: totalTimeMs,
    avgMs: latencies.length > 0 ? Math.round(latencies.reduce(function(s, v) { return s + v }, 0) / latencies.length * 100) / 100 : 0,
    p50Ms: Math.round(percentile(latencies, 50) * 100) / 100,
    p95Ms: Math.round(percentile(latencies, 95) * 100) / 100,
    p99Ms: Math.round(percentile(latencies, 99) * 100) / 100,
    minMs: latencies.length > 0 ? latencies[0] : 0,
    maxMs: latencies.length > 0 ? latencies[latencies.length - 1] : 0,
    tps: totalTimeMs > 0 ? Math.round(count / (totalTimeMs / 1000) * 100) / 100 : 0,
    memoryBeforeMB: memBeforeMB,
    memoryAfterMB: memAfterMB,
    memoryDeltaMB: memAfterMB - memBeforeMB,
    errors: errors,
    latencies: latencies,
  }
}

// ═══════════════════════════════════════════════════════════
// 完整压力测试
// ═══════════════════════════════════════════════════════════

export interface StressTestResult {
  rounds: RoundResult[]
  summary: {
    bestTPS: number
    worstP99: number
    memoryStable: boolean
    status: string
  }
}

export async function runStressTest(): Promise<StressTestResult> {
  var counts = [100, 500, 1000, 5000]
  var rounds: RoundResult[] = []

  // Warmup — 预热 5 轮
  for (var w = 0; w < 5; w++) {
    var warmInput = getInput(w)
    var warmEngine = new XuanFengPipelineEngine()
    await warmEngine.runMasterAnalysis(warmInput)
  }

  // 强制 GC
  if (typeof global.gc === 'function') {
    global.gc()
  }

  for (var r = 0; r < counts.length; r++) {
    var result = await runRound(counts[r])
    rounds.push(result)
  }

  // Summary
  var bestTPS = 0
  var worstP99 = 0
  for (var s = 0; s < rounds.length; s++) {
    if (rounds[s].tps > bestTPS) bestTPS = rounds[s].tps
    if (rounds[s].p99Ms > worstP99) worstP99 = rounds[s].p99Ms
  }

  // 检查内存稳定性
  var memoryStable = true
  if (rounds.length >= 2) {
    var last = rounds[rounds.length - 1]
    var prev = rounds[rounds.length - 2]
    // 如果 5000 次后内存增长超过 100MB，认为不稳定
    if (last.memoryAfterMB - prev.memoryAfterMB > 100) {
      memoryStable = false
    }
  }

  var status = 'READY FOR RC1'
  if (!memoryStable) status = 'MEMORY WARNING'
  if (worstP99 > 500) status = 'PERFORMANCE WARNING'
  if (rounds.some(function(r) { return r.errors > 0 })) status = 'ERROR DETECTED'

  return {
    rounds: rounds,
    summary: {
      bestTPS: bestTPS,
      worstP99: worstP99,
      memoryStable: memoryStable,
      status: status,
    }
  }
}

// ═══════════════════════════════════════════════════════════
// CLI 输出
// ═══════════════════════════════════════════════════════════

if (typeof require !== 'undefined' && require.main === module) {
  runStressTest().then(function(result) {
    console.log('\n' + '='.repeat(72))
    console.log('  P6-C Pipeline Stress Test')
    console.log('='.repeat(72))
    console.log('')

    for (var i = 0; i < result.rounds.length; i++) {
      var r = result.rounds[i]
      console.log('--- Round: ' + r.count + ' iterations ---')
      console.log('  Total Time:   ' + r.totalTimeMs + ' ms')
      console.log('  Avg Latency:  ' + r.avgMs + ' ms')
      console.log('  P50:          ' + r.p50Ms + ' ms')
      console.log('  P95:          ' + r.p95Ms + ' ms')
      console.log('  P99:          ' + r.p99Ms + ' ms')
      console.log('  Min/Max:      ' + r.minMs + ' / ' + r.maxMs + ' ms')
      console.log('  TPS:          ' + r.tps)
      console.log('  Memory:       ' + r.memoryBeforeMB + ' -> ' + r.memoryAfterMB + ' MB (delta: ' + (r.memoryDeltaMB >= 0 ? '+' : '') + r.memoryDeltaMB + ')')
      console.log('  Errors:       ' + r.errors)
      console.log('')
    }

    console.log('='.repeat(72))
    console.log('  Summary')
    console.log('='.repeat(72))
    console.log('  Best TPS:       ' + result.summary.bestTPS)
    console.log('  Worst P99:     ' + result.summary.worstP99 + ' ms')
    console.log('  Memory Stable:  ' + (result.summary.memoryStable ? 'YES' : 'NO'))
    console.log('  Status:         ' + result.summary.status)
    console.log('')

    // JSON 输出供报告使用
    console.log('---JSON---')
    console.log(JSON.stringify(result, null, 2))
  })
}
