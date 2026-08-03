/**
 * P0-5A Foundation Core — 调度器（Scheduler）
 *
 * Foundation 系统的定时任务调度组件。
 *
 * 设计原则：
 *   - 标准 Cron：5 字段 cron 表达式（min hour dom month dow）
 *   - 语法支持：星号（任意值）/ 整数 / 星号斜杠n（每n步长）/ 逗号分隔数组
 *   - 容错执行：handler 抛错不会影响其他任务，错误计数 errorCount
 *   - 手动触发：支持 runNow() 立即执行并异步等待结果
 *   - 时间精度：每 30 秒 tick 一次，满足大部分业务场景，避免高频轮询开销
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 *
 * Core 7件事 之 补充：定时任务调度器（Scheduler）
 */

import { Result, Ok, Err } from '../../shared/kernel/types'

// ============================================================
// 类型定义
// ============================================================

/**
 * Cron 字段取值类型
 */
export type CronField = number | '*' | '*/n' | number[]

/**
 * 已调度的任务
 */
export interface ScheduledJob {
  /** 任务唯一 ID */
  id: string
  /** 任务名称（可读） */
  name: string
  /** Cron 表达式："min hour dom month dow" */
  cronExpression: string
  /** 任务处理函数，支持同步或异步 */
  handler: () => void | Promise<void>
  /** 是否已启用调度（scheduled=false 时不会被 tick 触发） */
  scheduled: boolean
  /** 是否正在执行 */
  running: boolean
  /** 上次执行时间戳（ms） */
  lastRunAt?: number
  /** 下次计划执行时间戳（ms） */
  nextRunAt?: number
  /** 累计执行次数 */
  runCount: number
  /** 标签数组 */
  tags: string[]
  /** 累计错误次数 */
  errorCount: number
}

/**
 * 解析后的 cron 字段：每个字段为允许值的集合
 */
interface ParsedCron {
  minutes: Set<number>
  hours: Set<number>
  daysOfMonth: Set<number>
  months: Set<number>
  daysOfWeek: Set<number>
}

// ============================================================
// Scheduler 类
// ============================================================

/**
 * 定时任务调度器
 *
 * @example
 * import { globalScheduler } from '@/lib/bazi/foundation/core'
 *
 * // 每小时的第 0 分钟执行
 * globalScheduler.schedule('cleanup', '清理缓存', '0 * * * *', async () => {
 *   console.log('执行清理')
 * }, ['maintenance'])
 *
 * // 启动调度器
 * globalScheduler.start()
 *
 * // 立即手动触发一次
 * await globalScheduler.runNow('cleanup')
 *
 * // 查看下次运行时间（每 2 小时）
 * const next = globalScheduler.getNextRun('0 0-23/2 * * *')
 * console.log(new Date(next))
 */
export class Scheduler {
  /** 已注册任务表：id → 任务 */
  private jobs = new Map<string, ScheduledJob>()
  /** tick 定时器句柄 */
  private timer?: any = undefined

  /**
   * 启动调度器
   * 每 30 秒检查一次所有 scheduled=true 的任务
   */
  start(): void {
    if (this.timer !== undefined) return

    for (const job of this.jobs.values()) {
      if (job.scheduled && job.nextRunAt === undefined) {
        job.nextRunAt = this.getNextRun(job.cronExpression, Date.now())
      }
    }

    this.timer = setInterval(() => {
      this.tick()
    }, 30_000)
  }

  /**
   * 停止调度器
   * 不会清除已注册任务，只是停止 tick 轮询
   */
  stop(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer)
      this.timer = undefined
    }
  }

  /**
   * 调度一个新任务
   * 新注册的任务 scheduled=true，立即计算下次执行时间
   * @param id 任务唯一 ID
   * @param name 任务名称
   * @param cronExpression 5 字段 cron 表达式
   * @param handler 处理函数
   * @param tags 标签数组
   * @returns Ok<ScheduledJob> 注册成功；Err<string> ID 重复或 cron 表达式无效
   */
  schedule(
    id: string,
    name: string,
    cronExpression: string,
    handler: () => void | Promise<void>,
    tags: string[] = [],
  ): Result<ScheduledJob, string> {
    if (this.jobs.has(id)) {
      return Err(`任务 ID 已存在: ${id}`)
    }

    let parsed: ParsedCron
    try {
      parsed = this.parseCron(cronExpression)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return Err(`Cron 表达式无效 [${cronExpression}]: ${msg}`)
    }

    const job: ScheduledJob = {
      id,
      name,
      cronExpression,
      handler,
      scheduled: true,
      running: false,
      runCount: 0,
      tags: [...tags],
      errorCount: 0,
    }

    try {
      job.nextRunAt = this.getNextRunFromParsed(parsed, Date.now())
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return Err(`无法计算下次运行时间 [${cronExpression}]: ${msg}`)
    }

    this.jobs.set(id, job)
    return Ok({ ...job, handler, tags: [...job.tags] })
  }

  /**
   * 取消调度任务
   * @returns 是否找到并删除
   */
  unschedule(id: string): boolean {
    return this.jobs.delete(id)
  }

  /**
   * 立即手动触发一个任务
   * 即使 scheduled=false 也能执行；会更新 lastRunAt/runCount/errorCount
   * @param id 任务 ID
   * @returns Ok<void> 执行成功；Err<string> 任务不存在或 handler 抛错
   */
  async runNow(id: string): Promise<Result<void, string>> {
    const job = this.jobs.get(id)
    if (!job) {
      return Err(`任务不存在: ${id}`)
    }

    job.running = true
    job.lastRunAt = Date.now()

    try {
      const result = job.handler()
      if (result && typeof (result as Promise<void>).then === 'function') {
        await result
      }
      job.runCount++
      job.running = false
      return Ok(undefined)
    } catch (e) {
      job.errorCount++
      job.runCount++
      job.running = false
      const msg = e instanceof Error ? e.message : String(e)
      return Err(`任务执行失败 [${id}]: ${msg}`)
    }
  }

  /**
   * 列出所有已注册任务（浅拷贝）
   */
  list(): ScheduledJob[] {
    return Array.from(this.jobs.values()).map(job => ({
      ...job,
      tags: [...job.tags],
    }))
  }

  /**
   * 获取指定任务（返回浅拷贝）
   */
  getJob(id: string): ScheduledJob | undefined {
    const job = this.jobs.get(id)
    if (!job) return undefined
    return { ...job, tags: [...job.tags] }
  }

  /**
   * 调度器是否正在运行（已 start 且未 stop）
   */
  isRunning(): boolean {
    return this.timer !== undefined
  }

  /**
   * 清空所有任务
   * 会先 stop 再清空
   */
  clear(): void {
    this.stop()
    this.jobs.clear()
  }

  /**
   * 计算 cron 表达式的下次触发时间戳
   * @param cronExpression 5 字段 cron
   * @param from 起始时间（ms），默认当前时间
   */
  getNextRun(cronExpression: string, from?: number): number {
    const parsed = this.parseCron(cronExpression)
    return this.getNextRunFromParsed(parsed, from ?? Date.now())
  }

  // ─── 内部实现 ───────────────────────────────────

  /**
   * 解析 5 字段 cron 表达式为 ParsedCron（允许值集合）
   * 支持：
   *   星号        → 全部
   *   5           → 单值
   *   1,3,5       → 多值
   *   1-5         → 范围（含两端）
   *   星号/2      → 步长（每 2 单位）
   *   0-30/5      → 带范围的步长
   */
  private parseCron(expr: string): ParsedCron {
    const parts = expr.trim().split(/\s+/)
    if (parts.length !== 5) {
      throw new Error('需要 5 个字段: min hour dom month dow')
    }

    const [minStr, hourStr, domStr, monthStr, dowStr] = parts

    return {
      minutes: this.parseField(minStr, 0, 59),
      hours: this.parseField(hourStr, 0, 23),
      daysOfMonth: this.parseField(domStr, 1, 31),
      months: this.parseField(monthStr, 1, 12),
      daysOfWeek: this.parseField(dowStr, 0, 6),
    }
  }

  /**
   * 解析单个 cron 字段为允许值的 Set
   */
  private parseField(field: string, min: number, max: number): Set<number> {
    const result = new Set<number>()

    for (const part of field.split(',')) {
      let valueRange = part
      let step = 1

      const stepMatch = part.match(/^(.+)\/(\d+)$/)
      if (stepMatch) {
        valueRange = stepMatch[1]
        step = parseInt(stepMatch[2], 10)
        if (step <= 0) {
          throw new Error(`步长必须 > 0: ${part}`)
        }
      }

      let start: number
      let end: number

      if (valueRange === '*') {
        start = min
        end = max
      } else {
        const rangeMatch = valueRange.match(/^(\d+)-(\d+)$/)
        if (rangeMatch) {
          start = parseInt(rangeMatch[1], 10)
          end = parseInt(rangeMatch[2], 10)
        } else if (/^\d+$/.test(valueRange)) {
          start = parseInt(valueRange, 10)
          end = start
        } else {
          throw new Error(`无法解析字段: ${part}`)
        }
      }

      if (start < min || end > max || start > end) {
        throw new Error(`字段值超出范围 [${min}-${max}]: ${part}`)
      }

      for (let v = start; v <= end; v += step) {
        result.add(v)
      }
    }

    if (result.size === 0) {
      throw new Error(`字段解析结果为空: ${field}`)
    }

    return result
  }

  /**
   * 根据解析后的 cron 计算下次运行时间戳
   * 从 from 的下一分钟开始搜索，最多搜索 4 年（48 个月），找不到则抛错
   */
  private getNextRunFromParsed(parsed: ParsedCron, from: number): number {
    const d = new Date(from)
    d.setSeconds(0, 0)
    d.setMinutes(d.getMinutes() + 1)

    const maxIterations = 4 * 366 * 24 * 60
    let iterations = 0

    while (iterations < maxIterations) {
      iterations++

      if (!parsed.months.has(d.getMonth() + 1)) {
        d.setMonth(d.getMonth() + 1)
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        continue
      }

      if (!parsed.daysOfMonth.has(d.getDate())) {
        d.setDate(d.getDate() + 1)
        d.setHours(0, 0, 0, 0)
        continue
      }

      if (!parsed.daysOfWeek.has(d.getDay())) {
        d.setDate(d.getDate() + 1)
        d.setHours(0, 0, 0, 0)
        continue
      }

      if (!parsed.hours.has(d.getHours())) {
        d.setHours(d.getHours() + 1, 0, 0, 0)
        continue
      }

      if (!parsed.minutes.has(d.getMinutes())) {
        d.setMinutes(d.getMinutes() + 1, 0, 0)
        continue
      }

      return d.getTime()
    }

    throw new Error('在 4 年内未找到符合 cron 的执行时间')
  }

  /**
   * Tick 检查：遍历所有 scheduled=true 的任务
   * 若 now >= nextRunAt，则 fireAndUpdate 执行并计算下一次
   */
  private tick(): void {
    const now = Date.now()

    for (const job of this.jobs.values()) {
      if (!job.scheduled || job.running) continue
      if (job.nextRunAt === undefined || now < job.nextRunAt) continue

      this.fireAndUpdate(job)
    }
  }

  /**
   * 触发执行并更新任务状态（lastRunAt/runCount/errorCount/nextRunAt）
   * 异步 handler 不阻塞 tick 流程，但会在其 settle 时更新 running 状态
   */
  private fireAndUpdate(job: ScheduledJob): void {
    job.running = true
    job.lastRunAt = Date.now()

    try {
      const result = job.handler()
      if (result && typeof (result as Promise<void>).then === 'function') {
        ;(result as Promise<void>)
          .then(() => {
            job.runCount++
            job.running = false
          })
          .catch(e => {
            job.errorCount++
            job.runCount++
            job.running = false
          })
      } else {
        job.runCount++
        job.running = false
      }
    } catch (e) {
      job.errorCount++
      job.runCount++
      job.running = false
    }

    try {
      job.nextRunAt = this.getNextRun(job.cronExpression, Date.now() + 60_000)
    } catch {
      job.nextRunAt = undefined
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局调度器单例 */
export const globalScheduler = new Scheduler()

export default globalScheduler
