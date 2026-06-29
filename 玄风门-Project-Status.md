# 玄风门 Project Status

> 最后更新：2026-06-29 | 版本：V6.9 | 维护者：玄风门开发组

---

## 1. 项目概况

| 项目 | 内容 |
|------|------|
| 当前版本 | V6.9 |
| 整体完成度 | ~65% |
| 当前阶段 | 算法深度优化阶段（规则引擎驱动 + 商业级精度） |
| 正在开发 | 格局精度深化、喜用神精度优化、十神力量与组合 |
| 下一阶段 | V7.0：大运流年动态分析 + AI完整推导链输出 + 商业可信度体系 |
| 技术栈 | React 18 + TypeScript 严格模式 + Vite + Supabase |
| AI服务 | Gemini / OpenAI / Supabase Edge Functions（多Provider fallback） |
| 节气精度 | qimendunjia-standalone（天文级精度） |
| 验证规模 | 100,000 组随机测试（1900-2100年）|

---

## 2. 已完成功能

### 2.1 基础功能

| 模块 | 状态 | 说明 |
|------|------|------|
| 首页 | ✅ 完成 | 功能入口导航 + 产品介绍 |
| 每日卦运 | ✅ 完成 | 每日一卦 + 五维运势 + AI解读 |
| 六爻占卜 | ✅ 完成 | 起卦 + 变卦 + AI解卦 + 历史记录 |
| 八字排盘 | ✅ 完成 | 四柱排盘 + 十神 + 十二长生 + 旺衰 |
| 八字历史 | ✅ 完成 | 历史排盘记录查看 |
| 风水勘测 | ✅ 完成 | 图片上传 + AI图像识别 + 免费报告 |
| 高级报告 | ⚠️ 框架完成 | 付费深度报告页面（支付未接） |
| 历史记录 | ✅ 完成 | 占卜/风水记录总览 |
| 分析页 | ⚠️ 框架完成 | 综合分析结果页 |

### 2.2 八字算法模块

| 子模块 | 文件 | 状态 | 说明 |
|--------|------|------|------|
| 四柱排盘 | [calculator.ts](file:///workspace/src/lib/bazi/calculator.ts) | ✅ 100% | 年/月/日/时 四柱，10万组验证100%通过 |
| 纳音 | [nayin.ts](file:///workspace/src/lib/bazi/nayin.ts) | ✅ 100% | 60甲子纳音 |
| 十二长生 | [changsheng.ts](file:///workspace/src/lib/bazi/changsheng.ts) | ✅ 100% | 规则引擎驱动，10条规则 |
| 十神基础 | [shishen.ts](file:///workspace/src/lib/bazi/shishen.ts) | ✅ 100% | 规则引擎驱动，100条基础规则 |
| 十神组合 | [shishenRules.ts](file:///workspace/src/lib/bazi/rules/shishenRules.ts) | ⚠️ 60% | 8种组合（食神制杀/杀印相生等），需扩展 |
| 十神力量 | [shishenRules.ts](file:///workspace/src/lib/bazi/rules/shishenRules.ts) | ✅ 完成 | 透干/藏干/总力量评分 |
| 旺衰评分 | [wuxing.ts](file:///workspace/src/lib/bazi/wuxing.ts) | ✅ 80% | strengthScore 0-100 + 五等级，合化冲克待完善 |
| 格局体系 | [geju.ts](file:///workspace/src/lib/bazi/geju.ts) | ⚠️ 60% | 30条规则（正格/从格/专旺/化气/调候/病药等），精度待深化 |
| 喜用神 | [xiyongshen.ts](file:///workspace/src/lib/bazi/xiyongshen.ts) | ⚠️ 55% | 26条规则加权合并，权重需校准 |
| 大运框架 | [dashunRules.ts](file:///workspace/src/lib/bazi/rules/dashunRules.ts) | ⚠️ 30% | 起运计算 + 顺逆判断，动态分析未实现 |
| 神煞模块 | [shensha/](file:///workspace/src/lib/bazi/shensha) | ✅ 完成 | 9个独立模块（桃花/红鸾/天乙/文昌/羊刃/空亡/劫煞/华盖/驿马） |
| 节气引擎 | [solarTerms.ts](file:///workspace/src/lib/bazi/solarTerms.ts) | ✅ 100% | qimendunjia-standalone 天文级精度 |

### 2.3 规则引擎

| 组件 | 文件 | Rule数 | 状态 |
|------|------|--------|------|
| 核心引擎 | [engine.ts](file:///workspace/src/lib/bazi/rules/engine.ts) | - | ✅ 完成 |
| 格局规则 | [gejuRules.ts](file:///workspace/src/lib/bazi/rules/gejuRules.ts) | 30 | ✅ 框架完成 |
| 喜用神规则 | [xiyongRules.ts](file:///workspace/src/lib/bazi/rules/xiyongRules.ts) | 26 | ✅ 框架完成 |
| 旺衰规则 | [wuxingRules.ts](file:///workspace/src/lib/bazi/rules/wuxingRules.ts) | 13 | ✅ 框架完成 |
| 十神规则 | [shishenRules.ts](file:///workspace/src/lib/bazi/rules/shishenRules.ts) | 108 | ✅ 框架完成 |
| 十二长生规则 | [changshengRules.ts](file:///workspace/src/lib/bazi/rules/changshengRules.ts) | 10 | ✅ 完成 |
| 大运规则 | [dashunRules.ts](file:///workspace/src/lib/bazi/rules/dashunRules.ts) | 4 | ⚠️ 基础完成 |
| 六亲规则 | [liuqinRules.ts](file:///workspace/src/lib/bazi/rules/liuqinRules.ts) | - | ⚠️ 占位 |

**Rule 总数：191 条**

---

## 3. 正在开发

| 功能 | 进度 | 负责人 | 预计完成 |
|------|------|--------|---------|
| 格局精度深化 | 40% | - | - |
| ├── 外格系统（飞天禄马/六乙鼠贵等） | 0% | - | - |
| ├── 破格条件完善 | 30% | - | - |
| ├── 格局层次判断 | 0% | - | - |
| └── 格局与喜用神联动 | 50% | - | - |
| 喜用神精度优化 | 35% | - | - |
| ├── 调候权重校准 | 40% | - | - |
| ├── 病药判断细化 | 30% | - | - |
| ├── 通关逻辑完善 | 20% | - | - |
| └── 多因素权重校准 | 0% | - | - |
| 旺衰合化冲克刑害 | 15% | - | - |
| 十神组合扩展 | 30% | - | - |
| AI推导链输出 | 10% | - | - |

---

## 4. 数据库结构

### 4.1 数据表总览

```
Supabase PostgreSQL
├── hexagrams            — 六十四卦主数据表（静态，64条）
├── daily_hexagrams      — 用户每日卦运记录表
├── divinations          — 六爻解卦记录表
└── fengshui_reports     — 风水勘测报告表
```

### 4.2 hexagrams — 六十四卦主数据表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| number | smallint | 卦序 1-64（UNIQUE） |
| name | text | 卦名 |
| symbol | text | Unicode 卦符（䷀–䷿） |
| upper_trigram | text | 上卦名 |
| lower_trigram | text | 下卦名 |
| lines | text[6] | 六爻，index 0=初爻(底), 5=上爻(顶) |
| description | text | 卦辞 |
| fortune | text | 总运 |
| career | text | 事业 |
| wealth | text | 财运 |
| love | text | 感情 |
| health | text | 健康 |
| advice_do | text[] | 宜 |
| advice_dont | text[] | 忌 |
| created_at | timestamptz | 创建时间 |

**RLS策略：** 公开只读（`hexagrams_select_public`）

### 4.3 daily_hexagrams — 每日卦运记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| visitor_id | text | 访客ID（localStorage UUID） |
| date | date | 日期 |
| hexagram_id | uuid FK → hexagrams | 卦ID |
| hexagram_number | smallint | 卦序 |
| score | smallint | 综合分 1-100 |
| career_score | smallint | 事业分 1-100 |
| wealth_score | smallint | 财运分 1-100 |
| love_score | smallint | 感情分 1-100 |
| health_score | smallint | 健康分 1-100 |
| lucky_color | text | 幸运色 |
| lucky_number | smallint | 幸运数字 |
| analysis | text | 分析内容 |
| created_at | timestamptz | 创建时间 |

**约束：** UNIQUE(visitor_id, date) — 每人每日一条
**索引：** idx_daily_hexagrams_visitor_date
**RLS策略：** 公开读写（应用层基于 visitor_id 过滤）

### 4.4 divinations — 六爻解卦记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| visitor_id | text | 访客ID |
| question | text | 所问之事 |
| category | text | 问卦类别（general/career/wealth/love等） |
| hexagram_id | uuid FK → hexagrams | 本卦ID |
| hexagram_number | smallint | 本卦卦序 |
| changed_hexagram_id | uuid FK → hexagrams | 变卦ID（可空） |
| changed_hexagram_number | smallint | 变卦卦序（可空） |
| raw_lines | text[6] | 六爻原始状态（老阳/少阳/老阴/少阴） |
| changing_lines | integer[] | 变爻位置 1-6 |
| ai_analysis | text | AI分析结果 |
| analysis_status | text | 分析状态（pending/completed/failed） |
| created_at | timestamptz | 创建时间 |

**索引：** idx_divinations_visitor (visitor_id, created_at DESC)
**RLS策略：** 公开读写

### 4.5 fengshui_reports — 风水勘测报告表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | 主键 |
| visitor_id | text | 访客ID |
| image_url | text | 图片URL（可空） |
| room_type | text | 空间类型（客厅/卧室/厨房等） |
| basic_score | smallint | 基础评分 |
| basic_analysis | jsonb | 基础分析结果 |
| premium_report | jsonb | 付费深度报告 |
| payment_status | text | 支付状态（free/paid） |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

**索引：** idx_fengshui_reports_visitor (visitor_id, created_at DESC)
**RLS策略：** 公开读写

### 4.6 表关系图

```
hexagrams (主表，64条静态数据)
    ↑ FK
    ├── daily_hexagrams.hexagram_id
    ├── divinations.hexagram_id
    └── divinations.changed_hexagram_id

（无用户表，Phase 1 使用 visitor_id 软归属）
```

---

## 5. Edge Functions

### 5.1 函数列表

| 名称 | 路径 | 功能 | 状态 |
|------|------|------|------|
| analyze-room | [supabase/functions/analyze-room/](file:///workspace/supabase/functions/analyze-room) | 房间照片AI风水分析 | ✅ 完成 |

### 5.2 analyze-room 详细说明

**文件：** [index.ts](file:///workspace/supabase/functions/analyze-room/index.ts)

**功能：**
- 调用 Gemini Vision API 分析上传的房间照片
- 自动检测空间类型、识别物品
- 输出风水评分、问题列表、调理建议
- 3次重试机制（503时）
- 健壮的 JSON 解析（多重 fallback）

**调用关系：**
```
前端 FengShui 页面
  → Supabase Edge Function (analyze-room)
    → Gemini Vision API (生成分析)
    → 返回结构化 JSON
```

**输入：**
```json
{
  "image": "base64图片数据",
  "roomType": "客厅"
}
```

**输出：**
```json
{
  "detectedRoomType": "客厅",
  "detectedObjects": ["沙发", "电视", "茶几"],
  "roomMatch": true,
  "score": 75,
  "summary": "...",
  "issues": [
    { "id": "issue_1", "severity": "high", "title": "...", ... }
  ]
}
```

**环境变量：** `GEMINI_API_KEY`

---

## 6. 页面结构

| # | 页面名称 | 路径 | 组件 | 功能 | 状态 |
|---|---------|------|------|------|------|
| 1 | 首页 | `/` | [Home.tsx](file:///workspace/src/pages/Home.tsx) | 功能入口导航 + 产品介绍 | ✅ |
| 2 | 每日卦运 | `/daily` | [Daily.tsx](file:///workspace/src/pages/Daily.tsx) | 每日一卦 + 五维运势 + AI解读 | ✅ |
| 3 | 六爻占卜 | `/liuyao` | [Divination.tsx](file:///workspace/src/pages/Divination.tsx) | 起卦 + 变卦 + AI解卦 | ✅ |
| 4 | 八字排盘输入 | `/bazi` | [BaziInput.tsx](file:///workspace/src/pages/BaziInput.tsx) | 出生信息输入表单 | ✅ |
| 5 | 八字排盘结果 | `/bazi/chart` | [BaziChart.tsx](file:///workspace/src/pages/BaziChart.tsx) | 四柱排盘展示 | ✅ |
| 6 | 八字历史 | `/bazi/history` | [BaziHistory.tsx](file:///workspace/src/pages/BaziHistory.tsx) | 历史排盘记录 | ✅ |
| 7 | 风水勘测 | `/fengshui` | [FengShui.tsx](file:///workspace/src/pages/FengShui.tsx) | 图片上传 + AI分析报告 | ✅ |
| 8 | 综合分析 | `/analysis` | [Analysis.tsx](file:///workspace/src/pages/Analysis.tsx) | 综合分析结果页 | ⚠️ |
| 9 | 高级报告 | `/premium-report` | [PremiumReport.tsx](file:///workspace/src/pages/PremiumReport.tsx) | 付费深度报告页 | ⚠️ |
| 10 | 历史记录 | `/records` | [History.tsx](file:///workspace/src/pages/History.tsx) | 占卜/风水总览 | ✅ |
| 11 | 即将上线 | - | [ComingSoon.tsx](file:///workspace/src/pages/ComingSoon.tsx) | 占位页 | ✅ |

**页面总数：** 11 个  
**已完成：** 8 个（73%）  
**框架完成待完善：** 3 个

---

## 7. 公共组件

### 7.1 UI 基础组件（11个）

| 组件 | 文件 | 用途 | 状态 |
|------|------|------|------|
| Badge | [ui/Badge/](file:///workspace/src/components/ui/Badge) | 徽标标签 | ✅ |
| Button | [ui/Button/](file:///workspace/src/components/ui/Button) | 按钮 | ✅ |
| Card | [ui/Card/](file:///workspace/src/components/ui/Card) | 卡片容器 | ✅ |
| Divider | [ui/Divider/](file:///workspace/src/components/ui/Divider) | 分割线 | ✅ |
| Loading | [ui/Loading/](file:///workspace/src/components/ui/Loading) | 加载指示器 | ✅ |
| Modal | [ui/Modal/](file:///workspace/src/components/ui/Modal) | 弹窗 | ✅ |
| PageTitle | [ui/PageTitle/](file:///workspace/src/components/ui/PageTitle) | 页面标题 | ✅ |
| Section | [ui/Section/](file:///workspace/src/components/ui/Section) | 区块容器 | ✅ |
| Skeleton | [ui/Skeleton/](file:///workspace/src/components/ui/Skeleton) | 骨架屏 | ✅ |
| Tag | [ui/Tag/](file:///workspace/src/components/ui/Tag) | 标签 | ✅ |

### 7.2 业务组件（13个）

| 组件 | 文件 | 用途 | 状态 |
|------|------|------|------|
| Bagua | [business/Bagua/](file:///workspace/src/components/business/Bagua) | 八卦图 | ✅ |
| Compass | [business/Compass/](file:///workspace/src/components/business/Compass) | 罗盘 | ✅ |
| FeatureCard | [business/FeatureCard/](file:///workspace/src/components/business/FeatureCard) | 功能卡片 | ✅ |
| HexagramCard | [business/HexagramCard/](file:///workspace/src/components/business/HexagramCard) | 卦象卡片 | ✅ |
| ImageUploader | [business/ImageUploader/](file:///workspace/src/components/business/ImageUploader) | 图片上传 | ✅ |
| PageBanner | [business/PageBanner/](file:///workspace/src/components/business/PageBanner) | 页面横幅 | ✅ |
| ResultCard | [business/ResultCard/](file:///workspace/src/components/business/ResultCard) | 结果卡片 | ✅ |
| RoomSelector | [business/RoomSelector/](file:///workspace/src/components/business/RoomSelector) | 空间选择器 | ✅ |
| ScoreBar | [business/ScoreBar/](file:///workspace/src/components/business/ScoreBar) | 分数条 | ✅ |
| ScoreRing | [business/ScoreRing/](file:///workspace/src/components/business/ScoreRing) | 环形分数 | ✅ |
| ShareCard | [business/ShareCard/](file:///workspace/src/components/business/ShareCard) | 分享卡片 | ✅ |
| Taiji | [business/Taiji/](file:///workspace/src/components/business/Taiji) | 太极图 | ✅ |

### 7.3 布局组件

| 组件 | 文件 | 用途 | 状态 |
|------|------|------|------|
| Header | [Header.tsx](file:///workspace/src/components/Header.tsx) | 顶部导航 | ✅ |
| Footer | [Footer.tsx](file:///workspace/src/components/Footer.tsx) | 底部信息 | ✅ |

**组件总数：** 26 个  
**完成率：** 100%

---

## 8. Prompt 系统

### 8.1 Prompt 总览

| 类别 | 数量 | 文件 |
|------|------|------|
| 八字命理 | 1 | [bazi.ts](file:///workspace/src/services/ai/prompts/bazi.ts) |
| 风水勘测 | 1 | [fengshui.ts](file:///workspace/src/services/ai/prompts/fengshui.ts) |
| 每日卦运 | 1 | [daily.ts](file:///workspace/src/services/ai/prompts/daily.ts) |
| 六爻占卜 | 1 | [divination.ts](file:///workspace/src/services/ai/prompts/divination.ts) |

**Prompt 总数：** 4 个

### 8.2 各 Prompt 详情

#### 8.2.1 八字命理 — `bazi.basic`

- **状态：** ⚠️ 预留，未实际使用
- **模型：** gemini-2.0-pro
- **温度：** 0.6
- **输出：** JSON（overall/personality/career/wealth/relationship/health/wuxingAdvice/summary）
- **需优化：**
  - 目前算法层直接输出，未接入AI深度解读
  - 需增加格局、喜用神、大运等专业分析维度
  - 需要更专业的子平法术语体系

#### 8.2.2 风水勘测 — `fengshui.room`

- **状态：** ✅ 完成（文字版）
- **模型：** gemini-2.0-flash
- **温度：** 0.6
- **输出：** 结构化报告（宅气总评/格局分析/优势/注意/调理建议）
- **需优化：**
  - 图像分析在 Edge Function 中完成，此Prompt是文字版
  - 需增加玄空飞星、八宅明镜等专业理论支持

#### 8.2.3 每日卦运 — `daily.interpretation`

- **状态：** ✅ 完成
- **模型：** gemini-2.0-flash
- **温度：** 0.7
- **输出：** 今日卦义 + 五维运势（整体/事业/财运/感情/健康） + 宜忌 + 趋吉避凶
- **需优化：**
  - 可增加与用户八字的联动
  - 可增加节气深度分析

#### 8.2.4 六爻占卜 — `divination.analyze`

- **状态：** ✅ 完成
- **模型：** gemini-2.0-flash
- **温度：** 0.7
- **输出：** 卦义总览 + 整体格局 + 运势走向 + 调理建议
- **需优化：**
  - 增加变爻逐条解读
  - 增加六亲生克、旺衰判断
  - 增加应期判断

### 8.3 AI 服务架构

```
AIService (单例)
├── Providers
│   ├── SupabaseEdgeProvider  — 默认
│   ├── GeminiProvider         — Fallback 1
│   └── OpenAIProvider         — Fallback 2
├── Prompts
│   ├── bazi.basic
│   ├── fengshui.room
│   ├── daily.interpretation
│   └── divination.analyze
└── 特性
    ├── 多 Provider Fallback
    ├── Prompt 模板渲染（Handlebars 风格）
    ├── AI 缓存
    └── JSON 解析修复
```

核心文件：
- [AIService.ts](file:///workspace/src/services/ai/AIService.ts) — 服务主类
- [types.ts](file:///workspace/src/services/ai/types.ts) — 类型定义
- [aiCache.ts](file:///workspace/src/utils/aiCache.ts) — 缓存工具
- [aiJson.ts](file:///workspace/src/utils/aiJson.ts) — JSON解析修复

---

## 9. 已知问题（TODO）

### 9.1 Bug

| # | 问题 | 模块 | 严重度 | 状态 |
|---|------|------|--------|------|
| 1 | verify-all.ts 中3个年柱测试用例基于旧算法 | 测试 | P3 | 已知，测试数据问题 |
| 2 | verify-all.ts 中1个月柱测试用例基于旧算法 | 测试 | P3 | 已知，测试数据问题 |
| 3 | verify-all.ts 中旺衰测试用例与日主旺衰概念不同 | 测试 | P3 | 已知，测试用例问题 |

### 9.2 待优化项

| # | 项目 | 模块 | 优先级 |
|---|------|------|--------|
| 1 | 格局条件太粗略，需典籍校对 | 格局 | P0 |
| 2 | 破格条件不完整 | 格局 | P0 |
| 3 | 喜用神权重未校准 | 喜用神 | P0 |
| 4 | 合化冲克刑害未实现 | 旺衰 | P1 |
| 5 | 十神组合只有8种，需扩展到20+ | 十神 | P1 |
| 6 | 大运流年动态分析未实现 | 大运 | P0 |
| 7 | AI推导链未输出 | AI | P0 |
| 8 | 整体confidence体系未建立 | 全局 | P1 |
| 9 | 神煞未整合进分析结果 | 神煞 | P2 |
| 10 | 六亲系统未实现 | 六亲 | P2 |

### 9.3 技术债

| # | 项目 | 说明 | 优先级 |
|---|------|------|--------|
| 1 | 缺少用户系统 | Phase 1 只有 visitor_id，需接入 Supabase Auth | P1 |
| 2 | RLS策略过于宽松 | 所有表都是公开读写，需用户系统后收紧 | P1 |
| 3 | AI缓存未持久化 | 目前是内存缓存，刷新页面即丢失 | P2 |
| 4 | 缺少错误监控 | 前端错误 / API错误未上报 | P2 |
| 5 | 缺少性能监控 | 首屏加载 / API响应时间未监控 | P3 |
| 6 | 单元测试覆盖不足 | 只有算法验证测试，缺少UI测试 | P2 |
| 7 | 国际化未实现 | 目前只有中文 | P3 |
| 8 | 深色模式未实现 | 设计系统有基础，未整合 | P3 |

---

## 10. 下一步开发计划

### P0 — 最高优先级（核心竞争力）

1. **格局精度深度化**
   - 完善外格系统（飞天禄马、六乙鼠贵、壬骑龙背等）
   - 破格条件完整实现
   - 格局层次判断（成格/半成/不成）
   - 格局与喜用神深度联动

2. **喜用神精度优化**
   - 调候权重校准（穷通宝鉴体系）
   - 病药判断细化
   - 通关逻辑完善
   - 多因素权重校准（基于大量命例）

3. **大运流年动态分析**
   - 大运与原局作用关系
   - 大运对旺衰/格局/喜用神的动态调整
   - 流年与大运关系
   - 流月推算

4. **AI完整推导链输出**
   - 每个结论都有规则命中详情
   - 规则冲突解决过程透明
   - 评分来源可追溯
   - 最终为什么是这个结果

### P1 — 高优先级

5. **旺衰合化冲克刑害**
   - 地支六合/三合/三会
   - 天干五合
   - 六冲/三刑/六害
   - 对旺衰的影响计算

6. **十神组合扩展**
   - 从8种扩展到20+种
   - 伤官见官、枭神夺食、印绶遇财等
   - 组合强度评分
   - 组合与格局联动

7. **用户系统**
   - Supabase Auth 接入
   - 手机号 / 微信登录
   - RLS 策略收紧
   - 用户数据迁移

8. **商业可信度体系**
   - 各模块 confidence 整合
   - 规则命中/冲突/覆盖统计
   - 最终结果可信度评分

### P2 — 中优先级

9. **神煞应用整合**
    - 神煞在分析中的实际含义
    - 不同位置神煞的区别
    - 神煞与格局十神的关系

10. **六亲系统**
    - 十神对应六亲
    - 六亲旺衰判断
    - 六亲关系分析

11. **测试体系完善**
    - UI组件单元测试
    - E2E 测试
    - 性能测试
    - 专业软件对标测试

### P3 — 低优先级

12. **国际化**
    - 英文支持
    - 繁体中文支持

13. **深色模式**
    - 设计系统整合
    - 自动切换

14. **性能优化**
    - 首屏加载优化
    - 代码分割
    - 图片优化

---

## 11. 项目目录结构

```
/workspace
├── src/
│   ├── components/                    # 公共组件
│   │   ├── ui/                        # UI基础组件（11个）
│   │   │   ├── Badge/
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Divider/
│   │   │   ├── Loading/
│   │   │   ├── Modal/
│   │   │   ├── PageTitle/
│   │   │   ├── Section/
│   │   │   ├── Skeleton/
│   │   │   └── Tag/
│   │   ├── business/                  # 业务组件（13个）
│   │   │   ├── Bagua/                 # 八卦图
│   │   │   ├── Compass/               # 罗盘
│   │   │   ├── FeatureCard/           # 功能卡片
│   │   │   ├── HexagramCard/          # 卦象卡片
│   │   │   ├── ImageUploader/         # 图片上传
│   │   │   ├── PageBanner/            # 页面横幅
│   │   │   ├── ResultCard/            # 结果卡片
│   │   │   ├── RoomSelector/          # 空间选择器
│   │   │   ├── ScoreBar/              # 分数条
│   │   │   ├── ScoreRing/             # 环形分数
│   │   │   ├── ShareCard/             # 分享卡片
│   │   │   └── Taiji/                 # 太极图
│   │   ├── Header.tsx                 # 顶部导航
│   │   └── Footer.tsx                 # 底部信息
│   │
│   ├── pages/                         # 页面（11个）
│   │   ├── Home.tsx                   # 首页
│   │   ├── Daily.tsx                  # 每日卦运
│   │   ├── Divination.tsx             # 六爻占卜
│   │   ├── BaziInput.tsx              # 八字排盘输入
│   │   ├── BaziChart.tsx              # 八字排盘结果
│   │   ├── BaziHistory.tsx            # 八字历史
│   │   ├── FengShui.tsx               # 风水勘测
│   │   ├── Analysis.tsx               # 综合分析
│   │   ├── PremiumReport.tsx          # 高级报告
│   │   ├── History.tsx                # 历史记录
│   │   └── ComingSoon.tsx             # 即将上线
│   │
│   ├── lib/                           # 核心算法库
│   │   ├── bazi/                      # 八字算法
│   │   │   ├── rules/                 # 规则引擎
│   │   │   │   ├── engine.ts          # 规则引擎核心
│   │   │   │   ├── gejuRules.ts       # 格局规则（30条）
│   │   │   │   ├── xiyongRules.ts     # 喜用神规则（26条）
│   │   │   │   ├── wuxingRules.ts     # 旺衰规则（13条）
│   │   │   │   ├── shishenRules.ts    # 十神规则（108条）
│   │   │   │   ├── changshengRules.ts # 长生规则（10条）
│   │   │   │   ├── dashunRules.ts     # 大运规则（4条）
│   │   │   │   └── liuqinRules.ts     # 六亲规则（占位）
│   │   │   ├── shensha/               # 神煞模块（9个）
│   │   │   │   ├── taohua.ts          # 桃花
│   │   │   │   ├── hongluan.ts        # 红鸾天喜
│   │   │   │   ├── tianyi.ts          # 天乙贵人
│   │   │   │   ├── wenchang.ts        # 文昌贵人
│   │   │   │   ├── yangren.ts         # 羊刃
│   │   │   │   ├── kongwang.ts        # 空亡
│   │   │   │   ├── jiesha.ts          # 劫煞
│   │   │   │   ├── huagai.ts          # 华盖
│   │   │   │   └── yima.ts            # 驿马
│   │   │   ├── calculator.ts          # 排盘调度器
│   │   │   ├── geju.ts                # 格局入口
│   │   │   ├── xiyongshen.ts          # 喜用神入口
│   │   │   ├── wuxing.ts              # 旺衰入口
│   │   │   ├── shishen.ts             # 十神入口
│   │   │   ├── changsheng.ts          # 十二长生入口
│   │   │   ├── nayin.ts               # 纳音
│   │   │   ├── solarTerms.ts          # 节气引擎
│   │   │   └── types.ts               # 类型定义
│   │   ├── hexagram.ts                # 六十四卦
│   │   ├── divination.ts              # 六爻占卜
│   │   └── supabase.ts                # Supabase客户端
│   │
│   ├── services/                      # 服务层
│   │   └── ai/                        # AI服务
│   │       ├── AIService.ts           # AI服务主类
│   │       ├── types.ts               # 类型定义
│   │       ├── prompts/               # Prompt库
│   │       │   ├── bazi.ts            # 八字Prompt
│   │       │   ├── fengshui.ts        # 风水Prompt
│   │       │   ├── daily.ts           # 每日卦运Prompt
│   │       │   └── divination.ts      # 六爻Prompt
│   │       └── providers/             # AI Provider
│   │           ├── base.ts            # 基类
│   │           ├── gemini.ts          # Gemini
│   │           ├── openai.ts          # OpenAI
│   │           └── supabase-edge.ts   # Supabase Edge
│   │
│   ├── hooks/                         # 自定义Hooks
│   │   ├── useAIAnalysis.ts           # AI分析
│   │   ├── useBazi.ts                 # 八字
│   │   └── useDailyHexagram.ts        # 每日卦运
│   │
│   ├── design/                        # 设计系统
│   │   ├── colors.ts                  # 颜色
│   │   ├── typography.ts              # 字体
│   │   ├── spacing.ts                 # 间距
│   │   ├── radius.ts                  # 圆角
│   │   ├── shadow.ts                  # 阴影
│   │   ├── motion.ts                  # 动画
│   │   └── theme.ts                   # 主题
│   │
│   ├── utils/                         # 工具函数
│   │   ├── aiCache.ts                 # AI缓存
│   │   └── aiJson.ts                  # AI JSON解析修复
│   │
│   ├── constants/                     # 常量
│   │   └── defaultAnalysis.ts         # 默认分析数据
│   │
│   ├── App.tsx                        # 应用根组件
│   ├── main.tsx                       # 入口文件
│   └── vite-env.d.ts                  # Vite类型声明
│
├── supabase/                          # Supabase配置
│   ├── functions/                     # Edge Functions
│   │   └── analyze-room/              # 房间分析函数
│   │       └── index.ts
│   └── migrations/                    # 数据库迁移
│       ├── 20260619_create_hexagrams_table.sql
│       ├── 20260619_create_daily_hexagrams_table.sql
│       ├── 20260619_create_divinations_table.sql
│       └── 20260621_create_fengshui_reports_table.sql
│
├── scripts/                           # 脚本
│   └── bazi-tests/                    # 八字测试
│       ├── verify-all.ts              # 综合验证
│       ├── verify-random-100k.ts      # 10万组随机验证
│       ├── sample-5.ts                # 5样本演示
│       ├── accuracy.json              # 验证结果
│       └── coverage.html              # 可视化报告
│
├── public/                            # 静态资源
├── dist/                              # 构建产物
├── index.html                         # HTML入口
├── package.json                       # 依赖配置
├── tsconfig.json                      # TypeScript配置
├── vite.config.ts                     # Vite配置
└── README.md                          # 项目说明
```

---

## 12. 架构建议

### 12.1 当前架构存在的问题

1. **calculator.ts 职责边界模糊**
   - 既做排盘调度，又包含部分计算逻辑（五鼠遁、五虎遁）
   - 五行统计直接写在 calculator 里，应独立到 wuxing 模块
   - 不符合"calculator 只负责调度"的原则

2. **规则引擎使用不彻底**
   - 十二长生、十神的规则引擎更多是"形式上的"
   - 本质上还是查表，规则引擎的条件匹配、冲突解决、权重合并没有充分发挥
   - 真正需要规则引擎的地方（格局、喜用神）反而规则较粗略

3. **缺少统一的分析结果类型**
   - 各模块返回格式不统一
   - 缺少统一的 confidence / reasons / matchedRules 输出
   - AI推导链难以串联

4. **状态管理缺失**
   - 各页面各自维护状态
   - 八字结果在页面间传递靠 query 参数
   - 缺少全局状态管理（Zustand/Jotai/Redux）

5. **数据层耦合**
   - Supabase 直接在组件中调用
   - 缺少 Repository / Service 层抽象
   - 切换数据源成本高

6. **缺少错误边界**
   - 没有 React Error Boundary
   - AI 失败、网络错误的降级体验不完善

7. **测试金字塔倒置**
   - 算法验证测试很完善（100000组）
   - 但UI组件测试、集成测试几乎没有

### 12.2 重构建议

#### 短期（1-2周）

1. **统一分析结果接口**
   - 定义 `BaseAnalysisResult` 接口：{ confidence, reasons, matchedRules, conflicts }
   - 所有模块（格局/喜用神/旺衰/十神）都遵循此接口
   - 为 AI 推导链输出打基础

2. **calculator.ts 瘦身**
   - 五鼠遁、五虎遁移到独立的工具模块
   - 五行统计移到 wuxing 模块
   - calculator 只做模块编排和结果聚合

3. **引入状态管理**
   - 使用 Zustand（轻量）管理八字排盘结果
   - 页面间通过 store 共享数据
   - 避免 query 参数传复杂对象

#### 中期（1-2月）

4. **数据层抽象**
   - 建立 Repository 层：HexagramRepository / BaziHistoryRepository
   - Service 层封装业务逻辑
   - 组件只调用 Service，不直接碰 Supabase

5. **错误边界 + 降级策略**
   - 添加 React Error Boundary
   - AI 失败时显示本地算法结果
   - 网络错误友好提示 + 重试按钮

6. **完善测试体系**
   - 增加组件单元测试（Vitest + Testing Library）
   - 增加关键流程 E2E 测试（Playwright）
   - CI/CD 中接入测试

#### 长期（3-6月）

7. **规则引擎DSL化**
   - 规则从代码迁移到 JSON/YAML 配置
   - 支持热更新，不需要发版就能调整规则
   - 支持A/B测试不同规则版本

8. **插件化架构**
   - 格局/喜用神/神煞/大运 都做成可插拔插件
   - 不同流派（子平/滴天髓/穷通宝鉴）可切换
   - 第三方开发者可以扩展

9. **边缘计算迁移**
   - 八字算法迁移到 Edge Functions
   - 前端只做展示
   - 保护核心算法不泄露
   - 支持付费 API 模式

---

> 本文档每次开发完成后更新，保持与代码同步。  
> 下一次更新：V7.0 开发完成后。
