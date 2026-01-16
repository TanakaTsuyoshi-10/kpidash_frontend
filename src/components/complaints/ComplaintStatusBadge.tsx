/**
 * クレームステータスバッジ
 */
import { cn } from '@/lib/utils'

interface Props {
  status: string
  statusName?: string
  className?: string
}

// ステータスの色設定
const statusColors: Record<string, string> = {
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
}

export function ComplaintStatusBadge({ status, statusName, className }: Props) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  const label = statusName || (status === 'in_progress' ? '対応中' : status === 'completed' ? '対応済' : status)

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  )
}
