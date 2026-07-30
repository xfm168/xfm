import type { Wuxing, ShenType, XiYongSingleMethodResult, XiYongMethod } from './types'

export interface XiYongInput {
  dayGanWuxing: Wuxing
  monthZhiWuxing: Wuxing
  count: Record<Wuxing, number>
  dayStrength: number
  isWinterBorn?: boolean
  isSummerBorn?: boolean
  isWetSeason?: boolean
  isDrySeason?: boolean
  conflictingPairs?: Array<[Wuxing, Wuxing]>
  gejuCategory?: string
  tiaohouShen?: Wuxing[]
  diseaseWuxing?: Wuxing
}

const WUXING_ALL: Wuxing[] = ['木', '火', '土', '金', '水']

const SHENG: Record<Wuxing, Wuxing> = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木',
}

const KE: Record<Wuxing, Wuxing> = {
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
  '金': '木',
}

function emptyScore(): Record<Wuxing, number> {
  return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
}

function scoreToType(score: number): ShenType | null {
  if (score >= 2) return '用神'
  if (score >= 1) return '喜神'
  if (score <= -2) return '忌神'
  if (score <= -1) return '仇神'
  return null
}

function buildSuggestionFromScore(score: Record<Wuxing, number>): Partial<Record<Wuxing, ShenType>> {
  const sug: Partial<Record<Wuxing, ShenType>> = {}
  for (const wx of WUXING_ALL) {
    const t = scoreToType(score[wx])
    if (t) sug[wx] = t
  }
  return sug
}

export function applyFuYi(input: XiYongInput): XiYongSingleMethodResult {
  const { dayGanWuxing, dayStrength } = input
  const score = emptyScore()
  const trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

  trace.push({
    step: '判定日主强弱',
    text: `日主五行=${dayGanWuxing}，dayStrength=${dayStrength}（+3极强 ~ -3极弱）`,
    satisfied: true,
    citation: '子平真诠',
  })

  const shengWo = WUXING_ALL.find(w => SHENG[w] === dayGanWuxing)!
  const tongWo = dayGanWuxing
  const keWo = WUXING_ALL.find(w => KE[w] === dayGanWuxing)!
  const woSheng = SHENG[dayGanWuxing]
  const woKe = KE[dayGanWuxing]

  if (dayStrength > 0) {
    trace.push({
      step: '身强用克泄耗',
      text: `dayStrength=${dayStrength}>0，身强，宜用克（官杀=${keWo}）、泄（食伤=${woSheng}）、耗（财星=${woKe}）`,
      satisfied: true,
      citation: '子平真诠·论用神',
    })
    score[keWo] = 2
    score[woSheng] = 1
    score[woKe] = 1
    score[shengWo] = -2
    score[tongWo] = -1
  } else if (dayStrength < 0) {
    trace.push({
      step: '身弱用生扶',
      text: `dayStrength=${dayStrength}<0，身弱，宜用生（印星=${shengWo}）、扶（比劫=${tongWo}）`,
      satisfied: true,
      citation: '子平真诠·论用神',
    })
    score[shengWo] = 2
    score[tongWo] = 1
    score[keWo] = -2
    score[woSheng] = -1
    score[woKe] = -1
  } else {
    trace.push({
      step: '中和无需扶抑',
      text: `dayStrength=0，日主中和，扶抑法不强制作用神`,
      satisfied: false,
      citation: '子平真诠',
    })
  }

  trace.push({
    step: '扶抑打分结果',
    text: `印星(${shengWo}):${score[shengWo]} 比劫(${tongWo}):${score[tongWo]} 官杀(${keWo}):${score[keWo]} 食伤(${woSheng}):${score[woSheng]} 财星(${woKe}):${score[woKe]}`,
    satisfied: true,
    citation: '滴天髓·通神论',
  })

  return {
    method: '扶抑',
    suggestion: buildSuggestionFromScore(score),
    weight: 0.25,
    trace,
    applicable: true,
    sources: ['子平真诠', '滴天髓'],
    score,
  }
}

export function applyTiaoHou(input: XiYongInput): XiYongSingleMethodResult {
  const { isWinterBorn, isSummerBorn, monthZhiWuxing, tiaohouShen } = input
  const score = emptyScore()
  const trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

  trace.push({
    step: '判定月令季节',
    text: `月令=${monthZhiWuxing}，冬生=${isWinterBorn}，夏生=${isSummerBorn}，调候用神预设=${tiaohouShen ?? '无'}`,
    satisfied: true,
    citation: '穷通宝鉴',
  })

  if (tiaohouShen && tiaohouShen.length > 0) {
    trace.push({
      step: '采用预设调候用神',
      text: `直接采用穷通宝鉴调候用神：${tiaohouShen.join('、')}`,
      satisfied: true,
      citation: '穷通宝鉴·调候篇',
    })
    for (let i = 0; i < tiaohouShen.length; i++) {
      score[tiaohouShen[i]] = i === 0 ? 2 : 1
    }
    const opposite = WUXING_ALL.filter(w => !tiaohouShen.includes(w))
    for (const w of opposite) {
      if (score[w] === 0) score[w] = -1
    }
  } else if (isWinterBorn) {
    trace.push({
      step: '冬月用火调候',
      text: '生于亥子丑月，天寒地冻，需火暖局，火为调候用神',
      satisfied: true,
      citation: '穷通宝鉴·冬月调候',
    })
    score['火'] = 2
    score['木'] = 1
    score['水'] = -2
    score['金'] = -1
  } else if (isSummerBorn) {
    trace.push({
      step: '夏月用水调候',
      text: '生于巳午未月，炎火燥热，需水降温，水为调候用神',
      satisfied: true,
      citation: '穷通宝鉴·夏月调候',
    })
    score['水'] = 2
    score['金'] = 1
    score['火'] = -2
    score['土'] = -1
  } else {
    trace.push({
      step: '春秋二季调候',
      text: '生于辰戌丑未（除冬夏）或寅卯申酉月，调候需求不极端，视具体格局',
      satisfied: true,
      citation: '穷通宝鉴',
    })
    if (monthZhiWuxing === '木') { score['水'] = 1; score['火'] = 1 }
    else if (monthZhiWuxing === '金') { score['土'] = 1; score['水'] = 1 }
  }

  trace.push({
    step: '调候打分结果',
    text: `木:${score['木']} 火:${score['火']} 土:${score['土']} 金:${score['金']} 水:${score['水']}`,
    satisfied: true,
    citation: '穷通宝鉴',
  })

  return {
    method: '调候',
    suggestion: buildSuggestionFromScore(score),
    weight: 0.2,
    trace,
    applicable: true,
    sources: ['穷通宝鉴', '三命通会'],
    score,
  }
}

export function applyBingYao(input: XiYongInput): XiYongSingleMethodResult {
  const { diseaseWuxing, count } = input
  const score = emptyScore()
  const trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

  trace.push({
    step: '判定病神',
    text: `diseaseWuxing=${diseaseWuxing ?? '未指定'}，五行计数：木=${count['木']} 火=${count['火']} 土=${count['土']} 金=${count['金']} 水=${count['水']}`,
    satisfied: true,
    citation: '三命通会·论病药',
  })

  if (!diseaseWuxing) {
    const maxCount = Math.max(...WUXING_ALL.map(w => count[w]))
    const candidates = WUXING_ALL.filter(w => count[w] === maxCount && count[w] >= 3)
    if (candidates.length > 0) {
      const autoDisease = candidates[0]
      trace.push({
        step: '自动推断病神',
        text: `未指定病神，自动选取五行计数最多者(${maxCount}个)：${autoDisease}为病`,
        satisfied: true,
        citation: '子平真诠·病药说',
      })
      return doBingYaoWithDisease(autoDisease, score, trace)
    } else {
      trace.push({
        step: '病药法跳过',
        text: '未指定病神且无明显过旺五行，病药法暂不适用',
        satisfied: false,
        citation: '三命通会',
      })
      return {
        method: '病药',
        suggestion: {},
        weight: 0.15,
        trace,
        applicable: false,
        skipReason: '无明确病神',
        sources: ['三命通会', '子平真诠'],
        score,
      }
    }
  }

  return doBingYaoWithDisease(diseaseWuxing, score, trace)
}

function doBingYaoWithDisease(
  disease: Wuxing,
  score: Record<Wuxing, number>,
  trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }>,
): XiYongSingleMethodResult {
  const keBing = WUXING_ALL.find(w => KE[w] === disease)!
  const bingSheng = SHENG[disease]
  const shengBing = WUXING_ALL.find(w => SHENG[w] === disease)!

  trace.push({
    step: '确定药神',
    text: `病在${disease}，克病者=${keBing}（正药），泄病者=${bingSheng}（辅药），生病人=${shengBing}（忌）`,
    satisfied: true,
    citation: '三命通会·论病药',
  })

  score[keBing] = 2
  score[bingSheng] = 1
  score[disease] = -2
  score[shengBing] = -1

  trace.push({
    step: '病药打分结果',
    text: `药神(${keBing}):+2 辅药(${bingSheng}):+1 病(${disease}):-2 助病(${shengBing}):-1`,
    satisfied: true,
    citation: '子平真诠·病药说',
  })

  return {
    method: '病药',
    suggestion: buildSuggestionFromScore(score),
    weight: 0.15,
    trace,
    applicable: true,
    sources: ['三命通会', '子平真诠'],
    score,
  }
}

export function applyTongGuan(input: XiYongInput): XiYongSingleMethodResult {
  const { conflictingPairs } = input
  const score = emptyScore()
  const trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

  trace.push({
    step: '检测相战两行',
    text: `conflictingPairs=${JSON.stringify(conflictingPairs ?? [])}`,
    satisfied: true,
    citation: '滴天髓·通关篇',
  })

  if (!conflictingPairs || conflictingPairs.length === 0) {
    trace.push({
      step: '通关法跳过',
      text: '无两行相战信息，通关法暂不适用',
      satisfied: false,
      citation: '滴天髓',
    })
    return {
      method: '通关',
      suggestion: {},
      weight: 0.1,
      trace,
      applicable: false,
      skipReason: '无冲突两行',
      sources: ['滴天髓', '子平真诠'],
      score,
    }
  }

  for (const [a, b] of conflictingPairs) {
    const isAKeB = KE[a] === b
    const isBKeA = KE[b] === a
    let tongguan: Wuxing | null = null

    if (isAKeB) {
      tongguan = SHENG[a]
      trace.push({
        step: '确定通关五行',
        text: `${a}克${b}相战，取${a}之生化(${tongguan})通关：${a}→${tongguan}→${b} 连续相生`,
        satisfied: true,
        citation: '滴天髓·通关篇',
      })
    } else if (isBKeA) {
      tongguan = SHENG[b]
      trace.push({
        step: '确定通关五行',
        text: `${b}克${a}相战，取${b}之生化(${tongguan})通关：${b}→${tongguan}→${a} 连续相生`,
        satisfied: true,
        citation: '滴天髓·通关篇',
      })
    } else {
      trace.push({
        step: '非直接相克',
        text: `${a}与${b}非直接相克关系，跳过该组`,
        satisfied: false,
      })
    }

    if (tongguan) {
      score[tongguan] = Math.max(score[tongguan], 2)
      score[a] = Math.min(score[a], -1)
      score[b] = Math.min(score[b], -1)
    }
  }

  trace.push({
    step: '通关打分结果',
    text: `木:${score['木']} 火:${score['火']} 土:${score['土']} 金:${score['金']} 水:${score['水']}`,
    satisfied: true,
    citation: '滴天髓·通关篇',
  })

  return {
    method: '通关',
    suggestion: buildSuggestionFromScore(score),
    weight: 0.1,
    trace,
    applicable: Object.values(score).some(v => v !== 0),
    sources: ['滴天髓', '三命通会'],
    score,
  }
}

export function applyHanNuan(input: XiYongInput): XiYongSingleMethodResult {
  const { isWinterBorn, isSummerBorn, monthZhiWuxing, count } = input
  const score = emptyScore()
  const trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

  trace.push({
    step: '判定寒暖',
    text: `月令=${monthZhiWuxing}，冬生=${isWinterBorn}，夏生=${isSummerBorn}，火=${count['火']} 水=${count['水']}`,
    satisfied: true,
    citation: '三命通会·论寒暖',
  })

  if (isWinterBorn) {
    trace.push({
      step: '过寒需暖',
      text: '生于冬季，水旺火弱，过寒，需火暖之',
      satisfied: true,
      citation: '穷通宝鉴·寒暖论',
    })
    score['火'] = 2
    score['木'] = 1
    score['水'] = -2
  } else if (isSummerBorn) {
    trace.push({
      step: '过暖需寒',
      text: '生于夏季，火炎水涸，过暖，需水寒之',
      satisfied: true,
      citation: '穷通宝鉴·寒暖论',
    })
    score['水'] = 2
    score['金'] = 1
    score['火'] = -2
  } else {
    const huoCount = count['火']
    const shuiCount = count['水']
    if (huoCount >= 3) {
      trace.push({
        step: '火多偏暖',
        text: `火=${huoCount}个，偏暖，需水寒`,
        satisfied: true,
        citation: '三命通会',
      })
      score['水'] = 1
      score['火'] = -1
    } else if (shuiCount >= 3) {
      trace.push({
        step: '水多偏寒',
        text: `水=${shuiCount}个，偏寒，需火暖`,
        satisfied: true,
        citation: '三命通会',
      })
      score['火'] = 1
      score['水'] = -1
    } else {
      trace.push({
        step: '寒暖适中',
        text: '非冬非夏，水火相当，寒暖法无强制用神',
        satisfied: false,
        citation: '三命通会',
      })
    }
  }

  trace.push({
    step: '寒暖打分结果',
    text: `木:${score['木']} 火:${score['火']} 土:${score['土']} 金:${score['金']} 水:${score['水']}`,
    satisfied: true,
    citation: '穷通宝鉴',
  })

  return {
    method: '寒暖',
    suggestion: buildSuggestionFromScore(score),
    weight: 0.1,
    trace,
    applicable: true,
    sources: ['穷通宝鉴', '三命通会'],
    score,
  }
}

export function applyZaoShi(input: XiYongInput): XiYongSingleMethodResult {
  const { isDrySeason, isWetSeason, monthZhiWuxing, count } = input
  const score = emptyScore()
  const trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

  trace.push({
    step: '判定燥湿',
    text: `月令=${monthZhiWuxing}，燥月=${isDrySeason}，湿月=${isWetSeason}，土=${count['土']} 水=${count['水']}`,
    satisfied: true,
    citation: '三命通会·论燥湿',
  })

  if (isDrySeason) {
    trace.push({
      step: '过燥需湿',
      text: '生于戌未月或火旺土燥，过燥，需水湿润泽',
      satisfied: true,
      citation: '穷通宝鉴·燥湿论',
    })
    score['水'] = 2
    score['金'] = 1
    score['土'] = -1
    score['火'] = -1
  } else if (isWetSeason) {
    trace.push({
      step: '过湿需燥',
      text: '生于辰丑月或水多土湿，过湿，需燥土（戌未）暖之',
      satisfied: true,
      citation: '穷通宝鉴·燥湿论',
    })
    score['土'] = 2
    score['火'] = 1
    score['水'] = -2
    score['金'] = -1
  } else {
    const tuCount = count['土']
    const shuiCount = count['水']
    if (tuCount >= 3 && shuiCount <= 1) {
      trace.push({
        step: '土多偏燥',
        text: `土=${tuCount}水=${shuiCount}，偏燥，需水`,
        satisfied: true,
        citation: '三命通会',
      })
      score['水'] = 1
      score['土'] = -1
    } else if (shuiCount >= 3 && tuCount <= 1) {
      trace.push({
        step: '水多偏湿',
        text: `水=${shuiCount}土=${tuCount}，偏湿，需土`,
        satisfied: true,
        citation: '三命通会',
      })
      score['土'] = 1
      score['水'] = -1
    } else {
      trace.push({
        step: '燥湿适中',
        text: '非湿月燥月，水土相当，燥湿法无特殊用神',
        satisfied: false,
        citation: '三命通会',
      })
    }
  }

  trace.push({
    step: '燥湿打分结果',
    text: `木:${score['木']} 火:${score['火']} 土:${score['土']} 金:${score['金']} 水:${score['水']}`,
    satisfied: true,
    citation: '穷通宝鉴',
  })

  return {
    method: '燥湿',
    suggestion: buildSuggestionFromScore(score),
    weight: 0.1,
    trace,
    applicable: true,
    sources: ['穷通宝鉴', '三命通会'],
    score,
  }
}

export function applyGeJu(input: XiYongInput): XiYongSingleMethodResult {
  const { gejuCategory, count, dayGanWuxing } = input
  const score = emptyScore()
  const trace: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

  trace.push({
    step: '判定格局类别',
    text: `gejuCategory=${gejuCategory ?? '正格'}，日主=${dayGanWuxing}，计数：木=${count['木']}火=${count['火']}土=${count['土']}金=${count['金']}水=${count['水']}`,
    satisfied: true,
    citation: '子平真诠·论格局',
  })

  const maxCount = Math.max(...WUXING_ALL.map(w => count[w]))
  const wangShenList = WUXING_ALL.filter(w => count[w] === maxCount)
  const wangShen = wangShenList[0]

  if (!gejuCategory || gejuCategory === '正格') {
    trace.push({
      step: '正格取用法',
      text: '正格以月令用神为主，配合扶抑调候，格局法辅助参考',
      satisfied: true,
      citation: '子平真诠·正格篇',
    })
  } else if (gejuCategory.includes('从') || gejuCategory.includes('假从') || gejuCategory.includes('半从')) {
    trace.push({
      step: '从格从旺神',
      text: `格局=${gejuCategory}，从格当顺其旺势，从${wangShen}（${maxCount}个最旺）`,
      satisfied: true,
      citation: '滴天髓·从象篇',
    })
    score[wangShen] = 2
    const shengWang = SHENG[wangShen]
    score[shengWang] = 1
    const keWang = WUXING_ALL.find(w => KE[w] === wangShen)!
    score[keWang] = -2
    const wangKe = KE[wangShen]
    score[wangKe] = -1
  } else if (gejuCategory.includes('专旺') || gejuCategory.includes('曲直') || gejuCategory.includes('炎上') || gejuCategory.includes('稼穑') || gejuCategory.includes('从革') || gejuCategory.includes('润下')) {
    trace.push({
      step: '专旺格助旺泄秀',
      text: `格局=${gejuCategory}，专旺格宜助旺（${wangShen}）+ 泄秀（${SHENG[wangShen]}）`,
      satisfied: true,
      citation: '子平真诠·专旺篇',
    })
    score[wangShen] = 2
    score[SHENG[wangShen]] = 2
    const keWang = WUXING_ALL.find(w => KE[w] === wangShen)!
    score[keWang] = -2
  } else {
    trace.push({
      step: '其他格局',
      text: `格局=${gejuCategory}，暂按正格扶抑原则处理`,
      satisfied: true,
      citation: '三命通会',
    })
  }

  trace.push({
    step: '格局打分结果',
    text: `木:${score['木']} 火:${score['火']} 土:${score['土']} 金:${score['金']} 水:${score['水']}`,
    satisfied: true,
    citation: '子平真诠',
  })

  return {
    method: '格局',
    suggestion: buildSuggestionFromScore(score),
    weight: 0.1,
    trace,
    applicable: true,
    sources: ['子平真诠', '滴天髓'],
    score,
  }
}
