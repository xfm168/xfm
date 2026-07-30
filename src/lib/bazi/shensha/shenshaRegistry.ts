import type { DefinedShenSha } from './types'

export class ShenShaRegistry {
  private readonly map = new Map<string, DefinedShenSha>()

  register(def: DefinedShenSha): void {
    if (this.map.has(def.id)) {
      console.warn(`[ShenShaRegistry] 覆盖已存在的神煞 ${def.id}`)
    }
    this.map.set(def.id, def)
  }

  get(id: string): DefinedShenSha | undefined {
    return this.map.get(id)
  }

  list(): DefinedShenSha[] {
    return Array.from(this.map.values())
  }

  /** 按性质过滤：吉/凶/中性 */
  filterByNature(n: DefinedShenSha['nature']): DefinedShenSha[] {
    return this.list().filter(d => d.nature === n)
  }

  /** 按适用位置过滤 */
  filterByLocation(loc: DefinedShenSha['appliesTo'][number]): DefinedShenSha[] {
    return this.list().filter(d => d.appliesTo.includes(loc))
  }

  size(): number {
    return this.map.size
  }
}

/** 全局单例（会在 index.ts 把 20 个定义注册进去） */
export const globalShenShaRegistry = new ShenShaRegistry()
