// 签名器 —— 规则/决策数字签名，预留企业版防篡改

// ============================================================
// 类型定义
// ============================================================

/** 数字签名 */
export interface Signature {
  /** 算法名（如 'sha256-hmac'，当前为占位） */
  algorithm: string
  /** 签名值（hex 或 base64） */
  signature: string
  /** 签名时间戳（毫秒） */
  signedAt: number
  /** 签名者（用户或插件 ID） */
  signedBy?: string
  /** 被签名数据的哈希 */
  dataHash: string
}

// ============================================================
// Signer —— 签名器
// ============================================================

/** 当前占位算法名 */
const ALGORITHM = 'sha256-hmac-placeholder'

/**
 * 签名器
 *
 * 当前为占位实现（djb2 + FNV-1a 双 hash 复合），
 * 企业版可替换为 Node.js crypto 或 Web Crypto 真实实现。
 *
 * 设计原则：
 *   - sign() 永不抛异常（输入异常时返回固定 hash）
 *   - verify() 仅做哈希比对，不做密钥校验（占位）
 */
export class Signer {
  /**
   * 签名任意数据
   */
  sign(data: any, signedBy?: string): Signature {
    const dataHash = this.hash(data)
    const signature = this._combineHash(dataHash, signedBy)
    return {
      algorithm: ALGORITHM,
      signature,
      signedAt: Date.now(),
      signedBy,
      dataHash,
    }
  }

  /**
   * 验证签名
   *
   * 仅校验 dataHash 与 signature 是否一致；不校验签名者身份（占位实现）
   */
  verify(data: any, signature: Signature): boolean {
    try {
      const expectedHash = this.hash(data)
      if (expectedHash !== signature.dataHash) return false
      const expectedSig = this._combineHash(expectedHash, signature.signedBy)
      return expectedSig === signature.signature
    } catch (_e) {
      return false
    }
  }

  /**
   * 简易哈希函数（djb2 + FNV-1a 复合，返回 hex 字符串）
   */
  hash(data: any): string {
    const str = this._safeStringify(data)
    const djb2 = this._djb2(str)
    const fnv = this._fnv1a(str)
    // 复合：djb2 与 fnv 拼接，避免单算法碰撞
    return (djb2.toString(16).padStart(8, '0') + fnv.toString(16).padStart(8, '0'))
  }

  /**
   * 规则签名（便捷方法）
   */
  signRule(rule: any, signedBy?: string): Signature {
    return this.sign(rule, signedBy)
  }

  /**
   * 验证规则签名
   */
  verifyRule(rule: any, signature: Signature): boolean {
    return this.verify(rule, signature)
  }

  /**
   * 决策签名
   */
  signDecision(decision: any, signedBy?: string): Signature {
    return this.sign(decision, signedBy)
  }

  /**
   * 验证决策签名
   */
  verifyDecision(decision: any, signature: Signature): boolean {
    return this.verify(decision, signature)
  }

  // ----------------------------------------------------------
  // 内部辅助
  // ----------------------------------------------------------

  /** djb2 哈希 */
  private _djb2(str: string): number {
    let hash = 5381
    for (let i = 0; i < str.length; i++) {
      // hash * 33 + str.charCodeAt(i)，等价写法（位运算加速）
      hash = ((hash << 5) + hash) + str.charCodeAt(i)
      // 强制 32 位无符号
      hash = hash >>> 0
    }
    return hash >>> 0
  }

  /** FNV-1a 32 位哈希 */
  private _fnv1a(str: string): number {
    let hash = 0x811c9dc5
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      // hash *= 16777619（用 Math.imul 处理 32 位溢出）
      hash = Math.imul(hash, 0x01000193) >>> 0
    }
    return hash >>> 0
  }

  /** 组合 hash 与 signedBy 形成最终签名 */
  private _combineHash(dataHash: string, signedBy?: string): string {
    const salt = signedBy ?? 'anonymous'
    return this._djb2(dataHash + ':' + salt).toString(16).padStart(8, '0') + dataHash
  }

  /** 安全序列化：函数/循环引用兜底 */
  private _safeStringify(data: any): string {
    if (data === undefined) return 'undefined'
    if (data === null) return 'null'
    if (typeof data === 'function') return '[function]'
    if (typeof data !== 'object') return String(data)
    try {
      const seen = new WeakSet()
      return JSON.stringify(data, (_k, v) => {
        if (typeof v === 'function') return '[function]'
        if (typeof v === 'object' && v !== null) {
          if (seen.has(v)) return '[circular]'
          seen.add(v)
        }
        return v
      })
    } catch (_e) {
      // 退化：转字符串
      try {
        return String(data)
      } catch (_e2) {
        return '[unserializable]'
      }
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局签名器单例 */
export const globalSigner = new Signer()
