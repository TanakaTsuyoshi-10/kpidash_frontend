/**
 * 対象月選択コンポーネント
 * APIから利用可能な月一覧を取得して表示
 */
'use client'

import { useMemo } from 'react'
import { format, parse } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAvailableMonths } from '@/hooks/useAvailableMonths'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function MonthSelector({ value, onChange }: Props) {
  const { months: availableMonths, loading } = useAvailableMonths()

  // 月の選択肢を生成（新しい月が上、古い月が下）
  const months = useMemo(() => {
    // 降順にソート（新しい月が上）
    const sorted = [...availableMonths].sort((a, b) => b.localeCompare(a))
    return sorted.map((monthValue) => {
      const date = parse(monthValue, 'yyyy-MM-dd', new Date())
      return {
        value: monthValue,
        label: format(date, 'yyyy年M月', { locale: ja }),
      }
    })
  }, [availableMonths])

  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder={loading ? '読込中...' : '月を選択'} />
      </SelectTrigger>
      <SelectContent>
        {months.map((month) => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
