/**
 * P0-10 Migration Manager — 规则版本迁移管理器
 *
 * 管理规则数据的跨版本迁移链，确保规则格式随系统升级平滑演进。
 *
 * 核心设计：
 *   1. MigrationStep：单一版本跃迁（from → to），每个 Step 封装一个 MigrationFn
 *   2. 链式迁移：按注册顺序匹配 fromVersion，逐步跃迁到目标版本
 *   3. 迁移记录：每次 migrate() 产生 MigrationRecord（时间、数量、失败列表）
 *   4. 预注册 5 个示例迁移：v1.0.0 → v1.1.0 → v2.0.0 → v2.1.0 → v3.0.0 → v3.1.0
 *
 * 七层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 类型定义
// ============================================================

/**
 * 迁移执行记录
 *
 * 描述一次 migrate() 调用的完整执行信息，供审计与回滚参考。
 */
export interface MigrationRecord {
  /** 迁移起始版本（规则当前版本） */
  fromVersion: string
  /** 迁移目标版本 */
  toVersion: string
  /** 迁移描述（聚合多个 Step 的描述） */
  description: string
  /** 应用时间戳（ms） */
  appliedAt: number
  /** 参与迁移的规则总数 */
  ruleCount: number
  /** 迁移成功的规则数 */
  successCount: number
  /** 迁移失败的规则 ID 列表 */
  failedRules: string[]
}

/**
 * 迁移函数类型
 *
 * 输入一批规则，输出迁移后的规则 + 失败规则 ID 列表。
 * 单个 Step 对应一个 MigrationFn。
 */
export type MigrationFn = (rules: any[]) => { rules: any[]; failed: string[] }

/**
 * 单个迁移步骤
 *
 * 描述一次 fromVersion → toVersion 的版本跃迁。
 */
export interface MigrationStep {
  /** 起始版本 */
  fromVersion: string
  /** 目标版本 */
  toVersion: string
  /** 迁移函数 */
  fn: MigrationFn
  /** 迁移描述 */
  description: string
}

// ============================================================
// MigrationManager 类
// ============================================================

/**
 * 规则版本迁移管理器
 *
 * 使用方式：
 *   const mgr = new MigrationManager()
 *   mgr.registerMigration('1.0.0', '1.1.0', fn, 'rename score→priority')
 *   const { rules, failedRules } = mgr.migrate(oldRules, '3.1.0')
 */
export class MigrationManager {
  /** 已注册的迁移步骤列表（按注册顺序） */
  private steps: MigrationStep[] = []

  /** 历史迁移记录（每次 migrate 调用追加） */
  private history: MigrationRecord[] = []

  // ============================================================
  // 注册迁移步骤
  // ============================================================

  /**
   * 注册一个迁移步骤 fromVersion → toVersion
   *
   * @param fromVersion 起始版本
   * @param toVersion   目标版本
   * @param fn          迁移函数
   * @param description 迁移描述（可选，默认为 "fromVersion → toVersion"）
   */
  registerMigration(
    fromVersion: string,
    toVersion: string,
    fn: MigrationFn,
    description?: string,
  ): void {
    this.steps.push({
      fromVersion,
      toVersion,
      fn,
      description: description ?? `${fromVersion} → ${toVersion}`,
    })
  }

  // ============================================================
  // 批量迁移
  // ============================================================

  /**
   * 批量迁移一批规则到目标版本
   *
   * 迁移策略：
   *   - 对每条规则，按注册顺序匹配 fromVersion 等于当前规则版本的 Step
   *   - 连续应用所有匹配的 Step，直到规则.version === targetVersion
   *   - 若单条规则某个 Step 失败，该规则进入 failedRules，不再继续后续迁移
   *
   * @param rules         原始规则数组
   * @param targetVersion 目标版本号
   * @returns 迁移后的规则、历史记录、失败规则 ID
   */
  migrate(
    rules: any[],
    targetVersion: string,
  ): { rules: any[]; history: MigrationRecord[]; failedRules: string[] } {
    const appliedAt = Date.now()
    const migratedRules: any[] = []
    const allFailedRules: string[] = []
    let maxFromVersion = ''
    const descriptions: string[] = []

    // 逐条规则迁移
    for (const rule of rules) {
      const result = this.migrateOne(rule, targetVersion)
      if (result.success) {
        migratedRules.push(result.rule)
      } else {
        migratedRules.push(rule)
        if (rule?.id) allFailedRules.push(rule.id)
      }
      // 记录最大 fromVersion（用于 MigrationRecord）
      const curVer = rule?.version ?? 'unknown'
      if (!maxFromVersion || this.compareVersion(curVer, maxFromVersion) < 0) {
        maxFromVersion = curVer
      }
    }

    // 聚合 descriptions（取所有经过的 Step）
    for (const step of this.steps) {
      descriptions.push(step.description)
    }

    const record: MigrationRecord = {
      fromVersion: maxFromVersion,
      toVersion: targetVersion,
      description: descriptions.join(' | '),
      appliedAt,
      ruleCount: rules.length,
      successCount: rules.length - allFailedRules.length,
      failedRules: allFailedRules,
    }
    this.history.push(record)

    return {
      rules: migratedRules,
      history: this.history.slice(),
      failedRules: allFailedRules,
    }
  }

  // ============================================================
  // 单条规则迁移
  // ============================================================

  /**
   * 迁移单条规则到目标版本
   *
   * 循环：找到 fromVersion === rule.version 的 Step，应用 → 更新 rule.version
   * 直到没有匹配 Step 或达到 targetVersion。
   *
   * @param rule          单条规则
   * @param targetVersion 目标版本号
   * @returns 迁移后的 rule、成功与否、经过的版本路径
   */
  migrateOne(
    rule: any,
    targetVersion: string,
  ): { rule: any; success: boolean; path: string[] } {
    const path: string[] = [rule?.version ?? 'unknown']
    let current = rule ? { ...rule } : rule
    let success = true

    // 最多执行 steps.length 次，防止死循环
    let guard = 0
    const maxGuard = this.steps.length + 1

    while (guard < maxGuard) {
      guard += 1
      const currentVersion = current?.version
      if (currentVersion === targetVersion) break

      // 找第一个 fromVersion 匹配的 Step
      const step = this.steps.find(s => s.fromVersion === currentVersion)
      if (!step) break

      // 应用迁移函数（包装单条规则为数组以复用 MigrationFn）
      try {
        const wrapResult = step.fn([current])
        if (wrapResult.failed.length > 0) {
          success = false
          break
        }
        if (wrapResult.rules.length > 0) {
          current = wrapResult.rules[0]
          // 强制更新 version 为 step.toVersion，确保链路推进
          if (current) current.version = step.toVersion
        }
        path.push(step.toVersion)
      } catch {
        success = false
        break
      }
    }

    return { rule: current, success, path }
  }

  // ============================================================
  // 查询接口
  // ============================================================

  /**
   * 列出所有已注册的迁移步骤
   */
  listMigrations(): MigrationStep[] {
    return this.steps.slice()
  }

  /**
   * 获取历史迁移记录
   */
  getHistory(): MigrationRecord[] {
    return this.history.slice()
  }

  /**
   * 获取最高的 toVersion
   *
   * 当 targetVersion 传空时，可直接用 getLatestVersion() 作为目标版本。
   */
  getLatestVersion(): string {
    if (this.steps.length === 0) return ''
    let latest = this.steps[0].toVersion
    for (const step of this.steps) {
      if (this.compareVersion(step.toVersion, latest) > 0) {
        latest = step.toVersion
      }
    }
    return latest
  }

  // ============================================================
  // 内部辅助
  // ============================================================

  /**
   * 简单的语义化版本比较（仅支持 x.y.z 纯数字段）
   * 返回：<0 表示 a<b，=0 相等，>0 a>b
   */
  private compareVersion(a: string, b: string): number {
    const toArr = (v: string): number[] =>
      v.split('.').map(n => Number.parseInt(n, 10) || 0)
    const arrA = toArr(a)
    const arrB = toArr(b)
    const len = Math.max(arrA.length, arrB.length)
    for (let i = 0; i < len; i += 1) {
      const x = arrA[i] ?? 0
      const y = arrB[i] ?? 0
      if (x !== y) return x - y
    }
    return 0
  }
}

// ============================================================
// 预注册的 5 个示例迁移步骤
// ============================================================

/**
 * 构造并预注册了 5 个示例迁移的全局迁移管理器
 *
 * 迁移链：
 *   v1.0.0 → v1.1.0  score → priority
 *   v1.1.0 → v2.0.0  source 字符串 → 数组
 *   v2.0.0 → v2.1.0  补 tags: []
 *   v2.1.0 → v3.0.0  conflictPolicy → conflictStrategy
 *   v3.0.0 → v3.1.0  补 confidence: { components: {} }
 */
export const globalMigrationManager = new MigrationManager()

// v1.0.0 → v1.1.0：重命名字段 score → priority
globalMigrationManager.registerMigration(
  '1.0.0',
  '1.1.0',
  (rules: any[]) => {
    const failed: string[] = []
    const newRules = rules.map(r => {
      if (!r) return r
      try {
        const copy = { ...r }
        if ('score' in copy && !('priority' in copy)) {
          copy.priority = copy.score
          delete copy.score
        }
        return copy
      } catch {
        if (r?.id) failed.push(r.id)
        return r
      }
    })
    return { rules: newRules, failed }
  },
  'v1.0.0→v1.1.0：重命名字段 score → priority',
)

// v1.1.0 → v2.0.0：source 为字符串时包装成数组
globalMigrationManager.registerMigration(
  '1.1.0',
  '2.0.0',
  (rules: any[]) => {
    const failed: string[] = []
    const newRules = rules.map(r => {
      if (!r) return r
      try {
        const copy = { ...r }
        if (typeof copy.source === 'string') {
          copy.source = [copy.source]
        }
        return copy
      } catch {
        if (r?.id) failed.push(r.id)
        return r
      }
    })
    return { rules: newRules, failed }
  },
  'v1.1.0→v2.0.0：source 字符串 → 数组',
)

// v2.0.0 → v2.1.0：添加 tags 默认值 []
globalMigrationManager.registerMigration(
  '2.0.0',
  '2.1.0',
  (rules: any[]) => {
    const failed: string[] = []
    const newRules = rules.map(r => {
      if (!r) return r
      try {
        const copy = { ...r }
        if (!('tags' in copy) || copy.tags == null) {
          copy.tags = []
        }
        return copy
      } catch {
        if (r?.id) failed.push(r.id)
        return r
      }
    })
    return { rules: newRules, failed }
  },
  'v2.0.0→v2.1.0：补 tags: []',
)

// v2.1.0 → v3.0.0：重命名 conflictPolicy → conflictStrategy
globalMigrationManager.registerMigration(
  '2.1.0',
  '3.0.0',
  (rules: any[]) => {
    const failed: string[] = []
    const newRules = rules.map(r => {
      if (!r) return r
      try {
        const copy = { ...r }
        if ('conflictPolicy' in copy && !('conflictStrategy' in copy)) {
          copy.conflictStrategy = copy.conflictPolicy
          delete copy.conflictPolicy
        }
        return copy
      } catch {
        if (r?.id) failed.push(r.id)
        return r
      }
    })
    return { rules: newRules, failed }
  },
  'v2.1.0→v3.0.0：conflictPolicy → conflictStrategy',
)

// v3.0.0 → v3.1.0：补 confidence: { components: {} }
globalMigrationManager.registerMigration(
  '3.0.0',
  '3.1.0',
  (rules: any[]) => {
    const failed: string[] = []
    const newRules = rules.map(r => {
      if (!r) return r
      try {
        const copy = { ...r }
        if (!('confidence' in copy) || copy.confidence == null) {
          copy.confidence = { components: {} }
        } else if (!('components' in copy.confidence)) {
          copy.confidence = { ...copy.confidence, components: {} }
        }
        return copy
      } catch {
        if (r?.id) failed.push(r.id)
        return r
      }
    })
    return { rules: newRules, failed }
  },
  'v3.0.0→v3.1.0：补 confidence.components',
)
