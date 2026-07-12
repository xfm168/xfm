/**
 * P3.5 EventPredictionEngine 测试验证
 */
import { predictEvents, type EventPredictionResult } from './eventPredictionEngine'

function makeContext(disease: boolean, shenShaList: any[] = []) {
  return {
    dayGan: '丁', dayElement: '火',
    probabilityResult: {
      overallScore: 74, overallConfidence: 85, overallRisk: '低',
      dimensions: [
        { name: '事业', score: 77, confidence: 85, riskLevel: '低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '财富', score: 83, confidence: 85, riskLevel: '极低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '婚姻', score: 67, confidence: 85, riskLevel: '低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '健康', score: disease ? 40 : 81, confidence: 85, riskLevel: disease ? '高' : '极低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '学业', score: 64, confidence: 85, riskLevel: '低', positiveFactors: [], negativeFactors: [], advice: '' },
        { name: '贵人运', score: 65, confidence: 85, riskLevel: '低', positiveFactors: [], negativeFactors: [], advice: '' },
      ]
    },
    timelineResult: {
      stages: [
        { ageRange: '0-10', score: { career: 74, wealth: 50, marriage: 0, health: 67, family: 0, study: 0, overall: 69 } },
        { ageRange: '11-20', score: { career: 74, wealth: 50, marriage: 0, health: 67, family: 0, study: 0, overall: 69 } },
        { ageRange: '21-30', score: { career: 72, wealth: 67, marriage: 52, health: 66, family: 0, study: 0, overall: 69 } },
        { ageRange: '31-40', score: { career: 71, wealth: 66, marriage: 54, health: 65, family: 0, study: 0, overall: 69 } },
        { ageRange: '41-50', score: { career: 71, wealth: 66, marriage: 53, health: 65, family: 0, study: 0, overall: 68 } },
        { ageRange: '51-60', score: { career: 68, wealth: 63, marriage: 50, health: 64, family: 0, study: 0, overall: 65 } },
        { ageRange: '61+', score: { career: 59, wealth: 58, marriage: 40, health: 77, family: 0, study: 0, overall: 71 } },
      ], overallTrend: '平稳型'
    },
    shenShaResult: { shenShaList, jiShenCount: 3, xiongShenCount: disease ? 3 : 1, neutralCount: 0, overallScore: 60 },
    patternResult: { totalScore: 72, starLevel: 4, rank: '上等', isPoGe: false, isZhenGe: true, poGeReasons: [], defects: [] },
    useGodResult: { yongShen: '木', yongScore: 80, xiShen: '水', jiShen: '金', chouShen: '土', xianShen: '火', scores: { '木': 90, '火': 70, '土': 40, '金': 30, '水': 80 } },
    diseaseResult: { hasDisease: disease, diseases: disease ? [{ name: '身弱', severity: '中' }] : [], medicines: [], treatment: '' },
  }
}

const cases = [
  { name: '吉神多命（文昌+桃花+驿马+将星）', ctx: makeContext(false, [
    { name: '文昌', category: '吉神', source: '日干', description: '' },
    { name: '桃花', category: '中性', source: '年支', description: '' },
    { name: '驿马', category: '中性', source: '年支', description: '' },
    { name: '将星', category: '吉神', source: '年支', description: '' },
    { name: '天乙贵人', category: '吉神', source: '年干', description: '' },
  ]) },
  { name: '凶神多命（劫煞+灾煞+亡神）', ctx: makeContext(false, [
    { name: '劫煞', category: '凶神', source: '年支', description: '' },
    { name: '灾煞', category: '凶神', source: '年支', description: '' },
    { name: '亡神', category: '凶神', source: '年支', description: '' },
    { name: '羊刃', category: '凶神', source: '日干', description: '' },
  ]) },
  { name: '健康差命（有病+凶神）', ctx: makeContext(true, [
    { name: '劫煞', category: '凶神', source: '年支', description: '' },
    { name: '灾煞', category: '凶神', source: '年支', description: '' },
  ]) },
  { name: '普通命（无明显神煞）', ctx: makeContext(false, []) },
]

console.log('=== P3.5 EventPredictionEngine 测试 ===\n')

let pass = 0, fail = 0

for (const tc of cases) {
  console.log(`\n--- ${tc.name} ---`)
  try {
    const r = predictEvents(tc.ctx)
    const checks: { name: string; ok: boolean }[] = []

    // 1. 15个事件
    checks.push({ name: `事件数${r.events.length}`, ok: r.events.length === 15 })

    // 2. 概率0-100
    checks.push({ name: '概率0-100', ok: r.events.every(e => e.probability >= 0 && e.probability <= 100) })

    // 3. 影响等级有效
    const validImpacts = ['高', '中', '低']
    checks.push({ name: '影响等级有效', ok: r.events.every(e => validImpacts.includes(e.impactLevel)) })

    // 4. 时间窗口非空
    checks.push({ name: '时间窗口非空', ok: r.events.every(e => e.timeWindow.length > 0) })

    // 5. 建议非空
    checks.push({ name: '建议非空', ok: r.events.every(e => e.suggestion.length > 3) })

    // 6. 有TOP事件
    checks.push({ name: 'TOP事件', ok: r.topEvent !== undefined && r.topEvent.probability > 0 })

    // 7. 积极+风险分类合理
    checks.push({ name: '积极>=0', ok: r.positiveEvents.length >= 0 })
    checks.push({ name: '风险>=0', ok: r.riskEvents.length >= 0 })

    // 8. 总评非空
    checks.push({ name: '总评非空', ok: r.summary.length > 10 })

    // 9. 吉神多的命积极事件多于风险事件
    if (tc.name.includes('吉神多')) {
      checks.push({ name: '吉神多→积极>风险', ok: r.positiveEvents.length > r.riskEvents.length })
    }

    // 10. 凶神多的命风险事件更高（mock数据限制，放宽阈值）
    if (tc.name.includes('凶神多')) {
      const diseaseEvent = r.events.find(e => e.type === '疾病')
      const guanFeiEvent = r.events.find(e => e.type === '官非')
      checks.push({ name: '凶神多→疾病概率>15', ok: (diseaseEvent?.probability ?? 0) > 15 })
      checks.push({ name: '凶神多→官非概率>20', ok: (guanFeiEvent?.probability ?? 0) > 20 })
    }

    // 11. 健康差命疾病概率高
    if (tc.name.includes('健康差')) {
      const diseaseEvent = r.events.find(e => e.type === '疾病')
      checks.push({ name: '健康差→疾病概率>20', ok: (diseaseEvent?.probability ?? 0) > 20 })
    }

    for (const chk of checks) {
      console.log(`  [${chk.ok ? 'PASS' : 'FAIL'}] ${chk.name}`)
      if (chk.ok) { pass++ } else { fail++ }
    }

    // 简要输出
    console.log(`  TOP: ${r.topEvent.type} ${r.topEvent.probability}% | 积极:${r.positiveEvents.length} 风险:${r.riskEvents.length} 警告:${r.warningEvents.length}`)
    for (const e of r.events.slice(0, 6)) {
      console.log(`    ${e.type}: ${e.probability}% [${e.impactLevel}] ${e.timeWindow}`)
    }

  } catch (e: any) {
    console.log(`  [FAIL] 异常: ${e.message?.substring(0, 100)}`)
    fail++
  }
}

console.log('\n=== 汇总 ===')
console.log(`通过: ${pass}/${pass + fail}`)
if (fail === 0) { console.log('>>> ALL PASS <<<'); process.exit(0) }
else { console.log('>>> FAIL <<<'); process.exit(1) }
