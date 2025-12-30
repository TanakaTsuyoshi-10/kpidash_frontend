/**
 * 部門別売上テーブル
 * 店舗・通販の売上高、構成比、前年比を表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { DepartmentSales } from '@/types/financial'

interface Props {
  departments: DepartmentSales[]
  loading?: boolean
}

export function DepartmentSalesTable({ departments, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">部門別売上</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 合計を計算
  const totals = departments.reduce(
    (acc, dept) => ({
      sales: (acc.sales || 0) + (dept.sales || 0),
      yoy_diff: (acc.yoy_diff || 0) + (dept.yoy_diff || 0),
    }),
    { sales: 0, yoy_diff: 0 }
  )

  // 加重平均の前年比を計算
  const totalYoyRate = departments.length > 0
    ? departments.reduce((sum, d) => sum + (d.yoy_rate || 0) * (d.sales || 0), 0) / totals.sales
    : null

  // 値の色を決定
  const getYoYColor = (value: number | null) => {
    if (value === null) return 'text-gray-500'
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const formatYoY = (value: number | null) => {
    if (value === null) return '-'
    const sign = value > 0 ? '+' : value < 0 ? '▲' : ''
    return `${sign}${Math.abs(value).toFixed(1)}%`
  }

  const formatDiff = (value: number | null) => {
    if (value === null) return '-'
    const sign = value > 0 ? '+' : value < 0 ? '▲' : ''
    return `${sign}${formatCurrency(Math.abs(value))}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">部門別売上</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">部門</TableHead>
              <TableHead className="text-right">売上高</TableHead>
              <TableHead className="text-right">構成比</TableHead>
              <TableHead className="text-right">前年</TableHead>
              <TableHead className="text-right">前年比</TableHead>
              <TableHead className="text-right">増減額</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.department}>
                <TableCell className="font-medium">{dept.department}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(dept.sales)}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatPercent(dept.composition_rate)}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatCurrency(dept.previous_year)}
                </TableCell>
                <TableCell className={cn('text-right', getYoYColor(dept.yoy_rate))}>
                  {formatYoY(dept.yoy_rate)}
                </TableCell>
                <TableCell className={cn('text-right', getYoYColor(dept.yoy_diff))}>
                  {formatDiff(dept.yoy_diff)}
                </TableCell>
              </TableRow>
            ))}
            {/* 合計行 */}
            {departments.length > 0 && (
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>合計</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.sales)}
                </TableCell>
                <TableCell className="text-right">100%</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className={cn('text-right', getYoYColor(totalYoyRate))}>
                  {formatYoY(totalYoyRate)}
                </TableCell>
                <TableCell className={cn('text-right', getYoYColor(totals.yoy_diff))}>
                  {formatDiff(totals.yoy_diff)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {departments.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            データがありません
          </div>
        )}
      </CardContent>
    </Card>
  )
}
