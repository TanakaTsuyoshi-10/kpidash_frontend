/**
 * 経営指標カード
 * 原価率、人件費率、客数、客単価を表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPercent, formatNumber, formatCurrency } from '@/lib/format'
import type { ManagementIndicators, MetricWithComparison } from '@/types/dashboard'

interface Props {
  indicators: ManagementIndicators | null
  loading?: boolean
}

interface IndicatorCardProps {
  title: string
  metric: MetricWithComparison
  type: 'rate' | 'count' | 'currency'
  invertColor?: boolean // 上昇が悪い指標（原価率など）
}

function IndicatorCard({ title, metric, type, invertColor = false }: IndicatorCardProps) {
  const yoyDiff = metric.yoy_diff
  const isPositive = yoyDiff !== null && yoyDiff > 0
  const isNegative = yoyDiff !== null && yoyDiff < 0

  // アイコン
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  // 色の決定（invertColorで反転）
  let color = 'text-gray-500'
  if (isPositive) {
    color = invertColor ? 'text-red-600' : 'text-green-600'
  } else if (isNegative) {
    color = invertColor ? 'text-green-600' : 'text-red-600'
  }

  // 値のフォーマット
  const formatValue = () => {
    if (metric.value === null) return '-'
    switch (type) {
      case 'rate':
        return formatPercent(metric.value)
      case 'count':
        return formatNumber(metric.value, '人')
      case 'currency':
        return formatCurrency(metric.value)
      default:
        return formatNumber(metric.value)
    }
  }

  // 差分のフォーマット
  const formatDiff = () => {
    if (yoyDiff === null) return '-'
    const sign = yoyDiff > 0 ? '+' : yoyDiff < 0 ? '▲' : ''
    const absValue = Math.abs(yoyDiff)

    switch (type) {
      case 'rate':
        return `${sign}${absValue.toFixed(1)}pt`
      case 'count':
        return `${sign}${absValue.toLocaleString()}人`
      case 'currency':
        return `${sign}¥${absValue.toLocaleString()}`
      default:
        return `${sign}${absValue}`
    }
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
          {formatValue()}
        </div>

        {/* 前年差 */}
        <div className={cn('mt-2 flex items-center gap-1 text-sm', color)}>
          <Icon className="h-4 w-4" />
          <span>前年 {formatDiff()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function ManagementIndicatorsCard({ indicators, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-16" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!indicators) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['原価率', '人件費率', '客数', '客単価'].map((title) => (
          <Card key={title} className="opacity-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {title}
              </CardTitle>
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <IndicatorCard
        title="原価率"
        metric={indicators.cost_rate}
        type="rate"
        invertColor // 原価率は下がる方が良い
      />
      <IndicatorCard
        title="人件費率"
        metric={indicators.labor_cost_rate}
        type="rate"
        invertColor // 人件費率は下がる方が良い
      />
      <IndicatorCard
        title="客数"
        metric={indicators.customer_count}
        type="count"
      />
      <IndicatorCard
        title="客単価"
        metric={indicators.customer_unit_price}
        type="currency"
      />
    </div>
  )
}
