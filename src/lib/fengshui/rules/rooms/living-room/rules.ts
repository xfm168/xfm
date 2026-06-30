/**
 * Living Room Rules - 客厅规则
 * 
 * 涵盖：沙发朝向、靠山、电视位置、财位、明堂、聚气、梁压沙发、镜照客厅、采光、通风、动线
 */

import type { FengShuiRule, FengShuiContext } from '../../types'

export const LIVING_ROOM_RULES: FengShuiRule[] = [
  {
    id: 'living-sofa-has-back',
    name: '沙发有靠山',
    category: 'living',
    applicableTo: ['living'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 90,
    weight: 85,
    confidence: 90,
    referenceIds: ['yzsy-013'],
    tags: ['客厅', '沙发', '靠山', '吉'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const living = ctx.rooms.find(r => r.roomType === 'living')
      return !!(living && living.score > 70)
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: { career: 5, wealth: 4, benefactor: 3 },
    improvement: '沙发靠墙摆放',
  },
  {
    id: 'living-good-lighting',
    name: '客厅采光充足',
    category: 'living',
    applicableTo: ['living'],
    source: ['黄帝宅经', '现代风水'],
    heritage: 'both',
    priority: 75,
    weight: 70,
    confidence: 90,
    referenceIds: ['hzj-004'],
    tags: ['客厅', '采光', '阳气', '吉'],
    schools: ['bazhai', 'zangfeng', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const living = ctx.rooms.find(r => r.roomType === 'living')
      return !!(living && living.score > 70)
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
    impact: { health: 4, wealth: 3, career: 2 },
    improvement: '保持采光充足',
  },
  {
    id: 'living-no-cross-wind',
    name: '客厅无穿堂风',
    category: 'living',
    applicableTo: ['living'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 85,
    weight: 80,
    confidence: 85,
    referenceIds: ['yzsy-004'],
    tags: ['客厅', '穿堂', '凶'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'chuan-tang-sha')
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: { wealth: 5, career: 3 },
    improvement: '设置玄关或屏风',
  },
  {
    id: 'living-mingtang-open',
    name: '明堂开阔',
    category: 'living',
    applicableTo: ['living'],
    source: ['黄帝宅经', '阳宅三要'],
    heritage: 'classical',
    priority: 80,
    weight: 75,
    confidence: 85,
    referenceIds: ['hzj-008', 'yzsy-014'],
    tags: ['客厅', '明堂', '聚气', '吉'],
    schools: ['bazhai', 'zangfeng'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.features) return false
      return ctx.features.qi?.mingTang > 60
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
    impact: { wealth: 4, career: 4, benefactor: 3 },
    improvement: '保持客厅开阔',
  },
  {
    id: 'living-no-beam-sofa',
    name: '沙发无横梁压顶',
    category: 'living',
    applicableTo: ['living'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 85,
    weight: 80,
    confidence: 85,
    referenceIds: ['yzsy-007'],
    tags: ['客厅', '横梁', '凶'],
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
    impact: { health: 4, career: 3 },
    improvement: '吊顶遮挡横梁',
  },
  {
    id: 'living-good-ventilation',
    name: '客厅通风良好',
    category: 'living',
    applicableTo: ['living'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 70,
    weight: 65,
    confidence: 85,
    referenceIds: ['xd-004'],
    tags: ['客厅', '通风', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { health: 3, wealth: 1 },
    improvement: '保持空气流通',
  },
  {
    id: 'living-tv-sofa-layout',
    name: '电视与沙发布局合理',
    category: 'living',
    applicableTo: ['living'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 65,
    weight: 60,
    confidence: 80,
    referenceIds: ['xd-005'],
    tags: ['客厅', '布局', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
    impact: { relationship: 2 },
    improvement: '沙发与电视保持适当距离',
  },
  {
    id: 'living-wealth-position',
    name: '客厅财位洁净明亮',
    category: 'living',
    applicableTo: ['living'],
    source: ['阳宅三要', '八宅明镜'],
    heritage: 'classical',
    priority: 95,
    weight: 90,
    confidence: 85,
    referenceIds: ['yzsy-002', 'bzjm-008'],
    tags: ['客厅', '财位', '财运', '吉'],
    schools: ['bazhai', 'sanhe'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.features) return false
      return ctx.features.qi?.wealthPosition > 70
    },
    result: {
      type: 'auspicious',
      score: 90,
      tags: ['吉'],
    },
    impact: { wealth: 5, career: 2 },
    improvement: '明财位保持整洁明亮，可放置聚宝盆或发财树',
  },
  {
    id: 'living-sofa-not-facing-door',
    name: '沙发不直冲门',
    category: 'living',
    applicableTo: ['living'],
    source: ['阳宅三要', '黄帝宅经'],
    heritage: 'both',
    priority: 80,
    weight: 75,
    confidence: 85,
    referenceIds: ['yzsy-015', 'hzj-012'],
    tags: ['客厅', '沙发', '门', '凶'],
    schools: ['bazhai', 'zangfeng', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'sofa-chong-men')
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
    impact: { wealth: 3, relationship: 2 },
    improvement: '调整沙发位置，避免与大门直冲，或设置屏风遮挡',
  },
  {
    id: 'living-sofa-not-back-to-window',
    name: '沙发不背窗',
    category: 'living',
    applicableTo: ['living'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 75,
    weight: 70,
    confidence: 80,
    referenceIds: ['yzsy-016', 'xd-006'],
    tags: ['客厅', '沙发', '窗户', '凶'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'sofa-bei-chuang')
    },
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { career: 4, wealth: 2, benefactor: 3 },
    improvement: '沙发靠墙摆放，若无法靠墙可摆放矮柜或绿植作为靠山',
  },
  {
    id: 'living-beam-press',
    name: '客厅无横梁压顶',
    category: 'living',
    applicableTo: ['living'],
    source: ['阳宅三要', '葬书'],
    heritage: 'classical',
    priority: 88,
    weight: 82,
    confidence: 88,
    referenceIds: ['yzsy-007', 'zs-003'],
    tags: ['客厅', '横梁', '煞气', '凶'],
    schools: ['bazhai', 'sanhe', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'heng-liang-ya-ding')
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: { health: 4, career: 3, wealth: 2 },
    improvement: '用吊顶包裹横梁，或在横梁下挂开光葫芦化解',
  },
  {
    id: 'living-mirror-not-facing-sofa',
    name: '镜子不对沙发',
    category: 'living',
    applicableTo: ['living'],
    source: ['黄帝宅经', '现代风水'],
    heritage: 'both',
    priority: 70,
    weight: 65,
    confidence: 80,
    referenceIds: ['hzj-015', 'xd-007'],
    tags: ['客厅', '镜子', '沙发', '凶'],
    schools: ['bazhai', 'xuankong', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'jing-zhao-shou')
    },
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { relationship: 4, health: 2 },
    improvement: '移动镜子位置，或用布帘遮盖，避免镜子正对沙发',
  },
  {
    id: 'living-gather-qi',
    name: '客厅方正聚气',
    category: 'living',
    applicableTo: ['living'],
    source: ['黄帝宅经', '葬书'],
    heritage: 'classical',
    priority: 85,
    weight: 80,
    confidence: 90,
    referenceIds: ['hzj-003', 'zs-005'],
    tags: ['客厅', '聚气', '方正', '缺角', '吉'],
    schools: ['bazhai', 'zangfeng', 'sanyuan'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.layout) return false
      const shape = ctx.layout.shape
      const missingCorners = ctx.layout.missingCorners || []
      return (shape === 'square' || shape === 'rectangle') && missingCorners.length === 0
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: { wealth: 4, career: 3, relationship: 2, health: 2 },
    improvement: '缺角处摆放泰山石敢当或绿植，化解缺角煞气',
  },
  {
    id: 'living-smooth-flow',
    name: '客厅动线流畅',
    category: 'living',
    applicableTo: ['living'],
    source: ['黄帝宅经', '现代风水'],
    heritage: 'both',
    priority: 72,
    weight: 68,
    confidence: 82,
    referenceIds: ['hzj-010', 'xd-008'],
    tags: ['客厅', '动线', '流畅', '吉'],
    schools: ['modern', 'zangfeng'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.features) return false
      return ctx.features.qi?.flow > 60
    },
    result: {
      type: 'auspicious',
      score: 78,
      tags: ['吉'],
    },
    impact: { wealth: 3, career: 2, health: 2 },
    improvement: '保持过道畅通，避免家具阻挡动线，使气流顺畅',
  },
]
