import type {
  GejuCategory,
  GejuName,
  GejuVerdict,
  PatternClassifierResult,
  ClassifierInput,
  Wuxing,
} from './types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }

const SHEN_BY_WUXING: Record<Wuxing, { cai: Wuxing; guansha: Wuxing; shishang: Wuxing; yinshou: Wuxing; bijie: Wuxing }> = {
  '木': { cai: '土', guansha: '金', shishang: '火', yinshou: '水', bijie: '木' },
  '火': { cai: '金', guansha: '水', shishang: '土', yinshou: '木', bijie: '火' },
  '土': { cai: '水', guansha: '木', shishang: '金', yinshou: '火', bijie: '土' },
  '金': { cai: '木', guansha: '火', shishang: '水', yinshou: '土', bijie: '金' },
  '水': { cai: '火', guansha: '土', shishang: '木', yinshou: '金', bijie: '水' },
}

interface DetectorOutput {
  category: GejuCategory
  name: GejuName
  score: number
  reason: string
  confidence: number
  evidences: string[]
  classicCitations: Array<{ classicCode: string; chapter: string; quote: string }>
  conflicts?: string[]
  yongshenProposal: Wuxing[]
  jishenProposal: Wuxing[]
}

function totalCount(count: Record<Wuxing, number>): number {
  return WUXING_LIST.reduce((s, w) => s + count[w], 0)
}

function sortedCounts(count: Record<Wuxing, number>): Array<{ wx: Wuxing; n: number; ratio: number }> {
  const total = totalCount(count) || 1
  return WUXING_LIST
    .map(wx => ({ wx, n: count[wx], ratio: count[wx] / total }))
    .sort((a, b) => b.n - a.n)
}

export class PatternClassifier {
  classify(input: ClassifierInput): PatternClassifierResult {
    const detectors: Array<() => DetectorOutput | null> = [
      () => this.detectZhenCong(input),
      () => this.detectJiaCong(input),
      () => this.detectZhuanWang(input),
      () => this.detectYiQi(input),
      () => this.detectHuaQi(input),
      () => this.detectTiaoHou(input),
      () => this.detectBingYao(input),
      () => this.detectTongGuan(input),
      () => this.detectFuYi(input),
      () => this.detectZheng(input),
    ]

    const raw: DetectorOutput[] = []
    for (const d of detectors) {
      const r = d()
      if (r) raw.push(r)
    }

    raw.sort((a, b) => b.score - a.score)

    const candidates = raw.map(r => ({
      category: r.category,
      name: r.name,
      score: r.score,
      reason: r.reason,
    }))

    let verdict: GejuVerdict | undefined
    let warning: string | undefined
    let strongestVerdict: GejuVerdict | undefined

    if (raw.length > 0) {
      const winner = raw[0]
      strongestVerdict = this.toVerdict(winner)
      const runnerUp = raw[1]
      if (winner.score >= 60 && (!runnerUp || winner.score >= runnerUp.score * 1.3)) {
        verdict = this.toVerdict(winner)
      } else if (runnerUp) {
        warning = `格局判定存在歧义：${winner.name}(${winner.score}) vs ${runnerUp.name}(${runnerUp.score})，取强者为参考`
      } else if (winner.score >= 40) {
        verdict = this.toVerdict(winner)
      }
    }

    return {
      verdict,
      candidates,
      strongestVerdict,
      warning,
    }
  }

  private toVerdict(d: DetectorOutput): GejuVerdict {
    return {
      category: d.category,
      name: d.name,
      confidence: d.confidence,
      evidences: d.evidences,
      classicCitations: d.classicCitations,
      conflicts: d.conflicts,
      yongshenProposal: d.yongshenProposal,
      jishenProposal: d.jishenProposal,
    }
  }

  private detectZhenCong(input: ClassifierInput): DetectorOutput | null {
    const { dayGanWuxing, count, dayStrength = 0, dayRootCount = 99 } = input
    const total = totalCount(count)
    if (total === 0) return null
    if (dayRootCount > 0) return null
    if (dayStrength < 3) return null

    const shen = SHEN_BY_WUXING[dayGanWuxing]
    const yinbiCount = count[shen.yinshou] + count[shen.bijie]
    if (yinbiCount > 0) return null

    const othersTotal = total - count[dayGanWuxing]
    const sorted = sortedCounts(count)
    const dominant = sorted[0]
    if (dominant.wx === dayGanWuxing) {
      if (sorted.length < 2) return null
    }
    const dominantOther = dominant.wx === dayGanWuxing ? sorted[1] : dominant
    const dominantRatio = othersTotal > 0 ? dominantOther.n / othersTotal : 0

    const topTwoRatio = othersTotal > 0 ? (sorted[0].wx === dayGanWuxing
      ? (sorted[1].n + (sorted[2]?.n || 0)) / othersTotal
      : (sorted[0].n + (sorted[1]?.n || 0)) / othersTotal) : 0

    if (dominantRatio < 0.7 && topTwoRatio < 0.7) return null

    const confidence = Math.min(1, Math.max(dominantRatio, topTwoRatio) / 0.7 + dayStrength / 6)

    let name: GejuName = '真从-从势格'
    let reason = ''
    let yongshen: Wuxing[] = []
    let jishen: Wuxing[] = []

    const caiN = count[shen.cai]
    const guanN = count[shen.guansha]
    const shiN = count[shen.shishang]

    if (caiN >= guanN && caiN >= shiN && caiN / othersTotal >= 0.4) {
      name = '真从-从财格'
      reason = `日主${dayGanWuxing}无根无印比，财星(${shen.cai})${caiN}个占主导`
      yongshen = [shen.cai, shen.shishang, shen.guansha]
      jishen = [shen.yinshou, shen.bijie]
    } else if (guanN >= caiN && guanN >= shiN && guanN / othersTotal >= 0.4) {
      name = '真从-从杀格'
      reason = `日主${dayGanWuxing}无根无印比，官杀(${shen.guansha})${guanN}个占主导`
      yongshen = [shen.guansha, shen.cai]
      jishen = [shen.yinshou, shen.bijie, shen.shishang]
    } else if (shiN >= caiN && shiN >= guanN && shiN / othersTotal >= 0.4) {
      name = '真从-从儿格'
      reason = `日主${dayGanWuxing}无根无印比，食伤(${shen.shishang})${shiN}个占主导`
      yongshen = [shen.shishang, shen.cai]
      jishen = [shen.yinshou, shen.bijie, shen.guansha]
    } else {
      name = '真从-从势格'
      reason = `日主${dayGanWuxing}无根无印比，旺势${dominantOther.wx}${dominantOther.n}个占主导`
      yongshen = [dominantOther.wx, SHENG[dominantOther.wx]]
      jishen = [shen.yinshou, shen.bijie]
    }

    return {
      category: 'zhencong',
      name,
      score: 70 + Math.round(confidence * 30),
      reason,
      confidence,
      evidences: [
        `日主强弱=${dayStrength}（>=3 满足从格前提）`,
        `日主根气数=${dayRootCount}（<=0 无根）`,
        `印比总数=${yinbiCount}（无印比劫助身）`,
        `旺势占比=${(Math.max(dominantRatio, topTwoRatio) * 100).toFixed(0)}%（>=70%）`,
      ],
      classicCitations: [
        { classicCode: 'DTS', chapter: '滴天髓·从象篇', quote: '从象者，顺其旺势，不可逆其性。从得真者，富贵非轻。' },
        { classicCode: 'ZYQ', chapter: '子平真诠·论从格', quote: '从格者，日主无根，四柱无生助，从其旺神而行。' },
        { classicCode: 'YSX', chapter: '渊海子平·真从格', quote: '真从之家有几人，假从亦可发其身。' },
      ],
      yongshenProposal: yongshen,
      jishenProposal: jishen,
    }
  }

  private detectJiaCong(input: ClassifierInput): DetectorOutput | null {
    const { dayGanWuxing, count, dayRootCount = 0, dayStrength = 0 } = input
    const total = totalCount(count)
    if (total === 0) return null

    const shen = SHEN_BY_WUXING[dayGanWuxing]
    const othersTotal = total - count[dayGanWuxing]
    if (othersTotal === 0) return null

    const sorted = sortedCounts(count)
    const dominantOther = sorted[0].wx === dayGanWuxing ? (sorted[1] || sorted[0]) : sorted[0]
    const dominantRatio = dominantOther.n / total

    if (dominantRatio < 0.55) return null
    if (dayRootCount === 0 && (count[shen.yinshou] + count[shen.bijie]) === 0) return null

    const hasWeakRoot = dayRootCount >= 1 && dayRootCount <= 2
    const hasWeakYinBi = (count[shen.yinshou] + count[shen.bijie]) >= 1 && (count[shen.yinshou] + count[shen.bijie]) <= 2
    if (!hasWeakRoot && !hasWeakYinBi) return null

    const caiN = count[shen.cai]
    const guanN = count[shen.guansha]
    const shiN = count[shen.shishang]

    let name: GejuName
    let reason: string
    const conflicts: string[] = []

    if (hasWeakRoot) conflicts.push(`日主有根(${dayRootCount}个)，非真从`)
    if (hasWeakYinBi) conflicts.push(`有印比助身(${count[shen.yinshou] + count[shen.bijie]}个)，非真从`)

    let yongshen: Wuxing[] = []
    let jishen: Wuxing[] = []

    if (caiN >= guanN && caiN >= shiN) {
      name = '假从-假从财'
      reason = `财星(${shen.cai})${caiN}个占比${(caiN / total * 100).toFixed(0)}%，但有微根/印比，为假从财`
      yongshen = [shen.cai, shen.shishang]
      jishen = [shen.bijie]
    } else if (guanN >= caiN && guanN >= shiN) {
      name = '假从-假从杀'
      reason = `官杀(${shen.guansha})${guanN}个占比${(guanN / total * 100).toFixed(0)}%，但有微根/印比，为假从杀`
      yongshen = [shen.guansha, shen.cai]
      jishen = [shen.bijie, shen.yinshou]
    } else {
      name = '假从-假从儿'
      reason = `食伤(${shen.shishang})${shiN}个占比${(shiN / total * 100).toFixed(0)}%，但有微根/印比，为假从儿`
      yongshen = [shen.shishang, shen.cai]
      jishen = [shen.bijie, shen.yinshou]
    }

    const confidence = Math.min(0.85, dominantRatio / 0.7 + (dayStrength > 0 ? 0 : 0.1))
    const score = Math.round(55 + confidence * 25)

    return {
      category: 'jiacong',
      name,
      score,
      reason,
      confidence,
      evidences: [
        `旺势${dominantOther.wx}占比=${(dominantRatio * 100).toFixed(0)}%（>=55%）`,
        `日主根气=${dayRootCount}，印比数=${count[shen.yinshou] + count[shen.bijie]}（有但微弱）`,
      ],
      classicCitations: [
        { classicCode: 'ZYQ', chapter: '子平真诠·论假从', quote: '真从者少，假从者多。假从亦有可取，须察其真假之机。' },
        { classicCode: 'SMTH', chapter: '三命通会·论从革', quote: '假从之格，运助其真则发，破其从则败。' },
      ],
      conflicts,
      yongshenProposal: yongshen,
      jishenProposal: jishen,
    }
  }

  private detectZhuanWang(input: ClassifierInput): DetectorOutput | null {
    const { dayGanWuxing, count, monthZhi, dayStrength = 0 } = input
    const total = totalCount(count)
    if (total === 0) return null

    const dayGan = input.dayGan
    const ratio = count[dayGanWuxing] / total
    const muZhi = ['寅', '卯', '辰', '亥', '卯', '未']
    const hasMuJu = muZhi.some(z => input.fourPillars.some(p => p.zhi === z))

    let name: GejuName | null = null
    let reason = ''
    let extraEvidence = ''

    if ((dayGan === '甲' || dayGan === '乙') && dayGanWuxing === '木') {
      const spring = monthZhi === '寅' || monthZhi === '卯' || monthZhi === '辰'
      const hui = (monthZhi === '寅' && input.fourPillars.some(p => p.zhi === '卯') && input.fourPillars.some(p => p.zhi === '辰'))
        || (input.fourPillars.some(p => p.zhi === '亥') && input.fourPillars.some(p => p.zhi === '卯') && input.fourPillars.some(p => p.zhi === '未'))
      if (ratio >= 0.5 || (hasMuJu && spring && dayStrength >= 2) || hui) {
        name = '专旺-曲直格（木专旺）'
        reason = `甲乙日主木${count['木']}个占${(ratio * 100).toFixed(0)}%${spring ? '+春生' : ''}${hui ? '+亥卯未/寅卯辰木局' : ''}`
        extraEvidence = `春生=${spring}, 木局=${hui}`
      }
    } else if ((dayGan === '丙' || dayGan === '丁') && dayGanWuxing === '火') {
      if (ratio >= 0.5) {
        name = '专旺-炎上格（火专旺）'
        reason = `丙丁日主火${count['火']}个占${(ratio * 100).toFixed(0)}%`
      }
    } else if ((dayGan === '戊' || dayGan === '己') && dayGanWuxing === '土') {
      if (ratio >= 0.5) {
        name = '专旺-稼穑格（土专旺）'
        reason = `戊己日主土${count['土']}个占${(ratio * 100).toFixed(0)}%`
      }
    } else if ((dayGan === '庚' || dayGan === '辛') && dayGanWuxing === '金') {
      if (ratio >= 0.5) {
        name = '专旺-从革格（金专旺）'
        reason = `庚辛日主金${count['金']}个占${(ratio * 100).toFixed(0)}%`
      }
    } else if ((dayGan === '壬' || dayGan === '癸') && dayGanWuxing === '水') {
      if (ratio >= 0.5) {
        name = '专旺-润下格（水专旺）'
        reason = `壬癸日主水${count['水']}个占${(ratio * 100).toFixed(0)}%`
      }
    }

    if (!name) return null

    const confidence = Math.min(1, ratio / 0.5 + (dayStrength >= 2 ? 0.2 : 0))
    const score = Math.round(65 + confidence * 25)

    const yongshenMap: Record<string, Wuxing[]> = {
      '专旺-曲直格（木专旺）': ['木', '水', '火'],
      '专旺-炎上格（火专旺）': ['火', '木', '土'],
      '专旺-稼穑格（土专旺）': ['土', '火', '金'],
      '专旺-从革格（金专旺）': ['金', '土', '水'],
      '专旺-润下格（水专旺）': ['水', '金', '木'],
    }
    const jishenMap: Record<string, Wuxing[]> = {
      '专旺-曲直格（木专旺）': ['金', '土'],
      '专旺-炎上格（火专旺）': ['水', '金'],
      '专旺-稼穑格（土专旺）': ['木', '水'],
      '专旺-从革格（金专旺）': ['火', '木'],
      '专旺-润下格（水专旺）': ['土', '火'],
    }

    return {
      category: 'zhuanwang',
      name,
      score,
      reason,
      confidence,
      evidences: [
        `日主${dayGan}(${dayGanWuxing})，本五行占比=${(ratio * 100).toFixed(0)}%`,
        `日主强弱=${dayStrength}，${extraEvidence || '专旺条件满足'}`,
      ],
      classicCitations: [
        { classicCode: 'ZYQ', chapter: '子平真诠·论专旺', quote: '专旺者，日主得令得地得势，五行专一，其势不可遏，宜顺不宜逆。' },
        { classicCode: 'SMTH', chapter: '三命通会·论曲直炎上稼穑从革润下', quote: '曲直仁寿格，甲乙日主，寅卯辰全或亥卯未全，木势专一。' },
        { classicCode: 'QTB', chapter: '穷通宝鉴·木火土金水专旺', quote: '专旺之格，泄秀为上，助旺次之，克战大忌。' },
      ],
      yongshenProposal: yongshenMap[name] || [dayGanWuxing, SHENG[dayGanWuxing]],
      jishenProposal: jishenMap[name] || [KE[dayGanWuxing], KE[KE[dayGanWuxing]]],
    }
  }

  private detectYiQi(input: ClassifierInput): DetectorOutput | null {
    const { fourPillars } = input
    if (!fourPillars || fourPillars.length < 4) return null

    const gans = fourPillars.map(p => p.gan)
    const zhis = fourPillars.map(p => p.zhi)

    const tianyuan = gans.every(g => g === gans[0])
    const diyuan = zhis.every(z => z === zhis[0])

    if (!tianyuan && !diyuan) return null

    const name: GejuName = tianyuan ? '一气-天元一气' : '一气-地元一气'
    const wx = tianyuan ? fourPillars[0].ganWx : fourPillars[0].zhiWx
    const reason = tianyuan
      ? `四干皆${gans[0]}，天元一气（${wx}）`
      : `四支皆${zhis[0]}，地元一气（${wx}）`

    return {
      category: 'yiqi',
      name,
      score: 85,
      reason,
      confidence: 0.95,
      evidences: [
        `四柱天干=${gans.join('')} 地支=${zhis.join('')}`,
        tianyuan ? '四干完全一致 → 天元一气' : '四支完全一致 → 地元一气',
      ],
      classicCitations: [
        { classicCode: 'SMTH', chapter: '三命通会·天元一气地元一气', quote: '天元一气者，四干相同，贵格也。地元一气者，四支相同，富格也。' },
        { classicCode: 'YSX', chapter: '渊海子平·一气格', quote: '天元一气定官高，地元一气多财宝。' },
      ],
      yongshenProposal: [wx, SHENG[wx]],
      jishenProposal: [KE[wx]],
    }
  }

  private detectHuaQi(input: ClassifierInput): DetectorOutput | null {
    const { fourPillars, monthZhi } = input
    if (!fourPillars || fourPillars.length < 4) return null

    const ganSet = new Set(fourPillars.map(p => p.gan))

    const patterns: Array<{ pair: [string, string]; monthOK: string[]; wx: Wuxing; name: GejuName }> = [
      { pair: ['甲', '己'], monthOK: ['辰', '戌', '丑', '未', '巳', '午'], wx: '土', name: '化气-甲己化土' },
      { pair: ['乙', '庚'], monthOK: ['申', '酉', '辰', '戌', '丑', '未'], wx: '金', name: '化气-乙庚化金' },
      { pair: ['丙', '辛'], monthOK: ['亥', '子', '申', '酉'], wx: '水', name: '化气-丙辛化水' },
      { pair: ['丁', '壬'], monthOK: ['寅', '卯', '亥', '子'], wx: '木', name: '化气-丁壬化木' },
      { pair: ['戊', '癸'], monthOK: ['巳', '午', '寅', '卯'], wx: '火', name: '化气-戊癸化火' },
    ]

    for (const p of patterns) {
      if (ganSet.has(p.pair[0]) && ganSet.has(p.pair[1]) && p.monthOK.includes(monthZhi)) {
        const huaShen = p.wx
        return {
          category: 'huaqi',
          name: p.name,
          score: 80,
          reason: `天干${p.pair[0]}${p.pair[1]}齐全，月令${monthZhi}${p.monthOK.includes(monthZhi) ? '逢化神' : ''}，化${huaShen}`,
          confidence: 0.9,
          evidences: [
            `天干见 ${p.pair[0]}+${p.pair[1]}（化气对）`,
            `月令=${monthZhi} 属于${p.monthOK.join('/')}化神旺地`,
            `化出五行=${huaShen}`,
          ],
          classicCitations: [
            { classicCode: 'DTS', chapter: '滴天髓·化象篇', quote: '化得真时只论化，化神还有几般话。甲己化土在中央，乙庚化金西方属。' },
            { classicCode: 'ZYQ', chapter: '子平真诠·论化气', quote: '化气者，天干相合，得月令化神之气，方能成化。' },
            { classicCode: 'SMTH', chapter: '三命通会·十干化气', quote: '化气之格，须要月令得地，化神不被克破，方为真化。' },
          ],
          yongshenProposal: [huaShen, SHEN_BY_WUXING[huaShen].yinshou],
          jishenProposal: [KE[huaShen]],
        }
      }
    }
    return null
  }

  private detectTiaoHou(input: ClassifierInput): DetectorOutput | null {
    const { isWinterBorn, isSummerBorn, monthZhiWuxing, dayGanWuxing, count } = input
    const total = totalCount(count)
    if (total === 0) return null

    let tiaohouType: 'winter' | 'summer' | null = null
    if (isWinterBorn || monthZhiWuxing === '水' || ['亥', '子', '丑'].includes(input.monthZhi)) {
      tiaohouType = 'winter'
    } else if (isSummerBorn || monthZhiWuxing === '火' || ['巳', '午', '未'].includes(input.monthZhi)) {
      tiaohouType = 'summer'
    }

    if (!tiaohouType) return null

    const seasonRatio = tiaohouType === 'winter'
      ? (count['水'] + count['金']) / total
      : (count['火'] + count['木']) / total

    let yongshen: Wuxing[]
    let jishen: Wuxing[]
    let reason: string

    if (tiaohouType === 'winter') {
      const hasHuo = count['火'] > 0
      const hasTuZao = count['土'] > 0
      yongshen = hasHuo ? ['火', '土'] : ['火']
      jishen = ['水', '金']
      reason = `冬生（月支${input.monthZhi}），金寒水冷，需火调候暖局${hasTuZao ? '兼土燥湿' : ''}，调候需求${seasonRatio > 0.5 ? '极强' : '强'}`
    } else {
      const hasShui = count['水'] > 0
      const hasJin = count['金'] > 0
      yongshen = hasShui ? ['水', '金'] : ['水']
      jishen = ['火', '木']
      reason = `夏生（月支${input.monthZhi}），火炎土燥，需水调候润局${hasJin ? '兼金泄土' : ''}，调候需求${seasonRatio > 0.5 ? '极强' : '强'}`
    }

    const confidence = Math.min(1, 0.6 + seasonRatio * 0.4)
    const score = Math.round(60 + confidence * 30)

    return {
      category: 'tiaohou',
      name: '调候格',
      score,
      reason,
      confidence,
      evidences: [
        tiaohouType === 'winter' ? '生于亥子丑月（冬）' : '生于巳午未月（夏）',
        `寒湿/燥热之气占比=${(seasonRatio * 100).toFixed(0)}%`,
        tiaohouType === 'winter' ? '调候用神：火（暖局）土（燥湿）' : '调候用神：水（润局）金（泄燥）',
      ],
      classicCitations: [
        { classicCode: 'QTB', chapter: '穷通宝鉴·调候篇', quote: '调候为急，冬用丙火，夏用癸水，寒暖得宜，方为贵格。' },
        { classicCode: 'DTS', chapter: '滴天髓·调候篇', quote: '天道有寒暖，地道有燥湿，人道得之，不可偏废。调候之法，补其不及，损其有余。' },
        { classicCode: 'ZYQ', chapter: '子平真诠·论调候', quote: '调候者，四柱之先务也。未有调候失宜而能言祸福者。' },
      ],
      yongshenProposal: yongshen,
      jishenProposal: jishen,
    }
  }

  private detectBingYao(input: ClassifierInput): DetectorOutput | null {
    const { count } = input
    const total = totalCount(count)
    if (total === 0) return null

    const sorted = sortedCounts(count)
    const bingShen = sorted[0]
    if (bingShen.ratio < 0.35 || bingShen.ratio > 0.65) return null

    const keBing = KE[bingShen.wx]
    const xieBing = SHENG[bingShen.wx]
    const haoBing = WUXING_LIST.find(w => KE[w] === bingShen.wx)!

    const yaoCount = count[keBing] + count[xieBing] + count[haoBing]
    if (yaoCount < 1) return null

    const yaoShen: Array<{ wx: Wuxing; role: string; n: number }> = [
      { wx: keBing, role: '克(药神-敌)', n: count[keBing] },
      { wx: xieBing, role: '泄(药神-泻)', n: count[xieBing] },
      { wx: haoBing, role: '耗(药神-子)', n: count[haoBing] },
    ].filter(x => x.n > 0).sort((a, b) => b.n - a.n)

    const mainYao = yaoShen[0]
    const confidence = Math.min(0.9, (bingShen.ratio - 0.3) * 1.5 + yaoCount / total)
    const score = Math.round(55 + confidence * 25)

    return {
      category: 'bingyao',
      name: '病药格',
      score,
      reason: `病神${bingShen.wx}${bingShen.n}个占${(bingShen.ratio * 100).toFixed(0)}%(35~65%区间)，药神${mainYao.wx}(${mainYao.role})${mainYao.n}个可治`,
      confidence,
      evidences: [
        `病神=${bingShen.wx} 数量=${bingShen.n} 占比=${(bingShen.ratio * 100).toFixed(0)}%（35~65%）`,
        `药神候选=${yaoShen.map(y => `${y.wx}(${y.role})×${y.n}`).join(' ')}`,
        `主治药神=${mainYao.wx}（${mainYao.role}）`,
      ],
      classicCitations: [
        { classicCode: 'DTS', chapter: '滴天髓·病药篇', quote: '有病方为贵，无伤不是奇。格中如去病，财禄两相随。' },
        { classicCode: 'ZYQ', chapter: '子平真诠·论病药', quote: '病者，四柱太过不及之处也；药者，克泄耗之以去其病也。' },
      ],
      yongshenProposal: yaoShen.map(y => y.wx).slice(0, 2),
      jishenProposal: [bingShen.wx, SHEN_BY_WUXING[bingShen.wx].yinshou, SHEN_BY_WUXING[bingShen.wx].bijie],
    }
  }

  private detectTongGuan(input: ClassifierInput): DetectorOutput | null {
    const { count, conflictingPairs } = input
    const total = totalCount(count)
    if (total === 0) return null

    const kePairs: Array<[Wuxing, Wuxing]> = [['金', '木'], ['木', '土'], ['土', '水'], ['水', '火'], ['火', '金']]
    let foundPair: [Wuxing, Wuxing] | null = null
    let bestScore = 0
    let tongguan: Wuxing | null = null

    for (const [a, b] of kePairs) {
      const rA = count[a] / total
      const rB = count[b] / total
      if (rA >= 0.15 && rB >= 0.15) {
        const mid = SHENG[a]
        const midR = count[mid] / total
        const s = (rA + rB) + midR
        if (s > bestScore) {
          bestScore = s
          foundPair = [a, b]
          tongguan = mid
        }
      }
    }

    if (!foundPair || !tongguan) {
      if (conflictingPairs && conflictingPairs.length > 0) {
        for (const [a, b] of conflictingPairs) {
          const rA = count[a] / total
          const rB = count[b] / total
          if (rA >= 0.1 && rB >= 0.1) {
            const mid = SHENG[a]
            foundPair = [a, b]
            tongguan = mid
            bestScore = rA + rB + count[mid] / total
            break
          }
        }
      }
    }

    if (!foundPair || !tongguan) return null

    const midCount = count[tongguan]
    const hasTongguan = midCount >= 1
    const confidence = Math.min(0.9, bestScore * 0.7 + (hasTongguan ? 0.2 : 0))
    const score = Math.round(50 + confidence * 30)

    return {
      category: 'tongguan',
      name: '通关格',
      score,
      reason: `${foundPair[0]}${foundPair[1]}相战(各${count[foundPair[0]]}/${count[foundPair[1]]})，${tongguan}通关${hasTongguan ? '(有)' : '(待补)'}+${midCount}个`,
      confidence,
      evidences: [
        `相战二行：${foundPair[0]} vs ${foundPair[1]}，占比分别 ${(count[foundPair[0]] / total * 100).toFixed(0)}% / ${(count[foundPair[1]] / total * 100).toFixed(0)}%`,
        `通关五行：${tongguan}（${foundPair[0]}→${tongguan}→${foundPair[1]}顺生）`,
        `通关五行数=${midCount} ${hasTongguan ? '已具备' : '需运岁补足'}`,
      ],
      classicCitations: [
        { classicCode: 'DTS', chapter: '滴天髓·通关篇', quote: '关者，隔也。通者，引也。两神相战，中神以和之，谓之通关。' },
        { classicCode: 'ZYQ', chapter: '子平真诠·论通关', quote: '通关者，相克之中有生化也。金木相战，得水以通关；水火相战，得木以通关。' },
        { classicCode: 'SMTH', chapter: '三命通会·通关论', quote: '两敌相持，喜中间以和解，通关之神，大则格成，小则免祸。' },
      ],
      yongshenProposal: [tongguan],
      jishenProposal: [foundPair[0], foundPair[1]].filter(w => KE[w] !== tongguan && SHENG[w] !== tongguan),
    }
  }

  private detectFuYi(input: ClassifierInput): DetectorOutput | null {
    const { dayGanWuxing, dayStrength = 0, count } = input
    const total = totalCount(count)
    if (total === 0) return null

    const shen = SHEN_BY_WUXING[dayGanWuxing]

    let strategy: 'yi' | 'fu' | null = null
    let reason = ''
    let yongshen: Wuxing[] = []
    let jishen: Wuxing[] = []

    if (dayStrength >= 2) {
      strategy = 'yi'
      reason = `日主${dayGanWuxing}强弱=${dayStrength}（>=2 偏旺），宜抑（克）耗（财）泄（食伤）`
      yongshen = [shen.guansha, shen.cai, shen.shishang]
      jishen = [shen.yinshou, shen.bijie]
    } else if (dayStrength <= -2) {
      strategy = 'fu'
      reason = `日主${dayGanWuxing}强弱=${dayStrength}（<=-2 偏弱），宜扶（比劫）生（印星）`
      yongshen = [shen.bijie, shen.yinshou]
      jishen = [shen.guansha, shen.cai, shen.shishang]
    } else {
      return null
    }

    const confidence = Math.min(0.95, 0.5 + Math.abs(dayStrength) / 6)
    const score = Math.round(45 + confidence * 25)

    return {
      category: 'fuyi',
      name: '扶抑格',
      score,
      reason,
      confidence,
      evidences: [
        `日主强弱=${dayStrength}（${strategy === 'yi' ? '旺极需抑' : '弱极需扶'}）`,
        strategy === 'yi'
          ? `用神=官杀(${shen.guansha})+财(${shen.cai})+食伤(${shen.shishang}) 抑耗泄`
          : `用神=比劫(${shen.bijie})+印(${shen.yinshou}) 生扶`,
      ],
      classicCitations: [
        { classicCode: 'ZYQ', chapter: '子平真诠·论扶抑', quote: '扶抑者，旺则抑之，弱则扶之，此不易之正法也。' },
        { classicCode: 'DTS', chapter: '滴天髓·旺衰篇', quote: '旺者宜克宜泄宜耗，弱者宜生宜扶宜助。平衡得中，吉无不利。' },
        { classicCode: 'YSX', chapter: '渊海子平·论旺衰', quote: '旺则损之，弱则益之，此理之常，亦命理之正途。' },
      ],
      yongshenProposal: yongshen,
      jishenProposal: jishen,
    }
  }

  private detectZheng(input: ClassifierInput): DetectorOutput | null {
    const { dayGanWuxing, dayGan, fourPillars, monthZhi } = input
    if (!fourPillars || fourPillars.length < 4) return null

    const monthPillar = fourPillars[1]
    if (!monthPillar) return null

    const shen = SHEN_BY_WUXING[dayGanWuxing]

    const zhiCangGanMap: Record<string, Wuxing[]> = {
      '子': ['水', '土'],
      '丑': ['土', '金', '水'],
      '寅': ['木', '火', '土'],
      '卯': ['木'],
      '辰': ['土', '木', '水'],
      '巳': ['火', '土', '金'],
      '午': ['火', '土'],
      '未': ['土', '火', '木'],
      '申': ['金', '水', '土'],
      '酉': ['金'],
      '戌': ['土', '火', '金'],
      '亥': ['水', '木'],
    }

    const cangWx = zhiCangGanMap[monthZhi] || [monthPillar.zhiWx]
    const ganWxList = fourPillars.map(p => p.ganWx)

    const cangCategoryMap: Array<{ wx: Wuxing; category: string; geju: GejuName }> = [
      { wx: shen.guansha, category: '正官/七杀（根据阴阳）', geju: '正格-正官格' },
      { wx: shen.guansha, category: '七杀', geju: '正格-七杀格' },
      { wx: shen.yinshou, category: '印星', geju: '正格-正印格' },
      { wx: shen.cai, category: '财星', geju: '正格-正财格' },
      { wx: shen.shishang, category: '食伤', geju: '正格-食神格' },
    ]

    let matched: GejuName = '未判明正格'
    const evidences: string[] = [`月令=${monthZhi} 藏干五行=${cangWx.join('/')}`]
    let foundReason = '无月令藏干透出，按正格兜底'

    for (const c of cangCategoryMap) {
      if (cangWx.includes(c.wx) && ganWxList.includes(c.wx)) {
        if (c.category.includes('官') || c.category.includes('杀')) {
          const guanYinYang = c.wx
          const yinYangMap: Record<string, string> = {
            '木': '甲阳乙阴', '火': '丙阳丁阴', '土': '戊阳己阴', '金': '庚阳辛阴', '水': '壬阳癸阴',
          }
          const dayYY = dayGan.match(/[甲乙丙丁戊己庚辛壬癸]/)
          matched = this.zhengGuanOrQiSha(dayGan, shen.guansha, ganWxList, fourPillars)
        } else if (c.category.includes('印')) {
          matched = this.zhengYinOrPianYin(dayGan, shen.yinshou, ganWxList, fourPillars)
        } else if (c.category.includes('财')) {
          matched = this.zhengCaiOrPianCai(dayGan, shen.cai, ganWxList, fourPillars)
        } else if (c.category.includes('食')) {
          matched = this.shiShenOrShangGuan(dayGan, shen.shishang, ganWxList, fourPillars)
        }
        foundReason = `月令藏干${c.wx}(${c.category})透出天干，取${matched}`
        evidences.push(`月令用神${c.wx}透干 → ${matched}`)
        break
      }
    }

    if (matched === '未判明正格') {
      if (cangWx.includes(shen.guansha)) {
        matched = '正格-正官格'
        foundReason = `月令藏官杀${shen.guansha}，虽未透出，取${matched}（月令本气）`
      } else if (cangWx.includes(shen.cai)) {
        matched = '正格-正财格'
        foundReason = `月令藏财${shen.cai}，取${matched}（月令本气）`
      } else if (cangWx.includes(shen.yinshou)) {
        matched = '正格-正印格'
        foundReason = `月令藏印${shen.yinshou}，取${matched}（月令本气）`
      } else if (cangWx.includes(shen.shishang)) {
        matched = '正格-食神格'
        foundReason = `月令藏食伤${shen.shishang}，取${matched}（月令本气）`
      }
    }

    const yongshenMap: Partial<Record<GejuName, Wuxing[]>> = {
      '正格-正官格': [shen.cai, shen.yinshou],
      '正格-七杀格': [shen.yinshou, shen.shishang],
      '正格-正印格': [shen.guansha, shen.shishang],
      '正格-偏印格': [shen.shishang, shen.cai],
      '正格-正财格': [shen.shishang, shen.guansha],
      '正格-偏财格': [shen.shishang, shen.guansha],
      '正格-食神格': [shen.cai, shen.shishang],
      '正格-伤官格': [shen.cai, shen.yinshou],
    }

    return {
      category: 'zheng',
      name: matched,
      score: 40,
      reason: foundReason,
      confidence: 0.6,
      evidences,
      classicCitations: [
        { classicCode: 'ZYQ', chapter: '子平真诠·论正格', quote: '正格者，月令用神，透干取格，此为正法。格局以月令为尊。' },
        { classicCode: 'YSX', chapter: '渊海子平·论格局', quote: '八字定格局，先看月令。月令用神，为格之主。' },
        { classicCode: 'SMTH', chapter: '三命通会·论月令取格', quote: '凡看命以月令用神为君，次看四柱辅佐。月令得用，格之正也。' },
      ],
      yongshenProposal: yongshenMap[matched] || [],
      jishenProposal: [],
    }
  }

  private zhengGuanOrQiSha(dayGan: string, guanshaWx: Wuxing, ganWxList: Wuxing[], fourPillars: any[]): GejuName {
    const yinyangOf = (gan: string): '阳' | '阴' => {
      return ['甲', '丙', '戊', '庚', '壬'].includes(gan) ? '阳' : '阴'
    }
    const ganForWx = (wx: Wuxing): string[] => {
      const m: Record<Wuxing, string[]> = {
        '木': ['甲', '乙'], '火': ['丙', '丁'], '土': ['戊', '己'], '金': ['庚', '辛'], '水': ['壬', '癸'],
      }
      return m[wx] || []
    }
    const dayYY = yinyangOf(dayGan)
    const gs = ganForWx(guanshaWx)
    for (const g of gs) {
      if (fourPillars.some(p => p.gan === g)) {
        const gyy = yinyangOf(g)
        return (dayYY !== gyy) ? '正格-正官格' : '正格-七杀格'
      }
    }
    return '正格-正官格'
  }

  private zhengYinOrPianYin(dayGan: string, yinWx: Wuxing, ganWxList: Wuxing[], fourPillars: any[]): GejuName {
    const yinyangOf = (gan: string): '阳' | '阴' => {
      return ['甲', '丙', '戊', '庚', '壬'].includes(gan) ? '阳' : '阴'
    }
    const ganForWx = (wx: Wuxing): string[] => {
      const m: Record<Wuxing, string[]> = {
        '木': ['甲', '乙'], '火': ['丙', '丁'], '土': ['戊', '己'], '金': ['庚', '辛'], '水': ['壬', '癸'],
      }
      return m[wx] || []
    }
    const dayYY = yinyangOf(dayGan)
    const gs = ganForWx(yinWx)
    for (const g of gs) {
      if (fourPillars.some(p => p.gan === g)) {
        const gyy = yinyangOf(g)
        return (dayYY !== gyy) ? '正格-偏印格' : '正格-正印格'
      }
    }
    return '正格-正印格'
  }

  private zhengCaiOrPianCai(dayGan: string, caiWx: Wuxing, ganWxList: Wuxing[], fourPillars: any[]): GejuName {
    const yinyangOf = (gan: string): '阳' | '阴' => {
      return ['甲', '丙', '戊', '庚', '壬'].includes(gan) ? '阳' : '阴'
    }
    const ganForWx = (wx: Wuxing): string[] => {
      const m: Record<Wuxing, string[]> = {
        '木': ['甲', '乙'], '火': ['丙', '丁'], '土': ['戊', '己'], '金': ['庚', '辛'], '水': ['壬', '癸'],
      }
      return m[wx] || []
    }
    const dayYY = yinyangOf(dayGan)
    const gs = ganForWx(caiWx)
    for (const g of gs) {
      if (fourPillars.some(p => p.gan === g)) {
        const gyy = yinyangOf(g)
        return (dayYY !== gyy) ? '正格-正财格' : '正格-偏财格'
      }
    }
    return '正格-正财格'
  }

  private shiShenOrShangGuan(dayGan: string, shiWx: Wuxing, ganWxList: Wuxing[], fourPillars: any[]): GejuName {
    const yinyangOf = (gan: string): '阳' | '阴' => {
      return ['甲', '丙', '戊', '庚', '壬'].includes(gan) ? '阳' : '阴'
    }
    const ganForWx = (wx: Wuxing): string[] => {
      const m: Record<Wuxing, string[]> = {
        '木': ['甲', '乙'], '火': ['丙', '丁'], '土': ['戊', '己'], '金': ['庚', '辛'], '水': ['壬', '癸'],
      }
      return m[wx] || []
    }
    const dayYY = yinyangOf(dayGan)
    const gs = ganForWx(shiWx)
    for (const g of gs) {
      if (fourPillars.some(p => p.gan === g)) {
        const gyy = yinyangOf(g)
        return (dayYY !== gyy) ? '正格-食神格' : '正格-伤官格'
      }
    }
    return '正格-食神格'
  }
}
