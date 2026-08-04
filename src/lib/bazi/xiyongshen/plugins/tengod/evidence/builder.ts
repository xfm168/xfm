import type {
  TenGodName,
  Wuxing,
  TenGodClassifierInput,
  TenGodDistribution,
  CombinationVerdict,
  TenGodEvidenceStep,
  TenGodEvidenceReport,
} from '../types'
import { defaultTenGodCitationsDB, type TenGodCitationEntry } from '../citations/citationsDB'
import { formatCitation } from './citationFormat'

export type TenGodEvidenceKind =
  | 'tianGan' | 'diZhi' | 'cangGan' | 'tongGen'
  | 'wangShuai' | 'yueLing' | 'geJu' | 'guJi' | 'zuHe'

export const EVIDENCE_KIND_LABELS: Record<TenGodEvidenceKind, string> = {
  tianGan: '天干十神依据',
  diZhi: '地支本气十神依据',
  cangGan: '藏干十神依据',
  tongGen: '通根依据',
  wangShuai: '旺衰依据',
  yueLing: '月令依据',
  geJu: '格局组合依据',
  guJi: '古籍引证依据',
  zuHe: '组合判定依据',
}

export interface ExtendedTenGodEvidence extends TenGodEvidenceStep {
  kind: TenGodEvidenceKind
  title: string
  weight: number
  tenGodNames?: TenGodName[]
  classicCode?: string
  citationId?: string
}

export interface ExtendedTenGodEvidenceReport extends TenGodEvidenceReport {
  evidences: ExtendedTenGodEvidence[]
  byKind: Record<TenGodEvidenceKind, ExtendedTenGodEvidence[]>
  perGodEvidence: Record<TenGodName, { positive: number; negative: number; net: number }>
  summaryText: string
}

const TEN_GODS: TenGodName[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']

const CANG_GAN_TABLE: Record<string, Array<{ gan: string; wx: Wuxing; qi: 'ben' | 'zhong' | 'yu' }>> = {
  '子': [{ gan: '癸', wx: '水', qi: 'ben' }],
  '丑': [{ gan: '己', wx: '土', qi: 'ben' }, { gan: '癸', wx: '水', qi: 'zhong' }, { gan: '辛', wx: '金', qi: 'yu' }],
  '寅': [{ gan: '甲', wx: '木', qi: 'ben' }, { gan: '丙', wx: '火', qi: 'zhong' }, { gan: '戊', wx: '土', qi: 'yu' }],
  '卯': [{ gan: '乙', wx: '木', qi: 'ben' }],
  '辰': [{ gan: '戊', wx: '土', qi: 'ben' }, { gan: '乙', wx: '木', qi: 'zhong' }, { gan: '癸', wx: '水', qi: 'yu' }],
  '巳': [{ gan: '丙', wx: '火', qi: 'ben' }, { gan: '庚', wx: '金', qi: 'zhong' }, { gan: '戊', wx: '土', qi: 'yu' }],
  '午': [{ gan: '丁', wx: '火', qi: 'ben' }, { gan: '己', wx: '土', qi: 'zhong' }],
  '未': [{ gan: '己', wx: '土', qi: 'ben' }, { gan: '丁', wx: '火', qi: 'zhong' }, { gan: '乙', wx: '木', qi: 'yu' }],
  '申': [{ gan: '庚', wx: '金', qi: 'ben' }, { gan: '壬', wx: '水', qi: 'zhong' }, { gan: '戊', wx: '土', qi: 'yu' }],
  '酉': [{ gan: '辛', wx: '金', qi: 'ben' }],
  '戌': [{ gan: '戊', wx: '土', qi: 'ben' }, { gan: '辛', wx: '金', qi: 'zhong' }, { gan: '丁', wx: '火', qi: 'yu' }],
  '亥': [{ gan: '壬', wx: '水', qi: 'ben' }, { gan: '甲', wx: '木', qi: 'zhong' }],
}

const WUXING_TO_GAN: Record<Wuxing, { yang: string; yin: string }> = {
  '木': { yang: '甲', yin: '乙' },
  '火': { yang: '丙', yin: '丁' },
  '土': { yang: '戊', yin: '己' },
  '金': { yang: '庚', yin: '辛' },
  '水': { yang: '壬', yin: '癸' },
}

const GAN_YINYANG: Record<string, '阳' | '阴'> = {
  '甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳',
  '己': '阴', '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴',
}

const GAN_WUXING: Record<string, Wuxing> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

const ZHI_WUXING: Record<string, Wuxing> = {
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
}

function computeTenGod(dayGan: string, targetGan: string): TenGodName | null {
  const dayYy = GAN_YINYANG[dayGan]
  const targetYy = GAN_YINYANG[targetGan]
  const dayWx = GAN_WUXING[dayGan]
  const targetWx = GAN_WUXING[targetGan]
  if (!dayYy || !targetYy || !dayWx || !targetWx) return null
  const sameYy = dayYy === targetYy
  const shengKe: Record<Wuxing, { sheng: Wuxing; ke: Wuxing; beiSheng: Wuxing; beiKe: Wuxing }> = {
    '木': { sheng: '火', ke: '土', beiSheng: '水', beiKe: '金' },
    '火': { sheng: '土', ke: '金', beiSheng: '木', beiKe: '水' },
    '土': { sheng: '金', ke: '水', beiSheng: '火', beiKe: '木' },
    '金': { sheng: '水', ke: '木', beiSheng: '土', beiKe: '火' },
    '水': { sheng: '木', ke: '火', beiSheng: '金', beiKe: '土' },
  }
  const rel = shengKe[dayWx]
  if (targetWx === dayWx) return sameYy ? '比肩' : '劫财'
  if (targetWx === rel.sheng) return sameYy ? '食神' : '伤官'
  if (targetWx === rel.ke) return sameYy ? '偏财' : '正财'
  if (targetWx === rel.beiKe) return sameYy ? '七杀' : '正官'
  if (targetWx === rel.beiSheng) return sameYy ? '偏印' : '正印'
  return null
}

const clampW = (w: number) => Math.max(-10, Math.min(10, w))

export class TenGodEvidenceBuilder {
  build(
    input: TenGodClassifierInput,
    distribution: TenGodDistribution,
    verdicts: CombinationVerdict[],
  ): ExtendedTenGodEvidenceReport {
    const evidences: ExtendedTenGodEvidence[] = []
    let stepCounter = 0
    const nextStepId = () => `ev_${++stepCounter}`

    const dayGan = input.dayGan || '甲'
    const monthZhi = input.monthZhi || '寅'
    const fourPillars = input.fourPillars || []
    const pillarNames = ['年柱', '月柱', '日柱', '时柱']
    const zhiNames = ['年支', '月支', '日支', '时支']

    // ===== tianGan: 4 pieces =====
    for (let i = 0; i < 4; i++) {
      const pillar = fourPillars[i]
      const gan = pillar?.gan || ''
      if (!gan) continue
      const tg = i === 2 ? '日主（比肩/劫财本体）' : computeTenGod(dayGan, gan)
      const tgName = typeof tg === 'string' ? tg : (tg ?? '未定')
      const isJiShen = ['七杀', '伤官', '偏印', '劫财'].includes(tgName as TenGodName)
      const weight = i === 2 ? 5 : clampW(isJiShen ? -3 : 3)
      const tenGodList: TenGodName[] = i === 2
        ? [dayGan && GAN_YINYANG[dayGan] === '阳' ? '比肩' : '劫财']
        : (tgName as TenGodName) ? [tgName as TenGodName] : []
      evidences.push({
        stepId: nextStepId(),
        stepName: `${pillarNames[i]}天干`,
        kind: 'tianGan',
        title: `${pillarNames[i]}天干 ${gan}${GAN_WUXING[gan] ?? ''} = ${tgName}`,
        text: `${pillarNames[i]}天干为${gan}（${GAN_WUXING[gan] ?? '？'}五行），相对于日主${dayGan}，定为${tgName}。`,
        satisfied: true,
        weight,
        tenGodNames: tenGodList,
      })
    }

    // ===== diZhi: 4 pieces =====
    for (let i = 0; i < 4; i++) {
      const pillar = fourPillars[i]
      const zhi = pillar?.zhi || ''
      if (!zhi) continue
      const zhiWx = ZHI_WUXING[zhi] ?? pillar?.zhiWx
      const cangList = CANG_GAN_TABLE[zhi] || []
      const benGan = cangList[0]?.gan ?? ''
      const benTenGod = i === 2 ? '日支（配偶宫）' : (benGan ? computeTenGod(dayGan, benGan) : null)
      const benTGName = typeof benTenGod === 'string' ? benTenGod : (benTenGod ?? '未定')
      const isMonthLing = i === 1
      const isJiShen = ['七杀', '伤官', '偏印', '劫财'].includes(benTGName as TenGodName)
      const base = isMonthLing ? 6 : 4
      const weight = clampW(isJiShen ? -base : base)
      const tenGodList: TenGodName[] = (benTGName && benTGName !== '日支（配偶宫）') ? [benTGName as TenGodName] : []
      evidences.push({
        stepId: nextStepId(),
        stepName: `${zhiNames[i]}本气`,
        kind: 'diZhi',
        title: `${zhiNames[i]}${zhi}${zhiWx ?? ''} 本气藏干${benGan} = ${benTGName}${isMonthLing ? '（月令）' : ''}`,
        text: `${zhiNames[i]}为${zhi}，本气藏干为${benGan}（${cangList[0]?.wx ?? ''}），相对于日主${dayGan}定为${benTGName}。${isMonthLing ? '此为月令提纲，权重加倍。' : ''}`,
        satisfied: true,
        weight,
        tenGodNames: tenGodList,
      })
    }

    // ===== cangGan: ≥8 pieces =====
    for (let i = 0; i < 4; i++) {
      const pillar = fourPillars[i]
      const zhi = pillar?.zhi || ''
      if (!zhi) continue
      const cangList = CANG_GAN_TABLE[zhi] || []
      for (const cg of cangList) {
        const cgTG = computeTenGod(dayGan, cg.gan)
        if (!cgTG) continue
        const qiLabel = cg.qi === 'ben' ? '本气' : cg.qi === 'zhong' ? '中气' : '余气'
        const weightBase = cg.qi === 'ben' ? 3 : cg.qi === 'zhong' ? 2 : 1
        const isJiShen = ['七杀', '伤官', '偏印', '劫财'].includes(cgTG)
        const weight = clampW(isJiShen ? -weightBase : weightBase)
        evidences.push({
          stepId: nextStepId(),
          stepName: `${zhiNames[i]}${qiLabel}藏干`,
          kind: 'cangGan',
          title: `${zhiNames[i]}${zhi} ${qiLabel}藏干${cg.gan}${cg.wx} = ${cgTG}`,
          text: `${zhiNames[i]}${zhi}藏有${qiLabel}干${cg.gan}（${cg.wx}），相对于日主${dayGan}定为${cgTG}。权重：${qiLabel}×${weightBase}。`,
          satisfied: true,
          weight,
          tenGodNames: [cgTG],
        })
      }
    }

    // ===== tongGen: per ten god if tongGen strength>0 =====
    const tongGenMap: Record<TenGodName, number> = {} as any
    for (const rec of distribution.perColumn) {
      if (rec.tenGod && rec.position.includes('支')) {
        tongGenMap[rec.tenGod] = (tongGenMap[rec.tenGod] ?? 0) + rec.weight
      }
    }
    for (const tg of TEN_GODS) {
      const tgTongGen = tongGenMap[tg] ?? 0
      if (tgTongGen > 0) {
        const strong = tgTongGen >= 2
        const isJiShen = ['七杀', '伤官', '偏印', '劫财'].includes(tg)
        const weight = clampW((isJiShen ? -1 : 1) * (strong ? 6 : 3))
        evidences.push({
          stepId: nextStepId(),
          stepName: `${tg}通根`,
          kind: 'tongGen',
          title: `${tg} 通根强度 = ${tgTongGen.toFixed(1)}（${strong ? '根深' : '根浅'}）`,
          text: `${tg}在地支中有${tgTongGen.toFixed(1)}点通根力量${strong ? '，根基深厚，力量扎实。' : '，根气微弱，虚浮不实。'}`,
          satisfied: true,
          weight,
          tenGodNames: [tg],
        })
      }
    }

    // ===== wangShuai: 3+ pieces =====
    const dominant = distribution.dominantGods ?? []
    const weak = distribution.weakGods ?? []
    const perGod = distribution.perGod ?? {}
    const total = Object.values(perGod).reduce((s, v) => s + v, 0) || 1
    if (dominant.length > 0) {
      const names = dominant.join('、')
      evidences.push({
        stepId: nextStepId(),
        stepName: '旺神判定',
        kind: 'wangShuai',
        title: `旺神（强）：${names}`,
        text: `八字中${names}出现次数多、权重大，为命局主导旺神。旺神合计占比：${dominant.reduce((s, g) => s + (perGod[g] ?? 0), 0) / total * 100 | 0}%。`,
        satisfied: true,
        weight: 8,
        tenGodNames: dominant,
      })
    }
    if (weak.length > 0) {
      const names = weak.join('、')
      evidences.push({
        stepId: nextStepId(),
        stepName: '衰神判定',
        kind: 'wangShuai',
        title: `衰神（弱）：${names}`,
        text: `八字中${names}出现次数少、权重小，为命局衰弱之神。衰神合计占比：${weak.reduce((s, g) => s + (perGod[g] ?? 0), 0) / total * 100 | 0}%。`,
        satisfied: true,
        weight: -5,
        tenGodNames: weak,
      })
    }
    const allGods = TEN_GODS.filter(g => !dominant.includes(g) && !weak.includes(g) && (perGod[g] ?? 0) > 0)
    if (allGods.length > 0) {
      const names = allGods.join('、')
      evidences.push({
        stepId: nextStepId(),
        stepName: '中神判定',
        kind: 'wangShuai',
        title: `中神（平衡）：${names}`,
        text: `八字中${names}力量适中，不偏旺也不衰弱，为命局中和平衡之神。`,
        satisfied: true,
        weight: 3,
        tenGodNames: allGods,
      })
    }
    if (allGods.length === 0 && dominant.length + weak.length > 0) {
      evidences.push({
        stepId: nextStepId(),
        stepName: '旺衰概述',
        kind: 'wangShuai',
        title: '命局旺衰分明，无中和过渡',
        text: `命局十神分布两极分化：${dominant.length}个旺神对${weak.length}个衰神，缺少中间力量的平衡过渡。`,
        satisfied: false,
        weight: -4,
      })
    }

    // ===== yueLing: 1-2 pieces =====
    const monthBenQiTG: TenGodName | null = (() => {
      const monthZhiCang = CANG_GAN_TABLE[monthZhi]
      if (!monthZhiCang || monthZhiCang.length === 0) return null
      return computeTenGod(dayGan, monthZhiCang[0].gan)
    })()
    const monthBonus = distribution.hasMonthZhiBenQi ?? {}
    const monthBonusTGs = Object.entries(monthBonus).filter(([, v]) => v).map(([k]) => k as TenGodName)
    if (monthBenQiTG) {
      const got = monthBonusTGs.length > 0 || distribution.perGod[monthBenQiTG] >= 2
      const weight = clampW(got ? 7 : -3)
      const names = monthBonusTGs.length > 0 ? monthBonusTGs.join('、') : monthBenQiTG
      evidences.push({
        stepId: nextStepId(),
        stepName: '月令得令判定',
        kind: 'yueLing',
        title: got ? `月令得令：${names}（旺于月令）` : `月令失令：${monthBenQiTG}未得月令助力`,
        text: got
          ? `月支${monthZhi}本气为${monthBenQiTG}，该十神${names}得月令提纲之气，力量加成，是为得令。`
          : `月支${monthZhi}本气为${monthBenQiTG}，但该十神在命局中未得其他助力，虽得令但气势不足。`,
        satisfied: got,
        weight,
        tenGodNames: monthBonusTGs.length > 0 ? monthBonusTGs : [monthBenQiTG],
      })
    } else {
      evidences.push({
        stepId: nextStepId(),
        stepName: '月令判定',
        kind: 'yueLing',
        title: `月令${monthZhi}参与命局分析`,
        text: `月令为${monthZhi}（${ZHI_WUXING[monthZhi] ?? ''}），为八字提纲，主导整体命局旺衰判定。`,
        satisfied: true,
        weight: 3,
      })
    }
    if (input.dayStrength !== undefined) {
      const ds = input.dayStrength
      const label = ds >= 2 ? '身强' : ds >= 0 ? '身偏强' : ds >= -2 ? '身偏弱' : '身弱'
      evidences.push({
        stepId: nextStepId(),
        stepName: '日主强弱辅助月令',
        kind: 'yueLing',
        title: `日主旺度分：${ds}（${label}）`,
        text: `结合月令与通根判定，日主${dayGan}综合强弱为：${label}（分值${ds}/±3）。月令是判定日主强弱的首要依据。`,
        satisfied: true,
        weight: clampW(Math.abs(ds) * 2),
      })
    }

    // ===== geJu: 1-2 pieces =====
    const favorable = verdicts.filter(v => v.favorable && v.satisfied).sort((a, b) => b.score - a.score)
    const unfavorable = verdicts.filter(v => !v.favorable && v.satisfied).sort((a, b) => b.score - a.score)
    const topFav = favorable[0]
    const topUnfav = unfavorable[0]
    if (topFav) {
      evidences.push({
        stepId: nextStepId(),
        stepName: '吉格局主',
        kind: 'geJu',
        title: `主导吉格：【${topFav.name}】（置信${(topFav.confidence * 100).toFixed(0)}%，得分${topFav.score}）`,
        text: `${topFav.name}属于${topFav.category ?? ''}，满足条件${topFav.hits}/${topFav.required}条：${topFav.hitConditions.join('；')}。结论：${topFav.outcome ?? ''}`,
        satisfied: true,
        weight: clampW(Math.round(topFav.weight * topFav.confidence * 1.5)),
        tenGodNames: topFav.id.includes('guan') ? ['正官'] : topFav.id.includes('sha') || topFav.id.includes('Qi') ? ['七杀'] : topFav.id.includes('shi') || topFav.id.includes('Shang') ? ['食神', '伤官'] : [],
      })
    }
    if (topUnfav) {
      evidences.push({
        stepId: nextStepId(),
        stepName: '凶格局主',
        kind: 'geJu',
        title: `需注意凶格：【${topUnfav.name}】（得分${topUnfav.score}）`,
        text: `${topUnfav.name}属于${topUnfav.category ?? ''}，命中条件${topUnfav.hits}/${topUnfav.required}条：${topUnfav.hitConditions.join('；')}。需留意：${topUnfav.outcome ?? ''}`,
        satisfied: false,
        weight: clampW(-Math.round(topUnfav.weight * topUnfav.confidence * 1.5)),
      })
    }
    if (!topFav && !topUnfav) {
      evidences.push({
        stepId: nextStepId(),
        stepName: '格局概述',
        kind: 'geJu',
        title: '命局未形成明显的吉凶组合格局',
        text: '综合十神分布，命局暂无得分较高的吉格或凶格显现，以常规十神旺衰与流通分析为主。',
        satisfied: true,
        weight: 1,
      })
    }

    // ===== guJi: 2+ citations =====
    const citDB = defaultTenGodCitationsDB
    const dominantForCite: TenGodName[] = dominant.length > 0 ? dominant : (TEN_GODS.filter(g => (perGod[g] ?? 0) > 0).slice(0, 3) as TenGodName[])
    let gujiCount = 0
    const usedCiteIds = new Set<string>()
    for (const tg of dominantForCite) {
      if (gujiCount >= 4) break
      const cits = citDB.byTenGod(tg)
      for (const cit of cits) {
        if (gujiCount >= 4) break
        if (usedCiteIds.has(cit.citationId)) continue
        usedCiteIds.add(cit.citationId)
        const isFavorable = !['七杀', '伤官', '偏印', '劫财'].includes(tg)
        evidences.push({
          stepId: nextStepId(),
          stepName: `古籍引证${gujiCount + 1}`,
          kind: 'guJi',
          title: `【${cit.classicName}】${cit.chapter}·关于「${tg}」`,
          text: `原文：${cit.originalText}\n释义：${cit.interpretation}`,
          satisfied: true,
          weight: clampW(isFavorable ? 3 : 2),
          tenGodNames: cit.tenGodNames,
          classicCode: cit.classicCode,
          citationId: cit.citationId,
          citation: formatCitation(cit.classicName, `${cit.chapter}§${cit.paragraph}`, cit.originalText),
        })
        gujiCount++
        break
      }
    }
    // Also add by combination if applicable
    for (const v of favorable.slice(0, 1)) {
      if (gujiCount >= 4) break
      const combCits = citDB.byCombination(v.id)
      for (const cit of combCits) {
        if (usedCiteIds.has(cit.citationId)) continue
        usedCiteIds.add(cit.citationId)
        evidences.push({
          stepId: nextStepId(),
          stepName: `吉格古籍引证`,
          kind: 'guJi',
          title: `【${cit.classicName}】关于组合「${v.name}」`,
          text: `原文：${cit.originalText}\n释义：${cit.interpretation}`,
          satisfied: true,
          weight: 4,
          tenGodNames: cit.tenGodNames,
          classicCode: cit.classicCode,
          citationId: cit.citationId,
          citation: formatCitation(cit.classicName, `${cit.chapter}§${cit.paragraph}`, cit.originalText),
        })
        gujiCount++
        break
      }
    }
    if (gujiCount < 2) {
      const all = citDB.all().slice(0, 2)
      for (const cit of all) {
        if (usedCiteIds.has(cit.citationId)) continue
        usedCiteIds.add(cit.citationId)
        evidences.push({
          stepId: nextStepId(),
          stepName: `古籍总纲引证${gujiCount + 1}`,
          kind: 'guJi',
          title: `【${cit.classicName}】${cit.chapter}`,
          text: `原文：${cit.originalText}\n释义：${cit.interpretation}`,
          satisfied: true,
          weight: 2,
          classicCode: cit.classicCode,
          citationId: cit.citationId,
          citation: formatCitation(cit.classicName, `${cit.chapter}§${cit.paragraph}`, cit.originalText),
        })
        gujiCount++
      }
    }

    // ===== zuHe: per combinationVerdict one piece =====
    for (const v of verdicts) {
      const w = v.satisfied
        ? (v.favorable ? 1 : -1) * Math.round(v.score / 10 + v.weight * 0.5)
        : 0
      evidences.push({
        stepId: nextStepId(),
        stepName: `组合判定·${v.name}`,
        kind: 'zuHe',
        title: `${v.satisfied ? (v.favorable ? '✓ 吉格命中' : '✗ 凶格命中') : '○ 未命中'}：【${v.name}】`,
        text: `${v.name}（${v.category ?? ''}）：命中${v.hits}/${v.required}条。命中项：${v.hitConditions.join('、') || '无'}。缺失项：${v.missingConditions.join('、') || '无'}。结论：${v.outcome ?? ''}。综合得分：${v.score}。`,
        satisfied: v.satisfied ? v.favorable : true,
        weight: clampW(w),
      })
    }

    return this.buildNet({
      steps: evidences.map(e => ({
        stepId: e.stepId,
        stepName: e.stepName,
        text: e.text,
        satisfied: e.satisfied,
        citation: e.citation,
        weight: e.weight,
      })),
      evidences,
    } as any)
  }

  private buildNet(r: ExtendedTenGodEvidenceReport): ExtendedTenGodEvidenceReport {
    const kinds: TenGodEvidenceKind[] = ['tianGan', 'diZhi', 'cangGan', 'tongGen', 'wangShuai', 'yueLing', 'geJu', 'guJi', 'zuHe']
    const byKind = {} as Record<TenGodEvidenceKind, ExtendedTenGodEvidence[]>
    for (const k of kinds) byKind[k] = []
    for (const e of r.evidences) {
      if (byKind[e.kind]) byKind[e.kind].push(e)
    }

    const perGodEvidence = {} as Record<TenGodName, { positive: number; negative: number; net: number }>
    for (const tg of TEN_GODS) perGodEvidence[tg] = { positive: 0, negative: 0, net: 0 }
    for (const e of r.evidences) {
      const tgs = e.tenGodNames ?? []
      const share = tgs.length > 0 ? tgs.length : 1
      for (const tg of tgs) {
        const portion = e.weight / share
        if (portion > 0) perGodEvidence[tg].positive += portion
        else if (portion < 0) perGodEvidence[tg].negative += Math.abs(portion)
        perGodEvidence[tg].net += portion
      }
    }
    for (const tg of TEN_GODS) {
      perGodEvidence[tg].positive = Math.round(perGodEvidence[tg].positive * 10) / 10
      perGodEvidence[tg].negative = Math.round(perGodEvidence[tg].negative * 10) / 10
      perGodEvidence[tg].net = Math.round(perGodEvidence[tg].net * 10) / 10
    }

    const positiveWeight = r.evidences.filter(e => e.weight > 0).reduce((s, e) => s + e.weight, 0)
    const negativeWeight = Math.abs(r.evidences.filter(e => e.weight < 0).reduce((s, e) => s + e.weight, 0))
    const netWeight = positiveWeight - negativeWeight
    const totalPossible = positiveWeight + negativeWeight || 1
    const balanceScore = Math.max(0, Math.min(100, Math.round(50 + (netWeight / totalPossible) * 50)))

    const sat = r.evidences.filter(e => e.satisfied).length
    const unsat = r.evidences.length - sat
    const topPos = [...r.evidences].sort((a, b) => b.weight - a.weight).slice(0, 3).map(e => `${e.title}(+${e.weight})`).join('；')
    const topNeg = [...r.evidences].sort((a, b) => a.weight - b.weight).filter(e => e.weight < 0).slice(0, 2).map(e => `${e.title}(${e.weight})`).join('；')
    const summaryText = `共${r.evidences.length}条证据：满足${sat}条，不满足${unsat}条；正向权重+${positiveWeight}，负向权重-${negativeWeight}，净权重${netWeight}；综合平衡分${balanceScore}/100。最强正向：${topPos || '无'}${topNeg ? `；需注意：${topNeg}` : ''}。`

    return {
      ...r,
      steps: r.evidences.map(e => ({
        stepId: e.stepId,
        stepName: e.stepName,
        text: e.text,
        satisfied: e.satisfied,
        citation: e.citation,
        weight: e.weight,
      })),
      byKind,
      perGodEvidence,
      positiveWeight,
      negativeWeight,
      netWeight,
      balanceScore,
      summaryText,
    }
  }

  formatHumanReadable(r: ExtendedTenGodEvidenceReport): string {
    const kindOrder: TenGodEvidenceKind[] = [
      'yueLing', 'wangShuai', 'geJu',
      'tianGan', 'diZhi', 'cangGan', 'tongGen',
      'guJi', 'zuHe',
    ]
    const lines: string[] = []
    lines.push('# 十神证据链报告')
    lines.push('')
    lines.push('## 摘要')
    lines.push(`- 证据总数：${r.evidences.length} 条`)
    lines.push(`- 正向权重：+${r.positiveWeight}`)
    lines.push(`- 负向权重：-${r.negativeWeight}`)
    lines.push(`- 净权重：${r.netWeight}`)
    lines.push(`- 综合平衡分：${r.balanceScore}/100`)
    lines.push(`- 总结：${r.summaryText}`)
    lines.push('')
    lines.push('## 各十神证据净值')
    lines.push('')
    lines.push('| 十神 | 正向 | 负向 | 净值 |')
    lines.push('|------|------|------|------|')
    for (const tg of TEN_GODS) {
      const pg = r.perGodEvidence[tg]
      lines.push(`| ${tg} | +${pg.positive} | -${pg.negative} | ${pg.net >= 0 ? '+' : ''}${pg.net} |`)
    }
    lines.push('')
    lines.push('## 证据分类明细')
    lines.push('')
    for (const k of kindOrder) {
      const items = r.byKind[k] ?? []
      if (items.length === 0) continue
      lines.push(`### ${EVIDENCE_KIND_LABELS[k]}`)
      lines.push('')
      for (const e of items) {
        const sign = e.weight > 0 ? '+' : ''
        const mark = e.satisfied ? '✓' : '✗'
        lines.push(`- ${mark} **${e.title}** [${sign}${e.weight}]`)
        if (e.text) {
          const textLines = e.text.split('\n')
          for (const tl of textLines) lines.push(`  > ${tl}`)
        }
        if (e.classicCode) lines.push(`  > 来源：${e.classicCode}${e.citationId ? ' #' + e.citationId : ''}`)
      }
      lines.push('')
    }
    return lines.join('\n')
  }
}

export const defaultTenGodEvidenceBuilder = new TenGodEvidenceBuilder()

export { CANG_GAN_TABLE, computeTenGod }
