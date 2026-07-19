/**
 * 玄风门 V3.1 风水模块统一类型定义
 * 所有新增功能必须遵循此类型系统
 */

import type { RoomType, FiveElement, Direction } from '../types'

// ═══════════════════════════════════════════════
// 一、规则引擎类型
// ═══════════════════════════════════════════════

/** 规则分类 */
export type RuleCategory =
  | 'door'        // 大门
  | 'living'      // 客厅
  | 'bedroom'     // 卧室
  | 'kitchen'     // 厨房
  | 'bathroom'    // 卫生间
  | 'balcony'     // 阳台
  | 'wealth'      // 财位
  | 'fiveElement' // 五行
  | 'health'      // 健康
  | 'career'      // 事业
  | 'family'      // 家庭
  | 'safety'      // 安全

/** 严重等级 */
export type Severity = 'critical' | 'severe' | 'significant' | 'moderate' | 'suggestion'

/** 整改成本 */
export type RemediationCost = 'free' | 'low' | 'medium' | 'high' | 'veryHigh'

/** 整改难度 1-5 星 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

/** 风水流派 */
export type FengShuiSchool =
  | 'general'       // 通用
  | 'bazhai'        // 八宅派
  | 'xuankong'      // 玄空飞星
  | 'jiugong'       // 九宫飞星
  | 'yangzhai'      // 阳宅三要
  | 'sanyuan'       // 三元九运
  | 'luantou'       // 峦头派
  | 'liqi'          // 理气派

/** 判断条件类型 */
export type ConditionType =
  | 'object_detected'       // 检测到某物体
  | 'object_not_detected'   // 未检测到某物体
  | 'object_position'       // 物体位置关系
  | 'direction'             // 朝向判断
  | 'element_imbalance'     // 五行失衡
  | 'room_type'             // 房间类型
  | 'custom'                // 自定义逻辑

/** 规则判断条件 */
export interface RuleCondition {
  type: ConditionType
  target?: string            // 目标物体/方向/元素
  relation?: string          // 位置关系（对/冲/靠/临等）
  threshold?: number         // 阈值
  customCheck?: string       // 自定义判断描述
}

/** 规则影响 */
export interface RuleImpact {
  description: string        // 影响描述
  areas: ImpactArea[]        // 影响领域
  shortTerm: string          // 短期影响
  longTerm: string           // 长期影响
}

export type ImpactArea =
  | 'health' | 'wealth' | 'career' | 'relationship'
  | 'study' | 'sleep' | 'mood' | 'safety' | 'reputation'

/** 整改方案 */
export interface RuleSolution {
  summary: string            // 方案摘要
  steps: string[]            // 具体步骤
  difficulty: DifficultyLevel
  cost: RemediationCost
  timeRequired: string       // 预计耗时
  diyPossible: boolean       // 是否可自行整改
  expectedEffect: string     // 预计改善效果
  cautions: string[]         // 注意事项
}

/** 经典出处 */
export interface ClassicalSource {
  book: string               // 典籍名称
  chapter?: string           // 篇章
  quote?: string             // 原文引用
  interpretation: string     // 现代解读
}

/** V3.1 统一规则定义 */
export interface FengShuiRuleV31 {
  id: string                 // FS-{CAT}-{NNN}
  name: string               // 规则名称
  category: RuleCategory
  severity: Severity
  condition: RuleCondition
  impact: RuleImpact
  solution: RuleSolution
  source: ClassicalSource
  explanation: string        // 通俗解释（面向用户）
  applicableRooms: RoomType[]
  school: FengShuiSchool
  priority: number           // 1-100
  tags: string[]             // 标签
  relatedRules: string[]     // 关联规则ID
}

// ═══════════════════════════════════════════════
// 二、12维评分类型
// ═══════════════════════════════════════════════

export type ScoreDimension12D =
  | 'pattern'        // 整体格局
  | 'airFlow'        // 气流循环
  | 'lighting'       // 采光质量
  | 'windQi'         // 藏风聚气
  | 'wealth'         // 财位质量
  | 'health'         // 健康影响
  | 'career'         // 事业影响
  | 'family'         // 家庭关系
  | 'elements'       // 五行平衡
  | 'cleanliness'    // 空间整洁度
  | 'activityQuiet'  // 动静分区
  | 'shaQi'          // 煞气指数

export interface DimensionScore {
  dimension: ScoreDimension12D
  name: string               // 中文名称
  score: number              // 0-100
  weight: number             // 权重
  weightedScore: number
  level: string              // 优/良/平/差
  description: string
  factors: string[]          // 影响因素
}

export interface Score12DResult {
  dimensions: Record<ScoreDimension12D, DimensionScore>
  overall: number
  level: string
  summary: string
}

// ═══════════════════════════════════════════════
// 三、图片标注类型
// ═══════════════════════════════════════════════

export type AnnotationType = 'problem' | 'risk' | 'suggestion' | 'wealth' | 'health' | 'career'

export interface BBox {
  x: number      // 左上角 x (0-1 归一化)
  y: number      // 左上角 y (0-1 归一化)
  width: number  // 宽度 (0-1)
  height: number // 高度 (0-1)
}

export interface ImageAnnotation {
  id: string
  type: AnnotationType
  bbox: BBox
  label: string
  suggestion: string
  severity: Severity
  ruleId: string
  color: string
  icon?: string
}

export interface AnnotatedImageResult {
  originalImage: string      // base64
  annotations: ImageAnnotation[]
  canvasData?: string        // 带标注的 canvas base64
}

// ═══════════════════════════════════════════════
// 四、风水流派类型
// ═══════════════════════════════════════════════

export interface SchoolScoringMethod {
  id: string
  name: string
  calculate(context: unknown): { score: number; details: string[] }
}

export interface FengShuiSchoolConfig {
  id: FengShuiSchool
  name: string
  description: string
  weight: number             // 综合评分权重
  scoring: SchoolScoringMethod
  rules: string[]            // 规则ID列表
  enabled: boolean
}

// ═══════════════════════════════════════════════
// 五、可信度升级类型
// ═══════════════════════════════════════════════

export interface CredibilityFactors {
  imageCompleteness: number   // 图片完整度 0-100
  recognitionAccuracy: number // 识别准确率 0-100
  ruleMatchRate: number       // 规则匹配率 0-100
  elementRecognitionCount: number // 识别元素数量
  modelConsistency: number    // 模型一致性 0-100
}

export interface CredibilityResultV31 {
  score: number              // 0-100
  level: 'veryHigh' | 'high' | 'medium' | 'low' | 'veryLow'
  factors: CredibilityFactors
  explanation: string         // 可信度说明
}

// ═══════════════════════════════════════════════
// 六、整改方案类型
// ═══════════════════════════════════════════════

export interface RemediationPlanV31 {
  ruleId: string
  issue: string
  cause: string
  solution: RuleSolution
  priority: DifficultyLevel   // 1-5 星优先级
  difficulty: DifficultyLevel
  cost: RemediationCost
  expectedEffect: string
  urgency: 'immediate' | 'shortTerm' | 'longTerm' | 'optional'
  category: RuleCategory
}

// ═══════════════════════════════════════════════
// 七、V3.1 专业报告类型
// ═══════════════════════════════════════════════

export interface ProfessionalReportV31 {
  score12D: Score12DResult
  patternAnalysis: PatternAnalysis
  windQiAnalysis: WindQiAnalysis
  wealthAnalysis: WealthAnalysis
  healthAnalysis: HealthAnalysis
  careerAnalysis: CareerAnalysis
  familyAnalysis: FamilyAnalysis
  issues: ReportIssue[]
  remediationPlans: RemediationPlanV31[]
  classicalInterpretation: ClassicalInterpretation
  summary: string
  credibility: CredibilityResultV31
  annotations: ImageAnnotation[]
  schools: FengShuiSchoolConfig[]
  // V3.2 新增十大板块
  overallEvaluation: OverallEvaluation
  coreIssues: CoreIssue[]
  strengthPatterns: StrengthPattern[]
  riskAnalysis: RiskAnalysis
  priorityRanking: PriorityRanking
  sevenDayAdvice: AdviceItem[]
  oneMonthAdvice: AdviceItem[]
  longTermLayout: LongTermLayout[]
  cautions: CautionItem[]
  masterSummary: MasterSummary
}

/** 总体评价（风水师当面点评风格） */
export interface OverallEvaluation {
  opening: string          // 开篇定调
  houseCharacter: string   // 宅格判断
  inhabitantFit: string    // 与人的契合度
  closing: string          // 收尾寄语
}

/** 核心问题（按严重程度排序） */
export interface CoreIssue {
  rank: number             // 排名 1-N
  title: string            // 问题标题
  location: string         // 具体位置
  impact: string           // 影响描述
  severity: Severity       // 严重程度
  rootCause: string        // 根本原因
}

/** 优势格局 */
export interface StrengthPattern {
  title: string            // 格局名称
  description: string      // 详细描述
  location?: string        // 所在位置
  benefit: string          // 带来的益处
}

/** 风险评级 */
export type RiskLevel = 'high' | 'elevated' | 'moderate' | 'low' | 'favorable'

export interface RiskDimension {
  level: RiskLevel         // 风险等级
  score: number            // 评分 0-100
  description: string      // 描述
  keyFactors: string[]     // 关键因素
}

/** 风险分析 */
export interface RiskAnalysis {
  health: RiskDimension    // 健康风险
  wealth: RiskDimension    // 财运风险
  career: RiskDimension    // 事业风险
  family: RiskDimension    // 家庭风险
  overallAssessment: string // 整体风险评估
}

/** 优先级条目 */
export interface PriorityItem {
  title: string            // 事项名称
  reason: string           // 优先级原因
  category: RuleCategory   // 所属类别
  estimatedTime: string    // 预计耗时
}

/** 调整优先级（按时间维度） */
export interface PriorityRanking {
  immediate: PriorityItem[]   // 立即处理
  oneWeek: PriorityItem[]     // 一周内
  oneMonth: PriorityItem[]    // 一月内
  longTerm: PriorityItem[]    // 长期
}

/** 建议条目 */
export interface AdviceItem {
  id: string              // 编号
  title: string           // 建议标题
  action: string          // 具体做法
  reason: string          // 为什么要做
  expectedEffect: string  // 预期效果
  cost?: string           // 大致花费（一月建议有）
  difficulty?: string     // 操作难度
}

/** 长期布局建议 */
export interface LongTermLayout {
  title: string            // 布局名称
  description: string      // 详细说明
  direction?: string       // 涉及方位
  expectedEffect: string   // 预期效果
  scope: string            // 适用范围/条件
}

/** 注意事项 */
export interface CautionItem {
  title: string            // 事项标题
  content: string          // 详细内容
  level: 'high' | 'medium' | 'low'  // 重要程度
  scenario: string         // 适用场景
}

/** 风水师总结寄语 */
export interface MasterSummary {
  paragraph1: string       // 第一段：回顾与肯定
  paragraph2: string       // 第二段：展望与鼓励
  signature: string        // 落款风格
}

export interface PatternAnalysis {
  description: string
  principle: string
  explanation: string
  strength: string[]
  weakness: string[]
}

export interface WindQiAnalysis {
  description: string
  qiFlow: string
  windGathering: string
  suggestions: string[]
}

export interface WealthAnalysis {
  description: string
  wealthPositions: WealthPosition[]
  suggestions: string[]
}

export interface WealthPosition {
  name: string
  location: string
  status: 'good' | 'average' | 'poor'
  suggestion: string
}

export interface HealthAnalysis {
  description: string
  healthFactors: string[]
  riskAreas: string[]
  suggestions: string[]
}

export interface CareerAnalysis {
  description: string
  careerFactors: string[]
  opportunities: string[]
  obstacles: string[]
  suggestions: string[]
}

export interface FamilyAnalysis {
  description: string
  harmonyFactors: string[]
  tensionAreas: string[]
  suggestions: string[]
}

export interface ReportIssue {
  id: string
  title: string
  severity: Severity
  category: RuleCategory
  description: string
  principle: string
  location?: string
  ruleId: string
}

export interface ClassicalInterpretation {
  theories: ClassicalTheory[]
  summary: string
}

export interface ClassicalTheory {
  name: string
  source: string
  content: string
  application: string
}

// ═══════════════════════════════════════════════
// 八、历史记录升级类型
// ═══════════════════════════════════════════════

export interface FengShuiHistoryRecordV31 {
  id: string
  roomType: string
  roomName: string
  imageData: string
  thumbnail: string          // 缩略图
  overallScore: number
  score12D?: Record<string, number>
  credibility: CredibilityResultV31
  mainIssues: string[]
  remediationPlans: string[]
  annotations: ImageAnnotation[]
  createdAt: string
  analysisDurationMs: number
  // V3.1 新增
  status: 'active' | 'remediated' | 'archived'
  favorite: boolean
  tags: string[]
  notes: string               // 用户备注
  pdfUrl?: string             // PDF报告地址
}

// ═══════════════════════════════════════════════
// 九、V3.2 历史记录增强类型
// ═══════════════════════════════════════════════

/** 12 维评分维度条目 */
export interface ScoreDimensionEntry {
  dimension: string          // 维度 key，如 'pattern' | 'airFlow' 等
  name: string               // 中文名称
  score: number              // 0-100 分
  level: string              // 优/良/平/差
}

/**
 * V3.2 增强版历史记录
 * 继承 V3.1 全部字段，新增：
 * - issueCount: 问题数量（从 ruleMatches 统计 matched 的数量）
 * - score12DDetails: 12 维评分详情数组
 * - topIssueTags: 主要问题标签（前3个问题的名称）
 * 完全向下兼容 V3.1 历史记录
 */
export interface FengShuiHistoryRecordV32 extends FengShuiHistoryRecordV31 {
  /** 问题数量：匹配到的规则数量 */
  issueCount: number
  /** 12 维评分详情数组 */
  score12DDetails: ScoreDimensionEntry[]
  /** 主要问题标签（前3个问题名称） */
  topIssueTags: string[]
  /** 数据版本标识 */
  version: '3.2'
}

/** 历史记录联合类型，兼容 V3.1 和 V3.2 */
export type FengShuiHistoryRecord = FengShuiHistoryRecordV31 | FengShuiHistoryRecordV32

/**
 * 类型守卫：判断是否为 V3.2 记录
 */
export function isV32Record(record: FengShuiHistoryRecordV31): record is FengShuiHistoryRecordV32 {
  return (record as FengShuiHistoryRecordV32).version === '3.2'
}

// ═══════════════════════════════════════════════
// 十、PDF 报告类型
// ═══════════════════════════════════════════════

export interface PDFReportConfig {
  title: string
  subtitle: string
  logo?: string
  coverImage?: string
  includeAnnotations: boolean
  includeClassical: boolean
  includeRadarChart: boolean
  pageSize: 'A4' | 'Letter'
}
