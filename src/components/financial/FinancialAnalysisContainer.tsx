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
import { RefreshCw, Upload } from 'lucide-react'
import type { PeriodType } from '@/types/dashboard'

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
  const [activeTab, setActiveTab] = useState<'summary' | 'store-pl'>('summary')

  // コメント用の期間文字列（YYYY-MM-01形式）
  const commentPeriod = `${year}-${String(month).padStart(2, '0')}-01`

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

  // 店舗別収支取得
  const storePL = useStorePLList(commentPeriod)

  // アップロード成功時の処理
  const handleUploadSuccess = () => {
    refetch()
    financeV2.refetch()
    storePL.refetch()
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
          {data && (
            <p className="text-sm text-gray-600 mt-1">
              {data.period} | {data.fiscal_year}年度
            </p>
          )}
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
              expenses={data?.expenses ?? []}
              salesTotal={data?.pl_summary.items[0]?.actual ?? null}
              loading={loading}
            />
            <ProfitabilityCard
              metrics={data?.profitability ?? []}
              loading={loading}
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
      />
    </div>
  )
}
