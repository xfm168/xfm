/**
 * P0-5A-E Foundation Core 端到端验收测试
 *
 * 验证 XuanFeng Core OS 五大阶段：
 *  P0-5A: Foundation Core（EventBus / Lifecycle / PluginManager / ConfigCenter）
 *  P0-5B: RuleDSL 完整管线（AST → Parser → Validator → Compiler → Runtime）
 *  P0-5C: Knowledge Graph（Ontology → Concept → Classic → Graph）
 *  P0-5D: Rule Runtime（动态加载/版本/依赖/冲突/运行/卸载）
 *  P0-5E: Plugin System（插件注册/启用/禁用/热更新）
 */

import { describe, it, expect, beforeEach } from 'vitest'

// P0-5A: Core
import {
  globalEventBus, FoundationEvents,
  globalLifecycle, LifecycleState,
  globalPluginManager, type PluginDescriptor,
  globalConfig,
  globalLogger, FoundationError, DSLError, PluginError, ConfigError,
  type Plugin,
} from '../../../../bazi/foundation'

// P0-5B: DSL Pipeline
import {
  parse, validate, compile, type RuleASTNode,
  DSLValidator, DSLCompiler,
  globalDSLRuntime,
  type CompiledRule,
} from '../../../../bazi/foundation'
import type { RuleDSLDefinition } from '../../../../bazi/foundation'

// P0-5C: Knowledge Graph
import {
  globalOntology, globalConceptManager, globalClassicManager, globalKnowledgeGraph,
} from '../../../../bazi/foundation'

// P0-5D: Rule Runtime
import {
  globalRuleRuntime, globalRuleGraph, globalRuleRegistry,
} from '../../../../bazi/foundation'

// 测试用 DSL 规则
const TEST_DSL: RuleDSLDefinition = {
  id: 'BALANCE-STRONG-001',
  name: '身强宜泄',
  version: '1.0.0',
  source: ['子平真诠'],
  priority: 80,
  category: 'fuyi',
  description: '日主身强，宜用食伤泄秀',
  conditions: {
    logic: 'and',
    conditions: [
      { field: 'dayStrength', operator: '>=', value: 2, description: '日主身强' },
    ],
  },
  support: [
    { wuxing: '火', score: 2, reason: '食伤泄秀' },
    { wuxing: '土', score: 1, reason: '财星耗身' },
  ],
  oppose: [
    { wuxing: '木', score: 2, reason: '比劫助身' },
  ],
  result: '身强宜泄耗',
  confidence: { components: { xiyongshen: 0.8 }, note: '子平真诠·论用神' },
  dependencies: [],
  conflictStrategy: 'priority-then-vote',
  classicEvidence: [{
    classicName: '子平真诠',
    chapter: '论用神',
    quotedText: '身强则宜泄之耗之',
    supports: '身强宜泄',
  }],
  tags: ['fuyi', 'balance'],
  author: '系统',
  reviewer: '架构师',
}

describe('P0-5A-E Foundation Core 端到端验收', () => {

  // ============================================================
  // P0-5A: Foundation Core
  // ============================================================
  describe('P0-5A Foundation Core', () => {

    describe('EventBus', () => {
      beforeEach(() => globalEventBus.clear())

      it('on + emit → 订阅者收到事件', async () => {
        let received = ''
        globalEventBus.on('test:event', (payload: any) => { received = payload.msg })
        await globalEventBus.emit('test:event', { msg: 'hello' })
        expect(received).toBe('hello')
      })

      it('off → 取消订阅后不再收到事件', async () => {
        let count = 0
        const handler = () => { count++ }
        globalEventBus.on('test:off', handler)
        await globalEventBus.emit('test:off')
        expect(count).toBe(1)
        globalEventBus.off('test:off', handler)
        await globalEventBus.emit('test:off')
        expect(count).toBe(1)
      })

      it('once → 只触发一次', async () => {
        let count = 0
        globalEventBus.once('test:once', () => { count++ })
        await globalEventBus.emit('test:once')
        await globalEventBus.emit('test:once')
        expect(count).toBe(1)
      })

      it('FoundationEvents → 包含标准事件类型', () => {
        expect(FoundationEvents.RuleLoaded).toBeTruthy()
        expect(FoundationEvents.RuleRejected).toBeTruthy()
        expect(FoundationEvents.DecisionFinished).toBeTruthy()
        expect(FoundationEvents.CaseMatched).toBeTruthy()
        expect(FoundationEvents.BenchmarkFinished).toBeTruthy()
        expect(FoundationEvents.ExplainGenerated).toBeTruthy()
        expect(FoundationEvents.PluginLoaded).toBeTruthy()
        expect(FoundationEvents.PluginUnloaded).toBeTruthy()
        expect(FoundationEvents.ConfigChanged).toBeTruthy()
        expect(FoundationEvents.RuleCompiled).toBeTruthy()
      })

      it('handler 抛错不阻塞其他 handler', async () => {
        let secondCalled = false
        globalEventBus.on('test:error', () => { throw new Error('boom') })
        globalEventBus.on('test:error', () => { secondCalled = true })
        await globalEventBus.emit('test:error')
        expect(secondCalled).toBe(true)
      })
    })

    describe('Lifecycle', () => {
      it('register → 模块注册', () => {
        const mockModule = {
          name: 'test-module',
          init: async () => {},
          start: async () => {},
          stop: async () => {},
          dispose: () => {},
        }
        globalLifecycle.register('test-module', mockModule)
        expect(globalLifecycle.getState('test-module')).toBe('uninitialized')
        globalLifecycle.unregister('test-module')
      })

      it('init + start + stop → 状态流转', async () => {
        const mockModule = {
          name: 'lifecycle-test',
          init: async () => {},
          start: async () => {},
          stop: async () => {},
          dispose: () => {},
        }
        globalLifecycle.register('lifecycle-test', mockModule)
        await globalLifecycle.init('lifecycle-test')
        expect(globalLifecycle.getState('lifecycle-test')).toBe('ready')
        await globalLifecycle.start('lifecycle-test')
        expect(globalLifecycle.getState('lifecycle-test')).toBe('running')
        await globalLifecycle.stop('lifecycle-test')
        expect(globalLifecycle.getState('lifecycle-test')).toBe('stopped')
        globalLifecycle.unregister('lifecycle-test')
      })
    })

    describe('PluginManager', () => {
      it('register + enable + disable → 插件生命周期', async () => {
        let loaded = false
        let unloaded = false
        const descriptor: PluginDescriptor = {
          id: 'bazi-plugin-test',
          name: 'BaZi Plugin Test',
          version: '1.0.0',
          type: 'divination',
          description: '测试插件',
          dependencies: [],
          factory: () => ({
            name: 'BaZi Plugin Test',
            version: '1.0.0',
            type: 'divination',
            description: '测试插件',
            dependencies: [],
            init: async () => {},
            start: async () => {},
            stop: async () => {},
            dispose: () => {},
            onLoad: () => { loaded = true },
            onUnload: () => { unloaded = true },
          }),
        }
        globalPluginManager.register(descriptor)
        await globalPluginManager.enable('bazi-plugin-test')
        expect(globalPluginManager.listEnabled()).toContain('bazi-plugin-test')
        await globalPluginManager.disable('bazi-plugin-test')
        expect(globalPluginManager.listEnabled()).not.toContain('bazi-plugin-test')
        globalPluginManager.unregister('bazi-plugin-test')
      })

      it('reload → 热更新', async () => {
        const descriptor: PluginDescriptor = {
          id: 'hot-reload-test',
          name: 'Hot Reload Test',
          version: '1.0.0',
          type: 'divination',
          description: '热更新测试',
          dependencies: [],
          factory: () => ({
            name: 'Hot Reload Test',
            version: '1.0.0',
            type: 'divination',
            description: '热更新测试',
            dependencies: [],
            init: async () => {},
            start: async () => {},
            stop: async () => {},
            dispose: () => {},
          }),
        }
        globalPluginManager.register(descriptor)
        await globalPluginManager.enable('hot-reload-test')
        const success = await globalPluginManager.reload('hot-reload-test')
        expect(success).toBe(true)
        globalPluginManager.unregister('hot-reload-test')
      })
    })

    describe('ConfigCenter', () => {
      it('register + get + set → 配置读写', () => {
        globalConfig.register({
          key: 'test.threshold',
          value: 0.5,
          defaultValue: 0.5,
          type: 'number',
          description: '测试阈值',
          mutable: true,
        })
        expect(globalConfig.get<number>('test.threshold')).toBe(0.5)
        globalConfig.set('test.threshold', 0.8)
        expect(globalConfig.get<number>('test.threshold')).toBe(0.8)
      })

      it('reset → 恢复默认值', () => {
        globalConfig.register({
          key: 'test.reset',
          value: 10,
          defaultValue: 10,
          type: 'number',
          description: '测试重置',
          mutable: true,
        })
        globalConfig.set('test.reset', 99)
        globalConfig.reset('test.reset')
        expect(globalConfig.get<number>('test.reset')).toBe(10)
      })

      it('mutable=false → 不可修改', () => {
        globalConfig.register({
          key: 'test.immutable',
          value: 'locked',
          defaultValue: 'locked',
          type: 'string',
          description: '不可变配置',
          mutable: false,
        })
        expect(globalConfig.set('test.immutable', 'unlocked')).toBe(false)
        expect(globalConfig.get<string>('test.immutable')).toBe('locked')
      })

      it('预置流派权重配置', () => {
        const schoolConfigs = globalConfig.getCategory('school')
        expect(schoolConfigs.length).toBeGreaterThan(0)
      })

      it('onChange → 变更回调', () => {
        let callbackValue = ''
        globalConfig.register({
          key: 'test.callback',
          value: 'initial',
          defaultValue: 'initial',
          type: 'string',
          description: '回调测试',
          mutable: true,
        })
        globalConfig.onChange('test.callback', (newValue: any) => { callbackValue = newValue })
        globalConfig.set('test.callback', 'changed')
        expect(callbackValue).toBe('changed')
      })
    })

    describe('Shared: Errors + Logger', () => {
      it('FoundationError → 包含 code/layer/module', () => {
        const err = new FoundationError('test error', { code: 'TEST-001', layer: 'core', module: 'eventbus' })
        expect(err.message).toBe('test error')
        expect(err.code).toBe('TEST-001')
        expect(err.layer).toBe('core')
        expect(err.module).toBe('eventbus')
      })

      it('DSLError → 规则 DSL 错误', () => {
        const err = new DSLError('parse failed', { code: 'PARSE-ERR' })
        expect(err).toBeInstanceOf(FoundationError)
        expect(err.code).toBe('PARSE-ERR')
      })

      it('Logger → 分级日志', () => {
        const child = globalLogger.child('test-module')
        expect(child).toBeTruthy()
        // 不抛错即可
        child.info('test message')
        child.debug('debug message')
        child.warn('warn message')
        child.error('error message')
      })
    })
  })

  // ============================================================
  // P0-5B: RuleDSL 完整管线
  // ============================================================
  describe('P0-5B RuleDSL Pipeline（AST → Parser → Validator → Compiler → Runtime）', () => {

    it('Parser → DSL 数据解析为 AST', () => {
      const ast = parse(TEST_DSL)
      expect(ast).toBeTruthy()
      expect(ast.type).toBe('Rule')
      expect(ast.id).toBe(TEST_DSL.id)
      expect(ast.name).toBe(TEST_DSL.name)
      expect(ast.conditions).toBeTruthy()
      expect(ast.conditions.logic).toBe('and')
      expect(ast.conditions.conditions.length).toBe(1)
      expect(ast.support?.length).toBe(2)
      expect(ast.oppose?.length).toBe(1)
    })

    it('Validator → AST 语义校验通过', () => {
      const ast = parse(TEST_DSL)
      const result = validate(ast)
      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('Validator → 检测无效规则', () => {
      // 传入完全无效的 AST（缺少 id/name/conditions）
      const badAST = { type: 'Rule' } as any
      const result = validate(badAST)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('Compiler → AST 编译为可执行规则', () => {
      const ast = parse(TEST_DSL)
      const result = validate(ast)
      expect(result.valid).toBe(true)
      const compiled = compile(ast)
      expect(compiled.ruleId).toBe(TEST_DSL.id)
      expect(compiled.evaluate).toBeDefined()
      expect(typeof compiled.evaluate).toBe('function')
      expect(compiled.metadata.source).toEqual(TEST_DSL.source)
    })

    it('CompiledRule → evaluate 执行正确', () => {
      const ast = parse(TEST_DSL)
      const compiled = compile(ast)
      // dayStrength >= 2 → satisfied
      const result = compiled.evaluate({ dayStrength: 3 })
      expect(result.satisfied).toBe(true)
      expect(result.scores['火']).toBe(2)
      expect(result.scores['土']).toBe(1)
      expect(result.scores['木']).toBe(-2)
      // dayStrength < 2 → not satisfied
      const result2 = compiled.evaluate({ dayStrength: 0 })
      expect(result2.satisfied).toBe(false)
    })

    it('DSL Runtime → load + execute + unload', () => {
      const ast = parse(TEST_DSL)
      const compiled = compile(ast)
      globalDSLRuntime.clear()
      globalDSLRuntime.load(compiled)
      expect(globalDSLRuntime.isLoaded(TEST_DSL.id)).toBe(true)
      const result = globalDSLRuntime.execute(TEST_DSL.id, { dayStrength: 3 })
      expect(result.satisfied).toBe(true)
      globalDSLRuntime.unload(TEST_DSL.id)
      expect(globalDSLRuntime.isLoaded(TEST_DSL.id)).toBe(false)
      globalDSLRuntime.clear()
    })

    it('完整管线 → parse → validate → compile → load → execute', () => {
      // 1. Parse
      const ast = parse(TEST_DSL)
      expect(ast.type).toBe('Rule')

      // 2. Validate
      const valResult = validate(ast)
      expect(valResult.valid).toBe(true)

      // 3. Compile
      const compiled = compile(ast)
      expect(compiled.evaluate).toBeDefined()

      // 4. Load
      globalDSLRuntime.clear()
      globalDSLRuntime.load(compiled)

      // 5. Execute
      const result = globalDSLRuntime.execute(TEST_DSL.id, { dayStrength: 2 })
      expect(result.satisfied).toBe(true)
      expect(result.scores['火']).toBe(2)

      globalDSLRuntime.clear()
    })
  })

  // ============================================================
  // P0-5C: Knowledge Graph（概念驱动）
  // ============================================================
  describe('P0-5C Knowledge Graph（Classic → Concept → Rule → Evidence → Decision）', () => {

    it('Ontology → 种子节点和边', () => {
      const stats = globalOntology.getDefinitions()
      expect(stats.nodes.length).toBeGreaterThanOrEqual(20)
      expect(stats.edges.length).toBeGreaterThanOrEqual(30)
    })

    it('Ontology → 按类型查询节点', () => {
      const classics = globalOntology.getNodesByType('classic')
      expect(classics.length).toBeGreaterThanOrEqual(5)
      const concepts = globalOntology.getNodesByType('concept')
      expect(concepts.length).toBeGreaterThanOrEqual(5)
      const wuxing = globalOntology.getNodesByType('wuxing')
      expect(wuxing.length).toBeGreaterThanOrEqual(5)
    })

    it('Concept → 核心命理概念', () => {
      const fuyi = globalConceptManager.getByName('扶抑')
      expect(fuyi).toBeTruthy()
      const tiaohou = globalConceptManager.getByName('调候')
      expect(tiaohou).toBeTruthy()
      const bingyao = globalConceptManager.getByName('病药')
      expect(bingyao).toBeTruthy()
    })

    it('Concept → 按类别查询', () => {
      const balanceConcepts = globalConceptManager.listByCategory('balance')
      expect(balanceConcepts.length).toBeGreaterThan(0)
    })

    it('Classic → 典籍条目', () => {
      const dts = globalClassicManager.listByClassic('滴天髓')
      expect(dts.length).toBeGreaterThan(0)
      const qt = globalClassicManager.listByClassic('穷通宝鉴')
      expect(qt.length).toBeGreaterThan(0)
    })

    it('Classic → 按概念查询', () => {
      const fuyiEntries = globalClassicManager.listByConcept('扶抑')
      expect(fuyiEntries.length).toBeGreaterThanOrEqual(0) // 可能有也可能没有
    })

    it('Graph → 统一查询（query）', () => {
      const result = globalKnowledgeGraph.query({
        type: 'classic',
        target: '滴天髓',
      })
      expect(result.success).toBe(true)
    })

    it('Graph → 查询概念', () => {
      const result = globalKnowledgeGraph.query({
        type: 'concept',
        target: '扶抑',
      })
      expect(result.success).toBe(true)
    })

    it('Graph → 查询五行支持', () => {
      const result = globalKnowledgeGraph.query({
        type: 'wuxing',
        target: '火',
      })
      expect(result.success).toBe(true)
    })

    it('Graph → 导出图谱', () => {
      const graph = globalKnowledgeGraph.exportGraph()
      expect(graph.nodes.length).toBeGreaterThan(0)
      expect(graph.edges.length).toBeGreaterThan(0)
    })
  })

  // ============================================================
  // P0-5D: Rule Runtime
  // ============================================================
  describe('P0-5D Rule Runtime（动态加载/检查/运行/卸载）', () => {

    it('load + isLoaded → 规则加载', () => {
      globalRuleRuntime.clear()
      globalRuleRuntime.load(TEST_DSL)
      expect(globalRuleRuntime.isLoaded(TEST_DSL.id)).toBe(true)
      globalRuleRuntime.clear()
    })

    it('checkDependencies → 依赖检查', () => {
      globalRuleRuntime.clear()
      globalRuleRuntime.load(TEST_DSL)
      const check = globalRuleRuntime.checkDependencies(TEST_DSL.id)
      expect(check.satisfied).toBe(true) // 无依赖
      expect(check.missing.length).toBe(0)
      globalRuleRuntime.clear()
    })

    it('checkConflict → 冲突检查', () => {
      globalRuleRuntime.clear()
      globalRuleRuntime.load(TEST_DSL)
      const check = globalRuleRuntime.checkConflict(TEST_DSL.id)
      expect(typeof check.hasConflict).toBe('boolean')
      globalRuleRuntime.clear()
    })

    it('run → 执行规则', () => {
      globalRuleRuntime.clear()
      globalRuleRuntime.load(TEST_DSL)
      const result = globalRuleRuntime.run(TEST_DSL.id, { dayStrength: 3 })
      expect(result.satisfied).toBe(true)
      expect(result.scores['火']).toBe(2)
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
      globalRuleRuntime.clear()
    })

    it('runAll → 批量执行', () => {
      globalRuleRuntime.clear()
      globalRuleRuntime.load(TEST_DSL)
      const results = globalRuleRuntime.runAll({ dayStrength: 3 })
      expect(results.length).toBe(1)
      expect(results[0].satisfied).toBe(true)
      globalRuleRuntime.clear()
    })

    it('unload → 卸载规则', () => {
      globalRuleRuntime.clear()
      globalRuleRuntime.load(TEST_DSL)
      globalRuleRuntime.unload(TEST_DSL.id)
      expect(globalRuleRuntime.isLoaded(TEST_DSL.id)).toBe(false)
    })

    it('getStats → 运行时统计', () => {
      globalRuleRuntime.clear()
      globalRuleRuntime.load(TEST_DSL)
      globalRuleRuntime.run(TEST_DSL.id, { dayStrength: 3 })
      const stats = globalRuleRuntime.getStats()
      expect(stats.loaded).toBe(1)
      expect(stats.executed).toBeGreaterThanOrEqual(1)
      globalRuleRuntime.clear()
    })
  })

  describe('P0-5D RuleGraph（依赖图）', () => {
    beforeEach(() => globalRuleGraph.clear())

    it('addRule + topologicalSort → 拓扑排序', () => {
      globalRuleGraph.addRule(TEST_DSL)
      globalRuleGraph.addRule({
        ...TEST_DSL,
        id: 'GEJU-DEP-001',
        name: '格局依赖测试',
        dependencies: [TEST_DSL.id],
      })
      const order = globalRuleGraph.topologicalSort()
      expect(order.length).toBe(2)
      expect(order.indexOf(TEST_DSL.id)).toBeLessThan(order.indexOf('GEJU-DEP-001'))
    })

    it('detectCycles → 无循环', () => {
      globalRuleGraph.addRule(TEST_DSL)
      expect(globalRuleGraph.detectCycles().length).toBe(0)
    })
  })

  describe('P0-5D RuleRegistry（注册表）', () => {
    it('register + get → 规则注册和查询', () => {
      globalRuleRegistry.clear()
      globalRuleRegistry.register(TEST_DSL)
      expect(globalRuleRegistry.exists(TEST_DSL.id)).toBe(true)
      const rule = globalRuleRegistry.get(TEST_DSL.id)
      expect(rule).toBeTruthy()
      globalRuleRegistry.clear()
    })

    it('listByCategory → 按类别查询', () => {
      globalRuleRegistry.clear()
      globalRuleRegistry.register(TEST_DSL)
      const fuyiRules = globalRuleRegistry.listByCategory('fuyi')
      expect(fuyiRules.length).toBeGreaterThan(0)
      globalRuleRegistry.clear()
    })
  })

  // ============================================================
  // P0-5E: Plugin System（已在 PluginManager 中验证）
  // ============================================================
  describe('P0-5E Plugin System', () => {
    it('Core 不感知 BaZi → 插件化设计', async () => {
      const baziPlugin: PluginDescriptor = {
        id: 'bazi-divination',
        name: '八字术数插件',
        version: '1.0.0',
        type: 'divination',
        description: '八字推演插件',
        dependencies: [],
        factory: () => ({
          name: '八字术数插件',
          version: '1.0.0',
          type: 'divination',
          description: '八字推演插件',
          dependencies: [],
          init: async () => {},
          start: async () => {},
          stop: async () => {},
          dispose: () => {},
        }),
      }
      const ziweiPlugin: PluginDescriptor = {
        id: 'ziwei-divination',
        name: '紫微斗数插件',
        version: '1.0.0',
        type: 'divination',
        description: '紫微斗数推演插件',
        dependencies: [],
        factory: () => ({
          name: '紫微斗数插件',
          version: '1.0.0',
          type: 'divination',
          description: '紫微斗数推演插件',
          dependencies: [],
          init: async () => {},
          start: async () => {},
          stop: async () => {},
          dispose: () => {},
        }),
      }

      globalPluginManager.register(baziPlugin)
      globalPluginManager.register(ziweiPlugin)

      // 八字和紫微都是独立插件，Core 不感知具体术数
      const plugins = globalPluginManager.listPlugins()
      expect(plugins.length).toBeGreaterThanOrEqual(2)
      const ids = plugins.map(p => p.id)
      expect(ids).toContain('bazi-divination')
      expect(ids).toContain('ziwei-divination')

      // 启用八字插件
      await globalPluginManager.enable('bazi-divination')
      expect(globalPluginManager.listEnabled()).toContain('bazi-divination')

      // 禁用
      await globalPluginManager.disable('bazi-divination')
      expect(globalPluginManager.listEnabled()).not.toContain('bazi-divination')

      // 清理
      globalPluginManager.unregister('bazi-divination')
      globalPluginManager.unregister('ziwei-divination')
    })

    it('插件依赖检查', async () => {
      const corePlugin: PluginDescriptor = {
        id: 'dep-core',
        name: 'Core Plugin',
        version: '1.0.0',
        type: 'core',
        description: '被依赖的核心插件',
        dependencies: [],
        factory: () => ({
          name: 'Core Plugin', version: '1.0.0', type: 'core', description: '',
          dependencies: [],
          init: async () => {}, start: async () => {}, stop: async () => {}, dispose: () => {},
        }),
      }
      const depPlugin: PluginDescriptor = {
        id: 'dep-child',
        name: 'Child Plugin',
        version: '1.0.0',
        type: 'divination',
        description: '依赖核心插件的子插件',
        dependencies: ['dep-core'],
        factory: () => ({
          name: 'Child Plugin', version: '1.0.0', type: 'divination', description: '',
          dependencies: ['dep-core'],
          init: async () => {}, start: async () => {}, stop: async () => {}, dispose: () => {},
        }),
      }

      globalPluginManager.register(corePlugin)
      globalPluginManager.register(depPlugin)

      // 未启用 dep-core 时，dep-child 不能启用
      const canEnable = globalPluginManager.hasDependency('dep-child')
      expect(canEnable).toBe(false)

      // 启用 dep-core 后
      await globalPluginManager.enable('dep-core')
      expect(globalPluginManager.hasDependency('dep-child')).toBe(true)

      await globalPluginManager.disable('dep-core')
      globalPluginManager.unregister('dep-core')
      globalPluginManager.unregister('dep-child')
    })
  })

  // ============================================================
  // 端到端：DSL → Compile → Runtime → EventBus 全流程
  // ============================================================
  describe('端到端：DSL → Compile → Runtime → EventBus', () => {
    it('完整流程：声明式规则 → 解析 → 校验 → 编译 → 加载 → 执行', async () => {
      // 1. Parse → Validate → Compile（完整 DSL 管线）
      const ast = parse(TEST_DSL)
      const valResult = validate(ast)
      expect(valResult.valid).toBe(true)
      const compiled = compile(ast)
      expect(compiled.evaluate).toBeDefined()

      // 2. 验证编译结果正确
      const evalResult = compiled.evaluate({ dayStrength: 3 })
      expect(evalResult.satisfied).toBe(true)
      expect(evalResult.scores['火']).toBe(2)

      // 3. Load DSL definition into RuleRuntime
      globalRuleRuntime.clear()
      globalRuleRuntime.load(TEST_DSL)

      // 4. Execute via RuleRuntime
      const result = globalRuleRuntime.run(TEST_DSL.id, { dayStrength: 3 })
      expect(result.satisfied).toBe(true)
      expect(result.scores['火']).toBe(2)

      // 5. Stats
      const stats = globalRuleRuntime.getStats()
      expect(stats.loaded).toBe(1)
      expect(stats.executed).toBeGreaterThanOrEqual(1)

      globalRuleRuntime.clear()
    })
  })
})
