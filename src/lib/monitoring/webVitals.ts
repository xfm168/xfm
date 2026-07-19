/**
 * Web Vitals 采集 + 自动上报
 * 使用 PerformanceObserver API 采集 Core Web Vitals
 */

var MONITOR_API = '/api/monitoring/vitals'
var ERROR_API = '/api/monitoring/error'
var reportQueue: Array<Record<string, unknown>> = []
var REPORT_INTERVAL = 5000 // 5 秒批量上报
var reportTimer: ReturnType<typeof setInterval> | null = null
var reportBuffer: Record<string, number> = {}

function getRating(name: string, value: number): string {
  var thresholds: Record<string, Array<number>> = {
    'TTFB': [800, 1800],
    'FCP': [1800, 3000],
    'LCP': [2500, 4000],
    'CLS': [0.1, 0.25],
    'INP': [200, 500],
    'TBT': [200, 600],
    'FID': [100, 300],
  }
  var t = thresholds[name]
  if (!t) return 'unknown'
  if (value <= t[0]) return 'good'
  if (value <= t[1]) return 'needs-improvement'
  return 'poor'
}

function queueReport(data: Record<string, unknown>): void {
  reportQueue.push(data)
  if (!reportTimer) {
    reportTimer = setInterval(flushReports, REPORT_INTERVAL)
  }
}

async function flushReports(): void {
  if (reportQueue.length === 0) return
  var reports = reportQueue.splice(0, reportQueue.length)
  for (var i = 0; i < reports.length; i++) {
    try {
      var apiUrl = reports[i]._api === 'error' ? ERROR_API : MONITOR_API
      // eslint-disable-next-line no-undef
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('sb-xuanfengmen-auth-token') || '') },
        body: JSON.stringify(reports[i]),
        keepalive: true,
      })
    } catch (e) {
      // 静默失败
    }
  }
  if (reportQueue.length === 0 && reportTimer) {
    clearInterval(reportTimer)
    reportTimer = null
  }
}

function observeLCP(): void {
  if (!('PerformanceObserver' in window)) return
  try {
    var obs = new PerformanceObserver(function(list) {
      var entries = list.getEntries()
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i] as PerformanceEntry
        queueReport({
          name: 'LCP',
          value: Math.round(entry.startTime),
          unit: 'ms',
          path: window.location.pathname,
          rating: getRating('LCP', entry.startTime),
        })
      }
    })
    obs.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (e) {}
}

function observeFID(): void {
  if (!('PerformanceObserver' in window)) return
  try {
    var obs = new PerformanceObserver(function(list) {
      var entries = list.getEntries()
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i] as PerformanceEntry
        queueReport({
          name: 'FID',
          value: Math.round(entry.startTime),
          unit: 'ms',
          path: window.location.pathname,
          rating: getRating('FID', entry.startTime),
        })
      }
    })
    obs.observe({ type: 'first-input', buffered: true })
  } catch (e) {}
}

function observeCLS(): void {
  if (!('PerformanceObserver' in window)) return
  try {
    var clsValue = 0
    var obs = new PerformanceObserver(function(list) {
      var entries = list.getEntries()
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i] as any
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
    })
    obs.observe({ type: 'layout-shift', buffered: true })
    // 在 pagehide 时上报最终值
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') {
        queueReport({
          name: 'CLS',
          value: Math.round(clsValue * 1000) / 1000,
          unit: '',
          path: window.location.pathname,
          rating: getRating('CLS', clsValue),
        })
      }
    })
  } catch (e) {}
}

function observeTTFB(): void {
  try {
    var nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (nav) {
      var ttfb = nav.responseStart - nav.requestStart
      queueReport({
        name: 'TTFB',
        value: Math.round(ttfb),
        unit: 'ms',
        path: window.location.pathname,
        rating: getRating('TTFB', ttfb),
      })
    }
  } catch (e) {}
}

function observeINP(): void {
  if (!('PerformanceObserver' in window)) return
  try {
    var maxDuration = 0
    var obs = new PerformanceObserver(function(list) {
      var entries = list.getEntries()
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i] as PerformanceEntry
        if (entry.duration > maxDuration) {
          maxDuration = entry.duration
        }
      }
    })
    obs.observe({ type: 'event', buffered: true })
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden' && maxDuration > 0) {
        queueReport({
          name: 'INP',
          value: Math.round(maxDuration),
          unit: 'ms',
          path: window.location.pathname,
          rating: getRating('INP', maxDuration),
        })
      }
    })
  } catch (e) {}
}

/** 捕获全局 JS 错误 */
function captureJsErrors(): void {
  window.addEventListener('error', function(event) {
    queueReport({
      _api: 'error',
      message: event.message || 'Unknown error',
      filename: event.filename || '',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
      stack: event.error && event.error.stack ? event.error.stack : '',
      path: window.location.pathname,
    })
  })

  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason
    queueReport({
      _api: 'error',
      message: reason instanceof Error ? reason.message : String(reason),
      filename: '',
      lineno: 0,
      colno: 0,
      stack: reason instanceof Error ? reason.stack || '' : '',
      path: window.location.pathname,
    })
  })
}

/** 初始化 Web Vitals 采集 */
export function initWebVitals(): void {
  try {
    observeTTFB()
    observeLCP()
    observeFID()
    observeCLS()
    observeINP()
    captureJsErrors()
  } catch (e) {}
}