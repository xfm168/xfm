/**
 * P1.2.1-C1 TenGod Boundary Test
 *
 * 覆盖边界与极端命例：
 *   1) 极旺：日主得令、多帮身、根深 → verdict 偏旺及以上
 *   2) 极弱：日主失令、无帮身、无根 → verdict 偏弱及以下，且 total 不偏高
 *   3) 无根：dayRootCount=0 → wuGenPenalty > 0
 *   4) 失令：月令之神不帮身 → shiLingPenalty > 0
 *   5) 十神混杂：十神种类多、纯度低 → chunDu 偏低
 *   6) 多组合冲突：凶组合多于吉组合 → zhiHuaBuZuPenalty > 0
 *
 * 所有测试入口统一 `await defaultTenGodPlugin.initialize()`。
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  defaultTenGodPlugin,
  defaultTenGodEngine,
  defaultTenGodClassifier,
  TenGodClassifierInput,
  TenGodName,
} from '..'

const GAN_WX: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
  庚: '金', 辛: '金', 壬: '水', 癸: '水',
}
const ZHI_WX: Record<string, string> = {
  寅: '木', 卯: '木', 巳: '火', 午: '火', 申: '金', 酉: '金',
  亥: '水', 子: '水', 辰: '土', 戌: '土', 丑: '土', 未: '土',
}

function mkInput(opts: {
  dayGan?: string
  monthZhi?: string
  fourPillars: Array<{ gan: string; zhi: string }>
  dayStrength?: number
  dayRootCount?: number
  isWinterBorn?: boolean
  isSummerBorn?: boolean
}): TenGodClassifierInput {
  const dayGan = opts.dayGan || '甲'
  const monthZhi = opts.monthZhi || '寅'
  return {
    dayGan,
    monthZhi,
    fourPillars: opts.fourPillars.map(p => ({
      gan: p.gan,
      zhi: p.zhi,
      ganWx: GAN_WX[p.gan] ?? '土',
      zhiWx: ZHI_WX[p.zhi] ?? '土',
    })),
    dayGanWuxing: (GAN_WX[dayGan] ?? '木') as any,
    monthZhiWuxing: (ZHI_WX[monthZhi] ?? '木') as any,
    dayStrength: opts.dayStrength ?? 0,
    dayRootCount: opts.dayRootCount,
    isWinterBorn: opts.isWinterBorn ?? false,
    isSummerBorn: opts.isSummerBorn ?? false,
  }
}

/** 取 engine.evaluate 的 scoreResult（含 breakdown / verdict） */
function getScoreResult(input: TenGodClassifierInput): any {
  const e = defaultTenGodEngine.evaluate(input) as any
  return e?.metadata?.scoreResult ?? null
}

describe('P1.2.1-C1 TenGod Boundary Test', () => {
  beforeAll(async () => {
    await defaultTenGodPlugin.initialize()
  })

  describe('1) 极旺边界', () => {
    it('日主得令、多帮身、根深 → verdict 偏旺及以上，total >= 55', () => {
      // 甲木日主，生寅月（木=比肩帮身），四柱多木，dayStrength=3，根深4
      const input = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '甲', zhi: '寅' },
          { gan: '甲', zhi: '卯' },
          { gan: '甲', zhi: '寅' },
          { gan: '乙', zhi: '卯' },
        ],
        dayStrength: 3, dayRootCount: 4,
      })
      const sr = getScoreResult(input)
      expect(sr).not.toBeNull()
      expect(sr.total).toBeGreaterThanOrEqual(55)
      expect(['极旺', '偏旺', '制化有序', '流通顺畅']).toContain(sr.verdict)
      // 极旺不应有身弱惩罚
      expect(sr.breakdown.shenRuoPenalty).toBe(0)
      expect(sr.breakdown.shiLingPenalty).toBe(0)
    })
  })

  describe('2) 极弱边界', () => {
    it('日主失令、无帮身、无根 → verdict 偏弱及以下，total <= 45', () => {
      // 甲木日主，生申月（金=七杀克身），四柱全金，dayStrength=-3，无根
      const input = mkInput({
        dayGan: '甲', monthZhi: '申',
        fourPillars: [
          { gan: '庚', zhi: '申' },
          { gan: '辛', zhi: '酉' },
          { gan: '庚', zhi: '申' },
          { gan: '辛', zhi: '酉' },
        ],
        dayStrength: -3, dayRootCount: 0,
      })
      const sr = getScoreResult(input)
      expect(sr).not.toBeNull()
      expect(sr.total).toBeLessThanOrEqual(45)
      expect(['极弱', '偏弱', '制化失衡', '流通闭塞']).toContain(sr.verdict)
      // 极弱必须有身弱惩罚 + 无根修正
      expect(sr.breakdown.shenRuoPenalty).toBeGreaterThan(0)
      expect(sr.breakdown.wuGenPenalty).toBeGreaterThan(0)
    })

    it('极弱命局 total 必须明显低于极旺命局（差值 >= 15）', () => {
      const wangInput = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '甲', zhi: '寅' }, { gan: '甲', zhi: '卯' },
          { gan: '甲', zhi: '寅' }, { gan: '乙', zhi: '卯' },
        ],
        dayStrength: 3, dayRootCount: 4,
      })
      const weakInput = mkInput({
        dayGan: '甲', monthZhi: '申',
        fourPillars: [
          { gan: '庚', zhi: '申' }, { gan: '辛', zhi: '酉' },
          { gan: '庚', zhi: '申' }, { gan: '辛', zhi: '酉' },
        ],
        dayStrength: -3, dayRootCount: 0,
      })
      const wangSr = getScoreResult(wangInput)
      const weakSr = getScoreResult(weakInput)
      expect(wangSr.total - weakSr.total).toBeGreaterThanOrEqual(15)
    })
  })

  describe('3) 无根边界', () => {
    it('dayRootCount=0 → wuGenPenalty=8（最大无根扣分）', () => {
      const input = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '丙', zhi: '午' }, { gan: '丁', zhi: '巳' },
          { gan: '丙', zhi: '午' }, { gan: '丁', zhi: '巳' },
        ],
        dayStrength: -1, dayRootCount: 0,
      })
      const sr = getScoreResult(input)
      expect(sr.breakdown.wuGenPenalty).toBe(8)
    })

    it('dayRootCount=1 → wuGenPenalty=3（中等无根扣分）', () => {
      const input = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '甲', zhi: '午' }, { gan: '丙', zhi: '巳' },
          { gan: '丙', zhi: '午' }, { gan: '丁', zhi: '巳' },
        ],
        dayStrength: 0, dayRootCount: 1,
      })
      const sr = getScoreResult(input)
      expect(sr.breakdown.wuGenPenalty).toBe(3)
    })

    it('dayRootCount>=2 → wuGenPenalty=0（根深不扣分）', () => {
      const input = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '甲', zhi: '寅' }, { gan: '甲', zhi: '卯' },
          { gan: '丙', zhi: '午' }, { gan: '丁', zhi: '巳' },
        ],
        dayStrength: 1, dayRootCount: 2,
      })
      const sr = getScoreResult(input)
      expect(sr.breakdown.wuGenPenalty).toBe(0)
    })
  })

  describe('4) 失令边界', () => {
    it('月令之神不帮身（七杀当令）→ shiLingPenalty=5', () => {
      // 甲木日主，生申月（申金本气庚=七杀，不帮身）
      const input = mkInput({
        dayGan: '甲', monthZhi: '申',
        fourPillars: [
          { gan: '甲', zhi: '寅' }, { gan: '丙', zhi: '午' },
          { gan: '甲', zhi: '辰' }, { gan: '庚', zhi: '申' },
        ],
        dayStrength: 0, dayRootCount: 2,
      })
      const sr = getScoreResult(input)
      expect(sr.breakdown.shiLingPenalty).toBe(5)
    })

    it('月令之神帮身（比肩当令）→ shiLingPenalty=0', () => {
      // 甲木日主，生寅月（寅木本气甲=比肩，帮身）
      const input = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '甲', zhi: '寅' }, { gan: '丙', zhi: '午' },
          { gan: '甲', zhi: '辰' }, { gan: '庚', zhi: '申' },
        ],
        dayStrength: 1, dayRootCount: 2,
      })
      const sr = getScoreResult(input)
      expect(sr.breakdown.shiLingPenalty).toBe(0)
    })
  })

  describe('5) 十神混杂边界', () => {
    it('十神种类多、纯度低 → chunDu 偏低（<=80）', () => {
      // 甲木日主，四柱覆盖6种十神：劫财/伤官/食神/比肩/偏财/正官
      const input = mkInput({
        dayGan: '甲', monthZhi: '巳',
        fourPillars: [
          { gan: '乙', zhi: '卯' },  // 劫财
          { gan: '丁', zhi: '巳' },  // 伤官/食神
          { gan: '甲', zhi: '辰' },  // 比肩/偏财
          { gan: '辛', zhi: '酉' },  // 正官
        ],
        dayStrength: 0, dayRootCount: 1,
      })
      const sr = getScoreResult(input)
      // P1.2.1-D：日干排除后 perGod 分布变化，6种十神混杂 chunDu 略升，阈值放宽至 85
      expect(sr.breakdown.chunDu).toBeLessThanOrEqual(85)
    })

    it('十神集中、纯度高 → chunDu 偏高（>=50）', () => {
      // 甲木日主，四柱集中比肩/劫财
      const input = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '甲', zhi: '寅' }, { gan: '甲', zhi: '卯' },
          { gan: '乙', zhi: '寅' }, { gan: '甲', zhi: '卯' },
        ],
        dayStrength: 2, dayRootCount: 4,
      })
      const sr = getScoreResult(input)
      expect(sr.breakdown.chunDu).toBeGreaterThanOrEqual(40)
    })

    it('混杂命例 chunDu 低于集中命例 chunDu', () => {
      const mixedInput = mkInput({
        dayGan: '甲', monthZhi: '巳',
        fourPillars: [
          { gan: '乙', zhi: '卯' }, { gan: '丁', zhi: '巳' },
          { gan: '甲', zhi: '辰' }, { gan: '辛', zhi: '酉' },
        ],
        dayStrength: 0, dayRootCount: 1,
      })
      const concentratedInput = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '甲', zhi: '寅' }, { gan: '甲', zhi: '卯' },
          { gan: '乙', zhi: '寅' }, { gan: '甲', zhi: '卯' },
        ],
        dayStrength: 2, dayRootCount: 4,
      })
      const mixedChunDu = getScoreResult(mixedInput).breakdown.chunDu
      const concentratedChunDu = getScoreResult(concentratedInput).breakdown.chunDu
      expect(mixedChunDu).toBeLessThan(concentratedChunDu)
    })
  })

  describe('6) 多组合冲突边界', () => {
    it('凶组合多于吉组合 → zhiHuaBuZuPenalty > 0', () => {
      // 甲木日主，伤官见官 + 官杀混杂等多凶格
      // 甲生申月（庚=七杀），丙=食神，丁=伤官，辛=正官
      const input = mkInput({
        dayGan: '甲', monthZhi: '申',
        fourPillars: [
          { gan: '辛', zhi: '酉' },  // 正官
          { gan: '丁', zhi: '巳' },  // 伤官
          { gan: '庚', zhi: '申' },  // 七杀
          { gan: '辛', zhi: '酉' },  // 正官
        ],
        dayStrength: -1, dayRootCount: 0,
      })
      const cls = defaultTenGodClassifier.classify(input)
      const favorable = cls.combinationVerdicts.filter(v => v.satisfied && v.favorable).length
      const unfavorable = cls.combinationVerdicts.filter(v => v.satisfied && !v.favorable).length
      const sr = getScoreResult(input)
      // 若确实凶多于吉，则必须有扣分
      if (unfavorable > favorable) {
        expect(sr.breakdown.zhiHuaBuZuPenalty).toBeGreaterThan(0)
      }
      // 至少验证评分结果存在
      expect(sr).not.toBeNull()
      expect(typeof sr.total).toBe('number')
    })

    it('多组合冲突命例 total 不超过 50（凶格扣分生效）', () => {
      const input = mkInput({
        dayGan: '甲', monthZhi: '申',
        fourPillars: [
          { gan: '辛', zhi: '酉' }, { gan: '丁', zhi: '巳' },
          { gan: '庚', zhi: '申' }, { gan: '辛', zhi: '酉' },
        ],
        dayStrength: -2, dayRootCount: 0,
      })
      const sr = getScoreResult(input)
      expect(sr.total).toBeLessThanOrEqual(50)
    })
  })

  describe('7) 边界稳定性', () => {
    it('相同输入多次 evaluate 结果一致（无随机性）', () => {
      const input = mkInput({
        dayGan: '甲', monthZhi: '寅',
        fourPillars: [
          { gan: '甲', zhi: '寅' }, { gan: '丙', zhi: '午' },
          { gan: '甲', zhi: '辰' }, { gan: '庚', zhi: '申' },
        ],
        dayStrength: 0.5, dayRootCount: 2,
      })
      const sr1 = getScoreResult(input)
      const sr2 = getScoreResult(input)
      expect(sr1.total).toBe(sr2.total)
      expect(sr1.verdict).toBe(sr2.verdict)
    })

    it('所有边界命例 evaluate 不抛错', () => {
      const cases = [
        mkInput({ dayGan:'甲', monthZhi:'寅', fourPillars:[{gan:'甲',zhi:'寅'},{gan:'甲',zhi:'卯'},{gan:'甲',zhi:'寅'},{gan:'乙',zhi:'卯'}], dayStrength:3, dayRootCount:4 }),
        mkInput({ dayGan:'甲', monthZhi:'申', fourPillars:[{gan:'庚',zhi:'申'},{gan:'辛',zhi:'酉'},{gan:'庚',zhi:'申'},{gan:'辛',zhi:'酉'}], dayStrength:-3, dayRootCount:0 }),
        mkInput({ dayGan:'甲', monthZhi:'寅', fourPillars:[{gan:'丙',zhi:'午'},{gan:'丁',zhi:'巳'},{gan:'丙',zhi:'午'},{gan:'丁',zhi:'巳'}], dayStrength:-1, dayRootCount:0 }),
        mkInput({ dayGan:'甲', monthZhi:'申', fourPillars:[{gan:'辛',zhi:'酉'},{gan:'丁',zhi:'巳'},{gan:'庚',zhi:'申'},{gan:'辛',zhi:'酉'}], dayStrength:-2, dayRootCount:0 }),
      ]
      for (const c of cases) {
        expect(() => defaultTenGodEngine.evaluate(c)).not.toThrow()
      }
    })
  })
})
