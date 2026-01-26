/**
 * 部門別実績テーブル
 * 店舗・通販の売上・利益実績を表示
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
import type { DepartmentPerformance } from '@/types/dashboard'

// 文字列/数値をnumberに変換
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? null : num
}

// 前年比をフォーマット
function formatYoY(value: unknown): string {
  const num = toNumber(value)
  if (num == null) return '-'
  const sign = num > 0 ? '+' : num < 0 ? '▲' : ''
  const absValue = Math.abs(num).toFixed(1)
  return `${sign}${absValue}%`
}

interface Props {
  departments: DepartmentPerformance[]
  loading?: boolean
}

export function DepartmentTable({ departments, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">部門別実績</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // 合計行を計算（文字列型にも対応）
  const totals = departments.reduce(
    (acc, dept) => ({
      sales: acc.sales + (toNumber(dept.sales) || 0),
      profit: acc.profit + (toNumber(dept.profit) || 0),
    }),
    { sales: 0, profit: 0 }
  )

  // 合計の前年比・達成率を計算（加重平均）
  const totalYoyRate = departments.length > 0 && totals.sales > 0
    ? departments.reduce((sum, d) => {
        const sales = toNumber(d.sales) || 0
        const yoyRate = toNumber(d.sales_yoy_rate) || 0
        return sum + yoyRate * sales
      }, 0) / totals.sales
    : null
  const totalAchievementRate = departments.length > 0 && totals.sales > 0
    ? departments.reduce((sum, d) => {
        const sales = toNumber(d.sales) || 0
        const achievementRate = toNumber(d.achievement_rate) || 0
        return sum + achievementRate * sales
      }, 0) / totals.sales
    : null
  const totalBudgetRate = departments.length > 0 && totals.sales > 0
    ? departments.reduce((sum, d) => {
        const sales = toNumber(d.sales) || 0
        const budgetRate = toNumber(d.budget_rate) || 0
        return sum + budgetRate * sales
      }, 0) / totals.sales
    : null

  // 値の色を決定
  const getValueColor = (value: number | null, threshold: number = 0) => {
    if (value === null) return 'text-gray-500'
    return value >= threshold ? 'text-green-600' : 'text-red-600'
  }

  const getRateColor = (value: number | null) => {
    if (value === null) return 'text-gray-500'
    return value >= 100 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">部門別実績</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">部門</TableHead>
              <TableHead className="text-right">売上高</TableHead>
              <TableHead className="text-right">前年比</TableHead>
              <TableHead className="text-right">利益</TableHead>
              <TableHead className="text-right">達成率</TableHead>
              <TableHead className="text-right">予算比</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.map((dept) => (
              <TableRow key={dept.department}>
                <TableCell className="font-medium">{dept.department}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(dept.sales, false)}
                </TableCell>
                <TableCell className={cn('text-right', getValueColor(toNumber(dept.sales_yoy_rate)))}>
                  {formatYoY(dept.sales_yoy_rate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(dept.profit, false)}
                </TableCell>
                <TableCell className={cn('text-right', getRateColor(dept.achievement_rate))}>
                  {formatPercent(dept.achievement_rate)}
                </TableCell>
                <TableCell className={cn('text-right', getRateColor(dept.budget_rate))}>
                  {formatPercent(dept.budget_rate)}
                </TableCell>
              </TableRow>
            ))}
            {/* 合計行 */}
            {departments.length > 0 && (
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>合計</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.sales, false)}
                </TableCell>
                <TableCell className={cn('text-right', getValueColor(totalYoyRate))}>
                  {formatYoY(totalYoyRate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totals.profit, false)}
                </TableCell>
                <TableCell className={cn('text-right', getRateColor(totalAchievementRate))}>
                  {formatPercent(totalAchievementRate)}
                </TableCell>
                <TableCell className={cn('text-right', getRateColor(totalBudgetRate))}>
                  {formatPercent(totalBudgetRate)}
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
