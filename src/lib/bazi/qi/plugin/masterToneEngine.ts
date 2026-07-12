/**
 * P4.10 MasterToneEngine — 真人命理语言优化引擎
 *
 * 古籍依据：
 *   《渊海子平》批命风格 — 语言精炼、断语有力、不留余地
 *   《子平真诠》论命笔法 — 言简意赅、引经据典
 *   《滴天髓》赋文风格 — 文辞雅致、有理有据
 *   《三命通会》批注风格 — 深入浅出、条理分明
 *
 * 设计原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - 禁止 AI 常用词，全部替换为传统命理表达
 *   - 100+ 条大师批命短语，覆盖各维度场景
 *   - 评分系统量化命理语言纯度
 *   - 所有注释使用中文，所有字符串使用单引号 + 字符串连接
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 随机选取数组中一个元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 随机选取数组中 N 个不重复元素 */
function pickN<T>(arr: readonly T[], n: number): T[] {
  var shuffled = arr.slice()
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var tmp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tmp
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

/** 将数值限制在 0-100 范围内 */
function clampScore(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)))
}

/** 生成当前时间戳 */
function nowISO(): string {
  return new Date().toISOString()
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 语气配置 */
export interface ToneConfig {
  /** 是否启用大师语气 */
  enableMasterTone: boolean
  /** 禁止使用的 AI 常用词列表 */
  bannedWords: string[]
  /** 大师批命短语库 */
  masterPhrases: string[]
}

/** 大师语气转换结果 */
export interface MasterToneResult {
  /** 生成时间 */
  generatedAt: string
  /** 原始文本 */
  original: string
  /** 转换后文本 */
  transformed: string
  /** 发现的 AI 词汇 */
  bannedWordsFound: string[]
  /** 替换数量 */
  replacedCount: number
  /** 命理语言评分 0-100 */
  score: number
  /** 古籍依据 */
  classicalRef: string
}

/** 语气检查结果 */
export interface ToneCheckResult {
  /** 评分 0-100 */
  score: number
  /** 发现的问题列表 */
  issues: string[]
}

// ═══════════════════════════════════════════════════════════
// 常量：AI 禁用词库（40+ 个）
// ═══════════════════════════════════════════════════════════

/** 核心 AI 常用词 — 连接词/过渡词 */
var AI_CONNECTORS: string[] = [
  '根据分析',
  '综合来看',
  '总的来说',
  '总体而言',
  '综上所述',
  '整体来看',
  '总而言之',
  '从以上分析来看',
  '基于以上分析',
  '由此可见',
  '因此',
  '所以',
  '可见',
  '值得注意的是',
  '需要指出的是',
  '特别值得注意的是',
  '必须要指出',
  '需要注意',
  '需要特别关注',
  '需要提醒的是',
  '另外',
  '此外',
  '除此之外',
  '同时',
  '与此同时',
  '不仅如此',
  '更重要的一点是',
]

/** AI 常用词 — 建议性/主观表达 */
var AI_SUGGESTIONS: string[] = [
  '建议',
  '建议您',
  '建议你',
  '建议可以',
  '可以考虑',
  '不妨考虑',
  '推荐',
  '推荐您',
  '推荐你',
  '推荐可以',
  '最好',
  '最好能够',
  '最好能',
  '尽量',
  '尽量去',
  '尽量要',
  '应该',
  '应该要',
  '应该注意',
  '必须',
  '必须要',
  '务必要',
]

/** AI 常用词 — 程度/修饰词 */
var AI_MODIFIERS: string[] = [
  '非常',
  '非常的重要',
  '极其',
  '相当',
  '比较',
  '较为',
  '十分',
  '特别',
  '尤其',
  '总体',
  '整体',
  '大致',
  '基本上',
  '大概率',
  '有可能',
  '有可能会',
  '可能会',
  '有一定可能',
  '在一定程度上',
  '从某种程度上说',
]

/** AI 常用词 — 结构性表达 */
var AI_STRUCTURES: string[] = [
  '我的分析显示',
  '经过分析',
  '经过推演',
  '经过计算',
  '经过详细分析',
  '经过深入研究',
  '通过分析',
  '通过推演',
  '通过计算',
  '通过以上分析',
  '通过以上推演',
  '在分析中',
  '在推演中',
  '从数据来看',
  '从结果来看',
  '从命盘来看',
  '从八字来看',
]

/** AI 常用词 — 其他 */
var AI_OTHERS: string[] = [
  '作为一个',
  '作为一名',
  '作为参考',
  '仅供参考',
  '以供参考',
  '仅供参考',
  '不可全信',
  '理性看待',
  '请理性看待',
  '希望以上分析',
  '希望对您有所帮助',
  '希望能帮助到你',
  '以上内容',
  '以上分析',
  '以上推演',
  '简单来说',
  '简单来讲',
  '简单来说就是',
  '换句话说',
  '换句话讲',
  '也就是说',
  '总而言之',
]

// ═══════════════════════════════════════════════════════════
// 常量：大师批命短语库（100+ 条）
// ═══════════════════════════════════════════════════════════

/** 总论类短语 */
var MASTER_GENERAL: string[] = [
  '此命日主中和，格局有成，一生安稳。',
  '此命格局清奇，非寻常之命造也。',
  '此命五行流通，一生顺遂少波折。',
  '此命格局偏杂，运势起伏不定，须谨慎行事。',
  '观此命造，用神得力，晚年有福。',
  '此命印星有根，主人聪慧好学，文昌之命。',
  '日主身旺，能任财官，此为上等命造。',
  '日主偏弱，需印比扶助，宜守不宜攻。',
  '此命食伤生财，才华横溢，一生衣食不愁。',
  '命局官印相生，仕途有望，利公门之职。',
  '此命劫财重重，须防破财之患。',
  '命带天乙贵人，一生多逢贵人相助。',
  '此命偏官有制，杀印相生，权柄在握。',
  '日主坐禄，根基牢固，此为根基深厚之命。',
  '此命枭神夺食，须防学业有碍。',
  '命局水火既济，五行调和，此为中和之命。',
  '此命伤官见官，口舌是非难免。',
  '命带魁罡，主人聪慧果决，有领导之才。',
  '此命财库得开，主富足之命。',
  '日主得令，时柱有根，后运亨通。',
]

/** 格局类短语 */
var MASTER_PATTERN: string[] = [
  '格局定为正官，纯粹无杂，主人品端正、仕途顺遂。',
  '此命七杀格，杀有制化，武贵之象。',
  '正财格入命，财气通门户，主勤俭致富。',
  '偏财透出，善交际，人缘极佳，有意外之财。',
  '正印格坐命，学术有成，文职大利。',
  '食神格，口福天赐，才华出众，一生安泰。',
  '伤官佩印，聪明机智，宜技术之业。',
  '此命入从格，弃命从势，反成大贵。',
  '日主身旺无依，行财运必发。',
  '身弱印旺，虽贫而有学，终非池中之物。',
  '官星杂见，正偏混杂，须防事业多变动。',
  '财星破印，贪财坏印，须防因财误事。',
  '伤官合杀，化凶为吉，主有巧智。',
  '食神制杀，以柔克刚，主先难后易。',
  '此命天元一气，格局纯粹，非富即贵。',
  '地支连茹，一路通达，主运势连贯顺畅。',
  '三合财局成象，财运亨通，富甲一方。',
  '半合印局，印星有力，学业功名可期。',
  '此命建禄格，身旺有根，自立自强。',
  '月刃格入命，刚毅果断，但须防冲动之患。',
]

/** 用神类短语 */
var MASTER_USEGOD: string[] = [
  '用神为木，利东方运，春冬之际运势最佳。',
  '用神为火，利南方运，夏季为吉时。',
  '用神为土，利中央运，四季交替之际为宜。',
  '用神为金，利西方运，秋季为佳期。',
  '用神为水，利北方运，冬季为吉时。',
  '用神有力，一生得助，遇困能解。',
  '用神受制，运势多艰，宜韬光养晦。',
  '喜用两全，此命造层次极高。',
  '用神为印，利文职学业，逢印运大发。',
  '用神为食伤，利才华展现，宜从事创作。',
  '用神为财，利求财创业，财运来时莫犹豫。',
  '用神为官杀，利仕途升迁，事业运上佳。',
  '忌神当道，暂避锋芒为上。',
  '忌神有制，凶中有吉，危中有机。',
  '用神在年，少年得志。',
  '用神在月，中年有成。',
  '用神在日，自身得力。',
  '用神在时，晚年享福。',
  '调候用神为要，寒暖湿燥需调和。',
  '此命木火为用，宜向阳之地发展。',
]

/** 婚姻类短语 */
var MASTER_MARRIAGE: string[] = [
  '日支坐财，夫妻宫有根，婚姻美满之象。',
  '日支坐官，夫宫有气，主配偶有能。',
  '夫妻宫逢冲，婚姻多波折，晚婚为宜。',
  '男命财星有力，妻缘深厚，婚姻美满。',
  '女命官星纯粹，夫星得力，婚姻顺遂。',
  '命带桃花，异性缘佳，但须防烂桃花之扰。',
  '日支比肩，夫妻感情易生竞争，须互相包容。',
  '日支偏财，主配偶善理财，但恐外遇之患。',
  '红鸾天喜入命，姻缘可期。',
  '咸池入命，风流多情，须守本分。',
  '日支坐驿马，配偶多外出奔波，聚少离多。',
  '婚姻宫坐喜用神，配偶助己之力大。',
  '婚姻宫坐忌神，配偶虽好但助力不足。',
  '命逢孤辰寡宿，婚姻恐有孤独之感。',
  '此命宜晚婚，早婚恐有波折。',
  '日支与年支相合，配偶与家庭关系融洽。',
  '夫妻星宫皆得力，婚姻为一生之福。',
  '此命婚姻宜找水命之人相助。',
  '配偶宫逢合，婚姻稳固少变。',
  '命局伤官重，女命须防克夫之嫌。',
]

/** 事业类短语 */
var MASTER_CAREER: string[] = [
  '官印相生，仕途有望，利公门行政。',
  '食神生财，宜商贾之业，财运自通。',
  '七杀有制，权柄在手，利武职管理。',
  '偏官佩印，宜技术专精之业。',
  '伤官生财，宜创业投资，有商界之才。',
  '正官得位，宜文职仕途，稳步上升。',
  '命带将星，有领导才能，可担大任。',
  '驿马星动，利外出发展，宜走动之业。',
  '天乙贵人与官星同见，事业多贵人助力。',
  '文昌入命利文途，学术研究为佳。',
  '华盖入命，利宗教哲学艺术类职业。',
  '此命宜独立创业，不宜寄人篱下。',
  '命带禄神，一生不缺衣食，事业平稳。',
  '大运逢官，升迁之象，事业更上层楼。',
  '流年见马星，主变动，利出差调动。',
  '官星入墓，事业有阻力，宜低调行事。',
  '财官双美，名利双收，事业大成。',
  '此命早年辛苦，中年发迹，晚景优游。',
  '印星透干，利教育文化出版之业。',
  '食伤泄秀，宜表演、创作、设计类工作。',
]

/** 财富类短语 */
var MASTER_WEALTH: string[] = [
  '财气通门户，一生富足，不缺衣食。',
  '身旺能任财，财运亨通，大富之命。',
  '食伤生财，以才华创财富，名利双收。',
  '财星有库，能聚能守，富贵绵长。',
  '偏财透出，有意外之财，横财可期。',
  '正财得位，收入稳定，勤俭致富。',
  '比劫夺财，须防破财之患，不宜合伙。',
  '身弱见财为累，求财辛苦，不宜贪大。',
  '财官相生，名利双收，福禄齐全。',
  '命带金舆，富贵双全之象。',
  '财星坐禄，一生不缺钱财。',
  '此命财在年柱，祖上留有家业。',
  '财在月柱，青年得财，事业有成。',
  '财在日柱，中年财运最佳。',
  '财在时柱，晚年富足，子女孝顺。',
  '命逢财库大开，大富之命。',
  '财多身弱，富屋贫人，有钱无处花。',
  '此命先贫后富，大运至时一飞冲天。',
  '食神生偏财，财运极佳，善投资理财。',
  '命中无财，但食伤旺，靠才华致富。',
]

/** 健康类短语 */
var MASTER_HEALTH: string[] = [
  '五行调和，体格康健，少病少灾。',
  '水火不调，须防心血管之疾。',
  '木金交战，注意肝胆呼吸之疾。',
  '土虚水泛，脾胃肾脏须保养。',
  '火旺土焦，小心皮肤燥热之症。',
  '金水相生，肺肾协调，先天体质佳。',
  '木旺无制，肝气偏盛，须疏肝解郁。',
  '印星有力，先天元气充足，抗病力强。',
  '日主有根，生命力旺盛，益寿之象。',
  '官杀太旺，压力过大，须注意心理健康。',
  '此命土旺，脾胃偏弱，饮食须节制。',
  '命带华盖，心思过重，宜静心修养。',
  '用神得力，正气内存，邪不可干。',
  '忌神当令，体质偏弱，须多加调养。',
  '五行缺水，肾气不足，须注意保养。',
  '此命宜运动养生，动静结合。',
  '命中火旺，须防眼部疾患。',
  '日主弱而官杀旺，易感风寒外邪。',
  '此命先天体质偏寒，宜温补调理。',
  '印星为用，养生之道在于静养读书。',
]

/** 运势类短语 */
var MASTER_FORTUNE: string[] = [
  '大运行用神方位，十年吉运，顺势而为。',
  '大运逢忌神，十年宜守，待时而动。',
  '流年吉星入命，此年当有喜事临门。',
  '流年冲犯太岁，宜谨慎行事，以静制动。',
  '此运官星得力，事业升迁在即。',
  '此运财星当令，求财大利，莫失良机。',
  '此运印星主事，学业进步，考试顺利。',
  '此运食伤旺，灵感涌现，创作丰收。',
  '此运比劫旺，合作运势佳，但须防破财。',
  '此运官杀混杂，事业多波折，宜稳重行事。',
  '交运之际，气运转换，须注意身心调适。',
  '命好不如运好，运到自然成。',
  '吉运连绵，此十年为一生中最佳运程。',
  '凶运之中有暗吉，否极泰来之象。',
  '此命少年辛苦、中年得志、晚景优游。',
  '大运一路顺行，此为顺畅之命。',
  '大运逆行，虽多波折但后运极佳。',
  '此运驿马星动，主迁移变动，利外出。',
  '流年三合大运，此年贵人多助。',
  '此运桃花入命，未婚者宜把握姻缘。',
]

// ═══════════════════════════════════════════════════════════
// 常量：替换映射表
// ═══════════════════════════════════════════════════════════

/** AI 词汇 → 命理表达 替换映射 */
var REPLACEMENT_MAP: Array<{ from: string; to: string }> = [
  { from: '根据分析', to: '观命局所见' },
  { from: '综合来看', to: '统而论之' },
  { from: '总的来说', to: '概而言之' },
  { from: '总体而言', to: '统论此命' },
  { from: '综上所述', to: '综上所断' },
  { from: '整体来看', to: '观此全盘' },
  { from: '总而言之', to: '一言以蔽之' },
  { from: '从以上分析来看', to: '据此推演' },
  { from: '基于以上分析', to: '以理推之' },
  { from: '由此可见', to: '此理甚明' },
  { from: '因此', to: '故而' },
  { from: '所以', to: '是以' },
  { from: '可见', to: '明矣' },
  { from: '值得注意的是', to: '须察' },
  { from: '需要指出的是', to: '当知' },
  { from: '需要提醒的是', to: '切记' },
  { from: '需要注意', to: '须防' },
  { from: '需要特别关注', to: '当留心' },
  { from: '另外', to: '且' },
  { from: '此外', to: '再者' },
  { from: '除此之外', to: '更有甚者' },
  { from: '同时', to: '且' },
  { from: '与此同时', to: '此时' },
  { from: '建议', to: '宜' },
  { from: '建议您', to: '宜' },
  { from: '建议你', to: '宜' },
  { from: '可以考虑', to: '可取' },
  { from: '推荐', to: '宜取' },
  { from: '最好', to: '当以' },
  { from: '尽量', to: '力求' },
  { from: '应该', to: '当' },
  { from: '应该注意', to: '须防' },
  { from: '必须', to: '当' },
  { from: '务必要', to: '切记' },
  { from: '非常', to: '甚' },
  { from: '极其', to: '极' },
  { from: '十分', to: '甚为' },
  { from: '特别', to: '尤宜' },
  { from: '尤其', to: '尤以' },
  { from: '比较', to: '略见' },
  { from: '较为', to: '颇见' },
  { from: '大致', to: '约略' },
  { from: '基本上', to: '大体而言' },
  { from: '大概率', to: '多主' },
  { from: '可能会', to: '恐有' },
  { from: '有可能', to: '恐有' },
  { from: '在一定程度上', to: '多少有几分' },
  { from: '从某种程度上说', to: '就此而论' },
  { from: '经过分析', to: '细推此命' },
  { from: '经过详细分析', to: '细究命理' },
  { from: '经过深入研究', to: '深研此造' },
  { from: '通过分析', to: '推演可见' },
  { from: '通过以上分析', to: '由此可知' },
  { from: '从数据来看', to: '观其象' },
  { from: '从结果来看', to: '观其果' },
  { from: '从命盘来看', to: '观此命盘' },
  { from: '从八字来看', to: '就此八字而论' },
  { from: '仅供参考', to: '命理如此，信则有之' },
  { from: '以供参考', to: '以备参酌' },
  { from: '作为一个', to: '此乃' },
  { from: '希望以上分析', to: '此乃命理所断' },
  { from: '以上分析', to: '上述推论' },
  { from: '简单来说', to: '简而言之' },
  { from: '简单来讲', to: '简言之' },
  { from: '换句话说', to: '换言之' },
  { from: '也就是说', to: '即' },
  { from: '我的分析显示', to: '断曰' },
  { from: '在分析中', to: '推演之中' },
  { from: '在推演中', to: '推算之下' },
  { from: '理性看待', to: '命由天定，事在人为' },
  { from: '请理性看待', to: '知命而不唯命' },
  { from: '不可全信', to: '仅供参考酌' },
  { from: '重要的一点是', to: '尤当记取者' },
  { from: '更重要的一点是', to: '尤要者' },
  { from: '不仅如此', to: '更有' },
]

// ═══════════════════════════════════════════════════════════
// 引擎类
// ═══════════════════════════════════════════════════════════

/**
 * P4.10 MasterToneEngine — 真人命理语言优化引擎
 *
 * 核心功能：
 *   1. 扫描文本中的 AI 常用词（40+ 个）
 *   2. 将 AI 词汇替换为传统命理表达
 *   3. 评分命理语言纯度（0-100）
 *   4. 支持 100+ 条大师批命短语
 */
export class MasterToneEngine {
  /** 语气配置 */
  private config: ToneConfig

  /** 核心古籍依据 */
  private classicalRef: string = '《渊海子平》批命风格——言简意赅、断语有力、不留余地，乃传统命理师之正宗笔法。'

  /** 累计统计：总检测次数 */
  private totalChecks: number = 0

  /** 累计统计：总替换次数 */
  private totalReplacements: number = 0

  constructor() {
    // 初始化配置
    var allBanned = AI_CONNECTORS
      .concat(AI_SUGGESTIONS)
      .concat(AI_MODIFIERS)
      .concat(AI_STRUCTURES)
      .concat(AI_OTHERS)

    var allPhrases = MASTER_GENERAL
      .concat(MASTER_PATTERN)
      .concat(MASTER_USEGOD)
      .concat(MASTER_MARRIAGE)
      .concat(MASTER_CAREER)
      .concat(MASTER_WEALTH)
      .concat(MASTER_HEALTH)
      .concat(MASTER_FORTUNE)

    this.config = {
      enableMasterTone: true,
      bannedWords: this.deduplicate(allBanned),
      masterPhrases: this.deduplicate(allPhrases),
    }
  }

  // ─── 核心 API ───

  /**
   * 转换文本：扫描并替换所有 AI 词汇
   * @param text 原始文本
   * @returns 转换结果
   */
  transform(text: string): MasterToneResult {
    var now = nowISO()
    this.totalChecks++

    if (!this.config.enableMasterTone) {
      return {
        generatedAt: now,
        original: text,
        transformed: text,
        bannedWordsFound: [],
        replacedCount: 0,
        score: clampScore(50 + Math.floor(Math.random() * 20)),
        classicalRef: this.classicalRef,
      }
    }

    // 扫描发现的 AI 词汇
    var bannedWordsFound: string[] = []

    // 按长度降序排列替换规则，优先匹配更长的词组
    var sortedReplacements = REPLACEMENT_MAP.slice().sort(function (a, b) {
      return b.from.length - a.from.length
    })

    // 执行替换
    var transformed = text
    var replacedCount = 0

    for (var i = 0; i < sortedReplacements.length; i++) {
      var rule = sortedReplacements[i]
      if (transformed.indexOf(rule.from) !== -1) {
        // 计算出现了多少次
        var count = this.countOccurrences(transformed, rule.from)
        if (count > 0) {
          bannedWordsFound.push(rule.from)
          // 执行全部替换
          while (transformed.indexOf(rule.from) !== -1) {
            transformed = transformed.replace(rule.from, rule.to)
            replacedCount++
          }
        }
      }
    }

    // 补充扫描：检测是否还有遗漏的 AI 词汇（config 中的词）
    for (var j = 0; j < this.config.bannedWords.length; j++) {
      var word = this.config.bannedWords[j]
      if (text.indexOf(word) !== -1 && bannedWordsFound.indexOf(word) === -1) {
        bannedWordsFound.push(word)
      }
    }

    // 去重
    bannedWordsFound = this.deduplicate(bannedWordsFound)

    // 更新统计
    this.totalReplacements += replacedCount

    // 计算评分
    var score = this.calculateScore(text, transformed, bannedWordsFound)

    return {
      generatedAt: now,
      original: text,
      transformed: transformed,
      bannedWordsFound: bannedWordsFound,
      replacedCount: replacedCount,
      score: score,
      classicalRef: this.classicalRef,
    }
  }

  /**
   * 检查文本的命理语言纯度
   * @param text 待检查文本
   * @returns 评分和问题列表
   */
  checkTone(text: string): ToneCheckResult {
    this.totalChecks++

    var issues: string[] = []

    // 检查 AI 词汇出现情况
    var aiWordCount = 0
    for (var i = 0; i < this.config.bannedWords.length; i++) {
      var word = this.config.bannedWords[i]
      if (text.indexOf(word) !== -1) {
        aiWordCount++
        issues.push('发现 AI 词汇："' + word + '"')
      }
    }

    // 检查大师短语使用情况
    var masterPhraseCount = 0
    for (var j = 0; j < this.config.masterPhrases.length; j++) {
      var phrase = this.config.masterPhrases[j]
      if (text.indexOf(phrase.substring(0, 4)) !== -1) {
        masterPhraseCount++
      }
    }

    // 检查句子长度（大师批命风格通常较短）
    var sentences = text.split(/[。！？\n]/)
    var avgSentenceLength = 0
    if (sentences.length > 0) {
      var totalLen = 0
      for (var s = 0; s < sentences.length; s++) {
        totalLen += sentences[s].trim().length
      }
      avgSentenceLength = Math.round(totalLen / sentences.length)
    }
    if (avgSentenceLength > 40) {
      issues.push('句子平均长度 ' + avgSentenceLength + ' 字，大师批命风格应更精炼（建议 15-30 字）')
    }

    // 检查是否包含古籍引用
    var hasClassical = text.indexOf('《') !== -1 && text.indexOf('》') !== -1
    if (!hasClassical) {
      issues.push('未发现古籍引用，传统命理应适当引用经典')
    }

    // 检查是否包含现代 AI 特有表达
    var aiPatterns = ['分析', '推算', '算法', '模型', '数据', '概率', '系统']
    for (var a = 0; a < aiPatterns.length; a++) {
      if (text.indexOf(aiPatterns[a]) !== -1) {
        issues.push('发现现代术语："' + aiPatterns[a] + '"，命理批文宜用古法表述')
        break
      }
    }

    // 计算评分
    var score = this.calculateScoreFromStats(aiWordCount, masterPhraseCount, avgSentenceLength, hasClassical)

    return {
      score: score,
      issues: issues,
    }
  }

  /**
   * 添加禁用词
   * @param word 要添加的禁用词
   */
  addBannedWord(word: string): void {
    if (word && word.length > 0 && this.config.bannedWords.indexOf(word) === -1) {
      this.config.bannedWords.push(word)
    }
  }

  /**
   * 添加大师短语
   * @param phrase 要添加的大师批命短语
   */
  addMasterPhrase(phrase: string): void {
    if (phrase && phrase.length > 0 && this.config.masterPhrases.indexOf(phrase) === -1) {
      this.config.masterPhrases.push(phrase)
    }
  }

  /**
   * 获取当前配置
   * @returns ToneConfig
   */
  getConfig(): ToneConfig {
    return {
      enableMasterTone: this.config.enableMasterTone,
      bannedWords: this.config.bannedWords.slice(),
      masterPhrases: this.config.masterPhrases.slice(),
    }
  }

  // ─── 便捷方法 ───

  /**
   * 根据维度获取大师批命短语
   * @param dimension 维度名称
   * @param count 需要的短语数量
   * @returns 大师批命短语列表
   */
  getMasterPhrasesByDimension(dimension: string, count: number): string[] {
    var pool: string[] = []

    switch (dimension) {
      case '格局':
        pool = MASTER_PATTERN
        break
      case '用神':
        pool = MASTER_USEGOD
        break
      case '婚姻':
        pool = MASTER_MARRIAGE
        break
      case '事业':
        pool = MASTER_CAREER
        break
      case '财富':
        pool = MASTER_WEALTH
        break
      case '健康':
        pool = MASTER_HEALTH
        break
      case '运势':
        pool = MASTER_FORTUNE
        break
      default:
        pool = MASTER_GENERAL
    }

    return pickN(pool, Math.min(count, pool.length))
  }

  /**
   * 批量转换文本
   * @param texts 文本列表
   * @returns 转换结果列表
   */
  transformBatch(texts: string[]): MasterToneResult[] {
    var results: MasterToneResult[] = []
    for (var i = 0; i < texts.length; i++) {
      results.push(this.transform(texts[i]))
    }
    return results
  }

  /**
   * 获取引擎统计
   * @returns 统计信息
   */
  getStats(): { totalChecks: number; totalReplacements: number; avgReplacementsPerCheck: number } {
    var avg = this.totalChecks > 0
      ? Math.round(this.totalReplacements / this.totalChecks * 100) / 100
      : 0
    return {
      totalChecks: this.totalChecks,
      totalReplacements: this.totalReplacements,
      avgReplacementsPerCheck: avg,
    }
  }

  // ─── 内部方法 ───

  /**
   * 计算转换后的命理语言评分
   */
  private calculateScore(original: string, transformed: string, bannedFound: string[]): number {
    // 基础分 60 分
    var baseScore = 60

    // AI 词汇扣分：每个扣 3 分，最多扣 30 分
    var penalty = Math.min(30, bannedFound.length * 3)

    // 替换完成度加分：如果原始中有 AI 词汇但转换后没有，说明替换成功
    var originalAiCount = 0
    var transformedAiCount = 0
    for (var i = 0; i < this.config.bannedWords.length; i++) {
      if (original.indexOf(this.config.bannedWords[i]) !== -1) {
        originalAiCount++
      }
      if (transformed.indexOf(this.config.bannedWords[i]) !== -1) {
        transformedAiCount++
      }
    }

    // 替换成功加分
    var replacementBonus = 0
    if (originalAiCount > 0) {
      var ratio = (originalAiCount - transformedAiCount) / originalAiCount
      replacementBonus = Math.round(ratio * 25)
    } else {
      // 原始没有 AI 词汇，已经是好文本
      replacementBonus = 15
    }

    // 大师短语使用加分
    var masterCount = 0
    for (var j = 0; j < this.config.masterPhrases.length; j++) {
      if (transformed.indexOf(this.config.masterPhrases[j].substring(0, 4)) !== -1) {
        masterCount++
      }
    }
    var masterBonus = Math.min(15, masterCount * 5)

    // 句子精炼度加分
    var sentences = transformed.split(/[。！？\n]/).filter(function (s) { return s.trim().length > 0 })
    var avgLen = 0
    if (sentences.length > 0) {
      var total = 0
      for (var s = 0; s < sentences.length; s++) {
        total += sentences[s].trim().length
      }
      avgLen = total / sentences.length
    }
    var concisenessBonus = 0
    if (avgLen >= 10 && avgLen <= 35) {
      concisenessBonus = 5
    } else if (avgLen > 35 && avgLen <= 50) {
      concisenessBonus = 2
    }

    var score = baseScore + replacementBonus + masterBonus + concisenessBonus - penalty
    return clampScore(score)
  }

  /**
   * 根据统计数据计算评分（checkTone 使用）
   */
  private calculateScoreFromStats(
    aiWordCount: number,
    masterPhraseCount: number,
    avgSentenceLength: number,
    hasClassical: boolean
  ): number {
    // 基础分 50
    var score = 50

    // AI 词汇扣分
    score = score - Math.min(30, aiWordCount * 3)

    // 大师短语加分
    score = score + Math.min(15, masterPhraseCount * 5)

    // 句子精炼度加分
    if (avgSentenceLength >= 10 && avgSentenceLength <= 35) {
      score = score + 5
    }

    // 古籍引用加分
    if (hasClassical) {
      score = score + 5
    }

    // 无 AI 词汇额外加分
    if (aiWordCount === 0) {
      score = score + 10
    }

    return clampScore(score)
  }

  /**
   * 计算子字符串出现次数
   */
  private countOccurrences(text: string, sub: string): number {
    if (sub.length === 0) return 0
    var count = 0
    var pos = 0
    while (true) {
      pos = text.indexOf(sub, pos)
      if (pos === -1) break
      count++
      pos = pos + sub.length
    }
    return count
  }

  /**
   * 数组去重
   */
  private deduplicate(arr: string[]): string[] {
    var result: string[] = []
    for (var i = 0; i < arr.length; i++) {
      if (result.indexOf(arr[i]) === -1) {
        result.push(arr[i])
      }
    }
    return result
  }
}

// ═══════════════════════════════════════════════════════════
// 导出便捷函数
// ═══════════════════════════════════════════════════════════

/**
 * 快速转换文本为大师语气
 * @param text 原始文本
 * @returns 转换结果
 */
export function transformToMasterTone(text: string): MasterToneResult {
  var engine = new MasterToneEngine()
  return engine.transform(text)
}

/**
 * 检查文本的命理语言纯度
 * @param text 待检查文本
 * @returns 检查结果
 */
export function checkMasterTone(text: string): ToneCheckResult {
  var engine = new MasterToneEngine()
  return engine.checkTone(text)
}
