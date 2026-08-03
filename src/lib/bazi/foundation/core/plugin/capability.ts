/**
 * P0-5 最终预冻结 — 插件能力声明（Plugin Capability）
 *
 * 系统自动识别插件能力范围，便于能力检索、依赖校验与路由分发。
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 能力类型与声明
// ============================================================

// 插件能力声明 —— 系统自动识别插件能力范围
export type PluginCapability =
  | 'bazi' | 'ziwei' | 'qimen' | 'liuyao' | 'fengshui'  // 术数类型
  | 'knowledge' | 'quality' | 'rule' | 'decision'         // 系统能力
  | 'case-db' | 'classic-db' | 'rule-db'                  // 数据库
  | 'explain' | 'ai' | 'benchmark'                        // 辅助能力

export interface PluginCapabilityDeclaration {
  pluginId: string
  capabilities: PluginCapability[]
  // 每个能力的详细描述
  details?: Record<PluginCapability, { description?: string; version?: string }>
}

// ============================================================
// 能力注册表
// ============================================================

/**
 * 能力注册表
 * 集中管理所有插件的能力声明，支持按能力反查插件、依赖校验等。
 */
export class CapabilityRegistry {
  /** pluginId → 能力声明 */
  private declarations = new Map<string, PluginCapabilityDeclaration>()

  /**
   * 注册插件能力声明
   * 同一 pluginId 重复注册将覆盖旧声明。
   */
  register(declaration: PluginCapabilityDeclaration): void {
    this.declarations.set(declaration.pluginId, declaration)
  }

  /**
   * 注销插件能力声明
   */
  unregister(pluginId: string): void {
    this.declarations.delete(pluginId)
  }

  /**
   * 检查插件是否具备指定能力
   */
  hasCapability(pluginId: string, capability: PluginCapability): boolean {
    const decl = this.declarations.get(pluginId)
    if (!decl) return false
    return decl.capabilities.includes(capability)
  }

  /**
   * 按能力反查所有具备该能力的插件 ID
   */
  getPluginsByCapability(capability: PluginCapability): string[] {
    const result: string[] = []
    for (const decl of this.declarations.values()) {
      if (decl.capabilities.includes(capability)) {
        result.push(decl.pluginId)
      }
    }
    return result
  }

  /**
   * 获取插件声明的全部能力
   */
  getCapabilities(pluginId: string): PluginCapability[] {
    const decl = this.declarations.get(pluginId)
    if (!decl) return []
    return [...decl.capabilities]
  }

  /**
   * 获取所有插件的能力声明
   */
  getAllDeclarations(): PluginCapabilityDeclaration[] {
    return Array.from(this.declarations.values())
  }

  /**
   * 检查插件是否满足所需能力
   * @returns satisfied 是否全部满足；missing 缺失的能力列表
   */
  canSatisfy(
    pluginId: string,
    required: PluginCapability[],
  ): { satisfied: boolean; missing: PluginCapability[] } {
    const owned = this.getCapabilities(pluginId)
    const missing = required.filter(c => !owned.includes(c))
    return { satisfied: missing.length === 0, missing }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局能力注册表单例 */
export const globalCapabilityRegistry = new CapabilityRegistry()
