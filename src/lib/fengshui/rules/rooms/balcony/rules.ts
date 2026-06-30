/**
 * Balcony Rules - 阳台规则
 * 
 * 涵盖：纳气、采光、植物、洗衣机、杂物、封阳台、聚气
 */

import type { FengShuiRule, FengShuiContext } from '../../types'

export const BALCONY_RULES: FengShuiRule[] = [
  {
    id: 'balcony-good-qi',
    name: '阳台纳气充足',
    category: 'living',
    applicableTo: ['balcony'],
    source: ['黄帝宅经', '现代风水'],
    heritage: 'both',
    priority: 75,
    weight: 70,
    confidence: 85,
    referenceIds: ['hzj-006'],
    tags: ['阳台', '纳气', '采光', '吉'],
    schools: ['bazhai', 'zangfeng', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const balcony = ctx.rooms.find(r => r.roomType === 'balcony')
      return !!(balcony && balcony.score > 60)
    },
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { wealth: 4, health: 3, career: 2 },
    improvement: '保持阳台开阔',
  },
  {
    id: 'balcony-plants-good',
    name: '阳台植物得当',
    category: 'living',
    applicableTo: ['balcony'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 70,
    weight: 65,
    confidence: 80,
    referenceIds: ['xd-018'],
    tags: ['阳台', '植物', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
    impact: { health: 3, wealth: 2 },
    improvement: '阳台摆放绿植增强生气',
  },
  {
    id: 'balcony-not-cluttered',
    name: '阳台不堆杂物',
    category: 'living',
    applicableTo: ['balcony'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 65,
    weight: 60,
    confidence: 80,
    referenceIds: ['xd-019'],
    tags: ['阳台', '整洁', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
    impact: { wealth: 2, health: 2 },
    improvement: '保持阳台整洁，不堆杂物',
  },
  {
    id: 'balcony-no-cross-wind',
    name: '阳台不形成穿堂',
    category: 'living',
    applicableTo: ['balcony'],
    source: ['阳宅三要'],
    heritage: 'classical',
    priority: 80,
    weight: 75,
    confidence: 85,
    referenceIds: ['yzsy-004'],
    tags: ['阳台', '穿堂', '凶'],
    schools: ['bazhai'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'chuan-tang-sha')
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
    impact: { wealth: 5, health: 2 },
    improvement: '设置窗帘或绿植缓冲',
  },
]
