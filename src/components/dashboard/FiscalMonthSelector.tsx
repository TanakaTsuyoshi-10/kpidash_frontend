/**
 * 年度・月選択コンポーネント（簡略版）
 * 年度と月を選択し、yyyy-MM-01形式の期間文字列を出力
 */
'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getYearOptions,
  formatPeriod,
  getFiscalYearFromPeriod,
} from '@/lib/fiscal-year'

interface Props {
  /** yyyy-MM-01形式の期間文字列 */
  value: string
  /** 期間変更時のコールバック */
  onChange: (value: string) => void
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

export function FiscalMonthSelector({ value, onChange }: Props) {
  const years = getYearOptions()

  // 現在の値から年度と月を抽出
  const currentFiscalYear = getFiscalYearFromPeriod(value)
  const currentMonth = new Date(value).getMonth() + 1

  // 年度変更時
  const handleYearChange = (newYear: string) => {
    const fiscalYear = Number(newYear)
    onChange(formatPeriod(fiscalYear, currentMonth))
  }

  // 月変更時
  const handleMonthChange = (newMonth: string) => {
    const month = Number(newMonth)
    onChange(formatPeriod(currentFiscalYear, month))
  }

  return (
    <div className="flex items-center gap-2">
      {/* 年度選択 */}
      <Select value={currentFiscalYear.toString()} onValueChange={handleYearChange}>
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

      {/* 月選択 */}
      <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[100px]">
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
    </div>
  )
}
