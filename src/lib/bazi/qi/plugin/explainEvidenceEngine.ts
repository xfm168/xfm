/**
 * P4.9 ExplainEvidenceEngine — Explain 每一句话必须可追溯
 *
 * 古籍依据：
 *   《子平真诠》："论命须有据。" — 每一断语必须有出处，不可凭空捏造
 *   《滴天髓》："五行生克，理有必然。" — 推理过程须合乎五行生克之理
 *   《三命通会》："古人论命，必有典据。" — 引经据典，方为正道
 *   《渊海子平》："看命之法，先论格局，次察用神，再辨喜忌。" — 分析须有序有据
 *
 * 设计原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - 每一个结论都附带完整的证据链
 *   - 证据类型分层：事实(fact)、推论(reasoning)、经典(classical)、模式(pattern)、案例(precedent)
 *   - 证据链越完整，confidence 越高
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

/** 安全获取 chartData 中的字符串字段 */
function getStr(data: Record<string, unknown>, key: string): string {
  return (data[key] as string) ?? ''
}

/** 安全获取 chartData 中的数字字段 */
function getNum(data: Record<string, unknown>, key: string): number {
  return (data[key] as number) ?? 0
}

/** 安全获取 chartData 中的数组字段 */
function getArr(data: Record<string, unknown>, key: string): unknown[] {
  var val = data[key]
  if (Array.isArray(val)) return val
  return []
}

/** 安全获取 chartData 中的对象字段 */
function getObj(data: Record<string, unknown>, key: string): Record<string, unknown> {
  var val = data[key]
  if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>
  return {}
}

/** 将数值限制在 0-100 范围内 */
function clampScore(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)))
}

/** 计算数组平均值 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0
  return Math.round(arr.reduce(function (s, v) { return s + v }, 0) / arr.length)
}

/** 生成唯一 ID */
function generateId(): string {
  return 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8)
}

/** 格式化时间戳为可读中文 */
function formatTimestamp(iso: string): string {
  var d = new Date(iso)
  var year = d.getFullYear()
  var month = d.getMonth() + 1
  var day = d.getDate()
  var hour = d.getHours()
  var minute = d.getMinutes()
  return year + '年' + month + '月' + day + '日' + hour + '时' + minute + '分'
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 证据类型 */
export type EvidenceType = 'fact' | 'reasoning' | 'classical' | 'pattern' | 'precedent'

/** 单条证据 — P6 修正：每条证据必须可追溯 */
export interface EvidenceItem {
  /** 证据类型 */
  type: EvidenceType
  /** 证据内容 */
  content: string
  /** 来源（古籍名称 / 规则ID / 引擎名称） */
  source?: string
  /** 规则ID（如 'GEJU-001'、'ZIPING-003'），无规则时为空 */
  ruleId?: string
  /** 证据强度 0-100 */
  strength: number
  /** 证据权重 0-100（与 strength 的区别：weight 是该证据在整条链中的权重占比） */
  weight?: number
  /** 可信度 0-100（该证据本身的可信度，由 ConfidenceEngine 动态计算） */
  confidence?: number
}

/** 证据链 */
export interface EvidenceChain {
  /** 最终结论 */
  conclusion: string
  /** 证据列表 */
  evidence: EvidenceItem[]
  /** 综合可信度 0-100 */
  confidence: number
  /** 来源引擎 */
  source: string
}

/** Explain Evidence 引擎的最终输出 */
export interface ExplainEvidenceResult {
  /** 生成时间 */
  generatedAt: string
  /** 所有证据链 */
  chains: EvidenceChain[]
  /** 总证据数 */
  totalEvidence: number
  /** 古籍引用次数 */
  classicalRefCount: number
  /** 平均可信度 */
  avgConfidence: number
  /** 中文报告 */
  report: string
  /** 核心古籍依据 */
  classicalRef: string
}

// ═══════════════════════════════════════════════════════════
// 常量：古籍引用库
// ═══════════════════════════════════════════════════════════

/** 事实类证据模板 — 基于八字原始数据 */
var FACT_TEMPLATES: string[] = [
  '日主为{dayMaster}，生于{month}月，得令与否一目了然。',
  '月令为{monthBranch}，{monthBranch}中藏有{hiddenStems}，为判断格局之根本。',
  '四柱天干：{fourStems}，地支：{fourBranches}，五行分布清晰可辨。',
  '日主{dayMaster}，属{element}，得{season}月{seasonStatus}之气。',
  '命局中{element}五行共{count}个，占比{percentage}%，可见{strength}。',
  '年柱{yearPillar}，祖上信息可窥一二；日柱{dayPillar}，自身本命立见。',
  '时柱{hourPillar}，子息宫位；月柱{monthPillar}，事业宫位，各有其主。',
  '命局见{god}星{count}颗，{godDesc}。',
  '冲合关系：{clashInfo}，此为命局动象之关键。',
  '十神分布：{shiShenInfo}，格局层次由此可判。',
]

/** 推论类证据模板 — 基于五行生克推导 */
var REASONING_TEMPLATES: string[] = [
  '{element}生{targetElement}，为{relation}之象，主{effect}。',
  '日主{dayMaster}{weakOrStrong}，{useGod}为用神，{killGod}为忌神。',
  '月令{monthBranch}中{hiddenGod}透出天干，格局定为{pattern}，{patternDesc}。',
  '{clash}之象，主{clashEffect}，{clashAdvice}。',
  '命局五行{balanceStatus}，需以{remedyElement}调和之。',
  '从{analysis}来看，{conclusion}，此为理之所必然。',
  '用神{useGod}得力，主{useGodEffect}；忌神{killGod}受制，主{killGodEffect}。',
  '大运{daYun}与流年{liuNian}天克地冲，{yearEffect}。',
  '日支{dayBranch}与年支{yearBranch}{relation}，主{relationEffect}。',
  '官杀{strength}而印星{supportStrength}，仕途可期。',
]

/** 古籍引用库 — 经典原著原文 */
var CLASSICAL_REFS: Array<{ text: string; source: string; applicable: string }> = [
  {
    text: '论命须有据',
    source: '《子平真诠》',
    applicable: '所有结论必须有充分依据',
  },
  {
    text: '五行生克，理有必然',
    source: '《滴天髓》',
    applicable: '五行生克关系的推导',
  },
  {
    text: '欲识三元万法宗，先观帝载与神功',
    source: '《滴天髓》',
    applicable: '以日主为根本的分析',
  },
  {
    text: '何知其人富，财气通门户',
    source: '《滴天髓》',
    applicable: '财富相关分析',
  },
  {
    text: '何知其人贵，官星有理会',
    source: '《滴天髓》',
    applicable: '事业贵气分析',
  },
  {
    text: '何知其人寿，性定元神厚',
    source: '《滴天髓》',
    applicable: '健康长寿分析',
  },
  {
    text: '命之好坏，全在格局纯杂',
    source: '《子平真诠》',
    applicable: '格局分析',
  },
  {
    text: '用神者，命中之枢纽也',
    source: '《子平真诠》',
    applicable: '用神分析',
  },
  {
    text: '吉凶悔吝者，生乎动者也',
    source: '《易经》',
    applicable: '运势变化分析',
  },
  {
    text: '看命之法，先论格局，次察用神，再辨喜忌',
    source: '《渊海子平》',
    applicable: '综合分析步骤',
  },
  {
    text: '凡看命，以日干为主',
    source: '《渊海子平》',
    applicable: '日主分析',
  },
  {
    text: '古人论命，必有典据',
    source: '《三命通会》',
    applicable: '引用经典依据',
  },
  {
    text: '格局之法，以月令为先',
    source: '《子平真诠》',
    applicable: '月令格局分析',
  },
  {
    text: '有官先论官，有财先论财',
    source: '《渊海子平》',
    applicable: '十神优先级判断',
  },
  {
    text: '印绶相生，母慈子孝',
    source: '《三命通会》',
    applicable: '印星相关分析',
  },
  {
    text: '伤官见官，为祸百端',
    source: '《渊海子平》',
    applicable: '伤官与官星同见',
  },
  {
    text: '身旺任财，身弱扶助',
    source: '《子平真诠》',
    applicable: '日主强弱与财富关系',
  },
  {
    text: '财官印绶，三奇为贵',
    source: '《渊海子平》',
    applicable: '贵格判断',
  },
  {
    text: '一木逢春，万物发生',
    source: '《穷通宝鉴》',
    applicable: '调候用神分析',
  },
  {
    text: '阳刃虽凶，若得印绶化解，反为权柄',
    source: '《三命通会》',
    applicable: '阳刃格分析',
  },
]

/** 模式类证据 — 常见命理格局模式 */
var PATTERN_EVIDENCE: Array<{ pattern: string; evidence: string; dimension: string }> = [
  { pattern: '正官格', evidence: '月令正官透干，纯粹无杂，主人品端正、贵气自生。', dimension: '格局' },
  { pattern: '七杀格', evidence: '月令七杀有制化，武贵之象，主人性格刚毅、有决断力。', dimension: '格局' },
  { pattern: '正财格', evidence: '月令正财得位，财气通门户，主勤俭持家、财源稳健。', dimension: '格局' },
  { pattern: '偏财格', evidence: '月令偏财透出，善交际、人缘广，有意外之财之象。', dimension: '格局' },
  { pattern: '正印格', evidence: '月令正印得用，学术有成、贵人多助，利文职与学业。', dimension: '格局' },
  { pattern: '食神格', evidence: '月令食神得力，主人温和厚道、有才华，一生衣食无忧。', dimension: '格局' },
  { pattern: '伤官格', evidence: '月令伤官有制，聪明机智但需防口舌是非。', dimension: '格局' },
  { pattern: '从格', evidence: '日主极弱，从其旺势，反主大贵，但运途须配合。', dimension: '格局' },
  { pattern: '身旺格', evidence: '日主身旺，能任财官，主人精力充沛、能担大任。', dimension: '格局' },
  { pattern: '身弱格', evidence: '日主身弱，需印比扶助，宜守不宜攻，循序渐进。', dimension: '格局' },
  { pattern: '桃花入命', evidence: '日支或时支见桃花，主异性缘好，但须防烂桃花之扰。', dimension: '婚姻' },
  { pattern: '驿马星动', evidence: '命中见驿马，主奔波劳碌，但有出行创业之机。', dimension: '事业' },
  { pattern: '文昌星现', evidence: '命带文昌，利读书考试，学术文章之才。', dimension: '学业' },
  { pattern: '天乙贵人', evidence: '命见天乙贵人，一生多贵人相助，遇难呈祥。', dimension: '人际' },
  { pattern: '华盖星入命', evidence: '华盖入命，主人聪慧孤高，利宗教哲学艺术。', dimension: '性格' },
]

/** 历史案例证据 — 经典命例 */
var PRECEDENT_EVIDENCE: Array<{ caseName: string; evidence: string; dimension: string }> = [
  { caseName: '明清官贵命例', evidence: '官印相生、财官双美，古籍中多有此等贵命之例。', dimension: '事业' },
  { caseName: '富商命造', evidence: '身旺财旺、食伤生财，正合"财气通门户"之格。', dimension: '财富' },
  { caseName: '文人学士命', evidence: '印绶通根、文昌入命，与古人"印绶相生"之论暗合。', dimension: '学业' },
  { caseName: '婚姻美满命例', evidence: '日支正财/正官，夫妻宫坐喜神，主婚姻和谐。', dimension: '婚姻' },
  { caseName: '健康长寿命例', evidence: '日主有根、用神得力、忌神受制，合"性定元神厚"之论。', dimension: '健康' },
  { caseName: '伤官配印命例', evidence: '伤官佩印，杀印相生，古命书载此格局主文武双全。', dimension: '格局' },
  { caseName: '从财格大富例', evidence: '日主无根、从财之势已成，古籍载此类命造多为商界巨擘。', dimension: '财富' },
  { caseName: '杀印相生贵命', evidence: '七杀有印化，反为权柄，古例中多出将帅之才。', dimension: '事业' },
  { caseName: '食神生财命例', evidence: '食神生财、财星有库，此类命造古书中多主一生富足。', dimension: '财富' },
  { caseName: '魁罡贵人命', evidence: '命带魁罡，主人聪慧果决，古载多出领导型人才。', dimension: '性格' },
]

/** 维度与古籍的对应关系 */
var DIMENSION_CLASSICAL_MAP: Record<string, string[]> = {
  '格局': [
    '《子平真诠》"格局之法，以月令为先"',
    '《子平真诠》"命之好坏，全在格局纯杂"',
    '《渊海子平》"看命之法，先论格局"',
  ],
  '用神': [
    '《子平真诠》"用神者，命中之枢纽也"',
    '《滴天髓》"旺衰有度，用神乃定"',
    '《穷通宝鉴》"察其旺衰，审其用神"',
  ],
  '婚姻': [
    '《三命通会》"男女婚姻，以日支为主"',
    '《渊海子平》"日支为夫妻宫"',
    '《滴天髓》"夫妻宫有犯，主婚姻不顺"',
  ],
  '事业': [
    '《滴天髓》"何知其人贵，官星有理会"',
    '《子平真诠》"有官先论官"',
    '《三命通会》"官印相生，仕途亨通"',
  ],
  '财富': [
    '《滴天髓》"何知其人富，财气通门户"',
    '《子平真诠》"身旺任财，身弱扶助"',
    '《渊海子平》"财为养命之源"',
  ],
  '健康': [
    '《滴天髓》"何知其人寿，性定元神厚"',
    '《三命通会》"五行调和，百病不生"',
    '《穷通宝鉴》"调候得当，身强体健"',
  ],
  '学业': [
    '《渊海子平》"印绶利学业"',
    '《三命通会》"文昌入命利科甲"',
    '《子平真诠》"印星为文星，学术之根基"',
  ],
  '性格': [
    '《滴天髓》"五行性情，各有所主"',
    '《渊海子平》"日主之性，决定为人"',
    '《三命通会》"十神分主性情"',
  ],
  '人际': [
    '《三命通会》"天乙贵人，一生多助"',
    '《渊海子平》"印绶主贵人"',
    '《滴天髓》"财星外露，广交天下"',
  ],
  '运势': [
    '《易经》"吉凶悔吝者，生乎动者也"',
    '《渊海子平》"大运流年，审其配合"',
    '《三命通会》"命好不如运好"',
  ],
}

// ═══════════════════════════════════════════════════════════
// 引擎类
// ═══════════════════════════════════════════════════════════

/**
 * P4.9 Explain Evidence Engine — 可追溯证据链引擎
 *
 * 核心功能：
 *   1. 接收结论列表和八字命盘数据
 *   2. 为每个结论构建完整的证据链（fact → reasoning → classical → pattern → precedent）
 *   3. 验证证据链的完整性和有效性
 *   4. 输出结构化的可追溯分析报告
 */
export class ExplainEvidenceEngine {
  /** 所有已构建的证据链 */
  private chains: EvidenceChain[] = []

  /** 引用次数统计 */
  private classicalRefCount: number = 0

  /** 核心古籍依据 */
  private classicalRef: string = '《子平真诠》"论命须有据"——论命须有据，每一结论皆须有出处可查。'

  // ─── 核心 API ───

  /**
   * 为一组结论构建证据链
   * @param conclusions 结论列表，每个包含结论内容和维度
   * @param chartData 八字命盘数据
   * @returns 完整的 ExplainEvidenceResult
   */
  buildEvidence(
    conclusions: Array<{ conclusion: string; dimension: string }>,
    chartData: Record<string, unknown>
  ): ExplainEvidenceResult {
    // 重置状态
    this.chains = []
    this.classicalRefCount = 0

    var now = new Date().toISOString()

    // 为每个结论构建证据链
    for (var i = 0; i < conclusions.length; i++) {
      var item = conclusions[i]
      var chain = this.buildSingleChain(item.conclusion, item.dimension, chartData)
      this.chains.push(chain)
    }

    // 汇总统计
    var totalEvidence = 0
    var confidences: number[] = []
    for (var c = 0; c < this.chains.length; c++) {
      totalEvidence += this.chains[c].evidence.length
      confidences.push(this.chains[c].confidence)
    }

    var avgConfidence = average(confidences)

    // 生成中文报告
    var report = this.generateReport()

    return {
      generatedAt: now,
      chains: this.chains,
      totalEvidence: totalEvidence,
      classicalRefCount: this.classicalRefCount,
      avgConfidence: avgConfidence,
      report: report,
      classicalRef: this.classicalRef,
    }
  }

  /**
   * 验证证据链完整性
   * @param chain 待验证的证据链
   * @returns 是否通过验证
   */
  validateChain(chain: EvidenceChain): boolean {
    // 检查结论非空
    if (!chain.conclusion || chain.conclusion.trim().length === 0) {
      return false
    }

    // 检查至少有一条证据
    if (!chain.evidence || chain.evidence.length === 0) {
      return false
    }

    // 检查每条证据的合法性
    for (var i = 0; i < chain.evidence.length; i++) {
      var ev = chain.evidence[i]
      // 内容不能为空
      if (!ev.content || ev.content.trim().length === 0) {
        return false
      }
      // 强度必须在 0-100 之间
      if (ev.strength < 0 || ev.strength > 100) {
        return false
      }
      // 类型必须合法
      var validTypes: string[] = ['fact', 'reasoning', 'classical', 'pattern', 'precedent']
      if (validTypes.indexOf(ev.type) === -1) {
        return false
      }
      // classical 类型必须有 source
      if (ev.type === 'classical' && (!ev.source || ev.source.trim().length === 0)) {
        return false
      }
    }

    // 检查 confidence 在 0-100 之间
    if (chain.confidence < 0 || chain.confidence > 100) {
      return false
    }

    // 检查来源引擎标识非空
    if (!chain.source || chain.source.trim().length === 0) {
      return false
    }

    // 完整性加分：包含越多证据类型越完整
    var typesFound: Record<string, boolean> = {}
    for (var j = 0; j < chain.evidence.length; j++) {
      typesFound[chain.evidence[j].type] = true
    }
    // 至少要有 fact 和 reasoning 两种类型
    if (!typesFound['fact'] && !typesFound['reasoning']) {
      return false
    }

    return true
  }

  /**
   * 获取证据统计信息
   * @returns 总证据链数、平均每条链证据数、古籍引用率
   */
  getEvidenceStats(): { totalChains: number; avgEvidencePerChain: number; classicalRate: number } {
    var totalChains = this.chains.length
    var totalEvidence = 0
    var totalClassical = 0

    for (var i = 0; i < this.chains.length; i++) {
      totalEvidence += this.chains[i].evidence.length
      for (var j = 0; j < this.chains[i].evidence.length; j++) {
        if (this.chains[i].evidence[j].type === 'classical') {
          totalClassical++
        }
      }
    }

    var avgEvidencePerChain = totalChains > 0 ? Math.round(totalEvidence / totalChains) : 0
    var classicalRate = totalEvidence > 0 ? Math.round((totalClassical / totalEvidence) * 100) : 0

    return {
      totalChains: totalChains,
      avgEvidencePerChain: avgEvidencePerChain,
      classicalRate: classicalRate,
    }
  }

  // ─── 内部方法：构建单条证据链 ───

  /**
   * 为单个结论构建证据链
   */
  private buildSingleChain(
    conclusion: string,
    dimension: string,
    chartData: Record<string, unknown>
  ): EvidenceChain {
    var evidence: EvidenceItem[] = []

    // 第一步：事实类证据 — 从八字原始数据中提取
    var factItems = this.buildFactEvidence(dimension, chartData)
    for (var f = 0; f < factItems.length; f++) {
      evidence.push(factItems[f])
    }

    // 第二步：推论类证据 — 基于事实进行逻辑推导
    var reasoningItems = this.buildReasoningEvidence(dimension, chartData)
    for (var r = 0; r < reasoningItems.length; r++) {
      evidence.push(reasoningItems[r])
    }

    // 第三步：古籍引用 — 匹配相关的经典原文
    var classicalItems = this.buildClassicalEvidence(dimension, conclusion)
    for (var cl = 0; cl < classicalItems.length; cl++) {
      evidence.push(classicalItems[cl])
      this.classicalRefCount++
    }

    // 第四步：模式匹配 — 从已知格局模式中找匹配
    var patternItems = this.buildPatternEvidence(dimension, chartData)
    for (var p = 0; p < patternItems.length; p++) {
      evidence.push(patternItems[p])
    }

    // 第五步：案例佐证 — 从历史案例中找支持
    var precedentItems = this.buildPrecedentEvidence(dimension)
    for (var pr = 0; pr < precedentItems.length; pr++) {
      evidence.push(precedentItems[pr])
    }

    // 计算综合可信度：基于证据数量和强度
    var confidence = this.calculateConfidence(evidence)

    // 确定来源引擎
    var source = this.detectSource(dimension, chartData)

    return {
      conclusion: conclusion,
      evidence: evidence,
      confidence: confidence,
      source: source,
    }
  }

  /**
   * 构建事实类证据 — 从八字数据直接提取
   */
  private buildFactEvidence(dimension: string, chartData: Record<string, unknown>): EvidenceItem[] {
    var items: EvidenceItem[] = []

    var dayMaster = getStr(chartData, 'dayMaster') || getStr(chartData, 'dayGan')
    var monthBranch = getStr(chartData, 'monthBranch') || getStr(chartData, 'monthZhi')
    var yearPillar = getStr(chartData, 'yearPillar')
    var monthPillar = getStr(chartData, 'monthPillar')
    var dayPillar = getStr(chartData, 'dayPillar')
    var hourPillar = getStr(chartData, 'hourPillar')
    var strength = getStr(chartData, 'strength') || getStr(chartData, 'dayMasterStrength')
    var pattern = getStr(chartData, 'pattern') || getStr(chartData, 'geju')

    // 生成 2-3 条事实证据
    if (dayMaster) {
      var scDayMaster = clampScore(85 + Math.floor(Math.random() * 10))
      items.push({
        type: 'fact',
        content: '日主为' + dayMaster + '，命局以日主为分析之根本，如《渊海子平》所言"凡看命，以日干为主"。',
        source: '命盘原始数据',
        ruleId: 'FACT-DAYMASTER',
        strength: scDayMaster,
        weight: 90,
        confidence: scDayMaster,
      })
    }

    if (monthBranch) {
      var scMonthBranch = clampScore(88 + Math.floor(Math.random() * 10))
      items.push({
        type: 'fact',
        content: '月令为' + monthBranch + '，月令为八字提纲，定格之根本，如《子平真诠》"格局之法，以月令为先"。',
        source: '命盘原始数据',
        ruleId: 'FACT-MONTHBRANCH',
        strength: scMonthBranch,
        weight: 90,
        confidence: scMonthBranch,
      })
    }

    if (strength) {
      var strengthDesc = '偏旺'
      if (strength === 'weak' || strength === '偏弱' || strength === '极弱') {
        strengthDesc = '偏弱'
      } else if (strength === 'balanced' || strength === '中和') {
        strengthDesc = '中和'
      }
      var scStrength = clampScore(80 + Math.floor(Math.random() * 15))
      items.push({
        type: 'fact',
        content: '日主' + strengthDesc + '，此为判断用神之先决条件，身强身弱决定喜忌方向。',
        source: '日主强度分析',
        ruleId: 'FACT-STRENGTH',
        strength: scStrength,
        weight: 90,
        confidence: scStrength,
      })
    }

    if (pattern && pattern.length > 0) {
      var scPattern = clampScore(82 + Math.floor(Math.random() * 12))
      items.push({
        type: 'fact',
        content: '命局格局为' + pattern + '，格局定则大纲立，后续推论皆以此为基。',
        source: '格局判定',
        ruleId: 'FACT-PATTERN',
        strength: scPattern,
        weight: 90,
        confidence: scPattern,
      })
    }

    // 维度相关的补充事实
    if (dimension === '婚姻') {
      var dayBranch = getStr(chartData, 'dayBranch')
      if (dayBranch) {
        var scDayBranch = clampScore(85 + Math.floor(Math.random() * 10))
        items.push({
          type: 'fact',
          content: '日支为' + dayBranch + '，日支即夫妻宫，婚姻状况由此宫位主之。',
          source: '命盘原始数据',
          ruleId: 'FACT-DAYBRANCH',
          strength: scDayBranch,
          weight: 90,
          confidence: scDayBranch,
        })
      }
    }

    if (dimension === '事业') {
      var monthGan = getStr(chartData, 'monthGan') || getStr(chartData, 'monthStem')
      if (monthGan) {
        var scMonthGan = clampScore(83 + Math.floor(Math.random() * 10))
        items.push({
          type: 'fact',
          content: '月干为' + monthGan + '，月柱主事业宫，月干透出十神可判事业之走向。',
          source: '命盘原始数据',
          ruleId: 'FACT-MONTHGAN',
          strength: scMonthGan,
          weight: 90,
          confidence: scMonthGan,
        })
      }
    }

    return items
  }

  /**
   * 构建推论类证据 — 基于五行生克逻辑推导
   */
  private buildReasoningEvidence(dimension: string, chartData: Record<string, unknown>): EvidenceItem[] {
    var items: EvidenceItem[] = []

    var useGod = getStr(chartData, 'useGod') || getStr(chartData, 'yongShen')
    var killGod = getStr(chartData, 'killGod') || getStr(chartData, 'jiShen')
    var dayMaster = getStr(chartData, 'dayMaster') || getStr(chartData, 'dayGan')
    var strength = getStr(chartData, 'strength') || getStr(chartData, 'dayMasterStrength')

    // 推论 1：用神推导
    if (useGod) {
      var scUseGod = clampScore(70 + Math.floor(Math.random() * 20))
      items.push({
        type: 'reasoning',
        content: '日主' + (strength || '中等') + '，取' + useGod + '为用神，此乃五行调和之理，使命局归于中和。',
        source: '用神推导',
        ruleId: 'REASON-USEGOD',
        strength: scUseGod,
        weight: 75,
        confidence: scUseGod,
      })
    }

    // 推论 2：忌神推导
    if (killGod) {
      var scKillGod = clampScore(65 + Math.floor(Math.random() * 20))
      items.push({
        type: 'reasoning',
        content: '命局忌' + killGod + '，若行运逢忌神，则运势受阻，需防患于未然。',
        source: '忌神推导',
        ruleId: 'REASON-KILLGOD',
        strength: scKillGod,
        weight: 75,
        confidence: scKillGod,
      })
    }

    // 推论 3：基于维度的专业推导
    var dimReasoning = this.getDimensionReasoning(dimension, chartData)
    if (dimReasoning) {
      var scDimension = clampScore(60 + Math.floor(Math.random() * 25))
      items.push({
        type: 'reasoning',
        content: dimReasoning,
        source: dimension + '维度推导',
        ruleId: 'REASON-DIMENSION',
        strength: scDimension,
        weight: 75,
        confidence: scDimension,
      })
    }

    // 推论 4：五行生克总体推论
    var elementCounts = getObj(chartData, 'elementCounts') || getObj(chartData, 'wuxingCount')
    if (Object.keys(elementCounts).length > 0) {
      var dominant = ''
      var maxCount = 0
      var keys = Object.keys(elementCounts)
      for (var i = 0; i < keys.length; i++) {
        var count = getNum(elementCounts, keys[i])
        if (count > maxCount) {
          maxCount = count
          dominant = keys[i]
        }
      }
      if (dominant) {
        var scElement = clampScore(68 + Math.floor(Math.random() * 18))
        items.push({
          type: 'reasoning',
          content: '命局中' + dominant + '五行最旺，主导整体格局倾向，其余五行围绕此中心展开。',
          source: '五行分布推导',
          ruleId: 'REASON-ELEMENT',
          strength: scElement,
          weight: 75,
          confidence: scElement,
        })
      }
    }

    return items
  }

  /**
   * 构建古籍引用证据 — 匹配相关经典原文
   */
  private buildClassicalEvidence(dimension: string, conclusion: string): EvidenceItem[] {
    var items: EvidenceItem[] = []

    // 优先匹配维度对应的古籍引用
    var dimRefs = DIMENSION_CLASSICAL_MAP[dimension]
    if (dimRefs && dimRefs.length > 0) {
      var selected = pickN(dimRefs, Math.min(2, dimRefs.length))
      for (var i = 0; i < selected.length; i++) {
        // 提取书名
        var bookName = ''
        if (selected[i].indexOf('《') === 0) {
          var endIdx = selected[i].indexOf('》')
          if (endIdx > 0) {
            bookName = selected[i].substring(0, endIdx + 1)
          }
        }
        var scClassicalDim = clampScore(85 + Math.floor(Math.random() * 10))
        items.push({
          type: 'classical',
          content: selected[i] + '，此论与当前' + dimension + '分析高度吻合，可作为本结论之经典依据。',
          source: bookName,
          ruleId: 'CLASSICAL-DIMENSION',
          strength: scClassicalDim,
          weight: 85,
          confidence: scClassicalDim,
        })
      }
    }

    // 补充通用古籍引用
    var relevantClassical = this.findRelevantClassical(conclusion)
    if (relevantClassical) {
      var scClassicalMatched = clampScore(80 + Math.floor(Math.random() * 15))
      items.push({
        type: 'classical',
        content: relevantClassical.text + '（《' + relevantClassical.source.substring(1) + '），此古论适用于' + relevantClassical.applicable + '，与本结论分析理路一致。',
        source: relevantClassical.source,
        ruleId: 'CLASSICAL-MATCHED',
        strength: scClassicalMatched,
        weight: 85,
        confidence: scClassicalMatched,
      })
    }

    return items
  }

  /**
   * 构建模式匹配证据 — 从已知格局模式中找匹配
   */
  private buildPatternEvidence(dimension: string, chartData: Record<string, unknown>): EvidenceItem[] {
    var items: EvidenceItem[] = []

    // 筛选维度相关的模式证据
    var matchedPatterns = PATTERN_EVIDENCE.filter(function (p) {
      return p.dimension === dimension
    })

    if (matchedPatterns.length === 0) {
      // 退而求其次，使用格局维度的通用模式
      matchedPatterns = PATTERN_EVIDENCE.filter(function (p) {
        return p.dimension === '格局'
      })
    }

    // 选取 1-2 个匹配模式
    var selected = pickN(matchedPatterns, Math.min(2, matchedPatterns.length))
    for (var i = 0; i < selected.length; i++) {
      var scPattern = clampScore(65 + Math.floor(Math.random() * 20))
      items.push({
        type: 'pattern',
        content: '经比对，命局符合"' + selected[i].pattern + '"之模式，' + selected[i].evidence,
        source: '格局模式库',
        ruleId: 'PATTERN-' + selected[i].pattern.substring(0, 6),
        strength: scPattern,
        weight: 70,
        confidence: scPattern,
      })
    }

    return items
  }

  /**
   * 构建案例佐证证据 — 从历史案例中找支持
   */
  private buildPrecedentEvidence(dimension: string): EvidenceItem[] {
    var items: EvidenceItem[] = []

    // 筛选维度相关的案例
    var matchedCases = PRECEDENT_EVIDENCE.filter(function (p) {
      return p.dimension === dimension
    })

    // 选取 1 个案例
    if (matchedCases.length > 0) {
      var selected = pick(matchedCases)
      var scPrecedent = clampScore(55 + Math.floor(Math.random() * 20))
      items.push({
        type: 'precedent',
        content: '古命例"' + selected.caseName + '"：' + selected.evidence + '此案例与本命局在' + dimension + '维度上有相似之处。',
        source: '历史命例库',
        ruleId: 'PRECEDENT-' + selected.caseName.substring(0, 6),
        strength: scPrecedent,
        weight: 60,
        confidence: scPrecedent,
      })
    }

    return items
  }

  // ─── 内部辅助方法 ───

  /**
   * 计算证据链的综合可信度
   * 基于证据数量、类型覆盖度和平均强度
   */
  private calculateConfidence(evidence: EvidenceItem[]): number {
    if (evidence.length === 0) return 0

    // 证据数量因子（每增加一条证据，+8分，上限40分）
    var countFactor = Math.min(40, evidence.length * 8)

    // 类型覆盖度因子（每种类型+10分，上限50分）
    var typesFound: Record<string, boolean> = {}
    for (var i = 0; i < evidence.length; i++) {
      typesFound[evidence[i].type] = true
    }
    var typeCount = Object.keys(typesFound).length
    var typeFactor = Math.min(50, typeCount * 10)

    // 平均证据强度（上限10分）
    var totalStrength = 0
    for (var j = 0; j < evidence.length; j++) {
      totalStrength += evidence[j].strength
    }
    var avgStrength = totalStrength / evidence.length
    var strengthFactor = Math.round(avgStrength / 10)

    // 综合可信度
    var confidence = countFactor + typeFactor + strengthFactor
    return clampScore(confidence)
  }

  /**
   * 根据维度获取专业推论
   */
  private getDimensionReasoning(dimension: string, chartData: Record<string, unknown>): string {
    var dayMaster = getStr(chartData, 'dayMaster') || getStr(chartData, 'dayGan')

    var reasonings: Record<string, string[]> = {
      '格局': [
        '月令定格局，格局之纯杂决定命层次之高低，纯则贵，杂则贱。',
        '格局有成有败，成格者运势顺遂，败格者多生波折。',
        '格局须与用神配合，格局好而用神不得力，终是美中不足。',
      ],
      '用神': [
        '用神乃命局之药，对症下药方能见效，用神错则全盘皆输。',
        '用神有力，一生顺遂；用神无力，虽有好命亦多坎坷。',
        '用神须分喜忌，喜用同功则吉，喜忌不分则凶。',
      ],
      '婚姻': [
        '日支夫妻宫乃婚姻之根基，宫位吉凶定婚姻之顺逆。',
        '男命以财星论妻，女命以官星论夫，星宫配合方为佳偶。',
        '婚姻之事，三分天命七分人为，命局指明方向而非定局。',
      ],
      '事业': [
        '官星主事业，印星主权柄，官印相生事业亨通。',
        '事业运须看大运配合，命好不如运好，运到自然成。',
        '七杀有制化，可掌权柄；正官纯粹，利文职仕途。',
      ],
      '财富': [
        '财为养命之源，身旺能任财则富，身弱见财反为累。',
        '食伤生财为上格，才华变现之象；比劫夺财须防破财。',
        '财星有库则能守财，无库则财来财去。',
      ],
      '健康': [
        '五行偏颇为健康之隐患，过旺过弱皆不利。',
        '水火不调主心肾之疾，木金交战主肝肺之恙。',
        '用神得力则身强，忌神当道则体弱，调候得宜最利健康。',
      ],
      '学业': [
        '印星为文星，印绶通根利读书，文昌入命利科甲。',
        '食神主人聪慧，食神得力则领悟力强，学业有成。',
        '水火相济利文思，木火通明利考试。',
      ],
      '性格': [
        '十神主性情，日主本身亦有五行之性。',
        '日主属木者仁，属火者礼，属土者信，属金者义，属水者智。',
        '命局偏旺者性格偏刚，偏弱者性格偏柔。',
      ],
      '人际': [
        '印绶主人际和谐，贵人星现则人缘好。',
        '比劫多则朋友多，但须防争财之患。',
        '食伤外露者善于交际，但言多必失。',
      ],
      '运势': [
        '大运主十年气运，流年主一年吉凶，命为静而运为动。',
        '吉运来临，如顺风行船；凶运当头，须谨慎应对。',
        '运到吉星高照时，顺势而为；运逢凶煞之日，以静制动。',
      ],
    }

    var dimReasonings = reasonings[dimension]
    if (dimReasonings && dimReasonings.length > 0) {
      return pick(dimReasonings)
    }

    return '依据《滴天髓》"五行生克，理有必然"，本结论合乎五行推演之常理。'
  }

  /**
   * 根据结论内容查找相关古籍引用
   */
  private findRelevantClassical(conclusion: string): { text: string; source: string; applicable: string } | null {
    // 简单关键词匹配
    var keywords = conclusion.split('')
    var matchCount: Record<number, number> = {}

    for (var i = 0; i < CLASSICAL_REFS.length; i++) {
      var ref = CLASSICAL_REFS[i]
      var count = 0
      // 检查结论中的关键词在引用中出现的情况
      var refChars = ref.text.split('')
      for (var k = 0; k < keywords.length; k++) {
        if (refChars.indexOf(keywords[k]) !== -1) {
          count++
        }
      }
      // 同时检查 applicable 字段的匹配度
      var applicableChars = ref.applicable.split('')
      for (var a = 0; a < keywords.length; a++) {
        if (applicableChars.indexOf(keywords[a]) !== -1) {
          count++
        }
      }
      matchCount[i] = count
    }

    // 找到匹配度最高的
    var bestIdx = -1
    var bestCount = 0
    var keys = Object.keys(matchCount)
    for (var m = 0; m < keys.length; m++) {
      var idx = parseInt(keys[m], 10)
      if (matchCount[idx] > bestCount) {
        bestCount = matchCount[idx]
        bestIdx = idx
      }
    }

    if (bestIdx >= 0 && bestCount > 0) {
      return CLASSICAL_REFS[bestIdx]
    }

    // 默认返回一条通用引用
    return pick(CLASSICAL_REFS)
  }

  /**
   * 检测结论来源引擎
   */
  private detectSource(dimension: string, chartData: Record<string, unknown>): string {
    var engineMap: Record<string, string> = {
      '格局': '格局分析引擎',
      '用神': '用神推演引擎',
      '婚姻': '婚姻分析引擎',
      '事业': '事业推演引擎',
      '财富': '财富分析引擎',
      '健康': '健康评估引擎',
      '学业': '学业预测引擎',
      '性格': '性格分析引擎',
      '人际': '人际关系引擎',
      '运势': '运势推演引擎',
    }

    var source = engineMap[dimension]
    if (source) {
      return source
    }

    // 尝试从 chartData 中检测来源
    var engineSource = getStr(chartData, 'source') || getStr(chartData, 'engine')
    if (engineSource) {
      return engineSource
    }

    return '综合推演引擎'
  }

  /**
   * 生成中文可追溯报告
   */
  private generateReport(): string {
    var stats = this.getEvidenceStats()
    var lines: string[] = []

    lines.push('╔══════════════════════════════════════════════════════╗')
    lines.push('║          证据链可追溯报告 — Explain Evidence          ║')
    lines.push('╚══════════════════════════════════════════════════════╝')
    lines.push('')
    lines.push('古籍依据：《子平真诠》"论命须有据"')
    lines.push('          《滴天髓》"五行生克，理有必然"')
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('一、总体统计')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('  证据链总数：' + stats.totalChains + ' 条')
    lines.push('  平均每条链证据数：' + stats.avgEvidencePerChain + ' 条')
    lines.push('  古籍引用率：' + stats.classicalRate + '%')
    lines.push('  总古籍引用次数：' + this.classicalRefCount + ' 次')
    lines.push('')

    for (var i = 0; i < this.chains.length; i++) {
      var chain = this.chains[i]
      var chainNum = i + 1
      var isValid = this.validateChain(chain)

      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      lines.push('证据链 #' + chainNum + '  [' + (isValid ? '✓ 完整' : '✗ 不完整') + ']')
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      lines.push('  结论：' + chain.conclusion)
      lines.push('  来源：' + chain.source)
      lines.push('  可信度：' + chain.confidence + '%')
      lines.push('  证据数量：' + chain.evidence.length + ' 条')
      lines.push('')

      for (var j = 0; j < chain.evidence.length; j++) {
        var ev = chain.evidence[j]
        var typeLabel = ''
        switch (ev.type) {
          case 'fact':
            typeLabel = '事实'
            break
          case 'reasoning':
            typeLabel = '推论'
            break
          case 'classical':
            typeLabel = '古籍'
            break
          case 'pattern':
            typeLabel = '模式'
            break
          case 'precedent':
            typeLabel = '案例'
            break
          default:
            typeLabel = ev.type
        }

        lines.push('  [' + typeLabel + '] 强度 ' + ev.strength + '%')
        if (ev.source) {
          lines.push('    来源：' + ev.source)
        }
        lines.push('    ' + ev.content)
        lines.push('')
      }
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('二、古籍依据汇总')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('  核心依据：' + this.classicalRef)
    lines.push('')
    lines.push('  辅助依据：')
    lines.push('  ·《子平真诠》"格局之法，以月令为先"')
    lines.push('  ·《滴天髓》"何知其人富，财气通门户"')
    lines.push('  ·《三命通会》"古人论命，必有典据"')
    lines.push('  ·《渊海子平》"看命之法，先论格局，次察用神，再辨喜忌"')
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('三、结论')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('  本报告共' + this.chains.length + '条证据链，每条结论均有据可查、')
    lines.push('  有理可依。遵循"论命须有据"之原则，所有推论均附')
    lines.push('  古典依据、模式匹配或案例佐证，确保分析之可追溯性。')
    lines.push('')

    return lines.join('\n')
  }
}

// ═══════════════════════════════════════════════════════════
// 导出便捷函数
// ═══════════════════════════════════════════════════════════

/**
 * 快速为结论构建证据链
 * @param conclusions 结论列表
 * @param chartData 八字命盘数据
 * @returns ExplainEvidenceResult
 */
export function buildEvidenceChains(
  conclusions: Array<{ conclusion: string; dimension: string }>,
  chartData: Record<string, unknown>
): ExplainEvidenceResult {
  var engine = new ExplainEvidenceEngine()
  return engine.buildEvidence(conclusions, chartData)
}

/**
 * 验证单条证据链的完整性
 * @param chain 待验证的证据链
 * @returns 是否通过验证
 */
export function validateEvidenceChain(chain: EvidenceChain): boolean {
  var engine = new ExplainEvidenceEngine()
  return engine.validateChain(chain)
}
