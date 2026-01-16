/**
 * 前年比バッジコンポーネント
 */
import { formatYoY, getYoYColor } from '@/types/target'

interface Props {
  rate: number | null
  className?: string
}

export function YoYBadge({ rate, className = '' }: Props) {
  const color = getYoYColor(rate)
  const text = formatYoY(rate)

  return (
    <span className={`font-mono text-sm ${color} ${className}`}>
      {text}
    </span>
  )
}
