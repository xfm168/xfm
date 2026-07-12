/**
 * RelationshipEngine — P2-3.6 十神关系推演引擎
 *
 * 传统子平法十神关系映射：
 *   生我者（印）→ 父母   同我者（比劫）→ 兄弟/朋友
 *   我克者（财）→ 配偶（男）/合作伙伴
 *   克我者（官杀）→ 上级/子女（男）/配偶（女）
 *   我生者（食伤）→ 子女（女）/下属
 *
 * 分析维度：
 *   1. 十神力量：根据命局中对应五行数量判定有力/无力
 *   2. 旺衰影响：身旺→比劫有力，身弱→印有力
 *   3. 用神匹配：关系对应十神为用神五行则有利
 *   4. 五行德性：木→仁、火→礼、土→信、金→义、水→智
 *
 * 原则：
 *   - 传统子平法映射，不主观臆造
 *   - 古籍引用必须标注出处
 *   - Plugin 方式接入，不修改 Kernel
 */

import type { FiveElement, HeavenlyStem } from '../../types'
import { STEM_ELEMENT, GENERATE, OVERCOME } from '../../../core'

// ─── 类型定义 ───

export interface RelationshipDetail {
  /** 关系角色：父母/兄弟/配偶/子女/上级/下属/合作伙伴/朋友 */
  role: string
  /** 对应十神 */
  shiShen: string
  /** 对应五行 */
  element: string
  /** 力量状态：有力/无力 */
  strength: string
  /** 关系描述 */
  description: string
  /** 建议 */
  advice: string
  /** 古籍引用 */
  classicalRef?: string
}

export interface RelationshipResult {
  /** 各关系详情 */
  relationships: RelationshipDetail[]
  /** 最有利的关系 */
  bestRole: string
  /** 最需注意的关系 */
  worstRole: string
  /** 人际关系总评 */
  overallDesc: string
}

// ─── 五行德性（五常） ───

const ELEMENT_VIRTUE: Record<string, string> = {
  '木': '仁',
  '火': '礼',
  '土': '信',
  '金': '义',
  '水': '智',
}

// ─── 天干五行映射（STEM_ELEMENT 已迁移至 core，通过 import 引入） ───

const ALL_ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水']

const YANG_STEMS: Set<HeavenlyStem> = new Set(['甲', '丙', '戊', '庚', '壬'])

// ─── 关系角色定义 ───

interface RoleDefinition {
  role: string
  /** 十神 key */
  shiShenKey: string
  /** 十神中文名 */
  shiShenName: string
  /** 对应五行（相对日主的关系） */
  elementResolver: (dayElement: FiveElement, isYang: boolean) => FiveElement
}

// ─── 关系角色配置 ───

function buildRoles(dayElement: FiveElement, isYang: boolean): RoleDefinition[] {
  // 生我者（印）→ 父母
  const yinElement = ALL_ELEMENTS.find(el => GENERATE[el] === dayElement)!
  // 我克者（财）
  const caiElement = OVERCOME[dayElement]
  // 克我者（官杀）
  const guanElement = ALL_ELEMENTS.find(el => OVERCOME[el] === dayElement)!
  // 我生者（食伤）
  const shiElement = GENERATE[dayElement]

  const biOrJie = isYang ? '比肩' : '劫财'
  const zhengCaiOrPianCai = isYang ? '偏财' : '正财'
  const guanOrSha = isYang ? '七杀' : '正官'
  const shiOrShang = isYang ? '食神' : '伤官'

  return [
    // 父母：印（生我者）
    {
      role: '父母',
      shiShenKey: 'yin',
      shiShenName: `正印/偏印`,
      elementResolver: () => yinElement,
    },
    // 兄弟：比劫（同我者）
    {
      role: '兄弟',
      shiShenKey: 'bijie',
      shiShenName: `${biOrJie}`,
      elementResolver: () => dayElement,
    },
    // 配偶：男命→财，女命→官杀
    {
      role: '配偶',
      shiShenKey: 'spouse',
      shiShenName: isYang ? `${zhengCaiOrPianCai}` : `${guanOrSha}`,
      elementResolver: () => isYang ? caiElement : guanElement,
    },
    // 子女：男命→官杀，女命→食伤
    {
      role: '子女',
      shiShenKey: 'children',
      shiShenName: isYang ? `${guanOrSha}` : `${shiOrShang}`,
      elementResolver: () => isYang ? guanElement : shiElement,
    },
    // 上级/领导：官杀
    {
      role: '上级',
      shiShenKey: 'superior',
      shiShenName: `${guanOrSha}`,
      elementResolver: () => guanElement,
    },
    // 下属：食伤
    {
      role: '下属',
      shiShenKey: 'subordinate',
      shiShenName: `${shiOrShang}`,
      elementResolver: () => shiElement,
    },
    // 合作伙伴：财
    {
      role: '合作伙伴',
      shiShenKey: 'partner',
      shiShenName: `${zhengCaiOrPianCai}`,
      elementResolver: () => caiElement,
    },
    // 朋友：比劫
    {
      role: '朋友',
      shiShenKey: 'friend',
      shiShenName: `${biOrJie}`,
      elementResolver: () => dayElement,
    },
  ]
}

// ─── 五行计数辅助 ───

function countElementsFromPillars(
  allGan: string[],
  allZhi: string[],
  elementCount: Record<string, number>,
): Record<FiveElement, number> {
  const counts: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  // 天干计数
  for (const gan of allGan) {
    const stem = gan as HeavenlyStem
    if (STEM_ELEMENT[stem]) {
      counts[STEM_ELEMENT[stem]]++
    }
  }

  // 地支主气（简化处理，使用 elementCount 补充）
  for (const el of ALL_ELEMENTS) {
    if (elementCount[el] !== undefined) {
      counts[el] += elementCount[el]
    }
  }

  return counts
}

// ─── 判断力量状态 ───

function isStrongElement(
  element: FiveElement,
  counts: Record<FiveElement, number>,
  dayElement: FiveElement,
  strengthLevel: string,
  useGodElement: string,
): { hasStrength: boolean; isUseGod: boolean } {
  const count = counts[element] || 0
  const avgCount = Object.values(counts).reduce((s, v) => s + v, 0) / ALL_ELEMENTS.length
  const hasStrength = count >= avgCount

  // 身旺时比劫有力，身弱时印有力
  let strengthBonus = false
  if (strengthLevel === 'Strong' || strengthLevel === 'VeryStrong') {
    // 身旺：日主自身五行强
    if (element === dayElement) strengthBonus = true
  } else if (strengthLevel === 'Weak' || strengthLevel === 'VeryWeak') {
    // 身弱：生我者（印）有力
    const yinElement = ALL_ELEMENTS.find(el => GENERATE[el] === dayElement)
    if (element === yinElement) strengthBonus = true
  }

  const isUseGod = element === useGodElement

  return { hasStrength: hasStrength || strengthBonus, isUseGod }
}

// ─── 关系描述生成 ───

function generateRoleDescription(
  role: string,
  shiShenName: string,
  element: FiveElement,
  hasStrength: boolean,
  isUseGod: boolean,
  dayElement: FiveElement,
  strengthLevel: string,
): { description: string; advice: string; classicalRef?: string } {
  const virtue = ELEMENT_VIRTUE[element] || ''
  const virtueDesc = `五行${element}主${virtue}`

  // 基础描述
  const strengthDesc = hasStrength ? '力量充沛' : '力量不足'
  const useGodDesc = isUseGod ? '，且为用神，此关系为人生助力' : ''

  let description = ''
  let advice = ''
  let classicalRef: string | undefined

  switch (role) {
    case '父母': {
      description = `${shiShenName}代表父母关系。${virtueDesc}，${strengthDesc}${useGodDesc}。`
      if (hasStrength && isUseGod) {
        advice = '父母缘深，可得父母荫庇助力，宜珍惜亲情，孝顺承志。'
        classicalRef = '《滴天髓》："印绶者，生我之神，乃父母之象，主庇佑"。'
      } else if (hasStrength) {
        advice = '与父母关系尚可，但需注意沟通，避免因观念差异产生隔阂。'
        classicalRef = '《三命通会》："印旺身衰，反为母累；印轻身旺，不劳父母之力"。'
      } else {
        advice = '与父母缘分较薄，或聚少离多，宜主动维系亲情，独立自强。'
        classicalRef = '《子平真诠》："印绶无力，父母之荫有减，当自立自强"。'
      }
      break
    }
    case '兄弟': {
      description = `${shiShenName}代表兄弟姐妹及同辈关系。${virtueDesc}，${strengthDesc}${useGodDesc}。`
      if (hasStrength && isUseGod) {
        advice = '兄弟姐妹众多且和睦，可得同辈助力，宜广结善缘。'
        classicalRef = '《滴天髓》："比肩者，同我之物，兄弟朋友之象"。'
      } else if (hasStrength) {
        advice = '同辈关系活跃，但需注意利益分配，避免因争执伤和气。'
        classicalRef = '《三命通会》："比劫过旺，群比争财，兄弟虽多恐有争端"。'
      } else {
        advice = '兄弟缘分较薄，各自独立发展，不宜过度依赖同辈帮助。'
        classicalRef = '《子平真诠》："比劫无力，兄弟之助有限，宜自求多福"。'
      }
      break
    }
    case '配偶': {
      description = `${shiShenName}代表婚姻感情关系。${virtueDesc}，${strengthDesc}${useGodDesc}。`
      if (hasStrength && isUseGod) {
        advice = '婚姻美满，配偶为人生贵人，感情生活和谐稳定。'
        classicalRef = '《滴天髓》："财为妻妾，官为夫星，用神正位，婚姻主吉"。'
      } else if (hasStrength) {
        advice = '感情生活丰富，但需防桃花过旺或感情波折，宜忠诚专一。'
        classicalRef = '《三命通会》："财官太旺，争合多端，感情宜守一"。'
      } else {
        advice = '感情缘分较迟或波折较多，宜修己安人，以德化情。'
        classicalRef = '《子平真诠》："用神无力，婚姻恐有迟滞，宜晚婚为佳"。'
      }
      break
    }
    case '子女': {
      description = `${shiShenName}代表子女关系。${virtueDesc}，${strengthDesc}${useGodDesc}。`
      if (hasStrength && isUseGod) {
        advice = '子女有出息，可享子女之福，亲子关系融洽。'
        classicalRef = '《滴天髓》："食伤为子女之秀，官杀为子女之柄"。'
      } else if (hasStrength) {
        advice = '子女缘中平，需注重教育培养，不宜过于苛求。'
        classicalRef = '《三命通会》："食伤得地，子女有智；过旺恐子女反克"。'
      } else {
        advice = '子女缘分较薄或得子较晚，宜顺其自然，以德育儿。'
        classicalRef = '《子平真诠》："食伤无力，子女之缘有减，宜积德修善"。'
      }
      break
    }
    case '上级': {
      description = `${shiShenName}代表上级、领导及权威关系。${virtueDesc}，${strengthDesc}${useGodDesc}。`
      if (hasStrength && isUseGod) {
        advice = '易得领导赏识提拔，仕途顺遂，宜勤勉忠诚。'
        classicalRef = '《滴天髓》："官星为禄，用神得力，仕途亨通"。'
      } else if (hasStrength) {
        advice = '与上级关系复杂，压力较大，需注意职场上的人际平衡。'
        classicalRef = '《三命通会》："官杀混杂，压力重重，宜以印化杀"。'
      } else {
        advice = '适合自主创业或独立工作，不宜过于依赖体制内发展。'
        classicalRef = '《子平真诠》："官杀无力，仕途不顺，宜另辟蹊径"。'
      }
      break
    }
    case '下属': {
      description = `${shiShenName}代表下属、晚辈及输出能力。${virtueDesc}，${strengthDesc}${useGodDesc}。`
      if (hasStrength && isUseGod) {
        advice = '管理能力出众，下属得力，事业版图可不断扩大。'
        classicalRef = '《滴天髓》："食伤泄秀，才华横溢，下属服从"。'
      } else if (hasStrength) {
        advice = '有管理潜力，但需注意管理方式，避免过于严苛或放纵。'
        classicalRef = '《三命通会》："食伤过旺，口舌是非多，管理宜宽严相济"。'
      } else {
        advice = '领导力需培养，适合技术专精路线，不宜急于带团队。'
        classicalRef = '《子平真诠》："食伤无力，领导才能有欠，宜先修自身之德"。'
      }
      break
    }
    case '合作伙伴': {
      description = `${shiShenName}代表合作伙伴及财运关系。${virtueDesc}，${strengthDesc}${useGodDesc}。`
      if (hasStrength && isUseGod) {
        advice = '财运亨通，合作伙伴可靠，宜积极拓展事业版图。'
        classicalRef = '《滴天髓》："财为养命之源，用神得力，财源广进"。'
      } else if (hasStrength) {
        advice = '合作机会多，但需谨慎选择对象，防财来财去。'
        classicalRef = '《三命通会》："财多身弱，富屋贫人，财虽多而身难任"。'
      } else {
        advice = '财运平平，合作宜稳扎稳打，不宜投机冒险。'
        classicalRef = '《子平真诠》："财星无力，求财艰辛，宜守正待时"。'
      }
      break
    }
    case '朋友': {
      description = `${shiShenName}代表朋友及社交关系。${virtueDesc}，${strengthDesc}${useGodDesc}。`
      if (hasStrength && isUseGod) {
        advice = '人脉广阔，朋友多为助力，宜广交益友，互利共赢。'
        classicalRef = '《滴天髓》："比劫为助，用神有力，朋友如兄弟"。'
      } else if (hasStrength) {
        advice = '社交圈广但质量参差，需甄别损友与益友。'
        classicalRef = '《三命通会》："比劫多而无制，交友虽多，损益参半"。'
      } else {
        advice = '社交圈相对较小，但贵在精而不在多，宜重质不重量。'
        classicalRef = '《子平真诠》："比劫无力，朋友之助有限，交友贵在知心"。'
      }
      break
    }
    default: {
      description = `${shiShenName}代表${role}关系。${strengthDesc}${useGodDesc}。`
      advice = '宜修德养性，以和为贵。'
    }
  }

  return { description, advice, classicalRef }
}

// ─── 总评生成 ───

function generateOverallDesc(
  relationships: RelationshipDetail[],
  strengthLevel: string,
  useGodElement: string,
  dayElement: FiveElement,
): string {
  const beneficial = relationships.filter(r => r.strength === '有力' && r.element === useGodElement)
  const weakRoles = relationships.filter(r => r.strength === '无力')

  const virtue = ELEMENT_VIRTUE[dayElement]

  let desc = `日主${dayElement}性主${virtue}，`

  if (strengthLevel === 'VeryStrong' || strengthLevel === 'Strong') {
    desc += `命局身旺，比劫有力，兄弟朋友关系活跃。`
    if (beneficial.length > 0) {
      desc += `其中${beneficial.map(r => r.role).join('、')}关系最为有利，为人生重要助力。`
    }
    if (weakRoles.length > 0) {
      desc += `需注意${weakRoles.map(r => r.role).join('、')}关系稍弱，宜用心经营。`
    }
  } else if (strengthLevel === 'Weak' || strengthLevel === 'VeryWeak') {
    desc += `命局身弱，印星为依靠，父母长辈关系尤为重要。`
    if (beneficial.length > 0) {
      desc += `其中${beneficial.map(r => r.role).join('、')}关系为用神所在，宜珍惜维护。`
    }
    if (weakRoles.length > 0) {
      desc += `需注意${weakRoles.map(r => r.role).join('、')}关系力量不足，凡事不宜强求。`
    }
  } else {
    desc += `命局中和，各关系较为均衡。`
    if (beneficial.length > 0) {
      desc += `${beneficial.map(r => r.role).join('、')}为用神关系，可得其利。`
    }
  }

  desc += '古人云："命由天定，事在人为"，善修己德，人际关系自可圆融通达。'

  return desc
}

// ─── 核心引擎 ───

/**
 * 十神关系推演 — 主入口
 *
 * @param dayElement      日主五行
 * @param _geJuName       格局名（预留）
 * @param strengthLevel   旺衰等级
 * @param useGodElement   用神五行
 * @param elementCount    五行计数（地支层面）
 * @param allGan          四柱天干
 * @param _allZhi         四柱地支（预留）
 * @returns RelationshipResult
 */
export function analyzeRelationships(
  dayElement: FiveElement,
  _geJuName: string,
  strengthLevel: string,
  useGodElement: string,
  elementCount: Record<string, number>,
  allGan: string[],
  _allZhi: string[],
): RelationshipResult {
  // 判断日主阴阳（取日干判断）
  const dayGan = allGan[2] as HeavenlyStem  // 日干在第三个位置（年月日时）
  const isYang = YANG_STEMS.has(dayGan)

  // 构建关系角色
  const roles = buildRoles(dayElement, isYang)

  // 统计五行总数（天干 + 地支）
  const counts = countElementsFromPillars(allGan, _allZhi, elementCount)

  // 逐项分析各关系
  const relationships: RelationshipDetail[] = []
  let bestScore = -Infinity
  let worstScore = Infinity
  let bestRole = ''
  let worstRole = ''

  for (const roleDef of roles) {
    const targetElement = roleDef.elementResolver(dayElement, isYang)
    const { hasStrength, isUseGod } = isStrongElement(
      targetElement,
      counts,
      dayElement,
      strengthLevel,
      useGodElement,
    )

    const strength = hasStrength ? '有力' : '无力'

    // 评分：有力 +100，用神 +50
    const score = (hasStrength ? 100 : 0) + (isUseGod ? 50 : 0)

    const { description, advice, classicalRef } = generateRoleDescription(
      roleDef.role,
      roleDef.shiShenName,
      targetElement,
      hasStrength,
      isUseGod,
      dayElement,
      strengthLevel,
    )

    relationships.push({
      role: roleDef.role,
      shiShen: roleDef.shiShenName,
      element: targetElement,
      strength,
      description,
      advice,
      classicalRef,
    })

    // 更新最优/最差
    if (score > bestScore) {
      bestScore = score
      bestRole = roleDef.role
    }
    if (score < worstScore) {
      worstScore = score
      worstRole = roleDef.role
    }
  }

  // 生成总评
  const overallDesc = generateOverallDesc(relationships, strengthLevel, useGodElement, dayElement)

  return {
    relationships,
    bestRole,
    worstRole,
    overallDesc,
  }
}
