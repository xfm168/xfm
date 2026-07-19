/**
 * statistics.ts — 玄风门 V4.2 数据统计模块
 *
 * 使用 localStorage 存储，key: xuanfengmen_bazi_stats
 * 统计维度：排盘次数、最近查看、常查生日、导出/分享/收藏次数
 */

// ============================================================
// 类型定义
// ============================================================

export interface BaziStatistics {
  totalCharts: number                                              // 总排盘次数
  recentViews: { date: string; count: number }[]                  // 最近7天查看
  frequentQueries: { birthDate: string; count: number }[]       // 最常查询
  exportCount: number                                              // 导出次数
  shareCount: number                                              // 分享次数
  favoriteCount: number                                          // 收藏数
}

interface RawStatsData {
  totalCharts: number
  views: { date: string; count: number }[]
  queries: { birthDate: string; count: number }[]
  exportCount: number
  shareCount: number
  favoriteCount: number
}

// ============================================================
// 常量
// ============================================================

const STORAGE_KEY = 'xuanfengmen_bazi_stats'

const MAX_RECENT_VIEWS = 7
const MAX_FREQUENT_QUERIES = 10

// ============================================================
// 存储操作
// ============================================================

function loadRaw(): RawStatsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        totalCharts: 0,
        views: [],
        queries: [],
        exportCount: 0,
        shareCount: 0,
        favoriteCount: 0,
      }
    }
    return JSON.parse(raw) as RawStatsData
  } catch {
    return {
      totalCharts: 0,
      views: [],
      queries: [],
      exportCount: 0,
      shareCount: 0,
      favoriteCount: 0,
    }
  }
}

function saveRaw(data: RawStatsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage 满或不可用，静默失败
  }
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 获取统计数据
 */
export function getStatistics(): BaziStatistics {
  const raw = loadRaw()

  // 过滤出最近7天的查看记录
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentViews = raw.views
    .filter(v => new Date(v.date) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // 按查询次数排序，取 top N
  const frequentQueries = [...raw.queries]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_FREQUENT_QUERIES)

  return {
    totalCharts: raw.totalCharts,
    recentViews,
    frequentQueries,
    exportCount: raw.exportCount,
    shareCount: raw.shareCount,
    favoriteCount: raw.favoriteCount,
  }
}

/**
 * 递增统计计数
 *
 * @param key 'export' | 'share' | 'favorite'
 */
export function incrementStat(key: 'export' | 'share' | 'favorite'): void {
  const raw = loadRaw()

  switch (key) {
    case 'export':
      raw.exportCount += 1
      break
    case 'share':
      raw.shareCount += 1
      break
    case 'favorite':
      raw.favoriteCount += 1
      break
  }

  saveRaw(raw)
}

/**
 * 记录一次查看
 *
 * @param birthDate 出生日期字符串，如 '1990-01-15'
 */
export function recordView(birthDate: string): void {
  const raw = loadRaw()

  // 递增总排盘次数
  raw.totalCharts += 1

  // 记录今日查看
  const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
  const todayView = raw.views.find(v => v.date === today)
  if (todayView) {
    todayView.count += 1
  } else {
    raw.views.push({ date: today, count: 1 })
  }
  // 只保留最近30天的原始数据（查询时再过滤7天）
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  raw.views = raw.views.filter(v => new Date(v.date) >= thirtyDaysAgo)

  // 记录常查生日
  const queryItem = raw.queries.find(q => q.birthDate === birthDate)
  if (queryItem) {
    queryItem.count += 1
  } else {
    raw.queries.push({ birthDate, count: 1 })
  }
  // 按 count 排序，只保留 top N
  raw.queries.sort((a, b) => b.count - a.count)
  if (raw.queries.length > MAX_FREQUENT_QUERIES) {
    raw.queries = raw.queries.slice(0, MAX_FREQUENT_QUERIES)
  }

  saveRaw(raw)
}
