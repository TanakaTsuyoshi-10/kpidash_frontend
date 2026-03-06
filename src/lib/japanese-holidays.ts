/**
 * 日本の祝日判定ユーティリティ
 *
 * 祝日法に基づき祝日を算出する。npm依存なし。
 * 対応範囲: 1980〜2099年
 */

/** 年ごとのキャッシュ (dateStr → 祝日名) */
const cache = new Map<number, Map<string, string>>()

/** n月の第m月曜日の日付を返す */
function nthMonday(year: number, month: number, n: number): number {
  // 月の1日の曜日 (0=日, 1=月, ..., 6=土)
  const firstDay = new Date(year, month - 1, 1).getDay()
  // 最初の月曜日
  const firstMonday = firstDay <= 1 ? 2 - firstDay : 9 - firstDay
  return firstMonday + (n - 1) * 7
}

/** 春分の日 (1980-2099) */
function vernalEquinoxDay(year: number): number {
  if (year <= 1979 || year >= 2100) return 21
  if (year <= 2099) {
    return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
  }
  return 21
}

/** 秋分の日 (1980-2099) */
function autumnalEquinoxDay(year: number): number {
  if (year <= 1979 || year >= 2100) return 23
  if (year <= 2099) {
    return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))
  }
  return 23
}

/** dateStr (YYYY-MM-DD) をフォーマットするヘルパー */
function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** 指定年の祝日マップを構築する */
function buildHolidayMap(year: number): Map<string, string> {
  const holidays = new Map<string, string>()

  // --- 固定祝日 ---
  holidays.set(toDateStr(year, 1, 1), '元日')
  holidays.set(toDateStr(year, 2, 11), '建国記念の日')
  holidays.set(toDateStr(year, 2, 23), '天皇誕生日')
  holidays.set(toDateStr(year, 4, 29), '昭和の日')
  holidays.set(toDateStr(year, 5, 3), '憲法記念日')
  holidays.set(toDateStr(year, 5, 4), 'みどりの日')
  holidays.set(toDateStr(year, 5, 5), 'こどもの日')
  holidays.set(toDateStr(year, 8, 11), '山の日')
  holidays.set(toDateStr(year, 11, 3), '文化の日')
  holidays.set(toDateStr(year, 11, 23), '勤労感謝の日')

  // --- ハッピーマンデー ---
  holidays.set(toDateStr(year, 1, nthMonday(year, 1, 2)), '成人の日')
  holidays.set(toDateStr(year, 7, nthMonday(year, 7, 3)), '海の日')
  holidays.set(toDateStr(year, 9, nthMonday(year, 9, 3)), '敬老の日')
  holidays.set(toDateStr(year, 10, nthMonday(year, 10, 2)), 'スポーツの日')

  // --- 春分の日・秋分の日 ---
  holidays.set(toDateStr(year, 3, vernalEquinoxDay(year)), '春分の日')
  holidays.set(toDateStr(year, 9, autumnalEquinoxDay(year)), '秋分の日')

  // --- 振替休日 ---
  // 祝日が日曜の場合、翌日以降の最初の非祝日を振替休日にする
  const baseHolidayDates = [...holidays.keys()]
  for (const dateStr of baseHolidayDates) {
    const d = new Date(dateStr + 'T00:00:00')
    if (d.getDay() === 0) {
      // 日曜 → 翌日から非祝日を探す
      let substitute = new Date(d)
      substitute.setDate(substitute.getDate() + 1)
      while (holidays.has(toDateStr(substitute.getFullYear(), substitute.getMonth() + 1, substitute.getDate()))) {
        substitute.setDate(substitute.getDate() + 1)
      }
      holidays.set(
        toDateStr(substitute.getFullYear(), substitute.getMonth() + 1, substitute.getDate()),
        '振替休日',
      )
    }
  }

  // --- 国民の休日 ---
  // 2つの祝日に挟まれた平日は国民の休日
  const sortedDates = [...holidays.keys()].sort()
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const d1 = new Date(sortedDates[i] + 'T00:00:00')
    const d2 = new Date(sortedDates[i + 1] + 'T00:00:00')
    const diffDays = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays === 2) {
      const between = new Date(d1)
      between.setDate(between.getDate() + 1)
      const betweenStr = toDateStr(between.getFullYear(), between.getMonth() + 1, between.getDate())
      if (!holidays.has(betweenStr) && between.getDay() !== 0) {
        holidays.set(betweenStr, '国民の休日')
      }
    }
  }

  return holidays
}

/**
 * 指定日が日本の祝日であれば祝日名を返す。祝日でなければ null。
 * @param dateStr YYYY-MM-DD 形式
 */
export function getJapaneseHoliday(dateStr: string): string | null {
  const year = parseInt(dateStr.slice(0, 4), 10)
  if (isNaN(year)) return null

  let map = cache.get(year)
  if (!map) {
    map = buildHolidayMap(year)
    cache.set(year, map)
  }

  return map.get(dateStr) ?? null
}
