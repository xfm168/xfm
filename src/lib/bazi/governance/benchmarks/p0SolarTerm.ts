/**
 * P0-① Benchmark - 节气权威基准数据
 * V4.8.1 Baseline
 *
 * 权威参考：寿星天文历（ShouXing，基于紫金山天文台 VSOP87/ELP2000 算法）
 * 对比项：节气精确时刻（秒级）
 *
 * 数据来源：qimendunjia-standalone getSolarTerms() 实测
 * 交叉验证：与中国紫金山天文台公开节气时刻一致
 *
 * 用途：回归保护 + 精度回归（任何升级不得使秒级精度退化）
 */

import { getSolarTermDate } from '../../solarTerms'
import type { SolarTermName } from '../../types'
import { runBenchmark, type BenchmarkResult } from '../benchmark'

interface AuthoritativeTerm {
  year: number
  term: SolarTermName
  /** 权威时刻 ISO（北京时间） */
  iso: string
}

/**
 * 权威节气时刻基准（2024-2027，8个分月/分年关键节气）
 */
const AUTHORITATIVE_TERMS: AuthoritativeTerm[] = [
  // 2024
  { year: 2024, term: '立春', iso: '2024-02-04T16:27:07' },
  { year: 2024, term: '惊蛰', iso: '2024-03-05T10:22:45' },
  { year: 2024, term: '立夏', iso: '2024-05-05T08:10:05' },
  { year: 2024, term: '芒种', iso: '2024-06-05T12:09:54' },
  { year: 2024, term: '立秋', iso: '2024-08-07T08:09:16' },
  { year: 2024, term: '白露', iso: '2024-09-07T11:11:20' },
  { year: 2024, term: '立冬', iso: '2024-11-07T06:20:04' },
  { year: 2024, term: '大雪', iso: '2024-12-06T23:17:03' },
  // 2025
  { year: 2025, term: '立春', iso: '2025-02-03T22:10:28' },
  { year: 2025, term: '惊蛰', iso: '2025-03-05T16:07:18' },
  { year: 2025, term: '立夏', iso: '2025-05-05T13:57:13' },
  { year: 2025, term: '芒种', iso: '2025-06-05T17:56:32' },
  { year: 2025, term: '立秋', iso: '2025-08-07T13:51:35' },
  { year: 2025, term: '白露', iso: '2025-09-07T16:51:57' },
  { year: 2025, term: '立冬', iso: '2025-11-07T12:04:04' },
  { year: 2025, term: '大雪', iso: '2025-12-07T05:04:37' },
  // 2026
  { year: 2026, term: '立春', iso: '2026-02-04T04:02:08' },
  { year: 2026, term: '惊蛰', iso: '2026-03-05T21:59:00' },
  { year: 2026, term: '立夏', iso: '2026-05-05T19:48:44' },
  { year: 2026, term: '芒种', iso: '2026-06-05T23:48:21' },
  { year: 2026, term: '立秋', iso: '2026-08-07T19:42:43' },
  { year: 2026, term: '白露', iso: '2026-09-07T22:41:16' },
  { year: 2026, term: '立冬', iso: '2026-11-07T17:52:05' },
  { year: 2026, term: '大雪', iso: '2026-12-07T10:52:32' },
  // 2027
  { year: 2027, term: '立春', iso: '2027-02-04T09:46:18' },
  { year: 2027, term: '惊蛰', iso: '2027-03-06T03:39:33' },
  { year: 2027, term: '立夏', iso: '2027-05-06T01:25:12' },
  { year: 2027, term: '芒种', iso: '2027-06-06T05:25:48' },
  { year: 2027, term: '立秋', iso: '2027-08-08T01:26:46' },
  { year: 2027, term: '白露', iso: '2027-09-08T04:28:28' },
  { year: 2027, term: '立冬', iso: '2027-11-07T23:38:35' },
  { year: 2027, term: '大雪', iso: '2027-12-07T16:37:41' },
]

function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

/** 运行 P0-① 节气基准对比（阈值 100%，秒级精度不得退化） */
export function runSolarTermBenchmark(): BenchmarkResult {
  const cases = AUTHORITATIVE_TERMS.map(item => {
    const actual = getSolarTermDate(item.year, item.term)
    const actualIso = toIso(actual.date)
    const passed = actualIso === item.iso
    return {
      id: `${item.year}-${item.term}`,
      actual: actualIso,
      expected: item.iso,
      passed,
      diff: passed ? undefined : `actual=${actualIso} expected=${item.iso}`,
    }
  })
  return runBenchmark('P0-① 节气秒级基准', cases, 100)
}

/** 基准数据总数 */
export const SOLAR_TERM_BENCHMARK_COUNT = AUTHORITATIVE_TERMS.length
