/**
 * Knowledge Base - 颜色库 (Colors)
 * 
 * 包含：五行属性、适用位置、风水作用、心理影响、搭配建议
 */

export interface ColorKnowledge {
  id: string
  name: string
  element: '木' | '火' | '土' | '金' | '水'
  
  /** 五行属性说明 */
  elementDescription: string
  
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
    study?: string
  }
  
  /** 心理影响 */
  psychologicalEffects: string[]
  
  /** 搭配建议 */
  pairingColors: string[]
  
  /** 使用建议 */
  usageTips: string[]
  
  tags: string[]
}

export const COLORS: ColorKnowledge[] = [
  {
    id: 'color-001',
    name: '白色',
    element: '金',
    elementDescription: '白色属金，主清洁、纯净、肃杀',
    suitableLocations: ['卫生间', '厨房', '客厅', '书房'],
    avoidLocations: ['卧室'],
    fengShuiEffects: {
      wealth: '金生水，有助财运',
      career: '提升事业运，主刚正',
    },
    psychologicalEffects: ['纯净', '明亮', '干净', '空间感强'],
    pairingColors: ['灰色', '黑色', '木色', '金色'],
    usageTips: [
      '客厅用白色显宽敞明亮',
      '卫生间用白色显干净',
      '卧室不宜全白，偏冷',
    ],
    tags: ['金', '明亮', '干净', '现代'],
  },
  {
    id: 'color-002',
    name: '黑色',
    element: '水',
    elementDescription: '黑色属水，主智慧、沉稳、神秘',
    suitableLocations: ['书房', '客厅点缀'],
    avoidLocations: ['卧室', '厨房', '卫生间'],
    fengShuiEffects: {
      career: '助事业，主沉稳',
      study: '旺智慧，助学业',
      wealth: '水为财，有助财运',
    },
    psychologicalEffects: ['沉稳', '神秘', '高级', '压抑'],
    pairingColors: ['白色', '金色', '木色', '红色'],
    usageTips: [
      '不宜大面积使用黑色',
      '作为点缀色最佳',
      '书房小范围用有助思考',
    ],
    tags: ['水', '沉稳', '高级', '智慧'],
  },
  {
    id: 'color-003',
    name: '绿色',
    element: '木',
    elementDescription: '绿色属木，主生长、健康、活力',
    suitableLocations: ['客厅', '卧室', '书房', '阳台'],
    avoidLocations: [],
    fengShuiEffects: {
      health: '有益健康，主生机勃勃',
      wealth: '木生火，间接旺财运',
      relationship: '增进感情，主和谐',
    },
    psychologicalEffects: ['放松', '自然', '平静', '希望'],
    pairingColors: ['白色', '米色', '木色', '黄色'],
    usageTips: [
      '绿色有助缓解眼疲劳',
      '卧室用浅绿助睡眠',
      '书房用绿色有助专注',
    ],
    tags: ['木', '健康', '自然', '放松'],
  },
  {
    id: 'color-004',
    name: '红色',
    element: '火',
    elementDescription: '红色属火，主热情、喜庆、活力',
    suitableLocations: ['客厅', '餐厅', '玄关'],
    avoidLocations: ['卧室', '书房', '卫生间'],
    fengShuiEffects: {
      wealth: '火旺财运，红红火火',
      relationship: '旺桃花，增进感情',
      career: '事业红火，步步高升',
    },
    psychologicalEffects: ['热情', '喜庆', '兴奋', '紧张'],
    pairingColors: ['金色', '白色', '木色', '黑色'],
    usageTips: [
      '红色不宜大面积使用',
      '作为点缀色最佳',
      '婚房可适当用红色',
    ],
    tags: ['火', '喜庆', '热情', '招财'],
  },
  {
    id: 'color-005',
    name: '黄色',
    element: '土',
    elementDescription: '黄色属土，主稳重、财富、尊贵',
    suitableLocations: ['客厅', '餐厅', '厨房', '书房'],
    avoidLocations: ['卧室'],
    fengShuiEffects: {
      wealth: '土生金，主财运',
      career: '事业稳定，步步高升',
      health: '脾胃健康',
    },
    psychologicalEffects: ['温暖', '明亮', '快乐', '稳重'],
    pairingColors: ['白色', '木色', '绿色', '蓝色'],
    usageTips: [
      '黄色象征财富与尊贵',
      '餐厅用黄色增进食欲',
      '客厅用浅黄显温馨',
    ],
    tags: ['土', '招财', '温暖', '尊贵'],
  },
  {
    id: 'color-006',
    name: '蓝色',
    element: '水',
    elementDescription: '蓝色属水，主冷静、智慧、平静',
    suitableLocations: ['书房', '客厅', '卫生间'],
    avoidLocations: ['厨房', '餐厅'],
    fengShuiEffects: {
      study: '旺智慧，助学业',
      career: '事业沉稳，步步高升',
      health: '平静心绪，有助睡眠',
    },
    psychologicalEffects: ['平静', '冷静', '深远', '忧郁'],
    pairingColors: ['白色', '木色', '黄色', '米色'],
    usageTips: [
      '书房用蓝色有助思考',
      '卧室用浅蓝助睡眠',
      '不宜大面积深蓝',
    ],
    tags: ['水', '智慧', '平静', '冷静'],
  },
  {
    id: 'color-007',
    name: '紫色',
    element: '火',
    elementDescription: '紫色属火，主高贵、神秘、优雅',
    suitableLocations: ['卧室', '客厅', '书房'],
    avoidLocations: ['厨房'],
    fengShuiEffects: {
      relationship: '旺感情，主浪漫',
      career: '提升贵气，有助事业',
      wealth: '紫气东来，财运亨通',
    },
    psychologicalEffects: ['高贵', '神秘', '优雅', '浪漫'],
    pairingColors: ['白色', '金色', '米色', '灰色'],
    usageTips: [
      '紫色象征高贵与神秘',
      '浅紫适合卧室',
      '深紫适合点缀',
    ],
    tags: ['火', '高贵', '神秘', '浪漫'],
  },
  {
    id: 'color-008',
    name: '木色',
    element: '木',
    elementDescription: '木色属木，主自然、温暖、生长',
    suitableLocations: ['全屋'],
    avoidLocations: [],
    fengShuiEffects: {
      health: '自然健康，有益身心',
      relationship: '温暖和谐，家庭和睦',
      wealth: '木生火，间接旺财',
    },
    psychologicalEffects: ['温暖', '自然', '舒适', '放松'],
    pairingColors: ['白色', '绿色', '米色', '灰色'],
    usageTips: [
      '木色百搭，适合全屋',
      '家具用木色显温暖',
      '木地板给人自然感',
    ],
    tags: ['木', '自然', '温暖', '百搭'],
  },
]

export const COLOR_COUNT = COLORS.length

export function getColorByName(name: string): ColorKnowledge | undefined {
  return COLORS.find(c => c.name === name)
}

export function getColorsByElement(element: string): ColorKnowledge[] {
  return COLORS.filter(c => c.element === element)
}

export function getColorsByLocation(location: string): ColorKnowledge[] {
  return COLORS.filter(c => 
    c.suitableLocations.some(l => l.includes(location) || location.includes(l))
  )
}
