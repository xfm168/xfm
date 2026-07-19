/**
 * 八字数据备份与恢复 V4.4
 *
 * 针对命盘数据（charts / favorites）提供：
 *  1. exportBaziData       —— 导出为 JSON 字符串（含数据头）
 *  2. importBaziData       —— 从 JSON 字符串导入（带校验与合并）
 *  3. autoBackup           —— 自动备份到 localStorage（带时间戳，最多保留 N 份）
 *  4. restoreFromBackup    —— 从指定备份恢复
 *  5. listBackups          —— 列出所有备份
 *
 * 与 useBazi hook 的存储键保持一致，向下兼容：
 *  - 'xuanfengmen_bazi_charts'
 *  - 'xuanfengmen_bazi_favorites'
 */

import { baziLogger } from './logger'

/* ------------------------------------------------------------------ *
 * 存储键（与 useBazi 保持一致）
 * ------------------------------------------------------------------ */

const STORAGE_KEYS = {
  charts: 'xuanfengmen_bazi_charts',
  favorites: 'xuanfengmen_bazi_favorites',
} as const

const BACKUP_PREFIX = 'xuanfengmen:bazi:backup:'
const BACKUP_INDEX_KEY = 'xuanfengmen:bazi:backup:index'
/** 最多保留备份数 */
const MAX_BACKUPS = 10

/* ------------------------------------------------------------------ *
 * 数据格式
 * ------------------------------------------------------------------ */

export interface BaziBackupData {
  /** 数据格式版本，便于将来升级迁移 */
  version: string
  /** 导出时间（ISO） */
  exportedAt: string
  /** 应用版本 */
  appVersion: string
  charts: unknown[]
  favorites: number[]
}

const BACKUP_FORMAT_VERSION = '1.0.0'

/* ------------------------------------------------------------------ *
 * localStorage 安全访问
 * ------------------------------------------------------------------ */

function safeGet(key: string): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeRemove(key: string): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ *
 * 导出 / 导入
 * ------------------------------------------------------------------ */

/**
 * 导出八字数据为 JSON 字符串
 * 包含命盘列表与收藏列表，附带版本与时间戳。
 *
 * @example
 * const json = exportBaziData()
 * downloadFile('xuanfengmen-backup.json', json)
 */
export function exportBaziData(): string {
  const chartsRaw = safeGet(STORAGE_KEYS.charts)
  const favoritesRaw = safeGet(STORAGE_KEYS.favorites)

  let charts: unknown[] = []
  let favorites: number[] = []

  try {
    charts = chartsRaw ? JSON.parse(chartsRaw) : []
  } catch {
    charts = []
  }
  try {
    favorites = favoritesRaw ? JSON.parse(favoritesRaw) : []
  } catch {
    favorites = []
  }

  const data: BaziBackupData = {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: getAppVersion(),
    charts,
    favorites,
  }

  baziLogger.info('导出八字数据', { charts: charts.length, favorites: favorites.length })
  return JSON.stringify(data, null, 2)
}

/**
 * 从 JSON 字符串导入八字数据
 *
 * @param json 导出的 JSON 字符串
 * @param mode 导入模式：'merge'（合并，默认）| 'replace'（覆盖）
 * @returns 是否导入成功
 */
export function importBaziData(json: string, mode: 'merge' | 'replace' = 'merge'): boolean {
  try {
    const data = JSON.parse(json) as BaziBackupData
    if (!data || !Array.isArray(data.charts)) {
      baziLogger.warn('导入数据格式无效')
      return false
    }

    const incomingCharts = data.charts as Array<{ createdAt?: number }>
    const incomingFavorites = Array.isArray(data.favorites) ? data.favorites : []

    if (mode === 'replace') {
      safeSet(STORAGE_KEYS.charts, JSON.stringify(incomingCharts))
      safeSet(STORAGE_KEYS.favorites, JSON.stringify(incomingFavorites))
    } else {
      // 合并：以 createdAt 去重
      const existingRaw = safeGet(STORAGE_KEYS.charts)
      const existing: Array<{ createdAt?: number }> = existingRaw ? JSON.parse(existingRaw) : []
      const merged = [...incomingCharts]
      for (const c of existing) {
        if (c && c.createdAt !== undefined && !merged.some(m => m?.createdAt === c.createdAt)) {
          merged.push(c)
        }
      }
      // 保留原上限 20
      const sliced = merged.slice(0, 20)
      safeSet(STORAGE_KEYS.charts, JSON.stringify(sliced))

      // 收藏合并去重
      const existingFavRaw = safeGet(STORAGE_KEYS.favorites)
      const existingFav: number[] = existingFavRaw ? JSON.parse(existingFavRaw) : []
      const mergedFav = Array.from(new Set([...existingFav, ...incomingFavorites]))
      safeSet(STORAGE_KEYS.favorites, JSON.stringify(mergedFav))
    }

    baziLogger.info('导入八字数据成功', {
      mode,
      charts: (data.charts as any[]).length,
      favorites: incomingFavorites.length,
    })
    return true
  } catch (err) {
    baziLogger.error('导入八字数据失败', { error: String(err) })
    return false
  }
}

/* ------------------------------------------------------------------ *
 * 自动备份
 * ------------------------------------------------------------------ */

export interface BackupRecord {
  /** 备份时间戳（ms） */
  timestamp: number
  /** ISO 时间字符串 */
  date: string
  /** 命盘数量 */
  chartsCount: number
  /** 数据大小（字节，近似） */
  size: number
}

/**
 * 自动备份到 localStorage
 *
 * 以时间戳命名，最多保留 MAX_BACKUPS 份，超出时删除最旧。
 * 建议在命盘保存、页面隐藏时调用。
 *
 * @example
 * document.addEventListener('visibilitychange', () => {
 *   if (document.visibilityState === 'hidden') autoBackup()
 * })
 */
export function autoBackup(): BackupRecord | null {
  const json = exportBaziData()
  const timestamp = Date.now()
  const date = new Date(timestamp).toISOString()

  const key = `${BACKUP_PREFIX}${timestamp}`
  const ok = safeSet(key, json)
  if (!ok) {
    baziLogger.warn('自动备份写入失败，可能 localStorage 已满')
    return null
  }

  const record: BackupRecord = {
    timestamp,
    date,
    chartsCount: countCharts(json),
    size: json.length,
  }

  // 更新备份索引并裁剪
  updateBackupIndex(record)

  baziLogger.info('自动备份完成', record)
  return record
}

/**
 * 列出所有备份记录
 */
export function listBackups(): BackupRecord[] {
  const raw = safeGet(BACKUP_INDEX_KEY)
  if (!raw) return []
  try {
    const list = JSON.parse(raw) as BackupRecord[]
    return list.sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

/**
 * 从指定备份恢复
 *
 * @param date 备份的时间戳（number）或 ISO 字符串
 * @returns 是否恢复成功
 */
export function restoreFromBackup(date: string | number): boolean {
  const timestamp = typeof date === 'number' ? date : Date.parse(date)
  if (Number.isNaN(timestamp)) {
    baziLogger.warn('备份恢复失败：时间戳无效', { date })
    return false
  }

  const key = `${BACKUP_PREFIX}${timestamp}`
  const json = safeGet(key)
  if (!json) {
    baziLogger.warn('备份恢复失败：备份不存在', { date })
    return false
  }

  // 恢复前先做一次当前状态备份（安全网）
  autoBackup()

  const ok = importBaziData(json, 'replace')
  if (ok) {
    baziLogger.info('备份恢复成功', { date })
  }
  return ok
}

/**
 * 删除指定备份
 */
export function deleteBackup(timestamp: number): void {
  safeRemove(`${BACKUP_PREFIX}${timestamp}`)
  const list = listBackups().filter(r => r.timestamp !== timestamp)
  safeSet(BACKUP_INDEX_KEY, JSON.stringify(list))
}

/**
 * 清空所有备份
 */
export function clearAllBackups(): void {
  for (const r of listBackups()) {
    safeRemove(`${BACKUP_PREFIX}${r.timestamp}`)
  }
  safeRemove(BACKUP_INDEX_KEY)
}

/* ------------------------------------------------------------------ *
 * 内部工具
 * ------------------------------------------------------------------ */

function updateBackupIndex(record: BackupRecord): void {
  const list = listBackups()
  list.push(record)
  list.sort((a, b) => b.timestamp - a.timestamp)

  // 裁剪超出部分（删除文件 + 索引条目）
  if (list.length > MAX_BACKUPS) {
    const removed = list.splice(MAX_BACKUPS)
    for (const r of removed) {
      safeRemove(`${BACKUP_PREFIX}${r.timestamp}`)
    }
  }

  safeSet(BACKUP_INDEX_KEY, JSON.stringify(list))
}

function countCharts(json: string): number {
  try {
    const data = JSON.parse(json) as BaziBackupData
    return Array.isArray(data.charts) ? data.charts.length : 0
  } catch {
    return 0
  }
}

function getAppVersion(): string {
  // 读取 package.json version（构建时注入或运行时读取）
  try {
    if (typeof import.meta !== 'undefined') {
      const pkg = (import.meta as any)?.env?.VITE_APP_VERSION
      if (pkg) return String(pkg)
    }
  } catch {
    /* ignore */
  }
  return '4.4.0'
}

/* ------------------------------------------------------------------ *
 * 便捷下载（浏览器环境）
 * ------------------------------------------------------------------ */

/**
 * 触发浏览器下载备份文件
 *
 * @example
 * downloadBackup('xuanfengmen-2024-01-15.json')
 */
export function downloadBackup(filename?: string): void {
  if (typeof document === 'undefined') return
  const json = exportBaziData()
  const name = filename || `xuanfengmen-bazi-${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
  baziLogger.info('备份文件已下载', { name })
}
