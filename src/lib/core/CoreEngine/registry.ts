import type { CoreEngine, CoreEngineConfig, ModuleType } from './types'

/**
 * CoreEngine 注册表
 * 每个命理模块（八字/紫微/奇门...）注册自己的 CoreEngine 实现
 * 应用启动时根据模块类型获取对应引擎
 */

const engineRegistry = new Map<ModuleType, () => CoreEngine>()
const activeEngines = new Map<ModuleType, CoreEngine>()

/** 注册模块引擎工厂 */
export function registerEngine(module: ModuleType, factory: () => CoreEngine): void {
  engineRegistry.set(module, factory)
}

/** 获取模块引擎（单例，首次获取时创建） */
export function getEngine(module: ModuleType): CoreEngine {
  let engine = activeEngines.get(module)
  if (engine) return engine
  const factory = engineRegistry.get(module)
  if (!factory) {
    throw new Error(`[CoreEngine] 模块 "${module}" 未注册。请先调用 registerEngine('${module}', factory)`)
  }
  engine = factory()
  activeEngines.set(module, engine)
  return engine
}

/** 检查模块是否已注册 */
export function hasEngine(module: ModuleType): boolean {
  return engineRegistry.has(module)
}

/** 列出所有已注册模块 */
export function listEngines(): ModuleType[] {
  return Array.from(engineRegistry.keys())
}

/** 销毁指定模块引擎 */
export function disposeEngine(module: ModuleType): void {
  const engine = activeEngines.get(module)
  if (engine?.dispose) engine.dispose()
  activeEngines.delete(module)
}

/** 销毁所有引擎 */
export function disposeAllEngines(): void {
  for (const module of activeEngines.keys()) {
    disposeEngine(module)
  }
}
