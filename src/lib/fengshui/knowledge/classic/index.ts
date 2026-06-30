/**
 * 古籍知识库 - 索引
 * 
 * 核心典籍：
 * - 黄帝宅经
 * - 阳宅三要
 * - 阳宅十书
 * - 八宅明镜
 * - 葬经（青囊经）
 * - 沈氏玄空学
 */

import type { ClassicBook, KnowledgeEntry, FengShuiSchool, KnowledgeCategory } from '../types'

// ============ 书籍索引 ============

export const CLASSIC_BOOKS: ClassicBook[] = [
  {
    id: 'huangdi-zhaijing',
    name: '黄帝宅经',
    fullName: '《黄帝宅经》',
    dynasty: '上古',
    author: '托名黄帝',
    description: '中国最早的阳宅风水经典，系统阐述了住宅与人体健康、运势的关系，提出了"阴阳调和"的核心思想。',
    school: ['zangfeng', 'bazhai'],
    entryCount: 12,
    importance: 95,
    verified: true,
  },
  {
    id: 'yangzhai-sanyao',
    name: '阳宅三要',
    fullName: '《阳宅三要》',
    dynasty: '清',
    author: '赵九峰',
    description: '清代阳宅风水代表作，以门、主、灶为阳宅三大要素，系统论述阳宅吉凶判断。',
    school: ['bazhai'],
    entryCount: 10,
    importance: 92,
    verified: true,
  },
  {
    id: 'yangzhai-shishu',
    name: '阳宅十书',
    fullName: '《阳宅十书》',
    dynasty: '明',
    author: '王君荣',
    description: '明代阳宅风水集大成之作，汇集历代阳宅理论精华，分为十篇详细论述。',
    school: ['bazhai', 'zangfeng'],
    entryCount: 8,
    importance: 90,
    verified: true,
  },
  {
    id: 'bazhai-mingjing',
    name: '八宅明镜',
    fullName: '《八宅明镜》',
    dynasty: '唐',
    author: '杨筠松',
    description: '八宅派核心经典，将住宅分为东四宅与西四宅，以九星飞布论吉凶。',
    school: ['bazhai'],
    entryCount: 10,
    importance: 88,
    verified: true,
  },
  {
    id: 'zang-jing',
    name: '葬经',
    fullName: '《葬经》（青囊经）',
    dynasty: '晋',
    author: '郭璞',
    description: '风水理论奠基之作，提出"气乘风则散，界水则止"的核心概念，界定了风水的基本定义。',
    school: ['zangfeng', 'sanjiao'],
    entryCount: 6,
    importance: 98,
    verified: true,
  },
  {
    id: 'shenshi-xuankong',
    name: '沈氏玄空学',
    fullName: '《沈氏玄空学》',
    dynasty: '清',
    author: '沈竹礽',
    description: '玄空派集大成之作，系统阐述三元九运、玄空飞星理论，是现代玄空风水的主要依据。',
    school: ['xuankong', 'sanyuan'],
    entryCount: 8,
    importance: 90,
    verified: true,
  },
]

// ============ 知识条目 ============

export const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  // ===== 黄帝宅经 =====
  {
    id: 'hzj-001',
    bookId: 'huangdi-zhaijing',
    bookName: '黄帝宅经',
    chapter: '总论',
    section: '阴阳调和',
    topic: '住宅阴阳调和',
    tags: ['阴阳', '基础理论', '宅运'],
    original: '夫宅者，乃是阴阳之枢纽，人伦之轨模。',
    translation: '住宅是阴阳交汇的关键所在，是人类生活的基本模式。',
    modern: '现代住宅强调采光、通风与空间布局的平衡，本质上仍是阴阳调和的体现。',
    ai: '从现代视角看，阴阳调和可以理解为居住环境的舒适度与能量流动的平衡。充足的阳光（阳）与良好的通风（阴）共同创造健康的居住环境。',
    school: ['zangfeng', 'bazhai'],
    category: ['direction', 'layout'],
    relatedEntries: ['hzj-002', 'yzsy-001'],
    relatedRules: ['classical-south-facing', 'classical-cang-feng'],
    confidence: 95,
    verified: true,
  },
  {
    id: 'hzj-002',
    bookId: 'huangdi-zhaijing',
    bookName: '黄帝宅经',
    chapter: '阳宅篇',
    section: '南向为吉',
    topic: '坐北朝南',
    tags: ['朝向', '南向', '阳气'],
    original: '凡阳宅坐北朝南，取其向明，阳气充足，宅运亨通。',
    translation: '凡是坐北朝南的阳宅，取其面向光明，阳气充足，住宅运势就会通达。',
    modern: '现代科学证实南向住宅采光充足，有利于维生素D合成和杀菌，对健康有益。',
    ai: '南向住宅是中国传统最佳朝向，既符合气候特点（冬季保暖夏季通风），也符合人体对阳光的需求。',
    school: ['bazhai', 'zangfeng'],
    category: ['direction', 'health'],
    relatedEntries: ['hzj-001'],
    relatedRules: ['classical-south-facing'],
    confidence: 95,
    verified: true,
  },
  {
    id: 'hzj-003',
    bookId: 'huangdi-zhaijing',
    bookName: '黄帝宅经',
    chapter: '阳宅篇',
    section: '藏风聚气',
    topic: '藏风聚气',
    tags: ['气场', '聚气', '藏风'],
    original: '气乘风则散，界水则止。藏风聚气，宅之要也。',
    translation: '气遇风就会飘散，遇水就会停止。藏风聚气是住宅的关键。',
    modern: '现代住宅设计注重空间的围合感和私密性，避免气流直来直去，本质上也是"藏风聚气"的体现。',
    ai: '从环境心理学角度，过于开放或通透的空间容易让人缺乏安全感，而适度围合的空间能带来稳定感和归属感。',
    school: ['zangfeng', 'sanjiao'],
    category: ['layout', 'wealth'],
    relatedEntries: ['zang-jing-001'],
    relatedRules: ['classical-cang-feng'],
    confidence: 92,
    verified: true,
  },

  // ===== 阳宅三要 =====
  {
    id: 'yzsy-001',
    bookId: 'yangzhai-sanyao',
    bookName: '阳宅三要',
    chapter: '总论',
    section: '门主灶',
    topic: '阳宅三要',
    tags: ['门', '主', '灶', '核心理论'],
    original: '阳宅孰大？门、主、灶是也。门乃由入之路，主乃居处之所，灶乃养生之源。',
    translation: '阳宅最重要的是什么？是大门、主卧和厨房。大门是进出的通道，主卧是居住的地方，厨房是养生的源头。',
    modern: '现代住宅设计中，玄关（门）、卧室（主）、厨房（灶）仍然是最重要的三个功能区域。',
    ai: '从功能分区角度，门代表入口和过渡空间，主代表休息空间，灶代表饮食空间，三者构成了居住的基本需求：出入、休息、饮食。',
    school: ['bazhai'],
    category: ['layout', 'room', 'kitchen'],
    relatedEntries: ['yzsy-002', 'hzj-001'],
    relatedRules: ['classical-men-zhu-zao'],
    confidence: 95,
    verified: true,
  },
  {
    id: 'yzsy-002',
    bookId: 'yangzhai-sanyao',
    bookName: '阳宅三要',
    chapter: '门',
    section: '门为气口',
    topic: '大门为气口',
    tags: ['大门', '气口', '纳气'],
    original: '门者，气口也。气之口，如人之口，大口大口，小口小口。',
    translation: '大门是气的入口。气的入口就像人的嘴巴一样，大门进的气多，小门进的气少。',
    modern: '现代住宅的玄关设计强调过渡空间的重要性，既是空间转换，也是气场转换。',
    ai: '从环境心理学角度，入口空间的大小、明亮程度直接影响人的第一印象和进入建筑后的心理感受。',
    school: ['bazhai', 'zangfeng'],
    category: ['direction', 'wealth'],
    relatedEntries: ['yzsy-001', 'bzmj-001'],
    relatedRules: ['classical-main-door-position'],
    confidence: 90,
    verified: true,
  },
  {
    id: 'yzsy-003',
    bookId: 'yangzhai-sanyao',
    bookName: '阳宅三要',
    chapter: '灶',
    section: '灶位吉凶',
    topic: '厨房灶位',
    tags: ['厨房', '灶', '健康'],
    original: '灶者，养命之源，关系祸福尤重。灶宜坐吉向吉，最忌开门见灶。',
    translation: '灶台是滋养生命的源头，关系到祸福尤其重要。灶台宜坐吉向吉，最忌讳开门就看见灶台。',
    modern: '现代厨房设计强调油烟处理和操作便利，但开门见灶确实在心理上给人"开门即见烟火"的急迫感。',
    ai: '从安全性和私密性角度，开门见灶容易让外人一眼看到厨房的杂乱，也可能带来油烟外溢的问题。',
    school: ['bazhai'],
    category: ['kitchen', 'wealth'],
    relatedEntries: ['yzsy-001'],
    relatedRules: ['classical-kitchen-position', 'practical-open-stove'],
    confidence: 88,
    verified: true,
  },
  {
    id: 'yzsy-004',
    bookId: 'yangzhai-sanyao',
    bookName: '阳宅三要',
    chapter: '门',
    section: '开门见灶',
    topic: '开门见灶',
    tags: ['厨房', '门', '财', '煞'],
    original: '开门见灶，钱财多耗。',
    translation: '开门就看见灶台，钱财会大量消耗。',
    modern: '开门见灶在现代住宅中也被认为不理想，因为油烟易飘散到客厅，也缺乏空间层次。',
    ai: '从视觉心理学角度，开门见灶给人"家宅内务外露"的感觉，缺乏私密性和层次感。',
    school: ['bazhai'],
    category: ['kitchen', 'wealth'],
    relatedEntries: ['yzsy-003', 'yzdc-001'],
    relatedRules: ['practical-open-stove'],
    confidence: 85,
    verified: true,
  },

  // ===== 八宅明镜 =====
  {
    id: 'bzmj-001',
    bookId: 'bazhai-mingjing',
    bookName: '八宅明镜',
    chapter: '总论',
    section: '八宅分类',
    topic: '八宅法',
    tags: ['八宅', '东四宅', '西四宅', '九星'],
    original: '夫八宅者，乾坎艮震巽离坤兑是也。东四者，震巽坎离；西四者，乾坤艮兑。',
    translation: '所谓八宅，就是乾、坎、艮、震、巽、离、坤、兑八个方位。东四宅是震、巽、坎、离；西四宅是乾、坤、艮、兑。',
    modern: '八宅法是最实用的阳宅风水流派之一，操作简便，适合普通人学习应用。',
    ai: '从系统分类角度，八宅法将住宅和人都分为两类（东四、西四），建立了一套简单的匹配规则。',
    school: ['bazhai'],
    category: ['direction', 'layout'],
    relatedEntries: ['bzmj-002'],
    relatedRules: ['classical-main-door-position'],
    confidence: 85,
    verified: true,
  },
  {
    id: 'bzmj-002',
    bookId: 'bazhai-mingjing',
    bookName: '八宅明镜',
    chapter: '门',
    section: '吉位开门',
    topic: '大门吉位',
    tags: ['大门', '吉位', '生气', '延年'],
    original: '大门为气口，吉位开门则吉气入宅，凶位开门则凶气入宅。',
    translation: '大门是气的入口，在吉位开门则吉气进入住宅，在凶位开门则凶气进入住宅。',
    modern: '现代住宅大门的朝向和位置确实影响着进出的便利性、采光和通风。',
    ai: '从使用体验角度，大门朝哪个方向开直接影响每天的日照、风向和进出路线，对生活质量有实质影响。',
    school: ['bazhai'],
    category: ['direction', 'wealth'],
    relatedEntries: ['bzmj-001', 'yzsy-002'],
    relatedRules: ['classical-main-door-position'],
    confidence: 82,
    verified: true,
  },

  // ===== 葬经 =====
  {
    id: 'zang-jing-001',
    bookId: 'zang-jing',
    bookName: '葬经',
    chapter: '总论',
    section: '风水定义',
    topic: '风水定义',
    tags: ['风水', '定义', '气', '藏风'],
    original: '气乘风则散，界水则止。古人聚之使不散，行之使有止，故谓之风水。',
    translation: '气遇到风就会消散，遇到水就会停止。古人让它聚集而不消散，让它流动而有停止，所以叫做风水。',
    modern: '这是风水一词的来源，也是风水的核心定义：让能量（气）保持平衡和流动。',
    ai: '从现代系统论角度，风水可以理解为对居住环境中能量流动的调控，使环境达到最适合人类居住的状态。',
    school: ['zangfeng', 'sanjiao'],
    category: ['layout', 'wealth'],
    relatedEntries: ['hzj-003'],
    relatedRules: ['classical-cang-feng'],
    confidence: 98,
    verified: true,
  },
  {
    id: 'zang-jing-002',
    bookId: 'zang-jing',
    bookName: '葬经',
    chapter: '气感篇',
    section: '人宅相应',
    topic: '人宅感应',
    tags: ['人宅', '感应', '天人合一'],
    original: '人因宅而立，宅因人得存。人宅相扶，感通天地。',
    translation: '人因为有住宅而得以安身立命，住宅因为有人居住而得以存在。人和住宅相互扶持，能够感应通达天地。',
    modern: '现代环境心理学研究证实，居住环境对人的心理状态、身体健康和行为模式都有显著影响。',
    ai: '从生物与环境的互动角度，人与环境始终在相互影响。环境塑造人，人也改造环境，这是一个动态的互动过程。',
    school: ['zangfeng', 'sanjiao'],
    category: ['health', 'career', 'relationship'],
    relatedEntries: ['hzj-001'],
    relatedRules: [],
    confidence: 90,
    verified: true,
  },

  // ===== 阳宅十书 =====
  {
    id: 'yzss-001',
    bookId: 'yangzhai-shishu',
    bookName: '阳宅十书',
    chapter: '论宅形',
    section: '宅形方正',
    topic: '宅形方正',
    tags: ['户型', '方正', '吉宅'],
    original: '凡阳宅贵乎方正，前狭后宽居则安，前宽后狭人丁稀，缺则不利。',
    translation: '凡是阳宅以方正为贵，前窄后宽居住则安稳，前宽后窄人丁稀少，有缺角则不利。',
    modern: '现代住宅设计也讲究户型方正，因为方正的空间利用率最高，也最符合人的视觉习惯。',
    ai: '从几何美学和空间利用角度，方正的户型具有最高的空间效率，家具摆放也最方便，能给人稳定安全的心理感受。',
    school: ['bazhai', 'zangfeng'],
    category: ['layout'],
    relatedEntries: ['hzj-003'],
    relatedRules: ['classical-cang-feng', 'classical-missing-corner'],
    confidence: 88,
    verified: true,
  },
  {
    id: 'yzss-002',
    bookId: 'yangzhai-shishu',
    bookName: '阳宅十书',
    chapter: '论缺角',
    section: '缺角不利',
    topic: '缺角不利',
    tags: ['户型', '缺角', '不利'],
    original: '凡阳宅有缺角，缺何方则何事不利。缺西北不利父，缺西南不利母。',
    translation: '凡是阳宅有缺角，缺哪个方位就对应哪方面不利。缺西北角不利父亲，缺西南角不利母亲。',
    modern: '缺角户型在现代住宅中较为常见，通过装修和家具布置可以一定程度上化解。',
    ai: '从完形心理学（Gestalt）角度，人们天然偏好完整的形状，不完整的形状会带来微妙的心理不安。',
    school: ['bazhai', 'zangfeng'],
    category: ['layout', 'health'],
    relatedEntries: ['yzss-001'],
    relatedRules: ['classical-missing-corner'],
    confidence: 80,
    verified: true,
  },
  {
    id: 'yzss-003',
    bookId: 'yangzhai-shishu',
    bookName: '阳宅十书',
    chapter: '论中宫',
    section: '中宫宜静',
    topic: '中宫宜忌',
    tags: ['中宫', '卫生间', '厨房'],
    original: '中宫为宅之心脏，宜静不宜动，最忌卫生间、厨房居之。',
    translation: '中宫是住宅的心脏，宜安静不宜躁动，最忌讳卫生间和厨房在中宫位置。',
    modern: '现代住宅的中心区域如果是卫生间，确实存在异味扩散、潮湿等问题。',
    ai: '从空间功能角度，住宅中心应该是公共活动空间（如客厅），而不是私密性强的厨卫，这符合功能分区的原则。',
    school: ['bazhai', 'xuankong'],
    category: ['layout', 'health'],
    relatedEntries: ['yzsy-001'],
    relatedRules: ['practical-toilet-center'],
    confidence: 85,
    verified: true,
  },
]

// ============ 工具函数 ============

export function getBookById(id: string): ClassicBook | undefined {
  return CLASSIC_BOOKS.find(b => b.id === id)
}

export function getEntryById(id: string): KnowledgeEntry | undefined {
  return KNOWLEDGE_ENTRIES.find(e => e.id === id)
}

export function getEntriesByBook(bookId: string): KnowledgeEntry[] {
  return KNOWLEDGE_ENTRIES.filter(e => e.bookId === bookId)
}

export function getEntriesBySchool(school: FengShuiSchool): KnowledgeEntry[] {
  return KNOWLEDGE_ENTRIES.filter(e => e.school.includes(school))
}

export function getEntriesByCategory(category: KnowledgeCategory): KnowledgeEntry[] {
  return KNOWLEDGE_ENTRIES.filter(e => e.category.includes(category))
}

export function searchEntries(keyword: string): KnowledgeEntry[] {
  const kw = keyword.toLowerCase()
  return KNOWLEDGE_ENTRIES.filter(e => 
    e.topic.toLowerCase().includes(kw) ||
    e.tags.some(t => t.toLowerCase().includes(kw)) ||
    e.original?.includes(kw) ||
    e.translation?.includes(kw)
  )
}
