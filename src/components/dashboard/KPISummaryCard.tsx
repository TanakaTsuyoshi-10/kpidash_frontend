/**
 * KPI指標表示カード
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { KPIMetric } from '@/types/kpi'
import { cn } from '@/lib/utils'

interface Props {
  metric: KPIMetric
}

export function KPISummaryCard({ metric }: Props) {
  const isPlaceholder = metric.actual === null && metric.target === null
  const achievementRate = metric.achievement_rate ?? 0
  const yoyRate = metric.yoy_rate ?? 0

  // アラートレベルに応じた色
  const alertColors = {
    none: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  }

  // 前年比のアイコン（変化率: 0基準）
  const YoYIcon = yoyRate > 0 ? TrendingUp : yoyRate < 0 ? TrendingDown : Minus
  const yoyColor = yoyRate > 0 ? 'text-green-600' : yoyRate < 0 ? 'text-red-600' : 'text-gray-600'

  // 数値フォーマット
  const formatValue = (value: number | null, unit: string) => {
    if (value === null) return '-'
    if (unit === '円') {
      return value.toLocaleString() + '円'
    }
    if (unit === '%') {
      return value.toFixed(1) + '%'
    }
    return value.toLocaleString() + unit
  }

  // プレースホルダー（データ未実装）の場合
  if (isPlaceholder) {
    return (
      <Card className="opacity-60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.name}
            </CardTitle>
            <Badge className="bg-gray-100 text-gray-500">
              準備中
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-400">-</div>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>目標達成率</span>
              <span>-</span>
            </div>
            <Progress value={0} className="h-2" />
          </div>
          <div className="mt-3 pt-3 border-t text-sm text-gray-400 text-center">
            財務データの登録後に表示されます
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {metric.name}
          </CardTitle>
          <Badge className={alertColors[metric.alert_level]}>
            {metric.alert_level === 'none' ? '達成' :
             metric.alert_level === 'warning' ? '注意' : '未達'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* 実績値 */}
        <div className="text-2xl font-bold">
          {formatValue(metric.actual, metric.unit)}
        </div>

        {/* 目標比 */}
        <div className="mt-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>目標達成率</span>
            <span>{achievementRate.toFixed(1)}%</span>
          </div>
          <Progress
            value={Math.min(achievementRate, 100)}
            className={cn(
              "h-2",
              metric.alert_level === 'critical' && "[&>div]:bg-red-500",
              metric.alert_level === 'warning' && "[&>div]:bg-yellow-500",
              metric.alert_level === 'none' && "[&>div]:bg-green-500"
            )}
          />
        </div>

        {/* 累計・前年比 */}
        <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-gray-500">年度累計</div>
            <div className="font-medium">
              {formatValue(metric.ytd_actual, metric.unit)}
            </div>
          </div>
          <div>
            <div className="text-gray-500">前年比</div>
            <div className={cn("font-medium flex items-center gap-1", yoyColor)}>
              <YoYIcon className="h-4 w-4" />
              {yoyRate ? `${yoyRate >= 0 ? '+' : ''}${yoyRate.toFixed(1)}%` : '-'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
