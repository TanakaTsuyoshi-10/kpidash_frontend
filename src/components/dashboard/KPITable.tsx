/**
 * KPI一覧テーブル
 */
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { KPIMetric } from '@/types/kpi'
import { cn } from '@/lib/utils'

interface Props {
  metrics: KPIMetric[]
}

export function KPITable({ metrics }: Props) {
  const alertBadge = (level: string) => {
    const colors = {
      none: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      critical: 'bg-red-100 text-red-800',
    }
    const labels = {
      none: '達成',
      warning: '注意',
      critical: '未達',
    }
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    )
  }

  const formatNumber = (value: number | null, unit: string) => {
    if (value === null) return '-'
    const formatted = value.toLocaleString()
    return unit === '円' ? `¥${formatted}` : `${formatted}${unit}`
  }

  const formatPercent = (value: number | null) => {
    if (value === null) return '-'
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>指標名</TableHead>
            <TableHead className="text-right">単月実績</TableHead>
            <TableHead className="text-right">単月目標</TableHead>
            <TableHead className="text-right">累計実績</TableHead>
            <TableHead className="text-right">累計目標</TableHead>
            <TableHead className="text-right">達成率</TableHead>
            <TableHead className="text-right">前年比</TableHead>
            <TableHead className="text-center">状態</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{metric.name}</TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatNumber(metric.actual, metric.unit)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatNumber(metric.target, metric.unit)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatNumber(metric.ytd_actual, metric.unit)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatNumber(metric.ytd_target, metric.unit)}
              </TableCell>
              <TableCell className={cn(
                "text-right font-mono text-sm",
                metric.alert_level === 'critical' && "text-red-600",
                metric.alert_level === 'warning' && "text-yellow-600",
                metric.alert_level === 'none' && "text-green-600"
              )}>
                {formatPercent(metric.achievement_rate)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatPercent(metric.yoy_rate)}
              </TableCell>
              <TableCell className="text-center">
                {alertBadge(metric.alert_level)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
