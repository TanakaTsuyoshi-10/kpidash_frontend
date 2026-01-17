/**
 * 期間選択コンポーネント
 * 期間タイプ（月次/四半期/年度）と年月の選択
 */
'use client'

import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getYearOptions } from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/dashboard'

interface Props {
  periodType: PeriodType
  year: number
  month: number
  quarter: number
  onPeriodTypeChange: (type: PeriodType) => void
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onQuarterChange: (quarter: number) => void
}

// 月選択肢（8月が上、9月が下 - 年度末から年度初めの順）
const MONTHS = [
  { value: 8, label: '8月' },
  { value: 7, label: '7月' },
  { value: 6, label: '6月' },
  { value: 5, label: '5月' },
  { value: 4, label: '4月' },
  { value: 3, label: '3月' },
  { value: 2, label: '2月' },
  { value: 1, label: '1月' },
  { value: 12, label: '12月' },
  { value: 11, label: '11月' },
  { value: 10, label: '10月' },
  { value: 9, label: '9月' },
]

// 四半期選択肢
const QUARTERS = [
  { value: 1, label: 'Q1 (9-11月)' },
  { value: 2, label: 'Q2 (12-2月)' },
  { value: 3, label: 'Q3 (3-5月)' },
  { value: 4, label: 'Q4 (6-8月)' },
]

export function PeriodSelector({
  periodType,
  year,
  month,
  quarter,
  onPeriodTypeChange,
  onYearChange,
  onMonthChange,
  onQuarterChange,
}: Props) {
  const years = getYearOptions()

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 期間タイプ切り替え */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => onPeriodTypeChange('monthly')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium transition-colors',
            periodType === 'monthly'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          月次
        </button>
        <button
          onClick={() => onPeriodTypeChange('quarterly')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200',
            periodType === 'quarterly'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          四半期
        </button>
        <button
          onClick={() => onPeriodTypeChange('yearly')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium transition-colors border-l border-gray-200',
            periodType === 'yearly'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          年度
        </button>
      </div>

      {/* 年度選択 */}
      <Select value={year.toString()} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="年度" />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y.toString()}>
              {y}年度
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 月/四半期選択（固定幅で位置を安定化） */}
      <div className="w-[140px]">
        {periodType === 'monthly' && (
          <Select value={month.toString()} onValueChange={(v) => onMonthChange(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="月" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {periodType === 'quarterly' && (
          <Select value={quarter.toString()} onValueChange={(v) => onQuarterChange(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="四半期" />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map((q) => (
                <SelectItem key={q.value} value={q.value.toString()}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {periodType === 'yearly' && (
          <div className="h-9 flex items-center justify-center text-sm text-gray-400">
            年度累計
          </div>
        )}
      </div>
    </div>
  )
}
