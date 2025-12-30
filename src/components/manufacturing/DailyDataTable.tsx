/**
 * 日次データテーブル
 * 日次の製造データを表示
 */
'use client'

import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ManufacturingDailyData } from '@/types/manufacturing'

interface Props {
  data: ManufacturingDailyData[]
  loading?: boolean
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const weekday = weekdays[date.getDay()]
  return `${month}/${day}（${weekday}）`
}

function formatValue(value: number | null, decimals: number = 0): string {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'number' ? value : Number(value)
  if (isNaN(num)) return '-'
  return decimals > 0 ? num.toFixed(decimals) : num.toLocaleString()
}

export function DailyDataTable({ data, loading = false }: Props) {
  const [expanded, setExpanded] = useState(false)
  const displayCount = expanded ? data.length : 10

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>日次データ</CardTitle>
          <CardDescription>日別の製造実績</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>日次データ</CardTitle>
          <CardDescription>日別の製造実績</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            日次データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayData = data.slice(0, displayCount)

  return (
    <Card>
      <CardHeader>
        <CardTitle>日次データ</CardTitle>
        <CardDescription>
          日別の製造実績（{data.length}件）
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">日付</TableHead>
                <TableHead className="text-right">生産量（バット）</TableHead>
                <TableHead className="text-right">生産個数</TableHead>
                <TableHead className="text-right">人員</TableHead>
                <TableHead className="text-right">生産性</TableHead>
                <TableHead className="text-right">有給（時間）</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatValue(row.production_batts)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatValue(row.production_pieces)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatValue(row.workers_count, 1)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatValue(row.production_per_worker, 2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatValue(row.paid_leave_hours, 1)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {data.length > 10 && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  折りたたむ
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  すべて表示（残り{data.length - 10}件）
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
