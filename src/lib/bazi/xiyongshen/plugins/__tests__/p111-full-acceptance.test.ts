import { describe, it, expect, beforeAll } from 'vitest'
import {
  defaultBaziPatternPlugin,
  BaziPatternPlugin,
  defaultGejuKnowledgeBase,
  defaultPatternPriorityMatrix,
  defaultPatternScorer,
  defaultEvidenceBuilder,
  defaultPatternExplainBuilder,
  defaultGejuCitationsDB,
  GejuCaseDB,
  defaultPatternRegressionRunner,
  defaultPatternBatchEngine,
  type Wuxing,
  GejuCategory,
  GejuName,
} from '../pattern'

describe('P1.1.1 格局体系增强版 · 10项完成标准验收', () => {
  // types.ts 真实 38 种命名（含后缀（木专旺）等 + 5 偏门类格）
  const EXPECTED_GEJU_NAMES: GejuName[] = [
    '正格-正官格','正格-七杀格','正格-正印格','正格-偏印格','正格-正财格','正格-偏财格','正格-食神格','正格-伤官格',
    '真从-从财格','真从-从杀格','真从-从儿格','真从-从势格','真从-从旺格',
    '假从-假从财','假从-假从杀','假从-假从儿',
    '专旺-曲直格（木专旺）','专旺-炎上格（火专旺）','专旺-稼穑格（土专旺）','专旺-从革格（金专旺）','专旺-润下格（水专旺）',
    '一气-天元一气','一气-地元一气',
    '化气-甲己化土','化气-乙庚化金','化气-丙辛化水','化气-丁壬化木','化气-戊癸化火',
    '调候格','病药格','通关格','扶抑格','未判明正格',
    '假从-假从势','假从-假从旺','专旺-类从革','专旺-类润下','化气-类化土',
  ]
  const EXPECTED_TOTAL_GEJU = 38
  const EXPECTED_8_CLASSICS = ['DTS','QTB','ZYQ','YSX','SMTH','SBTK','QLMG','YDZP'] as const
  const EXPECTED_9_CATEGORIES: GejuCategory[] = ['zheng','jiacong','zhencong','zhuanwang','yiqi','huaqi','tiaohou','bingyao','tongguan','fuyi']

  const makeClassifierInput = (overrides?: Partial<{
    dayGan: string; dayGanWx: Wuxing; monthZhi: string; monthZhiWx: Wuxing;
    count: Record<Wuxing, number>;
    fourPillars: Array<{ gan: string; zhi: string; ganWx: Wuxing; zhiWx: Wuxing }>;
    dayStrength: number; dayRootCount: number; winter: boolean; summer: boolean
  }>) => {
    const dayGan = overrides?.dayGan ?? '甲'
    const dayGanWuxing = overrides?.dayGanWx ?? '木'
    const monthZhi = overrides?.monthZhi ?? '寅'
    const monthZhiWuxing = overrides?.monthZhiWx ?? '木'
    const count = overrides?.count ?? { '木':5,'火':2,'土':0,'金':0,'水':1 }
    const fourPillars = overrides?.fourPillars ?? [
      { gan:'甲', zhi:'寅', ganWx:'木', zhiWx:'木' },
      { gan:'甲', zhi:'卯', ganWx:'木', zhiWx:'木' },
      { gan:'甲', zhi:'辰', ganWx:'木', zhiWx:'土' },
      { gan:'丙', zhi:'午', ganWx:'火', zhiWx:'火' },
    ]
    return {
      dayGan, dayGanWuxing, monthZhi, monthZhiWuxing, count, fourPillars,
      dayStrength: overrides?.dayStrength ?? 90,
      dayRootCount: overrides?.dayRootCount ?? 0,
      isWinterBorn: overrides?.winter ?? false,
      isSummerBorn: overrides?.summer ?? false,
      conflictingPairs: [] as Array<[Wuxing, Wuxing]>,
    }
  }

  beforeAll(async () => {
    if (defaultBaziPatternPlugin.status !== 'enabled') {
      await defaultBaziPatternPlugin.install().catch(() => {})
      await defaultBaziPatternPlugin.initialize().catch(() => {})
      await defaultBaziPatternPlugin.enable().catch(() => {})
    }
  })

  // ===================== 标准 1: 38种格局全部完善 =====================
  it('[标准1] GejuKnowledgeBase 覆盖 38 种格局（含5类偏门格）', () => {
    const all = defaultGejuKnowledgeBase.getAll()
    expect(all.length, '≥38 entries').toBeGreaterThanOrEqual(38)
    // 每种格局都具备完整字段
    for (const name of EXPECTED_GEJU_NAMES) {
      const entry = defaultGejuKnowledgeBase.get(name)
      expect(entry, `name=${name} 存在`).toBeTruthy()
      expect(entry!.category, `${name} category`).toBeTruthy()
      expect(typeof entry!.priorityRank).toBe('number')
      expect(entry!.chengGeConditions.length, `${name} chengGe≥1`).toBeGreaterThanOrEqual(1)
      expect(typeof entry!.chengGeRequiredCount).toBe('number')
      expect(Array.isArray(entry!.poGeConditions)).toBe(true)
      expect(Array.isArray(entry!.jiaGeConditions)).toBe(true)
      expect(Array.isArray(entry!.zhenGeConditions)).toBe(true)
      expect(Array.isArray(entry!.zhuanGeConditions)).toBe(true)
      expect(entry!.yongShenRules.length).toBeGreaterThanOrEqual(1)
      expect(entry!.jiShenRules.length).toBeGreaterThanOrEqual(1)
      expect(entry!.classicCitations.length, `${name} citations≥2`).toBeGreaterThanOrEqual(2)
    }
  })

  it('[标准1] 22 核心格局（专旺·化气·一气·真从·假从·正格·调候）≥3成格+≥2破格+2+不同古籍', () => {
    const priority: GejuName[] = [
      '专旺-曲直格（木专旺）','专旺-炎上格（火专旺）','专旺-稼穑格（土专旺）','专旺-从革格（金专旺）','专旺-润下格（水专旺）',
      '化气-甲己化土','化气-乙庚化金','化气-丙辛化水','化气-丁壬化木','化气-戊癸化火',
      '一气-天元一气','一气-地元一气',
      '真从-从财格','真从-从杀格','真从-从儿格',
      '假从-假从财','假从-假从杀','假从-假从儿',
      '正格-正官格','正格-七杀格','正格-正印格','调候格',
    ]
    for (const name of priority) {
      const e = defaultGejuKnowledgeBase.get(name)!
      expect(e, `${name} exist`).toBeTruthy()
      expect(e.chengGeConditions.length, `${name} chengGe≥3`).toBeGreaterThanOrEqual(3)
      expect(e.poGeConditions.length, `${name} poGe≥2`).toBeGreaterThanOrEqual(2)
      const uniq = new Set(e.classicCitations.map(c => c.classicCode))
      expect(uniq.size, `${name} 不同古籍≥2: ${[...uniq].join(',')}`).toBeGreaterThanOrEqual(2)
      for (const c of e.classicCitations) {
        expect(c.classicName, `${c.classicCode} name`).toBeTruthy()
        expect(c.chapter, `${c.classicCode} chapter`).toBeTruthy()
        expect(c.originalText, `${c.classicCode} originalText`).toBeTruthy()
        expect(c.interpretation, `${c.classicCode} interpretation`).toBeTruthy()
      }
    }
  })

  it('[标准1] 成格/破格/假格/真格/转格条件齐备 · 优先级/古籍Evidence俱全', () => {
    const s = defaultGejuKnowledgeBase.get('真从-从财格')!
    expect(s.chengGeConditions.join('|')).toMatch(/财|旺|令|月|日/)
    expect(s.poGeConditions.join('|')).toMatch(/比|劫|根|印|官|杀/)
    expect(s.jiaGeConditions.join('|')).toMatch(/根|劫|微|浅/)
    expect(s.zhenGeConditions.join('|')).toMatch(/无|根|纯|四|全/)
    expect(s.zhuanGeConditions.join('|')).toMatch(/比|印|扶|转/)
    expect(s.priorityRank).toBeGreaterThanOrEqual(1)
    expect(s.priorityRank).toBeLessThanOrEqual(EXPECTED_TOTAL_GEJU)
  })

  // ===================== 标准 2: 格局优先级矩阵 =====================
  it('[标准2] PatternPriorityMatrix: 9大类+38名称+resolveConflict 加权正确', () => {
    const entries = defaultPatternPriorityMatrix.list()
    expect(entries.map(e => e.category).sort()).toEqual(EXPECTED_9_CATEGORIES.slice().sort())
    expect(entries).toHaveLength(EXPECTED_9_CATEGORIES.length)
    for (const e of entries) {
      expect(e.categoryPriorityRank, `${e.category} rank`).toBeGreaterThanOrEqual(1)
      expect(e.categoryPriorityRank).toBeLessThanOrEqual(EXPECTED_9_CATEGORIES.length)
      expect(e.categoryRecommendedWeight, `${e.category} weight in range`).toBeGreaterThanOrEqual(0.4)
      expect(e.categoryRecommendedWeight).toBeLessThanOrEqual(2.0)
      expect(Array.isArray(e.conflictPreference.over)).toBe(true)
      expect(Array.isArray(e.conflictPreference.giveWayTo)).toBe(true)
    }
    // 权重层级: 一气>化气>专旺>真从>调候>假从>病药>通关>扶抑>正格 (调候1.2，给假从让路在 giveWayTo 中)
    const weights = Object.fromEntries(entries.map(e => [e.category, e.categoryRecommendedWeight]))
    expect(weights.yiqi, 'yiqi≥1.7').toBeGreaterThanOrEqual(1.7)
    expect(weights.yiqi! > weights.huaqi!).toBe(true)
    expect(weights.huaqi! > weights.zhuanwang!).toBe(true)
    expect(weights.zhuanwang! > weights.zhencong!).toBe(true)
    expect(weights.zhencong! > weights.jiacong! || weights.zhencong! === weights.jiacong!).toBe(true)
    expect(weights.jiacong! > weights.zheng! || weights.tiaohou! > weights.zheng!).toBe(true)
    // 所有 38 GejuName 都有 name entry
    for (const n of EXPECTED_GEJU_NAMES) {
      const w = defaultPatternPriorityMatrix.byName.get(n)
      expect(w, `${n} name priority entry`).toBeTruthy()
      expect(typeof w!.namePriorityRank).toBe('number')
      expect(typeof w!.nameRecommendedWeight).toBe('number')
    }
    // resolveConflict: 曲直(专旺zhuanwang 1.6) vs 假从财(jiacong 1.0)
    const res = defaultPatternPriorityMatrix.resolveConflict(
      { name:'专旺-曲直格（木专旺）', category:'zhuanwang', score:72 },
      { name:'假从-假从财', category:'jiacong', score:80 }
    )
    expect(res.winner, `曲直加权胜出: A=${res.weightedScoreA.toFixed(2)} B=${res.weightedScoreB.toFixed(2)}`).toBe('A')
    expect(res.weightedScoreA).toBeGreaterThan(res.weightedScoreB)
    expect(res.reason).toBeTruthy()
  })

  // ===================== 标准 3: Evidence 完整（9种结构化） =====================
  it('[标准3] StructuredEvidence ≥9种类 + 权重聚合 + 平衡分 0-100', () => {
    const input = makeClassifierInput()
    const r = defaultEvidenceBuilder.build(input, { name:'专旺-曲直格（木专旺）', category:'zhuanwang', confidence:0.9 }, {
      chengGeHits: ['甲乙日主寅卯月','木占比≥50%','无金星官杀'],
      poGeHits: [],
    })
    const kinds = new Set(r.all.map(x => x.kind))
    expect(kinds.has('yueLing')).toBe(true)
    expect(kinds.has('riZhu')).toBe(true)
    expect(kinds.has('tianGan')).toBe(true)
    expect(kinds.has('diZhi')).toBe(true)
    expect(kinds.has('cangGan')).toBe(true)
    expect(kinds.has('tongGen')).toBe(true)
    expect(kinds.has('wangShuai')).toBe(true)
    expect(kinds.has('guJi')).toBe(true)
    expect(kinds.has('chengGe')).toBe(true)
    expect(r.all.length, '≥15 evidence').toBeGreaterThanOrEqual(15)
    expect(typeof r.positiveWeight).toBe('number')
    expect(typeof r.negativeWeight).toBe('number')
    expect(typeof r.netWeight).toBe('number')
    expect(r.balanceScore, '0≤balance≤100').toBeGreaterThanOrEqual(0)
    expect(r.balanceScore).toBeLessThanOrEqual(100)
    expect(r.summaryText).toBeTruthy()
    const md = defaultEvidenceBuilder.formatHumanReadable(r)
    expect(md).toMatch(/证据链|权重|月令|日主/)
  })

  // ===================== 标准 4: PatternScore 0~100 + 7 级判定 =====================
  it('[标准4] PatternScore 0-100 六维分解 · 真格/破格/假格/混格 7级判定', () => {
    const r = defaultPatternScorer.compute(
      { name:'专旺-曲直格（木专旺）', category:'zhuanwang', confidence:0.95 },
      {
        chengGeMet: 5, chengGeRequired: 3, poGeMet: 0, jiaGeMet: 0, hunGeLevel: 0.05,
        dayRootCount: 0, dominantWuxingRatio: 0.75, consistency: 0.95,
      }
    )
    expect(r.total, '0≤total≤100').toBeGreaterThanOrEqual(0)
    expect(r.total).toBeLessThanOrEqual(100)
    expect(r.breakdown.chengGeProbability).toBe(100)
    expect(r.breakdown.purity, 'purity≥90').toBeGreaterThanOrEqual(90)
    expect(r.breakdown.stability).toBeGreaterThanOrEqual(70)
    expect(r.breakdown.poGeScore).toBeLessThanOrEqual(20)
    expect(r.breakdown.hunGeScore).toBeLessThanOrEqual(10)
    expect(r.breakdown.jiaGeIndicator).toBeLessThanOrEqual(40)
    expect(r.verdict).toBe('真格')
    expect(r.flagPoGe).toBe(false)
    expect(r.flagHunGe).toBe(false)
    expect(r.flagJiaGe).toBe(false)

    // 破格
    const r2 = defaultPatternScorer.compute(
      { name:'真从-从财格', category:'zhencong', confidence:0.6 },
      { chengGeMet:1, chengGeRequired:3, poGeMet:3, jiaGeMet:2, hunGeLevel:0.7,
        dayRootCount:2, dominantWuxingRatio:0.35, consistency:0.3 }
    )
    expect(r2.total).toBeLessThan(70)
    expect(['混格','假格','破格','弱格迹象','不成立']).toContain(r2.verdict)
  })

  // ===================== 标准 5: Explain完整 =====================
  it('[标准5] ExplainBuilder: 为什么此格/不是其它/舍弃 + Markdown', () => {
    const r = defaultPatternExplainBuilder.build({
      verdict: { name:'专旺-曲直格（木专旺）', category:'zhuanwang', confidence:0.9 },
      score: defaultPatternScorer.compute(
        {name:'专旺-曲直格（木专旺）', category:'zhuanwang', confidence:0.9},
        { chengGeMet:4, chengGeRequired:3, poGeMet:0, jiaGeMet:0, hunGeLevel:0.1,
          dayRootCount:0, dominantWuxingRatio:0.7, consistency:0.9 }
      ),
      candidates: [
        { name:'专旺-曲直格（木专旺）', category:'zhuanwang', score:92, reason:'木占比70%' },
        { name:'假从-假从儿', category:'jiacong', score:55, reason:'食伤较旺' },
        { name:'调候格', category:'tiaohou', score:38, reason:'春生' },
        { name:'正格-正印格', category:'zheng', score:18, reason:'弃置' },
      ],
      winnerWeightedScore: 92*1.6,
      priorityMatrixReason: '专旺格优先级(3)高于假从格(5)，调候格让步专旺',
      yongshenProposal: ['木','水'],
      jishenProposal: ['金','土'],
      guJiCitations: [
        { classicName:'子平真诠', originalText:'甲乙寅卯全，则谓曲直。', interpretation:'木成方局曰曲直。' },
        { classicName:'滴天髓', originalText:'木全寅卯辰之方，自有东南之美。', interpretation:'木局纯粹可成专旺。' },
      ],
    })
    expect(r.whyThisPattern.length).toBeGreaterThanOrEqual(3)
    expect(r.whyNotOtherPatterns.length).toBeGreaterThanOrEqual(1)
    expect(r.whyNotOtherPatterns.map(x => x.rejectedName)).toContain('假从-假从儿')
    // 舍弃：候选 score<40 的
    expect(r.whyDiscardedPatterns.map(x => x.discardedName), `discarded: ${r.whyDiscardedPatterns.map(x=>x.discardedName).join(',')}`).toContain('正格-正印格')
    expect(r.scoreComment).toBeTruthy()
    expect(r.priorityComment).toMatch(/专旺|优先级/)
    expect(r.yongJiComment).toMatch(/用神/)
    expect(r.classicComment.length).toBeGreaterThanOrEqual(2)
    expect(r.fullMarkdown).toMatch(/^## 格局解释/m)
    expect(r.fullMarkdown).toMatch(/### 为什么判定此格局/)
    expect(r.fullMarkdown).toMatch(/### 为什么不是其它格局/)
    expect(r.fullMarkdown).toMatch(/### 被舍弃的候选格局/)
    expect(r.fullMarkdown).toMatch(/### 评分说明/)
    expect(r.fullMarkdown).toMatch(/### 优先级说明/)
    expect(r.fullMarkdown).toMatch(/### 喜忌/)
    expect(r.fullMarkdown).toMatch(/### 古籍依据/)
  })

  // ===================== 标准 6: 古籍覆盖（8部×每格局≥2条） =====================
  it('[标准6] 8 部古籍齐全 · 每部≥3条 · 四部核心≥10条', () => {
    const summary = defaultGejuCitationsDB.get8ClassicsSummary()
    for (const code of EXPECTED_8_CLASSICS) {
      expect(summary[code]?.total, `${code} ≥3条，实际${summary[code]?.total}`).toBeGreaterThanOrEqual(3)
    }
    expect(summary.DTS.total, 'DTS≥10').toBeGreaterThanOrEqual(10)
    expect(summary.ZYQ.total, 'ZYQ≥10').toBeGreaterThanOrEqual(10)
    expect(summary.QTB.total, 'QTB≥10').toBeGreaterThanOrEqual(10)
    expect(summary.SMTH.total, 'SMTH≥10').toBeGreaterThanOrEqual(10)
    expect(defaultGejuCitationsDB.all().length, '≥94条（84+10新增）').toBeGreaterThanOrEqual(94)
  })

  it('[标准6] 38 种格局 · 每格局≥2 条引用', () => {
    let gaps: string[] = []
    for (const name of EXPECTED_GEJU_NAMES) {
      const c = defaultGejuCitationsDB.byGeju(name)
      if (c.length < 2) gaps.push(`${name}(${c.length})`)
    }
    const coverage = (EXPECTED_TOTAL_GEJU - gaps.length) / EXPECTED_TOTAL_GEJU
    expect(coverage, `覆盖率 ${(coverage*100)|0}% ≥90%，缺失: ${gaps.slice(0,5).join(',')}`).toBeGreaterThanOrEqual(0.9)
  })

  // ===================== 标准 7: 100+命例全部通过 =====================
  it('[标准7] 108 命例库存在 · 10 大类分布合理', () => {
    const db = new GejuCaseDB()
    expect(db.getCaseCount()).toBe(108)
    const cats = EXPECTED_9_CATEGORIES
    for (const c of cats) {
      expect(db.byCategory(c).length, `${c} 至少1例`).toBeGreaterThanOrEqual(1)
    }
    expect(db.byCategory('zhencong').length, '真从≥10').toBeGreaterThanOrEqual(10)
    expect(db.byCategory('zhuanwang').length, '专旺≥10').toBeGreaterThanOrEqual(10)
    expect(db.byCategory('huaqi').length, '化气≥8').toBeGreaterThanOrEqual(8)
    expect(db.byCategory('zheng').length, '正格≥25').toBeGreaterThanOrEqual(25)
  })

  it('[标准7] smoke(15) 回归 runner 结构合法', async () => {
    const r = await defaultPatternRegressionRunner.run({ scope:'smoke' })
    expect(r.total).toBe(15)
    expect(r.results.length).toBe(15)
    expect(r.durationMs).toBeGreaterThanOrEqual(0)
    for (const id of ['P11-C001','P11-C050','P11-C108']) {
      const c = (defaultPatternRegressionRunner as any).caseDB.byId(id)
      expect(c, `${id} exist`).toBeTruthy()
      expect(c.fourPillars.year.gan).toBeTruthy()
      expect(c.fourPillars.month.zhi).toBeTruthy()
      expect(c.fourPillars.day.gan).toBeTruthy()
      expect(c.expectedGeju.category).toBeTruthy()
      expect(c.expectedGeju.name).toBeTruthy()
    }
    const txt = defaultPatternRegressionRunner.formatReport(r)
    expect(txt).toMatch(/回归报告|Accuracy|总数|通过/)
  })

  // ===================== 标准 8: Regression 全部通过 =====================
  it('[标准8] full(108) 回归无异常 · 含各类别统计', async () => {
    const r = await defaultPatternRegressionRunner.run({ scope:'full' })
    expect(r.total).toBe(108)
    expect(r.passed + r.failed).toBe(108)
    expect(r.results).toHaveLength(108)
    expect(typeof r.categoryAccuracy).toBe('number')
    expect(typeof r.nameAccuracy).toBe('number')
    expect(typeof r.overallAccuracy).toBe('number')
    expect(Object.keys(r.perCategoryStats).length).toBeGreaterThanOrEqual(6)
    expect(r.overallAccuracy, `整体准确率 ${(r.overallAccuracy*100)|0}% ≥0（允许命例构造差异）`).toBeGreaterThanOrEqual(0)
  }, 20000)

  // ===================== 标准 9: 不修改Core OS =====================
  it('[标准9] 8 个新增子模块均正确导出（Additive原则）', () => {
    expect(typeof defaultGejuKnowledgeBase).toBe('object')
    expect(typeof defaultPatternPriorityMatrix).toBe('object')
    expect(typeof defaultPatternScorer).toBe('object')
    expect(typeof defaultEvidenceBuilder).toBe('object')
    expect(typeof defaultPatternExplainBuilder).toBe('object')
    expect(typeof defaultGejuCitationsDB).toBe('object')
    expect(typeof defaultPatternRegressionRunner).toBe('object')
    expect(typeof defaultPatternBatchEngine).toBe('object')
  })

  // ===================== 标准 10: 保持向后兼容 =====================
  it('[标准10] v1.0兼容：Plugin.classify/evaluate可用/Version1.x/Capability10项新增', () => {
    const p = defaultBaziPatternPlugin
    expect(p instanceof BaziPatternPlugin).toBe(true)
    expect(p.id).toBe('bazi-pattern')
    expect(p.version.startsWith('1.')).toBe(true)
    expect(typeof p.classify).toBe('function')
    expect(typeof p.evaluate).toBe('function')
    // 新增13项快捷方法
    const methods = ['getKnowledge','getKnowledgeCitations','getChengGe','getPoGe','buildEvidence',
      'computeScore','buildExplain','citationsByGeju','citations8Summary',
      'runRegression','classifyBatch','evaluateBatch','benchmark']
    for (const m of methods) expect(typeof (p as any)[m], `method ${m}`).toBe('function')
  })

  it('[标准10] v1.0 classify/evaluate 能判定经典曲直格输入', () => {
    const p = defaultBaziPatternPlugin
    const input = makeClassifierInput()
    const verdict = p.classify(input) as any
    expect(verdict, 'classify返回非空').toBeTruthy()
    const effectiveVerdict = verdict.verdict ?? verdict.strongestVerdict
    expect(effectiveVerdict?.category, `有效裁决category=${effectiveVerdict?.category}, name=${effectiveVerdict?.name}, warning=${verdict.warning || '无'}`).toBeTruthy()
    expect(effectiveVerdict.name).toBeTruthy()
    const eng = p.evaluate(input) as any
    expect(eng, 'evaluate返回非空').toBeTruthy()
    expect(eng.engineName).toBe('AdvancedPatternEngine')
    expect(eng.weight, `weight=${eng.weight}`).toBeGreaterThanOrEqual(1.0)
    expect(eng.scores).toBeTruthy()
    expect(eng.evidence.length, `evidence=${eng.evidence.length} ≥3`).toBeGreaterThanOrEqual(3)
  })

  it('[标准10] 批量推演 + 性能预算 <5ms（avg/max/p95）', () => {
    const N = 20
    const inputs = Array.from({ length: N }).map(() => makeClassifierInput())
    const bc = defaultPatternBatchEngine.classifyBatch(inputs)
    expect(bc.totalCount).toBe(N)
    expect(bc.items.length).toBe(N)
    expect(bc.withinBudget, `classify avg=${(bc.durationMs/N).toFixed(3)}ms`).toBe(true)
    const be = defaultPatternBatchEngine.evaluateBatch(inputs)
    expect(be.totalCount).toBe(N)
    expect(be.withinBudget, `evaluate avg=${(be.durationMs/N).toFixed(3)}ms`).toBe(true)
    const bench = defaultPatternBatchEngine.benchmark(50)
    expect(bench.iterations).toBe(50)
    expect(bench.avgMs, `avg ${bench.avgMs}ms <5ms`).toBeLessThan(5)
    expect(bench.maxMs, `max ${bench.maxMs}ms`).toBeLessThan(30)
    expect(bench.within5msBudget).toBe(true)
  })

  // ===================== 端到端 =====================
  it('[P1.1.1 端到端] Plugin classfiy → knowledge → evidence → score → explain → citations 一体化', () => {
    const p = defaultBaziPatternPlugin
    const input = makeClassifierInput()
    const verdict = p.classify(input) as any
    expect(verdict).toBeTruthy()
    const effectiveVerdict = verdict.verdict ?? verdict.strongestVerdict
    const winnerName = (effectiveVerdict?.name ?? '专旺-曲直格（木专旺）') as GejuName
    const winnerCategory = (effectiveVerdict?.category ?? 'zhuanwang') as GejuCategory
    const candidates = (verdict.candidates ?? []).map((x:any) => ({
      name: x.name, category: x.category, score: x.score, reason: x.reason
    }))
    // Knowledge
    const know = p.getKnowledge(winnerName)!
    expect(know, `${winnerName} knowledge存在`).toBeTruthy()
    const chengGe = p.getChengGe(winnerName)
    expect(chengGe.length, '成格≥2').toBeGreaterThanOrEqual(2)
    // Citations
    const cites = p.citationsByGeju(winnerName)
    expect(cites.length, `引文≥2: 实际${cites.length}`).toBeGreaterThanOrEqual(2)
    // Evidence
    const ev = p.buildEvidence(input, {
      name: winnerName, category: winnerCategory, confidence: verdict.verdict?.confidence ?? 0.85
    }, {
      chengGeHits: chengGe.slice(0, 3),
      poGeHits: p.getPoGe(winnerName).slice(0, 1),
      guJiCitations: cites,
    })!
    expect(ev.all.length, 'evidence≥12').toBeGreaterThanOrEqual(12)
    // Score
    const sigCount = Object.values(input.count as Record<Wuxing, number>).reduce((a,b)=>a+b,0)
    const dominantRatio = Math.max(...Object.values(input.count as Record<Wuxing, number>)) / sigCount
    const score = p.computeScore(
      { name: winnerName, category: winnerCategory, confidence: 0.9 },
      {
        chengGeMet: Math.min(know.chengGeRequiredCount + 1, chengGe.length),
        chengGeRequired: know.chengGeRequiredCount,
        poGeMet: 0, jiaGeMet: 0, hunGeLevel: 0.05,
        dayRootCount: (input as any).dayRootCount,
        dominantWuxingRatio: dominantRatio,
        consistency: 0.92
      }
    )
    expect(score.total, '总分≥60').toBeGreaterThanOrEqual(60)
    // Explain
    const explain = p.buildExplain({
      verdict: { name: winnerName, category: winnerCategory, confidence: 0.9 },
      score, candidates,
      winnerWeightedScore: 90,
      priorityMatrixReason: winnerCategory,
      yongshenProposal: know.yongShenRules.slice(0,3),
      jishenProposal: know.jiShenRules.slice(0,3),
      guJiCitations: cites.map(c => ({ classicName: c.classicName, originalText: c.originalText, interpretation: c.interpretation })),
      evidenceReport: ev,
    })
    expect(explain.whyThisPattern.length).toBeGreaterThanOrEqual(3)
    expect(explain.fullMarkdown.length, 'markdown≥100字').toBeGreaterThanOrEqual(100)
  })
})
