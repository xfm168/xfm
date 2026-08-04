/**
 * P1.2.1-C3 TenGod Score Calibration Test
 *
 * 验证评分趋势符合命理逻辑：
 *   1) 旺 > 中和 > 弱 趋势成立
 *   2) 极弱不出现高分（total <= 45）
 *   3) 五档样本：极强 / 强 / 中和 / 弱 / 极弱 单调递减
 *   4) 身弱/失令/无根/制化不足扣分生效
 *   5) 评分范围 [0, 100]
 *
 * 所有测试入口统一 `await defaultTenGodPlugin.initialize()`。
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  defaultTenGodPlugin,
  defaultTenGodEngine,
  TenGodClassifierInput,
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
    isWinterBorn: false,
    isSummerBorn: false,
  }
}

function getScore(input: TenGodClassifierInput): any {
  const e = defaultTenGodEngine.evaluate(input) as any
  return e?.metadata?.scoreResult ?? null
}

// ===== 五档样本 =====
// 极强：甲木日主，寅月当令，四柱多木比劫帮身，根深4，dayStrength=3
const JI_QIANG = mkInput({
  dayGan: '甲', monthZhi: '寅',
  fourPillars: [
    { gan: '甲', zhi: '寅' }, { gan: '甲', zhi: '卯' },
    { gan: '甲', zhi: '寅' }, { gan: '乙', zhi: '卯' },
  ],
  dayStrength: 3, dayRootCount: 4,
})

// 强：甲木日主，寅月当令，比劫+食伤，根深3，dayStrength=1.5
const QIANG = mkInput({
  dayGan: '甲', monthZhi: '寅',
  fourPillars: [
    { gan: '甲', zhi: '寅' }, { gan: '甲', zhi: '卯' },
    { gan: '丙', zhi: '午' }, { gan: '庚', zhi: '申' },
  ],
  dayStrength: 1.5, dayRootCount: 3,
})

// 中和：甲木日主，寅月，四柱均衡，根深2，dayStrength=0
const ZHONG_HE = mkInput({
  dayGan: '甲', monthZhi: '寅',
  fourPillars: [
    { gan: '甲', zhi: '寅' }, { gan: '丙', zhi: '午' },
    { gan: '甲', zhi: '辰' }, { gan: '庚', zhi: '申' },
  ],
  dayStrength: 0, dayRootCount: 2,
})

// 弱：甲木日主，申月失令，官杀重，根浅1，dayStrength=-1
const RUO = mkInput({
  dayGan: '甲', monthZhi: '申',
  fourPillars: [
    { gan: '甲', zhi: '寅' }, { gan: '庚', zhi: '申' },
    { gan: '辛', zhi: '酉' }, { gan: '庚', zhi: '申' },
  ],
  dayStrength: -1, dayRootCount: 1,
})

// 极弱：甲木日主，申月失令，四柱全金克身，无根，dayStrength=-3
const JI_RUO = mkInput({
  dayGan: '甲', monthZhi: '申',
  fourPillars: [
    { gan: '庚', zhi: '申' }, { gan: '辛', zhi: '酉' },
    { gan: '庚', zhi: '申' }, { gan: '辛', zhi: '酉' },
  ],
  dayStrength: -3, dayRootCount: 0,
})

describe('P1.2.1-C3 TenGod Score Calibration Test', () => {
  beforeAll(async () => {
    await defaultTenGodPlugin.initialize()
  })

  describe('1) 旺 > 中和 > 弱 趋势', () => {
    it('极强 > 强 > 中和 > 弱 > 极弱（单调递减）', () => {
      const s1 = getScore(JI_QIANG).total
      const s2 = getScore(QIANG).total
      const s3 = getScore(ZHONG_HE).total
      const s4 = getScore(RUO).total
      const s5 = getScore(JI_RUO).total
      expect(s1).toBeGreaterThan(s2)
      expect(s2).toBeGreaterThan(s3)
      expect(s3).toBeGreaterThan(s4)
      expect(s4).toBeGreaterThan(s5)
    })

    it('旺命 total > 中和 total', () => {
      const wang = getScore(JI_QIANG).total
      const zh = getScore(ZHONG_HE).total
      expect(wang).toBeGreaterThan(zh)
    })

    it('中和 total > 弱 total', () => {
      const zh = getScore(ZHONG_HE).total
      const r = getScore(RUO).total
      expect(zh).toBeGreaterThan(r)
    })
  })

  describe('2) 禁止极弱高分', () => {
    it('极弱命例 total <= 45', () => {
      const s = getScore(JI_RUO)
      expect(s.total).toBeLessThanOrEqual(45)
    })

    it('极弱命例 total 明显低于极强命例（差值 >= 15）', () => {
      const strong = getScore(JI_QIANG).total
      const weak = getScore(JI_RUO).total
      expect(strong - weak).toBeGreaterThanOrEqual(15)
    })

    it('极弱命例 verdict 属于弱档（极弱/偏弱/制化失衡/流通闭塞）', () => {
      const s = getScore(JI_RUO)
      expect(['极弱', '偏弱', '制化失衡', '流通闭塞']).toContain(s.verdict)
    })

    it('极强命例 verdict 属于旺档（极旺/偏旺/制化有序/流通顺畅）', () => {
      const s = getScore(JI_QIANG)
      expect(['极旺', '偏旺', '制化有序', '流通顺畅']).toContain(s.verdict)
    })
  })

  describe('3) 评分范围', () => {
    it('所有五档样本 total 在 [0, 100] 范围内', () => {
      for (const inp of [JI_QIANG, QIANG, ZHONG_HE, RUO, JI_RUO]) {
        const s = getScore(inp)
        expect(s.total).toBeGreaterThanOrEqual(0)
        expect(s.total).toBeLessThanOrEqual(100)
      }
    })

    it('所有分项评分在 [0, 100] 范围内', () => {
      for (const inp of [JI_QIANG, QIANG, ZHONG_HE, RUO, JI_RUO]) {
        const b = getScore(inp).breakdown
        for (const k of ['wangDu', 'chunDu', 'wenDing', 'liuTong', 'zhiHua', 'pingHeng']) {
          expect(b[k]).toBeGreaterThanOrEqual(0)
          expect(b[k]).toBeLessThanOrEqual(100)
        }
      }
    })
  })

  describe('4) 校准扣分生效', () => {
    it('极弱命例身弱惩罚 shenRuoPenalty > 0', () => {
      const b = getScore(JI_RUO).breakdown
      expect(b.shenRuoPenalty).toBeGreaterThan(0)
    })

    it('极弱命例失令修正 shiLingPenalty > 0', () => {
      const b = getScore(JI_RUO).breakdown
      expect(b.shiLingPenalty).toBeGreaterThan(0)
    })

    it('极弱命例无根修正 wuGenPenalty > 0', () => {
      const b = getScore(JI_RUO).breakdown
      expect(b.wuGenPenalty).toBeGreaterThan(0)
    })

    it('极强命例无任何身弱/失令/无根惩罚', () => {
      const b = getScore(JI_QIANG).breakdown
      expect(b.shenRuoPenalty).toBe(0)
      expect(b.shiLingPenalty).toBe(0)
      expect(b.wuGenPenalty).toBe(0)
    })

    it('弱命例惩罚程度介于极弱与中和之间', () => {
      const weakB = getScore(RUO).breakdown
      const extremeWeakB = getScore(JI_RUO).breakdown
      const neutralB = getScore(ZHONG_HE).breakdown
      const weakTotal = weakB.shenRuoPenalty + weakB.shiLingPenalty + weakB.wuGenPenalty
      const extremeWeakTotal = extremeWeakB.shenRuoPenalty + extremeWeakB.shiLingPenalty + extremeWeakB.wuGenPenalty
      const neutralTotal = neutralB.shenRuoPenalty + neutralB.shiLingPenalty + neutralB.wuGenPenalty
      expect(extremeWeakTotal).toBeGreaterThan(weakTotal)
      expect(weakTotal).toBeGreaterThan(neutralTotal)
    })
  })

  describe('5) breakdown.perGod 规范路径', () => {
    it('五档样本 scoreResult.breakdown.perGod 存在且为对象', () => {
      for (const inp of [JI_QIANG, QIANG, ZHONG_HE, RUO, JI_RUO]) {
        const sr = getScore(inp)
        expect(sr.breakdown.perGod).toBeDefined()
        expect(typeof sr.breakdown.perGod).toBe('object')
      }
    })
  })
})
