/**
 * 経営ダッシュボードコンテナ（案C 改訂版）
 *
 * design-demo/dashboard-demo.html のレイアウトに準拠。
 * 構成:
 *  - ヘッダー（タイトル＋期間セレクタ＋更新ボタン）
 *  - データ鮮度バー
 *  - 餃子ニュース（全幅・最上部）
 *  - 業績重点カード3枚（店舗販売／通信販売／クレーム状況）
 *  - 部門別 売上実績（全幅）
 *  - 下部2カラム:
 *     左: EC Web分析 / 月次経営サマリー / 売上トレンド / 経営指標（人件費・時間外）
 *     右: Slack投稿 / 取締役会資料
 */
'use client'

import { useMemo } from 'react'
import { PeriodSelector } from './PeriodSelector'
import { CompanySummaryCard } from './CompanySummaryCard'
import { DataFreshnessBar } from './DataFreshnessBar'
import { MetricSummaryCard } from './MetricSummaryCard'
import {
  LazySalesChart,
  LazyGyozaNewsCard,
  LazySlackFeedCard,
  LazyBoardMeetingsCard,
  LazyLaborCostSection,
  LazyEcWebAnalyticsCard,
  LazyDepartmentSalesSection,
} from '@/components/lazy'
import {
  useDashboardData,
  useDashboardChart,
  useDashboardFreshness,
} from '@/hooks/useDashboard'
import { useStoreSummary } from '@/hooks/useStoreSummary'
import { useChannelSummary } from '@/hooks/useEcommerce'
import { useUserContext } from '@/contexts/UserContext'
import { RefreshCw, Store, ShoppingCart, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import {
  formatDisplayPeriod,
  formatPeriod,
  getCalendarYear,
  getCurrentFiscalYear,
  getPreviousMonth,
} from '@/lib/fiscal-year'
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

/** 前年比（%）を「前年比 +8.2%」形式に整形する */
function formatYoYLabel(yoy: number | null | undefined): {
  label: string
  positive: boolean
} {
  if (yoy === null || yoy === undefined) {
    return { label: '前年比 —', positive: true }
  }
  // sales_yoy はバックエンドの変化率（% / 0 = 横ばい）
  const rate = yoy
  const sign = rate > 0 ? '+' : ''
  return {
    label: `前年同月比 ${sign}${rate.toFixed(1)}%`,
    positive: rate >= 0,
  }
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
  // 取締役会・経営指標の表示は権限管理（allowedPages）で制御
  const { allowedPages } = useUserContext()
  const canViewBoard = allowedPages.includes('board')
  const canViewLabor = allowedPages.includes('labor')

  // データ鮮度（独立フック）
  const { data: freshness, loading: freshnessLoading } = useDashboardFreshness()

  // 既存ダッシュボードデータ（財務系・クレーム）
  const { data, loading, validating, error, refetch } = useDashboardData({
    period_type: periodType,
    year,
    month: periodType === 'monthly' ? month : undefined,
    quarter: periodType === 'quarterly' ? quarter : undefined,
  })

  // グラフデータ取得
  const { data: chartData, loading: chartLoading } = useDashboardChart(12)

  // 業績重点カード用の対象月＝前月（最新確定月）。
  // 通販は月次入力のため当月にはデータが無い。店舗も月次の前月実績を表示する。
  const { prevPeriod, prevMonthLabel } = useMemo(() => {
    const fiscalYear = getCurrentFiscalYear()
    const month = getPreviousMonth()
    const calYear = getCalendarYear(fiscalYear, month)
    return {
      prevPeriod: formatPeriod(fiscalYear, month),
      prevMonthLabel: `${calYear}年${month}月 実績`,
    }
  }, [])

  // 業績重点カード: 店舗売上（前月・月次）
  const { data: storeData, loading: storeLoading } = useStoreSummary(
    prevPeriod,
    'store',
    'monthly'
  )

  // 業績重点カード: 通販（前月・月次）
  const { data: channelData, loading: channelLoading } = useChannelSummary(
    prevPeriod,
    'monthly'
  )

  // 財務データの最新月
  const latestFinancialMonth = freshness?.financial_latest ?? null

  // 全社サマリーが全値nullかどうかチェック
  const isSummaryEmpty = data?.company_summary
    ? data.company_summary.sales_total.value === null &&
      data.company_summary.gross_profit.value === null &&
      data.company_summary.operating_profit.value === null
    : true

  // ===== 業績重点カードの集計 =====

  // 店舗販売カード
  const storeTotals = storeData?.totals
  const storeYoY = formatYoYLabel(storeTotals?.sales_yoy)
  const storeMainValue =
    storeTotals?.sales !== null && storeTotals?.sales !== undefined
      ? formatCurrency(storeTotals.sales, false)
      : '—'
  const storeSubItems = useMemo(() => {
    if (!storeTotals) return []
    return [
      {
        label: '客数',
        value:
          storeTotals.customers !== null && storeTotals.customers !== undefined
            ? storeTotals.customers.toLocaleString('ja-JP')
            : '—',
      },
      {
        label: '客単価',
        value:
          storeTotals.unit_price !== null &&
          storeTotals.unit_price !== undefined
            ? formatCurrency(storeTotals.unit_price, false)
            : '—',
      },
    ]
  }, [storeTotals])

  // 通信販売カード
  const channelTotals = channelData?.totals
  const channelYoY = formatYoYLabel(channelTotals?.sales_yoy)
  const channelMainValue =
    channelTotals?.sales !== null && channelTotals?.sales !== undefined
      ? formatCurrency(channelTotals.sales, false)
      : '—'
  const channelSubItems = useMemo(() => {
    const channels = channelData?.channels ?? []
    const totalSales = channelTotals?.sales ?? 0
    if (channels.length === 0 || totalSales <= 0) return []
    // 上位3チャネルの構成比を表示
    return channels
      .filter((c) => c.sales !== null && c.sales > 0)
      .sort((a, b) => (b.sales ?? 0) - (a.sales ?? 0))
      .slice(0, 3)
      .map((c) => ({
        label: c.channel,
        value: `${Math.round(((c.sales ?? 0) / totalSales) * 100)}%`,
      }))
  }, [channelData, channelTotals])

  // クレーム状況カード
  const complaint = data?.complaint_summary
  const complaintCount = complaint?.current_month_count ?? 0
  const complaintDiff = useMemo(() => {
    if (!complaint) return { label: '前月比 —', positive: true }
    const diff = complaint.current_month_count - complaint.previous_month_count
    if (diff === 0) return { label: '前月比 ±0件', positive: true }
    // クレームは減少が良化
    const sign = diff > 0 ? '+' : ''
    return {
      label: `前月比 ${sign}${diff}件`,
      positive: diff <= 0,
    }
  }, [complaint])
  const complaintInProgress = complaint?.in_progress_count ?? 0
  const complaintDone = Math.max(0, complaintCount - complaintInProgress)

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
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={loading}
            aria-label="データを再読み込み"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* データ鮮度バー */}
      <DataFreshnessBar freshness={freshness} loading={freshnessLoading} />

      {/* 餃子ニュース（全幅・最上部） */}
      <LazyGyozaNewsCard />

      {/* 業績重点カード（3枚） */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricSummaryCard
          title="店舗販売"
          icon={Store}
          mainValue={storeMainValue}
          caption={prevMonthLabel}
          yoyLabel={storeYoY.label}
          yoyPositive={storeYoY.positive}
          subItems={storeSubItems}
          href="/products"
          linkLabel="店舗分析へ"
          accentColor="emerald"
          loading={storeLoading}
        />
        <MetricSummaryCard
          title="通信販売"
          icon={ShoppingCart}
          mainValue={channelMainValue}
          caption={prevMonthLabel}
          yoyLabel={channelYoY.label}
          yoyPositive={channelYoY.positive}
          subItems={channelSubItems}
          href="/ecommerce"
          linkLabel="通販分析へ"
          accentColor="sky"
          loading={channelLoading}
        />
        <MetricSummaryCard
          title="クレーム状況"
          icon={AlertTriangle}
          mainValue={`${complaintCount} 件`}
          caption="当月発生件数"
          yoyLabel={complaintDiff.label}
          yoyPositive={complaintDiff.positive}
          subItems={[
            {
              label: '対応中',
              value: String(complaintInProgress),
              dotColor: '#eab308',
            },
            {
              label: '完了',
              value: String(complaintDone),
              dotColor: '#22c55e',
            },
          ]}
          href="/manufacturing/complaints"
          linkLabel="クレーム管理へ"
          accentColor="amber"
          loading={loading}
        />
      </div>

      {/* 部門別 売上実績（全幅） */}
      <LazyDepartmentSalesSection />

      {/* 下部: 2カラム */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム */}
        <div className="lg:col-span-2 space-y-6">
          {/* EC Web分析 */}
          <LazyEcWebAnalyticsCard />

          {/* 月次経営サマリー（財務） */}
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
                    : '財務データがまだアップロードされていません'}
                </CardContent>
              </Card>
            )}
          </section>

          {/* 売上・利益トレンド推移（前年比較） */}
          <LazySalesChart chartData={chartData} loading={chartLoading} />

          {/* 経営指標 — 部署別 人件費・時間外（権限管理: labor） */}
          {canViewLabor && <LazyLaborCostSection />}
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          {/* Slack 投稿 */}
          <LazySlackFeedCard />

          {/* 取締役会資料（権限管理: board） */}
          {canViewBoard && <LazyBoardMeetingsCard enabled={canViewBoard} />}
        </div>
      </div>
    </div>
  )
}
