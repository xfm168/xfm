// 审计日志 —— 记录所有关键操作，预留企业版合规

// ============================================================
// 类型定义
// ============================================================

/** 单条审计日志 */
export interface AuditEntry {
  /** 日志 ID */
  id: string
  /** 时间戳（毫秒） */
  timestamp: number
  /** 用户 ID（可选） */
  userId?: string
  /** 插件 ID（可选） */
  pluginId?: string
  /** 动作（如 'rule.create'、'decision.analyze'、'plugin.enable'） */
  action: string
  /** 资源（如 'rule:GEJU-CONG-001'） */
  resource: string
  /** 附加详情 */
  details?: Record<string, any>
  /** 结果：success / failure / denied */
  result: 'success' | 'failure' | 'denied'
  /** 客户端 IP（可选） */
  ipAddress?: string
}

/** 日志查询过滤条件 */
export interface AuditFilter {
  userId?: string
  action?: string
  resource?: string
  result?: string
  since?: number
  limit?: number
}

/** 日志统计 */
export interface AuditStats {
  totalEntries: number
  byAction: Record<string, number>
  byResult: Record<string, number>
}

// ============================================================
// AuditLogger —— 审计日志记录器
// ============================================================

/** 单实例最大保留条数（防止内存膨胀） */
const MAX_ENTRIES = 10000

/** 自增 ID 计数器种子 */
let _idCounter = 0

/**
 * 审计日志记录器
 *
 * - 全部日志驻留内存（最大 ${MAX_ENTRIES} 条，超出后 FIFO 淘汰）
 * - 支持按用户/动作/资源/结果/时间过滤
 * - 支持导出为 JSON 字符串（供合规归档）
 */
export class AuditLogger {
  /** 日志条目（按时间顺序） */
  private entries: AuditEntry[] = []

  /**
   * 记录一条审计日志
   *
   * @param entry 不含 id / timestamp 的部分
   * @returns 完整的审计条目
   */
  log(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
    const full: AuditEntry = {
      ...entry,
      id: this._genId(),
      timestamp: Date.now(),
    }
    this.entries.push(full)

    // 容量限制：FIFO 淘汰最旧
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_ENTRIES)
    }
    return full
  }

  /**
   * 查询日志（带过滤）
   */
  getEntries(filter?: AuditFilter): AuditEntry[] {
    let result = this.entries.slice()

    if (filter?.userId) {
      result = result.filter((e) => e.userId === filter.userId)
    }
    if (filter?.action) {
      result = result.filter((e) => e.action === filter.action)
    }
    if (filter?.resource) {
      result = result.filter((e) => e.resource === filter.resource)
    }
    if (filter?.result) {
      result = result.filter((e) => e.result === filter.result)
    }
    if (typeof filter?.since === 'number') {
      result = result.filter((e) => e.timestamp >= filter.since!)
    }

    // 限制返回条数（取最新的 N 条）
    if (typeof filter?.limit === 'number' && filter.limit >= 0) {
      result = result.slice(-filter.limit)
    }

    return result
  }

  /**
   * 按 ID 取单条
   */
  getEntry(id: string): AuditEntry | undefined {
    return this.entries.find((e) => e.id === id)
  }

  /**
   * 计数（带过滤）
   */
  count(filter?: AuditFilter): number {
    return this.getEntries(filter).length
  }

  /**
   * 导出日志（JSON 字符串）
   */
  exportLog(filter?: AuditFilter): string {
    return JSON.stringify(
      {
        exportedAt: Date.now(),
        count: this.count(filter),
        entries: this.getEntries(filter),
      },
      null,
      2,
    )
  }

  /**
   * 清空全部日志
   */
  clear(): void {
    this.entries.length = 0
  }

  /**
   * 统计信息
   */
  getStats(): AuditStats {
    const byAction: Record<string, number> = {}
    const byResult: Record<string, number> = {}

    for (const e of this.entries) {
      byAction[e.action] = (byAction[e.action] ?? 0) + 1
      byResult[e.result] = (byResult[e.result] ?? 0) + 1
    }

    return {
      totalEntries: this.entries.length,
      byAction,
      byResult,
    }
  }

  // ----------------------------------------------------------
  // 内部辅助
  // ----------------------------------------------------------

  private _genId(): string {
    _idCounter = (_idCounter + 1) % Number.MAX_SAFE_INTEGER
    return `audit-${Date.now().toString(36)}-${_idCounter.toString(36)}`
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局审计日志记录器单例 */
export const globalAuditLogger = new AuditLogger()
