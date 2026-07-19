/**
 * 组合关系引擎 V4.3 — 玄风门
 *
 * 完整的天干地支组合关系分析系统，覆盖：
 * - 天干：五合、相冲、相克
 * - 地支：六合、三合局、三会局、半合、六冲、六害、三刑、自刑、破、穿
 *
 * 每种关系都有吉凶判断、影响分析和命理建议。
 * 规则来源：《子平真诠》《三命通会》《渊海子平》《协纪辨方》
 */

import type { BaZiChart, FiveElement, HeavenlyStem, EarthlyBranch } from './types'
import {
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  CANG_GAN,
  GENERATE,
  OVERCOME,
  BE_OVERCOME,
  BE_GENERATE,
  WANG_SHUAI_TABLE,
} from '@/lib/core'

// ========== 类型定义 ==========

export interface CombinationResult {
  /** 天干合/冲/克 */
  heavenlyStemCombos: StemCombo[]
  /** 地支合/冲/害/刑/破/穿 */
  earthlyBranchCombos: BranchCombo[]
  /** 组合对命局的整体影响评分（-100 到 100，正为吉） */
  impactScore: number
  /** 关键组合描述 */
  keyCombinations: string[]
  /** 组合关系总析（约300字） */
  description: string
}

export interface StemCombo {
  /** 组合类型 */
  type: '五合' | '天干相冲' | '天干相克'
  /** 参与的天干 */
  stems: [HeavenlyStem, HeavenlyStem]
  /** 化出五行（仅五合有效） */
  huaElement?: FiveElement
  /** 是否成化 */
  huaSuccess?: boolean
  /** 吉凶判断 */
  auspicious: '吉' | '凶' | '平' | '中性'
  /** 影响说明 */
  impact: string
  /** 影响的柱（年/月/日/时） */
  affectedPillars: string[]
  /** 典籍出处 */
  source: string
  /** 强度评分 0-100 */
  strength: number
}

export interface BranchCombo {
  /** 组合类型 */
  type:
    | '六合'
    | '三合局'
    | '三会局'
    | '半合'
    | '六冲'
    | '六害'
    | '三刑'
    | '自刑'
    | '破'
    | '穿'
    | '地支相刑'
    | '六穿'
  /** 参与的地支 */
  branches: EarthlyBranch[]
  /** 合化五行（仅合类有效） */
  huaElement?: FiveElement
  /** 是否成化 */
  huaSuccess?: boolean
  /** 吉凶判断 */
  auspicious: '吉' | '凶' | '平' | '中性'
  /** 影响说明 */
  impact: string
  /** 影响的柱 */
  affectedPillars: string[]
  /** 典籍出处 */
  source: string
  /** 强度评分 0-100 */
  strength: number
  /** 刑的具体类型（无恩/恃势/无礼） */
  xingType?: string
}

// ========== 常量定义 ==========

/** 天干五合表 */
const HEAVENLY_STEM_COMBOS: { stems: [HeavenlyStem, HeavenlyStem]; huaElement: FiveElement }[] = [
  { stems: ['甲', '己'], huaElement: '土' },
  { stems: ['乙', '庚'], huaElement: '金' },
  { stems: ['丙', '辛'], huaElement: '水' },
  { stems: ['丁', '壬'], huaElement: '木' },
  { stems: ['戊', '癸'], huaElement: '火' },
]

/** 天干相冲表 */
const HEAVENLY_STEM_CLASHES: { stems: [HeavenlyStem, HeavenlyStem] }[] = [
  { stems: ['甲', '庚'] }, { stems: ['乙', '辛'] },
  { stems: ['丙', '壬'] }, { stems: ['丁', '癸'] },
]

/** 天干相克关系（按五行克） */
function getStemClashes(stem: HeavenlyStem): { target: HeavenlyStem; element: FiveElement }[] {
  const el = STEM_ELEMENT[stem]
  const overcomeEl = OVERCOME[el]
  return HEAVENLY_STEMS.filter(s => STEM_ELEMENT[s] === overcomeEl && s !== stem)
    .map(target => ({ target, element: overcomeEl }))
}

/** 地支六合表 */
const EARTHLY_BRANCH_SIX_COMBO: { branches: [EarthlyBranch, EarthlyBranch]; huaElement: FiveElement }[] = [
  { branches: ['子', '丑'], huaElement: '土' },
  { branches: ['寅', '亥'], huaElement: '木' },
  { branches: ['卯', '戌'], huaElement: '火' },
  { branches: ['辰', '酉'], huaElement: '金' },
  { branches: ['巳', '申'], huaElement: '水' },
  { branches: ['午', '未'], huaElement: '土' },
]

/** 地支三合局 */
const EARTHLY_BRANCH_THREE_COMBO: { branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch]; huaElement: FiveElement }[] = [
  { branches: ['申', '子', '辰'], huaElement: '水' },
  { branches: ['亥', '卯', '未'], huaElement: '木' },
  { branches: ['寅', '午', '戌'], huaElement: '火' },
  { branches: ['巳', '酉', '丑'], huaElement: '金' },
]

/** 地支三会局 */
const EARTHLY_BRANCH_THREE_MEET: { branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch]; element: FiveElement }[] = [
  { branches: ['寅', '卯', '辰'], element: '木' },
  { branches: ['巳', '午', '未'], element: '火' },
  { branches: ['申', '酉', '戌'], element: '金' },
  { branches: ['亥', '子', '丑'], element: '水' },
]

/** 地支半合（三合局的前两个或后两个） */
const EARTHLY_BRANCH_HALF_COMBO: { branches: [EarthlyBranch, EarthlyBranch]; huaElement: FiveElement; name: string }[] = [
  { branches: ['申', '子'], huaElement: '水', name: '申子半合水' },
  { branches: ['子', '辰'], huaElement: '水', name: '子辰半合水' },
  { branches: ['亥', '卯'], huaElement: '木', name: '亥卯半合木' },
  { branches: ['卯', '未'], huaElement: '木', name: '卯未半合木' },
  { branches: ['寅', '午'], huaElement: '火', name: '寅午半合火' },
  { branches: ['午', '戌'], huaElement: '火', name: '午戌半合火' },
  { branches: ['巳', '酉'], huaElement: '金', name: '巳酉半合金' },
  { branches: ['酉', '丑'], huaElement: '金', name: '酉丑半合金' },
]

/** 地支六冲表 */
const EARTHLY_BRANCH_SIX_CLASH: { branches: [EarthlyBranch, EarthlyBranch] }[] = [
  { branches: ['子', '午'] }, { branches: ['丑', '未'] },
  { branches: ['寅', '申'] }, { branches: ['卯', '酉'] },
  { branches: ['辰', '戌'] }, { branches: ['巳', '亥'] },
]

/** 地支六害表 */
const EARTHLY_BRANCH_SIX_HARM: { branches: [EarthlyBranch, EarthlyBranch] }[] = [
  { branches: ['子', '未'] }, { branches: ['丑', '午'] },
  { branches: ['寅', '巳'] }, { branches: ['卯', '辰'] },
  { branches: ['申', '亥'] }, { branches: ['酉', '戌'] },
]

/** 地支三刑表 */
const EARTHLY_BRANCH_THREE_PUNISH: { branches: EarthlyBranch[]; name: string; type: string }[] = [
  { branches: ['寅', '巳', '申'], name: '寅巳申三刑', type: '无恩之刑' },
  { branches: ['丑', '戌', '未'], name: '丑戌未三刑', type: '恃势之刑' },
]

/** 地支自刑表 */
const EARTHLY_BRANCH_SELF_PUNISH: { branches: EarthlyBranch[]; name: string }[] = [
  { branches: ['辰', '辰'], name: '辰辰自刑' },
  { branches: ['午', '午'], name: '午午自刑' },
  { branches: ['酉', '酉'], name: '酉酉自刑' },
  { branches: ['亥', '亥'], name: '亥亥自刑' },
]

/** 地支子卯刑 */
const EARTHLY_BRANCH_ZI_MAO: { branches: ['子', '卯']; name: string; type: string } = {
  branches: ['子', '卯'], name: '子卯刑', type: '无礼之刑',
}

/** 地支破表 */
const EARTHLY_BRANCH_BREAK: { branches: [EarthlyBranch, EarthlyBranch] }[] = [
  { branches: ['子', '酉'] }, { branches: ['丑', '辰'] },
  { branches: ['寅', '亥'] }, { branches: ['卯', '午'] },
  { branches: ['巳', '申'] }, { branches: ['未', '戌'] },
]

/** 地支穿表（六穿） */
const EARTHLY_BRANCH_PIERCE: { branches: [EarthlyBranch, EarthlyBranch] }[] = [
  { branches: ['子', '午'] }, { branches: ['丑', '巳'] },
  { branches: ['寅', '申'] }, { branches: ['卯', '未'] },
  { branches: ['辰', '戌'] }, { branches: ['巳', '亥'] },
]

// ========== 柱位置名称 ==========

const PILLAR_NAMES = ['年柱', '月柱', '日柱', '时柱'] as const

function getStemPillar(chart: BaZiChart, stem: HeavenlyStem): string {
  const sixLines = chart.sixLines
  if (sixLines.year.gan === stem) return '年柱'
  if (sixLines.month.gan === stem) return '月柱'
  if (sixLines.day.gan === stem) return '日柱'
  if (sixLines.hour.gan === stem) return '时柱'
  return '未知柱'
}

function getBranchPillar(chart: BaZiChart, branch: EarthlyBranch): string {
  const sixLines = chart.sixLines
  if (sixLines.year.zhi === branch) return '年柱'
  if (sixLines.month.zhi === branch) return '月柱'
  if (sixLines.day.zhi === branch) return '日柱'
  if (sixLines.hour.zhi === branch) return '时柱'
  return '未知柱'
}

// ========== 天干组合分析 ==========

function analyzeHeavenlyStemCombos(chart: BaZiChart): StemCombo[] {
  const sixLines = chart.sixLines
  const allStems = [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan] as HeavenlyStem[]
  const results: StemCombo[] = []

  // 1. 天干五合
  for (const combo of HEAVENLY_STEM_COMBOS) {
    const [a, b] = combo.stems
    if (allStems.includes(a) && allStems.includes(b)) {
      const huaSuccess = checkHuaSuccess(combo.huaElement, sixLines.month.zhi)
      results.push({
        type: '五合',
        stems: combo.stems,
        huaElement: combo.huaElement,
        huaSuccess,
        auspicious: huaSuccess ? '吉' : '平',
        impact: huaSuccess
          ? `${a}${b}合化${combo.huaElement}成功，命局${combo.huaElement}气大增。`
          : `${a}${b}相合但化气不真（月令非${combo.huaElement}），主合绊，双方力量减弱。`,
        affectedPillars: [
          getStemPillar(chart, a),
          getStemPillar(chart, b),
        ].filter((v, i, a) => a.indexOf(v) === i),
        source: '《三命通会》天干五合论',
        strength: huaSuccess ? 85 : 60,
      })
    }
  }

  // 2. 天干相冲
  for (const clash of HEAVENLY_STEM_CLASHES) {
    const [a, b] = clash.stems
    if (allStems.includes(a) && allStems.includes(b)) {
      const aEl = STEM_ELEMENT[a]
      const bEl = STEM_ELEMENT[b]
      results.push({
        type: '天干相冲',
        stems: clash.stems,
        auspicious: '凶',
        impact: `${a}${b}相冲，${aEl}与${bEl}对抗。` +
          `《三命通会》云：「天干相冲，主人多变动不和」。` +
          `两柱天干互相牵制，力量互减。`,
        affectedPillars: [
          getStemPillar(chart, a),
          getStemPillar(chart, b),
        ].filter((v, i, a) => a.indexOf(v) === i),
        source: '《三命通会》天干冲论',
        strength: 70,
      })
    }
  }

  // 3. 天干相克
  for (let i = 0; i < allStems.length; i++) {
    for (let j = i + 1; j < allStems.length; j++) {
      const a = allStems[i]
      const b = allStems[j]
      if (a === b) continue
      const aEl = STEM_ELEMENT[a]
      const bEl = STEM_ELEMENT[b]
      // A 克 B
      if (OVERCOME[aEl] === bEl) {
        // 检查是否已有五合或相冲
        const exists = results.some(r =>
          r.stems.includes(a) && r.stems.includes(b)
        )
        if (!exists) {
          results.push({
            type: '天干相克',
            stems: [a, b],
            auspicious: '平',
            impact: `${a}（${aEl}）克${b}（${bEl}），${getStemPillar(chart, a)}克${getStemPillar(chart, b)}。` +
              `天干相克代表制约关系，非绝对凶兆。`,
            affectedPillars: [
              getStemPillar(chart, a),
              getStemPillar(chart, b),
            ].filter((v, i, a) => a.indexOf(v) === i),
            source: '《子平真诠》天干克论',
            strength: 50,
          })
        }
      }
    }
  }

  return results
}

/** 检查化气是否成功（月令是否为化神五行） */
function checkHuaSuccess(huaElement: FiveElement, monthZhi: EarthlyBranch): boolean {
  return BRANCH_ELEMENT[monthZhi] === huaElement
}

// ========== 地支组合分析 ==========

function analyzeEarthlyBranchCombos(chart: BaZiChart): BranchCombo[] {
  const sixLines = chart.sixLines
  const allBranches = [sixLines.year.zhi, sixLines.month.zhi, sixLines.day.zhi, sixLines.hour.zhi] as EarthlyBranch[]
  const results: BranchCombo[] = []
  const found = new Set<string>()

  // 1. 三会局（最高优先级，力量最大）
  for (const combo of EARTHLY_BRANCH_THREE_MEET) {
    const matched = combo.branches.filter(b => allBranches.includes(b))
    if (matched.length >= 3) {
      const key = [...combo.branches].sort().join('')
      if (!found.has(key)) {
        found.add(key)
        results.push({
          type: '三会局',
          branches: combo.branches,
          huaElement: combo.element,
          auspicious: '吉',
          impact: `地支见${combo.branches.join('、')}，成${combo.element}三会局。` +
            `《三命通会》云：「三会局者，一方之气汇聚，力量极大」` +
            `。三会局力量大于三合局，${combo.element}气在命局中极旺，` +
            `若${combo.element}为喜用神则大吉，为忌神则大凶。`,
          affectedPillars: combo.branches.map(b => getBranchPillar(chart, b)).filter((v, i, a) => a.indexOf(v) === i),
          source: '《三命通会》三会局论',
          strength: 95,
        })
      }
    }
  }

  // 2. 三合局
  for (const combo of EARTHLY_BRANCH_THREE_COMBO) {
    const matched = combo.branches.filter(b => allBranches.includes(b))
    if (matched.length >= 3) {
      const key = [...combo.branches].sort().join('')
      if (!found.has(key)) {
        found.add(key)
        const huaSuccess = checkHuaSuccess(combo.huaElement, sixLines.month.zhi)
        results.push({
          type: '三合局',
          branches: combo.branches,
          huaElement: combo.huaElement,
          huaSuccess,
          auspicious: '吉',
          impact: `地支见${combo.branches.join('、')}，成${combo.huaElement}三合局${huaSuccess ? '（成化）' : '（未化）'}。` +
            `《子平真诠》云：「三合局者，合三支之力为一气」` +
            `。三合局力量强大，${combo.huaElement}气大增。` +
            (huaSuccess ? `化神得月令，成化之力最强。` : `化神不得月令，合而不化，但合力仍在。`),
          affectedPillars: combo.branches.map(b => getBranchPillar(chart, b)).filter((v, i, a) => a.indexOf(v) === i),
          source: '《子平真诠》三合局论',
          strength: huaSuccess ? 90 : 75,
        })
      }
    }
  }

  // 3. 半合
  for (const combo of EARTHLY_BRANCH_HALF_COMBO) {
    const [a, b] = combo.branches
    if (allBranches.includes(a) && allBranches.includes(b)) {
      const key = combo.name
      if (!found.has(key)) {
        found.add(key)
        results.push({
          type: '半合',
          branches: combo.branches,
          huaElement: combo.huaElement,
          auspicious: '平',
          impact: `地支${a}${b}半合${combo.huaElement}。` +
            `《渊海子平》云：「半合之力，虽不如三合，仍可观」` +
            `。半合局若逢大运流年补齐第三支，则可成完整三合局。`,
          affectedPillars: [getBranchPillar(chart, a), getBranchPillar(chart, b)].filter((v, i, a) => a.indexOf(v) === i),
          source: '《渊海子平》半合论',
          strength: 55,
        })
      }
    }
  }

  // 4. 六合
  for (const combo of EARTHLY_BRANCH_SIX_COMBO) {
    const [a, b] = combo.branches
    if (allBranches.includes(a) && allBranches.includes(b)) {
      const key = `${[...combo.branches].sort().join('')}`
      if (!found.has(key)) {
        found.add(key)
        results.push({
          type: '六合',
          branches: combo.branches,
          huaElement: combo.huaElement,
          auspicious: '吉',
          impact: `地支${a}${b}六合，化${combo.huaElement}。` +
            `《三命通会》云：「六合主和谐，多主贵人暗中相助」` +
            `。六合之力虽不如三合，然代表暗中助力，` +
            `在感情婚姻方面尤其重要。${a}与${b}合，主人际关系融洽。`,
          affectedPillars: [getBranchPillar(chart, a), getBranchPillar(chart, b)].filter((v, i, a) => a.indexOf(v) === i),
          source: '《三命通会》六合论',
          strength: 65,
        })
      }
    }
  }

  // 5. 六冲
  for (const clash of EARTHLY_BRANCH_SIX_CLASH) {
    const [a, b] = clash.branches
    if (allBranches.includes(a) && allBranches.includes(b)) {
      const key = `${[...clash.branches].sort().join('')}`
      if (!found.has(key)) {
        found.add(key)
        const aEl = BRANCH_ELEMENT[a]
        const bEl = BRANCH_ELEMENT[b]
        results.push({
          type: '六冲',
          branches: clash.branches,
          auspicious: '凶',
          impact: `地支${a}${b}相冲，${aEl}与${bEl}交战。` +
            `《三命通会》云：「冲者，动也，散也」` +
            `。${a}${b}冲代表变动与冲突：` +
            getClashImpact(chart, a, b),
          affectedPillars: [getBranchPillar(chart, a), getBranchPillar(chart, b)].filter((v, i, a) => a.indexOf(v) === i),
          source: '《三命通会》六冲论',
          strength: 80,
        })
      }
    }
  }

  // 6. 三刑
  for (const punish of EARTHLY_BRANCH_THREE_PUNISH) {
    const matched = punish.branches.filter(b => allBranches.includes(b))
    if (matched.length >= 3) {
      const key = punish.name
      if (!found.has(key)) {
        found.add(key)
        results.push({
          type: '三刑',
          branches: punish.branches,
          auspicious: '凶',
          xingType: punish.type,
          impact: `地支见${punish.branches.join('、')}，成${punish.name}（${punish.type}）。` +
            `《渊海子平》云：「${punish.type}，主人${punish.type === '无恩之刑' ? '恩将仇报，背信弃义' : '仗势欺人，恃强凌弱'}」` +
            `。三刑代表刑伤灾祸，需注意人际关系和法律纠纷。` +
            `若有合化解刑则为有救。`,
          affectedPillars: punish.branches.map(b => getBranchPillar(chart, b)).filter((v, i, a) => a.indexOf(v) === i),
          source: '《渊海子平》三刑论',
          strength: 85,
        })
      }
    }
  }

  // 7. 子卯刑
  if (allBranches.includes('子') && allBranches.includes('卯')) {
    const key = '子卯刑'
    if (!found.has(key)) {
      found.add(key)
      results.push({
        type: '三刑',
        branches: ['子', '卯'],
        auspicious: '凶',
        xingType: '无礼之刑',
        impact: `地支子卯相刑（无礼之刑）。` +
          `《渊海子平》云：「子卯刑，主人不守礼法，多有感情纠葛」` +
          `。子水生卯木，反被刑伤，代表恩中招怨，感情上多波折。`,
        affectedPillars: [getBranchPillar(chart, '子'), getBranchPillar(chart, '卯')].filter((v, i, a) => a.indexOf(v) === i),
        source: '《渊海子平》子卯刑论',
        strength: 70,
      })
    }
  }

  // 8. 自刑
  for (const self of EARTHLY_BRANCH_SELF_PUNISH) {
    const branch = self.branches[0]
    const count = allBranches.filter(b => b === branch).length
    if (count >= 2) {
      const key = self.name
      if (!found.has(key)) {
        found.add(key)
        results.push({
          type: '自刑',
          branches: [branch, branch],
          auspicious: '凶',
          impact: `地支见两个${branch}，成${self.name}。` +
            `《渊海子平》云：「自刑者，自寻烦恼，自我折磨」` +
            `。自刑代表内心矛盾，容易自己给自己施压。` +
            `需学会释怀，方能化解。`,
          affectedPillars: allBranches
            .map((b, i) => b === branch ? String(PILLAR_NAMES[i]) : null)
            .filter((v): v is string => v !== null),
          source: '《渊海子平》自刑论',
          strength: 60,
        })
      }
    }
  }

  // 9. 六害
  for (const harm of EARTHLY_BRANCH_SIX_HARM) {
    const [a, b] = harm.branches
    if (allBranches.includes(a) && allBranches.includes(b)) {
      const key = `${[...harm.branches].sort().join('')}`
      if (!found.has(key)) {
        found.add(key)
        results.push({
          type: '六害',
          branches: harm.branches,
          auspicious: '凶',
          impact: `地支${a}${b}相害。` +
            `《渊海子平》云：「害者，阻也，妨也，主人暗中受损」` +
            `。六害为暗中为害，不如冲刑之猛烈，但更难防范。` +
            `需防口舌是非和背后中伤。`,
          affectedPillars: [getBranchPillar(chart, a), getBranchPillar(chart, b)].filter((v, i, a) => a.indexOf(v) === i),
          source: '《渊海子平》六害论',
          strength: 65,
        })
      }
    }
  }

  // 10. 破
  for (const brk of EARTHLY_BRANCH_BREAK) {
    const [a, b] = brk.branches
    if (allBranches.includes(a) && allBranches.includes(b)) {
      const key = `${[...brk.branches].sort().join('')}`
      if (!found.has(key)) {
        found.add(key)
        results.push({
          type: '破',
          branches: brk.branches,
          auspicious: '凶',
          impact: `地支${a}${b}相破。` +
            `《协纪辨方》云：「破者，散也，主破坏分离」` +
            `。破的力量较弱，代表暗中的破坏和分离。` +
            `多主事业合作或感情方面的暗中裂痕。`,
          affectedPillars: [getBranchPillar(chart, a), getBranchPillar(chart, b)].filter((v, i, a) => a.indexOf(v) === i),
          source: '《协纪辨方》破论',
          strength: 45,
        })
      }
    }
  }

  // 11. 穿（六穿）
  for (const pierce of EARTHLY_BRANCH_PIERCE) {
    const [a, b] = pierce.branches
    if (allBranches.includes(a) && allBranches.includes(b)) {
      const key = `穿_${[...pierce.branches].sort().join('')}`
      if (!found.has(key)) {
        found.add(key)
        results.push({
          type: '穿',
          branches: pierce.branches,
          auspicious: '平',
          impact: `地支${a}${b}相穿。` +
            `穿与冲类似但力量更小，代表微小的摩擦和不和。` +
            `需注意细节方面的人际关系。`,
          affectedPillars: [getBranchPillar(chart, a), getBranchPillar(chart, b)].filter((v, i, a) => a.indexOf(v) === i),
          source: '《渊海子平》穿论',
          strength: 40,
        })
      }
    }
  }

  // 按力量大小排序
  results.sort((a, b) => b.strength - a.strength)
  return results
}

/** 获取六冲的详细影响 */
function getClashImpact(chart: BaZiChart, a: EarthlyBranch, b: EarthlyBranch): string {
  const pillarA = getBranchPillar(chart, a)
  const pillarB = getBranchPillar(chart, b)
  const aEl = BRANCH_ELEMENT[a]
  const bEl = BRANCH_ELEMENT[b]

  const impacts: string[] = []

  if (pillarA === '日柱' || pillarB === '日柱') {
    impacts.push(`${pillarA === '日柱' ? '年柱' : '日柱'}被冲，主配偶宫不稳，婚姻多变。`)
  }
  if (pillarA === '年柱' || pillarB === '年柱') {
    impacts.push(`年柱被冲，主少年运不稳，祖业难承。`)
  }
  if (pillarA === '月柱' || pillarB === '月柱') {
    impacts.push(`月柱被冲，主事业多变，工作环境不稳。`)
  }
  if (pillarA === '时柱' || pillarB === '时柱') {
    impacts.push(`时柱被冲，主晚年运不稳，子女缘薄。`)
  }

  // 五行层面的影响
  impacts.push(`${aEl}（${a}）与${bEl}（${b}）交战，` +
    `${aEl}力量被${bEl}冲散，双方力量互减。`)

  if (impacts.length === 0) {
    impacts.push(`${a}${b}冲，主环境变动和人际冲突。`)
  }

  return impacts.join('')
}

// ========== 影响评分计算 ==========

function calculateImpactScore(
  stemCombos: StemCombo[],
  branchCombos: BranchCombo[],
): number {
  let score = 0

  // 天干组合评分
  for (const combo of stemCombos) {
    switch (combo.type) {
      case '五合':
        score += combo.huaSuccess ? 15 : 5
        break
      case '天干相冲':
        score -= 10
        break
      case '天干相克':
        score -= 3
        break
    }
  }

  // 地支组合评分
  for (const combo of branchCombos) {
    switch (combo.type) {
      case '三会局':
        score += 20
        break
      case '三合局':
        score += combo.huaSuccess ? 15 : 8
        break
      case '半合':
        score += 5
        break
      case '六合':
        score += 10
        break
      case '六冲':
        score -= 15
        break
      case '三刑':
        score -= 20
        break
      case '自刑':
        score -= 8
        break
      case '六害':
        score -= 10
        break
      case '破':
        score -= 5
        break
      case '穿':
        score -= 3
        break
    }
  }

  // 限制在 -100 到 100 之间
  return Math.max(-100, Math.min(100, score))
}

// ========== 关键组合提取 ==========

function extractKeyCombinations(
  stemCombos: StemCombo[],
  branchCombos: BranchCombo[],
): string[] {
  const keys: string[] = []

  // 高力量的组合
  const strongCombos = [
    ...branchCombos.filter(c => c.strength >= 80),
    ...stemCombos.filter(c => c.strength >= 70),
  ]

  for (const combo of strongCombos) {
    if ('stems' in combo) {
      const sc = combo as StemCombo
      keys.push(`${sc.type}：${sc.stems.join('')}${sc.huaElement ? `化${sc.huaElement}` : ''}`)
    } else {
      const bc = combo as BranchCombo
      keys.push(`${bc.type}：${bc.branches.join('')}${bc.huaElement ? `化${bc.huaElement}` : ''}`)
    }
  }

  return keys
}

// ========== 描述生成 ==========

function generateCombinationDescription(
  chart: BaZiChart,
  stemCombos: StemCombo[],
  branchCombos: BranchCombo[],
  impactScore: number,
): string {
  const sixLines = chart.sixLines
  const dayZhi = sixLines.day.zhi

  const parts: string[] = []

  // 总述
  parts.push(
    `此命天干为${sixLines.year.gan}${sixLines.month.gan}、${sixLines.day.gan}${sixLines.hour.gan}，` +
    `地支为${sixLines.year.zhi}${sixLines.month.zhi}、${sixLines.day.zhi}${sixLines.hour.zhi}。` +
    `经分析命局干支组合关系如下。`
  )

  // 天干关系
  if (stemCombos.length > 0) {
    const stemDesc = stemCombos.map(c => c.impact).join('；')
    parts.push(`天干关系方面：${stemDesc}。`)
  } else {
    parts.push(`天干之间无明显的合冲关系，干支配合较为平和。`)
  }

  // 地支关系
  if (branchCombos.length > 0) {
    const majorBranchCombos = branchCombos.filter(c => c.strength >= 60)
    const branchDesc = majorBranchCombos.map(c => c.impact).join('；')
    parts.push(`地支关系方面：${branchDesc}。`)
  } else {
    parts.push(`地支之间无明显的合冲刑害关系，地支配合较为稳定。`)
  }

  // 综合评价
  const overallDesc = impactScore >= 30
    ? `命局组合关系总体吉利（${impactScore}分），合多于冲，人际关系较为和谐。`
    : impactScore >= 0
      ? `命局组合关系总体平稳（${impactScore}分），吉凶参半，需看大运流年配合。`
      : impactScore >= -30
        ? `命局组合关系总体偏凶（${impactScore}分），冲刑较多，人生多变动和波折。`
        : `命局组合关系严重不佳（${impactScore}分），多冲多刑，人生波折较多，需注意防灾化煞。`

  parts.push(overallDesc)

  // 建议
  const suggestions: string[] = []
  if (impactScore < 0) {
    suggestions.push('逢合运可解冲刑，逢之则吉。')
  }
  if (branchCombos.some(c => c.type === '六冲' && c.affectedPillars.includes('日柱'))) {
    suggestions.push('日支逢冲，感情婚姻需多经营，晚婚者反吉。')
  }
  if (branchCombos.some(c => c.type === '六冲' && c.affectedPillars.includes('年柱'))) {
    suggestions.push('年柱逢冲，不宜在家乡发展，外出反而有利。')
  }
  if (branchCombos.some(c => c.type === '三合局' || c.type === '三会局')) {
    suggestions.push('逢三合三会运，可成大事。')
  }

  if (suggestions.length > 0) {
    parts.push(`综合建议：${suggestions.join('')}`)
  }

  return parts.join('\n\n')
}

// ========== 核心导出函数 ==========

/**
 * 分析命局组合关系
 * 涵盖天干五合、相冲、相克，地支六合、三合、三会、半合、六冲、六害、三刑、自刑、破、穿
 */
export function analyzeCombinations(chart: BaZiChart): CombinationResult {
  const stemCombos = analyzeHeavenlyStemCombos(chart)
  const branchCombos = analyzeEarthlyBranchCombos(chart)
  const impactScore = calculateImpactScore(stemCombos, branchCombos)
  const keyCombinations = extractKeyCombinations(stemCombos, branchCombos)
  const description = generateCombinationDescription(chart, stemCombos, branchCombos, impactScore)

  return {
    heavenlyStemCombos: stemCombos,
    earthlyBranchCombos: branchCombos,
    impactScore,
    keyCombinations,
    description,
  }
}

// ========== 导出 ==========

export {
  HEAVENLY_STEM_COMBOS,
  HEAVENLY_STEM_CLASHES,
  EARTHLY_BRANCH_SIX_COMBO,
  EARTHLY_BRANCH_THREE_COMBO,
  EARTHLY_BRANCH_THREE_MEET,
  EARTHLY_BRANCH_HALF_COMBO,
  EARTHLY_BRANCH_SIX_CLASH,
  EARTHLY_BRANCH_SIX_HARM,
  EARTHLY_BRANCH_THREE_PUNISH,
  EARTHLY_BRANCH_SELF_PUNISH,
  EARTHLY_BRANCH_BREAK,
  EARTHLY_BRANCH_PIERCE,
}
