/**
 * RC3-4: Cache 体系 - 统一导出
 *
 * 统一缓存入口：
 * - CacheManager: 核心缓存管理器
 * - AnalysisCache: 分析结果缓存（TTL 24h）
 * - HexagramCache: 六十四卦数据缓存（TTL 无限）
 * - RuleCache: 规则引擎结果缓存（TTL 1h）
 * - KnowledgeCache: 知识库缓存（TTL 永久）
 * - SessionCache: 会话级缓存（TTL 30min）
 * - CacheReport: 缓存报告生成器
 *
 * @example
 * import { analysisCache, generateReport } from '@/lib/cache'
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

// ─── 核心管理器 ───────────────────────────────────
export { CacheManager, hashString } from './CacheManager'
export type { CacheEntry, CacheStats, CacheManagerOptions } from './CacheManager'

// ─── 分析结果缓存 ─────────────────────────────────
export {
  analysisCache,
  generateAnalysisKey,
  getAnalysis,
  setAnalysis,
  deleteAnalysis,
} from './AnalysisCache'
export type { AnalysisKeyParams } from './AnalysisCache'

// ─── 卦象数据缓存 ─────────────────────────────────
export {
  hexagramCache,
  preloadHexagrams,
  getHexagram,
  getHexagramByNumber,
  setHexagramByNumber,
  getHexagramCount,
} from './HexagramCache'
export type { HexagramData } from './HexagramCache'

// ─── 规则引擎缓存 ─────────────────────────────────
export {
  ruleCache,
  generateRuleKey,
  getRuleResult,
  setRuleResult,
  deleteRuleResult,
} from './RuleCache'

// ─── 知识库缓存 ───────────────────────────────────
export {
  knowledgeCache,
  getKnowledge,
  setKnowledge,
  setKnowledgeBatch,
  hasKnowledge,
  getKnowledgeCount,
} from './KnowledgeCache'

// ─── 会话级缓存 ───────────────────────────────────
export {
  sessionCache,
  SESSION_KEYS,
  getSessionState,
  setSessionState,
  deleteSessionState,
  clearSessionState,
  refreshSessionState,
} from './SessionCache'

// ─── 缓存报告 ─────────────────────────────────────
export { generateReport, exportHTML, exportJSON } from './CacheReport'
export type { CacheReportData } from './CacheReport'
