# Architecture Review A-01: Core Domain

**日期**：2026-07-03  
**版本**：v1  
**状态**：✅ 完成

---

## 一、完成内容

### 1.1 创建 Shared Core Domain

```
src/lib/core/
├── types/base.ts          # 统一基础类型（HeavenlyStem/FiveElement/Gender/ZiShiStrategy 等）
├── constants/
│   ├── stem.ts            # 天干常量（HEAVENLY_STEMS/STEM_ELEMENT/STEM_YINYANG）
│   ├── branch.ts          # 地支常量（EARTHLY_BRANCHES/BRANCH_ELEMENT/MONTH_BRANCHES）
│   ├── wuxing.ts          # 五行常量（GENERATE/OVERCOME/WANG_SHUAI_TABLE）
│   ├── canggan.ts         # 藏干表（CANG_GAN）
│   ├── changsheng.ts      # 十二长生（CHANG_SHENG_START）
│   ├── nayin.ts           # 纳音表（NA_YIN_TABLE）
│   └── index.ts
├── utils/
│   ├── stemUtils.ts       # 天干工具函数（getStemElement/getStemYinYang/isYangStem）
│   ├── branchUtils.ts     # 地支工具函数（getBranchElement/getMonthMainElement）
│   ├── wuxingUtils.ts     # 五行工具函数（getWangShuai/getMotherElement/isGenerating）
│   └── index.ts
├── result/index.ts        # 统一 Result<T> + ok/fail/warn 工厂函数
├── errors/index.ts        # 统一 DomainError + ERROR_CODES
├── interfaces/index.ts    # ICalculator/IAnalyzer/IPipeline/ICache/IKnowledgeEngine
├── config/index.ts        # 全局默认值（DEFAULT_LONGITUDE/DEFAULT_ZISHI_STRATEGY 等）
├── base/index.ts          # GanZhi/SixLines/FiveElementCount 值对象
└── index.ts               # 统一导出
```

### 1.2 第一批迁移完成

| 模块 | 迁移内容 | 状态 |
|------|---------|:----:|
| calculator.ts | HEAVENLY_STEMS/EARTHLY_BRANCHES/MONTH_BRANCHES/CANG_GAN + getStemElement/getStemYinYang | ✅ |
| shishen.ts | STEMS/STEM_ELEMENT/STEM_YINYANG + getStemElement/getStemYinYang | ✅ |
| dashunRules.ts | HEAVENLY_STEMS/EARTHLY_BRANCHES/MONTH_BRANCHES + getStemElement/getStemYinYang | ✅ |
| wuxingRules.ts | STEM_ELEMENT/STEM_YINYANG/BRANCH_ELEMENT/WANG_SHUAI_TABLE/GENERATE/OVERCOME | ✅ |

### 1.3 路径别名配置

| 配置文件 | 修改内容 |
|---------|---------|
| tsconfig.json | 添加 `baseUrl: "."` + `paths: { "@/*": ["src/*"] }` |
| vite.config.ts | 添加 `resolve.alias: { "@": path.resolve(__dirname, "./src") }` |
| vitest.config.ts | 添加 `resolve.alias: { "@": path.resolve(__dirname, "./src") }` |

### 1.4 验证结果

| 检查项 | 结果 |
|--------|------|
| tsc（core 模块） | ✅ 0 error |
| vitest 全量测试 | ✅ 228/228 通过 |
| 金标准命例 | ✅ 全部通过 |
| 提交 | ✅ 已提交 |

---

## 二、未完成内容

### 2.1 剩余重复常量

| 常量 | 剩余定义位置 | 数量 |
|------|-------------|:----:|
| STEM_ELEMENT | shishenRules.ts | 1 |
| BRANCH_ELEMENT | gejuRules.ts | 1 |
| GENERATE | gejuRules.ts, shishenRules.ts, xiyongRules.ts | 3 |
| OVERCOME | gejuRules.ts, shishenRules.ts, xiyongRules.ts | 3 |
| CANG_GAN | wuxing.ts | 1 |

### 2.2 剩余重复工具函数

| 函数 | 剩余定义位置 | 数量 |
|------|-------------|:----:|
| getStemElement | shishenRules.ts | 1 |
| getGanElement | wuxingRules.ts（兼容别名） | 1 |

### 2.3 待迁移模块

| 模块 | 状态 |
|------|------|
| shishenRules.ts | 等待迁移 |
| gejuRules.ts | 等待迁移 |
| xiyongRules.ts | 等待迁移 |
| wuxing.ts | 等待迁移 |
| changshengRules.ts | 等待迁移 |
| nayin.ts | 等待迁移 |

---

## 三、重复代码统计（Before → After → Remaining）

### 3.1 常量定义

| 常量 | Before | After | Remaining | 减少 |
|------|:------:|:-----:|:---------:|:----:|
| HEAVENLY_STEMS | 3 | 0 | 0 | -3 |
| EARTHLY_BRANCHES | 3 | 0 | 0 | -3 |
| STEM_ELEMENT | 4 | 1 | 1 | -3 |
| BRANCH_ELEMENT | 3 | 1 | 1 | -2 |
| GENERATE | 5 | 3 | 3 | -2 |
| OVERCOME | 5 | 3 | 3 | -2 |
| MONTH_BRANCHES | 2 | 0 | 0 | -2 |
| CANG_GAN | 3 | 1 | 1 | -2 |
| **合计** | **28** | **9** | **9** | **-19** |

### 3.2 工具函数定义

| 函数 | Before | After | Remaining | 减少 |
|------|:------:|:-----:|:---------:|:----:|
| getStemElement | 4 | 1 | 1 | -3 |
| getGanElement | 3 | 1 | 1 | -2 |
| getZhiElement | 1 | 1 | 1 | 0 |
| getWangShuai | 2 | 0 | 0 | -2 |
| **合计** | **10** | **3** | **3** | **-7** |

### 3.3 总计

| 类别 | Before | After | Remaining | 减少率 |
|------|:------:|:-----:|:---------:|:-----:|
| 常量定义 | 28 | 9 | 9 | **-67.9%** |
| 工具函数定义 | 10 | 3 | 3 | **-70%** |
| **总计** | **38** | **12** | **12** | **-68.4%** |

---

## 四、Remaining Risk

### 4.1 技术风险

| 风险 | 等级 | 说明 | 缓解措施 |
|------|:----:|------|---------|
| gejuRules.ts 体积过大（4300+ 行） | High | 迁移时需谨慎，避免引入错误 | 按规则组分批迁移 |
| xiyongRules.ts 与 wuxingRules.ts 耦合 | Medium | 两者共享五行计算逻辑 | 统一使用 core/utils |
| changshengRules.ts 规则与引擎混杂 | Medium | 规则文件中有算法逻辑 | 先提取算法到 utils |

### 4.2 依赖风险

| 风险 | 等级 | 说明 | 缓解措施 |
|------|:----:|------|---------|
| 旧接口 @deprecated 后调用方未更新 | Medium | 可能存在未发现的旧接口引用 | 后续逐步清理 |
| Core 版本更新影响所有模块 | Low | Core 变更可能导致连锁反应 | 保持 Core 向后兼容 |

---

## 五、下一步

### 5.1 继续迁移（Sprint A-08 任务）

按优先级顺序迁移剩余重复代码：

1. **shishenRules.ts**（高优先级，十神核心）
2. **xiyongRules.ts**（高优先级，用神核心）
3. **gejuRules.ts**（中优先级，格局规则，体积大）
4. **wuxing.ts**（中优先级，五行计算）
5. **changshengRules.ts**（低优先级，十二长生）
6. **nayin.ts**（低优先级，纳音）

### 5.2 进入 A-02

迁移完成后，输出《BirthData Migration Plan》，确认：
- BirthInfo 来源和引用点
- BaziRequestBody 定义位置
- Database Chart 表结构
- API 接口参数
- Form 表单字段

### 5.3 统一 Import 规范

全项目统一使用：
```typescript
import { ... } from '@/lib/core'
```

禁止继续使用 `../../constants` 等旧方式。

---

## 六、结论

**A-01 状态**：✅ 完成 85%

| 指标 | 达成度 |
|------|:-----:|
| Core Domain 建立 | 100% |
| 路径别名配置 | 100% |
| 第一批常量迁移 | 100% |
| 测试验证 | 100% |
| 剩余重复迁移 | 待完成 |

**建议**：继续推进 A-02 BirthData 唯一化，同时在 A-08 中完成剩余重复代码迁移。
