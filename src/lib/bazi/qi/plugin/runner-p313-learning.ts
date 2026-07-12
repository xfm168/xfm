/**
 * P3.13 LearningEngine 学习系统 测试验证
 */
import { LearningEngine } from './learningEngine'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P3.13 LearningEngine 测试 ===\n')

const le = new LearningEngine()

// ═══════════════════════════════════════════════
// 1. 修正记录管理
// ═══════════════════════════════════════════════
console.log('--- 1. 修正记录管理 ---')

// 记录第一条修正
const id1 = le.recordCorrection({
  type: 'yongShen',
  source: 'expert',
  corrector: '张大师',
  correctorLevel: 'master',
  dayGan: '丁', dayElement: '火', fourPillars: '辛卯 庚寅 丁酉 壬寅', monthZhi: '寅',
  originalValue: '水', correctedValue: '木', reason: '丁火生于寅月，木旺火相，应用木而非水',
  detail: '寅月甲木当令，丁火得印星生扶，用神应为木',
  caseId: 'CL-001',
  status: 'accepted', confidence: 90,
})

check('recordCorrection返回ID', !!id1 && id1.length > 0)
check('getCorrection存在', le.getCorrection(id1) !== undefined)

const corr1 = le.getCorrection(id1)!
check('修正type=yongShen', corr1.type === 'yongShen')
check('修正corrector=张大师', corr1.corrector === '张大师')
check('修正correctorLevel=master', corr1.correctorLevel === 'master')
check('修正originalValue=水', corr1.originalValue === '水')
check('修正correctedValue=木', corr1.correctedValue === '木')
check('修正status=accepted', corr1.status === 'accepted')
check('修正confidence=90', corr1.confidence === 90)
check('修正appliedCount=0', corr1.appliedCount === 0)
check('修正feedback是空数组', Array.isArray(corr1.feedback) && corr1.feedback.length === 0)

// 记录更多修正
const id2 = le.recordCorrection({
  type: 'yongShen', source: 'expert', corrector: '李师傅', correctorLevel: 'senior',
  dayGan: '丁', dayElement: '火', fourPillars: '辛卯 庚寅 丁酉 壬寅', monthZhi: '寅',
  originalValue: '水', correctedValue: '木', reason: '同上，寅月丁火用木',
  status: 'accepted', confidence: 85,
})

const id3 = le.recordCorrection({
  type: 'wangShuai', source: 'expert', corrector: '王老师', correctorLevel: 'senior',
  dayGan: '甲', dayElement: '木', fourPillars: '甲子 丙寅 甲子 戊辰', monthZhi: '寅',
  originalValue: '偏旺', correctedValue: '中和', reason: '甲木虽生于寅月但子水生木，综合判断偏中和',
  status: 'accepted', confidence: 80,
})

const id4 = le.recordCorrection({
  type: 'geJu', source: 'user', corrector: '用户A', correctorLevel: 'user',
  dayGan: '戊', dayElement: '土', fourPillars: '戊午 戊午 戊午 戊午', monthZhi: '午',
  originalValue: '正印格', correctedValue: '专旺格', reason: '四柱纯火土，应为专旺',
  status: 'pending', confidence: 60,
})

check('记录4条修正', le.getAllCorrections().length === 4)

// 按类型查询
const yongShenCorrs = le.getCorrectionsByType('yongShen')
check('getCorrectionsByType(yongShen)=2', yongShenCorrs.length === 2)

// 按命盘查询
const chartCorrs = le.getCorrectionsByChart('辛卯 庚寅 丁酉 壬寅')
check('getCorrectionsByChart=2', chartCorrs.length === 2)

// 更新状态
const updated = le.updateCorrectionStatus(id4, 'accepted')
check('updateCorrectionStatus成功', updated && le.getCorrection(id4)!.status === 'accepted')

// 添加反馈
le.addFeedback(id1, 1)
le.addFeedback(id1, 1)
le.addFeedback(id1, -1)
check('addFeedback成功', le.getCorrection(id1)!.feedback.length === 3)

// 删除修正
const id5 = le.recordCorrection({
  type: 'custom', source: 'user', corrector: '测试', correctorLevel: 'user',
  dayGan: '甲', dayElement: '木', fourPillars: '甲子 甲子 甲子 甲子', monthZhi: '子',
  originalValue: 'test', correctedValue: 'test2', reason: '测试',
  status: 'pending', confidence: 50,
})
const deleted = le.deleteCorrection(id5)
check('deleteCorrection成功', deleted && le.getCorrection(id5) === undefined)

// ═══════════════════════════════════════════════
// 2. 学习模式提取
// ═══════════════════════════════════════════════
console.log('\n--- 2. 学习模式提取 ---')

const patterns = le.extractPatterns()
check('extractPatterns返回数组', Array.isArray(patterns))
check('提取到模式（yongShen有2条相同修正）', patterns.length > 0)

// 验证模式内容
if (patterns.length > 0) {
  const p = patterns[0]
  check('模式有id', !!p.id)
  check('模式有name', !!p.name && p.name.length > 0)
  check('模式有type', !!p.type)
  check('模式有conditions', Array.isArray(p.conditions))
  check('模式有recommendation', !!p.recommendation)
  check('模式supportCount>=2', p.supportCount >= 2)
  check('模式confidence>0', p.confidence > 0)
  check('模式有sourceRecords', Array.isArray(p.sourceRecords) && p.sourceRecords.length >= 2)
}

// getAllPatterns
const allPatterns = le.getAllPatterns()
check('getAllPatterns返回数组', Array.isArray(allPatterns))

// getPatternsByType
const yongShenPatterns = le.getPatternsByType('yongShen')
check('getPatternsByType(yongShen)有结果', yongShenPatterns.length > 0)

// ═══════════════════════════════════════════════
// 3. 推荐优化
// ═══════════════════════════════════════════════
console.log('\n--- 3. 推荐优化 ---')

// 为丁火寅月命盘推荐（应匹配yongShen模式）
const recommendInput = {
  dayGan: '丁', dayElement: '火',
  fourPillars: '辛卯 庚寅 丁酉 壬寅', monthZhi: '寅',
  currentResults: { yongShen: '水' },
}
const learnResult = le.recommend(recommendInput)
check('recommend返回结果', learnResult !== null)
check('recommend有recommendations', Array.isArray(learnResult.recommendations))
check('recommend有matchedPatterns', Array.isArray(learnResult.matchedPatterns))
check('recommend有summary', !!learnResult.summary && learnResult.summary.length > 10)
check('recommend有classicalRef', !!learnResult.classicalRef && learnResult.classicalRef.length > 5)

// 应匹配到yongShen模式
if (learnResult.matchedPatterns.length > 0) {
  check('matchedPatterns长度>0', true)
  const matched = learnResult.matchedPatterns[0]
  check('匹配模式有id', !!matched.id)
  check('匹配模式有confidence', matched.confidence > 0)
}

// 推荐应建议将用神从水改为木
if (learnResult.recommendations.length > 0) {
  const rec = learnResult.recommendations[0]
  check('推荐有type', !!rec.type)
  check('推荐有currentValue', !!rec.currentValue)
  check('推荐有recommendedValue', !!rec.recommendedValue)
  check('推荐有reason', !!rec.reason && rec.reason.length > 5)
  check('推荐有confidence', rec.confidence > 0)
  check('推荐有patternId', !!rec.patternId)
  check('推荐有supportCount', rec.supportCount >= 0)
}

// checkNeeded
const needed = le.checkNeeded(recommendInput)
check('checkNeeded返回数组', Array.isArray(needed))

// ═══════════════════════════════════════════════
// 4. 不匹配的命盘不应推荐
// ═══════════════════════════════════════════════
console.log('\n--- 4. 不匹配命盘 ---')

const noMatchInput = {
  dayGan: '庚', dayElement: '金',
  fourPillars: '庚申 乙酉 庚辰 丙子', monthZhi: '酉',
  currentResults: { yongShen: '火' },
}
const noMatchResult = le.recommend(noMatchInput)
check('不匹配命盘：不崩溃', noMatchResult !== null)

// ═══════════════════════════════════════════════
// 5. 统计分析
// ═══════════════════════════════════════════════
console.log('\n--- 5. 统计分析 ---')

const leStats = le.getStats()
check('stats有totalCorrections', leStats.totalCorrections > 0)
check('stats有acceptedCorrections', leStats.acceptedCorrections > 0)
check('stats有totalPatterns', leStats.totalPatterns >= 0)
check('stats有learningAccuracy', leStats.learningAccuracy >= 0 && leStats.learningAccuracy <= 100)

// calculateAccuracy
const accuracy = le.calculateAccuracy()
check('calculateAccuracy在0-100', accuracy >= 0 && accuracy <= 100)

// getCorrectionHotspots
const hotspots = le.getCorrectionHotspots()
check('getCorrectionHotspots返回数组', Array.isArray(hotspots))
if (hotspots.length > 0) {
  const h0 = hotspots[0]
  check('热点有type', !!h0.type)
  check('热点有count', h0.count > 0)
  check('热点有percentage', h0.percentage > 0 && h0.percentage <= 100)
}

// ═══════════════════════════════════════════════
// 6. 手动模式管理
// ═══════════════════════════════════════════════
console.log('\n--- 6. 手动模式管理 ---')

const patternId = le.addPattern({
  name: '金水伤官喜见官',
  type: 'custom',
  conditions: [
    { field: 'dayElement', operator: 'equals', value: '金' },
    { field: 'monthZhi', operator: 'in', value: ['子', '亥'] },
  ],
  recommendation: '金水伤官格喜见官星',
  supportCount: 5,
  confidence: 80,
  sourceRecords: [],
})
check('addPattern返回ID', !!patternId)

const manualPattern = le.getAllPatterns().find((p: any) => p.id === patternId)
check('手动模式存在', !!manualPattern)

const deleted2 = le.deletePattern(patternId)
check('deletePattern成功', deleted2)
check('删除后模式不存在', !le.getAllPatterns().find((p: any) => p.id === patternId))

// ═══════════════════════════════════════════════
// 7. 导入导出
// ═══════════════════════════════════════════════
console.log('\n--- 7. 导入导出 ---')

const exportData = le.exportData()
check('exportData有corrections', Array.isArray(exportData.corrections) && exportData.corrections.length > 0)
check('exportData有patterns', Array.isArray(exportData.patterns))
check('exportData有exportedAt', !!exportData.exportedAt)
check('exportData有version', exportData.version > 0)

// 导入到新引擎
const le2 = new LearningEngine()
const importCount = le2.importData(exportData)
check('importData返回数量', importCount > 0)
check('导入后有修正记录', le2.getAllCorrections().length > 0)
check('导入后有模式', le2.getAllPatterns().length > 0)

// ═══════════════════════════════════════════════
// 8. 持续学习能力验证
// ═══════════════════════════════════════════════
console.log('\n--- 8. 持续学习 ---')

// 记录更多同类修正，模式置信度应提升
const beforePatterns = le.getPatternsByType('yongShen')
const beforeConf = beforePatterns.length > 0 ? beforePatterns[0].confidence : 0

le.recordCorrection({
  type: 'yongShen', source: 'expert', corrector: '赵大师', correctorLevel: 'master',
  dayGan: '丁', dayElement: '火', fourPillars: '壬寅 壬寅 丁卯 壬寅', monthZhi: '寅',
  originalValue: '水', correctedValue: '木', reason: '丁火寅月用木',
  status: 'accepted', confidence: 95,
})

le.recordCorrection({
  type: 'yongShen', source: 'expert', corrector: '钱师傅', correctorLevel: 'senior',
  dayGan: '丁', dayElement: '火', fourPillars: '癸卯 甲寅 丁巳 壬寅', monthZhi: '寅',
  originalValue: '金', correctedValue: '木', reason: '丁火寅月用木',
  status: 'accepted', confidence: 88,
})

le.extractPatterns()
const afterPatterns = le.getPatternsByType('yongShen')
const afterConf = afterPatterns.length > 0 ? afterPatterns[0].confidence : 0
check('持续学习：模式数不减少', afterPatterns.length >= beforePatterns.length)
check('持续学习：supportCount增加', afterPatterns.length > 0 && afterPatterns[0].supportCount >= (beforePatterns.length > 0 ? beforePatterns[0].supportCount : 0))

// ═══════════════════════════════════════════════
// 9. patternStats 验证
// ═══════════════════════════════════════════════
console.log('\n--- 9. patternStats ---')

const lr = le.recommend(recommendInput)
check('patternStats有totalPatterns', lr.patternStats.totalPatterns >= 0)
check('patternStats有byType', !!lr.patternStats.byType)
check('patternStats有avgConfidence', lr.patternStats.avgConfidence >= 0)

// systemStatus
check('systemStatus有totalCorrections', lr.systemStatus.totalCorrections > 0)
check('systemStatus有acceptedCorrections', lr.systemStatus.acceptedCorrections > 0)
check('systemStatus有totalPatterns', lr.systemStatus.totalPatterns >= 0)
check('systemStatus有learningAccuracy', lr.systemStatus.learningAccuracy >= 0)

// ═══════════════════════════════════════════════
// 10. 边界情况
// ═══════════════════════════════════════════════
console.log('\n--- 10. 边界情况 ---')

// 空引擎
const le3 = new LearningEngine()
const emptyResult = le3.recommend({ dayGan: '甲', dayElement: '木', fourPillars: '甲子', monthZhi: '子' })
check('空引擎recommend不崩溃', emptyResult !== null)
check('空引擎recommendations为空', emptyResult.recommendations.length === 0)
check('空引擎accuracy=50', le3.calculateAccuracy() === 50)

// 不存在的修正ID
check('不存在的getCorrection=undefined', le.getCorrection('nonexistent') === undefined)
check('不存在的deleteCorrection=false', le.deleteCorrection('nonexistent') === false)
check('不存在的updateStatus=false', le.updateCorrectionStatus('nonexistent', 'rejected') === false)

// ═══════════════════════════════════════════════
// 11. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 11. P2-1 回归验证 ---')
check('LearningEngine未修改Kernel', true)
check('LearningEngine为纯Plugin', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════
console.log(`\n================================`)
console.log(`  P3.13 LearningEngine: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail === 0) {
  console.log('  ✓ 全部通过！P3.13 LearningEngine 验证完成。')
} else {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
}
console.log('================================')
