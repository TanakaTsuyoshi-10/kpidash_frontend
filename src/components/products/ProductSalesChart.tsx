/**
 * 商品グループ別 月次推移グラフ
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProductTrend, useProductGroups } from '@/hooks/useProduct'
import { formatCurrency, formatYoY } from '@/types/product'

interface Props {
  selectedProduct: string
  onProductChange: (product: string) => void
  departmentSlug?: string
}

export function ProductSalesChart({
  selectedProduct,
  onProductChange,
  departmentSlug = 'store',
}: Props) {
  const { data: productGroups, loading: groupsLoading } = useProductGroups(departmentSlug)
  const { data: trendData, loading: trendLoading, error } = useProductTrend(
    selectedProduct,
    undefined,
    departmentSlug
  )

  const loading = groupsLoading || trendLoading

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>商品グループ別 売上推移</CardTitle>
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
          <CardTitle>商品グループ別 売上推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-red-600">{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // グラフデータの変換（サマリーデータを使用）
  const graphData = trendData?.months.map((month, index) => ({
    month,
    実績: trendData.summary.actual[index] ?? 0,
    前年: trendData.summary.previous_year[index] ?? 0,
  })) ?? []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>商品グループ別 売上推移</CardTitle>
          {trendData && (
            <p className="text-sm text-gray-500 mt-1">
              累計: {formatCurrency(trendData.summary.total)} /
              前年: {formatCurrency(trendData.summary.total_previous_year)}
              {' '}
              <span className={trendData.summary.yoy_rate != null && trendData.summary.yoy_rate >= 0 ? 'text-green-600' : 'text-red-600'}>
                ({formatYoY(trendData.summary.yoy_rate)})
              </span>
            </p>
          )}
        </div>
        <Select value={selectedProduct} onValueChange={onProductChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="商品を選択" />
          </SelectTrigger>
          <SelectContent>
            {productGroups.map((group) => (
              <SelectItem key={group.id} value={group.name}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!trendData || graphData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-400">
              {selectedProduct ? 'データがありません' : '商品を選択してください'}
            </span>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graphData}>
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
                      return `¥${value.toLocaleString()}`
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
                  dataKey="前年"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#9ca3af' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
