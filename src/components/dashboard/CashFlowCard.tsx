/**
 * キャッシュフローカード
 * 営業CF、投資CF、財務CF、フリーCFを3年分表示
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
import { formatCurrency } from '@/lib/format'
import type { CashFlowData } from '@/types/dashboard'

interface Props {
  cashFlow: CashFlowData | null
  loading?: boolean
}

export function CashFlowCard({ cashFlow, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">キャッシュフロー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!cashFlow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">キャッシュフロー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  // CF行データ
  const rows = [
    {
      label: '営業CF',
      current: cashFlow.cf_operating,
      prev: cashFlow.cf_operating_prev,
      prev2: cashFlow.cf_operating_prev2,
    },
    {
      label: '投資CF',
      current: cashFlow.cf_investing,
      prev: cashFlow.cf_investing_prev,
      prev2: cashFlow.cf_investing_prev2,
    },
    {
      label: '財務CF',
      current: cashFlow.cf_financing,
      prev: cashFlow.cf_financing_prev,
      prev2: cashFlow.cf_financing_prev2,
    },
    {
      label: 'フリーCF',
      current: cashFlow.cf_free,
      prev: cashFlow.cf_free_prev,
      prev2: cashFlow.cf_free_prev2,
      highlight: true,
    },
  ]

  // 値の色を決定（プラスは緑、マイナスは赤）
  const getValueColor = (value: number | null) => {
    if (value === null) return 'text-gray-500'
    return value >= 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">キャッシュフロー</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">項目</TableHead>
              <TableHead className="text-right">今期</TableHead>
              <TableHead className="text-right">前年</TableHead>
              <TableHead className="text-right">前々年</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.label}
                className={row.highlight ? 'bg-gray-50 font-medium' : ''}
              >
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className={cn('text-right', getValueColor(row.current))}>
                  {formatCurrency(row.current)}
                </TableCell>
                <TableCell className={cn('text-right text-sm', getValueColor(row.prev))}>
                  {formatCurrency(row.prev)}
                </TableCell>
                <TableCell className={cn('text-right text-sm', getValueColor(row.prev2))}>
                  {formatCurrency(row.prev2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
