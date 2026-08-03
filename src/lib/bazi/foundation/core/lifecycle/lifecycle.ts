/**
 * P0-5A Foundation Core — 生命周期管理器（Lifecycle Manager）
 *
 * 统一管理 Foundation 各模块的状态机：
 *   uninitialized → initializing → ready → starting → running → stopping → stopped
 *                                                            ↘ error（任意阶段失败时）
 *
 * 设计原则：
 *   - 单一注册表：所有 Foundation 模块通过 register() 进入管理
 *   - 依赖优先：init/start 前先初始化依赖（依赖信息从模块对象的 dependencies 字段读取，若存在）
 *   - 错误隔离：单个模块失败不影响其他模块的初始化/启动
 *   - 错误捕获：所有阶段失败均记录到 error 状态并写入日志
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import type { Initializable, Startable } from '../../shared'
import { globalLogger, FoundationError } from '../../shared'

// ============================================================
// 状态类型
// ============================================================

/**
 * 生命周期状态
 * 状态流转：
 *   uninitialized → initializing → ready → starting → running → stopping → stopped
 *   任意阶段失败 → error
 */
export type LifecycleState =
  | 'uninitialized'   // 未初始化
  | 'initializing'    // 初始化中
  | 'ready'           // 初始化完成，可启动
  | 'starting'        // 启动中
  | 'running'         // 运行中
  | 'stopping'        // 停止中
  | 'stopped'         // 已停止
  | 'error'           // 错误状态

// ============================================================
// 注册项
// ============================================================

/**
 * 注册到 LifecycleManager 的模块项
 *
 * 通过扩展 Initializable & Startable 增加 dependencies 字段，
 * 用于依赖排序（init/start 依赖先于自身执行）。
 */
export interface LifecycleEntry extends Initializable, Startable {
  /** 依赖的其他模块 ID 列表 */
  dependencies?: string[]
}

// ============================================================
// LifecycleManager 类
// ============================================================

/**
 * Foundation 生命周期管理器
 *
 * @example
 * import { globalLifecycle } from '@/lib/bazi/foundation/core'
 *
 * globalLifecycle.register('eventBus', { start() {}, stop() {}, init() {} })
 * globalLifecycle.register('configCenter', {
 *   dependencies: ['eventBus'],
 *   start() {}, stop() {}, init() {},
 * })
 *
 * await globalLifecycle.init()      // 先初始化 eventBus，再初始化 configCenter
 * await globalLifecycle.start()     // 按同样顺序启动
 * await globalLifecycle.stop()      // 反向顺序停止
 */
export class LifecycleManager {
  /** 注册表（按 ID 索引） */
  private registry = new Map<string, LifecycleEntry>()
  /** 状态表（按 ID 索引） */
  private states = new Map<string, LifecycleState>()
  /** 注册顺序（用于稳定排序） */
  private order: string[] = []
  /** 错误记录（按 ID 索引） */
  private errors = new Map<string, Error>()

  /**
   * 注册模块
   * @param id 模块 ID（全局唯一）
   * @param entry 模块实现（需提供 init/start/stop，可选 dependencies）
   */
  register(id: string, entry: Initializable & Startable): void {
    if (this.registry.has(id)) {
      globalLogger.warn('Lifecycle 模块已存在，覆盖旧注册项', { id })
    } else {
      this.order.push(id)
    }

    // 通过类型断言读取可选的 dependencies 字段（Plugin 等实现会暴露此字段）
    const dependencies = (entry as { dependencies?: string[] }).dependencies
    const fullEntry: LifecycleEntry = {
      ...entry,
      ...(dependencies ? { dependencies } : {}),
    }

    this.registry.set(id, fullEntry)
    this.states.set(id, 'uninitialized')
    this.errors.delete(id)
  }

  /**
   * 注销模块（不会自动 stop/dispose，调用方需自行处理）
   * @param id 模块 ID
   */
  unregister(id: string): void {
    this.registry.delete(id)
    this.states.delete(id)
    this.errors.delete(id)
    this.order = this.order.filter(x => x !== id)
  }

  /**
   * 初始化模块
   * 不传 id 时初始化所有已注册模块（按依赖顺序）。
   * @param id 模块 ID（可选）
   */
  async init(id?: string): Promise<void> {
    if (id) {
      await this.initOne(id, new Set())
      return
    }
    // 按依赖拓扑顺序初始化
    const ordered = this.resolveOrder()
    for (const currentId of ordered) {
      await this.initOne(currentId, new Set())
    }
  }

  /**
   * 启动模块
   * 不传 id 时启动所有已注册模块（按依赖顺序）。
   * @param id 模块 ID（可选）
   */
  async start(id?: string): Promise<void> {
    if (id) {
      await this.startOne(id, new Set())
      return
    }
    const ordered = this.resolveOrder()
    for (const currentId of ordered) {
      await this.startOne(currentId, new Set())
    }
  }

  /**
   * 停止模块
   * 不传 id 时停止所有已注册模块（按依赖反序）。
   * @param id 模块 ID（可选）
   */
  async stop(id?: string): Promise<void> {
    if (id) {
      await this.stopOne(id, new Set())
      return
    }
    // 反向停止：依赖方先停，依赖项后停
    const reversed = this.resolveOrder().reverse()
    for (const currentId of reversed) {
      await this.stopOne(currentId, new Set())
    }
  }

  /**
   * 获取模块当前状态
   * @param id 模块 ID
   */
  getState(id: string): LifecycleState {
    return this.states.get(id) ?? 'uninitialized'
  }

  /**
   * 获取所有模块的状态快照
   */
  getAllStates(): Record<string, LifecycleState> {
    const result: Record<string, LifecycleState> = {}
    for (const [id, state] of this.states) {
      result[id] = state
    }
    return result
  }

  /**
   * 获取模块最近一次错误
   * @param id 模块 ID
   */
  getError(id: string): Error | undefined {
    return this.errors.get(id)
  }

  /**
   * 释放所有资源
   * 等价于：stop() 所有 → 清空注册表
   */
  async dispose(): Promise<void> {
    await this.stop()
    this.registry.clear()
    this.states.clear()
    this.errors.clear()
    this.order = []
  }

  // ─── 内部实现 ───────────────────────────────────

  /**
   * 初始化单个模块（递归先初始化依赖）
   * @param id 模块 ID
   * @param visiting 当前调用链正在处理的 ID（用于循环依赖检测）
   */
  private async initOne(id: string, visiting: Set<string>): Promise<void> {
    if (visiting.has(id)) {
      const cycleMsg = `Lifecycle 检测到循环依赖：${[...visiting, id].join(' → ')}`
      globalLogger.error(cycleMsg)
      this.states.set(id, 'error')
      this.errors.set(id, new FoundationError(cycleMsg, {
        code: 'FND-LIFECYCLE-CYCLE',
        layer: 'core',
        module: 'lifecycle',
      }))
      return
    }

    const entry = this.registry.get(id)
    if (!entry) {
      globalLogger.warn('Lifecycle 模块不存在，跳过 init', { id })
      return
    }

    const state = this.getState(id)
    // 已初始化/运行中/已停止的模块不重复初始化
    if (state === 'ready' || state === 'running' || state === 'starting' || state === 'stopping') {
      return
    }

    // 先初始化依赖
    visiting.add(id)
    const deps = entry.dependencies ?? []
    for (const depId of deps) {
      const depState = this.getState(depId)
      if (depState !== 'ready' && depState !== 'running') {
        await this.initOne(depId, visiting)
      }
    }
    visiting.delete(id)

    // 依赖初始化可能因循环依赖失败 → 此时当前模块同样进入 error 状态
    if (this.getState(id) === 'error') {
      return
    }

    // 执行本模块 init
    this.states.set(id, 'initializing')
    try {
      await entry.init()
      this.states.set(id, 'ready')
    } catch (err) {
      this.states.set(id, 'error')
      const error = err instanceof Error ? err : new Error(String(err))
      this.errors.set(id, error)
      globalLogger.error('Lifecycle init 失败', { id, error: error.message, stack: error.stack })
    }
  }

  /**
   * 启动单个模块（递归先启动依赖）
   */
  private async startOne(id: string, visiting: Set<string>): Promise<void> {
    if (visiting.has(id)) {
      globalLogger.error('Lifecycle start 检测到循环依赖', { id, chain: [...visiting, id].join(' → ') })
      return
    }

    const entry = this.registry.get(id)
    if (!entry) {
      globalLogger.warn('Lifecycle 模块不存在，跳过 start', { id })
      return
    }

    const state = this.getState(id)
    if (state === 'running') {
      return
    }

    // 必须先初始化才能启动
    if (state === 'uninitialized' || state === 'initializing') {
      await this.initOne(id, visiting)
    }

    // 先启动依赖
    visiting.add(id)
    const deps = entry.dependencies ?? []
    for (const depId of deps) {
      const depState = this.getState(depId)
      if (depState !== 'running') {
        await this.startOne(depId, visiting)
      }
    }
    visiting.delete(id)

    // 检查 init 后的状态
    if (this.getState(id) !== 'ready') {
      globalLogger.warn('Lifecycle 模块未 ready，跳过 start', { id, state: this.getState(id) })
      return
    }

    this.states.set(id, 'starting')
    try {
      await entry.start()
      this.states.set(id, 'running')
    } catch (err) {
      this.states.set(id, 'error')
      const error = err instanceof Error ? err : new Error(String(err))
      this.errors.set(id, error)
      globalLogger.error('Lifecycle start 失败', { id, error: error.message, stack: error.stack })
    }
  }

  /**
   * 停止单个模块（递归先停依赖方，再停自身依赖）
   * 简化策略：直接停止目标模块，若其依赖项无人引用可由调用方继续 stop。
   */
  private async stopOne(id: string, visiting: Set<string>): Promise<void> {
    if (visiting.has(id)) {
      return
    }

    const entry = this.registry.get(id)
    if (!entry) {
      return
    }

    const state = this.getState(id)
    if (state === 'stopped' || state === 'uninitialized') {
      return
    }

    visiting.add(id)
    this.states.set(id, 'stopping')
    try {
      await entry.stop()
      this.states.set(id, 'stopped')
    } catch (err) {
      this.states.set(id, 'error')
      const error = err instanceof Error ? err : new Error(String(err))
      this.errors.set(id, error)
      globalLogger.error('Lifecycle stop 失败', { id, error: error.message, stack: error.stack })
    }
    visiting.delete(id)
  }

  /**
   * 拓扑排序（Kahn 算法）
   * 依赖项在前，依赖方在后；同层级按注册顺序稳定排列。
   * 存在循环依赖时，剩余节点按注册顺序追加（不抛错，仅记录日志）。
   */
  private resolveOrder(): string[] {
    // 入度统计
    const inDegree = new Map<string, number>()
    const adjacency = new Map<string, string[]>()

    for (const id of this.order) {
      inDegree.set(id, 0)
      adjacency.set(id, [])
    }

    for (const id of this.order) {
      const entry = this.registry.get(id)
      const deps = entry?.dependencies ?? []
      for (const depId of deps) {
        // 仅当依赖项确实已注册时建立边（depId → id）
        if (this.registry.has(depId)) {
          adjacency.get(depId)!.push(id)
          inDegree.set(id, (inDegree.get(id) ?? 0) + 1)
        } else {
          globalLogger.warn('Lifecycle 依赖未注册', { id, missingDep: depId })
        }
      }
    }

    // 入度为 0 的节点入队（按注册顺序）
    const queue: string[] = this.order.filter(id => (inDegree.get(id) ?? 0) === 0)
    const result: string[] = []
    const visited = new Set<string>()

    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      result.push(current)

      for (const next of adjacency.get(current) ?? []) {
        const newDegree = (inDegree.get(next) ?? 0) - 1
        inDegree.set(next, newDegree)
        if (newDegree === 0) {
          queue.push(next)
        }
      }
    }

    // 处理循环依赖中的剩余节点（按注册顺序追加，避免遗漏）
    if (result.length < this.order.length) {
      const remaining = this.order.filter(id => !visited.has(id))
      globalLogger.warn('Lifecycle 检测到循环依赖，剩余节点按注册顺序追加', { remaining })
      result.push(...remaining)
    }

    return result
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局 Lifecycle 管理器单例 */
export const globalLifecycle = new LifecycleManager()

export default globalLifecycle
