// API 版本管理 —— 支持 v1/v2/v3 多版本共存与兼容

// ============================================================
// 类型定义
// ============================================================

/**
 * API 版本号
 *
 * v1 ~ v5 当前已注册；后续可扩展。
 */
export type APIVersion = 'v1' | 'v2' | 'v3' | 'v4' | 'v5'

/**
 * 版本生命周期状态
 *   - active     当前活跃版本
 *   - deprecated 已弃用但仍可用（建议用户迁移）
 *   - sunset     即将下线（已发布 sunset 日期）
 *   - retired    已下线（不再提供）
 */
export type APIVersionStatus = 'active' | 'deprecated' | 'sunset' | 'retired'

/**
 * 单个 API 版本的元信息
 */
export interface APIVersionInfo {
  /** 版本号 */
  version: APIVersion
  /** 基础路径，如 '/api/v1' */
  basePath: string
  /** 生命周期状态 */
  status: APIVersionStatus
  /** 发布时间戳（ms），可选 */
  releasedAt?: number
  /** 弃用时间戳（ms），可选 */
  deprecatedAt?: number
  /** 下线日期时间戳（ms），可选 */
  sunsetAt?: number
  /** 退役时间戳（ms），可选 */
  retiredAt?: number
  /** 破坏性变更列表 */
  breakingChanges?: string[]
  /** 迁移指南（文本 / URL） */
  migrationGuide?: string
}

/**
 * API 版本管理配置
 */
export interface APIVersionConfig {
  /** 当前最新版本 */
  current: APIVersion
  /** 仍受支持的版本列表 */
  supported: APIVersion[]
  /** 默认版本（未指定时使用的版本） */
  defaultVersion: APIVersion
  /** 下线前提前通知天数（默认 90 天） */
  sunsetNoticeDays: number
}

// ============================================================
// APIVersionManager 类
// ============================================================

/**
 * API 版本管理器
 *
 * 用于多版本 API 共存场景：
 *   - 注册 / 查询 / 弃用 / 退役 版本
 *   - 解析客户端传入的版本字符串
 *   - 生成迁移路径与破坏性变更清单
 */
export class APIVersionManager {
  /** 版本 → 版本信息 */
  private versions = new Map<APIVersion, APIVersionInfo>()

  /** 全局配置 */
  private config: APIVersionConfig

  constructor(config?: Partial<APIVersionConfig>) {
    this.config = {
      current: 'v5',
      supported: ['v4', 'v5'],
      defaultVersion: 'v5',
      sunsetNoticeDays: 90,
      ...config,
    }
  }

  // ============================================================
  // 注册 / 查询
  // ============================================================

  /**
   * 注册一个版本
   */
  registerVersion(info: APIVersionInfo): void {
    this.versions.set(info.version, info)
  }

  /**
   * 获取版本信息
   */
  getVersion(version: APIVersion): APIVersionInfo | undefined {
    return this.versions.get(version)
  }

  /**
   * 获取所有活跃版本（active + deprecated + sunset 都算可用，retired 排除）
   */
  getActiveVersions(): APIVersionInfo[] {
    const out: APIVersionInfo[] = []
    for (const v of this.versions.values()) {
      if (v.status !== 'retired') out.push(v)
    }
    return out
  }

  /**
   * 是否仍受支持（不在 supported 列表中 / 已 retired → false）
   */
  isSupported(version: APIVersion): boolean {
    const info = this.versions.get(version)
    if (!info) return false
    if (info.status === 'retired') return false
    return this.config.supported.includes(version)
  }

  /**
   * 是否已弃用（deprecated / sunset 都算）
   */
  isDeprecated(version: APIVersion): boolean {
    const info = this.versions.get(version)
    if (!info) return false
    return info.status === 'deprecated' || info.status === 'sunset'
  }

  /**
   * 弃用某个版本
   *
   * @param version  版本号
   * @param sunsetAt 下线日期时间戳（可选，默认从 now+sunsetNoticeDays 推算）
   */
  deprecate(version: APIVersion, sunsetAt?: number): void {
    const info = this.versions.get(version)
    if (!info) return
    info.status = 'deprecated'
    info.deprecatedAt = info.deprecatedAt ?? Date.now()
    info.sunsetAt = sunsetAt ?? info.sunsetAt ?? (Date.now() + this.config.sunsetNoticeDays * 24 * 3600 * 1000)
  }

  /**
   * 退役某个版本
   */
  retire(version: APIVersion): void {
    const info = this.versions.get(version)
    if (!info) return
    info.status = 'retired'
    info.retiredAt = info.retiredAt ?? Date.now()
  }

  /**
   * 获取当前活跃版本
   */
  getCurrent(): APIVersionInfo {
    const cur = this.versions.get(this.config.current)
    if (cur) return cur
    // 兜底：找不到时返回一个最简形态
    return {
      version: this.config.current,
      basePath: `/api/${this.config.current}`,
      status: 'active',
      releasedAt: 0,
    }
  }

  /**
   * 解析客户端传入的版本字符串 → 规范化 APIVersion
   *
   * 接受：
   *   - 'v1' / 'v2' / ...（带 v 前缀）
   *   - '1' / '2' / ...（纯数字）
   *   - 'V1' / 'V2'（大写）
   *   - '/api/v1'（路径形式）
   *
   * 未匹配时回退到 defaultVersion。
   */
  resolveVersion(version: string): APIVersion {
    if (!version) return this.config.defaultVersion
    // 去掉前导路径
    const cleaned = version.replace(/^\/api\//i, '').replace(/^V/i, 'v')
    // 已是 v1/v2...
    if (/^v\d+$/.test(cleaned)) {
      return cleaned as APIVersion
    }
    // 纯数字 → 加 v
    if (/^\d+$/.test(cleaned)) {
      return `v${cleaned}` as APIVersion
    }
    return this.config.defaultVersion
  }

  /**
   * 计算两个版本之间的迁移路径
   *
   * @param from 起始版本
   * @param to   目标版本
   * @returns 步骤列表 + 起始版本之后的所有破坏性变更
   */
  getMigrationPath(
    from: APIVersion,
    to: APIVersion,
  ): { steps: string[]; breakingChanges: string[] } {
    const steps: string[] = []
    const breakingChanges: string[] = []

    const order: APIVersion[] = ['v1', 'v2', 'v3', 'v4', 'v5']
    const fromIdx = order.indexOf(from)
    const toIdx = order.indexOf(to)
    if (fromIdx === -1 || toIdx === -1) {
      return { steps, breakingChanges }
    }

    if (fromIdx === toIdx) {
      steps.push(`已是 ${from} 版本，无需迁移`)
      return { steps, breakingChanges }
    }

    if (fromIdx < toIdx) {
      // 升级
      for (let i = fromIdx; i < toIdx; i += 1) {
        const cur = order[i]
        const next = order[i + 1]
        steps.push(`升级 ${cur} → ${next}`)
        const nextInfo = this.versions.get(next)
        if (nextInfo?.breakingChanges) {
          breakingChanges.push(...nextInfo.breakingChanges)
        }
      }
    } else {
      // 降级
      for (let i = fromIdx; i > toIdx; i -= 1) {
        const cur = order[i]
        const prev = order[i - 1]
        steps.push(`降级 ${cur} → ${prev}（注意：降级可能丢失新特性数据）`)
        const curInfo = this.versions.get(cur)
        if (curInfo?.breakingChanges) {
          breakingChanges.push(...curInfo.breakingChanges)
        }
      }
    }

    return { steps, breakingChanges }
  }

  /**
   * 获取全局配置
   */
  getVersionConfig(): APIVersionConfig {
    return { ...this.config, supported: [...this.config.supported] }
  }
}

// ============================================================
// 全局单例 + 预注册 v1 ~ v5
// ============================================================

const DAY_MS = 24 * 3600 * 1000

export const globalAPIVersionManager = new APIVersionManager()

// v1：已退役（最初版本）
globalAPIVersionManager.registerVersion({
  version: 'v1',
  basePath: '/api/v1',
  status: 'retired',
  releasedAt: 0,
  retiredAt: Date.now() - 365 * DAY_MS,
  breakingChanges: ['初版接口形态'],
})

// v2：已退役
globalAPIVersionManager.registerVersion({
  version: 'v2',
  basePath: '/api/v2',
  status: 'retired',
  releasedAt: Date.now() - 400 * DAY_MS,
  retiredAt: Date.now() - 180 * DAY_MS,
  breakingChanges: ['重构 Decision API 字段命名'],
})

// v3：sunset（已发布下线日期）
globalAPIVersionManager.registerVersion({
  version: 'v3',
  basePath: '/api/v3',
  status: 'sunset',
  releasedAt: Date.now() - 300 * DAY_MS,
  deprecatedAt: Date.now() - 30 * DAY_MS,
  sunsetAt: Date.now() + 60 * DAY_MS,
  breakingChanges: ['Rule Runtime API 形态变更'],
  migrationGuide: '请参考 v3→v4 迁移指南：升级 rule.load → rule.runtime.load',
})

// v4：deprecated（刚弃用）
globalAPIVersionManager.registerVersion({
  version: 'v4',
  basePath: '/api/v4',
  status: 'deprecated',
  releasedAt: Date.now() - 120 * DAY_MS,
  deprecatedAt: Date.now() - 10 * DAY_MS,
  breakingChanges: ['API 三层隔离（internal/public/plugin）'],
  migrationGuide: '请参考 v4→v5 迁移指南：增加 X-Plugin-Id 头部',
})

// v5：当前活跃版本
globalAPIVersionManager.registerVersion({
  version: 'v5',
  basePath: '/api/v5',
  status: 'active',
  releasedAt: Date.now() - 30 * DAY_MS,
  breakingChanges: [],
  migrationGuide: '当前版本，无需迁移',
})
