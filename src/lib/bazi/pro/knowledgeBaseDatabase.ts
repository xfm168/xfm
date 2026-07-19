/**
 * V4.5 Phase 2: Knowledge Base Database — 命理知识库 + 专家验证数据
 *
 * 包含：
 *  1. KNOWLEDGE_BASE      — 20 条命理知识条目（覆盖多分类）
 *  2. EXPERT_VALIDATIONS  — 5 条专家验证记录
 *  3. LEARNING_QUEUE_DATA — 3 条学习队列（争议案例）
 *  4. REGRESSION_LOCKS    — 2 条回归锁
 *  5. 查询函数            — 按分类/来源/ID/状态等检索
 */

import type {
  KnowledgeCategory,
  KnowledgeEntry,
  KnowledgeSource,
  ExpertValidationRecord,
  LearningQueueItem,
  RegressionLock,
  ReviewStatus,
} from './knowledgeBaseTypes'

// ═══════════════════════════════════════════════════════════════
// 1. KNOWLEDGE_BASE — 命理知识库（20 条样本）
// ═══════════════════════════════════════════════════════════════

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ---------- 十神类（KB-001 ~ KB-003）----------

  {
    id: 'KB-001',
    source: '三命通会',
    chapter: '论十干',
    originalText: '甲木生寅月，旺相之地，冠带之位',
    modernExplanation: '甲木日主生于寅月，寅为甲木临官之地，木气旺盛，比肩力量最强',
    keywords: ['甲木', '寅月', '临官', '木旺'],
    category: '十神',
    associations: [
      { type: '十神', value: '比肩' },
      { type: '五行', value: '木' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
  {
    id: 'KB-002',
    source: '滴天髓',
    chapter: '论十干',
    originalText: '丁火柔中，内性昭融。抱乙而孝，合壬而忠',
    modernExplanation: '丁火日主性格柔和而内心光明，与乙木相合体现孝道，与壬水相合体现忠信',
    keywords: ['丁火', '柔中', '乙木', '壬水'],
    category: '十神',
    associations: [
      { type: '十神', value: '正印' },
      { type: '十神', value: '正官' },
      { type: '五行', value: '火' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-003',
    source: '子平真诠',
    chapter: '论十干配合',
    originalText: '食神有生财之能，而财有养命之资',
    modernExplanation: '食神具备生扶财星的能力，财星代表养命之源，食神生财为自然之流通',
    keywords: ['食神', '生财', '财星', '流通'],
    category: '十神',
    associations: [
      { type: '十神', value: '食神' },
      { type: '十神', value: '偏财' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },

  // ---------- 格局类（KB-004 ~ KB-006）----------

  {
    id: 'KB-004',
    source: '三命通会',
    chapter: '论正官格',
    originalText: '正官者，乃本命主气，禀天之正气。以克制为义，与七杀不同',
    modernExplanation: '正官为日主所克之阴阳异性天干，代表天道的正气约束，与七杀的偏官强制力有本质区别',
    keywords: ['正官', '主气', '正气', '七杀'],
    category: '格局',
    associations: [
      { type: '格局', value: '正官格' },
      { type: '十神', value: '正官' },
    ],
    citationLevel: 'primary',
    confidence: 0.96,
  },
  {
    id: 'KB-005',
    source: '子平真诠',
    chapter: '论用神',
    originalText: '八字用神，专求月令，以四柱配之。月令为提纲，最要紧处',
    modernExplanation: '选取用神首先看月令，月令是八字的核心枢纽，决定命局的总体格局走向',
    keywords: ['用神', '月令', '提纲', '格局'],
    category: '格局',
    associations: [
      { type: '格局', value: '月令用神' },
      { type: '章节', value: '论用神' },
    ],
    citationLevel: 'primary',
    confidence: 0.97,
  },
  {
    id: 'KB-006',
    source: '神峰通考',
    chapter: '论偏官格',
    originalText: '偏官者，乃甲见庚、乙见辛之类。若有食神制之，化为权贵',
    modernExplanation: '偏官即七杀，日主被同性天干克制。若有食神制杀，则杀被驯化为权威与贵气',
    keywords: ['偏官', '七杀', '食神制杀', '权贵'],
    category: '格局',
    associations: [
      { type: '格局', value: '七杀格' },
      { type: '十神', value: '七杀' },
      { type: '十神', value: '食神' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },

  // ---------- 喜用神类（KB-007 ~ KB-008）----------

  {
    id: 'KB-007',
    source: '穷通宝鉴',
    chapter: '论甲木用神',
    originalText: '三春甲木，总以庚金为用。初春丙火佐之，仲春庚金为主，季春水火并用',
    modernExplanation: '春季三个月的甲木命局均以庚金为用神：初春需丙火暖局，仲春庚金为主力修剪，季春水火两济',
    keywords: ['甲木', '庚金', '丙火', '春季'],
    category: '喜用神',
    associations: [
      { type: '喜用神', value: '庚金' },
      { type: '五行', value: '金' },
      { type: '五行', value: '火' },
    ],
    citationLevel: 'primary',
    confidence: 0.94,
  },
  {
    id: 'KB-008',
    source: '滴天髓',
    chapter: '论用神',
    originalText: '何知其人富，财气通门户。何知其人贵，官星有理会',
    modernExplanation: '判断一个人是否富裕，关键看财星能否流通有情；判断一个人是否有贵气，看官星是否得到合理的安顿',
    keywords: ['财气', '官星', '富贵', '门户'],
    category: '喜用神',
    associations: [
      { type: '喜用神', value: '财星' },
      { type: '喜用神', value: '官星' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },

  // ---------- 合化类（KB-009 ~ KB-010）----------

  {
    id: 'KB-009',
    source: '渊海子平',
    chapter: '论天干合化',
    originalText: '甲己合化土，中正之合。若得辰戌丑未旺地，化气方真',
    modernExplanation: '甲与己相合化为土气，称为中正之合。必须在地支辰戌丑未土旺之地，合化才能真实成立',
    keywords: ['甲己合', '化土', '中正之合', '辰戌丑未'],
    category: '合化',
    associations: [
      { type: '五行', value: '土' },
      { type: '五行', value: '木' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-010',
    source: '协纪辨方书',
    chapter: '论地支六合',
    originalText: '子丑合土，寅亥合木，卯戌合火，辰酉合金，巳申合水，午未合土',
    modernExplanation: '地支六合为子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合土，合化结果取决于地支本气',
    keywords: ['六合', '子丑合', '寅亥合', '地支合化'],
    category: '合化',
    associations: [
      { type: '五行', value: '土' },
      { type: '五行', value: '木' },
      { type: '五行', value: '火' },
      { type: '五行', value: '金' },
      { type: '五行', value: '水' },
    ],
    citationLevel: 'primary',
    confidence: 0.98,
  },

  // ---------- 冲刑类（KB-011 ~ KB-012）----------

  {
    id: 'KB-011',
    source: '三命通会',
    chapter: '论地支相冲',
    originalText: '子午相冲，水火交战。丑未相冲，土气激荡。寅申相冲，金木交争',
    modernExplanation: '地支六冲体现对立力量的碰撞：子午冲为水火之战，丑未冲为土气内荡，寅申冲为金木之争',
    keywords: ['子午冲', '丑未冲', '寅申冲', '六冲'],
    category: '冲刑',
    associations: [
      { type: '五行', value: '水' },
      { type: '五行', value: '火' },
      { type: '五行', value: '金' },
      { type: '五行', value: '木' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
  {
    id: 'KB-012',
    source: '渊海子平',
    chapter: '论地支相刑',
    originalText: '寅巳申为无恩之刑，丑戌未为恃势之刑，子卯为无礼之刑，辰午酉亥为自刑',
    modernExplanation: '地支三刑分为四类：无恩之刑（寅巳申）忘恩负义，恃势之刑（丑戌未）仗势欺人，无礼之刑（子卯）失礼冒犯，自刑（辰午酉亥）自我矛盾',
    keywords: ['三刑', '无恩之刑', '恃势之刑', '无礼之刑'],
    category: '冲刑',
    associations: [
      { type: '五行', value: '木' },
      { type: '五行', value: '火' },
      { type: '五行', value: '金' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },

  // ---------- 五行类（KB-013 ~ KB-014）----------

  {
    id: 'KB-013',
    source: '滴天髓',
    chapter: '论五行',
    originalText: '五行不可偏枯，务要中和。太过宜泄不宜克，不及宜补不宜泄',
    modernExplanation: '五行之气贵在中和均衡，不可某一五行过旺或过弱。过旺之五行宜用泄法而不宜直接克制，过弱之五行宜生扶而不宜再泄',
    keywords: ['五行', '中和', '偏枯', '泄补'],
    category: '五行',
    associations: [
      { type: '喜用神', value: '中和' },
      { type: '五行', value: '木' },
      { type: '五行', value: '火' },
      { type: '五行', value: '土' },
      { type: '五行', value: '金' },
      { type: '五行', value: '水' },
    ],
    citationLevel: 'primary',
    confidence: 0.96,
  },
  {
    id: 'KB-014',
    source: '穷通宝鉴',
    chapter: '论五行生克',
    originalText: '木赖水生，水多木浮。木能生火，火多木焚。木旺得金，方成栋梁',
    modernExplanation: '五行生克需看力量的平衡：水生木但水过则木浮，木生火但火过则木焚，木旺时需金修剪方能成材',
    keywords: ['木', '水生木', '木生火', '金克木'],
    category: '五行',
    associations: [
      { type: '五行', value: '木' },
      { type: '五行', value: '水' },
      { type: '五行', value: '火' },
      { type: '五行', value: '金' },
    ],
    citationLevel: 'primary',
    confidence: 0.94,
  },

  // ---------- 大运类（KB-015 ~ KB-016）----------

  {
    id: 'KB-015',
    source: '三命通会',
    chapter: '论大运',
    originalText: '大运者，人生之大关卡也。顺行者，自生日顺数至未来节；逆行者，自生日逆数至已过节',
    modernExplanation: '大运代表人生十年一变的运势走向。阳年生男或阴年生女为顺行，反之为逆行，顺逆决定起运方向',
    keywords: ['大运', '顺行', '逆行', '起运'],
    category: '大运',
    associations: [
      { type: '大运', value: '顺行' },
      { type: '大运', value: '逆行' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
  {
    id: 'KB-016',
    source: '子平真诠',
    chapter: '论行运',
    originalText: '运从月柱而出，以月令为根基。运好不如命好，命好不如运好，命运两停为上',
    modernExplanation: '大运从月柱推导而出，以月令为基点。命局是先天基础，大运是后天际遇，命局与运程平衡为最佳',
    keywords: ['大运', '月令', '命运', '两停'],
    category: '大运',
    associations: [
      { type: '大运', value: '月柱起运' },
      { type: '格局', value: '月令' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },

  // ---------- 事业/财运（KB-017 ~ KB-018）----------

  {
    id: 'KB-017',
    source: '滴天髓',
    chapter: '论事业',
    originalText: '何知其人能立业，官印相生。何知其人多奔波，伤官见官',
    modernExplanation: '官印相生代表有权威且有后盾，事业稳定可成；伤官见官代表叛逆而不安分，事业多变动坎坷',
    keywords: ['官印相生', '伤官见官', '事业', '立业'],
    category: '事业',
    associations: [
      { type: '十神', value: '正官' },
      { type: '十神', value: '正印' },
      { type: '十神', value: '伤官' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },
  {
    id: 'KB-018',
    source: '渊海子平',
    chapter: '论财运',
    originalText: '身旺财旺，天下富翁。身弱财旺，富屋贫人。财多身弱，富屋贫人，当看印绶如何',
    modernExplanation: '日主旺且财星旺者真正富裕；日主弱而财星旺者看似有钱实则无力支配，需看印星是否扶身方能守财',
    keywords: ['身旺财旺', '身弱财旺', '印绶', '财运'],
    category: '财运',
    associations: [
      { type: '十神', value: '偏财' },
      { type: '十神', value: '正印' },
      { type: '喜用神', value: '印星' },
    ],
    citationLevel: 'primary',
    confidence: 0.94,
  },

  // ---------- 婚姻（KB-019）----------

  {
    id: 'KB-019',
    source: '三命通会',
    chapter: '论夫妻',
    originalText: '男以财为妻，女以官为夫。男命财星得位，妻贤家和睦；女命官星有理，夫贵自身荣',
    modernExplanation: '男命以正财或偏财代表妻子，财星得位有力则妻贤家顺；女命以正官代表丈夫，官星合理有力则夫贵家荣',
    keywords: ['财为妻', '官为夫', '婚姻', '夫妻'],
    category: '婚姻',
    associations: [
      { type: '十神', value: '正财' },
      { type: '十神', value: '正官' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },

  // ---------- 健康（KB-020）----------

  {
    id: 'KB-020',
    source: '滴天髓',
    chapter: '论疾病',
    originalText: '五行和者，一世无灾。偏枯太甚者，其身多疾。木弱逢金，肝胆之患；火衰遇水，心血之亏',
    modernExplanation: '五行中和平衡者身体健康少灾。五行严重失衡则多疾病：木弱被金克伤及肝胆，火衰被水克伤及心脏血脉',
    keywords: ['五行和', '偏枯', '肝胆', '心血', '健康'],
    category: '健康',
    associations: [
      { type: '五行', value: '木' },
      { type: '五行', value: '金' },
      { type: '五行', value: '火' },
      { type: '五行', value: '水' },
    ],
    citationLevel: 'primary',
    confidence: 0.88,
  },

  // ---------- 四柱类（KB-021）----------
  {
    id: 'KB-021',
    source: '三命通会',
    chapter: '论四柱',
    originalText: '四柱者，年月日时也。年为根，月为苗，日为花，时为果',
    modernExplanation: '四柱为八字的基本框架：年柱代表祖业根基，月柱代表父母与青年，日柱代表自身与配偶，时柱代表子女与晚年',
    keywords: ['四柱', '年柱', '月柱', '日柱', '时柱'],
    category: '四柱',
    associations: [
      { type: '五行', value: '综合' },
    ],
    citationLevel: 'primary',
    confidence: 0.97,
  },

  // ---------- 神煞类（KB-022）----------
  {
    id: 'KB-022',
    source: '渊海子平',
    chapter: '论天乙贵人',
    originalText: '天乙贵人者，命中最吉之神。甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎',
    modernExplanation: '天乙贵人为八字神煞中最吉之神煞，以日干查对，逢之者多得贵人相助，遇事逢凶化吉',
    keywords: ['天乙贵人', '神煞', '贵人'],
    category: '神煞',
    associations: [
      { type: '神煞', value: '天乙贵人' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },

  // ---------- 流年类（KB-023）----------
  {
    id: 'KB-023',
    source: '三命通会',
    chapter: '论流年',
    originalText: '流年者，一年之运气也。太岁当头坐，诸煞皆伏',
    modernExplanation: '流年代表每一年的具体运势，太岁（流年地支）为本年主导力量，与大运、命局共同作用',
    keywords: ['流年', '太岁', '岁运'],
    category: '流年',
    associations: [
      { type: '大运', value: '流年' },
      { type: '流年', value: '太岁' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },

  // ---------- 命局总论类（KB-024）----------
  {
    id: 'KB-024',
    source: '滴天髓',
    chapter: '论命局',
    originalText: '欲识三元万法宗，先观帝载与神功。坤元合德机缄通，五气偏全定吉凶',
    modernExplanation: '认识命理的根本在于观察天地五行的偏全状态，五行的均衡与失衡决定了一个命局的总体吉凶走向',
    keywords: ['命局', '三元', '五行偏全', '吉凶'],
    category: '命局总论',
    associations: [
      { type: '五行', value: '综合' },
      { type: '格局', value: '总论' },
    ],
    citationLevel: 'primary',
    confidence: 0.96,
  },

  // ---------- 调候类（KB-025）----------
  {
    id: 'KB-025',
    source: '穷通宝鉴',
    chapter: '论调候',
    originalText: '调候者，调和气候也。凡八字过寒过暖，皆需调候以救其偏',
    modernExplanation: '调候是命理中的重要概念，当命局五行偏寒或偏暖时，需要用特定的五行来调和气候，使命局趋于中和',
    keywords: ['调候', '寒暖', '气候', '中和'],
    category: '调候',
    associations: [
      { type: '五行', value: '火' },
      { type: '五行', value: '水' },
      { type: '喜用神', value: '调候用神' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },

  // ---------- 学业类（KB-026）----------
  {
    id: 'KB-026',
    source: '滴天髓',
    chapter: '论学业',
    originalText: '印绶得令，文昌入命，学业有成。伤官佩印，才智超群',
    modernExplanation: '印星代表学业和文凭，印绶有力且得令者学业顺利。伤官配印格局者通常聪明过人、才华出众',
    keywords: ['印绶', '文昌', '学业', '伤官佩印'],
    category: '学业',
    associations: [
      { type: '十神', value: '正印' },
      { type: '十神', value: '偏印' },
      { type: '十神', value: '伤官' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },

  // ═══════════════════════════════════════════════════════════════
  // Phase 4 扩充条目（KB-027 ~ KB-076）
  // ═══════════════════════════════════════════════════════════════

  // ---------- 十神深入（KB-027 ~ KB-031）----------

  {
    id: 'KB-027',
    source: '子平真诠',
    chapter: '论印绶',
    originalText: '印绶者，生我之神。正印为正宗之生，偏印为旁流之生。印多反为身累，印绶宜身弱用之',
    modernExplanation: '正印与偏印均为生扶日主的力量，正印为异性相生故为正宗，偏印为同性相生故为旁流。印星过多反而使日主依赖成性失去独立，适合身弱的命局使用',
    keywords: ['正印', '偏印', '生扶', '印多身累'],
    category: '十神',
    associations: [
      { type: '十神', value: '正印' },
      { type: '十神', value: '偏印' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
  {
    id: 'KB-028',
    source: '滴天髓',
    chapter: '论比劫',
    originalText: '比肩者，同类也。劫财者，夺财之神。比肩过多则争财，劫财太过则破耗',
    modernExplanation: '比肩与劫财同为与日主同类之五行，比肩为同性助力，劫财为异性争夺。比肩过旺则与日主争权争财，劫财过旺则钱财难聚、容易破耗',
    keywords: ['比肩', '劫财', '争财', '破耗', '同类'],
    category: '十神',
    associations: [
      { type: '十神', value: '比肩' },
      { type: '十神', value: '劫财' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-029',
    source: '三命通会',
    chapter: '论正官',
    originalText: '正官者，克我而与我异性。官星有理，贵气自生。官畏伤官，若有印化，反为大贵',
    modernExplanation: '正官为日主所克之异性天干，代表合理的管束与社会规范。官星若被伤官克制则贵气受损，但若有印星来化解伤官之力，反而能成大贵之格',
    keywords: ['正官', '伤官', '官印相生', '贵气'],
    category: '十神',
    associations: [
      { type: '十神', value: '正官' },
      { type: '十神', value: '伤官' },
      { type: '十神', value: '正印' },
    ],
    citationLevel: 'primary',
    confidence: 0.94,
  },
  {
    id: 'KB-030',
    source: '神峰通考',
    chapter: '论七杀',
    originalText: '七杀者，克我而与我同性。其性刚烈，若无制化，必为祸端。有食制之，或印化之，方为权柄',
    modernExplanation: '七杀为日主所克之同性天干，克制力量最为猛烈刚强。若无食神制杀或印星化杀，七杀将成为命局的祸患。制化得当则七杀转化为权柄与魄力',
    keywords: ['七杀', '食神制杀', '印化杀', '权柄'],
    category: '十神',
    associations: [
      { type: '十神', value: '七杀' },
      { type: '十神', value: '食神' },
      { type: '十神', value: '偏印' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },
  {
    id: 'KB-031',
    source: '渊海子平',
    chapter: '论食伤',
    originalText: '食神者，我生而同性，其性和缓，为寿星。伤官者，我生而异性，其性锐利，为才星。食伤吐秀，必主聪明',
    modernExplanation: '食神与伤官同为日主所生之五行，食神同性生故性温和，代表长寿与福气；伤官异性生故性锐利，代表才智与创造力。食伤旺盛者聪明伶俐、才华横溢',
    keywords: ['食神', '伤官', '吐秀', '寿星', '才星'],
    category: '十神',
    associations: [
      { type: '十神', value: '食神' },
      { type: '十神', value: '伤官' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },

  // ---------- 格局深入（KB-032 ~ KB-036）----------

  {
    id: 'KB-032',
    source: '子平真诠',
    chapter: '论从格',
    originalText: '从格者，日主无根，满局皆异党之势，不得不从。从财、从杀、从儿，各随所旺而从之',
    modernExplanation: '从格成立的条件是日主在命局中毫无根基，四周皆为异己力量，日主只能顺从最强之势。分为从财格、从杀格、从儿格（从食伤），随命局中最旺之五行而定',
    keywords: ['从格', '从财', '从杀', '从儿', '无根'],
    category: '格局',
    associations: [
      { type: '格局', value: '从格' },
      { type: '格局', value: '从财格' },
    ],
    citationLevel: 'primary',
    confidence: 0.94,
  },
  {
    id: 'KB-033',
    source: '三命通会',
    chapter: '论专旺格',
    originalText: '曲直格甲木专旺，炎上格丙火专旺，稼穑格戊土专旺，从革格庚金专旺，润下格壬水专旺。五行专旺，不可逆也',
    modernExplanation: '专旺格有五种：曲直格（木旺）、炎上格（火旺）、稼穑格（土旺）、从革格（金旺）、润下格（水旺）。专旺格为某一五行独霸命局，只可顺不可逆，喜同类和生扶，忌克制',
    keywords: ['曲直格', '炎上格', '稼穑格', '从革格', '润下格'],
    category: '格局',
    associations: [
      { type: '格局', value: '曲直格' },
      { type: '格局', value: '专旺格' },
      { type: '五行', value: '木' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-034',
    source: '渊海子平',
    chapter: '论化气格',
    originalText: '甲己化土，乙庚化金，丙辛化水，丁壬化木，戊癸化火。化气成格者，以化出之五行为用',
    modernExplanation: '天干五合化气成格的条件极为严格，须天干相合且地支有化神之根。化气格以化出之五行为核心论命，如甲己化土格即以土之旺衰喜忌来推断命运',
    keywords: ['化气格', '天干化合', '化神', '甲己化土'],
    category: '格局',
    associations: [
      { type: '格局', value: '化气格' },
      { type: '五行', value: '天干合化' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },
  {
    id: 'KB-035',
    source: '三命通会',
    chapter: '论建禄格',
    originalText: '建禄格者，月令临官之位也。甲生寅月、乙生卯月之类。建禄身旺，喜财官食伤',
    modernExplanation: '建禄格指日干在月令恰处临官之位，如甲木生于寅月、乙木生于卯月。建禄格日主本身已强，宜用财星、官星或食伤来泄秀耗身，使命局趋于平衡',
    keywords: ['建禄格', '临官', '月令', '身旺'],
    category: '格局',
    associations: [
      { type: '格局', value: '建禄格' },
      { type: '格局', value: '月令' },
    ],
    citationLevel: 'primary',
    confidence: 0.96,
  },
  {
    id: 'KB-036',
    source: '神峰通考',
    chapter: '论月刃格',
    originalText: '月刃者，月令阳刃之位。甲生卯月为阳刃，喜官杀制之，忌再逢刃劫',
    modernExplanation: '月刃格即月令为日干的帝旺之位，如甲木生于卯月。阳刃代表力量过旺而有刚暴之性，最喜正官或七杀来制衡，若再逢比劫则力量失控',
    keywords: ['月刃格', '阳刃', '帝旺', '官杀制刃'],
    category: '格局',
    associations: [
      { type: '格局', value: '月刃格' },
      { type: '十神', value: '七杀' },
      { type: '十神', value: '比肩' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },

  // ---------- 喜用神深入（KB-037 ~ KB-041）----------

  {
    id: 'KB-037',
    source: '穷通宝鉴',
    chapter: '论调候用神',
    originalText: '冬月水旺木寒，先以丙火调候为急。若丙火透干，再议其余用神。调候不急，虽有用神亦不发福',
    modernExplanation: '调候用神专指调和命局寒暖燥湿的五行为先决条件。冬季命局水旺木寒，必须先用丙火暖局，调候得宜后才能论及其他用神。调候不到位，其他用神也难以发挥效力',
    keywords: ['调候用神', '丙火', '暖局', '寒暖'],
    category: '喜用神',
    associations: [
      { type: '喜用神', value: '调候用神' },
      { type: '五行', value: '火' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
  {
    id: 'KB-038',
    source: '滴天髓',
    chapter: '论扶抑用神',
    originalText: '强众而敌寡者，势在去其寡。强寡而敌众者，势在成乎众。扶抑之道，在使中和',
    modernExplanation: '扶抑用神的核心原则是使命局趋于中和。当某一五行力量过强时，宜用克泄耗来抑制；当某一五行力量过弱时，宜用生扶来补益。扶抑的本质是平衡阴阳五行的力量对比',
    keywords: ['扶抑用神', '中和', '克泄耗', '生扶'],
    category: '喜用神',
    associations: [
      { type: '喜用神', value: '扶抑用神' },
      { type: '五行', value: '综合' },
    ],
    citationLevel: 'primary',
    confidence: 0.96,
  },
  {
    id: 'KB-039',
    source: '子平真诠',
    chapter: '论通关用神',
    originalText: '两行相战，须求通关之神。如金木相战，以水通关。通关者，调和二者，使相生而不相克',
    modernExplanation: '通关用神用于化解命局中两种对立五行的争战。例如金木相克，以水为通关之神，水泄金之气而生木，使相克变为相生的流通关系',
    keywords: ['通关用神', '相战', '通关', '流通'],
    category: '喜用神',
    associations: [
      { type: '喜用神', value: '通关用神' },
      { type: '五行', value: '水' },
      { type: '五行', value: '金' },
      { type: '五行', value: '木' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-040',
    source: '穷通宝鉴',
    chapter: '论忌神',
    originalText: '忌神者，助纣为虐之物也。命有忌神，运逢之则凶。若忌神有制，反为权柄',
    modernExplanation: '忌神是命局中对日主最不利的五行，会破坏命局的平衡。大运或流年遇到忌神则运势不佳。但如果忌神在命局中被其他五行制衡，反而能转化为有用的力量',
    keywords: ['忌神', '助纣为虐', '忌神有制', '权柄'],
    category: '喜用神',
    associations: [
      { type: '喜用神', value: '忌神' },
      { type: '十神', value: '七杀' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },
  {
    id: 'KB-041',
    source: '三命通会',
    chapter: '论闲神',
    originalText: '闲神者，命局中无大用亦无大害之神。运逢之平平，不喜不忌。然闲神若遇合化，亦可变为喜忌',
    modernExplanation: '闲神是在命局中既非喜用也非忌讳的五行，对命局影响不大。大运流年遇到闲神时运势平淡无奇。但闲神若与命局中其他五行发生合化，可能转变为喜神或忌神',
    keywords: ['闲神', '平平', '合化', '喜忌变化'],
    category: '喜用神',
    associations: [
      { type: '喜用神', value: '闲神' },
      { type: '五行', value: '合化变化' },
    ],
    citationLevel: 'secondary',
    confidence: 0.88,
  },

  // ---------- 合化深入（KB-042 ~ KB-046）----------

  {
    id: 'KB-042',
    source: '协纪辨方书',
    chapter: '论天干五合',
    originalText: '天干五合：甲己合土，乙庚合金，丙辛合水，丁壬合木，戊癸合火。合化须得时令旺气，方为真化',
    modernExplanation: '天干五合的成立条件：一须两干相邻，二须得月令化神之气，三须地支有化神之根。如甲己合土，须在辰戌丑未月或地支有土之根基，合化方为真实',
    keywords: ['天干五合', '合化条件', '时令旺气', '化神'],
    category: '合化',
    associations: [
      { type: '五行', value: '天干五合' },
      { type: '五行', value: '土' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
  {
    id: 'KB-043',
    source: '渊海子平',
    chapter: '论地支六合真假',
    originalText: '六合之法，须两支相邻紧贴方真。若隔位遥合，力弱不真。合而逢冲，先论冲后论合',
    modernExplanation: '地支六合的真假判断：两支必须在四柱中相邻紧贴（如年月、月日、日时）方为真合。隔位之合力量微弱。若合同时遇到冲，冲的力量优先于合',
    keywords: ['六合真假', '紧贴', '隔位', '合逢冲'],
    category: '合化',
    associations: [
      { type: '五行', value: '地支六合' },
      { type: '五行', value: '六冲' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },
  {
    id: 'KB-044',
    source: '三命通会',
    chapter: '论三合局',
    originalText: '申子辰合水局，亥卯未合木局，寅午戌合火局，巳酉丑合金局。三合者，三支会合，化为一气',
    modernExplanation: '地支三合局由三个地支组成一方之气的聚合：申子辰合水、亥卯未合木、寅午戌合火、巳酉丑合金。三合局的力量比六合更强，能汇聚一方之气形成强大力量',
    keywords: ['三合局', '申子辰', '亥卯未', '寅午戌', '巳酉丑'],
    category: '合化',
    associations: [
      { type: '五行', value: '三合局' },
      { type: '五行', value: '水' },
      { type: '五行', value: '木' },
    ],
    citationLevel: 'primary',
    confidence: 0.97,
  },
  {
    id: 'KB-045',
    source: '协纪辨方书',
    chapter: '论三会局',
    originalText: '寅卯辰会东方木局，巳午未会南方火局，申酉戌会西方金局，亥子丑会北方水局。三会之力，大于三合',
    modernExplanation: '地支三会局是同一方位三个地支的聚合，代表一方之气达到极盛：东方寅卯辰会木、南方巳午未会火、西方申酉戌会金、北方亥子丑会水。三会局的力量最为强大',
    keywords: ['三会局', '东方木局', '南方火局', '西方金局', '北方水局'],
    category: '合化',
    associations: [
      { type: '五行', value: '三会局' },
      { type: '五行', value: '木' },
      { type: '五行', value: '火' },
    ],
    citationLevel: 'primary',
    confidence: 0.97,
  },
  {
    id: 'KB-046',
    source: '子平真诠',
    chapter: '论合化通则',
    originalText: '合之真者，不论化否，皆能羁绊。化之真者，必须全体化尽，若有阻碍，仍以原五行论',
    modernExplanation: '天干相合即使不化气也有羁绊作用，使两干力量相互牵制。合化要成功必须命局全体配合化气方向，若有任何阻碍则合而不化，仍以原来的五行论断',
    keywords: ['合化通则', '羁绊', '化尽', '阻碍'],
    category: '合化',
    associations: [
      { type: '五行', value: '合而不化' },
      { type: '五行', value: '综合' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },

  // ---------- 冲刑深入（KB-047 ~ KB-051）----------

  {
    id: 'KB-047',
    source: '三命通会',
    chapter: '论六冲',
    originalText: '子午冲，一阴一阳，水火对射。丑未冲，同类相激。寅申冲，金木互战。卯酉冲，一阴一阳，木金相克。辰戌冲，土气冲荡。巳亥冲，水火交战',
    modernExplanation: '六冲为地支中方位相对的两支互冲：子午冲（南北水火）、丑未冲（同土相激）、寅申冲（金木交战）、卯酉冲（东西木金）、辰戌冲（同土冲荡）、巳亥冲（水火交战），冲则动、散、破',
    keywords: ['六冲', '子午冲', '卯酉冲', '方位对冲'],
    category: '冲刑',
    associations: [
      { type: '五行', value: '六冲' },
      { type: '五行', value: '水' },
      { type: '五行', value: '火' },
    ],
    citationLevel: 'primary',
    confidence: 0.94,
  },
  {
    id: 'KB-048',
    source: '渊海子平',
    chapter: '论三刑详解',
    originalText: '寅巳申三刑，刑则刑伤，主官非意外。丑戌未三刑，刑则凌辱，主人际纠纷。子卯相刑，刑则无礼，主桃花是非',
    modernExplanation: '三刑详解：寅巳申无恩之刑主忘恩负义、官非诉讼和意外伤害；丑戌未恃势之刑主人际冲突、仗势凌人；子卯无礼之刑主桃花是非、感情纠纷；辰午酉亥自刑主自寻烦恼、自我纠结',
    keywords: ['三刑详解', '无恩之刑', '恃势之刑', '无礼之刑', '自刑'],
    category: '冲刑',
    associations: [
      { type: '五行', value: '三刑' },
      { type: '五行', value: '无恩之刑' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },
  {
    id: 'KB-049',
    source: '协纪辨方书',
    chapter: '论六害',
    originalText: '子未相害，丑午相害，寅巳相害，卯辰相害，申亥相害，酉戌相害。害者，阻碍也，主暗损',
    modernExplanation: '六害又称六穿，是地支之间相互损害的关系：子未害、丑午害、寅巳害、卯辰害、申亥害、酉戌害。六害主暗中受损、被人暗算或事物受到阻碍，力量小于冲刑',
    keywords: ['六害', '六穿', '子未害', '暗损', '阻碍'],
    category: '冲刑',
    associations: [
      { type: '五行', value: '六害' },
      { type: '五行', value: '六穿' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },
  {
    id: 'KB-050',
    source: '神峰通考',
    chapter: '论冲刑化解',
    originalText: '冲有冲解，刑有刑化。冲逢合解，如子午冲得丑合子则减力。刑逢冲散，如寅巳刑得申冲则散',
    modernExplanation: '冲刑可以化解：冲遇合则减力，如子午冲若有丑来合子，则子午冲的力量减弱。刑遇冲则可散开，如寅巳申三刑若遇到其他冲的力量介入，三刑结构会被打破',
    keywords: ['冲逢合解', '刑逢冲散', '化解', '减力'],
    category: '冲刑',
    associations: [
      { type: '五行', value: '冲' },
      { type: '五行', value: '合' },
    ],
    citationLevel: 'primary',
    confidence: 0.88,
  },
  {
    id: 'KB-051',
    source: '三命通会',
    chapter: '论冲刑轻重',
    originalText: '冲在年月，其力最重，主祖业破败或少年不利。冲在日时，力轻而近，主晚年或子女有碍。冲太岁者，其年必有变动',
    modernExplanation: '冲的轻重取决于位置：年月之冲力量最大影响根基与早年；日时之冲力量次之但距离近影响自身与晚年。流年地支冲命局地支为反冲，命局地支冲流年太岁为冲太岁，当年必有重大变动',
    keywords: ['冲刑轻重', '年月冲', '日时冲', '冲太岁'],
    category: '冲刑',
    associations: [
      { type: '五行', value: '六冲' },
      { type: '流年', value: '冲太岁' },
    ],
    citationLevel: 'secondary',
    confidence: 0.89,
  },

  // ---------- 五行深入（KB-052 ~ KB-056）----------

  {
    id: 'KB-052',
    source: '滴天髓',
    chapter: '论五行生克',
    originalText: '木生火，火生土，土生金，金生水，水生木。木克土，土克水，水克火，火克金，金克木。生克制化，循环无穷',
    modernExplanation: '五行相生为母子关系：木生火、火生土、土生金、金生水、水生木。五行相克为制约关系：木克土、土克水、水克火、火克金、金克木。生克构成循环，维持动态平衡',
    keywords: ['五行相生', '五行相克', '生克制化', '循环'],
    category: '五行',
    associations: [
      { type: '五行', value: '木' },
      { type: '五行', value: '火' },
      { type: '五行', value: '土' },
      { type: '五行', value: '金' },
      { type: '五行', value: '水' },
    ],
    citationLevel: 'primary',
    confidence: 0.98,
  },
  {
    id: 'KB-053',
    source: '穷通宝鉴',
    chapter: '论五行旺衰',
    originalText: '五行旺于月令者，为得时得令。虽得令而有克泄，旺而不旺。虽失令而有生扶，弱而不弱',
    modernExplanation: '判断五行旺衰以月令为核心：得月令者旺，失月令者衰。但需综合判断，得令却多克泄则旺力打折，失令却多生扶则弱而有根。旺衰是相对概念，需看全局力量的对比',
    keywords: ['五行旺衰', '得令', '失令', '有根'],
    category: '五行',
    associations: [
      { type: '五行', value: '综合' },
      { type: '格局', value: '月令' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
  {
    id: 'KB-054',
    source: '子平真诠',
    chapter: '论五行调和',
    originalText: '金木水火土，各有所喜所忌。所喜者宜助之，所忌者宜制之。调和之道，在于通关与扶抑',
    modernExplanation: '五行调和的核心方法有二：一是扶抑，直接生扶弱者或抑制强者；二是通关，在两种对抗的五行之间引入中间五行使其流通。调和的终极目标是使命局五行力量均衡',
    keywords: ['五行调和', '通关', '扶抑', '均衡'],
    category: '五行',
    associations: [
      { type: '喜用神', value: '通关用神' },
      { type: '喜用神', value: '扶抑用神' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-055',
    source: '协纪辨方书',
    chapter: '论五行反克',
    originalText: '水本克火，火旺则水干，反被火克。金本克木，木坚则金缺，反被木伤。反克者，以弱克强，必遭反噬',
    modernExplanation: '五行反克指本应克制对方的一方因自身力量不足反被对方所克：如水克火但火极旺则水被蒸干，金克木但木极坚则金反缺损。反克说明生克关系取决于力量的实际对比',
    keywords: ['反克', '反噬', '弱克强', '力量对比'],
    category: '五行',
    associations: [
      { type: '五行', value: '水' },
      { type: '五行', value: '火' },
      { type: '五行', value: '金' },
      { type: '五行', value: '木' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },
  {
    id: 'KB-056',
    source: '滴天髓',
    chapter: '论五行寄生十二宫',
    originalText: '长生、沐浴、冠带、临官、帝旺、衰、病、死、墓、绝、胎、养。十二宫循环，以论五行盛衰之序',
    modernExplanation: '五行寄生十二宫描述五行力量从生到死的十二个阶段：长生（出生）、沐浴（成长）、冠带（成年）、临官（当权）、帝旺（极盛）、衰（开始衰退）、病、死、墓（归藏）、绝（消亡）、胎（孕育）、养（恢复），周而复始',
    keywords: ['十二宫', '长生', '帝旺', '墓绝', '盛衰之序'],
    category: '五行',
    associations: [
      { type: '五行', value: '综合' },
      { type: '格局', value: '临官' },
    ],
    citationLevel: 'primary',
    confidence: 0.96,
  },

  // ---------- 大运流年深入（KB-057 ~ KB-061）----------

  {
    id: 'KB-057',
    source: '三命通会',
    chapter: '论大运喜忌',
    originalText: '大运喜用，十年亨通。大运忌神，十年蹇滞。然运有偏枯，亦有转机，不可一概而论',
    modernExplanation: '大运行喜用神则此十年运势顺遂亨通，行忌神运则十年困顿阻滞。但大运本身也有偏枯，若运中虽带忌神但也有喜神成分，则凶中带吉，不可一概断为不好',
    keywords: ['大运喜忌', '喜用运', '忌神运', '十年运势'],
    category: '大运',
    associations: [
      { type: '大运', value: '喜用运' },
      { type: '大运', value: '忌神运' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },
  {
    id: 'KB-058',
    source: '子平真诠',
    chapter: '论流年吉凶',
    originalText: '流年天干为客，地支为主。太岁与命局相合则吉，相冲则凶。流年引动命中喜神则发，引动忌神则灾',
    modernExplanation: '流年论断中，流年地支（太岁）为主力，天干为辅助。流年与命局地支相合主吉利，相冲主凶险。关键看流年是否引动了命局中的喜用神或忌神，引动喜神则发福，引动忌神则生灾',
    keywords: ['流年吉凶', '太岁', '引动', '喜神发忌神灾'],
    category: '流年',
    associations: [
      { type: '流年', value: '太岁' },
      { type: '喜用神', value: '喜神' },
      { type: '喜用神', value: '忌神' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-059',
    source: '渊海子平',
    chapter: '论岁运并临',
    originalText: '岁运并临者，流年与大运天干地支相同也。不灾自己灾他人，不死自己死他人。然须看喜忌，喜神并临反主大吉',
    modernExplanation: '岁运并临指流年干支与大运干支完全相同。古诀云不死自己死他人，但这只是极端说法。实际上岁运并临会成倍放大该五行的力量，若为喜用神则大吉大利，若为忌神则凶上加凶',
    keywords: ['岁运并临', '天干地支相同', '放大', '喜忌分明'],
    category: '大运',
    associations: [
      { type: '大运', value: '岁运并临' },
      { type: '流年', value: '流年' },
    ],
    citationLevel: 'primary',
    confidence: 0.88,
  },
  {
    id: 'KB-060',
    source: '神峰通考',
    chapter: '论大运交接',
    originalText: '大运每十年一换，交接之年多有变动。交运前三年为初运，后三年为末运，初运力渐增，末运力渐减',
    modernExplanation: '大运每十年转换一次，在交接的年份人生常发生重大变化。每步大运的前三年力量逐渐增强，中间四年力量最盛，后三年力量逐渐减弱。交运时的吉凶需综合命局、前运和新运来综合判断',
    keywords: ['大运交接', '十年一换', '初运末运', '力量渐变'],
    category: '大运',
    associations: [
      { type: '大运', value: '交运' },
      { type: '大运', value: '运程' },
    ],
    citationLevel: 'secondary',
    confidence: 0.87,
  },
  {
    id: 'KB-061',
    source: '三命通会',
    chapter: '论流月流日',
    originalText: '流年管一年之吉凶，流月管一月之休咎。流月以流年为主，流日以流月为主，逐层递减',
    modernExplanation: '时间层次的推断为：命局（先天）决定基本格局，大运（十年）决定阶段性运势，流年（一年）决定年度吉凶，流月（一月）决定月度变化，流日决定每日细节。越往细微层次影响力越小但越具体',
    keywords: ['流月', '流日', '时间层次', '逐层递减'],
    category: '流年',
    associations: [
      { type: '流年', value: '流年' },
      { type: '流年', value: '流月' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },

  // ---------- 神煞深入（KB-062 ~ KB-066）----------

  {
    id: 'KB-062',
    source: '渊海子平',
    chapter: '论天乙贵人深入',
    originalText: '天乙贵人之法，以日干起之。或曰以年干起之亦可。贵人者，天之恩星也，遇之者主贵人提携，逢凶化吉',
    modernExplanation: '天乙贵人是八字中最吉祥的神煞，以日干或年干来查对。天乙贵人代表天界的恩泽之星，命中有天乙贵人者一生多遇贵人相助，在困难时刻容易得到他人的帮助而化险为夷',
    keywords: ['天乙贵人', '恩星', '贵人提携', '逢凶化吉'],
    category: '神煞',
    associations: [
      { type: '神煞', value: '天乙贵人' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-063',
    source: '三命通会',
    chapter: '论天德月德',
    originalText: '天德者，天之恩德也。月德者，月之恩德也。天德月德入命，其人慈祥恺悌，为人所敬。犯刑法者逢之可免',
    modernExplanation: '天德贵人和月德贵人均为逢凶化吉的吉神。天德以月支查天干，月德以月支查地支。命带天德月德者心地善良、为人宽厚，即使命中有凶煞也会减轻其凶性，甚至可以化解刑狱之灾',
    keywords: ['天德', '月德', '恩德', '逢凶化吉', '慈祥'],
    category: '神煞',
    associations: [
      { type: '神煞', value: '天德贵人' },
      { type: '神煞', value: '月德贵人' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },
  {
    id: 'KB-064',
    source: '穷通宝鉴',
    chapter: '论文昌',
    originalText: '文昌者，文曲之星也。甲己乙午（巳），丙戊申（辰），丁己酉（未），庚辛亥（戌），壬癸寅（丑）。文昌入命，主聪明好学',
    modernExplanation: '文昌星是主文才学业的吉神，以日干查对。命带文昌星者天生聪慧、记忆力强、喜好读书学习，考试和学术方面容易取得成就。文昌星的查法以日干对应的特定地支来确定',
    keywords: ['文昌', '文曲星', '聪明好学', '学业'],
    category: '神煞',
    associations: [
      { type: '神煞', value: '文昌' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },
  {
    id: 'KB-065',
    source: '神峰通考',
    chapter: '论驿马',
    originalText: '驿马者，奔波之星也。寅午戌见申，申子辰见寅，巳酉丑见亥，亥卯未见巳。驿马入命，主离乡奔波，动中得财',
    modernExplanation: '驿马星是代表移动和奔波的神煞，以年支或日支在三合局中寻找。命带驿马者一生多走动，适合在外地发展、从事旅行或交通运输等行业。驿马逢冲则奔波更甚，驿马逢合则安定下来',
    keywords: ['驿马', '奔波', '离乡', '动中得财'],
    category: '神煞',
    associations: [
      { type: '神煞', value: '驿马' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },
  {
    id: 'KB-066',
    source: '三命通会',
    chapter: '论羊刃',
    originalText: '羊刃者，阳刚之极也。甲见卯，丙见午，戊见午，庚见酉，壬见子。羊刃虽为凶煞，若为武职之人，反主威权',
    modernExplanation: '羊刃即阳刃，是日干帝旺之位的同性天干所代表的凶煞。羊刃过刚则易有血光之灾或手术之苦，但若命局中有正官或七杀来制之，反而能转化为权威与魄力，尤其利于武职和竞争性行业',
    keywords: ['羊刃', '阳刃', '刚极', '威权', '制刃'],
    category: '神煞',
    associations: [
      { type: '神煞', value: '羊刃' },
      { type: '十神', value: '七杀' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },

  // ---------- 事业财运（KB-067 ~ KB-071）----------

  {
    id: 'KB-067',
    source: '子平真诠',
    chapter: '论官印相生',
    originalText: '官印相生，仕途亨通。正官生正印，印再生身，一路相生，贵气自达于天',
    modernExplanation: '官印相生是事业大贵的格局组合：正官代表职位权力，正印代表学识文凭和后盾。官生印、印生身形成连续的相生链条，代表仕途顺遂、步步高升，在政界或管理层容易获得成就',
    keywords: ['官印相生', '仕途', '贵气', '相生链条'],
    category: '事业',
    associations: [
      { type: '十神', value: '正官' },
      { type: '十神', value: '正印' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
  {
    id: 'KB-068',
    source: '滴天髓',
    chapter: '论食神生财',
    originalText: '食神生财，富贵双全。食神吐秀而生财，财源滚滚，源源不绝。身旺食旺财旺，一生富足',
    modernExplanation: '食神生财是最佳的求财格局之一：食神代表才华和技能，财星代表财富。食神不断生财，犹如才华转化为源源不断的收入。日主旺、食神旺、财星旺三者兼备，一生富足无忧',
    keywords: ['食神生财', '富贵双全', '财源', '身旺食旺财旺'],
    category: '财运',
    associations: [
      { type: '十神', value: '食神' },
      { type: '十神', value: '偏财' },
    ],
    citationLevel: 'primary',
    confidence: 0.94,
  },
  {
    id: 'KB-069',
    source: '三命通会',
    chapter: '论财官双美',
    originalText: '财官双美者，财星与官星各得其所，不相战克。身旺能任财官，则富贵两全',
    modernExplanation: '财官双美指命局中财星和官星同时有力且不相冲突。日主身旺能够承担财官之力，财代表经济实力，官代表社会地位，两者兼备则既富且贵。关键是财官不能相战，需有印星或食伤来调和',
    keywords: ['财官双美', '富贵两全', '财星', '官星'],
    category: '事业',
    associations: [
      { type: '十神', value: '正官' },
      { type: '十神', value: '正财' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },
  {
    id: 'KB-070',
    source: '渊海子平',
    chapter: '论偏财',
    originalText: '偏财者，众人之财也。偏财不宜多，多则争夺。偏财得位，因商致富。偏财与正财并见，财来财去',
    modernExplanation: '偏财代表非固定收入的财富，如投资收益、经营利润等。偏财不宜过多，过多则财来财去难以守住。偏财得位者适合经商和投资，通过商业活动致富。正财偏财同时出现则理财需谨慎',
    keywords: ['偏财', '经商', '投资', '因商致富'],
    category: '财运',
    associations: [
      { type: '十神', value: '偏财' },
      { type: '十神', value: '正财' },
    ],
    citationLevel: 'primary',
    confidence: 0.90,
  },
  {
    id: 'KB-071',
    source: '神峰通考',
    chapter: '论伤官生财',
    originalText: '伤官生财，其人聪明机巧，善于经营。伤官虽为凶神，若能生财，化凶为吉，反为富格',
    modernExplanation: '伤官生财是化凶为吉的典型格局：伤官本为凶神代表叛逆不安分，但若伤官之力引导去生财星，则将其聪明才智和创造力转化为商业能力和财富来源，适合创意产业和技术创业',
    keywords: ['伤官生财', '聪明机巧', '化凶为吉', '经营'],
    category: '财运',
    associations: [
      { type: '十神', value: '伤官' },
      { type: '十神', value: '偏财' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },

  // ---------- 婚姻家庭（KB-072 ~ KB-074）----------

  {
    id: 'KB-072',
    source: '三命通会',
    chapter: '论夫妻宫',
    originalText: '日支为夫妻宫，日支得位则配偶贤良。日支逢冲则婚姻不稳，日支逢合则感情和睦',
    modernExplanation: '日柱地支代表夫妻宫，是推断婚姻状况的重要依据。夫妻宫坐喜用神则配偶优秀、婚姻美满。夫妻宫被冲则婚姻易有波折甚至破裂，夫妻宫逢合则夫妻感情和谐、相互扶持',
    keywords: ['夫妻宫', '日支', '逢冲', '逢合', '婚姻'],
    category: '婚姻',
    associations: [
      { type: '五行', value: '六冲' },
      { type: '五行', value: '地支六合' },
    ],
    citationLevel: 'primary',
    confidence: 0.92,
  },
  {
    id: 'KB-073',
    source: '渊海子平',
    chapter: '论配偶星',
    originalText: '男以财星为妻星，正财为正妻，偏财为偏房。女以官星为夫星，正官为正夫，七杀为偏夫。星多则感情复杂',
    modernExplanation: '配偶星是判断婚姻对象的直接依据。男命正财代表正妻、偏财代表情人或继室；女命正官代表正夫、七杀代表情人或非正常关系。配偶星过多则感情世界复杂，多个配偶星并见者容易有婚外情或多段婚姻',
    keywords: ['配偶星', '财星', '官星', '正妻', '正夫', '感情复杂'],
    category: '婚姻',
    associations: [
      { type: '十神', value: '正财' },
      { type: '十神', value: '偏财' },
      { type: '十神', value: '正官' },
    ],
    citationLevel: 'primary',
    confidence: 0.93,
  },
  {
    id: 'KB-074',
    source: '滴天髓',
    chapter: '论婚姻吉凶',
    originalText: '男命财星不杂，妻宫安稳，婚姻美满。女命官星纯粹，夫宫得力，白头偕老。若财官多见混杂，婚必多变',
    modernExplanation: '婚姻吉凶的判断：男命财星单一有力且夫妻宫坐喜神，婚姻多美满。女命官星清纯不杂且夫宫稳固，容易白头偕老。若财星或官星过多混杂，再加上冲刑破害，则婚姻多变，容易离婚或再婚',
    keywords: ['婚姻吉凶', '财不杂', '官纯粹', '白头偕老', '婚多变'],
    category: '婚姻',
    associations: [
      { type: '十神', value: '正财' },
      { type: '十神', value: '正官' },
      { type: '五行', value: '冲' },
    ],
    citationLevel: 'primary',
    confidence: 0.91,
  },

  // ---------- 补充条目（KB-075 ~ KB-076）----------

  {
    id: 'KB-075',
    source: '穷通宝鉴',
    chapter: '论夏季调候',
    originalText: '夏月火旺土焦，先以癸水调候为急。若癸水透干，再议其余用神。夏木焦枯，水火既济方为上格',
    modernExplanation: '夏季命局火旺土焦木枯，调候以癸水为第一要务。癸水滋润万物、降温解暑，使过热的命局恢复生机。调候与扶抑需兼顾，先调候后扶抑，方为论命正道',
    keywords: ['夏季调候', '癸水', '水火既济', '土焦木枯'],
    category: '调候',
    associations: [
      { type: '喜用神', value: '调候用神' },
      { type: '五行', value: '水' },
      { type: '五行', value: '火' },
    ],
    citationLevel: 'primary',
    confidence: 0.94,
  },
  {
    id: 'KB-076',
    source: '滴天髓',
    chapter: '论命局层次',
    originalText: '命之高低，全在格局纯杂与用神得力与否。格局纯粹用神有力者，上等之命。格局驳杂用神无力者，下等之命',
    modernExplanation: '命局层次的高低取决于两个核心因素：一是格局是否纯粹不杂，二是用神是否有力得位。格局清纯且用神有力者命运层次高，格局驳杂或用神无力者命运层次低。这是评判命局总体的根本标准',
    keywords: ['命局层次', '格局纯杂', '用神得力', '命运高低'],
    category: '命局总论',
    associations: [
      { type: '格局', value: '总论' },
      { type: '喜用神', value: '用神' },
    ],
    citationLevel: 'primary',
    confidence: 0.95,
  },
]

// ═══════════════════════════════════════════════════════════════
// 2. EXPERT_VALIDATIONS — 专家验证样本（5 条）
// ═══════════════════════════════════════════════════════════════

export const EXPERT_VALIDATIONS: ExpertValidationRecord[] = [
  {
    validationId: 'VAL-001',
    caseId: 'CLS-001',
    expertId: 'EXP-001',
    validatedAt: 1752624000000,
    engineVersion: '7.0.0',
    systemConclusion: '建禄格，身偏强',
    expertConclusion: '同意系统判定，建禄格成立，日主甲木得寅月建禄',
    verdict: 'agree',
    classicalBasis: '《三命通会》论建禄格',
    systemBasis: 'PatternEngine v4.1.0 + XiYongEngine v5.0.0',
    consistencyRate: 1.0,
    score: 95,
    status: 'verified',
    affectedRules: ['pattern-jianlu'],
    affectedModules: ['module4-pattern', 'module5-xiyong'],
  },
  {
    validationId: 'VAL-002',
    caseId: 'CLS-002',
    expertId: 'EXP-002',
    validatedAt: 1752710400000,
    engineVersion: '7.0.0',
    systemConclusion: '食神生财格，喜用神为水',
    expertConclusion: '格局判定正确，但喜用神应为金而非水，金能生水且制木有力',
    verdict: 'partially_agree',
    classicalBasis: '《子平真诠》论食神生财',
    systemBasis: 'PatternEngine v4.1.0 + XiYongEngine v5.0.0',
    consistencyRate: 0.7,
    score: 72,
    suggestion: '喜用神选取逻辑应考虑食神生财格局中金的双重作用',
    status: 'verified',
    affectedRules: ['pattern-shishengcai', 'xiyong-water'],
    affectedModules: ['module4-pattern', 'module5-xiyong'],
  },
  {
    validationId: 'VAL-003',
    caseId: 'CLS-003',
    expertId: 'EXP-003',
    validatedAt: 1752796800000,
    engineVersion: '7.0.0',
    systemConclusion: '正官格，身弱用印',
    expertConclusion: '此命应为七杀格而非正官格，丙火透干为偏官，且日主不弱，应用食神制杀',
    verdict: 'disagree',
    classicalBasis: '《神峰通考》论七杀格与正官格之辨',
    systemBasis: 'PatternEngine v4.1.0 + XiYongEngine v5.0.0',
    consistencyRate: 0.3,
    score: 35,
    suggestion: '正官与七杀的区分应严格以天干阴阳为判据，丙火克辛金为偏官',
    notes: '核心分歧点在于日主强弱判定和十神阴阳属性的识别',
    status: 'disputed',
    affectedRules: ['pattern-zhengguan', 'pattern-qisha', 'xiyong-yin'],
    affectedModules: ['module4-pattern', 'module5-xiyong', 'module3-tenGods'],
  },
  {
    validationId: 'VAL-004',
    caseId: 'CLS-004',
    expertId: 'EXP-001',
    validatedAt: 1752883200000,
    engineVersion: '7.0.0',
    systemConclusion: '偏印格，身中和偏弱，喜火',
    expertConclusion: '同意系统判定，偏印格无误，壬水为偏印，日主丙火偏弱，喜木印扶身兼暖局',
    verdict: 'agree',
    classicalBasis: '《三命通会》论偏印格',
    systemBasis: 'PatternEngine v4.1.0 + XiYongEngine v5.0.0',
    consistencyRate: 0.95,
    score: 90,
    notes: '专家补充认为木印比火更优，但整体方向一致，不影响格局判定',
    status: 'verified',
    affectedRules: ['pattern-pianyin', 'xiyong-huo'],
    affectedModules: ['module4-pattern', 'module5-xiyong'],
  },
  {
    validationId: 'VAL-005',
    caseId: 'CLS-005',
    expertId: 'EXP-004',
    validatedAt: 1752969600000,
    engineVersion: '7.0.0',
    systemConclusion: '从弱格，用财官',
    expertConclusion: '命局信息不足，地支多合化需进一步确认化气真假，暂无法给出明确结论',
    verdict: 'unclear',
    classicalBasis: '《渊海子平》论合化真假',
    systemBasis: 'PatternEngine v4.1.0 + XiYongEngine v5.0.0',
    consistencyRate: 0.5,
    score: 50,
    suggestion: '增加对天干合化条件的深度校验，区分真化与假化',
    notes: '需补充时柱信息以确认甲己合化是否成立',
    status: 'pending',
    affectedRules: ['pattern-congruo', 'rule-hehua-jiaji'],
    affectedModules: ['module4-pattern', 'module5-xiyong'],
  },
]

// ═══════════════════════════════════════════════════════════════
// 3. LEARNING_QUEUE_DATA — 学习队列（3 条争议案例）
// ═══════════════════════════════════════════════════════════════

export const LEARNING_QUEUE_DATA: LearningQueueItem[] = [
  {
    queueId: 'LQ-001',
    validationId: 'VAL-003',
    caseId: 'CLS-003',
    reason: '专家与系统结论不一致（disagree），核心分歧为正官格与七杀格的区分',
    priority: 90,
    addedAt: 1752796800000,
    resolved: false,
  },
  {
    queueId: 'LQ-002',
    validationId: 'VAL-005',
    caseId: 'CLS-005',
    reason: '专家判定为 unclear（信息不足），需补充合化条件校验逻辑',
    priority: 75,
    addedAt: 1752969600000,
    resolved: false,
  },
  {
    queueId: 'LQ-003',
    validationId: 'VAL-002',
    caseId: 'CLS-002',
    reason: '专家部分同意（partially_agree），喜用神选取存在偏差，需优化用神推理路径',
    priority: 60,
    addedAt: 1752710400000,
    resolved: false,
  },
]

// ═══════════════════════════════════════════════════════════════
// 4. REGRESSION_LOCKS — 回归锁（2 条已验证锁定案例）
// ═══════════════════════════════════════════════════════════════

export const REGRESSION_LOCKS: RegressionLock[] = [
  {
    lockId: 'LOCK-001',
    caseId: 'CLS-001',
    validationId: 'VAL-001',
    lockedAt: 1752624000000,
    lockedByVersion: '7.0.0',
    lockedResult: { primaryPattern: '建禄格', strengthLevel: '偏强' },
    status: 'active',
  },
  {
    lockId: 'LOCK-002',
    caseId: 'CLS-004',
    validationId: 'VAL-004',
    lockedAt: 1752883200000,
    lockedByVersion: '7.0.0',
    lockedResult: { primaryPattern: '偏印格', strengthLevel: '中和偏弱', favorableElement: '火' },
    status: 'active',
  },
]

// ═══════════════════════════════════════════════════════════════
// 5. 查询函数
// ═══════════════════════════════════════════════════════════════

/** 按分类获取知识条目 */
export function getKnowledgeByCategory(category: KnowledgeCategory): KnowledgeEntry[] {
  return KNOWLEDGE_BASE.filter((entry) => entry.category === category)
}

/** 按来源获取知识条目 */
export function getKnowledgeBySource(source: KnowledgeSource): KnowledgeEntry[] {
  return KNOWLEDGE_BASE.filter((entry) => entry.source === source)
}

/** 按 ID 获取单条知识条目 */
export function getKnowledgeById(id: string): KnowledgeEntry | undefined {
  return KNOWLEDGE_BASE.find((entry) => entry.id === id)
}

/** 获取全部知识条目 */
export function getAllKnowledge(): KnowledgeEntry[] {
  return [...KNOWLEDGE_BASE]
}

/** 按审核状态获取专家验证记录 */
export function getValidationsByStatus(status: ReviewStatus): ExpertValidationRecord[] {
  return EXPERT_VALIDATIONS.filter((record) => record.status === status)
}

/** 按 ID 获取单条专家验证记录 */
export function getValidationById(id: string): ExpertValidationRecord | undefined {
  return EXPERT_VALIDATIONS.find((record) => record.validationId === id)
}

/** 获取全部专家验证记录 */
export function getAllValidations(): ExpertValidationRecord[] {
  return [...EXPERT_VALIDATIONS]
}

/** 获取未解决的学习队列项 */
export function getUnresolvedLearningQueue(): LearningQueueItem[] {
  return LEARNING_QUEUE_DATA.filter((item) => !item.resolved)
}

/** 获取所有生效中的回归锁 */
export function getActiveLocks(): RegressionLock[] {
  return REGRESSION_LOCKS.filter((lock) => lock.status === 'active')
}

/** 按命例 ID 获取回归锁 */
export function getLockByCaseId(caseId: string): RegressionLock | undefined {
  return REGRESSION_LOCKS.find((lock) => lock.caseId === caseId)
}