import { DashboardSkeleton } from '@/components/ui/loading-skeletons'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
      <DashboardSkeleton />
    </div>
  )
}
