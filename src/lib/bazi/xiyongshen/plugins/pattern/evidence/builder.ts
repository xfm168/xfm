import type { Wuxing } from '../types'

export type EvidenceKind =
  | 'yueLing'
  | 'riZhu'
  | 'tianGan'
  | 'diZhi'
  | 'cangGan'
  | 'tongGen'
  | 'wangShuai'
  | 'tiaoHou'
  | 'guJi'
  | 'chengGe'
  | 'poGe'

export interface StructuredEvidence {
  id: string
  kind: EvidenceKind
  title: string
  description?: string
  satisfied: boolean
  weight: number
  source?: string
  classicCode?: string
  citationId?: string
}

export interface StructuredEvidenceReport {
  all: StructuredEvidence[]
  byKind: Record<EvidenceKind, StructuredEvidence[]>
  positiveWeight: number
  negativeWeight: number
  netWeight: number
  balanceScore: number
  summaryText: string
}

const WUXING_SEASON_MAP: Record<string, Wuxing> = {
  '寅': '木', '卯': '木',
  '巳': '火', '午': '火',
  '申': '金', '酉': '金',
  '亥': '水', '子': '水',
  '辰': '土', '戌': '土', '丑': '土', '未': '土',
}

const PATTERN_REQUIRED_SEASON: Record<string, Wuxing[]> = {
  '专旺-曲直格（木专旺）': ['木'],
  '专旺-炎上格（火专旺）': ['火'],
  '专旺-稼穑格（土专旺）': ['土'],
  '专旺-从革格（金专旺）': ['金'],
  '专旺-润下格（水专旺）': ['水'],
  '调候格': ['水', '火'],
}

const PATTERN_REQUIRED_DAYGAN: Record<string, string[]> = {
  '专旺-曲直格（木专旺）': ['甲', '乙'],
  '专旺-炎上格（火专旺）': ['丙', '丁'],
  '专旺-稼穑格（土专旺）': ['戊', '己'],
  '专旺-从革格（金专旺）': ['庚', '辛'],
  '专旺-润下格（水专旺）': ['壬', '癸'],
  '化气-甲己化土': ['甲', '己'],
  '化气-乙庚化金': ['乙', '庚'],
  '化气-丙辛化水': ['丙', '辛'],
  '化气-丁壬化木': ['丁', '壬'],
  '化气-戊癸化火': ['戊', '癸'],
}

export class StructuredEvidenceBuilder {
  build(
    input: any,
    verdict: { name: string; category: string; confidence: number },
    extra?: { chengGeHits?: string[]; poGeHits?: string[]; guJiCitations?: any[] }
  ): StructuredEvidenceReport {
    const evidences: StructuredEvidence[] = []
    let idCounter = 0
    const nextId = () => `ev_${++idCounter}`

    const dayGanWuxing: Wuxing = input.dayGanWuxing
    const monthZhiWuxing: Wuxing = input.monthZhiWuxing
    const count: Record<Wuxing, number> = input.count || { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
    const fourPillars: Array<{ gan: string; zhi: string; ganWx: Wuxing; zhiWx: Wuxing }> = input.fourPillars || []
    const dayStrength: number = input.dayStrength ?? 50
    const dayGan: string = input.dayGan || ''
    const monthZhi: string = input.monthZhi || ''
    const dayRootCount: number = input.dayRootCount ?? 0
    const isWinterBorn: boolean = input.isWinterBorn ?? false
    const isSummerBorn: boolean = input.isSummerBorn ?? false

    // yueLing evidence
    const requiredSeasons = PATTERN_REQUIRED_SEASON[verdict.name]
    if (requiredSeasons) {
      const seasonMatch = requiredSeasons.includes(monthZhiWuxing)
      evidences.push({
        id: nextId(),
        kind: 'yueLing',
        title: `月令为${monthZhi}${monthZhiWuxing}，${seasonMatch ? '符合' : '不符合'}${verdict.name}所需季节`,
        description: `格局${verdict.name}需要月令为${requiredSeasons.join('/')}，实际月令为${monthZhiWuxing}`,
        satisfied: seasonMatch,
        weight: seasonMatch ? 8 : -8,
        source: `monthZhi='${monthZhi}', monthZhiWuxing='${monthZhiWuxing}'`,
      })
    } else {
      evidences.push({
        id: nextId(),
        kind: 'yueLing',
        title: `月令为${monthZhi}${monthZhiWuxing}，参与格局判定`,
        description: `月令${monthZhiWuxing}为八字提纲，影响整体格局走向`,
        satisfied: true,
        weight: 3,
        source: `monthZhi='${monthZhi}', monthZhiWuxing='${monthZhiWuxing}'`,
      })
    }

    // riZhu evidence
    const requiredDayGan = PATTERN_REQUIRED_DAYGAN[verdict.name]
    if (requiredDayGan) {
      const dayGanMatch = requiredDayGan.includes(dayGan)
      evidences.push({
        id: nextId(),
        kind: 'riZhu',
        title: `日主为${dayGan}${dayGanWuxing}，${dayGanMatch ? '符合' : '不符合'}${verdict.name}所需日主`,
        description: `格局${verdict.name}需要日主为${requiredDayGan.join('/')}，实际日主为${dayGan}`,
        satisfied: dayGanMatch,
        weight: dayGanMatch ? 8 : -8,
        source: `dayGan='${dayGan}', dayGanWuxing='${dayGanWuxing}'`,
      })
    } else {
      evidences.push({
        id: nextId(),
        kind: 'riZhu',
        title: `日主${dayGan}${dayGanWuxing}为格局判定核心`,
        description: `日主代表命主本身，${dayGanWuxing}属性决定格局喜忌大方向`,
        satisfied: true,
        weight: 4,
        source: `dayGan='${dayGan}', dayGanWuxing='${dayGanWuxing}'`,
      })
    }

    // tianGan evidence - iterate each pillar's gan
    const targetWuxing = this.deduceTargetWuxing(verdict, dayGanWuxing)
    fourPillars.forEach((pillar, idx) => {
      const pillarNames = ['年柱', '月柱', '日柱', '时柱']
      const isMatch = pillar.ganWx === targetWuxing
      evidences.push({
        id: nextId(),
        kind: 'tianGan',
        title: `${pillarNames[idx]}天干${pillar.gan}${pillar.ganWx}${isMatch ? '为' : '非'}格局目标五行`,
        satisfied: isMatch,
        weight: isMatch ? 3 : -1,
        source: `${pillarNames[idx]} gan='${pillar.gan}', ganWx='${pillar.ganWx}'`,
      })
    })

    // diZhi evidence - iterate each pillar's zhi
    fourPillars.forEach((pillar, idx) => {
      const pillarNames = ['年支', '月支', '日支', '时支']
      const isMatch = pillar.zhiWx === targetWuxing
      evidences.push({
        id: nextId(),
        kind: 'diZhi',
        title: `${pillarNames[idx]}${pillar.zhi}${pillar.zhiWx}${isMatch ? '为' : '非'}格局目标五行`,
        satisfied: isMatch,
        weight: isMatch ? 4 : -1,
        source: `${pillarNames[idx]} zhi='${pillar.zhi}', zhiWx='${pillar.zhiWx}'`,
      })
    })

    // cangGan evidence - for each zhi, list hidden gan
    fourPillars.forEach((pillar, idx) => {
      const pillarNames = ['年支', '月支', '日支', '时支']
      const cangGanList = this.getCangGan(pillar.zhi)
      cangGanList.forEach((cg) => {
        const isMatch = cg.wx === targetWuxing
        evidences.push({
          id: nextId(),
          kind: 'cangGan',
          title: `${pillarNames[idx]}${pillar.zhi}藏干${cg.gan}${cg.wx}${isMatch ? '为' : '非'}格局目标五行`,
          satisfied: isMatch,
          weight: isMatch ? 2 : 0,
          source: `${pillar.zhi}藏干 gan='${cg.gan}', wx='${cg.wx}'`,
        })
      })
    })

    // tongGen evidence based on dayRootCount
    const tongGenSatisfied = verdict.category === 'zhencong' ? dayRootCount === 0 : dayRootCount >= 1
    const tongGenWeight = verdict.category === 'zhencong'
      ? (dayRootCount === 0 ? 7 : -7)
      : (dayRootCount >= 3 ? 6 : dayRootCount >= 1 ? 3 : -4)
    evidences.push({
      id: nextId(),
      kind: 'tongGen',
      title: `日主通根数=${dayRootCount}，${tongGenSatisfied ? '满足' : '不满足'}格局通根要求`,
      description: verdict.category === 'zhencong'
        ? `真从格局需日主无根，实际根数量=${dayRootCount}`
        : `普通格局需日主有根，实际根数量=${dayRootCount}`,
      satisfied: tongGenSatisfied,
      weight: tongGenWeight,
      source: `dayRootCount=${dayRootCount}`,
    })

    // wangShuai evidence based on dayStrength
    let wangShuaiTitle: string
    let wangShuaiSatisfied: boolean
    let wangShuaiWeight: number
    if (verdict.category === 'zhuanwang') {
      wangShuaiSatisfied = dayStrength >= 85
      wangShuaiTitle = `日主旺度=${dayStrength}分，${wangShuaiSatisfied ? '达到' : '未达到'}专旺格所需旺度`
      wangShuaiWeight = wangShuaiSatisfied ? 8 : -6
    } else if (verdict.category === 'zhencong' || verdict.category === 'jiacong') {
      wangShuaiSatisfied = dayStrength <= 30
      wangShuaiTitle = `日主旺度=${dayStrength}分，${wangShuaiSatisfied ? '符合' : '不符合'}从格旺度要求`
      wangShuaiWeight = wangShuaiSatisfied ? 7 : -5
    } else {
      wangShuaiSatisfied = dayStrength >= 40 && dayStrength <= 70
      wangShuaiTitle = `日主旺度=${dayStrength}分，${wangShuaiSatisfied ? '处于' : '偏离'}正格中和区间`
      wangShuaiWeight = wangShuaiSatisfied ? 5 : -3
    }
    evidences.push({
      id: nextId(),
      kind: 'wangShuai',
      title: wangShuaiTitle,
      satisfied: wangShuaiSatisfied,
      weight: wangShuaiWeight,
      source: `dayStrength=${dayStrength}`,
    })

    // tiaoHou evidence
    if (verdict.name === '调候格' || verdict.category === 'tiaohou') {
      const tiaoHouSatisfied = isWinterBorn || isSummerBorn
      evidences.push({
        id: nextId(),
        kind: 'tiaoHou',
        title: `调候判定：${isWinterBorn ? '生于寒冬需火暖局' : isSummerBorn ? '生于盛夏需水润局' : '生于春秋调候需求较弱'}`,
        satisfied: tiaoHouSatisfied,
        weight: tiaoHouSatisfied ? 6 : -2,
        source: `isWinterBorn=${isWinterBorn}, isSummerBorn=${isSummerBorn}`,
      })
    } else {
      const tiaoHouNote = isWinterBorn
        ? '生于寒冬，调候用火为辅助考量'
        : isSummerBorn
        ? '生于盛夏，调候用水为辅助考量'
        : '生于春秋，调候需求不突出'
      evidences.push({
        id: nextId(),
        kind: 'tiaoHou',
        title: `调候辅助：${tiaoHouNote}`,
        satisfied: true,
        weight: isWinterBorn || isSummerBorn ? 2 : 0,
        source: `isWinterBorn=${isWinterBorn}, isSummerBorn=${isSummerBorn}`,
      })
    }

    // guJi evidence from citations
    const citations = extra?.guJiCitations || []
    if (citations.length > 0) {
      citations.forEach((cite, idx) => {
        evidences.push({
          id: nextId(),
          kind: 'guJi',
          title: `古籍依据${idx + 1}：${cite.classicName || cite.classicCode || '《三命通会》'}`,
          description: cite.originalText || cite.quote || cite.chapter || '',
          satisfied: true,
          weight: 3,
          classicCode: cite.classicCode || `CLASSIC_${idx + 1}`,
          citationId: cite.citationId || `cite_${idx + 1}`,
          source: `guJiCitations[${idx}]`,
        })
      })
    } else {
      evidences.push({
        id: nextId(),
        kind: 'guJi',
        title: '古籍依据：参照正统子平格局体系判定',
        description: `以《渊海子平》《三命通会》格局篇为蓝本，结合${verdict.name}判定规则`,
        satisfied: true,
        weight: 2,
        classicCode: 'DEFAULT_ZIPING',
      })
    }

    // chengGe evidence from hits
    const chengGeHits = extra?.chengGeHits || []
    if (chengGeHits.length > 0) {
      chengGeHits.forEach((hit, idx) => {
        evidences.push({
          id: nextId(),
          kind: 'chengGe',
          title: `成格条件${idx + 1}满足：${hit}`,
          satisfied: true,
          weight: 5,
          source: `chengGeHits[${idx}]='${hit}'`,
        })
      })
    } else {
      evidences.push({
        id: nextId(),
        kind: 'chengGe',
        title: `成格综合判定：置信度 ${(verdict.confidence * 100).toFixed(0)}%`,
        description: `综合月令、日主、旺衰等多维度，格局${verdict.name}成立概率较高`,
        satisfied: verdict.confidence >= 0.5,
        weight: verdict.confidence >= 0.7 ? 5 : verdict.confidence >= 0.5 ? 3 : -3,
        source: `verdict.confidence=${verdict.confidence}`,
      })
    }

    // poGe evidence from hits
    const poGeHits = extra?.poGeHits || []
    if (poGeHits.length > 0) {
      poGeHits.forEach((hit, idx) => {
        evidences.push({
          id: nextId(),
          kind: 'poGe',
          title: `破格因素${idx + 1}：${hit}`,
          satisfied: false,
          weight: -5,
          source: `poGeHits[${idx}]='${hit}'`,
        })
      })
    } else {
      evidences.push({
        id: nextId(),
        kind: 'poGe',
        title: '破格因素：未发现明显破格条件',
        description: '综合检查刑冲害合、混杂透出等破格因素，未见明显破局',
        satisfied: true,
        weight: 2,
      })
    }

    return this.normalize(evidences)
  }

  private deduceTargetWuxing(
    verdict: { name: string; category: string; confidence: number },
    dayGanWuxing: Wuxing
  ): Wuxing {
    const m = verdict.name.match(/[木火土金水]/)
    if (m) return m[0] as Wuxing
    if (verdict.category === 'zhuanwang') return dayGanWuxing
    return dayGanWuxing
  }

  private getCangGan(zhi: string): Array<{ gan: string; wx: Wuxing }> {
    const map: Record<string, Array<{ gan: string; wx: Wuxing }>> = {
      '子': [{ gan: '癸', wx: '水' }],
      '丑': [{ gan: '己', wx: '土' }, { gan: '癸', wx: '水' }, { gan: '辛', wx: '金' }],
      '寅': [{ gan: '甲', wx: '木' }, { gan: '丙', wx: '火' }, { gan: '戊', wx: '土' }],
      '卯': [{ gan: '乙', wx: '木' }],
      '辰': [{ gan: '戊', wx: '土' }, { gan: '乙', wx: '木' }, { gan: '癸', wx: '水' }],
      '巳': [{ gan: '丙', wx: '火' }, { gan: '庚', wx: '金' }, { gan: '戊', wx: '土' }],
      '午': [{ gan: '丁', wx: '火' }, { gan: '己', wx: '土' }],
      '未': [{ gan: '己', wx: '土' }, { gan: '丁', wx: '火' }, { gan: '乙', wx: '木' }],
      '申': [{ gan: '庚', wx: '金' }, { gan: '壬', wx: '水' }, { gan: '戊', wx: '土' }],
      '酉': [{ gan: '辛', wx: '金' }],
      '戌': [{ gan: '戊', wx: '土' }, { gan: '辛', wx: '金' }, { gan: '丁', wx: '火' }],
      '亥': [{ gan: '壬', wx: '水' }, { gan: '甲', wx: '木' }],
    }
    return map[zhi] || []
  }

  private normalize(evidences: StructuredEvidence[]): StructuredEvidenceReport {
    const byKind = {} as Record<EvidenceKind, StructuredEvidence[]>
    const kinds: EvidenceKind[] = [
      'yueLing', 'riZhu', 'tianGan', 'diZhi', 'cangGan',
      'tongGen', 'wangShuai', 'tiaoHou', 'guJi', 'chengGe', 'poGe',
    ]
    kinds.forEach((k) => { byKind[k] = [] })
    evidences.forEach((e) => {
      if (byKind[e.kind]) byKind[e.kind].push(e)
    })

    const positiveWeight = evidences
      .filter((e) => e.weight > 0)
      .reduce((s, e) => s + e.weight, 0)
    const negativeWeight = Math.abs(
      evidences
        .filter((e) => e.weight < 0)
        .reduce((s, e) => s + e.weight, 0)
    )
    const netWeight = positiveWeight - negativeWeight
    const totalPossible = positiveWeight + negativeWeight || 1
    const balanceScore = Math.max(0, Math.min(100, Math.round(50 + (netWeight / totalPossible) * 50)))

    const satisfiedCount = evidences.filter((e) => e.satisfied).length
    const summaryText = `共${evidences.length}条证据：${satisfiedCount}条满足，${evidences.length - satisfiedCount}条不满足；净权重=${netWeight}，综合平衡分=${balanceScore}/100`

    return {
      all: evidences,
      byKind,
      positiveWeight,
      negativeWeight,
      netWeight,
      balanceScore,
      summaryText,
    }
  }

  formatHumanReadable(r: StructuredEvidenceReport): string {
    const kindLabels: Record<EvidenceKind, string> = {
      yueLing: '月令依据',
      riZhu: '日主依据',
      tianGan: '天干依据',
      diZhi: '地支依据',
      cangGan: '藏干依据',
      tongGen: '通根依据',
      wangShuai: '旺衰依据',
      tiaoHou: '调候依据',
      guJi: '古籍依据',
      chengGe: '成格依据',
      poGe: '破格依据',
    }
    const lines: string[] = []
    lines.push('# 结构化证据链报告')
    lines.push('')
    lines.push(`## 摘要`)
    lines.push(`- 证据总数：${r.all.length}`)
    lines.push(`- 正向权重：+${r.positiveWeight}`)
    lines.push(`- 负向权重：-${r.negativeWeight}`)
    lines.push(`- 净权重：${r.netWeight}`)
    lines.push(`- 综合平衡分：${r.balanceScore}/100`)
    lines.push(`- 总结：${r.summaryText}`)
    lines.push('')
    lines.push('## 分类明细')
    lines.push('')
    const order: EvidenceKind[] = [
      'yueLing', 'riZhu', 'wangShuai', 'tongGen',
      'tianGan', 'diZhi', 'cangGan',
      'tiaoHou', 'guJi', 'chengGe', 'poGe',
    ]
    order.forEach((k) => {
      const items = r.byKind[k]
      if (!items || items.length === 0) return
      lines.push(`### ${kindLabels[k]}`)
      items.forEach((e) => {
        const sign = e.weight > 0 ? '+' : ''
        const mark = e.satisfied ? '✓' : '✗'
        lines.push(`- ${mark} ${e.title} [${sign}${e.weight}]`)
        if (e.description) lines.push(`  > ${e.description}`)
        if (e.source) lines.push(`  > 来源：${e.source}`)
      })
      lines.push('')
    })
    return lines.join('\n')
  }
}

export const defaultEvidenceBuilder = new StructuredEvidenceBuilder()
