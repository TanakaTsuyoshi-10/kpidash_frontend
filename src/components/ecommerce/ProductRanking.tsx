/**
 * 商品別売上ランキング
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
  formatYoY,
  isPositiveYoY,
  PeriodType,
} from '@/types/ecommerce'
import { cn } from '@/lib/utils'

interface Props {
  month: string
  periodType: PeriodType
  limit?: number
}

export function ProductRanking({ month, periodType, limit = 10 }: Props) {
  const { data, loading, error } = useProductSummary(month, periodType, limit)

  const isCumulative = periodType === 'cumulative'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品別売上ランキング</CardTitle>
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
          <CardTitle className="text-lg">商品別売上ランキング</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">商品別売上ランキング</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">データがありません</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">商品別売上ランキング</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center py-1 px-2">#</TableHead>
                <TableHead className="py-1 px-2">商品名</TableHead>
                <TableHead className="text-right py-1 px-2">売上高</TableHead>
                <TableHead className="text-right py-1 px-2">前年</TableHead>
                {isCumulative && <TableHead className="text-right py-1 px-2">前々年</TableHead>}
                <TableHead className="text-right py-1 px-2">前年比</TableHead>
                {isCumulative && <TableHead className="text-right py-1 px-2">前々年比</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.products.map((product, index) => (
                <TableRow key={product.product_name} className="hover:bg-gray-50">
                  <TableCell className="text-center font-bold text-gray-500 py-1.5 px-2">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium py-1.5 px-2">
                    <div className="truncate max-w-[200px]" title={product.product_name}>
                      {product.product_name}
                    </div>
                    {product.product_category && (
                      <div className="text-xs text-gray-400">{product.product_category}</div>
                    )}
                  </TableCell>
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
                    isPositiveYoY(product.sales_yoy) ? 'text-green-600' : 'text-red-600'
                  )}>
                    {formatYoY(product.sales_yoy)}
                  </TableCell>
                  {isCumulative && (
                    <TableCell className={cn(
                      "text-right font-mono py-1.5 px-2",
                      isPositiveYoY(product.sales_yoy_two_years) ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatYoY(product.sales_yoy_two_years)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.total_sales != null && (
          <div className="mt-4 px-4 pt-4 border-t text-sm text-gray-600">
            <span className="font-medium">商品売上合計:</span>{' '}
            <span className="font-mono">{formatCurrency(data.total_sales)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
