/**
 * H3 Professional BaZi Engine: RuleRegistry（规则注册中心）
 *
 * 统一注册所有专业规则。
 * ProfessionalConfig 负责配置，RuleRegistry 负责注册，
 * TraceChain 负责记录，WarningCode 负责异常。
 * 四者组成整个 Professional Engine 的底层框架。
 */

import type { AlgorithmVersion, AlgorithmSource } from './types'

/** 规则分类 */
export type RuleCategory =
  | 'pillar'       // 四柱排盘
  | 'shensha'      // 神煞（Module 2）
  | 'shishen'      // 十神（Module 3）
  | 'wangshuai'    // 旺衰（Module 4）
  | 'geju'         // 格局（Module 4）
  | 'xiyong'       // 喜用神（Module 5）
  | 'dayun'        // 大运（Module 6）
  | 'liunian'      // 流年（Module 6）
  | 'fengshui'     // 风水
  | 'other'        // 其他

/** 规则注册条目 */
export interface RuleEntry {
  /** 规则唯一 ID */
  id: string
  /** 规则名称 */
  name: string
  /** 分类 */
  category: RuleCategory
  /** 算法版本 */
  algorithmVersion: AlgorithmVersion
  /** 算法来源 */
  source: AlgorithmSource
  /** 关联的 ProfessionalConfig 配置键 */
  configKey?: string
  /** 是否启用 */
  enabled: boolean
  /** 优先级（数字越大越优先） */
  priority: number
  /** 所属模块 */
  module: string
  /** 描述 */
  description?: string
}

/**
 * RuleRegistry — 规则注册中心
 *
 * 所有专业规则统一在此注册。
 * 提供 register / unregister / get / findByCategory / list / enable / disable 等操作。
 */
export class RuleRegistry {
  private rules: Map<string, RuleEntry> = new Map()

  /** 注册一条规则 */
  register(entry: RuleEntry): void {
    if (this.rules.has(entry.id)) {
      throw new Error(`Rule "${entry.id}" already registered`)
    }
    this.rules.set(entry.id, entry)
  }

  /** 批量注册 */
  registerAll(entries: RuleEntry[]): void {
    for (const entry of entries) {
      this.register(entry)
    }
  }

  /** 注销一条规则 */
  unregister(id: string): boolean {
    return this.rules.delete(id)
  }

  /** 获取规则 */
  get(id: string): RuleEntry | undefined {
    return this.rules.get(id)
  }

  /** 是否已注册 */
  has(id: string): boolean {
    return this.rules.has(id)
  }

  /** 按分类查找 */
  findByCategory(category: RuleCategory): RuleEntry[] {
    return Array.from(this.rules.values()).filter(r => r.category === category)
  }

  /** 按模块查找 */
  findByModule(module: string): RuleEntry[] {
    return Array.from(this.rules.values()).filter(r => r.module === module)
  }

  /** 列出所有 */
  list(): RuleEntry[] {
    return Array.from(this.rules.values())
  }

  /** 列出所有已启用的规则 */
  listEnabled(): RuleEntry[] {
    return this.list().filter(r => r.enabled)
  }

  /** 启用规则 */
  enable(id: string): boolean {
    const rule = this.rules.get(id)
    if (!rule) return false
    rule.enabled = true
    return true
  }

  /** 禁用规则 */
  disable(id: string): boolean {
    const rule = this.rules.get(id)
    if (!rule) return false
    rule.enabled = false
    return true
  }

  /** 已注册规则数量 */
  get size(): number {
    return this.rules.size
  }

  /** 清空（仅测试用） */
  clear(): void {
    this.rules.clear()
  }
}

// ─── 默认实例 + 内置规则注册 ───

/** 全局默认 RuleRegistry 实例 */
export const defaultRuleRegistry = new RuleRegistry()

/** Module 1 内置规则（自动注册） */
const MODULE1_BUILTIN_RULES: RuleEntry[] = [
  {
    id: 'minggong', name: '命宫', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '三命通会',
    configKey: 'mingGong', enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '月支逆数到时支落宫，五虎遁年起天干',
  },
  {
    id: 'shengong', name: '身宫', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '三命通会',
    configKey: 'shenGong', enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '月支顺数到时支落宫，五虎遁年起天干',
  },
  {
    id: 'taiyuan', name: '胎元', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '珞琭子',
    configKey: 'taiYuan', enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '月干顺进一位，月支顺进三位',
  },
  {
    id: 'taixi', name: '胎息', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '珞琭子',
    configKey: 'taiXi', enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '日干顺进一位，日支顺进三位',
  },
  {
    id: 'nayin', name: '纳音', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '协纪辨方书',
    enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '六十甲子纳音查询',
  },
  {
    id: 'kongwang', name: '空亡', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '渊海子平',
    configKey: 'kongWang', enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '日柱空亡 + 年柱空亡',
  },
  {
    id: 'changsheng', name: '十二长生', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '三命通会',
    configKey: 'changSheng', enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '阳干顺行阴干逆行，计算十二长生状态',
  },
  {
    id: 'hidden-stem', name: '藏干权重', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '渊海子平',
    configKey: 'hiddenStem', enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '本气0.6/中气0.3/余气0.1',
  },
  {
    id: 'five-element', name: '五行统计', category: 'pillar',
    algorithmVersion: 'v1.0-classic', source: '渊海子平',
    enabled: true, priority: 10,
    module: 'module1-four-pillars',
    description: '天干×1.0 + 藏干加权统计',
  },
  {
    id: 'shishen', name: '十神', category: 'shishen',
    algorithmVersion: 'v1.0-classic', source: '渊海子平',
    enabled: true, priority: 10,
    module: 'module3-day-master',
    description: '日主与天干的十神关系',
  },
]

// 自动注册到默认实例
defaultRuleRegistry.registerAll(MODULE1_BUILTIN_RULES)

/** Module 2 内置规则（自动注册） */
const MODULE2_BUILTIN_RULES: RuleEntry[] = [
  {
    id: 'shensha-engine', name: '神煞引擎', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '三命通会',
    enabled: true, priority: 20,
    module: 'module2-shensha',
    description: '可配置神煞引擎，支持38种常用神煞计算',
  },
  {
    id: 'shensha-tianyi', name: '天乙贵人', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '三命通会',
    configKey: 'shensha.tianyi', enabled: true, priority: 95,
    module: 'module2-shensha',
    description: '以日干查贵人星，甲戊庚牛羊，乙己鼠猴乡',
  },
  {
    id: 'shensha-tiande', name: '天德贵人', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '协纪辨方书',
    configKey: 'shensha.tiande', enabled: true, priority: 90,
    module: 'module2-shensha',
    description: '以月支查天德，寅月丁、卯月申等',
  },
  {
    id: 'shensha-yuede', name: '月德贵人', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '协纪辨方书',
    configKey: 'shensha.yuede', enabled: true, priority: 88,
    module: 'module2-shensha',
    description: '以月支查月德，寅午戌月丙等',
  },
  {
    id: 'shensha-wenchang', name: '文昌贵人', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '三命通会',
    configKey: 'shensha.wenchang', enabled: true, priority: 85,
    module: 'module2-shensha',
    description: '以日干查文昌，甲蛇乙马丙戊猴',
  },
  {
    id: 'shensha-taohua', name: '桃花', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '三命通会',
    configKey: 'shensha.taohua', enabled: true, priority: 80,
    module: 'module2-shensha',
    description: '申子辰见酉，寅午戌见卯等',
  },
  {
    id: 'shensha-yangren', name: '羊刃', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '三命通会',
    configKey: 'shensha.yangren', enabled: true, priority: 80,
    module: 'module2-shensha',
    description: '甲刃卯，乙刃寅，丙戊刃午等',
  },
  {
    id: 'shensha-yima', name: '驿马', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '三命通会',
    configKey: 'shensha.yima', enabled: true, priority: 78,
    module: 'module2-shensha',
    description: '寅午戌见申，巳酉丑见亥等',
  },
  {
    id: 'shensha-lushen', name: '禄神', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '渊海子平',
    configKey: 'shensha.lushen', enabled: true, priority: 88,
    module: 'module2-shensha',
    description: '甲禄寅，乙禄卯，丙戊禄巳等',
  },
  {
    id: 'shensha-huagai', name: '华盖', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '三命通会',
    configKey: 'shensha.huagai', enabled: true, priority: 72,
    module: 'module2-shensha',
    description: '寅午戌见戌，巳酉丑见丑等',
  },
  {
    id: 'shensha-conflict', name: '神煞冲突检测', category: 'shensha',
    algorithmVersion: 'v2.0-classic', source: '三命通会',
    configKey: 'shensha.conflict', enabled: true, priority: 50,
    module: 'module2-shensha',
    description: '检测羊刃-飞刃、孤辰-寡宿等冲突',
  },
]

// 自动注册 Module 2 规则
defaultRuleRegistry.registerAll(MODULE2_BUILTIN_RULES)

/** Module 3 内置规则（自动注册） */
const MODULE3_BUILTIN_RULES: RuleEntry[] = [
  {
    id: 'ten-gods-engine', name: '十神引擎总控', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 20,
    module: 'module3-ten-gods',
    description: '十神引擎总控，协调十神计算、透藏分析、旺相休囚死、得令得地得势、关系网络、组合匹配等子模块',
  },
  {
    id: 'ten-gods-bijie', name: '比劫', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module3-ten-gods',
    description: '比肩、劫财——与日主同五行的十神，论兄弟、竞争、财源劫夺',
  },
  {
    id: 'ten-gods-shi-shang', name: '食伤', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module3-ten-gods',
    description: '食神、伤官——日主所生之五行，论才华、表达、子女、叛逆',
  },
  {
    id: 'ten-gods-cai-xing', name: '财星', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module3-ten-gods',
    description: '正财、偏财——日主所克之五行，论财富、父亲、妻子、物质',
  },
  {
    id: 'ten-gods-guan-sha', name: '官杀', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module3-ten-gods',
    description: '正官、七杀——克日主之五行，论事业、权力、压力、女命丈夫',
  },
  {
    id: 'ten-gods-yin-xing', name: '印星', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module3-ten-gods',
    description: '正印、偏印——生日主之五行，论学历、母亲、贵人、保护',
  },
  {
    id: 'ten-gods-wang-shuai', name: '旺相休囚死', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 85,
    module: 'module3-ten-gods',
    description: '以月令为基准判断十神五行的旺相休囚死状态，决定十神力量层次',
  },
  {
    id: 'ten-gods-de-ling-di-shi', name: '得令得地得势', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 85,
    module: 'module3-ten-gods',
    description: '综合月令（得令）、地支藏干（得地）、天干帮扶（得势）三维度评估十神实际力量',
  },
  {
    id: 'ten-gods-relations', name: '十神关系规则库', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 80,
    module: 'module3-ten-gods',
    description: '十神之间生克合冲刑害等关系规则，共15条关系规则，构建十神关系网络',
  },
  {
    id: 'ten-gods-combinations', name: '十神组合规则库', category: 'shishen',
    algorithmVersion: 'v3.0-classic', source: '子平真诠',
    enabled: true, priority: 80,
    module: 'module3-ten-gods',
    description: '经典十神组合格局规则，如食神生财、财生官杀、杀印相生等，共15条组合规则',
  },
]

// 自动注册 Module 3 规则
defaultRuleRegistry.registerAll(MODULE3_BUILTIN_RULES)

// ─── Module 4 内置规则（格局引擎） ───

const MODULE4_BUILTIN_RULES: RuleEntry[] = [
  {
    id: 'pattern-engine', name: '格局引擎总控', category: 'geju',
    algorithmVersion: 'v4.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module4-pattern',
    description: '格局引擎总控，协调月令定格、多流派判定、评分、破格检测等子模块',
  },
  {
    id: 'pattern-zheng-gua', name: '正格规则库', category: 'geju',
    algorithmVersion: 'v4.0-classic', source: '子平真诠',
    enabled: true, priority: 85,
    module: 'module4-pattern',
    description: '10种正格规则：正官格、七杀格、正印格、偏印格、正财格、偏财格、食神格、伤官格、建禄格、月刃格',
  },
  {
    id: 'pattern-special-gua', name: '特殊格规则库', category: 'geju',
    algorithmVersion: 'v4.0-classic', source: '穷通宝鉴',
    enabled: true, priority: 80,
    module: 'module4-pattern',
    description: '10种特殊格规则：从格、专旺格、化气格、炎上格、润下格、稼穑格、曲直格、从儿格、从财格、从杀格',
  },
  {
    id: 'pattern-multi-school', name: '多流派支持', category: 'geju',
    algorithmVersion: 'v4.0-classic', source: '子平',
    enabled: true, priority: 75,
    module: 'module4-pattern',
    description: '支持子平、滴天髓、子平真诠、穷通宝鉴四派并行判定，加权综合',
  },
  {
    id: 'pattern-break-check', name: '破格检测', category: 'geju',
    algorithmVersion: 'v4.0-classic', source: '子平真诠',
    enabled: true, priority: 70,
    module: 'module4-pattern',
    description: '成格后的破格因素检测：伤官见官、比劫夺财、财破印、七杀无制等',
  },
]

// 自动注册 Module 4 规则
defaultRuleRegistry.registerAll(MODULE4_BUILTIN_RULES)

// ─── Module 5 内置规则（喜用神引擎） ───

const MODULE5_BUILTIN_RULES: RuleEntry[] = [
  {
    id: 'xiyong-engine', name: '喜用神引擎总控', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module5-xiyong',
    description: '喜用神引擎总控，协调日主强弱判定、喜用神分组、调候分析、扶抑分析、多流派喜用神等子模块',
  },
  {
    id: 'xiyong-strength', name: '日主强弱判定', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '滴天髓',
    enabled: true, priority: 95,
    module: 'module5-xiyong',
    description: '综合月令得令、通根得地、天干帮扶、十神力量、五行比例、格局辅助、神煞辅助七维度判定日主强弱',
  },
  {
    id: 'xiyong-xishen', name: '喜神判定', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module5-xiyong',
    description: '判定喜神列表，含优先级、来源、原因、古籍依据、可信度',
  },
  {
    id: 'xiyong-yongshen', name: '用神判定', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module5-xiyong',
    description: '判定用神列表，说明选它理由、为什么不选其他、依据哪条规则、引用哪本古籍',
  },
  {
    id: 'xiyong-jishen', name: '忌神判定', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '滴天髓',
    enabled: true, priority: 85,
    module: 'module5-xiyong',
    description: '判定忌神列表，含危险等级、风险评分',
  },
  {
    id: 'xiyong-climate', name: '调候分析', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '穷通宝鉴',
    enabled: true, priority: 85,
    module: 'module5-xiyong',
    description: '基于穷通宝鉴调候原则，判断寒暖燥湿，输出调候评分、需求、方案',
  },
  {
    id: 'xiyong-fuyi', name: '扶抑分析', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '子平真诠',
    enabled: true, priority: 80,
    module: 'module5-xiyong',
    description: '扶抑法、调候法、病药法、通关法、专旺法、从格法六种方法独立评分',
  },
  {
    id: 'xiyong-balance', name: '五行平衡', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '滴天髓',
    enabled: true, priority: 80,
    module: 'module5-xiyong',
    description: '五行力量分布与平衡分析，作为喜用神判定的基础',
  },
  {
    id: 'xiyong-conflict', name: '流派冲突解析', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '子平真诠',
    enabled: true, priority: 75,
    module: 'module5-xiyong',
    description: 'XiYongConflictResolver，处理多流派喜用神不一致时的综合排序',
  },
  {
    id: 'xiyong-trace', name: '喜用神推导链', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '子平真诠',
    enabled: true, priority: 70,
    module: 'module5-xiyong',
    description: '喜用神判定全流程推导链记录，确保每个结果可追溯',
  },
  {
    id: 'xiyong-explain', name: '喜用神AI解释', category: 'xiyong',
    algorithmVersion: 'v5.0-classic', source: '滴天髓',
    enabled: true, priority: 70,
    module: 'module5-xiyong',
    description: '喜用神结构化AI解释，含古籍依据、现代解释、事业/财富/婚姻/健康建议',
  },
]

// 自动注册 Module 5 规则
defaultRuleRegistry.registerAll(MODULE5_BUILTIN_RULES)

// ─── Module 6 内置规则（大运流年引擎） ───

const MODULE6_BUILTIN_RULES: RuleEntry[] = [
  {
    id: 'fortune-engine', name: '大运流年引擎总控', category: 'dayun',
    algorithmVersion: 'v6.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module6-fortune',
    description: '大运流年引擎总控，协调起运计算、大运排盘、流年分析、事件检测、多维评分',
  },
  {
    id: 'fortune-qiyun', name: '起运年龄计算', category: 'dayun',
    algorithmVersion: 'v6.0-classic', source: '渊海子平',
    enabled: true, priority: 90,
    module: 'module6-fortune',
    description: '支持男女顺逆、节气起运、真太阳时修正，多起运算法兼容',
  },
  {
    id: 'fortune-dayun', name: '十年大运排盘', category: 'dayun',
    algorithmVersion: 'v6.0-classic', source: '子平真诠',
    enabled: true, priority: 88,
    module: 'module6-fortune',
    description: '大运干支、纳音、十神、十二长生、神煞、五行力量、与原局/格局/喜用神关系',
  },
  {
    id: 'fortune-liunian', name: '流年分析', category: 'liunian',
    algorithmVersion: 'v6.0-classic', source: '滴天髓',
    enabled: true, priority: 88,
    module: 'module6-fortune',
    description: '流年干支、十神、神煞、五行力量、与原局/大运三层关系分析',
  },
  {
    id: 'fortune-relation', name: '作用关系检测', category: 'dayun',
    algorithmVersion: 'v6.0-classic', source: '三命通会',
    enabled: true, priority: 85,
    module: 'module6-fortune',
    description: '冲、刑、害、破、合、三合、三会、六合、天干五合、干冲、伏吟、反吟、岁运并临检测',
  },
  {
    id: 'fortune-event', name: '事件引擎', category: 'liunian',
    algorithmVersion: 'v6.0-classic', source: '穷通宝鉴',
    enabled: true, priority: 85,
    module: 'module6-fortune',
    description: '事业/财运/婚姻/恋爱/子女/考试/升迁/创业/疾病/官非/破财/搬迁/出国/购房/投资事件检测',
  },
  {
    id: 'fortune-score', name: '多维评分系统', category: 'liunian',
    algorithmVersion: 'v6.0-classic', source: '滴天髓',
    enabled: true, priority: 80,
    module: 'module6-fortune',
    description: 'FortuneScore/LuckScore/CareerScore/WealthScore/HealthScore/StudyScore/OpportunityScore/RiskScore',
  },
  {
    id: 'fortune-xiyong-relation', name: '喜用神关系分析', category: 'dayun',
    algorithmVersion: 'v6.0-classic', source: '子平真诠',
    enabled: true, priority: 85,
    module: 'module6-fortune',
    description: '大运/流年五行与喜用神的关系判定',
  },
  {
    id: 'fortune-pattern-relation', name: '格局关系分析', category: 'dayun',
    algorithmVersion: 'v6.0-classic', source: '子平真诠',
    enabled: true, priority: 80,
    module: 'module6-fortune',
    description: '大运/流年与格局的引动关系判定',
  },
  {
    id: 'fortune-explain', name: '大运流年AI解释', category: 'liunian',
    algorithmVersion: 'v6.0-classic', source: '滴天髓',
    enabled: true, priority: 70,
    module: 'module6-fortune',
    description: '每一年输出古籍依据、白话解释、风险、机会、建议、调整方案',
  },
  {
    id: 'fortune-trace', name: '大运流年推导链', category: 'dayun',
    algorithmVersion: 'v6.0-classic', source: '子平真诠',
    enabled: true, priority: 70,
    module: 'module6-fortune',
    description: '大运流年判定全流程推导链记录',
  },
  {
    id: 'fortune-suijun', name: '太岁与岁运并临', category: 'liunian',
    algorithmVersion: 'v6.0-classic', source: '三命通会',
    enabled: true, priority: 85,
    module: 'module6-fortune',
    description: '太岁判定、岁运并临检测',
  },
]

// 自动注册 Module 6 规则
defaultRuleRegistry.registerAll(MODULE6_BUILTIN_RULES)

// ═══════════════════════════════════════════
// Module 7: Professional AI Report Engine — 内置规则
// ═══════════════════════════════════════════

const MODULE7_BUILTIN_RULES: Array<{
  id: string; name: string; category: RuleCategory;
  algorithmVersion: AlgorithmVersion; source: AlgorithmSource;
  enabled: boolean; priority: number; module: string; description?: string;
}> = [
  {
    id: 'master-cross-validation', name: '多模块交叉验证', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '子平真诠',
    enabled: true, priority: 90,
    module: 'module7-master',
    description: '格局/十神/喜用神/神煞/大运五模块交叉验证',
  },
  {
    id: 'master-overall-assessment', name: '命局总评生成', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '滴天髓',
    enabled: true, priority: 88,
    module: 'module7-master',
    description: '综合六模块数据生成命局总评',
  },
  {
    id: 'master-five-dimension', name: '人生五维评分', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '三命通会',
    enabled: true, priority: 86,
    module: 'module7-master',
    description: '事业/财富/婚姻/健康/学业五维度 0-100 评分',
  },
  {
    id: 'master-timeline', name: '人生时间轴', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '滴天髓',
    enabled: true, priority: 84,
    module: 'module7-master',
    description: '儿童/青年/中年/晚年四阶段时间轴生成',
  },
  {
    id: 'master-risk-detect', name: '风险识别引擎', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '神峰通考',
    enabled: true, priority: 82,
    module: 'module7-master',
    description: '事业/投资/婚姻/健康/官非/财务六维风险识别',
  },
  {
    id: 'master-opportunity-detect', name: '机会识别引擎', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '渊海子平',
    enabled: true, priority: 80,
    module: 'module7-master',
    description: '事业/创业/投资/婚恋/学习/迁移六维机会识别',
  },
  {
    id: 'master-recommendation', name: '建议生成引擎', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '穷通宝鉴',
    enabled: true, priority: 78,
    module: 'module7-master',
    description: '职业/行业/城市/颜色/数字/方位/五行补救/风水/生活九类建议',
  },
  {
    id: 'master-explain', name: 'AI 解释引擎', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '三命通会',
    enabled: true, priority: 76,
    module: 'module7-master',
    description: '基于多模块数据的 AI 解释生成',
  },
  {
    id: 'master-report-integrate', name: 'MasterReport 整合', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '滴天髓',
    enabled: true, priority: 92,
    module: 'module7-master',
    description: 'Module 1~6 数据整合为统一 MasterReport',
  },
  {
    id: 'master-data-aggregation', name: '数据聚合层', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '子平真诠',
    enabled: true, priority: 94,
    module: 'module7-master',
    description: '统一调用 Module 1~6 引擎输出，禁止重复计算',
  },
  {
    id: 'master-no-recalc', name: '禁止重复计算约束', category: 'other',
    algorithmVersion: 'v7.0-classic', source: 'Modern Rule',
    enabled: true, priority: 96,
    module: 'module7-master',
    description: 'Module 7 不执行任何命理算法计算，仅整合和推理',
  },
  {
    id: 'master-explain-kb', name: 'AI 解释知识库', category: 'other',
    algorithmVersion: 'v7.0-classic', source: '三命通会',
    enabled: true, priority: 74,
    module: 'module7-master',
    description: '12 个主题的古籍/现代/专业/通俗四层解释知识库',
  },
]

// 自动注册 Module 7 规则
defaultRuleRegistry.registerAll(MODULE7_BUILTIN_RULES)

// ═══════════════════════════════════════════
// Module 8: Professional Report Export Engine — 内置规则
// ═══════════════════════════════════════════

const MODULE8_BUILTIN_RULES: Array<{
  id: string; name: string; category: RuleCategory;
  algorithmVersion: AlgorithmVersion; source: AlgorithmSource;
  enabled: boolean; priority: number; module: string; description?: string;
}> = [
  {
    id: 'report-template-engine', name: '模板引擎', category: 'other',
    algorithmVersion: 'v8.0-classic', source: 'Modern Rule',
    enabled: true, priority: 70,
    module: 'module8-report',
    description: '5 种报告模板（专业/古籍/现代/简洁/VIP）切换引擎',
  },
  {
    id: 'report-section-gen', name: '章节生成器', category: 'other',
    algorithmVersion: 'v8.0-classic', source: 'Modern Rule',
    enabled: true, priority: 68,
    module: 'module8-report',
    description: '15 章节自动生成（封面至附录）',
  },
  {
    id: 'report-chart-gen', name: '图表生成器', category: 'other',
    algorithmVersion: 'v8.0-classic', source: 'Modern Rule',
    enabled: true, priority: 66,
    module: 'module8-report',
    description: '7 种图表（五行/十神/雷达/趋势/时间轴/评分/风险）',
  },
  {
    id: 'report-export', name: '多格式导出', category: 'other',
    algorithmVersion: 'v8.0-classic', source: 'Modern Rule',
    enabled: true, priority: 64,
    module: 'module8-report',
    description: 'PDF/HTML/Markdown/JSON/打印 5 种导出格式',
  },
  {
    id: 'report-branding', name: '品牌化', category: 'other',
    algorithmVersion: 'v8.0-classic', source: 'Modern Rule',
    enabled: true, priority: 62,
    module: 'module8-report',
    description: 'Logo/水印/二维码/版权/版本号/报告编号',
  },
  {
    id: 'report-i18n', name: '国际化', category: 'other',
    algorithmVersion: 'v8.0-classic', source: 'Modern Rule',
    enabled: true, priority: 60,
    module: 'module8-report',
    description: '中文（默认）+ 英文（预留）国际化支持',
  },
  {
    id: 'report-no-calc', name: '禁止命理计算约束', category: 'other',
    algorithmVersion: 'v8.0-classic', source: 'Modern Rule',
    enabled: true, priority: 96,
    module: 'module8-report',
    description: 'Module 8 不参与任何命理计算，所有数据来自 Module 7 MasterReport',
  },
  {
    id: 'report-cache', name: '报告缓存', category: 'other',
    algorithmVersion: 'v8.0-classic', source: 'Modern Rule',
    enabled: true, priority: 58,
    module: 'module8-report',
    description: '报告缓存机制，版本 v8.0.0',
  },
]

// 自动注册 Module 8 规则
defaultRuleRegistry.registerAll(MODULE8_BUILTIN_RULES)

// ═══════════════════════════════════════════════════════════════════════════
// V4.5 Case Library 规则
// ═══════════════════════════════════════════════════════════════════════════

const V45_CASE_LIBRARY_RULES: RuleEntry[] = [
  {
    id: 'case-regression',
    name: '命例回归验证',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Modern Rule',
    enabled: true,
    priority: 100,
    module: 'v45-case-library',
    description: '遍历命例库进行数据完整性验证与回归统计，自回归模式验证 expectedResult 字段',
  },
  {
    id: 'case-field-comparison',
    name: '字段级比对',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Modern Rule',
    enabled: true,
    priority: 90,
    module: 'v45-case-library',
    description: '逐字段比对系统结果与预期结果，生成 FieldComparison 记录',
  },
  {
    id: 'case-consistency-rate',
    name: '一致率统计',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Modern Rule',
    enabled: true,
    priority: 80,
    module: 'v45-case-library',
    description: '统计命例验证通过率，按类别/总体生成一致率',
  },
]

defaultRuleRegistry.registerAll(V45_CASE_LIBRARY_RULES)

// ═══════════════════════════════════════════════════════════════════════════
// V4.5 Knowledge Base + Expert Validation 规则
// ═══════════════════════════════════════════════════════════════════════════

const V45_KB_EXPERT_RULES: RuleEntry[] = [
  {
    id: 'kb-knowledge-base',
    name: '命理知识库',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Modern Rule',
    enabled: true,
    priority: 100,
    module: 'v45-knowledge-base',
    description: '统一命理知识中心，存储古籍原文与现代解释，为所有模块提供数据来源',
  },
  {
    id: 'kb-expert-validation',
    name: '专家验证中心',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 100,
    module: 'v45-expert-validation',
    description: '多专家审核机制，支持 ReviewStatus 工作流和 Difference Analyzer',
  },
  {
    id: 'kb-learning-queue',
    name: '学习队列',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 80,
    module: 'v45-expert-validation',
    description: '争议案例自动入队，按优先级排序，后续版本统一重验',
  },
  {
    id: 'kb-regression-lock',
    name: '回归锁',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 90,
    module: 'v45-expert-validation',
    description: '专家确认案例自动锁定，版本升级结果变化自动报警',
  },
  {
    id: 'kb-quality-gate',
    name: '质量门禁',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Modern Rule',
    enabled: true,
    priority: 100,
    module: 'v50-quality-gate',
    description: '自动执行14项质量检查，评估9维健康评分，决定是否允许发布',
  },
]

defaultRuleRegistry.registerAll(V45_KB_EXPERT_RULES)

// ═══════════════════════════════════════════════════════════════════════════
// V5.0 Phase 4 规则（八大模块）
// ═══════════════════════════════════════════════════════════════════════════

const V50_PHASE4_RULES: RuleEntry[] = [
  // ---- Module A: Professional Review Center ----
  {
    id: 'phase4-review-workflow',
    name: '专家审核工作流',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 100,
    module: 'phase4-review',
    description: '管理命例审核全流程：待审核→审核通过/退回修改/争议/废弃',
  },
  {
    id: 'phase4-review-revision',
    name: '审核修订追踪',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 90,
    module: 'phase4-review',
    description: '记录每次审核修订的历史，支持版本回溯',
  },

  // ---- Module B: AI vs Expert Compare ----
  {
    id: 'phase4-compare-engine',
    name: 'AI vs 专家对比引擎',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 95,
    module: 'phase4-compare',
    description: '对比 AI 分析结果与人工专家结论，计算一致率',
  },
  {
    id: 'phase4-compare-agreement',
    name: '专家一致性分析',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 90,
    module: 'phase4-compare',
    description: '分析多位专家之间的一致性，识别分歧领域',
  },
  {
    id: 'phase4-compare-divergence',
    name: '分歧原因定位',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 85,
    module: 'phase4-compare',
    description: '定位 AI 与专家分歧的具体位置和原因',
  },

  // ---- Module C: Confidence Calibration ----
  {
    id: 'phase4-trust-score',
    name: 'Final Trust Score',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 100,
    module: 'phase4-trust',
    description: '综合 5 维度加权计算 Final Trust Score（0-100）',
  },
  {
    id: 'phase4-trust-reliability',
    name: '可靠性评估',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 90,
    module: 'phase4-trust',
    description: '基于数据质量和计算稳定性评估可靠性',
  },
  {
    id: 'phase4-trust-consensus',
    name: '专家共识度',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 90,
    module: 'phase4-trust',
    description: '多位专家结论的共识度（权重 0.30）',
  },
  {
    id: 'phase4-trust-evidence',
    name: '证据评分',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 85,
    module: 'phase4-trust',
    description: '古籍引用和规则依据的充分性评分',
  },
  {
    id: 'phase4-trust-regression',
    name: '回归稳定性',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 85,
    module: 'phase4-trust',
    description: '跨版本回归测试的一致性评分',
  },

  // ---- Module D: Ancient Classics Validator ----
  {
    id: 'phase4-classics-validate',
    name: '古籍引用验证',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: '滴天髓',
    enabled: true,
    priority: 95,
    module: 'phase4-classics',
    description: '验证每条 AI 解释是否有古籍依据支持',
  },
  {
    id: 'phase4-classics-coverage',
    name: '古籍覆盖率检查',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: '子平真诠',
    enabled: true,
    priority: 90,
    module: 'phase4-classics',
    description: '检查分析报告对七大古籍的引用覆盖情况',
  },
  {
    id: 'phase4-classics-confidence',
    name: '引用置信度评估',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: '三命通会',
    enabled: true,
    priority: 85,
    module: 'phase4-classics',
    description: '评估古籍引用的置信度等级',
  },
  {
    id: 'phase4-classics-reference',
    name: '引用推荐引擎',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: '穷通宝鉴',
    enabled: true,
    priority: 80,
    module: 'phase4-classics',
    description: '为缺少引用的分析结果推荐合适的古籍依据',
  },

  // ---- Module E: Conflict Analyzer ----
  {
    id: 'phase4-conflict-cross-module',
    name: '跨模块冲突检测',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 95,
    module: 'phase4-conflict',
    description: '检测十神/格局/喜用神/流年等模块之间的结论冲突',
  },
  {
    id: 'phase4-conflict-priority',
    name: '冲突优先级判定',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 90,
    module: 'phase4-conflict',
    description: '根据冲突严重程度判定处理优先级',
  },
  {
    id: 'phase4-conflict-resolve',
    name: '冲突解决方案',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: '子平真诠',
    enabled: true,
    priority: 85,
    module: 'phase4-conflict',
    description: '提供冲突原因解释和最终裁夺建议',
  },
  {
    id: 'phase4-conflict-strength-pattern',
    name: '强弱-格局一致性',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: '滴天髓',
    enabled: true,
    priority: 88,
    module: 'phase4-conflict',
    description: '检测日主强弱判定与格局类型的一致性',
  },
  {
    id: 'phase4-conflict-strength-xiyong',
    name: '强弱-喜用神一致性',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: '子平真诠',
    enabled: true,
    priority: 88,
    module: 'phase4-conflict',
    description: '检测日主强弱与喜用神选择的一致性',
  },

  // ---- Module F: Professional Benchmark ----
  {
    id: 'phase4-benchmark-register',
    name: '行业基准注册',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 90,
    module: 'phase4-benchmark',
    description: '注册外部行业基准数据源（问真/子平八字/匿名专家等）',
  },
  {
    id: 'phase4-benchmark-compare',
    name: '行业对比引擎',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 95,
    module: 'phase4-benchmark',
    description: '对比玄风门与行业平均的一致率差异',
  },
  {
    id: 'phase4-benchmark-agreement',
    name: '行业一致率统计',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 85,
    module: 'phase4-benchmark',
    description: '统计与各行业基准源的一致率',
  },

  // ---- Module G: Engine Reliability Dashboard ----
  {
    id: 'phase4-dashboard-engine',
    name: '引擎可靠性驾驶舱',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 100,
    module: 'phase4-dashboard',
    description: '10 板块实时统计：规则/置信度/回归/性能/缓存/知识/审核/案例/健康/信任',
  },
  {
    id: 'phase4-dashboard-snapshot',
    name: '驾驶舱快照',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 80,
    module: 'phase4-dashboard',
    description: '生成引擎状态快照，供历史对比',
  },
  {
    id: 'phase4-dashboard-readiness',
    name: '引擎就绪度评估',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 95,
    module: 'phase4-dashboard',
    description: '综合评估引擎是否达到发布就绪标准',
  },

  // ---- Module H: Release Certification ----
  {
    id: 'phase4-cert-release',
    name: '企业发布认证',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 100,
    module: 'phase4-certification',
    description: '6 项检查（性能/回归/专家/知识/覆盖率/健康）生成企业级发布证书',
  },
  {
    id: 'phase4-cert-validate',
    name: '证书验证',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 90,
    module: 'phase4-certification',
    description: '验证发布证书的有效性和完整性',
  },
  {
    id: 'phase4-cert-revoke',
    name: '证书撤销',
    category: 'other',
    algorithmVersion: 'v1.0.0',
    source: 'Expert System',
    enabled: true,
    priority: 85,
    module: 'phase4-certification',
    description: '在发现严重问题时撤销发布证书',
  },
]

defaultRuleRegistry.registerAll(V50_PHASE4_RULES)
