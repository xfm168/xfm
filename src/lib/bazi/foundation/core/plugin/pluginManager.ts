/**
 * P0-5A Foundation Core — 插件管理器（Plugin Manager）
 *
 * XuanFeng Core OS 中可热插拔模块（BaZi / ZiWei / QiMen 等）的注册与生命周期管理中枢。
 *
 * 设计原则：
 *   - 描述符与实例分离：register(descriptor) 仅登记元信息，enable() 时才实例化
 *   - 依赖优先：enable 前会先 enable 所有 dependencies；resolveOrder 拓扑排序
 *   - 热重载：reload(id) = disable + enable，便于无停机更新
 *   - 事件驱动：PluginLoaded / PluginUnloaded 通过 EventBus 广播
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import type { Plugin } from '../../shared'
import { globalLogger, PluginError } from '../../shared'
import { globalEventBus, FoundationEvents } from '../eventbus/eventBus'

// ============================================================
// 类型定义
// ============================================================

/**
 * 插件描述符
 * 描述插件的元信息与工厂方法（不直接持有插件实例）
 */
export interface PluginDescriptor {
  /** 插件 ID（全局唯一，如 'bazi' / 'ziwei' / 'qimen'） */
  id: string
  /** 插件名称（人类可读） */
  name: string
  /** 语义化版本号 */
  version: string
  /** 插件类型（如 'engine' / 'knowledge' / 'ai'） */
  type: string
  /** 插件描述 */
  description: string
  /** 依赖的其他插件 ID 列表 */
  dependencies: string[]
  /** 工厂方法：返回 Plugin 实例（enable 时调用） */
  factory: () => Plugin
}

// ============================================================
// 内部状态
// ============================================================

/** 单个插件在管理器中的运行态记录 */
interface PluginRecord {
  /** 描述符 */
  descriptor: PluginDescriptor
  /** 已实例化的插件（仅 enable 后存在） */
  instance?: Plugin
  /** 是否已启用 */
  enabled: boolean
}

// ============================================================
// PluginManager 类
// ============================================================

/**
 * 插件管理器
 *
 * @example
 * import { globalPluginManager } from '@/lib/bazi/foundation/core'
 *
 * globalPluginManager.register({
 *   id: 'bazi',
 *   name: '八字引擎',
 *   version: '5.0.0',
 *   type: 'engine',
 *   description: '子平八字推演',
 *   dependencies: [],
 *   factory: () => new BaziEnginePlugin(),
 * })
 *
 * await globalPluginManager.enable('bazi')
 * await globalPluginManager.reload('bazi')   // 热重载
 * await globalPluginManager.disable('bazi')
 */
export class PluginManager {
  /** 已注册的插件记录（按 ID 索引） */
  private plugins = new Map<string, PluginRecord>()
  /** 注册顺序（用于稳定排序） */
  private order: string[] = []

  /**
   * 注册插件描述符
   * @param descriptor 插件描述符
   * @returns 是否注册成功（重复注册返回 false）
   */
  register(descriptor: PluginDescriptor): boolean {
    if (this.plugins.has(descriptor.id)) {
      globalLogger.warn('插件已注册，跳过重复注册', { pluginId: descriptor.id })
      return false
    }
    this.plugins.set(descriptor.id, {
      descriptor,
      enabled: false,
    })
    this.order.push(descriptor.id)
    globalLogger.info('插件已注册', {
      pluginId: descriptor.id,
      name: descriptor.name,
      version: descriptor.version,
    })
    return true
  }

  /**
   * 注销插件
   * 已启用的插件会先被 disable。
   * @param id 插件 ID
   * @returns 是否注销成功（不存在返回 false）
   */
  async unregister(id: string): Promise<boolean> {
    const record = this.plugins.get(id)
    if (!record) {
      return false
    }
    if (record.enabled) {
      await this.disable(id)
    }
    this.plugins.delete(id)
    this.order = this.order.filter(x => x !== id)
    globalLogger.info('插件已注销', { pluginId: id })
    return true
  }

  /**
   * 启用插件
   * 流程：依赖检查 → 实例化 → init → start
   * @param id 插件 ID
   * @returns 是否启用成功
   */
  async enable(id: string): Promise<boolean> {
    const record = this.plugins.get(id)
    if (!record) {
      throw new PluginError(`插件未注册: ${id}`, { module: 'pluginManager', code: 'FND-PLUGIN-NOT-FOUND' })
    }
    if (record.enabled) {
      globalLogger.warn('插件已启用，跳过重复 enable', { pluginId: id })
      return true
    }

    // 依赖检查 + 递归 enable
    if (!this.hasDependency(id)) {
      const missing = (record.descriptor.dependencies ?? []).filter(dep => !this.isEnabled(dep))
      throw new PluginError(`插件 ${id} 的依赖未全部启用: ${missing.join(', ')}`, {
        module: 'pluginManager',
        code: 'FND-PLUGIN-DEP-MISSING',
      })
    }

    for (const depId of record.descriptor.dependencies ?? []) {
      if (!this.isEnabled(depId)) {
        const ok = await this.enable(depId)
        if (!ok) return false
      }
    }

    // 实例化
    let instance: Plugin
    try {
      instance = record.descriptor.factory()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new PluginError(`插件 ${id} 工厂方法抛错: ${msg}`, {
        module: 'pluginManager',
        code: 'FND-PLUGIN-FACTORY',
      })
    }

    // onLoad 钩子
    if (typeof instance.onLoad === 'function') {
      try {
        instance.onLoad()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        globalLogger.warn('插件 onLoad 钩子抛错', { pluginId: id, error: msg })
      }
    }

    // init
    try {
      await instance.init()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new PluginError(`插件 ${id} init 失败: ${msg}`, {
        module: 'pluginManager',
        code: 'FND-PLUGIN-INIT',
      })
    }

    // start
    try {
      await instance.start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new PluginError(`插件 ${id} start 失败: ${msg}`, {
        module: 'pluginManager',
        code: 'FND-PLUGIN-START',
      })
    }

    record.instance = instance
    record.enabled = true

    // 广播事件
    await globalEventBus.emit(FoundationEvents.PluginLoaded, {
      pluginId: id,
      name: record.descriptor.name,
      version: record.descriptor.version,
    })

    globalLogger.info('插件已启用', { pluginId: id, version: record.descriptor.version })
    return true
  }

  /**
   * 禁用插件
   * 流程：stop → dispose
   * @param id 插件 ID
   * @returns 是否禁用成功
   */
  async disable(id: string): Promise<boolean> {
    const record = this.plugins.get(id)
    if (!record) {
      return false
    }
    if (!record.enabled || !record.instance) {
      return true
    }

    // stop
    try {
      await record.instance.stop()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      globalLogger.error('插件 stop 失败', { pluginId: id, error: msg })
      // 即使 stop 失败也继续 dispose
    }

    // onUnload 钩子
    if (typeof record.instance.onUnload === 'function') {
      try {
        record.instance.onUnload()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        globalLogger.warn('插件 onUnload 钩子抛错', { pluginId: id, error: msg })
      }
    }

    // dispose
    try {
      record.instance.dispose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      globalLogger.error('插件 dispose 失败', { pluginId: id, error: msg })
    }

    record.instance = undefined
    record.enabled = false

    // 广播事件
    await globalEventBus.emit(FoundationEvents.PluginUnloaded, {
      pluginId: id,
      name: record.descriptor.name,
    })

    globalLogger.info('插件已禁用', { pluginId: id })
    return true
  }

  /**
   * 热重载插件
   * disable → enable，实现无停机更新（描述符保持不变，实例重建）。
   * @param id 插件 ID
   * @returns 是否重载成功
   */
  async reload(id: string): Promise<boolean> {
    const existed = this.plugins.has(id)
    if (!existed) {
      return false
    }
    globalLogger.info('开始热重载插件', { pluginId: id })
    await this.disable(id)
    const ok = await this.enable(id)
    if (ok) {
      globalLogger.info('插件热重载完成', { pluginId: id })
    }
    return ok
  }

  /**
   * 获取已实例化的插件
   * @param id 插件 ID
   */
  getPlugin(id: string): Plugin | undefined {
    const record = this.plugins.get(id)
    return record?.instance
  }

  /**
   * 列出所有已注册的插件描述符
   */
  listPlugins(): PluginDescriptor[] {
    return this.order.map(id => this.plugins.get(id)!.descriptor)
  }

  /**
   * 列出所有已启用的插件 ID
   */
  listEnabled(): string[] {
    return this.order.filter(id => this.plugins.get(id)?.enabled)
  }

  /**
   * 列出所有未启用的插件 ID
   */
  listDisabled(): string[] {
    return this.order.filter(id => !this.plugins.get(id)?.enabled)
  }

  /**
   * 检查插件的依赖是否全部已启用
   * @param id 插件 ID
   */
  hasDependency(id: string): boolean {
    const record = this.plugins.get(id)
    if (!record) return false
    const deps = record.descriptor.dependencies ?? []
    if (deps.length === 0) return true
    return deps.every(depId => {
      const dep = this.plugins.get(depId)
      return dep?.enabled === true
    })
  }

  /**
   * 拓扑排序（按依赖关系）
   * 依赖项在前，依赖方在后；同层按注册顺序稳定排列。
   * 存在循环依赖时，剩余节点按注册顺序追加。
   */
  resolveOrder(): string[] {
    const inDegree = new Map<string, number>()
    const adjacency = new Map<string, string[]>()

    for (const id of this.order) {
      inDegree.set(id, 0)
      adjacency.set(id, [])
    }

    for (const id of this.order) {
      const descriptor = this.plugins.get(id)?.descriptor
      const deps = descriptor?.dependencies ?? []
      for (const depId of deps) {
        if (this.plugins.has(depId)) {
          adjacency.get(depId)!.push(id)
          inDegree.set(id, (inDegree.get(id) ?? 0) + 1)
        } else {
          globalLogger.warn('插件依赖未注册', { pluginId: id, missingDep: depId })
        }
      }
    }

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

    if (result.length < this.order.length) {
      const remaining = this.order.filter(id => !visited.has(id))
      globalLogger.warn('插件依赖存在环，剩余插件按注册顺序追加', { remaining })
      result.push(...remaining)
    }

    return result
  }

  // ─── 内部辅助 ───────────────────────────────────

  /** 判断指定插件是否已启用 */
  private isEnabled(id: string): boolean {
    return this.plugins.get(id)?.enabled === true
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局插件管理器单例 */
export const globalPluginManager = new PluginManager()

export default globalPluginManager
