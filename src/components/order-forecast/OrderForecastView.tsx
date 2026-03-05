/**
 * 予想注文メインコンポーネント
 *
 * 本日の予想バット数、店舗別内訳、前年/前々年カレンダーを表示する。
 */
'use client'

import { useState } from 'react'
import { useOrderForecast } from '@/hooks/useOrderForecast'
import { BatCalendar } from './BatCalendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorMessage } from '@/components/common/ErrorMessage'

interface OrderForecastViewProps {
  targetDate: string
  departmentSlug?: string
}

/** 曜日名→曜日インデックス(月=0〜日=6) */
const WEEKDAY_TO_INDEX: Record<string, number> = {
  '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5, '日': 6,
}

export function OrderForecastView({ targetDate, departmentSlug = 'store' }: OrderForecastViewProps) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('all')
  const { data, loading, error } = useOrderForecast(targetDate, undefined, departmentSlug)

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  if (!data) {
    return <ErrorMessage message="データがありません" />
  }

  const { forecast, previous_year, two_years_ago, target_weekday } = data
  const highlightWeekday = WEEKDAY_TO_INDEX[target_weekday]

  // 店舗フィルタ: segment_id or 全店舗
  const segmentFilter = selectedSegmentId === 'all' ? undefined : selectedSegmentId

  // 表示するforecast情報
  const displayBats = segmentFilter
    ? forecast.by_store.find(s => s.segment_id === segmentFilter)
    : null

  const totalBats = displayBats ? displayBats.bats : forecast.total_bats

  // 参照日情報（日付・曜日用）
  const prevYearRef = forecast.reference_dates.find(r => r.year === previous_year.year)
  const twoYrRef = forecast.reference_dates.find(r => r.year === two_years_ago.year)

  // 店舗選択時は該当店舗のバット数、全店舗時は合計を使う
  const prevYearBats = displayBats ? displayBats.prev_year_bats : (prevYearRef?.bats ?? 0)
  const twoYrBats = displayBats ? (displayBats.two_years_ago_bats ?? 0) : (twoYrRef?.bats ?? 0)

  // 日付フォーマット（YYYY-MM-DD → M/D）
  const formatShortDate = (dateStr: string) => {
    const parts = dateStr.split('-')
    return `${parseInt(parts[1])}/${parseInt(parts[2])}`
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー: タイトル + 店舗セレクタ */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">予想注文</h2>
        <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="全店舗合計" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全店舗合計</SelectItem>
            {data.stores.map(store => (
              <SelectItem key={store.segment_id} value={store.segment_id}>
                {store.segment_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 予想バット数カード */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            本日: {parseInt(targetDate.split('-')[1])}月{parseInt(targetDate.split('-')[2])}日({target_weekday})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* メイン予測値 */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {totalBats % 1 === 0 ? totalBats.toFixed(0) : totalBats.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">バット（前年参考値）</span>
            </div>

            {/* 参照日情報 */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              {prevYearRef && (
                <span>
                  前年({formatShortDate(prevYearRef.date)}{prevYearRef.weekday}):
                  <span className="font-medium text-foreground ml-1">
                    {prevYearBats % 1 === 0 ? prevYearBats.toFixed(0) : prevYearBats.toFixed(1)}
                  </span>
                </span>
              )}
              {twoYrRef && (
                <span>
                  前々年({formatShortDate(twoYrRef.date)}{twoYrRef.weekday}):
                  <span className="font-medium text-foreground ml-1">
                    {twoYrBats % 1 === 0 ? twoYrBats.toFixed(0) : twoYrBats.toFixed(1)}
                  </span>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 店舗別内訳テーブル（全店舗表示時のみ） */}
      {!segmentFilter && forecast.by_store.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">店舗別内訳</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4 font-medium">店舗名</th>
                    <th className="text-right py-2 px-3 font-medium">予想</th>
                    <th className="text-right py-2 px-3 font-medium">前年</th>
                    <th className="text-right py-2 px-3 font-medium">前々年</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.by_store.map(store => (
                    <tr key={store.segment_id} className="border-b border-border/50">
                      <td className="py-2 pr-4">{store.segment_name}</td>
                      <td className="text-right py-2 px-3 font-semibold">
                        {store.bats > 0
                          ? (store.bats % 1 === 0 ? store.bats.toFixed(0) : store.bats.toFixed(1))
                          : '-'}
                      </td>
                      <td className="text-right py-2 px-3 text-muted-foreground">
                        {store.prev_year_bats > 0
                          ? (store.prev_year_bats % 1 === 0 ? store.prev_year_bats.toFixed(0) : store.prev_year_bats.toFixed(1))
                          : '-'}
                      </td>
                      <td className="text-right py-2 px-3 text-muted-foreground">
                        {store.two_years_ago_bats != null && store.two_years_ago_bats > 0
                          ? (store.two_years_ago_bats % 1 === 0 ? store.two_years_ago_bats.toFixed(0) : store.two_years_ago_bats.toFixed(1))
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* 合計行 */}
                  <tr className="font-semibold">
                    <td className="py-2 pr-4">合計</td>
                    <td className="text-right py-2 px-3">
                      {forecast.total_bats % 1 === 0 ? forecast.total_bats.toFixed(0) : forecast.total_bats.toFixed(1)}
                    </td>
                    <td className="text-right py-2 px-3 text-muted-foreground">
                      {prevYearRef
                        ? (prevYearRef.bats % 1 === 0 ? prevYearRef.bats.toFixed(0) : prevYearRef.bats.toFixed(1))
                        : '-'}
                    </td>
                    <td className="text-right py-2 px-3 text-muted-foreground">
                      {twoYrRef
                        ? (twoYrRef.bats % 1 === 0 ? twoYrRef.bats.toFixed(0) : twoYrRef.bats.toFixed(1))
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 前年・前々年カレンダー */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <BatCalendar
              calendarData={previous_year}
              highlightWeekday={highlightWeekday}
              segmentId={segmentFilter}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <BatCalendar
              calendarData={two_years_ago}
              highlightWeekday={highlightWeekday}
              segmentId={segmentFilter}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
