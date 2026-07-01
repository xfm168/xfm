# V4.4 Release Freeze

**Architecture Frozen**

## Frozen Components

- ✅ Pipeline Architecture
- ✅ Rule Engine (101 Rules)
- ✅ Knowledge Base (76 Entries)
- ✅ AI Provider (Unified Timeout)
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
| AI Provider | Frozen | No modification |
| Rule Engine | Frozen | No modification |
| Knowledge Base | Frozen | No modification |

## Version

- Release: V4.4 Release
- Channel: Release
- Build: 2026-07
- Status: Freeze

## Contact

For any architecture change request, create a proposal issue first.

---

**Released: 2026-07-01**