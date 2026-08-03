/**
 * P0-5A Foundation Core — 标准错误类型
 *
 * XuanFeng Core OS（命理操作系统）的统一错误体系。
 *
 * 设计原则：
 *   - 所有 Foundation 模块的异常均继承自 FoundationError
 *   - 每个错误携带：code（错误码）、layer（架构层）、module（模块）、timestamp（时间戳）
 *   - 子类按用途区分：DSL 解析、规则运行、插件、配置、校验、知识图谱
 *   - 提供 errorFactory 工厂函数，便于快速创建错误实例
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 基础错误类
// ============================================================

/**
 * Foundation 基础错误
 * 所有 Foundation 模块抛出的异常都应继承此类。
 */
export class FoundationError extends Error {
  /** 错误码（如 'FND-001'） */
  readonly code: string
  /** 所属架构层（core / knowledge / engine / decision / quality / ai / application） */
  readonly layer: string
  /** 所属模块名（如 'eventBus' / 'pluginManager'） */
  readonly module: string
  /** 错误发生时间戳（毫秒） */
  readonly timestamp: number

  constructor(
    message: string,
    options: {
      code: string
      layer: string
      module: string
      timestamp?: number
    },
  ) {
    super(message)
    this.name = 'FoundationError'
    this.code = options.code
    this.layer = options.layer
    this.module = options.module
    this.timestamp = options.timestamp ?? Date.now()

    // 保持原型链（TS 编译目标为 ES5 时需要）
    if (typeof (Error as unknown as { captureStackTrace?: Function }) !== 'undefined' &&
        typeof (Error as unknown as { captureStackTrace?: Function }).captureStackTrace === 'function') {
      (Error as unknown as { captureStackTrace: (target: object, ctor?: Function) => void }).captureStackTrace(this, this.constructor)
    }
  }

  /** 转换为可序列化对象（便于日志/传输） */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      layer: this.layer,
      module: this.module,
      timestamp: this.timestamp,
      stack: this.stack,
    }
  }
}

// ============================================================
// 子类错误
// ============================================================

/**
 * DSL 解析/编译错误
 * 来源：RuleDSL Parser / Compiler
 */
export class DSLError extends FoundationError {
  constructor(message: string, options: { code?: string; module?: string; layer?: string; timestamp?: number } = {}) {
    super(message, {
      code: options.code ?? 'FND-DSL-000',
      layer: options.layer ?? 'knowledge',
      module: options.module ?? 'ruleDSL',
      timestamp: options.timestamp,
    })
    this.name = 'DSLError'
  }
}

/**
 * 规则运行时错误
 * 来源：RuleRuntime / Engine 执行链
 */
export class RuleRuntimeError extends FoundationError {
  constructor(message: string, options: { code?: string; module?: string; layer?: string; timestamp?: number } = {}) {
    super(message, {
      code: options.code ?? 'FND-RULE-000',
      layer: options.layer ?? 'engine',
      module: options.module ?? 'ruleRuntime',
      timestamp: options.timestamp,
    })
    this.name = 'RuleRuntimeError'
  }
}

/**
 * 插件错误
 * 来源：PluginManager（注册/启用/禁用/热重载失败）
 */
export class PluginError extends FoundationError {
  constructor(message: string, options: { code?: string; module?: string; layer?: string; timestamp?: number } = {}) {
    super(message, {
      code: options.code ?? 'FND-PLUGIN-000',
      layer: options.layer ?? 'core',
      module: options.module ?? 'pluginManager',
      timestamp: options.timestamp,
    })
    this.name = 'PluginError'
  }
}

/**
 * 配置错误
 * 来源：ConfigCenter（注册冲突/类型不匹配/不可变校验失败）
 */
export class ConfigError extends FoundationError {
  constructor(message: string, options: { code?: string; module?: string; layer?: string; timestamp?: number } = {}) {
    super(message, {
      code: options.code ?? 'FND-CONFIG-000',
      layer: options.layer ?? 'core',
      module: options.module ?? 'configCenter',
      timestamp: options.timestamp,
    })
    this.name = 'ConfigError'
  }
}

/**
 * 校验错误
 * 来源：参数校验、规则前置条件、数据完整性检查
 */
export class ValidationError extends FoundationError {
  constructor(message: string, options: { code?: string; module?: string; layer?: string; timestamp?: number } = {}) {
    super(message, {
      code: options.code ?? 'FND-VALIDATE-000',
      layer: options.layer ?? 'core',
      module: options.module ?? 'validator',
      timestamp: options.timestamp,
    })
    this.name = 'ValidationError'
  }
}

/**
 * 知识图谱错误
 * 来源：ClassicKG（古籍知识图谱查询/写入/循环依赖）
 */
export class KnowledgeGraphError extends FoundationError {
  constructor(message: string, options: { code?: string; module?: string; layer?: string; timestamp?: number } = {}) {
    super(message, {
      code: options.code ?? 'FND-KG-000',
      layer: options.layer ?? 'knowledge',
      module: options.module ?? 'classicGraph',
      timestamp: options.timestamp,
    })
    this.name = 'KnowledgeGraphError'
  }
}

// ============================================================
// 错误工厂
// ============================================================

/**
 * 错误类型别名（用于 errorFactory 的 kind 参数）
 */
export type FoundationErrorKind =
  | 'foundation'
  | 'dsl'
  | 'rule'
  | 'plugin'
  | 'config'
  | 'validation'
  | 'knowledge'

/**
 * 错误工厂构造参数
 */
export interface ErrorFactoryOptions {
  /** 错误码（缺省时按 kind 给出默认前缀） */
  code?: string
  /** 架构层（缺省时按 kind 给出默认值） */
  layer?: string
  /** 模块名（缺省时按 kind 给出默认值） */
  module?: string
  /** 时间戳（缺省时取 Date.now()） */
  timestamp?: number
}

/**
 * 错误工厂函数
 *
 * 根据 kind 快速创建对应的 FoundationError 子类实例。
 *
 * @example
 * throw errorFactory('dsl', '条件表达式解析失败：operator 不支持', { module: 'parser' })
 *
 * @param kind 错误种类
 * @param message 错误消息
 * @param options 额外选项（code/layer/module/timestamp）
 */
export function errorFactory(
  kind: FoundationErrorKind,
  message: string,
  options: ErrorFactoryOptions = {},
): FoundationError {
  switch (kind) {
    case 'dsl':
      return new DSLError(message, options)
    case 'rule':
      return new RuleRuntimeError(message, options)
    case 'plugin':
      return new PluginError(message, options)
    case 'config':
      return new ConfigError(message, options)
    case 'validation':
      return new ValidationError(message, options)
    case 'knowledge':
      return new KnowledgeGraphError(message, options)
    case 'foundation':
    default:
      return new FoundationError(message, {
        code: options.code ?? 'FND-000',
        layer: options.layer ?? 'core',
        module: options.module ?? 'foundation',
        timestamp: options.timestamp,
      })
  }
}
