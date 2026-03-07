/**
 * 財務分析ページ
 * 損益サマリー、部門別売上、経費分析、収益性指標、キャッシュフローを表示
 */
'use client'

import { useState } from 'react'
import { LazyFinancialAnalysis } from '@/components/lazy'
import { PermissionGuard } from '@/components/PermissionGuard'
import {
  getCurrentFiscalYear,
  getPreviousMonth,
  getCurrentQuarter,
} from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/dashboard'

export default function FinancePage() {
  // 期間選択状態
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [year, setYear] = useState(getCurrentFiscalYear())
  const [month, setMonth] = useState(getPreviousMonth())
  const [quarter, setQuarter] = useState(getCurrentQuarter())

  return (
    <PermissionGuard pageKey="finance">
      <LazyFinancialAnalysis
        periodType={periodType}
        year={year}
        month={month}
        quarter={quarter}
        onPeriodTypeChange={setPeriodType}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onQuarterChange={setQuarter}
      />
    </PermissionGuard>
  )
}
