import { ChartSkeleton, TableSkeleton, CardSkeleton } from '@/components/ui/loading-skeletons'

export default function ManufacturingLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ChartSkeleton />
      <ChartSkeleton />
      <TableSkeleton rows={10} />
    </div>
  )
}
