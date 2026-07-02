/**
 * 用户信息路由（骨架）
 *
 *   GET /api/user   —— 获取当前登录用户信息
 *
 * 说明：
 *   - TODO: 接入 authRequired 后从 public.users 表读取资料；
 *   - 当前返回 mock 数据，供前端联调鉴权链路。
 */

import { Hono } from 'hono'
import type { User } from '../../lib/database/types'

const app = new Hono()

app.get('/', (c) => {
  // TODO: const user = requireUser(c)
  // TODO: 从 public.users 读取
  const mockUser: User = {
    id: 'dev-user',
    username: null,
    avatar_url: null,
    membership_tier: 'free',
    membership_expires_at: null,
    total_charts: 0,
    total_analyses: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  return c.json({ user: mockUser })
})

export default app
