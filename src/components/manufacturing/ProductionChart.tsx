/**
 * 生産量推移グラフ
 * 月次生産量と人員の推移を表示
 */
'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatNumber } from '@/lib/format'
import type { ManufacturingChartData } from '@/types/manufacturing'

interface Props {
  data: ManufacturingChartData[]
  loading?: boolean
}

export function ProductionChart({ data, loading = false }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>生産量推移</CardTitle>
          <CardDescription>月次生産量と人員</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  // 月名を短くフォーマット
  const formatMonth = (month: string): string => {
    const match = month.match(/(\d+)月/)
    return match ? `${match[1]}月` : month
  }

  const chartData = data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }))

  // ツールチップのフォーマット
  const formatTooltip = (value: number | null): string => {
    if (value === null) return '-'
    return formatNumber(value, '')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>生産量推移</CardTitle>
        <CardDescription>月次生産量と人員の推移</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{
                  value: 'バット',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                label={{
                  value: '人',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                formatter={(value) => formatTooltip(typeof value === 'number' ? value : null)}
                labelFormatter={(label) => `${String(label)}`}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="total_batts"
                name="生産量"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total_workers"
                name="人員"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
