/**
 * 製造分析ページ
 * 生産量、生産性、前年比較、日次データを表示
 */
'use client'

import { useState } from 'react'
import { ManufacturingAnalysisContainer } from '@/components/manufacturing/ManufacturingAnalysisContainer'
import {
  getCurrentFiscalYear,
  getPreviousMonth,
  getCurrentQuarter,
} from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/dashboard'

export default function ManufacturingPage() {
  // 期間選択状態
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [year, setYear] = useState(getCurrentFiscalYear())
  const [month, setMonth] = useState(getPreviousMonth())
  const [quarter, setQuarter] = useState(getCurrentQuarter())

  return (
    <ManufacturingAnalysisContainer
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
