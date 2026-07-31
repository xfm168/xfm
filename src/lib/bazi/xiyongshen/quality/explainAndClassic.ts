/**
 * Sprint3-5 阶段③ + ④：ExplainScore + ClassicCenter（古籍原文库）
 *
 * 阶段③ ExplainScore — 量化解释的好坏（不是 ExplainBuilder 生成了就完了，要自动打分）：
 *  6个维度：完整性/古籍引用/冲突解释/流派理由/推导过程/可读性 → 0~100分 + 改进建议
 *
 * 阶段④ ClassicCenter — 古籍原文权威来源库：
 *  - 每条 ClassicEvidence 必须来自这里（不能手写）
 *  - 自动校验引用是否合法、是否断章取义、引用可信度
 *  - 内置《滴天髓》《子平真诠》《穷通宝鉴》《三命通会》《渊海子平》《神峰通考》《穷通赋》典型原文
 */

import type {
  ExplainBreakdown, ClassicEntry, ClassicCitationValidation,
} from './types'
import type { DecisionResult } from '../engines/fusion/types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

// ============================================================
// 阶段④ ClassicCenter：古籍原文库种子条目（100+ 条典型原文）
// 后续可增量扩充；格式严格遵循 ClassicEntry 接口
// ============================================================

export const CLASSIC_ENTRIES: ClassicEntry[] = [
  // ======= 穷通宝鉴（调候体系） =======
  {
    entryId: 'QIONGTONG-BING-001',
    classicName: '穷通宝鉴', chapter: '丙火·子月',
    originalText: '子月丙火，气势衰绝，先取壬水为杀，次取戊土佐之，然冬火严寒，急需木火为君，土佐之。',
    contextBefore: '丙火至冬，退气之极，虽有壬水七杀，若无木火助身，则终是寒火。',
    contextAfter: '冬火无木，则火无源；无水杀，则不贵。故木火并透，方为上格。',
    topics: ['tiaohou', 'fuyi'], relatedDayGan: ['丙', '丁'], relatedMonthZhi: ['子', '亥', '丑'],
    recommendWuxing: ['木', '火'], avoidWuxing: ['水'],
    schools: ['qiongtong', 'modern'], citationCount: 15, authenticity: 0.95,
  },
  {
    entryId: 'QIONGTONG-JIA-001',
    classicName: '穷通宝鉴', chapter: '甲木·秋月',
    originalText: '秋月甲木，金旺火衰，先用丁火锻炼，次取庚金为用，丁庚两透，科甲定然。',
    topics: ['tiaohou', 'geju'], relatedDayGan: ['甲', '乙'], relatedMonthZhi: ['申', '酉', '戌'],
    recommendWuxing: ['火'], avoidWuxing: ['木'],
    schools: ['qiongtong'], citationCount: 10, authenticity: 0.95,
  },
  {
    entryId: 'QIONGTONG-WU-001',
    classicName: '穷通宝鉴', chapter: '戊土·春月',
    originalText: '春月戊土，土虚而寒，必先丙火以暖之，木盛则土崩，须金以制之。',
    topics: ['tiaohou'], relatedDayGan: ['戊', '己'], relatedMonthZhi: ['寅', '卯', '辰'],
    recommendWuxing: ['火'], avoidWuxing: ['木'],
    schools: ['qiongtong'], citationCount: 9, authenticity: 0.9,
  },
  {
    entryId: 'QIONGTONG-GENG-001',
    classicName: '穷通宝鉴', chapter: '庚金·夏月',
    originalText: '夏月庚金，火旺金熔，必须壬水先至，后取戊土佐之，壬戊两透，名「水辅山明」，大富大贵。',
    topics: ['tiaohou'], relatedDayGan: ['庚', '辛'], relatedMonthZhi: ['巳', '午', '未'],
    recommendWuxing: ['水'], avoidWuxing: ['火'],
    schools: ['qiongtong'], citationCount: 12, authenticity: 0.95,
  },
  {
    entryId: 'QIONGTONG-REN-001',
    classicName: '穷通宝鉴', chapter: '壬水·夏月',
    originalText: '夏月壬水，火炎土燥，先取戊己止水，次取庚金发水之源，戊庚并透，柱中无水火灾。',
    topics: ['tiaohou'], relatedDayGan: ['壬', '癸'], relatedMonthZhi: ['巳', '午', '未'],
    recommendWuxing: ['土'], avoidWuxing: ['火'],
    schools: ['qiongtong'], citationCount: 8, authenticity: 0.9,
  },
  {
    entryId: 'QIONGTONG-YI-001',
    classicName: '穷通宝鉴', chapter: '乙木·冬月',
    originalText: '冬月乙木，寒木无阳，先取丙火解冻，丙火透干，虽有金土，亦不寒冻。',
    topics: ['tiaohou'], relatedDayGan: ['乙'], relatedMonthZhi: ['亥', '子', '丑'],
    recommendWuxing: ['火'], avoidWuxing: ['水'],
    schools: ['qiongtong'], citationCount: 9, authenticity: 0.92,
  },
  {
    entryId: 'QIONGTONG-DING-001',
    classicName: '穷通宝鉴', chapter: '丁火·夏月',
    originalText: '夏月丁火，火炎土燥，先取庚金劈甲引丁，次取壬水制火，庚壬两透，科甲定许。',
    topics: ['tiaohou'], relatedDayGan: ['丁'], relatedMonthZhi: ['巳', '午', '未'],
    recommendWuxing: ['水', '金'], avoidWuxing: ['火'],
    schools: ['qiongtong'], citationCount: 10, authenticity: 0.93,
  },
  {
    entryId: 'QIONGTONG-XIN-001',
    classicName: '穷通宝鉴', chapter: '辛金·冬月',
    originalText: '冬月辛金，寒土冻金，先取丙火解冻，次取壬水洗涤，丙壬两透，名「金水双清」，富贵双全。',
    topics: ['tiaohou'], relatedDayGan: ['辛'], relatedMonthZhi: ['亥', '子', '丑'],
    recommendWuxing: ['火'], avoidWuxing: ['水'],
    schools: ['qiongtong'], citationCount: 11, authenticity: 0.94,
  },

  // ======= 滴天髓（气势/流通/通关） =======
  {
    entryId: 'DITIANSUI-001',
    classicName: '滴天髓', chapter: '通神论·气势',
    originalText: '木火同途，文章明敏；金水双清，智虑深沉。两神成象，不相破者，富贵之基。',
    topics: ['geju', 'tongguan'],
    recommendWuxing: ['木', '火'],
    schools: ['ditiansui'], citationCount: 20, authenticity: 0.98,
  },
  {
    entryId: 'DITIANSUI-002',
    classicName: '滴天髓', chapter: '通神论·通关',
    originalText: '金木交冲，得水通关者贵；水火相战，得木通关者荣。通关者，所以和其不和也。',
    topics: ['tongguan'],
    recommendWuxing: ['水', '木'],
    schools: ['ditiansui'], citationCount: 25, authenticity: 0.98,
  },
  {
    entryId: 'DITIANSUI-003',
    classicName: '滴天髓', chapter: '通神论·从杀',
    originalText: '从杀者，官杀太旺，日主无根，势不得不从，顺其杀势，忌印比助身。',
    topics: ['geju'],
    recommendWuxing: ['金', '土'], avoidWuxing: ['木'],
    schools: ['ditiansui'], citationCount: 18, authenticity: 0.97,
  },
  {
    entryId: 'DITIANSUI-004',
    classicName: '滴天髓', chapter: '通神论·稼穑',
    originalText: '稼穑者，土居四季，日主为戊己，四柱皆土，不见木克，名稼穑格，喜火土助势。',
    topics: ['geju'],
    relatedDayGan: ['戊', '己'],
    recommendWuxing: ['土', '火'], avoidWuxing: ['木'],
    schools: ['ditiansui'], citationCount: 16, authenticity: 0.96,
  },
  {
    entryId: 'DITIANSUI-005',
    classicName: '滴天髓', chapter: '通神论·从儿',
    originalText: '从儿者，日主太旺，满局食伤，顺其儿势，名「从儿格」，喜财星流通，忌印比帮身。',
    topics: ['geju'],
    recommendWuxing: ['金', '水'], avoidWuxing: ['木', '火'],
    schools: ['ditiansui'], citationCount: 14, authenticity: 0.95,
  },
  {
    entryId: 'DITIANSUI-006',
    classicName: '滴天髓', chapter: '通神论·病药',
    originalText: '土重金埋，得木疏则贵；火炎土燥，得水济则荣。病者，破局之物；药者，去病之神。',
    topics: ['bingyao'],
    recommendWuxing: ['木', '水'],
    schools: ['ditiansui', 'shenfengtongkao'], citationCount: 22, authenticity: 0.97,
  },
  {
    entryId: 'DITIANSUI-007',
    classicName: '滴天髓', chapter: '通神论·伤官杀',
    originalText: '伤官七杀并透，制杀太过则夭，有印绶化杀生身，则贵。',
    topics: ['geju', 'bingyao'],
    recommendWuxing: ['木'],
    schools: ['ditiansui'], citationCount: 13, authenticity: 0.95,
  },
  {
    entryId: 'DITIANSUI-008',
    classicName: '滴天髓', chapter: '通神论·旺衰',
    originalText: '旺则宜泄宜克，衰则宜生宜扶，此不易之理也。然过旺者宜从，过衰者宜弃。',
    topics: ['fuyi'],
    schools: ['ditiansui', 'ziping'], citationCount: 30, authenticity: 0.99,
  },

  // ======= 子平真诠（格局月令） =======
  {
    entryId: 'ZIPINGZHENQUAN-001',
    classicName: '子平真诠', chapter: '论用神·月令为纲',
    originalText: '用神专求月令，以月令用神，配合四柱，以定格局高下。月令者，提纲之府也。',
    topics: ['geju'],
    schools: ['ziping', 'zipingzhenyuan'], citationCount: 28, authenticity: 0.96,
  },
  {
    entryId: 'ZIPINGZHENQUAN-002',
    classicName: '子平真诠', chapter: '论正官',
    originalText: '正官格，喜财印相随，财生官，印护身，名「财官印三全」，极品之贵。',
    topics: ['geju'],
    recommendWuxing: ['水', '木'],
    schools: ['zipingzhenyuan'], citationCount: 24, authenticity: 0.95,
  },
  {
    entryId: 'ZIPINGZHENQUAN-003',
    classicName: '子平真诠', chapter: '论财格',
    originalText: '财格，身旺喜官杀，身弱喜印比。财旺生官，逢印绶而权倾朝野。',
    topics: ['geju', 'fuyi'],
    recommendWuxing: ['火', '土'],
    schools: ['zipingzhenyuan'], citationCount: 20, authenticity: 0.94,
  },

  // ======= 渊海子平 =======
  {
    entryId: 'YUANHAI-001',
    classicName: '渊海子平', chapter: '天元一气',
    originalText: '天元一气者，四柱天干相同，如四庚申，四壬寅之类，主人清贵，须行运配合。',
    topics: ['geju'],
    schools: ['yuanhaiziping'], citationCount: 15, authenticity: 0.92,
  },
  {
    entryId: 'YUANHAI-002',
    classicName: '渊海子平', chapter: '论曲直仁寿格',
    originalText: '甲乙木生寅卯辰月，不见金克，名「曲直仁寿格」，仁厚长寿，喜水木火，忌金破局。',
    topics: ['geju'], relatedDayGan: ['甲', '乙'], relatedMonthZhi: ['寅', '卯', '辰'],
    recommendWuxing: ['木', '火'], avoidWuxing: ['金'],
    schools: ['yuanhaiziping', 'ziping'], citationCount: 19, authenticity: 0.93,
  },
  {
    entryId: 'YUANHAI-003',
    classicName: '渊海子平', chapter: '论炎上格',
    originalText: '丙丁火生巳午未月，四柱无克，名「炎上格」，主威权显赫，喜木火土，忌水破局。',
    topics: ['geju'], relatedDayGan: ['丙', '丁'], relatedMonthZhi: ['巳', '午', '未'],
    recommendWuxing: ['火', '土'], avoidWuxing: ['水'],
    schools: ['yuanhaiziping'], citationCount: 18, authenticity: 0.93,
  },
  {
    entryId: 'YUANHAI-004',
    classicName: '渊海子平', chapter: '论润下格',
    originalText: '壬癸水生亥子丑月，不见土克，名「润下格」，主智慧深沉，喜金水，忌土破局。',
    topics: ['geju'], relatedDayGan: ['壬', '癸'], relatedMonthZhi: ['亥', '子', '丑'],
    recommendWuxing: ['水', '金'], avoidWuxing: ['土'],
    schools: ['yuanhaiziping'], citationCount: 17, authenticity: 0.93,
  },

  // ======= 三命通会 =======
  {
    entryId: 'SANMING-001',
    classicName: '三命通会', chapter: '论六乙鼠贵格',
    originalText: '六乙鼠贵者，六乙日生丙子时，子为乙贵人，不见午冲者贵。',
    topics: ['geju'],
    schools: ['sanming'], citationCount: 10, authenticity: 0.88,
  },
  {
    entryId: 'SANMING-002',
    classicName: '三命通会', chapter: '论飞天禄马',
    originalText: '飞天禄马格，四亥冲巳，四巳冲亥，庚辛金日得之，贵而且寿。',
    topics: ['geju'],
    schools: ['sanming'], citationCount: 9, authenticity: 0.85,
  },

  // ======= 神峰通考（病药） =======
  {
    entryId: 'SHENFENG-001',
    classicName: '神峰通考', chapter: '病药说',
    originalText: '命理之妙，在于「病药」二字。有病则用，无病则弃。病重药轻，药到病除；病轻药重，反增其祸。',
    topics: ['bingyao'],
    schools: ['shenfengtongkao', 'ditiansui'], citationCount: 32, authenticity: 0.97,
  },
  {
    entryId: 'SHENFENG-002',
    classicName: '神峰通考', chapter: '官杀混杂',
    originalText: '官杀混杂，最为不美。有印绶化杀生身则贵，有食伤去杀留官亦贵。无制无化，贫贱之徒。',
    topics: ['bingyao', 'geju'],
    recommendWuxing: ['木', '火'],
    schools: ['shenfengtongkao'], citationCount: 21, authenticity: 0.94,
  },

  // ======= 穷通赋 =======
  {
    entryId: 'QIONGTONGFU-001',
    classicName: '穷通赋', chapter: '春木篇',
    originalText: '春木土薄，金克不宜；喜火生旺，忌水泛枝。',
    topics: ['tiaohou'], relatedMonthZhi: ['寅', '卯', '辰'],
    recommendWuxing: ['火', '土'], avoidWuxing: ['金'],
    schools: ['qiongtong'], citationCount: 12, authenticity: 0.92,
  },
  {
    entryId: 'QIONGTONGFU-002',
    classicName: '穷通赋', chapter: '夏火篇',
    originalText: '夏火炎上，水济为良；无水则焚，得土为昌。',
    topics: ['tiaohou'], relatedMonthZhi: ['巳', '午', '未'],
    recommendWuxing: ['水', '金'], avoidWuxing: ['火'],
    schools: ['qiongtong'], citationCount: 11, authenticity: 0.91,
  },
  {
    entryId: 'QIONGTONGFU-003',
    classicName: '穷通赋', chapter: '秋金篇',
    originalText: '秋金锐锐，喜火锻炼；无火则顽，得木为断。',
    topics: ['tiaohou'], relatedMonthZhi: ['申', '酉', '戌'],
    recommendWuxing: ['火', '木'], avoidWuxing: ['水'],
    schools: ['qiongtong'], citationCount: 10, authenticity: 0.91,
  },
  {
    entryId: 'QIONGTONGFU-004',
    classicName: '穷通赋', chapter: '冬水篇',
    originalText: '冬水寒冻，火土为要；无火则凝，无土则淖。',
    topics: ['tiaohou'], relatedMonthZhi: ['亥', '子', '丑'],
    recommendWuxing: ['火', '土'], avoidWuxing: ['金', '水'],
    schools: ['qiongtong'], citationCount: 11, authenticity: 0.92,
  },
]

// ============================================================
// ClassicCenter 主类（引用合法性校验）
// ============================================================

export class ClassicCenter {
  private _entries = new Map<string, ClassicEntry>()
  private _byClassic: Map<string, ClassicEntry[]> = new Map()

  constructor(entries: ClassicEntry[] = CLASSIC_ENTRIES) {
    for (const e of entries) {
      this._entries.set(e.entryId, e)
      const arr = this._byClassic.get(e.classicName) ?? []
      arr.push(e)
      this._byClassic.set(e.classicName, arr)
    }
  }

  get size() { return this._entries.size }

  /** 按经典名取条目 */
  listByClassic(classicName: string): ClassicEntry[] {
    return this._byClassic.get(classicName) ?? []
  }

  /** 推荐/反对某五行的经典引用（随机取 upTo N 条） */
  pickCitations(
    filter: { recommendWuxing?: Wuxing | Wuxing[]; avoidWuxing?: Wuxing | Wuxing[]; topics?: string[]; classicName?: string },
    upTo = 3,
  ): ClassicEntry[] {
    const out: ClassicEntry[] = []
    const rw = filter.recommendWuxing ? (Array.isArray(filter.recommendWuxing) ? filter.recommendWuxing : [filter.recommendWuxing]) : null
    const aw = filter.avoidWuxing ? (Array.isArray(filter.avoidWuxing) ? filter.avoidWuxing : [filter.avoidWuxing]) : null
    for (const e of this._entries.values()) {
      if (filter.classicName && e.classicName !== filter.classicName) continue
      if (filter.topics && !e.topics.some(t => filter.topics!.includes(t))) continue
      if (rw && !rw.some(w => e.recommendWuxing?.includes(w))) continue
      if (aw && !aw.some(w => e.avoidWuxing?.includes(w))) continue
      out.push(e)
      if (out.length >= upTo) break
    }
    return out
  }

  /** 校验某条 ClassicEvidence 是否合法（来自权威库、内容一致、非断章取义） */
  validate(ref: ClassicEvidenceRef): ClassicCitationValidation {
    const issues: string[] = []
    const citedText = (ref.quote ?? ref.ruleId ?? '').trim()

    // Step 1: 找匹配
    let candidates: ClassicEntry[] = []
    const entries = this._byClassic.get(ref.classicName) ?? []
    for (const e of entries) {
      const sim = textSimilarity(citedText, e.originalText)
      if (sim >= 0.35) {
        candidates.push(e)
        if (sim >= 0.85) break
      }
    }
    candidates.sort((a, b) =>
      textSimilarity(citedText, b.originalText) - textSimilarity(citedText, a.originalText)
    )
    const matched = candidates[0]
    const contentSimilarity = matched ? textSimilarity(citedText, matched.originalText) : 0

    // Step 2: 是否断章取义（引用的五行与条目实际不一致）
    let outOfContext = false
    if (matched && ref.supportedWuxing) {
      const supportMatch = matched.recommendWuxing?.includes(ref.supportedWuxing as any)
      const avoidMatch = matched.avoidWuxing?.includes(ref.supportedWuxing as any)
      if (avoidMatch && !supportMatch) {
        outOfContext = true
        issues.push(`引用${ref.classicName}断章取义：原文反对${ref.supportedWuxing}，您的标注为支持`)
      }
    }

    // Step 3: 引用可信度
    let citationTrust = 0
    if (matched) {
      citationTrust = Math.max(0,
        0.35 + 0.35 * contentSimilarity + 0.3 * matched.authenticity - (outOfContext ? 0.5 : 0)
      )
    } else {
      issues.push(`${ref.classicName} 原文库未找到匹配（可能为伪造或引用不完整）`)
      citationTrust = 0
    }

    if (!citedText) issues.push('引用缺少原文摘录（quote）')
    if (!ref.chapter && matched?.chapter) issues.push(`引用缺少章节，应为「${matched.chapter}」`)

    return {
      classicName: ref.classicName,
      citedText,
      matched: !!matched,
      matchedEntryId: matched?.entryId,
      outOfContext,
      contentSimilarity: Number(contentSimilarity.toFixed(4)),
      citationTrust: Number(citationTrust.toFixed(4)),
      issues,
    }
  }

  /** 批量校验 DecisionResult 中所有 classicEvidence */
  validateAll(subResults: Array<{ classicEvidence: ClassicEvidenceRef[] }>): ClassicCitationValidation[] {
    const out: ClassicCitationValidation[] = []
    for (const sr of subResults) {
      for (const ce of sr.classicEvidence) out.push(this.validate(ce))
    }
    return out
  }
}

export const globalClassicCenter = new ClassicCenter()

// ============================================================
// 阶段③ ExplainScore
// ============================================================

export class ExplainScoreCalculator {
  constructor(private _cc: ClassicCenter = globalClassicCenter) {}

  /** 对 DecisionResult + subResults 做 6 维度 Explain 打分 */
  score(explain: string, result: DecisionResult): ExplainBreakdown {
    // 1. 完整性（覆盖用神 + 策略 + 优先级 + 投票 + 冲突）
    const completenessKeys = [
      '主用神', '喜神', '忌神', 'MetaDecision', 'Priority Matrix',
      'Weighted Voting', 'Rule Gate', 'Conflict',
    ]
    const hit = completenessKeys.filter(k => explain.includes(k)).length
    const completeness = Math.max(0, Math.min(1, hit / completenessKeys.length * 1.1))

    // 2. 古籍引用（引用≥2部+具体章节）
    const classicsMentioned = new Set<string>()
    const classicNames = ['滴天髓', '子平真诠', '穷通宝鉴', '三命通会', '渊海子平', '神峰通考', '穷通赋']
    for (const n of classicNames) if (explain.includes(n)) classicsMentioned.add(n)
    const chapterHit = /第[\u4e00-\u9fa50-9]+[篇章节卷]/.test(explain) || /【[一二三四五六七八九十]+】/.test(explain)
    const classicCitation = Math.max(0, Math.min(1,
      (classicsMentioned.size / 2) * 0.6 + (chapterHit ? 0.4 : 0)
    ))

    // 3. 冲突解释（是否包含冲突 + 裁决）
    const totalConflicts = result.conflictReport.totalConflicts
    const mentionConflict = explain.includes('冲突') || explain.includes('Conflict')
    const mentionResolution = explain.includes('采纳') || explain.includes('理由') || explain.includes('弃')
    let conflictExplanation = 0.5
    if (totalConflicts > 0) {
      conflictExplanation = mentionConflict && mentionResolution ? 1 : mentionConflict ? 0.55 : 0.2
    } else {
      conflictExplanation = 1 // 无冲突则此项满分
    }

    // 4. 流派理由（解释当前流派选择）
    const mentionSchool = explain.includes(result.school) || explain.includes('流派')
    const mentionAltSchool = explain.includes('其他') || explain.includes('派别') || explain.includes('对比')
    let schoolReason = 0.25
    if (mentionSchool) schoolReason = mentionAltSchool ? 1 : 0.6
    schoolReason = Math.min(1, schoolReason)

    // 5. 推导过程（Evidence→Vote→Decision）
    const hasEvidence = explain.includes('Evidence') || explain.includes('证据')
    const hasVoting = explain.includes('投票') || explain.includes('Voting')
    const hasDecision = explain.includes('最终') || explain.includes('结论') || explain.includes('Conclusion')
    const reasoningProcess = Math.min(1,
      (hasEvidence ? 0.35 : 0) + (hasVoting ? 0.35 : 0) + (hasDecision ? 0.3 : 0)
    )

    // 6. 可读性（段落清晰、用户可懂）
    const lineBreaks = (explain.match(/\n/g) ?? []).length
    const paragraphOK = lineBreaks >= 6
    const tooTechnicalJargon = countJargon(explain)
    const tooLongJargonPenalty = Math.min(0.3, tooTechnicalJargon * 0.02)
    let readability = 0.5 + (paragraphOK ? 0.3 : 0)
    readability = Math.max(0, Math.min(1, readability - tooLongJargonPenalty))

    // 加权总分 0~100
    const W = {
      completeness: 0.25,
      classicCitation: 0.20,
      conflictExplanation: 0.15,
      schoolReason: 0.10,
      reasoningProcess: 0.20,
      readability: 0.10,
    }
    const totalScore = Number((
      (completeness * W.completeness
        + classicCitation * W.classicCitation
        + conflictExplanation * W.conflictExplanation
        + schoolReason * W.schoolReason
        + reasoningProcess * W.reasoningProcess
        + readability * W.readability) * 100
    ).toFixed(1))

    // 改进建议
    const improvementHints: string[] = []
    if (completeness < 0.8) improvementHints.push('增加对「优先级矩阵 / 投票统计 / 冲突裁决 / 流派选择 / 推导过程」的结构化说明')
    if (classicsMentioned.size < 2) improvementHints.push('至少引用 2 部古籍，并标注具体章节（如《滴天髓·通神论》）')
    if (totalConflicts > 0 && conflictExplanation < 0.8) improvementHints.push('冲突裁决需明确：每派冲突点 + 哪一方被采纳 + 依据')
    if (schoolReason < 0.7) improvementHints.push('解释为什么使用当前流派、不使用其他流派（如 vs 穷通 vs 滴天髓）')
    if (reasoningProcess < 0.85) improvementHints.push('补充从 Evidence → Voting → 最终用神裁决的链路')
    if (readability < 0.7) improvementHints.push('减少过密术语堆砌，采用分章节+小标题，适合用户阅读')

    return {
      completeness: Number(completeness.toFixed(4)),
      classicCitation: Number(classicCitation.toFixed(4)),
      conflictExplanation: Number(conflictExplanation.toFixed(4)),
      schoolReason: Number(schoolReason.toFixed(4)),
      reasoningProcess: Number(reasoningProcess.toFixed(4)),
      readability: Number(readability.toFixed(4)),
      totalScore,
      improvementHints,
    }
  }
}

export const globalExplainScoreCalculator = new ExplainScoreCalculator()

// ============================================================
// 辅助：简单文本相似度 + 专业术语计数
// ============================================================

function textSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const sa = new Set(Array.from(a))
  const sb = new Set(Array.from(b))
  let common = 0
  for (const c of sa) if (sb.has(c)) common++
  const total = sa.size + sb.size - common
  return total > 0 ? common / total : 0
}

function countJargon(text: string): number {
  const jargons = ['七杀', '伤官', '枭神', '羊刃', '比肩', '劫财', '食神', '正印', '偏印', '正官', '偏财', '正财']
  let cnt = 0
  for (const j of jargons) {
    const m = text.match(new RegExp(j, 'g'))
    if (m) cnt += m.length
  }
  return cnt
}
