/**
 * Bedroom Rules - 次卧/儿童房规则
 * 
 * 涵盖：床位、学习、睡眠、成长、采光、通风、收纳、空间利用
 */

import type { FengShuiRule, FengShuiContext } from '../../types'

export const BEDROOM_RULES: FengShuiRule[] = [
  {
    id: 'bedroom-bed-position',
    name: '床位合理',
    category: 'bed',
    applicableTo: ['bedroom'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 85,
    weight: 80,
    confidence: 85,
    referenceIds: ['yzsy-007'],
    tags: ['卧室', '床', '吉'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const bedroom = ctx.rooms.find(r => r.roomType === 'bedroom')
      return !!(bedroom && bedroom.score > 65)
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
    impact: { health: 4, sleep: 5, study: 2 },
    improvement: '床头靠墙，床不对门',
  },
  {
    id: 'bedroom-good-lighting',
    name: '卧室采光适中',
    category: 'bed',
    applicableTo: ['bedroom'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 70,
    weight: 65,
    confidence: 85,
    referenceIds: ['xd-020'],
    tags: ['卧室', '采光', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
    impact: { health: 3, sleep: 4 },
    improvement: '使用遮光窗帘调节光线',
  },
  {
    id: 'bedroom-tidy',
    name: '卧室整洁',
    category: 'bed',
    applicableTo: ['bedroom'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 65,
    weight: 60,
    confidence: 80,
    referenceIds: ['xd-021'],
    tags: ['卧室', '整洁', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'auspicious',
      score: 70,
      tags: ['吉'],
    },
    impact: { health: 3, sleep: 3 },
    improvement: '保持卧室整洁',
  },
  {
    id: 'bedroom-good-ventilation',
    name: '卧室通风良好',
    category: 'bed',
    applicableTo: ['bedroom'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 70,
    weight: 65,
    confidence: 85,
    referenceIds: ['xd-022'],
    tags: ['卧室', '通风', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { health: 4, sleep: 3 },
    improvement: '保持空气流通',
  },
]
