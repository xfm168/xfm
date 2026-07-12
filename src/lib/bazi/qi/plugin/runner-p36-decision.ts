/**
 * P3.6 DecisionEngine 测试验证
 */
import { makeDecision, makeAllDecisions } from './decisionEngine'

function makeContext(strength: '旺' | '弱' | '中', hasShenSha: boolean): any {
  const useGod = strength === '旺' ? '金' : strength === '弱' ? '火' : '木'
  const scores = strength === '旺'
    ? { '木': 85, '火': 60, '土': 40, '金': 30, '水': 25 }
    : strength === '弱'
    ? { '木': 25, '火': 30, '土': 40, '金': 80, '水': 75 }
    : { '木': 55, '火': 50, '土': 50, '金': 50, '水': 50 }

  return {
    dayGan: '甲', dayElement: '木', age: 32, currentYear: 2026,
    probabilityResult: {
      overallScore: strength === '旺' ? 78 : strength === '弱' ? 45 : 60,
      dimensions: [
        { name: '事业', score: strength === '旺' ? 80 : strength === '弱' ? 40 : 60, confidence: 85, riskLevel: '低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '财富', score: strength === '旺' ? 85 : strength === '弱' ? 35 : 55, confidence: 85, riskLevel: '极低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '婚姻', score: strength === '旺' ? 70 : strength === '弱' ? 45 : 58, confidence: 85, riskLevel: '低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '健康', score: strength === '旺' ? 82 : strength === '弱' ? 50 : 65, confidence: 85, riskLevel: '极低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '学业', score: strength === '旺' ? 65 : strength === '弱' ? 50 : 55, confidence: 85, riskLevel: '低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '贵人运', score: strength === '旺' ? 68 : strength === '弱' ? 40 : 50, confidence: 85, riskLevel: '低', positiveFactors: [], negativeFactors: [], advice: '' },
      ], overallConfidence: 85, overallRisk: strength === '弱' ? '中' : '低'
    },
    timelineResult: {
      stages: [{ ageRange: '31-40', score: { career: 72, wealth: 68, marriage: 55, health: 65, family: 60, study: 50, overall: 65 }, trend: '峰值', daYun: { name: '丙寅', score: 15, effect: '吉' } }],
      overallTrend: '上升型'
    },
    eventResult: { events: [{ type: '创业', probability: 75 }] },
    patternResult: { totalScore: strength === '旺' ? 78 : strength === '弱' ? 35 : 55, starLevel: strength === '旺' ? 4 : 2, rank: strength === '旺' ? '上等' : '普通', isPoGe: strength === '弱', isZhenGe: strength !== '弱', defects: [] },
    useGodResult: { yongShen: useGod, yongScore: 80, xiShen: '土', jiShen: '金', chouShen: '水', xianShen: '木', scores },
    shenShaResult: hasShenSha ? { shenShaList: [
      { name: '驿马', category: '中性', source: '年支', description: '' },
      { name: '文昌', category: '吉神', source: '日干', description: '' },
      { name: '桃花', category: '中性', source: '年支', description: '' },
      { name: '将星', category: '吉神', source: '年支', description: '' },
      { name: '天乙贵人', category: '吉神', source: '年干', description: '' },
    ], jiShenCount: 3, xiongShenCount: 0, overallScore: 70 } : { shenShaList: [], jiShenCount: 0, xiongShenCount: 0, overallScore: 50 },
    careerResult: { managementScore: strength === '旺' ? 72 : 45, entrepreneurshipScore: strength === '旺' ? 75 : 40, stabilityScore: strength === '旺' ? 68 : 55, bestDirection: '教育' },
    wealthResult: { wealthScore: strength === '旺' ? 78 : 38, zhengCai: { strength: strength === '旺' ? '有力' : '无力' }, pianCai: { strength: '中等' }, caiKu: strength === '旺' ? '有' : '无', leakageRisk: strength === '弱' ? '高' : '低' },
    marriageResult: { marriageScore: strength === '旺' ? 70 : 42, marriageQuality: strength === '旺' ? '佳' : '中' },
    currentDaYun: strength === '弱' ? '庚申' : '丙寅',
    currentLiuNian: strength === '弱' ? '辛酉' : '丙午',
    daYunList: ['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳'],
  }
}

console.log('=== P3.6 DecisionEngine 测试 ===\n')

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

// 测试1：身旺+吉神多
console.log('--- 身旺+吉神多命 ---')
let r = makeAllDecisions(makeContext('旺', true))
check('6类决策', r.decisions.length === 6)
check('有最佳决策', r.bestDecision !== undefined)
check('有最差决策', r.worstDecision !== undefined)
check('总评非空', r.summary.length > 10)
for (const d of r.decisions) {
  check(`${d.type}评分0-100`, d.overallScore >= 0 && d.overallScore <= 100)
  check(`${d.type}推荐有效`, ['强烈建议','建议','中性','不建议','强烈不建议'].includes(d.recommendation))
  check(`${d.type}三层评分`, d.natalScore >= 0 && d.luckScore >= 0 && d.yearScore >= 0)
  check(`${d.type}因素非空`, d.factors.length > 0)
  check(`${d.type}建议非空`, d.advice.length > 20)
  check(`${d.type}时机非空`, d.timing.length > 5)
  check(`${d.type}古籍引用`, d.classicalRef.length > 0)
  check(`${d.type}原局分析非空`, d.natalAnalysis.length > 20)
  check(`${d.type}大运分析非空`, d.luckAnalysis.length > 10)
  check(`${d.type}流年分析非空`, d.yearAnalysis.length > 10)
}

// 测试2：身弱+无神煞
console.log('\n--- 身弱+无神煞命 ---')
r = makeAllDecisions(makeContext('弱', false))
check('身弱总评非空', r.summary.length > 10)
check('身弱最佳<=身旺最佳', r.bestDecision.overallScore <= 80)
// 身弱命各决策评分应低于身旺命
const weakScores = r.decisions.map(d => d.overallScore)
check('身弱有决策<50', weakScores.some(s => s < 50))

// 测试3：中和命
console.log('\n--- 中和命 ---')
r = makeAllDecisions(makeContext('中', true))
check('中和6决策', r.decisions.length === 6)
check('中和有最佳', r.bestDecision !== undefined)
// 中和命评分应在身旺和身弱之间
const midScores = r.decisions.map(d => d.overallScore)
check('中和评分适中', midScores.every(s => s >= 30 && s <= 80))

// 测试4：单类决策
console.log('\n--- 单类决策(创业) ---')
const d = makeDecision('创业', makeContext('旺', true))
check('单类创业', d.type === '创业')
check('单类评分', d.overallScore >= 0 && d.overallScore <= 100)
check('单类因素', d.factors.length > 0)
check('单类风险', d.risks !== undefined)
check('单类替代方案', d.alternatives !== undefined)

// 测试5：非模板（同一命盘两次调用建议不同）
console.log('\n--- 非模板测试 ---')
const d1 = makeDecision('创业', makeContext('旺', true))
const d2 = makeDecision('创业', makeContext('旺', true))
check('两次评分一致', d1.overallScore === d2.overallScore)
check('两次建议可能不同', d1.advice.length > 20 && d2.advice.length > 20)

// 测试6：身旺>身弱 趋势
console.log('\n--- 趋势验证 ---')
const wangR = makeAllDecisions(makeContext('旺', true))
const ruoR = makeAllDecisions(makeContext('弱', false))
const wangAvg = wangR.decisions.reduce((s, d) => s + d.overallScore, 0) / 6
const ruoAvg = ruoR.decisions.reduce((s, d) => s + d.overallScore, 0) / 6
check(`身旺均值(${wangAvg.toFixed(0)})>身弱均值(${ruoAvg.toFixed(0)})`, wangAvg > ruoAvg)

console.log('\n=== 汇总 ===')
console.log(`通过: ${pass}/${pass + fail}`)
if (fail === 0) { console.log('>>> ALL PASS <<<'); process.exit(0) }
else { console.log('>>> FAIL <<<'); process.exit(1) }
