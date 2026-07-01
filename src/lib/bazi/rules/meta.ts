/**
 * Rule Meta - 规则元数据与版本管理
 * V4.8.1 Baseline
 *
 * 所有 Rule 必须拥有完整生命周期：draft → review → stable → deprecated
 * Stable 状态的规则冻结，只能通过版本升级修改。
 */

export type RuleStatus = 'draft' | 'review' | 'stable' | 'deprecated'

export type RuleEvidenceLevel = 'A' | 'B' | 'C'

/** 变更记录 */
export interface ChangeLog {
  version: string
  date: string
  description: string
  author: string
}

/** 规则证据 */
export interface RuleEvidence {
  level: RuleEvidenceLevel
  reason: string
  classicSupport: number
  commercialAgreement: number
  casePassRate: number
}

/** 规则元数据 */
export interface RuleMeta {
  /** Rule ID，如 RULE-PP-001 */
  id: string
  /** 语义化版本，如 1.0.0 */
  version: string
  /** 规则标题 */
  title: string
  /** 作者 */
  author: string
  /** 审核人 */
  reviewer?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 生命周期状态 */
  status: RuleStatus
  /** 是否冻结（Stable后不可直接修改） */
  frozen: boolean
  /** 冻结时间 */
  frozenAt?: string
  /** 经典出处 */
  source: string[]
  /** 来源等级：1=一级经典 2=二级 3=网络 */
  sourceLevel: 1 | 2 | 3
  /** 分类 */
  category: string
  /** 优先级 */
  priority: number
  /** 证据等级 */
  evidence?: RuleEvidence
  /** 变更历史 */
  changeLogs: ChangeLog[]
  /** 上一版本 */
  previousVersion?: string
  /** 下一版本 */
  nextVersion?: string
}

/** 创建规则元数据的辅助函数 */
export function createRuleMeta(params: {
  id: string
  title: string
  author: string
  source: string[]
  sourceLevel: 1 | 2 | 3
  category: string
  priority: number
  evidence?: RuleEvidence
}): RuleMeta {
  const now = new Date().toISOString()
  return {
    id: params.id,
    version: '1.0.0',
    title: params.title,
    author: params.author,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    frozen: false,
    source: params.source,
    sourceLevel: params.sourceLevel,
    category: params.category,
    priority: params.priority,
    evidence: params.evidence,
    changeLogs: [{
      version: '1.0.0',
      date: now,
      description: '初始版本',
      author: params.author,
    }],
  }
}

/** 将规则标记为 Stable（冻结） */
export function freezeRule(meta: RuleMeta, reviewer: string): RuleMeta {
  const now = new Date().toISOString()
  return {
    ...meta,
    status: 'stable',
    frozen: true,
    frozenAt: now,
    reviewer,
    updatedAt: now,
  }
}

/** 创建新版本 */
export function bumpVersion(
  meta: RuleMeta,
  newVersion: string,
  description: string,
  author: string,
): RuleMeta {
  const now = new Date().toISOString()
  return {
    ...meta,
    version: newVersion,
    previousVersion: meta.version,
    status: 'draft',
    frozen: false,
    frozenAt: undefined,
    updatedAt: now,
    changeLogs: [
      ...meta.changeLogs,
      {
        version: newVersion,
        date: now,
        description,
        author,
      },
    ],
  }
}
