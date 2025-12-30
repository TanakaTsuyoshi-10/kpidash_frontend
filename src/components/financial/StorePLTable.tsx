/**
 * 店舗別収支テーブル
 * 店舗ごとのP/Lを表示、販管費は展開可能
 */
'use client'

import { useState, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StorePLListResponse, StorePL, StorePLSGADetail } from '@/types/financial'

interface Props {
  data: StorePLListResponse | null
  loading?: boolean
}

// 数値フォーマット（カンマ区切り＋円）
function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '-'
  return `¥${value.toLocaleString()}`
}

// 前年比フォーマット（変化率: 0基準）
function formatYoY(value: number | null): string {
  if (value === null || value === undefined) return '-'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

// 前年比の色
function getYoYColor(value: number | null): string {
  if (value === null) return 'text-gray-500'
  return value >= 0 ? 'text-green-600' : 'text-red-600'
}

// 明細行の型
interface SGADetailItem {
  name: string
  value: number
}

export function StorePLTable({ data, loading }: Props) {
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set())

  const toggleStore = (storeId: string) => {
    setExpandedStores((prev) => {
      const next = new Set(prev)
      if (next.has(storeId)) {
        next.delete(storeId)
      } else {
        next.add(storeId)
      }
      return next
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">店舗別収支</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasStores = data && data.stores && data.stores.length > 0

  // 販管費明細を取得
  const getSGADetails = (detail: StorePLSGADetail | null): SGADetailItem[] => {
    if (!detail) return []

    return [
      { name: '人件費', value: detail.personnel_cost },
      { name: '地代家賃', value: detail.land_rent },
      { name: '賃借料', value: detail.lease_cost },
      { name: '水道光熱費', value: detail.utilities },
      { name: 'その他', value: detail.others },
    ].filter(item => item.value !== 0)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">店舗別収支</CardTitle>
        {data?.period && <p className="text-sm text-gray-500">{data.period}</p>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">店舗名</TableHead>
                <TableHead className="text-right">売上高</TableHead>
                <TableHead className="text-right">売上原価</TableHead>
                <TableHead className="text-right">売上総利益</TableHead>
                <TableHead className="text-right">販管費</TableHead>
                <TableHead className="text-right">営業利益</TableHead>
                <TableHead className="text-right w-[80px]">売上前年比</TableHead>
                <TableHead className="text-right w-[80px]">利益前年比</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasStores ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                    店舗別収支データがありません
                  </TableCell>
                </TableRow>
              ) : (
                <>
              {data.stores.map((store) => {
                const isOpen = expandedStores.has(store.store_id)
                const sgaDetails = getSGADetails(store.sga_detail)
                const hasDetails = sgaDetails.length > 0

                return (
                  <Fragment key={store.store_id}>
                    {/* 店舗行 */}
                    <TableRow
                      onClick={() => hasDetails && toggleStore(store.store_id)}
                      className={cn(
                        'hover:bg-gray-50',
                        hasDetails && 'cursor-pointer'
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          {hasDetails ? (
                            isOpen ? (
                              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            )
                          ) : (
                            <span className="w-4" />
                          )}
                          <span className="truncate">{store.store_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(store.sales)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(store.cost_of_sales)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(store.gross_profit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(store.sga_total)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(store.operating_profit)}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono', getYoYColor(store.sales_yoy_rate))}>
                        {formatYoY(store.sales_yoy_rate)}
                      </TableCell>
                      <TableCell className={cn('text-right font-mono', getYoYColor(store.operating_profit_yoy_rate))}>
                        {formatYoY(store.operating_profit_yoy_rate)}
                      </TableCell>
                    </TableRow>

                    {/* 販管費明細（展開時） */}
                    {isOpen && sgaDetails.map((item) => (
                      <TableRow key={`${store.store_id}-${item.name}`} className="bg-gray-50/50">
                        <TableCell className="pl-8 text-sm text-gray-600">
                          {item.name}
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                        <TableCell className="text-right font-mono text-sm text-gray-600">
                          {formatCurrency(item.value)}
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                )
              })}

              {/* 合計行 */}
              <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-300">
                <TableCell className="font-bold">合計</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.total_sales ?? null)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.total_cost_of_sales ?? null)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.total_gross_profit ?? null)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.total_sga ?? null)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(data?.total_operating_profit ?? null)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
