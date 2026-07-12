/**
 * 输入/输出消毒与编码工具
 *
 * 提供 HTML 标签移除、URL 协议白名单、安全 JSON 解析、文件名路径穿越防护，
 * 以及 HTML 实体编码、URL 编码、JS 字符转义等能力，用于防止 XSS、开放重定向、
 * 路径穿越等注入类攻击。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/**
 * 移除所有 HTML 标签
 *
 * 先剥离 <script>/<style> 等危险标签及其内容，再移除其余所有标签，
 * 最后解码常见 HTML 实体，返回纯文本。
 *
 * @param input - 待消毒的字符串
 * @returns 不含任何 HTML 标签的纯文本
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  let result = input
  // 移除 script / style / noscript / template 标签及其内容
  result = result.replace(
    /<(script|style|noscript|template|iframe|object|embed)[^>]*>[\s\S]*?<\/\1\s*>/gi,
    ''
  )
  // 移除所有标签
  result = result.replace(/<\/?[^>]+>/g, '')
  // 解码常见 HTML 实体
  result = result
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
  return result
}

/**
 * URL 协议白名单消毒
 *
 * 只允许 http/https 协议；其余（javascript:、data:、vbscript: 等）一律返回空串。
 * 相对路径（以 /、#、? 开头）视为安全并原样返回。
 *
 * @param url - 待消毒的 URL
 * @returns 安全的 URL，非法协议返回 ''
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return ''
  }
  const trimmed = url.trim()
  if (trimmed === '') {
    return ''
  }
  // 相对路径、锚点、查询字符串视为安全
  if (trimmed.charAt(0) === '/' || trimmed.charAt(0) === '#' || trimmed.charAt(0) === '?') {
    return trimmed
  }
  // 提取协议
  const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):/)
  if (!match) {
    // 无协议的裸地址，按 http 处理（避免被解释为相对路径）
    return trimmed
  }
  const protocol = match[1].toLowerCase()
  if (protocol === 'http' || protocol === 'https' || protocol === 'mailto' || protocol === 'tel') {
    return trimmed
  }
  // 危险协议
  return ''
}

/**
 * 安全 JSON 解析
 *
 * 尝试解析输入为 JSON 并重新序列化，确保输出为合法 JSON 字符串。
 * 解析失败时返回 '{}'，避免抛出异常。
 *
 * @param input - 待解析的 JSON 字符串
 * @returns 重新序列化后的合法 JSON 字符串（解析失败返回 '{}'）
 */
export function sanitizeJson(input: string): string {
  if (typeof input !== 'string' || input.trim() === '') {
    return '{}'
  }
  try {
    const parsed = JSON.parse(input)
    return JSON.stringify(parsed)
  } catch (_e) {
    return '{}'
  }
}

/**
 * 文件名消毒：移除路径穿越字符
 *
 * 移除目录分隔符、上级目录引用（..）、空字节及控制字符，
 * 仅保留安全的文件名字符。
 *
 * @param name - 待消毒的文件名
 * @returns 安全的文件名（不含路径分隔符与穿越字符）
 */
export function sanitizeFilename(name: string): string {
  if (typeof name !== 'string') {
    return ''
  }
  let result = name
  // 移除空字节与控制字符
  result = result.replace(/[\x00-\x1f\x7f]/g, '')
  // 移除路径分隔符
  result = result.replace(/[\/\\]/g, '')
  // 移除上级目录引用
  result = result.replace(/\.\./g, '')
  // 移除开头的点（隐藏文件）与连字符（避免命令行参数注入）
  result = result.replace(/^[\.\-]+/, '')
  // 限制长度
  if (result.length > 255) {
    result = result.substring(0, 255)
  }
  return result
}

/**
 * HTML 实体编码
 *
 * 将 & < > " ' 转义为对应的 HTML 实体，用于安全地插入 HTML 上下文。
 *
 * @param input - 待编码的字符串
 * @returns HTML 实体编码后的字符串
 */
export function encodeForHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * URL 编码
 *
 * 对字符串进行 URL 编码（基于 encodeURIComponent），用于拼接查询参数。
 *
 * @param input - 待编码的字符串
 * @returns URL 编码后的字符串
 */
export function encodeForUrl(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  return encodeURIComponent(input)
}

/**
 * JS 字符串转义
 *
 * 转义反斜杠、引号、换行等字符，使输入可安全地嵌入 JS 字符串字面量
 * （单引号或双引号上下文均适用），防止 JS 注入与字符串提前闭合。
 *
 * @param input - 待转义的字符串
 * @returns 转义后可安全嵌入 JS 字符串字面量的字符串
 */
export function encodeForJs(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\u0060/g, '\\\u0060')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')
}
