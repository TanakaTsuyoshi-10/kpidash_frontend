import { CardSkeleton, TableSkeleton } from '@/components/ui/loading-skeletons'

export default function FinanceLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton rows={8} />
      <TableSkeleton rows={6} />
    </div>
  )
}
