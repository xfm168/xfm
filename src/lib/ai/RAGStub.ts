/**
 * H2.1 Enterprise P2: RAG (Retrieval-Augmented Generation) Stub
 * 
 * 预留接口，H2.2 实现向量检索 + Prompt 增强。
 * 支持八字/风水/紫微/六爻知识库。
 */

export interface RAGDocument {
  id: string
  content: string
  metadata: Record<string, unknown>
  embedding?: number[]
}

export interface RAGQuery {
  query: string
  topK?: number
  category?: string
}

export interface RAGResult {
  documents: RAGDocument[]
  scores: number[]
}

/**
 * RAG 接口预留。
 * H2.2 将实现基于向量数据库的检索。
 */
export interface IRAGRetriever {
  index(documents: RAGDocument[]): Promise<void>
  search(query: RAGQuery): Promise<RAGResult>
  delete(ids: string[]): Promise<void>
}

// Stub: 占位实现，H2.2 替换
export class StubRAGRetriever implements IRAGRetriever {
  async index(_documents: RAGDocument[]): Promise<void> { /* stub */ }
  async search(_query: RAGQuery): Promise<RAGResult> { return { documents: [], scores: [] } }
  async delete(_ids: string[]): Promise<void> { /* stub */ }
}
