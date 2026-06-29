# 玄风门 Project Status

> 最后更新：2026-06-29 | 版本：**V7.0** | 维护者：玄风门开发组
>
> 🎯 **V7.0 里程碑**：十大核心文档体系建设完成，正式进入**产品开发模式**。
>
> 后续工作重点：**把算法做到行业领先，把产品做到真正可以商业化上线。**
> 文档作为辅助工具，始终服务于代码和产品，而不是成为开发负担。

---

## 📚 十大核心文档体系

玄风门十大核心文档（所有开发的唯一标准）：

| # | 文档 | 定位 | 给谁看 | 状态 |
|---|------|------|--------|------|
| 01 | **Project Status**（本文） | 当前开发状态 | 全体 | ✅ |
| 02 | [Architecture Constitution](./玄风门-架构宪章.md) | 最高开发原则（10大原则） | 全体 | ✅ |
| 03 | [Engineering Handbook](./玄风门-Engineering-Handbook.md) | 工程开发规范 | 开发 | ✅ |
| 04 | [Master PRD](./玄风门-Master-PRD.md) | 产品需求总文档 | 产品/开发 | ✅ |
| 05 | Version Roadmap | 长期版本规划（见第13章） | 全体 | ✅ |
| 06 | [Algorithm Whitepaper](./玄风门-Algorithm-Whitepaper.md) | 算法白皮书（核心知识资产） | 算法/产品 | ✅ 🏆 |
| 07 | [Rule Specification](./玄风门-Rule-Specification.md) | 规则唯一来源 | 算法/开发 | ✅ |
| 08 | [Data Dictionary](./玄风门-Data-Dictionary.md) | 数据库唯一标准 | 开发/DBA | ✅ |
| 09 | [API Specification](./玄风门-API-Specification.md) | 接口唯一标准 | 前后端 | ✅ |
| 10 | [Admin Handbook](./玄风门-Admin-Handbook.md) | 后台运营手册 | 运营 | ✅ |

> ⚠️ 所有开发必须先读文档，再写代码。文档永远先于代码。
>
> 🏆 **Algorithm Whitepaper 为玄风门最高价值知识资产，长期维护。**
>
> 📖 **各角色速查：**
> - 产品看 → Master PRD
> - 开发看 → Engineering Handbook
> - 算法看 → Algorithm Whitepaper + Rule Specification
> - 数据库看 → Data Dictionary
> - 接口看 → API Specification
> - 运营看 → Admin Handbook
> - 项目状态看 → Project Status
> - 开发原则看 → Architecture Constitution
> - 长期规划看 → Version Roadmap

---

## 文档维护机制

### 一、十大核心文档冻结

除非重大架构升级，否则**不新增新的长期文档**。

以后所有开发，都只维护现有十大文档。

文档数量保持稳定。

### 二、文档随代码同步更新

以后**每一次开发完成，都必须同步更新相关文档**。

| 开发内容 | 需同步更新的文档 |
|---------|----------------|
| 新增 Rule | Rule Specification + Algorithm Whitepaper + Project Status |
| 新增数据库表/字段 | Data Dictionary + Project Status |
| 新增 API | API Specification |
| 新增页面/功能 | Master PRD + Project Status |
| 架构调整 | Architecture Constitution |
| 工程规范调整 | Engineering Handbook |
| 版本发布 | Version Roadmap + Project Status |

> ⚠️ 任何代码提交，不允许文档落后于代码。
>
> 提交 PR 前自查：相关文档是否已同步更新？

### 三、Project Status 作为唯一开发入口

以后每次开始开发时：

**第一步：阅读 Project Status**

确认：
- 当前版本
- 开发阶段
- 待完成任务
- 下一阶段目标

所有开发均以 **Project Status 为准**。

---

## 开发总原则

```
算法精度 > 产品体验 > 商业系统 > 安全架构 > 性能优化 > 生态扩展
```

> 所有开发均围绕此路线推进，避免后期重复重构。
>
> 完整架构原则详见：[玄风门-架构宪章.md](./玄风门-架构宪章.md)（10大原则）

---

## 1. 项目概况

| 项目 | 内容 |
|------|------|
| 当前版本 | V7.0 |
| 整体完成度 | ~65% |
| 当前阶段 | **产品开发模式**（文档体系冻结，重点转向算法与产品） |
| 正在开发 | 商业级八字算法、格局系统、喜用神系统、AI推导链 |
| 下一阶段 | **V7.5**：风水专业算法 + 用户系统 |
| 技术栈 | React 18 + TypeScript 严格模式 + Vite + Supabase |
| AI服务 | Gemini / OpenAI / Supabase Edge Functions（多Provider fallback） |
| 节气精度 | qimendunjia-standalone（天文级精度） |
| 验证规模 | 100,000 组随机测试（1900-2100年）|

**当前核心差距：**
- 格局精度 ~60%（外格、破格条件待完善）
- 喜用神精度 ~55%（权重未校准）
- 旺衰体系 ~80%（合化冲克刑害未实现）
- 十神组合 ~60%（只有8种，需扩展到20+）
- 大运流年 ~30%（框架有，动态分析未实现）
- AI推导链 ~10%（未输出规则命中详情）
- 商业可信度体系 ~30%（各模块独立，未整合）

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

## 10. 开发优先级（V7.0 重新定义）

> V7.0 起，开发重点从文档建设转向**算法产品化**。
>
> 所有开发严格按照以下优先级执行，禁止跳级。

### P0 — 必须完成（核心竞争力）

**商业级命理算法 + Rule 扩充**

1. **格局系统**
   - 正格完整（八格）
   - 外格系统（飞天禄马、六乙鼠贵、壬骑龙背等）
   - 破格条件完整实现
   - 格局层次判断（成格/半成/不成）
   - 格局与喜用神深度联动

2. **喜用神系统**
   - 调候权重校准（穷通宝鉴体系）
   - 病药判断细化
   - 通关逻辑完善
   - 多因素权重校准（基于大量命例）

3. **旺衰系统**
   - 地支六合/三合/三会
   - 天干五合
   - 六冲/三刑/六害
   - 合化冲克刑害对旺衰的影响计算

4. **大运流年**
   - 大运与原局作用关系
   - 大运对旺衰/格局/喜用神的动态调整
   - 流年与大运关系
   - 流月推算

5. **AI 推导链**
   - 每个结论都有规则命中详情
   - 规则冲突解决过程透明
   - 评分来源可追溯
   - 最终为什么是这个结果
   - Confidence 可信度体系

### P1 — 高优先级（商业系统）

**后台 + 会员 + 支付 + Admin**

6. **用户系统**
   - Supabase Auth 接入
   - 手机号 / 微信登录
   - RLS 策略收紧
   - 用户数据迁移

7. **会员系统**
   - 会员等级（月卡/年卡/终身）
   - 权益配置
   - 订阅管理
   - 到期提醒

8. **支付系统**
   - 微信支付 / 支付宝
   - 苹果内购
   - 订单管理
   - 退款流程

9. **Admin 后台**
   - 用户管理
   - 会员管理
   - 订单管理
   - 内容管理
   - 统计报表
   - 权限管理

### P2 — 中优先级（基础设施）

**安全 + 监控 + 缓存 + 日志 + 权限 + CI/CD**

10. **安全体系**
    - XSS/CSRF 防护
    - SQL注入防护
    - 敏感数据加密
    - 安全审计

11. **监控告警**
    - 错误监控
    - 性能监控
    - AI调用监控
    - 业务指标监控
    - 告警通知

12. **缓存体系**
    - 计算结果缓存
    - AI响应缓存
    - Redis/Supabase缓存
    - 缓存策略

13. **日志系统**
    - 前端错误日志
    - 后端服务日志
    - AI调用日志
    - 操作审计日志

14. **CI/CD**
    - 自动化测试
    - 自动化部署
    - 预发布环境
    - 灰度发布

### P3 — 低优先级（生态扩展）

**缘分 + 学院 + 商城 + 社区 + 开放平台**

15. **缘分合盘**
    - 八字合婚
    - 配对分析
    - 缘分指数

16. **命理学院**
    - 课程系统
    - 讲师系统
    - 考试认证
    - 学习社区

17. **风水商城**
    - 商品系统
    - 订单系统
    - 库存管理
    - 物流追踪

18. **社区系统**
    - 用户发帖
    - 话题讨论
    - 大师问答
    - 内容审核

19. **开放平台**
    - API 开放
    - 开发者文档
    - 应用管理
    - 计费系统

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

## 13. 版本路线图

### 路线总览

```
V6.9 (当前) ─── V7.0 ─── V7.5 ─── V8.0 ─── V8.5 ─── V9.0 ─── V9.5 ─── V10.0
   │           │        │        │        │        │        │        │
   ▼           ▼        ▼        ▼        ▼        ▼        ▼        ▼
 基础框架   命理引擎  风水专业  商业系统  基础设施  缘分社交  学院内容  完整生态
 (~65%)    (~90%)   (核心2)  (商业化)  (企业级)  (社交)   (内容)   (平台)
```

### 核心目标

| 版本 | 主题 | 完成度目标 | 核心产出 |
|------|------|-----------|---------|
| V6.9 | 基础框架 | 65% | 规则引擎 + 100000组验证 |
| **V7.0** | **商业级命理引擎** | **90%** | **玄风命理核心竞争力** |
| V7.5 | 风水专业化 | 核心2 | 玄空飞星 + 八宅 |
| V8.0 | 商业系统 | 商业化 | 用户 + 支付 + Admin |
| V8.5 | 基础设施升级 | 企业级 | Repository + 缓存 + 监控 |
| V9.0 | 缘分社交 | 社交 | 合盘 + 匹配 + 动态 |
| V9.5 | 学院内容 | 内容生态 | 课程 + 直播 + 知识库 |
| V10.0 | 完整生态 | 平台 | 商城 + 开放API + 企业版 |

---

### V7.0 商业级命理引擎（最高优先级）

> **目标：** 打造业内商业级八字分析系统，使玄风命理成为核心竞争力。

#### 一、格局系统深化

| 项目 | 当前 | 目标 | 优先级 |
|------|------|------|--------|
| 正格完善 | 框架有 | 典籍校对 | P0 |
| 变格体系 | 部分 | 完整 | P0 |
| 外格系统 | 无 | 新增 | P0 |
| 飞天禄马格 | 无 | 新增 | P0 |
| 六乙鼠贵格 | 无 | 新增 | P0 |
| 壬骑龙背格 | 无 | 新增 | P0 |
| 破格条件 | 不完整 | 完整 | P0 |
| 格局层次 | 无 | 成格/半成/破格 | P1 |
| 格局喜用联动 | 基础 | 深度联动 | P1 |

#### 二、喜用神优化

建立真正多因素计算模型：

| 因素 | 当前状态 | 目标 |
|------|---------|------|
| 调候 | 框架有 | 穷通宝鉴体系校准 |
| 扶抑 | 基础 | 权重精细化 |
| 病药 | 框架有 | 判断细化 |
| 通关 | 基础 | 逻辑完善 |
| 从格 | 框架有 | 条件完善 |
| 化气 | 框架有 | 化气成功率 |
| 寒暖燥湿 | 框架有 | 权重校准 |
| **权重体系** | 未校准 | 基于大量命例校准 |

#### 三、旺衰体系完善

增加完整的地支关系计算：

| 关系 | 天干 | 地支 | 状态 | 优先级 |
|------|------|------|------|--------|
| 天干五合 | ✅ | - | 框架有 | P1 |
| 地支六合 | - | ✅ | 待实现 | P0 |
| 三合局 | - | ✅ | 待实现 | P0 |
| 三会局 | - | ✅ | 待实现 | P1 |
| 六冲 | - | ✅ | 待实现 | P0 |
| 三刑 | - | ✅ | 待实现 | P1 |
| 六害 | - | ✅ | 待实现 | P1 |
| 穿害 | - | ✅ | 待实现 | P2 |
| 合化成功率 | - | - | 待实现 | P1 |
| **旺衰动态计算** | - | - | 框架有 | P0 |

#### 四、十神系统升级

扩展至 20+ 组合：

| 组合 | 当前 | 目标 | 优先级 |
|------|------|------|--------|
| 食神制杀 | ✅ | 完善 | P0 |
| 杀印相生 | ✅ | 完善 | P0 |
| 伤官见官 | ❌ | 新增 | P0 |
| 枭神夺食 | ❌ | 新增 | P0 |
| 财滋杀 | ❌ | 新增 | P1 |
| 官印相生 | ✅ | 完善 | P0 |
| 财官双美 | ✅ | 完善 | P1 |
| 印绶护身 | ❌ | 新增 | P1 |
| 伤官配印 | ✅ | 完善 | P0 |
| 食伤生财 | ✅ | 完善 | P1 |
| 比劫夺财 | ✅ | 完善 | P1 |
| 羊刃驾杀 | ✅ | 完善 | P1 |
| 财党破印 | ❌ | 新增 | P2 |
| 官杀混杂 | ❌ | 新增 | P1 |
| 身杀两停 | ❌ | 新增 | P1 |
| 弃命从杀 | ❌ | 新增 | P1 |
| **组合评分** | 基础 | 完整 | P0 |

#### 五、大运流年

| 模块 | 当前 | 目标 | 优先级 |
|------|------|------|--------|
| 起运计算 | ✅ | 完善 | P0 |
| 十年大运 | ❌ | 新增 | P0 |
| 流年 | ❌ | 新增 | P0 |
| 流月 | ❌ | 新增 | P1 |
| 原局互动 | ❌ | 新增 | P0 |
| 运势变化趋势 | ❌ | 新增 | P1 |

#### 六、AI推导链

所有分析必须可解释：

```typescript
interface AnalysisResult {
  conclusion: string          // 最终结论
  confidence: number          // 可信度 0-100
  matchedRules: string[]      // 命中的规则
  matchedRuleDetails: {       // 规则详情
    ruleId: string
    ruleName: string
    priority: number
    weight: number
    matched: boolean
  }[]
  conflicts: string[]         // 冲突规则
  conflictResolution: string   // 冲突解决说明
  derivationProcess: string   // 推导过程
  weightSources: {            // 权重来源
    factor: string
    weight: number
    reason: string
  }[]
  finalBasis: string           // 最终判断依据
}
```

#### 七、Confidence可信度体系

统一接口：

```typescript
interface ConfidenceResult {
  overall: number                           // 整体可信度
  moduleScores: {                           // 各模块可信度
    geju: number
    xiyong: number
    wangshuai: number
    shishen: number
    shensha: number
  }
  matchedRules: string[]                     // 命中的规则
  conflicts: {                              // 冲突
    rule1: string
    rule2: string
    resolution: string
  }[]
  coverage: {                               // 覆盖度
    checkedFactors: number
    totalFactors: number
  }
}
```

#### V7.0 完成目标

| 指标 | 目标 |
|------|------|
| 八字模块完成度 | 90%+ |
| 规则总数 | 400+ |
| 格局数量 | 50+ |
| 十神组合 | 20+ |
| AI推导链 | 完整输出 |
| 可信度体系 | 商业级 |
| 验证准确率 | 99%+ |

---

### V7.5 风水专业化

> **目标：** 从AI识图升级为真正专业风水分析系统。

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 八宅风水 | 东西四命、游星飞布 | P0 |
| 九宫飞星 | 年月日时飞星 | P0 |
| 玄空飞星 | 元运飞星盘 | P0 |
| 流年飞星 | 每年飞星变化 | P1 |
| 房屋坐向 | 罗盘定位 | P0 |
| 罗盘定位 | 指南针集成 | P0 |
| 户型分析 | AI图像+风水 | P0 |
| 阳宅评分 | 量化评分体系 | P1 |
| 调理方案 | 具体可操作 | P0 |
| 多空间联动 | 各空间关系 | P2 |

**核心产出：** 玄风风水第二条核心产品线

---

### V8.0 商业系统

| 模块 | 功能 | 优先级 |
|------|------|--------|
| Supabase Auth | 认证底座 | P0 |
| 微信登录 | 社交登录 | P0 |
| 手机登录 | 验证码登录 | P0 |
| Apple/Google | 国际登录 | P1 |
| VIP会员 | 权限控制 | P0 |
| 免费/付费报告 | 分层服务 | P0 |
| 积分系统 | 运营激励 | P1 |
| 会员等级 | 成长体系 | P1 |
| 微信支付 | 国内支付 | P0 |
| 支付宝 | 国内支付 | P0 |
| Stripe | 国际支付 | P1 |
| Admin后台 | 运营管理 | P0 |
| 用户管理 | 运营 | P0 |
| 订单管理 | 运营 | P0 |
| 会员管理 | 运营 | P0 |
| 报告管理 | 运营 | P1 |
| Prompt管理 | 运营 | P1 |
| AI配置 | 运营 | P1 |
| 内容管理 | 运营 | P1 |
| 统计分析 | 运营 | P1 |

---

### V8.5 基础设施升级

| 模块 | 功能 | 优先级 |
|------|------|--------|
| Repository层 | 数据抽象 | P0 |
| Service层 | 业务封装 | P0 |
| Zustand | 全局状态 | P0 |
| Redis缓存 | 高频访问 | P1 |
| CDN | 静态资源 | P1 |
| 图片优化 | 性能 | P2 |
| Edge Cache | API缓存 | P1 |
| Error Boundary | 错误处理 | P1 |
| 日志中心 | 运维 | P0 |
| API监控 | 运维 | P0 |
| 崩溃报警 | 运维 | P1 |
| 性能监控 | 运维 | P1 |
| CI/CD | 自动化 | P1 |
| Docker部署 | 容器化 | P1 |
| 数据库备份 | 数据安全 | P1 |
| 自动恢复 | 容灾 | P2 |

---

### V9.0 玄风缘分

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 情侣合盘 | 八字合盘分析 | P0 |
| 夫妻合盘 | 婚姻合盘 | P0 |
| 八字契合度 | 量化匹配 | P0 |
| 每日匹配 | 缘分推荐 | P1 |
| 缘分推荐 | AI匹配 | P1 |
| 聊天系统 | 即时通讯 | P2 |
| 喜欢/关注 | 社交互动 | P2 |
| 动态 | 内容发布 | P2 |
| 评论/分享 | 互动 | P2 |

---

### V9.5 玄风学院

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 命理课程 | 系统学习 | P0 |
| 直播系统 | 互动教学 | P1 |
| 视频课程 | 点播 | P0 |
| 文章系统 | 图文内容 | P1 |
| AI老师 | 智能问答 | P1 |
| 学习系统 | 进度追踪 | P2 |
| 考试认证 | 能力验证 | P2 |
| 成长记录 | 数据沉淀 | P2 |
| 知识库 | 内容沉淀 | P1 |

---

### V10.0 完整生态

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 商城系统 | 商品交易 | P0 |
| 咨询预约 | 预约大师 | P0 |
| 命理师入驻 | 服务提供 | P0 |
| 风水师入驻 | 服务提供 | P0 |
| 大师认证 | 能力背书 | P1 |
| 积分商城 | 积分消耗 | P1 |
| 推广系统 | 裂变增长 | P1 |
| 邀请奖励 | 用户激励 | P1 |
| 社区系统 | 用户交流 | P2 |
| 开放API | 开发者生态 | P2 |
| 插件系统 | 扩展机制 | P2 |
| 企业版 | B端市场 | P2 |

---

### 安全体系（贯穿所有版本）

> 安全不再放到最后，而是每个版本同步建设。

#### 权限安全

| 版本 | 措施 |
|------|------|
| V8.0 | Supabase Auth + JWT |
| V8.5 | RLS策略收紧 + RBAC权限模型 |

#### 数据安全

| 版本 | 措施 |
|------|------|
| V8.0 | 基础操作日志 |
| V8.5 | 数据库备份 + 加密存储 + 敏感信息脱敏 |

#### API安全

| 版本 | 措施 |
|------|------|
| V8.0 | Rate Limit + Token校验 |
| V8.5 | 防刷机制 + 文件上传校验 |

#### 前端安全

| 版本 | 措施 |
|------|------|
| V8.0 | Error Boundary + 输入校验 |
| V8.5 | XSS防护 + CSRF防护 + CSP策略 |

#### 运维安全

| 版本 | 措施 |
|------|------|
| V8.0 | 日志中心 + API监控 |
| V8.5 | 崩溃报警 + 性能监控 + 自动恢复 + 健康检查 |

---

## 14. 四大核心产品定位

> 玄风门不是一个普通命理网站，而是完整的AI玄学平台。

```
                    ┌─────────────────────────┐
                    │       玄风门            │
                    │    AI玄学平台          │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  ① 玄风命理  │     │  ② 玄风风水  │     │  ③ 玄风缘分  │
│               │     │               │     │               │
│ • 八字排盘    │     │ • AI风水勘测  │     │ • 八字合盘    │
│ • 六爻占卜    │     │ • 玄空飞星    │     │ • 每日匹配    │
│ • 每日运势    │     │ • 八宅风水    │     │ • 缘分推荐    │
│ • AI智能解读  │     │ • 罗盘定位    │     │ • 社交互动    │
│               │     │ • 调理方案    │     │               │
│  V7.0 核心   │     │  V7.5 核心    │     │  V9.0 核心   │
└───────────────┘     └───────────────┘     └───────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │     玄风学院          │
                    │     内容生态          │
                    │                       │
                    │ • 命理课程            │
                    │ • 直播教学            │
                    │ • AI老师              │
                    │ • 知识库              │
                    │                       │
                    │    V9.5 内容核心     │
                    └───────────────────────┘

                    ┌───────────────────────┐
                    │   玄风商城            │
                    │   商业生态            │
                    │                       │
                    │ • 命理师入驻          │
                    │ • 咨询预约            │
                    │ • 积分商城            │
                    │ • 开放API             │
                    │                       │
                    │   V10.0 平台核心     │
                    └───────────────────────┘
```

---

## 15. 技术架构优化路线

### 目标架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │  Pages  │  │   Hooks │  │ Zustand │  │ Design  │     │
│  └────┬────┘  └────┬────┘  └────┬────┘  └─────────┘     │
│       │             │             │                       │
│       └─────────────┼─────────────┘                       │
│                     ▼                                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                   Service 层                         │  │
│  │  BaziService / FengShuiService / UserService        │  │
│  └─────────────────────┬───────────────────────────────┘  │
│                        ▼                                    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                Repository 层                         │  │
│  │  HexagramRepo / BaziRepo / UserRepo                 │  │
│  └─────────────────────┬───────────────────────────────┘  │
│                        ▼                                    │
│              ┌─────────────────┐                          │
│              │    Supabase     │                          │
│              └────────┬────────┘                          │
└───────────────────────┼────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  Edge Functions │  ← 八字算法（核心保护）
              └─────────────────┘
```

### 优先级

| 阶段 | 重构内容 | 版本 |
|------|---------|------|
| V7.0 | calculator职责瘦身 | 短期 |
| V7.0 | 统一分析结果结构 | 短期 |
| V8.0 | Repository层 | 中期 |
| V8.0 | Service层 | 中期 |
| V8.0 | Zustand状态管理 | 中期 |
| V8.5 | Error Boundary | 中期 |
| V8.5 | 完善测试体系 | 长期 |

---

> 本文档每次开发完成后更新，保持与代码同步。
> 下一次更新：V7.0 商业级命理引擎开发完成后。
