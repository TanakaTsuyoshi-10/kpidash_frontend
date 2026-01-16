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
import type { DepartmentSales } from '@/types/financial'

/**
 * 金額を円単位でフォーマット（カンマ区切り）
 */
function formatYen(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return '-'
  return Math.round(num).toLocaleString('ja-JP')
}

interface Props {
  departments: DepartmentSales[]
  loading?: boolean
}

// 文字列/数値をnumberに変換
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? null : num
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
      sales: acc.sales + (toNumber(dept.sales) || 0),
      previous_year: acc.previous_year + (toNumber(dept.previous_year) || 0),
      yoy_diff: acc.yoy_diff + (toNumber(dept.yoy_diff) || 0),
    }),
    { sales: 0, previous_year: 0, yoy_diff: 0 }
  )

  // 加重平均の前年比を計算
  const totalYoyRate = departments.length > 0 && totals.sales > 0
    ? departments.reduce((sum, d) => sum + (toNumber(d.yoy_rate) || 0) * (toNumber(d.sales) || 0), 0) / totals.sales
    : null

  // 値の色を決定
  const getYoYColor = (value: number | string | null | undefined) => {
    const num = toNumber(value)
    if (num === null) return 'text-gray-500'
    return num >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const formatYoY = (value: number | string | null | undefined) => {
    const num = toNumber(value)
    if (num === null) return '-'
    const sign = num > 0 ? '+' : num < 0 ? '▲' : ''
    return `${sign}${Math.abs(num).toFixed(1)}%`
  }

  const formatDiff = (value: number | string | null | undefined) => {
    const num = toNumber(value)
    if (num === null) return '-'
    const sign = num > 0 ? '+' : num < 0 ? '▲' : ''
    return `${sign}${formatYen(Math.abs(num))}`
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
            {departments.map((dept) => {
              // 構成比を計算（APIから来ない場合は自前で計算）
              const compositionRate = dept.composition_rate !== null && dept.composition_rate !== undefined
                ? toNumber(dept.composition_rate)
                : (totals.sales > 0 && toNumber(dept.sales) ? (toNumber(dept.sales)! / totals.sales) * 100 : null)

              return (
                <TableRow key={dept.department}>
                  <TableCell className="font-medium">{dept.department}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatYen(dept.sales)}
                  </TableCell>
                  <TableCell className="text-right text-gray-600 font-mono">
                    {compositionRate !== null ? `${compositionRate.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell className="text-right text-gray-600 font-mono">
                    {formatYen(dept.previous_year)}
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', getYoYColor(dept.yoy_rate))}>
                    {formatYoY(dept.yoy_rate)}
                  </TableCell>
                  <TableCell className={cn('text-right font-mono', getYoYColor(dept.yoy_diff))}>
                    {formatDiff(dept.yoy_diff)}
                  </TableCell>
                </TableRow>
              )
            })}
            {/* 合計行 */}
            {departments.length > 0 && (
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>合計</TableCell>
                <TableCell className="text-right font-mono">
                  {formatYen(totals.sales)}
                </TableCell>
                <TableCell className="text-right font-mono">100.0%</TableCell>
                <TableCell className="text-right font-mono text-gray-600">
                  {formatYen(totals.previous_year)}
                </TableCell>
                <TableCell className={cn('text-right font-mono', getYoYColor(totalYoyRate))}>
                  {formatYoY(totalYoyRate)}
                </TableCell>
                <TableCell className={cn('text-right font-mono', getYoYColor(totals.yoy_diff))}>
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
