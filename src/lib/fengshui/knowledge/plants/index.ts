/**
 * Knowledge Base - 植物库 (Plants)
 * 
 * 包含：适合位置、禁忌位置、五行、作用、古籍来源、现代解释
 */

export interface PlantKnowledge {
  id: string
  name: string
  alias?: string[]
  element: '木' | '火' | '土' | '金' | '水'
  category: PlantCategory
  
  /** 适合位置 */
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
  }
  
  /** 注意事项 */
  notes: string[]
  
  /** 古籍来源 */
  classicalReferences?: {
    book: string
    quote: string
  }[]
  
  /** 现代解释 */
  modernExplanation: string
  
  /** 养护难度 */
  careDifficulty: 'easy' | 'medium' | 'hard'
  
  /** 光照需求 */
  lightRequirement: 'low' | 'medium' | 'high'
  
  tags: string[]
}

export type PlantCategory = 
  | 'wealth'       // 招财
  | 'health'       // 健康
  | 'exorcism'     // 化煞
  | 'study'        // 文昌
  | 'relationship' // 桃花
  | 'general'      // 通用

export const PLANTS: PlantKnowledge[] = [
  {
    id: 'plant-001',
    name: '发财树',
    alias: ['马拉巴栗'],
    element: '木',
    category: 'wealth',
    suitableLocations: ['客厅', '书房', '办公室', '财位'],
    avoidLocations: ['卧室', '卫生间'],
    fengShuiEffects: {
      wealth: '招财进宝，聚财纳福',
      career: '提升事业运，步步高升',
    },
    notes: [
      '喜光照充足',
      '忌积水',
      '定期修剪',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '发财树置于财位，主财运亨通。' },
    ],
    modernExplanation: '发财树寓意财运亨通，叶片圆润饱满，象征财富圆满。',
    careDifficulty: 'easy',
    lightRequirement: 'medium',
    tags: ['招财', '木', '常绿', '客厅'],
  },
  {
    id: 'plant-002',
    name: '金钱树',
    alias: ['雪铁芋'],
    element: '木',
    category: 'wealth',
    suitableLocations: ['客厅', '书房', '办公室'],
    avoidLocations: ['卧室', '厨房'],
    fengShuiEffects: {
      wealth: '招财运，聚财气',
      career: '事业顺利，财源广进',
    },
    notes: [
      '耐旱，少浇水',
      '喜散射光',
      '叶片像铜钱，寓意财富',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '金钱树叶片如铜钱，主财运连绵。' },
    ],
    modernExplanation: '金钱树叶片圆润如铜钱，象征财富累累，寓意招财进宝。',
    careDifficulty: 'easy',
    lightRequirement: 'low',
    tags: ['招财', '木', '耐旱', '办公室'],
  },
  {
    id: 'plant-003',
    name: '绿萝',
    alias: ['黄金葛'],
    element: '木',
    category: 'general',
    suitableLocations: ['客厅', '卧室', '书房', '厨房', '卫生间'],
    avoidLocations: [],
    fengShuiEffects: {
      health: '净化空气，有利健康',
      wealth: '生旺气，聚财',
    },
    notes: [
      '生命力强',
      '净化空气效果好',
      '适合新手',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '绿萝四季常青，主生气旺盛。' },
    ],
    modernExplanation: '绿萝净化空气能力强，可吸收甲醛，适合新装修房屋。',
    careDifficulty: 'easy',
    lightRequirement: 'low',
    tags: ['净化', '木', '易养', '常青'],
  },
  {
    id: 'plant-004',
    name: '富贵竹',
    alias: ['开运竹', '转运竹'],
    element: '木',
    category: 'wealth',
    suitableLocations: ['客厅', '书房', '玄关'],
    avoidLocations: ['厨房', '卫生间'],
    fengShuiEffects: {
      wealth: '花开富贵，竹报平安',
      career: '步步高升，事业有成',
      study: '学业进步，文昌得位',
    },
    notes: [
      '水养或土培均可',
      '喜温暖湿润',
      '通常养6、8、9枝寓意不同',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '富贵竹置于文昌位，主学业事业双丰收。' },
    ],
    modernExplanation: '富贵竹象征节节高升，寓意事业学业步步高升。',
    careDifficulty: 'easy',
    lightRequirement: 'medium',
    tags: ['招财', '文昌', '木', '水培'],
  },
  {
    id: 'plant-005',
    name: '龟背竹',
    alias: ['蓬莱蕉'],
    element: '木',
    category: 'health',
    suitableLocations: ['客厅', '书房', '卧室'],
    avoidLocations: ['厨房'],
    fengShuiEffects: {
      health: '益寿延年，健康长寿',
      relationship: '增进感情，家庭和睦',
    },
    notes: [
      '叶片大，净化空气',
      '喜温暖湿润',
      '寓意长寿',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '龟背竹形似龟背，主健康长寿。' },
    ],
    modernExplanation: '龟背竹叶片大而优美，净化空气效果好，寓意健康长寿。',
    careDifficulty: 'medium',
    lightRequirement: 'medium',
    tags: ['健康', '木', '长寿', '大叶'],
  },
  {
    id: 'plant-006',
    name: '虎尾兰',
    alias: ['虎皮兰', '千岁兰'],
    element: '金',
    category: 'exorcism',
    suitableLocations: ['客厅', '书房', '办公室', '玄关'],
    avoidLocations: ['卧室'],
    fengShuiEffects: {
      health: '化煞辟邪，保平安',
      wealth: '聚财气，旺财运',
    },
    notes: [
      '耐旱，好养',
      '夜间释放氧气',
      '吸收有害气体',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '虎尾兰叶片直立，主刚正不阿，化煞辟邪。' },
    ],
    modernExplanation: '虎尾兰叶片坚硬挺立，象征坚韧不拔，有化煞辟邪之意。',
    careDifficulty: 'easy',
    lightRequirement: 'medium',
    tags: ['化煞', '金', '耐旱', '夜间释氧'],
  },
  {
    id: 'plant-007',
    name: '仙人球',
    alias: ['仙人掌'],
    element: '土',
    category: 'exorcism',
    suitableLocations: ['阳台', '窗台', '办公室'],
    avoidLocations: ['卧室', '客厅中心', '财位'],
    fengShuiEffects: {
      health: '化煞辟邪，防小人',
    },
    notes: [
      '化煞植物，不放在室内中心',
      '放在阳台可挡外煞',
      '耐旱',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '带刺植物主化煞，宜对外不宜对内。' },
    ],
    modernExplanation: '仙人球带刺，有化煞作用，适合放在阳台或窗台挡外煞。',
    careDifficulty: 'easy',
    lightRequirement: 'high',
    tags: ['化煞', '土', '带刺', '阳台'],
  },
  {
    id: 'plant-008',
    name: '红掌',
    alias: ['火鹤花', '安祖花'],
    element: '火',
    category: 'relationship',
    suitableLocations: ['客厅', '卧室', '餐厅'],
    avoidLocations: ['厨房'],
    fengShuiEffects: {
      relationship: '旺桃花，增进感情',
      wealth: '红红火火，财运兴旺',
    },
    notes: [
      '花色红艳，喜庆',
      '喜温暖湿润',
      '寓意热情奔放',
    ],
    classicalReferences: [
      { book: '现代风水', quote: '红掌花开红艳，主热情洋溢，感情顺利。' },
    ],
    modernExplanation: '红掌花色红艳，象征热情与活力，有助增进感情运。',
    careDifficulty: 'medium',
    lightRequirement: 'medium',
    tags: ['桃花', '火', '红花', '喜庆'],
  },
]

export const PLANT_COUNT = PLANTS.length

export function getPlantById(id: string): PlantKnowledge | undefined {
  return PLANTS.find(p => p.id === id)
}

export function getPlantsByCategory(category: PlantCategory): PlantKnowledge[] {
  return PLANTS.filter(p => p.category === category)
}

export function getPlantsByLocation(location: string): PlantKnowledge[] {
  return PLANTS.filter(p => 
    p.suitableLocations.some(l => location.includes(l) || l.includes(location))
  )
}
