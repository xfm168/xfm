/**
 * P1.2.1-A1 十神插件生命周期适配验收
 *
 * 验收点：
 *   1) 未初始化状态：classify / evaluate 返回 undefined
 *   2) 初始化状态：classify / evaluate 正常返回
 *   3) 重复初始化：幂等，不抛错，能力正常
 *   4) 销毁后重新初始化：状态可恢复
 *
 * 所有测试入口统一 `await defaultTenGodPlugin.initialize()`。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { defaultTenGodPlugin, TenGodPlugin } from '..'
import type { TenGodClassifierInput } from '../types'

const SAMPLE: TenGodClassifierInput = {
  dayGan: '甲',
  monthZhi: '寅',
  dayGanWuxing: '木',
  monthZhiWuxing: '木',
  fourPillars: [
    { gan: '甲', zhi: '寅', ganWx: '木', zhiWx: '木' },
    { gan: '丙', zhi: '寅', ganWx: '火', zhiWx: '木' },
    { gan: '甲', zhi: '辰', ganWx: '木', zhiWx: '土' },
    { gan: '庚', zhi: '午', ganWx: '金', zhiWx: '火' },
  ],
  dayStrength: 0.85,
  dayRootCount: 3,
  isWinterBorn: false,
  isSummerBorn: false,
}

describe('P1.2.1-A1 TenGodPlugin 生命周期适配', () => {
  // 所有测试入口统一 await initialize()
  beforeAll(async () => {
    await defaultTenGodPlugin.initialize()
  })

  afterAll(async () => {
    // 不破坏全局单例：测试结束后保持 initialized 状态供其他套件复用
    try {
      if (defaultTenGodPlugin.state !== 'initialized') {
        await defaultTenGodPlugin.initialize()
      }
    } catch (_) { /* noop */ }
  })

  it('1) 未初始化状态：classify / evaluate 返回 undefined', async () => {
    const p = new TenGodPlugin()
    // 全新实例尚未 initialize，state 应处于未初始化阶段
    expect(['uninstalled', 'installed', 'destroyed']).toContain(p.state)
    expect(p.classifier).toBeNull()
    expect(p.engine).toBeNull()
    // 未初始化时 classify / evaluate 必须返回 undefined（不抛错）
    expect(p.classify(SAMPLE)).toBeUndefined()
    expect(p.evaluate(SAMPLE)).toBeUndefined()
  })

  it('2) 初始化状态：classify / evaluate 正常返回', async () => {
    const p = new TenGodPlugin()
    await p.initialize()
    expect(p.state).toBe('initialized')
    expect(p.classifier).not.toBeNull()
    expect(p.engine).not.toBeNull()

    const c = p.classify(SAMPLE)
    expect(c).not.toBeUndefined()
    expect(c!.distribution).toBeDefined()
    expect(Array.isArray(c!.combinationVerdicts)).toBe(true)

    const e = p.evaluate(SAMPLE)
    expect(e).not.toBeUndefined()
    expect((e as any).engineName).toBeDefined()
    expect((e as any).scores).toBeDefined()

    // 清理本用例实例
    await p.destroy()
  })

  it('3) 重复初始化：幂等，不抛错，能力仍可用', async () => {
    const p = new TenGodPlugin()
    await p.initialize()
    // 第二次 initialize 不应抛错
    await expect(p.initialize()).resolves.toBeUndefined()
    expect(p.state).toBe('initialized')
    expect(p.classifier).not.toBeNull()

    // 第三次 initialize 同样幂等
    await expect(p.initialize()).resolves.toBeUndefined()
    expect(p.classifier).not.toBeNull()

    const c = p.classify(SAMPLE)
    expect(c).not.toBeUndefined()

    await p.destroy()
  })

  it('4) 销毁后重新初始化：状态可恢复', async () => {
    const p = new TenGodPlugin()
    await p.initialize()
    expect(p.classifier).not.toBeNull()
    await p.destroy()
    expect(p.state).toBe('destroyed')
    expect(p.classifier).toBeNull()
    // destroy 之后 classify 必须返回 undefined
    expect(p.classify(SAMPLE)).toBeUndefined()

    // 重新 initialize，状态与能力恢复
    await p.initialize()
    expect(p.state).toBe('initialized')
    expect(p.classifier).not.toBeNull()
    expect(p.engine).not.toBeNull()
    const c = p.classify(SAMPLE)
    const e = p.evaluate(SAMPLE)
    expect(c).not.toBeUndefined()
    expect(e).not.toBeUndefined()

    await p.destroy()
  })

  it('5) 全局单例 defaultTenGodPlugin 已 initialize 可用', async () => {
    // beforeAll 已统一 await initialize()
    expect(defaultTenGodPlugin.state).toBe('initialized')
    expect(defaultTenGodPlugin.classifier).not.toBeNull()
    expect(defaultTenGodPlugin.engine).not.toBeNull()
    const c = defaultTenGodPlugin.classify(SAMPLE)
    const e = defaultTenGodPlugin.evaluate(SAMPLE)
    expect(c).not.toBeUndefined()
    expect(e).not.toBeUndefined()
  })

  it('6) 销毁→重新初始化后能力注册表仍可查询', async () => {
    const p = new TenGodPlugin()
    await p.initialize()
    await p.destroy()
    await p.initialize()
    // 重新初始化后 classifier / engine 仍然可用
    expect(p.classifier).not.toBeNull()
    expect(p.engine).not.toBeNull()
    const c = p.classify(SAMPLE)
    expect(c).not.toBeUndefined()
    await p.destroy()
  })
})
