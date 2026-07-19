# V4.4 Release Freeze

**Architecture Frozen**

## Frozen Components

- ✅ Pipeline Architecture
- ✅ Rule Engine (101 Rules)
- ✅ Knowledge Base (76 Entries)
- ✅ 推演服务提供方 (Unified Timeout)
- ✅ Evidence Chain
- ✅ Report Template

## Allowed Changes

### Bug Fix
- 修复运行时 Bug
- 修复崩溃问题
- 修复数据错误

### Security Fix
- 安全漏洞修复
- 依赖安全升级
- 敏感数据保护

### Business Feature
- 新的业务功能开发
- 产品功能迭代
- 商业功能新增（会员、支付、报告导出等）

## Forbidden Changes

### Architecture Refactor
- 模块拆分/合并
- 目录结构调整
- 依赖关系重构

### Rule Refactor
- 删除/新增规则
- 修改规则逻辑
- 修改 RuleID

### Pipeline Refactor
- 修改执行步骤顺序
- 新增/删除 Pipeline 阶段
- 修改数据流结构

### Knowledge Refactor
- 删除知识库条目
- 大规模知识库重构
- 知识库格式变更

### Type Refactor
- 大规模类型重构
- 为了消除 any 而修改业务逻辑
- strict 模式激进调整

## Module Status

| Module | Status | Action |
|--------|--------|--------|
| Pipeline | Frozen | No modification |
| Vision | Integrated | No deletion |
| Simulation | Deprecated | Reserved, no deletion |
| 推演服务提供方 | Frozen | No modification |
| Rule Engine | Frozen | No modification |
| Knowledge Base | Frozen | No modification |

---

## New Feature Development Principles

All new features **MUST** reuse V4.4 existing architecture:

| Architecture Component | Purpose | Reuse For |
|------------------------|---------|-----------|
| 推演服务提供方 | Unified timeout/retry/error | 八字推演, 合盘推演, 管理推演 |
| Pipeline | 10-step flow pattern | Bazi Pipeline, 合盘 Pipeline |
| Report Engine | 12-section template | Bazi Report, 合盘 Report |
| Logger | Unified logging (dev/prod) | All new modules |
| Knowledge Base | Knowledge pattern | Bazi knowledge, 合盘 knowledge |
| Release Metadata | Version info | All new pages/logs |

**Rule:** Do NOT create second framework or duplicate implementation.
Only build new architecture if there is a clear technical limitation.

---

## Development Roadmap (Post-Freeze)

### Phase 1: Bazi System (Highest Priority)
- 命盘核心：四柱排盘、十神、五行、纳音、神煞、旺衰
- 格局系统：正格、从格、化格、调候、用神、喜神、忌神
- 运势系统：大运、流年、流月、应期（3年/5年/10年）
- AI八字报告：性格、事业、财富、婚姻、健康、子女、父母、运势、建议

### Phase 2: Couple Analysis
- 风水 + 八字合盘
- 合婚评分、五行互补、性格互补
- 婚姻稳定度、财富指数、子女缘
- 居住风水建议、幸运颜色、幸运方位

### Phase 3: Admin System
- 用户、订单、支付、会员管理
- AI调用统计、Token统计、错误日志
- 反馈、CMS、知识库维护、规则维护、公告管理

### Phase 4: Security
- Supabase RLS
- API Rate Limit
- JWT / Refresh Token
- Webhook 验证
- 推演调用限制
- 日志系统

### Phase 5: Commercialization
- 会员系统
- 支付系统
- PDF报告 / Word导出
- 分享 / 邀请码 / 优惠券
- 订单系统

### Phase 6: Beta Launch
- 100人测试
- Bug收集、AI成本分析、用户反馈
- 正式上线

---

## Version

- Release: V4.4 Release
- Channel: Release
- Build: 2026-07
- Status: Freeze

## Contact

For any architecture change request, create a proposal issue first.

---

**Released: 2026-07-01**