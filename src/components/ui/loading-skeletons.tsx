/**
 * スケルトンローディングコンポーネント（拡張版）
 * 既存のSkeletonコンポーネントを活用
 */
import { Skeleton } from '@/components/ui/skeleton'

// カード用スケルトン
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton className="h-5 w-3/5 mb-4" />
      <Skeleton className="h-8 w-4/5 mb-2" />
      <Skeleton className="h-4 w-2/5" />
    </div>
  )
}

// テーブル用スケルトン
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-1/4" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/5" />
            <Skeleton className="h-5 w-1/6" />
            <Skeleton className="h-5 w-1/5" />
            <Skeleton className="h-5 w-1/6" />
          </div>
        ))}
      </div>
    </div>
  )
}

// チャート用スケルトン
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton className="h-6 w-2/5 mb-4" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

// ダッシュボード全体用スケルトン
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <TableSkeleton rows={3} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}
