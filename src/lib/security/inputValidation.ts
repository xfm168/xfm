/**
 * 前端输入验证工具
 *
 * 提供常用的输入校验函数：邮箱、手机号、出生日期/时间、性别、房间类型、
 * 文件大小、图片类型等。用于前端表单校验和数据提交前的安全检查。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/** 允许上传的图片扩展名 */
export const ALLOWED_IMAGE_EXTENSIONS: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp']

/** 最大上传文件大小：10MB（字节） */
export const MAX_UPLOAD_SIZE: number = 10 * 1024 * 1024

/** 允许的房间类型列表 */
var ALLOWED_ROOM_TYPES: string[] = [
  'living-room',
  'bedroom',
  'kitchen',
  'bathroom',
  'study',
  'dining-room',
  'balcony',
  'entrance',
  'master-bedroom'
]

/**
 * 校验邮箱格式
 *
 * @param email - 待校验的邮箱地址
 * @returns 是否合法
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string' || email.trim() === '') {
    return false
  }
  var pattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/
  return pattern.test(email.trim())
}

/**
 * 校验手机号格式（中国大陆手机号）
 *
 * @param phone - 待校验的手机号
 * @returns 是否合法
 */
export function validatePhone(phone: string): boolean {
  if (typeof phone !== 'string' || phone.trim() === '') {
    return false
  }
  // 中国大陆手机号：1开头，第二位3-9，共11位数字
  var pattern = /^1[3-9]\d{9}$/
  return pattern.test(phone.trim())
}

/**
 * 校验出生日期格式（YYYY-MM-DD）
 *
 * @param date - 待校验的日期字符串
 * @returns 是否合法（1900-2100年范围内）
 */
export function validateBirthDate(date: string): boolean {
  if (typeof date !== 'string' || date.trim() === '') {
    return false
  }
  var pattern = /^\d{4}-\d{2}-\d{2}$/
  if (!pattern.test(date.trim())) {
    return false
  }

  var parts = date.split('-')
  var year = parseInt(parts[0], 10)
  var month = parseInt(parts[1], 10)
  var day = parseInt(parts[2], 10)

  if (year < 1900 || year > 2100) {
    return false
  }
  if (month < 1 || month > 12) {
    return false
  }
  if (day < 1 || day > 31) {
    return false
  }

  // 进一步校验日期合法性（排除 2月30日 等）
  var dateObj = new Date(year, month - 1, day)
  if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
    return false
  }

  return true
}

/**
 * 校验出生时间格式（HH:MM）
 *
 * @param time - 待校验的时间字符串
 * @returns 是否合法
 */
export function validateBirthTime(time: string): boolean {
  if (typeof time !== 'string' || time.trim() === '') {
    return false
  }
  var pattern = /^\d{2}:\d{2}$/
  if (!pattern.test(time.trim())) {
    return false
  }

  var parts = time.split(':')
  var hour = parseInt(parts[0], 10)
  var minute = parseInt(parts[1], 10)

  if (hour < 0 || hour > 23) {
    return false
  }
  if (minute < 0 || minute > 59) {
    return false
  }

  return true
}

/**
 * 校验性别输入
 *
 * @param g - 性别字符串
 * @returns 是否为 'male' 或 'female'
 */
export function validateGender(g: string): boolean {
  return g === 'male' || g === 'female'
}

/**
 * 校验房间类型是否在允许列表中
 *
 * @param type - 房间类型字符串
 * @returns 是否为允许的房间类型
 */
export function validateRoomType(type: string): boolean {
  return ALLOWED_ROOM_TYPES.indexOf(type) !== -1
}

/**
 * 消毒用户输入
 *
 * - 去除前后空白
 * - 限制最大长度
 * - 转义 HTML 特殊字符
 *
 * @param input - 待消毒的字符串
 * @param maxLength - 最大长度限制，默认 10000
 * @returns 消毒后的安全字符串
 */
export function sanitizeInput(input: string, maxLength?: number): string {
  if (typeof input !== 'string') {
    return ''
  }

  var maxLen = maxLength !== undefined ? maxLength : 10000

  // 去除前后空白
  var result = input.trim()

  // 限制长度
  if (result.length > maxLen) {
    result = result.substring(0, maxLen)
  }

  // 转义 HTML 特殊字符
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  return result
}

/**
 * 校验文件大小是否在允许范围内
 *
 * @param size - 文件大小（字节）
 * @param maxMB - 最大允许的 MB 数
 * @returns 是否在范围内
 */
export function validateFileSize(size: number, maxMB: number): boolean {
  if (typeof size !== 'number' || size < 0) {
    return false
  }
  var maxBytes = maxMB * 1024 * 1024
  return size <= maxBytes
}

/**
 * 校验图片 MIME 类型是否在允许列表中
 *
 * @param type - 文件的 MIME 类型
 * @returns 是否为允许的图片类型（jpg/jpeg/png/gif/webp）
 */
export function validateImageType(type: string): boolean {
  var allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  return allowedTypes.indexOf(type) !== -1
}
