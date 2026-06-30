/**
 * Knowledge Base - 材料库 (Materials)
 * 
 * 包含：五行属性、适用位置、风水作用、优缺点
 */

export interface MaterialKnowledge {
  id: string
  name: string
  element: '木' | '火' | '土' | '金' | '水'
  category: MaterialCategory
  
  /** 适用位置 */
  suitableLocations: string[]
  
  /** 不建议位置 */
  avoidLocations: string[]
  
  /** 风水作用 */
  fengShuiEffects: {
    wealth?: string
    health?: string
    career?: string
    relationship?: string
  }
  
  /** 优点 */
  advantages: string[]
  
  /** 缺点 */
  disadvantages: string[]
  
  /** 保养建议 */
  maintenanceTips: string[]
  
  tags: string[]
}

export type MaterialCategory = 
  | 'wood'          // 木材
  | 'stone'         // 石材
  | 'metal'         // 金属
  | 'glass'         // 玻璃
  | 'fabric'        // 布艺
  | 'tile'          // 瓷砖
  | 'paint'         // 涂料
  | 'other'

export const MATERIALS: MaterialKnowledge[] = [
  {
    id: 'material-001',
    name: '实木',
    element: '木',
    category: 'wood',
    suitableLocations: ['客厅', '卧室', '书房', '餐厅'],
    avoidLocations: ['卫生间', '厨房'],
    fengShuiEffects: {
      health: '自然健康，有益身心',
      relationship: '温暖和谐，家庭和睦',
      wealth: '木生火，间接旺财',
    },
    advantages: [
      '自然环保',
      '质感温暖',
      '上档次',
      '耐用',
    ],
    disadvantages: [
      '怕潮湿',
      '需保养',
      '价格高',
    ],
    maintenanceTips: [
      '避免阳光直射',
      '保持干燥',
      '定期打蜡保养',
    ],
    tags: ['木', '自然', '高档', '温暖'],
  },
  {
    id: 'material-002',
    name: '大理石',
    element: '土',
    category: 'stone',
    suitableLocations: ['客厅', '玄关', '卫生间', '厨房'],
    avoidLocations: ['卧室'],
    fengShuiEffects: {
      wealth: '稳重扎实，有助财运',
      career: '事业稳固，步步高升',
    },
    advantages: [
      '高档大气',
      '耐用耐磨',
      '易清洁',
      '纹理美观',
    ],
    disadvantages: [
      '偏冷',
      '价格高',
      '重量大',
      '有辐射风险',
    ],
    maintenanceTips: [
      '定期做晶面保养',
      '避免酸碱腐蚀',
      '及时清理污渍',
    ],
    tags: ['土', '高档', '耐用', '稳重'],
  },
  {
    id: 'material-003',
    name: '玻璃',
    element: '金',
    category: 'glass',
    suitableLocations: ['客厅', '书房', '厨房'],
    avoidLocations: ['卧室', '财位'],
    fengShuiEffects: {
      career: '透明通透，事业清明',
      wealth: '需慎用，可能导致财来财去',
    },
    advantages: [
      '通透明亮',
      '显空间大',
      '现代感强',
      '易清洁',
    ],
    disadvantages: [
      '易碎',
      '不隐私',
      '易结露',
      '风水上需慎用',
    ],
    maintenanceTips: [
      '定期清洁',
      '避免硬物碰撞',
      '可用磨砂增加隐私',
    ],
    tags: ['金', '通透', '现代', '明亮'],
  },
  {
    id: 'material-004',
    name: '布艺',
    element: '木',
    category: 'fabric',
    suitableLocations: ['客厅', '卧室', '书房'],
    avoidLocations: ['厨房', '卫生间'],
    fengShuiEffects: {
      relationship: '温馨柔和，增进感情',
      health: '柔软舒适，有助休息',
    },
    advantages: [
      '温馨柔和',
      '颜色多样',
      '可更换',
      '价格适中',
    ],
    disadvantages: [
      '易脏',
      '需清洗',
      '易过敏',
    ],
    maintenanceTips: [
      '定期清洗',
      '避免阳光直射褪色',
      '选防污面料',
    ],
    tags: ['木', '温馨', '柔和', '舒适'],
  },
  {
    id: 'material-005',
    name: '瓷砖',
    element: '土',
    category: 'tile',
    suitableLocations: ['卫生间', '厨房', '客厅', '阳台'],
    avoidLocations: ['卧室'],
    fengShuiEffects: {
      health: '干净卫生，有益健康',
      wealth: '光洁明亮，财运亨通',
    },
    advantages: [
      '防水防污',
      '易清洁',
      '耐用',
      '款式多',
    ],
    disadvantages: [
      '偏冷',
      '脚感硬',
      '冬天凉',
    ],
    maintenanceTips: [
      '定期清洁',
      '注意美缝',
      '避免重物砸击',
    ],
    tags: ['土', '干净', '耐用', '防水'],
  },
  {
    id: 'material-006',
    name: '金属',
    element: '金',
    category: 'metal',
    suitableLocations: ['客厅', '厨房', '卫生间'],
    avoidLocations: ['卧室'],
    fengShuiEffects: {
      career: '刚毅果断，事业有成',
      wealth: '金生水，有助财运',
    },
    advantages: [
      '坚固耐用',
      '现代感强',
      '易清洁',
    ],
    disadvantages: [
      '偏冷',
      '易刮花',
      '质感硬',
    ],
    maintenanceTips: [
      '定期擦拭',
      '避免酸碱腐蚀',
      '防止刮花',
    ],
    tags: ['金', '现代', '坚固', '刚毅'],
  },
]

export const MATERIAL_COUNT = MATERIALS.length

export function getMaterialById(id: string): MaterialKnowledge | undefined {
  return MATERIALS.find(m => m.id === id)
}

export function getMaterialsByElement(element: string): MaterialKnowledge[] {
  return MATERIALS.filter(m => m.element === element)
}

export function getMaterialsByLocation(location: string): MaterialKnowledge[] {
  return MATERIALS.filter(m => 
    m.suitableLocations.some(l => l.includes(location) || location.includes(l))
  )
}
