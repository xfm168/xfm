/**
 * 监控上报 API
 * POST /api/monitoring/vitals   — 上报 Web Vitals
 * POST /api/monitoring/error    — 上报前端 JS 错误
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { recordWebVitals, recordJsError } from '../middleware/monitoring'

var app = new Hono()

app.post('/vitals', authRequired, async function(c) {
  var body = await c.req.json()
  var name = body.name || ''
  var value = body.value || 0
  var unit = body.unit || 'ms'
  var path = body.path || ''
  var rating = body.rating || 'unknown'

  if (!name) {
    return c.json({ error: '缺少 name' }, 400)
  }

  var validNames = ['TTFB', 'FCP', 'LCP', 'CLS', 'INP', 'TBT', 'FID']
  if (validNames.indexOf(name) === -1) {
    return c.json({ error: '无效的 Web Vitals 指标: ' + name }, 400)
  }

  await recordWebVitals({ name: name, value: value, unit: unit, path: path, rating: rating })
  return c.json({ received: true })
})

app.post('/error', authRequired, async function(c) {
  var body = await c.req.json()
  var message = body.message || ''
  var filename = body.filename || ''
  var lineno = body.lineno || 0
  var colno = body.colno || 0
  var stack = body.stack || ''
  var path = body.path || ''

  if (!message) {
    return c.json({ error: '缺少 message' }, 400)
  }

  await recordJsError({ message: message, filename: filename, lineno: lineno, colno: colno, stack: stack, path: path })
  return c.json({ received: true })
})

export default app