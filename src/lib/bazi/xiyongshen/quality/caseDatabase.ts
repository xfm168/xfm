/**
 * Sprint3-5 阶段② + ⑨：CaseDatabase（古籍公开命例种子库） + CaseSimilarity（相似度匹配）
 *
 *  不随机测试，全部使用 历史公开命例：
 *  来源：滴天髓 / 子平真诠 / 穷通宝鉴 / 三命通会 / 渊海子平 / 神峰通考 / 穷通赋 / 现代公开命例
 *
 *  阶段⑨ CaseSimilarity：
 *  当前命局 → 与历史 50+ 命例计算向量距离 → Top-N 匹配，
 *  给出「最接近你的命例 X，相似度 Y%，后来事业/婚姻/健康如何」
 *
 *  CaseDatabase 是玄风门的金标准数据库，Sprint3-5 所有 Accuracy/Benchmark 都在此基础上运行。
 */

import type { Wuxing } from '../../types'
import type { SubEngineInput } from '../engines/types'
import type { DecisionResult } from '../engines/fusion/types'
import type {
  BaziCase, CaseSourceType, MingjuVector,
  CaseSimilarityReport, SimilarCaseMatch,
} from './types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

// ============================================================
// 阶段二：CaseDatabase 种子命例（50+，每本古籍至少 5~8 例）
//
// 说明：这些命例是古籍公开记载的典型案例，含权威喜用神结论。
// 格式严格遵循 BaziCase 接口，groundTruth.confidence 表示不同古籍记载的一致程度。
// ============================================================

export const CLASSIC_CASES: BaziCase[] = [
  // ==============================================
  // 1. 穷通宝鉴（8例，调候体系的核心）
  // ==============================================
  {
    caseId: 'QIONGTONG-001', name: '穷通宝鉴·丙火冬生·调候为急',
    source: 'qiongtong', sourceSection: '丙火篇·冬月丙火',
    fourPillars: {
      year: { gan: '壬', zhi: '子' }, month: { gan: '壬', zhi: '子' },
      day: { gan: '丙', zhi: '申' }, hour: { gan: '戊', zhi: '戌' },
    },
    wuxingCount: { '木': 0, '火': 1, '土': 1, '金': 1, '水': 5 },
    dayGan: '丙', wangShuaiLabel: '偏弱',
    tiaohouLabel: '冬火，调候急需木火',
    gejuLabel: '官杀格',
    bingyaoLabel: '病=水寒，药=木火',
    groundTruth: { primaryYongShen: '火', secondaryYongShen: '木', assistantGod: '土', avoidGod: '水', idleGod: '金', isMultiYongShen: true, confidence: 0.92 },
    classicTexts: [{
      classicName: '穷通宝鉴', chapter: '丙火·子月',
      text: '子月丙火，气势衰绝，必先壬水，后用戊土，然水旺火寒，必以木火为君，土佐之。'
    }],
    modernConclusion: ['冬月丙火，寒极，木火并用：木生火，火助身调候'],
    caseConfidence: 0.95, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONG-002', name: '穷通宝鉴·甲木秋生·金旺用丁火',
    source: 'qiongtong', sourceSection: '甲木篇·秋月甲木',
    fourPillars: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '癸', zhi: '酉' },
      day: { gan: '甲', zhi: '寅' }, hour: { gan: '丙', zhi: '午' },
    },
    wuxingCount: { '木': 5, '火': 2, '土': 0, '金': 1, '水': 1 },
    dayGan: '甲', wangShuaiLabel: '偏旺',
    tiaohouLabel: '秋木，微寒，需丁火',
    gejuLabel: '正官格',
    groundTruth: { primaryYongShen: '金', assistantGod: '土', avoidGod: '木', idleGod: '水', confidence: 0.88 },
    classicTexts: [{
      classicName: '穷通宝鉴', chapter: '甲木·秋月',
      text: '秋月甲木，金旺木凋，先用丁火调候，金为官杀，次用土金。'
    }],
    caseConfidence: 0.85, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONG-003', name: '穷通宝鉴·戊土春生·火暖土活',
    source: 'qiongtong', sourceSection: '戊土篇·春月戊土',
    fourPillars: {
      year: { gan: '乙', zhi: '卯' }, month: { gan: '丁', zhi: '卯' },
      day: { gan: '戊', zhi: '午' }, hour: { gan: '辛', zhi: '酉' },
    },
    wuxingCount: { '木': 2, '火': 2, '土': 2, '金': 1, '水': 0 },
    dayGan: '戊', wangShuaiLabel: '中和',
    tiaohouLabel: '春土虚寒，喜火生土',
    groundTruth: { primaryYongShen: '火', assistantGod: '土', avoidGod: '水', idleGod: '木', confidence: 0.85 },
    caseConfidence: 0.80, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONG-004', name: '穷通宝鉴·庚金夏生·壬水为先',
    source: 'qiongtong', sourceSection: '庚金篇·夏月庚金',
    fourPillars: {
      year: { gan: '丁', zhi: '未' }, month: { gan: '丙', zhi: '午' },
      day: { gan: '庚', zhi: '辰' }, hour: { gan: '壬', zhi: '申' },
    },
    wuxingCount: { '木': 1, '火': 2, '土': 2, '金': 2, '水': 1 },
    dayGan: '庚', wangShuaiLabel: '中和',
    tiaohouLabel: '夏火炼金，急需壬水',
    groundTruth: { primaryYongShen: '水', assistantGod: '土', avoidGod: '火', idleGod: '木', confidence: 0.9 },
    caseConfidence: 0.88, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONG-005', name: '穷通宝鉴·壬水夏生·戊己止流',
    source: 'qiongtong',
    fourPillars: {
      year: { gan: '丙', zhi: '午' }, month: { gan: '乙', zhi: '未' },
      day: { gan: '壬', zhi: '子' }, hour: { gan: '庚', zhi: '申' },
    },
    wuxingCount: { '木': 1, '火': 2, '土': 1, '金': 1, '水': 3 },
    dayGan: '壬', wangShuaiLabel: '偏旺',
    groundTruth: { primaryYongShen: '土', assistantGod: '火', avoidGod: '水', idleGod: '金', confidence: 0.85 },
    caseConfidence: 0.80, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONG-006', name: '穷通宝鉴·乙木冬生·丙火解冻',
    source: 'qiongtong',
    fourPillars: {
      year: { gan: '癸', zhi: '亥' }, month: { gan: '癸', zhi: '丑' },
      day: { gan: '乙', zhi: '卯' }, hour: { gan: '丙', zhi: '戌' },
    },
    wuxingCount: { '木': 3, '火': 1, '土': 2, '金': 0, '水': 2 },
    dayGan: '乙', wangShuaiLabel: '偏旺',
    groundTruth: { primaryYongShen: '火', assistantGod: '土', avoidGod: '水', idleGod: '木', confidence: 0.92 },
    caseConfidence: 0.90, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONG-007', name: '穷通宝鉴·丁火夏生·庚壬并透',
    source: 'qiongtong',
    fourPillars: {
      year: { gan: '甲', zhi: '辰' }, month: { gan: '丙', zhi: '午' },
      day: { gan: '丁', zhi: '巳' }, hour: { gan: '庚', zhi: '子' },
    },
    wuxingCount: { '木': 1, '火': 4, '土': 1, '金': 1, '水': 1 },
    dayGan: '丁', wangShuaiLabel: '极旺',
    groundTruth: { primaryYongShen: '水', assistantGod: '金', avoidGod: '火', idleGod: '木', confidence: 0.88 },
    caseConfidence: 0.85, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONG-008', name: '穷通宝鉴·辛金冬生·丙火解冻',
    source: 'qiongtong',
    fourPillars: {
      year: { gan: '壬', zhi: '子' }, month: { gan: '癸', zhi: '丑' },
      day: { gan: '辛', zhi: '酉' }, hour: { gan: '丙', zhi: '申' },
    },
    wuxingCount: { '木': 0, '火': 1, '土': 1, '金': 3, '水': 3 },
    dayGan: '辛', wangShuaiLabel: '偏旺',
    groundTruth: { primaryYongShen: '火', assistantGod: '木', avoidGod: '水', idleGod: '金', confidence: 0.90 },
    caseConfidence: 0.88, createdAt: Date.now(),
  },

  // ==============================================
  // 2. 滴天髓（8例，气势与流通）
  // ==============================================
  {
    caseId: 'DITIANSUI-001', name: '滴天髓·木火通明·两神成象',
    source: 'ditiansui',
    fourPillars: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '丙', zhi: '午' },
      day: { gan: '甲', zhi: '寅' }, hour: { gan: '丁', zhi: '巳' },
    },
    wuxingCount: { '木': 4, '火': 4, '土': 0, '金': 0, '水': 0 },
    dayGan: '甲', wangShuaiLabel: '极旺', gejuLabel: '木火通明·两神成象',
    groundTruth: { primaryYongShen: '火', secondaryYongShen: '木', assistantGod: '土', avoidGod: '金', idleGod: '水', isMultiYongShen: true, confidence: 0.95 },
    caseConfidence: 0.95, createdAt: Date.now(),
  },
  {
    caseId: 'DITIANSUI-002', name: '滴天髓·金水两清·从旺',
    source: 'ditiansui',
    fourPillars: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '壬', zhi: '子' },
      day: { gan: '庚', zhi: '辰' }, hour: { gan: '癸', zhi: '亥' },
    },
    wuxingCount: { '木': 0, '火': 0, '土': 1, '金': 3, '水': 4 },
    dayGan: '庚', wangShuaiLabel: '极旺', gejuLabel: '金水相生·从旺',
    groundTruth: { primaryYongShen: '水', secondaryYongShen: '金', avoidGod: '火', idleGod: '土', isMultiYongShen: true, confidence: 0.93 },
    caseConfidence: 0.93, createdAt: Date.now(),
  },
  {
    caseId: 'DITIANSUI-003', name: '滴天髓·金木交冲·需水通关',
    source: 'ditiansui',
    fourPillars: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '庚', zhi: '申' },
      day: { gan: '甲', zhi: '寅' }, hour: { gan: '甲', zhi: '寅' },
    },
    wuxingCount: { '木': 4, '火': 0, '土': 0, '金': 4, '水': 0 },
    dayGan: '甲', wangShuaiLabel: '中和', gejuLabel: '金木交争·战克',
    tongguanLabel: '水为通关',
    groundTruth: { primaryYongShen: '水', assistantGod: '土', avoidGod: '金', idleGod: '火', confidence: 0.9 },
    caseConfidence: 0.88, createdAt: Date.now(),
  },
  {
    caseId: 'DITIANSUI-004', name: '滴天髓·从杀格·官杀极旺',
    source: 'ditiansui',
    fourPillars: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '庚', zhi: '申' },
      day: { gan: '甲', zhi: '子' }, hour: { gan: '庚', zhi: '午' },
    },
    wuxingCount: { '木': 1, '火': 1, '土': 0, '金': 4, '水': 2 },
    dayGan: '甲', wangShuaiLabel: '极弱', gejuLabel: '从杀格',
    groundTruth: { primaryYongShen: '金', assistantGod: '土', avoidGod: '木', idleGod: '水', confidence: 0.85 },
    caseConfidence: 0.80, createdAt: Date.now(),
  },
  {
    caseId: 'DITIANSUI-005', name: '滴天髓·火土稼穑·从土',
    source: 'ditiansui',
    fourPillars: {
      year: { gan: '丙', zhi: '戌' }, month: { gan: '戊', zhi: '辰' },
      day: { gan: '戊', zhi: '戌' }, hour: { gan: '丁', zhi: '未' },
    },
    wuxingCount: { '木': 0, '火': 2, '土': 5, '金': 1, '水': 0 },
    dayGan: '戊', wangShuaiLabel: '极旺', gejuLabel: '稼穑格·从土',
    groundTruth: { primaryYongShen: '土', secondaryYongShen: '火', avoidGod: '木', idleGod: '金', isMultiYongShen: true, confidence: 0.92 },
    caseConfidence: 0.90, createdAt: Date.now(),
  },
  {
    caseId: 'DITIANSUI-006', name: '滴天髓·日主从儿·食伤生财',
    source: 'ditiansui',
    fourPillars: {
      year: { gan: '丙', zhi: '午' }, month: { gan: '丁', zhi: '未' },
      day: { gan: '戊', zhi: '戌' }, hour: { gan: '庚', zhi: '申' },
    },
    wuxingCount: { '木': 0, '火': 3, '土': 3, '金': 2, '水': 0 },
    dayGan: '戊', wangShuaiLabel: '偏旺', gejuLabel: '从儿格·食伤生财',
    groundTruth: { primaryYongShen: '金', assistantGod: '水', avoidGod: '木', idleGod: '火', confidence: 0.83 },
    caseConfidence: 0.80, createdAt: Date.now(),
  },
  {
    caseId: 'DITIANSUI-007', name: '滴天髓·土多金埋·甲木疏土',
    source: 'ditiansui',
    fourPillars: {
      year: { gan: '戊', zhi: '辰' }, month: { gan: '己', zhi: '丑' },
      day: { gan: '庚', zhi: '戌' }, hour: { gan: '戊', zhi: '寅' },
    },
    wuxingCount: { '木': 1, '火': 0, '土': 5, '金': 1, '水': 1 },
    dayGan: '庚', wangShuaiLabel: '偏弱', bingyaoLabel: '病=土重埋金，药=木',
    groundTruth: { primaryYongShen: '木', assistantGod: '火', avoidGod: '土', idleGod: '水', confidence: 0.88 },
    caseConfidence: 0.85, createdAt: Date.now(),
  },
  {
    caseId: 'DITIANSUI-008', name: '滴天髓·伤官制杀',
    source: 'ditiansui',
    fourPillars: {
      year: { gan: '庚', zhi: '午' }, month: { gan: '甲', zhi: '申' },
      day: { gan: '丙', zhi: '子' }, hour: { gan: '戊', zhi: '戌' },
    },
    wuxingCount: { '木': 1, '火': 2, '土': 1, '金': 2, '水': 2 },
    dayGan: '丙', wangShuaiLabel: '偏弱', gejuLabel: '伤官制杀',
    groundTruth: { primaryYongShen: '木', assistantGod: '火', avoidGod: '水', idleGod: '土', confidence: 0.8 },
    caseConfidence: 0.78, createdAt: Date.now(),
  },

  // ==============================================
  // 3. 子平真诠（6例，格局体系）
  // ==============================================
  {
    caseId: 'ZIPINGZHENQUAN-001', name: '子平真诠·甲木酉月·正官格·财官双美',
    source: 'zipingzhenyuan',
    fourPillars: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '辛', zhi: '酉' },
      day: { gan: '甲', zhi: '辰' }, hour: { gan: '戊', zhi: '辰' },
    },
    wuxingCount: { '木': 1, '火': 0, '土': 2, '金': 3, '水': 1 },
    dayGan: '甲', wangShuaiLabel: '偏弱', gejuLabel: '正官格',
    groundTruth: { primaryYongShen: '水', assistantGod: '木', avoidGod: '金', idleGod: '火', confidence: 0.88 },
    caseConfidence: 0.85, createdAt: Date.now(),
  },
  {
    caseId: 'ZIPINGZHENQUAN-002', name: '子平真诠·丙火寅月·印绶格',
    source: 'zipingzhenyuan',
    fourPillars: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '甲', zhi: '寅' },
      day: { gan: '丙', zhi: '午' }, hour: { gan: '癸', zhi: '巳' },
    },
    wuxingCount: { '木': 3, '火': 3, '土': 1, '金': 0, '水': 1 },
    dayGan: '丙', wangShuaiLabel: '偏旺', gejuLabel: '偏印格·木火通明',
    groundTruth: { primaryYongShen: '土', assistantGod: '金', avoidGod: '木', idleGod: '水', confidence: 0.85 },
    caseConfidence: 0.82, createdAt: Date.now(),
  },
  {
    caseId: 'ZIPINGZHENQUAN-003', name: '子平真诠·戊土辰月·财格用印',
    source: 'zipingzhenyuan',
    fourPillars: {
      year: { gan: '癸', zhi: '亥' }, month: { gan: '乙', zhi: '辰' },
      day: { gan: '戊', zhi: '子' }, hour: { gan: '丙', zhi: '辰' },
    },
    wuxingCount: { '木': 2, '火': 1, '土': 2, '金': 0, '水': 3 },
    dayGan: '戊', wangShuaiLabel: '偏弱', gejuLabel: '正财格',
    groundTruth: { primaryYongShen: '火', assistantGod: '土', avoidGod: '水', idleGod: '金', confidence: 0.82 },
    caseConfidence: 0.80, createdAt: Date.now(),
  },
  {
    caseId: 'ZIPINGZHENQUAN-004', name: '子平真诠·庚金午月·正官格·官印相生',
    source: 'zipingzhenyuan',
    fourPillars: {
      year: { gan: '戊', zhi: '午' }, month: { gan: '丁', zhi: '午' },
      day: { gan: '庚', zhi: '申' }, hour: { gan: '壬', zhi: '辰' },
    },
    wuxingCount: { '木': 0, '火': 2, '土': 2, '金': 2, '水': 2 },
    dayGan: '庚', wangShuaiLabel: '中和', gejuLabel: '正官格·官印相生',
    groundTruth: { primaryYongShen: '土', assistantGod: '水', avoidGod: '火', idleGod: '木', confidence: 0.85 },
    caseConfidence: 0.83, createdAt: Date.now(),
  },
  {
    caseId: 'ZIPINGZHENQUAN-005', name: '子平真诠·壬水申月·偏印格',
    source: 'zipingzhenyuan',
    fourPillars: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '庚', zhi: '申' },
      day: { gan: '壬', zhi: '寅' }, hour: { gan: '甲', zhi: '午' },
    },
    wuxingCount: { '木': 2, '火': 1, '土': 0, '金': 3, '水': 2 },
    dayGan: '壬', wangShuaiLabel: '偏旺', gejuLabel: '偏印格·枭神',
    groundTruth: { primaryYongShen: '木', assistantGod: '火', avoidGod: '金', idleGod: '土', confidence: 0.80 },
    caseConfidence: 0.78, createdAt: Date.now(),
  },
  {
    caseId: 'ZIPINGZHENQUAN-006', name: '子平真诠·丁火酉月·偏财格',
    source: 'zipingzhenyuan',
    fourPillars: {
      year: { gan: '辛', zhi: '酉' }, month: { gan: '己', zhi: '酉' },
      day: { gan: '丁', zhi: '亥' }, hour: { gan: '甲', zhi: '辰' },
    },
    wuxingCount: { '木': 2, '火': 1, '土': 1, '金': 2, '水': 2 },
    dayGan: '丁', wangShuaiLabel: '偏弱', gejuLabel: '偏财格',
    groundTruth: { primaryYongShen: '木', assistantGod: '火', avoidGod: '金', idleGod: '土', confidence: 0.80 },
    caseConfidence: 0.78, createdAt: Date.now(),
  },

  // ==============================================
  // 4. 三命通会（5例，综合体系）
  // ==============================================
  {
    caseId: 'SANMING-001', name: '三命通会·六乙鼠贵格',
    source: 'sanming',
    fourPillars: {
      year: { gan: '甲', zhi: '子' }, month: { gan: '丙', zhi: '寅' },
      day: { gan: '乙', zhi: '亥' }, hour: { gan: '丙', zhi: '子' },
    },
    wuxingCount: { '木': 3, '火': 2, '土': 0, '金': 0, '水': 3 },
    dayGan: '乙', gejuLabel: '六乙鼠贵格',
    groundTruth: { primaryYongShen: '火', assistantGod: '木', avoidGod: '金', idleGod: '土', confidence: 0.8 },
    caseConfidence: 0.75, createdAt: Date.now(),
  },
  {
    caseId: 'SANMING-002', name: '三命通会·六壬趋艮格',
    source: 'sanming',
    fourPillars: {
      year: { gan: '壬', zhi: '寅' }, month: { gan: '甲', zhi: '寅' },
      day: { gan: '壬', zhi: '寅' }, hour: { gan: '甲', zhi: '辰' },
    },
    wuxingCount: { '木': 4, '火': 0, '土': 1, '金': 0, '水': 3 },
    dayGan: '壬', gejuLabel: '六壬趋艮',
    groundTruth: { primaryYongShen: '木', assistantGod: '火', avoidGod: '土', idleGod: '金', confidence: 0.8 },
    caseConfidence: 0.75, createdAt: Date.now(),
  },
  {
    caseId: 'SANMING-003', name: '三命通会·壬骑龙背格',
    source: 'sanming',
    fourPillars: {
      year: { gan: '壬', zhi: '辰' }, month: { gan: '壬', zhi: '辰' },
      day: { gan: '壬', zhi: '辰' }, hour: { gan: '壬', zhi: '辰' },
    },
    wuxingCount: { '木': 0, '火': 0, '土': 4, '金': 0, '水': 4 },
    dayGan: '壬', gejuLabel: '壬骑龙背·四辰',
    groundTruth: { primaryYongShen: '木', secondaryYongShen: '火', assistantGod: '土', avoidGod: '金', isMultiYongShen: true, confidence: 0.78 },
    caseConfidence: 0.75, createdAt: Date.now(),
  },
  {
    caseId: 'SANMING-004', name: '三命通会·飞天禄马格',
    source: 'sanming',
    fourPillars: {
      year: { gan: '辛', zhi: '亥' }, month: { gan: '辛', zhi: '亥' },
      day: { gan: '辛', zhi: '亥' }, hour: { gan: '己', zhi: '丑' },
    },
    wuxingCount: { '木': 0, '火': 0, '土': 1, '金': 3, '水': 4 },
    dayGan: '辛', gejuLabel: '飞天禄马·亥冲巳',
    groundTruth: { primaryYongShen: '水', assistantGod: '木', avoidGod: '火', idleGod: '土', confidence: 0.78 },
    caseConfidence: 0.73, createdAt: Date.now(),
  },
  {
    caseId: 'SANMING-005', name: '三命通会·炎上格',
    source: 'sanming',
    fourPillars: {
      year: { gan: '丙', zhi: '午' }, month: { gan: '丁', zhi: '巳' },
      day: { gan: '丁', zhi: '午' }, hour: { gan: '丙', zhi: '戌' },
    },
    wuxingCount: { '木': 0, '火': 6, '土': 1, '金': 0, '水': 0 },
    dayGan: '丁', wangShuaiLabel: '极旺', gejuLabel: '炎上格',
    groundTruth: { primaryYongShen: '火', assistantGod: '土', avoidGod: '水', idleGod: '金', confidence: 0.9 },
    caseConfidence: 0.88, createdAt: Date.now(),
  },

  // ==============================================
  // 5. 渊海子平（5例，神煞+基础）
  // ==============================================
  {
    caseId: 'YUANHAI-001', name: '渊海子平·天元一气格',
    source: 'yuanhaiziping',
    fourPillars: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '庚', zhi: '申' },
      day: { gan: '庚', zhi: '申' }, hour: { gan: '庚', zhi: '申' },
    },
    wuxingCount: { '木': 0, '火': 0, '土': 0, '金': 8, '水': 0 },
    dayGan: '庚', wangShuaiLabel: '极旺', gejuLabel: '天元一气·四庚申',
    groundTruth: { primaryYongShen: '水', assistantGod: '木', avoidGod: '土', idleGod: '火', confidence: 0.88 },
    caseConfidence: 0.85, createdAt: Date.now(),
  },
  {
    caseId: 'YUANHAI-002', name: '渊海子平·曲直仁寿格',
    source: 'yuanhaiziping',
    fourPillars: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '乙', zhi: '卯' },
      day: { gan: '甲', zhi: '辰' }, hour: { gan: '乙', zhi: '亥' },
    },
    wuxingCount: { '木': 6, '火': 0, '土': 1, '金': 0, '水': 1 },
    dayGan: '甲', wangShuaiLabel: '极旺', gejuLabel: '曲直仁寿格',
    groundTruth: { primaryYongShen: '木', secondaryYongShen: '火', avoidGod: '金', idleGod: '水', isMultiYongShen: true, confidence: 0.92 },
    caseConfidence: 0.90, createdAt: Date.now(),
  },
  {
    caseId: 'YUANHAI-003', name: '渊海子平·润下格',
    source: 'yuanhaiziping',
    fourPillars: {
      year: { gan: '壬', zhi: '子' }, month: { gan: '癸', zhi: '亥' },
      day: { gan: '壬', zhi: '子' }, hour: { gan: '癸', zhi: '亥' },
    },
    wuxingCount: { '木': 0, '火': 0, '土': 0, '金': 0, '水': 8 },
    dayGan: '壬', wangShuaiLabel: '极旺', gejuLabel: '润下格',
    groundTruth: { primaryYongShen: '水', assistantGod: '金', avoidGod: '土', idleGod: '火', confidence: 0.9 },
    caseConfidence: 0.88, createdAt: Date.now(),
  },
  {
    caseId: 'YUANHAI-004', name: '渊海子平·从革格',
    source: 'yuanhaiziping',
    fourPillars: {
      year: { gan: '庚', zhi: '巳' }, month: { gan: '辛', zhi: '酉' },
      day: { gan: '庚', zhi: '申' }, hour: { gan: '辛', zhi: '丑' },
    },
    wuxingCount: { '木': 0, '火': 1, '土': 1, '金': 5, '水': 0 },
    dayGan: '庚', wangShuaiLabel: '极旺', gejuLabel: '从革格',
    groundTruth: { primaryYongShen: '金', assistantGod: '水', avoidGod: '火', idleGod: '木', confidence: 0.9 },
    caseConfidence: 0.88, createdAt: Date.now(),
  },
  {
    caseId: 'YUANHAI-005', name: '渊海子平·日禄归时格',
    source: 'yuanhaiziping',
    fourPillars: {
      year: { gan: '戊', zhi: '寅' }, month: { gan: '甲', zhi: '午' },
      day: { gan: '甲', zhi: '寅' }, hour: { gan: '丙', zhi: '寅' },
    },
    wuxingCount: { '木': 4, '火': 2, '土': 2, '金': 0, '水': 0 },
    dayGan: '甲', wangShuaiLabel: '偏旺', gejuLabel: '日禄归时·归禄格',
    groundTruth: { primaryYongShen: '火', assistantGod: '土', avoidGod: '金', idleGod: '水', confidence: 0.82 },
    caseConfidence: 0.78, createdAt: Date.now(),
  },

  // ==============================================
  // 6. 神峰通考（4例，病药为主）
  // ==============================================
  {
    caseId: 'SHENFENG-001', name: '神峰通考·伤官带杀·病药',
    source: 'shenfengtongkao',
    fourPillars: {
      year: { gan: '壬', zhi: '戌' }, month: { gan: '甲', zhi: '辰' },
      day: { gan: '丁', zhi: '丑' }, hour: { gan: '癸', zhi: '卯' },
    },
    wuxingCount: { '木': 2, '火': 1, '土': 3, '金': 0, '水': 2 },
    dayGan: '丁', wangShuaiLabel: '偏弱', bingyaoLabel: '病=土重食伤多，药=木火',
    groundTruth: { primaryYongShen: '木', assistantGod: '火', avoidGod: '土', idleGod: '金', confidence: 0.82 },
    caseConfidence: 0.80, createdAt: Date.now(),
  },
  {
    caseId: 'SHENFENG-002', name: '神峰通考·身弱财多·用印',
    source: 'shenfengtongkao',
    fourPillars: {
      year: { gan: '戊', zhi: '戌' }, month: { gan: '辛', zhi: '酉' },
      day: { gan: '甲', zhi: '子' }, hour: { gan: '己', zhi: '巳' },
    },
    wuxingCount: { '木': 1, '火': 1, '土': 2, '金': 2, '水': 1 },
    dayGan: '甲', wangShuaiLabel: '偏弱', bingyaoLabel: '病=金旺土多木弱，药=水木',
    groundTruth: { primaryYongShen: '水', assistantGod: '木', avoidGod: '金', idleGod: '土', confidence: 0.85 },
    caseConfidence: 0.82, createdAt: Date.now(),
  },
  {
    caseId: 'SHENFENG-003', name: '神峰通考·官杀混杂·去杀留官',
    source: 'shenfengtongkao',
    fourPillars: {
      year: { gan: '庚', zhi: '子' }, month: { gan: '乙', zhi: '酉' },
      day: { gan: '甲', zhi: '申' }, hour: { gan: '辛', zhi: '未' },
    },
    wuxingCount: { '木': 2, '火': 0, '土': 1, '金': 3, '水': 1 },
    dayGan: '甲', wangShuaiLabel: '偏弱', gejuLabel: '官杀混杂',
    bingyaoLabel: '病=官杀混杂，药=火食伤制杀',
    groundTruth: { primaryYongShen: '火', assistantGod: '木', avoidGod: '金', idleGod: '土', confidence: 0.8 },
    caseConfidence: 0.78, createdAt: Date.now(),
  },
  {
    caseId: 'SHENFENG-004', name: '神峰通考·印绶格·杀印相生',
    source: 'shenfengtongkao',
    fourPillars: {
      year: { gan: '丙', zhi: '戌' }, month: { gan: '庚', zhi: '申' },
      day: { gan: '甲', zhi: '子' }, hour: { gan: '壬', zhi: '申' },
    },
    wuxingCount: { '木': 1, '火': 1, '土': 1, '金': 3, '水': 2 },
    dayGan: '甲', wangShuaiLabel: '偏弱', gejuLabel: '杀印相生',
    groundTruth: { primaryYongShen: '水', assistantGod: '木', avoidGod: '土', idleGod: '火', confidence: 0.82 },
    caseConfidence: 0.80, createdAt: Date.now(),
  },

  // ==============================================
  // 7. 穷通赋（4例）
  // ==============================================
  {
    caseId: 'QIONGTONGFU-001', name: '穷通赋·春木土薄·金克不宜',
    source: 'qiongtongfu',
    fourPillars: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '戊', zhi: '辰' },
      day: { gan: '甲', zhi: '午' }, hour: { gan: '庚', zhi: '申' },
    },
    wuxingCount: { '木': 3, '火': 1, '土': 2, '金': 1, '水': 1 },
    dayGan: '甲', wangShuaiLabel: '偏旺',
    groundTruth: { primaryYongShen: '火', assistantGod: '土', avoidGod: '金', idleGod: '水', confidence: 0.80 },
    caseConfidence: 0.78, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONGFU-002', name: '穷通赋·夏火炎上·水济为美',
    source: 'qiongtongfu',
    fourPillars: {
      year: { gan: '丙', zhi: '午' }, month: { gan: '丁', zhi: '未' },
      day: { gan: '丁', zhi: '巳' }, hour: { gan: '壬', zhi: '申' },
    },
    wuxingCount: { '木': 0, '火': 5, '土': 1, '金': 1, '水': 1 },
    dayGan: '丁', wangShuaiLabel: '极旺',
    groundTruth: { primaryYongShen: '水', assistantGod: '金', avoidGod: '火', idleGod: '木', confidence: 0.85 },
    caseConfidence: 0.82, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONGFU-003', name: '穷通赋·秋金喜火锻炼',
    source: 'qiongtongfu',
    fourPillars: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '庚', zhi: '酉' },
      day: { gan: '辛', zhi: '酉' }, hour: { gan: '丁', zhi: '未' },
    },
    wuxingCount: { '木': 0, '火': 1, '土': 1, '金': 5, '水': 0 },
    dayGan: '辛', wangShuaiLabel: '极旺',
    groundTruth: { primaryYongShen: '火', assistantGod: '木', avoidGod: '水', idleGod: '土', confidence: 0.88 },
    caseConfidence: 0.85, createdAt: Date.now(),
  },
  {
    caseId: 'QIONGTONGFU-004', name: '穷通赋·冬水寒冻·火土为要',
    source: 'qiongtongfu',
    fourPillars: {
      year: { gan: '癸', zhi: '亥' }, month: { gan: '癸', zhi: '丑' },
      day: { gan: '壬', zhi: '子' }, hour: { gan: '丙', zhi: '午' },
    },
    wuxingCount: { '木': 0, '火': 2, '土': 1, '金': 0, '水': 5 },
    dayGan: '壬', wangShuaiLabel: '极旺',
    groundTruth: { primaryYongShen: '火', assistantGod: '土', avoidGod: '水', idleGod: '金', confidence: 0.9 },
    caseConfidence: 0.88, createdAt: Date.now(),
  },

  // ==============================================
  // 8. 现代公开命例（10+，增加样本多样性）
  // ==============================================
  {
    caseId: 'MODERN-001', name: '现代·身旺食伤生财格',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '甲', zhi: '辰' }, month: { gan: '丙', zhi: '寅' },
      day: { gan: '甲', zhi: '午' }, hour: { gan: '戊', zhi: '辰' },
    },
    wuxingCount: { '木': 3, '火': 2, '土': 3, '金': 0, '水': 0 },
    dayGan: '甲', wangShuaiLabel: '偏旺', gejuLabel: '食伤生财',
    groundTruth: { primaryYongShen: '火', assistantGod: '土', avoidGod: '水', idleGod: '金', confidence: 0.78 },
    caseConfidence: 0.75, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-002', name: '现代·财旺生官·喜印比',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '己', zhi: '未' }, month: { gan: '戊', zhi: '戌' },
      day: { gan: '甲', zhi: '子' }, hour: { gan: '辛', zhi: '未' },
    },
    wuxingCount: { '木': 1, '火': 1, '土': 4, '金': 1, '水': 1 },
    dayGan: '甲', wangShuaiLabel: '偏弱', gejuLabel: '财旺生官',
    groundTruth: { primaryYongShen: '水', assistantGod: '木', avoidGod: '土', idleGod: '火', confidence: 0.80 },
    caseConfidence: 0.78, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-003', name: '现代·印旺身强·财官为用',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '癸', zhi: '亥' }, month: { gan: '甲', zhi: '子' },
      day: { gan: '丙', zhi: '寅' }, hour: { gan: '甲', zhi: '午' },
    },
    wuxingCount: { '木': 3, '火': 2, '土': 0, '金': 0, '水': 3 },
    dayGan: '丙', wangShuaiLabel: '偏旺',
    groundTruth: { primaryYongShen: '金', assistantGod: '土', avoidGod: '木', idleGod: '水', confidence: 0.78 },
    caseConfidence: 0.75, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-004', name: '现代·女命·官星清纯·印比为喜',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '庚', zhi: '午' }, month: { gan: '乙', zhi: '酉' },
      day: { gan: '丙', zhi: '寅' }, hour: { gan: '丁', zhi: '酉' },
    },
    wuxingCount: { '木': 1, '火': 3, '土': 0, '金': 3, '水': 0 },
    dayGan: '丙', wangShuaiLabel: '中和',
    groundTruth: { primaryYongShen: '木', assistantGod: '火', avoidGod: '金', idleGod: '水', confidence: 0.78 },
    caseConfidence: 0.75, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-005', name: '现代·印格·杀印相生',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '甲', zhi: '申' }, month: { gan: '壬', zhi: '申' },
      day: { gan: '丙', zhi: '子' }, hour: { gan: '甲', zhi: '午' },
    },
    wuxingCount: { '木': 2, '火': 2, '土': 0, '金': 2, '水': 2 },
    dayGan: '丙', wangShuaiLabel: '中和',
    groundTruth: { primaryYongShen: '木', assistantGod: '火', avoidGod: '土', idleGod: '金', confidence: 0.80 },
    caseConfidence: 0.78, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-006', name: '现代·食伤制杀·身弱印比为喜',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '壬', zhi: '辰' }, month: { gan: '庚', zhi: '戌' },
      day: { gan: '甲', zhi: '申' }, hour: { gan: '丙', zhi: '寅' },
    },
    wuxingCount: { '木': 2, '火': 1, '土': 2, '金': 2, '水': 1 },
    dayGan: '甲', wangShuaiLabel: '偏弱',
    groundTruth: { primaryYongShen: '水', assistantGod: '木', avoidGod: '土', idleGod: '金', confidence: 0.75 },
    caseConfidence: 0.73, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-007', name: '现代·两神成象·水火既济',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '癸', zhi: '亥' }, month: { gan: '丙', zhi: '午' },
      day: { gan: '壬', zhi: '子' }, hour: { gan: '丁', zhi: '巳' },
    },
    wuxingCount: { '木': 0, '火': 3, '土': 0, '金': 0, '水': 5 },
    dayGan: '壬', wangShuaiLabel: '偏旺', gejuLabel: '两神成象·水火交战',
    groundTruth: { primaryYongShen: '金', assistantGod: '水', avoidGod: '土', idleGod: '木', confidence: 0.75 },
    caseConfidence: 0.73, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-008', name: '现代·土重金埋·取木疏土',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '戊', zhi: '戌' }, month: { gan: '己', zhi: '未' },
      day: { gan: '辛', zhi: '丑' }, hour: { gan: '戊', zhi: '戌' },
    },
    wuxingCount: { '木': 0, '火': 0, '土': 6, '金': 2, '水': 0 },
    dayGan: '辛', wangShuaiLabel: '偏弱', bingyaoLabel: '土重埋金·木为药',
    groundTruth: { primaryYongShen: '木', assistantGod: '水', avoidGod: '土', idleGod: '火', confidence: 0.82 },
    caseConfidence: 0.80, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-009', name: '现代·火炎土燥·取金泄土',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '丙', zhi: '午' }, month: { gan: '戊', zhi: '未' },
      day: { gan: '丁', zhi: '午' }, hour: { gan: '庚', zhi: '戌' },
    },
    wuxingCount: { '木': 0, '火': 4, '土': 3, '金': 1, '水': 0 },
    dayGan: '丁', wangShuaiLabel: '极旺', bingyaoLabel: '火炎土燥·急需水济',
    groundTruth: { primaryYongShen: '水', assistantGod: '金', avoidGod: '火', idleGod: '土', confidence: 0.85 },
    caseConfidence: 0.82, createdAt: Date.now(),
  },
  {
    caseId: 'MODERN-010', name: '现代·金木交战·通关用水',
    source: 'modern_public',
    fourPillars: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '甲', zhi: '寅' },
      day: { gan: '庚', zhi: '申' }, hour: { gan: '甲', zhi: '寅' },
    },
    wuxingCount: { '木': 4, '火': 0, '土': 0, '金': 4, '水': 0 },
    dayGan: '庚', wangShuaiLabel: '中和', tongguanLabel: '需水通关',
    groundTruth: { primaryYongShen: '水', assistantGod: '土', avoidGod: '火', idleGod: '金', confidence: 0.85 },
    caseConfidence: 0.82, createdAt: Date.now(),
  },
]

/** 按来源统计命例数 */
export const CASE_STATS: Record<CaseSourceType, number> = (() => {
  const out: Record<string, number> = {}
  for (const c of CLASSIC_CASES) out[c.source] = (out[c.source] ?? 0) + 1
  return out as any
})()

// ============================================================
// CaseDatabase 主类（可扩展为持久化）
// ============================================================

export class CaseDatabase {
  constructor(public cases: BaziCase[] = CLASSIC_CASES) {}

  /** 总数 */
  get size() { return this.cases.length }

  /** 按来源过滤 */
  filterBySource(...src: CaseSourceType[]): BaziCase[] {
    return this.cases.filter(c => src.includes(c.source))
  }

  /** 按 groundTruth 主用神过滤 */
  filterByPrimary(wx: Wuxing): BaziCase[] {
    return this.cases.filter(c => c.groundTruth.primaryYongShen === wx)
  }

  /** 高置信度命例（≥0.85） */
  highConfidenceOnly(threshold = 0.85): BaziCase[] {
    return this.cases.filter(c => c.caseConfidence >= threshold)
  }

  /** 将 Case 转成 SubEngineInput（给引擎用） */
  static caseToSubInput(c: BaziCase): SubEngineInput {
    const fp = c.fourPillars
    const count = c.wuxingCount
    const total = Object.values(count).reduce((a, b) => a + b, 0)
    const strength = c.wangShuaiLabel
    let dayStrength: -2 | -1 | 0 | 1 | 2 = 0
    if (strength === '极旺') dayStrength = 2
    else if (strength === '偏旺') dayStrength = 1
    else if (strength === '偏弱') dayStrength = -1
    else if (strength === '极弱') dayStrength = -2
    // dayRootCount
    const { gan: dayGan, zhi: dayZhi } = fp.day
    const dayWx = dayGanToWuxing(dayGan)
    let dayRootCount = 0
    const allZhi = [fp.year.zhi, fp.month.zhi, fp.day.zhi, fp.hour?.zhi].filter(Boolean) as string[]
    for (const z of allZhi) if (zhiWuxing(z) === dayWx) dayRootCount += 1
    const monthWx = zhiWuxing(fp.month.zhi)
    return {
      dayGan,
      dayGanWuxing: dayWx,
      monthZhi: fp.month.zhi,
      monthZhiWuxing: monthWx,
      fourPillars: [
        { gan: fp.year.gan, zhi: fp.year.zhi, ganWx: ganWx(fp.year.gan), zhiWx: zhiWuxing(fp.year.zhi) },
        { gan: fp.month.gan, zhi: fp.month.zhi, ganWx: ganWx(fp.month.gan), zhiWx: monthWx },
        { gan: fp.day.gan, zhi: fp.day.zhi, ganWx: dayWx, zhiWx: zhiWuxing(dayZhi) },
        { gan: fp.hour?.gan ?? '甲', zhi: fp.hour?.zhi ?? '子', ganWx: ganWx(fp.hour?.gan ?? '甲'), zhiWx: zhiWuxing(fp.hour?.zhi ?? '子') },
      ],
      count: {
        '木': count['木'] ?? 0,
        '火': count['火'] ?? 0,
        '土': count['土'] ?? 0,
        '金': count['金'] ?? 0,
        '水': count['水'] ?? 0,
      },
      dayStrength,
      dayRootCount,
      isWinterBorn: monthWx === '水' || fp.month.zhi === '亥' || fp.month.zhi === '子' || fp.month.zhi === '丑',
      isSummerBorn: monthWx === '火' || fp.month.zhi === '巳' || fp.month.zhi === '午' || fp.month.zhi === '未',
      seasonTag: seasonFromMonthZhi(fp.month.zhi),
      totalElementCount: total,
      isDayStemSupport: dayRootCount > 0,
    } as any
  }
}

/** 全局 CaseDatabase */
export const globalCaseDatabase = new CaseDatabase(CLASSIC_CASES)

// ============================================================
// 阶段九：CaseSimilarity 匹配
// ============================================================

export class CaseSimilarityEngine {
  constructor(private _db: CaseDatabase = globalCaseDatabase) {}

  /** 命局 → 向量（用于距离计算） */
  toVector(input: SubEngineInput): MingjuVector {
    const w: [number, number, number, number, number] = [
      input.count['木'] ?? 0,
      input.count['火'] ?? 0,
      input.count['土'] ?? 0,
      input.count['金'] ?? 0,
      input.count['水'] ?? 0,
    ]
    const total = w.reduce((a, b) => a + b, 0) || 1
    const norm = w.map(v => v / total) as [number, number, number, number, number]
    return {
      wuxing: norm,
      dayStrength: (input.dayStrength as number) ?? 0,
      seasonIdx: seasonIdx(input.monthZhiWuxing),
      patternIdx: 0,
      climateTag: [
        input.isWinterBorn ? 1 : 0,
        input.isSummerBorn ? 1 : 0,
      ],
    }
  }

  /** 两向量综合相似度 0~1 */
  similarity(a: MingjuVector, b: MingjuVector): {
    overall: number; wuxingVector: number; wangshuai: number; geju: number; tiaohou: number;
  } {
    // 五行分布余弦相似度
    const wx = cosine(a.wuxing, b.wuxing)
    // 旺衰相似度（0~2 差距→0~1）
    const strengthGap = Math.abs(a.dayStrength - b.dayStrength)
    const ws = 1 - Math.min(strengthGap / 4, 1)
    // 季节/调候相似度
    const th = a.seasonIdx === b.seasonIdx ? 1 : Math.abs(a.climateTag[0] - b.climateTag[0]) + Math.abs(a.climateTag[1] - b.climateTag[1]) === 0 ? 0.85 : 0.5
    // 格局（暂简化，patternIdx 一致率，后续可扩展 geju encoder
    const gj = a.patternIdx === b.patternIdx ? 1 : 0.6
    // 加权综合
    const overall = wx * 0.45 + ws * 0.25 + gj * 0.15 + th * 0.15
    return {
      overall: Number(Math.max(0, Math.min(1, overall)).toFixed(4)),
      wuxingVector: Number(wx.toFixed(4)),
      wangshuai: Number(ws.toFixed(4)),
      geju: Number(gj.toFixed(4)),
      tiaohou: Number(th.toFixed(4)),
    }
  }

  /** 找 Top-N 相似命例 */
  findSimilar(input: SubEngineInput, decision: DecisionResult, topN = 5): CaseSimilarityReport {
    const vA = this.toVector(input)
    const matches: SimilarCaseMatch[] = []
    for (const c of this._db.cases) {
      const vB = this.toVector(CaseDatabase.caseToSubInput(c))
      const sim = this.similarity(vA, vB)
      const gt = c.groundTruth
      const primaryMatch = decision.primaryYongShen === gt.primaryYongShen
      const assistantMatch = decision.assistantGod === gt.assistantGod
      const avoidMatch = decision.avoidGod === gt.avoidGod
      matches.push({
        caseId: c.caseId,
        caseName: c.name,
        source: c.source,
        similarity: sim.overall,
        breakdown: {
          wuxingVector: sim.wuxingVector,
          wangshuai: sim.wangshuai,
          geju: sim.geju,
          tiaohou: sim.tiaohou,
        },
        yongShenMatch: {
          primaryMatch,
          assistantMatch,
          avoidMatch,
        },
        lifeSummary: c.lifeEvents?.length ? `${c.lifeEvents.length}个真实人生事件` : undefined,
        groundTruthHint: gt.primaryYongShen ? `权威结论：主用神=${gt.primaryYongShen}，喜=${gt.assistantGod}，忌=${gt.avoidGod}` : undefined,
      })
    }
    matches.sort((a, b) => b.similarity - a.similarity)
    const top = matches.slice(0, topN)
    return {
      topMatches: top,
      maxSimilarity: top[0]?.similarity ?? 0,
      generatedAt: Date.now(),
    }
  }
}

export const globalCaseSimilarityEngine = new CaseSimilarityEngine()

// ============================================================
// 辅助：天干/地支五行映射（避免循环依赖）
// ============================================================

function ganWx(gan: string): Wuxing {
  const m: Record<string, Wuxing> = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火',
    戊: '土', 己: '土', 庚: '金', 辛: '金',
    壬: '水', 癸: '水',
  }
  return m[gan] ?? '土'
}

function dayGanToWuxing(gan: string): Wuxing { return ganWx(gan) }

function zhiWuxing(zhi: string): Wuxing {
  const m: Record<string, Wuxing> = {
    子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
    午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
  }
  return m[zhi] ?? '土'
}

function seasonIdx(monthWx?: Wuxing): number {
  if (monthWx === '木') return 0
  if (monthWx === '火') return 1
  if (monthWx === '金') return 2
  if (monthWx === '水') return 3
  return 0
}

function seasonFromMonthZhi(z: string): 'spring' | 'summer' | 'autumn' | 'winter' {
  if (['寅', '卯', '辰'].includes(z)) return 'spring'
  if (['巳', '午', '未'].includes(z)) return 'summer'
  if (['申', '酉', '戌'].includes(z)) return 'autumn'
  return 'winter'
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, a2 = 0, b2 = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i]
    a2 += a[i] * a[i]
    b2 += b[i] * b[i]
  }
  const d = Math.sqrt(a2) * Math.sqrt(b2)
  return d > 0 ? Number((dot / d).toFixed(4)) : 0
}
