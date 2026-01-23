/**
 * 経営サマリーカード
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MetricWithComparison } from '@/types/dashboard'

interface Props {
  title: string
  metric: MetricWithComparison
  unit?: string
  isPercentage?: boolean
}

export function ExecutiveSummaryCard({ title, metric, unit = '円', isPercentage = false }: Props) {
  const yoyRate = metric.yoy_rate ?? 0
  const achievementRate = metric.achievement_rate ?? 0

  // 前年比のアイコンと色
  const YoYIcon = yoyRate > 0 ? TrendingUp : yoyRate < 0 ? TrendingDown : Minus
  const yoyColor = yoyRate > 0 ? 'text-green-600' : yoyRate < 0 ? 'text-red-600' : 'text-gray-600'

  // 達成率の色
  const achievementColor =
    achievementRate >= 100 ? 'text-green-600' :
    achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'

  // 数値フォーマット
  const formatValue = (value: number | null) => {
    if (value === null) return '-'
    if (isPercentage) {
      return value.toFixed(1) + '%'
    }
    // 万円単位で表示
    if (Math.abs(value) >= 10000) {
      return (value / 10000).toLocaleString(undefined, { maximumFractionDigits: 0 }) + '万' + unit
    }
    return value.toLocaleString() + unit
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 実績値 */}
        <div className="text-2xl font-bold">
          {formatValue(metric.value)}
        </div>

        {/* 達成率・前年比 */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500">達成率</div>
            <div className={cn("font-medium", achievementColor)}>
              {achievementRate ? `${achievementRate.toFixed(1)}%` : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500">前年比</div>
            <div className={cn("font-medium flex items-center gap-1", yoyColor)}>
              <YoYIcon className="h-4 w-4" />
              {yoyRate != null ? `${yoyRate > 0 ? '+' : ''}${yoyRate.toFixed(1)}%` : '-'}
            </div>
          </div>
        </div>

        {/* 前年実績 */}
        <div className="mt-2 pt-2 border-t text-sm text-gray-500">
          前年: {formatValue(metric.previous_year)}
        </div>
      </CardContent>
    </Card>
  )
}
