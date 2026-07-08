/**
 * 八字命理模块 V4.4 Release
 * 
 * Architecture:
 * Input → Analyzer → Rules → Knowledge → Score → AI Report → Output
 * 
 * Modules:
 * - Calculator: 四柱排盘 / 十神 / 五行 / 旺衰 / 纳音 / 神煞
 * - Rules: 格局 / 调候 / 用神规则引擎
 * - Knowledge: 八字知识库（十神/格局/五行/古籍）
 * - Pipeline: 统一入口（runBaZiPipeline）
 * - Report: 8大章节报告生成
 * - AI: AI报告生成（复用统一 AI Provider）
 * 
 * @example
 * // 完整八字分析（推荐入口）
 * import { runBaZiPipeline } from '@/lib/bazi'
 * 
 * const result = await runBaZiPipeline({
 *   birthDate: '1990-01-15',
 *   birthTime: '08:30',
 *   gender: 'male',
 * }, { includeAI: true })
 * 
 * @example
 * // 仅排盘（不调用AI）
 * import { calculateBaZi } from '@/lib/bazi'
 * 
 * const chart = calculateBaZi({
 *   birthDate: '1990-01-15',
 *   birthTime: '08:30',
 *   gender: 'male',
 * })
 */

export * from './types'
export { calculateBaZi, calculateBaZiFromBirthData, HEAVENLY_STEMS, EARTHLY_BRANCHES, getDayGanZhi, getYearGanZhi, getMonthGanZhi, getHourGanZhi, getSolarTermDate, getYearSolarTerms } from './calculator'

// Rule Engine (统一入口)
export { executeRules, createRule } from './rules/engine'
export type {
  BaseRule,
  RuleContext,
  RuleResult,
  RuleMatchResult,
  RuleEngineOptions,
} from './rules/engine'

// Pipeline（推荐入口）
export { runBaZiPipeline } from './pipeline'
export type {
  BaZiAnalysisOptions,
  BaZiPipelineResult,
  BaZiPipelineStep,
  BaZiScore,
  BaZiAIReport,
} from './pipeline/types'

// Report Engine
export { generateBaZiReport } from './report'
export type { BaZiReport, BaZiReportSection } from './report'

// AI Report
export { generateBaZiAIReport } from './ai'

// Knowledge Base
export { default as baziKnowledge } from './knowledge'
export type { BaZiKnowledgeEntry, KnowledgeStats, KnowledgeCategory } from './knowledge/types'

// GeJu (格局系统)
export { determineGeJu } from './geju'
export type { GeJuResult } from './geju'

// ShenSha (神煞系统)
export { calculateShenSha } from './shensha'
export type { ShenShaInfo, ShenShaCategory } from './shensha'

// ShenShi Analysis (十神分析系统)
export { analyzeShenShi } from './shishenAnalysis'
export type { ShenShiDetail, ShenShiAnalysisResult, ShenShiPower, ShenShiCombination } from './shishenAnalysis'

// FiveElement Power (五行力量分析)
export { calculateFiveElementPower } from './fiveElementPower'
export type { ElementPowerDetail, FiveElementPowerResult } from './fiveElementPower'
export { ELEMENT_COLORS } from './fiveElementPower'

// DaYun Analysis (大运分析)
export { analyzeDaYun } from './dayunAnalysis'
export type { DaYunAnalysisStep, DaYunAnalysisResult } from './dayunAnalysis'

// LiuNian Analysis (流年分析)
export { analyzeLiuNian } from './liunianAnalysis'
export type { LiuNianYear, LiuNianAnalysisResult } from './liunianAnalysis'

// LiuYue Analysis (流月分析)
export { analyzeLiuYue } from './liuyueAnalysis'
export type { LiuYueMonth, LiuYueAnalysisResult } from './liuyueAnalysis'

// Marriage Analysis (婚姻分析 P2)
export { analyzeMarriage } from './marriageAnalysis'
export type { MarriageAnalysisResult, MarriageShenSha, SpousePalaceRelation, MarriageRisk } from './marriageAnalysis'

// Career Analysis (事业分析 P3)
export { analyzeCareer } from './careerAnalysis'
export type { CareerAnalysisResult, CareerShiShenScore, CareerDirection, IndustryMatch } from './careerAnalysis'

// Wealth Analysis (财富分析 P4)
export { analyzeWealth } from './wealthAnalysis'
export type { WealthAnalysisResult, WealthShiShen, CaiKu, WealthRiskYear, InvestmentDirection } from './wealthAnalysis'

// Health Analysis (健康分析 P5)
export { analyzeHealth } from './healthAnalysis'
export type { HealthAnalysisResult, BodyConstitution, DiseaseRisk, DietSuggestion, ExerciseSuggestion, HealthRegimen } from './healthAnalysis'

// FengShui Analysis (风水结合 P6)
export { analyzeFengShui } from './fengshuiAnalysis'
export type { FengShuiAnalysisResult, ColorAdvice, LuckyNumber, DirectionAdvice, RoomAdvice, SpecialPosition } from './fengshuiAnalysis'

// Full Report (P7 AI解读)
export { generateFullReport } from './fullReport'
export type { FullReportResult, ReportChapter, FullReportInput } from './fullReport'
export type { WangShuaiResult } from './types'

// Report Export (V3.0 商业版导出)
export { exportMarkdown, exportWord, exportPdf } from './reportExport'

// P0-② 子时换日模块
export * from './zishi'
