/**
 * 玄风门 API 服务入口（Hono）
 *
 * - Hono 应用本身 Edge 兼容（可部署到 Cloudflare Workers / Deno / Vercel Edge）。
 * - 在 Node 环境下（`server:dev` / `server:start`）通过 @hono/node-server 启动 HTTP 服务；
 *   该启动段被 `typeof process` 守卫，Edge 运行时不会执行。
 *
 * 路由：
 *   POST /api/bazi            排盘（计算八字）
 *   POST /api/analyze         分析（basic / full / ai）
 *   POST /api/compatibility   合婚分析
 *   GET  /api/history         历史记录
 *   GET  /api/user            当前用户信息
 *   GET  /api/health          健康检查
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import baziRoutes from './routes/bazi'
import analyzeRoutes from './routes/analyze'
import compatibilityRoutes from './routes/compatibility'
import historyRoutes from './routes/history'
import userRoutes from './routes/user'
import userExtendedRoutes from './routes/user-extended'
import paymentRoutes from './routes/payment'
import authRoutes from './routes/auth'
import proRoutes from './routes/pro'
import proHistoryRoutes from './routes/pro-history'
import proFeedbackRoutes from './routes/pro-feedback'
import feedbackRoutes from './routes/feedback'
import monitoringRoutes from './routes/monitoring'
import reportRoutes from './routes/reports'
import sitemapRoutes from './routes/sitemap'
import adminAnalyticsRoutes from './routes/admin-analytics'
import growthRoutes from './routes/growth'
import notificationRoutes from './routes/notifications'
import adminOpsRoutes from './routes/admin-ops'
import publicOpsRoutes from './routes/public-ops'
import { monitoringMiddleware, startMonitoringFlush } from './middleware/monitoring'
import { errorHandler } from './middleware/error'
import { rateLimiter } from './middleware/rateLimiter'

const app = new Hono()

// CORS 策略：生产环境仅允许配置域名，开发环境允许 localhost
var isProduction = (typeof process !== 'undefined') && (process.env.NODE_ENV === 'production')
var allowedOrigins = process.env.ALLOWED_ORIGINS || ''

function getAllowedOrigins(): string[] {
  if (allowedOrigins) {
    return allowedOrigins.split(',').map(function(o) { return o.trim() }).filter(Boolean)
  }
  if (isProduction) {
    return []
  }
  return ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000']
}

var corsOrigins = getAllowedOrigins()

if (corsOrigins.length === 0 && isProduction) {
  // 生产环境未配置 ALLOWED_ORIGINS：完全拒绝跨域请求
  app.use('*', async function(c, next) {
    var origin = c.req.header('Origin') || ''
    if (origin) {
      return c.json({ error: 'CORS not configured' }, 403)
    }
    await next()
  })
} else {
  app.use('*', cors({ origin: corsOrigins, allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization', 'Wechatpay-Signature', 'Wechatpay-Timestamp', 'Wechatpay-Nonce', 'Wechatpay-Serial', 'stripe-signature'], exposeHeaders: ['Content-Length'], maxAge: 86400, credentials: true }))
}

// 生产监控中间件：记录 API 响应时间
app.use('*', monitoringMiddleware)

// 全局基础限流：每 IP 100 请求/分钟
app.use('*', rateLimiter({ maxRequests: 100, windowMs: 60000 }))

// 统一错误处理
app.onError(errorHandler)

// 路由挂载
app.route('/api/bazi', baziRoutes)
app.route('/api/analyze', analyzeRoutes)
app.route('/api/compatibility', compatibilityRoutes)
app.route('/api/history', historyRoutes)
app.route('/api/user', userRoutes)
app.route('/api/user', userExtendedRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/pro', proRoutes)
app.route('/api/pro-reports', proHistoryRoutes)
app.route('/api/pro-feedback', proFeedbackRoutes)
app.route('/api/feedback', feedbackRoutes)
app.route('/api/monitoring', monitoringRoutes)
app.route('/api/reports', reportRoutes)
app.route('/sitemap.xml', sitemapRoutes)
app.route('/api/admin/analytics', adminAnalyticsRoutes)
app.route('/api/growth', growthRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/admin', adminOpsRoutes)
app.route('/api', publicOpsRoutes)

// robots.txt（SEO）
app.get('/robots.txt', async function(c) {
  var origin = process.env.PUBLIC_URL || 'https://xuanfengmen.com'
  c.header('Content-Type', 'text/plain')
  return c.body('User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ' + origin + '/sitemap.xml\n')
})

// 健康检查
app.get('/api/health', (c) =>
  c.json({ status: 'ok', version: '0.1.0', service: 'xuanfengmen-api' }),
)

export default app

// ───────────────────────────────────────────────
//  Node 环境启动 HTTP 服务（本地开发 / 直跑）
//  Edge 部署时此段被守卫跳过，应用以 `app` 默认导出形式被平台接管。
// ───────────────────────────────────────────────
if (typeof process !== 'undefined') {
  void import('@hono/node-server')
    .then(({ serve }) => {
      const port = Number(process.env.PORT) || 3001
      startMonitoringFlush()
      serve({ fetch: app.fetch, port }, (info) => {
        // eslint-disable-next-line no-console
        console.log(`玄风门 API 已启动: http://localhost:${info.port}`)
      })
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[server] 启动失败:', err)
    })
}
