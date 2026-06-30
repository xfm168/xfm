/**
 * Knowledge Base - 符号/摆件库 (Symbols & Decorations)
 * 
 * 包含：风水作用、摆放位置、禁忌、古籍来源
 */

export interface SymbolKnowledge {
  id: string
  name: string
  category: SymbolCategory
  element: '木' | '火' | '土' | '金' | '水'
  
  /** 适合摆放位置 */
  suitableLocations: string[]
  
  /** 禁忌位置 */
  avoidLocations: string[]
  
  /** 风水作用 */
  fengShuiEffects: {
    wealth?: string
    health?: string
    career?: string
    relationship?: string
    study?: string
    exorcism?: string
  }
  
  /** 摆放要点 */
  placementTips: string[]
  
  /** 禁忌 */
  taboos: string[]
  
  /** 古籍来源 */
  classicalReferences?: {
    book: string
    quote: string
  }[]
  
  tags: string[]
}

export type SymbolCategory = 
  | 'wealth'        // 招财
  | 'exorcism'      // 化煞
  | 'study'         // 文昌
  | 'relationship'  // 桃花/感情
  | 'health'        // 健康
  | 'general'       // 通用

export const SYMBOLS: SymbolKnowledge[] = [
  {
    id: 'symbol-001',
    name: '貔貅',
    category: 'wealth',
    element: '金',
    suitableLocations: ['客厅', '书房', '办公室', '财位'],
    avoidLocations: ['卧室', '卫生间', '厨房'],
    fengShuiEffects: {
      wealth: '招财进宝，只进不出',
      career: '事业顺利，步步高升',
      exorcism: '辟邪挡煞，保平安',
    },
    placementTips: [
      '头朝门或窗',
      '一对公母最佳',
      '高度不超过人头顶',
      '放在财位效果最佳',
    ],
    taboos: [
      '不放在卧室',
      '不对着厕所',
      '不对着镜子',
      '不开光不启用',
    ],
    classicalReferences: [
      { book: '史记', quote: '貔貅者，龙之九子也，吞万物而不泄。' },
    ],
    tags: ['招财', '金', '神兽', '化煞'],
  },
  {
    id: 'symbol-002',
    name: '金蟾',
    category: 'wealth',
    element: '金',
    suitableLocations: ['客厅', '书房', '办公室', '财位'],
    avoidLocations: ['卧室', '卫生间', '厨房'],
    fengShuiEffects: {
      wealth: '招财进宝，财源广进',
      career: '事业顺利，生意兴隆',
    },
    placementTips: [
      '头朝内，不朝门',
      '放在财位',
      '嘴含钱为佳',
      '三脚金蟾最佳',
    ],
    taboos: [
      '头不朝外',
      '不放在卧室',
      '不对着厕所',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '金蟾吐钱，主财运亨通。' },
    ],
    tags: ['招财', '金', '神兽'],
  },
  {
    id: 'symbol-003',
    name: '文昌塔',
    category: 'study',
    element: '土',
    suitableLocations: ['书房', '客厅', '办公室'],
    avoidLocations: ['卧室', '卫生间'],
    fengShuiEffects: {
      study: '旺学业，助考试',
      career: '事业上升，步步高升',
    },
    placementTips: [
      '放在文昌位',
      '七层或九层最佳',
      '放在书桌左侧',
    ],
    taboos: [
      '不放卧室',
      '不对着厕所',
      '不放在横梁下',
    ],
    classicalReferences: [
      { book: '阳宅三要', quote: '文昌塔置于文昌位，主学业事业双丰收。' },
    ],
    tags: ['文昌', '土', '学业', '事业'],
  },
  {
    id: 'symbol-004',
    name: '铜葫芦',
    category: 'health',
    element: '金',
    suitableLocations: ['客厅', '卧室', '书房'],
    avoidLocations: ['卫生间'],
    fengShuiEffects: {
      health: '保健康，祛病气',
      relationship: '增进感情，夫妻和睦',
      exorcism: '化煞辟邪，保平安',
    },
    placementTips: [
      '放在床头有助健康',
      '挂在门上挡煞',
      '开口葫芦聚气',
    ],
    taboos: [
      '不放在卫生间',
      '不放在厨房',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '葫芦谐音福禄，主健康长寿。' },
    ],
    tags: ['健康', '金', '化煞', '福禄'],
  },
  {
    id: 'symbol-005',
    name: '五帝钱',
    category: 'exorcism',
    element: '金',
    suitableLocations: ['客厅', '玄关', '卧室', '办公室'],
    avoidLocations: ['卫生间', '厨房'],
    fengShuiEffects: {
      wealth: '招财进宝',
      exorcism: '化煞辟邪，挡小人',
      career: '事业顺利',
    },
    placementTips: [
      '挂在门上挡煞',
      '放在钱包里招财',
      '放在枕头下助眠',
      '顺治、康熙、雍正、乾隆、嘉庆',
    ],
    taboos: [
      '不放在厕所',
      '不放在厨房',
      '假钱无效',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '五帝钱集五代盛世之气，主辟邪招财。' },
    ],
    tags: ['化煞', '金', '招财', '古币'],
  },
  {
    id: 'symbol-006',
    name: '八卦镜',
    category: 'exorcism',
    element: '金',
    suitableLocations: ['门外', '窗外', '阳台'],
    avoidLocations: ['室内', '卧室', '客厅'],
    fengShuiEffects: {
      exorcism: '化解外煞，保家宅平安',
    },
    placementTips: [
      '挂在门外或窗外',
      '凸镜化煞',
      '凹镜纳气',
      '平面镜反射',
    ],
    taboos: [
      '不挂在室内',
      '不对着别人家',
      '不挂在卧室',
    ],
    classicalReferences: [
      { book: '阳宅十书', quote: '八卦镜照煞，主化凶为吉。' },
    ],
    tags: ['化煞', '金', '八卦', '外煞'],
  },
  {
    id: 'symbol-007',
    name: '水晶洞',
    category: 'wealth',
    element: '土',
    suitableLocations: ['客厅', '书房', '办公室', '财位'],
    avoidLocations: ['卧室', '卫生间'],
    fengShuiEffects: {
      wealth: '聚财纳气',
      career: '事业顺利',
      health: '净化气场',
    },
    placementTips: [
      '放在财位聚财',
      '洞口朝内',
      '紫水晶洞最佳',
    ],
    taboos: [
      '不放在卧室',
      '洞口不朝外',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '水晶洞聚天地之气，主财运亨通。' },
    ],
    tags: ['招财', '土', '水晶', '聚气'],
  },
  {
    id: 'symbol-008',
    name: '龙凤呈祥',
    category: 'relationship',
    element: '火',
    suitableLocations: ['卧室', '客厅'],
    avoidLocations: ['卫生间', '厨房'],
    fengShuiEffects: {
      relationship: '增进夫妻感情',
      wealth: '龙凤呈祥，财运亨通',
      career: '事业有成',
    },
    placementTips: [
      '放在卧室床头',
      '放在客厅显尊贵',
      '龙左凤右',
    ],
    taboos: [
      '不放在卫生间',
      '不放在厨房',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '龙凤呈祥，主夫妻和睦，家庭幸福。' },
    ],
    tags: ['感情', '火', '龙凤', '吉祥'],
  },
]

export const SYMBOL_COUNT = SYMBOLS.length

export function getSymbolById(id: string): SymbolKnowledge | undefined {
  return SYMBOLS.find(s => s.id === id)
}

export function getSymbolsByCategory(category: SymbolCategory): SymbolKnowledge[] {
  return SYMBOLS.filter(s => s.category === category)
}

export function getSymbolsByLocation(location: string): SymbolKnowledge[] {
  return SYMBOLS.filter(s => 
    s.suitableLocations.some(l => l.includes(location) || location.includes(l))
  )
}
