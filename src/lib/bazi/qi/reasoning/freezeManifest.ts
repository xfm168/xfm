/**
 * FreezeManifest — 冻结清单（Freeze+2）
 * 
 * 永久冻结声明文件。
 * 任何 Kernel 修改必须先检查此清单。
 */

export interface FreezeManifestEntry {
  module: string
  frozen: boolean
  version: string
  frozenDate: string
  description: string
}

/** 插件清单 */
export interface PluginManifest {
  plugin: string
  version: string
  kernel: string       // e.g. "2.x"
  rule?: string        // e.g. "1.x"
  strategy?: string
  description?: string
}

export interface FreezeManifest {
  kernel: string
  apiVersion: string       // API 版本（冻结）
  implementation: string   // 实现版本（可升级）
  kernelHash: string
  buildTime: string
  frozen: boolean
  compatibility: string
  modules: FreezeManifestEntry[]
  plugins?: PluginManifest[]
}

/** 当前冻结清单 */
export const FREEZE_MANIFEST: FreezeManifest = {
  kernel: '2.0.0',
  apiVersion: '2.0',
  implementation: '2.0.0',
  kernelHash: 'pending-hash-generation',
  buildTime: new Date().toISOString(),
  frozen: true,
  compatibility: '>=2.0.0',
  modules: [
    { module: 'Competition', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '通用竞争引擎' },
    { module: 'Context', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '推演上下文' },
    { module: 'Settlement', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '结算引擎' },
    { module: 'Explain', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '解释引擎' },
    { module: 'StateTree', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '状态树' },
    { module: 'DecisionTree', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '推理树' },
    { module: 'Strategy', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '策略接口' },
    { module: 'RuleEngine', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '规则引擎' },
    { module: 'ClassicalLibrary', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '古籍库' },
    { module: 'KernelValidator', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '内核校验器' },
    { module: 'Benchmark', frozen: true, version: '2.0.0', frozenDate: '2026-07-10', description: '基准测试' },
  ],
}

export function checkPluginCompatibility(plugin: PluginManifest): { compatible: boolean; reason?: string } {
  const apiMajor = FREEZE_MANIFEST.apiVersion.split('.')[0]
  const pluginKernelRange = plugin.kernel
  if (pluginKernelRange.includes('x')) {
    const pluginMajor = pluginKernelRange.split('.')[0]
    const kernelMajor = FREEZE_MANIFEST.kernel.split('.')[0]
    if (pluginMajor === kernelMajor) return { compatible: true }
    return { compatible: false, reason: `Kernel major version mismatch: plugin expects ${pluginKernelRange}, kernel is ${FREEZE_MANIFEST.kernel}` }
  }
  return { compatible: true }
}

/**
 * 检查模块是否已冻结
 */
export function isModuleFrozen(moduleName: string): boolean {
  const entry = FREEZE_MANIFEST.modules.find(m => m.module === moduleName)
  return entry?.frozen ?? false
}

/**
 * 获取 Kernel 版本信息
 */
export function getKernelVersion(): string {
  return FREEZE_MANIFEST.kernel
}
