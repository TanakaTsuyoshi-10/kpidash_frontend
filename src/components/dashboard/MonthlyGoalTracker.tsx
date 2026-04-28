/**
 * 当月目標進捗バー
 * ペース判定（前倒し/予定通り/遅れ）
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import type { StoreSummaryTotals } from '@/hooks/useStoreSummary'

interface Props {
  totals: StoreSummaryTotals | null
  loading?: boolean
}

export function MonthlyGoalTracker({ totals, loading }: Props) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </CardContent>
      </Card>
    )
  }

  if (!totals || totals.sales === null) return null

  // 日数進捗率を計算
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const elapsedDays = today.getDate()
  const progressRate = (elapsedDays / totalDays) * 100

  // 前年対比をペースの代替指標として使用
  const salesYoy = totals.sales_yoy
  const isPaceGood = salesYoy !== null && salesYoy >= 100
  const isPaceBehind = salesYoy !== null && salesYoy < 95

  const paceLabel = isPaceGood ? '好調' : isPaceBehind ? '遅れ' : '予定通り'
  const paceColor = isPaceGood ? 'text-green-600' : isPaceBehind ? 'text-red-600' : 'text-yellow-600'
  const barColor = isPaceGood ? 'bg-green-500' : isPaceBehind ? 'bg-red-400' : 'bg-yellow-400'

  // 売上の前年比をバーの幅として使用
  const barWidth = salesYoy ? Math.min(salesYoy, 150) / 1.5 : 50

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">当月進捗</span>
          </div>
          <span className={cn('text-sm font-bold', paceColor)}>{paceLabel}</span>
        </div>

        {/* 進捗バー */}
        <div className="relative w-full bg-gray-100 rounded-full h-3 mb-2">
          <div
            className={cn('h-3 rounded-full transition-all', barColor)}
            style={{ width: `${Math.min(barWidth, 100)}%` }}
          />
          {/* 日数進捗マーカー */}
          <div
            className="absolute top-0 h-3 w-0.5 bg-gray-800"
            style={{ left: `${Math.min(progressRate, 100)}%` }}
            title={`日数進捗: ${progressRate.toFixed(0)}%`}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            当月売上: {formatCurrency(totals.sales)}
          </span>
          <span>
            {elapsedDays}日経過 / {totalDays}日
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
