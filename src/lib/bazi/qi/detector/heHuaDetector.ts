/**
 * HeHuaDetector — 合化检测器
 *
 * P1 原则：Detector 只负责判断，输出 HeHuaCommand[]，绝不修改 Qi
 *
 * 检测范围：
 * - 地支三合（申子辰水、亥卯未木、寅午戌火、巳酉丑金）
 * - 地支三会（寅卯辰木、巳午未火、申酉戌金、亥子丑水）
 * - 地支六合（子丑土、寅亥木、卯戌火、辰酉金、巳申水、午未土）
 * - 半合（三合中取两支）
 * - 天干五合（甲己合土、乙庚合金、丙辛合水、丁壬合木、戊癸合火）
 * - 暗合（天干与地支藏干暗合）
 *
 * 成化条件（《穷通宝鉴》《子平真诠》）：
 * - 月令支持化神（月令五行与化神相同或相生）
 * - 化神透干（天干有化神五行出现）
 * - 无冲克化神（化神不被冲、不被克）
 *
 * 合绊条件：合而不化
 * - 不满足成化条件
 * - 双方力量被"绊住"（失去一部分自由度）
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '../../types'
import type { QiNode, HeHuaCommand, QiDeduction, QiAddition, QiContext } from '../types'
import { getStemElement } from '@/lib/core'

// ─── 天干五合 ───

const TIAN_GAN_WU_HE: [HeavenlyStem, HeavenlyStem, FiveElement][] = [
  ['甲', '己', '土'],
  ['乙', '庚', '金'],
  ['丙', '辛', '水'],
  ['丁', '壬', '木'],
  ['戊', '癸', '火'],
]

const WU_HE_MAP = new Map<string, FiveElement>()
for (const [a, b, el] of TIAN_GAN_WU_HE) {
  WU_HE_MAP.set(`${a}${b}`, el)
  WU_HE_MAP.set(`${b}${a}`, el)
}

// ─── 地支六合 ───

const DI_ZHI_LIU_HE: [EarthlyBranch, EarthlyBranch, FiveElement][] = [
  ['子', '丑', '土'],
  ['寅', '亥', '木'],
  ['卯', '戌', '火'],
  ['辰', '酉', '金'],
  ['巳', '申', '水'],
  ['午', '未', '土'],
]

const LIU_HE_MAP = new Map<string, FiveElement>()
for (const [a, b, el] of DI_ZHI_LIU_HE) {
  LIU_HE_MAP.set(`${a}${b}`, el)
  LIU_HE_MAP.set(`${b}${a}`, el)
}

// ─── 地支三合 ───

const DI_ZHI_SAN_HE: { branches: EarthlyBranch[]; element: FiveElement; name: string }[] = [
  { branches: ['申', '子', '辰'], element: '水', name: '申子辰三合水局' },
  { branches: ['亥', '卯', '未'], element: '木', name: '亥卯未三合木局' },
  { branches: ['寅', '午', '戌'], element: '火', name: '寅午戌三合火局' },
  { branches: ['巳', '酉', '丑'], element: '金', name: '巳酉丑三合金局' },
]

// ─── 半合（三合取两支，有方向性）───

const BAN_HE: { branch1: EarthlyBranch; branch2: EarthlyBranch; element: FiveElement; direction: '前' | '中' | '后'; name: string }[] = [
  // 申子辰水局
  { branch1: '申', branch2: '子', element: '水', direction: '前', name: '申子半合水' },
  { branch1: '子', branch2: '辰', element: '水', direction: '中', name: '子辰半合水' },
  // 亥卯未木局
  { branch1: '亥', branch2: '卯', element: '木', direction: '前', name: '亥卯半合木' },
  { branch1: '卯', branch2: '未', element: '木', direction: '中', name: '卯未半合木' },
  // 寅午戌火局
  { branch1: '寅', branch2: '午', element: '火', direction: '前', name: '寅午半合火' },
  { branch1: '午', branch2: '戌', element: '火', direction: '中', name: '午戌半合火' },
  // 巳酉丑金局
  { branch1: '巳', branch2: '酉', element: '金', direction: '前', name: '巳酉半合金' },
  { branch1: '酉', branch2: '丑', element: '金', direction: '中', name: '酉丑半合金' },
]

// ─── 地支三会 ───

const DI_ZHI_SAN_HUI: { branches: EarthlyBranch[]; element: FiveElement; name: string }[] = [
  { branches: ['寅', '卯', '辰'], element: '木', name: '寅卯辰三会木方' },
  { branches: ['巳', '午', '未'], element: '火', name: '巳午未三会火方' },
  { branches: ['申', '酉', '戌'], element: '金', name: '申酉戌三会金方' },
  { branches: ['亥', '子', '丑'], element: '水', name: '亥子丑三会水方' },
]

// ─── 暗合 ───
// 天干与地支藏干的暗合关系
// 甲子（甲与子中癸合）、乙丑（乙与丑中庚合...）等

const AN_HE: { stem: HeavenlyStem; branch: EarthlyBranch; hiddenStem: HeavenlyStem; element: FiveElement }[] = [
  { stem: '甲', branch: '子', hiddenStem: '癸', element: '火' },   // 甲己合 → 戊癸合火 (甲引出子中癸)
  { stem: '乙', branch: '丑', hiddenStem: '庚', element: '金' },   // 乙庚合金 → 丑中庚
  { stem: '丙', branch: '寅', hiddenStem: '甲', element: '水' },   // 丙辛合 → 寅中甲（丙辛合水... 不对）
  // 暗合比较复杂，暂不实现，等 P1 验证完再补充
]

// ─── 合化比率 ───
// 成化：参与方各抽 70% 给化神
// 合绊：参与方各损失 30%

const HE_HUA_RATIO = 0.7    // 成化抽气比例
const HE_BAN_RATIO = 0.3    // 合绊损气比例

// ─── 五行相生关系 ───

const GENERATES: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const IS_GENERATED_BY: Record<FiveElement, FiveElement> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
}

// ─── 从 QiNode[] 提取信息 ───

interface PillarInfo {
  pillar: string
  gan: HeavenlyStem | null
  branch: EarthlyBranch
  nodes: QiNode[]
}

function getPillarInfos(qiNodes: QiNode[]): PillarInfo[] {
  const map = new Map<string, PillarInfo>()

  for (const node of qiNodes) {
    const key = node.pillar
    if (!map.has(key)) {
      map.set(key, { pillar: key, gan: null, branch: node.branch, nodes: [] })
    }
    const info = map.get(key)!
    info.nodes.push(node)
    if (node.source === '天干') {
      info.gan = node.hiddenStem || null  // 天干节点 hiddenStem 为 null，用 branch 代替
    }
  }

  // 从天干节点获取 gan
  for (const info of map.values()) {
    const ganNode = info.nodes.find(n => n.source === '天干')
    if (ganNode && !info.gan) {
      // 天干节点 id 格式: pillar-gan-干名
      const match = ganNode.id.match(/gan-(.)$/)
      if (match) info.gan = match[1] as HeavenlyStem
    }
  }

  return Array.from(map.values())
}

// ─── 成化条件判断 ───

/** 五行相克关系 */
const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

/**
 * 判断是否满足成化条件（基础版）
 * 1. 月令支持化神（月令五行与化神相同，或月令生化神）
 * 2. 化神透干（四柱天干中有化神五行）
 * 3. 无冲（参与合的地支不被冲）
 * 4. 化神不受克（月令不克化神）
 */
function checkHeHuaConditions(
  huaElement: FiveElement,
  ctx: QiContext | null,
  allGanElements: FiveElement[],
  pillarBranches: EarthlyBranch[],
  involvedBranches: EarthlyBranch[],
): { canHua: boolean; reason: string; huaType: import('../types').HuaType } {
  const reasons: string[] = []

  // 1. 月令支持
  if (ctx) {
    const monthElement = ctx.monthElement
    const monthSupports = monthElement === huaElement || GENERATES[monthElement] === huaElement
    if (monthSupports) {
      reasons.push(`月令${ctx.monthZhi}(${monthElement})支持化神${huaElement}`)
    } else {
      return { canHua: false, reason: `月令${ctx.monthZhi}(${monthElement})不支持化神${huaElement}`, huaType: '合绊' }
    }
  }

  // 2. 化神透干
  if (allGanElements.includes(huaElement)) {
    reasons.push(`化神${huaElement}透干`)
  } else {
    return { canHua: false, reason: `化神${huaElement}未透干`, huaType: '合绊' }
  }

  // 3. 无冲
  const CHONG_PAIRS: [EarthlyBranch, EarthlyBranch][] = [
    ['子', '午'], ['丑', '未'], ['寅', '申'],
    ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
  ]
  const chongSet = new Set(CHONG_PAIRS.flatMap(([a, b]) => [`${a}${b}`, `${b}${a}`]))

  for (const branch of pillarBranches) {
    if (involvedBranches.includes(branch)) continue
    for (const involved of involvedBranches) {
      if (chongSet.has(`${branch}${involved}`)) {
        return { canHua: false, reason: `${involved}被${branch}冲，不能成化`, huaType: '化而不化' }
      }
    }
  }

  // 4. 化神是否受克（月令克化神？）
  if (ctx && OVERCOME[ctx.monthElement] === huaElement) {
    // 月令克化神 → 假化（成化但力量不足）
    return { canHua: true, reason: reasons.join('，') + '，但月令克化神', huaType: '假化' }
  }

  return { canHua: true, reason: reasons.join('，'), huaType: '真化' }
}

// ─── 天干五合检测 ───

function detectTianGanWuHe(pillarInfos: PillarInfo[], ctx: QiContext | null): HeHuaCommand[] {
  const commands: HeHuaCommand[] = []
  const ganBranchMap = new Map<HeavenlyStem, PillarInfo>()

  for (const info of pillarInfos) {
    if (info.gan) ganBranchMap.set(info.gan, info)
  }

  const allGanElements = pillarInfos
    .map(info => info.gan)
    .filter((g): g is HeavenlyStem => g !== null)
    .map(g => getStemElement(g))

  const checked = new Set<string>()

  for (const info of pillarInfos) {
    if (!info.gan) continue
    if (checked.has(info.gan)) continue

    for (const otherInfo of pillarInfos) {
      if (otherInfo === info) continue
      if (!otherInfo.gan) continue
      if (checked.has(otherInfo.gan)) continue

      const huaElement = WU_HE_MAP.get(`${info.gan}${otherInfo.gan}`)
      if (!huaElement) continue

      checked.add(info.gan)
      checked.add(otherInfo.gan)

      // 判断成化条件
      const involvedBranches = [info.branch, otherInfo.branch]
      const { canHua, reason, huaType } = checkHeHuaConditions(
        huaElement, ctx, allGanElements,
        pillarInfos.map(p => p.branch), involvedBranches,
      )

      const ratio = canHua ? HE_HUA_RATIO : HE_BAN_RATIO
      const deductions: QiDeduction[] = []
      const additions: QiAddition[] = []

      // 抽气
      for (const node of info.nodes) {
        if (!node.active || node.source !== '天干') continue
        const amount = Math.round(node.strength * ratio)
        if (amount > 0) {
          deductions.push({
            targetId: node.id,
            amount,
            sourceElement: node.element,
            sourceName: `${node.hiddenStem ?? ''}${node.element}`,
            detail: `${info.pillar}天干${info.gan}参与${info.gan}${otherInfo.gan}合${canHua ? `化${huaElement}` : '绊'}，抽气${ratio * 100}%(${amount}分)`,
          })
        }
      }
      for (const node of otherInfo.nodes) {
        if (!node.active || node.source !== '天干') continue
        const amount = Math.round(node.strength * ratio)
        if (amount > 0) {
          deductions.push({
            targetId: node.id,
            amount,
            sourceElement: node.element,
            sourceName: `${node.hiddenStem ?? ''}${node.element}`,
            detail: `${otherInfo.pillar}天干${otherInfo.gan}参与${info.gan}${otherInfo.gan}合${canHua ? `化${huaElement}` : '绊'}，抽气${ratio * 100}%(${amount}分)`,
          })
        }
      }

      if (canHua) {
        // 成化：化神获得力量
        const totalDeducted = deductions.reduce((s, d) => s + d.amount, 0)
        additions.push({
          targetId: '__hehua_tianGan__',  // Transformer 会决定实际分配
          element: huaElement,
          amount: totalDeducted,
          detail: `${info.gan}${otherInfo.gan}合化${huaElement}，化神获得${totalDeducted}分`,
        })
      }

      if (deductions.length > 0) {
        const breakdown = deductions.map(d => ({
          nodeId: d.targetId,
          name: d.sourceName || d.targetId,
          element: d.sourceElement || '木',
          amount: d.amount,
        }))
        for (const d of deductions) {
          d.breakdown = breakdown
        }
      }

      commands.push({
        type: '天干五合',
        sources: [info.gan, otherInfo.gan],
        huaElement,
        success: canHua,
        isHeBan: !canHua,
        huaType,
        reason: canHua
          ? `${info.pillar}${info.gan}与${otherInfo.pillar}${otherInfo.gan}天干五合化${huaElement}（${reason}）`
          : `${info.pillar}${info.gan}与${otherInfo.pillar}${otherInfo.gan}天干五合合绊（${reason}）`,
        deductions,
        additions,
      })
    }
  }

  return commands
}

// ─── 地支六合检测 ───

function detectDiZhiLiuHe(pillarInfos: PillarInfo[], ctx: QiContext | null): HeHuaCommand[] {
  const commands: HeHuaCommand[] = []
  const branchPillarMap = new Map<EarthlyBranch, PillarInfo>()

  for (const info of pillarInfos) {
    branchPillarMap.set(info.branch, info)
  }

  const allGanElements = pillarInfos
    .map(info => info.gan)
    .filter((g): g is HeavenlyStem => g !== null)
    .map(g => getStemElement(g))

  const checked = new Set<string>()

  for (const info of pillarInfos) {
    if (checked.has(info.branch)) continue

    for (const otherInfo of pillarInfos) {
      if (otherInfo === info) continue
      if (checked.has(otherInfo.branch)) continue

      const huaElement = LIU_HE_MAP.get(`${info.branch}${otherInfo.branch}`)
      if (!huaElement) continue

      checked.add(info.branch)
      checked.add(otherInfo.branch)

      const involvedBranches = [info.branch, otherInfo.branch]
      const { canHua, reason, huaType } = checkHeHuaConditions(
        huaElement, ctx, allGanElements,
        pillarInfos.map(p => p.branch), involvedBranches,
      )

      const ratio = canHua ? HE_HUA_RATIO : HE_BAN_RATIO
      const deductions: QiDeduction[] = []
      const additions: QiAddition[] = []

      // 抽气（含藏干，不含天干）
      for (const node of info.nodes) {
        if (!node.active) continue
        if (node.source === '天干') continue
        const amount = Math.round(node.strength * ratio)
        if (amount > 0) {
          deductions.push({
            targetId: node.id,
            amount,
            sourceElement: node.element,
            sourceName: `${node.hiddenStem ?? ''}${node.element}`,
            detail: `${info.pillar}支${info.branch}参与${info.branch}${otherInfo.branch}六合${canHua ? `化${huaElement}` : '绊'}，抽气${ratio * 100}%(${amount}分)`,
          })
        }
      }
      for (const node of otherInfo.nodes) {
        if (!node.active) continue
        if (node.source === '天干') continue
        const amount = Math.round(node.strength * ratio)
        if (amount > 0) {
          deductions.push({
            targetId: node.id,
            amount,
            sourceElement: node.element,
            sourceName: `${node.hiddenStem ?? ''}${node.element}`,
            detail: `${otherInfo.pillar}支${otherInfo.branch}参与${info.branch}${otherInfo.branch}六合${canHua ? `化${huaElement}` : '绊'}，抽气${ratio * 100}%(${amount}分)`,
          })
        }
      }

      if (canHua) {
        const totalDeducted = deductions.reduce((s, d) => s + d.amount, 0)
        additions.push({
          targetId: '__hehua_liuHe__',
          element: huaElement,
          amount: totalDeducted,
          detail: `${info.branch}${otherInfo.branch}六合化${huaElement}，化神获得${totalDeducted}分`,
        })
      }

      if (deductions.length > 0) {
        const breakdown = deductions.map(d => ({
          nodeId: d.targetId,
          name: d.sourceName || d.targetId,
          element: d.sourceElement || '木',
          amount: d.amount,
        }))
        for (const d of deductions) {
          d.breakdown = breakdown
        }
      }

      commands.push({
        type: '地支六合',
        sources: [info.branch, otherInfo.branch],
        huaElement,
        success: canHua,
        isHeBan: !canHua,
        huaType,
        reason: canHua
          ? `${info.pillar}${info.branch}与${otherInfo.pillar}${otherInfo.branch}六合化${huaElement}（${reason}）`
          : `${info.pillar}${info.branch}与${otherInfo.pillar}${otherInfo.branch}六合合绊（${reason}）`,
        deductions,
        additions,
      })
    }
  }

  return commands
}

// ─── 地支三合检测 ───

function detectDiZhiSanHe(pillarInfos: PillarInfo[], ctx: QiContext | null): HeHuaCommand[] {
  const commands: HeHuaCommand[] = []
  const branchPillarMap = new Map<EarthlyBranch, PillarInfo>()

  for (const info of pillarInfos) {
    branchPillarMap.set(info.branch, info)
  }

  const allGanElements = pillarInfos
    .map(info => info.gan)
    .filter((g): g is HeavenlyStem => g !== null)
    .map(g => getStemElement(g))

  for (const sanHe of DI_ZHI_SAN_HE) {
    const present = sanHe.branches
      .map(b => branchPillarMap.get(b))
      .filter((p): p is PillarInfo => p !== undefined)

    if (present.length < 3) continue  // 三合需要三支全在

    const involvedBranches = present.map(p => p.branch)
    const { canHua, reason, huaType } = checkHeHuaConditions(
      sanHe.element, ctx, allGanElements,
      pillarInfos.map(p => p.branch), involvedBranches,
    )

    const ratio = canHua ? HE_HUA_RATIO : HE_BAN_RATIO
    const deductions: QiDeduction[] = []
    const additions: QiAddition[] = []

    for (const p of present) {
      for (const node of p.nodes) {
        if (!node.active) continue
        if (node.source === '天干') continue
        const amount = Math.round(node.strength * ratio)
        if (amount > 0) {
          deductions.push({
            targetId: node.id,
            amount,
            sourceElement: node.element,
            sourceName: `${node.hiddenStem ?? ''}${node.element}`,
            detail: `${p.pillar}支${p.branch}参与${sanHe.name}${canHua ? `化${sanHe.element}` : '绊'}，抽气${ratio * 100}%(${amount}分)`,
          })
        }
      }
    }

    if (canHua) {
      const totalDeducted = deductions.reduce((s, d) => s + d.amount, 0)
      additions.push({
        targetId: '__hehua_sanHe__',
        element: sanHe.element,
        amount: totalDeducted,
        detail: `${sanHe.name}化${sanHe.element}，化神获得${totalDeducted}分`,
      })
    }

    if (deductions.length > 0) {
      const breakdown = deductions.map(d => ({
        nodeId: d.targetId,
        name: d.sourceName || d.targetId,
        element: d.sourceElement || '木',
        amount: d.amount,
      }))
      for (const d of deductions) {
        d.breakdown = breakdown
      }
    }

    commands.push({
      type: '地支三合',
      sources: involvedBranches,
      huaElement: sanHe.element,
      success: canHua,
      isHeBan: !canHua,
      huaType,
      reason: canHua
        ? `${present.map(p => `${p.pillar}${p.branch}`).join('、')}${sanHe.name}化${sanHe.element}（${reason}）`
        : `${present.map(p => `${p.pillar}${p.branch}`).join('、')}${sanHe.name}合绊（${reason}）`,
      deductions,
      additions,
    })
  }

  return commands
}

// ─── 地支三会检测 ───

function detectDiZhiSanHui(pillarInfos: PillarInfo[], ctx: QiContext | null): HeHuaCommand[] {
  const commands: HeHuaCommand[] = []
  const branchPillarMap = new Map<EarthlyBranch, PillarInfo>()

  for (const info of pillarInfos) {
    branchPillarMap.set(info.branch, info)
  }

  const allGanElements = pillarInfos
    .map(info => info.gan)
    .filter((g): g is HeavenlyStem => g !== null)
    .map(g => getStemElement(g))

  for (const sanHui of DI_ZHI_SAN_HUI) {
    const present = sanHui.branches
      .map(b => branchPillarMap.get(b))
      .filter((p): p is PillarInfo => p !== undefined)

    if (present.length < 3) continue  // 三会需要三支全在

    const involvedBranches = present.map(p => p.branch)
    const { canHua, reason, huaType } = checkHeHuaConditions(
      sanHui.element, ctx, allGanElements,
      pillarInfos.map(p => p.branch), involvedBranches,
    )

    // 三会力量极强，比率更高
    const ratio = canHua ? 0.8 : 0.4
    const deductions: QiDeduction[] = []
    const additions: QiAddition[] = []

    for (const p of present) {
      for (const node of p.nodes) {
        if (!node.active) continue
        if (node.source === '天干') continue
        const amount = Math.round(node.strength * ratio)
        if (amount > 0) {
          deductions.push({
            targetId: node.id,
            amount,
            sourceElement: node.element,
            sourceName: `${node.hiddenStem ?? ''}${node.element}`,
            detail: `${p.pillar}支${p.branch}参与${sanHui.name}${canHua ? `成${sanHui.element}方` : '绊'}，抽气${ratio * 100}%(${amount}分)`,
          })
        }
      }
    }

    if (canHua) {
      const totalDeducted = deductions.reduce((s, d) => s + d.amount, 0)
      additions.push({
        targetId: '__hehua_sanHui__',
        element: sanHui.element,
        amount: totalDeducted,
        detail: `${sanHui.name}成${sanHui.element}方，化神获得${totalDeducted}分`,
      })
    }

    if (deductions.length > 0) {
      const breakdown = deductions.map(d => ({
        nodeId: d.targetId,
        name: d.sourceName || d.targetId,
        element: d.sourceElement || '木',
        amount: d.amount,
      }))
      for (const d of deductions) {
        d.breakdown = breakdown
      }
    }

    commands.push({
      type: '地支三会',
      sources: involvedBranches,
      huaElement: sanHui.element,
      success: canHua,
      isHeBan: !canHua,
      huaType,
      reason: canHua
        ? `${present.map(p => `${p.pillar}${p.branch}`).join('、')}${sanHui.name}成${sanHui.element}方（${reason}）`
        : `${present.map(p => `${p.pillar}${p.branch}`).join('、')}${sanHui.name}会而不化（${reason}）`,
      deductions,
      additions,
    })
  }

  return commands
}

// ─── 半合检测 ───

function detectBanHe(pillarInfos: PillarInfo[], ctx: QiContext | null): HeHuaCommand[] {
  const commands: HeHuaCommand[] = []
  const branchPillarMap = new Map<EarthlyBranch, PillarInfo>()

  for (const info of pillarInfos) {
    branchPillarMap.set(info.branch, info)
  }

  const allGanElements = pillarInfos
    .map(info => info.gan)
    .filter((g): g is HeavenlyStem => g !== null)
    .map(g => getStemElement(g))

  // 先检查是否有三合全在（如果有则半合不独立生效）
  const fullSanHeBranches = new Set<string>()
  for (const sanHe of DI_ZHI_SAN_HE) {
    const present = sanHe.branches.filter(b => branchPillarMap.has(b))
    if (present.length === 3) {
      fullSanHeBranches.add(sanHe.name)
    }
  }

  for (const banHe of BAN_HE) {
    // 如果三合全在，跳过半合检测
    if (fullSanHeBranches.size > 0) continue

    const p1 = branchPillarMap.get(banHe.branch1)
    const p2 = branchPillarMap.get(banHe.branch2)
    if (!p1 || !p2) continue

    const involvedBranches = [banHe.branch1, banHe.branch2]
    // 半合成化条件更严格：必须有化神透干 + 月令支持
    const { canHua, reason, huaType } = checkHeHuaConditions(
      banHe.element, ctx, allGanElements,
      pillarInfos.map(p => p.branch), involvedBranches,
    )

    // 半合力量弱于三合
    const ratio = canHua ? 0.5 : HE_BAN_RATIO
    const deductions: QiDeduction[] = []
    const additions: QiAddition[] = []

    for (const p of [p1, p2]) {
      for (const node of p.nodes) {
        if (!node.active) continue
        if (node.source === '天干') continue
        const amount = Math.round(node.strength * ratio)
        if (amount > 0) {
          deductions.push({
            targetId: node.id,
            amount,
            sourceElement: node.element,
            sourceName: `${node.hiddenStem ?? ''}${node.element}`,
            detail: `${p.pillar}支${p.branch}参与${banHe.name}${canHua ? `化${banHe.element}` : '绊'}，抽气${ratio * 100}%(${amount}分)`,
          })
        }
      }
    }

    if (canHua) {
      const totalDeducted = deductions.reduce((s, d) => s + d.amount, 0)
      additions.push({
        targetId: '__hehua_banHe__',
        element: banHe.element,
        amount: totalDeducted,
        detail: `${banHe.name}化${banHe.element}，化神获得${totalDeducted}分`,
      })
    }

    if (deductions.length > 0) {
      const breakdown = deductions.map(d => ({
        nodeId: d.targetId,
        name: d.sourceName || d.targetId,
        element: d.sourceElement || '木',
        amount: d.amount,
      }))
      for (const d of deductions) {
        d.breakdown = breakdown
      }
    }

    commands.push({
      type: '地支三合',
      sources: involvedBranches,
      huaElement: banHe.element,
      success: canHua,
      isHeBan: !canHua,
      huaType,
      reason: canHua
        ? `${p1.pillar}${banHe.branch1}与${p2.pillar}${banHe.branch2}${banHe.name}化${banHe.element}（${reason}）`
        : `${p1.pillar}${banHe.branch1}与${p2.pillar}${banHe.branch2}${banHe.name}合绊（${reason}）`,
      deductions,
      additions,
    })
  }

  return commands
}

// ─── 统一检测入口 ───

/**
 * 检测所有合化关系
 * 只负责判断，绝不修改 QiNode
 *
 * @param qiNodes 当前气节点
 * @param ctx 命理上下文（月令等）
 * @returns HeHuaCommand[] 合化命令列表
 */
export function detectHeHua(qiNodes: QiNode[], ctx: QiContext | null): HeHuaCommand[] {
  const pillarInfos = getPillarInfos(qiNodes)

  const commands: HeHuaCommand[] = [
    ...detectDiZhiSanHui(pillarInfos, ctx),   // 三会最强，优先检测
    ...detectDiZhiSanHe(pillarInfos, ctx),     // 三合次之
    ...detectBanHe(pillarInfos, ctx),           // 半合（三合不全时）
    ...detectDiZhiLiuHe(pillarInfos, ctx),     // 六合
    ...detectTianGanWuHe(pillarInfos, ctx),     // 天干五合
  ]

  // 争合/妒合由 CompetitionEvaluator 统一处理（动态评分决定优先级）
  // detectHeHua 只负责检测，不负责竞争裁决

  return commands
}

// ─── 辅助查询函数 ───

/** 检查两个天干是否构成五合，返回化出的五行或 null */
export function getTianGanHeElement(a: HeavenlyStem, b: HeavenlyStem): FiveElement | null {
  return WU_HE_MAP.get(`${a}${b}`) ?? null
}

/** 检查两个地支是否构成六合，返回化出的五行或 null */
export function getDiZhiHeElement(a: EarthlyBranch, b: EarthlyBranch): FiveElement | null {
  return LIU_HE_MAP.get(`${a}${b}`) ?? null
}
