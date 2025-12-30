/**
 * 経費分析カード
 * 人件費、販管費等の経費内訳を表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { ExpenseItem } from '@/types/financial'

interface Props {
  expenses: ExpenseItem[]
  salesTotal: number | null
  loading?: boolean
}

export function ExpenseBreakdown({ expenses, salesTotal, loading }: Props) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">経費分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div
              key={expense.name}
              className="flex items-center justify-between py-3 border-b last:border-0"
            >
              <div>
                <div className="font-medium">{expense.name}</div>
                {expense.rate !== null && (
                  <div className="text-sm text-gray-500">
                    売上比 {formatPercent(expense.rate)}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formatCurrency(expense.amount)}
                </div>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              データがありません
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
