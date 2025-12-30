/**
 * 目標設定ページヘッダーコンポーネント
 */
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'
import { generateMonthOptions, getCurrentFiscalYear } from '@/types/target'

interface Props {
  title: string
  month: string
  onMonthChange: (month: string) => void
  showBackButton?: boolean
  backHref?: string
}

export function TargetPageHeader({
  title,
  month,
  onMonthChange,
  showBackButton = true,
  backHref = '/targets',
}: Props) {
  const fiscalYear = getCurrentFiscalYear()
  const monthOptions = generateMonthOptions(fiscalYear)

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Link href={backHref}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              概要に戻る
            </Button>
          </Link>
        )}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      <Select value={month} onValueChange={onMonthChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="月を選択" />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
