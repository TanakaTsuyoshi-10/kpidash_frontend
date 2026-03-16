/**
 * チャネル別商品売上詳細ページ
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
import { useChannelProducts } from '@/hooks/useEcommerce'
import {
  formatCurrency,
  formatNumber,
  formatYoY,
  isPositiveYoY,
  PeriodType,
} from '@/types/ecommerce'
import { cn } from '@/lib/utils'

export default function ChannelProductsPage() {
  const params = useParams()
  const channel = decodeURIComponent(params.channel as string)
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'))
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')

  const { data, loading, error } = useChannelProducts(channel, month, periodType)

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
            <h1 className="text-2xl font-bold">{channel} - 商品別売上</h1>
            <p className="text-sm text-gray-500 mt-1">チャネル別商品売上詳細</p>
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

      {/* 商品別売上テーブル */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">商品別売上</CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">読み込み中...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : !data || data.products.length === 0 ? (
            <div className="text-center py-8 text-gray-400">データがありません</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">商品名</TableHead>
                    <TableHead className="text-right w-[100px]">売上高</TableHead>
                    <TableHead className="text-right w-[100px]">前年</TableHead>
                    <TableHead className="text-right w-[70px]">前年比</TableHead>
                    <TableHead className="text-right w-[80px]">販売個数</TableHead>
                    <TableHead className="text-right w-[80px]">前年</TableHead>
                    <TableHead className="text-right w-[70px]">前年比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((product) => (
                    <TableRow key={product.product_name} className="hover:bg-gray-50">
                      <TableCell className="font-medium py-1.5 px-2">
                        {product.product_name}
                      </TableCell>
                      <TableCell className="text-right font-mono py-1.5 px-2">
                        {formatCurrency(product.sales)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                        {formatCurrency(product.sales_previous_year)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono py-1.5 px-2",
                        product.sales_yoy != null && (isPositiveYoY(product.sales_yoy) ? 'text-green-600' : 'text-red-600')
                      )}>
                        {formatYoY(product.sales_yoy)}
                      </TableCell>
                      <TableCell className="text-right font-mono py-1.5 px-2">
                        {formatNumber(product.quantity)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                        {formatNumber(product.quantity_previous_year)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono py-1.5 px-2",
                        product.quantity_yoy != null && (isPositiveYoY(product.quantity_yoy) ? 'text-green-600' : 'text-red-600')
                      )}>
                        {formatYoY(product.quantity_yoy)}
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
