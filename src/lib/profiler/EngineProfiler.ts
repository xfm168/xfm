/**
 * RC3-3: 性能 Profiler - 命理引擎专用分析器
 *
 * 专门针对命理引擎的性能追踪：
 * - profileBaziCalculation: 八字排盘计算
 * - profileFengshuiAnalysis: 风水分析
 * - profileAIAnalysis: AI 分析
 *
 * 不修改引擎代码，只包装调用。记录每个引擎的
 * 耗时、调用次数、P95/P99。
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { performanceProfiler } from './PerformanceProfiler'
import type { ProfilerStats } from './PerformanceProfiler'

// ─── 引擎测量名称常量 ─────────────────────────────

var BAZI_NAME = 'bazi-calculation'
var BAZI_MODULE = 'BaziEngine'

var FENGSHUI_NAME = 'fengshui-analysis'
var FENGSHUI_MODULE = 'FengShuiEngine'

var AI_NAME = 'ai-analysis'
var AI_MODULE = 'AIEngine'

// ══════════════════════════════════════════════════
//  EngineProfiler 类
// ══════════════════════════════════════════════════

/**
 * 命理引擎性能分析器
 *
 * 包装引擎调用，自动记录性能数据。
 * 不修改引擎内部代码，仅在外部包装计时。
 *
 * @example
 * import { engineProfiler } from '@/lib/profiler'
 *
 * // 同步包装
 * var chart = engineProfiler.profileBaziCalculation(function() {
 *   return calculateBaZi(birthInfo)
 * })
 *
 * // 异步包装
 * var report = await engineProfiler.profileAIAnalysis(function() {
 *   return generateAIReport(chart)
 * })
 *
 * // 查看统计
 * var stats = engineProfiler.getEngineStats()
 * console.log(stats.bazi.p95, 'ms')
 */
export class EngineProfiler {
  // ─── 八字排盘 ───────────────────────────────────

  /**
   * 包装八字排盘计算（同步）
   * @param fn 八字排盘函数
   * @returns fn 的返回值
   */
  profileBaziCalculation<T>(fn: () => T): T {
    return performanceProfiler.measure(BAZI_NAME, BAZI_MODULE, fn)
  }

  /**
   * 包装八字排盘计算（异步）
   * @param fn 八字排盘异步函数
   * @returns fn 的 Promise
   */
  async profileBaziCalculationAsync<T>(fn: () => Promise<T>): Promise<T> {
    return performanceProfiler.asyncMeasure(BAZI_NAME, BAZI_MODULE, fn)
  }

  // ─── 风水分析 ───────────────────────────────────

  /**
   * 包装风水分析（同步）
   * @param fn 风水分析函数
   * @returns fn 的返回值
   */
  profileFengshuiAnalysis<T>(fn: () => T): T {
    return performanceProfiler.measure(FENGSHUI_NAME, FENGSHUI_MODULE, fn)
  }

  /**
   * 包装风水分析（异步）
   * @param fn 风水分析异步函数
   * @returns fn 的 Promise
   */
  async profileFengshuiAnalysisAsync<T>(fn: () => Promise<T>): Promise<T> {
    return performanceProfiler.asyncMeasure(FENGSHUI_NAME, FENGSHUI_MODULE, fn)
  }

  // ─── AI 分析 ────────────────────────────────────

  /**
   * 包装 AI 分析（同步）
   * @param fn AI 分析函数
   * @returns fn 的返回值
   */
  profileAIAnalysis<T>(fn: () => T): T {
    return performanceProfiler.measure(AI_NAME, AI_MODULE, fn)
  }

  /**
   * 包装 AI 分析（异步）
   * @param fn AI 分析异步函数
   * @returns fn 的 Promise
   */
  async profileAIAnalysisAsync<T>(fn: () => Promise<T>): Promise<T> {
    return performanceProfiler.asyncMeasure(AI_NAME, AI_MODULE, fn)
  }

  // ─── 统计查询 ───────────────────────────────────

  /**
   * 获取各引擎的性能统计
   * @returns 包含 bazi / fengshui / ai 三个引擎的统计信息
   */
  getEngineStats(): {
    bazi: ProfilerStats
    fengshui: ProfilerStats
    ai: ProfilerStats
  } {
    return {
      bazi: performanceProfiler.getStats(BAZI_NAME),
      fengshui: performanceProfiler.getStats(FENGSHUI_NAME),
      ai: performanceProfiler.getStats(AI_NAME),
    }
  }

  /**
   * 获取八字引擎统计
   */
  getBaziStats(): ProfilerStats {
    return performanceProfiler.getStats(BAZI_NAME)
  }

  /**
   * 获取风水引擎统计
   */
  getFengshuiStats(): ProfilerStats {
    return performanceProfiler.getStats(FENGSHUI_NAME)
  }

  /**
   * 获取 AI 引擎统计
   */
  getAIStats(): ProfilerStats {
    return performanceProfiler.getStats(AI_NAME)
  }

  /**
   * 生成引擎性能报告（JSON 字符串）
   */
  exportJSON(): string {
    var stats = this.getEngineStats()
    var report = {
      generatedAt: new Date().toISOString(),
      engines: {
        bazi: {
          name: BAZI_NAME,
          module: BAZI_MODULE,
          stats: stats.bazi,
        },
        fengshui: {
          name: FENGSHUI_NAME,
          module: FENGSHUI_MODULE,
          stats: stats.fengshui,
        },
        ai: {
          name: AI_NAME,
          module: AI_MODULE,
          stats: stats.ai,
        },
      },
    }
    return JSON.stringify(report, null, 2)
  }

  /**
   * 生成引擎性能报告（HTML 字符串）
   */
  exportHTML(): string {
    var stats = this.getEngineStats()

    var html = ''
    html += '<!DOCTYPE html>'
    html += '<html><head><meta charset="utf-8">'
    html += '<title>Engine Performance Report</title>'
    html += '<style>'
    html += 'body{font-family:monospace;margin:20px;background:#1a1a2e;color:#e0e0e0;}'
    html += 'h1{color:#0f3460;}h2{color:#e94560;border-bottom:1px solid #333;padding-bottom:5px;}'
    html += 'table{border-collapse:collapse;width:100%;margin-bottom:20px;}'
    html += 'th,td{border:1px solid #444;padding:8px 12px;text-align:left;}'
    html += 'th{background:#16213e;color:#0f3460;}'
    html += '</style></head><body>'

    html += '<h1>Engine Performance Report</h1>'
    html += '<p>Generated: ' + new Date().toISOString() + '</p>'

    html += '<h2>Engine Statistics</h2>'
    html += '<table>'
    html += '<tr><th>Engine</th><th>Module</th><th>Calls</th><th>Avg (ms)</th><th>Min (ms)</th><th>Max (ms)</th><th>P50 (ms)</th><th>P95 (ms)</th><th>P99 (ms)</th></tr>'

    html += this.renderEngineRow('Bazi', BAZI_MODULE, stats.bazi)
    html += this.renderEngineRow('FengShui', FENGSHUI_MODULE, stats.fengshui)
    html += this.renderEngineRow('AI', AI_MODULE, stats.ai)

    html += '</table>'
    html += '</body></html>'
    return html
  }

  /**
   * 渲染引擎统计行（内部工具）
   */
  private renderEngineRow(label: string, module: string, stats: ProfilerStats): string {
    var row = ''
    row += '<tr>'
    row += '<td>' + label + '</td>'
    row += '<td>' + module + '</td>'
    row += '<td>' + stats.count + '</td>'
    row += '<td>' + stats.avg + '</td>'
    row += '<td>' + stats.min + '</td>'
    row += '<td>' + stats.max + '</td>'
    row += '<td>' + stats.p50 + '</td>'
    row += '<td>' + stats.p95 + '</td>'
    row += '<td>' + stats.p99 + '</td>'
    row += '</tr>'
    return row
  }
}

// ══════════════════════════════════════════════════
//  默认实例
// ══════════════════════════════════════════════════

/** 默认引擎性能分析器实例（全局单例） */
export var engineProfiler = new EngineProfiler()

export default engineProfiler
