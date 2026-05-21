/**
 * 決議・報告トピックバッジ
 * 決議=赤系 / 報告=青系
 */
import { cn } from '@/lib/utils'

interface Props {
  category: string
  className?: string
}

// 区分ごとの色設定
const categoryColors: Record<string, string> = {
  決議: 'bg-red-100 text-red-700 border-red-200',
  報告: 'bg-blue-100 text-blue-700 border-blue-200',
}

export function TopicBadge({ category, className }: Props) {
  const colorClass = categoryColors[category] || 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded border px-1.5 py-0.5 text-[11px] font-medium',
        colorClass,
        className
      )}
    >
      {category}
    </span>
  )
}
