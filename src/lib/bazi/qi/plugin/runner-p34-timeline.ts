/**
 * P3.4 TimelineEngine 测试验证
 */
import { generateTimeline } from './timelineEngine'

function makeContext(dayGan: string, dayElement: string, birthYear: number, gender: '男' | '女', patternScore: number, daYun?: string[]): any {
  return {
    dayGan, dayElement, birthYear, gender,
    strengthResult: { strengthScore: 65, strengthLevel: 'Balanced', strengthLevelCN: '偏旺', deLing: true, deDi: true, deShi: false, tongGen: true },
    patternResult: { totalScore: patternScore, starLevel: patternScore >= 75 ? 4 : 3, rank: patternScore >= 75 ? '上等' : '中等', isPoGe: patternScore < 45 },
    useGodResult: { yongShen: dayElement, yongScore: 80, xiShen: '水', jiShen: '金', chouShen: '土', xianShen: '火', scores: { '木': 85, '火': 70, '土': 40, '金': 30, '水': 80 } },
    probabilityResult: { overallScore: patternScore, dimensions: [], overallConfidence: 85, overallRisk: '低' },
    shenShaResult: { overallScore: 60 },
    daYun,
    startDaYunAge: 5,
  }
}

const cases = [
  { name: '大运格（有8步大运）', ctx: makeContext('甲', '木', 1985, '男', 78, ['壬申','癸未','甲申','乙酉','丙戌','丁亥','戊子','己丑']) },
  { name: '无大运格', ctx: makeContext('丙', '火', 1990, '女', 62, undefined) },
  { name: '弱格局（破格）', ctx: makeContext('乙', '木', 1975, '男', 30, ['庚辰','辛巳','壬午','癸未','甲申','乙酉']) },
  { name: '女命大运', ctx: makeContext('丁', '火', 1988, '女', 75, ['辛亥','壬子','癸丑','甲寅','乙卯','丙辰']) },
]

console.log('=== P3.4 TimelineEngine 测试 ===\n')

let pass = 0, fail = 0

for (const tc of cases) {
  console.log(`\n--- ${tc.name} ---`)
  try {
    const r = generateTimeline(tc.ctx)
    const checks: { name: string; ok: boolean }[] = []

    // 1. 7阶段
    checks.push({ name: `7阶段(${r.stages.length})`, ok: r.stages.length === 7 })

    // 2. 各阶段评分0-100
    const allValid = r.stages.every(s =>
      s.score.career >= 0 && s.score.career <= 100 &&
      s.score.wealth >= 0 && s.score.wealth <= 100 &&
      s.score.marriage >= 0 && s.score.marriage <= 100 &&
      s.score.health >= 0 && s.score.health <= 100 &&
      s.score.family >= 0 && s.score.family <= 100 &&
      s.score.study >= 0 && s.score.study <= 100 &&
      s.score.overall >= 0 && s.score.overall <= 100
    )
    checks.push({ name: '六维评分0-100', ok: allValid })

    // 3. 趋势标签有效
    const validTrends = ['上升', '平稳', '下降', '峰值', '谷底']
    checks.push({ name: '趋势标签有效', ok: r.stages.every(s => validTrends.includes(s.trend)) })

    // 4. 整体趋势有效
    const validOverall = ['上升型', '平稳型', '下降型', '先抑后扬', '先扬后抑', '波浪型']
    checks.push({ name: `整体趋势"${r.overallTrend}"有效`, ok: validOverall.includes(r.overallTrend) })

    // 5. 有最佳/最差阶段
    checks.push({ name: `最佳${r.bestStage}/最差${r.worstStage}`, ok: r.bestStage.length > 0 && r.worstStage.length > 0 })

    // 6. 有巅峰/谨慎年龄
    checks.push({ name: `巅峰"${r.peakAge}"`, ok: r.peakAge.length > 0 })
    checks.push({ name: `谨慎"${r.cautionAge}"`, ok: r.cautionAge.length > 0 })

    // 7. 趋势图数据
    checks.push({ name: '趋势图数据', ok: r.chart.ages.length === 7 && r.chart.career.length === 7 && r.chart.overall.length === 7 })

    // 8. 大运映射（有daYun的案例）
    if (tc.ctx.daYun) {
      const hasDaYun = r.stages.some(s => s.daYun !== undefined)
      checks.push({ name: '大运映射', ok: hasDaYun })
    }

    // 9. 总评非空
    checks.push({ name: '总评非空', ok: r.summary.length > 10 })

    // 10. 古籍引用
    checks.push({ name: '古籍引用', ok: r.classicalRef.length > 0 })

    // 11. 置信度
    checks.push({ name: '置信度有效', ok: r.stages.every(s => s.confidence >= 0 && s.confidence <= 100) })

    // 12. 少年婚姻=0
    const childhoodMarriage = r.stages[0].score.marriage === 0
    checks.push({ name: '少年婚姻=0', ok: childhoodMarriage })

    // 13. 晚年健康权重最高
    const lateStage = r.stages[6]
    const lateHealthHigh = lateStage.score.health >= lateStage.score.career
    checks.push({ name: '晚年健康>=事业', ok: lateHealthHigh })

    for (const chk of checks) {
      console.log(`  [${chk.ok ? 'PASS' : 'FAIL'}] ${chk.name}`)
      if (chk.ok) { pass++ } else { fail++ }
    }

    // 简要输出
    for (const s of r.stages) {
      const dy = s.daYun ? ` [大运:${s.daYun.name}]` : ''
      console.log(`    ${s.ageRange}: 综合${s.score.overall} [${s.trend}] 事业${s.score.career} 财富${s.score.wealth} 健康${s.score.health}${dy}`)
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
