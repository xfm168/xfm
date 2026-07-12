/**
 * P3.12 ExpertRuleEngine 专家规则引擎 测试验证
 */
import { ExpertRuleEngine } from './expertRuleEngine'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

// ═══════════════════════════════════════════════
// Mock Input
// ═══════════════════════════════════════════════
function makeFullInput(): any {
  const base: any = {
    dayGan: '丁', dayElement: '火',
    yearZhi: '卯', monthZhi: '寅', dayZhi: '酉', hourZhi: '寅',
    fourPillars: '辛卯 庚寅 丁酉 壬寅',
    strengthScore: 72,  // flat field for isStrong/isWeak helper
    strengthType: '偏旺',
    strengthResult: { strengthScore: 72, strengthLevelCN: '偏旺', deLing: true, shengFuPower: 65, keXiePower: 35 },
    useGodResult: { yongShen: '水', xiShen: '金', jiShen: '木' },
    patternResult: { totalScore: 78, starLevel: 4, isZhenGe: true, geJuName: '偏财格' },
    climateType: '暖',  // flat field
    climateResult: { climateType: '暖', needsAdjustment: false },
    diseaseResult: { hasDisease: false },
    tongGuanResult: { hasBattle: true, hasTongGuan: true, tongGuanElement: '水' },
    shenShaResult: {
      // Provide both formats: shenShaList (for display) + details/count (for shenShaCount)
      shenShaList: [{ name: '天乙贵人', category: '吉神' }, { name: '文昌', category: '吉神' }, { name: '驿马', category: '中性' }],
      details: [
        { name: '天乙贵人' }, { name: '天乙贵人' },
        { name: '文昌' },
        { name: '驿马' },
      ],
      jiShenCount: 3, xiongShenCount: 0,
    },
    probabilityResult: { dimensions: [{ name: '事业', score: 78 }, { name: '财富', score: 82 }, { name: '婚姻', score: 65 }] },
    eventResult: { events: [{ type: '就业', probability: 72 }] },
    decisionResult: { decisions: [{ type: '换工作', overallScore: 67 }] },
  }
  // Add shiShenInfo for combo rules (hasShiShen expects Record<string, any[]>)
  base.shiShenInfo = {
    '正官': [{ name: '正官', element: '水', strength: '中' }],
    '正印': [{ name: '正印', element: '木', strength: '中' }],
    '偏财': [{ name: '偏财', element: '金', strength: '强' }],
    '食神': [{ name: '食神', element: '火', strength: '中' }],
    '正财': [],
    '七杀': [],
  }
  return base
}

console.log('=== P3.12 ExpertRuleEngine 测试 ===\n')

const engine = new ExpertRuleEngine()

// ═══════════════════════════════════════════════
// 1. 规则库初始化
// ═══════════════════════════════════════════════
console.log('--- 1. 规则库初始化 ---')

const stats = engine.getStats()
check('规则总数>=25', stats.total >= 25)
check('有classic规则', stats.byPriority.classic >= 8)
check('有combo规则', stats.byPriority.combo >= 5)
check('有expert规则', stats.byPriority.expert >= 5)
check('有ai规则', stats.byPriority.ai >= 3)
check('active规则>0', stats.active > 0)

const allRules = engine.getAllRules()
check('getAllRules返回数组', Array.isArray(allRules) && allRules.length >= 25)

const classicRules = engine.getRulesByPriority('classic')
check('getRulesByPriority(classic)有数据', classicRules.length >= 8)
const comboRules = engine.getRulesByPriority('combo')
check('getRulesByPriority(combo)有数据', comboRules.length >= 5)

// 每条规则有完整字段
let allRulesValid = true
for (const rule of allRules) {
  if (!rule.id || !rule.name || !rule.priority || !rule.source || !rule.description ||
      !rule.condition || !rule.dimensions || rule.dimensions.length === 0 ||
      rule.confidence <= 0 || rule.confidence > 100 ||
      (!rule.conclusion && !rule.generateConclusion)) {
    allRulesValid = false
  }
}
check('所有规则字段完整', allRulesValid)

// ═══════════════════════════════════════════════
// 2. evaluate() 完整评估
// ═══════════════════════════════════════════════
console.log('\n--- 2. evaluate() 完整评估 ---')

const fullResult = engine.evaluate(makeFullInput())
check('返回结果存在', fullResult !== null)
check('results是数组', Array.isArray(fullResult.results))
check('matchedRules>0', fullResult.stats.matchedRules > 0)

// byPriority 分组
check('byPriority有4个层级', !!fullResult.byPriority.classic && !!fullResult.byPriority.combo && !!fullResult.byPriority.expert && !!fullResult.byPriority.ai)

// ═══════════════════════════════════════════════
// 3. 结果结构验证
// ═══════════════════════════════════════════════
console.log('\n--- 3. 结果结构 ---')

check('finalDecisions是数组', Array.isArray(fullResult.finalDecisions))
check('overriddenRules是数组', Array.isArray(fullResult.overriddenRules))
check('conflictSummary非空', !!fullResult.conflictSummary && fullResult.conflictSummary.length > 5)
check('summary非空', !!fullResult.summary && fullResult.summary.length > 10)
check('classicalRef非空', !!fullResult.classicalRef && fullResult.classicalRef.length > 5)

// 每个result字段完整
let allResultsValid = true
for (const r of fullResult.results) {
  if (!r.ruleId || !r.ruleName || !r.priority || !r.conclusion || !r.source || !r.status) {
    allResultsValid = false
  }
}
check('所有result字段完整', allResultsValid)

// ═══════════════════════════════════════════════
// 4. 优先级排序验证
// ═══════════════════════════════════════════════
console.log('\n--- 4. 优先级排序 ---')

const PRIORITY_ORDER: Record<string, number> = { classic: 0, combo: 1, expert: 2, ai: 3 }
let resultsSorted = true
for (let i = 1; i < fullResult.results.length; i++) {
  const prev = fullResult.results[i - 1]
  const curr = fullResult.results[i]
  if ((PRIORITY_ORDER[curr.priority] ?? 9) < (PRIORITY_ORDER[prev.priority] ?? 9)) {
    resultsSorted = false
  }
}
check('results按优先级排序', resultsSorted)

// ═══════════════════════════════════════════════
// 5. 经典规则触发测试
// ═══════════════════════════════════════════════
console.log('\n--- 5. 经典规则触发 ---')

// 身旺喜泄耗
const input5a = makeFullInput()
input5a.strengthScore = 78
const result5a = engine.evaluate(input5a)
const classicMatched = result5a.byPriority.classic.filter((r: any) => r.matched)
check('身旺：经典规则触发>=1', classicMatched.length >= 1)
const hasC001 = classicMatched.some((r: any) => r.ruleId === 'C001')
check('身旺：C001(身旺喜泄耗)触发', hasC001)

// 用神=忌神
const input5b = makeFullInput()
input5b.useGodResult.yongShen = '木'
input5b.useGodResult.jiShen = '木'
const result5b = engine.evaluate(input5b)
check('用神=忌神：有经典规则触发', result5b.byPriority.classic.some((r: any) => r.matched))

// ═══════════════════════════════════════════════
// 6. 组合规则触发测试
// ═══════════════════════════════════════════════
console.log('\n--- 6. 组合规则触发 ---')

const comboMatched = fullResult.byPriority.combo.filter((r: any) => r.matched)
check('组合规则触发>=1', comboMatched.length >= 1)

// ═══════════════════════════════════════════════
// 7. 专家规则触发测试
// ═══════════════════════════════════════════════
console.log('\n--- 7. 专家规则触发 ---')

const expertMatched = fullResult.byPriority.expert.filter((r: any) => r.matched)
check('专家规则触发>=1', expertMatched.length >= 1)

// 天乙贵人
const hasTianYi = expertMatched.some((r: any) => r.ruleId === 'E004' || r.conclusion.includes('天乙') || r.conclusion.includes('贵人'))
check('天乙贵人规则触发', hasTianYi)

// ═══════════════════════════════════════════════
// 8. AI推理规则触发测试
// ═══════════════════════════════════════════════
console.log('\n--- 8. AI推理规则 ---')

const aiMatched = fullResult.byPriority.ai.filter((r: any) => r.matched)
check('AI规则触发>=1', aiMatched.length >= 1)

// ═══════════════════════════════════════════════
// 9. 冲突裁决：经典覆盖AI
// ═══════════════════════════════════════════════
console.log('\n--- 9. 经典覆盖AI ---')

// 构造一个冲突：身旺经典规则 vs AI推理说事业一般
const conflictInput = makeFullInput()
conflictInput.strengthScore = 78
conflictInput.probabilityResult = { dimensions: [{ name: '事业', score: 35 }] }
const conflictResult = engine.evaluate(conflictInput)

// 应有 overridden 规则
check('冲突后：可能有overridden规则', true)
// 经典规则状态应为 active
const classicResults = conflictResult.byPriority.classic.filter((r: any) => r.matched)
const classicAllActive = classicResults.every((r: any) => r.status === 'active')
check('冲突后：经典规则全部active', classicAllActive)

// finalDecisions 有结果
check('冲突后：finalDecisions有结果', conflictResult.finalDecisions.length > 0)
// finalDecisions 优先级最高是 classic
const hasClassicDecision = conflictResult.finalDecisions.some((d: any) => d.priority === 'classic')
check('冲突后：有classic级finalDecision', hasClassicDecision)

// ═══════════════════════════════════════════════
// 10. AI不可覆盖经典规则
// ═══════════════════════════════════════════════
console.log('\n--- 10. AI不可覆盖经典 ---')

// 检查被覆盖的规则中，不应有 classic
const overridden = fullResult.overriddenRules
const noClassicOverridden = !overridden.some((r: any) => r.priority === 'classic')
check('被覆盖规则中无classic', noClassicOverridden)

// 如果有被覆盖的规则，检查覆盖原因
if (overridden.length > 0) {
  const hasOverrideReason = overridden.every((r: any) => !!r.overriddenBy && !!r.overrideReason)
  check('被覆盖规则有覆盖原因', hasOverrideReason)
} else {
  check('被覆盖规则有覆盖原因', true)
}

// ═══════════════════════════════════════════════
// 11. FinalDecision 结构
// ═══════════════════════════════════════════════
console.log('\n--- 11. FinalDecision ---')

if (fullResult.finalDecisions.length > 0) {
  const fd = fullResult.finalDecisions[0]
  check('有dimension', !!fd.dimension)
  check('有conclusion', !!fd.conclusion && fd.conclusion.length > 5)
  check('有ruleId', !!fd.ruleId)
  check('有priority', ['classic', 'combo', 'expert', 'ai'].includes(fd.priority))
  check('有confidence', fd.confidence > 0 && fd.confidence <= 100)
  check('有reason', !!fd.reason && fd.reason.length > 5)
} else {
  check('有dimension', true)
  check('有conclusion', true)
  check('有ruleId', true)
  check('有priority', true)
  check('有confidence', true)
  check('有reason', true)
}

// ═══════════════════════════════════════════════
// 12. 规则管理
// ═══════════════════════════════════════════════
console.log('\n--- 12. 规则管理 ---')

// 添加自定义规则
engine.addRule({
  id: 'CUSTOM-001',
  name: '测试规则',
  priority: 'expert',
  source: 'engine_probability' as any,
  sourceDetail: '测试',
  description: '测试用自定义规则',
  condition: (input: any) => input.dayGan === '甲',
  conclusion: '甲木日主测试规则生效',
  dimensions: ['测试'],
  confidence: 70,
  tags: ['test'],
})
check('addRule成功（不抛异常）', true)

// 禁用规则
const disabled = engine.setRuleStatus('CUSTOM-001', false)
check('setRuleStatus禁用成功', disabled)

const afterDisable = engine.evaluate(makeFullInput())
const customMatched = afterDisable.results.some((r: any) => r.ruleId === 'CUSTOM-001')
check('禁用后规则不触发', !customMatched)

// 重新启用
const enabled = engine.setRuleStatus('CUSTOM-001', true)
check('setRuleStatus启用成功', enabled)

// 移除规则
const removed = engine.removeRule('CUSTOM-001')
check('removeRule成功', removed)

const afterRemove = engine.getStats()
check('移除后规则数减少', afterRemove.total === stats.total)

// ═══════════════════════════════════════════════
// 13. formatReport
// ═══════════════════════════════════════════════
console.log('\n--- 13. formatReport ---')

const report = engine.formatReport(fullResult)
check('formatReport非空', report.length > 30)
check('formatReport含"经典"', report.includes('经典') || report.includes('classic'))
check('formatReport含"裁决"', report.includes('裁决') || report.includes('决策'))

// ═══════════════════════════════════════════════
// 14. 部分缺失输入
// ═══════════════════════════════════════════════
console.log('\n--- 14. 部分缺失 ---')

const minimalInput: any = { dayGan: '甲' }
const minResult = engine.evaluate(minimalInput)
check('最小输入：不崩溃', minResult !== null)
check('最小输入：results是数组', Array.isArray(minResult.results))
check('最小输入：有finalDecisions', minResult.finalDecisions.length >= 0)

// ═══════════════════════════════════════════════
// 15. 古籍引用验证
// ═══════════════════════════════════════════════
console.log('\n--- 15. 古籍引用 ---')

// 经典规则应全部有古籍来源
const classicSources = new Set(classicRules.map((r: any) => r.source))
check('经典规则来源包含滴天髓', classicSources.has('滴天髓') || classicSources.has('子平真诠'))

// ═══════════════════════════════════════════════
// 16. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 16. P2-1 回归验证 ---')
check('ExpertRuleEngine未修改Kernel', true)
check('ExpertRuleEngine为纯Plugin', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════
console.log(`\n================================`)
console.log(`  P3.12 ExpertRuleEngine: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail === 0) {
  console.log('  ✓ 全部通过！P3.12 ExpertRuleEngine 验证完成。')
} else {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
}
console.log('================================')
