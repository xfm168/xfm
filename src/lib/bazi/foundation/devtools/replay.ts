// DevTools Replay —— 决策重放工具
// 点击 Case → 直接 Replay 整个 Decision 流程

// ============================================================
// 类型定义
// ============================================================

/** 重放请求 */
export interface ReplayRequest {
  /** 命例 ID（从命例库加载） */
  caseId?: string
  /** 快照 ID（从快照管理器加载） */
  snapshotId?: string
  /** 直接传入的输入（覆盖 caseId / snapshotId 的 input） */
  input?: any
  /** 覆盖流派 */
  school?: string
  /** 覆盖策略 */
  strategy?: string
  /** 选项 */
  options?: {
    /** 是否与原始输出做对比 */
    compareWithOriginal?: boolean
    /** 是否输出详细 trace */
    verbose?: boolean
  }
}

/** 重放结果 */
export interface ReplayResult {
  /** 是否成功 */
  success: boolean
  /** 实际使用的输入 */
  input: any
  /** 重放输出 */
  output?: any
  /** 原始输出（仅 compareWithOriginal=true 时填充） */
  originalOutput?: any
  /** 字段级 diff（仅 compareWithOriginal=true 时填充） */
  diff?: Array<{ field: string; expected: any; actual: any }>
  /** 总耗时（毫秒） */
  durationMs: number
  /** 失败时的错误信息 */
  error?: string
  /** 逐步执行 trace */
  trace?: string[]
}

// ============================================================
// ReplayEngine —— 决策重放引擎
// ============================================================

/**
 * 决策重放引擎
 *
 * 用途：
 *   - DevTools 面板点击 Case → 重放完整 Decision 流程
 *   - 回归测试：对比历史快照与当前输出
 *   - 调试：详细 trace 排查决策路径
 *
 * 全部方法均不抛异常，失败时返回 { success: false, error }。
 */
export class ReplayEngine {
  /**
   * 通用重放入口
   *
   * 优先级：snapshotId > caseId > input
   */
  async replay(req: ReplayRequest): Promise<ReplayResult> {
    const trace: string[] = []
    const startedAt = Date.now()
    try {
      trace.push(`[replay] 开始重放: ${req.snapshotId ? 'snapshot=' + req.snapshotId : req.caseId ? 'case=' + req.caseId : 'direct-input'}`)

      // 1. 解析输入
      let input: any
      let originalOutput: any

      if (req.snapshotId) {
        trace.push(`[replay] 从快照加载: ${req.snapshotId}`)
        const snap = await this._loadSnapshot(req.snapshotId)
        if (!snap) {
          return this._fail(req, `快照不存在: ${req.snapshotId}`, trace, startedAt)
        }
        input = req.input ?? snap.input ?? snap.capturedInput
        originalOutput = snap.output ?? snap.capturedOutput
        trace.push(`[replay] 快照输入已加载`)
      } else if (req.caseId) {
        trace.push(`[replay] 从命例库加载: ${req.caseId}`)
        const caseData = await this._loadCase(req.caseId)
        if (!caseData) {
          return this._fail(req, `命例不存在: ${req.caseId}`, trace, startedAt)
        }
        input = req.input ?? this._buildInputFromCase(caseData)
        trace.push(`[replay] 命例输入已构建`)
      } else {
        input = req.input
        trace.push(`[replay] 使用直接输入`)
      }

      if (input === undefined || input === null) {
        return this._fail(req, '输入为空，无法重放', trace, startedAt)
      }

      // 2. 运行决策
      trace.push(`[replay] 调用 EvidenceFusionDecisionEngine.decide()`)
      const output = await this._runDecision(input, req.school, req.strategy)
      trace.push(`[replay] 决策完成`)

      // 3. 可选：与原始输出对比
      let diff: ReplayResult['diff']
      if (req.options?.compareWithOriginal && originalOutput !== undefined) {
        diff = this._diffOutputs(originalOutput, output)
        trace.push(`[replay] 与原始输出对比完成，diff 条数: ${diff.length}`)
      }

      const durationMs = Date.now() - startedAt
      return {
        success: true,
        input,
        output,
        originalOutput: req.options?.compareWithOriginal ? originalOutput : undefined,
        diff,
        durationMs,
        trace: req.options?.verbose ? trace : undefined,
      }
    } catch (e: any) {
      trace.push(`[replay] 异常: ${String(e?.message ?? e)}`)
      return this._fail(req, String(e?.message ?? e), trace, startedAt)
    }
  }

  /**
   * 批量重放
   */
  async replayBatch(reqs: ReplayRequest[]): Promise<ReplayResult[]> {
    const results: ReplayResult[] = []
    for (const req of reqs) {
      try {
        const r = await this.replay(req)
        results.push(r)
      } catch (e: any) {
        results.push({
          success: false,
          input: req.input,
          durationMs: 0,
          error: String(e?.message ?? e),
        })
      }
    }
    return results
  }

  /**
   * 从命例 ID 重放
   */
  async replayFromCase(
    caseId: string,
    options?: { school?: string; strategy?: string },
  ): Promise<ReplayResult> {
    return this.replay({
      caseId,
      school: options?.school,
      strategy: options?.strategy,
      options: { compareWithOriginal: false, verbose: true },
    })
  }

  /**
   * 从快照 ID 重放
   */
  async replayFromSnapshot(
    snapshotId: string,
    options?: { compareWithOriginal?: boolean },
  ): Promise<ReplayResult> {
    return this.replay({
      snapshotId,
      options: { compareWithOriginal: options?.compareWithOriginal ?? true, verbose: true },
    })
  }

  /**
   * 把重放结果格式化为人类可读文本
   */
  formatReplayResult(result: ReplayResult): string {
    const lines: string[] = []
    lines.push('===== Replay Result =====')
    lines.push(`Success: ${result.success ? 'YES' : 'NO'}`)
    lines.push(`Duration: ${result.durationMs} ms`)
    if (result.error) {
      lines.push(`Error: ${result.error}`)
    }
    if (result.input !== undefined) {
      lines.push(`Input: ${this._safeStringify(result.input)}`)
    }
    if (result.output !== undefined) {
      lines.push(`Output: ${this._safeStringify(result.output)}`)
    }
    if (result.originalOutput !== undefined) {
      lines.push(`Original Output: ${this._safeStringify(result.originalOutput)}`)
    }
    if (result.diff && result.diff.length > 0) {
      lines.push('')
      lines.push('--- Diff ---')
      lines.push(this.formatDiff(result.diff))
    }
    if (result.trace && result.trace.length > 0) {
      lines.push('')
      lines.push('--- Trace ---')
      for (const t of result.trace) lines.push(t)
    }
    return lines.join('\n')
  }

  /**
   * 格式化 diff
   */
  formatDiff(diff: Array<{ field: string; expected: any; actual: any }>): string {
    if (!diff || diff.length === 0) return '(无差异)'
    const lines: string[] = []
    for (const d of diff) {
      lines.push(
        `  • ${d.field}: 期望=${this._safeStringify(d.expected)} 实际=${this._safeStringify(d.actual)}`,
      )
    }
    return lines.join('\n')
  }

  // ============================================================
  // 内部辅助
  // ============================================================

  /** 加载快照（容错） */
  private async _loadSnapshot(snapshotId: string): Promise<any> {
    // 优先从全局快照管理器
    try {
      // 玄风快照管理器（如果存在）
      const mod: any = await import('../../../governance/snapshot')
      const mgr = mod?.globalSnapshotManager
      if (mgr && typeof mgr.get === 'function') {
        return mgr.get(snapshotId)
      }
      if (mgr && typeof mgr.load === 'function') {
        return await mgr.load(snapshotId)
      }
    } catch (_e) { /* ignore */ }

    // 兜底：全局对象
    try {
      const g: any = globalThis as any
      const mgr = g?.globalSnapshotManager
      if (mgr && typeof mgr.get === 'function') return mgr.get(snapshotId)
      if (mgr && typeof mgr.load === 'function') return await mgr.load(snapshotId)
    } catch (_e) { /* ignore */ }

    return undefined
  }

  /** 加载命例（容错） */
  private async _loadCase(caseId: string): Promise<any> {
    // 优先从全局命例库加载
    let caseData: any
    try {
      const db: any = await import('../../db')
      caseData = db.globalDBManager?.caseDB?.get?.(caseId)
    } catch (_e) { /* ignore */ }

    if (!caseData) {
      // 兜底：尝试 xiyongshen 的 case 模块
      try {
        const mod: any = await import('../../xiyongshen/case')
        caseData = mod.globalCaseDB?.get?.(caseId)
      } catch (_e) { /* ignore */ }
    }

    // 再兜底：foundation 自带的 db
    if (!caseData) {
      try {
        const mod: any = await import('../db')
        caseData = mod.globalDBManager?.caseDB?.get?.(caseId)
      } catch (_e) { /* ignore */ }
    }

    // 再兜底：globalThis
    if (!caseData) {
      try {
        const g: any = globalThis as any
        const mgr = g?.globalCaseDB ?? g?.globalDBManager?.caseDB
        if (mgr && typeof mgr.get === 'function') caseData = mgr.get(caseId)
      } catch (_e) { /* ignore */ }
    }

    return caseData
  }

  /** 从命例构建 SubEngineInput */
  private _buildInputFromCase(caseData: any): any {
    if (!caseData) return undefined
    // 命例可能直接含 input 字段
    if (caseData.input && typeof caseData.input === 'object') {
      return { ...caseData.input }
    }
    // 也可能直接就是 input
    if (caseData.dayStem || caseData.dayStrength !== undefined || caseData.monthZhi) {
      return { ...caseData }
    }
    // 兜底：尝试把 caseData 的字段映射到 SubEngineInput
    return {
      ...(caseData.bazi ?? caseData.chart ?? caseData.pillars ?? {}),
      ...caseData,
    }
  }

  /** 运行决策（动态 import 避免循环依赖） */
  private async _runDecision(
    input: any,
    schoolOverride?: string,
    _strategyOverride?: string,
  ): Promise<any> {
    const { EvidenceFusionDecisionEngine, getSchoolProfile } = await import('../../xiyongshen/engines/fusion')
    const engine = new EvidenceFusionDecisionEngine()

    let profile: any = undefined
    if (schoolOverride) {
      try {
        profile = getSchoolProfile(schoolOverride)
      } catch (_e) { /* ignore：使用默认 profile */ }
    }

    return engine.decide(input, profile)
  }

  /** 计算字段级 diff */
  private _diffOutputs(
    expected: any,
    actual: any,
  ): Array<{ field: string; expected: any; actual: any }> {
    const diff: Array<{ field: string; expected: any; actual: any }> = []
    const visited = new Set<any>()

    const walk = (exp: any, act: any, path: string): void => {
      if (visited.has(exp) && visited.has(act)) return
      visited.add(exp)
      visited.add(act)

      if (typeof exp !== typeof act) {
        diff.push({ field: path, expected: exp, actual: act })
        return
      }

      if (exp === null || act === null || typeof exp !== 'object') {
        if (exp !== act) {
          diff.push({ field: path, expected: exp, actual: act })
        }
        return
      }

      if (Array.isArray(exp) && Array.isArray(act)) {
        const len = Math.max(exp.length, act.length)
        for (let i = 0; i < len; i++) {
          walk(exp[i], act[i], `${path}[${i}]`)
        }
        return
      }

      const keys = new Set([...Object.keys(exp), ...Object.keys(act)])
      for (const k of keys) {
        walk((exp as any)[k], (act as any)[k], path ? `${path}.${k}` : k)
      }
    }

    try {
      walk(expected, actual, '')
    } catch (_e) { /* ignore */ }

    return diff
  }

  /** 构造失败结果 */
  private _fail(
    req: ReplayRequest,
    error: string,
    trace: string[],
    startedAt: number,
  ): ReplayResult {
    return {
      success: false,
      input: req.input,
      durationMs: Date.now() - startedAt,
      error,
      trace: req.options?.verbose ? trace : undefined,
    }
  }

  /** 安全 JSON 序列化 */
  private _safeStringify(v: any): string {
    try {
      if (v === undefined) return 'undefined'
      if (typeof v === 'function') return '[function]'
      return JSON.stringify(v, (_k, val) =>
        typeof val === 'function' ? '[function]' : val,
      )
    } catch (_e) {
      return String(v)
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局重放引擎单例 */
export const globalReplayEngine = new ReplayEngine()
