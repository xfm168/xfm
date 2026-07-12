/**
 * 规则引擎模块
 *
 * 提供八字命理推演的规则注册、分类查询与条件求值能力。
 * 所有规则统一通过 RuleEngine 管理，支持按类别筛选、优先级排序，
 * 以及基于 RuleCondition 的布尔求值。
 */

import type { ClassicalSource } from './types'

// ═══════════════════════════════════════════════════════════════
// 接口定义
// ═══════════════════════════════════════════════════════════════

/**
 * 规则条件 — 单个字段的比较谓词
 *
 * @example
 * // field 等于 value
 * { field: 'dayElement', operator: 'eq', value: '木' }
 * // field 大于等于 value
 * { field: 'strengthScore', operator: 'gte', value: 60 }
 * // field 包含在 value 数组中
 * { field: 'monthZhi', operator: 'includes', value: ['寅', '卯'] }
 */
export interface RuleCondition {
  /** 目标字段名（对应 context 中的键） */
  field: string
  /** 比较运算符 */
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'includes' | 'match'
  /** 比较值，可以是字符串、数字或字符串数组（配合 includes） */
  value: string | number | string[]
}

/**
 * 八字推演规则
 *
 * @example
 * {
 *   id: 'rule-001',
 *   name: '甲己合化土',
 *   category: '合',
 *   condition: [{ field: 'heHuaElement', operator: 'eq', value: '土' }],
 *   priority: 10,
 *   source: '滴天髓',
 *   description: '甲己合，逢辰戌丑未月化土',
 *   enabled: true
 * }
 */
export interface BaziRule {
  /** 规则唯一ID */
  id: string
  /** 规则名称 */
  name: string
  /** 规则类别 */
  category: '合' | '冲' | '刑' | '害' | '破' | '格局' | '旺衰' | '用神' | '调候' | '病药' | '月令' | '天干' | '地支'
  /** 条件列表（全部满足才命中） */
  condition: RuleCondition[]
  /** 优先级（数字越小越优先） */
  priority: number
  /** 来源古籍 */
  source: ClassicalSource
  /** 规则描述 */
  description: string
  /** 是否启用 */
  enabled: boolean
}

/**
 * 规则包 — 将多条规则打包管理
 *
 * @example
 * {
 *   id: 'pkg-heyi',
 *   name: '合化规则包',
 *   description: '包含所有合化相关规则',
 *   rules: [rule1, rule2],
 *   source: '滴天髓',
 *   author: '任铁樵',
 *   dynasty: '清'
 * }
 */
export interface RulePackage {
  /** 规则包唯一ID */
  id: string
  /** 规则包名称 */
  name: string
  /** 规则包描述 */
  description: string
  /** Rule Package 版本号 */
  version: string
  /** 包含的规则列表 */
  rules: BaziRule[]
  /** 来源 */
  source: string
  /** 作者（可选） */
  author?: string
  /** 朝代（可选） */
  dynasty?: string
}

// ═══════════════════════════════════════════════════════════════
// RuleEngine 实现
// ═══════════════════════════════════════════════════════════════

/**
 * 规则引擎
 *
 * 负责规则的注册、分类、求值与规则包管理。
 * 内部维护一个规则列表与规则包列表，所有操作均在此进行。
 */
export class RuleEngine {
  /** 已注册的规则列表 */
  private rules: Map<string, BaziRule> = new Map()
  /** 已注册的规则包列表 */
  private packages: Map<string, RulePackage> = new Map()

  /**
   * 注册单条规则
   *
   * @param rule - 要注册的规则对象
   * @throws 如果规则ID已存在，将静默覆盖并打印警告
   */
  registerRule(rule: BaziRule): void {
    if (this.rules.has(rule.id)) {
      console.warn(`[RuleEngine] 规则 "${rule.id}" 已存在，将被覆盖`)
    }
    this.rules.set(rule.id, rule)
  }

  /**
   * 注册规则包，并同时注册包内的所有规则
   *
   * @param pkg - 要注册的规则包对象
   */
  registerPackage(pkg: RulePackage): void {
    if (this.packages.has(pkg.id)) {
      console.warn(`[RuleEngine] 规则包 "${pkg.id}" 已存在，将被覆盖`)
    }
    this.packages.set(pkg.id, pkg)
    // 同步注册包内所有规则
    for (const rule of pkg.rules) {
      this.registerRule(rule)
    }
  }

  /**
   * 按类别查询规则列表
   *
   * @param cat - 规则类别（如 '合'、'冲'、'格局' 等）
   * @returns 符合条件的已启用规则列表，按优先级升序排列
   */
  getRulesByCategory(cat: BaziRule['category']): BaziRule[] {
    return Array.from(this.rules.values())
      .filter(r => r.category === cat && r.enabled)
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * 评估单条规则在给定上下文中是否命中
   *
   * 对规则的所有条件逐一求值，全部通过则返回 true。
   *
   * @param rule - 要评估的规则
   * @param context - 命局上下文对象（字段名需与 condition.field 匹配）
   * @returns 所有条件均满足返回 true，否则返回 false
   */
  evaluateRule(rule: BaziRule, context: Record<string, any>): boolean {
    if (!rule.enabled) return false

    return rule.condition.every(cond => {
      const fieldValue = context[cond.field]
      if (fieldValue === undefined || fieldValue === null) return false

      switch (cond.operator) {
        case 'eq':
          return fieldValue === cond.value
        case 'neq':
          return fieldValue !== cond.value
        case 'gt':
          return Number(fieldValue) > Number(cond.value)
        case 'lt':
          return Number(fieldValue) < Number(cond.value)
        case 'gte':
          return Number(fieldValue) >= Number(cond.value)
        case 'lte':
          return Number(fieldValue) <= Number(cond.value)
        case 'includes':
          return Array.isArray(cond.value) && cond.value.includes(String(fieldValue))
        case 'match': {
          const regex = new RegExp(String(cond.value))
          return regex.test(String(fieldValue))
        }
        default:
          return false
      }
    })
  }

  /**
   * 列出所有已注册的规则包
   *
   * @returns 规则包列表
   */
  listAllPackages(): RulePackage[] {
    return Array.from(this.packages.values())
  }

  /**
   * 清空所有已注册的规则与规则包
   */
  clearAll(): void {
    this.rules.clear()
    this.packages.clear()
  }
}

/** 规则引擎全局单例 */
export const ruleEngine = new RuleEngine()
