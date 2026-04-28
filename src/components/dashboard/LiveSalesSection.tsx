/**
 * 当月売上 & 店舗ランキングセクション
 * 左: 当月累計 vs 前年（バー比較）
 * 右: 店舗ランキングTOP5（横棒グラフ、YoY色分け）
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { StoreSummaryResponse, StoreSummaryItem } from '@/hooks/useStoreSummary'

interface Props {
  storeData: StoreSummaryResponse | null
  loading?: boolean
}

function YoYBadge({ yoy }: { yoy: number | null }) {
  if (yoy === null) return <span className="text-xs text-gray-400">-</span>

  const isPositive = yoy > 0
  const isNegative = yoy < 0
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
  const sign = isPositive ? '+' : ''

  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-medium', color)}>
      <Icon className="h-3 w-3" />
      {sign}{yoy.toFixed(1)}%
    </span>
  )
}

export function LiveSalesSection({ storeData, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-5 bg-gray-200 rounded w-32" />
          </CardHeader>
          <CardContent>
            <div className="h-20 bg-gray-200 rounded" />
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-5 bg-gray-200 rounded w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!storeData) return null

  const { totals, stores } = storeData

  // 店舗ランキングTOP5（売上高降順）
  const rankedStores = [...stores]
    .filter(s => s.sales !== null && s.sales > 0)
    .sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0))
    .slice(0, 5)

  const maxSales = rankedStores[0]?.sales ?? 1

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 左: 当月累計 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Store className="h-4 w-4 text-green-600" />
            当月累計売上
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 今月 */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-gray-600">今月</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(totals.sales)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{
                    width: totals.sales && totals.sales_previous_year
                      ? `${Math.min((totals.sales / Math.max(totals.sales, totals.sales_previous_year)) * 100, 100)}%`
                      : '100%',
                  }}
                />
              </div>
            </div>

            {/* 前年 */}
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-gray-400">前年</span>
                <span className="text-lg text-gray-500">
                  {formatCurrency(totals.sales_previous_year)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-gray-300 h-3 rounded-full transition-all"
                  style={{
                    width: totals.sales && totals.sales_previous_year
                      ? `${Math.min((totals.sales_previous_year / Math.max(totals.sales, totals.sales_previous_year)) * 100, 100)}%`
                      : '100%',
                  }}
                />
              </div>
            </div>

            {/* 前年比 */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <span className="text-sm text-gray-500">前年比</span>
              <YoYBadge yoy={totals.sales_yoy ? totals.sales_yoy - 100 : null} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 右: 店舗ランキングTOP5 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            店舗ランキング TOP5
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rankedStores.length === 0 ? (
            <div className="text-sm text-gray-400 text-center py-4">データなし</div>
          ) : (
            <div className="space-y-3">
              {rankedStores.map((store, index) => (
                <StoreRankRow
                  key={store.segment_id}
                  rank={index + 1}
                  store={store}
                  maxSales={maxSales}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StoreRankRow({
  rank,
  store,
  maxSales,
}: {
  rank: number
  store: StoreSummaryItem
  maxSales: number
}) {
  const barWidth = store.sales ? (store.sales / maxSales) * 100 : 0
  const yoy = store.sales_yoy ? store.sales_yoy - 100 : null
  const barColor = yoy !== null && yoy >= 0 ? 'bg-green-400' : 'bg-orange-400'

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold text-gray-400 w-5 text-right">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-medium truncate">{store.segment_name}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium">{formatCurrency(store.sales)}</span>
            <YoYBadge yoy={yoy} />
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={cn('h-1.5 rounded-full transition-all', barColor)}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  )
}
