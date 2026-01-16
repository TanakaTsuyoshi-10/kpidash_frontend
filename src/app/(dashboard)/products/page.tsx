/**
 * 店舗分析ページ
 * 店舗別売上サマリーと商品×店舗マトリックスを表示
 */
'use client'

import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { StoreSummaryTable } from '@/components/products/StoreSummaryTable'
import { ProductSalesMatrix } from '@/components/products/ProductSalesMatrix'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  formatPeriod,
  getFiscalYearFromPeriod,
} from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/dashboard'

// 期間文字列から月を取得
function getMonthFromPeriod(period: string): number {
  const date = new Date(period)
  return date.getMonth() + 1
}

export default function ProductsPage() {
  const defaultMonth = format(subMonths(new Date(), 1), 'yyyy-MM-01')

  // 年度・月の状態管理
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [year, setYear] = useState(() => getFiscalYearFromPeriod(defaultMonth))
  const [month, setMonth] = useState(() => getMonthFromPeriod(defaultMonth))
  const [quarter, setQuarter] = useState(1)

  // 期間文字列を計算
  const periodString = formatPeriod(year, month)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">店舗分析</h1>
          <p className="text-sm text-gray-500 mt-1">
            店舗別の売上状況と商品販売実績を確認できます
          </p>
        </div>
        <PeriodSelector
          periodType={periodType}
          year={year}
          month={month}
          quarter={quarter}
          onPeriodTypeChange={setPeriodType}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onQuarterChange={setQuarter}
        />
      </div>

      {/* タブ切替 */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">店舗別サマリー</TabsTrigger>
          <TabsTrigger value="matrix">商品×店舗マトリックス</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <StoreSummaryTable month={periodString} />
        </TabsContent>

        <TabsContent value="matrix">
          <ProductSalesMatrix month={periodString} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
