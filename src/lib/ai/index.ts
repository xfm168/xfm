/**
 * H2.1: Unified AI Layer — 统一导出
 */

// Provider & Types
export type {
  AIProviderType, AIModel, AIMessage, AIRequestOptions,
  AIResponse, AIStreamChunk, AIProviderConfig, AIRetryableError,
} from './AIProvider'
export { AIError } from './AIProvider'

// Manager
export { AIManager } from './AIManager'
export type { AIManagerConfig } from './AIManager'

// Prompt
export { registerPrompt, getPrompt, renderPrompt, listPrompts } from './PromptBuilder'
export type { PromptCategory, PromptTemplate as PromptTemplateDef } from './PromptBuilder'

export { PROMPT_VERSION, setPromptVersion, getPromptVersion, getPromptVersionKey } from './PromptVersion'

export { PromptCache } from './PromptCache'
export { AIResponseCache } from './AIResponseCache'

// Metrics
export { AITokenCounter } from './AITokenCounter'
export type { TokenUsage, ModelCost } from './AITokenCounter'

export { AIUsageMetrics } from './AIUsageMetrics'
export type { UsageSnapshot } from './AIUsageMetrics'

// P0 Enterprise
export { AIRouter } from './AIRouter'
export type { TaskType, RouterStrategy, RouterRule } from './AIRouter'

export { PromptRegistry } from './PromptRegistry'
export type { PromptEntry } from './PromptRegistry'

export { PromptTemplate } from './PromptTemplate'

export type { AIResult, AIResultList } from './AIResult'
export { aiSuccess, aiFailure, mergeResults } from './AIResult'
export { AICostManager } from './AICostManager'
export type { CostRecord, BudgetConfig, CostSnapshot } from './AICostManager'

export { AIQueue } from './AIQueue'

export { batchGenerate, batchVision } from './AIBatchRequest'
export type { BatchOptions, BatchResult } from './AIBatchRequest'

export { AIAnalytics } from './AIAnalytics'
export type { AnalyticsSnapshot, ProviderAnalytics } from './AIAnalytics'

// P2 Stubs
export { StubRAGRetriever } from './RAGStub'
export type { RAGDocument, RAGQuery, RAGResult, IRAGRetriever } from './RAGStub'

export { FunctionRegistry } from './FunctionCallingStub'
export type { FunctionDefinition, FunctionCall, FunctionCallResult } from './FunctionCallingStub'

export { StubMCPServer } from './MCPStub'
export type { MCPTool, MCPServerConfig, IMCPServer } from './MCPStub'

export { StubAgent } from './MultiAgentStub'
export type { AgentConfig, AgentMessage, AgentResult, IAgent } from './MultiAgentStub'

export { InMemoryStore } from './AIMemoryStub'
export type { MemoryEntry, IMemoryStore } from './AIMemoryStub'
