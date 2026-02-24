import { ChartSkeleton, TableSkeleton, CardSkeleton } from '@/components/ui/loading-skeletons'

export default function EcommerceLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
      <TableSkeleton rows={6} />
      <TableSkeleton rows={8} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ChartSkeleton />
    </div>
  )
}
