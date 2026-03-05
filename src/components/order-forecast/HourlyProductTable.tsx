/**
 * 時間帯別×商品別パック数テーブル
 *
 * 日付クリック時に表示し、時間帯ごとの商品パック数とバット数合計を表示する。
 */
'use client'

import { X } from 'lucide-react'
import { useHourlyProductBreakdown } from '@/hooks/useOrderForecast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** 商品名の短縮表示 */
const SHORT_NAMES: Record<string, string> = {
  'ぎょうざ20個': 'ぎょ20',
  'ぎょうざ30個': 'ぎょ30',
  'ぎょうざ40個': 'ぎょ40',
  'ぎょうざ50個': 'ぎょ50',
  '生姜入ぎょうざ30個': '生姜30',
}

interface HourlyProductTableProps {
  targetDate: string
  segmentId?: string
  onClose?: () => void
}

export function HourlyProductTable({
  targetDate,
  segmentId,
  onClose,
}: HourlyProductTableProps) {
  const { data, loading, error } = useHourlyProductBreakdown(targetDate, segmentId)

  if (loading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (error || !data) {
    return null
  }

  const { date: dateStr, weekday, product_columns, rows } = data

  // 日付フォーマット
  const parts = dateStr.split('-')
  const displayDate = `${parseInt(parts[0])}年${parseInt(parts[1])}月${parseInt(parts[2])}日(${weekday})`

  // 合計行を計算
  const totals: Record<string, number> = {}
  let totalBats = 0
  for (const col of product_columns) {
    totals[col] = rows.reduce((sum, row) => sum + (row.products[col] ?? 0), 0)
  }
  totalBats = rows.reduce((sum, row) => sum + row.total_bats, 0)
  totalBats = Math.round(totalBats * 10) / 10

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {displayDate} 時間帯別パック数
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1.5 pr-2 font-medium whitespace-nowrap">時間</th>
                {product_columns.map(col => (
                  <th key={col} className="text-right py-1.5 px-1.5 font-medium whitespace-nowrap">
                    {SHORT_NAMES[col] ?? col}
                  </th>
                ))}
                <th className="text-right py-1.5 pl-2 font-medium whitespace-nowrap">バット</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.hour} className="border-b border-border/50">
                  <td className="py-1.5 pr-2 whitespace-nowrap">{row.hour}時</td>
                  {product_columns.map(col => (
                    <td key={col} className="text-right py-1.5 px-1.5 tabular-nums">
                      {(row.products[col] ?? 0) > 0 ? row.products[col] : '-'}
                    </td>
                  ))}
                  <td className="text-right py-1.5 pl-2 font-semibold tabular-nums">
                    {row.total_bats > 0
                      ? (row.total_bats % 1 === 0 ? row.total_bats.toFixed(0) : row.total_bats.toFixed(1))
                      : '-'}
                  </td>
                </tr>
              ))}
              {/* 合計行 */}
              <tr className="border-t-2 font-semibold">
                <td className="py-1.5 pr-2">合計</td>
                {product_columns.map(col => (
                  <td key={col} className="text-right py-1.5 px-1.5 tabular-nums">
                    {totals[col] > 0 ? totals[col] : '-'}
                  </td>
                ))}
                <td className="text-right py-1.5 pl-2 tabular-nums">
                  {totalBats > 0
                    ? (totalBats % 1 === 0 ? totalBats.toFixed(0) : totalBats.toFixed(1))
                    : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
