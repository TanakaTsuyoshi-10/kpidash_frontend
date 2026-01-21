/**
 * 経営ダッシュボードコンテナ
 * 全セクションを統合表示
 */
'use client'

import { useState } from 'react'
import { PeriodSelector } from './PeriodSelector'
import { CompanySummaryCard } from './CompanySummaryCard'
import { DepartmentTable } from './DepartmentTable'
import { SalesChart } from './SalesChart'
import { CashFlowCard } from './CashFlowCard'
import { ManagementIndicatorsCard } from './ManagementIndicatorsCard'
import type { DepartmentCustomerData } from './ManagementIndicatorsCard'
import { DashboardAlertList } from './DashboardAlertList'
import { ComplaintSummaryCard } from './ComplaintSummaryCard'
import { useDashboardData, useDashboardChart } from '@/hooks/useDashboard'
import { useStoreSummary } from '@/hooks/useStoreSummary'
import { useChannelSummary } from '@/hooks/useEcommerce'
import { useDashboardExport } from '@/hooks/useExport'
import { ExportDialog, type ExportScope } from '@/components/common/ExportDialog'
import { RefreshCw, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDisplayPeriod, formatPeriod } from '@/lib/fiscal-year'
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

export function ExecutiveDashboard({
  periodType,
  year,
  month,
  quarter,
  onPeriodTypeChange,
  onYearChange,
  onMonthChange,
  onQuarterChange,
}: Props) {
  // ダッシュボードデータ取得
  const { data, loading, error, refetch } = useDashboardData({
    period_type: periodType,
    year,
    month: periodType === 'monthly' ? month : undefined,
    quarter: periodType === 'quarterly' ? quarter : undefined,
  })

  // グラフデータ取得
  const { data: chartData, loading: chartLoading } = useDashboardChart(12)

  // 期間文字列（yyyy-MM-01形式）
  const periodString = formatPeriod(year, month)

  // 店舗客数・客単価データ取得
  const { data: storeData } = useStoreSummary(periodString, 'store', 'monthly')

  // 通販客数・客単価データ取得
  const { data: ecommerceData } = useChannelSummary(periodString, 'monthly')

  // 店舗データを変換
  const storeCustomerData: DepartmentCustomerData | null = storeData?.totals
    ? {
        customers: storeData.totals.customers,
        customers_previous_year: storeData.totals.customers_previous_year,
        customers_yoy: storeData.totals.customers_yoy,
        unit_price: storeData.totals.unit_price,
        unit_price_previous_year: storeData.totals.unit_price_previous_year,
        unit_price_yoy: storeData.totals.unit_price_yoy,
      }
    : null

  // 通販データを変換（buyersを customersにマッピング）
  const ecommerceCustomerData: DepartmentCustomerData | null = ecommerceData?.totals
    ? {
        customers: ecommerceData.totals.buyers,
        customers_previous_year: ecommerceData.totals.buyers_previous_year,
        customers_yoy: ecommerceData.totals.buyers_yoy,
        unit_price: ecommerceData.totals.unit_price,
        unit_price_previous_year: ecommerceData.totals.unit_price_previous_year,
        unit_price_yoy: ecommerceData.totals.unit_price_yoy,
      }
    : null

  // エクスポート機能
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const { exportData } = useDashboardExport()

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
          <h1 className="text-2xl font-bold">経営ダッシュボード</h1>
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
        </div>

        {/* エラーメッセージ */}
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再読み込み
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">経営ダッシュボード</h1>
          <p className="text-sm text-gray-600 mt-1">
            {formatDisplayPeriod(year, month)} | {year}年度
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
          <Button
            onClick={() => setExportDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-1" />
            出力
          </Button>
          <Button onClick={refetch} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 全社サマリー */}
      <section>
        <h2 className="text-lg font-semibold mb-3">全社サマリー</h2>
        <CompanySummaryCard
          summary={data?.company_summary ?? null}
          loading={loading}
        />
      </section>

      {/* 部門別実績 */}
      <section>
        <DepartmentTable
          departments={data?.department_performance ?? []}
          loading={loading}
        />
      </section>

      {/* グラフ & キャッシュフロー（2カラム） */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart chartData={chartData} loading={chartLoading} />
        <CashFlowCard cashFlow={data?.cash_flow ?? null} loading={loading} />
      </section>

      {/* 経営指標 & クレーム（2カラム） */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">経営指標</h2>
          <ManagementIndicatorsCard
            indicators={data?.management_indicators ?? null}
            storeData={storeCustomerData}
            ecommerceData={ecommerceCustomerData}
            loading={loading}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">&nbsp;</h2>
          <ComplaintSummaryCard
            summary={data?.complaint_summary}
            loading={loading}
          />
        </div>
      </section>

      {/* アラート */}
      <section>
        <DashboardAlertList alerts={data?.alerts ?? []} loading={loading} />
      </section>

      {/* エクスポートダイアログ */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        title="経営ダッシュボード"
        fiscalYear={year}
        currentPeriodLabel={getCurrentPeriodLabel()}
        onExport={handleExport}
      />
    </div>
  )
}
