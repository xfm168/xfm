/**
 * Entrance Rules - 玄关规则
 * 
 * 涵盖：开门见厅、开门见灶、开门见厕、玄关聚气、鞋柜、采光、通风、尺寸、植物
 */

import type { FengShuiRule, FengShuiContext } from '../../types'

export const ENTRANCE_RULES: FengShuiRule[] = [
  {
    id: 'entrance-has-vestibule',
    name: '玄关有缓冲',
    category: 'door',
    applicableTo: ['entrance'],
    source: ['阳宅三要', '现代风水'],
    heritage: 'both',
    priority: 90,
    weight: 85,
    confidence: 90,
    referenceIds: ['yzsy-003'],
    tags: ['玄关', '聚气', '吉'],
    schools: ['bazhai', 'modern'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return false
      const doors = ctx.spatial.doors || []
      const hasMainEntrance = doors.some((d: any) => d.type === 'main-entrance')
      return hasMainEntrance
    },
    result: {
      type: 'auspicious',
      score: 85,
      tags: ['吉'],
    },
    impact: { wealth: 5, career: 3 },
    improvement: '设置玄关柜或屏风',
  },
  {
    id: 'entrance-no-kitchen-direct',
    name: '开门不见灶',
    category: 'kitchen',
    applicableTo: ['entrance'],
    source: ['阳宅三要', '阳宅十书'],
    heritage: 'classical',
    priority: 85,
    weight: 80,
    confidence: 85,
    referenceIds: ['yzsy-006', 'yzsx-005'],
    tags: ['玄关', '开门见灶', '凶'],
    schools: ['bazhai'],
    condition: (ctx: FengShuiContext) => {
      if (!ctx.spatial) return true
      const sha = ctx.spatial.spatialSha || []
      return !sha.some((s: any) => s.type === 'men-chong-zao')
    },
    result: {
      type: 'auspicious',
      score: 80,
      tags: ['吉'],
    },
    impact: { wealth: 4, health: 2 },
    improvement: '设置玄关遮挡',
  },
  {
    id: 'entrance-no-bathroom-direct',
    name: '开门不见厕',
    category: 'bathroom',
    applicableTo: ['entrance'],
    source: ['阳宅三要'],
    heritage: 'classical',
    priority: 80,
    weight: 75,
    confidence: 85,
    referenceIds: ['yzsy-010'],
    tags: ['玄关', '开门见厕', '凶'],
    schools: ['bazhai', 'xuankong'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
    impact: { health: 3, wealth: -2 },
    improvement: '设置玄关或门帘',
  },
  {
    id: 'entrance-no-mirror',
    name: '玄关不对镜',
    category: 'door',
    applicableTo: ['entrance'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 75,
    weight: 70,
    confidence: 80,
    referenceIds: ['xd-001'],
    tags: ['玄关', '镜子', '凶'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'neutral',
      score: 70,
      tags: ['平'],
    },
    impact: { wealth: -2 },
    improvement: '调整镜子位置',
  },
  {
    id: 'entrance-good-lighting',
    name: '玄关采光充足',
    category: 'door',
    applicableTo: ['entrance'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 70,
    weight: 65,
    confidence: 85,
    referenceIds: ['xd-002'],
    tags: ['玄关', '采光', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'auspicious',
      score: 75,
      tags: ['吉'],
    },
    impact: { wealth: 3, career: 2 },
    improvement: '增加照明',
  },
  {
    id: 'entrance-tidy',
    name: '玄关整洁',
    category: 'door',
    applicableTo: ['entrance'],
    source: ['现代风水'],
    heritage: 'modern',
    priority: 65,
    weight: 60,
    confidence: 80,
    referenceIds: ['xd-003'],
    tags: ['玄关', '整洁', '吉'],
    schools: ['modern'],
    condition: (ctx: FengShuiContext) => true,
    result: {
      type: 'auspicious',
      score: 70,
      tags: ['吉'],
    },
    impact: { wealth: 2, career: 2 },
    improvement: '保持整洁，定期清理',
  },
]
