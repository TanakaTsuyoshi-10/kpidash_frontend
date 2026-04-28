/**
 * 店舗ランキングカード
 * 店舗ランキング + 前月比順位変動表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Medal, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { StoreSummaryItem } from '@/hooks/useStoreSummary'

interface Props {
  stores: StoreSummaryItem[]
  loading?: boolean
}

export function StoreRankingCard({ stores, loading }: Props) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-gray-200 rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stores || stores.length === 0) return null

  // 売上順にソート
  const ranked = [...stores]
    .filter(s => s.sales !== null && s.sales > 0)
    .sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0))

  // 前年の順位を算出
  const prevRanked = [...stores]
    .filter(s => s.sales_previous_year !== null && (s.sales_previous_year ?? 0) > 0)
    .sort((a, b) => (b.sales_previous_year ?? 0) - (a.sales_previous_year ?? 0))

  const prevRankMap = new Map<string, number>()
  prevRanked.forEach((s, i) => prevRankMap.set(s.segment_id, i + 1))

  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400']

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Medal className="h-4 w-4 text-yellow-500" />
          店舗ランキング
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {ranked.map((store, index) => {
            const currentRank = index + 1
            const prevRank = prevRankMap.get(store.segment_id) ?? null
            const rankDiff = prevRank !== null ? prevRank - currentRank : null

            return (
              <div
                key={store.segment_id}
                className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
              >
                {/* 順位 */}
                <span className={cn(
                  'text-sm font-bold w-5 text-center',
                  index < 3 ? medalColors[index] : 'text-gray-400'
                )}>
                  {currentRank}
                </span>

                {/* 順位変動 */}
                <div className="w-5 flex justify-center">
                  {rankDiff !== null && rankDiff > 0 && (
                    <ArrowUp className="h-3 w-3 text-green-500" />
                  )}
                  {rankDiff !== null && rankDiff < 0 && (
                    <ArrowDown className="h-3 w-3 text-red-500" />
                  )}
                  {(rankDiff === null || rankDiff === 0) && (
                    <Minus className="h-3 w-3 text-gray-300" />
                  )}
                </div>

                {/* 店舗名 */}
                <span className="text-sm flex-1 truncate">{store.segment_name}</span>

                {/* 売上 */}
                <span className="text-sm font-medium">{formatCurrency(store.sales)}</span>

                {/* 前年比 */}
                <span className={cn(
                  'text-xs w-14 text-right',
                  store.sales_yoy !== null && store.sales_yoy >= 100 ? 'text-green-600' : 'text-red-600'
                )}>
                  {store.sales_yoy !== null
                    ? `${store.sales_yoy >= 100 ? '+' : ''}${(store.sales_yoy - 100).toFixed(1)}%`
                    : '-'
                  }
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
