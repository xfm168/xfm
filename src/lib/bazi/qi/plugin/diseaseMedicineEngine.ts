/**
 * DiseaseMedicineEngine — P2-2 病药系统
 * 
 * 依据：《滴天髓》"有病方为贵，无伤不是奇"
 * 
 * 核心逻辑：
 *   1. 识别命局的"病"（过旺或过弱的五行）
 *   2. 确定对应的"药"（制衡或扶助的五行）
 *   3. 输出治法和建议
 */

import type { FiveElement, HeavenlyStem, EarthlyBranch, SixLines } from '../../types'
import { STEM_ELEMENT, GENERATE, OVERCOME } from '../../../core'

export type DiseaseType = '身弱财多' | '杀旺无制' | '食伤过旺' | '印星过旺' | '比劫过旺' | '官杀混杂' | '身旺无泄' | '寒暖失调' | '五行偏枯'

export interface DiseaseItem {
  /** 病名 */
  name: string
  /** 病因 */
  cause: string
  /** 病的五行 */
  element?: FiveElement
  /** 古籍出处 */
  source: string
  /** 严重程度 1-5 */
  severity: number
}

export interface MedicineItem {
  /** 药名 */
  name: string
  /** 药的五行 */
  element: FiveElement
  /** 治法 */
  treatment: string
  /** 古籍出处 */
  source: string
}

export interface DiseaseMedicineResult {
  /** 是否有病 */
  hasDisease: boolean
  /** 病列表 */
  diseases: DiseaseItem[]
  /** 药列表 */
  medicines: MedicineItem[]
  /** 治法总结 */
  treatment: string
  /** 古籍引用 */
  classicalQuote: string
}

// ─── 五行关系 ───

function getDayElement(gan: string): FiveElement { return (STEM_ELEMENT as any)[gan] || '木' }

const CANG_GAN: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
  '子': { ben: '癸', zhong: null, yao: null },
  '丑': { ben: '己', zhong: '辛', yao: '癸' },
  '寅': { ben: '甲', zhong: '丙', yao: '戊' },
  '卯': { ben: '乙', zhong: null, yao: null },
  '辰': { ben: '戊', zhong: '乙', yao: '癸' },
  '巳': { ben: '丙', zhong: '庚', yao: '戊' },
  '午': { ben: '丁', zhong: '己', yao: null },
  '未': { ben: '己', zhong: '丁', yao: '乙' },
  '申': { ben: '庚', zhong: '壬', yao: '戊' },
  '酉': { ben: '辛', zhong: null, yao: null },
  '戌': { ben: '戊', zhong: '辛', yao: '丁' },
  '亥': { ben: '壬', zhong: '甲', yao: null },
}

// ─── 核心引擎 ───

export function analyzeDiseaseMedicine(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
  strengthScore: number,
  strengthLevel: string,
): DiseaseMedicineResult {
  const dayElement = getDayElement(dayGan)
  const diseases: DiseaseItem[] = []
  const medicines: MedicineItem[] = []

  // 统计各五行出现次数
  const elementCount: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }

  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    // 天干五行
    elementCount[(STEM_ELEMENT as any)[pillar.gan] || '木']++
    // 地支本气五行
    const cg = CANG_GAN[pillar.zhi]
    if (cg) {
      elementCount[(STEM_ELEMENT as any)[cg.ben] || '木']++
      if (cg.zhong) elementCount[(STEM_ELEMENT as any)[cg.zhong] || '木'] += 0.5
      if (cg.yao) elementCount[(STEM_ELEMENT as any)[cg.yao] || '木'] += 0.3
    }
  }

  // 找到最旺和最弱的五行
  let maxElement: FiveElement = '木', maxCount = 0
  let minElement: FiveElement = '木', minCount = Infinity
  for (const [el, count] of Object.entries(elementCount)) {
    if (count > maxCount) { maxCount = count; maxElement = el as FiveElement }
    if (count < minCount) { minCount = count; minElement = el as FiveElement }
  }

  // ─── 身弱检测 ───
  if (strengthScore < 40) {
    // 身弱财多
    if (elementCount[OVERCOME[dayElement]] >= elementCount[dayElement] * 1.5) {
      diseases.push({
        name: '身弱财多',
        cause: `日主${dayGan}（${dayElement}）偏弱，而${OVERCOME[dayElement]}偏旺`,
        element: OVERCOME[dayElement],
        source: '滴天髓·论病药',
        severity: elementCount[OVERCOME[dayElement]] >= elementCount[dayElement] * 2 ? 4 : 3,
      })
      medicines.push({
        name: `印星（${GENERATE[dayElement]}）`,
        element: GENERATE[dayElement],
        treatment: '以印星生扶日主，化解财星之耗',
        source: '滴天髓·论病药',
      })
    }

    // 杀旺无制
    const keElement = OVERCOME[maxElement] === dayElement ? dayElement : null
    if (elementCount[maxElement] >= 5 && maxElement !== dayElement) {
      diseases.push({
        name: '杀旺无制',
        cause: `${maxElement}过旺（${maxCount.toFixed(1)}次出现），克泄日主`,
        element: maxElement,
        source: '滴天髓·论病药',
        severity: maxCount >= 6 ? 5 : 3,
      })
      // 食神制杀
      medicines.push({
        name: `食神（${GENERATE[maxElement]}）`,
        element: GENERATE[maxElement],
        treatment: `${GENERATE[maxElement]}制${maxElement}，食神制杀`,
        source: '滴天髓·论病药',
      })
      // 印星化杀
      medicines.push({
        name: `印星（${GENERATE[dayElement]}）`,
        element: GENERATE[dayElement],
        treatment: `${GENERATE[dayElement]}化${maxElement}生${dayElement}，印星化杀`,
        source: '滴天髓·论病药',
      })
    }
  }

  // ─── 身旺检测 ───
  if (strengthScore > 70) {
    // 身旺无泄
    const outputElement = GENERATE[dayElement]
    if (elementCount[outputElement] <= 1 && elementCount[OVERCOME[dayElement]] <= 1) {
      diseases.push({
        name: '身旺无泄',
        cause: `日主${dayGan}（${dayElement}）过旺，但泄秀不足`,
        element: dayElement,
        source: '滴天髓·论病药',
        severity: 3,
      })
      medicines.push({
        name: `食伤（${outputElement}）`,
        element: outputElement,
        treatment: `${outputElement}泄${dayElement}之气，食伤泄秀`,
        source: '滴天髓·论病药',
      })
    }

    // 比劫过旺
    if (elementCount[dayElement] >= 5) {
      diseases.push({
        name: '比劫过旺',
        cause: `${dayElement}五行出现${elementCount[dayElement].toFixed(1)}次，比劫过多`,
        element: dayElement,
        source: '滴天髓·论病药',
        severity: elementCount[dayElement] >= 6 ? 4 : 3,
      })
      medicines.push({
        name: `财星（${OVERCOME[dayElement]}）`,
        element: OVERCOME[dayElement],
        treatment: `${OVERCOME[dayElement]}泄${dayElement}之气，财星分财`,
        source: '滴天髓·论病药',
      })
    }
  }

  // ─── 五行偏枯 ───
  if (minCount === 0) {
    diseases.push({
      name: '五行偏枯',
      cause: `${minElement}五行完全缺失（出现0次）`,
      element: minElement,
      source: '滴天髓·论五行',
      severity: 2,
    })
    medicines.push({
      name: `${minElement}五行`,
      element: minElement,
      treatment: `补${minElement}以平衡五行`,
      source: '滴天髓·论五行',
    })
  }

  // ─── 治法总结 ───
  const treatment = buildTreatment(diseases, medicines, strengthScore, strengthLevel, dayElement)

  return {
    hasDisease: diseases.length > 0,
    diseases,
    medicines,
    treatment,
    classicalQuote: '《滴天髓》："有病方为贵，无伤不是奇。命局有病得药救之，即为贵格。病重药轻不济，药重病轻反伤。"',
  }
}

function buildTreatment(
  diseases: DiseaseItem[],
  medicines: MedicineItem[],
  strengthScore: number,
  strengthLevel: string,
  dayElement: FiveElement,
): string {
  if (diseases.length === 0) {
    return `日主${dayElement}旺衰${strengthLevel}（${strengthScore}/100），命局五行相对平衡，无大病。`
  }

  const diseaseNames = diseases.map(d => d.name).join('、')
  const medicineNames = medicines.length > 0
    ? medicines.map(m => m.name).join('、')
    : '需结合具体命局分析'

  if (strengthScore < 40) {
    return `日主偏弱（${strengthScore}/100），病在${diseaseNames}。以${medicineNames}为药，扶抑日主达到平衡。`
  }
  if (strengthScore > 70) {
    return `日主偏强（${strengthScore}/100），病在${diseaseNames}。以${medicineNames}为药，泄耗日主达到平衡。`
  }
  return `日主中和（${strengthScore}/100），病在${diseaseNames}。以${medicineNames}为药调理命局。`
}
