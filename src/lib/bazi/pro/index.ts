/**
 * H3 Professional BaZi Engine — 统一导出
 *
 * Module 1: Professional Four Pillars Engine (Frozen)
 * Module 2: Professional ShenSha Engine (Frozen)
 * Module 3: Professional Ten Gods Engine (Frozen v3.1.0)
 * Module 4: Professional Pattern Engine (Frozen v4.1.0)
 * Module 5: Professional XiYong Engine
 * Module 1.1: Infrastructure (Frozen)
 */

// ─── Module 1: 四柱专业引擎 ───
export { calculateProfessionalFourPillars, FOUR_PILLARS_VERSION } from './fourPillarsEngine'

export { calculateMingGong, calculateShenGong } from './palace'
export { calculateTaiYuan, calculateTaiXi } from './taiyuan'

export {
  getNaYin, getNaYinByIndex, getChangSheng, getChangShengStartZhi,
  getStemElement, getBranchElement, calculateFiveElementCount,
  getKongWang, getShenShi, stemIndex, branchIndex, getGanZhiIndex,
  clamp,
  FIVE_ELEMENT_SHENG, FIVE_ELEMENT_KE,
  FIVE_ELEMENT_BE_SHENG, FIVE_ELEMENT_BE_KE,
} from './helpers'

// ─── Module 2: 神煞专业引擎 ───
export {
  calculateShenSha,
  clearShenShaCache,
  getShenShaCacheSize,
  explainShenSha,
  SHEN_SHA_ENGINE_VERSION,
} from './shenshaEngine'
export type {
  ShenShaEngineOptions,
  ConflictInfo,
  ShenShaExplainInput,
  ShenShaExplainOutput,
} from './shenshaEngine'

export { SHEN_SHA_DATABASE, SHEN_SHA_BY_ID } from './shenshaDatabase'

// ─── Module 3: 十神专业引擎 ───
export {
  calculateTenGods,
  clearTenGodsCache,
  getTenGodsCacheSize,
  TEN_GODS_ENGINE_VERSION,
} from './tenGodsEngine'
export type { TenGodsEngineOptions } from './tenGodsEngine'

export {
  TEN_GODS,
  TEN_GOD_CATEGORY,
  TEN_GOD_NATURE,
  TEN_GOD_RELATION_RULES,
  TEN_GOD_COMBINATION_RULES,
  generateTenGodExplain,
} from './tenGodsDatabase'

export type {
  TenGodCategory,
  TenGodOccurrence,
  TenGodDetail,
  TouCangAnalysis,
  FiveElementPower,
  TenGodRelation,
  TenGodRelationNetwork,
  TenGodCombination,
  TenGodRelationRule,
  TenGodExplainOutput,
  TenGodNature,
  TenGodEngineOutput,
} from './tenGodsTypes'

// ─── Module 1 + 2: 类型系统 ───
export type {
  ProfessionalFourPillarsResult,
  GanZhi, SixLines, PillarDetail, DerivationStep, DerivationChain,
  PalaceResult, TaiYuanResult, TaiXiResult,
  AlgorithmVersion, AlgorithmSource, ClassicalSource, ModernSource,
} from './types'
export { createChain, createTreeNode } from './types'

export type {
  ShenShaCategory,
  ShenShaPosition,
  ShenShaResult,
  ShenShaEngineOutput,
  ShenShaDefinition,
} from './shenshaTypes'

// ─── Module 1.1: 基础设施 ───
export type { WarningCode } from './warnings'
export {
  ALL_WARNING_CODES,
  getWarningDescription, getWarningLevel,
} from './warnings'
export type { WarningLevel } from './warnings'

export {
  CLASSIC_CONFIG,
} from './config'
export type {
  ProfessionalConfig,
  MingGongRuleConfig, ShenGongRuleConfig,
  TaiYuanRuleConfig, TaiXiRuleConfig,
  HiddenStemRuleConfig, KongWangRuleConfig, ChangShengRuleConfig,
} from './config'

export {
  RuleRegistry, defaultRuleRegistry,
} from './ruleRegistry'
export type { RuleEntry, RuleCategory } from './ruleRegistry'

// ─── Module 4: 格局专业引擎 ───
export {
  calculatePattern,
  generatePatternExplain,
  clearPatternCache,
  getPatternCacheSize,
  PATTERN_ENGINE_VERSION,
} from './patternEngine'

export {
  PATTERN_RULES,
  PATTERN_KB_MAP,
  findPatternRule,
  getRulesByClass,
  getRulesBySchool,
  getPatternKnowledge,
  getAllPatternNames,
} from './patternDatabase'

export type {
  PatternType, PatternClass, PatternSchool,
  PatternGrade, PatternRule, PatternRuleContext,
  PatternDetail, BreakFactor, SchoolEvaluation,
  PatternEngineOutput, PatternEngineOptions as PatternEngineOptionsType,
  SchoolConfig, PatternExecutionMetadata,
} from './patternTypes'
export {
  ZHENG_PATTERNS, SPECIAL_PATTERNS, ALL_PATTERNS,
  ALL_SCHOOLS, DEFAULT_SCHOOL_CONFIG,
  getPatternGrade,
} from './patternTypes'

// ─── Module 5: 喜用神专业引擎 ───
export {
  calculateXiYong,
  generateXiYongExplain,
  clearXiYongCache,
  getXiYongCacheSize,
  XIYONG_ENGINE_VERSION,
  XIYONG_CACHE_VERSION,
} from './xiyongEngine'

export {
  XIYONG_KB, CLIMATE_RULES, FUYI_RULES,
  getXiYongKnowledge, getClimateRule, getAllClimateRules, getAllFuYiRules,
} from './xiyongDatabase'

export type {
  StrengthLevel, StrengthResult, StrengthDimensionScores,
  XiYongGroupResult, XiYongShenItem, ShenRole,
  ClimateAnalysis, ClimateType,
  FuYiAnalysis, FuYiMethodResult, FuYiMethod,
  XiYongSchoolResult, XiYongConflictResult,
  XiYongScoreDetail, XiYongExplainOutput,
  XiYongExecutionMetadata, XiYongEngineOutput, XiYongEngineOptions,
  XiYongKnowledgeEntry,
} from './xiyongTypes'
export { getStrengthLevel, getElementRelation } from './xiyongTypes'

// ─── Module 6: 大运流年专业引擎 ───
export {
  calculateFortune,
  generateFortuneExplain,
  clearFortuneCache,
  getFortuneCacheSize,
  generateDaYunGanZhi,
  calculateQiYunInfo,
  calculateLiuNianGanZhi,
  detectEvents,
  calculateFortuneScores,
  FORTUNE_ENGINE_VERSION,
  FORTUNE_CACHE_VERSION,
} from './fortuneEngine'

export {
  TIAN_GAN_WU_HE, DI_ZHI_LIU_HE, DI_ZHI_SAN_HE, DI_ZHI_SAN_HUI,
  DI_ZHI_LIU_CHONG, DI_ZHI_LIU_HAI, DI_ZHI_SAN_XING, DI_ZHI_ZI_XING,
  TIAN_GAN_CHONG, DI_ZHI_PO,
  detectRelations,
  FORTUNE_EVENT_RULES, FORTUNE_EVENT_KB,
  getEventRule, getEventKB,
} from './fortuneDatabase'

export type {
  QiYunInfo, DaYunStep, LiuNianInfo, RelationInfo,
  XiYongRelationInfo, FortuneEvent, FortuneEventType, FortuneScores,
  FortuneExplainOutput, FortuneExecutionMetadata,
  FortuneEngineOutput, FortuneEngineOptions,
} from './fortuneTypes'

// ═══════════════════════════════════════════
// Module 7: Professional AI Report Engine
// ═══════════════════════════════════════════

export {
  generateMasterReport,
  MASTER_REPORT_VERSION,
  MASTER_REPORT_CACHE_VERSION,
  clearMasterReportCache,
  getMasterReportCacheSize,
} from './masterReportEngine'

export {
  CROSS_VALIDATION_RULES, MASTER_EXPLAIN_KB,
  RISK_RULES, OPPORTUNITY_RULES, RECOMMENDATION_RULES,
  TIMELINE_STAGE_RULES,
  getCrossValidationRules, getExplainByTopic,
  getAllExplainEntries, getRiskRule, getOpportunityRule,
  getRecommendationRule, getTimelineStageRule,
} from './masterReportDatabase'

export type {
  ModuleInputs, CrossValidationResult,
  FiveDimensionScores, FiveDimensionItem, DimensionLevel,
  LifeStage, TimelineStage,
  RiskItem, RiskType, RiskLevel,
  OpportunityItem, OpportunityType,
  RecommendationItem, RecommendationCategory,
  MasterExplainEntry, OverallAssessment,
  MasterReportMetadata, MasterReport, MasterReportOptions,
} from './masterReportTypes'

// ═══════════════════════════════════════════
// Module 8: Professional Report Export Engine
// ═══════════════════════════════════════════

export {
  generateReportExport,
  REPORT_EXPORT_VERSION,
  REPORT_EXPORT_CACHE_VERSION,
  clearReportExportCache,
  getReportExportCacheSize,
} from './reportExportEngine'

export {
  TEMPLATE_CONFIGS, SECTION_TITLES_ZH, SECTION_TITLES_EN,
  I18N_ENTRIES, CHART_DEFINITIONS, EXPORT_FORMATS,
  getTemplateConfig, getSectionTitle, getI18nValue,
  getChartDefinition, getAllChartDefinitions,
} from './reportExportDatabase'

export {
  generateReportId, getTemplateDisplayName, getFormatDisplayName,
} from './reportExportTypes'

// ═══════════════════════════════════════════
// V4.5 Case Library
// ═══════════════════════════════════════════

export {
  runRegression,
  CASE_LIBRARY_VERSION,
} from './caseValidationEngine'

export {
  CLASSIC_CASES, ANONYMOUS_CASES, REGRESSION_CASES,
  getClassicCases, getAnonymousCases, getRegressionCases,
  getAllCases, getCaseById, getCasesByCategory, getTotalCaseCount,
} from './caseDatabase'

export {
  isClassicCase, getCaseCategory, generateCaseId,
} from './caseLibraryTypes'

export type {
  CaseCategory, CaseGender, CasePillarsInput,
  CaseExpectedResult, FieldComparison,
  CaseValidationResult, RegressionReport, RegressionOptions,
  ClassicCase, AnonymousCase, RegressionCase, CaseEntry,
} from './caseLibraryTypes'

// ═══════════════════════════════════════════
// V4.5 Phase 2: Knowledge Base + Expert Validation
// ═══════════════════════════════════════════

export {
  generateValidationCenterReport,
  EXPERT_VALIDATION_VERSION,
} from './expertValidationEngine'

export {
  KNOWLEDGE_BASE, EXPERT_VALIDATIONS, LEARNING_QUEUE_DATA, REGRESSION_LOCKS,
  getKnowledgeByCategory, getKnowledgeBySource, getKnowledgeById, getAllKnowledge,
  getValidationsByStatus, getValidationById, getAllValidations,
  getUnresolvedLearningQueue, getActiveLocks, getLockByCaseId,
} from './knowledgeBaseDatabase'

export {
  generateValidationId, generateExpertId, getReviewStatusDisplay,
} from './knowledgeBaseTypes'

export type {
  KnowledgeEntry, KnowledgeSource, KnowledgeCategory,
  CitationLevel, AssociationType, KnowledgeAssociation,
  ExpertValidationRecord, ReviewStatus, VerdictType,
  DifferenceItem, DifferenceReport,
  LearningQueueItem, RegressionLock,
  ExpertValidationCenterReport, ExpertValidationOptions,
} from './knowledgeBaseTypes'

export type {
  ReportTemplate, TemplateConfig, ReportSectionType, ReportSection,
  ChartType, ChartConfig, ChartDataPoint,
  ExportFormat, ExportResult,
  BrandingConfig, ReportLanguage,
  I18nEntry,
  ReportEngineOutput, ReportExportOptions,
} from './reportExportTypes'

// ═════════════════════════════════════════════════════════
// V5.0 RC: Quality Gate Engine
// ═════════════════════════════════════════════════════════

export {
  runQualityGate,
  QUALITY_GATE_VERSION,
} from './qualityGateEngine'

export {
  DEFAULT_RELEASE_THRESHOLD,
  HEALTH_DIMENSIONS,
  QUALITY_CHECK_DEFINITIONS,
  getAllCheckDefinitions,
  getCheckDefinitionsByCategory,
  getCheckDefinitionsBySeverity,
  getDefaultThreshold,
} from './qualityGateDatabase'

export {
  getHealthGrade,
  getHealthGradeDescription,
} from './qualityGateTypes'

export type {
  QualityCheckResult,
  QualityCheckCategory,
  ReleaseThreshold,
  HealthScoreDimension,
  HealthGrade,
  EngineHealthScore,
  QualityGateReport,
  QualityGateSummary,
  QualityGateOptions,
} from './qualityGateTypes'

// ═════════════════════════════════════════════════════════
// V5.0 RC: Project Dashboard Engine
// ═════════════════════════════════════════════════════════

export {
  generateProjectDashboard,
  DASHBOARD_VERSION,
} from './projectDashboardEngine'

export type {
  DashboardMetric,
  DashboardSection,
  ProjectDashboard,
  DashboardOptions,
} from './projectDashboardTypes'

export {
  statusColor,
  trendIcon,
} from './projectDashboardTypes'

// ═════════════════════════════════════════════════════════
// V5.0 RC Phase 2: Performance Benchmark Engine
// ═════════════════════════════════════════════════════════

export {
  runPerformanceBenchmark,
  PERF_BENCHMARK_VERSION,
} from './performanceBenchmarkEngine'

export type {
  BenchmarkScale,
  BenchmarkedEngine,
  EngineBenchmarkResult,
  FullPipelineBenchmark,
  ConcurrencyBenchmark,
  CacheBenchmarkResult,
  PerformanceBenchmarkReport,
  BenchmarkEnvironment,
  BenchmarkSummary,
  BenchmarkOptions,
} from './performanceBenchmarkTypes'

export {
  calculatePercentile,
  calculateStdDev,
  getBenchmarkGrade,
} from './performanceBenchmarkTypes'

// ═════════════════════════════════════════════════════════
// V5.0 RC Phase 3: Case Expansion — Case Database v2.0
// ═════════════════════════════════════════════════════════

// Module A: Professional Case Database v2.0
export {
  CASE_DATABASE_V2_VERSION,
  getAllCasesV2,
  getCaseByIdV2,
  getCasesByCategoryV2,
  getTotalCaseCountV2,
  getCasesByQualityScoreRangeV2,
  getCasesByRegressionTierV2,
  getCasesByReviewStatusV2,
  getCasesByMinReliabilityV2,
  getCasesByTagsV2,
  getExcludedCasesV2,
  getLearnableCasesV2,
  getCaseStatisticsV2,
  addCaseV2,
  addCasesV2,
  updateCaseV2,
  deprecateCaseV2,
  resetCaseStoreV2,
} from './caseDatabaseV2'

export type { CaseStatisticsV2 } from './caseDatabaseV2'

export {
  MIGRATED_SEED_CASES_V2,
  runMigrationAudit,
  verifyMigrationIntegrity,
  getMigrationSummary,
} from './caseDataMigration'

export type { MigrationAuditReport } from './caseDataMigration'

export {
  migrateClassicCaseV1ToV2,
  migrateAnonymousCaseV1ToV2,
  migrateRegressionCaseV1ToV2,
  migrateCaseV1ToV2,
  downgradeCaseV2ToV1,
  downgradeCasesV2ToV1,
  mapCategoryV1ToV2,
  mapCategoryV2ToV1,
} from './caseCompatibility'

export {
  generateCaseIdV2,
  scoreToStarRating,
  starRatingToString,
  createEmptyCaseEntryV2,
  calculateReliabilityScore,
  validateCaseEntryV2,
  getCaseCategoryDisplayV2,
  isClassicCaseV2,
  isAnonymousCaseV2,
  isRegressionCaseV2,
  isExpertVerifiedCaseV2,
} from './caseLibraryTypesV2'

export type {
  CaseEntryV2,
  CaseCategoryV2,
  CasePillarsInput,
  CaseExpectedResultV2,
  ExpertOpinionV2,
  ConflictRecordV2,
  CaseVersionHistoryV2,
  ReliabilityDimensionsV2,
  CaseEvidenceV2,
  SimilarCaseRecommendation,
  StarRating,
  RegressionTier,
  CaseReviewStatus,
  AnonymityLevel,
  EvidenceType,
  ConflictType,
} from './caseLibraryTypesV2'

// Module B: Case Quality Score
export {
  CASE_QUALITY_SCORE_VERSION,
  calculateCaseQualityScore,
  batchCalculateQualityScores,
  filterLowQualityCases,
  getQualityScoreDistribution,
} from './caseQualityScoreEngine'

export type {
  QualityDimension,
  QualityScoreResult,
  QualityThreshold,
} from './caseQualityScoreTypes'

export { DEFAULT_QUALITY_THRESHOLD } from './caseQualityScoreTypes'

// Module C: Expert Consensus
export {
  EXPERT_CONSENSUS_VERSION,
  calculateExpertConsensus,
  batchCalculateConsensus,
  getCasesByConsensusLevel,
} from './expertConsensusEngine'

export type {
  ConsensusLevel,
  ConsensusResult,
  ConsensusOptions,
} from './expertConsensusTypes'

// Module D: Disagreement Database
export {
  DISAGREEMENT_VERSION,
  generateDisagreementReport,
  findConflictsForCase,
  getConflictSummary,
  explainConflict,
} from './disagreementEngine'

export {
  CONFLICT_RECORDS,
  getAllConflicts,
  getConflictsByType,
  getConflictsByTopic,
  getConflictsByCaseId,
} from './disagreementDatabase'

export type {
  DisagreementSource,
  DisagreementSeverity,
  DisagreementReport,
  DisagreementFilter,
} from './disagreementTypes'

// Module E: Regression Gold Cases
export {
  REGRESSION_GOLD_VERSION,
  assignRegressionTier,
  evaluateGoldCase,
  batchAssignTiers,
  getGoldCases,
  getSilverCases,
  getBronzeCases,
  validateGoldConsistency,
  getRegressionGoldSummary,
} from './regressionGoldEngine'

export type {
  GoldTierCriteria,
  GoldCaseReport,
  RegressionGoldSummary,
} from './regressionGoldTypes'

export {
  GOLD_TIER_CRITERIA,
  SILVER_TIER_CRITERIA,
  BRONZE_TIER_CRITERIA,
} from './regressionGoldTypes'

// Module F: Case Search Engine
export {
  CASE_SEARCH_VERSION,
  searchCases,
  getSearchFacets,
  getRelatedCases,
  getSimilarCasesByStructure,
} from './caseSearchEngine'

export type {
  SearchField,
  SearchOperator,
  SearchCondition,
  CaseSearchQuery,
  SearchResult,
  SearchFacet,
} from './caseSearchTypes'

// Module G: Benchmark Dataset
export {
  BENCHMARK_DATASET_VERSION,
  createBenchmarkDataset,
  runBenchmark,
  generateBenchmarkReport,
  getOfficialBenchmarkDatasets,
} from './benchmarkDatasetEngine'

export type {
  BenchmarkScale,
  BenchmarkDataset,
  BenchmarkRunResult,
  BenchmarkReport,
} from './benchmarkDatasetTypes'

// Module H: Case Version
// (版本功能已内嵌于 caseLibraryTypesV2.ts 和 caseDatabaseV2.ts)

// Extension 1: Case Reliability
export {
  CASE_RELIABILITY_VERSION,
  calculateCaseReliability,
  getReliabilityLevel,
  batchCalculateReliability,
  filterByReliabilityLevel,
  getReliabilityDistribution,
  getTopReliableCases,
  compareReliability,
} from './caseReliabilityEngine'

export type {
  ReliabilityLevel,
  ReliabilityReport,
  ReliabilityFilter,
} from './caseReliabilityTypes'

export { RELIABILITY_LEVEL_THRESHOLDS } from './caseReliabilityTypes'

// Extension 2: Report Linker
export {
  CASE_REPORT_LINKER_VERSION,
  findSimilarCasesForReport,
  calculateSimilarityScore,
  extractFeaturesFromReport,
} from './caseReportLinker'

export type {
  CaseComparisonDetail,
  SimilarCasesReport,
  LinkerOptions,
} from './caseReportLinkerTypes'

// Extension 3: Case Dashboard
export {
  CASE_DASHBOARD_VERSION,
  generateCaseDashboard,
  getDashboardSnapshot,
} from './caseDashboardEngine'

export type {
  CaseDashboardMetric,
  CaseDashboardSection,
  CaseDashboard,
} from './caseDashboardTypes'

// ═══════════════════════════════════════════════════════════════════
// V5.0 RC Phase 4: Professional Review & Validation Center
// ═══════════════════════════════════════════════════════════════════

// Module A: Professional Review Center
export {
  PROFESSIONAL_REVIEW_VERSION,
  submitReview,
  getReviewWorkflow,
  getReviewStats,
  getPendingReviews,
  approveReview,
  rejectReview,
  getReviewHistory,
  submitBatchReview,
  generateReviewSummary,
} from './professionalReviewEngine'

export type {
  ReviewAction,
  ExpertReview,
  ReviewWorkflow,
  ReviewFilter,
  ReviewStats,
} from './professionalReviewTypes'

// Module B: AI vs Expert Compare
export {
  AI_VS_EXPERT_VERSION,
  compareAiVsExpert,
  batchCompare,
  getFieldAgreementRate,
  getTopDivergentFields,
} from './aiVsExpertCompareEngine'

export type {
  ComparisonField,
  FieldComparison,
  ExpertAgreement,
  AiVsExpertReport,
} from './aiVsExpertCompareTypes'

// Module C: Confidence Calibration
export {
  CONFIDENCE_CALIBRATION_VERSION,
  calibrateTrustScore,
  batchCalibrateTrust,
  filterByTrustLevel,
  getTrustDistribution,
  getTopTrustedCases,
  getTrustTrend,
  compareTrust,
} from './confidenceCalibrationEngine'

export type {
  TrustDimension,
  FinalTrustScore,
  TrustLevel,
  CalibrationOptions,
  TrustFilter,
} from './confidenceCalibrationTypes'

export { DEFAULT_TRUST_WEIGHTS, TRUST_LEVEL_THRESHOLDS } from './confidenceCalibrationTypes'

// Module D: Ancient Classics Validator
export {
  ANCIENT_CLASSICS_VERSION,
  validateClassicalReferences,
  batchValidateClassicalReferences,
  getMinimumClassicalCoverage,
  suggestClassicalReferences,
  getSourceCoverageReport,
} from './ancientClassicsValidatorEngine'

export type {
  ClassicalSource,
  ReferenceLevel,
  ClassicalReference,
  ValidationRequirement,
  ClassicsValidationResult,
  ClassicsValidationReport,
} from './ancientClassicsValidatorTypes'

// Module E: Conflict Analyzer
export {
  CONFLICT_ANALYZER_VERSION,
  analyzeCrossModuleConflicts,
  batchAnalyzeConflicts,
  getConflictPriority,
  resolveConflict,
  getUnresolvedConflicts,
} from './conflictAnalyzerEngine'

export type {
  ConflictType,
  ConflictSeverity,
  ModuleConclusion,
  ModuleConflictItem,
  CrossModuleAnalysis,
  ConflictDistribution,
  ConflictAnalysisReport,
} from './conflictAnalyzerTypes'

// Module F: Professional Benchmark
export {
  PROFESSIONAL_BENCHMARK_VERSION,
  registerBenchmarkSource,
  compareWithSource,
  runIndustryBenchmark,
  getRegisteredSources,
  getOverallIndustryAgreement,
  removeBenchmarkSource,
} from './professionalBenchmarkEngine'

export type {
  BenchmarkSource,
  BenchmarkEntry,
  BenchmarkComparison,
  SourceBenchmarkResult,
  IndustryBenchmarkReport,
} from './professionalBenchmarkTypes'

// Module G: Engine Reliability Dashboard
export {
  ENGINE_RELIABILITY_DASHBOARD_VERSION,
  generateEngineReliabilityDashboard,
  getDashboardSnapshot as getEngineReliabilityDashboardSnapshot,
  evaluateEngineReadiness,
} from './engineReliabilityDashboardEngine'

export type {
  ReliabilityMetricCategory,
  EngineReliabilityMetric,
  ReliabilityDashboardSection,
  EngineReliabilityDashboard,
} from './engineReliabilityDashboardTypes'

// Module H: Release Certification
export {
  RELEASE_CERTIFICATION_VERSION,
  generateReleaseCertification,
  validateCertification,
  getCertificateHistory,
  revokeCertification,
} from './releaseCertificationEngine'

export type {
  ReleaseType,
  CertificationStatus,
  CertificationCheck,
  CertSignatory,
  ReleaseCertification,
} from './releaseCertificationTypes'

// ═══════════════════════════════════════════════════════════════════
// V5.0 RC Phase 5: Product Polish
// ═══════════════════════════════════════════════════════════════════

// Module I: Report UX Engine
export {
  REPORT_UX_VERSION,
  buildReadingRhythm,
  assignRiskColors,
  generateTrendTimeline,
  generateTrendSeries,
  generateWuXingRadar,
  generateWuXingEnergyBars,
  generateWuXingCycle,
  generateTenGodRelationGraph,
  buildFullReportUx,
} from './reportUxEngine'

export type {
  RiskColor,
  ReadingPhase,
  ReadingRhythmSection,
  TrendTimelinePoint,
  TrendTimelineSeries,
  WuXingRadarData,
  WuXingEnergyBar,
  WuXingCycleNode,
  TenGodRelationGraphNode,
  TenGodRelationEdge,
  ReportUxOutput,
  ReportUxOptions,
} from './reportUxTypes'

export { DEFAULT_REPORT_UX_OPTIONS, RISK_COLOR_MAP } from './reportUxTypes'

// Module II: Explain Level Engine
export {
  EXPLAIN_LEVEL_VERSION,
  generateLeveledExplain,
  expandExplainSection,
  buildExpansionTree,
  truncateToTargetWordCount,
  countChineseCharacters,
  getExplainLevelConfig,
  estimateExplainWordCount,
} from './explainLevelEngine'

export type {
  ExplainLevel,
  ExplainLevelConfig,
  LeveledExplainSection,
  ExplainExpansionNode,
  ExplainLevelOutput,
  ExplainInputTopic,
} from './explainLevelTypes'

export { EXPLAIN_LEVEL_CONFIGS } from './explainLevelTypes'

// Module III: Case Citation Engine
export {
  CASE_CITATION_VERSION,
  registerCases,
  findRelevantCases,
  buildInlineCitation,
  calculateCitationRelevance,
  extractCitationContext,
  generateCitationSnippet,
  getCitationCoverageRate,
  deduplicateCitations,
  getCaseById as getCaseByIdFromCitation,
  resetCaseStore,
} from './caseCitationEngine'

export type {
  CitationPosition,
  CaseCitation,
  InlineCitationMarkup,
  CitationContext,
  CitationMatchRule,
  CaseCitationOutput,
  CitationOptions,
} from './caseCitationTypes'

export { DEFAULT_CITATION_RULES, DEFAULT_CITATION_OPTIONS } from './caseCitationTypes'

// Module IV: Confidence Visualization Engine
export {
  CONFIDENCE_VIZ_VERSION,
  buildConfidenceVisualization,
  buildTrustScoreGauge,
  calculateSourceContributions,
  buildBreakdownItems,
  mapScoreToColor,
  formatConfidenceLabel,
  getTrustDisplayLevel,
  mapScoreToStatus,
} from './confidenceVizEngine'

export type {
  VizDisplayMode,
  TrustDisplayLevel,
  TrustScoreGauge,
  SourceContribution,
  ConfidenceBreakdownItem,
  ConfidenceVisualization,
  ConfidenceVizOptions,
} from './confidenceVizTypes'

export { TRUST_LEVEL_THRESHOLDS_VIZ, DEFAULT_VIZ_OPTIONS } from './confidenceVizTypes'

// Module V: Explain Trace Engine
export {
  EXPLAIN_TRACE_VERSION,
  buildExplainTrace,
  stepsToDisplayTree,
  classifyStepType,
  generateBreadcrumbs,
  summarizeTracePath,
  formatStepForUser,
  filterTraceTree,
  calculateOverallConfidence,
  countTraceNodes,
} from './explainTraceEngine'

export type {
  TraceNodeType,
  TraceDisplayStatus,
  TraceStepInput,
  TraceDisplayNode,
  TraceBreadcrumb,
  TracePathSummary,
  ExplainTraceOutput,
  TraceFilterOptions,
} from './explainTraceTypes'

export { DEFAULT_TRACE_FILTER } from './explainTraceTypes'

// Module VI: Cache Tier Engine
export {
  CACHE_TIER_VERSION,
  getFromCache,
  setCache,
  invalidateCache,
  invalidateAll,
  getCacheStats,
  getFullCacheReport,
  promoteEntry,
  estimateSize,
  resetCacheStore,
} from './cacheTierEngine'

export type {
  CacheTier,
  CacheStrategy,
  CacheEntry,
  CacheTierConfig,
  CacheStats,
  CacheTierOutput,
  CacheInvalidationRule,
  CacheSetOptions,
} from './cacheTierTypes'

export { DEFAULT_CACHE_CONFIGS } from './cacheTierTypes'

// Module VII: License Manager
export {
  LICENSE_MANAGER_VERSION,
  generateLicense,
  validateLicense,
  checkFeatureAccess,
  getFeaturePermissions,
  revokeLicense,
  upgradeLicense,
  enforceLicenseGate,
  getLicenseByKey,
  getAllLicenses,
  getTierLimits,
  registerCustomFeatures,
  resetLicenseStore,
} from './licenseManagerEngine'

export type {
  LicenseTier,
  LicenseStatus,
  LicenseInfo,
  FeaturePermission,
  LicenseCheckResult,
  LicenseValidationResult,
  TierLimits,
} from './licenseManagerTypes'

export { LICENSE_FEATURES, TIER_LIMITS, TIER_ORDER } from './licenseManagerTypes'

// Module VIII: Multi-Language Engine
export {
  MULTI_LANGUAGE_VERSION,
  translate,
  translateBatch,
  registerNamespace,
  registerTranslations,
  getTranslationStats,
  detectMissingTranslations,
  getSupportedLocales,
  getTranslationEntry,
  getAllTranslations,
  resetTranslationStore,
} from './multiLanguageEngine'

export type {
  SupportedLocale,
  TranslationEntry,
  TranslationNamespace,
  MultiLanguageOptions,
  TranslationStats,
  LocalizedOutput,
} from './multiLanguageTypes'

export { LOCALE_NAMES, SUPPORTED_LOCALES } from './multiLanguageTypes'

// Module IX: Dashboard v2 Engine
export {
  DASHBOARD_V2_VERSION,
  generateDashboardV2,
  collectHealthMetrics,
  collectPerformanceMetrics,
  collectKnowledgeMetrics,
  collectCoverageMetrics,
  collectRegressionMetrics,
  collectCaseMetrics,
  collectExpertMetrics,
  collectReportMetrics,
  calculateDashboardV2Score,
  mapStatusToOverall,
  generateRecommendations,
} from './dashboardV2Engine'

export type {
  DashboardPanel,
  DashboardStatus,
  DashboardV2Metric,
  DashboardV2Section,
  DashboardV2Options,
  DashboardV2,
  DashboardV2Snapshot,
} from './dashboardV2Types'

export { ALL_DASHBOARD_PANELS, PANEL_WEIGHTS, DEFAULT_DASHBOARD_V2_OPTIONS } from './dashboardV2Types'

// Module P: Release Checklist Engine
export {
  RELEASE_CHECKLIST_VERSION,
  runReleaseChecklist,
  evaluateReleaseGate,
  getChecklistItemStatus,
  getFailedItems,
  generateChecklistReport,
  registerChecklistAutomation,
  getChecklistSummary,
  simulateFailure,
  resetSimulation,
  getCurrentChecklist,
} from './releaseChecklistEngine'

export type {
  ChecklistItemStatus,
  ChecklistCategory,
  GateDecision,
  ChecklistItem,
  ReleaseChecklist,
  ChecklistSummary,
  ReleaseGateOptions,
  ChecklistAutomationRule,
} from './releaseChecklistTypes'

export { DEFAULT_CHECKLIST_ITEMS, CHECKLIST_CATEGORIES } from './releaseChecklistTypes'

// ═══════════════════════════════════════════════════════════════════
// V5.0 GA: Product Launch — Real User Validation + Admin + Audit
// ═══════════════════════════════════════════════════════════════════

// P0: User Feedback System
export {
  USER_FEEDBACK_VERSION,
  submitUserFeedback,
  getFeedbackById,
  getFeedbacksByReportId,
  getFeedbacksByUserId,
  getFeedbacksByRating,
  getFeedbacksByDateRange,
  validateFeedback,
  getFeedbackStats,
  getAllFeedbacks,
  getUnvalidatedFeedbacks,
  getSectionAccuracyReport,
  resetFeedbackStore,
} from './userFeedbackEngine'

export type {
  FeedbackChannel,
  ReportSection,
  SatisfactionRating,
  UserFeedbackEntry,
  UserFeedbackStats,
  UserFeedbackOptions,
} from './userFeedbackTypes'

// P0: Expert Review Form
export {
  EXPERT_REVIEW_FORM_VERSION,
  registerReviewer,
  submitExpertReview,
  getReviewById,
  getReviewsByCaseId,
  getReviewsByReviewerId,
  getReviewsBySeverity,
  getDisagreementReviews,
  getReviewStats as getExpertReviewFormStats,
  getReviewerProfile,
  getAllReviewers,
  calculateReviewerAgreement,
  resetReviewFormStore,
} from './expertReviewFormEngine'

export type {
  ReviewerLevel,
  ReviewDimension,
  ReviewVerdict,
  CaseSeverity,
  ExpertReviewerProfile,
  ExpertReviewFormEntry,
  ExpertReviewFormStats,
} from './expertReviewFormTypes'

// P0: AI vs Expert Diff
export {
  AI_EXPERT_DIFF_VERSION,
  recordDiff,
  getDiffById,
  getDiffsByCaseId,
  getDiffsByCategory,
  getDiffsBySeverity,
  getUnresolvedDiffs,
  resolveDiff,
  getDiffStats,
  getTopDiffFields,
  batchResolveDiffs,
  getAllDiffs,
  resetDiffStore,
} from './aiExpertDiffEngine'

export type {
  DiffCategory,
  DiffResolution,
  AiExpertDiffEntry,
  AiExpertDiffStats,
} from './aiExpertDiffTypes'

// P0: Knowledge Queue Bridge
export {
  KNOWLEDGE_QUEUE_BRIDGE_VERSION,
  enqueueItem,
  enqueueFromUserFeedback,
  enqueueFromExpertReview,
  enqueueFromAiDiff,
  getItemById,
  getPendingItems,
  getItemsByStatus,
  getItemsBySourceType,
  assignItem,
  resolveItem,
  getQueueStats,
  getAllItems,
  resetQueueStore,
} from './knowledgeQueueBridgeEngine'

export type {
  QueueSourceType,
  QueuePriority,
  QueueItemStatus,
  KnowledgeQueueItem,
  KnowledgeQueueStats,
} from './knowledgeQueueBridgeTypes'

// P1: Admin Schema
export {
  ADMIN_SCHEMA_VERSION,
  validateAdminUser,
  validateAdminOrder,
  validateAdminReport,
  validateAdminCase,
  validateApiKey,
  checkPermission,
  hasMinimumRole,
  generateSchemaDefinition,
  getModulePermissions,
  validateAllSchemas,
} from './adminSchemaEngine'

export type {
  EntityStatus,
  PaymentStatus,
  ReportStatus,
  AuditAction,
  LogSeverity,
  AdminUser,
  AdminOrder,
  AdminReport,
  AdminCase,
  AdminKnowledgeEntry,
  AdminExpertReview,
  AdminStatsSummary,
  AdminSystemLog,
  AdminPermission,
  AdminApiKey,
  AdminDashboardConfig,
} from './adminSchemaTypes'

export { ADMIN_MODULES, ROLE_HIERARCHY } from './adminSchemaTypes'

// P2: GA Release Audit
export {
  GA_RELEASE_AUDIT_VERSION,
  runGaReleaseAudit,
  generateAuditReport,
  evaluateAuditGate,
  getChecklistItem,
  getBlockers,
  getAuditSummary,
  getItemsByCategory,
  getItemsBySeverity,
  signOffAudit,
  getAuditHistory,
  simulateAuditFailure,
  resetAuditSimulation,
} from './gaReleaseAuditEngine'

export type {
  AuditCategory,
  AuditSeverity,
  AuditStatus,
  AuditGateDecision,
  AuditCheckItem,
  AuditChecklist,
  AuditReport,
  AuditSignOff,
} from './gaReleaseAuditTypes'

export { GA_AUDIT_CHECKLIST, AUDIT_CATEGORIES } from './gaReleaseAuditTypes'

// ═══════════════════════════════════════════════════════════════════
// V5.0 GA Phase 6: Real World Validation — 真实世界验证阶段
// ═══════════════════════════════════════════════════════════════════

// P0: User Lifecycle System
export {
  USER_LIFECYCLE_VERSION,
  recordLifecycleEvent,
  getUserJourney,
  getUserJourneyStats,
  getConversionFunnel,
  getUsersByStage,
  getUserRetention,
  getEventCountByType,
  getTopEventPaths,
  getDeviceDistribution,
  getAllJourneys,
  resetLifecycleStore,
} from './userLifecycleEngine'

export type {
  UserLifecycleEvent,
  UserLifecycleEventRecord,
  UserJourney,
  UserJourneyStats,
  UserLifecycleOptions,
} from './userLifecycleTypes'

export { CONVERSION_STAGES, CONVERSION_STAGE_CONDITIONS } from './userLifecycleTypes'

// P0: Report Feedback Enhanced
export {
  REPORT_FEEDBACK_ENHANCED_VERSION,
  submitEnhancedFeedback,
  getFeedbackById as getEnhancedFeedbackById,
  getFeedbacksByReportId as getEnhancedFeedbacksByReportId,
  getFeedbacksByUserId as getEnhancedFeedbacksByUserId,
  autoEnqueueToCaseLibrary,
  getFeedbackAnalytics as getEnhancedFeedbackStats,
  getDimensionAverage,
  getTopDisputedSections,
  getExperienceHighlights,
  getAllFeedbacks as getAllEnhancedFeedbacks,
  resetFeedbackStore as resetEnhancedFeedbackStore,
} from './reportFeedbackEnhancedEngine'

export type {
  FeedbackDimension,
  DimensionFeedback,
  ParagraphFeedback,
  EnhancedReportFeedback,
  ReportFeedbackAnalytics,
} from './reportFeedbackEnhancedTypes'

export { FEEDBACK_DIMENSIONS, DIMENSION_LABELS } from './reportFeedbackEnhancedTypes'

// P0: Expert Review Upgrade
export {
  EXPERT_REVIEW_UPGRADE_VERSION,
  createExpertAccount,
  getExpertAccount,
  updateExpertStats,
  promoteExpert,
  getExpertLeaderboard,
  getExpertsByTier,
  getExpertsBySpecialty,
  getExpertSystemStats,
  checkTierEligibility,
  getAllExperts,
  resetExpertStore,
} from './expertReviewUpgradeEngine'

export type {
  ExpertTier,
  ExpertSpecialty,
  ExpertAccount,
  ExpertLeaderboard,
  AiExpertDiffRanking,
  ExpertSystemStats,
} from './expertReviewUpgradeTypes'

export { EXPERT_TIERS, EXPERT_TIER_REQUIREMENTS } from './expertReviewUpgradeTypes'

// P1: Product Tier System
export {
  PRODUCT_TIER_VERSION,
  getTierConfig,
  getTierFeatures,
  canAccessFeature,
  canAccessReportType,
  createSubscription,
  cancelSubscription,
  renewSubscription,
  getActiveSubscription,
  getUserTier,
  checkReportLimit,
  getAllSubscriptions,
  resetSubscriptionStore,
} from './productTierEngine'

export type {
  ProductTier,
  ReportType,
  TierFeature,
  ProductTierConfig,
  UserSubscription,
} from './productTierTypes'

export { TIER_CONFIGS } from './productTierTypes'

// P1: Payment Order System
export {
  PAYMENT_ORDER_VERSION,
  createOrder,
  payOrder,
  refundOrder,
  cancelOrder,
  expireOrder,
  getOrderById,
  getOrdersByUserId,
  getOrdersByStatus,
  getOrdersByDateRange,
  getPaymentStats,
  getAllOrders,
  resetOrderStore,
} from './paymentOrderEngine'

export type {
  PaymentMethod,
  OrderStatus,
  OrderType,
  PaymentOrder,
  PaymentStats,
} from './paymentOrderTypes'

export { PAYMENT_METHODS, ORDER_EXPIRY_MINUTES } from './paymentOrderTypes'

// P2: Report Optimization
export {
  REPORT_OPTIMIZATION_ENGINE_VERSION,
  createSuggestion,
  implementSuggestion,
  deferSuggestion,
  rejectSuggestion,
  getSuggestionById,
  getSuggestionsByCategory,
  getSuggestionsByPriority,
  getSuggestionsByStatus,
  createOptimizationPlan,
  getOptimizationStats,
  getDefaultSuggestions,
  getAllSuggestions,
  resetSuggestionStore,
} from './reportOptimizationEngine'

export type {
  OptimizationCategory,
  OptimizationPriority,
  OptimizationSuggestion,
  ReportOptimizationPlan,
  OptimizationStats,
} from './reportOptimizationTypes'

export { OPTIMIZATION_CATEGORIES, DEFAULT_OPTIMIZATION_SUGGESTIONS } from './reportOptimizationTypes'

// P3: Data Asset Tracker
export {
  DATA_ASSET_TRACKER_ENGINE_VERSION,
  createMilestone,
  getMilestoneById,
  getMilestonesByAssetType,
  updateMilestone,
  completeMilestone,
  deleteMilestone,
  getAllMilestones,
  recordGrowth,
  getGrowthRecords,
  getGrowthRecordsByDate,
  getAssetTrend,
  takeSnapshot as takeDataAssetSnapshot,
  evaluatePhaseCompletion,
  isPhaseComplete,
  seedDefaultMilestones,
  getAssetStats as getDataAssetStats,
  getProgressReport as getDataAssetProgressReport,
  resetStore as resetDataAssetStore,
} from './dataAssetTrackerEngine'

export type {
  AssetType,
  MilestoneStatus,
  GrowthTrend,
  AssetMilestone,
  AssetGrowthRecord,
  DataAssetSnapshot,
  PhaseCompletionCriteria,
} from './dataAssetTrackerTypes'
