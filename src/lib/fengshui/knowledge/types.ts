/**
 * 风水知识库 - 类型定义
 * 
 * Knowledge Base 架构：
 * - classic/   古籍知识库
 * - modern/    现代风水知识库
 * - cases/     案例知识库
 * - schools/   流派知识库
 * 
 * Rule 只保存 referenceId，Explain 从知识库读取
 */

// ============ 基础类型 ============

export type KnowledgeLanguage = 'original' | 'translation' | 'modern' | 'ai'
export type KnowledgeCategory = 'direction' | 'layout' | 'room' | 'kitchen' | 'bedroom' | 'wealth' | 'health' | 'career' | 'relationship' | 'environment'
export type FengShuiSchool = 'bazhai' | 'xuankong' | 'sanhe' | 'sanyuan' | 'xingfa' | 'zangfeng' | 'modern' | 'sanjiao'

// ============ 古籍知识条目 ============

export interface KnowledgeEntry {
  id: string
  bookId: string
  bookName: string
  chapter?: string
  section?: string
  topic: string
  tags: string[]
  
  // 多版本内容
  original?: string      // 原文
  translation?: string   // 白话翻译
  modern?: string        // 现代解释
  ai?: string            // AI解读
  
  // 关联信息
  school: FengShuiSchool[]
  category: KnowledgeCategory[]
  
  // 相关条目
  relatedEntries?: string[]
  relatedRules?: string[]
  
  // 元数据
  confidence: number     // 可信度 0-100
  verified: boolean      // 是否经过验证
}

// ============ 古籍书籍 ============

export interface ClassicBook {
  id: string
  name: string
  fullName?: string
  dynasty?: string
  author?: string
  description: string
  
  // 流派
  school: FengShuiSchool[]
  
  // 条目统计
  entryCount: number
  
  // 元数据
  importance: number     // 重要度 0-100
  verified: boolean
}

// ============ 案例 ============

export interface FengShuiCase {
  id: string
  title: string
  category: KnowledgeCategory
  type: 'sha' | 'auspicious' | 'neutral'   // 煞 / 吉 / 中性
  
  // 案例描述
  description: string
  characteristics: string[]     // 特征识别点
  effects: string[]             // 影响
  solutions: string[]           // 化解方法
  
  // 古籍依据
  references: {
    entryId: string
    bookId: string
    quote: string
  }[]
  
  // 关联规则
  relatedRules: string[]
  
  // 严重程度
  severity: 'mild' | 'moderate' | 'severe'
  
  // 图片特征（用于AI匹配）
  visualFeatures?: string[]
  
  // 可信度
  confidence: number
  verified: boolean
}

// ============ 流派 ============

export interface SchoolInfo {
  id: FengShuiSchool
  name: string
  fullName?: string
  origin?: string
  period?: string
  founder?: string
  
  description: string
  corePrinciples: string[]
  keyTexts: string[]
  
  // 特点
  strengths: string[]
  limitations: string[]
  
  // 代表人物
  representatives: string[]
  
  // 现代应用
  modernApplication: string
}

// ============ 现代知识条目 ============

export interface ModernKnowledge {
  id: string
  title: string
  category: KnowledgeCategory
  source: string
  author?: string
  
  content: string
  practicalTips: string[]
  scientificBasis?: string
  
  relatedClassicEntries: string[]
  relatedCases: string[]
  
  confidence: number
  verified: boolean
}

// ============ 知识库索引 ============

export interface KnowledgeIndex {
  books: ClassicBook[]
  schools: SchoolInfo[]
  caseCategories: string[]
  totalEntries: number
  totalCases: number
}

// ============ Explain 输入输出 ============

export interface ExplainInput {
  ruleId: string
  ruleName: string
  matched: boolean
  score: number
  context: any
  referenceIds: string[]
}

export interface ExplainOutput {
  classicalRefs: {
    book: string
    chapter?: string
    quote: string
    translation?: string
    school: FengShuiSchool
  }[]
  
  practicalExplanation: string
  suggestions: string[]
  relatedCases: FengShuiCase[]
  aiInterpretation?: string
}

// ============ RAG 检索结果 ============

export interface RAGResult {
  query: string
  results: {
    type: 'classic' | 'case' | 'modern'
    id: string
    title: string
    content: string
    relevance: number
    source: string
  }[]
  
  answer?: string
  confidence: number
}
