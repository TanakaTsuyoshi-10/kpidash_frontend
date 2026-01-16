/**
 * 経営指標カード
 * 原価率、人件費率、店舗客数・客単価、通販客数・客単価を表示
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatPercent, formatNumber, formatCurrency } from '@/lib/format'
import type { ManagementIndicators, MetricWithComparison } from '@/types/dashboard'

// 店舗・通販の客数・客単価データ
export interface DepartmentCustomerData {
  customers: number | null
  customers_previous_year: number | null
  customers_yoy: number | null
  unit_price: number | null
  unit_price_previous_year: number | null
  unit_price_yoy: number | null
}

interface Props {
  indicators: ManagementIndicators | null
  storeData?: DepartmentCustomerData | null
  ecommerceData?: DepartmentCustomerData | null
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
        return formatCurrency(metric.value, false)
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
        return `${sign}${absValue.toLocaleString()}`
      default:
        return `${sign}${absValue}`
    }
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        {/* タイトル */}
        <div className="text-xs font-medium text-gray-500 whitespace-nowrap">
          {title}
        </div>

        {/* 実績値 */}
        <div className="text-xl font-bold mt-1 whitespace-nowrap">
          {formatValue()}
        </div>

        {/* 前年差 */}
        <div className={cn('mt-1 flex items-center gap-1 text-xs', color)}>
          <Icon className="h-3 w-3 flex-shrink-0" />
          <span className="whitespace-nowrap">前年 {formatDiff()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// シンプルなカード（部門別客数・客単価用）
interface SimpleCardProps {
  title: string
  value: number | null
  previousYear: number | null
  yoyRate: number | null
  type: 'count' | 'currency'
}

function SimpleCard({ title, value, yoyRate, type }: SimpleCardProps) {
  const isPositive = yoyRate !== null && yoyRate > 0
  const isNegative = yoyRate !== null && yoyRate < 0

  // アイコン
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus

  // 色の決定
  let color = 'text-gray-500'
  if (isPositive) {
    color = 'text-green-600'
  } else if (isNegative) {
    color = 'text-red-600'
  }

  // 値のフォーマット
  const formatValue = () => {
    if (value === null) return '-'
    if (type === 'count') {
      return formatNumber(value, '人')
    }
    return formatCurrency(value, false)
  }

  // 前年比のフォーマット
  const formatYoY = () => {
    if (yoyRate === null) return '-'
    const sign = yoyRate > 0 ? '+' : yoyRate < 0 ? '' : ''
    return `${sign}${yoyRate.toFixed(1)}%`
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        {/* タイトル */}
        <div className="text-xs font-medium text-gray-500 whitespace-nowrap">
          {title}
        </div>

        {/* 実績値 */}
        <div className="text-xl font-bold mt-1 whitespace-nowrap">
          {formatValue()}
        </div>

        {/* 前年比 */}
        <div className={cn('mt-1 flex items-center gap-1 text-xs', color)}>
          <Icon className="h-3 w-3 flex-shrink-0" />
          <span className="whitespace-nowrap">前年 {formatYoY()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// 空カード（データなし時）
function EmptyCard({ title }: { title: string }) {
  return (
    <Card className="h-full opacity-50">
      <CardContent className="p-4">
        <div className="text-xs font-medium text-gray-500 whitespace-nowrap">
          {title}
        </div>
        <div className="text-xl font-bold mt-1 text-gray-400">-</div>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
          <Minus className="h-3 w-3 flex-shrink-0" />
          <span>前年 -</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function ManagementIndicatorsCard({ indicators, storeData, ecommerceData, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* 1段目: 原価率、人件費率、店舗客数 */}
      {indicators?.cost_rate ? (
        <IndicatorCard
          title="原価率"
          metric={indicators.cost_rate}
          type="rate"
          invertColor
        />
      ) : (
        <EmptyCard title="原価率" />
      )}

      {indicators?.labor_cost_rate ? (
        <IndicatorCard
          title="人件費率"
          metric={indicators.labor_cost_rate}
          type="rate"
          invertColor
        />
      ) : (
        <EmptyCard title="人件費率" />
      )}

      <SimpleCard
        title="店舗客数"
        value={storeData?.customers ?? null}
        previousYear={storeData?.customers_previous_year ?? null}
        yoyRate={storeData?.customers_yoy ?? null}
        type="count"
      />

      {/* 2段目: 店舗客単価、通販客数、通販客単価 */}
      <SimpleCard
        title="店舗客単価"
        value={storeData?.unit_price ?? null}
        previousYear={storeData?.unit_price_previous_year ?? null}
        yoyRate={storeData?.unit_price_yoy ?? null}
        type="currency"
      />

      <SimpleCard
        title="通販客数"
        value={ecommerceData?.customers ?? null}
        previousYear={ecommerceData?.customers_previous_year ?? null}
        yoyRate={ecommerceData?.customers_yoy ?? null}
        type="count"
      />

      <SimpleCard
        title="通販客単価"
        value={ecommerceData?.unit_price ?? null}
        previousYear={ecommerceData?.unit_price_previous_year ?? null}
        yoyRate={ecommerceData?.unit_price_yoy ?? null}
        type="currency"
      />
    </div>
  )
}
