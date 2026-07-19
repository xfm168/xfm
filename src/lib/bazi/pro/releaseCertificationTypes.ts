/**
 * Release Certification — 发布认证类型定义
 *
 * 职责：定义发布认证流程的所有数据结构
 */

/** 发布类型 */
export type ReleaseType = 'major' | 'minor' | 'patch' | 'rc'

/** 认证状态 */
export type CertificationStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'expired'

/** 单项认证检查 */
export interface CertificationCheck {
  name: string
  passed: boolean
  score: number
  threshold: number
  details: string
  required: boolean
}

/** 签署人 */
export interface CertSignatory {
  role: string
  name: string
  signedAt: number
}

/** 完整的发布认证证书 */
export interface ReleaseCertification {
  certificateId: string
  version: string
  productName: string
  releaseType: ReleaseType
  generatedAt: number
  checks: CertificationCheck[]
  overallPassed: boolean
  overallScore: number
  expirationDate: number
  signatories: CertSignatory[]
  status: CertificationStatus
}
