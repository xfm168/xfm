/**
 * RC3-2: 日志系统 - 匿名化工具
 *
 * 提供 PII（个人身份信息）匿名化处理：
 * - anonymizeUserId: SHA-256 哈希前 8 位（同步实现，不依赖 crypto.subtle）
 * - anonymizeIp: IP 地址保留前两段
 * - generateRequestId: UUID v4 格式请求 ID
 *
 * 全部使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

// ══════════════════════════════════════════════════
//  SHA-256 同步实现
//  用于 anonymizeUserId，不依赖异步 crypto.subtle.digest
// ══════════════════════════════════════════════════

/** SHA-256 轮常量 K[0..63] */
var SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]

/** SHA-256 初始哈希值 H[0..7] */
var SHA256_H = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]

/** 32 位循环右移 */
function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n))
}

/**
 * 同步 SHA-256 计算
 * @param message UTF-8 字符串
 * @returns 64 字符十六进制哈希值
 */
function sha256Sync(message: string): string {
  // 转换为 UTF-8 字节
  var encoder: { encode: (s: string) => Uint8Array }
  if (typeof TextEncoder !== 'undefined') {
    encoder = new TextEncoder()
  } else {
    // 兜底：手动 UTF-8 编码（仅 ASCII 场景）
    encoder = {
      encode: function (s: string): Uint8Array {
        var arr: number[] = []
        for (var i = 0; i < s.length; i++) {
          arr.push(s.charCodeAt(i) & 0xff)
        }
        return new Uint8Array(arr)
      },
    }
  }
  var bytes = encoder.encode(message)

  // 填充
  var l = bytes.length
  var bitLen = l * 8
  var withOne = l + 1
  var withZeros = withOne + ((56 - (withOne % 64) + 64) % 64)
  var padded = new Uint8Array(withZeros)
  padded.set(bytes)
  padded[l] = 0x80

  // 追加 64 位大端长度
  var view = new DataView(padded.buffer)
  view.setUint32(withZeros - 4, bitLen >>> 0, false)
  view.setUint32(withZeros - 8, Math.floor(bitLen / 0x100000000), false)

  // 初始化哈希值（副本）
  var H = SHA256_H.slice()
  var W = new Array(64)

  // 逐块处理（每块 512 位 = 64 字节）
  for (var blockIdx = 0; blockIdx < padded.length; blockIdx += 64) {
    // 扩展消息字 W[0..15]
    for (var t = 0; t < 16; t++) {
      W[t] = view.getUint32(blockIdx + t * 4, false)
    }
    // 扩展 W[16..63]
    for (var t2 = 16; t2 < 64; t2++) {
      var s0 = rotr(W[t2 - 15], 7) ^ rotr(W[t2 - 15], 18) ^ (W[t2 - 15] >>> 3)
      var s1 = rotr(W[t2 - 2], 17) ^ rotr(W[t2 - 2], 19) ^ (W[t2 - 2] >>> 10)
      W[t2] = (W[t2 - 16] + s0 + W[t2 - 7] + s1) >>> 0
    }

    // 压缩
    var a = H[0], b = H[1], c = H[2], d = H[3]
    var e = H[4], f = H[5], g = H[6], h = H[7]

    for (var r = 0; r < 64; r++) {
      var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      var ch = (e & f) ^ (~e & g)
      var temp1 = (h + S1 + ch + SHA256_K[r] + W[r]) >>> 0
      var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      var maj = (a & b) ^ (a & c) ^ (b & c)
      var temp2 = (S0 + maj) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    H[0] = (H[0] + a) >>> 0
    H[1] = (H[1] + b) >>> 0
    H[2] = (H[2] + c) >>> 0
    H[3] = (H[3] + d) >>> 0
    H[4] = (H[4] + e) >>> 0
    H[5] = (H[5] + f) >>> 0
    H[6] = (H[6] + g) >>> 0
    H[7] = (H[7] + h) >>> 0
  }

  // 转换为十六进制
  var hex = ''
  for (var hi = 0; hi < 8; hi++) {
    var part = H[hi].toString(16)
    while (part.length < 8) {
      part = '0' + part
    }
    hex += part
  }
  return hex
}

// ══════════════════════════════════════════════════
//  公开 API
// ══════════════════════════════════════════════════

/**
 * 匿名化用户 ID — SHA-256 哈希前 8 位
 *
 * @example
 * anonymizeUserId('user@example.com') // 'a1b2c3d4'
 */
export function anonymizeUserId(id: string): string {
  if (!id || id.length === 0) {
    return '00000000'
  }
  var hash = sha256Sync(id)
  return hash.substring(0, 8)
}

/**
 * 匿名化 IP 地址 — 保留前两段
 *
 * @example
 * anonymizeIp('192.168.1.1')   // '192.168.x.x'
 * anonymizeIp('2001:db8::1')   // '2001:db8:...:...'
 */
export function anonymizeIp(ip: string): string {
  if (!ip || ip.length === 0) {
    return 'unknown'
  }
  // IPv4
  if (ip.indexOf('.') !== -1) {
    var parts = ip.split('.')
    if (parts.length === 4) {
      return parts[0] + '.' + parts[1] + '.x.x'
    }
    return 'unknown'
  }
  // IPv6
  if (ip.indexOf(':') !== -1) {
    var groups = ip.split(':')
    if (groups.length >= 2) {
      return groups[0] + ':' + groups[1] + ':...:...'
    }
    return 'unknown'
  }
  return 'unknown'
}

/**
 * 生成 UUID v4 格式请求 ID
 *
 * 优先使用 crypto.randomUUID()，不可用时回退到 Math.random。
 *
 * @example
 * generateRequestId() // '550e8400-e29b-41d4-a716-446655440000'
 */
export function generateRequestId(): string {
  // 优先使用原生 UUID
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  // 回退方案
  var chars = '0123456789abcdef'
  var result = ''

  for (var i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  result += '-'
  for (var i2 = 0; i2 < 4; i2++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  result += '-4' // version 4
  for (var i3 = 0; i3 < 3; i3++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  result += '-'
  result += chars[8 + Math.floor(Math.random() * 4)] // variant: 8/9/a/b
  for (var i4 = 0; i4 < 3; i4++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  result += '-'
  for (var i5 = 0; i5 < 12; i5++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}
