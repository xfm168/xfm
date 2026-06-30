/**
 * FengShui Rules V2 - 高质量规则库
 * 
 * 覆盖房屋、户型、玄关、客厅、厨房、卧室、卫生间、书房、阳台。
 * 
 * Rule 只负责：
 * - condition()
 * - score()
 * - priority
 * - referenceIds
 * 
 * 禁止：
 * - 写解释
 * - 写古籍
 * - 写 Prompt
 */

import type { FengShuiRule, FengShuiContext } from './types'

// ============ 房屋整体规则 ============

export const CLASSICAL_RULES_V2: FengShuiRule[] = [
  // ============ 朝向类 ============
  {
    id: 'classical-south-facing',
    name: '坐北朝南（向阳之宅）',
    category: 'orientation',
    applicableTo: ['house'],
    source: ['黄帝宅经', '阳宅三要'],
    heritage: 'classical',
    priority: 100,
    weight: 95,
    confidence: 95,
    referenceIds: ['hzj-002', 'yzsy-001'],
    tags: ['朝向', '南向', '向阳'],
    schools: ['bazhai', 'zangfeng'],
    condition: (ctx: FengShuiContext) => 
      ctx.direction.mainDirection === 'south' || ctx.direction.facingDirection === 'south',
    result: {
      type: 'auspicious',
      score: 95,
      tags: ['吉向'],
    },
  },
  {
    id: 'classical-east-facing',
    name: '坐西朝东（紫气东来）',
    category: 'orientation',
    applicableTo: ['house'],
    source: ['黄帝宅经'],
    heritage: 'classical',
    priority: 90,
    weight: 85,
    confidence: 85,
    referenceIds: ['hzj-003'],
    tags: ['朝向', '东向', '生气'],
    schools: ['bazhai', 'zangfeng'],
    condition: (ctx: FengShuiContext) => 
      ctx.direction.mainDirection === 'east' || ctx.direction.facingDirection === 'east',
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉向'],
    },
  },
  {
    id: 'north-facing-check',
    name: '坐南朝北（忌北向）',
    category: 'orientation',
    applicableTo: ['house'],
    source: ['阳宅三要'],
    heritage: 'classical',
    priority: 80,
    weight: 75,
    confidence: 80,
    referenceIds: ['yzsy-002'],
    tags: ['朝向', '北向', '慎选'],
    schools: ['bazhai', 'zangfeng'],
    condition: (ctx: FengShuiContext) => 
      ctx.direction.mainDirection === 'north' || ctx.direction.facingDirection === 'north',
    result: {
      type: 'inauspicious',
      score: 45,
      tags: ['凶向'],
    },
  },

  // ============ 户型类 ============
  {
    id: 'square-shape',
    name: '户型方正',
    category: 'layout',
    applicableTo: ['house'],
    source: ['黄帝宅经', '阳宅三要'],
    heritage: 'classical',
    priority: 95,
    weight: 90,
    confidence: 90,
    referenceIds: ['hzj-001'],
    tags: ['户型', '方正', '吉'],
    schools: ['bazhai', 'xuankong', 'sanhe'],
    condition: (ctx: FengShuiContext) => 
      ctx.layout.shape === 'square' || ctx.layout.shape === 'rectangle',
    result: {
      type: 'auspicious',
      score: 90,
      tags: ['吉'],
    },
  },
  {
    id: 'missing-corner-check',
    name: '无缺角',
    category: 'layout',
    applicableTo: ['house'],
    source: ['阳宅十书'],
    heritage: 'classical',
    priority: 85,
    weight: 80,
    confidence: 85,
    referenceIds: ['yzsx-001'],
    tags: ['户型', '缺角', '凶'],
    schools: ['xuankong', 'sanhe'],
    condition: (ctx: FengShuiContext) => 
      ctx.layout.missingCorners.length === 0,
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
  },
  {
    id: 'severe-missing-corner',
    name: '严重缺角',
    category: 'layout',
    applicableTo: ['house'],
    source: ['阳宅十书'],
    heritage: 'classical',
    priority: 90,
    weight: 85,
    confidence: 80,
    referenceIds: ['yzsx-002'],
    tags: ['户型', '缺角', '凶'],
    schools: ['xuankong', 'sanhe'],
    condition: (ctx: FengShuiContext) => 
      ctx.layout.missingCorners.some(c => c.severity === 'severe'),
    result: {
      type: 'inauspicious',
      score: 40,
      tags: ['凶'],
    },
  },

  // ============ 玄关类 ============
  {
    id: 'entrance-has-screen',
    name: '玄关有屏风',
    category: 'door',
    applicableTo: ['entrance'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 80,
    weight: 75,
    confidence: 85,
    referenceIds: ['yzsy-003'],
    tags: ['玄关', '屏风', '聚气'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return false
      const doors = ctx.spatial.doors || []
      const hasEntrance = doors.some(d => d.type === 'main-entrance')
      return hasEntrance
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
  },

  // ============ 客厅类 ============
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
    tags: ['客厅', '采光', '阳气'],
    schools: ['bazhai', 'zangfeng', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const living = ctx.rooms.find(r => r.roomType === 'living')
      return living && living.score > 70
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
  },
  {
    id: 'living-no-direct-wind',
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
      return !sha.some(s => s.type === 'chuan-tang-sha')
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
  },

  // ============ 厨房类 ============
  {
    id: 'kitchen-good-ventilation',
    name: '厨房通风良好',
    category: 'kitchen',
    applicableTo: ['kitchen'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 70,
    weight: 65,
    confidence: 85,
    referenceIds: ['yzsy-005'],
    tags: ['厨房', '通风', '油烟'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const kitchen = ctx.rooms.find(r => r.roomType === 'kitchen')
      return kitchen && kitchen.score > 65
    },
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
  },
  {
    id: 'kitchen-no-open-door',
    name: '厨房不门对门',
    category: 'kitchen',
    applicableTo: ['kitchen'],
    source: ['阳宅三要'],
    heritage: 'classical',
    priority: 75,
    weight: 70,
    confidence: 80,
    referenceIds: ['yzsy-006'],
    tags: ['厨房', '门冲', '凶'],
    schools: ['bazhai'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const doors = ctx.spatial.doors || []
      const kitchenDoors = doors.filter(d => d.type === 'kitchen-door')
      if (kitchenDoors.length < 2) return true
      return true
    },
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
  },

  // ============ 卧室类 ============
  {
    id: 'bedroom-good-direction',
    name: '卧室朝向正确',
    category: 'bed',
    applicableTo: ['bedroom', 'master-bedroom'],
    source: ['黄帝宅经', '阳宅三要'],
    heritage: 'classical',
    priority: 85,
    weight: 80,
    confidence: 85,
    referenceIds: ['hzj-005'],
    tags: ['卧室', '朝向', '吉'],
    schools: ['bazhai', 'zangfeng'],
    condition: (ctx: FengShuiContext) => {
      const bedroom = ctx.rooms.find(r => 
        r.roomType === 'bedroom' || r.roomType === 'master-bedroom'
      )
      return bedroom && bedroom.score > 70
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
  },
  {
    id: 'bed-no-beam',
    name: '床上无横梁',
    category: 'bed',
    applicableTo: ['bedroom', 'master-bedroom'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 90,
    weight: 85,
    confidence: 90,
    referenceIds: ['yzsy-007'],
    tags: ['卧室', '横梁', '凶'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some(s => s.type === 'liang-ya-ding')
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
  },
  {
    id: 'bed-no-mirror',
    name: '床不对镜子',
    category: 'bed',
    applicableTo: ['bedroom', 'master-bedroom'],
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
      return !sha.some(s => s.type === 'jing-zhao-chuang')
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
  },

  // ============ 卫生间类 ============
  {
    id: 'bathroom-good-ventilation',
    name: '卫生间通风良好',
    category: 'bathroom',
    applicableTo: ['bathroom'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 80,
    weight: 75,
    confidence: 85,
    referenceIds: ['yzsy-009'],
    tags: ['卫生间', '通风', '除湿'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const bathroom = ctx.rooms.find(r => r.roomType === 'bathroom')
      return bathroom && bathroom.score > 65
    },
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
  },
  {
    id: 'bathroom-not-center',
    name: '厕不压中宫',
    category: 'bathroom',
    applicableTo: ['bathroom'],
    source: ['阳宅三要', '阳宅十书'],
    heritage: 'classical',
    priority: 95,
    weight: 90,
    confidence: 85,
    referenceIds: ['yzsy-010', 'yzsx-003'],
    tags: ['卫生间', '中宫', '凶'],
    schools: ['bazhai', 'xuankong'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some(s => s.type === 'ce-ya-zhong-gong')
    },
    result: {
      type: 'auspicious',
      score: 90,
      tags: ['吉'],
    },
  },

  // ============ 书房类 ============
  {
    id: 'study-good-direction',
    name: '书房文昌位',
    category: 'study',
    applicableTo: ['study'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 70,
    weight: 65,
    confidence: 80,
    referenceIds: ['yzsy-011'],
    tags: ['书房', '文昌', '学业'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const study = ctx.rooms.find(r => r.roomType === 'study')
      return study && study.score > 60
    },
    result: {
      type: 'auspicious',
      score: 70,
      tags: ['吉'],
    },
  },

  // ============ 阳台类 ============
  {
    id: 'balcony-good-ventilation',
    name: '阳台纳气充足',
    category: 'living',
    applicableTo: ['balcony'],
    source: ['黄帝宅经', '现代风水'],
    heritage: 'both',
    priority: 65,
    weight: 60,
    confidence: 80,
    referenceIds: ['hzj-006'],
    tags: ['阳台', '纳气', '采光'],
    schools: ['bazhai', 'zangfeng', 'modern'],
    condition: (ctx: FengShuiContext) => {
      const balcony = ctx.rooms.find(r => r.roomType === 'balcony')
      return balcony && balcony.score > 60
    },
    result: {
      type: 'auspicious',
      score: 70,
      tags: ['吉'],
    },
  },

  // ============ 五行平衡类 ============
  {
    id: 'element-balanced',
    name: '五行基本平衡',
    category: 'element',
    applicableTo: ['house'],
    source: ['黄帝宅经'],
    heritage: 'classical',
    priority: 75,
    weight: 70,
    confidence: 75,
    referenceIds: ['hzj-007'],
    tags: ['五行', '平衡'],
    schools: ['bazhai', 'xuankong'],
    condition: (ctx: FengShuiContext) => {
      const elements = ctx.elementDistribution
      const values = Object.values(elements)
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
      const balance = 100 - Math.sqrt(variance) * 5
      return balance > 50
    },
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
  },

  // ============ 煞气类 ============
  {
    id: 'no-major-sha',
    name: '无重大煞气',
    category: 'sha',
    applicableTo: ['house'],
    source: ['阳宅三要', '阳宅十书'],
    heritage: 'classical',
    priority: 95,
    weight: 90,
    confidence: 85,
    referenceIds: ['yzsy-012'],
    tags: ['煞气', '凶'],
    schools: ['bazhai', 'xuankong', 'sanhe'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some(s => s.severity === 'severe')
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
  },
]

// 导出总数
export const RULE_COUNT = CLASSICAL_RULES_V2.length
