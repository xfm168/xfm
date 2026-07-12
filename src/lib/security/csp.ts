/**
 * CSP（Content Security Policy）策略常量
 *
 * 定义前端和后端使用的 CSP 策略字符串。
 * DEFAULT_CSP 与 index.html 中的 meta 标签保持一致。
 * EXPORTED_CSP 用于服务端通过 HTTP header 设置 CSP。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/**
 * 默认 CSP 策略（与 index.html meta 标签一致）
 *
 * 包含 'unsafe-inline' 和 'unsafe-eval' 以支持 Vite 开发环境，
 * 生产环境应进一步收紧策略。
 */
export const DEFAULT_CSP: string =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
  "font-src 'self' https://fonts.gstatic.com data:; " +
  "img-src 'self' data: blob: https:; " +
  "connect-src 'self' https://*.supabase.co https://api.openai.com https://generativelanguage.googleapis.com; " +
  "frame-ancestors 'none'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "upgrade-insecure-requests;"

/**
 * 导出用 CSP 策略（用于服务端设置 Content-Security-Policy 响应头）
 *
 * 与 DEFAULT_CSP 相同，但可根据生产环境需求进一步收紧。
 */
export const EXPORTED_CSP: string = DEFAULT_CSP
