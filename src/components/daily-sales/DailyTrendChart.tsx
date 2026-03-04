/**
 * 日次推移グラフ
 * recharts LineChart: 当年（実線・emerald）、前年（破線・gray）
 * 店舗セレクタ: 全店舗 or 個別店舗
 */
'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useDailyTrend, useDailySalesSummary } from '@/hooks/useDailySales'
import { cn } from '@/lib/utils'
import type { StoreInfo } from '@/types/daily-sales'

interface Props {
  month: string
  departmentSlug?: string
}

function formatCurrency(value: number): string {
  if (!value) return '¥0'
  return `¥${Math.round(value).toLocaleString()}`
}

interface ChartDataPoint {
  day: number
  current: number
  previous: number
}

// カスタムツールチップ
function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: number
}) {
  if (!active || !payload?.length) return null

  const current = payload.find(p => p.dataKey === 'current')
  const previous = payload.find(p => p.dataKey === 'previous')
  const yoy = current && previous && previous.value > 0
    ? ((current.value / previous.value - 1) * 100).toFixed(1)
    : null

  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 text-xs">
      <div className="font-medium mb-1">{label}日</div>
      {current && (
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
          <span>当年: {formatCurrency(current.value)}</span>
        </div>
      )}
      {previous && (
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-gray-400 inline-block border-dashed" />
          <span>前年: {formatCurrency(previous.value)}</span>
        </div>
      )}
      {yoy != null && (
        <div className={cn(
          'mt-1 font-medium',
          Number(yoy) >= 0 ? 'text-green-600' : 'text-red-600',
        )}>
          前年比: {Number(yoy) >= 0 ? '+' : ''}{yoy}%
        </div>
      )}
    </div>
  )
}

export function DailyTrendChart({ month, departmentSlug = 'store' }: Props) {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | undefined>(undefined)

  // 店舗リスト取得（サマリーから）
  const { data: summaryData } = useDailySalesSummary(month, departmentSlug)
  const stores: StoreInfo[] = summaryData?.stores || []

  // 推移データ取得
  const { data: trendData, loading, error } = useDailyTrend(
    month,
    selectedSegmentId,
    departmentSlug,
  )

  // チャートデータ作成
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!trendData) return []

    const points: ChartDataPoint[] = []
    const maxLen = Math.max(trendData.current_year.length, trendData.previous_year.length)

    for (let i = 0; i < maxLen; i++) {
      const cur = trendData.current_year[i]
      const prev = trendData.previous_year[i]
      points.push({
        day: i + 1,
        current: cur?.sales || 0,
        previous: prev?.sales || 0,
      })
    }

    return points
  }, [trendData])

  // Y軸の最大値（きりの良い数値に丸める）
  const yAxisMax = useMemo(() => {
    if (!chartData.length) return 0
    const max = Math.max(...chartData.map(d => Math.max(d.current, d.previous)))
    if (max === 0) return 100000
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
    return Math.ceil(max / magnitude) * magnitude
  }, [chartData])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>日次推移</CardTitle>
          {/* 店舗セレクタ */}
          <select
            className="text-sm border rounded-md px-2 py-1"
            value={selectedSegmentId || ''}
            onChange={e => setSelectedSegmentId(e.target.value || undefined)}
          >
            <option value="">全店舗合計</option>
            {stores.map(store => (
              <option key={store.segment_id} value={store.segment_id}>
                {store.segment_name}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            読み込み中...
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}日`}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v.toLocaleString()}
                domain={[0, yAxisMax]}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs">
                    {value === 'current' ? '当年' : '前年'}
                  </span>
                )}
              />
              <Line
                type="monotone"
                dataKey="current"
                name="current"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="previous"
                name="previous"
                stroke="#9ca3af"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={{ r: 1.5 }}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {!loading && !error && chartData.length === 0 && (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            データがありません。
          </div>
        )}
      </CardContent>
    </Card>
  )
}
