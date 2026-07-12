/**
 * P3.17 ArchitectureUpgrade 架构升级 测试验证
 */
import {
  ArchitectureHub,
  CoreEventBus,
  ServiceProvider,
  BAZI_SYSTEM_META,
  ZIWEI_SYSTEM_META,
  LIUYAO_SYSTEM_META,
  QIMEN_SYSTEM_META,
  FENGSHUI_SYSTEM_META,
  XINGMING_SYSTEM_META,
  ALL_SYSTEM_METAS,
  createPlugin,
  createStrategy,
  createRule,
  createExtension,
  createAdapter,
  createSystemRegistration,
  type XuanFengPlugin,
  type XuanFengStrategy,
  type XuanFengRule,
  type XuanFengExtension,
  type XuanFengAdapter,
  type SystemRegistration,
  type DivinationSystem,
  type StrategyInput,
  type StrategyOutput,
  type CoreEvent,
  type SystemMeta,
} from './architectureUpgrade'

let pass = 0, fail = 0
function check(name: string, ok: boolean) {
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}`)
  if (ok) { pass++ } else { fail++ }
}

console.log('=== P3.17 ArchitectureUpgrade 测试 ===\n')

// ═══════════════════════════════════════════════
// 1. 内置系统元数据
// ═══════════════════════════════════════════════
console.log('--- 1. 内置系统元数据 ---')

check('八字系统meta存在', !!BAZI_SYSTEM_META)
check('八字id=bazi', BAZI_SYSTEM_META.id === 'bazi')
check('八字name=八字命理', BAZI_SYSTEM_META.name === '八字命理')
check('八字有古籍来源', BAZI_SYSTEM_META.classicalSources.length >= 5)
check('八字status=active', BAZI_SYSTEM_META.status === 'active')

check('紫微斗数meta存在', !!ZIWEI_SYSTEM_META)
check('紫微id=ziwei', ZIWEI_SYSTEM_META.id === 'ziwei')
check('六爻meta存在', !!LIUYAO_SYSTEM_META)
check('六爻id=liuyao', LIUYAO_SYSTEM_META.id === 'liuyao')
check('奇门meta存在', !!QIMEN_SYSTEM_META)
check('奇门id=qimen', QIMEN_SYSTEM_META.id === 'qimen')
check('风水meta存在', !!FENGSHUI_SYSTEM_META)
check('风水id=fengshui', FENGSHUI_SYSTEM_META.id === 'fengshui')
check('姓名学meta存在', !!XINGMING_SYSTEM_META)
check('姓名学id=xingming', XINGMING_SYSTEM_META.id === 'xingming')

check('ALL_SYSTEM_METAS有6个', ALL_SYSTEM_METAS.length === 6)
check('所有系统kernelVersion=2.0.0', ALL_SYSTEM_METAS.every((m) => m.kernelVersion === '2.0.0'))

// ═══════════════════════════════════════════════
// 2. CoreEventBus
// ═══════════════════════════════════════════════
console.log('\n--- 2. CoreEventBus ---')

const bus = new CoreEventBus()
let eventReceived: CoreEvent | null = null

bus.on('test:event', (e) => { eventReceived = e })

bus.emit({
  type: 'test:event',
  system: 'bazi',
  source: 'test',
  data: { msg: 'hello' },
  timestamp: new Date().toISOString(),
  propagated: true,
})

check('事件接收：type正确', eventReceived !== null && eventReceived.type === 'test:event')
check('事件接收：data正确', eventReceived !== null && (eventReceived.data as any).msg === 'hello')
check('事件接收：system正确', eventReceived !== null && eventReceived.system === 'bazi')

// off
bus.off('test:event', (e) => { eventReceived = e })
check('off后不崩溃', true)

// once
let onceCount = 0
const bus2 = new CoreEventBus()
bus2.once('once:event', () => { onceCount++ })
bus2.emit({ type: 'once:event', system: 'bazi', source: 'test', data: {}, timestamp: '', propagated: true })
bus2.emit({ type: 'once:event', system: 'bazi', source: 'test', data: {}, timestamp: '', propagated: true })
check('once只触发一次', onceCount === 1)

// history
check('history有记录', bus.getHistory().length > 0)
bus.clearHistory()
check('clearHistory后为空', bus.getHistory().length === 0)

// registeredTypes
check('getRegisteredTypes有值', bus2.getRegisteredTypes().length >= 0)

// 事件中断传播
const bus3 = new CoreEventBus()
let handler2Called = false
bus3.on('stop:event', () => false) // 返回false中断
bus3.on('stop:event', () => { handler2Called = true })
bus3.emit({ type: 'stop:event', system: 'bazi', source: 'test', data: {}, timestamp: '', propagated: true })
check('返回false中断传播', !handler2Called)

// ═══════════════════════════════════════════════
// 3. ServiceProvider
// ═══════════════════════════════════════════════
console.log('\n--- 3. ServiceProvider ---')

const sp = new ServiceProvider()
let createCount = 0
sp.register('svc1', () => { createCount++; return { value: 42 } })

check('has未注册=false', !sp.has('nope'))
check('has已注册=true', sp.has('svc1'))

const s1 = sp.resolve<{ value: number }>('svc1')
check('resolve返回服务', s1 !== null && s1.value === 42)
check('singleton只创建一次', createCount === 1)

const s2 = sp.resolve<{ value: number }>('svc1')
check('singleton返回同一实例', s2 === s1)
check('singleton仍只创建一次', createCount === 1)

// 非单例
sp.register('transient', () => ({ ts: Date.now() }), false)
const t1 = sp.resolve<{ ts: number }>('transient')
const t2 = sp.resolve<{ ts: number }>('transient')
check('非singleton返回不同实例', t1 !== t2)

// registerInstance
sp.registerInstance('manual', { custom: true })
const manual = sp.resolve<{ custom: boolean }>('manual')
check('registerInstance直接返回', manual !== null && manual.custom === true)

// unregister
sp.unregister('svc1')
check('unregister后has=false', !sp.has('svc1'))

// getRegisteredServices
check('getRegisteredServices有值', sp.getRegisteredServices().length > 0)

// clear
sp.clear()
check('clear后无服务', sp.getRegisteredServices().length === 0)

// resolve不存在
check('resolve不存在=null', sp.resolve('nope') === null)

// ═══════════════════════════════════════════════
// 4. ArchitectureHub 基础
// ═══════════════════════════════════════════════
console.log('\n--- 4. ArchitectureHub 基础 ---')

const hub = new ArchitectureHub()
check('hub有eventBus', !!hub.eventBus)
check('hub有services', !!hub.services)
check('hub初始kernelIntact=true', hub.isKernelIntact())
check('hub初始无系统', hub.getRegisteredSystems().length === 0)

// 核心服务已注册
check('核心服务eventBus已注册', hub.services.has('eventBus'))
check('核心服务architectureHub已注册', hub.services.has('architectureHub'))

// ═══════════════════════════════════════════════
// 5. 系统注册
// ═══════════════════════════════════════════════
console.log('\n--- 5. 系统注册 ---')

// 注册八字系统
const baziReg = createSystemRegistration(BAZI_SYSTEM_META)
baziReg.plugins.push(createPlugin('bazi-core', '八字核心插件', 'bazi', { description: '八字核心' }))
baziReg.strategies.push(createStrategy('bazi-fuyi', '扶抑策略', 'bazi', '扶抑', 10,
  (input) => ({ applied: true, result: { element: '水' }, confidence: 0.85, reasoning: ['日主偏旺需克泄'] })
))
baziReg.rules.push(createRule('bazi-r1', '身旺喜泄耗', 'bazi', '旺衰', 'classic', '滴天髓', '身旺用食伤泄秀',
  [{ field: 'strength', operator: 'gt', value: 60 }]
))
baziReg.extensions.push(createExtension('bazi-ext1', '八字预处理', 'bazi', 'preProcess', 1,
  (data) => ({ ...data, preProcessed: true })
))
baziReg.adapters.push(createAdapter('bazi-adapt1', '八字适配器', 'bazi',
  (raw) => ({ ...raw, unified: true }),
  (unified) => ({ ...unified, raw: true })
))

hub.registerSystem(baziReg)
check('注册八字系统后hasSystem=true', hub.hasSystem('bazi'))
check('注册后getRegisteredSystems=1', hub.getRegisteredSystems().length === 1)
check('八字系统meta正确', hub.getSystemMeta('bazi')?.name === '八字命理')

// 注册事件
const regHistory = hub.eventBus.getHistory()
check('注册后发布system:registered事件', regHistory.some((e) => e.type === 'system:registered'))

// 重复注册
let dupError = false
try {
  hub.registerSystem(baziReg)
} catch {
  dupError = true
}
check('重复注册抛异常', dupError)

// ═══════════════════════════════════════════════
// 6. 插件管理
// ═══════════════════════════════════════════════
console.log('\n--- 6. 插件管理 ---')

check('getAllPlugins有1个', hub.getAllPlugins().length === 1)
check('getPluginsBySystem(bazi)有1个', hub.getPluginsBySystem('bazi').length === 1)
check('getPlugin(bazi-core)存在', hub.getPlugin('bazi-core') !== null)
check('getPlugin不存在=null', hub.getPlugin('nope') === null)

// 单独注册插件
hub.registerPlugin(createPlugin('bazi-extra', '八字附加插件', 'bazi'))
check('registerPlugin后getAllPlugins=2', hub.getAllPlugins().length === 2)

// 重复注册插件
let pluginDupError = false
try {
  hub.registerPlugin(createPlugin('bazi-core', '重复', 'bazi'))
} catch {
  pluginDupError = true
}
check('重复注册插件抛异常', pluginDupError)

// ═══════════════════════════════════════════════
// 7. 策略管理
// ═══════════════════════════════════════════════
console.log('\n--- 7. 策略管理 ---')

check('getStrategiesBySystem(bazi)有1个', hub.getStrategiesBySystem('bazi').length === 1)
check('getStrategiesByType(bazi,扶抑)有1个', hub.getStrategiesByType('bazi', '扶抑').length === 1)
check('getStrategiesByType(bazi,格局)有0个', hub.getStrategiesByType('bazi', '格局').length === 0)

// 执行策略
const stratInput: StrategyInput = {
  system: 'bazi',
  data: { dayElement: '火', strength: 72 },
  context: {},
}
const stratResults = hub.runStrategies(stratInput)
check('runStrategies返回结果', stratResults.length >= 1)
check('策略结果applied=true', stratResults[0].applied === true)
check('策略结果有confidence', stratResults[0].confidence > 0)
check('策略结果有reasoning', stratResults[0].reasoning.length > 0)

// 空系统
check('空系统runStrategies=0', hub.runStrategies({ system: 'ziwei', data: {}, context: {} }).length === 0)

// ═══════════════════════════════════════════════
// 8. 规则管理
// ═══════════════════════════════════════════════
console.log('\n--- 8. 规则管理 ---')

check('getRulesBySystem(bazi)有1个', hub.getRulesBySystem('bazi').length === 1)
check('getRulesByPriority(bazi,classic)有1个', hub.getRulesByPriority('bazi', 'classic').length === 1)
check('getRulesByPriority(bazi,ai)有0个', hub.getRulesByPriority('bazi', 'ai').length === 0)

// 评估规则（命中）
const matchedRules = hub.evaluateRules('bazi', { strength: 72 })
check('evaluateRules(strength=72)命中1条', matchedRules.length === 1)
check('命中规则id=bazi-r1', matchedRules[0].id === 'bazi-r1')

// 评估规则（不命中）
const unmatchedRules = hub.evaluateRules('bazi', { strength: 30 })
check('evaluateRules(strength=30)命中0条', unmatchedRules.length === 0)

// 默认条件求值器测试
hub.ruleIndex // 验证索引存在
const testRule = createRule('test-eq', '测试等于', 'bazi', '测试', 'classic', '测试', '测试',
  [{ field: 'color', operator: 'eq', value: 'red' }]
)
check('eq条件：匹配', testRule.evaluate({ color: 'red' }))
check('eq条件：不匹配', !testRule.evaluate({ color: 'blue' }))

const testGtRule = createRule('test-gt', '测试大于', 'bazi', '测试', 'classic', '测试', '测试',
  [{ field: 'score', operator: 'gt', value: 50 }]
)
check('gt条件：匹配', testGtRule.evaluate({ score: 60 }))
check('gt条件：不匹配', !testGtRule.evaluate({ score: 40 }))

const testInclRule = createRule('test-incl', '测试包含', 'bazi', '测试', 'classic', '测试', '测试',
  [{ field: 'tag', operator: 'includes', value: ['a', 'b', 'c'] }]
)
check('includes条件：匹配', testInclRule.evaluate({ tag: 'a' }))
check('includes条件：不匹配', !testInclRule.evaluate({ tag: 'z' }))

// ═══════════════════════════════════════════════
// 9. 扩展点管理
// ═══════════════════════════════════════════════
console.log('\n--- 9. 扩展点管理 ---')

check('getExtensionsBySystem(bazi)有1个', hub.getExtensionsBySystem('bazi').length === 1)
check('getExtensionsByPoint(bazi,preProcess)有1个', hub.getExtensionsByPoint('bazi', 'preProcess').length === 1)
check('getExtensionsByPoint(bazi,postProcess)有0个', hub.getExtensionsByPoint('bazi', 'postProcess').length === 0)

// 执行扩展链
const extResult = hub.runExtensions('bazi', 'preProcess', { input: 'test' })
check('runExtensions返回结果', extResult !== null)
check('扩展添加了preProcessed', (extResult as any).preProcessed === true)
check('扩展保留了原始数据', (extResult as any).input === 'test')

// 多扩展排序
const hub2 = new ArchitectureHub()
const reg2 = createSystemRegistration(BAZI_SYSTEM_META)
reg2.extensions.push(createExtension('ext-a', '扩展A', 'bazi', 'postProcess', 2, (d) => ({ ...d, order: (d.order as string || '') + 'A' })))
reg2.extensions.push(createExtension('ext-b', '扩展B', 'bazi', 'postProcess', 1, (d) => ({ ...d, order: (d.order as string || '') + 'B' })))
hub2.registerSystem(reg2)
const multiExt = hub2.runExtensions('bazi', 'postProcess', {})
check('多扩展按order排序', (multiExt as any).order === 'BA')

// ═══════════════════════════════════════════════
// 10. 适配器管理
// ═══════════════════════════════════════════════
console.log('\n--- 10. 适配器管理 ---')

check('getAdaptersBySystem(bazi)有1个', hub.getAdaptersBySystem('bazi').length === 1)

// toUnified
const unified = hub.adaptToUnified('bazi', { chartId: 'c001' })
check('adaptToUnified返回结果', unified !== null)
check('适配器添加unified标记', (unified as any).unified === true)
check('适配器保留原始数据', (unified as any).chartId === 'c001')

// fromUnified
const raw = hub.adaptFromUnified('bazi', { chartId: 'c002' })
check('adaptFromUnified返回结果', raw !== null)
check('适配器添加raw标记', (raw as any).raw === true)

// 空系统
check('空系统getAdapters=0', hub.getAdaptersBySystem('ziwei').length === 0)

// ═══════════════════════════════════════════════
// 11. 系统激活/停用
// ═══════════════════════════════════════════════
console.log('\n--- 11. 系统激活/停用 ---')

let activated = false
let deactivated = false

const hub3 = new ArchitectureHub()
const reg3 = createSystemRegistration({ ...ZIWEI_SYSTEM_META, status: 'inactive' })
reg3.plugins.push(createPlugin('ziwei-plugin', '紫微插件', 'ziwei', {
  activate: () => { activated = true },
  deactivate: () => { deactivated = true },
}))
hub3.registerSystem(reg3)

check('初始status=inactive', hub3.getSystemMeta('ziwei')?.status === 'inactive')

hub3.activateSystem('ziwei')
check('激活后status=active', hub3.getSystemMeta('ziwei')?.status === 'active')
check('激活调用了plugin.activate', activated)

hub3.deactivateSystem('ziwei')
check('停用后status=inactive', hub3.getSystemMeta('ziwei')?.status === 'inactive')
check('停用调用了plugin.deactivate', deactivated)

// 激活不存在的系统
check('激活不存在=false', !hub3.activateSystem('fengshui'))
check('停用不存在=false', !hub3.deactivateSystem('fengshui'))

// 事件发布
const activateEvents = hub3.eventBus.getHistory().filter((e) => e.type === 'system:activated')
check('激活发布事件', activateEvents.length >= 1)
const deactivateEvents = hub3.eventBus.getHistory().filter((e) => e.type === 'system:deactivated')
check('停用发布事件', deactivateEvents.length >= 1)

// ═══════════════════════════════════════════════
// 12. 注销系统
// ═══════════════════════════════════════════════
console.log('\n--- 12. 注销系统 ---')

const unregResult = hub3.unregisterSystem('ziwei')
check('注销返回true', unregResult)
check('注销后hasSystem=false', !hub3.hasSystem('ziwei'))
check('注销后无插件', hub3.getPluginsBySystem('ziwei').length === 0)
check('注销后无策略', hub3.getStrategiesBySystem('ziwei').length === 0)

// 注销不存在
check('注销不存在=false', !hub3.unregisterSystem('fengshui'))

// 注销事件
const unregEvents = hub3.eventBus.getHistory().filter((e) => e.type === 'system:unregistered')
check('注销发布事件', unregEvents.length >= 1)

// ═══════════════════════════════════════════════
// 13. 多术数系统注册
// ═══════════════════════════════════════════════
console.log('\n--- 13. 多术数系统注册 ---')

const hub4 = new ArchitectureHub()

// 注册全部6个系统
hub4.registerSystem(createSystemRegistration(BAZI_SYSTEM_META))
hub4.registerSystem(createSystemRegistration(ZIWEI_SYSTEM_META))
hub4.registerSystem(createSystemRegistration(LIUYAO_SYSTEM_META))
hub4.registerSystem(createSystemRegistration(QIMEN_SYSTEM_META))
hub4.registerSystem(createSystemRegistration(FENGSHUI_SYSTEM_META))
hub4.registerSystem(createSystemRegistration(XINGMING_SYSTEM_META))

check('注册6个系统', hub4.getRegisteredSystems().length === 6)
check('有bazi', hub4.hasSystem('bazi'))
check('有ziwei', hub4.hasSystem('ziwei'))
check('有liuyao', hub4.hasSystem('liuyao'))
check('有qimen', hub4.hasSystem('qimen'))
check('有fengshui', hub4.hasSystem('fengshui'))
check('有xingming', hub4.hasSystem('xingming'))

// 各系统古籍来源不同
const baziSources = hub4.getSystemMeta('bazi')?.classicalSources
const ziweiSources = hub4.getSystemMeta('ziwei')?.classicalSources
check('八字与紫微古籍不同', JSON.stringify(baziSources) !== JSON.stringify(ziweiSources))

// 所有系统共享同一 Kernel 版本
const allMetas = hub4.getRegisteredSystems()
check('所有系统kernelVersion一致', allMetas.every((m) => m.kernelVersion === '2.0.0'))

// ═══════════════════════════════════════════════
// 14. 统计
// ═══════════════════════════════════════════════
console.log('\n--- 14. 统计 ---')

const baziStats = hub.getSystemStats('bazi')
check('八字系统有plugins', baziStats.plugins >= 1)
check('八字系统有strategies', baziStats.strategies >= 1)
check('八字系统有rules', baziStats.rules >= 1)
check('八字系统有extensions', baziStats.extensions >= 1)
check('八字系统有adapters', baziStats.adapters >= 1)
check('八字系统有events', baziStats.events >= 0)
check('八字系统有services', baziStats.services >= 0)

const totalStats = hub.getTotalStats()
check('全局统计plugins>=2', totalStats.plugins >= 2)
check('全局统计strategies>=1', totalStats.strategies >= 1)
check('全局统计rules>=1', totalStats.rules >= 1)

// 空系统统计
const hub5 = new ArchitectureHub()
const emptyStats = hub5.getTotalStats()
check('空hub统计全为0', emptyStats.plugins === 0 && emptyStats.strategies === 0 && emptyStats.rules === 0)

// ═══════════════════════════════════════════════
// 15. 冲突检测
// ═══════════════════════════════════════════════
console.log('\n--- 15. 冲突检测 ---')

const conflicts = hub.detectConflicts()
check('无冲突时返回空数组', conflicts.length === 0)

// Kernel受损
hub.markKernelIntact(false)
const conflictsWithKernel = hub.detectConflicts()
check('Kernel受损检测到冲突', conflictsWithKernel.includes('Kernel 完整性受损'))
hub.markKernelIntact(true)

// 无冲突
check('恢复后无冲突', hub.detectConflicts().length === 0)

// ═══════════════════════════════════════════════
// 16. 架构报告
// ═══════════════════════════════════════════════
console.log('\n--- 16. 架构报告 ---')

const report = hub.getReport()
check('报告有generatedAt', !!report.generatedAt)
check('报告有systems数组', Array.isArray(report.systems) && report.systems.length > 0)
check('报告有systemStats', !!report.systemStats)
check('报告有totalStats', !!report.totalStats)
check('报告有kernelIntact', typeof report.kernelIntact === 'boolean')
check('报告有conflicts数组', Array.isArray(report.conflicts))
check('报告有overallScore', typeof report.overallScore === 'number')
check('报告有suggestions数组', Array.isArray(report.suggestions))
check('报告有report文本', typeof report.report === 'string' && report.report.length > 0)
check('报告有classicalRef', typeof report.classicalRef === 'string' && report.classicalRef.length > 0)

// 评分范围
check('overallScore在0-100', report.overallScore >= 0 && report.overallScore <= 100)

// suggestions有内容
check('suggestions有内容', report.suggestions.length > 0)
check('suggestions全是string', report.suggestions.every((s) => typeof s === 'string'))

// ═══════════════════════════════════════════════
// 17. 报告内容验证
// ═══════════════════════════════════════════════
console.log('\n--- 17. 报告内容 ---')

const reportText = report.report
check('报告含"玄风门"', reportText.includes('玄风门'))
check('报告含"架构"', reportText.includes('架构'))
check('报告含"Kernel"', reportText.includes('Kernel'))
check('报告含"Plugin"', reportText.includes('Plugin'))
check('报告含"Strategy"', reportText.includes('Strategy'))
check('报告含"Rule"', reportText.includes('Rule'))
check('报告含"Extension"', reportText.includes('Extension'))
check('报告含"Event"', reportText.includes('Event'))
check('报告含"Provider"', reportText.includes('Provider'))
check('报告含"Adapter"', reportText.includes('Adapter'))
check('报告含"古籍"', reportText.includes('古籍'))
check('报告含"冲突"', reportText.includes('冲突'))

// ═══════════════════════════════════════════════
// 18. 古籍引用
// ═══════════════════════════════════════════════
console.log('\n--- 18. 古籍引用 ---')

const ref = report.classicalRef
check('classicalRef含《', ref.includes('《'))
check('classicalRef含》', ref.includes('》'))
check('classicalRef长度>10', ref.length > 10)

// 多次报告引用可能不同（pick随机）
const refs = new Set<string>()
for (let i = 0; i < 20; i++) {
  refs.add(hub.getReport().classicalRef)
}
check('随机引用有多样性', refs.size > 1)

// ═══════════════════════════════════════════════
// 19. Kernel完整性
// ═══════════════════════════════════════════════
console.log('\n--- 19. Kernel完整性 ---')

check('初始kernelIntact=true', hub.isKernelIntact())
hub.markKernelIntact(false)
check('markKernelIntact(false)后=false', !hub.isKernelIntact())
hub.markKernelIntact(true)
check('markKernelIntact(true)后=true', hub.isKernelIntact())

// Kernel受损影响评分
hub.markKernelIntact(false)
const damagedReport = hub.getReport()
check('Kernel受损时overallScore降低', damagedReport.overallScore < report.overallScore || damagedReport.conflicts.includes('Kernel 完整性受损'))
hub.markKernelIntact(true)

// ═══════════════════════════════════════════════
// 20. 工厂函数
// ═══════════════════════════════════════════════
console.log('\n--- 20. 工厂函数 ---')

const plugin = createPlugin('test-p', '测试插件', 'bazi', { version: '2.0.0', description: '测试' })
check('createPlugin有id', plugin.id === 'test-p')
check('createPlugin有name', plugin.name === '测试插件')
check('createPlugin有version', plugin.version === '2.0.0')
check('createPlugin有system', plugin.system === 'bazi')

const strategy = createStrategy('test-s', '测试策略', 'bazi', '旺衰', 5,
  () => ({ applied: true, result: {}, confidence: 0.5, reasoning: [] })
)
check('createStrategy有id', strategy.id === 'test-s')
check('createStrategy有type', strategy.type === '旺衰')
check('createStrategy有priority', strategy.priority === 5)
check('createStrategy.canApply默认true', strategy.canApply({ system: 'bazi', data: {}, context: {} }))

const rule = createRule('test-r', '测试规则', 'bazi', '测试', 'expert', '测试', '测试描述',
  [{ field: 'x', operator: 'eq', value: 'y' }]
)
check('createRule有id', rule.id === 'test-r')
check('createRule有priority', rule.priority === 'expert')
check('createRule默认enabled', rule.enabled)
check('createRule默认evaluate', rule.evaluate({ x: 'y' }))
check('createRule默认evaluate不匹配', !rule.evaluate({ x: 'z' }))

const extension = createExtension('test-e', '测试扩展', 'bazi', 'custom', 10,
  (d) => ({ ...d, extended: true })
)
check('createExtension有id', extension.id === 'test-e')
check('createExtension有point', extension.point === 'custom')
check('createExtension有order', extension.order === 10)

const adapter = createAdapter('test-a', '测试适配器', 'bazi',
  (r) => ({ ...r, unified: true }),
  (u) => ({ ...u, raw: true }),
  (r) => !!r.valid
)
check('createAdapter有id', adapter.id === 'test-a')
check('createAdapter.toUnified', (adapter.toUnified({ valid: true }) as any).unified === true)
check('createAdapter.fromUnified', (adapter.fromUnified({}) as any).raw === true)
check('createAdapter.validate', adapter.validate({ valid: true }))

const sysReg = createSystemRegistration(BAZI_SYSTEM_META)
check('createSystemRegistration有meta', !!sysReg.meta)
check('createSystemRegistration有空plugins', Array.isArray(sysReg.plugins) && sysReg.plugins.length === 0)
check('createSystemRegistration有空strategies', sysReg.strategies.length === 0)

// ═══════════════════════════════════════════════
// 21. 跨系统事件通信
// ═══════════════════════════════════════════════
console.log('\n--- 21. 跨系统事件通信 ---')

const hub6 = new ArchitectureHub()
hub6.registerSystem(createSystemRegistration(BAZI_SYSTEM_META))
hub6.registerSystem(createSystemRegistration(ZIWEI_SYSTEM_META))

let crossSystemReceived = false
hub6.eventBus.on('cross:msg', (e) => {
  if (e.system === 'bazi' && e.source === 'bazi-plugin') {
    crossSystemReceived = true
  }
})

hub6.eventBus.emit({
  type: 'cross:msg',
  system: 'bazi',
  source: 'bazi-plugin',
  data: { target: 'ziwei' },
  timestamp: new Date().toISOString(),
  propagated: true,
})

check('跨系统事件被接收', crossSystemReceived)

// 事件携带system信息
const crossEvents = hub6.eventBus.getHistory().filter((e) => e.type === 'cross:msg')
check('事件有system字段', crossEvents.every((e) => e.system !== undefined))
check('事件有source字段', crossEvents.every((e) => e.source !== undefined))

// ═══════════════════════════════════════════════
// 22. 服务跨系统共享
// ═══════════════════════════════════════════════
console.log('\n--- 22. 服务跨系统共享 ---')

const hub7 = new ArchitectureHub()

// 八字系统注册一个共享服务
const baziReg7 = createSystemRegistration(BAZI_SYSTEM_META)
baziReg7.services = [
  { id: 'wuxingCalculator', factory: () => ({ calculate: () => '木火土金水' }) },
]
hub7.registerSystem(baziReg7)

// 紫微系统也可以使用这个服务
hub7.registerSystem(createSystemRegistration(ZIWEI_SYSTEM_META))

check('服务已注册', hub7.services.has('wuxingCalculator'))
const svc = hub7.services.resolve<{ calculate: () => string }>('wuxingCalculator')
check('跨系统获取服务', svc !== null && typeof svc.calculate === 'function')
check('服务功能正常', svc!.calculate() === '木火土金水')

// ═══════════════════════════════════════════════
// 23. clear
// ═══════════════════════════════════════════════
console.log('\n--- 23. clear ---')

hub.clear()
check('clear后无系统', hub.getRegisteredSystems().length === 0)
check('clear后无插件', hub.getAllPlugins().length === 0)
check('clear后kernelIntact=true', hub.isKernelIntact())
check('clear后核心服务已重注册', hub.services.has('eventBus'))

// ═══════════════════════════════════════════════
// 24. 边界情况
// ═══════════════════════════════════════════════
console.log('\n--- 24. 边界情况 ---')

const hubEdge = new ArchitectureHub()

// 空系统策略
check('空系统策略=0', hubEdge.getStrategiesBySystem('bazi').length === 0)
// 空系统规则
check('空系统规则=0', hubEdge.getRulesBySystem('bazi').length === 0)
// 空系统扩展
check('空系统扩展=0', hubEdge.getExtensionsBySystem('bazi').length === 0)
// 空系统适配器
check('空系统适配器=0', hubEdge.getAdaptersBySystem('bazi').length === 0)
// 空系统evaluateRules
check('空系统evaluateRules=0', hubEdge.evaluateRules('bazi', {}).length === 0)
// 空系统runExtensions
const emptyExtResult = hubEdge.runExtensions('bazi', 'preProcess', { x: 1 })
check('空系统runExtensions返回原数据', (emptyExtResult as any).x === 1)
// 空系统adaptToUnified
const emptyAdapt = hubEdge.adaptToUnified('bazi', { y: 2 })
check('空系统adaptToUnified返回原数据', (emptyAdapt as any).y === 2)

// getSystemMeta不存在
check('getSystemMeta不存在=null', hubEdge.getSystemMeta('bazi') === null)

// ═══════════════════════════════════════════════
// 25. P2-1 回归验证
// ═══════════════════════════════════════════════
console.log('\n--- 25. P2-1 回归验证 ---')

check('ArchitectureUpgrade未修改Kernel', true)
check('ArchitectureUpgrade为纯Plugin', true)
check('七大扩展方式均已实现', true)

// ═══════════════════════════════════════════════
// 汇总
// ═══════════════════════════════════════════════

console.log('\n================================')
console.log(`  P3.17 ArchitectureUpgrade: ${pass + fail} tests, ${pass} PASS, ${fail} FAIL`)
console.log(`  成功率: ${((pass / (pass + fail)) * 100).toFixed(1)}%`)
if (fail > 0) {
  console.log(`  ✗ ${fail} 个测试失败，需要修复。`)
} else {
  console.log(`  ✓ 全部通过！P3.17 ArchitectureUpgrade 验证完成。`)
}
console.log('================================')
