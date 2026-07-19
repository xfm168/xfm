/**
 * H2.1 Enterprise: Prompt Registry
 *
 * 支持 register/unregister/version/rollback/diff。
 * 每个 Prompt 都有完整的元数据。
 */

export interface PromptEntry {
  id: string
  version: string
  author: string
  updatedAt: number
  description: string
  tags: string[]
  category: string
  systemPrompt: string
  userTemplate: string
}

interface VersionRecord {
  version: string
  entry: PromptEntry
  createdAt: number
}

export class PromptRegistry {
  private entries: Map<string, PromptEntry> = new Map()
  private versions: Map<string, VersionRecord[]> = new Map()  // id -> version history

  register(entry: PromptEntry): void {
    this.entries.set(entry.id, entry)

    // 记录版本历史
    if (!this.versions.has(entry.id)) {
      this.versions.set(entry.id, [])
    }
    this.versions.get(entry.id)!.push({
      version: entry.version,
      entry: { ...entry },
      createdAt: Date.now(),
    })
  }

  unregister(id: string): boolean {
    this.versions.delete(id)
    return this.entries.delete(id)
  }

  get(id: string): PromptEntry | undefined {
    return this.entries.get(id)
  }

  /** 获取指定版本 */
  getVersion(id: string, version: string): PromptEntry | undefined {
    const history = this.versions.get(id)
    if (!history) return undefined
    const record = history.find(r => r.version === version)
    return record?.entry
  }

  /** 回滚到指定版本 */
  rollback(id: string, version: string): PromptEntry | undefined {
    const target = this.getVersion(id, version)
    if (!target) return undefined
    const restored: PromptEntry = {
      ...target,
      updatedAt: Date.now(),
      description: `[rollback to v${version}] ${target.description}`,
    }
    this.entries.set(id, restored)
    return restored
  }

  /** 获取版本历史 */
  getHistory(id: string): VersionRecord[] {
    return this.versions.get(id) || []
  }

  /** diff 两个版本 */
  diff(id: string, versionA: string, versionB: string): { field: string; from: string; to: string }[] {
    const a = this.getVersion(id, versionA)
    const b = this.getVersion(id, versionB)
    if (!a || !b) return []

    const diffs: { field: string; from: string; to: string }[] = []
    const fields: (keyof PromptEntry)[] = ['systemPrompt', 'userTemplate', 'description', 'tags'] as any
    for (const field of fields) {
      const valA = JSON.stringify(a[field])
      const valB = JSON.stringify(b[field])
      if (valA !== valB) {
        diffs.push({ field, from: valA, to: valB })
      }
    }
    return diffs
  }

  /** 按 category 查询 */
  findByCategory(category: string): PromptEntry[] {
    return Array.from(this.entries.values()).filter(e => e.category === category)
  }

  /** 按 tag 查询 */
  findByTag(tag: string): PromptEntry[] {
    return Array.from(this.entries.values()).filter(e => e.tags.includes(tag))
  }

  /** 列出所有 */
  list(): PromptEntry[] {
    return Array.from(this.entries.values())
  }

  /** 清空 */
  clear(): void {
    this.entries.clear()
    this.versions.clear()
  }

  get size(): number {
    return this.entries.size
  }
}