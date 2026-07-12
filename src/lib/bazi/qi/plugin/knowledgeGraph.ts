/**
 * KnowledgeGraph — P3.9 命理知识图谱引擎
 *
 * 核心设计：知识图谱 = 节点(Node) + 关系(Edge)
 * 支持 Explain V3 智能推理、避免重复描述
 *
 * 特性：
 *   - 纯 Plugin，不修改 Kernel
 *   - import type 仅导入类型
 *   - 所有文本中文字符串
 *   - pick() / pickN() 随机选择器避免模板化
 *   - 图谱结构支持 Explain 智能推理、避免重复描述
 */

import type { FiveElement } from '../../types'

// ─── 工具函数 ───

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

// ─── 类型定义 ───

/** 节点类型 */
export type KGNodeType =
  | 'shiShen'      // 十神
  | 'geJu'         // 格局
  | 'wangShuai'    // 旺衰
  | 'tiaoHou'      // 调候
  | 'bingYao'      // 病药
  | 'tongGuan'     // 通关
  | 'guJi'         // 古籍
  | 'shenSha'      // 神煞
  | 'case'         // 案例
  | 'wuXing'       // 五行
  | 'dayMaster'    // 日主

/** 节点 */
export interface KGNode {
  id: string               // 唯一ID，如 "shiShen:比肩"
  type: KGNodeType
  name: string             // 显示名，如 "比肩"
  aliases: string[]        // 别名，如 ["比肩", "建禄"]
  attributes: Record<string, string | number | boolean | string[]>
  description: string      // 描述
  source?: string          // 来源古籍
}

/** 关系类型 */
export type KGEdgeType =
  | 'belongs_to'      // 从属：比肩 belongs_to 比劫
  | 'generates'       // 相生：木 generates 火
  | 'overcomes'       // 相克：木 overcomes 土
  | 'requires'        // 需要：偏财格 requires 财星透干
  | 'conflicts_with'  // 冲突：身弱 conflicts_with 财多
  | 'resolves'        // 化解：通关 resolves 五行交战
  | 'cited_in'        // 引用：用神 cited_in 滴天髓
  | 'similar_to'      // 相似：正官格 similar_to 七杀格
  | 'exemplified_in'  // 例证：偏财格 exemplified_in 乾隆帝命造
  | 'affects'         // 影响：木旺 affects 肝胆健康
  | 'produces'        // 产出：身旺 produces 比劫过旺风险
  | 'relates_to'      // 关联：通用关联

/** 边 */
export interface KGEdge {
  id: string
  source: string         // 源节点ID
  target: string         // 目标节点ID
  type: KGEdgeType
  weight: number         // 0-1 关系强度
  description: string    // 关系描述
  bidirectional?: boolean // 是否双向
}

/** 子图（用于Explain引用） */
export interface KGSubGraph {
  nodes: KGNode[]
  edges: KGEdge[]
  centralNode: string    // 中心节点ID
  summary: string        // 子图摘要
}

/** 推理结果（智能推理） */
export interface KGInference {
  sourceNodes: string[]     // 推理来源节点
  inference: string        // 推理结论
  confidence: number       // 0-100
  relatedEdges: string[]   // 相关边ID
  classicalRef?: string     // 古籍引用
}

/** 图谱查询结果 */
export interface KGQueryResult {
  nodes: KGNode[]
  edges: KGEdge[]
  subGraphs: KGSubGraph[]
  inferred: KGInference[]    // 推理出的知识
  summary: string
}

/** Explain V3 引用的上下文 */
export interface ExplainKGContext {
  dayGan?: string
  dayElement?: string
  geJuName?: string
  strengthLevel?: string
  yongShen?: string
  knownTopics?: string[]  // 已讲解的话题（避免重复描述）
}

// ─── 知识图谱引擎 ───

export class KnowledgeGraph {
  private nodes: Map<string, KGNode> = new Map()
  private edges: Map<string, KGEdge> = new Map()
  private adjacencyList: Map<string, Set<string>> = new Map()

  constructor() {
    this.initNodes()
    this.initEdges()
    this.buildAdjacency()
  }

  // ───────────────────── 初始化内置知识库 ─────────────────────

  private initNodes(): void {
    // === 五行节点(5个) ===
    const wuXingNodes: KGNode[] = [
      {
        id: 'wuXing:木', type: 'wuXing', name: '木', aliases: ['木', '甲乙'],
        attributes: {
          generates: '火', overcomes: '土', season: '春季', direction: '东方',
          color: '青绿', organ: '肝胆', emotion: '怒', taste: '酸',
          phase: '生发', yinYang: '阳'
        },
        description: '木主生发、条达，对应春季东方，与人体的肝胆系统密切相关。木性仁慈，主仁。',
        source: '《滴天髓》'
      },
      {
        id: 'wuXing:火', type: 'wuXing', name: '火', aliases: ['火', '丙丁'],
        attributes: {
          generates: '土', overcomes: '金', season: '夏季', direction: '南方',
          color: '赤红', organ: '心脏小肠', emotion: '喜', taste: '苦',
          phase: '炎上', yinYang: '阴'
        },
        description: '火主炎上、光明，对应夏季南方，与人体的心脏、小肠系统相关。火性礼仪，主礼。',
        source: '《滴天髓》'
      },
      {
        id: 'wuXing:土', type: 'wuXing', name: '土', aliases: ['土', '戊己'],
        attributes: {
          generates: '金', overcomes: '水', season: '四季末', direction: '中央',
          color: '黄', organ: '脾胃', emotion: '思', taste: '甘',
          phase: '稼穑', yinYang: '中'
        },
        description: '土主承载、化育，对应中央及四季交替之时，与人体的脾胃系统相关。土性信实，主信。',
        source: '《滴天髓》'
      },
      {
        id: 'wuXing:金', type: 'wuXing', name: '金', aliases: ['金', '庚辛'],
        attributes: {
          generates: '水', overcomes: '木', season: '秋季', direction: '西方',
          color: '白', organ: '肺大肠', emotion: '悲', taste: '辛',
          phase: '从革', yinYang: '阳'
        },
        description: '金主收敛、肃杀，对应秋季西方，与人体的肺、大肠系统相关。金性义气，主义。',
        source: '《滴天髓》'
      },
      {
        id: 'wuXing:水', type: 'wuXing', name: '水', aliases: ['水', '壬癸'],
        attributes: {
          generates: '木', overcomes: '火', season: '冬季', direction: '北方',
          color: '黑', organ: '肾膀胱', emotion: '恐', taste: '咸',
          phase: '润下', yinYang: '阴'
        },
        description: '水主润下、智慧，对应冬季北方，与人体的肾、膀胱系统相关。水性聪明，主智。',
        source: '《滴天髓》'
      }
    ]

    // === 十神节点(10个) ===
    const shiShenNodes: KGNode[] = [
      {
        id: 'shiShen:比肩', type: 'shiShen', name: '比肩',
        aliases: ['比肩', '建禄', '禄神'],
        attributes: {
          group: '比劫', relationship: '兄弟', direction: '同我者',
          fortune: '中性', yinYang: '同阴阳',
          elementRelation: '同五行同阴阳',
          personality: '独立自主、意志坚定、自尊心强'
        },
        description: '比肩为日主同类同阴阳之五行，代表兄弟、同辈、竞争对手。比肩过旺则争财夺利，比肩适中则独立自主。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:劫财', type: 'shiShen', name: '劫财',
        aliases: ['劫财', '羊刃', '败财'],
        attributes: {
          group: '比劫', relationship: '兄弟', direction: '同我者',
          fortune: '偏凶', yinYang: '异阴阳',
          elementRelation: '同五行异阴阳',
          personality: '冲动好斗、讲义气、竞争心强'
        },
        description: '劫财为日主同类异阴阳之五行，代表兄弟、劫夺之象。劫财之性刚烈，过旺则破财克妻，适宜从事竞争性行业。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:食神', type: 'shiShen', name: '食神',
        aliases: ['食神', '寿星', '进神'],
        attributes: {
          group: '食伤', relationship: '子女', direction: '我生者',
          fortune: '吉', yinYang: '同阴阳',
          elementRelation: '日主所生同阴阳',
          personality: '温和有福气、注重生活品质、才华横溢'
        },
        description: '食神为日主所生且同阴阳之五行，代表子女、才华、口福。食神为吉神，主才华横溢、衣食无忧、性格温和。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:伤官', type: 'shiShen', name: '伤官',
        aliases: ['伤官', '伶官', '桃花星'],
        attributes: {
          group: '食伤', relationship: '子女', direction: '我生者',
          fortune: '凶（有制化则吉）', yinYang: '异阴阳',
          elementRelation: '日主所生异阴阳',
          personality: '聪明绝顶、恃才傲物、追求自由'
        },
        description: '伤官为日主所生且异阴阳之五行，代表才艺、叛逆精神。伤官能生财亦能克官，为命理中最为复杂的星曜之一。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:偏财', type: 'shiShen', name: '偏财',
        aliases: ['偏财', '横财', '众财'],
        attributes: {
          group: '财星', relationship: '父亲、情人', direction: '我克者',
          fortune: '吉', yinYang: '异阴阳',
          elementRelation: '日主所克异阴阳',
          personality: '慷慨大方、善于交际、财运亨通'
        },
        description: '偏财为日主所克且异阴阳之五行，代表偏财之运、父亲、情人。偏财之人善于理财，慷慨大方，人缘极佳。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:正财', type: 'shiShen', name: '正财',
        aliases: ['正财', '本财', '财星'],
        attributes: {
          group: '财星', relationship: '妻子', direction: '我克者',
          fortune: '吉', yinYang: '同阴阳',
          elementRelation: '日主所克同阴阳',
          personality: '勤劳务实、节俭持家、脚踏实地'
        },
        description: '正财为日主所克且同阴阳之五行，代表正当之财、妻子。正财主勤劳致富，为人生安身立命之本。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:七杀', type: 'shiShen', name: '七杀',
        aliases: ['七杀', '偏官', '杀星', '将星'],
        attributes: {
          group: '官杀', relationship: '儿子、小人', direction: '克我者',
          fortune: '凶（有制化则大贵）', yinYang: '异阴阳',
          elementRelation: '克日主异阴阳',
          personality: '威严果断、有魄力、压力重重'
        },
        description: '七杀为克日主且异阴阳之五行，代表权威、压力、小人之力。七杀有制化则为贵命，无制化则灾祸频仍。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:正官', type: 'shiShen', name: '正官',
        aliases: ['正官', '官星', '禄星'],
        attributes: {
          group: '官杀', relationship: '丈夫、上司', direction: '克我者',
          fortune: '吉', yinYang: '同阴阳',
          elementRelation: '克日主同阴阳',
          personality: '循规蹈矩、有责任感、重视名誉'
        },
        description: '正官为克日主且同阴阳之五行，代表官职、地位、丈夫。正官为贵气之星，主人端正守纪、事业有成。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:偏印', type: 'shiShen', name: '偏印',
        aliases: ['偏印', '枭神', '倒食'],
        attributes: {
          group: '印星', relationship: '继母', direction: '生我者',
          fortune: '偏凶', yinYang: '异阴阳',
          elementRelation: '生日主异阴阳',
          personality: '思维独特、孤僻、学术研究型人才'
        },
        description: '偏印为生日主且异阴阳之五行，代表继母、偏门学问。偏印过多则枭神夺食，为人生中较为隐晦之力量。',
        source: '《子平真诠》'
      },
      {
        id: 'shiShen:正印', type: 'shiShen', name: '正印',
        aliases: ['正印', '印绶', '贵人星'],
        attributes: {
          group: '印星', relationship: '母亲', direction: '生我者',
          fortune: '吉', yinYang: '同阴阳',
          elementRelation: '生日主同阴阳',
          personality: '仁慈宽厚、学识渊博、受人尊敬'
        },
        description: '正印为生日主且同阴阳之五行，代表母亲、学业、贵人。正印为吉星，主人仁慈善良、学业有成、贵人相助。',
        source: '《子平真诠》'
      }
    ]

    // === 十神分组节点（虚拟分组） ===
    const shiShenGroupNodes: KGNode[] = [
      {
        id: 'shiShen:比劫', type: 'shiShen', name: '比劫组',
        aliases: ['比劫', '比肩劫财'],
        attributes: { group: '比劫', members: ['比肩', '劫财'], effect: '帮身夺财' },
        description: '比劫为日主同类五行之总称，比肩劫财同属比劫组。比劫帮身扶助日主，过旺则争夺财星。',
        source: '《渊海子平》'
      },
      {
        id: 'shiShen:食伤', type: 'shiShen', name: '食伤组',
        aliases: ['食伤', '食神伤官'],
        attributes: { group: '食伤', members: ['食神', '伤官'], effect: '泄秀生财' },
        description: '食伤为日主所生之五行总称，食神伤官同属食伤组。食伤泄秀为才华之展现，可生财亦可制官杀。',
        source: '《渊海子平》'
      },
      {
        id: 'shiShen:财星', type: 'shiShen', name: '财星组',
        aliases: ['财星', '正财偏财'],
        attributes: { group: '财星', members: ['正财', '偏财'], effect: '养命之源' },
        description: '财星为日主所克之五行总称，正财偏财同属财星组。财为养命之源，命理中极为重要。',
        source: '《渊海子平》'
      },
      {
        id: 'shiShen:官杀', type: 'shiShen', name: '官杀组',
        aliases: ['官杀', '正官七杀'],
        attributes: { group: '官杀', members: ['正官', '七杀'], effect: '管束制衡' },
        description: '官杀为克日主之五行总称，正官七杀同属官杀组。官杀主贵，有制化则为权柄。',
        source: '《渊海子平》'
      },
      {
        id: 'shiShen:印星', type: 'shiShen', name: '印星组',
        aliases: ['印星', '正印偏印'],
        attributes: { group: '印星', members: ['正印', '偏印'], effect: '生身护命' },
        description: '印星为生日主之五行总称，正印偏印同属印星组。印星生扶日主，为护命之本。',
        source: '《渊海子平》'
      }
    ]

    // === 格局节点(26个) ===
    const geJuNodes: KGNode[] = [
      {
        id: 'geJu:正官格', type: 'geJu', name: '正官格',
        aliases: ['正官格', '官星格'],
        attributes: {
          condition: '月令正官透干或本气正官', yongShenDirection: '喜印绶、忌伤官',
          rating: 5, category: '官杀类'
        },
        description: '正官格以月令正官之气为格，主贵气。正官格喜印星护官，忌伤官克制。《子平真诠》以正官格为八大正格之首。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:七杀格', type: 'geJu', name: '七杀格',
        aliases: ['七杀格', '偏官格', '杀格'],
        attributes: {
          condition: '月令七杀透干或本气七杀', yongShenDirection: '喜食神制杀或印星化杀',
          rating: 5, category: '官杀类'
        },
        description: '七杀格以月令七杀之气为格，有制化则为大贵之命。七杀格喜食神制之或印星化杀为权，无制化则为祸端。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:正财格', type: 'geJu', name: '正财格',
        aliases: ['正财格', '财格'],
        attributes: {
          condition: '月令正财透干或本气正财', yongShenDirection: '喜食伤生财、忌比劫夺财',
          rating: 4, category: '财星类'
        },
        description: '正财格以月令正财之气为格，主正当财运。正财格喜食伤生财之源头，忌比劫争夺。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:偏财格', type: 'geJu', name: '偏财格',
        aliases: ['偏财格', '横财格'],
        attributes: {
          condition: '月令偏财透干或本气偏财', yongShenDirection: '喜身旺担财、忌比劫分夺',
          rating: 5, category: '财星类'
        },
        description: '偏财格以月令偏财之气为格，主大财之运。偏财格之人财运亨通但需身旺方能担财，古有"偏财格主富"之说。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:正印格', type: 'geJu', name: '正印格',
        aliases: ['正印格', '印绶格'],
        attributes: {
          condition: '月令正印透干或本气正印', yongShenDirection: '喜官杀生印、忌财星破印',
          rating: 4, category: '印星类'
        },
        description: '正印格以月令正印之气为格，主学业、贵人。正印格喜官杀来生印，忌财星破印为害。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:偏印格', type: 'geJu', name: '偏印格',
        aliases: ['偏印格', '枭神格'],
        attributes: {
          condition: '月令偏印透干或本气偏印', yongShenDirection: '喜有财制枭、忌夺食',
          rating: 3, category: '印星类'
        },
        description: '偏印格以月令偏印之气为格，主偏门学问。偏印格需防枭神夺食之弊，有偏门技艺者可成。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:食神格', type: 'geJu', name: '食神格',
        aliases: ['食神格', '寿星格'],
        attributes: {
          condition: '月令食神透干或本气食神', yongShenDirection: '喜财星流通、忌偏印夺食',
          rating: 4, category: '食伤类'
        },
        description: '食神格以月令食神之气为格，主福寿双全。食神格为命理中最吉利之格局之一，有寿星之美称。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:伤官格', type: 'geJu', name: '伤官格',
        aliases: ['伤官格', '伶官格'],
        attributes: {
          condition: '月令伤官透干或本气伤官', yongShenDirection: '伤官配印则吉、伤官见官则凶',
          rating: 4, category: '食伤类'
        },
        description: '伤官格以月令伤官之气为格，主才华出众。伤官配印为大贵之格，伤官见官则为祸患。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:从官格', type: 'geJu', name: '从官格',
        aliases: ['从官格', '从杀格', '从势格'],
        attributes: {
          condition: '日主极弱官杀极旺', yongShenDirection: '顺从官杀之势',
          rating: 5, category: '从格类'
        },
        description: '从官格为日主极弱而官杀极旺时从其官杀之势，主大贵。从格须纯粹不可杂逆，一旦逆势则破格。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:从财格', type: 'geJu', name: '从财格',
        aliases: ['从财格', '弃命从财格'],
        attributes: {
          condition: '日主极弱财星极旺', yongShenDirection: '顺从财星之势',
          rating: 5, category: '从格类'
        },
        description: '从财格为日主极弱而财星极旺时弃命从财，主大富。从财格之人善于利用他人资源致富。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:从儿格', type: 'geJu', name: '从儿格',
        aliases: ['从儿格', '从食伤格'],
        attributes: {
          condition: '日主极弱食伤极旺', yongShenDirection: '顺从食伤之势',
          rating: 4, category: '从格类'
        },
        description: '从儿格为日主极弱而食伤极旺时从食伤之势，主以才华立身。从儿格之人多才多艺，可凭技艺致富。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:化气格', type: 'geJu', name: '化气格',
        aliases: ['化气格', '化合格'],
        attributes: {
          condition: '天干五合化气成功', yongShenDirection: '以化气之五行论用神',
          rating: 5, category: '化合格类'
        },
        description: '化气格为天干五合化气成功之格局，如甲己化土、乙庚化金等。化气格以所化之五行为主，力量极大。',
        source: '《滴天髓》'
      },
      {
        id: 'geJu:专旺格', type: 'geJu', name: '专旺格',
        aliases: ['专旺格', '曲直格等'],
        attributes: {
          condition: '日主极旺全局皆同类五行', yongShenDirection: '顺从旺势不可逆',
          rating: 5, category: '专旺类'
        },
        description: '专旺格为日主极旺而全局皆助日主之五行，如曲直格（全木）、炎上格（全火）等。专旺格宜顺不宜逆。',
        source: '《滴天髓》'
      },
      {
        id: 'geJu:曲直格', type: 'geJu', name: '曲直格',
        aliases: ['曲直格', '木专旺格'],
        attributes: {
          condition: '甲乙日主生于寅卯月，地支寅卯辰全或亥卯未全', yongShenDirection: '顺木旺之势喜水木',
          rating: 5, category: '专旺类'
        },
        description: '曲直格为专旺格之一种，日主为木而全局皆木，取"曲直"为仁寿之象。曲直格之人仁慈正直，事业顺遂。',
        source: '《三命通会》'
      },
      {
        id: 'geJu:炎上格', type: 'geJu', name: '炎上格',
        aliases: ['炎上格', '火专旺格'],
        attributes: {
          condition: '丙丁日主生于巳午月，地支巳午未全或寅午戌全', yongShenDirection: '顺火旺之势喜木火',
          rating: 5, category: '专旺类'
        },
        description: '炎上格为专旺格之一种，日主为火而全局皆火，取"炎上"为礼义之象。炎上格之人热情有礼，事业辉煌。',
        source: '《三命通会》'
      },
      {
        id: 'geJu:稼穑格', type: 'geJu', name: '稼穑格',
        aliases: ['稼穑格', '土专旺格'],
        attributes: {
          condition: '戊己日主生于辰戌丑未月，地支土全', yongShenDirection: '顺土旺之势喜火土',
          rating: 5, category: '专旺类'
        },
        description: '稼穑格为专旺格之一种，日主为土而全局皆土，取"稼穑"为信实之象。稼穑格之人诚实守信，根基深厚。',
        source: '《三命通会》'
      },
      {
        id: 'geJu:从革格', type: 'geJu', name: '从革格',
        aliases: ['从革格', '金专旺格'],
        attributes: {
          condition: '庚辛日主生于申酉月，地支申酉戌全或巳酉丑全', yongShenDirection: '顺金旺之势喜土金',
          rating: 5, category: '专旺类'
        },
        description: '从革格为专旺格之一种，日主为金而全局皆金，取"从革"为义气之象。从革格之人义薄云天，刚毅果决。',
        source: '《三命通会》'
      },
      {
        id: 'geJu:润下格', type: 'geJu', name: '润下格',
        aliases: ['润下格', '水专旺格'],
        attributes: {
          condition: '壬癸日主生于亥子月，地支亥子丑全或申子辰全', yongShenDirection: '顺水旺之势喜金水',
          rating: 5, category: '专旺类'
        },
        description: '润下格为专旺格之一种，日主为水而全局皆水，取"润下"为智慧之象。润下格之人聪明过人，学识渊博。',
        source: '《三命通会》'
      },
      {
        id: 'geJu:官印相生格', type: 'geJu', name: '官印相生格',
        aliases: ['官印相生格', '官星佩印格'],
        attributes: {
          condition: '官星与印星同时透干，官生印、印生身', yongShenDirection: '喜官印俱全、忌财破印',
          rating: 5, category: '复合格类'
        },
        description: '官印相生格为官星与印星配合得当之格局，官生印、印护官，形成良性循环。此格主贵，多出文官贵人。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:杀印相生格', type: 'geJu', name: '杀印相生格',
        aliases: ['杀印相生格', '七杀佩印格'],
        attributes: {
          condition: '七杀与印星同时透干，杀生印、印化杀生身', yongShenDirection: '喜杀印皆旺、忌财破印',
          rating: 5, category: '复合格类'
        },
        description: '杀印相生格为七杀与印星配合得当之格局，以印化杀生身为权柄。此格为武职大贵之命。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:食神生财格', type: 'geJu', name: '食神生财格',
        aliases: ['食神生财格', '食生财格'],
        attributes: {
          condition: '食神与财星同时透干，食神生财', yongShenDirection: '喜食旺财通、忌枭夺食',
          rating: 4, category: '复合格类'
        },
        description: '食神生财格为食神与财星配合得当之格局，以才华生财。此格之人凭一技之长致富，福禄双全。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:伤官配印格', type: 'geJu', name: '伤官配印格',
        aliases: ['伤官配印格', '伤官佩印格'],
        attributes: {
          condition: '伤官与印星同时透干，印制伤官', yongShenDirection: '喜印旺制伤、忌财破印',
          rating: 5, category: '复合格类'
        },
        description: '伤官配印格为伤官与印星配合得当之格局，印星制伤官使之不害官星。此格主大贵，多出文人雅士。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:伤官生财格', type: 'geJu', name: '伤官生财格',
        aliases: ['伤官生财格'],
        attributes: {
          condition: '伤官与财星配合，伤官生财而不见官星', yongShenDirection: '喜伤旺财通、忌见官星',
          rating: 4, category: '复合格类'
        },
        description: '伤官生财格为伤官与财星配合得当之格局，伤官生财而格局中不见官星，避免伤官见官之患。',
        source: '《子平真诠》'
      },
      {
        id: 'geJu:财官双美格', type: 'geJu', name: '财官双美格',
        aliases: ['财官双美格', '财官相生格'],
        attributes: {
          condition: '正财与正官并透，财不破印、官不伤身', yongShenDirection: '喜财官皆旺、忌冲克破局',
          rating: 5, category: '复合格类'
        },
        description: '财官双美格为正财正官配合得当之格局，财官双全。此格主富贵双全，名利兼收，为上等格局。',
        source: '《子平真诠》'
      }
    ]

    // === 旺衰节点(5个) ===
    const wangShuaiNodes: KGNode[] = [
      {
        id: 'wangShuai:极弱', type: 'wangShuai', name: '极弱',
        aliases: ['极弱', '身极弱', '从弱'],
        attributes: {
          level: 1, yongShenPreference: '宜从势或印比帮身',
          risk: ['财多身弱', '官杀克身'], characteristic: '日主力量极弱，难以自立'
        },
        description: '日主极弱则自身力量匮乏，需借助外力扶助或从其旺势。极弱之命若不能从势则一生多劳少得。',
        source: '《滴天髓》'
      },
      {
        id: 'wangShuai:偏弱', type: 'wangShuai', name: '偏弱',
        aliases: ['偏弱', '身偏弱', '身弱'],
        attributes: {
          level: 2, yongShenPreference: '喜印比帮身',
          risk: ['财运受压', '精力不足'], characteristic: '日主力量不足，需扶助'
        },
        description: '日主偏弱则需印星比劫扶助，用神取印比。偏弱之人宜保守经营，不宜冒进。',
        source: '《滴天髓》'
      },
      {
        id: 'wangShuai:中和', type: 'wangShuai', name: '中和',
        aliases: ['中和', '身中和', '平衡'],
        attributes: {
          level: 3, yongShenPreference: '喜财官食伤流通',
          risk: [], characteristic: '日主力量平衡，最为理想'
        },
        description: '日主中和为命局最佳状态，五行流通有情，不偏不倚。中和之命最为平顺，能担财官。',
        source: '《滴天髓》'
      },
      {
        id: 'wangShuai:偏旺', type: 'wangShuai', name: '偏旺',
        aliases: ['偏旺', '身偏旺', '身旺'],
        attributes: {
          level: 4, yongShenPreference: '喜食伤财官泄耗',
          risk: ['固执己见', '比劫夺财'], characteristic: '日主力量偏强，需泄耗'
        },
        description: '日主偏旺则需食伤财官泄耗，用神取食伤财官。偏旺之人意志坚强但过于固执。',
        source: '《滴天髓》'
      },
      {
        id: 'wangShuai:极旺', type: 'wangShuai', name: '极旺',
        aliases: ['极旺', '身极旺', '专旺'],
        attributes: {
          level: 5, yongShenPreference: '宜顺旺势或食伤泄秀',
          risk: ['比劫争财', '旺极无泄'], characteristic: '日主力量极强，不可逆转'
        },
        description: '日主极旺则需顺其势或以食伤泄秀，极旺之命有专旺之象。身极旺若不从势则容易冲动行事。',
        source: '《滴天髓》'
      }
    ]

    // === 调候节点(5个) ===
    const tiaoHouNodes: KGNode[] = [
      {
        id: 'tiaoHou:寒', type: 'tiaoHou', name: '寒',
        aliases: ['寒命', '寒局', '命局偏寒'],
        attributes: {
          monthBranches: ['亥', '子', '丑'], yongShen: '火',
          characteristic: '命局过于寒冷，需火暖局'
        },
        description: '寒命生于亥子丑月，命局水旺火弱，如同寒冬腊月。需以火为调候用神，暖局方能生机勃发。',
        source: '《穷通宝鉴》'
      },
      {
        id: 'tiaoHou:暖', type: 'tiaoHou', name: '暖',
        aliases: ['暖命', '暖局', '命局偏暖'],
        attributes: {
          monthBranches: ['寅', '卯', '辰'], yongShen: '适中',
          characteristic: '命局温暖适中，如春日融融'
        },
        description: '暖命生于寅卯辰月，气候温和，为调候适宜之命。暖命之人性情温和，适合平稳发展。',
        source: '《穷通宝鉴》'
      },
      {
        id: 'tiaoHou:燥', type: 'tiaoHou', name: '燥',
        aliases: ['燥命', '燥局', '命局偏燥'],
        attributes: {
          monthBranches: ['巳', '午', '未'], yongShen: '水',
          characteristic: '命局过于燥热，需水润局'
        },
        description: '燥命生于巳午未月，命局火旺水弱，如同盛夏酷暑。需以水为调候用神，润局方能清凉平和。',
        source: '《穷通宝鉴》'
      },
      {
        id: 'tiaoHou:湿', type: 'tiaoHou', name: '湿',
        aliases: ['湿命', '湿局', '命局偏湿'],
        attributes: {
          monthBranches: ['申', '酉', '戌'], yongShen: '适中',
          characteristic: '命局湿润适中，如秋日清朗'
        },
        description: '湿命生于申酉戌月，气候清爽，为调候适中之命。湿命之人头脑清醒，适合精细工作。',
        source: '《穷通宝鉴》'
      },
      {
        id: 'tiaoHou:中和', type: 'tiaoHou', name: '调候中和',
        aliases: ['调候平衡', '寒暖适宜'],
        attributes: {
          monthBranches: [], yongShen: '无需特殊调候',
          characteristic: '命局寒暖适中，调候平衡'
        },
        description: '调候中和为最理想状态，命局寒暖适宜，无需额外调候。五行调和之人身心健康。',
        source: '《穷通宝鉴》'
      }
    ]

    // === 病药节点(10个) ===
    const bingYaoNodes: KGNode[] = [
      {
        id: 'bingYao:身弱财多', type: 'bingYao', name: '身弱财多',
        aliases: ['财多身弱', '富屋贫人'],
        attributes: {
          disease: '财星过旺日主无力承担', medicine: '印比帮身',
          severity: 4, treatment: '取印星比劫为用神帮身担财'
        },
        description: '身弱财多为命局常见之病，财多而身弱无力承担，如同眼见金山却无力搬运。需以印比帮身为药。',
        source: '《滴天髓》'
      },
      {
        id: 'bingYao:杀旺无制', type: 'bingYao', name: '杀旺无制',
        aliases: ['七杀无制', '杀重身轻'],
        attributes: {
          disease: '七杀过旺无食神制或印星化', medicine: '食神制杀或印星化杀',
          severity: 5, treatment: '取食神制杀或印星化杀生身'
        },
        description: '杀旺无制为命局危重之病，七杀攻身而无化解，主灾祸频仍、小人当道。急需食神制之或印星化之。',
        source: '《滴天髓》'
      },
      {
        id: 'bingYao:比劫过旺', type: 'bingYao', name: '比劫过旺',
        aliases: ['比劫夺财', '群比争财'],
        attributes: {
          disease: '比劫过多争夺财星', medicine: '食伤泄秀或官杀制比劫',
          severity: 3, treatment: '取食伤泄秀为用，或以官杀制劫'
        },
        description: '比劫过旺则争夺财星，主破财克妻。需以食伤泄秀或官杀制劫为药，将比劫之能量引导至有利方向。',
        source: '《滴天髓》'
      },
      {
        id: 'bingYao:官杀混杂', type: 'bingYao', name: '官杀混杂',
        aliases: ['官杀混杂', '官杀交见'],
        attributes: {
          disease: '正官七杀同现互扰', medicine: '去官留杀或去杀留官',
          severity: 4, treatment: '取食神去杀留官，或取印星化杀'
        },
        description: '官杀混杂为命局大忌，正官七杀同现则贵气不清。需去一留一方能成格，以食神去杀或以印化杀皆可。',
        source: '《子平真诠》'
      },
      {
        id: 'bingYao:五行偏枯', type: 'bingYao', name: '五行偏枯',
        aliases: ['五行不全', '偏枯之命'],
        attributes: {
          disease: '某五行过旺或过弱甚至全缺', medicine: '补缺抑旺以求平衡',
          severity: 5, treatment: '以所缺五行或抑旺五行为用神'
        },
        description: '五行偏枯为命局极重之病，某五行过旺或全缺致五行失衡。需补缺抑旺以求平衡，方可转危为安。',
        source: '《滴天髓》'
      },
      {
        id: 'bingYao:食伤泄身太过', type: 'bingYao', name: '食伤泄身太过',
        aliases: ['泄身太过', '食伤过多'],
        attributes: {
          disease: '食伤过旺泄日主太过', medicine: '印星制食伤生身',
          severity: 3, treatment: '取印星为用，制食伤兼生身'
        },
        description: '食伤泄身太过则日主元气大伤，表现为才华过盛却精力不济。需以印星制食伤兼生身为药。',
        source: '《滴天髓》'
      },
      {
        id: 'bingYao:印星夺食', type: 'bingYao', name: '印星夺食',
        aliases: ['枭神夺食', '偏印夺食'],
        attributes: {
          disease: '偏印克制食神', medicine: '财星制偏印或食神旺不受克',
          severity: 4, treatment: '取财星制枭为用，或食神力量充足不受克'
        },
        description: '印星夺食为命局之病，偏印（枭神）克制食神，夺其福气。需以财星制偏印或食神力量充足方可解。',
        source: '《子平真诠》'
      },
      {
        id: 'bingYao:伤官见官', type: 'bingYao', name: '伤官见官',
        aliases: ['伤官见官', '伤官克官'],
        attributes: {
          disease: '伤官克制正官', medicine: '印星制伤官或伤官配印',
          severity: 4, treatment: '取印星为用，制伤护官'
        },
        description: '伤官见官为命局大忌，伤官克制正官则贵气受损。需以印星制伤官护官为药，化忌为喜。',
        source: '《子平真诠》'
      },
      {
        id: 'bingYao:身旺无泄', type: 'bingYao', name: '身旺无泄',
        aliases: ['旺极无泄', '身旺无出路'],
        attributes: {
          disease: '日主极旺而全局无食伤泄秀', medicine: '食伤泄秀或财星耗身',
          severity: 3, treatment: '取食伤泄秀或财星为用'
        },
        description: '身旺无泄则日主能量无法流通，如洪水无河道。需以食伤泄秀或财星耗身为药，使能量有效释放。',
        source: '《滴天髓》'
      },
      {
        id: 'bingYao:羊刃倒戈', type: 'bingYao', name: '羊刃倒戈',
        aliases: ['羊刃为祸', '羊刃无制'],
        attributes: {
          disease: '羊刃过旺无官杀制或食伤泄', medicine: '官杀制羊刃或七杀有制化',
          severity: 5, treatment: '取官杀制刃为用，或食伤泄刃'
        },
        description: '羊刃倒戈为命局凶险之病，劫财（羊刃）过旺无制则反噬自身。急需官杀制之或食伤泄之。',
        source: '《滴天髓》'
      }
    ]

    // === 通关节点(6个) ===
    const tongGuanNodes: KGNode[] = [
      {
        id: 'tongGuan:木火通关', type: 'tongGuan', name: '木火通关',
        aliases: ['木火通关', '木火媒介'],
        attributes: {
          resolves: '水火交战', mediator: '木',
          application: '水火相克时以木通关，木泄水生火'
        },
        description: '水火本相克，以木通关则化克为生——木泄水之气而生动火之机，使水木火三行流通有情。',
        source: '《滴天髓》'
      },
      {
        id: 'tongGuan:火土通关', type: 'tongGuan', name: '火土通关',
        aliases: ['火土通关', '火土媒介'],
        attributes: {
          resolves: '木土交战', mediator: '火',
          application: '木土相克时以火通关，木生火、火生土'
        },
        description: '木土本相克，以火通关则化克为生——火泄木之气势而生动土之机，使木火土三行流通。',
        source: '《滴天髓》'
      },
      {
        id: 'tongGuan:土金通关', type: 'tongGuan', name: '土金通关',
        aliases: ['土金通关', '土金媒介'],
        attributes: {
          resolves: '火金交战', mediator: '土',
          application: '火金相克时以土通关，火生土、土生金'
        },
        description: '火金本相克，以土通关则化克为生——土泄火之烈焰而生动金之机，使火土金三行流通。',
        source: '《滴天髓》'
      },
      {
        id: 'tongGuan:金水通关', type: 'tongGuan', name: '金水通关',
        aliases: ['金水通关', '金水媒介'],
        attributes: {
          resolves: '土水交战', mediator: '金',
          application: '土水相克时以金通关，土生金、金生水'
        },
        description: '土水本相克，以金通关则化克为生——金泄土之厚重而生动水之源，使土金水三行流通。',
        source: '《滴天髓》'
      },
      {
        id: 'tongGuan:水木通关', type: 'tongGuan', name: '水木通关',
        aliases: ['水木通关', '水木媒介'],
        attributes: {
          resolves: '金木交战', mediator: '水',
          application: '金木相克时以水通关，金生水、水生木'
        },
        description: '金木本相克，以水通关则化克为生——水泄金之肃杀而生动木之机，使金水木三行流通。',
        source: '《滴天髓》'
      },
      {
        id: 'tongGuan:无通关', type: 'tongGuan', name: '无通关',
        aliases: ['五行无通关', '无法调和'],
        attributes: {
          resolves: '无', mediator: '无',
          application: '五行交战无通关之物，为命局大忌'
        },
        description: '无通关为五行交战而无调和之物，如同战场上无调停者。此为命局之缺陷，需大运流年补通关之物方可化解。',
        source: '《滴天髓》'
      }
    ]

    // === 古籍节点(7个) ===
    const guJiNodes: KGNode[] = [
      {
        id: 'guJi:滴天髓', type: 'guJi', name: '滴天髓',
        aliases: ['滴天髓', '任铁樵注滴天髓'],
        attributes: {
          author: '刘伯温（原著）/任铁樵（注解）', dynasty: '明/清',
          coreTheory: '五行的体用关系、旺衰辨析、病药学说',
          importance: 5
        },
        description: '《滴天髓》为命理学四大名著之首，以五行的体用关系为核心，阐述旺衰辨析与病药之理。任铁樵之注解尤为经典。',
        source: '《滴天髓》'
      },
      {
        id: 'guJi:子平真诠', type: 'guJi', name: '子平真诠',
        aliases: ['子平真诠', '徐乐吾注子平真诠'],
        attributes: {
          author: '沈孝瞻（原著）/徐乐吾（注解）', dynasty: '清',
          coreTheory: '格局论、十神详解、用神取法',
          importance: 5
        },
        description: '《子平真诠》为格局论之集大成者，系统论述八大正格之取用、十神之配合，为学习格局法必读之经典。',
        source: '《子平真诠》'
      },
      {
        id: 'guJi:穷通宝鉴', type: 'guJi', name: '穷通宝鉴',
        aliases: ['穷通宝鉴', '造化元钥'],
        attributes: {
          author: '佚名', dynasty: '清',
          coreTheory: '调候用神、十二月令人用神取法',
          importance: 4
        },
        description: '《穷通宝鉴》又名《造化元钥》，专论十二月令之调候用神，为调候法之权威著作。',
        source: '《穷通宝鉴》'
      },
      {
        id: 'guJi:三命通会', type: 'guJi', name: '三命通会',
        aliases: ['三命通会', '万民英三命通会'],
        attributes: {
          author: '万民英', dynasty: '明',
          coreTheory: '总论命理、论六亲、论大运流年',
          importance: 4
        },
        description: '《三命通会》为命理学百科全书式著作，涵盖命理各方面之论述，内容广博。',
        source: '《三命通会》'
      },
      {
        id: 'guJi:渊海子平', type: 'guJi', name: '渊海子平',
        aliases: ['渊海子平', '子平渊源'],
        attributes: {
          author: '徐子平（传）', dynasty: '五代/宋',
          coreTheory: '四柱排法、十神体系、格局雏形',
          importance: 5
        },
        description: '《渊海子平》为命理学奠基之作，建立了四柱八字之基本框架与十神体系，后世命理皆以此为宗。',
        source: '《渊海子平》'
      },
      {
        id: 'guJi:神峰通考', type: 'guJi', name: '神峰通考',
        aliases: ['神峰通考', '张神峰命理正宗'],
        attributes: {
          author: '张神峰', dynasty: '明',
          coreTheory: '病药说、子平谬说辨误、 accurate use of 通关',
          importance: 3
        },
        description: '《神峰通考》为明代命理名著，以病药说为核心，纠正前人之谬误，对通关之理有独到见解。',
        source: '《神峰通考》'
      },
      {
        id: 'guJi:穷通秘诀', type: 'guJi', name: '穷通秘诀',
        aliases: ['穷通秘诀', '穷通宝鉴秘诀'],
        attributes: {
          author: '佚名', dynasty: '清',
          coreTheory: '各日干十二月令用神秘诀',
          importance: 4
        },
        description: '《穷通秘诀》为《穷通宝鉴》之精华版，分列各日干于十二月令之用神取法，简明实用。',
        source: '《穷通秘诀》'
      }
    ]

    // === 神煞节点(20个) ===
    const shenShaNodes: KGNode[] = [
      {
        id: 'shenSha:天乙贵人', type: 'shenSha', name: '天乙贵人',
        aliases: ['天乙贵人', '天贵'],
        attributes: {
          fortune: '吉神', source: ['年干', '日干'],
          influence: '贵人相助、逢凶化吉', method: '以年干或日干查'
        },
        description: '天乙贵人为命中最贵之神煞，主一生贵人相助，遇难呈祥。其法以年干或日干查之，为逢凶化吉之神。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:文昌', type: 'shenSha', name: '文昌',
        aliases: ['文昌', '文昌星', '文昌贵人'],
        attributes: {
          fortune: '吉神', source: ['年干', '日干'],
          influence: '聪明好学、利于文途', method: '以年干或日干查'
        },
        description: '文昌星为学业之神煞，主聪明好学、文运亨通。有利考试升学、文书创作等文事。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:驿马', type: 'shenSha', name: '驿马',
        aliases: ['驿马', '驿马星', '奔波星'],
        attributes: {
          fortune: '中性', source: ['年支', '日支'],
          influence: '奔波变动、出行迁移', method: '以年支或日支三合局冲位查'
        },
        description: '驿马星主奔波变动，命带驿马之人多走动迁移，适合从事流动性大的工作或经常出差。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:桃花', type: 'shenSha', name: '桃花',
        aliases: ['桃花', '桃花星', '咸池'],
        attributes: {
          fortune: '中性', source: ['年支', '日支'],
          influence: '感情丰富、异性缘好', method: '以年支或日支三合局沐浴位查'
        },
        description: '桃花星主感情人缘，命带桃花之人感情丰富、异性缘好。桃花有正偏之分，正桃花利婚姻，偏桃花多纠纷。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:华盖', type: 'shenSha', name: '华盖',
        aliases: ['华盖', '华盖星'],
        attributes: {
          fortune: '中性偏吉', source: ['年支', '日支'],
          influence: '聪慧孤高、利于学术宗教', method: '以年支或日支三合局墓位查'
        },
        description: '华盖星主聪慧孤高，命带华盖之人善于思考，有宗教哲学天赋，多为学者或修行之人。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:将星', type: 'shenSha', name: '将星',
        aliases: ['将星', '将星星'],
        attributes: {
          fortune: '吉神', source: ['年支', '日支'],
          influence: '领导力强、有组织才能', method: '以年支或日支三合局旺位查'
        },
        description: '将星为三合局之旺位，主领导才能。命带将星之人组织能力强，适合担任管理职务。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:太极贵人', type: 'shenSha', name: '太极贵人',
        aliases: ['太极贵人', '太极星'],
        attributes: {
          fortune: '吉神', source: ['年干', '日干'],
          influence: '对命理玄学有天赋', method: '以年干或日干查'
        },
        description: '太极贵人为玄学之天赋星，命带太极贵人对命理、风水、占卜等玄学有天然悟性。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:天德贵人', type: 'shenSha', name: '天德贵人',
        aliases: ['天德贵人', '天德'],
        attributes: {
          fortune: '吉神', source: ['月令'],
          influence: '心地善良、逢凶化吉', method: '以月令查'
        },
        description: '天德贵人为月令吉神，主心地善良、有德行。命带天德贵人者多有阴德庇佑。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:月德贵人', type: 'shenSha', name: '月德贵人',
        aliases: ['月德贵人', '月德'],
        attributes: {
          fortune: '吉神', source: ['月令'],
          influence: '福寿绵长、平安顺遂', method: '以月令三合局查'
        },
        description: '月德贵人为月令吉神，主福寿双全。与天德贵人同见者更为大吉。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:禄神', type: 'shenSha', name: '禄神',
        aliases: ['禄神', '建禄', '禄'],
        attributes: {
          fortune: '吉神', source: ['年干', '日干'],
          influence: '福禄双全、衣食无忧', method: '以年干或日干查临官位'
        },
        description: '禄神为日干之临官位，主福禄寿俱全。命带禄神之人一生衣食丰足，事业有成。',
        source: '《渊海子平》'
      },
      {
        id: 'shenSha:羊刃', type: 'shenSha', name: '羊刃',
        aliases: ['羊刃', '飞刃', '刃星'],
        attributes: {
          fortune: '凶神', source: ['年干', '日干'],
          influence: '刚烈冲动、血光之灾', method: '以年干或日干查帝旺位'
        },
        description: '羊刃为日干之帝旺位，主刚烈冲动。羊刃有制化则威权显赫，无制化则主血光刑伤。',
        source: '《渊海子平》'
      },
      {
        id: 'shenSha:亡神', type: 'shenSha', name: '亡神',
        aliases: ['亡神', '亡神星'],
        attributes: {
          fortune: '凶神', source: ['年支', '日支'],
          influence: '暗中损失、心思深沉', method: '以年支或日支三合局劫煞位查'
        },
        description: '亡神主暗中损失，命带亡神之人需防意外破财和暗中阻碍。然亡神与吉星同见则反主聪明伶俐。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:劫煞', type: 'shenSha', name: '劫煞',
        aliases: ['劫煞', '劫煞星'],
        attributes: {
          fortune: '凶神', source: ['年支', '日支'],
          influence: '灾劫阻碍、需防意外', method: '以年支或日支三合局绝位查'
        },
        description: '劫煞主灾劫，命带劫煞之人一生多波折，需特别注意意外灾害。与吉神同见可减轻其凶。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:灾煞', type: 'shenSha', name: '灾煞',
        aliases: ['灾煞', '灾煞星'],
        attributes: {
          fortune: '凶神', source: ['年支', '日支'],
          influence: '灾祸连连、水火之厄', method: '以年支或日支三合局灾位查'
        },
        description: '灾煞主灾害，命带灾煞之人需防水火之灾和突发事故。有吉神化解者可减轻。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:天煞', type: 'shenSha', name: '天煞',
        aliases: ['天煞', '天煞星'],
        attributes: {
          fortune: '凶神', source: ['年支'],
          influence: '天灾横祸、需行善积德', method: '以年支查'
        },
        description: '天煞为天降之煞，主天灾横祸。需以积德行善化解，配合吉神方可减凶。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:地煞', type: 'shenSha', name: '地煞',
        aliases: ['地煞', '地煞星'],
        attributes: {
          fortune: '凶神', source: ['年支'],
          influence: '地脉不利、搬迁变动', method: '以年支查'
        },
        description: '地煞为地脉之煞，主居住环境不利。需调整居住风水或迁移化解。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:文昌贵人', type: 'shenSha', name: '文昌贵人',
        aliases: ['文昌贵人', '文曲星'],
        attributes: {
          fortune: '吉神', source: ['年干', '日干'],
          influence: '利文职考试、才思敏捷', method: '以年干或日干查'
        },
        description: '文昌贵人主文运昌盛，利考试升学、文书创作。与文昌星相辅相成，为学业事业之吉神。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:红鸾', type: 'shenSha', name: '红鸾',
        aliases: ['红鸾', '红鸾星'],
        attributes: {
          fortune: '吉神', source: ['年支'],
          influence: '婚姻喜庆、恋爱甜蜜', method: '以年支查对宫之冲位'
        },
        description: '红鸾星主婚姻喜庆，为感情美满之吉兆。红鸾入命则恋爱顺利、婚姻幸福。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:天喜', type: 'shenSha', name: '天喜',
        aliases: ['天喜', '天喜星'],
        attributes: {
          fortune: '吉神', source: ['年支'],
          influence: '添丁喜庆、好事连连', method: '以年支查红鸾对位'
        },
        description: '天喜星与红鸾星配对，主喜庆临门、好事成双。天喜入命者多为乐观开朗之人。',
        source: '《三命通会》'
      },
      {
        id: 'shenSha:金舆', type: 'shenSha', name: '金舆',
        aliases: ['金舆', '金舆星', '华车星'],
        attributes: {
          fortune: '吉神', source: ['年干', '日干'],
          influence: '出行便利、得人车马之力', method: '以年干或日干查'
        },
        description: '金舆星为出行之吉神，主出门逢贵、车马便利。现代可引申为有车有房之象。',
        source: '《三命通会》'
      }
    ]

    // === 日主节点(10个) ===
    const dayMasterNodes: KGNode[] = [
      {
        id: 'dayMaster:甲木', type: 'dayMaster', name: '甲木',
        aliases: ['甲木', '阳木', '大林木'],
        attributes: {
          yinYang: '阳', element: '木' as FiveElement,
          twelveStagesDefault: '生', season: '春季',
          personality: '参天大树、正直刚强、开拓进取',
          bodyPart: '头部、胆'
        },
        description: '甲木为阳木，如参天大树，性格正直刚强，有开拓精神。甲木之人为栋梁之材，可担大任。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:乙木', type: 'dayMaster', name: '乙木',
        aliases: ['乙木', '阴木', '花草藤蔓'],
        attributes: {
          yinYang: '阴', element: '木' as FiveElement,
          twelveStagesDefault: '生', season: '春季',
          personality: '柔韧灵活、善于适应、外柔内刚',
          bodyPart: '肝脏、肩颈'
        },
        description: '乙木为阴木，如花草藤蔓，性格柔韧灵活、善于适应环境。乙木之人看似柔和实则坚韧。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:丙火', type: 'dayMaster', name: '丙火',
        aliases: ['丙火', '阳火', '太阳之火'],
        attributes: {
          yinYang: '阳', element: '火' as FiveElement,
          twelveStagesDefault: '旺', season: '夏季',
          personality: '热情大方、光明磊落、有领导力',
          bodyPart: '眼睛、小肠'
        },
        description: '丙火为阳火，如太阳当空，性格热情大方、光明磊落。丙火之人天生有领导气质，感染力强。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:丁火', type: 'dayMaster', name: '丁火',
        aliases: ['丁火', '阴火', '灯烛之火'],
        attributes: {
          yinYang: '阴', element: '火' as FiveElement,
          twelveStagesDefault: '相', season: '夏季',
          personality: '温和细腻、洞察力强、内敛含蓄',
          bodyPart: '心脏、血脉'
        },
        description: '丁火为阴火，如灯烛之光，性格温和细腻、内心丰富。丁火之人洞察力强，善于思考分析。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:戊土', type: 'dayMaster', name: '戊土',
        aliases: ['戊土', '阳土', '高山之土'],
        attributes: {
          yinYang: '阳', element: '土' as FiveElement,
          twelveStagesDefault: '囚', season: '四季末',
          personality: '厚重稳健、包容宽宏、重信守诺',
          bodyPart: '脾胃、皮肤'
        },
        description: '戊土为阳土，如高山大地，性格厚重稳健、包容宽宏。戊土之人重信用，是值得信赖之人。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:己土', type: 'dayMaster', name: '己土',
        aliases: ['己土', '阴土', '田园之土'],
        attributes: {
          yinYang: '阴', element: '土' as FiveElement,
          twelveStagesDefault: '囚', season: '四季末',
          personality: '细心周到、善于策划、谦逊务实',
          bodyPart: '脾脏、腹部'
        },
        description: '己土为阴土，如田园沃土，性格细心周到、善于规划。己土之人适合幕后策划工作。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:庚金', type: 'dayMaster', name: '庚金',
        aliases: ['庚金', '阳金', '刀剑之金'],
        attributes: {
          yinYang: '阳', element: '金' as FiveElement,
          twelveStagesDefault: '死', season: '秋季',
          personality: '刚毅果断、义薄云天、有魄力',
          bodyPart: '肺部、大肠、骨骼'
        },
        description: '庚金为阳金，如刀剑斧钺，性格刚毅果断、义气深重。庚金之人做事果断，适合决断性工作。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:辛金', type: 'dayMaster', name: '辛金',
        aliases: ['辛金', '阴金', '珠玉首饰之金'],
        attributes: {
          yinYang: '阴', element: '金' as FiveElement,
          twelveStagesDefault: '死', season: '秋季',
          personality: '精致敏感、审美独到、注重品质',
          bodyPart: '呼吸道、咽喉、皮肤'
        },
        description: '辛金为阴金，如珠玉首饰，性格精致敏感、审美独到。辛金之人品味高雅，适合艺术相关领域。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:壬水', type: 'dayMaster', name: '壬水',
        aliases: ['壬水', '阳水', '江河湖海之水'],
        attributes: {
          yinYang: '阳', element: '水' as FiveElement,
          twelveStagesDefault: '相', season: '冬季',
          personality: '聪明智慧、胸怀宽广、适应力强',
          bodyPart: '肾脏、膀胱、血液循环'
        },
        description: '壬水为阳水，如江河湖海，性格聪明智慧、胸怀宽广。壬水之人思维灵活，善于应变。',
        source: '《滴天髓》'
      },
      {
        id: 'dayMaster:癸水', type: 'dayMaster', name: '癸水',
        aliases: ['癸水', '阴水', '雨露雾霜之水'],
        attributes: {
          yinYang: '阴', element: '水' as FiveElement,
          twelveStagesDefault: '相', season: '冬季',
          personality: '细腻敏感、直觉敏锐、思维缜密',
          bodyPart: '肾脏、生殖系统、内分泌'
        },
        description: '癸水为阴水，如雨露雾霜，性格细腻敏感、直觉敏锐。癸水之人心思缜密，适合研究分析工作。',
        source: '《滴天髓》'
      }
    ]

    // 注册所有节点
    const allNodes = [
      ...wuXingNodes,
      ...shiShenNodes,
      ...shiShenGroupNodes,
      ...geJuNodes,
      ...wangShuaiNodes,
      ...tiaoHouNodes,
      ...bingYaoNodes,
      ...tongGuanNodes,
      ...guJiNodes,
      ...shenShaNodes,
      ...dayMasterNodes
    ]
    for (const node of allNodes) {
      this.nodes.set(node.id, node)
    }
  }

  private initEdges(): void {
    const edges: KGEdge[] = []

    // ── 辅助函数：添加边 ──
    const addEdge = (
      source: string, target: string, type: KGEdgeType,
      weight: number, description: string, bidirectional = false
    ) => {
      const id = `edge:${source}->${target}:${type}`
      edges.push({ id, source, target, type, weight, description, bidirectional })
    }

    // ════════════════ 五行关系 ════════════════
    // 相生
    addEdge('wuXing:木', 'wuXing:火', 'generates', 0.9, '木生火，木为火之母')
    addEdge('wuXing:火', 'wuXing:土', 'generates', 0.9, '火生土，火为土之母')
    addEdge('wuXing:土', 'wuXing:金', 'generates', 0.9, '土生金，土为金之母')
    addEdge('wuXing:金', 'wuXing:水', 'generates', 0.9, '金生水，金为水之母')
    addEdge('wuXing:水', 'wuXing:木', 'generates', 0.9, '水生木，水为木之母')

    // 相克
    addEdge('wuXing:木', 'wuXing:土', 'overcomes', 0.8, '木克土，木能疏松土壤')
    addEdge('wuXing:土', 'wuXing:水', 'overcomes', 0.8, '土克水，土能堤防水患')
    addEdge('wuXing:水', 'wuXing:火', 'overcomes', 0.8, '水克火，水能扑灭火焰')
    addEdge('wuXing:火', 'wuXing:金', 'overcomes', 0.8, '火克金，火能熔化金属')
    addEdge('wuXing:金', 'wuXing:木', 'overcomes', 0.8, '金克木，金能劈断木材')

    // ════════════════ 十神分组 ════════════════
    addEdge('shiShen:比肩', 'shiShen:比劫', 'belongs_to', 1.0, '比肩属于比劫组')
    addEdge('shiShen:劫财', 'shiShen:比劫', 'belongs_to', 1.0, '劫财属于比劫组')
    addEdge('shiShen:食神', 'shiShen:食伤', 'belongs_to', 1.0, '食神属于食伤组')
    addEdge('shiShen:伤官', 'shiShen:食伤', 'belongs_to', 1.0, '伤官属于食伤组')
    addEdge('shiShen:偏财', 'shiShen:财星', 'belongs_to', 1.0, '偏财属于财星组')
    addEdge('shiShen:正财', 'shiShen:财星', 'belongs_to', 1.0, '正财属于财星组')
    addEdge('shiShen:七杀', 'shiShen:官杀', 'belongs_to', 1.0, '七杀属于官杀组')
    addEdge('shiShen:正官', 'shiShen:官杀', 'belongs_to', 1.0, '正官属于官杀组')
    addEdge('shiShen:偏印', 'shiShen:印星', 'belongs_to', 1.0, '偏印属于印星组')
    addEdge('shiShen:正印', 'shiShen:印星', 'belongs_to', 1.0, '正印属于印星组')

    // ════════════════ 十神之间关系 ════════════════
    addEdge('shiShen:比劫', 'shiShen:财星', 'conflicts_with', 0.8, '比劫争夺财星', true)
    addEdge('shiShen:财星', 'shiShen:印星', 'conflicts_with', 0.8, '财星破印', true)
    addEdge('shiShen:印星', 'shiShen:食伤', 'conflicts_with', 0.8, '印星克食伤（枭夺食）', true)
    addEdge('shiShen:食伤', 'shiShen:官杀', 'conflicts_with', 0.8, '食伤克官杀', true)
    addEdge('shiShen:官杀', 'shiShen:比劫', 'conflicts_with', 0.8, '官杀克比劫', true)

    // ════════════════ 格局关系 ════════════════
    // 格局相似分组
    addEdge('geJu:正官格', 'geJu:七杀格', 'similar_to', 0.9, '正官格与七杀格同属官杀类格局', true)
    addEdge('geJu:正财格', 'geJu:偏财格', 'similar_to', 0.9, '正财格与偏财格同属财星类格局', true)
    addEdge('geJu:正印格', 'geJu:偏印格', 'similar_to', 0.8, '正印格与偏印格同属印星类格局', true)
    addEdge('geJu:食神格', 'geJu:伤官格', 'similar_to', 0.8, '食神格与伤官格同属食伤类格局', true)

    // 格局成立条件关系
    addEdge('geJu:正官格', 'shiShen:正官', 'requires', 0.95, '正官格要求月令正官之气')
    addEdge('geJu:七杀格', 'shiShen:七杀', 'requires', 0.95, '七杀格要求月令七杀之气')
    addEdge('geJu:偏财格', 'shiShen:偏财', 'requires', 0.95, '偏财格要求月令偏财之气')
    addEdge('geJu:正财格', 'shiShen:正财', 'requires', 0.95, '正财格要求月令正财之气')
    addEdge('geJu:正印格', 'shiShen:正印', 'requires', 0.95, '正印格要求月令正印之气')
    addEdge('geJu:偏印格', 'shiShen:偏印', 'requires', 0.95, '偏印格要求月令偏印之气')
    addEdge('geJu:食神格', 'shiShen:食神', 'requires', 0.95, '食神格要求月令食神之气')
    addEdge('geJu:伤官格', 'shiShen:伤官', 'requires', 0.95, '伤官格要求月令伤官之气')

    // 格局用神关系
    addEdge('geJu:正官格', 'shiShen:正印', 'requires', 0.8, '正官格喜印绶护官')
    addEdge('geJu:七杀格', 'shiShen:食神', 'requires', 0.8, '七杀格喜食神制杀')
    addEdge('geJu:七杀格', 'shiShen:偏印', 'requires', 0.8, '七杀格喜印星化杀')
    addEdge('geJu:偏财格', 'wangShuai:偏旺', 'requires', 0.7, '偏财格需身旺方能担财')
    addEdge('geJu:伤官配印格', 'shiShen:正印', 'requires', 0.9, '伤官配印格需印星制伤护官')
    addEdge('geJu:食神生财格', 'shiShen:食神', 'requires', 0.9, '食神生财格需食神旺而生财')
    addEdge('geJu:官印相生格', 'shiShen:正官', 'requires', 0.9, '官印相生格需官印俱全')
    addEdge('geJu:官印相生格', 'shiShen:正印', 'requires', 0.9, '官印相生格需官印俱全')
    addEdge('geJu:杀印相生格', 'shiShen:七杀', 'requires', 0.9, '杀印相生格需杀印配合')
    addEdge('geJu:杀印相生格', 'shiShen:偏印', 'requires', 0.9, '杀印相生格需杀印配合')

    // 格局冲突
    addEdge('geJu:伤官格', 'geJu:正官格', 'conflicts_with', 0.9, '伤官见官为祸，格局冲突')
    addEdge('geJu:从官格', 'wangShuai:极弱', 'requires', 0.95, '从官格需日主极弱')
    addEdge('geJu:从财格', 'wangShuai:极弱', 'requires', 0.95, '从财格需日主极弱')
    addEdge('geJu:专旺格', 'wangShuai:极旺', 'requires', 0.95, '专旺格需日主极旺')
    addEdge('geJu:曲直格', 'wuXing:木', 'requires', 0.9, '曲直格需全木之气')
    addEdge('geJu:炎上格', 'wuXing:火', 'requires', 0.9, '炎上格需全火之气')
    addEdge('geJu:稼穑格', 'wuXing:土', 'requires', 0.9, '稼穑格需全土之气')
    addEdge('geJu:从革格', 'wuXing:金', 'requires', 0.9, '从革格需全金之气')
    addEdge('geJu:润下格', 'wuXing:水', 'requires', 0.9, '润下格需全水之气')

    // ════════════════ 旺衰关系 ════════════════
    addEdge('wangShuai:极弱', 'bingYao:身弱财多', 'produces', 0.8, '身极弱易致财多身弱之病')
    addEdge('wangShuai:极弱', 'bingYao:杀旺无制', 'produces', 0.8, '身极弱难担七杀之攻')
    addEdge('wangShuai:偏旺', 'bingYao:比劫过旺', 'produces', 0.7, '身偏旺有比劫过旺之风险')
    addEdge('wangShuai:极旺', 'bingYao:身旺无泄', 'produces', 0.8, '身极旺易致无泄之病')
    addEdge('wangShuai:极旺', 'bingYao:比劫过旺', 'produces', 0.8, '身极旺致比劫争财之患')
    addEdge('wangShuai:极旺', 'bingYao:羊刃倒戈', 'produces', 0.7, '身极旺羊刃无制之险')

    // ════════════════ 调候关系 ════════════════
    addEdge('tiaoHou:寒', 'wuXing:火', 'requires', 0.9, '寒命需火暖局')
    addEdge('tiaoHou:燥', 'wuXing:水', 'requires', 0.9, '燥命需水润局')
    addEdge('tiaoHou:寒', 'tiaoHou:中和', 'conflicts_with', 0.5, '寒命与调候中和相反')

    // ════════════════ 病药关系 ════════════════
    addEdge('bingYao:身弱财多', 'shiShen:正印', 'resolves', 0.9, '身弱财多以印星帮身为药')
    addEdge('bingYao:身弱财多', 'shiShen:比肩', 'resolves', 0.8, '身弱财多以比劫帮身为药')
    addEdge('bingYao:杀旺无制', 'shiShen:食神', 'resolves', 0.9, '杀旺无制以食神制杀为药')
    addEdge('bingYao:杀旺无制', 'shiShen:偏印', 'resolves', 0.8, '杀旺无制以印星化杀为药')
    addEdge('bingYao:比劫过旺', 'shiShen:食神', 'resolves', 0.8, '比劫过旺以食伤泄秀为药')
    addEdge('bingYao:比劫过旺', 'shiShen:七杀', 'resolves', 0.7, '比劫过旺以官杀制劫为药')
    addEdge('bingYao:官杀混杂', 'shiShen:食神', 'resolves', 0.8, '官杀混杂以食神去杀留官为药')
    addEdge('bingYao:五行偏枯', 'wuXing:木', 'resolves', 0.5, '五行偏枯补缺五行')
    addEdge('bingYao:食伤泄身太过', 'shiShen:正印', 'resolves', 0.9, '食伤泄身太过以印制食伤生身为药')
    addEdge('bingYao:印星夺食', 'shiShen:偏财', 'resolves', 0.8, '印星夺食以财星制枭为药')
    addEdge('bingYao:伤官见官', 'shiShen:正印', 'resolves', 0.9, '伤官见官以印星制伤护官为药')
    addEdge('bingYao:身旺无泄', 'shiShen:食神', 'resolves', 0.9, '身旺无泄以食伤泄秀为药')
    addEdge('bingYao:羊刃倒戈', 'shiShen:七杀', 'resolves', 0.9, '羊刃倒戈以官杀制刃为药')

    // ════════════════ 通关关系 ════════════════
    addEdge('tongGuan:水木通关', 'wuXing:金', 'resolves', 0.9, '金木交战以水通关化解')
    addEdge('tongGuan:水木通关', 'wuXing:木', 'resolves', 0.9, '金木交战以水通关化解')
    addEdge('tongGuan:木火通关', 'wuXing:水', 'resolves', 0.9, '水火交战以木通关化解')
    addEdge('tongGuan:木火通关', 'wuXing:火', 'resolves', 0.9, '水火交战以木通关化解')
    addEdge('tongGuan:火土通关', 'wuXing:木', 'resolves', 0.9, '木土交战以火通关化解')
    addEdge('tongGuan:火土通关', 'wuXing:土', 'resolves', 0.9, '木土交战以火通关化解')
    addEdge('tongGuan:土金通关', 'wuXing:火', 'resolves', 0.9, '火金交战以土通关化解')
    addEdge('tongGuan:土金通关', 'wuXing:金', 'resolves', 0.9, '火金交战以土通关化解')
    addEdge('tongGuan:金水通关', 'wuXing:土', 'resolves', 0.9, '土水交战以金通关化解')
    addEdge('tongGuan:金水通关', 'wuXing:水', 'resolves', 0.9, '土水交战以金通关化解')

    // ════════════════ 古籍引用关系 ════════════════
    addEdge('shiShen:比肩', 'guJi:子平真诠', 'cited_in', 0.7, '《子平真诠》论述十神之义')
    addEdge('shiShen:正官', 'guJi:子平真诠', 'cited_in', 0.8, '《子平真诠》专论正官格')
    addEdge('shiShen:七杀', 'guJi:子平真诠', 'cited_in', 0.8, '《子平真诠》专论七杀格')
    addEdge('geJu:正官格', 'guJi:子平真诠', 'cited_in', 0.9, '《子平真诠》有正官格专论')
    addEdge('geJu:七杀格', 'guJi:子平真诠', 'cited_in', 0.9, '《子平真诠》有七杀格专论')
    addEdge('geJu:偏财格', 'guJi:子平真诠', 'cited_in', 0.8, '《子平真诠》有偏财格论述')
    addEdge('geJu:官印相生格', 'guJi:子平真诠', 'cited_in', 0.9, '《子平真诠》论官印相生')
    addEdge('geJu:伤官配印格', 'guJi:子平真诠', 'cited_in', 0.9, '《子平真诠》论伤官配印')
    addEdge('wangShuai:极弱', 'guJi:滴天髓', 'cited_in', 0.9, '《滴天髓》论旺衰辨析')
    addEdge('wangShuai:极旺', 'guJi:滴天髓', 'cited_in', 0.9, '《滴天髓》论旺衰辨析')
    addEdge('bingYao:身弱财多', 'guJi:滴天髓', 'cited_in', 0.9, '《滴天髓》"有病方为贵，无伤不是奇"')
    addEdge('bingYao:杀旺无制', 'guJi:滴天髓', 'cited_in', 0.9, '《滴天髓》论七杀制化')
    addEdge('tongGuan:水木通关', 'guJi:滴天髓', 'cited_in', 0.9, '《滴天髓》论通关之理')
    addEdge('tongGuan:木火通关', 'guJi:滴天髓', 'cited_in', 0.9, '《滴天髓》论通关之理')
    addEdge('tiaoHou:寒', 'guJi:穷通宝鉴', 'cited_in', 0.9, '《穷通宝鉴》论调候用神')
    addEdge('tiaoHou:燥', 'guJi:穷通宝鉴', 'cited_in', 0.9, '《穷通宝鉴》论调候用神')
    addEdge('geJu:曲直格', 'guJi:三命通会', 'cited_in', 0.8, '《三命通会》论专旺格局')
    addEdge('geJu:炎上格', 'guJi:三命通会', 'cited_in', 0.8, '《三命通会》论专旺格局')
    addEdge('shenSha:天乙贵人', 'guJi:三命通会', 'cited_in', 0.8, '《三命通会》论神煞')
    addEdge('shenSha:桃花', 'guJi:三命通会', 'cited_in', 0.8, '《三命通会》论桃花')
    addEdge('shenSha:文昌', 'guJi:渊海子平', 'cited_in', 0.7, '《渊海子平》论文昌星')
    addEdge('shiShen:比劫', 'guJi:渊海子平', 'cited_in', 0.7, '《渊海子平》论比劫之义')
    addEdge('bingYao:官杀混杂', 'guJi:神峰通考', 'cited_in', 0.8, '《神峰通考》论官杀混杂')

    // ════════════════ 神煞影响关系 ════════════════
    addEdge('shenSha:桃花', 'shiShen:正财', 'affects', 0.5, '桃花影响正财（婚姻关系）')
    addEdge('shenSha:羊刃', 'shiShen:劫财', 'affects', 0.7, '羊刃加剧劫财之凶')
    addEdge('shenSha:文昌', 'shiShen:食神', 'affects', 0.5, '文昌增强食神之才华')
    addEdge('shenSha:天乙贵人', 'shiShen:正印', 'affects', 0.6, '天乙贵人增强印星之贵')
    addEdge('shenSha:红鸾', 'shiShen:正财', 'affects', 0.6, '红鸾利婚姻正财')

    // ════════════════ 五行健康影响 ════════════════
    addEdge('wuXing:木', 'shenSha:天煞', 'affects', 0.3, '木旺影响健康运势')
    addEdge('wuXing:火', 'shenSha:灾煞', 'affects', 0.3, '火旺有灾煞之虑')

    // ════════════════ 日主关系 ════════════════
    addEdge('dayMaster:甲木', 'wuXing:木', 'belongs_to', 1.0, '甲木属于木五行')
    addEdge('dayMaster:乙木', 'wuXing:木', 'belongs_to', 1.0, '乙木属于木五行')
    addEdge('dayMaster:丙火', 'wuXing:火', 'belongs_to', 1.0, '丙火属于火五行')
    addEdge('dayMaster:丁火', 'wuXing:火', 'belongs_to', 1.0, '丁火属于火五行')
    addEdge('dayMaster:戊土', 'wuXing:土', 'belongs_to', 1.0, '戊土属于土五行')
    addEdge('dayMaster:己土', 'wuXing:土', 'belongs_to', 1.0, '己土属于土五行')
    addEdge('dayMaster:庚金', 'wuXing:金', 'belongs_to', 1.0, '庚金属于金五行')
    addEdge('dayMaster:辛金', 'wuXing:金', 'belongs_to', 1.0, '辛金属于金五行')
    addEdge('dayMaster:壬水', 'wuXing:水', 'belongs_to', 1.0, '壬水属于水五行')
    addEdge('dayMaster:癸水', 'wuXing:水', 'belongs_to', 1.0, '癸水属于水五行')

    // 日主与调候
    addEdge('dayMaster:丁火', 'tiaoHou:寒', 'relates_to', 0.7, '丁火生于冬季为寒命')
    addEdge('dayMaster:丙火', 'tiaoHou:寒', 'relates_to', 0.6, '丙火生于冬季需调候')
    addEdge('dayMaster:壬水', 'tiaoHou:燥', 'relates_to', 0.6, '壬水生于夏季需调候')
    addEdge('dayMaster:癸水', 'tiaoHou:燥', 'relates_to', 0.7, '癸水生于夏季为燥命')

    // 注册所有边
    for (const edge of edges) {
      this.edges.set(edge.id, edge)
    }
  }

  private buildAdjacency(): void {
    for (const [nodeId] of this.nodes) {
      this.adjacencyList.set(nodeId, new Set())
    }
    for (const edge of this.edges.values()) {
      // 源→目标
      if (!this.adjacencyList.has(edge.source)) {
        this.adjacencyList.set(edge.source, new Set())
      }
      this.adjacencyList.get(edge.source)!.add(edge.target)
      // 双向
      if (edge.bidirectional) {
        if (!this.adjacencyList.has(edge.target)) {
          this.adjacencyList.set(edge.target, new Set())
        }
        this.adjacencyList.get(edge.target)!.add(edge.source)
      }
    }
  }

  // ───────────────────── 查询接口 ─────────────────────

  /** 获取单个节点 */
  getNode(id: string): KGNode | undefined {
    return this.nodes.get(id)
  }

  /** 获取单条边 */
  getEdge(id: string): KGEdge | undefined {
    return this.edges.get(id)
  }

  /** 按类型获取所有节点 */
  getNodesByType(type: KGNodeType): KGNode[] {
    const result: KGNode[] = []
    for (const node of this.nodes.values()) {
      if (node.type === type) result.push(node)
    }
    return result
  }

  /** 获取从某节点出发的所有边 */
  getEdgesFrom(nodeId: string): KGEdge[] {
    const result: KGEdge[] = []
    for (const edge of this.edges.values()) {
      if (edge.source === nodeId) result.push(edge)
    }
    return result
  }

  /** 获取指向某节点的所有边 */
  getEdgesTo(nodeId: string): KGEdge[] {
    const result: KGEdge[] = []
    for (const edge of this.edges.values()) {
      if (edge.target === nodeId) result.push(edge)
    }
    return result
  }

  /** 获取某节点的所有邻居 */
  getNeighbors(nodeId: string): KGNode[] {
    const neighborIds = this.adjacencyList.get(nodeId)
    if (!neighborIds) return []
    const result: KGNode[] = []
    for (const nid of neighborIds) {
      const node = this.nodes.get(nid)
      if (node) result.push(node)
    }
    return result
  }

  /** BFS 最短路径查找 */
  getPath(fromId: string, toId: string): KGEdge[] {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return []
    if (fromId === toId) return []

    const visited = new Set<string>()
    const queue: string[] = [fromId]
    const parentMap: Map<string, { nodeId: string; edgeId: string } | null> = new Map()
    parentMap.set(fromId, null)
    visited.add(fromId)

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === toId) {
        // 回溯路径
        const path: KGEdge[] = []
        let node: string | null = toId
        while (node !== null && node !== fromId) {
          const parentInfo: { nodeId: string; edgeId: string } | null | undefined = parentMap.get(node)
          if (parentInfo) {
            const edge = this.edges.get(parentInfo.edgeId)
            if (edge) path.unshift(edge)
            node = parentInfo.nodeId
          } else {
            break
          }
        }
        return path
      }

      // 遍历所有邻接节点
      const neighborIds = this.adjacencyList.get(current)
      if (neighborIds) {
        for (const nid of neighborIds) {
          if (!visited.has(nid)) {
            visited.add(nid)
            queue.push(nid)
            // 找到连接 current → nid 的边
            const edge = this.findEdgeBetween(current, nid)
            if (edge) {
              parentMap.set(nid, { nodeId: current, edgeId: edge.id })
            }
          }
        }
      }
    }

    return [] // 无路径
  }

  /** 查找两个节点之间的边（任意方向） */
  private findEdgeBetween(fromId: string, toId: string): KGEdge | undefined {
    for (const edge of this.edges.values()) {
      if (edge.source === fromId && edge.target === toId) return edge
      if (edge.source === toId && edge.target === fromId) return edge
    }
    return undefined
  }

  // ───────────────────── 子图提取 ─────────────────────

  /** 提取以某节点为中心的子图 */
  getSubGraph(centerNodeId: string, depth: number = 2): KGSubGraph {
    const centerNode = this.nodes.get(centerNodeId)
    if (!centerNode) {
      return { nodes: [], edges: [], centralNode: centerNodeId, summary: '未找到该节点' }
    }

    const collectedNodes = new Map<string, KGNode>()
    const collectedEdges = new Set<string>()
    collectedNodes.set(centerNodeId, centerNode)

    // BFS 收集子图
    const queue: { nodeId: string; currentDepth: number }[] = [{ nodeId: centerNodeId, currentDepth: 0 }]
    const visited = new Set<string>([centerNodeId])

    while (queue.length > 0) {
      const { nodeId, currentDepth } = queue.shift()!
      if (currentDepth >= depth) continue

      const neighborIds = this.adjacencyList.get(nodeId)
      if (neighborIds) {
        for (const nid of neighborIds) {
          if (!visited.has(nid)) {
            visited.add(nid)
            const neighborNode = this.nodes.get(nid)
            if (neighborNode) {
              collectedNodes.set(nid, neighborNode)
              if (currentDepth + 1 < depth) {
                queue.push({ nodeId: nid, currentDepth: currentDepth + 1 })
              }
            }
          }
          // 收集连接边
          const edge = this.findEdgeBetween(nodeId, nid)
          if (edge) {
            collectedEdges.add(edge.id)
          }
        }
      }
    }

    const nodes = Array.from(collectedNodes.values())
    const edges = Array.from(collectedEdges).map(eid => this.edges.get(eid)!).filter(Boolean)

    const summary = this.generateSubGraphSummary(centerNode, nodes, edges)

    return { nodes, edges, centralNode: centerNodeId, summary }
  }

  /** 生成子图摘要 */
  private generateSubGraphSummary(center: KGNode, nodes: KGNode[], edges: KGEdge[]): string {
    const types = new Set<string>()
    for (const n of nodes) types.add(n.type)
    const typeNames = this.getTypeNameMap()
    const typeStrs = Array.from(types).map(t => typeNames[t] || t).join('、')

    const neighborCount = nodes.length - 1
    const descriptions = pickN([
      `${center.name}为核心，关联${neighborCount}个相关节点，涵盖${typeStrs}等多个维度。`,
      `以${center.name}为中心的知识网络，涉及${typeStrs}等${neighborCount}个关联知识点。`,
      `${center.name}的关联知识图谱包含${neighborCount}个邻接节点，横跨${typeStrs}等分类。`,
      `围绕${center.name}展开的知识子图，涵盖${typeStrs}等领域共${neighborCount}个知识点。`
    ], 1)

    return descriptions[0]
  }

  private getTypeNameMap(): Record<string, string> {
    return {
      'shiShen': '十神', 'geJu': '格局', 'wangShuai': '旺衰',
      'tiaoHou': '调候', 'bingYao': '病药', 'tongGuan': '通关',
      'guJi': '古籍', 'shenSha': '神煞', 'case': '案例',
      'wuXing': '五行', 'dayMaster': '日主'
    }
  }

  // ───────────────────── 智能推理 ─────────────────────

  /** 基于节点进行推理 */
  infer(nodeIds: string[]): KGInference[] {
    const results: KGInference[] = []
    const nodeMap = new Map<string, KGNode>()
    for (const nid of nodeIds) {
      const node = this.nodes.get(nid)
      if (node) nodeMap.set(nid, node)
    }

    // 收集相关边
    const relatedEdges: KGEdge[] = []
    for (const edge of this.edges.values()) {
      if (nodeIds.includes(edge.source) || nodeIds.includes(edge.target)) {
        relatedEdges.push(edge)
      }
    }

    // 应用推理规则
    for (const rule of this.getInferenceRules()) {
      const matches = this.matchRule(rule, nodeMap, relatedEdges)
      if (matches) {
        results.push({
          sourceNodes: matches.sourceNodes,
          inference: pickN(matches.conclusions, 1)[0],
          confidence: matches.confidence,
          relatedEdges: matches.edgeIds,
          classicalRef: matches.classicalRef
        })
      }
    }

    return results
  }

  /** 推理规则匹配 */
  private matchRule(
    rule: InferenceRule,
    nodeMap: Map<string, KGNode>,
    edges: KGEdge[]
  ): InferenceMatch | null {
    const { nodeTypes, edgeTypes, conclusions, confidence, classicalRef } = rule

    // 检查节点类型是否匹配
    const matchedNodes: string[] = []
    for (const [nid, node] of nodeMap) {
      if (nodeTypes.includes(node.type) || nodeTypes.some(nt => nid.startsWith(nt + ':'))) {
        matchedNodes.push(nid)
      }
    }
    if (matchedNodes.length < nodeTypes.length) return null

    // 检查边类型是否匹配
    const matchedEdgeIds: string[] = []
    for (const edge of edges) {
      if (edgeTypes.length === 0 || edgeTypes.includes(edge.type)) {
        matchedEdgeIds.push(edge.id)
      }
    }

    return {
      sourceNodes: matchedNodes.slice(0, 3),
      conclusions,
      confidence,
      edgeIds: matchedEdgeIds.slice(0, 3),
      classicalRef
    }
  }

  /** 15条推理规则 */
  private getInferenceRules(): InferenceRule[] {
    return [
      // 规则1：格局→用神
      {
        nodeTypes: ['geJu'],
        edgeTypes: ['requires'],
        conclusions: [
          '格局定矣，用神取格局所喜之五行，顺则吉逆则凶。',
          '格局既成，用神宜取格局所需之星曜，辅以调候方为完备。',
          '格局之用神须兼顾扶抑与调候，二者不可偏废。'
        ],
        confidence: 90,
        classicalRef: '《子平真诠》"论用神"'
      },
      // 规则2：旺衰→用神
      {
        nodeTypes: ['wangShuai'],
        edgeTypes: [],
        conclusions: [
          '身旺宜泄耗，用神取食伤财官以流通日主之气。',
          '身弱宜扶助，用神取印星比劫以帮扶日主。',
          '中和之命最为难得，用神可取流通之星以引动全局。'
        ],
        confidence: 85,
        classicalRef: '《滴天髓》"旺衰篇"'
      },
      // 规则3：旺衰→风险
      {
        nodeTypes: ['wangShuai', 'bingYao'],
        edgeTypes: ['produces'],
        conclusions: [
          '身弱而又财多，恐有富屋贫人之叹，需印比帮身方可解困。',
          '身极旺而缺泄，能量无法流通，如同洪水无河道，恐有决堤之患。',
          '偏旺之命需及时引导，否则过刚易折。'
        ],
        confidence: 80,
        classicalRef: '《滴天髓》"有病方为贵，无伤不是奇"'
      },
      // 规则4：十神→六亲
      {
        nodeTypes: ['shiShen'],
        edgeTypes: [],
        conclusions: [
          '十神对应六亲关系，比肩主兄弟、食伤主子女、财星主妻父、官杀主子女丈夫、印星主母亲。',
          '十神为六亲之映射，人际关系之吉凶可从十神之旺衰推断。'
        ],
        confidence: 90,
        classicalRef: '《渊海子平》"论六亲"'
      },
      // 规则5：十神→性格
      {
        nodeTypes: ['shiShen'],
        edgeTypes: [],
        conclusions: [
          '食神之人心性温和，注重生活品质，有口福之象，一生衣食不愁。',
          '伤官之人聪明绝顶但恃才傲物，追求自由不受约束。',
          '正官之人循规蹈矩、重视名誉，有责任感，适合从事管理工作。',
          '七杀之人威严果断，有魄力敢担当，适合竞争性行业。',
          '正印之人仁慈宽厚，学识渊博，多有贵人相助。'
        ],
        confidence: 80,
        classicalRef: '《子平真诠》"论十神性情"'
      },
      // 规则6：格局→人生走向
      {
        nodeTypes: ['geJu'],
        edgeTypes: [],
        conclusions: [
          '偏财格主财运亨通，然需身旺方能担财，否则财多身弱反为累赘。',
          '正官格主人事业有成、贵气临门，适合从政或进入体制内发展。',
          '食神格主福寿双全，衣食无忧，一生平顺少波折。',
          '七杀格主权威显赫，然有制化方可成大器，无制化则灾祸不断。'
        ],
        confidence: 75,
        classicalRef: '《子平真诠》"论格局高低"'
      },
      // 规则7：五行→健康
      {
        nodeTypes: ['wuXing'],
        edgeTypes: [],
        conclusions: [
          '木旺之人需注意肝胆系统健康，春季尤甚，宜保持情绪平和以养肝。',
          '火旺之人需注意心脏、血液循环系统，夏季忌过度劳累。',
          '土旺之人需注意脾胃消化系统，饮食宜规律节制。',
          '金旺之人需注意肺部、呼吸系统，秋季干燥宜润肺。',
          '水旺之人需注意肾脏、泌尿系统，冬季宜保暖养肾。'
        ],
        confidence: 70,
        classicalRef: '《滴天髓》"五行统论"'
      },
      // 规则8：神煞→影响
      {
        nodeTypes: ['shenSha'],
        edgeTypes: [],
        conclusions: [
          '桃花入命者感情丰富、异性缘好，但需防感情纠纷，正桃花利婚姻。',
          '天乙贵人为命中最吉之煞，逢凶化吉，一生多得贵人提携。',
          '文昌星利学业文途，命带文昌之人聪明好学，适合从事文化教育事业。',
          '驿马星主奔波变动，适合从事需要频繁出差的职业或在外地发展。'
        ],
        confidence: 65,
        classicalRef: '《三命通会》"论神煞"'
      },
      // 规则9：调候→需求
      {
        nodeTypes: ['tiaoHou'],
        edgeTypes: ['requires'],
        conclusions: [
          '寒命之局亟需火来暖局，调候用神取丙丁火，方可生机勃发。',
          '燥命之局急需水来润泽，调候用神取壬癸水，方可清凉平和。',
          '调候为用神之先决条件，寒暖失调则格局难成，需先调候再论格局。'
        ],
        confidence: 85,
        classicalRef: '《穷通宝鉴》"十二月调候用神"'
      },
      // 规则10：通关→化解
      {
        nodeTypes: ['tongGuan'],
        edgeTypes: ['resolves'],
        conclusions: [
          '金木交战则以水通关，金生水、水生木，化克为生使五行流通。',
          '水火相克则以木通关，水生木、木生火，化敌为友使格局有情。',
          '通关之理在于化克为生，使对立之五行通过媒介形成良性循环。',
          '通关成功与否取决于通关之五行力量是否充足，力量不足则难以调和。'
        ],
        confidence: 80,
        classicalRef: '《滴天髓》"通关论"'
      },
      // 规则11：病药→治法
      {
        nodeTypes: ['bingYao'],
        edgeTypes: ['resolves'],
        conclusions: [
          '身弱财多之病以印星比劫为药，印比帮身则能担财，化弱为强。',
          '杀旺无制之病以食神制杀或印星化杀为药，化煞为权方为贵命。',
          '官杀混杂之病需去一留一，食神去杀留官或印星化杀皆可。',
          '伤官见官之病以印星制伤护官为药，使伤官不害官星。'
        ],
        confidence: 85,
        classicalRef: '《滴天髓》"有病方为贵，无伤不是奇"'
      },
      // 规则12：格局→古籍
      {
        nodeTypes: ['geJu'],
        edgeTypes: ['cited_in'],
        conclusions: [
          '此格局在命理古籍中有详细论述，可参考《子平真诠》以深入了解格局取用之法。',
          '《滴天髓》对此格局之旺衰辨析有精妙论述，宜细读以明其理。',
          '《穷通宝鉴》详论此格局之调候需求，调候为格局成否之关键。',
          '《三命通会》对此格局有多种案例分析，可供参考印证。'
        ],
        confidence: 90,
        classicalRef: '《子平真诠》'
      },
      // 规则13：五行→方位
      {
        nodeTypes: ['wuXing'],
        edgeTypes: [],
        conclusions: [
          '木之方位为东方，木命之人利于东方发展，办公座位宜坐西朝东。',
          '火之方位为南方，火命之人利于南方发展，事业南迁多有利。',
          '土之方位为中央，土命之人利于本地发展，根基稳固方可成事。',
          '金之方位为西方，金命之人利于西方发展，西方属金可助其运势。',
          '水之方位为北方，水命之人利于北方发展，北方属水可助其智慧。'
        ],
        confidence: 60,
        classicalRef: '《滴天髓》"五行方位"'
      },
      // 规则14：日主→调候
      {
        nodeTypes: ['dayMaster', 'tiaoHou'],
        edgeTypes: ['relates_to'],
        conclusions: [
          '丁火生于子月，水旺火弱为寒命，急需丙火暖局、甲木生扶方可成器。',
          '癸水生于午月，火旺水弱为燥命，急需壬水比肩助身、金生水之源。',
          '甲木生于酉月，金旺木弱需水通关，金生水、水生木化克为生。',
          '庚金生于午月，火旺金弱需土泄火生金，火土金流通有情。'
        ],
        confidence: 80,
        classicalRef: '《穷通宝鉴》'
      },
      // 规则15：十神组合→推断
      {
        nodeTypes: ['shiShen', 'geJu'],
        edgeTypes: [],
        conclusions: [
          '官印相生为事业稳定之象，官星得印护、印星得官生，循环相生主贵。',
          '食神生财为才华变现之象，以一技之长创造财富，福禄双全。',
          '杀印相生为以柔克刚之象，以印化杀之暴力为权柄，武职大贵。',
          '伤官配印为文人之贵格，印制伤官使不害官，才华与地位兼得。'
        ],
        confidence: 85,
        classicalRef: '《子平真诠》"论十干配合"'
      }
    ]
  }

  // ───────────────────── 核心函数：explainTopic ─────────────────────

  /**
   * explainTopic — 话题解释的核心函数
   * 接收话题字符串，从图谱中查找相关节点，提取子图，进行智能推理
   */
  explainTopic(topic: string, context?: ExplainKGContext): KGQueryResult {
    const knownTopics = new Set<string>(context?.knownTopics || [])

    // 1. 查找与话题匹配的节点
    const matchedNodes = this.findNodesByTopic(topic)
    if (matchedNodes.length === 0) {
      return {
        nodes: [],
        edges: [],
        subGraphs: [],
        inferred: [],
        summary: pickN([
          `暂未在知识图谱中找到与"${topic}"直接相关的条目，可尝试调整关键词。`,
          `知识图谱中暂未收录"${topic}"相关内容，建议换一个话题试试。`
        ], 1)[0]
      }
    }

    // 2. 提取子图（depth=2）
    const subGraphs: KGSubGraph[] = []
    const allNodes = new Map<string, KGNode>()
    const allEdges = new Map<string, KGEdge>()

    for (const node of matchedNodes) {
      const subGraph = this.getSubGraph(node.id, 2)
      subGraphs.push(subGraph)
      for (const n of subGraph.nodes) allNodes.set(n.id, n)
      for (const e of subGraph.edges) allEdges.set(e.id, e)
    }

    // 3. 结合上下文筛选节点
    if (context) {
      this.filterByContext(allNodes, context)
    }

    // 4. 智能推理（基于匹配节点 + 邻居节点）
    const inferenceNodeIds = Array.from(allNodes.keys()).slice(0, 8)
    let inferred = this.infer(inferenceNodeIds)

    // 5. 去重：排除已知话题已覆盖的推理
    if (knownTopics.size > 0) {
      inferred = inferred.filter(inf => {
        const isCovered = Array.from(knownTopics).some(kt =>
          inf.inference.includes(kt) || inf.sourceNodes.some(sn => sn.includes(kt))
        )
        return !isCovered
      })
    }

    // 6. 若有日主和格局上下文，补充个性化推理
    if (context?.dayGan && context?.geJuName) {
      const personalized = this.generatePersonalizedInference(context)
      inferred = [...inferred, ...personalized]
    }

    // 7. 生成摘要
    const summary = this.generateTopicSummary(topic, matchedNodes, inferred, context)

    return {
      nodes: Array.from(allNodes.values()),
      edges: Array.from(allEdges.values()),
      subGraphs,
      inferred,
      summary
    }
  }

  /** 按话题查找节点 */
  private findNodesByTopic(topic: string): KGNode[] {
    const results: KGNode[] = []

    // 精确ID匹配
    const directNode = this.nodes.get(topic)
    if (directNode) {
      results.push(directNode)
      return results
    }

    // 名称和别名匹配
    for (const node of this.nodes.values()) {
      if (node.name === topic || node.aliases.includes(topic)) {
        results.push(node)
        continue
      }
      // 模糊匹配：话题包含节点名或节点名包含话题
      if (topic.length >= 2 && (
        node.name.includes(topic) ||
        node.id.includes(topic) ||
        topic.includes(node.name)
      )) {
        results.push(node)
      }
    }

    return results
  }

  /** 按上下文过滤节点 */
  private filterByContext(nodes: Map<string, KGNode>, context: ExplainKGContext): void {
    // 如果有指定日主五行，优先保留相关节点
    if (context.dayElement) {
      const element = context.dayElement
      const relatedNodes: string[] = []
      // 保留与日主五行直接相关的节点
      for (const [nid] of nodes) {
        if (nid.includes(`:${element}`)) {
          relatedNodes.push(nid)
        }
      }
      // 也保留日主节点
      if (context.dayGan) {
        const dmId = `dayMaster:${context.dayGan}`
        if (nodes.has(dmId)) relatedNodes.push(dmId)
      }
    }
  }

  /** 生成个性化推理 */
  private generatePersonalizedInference(context: ExplainKGContext): KGInference[] {
    const results: KGInference[] = []
    const { dayGan, geJuName, strengthLevel, dayElement } = context

    // 日主+格局组合推理
    if (dayGan && geJuName) {
      const dmNode = this.nodes.get(`dayMaster:${dayGan}`)
      const gjNode = this.nodes.get(`geJu:${geJuName}`)
      const sourceNodes: string[] = []
      if (dmNode) sourceNodes.push(dmNode.id)
      if (gjNode) sourceNodes.push(gjNode.id)

      results.push({
        sourceNodes,
        inference: pickN([
          dayGan + '日主入' + geJuName + '，需结合日主之五行属性与格局之用神方向，依古法详加推演，方可精准论断。',
          `${dayGan}之性与${geJuName}之格相配，日主特质为格局之发挥提供基础，二者不可分割而论。`
        ], 1)[0],
        confidence: 75,
        relatedEdges: [],
        classicalRef: '《子平真诠》'
      })
    }

    // 旺衰+调候组合推理
    if (strengthLevel && dayElement) {
      const wsNode = this.nodes.get(`wangShuai:${strengthLevel}`)
      if (wsNode) {
        results.push({
          sourceNodes: [wsNode.id],
          inference: pickN([
            `日主${dayGan || ''}五行属${dayElement}，${strengthLevel}之命需配合调候需求，寒则暖之、燥则润之，方可论格局高低。`,
            `${strengthLevel}之命以${dayElement}日主论之，旺衰调候兼顾方为上乘，不可偏废其一。`
          ], 1)[0],
          confidence: 70,
          relatedEdges: [],
          classicalRef: '《穷通宝鉴》'
        })
      }
    }

    return results
  }

  /** 生成话题摘要 */
  private generateTopicSummary(
    topic: string,
    matchedNodes: KGNode[],
    inferred: KGInference[],
    context?: ExplainKGContext
  ): string {
    const nodeNames = matchedNodes.map(n => n.name).join('、')
    const typeNames = [...new Set(matchedNodes.map(n => {
      const m = this.getTypeNameMap()
      return m[n.type] || n.type
    }))].join('、')

    const summaries = [
      `关于"${topic}"的知识分析：涉及${typeNames}类别中的${nodeNames}等核心概念，`,
      `围绕"${topic}"展开的命理知识图谱分析：涵盖${typeNames}等${matchedNodes.length}个相关知识点，`,
      `"${topic}"在命理学中的定位：关联${typeNames}中的${nodeNames}，`
    ]

    let suffix = ''
    if (inferred.length > 0) {
      suffix = pickN([
        `通过图谱推理得出了${inferred.length}条智能分析结论，涵盖用神取法、吉凶推断、古籍依据等方面。`,
        `知识图谱已综合推演出${inferred.length}条延伸知识，包括性格特征、运势走向、健康提醒等维度。`,
        `基于图谱关系网络，共发现${inferred.length}条可引用的推理结论，可供深度解读参考。`
      ], 1)[0]
    } else {
      suffix = '知识图谱已收录相关基础知识，可供引用解读。'
    }

    return pick(summaries) + suffix
  }

  // ───────────────────── 统计接口 ─────────────────────

  /** 获取图谱统计信息 */
  getStats(): {
    nodeCount: number
    edgeCount: number
    nodeTypes: Record<string, number>
    edgeTypes: Record<string, number>
  } {
    const nodeTypes: Record<string, number> = {}
    const edgeTypes: Record<string, number> = {}

    for (const node of this.nodes.values()) {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1
    }
    for (const edge of this.edges.values()) {
      edgeTypes[edge.type] = (edgeTypes[edge.type] || 0) + 1
    }

    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      nodeTypes,
      edgeTypes
    }
  }

  // ───────────────────── 图遍历 ─────────────────────

  /** 图遍历（DFS，支持提前终止） */
  traverse(
    startId: string,
    visitor: (node: KGNode, depth: number) => boolean | void,
    maxDepth: number = 5
  ): void {
    const visited = new Set<string>()
    const dfs = (nodeId: string, depth: number): boolean => {
      if (depth > maxDepth) return true
      if (visited.has(nodeId)) return true
      visited.add(nodeId)

      const node = this.nodes.get(nodeId)
      if (!node) return true

      const shouldStop = visitor(node, depth)
      if (shouldStop === true) return false

      const neighbors = this.adjacencyList.get(nodeId)
      if (neighbors) {
        for (const nid of neighbors) {
          const shouldContinue = dfs(nid, depth + 1)
          if (shouldContinue === false) return false
        }
      }
      return true
    }

    dfs(startId, 0)
  }
}

// ─── 内部推理规则类型 ───

interface InferenceRule {
  nodeTypes: KGNodeType[]
  edgeTypes: KGEdgeType[]
  conclusions: string[]
  confidence: number
  classicalRef?: string
}

interface InferenceMatch {
  sourceNodes: string[]
  conclusions: string[]
  confidence: number
  edgeIds: string[]
  classicalRef?: string
}
