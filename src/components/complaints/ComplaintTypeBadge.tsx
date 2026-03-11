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
  store_service: 'bg-blue-100 text-blue-800 border-blue-200',
  packing_error: 'bg-orange-100 text-orange-800 border-orange-200',
  price_discrepancy: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  phone_support: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  date_error: 'bg-purple-100 text-purple-800 border-purple-200',
  address_error: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  quantity_error: 'bg-pink-100 text-pink-800 border-pink-200',
  delay: 'bg-amber-100 text-amber-800 border-amber-200',
  contamination: 'bg-red-100 text-red-800 border-red-200',
  taste: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
}

// デフォルトのラベル
const defaultLabels: Record<string, string> = {
  store_service: '店舗接客',
  packing_error: '梱包ミス',
  price_discrepancy: '金額相違',
  phone_support: '電話対応',
  date_error: '日時違い',
  address_error: '住所違い',
  quantity_error: '注文数違い',
  delay: '遅延',
  contamination: '異物混入',
  taste: '味のクレーム',
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
