/**
 * 年度計算ユーティリティ
 *
 * 年度の定義:
 * - 2025年度 = 2024年9月〜2025年8月
 * - 年度は9月始まり、8月終わり
 */

/**
 * 現在の年度を取得
 * 9月以降は翌年が年度となる
 * 例: 2024年9月 → 2025年度
 *     2025年1月 → 2025年度
 *     2025年8月 → 2025年度
 *     2025年9月 → 2026年度
 */
export function getCurrentFiscalYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const year = now.getFullYear()
  return month >= 9 ? year + 1 : year
}

/**
 * 前月を取得（速報確定月）
 */
export function getPreviousMonth(): number {
  const now = new Date()
  const month = now.getMonth() // 0-11
  return month === 0 ? 12 : month
}

/**
 * 現在の四半期を計算
 * Q1: 9-11月, Q2: 12-2月, Q3: 3-5月, Q4: 6-8月
 */
export function getCurrentQuarter(): number {
  const now = new Date()
  const month = now.getMonth() + 1

  if (month >= 9 && month <= 11) return 1
  if (month === 12 || month <= 2) return 2
  if (month >= 3 && month <= 5) return 3
  return 4
}

/**
 * 年度と月からカレンダー年を取得
 * 例: 2025年度の9月 → 2024年（カレンダー年）
 *     2025年度の1月 → 2025年（カレンダー年）
 */
export function getCalendarYear(fiscalYear: number, month: number): number {
  // 9-12月は年度の前年
  return month >= 9 ? fiscalYear - 1 : fiscalYear
}

/**
 * 年度と月からISO形式の期間文字列を生成
 * 例: 2025年度の9月 → "2024-09-01"
 *     2025年度の1月 → "2025-01-01"
 */
export function formatPeriod(fiscalYear: number, month: number): string {
  const calendarYear = getCalendarYear(fiscalYear, month)
  return `${calendarYear}-${String(month).padStart(2, '0')}-01`
}

/**
 * 年度選択肢を生成（現在年度から過去5年）
 */
export function getYearOptions(): number[] {
  const fiscalYear = getCurrentFiscalYear()
  const years: number[] = []
  for (let i = 0; i < 5; i++) {
    years.push(fiscalYear - i)
  }
  return years
}

/**
 * 期間文字列から年度を取得
 * 例: "2024-09-01" → 2025年度
 *     "2025-01-01" → 2025年度
 */
export function getFiscalYearFromPeriod(period: string): number {
  const date = new Date(period)
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return month >= 9 ? year + 1 : year
}

/**
 * 年度と月から表示用の文字列を生成
 * 例: 2026年度の9月 → "2025年9月"（カレンダー年で表示）
 */
export function formatDisplayPeriod(fiscalYear: number, month: number): string {
  const calendarYear = getCalendarYear(fiscalYear, month)
  return `${calendarYear}年${month}月`
}
