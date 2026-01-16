/**
 * 経営ダッシュボードページ
 * 全社サマリー、部門別実績、キャッシュフロー、経営指標を表示
 */
'use client'

import { useState } from 'react'
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard'
import {
  getCurrentFiscalYear,
  getPreviousMonth,
  getCurrentQuarter,
} from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/dashboard'

export default function DashboardPage() {
  // 期間選択状態
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [year, setYear] = useState(getCurrentFiscalYear())
  const [month, setMonth] = useState(getPreviousMonth())
  const [quarter, setQuarter] = useState(getCurrentQuarter())

  return (
    <ExecutiveDashboard
      periodType={periodType}
      year={year}
      month={month}
      quarter={quarter}
      onPeriodTypeChange={setPeriodType}
      onYearChange={setYear}
      onMonthChange={setMonth}
      onQuarterChange={setQuarter}
    />
  )
}
