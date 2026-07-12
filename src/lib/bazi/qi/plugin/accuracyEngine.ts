/**
 * P4.11 AccuracyEngine — Accuracy 2.0 真实用户反馈驱动的准确率统计引擎
 *
 * 古籍依据：
 *   《易经》："多闻择善而从之。" — 广泛听取反馈，择善改进
 *   《论语》："三人行，必有我师焉。" — 以用户反馈为师，虚心改进
 *   《滴天髓》："五行生克，理有必然。" — 理论须在实践中验证
 *   《子平真诠》："论命须有据。" — 准确率即为"有据"之度量
 *
 * 设计原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - 真实用户反馈驱动，不接受虚假数据
 *   - 支持三级评价：correct / partial / incorrect
 *   - 按维度独立统计准确率
 *   - 趋势分析：对比最近 50 条 vs 之前 50 条
 *   - 所有注释使用中文，所有字符串使用单引号 + 字符串连接
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 生成唯一 ID */
function generateId(): string {
  return 'fb_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8)
}

/** 生成当前时间戳 */
function nowISO(): string {
  return new Date().toISOString()
}

/** 将数值限制在 0-100 范围内 */
function clampScore(v: number): number {
  return Math.min(100, Math.max(0, Math.round(v)))
}

/** 随机选取数组中一个元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 格式化时间为可读中文 */
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

/** 用户评价等级 */
export type UserRating = 'correct' | 'partial' | 'incorrect'

/** 反馈记录 */
export interface FeedbackRecord {
  /** 反馈唯一 ID */
  id: string
  /** 案例编号 */
  caseId: string
  /** 分析维度 */
  dimension: string
  /** 系统分析结果 */
  systemResult: string
  /** 用户评价 */
  userRating: UserRating
  /** 用户 ID（可选） */
  userId?: string
  /** 反馈时间 */
  timestamp: string
}

/** 单维度准确率统计 */
export interface DimensionAccuracy {
  /** 总评价数 */
  total: number
  /** 正确数 */
  correct: number
  /** 准确率 */
  rate: number
}

/** 总体准确率统计 */
export interface AccuracyStats {
  /** 总反馈数 */
  totalFeedback: number
  /** 正确率 */
  correctRate: number
  /** 部分正确率 */
  partialRate: number
  /** 错误率 */
  incorrectRate: number
  /** 按维度分布 */
  byDimension: Record<string, DimensionAccuracy>
  /** 趋势 */
  trend: 'improving' | 'stable' | 'declining'
}

/** Accuracy 2.0 完整输出 */
export interface Accuracy2Result {
  /** 生成时间 */
  generatedAt: string
  /** 准确率统计 */
  stats: AccuracyStats
  /** 最近反馈记录 */
  recentFeedback: FeedbackRecord[]
  /** 改进建议 */
  suggestions: string[]
  /** 中文报告 */
  report: string
  /** 古籍依据 */
  classicalRef: string
}

// ═══════════════════════════════════════════════════════════
// 常量：支持的分析维度
// ═══════════════════════════════════════════════════════════

/** 所有支持的分析维度 */
var SUPPORTED_DIMENSIONS: string[] = [
  '格局',
  '用神',
  '婚姻',
  '事业',
  '财富',
  '健康',
  '学业',
  '性格',
  '人际',
  '运势',
  '日主强弱',
  '十神',
  '大运',
  '流年',
  '调候',
  '神煞',
]

/** 维度描述 */
var DIMENSION_DESCRIPTIONS: Record<string, string> = {
  '格局': '格局判定',
  '用神': '用神选取',
  '婚姻': '婚姻分析',
  '事业': '事业推演',
  '财富': '财富预测',
  '健康': '健康评估',
  '学业': '学业分析',
  '性格': '性格推断',
  '人际': '人际分析',
  '运势': '运势推演',
  '日主强弱': '日主旺衰判断',
  '十神': '十神分析',
  '大运': '大运推演',
  '流年': '流年吉凶',
  '调候': '调候分析',
  '神煞': '神煞判定',
}

/** 改进建议模板 */
var SUGGESTION_TEMPLATES: Record<string, string[]> = {
  '格局': [
    '格局判定准确率偏低，建议加强月令格局的判定逻辑。',
    '格局分析中杂格识别不足，建议扩充格局库。',
    '格局纯杂判断可进一步优化，参考《子平真诠》格局篇。',
  ],
  '用神': [
    '用神选取准确率有待提高，建议强化旺衰判断基础。',
    '用神与喜忌的区分须更加精细，减少误判。',
    '调候用神的判定可参考《穷通宝鉴》调候篇。',
  ],
  '婚姻': [
    '婚姻分析准确率不足，建议细化夫妻宫位分析。',
    '日支与配偶星的配合分析须更加周全。',
    '桃花咸池等神煞在婚姻中的应用可进一步深化。',
  ],
  '事业': [
    '事业推演准确率偏低，建议加强官印关系分析。',
    '大运对事业的影响判定可进一步优化。',
    '流年事业断语可参考更多古籍案例。',
  ],
  '财富': [
    '财富预测准确率不足，建议加强财星与身主的关系分析。',
    '财库判定可更加精细，参考《渊海子平》财篇。',
    '食伤生财格局的识别可进一步强化。',
  ],
  '健康': [
    '健康评估准确率偏低，建议深化五行与脏腑的对应关系。',
    '调候与健康的关系判定须更加细致。',
    '可参考中医五行理论优化健康分析模块。',
  ],
  '学业': [
    '学业分析准确率不足，建议加强印星与文昌的分析。',
    '考试运之判定可结合大运流年详加推演。',
    '文星学术能力的评估可进一步细化。',
  ],
  '性格': [
    '性格分析准确率偏低，建议加强日主五行性情分析。',
    '十神对性格的影响判定可更加全面。',
    '可参考《滴天髓》性情篇优化性格推断。',
  ],
  'default': [
    '准确率有提升空间，建议持续收集反馈、迭代优化。',
    '结合古籍案例和真实反馈，不断修正推演逻辑。',
    '《易经》云"多闻择善而从之"，虚心接受用户反馈，择善改进。',
  ],
}

/** 趋势分析说明 */
var TREND_DESCRIPTIONS: Record<string, string> = {
  'improving': '准确率呈上升趋势，系统推演能力在持续改进。',
  'stable': '准确率保持稳定，系统处于正常运作水平。',
  'declining': '准确率有所下降，建议检视近期推演逻辑是否有偏差。',
}

// ═══════════════════════════════════════════════════════════
// 引擎类
// ═══════════════════════════════════════════════════════════

/**
 * P4.11 AccuracyEngine — Accuracy 2.0 用户反馈驱动准确率引擎
 *
 * 核心功能：
 *   1. 记录用户反馈（correct / partial / incorrect）
 *   2. 按维度统计准确率
 *   3. 趋势分析：最近 50 条 vs 之前 50 条
 *   4. 生成改进建议
 *   5. 输出完整的中文报告
 */
var MAX_FEEDBACKS = 5000

export class AccuracyEngine {
  /** 所有反馈记录（滑动窗口，超过上限自动裁剪旧记录） */
  private feedbacks: FeedbackRecord[] = []

  /** 核心古籍依据 */
  private classicalRef: string = '《易经》"多闻择善而从之"——广泛听取用户反馈，择善改进，方能精益求精。'

  /** 趋势对比窗口大小 */
  private trendWindowSize: number = 50

  // ─── 核心 API ───

  /**
   * 记录用户反馈
   * @param feedback 反馈数据（不含 id 和 timestamp，由引擎自动生成）
   * @returns 反馈记录 ID
   */
  recordFeedback(feedback: Omit<FeedbackRecord, 'id' | 'timestamp'>): string {
    // 验证反馈数据
    var validRatings: string[] = ['correct', 'partial', 'incorrect']
    if (validRatings.indexOf(feedback.userRating) === -1) {
      throw new Error('无效的用户评价：' + feedback.userRating + '，须为 correct/partial/incorrect')
    }

    if (!feedback.caseId || feedback.caseId.trim().length === 0) {
      throw new Error('案例编号不能为空')
    }

    if (!feedback.dimension || feedback.dimension.trim().length === 0) {
      throw new Error('分析维度不能为空')
    }

    if (!feedback.systemResult || feedback.systemResult.trim().length === 0) {
      throw new Error('系统分析结果不能为空')
    }

    // 创建完整记录
    var record: FeedbackRecord = {
      id: generateId(),
      caseId: feedback.caseId,
      dimension: feedback.dimension,
      systemResult: feedback.systemResult,
      userRating: feedback.userRating,
      userId: feedback.userId,
      timestamp: nowISO(),
    }

    // 按时间排序插入（最新的在末尾）
    this.feedbacks.push(record)

    // P6-C: 滑动窗口裁剪，防止内存无限增长
    if (this.feedbacks.length > MAX_FEEDBACKS) {
      this.feedbacks = this.feedbacks.slice(this.feedbacks.length - MAX_FEEDBACKS)
    }

    return record.id
  }

  /**
   * 获取总体准确率统计
   * @returns AccuracyStats
   */
  getStats(): AccuracyStats {
    var totalFeedback = this.feedbacks.length

    // 如果没有反馈，返回零值
    if (totalFeedback === 0) {
      return {
        totalFeedback: 0,
        correctRate: 0,
        partialRate: 0,
        incorrectRate: 0,
        byDimension: {},
        trend: 'stable',
      }
    }

    // 统计总体评价分布
    var correctCount = 0
    var partialCount = 0
    var incorrectCount = 0
    var byDimension: Record<string, DimensionAccuracy> = {}

    for (var i = 0; i < this.feedbacks.length; i++) {
      var fb = this.feedbacks[i]
      var dim = fb.dimension

      // 总体计数
      if (fb.userRating === 'correct') {
        correctCount++
      } else if (fb.userRating === 'partial') {
        partialCount++
      } else {
        incorrectCount++
      }

      // 按维度统计
      if (!byDimension[dim]) {
        byDimension[dim] = { total: 0, correct: 0, rate: 0 }
      }
      byDimension[dim].total++
      if (fb.userRating === 'correct') {
        byDimension[dim].correct++
      }
    }

    // 计算各维度准确率
    var dimKeys = Object.keys(byDimension)
    for (var d = 0; d < dimKeys.length; d++) {
      var key = dimKeys[d]
      byDimension[key].rate = byDimension[key].total > 0
        ? Math.round(byDimension[key].correct / byDimension[key].total * 100)
        : 0
    }

    // 计算总体比率
    var correctRate = Math.round(correctCount / totalFeedback * 100)
    var partialRate = Math.round(partialCount / totalFeedback * 100)
    var incorrectRate = Math.round(incorrectCount / totalFeedback * 100)

    // 计算趋势
    var trend = this.calculateTrend()

    return {
      totalFeedback: totalFeedback,
      correctRate: correctRate,
      partialRate: partialRate,
      incorrectRate: incorrectRate,
      byDimension: byDimension,
      trend: trend,
    }
  }

  /**
   * 获取完整报告
   * @returns Accuracy2Result
   */
  getReport(): Accuracy2Result {
    var now = nowISO()
    var stats = this.getStats()

    // 获取最近 10 条反馈
    var recentCount = Math.min(10, this.feedbacks.length)
    var recentFeedback: FeedbackRecord[] = []
    if (this.feedbacks.length > 0) {
      recentFeedback = this.feedbacks.slice(this.feedbacks.length - recentCount)
    }

    // 生成改进建议
    var suggestions = this.generateSuggestions(stats)

    // 生成中文报告
    var report = this.generateReport(stats)

    return {
      generatedAt: now,
      stats: stats,
      recentFeedback: recentFeedback,
      suggestions: suggestions,
      report: report,
      classicalRef: this.classicalRef,
    }
  }

  /**
   * 按维度查询准确率
   * @param dimension 维度名称
   * @returns 该维度的准确率数据
   */
  getByDimension(dimension: string): DimensionAccuracy {
    var total = 0
    var correct = 0

    for (var i = 0; i < this.feedbacks.length; i++) {
      if (this.feedbacks[i].dimension === dimension) {
        total++
        if (this.feedbacks[i].userRating === 'correct') {
          correct++
        }
      }
    }

    return {
      total: total,
      correct: correct,
      rate: total > 0 ? Math.round(correct / total * 100) : 0,
    }
  }

  /**
   * 获取准确率趋势
   * @returns 趋势描述字符串
   */
  getTrend(): string {
    var trend = this.calculateTrend()
    return trend + '：' + TREND_DESCRIPTIONS[trend]
  }

  // ─── 便捷方法 ───

  /**
   * 批量记录反馈
   * @param feedbacksList 反馈列表
   * @returns 生成的 ID 列表
   */
  recordFeedbackBatch(feedbacksList: Array<Omit<FeedbackRecord, 'id' | 'timestamp'>>): string[] {
    var ids: string[] = []
    for (var i = 0; i < feedbacksList.length; i++) {
      var id = this.recordFeedback(feedbacksList[i])
      ids.push(id)
    }
    return ids
  }

  /**
   * 获取反馈总数
   * @returns 反馈总数
   */
  getTotalCount(): number {
    return this.feedbacks.length
  }

  /**
   * 获取某个案例的所有反馈
   * @param caseId 案例编号
   * @returns 该案例的反馈列表
   */
  getByCaseId(caseId: string): FeedbackRecord[] {
    var results: FeedbackRecord[] = []
    for (var i = 0; i < this.feedbacks.length; i++) {
      if (this.feedbacks[i].caseId === caseId) {
        results.push(this.feedbacks[i])
      }
    }
    return results
  }

  /**
   * 获取某个用户的反馈记录
   * @param userId 用户 ID
   * @returns 该用户的反馈列表
   */
  getByUserId(userId: string): FeedbackRecord[] {
    var results: FeedbackRecord[] = []
    for (var i = 0; i < this.feedbacks.length; i++) {
      if (this.feedbacks[i].userId === userId) {
        results.push(this.feedbacks[i])
      }
    }
    return results
  }

  /**
   * 获取准确率最低的维度
   * @returns 准确率最低的维度信息
   */
  getWeakestDimension(): { dimension: string; rate: number; total: number } | null {
    var stats = this.getStats()
    var dimKeys = Object.keys(stats.byDimension)
    if (dimKeys.length === 0) return null

    var weakestDim = dimKeys[0]
    var weakestRate = stats.byDimension[dimKeys[0]].rate

    for (var i = 1; i < dimKeys.length; i++) {
      var rate = stats.byDimension[dimKeys[i]].rate
      if (rate < weakestRate) {
        weakestRate = rate
        weakestDim = dimKeys[i]
      }
    }

    return {
      dimension: weakestDim,
      rate: weakestRate,
      total: stats.byDimension[weakestDim].total,
    }
  }

  /**
   * 获取准确率最高的维度
   * @returns 准确率最高的维度信息
   */
  getStrongestDimension(): { dimension: string; rate: number; total: number } | null {
    var stats = this.getStats()
    var dimKeys = Object.keys(stats.byDimension)
    if (dimKeys.length === 0) return null

    var strongestDim = dimKeys[0]
    var strongestRate = stats.byDimension[dimKeys[0]].rate

    for (var i = 1; i < dimKeys.length; i++) {
      var rate = stats.byDimension[dimKeys[i]].rate
      if (rate > strongestRate) {
        strongestRate = rate
        strongestDim = dimKeys[i]
      }
    }

    return {
      dimension: strongestDim,
      rate: strongestRate,
      total: stats.byDimension[strongestDim].total,
    }
  }

  /**
   * 获取支持的所有维度列表
   * @returns 维度名称数组
   */
  getSupportedDimensions(): string[] {
    return SUPPORTED_DIMENSIONS.slice()
  }

  // ─── 内部方法 ───

  /**
   * 计算准确率趋势
   * 对比最近 trendWindowSize 条与之前的 trendWindowSize 条
   */
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    var total = this.feedbacks.length

    // 反馈不足时返回稳定
    if (total < 20) return 'stable'

    // 至少需要 window * 2 条数据
    var windowSize = Math.min(this.trendWindowSize, Math.floor(total / 2))
    if (windowSize < 10) return 'stable'

    // 计算最近窗口的准确率
    var recentCorrect = 0
    var recentTotal = 0
    var startRecent = total - windowSize
    for (var i = startRecent; i < total; i++) {
      recentTotal++
      if (this.feedbacks[i].userRating === 'correct') {
        recentCorrect++
      }
    }
    var recentRate = recentTotal > 0 ? recentCorrect / recentTotal : 0

    // 计算之前窗口的准确率
    var prevCorrect = 0
    var prevTotal = 0
    var startPrev = Math.max(0, startRecent - windowSize)
    for (var j = startPrev; j < startRecent; j++) {
      prevTotal++
      if (this.feedbacks[j].userRating === 'correct') {
        prevCorrect++
      }
    }
    var prevRate = prevTotal > 0 ? prevCorrect / prevTotal : 0

    // 差值判断（阈值为 5%）
    var diff = (recentRate - prevRate) * 100
    if (diff > 5) return 'improving'
    if (diff < -5) return 'declining'
    return 'stable'
  }

  /**
   * 生成改进建议
   */
  private generateSuggestions(stats: AccuracyStats): string[] {
    var suggestions: string[] = []

    // 找出准确率最低的几个维度
    var dimEntries: Array<{ dim: string; rate: number; total: number }> = []
    var keys = Object.keys(stats.byDimension)
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]
      dimEntries.push({
        dim: k,
        rate: stats.byDimension[k].rate,
        total: stats.byDimension[k].total,
      })
    }

    // 按准确率排序（升序）
    dimEntries.sort(function (a, b) { return a.rate - b.rate })

    // 为准确率最低的 3 个维度生成建议
    var topWeak = dimEntries.slice(0, Math.min(3, dimEntries.length))
    for (var w = 0; w < topWeak.length; w++) {
      var entry = topWeak[w]
      if (entry.rate < 80) {
        // 维度相关建议
        var dimSuggestions = SUGGESTION_TEMPLATES[entry.dim] || SUGGESTION_TEMPLATES['default']
        var suggestion = pick(dimSuggestions)
        suggestions.push(suggestion + '（' + DIMENSION_DESCRIPTIONS[entry.dim] + '：当前准确率 ' + entry.rate + '%，共 ' + entry.total + ' 条反馈）')
      }
    }

    // 总体建议
    if (stats.correctRate < 70) {
      suggestions.push('总体准确率低于 70%，建议全面检视推演逻辑，重点强化基础判断能力。')
    } else if (stats.correctRate < 85) {
      suggestions.push('总体准确率处于中等水平，建议针对性改进薄弱维度的分析逻辑。')
    } else if (stats.correctRate >= 85) {
      suggestions.push('总体准确率良好，继续保持并精细节点判断。')
    }

    // 趋势相关建议
    if (stats.trend === 'declining') {
      suggestions.push('准确率呈下降趋势，建议检视近期是否有逻辑变更或数据异常。')
    } else if (stats.trend === 'improving') {
      suggestions.push('准确率持续提升，当前优化方向正确，继续沿此路径迭代。')
    }

    // 反馈量建议
    if (stats.totalFeedback < 50) {
      suggestions.push('反馈数量不足 ' + stats.totalFeedback + ' 条，建议收集更多用户反馈以提高统计可靠性。')
    }

    // 如果没有特别建议
    if (suggestions.length === 0) {
      suggestions.push('《易经》"多闻择善而从之"——持续收集反馈，择善改进。')
    }

    return suggestions
  }

  /**
   * 生成中文报告
   */
  private generateReport(stats: AccuracyStats): string {
    var lines: string[] = []

    lines.push('╔══════════════════════════════════════════════════════╗')
    lines.push('║        Accuracy 2.0 — 用户反馈驱动准确率报告        ║')
    lines.push('╚══════════════════════════════════════════════════════╝')
    lines.push('')
    lines.push('古籍依据：《易经》"多闻择善而从之"')
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('一、总体准确率')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('  总反馈数：' + stats.totalFeedback + ' 条')
    lines.push('  正确率：' + stats.correctRate + '%')
    lines.push('  部分正确率：' + stats.partialRate + '%')
    lines.push('  错误率：' + stats.incorrectRate + '%')
    lines.push('  趋势：' + (stats.trend === 'improving' ? '上升 ↑' : stats.trend === 'declining' ? '下降 ↓' : '稳定 →'))
    lines.push('  ' + TREND_DESCRIPTIONS[stats.trend])
    lines.push('')

    // 各维度准确率
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('二、各维度准确率')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    var dimKeys = Object.keys(stats.byDimension)
    if (dimKeys.length === 0) {
      lines.push('  （暂无分维度数据）')
    } else {
      // 按准确率排序
      var entries: Array<{ dim: string; rate: number; total: number; correct: number }> = []
      for (var i = 0; i < dimKeys.length; i++) {
        var k = dimKeys[i]
        entries.push({
          dim: k,
          rate: stats.byDimension[k].rate,
          total: stats.byDimension[k].total,
          correct: stats.byDimension[k].correct,
        })
      }
      entries.sort(function (a, b) { return b.rate - a.rate })

      for (var e = 0; e < entries.length; e++) {
        var entry = entries[e]
        var bar = this.generateBar(entry.rate)
        var desc = DIMENSION_DESCRIPTIONS[entry.dim] || entry.dim
        lines.push('  ' + desc + '(' + entry.dim + ')：')
        lines.push('    ' + bar + ' ' + entry.rate + '%（' + entry.correct + '/' + entry.total + '）')
      }
    }
    lines.push('')

    // 趋势分析
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('三、趋势分析')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('  对比方法：最近 ' + this.trendWindowSize + ' 条反馈 vs 之前 ' + this.trendWindowSize + ' 条反馈')
    lines.push('  当前趋势：' + (stats.trend === 'improving' ? '上升 ↑' : stats.trend === 'declining' ? '下降 ↓' : '稳定 →'))
    lines.push('')

    // 准确率最低的维度
    var weakest = this.getWeakestDimension()
    if (weakest) {
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      lines.push('四、待改进维度')
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      lines.push('  最薄弱维度：' + weakest.dimension + '（' + (DIMENSION_DESCRIPTIONS[weakest.dimension] || weakest.dimension) + '）')
      lines.push('  当前准确率：' + weakest.rate + '%（共 ' + weakest.total + ' 条反馈）')
      lines.push('')
    }

    // 准确率最高的维度
    var strongest = this.getStrongestDimension()
    if (strongest) {
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      lines.push('五、最佳维度')
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      lines.push('  最优维度：' + strongest.dimension + '（' + (DIMENSION_DESCRIPTIONS[strongest.dimension] || strongest.dimension) + '）')
      lines.push('  当前准确率：' + strongest.rate + '%（共 ' + strongest.total + ' 条反馈）')
      lines.push('')
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('六、古籍依据')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('  ' + this.classicalRef)
    lines.push('  《子平真诠》"论命须有据"——准确率即为"有据"之度量。')
    lines.push('  《滴天髓》"五行生克，理有必然"——理论须在实践中验证。')
    lines.push('')
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('报告生成时间：' + formatTimestamp(nowISO()))
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    lines.push('')

    return lines.join('\n')
  }

  /**
   * 生成可视化进度条
   */
  private generateBar(rate: number): string {
    var filled = Math.round(rate / 5)
    var empty = 20 - filled
    var bar = ''
    for (var i = 0; i < filled; i++) {
      bar = bar + '█'
    }
    for (var j = 0; j < empty; j++) {
      bar = bar + '░'
    }
    return '[' + bar + ']'
  }
}

// ═══════════════════════════════════════════════════════════
// 导出便捷函数
// ═══════════════════════════════════════════════════════════

/**
 * 快速创建引擎并记录反馈
 * @param feedback 反馈数据
 * @returns 反馈 ID
 */
export function recordAccuracyFeedback(
  feedback: Omit<FeedbackRecord, 'id' | 'timestamp'>
): string {
  var engine = new AccuracyEngine()
  return engine.recordFeedback(feedback)
}

/**
 * 快速获取准确率统计
 * @param feedbacks 已有的反馈记录
 * @returns AccuracyStats
 */
export function getAccuracyStats(feedbacks: FeedbackRecord[]): AccuracyStats {
  var engine = new AccuracyEngine()
  for (var i = 0; i < feedbacks.length; i++) {
    engine.recordFeedback(feedbacks[i])
  }
  return engine.getStats()
}

/**
 * 快速生成准确率报告
 * @param feedbacks 已有的反馈记录
 * @returns Accuracy2Result
 */
export function generateAccuracyReport(feedbacks: FeedbackRecord[]): Accuracy2Result {
  var engine = new AccuracyEngine()
  for (var i = 0; i < feedbacks.length; i++) {
    engine.recordFeedback(feedbacks[i])
  }
  return engine.getReport()
}
