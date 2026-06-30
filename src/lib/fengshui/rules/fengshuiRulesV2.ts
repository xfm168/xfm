/**
 * 风水分析规则 V2 - Knowledge Base 架构
 * 
 * Rule 只负责：
 * - condition() 条件判断
 * - score() 分数计算
 * - referenceId 关联知识库
 * 
 * Explain 全部交给 Explain Engine
 */

import type { 
  FengShuiRule, 
  FengShuiContext, 
  FengShuiCategory,
  RuleLayer,
  FengShuiSchool,
} from '../types'

// ============ 第一层：古籍核心理论（60%权重） ============

export const CLASSICAL_RULES_V2: FengShuiRule[] = [
  // --- 朝向类 ---
  {
    id: 'classical-south-facing',
    name: '坐北朝南（向阳之宅）',
    category: '朝向',
    
    source: ['黄帝宅经', '阳宅三要'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['bazhai', 'zangfeng'],
    
    priority: 100,
    weight: 95,
    confidence: 95,
    
    referenceIds: ['hzj-002', 'hzj-001'],
    
    condition: (ctx: FengShuiContext) => 
      ctx.direction.mainDirection === 'south' || ctx.direction.facingDirection === 'south',
    
    result: {
      type: 'auspicious',
      score: 95,
      explanation: '坐北朝南为向阳之宅，纳阳气充足，主宅运兴旺',
      classicalRef: '',  // 留空，从知识库读取
      practicalAdvice: '', // 留空，从知识库读取
    },
    
    tags: ['door', 'direction', 'auspicious', 'classical'],
  },
  
  {
    id: 'classical-cang-feng',
    name: '藏风聚气',
    category: '户型',
    
    source: ['黄帝宅经', '葬经'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['zangfeng', 'sanhe'],
    
    priority: 95,
    weight: 90,
    confidence: 90,
    
    referenceIds: ['hzj-003', 'zang-jing-001', 'yzss-001'],
    
    condition: (ctx: FengShuiContext) => 
      (ctx.layout.shape === 'square' || ctx.layout.shape === 'rectangle') &&
      ctx.layout.missingCorners.length <= 1,
    
    result: {
      type: 'auspicious',
      score: 88,
      explanation: '户型方正，藏风聚气，气场稳定，主宅运平稳',
      classicalRef: '',
      practicalAdvice: '',
    },
    
    tags: ['layout', 'cangfeng', 'classical', 'auspicious'],
  },
  
  {
    id: 'classical-men-zhu-zao',
    name: '门主灶三合',
    category: '布局',
    
    source: ['阳宅三要', '阳宅十书'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['bazhai', 'zangfeng'],
    
    priority: 100,
    weight: 95,
    confidence: 92,
    
    referenceIds: ['yzsy-001', 'yzsy-002', 'yzsy-003'],
    
    condition: (ctx: FengShuiContext) => {
      const hasKitchen = ctx.rooms.some(r => r.type === 'kitchen')
      const hasLiving = ctx.rooms.some(r => r.type === 'living')
      const hasBedroom = ctx.rooms.some(r => r.type === 'master-bedroom' || r.type === 'secondary-bedroom')
      return hasKitchen && hasLiving && hasBedroom
    },
    
    result: {
      type: 'neutral',
      score: 75,
      explanation: '门、主、灶为阳宅三要，三者齐备则宅运有根基',
      classicalRef: '',
      practicalAdvice: '',
    },
    
    tags: ['layout', 'men-zhu-zao', 'classical', 'fundamental'],
  },
]

// ============ 第二层：实战案例规则（25%权重） ============

export const PRACTICAL_RULES_V2: FengShuiRule[] = [
  {
    id: 'practical-lu-chong',
    name: '路冲煞',
    category: '环境',
    
    source: ['阳宅大成', '王公阳宅断验'],
    heritage: 'verified',
    layer: 'practical',
    schools: ['zangfeng', 'sanhe'],
    
    priority: 90,
    weight: 85,
    confidence: 88,
    
    referenceIds: [],
    
    condition: (ctx: FengShuiContext) => 
      ctx.nearbyRoads > 0 || ctx.nearbyTJunction === true,
    
    result: {
      type: 'inauspicious',
      score: 45,
      explanation: '住宅面临路冲，气流直冲，主财运不稳，健康受损',
      classicalRef: '',
      practicalAdvice: '',
    },
    
    tags: ['sha', 'lu-chong', 'inauspicious', 'practical'],
  },
  
  {
    id: 'practical-beam-press',
    name: '横梁压顶',
    category: '房间',
    
    source: ['王公阳宅断验', '民间断验经验'],
    heritage: 'verified',
    layer: 'practical',
    schools: ['modern', 'zangfeng'],
    
    priority: 85,
    weight: 80,
    confidence: 90,
    
    condition: (ctx: FengShuiContext) => {
      const bedrooms = ctx.rooms.filter(r => 
        r.type === 'master-bedroom' || 
        r.type === 'secondary-bedroom' ||
        r.type === 'children-bedroom' ||
        r.type === 'study'
      )
      return bedrooms.length > 0
    },
    
    result: {
      type: 'inauspicious',
      score: 60,
      explanation: '横梁压顶为常见煞气，长期受压影响运势和健康',
      classicalRef: '',
      practicalAdvice: '',
    },
    
    tags: ['sha', 'beam', 'bedroom', 'inauspicious', 'practical'],
  },
  
  {
    id: 'practical-chuan-tang',
    name: '穿堂煞',
    category: '布局',
    
    source: ['阳宅大成', '王公阳宅断验'],
    heritage: 'verified',
    layer: 'practical',
    schools: ['zangfeng', 'bazhai'],
    
    priority: 88,
    weight: 82,
    confidence: 85,
    
    condition: (ctx: FengShuiContext) => 
      ctx.rooms.some(r => r.hasBalcony) && 
      ctx.direction.doorDirection === 'south',
    
    result: {
      type: 'inauspicious',
      score: 55,
      explanation: '大门直对阳台或窗户，形成穿堂煞，财气直进直出',
      classicalRef: '',
      practicalAdvice: '',
    },
    
    tags: ['sha', 'chuan-tang', 'wealth', 'inauspicious', 'practical'],
  },
]

// ============ 第三层：现代住宅规则（15%权重） ============

export const MODERN_RULES_V2: FengShuiRule[] = [
  {
    id: 'modern-high-rise',
    name: '高层住宅楼层选择',
    category: '环境',
    
    source: ['现代住宅玄空风水', '城市阳宅布局宝典'],
    heritage: 'modern',
    layer: 'modern',
    schools: ['modern', 'xuankong'],
    
    priority: 75,
    weight: 70,
    confidence: 75,
    
    condition: (ctx: FengShuiContext) => 
      ctx.houseType === 'apartment' && 
      ctx.totalFloors > 20,
    
    result: {
      type: 'neutral',
      score: 70,
      explanation: '高层住宅视野开阔，但地气相对较弱，需注意与命主五行匹配',
      classicalRef: '',
      practicalAdvice: '',
    },
    
    tags: ['apartment', 'high-rise', 'modern', 'floor'],
  },
  
  {
    id: 'modern-light-ventilation',
    name: '采光通风',
    category: '环境',
    
    source: ['图解阳宅风水大全', '现代住宅风水'],
    heritage: 'modern',
    layer: 'modern',
    schools: ['modern', 'zangfeng'],
    
    priority: 78,
    weight: 75,
    confidence: 80,
    
    condition: (ctx: FengShuiContext) => 
      ctx.rooms.filter(r => r.hasWindow).length >= Math.ceil(ctx.rooms.length / 2),
    
    result: {
      type: 'auspicious',
      score: 80,
      explanation: '采光充足，通风良好，气场流通顺畅，利于健康',
      classicalRef: '',
      practicalAdvice: '',
    },
    
    tags: ['light', 'ventilation', 'health', 'modern', 'auspicious'],
  },
]

// ============ 导出全部规则 ============

export const FENGSHUI_RULES_V2: FengShuiRule[] = [
  ...CLASSICAL_RULES_V2,
  ...PRACTICAL_RULES_V2,
  ...MODERN_RULES_V2,
]

// 层级权重
export const LAYER_WEIGHTS_V2 = {
  classical: 0.6,
  practical: 0.25,
  modern: 0.15,
}
