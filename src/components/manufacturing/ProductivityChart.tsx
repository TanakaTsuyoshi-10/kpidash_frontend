/**
 * 生産性推移グラフ
 * 一人あたり生産量の推移を表示
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'
import type { ManufacturingChartData } from '@/types/manufacturing'

interface Props {
  data: ManufacturingChartData[]
  loading?: boolean
}

export function ProductivityChart({ data, loading = false }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>生産性推移</CardTitle>
          <CardDescription>一人あたり生産量</CardDescription>
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

  // 平均値を計算
  const validValues = data
    .map((d) => d.avg_production_per_worker)
    .filter((v): v is number => v !== null)
  const avgProductivity = validValues.length > 0
    ? validValues.reduce((a, b) => a + b, 0) / validValues.length
    : null

  // ツールチップのフォーマット
  const formatTooltip = (value: number | null): string => {
    if (value === null || value === undefined) return '-'
    const num = typeof value === 'number' ? value : Number(value)
    if (isNaN(num)) return '-'
    return num.toFixed(2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>生産性推移</CardTitle>
        <CardDescription>
          一人あたり生産量（バット/人）
          {avgProductivity !== null && (
            <span className="ml-2 text-blue-600">
              平均: {avgProductivity.toFixed(2)}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
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
                tick={{ fontSize: 12 }}
                domain={['auto', 'auto']}
                label={{
                  value: 'バット/人',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                formatter={(value) => formatTooltip(typeof value === 'number' ? value : null)}
                labelFormatter={(label) => `${String(label)}`}
              />
              <Legend />
              {avgProductivity !== null && (
                <ReferenceLine
                  y={avgProductivity}
                  stroke="#94a3b8"
                  strokeDasharray="5 5"
                  label={{
                    value: '平均',
                    position: 'right',
                    fill: '#64748b',
                    fontSize: 12,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="avg_production_per_worker"
                name="生産性"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ r: 4, fill: '#f97316' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
