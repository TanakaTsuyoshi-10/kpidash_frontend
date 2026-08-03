/**
 * 店舗の時間帯別来客ヒートマップ（店舗詳細ページ用）
 * 行=日付（日次）、列=時間帯、右端=日計、最終行=時間帯別合計
 * セル色: 来客数に応じて white→sky-600
 */
'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { useStoreHourlyCustomers } from '@/hooks/useDailySales'
import { getJapaneseHoliday } from '@/lib/japanese-holidays'
import { cn } from '@/lib/utils'

interface Props {
  segmentId: string
  month: string
  displayMonth: string
}

// 値を0〜1にスケーリングして背景色クラスを返す（客数用: 青系）
function getHeatColor(value: number, maxValue: number): string {
  if (!value || !maxValue) return 'bg-white'
  const ratio = value / maxValue
  if (ratio < 0.1) return 'bg-sky-50'
  if (ratio < 0.2) return 'bg-sky-100'
  if (ratio < 0.35) return 'bg-sky-200'
  if (ratio < 0.5) return 'bg-sky-300'
  if (ratio < 0.65) return 'bg-sky-400 text-white'
  if (ratio < 0.8) return 'bg-sky-500 text-white'
  return 'bg-sky-600 text-white'
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()}日(${DAY_NAMES[d.getDay()]})`
}

// 日付ラベルの色: 日曜・祝日=赤、土曜=青
function getDateLabelClass(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (d.getDay() === 0 || getJapaneseHoliday(dateStr)) return 'text-red-600'
  if (d.getDay() === 6) return 'text-blue-600'
  return ''
}

export function StoreHourlyCustomersHeatmap({ segmentId, month, displayMonth }: Props) {
  const { data, loading, error } = useStoreHourlyCustomers(month, segmentId)

  const [tooltip, setTooltip] = useState<{
    x: number; y: number; customers: number; date: string; hour: number
  } | null>(null)

  // (date, hour) → customers
  const cellLookup = useMemo(() => {
    const map = new Map<string, number>()
    for (const cell of data?.data ?? []) {
      map.set(`${cell.date}-${cell.hour}`, cell.customers)
    }
    return map
  }, [data?.data])

  const rowTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of data?.row_totals ?? []) map.set(t.date, t.customers)
    return map
  }, [data?.row_totals])

  const colTotals = useMemo(() => {
    const map = new Map<number, number>()
    for (const t of data?.col_totals ?? []) map.set(t.hour, t.customers)
    return map
  }, [data?.col_totals])

  const maxCustomers = useMemo(() => {
    if (!data?.data?.length) return 0
    return Math.max(...data.data.map((c) => c.customers))
  }, [data?.data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="p-1.5 rounded-md bg-sky-100">
            <Users className="h-4 w-4 text-sky-700" />
          </span>
          時間帯別来客ヒートマップ ({displayMonth})
          {data && (
            <span className="ml-auto text-sm font-normal text-gray-500 tabular-nums">
              月間合計 <span className="font-bold text-gray-900">{data.total.toLocaleString()}人</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            読み込み中...
          </div>
        )}

        {error && <div className="text-red-600 text-sm">{error}</div>}

        {data && data.hours.length > 0 && !loading && (
          <div className="overflow-x-auto relative" onMouseLeave={() => setTooltip(null)}>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-100 px-2 py-1.5 text-left font-medium border-b border-r min-w-[80px]">
                    日付
                  </th>
                  {data.hours.map((hour) => (
                    <th
                      key={hour}
                      className="px-1.5 py-1.5 text-center font-medium border-b bg-gray-50 min-w-[48px]"
                    >
                      {hour}時
                    </th>
                  ))}
                  <th className="px-2 py-1.5 text-center font-medium border-b border-l bg-gray-100 min-w-[60px]">
                    日計
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.dates.map((dateStr) => {
                  const rowTotal = rowTotals.get(dateStr) ?? 0
                  return (
                    <tr key={dateStr} className="hover:bg-gray-50/30">
                      <td
                        className={cn(
                          'sticky left-0 z-10 bg-white px-2 py-1 font-medium border-b border-r whitespace-nowrap',
                          getDateLabelClass(dateStr),
                        )}
                      >
                        {formatDateLabel(dateStr)}
                      </td>
                      {data.hours.map((hour) => {
                        const customers = cellLookup.get(`${dateStr}-${hour}`) ?? 0
                        return (
                          <td
                            key={hour}
                            className={cn(
                              'px-1.5 py-1 text-right border-b cursor-default tabular-nums transition-colors',
                              getHeatColor(customers, maxCustomers),
                            )}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltip({
                                x: rect.left + rect.width / 2,
                                y: rect.top - 8,
                                customers,
                                date: dateStr,
                                hour,
                              })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {customers > 0 ? customers.toLocaleString() : '-'}
                          </td>
                        )
                      })}
                      <td className="px-2 py-1 text-right border-b border-l font-medium bg-gray-50 tabular-nums">
                        {rowTotal > 0 ? rowTotal.toLocaleString() : '-'}
                      </td>
                    </tr>
                  )
                })}
                {/* 合計行 */}
                <tr className="font-bold bg-gray-100">
                  <td className="sticky left-0 z-10 bg-gray-100 px-2 py-1.5 border-t-2 border-r">
                    合計
                  </td>
                  {data.hours.map((hour) => (
                    <td key={hour} className="px-1.5 py-1.5 text-right border-t-2 tabular-nums">
                      {(colTotals.get(hour) ?? 0).toLocaleString()}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right border-t-2 border-l tabular-nums">
                    {data.total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ツールチップ */}
            {tooltip && (
              <div
                className="fixed z-50 pointer-events-none bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="font-medium">
                  {formatDateLabel(tooltip.date)} {tooltip.hour}時台
                </div>
                <div>来客: {tooltip.customers.toLocaleString()}人</div>
              </div>
            )}
          </div>
        )}

        {data && data.hours.length === 0 && !loading && (
          <div className="text-muted-foreground text-sm">この月のデータがありません。</div>
        )}
      </CardContent>
    </Card>
  )
}
