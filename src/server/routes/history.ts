/**
 * 历史记录路由（骨架）
 *
 *   GET /api/history   —— 查询当前用户的历史记录（命盘 / 分析）
 *
 * 查询参数：
 *   page  = 1     页码（从 1 开始）
 *   limit = 20    每页数量（上限 100）
 *   type  = chart | analysis   记录类型
 *
 * 说明：
 *   - TODO: 接入 authRequired 鉴权后使用 c.get('user').id 过滤；
 *   - TODO: 从 charts / analysis_history 分页查询并合并按 created_at 排序；
 *   - 当前返回空列表 + 分页元信息，供前端联调。
 */

import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  const page = Math.max(1, Number(c.req.query('page')) || 1)
  const limitRaw = Number(c.req.query('limit')) || 20
  const limit = Math.min(100, Math.max(1, limitRaw))
  const type = c.req.query('type')

  // TODO: 鉴权 + 数据库分页查询
  // const user = requireUser(c)
  // ... supabase.from('charts').select('*').eq('user_id', user.id) ...

  return c.json({
    items: [],
    total: 0,
    page,
    limit,
    ...(type ? { type } : {}),
    message: '历史记录查询尚未接入数据库（骨架）',
  })
})

export default app
