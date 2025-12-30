/**
 * 店舗別売上推移グラフ
 * 全店舗表示 / 選択店舗の前々年比較を同一グラフで切替
 */
'use client'

import { useState, useMemo } from 'react'
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
import { useStoreTrendAll, useStoreTrendSingle } from '@/hooks/useStoreTrend'

interface Props {
  departmentSlug?: string
}

// 店舗ごとの色
const STORE_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#6366f1', '#a855f7', '#10b981', '#f43f5e', '#0ea5e9',
]

export function StoreTrendChart({ departmentSlug = 'store' }: Props) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)

  const { data: allData, loading: allLoading, error: allError } = useStoreTrendAll(departmentSlug)
  const { data: singleData, loading: singleLoading } = useStoreTrendSingle(
    selectedStoreId,
    departmentSlug
  )

  // 全店舗グラフ用データ
  const allStoresGraphData = useMemo(() => {
    if (!allData) return []

    return allData.months.map((month, index) => {
      const dataPoint: Record<string, string | number | null> = { month }
      allData.stores.forEach((store) => {
        dataPoint[store.segment_name] = store.values[index]
      })
      return dataPoint
    })
  }, [allData])

  // 選択店舗グラフ用データ
  const singleStoreGraphData = useMemo(() => {
    if (!singleData) return []

    return singleData.months.map((month, index) => ({
      month,
      当年: singleData.actual[index],
      前年: singleData.previous_year[index],
      前々年: singleData.two_years_ago[index],
    }))
  }, [singleData])

  // 店舗リスト
  const storeList = useMemo(() => {
    if (!allData) return []
    return allData.stores.map((s) => ({
      id: s.segment_id,
      name: s.segment_name,
    }))
  }, [allData])

  // 選択中の店舗名
  const selectedStoreName = useMemo(() => {
    if (!selectedStoreId) return null
    return storeList.find(s => s.id === selectedStoreId)?.name ?? null
  }, [selectedStoreId, storeList])

  const loading = allLoading || (selectedStoreId && singleLoading)

  if (allLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>店舗別 売上推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-400">読み込み中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (allError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>店舗別 売上推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <span className="text-red-600">{allError}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 表示モード判定
  const isAllStoresMode = !selectedStoreId
  const graphData = isAllStoresMode ? allStoresGraphData : singleStoreGraphData

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {isAllStoresMode
              ? '店舗別 売上推移（全店舗）'
              : `${selectedStoreName} 売上推移（前々年比較）`}
          </CardTitle>
          {!isAllStoresMode && singleData?.summary && (
            <p className="text-sm text-gray-500 mt-1">
              当年累計: ¥{singleData.summary.total?.toLocaleString() ?? '-'} /
              前年: ¥{singleData.summary.total_previous_year?.toLocaleString() ?? '-'} /
              前々年: ¥{singleData.summary.total_two_years_ago?.toLocaleString() ?? '-'}
              {singleData.summary.yoy_rate != null && (
                <span className={singleData.summary.yoy_rate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {' '}(前年比: {singleData.summary.yoy_rate >= 0 ? '+' : ''}{singleData.summary.yoy_rate.toFixed(1)}%)
                </span>
              )}
            </p>
          )}
        </div>
        <Select
          value={selectedStoreId ?? 'all'}
          onValueChange={(v) => setSelectedStoreId(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="店舗を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全店舗表示</SelectItem>
            {storeList.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-400">読み込み中...</span>
          </div>
        ) : !graphData || graphData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <span className="text-gray-400">データがありません</span>
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
                {isAllStoresMode ? (
                  // 全店舗表示モード
                  allData?.stores.map((store, index) => (
                    <Line
                      key={store.segment_id}
                      type="monotone"
                      dataKey={store.segment_name}
                      stroke={STORE_COLORS[index % STORE_COLORS.length]}
                      strokeWidth={2}
                      dot={{ fill: STORE_COLORS[index % STORE_COLORS.length], r: 3 }}
                      connectNulls
                    />
                  ))
                ) : (
                  // 単一店舗・前々年比較モード
                  <>
                    <Line
                      type="monotone"
                      dataKey="当年"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e' }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="前年"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="前々年"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#9ca3af' }}
                      connectNulls
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
