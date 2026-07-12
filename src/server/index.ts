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
import paymentRoutes from './routes/payment'
import authRoutes from './routes/auth'
import { errorHandler } from './middleware/error'

const app = new Hono()

// 全局 CORS（生产环境应通过环境变量限制 origin）
app.use('*', cors())

// 统一错误处理
app.onError(errorHandler)

// 路由挂载
app.route('/api/bazi', baziRoutes)
app.route('/api/analyze', analyzeRoutes)
app.route('/api/compatibility', compatibilityRoutes)
app.route('/api/history', historyRoutes)
app.route('/api/user', userRoutes)
app.route('/api/payment', paymentRoutes)
app.route('/api/auth', authRoutes)

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
