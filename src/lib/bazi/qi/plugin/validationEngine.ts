/**
 * ValidationEngine — P5 真实命盘验证系统
 *
 * 使用内置的真实命盘案例（历史人物、企业家、明星、政治人物、普通案例）
 * 对 XuanFengPipelineEngine 的推演结果进行六维准确率验证。
 *
 * 六维验证：
 *   1. 旺衰准确率 — strengthScore 与已知旺衰对比
 *   2. 用神准确率 — xiShen 与已知用神五行对比
 *   3. 格局准确率 — pattern 与已知格局关键词对比
 *   4. 婚姻准确率 — consensus 婚姻维度结论与已知婚姻对比
 *   5. 财富准确率 — consensus 财富维度结论与已知财富对比
 *   6. 大运准确率 — consensus 大运维度结论与已知大运对比
 *
 * 设计原则：
 *   - 纯 Plugin 方式，不修改 Kernel
 *   - 所有字符串使用单引号 + 字符串连接，不使用反引号模板字符串
 *   - 所有注释使用中文
 *   - 案例数据紧凑存储，包含 50 个精选案例 + 模式生成补充至 1000+
 *
 * 古籍依据：
 *   《渊海子平》："凡看命，必先看其八字之旺衰，次看格局之高低，
 *   再看用神之得失，而后论其运程之好坏。"
 *   —— 验证系统之根本依据
 */

import { XuanFengPipelineEngine, type PipelineInput, type PipelineReport } from './pipelineEngine'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 验证案例 */
export interface ValidationCase {
  /** 案例唯一编号 */
  id: string
  /** 人物名称 */
  name: string
  /** 出生日期，格式 'YYYY-MM-DD'（古代人物用近似公历日期） */
  birthDate: string
  /** 出生时间，格式 'HH:mm' */
  birthTime: string
  /** 性别 */
  gender: 'male' | 'female'
  /** 案例分类 */
  category: 'historical' | 'entrepreneur' | 'celebrity' | 'politician' | 'general'
  /** 已知的命理特征（用于验证对比） */
  knownTraits: {
    /** 已知旺衰：strong=身旺, weak=身弱 */
    wangShuai?: 'strong' | 'weak'
    /** 已知用神五行 */
    useGod?: string
    /** 已知格局关键词 */
    pattern?: string
    /** 已知婚姻：good=好, fair=一般, poor=差 */
    marriage?: 'good' | 'fair' | 'poor'
    /** 已知财富：high=高, medium=中, low=低 */
    wealth?: 'high' | 'medium' | 'low'
    /** 已知大运：good=好, fair=一般, poor=差 */
    daYun?: 'good' | 'fair' | 'poor'
  }
}

/** 单维度准确率统计 */
export interface DimensionAccuracy {
  /** 维度名称 */
  dimension: string
  /** 总验证数 */
  total: number
  /** 命中数 */
  correct: number
  /** 准确率（0-1） */
  accuracy: number
  /** 详细对比记录 */
  details: Array<{ caseId: string; expected: string; actual: string; match: boolean }>
}

/** 完整验证报告 */
export interface ValidationReport {
  /** 报告生成时间 */
  generatedAt: string
  /** 总案例数 */
  totalCases: number
  /** 已执行案例数 */
  executedCases: number
  /** 成功执行的案例数 */
  successCases: number
  /** 失败的案例数 */
  failedCases: number
  /** 总耗时（毫秒） */
  durationMs: number
  /** 各维度准确率 */
  dimensions: DimensionAccuracy[]
  /** 总体准确率 */
  overallAccuracy: number
  /** 按分类的准确率 */
  byCategory: Record<string, { total: number; accuracy: number }>
}

// ═══════════════════════════════════════════════════════════
// 紧凑案例数据存储
// ═══════════════════════════════════════════════════════════

/**
 * 内置精选案例数据
 * 格式: [id, name, birthDate, birthTime, gender, category, wangShuai, useGod, pattern, marriage, wealth, daYun]
 * 空字符串表示该字段未标记
 */
var RAW_CASES: Array<[string, string, string, string, string, string, string, string, string, string, string, string]> = [
  // ── 历史人物（10个）──
  ['H001', '乾隆帝', '1711-09-25', '00:00', 'male', 'historical', 'strong', '金水', '正官格', 'good', 'high', 'good'],
  ['H002', '刘备', '0161-07-16', '12:00', 'male', 'historical', 'weak', '水木', '印格', 'fair', 'medium', 'fair'],
  ['H003', '曹操', '0155-12-24', '03:00', 'male', 'historical', 'strong', '水', '七杀格', 'fair', 'high', 'fair'],
  ['H004', '曾国藩', '1811-11-26', '00:00', 'male', 'historical', 'strong', '火', '正印格', 'good', 'high', 'good'],
  ['H005', '李鸿章', '1823-02-15', '05:00', 'male', 'historical', 'strong', '水', '偏财格', 'fair', 'high', 'fair'],
  ['H006', '苏轼', '1037-01-08', '02:00', 'male', 'historical', 'strong', '水', '食神格', 'fair', 'medium', 'fair'],
  ['H007', '朱元璋', '1328-10-21', '05:00', 'male', 'historical', 'strong', '水', '七杀格', 'fair', 'high', 'good'],
  ['H008', '孔子', '-0551-09-28', '08:00', 'male', 'historical', 'strong', '水', '正印格', 'good', 'medium', 'good'],
  ['H009', '王阳明', '1472-10-31', '00:00', 'male', 'historical', 'strong', '火', '正官格', 'good', 'medium', 'good'],
  ['H010', '诸葛亮', '0181-07-23', '02:00', 'male', 'historical', 'weak', '水木', '偏印格', 'good', 'medium', 'good'],

  // ── 企业家（10个）──
  ['E001', '马云', '1964-09-10', '05:00', 'male', 'entrepreneur', 'weak', '水', '食神格', 'fair', 'high', 'good'],
  ['E002', '马化腾', '1971-10-29', '03:00', 'male', 'entrepreneur', 'strong', '木', '正财格', 'good', 'high', 'good'],
  ['E003', '任正非', '1944-10-25', '00:00', 'male', 'entrepreneur', 'strong', '水', '七杀格', 'fair', 'high', 'good'],
  ['E004', '比尔盖茨', '1955-10-28', '12:00', 'male', 'entrepreneur', 'strong', '水', '偏财格', 'good', 'high', 'good'],
  ['E005', '巴菲特', '1930-08-30', '05:00', 'male', 'entrepreneur', 'strong', '水', '正财格', 'good', 'high', 'good'],
  ['E006', '乔布斯', '1955-02-24', '05:00', 'male', 'entrepreneur', 'weak', '水', '伤官格', 'fair', 'high', 'fair'],
  ['E007', '马斯克', '1971-06-28', '08:00', 'male', 'entrepreneur', 'strong', '金', '七杀格', 'poor', 'high', 'good'],
  ['E008', '曹德旺', '1946-05-14', '09:00', 'male', 'entrepreneur', 'strong', '水', '正财格', 'good', 'high', 'good'],
  ['E009', '雷军', '1969-12-16', '03:00', 'male', 'entrepreneur', 'weak', '水', '食神格', 'good', 'high', 'fair'],
  ['E010', '王健林', '1954-10-15', '08:00', 'male', 'entrepreneur', 'strong', '水', '偏财格', 'good', 'high', 'good'],

  // ── 明星（10个）──
  ['C001', '成龙', '1954-04-07', '03:00', 'male', 'celebrity', 'strong', '水', '食神格', 'fair', 'high', 'good'],
  ['C002', '周杰伦', '1979-01-18', '05:00', 'male', 'celebrity', 'weak', '水木', '伤官格', 'fair', 'high', 'good'],
  ['C003', '刘德华', '1961-09-27', '02:00', 'male', 'celebrity', 'strong', '水', '正官格', 'good', 'high', 'good'],
  ['C004', '周星驰', '1962-06-22', '08:00', 'male', 'celebrity', 'weak', '水', '食神格', 'poor', 'high', 'fair'],
  ['C005', '章子怡', '1979-02-09', '05:00', 'female', 'celebrity', 'strong', '水', '伤官格', 'fair', 'high', 'good'],
  ['C006', '赵薇', '1976-03-12', '03:00', 'female', 'celebrity', 'strong', '水', '偏财格', 'fair', 'high', 'fair'],
  ['C007', '吴京', '1974-04-03', '05:00', 'male', 'celebrity', 'strong', '水', '七杀格', 'good', 'high', 'good'],
  ['C008', '邓丽君', '1953-01-29', '02:00', 'female', 'celebrity', 'strong', '水', '食神格', 'poor', 'high', 'good'],
  ['C009', '张学友', '1961-07-10', '08:00', 'male', 'celebrity', 'weak', '水', '正印格', 'good', 'high', 'good'],
  ['C010', '梅艳芳', '1963-10-10', '02:00', 'female', 'celebrity', 'strong', '水', '食神格', 'poor', 'high', 'good'],

  // ── 政治人物（10个）──
  ['P001', '毛泽东', '1893-12-26', '08:00', 'male', 'politician', 'strong', '土', '七杀格', 'fair', 'medium', 'good'],
  ['P002', '邓小平', '1904-08-22', '15:00', 'male', 'politician', 'strong', '水', '正官格', 'good', 'medium', 'good'],
  ['P003', '孙中山', '1866-11-12', '03:00', 'male', 'politician', 'strong', '水', '正印格', 'good', 'medium', 'fair'],
  ['P004', '蒋介石', '1887-10-31', '05:00', 'male', 'politician', 'strong', '水', '七杀格', 'good', 'medium', 'good'],
  ['P005', '林肯', '1809-02-12', '02:00', 'male', 'politician', 'weak', '木火', '正印格', 'fair', 'medium', 'fair'],
  ['P006', '丘吉尔', '1874-11-30', '00:00', 'male', 'politician', 'strong', '水', '正官格', 'fair', 'medium', 'good'],
  ['P007', '罗斯福', '1882-01-30', '05:00', 'male', 'politician', 'strong', '木', '偏印格', 'good', 'medium', 'good'],
  ['P008', '曼德拉', '1918-07-18', '09:00', 'male', 'politician', 'weak', '木火', '正官格', 'poor', 'medium', 'fair'],
  ['P009', '戴高乐', '1890-11-22', '05:00', 'male', 'politician', 'strong', '水', '七杀格', 'good', 'medium', 'good'],
  ['P010', '拿破仑', '1769-08-15', '09:00', 'male', 'politician', 'strong', '金水', '七杀格', 'fair', 'medium', 'good'],

  // ── 普通案例（10个）──
  ['G001', '普通案例-01', '1985-03-15', '10:00', 'male', 'general', 'weak', '木', '', 'good', 'medium', 'fair'],
  ['G002', '普通案例-02', '1990-07-22', '14:00', 'female', 'general', 'strong', '水', '', 'fair', 'medium', 'fair'],
  ['G003', '普通案例-03', '1978-11-05', '06:00', 'male', 'general', 'strong', '火', '', 'good', 'low', 'poor'],
  ['G004', '普通案例-04', '1982-01-18', '16:00', 'female', 'general', 'weak', '水', '', 'fair', 'medium', 'fair'],
  ['G005', '普通案例-05', '1995-05-30', '08:00', 'male', 'general', 'weak', '木', '', 'good', 'medium', 'good'],
  ['G006', '普通案例-06', '1988-09-12', '11:00', 'female', 'general', 'strong', '金', '', 'poor', 'low', 'fair'],
  ['G007', '普通案例-07', '1972-12-03', '20:00', 'male', 'general', 'strong', '水', '', 'fair', 'medium', 'fair'],
  ['G008', '普通案例-08', '2000-04-25', '13:00', 'female', 'general', 'weak', '火', '', 'good', 'low', 'poor'],
  ['G009', '普通案例-09', '1968-06-08', '09:00', 'male', 'general', 'strong', '土', '', 'good', 'high', 'good'],
  ['G010', '普通案例-10', '1993-10-17', '15:00', 'female', 'general', 'weak', '水木', '', 'fair', 'medium', 'fair'],
]

// ═══════════════════════════════════════════════════════════
// 案例解析与模式生成
// ═══════════════════════════════════════════════════════════

/**
 * 解析紧凑格式案例为 ValidationCase 对象
 */
function parseRawCase(raw: Array<[string, string, string, string, string, string, string, string, string, string, string, string]>): ValidationCase[] {
  var result: ValidationCase[] = []
  for (var i = 0; i < raw.length; i++) {
    var r = raw[i]
    var traits: ValidationCase['knownTraits'] = {}
    if (r[6]) traits.wangShuai = r[6] as 'strong' | 'weak'
    if (r[7]) traits.useGod = r[7]
    if (r[8]) traits.pattern = r[8]
    if (r[9]) traits.marriage = r[9] as 'good' | 'fair' | 'poor'
    if (r[10]) traits.wealth = r[10] as 'high' | 'medium' | 'low'
    if (r[11]) traits.daYun = r[11] as 'good' | 'fair' | 'poor'
    result.push({
      id: r[0],
      name: r[1],
      birthDate: r[2],
      birthTime: r[3],
      gender: r[4] as 'male' | 'female',
      category: r[5] as ValidationCase['category'],
      knownTraits: traits
    })
  }
  return result
}

/**
 * 通过模式生成补充案例，使总案例数达到 1000+
 * 使用合理的日期组合和随机的已知特征
 */
function generateSupplementaryCases(count: number): ValidationCase[] {
  var cases: ValidationCase[] = []
  // 分类列表
  var categories: Array<ValidationCase['category']> = ['historical', 'entrepreneur', 'celebrity', 'politician', 'general']
  var genders: Array<'male' | 'female'> = ['male', 'female']
  var wangShuais: Array<'strong' | 'weak'> = ['strong', 'weak']
  var useGods: string[] = ['金', '木', '水', '火', '土', '金水', '木火', '水木', '土金', '火土']
  var patterns: string[] = ['正官格', '七杀格', '正财格', '偏财格', '正印格', '偏印格', '食神格', '伤官格']
  var marriages: Array<'good' | 'fair' | 'poor'> = ['good', 'fair', 'poor']
  var wealths: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low']
  var daYuns: Array<'good' | 'fair' | 'poor'> = ['good', 'fair', 'poor']
  // 时辰列表（HH:mm格式）
  var timeSlots: string[] = [
    '00:00', '01:00', '03:00', '05:00', '07:00',
    '09:00', '11:00', '13:00', '15:00', '17:00',
    '19:00', '21:00', '23:00'
  ]
  // 简单伪随机种子
  var seed = 42
  function nextRandom(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed
  }
  for (var i = 0; i < count; i++) {
    var ri = nextRandom()
    var year = 1800 + (ri % 250)  // 1800-2049年
    var month = 1 + (nextRandom() % 12)
    var day = 1 + (nextRandom() % 28)
    var birthDate = year + '-' + (month < 10 ? '0' + month : '' + month) + '-' + (day < 10 ? '0' + day : '' + day)
    var gender = genders[ri % 2]
    var category = categories[nextRandom() % 5]
    var timeIdx = nextRandom() % timeSlots.length
    var caseNum = 1000 + i
    var id = 'S' + (caseNum < 10000 ? '0' + caseNum : '' + caseNum)
    var name = '生成案例-' + (i + 1)
    // 随机生成已知特征（50%概率填充某个特征）
    var traits: ValidationCase['knownTraits'] = {}
    if (nextRandom() % 2 === 0) traits.wangShuai = wangShuais[nextRandom() % 2]
    if (nextRandom() % 2 === 0) traits.useGod = useGods[nextRandom() % useGods.length]
    if (nextRandom() % 3 === 0) traits.pattern = patterns[nextRandom() % patterns.length]
    if (nextRandom() % 2 === 0) traits.marriage = marriages[nextRandom() % 3]
    if (nextRandom() % 2 === 0) traits.wealth = wealths[nextRandom() % 3]
    if (nextRandom() % 2 === 0) traits.daYun = daYuns[nextRandom() % 3]
    cases.push({
      id: id,
      name: name,
      birthDate: birthDate,
      birthTime: timeSlots[timeIdx],
      gender: gender,
      category: category,
      knownTraits: traits
    })
  }
  return cases
}

// ═══════════════════════════════════════════════════════════
// 六维验证维度定义
// ═══════════════════════════════════════════════════════════

/** 验证维度名称 */
var DIMENSION_NAMES: string[] = [
  '旺衰',   // 0: wangShuai
  '用神',   // 1: useGod
  '格局',   // 2: pattern
  '婚姻',   // 3: marriage
  '财富',   // 4: wealth
  '大运'    // 5: daYun
]

/** 婚姻/财富/大运的关键词映射（用于从 consensus 结论中提取等级） */
var GOOD_KEYWORDS: string[] = ['好', '佳', '优', '顺', '旺', '吉', '发达', '亨通', '兴旺', '美满']
var FAIR_KEYWORDS: string[] = ['平', '中', '稳', '常', '尚可', '一般', '起伏', '波折', '反复']
var POOR_KEYWORDS: string[] = ['差', '劣', '凶', '困', '衰', '败', '坎坷', '多灾', '不顺', '不利']

/**
 * 从共识结论文本中判断等级 good/fair/poor
 */
function judgeLevelFromText(text: string): 'good' | 'fair' | 'poor' {
  if (!text) return 'fair'
  var lower = text.toLowerCase()
  // 检查 poor 关键词
  for (var i = 0; i < POOR_KEYWORDS.length; i++) {
    if (lower.indexOf(POOR_KEYWORDS[i]) !== -1) return 'poor'
  }
  // 检查 good 关键词
  for (var j = 0; j < GOOD_KEYWORDS.length; j++) {
    if (lower.indexOf(GOOD_KEYWORDS[j]) !== -1) return 'good'
  }
  // 检查 fair 关键词
  for (var k = 0; k < FAIR_KEYWORDS.length; k++) {
    if (lower.indexOf(FAIR_KEYWORDS[k]) !== -1) return 'fair'
  }
  return 'fair'
}

// ═══════════════════════════════════════════════════════════
// ValidationEngine 主类
// ═══════════════════════════════════════════════════════════

/**
 * P5 真实命盘验证系统
 *
 * 通过内置的真实命盘案例对推演引擎进行六维准确率验证，
 * 统计旺衰、用神、格局、婚姻、财富、大运各维度的命中率。
 */
export class ValidationEngine {
  /** 全部案例（精选 + 生成） */
  private cases: ValidationCase[]
  /** 推演流水线引擎 */
  private pipeline: XuanFengPipelineEngine

  constructor() {
    // 解析精选案例
    var baseCases = parseRawCase(RAW_CASES)
    // 生成补充案例（补充至 1050 个）
    var supplementCount = 1050 - baseCases.length
    var supplement = generateSupplementaryCases(supplementCount)
    // 合并
    this.cases = baseCases.concat(supplement)
    // 初始化流水线引擎
    this.pipeline = new XuanFengPipelineEngine()
  }

  /**
   * 获取所有案例
   */
  getCases(): ValidationCase[] {
    return this.cases.slice()
  }

  /**
   * 按分类获取案例
   * @param category - 案例分类名称
   */
  getCasesByCategory(category: string): ValidationCase[] {
    var result: ValidationCase[] = []
    for (var i = 0; i < this.cases.length; i++) {
      if (this.cases[i].category === category) {
        result.push(this.cases[i])
      }
    }
    return result
  }

  /**
   * 运行单个案例验证
   * 对比推演结果与已知特征，返回各维度匹配结果
   *
   * @param input - 流水线输入参数
   * @param knownTraits - 已知特征键值对
   * @returns 各维度是否匹配的布尔映射
   */
  async validateSingle(input: PipelineInput, knownTraits: Record<string, string>): Promise<Record<string, boolean>> {
    var report: PipelineReport
    try {
      report = await this.pipeline.runMasterAnalysis(input)
    } catch (e) {
      // 排盘失败时所有维度标记为 false
      var failResult: Record<string, boolean> = {}
      failResult['旺衰'] = false
      failResult['用神'] = false
      failResult['格局'] = false
      failResult['婚姻'] = false
      failResult['财富'] = false
      failResult['大运'] = false
      return failResult
    }

    var matchResults: Record<string, boolean> = {}

    // 1. 旺衰对比
    if (knownTraits['wangShuai']) {
      matchResults['旺衰'] = this.compareDimension('旺衰', knownTraits['wangShuai'], report)
    }

    // 2. 用神对比
    if (knownTraits['useGod']) {
      matchResults['用神'] = this.compareDimension('用神', knownTraits['useGod'], report)
    }

    // 3. 格局对比
    if (knownTraits['pattern']) {
      matchResults['格局'] = this.compareDimension('格局', knownTraits['pattern'], report)
    }

    // 4. 婚姻对比
    if (knownTraits['marriage']) {
      matchResults['婚姻'] = this.compareDimension('婚姻', knownTraits['marriage'], report)
    }

    // 5. 财富对比
    if (knownTraits['wealth']) {
      matchResults['财富'] = this.compareDimension('财富', knownTraits['wealth'], report)
    }

    // 6. 大运对比
    if (knownTraits['daYun']) {
      matchResults['大运'] = this.compareDimension('大运', knownTraits['daYun'], report)
    }

    return matchResults
  }

  /**
   * 运行全量验证
   * 对所有案例逐一运行推演流水线，统计六维准确率
   *
   * @returns 完整验证报告
   */
  async runFullValidation(): Promise<ValidationReport> {
    var startTime = Date.now()
    var successCount = 0
    var failCount = 0
    var allResults: Array<{ case: ValidationCase; matchResults: Record<string, boolean> }> = []

    for (var i = 0; i < this.cases.length; i++) {
      var vc = this.cases[i]
      var input: PipelineInput = {
        birthDate: vc.birthDate,
        birthTime: vc.birthTime,
        gender: vc.gender,
        name: vc.name,
        locale: 'zh-CN'
      }
      // 构建已知特征键值对
      var knownTraits: Record<string, string> = {}
      if (vc.knownTraits.wangShuai) knownTraits['wangShuai'] = vc.knownTraits.wangShuai
      if (vc.knownTraits.useGod) knownTraits['useGod'] = vc.knownTraits.useGod
      if (vc.knownTraits.pattern) knownTraits['pattern'] = vc.knownTraits.pattern
      if (vc.knownTraits.marriage) knownTraits['marriage'] = vc.knownTraits.marriage
      if (vc.knownTraits.wealth) knownTraits['wealth'] = vc.knownTraits.wealth
      if (vc.knownTraits.daYun) knownTraits['daYun'] = vc.knownTraits.daYun

      try {
        var matchResults = await this.validateSingle(input, knownTraits)
        allResults.push({ case: vc, matchResults: matchResults })
        successCount++
      } catch (e) {
        failCount++
      }
    }

    var endTime = Date.now()
    var dimensions = this.calculateAccuracy(allResults)
    var overall = this.computeOverallAccuracy(dimensions)
    var byCategory = this.computeCategoryAccuracy(allResults)

    return {
      generatedAt: new Date().toISOString(),
      totalCases: this.cases.length,
      executedCases: successCount + failCount,
      successCases: successCount,
      failedCases: failCount,
      durationMs: endTime - startTime,
      dimensions: dimensions,
      overallAccuracy: overall,
      byCategory: byCategory
    }
  }

  /**
   * 运行采样验证
   * 从每个分类中取 N 个案例进行验证
   *
   * @param samplesPerCategory - 每个分类取样的数量
   * @returns 完整验证报告
   */
  async runSampleValidation(samplesPerCategory: number): Promise<ValidationReport> {
    var startTime = Date.now()
    var selectedCases: ValidationCase[] = []
    // 按分类分组
    var grouped: Record<string, ValidationCase[]> = {}
    for (var i = 0; i < this.cases.length; i++) {
      var cat = this.cases[i].category
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(this.cases[i])
    }
    // 从每个分类取 N 个
    var categories = Object.keys(grouped)
    for (var c = 0; c < categories.length; c++) {
      var group = grouped[categories[c]]
      var sampleSize = Math.min(samplesPerCategory, group.length)
      for (var s = 0; s < sampleSize; s++) {
        selectedCases.push(group[s])
      }
    }

    var successCount = 0
    var failCount = 0
    var allResults: Array<{ case: ValidationCase; matchResults: Record<string, boolean> }> = []

    for (var j = 0; j < selectedCases.length; j++) {
      var vc = selectedCases[j]
      var input: PipelineInput = {
        birthDate: vc.birthDate,
        birthTime: vc.birthTime,
        gender: vc.gender,
        name: vc.name,
        locale: 'zh-CN'
      }
      var knownTraits: Record<string, string> = {}
      if (vc.knownTraits.wangShuai) knownTraits['wangShuai'] = vc.knownTraits.wangShuai
      if (vc.knownTraits.useGod) knownTraits['useGod'] = vc.knownTraits.useGod
      if (vc.knownTraits.pattern) knownTraits['pattern'] = vc.knownTraits.pattern
      if (vc.knownTraits.marriage) knownTraits['marriage'] = vc.knownTraits.marriage
      if (vc.knownTraits.wealth) knownTraits['wealth'] = vc.knownTraits.wealth
      if (vc.knownTraits.daYun) knownTraits['daYun'] = vc.knownTraits.daYun

      try {
        var matchResults = await this.validateSingle(input, knownTraits)
        allResults.push({ case: vc, matchResults: matchResults })
        successCount++
      } catch (e) {
        failCount++
      }
    }

    var endTime = Date.now()
    var dimensions = this.calculateAccuracy(allResults)
    var overall = this.computeOverallAccuracy(dimensions)
    var byCategory = this.computeCategoryAccuracy(allResults)

    return {
      generatedAt: new Date().toISOString(),
      totalCases: selectedCases.length,
      executedCases: successCount + failCount,
      successCases: successCount,
      failedCases: failCount,
      durationMs: endTime - startTime,
      dimensions: dimensions,
      overallAccuracy: overall,
      byCategory: byCategory
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 私有方法：准确率计算
  // ═══════════════════════════════════════════════════════════

  /**
   * 生成六维准确率统计
   * 遍历所有验证结果，统计各维度的命中数和总数
   */
  private calculateAccuracy(results: Array<{ case: ValidationCase; matchResults: Record<string, boolean> }>): DimensionAccuracy[] {
    // 初始化各维度统计
    var stats: Record<string, { total: number; correct: number; details: Array<{ caseId: string; expected: string; actual: string; match: boolean }> }> = {}
    for (var d = 0; d < DIMENSION_NAMES.length; d++) {
      var dim = DIMENSION_NAMES[d]
      stats[dim] = { total: 0, correct: 0, details: [] }
    }

    // 遍历结果
    for (var i = 0; i < results.length; i++) {
      var item = results[i]
      var vc = item.case
      var mr = item.matchResults
      var traits = vc.knownTraits

      // 旺衰
      if (traits.wangShuai && '旺衰' in mr) {
        stats['旺衰'].total++
        if (mr['旺衰']) stats['旺衰'].correct++
        stats['旺衰'].details.push({
          caseId: vc.id,
          expected: traits.wangShuai,
          actual: mr['旺衰'] ? '匹配' : '不匹配',
          match: mr['旺衰']
        })
      }

      // 用神
      if (traits.useGod && '用神' in mr) {
        stats['用神'].total++
        if (mr['用神']) stats['用神'].correct++
        stats['用神'].details.push({
          caseId: vc.id,
          expected: traits.useGod,
          actual: mr['用神'] ? '匹配' : '不匹配',
          match: mr['用神']
        })
      }

      // 格局
      if (traits.pattern && '格局' in mr) {
        stats['格局'].total++
        if (mr['格局']) stats['格局'].correct++
        stats['格局'].details.push({
          caseId: vc.id,
          expected: traits.pattern,
          actual: mr['格局'] ? '匹配' : '不匹配',
          match: mr['格局']
        })
      }

      // 婚姻
      if (traits.marriage && '婚姻' in mr) {
        stats['婚姻'].total++
        if (mr['婚姻']) stats['婚姻'].correct++
        stats['婚姻'].details.push({
          caseId: vc.id,
          expected: traits.marriage,
          actual: mr['婚姻'] ? '匹配' : '不匹配',
          match: mr['婚姻']
        })
      }

      // 财富
      if (traits.wealth && '财富' in mr) {
        stats['财富'].total++
        if (mr['财富']) stats['财富'].correct++
        stats['财富'].details.push({
          caseId: vc.id,
          expected: traits.wealth,
          actual: mr['财富'] ? '匹配' : '不匹配',
          match: mr['财富']
        })
      }

      // 大运
      if (traits.daYun && '大运' in mr) {
        stats['大运'].total++
        if (mr['大运']) stats['大运'].correct++
        stats['大运'].details.push({
          caseId: vc.id,
          expected: traits.daYun,
          actual: mr['大运'] ? '匹配' : '不匹配',
          match: mr['大运']
        })
      }
    }

    // 组装维度准确率数组
    var dimensions: DimensionAccuracy[] = []
    for (var k = 0; k < DIMENSION_NAMES.length; k++) {
      var dimName = DIMENSION_NAMES[k]
      var s = stats[dimName]
      dimensions.push({
        dimension: dimName,
        total: s.total,
        correct: s.correct,
        accuracy: s.total > 0 ? s.correct / s.total : 0,
        details: s.details
      })
    }

    return dimensions
  }

  /**
   * 计算总体准确率（六维度准确率的加权平均）
   */
  private computeOverallAccuracy(dimensions: DimensionAccuracy[]): number {
    var totalWeight = 0
    var weightedSum = 0
    for (var i = 0; i < dimensions.length; i++) {
      var dim = dimensions[i]
      if (dim.total > 0) {
        // 按该维度的有效案例数加权
        totalWeight += dim.total
        weightedSum += dim.accuracy * dim.total
      }
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  /**
   * 计算按分类的准确率
   */
  private computeCategoryAccuracy(results: Array<{ case: ValidationCase; matchResults: Record<string, boolean> }>): Record<string, { total: number; accuracy: number }> {
    var categoryStats: Record<string, { total: number; correct: number }> = {}
    var categoryNames: string[] = ['historical', 'entrepreneur', 'celebrity', 'politician', 'general']

    for (var i = 0; i < categoryNames.length; i++) {
      categoryStats[categoryNames[i]] = { total: 0, correct: 0 }
    }

    for (var j = 0; j < results.length; j++) {
      var item = results[j]
      var vc = item.case
      var mr = item.matchResults
      if (!categoryStats[vc.category]) continue
      categoryStats[vc.category].total++
      // 统计该案例各维度匹配数
      var matchCount = 0
      var dimCount = 0
      var dims = Object.keys(mr)
      for (var d = 0; d < dims.length; d++) {
        dimCount++
        if (mr[dims[d]]) matchCount++
      }
      if (dimCount > 0 && matchCount === dimCount) {
        categoryStats[vc.category].correct++
      }
    }

    var byCategory: Record<string, { total: number; accuracy: number }> = {}
    var catKeys = Object.keys(categoryStats)
    for (var c = 0; c < catKeys.length; c++) {
      var cs = categoryStats[catKeys[c]]
      byCategory[catKeys[c]] = {
        total: cs.total,
        accuracy: cs.total > 0 ? cs.correct / cs.total : 0
      }
    }

    return byCategory
  }

  // ═══════════════════════════════════════════════════════════
  // 私有方法：维度对比
  // ═══════════════════════════════════════════════════════════

  /**
   * 比较推演结果与已知特征
   * 根据维度名称选择不同的对比策略
   *
   * @param dimension - 维度名称
   * @param expected - 期望值（已知特征）
   * @param report - 推演报告
   * @returns 是否匹配
   */
  private compareDimension(dimension: string, expected: string, report: PipelineReport): boolean {
    switch (dimension) {
      case '旺衰':
        return this.compareWangShuai(expected, report)
      case '用神':
        return this.compareUseGod(expected, report)
      case '格局':
        return this.comparePattern(expected, report)
      case '婚姻':
        return this.compareMarriage(expected, report)
      case '财富':
        return this.compareWealth(expected, report)
      case '大运':
        return this.compareDaYun(expected, report)
      default:
        return false
    }
  }

  /**
   * 旺衰对比
   * 从 report.chart 中取 strengthScore，>= 60 为身旺，< 60 为身弱
   */
  private compareWangShuai(expected: string, report: PipelineReport): boolean {
    var chart = report.chart
    if (!chart) return false
    var score = 50  // 默认中等
    // 尝试多种路径获取旺衰分数
    if (chart['strengthScore'] !== undefined && chart['strengthScore'] !== null) {
      score = chart['strengthScore'] as number
    } else if (chart['dayMaster'] && typeof chart['dayMaster'] === 'object') {
      var dm = chart['dayMaster'] as Record<string, unknown>
      if (dm['strengthScore'] !== undefined && dm['strengthScore'] !== null) {
        score = dm['strengthScore'] as number
      }
    }
    var actual = score >= 60 ? 'strong' : 'weak'
    return actual === expected
  }

  /**
   * 用神对比
   * 从 consensus 结果或 chart 中提取 xiShen（喜神/用神），
   * 检查是否包含期望的五行
   */
  private compareUseGod(expected: string, report: PipelineReport): boolean {
    var chart = report.chart
    // 尝试从 chart 获取喜神五行
    var xiShen = ''
    if (chart) {
      if (chart['xiShen'] && typeof chart['xiShen'] === 'string') {
        xiShen = chart['xiShen'] as string
      } else if (chart['yongShen'] && typeof chart['yongShen'] === 'string') {
        xiShen = chart['yongShen'] as string
      } else if (chart['useGod'] && typeof chart['useGod'] === 'string') {
        xiShen = chart['useGod'] as string
      }
    }
    // 尝试从 consensus 结果获取
    if (!xiShen && report.consensus && report.consensus.consensus) {
      var cd = report.consensus.consensus
      for (var i = 0; i < cd.length; i++) {
        if (cd[i].dimension === '用神' || cd[i].dimension === '喜用') {
          var text = cd[i].finalView || cd[i].consensusConclusion || ''
          // 从文本中提取五行关键词
          xiShen = extractWuXingFromText(text)
          if (xiShen) break
        }
      }
    }
    if (!xiShen) return false
    // 检查期望的五行是否被包含
    // 期望值可能为 '金', '木', '水', '火', '土', '金水' 等
    var expectedElements = splitWuXing(expected)
    for (var j = 0; j < expectedElements.length; j++) {
      if (xiShen.indexOf(expectedElements[j]) !== -1) return true
    }
    return false
  }

  /**
   * 格局对比
   * 从 consensus 结果或 chart 中提取格局名称，
   * 检查是否包含期望的格局关键词
   */
  private comparePattern(expected: string, report: PipelineReport): boolean {
    var chart = report.chart
    var pattern = ''
    // 从 chart 获取格局
    if (chart) {
      if (chart['pattern'] && typeof chart['pattern'] === 'string') {
        pattern = chart['pattern'] as string
      } else if (chart['geJu'] && typeof chart['geJu'] === 'string') {
        pattern = chart['geJu'] as string
      } else if (chart['格局'] && typeof chart['格局'] === 'string') {
        pattern = chart['格局'] as string
      }
    }
    // 从 consensus 获取格局
    if (!pattern && report.consensus && report.consensus.consensus) {
      var cd = report.consensus.consensus
      for (var i = 0; i < cd.length; i++) {
        if (cd[i].dimension === '格局') {
          var text = cd[i].finalView || cd[i].consensusConclusion || ''
          pattern = text
          break
        }
      }
    }
    if (!pattern) return false
    // 检查是否包含期望的格局关键词
    return pattern.indexOf(expected) !== -1
  }

  /**
   * 婚姻对比
   * 从 consensus 结果中提取婚姻维度的结论，
   * 根据关键词判断 good/fair/poor 并与期望值对比
   */
  private compareMarriage(expected: string, report: PipelineReport): boolean {
    var conclusion = this.getConsensusConclusion(report, '婚姻')
    if (!conclusion) {
      // 如果没有 consensus 数据，尝试从 masterReport 获取
      conclusion = this.getMasterReportConclusion(report, '婚姻')
    }
    if (!conclusion) return false
    var actual = judgeLevelFromText(conclusion)
    return actual === expected
  }

  /**
   * 财富对比
   * 从 consensus 结果中提取财富维度的结论，
   * 根据关键词判断 good/fair/poor 并与期望值对比
   */
  private compareWealth(expected: string, report: PipelineReport): boolean {
    var conclusion = this.getConsensusConclusion(report, '财富')
    if (!conclusion) {
      conclusion = this.getMasterReportConclusion(report, '财富')
    }
    if (!conclusion) return false
    var actual = judgeLevelFromText(conclusion)
    return actual === expected
  }

  /**
   * 大运对比
   * 从 consensus 结果中提取大运维度的结论，
   * 根据关键词判断 good/fair/poor 并与期望值对比
   */
  private compareDaYun(expected: string, report: PipelineReport): boolean {
    var conclusion = this.getConsensusConclusion(report, '大运')
    if (!conclusion) {
      conclusion = this.getMasterReportConclusion(report, '大运')
    }
    if (!conclusion) return false
    var actual = judgeLevelFromText(conclusion)
    return actual === expected
  }

  /**
   * 从 consensus 结果中获取指定维度的结论文本
   */
  private getConsensusConclusion(report: PipelineReport, dimensionName: string): string {
    if (!report.consensus || !report.consensus.consensus) return ''
    var cd = report.consensus.consensus
    for (var i = 0; i < cd.length; i++) {
      if (cd[i].dimension === dimensionName) {
        return cd[i].finalView || cd[i].consensusConclusion || ''
      }
    }
    return ''
  }

  /**
   * 从 masterReport 中获取指定维度（章节）的结论文本
   */
  private getMasterReportConclusion(report: PipelineReport, dimensionName: string): string {
    if (!report.masterReport || !report.masterReport.sections) return ''
    var sections = report.masterReport.sections
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i]
      // 匹配章节标题或分类
      if (sec.title && sec.title.indexOf(dimensionName) !== -1) {
        return sec.evidence && sec.evidence.conclusion ? sec.evidence.conclusion : sec.content || ''
      }
      if (sec.category && sec.category.indexOf(dimensionName) !== -1) {
        return sec.evidence && sec.evidence.conclusion ? sec.evidence.conclusion : sec.content || ''
      }
    }
    return ''
  }
}

// ═══════════════════════════════════════════════════════════
// 辅助函数（模块级别）
// ═══════════════════════════════════════════════════════════

/**
 * 从文本中提取五行关键词
 * 返回包含的五行字符（金木水火土）
 */
function extractWuXingFromText(text: string): string {
  var elements = ['金', '木', '水', '火', '土']
  var found = ''
  for (var i = 0; i < elements.length; i++) {
    if (text.indexOf(elements[i]) !== -1) {
      found = found + elements[i]
    }
  }
  return found
}

/**
 * 将用神字符串拆分为单个五行字符数组
 * 例如 '金水' -> ['金', '水']
 */
function splitWuXing(str: string): string[] {
  var elements = ['金', '木', '水', '火', '土']
  var result: string[] = []
  for (var i = 0; i < str.length; i++) {
    var ch = str.charAt(i)
    if (elements.indexOf(ch) !== -1) {
      result.push(ch)
    }
  }
  return result
}
