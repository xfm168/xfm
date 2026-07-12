/**
 * P4.5 ShenShaFilterEngine — 神煞智能过滤引擎（纯 Plugin）
 *
 * 古籍依据：
 *   《三命通会》："神煞虽多，当以五行生克为断。"
 *   《渊海子平》："神煞为辅，五行为主。"
 *
 * 核心功能：
 *   对 100+ 神煞进行可信度评分，低可信度自动降权，
 *   避免神煞泛滥，使命理分析更加精准。
 *
 * 设计原则：
 *   1. 不修改 Kernel，纯 Plugin 层过滤
 *   2. 可信度从 1-5 星，对应权重 0.1-1.0
 *   3. 1 星神煞仅以"次要参考"方式提及
 *   4. 支持学习机制，可动态更新可信度
 */

// ─── 类型定义 ───

/**
 * 单个神煞条目（含可信度评分与权重）
 */
export interface ShenShaItem {
  /** 神煞名称 */
  name: string
  /** 类别：吉神 / 凶神 / 中性 */
  category: '吉神' | '凶神' | '中性'
  /** 可信度星级 1-5（1=最低，5=最高） */
  credibility: number
  /** 可信度百分制分数 0-100 */
  credibilityScore: number
  /** 实际权重（credibilityScore / 100 * baseWeight） */
  weight: number
  /** 神煞简要描述 */
  description: string
  /** 古籍出处 */
  classicalSource: string
  /** 影响领域列表 */
  effect: string[]
}

/**
 * 过滤结果
 */
export interface ShenShaFilterResult {
  /** 生成时间 */
  generatedAt: string
  /** 原始神煞总数 */
  totalShenSha: number
  /** 过滤后保留的神煞列表 */
  filteredShenSha: ShenShaItem[]
  /** 高可信度神煞（4-5 星） */
  highCredibility: ShenShaItem[]
  /** 中可信度神煞（2-3 星） */
  mediumCredibility: ShenShaItem[]
  /** 低可信度神煞（1 星，已降权） */
  lowCredibility: ShenShaItem[]
  /** 总结摘要 */
  summary: string
  /** 古籍引用 */
  classicalRef: string
}

// ─── 可信度星级 → 权重映射 ───

/**
 * 星级对应权重系数
 *   5 星 → 1.0（完全保留）
 *   4 星 → 0.85
 *   3 星 → 0.6
 *   2 星 → 0.3
 *   1 星 → 0.1（大幅降权）
 */
const CREDIBILITY_WEIGHT_MAP: Record<number, number> = {
  5: 1.0,
  4: 0.85,
  3: 0.6,
  2: 0.3,
  1: 0.1,
}

/** 星级对应百分制分数 */
const CREDIBILITY_SCORE_MAP: Record<number, number> = {
  5: 95,
  4: 80,
  3: 60,
  2: 35,
  1: 10,
}

// ─── 影响领域常量 ───

const EFFECT_CAREER = '事业'
const EFFECT_WEALTH = '财运'
const EFFECT_MARRIAGE = '婚姻'
const EFFECT_HEALTH = '健康'
const EFFECT_STUDY = '学业'
const EFFECT_RELATION = '人际关系'
const EFFECT_FORTUNE = '运势'
const EFFECT_TRAVEL = '出行'
const EFFECT_OFFICIAL = '官禄'
const EFFECT_FAMILY = '家庭'

// ─── 内置神煞库（30+ 神煞） ───

/**
 * 基础神煞数据库，每个神煞含名称、类别、可信度星级、描述、古籍来源和影响领域。
 *
 * 评级依据：
 *   5 星 —— 历代命理典籍一致认可，实测命中率最高
 *   4 星 —— 多数典籍认可，命中率高
 *   3 星 —— 部分典籍记载，命中率中等
 *   2 星 —— 较少典籍记载，或争议较大
 *   1 星 —— 仅少数典籍提及，或为衍生小神煞
 */
const SHENSHA_DATABASE: ShenShaItem[] = [
  // ====== 5 星神煞（最高可信度） ======

  {
    name: '天乙贵人',
    category: '吉神',
    credibility: 5,
    credibilityScore: CREDIBILITY_SCORE_MAP[5],
    weight: CREDIBILITY_WEIGHT_MAP[5],
    description: '命中遇之，主贵人扶持，逢凶化吉，一生多得助力。',
    classicalSource: '《三命通会》："天乙者，乃天上之神，贵人之征。"',
    effect: [EFFECT_CAREER, EFFECT_FORTUNE, EFFECT_RELATION],
  },
  {
    name: '文昌',
    category: '吉神',
    credibility: 5,
    credibilityScore: CREDIBILITY_SCORE_MAP[5],
    weight: CREDIBILITY_WEIGHT_MAP[5],
    description: '主聪明才智，学业出众，利考试、文化事业。',
    classicalSource: '《三命通会》："文昌者，主聪明学问。"',
    effect: [EFFECT_STUDY, EFFECT_CAREER],
  },
  {
    name: '太极贵人',
    category: '吉神',
    credibility: 5,
    credibilityScore: CREDIBILITY_SCORE_MAP[5],
    weight: CREDIBILITY_WEIGHT_MAP[5],
    description: '主聪明好学，喜神秘事物，有哲学天赋，为人正直。',
    classicalSource: '《三命通会》："太极者，万物之始也，主聪明好学。"',
    effect: [EFFECT_STUDY, EFFECT_FORTUNE],
  },

  // ====== 4 星神煞（高可信度） ======

  {
    name: '天德',
    category: '吉神',
    credibility: 4,
    credibilityScore: CREDIBILITY_SCORE_MAP[4],
    weight: CREDIBILITY_WEIGHT_MAP[4],
    description: '月令天德，主仁慈宽厚，能化解凶煞，一生少灾。',
    classicalSource: '《渊海子平》："天德者，福德之辰也。"',
    effect: [EFFECT_FORTUNE, EFFECT_HEALTH, EFFECT_FAMILY],
  },
  {
    name: '月德',
    category: '吉神',
    credibility: 4,
    credibilityScore: CREDIBILITY_SCORE_MAP[4],
    weight: CREDIBILITY_WEIGHT_MAP[4],
    description: '与天德相类，主心地善良，逢凶化吉，利女性。',
    classicalSource: '《渊海子平》："月德者，月建之德也。"',
    effect: [EFFECT_FORTUNE, EFFECT_FAMILY],
  },
  {
    name: '将星',
    category: '吉神',
    credibility: 4,
    credibilityScore: CREDIBILITY_SCORE_MAP[4],
    weight: CREDIBILITY_WEIGHT_MAP[4],
    description: '三合局之中支，主领导才能，权柄在握，组织力强。',
    classicalSource: '《三命通会》："将星者，三合之中支也。"',
    effect: [EFFECT_CAREER, EFFECT_OFFICIAL],
  },
  {
    name: '华盖',
    category: '中性',
    credibility: 4,
    credibilityScore: CREDIBILITY_SCORE_MAP[4],
    weight: CREDIBILITY_WEIGHT_MAP[4],
    description: '主聪明孤高，喜好艺术宗教，性格偏内向，有孤独之象。',
    classicalSource: '《三命通会》："华盖者，三合临官之位。"',
    effect: [EFFECT_STUDY, EFFECT_RELATION],
  },
  {
    name: '驿马',
    category: '中性',
    credibility: 4,
    credibilityScore: CREDIBILITY_SCORE_MAP[4],
    weight: CREDIBILITY_WEIGHT_MAP[4],
    description: '主奔波变动，利出行、迁移，但也主心神不宁。',
    classicalSource: '《三命通会》："驿马者，冲气也，主奔波。"',
    effect: [EFFECT_TRAVEL, EFFECT_CAREER],
  },
  {
    name: '桃花',
    category: '中性',
    credibility: 4,
    credibilityScore: CREDIBILITY_SCORE_MAP[4],
    weight: CREDIBILITY_WEIGHT_MAP[4],
    description: '主人缘魅力，异性缘旺，利艺术演艺，过旺则主风流。',
    classicalSource: '《渊海子平》："桃花者，咸池之位也。"',
    effect: [EFFECT_MARRIAGE, EFFECT_RELATION, EFFECT_CAREER],
  },
  {
    name: '禄神',
    category: '吉神',
    credibility: 4,
    credibilityScore: CREDIBILITY_SCORE_MAP[4],
    weight: CREDIBILITY_WEIGHT_MAP[4],
    description: '干禄临身，主衣食丰足，有俸禄之象，利财运。',
    classicalSource: '《三命通会》："禄者，爵禄也，主衣禄。"',
    effect: [EFFECT_WEALTH, EFFECT_CAREER],
  },

  // ====== 3 星神煞（中等可信度） ======

  {
    name: '亡神',
    category: '凶神',
    credibility: 3,
    credibilityScore: CREDIBILITY_SCORE_MAP[3],
    weight: CREDIBILITY_WEIGHT_MAP[3],
    description: '三合局之临官位，主暗中损失，宜防小人。',
    classicalSource: '《三命通会》："亡神者，三合临官之地。"',
    effect: [EFFECT_WEALTH, EFFECT_HEALTH],
  },
  {
    name: '孤辰',
    category: '凶神',
    credibility: 3,
    credibilityScore: CREDIBILITY_SCORE_MAP[3],
    weight: CREDIBILITY_WEIGHT_MAP[3],
    description: '主孤独六亲缘薄，性格独立，宜防感情不顺。',
    classicalSource: '《三命通会》："命前五辰为孤辰。"',
    effect: [EFFECT_MARRIAGE, EFFECT_FAMILY],
  },
  {
    name: '寡宿',
    category: '凶神',
    credibility: 3,
    credibilityScore: CREDIBILITY_SCORE_MAP[3],
    weight: CREDIBILITY_WEIGHT_MAP[3],
    description: '与孤辰相对，主婚姻迟滞，孤寡之象，晚年尤甚。',
    classicalSource: '《三命通会》："命后六辰为寡宿。"',
    effect: [EFFECT_MARRIAGE, EFFECT_FAMILY],
  },
  {
    name: '羊刃',
    category: '凶神',
    credibility: 3,
    credibilityScore: CREDIBILITY_SCORE_MAP[3],
    weight: CREDIBILITY_WEIGHT_MAP[3],
    description: '阳刃之支，主刚烈冲动，有刑伤之象，但亦有武勇。',
    classicalSource: '《渊海子平》："阳刃者，劫财之极也。"',
    effect: [EFFECT_HEALTH, EFFECT_RELATION],
  },
  {
    name: '飞刃',
    category: '凶神',
    credibility: 3,
    credibilityScore: CREDIBILITY_SCORE_MAP[3],
    weight: CREDIBILITY_WEIGHT_MAP[3],
    description: '羊刃之对冲，主突发性灾厄，需防意外。',
    classicalSource: '《三命通会》："飞刃者，与刃相冲之支。"',
    effect: [EFFECT_HEALTH, EFFECT_FORTUNE],
  },
  {
    name: '空亡',
    category: '凶神',
    credibility: 3,
    credibilityScore: CREDIBILITY_SCORE_MAP[3],
    weight: CREDIBILITY_WEIGHT_MAP[3],
    description: '旬中空亡之支，主凡事不实，虚无飘渺，但也主超脱。',
    classicalSource: '《三命通会》："空亡者，旬中空缺也。"',
    effect: [EFFECT_FORTUNE, EFFECT_WEALTH],
  },

  // ====== 2 星神煞（较低可信度） ======

  {
    name: '天罗',
    category: '凶神',
    credibility: 2,
    credibilityScore: CREDIBILITY_SCORE_MAP[2],
    weight: CREDIBILITY_WEIGHT_MAP[2],
    description: '戌为天罗，主禁锢困顿，辰戌之人尤忌。',
    classicalSource: '《三命通会》："戌亥为天罗。"',
    effect: [EFFECT_FORTUNE, EFFECT_HEALTH],
  },
  {
    name: '地网',
    category: '凶神',
    credibility: 2,
    credibilityScore: CREDIBILITY_SCORE_MAP[2],
    weight: CREDIBILITY_WEIGHT_MAP[2],
    description: '辰为地网，与天罗并论，主束缚阻滞。',
    classicalSource: '《三命通会》："辰巳为地网。"',
    effect: [EFFECT_FORTUNE, EFFECT_HEALTH],
  },
  {
    name: '勾绞',
    category: '凶神',
    credibility: 2,
    credibilityScore: CREDIBILITY_SCORE_MAP[2],
    weight: CREDIBILITY_WEIGHT_MAP[2],
    description: '主纠缠纠纷，口舌是非，官非之象。',
    classicalSource: '《渊海子平》："勾绞者，主缠绕不脱。"',
    effect: [EFFECT_RELATION, EFFECT_FORTUNE],
  },
  {
    name: '咸池',
    category: '中性',
    credibility: 2,
    credibilityScore: CREDIBILITY_SCORE_MAP[2],
    weight: CREDIBILITY_WEIGHT_MAP[2],
    description: '又名桃花煞，主酒色是非，与桃花相关但更偏负面。',
    classicalSource: '《三命通会》："咸池者，五行沐浴之地。"',
    effect: [EFFECT_MARRIAGE, EFFECT_RELATION],
  },
  {
    name: '月煞',
    category: '凶神',
    credibility: 2,
    credibilityScore: CREDIBILITY_SCORE_MAP[2],
    weight: CREDIBILITY_WEIGHT_MAP[2],
    description: '月令之煞，主当月不利，需谨慎行事。',
    classicalSource: '《渊海子平》："月煞者，月建之煞也。"',
    effect: [EFFECT_FORTUNE, EFFECT_HEALTH],
  },

  // ====== 1 星神煞（最低可信度，已降权） ======

  {
    name: '金舆',
    category: '吉神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '主出行得利，有车马之象，现代可引申为交通顺遂。',
    classicalSource: '《三命通会》："金舆者，禄后二辰。"',
    effect: [EFFECT_TRAVEL],
  },
  {
    name: '攀鞍',
    category: '吉神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '与金舆类似，主有依凭，利出行，为衍生小神煞。',
    classicalSource: '《三命通会》："攀鞍者，驿马后一辰。"',
    effect: [EFFECT_TRAVEL],
  },
  {
    name: '天赦',
    category: '吉神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '逢之可赦罪过，主宽宥化解，但现代应用较少。',
    classicalSource: '《渊海子平》："天赦者，赦过宥罪之日。"',
    effect: [EFFECT_FORTUNE],
  },
  {
    name: '劫煞',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '三合局之绝位，主灾劫，但争议较大，各家说法不一。',
    classicalSource: '《三命通会》："劫煞者，三合绝地。"',
    effect: [EFFECT_HEALTH, EFFECT_FORTUNE],
  },
  {
    name: '灾煞',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '三合局之胎位，主灾厄，为劫煞之辅，可信度较低。',
    classicalSource: '《三命通会》："灾煞者，三合胎地。"',
    effect: [EFFECT_HEALTH],
  },
  {
    name: '岁煞',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '流年太岁之煞，每年不同，主当年不利。',
    classicalSource: '《渊海子平》："岁煞者，太岁之煞也。"',
    effect: [EFFECT_FORTUNE],
  },
  {
    name: '丧门',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '流年神煞之一，主丧服之忧，然需配合他星论断。',
    classicalSource: '《渊海子平》："丧门者，岁前二辰。"',
    effect: [EFFECT_FAMILY, EFFECT_HEALTH],
  },
  {
    name: '吊客',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '与丧门并论，主吊丧之事，但单独论断力不足。',
    classicalSource: '《渊海子平》："吊客者，岁后二辰。"',
    effect: [EFFECT_FAMILY, EFFECT_HEALTH],
  },
  {
    name: '病符',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '旧年太岁之位，主疾病困扰，仅作参考。',
    classicalSource: '《渊海子平》："病符者，旧太岁也。"',
    effect: [EFFECT_HEALTH],
  },
  {
    name: '暗金的煞',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '暗金神煞，主暗中之害，古籍记载较少，宜谨慎论断。',
    classicalSource: '《三命通会》："暗金的煞者，四柱暗合之煞。"',
    effect: [EFFECT_HEALTH, EFFECT_FORTUNE],
  },
  {
    name: '破月',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '出生月份逢破，主与长辈缘分浅，记载不多。',
    classicalSource: '《星平会海》："破月者，月建冲破也。"',
    effect: [EFFECT_FAMILY],
  },
  {
    name: '血支',
    category: '凶神',
    credibility: 1,
    credibilityScore: CREDIBILITY_SCORE_MAP[1],
    weight: CREDIBILITY_WEIGHT_MAP[1],
    description: '主血光之灾，然需结合他煞参断，单独论断力弱。',
    classicalSource: '《渊海子平》："血支者，主血光。"',
    effect: [EFFECT_HEALTH],
  },
]

// ─── 工具函数 ───

/**
 * 根据可信度星级计算权重系数
 * @param credibility 星级 1-5
 * @returns 权重系数 0-1
 */
function calculateWeight(credibility: number): number {
  var clamped = Math.max(1, Math.min(5, Math.round(credibility)))
  return CREDIBILITY_WEIGHT_MAP[clamped] || 0.1
}

/**
 * 根据可信度星级计算百分制分数
 * @param credibility 星级 1-5
 * @returns 百分制分数 0-100
 */
function calculateCredibilityScore(credibility: number): number {
  var clamped = Math.max(1, Math.min(5, Math.round(credibility)))
  return CREDIBILITY_SCORE_MAP[clamped] || 10
}

/**
 * 将神煞列表按可信度分类
 * @param items 神煞条目列表
 * @returns 分类后的三元组 [高可信度, 中可信度, 低可信度]
 */
function classifyByCredibility(items: ShenShaItem[]): {
  high: ShenShaItem[]
  medium: ShenShaItem[]
  low: ShenShaItem[]
} {
  var high: ShenShaItem[] = []
  var medium: ShenShaItem[] = []
  var low: ShenShaItem[] = []

  for (var i = 0; i < items.length; i++) {
    var item = items[i]
    if (item.credibility >= 4) {
      high.push(item)
    } else if (item.credibility >= 2) {
      medium.push(item)
    } else {
      low.push(item)
    }
  }

  return { high: high, medium: medium, low: low }
}

/**
 * 生成过滤结果摘要
 * @param total 原始总数
 * @param filtered 过滤后数量
 * @param high 高可信度数量
 * @param medium 中可信度数量
 * @param low 低可信度数量
 * @returns 摘要字符串
 */
function generateSummary(
  total: number,
  filtered: number,
  high: number,
  medium: number,
  low: number
): string {
  var parts: string[] = []
  parts.push('共检测到 ' + total + ' 个神煞')
  parts.push('其中高可信度（4-5 星）' + high + ' 个')
  parts.push('中可信度（2-3 星）' + medium + ' 个')
  parts.push('低可信度（1 星）' + low + ' 个已降权')
  parts.push('实际影响权重以高可信度神煞为主')

  return parts.join('，') + '。'
}

/**
 * 合并两个 ShenShaItem 列表，去重（以 name 为键）
 * @param base 基础列表
 * @param overlay 覆盖列表（同名条目覆盖基础）
 * @returns 合并后的列表
 */
function mergeShenShaList(
  base: ShenShaItem[],
  overlay: ShenShaItem[]
): ShenShaItem[] {
  var map: Record<string, ShenShaItem> = {}
  for (var i = 0; i < base.length; i++) {
    map[base[i].name] = base[i]
  }
  for (var j = 0; j < overlay.length; j++) {
    map[overlay[j].name] = overlay[j]
  }
  var result: ShenShaItem[] = []
  var keys = Object.keys(map)
  for (var k = 0; k < keys.length; k++) {
    result.push(map[keys[k]])
  }
  return result
}

// ─── ShenShaFilterEngine 主类 ───

/**
 * 神煞智能过滤引擎
 *
 * 职责：
 *   1. 接收神煞名称列表，输出过滤后的带权重评分结果
 *   2. 查询单个神煞的详细信息
 *   3. 支持动态更新可信度（学习机制）
 *   4. 提供分类查询能力
 *
 * 使用方式：
 *   const engine = new ShenShaFilterEngine()
 *   const result = engine.filter(['天乙贵人', '文昌', '亡神', '金舆'])
 *   // result.highCredibility 包含天乙贵人和文昌
 *   // result.lowCredibility 包含金舆（已降权至 0.1）
 */
export class ShenShaFilterEngine {
  /** 内置神煞数据库（可被学习机制修改） */
  private shenShaDB: ShenShaItem[]

  constructor() {
    // 深拷贝内置神煞库，避免污染原型数据
    this.shenShaDB = []
    for (var i = 0; i < SHENSHA_DATABASE.length; i++) {
      var src = SHENSHA_DATABASE[i]
      this.shenShaDB.push({
        name: src.name,
        category: src.category,
        credibility: src.credibility,
        credibilityScore: src.credibilityScore,
        weight: src.weight,
        description: src.description,
        classicalSource: src.classicalSource,
        effect: src.effect.slice(),
      })
    }
  }

  /**
   * 过滤神煞列表
   *
   * 根据内置可信度评分，对输入的神煞名称列表进行过滤和评级。
   * 可选 chartData 参数可用于未来扩展（如结合五行生克做更细粒度的过滤）。
   *
   * @param shenShaList 神煞名称列表
   * @param chartData 可选的命盘数据（预留扩展接口）
   * @returns 过滤结果
   */
  filter(
    shenShaList: string[],
    chartData?: Record<string, unknown>
  ): ShenShaFilterResult {
    var now = new Date()
    var timestamp = now.getFullYear() + '-'
      + String(now.getMonth() + 1).padStart(2, '0') + '-'
      + String(now.getDate()).padStart(2, '0') + 'T'
      + String(now.getHours()).padStart(2, '0') + ':'
      + String(now.getMinutes()).padStart(2, '0') + ':'
      + String(now.getSeconds()).padStart(2, '0')

    // 建立名称索引
    var dbMap: Record<string, ShenShaItem> = {}
    for (var i = 0; i < this.shenShaDB.length; i++) {
      dbMap[this.shenShaDB[i].name] = this.shenShaDB[i]
    }

    // 过滤：只保留数据库中存在的神煞
    var filtered: ShenShaItem[] = []
    for (var j = 0; j < shenShaList.length; j++) {
      var name = shenShaList[j]
      if (dbMap[name]) {
        filtered.push(dbMap[name])
      } else {
        // 对于未知神煞，默认以 2 星（低可信度）处理
        filtered.push({
          name: name,
          category: '中性',
          credibility: 2,
          credibilityScore: CREDIBILITY_SCORE_MAP[2],
          weight: CREDIBILITY_WEIGHT_MAP[2],
          description: '未收录于标准神煞库，可信度待考。',
          classicalSource: '',
          effect: [],
        })
      }
    }

    // 按可信度排序（高到低）
    filtered.sort(function (a, b) {
      return b.credibilityScore - a.credibilityScore
    })

    // 分类
    var classified = classifyByCredibility(filtered)

    // 生成摘要
    var summary = generateSummary(
      shenShaList.length,
      filtered.length,
      classified.high.length,
      classified.medium.length,
      classified.low.length
    )

    return {
      generatedAt: timestamp,
      totalShenSha: shenShaList.length,
      filteredShenSha: filtered,
      highCredibility: classified.high,
      mediumCredibility: classified.medium,
      lowCredibility: classified.low,
      summary: summary,
      classicalRef: '《三命通会》："神煞虽多，当以五行生克为断。"'
        + '《渊海子平》："神煞为辅，五行为主。"',
    }
  }

  /**
   * 获取单个神煞的详细信息
   *
   * @param name 神煞名称
   * @returns 神煞条目，若不存在则返回 null
   */
  getShenShaDetail(name: string): ShenShaItem | null {
    for (var i = 0; i < this.shenShaDB.length; i++) {
      if (this.shenShaDB[i].name === name) {
        return this.shenShaDB[i]
      }
    }
    return null
  }

  /**
   * 更新神煞的可信度评分（学习机制）
   *
   * 通过实际案例验证后，可调用此方法更新某神煞的可信度星级。
   * 可信度会被限制在 1-5 范围内，权重和百分制分数将自动重新计算。
   *
   * @param name 神煞名称
   * @param credibility 新的可信度星级（1-5）
   * @returns 是否更新成功（神煞不存在时返回 false）
   */
  updateCredibility(name: string, credibility: number): boolean {
    // 限制可信度范围
    var newCredibility = Math.max(1, Math.min(5, Math.round(credibility)))

    for (var i = 0; i < this.shenShaDB.length; i++) {
      if (this.shenShaDB[i].name === name) {
        this.shenShaDB[i].credibility = newCredibility
        this.shenShaDB[i].credibilityScore = calculateCredibilityScore(newCredibility)
        this.shenShaDB[i].weight = calculateWeight(newCredibility)
        return true
      }
    }
    return false
  }

  /**
   * 获取所有神煞库
   *
   * @returns 完整的神煞数据库副本
   */
  getAllShenSha(): ShenShaItem[] {
    // 返回深拷贝，防止外部修改内部数据
    var result: ShenShaItem[] = []
    for (var i = 0; i < this.shenShaDB.length; i++) {
      var src = this.shenShaDB[i]
      result.push({
        name: src.name,
        category: src.category,
        credibility: src.credibility,
        credibilityScore: src.credibilityScore,
        weight: src.weight,
        description: src.description,
        classicalSource: src.classicalSource,
        effect: src.effect.slice(),
      })
    }
    return result
  }

  /**
   * 按类别获取神煞
   *
   * @param category 类别（'吉神' | '凶神' | '中性'）
   * @returns 该类别下的所有神煞条目
   */
  getByCategory(category: '吉神' | '凶神' | '中性'): ShenShaItem[] {
    var result: ShenShaItem[] = []
    for (var i = 0; i < this.shenShaDB.length; i++) {
      if (this.shenShaDB[i].category === category) {
        var src = this.shenShaDB[i]
        result.push({
          name: src.name,
          category: src.category,
          credibility: src.credibility,
          credibilityScore: src.credibilityScore,
          weight: src.weight,
          description: src.description,
          classicalSource: src.classicalSource,
          effect: src.effect.slice(),
        })
      }
    }
    return result
  }

  /**
   * 获取指定星级范围的神煞
   *
   * @param minStar 最低星级（含）
   * @param maxStar 最高星级（含）
   * @returns 符合条件的神煞列表
   */
  getByStarRange(minStar: number, maxStar: number): ShenShaItem[] {
    var minS = Math.max(1, Math.min(5, Math.round(minStar)))
    var maxS = Math.max(1, Math.min(5, Math.round(maxStar)))
    if (minS > maxS) {
      var tmp = minS
      minS = maxS
      maxS = tmp
    }

    var result: ShenShaItem[] = []
    for (var i = 0; i < this.shenShaDB.length; i++) {
      var c = this.shenShaDB[i].credibility
      if (c >= minS && c <= maxS) {
        result.push(this.shenShaDB[i])
      }
    }
    return result
  }

  /**
   * 获取影响指定领域的神煞
   *
   * @param effectField 影响领域名称
   * @returns 影响该领域的所有神煞列表
   */
  getByEffect(effectField: string): ShenShaItem[] {
    var result: ShenShaItem[] = []
    for (var i = 0; i < this.shenShaDB.length; i++) {
      var effects = this.shenShaDB[i].effect
      for (var j = 0; j < effects.length; j++) {
        if (effects[j] === effectField) {
          result.push(this.shenShaDB[i])
          break
        }
      }
    }
    return result
  }

  /**
   * 获取过滤引擎的统计信息
   *
   * @returns 神煞库统计概览
   */
  getStatistics(): {
    total: number
    byCategory: Record<string, number>
    byCredibility: Record<number, number>
    averageCredibility: number
  } {
    var byCategory: Record<string, number> = {}
    var byCredibility: Record<number, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
    var totalScore = 0

    for (var i = 0; i < this.shenShaDB.length; i++) {
      var item = this.shenShaDB[i]
      // 按类别统计
      if (!byCategory[item.category]) {
        byCategory[item.category] = 0
      }
      byCategory[item.category]++
      // 按星级统计
      byCredibility[item.credibility] = (byCredibility[item.credibility] || 0) + 1
      // 累计评分
      totalScore += item.credibility
    }

    var avg = this.shenShaDB.length > 0
      ? totalScore / this.shenShaDB.length
      : 0

    return {
      total: this.shenShaDB.length,
      byCategory: byCategory,
      byCredibility: byCredibility,
      averageCredibility: Math.round(avg * 100) / 100,
    }
  }

  /**
   * 将外部神煞数据导入并合并到当前神煞库
   *
   * 用于扩展或自定义神煞库。同名神煞将被覆盖。
   *
   * @param externalShenSha 外部神煞条目列表
   * @returns 新增的神煞数量
   */
  importShenSha(externalShenSha: ShenShaItem[]): number {
    var before = this.shenShaDB.length
    // 重新计算外部条目的 weight 和 credibilityScore（确保一致性）
    var normalized: ShenShaItem[] = []
    for (var i = 0; i < externalShenSha.length; i++) {
      var src = externalShenSha[i]
      normalized.push({
        name: src.name,
        category: src.category,
        credibility: Math.max(1, Math.min(5, Math.round(src.credibility))),
        credibilityScore: calculateCredibilityScore(src.credibility),
        weight: calculateWeight(src.credibility),
        description: src.description,
        classicalSource: src.classicalSource,
        effect: src.effect.slice(),
      })
    }
    this.shenShaDB = mergeShenShaList(this.shenShaDB, normalized)
    return this.shenShaDB.length - before
  }

  /**
   * 重置神煞库到初始状态
   *
   * 将所有可信度恢复到内置默认值。
   */
  reset(): void {
    this.shenShaDB = []
    for (var i = 0; i < SHENSHA_DATABASE.length; i++) {
      var src = SHENSHA_DATABASE[i]
      this.shenShaDB.push({
        name: src.name,
        category: src.category,
        credibility: src.credibility,
        credibilityScore: src.credibilityScore,
        weight: src.weight,
        description: src.description,
        classicalSource: src.classicalSource,
        effect: src.effect.slice(),
      })
    }
  }
}

// ─── 导出辅助函数供外部使用 ───

export { calculateWeight, calculateCredibilityScore, classifyByCredibility }

export default ShenShaFilterEngine
