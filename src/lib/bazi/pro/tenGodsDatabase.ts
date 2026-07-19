/**
 * H3 Module 3: Professional Ten Gods Engine — 十神数据库
 *
 * 包含：
 * - 十神基本属性定义（10种）
 * - 十神分类映射
 * - 十神对应五行映射
 * - 十神性质（吉/凶/中性）映射
 * - 十神生克关系链
 * - 十神关系规则库（≥20条）
 * - 十神组合规则库（≥15条）
 * - AI Explain 知识库（古籍依据/性格/事业/财富/婚姻/健康）
 */

import type {
  HeavenlyStem, FiveElement, ShenShi,
} from '@/lib/core/types/base'
import type {
  TenGodCategory, TenGodNature, TenGodDetail,
  TenGodRelationRule, TenGodCombination, TenGodExplainOutput,
} from './tenGodsTypes'

// ─── 十神列表 ───

export const TEN_GODS: ShenShi[] = [
  '比肩', '劫财', '食神', '伤官', '偏财', '正财', '偏官', '正官', '偏印', '正印',
]

// ─── 十神 → 分类 ───

export const TEN_GOD_CATEGORY: Record<ShenShi, TenGodCategory> = {
  '比肩': '比劫', '劫财': '比劫',
  '食神': '食伤', '伤官': '食伤',
  '偏财': '财星', '正财': '财星',
  '偏官': '官杀', '正官': '官杀',
  '偏印': '印星', '正印': '印星',
}

// ─── 十神 → 吉凶性质 ───

export const TEN_GOD_NATURE: Record<ShenShi, TenGodNature> = {
  '比肩': '中性', '劫财': '凶',
  '食神': '吉', '伤官': '中性',
  '偏财': '吉', '正财': '吉',
  '偏官': '凶', '正官': '吉',
  '偏印': '中性', '正印': '吉',
}

// ─── 十神生克链（按五行循环） ───

/**
 * 比劫 → 生 → 食伤 → 生 → 财星 → 生 → 官杀 → 生 → 印星 → 生 → 比劫
 * 比劫 → 克 → 财星
 * 食伤 → 克 → 官杀
 * 财星 → 克 → 印星
 * 官杀 → 克 → 比劫
 * 印星 → 克 → 食伤
 */
export const TEN_GOD_SHENG_KE_CHAIN: [ShenShi, ShenShi, '生' | '克'][] = [
  ['比肩', '食神', '生'],
  ['劫财', '伤官', '生'],
  ['比肩', '伤官', '生'],
  ['劫财', '食神', '生'],
  ['食神', '偏财', '生'],
  ['伤官', '正财', '生'],
  ['食神', '正财', '生'],
  ['伤官', '偏财', '生'],
  ['偏财', '偏官', '生'],
  ['正财', '正官', '生'],
  ['偏财', '正官', '生'],
  ['正财', '偏官', '生'],
  ['偏官', '偏印', '生'],
  ['正官', '正印', '生'],
  ['偏官', '正印', '生'],
  ['正官', '偏印', '生'],
  ['偏印', '比肩', '生'],
  ['正印', '劫财', '生'],
  ['偏印', '劫财', '生'],
  ['正印', '比肩', '生'],
  // 克
  ['比肩', '偏财', '克'],
  ['劫财', '正财', '克'],
  ['比肩', '正财', '克'],
  ['劫财', '偏财', '克'],
  ['食神', '偏官', '克'],
  ['伤官', '正官', '克'],
  ['食神', '正官', '克'],
  ['伤官', '偏官', '克'],
  ['偏财', '偏印', '克'],
  ['正财', '正印', '克'],
  ['偏财', '正印', '克'],
  ['正财', '偏印', '克'],
  ['偏官', '比肩', '克'],
  ['正官', '劫财', '克'],
  ['偏官', '劫财', '克'],
  ['正官', '比肩', '克'],
  ['偏印', '食神', '克'],
  ['正印', '伤官', '克'],
  ['偏印', '伤官', '克'],
  ['正印', '食神', '克'],
]

// ─── 十神关系规则库 ───

export const TEN_GOD_RELATION_RULES: TenGodRelationRule[] = [
  {
    id: 'guan-yin-sheng', name: '官印相生', description: '官星生印星，印星护官，主贵',
    shenShi: ['正官', '正印'], type: '生', auspicious: true, priority: 95,
    check: (d) => (d['正官']?.power ?? 0) > 30 && (d['正印']?.power ?? 0) > 30,
    source: '子平真诠', modernExplain: '官印相生为贵格，主人有权力且能善用，适合管理、教育领域。',
  },
  {
    id: 'shi-shen-zhi-sha', name: '食神制杀', description: '食神克制七杀，化煞为权',
    shenShi: ['食神', '偏官'], type: '克', auspicious: true, priority: 95,
    check: (d) => (d['食神']?.power ?? 0) > 40 && (d['偏官']?.power ?? 0) > 30,
    source: '渊海子平', modernExplain: '食神制杀，以才智制敌，主有魄力、能化解危机，适合创业。',
  },
  {
    id: 'sha-yin-sheng', name: '杀印相生', description: '七杀有印星化解，转凶为吉',
    shenShi: ['偏官', '偏印'], type: '生', auspicious: true, priority: 90,
    check: (d) => (d['偏官']?.power ?? 0) > 30 && (d['偏印']?.power ?? 0) > 30,
    source: '三命通会', modernExplain: '杀印相生，化压力为动力，主在困境中能得到贵人相助。',
  },
  {
    id: 'cai-po-yin', name: '财破印', description: '财星克制印星，印星受损',
    shenShi: ['偏财', '正印'], type: '克', auspicious: false, priority: 85,
    check: (d) => (d['偏财']?.power ?? 0) > 40 && (d['正印']?.power ?? 0) > 20,
    source: '滴天髓', modernExplain: '财破印，求财过程中学业或名声受损，需平衡物质与精神追求。',
  },
  {
    id: 'shang-guan-jian-guan', name: '伤官见官', description: '伤官与正官同见，为祸百端',
    shenShi: ['伤官', '正官'], type: '克', auspicious: false, priority: 90,
    check: (d) => (d['伤官']?.power ?? 0) > 30 && (d['正官']?.power ?? 0) > 30,
    source: '三命通会', modernExplain: '伤官见官，为祸百端，容易与上级冲突、事业波动较大。',
  },
  {
    id: 'cai-guan-shuang-mei', name: '财官双美', description: '财星与官星同旺，富贵双全',
    shenShi: ['正财', '正官'], type: '组合', auspicious: true, priority: 92,
    check: (d) => (d['正财']?.power ?? 0) > 40 && (d['正官']?.power ?? 0) > 40,
    source: '渊海子平', modernExplain: '财官双美，主事业与财运俱佳，适合仕途与经商。',
  },
  {
    id: 'yin-bi-guo-wang', name: '印比过旺', description: '印星与比劫均过旺，日主被泄',
    shenShi: ['正印', '比肩'], type: '组合', auspicious: false, priority: 80,
    check: (d) => (d['正印']?.power ?? 0) > 60 && (d['比肩']?.power ?? 0) > 60,
    source: '滴天髓', modernExplain: '印比过旺，反而不美，日主被印比包裹而难以发挥，需食伤泄秀。',
  },
  {
    id: 'shi-shang-sheng-cai', name: '食伤生财', description: '食伤生财，才华化为财富',
    shenShi: ['食神', '偏财'], type: '生', auspicious: true, priority: 88,
    check: (d) => (d['食神']?.power ?? 0) > 30 && (d['偏财']?.power ?? 0) > 30,
    source: '子平真诠', modernExplain: '食伤生财，以才华和技术获取财富，适合创意产业。',
  },
  {
    id: 'bi-jie-duo-cai', name: '比劫夺财', description: '比劫过旺抢夺财星',
    shenShi: ['比肩', '偏财'], type: '克', auspicious: false, priority: 82,
    check: (d) => (d['比肩']?.power ?? 0) > 50 && (d['偏财']?.power ?? 0) > 20,
    source: '渊海子平', modernExplain: '比劫夺财，财来财去，需注意理财和防破财。',
  },
  {
    id: 'guan-sha-hun-za', name: '官杀混杂', description: '正官与七杀同见，好坏不明',
    shenShi: ['正官', '偏官'], type: '组合', auspicious: false, priority: 85,
    check: (d) => (d['正官']?.power ?? 0) > 20 && (d['偏官']?.power ?? 0) > 20,
    source: '三命通会', modernExplain: '官杀混杂，事业方向不定，压力与机遇并存，需印星来清。',
  },
  {
    id: 'yin-xing-shi-shang', name: '印星制伤', description: '印星克制食伤，防止太过',
    shenShi: ['偏印', '食神'], type: '克', auspicious: true, priority: 75,
    check: (d) => (d['偏印']?.power ?? 0) > 30 && (d['食神']?.power ?? 0) > 40,
    source: '子平真诠', modernExplain: '印星制伤，但枭印夺食需注意，适度克制为佳。',
  },
  {
    id: 'zheng-yin-de-ling', name: '正印得令', description: '正印在月令得力，学业出众',
    shenShi: ['正印'], type: '组合', auspicious: true, priority: 70,
    check: (d) => (d['正印']?.deLing ?? false) && (d['正印']?.power ?? 0) > 40,
    source: '穷通宝鉴', modernExplain: '正印得令，主人聪明好学，考试运佳，适合学术界。',
  },
  {
    id: 'shi-shen-de-ling', name: '食神得令', description: '食神在月令得力，福气深厚',
    shenShi: ['食神'], type: '组合', auspicious: true, priority: 70,
    check: (d) => (d['食神']?.deLing ?? false) && (d['食神']?.power ?? 0) > 40,
    source: '渊海子平', modernExplain: '食神得令，主福气深厚，衣食无忧，人缘极佳。',
  },
  {
    id: 'qi-sha-wu-yin', name: '七杀无印', description: '七杀旺而无印星化解，压力巨大',
    shenShi: ['偏官', '正印'], type: '克', auspicious: false, priority: 88,
    check: (d) => (d['偏官']?.power ?? 0) > 50 && (d['正印']?.power ?? 0) < 20 && (d['偏印']?.power ?? 0) < 20,
    source: '三命通会', modernExplain: '七杀无印，压力大且缺乏支持，需特别注意健康和人际关系。',
  },
  {
    id: 'shang-guan-pei-yin', name: '伤官佩印', description: '伤官有印星配，转凶为吉',
    shenShi: ['伤官', '正印'], type: '组合', auspicious: true, priority: 87,
    check: (d) => (d['伤官']?.power ?? 0) > 30 && (d['正印']?.power ?? 0) > 30,
    source: '子平真诠', modernExplain: '伤官佩印，才华出众且有贵人护持，适合艺术、法律领域。',
  },
]

// ─── 十神组合规则库 ───

export const TEN_GOD_COMBINATION_RULES: TenGodCombination[] = [
  {
    id: 'gui-ren-fu-lu', name: '贵人扶禄', category: '吉格',
    involvedShenShi: ['正官', '正印', '正财'],
    hit: false, reference: '渊海子平',
    description: '正官、正印、正财三正星并见，主富贵双全',
    lifeAreas: ['事业', '财富', '地位'],
    confidence: 0.90,
  },
  {
    id: 'shi-shen-sheng-cai-ge', name: '食神生财格', category: '吉格',
    involvedShenShi: ['食神', '偏财'],
    hit: false, reference: '子平真诠',
    description: '食神旺而生偏财，以才华致富 [源自: RELATION_RULE shi-shang-sheng-cai]',
    lifeAreas: ['财富', '事业'],
    confidence: 0.88,
  },
  {
    id: 'guan-yin-xiang-sheng-ge', name: '官印相生格', category: '吉格',
    involvedShenShi: ['正官', '正印'],
    hit: false, reference: '子平真诠',
    description: '官旺有印，印旺护官，主权贵 [源自: RELATION_RULE guan-yin-sheng]',
    lifeAreas: ['事业', '地位', '名声'],
    confidence: 0.92,
  },
  {
    id: 'sha-yin-xiang-sheng-ge', name: '杀印相生格', category: '吉格',
    involvedShenShi: ['偏官', '偏印'],
    hit: false, reference: '三命通会',
    description: '七杀有印化，转凶为吉 [源自: RELATION_RULE sha-yin-sheng]',
    lifeAreas: ['事业', '权力'],
    confidence: 0.85,
  },
  {
    id: 'cai-guan-shuang-mei-ge', name: '财官双美格', category: '吉格',
    involvedShenShi: ['正财', '正官'],
    hit: false, reference: '渊海子平',
    description: '正财正官同旺，富贵两全 [源自: RELATION_RULE cai-guan-shuang-mei]',
    lifeAreas: ['财富', '事业', '婚姻'],
    confidence: 0.90,
  },
  {
    id: 'shang-guan-jian-guan-ge', name: '伤官见官格', category: '凶格',
    involvedShenShi: ['伤官', '正官'],
    hit: false, reference: '三命通会',
    description: '伤官克正官，为祸百端 [源自: RELATION_RULE shang-guan-jian-guan]',
    lifeAreas: ['事业', '人际关系', '法律'],
    confidence: 0.88,
  },
  {
    id: 'cai-po-yin-ge', name: '财破印格', category: '凶格',
    involvedShenShi: ['偏财', '正印'],
    hit: false, reference: '滴天髓',
    description: '偏财旺克正印，学业名声受损 [源自: RELATION_RULE cai-po-yin]',
    lifeAreas: ['学业', '名声', '精神'],
    confidence: 0.82,
  },
  {
    id: 'bi-jie-duo-cai-ge', name: '比劫夺财格', category: '凶格',
    involvedShenShi: ['比肩', '正财', '劫财'],
    hit: false, reference: '渊海子平',
    description: '比劫过旺夺取财星，财运不稳',
    lifeAreas: ['财富', '婚姻'],
    confidence: 0.85,
  },
  {
    id: 'guan-sha-hun-za-ge', name: '官杀混杂格', category: '凶格',
    involvedShenShi: ['正官', '偏官'],
    hit: false, reference: '三命通会',
    description: '正官偏官同见，事业方向不定',
    lifeAreas: ['事业', '感情'],
    confidence: 0.83,
  },
  {
    id: 'yin-bi-guo-wang-ge', name: '印比过旺格', category: '凶格',
    involvedShenShi: ['正印', '比肩'],
    hit: false, reference: '滴天髓',
    description: '印星比劫均过旺，日主反被包裹 [源自: RELATION_RULE yin-bi-guo-wang]',
    lifeAreas: ['性格', '事业'],
    confidence: 0.80,
  },
  {
    id: 'shi-shen-zhi-sha-ge', name: '食神制杀格', category: '吉格',
    involvedShenShi: ['食神', '偏官'],
    hit: false, reference: '渊海子平',
    description: '食神制七杀，化煞为权 [源自: RELATION_RULE shi-shen-zhi-sha]',
    lifeAreas: ['事业', '权力', '创业'],
    confidence: 0.92,
  },
  {
    id: 'shang-guan-pei-yin-ge', name: '伤官佩印格', category: '吉格',
    involvedShenShi: ['伤官', '正印'],
    hit: false, reference: '子平真诠',
    description: '伤官有印配，才华得贵人护',
    lifeAreas: ['事业', '艺术', '法律'],
    confidence: 0.87,
  },
  {
    id: 'qi-sha-wu-yin-ge', name: '七杀无印格', category: '凶格',
    involvedShenShi: ['偏官'],
    hit: false, reference: '三命通会',
    description: '七杀旺而无印化，压力巨大',
    lifeAreas: ['健康', '压力', '人际'],
    confidence: 0.86,
  },
  {
    id: 'zheng-guan-dan-qing', name: '正官清纯格', category: '吉格',
    involvedShenShi: ['正官'],
    hit: false, reference: '子平真诠',
    description: '正官独旺无杂，主官运亨通',
    lifeAreas: ['事业', '地位'],
    confidence: 0.85,
  },
  {
    id: 'zheng-cai-du-wang', name: '正财独旺格', category: '中性',
    involvedShenShi: ['正财'],
    hit: false, reference: '渊海子平',
    description: '正财独旺，主财运稳定但需防比劫',
    lifeAreas: ['财富'],
    confidence: 0.80,
  },
]

// ─── AI Explain 知识库 ───

interface TenGodExplainKnowledge {
  name: ShenShi
  element: '同' | '我生' | '我克' | '克我' | '生我'
  category: TenGodCategory
  nature: TenGodNature
  classicalReference: string
  modernInterpretation: string
  personality: string[]
  career: string[]
  wealth: string[]
  marriage: string[]
  health: string[]
  conditions: string
  keywords: string[]
  traits: string[]
  advantages: string[]
  risks: string[]
}

const TEN_GOD_EXPLAIN_KB: TenGodExplainKnowledge[] = [
  {
    name: '比肩', element: '同', category: '比劫', nature: '中性',
    classicalReference: '比肩者，同类也，与日主同五行同阴阳。',
    modernInterpretation: '代表自我意识的投射，独立自主，有竞争意识。',
    personality: ['独立', '自信', '固执', '竞争心强', '自我意识强'],
    career: ['适合独立创业', '管理岗位', '竞争性行业'],
    wealth: ['财运靠自己争取', '不宜合伙', '理财宜自主'],
    marriage: ['感情中追求平等', '可能有竞争者', '适合独立型伴侣'],
    health: ['注意肝胆', '呼吸系统'],
    conditions: '比肩适中为吉，过旺则刚愎自用、不服管束。',
    keywords: ['独立', '竞争', '自我', '固执', '自强'],
    traits: ['自我意识强', '独立不依赖', '行动力佳', '意志坚定'],
    advantages: ['自立自强', '有主见', '抗压能力强'],
    risks: ['刚愎自用', '合作困难', '固执不听劝'],
  },
  {
    name: '劫财', element: '同', category: '比劫', nature: '凶',
    classicalReference: '劫财者，阳见阴、阴见阳，劫夺日主之财。',
    modernInterpretation: '代表外部竞争与争夺，容易因他人影响财运。',
    personality: ['豪爽', '好胜', '冲动', '仗义', '花钱大方'],
    career: ['适合销售', '公关', '运动竞技'],
    wealth: ['财来财去', '容易破财', '需学会储蓄'],
    marriage: ['感情易有波折', '可能有第三者介入', '晚婚较稳'],
    health: ['注意肾脏泌尿', '外伤'],
    conditions: '劫财宜制化，有食伤泄秀或官星约束为吉。',
    keywords: ['争夺', '破财', '冲动', '豪爽', '竞争'],
    traits: ['好胜心强', '慷慨大方', '行动力强', '缺乏耐心'],
    advantages: ['仗义疏财', '社交能力强', '执行力佳'],
    risks: ['财来财去', '感情波折', '冲动决策', '合伙易纠纷'],
  },
  {
    name: '食神', element: '我生', category: '食伤', nature: '吉',
    classicalReference: '食神者，我生之同性，为寿星、福星，主食禄。',
    modernInterpretation: '代表才华、福气、享受能力，是八字中最吉之星。',
    personality: ['温和', '有才华', '享受生活', '人缘好', '有福气'],
    career: ['艺术创作', '餐饮美食', '教育', '文化事业'],
    wealth: ['财运亨通', '有口福之财', '稳定收入'],
    marriage: ['感情甜蜜', '家庭和睦', '子女缘佳'],
    health: ['消化系统', '营养过剩需注意'],
    conditions: '食神为吉神，最怕偏印克制（枭印夺食）。',
    keywords: ['福气', '才华', '温和', '享受', '口福'],
    traits: ['温文尔雅', '有艺术天赋', '善于表达', '乐观知足'],
    advantages: ['才华横溢', '人缘极佳', '生活品质高', '子女缘佳'],
    risks: ['过于安逸', '缺乏进取', '怕枭印夺食'],
  },
  {
    name: '伤官', element: '我生', category: '食伤', nature: '中性',
    classicalReference: '伤官者，我生之异性，聪明才智但叛逆，能克正官。',
    modernInterpretation: '代表创新、叛逆、表演才能，有才华但容易挑战权威。',
    personality: ['聪明', '叛逆', '有才华', '好表现', '不拘小节'],
    career: ['演艺娱乐', '法律', '技术专家', '自由职业'],
    wealth: ['偏财运佳', '靠才华赚钱', '收入不稳定但上限高'],
    marriage: ['感情丰富', '易吸引异性', '需注意沟通'],
    health: ['心脏', '呼吸系统', '眼睛'],
    conditions: '伤官见官为祸，伤官佩印为吉。女命伤官重的婚姻需特别注意。',
    keywords: ['叛逆', '才华', '创新', '表演', '聪明'],
    traits: ['思维敏捷', '敢于突破', '表达力强', '不甘平庸'],
    advantages: ['创新能力强', '才艺出众', '敢于挑战', '领导力'],
    risks: ['伤官见官', '口舌是非', '感情波折', '叛逆过度'],
  },
  {
    name: '偏财', element: '我克', category: '财星', nature: '吉',
    classicalReference: '偏财者，我克之异性，为众人之财，主意外之财。',
    modernInterpretation: '代表偏财运、社交能力、慷慨大方，善于经营人脉。',
    personality: ['大方', '社交能力强', '豪爽', '人缘广', '善于交际'],
    career: ['商业经营', '投资理财', '社交行业', '贸易'],
    wealth: ['偏财运佳', '善于投资', '贵人财多'],
    marriage: ['异性缘佳', '感情丰富', '可能有婚外情倾向'],
    health: ['脾胃消化', '注意饮食'],
    conditions: '偏财不宜被比劫争夺，有官星护财为吉。',
    keywords: ['偏财', '社交', '投资', '慷慨', '异性缘'],
    traits: ['慷慨大方', '善于经营人脉', '商业头脑', '乐观开朗'],
    advantages: ['人脉广泛', '商业嗅觉敏锐', '意外之财', '社交能力'],
    risks: ['比劫夺财', '感情复杂', '挥霍无度', '异性缘过旺'],
  },
  {
    name: '正财', element: '我克', category: '财星', nature: '吉',
    classicalReference: '正财者，我克之同性，为正当之财，主食禄之财。',
    modernInterpretation: '代表稳定收入、勤劳务实、善于理财，是基础财运。',
    personality: ['勤劳', '务实', '节俭', '稳重', '有责任心'],
    career: ['金融财务', '行政管理', '稳定职业'],
    wealth: ['财运稳定', '适合细水长流', '不宜投机'],
    marriage: ['婚姻稳定', '伴侣务实', '家庭责任重'],
    health: ['脾胃', '消化系统'],
    conditions: '正财为吉神，过旺则可能守财太过、缺乏进取。',
    keywords: ['稳定', '务实', '勤劳', '节俭', '正当'],
    traits: ['勤劳务实', '理财有方', '责任心强', '脚踏实地'],
    advantages: ['财运稳定', '婚姻可靠', '理财能力', '信用良好'],
    risks: ['守财太过', '缺乏魄力', '过于保守', '变化不足'],
  },
  {
    name: '偏官', element: '克我', category: '官杀', nature: '凶',
    classicalReference: '偏官者，克我之异性，又名七杀，主权威与压力。',
    modernInterpretation: '代表压力、挑战、权力欲，能激发斗志也带来风险。',
    personality: ['有魄力', '果断', '有野心', '压力大', '不惧挑战'],
    career: ['军警', '企业家', '外科医生', '风险行业'],
    wealth: ['有大起大落', '敢冒险', '高风险高回报'],
    marriage: ['感情中有控制欲', '伴侣需包容', '晚婚较稳'],
    health: ['注意意外伤害', '肝胆', '血压'],
    conditions: '七杀需有食神制或印星化，无制化为祸。',
    keywords: ['压力', '魄力', '冒险', '权力', '挑战'],
    traits: ['果敢决断', '抗压能力强', '有领导力', '敢于冒险'],
    advantages: ['魄力非凡', '化压力为动力', '适合创业', '领导力强'],
    risks: ['压力过大', '意外伤害', '无制化杀为祸', '大起大落'],
  },
  {
    name: '正官', element: '克我', category: '官杀', nature: '吉',
    classicalReference: '正官者，克我之同性，主贵气、守法、名誉。',
    modernInterpretation: '代表事业、地位、管理能力，是仕途与名誉之星。',
    personality: ['正直', '守规矩', '有责任感', '注重名誉', '稳重'],
    career: ['公务员', '管理', '教育', '法律'],
    wealth: ['靠职位得财', '收入稳定', '社会地位高'],
    marriage: ['婚姻正配', '伴侣端庄', '家庭观念重'],
    health: ['肾脏泌尿', '生殖系统'],
    conditions: '正官为吉星，怕伤官克之。正官清纯为贵。',
    keywords: ['正直', '贵气', '管理', '名誉', '守法'],
    traits: ['品行端正', '有管理才能', '责任心强', '注重声誉'],
    advantages: ['社会地位高', '事业稳定', '名声好', '婚姻正配'],
    risks: ['怕伤官克之', '过于循规蹈矩', '缺乏变通', '压力隐忍'],
  },
  {
    name: '偏印', element: '生我', category: '印星', nature: '中性',
    classicalReference: '偏印者，生我之异性，又名枭神，主孤独与偏门学问。',
    modernInterpretation: '代表偏门才华、直觉力、非传统思维，有利有弊。',
    personality: ['思维独特', '直觉强', '内向', '喜欢独处', '有偏才'],
    career: ['研究', '玄学宗教', '艺术', '技术发明'],
    wealth: ['偏门得财', '专利收入', '不稳定'],
    marriage: ['感情中较为冷淡', '需要空间', '晚婚较好'],
    health: ['心脏', '神经系统', '失眠'],
    conditions: '偏印制食神为枭印夺食，偏印化杀为吉。看搭配。',
    keywords: ['偏门', '直觉', '孤独', '偏才', '非传统'],
    traits: ['思维独特', '直觉敏锐', '独立思考', '有偏门才华'],
    advantages: ['直觉力强', '非传统思维', '化杀为吉', '研究能力'],
    risks: ['枭印夺食', '性格孤僻', '人际关系淡', '多疑多虑'],
  },
  {
    name: '正印', element: '生我', category: '印星', nature: '吉',
    classicalReference: '正印者，生我之同性，主学问、贵人、保护。',
    modernInterpretation: '代表学业、贵人庇护、仁慈之心，是最温暖的保护星。',
    personality: ['善良', '仁慈', '好学', '有贵人运', '传统保守'],
    career: ['教育', '学术', '文化', '慈善', '医疗'],
    wealth: ['靠学问得财', '贵人资助', '不宜投机'],
    marriage: ['伴侣有母性光辉', '感情温馨', '家庭和睦'],
    health: ['脾胃', '整体健康较好'],
    conditions: '正印为吉星，怕财星克之。正印得令为学业出众之象。',
    keywords: ['贵人', '学业', '仁慈', '保护', '学问'],
    traits: ['仁慈善良', '好学不倦', '有贵人运', '传统稳重'],
    advantages: ['学业出众', '贵人庇护', '仁慈待人', '名声好'],
    risks: ['财破印', '过于保守', '依赖性强', '缺乏变通'],
  },
]

/** 十神解释知识库索引 */
export const TEN_GOD_EXPLAIN_KB_MAP: Record<ShenShi, TenGodExplainKnowledge> =
  Object.fromEntries(TEN_GOD_EXPLAIN_KB.map(k => [k.name, k])) as Record<ShenShi, TenGodExplainKnowledge>

/** 生成十神 AI Explain 输出 */
export function generateTenGodExplain(
  detail: TenGodDetail,
): TenGodExplainOutput {
  const kb = TEN_GOD_EXPLAIN_KB_MAP[detail.name]
  if (!kb) {
    return {
      name: detail.name, powerSummary: '', classicalReference: '', modernInterpretation: '',
      personality: [], career: [], wealth: [], marriage: [], health: [],
      conditions: '', conflictSituation: null, confidenceAssessment: '', suggestions: [],
      keywords: [], traits: [], advantages: [], risks: [],
    }
  }

  const powerLevel = detail.power > 70 ? '旺盛' : detail.power > 40 ? '中等' : detail.power > 20 ? '偏弱' : '微弱'
  const powerSummary = `${detail.name}${powerLevel}，力量${detail.power.toFixed(0)}分，${detail.deLing ? '得令' : ''}${detail.deDi ? '得地' : ''}${detail.deShi ? '得势' : ''}。`

  const confidenceLevel = detail.confidence > 70 ? '高置信' : detail.confidence > 40 ? '中置信' : '低置信'

  const suggestions: string[] = []
  if (detail.nature === '吉' && detail.power > 40) {
    suggestions.push(`善用${detail.name}之吉象，把握机遇。`)
  } else if (detail.nature === '凶' && detail.power > 40) {
    suggestions.push(`注意${detail.name}之凶象，谨慎行事。`)
  }
  if (detail.power > 70) {
    suggestions.push(`${detail.name}过旺，需防物极必反，适度平衡为佳。`)
  } else if (detail.power < 20 && detail.count > 0) {
    suggestions.push(`${detail.name}力量偏弱，可通过后天补益增强。`)
  }

  return {
    name: detail.name,
    powerSummary,
    classicalReference: kb.classicalReference,
    modernInterpretation: kb.modernInterpretation,
    personality: kb.personality,
    career: kb.career,
    wealth: kb.wealth,
    marriage: kb.marriage,
    health: kb.health,
    conditions: kb.conditions,
    conflictSituation: null,
    confidenceAssessment: `${confidenceLevel}，可信度${detail.confidence}分。`,
    suggestions,
    keywords: kb.keywords,
    traits: kb.traits,
    advantages: kb.advantages,
    risks: kb.risks,
  }
}
