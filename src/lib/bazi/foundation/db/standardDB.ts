/**
 * P0-5 Part 8: 命理数据库标准化
 *
 * 建立统一数据库接口：
 *   ClassicDB  — 古籍库
 *   RuleDB     — 规则库
 *   CaseDB     — 命例库
 *   SchoolDB   — 流派库
 *   EngineDB   — 引擎库
 *   ExplainDB  — 解释库
 *
 * 所有数据统一管理，支持查询/插入/更新/删除
 */

import type { StandardDB, DBType } from '../types'
import type { RuleDSLDefinition } from '../types'

// ============================================================
// 内存数据库实现基类
// ============================================================

/** 内存数据库基类（实现 StandardDB 接口） */
class MemoryDB<T extends { id?: string; caseId?: string; ruleId?: string }> implements StandardDB<T> {
  readonly type: DBType
  readonly name: string
  readonly version: string
  protected records: Map<string, T> = new Map()
  protected lastUpdated: number = Date.now()

  constructor(type: DBType, name: string, version = '1.0.0') {
    this.type = type
    this.name = name
    this.version = version
  }

  private getKey(record: T): string {
    return (record as any).id ?? (record as any).caseId ?? (record as any).ruleId ?? String(Date.now())
  }

  query(filter: Record<string, any>): T[] {
    return Array.from(this.records.values()).filter(record => {
      for (const [key, value] of Object.entries(filter)) {
        if ((record as any)[key] !== value) return false
      }
      return true
    })
  }

  getById(id: string): T | undefined {
    return this.records.get(id)
  }

  insert(record: T): boolean {
    const key = this.getKey(record)
    if (this.records.has(key)) return false
    this.records.set(key, record)
    this.lastUpdated = Date.now()
    return true
  }

  update(id: string, patch: Partial<T>): boolean {
    const existing = this.records.get(id)
    if (!existing) return false
    this.records.set(id, { ...existing, ...patch })
    this.lastUpdated = Date.now()
    return true
  }

  delete(id: string): boolean {
    const deleted = this.records.delete(id)
    if (deleted) this.lastUpdated = Date.now()
    return deleted
  }

  stats(): { total: number; lastUpdated: number } {
    return { total: this.records.size, lastUpdated: this.lastUpdated }
  }

  /** 批量插入 */
  bulkInsert(records: T[]): number {
    let count = 0
    for (const r of records) {
      if (this.insert(r)) count++
    }
    return count
  }

  /** 获取所有记录 */
  all(): T[] {
    return Array.from(this.records.values())
  }
}

// ============================================================
// 六大标准数据库
// ============================================================

/** 古籍库 */
export class ClassicDB extends MemoryDB<{
  id: string
  classicName: string
  chapter?: string
  text: string
  concept?: string
  wuxing?: string
  school?: string
}> {
  constructor() { super('classic', 'ClassicDB') }

  /** 按经典名称查询 */
  listByClassic(name: string) {
    return this.query({ classicName: name })
  }

  /** 按概念查询 */
  listByConcept(concept: string) {
    return this.all().filter(r => r.concept === concept)
  }

  /** 按五行查询 */
  listByWuxing(wuxing: string) {
    return this.all().filter(r => r.wuxing === wuxing)
  }
}

/** 规则库 */
export class RuleDB extends MemoryDB<RuleDSLDefinition & { id: string }> {
  constructor() { super('rule', 'RuleDB') }

  /** 按类别查询 */
  listByCategory(category: string) {
    return this.all().filter(r => r.category === category)
  }

  /** 按来源查询 */
  listBySource(source: string) {
    return this.all().filter(r => r.source.includes(source))
  }

  /** 按标签查询 */
  listByTag(tag: string) {
    return this.all().filter(r => r.tags?.includes(tag))
  }
}

/** 命例库 */
export class CaseDB extends MemoryDB<{
  caseId: string
  name: string
  source: string
  dayGan: string
  fourPillars: any
  groundTruth: any
  caseConfidence: number
}> {
  constructor() { super('case', 'CaseDB') }

  /** 按来源查询 */
  listBySource(source: string) {
    return this.query({ source })
  }

  /** 按日干查询 */
  listByDayGan(dayGan: string) {
    return this.query({ dayGan })
  }

  /** 高置信度命例 */
  listHighConfidence(minConfidence = 0.8) {
    return this.all().filter(c => c.caseConfidence >= minConfidence)
  }
}

/** 流派库 */
export class SchoolDB extends MemoryDB<{
  schoolId: string
  schoolName: string
  description: string
  classicSources: string[]
  weights: Record<string, number>
  accuracy?: number
}> {
  constructor() { super('school', 'SchoolDB') }

  /** 按准确率排序 */
  listByAccuracy() {
    return this.all().sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))
  }
}

/** 引擎库 */
export class EngineDB extends MemoryDB<{
  engineId: string
  engineName: string
  category: string
  health: number
  accuracy: number
  evidenceCount: number
  classicCount: number
  conflictCount: number
  avgLatencyMs: number
  version: string
}> {
  constructor() { super('engine', 'EngineDB') }

  /** 按健康度排序 */
  listByHealth() {
    return this.all().sort((a, b) => b.health - a.health)
  }

  /** 不健康的引擎 */
  listUnhealthy(threshold = 0.5) {
    return this.all().filter(e => e.health < threshold)
  }
}

/** 解释库 */
export class ExplainDB extends MemoryDB<{
  explainId: string
  ruleId?: string
  decisionResultId?: string
  explainText: string
  explainScore?: number
  classicCited?: string[]
  createdAt: number
}> {
  constructor() { super('explain', 'ExplainDB') }

  /** 按规则 ID 查询 */
  listByRule(ruleId: string) {
    return this.query({ ruleId })
  }

  /** 高分解释 */
  listHighScore(minScore = 70) {
    return this.all().filter(e => (e.explainScore ?? 0) >= minScore)
  }
}

// ============================================================
// 数据库管理器（统一入口）
// ============================================================

/** 数据库管理器：统一管理六大数据库 */
export class DatabaseManager {
  readonly classicDB = new ClassicDB()
  readonly ruleDB = new RuleDB()
  readonly caseDB = new CaseDB()
  readonly schoolDB = new SchoolDB()
  readonly engineDB = new EngineDB()
  readonly explainDB = new ExplainDB()

  /** 获取所有数据库统计 */
  getAllStats(): Record<string, { total: number; lastUpdated: number }> {
    return {
      classic: this.classicDB.stats(),
      rule: this.ruleDB.stats(),
      case: this.caseDB.stats(),
      school: this.schoolDB.stats(),
      engine: this.engineDB.stats(),
      explain: this.explainDB.stats(),
    }
  }

  /** 按类型获取数据库 */
  getDB(type: DBType): StandardDB {
    switch (type) {
      case 'classic': return this.classicDB
      case 'rule': return this.ruleDB
      case 'case': return this.caseDB
      case 'school': return this.schoolDB
      case 'engine': return this.engineDB
      case 'explain': return this.explainDB
    }
  }

  /** 总记录数 */
  totalRecords(): number {
    return Object.values(this.getAllStats()).reduce((sum, s) => sum + s.total, 0)
  }
}

/** 全局数据库管理器单例 */
export const globalDBManager = new DatabaseManager()
