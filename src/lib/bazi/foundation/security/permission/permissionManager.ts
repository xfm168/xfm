// 权限管理器 —— 预留企业版权限控制
// 角色 + 资源 + 操作 三维权限模型

// ============================================================
// 类型定义
// ============================================================

/** 权限操作枚举 */
export type Permission = 'read' | 'write' | 'execute' | 'admin' | 'delete'

/** 资源类型枚举 */
export type Resource =
  | 'rule'
  | 'case'
  | 'classic'
  | 'decision'
  | 'plugin'
  | 'config'
  | 'quality'
  | 'migration'
  | 'system'

/** 角色枚举 */
export type Role = 'admin' | 'developer' | 'reviewer' | 'user' | 'guest' | 'plugin'

/** 单条权限规则 */
export interface PermissionRule {
  /** 角色 */
  role: Role
  /** 资源 */
  resource: Resource
  /** 允许的操作列表 */
  permissions: Permission[]
  /** 显式拒绝（优先级高于 permissions） */
  denied?: Permission[]
}

/** 权限上下文 */
export interface PermissionContext {
  /** 当前角色 */
  role: Role
  /** 用户 ID（可选） */
  userId?: string
  /** 插件 ID（可选，仅 role=plugin） */
  pluginId?: string
  /** 来源标识 */
  source?: string
}

// ============================================================
// 默认权限规则表
// ============================================================

const ALL_RESOURCES: Resource[] = [
  'rule', 'case', 'classic', 'decision', 'plugin', 'config', 'quality', 'migration', 'system',
]

const ALL_PERMISSIONS: Permission[] = ['read', 'write', 'execute', 'admin', 'delete']

/**
 * 默认权限规则（企业版可覆盖）
 *
 * 设计原则：
 *   - admin：全权
 *   - developer：可写规则 / 命例 / 配置，不可写 system / plugin
 *   - reviewer：可读规则 / 命例 / 典籍，可写 quality（审核结论）
 *   - user：仅执行决策、查看命例与典籍
 *   - guest：只能看典籍
 *   - plugin：受限读权限（插件沙箱）
 */
export const DEFAULT_PERMISSION_RULES: PermissionRule[] = [
  // admin: 全资源全权限
  ...ALL_RESOURCES.map((resource): PermissionRule => ({
    role: 'admin',
    resource,
    permissions: [...ALL_PERMISSIONS],
  })),

  // developer
  { role: 'developer', resource: 'rule', permissions: ['read', 'write'] },
  { role: 'developer', resource: 'case', permissions: ['read', 'write'] },
  { role: 'developer', resource: 'classic', permissions: ['read'] },
  { role: 'developer', resource: 'decision', permissions: ['execute'] },
  { role: 'developer', resource: 'quality', permissions: ['read'] },
  { role: 'developer', resource: 'config', permissions: ['read', 'write'] },

  // reviewer
  { role: 'reviewer', resource: 'rule', permissions: ['read'] },
  { role: 'reviewer', resource: 'case', permissions: ['read'] },
  { role: 'reviewer', resource: 'classic', permissions: ['read'] },
  { role: 'reviewer', resource: 'quality', permissions: ['read', 'write', 'execute'] },

  // user
  { role: 'user', resource: 'decision', permissions: ['execute'] },
  { role: 'user', resource: 'case', permissions: ['read'] },
  { role: 'user', resource: 'classic', permissions: ['read'] },

  // guest
  { role: 'guest', resource: 'classic', permissions: ['read'] },

  // plugin
  { role: 'plugin', resource: 'rule', permissions: ['read'] },
  { role: 'plugin', resource: 'case', permissions: ['read'] },
  { role: 'plugin', resource: 'classic', permissions: ['read'] },
  { role: 'plugin', resource: 'config', permissions: ['read'] },
]

// ============================================================
// PermissionManager —— 权限管理器
// ============================================================

/**
 * 权限管理器
 *
 * 角色 × 资源 × 操作 三维权限模型：
 *   - granted：在 PermissionRule.permissions 中
 *   - denied：在 PermissionRule.denied 中（优先于 granted）
 *   - 默认拒绝：无规则即拒绝
 */
export class PermissionManager {
  /** 权限规则表 */
  private rules: PermissionRule[] = []

  constructor() {
    for (const r of DEFAULT_PERMISSION_RULES) {
      this.rules.push({
        role: r.role,
        resource: r.resource,
        permissions: [...r.permissions],
        denied: r.denied ? [...r.denied] : undefined,
      })
    }
  }

  /**
   * 检查某上下文是否对资源具备指定操作权限
   */
  check(
    ctx: PermissionContext,
    resource: Resource,
    permission: Permission,
  ): boolean {
    const rule = this._findRule(ctx.role, resource)
    if (!rule) return false

    // denied 优先
    if (rule.denied && rule.denied.includes(permission)) {
      return false
    }
    return rule.permissions.includes(permission)
  }

  /**
   * 授予某 (角色, 资源) 一组操作；不存在规则则新建
   */
  grant(role: Role, resource: Resource, ...permissions: Permission[]): void {
    let rule = this._findRule(role, resource)
    if (!rule) {
      rule = { role, resource, permissions: [] }
      this.rules.push(rule)
    }
    for (const p of permissions) {
      if (!rule.permissions.includes(p)) {
        rule.permissions.push(p)
      }
      // 同时从 denied 中移除（如果存在）
      if (rule.denied && rule.denied.includes(p)) {
        rule.denied = rule.denied.filter((x) => x !== p)
        if (rule.denied.length === 0) rule.denied = undefined
      }
    }
  }

  /**
   * 撤销某 (角色, 资源) 的一组操作
   */
  revoke(role: Role, resource: Resource, ...permissions: Permission[]): void {
    const rule = this._findRule(role, resource)
    if (!rule) return
    rule.permissions = rule.permissions.filter((p) => !permissions.includes(p))
  }

  /**
   * 查询某 (角色, 资源) 当前允许的操作列表
   */
  getPermissions(role: Role, resource: Resource): Permission[] {
    const rule = this._findRule(role, resource)
    if (!rule) return []
    const denied = new Set(rule.denied ?? [])
    return rule.permissions.filter((p) => !denied.has(p))
  }

  /**
   * 列出所有角色
   */
  getRoles(): Role[] {
    const set = new Set<Role>()
    for (const r of this.rules) set.add(r.role)
    return Array.from(set)
  }

  /**
   * 列出全部规则（深拷贝，避免外部修改）
   */
  listRules(): PermissionRule[] {
    return this.rules.map((r) => ({
      role: r.role,
      resource: r.resource,
      permissions: [...r.permissions],
      denied: r.denied ? [...r.denied] : undefined,
    }))
  }

  // ----------------------------------------------------------
  // 内部辅助
  // ----------------------------------------------------------

  private _findRule(role: Role, resource: Resource): PermissionRule | undefined {
    return this.rules.find((r) => r.role === role && r.resource === resource)
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局权限管理器单例 */
export const globalPermissionManager = new PermissionManager()
