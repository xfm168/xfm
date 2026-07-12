/**
 * RC3-4: Cache 体系 - 缓存报告生成器
 *
 * 聚合所有注册的 CacheManager 实例统计信息，
 * 生成缓存健康报告。
 *
 * 输出：
 * - generateReport(): 结构化报告对象
 * - exportHTML(): HTML 格式报告字符串
 * - exportJSON(): JSON 格式报告字符串
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { CacheManager } from './CacheManager'
import type { CacheStats } from './CacheManager'

// ══════════════════════════════════════════════════
//  类型定义
// ══════════════════════════════════════════════════

/** 缓存报告数据 */
export interface CacheReportData {
  /** 报告生成时间 */
  generatedAt: string
  /** 缓存实例总数 */
  totalCaches: number
  /** 所有缓存条目总数 */
  totalEntries: number
  /** 所有缓存累计命中次数 */
  totalHits: number
  /** 所有缓存累计未命中次数 */
  totalMisses: number
  /** 总体命中率（0-1） */
  hitRate: number
  /** 总体内存使用（字节） */
  memoryUsage: number
  /** 按命名空间分组的统计 */
  byNamespace: Record<string, CacheStats>
}

// ══════════════════════════════════════════════════
//  公开 API
// ══════════════════════════════════════════════════

/**
 * 生成缓存报告
 *
 * 聚合所有注册的 CacheManager 实例统计数据。
 */
export function generateReport(): CacheReportData {
  var managers = CacheManager.getRegistry()

  var totalEntries = 0
  var totalHits = 0
  var totalMisses = 0
  var memoryUsage = 0
  var byNamespace: Record<string, CacheStats> = {}

  for (var i = 0; i < managers.length; i++) {
    var manager = managers[i]
    var stats = manager.getStats()
    var ns = manager.getNamespace()

    totalEntries += stats.totalEntries
    totalHits += stats.totalHits
    totalMisses += stats.totalMisses
    memoryUsage += stats.memoryUsage
    byNamespace[ns] = stats
  }

  var total = totalHits + totalMisses
  var hitRate = total > 0 ? totalHits / total : 0

  return {
    generatedAt: new Date().toISOString(),
    totalCaches: managers.length,
    totalEntries,
    totalHits,
    totalMisses,
    hitRate: Math.round(hitRate * 10000) / 10000,
    memoryUsage,
    byNamespace,
  }
}

/**
 * 生成 HTML 格式的缓存报告
 */
export function exportHTML(): string {
  var report = generateReport()

  var html = ''
  html += '<!DOCTYPE html>'
  html += '<html><head><meta charset="utf-8">'
  html += '<title>Cache Report</title>'
  html += '<style>'
  html += 'body{font-family:monospace;margin:20px;background:#1a1a2e;color:#e0e0e0;}'
  html += 'h1{color:#0f3460;}h2{color:#e94560;border-bottom:1px solid #333;padding-bottom:5px;}'
  html += 'table{border-collapse:collapse;width:100%;margin-bottom:20px;}'
  html += 'th,td{border:1px solid #444;padding:8px 12px;text-align:left;}'
  html += 'th{background:#16213e;color:#0f3460;}'
  html += '.stat-box{display:inline-block;margin:5px;padding:10px 15px;background:#16213e;border-radius:4px;}'
  html += '.stat-value{color:#e94560;font-weight:bold;font-size:18px;}'
  html += '.stat-label{color:#999;font-size:12px;}'
  html += '.hit-rate-good{color:#4ecca3;}'
  html += '.hit-rate-warn{color:#e94560;}'
  html += '</style></head><body>'

  html += '<h1>XuanFengmen Cache Report</h1>'
  html += '<p>Generated: ' + report.generatedAt + '</p>'

  // 总体统计
  html += '<h2>Overall</h2>'
  html += '<div class="stat-box"><div class="stat-label">Caches</div><div class="stat-value">' + report.totalCaches + '</div></div>'
  html += '<div class="stat-box"><div class="stat-label">Entries</div><div class="stat-value">' + report.totalEntries + '</div></div>'
  html += '<div class="stat-box"><div class="stat-label">Hits</div><div class="stat-value">' + report.totalHits + '</div></div>'
  html += '<div class="stat-box"><div class="stat-label">Misses</div><div class="stat-value">' + report.totalMisses + '</div></div>'

  var hitRatePct = Math.round(report.hitRate * 10000) / 100
  var hitRateClass = report.hitRate >= 0.7 ? 'hit-rate-good' : 'hit-rate-warn'
  html += '<div class="stat-box"><div class="stat-label">Hit Rate</div><div class="stat-value ' + hitRateClass + '">' + hitRatePct + '%</div></div>'

  var memKB = Math.round(report.memoryUsage / 1024 * 100) / 100
  html += '<div class="stat-box"><div class="stat-label">Memory (KB)</div><div class="stat-value">' + memKB + '</div></div>'

  // 按命名空间
  html += '<h2>By Namespace</h2>'
  html += '<table>'
  html += '<tr><th>Namespace</th><th>Entries</th><th>Hits</th><th>Misses</th><th>Hit Rate</th><th>Memory (bytes)</th></tr>'

  var nsKeys = Object.keys(report.byNamespace)
  for (var i = 0; i < nsKeys.length; i++) {
    var ns = nsKeys[i]
    var stats = report.byNamespace[ns]
    var nsHitPct = Math.round(stats.hitRate * 10000) / 100
    html += '<tr>'
    html += '<td>' + ns + '</td>'
    html += '<td>' + stats.totalEntries + '</td>'
    html += '<td>' + stats.totalHits + '</td>'
    html += '<td>' + stats.totalMisses + '</td>'
    html += '<td>' + nsHitPct + '%</td>'
    html += '<td>' + stats.memoryUsage + '</td>'
    html += '</tr>'
  }

  html += '</table>'
  html += '</body></html>'
  return html
}

/**
 * 生成 JSON 格式的缓存报告
 */
export function exportJSON(): string {
  var report = generateReport()
  return JSON.stringify(report, null, 2)
}
