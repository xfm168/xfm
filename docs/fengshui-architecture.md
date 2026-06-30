/**
 * 风水模块架构设计
 * 
 * 目标：复用八字Rule Engine架构，快速构建风水分析功能
 * 
 * 核心设计原则：
 * 1. Rule Engine 完全复用 - 不修改 src/lib/bazi/rules/engine.ts
 * 2. Audit体系复用 - 使用相同的DEBUG_AUDIT机制
 * 3. 前端组件部分复用 - 展示逻辑可以复用
 * 
 * 目录结构：
 * src/lib/fengshui/
 *   ├── index.ts                    # 导出所有风水模块
 *   ├── types.ts                    # 风水相关类型定义
 *   ├── rules/
 *   │   ├── index.ts                # 导出所有规则
 *   │   ├── engine.ts               # 可选：fengshui专用executeRules封装
 *   │   ├── fengshuiRules.ts        # 风水分析规则（150+条）
 *   │   ├── roomRules.ts             # 房间分析规则
 *   │   ├── layoutRules.ts           # 布局分析规则
 *   │   ├── directionRules.ts        # 方向分析规则
 *   │   └── elementRules.ts          # 五行布局规则
 *   ├── analyzer.ts                  # 风水分析主入口
 *   └── explain.ts                   # 风水Explain生成
 * 
 * 规则类型：
 * 1. 房屋朝向规则 - 坐北朝南等
 * 2. 户型分析规则 - 方正、缺角等
 * 3. 房间功能规则 - 客厅、卧室、厨房等
 * 4. 家具布局规则 - 床、沙发、书桌等
 * 5. 五行平衡规则 - 木、火、土、金、水分布
 * 6. 流年运势规则 - 结合八字
 * 7. 颜色搭配规则 - 根据命主五行
 * 8. 植物摆放规则 - 绿植、风水植物
 * 9. 镜子摆放规则 - 镜子方位
 * 10. 财位布局规则 - 招财布局
 * 
 * 复用策略：
 * 
 * 1. Rule Engine复用
 * ------------------
 * // 直接使用八字模块的engine
 * import { executeRules } from '../bazi/rules/engine'
 * 
 * // 定义风水规则
 * const FENGSHUI_RULES: BaseRule<FengShuiContext, FengShuiResult>[] = [...]
 * 
 * // 执行规则
 * const { bestMatch, allMatches } = executeRules(FENGSHUI_RULES, context, options)
 * 
 * 
 * 2. Audit复用
 * -------------
 * // 风水模块使用相同的审计机制
 * import { enableAudit, getAuditStats, getAuditSummary } from '../bazi/rules/engine'
 * 
 * enableAudit(1000)
 * // ... 执行分析
 * const stats = getAuditStats()
 * const summary = getAuditSummary()
 * 
 * 
 * 3. Confidence计算复用
 * --------------------
 * // 风水Confidence计算逻辑类似八字
 * const confidence = calculateConfidence({
 *   matchedRules: allMatches.length,
 *   totalRules: FENGSHUI_RULES.length,
 *   score: finalScore,
 *   contextQuality: inputQuality,
 * })
 * 
 * 
 * 4. Explain生成复用
 * -----------------
 * // 风水Explain结构类似八字
 * interface FengShuiExplain {
 *   whyGood: string[]           // 为什么好
 *   whyBad: string[]            // 为什么不好
 *   suggestions: string[]       // 改善建议
 *   matchedPatterns: string[]    # 匹配的格局
 *   warnings: string[]          # 注意事项
 * }
 * 
 * 
 * 数据流：
 * 
 * 用户输入 → FengShuiAnalyzer → executeRules(FENGSHUI_RULES)
 *                                    ↓
 *                               allMatches
 *                                    ↓
 *                          FengShuiResult
 *                                    ↓
 *                         FengShuiExplain
 *                                    ↓
 *                              Dashboard
 * 
 * 
 * 优先级安排：
 * 
 * MVP阶段（两天）：
 * 1. 房屋朝向分析（10条规则）
 * 2. 户型方正/缺角分析（10条规则）
 * 3. 房间功能分析（客厅/卧室/厨房各10条）
 * 4. 五行布局建议（15条规则）
 * 5. AI改善建议（调用现有AI服务）
 * 6. 简单报告输出
 * 
 * 扩展阶段：
 * 1. 图片户型识别（后续）
 * 2. 罗盘方向识别（后续）
 * 3. 流年运势结合（需要八字数据）
 * 4. 大运分析（需要八字数据）
 * 
 */

// ============ 类型定义示例 ============

export interface FengShuiContext {
  // 房屋信息
  houseType: 'apartment' | 'house' | 'villa' | 'commercial'
  houseAge: number
  floor: number
  totalFloors: number
  
  // 朝向信息
  mainDirection: Direction          // 主朝向
  backDirection: Direction          // 坐山方向
  doorDirection: Direction          // 大门方向
  
  // 户型信息
  layoutShape: 'square' | 'rectangle' | 'L-shape' | 'irregular'
  layoutScore: number                // 户型评分 0-100
  missingCorners: Direction[]        // 缺角方向
  
  // 房间信息
  rooms: Room[]
  
  // 五行分布
  elementDistribution: ElementDistribution
  
  // 命主信息（可选，用于个性化）
  ownerBazi?: {
    dayGan: string
    dayElement: string
    xiYongShen: string
  }
}

export interface Room {
  type: 'living' | 'bedroom' | 'kitchen' | 'bathroom' | 'study' | 'storage'
  size: number                      // 平方米
  direction: Direction               // 房间朝向
  hasWindow: boolean
  hasBalcony: boolean
  mainFurniture: Furniture[]
  element: FiveElement
  position: 'front' | 'back' | 'left' | 'right' | 'center'
}

export interface Furniture {
  type: 'bed' | 'sofa' | 'desk' | 'stove' | 'tv' | 'wardrobe' | 'plant' | 'mirror'
  position: FurniturePosition
  direction: Direction
  material: 'wood' | 'metal' | 'water' | 'fire' | 'earth'
}

export type Direction = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest'
export type FiveElement = '木' | '火' | '土' | '金' | '水'

export interface ElementDistribution {
  木: number
  火: number
  土: number
  金: number
  水: number
}

export interface FengShuiResult {
  mainPattern: FengShuiPattern
  patternScore: number
  confidence: number
  confidenceReason: string
  matchedRules: string[]
  allPatterns: FengShuiPattern[]
  
  // 分析维度
  houseScore: number
  layoutScore: number
  roomScore: number
  elementScore: number
  directionScore: number
  
  // 优缺点
  strengths: string[]
  weaknesses: string[]
  warnings: string[]
  suggestions: string[]
}

export interface FengShuiPattern {
  id: string
  name: string
  category: '朝向' | '户型' | '房间' | '布局' | '五行' | '综合'
  description: string
  score: number
  matched: boolean
}

// ============ 分析入口示例 ============

/**
 * 风水分析主函数
 * 类似八字的 determineGeJu
 */
export function analyzeFengShui(
  context: FengShuiContext,
  options: {
    includeAI?: boolean
    detailed?: boolean
  } = {}
): FengShuiResult {
  // 1. 执行规则引擎
  const { bestMatch, allMatches } = executeRules(FENGSHUI_RULES, context, {
    stopOnFirstMatch: false,
    returnAllMatches: true,
  })
  
  // 2. 计算综合分数
  const finalScore = calculateFinalScore(allMatches, context)
  
  // 3. 计算Confidence
  const confidence = calculateConfidence({
    matchedRules: allMatches.length,
    totalRules: FENGSHUI_RULES.length,
    score: finalScore,
  })
  
  // 4. 生成Explain
  const explain = generateFengShuiExplain(context, allMatches)
  
  // 5. 返回结果
  return {
    mainPattern: bestMatch?.result || allMatches[0]?.result,
    patternScore: finalScore,
    confidence,
    matchedRules: allMatches.map(m => m.rule.name),
    allPatterns: allMatches.map(m => m.result),
    houseScore: calculateHouseScore(context),
    layoutScore: calculateLayoutScore(context),
    roomScore: calculateRoomScore(context),
    elementScore: calculateElementScore(context),
    directionScore: calculateDirectionScore(context),
    strengths: explain.whyGood,
    weaknesses: explain.whyBad,
    warnings: explain.warnings,
    suggestions: explain.suggestions,
  }
}

// ============ 简单规则示例 ============

/**
 * 风水规则示例
 * 实际会有150+条规则
 */
const FENGSHUI_RULES = [
  // 朝向规则
  {
    id: 'north-south-facing',
    name: '坐北朝南',
    category: '朝向',
    priority: 100,
    weight: 90,
    condition: (ctx: FengShuiContext) => 
      ctx.mainDirection === 'south' && ctx.backDirection === 'north',
    result: {
      name: '坐北朝南',
      description: '中国传统最佳朝向，阳光充足，通风良好',
      score: 95,
    },
  },
  {
    id: 'avoid-north-facing',
    name: '忌坐北朝北',
    category: '朝向',
    priority: 100,
    weight: 85,
    condition: (ctx: FengShuiContext) => 
      ctx.mainDirection === 'north' && ctx.backDirection === 'south',
    result: {
      name: '坐南朝北',
      description: '北向住宅阳光不足，阴气较重',
      score: 40,
    },
    description: '坐南朝北，阳光不足',
  },
  
  // 户型规则
  {
    id: 'square-layout',
    name: '户型方正',
    category: '户型',
    priority: 90,
    weight: 80,
    condition: (ctx: FengShuiContext) => 
      ctx.layoutShape === 'square' || ctx.layoutShape === 'rectangle',
    result: {
      name: '户型方正',
      description: '方正户型气场稳定，运势平稳',
      score: 90,
    },
  },
  {
    id: 'missing-corner',
    name: '缺角',
    category: '户型',
    priority: 95,
    weight: 70,
    condition: (ctx: FengShuiContext) => ctx.missingCorners.length > 0,
    result: {
      name: '户型有缺角',
      description: '缺角影响对应方位的运势',
      score: 60 - ctx.missingCorners.length * 10,
    },
    description: '缺角影响',
  },
  
  // 五行规则
  {
    id: 'element-balance',
    name: '五行平衡',
    category: '五行',
    priority: 85,
    weight: 75,
    condition: (ctx: FengShuiContext) => {
      const { 木, 火, 土, 金, 水 } = ctx.elementDistribution
      const max = Math.max(木, 火, 土, 金, 水)
      const min = Math.min(木, 火, 土, 金, 水)
      const balance = max - min <= 2
      return balance
    },
    result: {
      name: '五行较平衡',
      description: '五行分布均衡，运势稳定',
      score: 85,
    },
  },
  
  // 更多规则...
]

// ============ 复用确认 ============

/**
 * 已确认复用的模块：
 * 
 * ✅ Rule Engine
 *    - src/lib/bazi/rules/engine.ts
 *    - executeRules() 函数
 *    - BaseRule 接口
 *    - RuleEngineOptions 接口
 * 
 * ✅ Audit 体系
 *    - __RULE_AUDIT__ 全局变量
 *    - enableAudit() / disableAudit()
 *    - getAuditStats() / getAuditTraces() / getAuditSummary()
 *    - RuleAuditStat 接口
 *    - 性能影响：约7%（可接受）
 * 
 * ✅ 置信度计算
 *    - 类似八字的Confidence计算逻辑
 *    - 基于命中规则数/总分/上下文质量
 * 
 * ✅ Explain生成
 *    - 结构类似（whyGood/whyBad/suggestions）
 *    - 可复用模板生成逻辑
 * 
 * ✅ Dashboard
 *    - 复用相同的Dashboard模板
 *    - 只替换数据源
 * 
 * 需要新建：
 * 
 * ❌ FengShuiContext 定义
 * ❌ FengShuiResult 定义
 * ❌ FengShuiPattern 定义
 * ❌ fengshuiRules.ts (150+条规则)
 * ❌ FengShuiExplain 定义
 * ❌ analyzeFengShui() 函数
 * ❌ 各类评分计算函数
 * ❌ AI改善建议生成（可复用AI服务）
 * 
 */
