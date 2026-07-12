/**
 * 遅延読み込みコンポーネントのエクスポート
 * 初期バンドルサイズを削減
 */
import dynamic from 'next/dynamic'
import { ChartSkeleton, TableSkeleton, CardSkeleton } from '@/components/ui/loading-skeletons'

// チャートコンポーネント（Rechartsは重いので遅延読み込み）
export const LazySalesChart = dynamic(
  () => import('@/components/dashboard/SalesChart').then(mod => ({ default: mod.SalesChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// KPIチャート
export const LazyKPIChart = dynamic(
  () => import('@/components/dashboard/KPIChart').then(mod => ({ default: mod.KPIChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// 製造量チャート
export const LazyProductionChart = dynamic(
  () => import('@/components/manufacturing/ProductionChart').then(mod => ({ default: mod.ProductionChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// 生産性チャート
export const LazyProductivityChart = dynamic(
  () => import('@/components/manufacturing/ProductivityChart').then(mod => ({ default: mod.ProductivityChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// 日次データテーブル
export const LazyDailyDataTable = dynamic(
  () => import('@/components/manufacturing/DailyDataTable').then(mod => ({ default: mod.DailyDataTable })),
  {
    loading: () => <TableSkeleton rows={10} />
  }
)

// 財務分析コンテナ
export const LazyFinancialAnalysis = dynamic(
  () => import('@/components/financial/FinancialAnalysisContainer').then(mod => ({ default: mod.FinancialAnalysisContainer })),
  {
    loading: () => <CardSkeleton />
  }
)

// 通販チャネル推移チャート
export const LazyChannelTrendChart = dynamic(
  () => import('@/components/ecommerce/ChannelTrendChart').then(mod => ({ default: mod.ChannelTrendChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// 店舗別売上推移チャート
export const LazyStoreTrendChart = dynamic(
  () => import('@/components/products/StoreTrendChart').then(mod => ({ default: mod.StoreTrendChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// 商品グループ別売上推移チャート
export const LazyProductSalesChart = dynamic(
  () => import('@/components/products/ProductSalesChart').then(mod => ({ default: mod.ProductSalesChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// 日次推移チャート
export const LazyDailyTrendChart = dynamic(
  () => import('@/components/daily-sales/DailyTrendChart').then(mod => ({ default: mod.DailyTrendChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
)

// ダッシュボード below-the-fold コンポーネント
export const LazyCashFlowCard = dynamic(
  () => import('@/components/dashboard/CashFlowCard').then(mod => ({ default: mod.CashFlowCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyManagementIndicatorsCard = dynamic(
  () => import('@/components/dashboard/ManagementIndicatorsCard').then(mod => ({ default: mod.ManagementIndicatorsCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyComplaintSummaryCard = dynamic(
  () => import('@/components/dashboard/ComplaintSummaryCard').then(mod => ({ default: mod.ComplaintSummaryCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyDashboardAlertList = dynamic(
  () => import('@/components/dashboard/DashboardAlertList').then(mod => ({ default: mod.DashboardAlertList })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

// 新ダッシュボードコンポーネント
export const LazyTodayHighlightCard = dynamic(
  () => import('@/components/dashboard/TodayHighlightCard').then(mod => ({ default: mod.TodayHighlightCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyLiveSalesSection = dynamic(
  () => import('@/components/dashboard/LiveSalesSection').then(mod => ({ default: mod.LiveSalesSection })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyEcommerceSummaryCard = dynamic(
  () => import('@/components/dashboard/EcommerceSummaryCard').then(mod => ({ default: mod.EcommerceSummaryCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyInsightsAndActionsCard = dynamic(
  () => import('@/components/dashboard/InsightsAndActionsCard').then(mod => ({ default: mod.InsightsAndActionsCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyStoreRankingCard = dynamic(
  () => import('@/components/dashboard/StoreRankingCard').then(mod => ({ default: mod.StoreRankingCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyStoreWeekdayHeatmap = dynamic(
  () => import('@/components/dashboard/StoreWeekdayHeatmap').then(mod => ({ default: mod.StoreWeekdayHeatmap })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

// 案C 改訂版 ダッシュボードコンポーネント
export const LazyGyozaNewsCard = dynamic(
  () => import('@/components/dashboard/GyozaNewsCard').then(mod => ({ default: mod.GyozaNewsCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazySlackFeedCard = dynamic(
  () => import('@/components/dashboard/SlackFeedCard').then(mod => ({ default: mod.SlackFeedCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyBoardMeetingsCard = dynamic(
  () => import('@/components/dashboard/BoardMeetingsCard').then(mod => ({ default: mod.BoardMeetingsCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyLaborCostSection = dynamic(
  () => import('@/components/dashboard/LaborCostSection').then(mod => ({ default: mod.LaborCostSection })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyEcWebAnalyticsCard = dynamic(
  () => import('@/components/dashboard/EcWebAnalyticsCard').then(mod => ({ default: mod.EcWebAnalyticsCard })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

export const LazyDepartmentSalesSection = dynamic(
  () => import('@/components/dashboard/DepartmentSalesSection').then(mod => ({ default: mod.DepartmentSalesSection })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)

// 承認ワークフロー: リッチテキストエディタ（Tiptap は重いので遅延読み込み）
export const LazyTiptapEditor = dynamic(
  () => import('@/components/approvals/editor/TiptapEditor').then(mod => ({ default: mod.TiptapEditor })),
  {
    loading: () => <CardSkeleton />,
    ssr: false
  }
)
