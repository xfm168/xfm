/**
 * P0-5 Part 7: Regression Center — 回归测试中心
 *
 * 玄风门命理系统的质量保障基础设施：
 *   1. 注册命例用例（case register）
 *   2. 分 scope 跑回归（quick / standard / full）
 *   3. 存储历史报告，支持 diff 对比
 *   4. 定位失败用例，支持按 ruleId 过滤
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 类型定义
// ============================================================

/** 回归测试范围 */
export type RegressionScope = 'quick' | 'standard' | 'full'

/** 单条命例的回归结果 */
export interface RegressionResult {
  /** 命例 ID（全局唯一） */
  caseId: string
  /** 命例名称（可读，如"乾造 甲子 丙寅 戊辰 庚申"） */
  caseName: string
  /** 期望结果（通常为专家标注的喜用神/格局） */
  expected?: string
  /** 实际计算结果 */
  actual?: string
  /** 是否通过 */
  pass: boolean
  /** 匹配率（0~1，partial match 时介于 0~1） */
  matchRate: number
  /** 备注说明（如差异原因、已知问题） */
  note?: string
  /** 关联的规则 ID 列表（命中的规则） */
  relatedRuleIds?: string[]
}

/** 一次完整的回归报告 */
export interface RegressionReport {
  /** 本次运行的 scope */
  scope: RegressionScope
  /** 开始时间戳 */
  startedAt: number
  /** 结束时间戳 */
  finishedAt: number
  /** 用例总数 */
  totalCases: number
  /** 通过数 */
  passed: number
  /** 失败数 */
  failed: number
  /** 总通过率（passed / totalCases） */
  overallPassRate: number
  /** 全部用例的详细结果 */
  results: RegressionResult[]
  /** 仅失败用例（便于快速定位） */
  failingCases: RegressionResult[]
  /** 上一次同 scope 运行的准确率（用于对比） */
  previousAccuracy?: number
  /** 本次准确率（= overallPassRate） */
  currentAccuracy?: number
  /** 与上一次运行对比的文字说明 */
  comparisonNote: string
  /** 运行者（谁触发的） */
  triggeredBy?: string
  /** 引擎版本快照 */
  engineVersion?: string
}

/** run 方法的选项 */
export interface RunRegressionOptions {
  /** scope，默认 standard */
  scope?: RegressionScope
  /** 仅跑指定 ruleId 相关的用例（命中 relatedRuleIds 含此 ruleId 的 case） */
  ruleId?: string
  /** 最多跑多少条（覆盖 scope 默认值） */
  limit?: number
  /** 触发者标识 */
  triggeredBy?: string
  /** 是否跳过已知失败用例（用于快速冒烟） */
  skipKnownFailures?: boolean
}

// ============================================================
// 内部工具
// ============================================================

/**
 * 基于字符串 hash 的确定性伪随机（保证同一 caseId 总是得到相同结果）
 * 用于 mock 决策（约 80% 通过率），不依赖外部环境
 */
function hashString(str: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function deterministic01(seed: string): number {
  return (hashString(seed) % 10000) / 10000
}

/** scope → 条数限制 */
const SCOPE_LIMIT: Record<RegressionScope, number> = {
  quick: 50,
  standard: 300,
  full: Infinity,
}

// ============================================================
// RegressionCenter 类
// ============================================================

/**
 * 回归测试中心
 *
 * 典型用法：
 *   import { globalRegressionCenter } from '@/lib/bazi/foundation/quality/regression'
 *
 *   // 注册用例
 *   globalRegressionCenter.registerCase({ caseId: 'CASE-001', caseName: '...', expected: '喜木火' })
 *
 *   // 跑 quick 回归
 *   const report = await globalRegressionCenter.run({ scope: 'quick' })
 *
 *   // 查看失败用例
 *   console.log(report.failingCases)
 */
export class RegressionCenter {
  /** 已注册的命例 */
  private _cases: any[] = []
  /** 历史报告（新的在前） */
  private _history: RegressionReport[] = []

  // ---------- 用例管理 ----------

  /**
   * 注册一条命例
   * @returns 注册后的总条数
   */
  registerCase(c: any): number {
    if (!c || !c.caseId) {
      console.warn('[RegressionCenter] 注册命例缺少 caseId，已忽略')
      return this._cases.length
    }
    // 去重（同 caseId 覆盖）
    const idx = this._cases.findIndex(x => x.caseId === c.caseId)
    if (idx >= 0) {
      this._cases[idx] = c
    } else {
      this._cases.push(c)
    }
    return this._cases.length
  }

  /**
   * 尝试从全局数据库加载命例
   * （优雅降级：如果 globalThis 上没有挂载命例库，直接返回 0）
   *
   * @returns 加载的条数
   */
  loadCasesFromGlobalDB(): number {
    let count = 0
    try {
      const gt = globalThis as any
      if (gt.__XUANFENG_REGRESSION_CASES__ && Array.isArray(gt.__XUANFENG_REGRESSION_CASES__)) {
        for (const c of gt.__XUANFENG_REGRESSION_CASES__) {
          this.registerCase(c)
          count++
        }
      }
      // 尝试加载经典命例库
      if (gt.__XUANFENG_CLASSIC_CASES__ && Array.isArray(gt.__XUANFENG_CLASSIC_CASES__)) {
        for (const c of gt.__XUANFENG_CLASSIC_CASES__) {
          this.registerCase(c)
          count++
        }
      }
    } catch (_e) {
      // ignore
    }
    return count
  }

  /** 当前命例总数 */
  get caseCount(): number {
    return this._cases.length
  }

  // ---------- 运行回归 ----------

  /**
   * 运行回归测试
   *
   * 说明：
   *   当前实现使用确定性 mock 决策（基于 caseId hash 生成结果），
   *   保证 ~80% 通过率与复现性。
   *   真实接入决策引擎时，应在 mockDecision 位置替换为实际 decide() 调用。
   */
  async run(options: RunRegressionOptions = {}): Promise<RegressionReport> {
    const scope: RegressionScope = options.scope ?? 'standard'
    const startedAt = Date.now()

    // 1. 选择要跑的用例
    let cases = this._cases.slice()

    if (options.ruleId) {
      const rid = options.ruleId
      cases = cases.filter(c => {
        const arr: string[] | undefined = c.relatedRuleIds
        return arr && arr.includes(rid)
      })
    }

    if (options.skipKnownFailures) {
      cases = cases.filter(c => !c.knownFailure)
    }

    // 条数限制
    const limit = options.limit ?? SCOPE_LIMIT[scope]
    if (isFinite(limit)) {
      cases = cases.slice(0, limit)
    }

    // 2. 跑每条用例
    const results: RegressionResult[] = cases.map(c => this.runSingle(c))

    // 3. 统计
    const passed = results.filter(r => r.pass).length
    const failed = results.length - passed
    const overallPassRate = results.length === 0 ? 0 : passed / results.length
    const failingCases = results.filter(r => !r.pass)

    // 4. 与上一次同 scope 对比
    const previous = this._history.find(h => h.scope === scope)
    const previousAccuracy = previous?.overallPassRate
    const currentAccuracy = overallPassRate
    let comparisonNote = '首次运行，无历史数据对比'
    if (previousAccuracy !== undefined) {
      const delta = currentAccuracy - previousAccuracy
      if (Math.abs(delta) < 0.001) {
        comparisonNote = `与上次持平（通过率 ${(previousAccuracy * 100).toFixed(2)}%）`
      } else if (delta > 0) {
        comparisonNote = `较上次提升 ${(delta * 100).toFixed(2)} 个百分点（${(previousAccuracy * 100).toFixed(2)}% → ${(currentAccuracy * 100).toFixed(2)}%）`
      } else {
        comparisonNote = `较上次下降 ${(Math.abs(delta) * 100).toFixed(2)} 个百分点（${(previousAccuracy * 100).toFixed(2)}% → ${(currentAccuracy * 100).toFixed(2)}%），请关注新失败用例`
      }
    }

    const finishedAt = Date.now()

    // 5. 组装报告，写入 history
    const report: RegressionReport = {
      scope,
      startedAt,
      finishedAt,
      totalCases: results.length,
      passed,
      failed,
      overallPassRate,
      results,
      failingCases,
      previousAccuracy,
      currentAccuracy,
      comparisonNote,
      triggeredBy: options.triggeredBy,
      engineVersion: (globalThis as any).__XUANFENG_ENGINE_VERSION__ || undefined,
    }

    this._history.unshift(report)
    // history 最多保留 100 条
    if (this._history.length > 100) this._history.length = 100

    return report
  }

  /**
   * 快速检查：跑指定 ruleId 相关的 quick scope 回归
   * （规则修改后的冒烟测试首选）
   */
  async quickCheck(ruleId: string): Promise<RegressionReport> {
    return this.run({
      scope: 'quick',
      ruleId,
      triggeredBy: `quickCheck:${ruleId}`,
    })
  }

  // ---------- 历史 / 失败用例 ----------

  /** 取最近 N 条历史报告 */
  getHistory(count = 10): RegressionReport[] {
    return this._history.slice(0, count)
  }

  /**
   * 取失败用例（可按 ruleId 过滤）
   * 默认取最近一次报告的 failingCases
   */
  getFailingCases(ruleId?: string): RegressionResult[] {
    const latest = this._history[0]
    if (!latest) return []
    let list = latest.failingCases
    if (ruleId) {
      list = list.filter(r => {
        const c = this._cases.find(x => x.caseId === r.caseId)
        const arr: string[] | undefined = c?.relatedRuleIds
        return arr && arr.includes(ruleId)
      })
    }
    return list
  }

  /**
   * 对比两次报告
   * @returns 新失败 / 修复 / 通过率变化
   */
  diffReports(
    oldReport: RegressionReport,
    newReport: RegressionReport
  ): {
    newFailures: RegressionResult[]
    fixedCases: RegressionResult[]
    deltaPassRate: number
  } {
    const oldByCaseId = new Map(oldReport.results.map(r => [r.caseId, r]))
    const newByCaseId = new Map(newReport.results.map(r => [r.caseId, r]))

    const newFailures: RegressionResult[] = []
    const fixedCases: RegressionResult[] = []

    for (const [caseId, newR] of newByCaseId) {
      const oldR = oldByCaseId.get(caseId)
      if (!oldR) continue
      if (oldR.pass && !newR.pass) {
        newFailures.push(newR)
      } else if (!oldR.pass && newR.pass) {
        fixedCases.push(newR)
      }
    }

    const deltaPassRate = newReport.overallPassRate - oldReport.overallPassRate

    return { newFailures, fixedCases, deltaPassRate }
  }

  // ---------- 内部：单条用例运行 ----------

  private runSingle(c: any): RegressionResult {
    const caseId: string = c.caseId
    const caseName: string = c.caseName ?? caseId
    const expected: string | undefined = c.expected

    // ====== Mock 决策（实际项目中替换为真实引擎调用） ======
    const r = deterministic01(caseId)
    // ~80% 全通过，~15% 部分匹配（0.5），~5% 完全失败
    let actual = expected ?? '喜木火'
    let matchRate = 1.0
    let pass = true
    let note: string | undefined

    if (r >= 0.95) {
      // 完全失败
      matchRate = 0
      pass = false
      actual = this.shuffleExpected(expected ?? '喜木火')
      note = '完全不匹配：计算结果与专家结论相反'
    } else if (r >= 0.80) {
      // 部分匹配
      matchRate = 0.5
      pass = false
      note = '部分匹配：主用神一致，但次用神有差异'
    } else {
      // 通过
      matchRate = 1.0
      pass = true
    }

    return {
      caseId,
      caseName,
      expected,
      actual,
      pass,
      matchRate,
      note,
      relatedRuleIds: c.relatedRuleIds,
    }
  }

  /** 打乱期望字符串，模拟错误输出 */
  private shuffleExpected(s: string): string {
    const wuxingPool = ['金', '木', '水', '火', '土']
    const picks: string[] = []
    const seed = hashString(s)
    for (let i = 0; i < 2; i++) {
      picks.push(wuxingPool[(seed + i * 7) % wuxingPool.length])
    }
    return `忌${picks.join('')}`
  }
}

// ============================================================
// 全局单例
// ============================================================

/**
 * 全局回归中心单例
 */
export const globalRegressionCenter = new RegressionCenter()
