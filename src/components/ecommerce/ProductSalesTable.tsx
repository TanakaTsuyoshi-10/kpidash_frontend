/**
 * 商品別売上テーブル
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
import { useProductSummary } from '@/hooks/useEcommerce'
import {
  formatCurrency,
  formatNumber,
  formatYoY,
  isPositiveYoY,
  PeriodType,
} from '@/types/ecommerce'
import { cn } from '@/lib/utils'

interface Props {
  month: string
  periodType: PeriodType
}

export function ProductSalesTable({ month, periodType }: Props) {
  const { data, loading, error } = useProductSummary(month, periodType, 50)

  const isCumulative = periodType === 'cumulative'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品別売上</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品別売上</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  const hasProducts = data && data.products.length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">商品別売上</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="border-b-0">
                <TableHead
                  rowSpan={2}
                  className="sticky left-0 z-20 bg-white border-r-2 border-gray-300 align-bottom w-[140px] min-w-[140px] max-w-[180px]"
                >
                  <div className="py-1">商品名</div>
                </TableHead>
                <TableHead
                  colSpan={isCumulative ? 5 : 3}
                  className="text-center bg-emerald-50 text-emerald-800 font-bold border-r-2 border-gray-300 py-1"
                >
                  売上高
                </TableHead>
                <TableHead
                  colSpan={isCumulative ? 3 : 2}
                  className="text-center bg-blue-50 text-blue-800 font-bold py-1"
                >
                  販売数量
                </TableHead>
              </TableRow>
              <TableRow>
                {/* 売上高 */}
                <TableHead className="text-right bg-emerald-50/50 py-1 px-3 w-[100px]">実績</TableHead>
                <TableHead className="text-right bg-emerald-50/50 py-1 px-3 w-[100px]">前年</TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-emerald-50/50 py-1 px-3 w-[100px]">前々年</TableHead>
                )}
                <TableHead className={cn(
                  "text-right bg-emerald-50/50 py-1 px-3 w-[70px]",
                  !isCumulative && "border-r-2 border-gray-300"
                )}>
                  前年比
                </TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-emerald-50/50 py-1 px-3 w-[70px] border-r-2 border-gray-300">
                    前々年比
                  </TableHead>
                )}
                {/* 販売数量 */}
                <TableHead className="text-right bg-blue-50/50 py-1 px-3 w-[80px]">実績</TableHead>
                <TableHead className="text-right bg-blue-50/50 py-1 px-3 w-[80px]">前年</TableHead>
                {isCumulative && (
                  <TableHead className="text-right bg-blue-50/50 py-1 px-3 w-[80px]">前々年</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasProducts ? (
                <TableRow>
                  <TableCell
                    colSpan={isCumulative ? 9 : 6}
                    className="text-center py-8 text-gray-400"
                  >
                    データがありません
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {data.products.map((product) => (
                <TableRow key={product.product_name} className="hover:bg-gray-50">
                  <TableCell className="sticky left-0 z-10 bg-white border-r-2 border-gray-300 font-medium py-1.5 px-2 w-[140px] min-w-[140px] max-w-[180px]">
                    <div className="truncate" title={product.product_name}>
                      {product.product_name}
                    </div>
                    {product.product_category && (
                      <div className="text-xs text-gray-400 truncate">{product.product_category}</div>
                    )}
                  </TableCell>
                  {/* 売上高 */}
                  <TableCell className="text-right font-mono py-1.5 px-2">
                    {formatCurrency(product.sales)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                    {formatCurrency(product.sales_previous_year)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                      {formatCurrency(product.sales_two_years_ago)}
                    </TableCell>
                  )}
                  <TableCell className={cn(
                    "text-right font-mono py-1.5 px-2",
                    !isCumulative && "border-r-2 border-gray-300",
                    isPositiveYoY(product.sales_yoy) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoY(product.sales_yoy)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className={cn(
                      "text-right font-mono py-1.5 px-2 border-r-2 border-gray-300",
                      isPositiveYoY(product.sales_yoy_two_years) ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatYoY(product.sales_yoy_two_years)}
                    </TableCell>
                  )}
                  {/* 販売数量 */}
                  <TableCell className="text-right font-mono py-1.5 px-2">
                    {formatNumber(product.quantity)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                    {formatNumber(product.quantity_previous_year)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                      {formatNumber(product.quantity_two_years_ago)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* 合計行 */}
              <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-400">
                <TableCell className="sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 py-1.5 px-2">
                  合計
                </TableCell>
                {/* 売上高 */}
                <TableCell className="text-right font-mono py-1.5 px-2">
                  {formatCurrency(data.total_sales)}
                </TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                  {formatCurrency(data.total_sales_previous_year)}
                </TableCell>
                {isCumulative && (
                  <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                    {formatCurrency(data.total_sales_two_years_ago)}
                  </TableCell>
                )}
                <TableCell className={cn(
                  "text-right font-mono py-1.5 px-2",
                  !isCumulative && "border-r-2 border-gray-300"
                )}>
                  -
                </TableCell>
                {isCumulative && (
                  <TableCell className="text-right font-mono py-1.5 px-2 border-r-2 border-gray-300">
                    -
                  </TableCell>
                )}
                {/* 販売数量 */}
                <TableCell className="text-right font-mono py-1.5 px-2">-</TableCell>
                <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">-</TableCell>
                {isCumulative && (
                  <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">-</TableCell>
                )}
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
