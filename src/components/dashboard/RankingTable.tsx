/**
 * 店舗ランキングテーブル
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
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RankingItem } from '@/hooks/useKPI'

interface Props {
  data: RankingItem[]
  title?: string
  loading?: boolean
}

export function RankingTable({ data, title = '店舗ランキング', loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-500 font-bold'
    if (rank === 2) return 'text-gray-400 font-bold'
    if (rank === 3) return 'text-amber-600 font-bold'
    return 'text-gray-600'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center text-gray-400 py-8">データがありません</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">順位</TableHead>
                <TableHead>店舗名</TableHead>
                <TableHead className="text-right">売上</TableHead>
                <TableHead className="text-right">達成率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.segment_id}>
                  <TableCell className={cn("font-mono text-sm", getRankStyle(item.rank))}>
                    {item.rank}位
                  </TableCell>
                  <TableCell className="font-medium">{item.segment_name}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ¥{item.value.toLocaleString()}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-mono text-sm",
                    item.achievement_rate && item.achievement_rate >= 100
                      ? "text-green-600"
                      : "text-red-600"
                  )}>
                    {item.achievement_rate?.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
