/**
 * H2: 持久化缓存
 *
 * 浏览器环境：优先 IndexedDB，降级 LocalStorage。
 * Node.js 环境：降级 Memory（测试用）。
 *
 * 所有操作异步（IndexedDB 是异步的，LocalStorage 同步但包装为 Promise 保持接口一致）。
 */

import { CacheMetrics } from './CacheMetrics'

export interface PersistentCacheConfig {
  /** 数据库名 */
  dbName: string
  /** store 名称 */
  storeName: string
  /** 默认 TTL（毫秒） */
  defaultTTL: number
  /** 最大条目数 */
  maxEntries: number
}

interface PersistentEntry {
  value: unknown
  createdAt: number
  expiresAt: number
}

type Backend = 'indexeddb' | 'localstorage' | 'memory-fallback'

declare const localStorage: Storage | undefined
declare const indexedDB: IDBFactory | undefined

function detectBackend(): Backend {
  if (typeof window !== 'undefined') {
    if (typeof (window as any).indexedDB !== 'undefined') return 'indexeddb'
    if (typeof (window as any).localStorage !== 'undefined') return 'localstorage'
  }
  return 'memory-fallback'
}

export class PersistentCache {
  private config: PersistentCacheConfig
  private metrics: CacheMetrics
  private backend: Backend
  private memoryFallback: Map<string, PersistentEntry> = new Map()
  private _clearCount = 0

  constructor(config: PersistentCacheConfig, metrics: CacheMetrics) {
    this.config = config
    this.metrics = metrics
    this.backend = detectBackend()
  }

  private makeStorageKey(key: string): string {
    return `xfm:cache:${this.config.dbName}:${key}`
  }

  async get(key: string): Promise<unknown | undefined> {
    const start = performance.now()

    if (this.backend === 'memory-fallback') {
      const entry = this.memoryFallback.get(key)
      if (!entry) {
        this.metrics.recordMiss('localstorage', performance.now() - start)
        return undefined
      }
      if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
        this.memoryFallback.delete(key)
        this.metrics.recordExpiration('localstorage')
        this.metrics.recordMiss('localstorage', performance.now() - start)
        return undefined
      }
      this.metrics.recordHit('localstorage', performance.now() - start)
      return entry.value
    }

    if (this.backend === 'localstorage') {
      return this.readLocalStorage(key, start)
    }

    return this.readIndexedDB(key, start)
  }

  private async readLocalStorage(key: string, start: number): Promise<unknown | undefined> {
    try {
      const raw = localStorage!.getItem(this.makeStorageKey(key))
      if (!raw) {
        this.metrics.recordMiss('localstorage', performance.now() - start)
        return undefined
      }
      const entry: PersistentEntry = JSON.parse(raw)
      if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
        localStorage!.removeItem(this.makeStorageKey(key))
        this.metrics.recordExpiration('localstorage')
        this.metrics.recordMiss('localstorage', performance.now() - start)
        return undefined
      }
      this.metrics.recordHit('localstorage', performance.now() - start)
      return entry.value
    } catch {
      this.metrics.recordMiss('localstorage', performance.now() - start)
      return undefined
    }
  }

  private readIndexedDB(key: string, start: number): Promise<unknown | undefined> {
    return new Promise((resolve) => {
      try {
        const req = indexedDB!.open(this.config.dbName)
        req.onerror = () => {
          this.metrics.recordMiss('indexeddb', performance.now() - start)
          resolve(undefined)
        }
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(this.config.storeName)) {
            db.createObjectStore(this.config.storeName)
          }
        }
        req.onsuccess = () => {
          const db = req.result
          try {
            const tx = db.transaction(this.config.storeName, 'readonly')
            const store = tx.objectStore(this.config.storeName)
            const getReq = store.get(key)
            getReq.onerror = () => {
              this.metrics.recordMiss('indexeddb', performance.now() - start)
              resolve(undefined)
            }
            getReq.onsuccess = () => {
              const entry: PersistentEntry | undefined = getReq.result
              if (!entry) {
                this.metrics.recordMiss('indexeddb', performance.now() - start)
                resolve(undefined)
                return
              }
              if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
                const delTx = db.transaction(this.config.storeName, 'readwrite')
                delTx.objectStore(this.config.storeName).delete(key)
                this.metrics.recordExpiration('indexeddb')
                this.metrics.recordMiss('indexeddb', performance.now() - start)
                resolve(undefined)
                return
              }
              this.metrics.recordHit('indexeddb', performance.now() - start)
              resolve(entry.value)
            }
          } catch {
            this.metrics.recordMiss('indexeddb', performance.now() - start)
            resolve(undefined)
          }
        }
      } catch {
        this.metrics.recordMiss('indexeddb', performance.now() - start)
        resolve(undefined)
      }
    })
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const start = performance.now()
    const effectiveTTL = ttl ?? this.config.defaultTTL
    const entry: PersistentEntry = {
      value,
      createdAt: Date.now(),
      expiresAt: effectiveTTL > 0 ? Date.now() + effectiveTTL : 0,
    }

    if (this.backend === 'memory-fallback') {
      this.memoryFallback.set(key, entry)
      this.metrics.recordWrite('localstorage', performance.now() - start)
      return
    }

    if (this.backend === 'localstorage') {
      this.writeLocalStorage(key, entry, start)
      return
    }

    return this.writeIndexedDB(key, entry, start)
  }

  private writeLocalStorage(key: string, entry: PersistentEntry, start: number): void {
    try {
      localStorage!.setItem(this.makeStorageKey(key), JSON.stringify(entry))
    } catch {
      this.metrics.recordEviction('localstorage')
    }
    this.metrics.recordWrite('localstorage', performance.now() - start)
  }

  private writeIndexedDB(key: string, entry: PersistentEntry, start: number): Promise<void> {
    return new Promise((resolve) => {
      try {
        const req = indexedDB!.open(this.config.dbName)
        req.onerror = () => {
          this.metrics.recordWrite('indexeddb', performance.now() - start)
          resolve()
        }
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(this.config.storeName)) {
            db.createObjectStore(this.config.storeName)
          }
        }
        req.onsuccess = () => {
          const db = req.result
          try {
            const tx = db.transaction(this.config.storeName, 'readwrite')
            const store = tx.objectStore(this.config.storeName)
            store.put(entry, key)
            tx.oncomplete = () => {
              this.metrics.recordWrite('indexeddb', performance.now() - start)
              resolve()
            }
            tx.onerror = () => {
              this.metrics.recordWrite('indexeddb', performance.now() - start)
              resolve()
            }
          } catch {
            this.metrics.recordWrite('indexeddb', performance.now() - start)
            resolve()
          }
        }
      } catch {
        this.metrics.recordWrite('indexeddb', performance.now() - start)
        resolve()
      }
    })
  }

  async delete(key: string): Promise<boolean> {
    if (this.backend === 'memory-fallback') {
      return this.memoryFallback.delete(key)
    }
    if (this.backend === 'localstorage') {
      const sk = this.makeStorageKey(key)
      const existed = localStorage!.getItem(sk) !== null
      localStorage!.removeItem(sk)
      return existed
    }
    return this.removeFromIndexedDB(key)
  }

  private removeFromIndexedDB(key: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const req = indexedDB!.open(this.config.dbName)
        req.onerror = () => resolve(false)
        req.onsuccess = () => {
          try {
            const db = req.result
            const tx = db.transaction(this.config.storeName, 'readwrite')
            const store = tx.objectStore(this.config.storeName)
            const delReq = store.delete(key)
            delReq.onsuccess = () => resolve(true)
            delReq.onerror = () => resolve(false)
          } catch { resolve(false) }
        }
      } catch { resolve(false) }
    })
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key)
    return val !== undefined
  }

  async clear(): Promise<void> {
    this._clearCount++
    const tier = this.backend === 'memory-fallback' ? 'localstorage' : this.backend
    this.metrics.recordClear(tier)

    if (this.backend === 'memory-fallback') {
      this.memoryFallback.clear()
      return
    }
    if (this.backend === 'localstorage') {
      const prefix = this.makeStorageKey('')
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage!.length; i++) {
        const k = localStorage!.key(i)
        if (k && k.startsWith(prefix)) keysToRemove.push(k)
      }
      keysToRemove.forEach(k => localStorage!.removeItem(k))
      return
    }
    return this.clearIndexedDB()
  }

  private clearIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      try {
        const req = indexedDB!.open(this.config.dbName)
        req.onerror = () => resolve()
        req.onsuccess = () => {
          try {
            const db = req.result
            const tx = db.transaction(this.config.storeName, 'readwrite')
            tx.objectStore(this.config.storeName).clear()
            tx.oncomplete = () => resolve()
            tx.onerror = () => resolve()
          } catch { resolve() }
        }
      } catch { resolve() }
    })
  }

  get clearCount(): number {
    return this._clearCount
  }

  get tierName(): string {
    return this.backend === 'memory-fallback' ? 'localstorage' : this.backend
  }
}
