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
