/**
 * 店舗詳細ページ
 * 商品ごとの販売状況（売上、客単価、前年比較）を表示
 * 単月/累計（年度累計 = 9月〜対象月）の切替に対応
 */
'use client'

import { use, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format, subMonths } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FiscalMonthSelector } from '@/components/dashboard/FiscalMonthSelector'
import { ProductItemsTable } from '@/components/products/ProductItemsTable'
import { StorePLSummaryCard } from '@/components/products/StorePLSummaryCard'
import { DeliverySalesCard } from '@/components/products/DeliverySalesCard'
import { WeekdayAnalysis } from '@/components/daily-sales/WeekdayAnalysis'
import { StoreHourlyCustomersHeatmap } from '@/components/daily-sales/StoreHourlyCustomersHeatmap'
import { useStoreDetail } from '@/hooks/useStoreDetail'
import { cn } from '@/lib/utils'

interface Props {
  params: Promise<{ segmentId: string }>
}

type StorePeriodType = 'monthly' | 'cumulative'

// 通貨フォーマット
function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return `¥${value.toLocaleString()}`
}

// 前年比フォーマット（変化率: 0基準）
function formatYoY(rate: number | null | undefined): string {
  if (rate == null) return '-'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

export default function StoreDetailPage({ params }: Props) {
  const { segmentId } = use(params)
  const searchParams = useSearchParams()
  const defaultMonth = format(subMonths(new Date(), 1), 'yyyy-MM-01')
  const initialMonth = searchParams.get('month') || defaultMonth

  const [month, setMonthValue] = useState(initialMonth)
  const [periodType, setPeriodType] = useState<StorePeriodType>('monthly')

  const { data, loading, error, setMonth } = useStoreDetail(segmentId, month, periodType)

  // 月変更時にAPIを呼び出し、URLも更新
  useEffect(() => {
    setMonth(month)
    const url = new URL(window.location.href)
    url.searchParams.set('month', month)
    window.history.replaceState({}, '', url.toString())
  }, [month, setMonth])

  // 期間ラベル
  const [yearNum, monthNum] = month.substring(0, 7).split('-').map(Number)
  const fiscalYearStart = monthNum >= 9 ? yearNum : yearNum - 1
  const isCumulative = periodType === 'cumulative'
  const displayMonth = `${yearNum}年${monthNum}月`
  const periodLabel = isCumulative
    ? `${fiscalYearStart}年9月〜${yearNum}年${monthNum}月 累計`
    : displayMonth

  // 単月/累計トグル
  const PeriodTypeToggle = () => (
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
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-400">読み込み中...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              戻る
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {data?.segment_name || '店舗詳細'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <FiscalMonthSelector value={month} onChange={setMonthValue} />
          <PeriodTypeToggle />
        </div>
      </div>

      {/* 店舗サマリー */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">売上合計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.total_sales)}</div>
              <div className={cn(
                'text-sm',
                data.total_sales_yoy != null && data.total_sales_yoy >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                前年比: {formatYoY(data.total_sales_yoy)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">客数合計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.total_customers?.toLocaleString() ?? '-'}人</div>
              <div className={cn(
                'text-sm',
                data.total_customers_yoy != null && data.total_customers_yoy >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                前年比: {formatYoY(data.total_customers_yoy)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">客単価</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.avg_unit_price)}</div>
              <div className={cn(
                'text-sm',
                data.avg_unit_price_yoy != null && data.avg_unit_price_yoy >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                前年比: {formatYoY(data.avg_unit_price_yoy)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">対象期間</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn('font-bold', isCumulative ? 'text-lg' : 'text-2xl')}>
                {isCumulative ? `${fiscalYearStart}/9〜${yearNum}/${monthNum} 累計` : displayMonth}
              </div>
              <div className="text-sm text-gray-500">{fiscalYearStart}年度</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 収支実績 */}
      <StorePLSummaryCard
        segmentId={segmentId}
        month={month}
        periodType={periodType}
        periodLabel={periodLabel}
      />

      {/* 曜日別分析（平日 / 土日祝） */}
      <div>
        <h2 className="text-lg font-bold mb-3">曜日別分析 ({periodLabel})</h2>
        <WeekdayAnalysis month={month} segmentId={segmentId} periodType={periodType} />
      </div>

      {/* 時間帯別来客ヒートマップ（単月=日別×時間帯 / 累計=月別×時間帯） */}
      <StoreHourlyCustomersHeatmap
        segmentId={segmentId}
        month={month}
        displayMonth={periodLabel}
        periodType={periodType}
      />

      {/* 宅配関連売上 */}
      <DeliverySalesCard
        segmentId={segmentId}
        month={month}
        displayMonth={periodLabel}
        periodType={periodType}
      />

      {/* 商品グループ別販売状況 */}
      <Card>
        <CardHeader>
          <CardTitle>商品グループ別販売状況 ({periodLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.products.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              データがありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">商品グループ</TableHead>
                    <TableHead className="text-right">売上</TableHead>
                    <TableHead className="text-right">前年売上</TableHead>
                    <TableHead className="text-right">売上前年比</TableHead>
                    <TableHead className="text-right">客単価</TableHead>
                    <TableHead className="text-right">前年客単価</TableHead>
                    <TableHead className="text-right">客単価前年比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((product) => (
                    <TableRow key={product.product_group}>
                      <TableCell className="font-medium">{product.product_group}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(product.sales)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-500">
                        {formatCurrency(product.sales_previous_year)}
                      </TableCell>
                      <TableCell className={cn(
                        'text-right font-mono text-sm',
                        product.sales_yoy != null && product.sales_yoy >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatYoY(product.sales_yoy)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(product.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-500">
                        {formatCurrency(product.unit_price_previous_year)}
                      </TableCell>
                      <TableCell className={cn(
                        'text-right font-mono text-sm',
                        product.unit_price_yoy != null && product.unit_price_yoy >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatYoY(product.unit_price_yoy)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 個別商品販売状況 */}
      <ProductItemsTable
        items={data?.product_items || []}
        displayMonth={periodLabel}
      />
    </div>
  )
}
