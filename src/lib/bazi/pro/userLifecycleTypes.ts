/**
 * User Lifecycle Types
 *
 * 职责：定义用户生命周期系统的类型
 */

export type UserLifecycleEvent = 'register' | 'birth_chart' | 'report_generated' | 'report_read' | 'report_shared' | 'payment_made' | 'feedback_submitted' | 'login' | 'logout'

export interface UserLifecycleEventRecord {
  id: string
  userId: string
  event: UserLifecycleEvent
  reportId: string | null
  metadata: Record<string, string | number | boolean>
  timestamp: number
  sessionId: string | null
  device: string | null    // 'web' | 'mobile' | 'wechat' | 'unknown'
}

export interface UserJourney {
  userId: string
  events: UserLifecycleEventRecord[]
  firstEventAt: number
  lastEventAt: number
  totalEvents: number
  reportCount: number
  feedbackCount: number
  paymentCount: number
  shareCount: number
  conversionStage: 'visitor' | 'registered' | 'first_report' | 'returning' | 'paying' | 'loyal'
  retentionDays: number
}

export interface UserJourneyStats {
  totalUsers: number
  conversionFunnel: Record<string, number>
  avgEventsPerUser: number
  avgRetentionDays: number
  topEventPaths: Array<{path: string; count: number}>
  deviceDistribution: Record<string, number>
  dailyActiveUsers: Array<{date: string; count: number}>
  userLifecycleStages: Record<string, number>
}

export interface UserLifecycleOptions {
  userId: string
  event: UserLifecycleEvent
  reportId?: string
  metadata?: Record<string, string | number | boolean>
  sessionId?: string
  device?: string
}

export const USER_LIFECYCLE_VERSION = '1.0.0'

export const CONVERSION_STAGES: string[] = ['visitor', 'registered', 'first_report', 'returning', 'paying', 'loyal']

export const CONVERSION_STAGE_CONDITIONS: Record<string, UserLifecycleEvent[]> = {
  visitor: ['register'],
  registered: ['birth_chart'],
  first_report: ['report_generated'],
  returning: ['report_read', 'report_shared'],
  paying: ['payment_made'],
  loyal: ['feedback_submitted'],
}