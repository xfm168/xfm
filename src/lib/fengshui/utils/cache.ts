/**
 * 风水分析缓存工具 V3.0
 *
 * 避免重复请求，提升用户体验。
 * 使用 localStorage + sessionStorage 双级缓存。
 */

const CACHE_PREFIX = 'xfm_fs_'
const CACHE_TTL_MS = 1000 * 60 * 30 // 30分钟

interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
}

/**
 * 生成缓存键（基于输入参数）
 */
export function generateCacheKey(imageData: string, roomType: string): string {
  // 使用图片前2000字符 + 房间类型生成哈希
  const raw = imageData.substring(0, 2000) + '|' + roomType
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return CACHE_PREFIX + String(hash)
}

/**
 * 从缓存读取
 */
export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const entry: CacheEntry<T> = JSON.parse(raw)
    const now = Date.now()

    // 检查是否过期
    if (now - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

/**
 * 写入缓存
 */
export function setCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage 已满，清理旧缓存
    clearOldCache()
    try {
      localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), key }))
    } catch {
      // 仍然失败则放弃缓存
    }
  }
}

/**
 * 清理过期缓存
 */
export function clearExpiredCache(): void {
  const now = Date.now()
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const entry = JSON.parse(raw)
          if (now - entry.timestamp > CACHE_TTL_MS) {
            keysToRemove.push(key)
          }
        }
      } catch {
        keysToRemove.push(key)
      }
    }
  }

  keysToRemove.forEach(k => localStorage.removeItem(k))
}

/**
 * 清理所有风水缓存
 */
export function clearAllFengShuiCache(): void {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
}

/**
 * 清理旧缓存（当存储空间不足时）
 */
function clearOldCache(): void {
  const entries: { key: string; timestamp: number }[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          const entry = JSON.parse(raw)
          entries.push({ key, timestamp: entry.timestamp || 0 })
        }
      } catch {
        entries.push({ key, timestamp: 0 })
      }
    }
  }

  // 按时间排序，删除最旧的50%
  entries.sort((a, b) => a.timestamp - b.timestamp)
  const toRemove = entries.slice(0, Math.ceil(entries.length * 0.5))
  toRemove.forEach(e => localStorage.removeItem(e.key))
}
