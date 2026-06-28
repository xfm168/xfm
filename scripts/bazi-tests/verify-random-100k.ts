/**
 * 100000组随机八字验证脚本
 * 对照参照标准验证八字排盘精度
 */

import { writeFileSync } from 'fs'
import { getDayGanZhi, getYearGanZhi, getMonthGanZhi, getHourGanZhi } from '../../src/lib/bazi/calculator'
import { getChangSheng } from '../../src/lib/bazi/changsheng'
import { calculateShenShi, getStemElement } from '../../src/lib/bazi/shishen'
import { getWangShuai, getMonthMainElement } from '../../src/lib/bazi/wuxing'
import { getSolarTerms } from 'qimendunjia-standalone'
import type { SolarTermInfo } from 'qimendunjia-standalone'

const CONFIG = {
  sampleSize: 100000,
  startYear: 1900,
  endYear: 2100,
  progressInterval: 10000,
}

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const
const MONTH_BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const

const NA_YIN_TABLE = [
  '海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木',
  '路旁土', '路旁土', '剑锋金', '剑锋金', '山头火', '山头火',
  '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金',
  '杨柳木', '杨柳木', '泉中水', '泉中水', '屋上土', '屋上土',
  '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水',
  '沙中金', '沙中金', '山下火', '山下火', '平地木', '平地木',
  '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火',
  '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金',
  '桑柘木', '桑柘木', '大溪水', '大溪水', '沙中土', '沙中土',
  '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水',
] as const

const CHANG_SHENG_NAMES = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'] as const

const CHANG_SHENG_START: Record<number, number> = {
  0: 11,
  1: 6,
  2: 2,
  3: 8,
  4: 8,
  5: 8,
  6: 5,
  7: 0,
  8: 8,
  9: 3,
}

const STEM_ELEMENT: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

const STEM_YINYANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴',
}

const GENERATE: Record<string, string> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}

const OVERCOME: Record<string, string> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
}

const WANG_SHUAI: Record<string, Record<string, string>> = {
  木: { 木: '旺', 火: '相', 土: '死', 金: '囚', 水: '休' },
  火: { 木: '休', 火: '旺', 土: '相', 金: '死', 水: '囚' },
  土: { 木: '死', 火: '囚', 土: '旺', 金: '相', 水: '休' },
  金: { 木: '囚', 火: '休', 土: '死', 金: '旺', 水: '相' },
  水: { 木: '相', 火: '死', 土: '囚', 金: '休', 水: '旺' },
}

const TERM_TO_MONTH_ZHI: Record<number, number> = {
  0: 11, 1: 10, 2: 0, 3: 0, 4: 1, 5: 1,
  6: 2, 7: 2, 8: 3, 9: 3, 10: 4, 11: 4,
  12: 5, 13: 5, 14: 6, 15: 6, 16: 7, 17: 7,
  18: 8, 19: 8, 20: 9, 21: 9, 22: 10, 23: 10,
}

const solarTermsCache: Record<number, SolarTermInfo[]> = {}

function getCachedSolarTerms(year: number): SolarTermInfo[] {
  if (!solarTermsCache[year]) {
    solarTermsCache[year] = getSolarTerms(year)
  }
  return solarTermsCache[year]
}

function toJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

function refDayGanZhi(date: Date): { gan: string; zhi: string } {
  const jdn = toJDN(date.getFullYear(), date.getMonth() + 1, date.getDate())
  const diff = jdn - 2451545
  const index = ((54 + diff) % 60 + 60) % 60
  return {
    gan: HEAVENLY_STEMS[index % 10],
    zhi: EARTHLY_BRANCHES[index % 12],
  }
}

function refYearGanZhi(date: Date): { gan: string; zhi: string } {
  const year = date.getFullYear()
  const terms = getCachedSolarTerms(year)
  const liChun = terms.find(t => t.name === '立春')
  let actualYear = year
  if (liChun && date < new Date(liChun.date)) {
    actualYear = year - 1
  }
  const stemIndex = ((actualYear - 4) % 10 + 10) % 10
  const branchIndex = ((actualYear - 4) % 12 + 12) % 12
  return {
    gan: HEAVENLY_STEMS[stemIndex],
    zhi: EARTHLY_BRANCHES[branchIndex],
  }
}

function refMonthGanZhi(date: Date, yearGan: string): { gan: string; zhi: string } {
  const year = date.getFullYear()
  const terms = getCachedSolarTerms(year)

  let lastIndex = -1
  for (let i = 0; i < terms.length; i++) {
    const termDate = new Date(terms[i].date)
    if (date >= termDate) {
      lastIndex = i
    }
  }

  let zhiIndex: number
  if (lastIndex === -1) {
    zhiIndex = 11
  } else {
    zhiIndex = TERM_TO_MONTH_ZHI[lastIndex]
  }

  const zhi = MONTH_BRANCHES[zhiIndex]

  const yearStemIdx = HEAVENLY_STEMS.indexOf(yearGan as typeof HEAVENLY_STEMS[number])
  const mod = yearStemIdx % 5
  const monthStemBase = [2, 4, 6, 8, 0][mod]
  const gan = HEAVENLY_STEMS[(monthStemBase + zhiIndex) % 10]

  return { gan, zhi }
}

function refHourGanZhi(date: Date, dayGan: string): { gan: string; zhi: string } {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const totalMinutes = hours * 60 + minutes

  let hourIndex = 0
  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) {
    hourIndex = 0
  } else if (totalMinutes < 3 * 60) {
    hourIndex = 1
  } else if (totalMinutes < 5 * 60) {
    hourIndex = 2
  } else if (totalMinutes < 7 * 60) {
    hourIndex = 3
  } else if (totalMinutes < 9 * 60) {
    hourIndex = 4
  } else if (totalMinutes < 11 * 60) {
    hourIndex = 5
  } else if (totalMinutes < 13 * 60) {
    hourIndex = 6
  } else if (totalMinutes < 15 * 60) {
    hourIndex = 7
  } else if (totalMinutes < 17 * 60) {
    hourIndex = 8
  } else if (totalMinutes < 19 * 60) {
    hourIndex = 9
  } else if (totalMinutes < 21 * 60) {
    hourIndex = 10
  } else {
    hourIndex = 11
  }

  const zhi = EARTHLY_BRANCHES[hourIndex]

  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayGan as typeof HEAVENLY_STEMS[number])
  const mod = dayStemIdx % 5
  const hourStemBase = [0, 2, 4, 6, 8][mod]
  const gan = HEAVENLY_STEMS[(hourStemBase + hourIndex) % 10]

  return { gan, zhi }
}

function refNaYin(gan: string, zhi: string): string {
  const ganIdx = HEAVENLY_STEMS.indexOf(gan as typeof HEAVENLY_STEMS[number])
  const zhiIdx = EARTHLY_BRANCHES.indexOf(zhi as typeof EARTHLY_BRANCHES[number])
  let idx = 0
  for (let n = 0; n < 60; n++) {
    if (n % 10 === ganIdx && n % 12 === zhiIdx) {
      idx = n
      break
    }
  }
  return NA_YIN_TABLE[idx] || '未知'
}

function refChangSheng(gan: string, zhi: string): string {
  const ganIdx = HEAVENLY_STEMS.indexOf(gan as typeof HEAVENLY_STEMS[number])
  const zhiIdx = EARTHLY_BRANCHES.indexOf(zhi as typeof EARTHLY_BRANCHES[number])
  const startIdx = CHANG_SHENG_START[ganIdx]
  const isYang = ['甲', '丙', '戊', '庚', '壬'].includes(gan)
  let offset: number
  if (isYang) {
    offset = (zhiIdx - startIdx + 12) % 12
  } else {
    offset = (startIdx - zhiIdx + 12) % 12
  }
  return CHANG_SHENG_NAMES[offset]
}

function refShenShi(dayGan: string, targetGan: string): string {
  const dayElement = STEM_ELEMENT[dayGan]
  const dayYinYang = STEM_YINYANG[dayGan]
  const targetElement = STEM_ELEMENT[targetGan]
  const targetYinYang = STEM_YINYANG[targetGan]
  const sameYinYang = dayYinYang === targetYinYang

  if (targetElement === dayElement) {
    return sameYinYang ? '比肩' : '劫财'
  }
  if (GENERATE[dayElement] === targetElement) {
    return sameYinYang ? '食神' : '伤官'
  }
  if (OVERCOME[dayElement] === targetElement) {
    return sameYinYang ? '偏财' : '正财'
  }
  if (OVERCOME[targetElement] === dayElement) {
    return sameYinYang ? '偏官' : '正官'
  }
  if (GENERATE[targetElement] === dayElement) {
    return sameYinYang ? '偏印' : '正印'
  }
  return '比肩'
}

function refWangShuai(monthZhi: string, dayGan: string): string {
  const monthElement = getMonthMainElement(monthZhi)
  const dayElement = getStemElement(dayGan as typeof HEAVENLY_STEMS[number])
  return WANG_SHUAI[monthElement][dayElement]
}

function randomDate(): Date {
  const year = CONFIG.startYear + Math.floor(Math.random() * (CONFIG.endYear - CONFIG.startYear + 1))
  const month = 1 + Math.floor(Math.random() * 12)
  const daysInMonth = new Date(year, month, 0).getDate()
  const day = 1 + Math.floor(Math.random() * daysInMonth)
  const hour = Math.floor(Math.random() * 24)
  const minute = Math.floor(Math.random() * 60)
  return new Date(year, month - 1, day, hour, minute)
}

interface FailCase {
  date: string
  expected: Record<string, string>
  actual: Record<string, string>
  errors: string[]
}

interface ValidationStats {
  total: number
  yearZhu: { pass: number; fail: number; accuracy: number }
  monthZhu: { pass: number; fail: number; accuracy: number }
  dayZhu: { pass: number; fail: number; accuracy: number }
  hourZhu: { pass: number; fail: number; accuracy: number }
  naYin: { pass: number; fail: number; accuracy: number }
  changSheng: { pass: number; fail: number; accuracy: number }
  shenShi: { pass: number; fail: number; accuracy: number }
  wangShuai: { pass: number; fail: number; accuracy: number }
  failCases: FailCase[]
}

function runTests(): ValidationStats {
  const stats: ValidationStats = {
    total: CONFIG.sampleSize,
    yearZhu: { pass: 0, fail: 0, accuracy: 0 },
    monthZhu: { pass: 0, fail: 0, accuracy: 0 },
    dayZhu: { pass: 0, fail: 0, accuracy: 0 },
    hourZhu: { pass: 0, fail: 0, accuracy: 0 },
    naYin: { pass: 0, fail: 0, accuracy: 0 },
    changSheng: { pass: 0, fail: 0, accuracy: 0 },
    shenShi: { pass: 0, fail: 0, accuracy: 0 },
    wangShuai: { pass: 0, fail: 0, accuracy: 0 },
    failCases: [],
  }

  console.log('='.repeat(70))
  console.log('八字排盘算法 - 100000组随机验证')
  console.log('='.repeat(70))
  console.log(`样本数量: ${CONFIG.sampleSize.toLocaleString()}`)
  console.log(`年份范围: ${CONFIG.startYear} - ${CONFIG.endYear}`)
  console.log(`参照标准: JDN日柱 + qimendunjia-standalone节气`)
  console.log('')

  const startTime = Date.now()

  for (let i = 0; i < CONFIG.sampleSize; i++) {
    const date = randomDate()
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

    const refDay = refDayGanZhi(date)
    const refYear = refYearGanZhi(date)
    const refMonth = refMonthGanZhi(date, refYear.gan)
    const refHour = refHourGanZhi(date, refDay.gan)

    const actualYear = getYearGanZhi(date)
    const actualMonth = getMonthGanZhi(date, actualYear.gan)
    const actualDay = getDayGanZhi(date)
    const actualHour = getHourGanZhi(date, actualDay.gan)

    const errors: string[] = []

    const refYearStr = refYear.gan + refYear.zhi
    const actualYearStr = actualYear.gan + actualYear.zhi
    if (refYearStr === actualYearStr) {
      stats.yearZhu.pass++
    } else {
      stats.yearZhu.fail++
      errors.push(`年柱: 期望${refYearStr}, 实际${actualYearStr}`)
    }

    const refMonthStr = refMonth.gan + refMonth.zhi
    const actualMonthStr = actualMonth.gan + actualMonth.zhi
    if (refMonthStr === actualMonthStr) {
      stats.monthZhu.pass++
    } else {
      stats.monthZhu.fail++
      errors.push(`月柱: 期望${refMonthStr}, 实际${actualMonthStr}`)
    }

    const refDayStr = refDay.gan + refDay.zhi
    const actualDayStr = actualDay.gan + actualDay.zhi
    if (refDayStr === actualDayStr) {
      stats.dayZhu.pass++
    } else {
      stats.dayZhu.fail++
      errors.push(`日柱: 期望${refDayStr}, 实际${actualDayStr}`)
    }

    const refHourStr = refHour.gan + refHour.zhi
    const actualHourStr = actualHour.gan + actualHour.zhi
    if (refHourStr === actualHourStr) {
      stats.hourZhu.pass++
    } else {
      stats.hourZhu.fail++
      errors.push(`时柱: 期望${refHourStr}, 实际${actualHourStr}`)
    }

    const refNaYinYear = refNaYin(refYear.gan, refYear.zhi)
    if (refNaYinYear === actualYear.naYin) {
      stats.naYin.pass++
    } else {
      stats.naYin.fail++
      errors.push(`纳音(年): 期望${refNaYinYear}, 实际${actualYear.naYin}`)
    }

    const refCSYear = refChangSheng(actualDay.gan, actualYear.zhi)
    const actualCSYear = getChangSheng(actualDay.gan, actualYear.zhi)
    if (refCSYear === actualCSYear) {
      stats.changSheng.pass++
    } else {
      stats.changSheng.fail++
      errors.push(`十二长生(年): 期望${refCSYear}, 实际${actualCSYear}`)
    }

    const refSSYear = refShenShi(actualDay.gan, actualYear.gan)
    const actualSSYear = calculateShenShi(actualDay.gan, actualYear.gan)
    if (refSSYear === actualSSYear) {
      stats.shenShi.pass++
    } else {
      stats.shenShi.fail++
      errors.push(`十神(年): 期望${refSSYear}, 实际${actualSSYear}`)
    }

    const refWS = refWangShuai(actualMonth.zhi, actualDay.gan)
    const actualWS = getWangShuai(getMonthMainElement(actualMonth.zhi), getStemElement(actualDay.gan))
    if (refWS === actualWS) {
      stats.wangShuai.pass++
    } else {
      stats.wangShuai.fail++
      errors.push(`旺衰: 期望${refWS}, 实际${actualWS}`)
    }

    if (errors.length > 0) {
      stats.failCases.push({
        date: dateStr,
        expected: {
          year: refYearStr,
          month: refMonthStr,
          day: refDayStr,
          hour: refHourStr,
          naYin: refNaYinYear,
          changSheng: refCSYear,
          shenShi: refSSYear,
          wangShuai: refWS,
        },
        actual: {
          year: actualYearStr,
          month: actualMonthStr,
          day: actualDayStr,
          hour: actualHourStr,
          naYin: actualYear.naYin,
          changSheng: actualCSYear,
          shenShi: actualSSYear,
          wangShuai: actualWS,
        },
        errors,
      })
    }

    if ((i + 1) % CONFIG.progressInterval === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
      const progress = ((i + 1) / CONFIG.sampleSize * 100).toFixed(0)
      console.log(`进度: ${(i + 1).toLocaleString()}/${CONFIG.sampleSize.toLocaleString()} (${progress}%) - 已用时 ${elapsed}s`)
    }
  }

  const keys: (keyof Omit<ValidationStats, 'total' | 'failCases'>)[] = [
    'yearZhu', 'monthZhu', 'dayZhu', 'hourZhu',
    'naYin', 'changSheng', 'shenShi', 'wangShuai',
  ]
  for (const key of keys) {
    stats[key].accuracy = stats.total > 0 ? (stats[key].pass / stats.total) * 100 : 0
  }

  return stats
}

function generateAccuracyJson(stats: ValidationStats): string {
  const data = {
    total: stats.total,
    items: {
      yearZhu: { name: '年柱', pass: stats.yearZhu.pass, fail: stats.yearZhu.fail, accuracy: Number(stats.yearZhu.accuracy.toFixed(4)) },
      monthZhu: { name: '月柱', pass: stats.monthZhu.pass, fail: stats.monthZhu.fail, accuracy: Number(stats.monthZhu.accuracy.toFixed(4)) },
      dayZhu: { name: '日柱', pass: stats.dayZhu.pass, fail: stats.dayZhu.fail, accuracy: Number(stats.dayZhu.accuracy.toFixed(4)) },
      hourZhu: { name: '时柱', pass: stats.hourZhu.pass, fail: stats.hourZhu.fail, accuracy: Number(stats.hourZhu.accuracy.toFixed(4)) },
      naYin: { name: '纳音', pass: stats.naYin.pass, fail: stats.naYin.fail, accuracy: Number(stats.naYin.accuracy.toFixed(4)) },
      changSheng: { name: '十二长生', pass: stats.changSheng.pass, fail: stats.changSheng.fail, accuracy: Number(stats.changSheng.accuracy.toFixed(4)) },
      shenShi: { name: '十神', pass: stats.shenShi.pass, fail: stats.shenShi.fail, accuracy: Number(stats.shenShi.accuracy.toFixed(4)) },
      wangShuai: { name: '旺衰', pass: stats.wangShuai.pass, fail: stats.wangShuai.fail, accuracy: Number(stats.wangShuai.accuracy.toFixed(4)) },
    },
    failCases: stats.failCases.slice(0, 100),
    generatedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

function generateCoverageHtml(stats: ValidationStats): string {
  const items = [
    { key: 'yearZhu', name: '年柱', pass: stats.yearZhu.pass, fail: stats.yearZhu.fail, accuracy: stats.yearZhu.accuracy, color: '#4F46E5' },
    { key: 'monthZhu', name: '月柱', pass: stats.monthZhu.pass, fail: stats.monthZhu.fail, accuracy: stats.monthZhu.accuracy, color: '#7C3AED' },
    { key: 'dayZhu', name: '日柱', pass: stats.dayZhu.pass, fail: stats.dayZhu.fail, accuracy: stats.dayZhu.accuracy, color: '#059669' },
    { key: 'hourZhu', name: '时柱', pass: stats.hourZhu.pass, fail: stats.hourZhu.fail, accuracy: stats.hourZhu.accuracy, color: '#0891B2' },
    { key: 'naYin', name: '纳音', pass: stats.naYin.pass, fail: stats.naYin.fail, accuracy: stats.naYin.accuracy, color: '#D97706' },
    { key: 'changSheng', name: '十二长生', pass: stats.changSheng.pass, fail: stats.changSheng.fail, accuracy: stats.changSheng.accuracy, color: '#DC2626' },
    { key: 'shenShi', name: '十神', pass: stats.shenShi.pass, fail: stats.shenShi.fail, accuracy: stats.shenShi.accuracy, color: '#0EA5E9' },
    { key: 'wangShuai', name: '旺衰', pass: stats.wangShuai.pass, fail: stats.wangShuai.fail, accuracy: stats.wangShuai.accuracy, color: '#14B8A6' },
  ]

  const avgAccuracy = items.reduce((sum, item) => sum + item.accuracy, 0) / items.length

  const failCaseRows = stats.failCases.slice(0, 20).map(fc => `
    <tr>
      <td class="px-4 py-2 border">${fc.date}</td>
      <td class="px-4 py-2 border">
        <div class="text-xs space-y-1">
          ${fc.errors.map(e => `<div class="text-red-600">${e}</div>`).join('')}
        </div>
      </td>
    </tr>
  `).join('')

  const barCharts = items.map(item => `
    <div class="mb-4">
      <div class="flex justify-between text-sm mb-1">
        <span class="font-medium">${item.name}</span>
        <span class="text-gray-600">${item.accuracy.toFixed(4)}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
        <div class="h-6 rounded-full flex items-center justify-end pr-2 text-xs text-white font-medium" 
             style="width: ${item.accuracy}%; background-color: ${item.color}">
          ${item.accuracy > 15 ? item.accuracy.toFixed(2) + '%' : ''}
        </div>
      </div>
      <div class="flex justify-between text-xs text-gray-500 mt-1">
        <span>通过: ${item.pass.toLocaleString()}</span>
        <span>失败: ${item.fail.toLocaleString()}</span>
      </div>
    </div>
  `).join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>八字排盘验证报告 - ${CONFIG.sampleSize.toLocaleString()}组随机测试</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #f3f4f6; color: #1f2937; }
  .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  .header { text-align: center; margin-bottom: 2rem; }
  .header h1 { font-size: 2rem; font-weight: bold; color: #111827; margin-bottom: 0.5rem; }
  .header p { color: #6b7280; }
  .card { background: white; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 1.5rem; margin-bottom: 1.5rem; }
  .card-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
  .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
  .summary-item { background: #f9fafb; border-radius: 0.5rem; padding: 1rem; text-align: center; }
  .summary-item .value { font-size: 1.75rem; font-weight: bold; }
  .summary-item .label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
  .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; text-align: left; padding: 0.75rem 1rem; font-weight: 600; border: 1px solid #e5e7eb; }
  td { border: 1px solid #e5e7eb; }
  .text-green { color: #059669; }
  .text-red { color: #dc2626; }
  .overall-score { font-size: 3rem; font-weight: bold; text-align: center; }
  .overall-score.excellent { color: #059669; }
  .overall-score.good { color: #d97706; }
  .overall-score.poor { color: #dc2626; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>八字排盘算法验证报告</h1>
    <p>${CONFIG.sampleSize.toLocaleString()} 组随机样本 · 年份范围 ${CONFIG.startYear}-${CONFIG.endYear} · 生成于 ${new Date().toLocaleString('zh-CN')}</p>
  </div>

  <div class="card">
    <div class="card-title">总体概览</div>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="value">${CONFIG.sampleSize.toLocaleString()}</div>
        <div class="label">总样本数</div>
      </div>
      <div class="summary-item">
        <div class="overall-score ${avgAccuracy >= 99 ? 'excellent' : avgAccuracy >= 95 ? 'good' : 'poor'}">${avgAccuracy.toFixed(2)}%</div>
        <div class="label">平均准确率</div>
      </div>
      <div class="summary-item">
        <div class="value text-red">${stats.failCases.length.toLocaleString()}</div>
        <div class="label">存在错误的样本</div>
      </div>
      <div class="summary-item">
        <div class="value text-green">${(CONFIG.sampleSize - stats.failCases.length).toLocaleString()}</div>
        <div class="label">全部通过的样本</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">各项准确率</div>
    ${barCharts}
  </div>

  <div class="charts-grid">
    <div class="card">
      <div class="card-title">通过率饼图</div>
      <canvas id="pieChart" height="250"></canvas>
    </div>
    <div class="card">
      <div class="card-title">各项目对比</div>
      <canvas id="barChart" height="250"></canvas>
    </div>
  </div>

  <div class="card">
    <div class="card-title">失败案例 (前 ${Math.min(20, stats.failCases.length)} 例)</div>
    ${stats.failCases.length === 0 ? '<p class="text-green-600 text-center py-8">🎉 完美！所有测试项全部通过</p>' : `
    <div style="overflow-x: auto;">
      <table>
        <thead>
          <tr><th>日期时间</th><th>错误详情</th></tr>
        </thead>
        <tbody>${failCaseRows}</tbody>
      </table>
    </div>`}
  </div>

  <div class="card">
    <div class="card-title">验证标准说明</div>
    <ul style="line-height: 1.8; padding-left: 1.5rem;">
      <li><strong>日柱：</strong>JDN 儒略日数公式计算（基准：2000-01-01 = JDN 2451545 = 戊午日）</li>
      <li><strong>年柱：</strong>使用 qimendunjia-standalone 的节气计算立春分界</li>
      <li><strong>月柱：</strong>使用 qimendunjia-standalone 的二十四节气分界 + 五虎遁月干</li>
      <li><strong>时柱：</strong>五鼠遁时干计算</li>
      <li><strong>纳音：</strong>六十甲子纳音表</li>
      <li><strong>十二长生：</strong>阳干顺行、阴干逆行</li>
      <li><strong>十神：</strong>基于五行生克和阴阳同异判断</li>
      <li><strong>旺衰：</strong>月令旺相休囚死</li>
    </ul>
  </div>
</div>

<script>
  const items = ${JSON.stringify(items.map(i => ({ name: i.name, pass: i.pass, fail: i.fail, accuracy: i.accuracy, color: i.color })))};

  const pieCtx = document.getElementById('pieChart').getContext('2d');
  const failTotal = items.reduce((s, i) => s + i.fail, 0);
  const passTotal = items.length * ${CONFIG.sampleSize} - failTotal;
  new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['通过', '失败'],
      datasets: [{
        data: [passTotal, failTotal],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      }
    }
  });

  const barCtx = document.getElementById('barChart').getContext('2d');
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: items.map(i => i.name),
      datasets: [{
        label: '准确率 (%)',
        data: items.map(i => i.accuracy),
        backgroundColor: items.map(i => i.color),
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      scales: {
        x: { min: 90, max: 100, grid: { color: '#f3f4f6' } },
        y: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return ctx.parsed.x.toFixed(4) + '%';
            }
          }
        }
      }
    }
  });
</script>
</body>
</html>`
}

const stats = runTests()

console.log('')
console.log('='.repeat(70))
console.log('验证结果统计')
console.log('='.repeat(70))
console.log(`年柱:     ${stats.yearZhu.accuracy.toFixed(4)}% (${stats.yearZhu.pass.toLocaleString()}/${stats.total.toLocaleString()})`)
console.log(`月柱:     ${stats.monthZhu.accuracy.toFixed(4)}% (${stats.monthZhu.pass.toLocaleString()}/${stats.total.toLocaleString()})`)
console.log(`日柱:     ${stats.dayZhu.accuracy.toFixed(4)}% (${stats.dayZhu.pass.toLocaleString()}/${stats.total.toLocaleString()})`)
console.log(`时柱:     ${stats.hourZhu.accuracy.toFixed(4)}% (${stats.hourZhu.pass.toLocaleString()}/${stats.total.toLocaleString()})`)
console.log(`纳音:     ${stats.naYin.accuracy.toFixed(4)}% (${stats.naYin.pass.toLocaleString()}/${stats.total.toLocaleString()})`)
console.log(`十二长生: ${stats.changSheng.accuracy.toFixed(4)}% (${stats.changSheng.pass.toLocaleString()}/${stats.total.toLocaleString()})`)
console.log(`十神:     ${stats.shenShi.accuracy.toFixed(4)}% (${stats.shenShi.pass.toLocaleString()}/${stats.total.toLocaleString()})`)
console.log(`旺衰:     ${stats.wangShuai.accuracy.toFixed(4)}% (${stats.wangShuai.pass.toLocaleString()}/${stats.total.toLocaleString()})`)
console.log('')
console.log(`失败样本: ${stats.failCases.length.toLocaleString()}/${stats.total.toLocaleString()}`)
console.log('')

const accuracyJson = generateAccuracyJson(stats)
writeFileSync('/workspace/scripts/bazi-tests/accuracy.json', accuracyJson, 'utf-8')
console.log('✓ accuracy.json 已保存')

const coverageHtml = generateCoverageHtml(stats)
writeFileSync('/workspace/scripts/bazi-tests/coverage.html', coverageHtml, 'utf-8')
console.log('✓ coverage.html 已保存')

console.log('')
console.log('验证完成！')

process.exit(stats.failCases.length === 0 ? 0 : 1)
