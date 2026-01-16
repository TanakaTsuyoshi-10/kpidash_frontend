/**
 * KPI推移グラフ
 */
'use client'

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
import { ChartData } from '@/hooks/useKPI'

interface Props {
  data: ChartData | null
  title?: string
  loading?: boolean
}

export function KPIChart({ data, title = '売上推移', loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-400">読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-400">データがありません</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Rechartsのデータ形式に変換
  const chartData = data.labels.map((label, index) => ({
    month: label,
    実績: data.datasets.actual[index],
    目標: data.datasets.target[index],
    前年: data.datasets.previous_year?.[index],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                tickFormatter={(value) =>
                  value >= 1000000
                    ? `${(value / 1000000).toFixed(1)}M`
                    : value.toLocaleString()
                }
              />
              <Tooltip
                formatter={(value) => {
                  if (typeof value === 'number') {
                    return value.toLocaleString() + '円'
                  }
                  return '-'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="実績"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e' }}
              />
              <Line
                type="monotone"
                dataKey="目標"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6' }}
              />
              {data.datasets.previous_year && (
                <Line
                  type="monotone"
                  dataKey="前年"
                  stroke="#9ca3af"
                  strokeWidth={1}
                  dot={{ fill: '#9ca3af' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
