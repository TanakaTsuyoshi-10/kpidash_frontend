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
import { DailyStoreSalesTable } from '@/components/daily-sales/DailyStoreSalesTable'
import { HourlyHeatmap } from '@/components/daily-sales/HourlyHeatmap'
import { DailyTrendChart } from '@/components/daily-sales/DailyTrendChart'
import { OrderForecastView } from '@/components/order-forecast/OrderForecastView'
import { FiscalMonthSelector } from '@/components/dashboard/FiscalMonthSelector'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthlyCommentCard } from '@/components/dashboard/MonthlyCommentCard'
import { PeriodTypeSelector } from '@/components/dashboard/PeriodTypeSelector'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useStoreAnalysisExport } from '@/hooks/useExport'
import { ExportDialog, type ExportParams } from '@/components/common/ExportDialog'
import { getFiscalYearFromPeriod } from '@/lib/fiscal-year'
import { useDailySalesSummary } from '@/hooks/useDailySales'
import type { PeriodType } from '@/types/regional'
import { PermissionGuard } from '@/components/PermissionGuard'

export default function ProductsPage() {
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'))
  const [selectedProduct, setSelectedProduct] = useState<string>('ぎょうざ')
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const { exportData } = useStoreAnalysisExport()

  // 日次分析用: サマリーから日付リストを取得
  const { data: dailySummaryData } = useDailySalesSummary(month)
  const dailyDates = dailySummaryData?.dates || []

  // 年度を計算
  const fiscalYear = getFiscalYearFromPeriod(month)

  // 現在の表示期間ラベル
  const [yearStr, monthStr] = month.split('-')
  const currentPeriodLabel = `${yearStr}年${parseInt(monthStr)}月`

  // エクスポート実行
  const handleExport = async (params: ExportParams) => {
    await exportData(params, fiscalYear, month)
  }

  return (
    <PermissionGuard pageKey="products">
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">店舗分析</h1>
        <div className="flex items-center gap-3">
          <FiscalMonthSelector value={month} onChange={setMonth} />
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            出力
          </Button>
        </div>
      </div>

      {/* タブ */}
      <Tabs defaultValue="summary" className="space-y-4">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList>
            <TabsTrigger value="summary">店舗別</TabsTrigger>
            <TabsTrigger value="matrix">店舗×商品</TabsTrigger>
            <TabsTrigger value="regional">地区別</TabsTrigger>
            <TabsTrigger value="chart">推移グラフ</TabsTrigger>
            <TabsTrigger value="daily">日次分析</TabsTrigger>
            <TabsTrigger value="forecast">予想注文</TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="daily">
          <Tabs defaultValue="daily-table" className="space-y-4">
            <TabsList>
              <TabsTrigger value="daily-table">日別×店舗</TabsTrigger>
              <TabsTrigger value="heatmap">時間帯別</TabsTrigger>
              <TabsTrigger value="daily-trend">日次推移</TabsTrigger>
            </TabsList>

            <TabsContent value="daily-table">
              <DailyStoreSalesTable month={month} />
            </TabsContent>

            <TabsContent value="heatmap">
              <HourlyHeatmap month={month} dates={dailyDates} />
            </TabsContent>

            <TabsContent value="daily-trend">
              <DailyTrendChart month={month} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="forecast">
          <OrderForecastView
            targetDate={format(new Date(), 'yyyy-MM-dd')}
          />
        </TabsContent>
      </Tabs>

      {/* エクスポートダイアログ */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        title="店舗分析"
        fiscalYear={fiscalYear}
        currentPeriodLabel={currentPeriodLabel}
        onExport={handleExport}
      />
    </div>
    </PermissionGuard>
  )
}
