# BirthData Migration Plan

**日期**：2026-07-03  
**版本**：v2  
**状态**：Approved  
**目标**：统一全项目出生信息结构

---

## 一、现状分析

### 1.1 当前存在的出生信息结构

| 结构名称 | 定义位置 | 核心字段 |
|---------|---------|---------|
| **BirthInfo** | [types.ts](file:///workspace/src/lib/bazi/types.ts#L39-L46) | birthDate, birthTime, gender, timezone, region, solarTime |
| **Database Chart** | [database/types.ts](file:///workspace/src/lib/database/types.ts#L54-L73) | birth_date, birth_time, gender, birthplace, timezone, latitude, longitude, zishi_strategy, use_solar_time |
| **API Request Body** | [bazi.ts](file:///workspace/src/server/routes/bazi.ts#L41-L43) | use_solar_time?, longitude? |
| **Calculator Options** | [calculator.ts](file:///workspace/src/lib/bazi/calculator.ts#L233-L234) | useSolarTime?, longitude? |
| **Form** | [BaziInput.tsx](file:///workspace/src/pages/BaziInput.tsx#L22-L27) | 使用 BirthInfo |
| **Pipeline** | [pipeline/types.ts](file:///workspace/src/lib/bazi/pipeline/types.ts) | PipelineInput, PipelineContext, PipelineResult |

### 1.2 字段对比

| 字段 | BirthInfo | Database | API | Calculator | Pipeline | 问题 |
|------|----------|----------|-----|------------|----------|------|
| 日期 | birthDate: string | birth_date: string | ✅ | ✅ | ✅ | 格式不统一 |
| 时间 | birthTime: string | birth_time: string | ✅ | ✅ | ✅ | 格式不统一 |
| 性别 | gender: 'male'\|'female' | gender: Gender | ✅ | ✅ | ✅ | 类型定义不一致 |
| 时区 | timezone?: string | timezone: string \| null | ✅ | ✅ | ✅ | 命名不一致 |
| 经度 | ❌ | longitude: number \| null | ✅ | ✅（options） | ❌ | 缺失于 BirthInfo |
| 纬度 | ❌ | latitude: number \| null | ❌ | ❌ | ❌ | 缺失于 BirthInfo |
| 子时策略 | ❌ | zishi_strategy: ZiShiStrategy | ✅ | ✅（options） | ✅ | 缺失于 BirthInfo |
| 真太阳时开关 | solarTime?: boolean | use_solar_time: boolean | use_solar_time | useSolarTime | ✅ | **三个名字** |
| 城市/地区 | region?: string | birthplace: string \| null | ❌ | ✅（region） | ❌ | 命名不一致 |
| 时间未知 | ❌ | birth_time_unknown: boolean | ❌ | ❌ | ❌ | 缺失于 BirthInfo |

### 1.3 引用点统计

| 模块 | 文件 | 引用方式 | 数量 |
|------|------|---------|:----:|
| **Calculator** | [calculator.ts](file:///workspace/src/lib/bazi/calculator.ts#L10) | import BirthInfo, calculateBaZi(birthInfo, options) | 3 |
| **API Route** | [bazi.ts](file:///workspace/src/server/routes/bazi.ts#L24) | import BirthInfo, 构造 birthInfo | 6 |
| **UI - Chart** | [BaziChart.tsx](file:///workspace/src/pages/BaziChart.tsx#L7) | import BirthInfo, location.state | 2 |
| **UI - Input** | [BaziInput.tsx](file:///workspace/src/pages/BaziInput.tsx#L5) | import BirthInfo, 构造 | 3 |
| **Pipeline** | [index.ts](file:///workspace/src/lib/bazi/pipeline/index.ts#L19) | import BirthInfo | 2 |
| **Pipeline Types** | [types.ts](file:///workspace/src/lib/bazi/pipeline/types.ts#L5) | import BirthInfo | 2 |
| **Hook** | [useBazi.ts](file:///workspace/src/hooks/useBazi.ts#L2) | import BirthInfo, calculateChart(info) | 3 |
| **BaZiChart** | [types.ts](file:///workspace/src/lib/bazi/types.ts#L107) | 字段引用 | 1 |
| **总计** | | | **24** |

---

## 二、统一 BirthData 设计

### 2.1 最终结构

```typescript
// src/lib/core/types/birth.ts

export interface BirthData {
  /** 出生年月日（ISO 8601: YYYY-MM-DD） */
  birthday: string
  /** 出生时间（HH:mm:ss，如 08:30:00） */
  birthTime: string
  /** 性别 */
  gender: Gender
  /** 经度（东经为正，西经为负） */
  longitude?: number
  /** 纬度（北纬为正，南纬为负） */
  latitude?: number
  /** 时区（如 Asia/Shanghai） */
  timezone?: string
  /** 历法类型 */
  calendarType?: CalendarType
  /** 是否使用真太阳时 */
  useTrueSolarTime?: boolean
  /** 计算后的真太阳时（计算后填充） */
  trueSolarTime?: Date
  /** 子时策略 */
  childHourStrategy?: ZiShiStrategy
  /** 出生地名称（辅助，用于显示，不参与计算） */
  location?: string
  /** 时间是否未知 */
  birthTimeUnknown?: boolean
  /** BirthData Hash（计算后填充，用于缓存） */
  hash?: string
}
```

### 2.2 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| birthday | string | ✅ | ISO 8601 格式：YYYY-MM-DD |
| birthTime | string | ✅ | 时间格式：HH:mm:ss |
| gender | Gender | ✅ | 'male' \| 'female' |
| longitude | number | ❌ | 经度，优先使用 |
| latitude | number | ❌ | 纬度，优先使用 |
| timezone | string | ❌ | 默认 Asia/Shanghai |
| calendarType | CalendarType | ❌ | 默认 'solar' |
| useTrueSolarTime | boolean | ❌ | 默认 false |
| trueSolarTime | Date | ❌ | 计算后填充 |
| childHourStrategy | ZiShiStrategy | ❌ | 默认 'late' |
| location | string | ❌ | 城市名称，辅助显示 |
| birthTimeUnknown | boolean | ❌ | 默认 false |
| hash | string | ❌ | SHA256 哈希，缓存用 |

### 2.3 设计原则

1. **经纬度优先**：longitude/latitude 是主输入，location 仅作为辅助
2. **单一数据源**：全项目只有一套 BirthData
3. **Adapter 兼容**：通过 Adapter 转换旧接口，不直接替换
4. **计算后填充**：trueSolarTime 和 hash 在计算流程中填充
5. **Pipeline 优先**：BirthData 必须通过 Pipeline 进入系统

---

## 三、Adapter 设计

### 3.1 Adapter 架构

```
┌────────────────────────────────────────────────────────────────┐
│                      BirthData（唯一来源）                        │
└────────────────────────────────────────────────────────────────┘
                              ↑
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ BirthInfo     │    │ Chart Record  │    │ API Request   │
│   Adapter     │    │   Adapter     │    │   Adapter     │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   BirthInfo   │    │   Chart      │    │   API Body    │
│   (Deprecated)│    │  (Database)  │    │   (Request)   │
└───────────────┘    └───────────────┘    └───────────────┘
```

### 3.2 BirthInfoAdapter

```typescript
// src/lib/core/adapters/birthDataAdapter.ts

export class BirthInfoAdapter {
  static convert(info: BirthInfo): BirthData {
    return {
      birthday: info.birthDate,
      birthTime: info.birthTime,
      gender: info.gender,
      timezone: info.timezone,
      location: info.region,
      useTrueSolarTime: info.solarTime,
    }
  }
}
```

### 3.3 ChartAdapter

```typescript
export class ChartAdapter {
  static convert(chart: Chart): BirthData {
    return {
      birthday: chart.birth_date,
      birthTime: chart.birth_time,
      gender: chart.gender,
      location: chart.birthplace ?? undefined,
      timezone: chart.timezone ?? undefined,
      longitude: chart.longitude ?? undefined,
      latitude: chart.latitude ?? undefined,
      childHourStrategy: chart.zishi_strategy,
      useTrueSolarTime: chart.use_solar_time,
      birthTimeUnknown: chart.birth_time_unknown,
    }
  }
}
```

### 3.4 ApiRequestBodyAdapter

```typescript
export class ApiRequestBodyAdapter {
  static convert(body: BaziRequestBody): BirthData {
    return {
      birthday: body.birth_date,
      birthTime: body.birth_time,
      gender: body.gender,
      longitude: typeof body.longitude === 'number' ? body.longitude : undefined,
      useTrueSolarTime: typeof body.use_solar_time === 'boolean' ? body.use_solar_time : true,
      childHourStrategy: body.strategy ?? 'late',
    }
  }
}
```

---

## 四、Pipeline 集成

### 4.1 PipelineInput 结构

```typescript
// PipelineInput 使用 BirthData 作为唯一输入
export interface PipelineInput {
  birthData: BirthData
  options?: {
    includeAnalysis?: boolean
    includeAI?: boolean
    aiModel?: string
  }
}
```

### 4.2 PipelineContext 结构

```typescript
// PipelineContext 在流程中传递 BirthData
export interface PipelineContext {
  birthData: BirthData
  chart?: BaZiChart
  analysis?: AnalysisResult
  aiResult?: AIResult
  startTime: number
}
```

### 4.3 PipelineResult 结构

```typescript
// PipelineResult 包含原始 BirthData
export interface PipelineResult {
  success: boolean
  birthData: BirthData
  chart?: BaZiChart
  analysis?: AnalysisResult
  aiResult?: AIResult
  error?: string
  duration: number
}
```

### 4.4 Pipeline 数据流

```
BirthData
    ↓
runBaZiPipeline(input: PipelineInput)
    ↓
Step 1: 计算真太阳时（如果 useTrueSolarTime）
    ↓
Step 2: 排盘（Calculator）
    ↓
Step 3: 分析（Analyzer）
    ↓
Step 4: AI 报告（可选）
    ↓
PipelineResult（包含 BirthData）
```

---

## 五、迁移路线图

### 5.1 迁移步骤（修正版）

| 步骤 | 内容 | 影响范围 | 风险 |
|------|------|---------|------|
| **Step 1** | 完成所有引用统计（已完成） | 全项目 | Low |
| **Step 2** | 在 core/types/birth.ts 定义 BirthData | 新增文件 | Low |
| **Step 3** | 在 core/adapters/ 建立 Adapter（BirthInfoAdapter/ChartAdapter/ApiAdapter） | 新增文件 | Low |
| **Step 4** | 在 core/index.ts 导出 BirthData + Adapter | Core 模块 | Low |
| **Step 5** | Calculator 支持 BirthData（内部使用 Adapter 兼容旧接口） | calculator.ts | Medium |
| **Step 6** | Pipeline 使用 BirthData（PipelineInput/Context/Result） | pipeline/* | Medium |
| **Step 7** | API Route 使用 BirthData + ApiAdapter | server/routes/bazi.ts | Medium |
| **Step 8** | Hook 使用 BirthData | hooks/useBazi.ts | Medium |
| **Step 9** | UI 使用 BirthData | pages/BaziInput.tsx, BaziChart.tsx | Medium |
| **Step 10** | BirthInfo 标记 @deprecated | types.ts | Low |
| **Step 11** | 删除旧接口调用（Sprint C） | 全项目 | Medium |

### 5.2 迁移顺序

```
Step 1: 引用统计（已完成）
       ↓
Step 2: 定义 BirthData（Core）
       ↓
Step 3: 建立 Adapter（兼容层）
       ↓
Step 4: 导出 BirthData + Adapter
       ↓
Step 5: Calculator 支持 BirthData（核心）
       ↓
Step 6: Pipeline 使用 BirthData（唯一入口）
       ↓
Step 7: API Route 使用 BirthData
       ↓
Step 8: Hook 使用 BirthData
       ↓
Step 9: UI 使用 BirthData
       ↓
Step 10: BirthInfo @deprecated
       ↓
Step 11: 删除旧接口（Sprint C）
```

### 5.3 兼容性策略

```
过渡期（Sprint A → Sprint C）：

旧接口（BirthInfo）：
├── @deprecated 标记
├── 通过 BirthInfoAdapter 转换为 BirthData
├── 保留完整功能
└── 禁止新增调用

新接口（BirthData）：
├── 优先使用
├── 全量功能
└── 新增代码必须使用

Adapter：
├── BirthInfoAdapter（BirthInfo → BirthData）
├── ChartAdapter（Chart → BirthData）
├── ApiRequestBodyAdapter（API Body → BirthData）
└── 保证迁移期间不破坏现有业务

Sprint C 结束后：
└── 删除 BirthInfo + Adapter（Sprint D 清理）
```

---

## 六、字段映射

### 6.1 BirthInfo → BirthData

| 旧字段（BirthInfo） | 新字段（BirthData） | 转换规则 |
|-------------------|-------------------|---------|
| birthDate | birthday | 直接映射 |
| birthTime | birthTime | 直接映射 |
| gender | gender | 直接映射 |
| timezone | timezone | 直接映射 |
| region | location | 重命名 |
| solarTime | useTrueSolarTime | 重命名（布尔值相同） |
| ❌ | longitude | 默认 undefined |
| ❌ | latitude | 默认 undefined |
| ❌ | childHourStrategy | 默认 'late' |
| ❌ | calendarType | 默认 'solar' |
| ❌ | trueSolarTime | 计算后填充 |
| ❌ | birthTimeUnknown | 默认 false |
| ❌ | hash | 计算后填充 |

### 6.2 Database Chart → BirthData

| Database 字段 | BirthData 字段 | 转换规则 |
|--------------|--------------|---------|
| birth_date | birthday | 直接映射 |
| birth_time | birthTime | 直接映射 |
| gender | gender | 直接映射 |
| birthplace | location | 重命名 |
| timezone | timezone | 直接映射 |
| longitude | longitude | 直接映射 |
| latitude | latitude | 直接映射 |
| zishi_strategy | childHourStrategy | 重命名 |
| use_solar_time | useTrueSolarTime | 重命名 |
| birth_time_unknown | birthTimeUnknown | 直接映射 |

### 6.3 API → BirthData

| API 字段 | BirthData 字段 | 转换规则 |
|---------|--------------|---------|
| birth_date | birthday | 直接映射 |
| birth_time | birthTime | 直接映射 |
| gender | gender | 直接映射 |
| longitude | longitude | 直接映射 |
| use_solar_time | useTrueSolarTime | 重命名 |
| strategy | childHourStrategy | 重命名 |

---

## 七、迁移影响评估

### 7.1 模块影响

| 模块 | 改动量 | 风险等级 | 验证方式 |
|------|:-----:|:--------:|---------|
| Core | 新增文件 | Low | 编译通过 |
| Adapter | 新增文件 | Low | 编译通过 |
| Calculator | 修改参数 | Medium | 单元测试 |
| Pipeline | 修改参数 | Medium | 集成测试 |
| API Route | 修改请求处理 | Medium | API 测试 |
| Hook | 修改参数 | Medium | 集成测试 |
| UI | 修改表单和状态 | Medium | E2E 测试 |
| Database | 类型定义 | High | 数据库测试 |

### 7.2 风险清单

| 风险 | 等级 | 说明 | 缓解措施 |
|------|:----:|------|---------|
| Database 字段名变更 | High | birthplace → location | 双写过渡，逐步清理 |
| 真太阳时参数名不一致 | Medium | solarTime / useSolarTime / use_solar_time | 统一为 useTrueSolarTime |
| 子时策略参数名不一致 | Medium | ziShiStrategy / zishi_strategy / strategy | 统一为 childHourStrategy |
| 经纬度缺失于 BirthInfo | Medium | 旧数据可能没有经纬度 | Adapter 提供默认值 |
| UI 表单字段变更 | Medium | 用户输入字段调整 | 保持表单字段向后兼容 |
| Pipeline 成为唯一入口 | Medium | 现有直接调用需迁移 | 逐步迁移，禁止新增直接调用 |

---

## 八、验证计划

### 8.1 验证步骤

| 步骤 | 验证内容 | 工具 | 通过条件 |
|------|---------|------|---------|
| 1 | BirthData 定义正确 | tsc | 0 error |
| 2 | Adapter 转换正确 | vitest | Adapter 测试通过 |
| 3 | Calculator 支持 BirthData | vitest | 单元测试通过 |
| 4 | Pipeline 使用 BirthData | vitest | 集成测试通过 |
| 5 | 金标准命例验证 | vitest | GD-B001~B008 通过 |
| 6 | API 接口验证 | curl/postman | 响应正确 |
| 7 | UI 表单验证 | E2E | 表单提交成功 |
| 8 | Database 映射验证 | vitest | 类型兼容 |
| 9 | Hash 计算验证 | vitest | 相同输入相同 hash |

### 8.2 回归测试

必须运行的测试：
- `npx vitest run fourPillars`（四柱推算）
- `npx vitest run golden`（金标准命例）
- `npx vitest run p0SolarTerm`（节气质量门）

---

## 九、完成标准（DoD）

| # | 标准 | 验证方式 |
|---|------|---------|
| 1 | BirthData 在 core/types 定义 | `grep 'interface BirthData' src/lib/core/types/` |
| 2 | Adapter 在 core/adapters 定义 | `ls src/lib/core/adapters/` |
| 3 | core/index.ts 导出 BirthData + Adapter | `grep 'BirthData\|Adapter' src/lib/core/index.ts` |
| 4 | Calculator 支持 BirthData | calculateBaZi 参数包含 BirthData |
| 5 | Pipeline 使用 BirthData | runBaZiPipeline 参数为 PipelineInput<BirthData> |
| 6 | API Route 使用 BirthData | bazi.ts 导入 BirthData + ApiAdapter |
| 7 | Hook 使用 BirthData | useBazi.ts 导入 BirthData |
| 8 | UI 使用 BirthData | BaziInput.tsx 导入 BirthData |
| 9 | BirthInfo 标记 @deprecated | `grep '@deprecated' src/lib/bazi/types.ts` |
| 10 | Adapter 覆盖所有旧接口 | 三个 Adapter 都存在 |
| 11 | 全量测试通过 | `npx vitest run`（228/228） |
| 12 | 金标准命例通过 | `npx vitest run fourPillars` |

---

## 十、下一步

1. **开始执行 Step 2-10**
2. **每步验证后提交**
3. **完成后输出 Architecture Review A-02**
4. **进入 A-03 Calculator Pure Compute**

---

**文档版本**：v2  
**生效日期**：2026-07-03  
**状态**：Approved
