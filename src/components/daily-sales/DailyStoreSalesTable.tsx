/**
 * 日別×店舗テーブル
 * 行=日付(1日〜月末)、列=店舗
 * メトリクス切替: 売上/客数/客単価
 * YoY表示（前年同日比）
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDailySalesSummary } from '@/hooks/useDailySales'
import { cn } from '@/lib/utils'
import type { DailySalesMetric, DailyStoreSalesData } from '@/types/daily-sales'

interface Props {
  month: string
  departmentSlug?: string
}

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

function getYoYRate(
  entry: DailyStoreSalesData | undefined,
  metric: DailySalesMetric,
): number | null {
  if (!entry) return null
  if (metric === 'sales') return entry.yoy_sales_rate
  if (metric === 'customers') return entry.yoy_customers_rate
  // 客単価のYoYは売上YoYと客数YoYから推計しない（データにない）
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
  const { data, loading, error } = useDailySalesSummary(month, departmentSlug)

  // データをルックアップテーブル化: { `${date}-${segment_id}`: entry }
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

  const currentMetricOption = METRIC_OPTIONS.find(m => m.value === metric)!

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

  // 日付のフォーマット (YYYY-MM-DD → M/D(曜))
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00')
    const m = d.getMonth() + 1
    const day = d.getDate()
    const dow = dayNames[d.getDay()]
    return `${m}/${day}(${dow})`
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
        <div className="flex items-center justify-between">
          <CardTitle>日別×店舗</CardTitle>
          <div className="flex gap-1">
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
              <tr>
                <th className="sticky left-0 z-20 bg-gray-100 px-2 py-1.5 text-left font-medium border-b border-r min-w-[70px]">
                  日付
                </th>
                {data.stores.map(store => (
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
                  {data.stores.map(store => {
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
                {data.stores.map(store => {
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
