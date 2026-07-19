/**
 * 神煞计算测试（玄风门 V4.4）
 *
 * 覆盖全部 10 类神煞：
 *   桃花、天乙贵人、文昌、华盖、羊刃、空亡、驿马、孤辰寡宿、劫煞、红鸾天喜
 *
 * 每类神煞构造正面（命中）和负面（未命中）两组测试，
 * 验证 check 函数返回的 ShenShaInfo.inPosition 和 position 正确。
 */

import { describe, test, expect } from 'vitest'
import { checkTaohua } from '../shensha/taohua'
import { checkTianyi } from '../shensha/tianyi'
import { checkWenchang } from '../shensha/wenchang'
import { checkHuagai } from '../shensha/huagai'
import { checkYangren } from '../shensha/yangren'
import { checkKongwang } from '../shensha/kongwang'
import { checkYima } from '../shensha/yima'
import { checkGuChenGuaSu } from '../shensha/guchen'
import { checkJiesha } from '../shensha/jiesha'
import { checkHongluan } from '../shensha/hongluan'
import type { SixLines, GanZhi, HeavenlyStem, EarthlyBranch, FiveElement, YinYang } from '../types'

// ─── 辅助函数 ───

function gz(gan: string, zhi: string): GanZhi {
  return {
    gan: gan as HeavenlyStem,
    zhi: zhi as EarthlyBranch,
    element: '木' as FiveElement,
    yinYang: '阳' as YinYang,
    naYin: '',
  }
}

function makeSixLines(
  yg: string, yz: string,
  mg: string, mz: string,
  dg: string, dz: string,
  hg: string, hz: string,
): SixLines {
  return {
    year: gz(yg, yz),
    month: gz(mg, mz),
    day: gz(dg, dz),
    hour: gz(hg, hz),
  }
}

// ─── 神煞计算 ───

describe('神煞计算', () => {

  describe('桃花', () => {
    test('寅午戌年见卯为桃花', () => {
      // 年支寅 → 桃花在卯，月支放卯
      const sl = makeSixLines('甲', '寅', '乙', '卯', '丙', '子', '丁', '子')
      const result = checkTaohua(sl, '丙', 'male')
      const yearTaohua = result.find(r => r.name.includes('年支查'))!
      expect(yearTaohua.inPosition).toBe(true)
      expect(yearTaohua.position).toContain('月支')
    })

    test('申子辰年见酉为桃花', () => {
      // 年支申 → 桃花在酉
      const sl = makeSixLines('甲', '申', '乙', '酉', '丙', '子', '丁', '子')
      const result = checkTaohua(sl, '丙', 'male')
      const yearTaohua = result.find(r => r.name.includes('年支查'))!
      expect(yearTaohua.inPosition).toBe(true)
    })

    test('四柱无桃花时 inPosition 为 false', () => {
      // 年支寅 → 桃花在卯，但四柱无卯
      const sl = makeSixLines('甲', '寅', '乙', '辰', '丙', '子', '丁', '子')
      const result = checkTaohua(sl, '丙', 'male')
      const yearTaohua = result.find(r => r.name.includes('年支查'))!
      expect(yearTaohua.inPosition).toBe(false)
    })
  })

  describe('天乙贵人', () => {
    test('甲日主见丑为天乙贵人', () => {
      // 甲戊庚牛羊（丑未）
      const sl = makeSixLines('乙', '丑', '丙', '寅', '甲', '子', '丁', '卯')
      const result = checkTianyi(sl, '甲', 'male')
      expect(result[0].inPosition).toBe(true)
      expect(result[0].position).toContain('年支')
    })

    test('乙日主见子申为天乙贵人', () => {
      // 乙己鼠猴乡（子申）
      const sl = makeSixLines('丙', '子', '丁', '寅', '乙', '午', '戊', '辰')
      const result = checkTianyi(sl, '乙', 'male')
      expect(result[0].inPosition).toBe(true)
      expect(result[0].position).toContain('年支')
    })

    test('四柱无贵人时 inPosition 为 false', () => {
      // 甲日主贵人在丑未，四柱无丑未
      const sl = makeSixLines('乙', '寅', '丙', '卯', '甲', '午', '丁', '巳')
      const result = checkTianyi(sl, '甲', 'male')
      expect(result[0].inPosition).toBe(false)
    })
  })

  describe('文昌', () => {
    test('甲日主见巳为文昌', () => {
      // 甲乙巳午报君知
      const sl = makeSixLines('乙', '子', '丙', '巳', '甲', '午', '丁', '卯')
      const result = checkWenchang(sl, '甲', 'male')
      expect(result[0].inPosition).toBe(true)
      expect(result[0].position).toContain('月支')
    })

    test('庚日主见亥为文昌', () => {
      // 庚猪
      const sl = makeSixLines('乙', '子', '丙', '亥', '庚', '午', '丁', '卯')
      const result = checkWenchang(sl, '庚', 'male')
      expect(result[0].inPosition).toBe(true)
    })

    test('四柱无文昌时 inPosition 为 false', () => {
      const sl = makeSixLines('乙', '子', '丙', '寅', '甲', '午', '丁', '卯')
      const result = checkWenchang(sl, '甲', 'male')
      expect(result[0].inPosition).toBe(false)
    })
  })

  describe('华盖', () => {
    test('寅午戌年见戌为华盖', () => {
      const sl = makeSixLines('甲', '寅', '乙', '戌', '丙', '子', '丁', '子')
      const result = checkHuagai(sl, '丙', 'male')
      const yearHuagai = result.find(r => r.name.includes('年支查'))!
      expect(yearHuagai.inPosition).toBe(true)
      expect(yearHuagai.position).toContain('月支')
    })

    test('申子辰年见辰为华盖', () => {
      const sl = makeSixLines('甲', '申', '乙', '辰', '丙', '子', '丁', '子')
      const result = checkHuagai(sl, '丙', 'male')
      const yearHuagai = result.find(r => r.name.includes('年支查'))!
      expect(yearHuagai.inPosition).toBe(true)
    })

    test('四柱无华盖时 inPosition 为 false', () => {
      const sl = makeSixLines('甲', '寅', '乙', '子', '丙', '午', '丁', '卯')
      const result = checkHuagai(sl, '丙', 'male')
      const yearHuagai = result.find(r => r.name.includes('年支查'))!
      expect(yearHuagai.inPosition).toBe(false)
    })
  })

  describe('羊刃', () => {
    test('甲日主见卯为羊刃', () => {
      // 甲羊刃在卯
      const sl = makeSixLines('乙', '子', '丙', '卯', '甲', '午', '丁', '巳')
      const result = checkYangren(sl, '甲', 'male')
      expect(result[0].inPosition).toBe(true)
      expect(result[0].position).toContain('月支')
    })

    test('庚日主见酉为羊刃', () => {
      // 庚在酉
      const sl = makeSixLines('乙', '子', '丙', '酉', '庚', '午', '丁', '巳')
      const result = checkYangren(sl, '庚', 'male')
      expect(result[0].inPosition).toBe(true)
    })

    test('四柱无羊刃时 inPosition 为 false', () => {
      const sl = makeSixLines('乙', '子', '丙', '寅', '甲', '午', '丁', '巳')
      const result = checkYangren(sl, '甲', 'male')
      expect(result[0].inPosition).toBe(false)
    })
  })

  describe('空亡', () => {
    test('甲子日旬空戌亥，年支戌落空亡', () => {
      // 甲子旬空戌亥
      const sl = makeSixLines('乙', '戌', '丙', '寅', '甲', '子', '丁', '卯')
      const result = checkKongwang(sl, '甲', 'male')
      const dayKongwang = result.find(r => r.name.includes('日柱查'))!
      expect(dayKongwang.inPosition).toBe(true)
      expect(dayKongwang.position).toContain('年支')
    })

    test('甲子日旬空戌亥，四柱无戌亥则不落空亡', () => {
      const sl = makeSixLines('乙', '寅', '丙', '卯', '甲', '子', '丁', '巳')
      const result = checkKongwang(sl, '甲', 'male')
      const dayKongwang = result.find(r => r.name.includes('日柱查'))!
      expect(dayKongwang.inPosition).toBe(false)
    })

    test('空亡 reference 包含六甲旬口诀', () => {
      const sl = makeSixLines('乙', '子', '丙', '寅', '甲', '子', '丁', '卯')
      const result = checkKongwang(sl, '甲', 'male')
      expect(result[0].reference).toContain('甲子旬空戌亥')
    })
  })

  describe('驿马', () => {
    test('申子辰年见寅为驿马', () => {
      // 申子辰马在寅
      const sl = makeSixLines('甲', '申', '乙', '寅', '丙', '子', '丁', '子')
      const result = checkYima(sl, '丙', 'male')
      const yearYima = result.find(r => r.name.includes('年支查'))!
      expect(yearYima.inPosition).toBe(true)
      expect(yearYima.position).toContain('月支')
    })

    test('寅午戌年见申为驿马', () => {
      const sl = makeSixLines('甲', '寅', '乙', '申', '丙', '午', '丁', '子')
      const result = checkYima(sl, '丙', 'male')
      const yearYima = result.find(r => r.name.includes('年支查'))!
      expect(yearYima.inPosition).toBe(true)
    })

    test('四柱无驿马时 inPosition 为 false', () => {
      const sl = makeSixLines('甲', '申', '乙', '卯', '丙', '子', '丁', '子')
      const result = checkYima(sl, '丙', 'male')
      const yearYima = result.find(r => r.name.includes('年支查'))!
      expect(yearYima.inPosition).toBe(false)
    })
  })

  describe('孤辰寡宿', () => {
    test('亥子丑年见寅为孤辰', () => {
      // 亥子丑在寅
      const sl = makeSixLines('甲', '子', '乙', '寅', '丙', '午', '丁', '巳')
      const result = checkGuChenGuaSu(sl, '丙', 'male')
      const guChen = result.find(r => r.name === '孤辰')!
      expect(guChen.inPosition).toBe(true)
      expect(guChen.position).toContain('月支')
    })

    test('亥子丑年见戌为寡宿', () => {
      const sl = makeSixLines('甲', '子', '乙', '戌', '丙', '午', '丁', '巳')
      const result = checkGuChenGuaSu(sl, '丙', 'male')
      const guaSu = result.find(r => r.name === '寡宿')!
      expect(guaSu.inPosition).toBe(true)
    })

    test('四柱无孤辰寡宿时 inPosition 为 false', () => {
      const sl = makeSixLines('甲', '子', '乙', '午', '丙', '卯', '丁', '巳')
      const result = checkGuChenGuaSu(sl, '丙', 'male')
      const guChen = result.find(r => r.name === '孤辰')!
      expect(guChen.inPosition).toBe(false)
    })
  })

  describe('劫煞', () => {
    test('申子辰年见巳为劫煞', () => {
      // 申子辰见巳
      const sl = makeSixLines('甲', '申', '乙', '巳', '丙', '子', '丁', '子')
      const result = checkJiesha(sl, '丙', 'male')
      const yearJiesha = result.find(r => r.name.includes('年支查'))!
      expect(yearJiesha.inPosition).toBe(true)
      expect(yearJiesha.position).toContain('月支')
    })

    test('寅午戌年见亥为劫煞', () => {
      const sl = makeSixLines('甲', '寅', '乙', '亥', '丙', '午', '丁', '子')
      const result = checkJiesha(sl, '丙', 'male')
      const yearJiesha = result.find(r => r.name.includes('年支查'))!
      expect(yearJiesha.inPosition).toBe(true)
    })

    test('四柱无劫煞时 inPosition 为 false', () => {
      const sl = makeSixLines('甲', '申', '乙', '寅', '丙', '子', '丁', '子')
      const result = checkJiesha(sl, '丙', 'male')
      const yearJiesha = result.find(r => r.name.includes('年支查'))!
      expect(yearJiesha.inPosition).toBe(false)
    })
  })

  describe('红鸾天喜', () => {
    test('子年红鸾在卯', () => {
      // 年支子(0) → 红鸾在 (0+3)%12=3=卯
      const sl = makeSixLines('甲', '子', '乙', '卯', '丙', '午', '丁', '巳')
      const result = checkHongluan(sl, '丙', 'male')
      const hongluan = result.find(r => r.name === '红鸾')!
      expect(hongluan.inPosition).toBe(true)
      expect(hongluan.position).toContain('月支')
    })

    test('子年天喜在酉（红鸾对冲）', () => {
      // 年支子(0) → 天喜在 (0+9)%12=9=酉
      const sl = makeSixLines('甲', '子', '乙', '酉', '丙', '午', '丁', '巳')
      const result = checkHongluan(sl, '丙', 'male')
      const tianxi = result.find(r => r.name === '天喜')!
      expect(tianxi.inPosition).toBe(true)
    })

    test('四柱无红鸾时 inPosition 为 false', () => {
      const sl = makeSixLines('甲', '子', '乙', '寅', '丙', '午', '丁', '巳')
      const result = checkHongluan(sl, '丙', 'male')
      const hongluan = result.find(r => r.name === '红鸾')!
      expect(hongluan.inPosition).toBe(false)
    })
  })

  describe('ShenShaInfo 结构', () => {
    test('返回结果包含 name/inPosition/position/description/reference', () => {
      const sl = makeSixLines('甲', '寅', '乙', '卯', '丙', '子', '丁', '子')
      const result = checkTaohua(sl, '丙', 'male')
      for (const info of result) {
        expect(info.name).toBeTruthy()
        expect(typeof info.inPosition).toBe('boolean')
        expect(typeof info.position).toBe('string')
        expect(info.description).toBeTruthy()
        expect(info.reference).toBeTruthy()
      }
    })
  })
})
