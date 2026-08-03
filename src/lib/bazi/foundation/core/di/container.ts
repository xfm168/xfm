/**
 * P0-5A Foundation Core — 依赖注入容器（DI Container）
 *
 * Foundation 系统的服务注册与解析中枢。
 *
 * 设计原则：
 *   - 生命周期管理：支持 singleton（单例）/ transient（瞬态）/ scoped（作用域）
 *   - 惰性解析：singleton 注册时仅存 resolver，首次 resolve 时才实例化并缓存
 *   - 安全返回：使用 Result/Option 类型，避免直接抛错
 *   - 标签检索：支持按 tags 批量查询注册项
 *   - 作用域隔离：beginScope/endScope 配合 scoped 生命周期实现请求级缓存
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 *
 * Core 7件事 之 6：依赖注入（Dependency Injection）
 */

import { Result, Ok, Err, Option, Some, None } from '../../shared/kernel/types'

// ============================================================
// 类型定义
// ============================================================

/**
 * 服务解析器函数：返回服务实例
 */
export type Resolver<T = any> = () => T

/**
 * 服务生命周期
 * - singleton：全局单例，首次 resolve 后缓存，后续复用
 * - transient：瞬态，每次 resolve 都重新执行 resolver
 * - scoped：作用域单例，同一 scope 内复用，endScope 时清除
 */
export type ServiceLifetime = 'singleton' | 'transient' | 'scoped'

/**
 * 服务注册项
 */
export interface ServiceRegistration<T = any> {
  /** 服务唯一标识 key */
  key: string
  /** 生命周期 */
  lifetime: ServiceLifetime
  /** 解析器函数 */
  resolver: Resolver<T>
  /** singleton 缓存的实例（首次 resolve 后填充） */
  instance?: T
  /** 标签数组，用于按标签批量查询 */
  tags: string[]
  /** 可选描述信息 */
  description?: string
}

// ============================================================
// DIContainer 类
// ============================================================

/**
 * 依赖注入容器
 *
 * @example
 * import { globalDIContainer } from '@/lib/bazi/foundation/core'
 *
 * // 注册单例（惰性）
 * globalDIContainer.register('myService', () => new MyService(), 'singleton', ['core'], '我的服务')
 *
 * // 注册已存在实例（立即缓存）
 * globalDIContainer.registerSingleton('config', configObj, ['config'])
 *
 * // 解析（安全 Result 返回）
 * const result = globalDIContainer.resolve<MyService>('myService')
 * if (result.isOk()) {
 *   result.value.doSomething()
 * }
 *
 * // 作用域使用
 * globalDIContainer.beginScope()
 * const scopedSvc = globalDIContainer.resolveOrThrow('requestSvc')
 * globalDIContainer.endScope()
 */
export class DIContainer {
  /** 服务注册表：key → 注册项 */
  private registry = new Map<string, ServiceRegistration>()
  /** 作用域缓存：key → 实例，用于 scoped 生命周期 */
  private scopeCache = new Map<string, any>()
  /** 当前是否处于 scope 中 */
  private inScope = false

  /**
   * 注册服务
   * @param key 服务唯一标识
   * @param resolver 解析器函数
   * @param lifetime 生命周期，默认 singleton
   * @param tags 标签数组
   * @param description 描述信息
   */
  register<T>(
    key: string,
    resolver: Resolver<T>,
    lifetime: ServiceLifetime = 'singleton',
    tags: string[] = [],
    description?: string,
  ): void {
    this.registry.set(key, {
      key,
      lifetime,
      resolver,
      tags,
      description,
    })
  }

  /**
   * 注册单例（直接提供实例，不走惰性解析）
   * @param key 服务唯一标识
   * @param instance 已存在的实例
   * @param tags 标签数组
   * @param description 描述信息
   */
  registerSingleton<T>(key: string, instance: T, tags: string[] = [], description?: string): void {
    this.registry.set(key, {
      key,
      lifetime: 'singleton',
      resolver: () => instance,
      instance,
      tags,
      description,
    })
  }

  /**
   * 注册工厂（transient 别名：每次 resolve 都重新创建）
   * @param key 服务唯一标识
   * @param resolver 工厂解析器
   * @param tags 标签数组
   * @param description 描述信息
   */
  registerFactory<T>(key: string, resolver: Resolver<T>, tags: string[] = [], description?: string): void {
    this.register(key, resolver, 'transient', tags, description)
  }

  /**
   * 解析服务，返回 Result 类型
   * - singleton：首次调用执行 resolver 并缓存实例，后续复用
   * - transient：每次调用都重新执行 resolver
   * - scoped：同一 scope 内复用缓存，scope 外行为同 singleton
   * @param key 服务唯一标识
   * @returns Ok<T> 解析成功；Err<string> 未注册
   */
  resolve<T>(key: string): Result<T, string> {
    const reg = this.registry.get(key)
    if (!reg) {
      return Err(`DI 容器中未找到服务: ${key}`)
    }

    switch (reg.lifetime) {
      case 'singleton':
        if (reg.instance === undefined) {
          reg.instance = reg.resolver()
        }
        return Ok(reg.instance as T)

      case 'transient':
        return Ok(reg.resolver() as T)

      case 'scoped':
        if (this.inScope) {
          if (!this.scopeCache.has(key)) {
            this.scopeCache.set(key, reg.resolver())
          }
          return Ok(this.scopeCache.get(key) as T)
        } else {
          if (reg.instance === undefined) {
            reg.instance = reg.resolver()
          }
          return Ok(reg.instance as T)
        }

      default:
        return Err(`未知的服务生命周期: ${(reg as ServiceRegistration).lifetime}`)
    }
  }

  /**
   * 解析服务，失败则直接抛错
   * 适用于确定服务必然已注册的场景
   * @param key 服务唯一标识
   * @throws Error 当服务未注册时抛出
   */
  resolveOrThrow<T>(key: string): T {
    const result = this.resolve<T>(key)
    if (result.isErr()) {
      throw new Error(result.error)
    }
    return result.value
  }

  /**
   * 尝试解析服务，返回 Option 类型
   * @param key 服务唯一标识
   * @returns Some<T> 解析成功；None 未注册
   */
  tryResolve<T>(key: string): Option<T> {
    const result = this.resolve<T>(key)
    if (result.isOk()) {
      return Some(result.value)
    }
    return None
  }

  /**
   * 检查服务是否已注册
   * @param key 服务唯一标识
   */
  has(key: string): boolean {
    return this.registry.has(key)
  }

  /**
   * 注销服务
   * @param key 服务唯一标识
   */
  unregister(key: string): void {
    this.registry.delete(key)
    this.scopeCache.delete(key)
  }

  /**
   * 清空所有注册和缓存
   */
  clear(): void {
    this.registry.clear()
    this.scopeCache.clear()
    this.inScope = false
  }

  /**
   * 按标签查找所有匹配的注册项
   * @param tag 标签
   * @returns { key, registration } 数组
   */
  findByTag(tag: string): { key: string; registration: ServiceRegistration }[] {
    const result: { key: string; registration: ServiceRegistration }[] = []
    for (const [key, reg] of this.registry.entries()) {
      if (reg.tags.includes(tag)) {
        result.push({ key, registration: { ...reg } })
      }
    }
    return result
  }

  /**
   * 列出所有注册项的概览信息
   */
  list(): { key: string; lifetime: ServiceLifetime; tags: string[]; hasInstance: boolean }[] {
    const result: { key: string; lifetime: ServiceLifetime; tags: string[]; hasInstance: boolean }[] = []
    for (const [key, reg] of this.registry.entries()) {
      result.push({
        key,
        lifetime: reg.lifetime,
        tags: [...reg.tags],
        hasInstance: reg.instance !== undefined,
      })
    }
    return result
  }

  /**
   * 开启作用域
   * scoped 生命周期的服务将在当前 scope 内复用实例
   */
  beginScope(): void {
    this.scopeCache.clear()
    this.inScope = true
  }

  /**
   * 结束作用域
   * 清空 scoped 缓存，退出 scope 状态
   */
  endScope(): void {
    this.scopeCache.clear()
    this.inScope = false
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局 DI 容器单例 */
export const globalDIContainer = new DIContainer()

export default globalDIContainer
