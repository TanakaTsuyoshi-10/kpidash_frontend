/**
 * 製造前年比較テーブル
 * 当年と過去2年分の比較データを表示
 */
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatPercent } from '@/lib/format'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { ManufacturingComparison, ManufacturingMonthlySummary } from '@/types/manufacturing'

interface Props {
  comparison: ManufacturingComparison | null
  loading?: boolean
}

function formatValue(value: number | null, decimals: number = 0): string {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return '-'
  return decimals > 0 ? num.toFixed(decimals) : formatNumber(num, '')
}

function YoYIndicator({ diff, rate }: { diff: number | null; rate: number | null }) {
  if (diff === null || rate === null) {
    return <span className="text-gray-400">-</span>
  }

  const isPositive = diff > 0
  const isNeutral = diff === 0

  return (
    <div className="flex items-center gap-1">
      {isNeutral ? (
        <Minus className="h-4 w-4 text-gray-400" />
      ) : isPositive ? (
        <TrendingUp className="h-4 w-4 text-green-600" />
      ) : (
        <TrendingDown className="h-4 w-4 text-red-600" />
      )}
      <span className={isNeutral ? 'text-gray-600' : isPositive ? 'text-green-600' : 'text-red-600'}>
        {formatPercent(rate, true)}
      </span>
    </div>
  )
}

export function ManufacturingComparisonTable({ comparison, loading = false }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>前年比較</CardTitle>
          <CardDescription>過去3年間の製造実績比較</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentYear = comparison?.current
  const prevYear = comparison?.previous_year
  const prevYear2 = comparison?.previous_year2

  // 年度ラベルを取得
  const getYearLabel = (summary: ManufacturingMonthlySummary | null | undefined): string => {
    if (!summary?.month) return '-'
    const match = summary.month.match(/(\d{4})年/)
    return match ? `${match[1]}年度` : summary.month
  }

  const rows = [
    {
      label: '生産量（バット）',
      current: formatValue(currentYear?.total_batts ?? null),
      prev: formatValue(prevYear?.total_batts ?? null),
      prev2: formatValue(prevYear2?.total_batts ?? null),
      diff: comparison?.yoy_batts_diff ?? null,
      rate: comparison?.yoy_batts_rate ?? null,
    },
    {
      label: '人員（人）',
      current: formatValue(currentYear?.total_workers ?? null, 1),
      prev: formatValue(prevYear?.total_workers ?? null, 1),
      prev2: formatValue(prevYear2?.total_workers ?? null, 1),
      diff: comparison?.yoy_workers_diff ?? null,
      rate: comparison?.yoy_workers_rate ?? null,
    },
    {
      label: '生産性（バット/人）',
      current: formatValue(currentYear?.avg_production_per_worker ?? null, 2),
      prev: formatValue(prevYear?.avg_production_per_worker ?? null, 2),
      prev2: formatValue(prevYear2?.avg_production_per_worker ?? null, 2),
      diff: comparison?.yoy_productivity_diff ?? null,
      rate: comparison?.yoy_productivity_rate ?? null,
    },
    {
      label: '有給休暇（時間）',
      current: formatValue(currentYear?.total_paid_leave_hours ?? null, 1),
      prev: formatValue(prevYear?.total_paid_leave_hours ?? null, 1),
      prev2: formatValue(prevYear2?.total_paid_leave_hours ?? null, 1),
      diff: comparison?.yoy_leave_diff ?? null,
      rate: comparison?.yoy_leave_rate ?? null,
      invertColor: true,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>前年比較</CardTitle>
        <CardDescription>
          {comparison?.period ?? '-'} | 過去3年間の製造実績比較
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">指標</TableHead>
              <TableHead className="text-right">{getYearLabel(currentYear)}</TableHead>
              <TableHead className="text-right">{getYearLabel(prevYear)}</TableHead>
              <TableHead className="text-right">{getYearLabel(prevYear2)}</TableHead>
              <TableHead className="text-right">前年比</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-right font-semibold">{row.current}</TableCell>
                <TableCell className="text-right text-gray-600">{row.prev}</TableCell>
                <TableCell className="text-right text-gray-500">{row.prev2}</TableCell>
                <TableCell className="text-right">
                  <YoYIndicator diff={row.diff} rate={row.rate} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
