/**
 * 数値フォーマットユーティリティ
 */

/**
 * 文字列/数値をnumberに変換
 */
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? null : num
}

/**
 * 金額を短縮表示
 * @param value - 金額
 * @param short - 短縮表示するか（true: 228M、false: 228,000,000）
 */
export function formatCurrency(value: number | string | null | undefined, short: boolean = true): string {
  const num = toNumber(value)
  if (num === null) return '-'

  // 小数点以下を四捨五入して整数にする
  const intValue = Math.round(num)

  if (short) {
    const absValue = Math.abs(intValue)
    const sign = intValue < 0 ? '▲' : ''

    if (absValue >= 100000000) {
      // 1億以上
      return `${sign}${(absValue / 100000000).toFixed(1)}億`
    } else if (absValue >= 10000000) {
      // 1000万以上
      return `${sign}${Math.round(absValue / 10000).toLocaleString()}万`
    } else if (absValue >= 1000000) {
      // 100万以上
      return `${sign}${(absValue / 10000).toFixed(0)}万`
    } else if (absValue >= 10000) {
      // 1万以上
      return `${sign}${(absValue / 10000).toFixed(1)}万`
    }
    return `${sign}${absValue.toLocaleString()}`
  }

  if (intValue < 0) {
    return `▲${Math.abs(intValue).toLocaleString()}`
  }
  return intValue.toLocaleString()
}

/**
 * パーセントを表示
 * @param value - パーセント値
 * @param showSign - 符号を表示するか
 */
export function formatPercent(value: number | string | null | undefined, showSign: boolean = false): string {
  const num = toNumber(value)
  if (num === null) return '-'

  if (showSign) {
    if (num > 0) {
      return `+${num.toFixed(1)}%`
    } else if (num < 0) {
      return `▲${Math.abs(num).toFixed(1)}%`
    }
  }
  return `${num.toFixed(1)}%`
}

/**
 * 前年比を表示
 * @param value - 前年比（%）
 * @returns { text: 表示文字列, isPositive: プラスかどうか }
 */
export function formatYoY(value: number | string | null | undefined): { text: string; isPositive: boolean | null } {
  const num = toNumber(value)
  if (num === null) {
    return { text: '-', isPositive: null }
  }

  if (num > 0) {
    return { text: `+${num.toFixed(1)}%`, isPositive: true }
  } else if (num < 0) {
    return { text: `▲${Math.abs(num).toFixed(1)}%`, isPositive: false }
  }
  return { text: '±0%', isPositive: null }
}

/**
 * 達成率を表示
 * @param value - 達成率（%）
 */
export function formatAchievementRate(value: number | string | null | undefined): { text: string; status: 'good' | 'warning' | 'critical' | 'none' } {
  const num = toNumber(value)
  if (num === null) {
    return { text: '-', status: 'none' }
  }

  const text = `${num.toFixed(1)}%`

  if (num >= 100) {
    return { text, status: 'good' }
  } else if (num >= 80) {
    return { text, status: 'warning' }
  }
  return { text, status: 'critical' }
}

/**
 * 数値を表示（カンマ区切り + 単位）
 * @param value - 数値
 * @param suffix - 単位
 */
export function formatNumber(value: number | string | null | undefined, suffix: string = ''): string {
  const num = toNumber(value)
  if (num === null) return '-'
  return `${num.toLocaleString()}${suffix}`
}

/**
 * ポイント差を表示
 * @param value - ポイント差
 */
export function formatPointDiff(value: number | string | null | undefined): { text: string; isPositive: boolean | null } {
  const num = toNumber(value)
  if (num === null) {
    return { text: '-', isPositive: null }
  }

  if (num > 0) {
    return { text: `+${num.toFixed(1)}pt`, isPositive: true }
  } else if (num < 0) {
    return { text: `▲${Math.abs(num).toFixed(1)}pt`, isPositive: false }
  }
  return { text: '±0pt', isPositive: null }
}
