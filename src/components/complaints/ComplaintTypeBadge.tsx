/**
 * クレーム種類バッジ
 */
import { cn } from '@/lib/utils'

interface Props {
  complaintType: string
  typeName?: string
  className?: string
}

// クレーム種類の色設定
const typeColors: Record<string, string> = {
  customer_service: 'bg-blue-100 text-blue-800 border-blue-200',
  facility: 'bg-orange-100 text-orange-800 border-orange-200',
  operation: 'bg-purple-100 text-purple-800 border-purple-200',
  product: 'bg-red-100 text-red-800 border-red-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
}

// デフォルトのラベル
const defaultLabels: Record<string, string> = {
  customer_service: '接客関連',
  facility: '店舗設備',
  operation: '操作方法',
  product: '味・商品',
  other: 'その他',
}

export function ComplaintTypeBadge({ complaintType, typeName, className }: Props) {
  const colorClass = typeColors[complaintType] || 'bg-gray-100 text-gray-800 border-gray-200'
  const label = typeName || defaultLabels[complaintType] || complaintType

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
