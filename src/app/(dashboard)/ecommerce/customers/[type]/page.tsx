/**
 * 顧客別詳細ページ
 */
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format, subMonths } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FiscalMonthSelector } from '@/components/dashboard/FiscalMonthSelector'
import { useCustomerDetail } from '@/hooks/useEcommerce'
import {
  formatCurrency,
  formatNumber,
  formatYoY,
  isPositiveYoY,
  PeriodType,
} from '@/types/ecommerce'
import { cn } from '@/lib/utils'

const TYPE_LABELS: Record<string, string> = {
  new: '新規顧客',
  repeat: 'リピーター',
}

export default function CustomerDetailPage() {
  const params = useParams()
  const customerType = params.type as string
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'))
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')

  const label = TYPE_LABELS[customerType] || customerType
  const { data, loading, error } = useCustomerDetail(customerType, month, periodType)

  const stats = data?.data

  const rows = stats
    ? [
        {
          label: '売上高',
          value: stats.sales != null ? formatCurrency(stats.sales) : '-',
          previousYear: stats.sales_previous_year != null ? formatCurrency(stats.sales_previous_year) : '-',
          yoy: stats.sales_yoy,
        },
        {
          label: '販売個数',
          value: stats.quantity != null ? formatNumber(stats.quantity) : '-',
          previousYear: stats.quantity_previous_year != null ? formatNumber(stats.quantity_previous_year) : '-',
          yoy: stats.quantity_yoy,
        },
        {
          label: '顧客単価',
          value: stats.unit_price != null ? formatCurrency(stats.unit_price) : '-',
          previousYear: stats.unit_price_previous_year != null ? formatCurrency(stats.unit_price_previous_year) : '-',
          yoy: stats.unit_price_yoy,
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/ecommerce"
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{label} - 詳細</h1>
            <p className="text-sm text-gray-500 mt-1">売上・販売個数・顧客単価</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
            <button
              onClick={() => setPeriodType('monthly')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
                periodType === 'monthly'
                  ? 'bg-green-600 text-white'
                  : 'bg-card text-gray-600 hover:bg-gray-50'
              )}
            >
              単月
            </button>
            <button
              onClick={() => setPeriodType('cumulative')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 whitespace-nowrap',
                periodType === 'cumulative'
                  ? 'bg-green-600 text-white'
                  : 'bg-card text-gray-600 hover:bg-gray-50'
              )}
            >
              累計
            </button>
          </div>
          <FiscalMonthSelector value={month} onChange={setMonth} />
        </div>
      </div>

      {/* 詳細テーブル */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{label}詳細</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">読み込み中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : !stats ? (
            <div className="text-center py-8 text-gray-400">データがありません</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">項目</TableHead>
                    <TableHead className="text-right w-[120px]">実績</TableHead>
                    <TableHead className="text-right w-[120px]">前年</TableHead>
                    <TableHead className="text-right w-[80px]">前年比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.label} className="hover:bg-gray-50">
                      <TableCell className="font-medium py-2 px-2">
                        {row.label}
                      </TableCell>
                      <TableCell className="text-right font-mono py-2 px-2">
                        {row.value}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-500 py-2 px-2">
                        {row.previousYear}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono py-2 px-2",
                        row.yoy != null && (isPositiveYoY(row.yoy) ? 'text-green-600' : 'text-red-600')
                      )}>
                        {formatYoY(row.yoy)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
