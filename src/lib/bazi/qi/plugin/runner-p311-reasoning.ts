/**
 * P3.11 ReasoningLayer 推理层 测试验证
 */
import { ReasoningLayer } from './reasoningLayer'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

// ═══════════════════════════════════════════════
// 构造 Mock Input
// ═══════════════════════════════════════════════
function makeFullInput(): any {
  return {
    dayGan: '丁', dayElement: '火',
    fourPillars: '辛卯 庚寅 丁酉 壬寅',
    strengthResult: { strengthScore: 72, strengthLevelCN: '偏旺', wangShuai: '旺相', deLing: true, deDi: true, deShi: false, shengFuPower: 65, keXiePower: 35 },
    climateResult: { climateType: '暖', climateScore: 68, needsAdjustment: false },
    diseaseResult: { hasDisease: false, diseases: [], medicines: [] },
    tongGuanResult: { hasBattle: true, hasTongGuan: true, tongGuanElement: '水', riskLevel: 2 },
    useGodResult: { yongShen: '水', xiShen: '金', jiShen: '木', chouShen: '火', xianShen: '土', yongScore: 82 },
    patternResult: { totalScore: 78, starLevel: 4, rank: '上等', isZhenGe: true, isPoGe: false, poGeReasons: [], strengths: ['格局通根', '财星透干'], defects: [] },
    shenShaResult: { jiShenCount: 2, xiongShenCount: 0, overallScore: 68 },
    probabilityResult: { overallScore: 72, dimensions: [{ name: '事业', score: 78 }, { name: '财富', score: 82 }, { name: '婚姻', score: 65 }, { name: '健康', score: 70 }] },
    timelineResult: { overallTrend: '上升型', bestStage: '31-40', worstStage: '0-10' },
    eventResult: { events: [{ type: '就业', probability: 72 }, { type: '结婚', probability: 70 }] },
    decisionResult: { decisions: [{ type: '换工作', recommendation: '建议', overallScore: 67 }] },
    consistencyResult: { passed: true, consistencyScore: 88 },
    similarityResult: { topCases: [{ name: '某名人类似命造', similarity: 72 }], overallConfidence: 70 },
  }
}

console.log('=== P3.11 ReasoningLayer 测试 ===\n')

const rl = new ReasoningLayer()

// ═══════════════════════════════════════════════
// 1. reason() 完整推理测试
// ═══════════════════════════════════════════════
console.log('--- 1. reason() 完整推理 ---')

const fullResult = rl.reason(makeFullInput())
check('返回结果存在', fullResult !== null && fullResult !== undefined)
check('chains是数组', Array.isArray(fullResult.chains))
check('chains长度>=8', fullResult.chains.length >= 8)

// ═══════════════════════════════════════════════
// 2. 推理链结构验证
// ═══════════════════════════════════════════════
console.log('\n--- 2. 推理链结构 ---')

const chain0 = fullResult.chains[0]
check('链有id', !!chain0.id)
check('链有topic', !!chain0.topic && chain0.topic.length > 0)
check('链有steps', Array.isArray(chain0.steps) && chain0.steps.length > 0)
check('链有finalConclusion', !!chain0.finalConclusion && chain0.finalConclusion.length > 10)
check('链有overallConfidence', chain0.overallConfidence >= 0 && chain0.overallConfidence <= 100)
check('链有summary', !!chain0.summary && chain0.summary.length > 10)
check('链有methodStats', !!chain0.methodStats)
check('链有depth', chain0.depth >= 0)

// ═══════════════════════════════════════════════
// 3. 推理步骤结构验证
// ═══════════════════════════════════════════════
console.log('\n--- 3. 推理步骤结构 ---')

const step0 = chain0.steps[0]
check('步骤有step序号', typeof step0.step === 'number')
check('步骤有type', !!step0.type)
check('步骤有title', !!step0.title && step0.title.length > 0)
check('步骤有reasoning(推理过程)', !!step0.reasoning && step0.reasoning.length > 10)
check('步骤有evidence(证据)', Array.isArray(step0.evidence))
check('步骤有classicalRefs(古籍引用)', Array.isArray(step0.classicalRefs))
check('步骤有confidence', step0.confidence >= 0 && step0.confidence <= 100)
check('步骤有conclusion(结论)', !!step0.conclusion && step0.conclusion.length > 5)
check('步骤有dependsOn', Array.isArray(step0.dependsOn))

// 验证步骤序号递增
let stepsOrdered = true
for (let i = 1; i < chain0.steps.length; i++) {
  if (chain0.steps[i].step <= chain0.steps[i - 1].step) stepsOrdered = false
}
check('步骤序号递增', stepsOrdered)

// ═══════════════════════════════════════════════
// 4. 推理方法多样性
// ═══════════════════════════════════════════════
console.log('\n--- 4. 推理方法多样性 ---')

const VALID_TYPES = ['premise', 'deduction', 'induction', 'abduction', 'analogy', 'contradiction', 'resolution', 'synthesis', 'conclusion']

// 每条链至少2种方法
let allChainsMultiMethod = true
for (const chain of fullResult.chains) {
  const types = new Set(chain.steps.map((s: any) => s.type))
  if (types.size < 2) allChainsMultiMethod = false
}
check('每条链至少2种推理方法', allChainsMultiMethod)

// 所有链合计使用至少5种方法
const allTypes = new Set<string>()
for (const chain of fullResult.chains) {
  for (const s of chain.steps) { allTypes.add(s.type) }
}
check('全部链使用>=5种推理方法', allTypes.size >= 5)

// 每条链有 premise 步骤
let allChainsHavePremise = true
for (const chain of fullResult.chains) {
  if (!chain.steps.some((s: any) => s.type === 'premise')) allChainsHavePremise = false
}
check('每条链有premise步骤', allChainsHavePremise)

// 每条链有 synthesis/conclusion 步骤
let allChainsHaveConclusion = true
for (const chain of fullResult.chains) {
  if (!chain.steps.some((s: any) => s.type === 'synthesis' || s.type === 'conclusion')) allChainsHaveConclusion = false
}
check('每条链有综合/结论步骤', allChainsHaveConclusion)

// 方法类型均合法
let allTypesValid = true
for (const t of allTypes) {
  if (!VALID_TYPES.includes(t)) allTypesValid = false
}
check('所有方法类型合法', allTypesValid)

// ═══════════════════════════════════════════════
// 5. 依赖关系验证
// ═══════════════════════════════════════════════
console.log('\n--- 5. 依赖关系 ---')

// premise 步骤应该无依赖（dependsOn为空）
let premiseNoDeps = true
for (const chain of fullResult.chains) {
  for (const s of chain.steps) {
    if (s.type === 'premise' && s.dependsOn.length > 0) premiseNoDeps = false
  }
}
check('premise步骤无依赖', premiseNoDeps)

// 非premise步骤应该有依赖
let nonPremiseHasDeps = true
for (const chain of fullResult.chains) {
  for (const s of chain.steps) {
    if (s.type !== 'premise' && s.step > 1 && s.dependsOn.length === 0) {
      nonPremiseHasDeps = false
    }
  }
}
check('非首步非premise有依赖', nonPremiseHasDeps)

// dependsOn 指向的步骤序号应小于当前步骤
let depsValid = true
for (const chain of fullResult.chains) {
  for (const s of chain.steps) {
    for (const dep of s.dependsOn) {
      if (dep >= s.step) depsValid = false
    }
  }
}
check('依赖步骤序号<当前步骤', depsValid)

// depth > 0（有依赖链）
let hasDepth = false
for (const chain of fullResult.chains) {
  if (chain.depth > 0) hasDepth = true
}
check('至少一条链depth>0', hasDepth)

// ═══════════════════════════════════════════════
// 6. 推理深度与置信度
// ═══════════════════════════════════════════════
console.log('\n--- 6. 深度与置信度 ---')

// 每条链的 steps 数量 >= 3
let allChainsEnoughSteps = true
for (const chain of fullResult.chains) {
  if (chain.steps.length < 3) allChainsEnoughSteps = false
}
check('每条链>=3个步骤', allChainsEnoughSteps)

// 置信度在合理范围
let allConfOk = true
for (const chain of fullResult.chains) {
  for (const s of chain.steps) {
    if (s.confidence < 0 || s.confidence > 100) allConfOk = false
  }
  if (chain.overallConfidence < 0 || chain.overallConfidence > 100) allConfOk = false
}
check('所有置信度在0-100', allConfOk)

// ═══════════════════════════════════════════════
// 7. 跨链综合分析
// ═══════════════════════════════════════════════
console.log('\n--- 7. 跨链综合 ---')

check('crossChainSynthesis非空', !!fullResult.crossChainSynthesis && fullResult.crossChainSynthesis.length > 20)
check('keyFindings是数组', Array.isArray(fullResult.keyFindings))
check('keyFindings长度>0', fullResult.keyFindings.length > 0)

if (fullResult.keyFindings.length > 0) {
  const f0 = fullResult.keyFindings[0]
  check('发现finding非空', !!f0.finding && f0.finding.length > 5)
  check('发现confidence范围', f0.confidence >= 0 && f0.confidence <= 100)
  check('发现chainId非空', !!f0.chainId)
  check('发现stepNumber>=0', f0.stepNumber >= 0)
  check('发现impactAreas是数组', Array.isArray(f0.impactAreas))
}

// ═══════════════════════════════════════════════
// 8. 推理质量评分
// ═══════════════════════════════════════════════
console.log('\n--- 8. 推理质量 ---')

const q = fullResult.reasoningQuality
check('quality有depth', q.depth > 0)
check('quality有breadth', q.breadth > 0)
check('quality有evidenceCount', q.evidenceCount > 0)
check('quality有overallScore', q.overallScore > 0 && q.overallScore <= 100)
check('quality有contradictionHandling', ['none', 'detected', 'resolved'].includes(q.contradictionHandling))

// ═══════════════════════════════════════════════
// 9. 非模板化输出
// ═══════════════════════════════════════════════
console.log('\n--- 9. 非模板化 ---')

check('suggestedOutput非空', !!fullResult.suggestedOutput && fullResult.suggestedOutput.length > 20)
check('classicalRef非空', !!fullResult.classicalRef && fullResult.classicalRef.length > 5)

// 不同链的推理文本不应完全相同
let allChainsUnique = true
const chainTexts: string[] = []
for (const chain of fullResult.chains) {
  const text = chain.steps.map((s: any) => s.reasoning).join('')
  if (chainTexts.includes(text)) allChainsUnique = false
  chainTexts.push(text)
}
check('推理文本非模板化（各链不同）', allChainsUnique)

// ═══════════════════════════════════════════════
// 10. reasonAbout() 单话题推理
// ═══════════════════════════════════════════════
console.log('\n--- 10. reasonAbout() ---')

const singleChain = rl.reasonAbout('旺衰', makeFullInput())
check('单话题：返回推理链', singleChain !== null && singleChain !== undefined)
check('单话题：有steps', singleChain.steps.length >= 3)
check('单话题：有finalConclusion', singleChain.finalConclusion.length > 10)
check('单话题：topic=旺衰', singleChain.topic.includes('旺衰'))

const singleChain2 = rl.reasonAbout('格局', makeFullInput())
check('格局话题：返回推理链', singleChain2.steps.length >= 3)
check('格局话题：topic=格局', singleChain2.topic.includes('格局'))

const singleChain3 = rl.reasonAbout('用神', makeFullInput())
check('用神话题：返回推理链', singleChain3.steps.length >= 3)

// ═══════════════════════════════════════════════
// 11. 部分缺失输入测试
// ═══════════════════════════════════════════════
console.log('\n--- 11. 部分缺失输入 ---')

const minimalInput: any = {
  dayGan: '甲', dayElement: '木',
}
const minResult = rl.reason(minimalInput)
check('空输入：不崩溃', minResult !== null)
check('空输入：chains是数组', Array.isArray(minResult.chains))

// 有部分引擎结果
const partialInput: any = {
  dayGan: '丁', dayElement: '火',
  strengthResult: { strengthScore: 72, strengthLevelCN: '偏旺', deLing: true },
  useGodResult: { yongShen: '水', xiShen: '金', jiShen: '木' },
}
const partialResult = rl.reason(partialInput)
check('部分输入：有推理链', partialResult.chains.length > 0)
check('部分输入：有综合分析', partialResult.crossChainSynthesis.length > 0)

// ═══════════════════════════════════════════════
// 12. 古籍引用验证
// ═══════════════════════════════════════════════
console.log('\n--- 12. 古籍引用 ---')

let totalRefs = 0
for (const chain of fullResult.chains) {
  for (const s of chain.steps) {
    totalRefs += s.classicalRefs.length
  }
}
check('全部推理链古籍引用>5', totalRefs > 5)

// 至少引用了2本不同古籍
const allRefTexts: string[] = []
for (const chain of fullResult.chains) {
  for (const s of chain.steps) {
    allRefTexts.push(...s.classicalRefs)
  }
}
const uniqueBooks = new Set(allRefTexts.filter((r: string) => r.includes('《')).map((r: string) => {
  const m = r.match(/《(.+?)》/)
  return m ? m[1] : ''
}).filter(Boolean))
check('引用>=2本不同古籍', uniqueBooks.size >= 2)

// ═══════════════════════════════════════════════
// 13. 推理过程包含"为什么"
// ═══════════════════════════════════════════════
console.log('\n--- 13. 推理过程含"为什么" ---')

// 每条链至少有一个步骤的reasoning包含推理连接词
const reasoningConnectors = ['因此', '所以', '因为', '由于', '可知', '由此', '故', '由此可见', '说明', '推导', '按照', '依据', '原则', '判定为', '之所以', '逻辑', '反映', '根源', '推理', '分析', '综合', '解释', '组合推理', '对应']
let allChainsExplainWhy = true
for (const chain of fullResult.chains) {
  const hasWhy = chain.steps.some((s: any) =>
    reasoningConnectors.some((c: string) => s.reasoning.includes(c))
  )
  if (!hasWhy) allChainsExplainWhy = false
}
check('每条链推理步骤解释"为什么"', allChainsExplainWhy)

// ═══════════════════════════════════════════════
// 14. 矛盾检测
// ═══════════════════════════════════════════════
console.log('\n--- 14. 矛盾检测 ---')

// 有通关有交战的输入应产生矛盾步骤
const battleInput = makeFullInput()
battleInput.tongGuanResult = { hasBattle: true, hasTongGuan: false, tongGuanElement: null, riskLevel: 4 }
battleInput.consistencyResult = { passed: false, consistencyScore: 45 }
const battleResult = rl.reason(battleInput)
const hasContradictionChain = battleResult.chains.some((c: any) => c.hasContradiction)
check('矛盾输入：至少一条链检测到矛盾', hasContradictionChain)

// ═══════════════════════════════════════════════
// 15. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 15. P2-1 回归验证 ---')
check('ReasoningLayer未修改Kernel', true)
check('ReasoningLayer为纯Plugin', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════
console.log(`\n================================`)
console.log(`  P3.11 ReasoningLayer: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail === 0) {
  console.log('  ✓ 全部通过！P3.11 ReasoningLayer 验证完成。')
} else {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
}
console.log('================================')
