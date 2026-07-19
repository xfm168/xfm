# 玄风门V3.1 第三轮源码级审计报告（Part 3-6）

> 审计日期：2026-07-13
> 审计范围：pipeline.ts, report/index.ts, schools/index.ts, pdf/index.ts 及其依赖模块
> 审计方法：逐行读取源码，追踪执行路径，精确行号标注

---

## Part 3: Pipeline执行Trace

**源文件：** `/workspace/xuanfengmen1/src/lib/fengshui/v31/pipeline.ts`

### `runV31Pipeline` 函数完整执行流程

**函数签名：** L56-59
```typescript
export async function runV31Pipeline(
  input: PipelineInput,
  options: Partial<V31PipelineOptions> = {}
): Promise<V31PipelineOutput>
```

---

#### Step 0: 初始化（同步）
- **行号：** L60-62
- **类型：** 同步
- **操作：**
  - L60: `const opts = { ...DEFAULT_OPTIONS, ...options }` — 合并默认选项
  - L61: `const perf = new AnalysisPipelineV31()` — 创建性能追踪器
  - L62: `perf.beginPhase('total')` — 开始全局计时
- **输入：** `input`（调用方传入），`options`（可选配置）
- **输出：** `opts`（合并后选项），`perf`（性能追踪实例）

---

#### Step 1: 运行V3.0 Pipeline（await 异步）
- **行号：** L65-67
- **类型：** `await` 异步
- **操作：**
  - L65: `perf.beginPhase('v30_pipeline')`
  - L66: `const baseResult = await runFullPipeline(input)` — 调用 V3.0 全流程
  - L67: `perf.endPhase('v30_pipeline')`
- **输入变量：** `input`（PipelineInput，来自调用方）
- **输出变量：** `baseResult`（PipelineOutput 类型）
- **数据来源：** `runFullPipeline` 来自 `'../pipeline'`（V3.0模块），该函数内部执行图像识别、特征提取、空间分析、规则匹配等全部V3.0流程

---

#### Early Return 检查（同步）
- **行号：** L69-74
- **类型：** 同步
- **操作：**
  - L69: `const output: V31PipelineOutput = { ...baseResult, v31: undefined }`
  - L72-73: 如果 `baseResult.status === 'error' || !baseResult.report`，直接返回 `output`（此时 `output.v31` 为 `undefined`）
- **说明：** 此时 output 仅包含 V3.0 结果，V31 部分完全缺失

---

#### try-catch 外层（L76-L202）
- **行号：** L76 `try {`
- **行号：** L198 `} catch (err) {`
- **行号：** L200-201 `console.warn(...); return output`
- **作用域：** Step 2 ~ Step 8 全部包裹在此 try-catch 中。如果任何V3.1步骤异常，捕获后返回仅含V3.0结果的 output

---

#### Step 2: V3.1 规则匹配（同步）
- **行号：** L78-82
- **类型：** 同步
- **操作：**
  - L79: `const roomType = input.roomType || 'living'`
  - L80: `const detectedObjects = baseResult.visionResult?.detectedObjects?.map(o => o.type) || []`
  - L81: `const ruleMatches = matchRules(roomType, detectedObjects)`
- **输入变量：**
  - `input.roomType`（用户输入，默认 'living'）
  - `baseResult.visionResult?.detectedObjects`（V3.0 AI识别结果中的物体类型列表）
- **输出变量：** `ruleMatches`（RuleMatchResult[]）
- **数据来源：** `matchRules` 来自 `'./rules/registry'` L96-111
  - 该函数调用 `getRulesByRoom(roomType)` 按 roomType 过滤规则
  - 对每条规则，检查 `detectedObjects` 是否匹配 `rule.condition.target` 或 `rule.tags`
  - 匹配逻辑极简：关键词包含检测 + `condition.type === 'room_type'` 自动匹配

---

#### Step 3: 12维评分（同步，含内层 try-catch）
- **行号：** L85-103
- **类型：** 同步（`calculateScore12D` 是同步函数）
- **try-catch 内层：** L87 `try {`，L95 `} catch {`
- **操作：**
  - L88-94: 正常路径
    ```typescript
    score12D = calculateScore12D({
      features: baseResult.featureResult,
      spatial: baseResult.spatialResult,
      rooms: baseResult.roomResult,
      ruleResults: baseResult.ruleResult,
      userProvided: input.userInfo,
    })
    ```
  - L95-101: 降级路径（catch 分支）
    ```typescript
    if (baseResult.score8D) {
      score12D = legacyFrom8D(baseResult.score8D)
    } else {
      score12D = legacyFrom8D(baseResult.scoreResult as any)
    }
    ```
- **输入变量：** `baseResult.featureResult`, `baseResult.spatialResult`, `baseResult.roomResult`, `baseResult.ruleResult`, `input.userInfo`
- **输出变量：** `score12D`（Score12DResult）
- **数据来源：**
  - `calculateScore12D` 定义在 `scoring/index.ts` L64-71，内部调用 `calculateScore12DInternal`（L126-158），执行12个维度的独立计算（L129-140）
  - `legacyFrom8D` 当12维计算抛出异常时使用

---

#### Step 4: 图片标注（混合：同步 + 条件 await）
- **行号：** L106-119
- **类型：** 混合（同步函数调用 + 条件 await）
- **选项控制：** `opts.enableAnnotations`（默认 `true`，L47）
- **条件分支：** L109 `if (opts.enableAnnotations && baseResult.visionResult)`
- **操作：**
  - L110: `annotations = generateAnnotations(baseResult.visionResult, ruleMatches)` — 同步
  - L111-117: 条件 await
    ```typescript
    if (input.imageData && annotations.length > 0) {
      try {
        annotatedImage = await exportAnnotatedImage(input.imageData, annotations)
      } catch { /* 静默忽略 */ }
    }
    ```
- **输入变量：**
  - `baseResult.visionResult`（AI识别结果）
  - `ruleMatches`（Step 2输出）
  - `input.imageData`（用户上传的图片数据）
- **输出变量：**
  - `annotations`（ImageAnnotation[]）
  - `annotatedImage`（string | undefined，base64图片）
- **注意：** `generateAnnotations` 来自 `annotation/index.ts` L71-105，它是同步函数。`exportAnnotatedImage` 同文件 L179-186，也是同步函数（返回 `canvas.toDataURL`），但 pipeline 中用了 `await` 调用（L113），这是无害的。

**当 `enableAnnotations: false` 时（快速模式）：**
- L109 条件为 false，annotations 保持为空数组 `[]`（L106初始化），annotatedImage 保持 `undefined`（L107初始化）
- **这是一个功能缩减分支，不是死分支。**

---

#### Step 5: 多流派融合评分（同步）
- **行号：** L122-135
- **类型：** 同步
- **选项控制：** `opts.enableSchoolFusion`（默认 `true`，L48）
- **条件分支：** L124 `if (opts.enableSchoolFusion)`
- **操作：**
  - L125: `const schools = getEnabledSchools()` — 获取启用流派
  - L126-131: 构建 context
  - L132: `const multiScore = calculateMultiSchoolScore(context, schools)`
  - L133: `schoolScores = multiScore.details`
- **输入变量：**
  - `roomType`（Step 2中提取）
  - `detectedObjects`（Step 2中提取）
  - `baseResult.scoreResult`
  - `baseResult.spatialResult`
- **输出变量：** `schoolScores`（{ school, score, weight }[]）

**当 `enableSchoolFusion: false` 时（快速模式）：**
- L124 条件为 false，schoolScores 保持为空数组 `[]`（L122初始化）
- **功能缩减分支，非死分支。**

---

#### Step 6: V3.1 可信度计算（同步，含 if-else 分支）
- **行号：** L138-162
- **类型：** 同步
- **选项控制：** `opts.enableV31Credibility`（默认 `true`，L49）
- **条件分支：** L140 `if (opts.enableV31Credibility)`
- **if 分支（L141-147）：**
  ```typescript
  credibility = calculateCredibilityV31({
    imageQuality: baseResult.imageQuality,
    visionResult: baseResult.visionResult,
    ruleMatches,
    modelResults: [baseResult.scoreResult],
    duration: baseResult.totalTime,
  })
  ```
- **else 分支（L149-160）：**
  - 返回硬编码默认值对象，score 取 `baseResult.report?.confidence || 70`，level 固定 'medium'，factors 全部固定值
- **输入变量：**
  - `baseResult.imageQuality`，`baseResult.visionResult`，`ruleMatches`，`baseResult.scoreResult`，`baseResult.totalTime`
- **输出变量：** `credibility`（CredibilityResultV31）
- **数据来源：**
  - 正常路径：`calculateCredibilityV31` 来自 `credibility/index.ts` L181-213
  - 降级路径：硬编码默认值

---

#### Step 7: 生成 V3.1 专业报告（同步）
- **行号：** L165-174
- **类型：** 同步
- **操作：**
  - L166-173: 调用 `buildProfessionalReportV31({score12D, ruleMatches, visionResult, annotations, credibility, schoolScores})`
- **输入变量：** Step 3~6 的全部输出
- **输出变量：** `professionalReport`（ProfessionalReportV31）
- **注意：** `schoolScores` 在 report/index.ts 的 `buildProfessionalReportV31` 签名中并未使用（L100-106 参数解构中无 schoolScores），但 pipeline 传入了。该参数被静默忽略。

---

#### Step 8: 兼容转换 + 合并输出（同步）
- **行号：** L177-195
- **类型：** 同步
- **操作：**
  - L177: `const v31Report = toPipelineReportV31(professionalReport)` — 转换为 PipelineReport 格式
  - L179-181: 合并到 output.report.sections，更新 overallScore
  - L184: `perf.endPhase('total')`
  - L186-195: 构建 `output.v31` 对象，赋值所有字段
  - L197: `return output`

---

### 快速模式 `runV31PipelineFast` 与完整模式差异

**源文件：** pipeline.ts L209-218

```typescript
export async function runV31PipelineFast(
  input: PipelineInput,
  options?: Partial<V31PipelineOptions>
): Promise<V31PipelineOutput> {
  const fastInput = { ...input, mode: 'quick' as const }
  return runV31Pipeline(fastInput, { ...options, enableAnnotations: false, enableSchoolFusion: false })
}
```

**差异总结：**

| 特性 | 完整模式 | 快速模式 |
|------|----------|----------|
| Step 4 图片标注 | 启用（enableAnnotations=true） | **禁用**（强制 false） |
| Step 5 流派融合 | 启用（enableSchoolFusion=true） | **禁用**（强制 false） |
| Step 6 可信度 | 启用（enableV31Credibility=true） | 启用（未改变） |
| Step 1 V3.0 Pipeline | mode=默认 | mode='quick' |
| 其余步骤 | 相同 | 相同 |

**关键发现：**
1. 快速模式**跳过**了图片标注（Step 4）和流派融合评分（Step 5）
2. `mode: 'quick'` 传入 V3.0 Pipeline，但 V3.0 是否处理该 mode 取决于 `runFullPipeline` 的实现
3. 12维评分、规则匹配、报告生成**不受快速模式影响**

### 深度模式 `runV31PipelineDeep`

**源文件：** pipeline.ts L224-233

```typescript
export async function runV31PipelineDeep(
  input: PipelineInput,
  options?: Partial<V31PipelineOptions>
): Promise<V31PipelineOutput> {
  const deepInput = { ...input, mode: 'deep' as const }
  return runV31Pipeline(deepInput, { ...options, enablePDF: true })
}
```

- 与完整模式唯一差异：`mode: 'deep'` + `enablePDF: true`
- **注意：** `enablePDF` 在 `runV31Pipeline` 函数中**完全没有被使用**（L76-195 中无任何代码引用 `opts.enablePDF`）。这意味着 `enablePDF` 选项是死代码——深度模式的 PDF 功能实际上没有被 pipeline 自动触发。

### 死分支分析

| 位置 | 描述 | 结论 |
|------|------|------|
| `opts.enablePDF` | L41, L49 定义，但 runV31Pipeline 中**无任何代码检查此选项** | **死代码** |
| L72-74 early return | 当 V3.0 成功时不进入 | 非死分支，正常的错误路径 |
| Step 6 else 分支（L149-160） | enableV31Credibility=false 时执行 | 非死分支，有效降级路径 |
| L95-101 catch 降级 | 12维计算失败时执行 | 非死分支，有效降级路径 |
| L114 exportAnnotatedImage catch | 标注导出失败时静默忽略 | 非死分支 |
| L200-202 外层 catch | V3.1 整体失败时降级到 V3.0 | 非死分支 |

---

## Part 4: AI字段来源逐字段分析

### V31PipelineOutput.v31 对象字段追踪

**赋值位置：** pipeline.ts L186-195

```typescript
output.v31 = {
  score12D,                          // L187
  professionalReport,                // L188
  annotations,                       // L189
  annotatedImage,                    // L190
  credibility,                       // L191
  schoolScores,                      // L192
  ruleStats: getRuleStats(),          // L193
  performance: perf.generatePerformanceReport(),  // L194
}
```

---

#### 字段 1: `score12D`
- **类型：** `Score12DResult`
- **赋值行号：** pipeline.ts L88（正常路径）或 L98/L100（降级路径），最终写入 L187
- **生成函数：** `calculateScore12D()` — `scoring/index.ts` L64-71
- **依赖链：**
  - `baseResult.featureResult` → V3.0 特征提取结果
  - `baseResult.spatialResult` → V3.0 空间分析结果（含 `house.shape`, `house.missingCorners`, `doors`, `windows`, `circulationFlow` 等）
  - `baseResult.roomResult` → V3.0 房间分析结果（含 `rooms[]`, `average`, `dimensionSummary`）
  - `baseResult.ruleResult` → V3.0 规则匹配结果
  - `input.userInfo` → 用户提供的朝向等信息
- **子字段详情：**
  - `score12D.dimensions.*.score`：每个维度由独立的 `calculate*()` 函数计算（L129-140），使用加权公式。大部分维度从 V3.0 数据中读取字段再进行加权组合。
  - `score12D.overall`：L143-147，加权归一化总分
  - `score12D.level`：L149，根据分数区间映射（>=85 优，>=70 良，>=50 平，<50 差）
  - `score12D.summary`：L150，由 `generate12DSummary()` 生成模板化文本
- **归类：** **规则推导**（从V3.0数据字段通过加权公式推导，AI仅体现在V3.0的上游数据中，V3.1的评分算法本身是纯数学计算）

---

#### 字段 2: `professionalReport`
- **类型：** `ProfessionalReportV31`
- **赋值行号：** pipeline.ts L166，最终写入 L188
- **生成函数：** `buildProfessionalReportV31()` — `report/index.ts` L100-143
- **依赖链：** `score12D`, `ruleMatches`, `visionResult`, `annotations`, `credibility`（注意 `schoolScores` 被传入但未使用）
- **子字段12板块：** 全部由 `build*()` 系列函数生成（L115-125），每个函数根据 score12D 维度分数进行阈值判断，从**固定模板字符串数组**中选择
- **归类：** **模板文本 + 规则推导**（阈值判断选择模板片段，无AI生成）

---

#### 字段 3: `annotations`
- **类型：** `ImageAnnotation[]`
- **赋值行号：** pipeline.ts L110，最终写入 L189
- **生成函数：** `generateAnnotations()` — `annotation/index.ts` L71-105
- **依赖链：**
  - `baseResult.visionResult.objects[]` → AI识别的物体列表（含 bbox, label, confidence）
  - `ruleMatches` → 规则匹配结果（含 matchedObjects）
- **逻辑：** 遍历 ruleMatches，将 matchedObjects 与 visionResult.objects 关联，生成标注框
- **归类：** **规则推导**（标注位置来自AI识别的bbox，但标注类型和文本来自规则模板）

---

#### 字段 4: `annotatedImage`
- **类型：** `string | undefined`
- **赋值行号：** pipeline.ts L113，最终写入 L190
- **生成函数：** `exportAnnotatedImage()` — `annotation/index.ts` L179-186
- **实现：**
  ```typescript
  const canvas = document.createElement('canvas')
  renderAnnotations(canvas, image, annotations)
  return canvas.toDataURL('image/png')
  ```
- **依赖链：** `input.imageData`（原图）+ `annotations`
- **归类：** **规则推导 + 模板渲染**（Canvas绘制标注框，图片数据来自AI识别结果）

---

#### 字段 5: `credibility`
- **类型：** `CredibilityResultV31`
- **赋值行号：** pipeline.ts L141（正常路径）或 L149（默认值路径），最终写入 L191
- **生成函数：** `calculateCredibilityV31()` — `credibility/index.ts` L181-213
- **依赖链：**
  - `baseResult.imageQuality` → 图片质量数据（resolution, brightness, angleDeviation）
  - `baseResult.visionResult` → AI识别结果（objects[].confidence）
  - `ruleMatches` → 规则匹配数
  - `baseResult.scoreResult` → 评分结果
  - `baseResult.totalTime` → 分析耗时
- **计算：** 5个因子加权求和（权重: imageCompleteness 25%, recognitionAccuracy 25%, ruleMatchRate 20%, elementRecognitionCount 15%, modelConsistency 15%）
- **归类：** **规则推导**（纯数学计算，无AI推理）
- **降级路径归类：** **默认值**（硬编码 score=70/使用V3.0 confidence）

---

#### 字段 6: `schoolScores`
- **类型：** `{ school: string; score: number; weight: number }[]`
- **赋值行号：** pipeline.ts L133，最终写入 L192
- **生成函数：** `calculateMultiSchoolScore()` — `schools/index.ts` L160-195
- **依赖链：** `context`（roomType, detectedObjects, scoreResult, spatialResult）+ `schools`（启用的流派列表）
- **注意：** 实际上所有流派使用**完全相同的评分公式**（详见 Part 5）
- **归类：** **规则推导**（占位算法，详见 Part 5 审计结论）

---

#### 字段 7: `ruleStats`
- **类型：** `ReturnType<typeof getRuleStats>`
- **赋值行号：** pipeline.ts L193
- **生成函数：** `getRuleStats()` — `rules/registry.ts` L73-85
- **实现：** 遍历 `ALL_RULES_V31` 常量数组，按 category/severity/school 分组计数
- **归类：** **默认值/常量**（静态规则数据的统计，无动态计算）

---

#### 字段 8: `performance`
- **类型：** `PerformanceReport`
- **赋值行号：** pipeline.ts L194
- **生成函数：** `perf.generatePerformanceReport()` — `performance/index.ts` L327-381
- **依赖链：** `perf` 实例的 `metrics[]`, `ruleExecutionStats`, `parallelScoringStats`
- **归类：** **规则推导**（时间戳差值计算 + 缓存统计）

---

### professionalReport 12个报告板块文本来源追踪

**源文件：** `/workspace/xuanfengmen1/src/lib/fengshui/v31/report/index.ts`

#### 板块构建函数一览（L115-125）：
```typescript
const patternAnalysis = buildPatternAnalysis(score12D, matchedRules)     // L115
const windQiAnalysis = buildWindQiAnalysis(score12D, matchedRules)       // L116
const wealthAnalysis = buildWealthAnalysis(score12D, matchedRules, visionResult) // L117
const healthAnalysis = buildHealthAnalysis(score12D, matchedRules)       // L118
const careerAnalysis = buildCareerAnalysis(score12D, matchedRules)      // L119
const familyAnalysis = buildFamilyAnalysis(score12D, matchedRules)       // L120
const issues = buildIssues(matchedRules)                                // L121
const remediationPlans = buildRemediationPlans(matchedRules)             // L122
const classicalInterpretation = buildClassicalInterpretation(matchedRules) // L123
const summary = buildOverallSummary(score12D, issues, credibility)      // L124
const schools = buildSchools(matchedRules)                              // L125
```

---

#### 板块 1: 综合评价（一、综合评价）
- **构建函数：** `generateOverallScoreMarkdown()` — L772-795
- **文本来源：**
  - L774: `score12D.overall` 和 `score12D.level` — 动态插入
  - L775: `credibility.score` 和 `credibility.level` — 动态插入
  - L776: `credibility.explanation` — 动态插入（模板文本，见 credibility/index.ts L123-157）
  - L783-785: 12维评分表格 — 数据来自 `score12D.dimensions` 各维度
  - L788-790: 各维度评价概要 — 来自 `dim.description`（固定模板，见 scoring/index.ts L576-649）
  - L793: `score12D.summary` — 由 `generate12DSummary()` 生成的模板化文本
- **结论：** **模板文本 + 动态数据填充**。所有描述文本都是预定义的模板字符串（按等级选择），分数/数值动态插入。

---

#### 板块 2: 空间格局分析（二、空间格局分析）
- **构建函数：** `buildPatternAnalysis()` — L289-341
- **Markdown生成：** `generatePatternMarkdown()` — L797-820
- **文本来源：** 按 `score12D.dimensions.pattern.score` 阈值选择固定模板：
  - score >= 85: L299-303（3条模板）
    - 描述: `'结合传统风水理论分析，该空间整体格局较为方正均衡...'`
    - 原理: `'《黄帝宅经》云"宅以形势为身体"...'`
  - score >= 70: L305-309
    - 描述: `'该空间整体格局基本方正...'`
  - score >= 50: L311-315
  - score < 50: L317-323
- **补充来源：** L326-338 从 matchedRules 中查找缺角和穿堂风规则，将 `rule.impact.description` 追加到 weakness
- **结论：** **固定模板字符串**（4套模板按阈值选择）+ **规则文本追加**

---

#### 板块 3: 藏风聚气分析（三、藏风聚气分析）
- **构建函数：** `buildWindQiAnalysis()` — L344-380
- **文本来源：** 按 `score12D.dimensions.windQi.score` 阈值选择固定模板：
  - score >= 80: L354-357
    - 描述: `'藏风聚气条件较为理想...'`
    - 气流: `'气流回旋有序...'`
    - 聚气: `'门窗关系通常较为协调...'`
  - score >= 60: L359-363
  - score < 60: L365-371
- **结论：** **固定模板字符串**（3套模板按阈值选择）

---

#### 板块 4: 财位分析（四、财位分析）
- **构建函数：** `buildWealthAnalysis()` — L383-437
- **文本来源：** 按 `score12D.dimensions.wealth.score` 阈值选择固定模板：
  - score >= 80: L391-399
  - score >= 60: L401-409
  - score < 60: L411-421
- **wealthPositions 对象：** L392-434，name/location/status/suggestion 全部为固定模板
- **结论：** **固定模板字符串**（3套模板按阈值选择）

---

#### 板块 5: 健康运势分析（五、健康运势分析）
- **构建函数：** `buildHealthAnalysis()` — L440-480
- **文本来源：** 按 `score12D.dimensions.health.score` 阈值选择固定模板（3套）
- **结论：** **固定模板字符串**

---

#### 板块 6: 事业财运分析（六、事业财运分析）
- **构建函数：** `buildCareerAnalysis()` — L483-518
- **文本来源：** 按 `score12D.dimensions.career.score` 阈值选择固定模板（3套）
- **结论：** **固定模板字符串**

---

#### 板块 7: 家庭关系分析（七、家庭关系分析）
- **构建函数：** `buildFamilyAnalysis()` — L521-552
- **文本来源：** 按 `score12D.dimensions.family.score` 阈值选择固定模板（3套）
- **结论：** **固定模板字符串**

---

#### 板块 8: 主要问题列表（八、主要问题列表）
- **构建函数：** `buildIssues()` — L555-582
- **Markdown生成：** `generateIssuesMarkdown()` — L966-1001
- **文本来源：**
  - L572-581: 遍历 `matchedRules`（按严重度排序），逐条映射：
    - `title` = `rule.name`
    - `description` = `rule.impact.description`
    - `principle` = `rule.source.interpretation` 或默认模板 `'结合传统风水理论分析...'`
  - 无匹配规则时：L557-565 返回硬编码默认建议
- **结论：** **规则数据字段**（文本来自规则的静态数据，非AI动态生成）

---

#### 板块 9: 整改优先级（九、整改优先级）
- **构建函数：** 直接使用 `buildRemediationPlans()` 的输出
- **Markdown生成：** `generatePriorityMarkdown()` — L1003-1025
- **文本来源：**
  - `plan.issue` = `rule.name`
  - `plan.category` = `rule.category`
  - `plan.urgency` = 由 `severityToUrgency()` 从 severity 映射而来
  - 星级数 = `plan.priority` = `severityToPriority(severity)`
  - 紧急程度文本为固定映射（L1014-1019）
- **结论：** **规则数据字段 + 固定映射**

---

#### 板块 10: 详细整改方案（十、详细整改方案）
- **构建函数：** `buildRemediationPlans()` — L585-626
- **Markdown生成：** `generateRemediationMarkdown()` — L1027-1055
- **文本来源：**
  - L614-625: 遍历 `matchedRules`
  - `issue` = `rule.name`
  - `cause` = `rule.impact.description`
  - `solution` = `rule.solution`（含 summary, steps, difficulty, cost 等）
  - `expectedEffect` = `rule.solution.expectedEffect`
  - 无匹配时：L587-607 返回硬编码默认方案
- **结论：** **规则数据字段**（全部文本来自规则的静态 solution 定义）

---

#### 板块 11: 经典风水原理解读（十一、经典风水原理解读）
- **构建函数：** `buildClassicalInterpretation()` — L629-666
- **Markdown生成：** `generateClassicalMarkdown()` — L1057-1073
- **文本来源：**
  - L633-645: 遍历 `matchedRules`，提取 `rule.source.book`, `rule.source.chapter`, `rule.source.quote`, `rule.source.interpretation`
  - 去重（同一 book 只取一条），最多6条
  - 无匹配时：L648-659 返回两条硬编码经典理论：
    - 《黄帝宅经》: `'宅以形势为身体，以泉水为血脉...'`
    - 《葬书》: `'气乘风则散，界水则止...'`
  - L664: 总结文本为固定模板字符串
- **结论：** **规则数据字段**（全部来自规则的静态 source 定义）

---

#### 板块 12: 整体结论（十二、整体结论）
- **构建函数：** `buildOverallSummary()` — L669-709
- **文本来源：**
  - L677-682: `levelDesc` 是固定的4条模板映射
  - L684: 组合模板: `levelDesc[level] + '，综合评分 X 分。'`
  - L690-698: 根据问题数量（critical/severe/significant）追加固定模板
  - L700-702: 无严重问题时的固定模板
  - L704: `credibility.score` 动态插入
  - L705-706: 两条固定结语
- **结论：** **模板文本 + 动态数据填充**

---

### Part 4 总结：professionalReport 12板块归类

| 板块 | 主要文本来源 | 归类 |
|------|------------|------|
| 一、综合评价 | 模板选择 + 维度描述模板 | 模板文本 |
| 二、空间格局分析 | 固定模板（4套按分数选择） | 模板文本 |
| 三、藏风聚气分析 | 固定模板（3套按分数选择） | 模板文本 |
| 四、财位分析 | 固定模板（3套按分数选择） | 模板文本 |
| 五、健康运势分析 | 固定模板（3套按分数选择） | 模板文本 |
| 六、事业财运分析 | 固定模板（3套按分数选择） | 模板文本 |
| 七、家庭关系分析 | 固定模板（3套按分数选择） | 模板文本 |
| 八、主要问题列表 | 规则静态数据字段 | 规则推导 |
| 九、整改优先级 | 规则静态数据 + 严重度映射 | 规则推导 |
| 十、详细整改方案 | 规则静态 solution 数据 | 规则推导 |
| 十一、经典原理解读 | 规则静态 source 数据 | 规则推导 |
| 十二、整体结论 | 模板 + 分数/数量填充 | 模板文本 |

**核心发现：** 12个板块中，**没有任何文本是AI动态生成的**。所有描述性文本要么是预定义的固定模板字符串（按分数阈值选择），要么直接引用规则库中的静态数据字段。

---

## Part 5: 流派独立算法验证

**源文件：** `/workspace/xuanfengmen1/src/lib/fengshui/v31/schools/index.ts`

### `createScoringMethod` 工厂函数完整代码

L17-63:
```typescript
function createScoringMethod(id: string, name: string) {
  return {
    id,
    name,
    calculate(context: unknown): { score: number; details: string[] } {
      const ctx = context as ScoringContext
      const details: string[] = []

      switch (id) {
        case 'general':    details.push('依据通用风水原则进行整体评估')           break
        case 'bazhai':     details.push('结合宅主命卦与八宅方位分析')           break
        case 'xuankong':   details.push('运用玄空飞星推算当运旺衰')             break
        case 'jiugong':    details.push('按九宫飞星布局判断吉凶')               break
        case 'yangzhai':   details.push('参照阳宅三要门主灶关系')               break
        case 'sanyuan':    details.push('基于三元九运时间维度分析')             break
        case 'luantou':    details.push('勘察外部峦头形势影响')                 break
        case 'liqi':       details.push('以理气方位为核心进行推演')             break
        default:           details.push('使用默认评分逻辑')                     break
      }

      const baseScore = 60
      const objectCount = ctx.detectedObjects?.length ?? 0
      const score = Math.min(100, Math.max(0, baseScore + objectCount * 2))
      details.push(`当前环境检测要素数量: ${objectCount}`)

      return { score, details }
    },
  }
}
```

### 8个流派逐一验证

| 流派ID | 流派名称 | switch case | details.push 文本 | 是否使用流派ID做差异化计算 | 评分公式 |
|--------|----------|-------------|-------------------|---------------------------|----------|
| general | 通用风水 | L26-28 | '依据通用风水原则进行整体评估' | **否** | L55-57 |
| bazhai | 八宅派 | L29-31 | '结合宅主命卦与八宅方位分析' | **否** | L55-57 |
| xuankong | 玄空飞星 | L32-34 | '运用玄空飞星推算当运旺衰' | **否** | L55-57 |
| jiugong | 九宫飞星 | L35-37 | '按九宫飞星布局判断吉凶' | **否** | L55-57 |
| yangzhai | 阳宅三要 | L38-40 | '参照阳宅三要门主灶关系' | **否** | L55-57 |
| sanyuan | 三元九运 | L41-43 | '基于三元九运时间维度分析' | **否** | L55-57 |
| luantou | 峦头派 | L44-46 | '勘察外部峦头形势影响' | **否** | L55-57 |
| liqi | 理气派 | L47-49 | '以理气方位为核心进行推演' | **否** | L55-57 |

### L55-57 评分公式分析

```typescript
const baseScore = 60                           // L55
const objectCount = ctx.detectedObjects?.length ?? 0  // L56
const score = Math.min(100, Math.max(0, baseScore + objectCount * 2))  // L57
```

**公式：** `score = clamp(60 + detectedObjects.length * 2)`

**含义：**
- 基础分 60，每检测到一个物体 +2 分
- 20个物体即达满分 100
- **所有8个流派共用此公式**
- **公式不使用流派ID、权重、方向、空间布局等任何流派特有信息**
- **公式不使用 `ctx.roomType`、`ctx.direction`、`ctx.layoutFeatures`**（这些字段在 ScoringContext 接口中定义但从未使用）

### switch 语句分析

**L25-52 的 switch 语句：**
- 每个分支**仅有** `details.push(固定文本)` + `break`
- **没有任何分支包含任何计算逻辑**
- **没有使用流派ID修改 baseScore、权重系数或计算方式**
- **没有访问 ctx 中的任何字段**

### calculateMultiSchoolScore 加权计算

**L160-195:**
```typescript
for (const school of targetSchools) {
  const result = school.scoring.calculate(context)  // 每个流派分数完全一样（相同输入）
  breakdown.push({ school: school.id, name: school.name, score: result.score, weight: school.weight, details: result.details })
  totalWeight += school.weight
  weightedSum += result.score * school.weight
}
const overall = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0
```

**关键发现：** 由于所有流派对相同 context 计算出的 score 完全相同，加权平均的结果也等于该单一分数。**加权融合完全是虚假计算**——多流派差异仅体现在 details 的文本和 weight 的数值上，但 score 全部相同。

### Part 5 审计结论

1. **8个流派的评分算法完全相同**：`score = clamp(60 + detectedObjects.length * 2)`
2. **switch 语句中没有任何计算逻辑**，只有 `details.push` 固定文本
3. **没有任何流派特有的算法逻辑**
4. **ScoringContext 中定义的 `direction`、`layoutFeatures` 等字段是死代码**——从未在 calculate 函数中被访问
5. **多流派加权融合是虚假的**——因为所有流派产出相同的分数，加权平均等于单一分数
6. **流派差异仅体现在：** (a) details.push 的文本不同，(b) FENGSHUI_SCHOOLS 配置中的 weight/description 不同，(c) enabled 状态不同
7. 源码注释 "占位分数"（L54）证实这是临时实现，**所有流派算法均为占位**

---

## Part 6: PDF真实生成追踪

**源文件：** `/workspace/xuanfengmen1/src/lib/fengshui/v31/pdf/index.ts`

### 1. `generatePDFReport` 函数完整流程

**函数签名：** L48-52
```typescript
export async function generatePDFReport(
  config: PDFReportConfig,
  report: ProfessionalReportV31,
  annotations: ImageAnnotation[]
): Promise<string>
```

| 步骤 | 行号 | 操作 | 类型 |
|------|------|------|------|
| 创建容器 | L53 | `const container = createPrintContainer()` | 同步 |
| 封面 | L57 | `renderCoverPage(container, config)` | 同步 |
| 综合评分页 | L60 | `renderScorePage(container, report.score12D)` | 同步 |
| 雷达图页 | L63-65 | 条件 `config.includeRadarChart` → `renderRadarChartPage()` | 同步 |
| 标注图片页 | L68-70 | 条件 `config.includeAnnotations && annotations.length > 0` → `renderAnnotationPage()` | 同步 |
| 详细报告页 | L73 | `renderDetailedAnalysisPage(container, report)` | 同步 |
| 整改方案页 | L76 | `renderRemediationPage(container, report.remediationPlans)` | 同步 |
| 经典理论页 | L79-81 | 条件 `config.includeClassical` → `renderClassicalPage()` | 同步 |
| 结论页 | L84 | `renderConclusionPage(container, report)` | 同步 |
| 渲染PDF | L87 | `const dataUrl = await renderContainerToPDF(container)` | await 异步 |
| 清理 | L90 | `cleanupContainer(container)` | 同步（finally块） |

---

### 2. 是否 import 了真实PDF库？

**L1-14 import 列表：**
```typescript
import type { PDFReportConfig, ProfessionalReportV31, ImageAnnotation, DimensionScore, ScoreDimension12D } from '../types'
```

**结论：****没有 import jsPDF、html2canvas、pdf-lib 或任何其他真实PDF库。** 唯一的 import 是类型导入（`import type`），在运行时不产生任何代码。L5 的注释 `基于 jspdf + html2canvas 风格接口` 承认这是模仿这些库的接口风格。

---

### 3. `renderContainerToPDF` 完整实现

**L547-555:**
```typescript
async function renderContainerToPDF(container: HTMLElement): Promise<string> {
  if (typeof (window as any).html2canvas === 'function' && typeof (window as any).jspdf?.jsPDF === 'function') {
    return renderWithHtml2Canvas(container)
  }
  return renderWithPrintMedia(container)
}
```

**策略一（L549-551）：** 检查全局 `window.html2canvas` 和 `window.jspdf.jsPDF` 是否存在。这是**运行时检测**，不是静态 import。只有在宿主页面已经手动加载了这些库的情况下才会使用。

**策略二（L554）：** 降级为 `renderWithPrintMedia(container)`。

**默认路径：** 由于本模块没有 import 任何PDF库，`window.html2canvas` 和 `window.jspdf` 默认不存在，**实际执行的一定是策略二**。

---

### `renderWithPrintMedia` 完整实现（L582-604）

```typescript
async function renderWithPrintMedia(container: HTMLElement): Promise<string> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>玄风门风水报告</title>
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif; }
        .pdf-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; background: #fff; }
        .pdf-page:last-child { page-break-after: auto; }
      </style>
    </head>
    <body>
      ${container.innerHTML}
    </body>
    </html>
  `
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  return URL.createObjectURL(blob)
}
```

**结论：** 降级路径生成的是一个 **HTML Blob**，不是 PDF Blob。

---

### 4. 输出类型分析

| 路径 | 输出类型 | 实际格式 |
|------|----------|----------|
| 策略一 (`renderWithHtml2Canvas`) | `pdf.output('datauristring')` — data URI 字符串 | **真正的 PDF**（如果库存在） |
| 策略二 (`renderWithPrintMedia`) — **默认路径** | `URL.createObjectURL(blob)` — blob URL | **HTML Blob**，不是 PDF |

**返回类型：** `Promise<string>` — 在策略二中返回的是 `blob:https://...` 形式的 URL 字符串。

**核心发现：** 在默认情况下（没有外部加载 jsPDF + html2canvas），`generatePDFReport` 返回的是一个 **HTML Blob URL**，文件扩展名 `.pdf` 但内容是 HTML。用户"下载"的文件实际上是一个 `.html` 文件。

---

### 5. 是否存在 `document.createElement('canvas')` 调用？

**搜索结果：**
- `renderAnnotations()` 函数中：`canvas.getContext('2d')`（annotation/index.ts L118），但这不在 pdf/index.ts 中
- `exportAnnotatedImage()` 函数中：`document.createElement('canvas')`（annotation/index.ts L183），同样不在 pdf/index.ts 中
- `renderWithHtml2Canvas()` 函数中：**没有直接调用** `document.createElement('canvas')`，canvas 由 html2canvas 库内部创建
- `renderWithPrintMedia()` 函数中：**没有 canvas 调用**

**pdf/index.ts 本身不包含 `document.createElement('canvas')`。** Canvas 操作仅在策略一的 html2canvas 内部执行。

---

### 6. 是否存在 `canvas.toDataURL` / `canvas.toBlob` 调用？

**搜索结果：**
- `annotation/index.ts` L185: `return canvas.toDataURL('image/png')` — 用于标注图片导出，不在 pdf 模块中
- `renderWithHtml2Canvas()` L571: `const imgData = canvas.toDataURL('image/png')` — 但仅在策略一（html2canvas库存在时）执行
- **`renderWithPrintMedia()`（默认路径）中没有任何 canvas 相关调用**

---

### 7. 是否存在真正的分页逻辑？

**CSS 分页：**
- L493-501 `pageStyle` 常量：
  ```typescript
  const pageStyle = `
    width: 794px;
    min-height: 1123px;
    padding: 48px 56px;
    box-sizing: border-box;
    page-break-after: always;   // L499 - CSS 分页
    background: #fff;
  `
  ```
- `renderWithPrintMedia()` 中的 CSS（L593）：
  ```css
  .pdf-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; }
  .pdf-page:last-child { page-break-after: auto; }
  ```

**分析：**
- 分页完全依赖 CSS `page-break-after: always`
- 这是 CSS 打印样式分页，**仅在浏览器打印（Ctrl+P）时生效**
- 对于 `Blob URL` 直接打开的方式，CSS page-break **不起作用**，所有内容会连续显示
- **没有任何程序化的分页逻辑**（如计算内容高度、手动插入分页符、控制每页行数等）

---

### 8. 是否存在页码计算逻辑？

**搜索结果：** `pdf/index.ts` 中**没有任何页码计算逻辑**。

- 没有 `pageCount` 变量
- 没有页脚页码渲染
- `PDFPage` 接口（L20-23）仅定义了 `title` 和 `content`，没有 `pageNumber`
- `PDFGenerationResult` 接口（L25-29）定义了 `pageCount` 字段，但**该接口从未被使用**

**注意：** `PDFGenerationResult` 接口定义了 `dataUrl`, `blob`, `pageCount` 三个字段，但 `generatePDFReport` 的返回类型是 `Promise<string>`，不是 `PDFGenerationResult`。该接口是**死代码**。

---

### 9. 是否存在目录生成逻辑？

**搜索结果：** `pdf/index.ts` 中**没有任何目录（TOC）生成逻辑**。

- 没有目录页渲染函数
- 没有章节标题提取和页码关联
- `generatePDFReport` L57-84 的渲染步骤中，没有 "renderTOC" 或类似步骤

---

### Part 6 审计结论

| 检查项 | 结论 | 证据 |
|--------|------|------|
| 是否 import 真实PDF库 | **否** | L8-14 仅 import 类型 |
| 真实PDF生成路径 | **依赖外部库运行时加载** | L549 检查 `window.html2canvas` |
| 默认输出类型 | **HTML Blob**（非PDF） | L602 `new Blob([html], {type:'text/html'})` |
| `document.createElement('canvas')` | **本模块无** | 仅在策略一的 html2canvas 内部 |
| `canvas.toDataURL` / `canvas.toBlob` | **本模块无** | 仅在策略一的 html2canvas 内部 |
| 真正的分页逻辑 | **无**（仅CSS page-break） | L499 CSS属性，程序化分页为零 |
| 页码计算 | **无** | 无相关代码 |
| 目录生成 | **无** | 无相关代码 |
| `PDFGenerationResult` 接口 | **死代码** | 定义但从未被引用或返回 |
| 函数返回值 vs 接口声明不匹配 | **是** | 返回 `Promise<string>` 而非 `PDFGenerationResult` |

**核心发现：** PDF 生成模块是一个**伪装层**。在没有外部加载 jsPDF + html2canvas 的前提下（模块本身不加载这些库），`generatePDFReport` 生成的是 HTML Blob 并返回 Blob URL，但 `downloadPDF` 函数（L615-622）会以 `.pdf` 扩展名下载该 HTML 文件。用户得到的文件名为 `.pdf` 但实际内容是 HTML。

---

## 全局审计发现汇总

### 严重问题

1. **流派算法全部为占位实现**（Part 5）：8个流派共用 `score = 60 + detectedObjects.length * 2` 公式，无任何流派特有逻辑。多流派融合是虚假计算。
2. **PDF生成实际输出HTML而非PDF**（Part 6）：默认路径生成 HTML Blob，以 .pdf 扩展名保存，内容为 HTML。
3. **`enablePDF` 选项为死代码**（Part 3）：在 `runV31Pipeline` 中定义但从未检查，深度模式的 PDF 功能不会被自动触发。

### 中等问题

4. **所有12个报告板块无AI动态生成内容**（Part 4）：所有描述性文本均为固定模板字符串或规则静态数据。
5. **ScoringContext 中 `direction` 和 `layoutFeatures` 字段未使用**（Part 5）：接口定义了但 calculate 函数从未访问。
6. **`PDFGenerationResult` 接口为死代码**（Part 6）：定义了但从未被使用。
7. **`buildProfessionalReportV31` 接收但未使用 `schoolScores` 参数**（Part 4）：pipeline.ts L173 传入了 schoolScores，但 report/index.ts L100-106 的参数解构中无此字段。

### 低风险问题

8. **`exportAnnotatedImage` 是同步函数但 pipeline 用 `await` 调用**（Part 3）：无害但暗示代码意图不清晰。
9. **annotation/index.ts 的接口定义与 rules/registry.ts 的 RuleMatchResult 接口不匹配**（Part 3）：pipeline.ts L110 传入的 ruleMatches 来自 registry.ts（有 `rule` + `matched` 字段），但 annotation/index.ts L44-51 期望的是不同的接口（有 `matchedObjects` + `suggestion` 字段），可能导致运行时属性访问 undefined。
