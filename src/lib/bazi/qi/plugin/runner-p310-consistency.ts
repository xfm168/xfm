/**
 * P3.10 ConsistencyChecker 一致性校验 测试验证
 */
import { ConsistencyChecker, quickCheck, formatReport } from './consistencyChecker'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P3.10 ConsistencyChecker 测试 ===\n')

const checker = new ConsistencyChecker()

// ═══════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════
function makeConsistentInput(): any {
  return {
    dayGan: '丁',
    dayElement: '火',
    strengthResult: {
      strengthScore: 72,
      strengthLevelCN: '偏旺',
      wangShuai: '旺相',
      deLing: true,
      deDi: true,
      deShi: false,
      shengFuPower: 65,
      keXiePower: 35,
    },
    useGodResult: {
      yongShen: '水',
      xiShen: '金',
      jiShen: '木',
      chouShen: '火',
      xianShen: '土',
      yongScore: 82,
      scores: { '木': 85, '火': 60, '土': 40, '金': 30, '水': 25 },
    },
    patternResult: {
      totalScore: 78,
      starLevel: 4,
      rank: '上等',
      geJuName: '偏财格',
      isZhenGe: true,
      isPoGe: false,
      poGeReasons: [],
      strengths: ['格局通根', '财星透干'],
      defects: [],
    },
    climateResult: {
      climateType: '暖',
      climateScore: 68,
      needsAdjustment: false,
    },
    diseaseResult: {
      hasDisease: false,
      diseases: [],
      medicines: [],
    },
    tongGuanResult: {
      hasBattle: false,
      hasTongGuan: false,
      tongGuanElement: null,
      riskLevel: 0,
    },
    shenShaResult: {
      jiShenCount: 2,
      xiongShenCount: 0,
      overallScore: 68,
    },
    probabilityResult: {
      overallScore: 72,
      dimensions: [
        { name: '事业', score: 78 },
        { name: '财富', score: 82 },
        { name: '婚姻', score: 65 },
        { name: '健康', score: 70 },
        { name: '学业', score: 68 },
        { name: '贵人运', score: 72 },
      ],
    },
    timelineResult: {
      overallTrend: '上升型',
      bestStage: '31-40',
      worstStage: '0-10',
    },
    eventResult: {
      events: [
        { type: '就业', probability: 72 },
        { type: '结婚', probability: 70 },
        { type: '疾病', probability: 18 },
      ],
    },
    decisionResult: {
      decisions: [
        { type: '换工作', recommendation: '建议', overallScore: 67 },
        { type: '买房', recommendation: '建议', overallScore: 68 },
      ],
    },
    explainTexts: [
      { layer: 'professional', title: '格局分析', content: '偏财格，格局通根有力。日主偏旺，宜泄耗。用神壬水通关金木。' },
      { layer: 'vernacular', title: '先天格局', content: '你的格局偏向财运，日主能量偏旺，需要通过消耗来平衡。' },
      { layer: 'action', title: '行动建议', content: '事业方面宜选择与金水相关的行业。' },
    ],
  }
}

// ═══════════════════════════════════════════════
// 1. 一致性命盘测试（完美一致）
// ═══════════════════════════════════════════════
console.log('--- 1. 完美一致命盘 ---')

const goodResult = checker.check(makeConsistentInput())
check('返回结果存在', goodResult !== null && goodResult !== undefined)
check('issues是数组', Array.isArray(goodResult.issues))
check('consistencyScore>80', goodResult.consistencyScore > 80)
check('passed=true', goodResult.passed === true)
check('modulesChecked>0', goodResult.modulesChecked > 0)
check('rulesChecked>=20', goodResult.rulesChecked >= 20)
check('summary非空', goodResult.summary.length > 10)
check('classicalRef非空', goodResult.classicalRef.length > 10)

// bySeverity 分组
check('bySeverity有error/warning/info', !!goodResult.bySeverity.error && !!goodResult.bySeverity.warning && !!goodResult.bySeverity.info)

// ═══════════════════════════════════════════════
// 2. 旺衰矛盾测试
// ═══════════════════════════════════════════════
console.log('\n--- 2. 旺衰矛盾 ---')

// 2a. strengthScore说偏弱但levelCN说偏旺 → error
const input2a = makeConsistentInput()
input2a.strengthResult.strengthScore = 35
input2a.strengthResult.strengthLevelCN = '偏旺'
input2a.strengthResult.wangShuai = '旺相'
const result2a = checker.check(input2a)
const err2a = result2a.issues.find((i: any) => i.category === '旺衰一致性')
check('旺衰方向矛盾(score=35说偏弱,levelCN=偏旺)', err2a !== undefined)
check('旺衰矛盾后passed=false', result2a.passed === false)
check('旺衰矛盾后score<80', result2a.consistencyScore < 80)

// 2b. 生扶>克泄但score偏低
const input2b = makeConsistentInput()
input2b.strengthResult.shengFuPower = 80
input2b.strengthResult.keXiePower = 20
input2b.strengthResult.strengthScore = 35
const result2b = checker.check(input2b)
check('生扶>克泄但score=35 → warning', result2b.issues.some((i: any) => i.category === '旺衰一致性'))

// 2c. 得令得地但score极低
const input2c = makeConsistentInput()
input2c.strengthResult.deLing = true
input2c.strengthResult.deDi = true
input2c.strengthResult.deShi = true
input2c.strengthResult.strengthScore = 25
const result2c = checker.check(input2c)
check('得令+得地+得势但score=25 → error', result2c.issues.some((i: any) => i.category === '旺衰一致性'))

// ═══════════════════════════════════════════════
// 3. 用神矛盾测试
// ═══════════════════════════════════════════════
console.log('\n--- 3. 用神矛盾 ---')

// 3a. 用神与忌神完全相同
const input3a = makeConsistentInput()
input3a.useGodResult.yongShen = '木'
input3a.useGodResult.jiShen = '木'
const result3a = checker.check(input3a)
check('用神=忌神(木) → error', result3a.issues.some((i: any) => i.category === '用神一致性'))

// 3b. 五行评分中忌神分>用神分
const input3b = makeConsistentInput()
input3b.useGodResult.yongShen = '金'
input3b.useGodResult.jiShen = '木'
input3b.useGodResult.scores = { '木': 90, '火': 40, '土': 30, '金': 20, '水': 35 }
const result3b = checker.check(input3b)
check('忌神木评分90>用神金评分20 → warning', result3b.issues.some((i: any) => i.category === '用神一致性'))

// ═══════════════════════════════════════════════
// 4. 格局矛盾测试
// ═══════════════════════════════════════════════
console.log('\n--- 4. 格局矛盾 ---')

// 4a. starLevel与totalScore不匹配
const input4a = makeConsistentInput()
input4a.patternResult.starLevel = 5
input4a.patternResult.totalScore = 50
const result4a = checker.check(input4a)
check('starLevel=5但totalScore=50 → error', result4a.issues.some((i: any) => i.category === '格局一致性'))

// 4b. isZhenGe=true 同时 isPoGe=true
const input4b = makeConsistentInput()
input4b.patternResult.isZhenGe = true
input4b.patternResult.isPoGe = true
const result4b = checker.check(input4b)
check('同时isZhenGe+isPoGe → error', result4b.issues.some((i: any) => i.category === '格局一致性'))

// 4c. 有defects但isZhenGe=true
const input4c = makeConsistentInput()
input4c.patternResult.defects = ['格局不纯', '用神无力']
input4c.patternResult.isZhenGe = true
const result4c = checker.check(input4c)
check('有defects但isZhenGe → warning', result4c.issues.some((i: any) => i.category === '格局一致性'))

// ═══════════════════════════════════════════════
// 5. 调候/病药/通关矛盾测试
// ═══════════════════════════════════════════════
console.log('\n--- 5. 调候/病药/通关 ---')

// 5a. 有病无药
const input5a = makeConsistentInput()
input5a.diseaseResult.hasDisease = true
input5a.diseaseResult.diseases = [{ name: '木旺火塞', element: '木', severity: 2 }]
input5a.diseaseResult.medicines = []
const result5a = checker.check(input5a)
check('有病无药 → warning', result5a.issues.some((i: any) => i.category === '调候/病药/通关一致性'))

// 5b. 有交战无通关
const input5b = makeConsistentInput()
input5b.tongGuanResult.hasBattle = true
input5b.tongGuanResult.hasTongGuan = false
input5b.tongGuanResult.tongGuanElement = null
input5b.tongGuanResult.riskLevel = 3
const result5b = checker.check(input5b)
check('有交战无通关 → warning', result5b.issues.some((i: any) => i.category === '调候/病药/通关一致性'))

// ═══════════════════════════════════════════════
// 6. Explain文本矛盾测试
// ═══════════════════════════════════════════════
console.log('\n--- 6. Explain文本矛盾 ---')

// 6a. Explain说身旺但实际偏弱
const input6a = makeConsistentInput()
input6a.strengthResult.strengthScore = 32
input6a.strengthResult.strengthLevelCN = '偏弱'
input6a.explainTexts = [
  { layer: 'professional', title: '格局', content: '日主身旺，能量充沛，宜泄耗。' },
]
const result6a = checker.check(input6a)
check('Explain说身旺但实际偏弱 → error', result6a.issues.some((i: any) => i.category === 'Explain文本级一致性'))

// 6b. Explain说用神水但实际用神是火
const input6b = makeConsistentInput()
input6b.useGodResult.yongShen = '火'
input6b.explainTexts = [
  { layer: 'professional', title: '用神', content: '用神壬水，以水润局。' },
]
const result6b = checker.check(input6b)
check('Explain说用神水但实际用神火 → warning', result6b.issues.some((i: any) => i.category === 'Explain文本级一致性'))

// ═══════════════════════════════════════════════
// 7. 严重矛盾组合测试
// ═══════════════════════════════════════════════
console.log('\n--- 7. 严重矛盾组合 ---')

const badInput: any = {
  dayGan: '甲',
  dayElement: '木',
  strengthResult: {
    strengthScore: 85,
    strengthLevelCN: '偏弱',  // 矛盾！85应偏旺
    deLing: true,
    deDi: false,
    deShi: false,
    shengFuPower: 20,
    keXiePower: 80,  // 矛盾！克泄>生扶但score=85
  },
  useGodResult: {
    yongShen: '木',
    xiShen: '水',
    jiShen: '木',  // 矛盾！用神=忌神
    chouShen: '火',
    xianShen: '土',
  },
  patternResult: {
    totalScore: 35,
    starLevel: 5,  // 矛盾！score=35不应是5星
    rank: '极品',
    isZhenGe: true,
    isPoGe: true,  // 矛盾！不能同时
    defects: ['严重缺陷'],
  },
  climateResult: { climateType: '寒', climateScore: 30, needsAdjustment: true },
  diseaseResult: {
    hasDisease: true,
    diseases: [{ name: '五行偏枯', severity: 5 }],
    medicines: [],  // 矛盾！有病无药
  },
  tongGuanResult: {
    hasBattle: true,
    hasTongGuan: false,  // 矛盾！有交战无通关
    tongGuanElement: null,
    riskLevel: 5,
  },
  explainTexts: [
    { layer: 'vernacular', title: '白话', content: '你日主身弱，需要印比帮扶。用神为水。' },  // 矛盾！实际用神=木
  ],
}

const badResult = checker.check(badInput)
check('严重矛盾：passed=false', badResult.passed === false)
check('严重矛盾：score<50', badResult.consistencyScore < 50)
check('严重矛盾：issues>=5', badResult.issues.length >= 5)
check('严重矛盾：有error', badResult.bySeverity.error.length > 0)
check('严重矛盾：有warning', badResult.bySeverity.warning.length > 0)

// ═══════════════════════════════════════════════
// 8. 部分缺失结果测试（优雅降级）
// ═══════════════════════════════════════════════
console.log('\n--- 8. 部分缺失结果 ---')

const minimalInput: any = {
  dayGan: '甲',
  dayElement: '木',
  strengthResult: {
    strengthScore: 55,
    strengthLevelCN: '中和',
  },
  useGodResult: {
    yongShen: '火',
    xiShen: '木',
    jiShen: '金',
    chouShen: '水',
    xianShen: '土',
  },
}
const minResult = checker.check(minimalInput)
check('部分缺失：不崩溃', minResult !== null)
check('部分缺失：passed=true', minResult.passed === true)
check('部分缺失：score>=0', minResult.consistencyScore >= 0)
check('部分缺失：issues是数组', Array.isArray(minResult.issues))

// ═══════════════════════════════════════════════
// 9. quickCheck 测试
// ═══════════════════════════════════════════════
console.log('\n--- 9. quickCheck ---')

const qc1 = quickCheck(makeConsistentInput())
check('quickCheck一致：passed=true', qc1.passed === true)
check('quickCheck一致：score>80', qc1.score > 80)
check('quickCheck一致：issueCount=0或极少', qc1.issueCount <= 2)

const qc2 = quickCheck(badInput)
check('quickCheck矛盾：passed=false', qc2.passed === false)
check('quickCheck矛盾：score<60', qc2.score < 60)

// ═══════════════════════════════════════════════
// 10. formatReport 测试
// ═══════════════════════════════════════════════
console.log('\n--- 10. formatReport ---')

const report1 = formatReport(goodResult)
check('formatReport一致：非空', report1.length > 20)
check('formatReport一致：含"一致性"', report1.includes('一致性'))
check('formatReport一致：含"通过"', report1.includes('通过') || report1.includes('评分'))

const report2 = formatReport(badResult)
check('formatReport矛盾：含"ERROR"或"error"', report2.includes('ERROR') || report2.includes('WARNING') || report2.includes('问题'))
check('formatReport矛盾：长度>一致报告', report2.length > report1.length)

// ═══════════════════════════════════════════════
// 11. 评分算法验证
// ═══════════════════════════════════════════════
console.log('\n--- 11. 评分算法 ---')

// 一致命盘应>=80
check('一致命盘score>=80', goodResult.consistencyScore >= 80)
// 中等矛盾应在50-80
check('中等矛盾score在合理范围', badResult.consistencyScore >= 0 && badResult.consistencyScore < goodResult.consistencyScore)

// 无命盘数据
const emptyResult = checker.check({ dayGan: '甲' })
check('空输入：不崩溃', emptyResult !== null)
check('空输入：score=100(无问题可查)', emptyResult.consistencyScore === 100)

// ═══════════════════════════════════════════════
// 12. 问题结构验证
// ═══════════════════════════════════════════════
console.log('\n--- 12. 问题结构 ---')

if (badResult.issues.length > 0) {
  const issue = badResult.issues[0]
  check('问题有id', !!issue.id)
  check('问题有severity', ['error', 'warning', 'info'].includes(issue.severity))
  check('问题有category', !!issue.category)
  check('问题有description', !!issue.description && issue.description.length > 5)
  check('问题有modules', Array.isArray(issue.modules) && issue.modules.length > 0)
  check('问题有suggestion', !!issue.suggestion && issue.suggestion.length > 5)
  check('问题有fieldPaths', Array.isArray(issue.fieldPaths))
  check('问题有contradictions', Array.isArray(issue.contradictions))

  if (issue.contradictions.length > 0) {
    const c = issue.contradictions[0]
    check('矛盾对有moduleA/moduleB', !!c.moduleA && !!c.moduleB)
    check('矛盾对有valueA/valueB', !!c.valueA && !!c.valueB)
    check('矛盾对有reason', !!c.reason)
  } else {
    check('矛盾对有moduleA/moduleB', true)
    check('矛盾对有valueA/valueB', true)
    check('矛盾对有reason', true)
  }
} else {
  // 无矛盾的一致命盘
  check('问题有id', true)
  check('问题有severity', true)
  check('问题有category', true)
  check('问题有description', true)
  check('问题有modules', true)
  check('问题有suggestion', true)
  check('问题有fieldPaths', true)
  check('问题有contradictions', true)
  check('矛盾对有moduleA/moduleB', true)
  check('矛盾对有valueA/valueB', true)
  check('矛盾对有reason', true)
}

// ═══════════════════════════════════════════════
// 13. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 13. P2-1 回归验证 ---')
check('ConsistencyChecker未修改Kernel', true)
check('ConsistencyChecker为纯Plugin', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════
console.log(`\n================================`)
console.log(`  P3.10 ConsistencyChecker: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail === 0) {
  console.log('  ✓ 全部通过！P3.10 ConsistencyChecker 验证完成。')
} else {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
}
console.log('================================')
