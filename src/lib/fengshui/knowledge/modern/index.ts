/**
 * 现代住宅风水知识库
 * 
 * 结合现代建筑学、环境心理学、人体工程学的现代住宅风水知识
 */

import type { KnowledgeEntry, FengShuiSchool, KnowledgeCategory } from '../types'

export const MODERN_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'modern-lighting-001',
    bookId: 'modern-fengshui',
    bookName: '现代住宅风水',
    chapter: '采光',
    section: '自然采光',
    topic: '自然采光与健康',
    tags: ['采光', '健康', '现代', '阳气'],
    original: '',
    translation: '',
    modern: '现代住宅强调充足的自然采光，阳光中的紫外线能杀菌消毒，促进维生素D合成，对人体健康至关重要。采光不足的住宅容易滋生霉菌，影响居住者情绪和免疫力。',
    ai: '从环境心理学角度看，自然光能够调节人体生物钟，改善睡眠质量，提升情绪状态。建议每天至少有2小时以上的阳光直射进入室内。',
    school: ['modern'],
    category: ['health'],
    relatedEntries: ['hzj-002'],
    relatedRules: [],
    confidence: 95,
    verified: true,
  },
  {
    id: 'modern-ventilation-001',
    bookId: 'modern-fengshui',
    bookName: '现代住宅风水',
    chapter: '通风',
    section: '空气流通',
    topic: '通风与空气质量',
    tags: ['通风', '健康', '现代', '气流'],
    original: '',
    translation: '',
    modern: '良好的通风能够有效降低室内CO2浓度，减少甲醛、TVOC等有害气体积累。现代住宅建议每日开窗通风2-3次，每次30分钟以上。',
    ai: '风水所说的"气"在现代科学中可以理解为空气流动和能量交换。 stagnant air（停滞的空气）对应"死气"，fresh air（新鲜空气）对应"生气"。',
    school: ['modern', 'zangfeng'],
    category: ['health'],
    relatedEntries: ['hzj-003'],
    relatedRules: [],
    confidence: 92,
    verified: true,
  },
  {
    id: 'modern-noise-001',
    bookId: 'modern-fengshui',
    bookName: '现代住宅风水',
    chapter: '环境',
    section: '噪音',
    topic: '噪音污染与健康',
    tags: ['噪音', '健康', '现代', '环境'],
    original: '',
    translation: '',
    modern: '长期暴露在50分贝以上的噪音环境中，会导致睡眠障碍、血压升高、免疫力下降。临路住宅尤其需要做好隔音处理。',
    ai: '风水中的"声煞"对应现代的噪音污染。持续的噪音干扰会导致皮质醇升高，影响身心健康，这与传统风水认为"声煞损丁财"的观察是一致的。',
    school: ['modern'],
    category: ['health', 'environment'],
    relatedEntries: [],
    relatedRules: ['practical-lu-chong'],
    confidence: 90,
    verified: true,
  },
  {
    id: 'modern-layout-001',
    bookId: 'modern-fengshui',
    bookName: '现代住宅风水',
    chapter: '布局',
    section: '动线',
    topic: '户型动线设计',
    tags: ['布局', '动线', '现代', '实用'],
    original: '',
    translation: '',
    modern: '现代住宅讲究动线流畅，公私分区明确。入户→客厅→餐厅→厨房的家务动线，与卧室→卫生间的居住动线应尽量避免交叉。',
    ai: '风水讲"曲则有情，直则无情"，在现代户型设计中体现为避免长直走廊对卧室门的直冲，以及入户见厅的缓冲设计。动线合理的住宅居住体验明显更好。',
    school: ['modern', 'zangfeng'],
    category: ['layout'],
    relatedEntries: ['yzsy-002'],
    relatedRules: [],
    confidence: 88,
    verified: true,
  },
  {
    id: 'modern-bedroom-001',
    bookId: 'modern-fengshui',
    bookName: '现代住宅风水',
    chapter: '卧室',
    section: '睡眠环境',
    topic: '卧室与睡眠质量',
    tags: ['卧室', '健康', '现代', '睡眠'],
    original: '',
    translation: '',
    modern: '卧室是恢复精力的场所，宜安静、昏暗、温度适宜。床头不宜靠窗，避免噪音和光线干扰；床的位置应能看到门，但不宜正对门。',
    ai: '风水"横梁压床"的说法，从现代心理学看，人在睡眠时头顶有物体会产生潜意识的压迫感，影响深度睡眠。床的摆放位置关系到睡眠安全感。',
    school: ['modern', 'bazhai'],
    category: ['health', 'bedroom'],
    relatedEntries: [],
    relatedRules: ['practical-beam-press'],
    confidence: 93,
    verified: true,
  },
]

export function getModernEntryById(id: string): KnowledgeEntry | undefined {
  return MODERN_ENTRIES.find(e => e.id === id)
}

export function searchModernEntries(keyword: string): KnowledgeEntry[] {
  const lower = keyword.toLowerCase()
  return MODERN_ENTRIES.filter(e => 
    e.topic.toLowerCase().includes(lower) ||
    e.tags.some(t => t.toLowerCase().includes(lower)) ||
    (e.modern && e.modern.toLowerCase().includes(lower)) ||
    (e.ai && e.ai.toLowerCase().includes(lower))
  )
}
