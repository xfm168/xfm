/**
 * P0-5 Part 11: DevTools — 开发者工具查看器
 *
 * 玄风门命理系统的开发者调试面板：
 *   1. debugDSL            — DSL 全链路调试（parse→validate→format→optimize→compile→runtime）
 *   2. viewRule            — 查看单条规则详情
 *   3. listRules           — 列出所有规则（带筛选）
 *   4. viewDecisionEvidence — 查看决策 Evidence 质量
 *   5. viewKnowledgeGraph  — 导出知识图谱
 *   6. viewPlugins         — 插件健康度
 *   7. viewBenchmark       — 基准状态摘要
 *   8. dumpAll             — 聚合所有面板
 *
 * 所有方法都返回 JSON 可序列化对象，便于前端直接展示。
 * 若全局单例尚未注册，均使用优雅降级（返回空结构 + 告警），绝不抛异常。
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import type { RuleDSLDefinition } from '../types'

// ============================================================
// 类型：DSL Debug
// ============================================================

export interface DSLDebugReport {
  parseCheck: any
  validateCheck: any
  formatCheck: any
  optimizeCheck: any
  compileCheck: any
  runtimeTest: any
  totalIssues: number
  warnings: string[]
  errors: string[]
}

// ============================================================
// 类型：Decision Evidence View
// ============================================================

export interface DecisionEvidenceView {
  totalEvidenceCount: number
  classicCount: number
  conflictCount: number
  evidenceQuality: number
  summaryText: string
}

// ============================================================
// 类型：Knowledge Graph View
// ============================================================

export interface KnowledgeGraphView {
  nodes: any[]
  edges: any[]
  stats: any
  legend: string[]
}

// ============================================================
// 类型：Plugins View
// ============================================================

export interface PluginsView {
  total: number
  enabledCount: number
  disabledCount: number
  healthByPlugin: Record<string, any>
  table: any[]
}

// ============================================================
// 辅助：安全地拿全局单例（避免 import cycle）
// ============================================================

function safeGlobal<T = any>(name: string): T | undefined {
  try {
    const gt = globalThis as any
    return gt[name] as T | undefined
  } catch (_e) {
    return undefined
  }
}

function getRuleRegistry(): any {
  // 直接从模块拿，拿不到再回退 globalThis
  // 这里用惰性 require 避免 import cycle
  try {
    const mod = require('../rule/registry/ruleRegistry')
    if (mod && mod.globalRuleRegistry) return mod.globalRuleRegistry
  } catch (_e) { /* ignore */ }
  return safeGlobal('globalRuleRegistry')
}

function getRuleRuntime(): any {
  try {
    const mod = require('../rule/runtime/ruleRuntime')
    if (mod && mod.globalRuleRuntime) return mod.globalRuleRuntime
  } catch (_e) { /* ignore */ }
  return safeGlobal('globalRuleRuntime')
}

function getOntology(): any {
  try {
    const mod = require('../knowledge/ontology/ontology')
    if (mod && mod.globalOntology) return mod.globalOntology
  } catch (_e) { /* ignore */ }
  return safeGlobal('globalOntology')
}

function getKnowledgeGraph(): any {
  try {
    const mod = require('../knowledge/graph/graphEngine')
    if (mod && mod.globalKnowledgeGraph) return mod.globalKnowledgeGraph
  } catch (_e) { /* ignore */ }
  return safeGlobal('globalKnowledgeGraph')
}

function getPluginManager(): any {
  try {
    const mod = require('../core/plugin/pluginManager')
    if (mod && mod.globalPluginManager) return mod.globalPluginManager
  } catch (_e) { /* ignore */ }
  return safeGlobal('globalPluginManager')
}

// ============================================================
// DevTools 类
// ============================================================

/**
 * 开发者工具查看器
 *
 * 所有 viewer 返回纯 JSON-ser 对象，便于：
 *   - 前端 Dashboard 直接渲染
 *   - 测试用 snapshot
 *   - 运维导出报告
 */
export class DevTools {
  // ============================================================
  // 1. DSL Debug
  // ============================================================

  /**
   * 调试 DSL 全链路
   *
   * Pipeline：DSL 数据 → parse → validate → format → optimize → compile → runtime
   * 每一步都采集结果，最后汇总错误/警告。
   */
  debugDSL(dsl: RuleDSLDefinition): DSLDebugReport {
    const warnings: string[] = []
    const errors: string[] = []

    // ----- Step 1: Parse -----
    let parseCheck: any = { status: 'skipped', note: 'parse 未执行' }
    let ast: any = undefined
    try {
      const parserMod = require('../dsl/parser/parser')
      if (typeof parserMod.parse === 'function') {
        ast = parserMod.parse(dsl)
        parseCheck = {
          status: 'ok',
          hasAst: !!ast,
          nodeType: ast?.type || 'unknown',
          note: 'parse 成功',
        }
      } else {
        warnings.push('parse 函数未找到，跳过 parse 阶段')
      }
    } catch (e: any) {
      parseCheck = { status: 'error', message: String(e?.message ?? e) }
      errors.push(`[parse] ${String(e?.message ?? e)}`)
    }

    // 旧版 parseDSLRule 作为备用（返回 RuleDefinition，不是 AST）
    if (!ast) {
      try {
        const legacyParser = require('../dsl')
        if (typeof legacyParser.parseDSLRule === 'function') {
          const ruleDef = legacyParser.parseDSLRule(dsl)
          parseCheck.legacyParse = {
            status: 'ok',
            got: !!ruleDef,
          }
        }
      } catch (_e) { /* ignore */ }
    }

    // ----- Step 2: Validate -----
    let validateCheck: any = { status: 'skipped', note: 'validate 未执行' }
    try {
      const validatorMod = require('../dsl/validator/validator')
      if (typeof validatorMod.validate === 'function' && ast) {
        const result = validatorMod.validate(ast)
        validateCheck = {
          status: result?.valid ? 'ok' : 'warning',
          valid: !!result?.valid,
          issueCount: result?.issues?.length ?? 0,
          issues: result?.issues ?? [],
          errors: result?.errors ?? [],
        }
        if (result?.issues?.length) {
          warnings.push(`[validate] 发现 ${result.issues.length} 条警告`)
        }
        if (result?.errors?.length) {
          for (const e of result.errors) errors.push(`[validate] ${String(e)}`)
        }
      } else {
        // 回退到旧版 validateDSLRule
        const legacyDSL = require('../dsl')
        if (typeof legacyDSL.validateDSLRule === 'function') {
          const r = legacyDSL.validateDSLRule(dsl)
          validateCheck = {
            status: r?.valid ? 'ok' : 'error',
            valid: !!r?.valid,
            errors: r?.errors ?? [],
          }
          if (r?.errors?.length) {
            for (const e of r.errors) errors.push(`[validate:legacy] ${String(e)}`)
          }
        }
      }
    } catch (e: any) {
      validateCheck = { status: 'error', message: String(e?.message ?? e) }
      errors.push(`[validate] ${String(e?.message ?? e)}`)
    }

    // ----- Step 3: Format（结构完整性检查，模拟 format） -----
    let formatCheck: any = { status: 'skipped', note: 'format 未执行' }
    try {
      const idOk = typeof dsl?.id === 'string' && dsl.id.length > 0
      const nameOk = typeof dsl?.name === 'string' && dsl.name.length > 0
      const versionOk = typeof dsl?.version === 'string'
      const conditionsOk = !!dsl?.conditions && typeof dsl.conditions.logic === 'string' && Array.isArray(dsl.conditions.conditions)
      const sourceOk = Array.isArray(dsl?.source)
      formatCheck = {
        status: (idOk && nameOk && conditionsOk) ? 'ok' : 'warning',
        id: idOk,
        name: nameOk,
        version: versionOk,
        conditions: conditionsOk,
        source: sourceOk,
        hasSupport: Array.isArray(dsl?.support),
        hasOppose: Array.isArray(dsl?.oppose),
        hasResult: typeof dsl?.result === 'string',
      }
      if (!idOk) warnings.push('[format] 缺少必填字段 id')
      if (!nameOk) warnings.push('[format] 缺少必填字段 name')
      if (!conditionsOk) errors.push('[format] conditions 结构不合法')
    } catch (e: any) {
      formatCheck = { status: 'error', message: String(e?.message ?? e) }
      errors.push(`[format] ${String(e?.message ?? e)}`)
    }

    // ----- Step 4: Optimize（启发式检查项） -----
    let optimizeCheck: any = { status: 'skipped', note: 'optimize 未执行' }
    try {
      const hasClassic = Array.isArray(dsl?.classicEvidence) && dsl.classicEvidence.length > 0
      const hasConfidence = !!dsl?.confidence
      const hasDependencies = Array.isArray(dsl?.dependencies)
      const hasTags = Array.isArray(dsl?.tags) && dsl.tags.length > 0
      optimizeCheck = {
        status: 'ok',
        hasClassicEvidence: hasClassic,
        classicCount: dsl?.classicEvidence?.length ?? 0,
        hasConfidence,
        hasDependencies,
        hasTags,
        tagCount: dsl?.tags?.length ?? 0,
        optimizations: [
          hasClassic ? '✓ 含古籍引用，Evidence 质量可提升' : '! 建议补充 classicEvidence（提升古籍支持度）',
          hasTags ? '✓ 已标注 tags，便于检索' : '! 建议补充 tags（分类检索）',
        ],
      }
      if (!hasClassic) warnings.push('[optimize] 缺少 classicEvidence，Evidence 质量可能不足')
    } catch (e: any) {
      optimizeCheck = { status: 'error', message: String(e?.message ?? e) }
    }

    // ----- Step 5: Compile -----
    let compileCheck: any = { status: 'skipped', note: 'compile 未执行' }
    let compiled: any = undefined
    try {
      const compilerMod = require('../dsl/compiler/compiler')
      if (typeof compilerMod.compile === 'function' && ast) {
        compiled = compilerMod.compile(ast)
        compileCheck = {
          status: 'ok',
          hasEvaluate: typeof compiled?.evaluate === 'function',
          hasMetadata: !!compiled?.metadata,
          compiledAt: Date.now(),
        }
      } else {
        warnings.push('compile 函数未找到或 AST 未生成，跳过 compile')
      }
    } catch (e: any) {
      compileCheck = { status: 'error', message: String(e?.message ?? e) }
      errors.push(`[compile] ${String(e?.message ?? e)}`)
    }

    // ----- Step 6: Runtime Test -----
    let runtimeTest: any = { status: 'skipped', note: 'runtime 未执行' }
    try {
      if (compiled && typeof compiled.evaluate === 'function') {
        // 用空输入做冒烟测试，只检查是否抛异常
        try {
          const smokeInput = {
            dayStrength: 0,
            monthZhi: '子',
            isWinterBorn: true,
            isSummerBorn: false,
          }
          const result = compiled.evaluate(smokeInput)
          runtimeTest = {
            status: 'ok',
            smokeTestPassed: true,
            returned: typeof result,
            sampleResult: typeof result === 'object' ? {
              support: result?.support?.length ?? 0,
              oppose: result?.oppose?.length ?? 0,
              matched: !!result?.matched,
            } : undefined,
          }
        } catch (e2: any) {
          runtimeTest = {
            status: 'warning',
            smokeTestPassed: false,
            message: String(e2?.message ?? e2),
            note: '空输入下 evaluate 抛异常（可能是正常的：规则不适用空输入）',
          }
          warnings.push('[runtime] 空输入冒烟测试失败（可能属正常）')
        }
      } else {
        // 回退：用 runtime module 的 execute
        const runtimeMod = require('../dsl/runtime/runtime')
        if (typeof runtimeMod.execute === 'function' && compiled) {
          const r = runtimeMod.execute(compiled, {})
          runtimeTest = { status: 'ok', executeOk: true, result: r }
        }
      }
    } catch (e: any) {
      runtimeTest = { status: 'error', message: String(e?.message ?? e) }
      errors.push(`[runtime] ${String(e?.message ?? e)}`)
    }

    const totalIssues = errors.length + warnings.length

    return {
      parseCheck,
      validateCheck,
      formatCheck,
      optimizeCheck,
      compileCheck,
      runtimeTest,
      totalIssues,
      warnings,
      errors,
    }
  }

  // ============================================================
  // 2. 查看单条规则
  // ============================================================

  /**
   * 查看单条规则详情
   * 从 globalRuleRegistry 取，并检查 globalRuleRuntime 是否已加载
   */
  viewRule(ruleId: string): any {
    const registry = getRuleRegistry()
    const runtime = getRuleRuntime()

    let rule: any = undefined
    let fromRegistry = false
    let fromRuntimeLoaded = false

    if (registry && typeof registry.get === 'function') {
      rule = registry.get(ruleId)
      fromRegistry = rule !== undefined
    }

    if (runtime && typeof runtime.isLoaded === 'function') {
      try {
        fromRuntimeLoaded = !!runtime.isLoaded(ruleId)
      } catch (_e) { /* ignore */ }
    }

    // 如果 registry 里没有，尝试从 runtime 取
    if (!rule && runtime && typeof runtime.getCompiled === 'function') {
      try {
        rule = runtime.getCompiled(ruleId)
      } catch (_e) { /* ignore */ }
    }

    const isDSL = rule && typeof rule === 'object' && 'conditions' in rule && 'support' in rule
    const category = rule?.category ?? '未分类'
    const priority = rule?.priority ?? 0
    const source = rule?.source ?? []
    const tags = rule?.tags ?? []
    const version = rule?.version ?? '0.0.0'

    return {
      ruleId,
      found: !!rule,
      fromRegistry,
      fromRuntimeLoaded,
      isDSL,
      name: rule?.name ?? '(未命名规则)',
      category,
      priority,
      source,
      tags,
      version,
      description: rule?.description ?? '',
      result: rule?.result ?? '',
      supportsCount: Array.isArray(rule?.support) ? rule.support.length : 0,
      opposesCount: Array.isArray(rule?.oppose) ? rule.oppose.length : 0,
      classicCount: Array.isArray(rule?.classicEvidence) ? rule.classicEvidence.length : 0,
      raw: rule ?? null,
    }
  }

  // ============================================================
  // 3. 列出所有规则
  // ============================================================

  /**
   * 列出规则（支持按分类/来源/标签/关键词筛选）
   */
  listRules(options?: {
    category?: string
    source?: string
    tag?: string
    keyword?: string
    onlyDSL?: boolean
    onlyCode?: boolean
  }): any[] {
    const registry = getRuleRegistry()
    let all: any[] = []

    if (registry && typeof registry.list === 'function') {
      all = registry.list() ?? []
    } else if (registry && typeof registry.rules === 'object') {
      // 兜底：直接访问 Map
      try {
        all = Array.from(registry.rules?.values?.() ?? []).map((e: any) => e?.rule ?? e)
      } catch (_e) { /* ignore */ }
    }

    // 筛选
    if (options?.category) {
      all = all.filter(r => r?.category === options.category)
    }
    if (options?.source) {
      const s = options.source
      all = all.filter(r => Array.isArray(r?.source) && r.source.includes(s))
    }
    if (options?.tag) {
      const t = options.tag
      all = all.filter(r => Array.isArray(r?.tags) && r.tags.includes(t))
    }
    if (options?.keyword) {
      const kw = options.keyword.toLowerCase()
      all = all.filter(r =>
        (String(r?.name ?? '').toLowerCase().includes(kw)) ||
        (String(r?.id ?? '').toLowerCase().includes(kw)) ||
        (String(r?.description ?? '').toLowerCase().includes(kw))
      )
    }
    if (options?.onlyDSL) {
      all = all.filter(r => r && typeof r === 'object' && 'conditions' in r)
    }
    if (options?.onlyCode) {
      all = all.filter(r => !(r && typeof r === 'object' && 'conditions' in r))
    }

    // 返回摘要（不要把整个 rules 对象全塞进去，体积太大）
    return all.map(r => ({
      id: r?.id ?? '(无ID)',
      name: r?.name ?? '(未命名)',
      category: r?.category ?? '未分类',
      priority: r?.priority ?? 0,
      version: r?.version ?? '0.0.0',
      source: r?.source ?? [],
      tags: r?.tags ?? [],
      supportCount: Array.isArray(r?.support) ? r.support.length : 0,
      classicCount: Array.isArray(r?.classicEvidence) ? r.classicEvidence.length : 0,
      description: typeof r?.description === 'string' ? r.description.slice(0, 80) : '',
      isDSL: r && typeof r === 'object' && 'conditions' in r,
    }))
  }

  // ============================================================
  // 4. 查看决策 Evidence 质量
  // ============================================================

  /**
   * 查看决策 Evidence 的质量统计
   *
   * 输入：EvidenceTree-ish 结果（DecisionResult.evidenceTree 或其子结构）
   * 输出：总条数 / 古籍数 / 冲突数 / 质量分 / 摘要文字
   */
  viewDecisionEvidence(decisionResult: any): DecisionEvidenceView {
    let totalEvidenceCount = 0
    let classicCount = 0
    let conflictCount = 0

    try {
      // 优先 V2 tree.root
      const root = decisionResult?.evidenceTree?.root ?? decisionResult?.root
      if (root && typeof root === 'object') {
        const walk = (node: any): void => {
          if (!node) return
          const type: string | undefined = node.nodeType
          if (type === 'evidence') {
            totalEvidenceCount++
            if (node.satisfied === false) conflictCount++
          } else if (type === 'classic') {
            classicCount++
          }
          const children: any[] = Array.isArray(node.children) ? node.children : []
          for (const c of children) walk(c)
        }
        walk(root)
      } else if (decisionResult?.evidenceTree?.nodes && Array.isArray(decisionResult.evidenceTree.nodes)) {
        // 回退 V1 flat
        for (const n of decisionResult.evidenceTree.nodes) {
          const arr: any[] = Array.isArray(n?.evidence) ? n.evidence : []
          totalEvidenceCount += arr.length
          conflictCount += arr.filter((e: any) => e?.satisfied === false).length
          const cArr: any[] = Array.isArray(n?.classicEvidence) ? n.classicEvidence : []
          classicCount += cArr.length
        }
      } else {
        // 再兜底：直接看 evidences / classics 字段
        if (Array.isArray(decisionResult?.evidences)) totalEvidenceCount = decisionResult.evidences.length
        if (Array.isArray(decisionResult?.classics)) classicCount = decisionResult.classics.length
        if (typeof decisionResult?.conflictCount === 'number') conflictCount = decisionResult.conflictCount
      }
    } catch (_e) {
      // ignore
    }

    // 质量分算法：min(100, 70 + 5×经典数 − 3×冲突数)
    const evidenceQuality = Math.min(100, 70 + 5 * classicCount - 3 * conflictCount)

    // 摘要
    let summaryText = `共 ${totalEvidenceCount} 条 Evidence，`
    summaryText += `${classicCount} 条古籍引用，${conflictCount} 处冲突；`
    summaryText += `质量分 ${evidenceQuality}/100。`
    if (evidenceQuality >= 90) summaryText += ' 证据链非常完整，结论可信。'
    else if (evidenceQuality >= 75) summaryText += ' 证据链完整，结论可靠。'
    else if (evidenceQuality >= 60) summaryText += ' 证据基本充分，建议结合古籍再核对。'
    else summaryText += ' Evidence 不足或冲突较多，请人工复核。'

    return {
      totalEvidenceCount,
      classicCount,
      conflictCount,
      evidenceQuality,
      summaryText,
    }
  }

  // ============================================================
  // 5. 查看知识图谱
  // ============================================================

  viewKnowledgeGraph(options?: {
    maxNodes?: number
    conceptFilter?: string[]
    includeClassics?: boolean
  }): KnowledgeGraphView {
    const ontology = getOntology()
    const kg = getKnowledgeGraph()

    let nodes: any[] = []
    let edges: any[] = []
    let stats: any = {}
    const legend: string[] = []

    // 优先：knowledge graph engine.exportGraph
    try {
      if (kg && typeof kg.exportGraph === 'function') {
        const exported = kg.exportGraph?.(options ?? {}) ?? { nodes: [], edges: [], stats: {} }
        nodes = exported.nodes ?? []
        edges = exported.edges ?? []
        stats = exported.stats ?? {}
      } else if (kg && typeof kg.toJSON === 'function') {
        const j = kg.toJSON()
        nodes = j.nodes ?? []
        edges = j.edges ?? []
      }
    } catch (_e) { /* ignore */ }

    // 回退：ontology.getDefinitions
    if (nodes.length === 0 && ontology && typeof ontology.getDefinitions === 'function') {
      try {
        const defs = ontology.getDefinitions() ?? []
        nodes = defs.map((d: any, i: number) => ({
          id: d?.id ?? `concept-${i}`,
          label: d?.name ?? d?.term ?? `概念${i}`,
          type: d?.type ?? 'concept',
          definition: d?.definition ?? '',
        }))
        stats = {
          source: 'ontology:getDefinitions',
          definitionCount: nodes.length,
        }
      } catch (_e) { /* ignore */ }
    }

    // maxNodes 截断
    const maxN = options?.maxNodes ?? 500
    if (nodes.length > maxN) nodes.length = maxN
    if (edges.length > maxN * 3) edges.length = maxN * 3

    // legend
    legend.push('节点类型：concept（概念）、classic（典籍）、rule（规则）、wuxing（五行）')
    legend.push('边类型：is_a（继承）、relates（关联）、supports（支持）、opposes（反对）')
    legend.push(`统计：${nodes.length} 节点 / ${edges.length} 边`)

    return { nodes, edges, stats, legend }
  }

  // ============================================================
  // 6. 查看插件
  // ============================================================

  viewPlugins(): PluginsView {
    const pm = getPluginManager()

    let total = 0
    let enabledCount = 0
    let disabledCount = 0
    const healthByPlugin: Record<string, any> = {}
    const table: any[] = []

    try {
      let plugins: any[] = []
      if (pm && typeof pm.listPlugins === 'function') {
        plugins = pm.listPlugins() ?? []
      } else if (pm && typeof pm.getAll === 'function') {
        plugins = pm.getAll() ?? []
      } else if (pm?.plugins instanceof Map) {
        for (const rec of pm.plugins.values()) {
          plugins.push(rec.descriptor ?? rec)
        }
      } else if (pm && Array.isArray(pm.order) && pm.plugins instanceof Map) {
        for (const id of pm.order) {
          const rec: any = pm.plugins.get(id)
          if (rec) plugins.push(rec.descriptor ?? rec)
        }
      }

      total = plugins.length

      for (const p of plugins) {
        const id: string = p?.id ?? '(unknown)'
        const name: string = p?.name ?? id
        const version: string = p?.version ?? '0.0.0'
        const type: string = p?.type ?? 'unknown'
        const desc: string = p?.description ?? ''
        let enabled = false
        if (typeof p?.enabled === 'boolean') enabled = p.enabled
        else if (pm && typeof pm.isEnabled === 'function') {
          try { enabled = !!pm.isEnabled(id) } catch (_e) { /* ignore */ }
        }

        if (enabled) enabledCount++
        else disabledCount++

        // 简易健康度（基于是否启用 + 版本语义化）
        const healthScore = enabled ? (version !== '0.0.0' ? 90 : 70) : 30
        const healthStatus = healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'unhealthy'

        healthByPlugin[id] = {
          id, name, version, type,
          enabled,
          healthScore,
          healthStatus,
        }

        table.push({
          id,
          name,
          version,
          type,
          enabled: enabled ? '✓ 已启用' : '✗ 未启用',
          health: `${healthScore}/100 (${healthStatus})`,
          description: desc.length > 60 ? desc.slice(0, 60) + '…' : desc,
        })
      }
    } catch (_e) {
      // ignore
    }

    return { total, enabledCount, disabledCount, healthByPlugin, table }
  }

  // ============================================================
  // 7. 查看基准状态
  // ============================================================

  viewBenchmark(type?: 'rule' | 'school' | 'knowledge'): any {
    const registry = getRuleRegistry()
    const ontology = getOntology()
    const kg = getKnowledgeGraph()

    // Rule benchmark
    let ruleBench: any = { status: 'unknown' }
    if (!type || type === 'rule') {
      try {
        const ruleCount = registry && typeof registry.count === 'function' ? registry.count() : 0
        const list = registry && typeof registry.list === 'function' ? (registry.list() ?? []) : []
        const withClassic = list.filter((r: any) => Array.isArray(r?.classicEvidence) && r.classicEvidence.length > 0).length
        const withTags = list.filter((r: any) => Array.isArray(r?.tags) && r.tags.length > 0).length
        ruleBench = {
          status: 'ok',
          totalRules: ruleCount,
          withClassicEvidence: withClassic,
          classicCoverage: ruleCount > 0 ? withClassic / ruleCount : 0,
          withTags,
          tagCoverage: ruleCount > 0 ? withTags / ruleCount : 0,
          categories: Array.from(new Set(list.map((r: any) => r?.category ?? '未分类'))),
        }
      } catch (_e) {
        ruleBench = { status: 'error', message: String(_e) }
      }
    }

    // Knowledge benchmark
    let knowledgeBench: any = { status: 'unknown' }
    if (!type || type === 'knowledge') {
      try {
        let defCount = 0
        if (ontology && typeof ontology.countDefinitions === 'function') {
          defCount = ontology.countDefinitions()
        } else if (ontology && typeof ontology.getDefinitions === 'function') {
          defCount = (ontology.getDefinitions() ?? []).length
        }
        let nodeCount = 0
        if (kg && typeof kg.countNodes === 'function') nodeCount = kg.countNodes()
        else if (kg && typeof kg.stats === 'function') nodeCount = kg.stats()?.nodes ?? 0
        knowledgeBench = {
          status: 'ok',
          ontologyDefinitions: defCount,
          graphNodes: nodeCount,
          note: defCount > 0 || nodeCount > 0 ? '知识体系已初始化' : '知识体系尚未加载',
        }
      } catch (_e) {
        knowledgeBench = { status: 'error', message: String(_e) }
      }
    }

    // School benchmark
    let schoolBench: any = { status: 'unknown' }
    if (!type || type === 'school') {
      try {
        // 从既有 quality 层拿（如果已接入），否则返回默认 8 流派占位
        const profileKeys = ['ziping', 'qiongtong', 'ditiansui', 'modern', 'balanced', 'shenfeng', 'yuanhai', 'zizhenping']
        schoolBench = {
          status: 'ok',
          knownProfiles: profileKeys,
          profileCount: profileKeys.length,
          note: '完整的流派基准请接入 AccuracyCenter.schoolBenchmark 获取',
        }
      } catch (_e) {
        schoolBench = { status: 'error', message: String(_e) }
      }
    }

    return {
      rule: ruleBench,
      school: schoolBench,
      knowledge: knowledgeBench,
      generatedAt: Date.now(),
    }
  }

  // ============================================================
  // 8. Dump All（聚合所有）
  // ============================================================

  dumpAll(): any {
    const reg = getRuleRegistry()
    return {
      generatedAt: Date.now(),
      rules: {
        total: reg && typeof reg.count === 'function' ? reg.count() : 0,
        sample: this.listRules().slice(0, 5),
      },
      benchmark: this.viewBenchmark(),
      plugins: this.viewPlugins(),
      knowledgeGraph: (() => {
        const kg = this.viewKnowledgeGraph({ maxNodes: 50 })
        return {
          stats: kg.stats,
          legend: kg.legend,
          sampleNodes: kg.nodes.slice(0, 10),
          sampleEdges: kg.edges.slice(0, 10),
          totalNodes: kg.nodes.length,
          totalEdges: kg.edges.length,
        }
      })(),
      sampleEvidenceQuality: this.viewDecisionEvidence({
        evidenceTree: { nodes: [] },
      }),
      note: 'dumpAll 为聚合概览；详情请使用单 viewer + 指定参数。',
    }
  }
}

// ============================================================
// 默认导出实例 + 命名导出类
// ============================================================

/**
 * 全局 DevTools 实例（默认导出）
 */
export const devTools = new DevTools()

export default devTools
