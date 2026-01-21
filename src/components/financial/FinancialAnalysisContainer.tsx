/**
 * 財務分析メインコンテナ
 * 全セクションを統合表示
 */
'use client'

import { useState } from 'react'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { PLSummaryTable } from './PLSummaryTable'
import { ExpandablePLSummaryTable } from './ExpandablePLSummaryTable'
import { StorePLTable } from './StorePLTable'
import { DepartmentSalesTable } from './DepartmentSalesTable'
import { ExpenseBreakdown } from './ExpenseBreakdown'
import { ProfitabilityCard } from './ProfitabilityCard'
import { FinancialCashFlow } from './FinancialCashFlow'
import { FinancialUploadDialog } from './FinancialUploadDialog'
import { MonthlyCommentCard } from '@/components/dashboard/MonthlyCommentCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFinancialAnalysis, useFinanceAnalysisV2, useStorePLList } from '@/hooks/useFinancial'
import { Button } from '@/components/ui/button'
import { RefreshCw, Upload, Download } from 'lucide-react'
import { formatPeriod, formatDisplayPeriod } from '@/lib/fiscal-year'
import { useFinancialExport } from '@/hooks/useExport'
import { ExportDialog, type ExportScope } from '@/components/common/ExportDialog'
import type { PeriodType } from '@/types/dashboard'
import type { ExpenseItem, FinancialAnalysisResponseV2, ProfitabilityMetric } from '@/types/financial'

/**
 * 拡張経費項目（前年比較用）
 */
export interface ExpenseItemWithComparison extends ExpenseItem {
  previousYearAmount: number | null
  previousYearRate: number | null
  rateDiff: number | null
}

/**
 * V2 APIのSGA詳細から経費データを構築（前年比較付き）
 */
function buildExpensesFromV2(
  v2Data: FinancialAnalysisResponseV2 | null,
  fallbackExpenses: ExpenseItem[]
): ExpenseItemWithComparison[] {
  // V2データがない場合はフォールバック
  if (!v2Data?.current) {
    return fallbackExpenses.map(e => ({
      ...e,
      previousYearAmount: null,
      previousYearRate: null,
      rateDiff: null,
    }))
  }

  const { current, previous_year } = v2Data
  const salesTotal = Number(current.sales_total) || 0
  const prevSalesTotal = Number(previous_year?.sales_total) || 0
  const sgaDetail = current.sga_detail
  const prevSgaDetail = previous_year?.sga_detail
  const sgaTotal = Number(current.sga_total) || 0
  const prevSgaTotal = Number(previous_year?.sga_total) || 0

  const expenses: ExpenseItemWithComparison[] = []

  // 人件費（販管費明細から取得）
  if (sgaDetail?.personnel_cost) {
    const personnelCost = Number(sgaDetail.personnel_cost) || 0
    const prevPersonnelCost = Number(prevSgaDetail?.personnel_cost) || 0
    const rate = salesTotal > 0 ? (personnelCost / salesTotal) * 100 : null
    const prevRate = prevSalesTotal > 0 && prevPersonnelCost > 0
      ? (prevPersonnelCost / prevSalesTotal) * 100
      : null
    expenses.push({
      name: '人件費',
      amount: personnelCost,
      rate,
      previousYearAmount: prevPersonnelCost || null,
      previousYearRate: prevRate,
      rateDiff: rate !== null && prevRate !== null ? rate - prevRate : null,
    })
  }

  // 販管費計
  if (sgaTotal > 0) {
    const rate = salesTotal > 0 ? (sgaTotal / salesTotal) * 100 : null
    const prevRate = prevSalesTotal > 0 && prevSgaTotal > 0
      ? (prevSgaTotal / prevSalesTotal) * 100
      : null
    expenses.push({
      name: '販管費計',
      amount: sgaTotal,
      rate,
      previousYearAmount: prevSgaTotal || null,
      previousYearRate: prevRate,
      rateDiff: rate !== null && prevRate !== null ? rate - prevRate : null,
    })
  }

  // データがない場合はフォールバック
  if (expenses.length === 0) {
    return fallbackExpenses.map(e => ({
      ...e,
      previousYearAmount: null,
      previousYearRate: null,
      rateDiff: null,
    }))
  }
  return expenses
}

/**
 * V2 APIから収益性指標を構築
 */
function buildProfitabilityFromV2(
  v2Data: FinancialAnalysisResponseV2 | null,
  fallbackMetrics: ProfitabilityMetric[]
): ProfitabilityMetric[] {
  if (!v2Data?.current) {
    return fallbackMetrics
  }

  const { current, previous_year } = v2Data
  const salesTotal = Number(current.sales_total) || 0
  const prevSalesTotal = Number(previous_year?.sales_total) || 0
  const grossProfit = Number(current.gross_profit) || 0
  const prevGrossProfit = Number(previous_year?.gross_profit) || 0
  const operatingProfit = Number(current.operating_profit) || 0
  const prevOperatingProfit = Number(previous_year?.operating_profit) || 0
  const costOfSales = Number(current.cost_of_sales) || 0
  const prevCostOfSales = Number(previous_year?.cost_of_sales) || 0
  const personnelCost = Number(current.sga_detail?.personnel_cost) || 0
  const prevPersonnelCost = Number(previous_year?.sga_detail?.personnel_cost) || 0

  const metrics: ProfitabilityMetric[] = []

  // 粗利率
  const grossProfitRate = salesTotal > 0 ? (grossProfit / salesTotal) * 100 : null
  const prevGrossProfitRate = prevSalesTotal > 0 ? (prevGrossProfit / prevSalesTotal) * 100 : null
  metrics.push({
    name: '粗利率',
    value: grossProfitRate,
    previous_year: prevGrossProfitRate,
    diff: grossProfitRate !== null && prevGrossProfitRate !== null
      ? grossProfitRate - prevGrossProfitRate
      : null,
  })

  // 営業利益率
  const operatingProfitRate = salesTotal > 0 ? (operatingProfit / salesTotal) * 100 : null
  const prevOperatingProfitRate = prevSalesTotal > 0 ? (prevOperatingProfit / prevSalesTotal) * 100 : null
  metrics.push({
    name: '営業利益率',
    value: operatingProfitRate,
    previous_year: prevOperatingProfitRate,
    diff: operatingProfitRate !== null && prevOperatingProfitRate !== null
      ? operatingProfitRate - prevOperatingProfitRate
      : null,
  })

  // 原価率
  const costRate = salesTotal > 0 ? (costOfSales / salesTotal) * 100 : null
  const prevCostRate = prevSalesTotal > 0 ? (prevCostOfSales / prevSalesTotal) * 100 : null
  metrics.push({
    name: '原価率',
    value: costRate,
    previous_year: prevCostRate,
    diff: costRate !== null && prevCostRate !== null
      ? costRate - prevCostRate
      : null,
    invert_color: true, // 原価率は下がると良い
  })

  // 人件費率
  const laborCostRate = salesTotal > 0 ? (personnelCost / salesTotal) * 100 : null
  const prevLaborCostRate = prevSalesTotal > 0 && prevPersonnelCost > 0
    ? (prevPersonnelCost / prevSalesTotal) * 100
    : null
  metrics.push({
    name: '人件費率',
    value: laborCostRate,
    previous_year: prevLaborCostRate,
    diff: laborCostRate !== null && prevLaborCostRate !== null
      ? laborCostRate - prevLaborCostRate
      : null,
    invert_color: true, // 人件費率は下がると良い
  })

  return metrics
}

interface Props {
  periodType: PeriodType
  year: number
  month: number
  quarter: number
  onPeriodTypeChange: (type: PeriodType) => void
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onQuarterChange: (quarter: number) => void
}

/**
 * 四半期から基準月を取得
 * Q1: 9月, Q2: 12月, Q3: 3月, Q4: 6月
 */
function getMonthFromQuarter(quarter: number): number {
  switch (quarter) {
    case 1: return 9
    case 2: return 12
    case 3: return 3
    case 4: return 6
    default: return 9
  }
}

export function FinancialAnalysisContainer({
  periodType,
  year,
  month,
  quarter,
  onPeriodTypeChange,
  onYearChange,
  onMonthChange,
  onQuarterChange,
}: Props) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'store-pl'>('summary')
  const { exportData } = useFinancialExport()

  // 期間タイプに応じた基準月を決定
  // - 月次: 選択された月
  // - 四半期: 四半期の最終月
  // - 年度: 選択された月（その月までの累計を表示）
  const baseMonth = periodType === 'quarterly'
    ? getMonthFromQuarter(quarter)
    : month

  // コメント用の期間文字列（YYYY-MM-01形式）
  // 年度からカレンダー年に変換（例: 2025年度9月 → 2024-09-01）
  const commentPeriod = formatPeriod(year, baseMonth)

  // 期間タイプをV2 API用に変換
  const v2PeriodType = periodType === 'monthly' ? 'monthly' : 'cumulative'

  // 財務分析データ取得（既存API - 部門別売上等）
  const { data, loading, error, refetch } = useFinancialAnalysis({
    period_type: periodType,
    year,
    month: periodType === 'monthly' ? month : undefined,
    quarter: periodType === 'quarterly' ? quarter : undefined,
  })

  // 財務分析データ取得（新API - 展開可能明細）
  const financeV2 = useFinanceAnalysisV2(commentPeriod, v2PeriodType)

  // 店舗別収支取得（期間タイプに応じた集計）
  const storePL = useStorePLList(commentPeriod, 'store', periodType)

  // アップロード成功時の処理
  const handleUploadSuccess = () => {
    refetch()
    financeV2.refetch()
    storePL.refetch()
  }

  // 現在の表示期間ラベル
  const getCurrentPeriodLabel = () => {
    if (periodType === 'monthly') {
      return formatDisplayPeriod(year, month)
    } else if (periodType === 'quarterly') {
      return `${year}年度 Q${quarter}`
    } else {
      return `${year}年度`
    }
  }

  // エクスポート実行
  const handleExport = async (scope: ExportScope) => {
    await exportData(scope, year, month, periodType, quarter)
  }

  // エラー表示
  if (error) {
    return (
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold">財務分析</h1>
          <div className="flex items-center gap-3">
            <PeriodSelector
              periodType={periodType}
              year={year}
              month={month}
              quarter={quarter}
              onPeriodTypeChange={onPeriodTypeChange}
              onYearChange={onYearChange}
              onMonthChange={onMonthChange}
              onQuarterChange={onQuarterChange}
            />
            <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              アップロード
            </Button>
          </div>
        </div>

        {/* エラーメッセージ */}
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再読み込み
          </Button>
        </div>

        <FinancialUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          year={year}
          month={month}
          onUploadSuccess={handleUploadSuccess}
          uploadType={activeTab === 'store-pl' ? 'store-pl' : 'financial'}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">財務分析</h1>
          <p className="text-sm text-gray-600 mt-1">
            {formatDisplayPeriod(year, baseMonth)} | {year}年度
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            periodType={periodType}
            year={year}
            month={month}
            quarter={quarter}
            onPeriodTypeChange={onPeriodTypeChange}
            onYearChange={onYearChange}
            onMonthChange={onMonthChange}
            onQuarterChange={onQuarterChange}
          />
          <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            アップロード
          </Button>
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            出力
          </Button>
          <Button onClick={refetch} variant="outline" size="icon" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'summary' | 'store-pl')}>
        <TabsList>
          <TabsTrigger value="summary">財務サマリー</TabsTrigger>
          <TabsTrigger value="store-pl">店舗別収支</TabsTrigger>
        </TabsList>

        {/* 財務サマリータブ */}
        <TabsContent value="summary" className="space-y-6 mt-6">
          {/* 損益サマリー（展開可能） */}
          <section>
            <ExpandablePLSummaryTable
              data={financeV2.data}
              loading={financeV2.loading}
            />
          </section>

          {/* 部門別売上 */}
          <section>
            <DepartmentSalesTable
              departments={data?.department_sales ?? []}
              loading={loading}
            />
          </section>

          {/* 経費分析 & 収益性指標（2カラム） */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseBreakdown
              expenses={buildExpensesFromV2(financeV2.data, data?.expenses ?? [])}
              salesTotal={financeV2.data?.current.sales_total ?? data?.pl_summary.items[0]?.actual ?? null}
              loading={loading || financeV2.loading}
            />
            <ProfitabilityCard
              metrics={buildProfitabilityFromV2(financeV2.data, data?.profitability ?? [])}
              loading={loading || financeV2.loading}
            />
          </section>

          {/* キャッシュフロー */}
          <section>
            <FinancialCashFlow
              cashFlow={data?.cash_flow ?? null}
              loading={loading}
            />
          </section>

          {/* 月次コメント */}
          <section>
            <MonthlyCommentCard
              category="finance"
              period={commentPeriod}
              title="財務分析コメント"
            />
          </section>
        </TabsContent>

        {/* 店舗別収支タブ */}
        <TabsContent value="store-pl" className="space-y-6 mt-6">
          <section>
            <StorePLTable
              data={storePL.data}
              loading={storePL.loading}
            />
          </section>
        </TabsContent>
      </Tabs>

      {/* アップロードダイアログ */}
      <FinancialUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        year={year}
        month={month}
        onUploadSuccess={handleUploadSuccess}
        uploadType={activeTab === 'store-pl' ? 'store-pl' : 'financial'}
      />

      {/* エクスポートダイアログ */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        title="財務分析"
        fiscalYear={year}
        currentPeriodLabel={getCurrentPeriodLabel()}
        onExport={handleExport}
      />
    </div>
  )
}
