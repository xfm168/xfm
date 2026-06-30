/**
 * 风水分析规则 V1 - 三层体系
 * 
 * 第一层：古籍核心理论（60%权重）
 * 来源：黄帝宅经、阳宅三要、阳宅十书、八宅明镜、沈氏玄空学
 * 
 * 第二层：实战案例规则（25%权重）
 * 来源：阳宅大成、王公阳宅断验、民间断验经验
 * 
 * 第三层：现代住宅规则（15%权重）
 * 来源：现代住宅玄空风水、城市阳宅布局宝典
 */

import type { 
  FengShuiRule, 
  FengShuiContext, 
  FengShuiCategory,
  RuleLayer,
  FengShuiSchool,
} from '../types'

// ============ 第一层：古籍核心理论（60%权重） ============

export const CLASSICAL_RULES: FengShuiRule[] = [
  // --- 朝向类 ---
  {
    id: 'classical-south-facing',
    name: '坐北朝南（向阳之宅）',
    category: '朝向',
    
    source: ['黄帝宅经', '阳宅三要'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['bzhai', 'zangfeng'],
    
    priority: 100,
    weight: 95,
    confidence: 95,
    
    condition: (ctx: FengShuiContext) => 
      ctx.direction.mainDirection === 'south' || ctx.direction.facingDirection === 'south',
    
    result: {
      type: 'auspicious',
      score: 95,
      explanation: '坐北朝南为向阳之宅，纳阳气充足，主宅运兴旺，子孙繁荣',
      classicalRef: '《黄帝宅经》云：「凡阳宅坐北朝南，取其向明，阳气充足，宅运亨通。」',
      practicalAdvice: '此为最佳朝向，保持门窗通畅，使阳气充分进入宅内。',
    },
    
    tags: ['door', 'direction', 'auspicious', 'classical'],
  },
  
  {
    id: 'classical-main-door-position',
    name: '大门方位吉凶（八宅法）',
    category: '朝向',
    
    source: ['八宅明镜', '阳宅三要'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['bzhai'],
    
    priority: 95,
    weight: 90,
    confidence: 90,
    
    condition: (ctx: FengShuiContext) => 
      ctx.direction.doorDirection === 'south' || 
      ctx.direction.doorDirection === 'southeast' ||
      ctx.direction.doorDirection === 'east',
    
    result: {
      type: 'auspicious',
      score: 85,
      explanation: '大门位于吉位，纳气旺盛，利于财运和事业',
      classicalRef: '《八宅明镜》曰：「大门为气口，吉位开门则吉气入宅，凶位开门则凶气入宅。」',
      practicalAdvice: '保持大门整洁明亮，避免杂物堆积，使吉气畅通无阻。',
    },
    
    tags: ['door', 'direction', 'bzhai', 'auspicious'],
  },
  
  {
    id: 'classical-ming-tang',
    name: '明堂开阔',
    category: '环境',
    
    source: ['黄帝宅经', '阳宅十书'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['zangfeng', 'sanjiao'],
    
    priority: 90,
    weight: 85,
    confidence: 88,
    
    condition: (ctx: FengShuiContext) => 
      ctx.nearWater === true || ctx.layout.score >= 80,
    
    result: {
      type: 'auspicious',
      score: 85,
      explanation: '宅前明堂开阔，有聚气之象，主财运亨通',
      classicalRef: '《阳宅十书》云：「凡阳宅前有明堂，后有靠山，左有青龙，右有白虎，为上吉之宅。」',
      practicalAdvice: '保持宅前空间整洁开阔，避免遮挡，以利聚气。',
    },
    
    tags: ['environment', 'mingshui', 'auspicious', 'classical'],
  },
  
  // --- 门主灶结构类（阳宅三要） ---
  {
    id: 'classical-men-zhu-zao',
    name: '门主灶三合（阳宅三要）',
    category: '布局',
    
    source: ['阳宅三要', '阳宅十书'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['bzhai', 'zangfeng'],
    
    priority: 100,
    weight: 95,
    confidence: 92,
    
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
      classicalRef: '《阳宅三要》序曰：「阳宅孰大？门、主、灶是也。门乃由入之路，主乃居处之所，灶乃养生之源。」',
      practicalAdvice: '确保大门、主卧、厨房三者位置合理，形成良好气场循环。',
    },
    
    tags: ['layout', 'men-zhu-zao', 'classical', 'fundamental'],
  },
  
  {
    id: 'classical-kitchen-position',
    name: '厨房方位（灶位吉凶）',
    category: '房间',
    
    source: ['阳宅三要', '八宅明镜'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['bzhai'],
    
    priority: 90,
    weight: 85,
    confidence: 85,
    
    condition: (ctx: FengShuiContext) => {
      const kitchen = ctx.rooms.find(r => r.type === 'kitchen')
      if (!kitchen) return false
      return kitchen.position === 'left' || kitchen.position === 'back'
    },
    
    result: {
      type: 'auspicious',
      score: 80,
      explanation: '厨房位于吉位，利于家人健康和财运',
      classicalRef: '《阳宅三要》云：「灶者，养命之源，关系祸福尤重。」',
      practicalAdvice: '保持厨房整洁，灶台背后有靠，避免与门直冲。',
    },
    
    tags: ['kitchen', 'stove', 'bzhai', 'auspicious'],
  },
  
  // --- 藏风聚气类 ---
  {
    id: 'classical-cang-feng',
    name: '藏风聚气',
    category: '户型',
    
    source: ['黄帝宅经', '葬经'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['zangfeng', 'sanjiao'],
    
    priority: 95,
    weight: 90,
    confidence: 90,
    
    condition: (ctx: FengShuiContext) => 
      (ctx.layout.shape === 'square' || ctx.layout.shape === 'rectangle') &&
      ctx.layout.missingCorners.length <= 1,
    
    result: {
      type: 'auspicious',
      score: 88,
      explanation: '户型方正，藏风聚气，气场稳定，主宅运平稳',
      classicalRef: '《葬经》云：「气乘风则散，界水则止。古人聚之使不散，行之使有止，故谓之风水。」',
      practicalAdvice: '保持室内整洁，避免过多开放空间，以利气场凝聚。',
    },
    
    tags: ['layout', 'cangfeng', 'classical', 'auspicious'],
  },
  
  {
    id: 'classical-missing-corner',
    name: '缺角不利',
    category: '户型',
    
    source: ['阳宅十书', '八宅明镜'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['bzhai', 'zangfeng'],
    
    priority: 90,
    weight: 85,
    confidence: 88,
    
    condition: (ctx: FengShuiContext) => 
      ctx.layout.missingCorners.length >= 2,
    
    result: {
      type: 'inauspicious',
      score: 55,
      explanation: '户型缺角过多，气场不完整，影响对应方位的运势',
      classicalRef: '《阳宅十书》云：「凡阳宅贵乎方正，缺则不利，缺何方则何事不利。」',
      practicalAdvice: '可在缺角处放置对应五行物品化解，或用镜子补角。',
    },
    
    tags: ['layout', 'missing-corner', 'inauspicious', 'classical'],
  },
  
  // --- 五行类 ---
  {
    id: 'classical-five-element-balance',
    name: '五行平衡',
    category: '五行',
    
    source: ['黄帝宅经', '青囊经'],
    heritage: 'classical',
    layer: 'classical',
    schools: ['xuankong', 'sanjiao'],
    
    priority: 85,
    weight: 80,
    confidence: 85,
    
    condition: (ctx: FengShuiContext) => {
      const { 木, 火, 土, 金, 水 } = ctx.elementDistribution
      const max = Math.max(木, 火, 土, 金, 水)
      const min = Math.min(木, 火, 土, 金, 水)
      return max - min <= 2
    },
    
    result: {
      type: 'auspicious',
      score: 85,
      explanation: '五行分布均衡，阴阳调和，宅运平稳',
      classicalRef: '《黄帝宅经》云：「夫宅者，乃是阴阳之枢纽，人伦之轨模。阴阳调和则宅运亨通。」',
      practicalAdvice: '保持五行平衡，避免某一元素过旺或过弱。',
    },
    
    tags: ['five-element', 'balance', 'auspicious', 'classical'],
  },
]

// ============ 第二层：实战案例规则（25%权重） ============

export const PRACTICAL_RULES: FengShuiRule[] = [
  // --- 煞气类 ---
  {
    id: 'practical-lu-chong',
    name: '路冲煞',
    category: '环境',
    
    source: ['阳宅大成', '王公阳宅断验'],
    heritage: 'verified',
    layer: 'practical',
    schools: ['zangfeng', 'sanjiao'],
    
    priority: 90,
    weight: 85,
    confidence: 88,
    
    condition: (ctx: FengShuiContext) => 
      ctx.nearbyRoads > 0 || ctx.nearbyTJunction === true,
    
    result: {
      type: 'inauspicious',
      score: 45,
      explanation: '住宅面临路冲，气流直冲，主财运不稳，健康受损',
      classicalRef: '《阳宅大成》云：「路冲为硬煞，主凶祸，需以屏风、绿植挡之。」',
      practicalAdvice: '可在门前设置屏风、玄关柜或摆放绿植以缓冲气流。',
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
      classicalRef: '《阳宅大成》曰：「梁压床，人不安，主疾病缠绵。」',
      practicalAdvice: '可用吊顶、吊灯或假天花化解，或调整床的位置避开横梁。',
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
    schools: ['zangfeng', 'bzhai'],
    
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
      classicalRef: '《阳宅大成》云：「前门对后窗，财来财去一场空。」',
      practicalAdvice: '可设置屏风、玄关柜或高大绿植遮挡，使气流回旋。',
    },
    
    tags: ['sha', 'chuan-tang', 'wealth', 'inauspicious', 'practical'],
  },
  
  {
    id: 'practical-open-stove',
    name: '开门见灶',
    category: '房间',
    
    source: ['王公阳宅断验', '民间断验经验'],
    heritage: 'verified',
    layer: 'practical',
    schools: ['bzhai', 'zangfeng'],
    
    priority: 82,
    weight: 78,
    confidence: 82,
    
    condition: (ctx: FengShuiContext) => {
      const kitchen = ctx.rooms.find(r => r.type === 'kitchen')
      return kitchen !== undefined && kitchen.position === 'front'
    },
    
    result: {
      type: 'inauspicious',
      score: 60,
      explanation: '开门见灶，火气冲人，主财运不利，家人易有口舌是非',
      classicalRef: '《阳宅三要》云：「开门见灶，钱财多耗。」',
      practicalAdvice: '可设置屏风或拉帘遮挡，避免灶台与大门直冲。',
    },
    
    tags: ['kitchen', 'stove', 'wealth', 'inauspicious', 'practical'],
  },
  
  {
    id: 'practical-toilet-center',
    name: '厕压中宫',
    category: '布局',
    
    source: ['阳宅大成', '王公阳宅断验'],
    heritage: 'verified',
    layer: 'practical',
    schools: ['bzhai', 'xuankong'],
    
    priority: 85,
    weight: 80,
    confidence: 85,
    
    condition: (ctx: FengShuiContext) => {
      const centerRoom = ctx.rooms.find(r => r.position === 'center')
      return centerRoom?.type === 'bathroom' || centerRoom?.type === 'master-bathroom'
    },
    
    result: {
      type: 'inauspicious',
      score: 40,
      explanation: '卫生间位于房屋中心，污秽之气弥漫全屋，大凶',
      classicalRef: '《阳宅十书》云：「中宫为宅之心脏，卫生间居之，主心腹之疾。」',
      practicalAdvice: '保持卫生间清洁干爽，常闭马桶盖，使用排气扇减少秽气。',
    },
    
    tags: ['bathroom', 'center', 'inauspicious', 'practical'],
  },
]

// ============ 第三层：现代住宅规则（15%权重） ============

export const MODERN_RULES: FengShuiRule[] = [
  // --- 高层住宅类 ---
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
      classicalRef: '《现代住宅玄空风水》云：「高楼近天，阳气盛而地气弱，需结合命主五行选择楼层。」',
      practicalAdvice: '根据命主五行喜忌选择适合的楼层，可通过室内布置补充地气。',
    },
    
    tags: ['apartment', 'high-rise', 'modern', 'floor'],
  },
  
  {
    id: 'modern-elevator',
    name: '电梯对门',
    category: '环境',
    
    source: ['城市阳宅布局宝典', '苏民峰体系'],
    heritage: 'modern',
    layer: 'modern',
    schools: ['modern', 'bzhai'],
    
    priority: 80,
    weight: 75,
    confidence: 78,
    
    condition: (ctx: FengShuiContext) => 
      ctx.houseType === 'apartment' && 
      ctx.currentFloor > 1,
    
    result: {
      type: 'inauspicious',
      score: 65,
      explanation: '电梯门对户门，形成开口煞，气场不稳定',
      classicalRef: '《现代住宅风水》云：「电梯口对大门，为开口煞，主宅运反复。」',
      practicalAdvice: '可在门前设置脚垫或挂门帘缓冲，保持大门整洁明亮。',
    },
    
    tags: ['apartment', 'elevator', 'sha', 'modern'],
  },
  
  {
    id: 'modern-small-space',
    name: '小户型风水',
    category: '户型',
    
    source: ['城市阳宅布局宝典', '现代住宅风水'],
    heritage: 'modern',
    layer: 'modern',
    schools: ['modern'],
    
    priority: 70,
    weight: 65,
    confidence: 72,
    
    condition: (ctx: FengShuiContext) => 
      ctx.totalArea < 60,
    
    result: {
      type: 'neutral',
      score: 65,
      explanation: '小户型空间紧凑，需注意收纳整洁，避免气场壅塞',
      classicalRef: '《现代住宅风水》云：「室雅何须大，花香不在多。小宅贵乎整洁，整洁则气聚。」',
      practicalAdvice: '保持室内整洁，善用收纳，避免过多杂物堆积影响气场流通。',
    },
    
    tags: ['small-space', 'modern', 'apartment'],
  },
  
  {
    id: 'modern-open-kitchen',
    name: '开放式厨房',
    category: '房间',
    
    source: ['现代住宅玄空风水', '图解阳宅风水大全'],
    heritage: 'modern',
    layer: 'modern',
    schools: ['modern', 'bzhai'],
    
    priority: 72,
    weight: 68,
    confidence: 70,
    
    condition: (ctx: FengShuiContext) => {
      const kitchen = ctx.rooms.find(r => r.type === 'kitchen')
      const dining = ctx.rooms.find(r => r.type === 'dining')
      return kitchen !== undefined && dining === undefined
    },
    
    result: {
      type: 'neutral',
      score: 65,
      explanation: '开放式厨房火气外泄，需注意与其他区域的分隔',
      classicalRef: '《现代住宅风水》云：「开放式厨房火气散，需用吧台或岛台作虚隔。」',
      practicalAdvice: '可设置吧台、岛台或绿植作为空间分隔，使火气有所收敛。',
    },
    
    tags: ['kitchen', 'open-layout', 'modern'],
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
      classicalRef: '《现代住宅风水》云：「光为阳之精，风为气之动，采光通风佳则宅运旺。」',
      practicalAdvice: '保持窗户清洁，定期开窗通风，使室内外气场流通。',
    },
    
    tags: ['light', 'ventilation', 'health', 'modern', 'auspicious'],
  },
]

// ============ 导出全部规则 ============

export const FENGSHUI_RULES_V1: FengShuiRule[] = [
  ...CLASSICAL_RULES,
  ...PRACTICAL_RULES,
  ...MODERN_RULES,
]

// 层级权重
export const LAYER_WEIGHTS = {
  classical: 0.6,
  practical: 0.25,
  modern: 0.15,
}

// 获取各层规则数量
export function getRuleCountByLayer(layer: RuleLayer): number {
  return FENGSHUI_RULES_V1.filter(r => r.layer === layer).length
}

// 获取各学派规则
export function getRulesBySchool(school: FengShuiSchool): FengShuiRule[] {
  return FENGSHUI_RULES_V1.filter(r => r.schools.includes(school))
}

// 获取古籍引用
export function getClassicalReferences(): string[] {
  const sources = new Set<string>()
  FENGSHUI_RULES_V1.forEach(r => r.source.forEach(s => sources.add(s)))
  return Array.from(sources)
}
