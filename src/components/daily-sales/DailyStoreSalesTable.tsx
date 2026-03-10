/**
 * 日別×店舗テーブル
 * 行=日付(1日〜月末)、列=店舗
 * メトリクス切替: 売上/客数/客単価
 * YoY表示（前年同曜日比）
 * ソート機能: 月計の選択メトリクスで店舗列をソート
 * 順位表示: 月計の順位＋前年比順位変動
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDailySalesSummary } from '@/hooks/useDailySales'
import { cn } from '@/lib/utils'
import type { DailySalesMetric, DailyStoreSalesData, StoreInfo } from '@/types/daily-sales'

interface Props {
  month: string
  departmentSlug?: string
}

type SortDirection = 'desc' | 'asc'

const METRIC_OPTIONS: { value: DailySalesMetric; label: string; color: string }[] = [
  { value: 'sales', label: '売上', color: 'emerald' },
  { value: 'customers', label: '客数', color: 'blue' },
  { value: 'unit_price', label: '客単価', color: 'amber' },
]

function formatValue(value: number | null | undefined, metric: DailySalesMetric): string {
  if (value == null || value === 0) return '-'
  if (metric === 'sales' || metric === 'unit_price') {
    return `¥${Math.round(value).toLocaleString()}`
  }
  return value.toLocaleString()
}

function formatYoY(rate: number | null | undefined): string {
  if (rate == null) return ''
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

function getMetricValue(
  entry: DailyStoreSalesData | undefined,
  metric: DailySalesMetric,
): number {
  if (!entry) return 0
  if (metric === 'sales') return entry.sales
  if (metric === 'customers') return entry.customers
  return entry.unit_price
}

function getPreviousMetricValue(
  entry: DailyStoreSalesData | undefined,
  metric: DailySalesMetric,
): number {
  if (!entry) return 0
  if (metric === 'sales') return entry.sales_previous_year ?? 0
  if (metric === 'customers') return entry.customers_previous_year ?? 0
  if (entry.sales_previous_year && entry.customers_previous_year && entry.customers_previous_year > 0) {
    return Math.round(entry.sales_previous_year / entry.customers_previous_year)
  }
  return 0
}

function getYoYRate(
  entry: DailyStoreSalesData | undefined,
  metric: DailySalesMetric,
): number | null {
  if (!entry) return null
  if (metric === 'sales') return entry.yoy_sales_rate
  if (metric === 'customers') return entry.yoy_customers_rate
  if (metric === 'unit_price' && entry.sales_previous_year && entry.customers_previous_year) {
    const prevUnitPrice = entry.sales_previous_year / entry.customers_previous_year
    if (prevUnitPrice > 0) {
      return Math.round((entry.unit_price / prevUnitPrice - 1) * 1000) / 10
    }
  }
  return null
}

export function DailyStoreSalesTable({ month, departmentSlug = 'store' }: Props) {
  const [metric, setMetric] = useState<DailySalesMetric>('sales')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const { data, loading, error } = useDailySalesSummary(month, departmentSlug)

  // データをルックアップテーブル化
  const dataLookup = useMemo(() => {
    if (!data?.data) return new Map<string, DailyStoreSalesData>()
    const map = new Map<string, DailyStoreSalesData>()
    for (const entry of data.data) {
      map.set(`${entry.date}-${entry.segment_id}`, entry)
    }
    return map
  }, [data?.data])

  // 月計ルックアップ
  const totalsLookup = useMemo(() => {
    if (!data?.totals) return new Map<string, DailyStoreSalesData>()
    const map = new Map<string, DailyStoreSalesData>()
    for (const entry of data.totals) {
      map.set(entry.segment_id, entry)
    }
    return map
  }, [data?.totals])

  // 店舗をソート（月計の選択メトリクス順）
  const sortedStores = useMemo(() => {
    if (!data?.stores) return []
    const stores = [...data.stores]
    stores.sort((a, b) => {
      const aEntry = totalsLookup.get(a.segment_id)
      const bEntry = totalsLookup.get(b.segment_id)
      const aVal = getMetricValue(aEntry, metric)
      const bVal = getMetricValue(bEntry, metric)
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
    return stores
  }, [data?.stores, totalsLookup, metric, sortDir])

  // 当年順位: { segment_id: rank }
  const currentRanks = useMemo(() => {
    const map = new Map<string, number>()
    if (!data?.stores) return map
    const ranked = [...data.stores].sort((a, b) => {
      const aVal = getMetricValue(totalsLookup.get(a.segment_id), metric)
      const bVal = getMetricValue(totalsLookup.get(b.segment_id), metric)
      return bVal - aVal
    })
    ranked.forEach((s, i) => {
      const val = getMetricValue(totalsLookup.get(s.segment_id), metric)
      if (val > 0) map.set(s.segment_id, i + 1)
    })
    return map
  }, [data?.stores, totalsLookup, metric])

  // 前年順位: { segment_id: rank }
  const previousRanks = useMemo(() => {
    const map = new Map<string, number>()
    if (!data?.stores) return map
    const ranked = [...data.stores].sort((a, b) => {
      const aVal = getPreviousMetricValue(totalsLookup.get(a.segment_id), metric)
      const bVal = getPreviousMetricValue(totalsLookup.get(b.segment_id), metric)
      return bVal - aVal
    })
    ranked.forEach((s, i) => {
      const val = getPreviousMetricValue(totalsLookup.get(s.segment_id), metric)
      if (val > 0) map.set(s.segment_id, i + 1)
    })
    return map
  }, [data?.stores, totalsLookup, metric])

  // ソート切替
  const toggleSort = () => {
    setSortDir(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>日別×店舗</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            読み込み中...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>日別×店舗</CardTitle></CardHeader>
        <CardContent>
          <div className="text-red-600 text-sm">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.stores.length) {
    return (
      <Card>
        <CardHeader><CardTitle>日別×店舗</CardTitle></CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            データがありません。レシートジャーナルCSVをアップロードしてください。
          </div>
        </CardContent>
      </Card>
    )
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    return `${d.getMonth() + 1}/${d.getDate()}(${dayNames[d.getDay()]})`
  }

  function getDowClass(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    const dow = d.getDay()
    if (dow === 0) return 'text-red-600'
    if (dow === 6) return 'text-blue-600'
    return ''
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>日別×店舗</CardTitle>
          <div className="flex items-center gap-2">
            {/* ソートボタン */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSort}
              className="text-xs"
            >
              {sortDir === 'desc' ? '降順' : '昇順'}
              <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
            </Button>
            {/* メトリクス切替 */}
            {METRIC_OPTIONS.map(opt => (
              <Button
                key={opt.value}
                variant={metric === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMetric(opt.value)}
                className={cn(
                  'text-xs',
                  metric === opt.value && opt.color === 'emerald' && 'bg-emerald-600 hover:bg-emerald-700',
                  metric === opt.value && opt.color === 'blue' && 'bg-blue-600 hover:bg-blue-700',
                  metric === opt.value && opt.color === 'amber' && 'bg-amber-600 hover:bg-amber-700',
                )}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              {/* 順位行 */}
              <tr>
                <th className="sticky left-0 z-20 bg-gray-200 px-2 py-1 text-left font-medium border-b border-r text-[10px] text-gray-500 min-w-[70px]">
                  順位
                </th>
                {sortedStores.map(store => {
                  const rank = currentRanks.get(store.segment_id)
                  const prevRank = previousRanks.get(store.segment_id)
                  const rankChange = (rank != null && prevRank != null) ? prevRank - rank : null

                  return (
                    <th
                      key={store.segment_id}
                      className="px-2 py-1 text-center border-b bg-gray-100 min-w-[80px] whitespace-nowrap"
                    >
                      {rank != null && (
                        <div className="flex items-center justify-center gap-1">
                          <span className={cn(
                            'font-bold text-sm',
                            rank === 1 && 'text-amber-500',
                            rank === 2 && 'text-gray-400',
                            rank === 3 && 'text-amber-700',
                          )}>
                            {rank}
                          </span>
                          {rankChange != null && rankChange !== 0 && (
                            <span className={cn(
                              'text-[10px] font-medium',
                              rankChange > 0 ? 'text-green-600' : 'text-red-600',
                            )}>
                              {rankChange > 0 ? `+${rankChange}` : rankChange}
                            </span>
                          )}
                        </div>
                      )}
                    </th>
                  )
                })}
              </tr>
              {/* 店舗名行 */}
              <tr>
                <th className="sticky left-0 z-20 bg-gray-100 px-2 py-1.5 text-left font-medium border-b border-r min-w-[70px]">
                  日付
                </th>
                {sortedStores.map(store => (
                  <th
                    key={store.segment_id}
                    className="px-2 py-1.5 text-right font-medium border-b bg-gray-50 min-w-[80px] whitespace-nowrap"
                  >
                    {store.segment_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.dates.map(dateStr => (
                <tr key={dateStr} className="hover:bg-gray-50/50">
                  <td className={cn(
                    'sticky left-0 z-10 bg-white px-2 py-1 font-medium border-b border-r whitespace-nowrap',
                    getDowClass(dateStr),
                  )}>
                    {formatDate(dateStr)}
                  </td>
                  {sortedStores.map(store => {
                    const entry = dataLookup.get(`${dateStr}-${store.segment_id}`)
                    const value = getMetricValue(entry, metric)
                    const yoy = getYoYRate(entry, metric)

                    return (
                      <td
                        key={store.segment_id}
                        className="px-2 py-1 text-right border-b tabular-nums"
                      >
                        <div>{formatValue(value, metric)}</div>
                        {yoy != null && (
                          <div className={cn(
                            'text-[10px]',
                            yoy >= 0 ? 'text-green-600' : 'text-red-600',
                          )}>
                            {formatYoY(yoy)}
                          </div>
                        )}
                        {entry?.comparison_date && (
                          <div className="text-[9px] text-gray-400">
                            vs {new Date(entry.comparison_date + 'T00:00:00').getMonth() + 1}/{new Date(entry.comparison_date + 'T00:00:00').getDate()}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {/* 月計行 */}
              <tr className="font-bold bg-gray-100">
                <td className="sticky left-0 z-10 bg-gray-100 px-2 py-1.5 border-t-2 border-r">
                  月計
                </td>
                {sortedStores.map(store => {
                  const entry = totalsLookup.get(store.segment_id)
                  const value = getMetricValue(entry, metric)
                  const yoy = getYoYRate(entry, metric)

                  return (
                    <td
                      key={store.segment_id}
                      className="px-2 py-1.5 text-right border-t-2 tabular-nums"
                    >
                      <div>{formatValue(value, metric)}</div>
                      {yoy != null && (
                        <div className={cn(
                          'text-[10px] font-normal',
                          yoy >= 0 ? 'text-green-600' : 'text-red-600',
                        )}>
                          {formatYoY(yoy)}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
