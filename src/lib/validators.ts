/**
 * フロントエンド用入力検証ユーティリティ
 */

const MIN_YEAR = 2020
const MAX_YEAR = 2100
const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv']

export function validateYear(year: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(year)) {
    return { valid: false, error: '年は整数で入力してください' }
  }
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return { valid: false, error: `年は${MIN_YEAR}から${MAX_YEAR}の範囲で入力してください` }
  }
  return { valid: true }
}

export function validateMonth(month: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(month)) {
    return { valid: false, error: '月は整数で入力してください' }
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: '月は1から12の範囲で入力してください' }
  }
  return { valid: true }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024)
    return { valid: false, error: `ファイルサイズは${maxMB}MB以下にしてください` }
  }

  const fileName = file.name.toLowerCase()
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
  if (!hasValidExtension) {
    return { valid: false, error: `許可されているファイル形式は ${ALLOWED_EXTENSIONS.join(', ')} です` }
  }

  return { valid: true }
}

export function sanitizeString(value: string, maxLength: number = 255): string {
  if (!value) return ''
  let sanitized = value.slice(0, maxLength)
  sanitized = sanitized.replace(/<[^>]*>/g, '')
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  return sanitized.trim()
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: '有効なメールアドレスを入力してください' }
  }
  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'パスワードは8文字以上で入力してください' }
  }
  return { valid: true }
}
