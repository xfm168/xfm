import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
function emptyScore(): Record<Wuxing, number> { return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 } }

/**
 * MedicineEngine（病药体系引擎）
 *
 * 病神 = 过旺或克破日主的五行。
 * 药神 = 克病神或泄病神的五行。
 *
 * 经典依据：《三命通会》论病药 + 《子平真诠》病药说
 */
export class MedicineEngine implements SubEngine {
  readonly name = 'MedicineEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { diseaseWuxing, count, dayGanWuxing } = input
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

    evidence.push({
      step: 'S3-确定药神',
      text: `病在${d} 克病者=${keBing}(正药) 泄病者=${bingSheng}(辅药) 生病者=${shengBing}(忌)`,
      satisfied: true,
      citation: '《三命通会》论病药',
    })

    score[keBing] = 2
    score[bingSheng] = 1
    score[d] = -2
    score[shengBing] = -1

    evidence.push({
      step: 'S4-病药打分',
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

    return {
      engineName: this.name,
      applicable: true,
      scores: score,
      evidence,
      classicEvidence,
      confidence: 0.75,
      weight: 0.15,
      summary: `病药：病=${d} 药=${keBing}(克) ${bingSheng}(泄)`,
    }
  }
}
