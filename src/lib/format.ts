/**
 * 数値フォーマットユーティリティ
 */

/**
 * 金額を短縮表示
 * @param value - 金額
 * @param short - 短縮表示するか（true: ¥228M、false: ¥228,000,000）
 */
export function formatCurrency(value: number | null, short: boolean = true): string {
  if (value === null || value === undefined) return '-'

  if (short) {
    const absValue = Math.abs(value)
    const sign = value < 0 ? '▲' : ''

    if (absValue >= 100000000) {
      // 1億以上
      return `${sign}¥${(absValue / 100000000).toFixed(1)}億`
    } else if (absValue >= 10000000) {
      // 1000万以上
      return `${sign}¥${Math.round(absValue / 10000).toLocaleString()}万`
    } else if (absValue >= 1000000) {
      // 100万以上
      return `${sign}¥${(absValue / 10000).toFixed(0)}万`
    } else if (absValue >= 10000) {
      // 1万以上
      return `${sign}¥${(absValue / 10000).toFixed(1)}万`
    }
    return `${sign}¥${absValue.toLocaleString()}`
  }

  if (value < 0) {
    return `▲¥${Math.abs(value).toLocaleString()}`
  }
  return `¥${value.toLocaleString()}`
}

/**
 * パーセントを表示
 * @param value - パーセント値
 * @param showSign - 符号を表示するか
 */
export function formatPercent(value: number | null, showSign: boolean = false): string {
  if (value === null || value === undefined) return '-'

  if (showSign) {
    if (value > 0) {
      return `+${value.toFixed(1)}%`
    } else if (value < 0) {
      return `▲${Math.abs(value).toFixed(1)}%`
    }
  }
  return `${value.toFixed(1)}%`
}

/**
 * 前年比を表示
 * @param value - 前年比（%）
 * @returns { text: 表示文字列, isPositive: プラスかどうか }
 */
export function formatYoY(value: number | null): { text: string; isPositive: boolean | null } {
  if (value === null || value === undefined) {
    return { text: '-', isPositive: null }
  }

  if (value > 0) {
    return { text: `+${value.toFixed(1)}%`, isPositive: true }
  } else if (value < 0) {
    return { text: `▲${Math.abs(value).toFixed(1)}%`, isPositive: false }
  }
  return { text: '±0%', isPositive: null }
}

/**
 * 達成率を表示
 * @param value - 達成率（%）
 */
export function formatAchievementRate(value: number | null): { text: string; status: 'good' | 'warning' | 'critical' | 'none' } {
  if (value === null || value === undefined) {
    return { text: '-', status: 'none' }
  }

  const text = `${value.toFixed(1)}%`

  if (value >= 100) {
    return { text, status: 'good' }
  } else if (value >= 80) {
    return { text, status: 'warning' }
  }
  return { text, status: 'critical' }
}

/**
 * 数値を表示（カンマ区切り + 単位）
 * @param value - 数値
 * @param suffix - 単位
 */
export function formatNumber(value: number | null, suffix: string = ''): string {
  if (value === null || value === undefined) return '-'
  return `${value.toLocaleString()}${suffix}`
}

/**
 * ポイント差を表示
 * @param value - ポイント差
 */
export function formatPointDiff(value: number | null): { text: string; isPositive: boolean | null } {
  if (value === null || value === undefined) {
    return { text: '-', isPositive: null }
  }

  if (value > 0) {
    return { text: `+${value.toFixed(1)}pt`, isPositive: true }
  } else if (value < 0) {
    return { text: `▲${Math.abs(value).toFixed(1)}pt`, isPositive: false }
  }
  return { text: '±0pt', isPositive: null }
}
