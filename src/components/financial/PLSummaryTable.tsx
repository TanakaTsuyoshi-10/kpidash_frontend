/**
 * 損益サマリーテーブル
 * 売上高、売上原価、売上総利益、販管費、営業利益を表示
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
import type { PLLineItem } from '@/types/financial'

interface Props {
  items: PLLineItem[]
  period: string
  loading?: boolean
}

export function PLSummaryTable({ items, period, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">損益サマリー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 文字列/数値をnumberに変換
  const toNumber = (value: unknown): number | null => {
    if (value === null || value === undefined) return null
    const num = typeof value === 'number' ? value : Number(value)
    return isNaN(num) ? null : num
  }

  // 値の色を決定
  const getRateColor = (value: number | string | null | undefined, threshold: number = 100) => {
    const num = toNumber(value)
    if (num === null) return 'text-gray-500'
    return num >= threshold ? 'text-green-600' : 'text-red-600'
  }

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">損益サマリー</CardTitle>
        <p className="text-sm text-gray-500">{period}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">項目</TableHead>
              <TableHead className="text-right">実績</TableHead>
              <TableHead className="text-right">予算</TableHead>
              <TableHead className="text-right">達成率</TableHead>
              <TableHead className="text-right">前年</TableHead>
              <TableHead className="text-right">前年比</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.name}
                className={item.is_subtotal ? 'bg-gray-50 font-medium' : ''}
              >
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.actual)}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {item.target ? formatCurrency(item.target) : '-'}
                </TableCell>
                <TableCell className={cn('text-right', getRateColor(item.achievement_rate))}>
                  {item.achievement_rate ? formatPercent(item.achievement_rate) : '-'}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {formatCurrency(item.previous_year)}
                </TableCell>
                <TableCell className={cn('text-right', getYoYColor(item.yoy_rate))}>
                  {formatYoY(item.yoy_rate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {items.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            データがありません
          </div>
        )}
      </CardContent>
    </Card>
  )
}
