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
  getCalendarYear,
} from '@/lib/fiscal-year'

interface Props {
  /** yyyy-MM-01形式の期間文字列 */
  value: string
  /** 期間変更時のコールバック */
  onChange: (value: string) => void
}

// 月選択肢（8月が上、9月が下 - 年度末から年度初めの順）。
// 「2027年度の9月」は実際には2026年9月のため、誤読を防ぐよう
// ラベルは暦年付き（例: 2026年9月）で表示する
const MONTH_VALUES = [8, 7, 6, 5, 4, 3, 2, 1, 12, 11, 10, 9]

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

      {/* 月選択（暦年付きラベル） */}
      <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="月" />
        </SelectTrigger>
        <SelectContent>
          {MONTH_VALUES.map((m) => (
            <SelectItem key={m} value={m.toString()}>
              {getCalendarYear(currentFiscalYear, m)}年{m}月
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
