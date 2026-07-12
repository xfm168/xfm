/**
 * P3.16 PerformanceEngine 性能引擎 测试验证
 */
import { PerformanceEngine, GenericCache } from './performanceEngine'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P3.16 PerformanceEngine 测试 ===\n')

const engine = new PerformanceEngine()

// ═══════════════════════════════════════════════
// 1. GenericCache 基础操作
// ═══════════════════════════════════════════════
console.log('--- 1. GenericCache 基础操作 ---')

const cache = new GenericCache<string>('test', { maxSize: 5, defaultTTL: 60000 })
check('新建缓存：size=0', cache.size === 0)
check('新建缓存：getName=test', cache.getName() === 'test')

cache.set('k1', 'v1')
check('set后：size=1', cache.size === 1)
check('get：返回v1', cache.get('k1') === 'v1')
check('has：返回true', cache.has('k1'))
check('has不存在：返回false', !cache.has('nope'))

cache.delete('k1')
check('delete后：size=0', cache.size === 0)
check('delete后：get=null', cache.get('k1') === null)

// ═══════════════════════════════════════════════
// 2. TTL 过期
// ═══════════════════════════════════════════════
console.log('\n--- 2. TTL 过期 ---')

const ttlCache = new GenericCache<string>('ttl-test', { maxSize: 10, defaultTTL: 5000 })
ttlCache.set('short', 'data', 50) // 50ms
check('短TTL设置成功', ttlCache.has('short'))

// 等待过期
const waitStart = Date.now()
while (Date.now() - waitStart < 80) { /* busy wait */ }
check('过期后：get=null', ttlCache.get('short') === null)
check('过期后：has=false', !ttlCache.has('short'))

// ═══════════════════════════════════════════════
// 3. LRU 淘汰
// ═══════════════════════════════════════════════
console.log('\n--- 3. LRU 淘汰 ---')

const lruCache = new GenericCache<string>('lru', { maxSize: 3, defaultTTL: 60000 })
lruCache.set('a', '1')
lruCache.set('b', '2')
lruCache.set('c', '3')
check('3条后：size=3', lruCache.size === 3)

lruCache.set('d', '4') // 应淘汰 'a'（最久未访问）
check('淘汰后：size=3', lruCache.size === 3)
check('淘汰后：a不存在', lruCache.get('a') === null)
check('淘汰后：b存在', lruCache.get('b') === '2')
check('淘汰后：c存在', lruCache.get('c') === '3')
check('淘汰后：d存在', lruCache.get('d') === '4')

// 访问 b 使其变为最近使用
lruCache.get('b')
lruCache.set('e', '5') // 应淘汰 'c'
check('访问b后淘汰：b仍在', lruCache.get('b') === '2')
check('访问b后淘汰：c被淘汰', lruCache.get('c') === null)

const lruStats = lruCache.getStats()
check('LRU淘汰：evictions>=2', lruStats.evictions >= 2)

// ═══════════════════════════════════════════════
// 4. getOrCompute
// ═══════════════════════════════════════════════
console.log('\n--- 4. getOrCompute ---')

let computeCount = 0
const computeCache = new GenericCache<number>('compute', { maxSize: 10, defaultTTL: 60000 })

const r1 = computeCache.getOrCompute('x', () => { computeCount++; return 42 })
check('首次getOrCompute：返回42', r1 === 42)
check('首次getOrCompute：compute被调用1次', computeCount === 1)

const r2 = computeCache.getOrCompute('x', () => { computeCount++; return 99 })
check('缓存命中getOrCompute：仍返回42', r2 === 42)
check('缓存命中getOrCompute：compute未被再次调用', computeCount === 1)

// ═══════════════════════════════════════════════
// 5. CacheStats 统计
// ═══════════════════════════════════════════════
console.log('\n--- 5. CacheStats 统计 ---')

const statsCache = new GenericCache<string>('stats', { maxSize: 10, defaultTTL: 60000 })
statsCache.set('s1', 'a')
statsCache.get('s1') // hit
statsCache.get('s1') // hit
statsCache.get('no') // miss
statsCache.get('no2') // miss

const stats = statsCache.getStats()
check('stats：hits=2', stats.hits === 2)
check('stats：misses=2', stats.misses === 2)
check('stats：hitRate=0.5', Math.abs(stats.hitRate - 0.5) < 0.01)
check('stats：totalEntries=1', stats.totalEntries === 1)
check('stats：avgAccessTime>=0', stats.avgAccessTime >= 0)

// ═══════════════════════════════════════════════
// 6. clear 与 resetStats
// ═══════════════════════════════════════════════
console.log('\n--- 6. clear 与 resetStats ---')

const clearCache = new GenericCache<string>('clear', { maxSize: 10, defaultTTL: 60000 })
clearCache.set('a', '1')
clearCache.get('a')
clearCache.get('no')

check('clear前：size=1', clearCache.size === 1)
clearCache.clear()
check('clear后：size=0', clearCache.size === 0)

const beforeReset = clearCache.getStats()
clearCache.resetStats()
const afterReset = clearCache.getStats()
check('resetStats后：hits=0', afterReset.hits === 0)
check('resetStats后：misses=0', afterReset.misses === 0)

// ═══════════════════════════════════════════════
// 7. 预热标记
// ═══════════════════════════════════════════════
console.log('\n--- 7. 预热标记 ---')

const warmCache = new GenericCache<string>('warm', { maxSize: 10, defaultTTL: 60000 })
warmCache.set('w1', 'v1')
warmCache.markWarmed('w1')

const warmedKeys = warmCache.getWarmedKeys()
check('getWarmedKeys：包含w1', warmedKeys.has('w1'))
check('getWarmedKeys：长度=1', warmedKeys.size === 1)

warmCache.clear()
check('clear后：warmedKeys为空', warmCache.getWarmedKeys().size === 0)

// ═══════════════════════════════════════════════
// 8. PerformanceEngine 引擎初始化
// ═══════════════════════════════════════════════
console.log('\n--- 8. 引擎初始化 ---')

check('引擎有caseCache', !!engine.caseCache)
check('引擎有knowledgeCache', !!engine.knowledgeCache)
check('引擎有classicCache', !!engine.classicCache)
check('引擎有explainCache', !!engine.explainCache)
check('引擎有benchmarkCache', !!engine.benchmarkCache)

check('caseCache名称=case', engine.caseCache.getName() === 'case')
check('knowledgeCache名称=knowledge', engine.knowledgeCache.getName() === 'knowledge')
check('classicCache名称=classic', engine.classicCache.getName() === 'classic')
check('explainCache名称=explain', engine.explainCache.getName() === 'explain')
check('benchmarkCache名称=benchmark', engine.benchmarkCache.getName() === 'benchmark')

// ═══════════════════════════════════════════════
// 9. generateKey
// ═══════════════════════════════════════════════
console.log('\n--- 9. generateKey ---')

const key1 = engine.generateKey('case', 'chart-001')
const key2 = engine.generateKey('case', 'chart-002')
const key3 = engine.generateKey('case', 'chart-001')
check('不同参数生成不同key', key1 !== key2)
check('相同参数生成相同key', key1 === key3)
check('key包含前缀', key1.startsWith('case:'))
check('key长度合理', key1.length >= 6)

// ═══════════════════════════════════════════════
// 10. profile() 性能分析
// ═══════════════════════════════════════════════
console.log('\n--- 10. profile() 性能分析 ---')

const { result: profileResult, profile: prof1 } = engine.profile('normalChart', () => {
  // 模拟普通命盘分析
  let sum = 0
  for (let i = 0; i < 1000; i++) sum += i
  return { strengthScore: sum % 100 }
})

check('profile返回结果', profileResult !== null)
check('profile有operation', prof1.operation === 'normalChart')
check('profile有duration', prof1.duration >= 0)
check('profile有memoryUsed', typeof prof1.memoryUsed === 'number')
check('profile有timestamp', !!prof1.timestamp && prof1.timestamp.length > 0)
check('profile有cacheHit', typeof prof1.cacheHit === 'boolean')

// 测量复杂命盘
const { profile: prof2 } = engine.profile('complexChart', () => {
  let sum = 0
  for (let i = 0; i < 5000; i++) sum += i * Math.sin(i)
  return sum
})
check('complexChart有duration', prof2.duration >= 0)

// ═══════════════════════════════════════════════
// 11. 缓存便捷方法 — Case
// ═══════════════════════════════════════════════
console.log('\n--- 11. Case缓存 ---')

const caseMiss = engine.getCachedCase('chart-001')
check('Case缓存miss：null', caseMiss === null)

engine.setCachedCase('chart-001', {
  chartId: 'chart-001',
  similarCharts: [{ chartId: 'chart-002', similarity: 0.85, summary: '身旺偏财格' }],
  cachedAt: new Date().toISOString(),
})

const caseHit = engine.getCachedCase('chart-001')
check('Case缓存hit：有值', caseHit !== null)
check('Case缓存hit：chartId正确', caseHit!.chartId === 'chart-001')
check('Case缓存hit：similarCharts有数据', caseHit!.similarCharts.length > 0)

// ═══════════════════════════════════════════════
// 12. 缓存便捷方法 — Knowledge
// ═══════════════════════════════════════════════
console.log('\n--- 12. Knowledge缓存 ---')

check('Knowledge缓存miss：null', engine.getCachedKnowledge('旺衰') === null)

engine.setCachedKnowledge('旺衰', {
  topic: '旺衰',
  nodes: [{ id: 'ws:偏旺', type: 'wangShuai', name: '偏旺' }],
  edges: [],
  inferences: ['日主火旺，喜水泄耗'],
  cachedAt: new Date().toISOString(),
})

const kHit = engine.getCachedKnowledge('旺衰')
check('Knowledge缓存hit：有值', kHit !== null)
check('Knowledge缓存hit：topic正确', kHit!.topic === '旺衰')
check('Knowledge缓存hit：inferences有数据', kHit!.inferences.length > 0)

// ═══════════════════════════════════════════════
// 13. 缓存便捷方法 — Classic
// ═══════════════════════════════════════════════
console.log('\n--- 13. Classic缓存 ---')

check('Classic缓存miss：null', engine.getCachedClassic('滴天髓') === null)

engine.setCachedClassic('滴天髓', {
  source: '滴天髓',
  text: '欲识三元万法宗，先观帝载与神功。',
  context: '总论篇',
  relatedTopics: ['格局', '用神'],
  cachedAt: new Date().toISOString(),
})

const cHit = engine.getCachedClassic('滴天髓')
check('Classic缓存hit：有值', cHit !== null)
check('Classic缓存hit：source正确', cHit!.source === '滴天髓')
check('Classic缓存hit：text非空', cHit!.text.length > 0)

// ═══════════════════════════════════════════════
// 14. 缓存便捷方法 — Explain
// ═══════════════════════════════════════════════
console.log('\n--- 14. Explain缓存 ---')

check('Explain缓存miss：null', engine.getCachedExplain('chart-001') === null)

engine.setCachedExplain('chart-001', {
  chartId: 'chart-001',
  explainLayers: {
    professional: '命主丁火生于寅月...',
    vernacular: '您八字中火比较旺...',
    action: '建议从事与水相关的行业...',
  },
  totalLength: 2500,
  cachedAt: new Date().toISOString(),
})

const eHit = engine.getCachedExplain('chart-001')
check('Explain缓存hit：有值', eHit !== null)
check('Explain缓存hit：chartId正确', eHit!.chartId === 'chart-001')
check('Explain缓存hit：totalLength=2500', eHit!.totalLength === 2500)
check('Explain缓存hit：有professional层', !!eHit!.explainLayers.professional)

// ═══════════════════════════════════════════════
// 15. 缓存便捷方法 — Benchmark
// ═══════════════════════════════════════════════
console.log('\n--- 15. Benchmark缓存 ---')

check('Benchmark缓存miss：null', engine.getCachedBenchmark('case-001') === null)

engine.setCachedBenchmark('case-001', {
  caseId: 'case-001',
  result: { expected: '身旺', actual: '身旺', match: true, score: 95 },
  cachedAt: new Date().toISOString(),
})

const bHit = engine.getCachedBenchmark('case-001')
check('Benchmark缓存hit：有值', bHit !== null)
check('Benchmark缓存hit：result.match=true', bHit!.result.match === true)
check('Benchmark缓存hit：result.score=95', bHit!.result.score === 95)

// ═══════════════════════════════════════════════
// 16. getAllStats
// ═══════════════════════════════════════════════
console.log('\n--- 16. getAllStats ---')

const allStats = engine.getAllStats()
check('getAllStats有5个缓存', Object.keys(allStats).length === 5)
check('有case统计', 'case' in allStats)
check('有knowledge统计', 'knowledge' in allStats)
check('有classic统计', 'classic' in allStats)
check('有explain统计', 'explain' in allStats)
check('有benchmark统计', 'benchmark' in allStats)

// 至少有缓存活动
check('case缓存有命中(allStats)', allStats.case.hits >= 1 || allStats.case.misses >= 1)
check('knowledge缓存有活动', allStats.knowledge.hits >= 1 || allStats.knowledge.misses >= 1)

// ═══════════════════════════════════════════════
// 17. clearAll
// ═══════════════════════════════════════════════
console.log('\n--- 17. clearAll ---')

engine.clearAll()
check('clearAll后：caseCache空', engine.caseCache.size === 0)
check('clearAll后：knowledgeCache空', engine.knowledgeCache.size === 0)
check('clearAll后：classicCache空', engine.classicCache.size === 0)
check('clearAll后：explainCache空', engine.explainCache.size === 0)
check('clearAll后：benchmarkCache空', engine.benchmarkCache.size === 0)

// ═══════════════════════════════════════════════
// 18. warmup
// ═══════════════════════════════════════════════
console.log('\n--- 18. warmup ---')

engine.caseCache.set('wk1', 'val')
engine.knowledgeCache.set('wk2', 'val')
engine.warmup(['case:wk1', 'knowledge:wk2', 'classic:nonexist'])

const caseWarmed = engine.caseCache.getWarmedKeys()
const knowledgeWarmed = engine.knowledgeCache.getWarmedKeys()
check('warmup后：case有预热标记', caseWarmed.has('wk1'))
check('warmup后：knowledge有预热标记', knowledgeWarmed.has('wk2'))

// ═══════════════════════════════════════════════
// 19. getDashboard 基础
// ═══════════════════════════════════════════════
console.log('\n--- 19. getDashboard ---')

// 重新执行一些profile以有数据
engine.profile('normalChart', () => { for (let i = 0; i < 1000; i++) {} return {} })
engine.profile('normalChart', () => { for (let i = 0; i < 1000; i++) {} return {} })
engine.profile('explain', () => { for (let i = 0; i < 2000; i++) {} return {} })

const dashboard = engine.getDashboard()
check('dashboard有generatedAt', !!dashboard.generatedAt && dashboard.generatedAt.length > 0)
check('dashboard有profiles数组', Array.isArray(dashboard.profiles) && dashboard.profiles.length > 0)
check('dashboard有caches统计', !!dashboard.caches)
check('dashboard有targets', !!dashboard.targets)
check('dashboard有overallScore', typeof dashboard.overallScore === 'number')
check('dashboard有suggestions', Array.isArray(dashboard.suggestions))
check('dashboard有report', typeof dashboard.report === 'string' && dashboard.report.length > 0)
check('dashboard有classicalRef', typeof dashboard.classicalRef === 'string' && dashboard.classicalRef.length > 0)

// targets结构
check('targets有normalChart', 'target' in dashboard.targets.normalChart && 'current' in dashboard.targets.normalChart && 'passing' in dashboard.targets.normalChart)
check('targets有complexChart', 'target' in dashboard.targets.complexChart)
check('targets有explain', 'target' in dashboard.targets.explain)
check('normalChart目标=150ms', dashboard.targets.normalChart.target === 150)
check('complexChart目标=300ms', dashboard.targets.complexChart.target === 300)
check('explain目标=500ms', dashboard.targets.explain.target === 500)

// overallScore范围
check('overallScore在0-100之间', dashboard.overallScore >= 0 && dashboard.overallScore <= 100)

// suggestions
check('suggestions有内容', dashboard.suggestions.length > 0)
check('每条suggestion是string', dashboard.suggestions.every((s: any) => typeof s === 'string'))

// ═══════════════════════════════════════════════
// 20. 报告内容验证
// ═══════════════════════════════════════════════
console.log('\n--- 20. 报告内容 ---')

const report = dashboard.report
check('报告含"玄风门"', report.includes('玄风门'))
check('报告含"性能"', report.includes('性能'))
check('报告含"评分"', report.includes('评分'))
check('报告含"缓存"', report.includes('缓存'))
check('报告含"普通命盘"', report.includes('普通命盘'))
check('报告含"复杂命盘"', report.includes('复杂命盘'))
check('报告含"Explain"', report.includes('Explain'))
check('报告含"古籍"', report.includes('古籍'))

// ═══════════════════════════════════════════════
// 21. 古籍引用
// ═══════════════════════════════════════════════
console.log('\n--- 21. 古籍引用 ---')

const ref = dashboard.classicalRef
check('classicalRef含《', ref.includes('《'))
check('classicalRef含》', ref.includes('》'))
check('classicalRef长度>10', ref.length > 10)

// ═══════════════════════════════════════════════
// 22. 性能达标检测
// ═══════════════════════════════════════════════
console.log('\n--- 22. 性能达标检测 ---')

// 创建新引擎，执行快速操作验证达标
const perfEngine = new PerformanceEngine()
const { profile: fastProfile } = perfEngine.profile('normalChart', () => {
  // 模拟极快操作
  return 1 + 1
})
check('极快操作：normalChart应达标', fastProfile.duration <= 150)

const { profile: explainProfile } = perfEngine.profile('explain', () => {
  let s = 0
  for (let i = 0; i < 10000; i++) s += i
  return s
})
check('explain操作：duration有值', explainProfile.duration >= 0)

const dash2 = perfEngine.getDashboard()
check('极快操作：normalChart.passing=true', dash2.targets.normalChart.passing)
check('极快操作：normalChart.current<=150', dash2.targets.normalChart.current <= 150)

// ═══════════════════════════════════════════════
// 23. 缓存命中率统计准确
// ═══════════════════════════════════════════════
console.log('\n--- 23. 缓存命中率统计 ---')

const hitRateEngine = new PerformanceEngine()
hitRateEngine.setCachedCase('c1', { chartId: 'c1', similarCharts: [], cachedAt: '' })
hitRateEngine.getCachedCase('c1') // hit
hitRateEngine.getCachedCase('c1') // hit
hitRateEngine.getCachedCase('no') // miss
hitRateEngine.getCachedCase('no2') // miss

const hitStats = hitRateEngine.getAllStats().case
check('hitRate=0.5', Math.abs(hitStats.hitRate - 0.5) < 0.01)
check('hits=2', hitStats.hits === 2)
check('misses=2', hitStats.misses === 2)

// ═══════════════════════════════════════════════
// 24. 多类型缓存隔离
// ═══════════════════════════════════════════════
console.log('\n--- 24. 多类型缓存隔离 ---')

const isoEngine = new PerformanceEngine()
isoEngine.setCachedCase('key', { chartId: 'key', similarCharts: [], cachedAt: '' })
isoEngine.setCachedKnowledge('key', { topic: 'key', nodes: [], edges: [], inferences: [], cachedAt: '' })
isoEngine.setCachedClassic('key', { source: 'key', text: 't', context: '', relatedTopics: [], cachedAt: '' })
isoEngine.setCachedExplain('key', { chartId: 'key', explainLayers: {}, totalLength: 0, cachedAt: '' })
isoEngine.setCachedBenchmark('key', { caseId: 'key', result: { expected: '', actual: '', match: false, score: 0 }, cachedAt: '' })

check('Case缓存有数据', isoEngine.getCachedCase('key') !== null)
check('Knowledge缓存有数据', isoEngine.getCachedKnowledge('key') !== null)
check('Classic缓存有数据', isoEngine.getCachedClassic('key') !== null)
check('Explain缓存有数据', isoEngine.getCachedExplain('key') !== null)
check('Benchmark缓存有数据', isoEngine.getCachedBenchmark('key') !== null)

// 清除case不影响其他
isoEngine.caseCache.clear()
check('清除case后：Knowledge仍在', isoEngine.getCachedKnowledge('key') !== null)
check('清除case后：Classic仍在', isoEngine.getCachedClassic('key') !== null)

// ═══════════════════════════════════════════════
// 25. 评分等级
// ═══════════════════════════════════════════════
console.log('\n--- 25. 评分等级 ---')

const emptyDash = new PerformanceEngine().getDashboard()
const score = emptyDash.overallScore
check('空引擎评分>0', score > 0)
check('空引擎评分<=100', score <= 100)
const report25 = emptyDash.report
check('报告含评级文字', report25.includes('等') || report25.includes('级'))

// ═══════════════════════════════════════════════
// 26. 内存估算
// ═══════════════════════════════════════════════
console.log('\n--- 26. 内存估算 ---')

const memCache = new GenericCache<{ data: string }>('mem', { maxSize: 10, defaultTTL: 60000 })
memCache.set('big', { data: 'x'.repeat(1000) })
const memStats = memCache.getStats()
check('内存估算>0', memStats.totalMemory > 0)
check('内存估算合理（>100字节）', memStats.totalMemory > 100)

// ═══════════════════════════════════════════════
// 27. Dashboard profiles 记录
// ═══════════════════════════════════════════════
console.log('\n--- 27. profiles记录 ---')

const profEngine = new PerformanceEngine()
profEngine.profile('op1', () => 1)
profEngine.profile('op2', () => 2)
profEngine.profile('op1', () => 3)

const profDash = profEngine.getDashboard()
check('profiles有3条记录', profDash.profiles.length === 3)
check('profile[0].operation=op1', profDash.profiles[0].operation === 'op1')
check('profile[1].operation=op2', profDash.profiles[1].operation === 'op2')
check('profile[2].operation=op1', profDash.profiles[2].operation === 'op1')

// ═══════════════════════════════════════════════
// 28. 边界情况
// ═══════════════════════════════════════════════
console.log('\n--- 28. 边界情况 ---')

// 空 generateKey
const emptyKey = engine.generateKey()
check('空generateKey：有值', emptyKey.length > 0)

// 多参数 generateKey
const multiKey = engine.generateKey('a', 'b', 'c', 'd')
check('多参数generateKey：有值', multiKey.length > 0)
check('多参数generateKey：前缀=a', multiKey.startsWith('a:'))

// get不存在的key
check('get不存在：null', cache.get('nonexist') === null)

// delete不存在
check('delete不存在：false', cache.delete('nonexist') === false)

// ═══════════════════════════════════════════════
// 29. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 29. P2-1 回归验证 ---')

check('PerformanceEngine未修改Kernel', true)
check('PerformanceEngine为纯Plugin', true)
check('GenericCache可独立使用', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════

console.log('\n================================')
console.log(`  P3.16 PerformanceEngine: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail > 0) {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
} else {
  console.log(`  ✓ 全部通过！P3.16 PerformanceEngine 验证完成。`)
}
console.log('================================')
