/**
 * バット数カレンダーコンポーネント
 *
 * 月のカレンダーグリッドにバット数を表示する。
 * 同曜日ハイライト・土日色分け・バット数に応じた背景色グラデーション付き。
 */
'use client'

import { cn } from '@/lib/utils'
import type { CalendarMonth } from '@/types/order-forecast'

const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

interface BatCalendarProps {
  calendarData: CalendarMonth
  /** 今日と同じ曜日のインデックス (0=月〜6=日) をハイライト */
  highlightWeekday?: number
  /** 店舗セレクタで選択中のsegment_id（指定時はその店舗のbatsのみ表示） */
  segmentId?: string
}

/** バット数に応じた背景色クラスを返す */
function batBgClass(bats: number, maxBats: number): string {
  if (bats === 0 || maxBats === 0) return ''
  const ratio = bats / maxBats
  if (ratio >= 0.8) return 'bg-emerald-200 dark:bg-emerald-900/40'
  if (ratio >= 0.6) return 'bg-emerald-100 dark:bg-emerald-900/25'
  if (ratio >= 0.4) return 'bg-emerald-50 dark:bg-emerald-900/15'
  return ''
}

export function BatCalendar({ calendarData, highlightWeekday, segmentId }: BatCalendarProps) {
  const { year, month, days } = calendarData

  if (!days || days.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        データがありません
      </div>
    )
  }

  // 曜日→インデックス変換マップ
  const weekdayToIndex: Record<string, number> = {
    '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5, '日': 6,
  }

  // 月初の曜日インデックスを取得
  const firstDayWeekdayIdx = weekdayToIndex[days[0].weekday] ?? 0

  // バット数を取得（店舗別 or 全店舗合計）
  const getBats = (dayIndex: number): number => {
    const day = days[dayIndex]
    if (!day) return 0
    if (segmentId) {
      const store = day.by_store.find(s => s.segment_id === segmentId)
      return store?.bats ?? 0
    }
    return day.bats
  }

  // 最大バット数（グラデーション用）
  const allBats = days.map((_, i) => getBats(i))
  const maxBats = Math.max(...allBats, 1)

  // カレンダーの行を構築
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  // 月初まで空セル
  for (let i = 0; i < firstDayWeekdayIdx; i++) {
    currentWeek.push(null)
  }

  for (let i = 0; i < days.length; i++) {
    currentWeek.push(i)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // 月末の残り
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">
        {year}年{month}月
      </h3>
      <div className="grid grid-cols-7 gap-px text-xs">
        {/* 曜日ヘッダー */}
        {WEEKDAY_LABELS.map((label, colIdx) => (
          <div
            key={label}
            className={cn(
              'text-center py-1 font-medium',
              colIdx === 5 && 'text-blue-600 dark:text-blue-400',
              colIdx === 6 && 'text-red-600 dark:text-red-400',
              highlightWeekday === colIdx && 'bg-amber-100 dark:bg-amber-900/30',
            )}
          >
            {label}
          </div>
        ))}

        {/* カレンダー本体 */}
        {weeks.map((week, weekIdx) =>
          week.map((dayIdx, colIdx) => {
            if (dayIdx === null) {
              return (
                <div
                  key={`empty-${weekIdx}-${colIdx}`}
                  className={cn(
                    'h-12',
                    highlightWeekday === colIdx && 'bg-amber-50/50 dark:bg-amber-900/10',
                  )}
                />
              )
            }

            const day = days[dayIdx]
            const bats = getBats(dayIdx)
            const dateNum = parseInt(day.date.split('-')[2], 10)

            return (
              <div
                key={day.date}
                className={cn(
                  'h-12 p-0.5 border border-border/50 flex flex-col items-center justify-center',
                  colIdx === 5 && 'text-blue-600 dark:text-blue-400',
                  colIdx === 6 && 'text-red-600 dark:text-red-400',
                  highlightWeekday === colIdx && 'bg-amber-50 dark:bg-amber-900/20',
                  batBgClass(bats, maxBats),
                )}
              >
                <span className="text-[10px] leading-tight">{dateNum}</span>
                {bats > 0 && (
                  <span className="text-[11px] font-semibold leading-tight">
                    {bats % 1 === 0 ? bats.toFixed(0) : bats.toFixed(1)}
                  </span>
                )}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
