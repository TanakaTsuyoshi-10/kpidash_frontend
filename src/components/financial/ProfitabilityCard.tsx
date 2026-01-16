/**
 * 収益性指標カード
 * 粗利率、営業利益率、原価率、人件費率を表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPercent } from '@/lib/format'
import type { ProfitabilityMetric } from '@/types/financial'

interface Props {
  metrics: ProfitabilityMetric[]
  loading?: boolean
}

interface MetricItemProps {
  metric: ProfitabilityMetric
}

// 文字列/数値をnumberに変換
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? null : num
}

function MetricItem({ metric }: MetricItemProps) {
  const diff = toNumber(metric.diff)
  const isPositive = diff !== null && diff > 0
  const isNegative = diff !== null && diff < 0

  // アイコン
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  // 色の決定（invert_colorで反転）
  let color = 'text-gray-500'
  if (isPositive) {
    color = metric.invert_color ? 'text-red-600' : 'text-green-600'
  } else if (isNegative) {
    color = metric.invert_color ? 'text-green-600' : 'text-red-600'
  }

  // 差分フォーマット
  const formatDiff = () => {
    if (diff === null) return '-'
    const sign = diff > 0 ? '+' : diff < 0 ? '▲' : ''
    return `${sign}${Math.abs(diff).toFixed(1)}pt`
  }

  return (
    <div className="text-center p-4">
      <div className="text-sm text-gray-600 mb-1">{metric.name}</div>
      <div className="text-2xl font-bold">
        {formatPercent(metric.value)}
      </div>
      <div className={cn('mt-1 flex items-center justify-center gap-1 text-sm', color)}>
        <Icon className="h-4 w-4" />
        <span>前年 {formatDiff()}</span>
      </div>
    </div>
  )
}

export function ProfitabilityCard({ metrics, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">収益性指標</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">収益性指標</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <MetricItem key={metric.name} metric={metric} />
          ))}
        </div>
        {metrics.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            データがありません
          </div>
        )}
      </CardContent>
    </Card>
  )
}
