/**
 * 日別前年対比カレンダー（店舗詳細ページ用）
 *
 * 選択月の日別売上と前年対比（前年同曜日比較）をカレンダー形式で表示する。
 * ページが長くなるためトグルで開閉できる（デフォルト閉）。
 * データは日次分析と同じ /daily-sales/summary を利用し、対象店舗分のみ表示する。
 */
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, ChevronDown, ChevronRight } from 'lucide-react'
import { useDailySalesSummary } from '@/hooks/useDailySales'
import { getJapaneseHoliday } from '@/lib/japanese-holidays'
import { cn } from '@/lib/utils'

const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日']

interface Props {
  segmentId: string
  month: string
  displayMonth: string
}

interface DayCell {
  date: string
  day: number
  sales: number
  salesPrev: number | null
  yoy: number | null
  customers: number
  customersPrev: number | null
  comparisonDate: string | null
}

function formatYoY(rate: number | null): string {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

// 日付ラベルの色: 日曜・祝日=赤、土曜=青
function dayLabelClass(date: Date, dateStr: string): string {
  const dow = date.getDay()
  if (dow === 0 || getJapaneseHoliday(dateStr)) return 'text-red-600'
  if (dow === 6) return 'text-blue-600'
  return 'text-gray-700'
}

export function DailySalesCalendar({ segmentId, month, displayMonth }: Props) {
  // ページが長くなるためデフォルト閉
  const [open, setOpen] = useState(false)
  const { data, loading, error } = useDailySalesSummary(month)

  // 対象店舗の日別データ
  const { cells, monthTotal } = useMemo(() => {
    const map = new Map<string, DayCell>()
    for (const row of data?.data ?? []) {
      if (row.segment_id !== segmentId) continue
      const day = parseInt(row.date.split('-')[2], 10)
      map.set(row.date, {
        date: row.date,
        day,
        sales: row.sales ?? 0,
        salesPrev: row.sales_previous_year ?? null,
        yoy: row.yoy_sales_rate ?? null,
        customers: row.customers ?? 0,
        customersPrev: row.customers_previous_year ?? null,
        comparisonDate: row.comparison_date ?? null,
      })
    }
    const total = (data?.totals ?? []).find((t) => t.segment_id === segmentId) ?? null
    return { cells: map, monthTotal: total }
  }, [data, segmentId])

  // カレンダーグリッド（月曜始まり）
  const weeks = useMemo(() => {
    const [y, m] = month.substring(0, 7).split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const firstDow = (new Date(y, m - 1, 1).getDay() + 6) % 7 // 月=0
    const result: (string | null)[][] = []
    let week: (string | null)[] = Array.from({ length: firstDow }, () => null)
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
      if (week.length === 7) {
        result.push(week)
        week = []
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null)
      result.push(week)
    }
    return result
  }, [month])

  return (
    <Card>
      <CardHeader
        onClick={() => setOpen(!open)}
        className="cursor-pointer select-none hover:bg-gray-50/60 transition-colors"
      >
        <CardTitle className="flex items-center gap-2 min-h-7">
          {open ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <CalendarDays className="h-4 w-4 text-gray-500" />
          日別前年対比カレンダー ({displayMonth})
          {monthTotal ? (
            <span className="ml-auto text-sm font-normal text-gray-500 tabular-nums">
              月計 <span className="font-bold text-gray-900">¥{Math.round(monthTotal.sales ?? 0).toLocaleString()}</span>
              <span
                className={cn(
                  'ml-2 font-semibold',
                  (monthTotal.yoy_sales_rate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600',
                )}
              >
                前年比 {formatYoY(monthTotal.yoy_sales_rate ?? null)}
              </span>
            </span>
          ) : (
            !open && (
              <span className="text-sm font-normal text-gray-400">（クリックで展開）</span>
            )
          )}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              読み込み中...
            </div>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className={cn(
                      'text-center text-xs font-medium py-1',
                      label === '土' && 'text-blue-600',
                      label === '日' && 'text-red-600',
                    )}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1">
                    {week.map((dateStr, di) => {
                      if (!dateStr) {
                        return <div key={di} className="rounded-md bg-gray-50/50 min-h-[68px]" />
                      }
                      const cell = cells.get(dateStr)
                      const d = new Date(dateStr + 'T00:00:00')
                      const hasData = !!cell && cell.sales > 0
                      const tooltip = cell
                        ? `${dateStr}\n売上: ¥${Math.round(cell.sales).toLocaleString()}` +
                          (cell.salesPrev != null
                            ? `\n前年(${cell.comparisonDate ?? '同曜日'}): ¥${Math.round(cell.salesPrev).toLocaleString()}`
                            : '') +
                          `\n客数: ${cell.customers.toLocaleString()}人` +
                          (cell.customersPrev != null ? `（前年 ${cell.customersPrev.toLocaleString()}人）` : '')
                        : dateStr
                      return (
                        <div
                          key={dateStr}
                          title={tooltip}
                          className={cn(
                            'rounded-md border px-1.5 py-1 min-h-[68px] flex flex-col',
                            hasData ? 'bg-white' : 'bg-gray-50/50',
                          )}
                        >
                          <span
                            className={cn(
                              'text-xs font-semibold leading-tight',
                              dayLabelClass(d, dateStr),
                            )}
                          >
                            {cell?.day ?? parseInt(dateStr.split('-')[2], 10)}
                          </span>
                          {hasData ? (
                            <>
                              <span className="text-[11px] font-medium tabular-nums leading-tight mt-auto">
                                ¥{Math.round(cell.sales).toLocaleString()}
                              </span>
                              <span
                                className={cn(
                                  'text-[11px] font-bold tabular-nums leading-tight',
                                  cell.yoy == null
                                    ? 'text-gray-400'
                                    : cell.yoy >= 0
                                      ? 'text-green-600'
                                      : 'text-red-600',
                                )}
                              >
                                {formatYoY(cell.yoy)}
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-300 mt-auto">-</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                ※ 前年対比は前年の同じ曜日（前年同日付に最も近い同曜日）との比較です。
                セルにカーソルを合わせると前年の日付・売上・客数を表示します。
              </p>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
