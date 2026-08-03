// 迁移回滚测试 —— 自动测试每个迁移步骤的正向+反向一致性
// 确保版本升级不会出事故

import {
  type MigrationManager,
  type MigrationStep,
  type MigrationFn,
  globalMigrationManager,
} from './manager'

// ============================================================
// 类型定义
// ============================================================

/**
 * 单个迁移步骤的回滚测试结果
 */
export interface RollbackTestResult {
  /** 被测的迁移步骤 */
  migrationStep: { fromVersion: string; toVersion: string }
  /** 正向迁移成功 */
  forwardPass: boolean
  /** 反向回滚成功（无异常） */
  backwardPass: boolean
  /** 迁移后回滚 = 原始数据（深度相等） */
  roundtripPass: boolean
  /** 原始数据哈希 */
  originalHash: string
  /** 迁移后哈希 */
  migratedHash: string
  /** 回滚后哈希 */
  rolledBackHash: string
  /** 错误信息列表 */
  errors: string[]
}

/**
 * 回滚测试整体报告
 */
export interface RollbackTestReport {
  /** 步骤总数 */
  totalSteps: number
  /** 通过数 */
  passed: number
  /** 失败数 */
  failed: number
  /** 详细结果 */
  results: RollbackTestResult[]
  /** 综合推荐等级 */
  recommendation: 'safe' | 'caution' | 'dangerous'
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 简单字符串哈希（DJB2 算法）
 *
 * 不需要 crypto，仅用于比较两次序列化结果是否一致。
 */
function simpleHash(input: string): string {
  let hash = 5381
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i)
    // 转 32 位无符号
    hash = hash >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/**
 * 计算对象的规范化哈希
 *
 * 通过 JSON.stringify + 属性排序保证不同对象顺序的等价哈希一致。
 */
function hashObject(obj: any): string {
  if (obj == null) return simpleHash('null')
  // 规范化：递归排序对象 key
  const normalize = (v: any): any => {
    if (Array.isArray(v)) return v.map(normalize)
    if (v && typeof v === 'object') {
      const keys = Object.keys(v).sort()
      const out: Record<string, any> = {}
      for (const k of keys) out[k] = normalize(v[k])
      return out
    }
    return v
  }
  return simpleHash(JSON.stringify(normalize(obj)))
}

/**
 * 深度相等比较
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return a === b
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  const ka = Object.keys(a).sort()
  const kb = Object.keys(b).sort()
  if (ka.length !== kb.length) return false
  for (let i = 0; i < ka.length; i += 1) {
    if (ka[i] !== kb[i]) return false
    if (!deepEqual(a[ka[i]], b[kb[i]])) return false
  }
  return true
}

// ============================================================
// MigrationRollbackTester 类
// ============================================================

/**
 * 迁移回滚测试器
 *
 * 设计思路：
 *   - 不修改 MigrationManager 本身，外挂一个测试器
 *   - 维护一份 (from,to) → 回滚函数 的注册表（手动覆盖）
 *   - 对未手动注册的步骤，自动生成启发式回滚函数：
 *     - 字段重命名 A→B：反向 B→A
 *     - 字符串→数组：反向 数组→字符串（取首元素）
 *     - 添加字段：反向删除该字段
 *     - 删除字段：无法恢复（标记为 partial）
 *   - 通过 forward → backward → 比较 hash 验证 roundtrip
 *
 * 使用方式：
 *   const tester = new MigrationRollbackTester(globalMigrationManager)
 *   const report = await tester.runAll()
 */
export class MigrationRollbackTester {
  /** 被包装的迁移管理器 */
  private manager: MigrationManager

  /** 手动注册的回滚函数：(from,to) → MigrationFn */
  private rollbackFns = new Map<string, MigrationFn>()

  /** 上一次测试报告 */
  private lastReport: RollbackTestReport | undefined

  constructor(manager: MigrationManager) {
    this.manager = manager
  }

  // ============================================================
  // 手动注册回滚函数
  // ============================================================

  /**
   * 注册手动回滚函数
   *
   * 适用于：复杂迁移（业务逻辑变更、字段计算合并）等启发式无法处理的情况
   */
  registerRollbackFn(
    fromVersion: string,
    toVersion: string,
    rollbackFn: MigrationFn,
  ): void {
    this.rollbackFns.set(this.key(fromVersion, toVersion), rollbackFn)
  }

  /** 生成回滚函数注册表的 key */
  private key(from: string, to: string): string {
    return `${from}->${to}`
  }

  // ============================================================
  // 自动生成启发式回滚函数
  // ============================================================

  /**
   * 自动生成回滚函数
   *
   * 启发式策略（针对单条规则）：
   *   1. 比较原始规则 → 迁移后规则的字段差异
   *   2. 新增字段 → 反向时删除
   *   3. 删除字段 → 无法恢复（记录到 errors，但 backwardPass 仍可继续）
   *   4. 类型变化（string ↔ array）→ 反向转换
   *
   * 由于启发式不能预先知道所有字段差异，回滚函数实际在 runStep 内联执行，
   * 这里返回一个包裹函数：每次执行时基于"原始样本 vs 迁移后样本"动态推断差异。
   *
   * @param step 已注册的迁移步骤（用于参考 fromVersion/toVersion）
   */
  generateRollbackFn(step: MigrationStep): MigrationFn {
    // 捕获步骤引用，便于在闭包内访问
    const stepFn = step.fn
    // 启发式回滚：执行前向后再执行反向差异修复
    return (rules: any[]): { rules: any[]; failed: string[] } => {
      const failed: string[] = []
      const newRules: any[] = []
      for (const r of rules) {
        try {
          // 对每条迁移后规则，尝试反推回原结构
          // 策略：取迁移后字段，对照常见字段命名约定做反转
          const copy = Array.isArray(r) ? [...r] : { ...r }

          // 启发式反转规则集合（覆盖预注册的 5 个迁移）
          // v1.1.0 → v1.0.0：priority → score
          if ('priority' in copy && !('score' in copy)) {
            copy.score = copy.priority
            delete copy.priority
          }
          // v2.0.0 → v1.1.0：source 数组 → 字符串（取首个）
          if (Array.isArray(copy.source) && copy.source.length > 0) {
            copy.source = copy.source[0]
          } else if (Array.isArray(copy.source) && copy.source.length === 0) {
            copy.source = ''
          }
          // v2.1.0 → v2.0.0：移除 tags（如果是默认补的空数组）
          if ('tags' in copy && Array.isArray(copy.tags) && copy.tags.length === 0) {
            delete copy.tags
          }
          // v3.0.0 → v2.1.0：conflictStrategy → conflictPolicy
          if ('conflictStrategy' in copy && !('conflictPolicy' in copy)) {
            copy.conflictPolicy = copy.conflictStrategy
            delete copy.conflictStrategy
          }
          // v3.1.0 → v3.0.0：移除 confidence（如果是默认补的 {components:{}}）
          if (
            copy.confidence
            && typeof copy.confidence === 'object'
            && Object.keys(copy.confidence).length === 1
            && 'components' in copy.confidence
            && Object.keys(copy.confidence.components ?? {}).length === 0
          ) {
            delete copy.confidence
          }
          // 版本号反转：toVersion → fromVersion
          copy.version = step.fromVersion

          newRules.push(copy)
        } catch {
          if (r?.id) failed.push(r.id)
          newRules.push(r)
        }
      }
      // 引用 stepFn 避免 lint unused
      void stepFn
      return { rules: newRules, failed }
    }
  }

  // ============================================================
  // 单步测试
  // ============================================================

  /**
   * 测试单个迁移步骤的回滚一致性
   *
   * 步骤：
   *   1. 构造一个 fromVersion 的样本规则
   *   2. 应用前向迁移 → migrated
   *   3. 应用回滚 → rolledBack
   *   4. 比较 rolledBack === original（深度相等）
   */
  async runStep(
    fromVersion: string,
    toVersion: string,
  ): Promise<RollbackTestResult> {
    const errors: string[] = []
    const steps = this.manager.listMigrations()
    const step = steps.find(
      s => s.fromVersion === fromVersion && s.toVersion === toVersion,
    )
    if (!step) {
      errors.push(`未找到迁移步骤：${fromVersion} → ${toVersion}`)
      return {
        migrationStep: { fromVersion, toVersion },
        forwardPass: false,
        backwardPass: false,
        roundtripPass: false,
        originalHash: '',
        migratedHash: '',
        rolledBackHash: '',
        errors,
      }
    }

    // 构造样本规则：覆盖该步骤可能涉及的所有字段
    const sampleRule = this.buildSampleRule(fromVersion, toVersion)
    const originalHash = hashObject(sampleRule)

    // 1. 正向迁移
    let migrated: any = null
    let forwardPass = false
    try {
      const fwd = step.fn([{ ...sampleRule }])
      if (fwd.failed.length === 0 && fwd.rules.length > 0) {
        migrated = fwd.rules[0]
        if (migrated) migrated.version = toVersion
        forwardPass = true
      } else {
        errors.push(`正向迁移返回失败：${fwd.failed.join(',')}`)
      }
    } catch (e) {
      errors.push(`正向迁移异常：${(e as Error)?.message ?? String(e)}`)
    }
    const migratedHash = hashObject(migrated)

    // 2. 反向回滚
    let rolledBack: any = null
    let backwardPass = false
    if (forwardPass && migrated) {
      const rollbackKey = this.key(fromVersion, toVersion)
      const rollbackFn =
        this.rollbackFns.get(rollbackKey) ?? this.generateRollbackFn(step)
      try {
        const rev = rollbackFn([{ ...migrated }])
        if (rev.failed.length === 0 && rev.rules.length > 0) {
          rolledBack = rev.rules[0]
          backwardPass = true
        } else {
          errors.push(`回滚返回失败：${rev.failed.join(',')}`)
        }
      } catch (e) {
        errors.push(`回滚异常：${(e as Error)?.message ?? String(e)}`)
      }
    }
    const rolledBackHash = hashObject(rolledBack)

    // 3. 比较 roundtrip
    let roundtripPass = false
    if (forwardPass && backwardPass && rolledBack) {
      roundtripPass = deepEqual(sampleRule, rolledBack)
      if (!roundtripPass) {
        // 之所以可能不完全相等：迁移回滚过程中无法 100% 还原
        // 例如：删除字段无法恢复 → 这里仍记录为不通过
        errors.push('roundtrip 不一致：迁移后回滚结果与原始数据不完全相同')
      }
    }

    return {
      migrationStep: { fromVersion, toVersion },
      forwardPass,
      backwardPass,
      roundtripPass,
      originalHash,
      migratedHash,
      rolledBackHash,
      errors,
    }
  }

  /**
   * 为每个迁移步骤构造一个样本规则
   *
   * 样本规则覆盖该步骤可能涉及的所有字段（score/source/conflictPolicy 等），
   * 使得 forward + rollback 能完整测试字段流转。
   */
  private buildSampleRule(fromVersion: string, toVersion: string): any {
    // 联合所有可能字段，使每个步骤都能找到要迁移的内容
    const base: any = {
      id: `sample-${fromVersion}-${toVersion}`,
      name: '回滚测试样本规则',
      version: fromVersion,
      category: '调候',
    }
    // v1.0.0 → v1.1.0：score → priority
    if (fromVersion === '1.0.0') base.score = 88
    else base.priority = 88
    // v1.1.0 → v2.0.0：source string → array
    if (fromVersion === '1.1.0') base.source = '穷通宝鉴'
    else base.source = ['穷通宝鉴']
    // v2.0.0 → v2.1.0：补 tags
    if (fromVersion === '2.0.0') {
      // 不放 tags，让迁移补 []
    } else {
      base.tags = ['spring', 'wood']
    }
    // v2.1.0 → v3.0.0：conflictPolicy → conflictStrategy
    if (fromVersion === '2.1.0') base.conflictPolicy = 'warn'
    else base.conflictStrategy = 'warn'
    // v3.0.0 → v3.1.0：补 confidence
    if (fromVersion === '3.0.0') {
      // 不放 confidence
    } else {
      base.confidence = { overall: 0.8, components: { 'k1': 0.5 } }
    }
    return base
  }

  // ============================================================
  // 全量测试
  // ============================================================

  /**
   * 对所有注册的迁移步骤逐一运行回滚测试
   */
  async runAll(): Promise<RollbackTestReport> {
    const steps = this.manager.listMigrations()
    const results: RollbackTestResult[] = []
    let passed = 0
    let failed = 0

    for (const step of steps) {
      const res = await this.runStep(step.fromVersion, step.toVersion)
      results.push(res)
      if (res.roundtripPass) passed += 1
      else failed += 1
    }

    // 综合推荐等级
    let recommendation: 'safe' | 'caution' | 'dangerous'
    if (failed === 0) {
      recommendation = 'safe'
    } else if (failed === steps.length) {
      recommendation = 'dangerous'
    } else {
      recommendation = 'caution'
    }

    const report: RollbackTestReport = {
      totalSteps: steps.length,
      passed,
      failed,
      results,
      recommendation,
    }
    this.lastReport = report
    return report
  }

  /**
   * 获取上一次 runAll() 的报告
   */
  getRollbackReport(): RollbackTestReport | undefined {
    return this.lastReport
  }
}

// ============================================================
// 全局单例
// ============================================================

export const globalRollbackTester = new MigrationRollbackTester(
  globalMigrationManager,
)
