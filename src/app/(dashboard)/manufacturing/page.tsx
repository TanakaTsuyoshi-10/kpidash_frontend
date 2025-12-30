/**
 * 製造分析ページ
 * 生産量、生産性、前年比較、日次データを表示
 */
'use client'

import { useState } from 'react'
import { ManufacturingAnalysisContainer } from '@/components/manufacturing/ManufacturingAnalysisContainer'
import type { PeriodType } from '@/types/dashboard'

// 現在の年度を計算（9月始まり）
function getCurrentFiscalYear(): number {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  return month >= 9 ? year : year - 1
}

// 前月を取得（速報確定月）
function getPreviousMonth(): number {
  const now = new Date()
  const month = now.getMonth() // 0-11
  return month === 0 ? 12 : month
}

// 現在の四半期を計算
function getCurrentQuarter(): number {
  const now = new Date()
  const month = now.getMonth() + 1

  // Q1: 9-11, Q2: 12-2, Q3: 3-5, Q4: 6-8
  if (month >= 9 && month <= 11) return 1
  if (month === 12 || month <= 2) return 2
  if (month >= 3 && month <= 5) return 3
  return 4
}

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
