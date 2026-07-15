import { describe, it, expect, vi } from 'vitest'
import { mergeHooks, emptyHooks } from '../hooks'
import type { PipelineHooks } from '../hooks'
import type { StepDefinition } from '../steps'

const mockStep: StepDefinition = {
  id: 'test',
  name: 'Test',
  version: 1,
  dependsOn: [],
  execute: () => ({ success: true, data: undefined, warnings: [] }),
}

const mockCtx = {
  step: mockStep,
  result: { success: true, steps: [] } as any,
  context: { birthData: {}, cache: { get: vi.fn(), set: vi.fn(), delete: vi.fn(), has: vi.fn(), clear: vi.fn(), getStats: vi.fn() } as any, traceId: 'test-trace' },
}

describe('PipelineHooks', () => {
  it('emptyHooks 所有钩子为 undefined', () => {
    expect(emptyHooks.beforePipeline).toBeUndefined()
    expect(emptyHooks.afterPipeline).toBeUndefined()
    expect(emptyHooks.beforeStep).toBeUndefined()
    expect(emptyHooks.afterStep).toBeUndefined()
    expect(emptyHooks.onError).toBeUndefined()
  })

  it('beforePipeline 触发', () => {
    const fn = vi.fn()
    const hooks: PipelineHooks = { beforePipeline: fn }
    hooks.beforePipeline?.(mockCtx.context)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('afterPipeline 触发', () => {
    const fn = vi.fn()
    const hooks: PipelineHooks = { afterPipeline: fn }
    hooks.afterPipeline?.(mockCtx.context, mockCtx.result)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('beforeStep → afterStep 顺序', () => {
    const order: string[] = []
    const hooks: PipelineHooks = {
      beforeStep: () => { order.push('before') },
      afterStep: () => { order.push('after') },
    }
    hooks.beforeStep?.(mockCtx)
    hooks.afterStep?.(mockCtx, {} as any, 10)
    expect(order).toEqual(['before', 'after'])
  })

  it('onError 在 Step 失败时触发', () => {
    const fn = vi.fn()
    const hooks: PipelineHooks = { onError: fn }
    hooks.onError?.(mockCtx, new Error('boom'), 5)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(
      expect.objectContaining({ step: mockStep }),
      expect.any(Error),
      5,
    )
  })

  it('mergeHooks 后者覆盖前者', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const merged = mergeHooks(
      { beforePipeline: fn1 },
      { beforePipeline: fn2 },
    )
    merged.beforePipeline?.(mockCtx.context)
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledTimes(1)
  })

  it('Step 失败后 onError → afterPipeline 都触发', () => {
    const order: string[] = []
    const hooks: PipelineHooks = {
      beforeStep: () => order.push('beforeStep'),
      onError: () => order.push('onError'),
      afterPipeline: () => order.push('afterPipeline'),
    }
    // 模拟 Step 失败
    try { throw new Error('fail') } catch {}
    hooks.onError?.(mockCtx, new Error('fail'), 10)
    hooks.afterPipeline?.(mockCtx.context, mockCtx.result)
    expect(order).toEqual(['onError', 'afterPipeline'])
  })
})