/**
 * RC3-3: 性能 Profiler - 核心性能追踪器
 *
 * 功能：
 * - start/end 标记式计时
 * - measure 同步函数包装计时
 * - asyncMeasure 异步函数包装计时
 * - getStats 统计分析（count / avg / min / max / p50 / p95 / p99）
 * - exportHTML / exportJSON 报告导出
 * - 内存使用通过 performance.memory（Chrome）或估算
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

// ══════════════════════════════════════════════════
//  类型定义
// ══════════════════════════════════════════════════

/** 性能条目接口 */
export interface ProfilerEntry {
  /** 测量名称 */
  name: string
  /** 模块名称 */
  module: string
  /** 开始时间（performance.now() 毫秒） */
  startTime: number
  /** 结束时间 */
  endTime: number
  /** 耗时（毫秒） */
  duration: number
  /** 开始前内存使用（MB，可选） */
  memoryBefore?: number
  /** 结束后内存使用（MB，可选） */
  memoryAfter?: number
  /** 附加元数据 */
  metadata?: Record<string, unknown>
}

/** 性能统计接口 */
export interface ProfilerStats {
  /** 调用次数 */
  count: number
  /** 平均耗时 */
  avg: number
  /** 最小耗时 */
  min: number
  /** 最大耗时 */
  max: number
  /** 中位数 */
  p50: number
  /** 95 百分位 */
  p95: number
  /** 99 百分位 */
  p99: number
}

/** 活跃标记（start 后未 end） */
interface ActiveMark {
  name: string
  module: string
  startTime: number
  memoryBefore: number
  metadata?: Record<string, unknown>
}

// ══════════════════════════════════════════════════
//  PerformanceProfiler 类
// ══════════════════════════════════════════════════

/**
 * 性能分析器
 *
 * @example
 * import { performanceProfiler } from '@/lib/profiler'
 *
 * // 标记式
 * var markId = performanceProfiler.start('排盘', 'BaziEngine')
 * // ... do work ...
 * performanceProfiler.end(markId)
 *
 * // 包装式
 * var result = performanceProfiler.measure('排盘', 'BaziEngine', function() {
 *   return calculateBaZi(input)
 * })
 *
 * // 异步包装
 * var data = await performanceProfiler.asyncMeasure('AI分析', 'AIEngine', function() {
 *   return fetchAIResult(input)
 * })
 */
export class PerformanceProfiler {
  /** 已完成的性能条目 */
  private entries: ProfilerEntry[] = []

  /** 活跃标记映射 */
  private activeMarks: Map<string, ActiveMark> = new Map()

  /** 标记 ID 计数器 */
  private markCounter = 0

  // ─── 标记式计时 ─────────────────────────────────

  /**
   * 开始一个性能标记
   * @param name 测量名称
   * @param module 模块名称
   * @param metadata 附加元数据
   * @returns markId（用于 end() 调用）
   */
  start(name: string, module: string, metadata?: Record<string, unknown>): string {
    var markId = 'mark_' + Date.now() + '_' + (this.markCounter++)

    var mark: ActiveMark = {
      name,
      module,
      startTime: this.now(),
      memoryBefore: this.getMemoryUsage(),
    }

    if (metadata) {
      mark.metadata = metadata
    }

    this.activeMarks.set(markId, mark)
    return markId
  }

  /**
   * 结束一个性能标记，计算耗时并记录条目
   * @param markId start() 返回的标记 ID
   * @returns 耗时（毫秒），如果 markId 无效返回 0
   */
  end(markId: string): number {
    var mark = this.activeMarks.get(markId)
    if (!mark) {
      return 0
    }

    this.activeMarks.delete(markId)

    var endTime = this.now()
    var duration = endTime - mark.startTime

    var entry: ProfilerEntry = {
      name: mark.name,
      module: mark.module,
      startTime: mark.startTime,
      endTime,
      duration,
      memoryBefore: mark.memoryBefore,
      memoryAfter: this.getMemoryUsage(),
    }

    if (mark.metadata) {
      entry.metadata = mark.metadata
    }

    this.entries.push(entry)
    return duration
  }

  // ─── 包装式计时 ─────────────────────────────────

  /**
   * 包装同步函数自动计时
   * @param name 测量名称
   * @param module 模块名称
   * @param fn 要执行的函数
   * @returns fn 的返回值
   */
  measure<T>(name: string, module: string, fn: () => T): T {
    var markId = this.start(name, module)
    try {
      return fn()
    } finally {
      this.end(markId)
    }
  }

  /**
   * 包装异步函数自动计时
   * @param name 测量名称
   * @param module 模块名称
   * @param fn 要执行的异步函数
   * @returns fn 的 Promise
   */
  async asyncMeasure<T>(name: string, module: string, fn: () => Promise<T>): Promise<T> {
    var markId = this.start(name, module)
    try {
      return await fn()
    } finally {
      this.end(markId)
    }
  }

  // ─── 数据访问 ───────────────────────────────────

  /**
   * 获取所有性能条目
   */
  getEntries(): ProfilerEntry[] {
    return this.entries.slice()
  }

  /**
   * 获取统计信息
   * @param name 可选，指定测量名称；不传则统计全部
   */
  getStats(name?: string): ProfilerStats {
    var filtered: ProfilerEntry[]

    if (name) {
      filtered = this.entries.filter(function (e) {
        return e.name === name
      })
    } else {
      filtered = this.entries
    }

    if (filtered.length === 0) {
      return {
        count: 0,
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      }
    }

    // 提取耗时并排序
    var durations = filtered.map(function (e) {
      return e.duration
    })
    durations.sort(function (a, b) {
      return a - b
    })

    var count = durations.length
    var sum = 0
    for (var i = 0; i < durations.length; i++) {
      sum += durations[i]
    }

    return {
      count,
      avg: Math.round((sum / count) * 100) / 100,
      min: durations[0],
      max: durations[count - 1],
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
    }
  }

  /**
   * 清空所有条目
   */
  clear(): void {
    this.entries = []
    this.activeMarks.clear()
  }

  // ─── 报告导出 ───────────────────────────────────

  /**
   * 生成 HTML 格式的性能报告字符串
   */
  exportHTML(): string {
    var stats = this.getStats()
    var entries = this.getEntries()

    var html = ''
    html += '<!DOCTYPE html>'
    html += '<html><head><meta charset="utf-8">'
    html += '<title>Performance Report</title>'
    html += '<style>'
    html += 'body{font-family:monospace;margin:20px;background:#1a1a2e;color:#e0e0e0;}'
    html += 'h1{color:#0f3460;}h2{color:#e94560;border-bottom:1px solid #333;padding-bottom:5px;}'
    html += 'table{border-collapse:collapse;width:100%;margin-bottom:20px;}'
    html += 'th,td{border:1px solid #444;padding:8px 12px;text-align:left;}'
    html += 'th{background:#16213e;color:#0f3460;}'
    html += 'td{font-size:13px;}'
    html += '.stat-box{display:inline-block;margin:5px;padding:10px 15px;background:#16213e;border-radius:4px;}'
    html += '.stat-value{color:#e94560;font-weight:bold;font-size:18px;}'
    html += '.stat-label{color:#999;font-size:12px;}'
    html += '</style></head><body>'

    html += '<h1>XuanFengmen Performance Report</h1>'
    html += '<p>Generated: ' + new Date().toISOString() + '</p>'

    // 总体统计
    html += '<h2>Overall Statistics</h2>'
    html += '<div class="stat-box"><div class="stat-label">Count</div><div class="stat-value">' + stats.count + '</div></div>'
    html += '<div class="stat-box"><div class="stat-label">Avg (ms)</div><div class="stat-value">' + stats.avg + '</div></div>'
    html += '<div class="stat-box"><div class="stat-label">Min (ms)</div><div class="stat-value">' + stats.min + '</div></div>'
    html += '<div class="stat-box"><div class="stat-label">Max (ms)</div><div class="stat-value">' + stats.max + '</div></div>'
    html += '<div class="stat-box"><div class="stat-label">P50 (ms)</div><div class="stat-value">' + stats.p50 + '</div></div>'
    html += '<div class="stat-box"><div class="stat-label">P95 (ms)</div><div class="stat-value">' + stats.p95 + '</div></div>'
    html += '<div class="stat-box"><div class="stat-label">P99 (ms)</div><div class="stat-value">' + stats.p99 + '</div></div>'

    // 按名称分组的统计
    var names = this.getUniqueNames()
    if (names.length > 0) {
      html += '<h2>By Name</h2>'
      html += '<table><tr><th>Name</th><th>Module</th><th>Count</th><th>Avg</th><th>Min</th><th>Max</th><th>P50</th><th>P95</th><th>P99</th></tr>'
      for (var ni = 0; ni < names.length; ni++) {
        var ns = this.getStats(names[ni])
        var moduleName = this.getModuleName(names[ni])
        html += '<tr>'
        html += '<td>' + names[ni] + '</td>'
        html += '<td>' + moduleName + '</td>'
        html += '<td>' + ns.count + '</td>'
        html += '<td>' + ns.avg + '</td>'
        html += '<td>' + ns.min + '</td>'
        html += '<td>' + ns.max + '</td>'
        html += '<td>' + ns.p50 + '</td>'
        html += '<td>' + ns.p95 + '</td>'
        html += '<td>' + ns.p99 + '</td>'
        html += '</tr>'
      }
      html += '</table>'
    }

    // 详细条目
    if (entries.length > 0) {
      html += '<h2>Detailed Entries</h2>'
      html += '<table><tr><th>#</th><th>Name</th><th>Module</th><th>Duration (ms)</th><th>Memory Before</th><th>Memory After</th></tr>'
      var maxRows = Math.min(entries.length, 200)
      for (var ei = 0; ei < maxRows; ei++) {
        var e = entries[ei]
        html += '<tr>'
        html += '<td>' + (ei + 1) + '</td>'
        html += '<td>' + e.name + '</td>'
        html += '<td>' + e.module + '</td>'
        html += '<td>' + Math.round(e.duration * 100) / 100 + '</td>'
        html += '<td>' + (e.memoryBefore !== undefined ? e.memoryBefore + ' MB' : '-') + '</td>'
        html += '<td>' + (e.memoryAfter !== undefined ? e.memoryAfter + ' MB' : '-') + '</td>'
        html += '</tr>'
      }
      if (entries.length > 200) {
        html += '<tr><td colspan="6">... ' + (entries.length - 200) + ' more entries</td></tr>'
      }
      html += '</table>'
    }

    html += '</body></html>'
    return html
  }

  /**
   * 生成 JSON 格式的性能报告字符串
   */
  exportJSON(): string {
    var names = this.getUniqueNames()
    var byName: Record<string, ProfilerStats> = {}

    for (var i = 0; i < names.length; i++) {
      byName[names[i]] = this.getStats(names[i])
    }

    var report = {
      generatedAt: new Date().toISOString(),
      overall: this.getStats(),
      byName,
      entries: this.getEntries(),
    }

    return JSON.stringify(report, null, 2)
  }

  // ─── 内部工具 ───────────────────────────────────

  /**
   * 获取高精度时间戳
   */
  private now(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
    return Date.now()
  }

  /**
   * 获取内存使用（MB）
   */
  private getMemoryUsage(): number {
    try {
      var perf = performance as any
      if (perf && perf.memory && perf.memory.usedJSHeapSize) {
        return Math.round(perf.memory.usedJSHeapSize / 1048576 * 100) / 100
      }
    } catch {
      // ignore
    }
    return 0
  }

  /**
   * 计算百分位数
   * @param sorted 已排序的数值数组
   * @param p 百分位（0-100）
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    var index = Math.ceil((p / 100) * sorted.length) - 1
    if (index < 0) index = 0
    if (index >= sorted.length) index = sorted.length - 1
    return Math.round(sorted[index] * 100) / 100
  }

  /**
   * 获取所有唯一测量名称
   */
  private getUniqueNames(): string[] {
    var seen: Record<string, boolean> = {}
    var names: string[] = []
    for (var i = 0; i < this.entries.length; i++) {
      var name = this.entries[i].name
      if (!seen[name]) {
        seen[name] = true
        names.push(name)
      }
    }
    return names
  }

  /**
   * 根据测量名称获取模块名称
   */
  private getModuleName(name: string): string {
    for (var i = 0; i < this.entries.length; i++) {
      if (this.entries[i].name === name) {
        return this.entries[i].module
      }
    }
    return '-'
  }
}

// ══════════════════════════════════════════════════
//  默认实例
// ══════════════════════════════════════════════════

/** 默认性能分析器实例（全局单例） */
export var performanceProfiler = new PerformanceProfiler()

export default performanceProfiler
