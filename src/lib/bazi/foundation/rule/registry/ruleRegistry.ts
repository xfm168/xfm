/**
 * P0-5B Rule Runtime — 统一规则注册表（RuleRegistry）
 *
 * 同时管理 DSL 规则（RuleDSLDefinition）与代码规则（RuleDefinition）：
 *   - register / unregister      注册与注销
 *   - get / list / listBy*       多维查询（按 ID / 分类 / 来源 / 标签）
 *   - exists / count             存在性 / 计数
 *   - exportDSL / importDSL      DSL 规则的导入导出
 *
 * 与既有 ruleEngine/ruleRegistry.ts 的区别：
 *   - 既有 registry 是模块级全局变量（rules/sandbox Map）+ 函数式 API
 *   - 本 RuleRegistry 是类封装 + 全局单例 globalRuleRegistry，便于实例化与隔离测试
 *   - 同时容纳 DSL 规则与代码规则，统一 id 索引
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import type { RuleDSLDefinition } from '../../types'
import type { RuleDefinition } from '../../../ruleEngine/types'

// ============================================================
// 内部辅助类型
// ============================================================

/** 规则来源类型 */
export type RegistryRuleSource = 'code' | 'dsl'

/** 注册表中的规则记录（带来源标记） */
export interface RegistryEntry {
  /** 规则 ID */
  id: string
  /** 规则来源类型 */
  source: RegistryRuleSource
  /** 原始规则对象（RuleDefinition 或 RuleDSLDefinition） */
  rule: any
}

// ============================================================
// RuleRegistry 类
// ============================================================

/**
 * 统一规则注册表
 *
 * 维护规则 ID → 规则对象的索引，同时支持 DSL 规则与代码规则。
 * 通过 source 字段区分规则来源，便于 exportDSL 时筛选。
 */
export class RuleRegistry {
  /** 规则表：ruleId → RegistryEntry */
  private rules = new Map<string, RegistryEntry>()
  /** 按分类索引：category → ruleId[] */
  private byCategory = new Map<string, Set<string>>()
  /** 按来源索引：source(classic name) → ruleId[] */
  private bySource = new Map<string, Set<string>>()
  /** 按标签索引：tag → ruleId[] */
  private byTag = new Map<string, Set<string>>()

  // ---------- 注册 / 注销 ----------

  /**
   * 注册规则（RuleDefinition 或 RuleDSLDefinition 均可）
   * 已存在则覆盖，返回是否为新增
   */
  register(rule: any): boolean {
    const ruleId = this.extractId(rule)
    if (!ruleId) {
      console.warn('[RuleRegistry] 规则缺少 id 字段，已忽略')
      return false
    }
    const sourceType: RegistryRuleSource = this.isDSLRule(rule) ? 'dsl' : 'code'
    const isNew = !this.rules.has(ruleId)

    // 移除旧索引（若覆盖）
    if (!isNew) {
      this.removeFromIndexes(ruleId, this.rules.get(ruleId)!.rule)
    }

    this.rules.set(ruleId, { id: ruleId, source: sourceType, rule })

    // 加入新索引
    this.addToIndexes(ruleId, rule)

    return isNew
  }

  /** 注销规则 */
  unregister(ruleId: string): boolean {
    const entry = this.rules.get(ruleId)
    if (!entry) return false
    this.removeFromIndexes(ruleId, entry.rule)
    return this.rules.delete(ruleId)
  }

  // ---------- 查询 ----------

  /** 按 ID 获取规则（原始对象） */
  get(ruleId: string): any | undefined {
    return this.rules.get(ruleId)?.rule
  }

  /** 列出所有规则 */
  list(): any[] {
    return Array.from(this.rules.values()).map(e => e.rule)
  }

  /** 按分类列出规则 */
  listByCategory(category: string): any[] {
    const ids = this.byCategory.get(category) ?? new Set()
    const out: any[] = []
    for (const id of ids) {
      const entry = this.rules.get(id)
      if (entry) out.push(entry.rule)
    }
    return out
  }

  /** 按来源（典籍名）列出规则 */
  listBySource(source: string): any[] {
    const ids = this.bySource.get(source) ?? new Set()
    const out: any[] = []
    for (const id of ids) {
      const entry = this.rules.get(id)
      if (entry) out.push(entry.rule)
    }
    return out
  }

  /** 按标签列出规则 */
  listByTag(tag: string): any[] {
    const ids = this.byTag.get(tag) ?? new Set()
    const out: any[] = []
    for (const id of ids) {
      const entry = this.rules.get(id)
      if (entry) out.push(entry.rule)
    }
    return out
  }

  /** 判断规则是否存在 */
  exists(ruleId: string): boolean {
    return this.rules.has(ruleId)
  }

  /** 获取规则总数 */
  count(): number {
    return this.rules.size
  }

  /** 清空所有规则 */
  clear(): void {
    this.rules.clear()
    this.byCategory.clear()
    this.bySource.clear()
    this.byTag.clear()
  }

  // ---------- DSL 导入导出 ----------

  /**
   * 导出所有 DSL 规则
   * 非 DSL 规则会被跳过（代码规则无对应 DSL 表示）
   */
  exportDSL(): RuleDSLDefinition[] {
    const out: RuleDSLDefinition[] = []
    for (const entry of this.rules.values()) {
      if (entry.source === 'dsl') {
        out.push(entry.rule as RuleDSLDefinition)
      }
    }
    return out
  }

  /**
   * 批量导入 DSL 规则
   * @returns 成功导入的规则数
   */
  importDSL(dsls: RuleDSLDefinition[]): number {
    let count = 0
    for (const dsl of dsls) {
      if (this.register(dsl)) count += 1
      else count += 1 // 覆盖也算成功导入
    }
    return count
  }

  /** 获取统计 */
  getStats(): { total: number; dslCount: number; codeCount: number; categories: number; sources: number; tags: number } {
    let dslCount = 0
    let codeCount = 0
    for (const entry of this.rules.values()) {
      if (entry.source === 'dsl') dslCount += 1
      else codeCount += 1
    }
    return {
      total: this.rules.size,
      dslCount,
      codeCount,
      categories: this.byCategory.size,
      sources: this.bySource.size,
      tags: this.byTag.size,
    }
  }

  // ---------- 内部辅助 ----------

  /** 提取规则 ID */
  private extractId(rule: any): string | undefined {
    return rule?.id ?? rule?.ruleId
  }

  /** 判断是否为 DSL 规则 */
  private isDSLRule(rule: any): rule is RuleDSLDefinition {
    return rule && !('evaluate' in rule) && 'conditions' in rule
  }

  /** 提取分类（兼容 DSL 与代码规则） */
  private extractCategory(rule: any): string | undefined {
    return rule?.category
  }

  /** 提取来源（兼容 DSL 数组形式与代码规则字符串形式） */
  private extractSources(rule: any): string[] {
    const src = rule?.source
    if (!src) return []
    if (Array.isArray(src)) return src.filter(Boolean)
    if (typeof src === 'string') return [src]
    return []
  }

  /** 提取标签 */
  private extractTags(rule: any): string[] {
    return Array.isArray(rule?.tags) ? rule.tags.filter(Boolean) : []
  }

  /** 加入分类/来源/标签索引 */
  private addToIndexes(ruleId: string, rule: any): void {
    const category = this.extractCategory(rule)
    if (category) {
      if (!this.byCategory.has(category)) this.byCategory.set(category, new Set())
      this.byCategory.get(category)!.add(ruleId)
    }
    for (const src of this.extractSources(rule)) {
      if (!this.bySource.has(src)) this.bySource.set(src, new Set())
      this.bySource.get(src)!.add(ruleId)
    }
    for (const tag of this.extractTags(rule)) {
      if (!this.byTag.has(tag)) this.byTag.set(tag, new Set())
      this.byTag.get(tag)!.add(ruleId)
    }
  }

  /** 从分类/来源/标签索引中移除 */
  private removeFromIndexes(ruleId: string, rule: any): void {
    const category = this.extractCategory(rule)
    if (category) this.byCategory.get(category)?.delete(ruleId)
    for (const src of this.extractSources(rule)) {
      this.bySource.get(src)?.delete(ruleId)
    }
    for (const tag of this.extractTags(rule)) {
      this.byTag.get(tag)?.delete(ruleId)
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局规则注册表单例 */
export const globalRuleRegistry = new RuleRegistry()
