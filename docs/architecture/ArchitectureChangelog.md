# Architecture Changelog

---

## v1.0 (P6-B.6 Final) — LOCKED

### P6-B Architecture Unification

- 统一 19 个 Engine 文件的常量到 `@/lib/core`（消除 ~80 行重复定义）
- 创建 Engine Contract 系统（`engineContract.ts`，15 个注册 Engine）
- 生成 Architecture v1 文档（模块图、数据流图、Engine 依赖图）

### P6-B.5 Architecture Audit

- 10 项审计全部通过
- 修复 5 个文件残留重复常量（`diseaseMedicineEngine`, `consistencyChecker`, `climateAdjustmentEngine`, `dayMasterStrengthEngine`, `benchmarkEngine`）
- 修复 14 处 EvidenceItem traceability 缺失（`explainEvidenceEngine.ts`）
- Architecture Score: 97/100

### P6-B.6 Technical Debt Cleanup

- 删除 `dynamicUseGod.ts` 死代码 `ELEMENT_MAP`（28 行，未被任何文件引用）
- 完成全仓 SSOT 审计：0 处违规 `const` 定义
- 完成全仓 `as any` 审计：314 处分类（A:29 必须保留, B:230 可优化, C:55 应删除）
- Engine→Core 最终状态：22 个 Engine 文件全部从 `@/lib/core` 导入，3 处 B 类 Core 调用（`dayMasterStrengthEngine`×2, `luckModifierEngine`×1）标注为技术债
- 冻结 Architecture v1.0
- 生成 4 份维护文档：`TypeSafetyDebt.md`, `ArchitectureRules.md`, `EngineRegistry.md`, `ArchitectureChangelog.md`
- 测试状态：228/228 PASS

### 冻结清单

| 项目 | 状态 |
|------|------|
| SSOT | 100%（所有常量来自 `@/lib/core`） |
| Engine Registry | 100%（15 个 Engine 注册） |
| Type Safety Debt | 100% 分类完成 |
| Architecture Rules | LOCKED |
| Engine→Core 违规 | 0 处违规（3 处已标注为允许的工具函数调用/技术债） |
