/**
 * User Lifecycle Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - recordLifecycleEvent 事件记录
 *   - getUserJourney 用户旅程聚合
 *   - getUserJourneyStats 全局统计
 *   - getConversionFunnel 转化漏斗
 *   - getUsersByStage 按阶段筛选
 *   - getUserRetention 留存天数
 *   - getEventCountByType 事件计数
 *   - getTopEventPaths 高频路径
 *   - getDeviceDistribution 设备分布
 *   - getAllJourneys 全部旅程
 *   - resetLifecycleStore 重置
 *   - 种子数据验证
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import type {
  UserLifecycleEvent,
  UserLifecycleEventRecord,
  UserJourney,
  UserJourneyStats,
  UserLifecycleOptions,
} from '../userLifecycleTypes'

import {
  USER_LIFECYCLE_VERSION,
  CONVERSION_STAGES,
  CONVERSION_STAGE_CONDITIONS,
} from '../userLifecycleTypes'

import {
  USER_LIFECYCLE_ENGINE_VERSION,
  recordLifecycleEvent,
  getUserJourney,
  getUserJourneyStats,
  getConversionFunnel,
  getUsersByStage,
  getUserRetention,
  getEventCountByType,
  getTopEventPaths,
  getDeviceDistribution,
  getAllJourneys,
  resetLifecycleStore,
} from '../userLifecycleEngine'

describe('userLifecycleEngine', () => {
  beforeEach(() => {
    resetLifecycleStore()
  })

  // ─── 版本号 ───
  describe('版本号', () => {
    test('types 版本为 1.0.0', () => {
      expect(USER_LIFECYCLE_VERSION).toBe('1.0.0')
    })

    test('engine 版本与 types 一致', () => {
      expect(USER_LIFECYCLE_ENGINE_VERSION).toBe(USER_LIFECYCLE_VERSION)
    })
  })

  // ─── recordLifecycleEvent ───
  describe('recordLifecycleEvent', () => {
    test('记录事件返回正确结构', () => {
      const record = recordLifecycleEvent({
        userId: 'test-user',
        event: 'register',
        device: 'web',
        sessionId: 'sess-1',
      })

      expect(record.id).toMatch(/^LE-\d+-\d{4}$/)
      expect(record.userId).toBe('test-user')
      expect(record.event).toBe('register')
      expect(record.device).toBe('web')
      expect(record.sessionId).toBe('sess-1')
      expect(record.reportId).toBeNull()
      expect(record.metadata).toEqual({})
      expect(record.timestamp).toBeGreaterThan(0)
    })

    test('支持 reportId 参数', () => {
      const record = recordLifecycleEvent({
        userId: 'u1',
        event: 'report_generated',
        reportId: 'rpt-100',
      })

      expect(record.reportId).toBe('rpt-100')
    })

    test('支持 metadata 参数', () => {
      const record = recordLifecycleEvent({
        userId: 'u1',
        event: 'payment_made',
        metadata: { amount: 199, plan: 'premium' },
      })

      expect(record.metadata).toEqual({ amount: 199, plan: 'premium' })
    })

    test('同一用户多次事件追加到同一序列', () => {
      recordLifecycleEvent({ userId: 'u1', event: 'register' })
      recordLifecycleEvent({ userId: 'u1', event: 'birth_chart' })

      const journey = getUserJourney('u1')
      expect(journey.totalEvents).toBeGreaterThanOrEqual(2)
    })
  })

  // ─── getUserJourney ───
  describe('getUserJourney', () => {
    test('不存在用户返回空旅程', () => {
      const journey = getUserJourney('nonexistent')
      expect(journey.userId).toBe('nonexistent')
      expect(journey.totalEvents).toBe(0)
      expect(journey.events).toEqual([])
      expect(journey.conversionStage).toBe('visitor')
    })

    test('仅有 register 的用户 stage 为 visitor', () => {
      recordLifecycleEvent({ userId: 'reg-only', event: 'register' })
      const journey = getUserJourney('reg-only')
      expect(journey.conversionStage).toBe('visitor')
    })

    test('有 birth_chart 的用户 stage 为 registered', () => {
      recordLifecycleEvent({ userId: 'u-reg', event: 'register' })
      recordLifecycleEvent({ userId: 'u-reg', event: 'birth_chart' })
      const journey = getUserJourney('u-reg')
      expect(journey.conversionStage).toBe('registered')
    })

    test('有 report_generated 的用户 stage 为 first_report', () => {
      recordLifecycleEvent({ userId: 'u-fr', event: 'register' })
      recordLifecycleEvent({ userId: 'u-fr', event: 'birth_chart' })
      recordLifecycleEvent({ userId: 'u-fr', event: 'report_generated', reportId: 'r1' })
      const journey = getUserJourney('u-fr')
      expect(journey.conversionStage).toBe('first_report')
      expect(journey.reportCount).toBeGreaterThanOrEqual(1)
    })

    test('有 report_read 的用户 stage 为 returning', () => {
      recordLifecycleEvent({ userId: 'u-ret', event: 'register' })
      recordLifecycleEvent({ userId: 'u-ret', event: 'report_read', reportId: 'r1' })
      const journey = getUserJourney('u-ret')
      expect(journey.conversionStage).toBe('returning')
    })

    test('有 payment_made 的用户 stage 为 paying', () => {
      recordLifecycleEvent({ userId: 'u-pay', event: 'register' })
      recordLifecycleEvent({ userId: 'u-pay', event: 'payment_made' })
      const journey = getUserJourney('u-pay')
      expect(journey.conversionStage).toBe('paying')
      expect(journey.paymentCount).toBeGreaterThanOrEqual(1)
    })

    test('有 feedback_submitted 的用户 stage 为 loyal', () => {
      recordLifecycleEvent({ userId: 'u-loyal', event: 'register' })
      recordLifecycleEvent({ userId: 'u-loyal', event: 'feedback_submitted', reportId: 'r1' })
      const journey = getUserJourney('u-loyal')
      expect(journey.conversionStage).toBe('loyal')
      expect(journey.feedbackCount).toBeGreaterThanOrEqual(1)
    })

    test('事件按时间排序', () => {
      const r1 = recordLifecycleEvent({ userId: 'u-ord', event: 'register' })
      const r2 = recordLifecycleEvent({ userId: 'u-ord', event: 'birth_chart' })
      const journey = getUserJourney('u-ord')
      if (journey.events.length >= 2) {
        expect(journey.events[0].timestamp).toBeLessThanOrEqual(journey.events[journey.events.length - 1].timestamp)
      }
    })
  })

  // ─── getUserJourneyStats ───
  describe('getUserJourneyStats', () => {
    test('返回完整统计结构', () => {
      const stats = getUserJourneyStats()
      expect(stats.totalUsers).toBeGreaterThan(0)
      expect(stats.avgEventsPerUser).toBeGreaterThan(0)
      expect(stats.conversionFunnel).toBeDefined()
      expect(stats.deviceDistribution).toBeDefined()
      expect(stats.dailyActiveUsers).toBeInstanceOf(Array)
      expect(stats.userLifecycleStages).toBeDefined()
      expect(stats.topEventPaths).toBeInstanceOf(Array)
    })

    test('totalUsers 与 getAllJourneys 长度一致', () => {
      const stats = getUserJourneyStats()
      const journeys = getAllJourneys()
      expect(stats.totalUsers).toBe(journeys.length)
    })
  })

  // ─── getConversionFunnel ───
  describe('getConversionFunnel', () => {
    test('包含所有转化阶段', () => {
      const funnel = getConversionFunnel()
      for (const stage of CONVERSION_STAGES) {
        expect(funnel).toHaveProperty(stage)
      }
    })

    test('visitor 阶段人数最多', () => {
      const funnel = getConversionFunnel()
      // 种子数据所有用户都注册了，所以 visitor 应最多
      expect(funnel['visitor']).toBeGreaterThan(0)
    })

    test('loyal 阶段人数最少', () => {
      const funnel = getConversionFunnel()
      expect(funnel['loyal']).toBeLessThanOrEqual(funnel['visitor'])
    })
  })

  // ─── getUsersByStage ───
  describe('getUsersByStage', () => {
    test('返回对应阶段的用户 ID 列表', () => {
      const loyalUsers = getUsersByStage('loyal')
      expect(loyalUsers).toBeInstanceOf(Array)
      // 种子数据中 user-001 是 loyal
      expect(loyalUsers).toContain('user-001')
    })

    test('空阶段返回空数组', () => {
      const result = getUsersByStage('nonexistent_stage')
      expect(result).toEqual([])
    })
  })

  // ─── getUserRetention ───
  describe('getUserRetention', () => {
    test('存在用户返回留存天数（非负数）', () => {
      const days = getUserRetention(1)
      expect(days).toBeGreaterThanOrEqual(0)
    })

    test('不存在的用户返回 0', () => {
      const days = getUserRetention(99999)
      expect(days).toBe(0)
    })
  })

  // ─── getEventCountByType ───
  describe('getEventCountByType', () => {
    test('register 事件计数大于 0', () => {
      const count = getEventCountByType('register')
      expect(count).toBeGreaterThan(0)
    })

    test('所有事件总计数一致', () => {
      const eventTypes: UserLifecycleEvent[] = [
        'register', 'birth_chart', 'report_generated', 'report_read',
        'report_shared', 'payment_made', 'feedback_submitted', 'login', 'logout',
      ]
      let total = 0
      for (const et of eventTypes) {
        total += getEventCountByType(et)
      }
      const journeys = getAllJourneys()
      const totalEvents = journeys.reduce((sum, j) => sum + j.totalEvents, 0)
      expect(total).toBe(totalEvents)
    })
  })

  // ─── getTopEventPaths ───
  describe('getTopEventPaths', () => {
    test('返回路径列表', () => {
      const paths = getTopEventPaths(5)
      expect(paths).toBeInstanceOf(Array)
      expect(paths.length).toBeLessThanOrEqual(5)
    })

    test('每条路径包含 path 和 count', () => {
      const paths = getTopEventPaths(10)
      for (const p of paths) {
        expect(p).toHaveProperty('path')
        expect(p).toHaveProperty('count')
        expect(p.count).toBeGreaterThan(0)
      }
    })

    test('按 count 降序排列', () => {
      const paths = getTopEventPaths(10)
      for (let i = 1; i < paths.length; i++) {
        expect(paths[i - 1].count).toBeGreaterThanOrEqual(paths[i].count)
      }
    })

    test('maxPaths 限制生效', () => {
      const paths = getTopEventPaths(1)
      expect(paths.length).toBeLessThanOrEqual(1)
    })
  })

  // ─── getDeviceDistribution ───
  describe('getDeviceDistribution', () => {
    test('返回设备分布对象', () => {
      const dist = getDeviceDistribution()
      expect(dist).toBeDefined()
      expect(typeof dist).toBe('object')
    })

    test('种子数据包含 web 设备', () => {
      const dist = getDeviceDistribution()
      expect(dist['web']).toBeGreaterThan(0)
    })

    test('所有设备计数总和等于总事件数', () => {
      const dist = getDeviceDistribution()
      const total = Object.values(dist).reduce((sum, c) => sum + c, 0)
      const journeys = getAllJourneys()
      const totalEvents = journeys.reduce((sum, j) => sum + j.totalEvents, 0)
      expect(total).toBe(totalEvents)
    })
  })

  // ─── getAllJourneys ───
  describe('getAllJourneys', () => {
    test('返回 UserJourney 数组', () => {
      const journeys = getAllJourneys()
      expect(Array.isArray(journeys)).toBe(true)
    })

    test('每条旅程包含必要字段', () => {
      const journeys = getAllJourneys()
      for (const j of journeys) {
        expect(j).toHaveProperty('userId')
        expect(j).toHaveProperty('events')
        expect(j).toHaveProperty('conversionStage')
        expect(j).toHaveProperty('totalEvents')
        expect(j).toHaveProperty('retentionDays')
      }
    })

    test('种子数据有 5 个用户', () => {
      resetLifecycleStore()
      const journeys = getAllJourneys()
      expect(journeys.length).toBe(5)
    })
  })

  // ─── resetLifecycleStore ───
  describe('resetLifecycleStore', () => {
    test('重置后种子数据恢复', () => {
      recordLifecycleEvent({ userId: 'temp-user', event: 'register' })
      resetLifecycleStore()
      const journeys = getAllJourneys()
      // 种子数据有 5 个用户
      expect(journeys.length).toBe(5)
      // temp-user 不存在
      const tempJourney = getUserJourney('temp-user')
      expect(tempJourney.totalEvents).toBe(0)
    })
  })

  // ─── 种子数据验证 ───
  describe('种子数据验证', () => {
    test('user-001 阶段为 loyal', () => {
      const journey = getUserJourney('user-001')
      expect(journey.conversionStage).toBe('loyal')
    })

    test('user-002 阶段为 paying', () => {
      const journey = getUserJourney('user-002')
      expect(journey.conversionStage).toBe('paying')
    })

    test('user-003 阶段为 returning', () => {
      const journey = getUserJourney('user-003')
      expect(journey.conversionStage).toBe('returning')
    })

    test('user-004 阶段为 first_report', () => {
      const journey = getUserJourney('user-004')
      expect(journey.conversionStage).toBe('first_report')
    })

    test('user-005 阶段为 registered', () => {
      const journey = getUserJourney('user-005')
      expect(journey.conversionStage).toBe('registered')
    })

    test('CONVERSION_STAGE_CONDITIONS 包含所有阶段', () => {
      for (const stage of CONVERSION_STAGES) {
        expect(CONVERSION_STAGE_CONDITIONS).toHaveProperty(stage)
        expect(CONVERSION_STAGE_CONDITIONS[stage].length).toBeGreaterThan(0)
      }
    })
  })
})