/**
 * 风水专业报告生成器 V3.0
 *
 * 基于规则知识库（Knowledge Base）生成专业化、结构化报告。
 * 避免绝对化表达，所有建议来自模板化的规则条目。
 */

import type {
  FengShuiResult,
  EvidenceChain,
  ImageAnalysisResult,
  ProfessionalFengShuiReport,
  FengShuiAdjustment,
  FengShuiRisk,
  FengShuiTerm,
  AnalysisConfidence,
  FengShuiScore8D,
  ReportSection,
  PipelineReport,
} from '../types'

import type { Score8DResult } from '../score-engine/types'

import {
  RULE_KNOWLEDGE_BASE,
  generateAdjustmentFromRule,
  generateRisksFromRule,
  extractTermsFromText,
  sortBySeverity,
  getSeverityLabel,
  getDifficultyLabel,
} from '../knowledge/rulesKnowledgeBase'

// ────────── 入口函数 ──────────

export function buildProfessionalReport(options: {
  scoreResult: FengShuiResult
  score8D: Score8DResult
  evidenceChains: EvidenceChain[]
  visionResult: ImageAnalysisResult
  roomResult: any
  ruleResult: any
  confidence: AnalysisConfidence
}): ProfessionalFengShuiReport {
  const { scoreResult, score8D, evidenceChains, visionResult, ruleResult, confidence } = options

  // 1. 从证据链匹配规则知识库，生成调整方案
  const { adjustments, matchedRules } = buildAdjustments(evidenceChains)

  // 2. 生成风险提示
  const risks = buildRisks(matchedRules)

  // 3. 生成空间格局解析
  const patternAnalysis = buildPatternAnalysis(score8D, evidenceChains)

  // 4. 生成问题列表（按优先级排序）
  const issues = buildIssues(matchedRules, adjustments)

  // 5. 提取术语
  const allText = [
    patternAnalysis.description,
    patternAnalysis.principle,
    ...adjustments.map(a => a.issue + a.cause + a.solution),
    ...risks.map(r => r.description),
  ].join(' ')
  const terms = extractTermsFromText(allText)

  // 6. 生成总体总结
  const summary = buildSummary(score8D, issues, confidence)

  return {
    score8d: score8D.dimensions,
    patternAnalysis,
    issues,
    allAdjustments: sortBySeverity(adjustments),
    risks,
    summary,
    confidence,
    terms,
  }
}

// ────────── 构建调整方案 ──────────

function buildAdjustments(evidenceChains: EvidenceChain[]): {
  adjustments: FengShuiAdjustment[]
  matchedRules: string[]
} {
  const adjustments: FengShuiAdjustment[] = []
  const matchedRules: string[] = []

  for (const chain of evidenceChains) {
    const ruleId = chain.hitRule?.id
    if (!ruleId) continue

    const knowledge = RULE_KNOWLEDGE_BASE[ruleId]
    if (!knowledge) {
      // 知识库中没有该规则，使用证据链原始数据
      adjustments.push({
        id: chain.id + '-ADJ',
        issue: chain.conclusion,
        cause: chain.reasoning || '根据空间分析发现。',
        solution: chain.improvement?.suggestion || '建议根据具体情况进行适当调整。',
        difficulty: (chain.improvement?.difficulty as any) || 'medium',
        expectedEffect: '调整后通常能改善该位置的气场流通。',
        cautions: '改善应循序渐进，避免一次性大幅改动。',
        severity: chain.severity === 'high' ? 'significant' : chain.severity === 'medium' ? 'moderate' : 'suggestion',
        relatedRuleId: ruleId,
        category: chain.hitRule?.category || '综合',
      })
      matchedRules.push(ruleId)
      continue
    }

    // 使用知识库模板生成
    const params: Record<string, string> = {}

    // 提取参数
    if (chain.conclusion.includes('缺角') && chain.conclusion.includes('方')) {
      const match = chain.conclusion.match(/(东|南|西|北|东北|东南|西北|西南)/)
      if (match) params.direction = match[1]
    }
    if (chain.conclusion.includes('横梁')) {
      if (chain.conclusion.includes('床')) params.furnitureType = '床'
      else if (chain.conclusion.includes('沙发')) params.furnitureType = '沙发'
      else if (chain.conclusion.includes('桌')) params.furnitureType = '办公桌'
      else params.furnitureType = '家具'
    }
    if (chain.conclusion.includes('五行') || chain.conclusion.includes('元素')) {
      const match = chain.conclusion.match(/(木|火|土|金|水)/)
      if (match) params.element = match[1]
    }

    const adj = generateAdjustmentFromRule(knowledge, params)
    adjustments.push(adj)
    matchedRules.push(ruleId)
  }

  // 如果没有匹配到任何规则，生成通用建议
  if (adjustments.length === 0) {
    adjustments.push({
      id: 'FS-GEN-001-ADJ',
      issue: '整体空间优化',
      cause: '基于现有空间条件，存在进一步提升居住舒适度的空间。',
      solution: '建议保持空间整洁有序，定期通风换气，适当增加绿植以提升空间活力。',
      difficulty: 'low',
      expectedEffect: '空间整洁度和舒适度通常会有明显提升。',
      cautions: '改善应循序渐进，根据自身实际情况逐步调整。',
      severity: 'suggestion',
      relatedRuleId: 'FS-GEN-001',
      category: '综合',
    })
  }

  return { adjustments, matchedRules }
}

// ────────── 构建风险提示 ──────────

function buildRisks(matchedRuleIds: string[]): FengShuiRisk[] {
  const allRisks: FengShuiRisk[] = []
  const seen = new Set<string>()

  for (const ruleId of matchedRuleIds) {
    const knowledge = RULE_KNOWLEDGE_BASE[ruleId]
    if (!knowledge) continue

    const risks = generateRisksFromRule(knowledge)
    for (const risk of risks) {
      const key = risk.type + risk.description
      if (!seen.has(key)) {
        seen.add(key)
        allRisks.push(risk)
      }
    }
  }

  if (allRisks.length === 0) {
    allRisks.push({
      type: 'shortTerm',
      description: '当前空间未发现明显风险因素，建议保持现有良好布局。',
      isTraditionalView: false,
    })
  }

  return allRisks
}

// ────────── 构建空间格局解析 ──────────

function buildPatternAnalysis(
  score8D: Score8DResult,
  evidenceChains: EvidenceChain[]
): ProfessionalFengShuiReport['patternAnalysis'] {
  const pattern = score8D.dimensions.pattern
  const layout = score8D.dimensions.flowPath

  let description = ''
  let principle = ''

  if (pattern.score >= 85) {
    description = '整体格局方正均衡，气场分布均匀，属于较为理想的空间结构。'
    principle = '《黄帝宅经》云"宅以形势为身体"，方正之宅如人之躯体端正，气血运行通畅。'
  } else if (pattern.score >= 70) {
    description = '整体格局基本方正，个别区域存在轻微不规则，整体气场流通尚可。'
    principle = '形势为风水之本，虽有微小不足，但不影响大局，适当调整即可趋吉避凶。'
  } else if (pattern.score >= 50) {
    description = '格局存在一定不规则，部分区域气场可能受阻，建议重点关注。'
    principle = '形势不整则气散，缺角或异形可能导致气场分布失衡，需通过布局和软装进行调和。'
  } else {
    description = '格局缺陷较为明显，气场分布不均，建议系统性地进行空间调理。'
    principle = '《阳宅十书》指出形势不正则煞气易生，需从布局根源着手改善。'
  }

  // 如果有缺角相关的证据链，补充说明
  const missingCornerChain = evidenceChains.find(e =>
    e.conclusion.includes('缺角')
  )
  if (missingCornerChain) {
    description += ' 其中' + missingCornerChain.conclusion + '。'
  }

  // 如果有穿堂煞相关的证据链，补充说明
  const throughHallChain = evidenceChains.find(e =>
    e.conclusion.includes('穿堂')
  )
  if (throughHallChain) {
    description += ' 同时存在' + throughHallChain.conclusion + '。'
  }

  return {
    description,
    principle,
    explanation: '通俗来说，这个空间就像一栋房子的"骨架"。骨架端正，住在里面的人通常能感到更加舒适和安定；' +
      '如果骨架有偏斜或缺口，某些区域可能会让人感觉不对劲。这不一定会有什么严重后果，' +
      '但适当调整通常能让居住体验更好。',
  }
}

// ────────── 构建问题列表 ──────────

function buildIssues(
  matchedRuleIds: string[],
  adjustments: FengShuiAdjustment[]
): ProfessionalFengShuiReport['issues'] {
  const issueMap = new Map<string, ProfessionalFengShuiReport['issues'][number]>()

  for (const adj of adjustments) {
    const key = adj.relatedRuleId
    if (!issueMap.has(key)) {
      const knowledge = RULE_KNOWLEDGE_BASE[adj.relatedRuleId]
      issueMap.set(key, {
        id: key + '-ISSUE',
        title: adj.issue,
        severity: adj.severity,
        description: knowledge?.通俗解释 || adj.cause,
        principle: knowledge?.principle || '基于空间分析判断。',
        adjustments: [],
      })
    }
    issueMap.get(key)!.adjustments.push(adj)
  }

  const issues = Array.from(issueMap.values())
  return sortBySeverity(issues)
}

// ────────── 生成总体总结 ──────────

function buildSummary(
  score8D: Score8DResult,
  issues: ProfessionalFengShuiReport['issues'],
  confidence: AnalysisConfidence
): string {
  const overall = score8D.overallScore
  const level = score8D.overallLevel
  const severeCount = issues.filter(i => i.severity === 'severe').length
  const significantCount = issues.filter(i => i.severity === 'significant').length
  const moderateCount = issues.filter(i => i.severity === 'moderate').length

  const levelDesc: Record<string, string> = {
    excellent: '整体风水条件优良',
    good: '整体风水条件良好',
    fair: '整体风水尚有改善空间',
    poor: '整体风水需要系统调理',
  }

  let summary = levelDesc[level] || '整体风水条件尚可'
  summary += '（综合评分 ' + overall + ' 分）。'

  if (severeCount > 0) {
    summary += ' 发现 ' + severeCount + ' 项严重问题，建议优先处理。'
  }
  if (significantCount > 0) {
    summary += ' 另有 ' + significantCount + ' 项较严重问题值得关注。'
  }
  if (moderateCount > 0) {
    summary += ' 还有 ' + moderateCount + ' 项一般问题可在后续逐步改善。'
  }

  summary += ' 本次分析可信度为' +
    (confidence.level === 'high' ? '高' : confidence.level === 'fairlyHigh' ? '较高' : confidence.level === 'moderate' ? '一般' : '低') +
    '。'

  summary += ' 风水调理是一个渐进过程，建议从最影响居住舒适度的问题开始，逐步优化。'

  return summary
}

// ────────── PipelineReport 适配 ──────────

/**
 * 将 ProfessionalFengShuiReport 转换为 PipelineReport（兼容旧格式）
 */
export function toPipelineReport(
  professional: ProfessionalFengShuiReport,
  visionResult: ImageAnalysisResult
): PipelineReport {
  const sections: ReportSection[] = []

  // 1. 综合评分（8维）
  sections.push({
    id: 'overall-score-8d',
    title: '一、综合评分',
    order: 1,
    type: 'summary',
    data: { score8d: professional.score8d, confidence: professional.confidence },
    content: generate8DScoreContent(professional.score8d, professional.confidence),
  })

  // 2. 空间格局解析
  sections.push({
    id: 'pattern-analysis',
    title: '二、空间格局解析',
    order: 2,
    type: 'analysis',
    data: professional.patternAnalysis,
    content: generatePatternAnalysisContent(professional.patternAnalysis),
  })

  // 3. 问题优先级
  sections.push({
    id: 'issue-priority',
    title: '三、问题优先级',
    order: 3,
    type: 'risk',
    data: { issues: professional.issues },
    content: generateIssuePriorityContent(professional.issues),
  })

  // 4. 调整方案
  sections.push({
    id: 'adjustment-plan',
    title: '四、调整方案',
    order: 4,
    type: 'suggestion',
    data: { adjustments: professional.allAdjustments },
    content: generateAdjustmentPlanContent(professional.allAdjustments),
  })

  // 5. 风险提示
  sections.push({
    id: 'risk-warning',
    title: '五、风险提示',
    order: 5,
    type: 'warning',
    data: { risks: professional.risks },
    content: generateRiskWarningContent(professional.risks),
  })

  // 6. 总体总结
  sections.push({
    id: 'overall-summary',
    title: '六、总体总结',
    order: 6,
    type: 'summary',
    data: { summary: professional.summary },
    content: '## 总体总结\n\n' + professional.summary,
  })

  return {
    title: (visionResult?.roomInfo?.type || '房屋') + '风水分析报告',
    sections,
    overallScore: professional.score8d.overall,
    confidence: professional.confidence.score,
  }
}

// ────────── Markdown 内容生成 ──────────

function generate8DScoreContent(score8d: FengShuiScore8D, confidence: AnalysisConfidence): string {
  const levelText: Record<string, string> = {
    excellent: '优秀', good: '良好', fair: '一般', poor: '需改善',
  }

  let md = '## 八维综合评分：' + score8d.overall + ' 分\n\n'
  md += '**分析可信度：' +
    (confidence.level === 'high' ? '高' : confidence.level === 'fairlyHigh' ? '较高' : confidence.level === 'moderate' ? '一般' : '低') +
    '**（' + confidence.score + '分）\n\n'

  if (confidence.reasons.length > 0) {
    md += '**可信度说明：** ' + confidence.reasons.join('；') + '\n\n'
  }

  md += '### 八维评分详情\n\n'
  md += '| 维度 | 评分 | 等级 | 权重 |\n'
  md += '|------|------|------|------|\n'

  const dims = [
    { key: '格局评分', value: score8d.pattern },
    { key: '藏风评分', value: score8d.windGathering },
    { key: '聚气评分', value: score8d.qiGathering },
    { key: '明堂评分', value: score8d.mingHall },
    { key: '动线评分', value: score8d.flowPath },
    { key: '光线评分', value: score8d.lighting },
    { key: '五行协调', value: score8d.elementHarmony },
    { key: '建议评分', value: score8d.advice },
  ]

  for (const dim of dims) {
    md += '| ' + dim.key + ' | ' + dim.value.score + ' | ' + levelText[dim.value.level] + ' | ' + dim.value.weight + '% |\n'
  }

  return md
}

function generatePatternAnalysisContent(pa: ProfessionalFengShuiReport['patternAnalysis']): string {
  let md = '## 空间格局解析\n\n'
  md += '### 格局描述\n\n' + pa.description + '\n\n'
  md += '### 风水原理\n\n' + pa.principle + '\n\n'
  md += '### 通俗解释\n\n' + pa.explanation + '\n\n'
  return md
}

function generateIssuePriorityContent(issues: ProfessionalFengShuiReport['issues']): string {
  if (issues.length === 0) {
    return '## 问题优先级\n\n未发现明显需要改善的问题，当前空间布局整体良好。'
  }

  let md = '## 问题优先级（共 ' + issues.length + ' 项）\n\n'

  const grouped = {
    severe: issues.filter(i => i.severity === 'severe'),
    significant: issues.filter(i => i.severity === 'significant'),
    moderate: issues.filter(i => i.severity === 'moderate'),
    suggestion: issues.filter(i => i.severity === 'suggestion'),
  }

  for (const [sev, items] of Object.entries(grouped)) {
    if (items.length === 0) continue
    const label = getSeverityLabel(sev as any)
    const icon = sev === 'severe' ? '🔴' : sev === 'significant' ? '🟠' : sev === 'moderate' ? '🟡' : '🟢'
    md += '### ' + icon + ' ' + label + '（' + items.length + '项）\n\n'
    for (const item of items) {
      md += '**' + item.title + '**\n\n'
      md += item.description + '\n\n'
      md += '> 原理：' + item.principle + '\n\n'
    }
  }

  return md
}

function generateAdjustmentPlanContent(adjustments: FengShuiAdjustment[]): string {
  if (adjustments.length === 0) {
    return '## 调整方案\n\n暂无需要调整的项目。'
  }

  let md = '## 调整方案（共 ' + adjustments.length + ' 项）\n\n'
  md += '每条建议均包含：问题 → 原因 → 改善方法 → 难度 → 预计效果 → 注意事项\n\n'

  for (let i = 0; i < adjustments.length; i++) {
    const adj = adjustments[i]
    md += '### ' + (i + 1) + '. [' + getSeverityLabel(adj.severity) + '] ' + adj.issue + '\n\n'
    md += '- **问题：** ' + adj.issue + '\n'
    md += '- **原因：** ' + adj.cause + '\n'
    md += '- **改善方法：** ' + adj.solution + '\n'
    md += '- **改善难度：** ' + getDifficultyLabel(adj.difficulty) + '\n'
    md += '- **预计效果：** ' + adj.expectedEffect + '\n'
    md += '- **注意事项：** ' + adj.cautions + '\n\n'
  }

  return md
}

function generateRiskWarningContent(risks: FengShuiRisk[]): string {
  if (risks.length === 0) {
    return '## 风险提示\n\n未发现明显风险。'
  }

  let md = '## 风险提示\n\n'
  md += '> 以下提示旨在帮助您全面了解空间可能带来的影响。标注「传统风水观点」的内容源于风水理论，标注「空间布局建议」的内容基于环境科学。\n\n'

  const longTerm = risks.filter(r => r.type === 'longTerm')
  const shortTerm = risks.filter(r => r.type === 'shortTerm')

  if (longTerm.length > 0) {
    md += '### 长期可能影响\n\n'
    for (const risk of longTerm) {
      const tag = risk.isTraditionalView ? '【传统风水观点】' : '【空间布局建议】'
      md += '- ' + tag + ' ' + risk.description + '\n'
    }
    md += '\n'
  }

  if (shortTerm.length > 0) {
    md += '### 短期可能影响\n\n'
    for (const risk of shortTerm) {
      const tag = risk.isTraditionalView ? '【传统风水观点】' : '【空间布局建议】'
      md += '- ' + tag + ' ' + risk.description + '\n'
    }
    md += '\n'
  }

  return md
}

// ────────── 可信度计算 ──────────

export function calculateAnalysisConfidence(options: {
  imageQualityScore: number
  visionDetectedCount: number
  ruleMatchCount: number
  hasUserInput: boolean
  analysisDurationMs: number
}): AnalysisConfidence {
  const { imageQualityScore, visionDetectedCount, ruleMatchCount, hasUserInput, analysisDurationMs } = options

  let score = 0
  const reasons: string[] = []

  // 图片质量影响（最高40分）
  const imageFactor = Math.min(40, imageQualityScore * 0.4)
  score += imageFactor
  if (imageQualityScore >= 80) {
    reasons.push('图片质量良好，细节清晰可辨')
  } else if (imageQualityScore >= 60) {
    reasons.push('图片质量尚可，部分细节可能不够清晰')
  } else {
    reasons.push('图片质量一般，可能影响分析精度')
  }

  // AI识别丰富度（最高25分）
  const visionFactor = Math.min(25, visionDetectedCount * 5)
  score += visionFactor
  if (visionDetectedCount >= 5) {
    reasons.push('AI识别到丰富的空间元素')
  } else if (visionDetectedCount >= 2) {
    reasons.push('AI识别到部分空间元素')
  } else {
    reasons.push('AI识别的空间元素较少')
  }

  // 规则匹配度（最高20分）
  const ruleFactor = Math.min(20, ruleMatchCount * 4)
  score += ruleFactor
  if (ruleMatchCount >= 5) {
    reasons.push('规则匹配充分，分析依据扎实')
  } else if (ruleMatchCount >= 2) {
    reasons.push('规则匹配尚可')
  } else {
    reasons.push('规则匹配较少，分析以通用原则为主')
  }

  // 用户输入补充（最高10分）
  if (hasUserInput) {
    score += 10
    reasons.push('用户提供的信息补充了分析依据')
  }

  // 分析时长（最高5分，太快可能意味着降级处理）
  if (analysisDurationMs >= 5000) {
    score += 5
    reasons.push('分析过程完整')
  } else if (analysisDurationMs >= 2000) {
    score += 3
    reasons.push('分析过程较为快速')
  } else {
    reasons.push('分析过程较快，部分步骤可能使用降级处理')
  }

  score = Math.round(Math.min(100, Math.max(0, score)))

  let level: AnalysisConfidence['level'] = 'low'
  if (score >= 85) level = 'high'
  else if (score >= 70) level = 'fairlyHigh'
  else if (score >= 50) level = 'moderate'

  return {
    level,
    score,
    reasons,
    imageQualityFactors: {
      clarity: Math.round(imageQualityScore * 0.8),
      lighting: Math.round(imageQualityScore * 0.7),
      angle: 70,
      coverage: Math.min(100, visionDetectedCount * 15),
    },
  }
}
