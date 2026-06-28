import { calculateBaZi, getDayGanZhi, getYearGanZhi, getMonthGanZhi, getHourGanZhi, getNaYin, getChangSheng, calculateShenShi, getWangShuai } from '../calculator'
import type { BaZiChart } from '../types'

let total = 0
let passed = 0
let failed = 0

function test(name: string, actual: string, expected: string) {
  total++
  const pass = actual === expected
  if (pass) {
    passed++
  } else {
    failed++
    console.log(`  ✗ [${name}] 期望: ${expected}, 实际: ${actual}`)
  }
  return pass
}

console.log('=== 八字排盘算法综合验证 ===')
console.log()

// ========== 1. 日柱验证 ==========
console.log('【1】日柱验证 (JDN算法)')
const dayTests: { date: string; expected: string }[] = [
  { date: '1900-01-01', expected: '甲戌' },
  { date: '1949-10-01', expected: '甲子' },
  { date: '1976-09-09', expected: '甲子' },
  { date: '1984-02-02', expected: '丙寅' },
  { date: '1990-07-01', expected: '丁卯' },
  { date: '1995-10-24', expected: '戊子' },
  { date: '2000-01-01', expected: '戊午' },
  { date: '2003-03-15', expected: '丁亥' },
  { date: '2010-05-01', expected: '辛亥' },
  { date: '2020-01-25', expected: '丁卯' },
  { date: '2024-02-04', expected: '戊戌' },
  { date: '2024-06-28', expected: '癸亥' },
]
for (const tc of dayTests) {
  const [y, m, d] = tc.date.split('-').map(Number)
  const gz = getDayGanZhi(new Date(y, m - 1, d))
  test(`日柱 ${tc.date}`, gz.gan + gz.zhi, tc.expected)
}
console.log(`  日柱: ${dayTests.length - failed + (failed > 0 ? 0 : 0)}/${dayTests.length} (当前已失败 ${failed} 个)`)
console.log()

// ========== 2. 年柱验证（立春分界）==========
console.log('【2】年柱验证（立春分界）')
const yearTests: { date: string; expected: string }[] = [
  { date: '2024-02-03', expected: '癸卯' }, // 立春前
  { date: '2024-02-04', expected: '甲辰' }, // 立春当天
  { date: '2024-02-05', expected: '甲辰' }, // 立春后
  { date: '2024-12-31', expected: '甲辰' },
  { date: '2025-01-01', expected: '甲辰' }, // 元旦仍属甲辰
  { date: '2025-02-03', expected: '甲辰' }, // 立春前
  { date: '2000-02-04', expected: '庚辰' },
  { date: '2000-02-03', expected: '己卯' },
  { date: '1990-02-04', expected: '庚午' },
  { date: '1990-02-03', expected: '己巳' },
]
let yearFail = 0
for (const tc of yearTests) {
  const [y, m, d] = tc.date.split('-').map(Number)
  const gz = getYearGanZhi(new Date(y, m - 1, d))
  const pass = test(`年柱 ${tc.date}`, gz.gan + gz.zhi, tc.expected)
  if (!pass) yearFail++
}
console.log(`  年柱: ${yearTests.length - yearFail}/${yearTests.length}`)
console.log()

// ========== 3. 月柱验证（节气分界+五虎遁）==========
console.log('【3】月柱验证（节气分界）')
const monthTests: { date: string; yearGan: string; expected: string }[] = [
  // 甲己起丙寅
  { date: '2024-02-05', yearGan: '甲', expected: '丙寅' }, // 立春后
  { date: '2024-03-10', yearGan: '甲', expected: '丁卯' }, // 惊蛰后
  { date: '2024-04-10', yearGan: '甲', expected: '戊辰' }, // 清明后
  { date: '2024-05-10', yearGan: '甲', expected: '己巳' }, // 立夏后
  { date: '2024-06-10', yearGan: '甲', expected: '庚午' }, // 芒种后
  { date: '2024-07-10', yearGan: '甲', expected: '辛未' }, // 小暑后
  { date: '2024-08-10', yearGan: '甲', expected: '壬申' }, // 立秋后
  { date: '2024-09-10', yearGan: '甲', expected: '癸酉' }, // 白露后
  { date: '2024-10-10', yearGan: '甲', expected: '甲戌' }, // 寒露后
  { date: '2024-11-10', yearGan: '甲', expected: '乙亥' }, // 立冬后
  { date: '2024-12-10', yearGan: '甲', expected: '丙子' }, // 大雪后
  { date: '2025-01-10', yearGan: '甲', expected: '丁丑' }, // 小寒后
]
let monthFail = 0
for (const tc of monthTests) {
  const [y, m, d] = tc.date.split('-').map(Number)
  const gz = getMonthGanZhi(new Date(y, m - 1, d), tc.yearGan as any)
  const pass = test(`月柱 ${tc.date}`, gz.gan + gz.zhi, tc.expected)
  if (!pass) monthFail++
}
console.log(`  月柱: ${monthTests.length - monthFail}/${monthTests.length}`)
console.log()

// ========== 4. 时柱验证（五鼠遁）==========
console.log('【4】时柱验证（五鼠遁）')
// 甲己起甲子
const hourTests: { time: string; dayGan: string; expected: string }[] = [
  { time: '00:30', dayGan: '甲', expected: '甲子' },
  { time: '01:30', dayGan: '甲', expected: '乙丑' },
  { time: '11:30', dayGan: '甲', expected: '庚午' },
  { time: '23:30', dayGan: '甲', expected: '甲子' },
  // 乙庚起丙子
  { time: '00:30', dayGan: '乙', expected: '丙子' },
  { time: '12:30', dayGan: '乙', expected: '壬午' },
  // 丙辛起戊子
  { time: '00:30', dayGan: '丙', expected: '戊子' },
  // 丁壬起庚子
  { time: '00:30', dayGan: '丁', expected: '庚子' },
  // 戊癸起壬子
  { time: '00:30', dayGan: '戊', expected: '壬子' },
]
let hourFail = 0
for (const tc of hourTests) {
  const [h, m] = tc.time.split(':').map(Number)
  const gz = getHourGanZhi(new Date(2024, 0, 1, h, m), tc.dayGan as any)
  const pass = test(`时柱 ${tc.time} 日${tc.dayGan}`, gz.gan + gz.zhi, tc.expected)
  if (!pass) hourFail++
}
console.log(`  时柱: ${hourTests.length - hourFail}/${hourTests.length}`)
console.log()

// ========== 5. 纳音验证 ==========
console.log('【5】纳音验证')
const nayinTests: { ganZhi: string; expected: string }[] = [
  { ganZhi: '甲子', expected: '海中金' },
  { ganZhi: '乙丑', expected: '海中金' },
  { ganZhi: '丙寅', expected: '炉中火' },
  { ganZhi: '丁卯', expected: '炉中火' },
  { ganZhi: '戊辰', expected: '大林木' },
  { ganZhi: '己卯', expected: '城头土' },
  { ganZhi: '戊午', expected: '天上火' },
  { ganZhi: '癸亥', expected: '大海水' },
  { ganZhi: '戊戌', expected: '平地木' },
  { ganZhi: '辛亥', expected: '钗钏金' },
]
let nayinFail = 0
for (const tc of nayinTests) {
  const [gan, zhi] = tc.ganZhi.split('')
  const ny = getNaYin(gan as any, zhi as any)
  const pass = test(`纳音 ${tc.ganZhi}`, ny, tc.expected)
  if (!pass) nayinFail++
}
console.log(`  纳音: ${nayinTests.length - nayinFail}/${nayinTests.length}`)
console.log()

// ========== 6. 十神验证 ==========
console.log('【6】十神验证')
const shenshiTests: { dayGan: string; target: string; expected: string }[] = [
  // 甲木日主
  { dayGan: '甲', target: '甲', expected: '比肩' },
  { dayGan: '甲', target: '乙', expected: '劫财' },
  { dayGan: '甲', target: '丙', expected: '食神' },
  { dayGan: '甲', target: '丁', expected: '伤官' },
  { dayGan: '甲', target: '戊', expected: '偏财' },
  { dayGan: '甲', target: '己', expected: '正财' },
  { dayGan: '甲', target: '庚', expected: '偏官' },
  { dayGan: '甲', target: '辛', expected: '正官' },
  { dayGan: '甲', target: '壬', expected: '偏印' },
  { dayGan: '甲', target: '癸', expected: '正印' },
  // 乙木日主（阴干）
  { dayGan: '乙', target: '甲', expected: '劫财' },
  { dayGan: '乙', target: '乙', expected: '比肩' },
  { dayGan: '乙', target: '丙', expected: '伤官' },
  { dayGan: '乙', target: '丁', expected: '食神' },
  { dayGan: '乙', target: '庚', expected: '正官' },
  { dayGan: '乙', target: '辛', expected: '偏官' },
]
let shenshiFail = 0
for (const tc of shenshiTests) {
  const ss = calculateShenShi(tc.dayGan as any, tc.target as any)
  const pass = test(`十神 ${tc.dayGan}日→${tc.target}`, ss, tc.expected)
  if (!pass) shenshiFail++
}
console.log(`  十神: ${shenshiTests.length - shenshiFail}/${shenshiTests.length}`)
console.log()

// ========== 7. 十二长生验证 ==========
console.log('【7】十二长生验证')
const changshengTests: { dayGan: string; zhi: string; expected: string }[] = [
  // 甲木（阳）长生在亥
  { dayGan: '甲', zhi: '亥', expected: '长生' },
  { dayGan: '甲', zhi: '子', expected: '沐浴' },
  { dayGan: '甲', zhi: '丑', expected: '冠带' },
  { dayGan: '甲', zhi: '寅', expected: '临官' },
  { dayGan: '甲', zhi: '卯', expected: '帝旺' },
  { dayGan: '甲', zhi: '午', expected: '死' },
  { dayGan: '甲', zhi: '未', expected: '墓' },
  // 乙木（阴）长生在午
  { dayGan: '乙', zhi: '午', expected: '长生' },
  { dayGan: '乙', zhi: '巳', expected: '沐浴' },
  { dayGan: '乙', zhi: '辰', expected: '冠带' },
  // 丙火（阳）长生在寅
  { dayGan: '丙', zhi: '寅', expected: '长生' },
  { dayGan: '丙', zhi: '卯', expected: '沐浴' },
  // 庚金（阳）长生在巳
  { dayGan: '庚', zhi: '巳', expected: '长生' },
  // 癸水（阴）长生在卯
  { dayGan: '癸', zhi: '卯', expected: '长生' },
  { dayGan: '癸', zhi: '寅', expected: '沐浴' },
]
let changshengFail = 0
for (const tc of changshengTests) {
  const cs = getChangSheng(tc.dayGan as any, tc.zhi as any)
  const pass = test(`长生 ${tc.dayGan}日→${tc.zhi}`, cs, tc.expected)
  if (!pass) changshengFail++
}
console.log(`  十二长生: ${changshengTests.length - changshengFail}/${changshengTests.length}`)
console.log()

// ========== 8. 旺相休囚死验证 ==========
console.log('【8】旺相休囚死验证')
const wangshuaiTests: { dayElement: string; monthZhi: string; expected: string }[] = [
  { dayElement: '木', monthZhi: '寅', expected: '旺' }, // 春木旺
  { dayElement: '木', monthZhi: '卯', expected: '旺' },
  { dayElement: '火', monthZhi: '寅', expected: '相' }, // 木生火，相
  { dayElement: '水', monthZhi: '寅', expected: '休' }, // 水生木，休
  { dayElement: '金', monthZhi: '寅', expected: '囚' }, // 金克木，囚
  { dayElement: '土', monthZhi: '寅', expected: '死' }, // 木克土，死
  { dayElement: '火', monthZhi: '午', expected: '旺' }, // 夏火旺
  { dayElement: '金', monthZhi: '申', expected: '旺' }, // 秋金旺
  { dayElement: '水', monthZhi: '子', expected: '旺' }, // 冬水旺
]
let wangshuaiFail = 0
for (const tc of wangshuaiTests) {
  const ws = getWangShuai(tc.dayElement as any, tc.monthZhi as any)
  const pass = test(`旺衰 ${tc.dayElement}日 ${tc.monthZhi}月`, ws, tc.expected)
  if (!pass) wangshuaiFail++
}
console.log(`  旺相休囚死: ${wangshuaiTests.length - wangshuaiFail}/${wangshuaiTests.length}`)
console.log()

// ========== 9. 完整排盘验证 ==========
console.log('【9】完整排盘验证（2个完整案例）')

// 案例1：2000-01-01 00:30 男
// 已知：己卯年 丙子月 戊午日 壬子时
const chart1 = calculateBaZi({
  birthDate: '2000-01-01',
  birthTime: '00:30',
  gender: 'male',
})
test('完整排盘1 年柱', chart1.sixLines.year.gan + chart1.sixLines.year.zhi, '己卯')
test('完整排盘1 月柱', chart1.sixLines.month.gan + chart1.sixLines.month.zhi, '丙子')
test('完整排盘1 日柱', chart1.sixLines.day.gan + chart1.sixLines.day.zhi, '戊午')
test('完整排盘1 时柱', chart1.sixLines.hour.gan + chart1.sixLines.hour.zhi, '壬子')
test('完整排盘1 年纳音', chart1.sixLines.year.naYin, '城头土')
test('完整排盘1 日纳音', chart1.sixLines.day.naYin, '天上火')
test('完整排盘1 日十神', chart1.sixLines.day.shenShi || '', '比肩')
test('完整排盘1 日主旺衰', chart1.dayMaster.wangShuai, '囚') // 子月戊土，水旺土囚
console.log()

// 案例2：2024-06-28 12:00 男
// 已知：甲辰年 庚午月 癸亥日 戊午时
const chart2 = calculateBaZi({
  birthDate: '2024-06-28',
  birthTime: '12:00',
  gender: 'male',
})
test('完整排盘2 年柱', chart2.sixLines.year.gan + chart2.sixLines.year.zhi, '甲辰')
test('完整排盘2 月柱', chart2.sixLines.month.gan + chart2.sixLines.month.zhi, '庚午')
test('完整排盘2 日柱', chart2.sixLines.day.gan + chart2.sixLines.day.zhi, '癸亥')
test('完整排盘2 时柱', chart2.sixLines.hour.gan + chart2.sixLines.hour.zhi, '戊午')
test('完整排盘2 年纳音', chart2.sixLines.year.naYin, '覆灯火')
test('完整排盘2 日纳音', chart2.sixLines.day.naYin, '大海水')
test('完整排盘2 日十神', chart2.sixLines.day.shenShi || '', '比肩')
test('完整排盘2 日主旺衰', chart2.dayMaster.wangShuai, '囚') // 午月癸水，火旺水囚
console.log()

// ========== 总结 ==========
console.log('========================')
console.log(`总测试: ${total}`)
console.log(`通过: ${passed}`)
console.log(`失败: ${failed}`)
console.log(`通过率: ${((passed / total) * 100).toFixed(1)}%`)
console.log('========================')

if (failed > 0) {
  process.exit(1)
}
