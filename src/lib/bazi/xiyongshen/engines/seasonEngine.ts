import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
function emptyScore(): Record<Wuxing, number> { return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 } }

/**
 * SeasonEngine（寒暖燥湿体系引擎）
 *
 * 合并寒暖法和燥湿法：
 * - 寒暖：过寒需火暖，过暖需水寒
 * - 燥湿：过燥需水润，过湿需土燥
 *
 * 经典依据：《穷通宝鉴》寒暖论 + 燥湿论 + 《三命通会》
 */
export class SeasonEngine implements SubEngine {
  readonly name = 'SeasonEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { isWinterBorn, isSummerBorn, isWetSeason, isDrySeason, monthZhiWuxing, count } = input
    const score = emptyScore()
    const evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

    // === 寒暖法 ===
    evidence.push({
      step: 'S1-判定寒暖',
      text: `月令=${monthZhiWuxing} 冬生=${isWinterBorn} 夏生=${isSummerBorn} 火=${count['火']} 水=${count['水']}`,
      satisfied: true,
      citation: '《穷通宝鉴》寒暖论',
    })

    let hanNuanApplied = false
    if (isWinterBorn) {
      evidence.push({
        step: 'S2-过寒需暖',
        text: '生于冬季 水旺火弱 过寒 需火暖之',
        satisfied: true,
        citation: '《穷通宝鉴》寒暖论',
      })
      score['火'] = Math.max(score['火'], 2); score['木'] = Math.max(score['木'], 1); score['水'] = Math.min(score['水'], -2)
      hanNuanApplied = true
    } else if (isSummerBorn) {
      evidence.push({
        step: 'S2-过暖需寒',
        text: '生于夏季 火炎水涸 过暖 需水寒之',
        satisfied: true,
        citation: '《穷通宝鉴》寒暖论',
      })
      score['水'] = Math.max(score['水'], 2); score['金'] = Math.max(score['金'], 1); score['火'] = Math.min(score['火'], -2)
      hanNuanApplied = true
    } else {
      const huoCount = count['火']
      const shuiCount = count['水']
      if (huoCount >= 3) {
        evidence.push({ step: 'S2-火多偏暖', text: `火=${huoCount}个 偏暖 需水寒`, satisfied: true, citation: '《三命通会》' })
        score['水'] = Math.max(score['水'], 1); score['火'] = Math.min(score['火'], -1)
        hanNuanApplied = true
      } else if (shuiCount >= 3) {
        evidence.push({ step: 'S2-水多偏寒', text: `水=${shuiCount}个 偏寒 需火暖`, satisfied: true, citation: '《三命通会》' })
        score['火'] = Math.max(score['火'], 1); score['水'] = Math.min(score['水'], -1)
        hanNuanApplied = true
      } else {
        evidence.push({ step: 'S2-寒暖适中', text: '非冬非夏 水火相当 寒暖法无强制', satisfied: false, citation: '《三命通会》' })
      }
    }

    // === 燥湿法 ===
    evidence.push({
      step: 'S3-判定燥湿',
      text: `月令=${monthZhiWuxing} 燥月=${isDrySeason} 湿月=${isWetSeason} 土=${count['土']} 水=${count['水']}`,
      satisfied: true,
      citation: '《穷通宝鉴》燥湿论',
    })

    let zaoShiApplied = false
    if (isDrySeason) {
      evidence.push({
        step: 'S4-过燥需湿',
        text: '生于戌未月或火旺土燥 过燥 需水润泽',
        satisfied: true,
        citation: '《穷通宝鉴》燥湿论',
      })
      score['水'] = Math.max(score['水'], 2); score['金'] = Math.max(score['金'], 1); score['土'] = Math.min(score['土'], -1); score['火'] = Math.min(score['火'], -1)
      zaoShiApplied = true
    } else if (isWetSeason) {
      evidence.push({
        step: 'S4-过湿需燥',
        text: '生于辰丑月或水多土湿 过湿 需燥土暖之',
        satisfied: true,
        citation: '《穷通宝鉴》燥湿论',
      })
      score['土'] = Math.max(score['土'], 2); score['火'] = Math.max(score['火'], 1); score['水'] = Math.min(score['水'], -2); score['金'] = Math.min(score['金'], -1)
      zaoShiApplied = true
    } else {
      const tuCount = count['土']
      const shuiCount = count['水']
      if (tuCount >= 3 && shuiCount <= 1) {
        evidence.push({ step: 'S4-土多偏燥', text: `土=${tuCount}水=${shuiCount} 偏燥 需水`, satisfied: true, citation: '《三命通会》' })
        score['水'] = Math.max(score['水'], 1); score['土'] = Math.min(score['土'], -1)
        zaoShiApplied = true
      } else if (shuiCount >= 3 && tuCount <= 1) {
        evidence.push({ step: 'S4-水多偏湿', text: `水=${shuiCount}土=${tuCount} 偏湿 需土`, satisfied: true, citation: '《三命通会》' })
        score['土'] = Math.max(score['土'], 1); score['水'] = Math.min(score['水'], -1)
        zaoShiApplied = true
      } else {
        evidence.push({ step: 'S4-燥湿适中', text: '非湿月燥月 水土相当 燥湿法无特殊用神', satisfied: false, citation: '《三命通会》' })
      }
    }

    evidence.push({
      step: 'S5-寒暖燥湿综合打分',
      text: `木:${score['木']} 火:${score['火']} 土:${score['土']} 金:${score['金']} 水:${score['水']}`,
      satisfied: true,
      citation: '《穷通宝鉴》',
    })

    const classicEvidence: ClassicEvidenceRef[] = [
      {
        classicId: 'qtbj', classicName: '穷通宝鉴', chapterId: 'qtbj-c2', chapterTitle: '寒暖论',
        paragraphId: 'qtbj-c2-p1', sentenceId: 'qtbj-c2-p1-s1',
        quotedText: '生于亥子丑月，天寒地冻，非火不暖。',
        citation: 'direct', supports: '寒暖法冬月用火', hasControversy: false,
      },
      {
        classicId: 'qtbj', classicName: '穷通宝鉴', chapterId: 'qtbj-c3', chapterTitle: '燥湿论',
        paragraphId: 'qtbj-c3-p1', sentenceId: 'qtbj-c3-p1-s1',
        quotedText: '过燥需水润泽，过湿需土燥之。',
        citation: 'direct', supports: '燥湿法核心原则', hasControversy: false,
      },
      {
        classicId: 'smth', classicName: '三命通会', chapterId: 'smth-c2', chapterTitle: '论寒暖燥湿',
        paragraphId: 'smth-c2-p3', sentenceId: 'smth-c2-p3-s2',
        quotedText: '寒暖燥湿，各有其宜，过则需调。',
        citation: 'direct', supports: '寒暖燥湿需调', hasControversy: false,
      },
    ]

    const applicable = hanNuanApplied || zaoShiApplied

    return {
      engineName: this.name,
      applicable,
      skipReason: applicable ? undefined : '寒暖燥湿均适中',
      scores: score,
      evidence,
      classicEvidence,
      confidence: 0.7,
      weight: 0.2, // 寒暖0.1 + 燥湿0.1 合并
      summary: `寒暖燥湿：${hanNuanApplied ? '寒暖已调' : '寒暖适中'} ${zaoShiApplied ? '燥湿已调' : '燥湿适中'}`,
    }
  }
}
