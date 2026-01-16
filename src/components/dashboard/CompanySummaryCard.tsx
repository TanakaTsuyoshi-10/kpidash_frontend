/**
 * 全社サマリーカード
 * 売上高、粗利益、粗利率、営業利益の4指標を表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent, formatYoY, formatAchievementRate } from '@/lib/format'
import type { CompanySummary, MetricWithComparison } from '@/types/dashboard'

interface Props {
  summary: CompanySummary | null
  loading?: boolean
}

interface MetricCardProps {
  title: string
  metric: MetricWithComparison
  isRate?: boolean
}

function MetricCard({ title, metric, isRate = false }: MetricCardProps) {
  const yoy = formatYoY(metric.yoy_rate)
  const achievement = formatAchievementRate(metric.achievement_rate)

  // 前年比のアイコン
  const YoYIcon = yoy.isPositive === true ? TrendingUp :
                  yoy.isPositive === false ? TrendingDown : Minus

  // 前年比の色
  const yoyColor = yoy.isPositive === true ? 'text-green-600' :
                   yoy.isPositive === false ? 'text-red-600' : 'text-gray-500'

  // 達成率の色
  const achievementColor =
    achievement.status === 'good' ? 'text-green-600' :
    achievement.status === 'warning' ? 'text-yellow-600' :
    achievement.status === 'critical' ? 'text-red-600' : 'text-gray-500'

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
          {isRate
            ? formatPercent(metric.value)
            : formatCurrency(metric.value, false)}
        </div>

        {/* 前年比・達成率 */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className={cn('flex items-center gap-1', yoyColor)}>
            <YoYIcon className="h-4 w-4" />
            <span>前年比 {yoy.text}</span>
          </div>
          {!isRate && metric.achievement_rate !== null && (
            <div className={achievementColor}>
              予算比 {achievement.text}
            </div>
          )}
        </div>

        {/* 前年実績 */}
        <div className="mt-2 pt-2 border-t text-xs text-gray-500">
          前年: {isRate
            ? formatPercent(metric.previous_year)
            : formatCurrency(metric.previous_year, false)}
        </div>
      </CardContent>
    </Card>
  )
}

export function CompanySummaryCard({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-20" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="opacity-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">-</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="全社売上高" metric={summary.sales_total} />
      <MetricCard title="粗利益" metric={summary.gross_profit} />
      <MetricCard title="粗利率" metric={summary.gross_profit_rate} isRate />
      <MetricCard title="営業利益" metric={summary.operating_profit} />
    </div>
  )
}
