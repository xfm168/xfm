# 玄风门 Data Dictionary（数据字典）

> 版本：V1.0 | 日期：2026-06-29 | 数据库：Supabase PostgreSQL
>
> 本文档为数据库唯一标准。
> 禁止数据库结构与文档不一致。
> 每次数据库修改必须同步更新。

---

## 文档体系

玄风门十大核心文档：

| # | 文档 | 定位 |
|---|------|------|
| 01 | Project Status | 当前开发状态 |
| 02 | Architecture Constitution | 最高开发原则 |
| 03 | Engineering Handbook | 工程开发规范 |
| 04 | Master PRD | 产品需求总文档 |
| 05 | Version Roadmap | 长期版本规划 |
| 06 | Algorithm Whitepaper | 核心知识资产 |
| 07 | Rule Specification | 规则唯一来源 |
| 08 | **Data Dictionary（本文）** | **数据库唯一标准** |
| 09 | API Specification | 接口唯一标准 |
| 10 | Admin Handbook | 后台运营手册 |

---

## 一、数据库概况

| 项目 | 内容 |
|------|------|
| 数据库类型 | PostgreSQL 15+ |
| 托管平台 | Supabase |
| 当前表数量 | 4 |
| 计划表数量（V10） | 30+ |
| RLS 启用 | ✅ 全部业务表 |
| Migration 数量 | 4 |

### 1.1 命名规范

| 对象类型 | 命名格式 | 示例 |
|---------|---------|------|
| 表名 | 蛇形，小写，复数 | `hexagrams`, `daily_hexagrams` |
| 字段名 | 蛇形，小写 | `hexagram_id`, `created_at` |
| 主键 | `id` | `id uuid` |
| 外键 | `<表名单数>_id` | `hexagram_id` |
| 索引 | `idx_<表>_<字段>` | `idx_divinations_visitor` |
| 约束 | `<表>_<字段>_<类型>` | `hexagrams_number_key` |
| 策略 | `<表>_<动作>_<描述>` | `hexagrams_select_public` |
| 视图 | `v_<描述>` | `v_user_daily_summary` |
| 函数 | `fn_<描述>` | `fn_calculate_bazi` |
| 触发器 | `trg_<表>_<动作>` | `trg_updated_at` |

### 1.2 通用字段

所有业务表必须包含：

| 字段 | 类型 | 说明 | 必填 |
|------|------|------|------|
| `id` | `uuid` | 主键，默认 gen_random_uuid() | ✅ |
| `created_at` | `timestamptz` | 创建时间，默认 now() | ✅ |
| `updated_at` | `timestamptz` | 更新时间，触发器自动更新 | 视情况 |
| `deleted_at` | `timestamptz` | 软删除时间 | 视情况 |

---

## 二、数据表详细说明

### 2.1 hexagrams（六十四卦主数据表）

**表说明：** 存储易经六十四卦基础数据，只读表。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK, gen_random_uuid() | 主键 |
| `number` | `smallint` | NOT NULL, UNIQUE, CHECK (1-64) | 卦序 1-64 |
| `name` | `text` | NOT NULL | 卦名（如"乾"、"坤"） |
| `symbol` | `text` | NOT NULL | Unicode卦符（䷀–䷿） |
| `upper_trigram` | `text` | NOT NULL | 上卦名 |
| `lower_trigram` | `text` | NOT NULL | 下卦名 |
| `lines` | `text[6]` | NOT NULL | 六爻，index 0=初爻(底), 5=上爻(顶) |
| `description` | `text` | NOT NULL | 卦辞 |
| `fortune` | `text` | NOT NULL | 总运 |
| `career` | `text` | NOT NULL | 事业 |
| `wealth` | `text` | NOT NULL | 财运 |
| `love` | `text` | NOT NULL | 感情 |
| `health` | `text` | NOT NULL | 健康 |
| `advice_do` | `text[]` | NOT NULL, DEFAULT '{}' | 宜做事项 |
| `advice_dont` | `text[]` | NOT NULL, DEFAULT '{}' | 忌做事项 |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | 创建时间 |

**索引：**
- `hexagrams_pkey` — 主键索引
- `hexagrams_number_key` — 卦序唯一索引

**RLS 策略：**
- `hexagrams_select_public` — 所有人只读（FOR SELECT USING (true)）

**数据量：** 64 条（六十四卦）

**参考文件：** `supabase/migrations/20260619112842_create_hexagrams_table.sql`

---

### 2.2 daily_hexagrams（用户每日卦运记录表）

**表说明：** 记录用户每日一卦的结果，Phase 1 使用 visitor_id 标识用户。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK, gen_random_uuid() | 主键 |
| `visitor_id` | `text` | NOT NULL | 访客标识（localStorage UUID） |
| `date` | `date` | NOT NULL | 卦运日期 |
| `hexagram_id` | `uuid` | NOT NULL, FK → hexagrams(id) | 关联卦象 |
| `hexagram_number` | `smallint` | NOT NULL | 卦序（冗余，便于查询） |
| `score` | `smallint` | NOT NULL, CHECK (1-100) | 综合评分 |
| `career_score` | `smallint` | NOT NULL, CHECK (1-100) | 事业评分 |
| `wealth_score` | `smallint` | NOT NULL, CHECK (1-100) | 财运评分 |
| `love_score` | `smallint` | NOT NULL, CHECK (1-100) | 感情评分 |
| `health_score` | `smallint` | NOT NULL, CHECK (1-100) | 健康评分 |
| `lucky_color` | `text` | NOT NULL | 幸运色 |
| `lucky_number` | `smallint` | NOT NULL | 幸运数字 |
| `analysis` | `text` | NOT NULL | AI分析结果 |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | 创建时间 |

**约束：**
- `daily_hexagrams_visitor_id_date_key` — (visitor_id, date) 唯一，每人每天一卦

**索引：**
- `daily_hexagrams_pkey` — 主键
- `idx_daily_hexagrams_visitor_date` — (visitor_id, date) 复合索引

**RLS 策略：**
- `daily_hexagrams_select` — 允许 SELECT（Phase 1，应用层过滤）
- `daily_hexagrams_insert` — 允许 INSERT

**Phase 2 升级计划（V8.0）：**
- 增加 `user_id` 字段，关联 auth.users
- 策略改为 `auth.uid() = user_id`
- visitor_id 作为匿名用户标识保留

**参考文件：** `supabase/migrations/20260619112905_create_daily_hexagrams_table.sql`

---

### 2.3 divinations（六爻解卦记录表）

**表说明：** 记录用户六爻占卜的完整数据，包括本卦、变卦、AI分析。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK, gen_random_uuid() | 主键 |
| `visitor_id` | `text` | NOT NULL | 访客标识 |
| `question` | `text` | NOT NULL, DEFAULT '' | 占卜问题 |
| `category` | `text` | NOT NULL, DEFAULT 'general' | 分类：事业/财运/感情/健康等 |
| `hexagram_id` | `uuid` | NOT NULL, FK → hexagrams(id) | 本卦ID |
| `hexagram_number` | `smallint` | NOT NULL | 本卦卦序 |
| `changed_hexagram_id` | `uuid` | FK → hexagrams(id) | 变卦ID（无变卦为null） |
| `changed_hexagram_number` | `smallint` | | 变卦卦序 |
| `raw_lines` | `text[6]` | NOT NULL | 原始六爻：'老阳'/'少阳'/'老阴'/'少阴' |
| `changing_lines` | `integer[]` | NOT NULL, DEFAULT '{}' | 变爻位置 1-6，无变爻为空 |
| `ai_analysis` | `text` | | AI分析结果 |
| `analysis_status` | `text` | NOT NULL, DEFAULT 'pending' | 分析状态：pending/completed/failed |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | 创建时间 |

**枚举值：**

`category` 可选值：
- `general` — 综合
- `career` — 事业
- `wealth` — 财运
- `love` — 感情
- `health` — 健康
- `study` — 学业
- `other` — 其他

`analysis_status` 可选值：
- `pending` — 待分析
- `processing` — 分析中
- `completed` — 已完成
- `failed` — 失败

**索引：**
- `divinations_pkey` — 主键
- `idx_divinations_visitor` — (visitor_id, created_at DESC) 复合索引

**RLS 策略：**
- `divinations_select` — 允许 SELECT
- `divinations_insert` — 允许 INSERT

**参考文件：** `supabase/migrations/20260619164507_create_divinations_table.sql`

---

### 2.4 fengshui_reports（风水勘测报告表）

**表说明：** 风水勘测报告，支持免费基础版和付费高级版。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK, gen_random_uuid() | 主键 |
| `visitor_id` | `text` | NOT NULL | 访客标识 |
| `image_url` | `text` | | 房间照片URL |
| `room_type` | `text` | NOT NULL | 空间类型：卧室/客厅/书房/厨房/办公室等 |
| `basic_score` | `smallint` | | 基础评分（免费） |
| `basic_analysis` | `jsonb` | | 基础分析结果（免费） |
| `premium_report` | `jsonb` | | 高级报告（付费） |
| `payment_status` | `text` | NOT NULL, DEFAULT 'free' | 支付状态 |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT now() | 创建时间 |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT now() | 更新时间 |

**枚举值：**

`room_type` 可选值：
- `bedroom` — 卧室
- `living_room` — 客厅
- `study` — 书房
- `kitchen` — 厨房
- `bathroom` — 卫生间
- `office` — 办公室
- `balcony` — 阳台
- `other` — 其他

`payment_status` 可选值：
- `free` — 免费
- `pending` — 待支付
- `paid` — 已支付
- `refunded` — 已退款

**JSON 结构：**

`basic_analysis` 结构：
```json
{
  "overallScore": 75,
  "layoutAnalysis": "...",
  "advantages": ["...", "..."],
  "attention": ["...", "..."],
  "suggestions": ["...", "..."]
}
```

`premium_report` 结构：
```json
{
  "detailedScore": {
    "qiFlow": 70,
    "layout": 75,
    "color": 80,
    "furniture": 65
  },
  "baguaAnalysis": { "...": "..." },
  "flyingStars": { "...": "..." },
  "remedies": ["...", "..."],
  "detailedSuggestions": ["...", "..."]
}
```

**索引：**
- `fengshui_reports_pkey` — 主键
- `idx_fengshui_reports_visitor` — (visitor_id, created_at DESC) 复合索引

**RLS 策略：**
- `fs_reports_select` — 允许 SELECT
- `fs_reports_insert` — 允许 INSERT
- `fs_reports_update` — 允许 UPDATE

**参考文件：** `supabase/migrations/20260621044157_create_fengshui_reports_table.sql`

---

## 三、表关系图

```
┌─────────────────┐
│    hexagrams     │  ←  六十四卦主表（只读）
│  (64 条记录)    │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────┐        ┌───────────────────────┐
│ daily_hexagrams │        │     divinations       │
│  每日卦运记录   │        │     六爻占卜记录       │
└─────────────────┘        └───────────┬───────────┘
                                       │
                                       │
                              ┌────────▼──────────┐
                              │  hexagrams (本卦)  │
                              │  hexagrams (变卦)  │
                              └───────────────────┘

┌───────────────────────┐
│   fengshui_reports    │  ←  风水报告（独立）
└───────────────────────┘
```

**关系说明：**

| 主表 | 从表 | 关系 | 外键 |
|------|------|------|------|
| hexagrams | daily_hexagrams | 1:N | hexagram_id |
| hexagrams | divinations (本卦) | 1:N | hexagram_id |
| hexagrams | divinations (变卦) | 1:N | changed_hexagram_id |

---

## 四、索引清单

| 索引名 | 表名 | 字段 | 类型 | 用途 |
|--------|------|------|------|------|
| `hexagrams_pkey` | hexagrams | id | 主键 | 主键索引 |
| `hexagrams_number_key` | hexagrams | number | UNIQUE | 卦序查询 |
| `daily_hexagrams_pkey` | daily_hexagrams | id | 主键 | 主键索引 |
| `daily_hexagrams_visitor_id_date_key` | daily_hexagrams | (visitor_id, date) | UNIQUE | 每人每天一卦 |
| `idx_daily_hexagrams_visitor_date` | daily_hexagrams | (visitor_id, date) | BTREE | 访客历史查询 |
| `divinations_pkey` | divinations | id | 主键 | 主键索引 |
| `idx_divinations_visitor` | divinations | (visitor_id, created_at DESC) | BTREE | 访客历史查询 |
| `fengshui_reports_pkey` | fengshui_reports | id | 主键 | 主键索引 |
| `idx_fengshui_reports_visitor` | fengshui_reports | (visitor_id, created_at DESC) | BTREE | 访客历史查询 |

---

## 五、RLS 策略清单

| 策略名 | 表名 | 类型 | 条件 | 说明 |
|--------|------|------|------|------|
| `hexagrams_select_public` | hexagrams | SELECT | true | 公开只读 |
| `daily_hexagrams_select` | daily_hexagrams | SELECT | true | Phase 1 公开读 |
| `daily_hexagrams_insert` | daily_hexagrams | INSERT | true | Phase 1 公开写 |
| `divinations_select` | divinations | SELECT | true | Phase 1 公开读 |
| `divinations_insert` | divinations | INSERT | true | Phase 1 公开写 |
| `fs_reports_select` | fengshui_reports | SELECT | true | Phase 1 公开读 |
| `fs_reports_insert` | fengshui_reports | INSERT | true | Phase 1 公开写 |
| `fs_reports_update` | fengshui_reports | UPDATE | true | Phase 1 公开更新 |

> ⚠️ Phase 1 策略较为宽松，依赖应用层的 visitor_id 过滤。
> V8.0 引入用户系统后将收紧策略，使用 auth.uid() 做行级过滤。

---

## 六、枚举类型

### 6.1 当前使用的枚举（text字段+约束）

当前版本使用 text 字段 + CHECK约束/应用层校验。

**计划 V8.0 改为 PostgreSQL ENUM 类型：**

```sql
-- 计划创建的枚举类型
CREATE TYPE payment_status AS ENUM ('free', 'pending', 'paid', 'refunded');
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE membership_level AS ENUM ('free', 'vip', 'svip', 'lifetime');
CREATE type room_type AS ENUM ('bedroom', 'living_room', 'study', 'kitchen', 'bathroom', 'office', 'balcony', 'other');
```

---

## 七、Edge Functions

### 7.1 现有 Edge Function

| 名称 | 路径 | 说明 | 状态 |
|------|------|------|------|
| `analyze-room` | `supabase/functions/analyze-room/` | AI风水图像分析 | ✅ 已上线 |

详细说明见 API Specification。

---

## 八、Migration 清单

### 8.1 已执行 Migration

| 序号 | 文件名 | 日期 | 内容 |
|------|--------|------|------|
| 1 | `20260619112842_create_hexagrams_table.sql` | 2026-06-19 | 创建六十四卦表，插入64卦数据 |
| 2 | `20260619112905_create_daily_hexagrams_table.sql` | 2026-06-19 | 创建每日卦运表+索引+RLS |
| 3 | `20260619164507_create_divinations_table.sql` | 2026-06-19 | 创建六爻占卜表+索引+RLS |
| 4 | `20260621044157_create_fengshui_reports_table.sql` | 2026-06-21 | 创建风水报告表+索引+RLS |

### 8.2 Migration 命名规范

```
<YYYYMMDDHHMMSS>_<动作>_<表名>.sql
```

**动作前缀：**
- `create_` — 创建表
- `add_` — 加字段/索引
- `alter_` — 修改结构
- `drop_` — 删除
- `seed_` — 种子数据
- `index_` — 建索引

---

## 九、V8.0 规划新增表

### 用户系统相关（V8.0）

| 表名 | 说明 | 优先级 |
|------|------|--------|
| `auth.users` | Supabase 内置用户表 | P0 |
| `profiles` | 用户扩展资料 | P0 |
| `memberships` | 会员信息 | P0 |
| `orders` | 订单表 | P0 |
| `payments` | 支付记录 | P0 |
| `coupons` | 优惠券 | P1 |
| `points_log` | 积分记录 | P1 |
| `user_points` | 用户积分 | P1 |

### 内容系统相关（V9.5）

| 表名 | 说明 | 优先级 |
|------|------|--------|
| `courses` | 课程 | P0 |
| `lessons` | 课时 | P0 |
| `articles` | 文章 | P1 |
| `teachers` | 讲师 | P1 |
| `exams` | 考试 | P2 |
| `certifications` | 认证 | P2 |

### 商城系统相关（V10.0）

| 表名 | 说明 | 优先级 |
|------|------|--------|
| `products` | 商品 | P0 |
| `product_categories` | 商品分类 | P0 |
| `orders` | 订单（复用） | P0 |
| `order_items` | 订单明细 | P0 |
| `inventory` | 库存 | P1 |

### 社交系统相关（V9.0）

| 表名 | 说明 | 优先级 |
|------|------|--------|
| `user_profiles` | 用户资料（扩展） | P0 |
| `matches` | 匹配记录 | P0 |
| `compatibility_reports` | 合盘报告 | P0 |
| `follows` | 关注关系 | P1 |
| `posts` | 动态 | P1 |
| `comments` | 评论 | P2 |
| `messages` | 私信 | P2 |

### 规则与AI管理（V8.0）

| 表名 | 说明 | 优先级 |
|------|------|--------|
| `rule_versions` | 规则版本 | P0 |
| `prompt_versions` | Prompt版本 | P0 |
| `ai_call_logs` | AI调用日志 | P0 |
| `admin_logs` | 管理员操作日志 | P1 |

---

## 十、Repository 调用规范

> 详见《架构宪章》第四原则：Repository模式。

### 标准分层

```
Page → Service → Repository → Supabase
```

### 现有 Repository 层

> ⚠️ 当前尚未建立完整的 Repository 层，组件直接调用 Supabase。
> 计划 V8.0 完成 Repository 层重构。

### Repository 接口规范

```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>
  findAll(filter?: Filter): Promise<T[]>
  create(data: Partial<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
  count(filter?: Filter): Promise<number>
}
```

---

## 附录

### A. 数据库设计原则

1. **优先使用 UUID** 作为主键，保护业务数据安全
2. **启用 RLS** 所有业务表，最小权限原则
3. **软删除优先** 使用 deleted_at，保留数据痕迹
4. **时间戳统一** created_at / updated_at
5. **索引不过度** 只建必要索引，写性能优先
6. **外键约束** 保证数据一致性
7. **JSONB 存储** 灵活结构用 jsonb，便于扩展
8. **分区表** 大表（日志、历史）按月分区

### B. 性能优化原则

1. **热点查询** 必须有索引
2. **大表分页** 使用游标分页，不用 OFFSET
3. **缓存策略** 热点数据 Redis 缓存
4. **读写分离** 读操作走只读副本（V8.5）
5. **连接池** 合理配置连接池大小

### C. 安全原则

1. **RLS 必须启用** 所有业务表
2. **敏感字段加密** 手机号、身份证等
3. **操作日志** 所有数据变更有日志
4. **定期备份** 每日全量 + 实时 WAL
5. **SQL注入防护** 使用参数化查询（Supabase自动处理）

---

> 本文档为数据库唯一标准，每次结构变更必须同步更新。
> 修改流程：Migration → Data Dictionary → Project Status 三者必须一致。
