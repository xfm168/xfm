/**
 * ConflictDetector — 冲/刑/害/破 检测器
 *
 * P1 原则：Detector 只负责判断，输出 ConflictCommand[]，绝不修改 Qi
 *
 * 规则依据：
 * - 《滴天髓》："冲者，战也"
 * - 《子平真诠》：六冲/三刑/六害/六破各有定义
 *
 * 优先级：冲(100) > 刑(200) > 害(300) > 破(400)
 * 数字越小越先执行
 */

import type { EarthlyBranch } from '../../types'
import type { QiNode, ConflictCommand, QiDeduction } from '../types'

// ─── 六冲 ───
// 子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲

const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const CHONG_MAP = new Map(LIU_CHONG.flatMap(([a, b]) => [[a, b], [b, a]]))

// ─── 三刑 ───
// 无恩之刑：寅巳申（寅刑巳、巳刑申、申刑寅）
// 恃势之刑：丑戌未（丑刑戌、戌刑未、未刑丑）
// 无礼之刑：子卯（子刑卯、卯刑子）
// 自刑：辰辰、午午、酉酉、亥亥

const SAN_XING_SETS: EarthlyBranch[][] = [
  ['寅', '巳', '申'],  // 无恩之刑
  ['丑', '戌', '未'],  // 恃势之刑
]

const WU_LI_XING: [EarthlyBranch, EarthlyBranch] = ['子', '卯']

const ZI_XING: EarthlyBranch[] = ['辰', '午', '酉', '亥']

// ─── 六害 ───
// 子未害、丑午害、寅巳害、卯辰害、申亥害、酉戌害

const LIU_HAI: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

const HAI_MAP = new Map(LIU_HAI.flatMap(([a, b]) => [[a, b], [b, a]]))

// ─── 六破 ───
// 子酉破、丑辰破、寅巳破、卯午破、申亥破、未戌破

const LIU_PO: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '巳'],
  ['卯', '午'], ['申', '亥'], ['未', '戌'],
]

const PO_MAP = new Map(LIU_PO.flatMap(([a, b]) => [[a, b], [b, a]]))

// ─── 冲刑害破 各自对气的影响力度 ───
// 冲：最强，基础 40%，按 pillar 层级加权
// 刑：中等，被刑方损失 30%
// 害：较弱，被害方损失 20%
// 破：较弱，被破方损失 15%

const BASE_CONFLICT_RATIO: Record<ConflictCommand['type'], number> = {
  '冲': 0.4,
  '刑': 0.3,
  '害': 0.2,
  '破': 0.15,
}

// ─── 冲的层级权重 ───
// 《子平真诠》：月令为提纲，冲月令影响最大
// 月令冲(1.0) > 日支冲(0.8) > 时支冲(0.6) > 年支冲(0.5)

const CHONG_WEIGHT: Record<string, number> = {
  month: 1.0,
  day: 0.8,
  hour: 0.6,
  year: 0.5,
}

/** 计算冲的权重：取双方中较高者 */
function getChongWeight(pillarA: string, pillarB: string): number {
  const wA = CHONG_WEIGHT[pillarA] ?? 0.5
  const wB = CHONG_WEIGHT[pillarB] ?? 0.5
  return Math.max(wA, wB)
}

// ─── 从 QiNode[] 提取四柱地支 ───

interface PillarBranch {
  pillar: string
  branch: EarthlyBranch
  nodes: QiNode[]
}

function getPillarBranches(qiNodes: QiNode[]): PillarBranch[] {
  const map = new Map<string, PillarBranch>()

  for (const node of qiNodes) {
    if (!node.active) continue
    // 只取每个 pillar 的第一个 branch 作为代表
    const key = node.pillar
    if (!map.has(key)) {
      map.set(key, { pillar: key, branch: node.branch, nodes: [] })
    }
    map.get(key)!.nodes.push(node)
  }

  return Array.from(map.values())
}

// ─── 六冲检测 ───

function detectChong(pillarBranches: PillarBranch[]): ConflictCommand[] {
  const commands: ConflictCommand[] = []
  const branchPillars = new Map<EarthlyBranch, PillarBranch>()

  for (const pb of pillarBranches) {
    branchPillars.set(pb.branch, pb)
  }

  for (const [a, b] of LIU_CHONG) {
    const pa = branchPillars.get(a)
    const pb = branchPillars.get(b)
    if (!pa || !pb) continue

    const weight = getChongWeight(pa.pillar, pb.pillar)
    const ratio = BASE_CONFLICT_RATIO['冲'] * weight
    const deductions: QiDeduction[] = []

    // 双方各损失 ratio（仅地支藏干，不含天干）
    for (const node of pa.nodes) {
      if (!node.active) continue
      if (node.source === '天干') continue
      const amount = Math.round(node.strength * ratio)
      if (amount > 0) {
        deductions.push({
          targetId: node.id,
          amount,
          sourceElement: node.element,
          sourceName: `${node.hiddenStem ?? ''}${node.element}`,
          detail: `${pa.pillar}支${a}被${pb.pillar}支${b}冲，损失${Math.round(ratio * 100)}%气值(${amount}分，权重${weight})`,
        })
      }
    }
    for (const node of pb.nodes) {
      if (!node.active) continue
      if (node.source === '天干') continue
      const amount = Math.round(node.strength * ratio)
      if (amount > 0) {
        deductions.push({
          targetId: node.id,
          amount,
          sourceElement: node.element,
          sourceName: `${node.hiddenStem ?? ''}${node.element}`,
          detail: `${pb.pillar}支${b}被${pa.pillar}支${a}冲，损失${Math.round(ratio * 100)}%气值(${amount}分，权重${weight})`,
        })
      }
    }

    commands.push({
      type: '冲',
      sources: [pa.branch, pb.branch],
      weight,
      pillar: `${pa.pillar}-${pb.pillar}`,
      reason: `${pa.pillar}${a}与${pb.pillar}${b}相冲（${a}${b}冲），双方各损${Math.round(ratio * 100)}%气值（权重${weight}）`,
      deductions,
    })
  }

  return commands
}

// ─── 三刑检测 ───

function detectXing(pillarBranches: PillarBranch[]): ConflictCommand[] {
  const commands: ConflictCommand[] = []
  const branchPillars = new Map<EarthlyBranch, PillarBranch>()

  for (const pb of pillarBranches) {
    branchPillars.set(pb.branch, pb)
  }

  // 无恩之刑：寅巳申
  for (const set of SAN_XING_SETS) {
    const present = set.map(b => branchPillars.get(b)).filter(Boolean) as PillarBranch[]
    if (present.length < 2) continue

    // 两两相刑
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const pa = present[i]
        const pb = present[j]
        const ratio = BASE_CONFLICT_RATIO['刑']
        const deductions: QiDeduction[] = []

        // 被刑方损失 ratio（双向，仅地支藏干，不含天干）
        for (const node of pa.nodes) {
          if (!node.active) continue
          if (node.source === '天干') continue
          const amount = Math.round(node.strength * ratio)
          if (amount > 0) {
            deductions.push({
              targetId: node.id,
              amount,
              sourceElement: node.element,
              sourceName: `${node.hiddenStem ?? ''}${node.element}`,
              detail: `${pa.pillar}支${pa.branch}刑${pb.pillar}支${pb.branch}，损失${ratio * 100}%气值(${amount}分)`,
            })
          }
        }
        for (const node of pb.nodes) {
          if (!node.active) continue
          if (node.source === '天干') continue
          const amount = Math.round(node.strength * ratio)
          if (amount > 0) {
            deductions.push({
              targetId: node.id,
              amount,
              sourceElement: node.element,
              sourceName: `${node.hiddenStem ?? ''}${node.element}`,
              detail: `${pb.pillar}支${pb.branch}刑${pa.pillar}支${pa.branch}，损失${ratio * 100}%气值(${amount}分)`,
            })
          }
        }

        const xingName = set.includes('寅') ? '无恩之刑' : '恃势之刑'
        commands.push({
          type: '刑',
          sources: [pa.branch, pb.branch],
          reason: `${pa.pillar}${pa.branch}与${pb.pillar}${pb.branch}${xingName}（${set.join('')}），互损${ratio * 100}%气值`,
          deductions,
        })
      }
    }
  }

  // 无礼之刑：子卯
  const zi = branchPillars.get('子')
  const mao = branchPillars.get('卯')
  if (zi && mao) {
    const ratio = BASE_CONFLICT_RATIO['刑']
    const deductions: QiDeduction[] = []

    for (const node of zi.nodes) {
      if (!node.active) continue
      if (node.source === '天干') continue
      const amount = Math.round(node.strength * ratio)
      if (amount > 0) {
        deductions.push({
          targetId: node.id,
          amount,
          sourceElement: node.element,
          sourceName: `${node.hiddenStem ?? ''}${node.element}`,
          detail: `${zi.pillar}支子刑${mao.pillar}支卯（无礼之刑），损失${ratio * 100}%气值(${amount}分)`,
        })
      }
    }
    for (const node of mao.nodes) {
      if (!node.active) continue
      if (node.source === '天干') continue
      const amount = Math.round(node.strength * ratio)
      if (amount > 0) {
        deductions.push({
          targetId: node.id,
          amount,
          sourceElement: node.element,
          sourceName: `${node.hiddenStem ?? ''}${node.element}`,
          detail: `${mao.pillar}支卯刑${zi.pillar}支子（无礼之刑），损失${ratio * 100}%气值(${amount}分)`,
        })
      }
    }

    commands.push({
      type: '刑',
      sources: ['子', '卯'],
      reason: `${zi.pillar}子与${mao.pillar}卯无礼之刑，互损${ratio * 100}%气值`,
      deductions,
    })
  }

  // 自刑：辰辰、午午、酉酉、亥亥（同一地支出现两次）
  for (const self of ZI_XING) {
    const matching = pillarBranches.filter(pb => pb.branch === self)
    if (matching.length >= 2) {
      const ratio = BASE_CONFLICT_RATIO['刑']
      const deductions: QiDeduction[] = []

      for (const pb of matching) {
        for (const node of pb.nodes) {
          if (!node.active) continue
          if (node.source === '天干') continue
          const amount = Math.round(node.strength * ratio)
          if (amount > 0) {
            deductions.push({
              targetId: node.id,
              amount,
              sourceElement: node.element,
              sourceName: `${node.hiddenStem ?? ''}${node.element}`,
              detail: `${pb.pillar}支${self}自刑，损失${ratio * 100}%气值(${amount}分)`,
            })
          }
        }
      }

      commands.push({
        type: '刑',
        sources: matching.map(pb => pb.branch),
        reason: `${matching.map(pb => `${pb.pillar}${self}`).join('与')}自刑，各损${ratio * 100}%气值`,
        deductions,
      })
    }
  }

  return commands
}

// ─── 六害检测 ───

function detectHai(pillarBranches: PillarBranch[]): ConflictCommand[] {
  const commands: ConflictCommand[] = []
  const branchPillars = new Map<EarthlyBranch, PillarBranch>()

  for (const pb of pillarBranches) {
    branchPillars.set(pb.branch, pb)
  }

  for (const [a, b] of LIU_HAI) {
    const pa = branchPillars.get(a)
    const pb = branchPillars.get(b)
    if (!pa || !pb) continue

    const ratio = BASE_CONFLICT_RATIO['害']
    const deductions: QiDeduction[] = []

    // 害：双方各损失 ratio（仅地支藏干，不含天干）
    for (const node of pa.nodes) {
      if (!node.active) continue
      if (node.source === '天干') continue
      const amount = Math.round(node.strength * ratio)
      if (amount > 0) {
        deductions.push({
          targetId: node.id,
          amount,
          sourceElement: node.element,
          sourceName: `${node.hiddenStem ?? ''}${node.element}`,
          detail: `${pa.pillar}支${a}害${pb.pillar}支${b}，损失${ratio * 100}%气值(${amount}分)`,
        })
      }
    }
    for (const node of pb.nodes) {
      if (!node.active) continue
      if (node.source === '天干') continue
      const amount = Math.round(node.strength * ratio)
      if (amount > 0) {
        deductions.push({
          targetId: node.id,
          amount,
          sourceElement: node.element,
          sourceName: `${node.hiddenStem ?? ''}${node.element}`,
          detail: `${pb.pillar}支${b}害${pa.pillar}支${a}，损失${ratio * 100}%气值(${amount}分)`,
        })
      }
    }

    commands.push({
      type: '害',
      sources: [a, b],
      reason: `${pa.pillar}${a}与${pb.pillar}${b}相害（${a}${b}害），双方各损${ratio * 100}%气值`,
      deductions,
    })
  }

  return commands
}

// ─── 六破检测 ───

function detectPo(pillarBranches: PillarBranch[]): ConflictCommand[] {
  const commands: ConflictCommand[] = []
  const branchPillars = new Map<EarthlyBranch, PillarBranch>()

  for (const pb of pillarBranches) {
    branchPillars.set(pb.branch, pb)
  }

  for (const [a, b] of LIU_PO) {
    const pa = branchPillars.get(a)
    const pb = branchPillars.get(b)
    if (!pa || !pb) continue

    const ratio = BASE_CONFLICT_RATIO['破']
    const deductions: QiDeduction[] = []

    // 破：双方各损失 ratio（仅地支藏干，不含天干）
    for (const node of pa.nodes) {
      if (!node.active) continue
      if (node.source === '天干') continue
      const amount = Math.round(node.strength * ratio)
      if (amount > 0) {
        deductions.push({
          targetId: node.id,
          amount,
          sourceElement: node.element,
          sourceName: `${node.hiddenStem ?? ''}${node.element}`,
          detail: `${pa.pillar}支${a}破${pb.pillar}支${b}，损失${ratio * 100}%气值(${amount}分)`,
        })
      }
    }
    for (const node of pb.nodes) {
      if (!node.active) continue
      if (node.source === '天干') continue
      const amount = Math.round(node.strength * ratio)
      if (amount > 0) {
        deductions.push({
          targetId: node.id,
          amount,
          sourceElement: node.element,
          sourceName: `${node.hiddenStem ?? ''}${node.element}`,
          detail: `${pb.pillar}支${b}破${pa.pillar}支${a}，损失${ratio * 100}%气值(${amount}分)`,
        })
      }
    }

    commands.push({
      type: '破',
      sources: [a, b],
      reason: `${pa.pillar}${a}与${pb.pillar}${b}相破（${a}${b}破），双方各损${ratio * 100}%气值`,
      deductions,
    })
  }

  return commands
}

// ─── 统一检测入口 ───

/**
 * 检测所有冲/刑/害/破
 * 只负责判断，绝不修改 QiNode
 *
 * @param qiNodes 当前气节点
 * @returns ConflictCommand[] 冲突命令列表
 */
export function detectConflicts(qiNodes: QiNode[]): ConflictCommand[] {
  const pillarBranches = getPillarBranches(qiNodes)

  const commands: ConflictCommand[] = [
    ...detectChong(pillarBranches),
    ...detectXing(pillarBranches),
    ...detectHai(pillarBranches),
    ...detectPo(pillarBranches),
  ]

  return commands
}

// ─── 辅助查询函数 ───

/** 检查两个地支是否构成冲 */
export function isChong(a: EarthlyBranch, b: EarthlyBranch): boolean {
  return CHONG_MAP.has(a) && CHONG_MAP.get(a) === b
}

/** 检查两个地支是否构成害 */
export function isHai(a: EarthlyBranch, b: EarthlyBranch): boolean {
  return HAI_MAP.has(a) && HAI_MAP.get(a) === b
}

/** 检查两个地支是否构成破 */
export function isPo(a: EarthlyBranch, b: EarthlyBranch): boolean {
  return PO_MAP.has(a) && PO_MAP.get(a) === b
}

/** 检查两个地支是否构成刑 */
export function isXing(a: EarthlyBranch, b: EarthlyBranch): boolean {
  // 无礼之刑
  if ((a === '子' && b === '卯') || (a === '卯' && b === '子')) return true
  // 自刑
  if (a === b && ZI_XING.includes(a)) return true
  // 三刑组
  for (const set of SAN_XING_SETS) {
    if (set.includes(a) && set.includes(b) && a !== b) return true
  }
  return false
}
