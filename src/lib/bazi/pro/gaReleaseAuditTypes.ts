// V5.0 GA P2: GA Release Audit Checklist — Types

export type AuditCategory = 'security' | 'performance' | 'data' | 'api' | 'permission' | 'seo' | 'mobile' | 'browser' | 'monitoring' | 'privacy' | 'payment' | 'disaster_recovery'
export type AuditSeverity = 'critical' | 'major' | 'minor' | 'info'
export type AuditStatus = 'passed' | 'failed' | 'warning' | 'not_checked' | 'skipped'
export type AuditGateDecision = 'go' | 'conditional_go' | 'hold'

export interface AuditCheckItem {
  id: string
  name: string
  category: AuditCategory
  description: string
  severity: AuditSeverity
  status: AuditStatus
  required: boolean
  result: string
  checkedAt: number | null
  checkedBy: string | null
  evidence: string
  remediation: string
}

export interface AuditChecklist {
  version: string
  auditType: string
  generatedAt: number
  items: AuditCheckItem[]
  overallStatus: AuditGateDecision
  passedCount: number
  failedCount: number
  warningCount: number
  skippedCount: number
  summary: string
  recommendation: string
}

export interface AuditReport {
  checklist: AuditChecklist
  riskAssessment: string
  releaseReadiness: number
  blockers: AuditCheckItem[]
  recommendations: string[]
  signOff: AuditSignOff | null
}

export interface AuditSignOff {
  signedBy: string
  role: string
  signedAt: number
  decision: AuditGateDecision
  comment: string
}

export const GA_RELEASE_AUDIT_VERSION = '1.0.0'

export const GA_AUDIT_CHECKLIST: Array<{
  id: string
  name: string
  category: AuditCategory
  description: string
  severity: AuditSeverity
  required: boolean
}> = [
  // Security (4)
  { id: 'ga-sec-001', name: 'API 认证与授权', category: 'security', description: '所有 API 端点需认证，权限控制完整', severity: 'critical', required: true },
  { id: 'ga-sec-002', name: 'SQL 注入防护', category: 'security', description: '所有数据库查询使用参数化', severity: 'critical', required: true },
  { id: 'ga-sec-003', name: 'XSS 防护', category: 'security', description: '所有用户输入进行 HTML 转义', severity: 'major', required: true },
  { id: 'ga-sec-004', name: 'CSRF 防护', category: 'security', description: '所有状态修改请求携带 CSRF Token', severity: 'major', required: true },

  // Performance (3)
  { id: 'ga-perf-001', name: '页面加载时间', category: 'performance', description: '首屏加载 <= 3 秒', severity: 'critical', required: true },
  { id: 'ga-perf-002', name: 'API 响应时间', category: 'performance', description: '95% 请求 <= 500ms', severity: 'major', required: true },
  { id: 'ga-perf-003', name: '并发处理能力', category: 'performance', description: '支持 100 并发用户', severity: 'major', required: false },

  // Data (3)
  { id: 'ga-data-001', name: '数据库备份', category: 'data', description: '自动每日备份，保留 30 天', severity: 'critical', required: true },
  { id: 'ga-data-002', name: '数据恢复测试', category: 'data', description: '备份恢复流程已验证', severity: 'major', required: true },
  { id: 'ga-data-003', name: '数据加密', category: 'data', description: '敏感数据（支付、个人信息）加密存储', severity: 'critical', required: true },

  // API (2)
  { id: 'ga-api-001', name: 'API 版本控制', category: 'api', description: 'API 使用版本化路径（/v1/）', severity: 'major', required: true },
  { id: 'ga-api-002', name: 'API 限流', category: 'api', description: '所有端点实施速率限制', severity: 'major', required: false },

  // Permission (2)
  { id: 'ga-perm-001', name: 'RBAC 权限体系', category: 'permission', description: '基于角色的访问控制完整', severity: 'critical', required: true },
  { id: 'ga-perm-002', name: '数据隔离', category: 'permission', description: '用户间数据完全隔离', severity: 'critical', required: true },

  // SEO (2)
  { id: 'ga-seo-001', name: 'Meta 标签完整', category: 'seo', description: '所有页面 title/description/keywords 完整', severity: 'minor', required: false },
  { id: 'ga-seo-002', name: '结构化数据', category: 'seo', description: 'JSON-LD 结构化数据标记', severity: 'minor', required: false },

  // Mobile (2)
  { id: 'ga-mob-001', name: '响应式布局', category: 'mobile', description: '所有页面移动端适配', severity: 'major', required: true },
  { id: 'ga-mob-002', name: '触摸交互', category: 'mobile', description: '所有交互元素触摸友好（最小 44px）', severity: 'minor', required: false },

  // Browser (2)
  { id: 'ga-brw-001', name: 'Chrome/Safari 支持', category: 'browser', description: '最新 2 个主版本完全支持', severity: 'critical', required: true },
  { id: 'ga-brw-002', name: '降级策略', category: 'browser', description: '旧浏览器有合理降级', severity: 'minor', required: false },

  // Monitoring (2)
  { id: 'ga-mon-001', name: '错误监控', category: 'monitoring', description: '前端 + 后端错误自动上报', severity: 'major', required: true },
  { id: 'ga-mon-002', name: '性能监控', category: 'monitoring', description: 'Core Web Vitals 持续监测', severity: 'minor', required: false },

  // Privacy (2)
  { id: 'ga-priv-001', name: '隐私政策', category: 'privacy', description: '隐私政策页面完整、链接可见', severity: 'critical', required: true },
  { id: 'ga-priv-002', name: 'GDPR/合规', category: 'privacy', description: '用户数据删除、导出功能可用', severity: 'major', required: true },

  // Payment (2)
  { id: 'ga-pay-001', name: '支付流程完整性', category: 'payment', description: '下单→支付→确认→回调 全链路测试通过', severity: 'critical', required: true },
  { id: 'ga-pay-002', name: '支付安全', category: 'payment', description: '支付回调验签、金额校验', severity: 'critical', required: true },

  // Disaster Recovery (2)
  { id: 'ga-dr-001', name: '容灾方案', category: 'disaster_recovery', description: '故障转移/降级方案已文档化', severity: 'major', required: true },
  { id: 'ga-dr-002', name: 'RTO/RPO', category: 'disaster_recovery', description: '恢复时间目标 <= 4h，数据丢失 <= 1h', severity: 'major', required: true },
]

export const AUDIT_CATEGORIES: AuditCategory[] = [
  'security', 'performance', 'data', 'api', 'permission', 'seo', 'mobile', 'browser', 'monitoring', 'privacy', 'payment', 'disaster_recovery'
]