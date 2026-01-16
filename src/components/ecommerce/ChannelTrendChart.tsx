/**
 * チャネル別売上推移グラフ
 */
'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEcommerceTrend } from '@/hooks/useEcommerce'

interface Props {
  fiscalYear?: number
}

// チャネルごとの色
const CHANNEL_COLORS: Record<string, string> = {
  'EC': '#3b82f6',
  '電話': '#22c55e',
  'FAX': '#f59e0b',
  '店舗受付': '#8b5cf6',
}

export function ChannelTrendChart({ fiscalYear }: Props) {
  const { data, loading, error } = useEcommerceTrend('channel_sales', fiscalYear)

  const chartData = useMemo(() => {
    if (!data) return []

    return data.months.map((month, index) => {
      const point: Record<string, string | number | null> = { month }
      data.data.forEach((item) => {
        point[item.name] = item.values[index]
      })
      return point
    })
  }, [data])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">チャネル別売上推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-400">読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">チャネル別売上推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-red-600">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">チャネル別売上推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-400">データがありません</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">チャネル別売上推移</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) =>
                  value >= 1000000
                    ? `${(value / 1000000).toFixed(1)}M`
                    : value >= 1000
                    ? `${(value / 1000).toFixed(0)}K`
                    : value.toString()
                }
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number | undefined) => `¥${value?.toLocaleString() ?? '-'}`}
                labelStyle={{ color: '#374151' }}
              />
              <Legend />
              {data.data.map((item) => (
                <Line
                  key={item.name}
                  type="monotone"
                  dataKey={item.name}
                  stroke={CHANNEL_COLORS[item.name] || '#9ca3af'}
                  strokeWidth={2}
                  dot={{ fill: CHANNEL_COLORS[item.name] || '#9ca3af', r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
