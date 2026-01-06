/**
 * 店舗別収支テーブル（転置レイアウト）
 * 列: 店舗名、行: 売上高・売上原価・粗利益・販管費・営業利益
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { StorePLListResponse, StorePL } from '@/types/financial'

interface Props {
  data: StorePLListResponse | null
  loading?: boolean
}

// 数値に変換（文字列対応）
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? null : num
}

// 数値フォーマット（カンマ区切り＋円、小数点以下なし）
function formatCurrency(value: number | string | null | undefined): string {
  const num = toNumber(value)
  if (num === null) return '-'
  return `¥${Math.round(num).toLocaleString('ja-JP')}`
}

// 行の定義
interface RowDefinition {
  key: string
  label: string
  getValue: (store: StorePL) => number | null
  getTotal: (data: StorePLListResponse) => number | null
  isSubtotal?: boolean
  indent?: boolean
}

const rowDefinitions: RowDefinition[] = [
  {
    key: 'sales',
    label: '売上高',
    getValue: (store) => store.sales,
    getTotal: (data) => data.total_sales,
  },
  {
    key: 'cost_of_sales',
    label: '売上原価',
    getValue: (store) => store.cost_of_sales,
    getTotal: (data) => data.total_cost_of_sales,
  },
  {
    key: 'gross_profit',
    label: '粗利益',
    getValue: (store) => store.gross_profit,
    getTotal: (data) => data.total_gross_profit,
    isSubtotal: true,
  },
  {
    key: 'sga_total',
    label: '販管費',
    getValue: (store) => store.sga_total,
    getTotal: (data) => data.total_sga,
  },
  {
    key: 'operating_profit',
    label: '営業利益',
    getValue: (store) => store.operating_profit,
    getTotal: (data) => data.total_operating_profit,
    isSubtotal: true,
  },
]

export function StorePLTable({ data, loading }: Props) {
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
                <TableHead className="sticky left-0 bg-white z-10 min-w-[100px]">
                  項目
                </TableHead>
                {hasStores && data.stores.map((store) => (
                  <TableHead
                    key={store.store_id}
                    className="text-right min-w-[100px] whitespace-nowrap"
                  >
                    {store.store_name}
                  </TableHead>
                ))}
                <TableHead className="text-right min-w-[100px] bg-gray-50 font-bold">
                  合計
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasStores ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-gray-400">
                    店舗別収支データがありません
                  </TableCell>
                </TableRow>
              ) : (
                rowDefinitions.map((row) => (
                  <TableRow
                    key={row.key}
                    className={cn(
                      row.isSubtotal && 'bg-gray-50 font-semibold'
                    )}
                  >
                    <TableCell
                      className={cn(
                        'sticky left-0 bg-white z-10 font-medium',
                        row.isSubtotal && 'bg-gray-50',
                        row.indent && 'pl-6'
                      )}
                    >
                      {row.label}
                    </TableCell>
                    {data.stores.map((store) => (
                      <TableCell
                        key={store.store_id}
                        className={cn(
                          'text-right font-mono',
                          row.isSubtotal && 'bg-gray-50'
                        )}
                      >
                        {formatCurrency(row.getValue(store))}
                      </TableCell>
                    ))}
                    <TableCell
                      className={cn(
                        'text-right font-mono font-bold bg-gray-100',
                        row.isSubtotal && 'bg-gray-200'
                      )}
                    >
                      {formatCurrency(row.getTotal(data))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
