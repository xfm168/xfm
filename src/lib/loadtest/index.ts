/**
 * 压力测试工具
 * 使用 fetch 并发请求 + AbortController 超时控制
 */

export interface LoadTestConfig {
  concurrentUsers: number
  durationSeconds: number
  rampUpSeconds: number
  targetUrl: string
  method?: string
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
}

export interface LoadTestResult {
  totalRequests: number
  successCount: number
  errorCount: number
  avgLatency: number
  p50: number
  p95: number
  p99: number
  minLatency: number
  maxLatency: number
  rps: number
  errors: Array<{ message: string; count: number }>
}

interface RequestRecord {
  latency: number
  success: boolean
  error?: string
}

export function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  return new Promise(function(resolve) {
    var records: RequestRecord[] = []
    var startTime = Date.now()
    var endTime = startTime + config.durationSeconds * 1000
    var rampUpEnd = startTime + (config.rampUpSeconds || 0) * 1000
    var activeWorkers = 0
    var completedWorkers = 0
    var totalWorkers = config.concurrentUsers
    var timeoutMs = config.timeoutMs || 5000
    var method = config.method || 'GET'
    var headers = config.headers || {}
    var body = config.body

    function delay(ms: number): Promise<void> {
      return new Promise(function(r) { setTimeout(r, ms) })
    }

    function makeRequest(): Promise<RequestRecord> {
      var reqStart = Date.now()
      var controller = new AbortController()
      var timer = setTimeout(function() {
        controller.abort()
      }, timeoutMs)

      var fetchOpts: RequestInit = {
        method: method,
        signal: controller.signal,
        headers: headers
      }
      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        fetchOpts.body = body
      }

      return fetch(config.targetUrl, fetchOpts)
        .then(function(res) {
          clearTimeout(timer)
          var latency = Date.now() - reqStart
          return {
            latency: latency,
            success: res.status >= 200 && res.status < 300
          }
        })
        .catch(function(err) {
          clearTimeout(timer)
          var latency = Date.now() - reqStart
          return {
            latency: latency,
            success: false,
            error: err.name === 'AbortError' ? 'Timeout' : (err.message || 'Unknown')
          }
        })
    }

    async function worker() {
      var workerStart = Date.now()
      var rampDelay = 0
      if (config.rampUpSeconds > 0 && totalWorkers > 0) {
        var rampProgress = activeWorkers / totalWorkers
        rampDelay = rampProgress * config.rampUpSeconds * 1000
        activeWorkers += 1
      } else {
        activeWorkers += 1
      }

      await delay(rampDelay)

      while (Date.now() < endTime) {
        var record = await makeRequest()
        records.push(record)
      }

      completedWorkers += 1
      if (completedWorkers >= totalWorkers) {
        finish()
      }
    }

    function finish() {
      var totalRequests = records.length
      var successCount = 0
      var errorCount = 0
      var latencies: number[] = []
      var minLatency = Infinity
      var maxLatency = 0
      var errorMap: Record<string, number> = {}

      for (var i = 0; i < records.length; i++) {
        var r = records[i]
        if (r.success) {
          successCount += 1
        } else {
          errorCount += 1
          var errKey = r.error || 'Unknown'
          errorMap[errKey] = (errorMap[errKey] || 0) + 1
        }
        latencies.push(r.latency)
        if (r.latency < minLatency) minLatency = r.latency
        if (r.latency > maxLatency) maxLatency = r.latency
      }

      latencies.sort(function(a, b) { return a - b })

      var avgLatency = 0
      var p50 = 0
      var p95 = 0
      var p99 = 0

      if (latencies.length > 0) {
        var sum = 0
        for (var j = 0; j < latencies.length; j++) {
          sum += latencies[j]
        }
        avgLatency = Math.round(sum / latencies.length)
        p50 = latencies[Math.floor(latencies.length * 0.5)] || 0
        p95 = latencies[Math.floor(latencies.length * 0.95)] || 0
        p99 = latencies[Math.floor(latencies.length * 0.99)] || 0
        if (minLatency === Infinity) minLatency = 0
      } else {
        minLatency = 0
      }

      var durationSec = (Date.now() - startTime) / 1000
      var rps = durationSec > 0 ? Math.round(totalRequests / durationSec * 10) / 10 : 0

      var errors: Array<{ message: string; count: number }> = []
      var errKeys = Object.keys(errorMap)
      for (var k = 0; k < errKeys.length; k++) {
        errors.push({ message: errKeys[k], count: errorMap[errKeys[k]] })
      }

      resolve({
        totalRequests: totalRequests,
        successCount: successCount,
        errorCount: errorCount,
        avgLatency: avgLatency,
        p50: p50,
        p95: p95,
        p99: p99,
        minLatency: minLatency,
        maxLatency: maxLatency,
        rps: rps,
        errors: errors
      })
    }

    for (var w = 0; w < totalWorkers; w++) {
      worker()
    }
  })
}
