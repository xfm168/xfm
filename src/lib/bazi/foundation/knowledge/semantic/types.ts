/**
 * 语义层（Semantic Layer）类型定义
 *
 * 负责把古籍原文、流派术语、现代命理概念等"异名同实"的文本，
 * 统一映射为规范化概念（unifiedConcept），提供跨流派的消歧能力。
 */

/** 语义映射类别 */
export type SemanticCategory =
  | 'concept'          // 抽象概念（格局、理气）
  | 'pattern'          // 具体格局/命局模式
  | 'wuxing_relation'  // 五行生克关系
  | 'fortune'          // 运势/吉凶类
  | 'event'            // 具体事件类

/** 语义映射变体（某本古籍对同一概念的原始表述） */
export interface SemanticVariant {
  /** 出处古籍名称 */
  classicName: string
  /** 章节（可选） */
  chapter?: string
  /** 原文 */
  originalText: string
  /** 现代释义/解读 */
  interpretation: string
  /** 该变体与统一概念的匹配置信度 0~1 */
  confidence: number
}

/** 语义映射条目 */
export interface SemanticMapping {
  /** 唯一 ID */
  id: string
  /** 统一概念名（标准称谓） */
  unifiedConcept: string
  /** 类别 */
  category: SemanticCategory
  /** 各古籍/流派变体 */
  variants: SemanticVariant[]
  /** 相关五行 */
  relatedWuxing: string[]
  /** 相关概念（关联概念 ID 或名称） */
  relatedConcepts: string[]
  /** 争议程度 0~1（越高表示流派之间分歧越大） */
  controversyLevel: number
  /** 是否为权威共识（子平真诠/滴天髓等均一致认可） */
  authoritative: boolean
}

/** 语义解析结果 */
export interface SemanticResolution {
  /** 原始查询文本 */
  queryText: string
  /** 最佳匹配（可空） */
  matched: SemanticMapping | null
  /** 候选列表（按置信度降序） */
  candidates: SemanticMapping[]
  /** 最佳匹配置信度 0~1 */
  confidence: number
  /** 推理过程（便于审计） */
  reasoning: string[]
}

/**
 * 种子语义映射（12 个核心命理概念，每个 2+ 变体）
 */
export const SEED_SEMANTIC_MAPPINGS: SemanticMapping[] = [
  {
    id: 'SEM-001',
    unifiedConcept: '木火通明',
    category: 'pattern',
    variants: [
      {
        classicName: '子平真诠',
        chapter: '论格局取用',
        originalText: '木火通明，文章盖世。春木逢火，秀气流行。',
        interpretation: '日主木生于春月，局中火旺泄秀，木火相生，主文采卓越、声名显赫。',
        confidence: 0.95,
      },
      {
        classicName: '滴天髓',
        chapter: '通神论',
        originalText: '木火交辉，文明之象。木得火而敷荣，火得木而光明。',
        interpretation: '木火力量均衡相生，形成"文明"气象，主学问、文艺、口才出众。',
        confidence: 0.9,
      },
      {
        classicName: '三命通会',
        chapter: '论木火',
        originalText: '甲乙木见丙丁，号曰木火通明，春夏遇之最吉。',
        interpretation: '甲乙木日干见丙丁火透出，生于春夏最吉，属木火通明格。',
        confidence: 0.88,
      },
    ],
    relatedWuxing: ['木', '火'],
    relatedConcepts: ['扶抑', '调候', '身强/身旺'],
    controversyLevel: 0.1,
    authoritative: true,
  },
  {
    id: 'SEM-002',
    unifiedConcept: '水火既济',
    category: 'wuxing_relation',
    variants: [
      {
        classicName: '滴天髓',
        chapter: '理气篇',
        originalText: '水火既济，阴阳相契。火旺得水，方成相济；水旺得火，方成暖局。',
        interpretation: '水火力量均衡、互相制约又相辅相成，达到阴阳调和的理想状态。',
        confidence: 0.92,
      },
      {
        classicName: '穷通宝鉴',
        chapter: '调候总论',
        originalText: '寒水无火，虽多无益；烈火无水，虽旺必枯。二者相需，是谓既济。',
        interpretation: '冬水用火调候、夏火用水调候，水火互为所需，称为既济。',
        confidence: 0.9,
      },
    ],
    relatedWuxing: ['水', '火'],
    relatedConcepts: ['调候', '水火未济'],
    controversyLevel: 0.15,
    authoritative: true,
  },
  {
    id: 'SEM-003',
    unifiedConcept: '水火未济',
    category: 'wuxing_relation',
    variants: [
      {
        classicName: '滴天髓',
        chapter: '理气篇',
        originalText: '水火未济，偏枯之象。水旺火弱则寒，火盛水衰则燥。',
        interpretation: '水火力量失衡，一方过旺一方过衰，形成偏寒或偏燥的不吉格局。',
        confidence: 0.9,
      },
      {
        classicName: '子平真诠',
        chapter: '论用神',
        originalText: '水火不交，两不相谋。上热下寒，中无所主。',
        interpretation: '火炎于上而水涸于下，或水寒于下而火熄于上，皆属未济，用神难定。',
        confidence: 0.88,
      },
    ],
    relatedWuxing: ['水', '火'],
    relatedConcepts: ['水火既济', '调候', '病药'],
    controversyLevel: 0.15,
    authoritative: true,
  },
  {
    id: 'SEM-004',
    unifiedConcept: '土金相生',
    category: 'wuxing_relation',
    variants: [
      {
        classicName: '子平真诠',
        chapter: '论五行生克',
        originalText: '土生金，金赖土以成器；金泄土，土得金而疏通。',
        interpretation: '土为金之母，土厚方能金旺；金为土之子，金旺土气得以流通不壅。',
        confidence: 0.93,
      },
      {
        classicName: '三命通会',
        chapter: '论土',
        originalText: '土旺生金，金多则土虚。土虚逢火则实，金旺得水则清。',
        interpretation: '土金相生但金不可过旺，过旺则土被泄虚；土虚喜火补，金旺喜水洗。',
        confidence: 0.87,
      },
    ],
    relatedWuxing: ['土', '金'],
    relatedConcepts: ['通关', '扶抑'],
    controversyLevel: 0.1,
    authoritative: true,
  },
  {
    id: 'SEM-005',
    unifiedConcept: '从格',
    category: 'pattern',
    variants: [
      {
        classicName: '滴天髓',
        chapter: '从象篇',
        originalText: '从得真者只论从，从神又有吉和凶。真从之象有几人，假从亦可发其身。',
        interpretation: '日主极弱无根、满局皆克泄，只能从其势。真从贵格罕见，假从若顺其势亦可发福。',
        confidence: 0.94,
      },
      {
        classicName: '子平真诠',
        chapter: '论从格',
        originalText: '从者，日主无气，舍命而从之也。从财从官从杀从儿，各有分别。',
        interpretation: '日主无气无助，不得不弃命从局中旺神，分从财、从官杀、从儿等类。',
        confidence: 0.92,
      },
      {
        classicName: '三命通会',
        chapter: '论从革',
        originalText: '从格最忌根气，一微根则破格，名假从，祸福相半。',
        interpretation: '从格最关键是日主不得有丝毫根气，有微根即破从格为假从，吉凶参半。',
        confidence: 0.9,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['身弱/身衰', '扶抑', '用神喜神忌神闲神仇神'],
    controversyLevel: 0.7,
    authoritative: false,
  },
  {
    id: 'SEM-006',
    unifiedConcept: '扶抑',
    category: 'concept',
    variants: [
      {
        classicName: '子平真诠',
        chapter: '论用神',
        originalText: '用神者，扶抑日主之神也。身强则抑之，身弱则扶之。',
        interpretation: '取用神的核心原则：日主过强则用克泄耗抑制，日主过弱则用生扶辅助。',
        confidence: 0.97,
      },
      {
        classicName: '滴天髓',
        chapter: '体用篇',
        originalText: '强众而敌寡者，势在去其寡；强寡而敌众者，势在成乎众。扶之抑之，得其中和。',
        interpretation: '当一方势力明显占优时，顺其势去寡或助众，总之使格局趋于中和。',
        confidence: 0.93,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['身强/身旺', '身弱/身衰', '用神喜神忌神闲神仇神'],
    controversyLevel: 0.1,
    authoritative: true,
  },
  {
    id: 'SEM-007',
    unifiedConcept: '通关',
    category: 'concept',
    variants: [
      {
        classicName: '滴天髓',
        chapter: '通关篇',
        originalText: '关内有织女，关内有牛郎，黄婆媒妁，配合相当。',
        interpretation: '两种五行相冲相克时，引入中间五行作为桥梁，使克化为生，如金木之间用水通关。',
        confidence: 0.92,
      },
      {
        classicName: '穷通宝鉴',
        chapter: '总论',
        originalText: '两神相战，通关为上。金木交争，得水以通；水火交战，得木以和。',
        interpretation: '金木相战时用水（金生水水生木），水火相战时用木（水生木木生火），皆为通关之法。',
        confidence: 0.9,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['病药', '扶抑'],
    controversyLevel: 0.2,
    authoritative: true,
  },
  {
    id: 'SEM-008',
    unifiedConcept: '调候',
    category: 'concept',
    variants: [
      {
        classicName: '穷通宝鉴',
        chapter: '调候总论',
        originalText: '调候为急，用神次之。先看气候寒暖燥湿，次定扶抑。',
        interpretation: '命理第一要义是调节气候：冬生寒极须火暖，夏生燥极须水润，调候优先于扶抑。',
        confidence: 0.96,
      },
      {
        classicName: '滴天髓',
        chapter: '寒暖燥湿篇',
        originalText: '天道有寒暖，地道有燥湿，人道得其中和则生。寒甚喜火，燥甚喜水。',
        interpretation: '命局模拟天地气候，过寒过热、过湿过燥皆为病，须以对治之神调和。',
        confidence: 0.93,
      },
      {
        classicName: '子平真诠',
        chapter: '论气候',
        originalText: '四时之令不同，用神随之而异。冬月无火，虽有美材，亦属寒谷。',
        interpretation: '不同月令气候差异巨大，冬月之命哪怕格局再好，缺火调候也是寒谷之木，难以生发。',
        confidence: 0.91,
      },
    ],
    relatedWuxing: ['水', '火'],
    relatedConcepts: ['病药', '水火既济', '水火未济'],
    controversyLevel: 0.35,
    authoritative: true,
  },
  {
    id: 'SEM-009',
    unifiedConcept: '病药',
    category: 'concept',
    variants: [
      {
        classicName: '滴天髓',
        chapter: '病药篇',
        originalText: '有病方为贵，无伤不是奇。格中如去病，财禄两相随。',
        interpretation: '命局有"病"（克泄交加、冲战、偏枯）并不可怕，关键要有"药"（用神）去治病。',
        confidence: 0.95,
      },
      {
        classicName: '子平真诠',
        chapter: '论病药',
        originalText: '何以为病？局中杂乱是也；何以为药？去其杂乱之神是也。病重药轻，药到病除为上。',
        interpretation: '命局中之阻滞、过旺、缺失皆为病，能对治此缺陷的即为药神，药得力则吉。',
        confidence: 0.92,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['调候', '扶抑', '通关'],
    controversyLevel: 0.25,
    authoritative: true,
  },
  {
    id: 'SEM-010',
    unifiedConcept: '身强/身旺',
    category: 'concept',
    variants: [
      {
        classicName: '子平真诠',
        chapter: '论日主强弱',
        originalText: '身强者，日主得令得地得势也。得令者旺，得地者根，得势者助。',
        interpretation: '判断身强有三条：得令（月令生扶）、得地（通根有气）、得势（比劫印绶多助）。',
        confidence: 0.94,
      },
      {
        classicName: '滴天髓',
        chapter: '旺衰篇',
        originalText: '得时俱为旺论，失令便作衰看。根深则旺，根浅则衰。党多则强，党少则弱。',
        interpretation: '以月令为主，参看通根与党众（同类五行多寡）综合判断日主旺衰强弱。',
        confidence: 0.93,
      },
      {
        classicName: '三命通会',
        chapter: '论身旺',
        originalText: '身旺之人，喜克泄耗，忌生扶。身旺无制则为刚愎自用，招灾惹祸。',
        interpretation: '身旺之命，用神取克（官杀）、泄（食伤）、耗（财星），忌再见印比生扶。',
        confidence: 0.9,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['身弱/身衰', '扶抑', '用神喜神忌神闲神仇神'],
    controversyLevel: 0.4,
    authoritative: true,
  },
  {
    id: 'SEM-011',
    unifiedConcept: '身弱/身衰',
    category: 'concept',
    variants: [
      {
        classicName: '子平真诠',
        chapter: '论日主强弱',
        originalText: '身弱者，日主失令失地失势也。失令则衰，根浅则弱，无助则微。',
        interpretation: '日主不得月令生扶、通根浅薄、印比寡助，即为身弱，需印比扶身。',
        confidence: 0.94,
      },
      {
        classicName: '滴天髓',
        chapter: '旺衰篇',
        originalText: '日主虽衰，通根则有托。印绶虽少，生身则有功。弱极者论从，否则宜扶。',
        interpretation: '身弱但有微根或印绶生者，不能从格，须印比扶助；全无依赖方论从。',
        confidence: 0.92,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['身强/身旺', '扶抑', '从格', '用神喜神忌神闲神仇神'],
    controversyLevel: 0.4,
    authoritative: true,
  },
  {
    id: 'SEM-012',
    unifiedConcept: '用神喜神忌神闲神仇神',
    category: 'concept',
    variants: [
      {
        classicName: '子平真诠',
        chapter: '论用神喜忌',
        originalText: '用神者，辅弼日主之神也。喜神，生扶用神者也。忌神，克害用神者也。闲神，无用者也。仇神，喜神之敌也。',
        interpretation: '五神之分：用神为核心辅佐；喜神为用神之党；忌神直克用神；闲神作用不大；仇神克制喜神、间接助忌。',
        confidence: 0.95,
      },
      {
        classicName: '滴天髓',
        chapter: '体用篇',
        originalText: '道有体用，不可以一端论也。要在扶之抑之得其宜，喜忌仇闲各有所归。',
        interpretation: '体用喜忌须结合格局全局，不可刻板。扶抑得宜则喜忌定，仇闲之位由此而出。',
        confidence: 0.9,
      },
      {
        classicName: '三命通会',
        chapter: '论用神',
        originalText: '用神为君，喜神为相，忌神为寇，闲神为过客，仇神为内奸。',
        interpretation: '形象比喻：用神如国君、喜神如宰相、忌神如外寇、闲神如路人、仇神如内部反叛。',
        confidence: 0.91,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['扶抑', '调候', '病药', '通关'],
    controversyLevel: 0.5,
    authoritative: true,
  },
  {
    id: 'SEM-013',
    unifiedConcept: '伤官佩印',
    category: 'pattern',
    variants: [
      {
        classicName: '子平真诠',
        chapter: '论伤官',
        originalText: '伤官见官，为祸百端；伤官佩印，贵不可言。身弱伤官旺，以印制伤生身。',
        interpretation: '伤官格日主弱，用印星克制伤官同时生日主，为伤官佩印，主文贵、权柄。',
        confidence: 0.93,
      },
      {
        classicName: '滴天髓',
        chapter: '伤官篇',
        originalText: '伤官旺，日主弱，印绶得所，可许功名。伤官见印，虽巧必贫，何也？身旺反克泄也。',
        interpretation: '伤官佩印只宜身弱；若身旺用泄再见印星，则反克食伤，华而不实。',
        confidence: 0.91,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['扶抑', '用神喜神忌神闲神仇神', '身弱/身衰'],
    controversyLevel: 0.3,
    authoritative: true,
  },
  {
    id: 'SEM-014',
    unifiedConcept: '杀印相生',
    category: 'pattern',
    variants: [
      {
        classicName: '子平真诠',
        chapter: '论七杀',
        originalText: '七杀逢印，化杀为权，杀印相生，功名显达。',
        interpretation: '七杀格有印星通关，七杀不克日主反生印，印再生身，为"化杀为权"的贵格。',
        confidence: 0.94,
      },
      {
        classicName: '三命通会',
        chapter: '论偏官',
        originalText: '身弱有杀，印绶可化；身旺有杀，食神可制。印化杀则贵，食制杀则武。',
        interpretation: '杀印相生属文贵路线（权柄文职），食神制杀属武贵路线（军功技术）。',
        confidence: 0.89,
      },
    ],
    relatedWuxing: [],
    relatedConcepts: ['通关', '扶抑', '用神喜神忌神闲神仇神'],
    controversyLevel: 0.2,
    authoritative: true,
  },
]
