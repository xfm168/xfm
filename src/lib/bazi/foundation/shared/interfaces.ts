/**
 * P0-5A Foundation Core — 共享接口
 *
 * 所有 Foundation 模块共享的类型契约。
 * 描述组件的"能力"而非"实现"，是 XuanFeng Core OS 的内核协议层。
 *
 * 设计原则：
 *   - 接口即契约：依赖方仅依赖接口，不依赖具体实现
 *   - 单一职责：每个接口描述一种能力（Disposable / Initializable / Startable ...）
 *   - 组合优先：Plugin 通过 extends 多个能力接口组合而成
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 基础能力接口
// ============================================================

/**
 * 可释放资源接口
 * 持有需要清理的资源（事件订阅、定时器、连接等）的模块应实现此接口。
 */
export interface Disposable {
  /** 释放资源（同步） */
  dispose(): void
}

/**
 * 可初始化接口
 * 需要异步准备阶段（加载配置、连接数据库、预编译等）的模块应实现此接口。
 */
export interface Initializable {
  /** 初始化（同步或异步） */
  init(): Promise<void> | void
}

/**
 * 可启停接口
 * 具备运行生命周期的模块（插件、引擎、调度器）应实现此接口。
 */
export interface Startable {
  /** 启动（同步或异步） */
  start(): Promise<void> | void
  /** 停止（同步或异步） */
  stop(): Promise<void> | void
}

// ============================================================
// 元信息接口
// ============================================================

/** 命名能力（模块具备可读名称） */
export interface Named {
  /** 模块名称 */
  readonly name: string
}

/** 版本能力（模块具备语义化版本号） */
export interface Versioned {
  /** 语义化版本号（如 '1.0.0'） */
  readonly version: string
}

/** 标识能力（模块具备全局唯一 ID） */
export interface Identifiable {
  /** 全局唯一 ID */
  readonly id: string
}

// ============================================================
// 事件与序列化
// ============================================================

/**
 * 事件处理器类型
 * 处理器可以同步返回 void，也可以异步返回 Promise<void>。
 */
export type EventHandler<T = any> = (event: T) => void | Promise<void>

/**
 * 可序列化接口
 * 需要持久化或跨进程传输的模块应实现此接口。
 */
export interface Serializable {
  /** 序列化为字符串 */
  serialize(): string
  /** 从字符串反序列化并恢复状态 */
  deserialize(data: string): void
}

// ============================================================
// 插件接口
// ============================================================

/**
 * 插件接口
 *
 * 描述 XuanFeng Core OS 中可热插拔的模块（BaZi / ZiWei / QiMen 等）。
 * 通过组合 Named / Versioned / Disposable / Initializable / Startable 提供完整生命周期契约。
 *
 * PluginManager 在 enable() 时按 init → start 顺序调用，disable() 时按 stop → dispose 顺序调用，
 * 因此 Plugin 必须同时具备 Startable 能力。
 */
export interface Plugin extends Named, Versioned, Disposable, Initializable, Startable {
  /** 插件类型（如 'engine' / 'knowledge' / 'ai'） */
  type: string
  /** 插件描述 */
  description: string
  /** 依赖的其他插件 ID 列表 */
  dependencies: string[]
  /** 加载时回调（可选） */
  onLoad?(): void
  /** 卸载时回调（可选） */
  onUnload?(): void
}
