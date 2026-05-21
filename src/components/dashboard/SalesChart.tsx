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

  // データを整形（前年比較対応）
  const data = chartData.map((point) => ({
    month: point.month.slice(5), // YYYY-MM → MM月表示
    当年売上: point.sales,
    前年売上: point.sales_previous_year ?? null,
    当年営業利益: point.operating_profit,
    前年営業利益: point.operating_profit_previous_year ?? null,
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">売上・利益トレンド推移（12ヶ月）</CardTitle>
          <span className="text-xs text-gray-400">前年と比較</span>
        </div>
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
              {/* 当年売上 - 棒グラフ（緑） */}
              <Bar
                yAxisId="left"
                dataKey="当年売上"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              {/* 前年売上 - 棒グラフ（グレー） */}
              <Bar
                yAxisId="left"
                dataKey="前年売上"
                fill="#d1d5db"
                radius={[4, 4, 0, 0]}
              />
              {/* 当年営業利益 - 折れ線 */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="当年営業利益"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 2 }}
                connectNulls
              />
              {/* 前年営業利益 - 折れ線（破線） */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="前年営業利益"
                stroke="#fcd34d"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
