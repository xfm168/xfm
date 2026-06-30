/**
 * House Rules - 房屋整体规则
 * 
 * 涵盖：朝向、户型、缺角、整体风水
 */

import type { FengShuiRule, FengShuiContext } from '../../types'

export const HOUSE_RULES: FengShuiRule[] = [
  // === 朝向类 ===
  {
    id: 'house-orientation-south',
    name: '坐北朝南（向阳之宅）',
    category: 'orientation',
    applicableTo: ['house'],
    source: ['黄帝宅经', '阳宅三要'],
    heritage: 'classical',
    priority: 100,
    weight: 95,
    confidence: 95,
    referenceIds: ['hzj-002', 'yzsy-001'],
    tags: ['朝向', '南向', '向阳', '吉'],
    schools: ['bazhai', 'zangfeng'],
    condition: (ctx: FengShuiContext) => 
      ctx.direction.mainDirection === 'south' || ctx.direction.facingDirection === 'south',
    result: {
      type: 'auspicious',
      score: 95,
      tags: ['吉向'],
    },
    impact: {
      health: 5,
      wealth: 3,
      career: 2,
    },
    improvement: '保持良好采光',
  },
  {
    id: 'house-orientation-east',
    name: '坐西朝东（紫气东来）',
    category: 'orientation',
    applicableTo: ['house'],
    source: ['黄帝宅经'],
    heritage: 'classical',
    priority: 90,
    weight: 85,
    confidence: 85,
    referenceIds: ['hzj-003'],
    tags: ['朝向', '东向', '生气', '吉'],
    schools: ['bazhai', 'zangfeng'],
    condition: (ctx: FengShuiContext) => 
      ctx.direction.mainDirection === 'east' || ctx.direction.facingDirection === 'east',
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉向'],
    },
    impact: {
      health: 3,
      wealth: 2,
      career: 4,
    },
    improvement: '保持晨光入室',
  },
  {
    id: 'house-orientation-north-bad',
    name: '坐南朝北（阴气重）',
    category: 'orientation',
    applicableTo: ['house'],
    source: ['阳宅三要'],
    heritage: 'classical',
    priority: 80,
    weight: 75,
    confidence: 80,
    referenceIds: ['yzsy-002'],
    tags: ['朝向', '北向', '凶'],
    schools: ['bazhai', 'zangfeng'],
    condition: (ctx: FengShuiContext) => 
      ctx.direction.mainDirection === 'north' || ctx.direction.facingDirection === 'north',
    result: {
      type: 'inauspicious',
      score: 45,
      tags: ['凶向'],
    },
    impact: {
      health: -5,
      wealth: -3,
      career: -2,
    },
    improvement: '增加暖色调装饰，加强照明',
  },

  // === 户型类 ===
  {
    id: 'house-shape-square',
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
    impact: {
      health: 3,
      wealth: 5,
      career: 3,
      relationship: 2,
    },
    improvement: '保持空间规整',
  },
  {
    id: 'house-no-missing-corner',
    name: '无缺角',
    category: 'layout',
    applicableTo: ['house'],
    source: ['阳宅十书'],
    heritage: 'classical',
    priority: 85,
    weight: 80,
    confidence: 85,
    referenceIds: ['yzsx-001'],
    tags: ['户型', '缺角', '吉'],
    schools: ['xuankong', 'sanhe'],
    condition: (ctx: FengShuiContext) => 
      ctx.layout.missingCorners.length === 0,
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: {
      health: 2,
      wealth: 4,
      career: 3,
    },
    improvement: '保持户型完整',
  },
  {
    id: 'house-severe-missing-corner',
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
    impact: {
      health: -4,
      wealth: -5,
      career: -3,
    },
    improvement: '补角化解，如泰山石敢当',
  },

  // === 整体类 ===
  {
    id: 'house-element-balance',
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
    impact: {
      health: 2,
      wealth: 2,
      career: 2,
      relationship: 2,
    },
    improvement: '保持五行调和',
  },
  {
    id: 'house-no-major-sha',
    name: '无重大煞气',
    category: 'sha',
    applicableTo: ['house'],
    source: ['阳宅三要', '阳宅十书'],
    heritage: 'classical',
    priority: 95,
    weight: 90,
    confidence: 85,
    referenceIds: ['yzsy-012'],
    tags: ['煞气', '吉'],
    schools: ['bazhai', 'xuankong', 'sanhe'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.severity === 'severe')
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: {
      health: 5,
      wealth: 4,
      career: 3,
    },
    improvement: '保持气场纯净',
  },
]
