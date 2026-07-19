/**
 * 玄风门 V3.1 风水勘测历史记录管理模块
 *
 * 基于 V3.0 history.ts 全面升级：
 * - 支持搜索、分类筛选、收藏、状态管理
 * - 支持用户备注、标签、PDF 导出
 * - 最多 100 条记录
 */

import type {
  FengShuiHistoryRecordV31,
  FengShuiHistoryRecordV32,
  ScoreDimensionEntry,
  Score12DResult,
  RuleCategory,
  ImageAnnotation,
  CredibilityResultV31,
  PDFReportConfig,
  ProfessionalReportV31,
} from '../types'
import type { RuleMatchResult } from '../rules/registry'

// ═══════════════════════════════════════════════
// 常量定义
// ═══════════════════════════════════════════════

const STORAGE_KEY = 'xuanfeng_fengshui_history_v31'
const MAX_RECORDS = 100
const MAX_IMAGE_SIZE = 300 * 1024 // 300KB 缩略图限制

// ═══════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════

function generateId(): string {
  return 'fsv31_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8)
}

function truncateImage(base64: string): string {
  if (base64.length <= MAX_IMAGE_SIZE * 1.4) return base64
  // 简单截断提示：实际生产应使用 canvas 压缩
  return base64.slice(0, Math.floor(MAX_IMAGE_SIZE * 1.4))
}

function generateThumbnail(base64: string): string {
  // 生成更小的缩略图（占位实现）
  if (base64.length <= 50 * 1024 * 1.4) return base64
  return base64.slice(0, Math.floor(50 * 1024 * 1.4))
}

// ═══════════════════════════════════════════════
// 核心 CRUD
// ═══════════════════════════════════════════════

/**
 * 保存 V3.1 风水勘测记录
 * @param record 待保存的记录（不含 id 与 createdAt 的可选填充）
 * @returns 完整记录对象
 */
export function saveHistoryV31(
  record: Omit<FengShuiHistoryRecordV31, 'id' | 'createdAt'>
): FengShuiHistoryRecordV31 {
  const fullRecord: FengShuiHistoryRecordV31 = {
    ...record,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }

  const existing = getHistoryV31()
  const updated = [fullRecord, ...existing].slice(0, MAX_RECORDS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return fullRecord
}

/**
 * 从 V3.1 专业报告快速创建并保存历史记录
 */
export function saveHistoryFromReportV31(options: {
  roomType: string
  roomName: string
  imageData: string
  overallScore: number
  score12D?: Record<string, number>
  credibility: CredibilityResultV31
  mainIssues: string[]
  remediationPlans: string[]
  annotations: ImageAnnotation[]
  analysisDurationMs: number
  tags?: string[]
}): FengShuiHistoryRecordV31 {
  const record: FengShuiHistoryRecordV31 = {
    id: generateId(),
    roomType: options.roomType,
    roomName: options.roomName,
    imageData: truncateImage(options.imageData),
    thumbnail: generateThumbnail(options.imageData),
    overallScore: options.overallScore,
    score12D: options.score12D,
    credibility: options.credibility,
    mainIssues: options.mainIssues.slice(0, 5),
    remediationPlans: options.remediationPlans.slice(0, 5),
    annotations: options.annotations,
    createdAt: new Date().toISOString(),
    analysisDurationMs: options.analysisDurationMs,
    status: 'active',
    favorite: false,
    tags: options.tags ?? [],
    notes: '',
  }

  const existing = getHistoryV31()
  const updated = [record, ...existing].slice(0, MAX_RECORDS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

  return record
}

/**
 * 获取全部 V3.1 历史记录
 */
export function getHistoryV31(): FengShuiHistoryRecordV31[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FengShuiHistoryRecordV31[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 根据 ID 获取单条记录
 */
export function getHistoryByIdV31(id: string): FengShuiHistoryRecordV31 | undefined {
  return getHistoryV31().find(r => r.id === id)
}

/**
 * 删除单条记录
 */
export function deleteHistoryV31(id: string): boolean {
  const existing = getHistoryV31()
  const filtered = existing.filter(r => r.id !== id)
  if (filtered.length === existing.length) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

/**
 * 清空全部 V3.1 历史记录
 */
export function clearHistoryV31(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// ═══════════════════════════════════════════════
// 搜索与筛选
// ═══════════════════════════════════════════════

/**
 * 按关键词搜索历史记录
 * 搜索范围：roomName / mainIssues / remediationPlans / tags / notes
 */
export function searchHistoryV31(query: string): FengShuiHistoryRecordV31[] {
  const q = query.trim().toLowerCase()
  if (!q) return getHistoryV31()

  return getHistoryV31().filter(record => {
    const fields = [
      record.roomName,
      ...record.mainIssues,
      ...record.remediationPlans,
      ...record.tags,
      record.notes,
    ]
    return fields.some(f => f?.toLowerCase().includes(q))
  })
}

/**
 * 按分类筛选历史记录
 * 基于 roomType 进行模糊匹配
 */
export function filterHistoryByCategory(
  category: RuleCategory | string
): FengShuiHistoryRecordV31[] {
  const c = category.toLowerCase()
  return getHistoryV31().filter(record => record.roomType.toLowerCase().includes(c))
}

/**
 * 按状态筛选
 */
export function filterHistoryByStatus(
  status: FengShuiHistoryRecordV31['status']
): FengShuiHistoryRecordV31[] {
  return getHistoryV31().filter(record => record.status === status)
}

/**
 * 获取收藏记录
 */
export function getFavoriteHistoryV31(): FengShuiHistoryRecordV31[] {
  return getHistoryV31().filter(record => record.favorite)
}

// ═══════════════════════════════════════════════
// 单条记录操作
// ═══════════════════════════════════════════════

function updateRecord(id: string, updater: (r: FengShuiHistoryRecordV31) => FengShuiHistoryRecordV31): boolean {
  const existing = getHistoryV31()
  let found = false
  const updated = existing.map(r => {
    if (r.id === id) {
      found = true
      return updater(r)
    }
    return r
  })
  if (!found) return false
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return true
}

/**
 * 切换收藏状态
 */
export function toggleFavorite(id: string): boolean {
  return updateRecord(id, r => ({ ...r, favorite: !r.favorite }))
}

/**
 * 更新整改状态
 */
export function updateStatus(
  id: string,
  status: FengShuiHistoryRecordV31['status']
): boolean {
  return updateRecord(id, r => ({ ...r, status }))
}

/**
 * 添加用户备注
 */
export function addNote(id: string, note: string): boolean {
  return updateRecord(id, r => ({
    ...r,
    notes: r.notes ? r.notes + '\n---\n' + note : note,
  }))
}

/**
 * 覆盖用户备注
 */
export function setNotes(id: string, notes: string): boolean {
  return updateRecord(id, r => ({ ...r, notes }))
}

/**
 * 添加标签
 */
export function addTag(id: string, tag: string): boolean {
  const t = tag.trim()
  if (!t) return false
  return updateRecord(id, r => {
    if (r.tags.includes(t)) return r
    return { ...r, tags: [...r.tags, t] }
  })
}

/**
 * 移除标签
 */
export function removeTag(id: string, tag: string): boolean {
  return updateRecord(id, r => ({
    ...r,
    tags: r.tags.filter(t => t !== tag),
  }))
}

/**
 * 设置 PDF 报告地址
 */
export function setPdfUrl(id: string, pdfUrl: string): boolean {
  return updateRecord(id, r => ({ ...r, pdfUrl }))
}

// ═══════════════════════════════════════════════
// 导出功能
// ═══════════════════════════════════════════════

/**
 * 导出全部历史记录为 JSON 字符串
 */
export function exportHistoryToJSON(): string {
  const records = getHistoryV31()
  const exportData = {
    version: '3.1',
    exportTime: new Date().toISOString(),
    count: records.length,
    records,
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * 下载 JSON 导出文件
 */
export function downloadHistoryJSON(filename?: string): void {
  const json = exportHistoryToJSON()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `xuanfeng_fengshui_history_v31_${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 导入历史记录（合并模式）
 * @param jsonString JSON 字符串
 * @param replace 是否替换现有记录，false 则合并
 */
export function importHistoryFromJSON(
  jsonString: string,
  replace = false
): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString)
    if (!data.records || !Array.isArray(data.records)) {
      return { success: false, count: 0, error: '无效的导出文件格式' }
    }

    const imported = data.records as FengShuiHistoryRecordV31[]
    if (replace) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported.slice(0, MAX_RECORDS)))
      return { success: true, count: imported.length }
    }

    const existing = getHistoryV31()
    const merged = [...imported, ...existing]
      // 去重（基于 id）
      .filter((r, idx, arr) => arr.findIndex(x => x.id === r.id) === idx)
      .slice(0, MAX_RECORDS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    return { success: true, count: imported.length }
  } catch (e) {
    return { success: false, count: 0, error: String(e) }
  }
}

// ═══════════════════════════════════════════════
// PDF 报告占位接口
// ═══════════════════════════════════════════════

/**
 * 生成 PDF 报告（占位实现）
 * 实际调用由 ../pdf/index.ts 提供
 */
export async function generatePDFReport(
  record: FengShuiHistoryRecordV31,
  config?: PDFReportConfig
): Promise<string | null> {
  // 动态导入避免循环依赖
  try {
    const { generatePDFReport: generatePDF } = await import('../pdf')
    const report = buildPlaceholderReport(record)
    const pdfDataUrl = await generatePDF(
      config ?? buildDefaultConfig(record),
      report,
      record.annotations
    )
    return pdfDataUrl
  } catch (e) {
    console.error('PDF 生成失败：', e)
    return null
  }
}

function buildDefaultConfig(record: FengShuiHistoryRecordV31): PDFReportConfig {
  return {
    title: '玄风门 · 风水勘测专业报告',
    subtitle: record.roomName,
    includeAnnotations: true,
    includeClassical: true,
    includeRadarChart: true,
    pageSize: 'A4',
  }
}

function buildPlaceholderReport(record: FengShuiHistoryRecordV31): ProfessionalReportV31 {
  // 基于历史记录重建最小化的专业报告结构（用于 PDF 生成）
  return {
    score12D: {
      dimensions: {} as any,
      overall: record.overallScore,
      level: record.overallScore >= 80 ? '优' : record.overallScore >= 60 ? '良' : '平',
      summary: `${record.roomName} 综合评分 ${record.overallScore} 分`,
    },
    patternAnalysis: {
      description: '基于历史记录重建的格局分析',
      principle: '格局为风水之本',
      explanation: '此报告由历史记录重建，详细分析请参阅原始报告。',
      strength: [],
      weakness: record.mainIssues,
    },
    windQiAnalysis: {
      description: '气流与聚气分析',
      qiFlow: '信息需重新分析',
      windGathering: '信息需重新分析',
      suggestions: [],
    },
    wealthAnalysis: {
      description: '财位分析',
      wealthPositions: [],
      suggestions: [],
    },
    healthAnalysis: {
      description: '健康影响分析',
      healthFactors: [],
      riskAreas: [],
      suggestions: [],
    },
    careerAnalysis: {
      description: '事业影响分析',
      careerFactors: [],
      opportunities: [],
      obstacles: [],
      suggestions: [],
    },
    familyAnalysis: {
      description: '家庭关系分析',
      harmonyFactors: [],
      tensionAreas: [],
      suggestions: [],
    },
    issues: record.mainIssues.map((title, i) => ({
      id: `hist_issue_${i}`,
      title,
      severity: 'moderate' as const,
      category: 'living' as const,
      description: title,
      principle: '',
      ruleId: '',
    })),
    remediationPlans: [],
    classicalInterpretation: {
      theories: [],
      summary: '',
    },
    summary: record.roomName + ' 的风水勘测历史记录',
    credibility: record.credibility,
    annotations: record.annotations,
    schools: [],
    // V3.2 新增十大板块（历史记录重建占位值）
    overallEvaluation: {
      opening: '此报告由历史记录重建，详细总体评价请参阅原始分析。',
      houseCharacter: `历史综合评分 ${record.overallScore} 分`,
      inhabitantFit: '建议重新进行完整分析以获得准确的居住契合度评估。',
      closing: '以上为历史记录概要，如需详细咨询建议重新勘测。',
    },
    coreIssues: record.mainIssues.slice(0, 5).map((title, i) => ({
      rank: i + 1,
      title,
      location: '待确认',
      impact: title,
      severity: 'moderate' as const,
      rootCause: '历史记录重建，详细原因请重新分析',
    })),
    strengthPatterns: [
      {
        title: '历史分析记录',
        description: '此报告由历史记录重建，优势格局信息请参阅原始分析报告。',
        location: '全屋',
        benefit: '保留历史数据以便对比参考',
      },
    ],
    riskAnalysis: {
      health: { level: 'moderate' as const, score: 60, description: '历史记录重建，风险评估请以最新分析为准', keyFactors: ['数据不完整'] },
      wealth: { level: 'moderate' as const, score: 60, description: '历史记录重建，风险评估请以最新分析为准', keyFactors: ['数据不完整'] },
      career: { level: 'moderate' as const, score: 60, description: '历史记录重建，风险评估请以最新分析为准', keyFactors: ['数据不完整'] },
      family: { level: 'moderate' as const, score: 60, description: '历史记录重建，风险评估请以最新分析为准', keyFactors: ['数据不完整'] },
      overallAssessment: '此为历史记录重建报告，详细风险评估建议重新进行完整勘测。',
    },
    priorityRanking: {
      immediate: [],
      oneWeek: [],
      oneMonth: record.mainIssues.slice(0, 3).map(title => ({
        title,
        reason: '历史记录中的主要问题',
        category: 'living' as const,
        estimatedTime: '待评估',
      })),
      longTerm: [],
    },
    sevenDayAdvice: [
      {
        id: '7D-HIST',
        title: '保持空间整洁',
        action: '定期清理家中杂物，保持通风采光良好。',
        reason: '整洁的环境是好风水的基础。',
        expectedEffect: '提升居住舒适度',
        difficulty: '极易',
      },
    ],
    oneMonthAdvice: [
      {
        id: '1M-HIST',
        title: '建议重新勘测',
        action: '如需详细的一个月改善方案，建议重新进行完整的风水勘测。',
        reason: '历史记录数据有限，无法提供精准的改善建议。',
        expectedEffect: '获得个性化的改善方案',
        cost: '视具体情况而定',
        difficulty: '中等',
      },
    ],
    longTermLayout: [
      {
        title: '长期维护建议',
        description: '风水贵在日常维护，建议定期检查家中格局，保持整洁通风。如有重大调整请咨询专业人士。',
        direction: '全屋',
        expectedEffect: '维持良好宅气',
        scope: '日常居家维护',
      },
    ],
    cautions: [
      {
        title: '历史报告仅供参考',
        content: '此报告由历史记录重建，部分数据可能不完整，具体建议以最新勘测为准。',
        level: 'medium' as const,
        scenario: '查看历史报告时',
      },
    ],
    masterSummary: {
      paragraph1: '以上为历史记录重建的报告概要。由于数据有限，本报告仅作参考之用，不能替代完整的风水勘测。',
      paragraph2: '如需获得详细的个性化分析和建议，建议重新进行完整的现场勘测。记住，人心向善，居所自安。',
      signature: '——玄风门 · 历史档案',
    },
  }
}

// ═══════════════════════════════════════════════
// 统计与辅助
// ═══════════════════════════════════════════════

/**
 * 获取历史记录统计信息
 */
export function getHistoryStatsV31() {
  const records = getHistoryV31()
  return {
    total: records.length,
    active: records.filter(r => r.status === 'active').length,
    remediated: records.filter(r => r.status === 'remediated').length,
    archived: records.filter(r => r.status === 'archived').length,
    favorites: records.filter(r => r.favorite).length,
    averageScore: records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.overallScore, 0) / records.length)
      : 0,
    roomTypeDistribution: records.reduce((map, r) => {
      map[r.roomType] = (map[r.roomType] ?? 0) + 1
      return map
    }, {} as Record<string, number>),
  }
}

/**
 * 分享文本生成
 */
export function generateShareTextV31(record: FengShuiHistoryRecordV31): string {
  const lines = [
    '【玄风门 · V3.1 风水勘测报告】',
    '',
    `空间类型：${record.roomName}`,
    `综合评分：${record.overallScore} 分`,
    `分析可信度：${record.credibility.score} 分`,
    `整改状态：${record.status === 'active' ? '待整改' : record.status === 'remediated' ? '已整改' : '已归档'}`,
    '',
    '主要问题：',
    ...record.mainIssues.map((issue, i) => `${i + 1}. ${issue}`),
    '',
    '整改方案：',
    ...record.remediationPlans.map((plan, i) => `${i + 1}. ${plan}`),
    '',
    record.notes ? `备注：${record.notes}` : '',
    '',
    `生成时间：${new Date(record.createdAt).toLocaleString('zh-CN')}`,
    '',
    '—— 来自玄风门 xuanfengmen.com',
  ]
  return lines.filter(Boolean).join('\n')
}

// ═══════════════════════════════════════════════
// V3.2 历史记录增强功能
// ═══════════════════════════════════════════════

const STORAGE_KEY_V32 = 'xuanfeng_fengshui_history_v32'

/**
 * 将 Score12DResult 转换为维度数组（用于存储与展示）
 */
export function score12DToEntries(score12D: Score12DResult): ScoreDimensionEntry[] {
  return Object.entries(score12D.dimensions).map(([key, dim]) => ({
    dimension: key,
    name: dim.name,
    score: dim.score,
    level: dim.level,
  }))
}

/**
 * 从 ruleMatches 统计匹配到的问题数量
 */
export function countMatchedIssues(ruleMatches: RuleMatchResult[]): number {
  return ruleMatches.filter(r => r.matched).length
}

/**
 * 提取前 N 个问题标签
 */
export function extractTopIssueTags(
  ruleMatches: RuleMatchResult[],
  topN = 3
): string[] {
  return ruleMatches
    .filter(r => r.matched)
    .sort((a, b) => b.rule.priority - a.rule.priority)
    .slice(0, topN)
    .map(r => r.rule.name)
}

/**
 * V3.2 保存增强版历史记录
 * 包含完整的 12 维评分、问题数量、问题标签等增强数据
 */
export function saveAnalysisRecordV32(options: {
  roomType: string
  roomName: string
  imageData: string
  overallScore: number
  score12D: Score12DResult
  credibility: CredibilityResultV31
  mainIssues: string[]
  remediationPlans: string[]
  annotations: ImageAnnotation[]
  analysisDurationMs: number
  ruleMatches: RuleMatchResult[]
  tags?: string[]
}): FengShuiHistoryRecordV32 {
  const record: FengShuiHistoryRecordV32 = {
    id: generateId(),
    roomType: options.roomType,
    roomName: options.roomName,
    imageData: truncateImage(options.imageData),
    thumbnail: generateThumbnail(options.imageData),
    overallScore: options.overallScore,
    score12D: Object.fromEntries(
      Object.entries(options.score12D.dimensions).map(([k, v]) => [k, v.score])
    ),
    credibility: options.credibility,
    mainIssues: options.mainIssues.slice(0, 5),
    remediationPlans: options.remediationPlans.slice(0, 5),
    annotations: options.annotations,
    createdAt: new Date().toISOString(),
    analysisDurationMs: options.analysisDurationMs,
    status: 'active',
    favorite: false,
    tags: options.tags ?? [],
    notes: '',
    // V3.2 新增字段
    issueCount: countMatchedIssues(options.ruleMatches),
    score12DDetails: score12DToEntries(options.score12D),
    topIssueTags: extractTopIssueTags(options.ruleMatches, 3),
    version: '3.2',
  }

  const existing = getHistoryV32()
  const updated = [record, ...existing].slice(0, MAX_RECORDS)
  localStorage.setItem(STORAGE_KEY_V32, JSON.stringify(updated))

  return record
}

/**
 * 获取全部 V3.2 历史记录
 */
export function getHistoryV32(): FengShuiHistoryRecordV32[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V32)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FengShuiHistoryRecordV32[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * 获取合并后的历史记录（V3.2 + V3.1，保持向下兼容）
 * V3.2 记录优先，V3.1 记录作为兼容数据返回
 */
export function getAllHistoryMerged(): FengShuiHistoryRecordV31[] {
  const v32 = getHistoryV32()
  const v31 = getHistoryV31()
  const v32Ids = new Set(v32.map(r => r.id))
  // 合并去重，V3.2 优先
  const merged = [...v32, ...v31.filter(r => !v32Ids.has(r.id))]
  return merged.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * 根据 ID 获取 V3.2 单条记录
 */
export function getHistoryByIdV32(id: string): FengShuiHistoryRecordV32 | undefined {
  return getHistoryV32().find(r => r.id === id)
}

/**
 * 删除 V3.2 单条记录
 */
export function deleteHistoryV32(id: string): boolean {
  const existing = getHistoryV32()
  const filtered = existing.filter(r => r.id !== id)
  if (filtered.length === existing.length) return false
  localStorage.setItem(STORAGE_KEY_V32, JSON.stringify(filtered))
  return true
}

/**
 * V3.2 记录统计（含增强字段）
 */
export function getHistoryStatsV32() {
  const records = getHistoryV32()
  const baseStats = {
    total: records.length,
    active: records.filter(r => r.status === 'active').length,
    remediated: records.filter(r => r.status === 'remediated').length,
    archived: records.filter(r => r.status === 'archived').length,
    favorites: records.filter(r => r.favorite).length,
    averageScore: records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.overallScore, 0) / records.length)
      : 0,
    averageIssueCount: records.length > 0
      ? Math.round(records.reduce((s, r) => s + r.issueCount, 0) / records.length)
      : 0,
    roomTypeDistribution: records.reduce((map, r) => {
      map[r.roomType] = (map[r.roomType] ?? 0) + 1
      return map
    }, {} as Record<string, number>),
  }
  return baseStats
}
