/**
 * 安全工具统一导出
 *
 * 汇总导出 inputValidation 和 rateLimit 模块的所有公开接口，
 * 便于外部统一引用。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

// inputValidation 模块导出
export {
  validateEmail,
  validatePhone,
  validateBirthDate,
  validateBirthTime,
  validateGender,
  validateRoomType,
  sanitizeInput,
  validateFileSize,
  validateImageType,
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_UPLOAD_SIZE
} from './inputValidation'

// rateLimit 模块导出
export { createRateLimiter } from './rateLimit'

// csp 模块导出
export { DEFAULT_CSP, EXPORTED_CSP } from './csp'

// headers 模块导出
export {
  SECURITY_HEADERS,
  getSecurityHeaders,
  applySecurityHeaders
} from './headers'

// sanitize 模块导出
export {
  sanitizeHtml,
  sanitizeUrl,
  sanitizeJson,
  sanitizeFilename,
  encodeForHtml,
  encodeForUrl,
  encodeForJs
} from './sanitize'

// audit 模块导出
export {
  runXSSAudit,
  runCSRFCudit,
  runRateLimitAudit,
  runInputAudit,
  runOutputAudit,
  runSecretsScan,
  runDependencyScan,
  runLicenseScan,
  runFullAudit
} from './audit'
export type {
  AuditFinding,
  SecurityAuditResult,
  AuditContext
} from './audit'
