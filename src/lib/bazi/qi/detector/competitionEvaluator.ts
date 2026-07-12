/**
 * CompetitionEvaluator — 冲合竞争评分器 (Dynamic CompetitionScore System)
 *
 * P1 原则：Detector 只负责判断，绝不修改 Qi
 *
 * 核心逻辑：
 * - 当地支同时被冲和被合时，不能简单先冲再合
 * - 计算每个命令的 CompetitionScore（动态公式，浮点数）
 * - 高分命令生效，低分命令被抑制
 *
 * CompetitionScore = baseScore
 *   + monthZhiBonus      // +15 if command involves month branch
 *   + deLingBonus        // +10 if seasonCommand.type === '得令' AND command relates to dayElement
 *   + siLingBonus        // +8 if command involves the 本气 commander
 *   + touGanBonus        // +5 if 化神/冲突五行透干
 *   + genQiBonus         // +2 * number of participating active nodes (rootId uniqueness)
 *   + huaShenStrength    // +化神总气值 / 10
 *   - kongWangPenalty    // -10 if any branch is 空亡 (skip for now, just reserve)
 *   - chongPenalty       // -8 if command involves a branch that is also being 冲'd
 *   - xingHaiPenalty     // -5 if command involves a branch that is also being 刑/害'd
 *   - muQiPenalty        // -3 if any node has state === '墓气'
 */

import type { EarthlyBranch, HeavenlyStem } from '../../types'
import type { QiNode, ConflictCommand, HeHuaCommand, SeasonCommand } from '../types'

// ─── 竞争评分分解因子（本地定义，避免循环依赖） ───

/** 详细的竞争评分因子分解（用于 Explain） */
export interface CompetitionFactors {
  /** 基础分 */
  baseScore: number
  /** 月令地支加成 */
  monthZhiBonus: number
  /** 得令加成 */
  deLingBonus: number
  /** 司令加成 */
  siLingBonus: number
  /** 透干加成 */
  touGanBonus: number
  /** 根气加成 */
  genQiBonus: number
  /** 化神/冲突强度加成 */
  huaShenStrength: number
  /** 空亡罚分 */
  kongWangPenalty: number
  /** 冲罚分 */
  chongPenalty: number
  /** 刑害罚分 */
  xingHaiPenalty: number
  /** 墓气罚分 */
  muQiPenalty: number
  /** 柱间距离加成（新增） */
  distanceBonus: number
  /** 主动权加成（新增） */
  initiativeBonus: number
}

// ─── 统一基础分表（所有命令类型）───
const BASE_SCORE: Record<HeHuaCommand['type'] | ConflictCommand['type'], number> = {
  '地支三会': 100,
  '地支三合': 80,
  '地支六合': 60,
  '天干五合': 30,
  '冲': 50,
  '刑': 40,
  '害': 25,
  '破': 15,
}

// ─── 常量系数 ───
const MONTH_ZHI_BONUS = 15
const DE_LING_BONUS = 10
const SI_LING_BONUS = 8
const TOU_GAN_BONUS = 5
const GEN_QI_BONUS_PER_ROOT = 2
const HUA_SHEN_STRENGTH_DIVISOR = 10
const KONG_WANG_PENALTY = 10
const CHONG_PENALTY = 8
const XING_HAI_PENALTY = 5
const MU_QI_PENALTY = 3

interface ScoredCommand<T> {
  cmd: T
  score: number
  branches: EarthlyBranch[]
}

export interface CompetitionResult {
  activeConflicts: ConflictCommand[]
  activeHeHuas: HeHuaCommand[]
  suppressed: string[]
  /** 详细的评分分解（用于 Explain） */
  scoreBreakdowns?: { subject: string; factors: CompetitionFactors; finalScore: number }[]
}

const ALL_BRANCHES: readonly EarthlyBranch[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
]

const ALL_STEMS: readonly HeavenlyStem[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
]

/** 判断字符串是否为地支 */
function isBranch(s: string): s is EarthlyBranch {
  return ALL_BRANCHES.includes(s as EarthlyBranch)
}

/** 判断字符串是否为天干 */
function isStem(s: string): s is HeavenlyStem {
  return ALL_STEMS.includes(s as HeavenlyStem)
}

/** 从 seasonCommands 中提取月令地支 */
function getMonthZhi(seasonCommands?: SeasonCommand[]): EarthlyBranch | undefined {
  return seasonCommands?.[0]?.monthZhi
}

/** 从 seasonCommands 中提取日主五行 */
function getDayElement(seasonCommands?: SeasonCommand[]) {
  return seasonCommands?.[0]?.dayElement
}

/** 从 seasonCommands 中提取司令（本气藏干名称，如 "甲木"） */
function getCommander(seasonCommands?: SeasonCommand[]): string | undefined {
  return seasonCommands?.[0]?.commander
}

/** 从 commander 字符串中提取天干（如 "甲木" → "甲"） */
function extractStemFromCommander(commander: string): HeavenlyStem | undefined {
  if (!commander) return undefined
  const first = commander.charAt(0) as HeavenlyStem
  return isStem(first) ? first : undefined
}

/** 获取命令涉及的所有地支 */
function getCommandBranches(cmd: HeHuaCommand | ConflictCommand): EarthlyBranch[] {
  return cmd.sources.filter(isBranch)
}

/** 获取命令涉及的所有天干 */
function getCommandStems(cmd: HeHuaCommand | ConflictCommand): HeavenlyStem[] {
  return cmd.sources.filter(isStem)
}

/** 判断命令是否涉及某地支 */
function involvesBranch(
  cmd: HeHuaCommand | ConflictCommand,
  branch: EarthlyBranch | undefined,
): boolean {
  if (!branch) return false
  return getCommandBranches(cmd).includes(branch)
}

/** 获取命令涉及的活跃节点（按 rootId 去重前的原始列表） */
function getParticipatingActiveNodes(
  cmd: HeHuaCommand | ConflictCommand,
  qiNodes: QiNode[],
): QiNode[] {
  const branches = new Set(getCommandBranches(cmd))
  const stems = new Set(getCommandStems(cmd))
  return qiNodes.filter(n => {
    if (!n.active) return false
    if (branches.has(n.branch)) return true
    if (n.hiddenStem && stems.has(n.hiddenStem)) return true
    return false
  })
}

/** 判断命令是否与 dayElement 相关 */
function relatesToDayElement(
  cmd: HeHuaCommand | ConflictCommand,
  dayElement: ReturnType<typeof getDayElement>,
  qiNodes: QiNode[],
): boolean {
  if (!dayElement) return false
  // 合化命令：huaElement 等于 dayElement
  if ('huaElement' in cmd && cmd.huaElement === dayElement) return true
  // 冲突命令：扣减涉及 dayElement 或参与节点中有 dayElement
  for (const d of cmd.deductions) {
    if (d.sourceElement === dayElement) return true
  }
  const activeNodes = getParticipatingActiveNodes(cmd, qiNodes)
  if (activeNodes.some(n => n.element === dayElement)) return true
  return false
}

/** 判断化神/冲突五行是否透干 */
function isTouGan(
  cmd: HeHuaCommand | ConflictCommand,
  qiNodes: QiNode[],
): boolean {
  let targetElement: string | undefined = 'huaElement' in cmd ? cmd.huaElement : undefined
  if (!targetElement) {
    // 冲突命令：取参与节点中总气值最高的五行作为主要冲突五行
    const activeNodes = getParticipatingActiveNodes(cmd, qiNodes)
    if (activeNodes.length === 0) return false
    const strengthByElement = new Map<string, number>()
    for (const n of activeNodes) {
      strengthByElement.set(n.element, (strengthByElement.get(n.element) ?? 0) + n.strength)
    }
    targetElement = [...strengthByElement.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  }
  if (!targetElement) return false
  // 检查是否有天干节点具有该五行
  return qiNodes.some(n => n.source === '天干' && n.element === targetElement && n.active)
}

/** 计算化神总气值（合化）或冲突参与总气值（冲突） */
function calcHuaShenStrength(
  cmd: HeHuaCommand | ConflictCommand,
  qiNodes: QiNode[],
): number {
  const activeNodes = getParticipatingActiveNodes(cmd, qiNodes)
  if ('huaElement' in cmd) {
    return activeNodes
      .filter(n => n.element === cmd.huaElement)
      .reduce((sum, n) => sum + n.strength, 0)
  }
  // 冲突命令：累加所有参与节点的气值
  return activeNodes.reduce((sum, n) => sum + n.strength, 0)
}

// ─── 新增评分因子：柱间距离 + 主动权 ───

const PILLAR_ORDER = ['year', 'month', 'day', 'hour']

/** 计算两个地支所在柱之间的距离加成 */
function calcDistance(pillar1: string, pillar2: string): number {
  const idx1 = PILLAR_ORDER.indexOf(pillar1)
  const idx2 = PILLAR_ORDER.indexOf(pillar2)
  const dist = Math.abs(idx1 - idx2)
  if (dist === 0) return 10  // 同柱
  if (dist === 1) return 7   // 邻柱
  if (dist === 2) return 3   // 隔柱
  return 0                     // 远隔
}

/** 计算主动权加成（基于力量来源的柱位置） */
function calcInitiative(pillar: string, isMonthCommander: boolean): number {
  if (isMonthCommander) return 8   // 司令优先
  if (pillar === 'month') return 8  // 月令优先
  if (pillar === 'day') return 5    // 日支优先
  if (pillar === 'year') return 2   // 年支优先
  return 3                          // 时支
}

/** 获取命令的主柱（取第一个地支对应的柱） */
function getCommandPrimaryPillar(
  cmd: HeHuaCommand | ConflictCommand,
  qiNodes: QiNode[],
  pillarBranchMap?: Map<string, string>,
): string | undefined {
  const branches = getCommandBranches(cmd)
  if (branches.length === 0) return undefined
  return pillarBranchMap?.get(branches[0])
}

/** 计算统一竞争力分数（所有命令类型共用同一公式） */
function calcCompetitionScore(
  cmd: HeHuaCommand | ConflictCommand,
  qiNodes: QiNode[],
  allConflicts: ConflictCommand[],
  seasonCommands?: SeasonCommand[],
  pillarBranchMap?: Map<string, string>,
): { score: number; factors: CompetitionFactors } {
  const baseScore = BASE_SCORE[cmd.type]

  // 1. 月令地支加成
  const monthZhi = getMonthZhi(seasonCommands)
  const monthZhiBonus = involvesBranch(cmd, monthZhi) ? MONTH_ZHI_BONUS : 0

  // 2. 得令加成
  const dayElement = getDayElement(seasonCommands)
  const hasDeLing = seasonCommands?.some(s => s.type === '得令') ?? false
  const deLingBonus = hasDeLing && relatesToDayElement(cmd, dayElement, qiNodes)
    ? DE_LING_BONUS
    : 0

  // 3. 司令加成
  const commander = getCommander(seasonCommands)
  const commanderStem = extractStemFromCommander(commander ?? '')
  let siLingBonus = 0
  if (commanderStem) {
    const stems = getCommandStems(cmd)
    const branches = getCommandBranches(cmd)
    if (stems.includes(commanderStem) || (monthZhi && branches.includes(monthZhi))) {
      siLingBonus = SI_LING_BONUS
    }
  }

  // 4. 透干加成
  const touGanBonus = isTouGan(cmd, qiNodes) ? TOU_GAN_BONUS : 0

  // 5. 根气加成（按 rootId 去重计数）
  const activeParticipants = getParticipatingActiveNodes(cmd, qiNodes)
  const uniqueRoots = new Set(activeParticipants.map(n => n.rootId))
  const genQiBonus = GEN_QI_BONUS_PER_ROOT * uniqueRoots.size

  // 6. 化神/冲突强度加成
  const huaShenStrength = calcHuaShenStrength(cmd, qiNodes) / HUA_SHEN_STRENGTH_DIVISOR

  // 7. 空亡罚分（预留，暂不实现）
  const kongWangPenalty = 0

  // 8. 冲罚分：本命令涉及的地支同时也在其他冲命令中
  const myBranches = new Set(getCommandBranches(cmd))
  const chongBranches = new Set<EarthlyBranch>()
  for (const c of allConflicts) {
    if (c.type === '冲' && c !== cmd) {
      for (const b of getCommandBranches(c)) chongBranches.add(b)
    }
  }
  const hasChongOverlap = [...myBranches].some(b => chongBranches.has(b))
  const chongPenalty = hasChongOverlap ? CHONG_PENALTY : 0

  // 9. 刑害罚分：本命令涉及的地支同时也在其他刑/害命令中
  const xingHaiBranches = new Set<EarthlyBranch>()
  for (const c of allConflicts) {
    if ((c.type === '刑' || c.type === '害') && c !== cmd) {
      for (const b of getCommandBranches(c)) xingHaiBranches.add(b)
    }
  }
  const hasXingHaiOverlap = [...myBranches].some(b => xingHaiBranches.has(b))
  const xingHaiPenalty = hasXingHaiOverlap ? XING_HAI_PENALTY : 0

  // 10. 墓气罚分
  const muQiPenalty = activeParticipants.some(n => (n.state as string) === '墓气')
    ? MU_QI_PENALTY
    : 0

  // 11. 柱间距离加成（新增）
  let distanceBonus = 0
  if (pillarBranchMap && pillarBranchMap.size > 0) {
    const cmdBranches = getCommandBranches(cmd)
    if (cmdBranches.length >= 2) {
      // 多地支命令：取最近的一对距离
      let minDist = Infinity
      for (let i = 0; i < cmdBranches.length; i++) {
        for (let j = i + 1; j < cmdBranches.length; j++) {
          const p1 = pillarBranchMap.get(cmdBranches[i])
          const p2 = pillarBranchMap.get(cmdBranches[j])
          if (p1 && p2) {
            const d = calcDistance(p1, p2)
            if (d > minDist) minDist = d  // calcDistance returns bonus directly
          }
        }
      }
      distanceBonus = minDist === Infinity ? 0 : minDist
    } else if (cmdBranches.length === 1) {
      // 单地支命令：与月令的距离
      const monthPillar = pillarBranchMap.get(monthZhi || '')
      const cmdPillar = pillarBranchMap.get(cmdBranches[0])
      if (monthPillar && cmdPillar) {
        distanceBonus = calcDistance(monthPillar, cmdPillar)
      }
    }
  }

  // 12. 主动权加成（新增）
  const primaryPillar = getCommandPrimaryPillar(cmd, qiNodes, pillarBranchMap)
  const isMonthCommander = !!(
    commanderStem &&
    (getCommandStems(cmd).includes(commanderStem) ||
      (monthZhi && getCommandBranches(cmd).includes(monthZhi)))
  )
  const initiativeBonus = primaryPillar
    ? calcInitiative(primaryPillar, isMonthCommander)
    : 0

  // 最终得分（浮点数）
  const score = baseScore
    + monthZhiBonus
    + deLingBonus
    + siLingBonus
    + touGanBonus
    + genQiBonus
    + huaShenStrength
    - kongWangPenalty
    - chongPenalty
    - xingHaiPenalty
    - muQiPenalty
    + distanceBonus
    + initiativeBonus

  return {
    score,
    factors: {
      baseScore,
      monthZhiBonus,
      deLingBonus,
      siLingBonus,
      touGanBonus,
      genQiBonus,
      huaShenStrength: Math.round(huaShenStrength * 100) / 100,
      kongWangPenalty,
      chongPenalty,
      xingHaiPenalty,
      muQiPenalty,
      distanceBonus,
      initiativeBonus,
    },
  }
}

/**
 * 评估冲合竞争
 *
 * @param conflicts 所有冲突命令
 * @param heHuas 所有合化命令
 * @param qiNodes 当前气节点（用于辅助判断）
 * @param seasonCommands 月令司令分析结果（可选，用于动态得分计算）
 * @param pillarBranchMap 地支→柱映射（可选，用于距离和主动权加成）
 * @returns 竞争结果（哪些命令生效，哪些被抑制）
 */
export function evaluateCompetition(
  conflicts: ConflictCommand[],
  heHuas: HeHuaCommand[],
  qiNodes: QiNode[],
  seasonCommands?: SeasonCommand[],
  pillarBranchMap?: Map<string, string>,
): CompetitionResult {
  const suppressed: string[] = []
  const scoreBreakdowns: CompetitionResult['scoreBreakdowns'] = []

  // 为每个命令计算分数
  const conflictScores: ScoredCommand<ConflictCommand>[] = conflicts.map(cmd => {
    const { score, factors } = calcCompetitionScore(cmd, qiNodes, conflicts, seasonCommands, pillarBranchMap)
    scoreBreakdowns.push({
      subject: `${cmd.type}(${cmd.sources.join('')})`,
      factors,
      finalScore: score,
    })
    return {
      cmd,
      score,
      branches: getCommandBranches(cmd),
    }
  })

  const heHuaScores: ScoredCommand<HeHuaCommand>[] = heHuas.map(cmd => {
    const { score, factors } = calcCompetitionScore(cmd, qiNodes, conflicts, seasonCommands, pillarBranchMap)
    scoreBreakdowns.push({
      subject: `${cmd.type}(${cmd.sources.join('')})`,
      factors,
      finalScore: score,
    })
    return {
      cmd,
      score,
      branches: getCommandBranches(cmd),
    }
  })

  // 检测地支级别的竞争
  const branchCompetition = new Map<
    EarthlyBranch,
    { conflicts: typeof conflictScores; heHuas: typeof heHuaScores }
  >()

  // 收集每个地支涉及的命令
  for (const cs of conflictScores) {
    for (const b of cs.branches) {
      if (!branchCompetition.has(b)) branchCompetition.set(b, { conflicts: [], heHuas: [] })
      branchCompetition.get(b)!.conflicts.push(cs)
    }
  }
  for (const hs of heHuaScores) {
    for (const b of hs.branches) {
      if (!branchCompetition.has(b)) branchCompetition.set(b, { conflicts: [], heHuas: [] })
      branchCompetition.get(b)!.heHuas.push(hs)
    }
  }

  // 标记被抑制的命令
  const suppressedConflicts = new Set<ConflictCommand>()
  const suppressedHeHuas = new Set<HeHuaCommand>()

  for (const [, { conflicts: cList, heHuas: hList }] of branchCompetition) {
    if (cList.length === 0 || hList.length === 0) continue

    const bestConflict = cList.reduce((best, cur) => (cur.score > best.score ? cur : best), cList[0])
    const bestHeHua = hList.reduce((best, cur) => (cur.score > best.score ? cur : best), hList[0])

    if (bestHeHua.score > bestConflict.score) {
      for (const cs of cList) {
        if (!suppressedConflicts.has(cs.cmd)) {
          suppressedConflicts.add(cs.cmd)
          suppressed.push(
            `${cs.cmd.type}(${cs.cmd.sources.join('')})被合化抑制：` +
            `${bestHeHua.cmd.type}(${bestHeHua.cmd.sources.join('')})竞争力${bestHeHua.score.toFixed(1)} > ${cs.score.toFixed(1)}`,
          )
        }
      }
    } else {
      for (const hs of hList) {
        if (!suppressedHeHuas.has(hs.cmd)) {
          suppressedHeHuas.add(hs.cmd)
          suppressed.push(
            `${hs.cmd.type}(${hs.cmd.sources.join('')})被冲克抑制：` +
            `${bestConflict.cmd.type}(${bestConflict.cmd.sources.join('')})竞争力${bestConflict.score.toFixed(1)} > ${hs.score.toFixed(1)}`,
          )
        }
      }
    }
  }

  const activeConflicts = conflicts.filter(c => !suppressedConflicts.has(c))
  const activeHeHuas = heHuas.filter(h => !suppressedHeHuas.has(h))

  return { activeConflicts, activeHeHuas, suppressed, scoreBreakdowns }
}
