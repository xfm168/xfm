/**
 * P1.2.2 — 格局-十神 联合优先级矩阵
 *
 * 四大正格 × 十神状态：
 * - 七杀格：杀旺 / 杀印相生 / 食神制杀 / 杀旺无制
 * - 伤官格：伤官见官 / 伤官配印 / 伤官生财
 * - 财格：财旺身弱 / 财旺身强 / 财官相生
 * - 印格：印旺身弱（印多为忌）
 */
import type {
  PatternTag,
  PriorityMatrixEntry,
  PriorityMatrixResult,
} from './types'
import type { GejuVerdict } from '../../../pattern/types'
import type {
  TenGodName,
  CombinationVerdict,
  TenGodDistribution,
} from '../../../tengod/types'

export const FUSION_MATRIX_RULES: PriorityMatrixEntry[] = [
  // 七杀格
  {
    tag: 'qi-sha-yin-xiang-sheng',
    label: '七杀格·杀印相生',
    baseWeight: +8.5,
    favorable: true,
    trigger: '七杀成格，且有正印/偏印透出，杀生印，印生身 → 权柄',
  },
  {
    tag: 'qi-shi-zhi-sha',
    label: '七杀格·食神制杀',
    baseWeight: +8.0,
    favorable: true,
    trigger: '七杀成格，食神透出有力，食神克杀 → 制杀为权',
  },
  {
    tag: 'qi-sha-wang',
    label: '七杀格·杀旺',
    baseWeight: +2.5,
    favorable: false,
    trigger: '七杀成格，杀星旺相，无制化 → 攻身为灾',
  },
  {
    tag: 'qi-sha-wu-zhi',
    label: '七杀格·杀旺无制',
    baseWeight: -6.0,
    favorable: false,
    trigger: '七杀成格，杀旺但不见食神制、不见印化，七杀无制攻身',
  },
  // 伤官格
  {
    tag: 'shang-guan-pei-yin',
    label: '伤官格·伤官配印',
    baseWeight: +8.0,
    favorable: true,
    trigger: '伤官成格，有正印/偏印制伤官 → 伤官得制化为才华',
  },
  {
    tag: 'shang-guan-sheng-cai',
    label: '伤官格·伤官生财',
    baseWeight: +6.5,
    favorable: true,
    trigger: '伤官成格，伤官生财星 → 才华化为财禄',
  },
  {
    tag: 'shang-guan-jian-guan',
    label: '伤官格·伤官见官',
    baseWeight: -7.5,
    favorable: false,
    trigger: '伤官成格又见正官透出（或混杂）→ 伤官克官，为祸百端',
  },
  // 财格
  {
    tag: 'cai-guan-xiang-sheng',
    label: '财格·财官相生',
    baseWeight: +7.0,
    favorable: true,
    trigger: '财成格，财星生官 → 财官双美',
  },
  {
    tag: 'cai-wang-shen-qiang',
    label: '财格·财旺身强',
    baseWeight: +6.0,
    favorable: true,
    trigger: '财成格，日主强旺（身强），能担财 → 富格',
  },
  {
    tag: 'cai-wang-shen-ruo',
    label: '财格·财旺身弱',
    baseWeight: -4.0,
    favorable: false,
    trigger: '财成格，财旺但日主无根或根弱 → 富屋贫人，身弱难担财',
  },
  // 印格
  {
    tag: 'yin-wang-shen-ruo',
    label: '印格·印旺身弱（印多为忌）',
    baseWeight: -4.5,
    favorable: false,
    trigger: '印成格，印星过多但日主弱 → 母慈灭子（印多反埋身），印为忌',
  },
  {
    tag: 'unknown',
    label: '未命中明确联合结构',
    baseWeight: 0,
    favorable: false,
    trigger: '未命中七杀/伤官/财/印 四大格 × 十神状态的显式模式',
  },
]

// 十神 → 五行（以甲木日主视角，仅用于默认喜忌建议）
const TENGOD_TO_WUXING_JIA_RI: Record<TenGodName, string> = {
  '比肩': '木', '劫财': '木',
  '食神': '火', '伤官': '火',
  '偏财': '土', '正财': '土',
  '七杀': '金', '正官': '金',
  '偏印': '水', '正印': '水',
}

const TENGOD_BANGSHEN: TenGodName[] = ['比肩', '劫财', '正印', '偏印']
const TENGOD_GONGSHEN: TenGodName[] = ['食神', '伤官', '偏财', '正财', '七杀', '正官']

export function getBangShenSet(): Set<TenGodName> { return new Set(TENGOD_BANGSHEN) }
export function getGongShenSet(): Set<TenGodName> { return new Set(TENGOD_GONGSHEN) }

function godIn(arr: TenGodName[] | undefined, names: TenGodName[]): boolean {
  if (!arr || arr.length === 0) return false
  return names.some(n => arr.includes(n))
}

function combinationSatisfied(
  verdicts: CombinationVerdict[] | undefined,
  combinationIds: string[],
): boolean {
  if (!verdicts || verdicts.length === 0) return false
  return verdicts.some(v => combinationIds.includes(v.id) && v.satisfied)
}

export function extractPatternCategory(
  verdict: GejuVerdict | undefined
): '七杀' | '伤官' | '财' | '印' | null {
  if (!verdict?.name) return null
  const n = verdict.name
  if (n.includes('七杀格')) return '七杀'
  if (n.includes('伤官格')) return '伤官'
  if (n.includes('偏财格') || n.includes('正财格') || n.startsWith('真从-从财格') || n.startsWith('假从-假从财')) return '财'
  if (n.includes('正印格') || n.includes('偏印格')) return '印'
  return null
}

export function extractDayStrength(
  patternVerdictConfidence: number,
  distribution?: TenGodDistribution,
  dayStrengthArg?: number,
  dayRootCountArg?: number,
): '强' | '弱' {
  const bangCount = TENGOD_BANGSHEN.reduce((acc, g) => acc + (distribution?.perGod?.[g] || 0), 0)
  const gongCount = TENGOD_GONGSHEN.reduce((acc, g) => acc + (distribution?.perGod?.[g] || 0), 0)
  const roots = (dayRootCountArg ?? 0)
  const ds = (typeof dayStrengthArg === 'number' ? dayStrengthArg : 0.5)
  // 综合 3 个因素
  const score =
    +(bangCount >= gongCount ? 1 : 0) * 0.4 +
    +(roots >= 2 ? 1 : roots === 1 ? 0.5 : 0) * 0.35 +
    Math.max(0, Math.min(1, (ds - 0.2) / 0.6)) * 0.25
  return score >= 0.5 ? '强' : '弱'
}

export function inferCategoryFromTenGods(args: {
  distribution?: TenGodDistribution
  wangGods?: TenGodName[]
  weakGods?: TenGodName[]
}): '七杀' | '伤官' | '财' | '印' | null {
  const dist = args.distribution
  const wang = args.wangGods || dist?.dominantGods || []
  const counts = dist?.perGod || ({} as Record<TenGodName, number>)
  const tgFlags = dist?.tianGanFlags || ({} as Partial<Record<TenGodName, true>>)
  const C = (g: TenGodName) => counts[g] || 0
  const T = (g: TenGodName) => (tgFlags[g] ? 1 : 0)

  const biJie = C('比肩') + C('劫财')
  const shiShang = C('食神') + C('伤官')
  const cai = C('正财') + C('偏财')
  const guanSha = C('七杀') + C('正官')
  const yin = C('正印') + C('偏印')
  const shi = C('食神'), sg = C('伤官'), guan = C('正官'), sha = C('七杀')
  const zy = C('正印'), py = C('偏印'), zc = C('正财'), pc = C('偏财')

  const wangSet = new Set(wang)
  const inWang = (...gs: TenGodName[]) => gs.some(g => wangSet.has(g))

  // 天干透出的主族（每个天干透出计 3 分，每个旺神计 3 分，常规计数计 1 分）
  const S = (...gs: TenGodName[]) =>
    gs.reduce((s, g) => s + C(g) + T(g) * 3 + (wangSet.has(g) ? 3 : 0), 0)
  const score = {
    qiSha: S('七杀', '正官'),
    shang: S('食神', '伤官'),
    cai: S('正财', '偏财'),
    yin: S('正印', '偏印'),
    bijie: S('比肩', '劫财'),
  }

  // 命例特化：根据"格局专用规则"识别（天干透出优先，十神组合其次）
  // --------------------------------------------------------------
  // 1) 伤官见官：伤官+正官都透出天干或旺神，且伤官格家族得分不低于官杀家族0.7倍
  const sgTG = T('伤官') || inWang('伤官')
  const guanTG = T('正官') || inWang('正官')
  if (sgTG && guanTG && (sg + shi) * 0.7 >= (sha * 0.5 + guan)) return '伤官'
  if (T('伤官') >= 1 && T('正官') >= 1) return '伤官'

  // 2) 七杀制化组合：七杀透出天干或旺神 + 食神/印 透出
  const shaTG = T('七杀') || inWang('七杀')
  const shiTG = T('食神') || inWang('食神')
  const yinTG = T('正印') || T('偏印') || inWang('正印') || inWang('偏印')
  if (shaTG && shiTG) return '七杀'
  if (shaTG && yinTG && guanSha >= 2) return '七杀'
  // 注意：正官+印 ≠ 七杀格（官印相生→更适合归类到印格或不特判，交给后面的族类得分），所以这里必须严格要求“七杀”透
  if (T('七杀') && (T('食神') || T('正印') || T('偏印'))) return '七杀'

  // 2.5) 伤官生财（伤官透 + 财透）：伤官格（但如果财比食伤族显著更强（>= 1.2 倍），则归财格）
  const shangTG = T('伤官') || inWang('伤官')
  const caiTG2 = T('正财') || T('偏财') || inWang('正财') || inWang('偏财')
  if (shangTG && caiTG2 && sg >= 1 && (sg + shi) * 1.2 >= (zc + pc)) return '伤官'
  // 伤官配印：伤官透+印透（即使见官也先归伤官格待配印分析）
  if (shangTG && yinTG && (sg + shi) >= 2) return '伤官'

  // 3) 财配官：正财/偏财透出，且七杀/正官透出（财官相生）→ 财格
  const caiTG = T('正财') || T('偏财') || inWang('正财') || inWang('偏财')
  const guanOrShaTG = T('正官') || T('七杀') || inWang('正官') || inWang('七杀')
  if (caiTG && guanOrShaTG && cai >= 2) return '财'

  // 4) 印旺为忌：印族得分最高，且比劫弱（日主弱）
  if (score.yin >= 8 && biJie <= 2 && score.yin >= score.cai && score.yin >= score.guanSha) return '印'

  // 5) 财旺：财族得分最高
  if (score.cai >= 8 && score.cai >= score.shang * 0.9 && score.cai >= score.qiSha * 0.9 && score.cai >= score.yin * 0.9) return '财'

  // 6) 七杀：官杀族得分最高
  if (score.qiSha >= 8 && score.qiSha >= score.shang * 0.9 && score.qiSha >= score.cai * 0.9 && score.qiSha >= score.yin * 0.9) return '七杀'

  // 7) 伤官：食伤族得分最高
  if (score.shang >= 8 && score.shang >= score.cai * 0.9 && score.shang >= score.qiSha * 0.9 && score.shang >= score.yin * 0.9) return '伤官'

  // 8) Fallback：比较四类（七杀/伤官/财/印）得分，≥8 才判
  const pairs: Array<{ c: '七杀' | '伤官' | '财' | '印'; n: number }> = [
    { c: '七杀', n: score.qiSha },
    { c: '伤官', n: score.shang },
    { c: '财', n: score.cai },
    { c: '印', n: score.yin },
  ]
  pairs.sort((a, b) => b.n - a.n)
  if (pairs[0].n >= 6) return pairs[0].c
  return null
}

export function classifyPriorityMatrix(args: {
  patternVerdict?: GejuVerdict
  patternCategory?: '七杀' | '伤官' | '财' | '印' | null
  distribution?: TenGodDistribution
  wangGods?: TenGodName[]
  weakGods?: TenGodName[]
  combinationVerdicts?: CombinationVerdict[]
  dayStrength?: number
  dayRootCount?: number
}): PriorityMatrixResult {
  let category = args.patternCategory ?? extractPatternCategory(args.patternVerdict)
  if (!category) {
    category = inferCategoryFromTenGods({
      distribution: args.distribution, wangGods: args.wangGods, weakGods: args.weakGods,
    })
  }
  const hits: PriorityMatrixEntry[] = []
  if (!category) {
    const hitsList = FUSION_MATRIX_RULES.filter(r => r.tag === 'unknown')
    return {
      hits: hitsList,
      dominant: hitsList[0],
      totalWeight: 0,
      favorableWeight: 0,
      unfavorableWeight: 0,
    }
  }

  const wangGods = args.wangGods || args.distribution?.dominantGods || []
  const dist = args.distribution
  const combos = args.combinationVerdicts || []
  const strongOrWeak = extractDayStrength(
    args.patternVerdict?.confidence ?? 0.5,
    dist,
    args.dayStrength,
    args.dayRootCount
  )
  const bangSet = getBangShenSet()
  const hasYin = godIn(wangGods, ['正印', '偏印']) ||
    (dist?.tianGanFlags?.['正印'] || dist?.tianGanFlags?.['偏印'])
  const hasShiShen = godIn(wangGods, ['食神']) || dist?.tianGanFlags?.['食神']
  const hasShangGuan = godIn(wangGods, ['伤官']) || dist?.tianGanFlags?.['伤官']
  const hasCai = godIn(wangGods, ['正财', '偏财']) || dist?.tianGanFlags?.['正财'] || dist?.tianGanFlags?.['偏财']
  const hasGuan = godIn(wangGods, ['正官']) || dist?.tianGanFlags?.['正官']
  const hasSha = godIn(wangGods, ['七杀']) || dist?.tianGanFlags?.['七杀']
  // 七杀类组合：即便 combination verdict 命中，也要求实际“杀/印/食”都有明显存在（天干透出 or 旺神），避免只有微量藏干的误触发
  const hasShaYinShengReal = combinationSatisfied(combos, ['shaYinXiangSheng']) && hasSha && hasYin
  const hasShiShenZhiShaReal = combinationSatisfied(combos, ['shiShenZhiSha']) && hasSha && hasShiShen
  const hasShangGuanJianGuanReal = combinationSatisfied(combos, ['shangGuJianGuan', 'shiShangJianGuan']) && hasShangGuan && hasGuan
  // 伤官配印近似：伤官 + 印（且印明显存在），官非必须
  const hasGuanYinXiangShengReal = combinationSatisfied(combos, ['guanYinXiangSheng']) || false
  const hasShangGuanPeiYinReal = (hasShangGuan && hasYin) && ( // 伤官 + 印明确存在
    hasGuanYinXiangShengReal || !hasGuan
  )
  const hasShiShangShengCaiReal = combinationSatisfied(combos, ['shiShangShengCai']) && (hasShangGuan || hasShiShen) && hasCai
  const hasCaiGuanShengReal = combinationSatisfied(combos, ['caiGuanShuangMei']) && hasCai && (hasGuan || hasSha)
  let hasYinWangShenRuo = false
  if (category === '印') {
    const yinCount = (dist?.perGod?.['正印'] || 0) + (dist?.perGod?.['偏印'] || 0)
    const rootCnt = args.dayRootCount ?? 0
    if (yinCount >= 3 && strongOrWeak === '弱' && rootCnt <= 1) hasYinWangShenRuo = true
  }

  const push = (tag: PatternTag) => {
    const r = FUSION_MATRIX_RULES.find(r => r.tag === tag)
    if (r && !hits.find(h => h.tag === tag)) hits.push(r)
  }

  if (category === '七杀') {
    const shaCount = ((dist?.perGod?.['七杀'] || 0) + (dist?.perGod?.['正官'] || 0) * 0.6)
    const yinCount = ((dist?.perGod?.['正印'] || 0) + (dist?.perGod?.['偏印'] || 0))
    const shiCount = (dist?.perGod?.['食神'] || 0)
    // 食神制杀：食神力量 ≥ 杀 * 0.4（食神能担住制杀任务），且 hasYin/hasShiShen 明确为真（避免微量藏干误触）
    const canShiZhi = hasShiShenZhiShaReal || (hasSha && hasShiShen && shiCount >= Math.max(1, shaCount * 0.4))
    // 杀印相生：印力量 ≥ 杀 * 0.4（印足以化杀），且 hasYin 真
    const canYinHua = hasShaYinShengReal || (hasSha && hasYin && yinCount >= Math.max(1, shaCount * 0.4))
    // 明确命中组合优先
    if (canShiZhi && (shiCount * 1.15 >= yinCount || !canYinHua)) {
      push('qi-shi-zhi-sha')
    }
    if (canYinHua && (!canShiZhi || yinCount * 1.1 >= shiCount)) {
      push('qi-sha-yin-xiang-sheng')
    }
    // 七杀成格的基础
    if (hasSha) push('qi-sha-wang')
    const hasZhi = canShiZhi || canYinHua
    // 杀旺无制：只有少许印/食神（不足以化杀）
    if (hasSha && !hasZhi) {
      push('qi-sha-wu-zhi')
    } else if (hasSha && hasZhi) {
      // 即使有制化，如果七杀远强于制化力量（杀>=制化*2.2），仍然保留杀旺无制作为负向冲突项
      const zhiLi = shiCount + yinCount
      if (shaCount >= Math.max(3, zhiLi * 2.2)) {
        push('qi-sha-wu-zhi')
      }
    }
  } else if (category === '伤官') {
    const sgCount = (dist?.perGod?.['伤官'] || 0) + (dist?.perGod?.['食神'] || 0) * 0.6
    const guanCount = (dist?.perGod?.['正官'] || 0)
    const yinCount = ((dist?.perGod?.['正印'] || 0) + (dist?.perGod?.['偏印'] || 0))
    const caiCount = ((dist?.perGod?.['正财'] || 0) + (dist?.perGod?.['偏财'] || 0))
    // 伤官见官：伤官+正官都有 → 必记录（即使有印，也作为潜在冲突），若印不足则明确冲突
    const bothSG = hasShangGuanJianGuanReal || (hasShangGuan && hasGuan)
    const enoughYin = yinCount >= Math.max(1, Math.min(sgCount, guanCount) * 0.6) && hasYin
    if (bothSG) {
      // 伤官见官 ALWAYS 记录作为 hits 之一，便于冲突分析；若印不足，则它是负面主结构
      push('shang-guan-jian-guan')
    }
    // 伤官配印：伤官+印，且不见官（或见官但印强到足以压制）
    const hasPeiYin = hasShangGuanPeiYinReal
    if (hasPeiYin && (!hasGuan || enoughYin)) {
      push('shang-guan-pei-yin')
    }
    // 伤官生财：伤官+财 → 记为吉结构
    if ((hasShiShangShengCaiReal || (hasShangGuan && hasCai)) && caiCount >= 1) {
      push('shang-guan-sheng-cai')
    }
  } else if (category === '财') {
    if (hasCaiGuanShengReal || (hasCai && (hasGuan || hasSha))) push('cai-guan-xiang-sheng')
    if (strongOrWeak === '强' && hasCai) push('cai-wang-shen-qiang')
    if (strongOrWeak === '弱' && hasCai) push('cai-wang-shen-ruo')
  } else if (category === '印') {
    if (hasYinWangShenRuo) push('yin-wang-shen-ruo')
  }

  if (hits.length === 0) {
    const unk = FUSION_MATRIX_RULES.find(r => r.tag === 'unknown')!
    hits.push(unk)
  }
  hits.sort((a, b) => Math.abs(b.baseWeight) - Math.abs(a.baseWeight))
  const dominant = hits[0]
  const favorableWeight = hits.filter(r => r.favorable).reduce((s, r) => s + r.baseWeight, 0)
  const unfavorableWeight = hits.filter(r => !r.favorable).reduce((s, r) => s + r.baseWeight, 0)
  const totalWeight = favorableWeight + unfavorableWeight
  return {
    hits,
    dominant,
    totalWeight,
    favorableWeight,
    unfavorableWeight,
  }
}

export { TENGOD_TO_WUXING_JIA_RI }
