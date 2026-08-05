/**
 * 宅配関連売上カード（店舗詳細ページ用）
 * 宅配ぎょうざ・宅配生姜ぎょうざ・宅配たれ・スープ・宅配梱包料・送料の
 * 内訳（売上・件数・前年比）と、送料の発送先地域別割合の円グラフを表示
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, ChevronRight, Truck } from 'lucide-react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useStoreDelivery } from '@/hooks/useStoreDetail'
import { cn } from '@/lib/utils'

interface Props {
  segmentId: string
  month: string
  displayMonth: string
  periodType?: 'monthly' | 'cumulative'
}

const REGION_COLORS = [
  '#059669', // emerald-600
  '#2563eb', // blue-600
  '#d97706', // amber-600
  '#dc2626', // red-600
  '#7c3aed', // violet-600
  '#0891b2', // cyan-600
  '#db2777', // pink-600
  '#65a30d', // lime-600
]

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return `¥${Math.round(value).toLocaleString()}`
}

function formatYoY(rate: number | null | undefined): string {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

export function DeliverySalesCard({ segmentId, month, displayMonth, periodType = 'monthly' }: Props) {
  const { data, loading, error } = useStoreDelivery(segmentId, month, periodType)
  // ページが長くなるためデフォルト閉
  const [open, setOpen] = useState(false)

  const hasRegions = (data?.shipping_regions.length ?? 0) > 0

  return (
    <Card>
      <CardHeader
        onClick={() => setOpen(!open)}
        className="cursor-pointer select-none hover:bg-gray-50/60 transition-colors"
      >
        <CardTitle className="flex items-center gap-2 min-h-7">
          {open ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          <span className="p-1.5 rounded-md bg-emerald-100">
            <Truck className="h-4 w-4 text-emerald-700" />
          </span>
          宅配関連売上 ({displayMonth})
          {data ? (
            <span className="ml-auto text-base font-bold tabular-nums">
              {formatCurrency(data.total_sales)}
              <span
                className={cn(
                  'ml-2 text-sm font-semibold',
                  data.total_sales_yoy != null && data.total_sales_yoy >= 0
                    ? 'text-green-600'
                    : 'text-red-600',
                )}
              >
                前年比 {formatYoY(data.total_sales_yoy)}
              </span>
            </span>
          ) : (
            !open && (
              <span className="ml-auto text-sm font-normal text-gray-400">
                {loading ? '読込中...' : '（クリックで展開）'}
              </span>
            )
          )}
        </CardTitle>
      </CardHeader>
      {open && (
      <CardContent>
        {loading && <div className="h-40 rounded-lg bg-gray-100 animate-pulse" />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 分類別内訳 */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">分類</TableHead>
                  <TableHead className="text-right">売上（税込）</TableHead>
                  <TableHead className="text-right">前年比</TableHead>
                  <TableHead className="text-right">件数</TableHead>
                  <TableHead className="text-right">前年比</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.categories.map((c) => (
                  <TableRow key={c.category}>
                    <TableCell className="font-medium">{c.category}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(c.sales)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm',
                        c.sales_yoy == null
                          ? 'text-gray-400'
                          : c.sales_yoy >= 0
                            ? 'text-green-600'
                            : 'text-red-600',
                      )}
                    >
                      {formatYoY(c.sales_yoy)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {c.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono text-sm',
                        c.quantity_yoy == null
                          ? 'text-gray-400'
                          : c.quantity_yoy >= 0
                            ? 'text-green-600'
                            : 'text-red-600',
                      )}
                    >
                      {formatYoY(c.quantity_yoy)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>合計</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(data.total_sales)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-mono text-sm',
                      data.total_sales_yoy == null
                        ? 'text-gray-400'
                        : data.total_sales_yoy >= 0
                          ? 'text-green-600'
                          : 'text-red-600',
                    )}
                  >
                    {formatYoY(data.total_sales_yoy)}
                  </TableCell>
                  <TableCell className="text-right" colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* 送料の発送先地域別割合 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              発送先地域の割合（送料件数ベース）
            </h3>
            {hasRegions ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.shipping_regions.map((r) => ({ ...r }))}
                        dataKey="count"
                        nameKey="region"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {data.shipping_regions.map((entry, i) => (
                          <Cell
                            key={entry.region}
                            fill={REGION_COLORS[i % REGION_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, item) => {
                          const share = (item?.payload as { share?: number })?.share
                          return [
                            `${Number(value).toLocaleString()}件（${share ?? '-'}%）`,
                            name,
                          ]
                        }}
                      />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        formatter={(value) => (
                          <span className="text-xs text-gray-700">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-2 py-1.5 text-left font-medium">地域</th>
                        <th className="px-2 py-1.5 text-right font-medium">件数</th>
                        <th className="px-2 py-1.5 text-right font-medium">割合</th>
                        <th className="px-2 py-1.5 text-right font-medium">送料売上</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.shipping_regions.map((r, i) => (
                        <tr key={r.region} className="border-b">
                          <td className="px-2 py-1.5">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                              style={{
                                backgroundColor: REGION_COLORS[i % REGION_COLORS.length],
                              }}
                            />
                            {r.region}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {r.count.toLocaleString()}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums font-medium">
                            {r.share.toFixed(1)}%
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {formatCurrency(r.sales)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-8 text-center">
                この月の送料データがありません。
              </p>
            )}
          </div>
        </div>
        )}
      </CardContent>
      )}
    </Card>
  )
}
