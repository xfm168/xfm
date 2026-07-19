/**
 * H2.1 Enterprise P2: AI Memory Stub
 * 
 * 预留接口。支持 Conversation/Session/User Preference/Prompt History。
 */

export interface MemoryEntry {
  id: string
  type: 'conversation' | 'session' | 'preference' | 'prompt_history'
  userId?: string
  sessionId?: string
  content: string
  metadata: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

export interface IMemoryStore {
  save(entry: MemoryEntry): Promise<void>
  get(id: string): Promise<MemoryEntry | undefined>
  query(filter: Partial<MemoryEntry>): Promise<MemoryEntry[]>
  delete(id: string): Promise<boolean>
}

export class InMemoryStore implements IMemoryStore {
  private store: Map<string, MemoryEntry> = new Map()

  async save(entry: MemoryEntry): Promise<void> {
    this.store.set(entry.id, { ...entry, updatedAt: Date.now() })
  }

  async get(id: string): Promise<MemoryEntry | undefined> {
    return this.store.get(id)
  }

  async query(filter: Partial<MemoryEntry>): Promise<MemoryEntry[]> {
    return Array.from(this.store.values()).filter(entry => {
      for (const [key, value] of Object.entries(filter)) {
        if ((entry as any)[key] !== value) return false
      }
      return true
    })
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id)
  }

  get size(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }
}
