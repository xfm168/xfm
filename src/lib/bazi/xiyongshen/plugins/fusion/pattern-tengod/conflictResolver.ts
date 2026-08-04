/**
 * P1.2.2 — 格局与十神冲突解决器
 *
 * 典型冲突场景：
 * - Pattern：七杀格（贵格）
 * - TenGod：杀旺无制 / 无印化 → 七杀攻身为灾
 * - Fusion 判断：七杀为权（有制化） or 七杀为灾（无制化且身弱）
 *
 * 输出冲突报告：
 *   - 冲突来源
 *   - 双方证据
 *   - 采信理由
 *   - 最终权重
 */
import type {
  FusionConflictItem,
  ConflictResolverResult,
  PatternTag,
  PriorityMatrixResult,
} from './types'
import type { GejuVerdict } from '../../../pattern/types'
import type { CombinationVerdict, TenGodDistribution, TenGodName } from '../../../tengod/types'
import { extractDayStrength, getBangShenSet, inferCategoryFromTenGods } from './priorityMatrix'

const BANG_SHEN = getBangShenSet()

/**
 * 判定某十神是否旺：perGod 计数 ≥ 3 或在 dominantGods
 */
function isWang(
  name: TenGodName,
  dist?: TenGodDistribution,
  dominant?: TenGodName[]
): boolean {
  if (dist?.perGod?.[name] && dist.perGod[name] >= 3) return true
  if (dominant && dominant.includes(name)) return true
  if (dist?.tianGanFlags?.[name] && (dist.perGod?.[name] || 0) >= 2) return true
  return false
}

function countZhi(dist?: TenGodDistribution): number {
  let cnt = 0
  for (const k of Object.keys(dist?.perGod || {}) as TenGodName[]) {
    cnt += dist?.perGod?.[k] || 0
  }
  return cnt
}

export function resolvePatternTenGodConflict(args: {
  patternVerdict?: GejuVerdict
  patternCategory?: '七杀' | '伤官' | '财' | '印' | null
  distribution?: TenGodDistribution
  combinationVerdicts?: CombinationVerdict[]
  dayStrength?: number
  dayRootCount?: number
  priority: PriorityMatrixResult
}): ConflictResolverResult {
  const items: FusionConflictItem[] = []
  let category = args.patternCategory
  if (!category) {
    category = inferCategoryFromTenGods({
      distribution: args.distribution,
    })
  }
  const dist = args.distribution
  const dominant = dist?.dominantGods || []
  const priority = args.priority
  const strongOrWeak = extractDayStrength(
    args.patternVerdict?.confidence ?? 0.5,
    dist,
    args.dayStrength,
    args.dayRootCount
  )
  const dayRoots = args.dayRootCount ?? 0

  // 命中：七杀格 · 杀旺无制 / 杀旺有制化 的冲突
  if (category === '七杀') {
    const shaWang = isWang('七杀', dist, dominant)
    const hasYin = isWang('正印', dist, dominant) || isWang('偏印', dist, dominant)
    const hasShi = isWang('食神', dist, dominant)
    const hasZhiHua = hasYin || hasShi
    const verdictConf = args.patternVerdict?.confidence ?? 0.5

    // Pattern 侧：成格 → 贵
    const patWeight = +7
    const patEv = args.patternVerdict?.evidences?.join('；') || `七杀格 confidence=${verdictConf.toFixed(2)}`

    // TenGod 侧：杀旺
    const tgWeight = shaWang
      ? (hasZhiHua ? +4 : -6)
      : 0
    const tgEv = shaWang
      ? (hasZhiHua ? '七杀旺相且有制化（印化或食制）→ 杀为权' : '七杀旺相，缺乏印化/食制 → 七杀攻身为灾')
      : '七杀不旺，无攻身之虞'

    const isConflict = shaWang && !hasZhiHua && strongOrWeak === '弱'
    if (isConflict) {
      const finalWeight = Math.max(-10, tgWeight * 1.2 - (dayRoots === 0 ? 2 : 0))
      const id = 'conflict-qi-sha-wu-zhi'
      items.push({
        id,
        sources: [
          {
            source: 'pattern',
            view: '七杀成格，格局层面倾向贵格',
            evidenceSummary: patEv,
            weight: patWeight,
            citation: args.patternVerdict?.classicCitations?.[0]?.quote || undefined,
          },
          {
            source: 'tengod',
            view: '十神层杀旺且无制化，身弱，七杀攻身',
            evidenceSummary: tgEv,
            weight: tgWeight,
          },
        ],
        resolveReason: '七杀贵格成立前提：需有制化。杀旺无制且身弱时，十神层攻身判断优先于格局层的贵格倾向（子平：七杀乃凶神，需先制化，再论格）。',
        verdict: 'adopt-tengod',
        finalWeight,
        confidence: 0.9,
      })
    } else if (shaWang && hasZhiHua) {
      // 协同：双方都支持吉 → 非冲突，但在 items 中记录为协同
      const id = 'synergy-qi-sha'
      const finalWeight = 8.5
      items.push({
        id,
        sources: [
          { source: 'pattern', view: '七杀成格', evidenceSummary: patEv, weight: patWeight, citation: args.patternVerdict?.classicCitations?.[0]?.quote || undefined },
          { source: 'tengod', view: '七杀有制化', evidenceSummary: tgEv, weight: tgWeight },
        ],
        resolveReason: '格局层与十神层一致（杀旺+制化=贵格），采信双方，加权叠加。',
        verdict: 'blend',
        finalWeight,
        confidence: 0.95,
      })
    }
  }

  // 伤官见官冲突
  if (category === '伤官') {
    const sg = isWang('伤官', dist, dominant) || isWang('食神', dist, dominant)
    const guan = isWang('正官', dist, dominant)
    const sgg = sg && guan
    const hasYin = isWang('正印', dist, dominant) || isWang('偏印', dist, dominant)
    const hasCai = isWang('正财', dist, dominant) || isWang('偏财', dist, dominant)
    const peiYin = sg && hasYin && !guan
    const shengCai = sg && hasCai
    if (sgg) {
      const id = 'conflict-shang-guan-jian-guan'
      items.push({
        id,
        sources: [
          {
            source: 'pattern',
            view: '伤官成格，以才气生财或佩印为美',
            evidenceSummary: args.patternVerdict?.evidences?.join('；') || '伤官格',
            weight: 5,
          },
          {
            source: 'tengod',
            view: '伤官与正官并见，伤官克官（凶）',
            evidenceSummary: '伤官旺+正官旺=伤官见官，为祸百端',
            weight: -7,
          },
        ],
        resolveReason: '伤官用事者最忌见官。伤官格若出现官星，组合先取伤官见官凶组合，覆盖原格。子平曰：伤官见官，为祸百端。',
        verdict: 'adopt-tengod',
        finalWeight: -7.5,
        confidence: 0.9,
      })
    } else if (peiYin || shengCai) {
      const id = 'synergy-shang-guan'
      items.push({
        id,
        sources: [
          { source: 'pattern', view: '伤官成格', evidenceSummary: args.patternVerdict?.evidences?.join('；') || '伤官格', weight: 5 },
          { source: 'tengod', view: peiYin ? '伤官佩印 → 才华可驾驭' : '伤官生财 → 才华化财', evidenceSummary: peiYin ? '有印制伤官为喜' : '有财星泄伤官秀气', weight: peiYin ? 7 : 6 },
        ],
        resolveReason: '伤官格与伤官佩印/伤官生财组合一致，采信双方。',
        verdict: 'blend',
        finalWeight: peiYin ? 8 : 7,
        confidence: 0.92,
      })
    }
  }

  // 财格：身弱财旺 vs 身强财旺
  if (category === '财') {
    const caiWang = isWang('正财', dist, dominant) || isWang('偏财', dist, dominant)
    const guan = isWang('正官', dist, dominant) || isWang('七杀', dist, dominant)
    const shenRuo = strongOrWeak === '弱'
    if (caiWang && shenRuo) {
      const id = 'conflict-cai-shen-ruo'
      items.push({
        id,
        sources: [
          {
            source: 'pattern',
            view: '财成格 → 富格倾向',
            evidenceSummary: args.patternVerdict?.evidences?.join('；') || '财格',
            weight: 5,
          },
          {
            source: 'tengod',
            view: '财旺但身弱，身弱不担财 → 富屋贫人',
            evidenceSummary: `日主根气=${dayRoots}，帮身十神不足，财旺反为累`,
            weight: -4,
          },
        ],
        resolveReason: '财格之美在于身强能担。身弱财旺虽成格，但先按身弱不担财论，减吉。',
        verdict: 'adopt-tengod',
        finalWeight: -4,
        confidence: 0.88,
      })
    } else if (caiWang && strongOrWeak === '强' && guan) {
      const id = 'synergy-cai-guan'
      items.push({
        id,
        sources: [
          { source: 'pattern', view: '财成格', evidenceSummary: args.patternVerdict?.evidences?.join('；') || '财格', weight: 5 },
          { source: 'tengod', view: '财生官 → 财官双美', evidenceSummary: '身强，财旺且官旺，财官相生', weight: 7 },
        ],
        resolveReason: '身强财格见官为财官双美，一致采信双方。',
        verdict: 'blend',
        finalWeight: 7.5,
        confidence: 0.93,
      })
    }
  }

  // 印格：印旺身弱（印多为忌）
  if (category === '印') {
    const yinCount = (dist?.perGod?.['正印'] || 0) + (dist?.perGod?.['偏印'] || 0)
    const shenRuo = strongOrWeak === '弱'
    if (yinCount >= 3 && shenRuo) {
      const id = 'conflict-yin-duo-wei-ji'
      items.push({
        id,
        sources: [
          {
            source: 'pattern',
            view: '印成格 → 文书学业、贵气',
            evidenceSummary: args.patternVerdict?.evidences?.join('；') || '印格',
            weight: 5,
          },
          {
            source: 'tengod',
            view: '印星过多但身弱（母慈灭子），印反为忌',
            evidenceSummary: `印星数量=${yinCount}，根气=${dayRoots}，帮身${[...BANG_SHEN].reduce((acc, g) => acc + (dist?.perGod?.[g] || 0), 0)}→ 印多埋身，印转为忌`,
            weight: -4.5,
          },
        ],
        resolveReason: '印格以印护身为美，但印多反埋身时（母慈灭子），印由喜转忌。此情形取十神层「印多为忌」判断。',
        verdict: 'adopt-tengod',
        finalWeight: -4.5,
        confidence: 0.9,
      })
    }
  }

  // 如果 priorityMatrix 有 dominant 的强标签，且未有 items → 至少写入 1 条 non-conflict 的协同/正常记录
  if (items.length === 0 && priority.dominant && priority.dominant.tag !== 'unknown') {
    const id = 'fusion-tag-' + priority.dominant.tag
    items.push({
      id,
      sources: [
        { source: 'pattern', view: '格局命中 ' + (args.patternVerdict?.name || '未知格'), evidenceSummary: args.patternVerdict?.evidences?.join('；') || '', weight: 3 },
        { source: 'tengod', view: priority.dominant.label, evidenceSummary: priority.dominant.trigger, weight: priority.dominant.baseWeight },
      ],
      resolveReason: '格局与十神均指向同一方向（或不冲突），采用优先级矩阵权重。',
      verdict: 'blend',
      finalWeight: priority.dominant.baseWeight,
      confidence: 0.85,
    })
  }

  const conflictItems = items.filter(i => i.sources.some(s => (s.weight >= 0) !== (i.sources[0]?.weight >= 0)))
  const hasConflict = conflictItems.length > 0
  const confSeverity = hasConflict
    ? Math.min(1, +(conflictItems.reduce((s, i) => s + Math.abs(i.finalWeight) / 10, 0) / Math.max(1, conflictItems.length)).toFixed(3))
    : 0
  // adjustedWeight：考虑冲突后的净权重（items 每个 item 的 finalWeight + 基础 priority.totalWeight，但冲突扣 10%）
  const conflictDeduction = hasConflict ? 0.9 : 1
  const adjustedWeight = +(
    (priority.totalWeight + items.reduce((s, i) => s + i.finalWeight, 0)) * conflictDeduction
  ).toFixed(3)

  return {
    hasConflict,
    items,
    conflictSeverity: confSeverity,
    adjustedWeight,
  }
}
