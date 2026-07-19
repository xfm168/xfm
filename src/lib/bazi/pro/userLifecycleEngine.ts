/**
 * User Lifecycle Engine
 *
 * 职责：
 *   - 用户生命周期事件的记录与查询
 *   - 用户旅程聚合与统计
 *   - 转化漏斗、留存分析、路径分析
 * 约束：
 *   - 不修改已有文件
 *   - 纯数据管理层
 */

import type {
  UserLifecycleEvent,
  UserLifecycleEventRecord,
  UserJourney,
  UserJourneyStats,
  UserLifecycleOptions,
} from './userLifecycleTypes'

import {
  USER_LIFECYCLE_VERSION,
  CONVERSION_STAGES,
  CONVERSION_STAGE_CONDITIONS,
} from './userLifecycleTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const USER_LIFECYCLE_ENGINE_VERSION = USER_LIFECYCLE_VERSION

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

const lifecycleStore = new Map<string, UserLifecycleEventRecord[]>()

// ═══════════════════════════════════════════
// 3. 辅助函数
// ═══════════════════════════════════════════

function generateEventId(): string {
  const ts = Date.now()
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `LE-${ts}-${rand}`
}

function determineConversionStage(events: UserLifecycleEventRecord[]): UserJourney['conversionStage'] {
  const eventTypes = new Set(events.map(e => e.event))

  if (eventTypes.has('feedback_submitted')) return 'loyal'
  if (eventTypes.has('payment_made')) return 'paying'
  if (eventTypes.has('report_read') || eventTypes.has('report_shared')) return 'returning'
  if (eventTypes.has('report_generated')) return 'first_report'
  if (eventTypes.has('birth_chart')) return 'registered'
  return 'visitor'
}

// ═══════════════════════════════════════════
// 4. 核心 API
// ═══════════════════════════════════════════

export function recordLifecycleEvent(options: UserLifecycleOptions): UserLifecycleEventRecord {
  const record: UserLifecycleEventRecord = {
    id: generateEventId(),
    userId: options.userId,
    event: options.event,
    reportId: options.reportId ?? null,
    metadata: options.metadata ?? {},
    timestamp: Date.now(),
    sessionId: options.sessionId ?? null,
    device: options.device ?? null,
  }

  const existing = lifecycleStore.get(options.userId) ?? []
  existing.push(record)
  lifecycleStore.set(options.userId, existing)

  return record
}

export function getUserJourney(userId: string): UserJourney {
  const events = lifecycleStore.get(userId) ?? []

  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)

  const reportCount = events.filter(e => e.event === 'report_generated').length
  const feedbackCount = events.filter(e => e.event === 'feedback_submitted').length
  const paymentCount = events.filter(e => e.event === 'payment_made').length
  const shareCount = events.filter(e => e.event === 'report_shared').length

  const firstEventAt = sorted.length > 0 ? sorted[0].timestamp : 0
  const lastEventAt = sorted.length > 0 ? sorted[sorted.length - 1].timestamp : 0
  const retentionDays = firstEventAt > 0 ? Math.floor((lastEventAt - firstEventAt) / (1000 * 60 * 60 * 24)) : 0

  return {
    userId,
    events: sorted,
    firstEventAt,
    lastEventAt,
    totalEvents: events.length,
    reportCount,
    feedbackCount,
    paymentCount,
    shareCount,
    conversionStage: determineConversionStage(events),
    retentionDays,
  }
}

export function getUserJourneyStats(): UserJourneyStats {
  const journeys = getAllJourneys()
  const totalUsers = journeys.length

  const conversionFunnel = getConversionFunnel()

  const totalEvents = journeys.reduce((sum, j) => sum + j.totalEvents, 0)
  const avgEventsPerUser = totalUsers > 0 ? totalEvents / totalUsers : 0

  const totalRetentionDays = journeys.reduce((sum, j) => sum + j.retentionDays, 0)
  const avgRetentionDays = totalUsers > 0 ? totalRetentionDays / totalUsers : 0

  const topEventPaths = getTopEventPaths(10)

  const deviceDistribution = getDeviceDistribution()

  const dailyActiveUsers = buildDailyActiveUsers()

  const userLifecycleStages: Record<string, number> = {}
  for (const journey of journeys) {
    const stage = journey.conversionStage
    userLifecycleStages[stage] = (userLifecycleStages[stage] ?? 0) + 1
  }

  return {
    totalUsers,
    conversionFunnel,
    avgEventsPerUser,
    avgRetentionDays,
    topEventPaths,
    deviceDistribution,
    dailyActiveUsers,
    userLifecycleStages,
  }
}

export function getConversionFunnel(): Record<string, number> {
  const allJourneys = getAllJourneys()
  const funnel: Record<string, number> = {}

  for (const stage of CONVERSION_STAGES) {
    const requiredEvents = CONVERSION_STAGE_CONDITIONS[stage]
    let count = 0
    for (const journey of allJourneys) {
      const eventTypes = new Set(journey.events.map(e => e.event))
      if (requiredEvents.some(e => eventTypes.has(e))) {
        count++
      }
    }
    funnel[stage] = count
  }

  return funnel
}

export function getUsersByStage(stage: string): string[] {
  const journeys = getAllJourneys()
  return journeys
    .filter(j => j.conversionStage === stage)
    .map(j => j.userId)
}

export function getUserRetention(userId: number): number {
  const userIdStr = String(userId)
  const journey = getUserJourney(userIdStr)
  return journey.retentionDays
}

export function getEventCountByType(event: UserLifecycleEvent): number {
  let count = 0
  for (const events of lifecycleStore.values()) {
    count += events.filter(e => e.event === event).length
  }
  return count
}

export function getTopEventPaths(maxPaths: number): Array<{path: string; count: number}> {
  const pathCounts = new Map<string, number>()

  for (const events of lifecycleStore.values()) {
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
    if (sorted.length < 2) continue

    const path = sorted.map(e => e.event).join(' -> ')
    pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1)
  }

  const entries = Array.from(pathCounts.entries())
  entries.sort((a, b) => b[1] - a[1])

  return entries.slice(0, maxPaths).map(([path, count]) => ({ path, count }))
}

export function getDeviceDistribution(): Record<string, number> {
  const dist: Record<string, number> = {}
  for (const events of lifecycleStore.values()) {
    for (const event of events) {
      const device = event.device ?? 'unknown'
      dist[device] = (dist[device] ?? 0) + 1
    }
  }
  return dist
}

export function getAllJourneys(): UserJourney[] {
  const userIds = Array.from(lifecycleStore.keys())
  return userIds.map(uid => getUserJourney(uid))
}

export function resetLifecycleStore(): void {
  lifecycleStore.clear()
  seedLifecycleData()
}

// ═══════════════════════════════════════════
// 5. 辅助：日活统计
// ═══════════════════════════════════════════

function buildDailyActiveUsers(): Array<{date: string; count: number}> {
  const dateUserMap = new Map<string, Set<string>>()

  for (const events of lifecycleStore.values()) {
    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().slice(0, 10)
      const userId = event.userId
      if (!dateUserMap.has(date)) {
        dateUserMap.set(date, new Set())
      }
      dateUserMap.get(date)!.add(userId)
    }
  }

  const entries = Array.from(dateUserMap.entries())
  entries.sort((a, b) => a[0].localeCompare(b[0]))

  return entries.map(([date, userSet]) => ({ date, count: userSet.size }))
}

// ═══════════════════════════════════════════
// 6. 种子数据
// ═══════════════════════════════════════════

function seedLifecycleData(): void {
  const baseTime = 1700000000000

  // 用户1: 完整旅程到 loyal
  recordLifecycleEvent({
    userId: 'user-001',
    event: 'register',
    device: 'web',
    sessionId: 's1',
    metadata: { source: 'wechat_ad' },
  })
  recordLifecycleEvent({
    userId: 'user-001',
    event: 'birth_chart',
    device: 'web',
    sessionId: 's1',
  })
  recordLifecycleEvent({
    userId: 'user-001',
    event: 'report_generated',
    reportId: 'rpt-001',
    device: 'web',
    sessionId: 's1',
  })
  recordLifecycleEvent({
    userId: 'user-001',
    event: 'report_read',
    reportId: 'rpt-001',
    device: 'mobile',
    sessionId: 's2',
  })
  recordLifecycleEvent({
    userId: 'user-001',
    event: 'feedback_submitted',
    reportId: 'rpt-001',
    device: 'mobile',
    sessionId: 's2',
  })

  // 用户2: 到 paying
  recordLifecycleEvent({
    userId: 'user-002',
    event: 'register',
    device: 'mobile',
    sessionId: 's3',
  })
  recordLifecycleEvent({
    userId: 'user-002',
    event: 'birth_chart',
    device: 'mobile',
    sessionId: 's3',
  })
  recordLifecycleEvent({
    userId: 'user-002',
    event: 'report_generated',
    reportId: 'rpt-002',
    device: 'mobile',
    sessionId: 's3',
  })
  recordLifecycleEvent({
    userId: 'user-002',
    event: 'payment_made',
    device: 'mobile',
    sessionId: 's4',
    metadata: { amount: 99 },
  })

  // 用户3: 到 returning
  recordLifecycleEvent({
    userId: 'user-003',
    event: 'register',
    device: 'wechat',
    sessionId: 's5',
  })
  recordLifecycleEvent({
    userId: 'user-003',
    event: 'birth_chart',
    device: 'wechat',
    sessionId: 's5',
  })
  recordLifecycleEvent({
    userId: 'user-003',
    event: 'report_generated',
    reportId: 'rpt-003',
    device: 'wechat',
    sessionId: 's5',
  })
  recordLifecycleEvent({
    userId: 'user-003',
    event: 'report_shared',
    reportId: 'rpt-003',
    device: 'wechat',
    sessionId: 's6',
  })

  // 用户4: 到 first_report
  recordLifecycleEvent({
    userId: 'user-004',
    event: 'register',
    device: 'web',
    sessionId: 's7',
  })
  recordLifecycleEvent({
    userId: 'user-004',
    event: 'birth_chart',
    device: 'web',
    sessionId: 's7',
  })
  recordLifecycleEvent({
    userId: 'user-004',
    event: 'report_generated',
    reportId: 'rpt-004',
    device: 'web',
    sessionId: 's7',
  })

  // 用户5: 到 registered
  recordLifecycleEvent({
    userId: 'user-005',
    event: 'register',
    device: 'unknown',
    sessionId: 's8',
  })
  recordLifecycleEvent({
    userId: 'user-005',
    event: 'birth_chart',
    device: 'unknown',
    sessionId: 's8',
  })
  recordLifecycleEvent({
    userId: 'user-005',
    event: 'login',
    device: 'web',
    sessionId: 's9',
  })
}

// 初始化种子数据
seedLifecycleData()