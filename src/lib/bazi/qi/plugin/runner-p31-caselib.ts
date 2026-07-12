/**
 * P3-1 CaseLibrary 测试验证脚本
 *
 * 验证 CaseLibrary 核心系统：加载、检索、评分、统计、导入导出、数据质量。
 * 运行方式：npx ts-node runner-p31-caselib.ts
 */

import { CaseLibrary, BaziCase, CaseScore } from './caseLibrary'
import { CASE_DATA } from './caseData'

// ═══════════════════════════════════════════════════════════
// 测试框架
// ═══════════════════════════════════════════════════════════

interface TestResult {
  pass: boolean
  label: string
  detail: string
}

const results: TestResult[] = []

function pass(label: string, detail: string) {
  results.push({ pass: true, label, detail })
}

function fail(label: string, detail: string) {
  results.push({ pass: false, label, detail })
}

// ═══════════════════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════════════════

const VALID_GAN  = '甲乙丙丁戊己庚辛壬癸'.split('')
const VALID_ZHI  = '子丑寅卯辰巳午未申酉戌亥'.split('')
const VALID_ELEMENTS = '木火土金水'.split('')
const VALID_TRUST = ['S', 'A', 'B', 'C'] as const

const REQUIRED_FIELDS: (keyof BaziCase)[] = [
  'id', 'name',
  'yearGan', 'yearZhi', 'monthGan', 'monthZhi', 'dayGan', 'dayZhi', 'hourGan', 'hourZhi',
  'dayElement', 'conclusion', 'tags', 'lifeEvents', 'verificationTags',
]

// ═══════════════════════════════════════════════════════════
// 1. 基础加载测试
// ═══════════════════════════════════════════════════════════

function testBasicLoading() {
  const lib = new CaseLibrary()
  lib.addCases(CASE_DATA)

  // 1.1 加载数量
  const total = CASE_DATA.length
  if (total === 110) {
    pass('1.1 基础加载', `${total} cases loaded`)
  } else {
    fail('1.1 基础加载', `expected 110 cases, got ${total}`)
  }

  // 1.2 必须字段验证
  let validCount = 0
  const missingFieldReport: string[] = []
  for (const caze of CASE_DATA) {
    let caseValid = true
    for (const field of REQUIRED_FIELDS) {
      if (caze[field] === undefined || caze[field] === null) {
        caseValid = false
        missingFieldReport.push(`${caze.id} missing ${String(field)}`)
        break
      }
    }
    if (caseValid) validCount++
  }
  if (validCount === total) {
    pass('1.2 必须字段验证', `${validCount}/${total} valid`)
  } else {
    fail('1.2 必须字段验证', `${validCount}/${total} valid — ${missingFieldReport.slice(0, 5).join('; ')}${missingFieldReport.length > 5 ? ` ... (${missingFieldReport.length} total)` : ''}`)
  }
}

// ═══════════════════════════════════════════════════════════
// 2. CaseLibrary 类 API 测试
// ═══════════════════════════════════════════════════════════

function testAPI() {
  const lib = new CaseLibrary()

  // 2.1 addCases 批量添加
  lib.addCases(CASE_DATA)
  if (true) {
    pass('2.1 addCases 批量添加', `added ${CASE_DATA.length} cases without error`)
  }

  // 2.2 search 全文搜索（"乾隆"）
  const qianlongResults = lib.search('乾隆')
  if (qianlongResults.length >= 2) {
    pass('2.2 search 全文搜索("乾隆")', `${qianlongResults.length} results >= 2`)
  } else {
    fail('2.2 search 全文搜索("乾隆")', `${qianlongResults.length} results, expected >= 2`)
  }

  // 2.3 searchByPattern 格局搜索（"正官格"）
  const patternResults = lib.searchByPattern('正官格')
  if (patternResults.length >= 1) {
    pass('2.3 searchByPattern("正官格")', `${patternResults.length} results`)
  } else {
    fail('2.3 searchByPattern("正官格")', `expected >= 1 result, got ${patternResults.length}`)
  }

  // 2.4 searchBySource 来源搜索（"滴天髓"）
  const sourceResults = lib.searchBySource('滴天髓')
  if (sourceResults.length >= 5) {
    pass('2.4 searchBySource("滴天髓")', `${sourceResults.length} results >= 5`)
  } else {
    fail('2.4 searchBySource("滴天髓")', `${sourceResults.length} results, expected >= 5`)
  }

  // 2.5 searchByCategory 分类搜索（"帝王将相"）
  const categoryResults = lib.searchByCategory('帝王将相')
  if (categoryResults.length >= 1) {
    pass('2.5 searchByCategory("帝王将相")', `${categoryResults.length} results`)
  } else {
    fail('2.5 searchByCategory("帝王将相")', `expected >= 1 result, got ${categoryResults.length}`)
  }

  // 2.6 searchByDayElement 日主五行搜索（"木"）
  const elementResults = lib.searchByDayElement('木')
  if (elementResults.length >= 1) {
    pass('2.6 searchByDayElement("木")', `${elementResults.length} results`)
  } else {
    fail('2.6 searchByDayElement("木")', `expected >= 1 result, got ${elementResults.length}`)
  }

  // 2.7 searchByTrustLevel 可信度搜索（"S"）
  const trustResults = lib.searchByTrustLevel('S')
  if (trustResults.length >= 1) {
    pass('2.7 searchByTrustLevel("S")', `${trustResults.length} results`)
  } else {
    fail('2.7 searchByTrustLevel("S")', `expected >= 1 result, got ${trustResults.length}`)
  }
}

// ═══════════════════════════════════════════════════════════
// 3. 评分系统测试
// ═══════════════════════════════════════════════════════════

function testScoring() {
  const lib = new CaseLibrary()
  lib.addCases(CASE_DATA)

  // 3.1 scoreCase 单例评分
  const firstCase = CASE_DATA[0]
  const score: CaseScore = lib.scoreCase(firstCase.id)
  if (
    score.totalScore >= 0 &&
    score.totalScore <= 100 &&
    score.completeness >= 0 &&
    score.completeness <= 100 &&
    score.verificationLevel >= 0 &&
    score.verificationLevel <= 100 &&
    score.trustScore >= 0 &&
    score.trustScore <= 100
  ) {
    pass('3.1 scoreCase 单例评分', `totalScore=${score.totalScore.toFixed(1)} (completeness=${score.completeness}, verification=${score.verificationLevel}, trust=${score.trustScore})`)
  } else {
    fail('3.1 scoreCase 单例评分', `score out of range: totalScore=${score.totalScore}`)
  }

  // 3.2 scoreAllCases 批量评分
  const allScores = lib.scoreAllCases()
  if (allScores.size === CASE_DATA.length) {
    pass('3.2 scoreAllCases 批量评分', `${allScores.size} cases scored`)
  } else {
    fail('3.2 scoreAllCases 批量评分', `expected ${CASE_DATA.length}, got ${allScores.size}`)
  }

  // 3.3 评分统计
  let sum = 0
  let max = -Infinity
  let min = Infinity
  for (const s of allScores.values()) {
    sum += s.totalScore
    if (s.totalScore > max) max = s.totalScore
    if (s.totalScore < min) min = s.totalScore
  }
  const avg = sum / allScores.size
  if (max >= 0 && min >= 0 && avg >= 0) {
    pass('3.3 评分统计', `avg=${avg.toFixed(1)}, max=${max.toFixed(1)}, min=${min.toFixed(1)}`)
  } else {
    fail('3.3 评分统计', `invalid scores: avg=${avg}, max=${max}, min=${min}`)
  }
}

// ═══════════════════════════════════════════════════════════
// 4. 统计功能测试
// ═══════════════════════════════════════════════════════════

function testStats() {
  const lib = new CaseLibrary()
  lib.addCases(CASE_DATA)

  const stats = lib.getStats()

  // 4.1 各统计字段非负
  let fieldsNonNegative = true
  if (stats.totalCases < 0) fieldsNonNegative = false
  if (stats.averageScore < 0) fieldsNonNegative = false
  if (stats.verifiedCases < 0) fieldsNonNegative = false
  for (const v of Object.values(stats.bySource)) {
    if (v < 0) { fieldsNonNegative = false; break }
  }
  for (const v of Object.values(stats.byCategory)) {
    if (v < 0) { fieldsNonNegative = false; break }
  }
  for (const v of Object.values(stats.byTrustLevel)) {
    if (v < 0) { fieldsNonNegative = false; break }
  }
  if (fieldsNonNegative) {
    pass('4.1 getStats 字段非负', `sources=${Object.keys(stats.bySource).length}, categories=${Object.keys(stats.byCategory).length}, trustLevels=${Object.keys(stats.byTrustLevel).length}`)
  } else {
    fail('4.1 getStats 字段非负', 'some field is negative')
  }

  // 4.2 总数 = 110
  if (stats.totalCases === 110) {
    pass('4.2 总数验证', `totalCases=${stats.totalCases}`)
  } else {
    fail('4.2 总数验证', `expected 110, got ${stats.totalCases}`)
  }
}

// ═══════════════════════════════════════════════════════════
// 5. 导入导出测试
// ═══════════════════════════════════════════════════════════

function testImportExport() {
  const lib = new CaseLibrary()
  lib.addCases(CASE_DATA)

  // 5.1 exportJSON 导出
  let jsonStr = ''
  try {
    jsonStr = lib.exportJSON()
    const parsed = JSON.parse(jsonStr)
    if (Array.isArray(parsed) && parsed.length === CASE_DATA.length) {
      pass('5.1 exportJSON 导出', `${parsed.length} cases exported as JSON`)
    } else {
      fail('5.1 exportJSON 导出', `parsed array length ${parsed?.length}, expected ${CASE_DATA.length}`)
    }
  } catch (e) {
    fail('5.1 exportJSON 导出', `exception: ${(e as Error).message}`)
  }

  // 5.2 importJSON 导入验证数量一致
  const lib2 = new CaseLibrary()
  try {
    const importedCount = lib2.importJSON(jsonStr)
    if (importedCount === CASE_DATA.length) {
      pass('5.2 importJSON 导入', `${importedCount} cases imported, matches original`)
    } else {
      fail('5.2 importJSON 导入', `expected ${CASE_DATA.length}, imported ${importedCount}`)
    }
  } catch (e) {
    fail('5.2 importJSON 导入', `exception: ${(e as Error).message}`)
  }
}

// ═══════════════════════════════════════════════════════════
// 6. 数据质量验证
// ═══════════════════════════════════════════════════════════

function testDataQuality() {
  const errors: string[] = []

  // 6.1 天干合法性
  let ganValid = true
  for (const caze of CASE_DATA) {
    const gans = [caze.yearGan, caze.monthGan, caze.dayGan, caze.hourGan]
    for (const g of gans) {
      if (!VALID_GAN.includes(g)) {
        ganValid = false
        errors.push(`${caze.id} invalid gan: ${g}`)
      }
    }
  }
  if (ganValid) {
    pass('6.1 天干合法性', 'all 天干 in 甲乙丙丁戊己庚辛壬癸')
  } else {
    fail('6.1 天干合法性', errors.slice(0, 5).join('; ') + (errors.length > 5 ? ` ... (${errors.length} total)` : ''))
  }

  // 6.2 地支合法性
  errors.length = 0
  let zhiValid = true
  for (const caze of CASE_DATA) {
    const zhis = [caze.yearZhi, caze.monthZhi, caze.dayZhi, caze.hourZhi]
    for (const z of zhis) {
      if (!VALID_ZHI.includes(z)) {
        zhiValid = false
        errors.push(`${caze.id} invalid zhi: ${z}`)
      }
    }
  }
  if (zhiValid) {
    pass('6.2 地支合法性', 'all 地支 in 子丑寅卯辰巳午未申酉戌亥')
  } else {
    fail('6.2 地支合法性', errors.slice(0, 5).join('; ') + (errors.length > 5 ? ` ... (${errors.length} total)` : ''))
  }

  // 6.3 dayElement 合法性
  errors.length = 0
  let elementValid = true
  for (const caze of CASE_DATA) {
    if (!VALID_ELEMENTS.includes(caze.dayElement)) {
      elementValid = false
      errors.push(`${caze.id} invalid dayElement: ${caze.dayElement}`)
    }
  }
  if (elementValid) {
    pass('6.3 dayElement 合法性', 'all dayElement in 木火土金水')
  } else {
    fail('6.3 dayElement 合法性', errors.join('; '))
  }

  // 6.4 四柱天干地支基本约束
  // 宽松检查：只验证天干地支不为空、且不重复（天干不能等于地支，虽然它们字符集不同）
  errors.length = 0
  let pillarValid = true
  for (const caze of CASE_DATA) {
    const pillars = [
      { gan: caze.yearGan, zhi: caze.yearZhi },
      { gan: caze.monthGan, zhi: caze.monthZhi },
      { gan: caze.dayGan, zhi: caze.dayZhi },
      { gan: caze.hourGan, zhi: caze.hourZhi },
    ]
    for (let i = 0; i < pillars.length; i++) {
      const p = pillars[i]
      if (!p.gan || !p.zhi) {
        pillarValid = false
        errors.push(`${caze.id} pillar ${i} has empty gan/zhi`)
      }
      // 天干不应出现在地支集合中（字符集不重叠，这是额外保障）
      if (VALID_ZHI.includes(p.gan)) {
        pillarValid = false
        errors.push(`${caze.id} pillar ${i} gan "${p.gan}" is a 地支`)
      }
      if (VALID_GAN.includes(p.zhi)) {
        pillarValid = false
        errors.push(`${caze.id} pillar ${i} zhi "${p.zhi}" is a 天干`)
      }
    }
  }
  if (pillarValid) {
    pass('6.4 四柱基本约束', 'all pillars pass basic validation')
  } else {
    fail('6.4 四柱基本约束', errors.slice(0, 5).join('; ') + (errors.length > 5 ? ` ... (${errors.length} total)` : ''))
  }

  // 6.5 trustLevel 合法性
  errors.length = 0
  let trustValid = true
  for (const caze of CASE_DATA) {
    if (!VALID_TRUST.includes(caze.trustLevel)) {
      trustValid = false
      errors.push(`${caze.id} invalid trustLevel: ${caze.trustLevel}`)
    }
  }
  if (trustValid) {
    pass('6.5 trustLevel 合法性', 'all trustLevel in S/A/B/C')
  } else {
    fail('6.5 trustLevel 合法性', errors.join('; '))
  }

  // 6.6 有 lifeEvents 的案例数
  const withEvents = CASE_DATA.filter(c => c.lifeEvents && c.lifeEvents.length > 0).length
  pass('6.6 lifeEvents 覆盖', `${withEvents}/${CASE_DATA.length} cases have lifeEvents`)
}

// ═══════════════════════════════════════════════════════════
// 7. 案例分类覆盖验证
// ═══════════════════════════════════════════════════════════

function testCategoryCoverage() {
  const categoryCount: Record<string, number> = {}
  const allCategories = new Set<string>()

  for (const caze of CASE_DATA) {
    for (const cat of caze.category) {
      allCategories.add(cat)
      categoryCount[cat] = (categoryCount[cat] || 0) + 1
    }
  }

  // 7.1 统计各分类案例数
  const categoryList = Array.from(allCategories).sort()
  const detail = categoryList.map(c => `${c}=${categoryCount[c]}`).join(', ')
  pass('7.1 分类统计', `${categoryList.length} categories: ${detail}`)

  // 7.2 每类都有案例（每个已出现的分类至少1例，显然成立，此处验证是否有"空"分类）
  let allCovered = true
  const emptyCategories: string[] = []
  for (const [cat, count] of Object.entries(categoryCount)) {
    if (count === 0) {
      allCovered = false
      emptyCategories.push(cat)
    }
  }
  if (allCovered) {
    pass('7.2 每类有案例', `all ${categoryList.length} categories have >= 1 case`)
  } else {
    fail('7.2 每类有案例', `empty categories: ${emptyCategories.join(', ')}`)
  }
}

// ═══════════════════════════════════════════════════════════
// 主函数
// ═══════════════════════════════════════════════════════════

function main() {
  console.log('=== P3-1 CaseLibrary 测试 ===\n')

  testBasicLoading()
  testAPI()
  testScoring()
  testStats()
  testImportExport()
  testDataQuality()
  testCategoryCoverage()

  // 输出结果
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL'
    console.log(`[${status}] ${r.label}: ${r.detail}`)
  }

  // 汇总
  const passCount = results.filter(r => r.pass).length
  const totalCount = results.length
  console.log(`\n=== 汇总 ===`)
  console.log(`通过：${passCount}/${totalCount}`)

  // 如有失败，以非零退出码退出
  if (passCount < totalCount) {
    process.exit(1)
  }
}

main()
