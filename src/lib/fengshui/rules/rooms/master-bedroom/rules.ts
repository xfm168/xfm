/**
 * Master Bedroom Rules - 主卧规则
 * 
 * 涵盖：床头方向、靠山、靠窗、靠厕、镜照床、梁压床、床冲门、夫妻位、桃花位、采光、通风
 */

import type { FengShuiRule, FengShuiContext } from '../../types'

export const MASTER_BEDROOM_RULES: FengShuiRule[] = [
  {
    id: 'bed-head-against-wall',
    name: '床头靠墙（有靠山）',
    category: 'bed',
    applicableTo: ['master-bedroom', 'bedroom'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 95,
    weight: 90,
    confidence: 92,
    referenceIds: ['yzsy-007'],
    tags: ['卧室', '床', '靠山', '吉'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const bedroom = ctx.rooms.find(r => 
        r.roomType === 'master-bedroom' || r.roomType === 'bedroom'
      )
      return !!(bedroom && bedroom.score > 65)
    },
    result: {
      type: 'auspicious',
      score: 90,
      tags: ['吉'],
    },
    impact: { health: 5, relationship: 4, career: 2 },
    improvement: '床头必须靠墙',
  },
  {
    id: 'bed-no-beam',
    name: '床上无横梁',
    category: 'bed',
    applicableTo: ['master-bedroom', 'bedroom'],
    source: ['阳宅三要', '阳宅十书', '现代风水'],
    heritage: 'both',
    priority: 90,
    weight: 85,
    confidence: 90,
    referenceIds: ['yzsy-007', 'yzsx-004'],
    tags: ['卧室', '横梁', '凶'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'liang-ya-ding')
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: { health: 5, relationship: 3, career: 2 },
    improvement: '吊顶遮挡或调整床位',
  },
  {
    id: 'bed-no-mirror',
    name: '床不对镜子',
    category: 'bed',
    applicableTo: ['master-bedroom', 'bedroom'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 85,
    weight: 80,
    confidence: 85,
    referenceIds: ['yzsy-008'],
    tags: ['卧室', '镜子', '凶'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'jing-zhao-chuang')
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
    impact: { health: 3, relationship: 4 },
    improvement: '移动镜子或用布帘遮挡',
  },
  {
    id: 'bed-no-door-chong',
    name: '床不对门冲',
    category: 'bed',
    applicableTo: ['master-bedroom', 'bedroom'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 80,
    weight: 75,
    confidence: 85,
    referenceIds: ['yzsy-015'],
    tags: ['卧室', '门冲', '凶'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'men-chong-chuang')
    },
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { health: 3, relationship: 2 },
    improvement: '调整床位或设置隔断',
  },
  {
    id: 'bed-good-direction',
    name: '床头朝向正确',
    category: 'bed',
    applicableTo: ['master-bedroom', 'bedroom'],
    source: ['黄帝宅经', '八宅明镜'],
    heritage: 'classical',
    priority: 75,
    weight: 70,
    confidence: 80,
    referenceIds: ['hzj-005', 'bzmj-001'],
    tags: ['卧室', '朝向', '吉'],
    schools: ['bazhai'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
    impact: { health: 3, relationship: 3, sleep: 4 },
    improvement: '根据命卦调整床头朝向',
  },
  {
    id: 'bedroom-good-lighting',
    name: '卧室采光适中',
    category: 'bed',
    applicableTo: ['master-bedroom', 'bedroom'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 70,
    weight: 65,
    confidence: 85,
    referenceIds: ['xd-006'],
    tags: ['卧室', '采光', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { health: 3, sleep: 4 },
    improvement: '使用遮光窗帘调节光线',
  },
  {
    id: 'bedroom-good-ventilation',
    name: '卧室通风良好',
    category: 'bed',
    applicableTo: ['master-bedroom', 'bedroom'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 70,
    weight: 65,
    confidence: 85,
    referenceIds: ['xd-007'],
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
  {
    id: 'bed-no-under-clutter',
    name: '床下无杂物',
    category: 'bed',
    applicableTo: ['master-bedroom', 'bedroom'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 65,
    weight: 60,
    confidence: 80,
    referenceIds: ['xd-008'],
    tags: ['卧室', '整洁', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
    impact: { health: 2, sleep: 3 },
    improvement: '保持床下整洁',
  },
]
