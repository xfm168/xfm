/**
 * HTTP 安全响应头配置
 *
 * 定义一组推荐的 HTTP 安全响应头，用于服务端（Hono）在响应中设置，
 * 防止 MIME 嗅探、点击劫持、XSS、协议降级等常见攻击。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/**
 * 推荐的安全响应头集合
 *
 * 包含以下头部：
 * - X-Content-Type-Options: 阻止 MIME 嗅探
 * - X-Frame-Options: 禁止被任意 iframe 嵌入（DENY）
 * - X-XSS-Protection: 启用浏览器 XSS 过滤器
 * - Referrer-Policy: 仅在同源时发送完整 Referer
 * - Permissions-Policy: 禁用相机/麦克风/地理位置
 * - Strict-Transport-Security: 强制 HTTPS（含子域名与 preload）
 * - X-Permitted-Cross-Domain-Policies: 禁止跨域策略文件
 * - Cross-Origin-Opener-Policy: 同源隔离顶层窗口
 * - Cross-Origin-Embedder-Policy: 要求跨域资源携带 CORP
 * - Cross-Origin-Resource-Policy: 同源资源隔离
 */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

/**
 * 获取安全响应头的只读副本
 *
 * @returns 安全响应头对象
 */
export function getSecurityHeaders(): Record<string, string> {
  const result: Record<string, string> = {}
  const keys = Object.keys(SECURITY_HEADERS)
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = SECURITY_HEADERS[keys[i]]
  }
  return result
}

/**
 * 将安全响应头应用到 Headers-like 对象（如 Hono 的 c.header）
 *
 * @param setHeader - 设置单个头的函数 (name, value) => void
 */
export function applySecurityHeaders(
  setHeader: (name: string, value: string) => void
): void {
  const keys = Object.keys(SECURITY_HEADERS)
  for (let i = 0; i < keys.length; i++) {
    setHeader(keys[i], SECURITY_HEADERS[keys[i]])
  }
}
