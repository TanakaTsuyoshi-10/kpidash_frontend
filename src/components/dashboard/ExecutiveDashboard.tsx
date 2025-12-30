/**
 * 経営ダッシュボードコンテナ
 * 全セクションを統合表示
 */
'use client'

import { PeriodSelector } from './PeriodSelector'
import { CompanySummaryCard } from './CompanySummaryCard'
import { DepartmentTable } from './DepartmentTable'
import { SalesChart } from './SalesChart'
import { CashFlowCard } from './CashFlowCard'
import { ManagementIndicatorsCard } from './ManagementIndicatorsCard'
import { DashboardAlertList } from './DashboardAlertList'
import { ComplaintSummaryCard } from './ComplaintSummaryCard'
import { useDashboardData, useDashboardChart } from '@/hooks/useDashboard'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
          {data?.company_summary && (
            <p className="text-sm text-gray-600 mt-1">
              {data.company_summary.period} | {data.company_summary.fiscal_year}年度
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
    </div>
  )
}
