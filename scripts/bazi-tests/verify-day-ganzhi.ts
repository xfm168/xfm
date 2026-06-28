import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../lib/bazi/types'

// 公历转儒略日数 (JDN)
function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

// 基准：2000-01-01 = 戊午日 = 序号 54
const BASE_JDN_2000 = 2451545
const BASE_INDEX_2000 = 54 // 戊午

const HEAVENLY_STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const EARTHLY_BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

function ganZhiFromIndex(index: number): string {
  const normalized = ((index % 60) + 60) % 60
  return HEAVENLY_STEMS[normalized % 10] + EARTHLY_BRANCHES[normalized % 12]
}

function dayGanZhiIndex(year: number, month: number, day: number): number {
  const jdn = toJDN(year, month, day)
  const diff = jdn - BASE_JDN_2000
  return ((BASE_INDEX_2000 + diff) % 60 + 60) % 60
}

// 已知验证点（查万年历）
const TEST_CASES: { date: string; expectedGanZhi: string }[] = [
  { date: '2000-01-01', expectedGanZhi: '戊午' },
  { date: '2024-06-28', expectedGanZhi: '癸亥' },
  { date: '2024-02-04', expectedGanZhi: '戊戌' },
  { date: '1900-01-01', expectedGanZhi: '甲戌' },
  { date: '1949-10-01', expectedGanZhi: '甲子' },
  { date: '1976-09-09', expectedGanZhi: '甲子' }, // 需要验证
  { date: '1990-07-01', expectedGanZhi: '丁卯' }, // 需要验证
  { date: '2010-05-01', expectedGanZhi: '辛亥' }, // 需要验证
  { date: '2020-01-25', expectedGanZhi: '乙未' }, // 需要验证
]

console.log('=== 日柱算法验证 (2000基准 + JDN) ===')
console.log()

let passed = 0
let failed = 0

for (const tc of TEST_CASES) {
  const [y, m, d] = tc.date.split('-').map(Number)
  const idx = dayGanZhiIndex(y, m, d)
  const actual = ganZhiFromIndex(idx)
  const pass = actual === tc.expectedGanZhi
  if (pass) {
    console.log(`  ✓ ${tc.date} -> ${actual} (序号 ${idx})`)
    passed++
  } else {
    console.log(`  ✗ ${tc.date} -> 期望 ${tc.expectedGanZhi}, 实际 ${actual} (序号 ${idx})`)
    failed++
  }
}

console.log()
console.log(`通过: ${passed}/${passed + failed}`)
console.log(`失败: ${failed}/${passed + failed}`)
console.log()

// 随机抽取 50 个日期，验证连续性（每天+1）
console.log('=== 连续性验证 (50天连续) ===')
const startDate = new Date(2000, 0, 1)
let prevIdx = dayGanZhiIndex(2000, 1, 1)
let consecutivePass = true
for (let i = 1; i <= 50; i++) {
  const d = new Date(startDate.getTime() + i * 86400000)
  const idx = dayGanZhiIndex(d.getFullYear(), d.getMonth() + 1, d.getDate())
  const expectedIdx = ((prevIdx + 1) % 60 + 60) % 60
  if (idx !== expectedIdx) {
    console.log(`  ✗ 第${i}天不连续: 前一天序号${prevIdx}, 当天序号${idx}`)
    consecutivePass = false
    break
  }
  prevIdx = idx
}
if (consecutivePass) {
  console.log('  ✓ 50天连续验证通过')
}
console.log()

// 闰年验证
console.log('=== 闰年验证 ===')
console.log(`  2020-02-28 -> ${ganZhiFromIndex(dayGanZhiIndex(2020, 2, 28))}`)
console.log(`  2020-02-29 -> ${ganZhiFromIndex(dayGanZhiIndex(2020, 2, 29))}`)
console.log(`  2020-03-01 -> ${ganZhiFromIndex(dayGanZhiIndex(2020, 3, 1))}`)
console.log()
