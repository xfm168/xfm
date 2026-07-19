/**
 * Release Certification Engine — 发布认证核心引擎
 *
 * 职责：
 *   - 执行 6 项发布检查（Performance/Regression/Expert/Knowledge/Coverage/Health）
 *   - 生成发布认证证书
 *   - 管理证书生命周期（验证/撤销/历史）
 * 约束：
 *   - Performance 数据使用默认值（不触发真实 Benchmark 运行）
 *   - 不修改已有引擎数据（只读）
 */

import type {
  CertificationCheck,
  CertSignatory,
  ReleaseCertification,
  ReleaseType,
  CertificationStatus,
} from './releaseCertificationTypes'

import { getAllCasesV2, getCaseStatisticsV2 } from './caseDatabaseV2'
import { KNOWLEDGE_BASE } from './knowledgeBaseDatabase'
import { getReviewStats } from './professionalReviewEngine'
import { runQualityGate } from './qualityGateEngine'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const RELEASE_CERTIFICATION_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 默认常量
// ═══════════════════════════════════════════

/** 默认 Performance 分数（不触发真实 Benchmark） */
const DEFAULT_PERF_SCORE = 95
/** 证书有效期（毫秒） */
const CERT_VALIDITY_DURATION_MS = 90 * 24 * 60 * 60 * 1000 // 90 天

// ═══════════════════════════════════════════
// 3. 内部证书存储
// ═══════════════════════════════════════════

/** 已颁发的证书存储 */
const certificateStore: ReleaseCertification[] = []

// ═══════════════════════════════════════════
// 4. 辅助函数
// ═══════════════════════════════════════════

/** 生成证书 ID */
function generateCertificateId(productName: string, version: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CERT-${productName}-${version}-${ts}-${rand}`
}

/** 判断证书是否过期 */
function isExpired(cert: ReleaseCertification): boolean {
  return Date.now() > cert.expirationDate
}

// ═══════════════════════════════════════════
// 5. 检查执行函数
// ═══════════════════════════════════════════

/** 检查 1：Performance Check */
function executePerformanceCheck(): CertificationCheck {
  const score = DEFAULT_PERF_SCORE
  const threshold = 70
  return {
    name: 'Performance Check',
    passed: score >= threshold,
    score,
    threshold,
    details: `性能基准评分 ${score}（使用默认值，未触发实际 Benchmark 运行）`,
    required: true,
  }
}

/** 检查 2：Regression Check */
function executeRegressionCheck(): CertificationCheck {
  const allCases = getAllCasesV2()
  const totalCount = allCases.length
  const goldCount = allCases.filter((c) => c.regressionTier === 'gold').length
  const ratedCount = goldCount + allCases.filter((c) => c.regressionTier === 'silver').length + allCases.filter((c) => c.regressionTier === 'bronze').length
  const consistencyRate = totalCount > 0 ? Math.round((ratedCount / totalCount) * 100) : 0

  const threshold = 50
  return {
    name: 'Regression Check',
    passed: consistencyRate >= threshold,
    score: consistencyRate,
    threshold,
    details: `回归一致性 ${consistencyRate}%（${ratedCount}/${totalCount} 案例有回归评级，Gold ${goldCount} 个）`,
    required: true,
  }
}

/** 检查 3：Expert Check */
function executeExpertCheck(): CertificationCheck {
  const stats = getReviewStats()
  const approvalRate = stats.approvalRate
  const threshold = 60
  return {
    name: 'Expert Check',
    passed: approvalRate >= threshold || stats.totalReviews === 0,
    score: approvalRate,
    threshold,
    details: `专家审核通过率 ${approvalRate}%（共 ${stats.totalReviews} 条审核，争议率 ${stats.contestedRate}%）`,
    required: true,
  }
}

/** 检查 4：Knowledge Check */
function executeKnowledgeCheck(): CertificationCheck {
  const totalKB = KNOWLEDGE_BASE.length
  const categories = new Set(KNOWLEDGE_BASE.map((k) => k.category))
  const coverageRate = Math.round((categories.size / 19) * 100)
  const threshold = 70
  return {
    name: 'Knowledge Check',
    passed: coverageRate >= threshold,
    score: coverageRate,
    threshold,
    details: `知识库覆盖率 ${coverageRate}%（${categories.size}/19 分类，${totalKB} 条知识条目）`,
    required: true,
  }
}

/** 检查 5：Coverage Check */
function executeCoverageCheck(): CertificationCheck {
  const report = runQualityGate()
  const passRate = Math.round(report.summary.passRate)
  const threshold = 80
  return {
    name: 'Coverage Check',
    passed: passRate >= threshold,
    score: passRate,
    threshold,
    details: `质量检查通过率 ${passRate}%（${report.summary.passedChecks}/${report.summary.totalChecks} 项通过）`,
    required: true,
  }
}

/** 检查 6：Health Check */
function executeHealthCheck(): CertificationCheck {
  const report = runQualityGate()
  const healthScore = Math.round(report.healthScore.totalScore)
  const threshold = 70
  return {
    name: 'Health Check',
    passed: healthScore >= threshold,
    score: healthScore,
    threshold,
    details: `引擎健康评分 ${healthScore}（${report.healthScore.grade}），发布门禁 ${report.releaseAllowed ? 'PASS' : 'FAIL'}`,
    required: true,
  }
}

// ═══════════════════════════════════════════
// 6. 核心函数
// ═══════════════════════════════════════════

/** 生成发布认证选项 */
export interface ReleaseCertificationOptions {
  productName: string
  version: string
  releaseType: ReleaseType
  signatories?: CertSignatory[]
}

/**
 * 生成发布认证证书
 *
 * 执行 6 项检查：
 *  1. Performance Check  2. Regression Check  3. Expert Check
 *  4. Knowledge Check   5. Coverage Check   6. Health Check
 *
 * @param options - 发布认证选项
 * @returns ReleaseCertification
 */
export function generateReleaseCertification(options: ReleaseCertificationOptions): ReleaseCertification {
  const { productName, version, releaseType, signatories } = options

  // 执行 6 项检查
  const checks: CertificationCheck[] = [
    executePerformanceCheck(),
    executeRegressionCheck(),
    executeExpertCheck(),
    executeKnowledgeCheck(),
    executeCoverageCheck(),
    executeHealthCheck(),
  ]

  // 计算总体分数（加权平均）
  const totalScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length
  const overallScore = Math.round(totalScore * 100) / 100

  // 所有检查是否通过
  const overallPassed = checks.every((c) => c.passed)

  // 生成证书 ID 和时间戳
  const generatedAt = Date.now()
  const certificateId = generateCertificateId(productName, version)

  // 计算过期时间
  const expirationDate = generatedAt + CERT_VALIDITY_DURATION_MS

  // 默认签署人
  const defaultSignatories: CertSignatory[] = [
    { role: 'QA Lead', name: 'System', signedAt: generatedAt },
    { role: 'Release Manager', name: 'System', signedAt: generatedAt },
  ]

  const cert: ReleaseCertification = {
    certificateId,
    version,
    productName,
    releaseType,
    generatedAt,
    checks,
    overallPassed,
    overallScore,
    expirationDate,
    signatories: signatories ?? defaultSignatories,
    status: overallPassed ? 'approved' : 'rejected',
  }

  // 存入历史
  certificateStore.push(cert)

  return cert
}

/**
 * 验证证书是否有效（未过期、完整）
 *
 * @param cert - 待验证的证书
 * @returns 是否有效
 */
export function validateCertification(cert: ReleaseCertification): boolean {
  // 检查是否过期
  if (isExpired(cert)) return false

  // 检查是否完整（至少有 6 项检查）
  if (cert.checks.length < 6) return false

  // 检查必要字段
  if (!cert.certificateId || !cert.version || !cert.productName) return false

  return true
}

/**
 * 获取所有历史证书
 *
 * @returns 证书列表
 */
export function getCertificateHistory(): ReleaseCertification[] {
  return [...certificateStore]
}

/**
 * 撤销证书
 *
 * @param certId - 证书 ID
 * @returns 是否成功撤销
 */
export function revokeCertification(certId: string): boolean {
  const cert = certificateStore.find((c) => c.certificateId === certId)
  if (!cert) return false

  if (isExpired(cert)) return false

  cert.status = 'expired'
  return true
}
