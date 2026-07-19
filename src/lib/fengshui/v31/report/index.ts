/**
 * 玄风门 V3.1 - 12板块专业报告生成器
 *
 * 基于12维评分、规则匹配与视觉分析结果，生成结构化专业报告。
 * 所有描述采用客观措辞（建议/倾向/可能/通常/结合传统风水理论），避免绝对化表述。
 */

import type {
  Score12DResult,
  ProfessionalReportV31,
  PatternAnalysis,
  WindQiAnalysis,
  WealthAnalysis,
  HealthAnalysis,
  CareerAnalysis,
  FamilyAnalysis,
  ReportIssue,
  RemediationPlanV31,
  ClassicalInterpretation,
  ImageAnnotation,
  CredibilityResultV31,
  FengShuiSchoolConfig,
  FengShuiRuleV31,
  Severity,
  DifficultyLevel,
  RuleCategory,
  RemediationCost,
  OverallEvaluation,
  CoreIssue,
  StrengthPattern,
  RiskAnalysis,
  RiskDimension,
  RiskLevel,
  PriorityRanking,
  PriorityItem,
  AdviceItem,
  LongTermLayout,
  CautionItem,
  MasterSummary,
} from '../types'

import type { PipelineReport, ReportSection } from '../../pipeline'
import { getRuleById } from '../rules/registry'
import type { RuleMatchResult } from '../rules/registry'

// ═══════════════════════════════════════════════
// 常量与映射
// ═══════════════════════════════════════════════

/** 严重等级排序权重（数字越小越严重） */
const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  severe: 1,
  significant: 2,
  moderate: 3,
  suggestion: 4,
}

/** 严重等级中文标签 */
const SEVERITY_LABELS: Record<Severity, string> = {
  critical: '严重',
  severe: '较重',
  significant: '显著',
  moderate: '一般',
  suggestion: '建议',
}

/** 严重等级到星级映射 */
const SEVERITY_STARS: Record<Severity, string> = {
  critical: '★★★★★',
  severe: '★★★★',
  significant: '★★★',
  moderate: '★★',
  suggestion: '★',
}

/** 整改成本中文映射 */
const COST_LABELS: Record<RemediationCost, string> = {
  free: '无成本',
  low: '低成本',
  medium: '中等成本',
  high: '较高成本',
  veryHigh: '高成本',
}

/** 难度等级中文映射 */
const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: '极易',
  2: '容易',
  3: '中等',
  4: '较难',
  5: '困难',
}

/** 流派名称映射 */
const SCHOOL_NAMES: Record<string, string> = {
  general: '通用风水',
  bazhai: '八宅派',
  xuankong: '玄空飞星',
  jiugong: '九宫飞星',
  yangzhai: '阳宅三要',
  sanyuan: '三元九运',
  luantou: '峦头派',
  liqi: '理气派',
}

// ═══════════════════════════════════════════════
// 主入口：构建 V3.1 专业报告
// ═══════════════════════════════════════════════

export function buildProfessionalReportV31(options: {
  score12D: Score12DResult
  ruleMatches: RuleMatchResult[]
  visionResult: any
  annotations: ImageAnnotation[]
  credibility: CredibilityResultV31
}): ProfessionalReportV31 {
  const { score12D, ruleMatches, visionResult, annotations, credibility } = options

  // 提取已匹配的规则列表
  const matchedRules = ruleMatches
    .filter(r => r.matched && r.rule)
    .map(r => r.rule)

  // 构建12大分析板块
  const patternAnalysis = buildPatternAnalysis(score12D, matchedRules)
  const windQiAnalysis = buildWindQiAnalysis(score12D, matchedRules)
  const wealthAnalysis = buildWealthAnalysis(score12D, matchedRules, visionResult)
  const healthAnalysis = buildHealthAnalysis(score12D, matchedRules)
  const careerAnalysis = buildCareerAnalysis(score12D, matchedRules)
  const familyAnalysis = buildFamilyAnalysis(score12D, matchedRules)
  const issues = buildIssues(matchedRules)
  const remediationPlans = buildRemediationPlans(matchedRules)
  const classicalInterpretation = buildClassicalInterpretation(matchedRules)
  const summary = buildOverallSummary(score12D, issues, credibility)
  const schools = buildSchools(matchedRules)

  // V3.2 新增十大板块
  const overallEvaluation = buildOverallEvaluation(score12D, matchedRules, credibility)
  const coreIssues = buildCoreIssues(matchedRules, score12D)
  const strengthPatterns = buildStrengthPatterns(score12D, matchedRules)
  const riskAnalysis = buildRiskAnalysis(score12D, matchedRules)
  const priorityRanking = buildPriorityRanking(matchedRules, score12D)
  const sevenDayAdvice = buildSevenDayAdvice(matchedRules, score12D)
  const oneMonthAdvice = buildOneMonthAdvice(matchedRules, score12D)
  const longTermLayout = buildLongTermLayout(score12D, matchedRules)
  const cautions = buildCautions(score12D, matchedRules)
  const masterSummary = buildMasterSummary(score12D, credibility, issues)

  return {
    score12D,
    patternAnalysis,
    windQiAnalysis,
    wealthAnalysis,
    healthAnalysis,
    careerAnalysis,
    familyAnalysis,
    issues,
    remediationPlans,
    classicalInterpretation,
    summary,
    credibility,
    annotations,
    schools,
    overallEvaluation,
    coreIssues,
    strengthPatterns,
    riskAnalysis,
    priorityRanking,
    sevenDayAdvice,
    oneMonthAdvice,
    longTermLayout,
    cautions,
    masterSummary,
  }
}

// ═══════════════════════════════════════════════
// 转换入口：生成 PipelineReport 兼容格式
// ═══════════════════════════════════════════════

/**
 * 将 V3.1 专业报告转换为 PipelineReport 兼容格式
 * 生成12个板块的 Markdown 内容
 */
export function toPipelineReportV31(professional: ProfessionalReportV31): PipelineReport {
  const sections: ReportSection[] = []

  // ① 综合评价（含12维评分表格）
  sections.push({
    id: 'v31-overall-score',
    title: '一、综合评价',
    order: 1,
    type: 'summary',
    content: generateOverallScoreMarkdown(professional.score12D, professional.credibility),
    data: { score12D: professional.score12D, credibility: professional.credibility },
  })

  // ② 空间格局分析
  sections.push({
    id: 'v31-pattern',
    title: '二、空间格局分析',
    order: 2,
    type: 'analysis',
    content: generatePatternMarkdown(professional.patternAnalysis),
    data: professional.patternAnalysis,
  })

  // ③ 藏风聚气分析
  sections.push({
    id: 'v31-wind-qi',
    title: '三、藏风聚气分析',
    order: 3,
    type: 'analysis',
    content: generateWindQiMarkdown(professional.windQiAnalysis),
    data: professional.windQiAnalysis,
  })

  // ④ 财位分析
  sections.push({
    id: 'v31-wealth',
    title: '四、财位分析',
    order: 4,
    type: 'analysis',
    content: generateWealthMarkdown(professional.wealthAnalysis),
    data: professional.wealthAnalysis,
  })

  // ⑤ 健康运势分析
  sections.push({
    id: 'v31-health',
    title: '五、健康运势分析',
    order: 5,
    type: 'analysis',
    content: generateHealthMarkdown(professional.healthAnalysis),
    data: professional.healthAnalysis,
  })

  // ⑥ 事业财运分析
  sections.push({
    id: 'v31-career',
    title: '六、事业财运分析',
    order: 6,
    type: 'analysis',
    content: generateCareerMarkdown(professional.careerAnalysis),
    data: professional.careerAnalysis,
  })

  // ⑦ 家庭关系分析
  sections.push({
    id: 'v31-family',
    title: '七、家庭关系分析',
    order: 7,
    type: 'analysis',
    content: generateFamilyMarkdown(professional.familyAnalysis),
    data: professional.familyAnalysis,
  })

  // ⑧ 主要问题列表（按严重等级排序）
  sections.push({
    id: 'v31-issues',
    title: '八、主要问题列表',
    order: 8,
    type: 'risk',
    content: generateIssuesMarkdown(professional.issues),
    data: { issues: professional.issues },
  })

  // ⑨ 整改优先级（★★★★★ 到 ★ 分级）
  sections.push({
    id: 'v31-priority',
    title: '九、整改优先级',
    order: 9,
    type: 'suggestion',
    content: generatePriorityMarkdown(professional.remediationPlans),
    data: { remediationPlans: professional.remediationPlans },
  })

  // ⑩ 详细整改方案（问题→原因→方法→难度→成本→效果）
  sections.push({
    id: 'v31-remediation',
    title: '十、详细整改方案',
    order: 10,
    type: 'suggestion',
    content: generateRemediationMarkdown(professional.remediationPlans),
    data: { remediationPlans: professional.remediationPlans },
  })

  // ⑪ 经典风水原理解读
  sections.push({
    id: 'v31-classical',
    title: '十一、经典风水原理解读',
    order: 11,
    type: 'evidence',
    content: generateClassicalMarkdown(professional.classicalInterpretation),
    data: professional.classicalInterpretation,
  })

  // ⑫ 整体结论
  sections.push({
    id: 'v31-summary',
    title: '十二、整体结论',
    order: 12,
    type: 'summary',
    content: '## 整体结论\n\n' + professional.summary,
    data: { summary: professional.summary },
  })

  return {
    title: '玄风门 V3.1 专业风水分析报告',
    sections,
    overallScore: professional.score12D.overall,
    confidence: professional.credibility.score,
  }
}

// ═══════════════════════════════════════════════
// 各板块构建函数
// ═══════════════════════════════════════════════

/** 构建空间格局分析 */
function buildPatternAnalysis(score12D: Score12DResult, rules: FengShuiRuleV31[]): PatternAnalysis {
  const patternScore = score12D.dimensions.pattern.score
  const strength: string[] = []
  const weakness: string[] = []

  let description: string
  let principle: string
  let explanation: string

  if (patternScore >= 85) {
    description = '结合传统风水理论分析，该空间整体格局较为方正均衡，气场分布可能较为均匀，属于较理想的居住结构。'
    principle = '《黄帝宅经》云"宅以形势为身体"，方正之宅如人之躯体端正，气血运行通常较为通畅。'
    explanation = '通俗而言，该空间的"骨架"较为端正，居住者通常能感到更加安定舒适，整体环境倾向于支持居住者的日常生活与运势发展。'
    strength.push('户型方正，八卦方位较为完整')
    strength.push('气场分布通常较为均匀，结构性缺陷较少')
  } else if (patternScore >= 70) {
    description = '该空间整体格局基本方正，个别区域可能存在轻微不规则，整体气场流通通常尚可。'
    principle = '形势为风水之本，虽有微小不足，但通常不影响大局，适当调整可能有助于趋吉避凶。'
    explanation = '整体结构无明显重大问题，个别角落或区域可能略有不足，通常可通过软装或家具摆放进行视觉与能量调和。'
    strength.push('户型基本满足居住要求')
    weakness.push('个别区域可能存在轻微气场受阻，建议适当优化')
  } else if (patternScore >= 50) {
    description = '该空间格局存在一定不规则，部分区域气场可能受阻，建议结合实际情况重点关注。'
    principle = '形势不整则气散，缺角或异形可能导致气场分布失衡，通常需通过布局和软装进行调和。'
    explanation = '空间"骨架"存在一定偏斜或缺口，某些区域可能让人感觉不够安定，适当调整通常有助于改善居住体验。'
    weakness.push('户型存在一定缺陷，可能影响局部气场流通')
    weakness.push('建议通过隔断或家具摆放进行空间重塑')
  } else {
    description = '该空间格局缺陷较为明显，气场分布可能不均，建议系统性地进行空间调理。'
    principle = '《阳宅十书》指出形势不正则煞气易生，需从布局根源着手改善。'
    explanation = '空间结构存在较明显问题，可能给居住者带来长期的不适感，建议优先考虑结构调整或大型隔断布置。'
    weakness.push('户型缺陷明显，气场分布不均')
    weakness.push('可能需要通过大型家具或隔断进行空间重塑')
    weakness.push('建议结合专业意见进行系统调理')
  }

  // 结合匹配规则补充细节
  const missingCornerRule = rules.find(r =>
    r.condition.target?.includes('缺角') || r.tags.includes('缺角')
  )
  if (missingCornerRule) {
    weakness.push(`识别到缺角倾向：${missingCornerRule.impact.description}`)
  }

  const throughHallRule = rules.find(r =>
    r.condition.target?.includes('穿堂') || r.tags.includes('穿堂风')
  )
  if (throughHallRule) {
    weakness.push(`存在穿堂风可能：${throughHallRule.impact.description}`)
  }

  return { description, principle, explanation, strength, weakness }
}

/** 构建藏风聚气分析 */
function buildWindQiAnalysis(score12D: Score12DResult, rules: FengShuiRuleV31[]): WindQiAnalysis {
  const airFlow = score12D.dimensions.airFlow.score
  const windQi = score12D.dimensions.windQi.score
  const suggestions: string[] = []

  let description: string
  let qiFlow: string
  let windGathering: string

  if (windQi >= 80) {
    description = '藏风聚气条件较为理想，室内气场通常能够较好地聚集与留存，外部生气进入后不易快速散失。'
    qiFlow = '气流回旋有序，动线通常较为流畅，不易形成明显的死角或滞气区。'
    windGathering = '门窗关系通常较为协调，不易形成严重的穿堂风，能量倾向于在室内停留。'
    suggestions.push('可继续保持当前布局，定期检查门窗密封性')
  } else if (windQi >= 60) {
    description = '藏风聚气条件尚可，局部区域可能存在轻微的能量散失，通常可通过微调改善。'
    qiFlow = '整体气流通常较为顺畅，个别走廊或角落可能出现轻微滞气。'
    windGathering = '聚气能力一般，部分区域可能因门窗直对而导致气场外泄。'
    suggestions.push('建议在气流过快的通道增设屏风或绿植隔断')
    suggestions.push('玄关区域可适当布置以减缓气流直冲')
  } else {
    description = '藏风聚气效果可能偏弱，明堂或中宫区域可能存在一定的压迫或通透过度，建议重点关注。'
    qiFlow = '气流可能存在直进直出或局部严重滞气的情况，回旋空间不足。'
    windGathering = '聚气能力偏弱，外部生气进入后容易快速散失，室内能量场可能不够稳定。'
    suggestions.push('建议在入户门与阳台/窗户之间增设隔断或玄关柜')
    suggestions.push('中宫区域宜保持开阔，避免堆放杂物')
    suggestions.push('卧室门尽量避免正对卫生间门或厨房门')
  }

  // 结合规则
  const crossWindRule = rules.find(r => r.tags.includes('穿堂风') || r.condition.target?.includes('穿堂'))
  if (crossWindRule) {
    suggestions.push(`针对穿堂风问题：${crossWindRule.solution.summary}`)
  }

  return { description, qiFlow, windGathering, suggestions }
}

/** 构建财位分析 */
function buildWealthAnalysis(score12D: Score12DResult, rules: FengShuiRuleV31[], visionResult: any): WealthAnalysis {
  const wealthScore = score12D.dimensions.wealth.score
  const suggestions: string[] = []
  const wealthPositions: WealthAnalysis['wealthPositions'] = []

  let description: string

  if (wealthScore >= 80) {
    description = '财位条件通常较为理想，客厅与主要活动区域的布局可能有利于聚财。结合传统风水理论，明财位与暗财位通常较为通畅。'
    wealthPositions.push({
      name: '客厅明财位',
      location: '通常位于客厅大门对角线位置',
      status: 'good',
      suggestion: '建议保持该位置整洁明亮，可布置招财植物或聚宝盆',
    })
    suggestions.push('财位区域宜保持整洁，避免堆放杂物')
    suggestions.push('可适当布置阔叶绿植以增强生气')
  } else if (wealthScore >= 60) {
    description = '财位表现一般，可能存在一定的压制或通道不畅，建议结合具体户型进行优化。'
    wealthPositions.push({
      name: '客厅明财位',
      location: '大门对角线区域',
      status: 'average',
      suggestion: '建议清理该区域的杂物，确保气场流通',
    })
    suggestions.push('检查财位是否被家具或杂物遮挡')
    suggestions.push('避免在财位放置带刺植物或垃圾桶')
  } else {
    description = '财位条件可能偏弱，聚财能力可能受到明显压制，建议重点规划与调整。'
    wealthPositions.push({
      name: '客厅明财位',
      location: '大门对角线区域',
      status: 'poor',
      suggestion: '该位置可能存在明显问题，建议优先处理',
    })
    suggestions.push('建议重新规划客厅布局，确保财位不被横梁或尖角对冲')
    suggestions.push('可考虑使用屏风或柜子进行气场引导')
    suggestions.push('结合传统风水理论，财位宜静不宜动，避免设置走道')
  }

  // 从规则中提取财位相关信息
  const wealthRules = rules.filter(r => r.category === 'wealth')
  if (wealthRules.length > 0) {
    for (const rule of wealthRules.slice(0, 2)) {
      wealthPositions.push({
        name: rule.name,
        location: rule.applicableRooms.join('、') || '待定',
        status: rule.severity === 'critical' || rule.severity === 'severe' ? 'poor' : 'average',
        suggestion: rule.solution.summary,
      })
    }
  }

  return { description, wealthPositions, suggestions }
}

/** 构建健康运势分析 */
function buildHealthAnalysis(score12D: Score12DResult, rules: FengShuiRuleV31[]): HealthAnalysis {
  const healthScore = score12D.dimensions.health.score
  const healthFactors: string[] = []
  const riskAreas: string[] = []
  const suggestions: string[] = []

  let description: string

  if (healthScore >= 80) {
    description = '环境健康度通常较高，卧室与卫生间的布局可能较为合理，通风与采光条件倾向于支持居住者的身心健康。'
    healthFactors.push('卧室布局通常利于休息与恢复')
    healthFactors.push('通风条件可能较好，有助于保持空气清新')
    healthFactors.push('采光通常充足，有助于调节生物钟与情绪')
    suggestions.push('继续保持良好的通风与采光习惯')
    suggestions.push('定期检查卧室床垫与枕头的舒适度')
  } else if (healthScore >= 60) {
    description = '健康影响表现中等，个别房间或环境因子可能存在一定的优化空间，建议关注卧室与卫生间的位置关系。'
    healthFactors.push('整体环境通常不会对健康造成明显不利影响')
    riskAreas.push('卧室门可能对卫生间门或厨房门，存在一定的健康隐患倾向')
    suggestions.push('建议关注卧室的私密性与安静程度')
    suggestions.push('卫生间宜保持干燥清洁，避免湿气外溢')
  } else {
    description = '环境可能存在较多不利于健康的因素，建议系统排查卧室、卫生间与厨房的布局关系。'
    healthFactors.push('整体环境可能需要较多调整以提升健康支持度')
    riskAreas.push('卧室可能受到动区或卫生间的明显干扰')
    riskAreas.push('通风或采光不足可能影响居住者长期健康')
    suggestions.push('优先调整卧室位置或门向，避免直冲')
    suggestions.push('增加室内绿植以改善空气质量')
    suggestions.push('考虑使用空气净化器或加湿器等辅助设备')
  }

  // 结合规则
  const bedroomRules = rules.filter(r =>
    r.category === 'bedroom' && (r.severity === 'severe' || r.severity === 'critical')
  )
  if (bedroomRules.length > 0) {
    riskAreas.push(`卧室相关规则命中 ${bedroomRules.length} 项较严重问题，建议优先处理`)
  }

  return { description, healthFactors, riskAreas, suggestions }
}

/** 构建事业财运分析 */
function buildCareerAnalysis(score12D: Score12DResult, rules: FengShuiRuleV31[]): CareerAnalysis {
  const careerScore = score12D.dimensions.career.score
  const careerFactors: string[] = []
  const opportunities: string[] = []
  const obstacles: string[] = []
  const suggestions: string[] = []

  let description: string

  if (careerScore >= 80) {
    description = '事业运势受空间环境正向支撑的可能性较高，办公与思考区域的布局通常较为合理，有助于专注与决策。'
    careerFactors.push('书房或办公区域光线通常充足')
    careerFactors.push('空间安静度可能较好，利于深度思考')
    opportunities.push('当前空间布局可能有助于提升工作效率')
    opportunities.push('财位通畅可能间接支持事业发展')
    suggestions.push('建议在书桌左侧摆放文昌塔或绿植以增强事业运')
    suggestions.push('保持办公区域整洁，避免文件堆积')
  } else if (careerScore >= 60) {
    description = '事业影响总体良好，书房或办公区可能存在一定的优化空间，通常可通过微调提升。'
    careerFactors.push('整体环境通常不会对事业造成明显阻碍')
    opportunities.push('通过调整书桌朝向或增加照明可能提升事业运')
    obstacles.push('书房可能存在光线不足或背对门窗的情况')
    suggestions.push('建议调整书桌位置，使其背靠实墙')
    suggestions.push('避免在办公区域正上方设置横梁')
  } else {
    description = '空间环境对事业发展的支撑可能偏弱，办公区域的布局与环境可能需要重点调整。'
    careerFactors.push('整体环境可能需要优化以更好地支持事业发展')
    obstacles.push('可能缺乏独立书房或办公区域')
    obstacles.push('现有办公位置可能存在背门、冲窗或横梁压顶等问题')
    suggestions.push('如条件允许，建议设置独立书房或办公角')
    suggestions.push('书桌宜背靠实墙，面向门窗但避免直冲')
    suggestions.push('结合传统风水理论，文昌位宜放置书桌或文房四宝')
  }

  return { description, careerFactors, opportunities, obstacles, suggestions }
}

/** 构建家庭关系分析 */
function buildFamilyAnalysis(score12D: Score12DResult, rules: FengShuiRuleV31[]): FamilyAnalysis {
  const familyScore = score12D.dimensions.family.score
  const harmonyFactors: string[] = []
  const tensionAreas: string[] = []
  const suggestions: string[] = []

  let description: string

  if (familyScore >= 80) {
    description = '家庭氛围通常较为和睦，公共区域的布局可能利于家人交流互动，私密空间界限通常较为清晰。'
    harmonyFactors.push('客厅布局通常利于家人聚集与交流')
    harmonyFactors.push('卧室私密性通常较好，有助于个人空间保护')
    suggestions.push('继续保持公共区域的温馨布置')
    suggestions.push('可在客厅摆放全家福或温馨装饰以增强家庭凝聚力')
  } else if (familyScore >= 60) {
    description = '家庭关系受空间影响表现一般，建议优化公共区域以促进家人互动，同时注意保护私密空间。'
    harmonyFactors.push('整体环境通常不会明显破坏家庭关系')
    tensionAreas.push('客厅可能缺乏温馨氛围或家具摆放不利于交流')
    suggestions.push('建议调整沙发摆放，使其形成围合式布局')
    suggestions.push('避免卧室门两两相对，以保护个人隐私')
  } else {
    description = '空间布局可能对家庭关系产生一定的不利影响，建议调整公私分区与公共区域布置。'
    harmonyFactors.push('通过适当调整通常可以改善家庭氛围')
    tensionAreas.push('公私分区可能不够明确，容易产生相互干扰')
    tensionAreas.push('客厅或餐厅布局可能不利于家人共同活动')
    suggestions.push('建议重新规划客厅家具，形成便于交流的布局')
    suggestions.push('卧室区域宜与动区适当隔离')
    suggestions.push('餐厅宜保持整洁，避免杂物堆积影响用餐氛围')
  }

  return { description, harmonyFactors, tensionAreas, suggestions }
}

/** 构建问题列表（按严重等级排序） */
function buildIssues(rules: FengShuiRuleV31[]): ReportIssue[] {
  if (rules.length === 0) {
    return [{
      id: 'ISSUE-GEN-001',
      title: '整体空间优化建议',
      severity: 'suggestion',
      category: 'living',
      description: '基于现有数据，未发现明显严重问题，建议保持空间整洁并定期优化布局。',
      principle: '结合传统风水理论，良好的居住环境需要持续维护与微调。',
      ruleId: 'FS-GEN-001',
    }]
  }

  const sorted = [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  return sorted.map((rule, idx) => ({
    id: `ISSUE-${String(idx + 1).padStart(3, '0')}-${rule.id}`,
    title: rule.name,
    severity: rule.severity,
    category: rule.category,
    description: rule.impact.description,
    principle: rule.source.interpretation || '结合传统风水理论分析，该问题可能对居住环境产生特定影响。',
    location: rule.applicableRooms.length > 0 ? rule.applicableRooms.join('、') : undefined,
    ruleId: rule.id,
  }))
}

/** 构建整改方案 */
function buildRemediationPlans(rules: FengShuiRuleV31[]): RemediationPlanV31[] {
  if (rules.length === 0) {
    return [{
      ruleId: 'FS-GEN-001',
      issue: '整体空间优化',
      cause: '基于现有空间条件，存在进一步提升居住舒适度的空间。',
      solution: {
        summary: '保持整洁，定期通风，适当增添绿植',
        steps: ['每周定期整理收纳', '每日开窗通风30分钟以上', '在客厅与卧室摆放适量绿植'],
        difficulty: 1,
        cost: 'low',
        timeRequired: '持续进行',
        diyPossible: true,
        expectedEffect: '空间整洁度与舒适度通常会有明显提升',
        cautions: ['避免一次性大量添置植物', '注意植物的光照需求'],
      },
      priority: 1,
      difficulty: 1,
      cost: 'low',
      expectedEffect: '空间整洁度与舒适度通常会有明显提升',
      urgency: 'optional',
      category: 'living',
    }]
  }

  const sorted = [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  return sorted.map(rule => ({
    ruleId: rule.id,
    issue: rule.name,
    cause: rule.impact.description,
    solution: rule.solution,
    priority: severityToPriority(rule.severity),
    difficulty: rule.solution.difficulty,
    cost: rule.solution.cost,
    expectedEffect: rule.solution.expectedEffect,
    urgency: severityToUrgency(rule.severity),
    category: rule.category,
  }))
}

/** 构建经典原理解读 */
function buildClassicalInterpretation(rules: FengShuiRuleV31[]): ClassicalInterpretation {
  const theories: ClassicalInterpretation['theories'] = []
  const seenBooks = new Set<string>()

  for (const rule of rules) {
    const book = rule.source.book
    if (book && !seenBooks.has(book)) {
      seenBooks.add(book)
      theories.push({
        name: rule.name,
        source: book + (rule.source.chapter ? `·${rule.source.chapter}` : ''),
        content: rule.source.quote || rule.source.interpretation,
        application: rule.explanation,
      })
    }
    if (theories.length >= 6) break
  }

  if (theories.length === 0) {
    theories.push({
      name: '形势与理气概要',
      source: '《黄帝宅经》',
      content: '宅以形势为身体，以泉水为血脉，以土地为皮肉，以草木为毛发。',
      application: '结合传统风水理论，住宅的整体形势是判断吉凶的基础，建议关注户型方正与气场流通。',
    })
    theories.push({
      name: '藏风聚气要义',
      source: '《葬书》',
      content: '气乘风则散，界水则止。古人聚之使不散，行之使有止，故谓之风水。',
      application: '气是风水理论的核心，合理的布局有助于气的聚集与流通，从而可能对居住者的运势产生积极影响。',
    })
  }

  return {
    theories,
    summary: `本报告综合引用 ${theories.length} 部经典文献的理论观点，结合现代空间分析技术，对当前环境进行多维度评估。传统风水理论认为"气"是环境能量的核心，合理的布局通常有助于气的聚集与流通。需要说明的是，风水调理属于环境优化手段，实际效果通常因人而异，建议理性看待并结合自身实际情况进行调整。`,
  }
}

/** 构建总体总结 */
function buildOverallSummary(
  score12D: Score12DResult,
  issues: ReportIssue[],
  credibility: CredibilityResultV31
): string {
  const overall = score12D.overall
  const level = score12D.level

  const levelDesc: Record<string, string> = {
    '优': '整体风水格局通常较为优良',
    '良': '整体风水条件通常良好',
    '平': '整体风水表现一般，尚有改善空间',
    '差': '整体风水条件可能偏弱，建议系统调理',
  }

  let summary = (levelDesc[level] || '整体风水条件尚可') + `，综合评分 ${overall} 分。`

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const severeCount = issues.filter(i => i.severity === 'severe').length
  const significantCount = issues.filter(i => i.severity === 'significant').length

  if (criticalCount > 0) {
    summary += ` 发现 ${criticalCount} 项严重问题，建议优先处理。`
  }
  if (severeCount > 0) {
    summary += ` 另有 ${severeCount} 项较严重问题需要关注。`
  }
  if (significantCount > 0) {
    summary += ` 还有 ${significantCount} 项显著问题可在后续逐步改善。`
  }

  if (issues.length === 0 || (criticalCount === 0 && severeCount === 0 && significantCount === 0)) {
    summary += ' 当前未发现明显严重问题，建议继续保持良好布局并定期微调。'
  }

  summary += ` 本次分析可信度为${credibility.score}分（${credibility.level}）。`
  summary += ' 风水调理通常是一个渐进过程，建议从最影响居住舒适度的问题开始，逐步优化。'
  summary += ' 需要强调的是，风水属于环境辅助手段，个人努力与心态调整通常更为关键。'

  return summary
}

/** 构建流派配置 */
function buildSchools(rules: FengShuiRuleV31[]): FengShuiSchoolConfig[] {
  const schoolMap = new Map<string, string[]>()

  for (const rule of rules) {
    const sid = rule.school
    if (!schoolMap.has(sid)) {
      schoolMap.set(sid, [])
    }
    schoolMap.get(sid)!.push(rule.id)
  }

  if (schoolMap.size === 0) {
    schoolMap.set('general', ['FS-GEN-001'])
  }

  return Array.from(schoolMap.entries()).map(([id, ruleIds]) => ({
    id: id as any,
    name: SCHOOL_NAMES[id] || id,
    description: `基于${SCHOOL_NAMES[id] || id}理论，本报告引用 ${ruleIds.length} 条相关规则进行分析与评估。`,
    weight: Math.min(50, Math.round(ruleIds.length * 8)),
    scoring: {
      id: `${id}-scoring`,
      name: `${SCHOOL_NAMES[id] || id}评分法`,
      calculate: () => ({ score: 70, details: ['结合传统风水理论进行综合评估'] }),
    },
    rules: ruleIds,
    enabled: true,
  }))
}

// ═══════════════════════════════════════════════
// V3.2 新增十大板块构建函数
// ═══════════════════════════════════════════════

/** 构建总体评价（风水师当面点评风格） */
function buildOverallEvaluation(
  score12D: Score12DResult,
  rules: FengShuiRuleV31[],
  credibility: CredibilityResultV31
): OverallEvaluation {
  const overall = score12D.overall
  const patternScore = score12D.dimensions.pattern.score
  const windQiScore = score12D.dimensions.windQi.score

  let opening: string
  let houseCharacter: string
  let inhabitantFit: string
  let closing: string

  if (overall >= 85) {
    opening = '这套宅子我看了，整体底子是不错的。能拿到这样的评分，说明户型本身的格局是经得起推敲的，住在这里的人，运势的基本面是稳的。'
    houseCharacter = '宅相属"清贵稳正"之格——方正有余气，藏风不漏气。这种格局的房子，不张扬但有后劲，就像一位沉稳的长者，看似平淡却自有分量。'
    inhabitantFit = '适合心性稳重、追求稳步发展的人家居住。若是正处于事业上升期或家庭建设期，这套宅子的气场能够托得住，不容易大起大落。'
    closing = '总的来说，这是一套"养人"的房子。住得越久，人和宅之间的契合度会越深，福气也会慢慢沉淀下来。后续注意维护好格局，不要随意改动承重墙和主要动线。'
  } else if (overall >= 70) {
    opening = '这套宅子整体来看，属于中上之选，底子不差，但也有几处需要留心的地方。我给你好好说道说道。'
    houseCharacter = '宅相偏"平和有余、生发稍欠"——格局基本端正，但在某些关键位置上气场的流通还不够顺畅。就像一潭静水，清是清的，就是活气稍显不足。'
    inhabitantFit = '适合追求安稳生活的家庭。如果住户本身运势偏旺，这套房子能稳住你的好运气；如果目前处于平稳期，也不会添乱，但要靠房子来"冲"运势的话，力量稍显不够。'
    closing = '整体来说，住是完全住得的。只要把几个关键的地方调理好，这套房子的能量还能再上一个台阶。风水不是一成不变的，住的人有心，宅气也会跟着变好。'
  } else if (overall >= 55) {
    opening = '这套宅子我得跟你说实话——中等偏下，有问题，但不是不能住。关键看你怎么调，调对了，还是能住得安稳的。'
    houseCharacter = '宅相属"待调理"之格——格局上有明显的短板，气场的聚合力偏弱。这种房子不是凶宅，就是"气"散了点，需要帮它收一收、聚一聚。'
    inhabitantFit = '如果你目前运势本身就比较旺，住进来问题不大，你的气场能镇得住。但如果最近各方面都不太顺，那这套房子可能会让情况雪上加霜，得先调理再入住。'
    closing = '别着急，风水上的问题，大多都是有解法的。关键是要抓主要矛盾，先把最影响生活质量的几个问题解决了，再慢慢优化。房子是死的，人是活的，有心调理，就一定能改善。'
  } else {
    opening = '这套宅子的问题比较多，我得跟你直说了——不是说不能住，但一定要好好调理，而且得有耐心，不是一朝一夕能改过来的。'
    houseCharacter = '宅相偏"气散格局弱"——户型的结构性问题比较突出，导致气场难以聚集。这种房子住久了，人的精气神容易耗散，做事也容易感到力不从心。'
    inhabitantFit = '如果是临时过渡住一段时间，问题不大。但如果打算长期居住，一定要做系统性的风水调理，而且最好结合住户的生辰八字来做针对性布局。'
    closing = '话说回来，风水里讲"一命二运三风水"，房子的影响是第三位的。人的意志和努力才是根本。只要你愿意花心思去调整，环境是会跟着变的。先从最要紧的问题入手，一步一步来。'
  }

  // 结合最高分和最低分维度增加个性化内容
  const dims = Object.values(score12D.dimensions).sort((a, b) => b.score - a.score)
  const bestDim = dims[0]
  const worstDim = dims[dims.length - 1]

  if (bestDim && bestDim.score >= 80) {
    houseCharacter += ` 特别值得一提的是${bestDim.name}这一项做得很好，${bestDim.description.replace(/。$/, '')}，这是这套宅子的亮点。`
  }

  if (worstDim && worstDim.score < 50) {
    inhabitantFit += ` 但要注意${worstDim.name}方面偏弱，${worstDim.description.replace(/。$/, '')}，这方面需要重点调理。`
  }

  return { opening, houseCharacter, inhabitantFit, closing }
}

/** 构建核心问题（Top 3-5，按严重程度排序） */
function buildCoreIssues(
  rules: FengShuiRuleV31[],
  score12D: Score12DResult
): CoreIssue[] {
  // 按严重程度排序，取最严重的 3-5 个
  const sorted = [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  const result: CoreIssue[] = []

  if (sorted.length === 0) {
    // 没有匹配到规则时，根据最低分维度生成
    const dims = Object.values(score12D.dimensions).sort((a, b) => a.score - b.score)
    const worst = dims[0]
    if (worst && worst.score < 70) {
      result.push({
        rank: 1,
        title: `${worst.name}有待提升`,
        location: '全屋整体',
        impact: worst.description,
        severity: 'moderate',
        rootCause: `空间在${worst.name}维度的设计或布局存在不足，导致该项评分偏低。`,
      })
    }
    return result
  }

  const topCount = Math.min(5, Math.max(3, sorted.length))

  for (let i = 0; i < topCount; i++) {
    const rule = sorted[i]
    result.push({
      rank: i + 1,
      title: rule.name,
      location: rule.applicableRooms.length > 0
        ? rule.applicableRooms.join('、')
        : '全屋相关区域',
      impact: rule.impact.description,
      severity: rule.severity,
      rootCause: rule.impact.longTerm || rule.impact.shortTerm,
    })
  }

  return result
}

/** 构建优势格局（2-3 条） */
function buildStrengthPatterns(
  score12D: Score12DResult,
  rules: FengShuiRuleV31[]
): StrengthPattern[] {
  const result: StrengthPattern[] = []
  const dims = Object.values(score12D.dimensions).sort((a, b) => b.score - a.score)

  // 从最高分维度提炼优势
  const topDims = dims.filter(d => d.score >= 75).slice(0, 3)

  const strengthTemplates: Record<string, { title: string; benefit: string }> = {
    pattern: {
      title: '方正格局·气场稳正',
      benefit: '户型端正则宅气均匀，居住者身心安定，做事有章法，财运稳中有进。',
    },
    airFlow: {
      title: '气流通畅·生机盎然',
      benefit: '气流循环良好则生气不息，居住者精神饱满，健康少病，家庭氛围活跃。',
    },
    lighting: {
      title: '采光充足·阳气旺盛',
      benefit: '阳光充沛则阴气不生，居住者心情开朗，贵人运旺，事业上容易得到提携。',
    },
    windQi: {
      title: '藏风聚气·财库丰盈',
      benefit: '能藏风则能聚气，能聚气则能聚财，居住者财运稳定，积蓄渐丰。',
    },
    wealth: {
      title: '财位清明·财源广进',
      benefit: '财位整洁通畅则财路开阔，正财偏财皆有起色，收入渠道多元。',
    },
    health: {
      title: '康泰之局·身安气和',
      benefit: '健康运好则精气神足，做事有干劲，生活质量高，家庭少病痛之忧。',
    },
    career: {
      title: '事业有靠·升迁可期',
      benefit: '文昌位与事业宫得位，则工作顺利，贵人相助，升职加薪机会增多。',
    },
    family: {
      title: '家和之象·其乐融融',
      benefit: '家庭气场和谐则夫妻和睦，子女孝顺，家宅安宁，万事兴旺。',
    },
    elements: {
      title: '五行调和·气场圆融',
      benefit: '五行平衡则五脏安和，情绪稳定，人际圆融，各方面运势均衡发展。',
    },
    cleanliness: {
      title: '洁净有序·心神安宁',
      benefit: '空间整洁则思绪清明，做事有条理，生活品质高，不易积累负面情绪。',
    },
    activityQuiet: {
      title: '动静得宜·张弛有道',
      benefit: '动静分区合理则作息有节，休息充分工作高效，生活节奏从容不迫。',
    },
    shaQi: {
      title: '煞气微弱·平安顺遂',
      benefit: '煞气少则意外少，居家平安，出入顺利，不必为突发之事烦心。',
    },
  }

  for (const dim of topDims) {
    const template = strengthTemplates[dim.dimension]
    if (template) {
      result.push({
        title: template.title,
        description: dim.description,
        location: '全屋',
        benefit: template.benefit,
      })
    }
  }

  // 如果高分维度不足，补充通用优势
  if (result.length < 2) {
    const overallLevel = score12D.level
    if (overallLevel === '优' || overallLevel === '良') {
      result.push({
        title: '整体协调·宅气和顺',
        description: '各维度评分较为均衡，没有明显的短板，整体风水格局协调统一。',
        location: '全屋',
        benefit: '均衡的格局意味着各方面运势平稳，不会大起大落，适合长期居住和发展。',
      })
    } else {
      result.push({
        title: '尚有可为·调理可期',
        description: '虽然整体评分有待提升，但空间的基本条件尚可，通过适当调理能够明显改善。',
        location: '全屋',
        benefit: '有调理空间就有提升运势的机会，只要方法得当，居住体验会逐步向好。',
      })
    }
  }

  return result.slice(0, 3)
}

/** 构建风险分析（健康/财运/事业/家庭各维度） */
function buildRiskAnalysis(
  score12D: Score12DResult,
  rules: FengShuiRuleV31[]
): RiskAnalysis {
  const healthScore = score12D.dimensions.health.score
  const wealthScore = score12D.dimensions.wealth.score
  const careerScore = score12D.dimensions.career.score
  const familyScore = score12D.dimensions.family.score

  function scoreToRisk(score: number): RiskLevel {
    if (score >= 85) return 'favorable'
    if (score >= 70) return 'low'
    if (score >= 55) return 'moderate'
    if (score >= 40) return 'elevated'
    return 'high'
  }

  function buildDimension(score: number, area: string, rulesForArea: FengShuiRuleV31[]): RiskDimension {
    const level = scoreToRisk(score)
    const levelDesc: Record<RiskLevel, string> = {
      favorable: '吉顺',
      low: '风险较低',
      moderate: '中等风险',
      elevated: '风险偏高',
      high: '风险较高',
    }

    const keyFactors: string[] = []
    const areaRules = rulesForArea.slice(0, 3)
    for (const rule of areaRules) {
      keyFactors.push(rule.impact.description)
    }

    if (keyFactors.length === 0) {
      if (score >= 70) {
        keyFactors.push('相关维度表现良好，暂无明显风险因素')
      } else if (score >= 50) {
        keyFactors.push('相关维度表现一般，存在一定的优化空间')
      } else {
        keyFactors.push('相关维度偏弱，需要重点关注和改善')
      }
    }

    const descriptionMap: Record<RiskLevel, string> = {
      favorable: `${area}方面运势向好，环境对此维度有明显的助益作用，保持现状即可。`,
      low: `${area}方面基本稳定，环境中的不利因素较少，日常稍加注意即可。`,
      moderate: `${area}方面存在一定风险，虽不至于造成严重影响，但长期忽视可能累积成患。`,
      elevated: `${area}方面风险偏高，相关问题已经对居住体验产生可感知的影响，建议尽快调理。`,
      high: `${area}方面风险较高，环境中的不利因素较为突出，需要优先处理并持续关注。`,
    }

    return {
      level,
      score,
      description: descriptionMap[level],
      keyFactors,
    }
  }

  // 按类别筛选规则
  const healthRules = rules.filter(r => r.category === 'health' || r.category === 'bedroom' || r.category === 'bathroom')
  const wealthRules = rules.filter(r => r.category === 'wealth' || r.category === 'kitchen')
  const careerRules = rules.filter(r => r.category === 'career' || r.category === 'living')
  const familyRules = rules.filter(r => r.category === 'family' || r.category === 'door')

  const health = buildDimension(healthScore, '健康', healthRules)
  const wealth = buildDimension(wealthScore, '财运', wealthRules)
  const career = buildDimension(careerScore, '事业', careerRules)
  const family = buildDimension(familyScore, '家庭', familyRules)

  // 整体风险评估
  const allLevels = [health.level, wealth.level, career.level, family.level]
  const riskOrder: Record<RiskLevel, number> = {
    favorable: 0, low: 1, moderate: 2, elevated: 3, high: 4,
  }
  const maxRisk = Math.max(...allLevels.map(l => riskOrder[l]))

  let overallAssessment: string
  if (maxRisk <= 1) {
    overallAssessment = '整体来看，这套宅子的风险水平较低，各方面运势基本平稳。居住者只需做好日常维护，保持良好的生活习惯，就能稳享安康。'
  } else if (maxRisk === 2) {
    overallAssessment = '整体风险处于中等水平，没有致命的大问题，但也不能掉以轻心。建议抓住主要问题进行调理，防微杜渐，避免小问题拖成大麻烦。'
  } else if (maxRisk === 3) {
    overallAssessment = '整体风险偏高，至少有一个维度的问题比较突出。建议制定一个调理计划，分步骤解决问题。先处理最影响生活质量的方面，再逐步优化其他维度。'
  } else {
    overallAssessment = '整体风险较高，多维度存在明显问题。这种情况下，建议系统性地进行风水调理，最好能请专业人士现场勘测，制定全面的整改方案。同时居住者也要保持积极心态，人的正能量是化解风水问题的重要因素。'
  }

  return { health, wealth, career, family, overallAssessment }
}

/** 构建调整优先级（按紧急程度排序） */
function buildPriorityRanking(
  rules: FengShuiRuleV31[],
  score12D: Score12DResult
): PriorityRanking {
  const sorted = [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  const immediate: PriorityItem[] = []
  const oneWeek: PriorityItem[] = []
  const oneMonth: PriorityItem[] = []
  const longTerm: PriorityItem[] = []

  if (sorted.length === 0) {
    // 没有匹配到具体规则时，根据评分给出通用建议
    const dims = Object.values(score12D.dimensions).sort((a, b) => a.score - b.score)
    const worst = dims[0]
    if (worst && worst.score < 60) {
      oneWeek.push({
        title: `改善${worst.name}`,
        reason: `${worst.name}评分仅${worst.score}分，是当前最薄弱的环节，优先改善能快速提升整体居住体验。`,
        category: 'living',
        estimatedTime: '3-7天',
      })
    }
    oneMonth.push({
      title: '整体空间优化',
      reason: '综合评分尚有提升空间，系统性的布局调整有助于各维度均衡发展。',
      category: 'living',
      estimatedTime: '2-4周',
    })
    longTerm.push({
      title: '持续维护与微调',
      reason: '风水贵在日常维护，定期清理与调整有助于保持宅气旺盛。',
      category: 'living',
      estimatedTime: '持续进行',
    })
  } else {
    for (const rule of sorted) {
      const item: PriorityItem = {
        title: rule.name,
        reason: rule.solution.expectedEffect || rule.impact.description,
        category: rule.category,
        estimatedTime: rule.solution.timeRequired,
      }

      if (rule.severity === 'critical' || rule.solution.difficulty <= 2) {
        if (immediate.length < 3) {
          immediate.push(item)
        } else if (oneWeek.length < 4) {
          oneWeek.push(item)
        } else {
          oneMonth.push(item)
        }
      } else if (rule.severity === 'severe') {
        if (oneWeek.length < 4) {
          oneWeek.push(item)
        } else {
          oneMonth.push(item)
        }
      } else if (rule.severity === 'significant') {
        if (oneMonth.length < 5) {
          oneMonth.push(item)
        } else {
          longTerm.push(item)
        }
      } else {
        if (longTerm.length < 4) {
          longTerm.push(item)
        }
      }
    }

    // 确保立即处理至少有 1 项（如果有严重问题）
    if (immediate.length === 0 && sorted.length > 0) {
      const top = sorted[0]
      immediate.push({
        title: top.name,
        reason: top.solution.expectedEffect || top.impact.description,
        category: top.category,
        estimatedTime: top.solution.timeRequired,
      })
      // 从 oneWeek 中移除重复
      const idx = oneWeek.findIndex(i => i.title === top.name)
      if (idx >= 0) oneWeek.splice(idx, 1)
    }
  }

  return { immediate, oneWeek, oneMonth, longTerm }
}

/** 构建七天内建议（立即可做的简单调整） */
function buildSevenDayAdvice(
  rules: FengShuiRuleV31[],
  score12D: Score12DResult
): AdviceItem[] {
  const advice: AdviceItem[] = []
  const sorted = [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  // 优先从容易整改的规则中提取（难度 1-2 星、无成本或低成本）
  const easyFixes = sorted.filter(r => r.solution.difficulty <= 2 && (r.solution.cost === 'free' || r.solution.cost === 'low'))

  for (let i = 0; i < Math.min(3, easyFixes.length); i++) {
    const rule = easyFixes[i]
    advice.push({
      id: `7D-${String(i + 1).padStart(2, '0')}`,
      title: rule.name,
      action: rule.solution.steps.slice(0, 2).join('；') || rule.solution.summary,
      reason: rule.impact.shortTerm || rule.impact.description,
      expectedEffect: rule.solution.expectedEffect,
      difficulty: DIFFICULTY_LABELS[rule.solution.difficulty],
    })
  }

  // 如果不足 3 条，根据最低分维度补充通用建议
  const dims = Object.values(score12D.dimensions).sort((a, b) => a.score - b.score)
  const lowDims = dims.filter(d => d.score < 70)

  const genericAdvice: Record<string, AdviceItem> = {
    cleanliness: {
      id: '7D-CLN',
      title: '全屋大扫除与整理',
      action: '用三天时间，每天整理一个房间，清除杂物，擦拭家具，拖洗地板，确保每个角落都干净整洁。',
      reason: '空间整洁是风水的基础，杂物堆积会阻碍气场流通，导致宅气沉滞。',
      expectedEffect: '通常在一周内能明显感受到空间明亮通透，心情也会随之舒畅。',
      difficulty: '容易',
    },
    airFlow: {
      id: '7D-AIR',
      title: '优化通风动线',
      action: '每天早晚各开窗通风 20 分钟，检查门窗开合是否顺畅，移除阻挡空气流通的家具或杂物。',
      reason: '气通则运顺，良好的通风能让陈旧之气排出，新鲜之气进入，维持空间能量的新陈代谢。',
      expectedEffect: '一周内空气质量明显改善，居住者精神状态更佳，不易感到沉闷倦怠。',
      difficulty: '极易',
    },
    lighting: {
      id: '7D-LIGHT',
      title: '增加照明亮度',
      action: '检查各房间的灯泡是否都亮着，暗角处添加小台灯或落地灯，白天尽量拉开窗帘让自然光进入。',
      reason: '光明属阳，阴暗属阴。阳气充足则阴气不生，人的精神和运势都会随之提升。',
      expectedEffect: '一周内心情更开朗，做事更有动力，家中氛围也会更加温馨。',
      difficulty: '极易',
    },
    wealth: {
      id: '7D-WEALTH',
      title: '清理财位杂物',
      action: '找到客厅大门对角线位置的明财位，清理该区域的杂物和垃圾桶，保持整洁明亮。',
      reason: '财位宜静宜净，杂物压迫财气则财运不畅。清理财位是聚财的第一步。',
      expectedEffect: '一周内可能会有意外之财或收入增加的机会，心理上也会感到更有底气。',
      difficulty: '容易',
    },
    health: {
      id: '7D-HEALTH',
      title: '卧室环境优化',
      action: '将床下的杂物全部清理出来，床头不靠窗，床上不要堆放物品，保持卧室干净清爽。',
      reason: '人在睡眠时气场最脆弱，卧室环境直接影响健康和恢复力。床下杂物易生浊气。',
      expectedEffect: '一周内睡眠质量改善，晨起精神更饱满，身体的疲劳感减轻。',
      difficulty: '容易',
    },
  }

  for (const dim of lowDims) {
    if (advice.length >= 5) break
    const ga = genericAdvice[dim.dimension]
    if (ga && !advice.find(a => a.id === ga.id)) {
      advice.push(ga)
    }
  }

  // 至少保证 3 条
  const minAdvice: AdviceItem[] = [
    {
      id: '7D-001',
      title: '每日开窗纳气',
      action: '每天上午 9-11 点之间开窗通风 15-30 分钟，让室外新鲜空气进入室内。',
      reason: '上午是阳气渐盛之时，此时通风能引入清阳之气，排出夜间积累的浊气。',
      expectedEffect: '坚持一周可明显改善室内空气质量，居住者精神更饱满。',
      difficulty: '极易',
    },
    {
      id: '7D-002',
      title: '整理桌面与台面',
      action: '每天晚上花 10 分钟整理餐桌、书桌、茶几等台面，不留下杂乱物品过夜。',
      reason: '台面如心境，杂乱的台面会让人思绪纷乱，整洁的环境有助于心神安宁。',
      expectedEffect: '一周内生活秩序感增强，做事效率提升，心情更加平和。',
      difficulty: '极易',
    },
    {
      id: '7D-003',
      title: '玄关清洁整理',
      action: '清理玄关处堆积的鞋子和杂物，擦净入户门，确保进门处通畅明亮。',
      reason: '玄关是气口，如同人的口鼻，气口通畅则宅气鲜活，气口阻塞则运势不畅。',
      expectedEffect: '一周内出入更加顺畅，家庭的整体运势会有微妙的提升。',
      difficulty: '容易',
    },
  ]

  for (const item of minAdvice) {
    if (advice.length >= 5) break
    if (!advice.find(a => a.id === item.id)) {
      advice.push(item)
    }
  }

  return advice.slice(0, 5)
}

/** 构建一个月改善建议（需要购买或施工的调整） */
function buildOneMonthAdvice(
  rules: FengShuiRuleV31[],
  score12D: Score12DResult
): AdviceItem[] {
  const advice: AdviceItem[] = []
  const sorted = [...rules].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )

  // 从中等难度、中等成本的规则中提取
  const mediumFixes = sorted.filter(r =>
    r.solution.difficulty >= 2 && r.solution.difficulty <= 4 &&
    (r.solution.cost === 'low' || r.solution.cost === 'medium')
  )

  for (let i = 0; i < Math.min(3, mediumFixes.length); i++) {
    const rule = mediumFixes[i]
    advice.push({
      id: `1M-${String(i + 1).padStart(2, '0')}`,
      title: rule.name,
      action: rule.solution.summary,
      reason: rule.impact.longTerm || rule.impact.description,
      expectedEffect: rule.solution.expectedEffect,
      cost: COST_LABELS[rule.solution.cost],
      difficulty: DIFFICULTY_LABELS[rule.solution.difficulty],
    })
  }

  // 如果不足，根据低分维度补充
  const dims = Object.values(score12D.dimensions).sort((a, b) => a.score - b.score)
  const lowDims = dims.filter(d => d.score < 65)

  const monthAdviceMap: Record<string, AdviceItem> = {
    windQi: {
      id: '1M-QI',
      title: '增设玄关屏风或隔断',
      action: '在入户门内设置玄关柜或屏风，高度约 1.2-1.5 米，宽度以能遮挡大门直对的视线为宜。',
      reason: '穿堂风是风水大忌，气直进直出则无法聚集。玄关能减缓气流速度，使气在屋内回旋。',
      expectedEffect: '一个月内能感受到家中气场更加沉稳，财运和健康运都会有所改善。',
      cost: '中等成本',
      difficulty: '中等',
    },
    wealth: {
      id: '1M-WEALTH',
      title: '财位布局强化',
      action: '在客厅明财位摆放阔叶绿植（如发财树、绿萝）或聚宝盆摆件，保持该区域灯光明亮。',
      reason: '绿植属木，木能生火（财），阔叶绿植有生发之意，有助于财运增长。',
      expectedEffect: '一个月后财运逐渐起色，收入来源可能增多，经济压力减轻。',
      cost: '低成本',
      difficulty: '容易',
    },
    pattern: {
      id: '1M-PATTERN',
      title: '缺角方位补角调理',
      action: '在户型缺角的方位放置相应的五行摆件或用家具、绿植进行视觉上的"补角"。',
      reason: '户型缺角如同身体残缺，对应方位的卦气不足，会影响相应的人事物。',
      expectedEffect: '一个月后对应方位的运势逐渐补足，家庭各方面更加均衡。',
      cost: '低成本',
      difficulty: '中等',
    },
    career: {
      id: '1M-CAREER',
      title: '书房/办公区优化',
      action: '调整书桌位置使其背靠实墙，面前有开阔空间，左侧放置绿植或文昌塔，避免横梁压顶。',
      reason: '背后有靠则事业有根基，面前开阔则前途光明，左方为青龙位，主贵人相助。',
      expectedEffect: '一个月内工作效率提升，思路更清晰，可能获得贵人提携或新的工作机会。',
      cost: '低成本',
      difficulty: '中等',
    },
    health: {
      id: '1M-HEALTH',
      title: '卧室风水全面调理',
      action: '调整床位朝向，避开床头对门、对镜、对卫生间等情况，更换合适的床品颜色。',
      reason: '人一生三分之一的时间在卧室度过，卧室风水直接影响健康和恢复能力。',
      expectedEffect: '一个月内睡眠质量显著提升，身体疲劳感减轻，气色好转。',
      cost: '中等成本',
      difficulty: '中等',
    },
    family: {
      id: '1M-FAMILY',
      title: '客厅聚气布局调整',
      action: '将沙发调整为围合式摆放，背靠实墙，前方有茶几，形成"藏风聚气"的格局。',
      reason: '客厅是家庭公共空间，布局得宜则家人关系和睦，聚少离多的情况会改善。',
      expectedEffect: '一个月内家人交流增多，家庭氛围更加温馨，矛盾摩擦减少。',
      cost: '无成本',
      difficulty: '中等',
    },
  }

  for (const dim of lowDims) {
    if (advice.length >= 5) break
    const ga = monthAdviceMap[dim.dimension]
    if (ga && !advice.find(a => a.id === ga.id)) {
      advice.push(ga)
    }
  }

  // 确保至少 3 条
  const fallback: AdviceItem[] = [
    {
      id: '1M-G01',
      title: '增添绿植生旺气',
      action: '在客厅和阳台各摆放 2-3 盆阔叶绿植，选择长势旺盛、叶片圆润的品种。',
      reason: '植物是活的能量体，能转化二氧化碳为氧气，在风水上称为"生发之气"，有助旺宅运。',
      expectedEffect: '一个月后家中生机盎然，居住者心情更愉悦，整体运势缓慢上升。',
      cost: '低成本',
      difficulty: '容易',
    },
    {
      id: '1M-G02',
      title: '调整照明层次',
      action: '为每个主要房间增加辅助光源，如落地灯、壁灯或射灯，形成主灯+辅灯的照明层次。',
      reason: '光线均匀则气场均匀，单一主灯会造成明暗反差过大，形成局部煞气。',
      expectedEffect: '一个月内居家舒适度提升，家人的情绪更加稳定平和。',
      cost: '中等成本',
      difficulty: '容易',
    },
    {
      id: '1M-G03',
      title: '软装色彩调和',
      action: '根据空间的五行属性，通过窗帘、靠垫、地毯等软装调整整体色调，使之和谐统一。',
      reason: '颜色有五行属性，色彩搭配和谐则五行流通，有助于气场的平衡与稳定。',
      expectedEffect: '一个月后家中氛围更加舒适，居住者的情绪和睡眠质量都会有所改善。',
      cost: '中等成本',
      difficulty: '中等',
    },
  ]

  for (const item of fallback) {
    if (advice.length >= 5) break
    if (!advice.find(a => a.id === item.id)) {
      advice.push(item)
    }
  }

  return advice.slice(0, 5)
}

/** 构建长期布局建议（大型改造或方位调整） */
function buildLongTermLayout(
  score12D: Score12DResult,
  rules: FengShuiRuleV31[]
): LongTermLayout[] {
  const layouts: LongTermLayout[] = []
  const overall = score12D.overall

  // 从高难度高成本的规则中提取
  const majorFixes = rules.filter(r =>
    r.solution.difficulty >= 4 && (r.solution.cost === 'high' || r.solution.cost === 'veryHigh')
  )

  for (let i = 0; i < Math.min(2, majorFixes.length); i++) {
    const rule = majorFixes[i]
    layouts.push({
      title: rule.name,
      description: rule.solution.summary,
      direction: rule.applicableRooms.join('、') || undefined,
      expectedEffect: rule.solution.expectedEffect,
      scope: `适用于${rule.category === 'door' ? '大门朝向' : rule.category === 'kitchen' ? '厨房位置' : '空间布局'}有较大调整空间的情况`,
    })
  }

  // 根据整体评分补充战略性建议
  if (overall >= 80) {
    layouts.push({
      title: '旺局巩固·九星布局',
      description: '在现有良好格局的基础上，结合流年飞星，在吉方位（如当年的财位、文昌位、桃花位）布置相应的风水物品，进一步催旺吉运。同时注意压制凶星方位，保持空间气场的动态平衡。',
      direction: '全屋各方位',
      expectedEffect: '长期来看，能将住宅的好运势保持并放大，家人各方面运势稳中有升，吉星高照。',
      scope: '适合格局已较为完善、希望进一步提升运势的家庭',
    })
  } else if (overall >= 60) {
    layouts.push({
      title: '中宫立极·气场重整',
      description: '以房屋的几何中心为中宫，清理中宫区域的杂物，保持开阔通畅。中宫是全屋气场的枢纽，中宫通则百脉通。在此基础上，再根据各方位的吉凶进行针对性布局。',
      direction: '房屋中宫（几何中心位置）',
      expectedEffect: '经过 3-6 个月的调理，全屋气场会重新有序流动，各方面运势逐渐走向均衡。',
      scope: '适合格局中等、整体气场不够通畅的住宅',
    })
  } else {
    layouts.push({
      title: '格局重构·分步改造',
      description: '对于格局缺陷较多的住宅，建议制定长期改造计划。第一阶段：清理杂物、打通关键动线，让气先"活"起来；第二阶段：调整主要功能区的位置，使动静分区合理；第三阶段：进行方位和五行层面的精细布局。循序渐进，不可一蹴而就。',
      direction: '全屋整体规划',
      expectedEffect: '经过 1-2 年的持续调理，住宅的整体风水会有质的飞跃，居住者的运势也会随之逐步改善。',
      scope: '适合格局问题较多、有条件进行阶段性改造的住宅',
    })
  }

  // 针对最低分维度添加专项长期建议
  const dims = Object.values(score12D.dimensions).sort((a, b) => a.score - b.score)
  const worstDim = dims[0]

  const longTermDimAdvice: Record<string, LongTermLayout> = {
    pattern: {
      title: '户型补缺·格局完善',
      description: '如果条件允许，可以通过扩建或加盖的方式补上户型的缺角。如果是租房或无法改动结构，可以通过在缺角方位放置大型家具或绿植进行"虚拟补角"，并长期坚持。',
      direction: '户型缺角的方位',
      expectedEffect: '长期坚持后，对应家庭成员的运势会逐渐补足，家庭整体格局更加完整。',
      scope: '户型有明显缺角的住宅',
    },
    wealth: {
      title: '财库营建·长效聚财',
      description: '在住宅的财位（明财位+暗财位）建立长效聚财布局，包括设置固定的财位区域、摆放聚宝盆或貔貅、保持财位常年整洁明亮。同时注意厨房（食禄位）的整洁与维护。',
      direction: '客厅财位 + 厨房',
      expectedEffect: '坚持半年以上，财运会逐渐稳定增长，积蓄增多，抗风险能力增强。',
      scope: '财运偏弱、希望长期积累财富的家庭',
    },
    health: {
      title: '康泰布局·养生宅法',
      description: '以卧室和厨房为核心进行长期健康布局。卧室选择宅之吉方位，床头朝向本命吉方；厨房注意水火既济，保持干燥清洁。同时在全屋布置有益于健康的绿植和空气净化设备。',
      direction: '卧室、厨房为主，全屋为辅',
      expectedEffect: '长期居住后，家人的整体健康水平提升，慢性病得到缓解，精力更充沛。',
      scope: '家中有老人、病人或特别关注健康的家庭',
    },
  }

  if (worstDim && longTermDimAdvice[worstDim.dimension] && layouts.length < 3) {
    layouts.push(longTermDimAdvice[worstDim.dimension])
  }

  return layouts.slice(0, 3)
}

/** 构建注意事项（风水禁忌提醒） */
function buildCautions(
  score12D: Score12DResult,
  rules: FengShuiRuleV31[]
): CautionItem[] {
  const cautions: CautionItem[] = []

  // 从已匹配的规则中提取注意事项
  for (const rule of rules) {
    if (rule.solution.cautions && rule.solution.cautions.length > 0) {
      for (let i = 0; i < Math.min(1, rule.solution.cautions.length); i++) {
        if (cautions.length >= 5) break
        cautions.push({
          title: `${rule.name}·注意`,
          content: rule.solution.cautions[i],
          level: rule.severity === 'critical' || rule.severity === 'severe' ? 'high' : rule.severity === 'significant' ? 'medium' : 'low',
          scenario: `涉及${rule.category}类问题的整改过程中`,
        })
      }
    }
  }

  // 补充通用风水禁忌（根据评分动态选择）
  const genericCautions: CautionItem[] = [
    {
      title: '横梁压顶不可忽视',
      content: '沙发、床、书桌等经常使用的家具上方，不可有横梁压顶。长期处于横梁下方，会压迫人的气场，导致压力增大、运势受阻。如果无法通过装修隐藏，可以用吊顶或装饰手法化解。',
      level: 'high',
      scenario: '客厅、卧室、书房的家具布局时',
    },
    {
      title: '门冲煞需警惕',
      content: '大门不可正对阳台窗户（穿堂风），卧室门不可正对卫生间门或厨房门，两扇门也不宜两两相对。门冲会导致气场相冲，影响相应区域的运势。可以用屏风、门帘或绿植进行遮挡化解。',
      level: 'high',
      scenario: '房屋格局评估和家具摆放时',
    },
    {
      title: '尖角煞宜避开',
      content: '家具的尖角、墙角的尖锐处不宜正对床、沙发或书桌。尖角在风水上属于"火煞"，长期受冲会导致脾气急躁、身体不适。可以将尖角打磨圆润，或用绿植、窗帘遮挡。',
      level: 'medium',
      scenario: '家具摆放和室内装饰时',
    },
    {
      title: '镜子摆放有讲究',
      content: '镜子不可正对床（尤其床头），不可正对大门，不可两面镜子相对。镜子属金，有反射之功，对床则影响睡眠和健康，对门则将气反射出去不利聚财。卧室镜子宜小宜隐。',
      level: 'medium',
      scenario: '卧室、玄关、卫生间的镜子布置时',
    },
    {
      title: '杂物堆积是大忌',
      content: '家中尤其是玄关、客厅、阳台和床下，不可堆积过多杂物。杂物属"滞气"，会阻碍气场流通，导致宅气沉滞，居住者容易精神不振、运势低迷。定期清理是最基本的风水调理。',
      level: 'medium',
      scenario: '日常居家生活中',
    },
  ]

  for (const caution of genericCautions) {
    if (cautions.length >= 5) break
    if (!cautions.find(c => c.title === caution.title)) {
      cautions.push(caution)
    }
  }

  return cautions.slice(0, 5)
}

/** 构建风水师总结寄语 */
function buildMasterSummary(
  score12D: Score12DResult,
  credibility: CredibilityResultV31,
  issues: ReportIssue[]
): MasterSummary {
  const overall = score12D.overall
  const level = score12D.level

  let paragraph1: string
  let paragraph2: string
  let signature: string

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const severeCount = issues.filter(i => i.severity === 'severe').length
  const totalIssues = issues.length

  if (overall >= 85) {
    paragraph1 = '以上便是对这套宅子的全面分析。总的来说，能遇到这样格局的房子是不容易的——宅正、气顺、运稳。这就好比遇到一位品行端正的朋友，相处久了，自然会被潜移默化地带向好的方向。你要做的，就是珍惜这份"地基"，好好维护，不要因为一时兴起就大拆大改，破坏了原有的好格局。'
    paragraph2 = '风水之道，讲究的是"和"——人与自然和、人与宅和、宅与环境和。这套宅子的底子已经很好了，接下来更多的是"养"。养什么呢？养德、养心、养习惯。人心善则宅气善，人勤则宅气盛，人和则宅气和。记住，再好的风水也抵不过一颗作恶的心，再差的格局也能被善行慢慢扭转。愿你在这宅子里，家兴业旺，四季平安。'
    signature = '——玄风门 · 观宅记'
  } else if (overall >= 70) {
    paragraph1 = `这套宅子的分析就到这里。${totalIssues > 0 ? `前前后后一共梳理出 ${totalIssues} 个需要注意的地方，其中${criticalCount > 0 ? ` ${criticalCount} 项比较要紧的，` : ''}${severeCount > 0 ? ` ${severeCount} 项需要关注的，` : ''}剩下的都是可以慢慢调整的小问题。` : '整体格局不错，没有发现明显的大问题。'}说实话，市面上大部分房子也都是这个水平——不差，但也有可以打磨的空间。就像一块璞玉，底子是有的，但需要巧手雕琢才能成器。`
    paragraph2 = '我给你的建议是：抓大放小，循序渐进。先把最影响居住体验的几个问题解决了，剩下的可以在日常生活中慢慢调整。风水不是一蹴而就的事，它是一个"人养宅、宅养人"的互动过程。你对房子好，房子自然也会对你好。保持积极的心态，养成整洁的习惯，心存善念，多行善事——这些才是最好的风水。祝你家宅安宁，万事如意。'
    signature = '——玄风门 · 观宅记'
  } else if (overall >= 55) {
    paragraph1 = `好了，这套宅子的情况我都给你分析清楚了。问题确实不少，${totalIssues > 0 ? `大大小小 ${totalIssues} 项，尤其是前几项核心问题，需要你认真对待。` : '整体格局偏弱，需要系统性调理。'}但我想跟你说句实在话——风水上的问题，十有八九都是有解法的，关键在于你愿不愿意花心思去做。不要一看到问题多就灰心，就觉得这房子不能住了。没那么严重。`
    paragraph2 = '我给你规划的三步走建议，你可以参考：先做七天内就能见效的小事，让自己先动起来，建立信心；再花一两个月做些中等难度的调整，把主要问题解决；最后做长期布局，慢慢把宅气养起来。记住一句话："福人居福地，福地福人居。"你是什么样的人，你的房子就会是什么样的气场。只要你心存正念、脚踏实地，环境一定会跟着变好。慢慢来，不着急。'
    signature = '——玄风门 · 观宅记'
  } else {
    paragraph1 = `这套宅子的分析已经全部完成。坦白说，问题确实比较多，${totalIssues > 0 ? `一共发现 ${totalIssues} 处需要调理的地方，其中 ${criticalCount} 项是比较严重的。` : '整体格局偏弱，需要做比较大的调整。'}如果你是打算买这套房子，我建议你慎重考虑；如果已经住进来了，也不要太担心——风水不是宿命，它只是环境的影响，而人是有主观能动性的。`
    paragraph2 = '我给你的建议是分阶段来：先稳住最基本的居住条件，确保健康和安全不受大的影响；然后逐步改善格局，让气场慢慢活起来；最后做长期规划，争取让宅气一年比一年好。这个过程可能需要一两年，甚至更久，但每做一步，就有一步的效果。最重要的是——不要被这些问题吓倒。人心的力量是最大的风水，只要你积极面对、努力改善，日子一定会越过越好。祝你早日安康，家宅渐兴。'
    signature = '——玄风门 · 观宅记'
  }

  return { paragraph1, paragraph2, signature }
}

// ═══════════════════════════════════════════════
// 严重等级映射工具
// ═══════════════════════════════════════════════

function severityToPriority(severity: Severity): DifficultyLevel {
  switch (severity) {
    case 'critical': return 5
    case 'severe': return 4
    case 'significant': return 3
    case 'moderate': return 2
    case 'suggestion': return 1
    default: return 1
  }
}

function severityToUrgency(severity: Severity): RemediationPlanV31['urgency'] {
  switch (severity) {
    case 'critical': return 'immediate'
    case 'severe': return 'shortTerm'
    case 'significant': return 'shortTerm'
    case 'moderate': return 'longTerm'
    case 'suggestion': return 'optional'
    default: return 'optional'
  }
}

// ═══════════════════════════════════════════════
// Markdown 内容生成
// ═══════════════════════════════════════════════

function generateOverallScoreMarkdown(score12D: Score12DResult, credibility: CredibilityResultV31): string {
  let md = '## 综合评价\n\n'
  md += `**综合评分：${score12D.overall} 分（等级：${score12D.level}）**\n\n`
  md += `**分析可信度：${credibility.score} 分（${credibility.level}）**\n\n`
  md += `> ${credibility.explanation}\n\n`

  md += '### 12维评分详情\n\n'
  md += '| 维度 | 评分 | 等级 | 权重 | 加权得分 |\n'
  md += '|------|------|------|------|----------|\n'

  const dims = Object.values(score12D.dimensions)
  for (const dim of dims) {
    md += `| ${dim.name} | ${dim.score} | ${dim.level} | ${dim.weight}% | ${dim.weightedScore} |\n`
  }

  md += '\n### 各维度评价概要\n\n'
  for (const dim of dims) {
    md += `- **${dim.name}**（${dim.score}分）：${dim.description}\n`
  }

  md += '\n### 总体评价\n\n'
  md += score12D.summary
  return md
}

function generatePatternMarkdown(pa: PatternAnalysis): string {
  let md = '## 空间格局分析\n\n'
  md += '### 格局描述\n\n' + pa.description + '\n\n'
  md += '### 风水原理\n\n' + pa.principle + '\n\n'
  md += '### 通俗解读\n\n' + pa.explanation + '\n\n'

  if (pa.strength.length > 0) {
    md += '### 格局优势\n\n'
    for (const s of pa.strength) {
      md += '- ' + s + '\n'
    }
    md += '\n'
  }

  if (pa.weakness.length > 0) {
    md += '### 格局不足\n\n'
    for (const w of pa.weakness) {
      md += '- ' + w + '\n'
    }
    md += '\n'
  }

  return md
}

function generateWindQiMarkdown(wa: WindQiAnalysis): string {
  let md = '## 藏风聚气分析\n\n'
  md += '### 总体描述\n\n' + wa.description + '\n\n'
  md += '### 气流状况\n\n' + wa.qiFlow + '\n\n'
  md += '### 聚气评估\n\n' + wa.windGathering + '\n\n'

  if (wa.suggestions.length > 0) {
    md += '### 改善建议\n\n'
    for (const s of wa.suggestions) {
      md += '- ' + s + '\n'
    }
    md += '\n'
  }

  return md
}

function generateWealthMarkdown(wa: WealthAnalysis): string {
  let md = '## 财位分析\n\n'
  md += '### 总体评估\n\n' + wa.description + '\n\n'

  if (wa.wealthPositions.length > 0) {
    md += '### 财位分布\n\n'
    md += '| 财位名称 | 位置 | 状态 | 建议 |\n'
    md += '|----------|------|------|------|\n'
    for (const wp of wa.wealthPositions) {
      const statusText = wp.status === 'good' ? '良好' : wp.status === 'average' ? '一般' : '偏弱'
      md += `| ${wp.name} | ${wp.location} | ${statusText} | ${wp.suggestion} |\n`
    }
    md += '\n'
  }

  if (wa.suggestions.length > 0) {
    md += '### 聚财建议\n\n'
    for (const s of wa.suggestions) {
      md += '- ' + s + '\n'
    }
    md += '\n'
  }

  return md
}

function generateHealthMarkdown(ha: HealthAnalysis): string {
  let md = '## 健康运势分析\n\n'
  md += '### 总体评估\n\n' + ha.description + '\n\n'

  if (ha.healthFactors.length > 0) {
    md += '### 健康有利因素\n\n'
    for (const f of ha.healthFactors) {
      md += '- ' + f + '\n'
    }
    md += '\n'
  }

  if (ha.riskAreas.length > 0) {
    md += '### 健康风险区域\n\n'
    for (const r of ha.riskAreas) {
      md += '- ' + r + '\n'
    }
    md += '\n'
  }

  if (ha.suggestions.length > 0) {
    md += '### 健康改善建议\n\n'
    for (const s of ha.suggestions) {
      md += '- ' + s + '\n'
    }
    md += '\n'
  }

  return md
}

function generateCareerMarkdown(ca: CareerAnalysis): string {
  let md = '## 事业财运分析\n\n'
  md += '### 总体评估\n\n' + ca.description + '\n\n'

  if (ca.careerFactors.length > 0) {
    md += '### 事业影响因素\n\n'
    for (const f of ca.careerFactors) {
      md += '- ' + f + '\n'
    }
    md += '\n'
  }

  if (ca.opportunities.length > 0) {
    md += '### 事业机遇\n\n'
    for (const o of ca.opportunities) {
      md += '- ' + o + '\n'
    }
    md += '\n'
  }

  if (ca.obstacles.length > 0) {
    md += '### 事业障碍\n\n'
    for (const o of ca.obstacles) {
      md += '- ' + o + '\n'
    }
    md += '\n'
  }

  if (ca.suggestions.length > 0) {
    md += '### 事业提升建议\n\n'
    for (const s of ca.suggestions) {
      md += '- ' + s + '\n'
    }
    md += '\n'
  }

  return md
}

function generateFamilyMarkdown(fa: FamilyAnalysis): string {
  let md = '## 家庭关系分析\n\n'
  md += '### 总体评估\n\n' + fa.description + '\n\n'

  if (fa.harmonyFactors.length > 0) {
    md += '### 和睦因素\n\n'
    for (const f of fa.harmonyFactors) {
      md += '- ' + f + '\n'
    }
    md += '\n'
  }

  if (fa.tensionAreas.length > 0) {
    md += '### 潜在紧张区域\n\n'
    for (const t of fa.tensionAreas) {
      md += '- ' + t + '\n'
    }
    md += '\n'
  }

  if (fa.suggestions.length > 0) {
    md += '### 家庭和谐建议\n\n'
    for (const s of fa.suggestions) {
      md += '- ' + s + '\n'
    }
    md += '\n'
  }

  return md
}

function generateIssuesMarkdown(issues: ReportIssue[]): string {
  if (issues.length === 0) {
    return '## 主要问题列表\n\n当前未发现明显需要改善的问题，空间布局整体良好。'
  }

  let md = `## 主要问题列表（共 ${issues.length} 项，按严重等级排序）\n\n`

  const grouped: Record<string, ReportIssue[]> = {
    critical: [],
    severe: [],
    significant: [],
    moderate: [],
    suggestion: [],
  }

  for (const issue of issues) {
    grouped[issue.severity] = grouped[issue.severity] || []
    grouped[issue.severity].push(issue)
  }

  for (const [sev, items] of Object.entries(grouped)) {
    if (items.length === 0) continue
    const label = SEVERITY_LABELS[sev as Severity]
    const stars = SEVERITY_STARS[sev as Severity]
    md += `### ${stars} ${label}（${items.length}项）\n\n`
    for (const item of items) {
      md += `**${item.title}**\n\n`
      md += `- 问题描述：${item.description}\n`
      md += `- 涉及区域：${item.location || '待定'}\n`
      md += `- 风水原理：${item.principle}\n`
      md += `- 关联规则：${item.ruleId}\n\n`
    }
  }

  return md
}

function generatePriorityMarkdown(plans: RemediationPlanV31[]): string {
  if (plans.length === 0) {
    return '## 整改优先级\n\n暂无需要优先整改的项目。'
  }

  let md = '## 整改优先级（★越多表示优先级越高）\n\n'
  md += '| 优先级 | 问题 | 涉及区域 | 紧急程度 |\n'
  md += '|--------|------|----------|----------|\n'

  for (const plan of plans.slice(0, 15)) {
    const stars = '★'.repeat(plan.priority)
    const urgencyText: Record<string, string> = {
      immediate: '立即处理',
      shortTerm: '短期处理',
      longTerm: '长期规划',
      optional: '可选优化',
    }
    md += `| ${stars} | ${plan.issue} | ${plan.category} | ${urgencyText[plan.urgency] || plan.urgency} |\n`
  }

  md += '\n> 注：优先级结合问题严重度、整改成本与实施难度综合评定，建议根据实际情况灵活调整。\n'
  return md
}

function generateRemediationMarkdown(plans: RemediationPlanV31[]): string {
  if (plans.length === 0) {
    return '## 详细整改方案\n\n暂无需要整改的项目。'
  }

  let md = `## 详细整改方案（共 ${plans.length} 项）\n\n`
  md += '每条方案均包含：问题 → 原因 → 方法 → 难度 → 成本 → 预期效果\n\n'

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i]
    const stars = '★'.repeat(plan.priority)
    md += `### ${i + 1}. [${stars}] ${plan.issue}\n\n`
    md += `- **问题：** ${plan.issue}\n`
    md += `- **原因：** ${plan.cause}\n`
    md += `- **整改方法：** ${plan.solution.summary}\n`
    md += `  - 具体步骤：${plan.solution.steps.join(' → ')}\n`
    md += `- **整改难度：** ${DIFFICULTY_LABELS[plan.difficulty]}（${plan.difficulty}/5）\n`
    md += `- **预计成本：** ${COST_LABELS[plan.cost]}\n`
    md += `- **预期效果：** ${plan.expectedEffect}\n`
    md += `- **预计耗时：** ${plan.solution.timeRequired}\n`
    md += `- **可否自行整改：** ${plan.solution.diyPossible ? '可以' : '建议寻求专业帮助'}\n`
    if (plan.solution.cautions.length > 0) {
      md += `- **注意事项：** ${plan.solution.cautions.join('；')}\n`
    }
    md += '\n'
  }

  return md
}

function generateClassicalMarkdown(ci: ClassicalInterpretation): string {
  let md = '## 经典风水原理解读\n\n'
  md += '以下引用传统风水典籍的相关论述，供参考与理解。\n\n'

  for (let i = 0; i < ci.theories.length; i++) {
    const t = ci.theories[i]
    md += `### ${i + 1}. ${t.name}\n\n`
    md += `**出处：** ${t.source}\n\n`
    if (t.content) {
      md += `> ${t.content}\n\n`
    }
    md += `**现代应用：** ${t.application}\n\n`
  }

  md += '### 总结\n\n' + ci.summary + '\n'
  return md
}
