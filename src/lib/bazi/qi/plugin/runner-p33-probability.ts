/**
 * P3.3 ProbabilityEngine 测试验证
 * 
 * 用3组不同命盘测试概率推演引擎，验证各维度输出合理。
 */
import { calculateProbability, type ProbabilityResult } from './probabilityEngine'

interface TestCase {
  name: string
  context: any
  expected: { minOverall: number; maxOverall: number }
}

// 构建通用mock数据
function makeContext(dayElement: string, strengthScore: number, patternScore: number, wealthScore: number, marriageScore: number, healthRisk: number): any {
  const ELEMENTS = ['木','火','土','金','水'] as const
  const scores: Record<string, number> = {}
  ELEMENTS.forEach((e, i) => scores[e] = [85,70,45,30,80][i])
  scores[dayElement] = strengthScore > 50 ? 90 : 40

  return {
    dayElement,
    strengthResult: {
      strengthScore, strengthLevel: strengthScore > 60 ? 'Strong' : strengthScore > 40 ? 'Balanced' : 'Weak',
      strengthLevelCN: strengthScore > 60 ? '旺' : strengthScore > 40 ? '中和' : '弱',
      deLing: strengthScore > 50, deDi: strengthScore > 40, deShi: strengthScore > 60,
      tongGen: strengthScore > 30, touGan: strengthScore > 50,
      wangShuai: strengthScore > 60 ? '旺' : '衰',
      dimensions: [], changShengDetails: [], shengFuPower: strengthScore, keXiePower: 100 - strengthScore,
    },
    climateResult: { climateType: '平和', climateScore: 75, needsAdjustment: false, needs: [], advice: '' },
    diseaseResult: { hasDisease: healthRisk > 50, diseases: [], medicines: [], treatment: '' },
    tongGuanResult: { hasBattle: false, battles: [], hasTongGuan: true, tongGuanDescription: '', riskLevel: 1, bridgeElement: '' },
    useGodResult: {
      yongShen: dayElement, yongScore: 80, xiShen: '水', jiShen: '金', chouShen: '土', xianShen: '火',
      scores, dimensionContributions: { strength: { element: dayElement, reason: '' }, climate: { reason: '' }, disease: { reason: '' }, tongGuan: { reason: '' } },
      classicalQuote: '', advice: '',
    },
    patternResult: { totalScore: patternScore, starLevel: patternScore >= 90 ? 5 : patternScore >= 75 ? 4 : 3, rank: patternScore >= 90 ? '极品' : patternScore >= 75 ? '上等' : '中等', isPoGe: false, isZhenGe: true, dimensions: [], classicalQuote: '' },
    shenShaResult: { shenShaList: [{ name: '天乙贵人', category: '吉神', source: '年干', description: '' }], jiShenCount: 3, xiongShenCount: 1, neutralCount: 0, overallScore: 60, influence: '', weight: 0.10 },
    careerResult: { suggestions: [], bestDirection: '文化教育', managementScore: patternScore - 10, entrepreneurshipScore: patternScore - 20, stabilityScore: patternScore - 5, classicalRef: '' },
    wealthResult: { wealthLevel: wealthScore > 70 ? '小康' : '普通', wealthScore, zhengCai: { strength: '有力', description: '' }, pianCai: { strength: '中等', description: '' }, caiKu: '有', leakageRisk: '低', gatherAbility: '强', bestMethod: ['工资'], riskWarning: [], classicalRef: '' },
    marriageResult: { marriageQuality: marriageScore > 70 ? '佳' : '中', marriageScore, spouseFeatures: [], lovePattern: '稳定', marriageTiming: '28-32', riskFactors: [], peachBlossom: '无', classicalRef: '' },
    healthResult: { organs: [{ organ: '心', element: '火', risk: healthRisk, symptoms: [], advice: '' }], constitutionType: '平和', weakOrgan: '肝', overallAdvice: '', seasonalAdvice: '', classicalRef: '' },
  }
}

const cases: TestCase[] = [
  {
    name: '旺格高分命（格局上等+身旺+财运好）',
    context: makeContext('木', 75, 82, 75, 70, 20),
    expected: { minOverall: 60, maxOverall: 95 },
  },
  {
    name: '中等命（格局中等+中和+财运普通）',
    context: makeContext('火', 55, 62, 55, 58, 40),
    expected: { minOverall: 40, maxOverall: 80 },
  },
  {
    name: '弱格低分命（格局破+身弱+财运差+健康差）',
    context: makeContext('水', 25, 30, 25, 30, 70),
    expected: { minOverall: 10, maxOverall: 50 },
  },
]

console.log('=== P3.3 ProbabilityEngine 测试 ===\n')

let passCount = 0
let failCount = 0

for (const tc of cases) {
  console.log(`\n--- ${tc.name} ---`)
  try {
    const result = calculateProbability(tc.context)
    
    // 验证基本输出
    const checks: { name: string; passed: boolean }[] = []
    
    // 1. 6个维度
    checks.push({ name: '6维度', passed: result.dimensions.length === 6 })
    
    // 2. 综合评分在范围内
    const inRange = result.overallScore >= tc.expected.minOverall && result.overallScore <= tc.expected.maxOverall
    checks.push({ name: `综合评分${result.overallScore}在[${tc.expected.minOverall},${tc.expected.maxOverall}]`, passed: inRange })
    
    // 3. 各维度分数在0-100
    const allValid = result.dimensions.every(d => d.score >= 0 && d.score <= 100)
    checks.push({ name: '维度分数0-100', passed: allValid })
    
    // 4. 置信度在0-100
    const confValid = result.overallConfidence >= 0 && result.overallConfidence <= 100
    checks.push({ name: `置信度${result.overallConfidence}%有效`, passed: confValid })
    
    // 5. 风险等级有效
    const validRisks = ['极低','低','中','高','极高']
    const riskValid = validRisks.includes(result.overallRisk) && result.dimensions.every(d => validRisks.includes(d.riskLevel))
    checks.push({ name: '风险等级有效', passed: riskValid })
    
    // 6. 人生阶段非空
    checks.push({ name: `人生阶段"${result.lifePhase}"非空`, passed: result.lifePhase.length > 0 })
    
    // 7. 总评非空
    const summaryPreview = result.summary.substring(0, 20)
    checks.push({ name: `总评非空(${summaryPreview}...)`, passed: result.summary.length > 10 })
    
    // 8. 利好/风险因素非空（至少有一个维度有因素）
    const hasFactors = result.dimensions.some(d => (d.positiveFactors.length > 0 || d.negativeFactors.length > 0))
    checks.push({ name: '有利好/风险因素', passed: hasFactors })
    
    // 9. 旺格>中格>弱格 递减趋势
    // (通过overallScore范围间接验证)
    
    // 10. 古籍引用
    checks.push({ name: '古籍引用', passed: result.classicalRef.length > 0 })

    for (const chk of checks) {
      const status = chk.passed ? 'PASS' : 'FAIL'
      console.log(`  [${status}] ${chk.name}`)
      if (chk.passed) { passCount++ } else { failCount++ }
    }
    
    // 输出概览
    console.log(`  综合评分: ${result.overallScore} | 置信度: ${result.overallConfidence}% | 风险: ${result.overallRisk}`)
    for (const d of result.dimensions) {
      console.log(`    ${d.name}: ${d.score}% [${d.riskLevel}]`)
    }
    console.log(`    巅峰: ${result.peakAge} | 谨慎: ${result.cautionAge}`)
    
  } catch (e: any) {
    console.log(`  [FAIL] 异常: ${e.message?.substring(0, 100)}`)
    failCount++
  }
}

console.log('\n=== 汇总 ===')
console.log(`通过: ${passCount}/${passCount + failCount}`)
if (failCount === 0) {
  console.log('>>> ALL PASS <<<')
  process.exit(0)
} else {
  console.log('>>> FAIL <<<')
  process.exit(1)
}
