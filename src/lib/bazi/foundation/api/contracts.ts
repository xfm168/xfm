/**
 * P0-5 Part 9: API 标准
 *
 * 统一 API 合约定义，支持：
 *   Decision API — 决策推演
 *   Rule API     — 规则管理
 *   Case API     — 命例管理
 *   Classic API  — 古籍管理
 *   Explain API  — 解释管理
 *   Quality API  — 质量管理
 *
 * 方便以后 Web / APP / 小程序 / 桌面版 全部共用
 */

import type { APIContract, APIEndpoint } from '../types'

// ============================================================
// Decision API 合约
// ============================================================

export const DECISION_API: APIContract = {
  name: 'Decision API',
  version: '5.0.0',
  basePath: '/api/v5/decision',
  endpoints: [
    {
      path: '/analyze',
      method: 'POST',
      description: '完整八字推演（返回 DecisionResult V3）',
      requestType: 'AnalyzeRequest { birthInfo: BirthInfo; school?: string; options?: AnalyzeOptions }',
      responseType: 'DecisionResultV3',
      requireAuth: true,
    },
    {
      path: '/xiyongshen',
      method: 'POST',
      description: '喜用神推演',
      requestType: 'SubEngineInput',
      responseType: 'DecisionResult',
      requireAuth: true,
    },
    {
      path: '/result/:id',
      method: 'GET',
      description: '获取历史推演结果',
      responseType: 'DecisionResultV3',
      requireAuth: true,
    },
    {
      path: '/schools',
      method: 'GET',
      description: '获取可用流派列表',
      responseType: 'SchoolProfile[]',
      requireAuth: false,
    },
    {
      path: '/switch-school',
      method: 'POST',
      description: '切换流派并重新推演',
      requestType: '{ school: string; input: SubEngineInput }',
      responseType: 'DecisionResult',
      requireAuth: true,
    },
  ],
}

// ============================================================
// Rule API 合约
// ============================================================

export const RULE_API: APIContract = {
  name: 'Rule API',
  version: '5.0.0',
  basePath: '/api/v5/rule',
  endpoints: [
    {
      path: '/list',
      method: 'GET',
      description: '获取规则列表（支持按类别/标签/来源筛选）',
      responseType: 'RuleDSLDefinition[]',
      requireAuth: true,
    },
    {
      path: '/:id',
      method: 'GET',
      description: '获取规则详情',
      responseType: 'RuleDSLDefinition',
      requireAuth: true,
    },
    {
      path: '/create',
      method: 'POST',
      description: '创建新规则（DSL 格式）',
      requestType: 'RuleDSLDefinition',
      responseType: '{ success: boolean; ruleId: string }',
      requireAuth: true,
    },
    {
      path: '/:id',
      method: 'PUT',
      description: '更新规则（自动版本管理）',
      requestType: 'RuleDSLDefinition',
      responseType: '{ success: boolean; newVersion: string }',
      requireAuth: true,
    },
    {
      path: '/:id/rollback',
      method: 'POST',
      description: '回滚到指定版本',
      requestType: '{ targetVersion: string }',
      responseType: '{ success: boolean; currentVersion: string }',
      requireAuth: true,
    },
    {
      path: '/:id/history',
      method: 'GET',
      description: '获取规则版本历史',
      responseType: 'RuleVersionRecord',
      requireAuth: true,
    },
    {
      path: '/benchmark',
      method: 'GET',
      description: '获取规则基准报告',
      responseType: 'RuleBenchmarkReport',
      requireAuth: true,
    },
  ],
}

// ============================================================
// Case API 合约
// ============================================================

export const CASE_API: APIContract = {
  name: 'Case API',
  version: '5.0.0',
  basePath: '/api/v5/case',
  endpoints: [
    {
      path: '/list',
      method: 'GET',
      description: '获取命例列表（支持按来源/日干/置信度筛选）',
      responseType: 'BaziCase[]',
      requireAuth: true,
    },
    {
      path: '/:id',
      method: 'GET',
      description: '获取命例详情',
      responseType: 'BaziCase',
      requireAuth: true,
    },
    {
      path: '/create',
      method: 'POST',
      description: '新增命例',
      requestType: 'BaziCase',
      responseType: '{ success: boolean; caseId: string }',
      requireAuth: true,
    },
    {
      path: '/similarity',
      method: 'POST',
      description: '案例相似度匹配',
      requestType: '{ input: SubEngineInput; topN?: number }',
      responseType: 'CaseSimilarityReport',
      requireAuth: true,
    },
    {
      path: '/batch-evaluate',
      method: 'POST',
      description: '批量评估命例准确率',
      requestType: '{ caseIds: string[]; school?: string }',
      responseType: 'AccuracyReport',
      requireAuth: true,
    },
  ],
}

// ============================================================
// Classic API 合约
// ============================================================

export const CLASSIC_API: APIContract = {
  name: 'Classic API',
  version: '5.0.0',
  basePath: '/api/v5/classic',
  endpoints: [
    {
      path: '/list',
      method: 'GET',
      description: '获取古籍条目列表',
      responseType: 'ClassicEntry[]',
      requireAuth: false,
    },
    {
      path: '/by-classic/:name',
      method: 'GET',
      description: '按经典名称查询条目',
      responseType: 'ClassicEntry[]',
      requireAuth: false,
    },
    {
      path: '/validate',
      method: 'POST',
      description: '校验古籍引用合法性',
      requestType: '{ classicName: string; quote: string; ruleId: string; supportedWuxing: string }',
      responseType: 'ClassicValidationResult',
      requireAuth: true,
    },
    {
      path: '/graph/query',
      method: 'POST',
      description: '知识图谱查询',
      requestType: '{ query: string; type?: string }',
      responseType: 'KGQueryResult',
      requireAuth: false,
    },
    {
      path: '/graph/path',
      method: 'POST',
      description: '知识图谱路径查找',
      requestType: '{ from: string; to: string }',
      responseType: 'ClassicPathResult',
      requireAuth: false,
    },
  ],
}

// ============================================================
// Explain API 合约
// ============================================================

export const EXPLAIN_API: APIContract = {
  name: 'Explain API',
  version: '5.0.0',
  basePath: '/api/v5/explain',
  endpoints: [
    {
      path: '/score',
      method: 'POST',
      description: '解释质量评分',
      requestType: '{ explainText: string; decisionResult: DecisionResult }',
      responseType: 'ExplainScoreReport',
      requireAuth: true,
    },
    {
      path: '/generate',
      method: 'POST',
      description: '生成解释（基于 DecisionResult）',
      requestType: '{ decisionResultId: string; detailLevel?: string }',
      responseType: '{ explainText: string; score: ExplainScoreReport }',
      requireAuth: true,
    },
    {
      path: '/history',
      method: 'GET',
      description: '获取解释历史',
      responseType: 'ExplainRecord[]',
      requireAuth: true,
    },
  ],
}

// ============================================================
// Quality API 合约
// ============================================================

export const QUALITY_API: APIContract = {
  name: 'Quality API',
  version: '5.0.0',
  basePath: '/api/v5/quality',
  endpoints: [
    {
      path: '/accuracy',
      method: 'GET',
      description: '获取准确率报告',
      responseType: 'AccuracyReport',
      requireAuth: true,
    },
    {
      path: '/rule-benchmark',
      method: 'GET',
      description: '获取规则基准报告',
      responseType: 'RuleBenchmarkReport',
      requireAuth: true,
    },
    {
      path: '/school-benchmark',
      method: 'GET',
      description: '获取流派基准报告',
      responseType: 'SchoolBenchmarkReport',
      requireAuth: true,
    },
    {
      path: '/dashboard',
      method: 'GET',
      description: '获取引擎运维面板',
      responseType: 'EngineDashboardReport',
      requireAuth: true,
    },
    {
      path: '/review',
      method: 'POST',
      description: '提交规则审核',
      requestType: '{ ruleId: string; ruleVersion: string }',
      responseType: 'ReviewReport',
      requireAuth: true,
    },
    {
      path: '/knowledge-benchmark',
      method: 'GET',
      description: '获取知识基准报告',
      responseType: 'RuleKnowledgeBenchmark[]',
      requireAuth: true,
    },
  ],
}

// ============================================================
// 所有 API 合约注册表
// ============================================================

export const ALL_API_CONTRACTS: APIContract[] = [
  DECISION_API,
  RULE_API,
  CASE_API,
  CLASSIC_API,
  EXPLAIN_API,
  QUALITY_API,
]

/** 按名称获取 API 合约 */
export function getAPIContract(name: string): APIContract | undefined {
  return ALL_API_CONTRACTS.find(c => c.name === name)
}

/** 获取所有端点 */
export function getAllEndpoints(): APIEndpoint[] {
  return ALL_API_CONTRACTS.flatMap(c => c.endpoints)
}
