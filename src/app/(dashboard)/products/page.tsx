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
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useStoreAnalysisExport } from '@/hooks/useExport'
import { ExportDialog, type ExportScope } from '@/components/common/ExportDialog'
import { getFiscalYearFromPeriod } from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/regional'

export default function ProductsPage() {
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'))
  const [selectedProduct, setSelectedProduct] = useState<string>('ぎょうざ')
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const { exportData } = useStoreAnalysisExport()

  // 年度を計算
  const fiscalYear = getFiscalYearFromPeriod(month)

  // 現在の表示期間ラベル
  const [yearStr, monthStr] = month.split('-')
  const currentPeriodLabel = `${yearStr}年${parseInt(monthStr)}月`

  // エクスポート実行
  const handleExport = async (scope: ExportScope) => {
    await exportData(scope, fiscalYear, month)
  }

  return (
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
  )
}
