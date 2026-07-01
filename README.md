# 玄风门 (XuanFengMen)

AI Feng Shui Analysis Platform - V4.4 Release

## Overview

玄风门是一个基于 AI 的风水分析平台，结合传统风水理论与现代技术，提供图片分析、规则判定、报告生成等功能。

## Architecture

```
Pipeline (Unified Entry)
    │
    ├── Vision (Image Analysis)
    │
    ├── FloorPlan (Layout Analysis)
    │
    ├── Spatial (Space Relations)
    │
    ├── Furniture (Furniture Detection)
    │
    ├── Room (Room Evaluation)
    │
    ├── Feature (Feature Extraction)
    │
    ├── Rule Engine (101 Rules)
    │
    ├── Score Engine (Unified Scoring)
    │
    ├── Knowledge Base (76 Entries)
    │
    ├── Evidence Chain (Traceability)
    │
    └── Report (12-Section Template)
```

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| Pipeline | Stable | Unified entry point, 10-step flow |
| Vision Module | Integrated | Image analysis via AI |
| Simulation | Deprecated | Reserved for Premium/AB Test |
| AI Provider | Stable | OpenAI/Gemini/Supabase Edge |
| Rule Engine | Frozen | 101 feng shui rules |
| Knowledge Base | Frozen | 76 classic/modern entries |

## Rules (101)

按房间分类：
- House: 8
- Entrance: 12
- Living Room: 14
- Master Bedroom: 15
- Bedroom: 8
- Study: 8
- Kitchen: 12
- Bathroom: 8
- Dining Room: 8
- Balcony: 8

## Knowledge Base (76)

分类：
- Classic: 20
- Modern: 5
- Cases: 15
- Schools: 6
- Plants: 8
- Colors: 8
- Materials: 6
- Symbols: 8

## Tech Stack

- React 19
- TypeScript
- Vite
- Supabase

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run release-check  # Run release validation
```

## Project Status

**Maintenance Mode - Release Freeze**

| Item | Status |
|------|--------|
| Version | 4.4.0 |
| Channel | Release |
| Architecture | Frozen |
| Pipeline | Stable |
| Rules | 101 (Frozen) |
| Knowledge | 76 (Frozen) |

### What's Allowed
- Bug Fix
- Security Fix
- Business Feature (会员/支付/报告导出等)

### What's Forbidden
- Architecture Refactor
- Rule Refactor
- Pipeline Refactor
- Knowledge Refactor
- Type Refactor (for reducing any)

See [RELEASE_FREEZE.md](./RELEASE_FREEZE.md) for details.

## License

ISC