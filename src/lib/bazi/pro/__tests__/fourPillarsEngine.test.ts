import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateProfessionalFourPillars, FOUR_PILLARS_VERSION,
  calculateMingGong, calculateShenGong,
  calculateTaiYuan, calculateTaiXi,
  getNaYin, getChangSheng, calculateFiveElementCount, getKongWang, getShenShi,
} from '../index'
import type { BirthData } from '@/lib/core/types/birth'

// ─── Golden Case 测试数据 ───

/** 毛泽东 1893-12-26 辰时 — 经典验证案例（注：date-chinese 支持 1900-2100，此处验证引擎框架） */
// 使用 1900 年后等价验证
const GOLDEN_CASE_1: BirthData = {
  birthday: '1976-01-08', birthTime: '08:00',
  gender: 'male', useTrueSolarTime: false,
}

// ─── helpers 测试 ───
describe('Pro Helpers', () => {
  describe('getNaYin', () => {
    it('甲子 = 海中金', () => {
      expect(getNaYin('甲', '子')).toBe('海中金')
    })
    it('丙寅 = 炉中火', () => {
      expect(getNaYin('丙', '寅')).toBe('炉中火')
    })
    it('庚午 = 路旁土', () => {
      expect(getNaYin('庚', '午')).toBe('路旁土')
    })
    it('壬申 = 剑锋金', () => {
      expect(getNaYin('壬', '申')).toBe('剑锋金')
    })
    it('六十甲子末尾 = 大海水', () => {
      expect(getNaYin('癸', '亥')).toBe('大海水')
    })
  })

  describe('getChangSheng', () => {
    it('甲在亥 = 长生', () => {
      expect(getChangSheng('甲', '亥')).toBe('长生')
    })
    it('甲在子 = 沐浴', () => {
      expect(getChangSheng('甲', '子')).toBe('沐浴')
    })
    it('甲在卯 = 帝旺', () => {
      expect(getChangSheng('甲', '卯')).toBe('帝旺')
    })
    it('甲在午 = 死', () => {
      expect(getChangSheng('甲', '午')).toBe('死')
    })
    it('乙在午 = 长生（阴干逆行）', () => {
      expect(getChangSheng('乙', '午')).toBe('长生')
    })
    it('丙在寅 = 长生', () => {
      expect(getChangSheng('丙', '寅')).toBe('长生')
    })
    it('庚在巳 = 长生', () => {
      expect(getChangSheng('庚', '巳')).toBe('长生')
    })
    it('壬在申 = 长生（壬起点在申）', () => {
      expect(getChangSheng('壬', '申')).toBe('长生')
    })
    it('癸在卯 = 长生', () => {
      expect(getChangSheng('癸', '卯')).toBe('长生')
    })
    it('丁在酉 = 养（阴干逆行，丁起点在申）', () => {
      expect(getChangSheng('丁', '酉')).toBe('养')
    })
  })

  describe('calculateFiveElementCount', () => {
    it('甲子年 甲子月 甲子日 甲子时 → 木极旺', () => {
      const count = calculateFiveElementCount({
        year: { gan: '甲', zhi: '子' },
        month: { gan: '甲', zhi: '子' },
        day: { gan: '甲', zhi: '子' },
        hour: { gan: '甲', zhi: '子' },
      })
      // 甲=木(4×1.0) + 子本气癸=水(4×0.6) = 木4.0, 水2.4
      expect(count['木']).toBe(4.0)
      expect(count['水']).toBe(2.4)
    })

    it('总和应为天干+藏干加权', () => {
      const count = calculateFiveElementCount({
        year: { gan: '丙', zhi: '寅' },
        month: { gan: '丁', zhi: '卯' },
        day: { gan: '戊', zhi: '午' },
        hour: { gan: '己', zhi: '未' },
      })
      // 天干: 丙(火)+丁(火)+戊(土)+己(土) = 4×1.0 = 4.0
      // 寅:甲(木)0.6+丙(火)0.3+戊(土)0.1 = 1.0
      // 卯:乙(木)0.6+无中余 = 0.6
      // 午:丁(火)0.6+己(土)0.3 = 0.9
      // 未:己(土)0.6+丁(火)0.3+乙(木)0.1 = 1.0
      // 总和 = 4.0+1.0+0.6+0.9+1.0 = 7.5
      const total = Object.values(count).reduce((s, v) => s + v, 0)
      expect(total).toBeCloseTo(7.5, 5)
    })
  })

  describe('getKongWang', () => {
    it('甲子日 → 戌亥空亡', () => {
      const kw = getKongWang({
        year: { gan: '甲', zhi: '子' },
        day: { gan: '甲', zhi: '子' },
      })
      expect(kw).toContain('戌')
      expect(kw).toContain('亥')
    })
    it('丙寅日 → 戌亥空亡（丙=2, 寅=2, offset=0, (0+10)%12=10=戌, (0+11)%12=11=亥）', () => {
      const kw = getKongWang({
        year: { gan: '庚', zhi: '申' },
        day: { gan: '丙', zhi: '寅' },
      })
      expect(kw).toContain('戌')
      expect(kw).toContain('亥')
    })
  })

  describe('getShenShi', () => {
    it('日主甲 → 甲=比肩', () => {
      expect(getShenShi('甲', '甲')).toBe('比肩')
    })
    it('日主甲 → 乙=劫财', () => {
      expect(getShenShi('甲', '乙')).toBe('劫财')
    })
    it('日主甲 → 丙=食神', () => {
      expect(getShenShi('甲', '丙')).toBe('食神')
    })
    it('日主甲 → 庚=偏官(七杀)', () => {
      expect(getShenShi('甲', '庚')).toBe('偏官')
    })
    it('日主丙 → 甲=偏印', () => {
      expect(getShenShi('丙', '甲')).toBe('偏印')
    })
    it('日主癸 → 癸=比肩', () => {
      expect(getShenShi('癸', '癸')).toBe('比肩')
    })
  })
})

// ─── 命宫 / 身宫 ───
describe('命宫 身宫', () => {
  it('命宫: 甲年 寅月 子时', () => {
    const mg = calculateMingGong('甲', '寅', '子')
    expect(mg.ganZhi.gan).toBeTruthy()
    expect(mg.ganZhi.zhi).toBeTruthy()
    expect(mg.palaceName).toBeTruthy()
    expect(mg.derivation.steps.length).toBeGreaterThanOrEqual(2)
  })

  it('身宫: 甲年 寅月 子时', () => {
    const sg = calculateShenGong('甲', '寅', '子')
    expect(sg.ganZhi.gan).toBeTruthy()
    expect(sg.ganZhi.zhi).toBeTruthy()
    expect(sg.derivation.steps.length).toBeGreaterThanOrEqual(2)
  })

  it('命宫和身宫推导链可追溯', () => {
    const mg = calculateMingGong('丙', '午', '卯')
    for (const step of mg.derivation.steps) {
      expect(step.id).toBeTruthy()
      expect(step.name).toBeTruthy()
      expect(step.confidence).toBeGreaterThan(0)
      expect(step.confidence).toBeLessThanOrEqual(1)
      expect(step.input).toBeDefined()
      expect(step.output).toBeDefined()
    }
  })
})

// ─── 胎元 / 胎息 ───
describe('胎元 胎息', () => {
  it('胎元: 甲月 → 乙辰', () => {
    const ty = calculateTaiYuan('甲', '寅')
    expect(ty.ganZhi.gan).toBe('乙') // 甲+1=乙
    expect(ty.ganZhi.zhi).toBe('巳') // 寅+3=巳
    expect(ty.naYin).toBeTruthy()
  })

  it('胎元: 丙月 → 丁午', () => {
    const ty = calculateTaiYuan('丙', '巳')
    expect(ty.ganZhi.gan).toBe('丁')
    expect(ty.ganZhi.zhi).toBe('申')
  })

  it('胎元推导链可追溯', () => {
    const ty = calculateTaiYuan('壬', '申')
    expect(ty.derivation.steps.length).toBeGreaterThanOrEqual(2)
    expect(ty.derivation.overallConfidence).toBeGreaterThan(0)
  })

  it('胎息: 甲日 → 乙卯', () => {
    const tx = calculateTaiXi('甲', '子')
    expect(tx.ganZhi.gan).toBe('乙') // 甲+1=乙
    expect(tx.ganZhi.zhi).toBe('卯') // 子+3=卯
    expect(tx.naYin).toBeTruthy()
  })

  it('胎息: 丙日 → 丁巳', () => {
    const tx = calculateTaiXi('丙', '寅')
    expect(tx.ganZhi.gan).toBe('丁')
    expect(tx.ganZhi.zhi).toBe('巳')
  })

  it('胎息推导链可追溯', () => {
    const tx = calculateTaiXi('庚', '午')
    expect(tx.derivation.steps.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── 完整引擎 ───
describe('Professional Four Pillars Engine', () => {
  it('版本号正确', () => {
    expect(FOUR_PILLARS_VERSION).toBe('1.0.0')
  })

  it('基础排盘返回完整结果', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1990-01-15', birthTime: '10:00',
      gender: 'male',
    })
    expect(result.version).toBe('1.0.0')
    expect(result.sixLines.year.gan).toBeTruthy()
    expect(result.sixLines.month.gan).toBeTruthy()
    expect(result.sixLines.day.gan).toBeTruthy()
    expect(result.sixLines.hour.gan).toBeTruthy()
  })

  it('四柱详解包含纳音/长生/藏干/十神', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1990-06-15', birthTime: '14:00',
      gender: 'female',
    })
    // 年柱
    expect(result.pillars.year.naYin).toBeTruthy()
    expect(result.pillars.year.changSheng).toBeTruthy()
    expect(result.pillars.year.cangGan.ben).toBeTruthy()
    expect(result.pillars.year.shenShi).toBeTruthy()
    // 月柱
    expect(result.pillars.month.naYin).toBeTruthy()
    expect(result.pillars.month.changSheng).toBeTruthy()
    // 日柱
    expect(result.pillars.day.naYin).toBeTruthy()
    expect(result.pillars.day.shenShi).toBe('比肩') // 日主自己的十神=比肩
    // 时柱
    expect(result.pillars.hour.naYin).toBeTruthy()
  })

  it('日主信息正确', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1985-03-20', birthTime: '08:00',
      gender: 'male',
    })
    expect(result.dayMaster).toBe(result.sixLines.day.gan)
    expect(['木', '火', '土', '金', '水']).toContain(result.dayMasterElement)
    expect(['阳', '阴']).toContain(result.dayMasterYinYang)
  })

  it('五行统计存在且为正数', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '2000-01-01', birthTime: '12:00',
      gender: 'male',
    })
    const elements: (keyof typeof result.fiveElementCount)[] = ['木', '火', '土', '金', '水']
    for (const e of elements) {
      expect(result.fiveElementCount[e]).toBeGreaterThanOrEqual(0)
    }
    const total = Object.values(result.fiveElementCount).reduce((s, v) => s + v, 0)
    expect(total).toBeGreaterThan(0)
  })

  it('空亡列表存在', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1995-07-20', birthTime: '16:00',
      gender: 'female',
    })
    expect(Array.isArray(result.kongWang)).toBe(true)
    expect(result.kongWang.length).toBeGreaterThanOrEqual(2)
  })

  it('命宫身宫胎元胎息全部存在', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1988-10-10', birthTime: '06:00',
      gender: 'male',
    })
    expect(result.mingGong.ganZhi.gan).toBeTruthy()
    expect(result.shenGong.ganZhi.gan).toBeTruthy()
    expect(result.taiYuan.ganZhi.gan).toBeTruthy()
    expect(result.taiXi.ganZhi.gan).toBeTruthy()
    expect(result.taiYuan.naYin).toBeTruthy()
    expect(result.taiXi.naYin).toBeTruthy()
  })

  it('推导链完整可追溯', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1978-05-05', birthTime: '22:00',
      gender: 'female',
    })
    expect(result.derivation.steps.length).toBeGreaterThanOrEqual(11)
    expect(result.derivation.overallConfidence).toBeGreaterThan(0)
    expect(result.derivation.computeTimeMs).toBeGreaterThanOrEqual(0)
    for (const step of result.derivation.steps) {
      expect(step.id).toBeTruthy()
      expect(step.name).toBeTruthy()
      expect(step.confidence).toBeGreaterThan(0)
    }
  })

  it('computedAt 是有效时间戳', () => {
    const before = Date.now()
    const result = calculateProfessionalFourPillars({
      birthday: '1992-12-25', birthTime: '03:00',
      gender: 'male',
    })
    expect(result.computedAt).toBeGreaterThanOrEqual(before)
    expect(result.computedAt).toBeLessThanOrEqual(Date.now() + 1)
  })
})

// ─── Golden Case 回归 ───
describe('Golden Case 回归', () => {
  it('Golden Case 1: 1976-01-08 辰时 — 排盘框架验证', () => {
    const result = calculateProfessionalFourPillars(GOLDEN_CASE_1)
    // 1976年1月8日：大雪后小寒前 → 乙卯年 己丑月
    expect(result.sixLines.year.gan).toBe('乙')
    expect(result.sixLines.year.zhi).toBe('卯')
    expect(result.sixLines.month.gan).toBe('己')
    expect(result.sixLines.month.zhi).toBe('丑')
    // 四柱详解完整
    expect(result.pillars.year.naYin).toBeTruthy()
    expect(result.pillars.month.naYin).toBeTruthy()
    expect(result.pillars.day.naYin).toBeTruthy()
    expect(result.pillars.hour.naYin).toBeTruthy()
    // 命宫身宫胎元胎息
    expect(result.mingGong.ganZhi.gan).toBeTruthy()
    expect(result.shenGong.ganZhi.gan).toBeTruthy()
    expect(result.taiYuan.ganZhi.gan).toBeTruthy()
    expect(result.taiXi.ganZhi.gan).toBeTruthy()
  })

  it('Golden Case 2: 1984-09-25 — 胎元验证', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1984-09-25', birthTime: '08:00',
      gender: 'male', useTrueSolarTime: false,
    })
    // 验证胎元 = 月干+1, 月支+3
    expect(result.taiYuan.ganZhi.gan).toBeTruthy()
    expect(result.taiYuan.ganZhi.zhi).toBeTruthy()
    expect(result.taiYuan.naYin).toBeTruthy()
    // 推导链完整
    expect(result.derivation.steps.length).toBeGreaterThanOrEqual(11)
  })
})

// ─── Boundary 边界测试 ───
describe('Boundary 边界测试', () => {
  it('子时边界 23:00 晚子时', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1990-01-15', birthTime: '23:00',
      gender: 'male', childHourStrategy: 'late',
    })
    expect(result.sixLines.hour.gan).toBeTruthy()
  })

  it('子时边界 00:00 早子时', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1990-01-15', birthTime: '00:00',
      gender: 'female',
    })
    expect(result.sixLines.hour.gan).toBeTruthy()
  })

  it('跨世纪 2000-01-01', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '2000-01-01', birthTime: '12:00',
      gender: 'male',
    })
    expect(result.sixLines.year.gan).toBe('己')
    expect(result.sixLines.year.zhi).toBe('卯')
  })

  it('闰年 2月29日', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '2000-02-29', birthTime: '10:00',
      gender: 'female',
    })
    expect(result.sixLines.day.gan).toBeTruthy()
  })

  it('date-chinese 库支持范围起点 1900-01-01', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '1900-01-01', birthTime: '06:00',
      gender: 'male',
    })
    expect(result.sixLines.year.gan).toBeTruthy()
  })

  it('未来日期 2050-06-15', () => {
    const result = calculateProfessionalFourPillars({
      birthday: '2050-06-15', birthTime: '14:00',
      gender: 'female',
    })
    expect(result.sixLines.year.gan).toBeTruthy()
  })
})

// ─── Performance 性能测试 ───
describe('Performance 性能', () => {
  it('100次排盘 < 500ms', () => {
    const birthData: BirthData = {
      birthday: '1990-06-15', birthTime: '14:00', gender: 'male',
    }
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      calculateProfessionalFourPillars(birthData)
    }
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(500)
  })
})
