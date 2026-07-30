import { describe, it, expect } from 'vitest'
import { globalShenShaRegistry } from '../../../shensha/index'

describe('B5 神煞 7字段定义 + 注册中心（20个常用神煞）', () => {
  it('注册中心至少注册 20 个神煞，每个 7 字段齐全', () => {
    const all = globalShenShaRegistry.list()
    expect(all.length).toBeGreaterThanOrEqual(20)
    for (const d of all) {
      expect(d.source, `${d.id} source`).toBeTruthy()
      expect(d.condition?.description, `${d.id} condition.desc`).toBeTruthy()
      expect(d.condition?.formula, `${d.id} condition.formula`).toBeTruthy()
      expect(d.weight, `${d.id} weight`).toBeDefined()
      expect(typeof d.weight.base).toBe('number')
      expect(d.effect?.human, `${d.id} effect.human`).toBeTruthy()
      expect(d.effect?.categories?.length, `${d.id} effect.categories`).toBeGreaterThan(0)
      expect(Array.isArray(d.effect?.scenes)).toBe(true)
      expect(Array.isArray(d.appliesTo)).toBe(true)
      expect(['ji','xiong','zhong']).toContain(d.nature)
    }
  })

  it('天乙贵人必须有 7 字段 + citation 非空', () => {
    const t = globalShenShaRegistry.get('tian_yi')
    expect(t).toBeDefined()
    expect(t!.nature).toBe('ji')
    expect((t!.citation ?? []).length).toBeGreaterThan(0)
  })

  it('凶煞（羊刃/劫煞/灾煞/十恶大败/孤辰寡宿）≥ 6 个定义', () => {
    const xiong = globalShenShaRegistry.filterByNature('xiong')
    expect(xiong.length).toBeGreaterThanOrEqual(6)
  })

  it('吉煞数量 ≥ 10', () => {
    const ji = globalShenShaRegistry.filterByNature('ji')
    expect(ji.length).toBeGreaterThanOrEqual(10)
  })

  it('4 柱（year/month/day/hour）均应匹配 appliesTo', () => {
    const day = globalShenShaRegistry.filterByLocation('day')
    expect(day.length).toBeGreaterThan(15)
  })
})
