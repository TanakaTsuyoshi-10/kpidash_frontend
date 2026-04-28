/**
 * 曜日×店舗の売上ヒートマップ
 * パターン発見用（どの店舗がどの曜日に強い/弱いか）
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeatmapData {
  storeName: string
  values: (number | null)[]  // 日〜土の7要素
}

interface Props {
  data: HeatmapData[]
  loading?: boolean
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function getHeatColor(value: number | null, min: number, max: number): string {
  if (value === null) return 'bg-gray-100'

  const range = max - min
  if (range === 0) return 'bg-green-200'

  const ratio = (value - min) / range

  if (ratio >= 0.8) return 'bg-green-500 text-white'
  if (ratio >= 0.6) return 'bg-green-300'
  if (ratio >= 0.4) return 'bg-green-200'
  if (ratio >= 0.2) return 'bg-yellow-100'
  return 'bg-orange-100'
}

export function StoreWeekdayHeatmap({ data, loading }: Props) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-5 bg-gray-200 rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) return null

  // 全値のmin/maxを計算
  const allValues = data.flatMap(d => d.values).filter((v): v is number => v !== null)
  if (allValues.length === 0) return null

  const min = Math.min(...allValues)
  const max = Math.max(...allValues)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Grid3X3 className="h-4 w-4 text-green-600" />
          曜日別パターン
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-1 px-1 font-medium text-gray-500 w-20">店舗</th>
                {WEEKDAYS.map(day => (
                  <th key={day} className="text-center py-1 px-1 font-medium text-gray-500 w-10">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.storeName}>
                  <td className="py-1 px-1 font-medium truncate max-w-[80px]">
                    {row.storeName}
                  </td>
                  {row.values.map((val, i) => (
                    <td key={i} className="py-1 px-0.5">
                      <div
                        className={cn(
                          'rounded text-center py-1 text-[10px] font-medium',
                          getHeatColor(val, min, max)
                        )}
                        title={val !== null ? `${(val / 10000).toFixed(0)}万` : '-'}
                      >
                        {val !== null ? `${(val / 10000).toFixed(0)}` : '-'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-gray-400">
          <span>低</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-3 bg-orange-100 rounded" />
            <div className="w-4 h-3 bg-yellow-100 rounded" />
            <div className="w-4 h-3 bg-green-200 rounded" />
            <div className="w-4 h-3 bg-green-300 rounded" />
            <div className="w-4 h-3 bg-green-500 rounded" />
          </div>
          <span>高</span>
          <span className="ml-1">(万円)</span>
        </div>
      </CardContent>
    </Card>
  )
}
