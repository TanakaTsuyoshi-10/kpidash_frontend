/**
 * 経費分析カード
 * 人件費、販管費等の経費内訳を前年比較付きで表示
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

/**
 * 拡張経費項目（前年比較用）
 */
export interface ExpenseItemWithComparison {
  name: string
  amount: number | null
  rate: number | null
  previousYearAmount?: number | null
  previousYearRate?: number | null
  rateDiff?: number | null
}

/**
 * 金額を円単位でフォーマット（カンマ区切り）
 */
function formatYen(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return '-'
  return Math.round(num).toLocaleString('ja-JP')
}

/**
 * パーセントをフォーマット
 */
function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return `${value.toFixed(1)}%`
}

/**
 * 差分をフォーマット（pt表示）
 */
function formatDiff(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  return `${sign}${value.toFixed(1)}pt`
}

/**
 * 差分の色を取得（経費は下がる方が良い）
 */
function getDiffColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'text-gray-500'
  // 経費率は下がる方が良いので、マイナスなら緑、プラスなら赤
  return value <= 0 ? 'text-green-600' : 'text-red-600'
}

interface Props {
  expenses: ExpenseItemWithComparison[]
  salesTotal?: number | null
  loading?: boolean
}

export function ExpenseBreakdown({ expenses, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">経費分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 前年比較データがあるかどうかをチェック
  const hasComparison = expenses.some(e => e.previousYearRate !== null && e.previousYearRate !== undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">経費分析</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">項目</TableHead>
              <TableHead className="text-right">実額</TableHead>
              <TableHead className="text-right">対売上比</TableHead>
              {hasComparison && (
                <>
                  <TableHead className="text-right">前年比率</TableHead>
                  <TableHead className="text-right">差異</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.name}>
                <TableCell className="font-medium">{expense.name}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatYen(expense.amount)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercent(expense.rate)}
                </TableCell>
                {hasComparison && (
                  <>
                    <TableCell className="text-right font-mono text-gray-600">
                      {formatPercent(expense.previousYearRate)}
                    </TableCell>
                    <TableCell className={cn('text-right font-mono', getDiffColor(expense.rateDiff))}>
                      {formatDiff(expense.rateDiff)}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {expenses.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            データがありません
          </div>
        )}
      </CardContent>
    </Card>
  )
}
