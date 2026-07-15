/**
 * Pipeline Result 冻结工具 — V4.4 Enterprise
 * 
 * Pipeline 返回的 Result 只能读，不能修改。
 * UI 层收到的是 frozen result，防止意外修改导致数据不一致。
 */

/**
 * 深度冻结对象（不冻结 Date、RegExp 等内置对象）
 * 比 Object.freeze 更安全，不会因为冻结 Date 导致错误
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  
  // 跳过 Date, RegExp, Map, Set 等特殊对象
  if (obj instanceof Date || obj instanceof RegExp || obj instanceof Map || obj instanceof Set) {
    return obj
  }
  
  // 跳过数组中的特殊对象
  if (Array.isArray(obj)) {
    Object.freeze(obj)
    for (const item of obj) {
      if (typeof item === 'object' && item !== null && !(item instanceof Date) && !(item instanceof RegExp)) {
        deepFreeze(item)
      }
    }
    return obj
  }
  
  Object.freeze(obj)
  const keys = Object.getOwnPropertyNames(obj)
  for (const key of keys) {
    const value = (obj as any)[key]
    if (typeof value === 'object' && value !== null && !(value instanceof Date) && !(value instanceof RegExp) && !(value instanceof Map) && !(value instanceof Set)) {
      deepFreeze(value)
    }
  }
  return obj
}
