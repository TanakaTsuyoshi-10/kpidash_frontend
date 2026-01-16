/**
 * 店舗分析ページ
 */
'use client'

import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { StoreSummaryTable } from '@/components/products/StoreSummaryTable'
import { ProductSalesMatrix } from '@/components/products/ProductSalesMatrix'
import { StoreTrendChart } from '@/components/products/StoreTrendChart'
import { ProductSalesChart } from '@/components/products/ProductSalesChart'
import { RegionalSummaryTable } from '@/components/products/RegionalSummaryTable'
import { FiscalMonthSelector } from '@/components/dashboard/FiscalMonthSelector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthlyCommentCard } from '@/components/dashboard/MonthlyCommentCard'
import { PeriodTypeSelector } from '@/components/dashboard/PeriodTypeSelector'
import type { PeriodType } from '@/types/regional'

export default function ProductsPage() {
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'))
  const [selectedProduct, setSelectedProduct] = useState<string>('ぎょうざ')
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">店舗分析</h1>
        <FiscalMonthSelector value={month} onChange={setMonth} />
      </div>

      {/* タブ */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">店舗別</TabsTrigger>
          <TabsTrigger value="matrix">店舗×商品</TabsTrigger>
          <TabsTrigger value="regional">地区別</TabsTrigger>
          <TabsTrigger value="chart">推移グラフ</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="space-y-6">
            <StoreSummaryTable month={month} />
            <MonthlyCommentCard
              category="store"
              period={month}
              title="月次コメント"
            />
          </div>
        </TabsContent>

        <TabsContent value="matrix">
          <div className="space-y-6">
            <ProductSalesMatrix month={month} />
            <MonthlyCommentCard
              category="store"
              period={month}
              title="月次コメント"
            />
          </div>
        </TabsContent>

        <TabsContent value="regional">
          <div className="space-y-6">
            {/* 期間タイプ切替 */}
            <div className="flex justify-end">
              <PeriodTypeSelector value={periodType} onChange={setPeriodType} />
            </div>

            {/* 地区別実績テーブル */}
            <RegionalSummaryTable
              month={month}
              periodType={periodType}
            />

            {/* 月次コメント */}
            <MonthlyCommentCard
              category="regional"
              period={month}
              title="月次コメント"
            />
          </div>
        </TabsContent>

        <TabsContent value="chart">
          <div className="space-y-6">
            {/* 店舗別売上推移 */}
            <StoreTrendChart />

            {/* 商品グループ別売上推移 */}
            <ProductSalesChart
              selectedProduct={selectedProduct}
              onProductChange={setSelectedProduct}
            />

            {/* 月次コメント */}
            <MonthlyCommentCard
              category="store"
              period={month}
              title="月次コメント"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
