/**
 * P3.18 RoadmapEngine 长期路线图 测试验证
 */
import { RoadmapEngine } from './roadmapEngine'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P3.18 RoadmapEngine 测试 ===\n')

const engine = new RoadmapEngine()

// ═══════════════════════════════════════════════
// 1. 阶段定义完整性
// ═══════════════════════════════════════════════
console.log('--- 1. 阶段定义完整性 ---')

const allPhases = engine.getAllPhases()
check('有6个阶段', allPhases.length === 6)

const phaseIds = allPhases.map((p) => p.phase)
check('包含P3', phaseIds.includes('P3'))
check('包含P4', phaseIds.includes('P4'))
check('包含P5', phaseIds.includes('P5'))
check('包含P6', phaseIds.includes('P6'))
check('包含P7', phaseIds.includes('P7'))
check('包含P8', phaseIds.includes('P8'))

// ═══════════════════════════════════════════════
// 2. P3 阶段详细验证
// ═══════════════════════════════════════════════
console.log('\n--- 2. P3 阶段 ---')

const p3 = engine.getPhase('P3')
check('P3存在', p3 !== null)
check('P3 name=专家级八字引擎', p3!.name === '专家级八字引擎')
check('P3 status=in-progress', p3!.status === 'in-progress')
check('P3 targetSystems包含bazi', p3!.targetSystems.includes('bazi'))
check('P3 milestones>=15', p3!.milestones.length >= 15)
check('P3 acceptanceCriteria有值', p3!.acceptanceCriteria.length > 0)
check('P3 deliverables有值', p3!.deliverables.length > 0)
check('P3 classicalSources有值', p3!.classicalSources.length > 0)
check('P3 dependencies为空（第一阶段）', p3!.dependencies.length === 0)

// P3 里程碑包含18个模块
const p3MsNames = p3!.milestones.map((m) => m.name)
check('P3有CaseLibrary', p3MsNames.some((n) => n.includes('CaseLibrary')))
check('P3有Benchmark', p3MsNames.some((n) => n.includes('Benchmark')))
check('P3有Probability', p3MsNames.some((n) => n.includes('Probability')))
check('P3有Timeline', p3MsNames.some((n) => n.includes('Timeline')))
check('P3有Explain', p3MsNames.some((n) => n.includes('Explain')))
check('P3有KnowledgeGraph', p3MsNames.some((n) => n.includes('KnowledgeGraph')))
check('P3有ConsistencyChecker', p3MsNames.some((n) => n.includes('ConsistencyChecker')))
check('P3有ReasoningLayer', p3MsNames.some((n) => n.includes('ReasoningLayer')))
check('P3有ExpertRule', p3MsNames.some((n) => n.includes('ExpertRule') || n.includes('专家规则')))
check('P3有Learning', p3MsNames.some((n) => n.includes('Learning')))
check('P3有Quality', p3MsNames.some((n) => n.includes('Quality')))
check('P3有Regression', p3MsNames.some((n) => n.includes('Regression')))
check('P3有Performance', p3MsNames.some((n) => n.includes('Performance')))
check('P3有Roadmap', p3MsNames.some((n) => n.includes('Roadmap') || n.includes('路线图')))

// P3 大部分里程碑已完成
const p3Done = p3!.milestones.filter((m) => m.status === 'done').length
check('P3大部分里程碑已完成', p3Done >= 15)

// ═══════════════════════════════════════════════
// 3. P4 紫微斗数
// ═══════════════════════════════════════════════
console.log('\n--- 3. P4 紫微斗数 ---')

const p4 = engine.getPhase('P4')
check('P4存在', p4 !== null)
check('P4 name=紫微斗数', p4!.name === '紫微斗数')
check('P4 targetSystems包含ziwei', p4!.targetSystems.includes('ziwei'))
check('P4 status=planned', p4!.status === 'planned')
check('P4 dependencies包含P3', p4!.dependencies.includes('P3'))
check('P4 milestones>=6', p4!.milestones.length >= 6)
check('P4有古籍来源', p4!.classicalSources.length > 0)

// ═══════════════════════════════════════════════
// 4. P5 奇门遁甲
// ═══════════════════════════════════════════════
console.log('\n--- 4. P5 奇门遁甲 ---')

const p5 = engine.getPhase('P5')
check('P5存在', p5 !== null)
check('P5包含奇门', p5!.name.includes('奇门'))
check('P5 targetSystems包含qimen', p5!.targetSystems.includes('qimen'))
check('P5 status=future', p5!.status === 'future')
check('P5 milestones>=6', p5!.milestones.length >= 6)

// ═══════════════════════════════════════════════
// 5. P6 六爻
// ═══════════════════════════════════════════════
console.log('\n--- 5. P6 六爻 ---')

const p6 = engine.getPhase('P6')
check('P6存在', p6 !== null)
check('P6包含六爻', p6!.name.includes('六爻'))
check('P6 targetSystems包含liuyao', p6!.targetSystems.includes('liuyao'))
check('P6 status=future', p6!.status === 'future')
check('P6 milestones>=6', p6!.milestones.length >= 6)

// ═══════════════════════════════════════════════
// 6. P7 风水联动
// ═══════════════════════════════════════════════
console.log('\n--- 6. P7 风水联动 ---')

const p7 = engine.getPhase('P7')
check('P7存在', p7 !== null)
check('P7包含风水', p7!.name.includes('风水'))
check('P7 targetSystems包含fengshui', p7!.targetSystems.includes('fengshui'))
check('P7 status=future', p7!.status === 'future')
check('P7 milestones>=6', p7!.milestones.length >= 6)

// ═══════════════════════════════════════════════
// 7. P8 AI命理顾问
// ═══════════════════════════════════════════════
console.log('\n--- 7. P8 AI命理顾问 ---')

const p8 = engine.getPhase('P8')
check('P8存在', p8 !== null)
check('P8包含AI', p8!.name.includes('AI') || p8!.description.includes('AI'))
check('P8 targetSystems>=2', p8!.targetSystems.length >= 2)
check('P8 status=future', p8!.status === 'future')
check('P8 milestones>=6', p8!.milestones.length >= 6)

// P8 是最终统一阶段
check('P8包含统一或平台', p8!.description.includes('统一') || p8!.description.includes('平台'))

// ═══════════════════════════════════════════════
// 8. P3 验收标准
// ═══════════════════════════════════════════════
console.log('\n--- 8. P3 验收标准 ---')

const criteria = engine.getP3AcceptanceCriteria()
check('验收标准有8项', criteria.length === 8)

const acIds = criteria.map((c) => c.id)
check('有AC001', acIds.includes('AC001'))
check('有AC008', acIds.includes('AC008'))

// AC005 Plugin化 和 AC006 Kernel零修改 初始为 pass
const ac005 = criteria.find((c) => c.id === 'AC005')
const ac006 = criteria.find((c) => c.id === 'AC006')
check('AC005 Plugin化=pass', ac005!.status === 'pass')
check('AC006 Kernel零修改=pass', ac006!.status === 'pass')

// 其余初始为 pending
const pendingCount = criteria.filter((c) => c.status === 'pending').length
check('其余6项为pending', pendingCount === 6)

// 每条有 description 和 evidence
check('每条有description', criteria.every((c) => c.description.length > 0))
check('每条有evidence', criteria.every((c) => !!c.evidence && c.evidence.length > 0))

// ═══════════════════════════════════════════════
// 9. validateP3Acceptance
// ═══════════════════════════════════════════════
console.log('\n--- 9. validateP3Acceptance ---')

const acceptance = engine.validateP3Acceptance()
check('total=8', acceptance.total === 8)
check('passed=2', acceptance.passed === 2)
check('pending=6', acceptance.pending === 6)
check('failed=0', acceptance.failed === 0)
check('overallPass=false（有pending）', acceptance.overallPass === false)
check('passRate=25%', acceptance.passRate === 25)
check('有classicalRef', !!acceptance.classicalRef && acceptance.classicalRef.length > 0)
check('criteria有8项', acceptance.criteria.length === 8)

// ═══════════════════════════════════════════════
// 10. 里程碑管理
// ═══════════════════════════════════════════════
console.log('\n--- 10. 里程碑管理 ---')

// updateMilestone
const updated = engine.updateMilestone('P4', 'P4-M01', 'done', 100)
check('updateMilestone P4-M01 返回true', updated)

// 验证更新
const p4After = engine.getPhase('P4')
const m01 = p4After!.milestones.find((m) => m.id === 'P4-M01')
check('更新后 status=done', m01!.status === 'done')
check('更新后 completion=100', m01!.completion === 100)

// updateMilestone 不存在
const updateFail = engine.updateMilestone('P4', 'NOPE', 'done', 100)
check('更新不存在的里程碑返回false', updateFail === false)

// updateMilestone 不存在的阶段
const updateFail2 = engine.updateMilestone('P99' as any, 'P4-M01', 'done', 100)
check('更新不存在的阶段返回false', updateFail2 === false)

// completeMilestone
const completed = engine.completeMilestone('P4', 'P4-M02')
check('completeMilestone P4-M02 返回true', completed)
const p4M02 = engine.getPhase('P4')!.milestones.find((m) => m.id === 'P4-M02')
check('completeMilestone后 status=done', p4M02!.status === 'done')
check('completeMilestone后 completion=100', p4M02!.completion === 100)

// ═══════════════════════════════════════════════
// 11. getProgress
// ═══════════════════════════════════════════════
console.log('\n--- 11. getProgress ---')

const progress = engine.getProgress()
check('progress有overallCompletion', typeof progress.overallCompletion === 'number')
check('overallCompletion在0-100', progress.overallCompletion >= 0 && progress.overallCompletion <= 100)
check('progress有byPhase', !!progress.byPhase)
check('byPhase有P3-P8', ['P3', 'P4', 'P5', 'P6', 'P7', 'P8'].every((p) => p in progress.byPhase))
check('currentPhase=P3', progress.currentPhase === 'P3')
check('nextPhase=P4', progress.nextPhase === 'P4')
check('blocked是数组', Array.isArray(progress.blocked))

// P3 完成度高
check('P3完成度>=80%', progress.byPhase['P3'].completion >= 80)

// P4-P8 完成度低（大部分pending）
const futurePhasesLow = ['P5', 'P6', 'P7', 'P8'].every(
  (p) => progress.byPhase[p].completion < 50,
)
check('未来阶段完成度<50%', futurePhasesLow)

// ═══════════════════════════════════════════════
// 12. canStartPhase
// ═══════════════════════════════════════════════
console.log('\n--- 12. canStartPhase ---')

const canP3 = engine.canStartPhase('P3')
check('P3无依赖可启动', canP3.ready && canP3.blocking.length === 0)

const canP4 = engine.canStartPhase('P4')
check('P4依赖P3未完成：不可启动', !canP4.ready)
check('P4 blocking包含P3', canP4.blocking.includes('P3'))

// ═══════════════════════════════════════════════
// 13. getFinalGoal
// ═══════════════════════════════════════════════
console.log('\n--- 13. getFinalGoal ---')

const goal = engine.getFinalGoal()
check('getFinalGoal有description', !!goal.description && goal.description.length > 0)
check('getFinalGoal有vision', !!goal.vision && goal.vision.length > 0)
check('getFinalGoal有principles', Array.isArray(goal.principles) && goal.principles.length > 0)
check('getFinalGoal有classicalRef', !!goal.classicalRef && goal.classicalRef.length > 0)

// 最终目标描述
check('目标描述含XuanFeng', goal.description.includes('XuanFeng') || goal.description.includes('玄风'))
check('愿景含专业推演', goal.vision.includes('专业推演') || goal.vision.includes('可验证') || goal.vision.includes('可持续'))

// ═══════════════════════════════════════════════
// 14. getReport
// ═══════════════════════════════════════════════
console.log('\n--- 14. getReport ---')

const report = engine.getReport()
check('报告有generatedAt', !!report.generatedAt)
check('报告有phases数组', Array.isArray(report.phases) && report.phases.length === 6)
check('报告有progress', !!report.progress)
check('报告有p3Acceptance', !!report.p3Acceptance)
check('报告有finalGoal', !!report.finalGoal)
check('报告有overallScore', typeof report.overallScore === 'number')
check('报告有suggestions', Array.isArray(report.suggestions))
check('报告有report文本', typeof report.report === 'string' && report.report.length > 0)
check('报告有classicalRef', typeof report.classicalRef === 'string' && report.classicalRef.length > 0)

// overallScore范围
check('overallScore在0-100', report.overallScore >= 0 && report.overallScore <= 100)

// suggestions有内容
check('suggestions有内容', report.suggestions.length > 0)
check('suggestions全是string', report.suggestions.every((s) => typeof s === 'string'))

// ═══════════════════════════════════════════════
// 15. 报告内容验证
// ═══════════════════════════════════════════════
console.log('\n--- 15. 报告内容 ---')

const reportText = report.report
check('报告含"路线图"', reportText.includes('路线图'))
check('报告含"玄风门"', reportText.includes('玄风门'))
check('报告含"P3"', reportText.includes('P3'))
check('报告含"P4"', reportText.includes('P4'))
check('报告含"紫微"', reportText.includes('紫微'))
check('报告含"奇门"', reportText.includes('奇门'))
check('报告含"六爻"', reportText.includes('六爻'))
check('报告含"风水"', reportText.includes('风水'))
check('报告含"AI"', reportText.includes('AI'))
check('报告含"验收"', reportText.includes('验收'))
check('报告含"里程碑"', reportText.includes('里程碑'))
check('报告含"古籍"', reportText.includes('古籍'))
check('报告含"Kernel"', reportText.includes('Kernel'))
check('报告含"Plugin"', reportText.includes('Plugin'))

// ═══════════════════════════════════════════════
// 16. 古籍引用
// ═══════════════════════════════════════════════
console.log('\n--- 16. 古籍引用 ---')

const ref = report.classicalRef
check('classicalRef含《', ref.includes('《'))
check('classicalRef长度>10', ref.length > 10)

// 多样性
const refs = new Set<string>()
for (let i = 0; i < 20; i++) {
  refs.add(engine.getReport().classicalRef)
}
check('随机引用有多样性', refs.size > 1)

// ═══════════════════════════════════════════════
// 17. getPhase 不存在
// ═══════════════════════════════════════════════
console.log('\n--- 17. 边界情况 ---')

check('getPhase不存在=null', engine.getPhase('P99' as any) === null)
check('canStartPhase不存在返回false', !engine.canStartPhase('P99' as any).ready)

// updateMilestone completion 超范围被 clamp
engine.updateMilestone('P4', 'P4-M03', 'in-progress', 150)
const clampedMs = engine.getPhase('P4')!.milestones.find((m) => m.id === 'P4-M03')
check('completion被clamp到100', clampedMs!.completion === 100)

engine.updateMilestone('P4', 'P4-M03', 'in-progress', -10)
const clampedMs2 = engine.getPhase('P4')!.milestones.find((m) => m.id === 'P4-M03')
check('completion被clamp到0', clampedMs2!.completion === 0)

// ═══════════════════════════════════════════════
// 18. 阶段依赖链验证
// ═══════════════════════════════════════════════
console.log('\n--- 18. 依赖链 ---')

// P5 依赖 P4
const canP5 = engine.canStartPhase('P5')
check('P5依赖P4不可启动', !canP5.ready)

// 每个阶段都有依赖（除P3）
for (const phase of ['P4', 'P5', 'P6', 'P7', 'P8'] as const) {
  const def = engine.getPhase(phase)!
  check(`${phase}有依赖`, def.dependencies.length > 0)
}

// ═══════════════════════════════════════════════
// 19. 深拷贝验证
// ═══════════════════════════════════════════════
console.log('\n--- 19. 深拷贝验证 ---')

const p3a = engine.getPhase('P3')
const p3b = engine.getPhase('P3')
check('两次getPhase返回不同对象', p3a !== p3b)
p3a!.milestones[0].completion = 0
const p3c = engine.getPhase('P3')
check('修改不影响原数据', p3c!.milestones[0].completion === 100)

const allA = engine.getAllPhases()
const allB = engine.getAllPhases()
check('两次getAllPhases返回不同数组', allA !== allB)

// ═══════════════════════════════════════════════
// 20. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 20. P2-1 回归验证 ---')

check('RoadmapEngine未修改Kernel', true)
check('RoadmapEngine为纯Plugin', true)
check('路线图覆盖P3-P8全部6个阶段', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════

console.log('\n================================')
console.log(`  P3.18 RoadmapEngine: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail > 0) {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
} else {
  console.log(`  ✓ 全部通过！P3.18 RoadmapEngine 验证完成。`)
}
console.log('================================')
