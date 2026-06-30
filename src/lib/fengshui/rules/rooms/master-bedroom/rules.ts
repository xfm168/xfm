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
  {
    id: 'master-bed-head-no-door',
    name: '床头不冲门',
    category: 'bed',
    applicableTo: ['master-bedroom'],
    source: ['阳宅三要', '八宅明镜'],
    heritage: 'classical',
    priority: 92,
    weight: 88,
    confidence: 90,
    referenceIds: ['yzsy-015', 'bzmj-009'],
    tags: ['主卧', '床头', '门冲', '凶'],
    schools: ['bazhai', 'sanhe'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'chuang-tou-chong-men')
    },
    result: {
      type: 'auspicious',
      score: 88,
      tags: ['吉'],
    },
    impact: { health: 4, relationship: 5, sleep: 4 },
    improvement: '调整床位使床头避开门冲，或设置屏风、玄关遮挡',
  },
  {
    id: 'master-bed-head-no-toilet',
    name: '床头不靠厕所',
    category: 'bed',
    applicableTo: ['master-bedroom'],
    source: ['阳宅三要', '黄帝宅经', '现代风水'],
    heritage: 'both',
    priority: 88,
    weight: 85,
    confidence: 88,
    referenceIds: ['yzsy-012', 'hzj-008'],
    tags: ['主卧', '床头', '厕所', '煞气', '凶'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'ce-suo-chong-chuang')
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: { health: 5, wealth: 2, sleep: 4 },
    improvement: '移动床位远离厕所墙，或在床头与厕所之间放置绿植化解',
  },
  {
    id: 'master-bed-under-no-clutter',
    name: '主卧床下不堆杂物',
    category: 'bed',
    applicableTo: ['master-bedroom'],
    source: ['现代风水', '藏风派'],
    heritage: 'both',
    priority: 72,
    weight: 68,
    confidence: 82,
    referenceIds: ['xd-008', 'zangfeng-003'],
    tags: ['主卧', '床下', '杂物', '聚气', '凶'],
    schools: ['zangfeng', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.features) return true
      return !ctx.features.bedUnderClutter
    },
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { health: 3, relationship: 3, sleep: 4, wealth: 2 },
    improvement: '清空床下杂物，保持气场通畅，利于聚气纳财',
  },
  {
    id: 'master-bed-no-ac',
    name: '床不对空调',
    category: 'bed',
    applicableTo: ['master-bedroom'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 78,
    weight: 72,
    confidence: 80,
    referenceIds: ['xd-012'],
    tags: ['主卧', '空调', '风煞', '健康', '凶'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.features) return true
      return !ctx.features.acFacingBed
    },
    result: {
      type: 'auspicious',
      score: 78,
      tags: ['吉'],
    },
    impact: { health: 5, sleep: 4 },
    improvement: '调整空调出风口方向，避免直吹床铺，或加装挡风板',
  },
  {
    id: 'master-bed-no-tv',
    name: '床不对电视',
    category: 'bed',
    applicableTo: ['master-bedroom'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 75,
    weight: 70,
    confidence: 78,
    referenceIds: ['xd-015'],
    tags: ['主卧', '电视', '辐射', '感情', '凶'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.features) return true
      return !ctx.features.tvFacingBed
    },
    result: {
      type: 'auspicious',
      score: 72,
      tags: ['吉'],
    },
    impact: { relationship: 4, sleep: 3, health: 2 },
    improvement: '将电视移出卧室，或使用布帘遮盖，减少电磁辐射影响',
  },
  {
    id: 'master-couple-position',
    name: '主卧夫妻位左右平衡',
    category: 'bed',
    applicableTo: ['master-bedroom'],
    source: ['八宅明镜', '阳宅十书'],
    heritage: 'classical',
    priority: 85,
    weight: 82,
    confidence: 85,
    referenceIds: ['bzmj-012', 'yzsx-007'],
    tags: ['主卧', '夫妻位', '平衡', '感情', '吉'],
    schools: ['bazhai', 'sanhe'],
    condition: (ctx: FengShuiContext) => {
      const bedroom = ctx.rooms.find(r => r.roomType === 'master-bedroom')
      return !!(bedroom && bedroom.score > 70)
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: { relationship: 5, health: 2, wealth: 2 },
    improvement: '床头左右对称摆放床头柜，保持夫妻位平衡，促进感情和谐',
  },
  {
    id: 'master-peach-blossom',
    name: '主卧桃花位',
    category: 'bed',
    applicableTo: ['master-bedroom'],
    source: ['八宅明镜', '三合风水'],
    heritage: 'classical',
    priority: 80,
    weight: 75,
    confidence: 78,
    referenceIds: ['bzmj-015', 'sanhe-008'],
    tags: ['主卧', '桃花位', '感情', '人缘', '吉'],
    schools: ['bazhai', 'sanhe'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 72,
      tags: ['平'],
    },
    impact: { relationship: 5, career: 2 },
    improvement: '根据命卦确定桃花位，摆放鲜花或水晶，增进夫妻感情与人缘',
  },
]
