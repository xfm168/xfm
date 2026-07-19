// V5.0 RC Phase 5 Module P: Release Checklist Engine — Types
// 12 项自动检查 + Release Gate

export type ChecklistItemStatus = 'passed' | 'failed' | 'skipped' | 'pending'
export type ChecklistCategory = 'algorithm' | 'quality' | 'performance' | 'documentation' | 'security' | 'compliance'
export type GateDecision = 'release' | 'hold' | 'conditional'

export interface ChecklistItem {
  id: string
  name: string
  category: ChecklistCategory
  description: string
  status: ChecklistItemStatus
  required: boolean
  automated: boolean
  result: string
  durationMs: number
}

export interface ReleaseChecklist {
  version: string
  generatedAt: number
  items: ChecklistItem[]
  overallPassed: boolean
  passRate: number
  failedItems: ChecklistItem[]
  gateDecision: GateDecision
  summary: ChecklistSummary
}

export interface ChecklistSummary {
  total: number
  passed: number
  failed: number
  skipped: number
  pending: number
}

export interface ReleaseGateOptions {
  strictMode: boolean
  skipCategories: ChecklistCategory[]
  version: string
}

export interface ChecklistAutomationRule {
  itemId: string
  handler: () => ChecklistItem
}

export const RELEASE_CHECKLIST_VERSION = '1.0.0'

export const DEFAULT_CHECKLIST_ITEMS: Array<{
  id: string
  name: string
  category: ChecklistCategory
  description: string
  required: boolean
  automated: boolean
}> = [
  { id: 'chk-001', name: 'TypeScript 编译零错误', category: 'quality', description: 'TS 编译器报告 0 错误', required: true, automated: true },
  { id: 'chk-002', name: 'Health Score >= 95', category: 'quality', description: '9 维健康评分 >= 95', required: true, automated: true },
  { id: 'chk-003', name: '测试覆盖率达标', category: 'quality', description: '所有测试文件通过率 100%', required: true, automated: true },
  { id: 'chk-004', name: '回归测试全通过', category: 'algorithm', description: 'Gold/Silver/Bronze 回归案例一致率 100%', required: true, automated: true },
  { id: 'chk-005', name: '性能不低于基线', category: 'performance', description: '单次排盘耗时 <= 基线 +10%', required: true, automated: true },
  { id: 'chk-006', name: 'Module 1~8 无修改', category: 'compliance', description: '冻结模块无任何代码变更', required: true, automated: true },
  { id: 'chk-007', name: '缓存版本一致性', category: 'quality', description: '所有引擎缓存版本号一致', required: true, automated: true },
  { id: 'chk-008', name: '许可证检查', category: 'security', description: '企业版许可证密钥有效', required: true, automated: true },
  { id: 'chk-009', name: '多语言覆盖率 >= 95%', category: 'documentation', description: '各 locale 翻译覆盖率 >= 95%', required: false, automated: true },
  { id: 'chk-010', name: 'API 接口稳定性', category: 'compliance', description: 'index.ts 导出无 breaking change', required: true, automated: true },
  { id: 'chk-011', name: '专家验证通过率 >= 90%', category: 'quality', description: '专家审核通过率 >= 90%', required: true, automated: true },
  { id: 'chk-012', name: '发布说明完整', category: 'documentation', description: 'ARCHITECTURE.md 版本行已更新', required: true, automated: true },
]

export const CHECKLIST_CATEGORIES: ChecklistCategory[] = [
  'algorithm', 'quality', 'performance', 'documentation', 'security', 'compliance'
]
