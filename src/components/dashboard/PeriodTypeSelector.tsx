/**
 * 期間タイプ切替コンポーネント
 */
'use client'

import { cn } from '@/lib/utils'

type PeriodType = 'monthly' | 'cumulative'

interface Props {
  value: PeriodType
  onChange: (value: PeriodType) => void
}

export function PeriodTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
      <button
        onClick={() => onChange('monthly')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap',
          value === 'monthly'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        )}
      >
        単月
      </button>
      <button
        onClick={() => onChange('cumulative')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200 whitespace-nowrap',
          value === 'cumulative'
            ? 'bg-green-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        )}
      >
        累計
      </button>
    </div>
  )
}
