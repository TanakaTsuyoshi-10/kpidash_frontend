/**
 * 日別×商品別パック数テーブル
 *
 * カレンダー下に表示し、日付ごとの商品パック数とバット数合計を表示する。
 */
'use client'

import { cn } from '@/lib/utils'
import { useDailyProductBreakdown } from '@/hooks/useOrderForecast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** 商品名の短縮表示 */
const SHORT_NAMES: Record<string, string> = {
  'ぎょうざ20個': 'ぎょ20',
  'ぎょうざ30個': 'ぎょ30',
  'ぎょうざ40個': 'ぎょ40',
  'ぎょうざ50個': 'ぎょ50',
  '生姜入ぎょうざ30個': '生姜30',
}

interface DailyProductTableProps {
  year: number
  month: number
  segmentId?: string
  highlightWeekday?: number
  onDateClick?: (date: string) => void
}

/** 曜日インデックス(月=0〜日=6) */
const WEEKDAY_TO_INDEX: Record<string, number> = {
  '月': 0, '火': 1, '水': 2, '木': 3, '金': 4, '土': 5, '日': 6,
}

export function DailyProductTable({
  year,
  month,
  segmentId,
  highlightWeekday,
  onDateClick,
}: DailyProductTableProps) {
  const { data, loading, error } = useDailyProductBreakdown(year, month, segmentId)

  if (loading) {
    return <Skeleton className="h-48 w-full" />
  }

  if (error || !data) {
    return null
  }

  const { product_columns, rows } = data

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          日別パック数 ({year}年{month}月)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1.5 pr-2 font-medium whitespace-nowrap">日付</th>
                <th className="text-center py-1.5 px-1 font-medium w-8">曜</th>
                {product_columns.map(col => (
                  <th key={col} className="text-right py-1.5 px-1.5 font-medium whitespace-nowrap">
                    {SHORT_NAMES[col] ?? col}
                  </th>
                ))}
                <th className="text-right py-1.5 pl-2 font-medium whitespace-nowrap">バット</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                if (!row.date) return null
                const dateNum = `${parseInt(row.date.split('-')[1])}/${parseInt(row.date.split('-')[2])}`
                const wdIdx = row.weekday ? WEEKDAY_TO_INDEX[row.weekday] : -1
                const isHighlighted = highlightWeekday !== undefined && wdIdx === highlightWeekday
                const isSat = wdIdx === 5
                const isSun = wdIdx === 6

                return (
                  <tr
                    key={row.date}
                    className={cn(
                      'border-b border-border/50',
                      isHighlighted && 'bg-amber-50 dark:bg-amber-900/20',
                      onDateClick && 'cursor-pointer hover:bg-muted/50',
                    )}
                    onClick={() => onDateClick?.(row.date!)}
                  >
                    <td className="py-1.5 pr-2 whitespace-nowrap">{dateNum}</td>
                    <td
                      className={cn(
                        'text-center py-1.5 px-1',
                        isSat && 'text-blue-600 dark:text-blue-400',
                        isSun && 'text-red-600 dark:text-red-400',
                      )}
                    >
                      {row.weekday}
                    </td>
                    {product_columns.map(col => (
                      <td key={col} className="text-right py-1.5 px-1.5 tabular-nums">
                        {row.products[col] > 0 ? row.products[col] : '-'}
                      </td>
                    ))}
                    <td className="text-right py-1.5 pl-2 font-semibold tabular-nums">
                      {row.total_bats > 0
                        ? (row.total_bats % 1 === 0 ? row.total_bats.toFixed(0) : row.total_bats.toFixed(1))
                        : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
