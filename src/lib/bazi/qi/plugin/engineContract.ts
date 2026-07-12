/**
 * Engine Contract — P6-B 约束②
 *
 * 所有 Engine 必须声明：
 *   - 输入 (Input)
 *   - 输出 (Output)
 *   - 禁止事项 (NotAllowed)
 *   - Owner
 *
 * 任何 Engine 不得：
 *   - 重新生成命理数据（Calculator 是唯一数据源）
 *   - 修改 RuleWeight
 *   - 执行 AI 生成
 *   - 在纯渲染层执行业务计算
 */

// ═══════════════════════════════════════════════
// 基础接口
// ═══════════════════════════════════════════════

/** Engine 层级分类 */
export type EngineLayer =
  | 'calculator'    // 排盘核心 — 允许业务计算
  | 'rule-engine'   // 规则匹配 — 允许业务计算
  | 'evidence'      // 证据引用 — 纯引用，禁止计算
  | 'confidence'    // 可信度 — 允许业务计算
  | 'decision'      // 决策 — 允许业务计算
  | 'master-tone'   // 语气转换 — 纯渲染，禁止计算
  | 'explain'       // 解释 — 纯渲染，禁止计算
  | 'report'        // 报告组装 — 纯渲染，禁止计算
  | 'utility'       // 工具引擎（I18n、缓存、记录等）

/** Engine 基础接口 — 所有 Engine 必须实现 */
export interface IEngine {
  /** Engine 唯一标识 */
  readonly engineId: string
  /** Engine 层级 */
  readonly layer: EngineLayer
  /** Engine 职责描述 */
  readonly description: string
  /** Engine Owner */
  readonly owner: string
}

/** 推演类 Engine 接口 — 接收 chartData 输入 */
export interface IAnalysisEngine extends IEngine {
  readonly layer: 'calculator' | 'rule-engine' | 'evidence' | 'confidence' | 'decision'
  /** 输入类型描述 */
  readonly inputSpec: string
  /** 输出类型描述 */
  readonly outputSpec: string
  /** 禁止事项列表 */
  readonly notAllowed: string[]
}

/** 纯渲染类 Engine 接口 — 禁止业务计算 */
export interface IRenderEngine extends IEngine {
  readonly layer: 'master-tone' | 'explain' | 'report' | 'evidence'
  /** 禁止事项列表（自动包含 '业务计算'） */
  readonly notAllowed: string[]
}

// ═══════════════════════════════════════════════
// 全局禁止事项
// ═══════════════════════════════════════════════

/** 所有 Engine 的全局禁止事项 */
export const GLOBAL_PROHIBITIONS: string[] = [
  '重新生成命理数据（Calculator 是唯一数据源）',
  '修改 RuleWeight（frozen: true）',
  '执行 AI 生成内容',
  '使用 || 或 ?? 提供命理默认值（如 || "中和"）',
]

/** 纯渲染层的额外禁止事项 */
export const RENDER_LAYER_PROHIBITIONS: string[] = [
  ...GLOBAL_PROHIBITIONS,
  '执行任何业务计算',
  '执行评分、判断、比较、排序',
  '推导命理结论',
]

// ═══════════════════════════════════════════════
// 15 个核心 Engine 的 Contract 注册
// ═══════════════════════════════════════════════

export interface EngineContract {
  engineId: string
  engineName: string
  className: string
  layer: EngineLayer
  description: string
  owner: string
  inputSpec: string
  outputSpec: string
  notAllowed: string[]
  dependencies: string[]  // 依赖的其他 Engine ID
}

/** 所有 Engine Contract 注册表 */
export const ENGINE_CONTRACTS: EngineContract[] = [
  {
    engineId: 'calculator',
    engineName: '排盘核心',
    className: 'calculateBaZi',
    layer: 'calculator',
    description: '将生辰性别转换为四柱、五行、十神、旺衰、神煞',
    owner: 'Kernel',
    inputSpec: 'birthDate: string, birthTime: string, gender: string',
    outputSpec: 'BaZiChart（四柱、五行分布、十神、旺衰、神煞、纳音）',
    notAllowed: [
      '被其他模块绕过直接调用（除 PipelineEngine 外）',
    ],
    dependencies: [],
  },
  {
    engineId: 'consensus',
    engineName: '共识推演引擎',
    className: 'ConsensusEngine',
    layer: 'rule-engine',
    description: '五大流派独立推演 + 八维度共识综合',
    owner: 'Plugin',
    inputSpec: 'chartData: Record<string, unknown>',
    outputSpec: 'ConsensusEngineResult（流派分析 + 共识维度）',
    notAllowed: [
      '修改原始排盘数据',
      '执行 AI 生成内容',
    ],
    dependencies: ['calculator'],
  },
  {
    engineId: 'shenSha-filter',
    engineName: '神煞过滤引擎',
    className: 'ShenShaFilterEngine',
    layer: 'rule-engine',
    description: '从排盘结果中提取神煞，按可信度过滤',
    owner: 'Plugin',
    inputSpec: 'shenShaList: string[], chartData?: Record<string, unknown>',
    outputSpec: 'ShenShaFilterResult（过滤后神煞列表）',
    notAllowed: [
      '重新计算神煞（必须使用 Calculator 输出）',
      '修改神煞原始数据',
    ],
    dependencies: ['calculator'],
  },
  {
    engineId: 'dynasty-simulation',
    engineName: '人生轨迹推演引擎',
    className: 'DynastySimulationEngine',
    layer: 'rule-engine',
    description: '模拟 0-90+ 岁 10 个阶段的人生轨迹',
    owner: 'Plugin',
    inputSpec: 'chartData: Record<string, unknown>',
    outputSpec: 'DynastySimulationResult（10 阶段轨迹 + 古典引用）',
    notAllowed: [
      '修改排盘数据',
      'AI 生成人生建议',
    ],
    dependencies: ['calculator'],
  },
  {
    engineId: 'shiShen-graph',
    engineName: '十神关系图引擎',
    className: 'ShiShenGraphEngine',
    layer: 'rule-engine',
    description: '生成十神关系图（节点 + 边）',
    owner: 'Plugin',
    inputSpec: 'chartData: Record<string, unknown>',
    outputSpec: 'ShiShenGraphResult（节点列表 + 关系边）',
    notAllowed: [
      '重新计算十神',
    ],
    dependencies: ['calculator'],
  },
  {
    engineId: 'energy-flow',
    engineName: '五行能量引擎',
    className: 'EnergyFlowEngine',
    layer: 'rule-engine',
    description: '分析五行能量流动和平衡度',
    owner: 'Plugin',
    inputSpec: 'chartData: Record<string, unknown>',
    outputSpec: 'EnergyFlowResult（五行能量分布 + 平衡度）',
    notAllowed: [
      '重新计算五行分布',
    ],
    dependencies: ['calculator'],
  },
  {
    engineId: 'evidence',
    engineName: '证据链引擎',
    className: 'ExplainEvidenceEngine',
    layer: 'evidence',
    description: '为共识结论构建古籍证据链',
    owner: 'Plugin',
    inputSpec: 'conclusions: Array<{conclusion, dimension}>, chartData',
    outputSpec: 'ExplainEvidenceResult（EvidenceChain[] 含 ruleId/source/weight/confidence）',
    notAllowed: [
      ...RENDER_LAYER_PROHIBITIONS.slice(0, 4), // 前4项全局禁止
      '推导新的命理结论',
      '生成评分',
      '修改 Evidence 来源',
    ],
    dependencies: ['calculator', 'consensus'],
  },
  {
    engineId: 'confidence',
    engineName: '可信度引擎',
    className: 'ConfidenceEngine',
    layer: 'confidence',
    description: '评估八大维度推演可信度',
    owner: 'Plugin',
    inputSpec: 'chartData + consensusData',
    outputSpec: 'ConfidenceResult（八维度可信度 + 综合可信度）',
    notAllowed: [
      '修改排盘数据',
      '修改共识结论',
      'AI 生成可信度',
    ],
    dependencies: ['calculator', 'consensus'],
  },
  {
    engineId: 'decision',
    engineName: '决策引擎',
    className: 'DecisionEngine（内嵌于 pipelineEngine）',
    layer: 'decision',
    description: '基于可信度和推演结果生成决策建议',
    owner: 'Plugin',
    inputSpec: 'confidenceData + calculator 输出',
    outputSpec: '决策建议列表',
    notAllowed: [
      'AI 生成决策',
      '修改 RuleWeight',
    ],
    dependencies: ['calculator', 'consensus', 'confidence'],
  },
  {
    engineId: 'master-tone',
    engineName: '大师语气引擎',
    className: 'MasterToneEngine',
    layer: 'master-tone',
    description: '将文本中的 AI 词汇替换为古典表达',
    owner: 'Plugin',
    inputSpec: 'text: string（上游文本输出）',
    outputSpec: 'MasterToneResult（转换后文本）',
    notAllowed: [
      ...RENDER_LAYER_PROHIBITIONS,
    ],
    dependencies: ['explain'],
  },
  {
    engineId: 'explain',
    engineName: '解释引擎',
    className: 'ExplainV4Engine',
    layer: 'explain',
    description: '将结构化数据翻译为中文解释文本',
    owner: 'Plugin',
    inputSpec: 'chartData + consensusData（注入到 chartData）',
    outputSpec: 'ExplainV4Result（中文解释文本）',
    notAllowed: [
      ...RENDER_LAYER_PROHIBITIONS,
    ],
    dependencies: ['calculator', 'consensus'],
  },
  {
    engineId: 'report',
    engineName: '报告组装',
    className: 'assembleMasterReport（内嵌于 pipelineEngine）',
    layer: 'report',
    description: '汇总所有引擎结果，构建 7 个报告章节',
    owner: 'Plugin',
    inputSpec: '所有前序引擎输出',
    outputSpec: 'masterReport（summary + sections[] + confidence + classicalRefs）',
    notAllowed: [
      ...RENDER_LAYER_PROHIBITIONS,
      '编造默认结论（fallback 文本）',
      '在数据为空时生成填充文本',
    ],
    dependencies: ['calculator', 'consensus', 'dynasty-simulation', 'shiShen-graph', 'energy-flow', 'confidence', 'evidence', 'explain', 'master-tone'],
  },
  {
    engineId: 'case-learning',
    engineName: '案例学习引擎',
    className: 'CaseLearningEngine',
    layer: 'utility',
    description: '案例库管理（添加、匹配、学习）',
    owner: 'Plugin',
    inputSpec: 'CaseEntry',
    outputSpec: 'string（案例 ID）',
    notAllowed: [
      '修改排盘数据',
      '修改分析结论',
    ],
    dependencies: ['calculator'],
  },
  {
    engineId: 'accuracy',
    engineName: '准确率引擎',
    className: 'AccuracyEngine',
    layer: 'utility',
    description: '用户反馈记录和准确率统计',
    owner: 'Plugin',
    inputSpec: 'FeedbackRecord',
    outputSpec: 'string（记录 ID）',
    notAllowed: [
      '修改推演结果',
      '修改可信度',
    ],
    dependencies: ['confidence'],
  },
  {
    engineId: 'i18n',
    engineName: '国际化引擎',
    className: 'I18nEngine',
    layer: 'utility',
    description: '多语言翻译',
    owner: 'Plugin',
    inputSpec: 'key: string, locale?: SupportedLocale',
    outputSpec: 'string（翻译文本）',
    notAllowed: [
      '修改任何业务数据',
    ],
    dependencies: [],
  },
]

/** 根据 engineId 查找 Contract */
export function getEngineContract(engineId: string): EngineContract | undefined {
  for (var i = 0; i < ENGINE_CONTRACTS.length; i++) {
    if (ENGINE_CONTRACTS[i].engineId === engineId) {
      return ENGINE_CONTRACTS[i]
    }
  }
  return undefined
}

/** 验证 Engine 是否违反 Contract（返回违反项） */
export function validateEngineContract(contract: EngineContract, actualBehavior: string[]): string[] {
  var violations: string[] = []
  for (var i = 0; i < contract.notAllowed.length; i++) {
    for (var j = 0; j < actualBehavior.length; j++) {
      if (actualBehavior[j] === contract.notAllowed[i]) {
        violations.push(actualBehavior[j])
      }
    }
  }
  return violations
}
