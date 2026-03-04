/**
 * 時間帯別ヒートマップ
 * 行=店舗、列=営業時間(9時〜19時)
 * セル色: 売上金額に応じてwhite→emerald-600
 * ホバー時ツールチップ、行計・列計表示
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useHourlySales } from '@/hooks/useDailySales'
import { cn } from '@/lib/utils'

interface Props {
  month: string
  dates: string[]
  departmentSlug?: string
}

function formatCurrency(value: number): string {
  if (!value) return '-'
  return `¥${Math.round(value).toLocaleString()}`
}

// 値を0〜1にスケーリングして背景色クラスを返す
function getHeatColor(value: number, maxValue: number): string {
  if (!value || !maxValue) return 'bg-white'
  const ratio = value / maxValue
  if (ratio < 0.1) return 'bg-emerald-50'
  if (ratio < 0.2) return 'bg-emerald-100'
  if (ratio < 0.35) return 'bg-emerald-200'
  if (ratio < 0.5) return 'bg-emerald-300'
  if (ratio < 0.65) return 'bg-emerald-400 text-white'
  if (ratio < 0.8) return 'bg-emerald-500 text-white'
  return 'bg-emerald-600 text-white'
}

export function HourlyHeatmap({ month, dates, departmentSlug = 'store' }: Props) {
  // 初期日付: 月の最初の日
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || '')
  const { data, loading, error } = useHourlySales(selectedDate, departmentSlug)

  // ツールチップ状態
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; sales: number; customers: number; store: string; hour: number
  } | null>(null)

  // データルックアップ: { `${hour}-${segment_id}`: { sales, customers } }
  const dataLookup = useMemo(() => {
    if (!data?.data) return new Map<string, { sales: number; customers: number }>()
    const map = new Map<string, { sales: number; customers: number }>()
    for (const entry of data.data) {
      map.set(`${entry.hour}-${entry.segment_id}`, {
        sales: entry.sales,
        customers: entry.customers,
      })
    }
    return map
  }, [data?.data])

  // 最大値（ヒートマップスケーリング用）
  const maxSales = useMemo(() => {
    if (!data?.data) return 0
    return Math.max(...data.data.map(d => d.sales), 0)
  }, [data?.data])

  // 行計ルックアップ
  const rowTotals = useMemo(() => {
    if (!data?.row_totals) return new Map<string, { sales: number; customers: number }>()
    const map = new Map<string, { sales: number; customers: number }>()
    for (const entry of data.row_totals) {
      if (entry.segment_id) {
        map.set(entry.segment_id, { sales: entry.sales, customers: entry.customers })
      }
    }
    return map
  }, [data?.row_totals])

  // 列計ルックアップ
  const colTotals = useMemo(() => {
    if (!data?.col_totals) return new Map<number, { sales: number; customers: number }>()
    const map = new Map<number, { sales: number; customers: number }>()
    for (const entry of data.col_totals) {
      if (entry.hour != null) {
        map.set(entry.hour, { sales: entry.sales, customers: entry.customers })
      }
    }
    return map
  }, [data?.col_totals])

  // 日付フォーマット
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  function formatDateButton(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    return `${d.getDate()}日(${dayNames[d.getDay()]})`
  }

  function getDowClass(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    const dow = d.getDay()
    if (dow === 0) return 'text-red-600 border-red-200'
    if (dow === 6) return 'text-blue-600 border-blue-200'
    return ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>時間帯別ヒートマップ</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 日付セレクタ */}
        <div className="flex flex-wrap gap-1 mb-4">
          {dates.map(dateStr => (
            <Button
              key={dateStr}
              variant={selectedDate === dateStr ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'text-xs px-2 py-1 h-7',
                selectedDate === dateStr && 'bg-emerald-600 hover:bg-emerald-700',
                selectedDate !== dateStr && getDowClass(dateStr),
              )}
              onClick={() => setSelectedDate(dateStr)}
            >
              {formatDateButton(dateStr)}
            </Button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            読み込み中...
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {data && data.stores.length > 0 && !loading && (
          <div className="overflow-x-auto relative" onMouseLeave={() => setTooltip(null)}>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-100 px-2 py-1.5 text-left font-medium border-b border-r min-w-[80px]">
                    店舗
                  </th>
                  {data.hours.map(hour => (
                    <th
                      key={hour}
                      className="px-1.5 py-1.5 text-center font-medium border-b bg-gray-50 min-w-[55px]"
                    >
                      {hour}時
                    </th>
                  ))}
                  <th className="px-2 py-1.5 text-center font-medium border-b border-l bg-gray-100 min-w-[70px]">
                    合計
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.stores.map(store => {
                  const rowTotal = rowTotals.get(store.segment_id)
                  return (
                    <tr key={store.segment_id} className="hover:bg-gray-50/30">
                      <td className="sticky left-0 z-10 bg-white px-2 py-1 font-medium border-b border-r whitespace-nowrap">
                        {store.segment_name}
                      </td>
                      {data.hours.map(hour => {
                        const cell = dataLookup.get(`${hour}-${store.segment_id}`)
                        const sales = cell?.sales || 0
                        const customers = cell?.customers || 0

                        return (
                          <td
                            key={hour}
                            className={cn(
                              'px-1.5 py-1 text-right border-b cursor-default tabular-nums transition-colors',
                              getHeatColor(sales, maxSales),
                            )}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setTooltip({
                                x: rect.left + rect.width / 2,
                                y: rect.top - 8,
                                sales,
                                customers,
                                store: store.segment_name,
                                hour,
                              })
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {sales > 0 ? formatCurrency(sales) : '-'}
                          </td>
                        )
                      })}
                      <td className="px-2 py-1 text-right border-b border-l font-medium bg-gray-50 tabular-nums">
                        {rowTotal ? formatCurrency(rowTotal.sales) : '-'}
                      </td>
                    </tr>
                  )
                })}
                {/* 列計行 */}
                <tr className="font-bold bg-gray-100">
                  <td className="sticky left-0 z-10 bg-gray-100 px-2 py-1.5 border-t-2 border-r">
                    合計
                  </td>
                  {data.hours.map(hour => {
                    const colTotal = colTotals.get(hour)
                    return (
                      <td key={hour} className="px-1.5 py-1.5 text-right border-t-2 tabular-nums">
                        {colTotal ? formatCurrency(colTotal.sales) : '-'}
                      </td>
                    )
                  })}
                  <td className="px-2 py-1.5 text-right border-t-2 border-l tabular-nums">
                    {formatCurrency(
                      Array.from(colTotals.values()).reduce((s, v) => s + v.sales, 0)
                    )}
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
                <div className="font-medium">{tooltip.store} - {tooltip.hour}時台</div>
                <div>売上: {formatCurrency(tooltip.sales)}</div>
                <div>客数: {tooltip.customers}人</div>
              </div>
            )}
          </div>
        )}

        {data && data.stores.length === 0 && !loading && (
          <div className="text-muted-foreground text-sm">
            この日のデータがありません。
          </div>
        )}
      </CardContent>
    </Card>
  )
}
