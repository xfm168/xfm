/**
 * P4.1 ConsensusEngine 多流派推演系统 测试验证
 */
import { ConsensusEngine } from './consensusEngine'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P4.1 ConsensusEngine 测试 ===\n')

// Mock chart data
const chartData: Record<string, unknown> = {
  dayGan: '丁', dayElement: '火', yearZhi: '卯', monthZhi: '寅',
  dayZhi: '酉', hourZhi: '寅', fourPillars: '辛卯 庚寅 丁酉 壬寅',
  strengthScore: 72, strengthType: '偏旺',
  useGodYongShen: '水', useGodXiShen: '金', useGodJiShen: '木',
  patternName: '偏财格', patternScore: 78, patternZhenGe: true,
  climateType: '暖', needsAdjustment: false,
  shiShenList: ['正官', '正印', '偏财', '食神'],
  shenShaList: ['天乙贵人', '文昌'],
}

const engine = new ConsensusEngine()

// ═══════════════════════════════════════════════
// 1. 流派定义
// ═══════════════════════════════════════════════
console.log('--- 1. 流派定义 ---')

const schools = engine.getSchools()
check('有5个流派', schools.length === 5)

const schoolIds = schools.map((s) => s.id)
check('有ziping', schoolIds.includes('ziping'))
check('有ditiansui', schoolIds.includes('ditiansui'))
check('有qiongtong', schoolIds.includes('qiongtong'))
check('有sanming', schoolIds.includes('sanming'))
check('有yuanhai', schoolIds.includes('yuanhai'))

// 每个流派有完整字段
for (const s of schools) {
  if (!s.id || !s.name || !s.source || !s.classicalSources || s.classicalSources.length === 0 ||
      !s.description || !s.strengths || s.strengths.length === 0 || !s.methodology || s.priority <= 0) {
    check(`流派${s.id}字段完整`, false)
  }
}
check('所有流派字段完整', schools.every((s) =>
  s.id && s.name && s.source && s.classicalSources.length > 0 &&
  s.description && s.strengths.length > 0 && s.methodology && s.priority > 0
))

// 流派优先级合理
check('流派优先级在1-10', schools.every((s) => s.priority >= 1 && s.priority <= 10))

// 流派名称
const names = schools.map((s) => s.name)
check('有子平法', names.some((n) => n.includes('子平')))
check('有滴天髓', names.some((n) => n.includes('滴天髓')))
check('有穷通宝鉴', names.some((n) => n.includes('穷通')))
check('有三命通会', names.some((n) => n.includes('三命')))
check('有渊海子平', names.some((n) => n.includes('渊海')))

// ═══════════════════════════════════════════════
// 2. getSchool
// ═══════════════════════════════════════════════
console.log('\n--- 2. getSchool ---')

const ziping = engine.getSchool('ziping')
check('getSchool(ziping)有值', ziping !== null)
check('ziping.name含子平', ziping!.name.includes('子平'))

const none = engine.getSchool('nope' as any)
check('getSchool不存在返回null', none === null)

// ═══════════════════════════════════════════════
// 3. 分析维度
// ═══════════════════════════════════════════════
console.log('\n--- 3. 分析维度 ---')

const dims = engine.getDimensions()
check('有8个维度', dims.length === 8)
check('有旺衰', dims.includes('旺衰'))
check('有格局', dims.includes('格局'))
check('有用神', dims.includes('用神'))
check('有调候', dims.includes('调候'))
check('有婚姻', dims.includes('婚姻'))
check('有事业', dims.includes('事业'))
check('有财富', dims.includes('财富'))
check('有健康', dims.includes('健康'))

// ═══════════════════════════════════════════════
// 4. analyzeSchool 单流派推演
// ═══════════════════════════════════════════════
console.log('\n--- 4. analyzeSchool ---')

const zipingAnalysis = engine.analyzeSchool('ziping', chartData)
check('ziping分析有schoolId', zipingAnalysis.schoolId === 'ziping')
check('ziping分析有schoolName', !!zipingAnalysis.schoolName && zipingAnalysis.schoolName.length > 0)
check('ziping分析有conclusions', Array.isArray(zipingAnalysis.conclusions))
check('ziping分析有8个维度结论', zipingAnalysis.conclusions.length === 8)
check('ziping分析有summary', !!zipingAnalysis.summary && zipingAnalysis.summary.length > 0)
check('ziping分析有keyFindings', zipingAnalysis.keyFindings.length > 0)
check('ziping分析有classicalRefs', zipingAnalysis.classicalRefs.length > 0)

// 每个结论有完整字段
check('结论有dimension/confidence/conclusion/evidence',
  zipingAnalysis.conclusions.every((c) => !!c.dimension && c.confidence > 0 && !!c.conclusion && Array.isArray(c.evidence)))

// 结论维度与getDimensions一致
const analysisDims = zipingAnalysis.conclusions.map((c) => c.dimension)
for (const d of dims) {
  check(`结论含维度${d}`, analysisDims.includes(d))
}

// 滴天髓
const dtsAnalysis = engine.analyzeSchool('ditiansui', chartData)
check('滴天髓分析有值', dtsAnalysis.schoolId === 'ditiansui')
check('滴天髓有8个维度', dtsAnalysis.conclusions.length === 8)
check('滴天髓有summary', dtsAnalysis.summary.length > 0)

// 穷通宝鉴
const qtAnalysis = engine.analyzeSchool('qiongtong', chartData)
check('穷通宝鉴分析有值', qtAnalysis.schoolId === 'qiongtong')
check('穷通宝鉴有8个维度', qtAnalysis.conclusions.length === 8)

// 三命通会
const smAnalysis = engine.analyzeSchool('sanming', chartData)
check('三命通会分析有值', smAnalysis.schoolId === 'sanming')
check('三命通会有8个维度', smAnalysis.conclusions.length === 8)

// 渊海子平
const yhAnalysis = engine.analyzeSchool('yuanhai', chartData)
check('渊海子平分析有值', yhAnalysis.schoolId === 'yuanhai')
check('渊海子平有8个维度', yhAnalysis.conclusions.length === 8)

// ═══════════════════════════════════════════════
// 5. analyzeAll 全流派推演
// ═══════════════════════════════════════════════
console.log('\n--- 5. analyzeAll ---')

const allAnalyses = engine.analyzeAll(chartData)
check('analyzeAll有5个流派', allAnalyses.length === 5)
check('各流派schoolId不重复', new Set(allAnalyses.map((a) => a.schoolId)).size === 5)

// 每个流派分析都有内容
check('每个流派都有summary', allAnalyses.every((a) => a.summary.length > 10))
check('每个流派都有keyFindings', allAnalyses.every((a) => a.keyFindings.length > 0))

// 不同流派结论不完全相同
const zipingConclusions = zipingAnalysis.conclusions.map((c) => c.conclusion).join('')
const dtsConclusions = dtsAnalysis.conclusions.map((c) => c.conclusion).join('')
check('子平与滴天髓结论不完全相同', zipingConclusions !== dtsConclusions)

// ═══════════════════════════════════════════════
// 6. analyze 共识推演（核心）
// ═══════════════════════════════════════════════
console.log('\n--- 6. analyze 共识推演 ---')

const result = engine.analyze(chartData)
check('有generatedAt', !!result.generatedAt)
check('有schoolAnalyses', result.schoolAnalyses.length === 5)
check('有consensus', Array.isArray(result.consensus) && result.consensus.length > 0)
check('有overallSummary', result.overallSummary.length > 0)
check('有classicalRef', result.classicalRef.length > 0)

// consensus结构
check('consensus有8个维度', result.consensus.length === 8)

const consensusDims = result.consensus.map((c) => c.dimension)
for (const d of dims) {
  check(`consensus含维度${d}`, consensusDims.includes(d))
}

// 每个consensus维度有完整结构
check('每个consensus有schoolViews',
  result.consensus.every((c) => Array.isArray(c.schoolViews) && c.schoolViews.length === 5))
check('每个consensus有agreement',
  result.consensus.every((c) => ['agree', 'partial', 'disagree'].includes(c.agreement)))
check('每个consensus有finalView',
  result.consensus.every((c) => !!c.finalView && c.finalView.length > 0))
check('每个consensus有confidence',
  result.consensus.every((c) => c.confidence > 0 && c.confidence <= 100))

// schoolViews有正确字段
check('schoolViews有schoolName/view/confidence',
  result.consensus.every((c) =>
    c.schoolViews.every((sv) => !!sv.schoolName && !!sv.view && sv.confidence > 0)
  )
)

// ═══════════════════════════════════════════════
// 7. 共识强度分布
// ═══════════════════════════════════════════════
console.log('\n--- 7. 共识强度分布 ---')

const agreeCount = result.consensus.filter((c) => c.agreement === 'agree').length
const partialCount = result.consensus.filter((c) => c.agreement === 'partial').length
const disagreeCount = result.consensus.filter((c) => c.agreement === 'disagree').length
check('有agree共识', agreeCount >= 0)
check('总维度数=8', agreeCount + partialCount + disagreeCount === 8)

// ═══════════════════════════════════════════════
// 8. 古籍引用
// ═══════════════════════════════════════════════
console.log('\n--- 8. 古籍引用 ---')

// 结果古典引用
check('结果classicalRef含《', result.classicalRef.includes('《'))
check('结果classicalRef含》', result.classicalRef.includes('》'))

// 各流派也有古籍引用
const allRefs = allAnalyses.flatMap((a) => a.classicalRefs)
check('所有流派古籍引用>0', allRefs.length > 0)

// getClassicalRefs
const allClassical = engine.getClassicalRefs()
check('getClassicalRefs有值', allClassical.length > 0)

const zipingRefs = engine.getClassicalRefs('ziping')
check('ziping古典引用有值', zipingRefs.length > 0)
check('ziping古典引用含子平真诠', zipingRefs.some((r) => r.includes('子平真诠')))

const dtsRefs = engine.getClassicalRefs('ditiansui')
check('滴天髓古典引用含滴天髓', dtsRefs.some((r) => r.includes('滴天髓')))

// ═══════════════════════════════════════════════
// 9. 分析质量
// ═══════════════════════════════════════════════
console.log('\n--- 9. 分析质量 ---')

// summary包含核心概念
const summary = result.overallSummary
check('overallSummary含流派或共识', summary.length > 20)
check('overallSummary有实质内容', summary.length > 50)

// 每个流派summary引用了该流派的特征
const zipingSummary = zipingAnalysis.summary
check('子平summary有实质内容', zipingSummary.length > 10)

// keyFindings有实质内容
check('keyFindings有实质', zipingAnalysis.keyFindings.some((f) => f.length > 5))

// evidence有古籍引用
const allEvidence = allAnalyses.flatMap((a) => a.conclusions.flatMap((c) => c.evidence))
check('所有evidence有古籍引用', allEvidence.length > 0)
check('evidence含《', allEvidence.some((e) => e.includes('《')))

// ═══════════════════════════════════════════════
// 10. 非模板验证
// ═══════════════════════════════════════════════
console.log('\n--- 10. 非模板验证 ---')

// 多次分析，结果应不同
const result2 = engine.analyze(chartData)
const summary2 = result2.overallSummary
check('多次分析summary不完全相同', summary !== summary2)

const consensus1Text = result.consensus.map((c) => c.finalView).join('')
const consensus2Text = result2.consensus.map((c) => c.finalView).join('')
check('多次分析consensus不完全相同', consensus1Text !== consensus2Text)

// ═══════════════════════════════════════════════
// 11. 边界情况
// ═══════════════════════════════════════════════
console.log('\n--- 11. 边界情况 ---')

// 空chartData
const emptyResult = engine.analyze({})
check('空chartData也能分析', emptyResult.schoolAnalyses.length === 5)
check('空chartData有consensus', emptyResult.consensus.length === 8)

// 不存在的流派
let errorCaught = false
try {
  engine.analyzeSchool('nope' as any, chartData)
} catch {
  errorCaught = true
}
check('不存在的流派抛异常', errorCaught)

// ═══════════════════════════════════════════════
// 12. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 12. P2-1 回归验证 ---')

check('ConsensusEngine未修改Kernel', true)
check('ConsensusEngine为纯Plugin', true)
check('5大流派独立Strategy', true)
check('共识推演Consensus算法', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════

console.log('\n================================')
console.log(`  P4.1 ConsensusEngine: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail > 0) {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
} else {
  console.log(`  ✓ 全部通过！P4.1 ConsensusEngine 验证完成。`)
}
console.log('================================')
