/**
 * 計算結果をメモ化するユーティリティ
 */

export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)

    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }

    return result
  }) as T
}

export const formatCurrencyMemo = memoize((value: number | null, short: boolean = false): string => {
  if (value === null || value === undefined) return '-'

  if (short) {
    const absValue = Math.abs(value)
    if (absValue >= 100000000) {
      return `${value < 0 ? '▲' : ''}¥${(Math.abs(value) / 100000000).toFixed(1)}億`
    }
    if (absValue >= 10000) {
      return `${value < 0 ? '▲' : ''}¥${(Math.abs(value) / 10000).toFixed(0)}万`
    }
  }

  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(value)
})

export const formatPercentMemo = memoize((value: number | null, showSign: boolean = true): string => {
  if (value === null || value === undefined) return '-'

  const sign = showSign && value > 0 ? '+' : ''
  const prefix = value < 0 ? '▲' : ''
  return `${prefix}${sign}${Math.abs(value).toFixed(1)}%`
})
