/**
 * 売上・利益推移グラフ
 * 複合グラフ（棒グラフ: 売上、折れ線: 営業利益）
 */
'use client'

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import type { ChartDataPoint } from '@/types/dashboard'

interface Props {
  chartData: ChartDataPoint[]
  loading?: boolean
}

export function SalesChart({ chartData, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">売上・利益推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse w-full h-full bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">売上・利益推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  // データを整形
  const data = chartData.map((point) => ({
    month: point.month.slice(5), // YYYY-MM → MM月表示
    売上高: point.sales,
    営業利益: point.operating_profit,
    売上目標: point.sales_target,
    利益目標: point.operating_profit_target,
  }))

  // Y軸のフォーマット
  const formatYAxis = (value: number) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(0)}億`
    }
    if (value >= 10000) {
      return `${(value / 10000).toFixed(0)}万`
    }
    return value.toLocaleString()
  }

  // ツールチップのフォーマット
  const formatTooltip = (value: number | null) => {
    if (value === null) return '-'
    return formatCurrency(value, false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">売上・利益推移</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${parseInt(value)}月`}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => formatTooltip(typeof value === 'number' ? value : null)}
                labelFormatter={(label) => `${parseInt(String(label))}月`}
              />
              <Legend />
              {/* 売上高 - 棒グラフ */}
              <Bar
                yAxisId="left"
                dataKey="売上高"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              {/* 売上目標 - 点線 */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="売上目標"
                stroke="#9ca3af"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
              />
              {/* 営業利益 - 折れ線 */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="営業利益"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
              {/* 利益目標 - 点線 */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="利益目標"
                stroke="#9ca3af"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
