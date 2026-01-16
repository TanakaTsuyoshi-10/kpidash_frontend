/**
 * 店舗×商品グループ マトリックス表（前年比較付き）
 * 単月/累計切替、色分けヘッダー付き
 */
'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useProductMatrix, PeriodType } from '@/hooks/useProduct'
import { formatCurrency, formatYoY, isPositiveYoY } from '@/types/product'
import { cn } from '@/lib/utils'

interface Props {
  month: string
  departmentSlug?: string
}

// 商品グループの色設定
const PRODUCT_COLORS = [
  { bg: 'bg-emerald-50', bgHalf: 'bg-emerald-50/50', text: 'text-emerald-800', border: 'border-emerald-200' },
  { bg: 'bg-blue-50', bgHalf: 'bg-blue-50/50', text: 'text-blue-800', border: 'border-blue-200' },
  { bg: 'bg-amber-50', bgHalf: 'bg-amber-50/50', text: 'text-amber-800', border: 'border-amber-200' },
  { bg: 'bg-purple-50', bgHalf: 'bg-purple-50/50', text: 'text-purple-800', border: 'border-purple-200' },
  { bg: 'bg-rose-50', bgHalf: 'bg-rose-50/50', text: 'text-rose-800', border: 'border-rose-200' },
  { bg: 'bg-cyan-50', bgHalf: 'bg-cyan-50/50', text: 'text-cyan-800', border: 'border-cyan-200' },
]

export function ProductSalesMatrix({ month, departmentSlug = 'store' }: Props) {
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const { data, loading, error } = useProductMatrix(month, departmentSlug, periodType)

  // 日付をパース
  const [year, monthNum] = month.substring(0, 7).split('-').map(Number)

  // 会計年度の開始年を計算（9月起点）
  const fiscalYearStart = monthNum >= 9 ? year : year - 1

  // 累計モードかどうか
  const isCumulative = periodType === 'cumulative'

  // タイトル
  const title = isCumulative
    ? `店舗別×商品グループ 売上 累計（${fiscalYearStart}/9〜${year}/${monthNum}）`
    : `店舗別×商品グループ 売上（${year}/${monthNum}）`

  // 期間タイプ切り替えボタン
  const PeriodTypeToggle = () => (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
      <button
        onClick={() => setPeriodType('monthly')}
        className={cn(
          'px-3 py-1 text-sm font-medium transition-colors whitespace-nowrap',
          periodType === 'monthly'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        )}
      >
        単月
      </button>
      <button
        onClick={() => setPeriodType('cumulative')}
        className={cn(
          'px-3 py-1 text-sm font-medium transition-colors border-l border-gray-200 whitespace-nowrap',
          periodType === 'cumulative'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        )}
      >
        累計
      </button>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg shrink-0">{title}</CardTitle>
            <PeriodTypeToggle />
          </div>
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
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg shrink-0">{title}</CardTitle>
            <PeriodTypeToggle />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.stores.length === 0 || data.product_groups.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg shrink-0">{title}</CardTitle>
            <PeriodTypeToggle />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            データがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  const productGroups = data.product_groups

  // 各商品グループの列数
  const colsPerProduct = isCumulative ? 5 : 3

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg shrink-0">{title}</CardTitle>
          <PeriodTypeToggle />
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              {/* 商品グループヘッダー */}
              <TableRow className="border-b-0">
                <TableHead
                  rowSpan={2}
                  className="sticky left-0 z-20 bg-white border-r-2 border-gray-300 align-bottom min-w-[100px]"
                >
                  <div className="py-1">店舗名</div>
                </TableHead>
                {productGroups.map((name, index) => {
                  const color = PRODUCT_COLORS[index % PRODUCT_COLORS.length]
                  const isLast = index === productGroups.length - 1
                  return (
                    <TableHead
                      key={name}
                      colSpan={colsPerProduct}
                      className={cn(
                        'text-center font-bold py-1 whitespace-nowrap',
                        color.bg,
                        color.text,
                        !isLast && 'border-r-2 border-gray-300'
                      )}
                    >
                      {name}
                    </TableHead>
                  )
                })}
                <TableHead
                  rowSpan={2}
                  className="text-right font-bold border-l-2 border-gray-300 align-bottom bg-gray-100"
                >
                  <div className="py-1">合計</div>
                </TableHead>
              </TableRow>
              {/* サブヘッダー（実績/前年/前々年/前年比/前々年比） */}
              <TableRow>
                {productGroups.map((name, index) => {
                  const color = PRODUCT_COLORS[index % PRODUCT_COLORS.length]
                  const isLast = index === productGroups.length - 1
                  return (
                    <Fragment key={name}>
                      <TableHead className={cn('text-right py-1 px-2 whitespace-nowrap', color.bgHalf)}>
                        実績
                      </TableHead>
                      <TableHead className={cn('text-right py-1 px-2 whitespace-nowrap', color.bgHalf)}>
                        前年
                      </TableHead>
                      {isCumulative && (
                        <TableHead className={cn('text-right py-1 px-2 whitespace-nowrap', color.bgHalf)}>
                          前々年
                        </TableHead>
                      )}
                      <TableHead className={cn(
                        'text-right py-1 px-2 whitespace-nowrap',
                        color.bgHalf,
                        !isCumulative && !isLast && 'border-r-2 border-gray-300'
                      )}>
                        前年比
                      </TableHead>
                      {isCumulative && (
                        <TableHead className={cn(
                          'text-right py-1 px-2 whitespace-nowrap',
                          color.bgHalf,
                          !isLast && 'border-r-2 border-gray-300'
                        )}>
                          前々年比
                        </TableHead>
                      )}
                    </Fragment>
                  )
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stores.map((store) => (
                <TableRow key={store.segment_id} className="hover:bg-gray-50">
                  <TableCell className="sticky left-0 z-10 bg-white border-r-2 border-gray-300 font-medium py-1.5 px-2">
                    <Link
                      href={`/products/${store.segment_id}?month=${month}`}
                      className="text-green-600 hover:text-green-800 hover:underline whitespace-nowrap"
                    >
                      {store.segment_name}
                    </Link>
                  </TableCell>
                  {productGroups.map((name, index) => {
                    const product = store.products[name]
                    const yoyPositive = isPositiveYoY(product?.yoy_rate)
                    const yoyTwoYearsPositive = isPositiveYoY(product?.yoy_rate_two_years)
                    const isLast = index === productGroups.length - 1
                    return (
                      <Fragment key={name}>
                        <TableCell className="text-right font-mono py-1.5 px-2">
                          {formatCurrency(product?.actual)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                          {formatCurrency(product?.previous_year)}
                        </TableCell>
                        {isCumulative && (
                          <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                            {formatCurrency(product?.two_years_ago)}
                          </TableCell>
                        )}
                        <TableCell
                          className={cn(
                            'text-right font-mono py-1.5 px-2',
                            yoyPositive ? 'text-green-600' : 'text-red-600',
                            !isCumulative && !isLast && 'border-r-2 border-gray-300'
                          )}
                        >
                          {formatYoY(product?.yoy_rate)}
                        </TableCell>
                        {isCumulative && (
                          <TableCell
                            className={cn(
                              'text-right font-mono py-1.5 px-2',
                              yoyTwoYearsPositive ? 'text-green-600' : 'text-red-600',
                              !isLast && 'border-r-2 border-gray-300'
                            )}
                          >
                            {formatYoY(product?.yoy_rate_two_years)}
                          </TableCell>
                        )}
                      </Fragment>
                    )
                  })}
                  <TableCell className="text-right font-mono font-bold border-l-2 border-gray-300 py-1.5 px-2">
                    {formatCurrency(store.total)}
                  </TableCell>
                </TableRow>
              ))}
              {/* 合計行 */}
              <TableRow className="bg-gray-100 font-bold border-t-2 border-gray-400">
                <TableCell className="sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 py-1.5 px-2">
                  合計
                </TableCell>
                {productGroups.map((name, index) => {
                  const total = data.totals[name]
                  const yoyPositive = isPositiveYoY(total?.yoy_rate)
                  const yoyTwoYearsPositive = isPositiveYoY(total?.yoy_rate_two_years)
                  const isLast = index === productGroups.length - 1
                  return (
                    <Fragment key={name}>
                      <TableCell className="text-right font-mono py-1.5 px-2">
                        {formatCurrency(total?.actual)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-gray-500 py-1.5 px-2">
                        {formatCurrency(total?.previous_year)}
                      </TableCell>
                      {isCumulative && (
                        <TableCell className="text-right font-mono text-gray-400 py-1.5 px-2">
                          {formatCurrency(total?.two_years_ago)}
                        </TableCell>
                      )}
                      <TableCell
                        className={cn(
                          'text-right font-mono py-1.5 px-2',
                          yoyPositive ? 'text-green-600' : 'text-red-600',
                          !isCumulative && !isLast && 'border-r-2 border-gray-300'
                        )}
                      >
                        {formatYoY(total?.yoy_rate)}
                      </TableCell>
                      {isCumulative && (
                        <TableCell
                          className={cn(
                            'text-right font-mono py-1.5 px-2',
                            yoyTwoYearsPositive ? 'text-green-600' : 'text-red-600',
                            !isLast && 'border-r-2 border-gray-300'
                          )}
                        >
                          {formatYoY(total?.yoy_rate_two_years)}
                        </TableCell>
                      )}
                    </Fragment>
                  )
                })}
                <TableCell className="text-right font-mono border-l-2 border-gray-300 py-1.5 px-2">
                  {formatCurrency(
                    data.stores.reduce((sum, s) => sum + (s.total ?? 0), 0)
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
