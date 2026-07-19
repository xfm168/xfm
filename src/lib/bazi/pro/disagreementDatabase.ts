/**
 * 命理分歧数据库
 *
 * 职责：存储静态冲突数据（至少 10 条真实命理冲突）
 * 提供查询函数：getAllConflicts, getConflictsByType, getConflictsByTopic, getConflictsByCaseId
 */

import type { ConflictRecordV2, ConflictType } from './caseLibraryTypesV2'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const DISAGREEMENT_DATABASE_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 静态冲突数据（至少 10 条真实命理冲突）
// ═══════════════════════════════════════════

export const DISAGREEMENT_CONFLICTS: readonly ConflictRecordV2[] = [
  {
    conflictId: 'CNF-001',
    conflictType: 'school',
    topic: '调候用神 vs 滴天髓用神',
    description: '调候派主张以气候寒暖燥湿为优先取用神，滴天髓派主张以日主强弱和五行平衡为核心取用神。两者在同一命盘中常得出不同结论。',
    viewpointA: '调候派：冬木需火调候，即使日主偏强亦取火为用',
    viewpointB: '滴天髓派：日主强则克泄耗为用，调候仅作参考',
    sourceA: '《穷通宝鉴》',
    sourceB: '《滴天髓》',
    resolution: '现代综合派主张先看日主强弱，再考虑调候，两者结合而非对立',
    affectedCaseIds: ['CLS-001', 'CLS-002'],
  },
  {
    conflictId: 'CNF-002',
    conflictType: 'classical',
    topic: '子平真诠 vs 神峰通考：格局判定分歧',
    description: '子平真诠以月令透干定格为主，神峰通考则强调要综合天干地支、气象、神煞等多维因素判定格局，两者在月令不透干时分歧最大。',
    viewpointA: '子平真诠：月令不透则取余气或支藏，格局以月令为核心',
    viewpointB: '神峰通考：格局需看全局气象，月令仅是一个参考维度',
    sourceA: '《子平真诠》',
    sourceB: '《神峰通考》',
    affectedCaseIds: ['CLS-003', 'CLS-004'],
  },
  {
    conflictId: 'CNF-003',
    conflictType: 'school',
    topic: '三合局 vs 三会局：力量对比分歧',
    description: '三合局与三会局在力量大小上各派说法不一。一派认为三合局力量更大，因为包含多种五行；另一派认为三会局力量更大，因为同气相求。',
    viewpointA: '三合派：三合局力量大于三会局，因其五行循环相生',
    viewpointB: '三会派：三会局力量大于三合局，因其同气相聚，气势更纯',
    sourceA: '《三命通会》',
    sourceB: '《渊海子平》',
    resolution: '一般认为三会局力量略大于三合局，但需结合具体天干和全局判断',
    affectedCaseIds: ['CLS-005'],
  },
  {
    conflictId: 'CNF-004',
    conflictType: 'expert',
    topic: '身弱印星为喜还是为忌',
    description: '身弱时印星可生扶日主，但印星过旺亦会泄耗官杀、克制食伤。不同专家在身弱印旺时的喜忌判断上存在分歧。',
    viewpointA: '身弱必喜印，印星为第一喜用神',
    viewpointB: '身弱印旺反为忌，需先财破印或比劫分印',
    sourceA: '徐乐吾',
    sourceB: '韦千里',
    affectedCaseIds: ['ANM-001', 'ANM-002'],
  },
  {
    conflictId: 'CNF-005',
    conflictType: 'classical',
    topic: '天干五合是否论化',
    description: '甲己合化土、乙庚合化金等天干五合，古典文献对"合而不化"与"合而化"的判定标准存在显著分歧。',
    viewpointA: '月令为化神即可论化，不必日主参与',
    viewpointB: '合化必须日主为化神，且地支有强根方可论化',
    sourceA: '《滴天髓》',
    sourceB: '《子平真诠》',
    affectedCaseIds: ['CLS-006', 'CLS-007'],
  },
  {
    conflictId: 'CNF-006',
    conflictType: 'school',
    topic: '从格判定标准：真从 vs 假从',
    description: '从格（从强、从弱、从儿、从财、从杀）的判定标准在各流派间差异极大，尤其是一丝生扶之气是否破格的问题。',
    viewpointA: '严格从格派：地支一丝根气即不从，必须全局纯净',
    viewpointB: '宽松从格派：只要气势一方独大，微弱根气不影响从格成立',
    sourceA: '传统格局派',
    sourceB: '现代新派',
    resolution: '实践中需结合大运流年验证，理论分歧需以事实为准',
    affectedCaseIds: ['REG-001', 'REG-002', 'REG-003'],
  },
  {
    conflictId: 'CNF-007',
    conflictType: 'expert',
    topic: '空亡的应事范围与严重程度',
    description: '空亡在八字中的应事范围和严重程度，不同专家有不同的解读。有人认为空亡仅影响该柱十神力量，有人认为空亡会影响整体格局。',
    viewpointA: '空亡主要减弱该柱十神力量，不影响格局定性',
    viewpointB: '空亡可能导致格局变化，尤其日柱空亡时需重新评估日主强弱',
    sourceA: '梁湘润',
    sourceB: '钟义明',
    affectedCaseIds: ['ANM-003', 'ANM-004'],
  },
  {
    conflictId: 'CNF-008',
    conflictType: 'classical',
    topic: '大运排列：顺排 vs 逆排之争',
    description: '大运顺逆排的规则在古籍中看似明确（阳男阴女顺排，阴男阳女逆排），但涉及节气交接、闰月等边缘情况时存在不同解读。',
    viewpointA: '严格按出生年天干阴阳和性别决定顺逆，不考虑节气前后',
    viewpointB: '需结合出生日是否在节气后三日以内，存在变格可能',
    sourceA: '《三命通会》',
    sourceB: '《命理约言》',
    affectedCaseIds: ['CLS-008', 'REG-004'],
  },
  {
    conflictId: 'CNF-009',
    conflictType: 'school',
    topic: '胎元、命宫、身宫是否参与格局分析',
    description: '现代命理学界对胎元、命宫、身宫这三柱辅助信息是否应该参与格局和喜用神分析存在较大争议。',
    viewpointA: '胎元命宫身宫是重要辅助信息，参与格局和用神判断',
    viewpointB: '仅四柱为主，胎元命宫身宫仅作参考，不参与核心格局分析',
    sourceA: '传统全盘派',
    sourceB: '现代简化派',
    affectedCaseIds: ['CLS-009', 'CLS-010'],
  },
  {
    conflictId: 'CNF-010',
    conflictType: 'school',
    topic: '神煞在断命中的权重分配',
    description: '天乙贵人、文昌、桃花、驿马等神煞在八字分析中的权重，各派看法不一。有的流派重神煞，有的流派轻神煞。',
    viewpointA: '神煞是重要辅助信息，可独立论断吉凶',
    viewpointB: '神煞仅作参考，需结合格局和喜忌综合判断，不可独立论断',
    sourceA: '神煞派',
    sourceB: '格局派',
    resolution: '主流共识：神煞作辅助参考，不能凌驾于格局喜忌之上',
    affectedCaseIds: ['ANM-005', 'REG-005'],
  },
  {
    conflictId: 'CNF-011',
    conflictType: 'expert',
    topic: '伤官见官是否一定为祸',
    description: '传统命理认为"伤官见官，为祸百端"，但现代专家发现许多命例中伤官见官反而有贵气，尤其在特定格局下。',
    viewpointA: '伤官见官基本为凶，需印星制伤或财星通关化解',
    viewpointB: '伤官见官亦可为贵，如伤官配印、去官留杀等格局',
    sourceA: '传统派',
    sourceB: '创新派',
    affectedCaseIds: ['CLS-001', 'REG-006'],
  },
  {
    conflictId: 'CNF-012',
    conflictType: 'classical',
    topic: '刑冲破害：以冲为主还是以合为主',
    description: '地支六冲、六合、三刑等关系同时出现时，古籍对优先级的论述存在分歧。',
    viewpointA: '冲能解合，合不能解冲，冲的力量优先于合',
    viewpointB: '合能解冲， especially 六合可解六冲，合的力量优先',
    sourceA: '《渊海子平》',
    sourceB: '《滴天髓》',
    affectedCaseIds: ['CLS-002', 'CLS-005'],
  },
]

// ═══════════════════════════════════════════
// 3. 查询函数
// ═══════════════════════════════════════════

/** 获取所有冲突记录 */
export function getAllConflicts(): ConflictRecordV2[] {
  return [...DISAGREEMENT_CONFLICTS]
}

/** 根据冲突类型筛选 */
export function getConflictsByType(type: ConflictType): ConflictRecordV2[] {
  return DISAGREEMENT_CONFLICTS.filter((c) => c.conflictType === type).map((c) => ({ ...c }))
}

/** 根据主题关键词筛选（不区分大小写，支持部分匹配） */
export function getConflictsByTopic(keyword: string): ConflictRecordV2[] {
  const lower = keyword.toLowerCase()
  return DISAGREEMENT_CONFLICTS.filter(
    (c) =>
      c.topic.toLowerCase().includes(lower) ||
      c.description.toLowerCase().includes(lower),
  ).map((c) => ({ ...c }))
}

/** 根据命例 ID 查找相关冲突 */
export function getConflictsByCaseId(caseId: string): ConflictRecordV2[] {
  return DISAGREEMENT_CONFLICTS.filter((c) => c.affectedCaseIds.includes(caseId)).map((c) => ({ ...c }))
}

// ═══════════════════════════════════════════
// 4. 统计函数
// ═══════════════════════════════════════════

/** 获取冲突统计摘要 */
export function getConflictStatistics(): {
  total: number
  byType: Record<ConflictType, number>
  withResolution: number
  withoutResolution: number
} {
  const byType: Record<ConflictType, number> = {
    classical: 0,
    school: 0,
    expert: 0,
  }

  let withResolution = 0
  let withoutResolution = 0

  for (const c of DISAGREEMENT_CONFLICTS) {
    byType[c.conflictType]++
    if (c.resolution && c.resolution.trim().length > 0) {
      withResolution++
    } else {
      withoutResolution++
    }
  }

  return {
    total: DISAGREEMENT_CONFLICTS.length,
    byType,
    withResolution,
    withoutResolution,
  }
}
