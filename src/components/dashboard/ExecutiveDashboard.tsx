/**
 * 経営ダッシュボードコンテナ
 * 新レイアウト: 鮮度の高いデータを上に、遅延する財務データは下に
 *
 * S1. 今日のハイライト（毎日変わるテキスト洞察）
 * S2. 当月売上 & 店舗ランキング（日次更新）
 * S3. 通販サマリー（月次更新）
 * S4. 注目ポイント（ルールベース自動洞察）
 * S5. 月次経営サマリー（財務データ、遅延バナー付き）
 * S6. トレンド推移（売上推移グラフ + 曜日ヒートマップ）
 * S7. 経営指標 & クレーム
 * S8. キャッシュフロー & アラート（折りたたみ）
 */
'use client'

import { useState, useMemo } from 'react'
import { PeriodSelector } from './PeriodSelector'
import { CompanySummaryCard } from './CompanySummaryCard'
import { DepartmentTable } from './DepartmentTable'
import { DataFreshnessBar } from './DataFreshnessBar'
import { TodayHighlightCard } from './TodayHighlightCard'
import { LiveSalesSection } from './LiveSalesSection'
import { EcommerceSummaryCard } from './EcommerceSummaryCard'
import { InsightsAndActionsCard } from './InsightsAndActionsCard'
import { MonthlyGoalTracker } from './MonthlyGoalTracker'
import type { DepartmentCustomerData } from './ManagementIndicatorsCard'
import {
  LazySalesChart,
  LazyCashFlowCard,
  LazyManagementIndicatorsCard,
  LazyComplaintSummaryCard,
  LazyDashboardAlertList,
  LazyStoreWeekdayHeatmap,
} from '@/components/lazy'
import {
  useDashboardData,
  useDashboardChart,
  useDashboardHighlights,
  useDashboardInsights,
  useDashboardFreshness,
} from '@/hooks/useDashboard'
import { useStoreSummary } from '@/hooks/useStoreSummary'
import { useChannelSummary } from '@/hooks/useEcommerce'
import { useCustomerSummary, useWebsiteStats } from '@/hooks/useEcommerce'
import { useDashboardExport } from '@/hooks/useExport'
import { useDailySalesSummary } from '@/hooks/useDailySales'
import { ExportDialog, type ExportParams } from '@/components/common/ExportDialog'
import { RefreshCw, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDisplayPeriod, formatPeriod, getCurrentFiscalYear } from '@/lib/fiscal-year'
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
  // S1: 今日のハイライト（独立フック - 財務データ遅延の影響を受けない）
  const { data: highlights, loading: highlightsLoading } = useDashboardHighlights()

  // S4: 注目ポイント（独立フック）
  const { data: insights, loading: insightsLoading } = useDashboardInsights()

  // データ鮮度（独立フック）
  const { data: freshness, loading: freshnessLoading } = useDashboardFreshness()

  // S5/S7/S8: 既存ダッシュボードデータ（財務系）
  const { data, loading, validating, error, refetch } = useDashboardData({
    period_type: periodType,
    year,
    month: periodType === 'monthly' ? month : undefined,
    quarter: periodType === 'quarterly' ? quarter : undefined,
  })

  // グラフデータ取得
  const { data: chartData, loading: chartLoading } = useDashboardChart(12)

  // 当月の期間文字列（店舗・通販データ用）
  const currentMonthString = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }, [])

  // 選択中の期間文字列
  const periodString = formatPeriod(year, month)

  // S2: 店舗売上データ（当月リアルタイム）
  const { data: storeData, loading: storeLoading } = useStoreSummary(currentMonthString, 'store', 'monthly')

  // S3: 通販データ
  const { data: channelData, loading: channelLoading } = useChannelSummary(currentMonthString, 'monthly')
  const { data: customerData, loading: customerLoading } = useCustomerSummary(currentMonthString, 'monthly')
  const { data: websiteData, loading: websiteLoading } = useWebsiteStats(currentMonthString, 'monthly')

  // 経営指標用の店舗データ
  const { data: indicatorStoreData } = useStoreSummary(periodString, 'store', 'monthly')
  const { data: ecommerceIndicatorData } = useChannelSummary(periodString, 'monthly')

  // 日次サマリーデータ（ヒートマップ用）
  const { data: dailySalesData } = useDailySalesSummary(currentMonthString)

  // 店舗データを経営指標用に変換
  const storeCustomerData: DepartmentCustomerData | null = indicatorStoreData?.totals
    ? {
        customers: indicatorStoreData.totals.customers,
        customers_previous_year: indicatorStoreData.totals.customers_previous_year,
        customers_yoy: indicatorStoreData.totals.customers_yoy,
        unit_price: indicatorStoreData.totals.unit_price,
        unit_price_previous_year: indicatorStoreData.totals.unit_price_previous_year,
        unit_price_yoy: indicatorStoreData.totals.unit_price_yoy,
      }
    : null

  // 通販データを経営指標用に変換
  const ecommerceCustomerData: DepartmentCustomerData | null = ecommerceIndicatorData?.totals
    ? {
        customers: ecommerceIndicatorData.totals.buyers,
        customers_previous_year: ecommerceIndicatorData.totals.buyers_previous_year,
        customers_yoy: ecommerceIndicatorData.totals.buyers_yoy,
        unit_price: ecommerceIndicatorData.totals.unit_price,
        unit_price_previous_year: ecommerceIndicatorData.totals.unit_price_previous_year,
        unit_price_yoy: ecommerceIndicatorData.totals.unit_price_yoy,
      }
    : null

  // S6: 曜日ヒートマップデータ変換
  const heatmapData = useMemo(() => {
    if (!dailySalesData?.data || !dailySalesData?.stores) return []

    const storeMap = new Map<string, { name: string; weekday: number[]; count: number[] }>()

    for (const store of dailySalesData.stores) {
      storeMap.set(store.segment_id, {
        name: store.segment_name,
        weekday: [0, 0, 0, 0, 0, 0, 0],
        count: [0, 0, 0, 0, 0, 0, 0],
      })
    }

    for (const row of dailySalesData.data) {
      const dayDate = new Date(row.date)
      const weekday = dayDate.getDay() // 0=日, 6=土

      const entry = storeMap.get(row.segment_id)
      if (entry && row.sales !== null) {
        entry.weekday[weekday] += row.sales
        entry.count[weekday] += 1
      }
    }

    return Array.from(storeMap.values())
      .filter(entry => entry.count.some(c => c > 0))
      .map(entry => ({
        storeName: entry.name,
        values: entry.weekday.map((total, i) =>
          entry.count[i] > 0 ? Math.round(total / entry.count[i]) : null
        ),
      }))
  }, [dailySalesData])

  // エクスポート機能
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const { exportData } = useDashboardExport()

  // S8 折りたたみ状態
  const [cashFlowExpanded, setCashFlowExpanded] = useState(false)

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
  const handleExport = async (params: ExportParams) => {
    await exportData(params, year, month, periodType, quarter)
  }

  // 財務データの最新月を判定
  const latestFinancialMonth = freshness?.financial_latest ?? null

  // 全社サマリーが全値nullかどうかチェック
  const isSummaryEmpty = data?.company_summary
    ? data.company_summary.sales_total.value === null &&
      data.company_summary.gross_profit.value === null &&
      data.company_summary.operating_profit.value === null
    : true

  // エラー表示
  if (error) {
    return (
      <div className="space-y-6">
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

        {/* ハイライトはエラー時でも表示試行 */}
        <TodayHighlightCard highlights={highlights} loading={highlightsLoading} />

        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            再読み込み
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ローディングバー */}
      {validating && !loading && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1 bg-green-500 animate-pulse rounded-full" />
        </div>
      )}

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
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading} aria-label="データを再読み込み">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* データ鮮度バー */}
      <DataFreshnessBar freshness={freshness} loading={freshnessLoading} />

      {/* S1: 今日のハイライト */}
      <section>
        <TodayHighlightCard highlights={highlights} loading={highlightsLoading} />
      </section>

      {/* S2: 当月売上 & 店舗ランキング */}
      <section>
        <LiveSalesSection storeData={storeData} loading={storeLoading} />
      </section>

      {/* 当月目標進捗 */}
      {storeData?.totals && (
        <section>
          <MonthlyGoalTracker totals={storeData.totals} loading={storeLoading} />
        </section>
      )}

      {/* S3: 通販サマリー */}
      <section>
        <EcommerceSummaryCard
          channelData={channelData}
          customerData={customerData}
          websiteData={websiteData}
          loading={channelLoading || customerLoading || websiteLoading}
        />
      </section>

      {/* S4: 注目ポイント */}
      <section>
        <InsightsAndActionsCard insights={insights} loading={insightsLoading} />
      </section>

      {/* S5: 月次経営サマリー（財務データがある場合のみ） */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">月次経営サマリー</h2>
          {latestFinancialMonth && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              最新確定: {latestFinancialMonth}
            </span>
          )}
        </div>
        {!isSummaryEmpty ? (
          <CompanySummaryCard
            summary={data?.company_summary ?? null}
            loading={loading}
            latestDataMonth={latestFinancialMonth}
          />
        ) : loading ? (
          <CompanySummaryCard summary={null} loading={true} />
        ) : (
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="py-6 text-center text-sm text-gray-500">
              {latestFinancialMonth
                ? `選択期間の財務データはまだありません（最新確定: ${latestFinancialMonth}）`
                : '財務データがまだアップロードされていません'
              }
            </CardContent>
          </Card>
        )}
      </section>

      {/* 部門別実績 */}
      {data?.department_performance && data.department_performance.length > 0 && (
        <section>
          <DepartmentTable
            departments={data.department_performance}
            loading={loading}
          />
        </section>
      )}

      {/* S6: トレンド推移（グラフ + ヒートマップ） */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LazySalesChart chartData={chartData} loading={chartLoading} />
        {heatmapData.length > 0 && (
          <LazyStoreWeekdayHeatmap data={heatmapData} loading={false} />
        )}
      </section>

      {/* S7: 経営指標 & クレーム */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-3">経営指標</h2>
          <LazyManagementIndicatorsCard
            indicators={data?.management_indicators ?? null}
            storeData={storeCustomerData}
            ecommerceData={ecommerceCustomerData}
            loading={loading}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">&nbsp;</h2>
          <LazyComplaintSummaryCard
            summary={data?.complaint_summary}
            loading={loading}
          />
        </div>
      </section>

      {/* S8: キャッシュフロー & アラート（折りたたみ） */}
      <section>
        <button
          onClick={() => setCashFlowExpanded(!cashFlowExpanded)}
          className="flex items-center gap-2 w-full text-left py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <h2 className="text-lg font-semibold">キャッシュフロー & アラート</h2>
          {cashFlowExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
        {cashFlowExpanded && (
          <div className="space-y-6 mt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LazyCashFlowCard cashFlow={data?.cash_flow ?? null} loading={loading} />
              <LazyDashboardAlertList alerts={data?.alerts ?? []} loading={loading} />
            </div>
          </div>
        )}
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
