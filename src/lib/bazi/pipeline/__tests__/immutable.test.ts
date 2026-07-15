import { describe, it, expect } from 'vitest'
import { deepFreeze } from '../immutable'

describe('deepFreeze', () => {
  it('一级对象不可修改', () => {
    const obj = deepFreeze({ a: 1, b: 2 })
    expect(Object.isFrozen(obj)).toBe(true)
    expect(() => { (obj as any).a = 999 }).toThrow()
    expect(obj.a).toBe(1)
  })

  it('嵌套对象不可修改', () => {
    const obj = deepFreeze({ outer: { inner: 42 } })
    expect(Object.isFrozen(obj)).toBe(true)
    expect(Object.isFrozen(obj.outer)).toBe(true)
    expect(() => { (obj.outer as any).inner = 999 }).toThrow()
    expect(obj.outer.inner).toBe(42)
  })

  it('数组不可修改', () => {
    const obj = deepFreeze({ items: [1, 2, 3] })
    expect(Object.isFrozen(obj.items)).toBe(true)
    expect(() => { (obj.items as any).push(4) }).toThrow()
  })

  it('三级嵌套全部冻结', () => {
    const obj = deepFreeze({
      level1: {
        level2: {
          level3: 'deep'
        },
        arr: [{ x: 1 }]
      }
    })
    expect(Object.isFrozen(obj)).toBe(true)
    expect(Object.isFrozen(obj.level1)).toBe(true)
    expect(Object.isFrozen(obj.level1.level2)).toBe(true)
    expect(Object.isFrozen(obj.level1.arr)).toBe(true)
    expect(Object.isFrozen(obj.level1.arr[0])).toBe(true)
  })

  it('Date 对象不被冻结（跳过）', () => {
    const date = new Date('2024-01-01')
    const obj = deepFreeze({ date })
    expect(Object.isFrozen(obj)).toBe(true)
    expect(Object.isFrozen(obj.date)).toBe(false)
    // Date 方法应仍可用
    expect(obj.date.getFullYear()).toBe(2024)
  })

  it('null 和原始值安全返回', () => {
    expect(deepFreeze(null)).toBeNull()
    expect(deepFreeze(42)).toBe(42)
    expect(deepFreeze('str')).toBe('str')
  })

  it('空对象安全冻结', () => {
    const obj = deepFreeze({})
    expect(Object.isFrozen(obj)).toBe(true)
  })
})