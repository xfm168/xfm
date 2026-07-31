import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
function emptyScore(): Record<Wuxing, number> { return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 } }

/**
 * MedicineEngine（病药体系引擎）- Evidence 驱动
 *
 * 病神 = 过旺或克破日主的五行。
 * 药神 = 克病神或泄病神的五行。
 *
 * Evidence 驱动证据链：
 * 1. 病因：为什么这个五行是病（克日主 / 过旺 / 破局）
 * 2. 药因：为什么这个五行是药（克病 / 泄病）
 * 3. 药力 vs 病力：药神与病神数量比较，判断药足够 / 药不足
 * 4. 药过度：药神超过病神+2，药过反成病
 * 5. 通关需求：病药交战需调和
 * 6. 调候需求：病与气候相关需调候
 *
 * 经典依据：《三命通会》论病药 + 《子平真诠》病药说
 */
export class MedicineEngine implements SubEngine {
  readonly name = 'MedicineEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { diseaseWuxing, count, dayGanWuxing, isWinterBorn, isSummerBorn } = input
    const score = emptyScore()
    const evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

    evidence.push({
      step: 'S1-判定病神',
      text: `diseaseWuxing=${diseaseWuxing ?? '未指定'} 五行计数：木=${count['木']}火=${count['火']}土=${count['土']}金=${count['金']}水=${count['水']}`,
      satisfied: true,
      citation: '《三命通会》论病药',
    })

    let disease: Wuxing | undefined = diseaseWuxing

    // 如果未指定病神，自动推断
    if (!disease) {
      const maxCount = Math.max(...WUXING_LIST.map(w => count[w]))
      const candidates = WUXING_LIST.filter(w => count[w] === maxCount && count[w] >= 3)
      if (candidates.length > 0) {
        disease = candidates[0]
        evidence.push({
          step: 'S2-自动推断病神',
          text: `未指定病神 自动选取最旺者(${maxCount}个)：${disease}为病`,
          satisfied: true,
          citation: '《子平真诠》病药说',
        })
      } else {
        evidence.push({
          step: 'S2-病药法跳过',
          text: '无明显过旺五行 病药法不适用',
          satisfied: false,
          citation: '《三命通会》',
        })
        return {
          engineName: this.name,
          applicable: false,
          skipReason: '无明确病神',
          scores: score,
          evidence,
          classicEvidence: [],
          confidence: 0,
          weight: 0.15,
          summary: '病药：未适用（无病神）',
        }
      }
    }

    const d = disease!
    const keBing = WUXING_LIST.find(w => KE[w] === d)! // 克病者（正药）
    const bingSheng = SHENG[d] // 病之所生（辅药，泄病）
    const shengBing = WUXING_LIST.find(w => SHENG[w] === d)! // 生病者（忌）

    const diseaseCount = count[d]
    const dayGanCount = count[dayGanWuxing]

    // === S3-病因分析：为什么这个五行是病 ===
    let bingReason: string
    if (KE[d] === dayGanWuxing) {
      bingReason = `${d}克日主${dayGanWuxing}，官杀太旺克身（${d}旺${diseaseCount}个 vs 日主${dayGanWuxing}${dayGanCount}个），故${d}为病`
    } else if (diseaseCount >= 3) {
      bingReason = `${d}旺${diseaseCount}个过盛（超过平衡阈值3），五行失衡克破日主${dayGanWuxing}，故${d}为病`
    } else {
      bingReason = `${d}偏旺（${diseaseCount}个）影响日主${dayGanWuxing}（${dayGanCount}个），破坏格局平衡，故${d}为病`
    }
    evidence.push({
      step: 'S3-病因分析',
      text: `病因：${bingReason}`,
      satisfied: true,
      citation: '《三命通会》论病药',
    })

    // === S4-药因分析：为什么这个五行是药 ===
    evidence.push({
      step: 'S4-药因分析',
      text: `药因：${keBing}克病(${d})，${keBing}能制病救主，故${keBing}为正药；${bingSheng}泄${d}之气，为辅药；${shengBing}生${d}助病，为忌`,
      satisfied: true,
      citation: '《子平真诠》病药说',
    })

    // === S5-药力 vs 病力 ===
    const yaoLi = count[keBing]
    const bingLi = diseaseCount
    const yaoEnough = yaoLi >= bingLi
    evidence.push({
      step: 'S5-药力vs病力',
      text: `药力(${keBing}=${yaoLi}) vs 病力(${d}=${bingLi})：${yaoEnough ? '药足够制病' : '药不足制病，须助其药'}`,
      satisfied: yaoEnough,
      citation: '《三命通会》论病药',
    })

    // === S6-药过度检测：药过反成病 ===
    const yaoOver = yaoLi > bingLi + 2
    evidence.push({
      step: 'S6-药过度检测',
      text: yaoOver
        ? `药过度：药${keBing}=${yaoLi}超过病${d}+2(${bingLi + 2})，药过反成病，须助其病`
        : `药力度：药${keBing}=${yaoLi}未超过病${d}+2(${bingLi + 2})，药未过度`,
      satisfied: !yaoOver,
      citation: '《三命通会》论病药',
    })

    // === S7-通关需求：病药交战需调和 ===
    const needBridge = bingLi >= 2 && yaoLi >= 2
    evidence.push({
      step: 'S7-通关需求',
      text: needBridge
        ? `病药两旺交战（病${d}=${bingLi}, 药${keBing}=${yaoLi}），病药交战需通关调和`
        : `病药未两旺交战（病${d}=${bingLi}, 药${keBing}=${yaoLi}），无需通关`,
      satisfied: needBridge,
      citation: '《滴天髓》通关篇',
    })

    // === S8-调候需求：病与气候相关需调候 ===
    let needTiaohou = false
    let tiaohouText: string
    if (isWinterBorn && d === '水') {
      needTiaohou = true
      tiaohouText = `冬月水旺为病，病与气候（寒）相关，需调候暖局`
    } else if (isSummerBorn && d === '火') {
      needTiaohou = true
      tiaohouText = `夏月火炎为病，病与气候（热）相关，需调候凉局`
    } else if (isWinterBorn) {
      tiaohouText = `冬月生人，病(${d})与寒气相关，宜兼察调候`
    } else if (isSummerBorn) {
      tiaohouText = `夏月生人，病(${d})与热气相关，宜兼察调候`
    } else {
      tiaohouText = `病(${d})与气候无直接关联，无需调候`
    }
    evidence.push({
      step: 'S8-调候需求',
      text: `调候：${tiaohouText}`,
      satisfied: needTiaohou,
      citation: '《穷通宝鉴》寒暖论',
    })

    // === S9-病药打分 ===
    score[keBing] = 2
    score[bingSheng] = 1
    score[d] = -2
    score[shengBing] = -1

    evidence.push({
      step: 'S9-病药打分',
      text: `药神(${keBing}):+2 辅药(${bingSheng}):+1 病(${d}):-2 助病(${shengBing}):-1`,
      satisfied: true,
      citation: '《子平真诠》病药说',
    })

    const classicEvidence: ClassicEvidenceRef[] = [
      {
        classicId: 'smth', classicName: '三命通会', chapterId: 'smth-c2', chapterTitle: '论病药',
        paragraphId: 'smth-c2-p2', sentenceId: 'smth-c2-p2-s1',
        quotedText: '有病方为贵，无伤不是奇；有病有药，方为好命。',
        citation: 'direct', supports: '病药法核心原则', hasControversy: false,
      },
      {
        classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c2', chapterTitle: '病药说',
        paragraphId: 'zpzq-c2-p2', sentenceId: 'zpzq-c2-p2-s1',
        quotedText: '病与药，一对也；有病必有药，药到病除，方为好命。',
        citation: 'direct', supports: '有病必有药', hasControversy: false,
      },
      {
        classicId: 'smth', classicName: '三命通会', chapterId: 'smth-c2', chapterTitle: '论病药',
        paragraphId: 'smth-c2-p2', sentenceId: 'smth-c2-p2-s2',
        quotedText: '病重药轻，须助其药；病轻药重，须助其病。',
        citation: 'direct', supports: '病药轻重调节', hasControversy: false,
      },
    ]

    const summaryParts = [
      `病=${d}(${bingLi})`,
      `药=${keBing}(${yaoLi})`,
      yaoOver ? '药过反成病' : (yaoEnough ? '药足够' : '药不足'),
      needBridge ? '需通关' : '无需通关',
      needTiaohou ? '需调候' : '无需调候',
    ]

    return {
      engineName: this.name,
      applicable: true,
      scores: score,
      evidence,
      classicEvidence,
      confidence: 0.75,
      weight: 0.15,
      summary: `病药：${summaryParts.join(' ')}`,
    }
  }
}
