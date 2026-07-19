/**
 * H2: 统一缓存 Key 构建器
 * 
 * 禁止任何地方手动拼接 Key 字符串。
 * 所有缓存 Key 必须通过 CacheKey.build() 生成。
 * 
 * Key 格式: {namespace}:{version}:{userId}:{scope}:{hash}
 * 
 * 示例:
 *   pipeline:v1:user123:birth:abc123def
 *   analysis:v1::global:sha256hash
 *   ai:v1:user123:gemini:sha256hash
 *   image:v1::thumb:sha256hash
 */

export enum CacheNamespace {
  Pipeline = 'pipeline',
  Analysis = 'analysis',
  AI = 'ai',
  Image = 'image',
  Knowledge = 'knowledge',
  Static = 'static',
}

export interface CacheKeyParams {
  namespace: CacheNamespace
  userId?: string
  scope?: string       // 如 'birth', 'gemini', 'thumb'
  identifier?: string  // 具体标识，如 birthDate+birthTime
  version?: string      // 默认使用 CACHE_VERSION
}

export const CACHE_VERSION = '1.0.0'

export class CacheKey {
  private static VERSION = CACHE_VERSION

  static build(params: CacheKeyParams): string {
    const parts = [
      params.namespace,
      params.version || CacheKey.VERSION,
      params.userId || '',
      params.scope || '',
      params.identifier || '',
    ]
    return parts.join(':')
  }

  /** 从 key 解析回参数 */
  static parse(key: string): CacheKeyParams | null {
    const parts = key.split(':')
    if (parts.length < 2) return null
    return {
      namespace: parts[0] as CacheNamespace,
      version: parts[1],
      userId: parts[2] || undefined,
      scope: parts[3] || undefined,
      identifier: parts[4] || undefined,
    }
  }

  /** 生成内容的简易哈希（非加密级，用于缓存 key） */
  static hash(content: string): string {
    let h = 0
    for (let i = 0; i < content.length; i++) {
      const c = content.charCodeAt(i)
      h = ((h << 5) - h + c) | 0
    }
    return (h >>> 0).toString(36)
  }
}
