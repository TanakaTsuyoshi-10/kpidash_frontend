/**
 * 経営ダッシュボードページ
 * リアルタイムデータ優先のため当月を初期表示
 */
'use client'

import { useState } from 'react'
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard'
import { PermissionGuard } from '@/components/PermissionGuard'
import {
  getCurrentFiscalYear,
  getCurrentQuarter,
} from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/dashboard'

function getCurrentMonth(): number {
  return new Date().getMonth() + 1
}

export default function DashboardPage() {
  // 期間選択状態（当月を初期表示 — リアルタイムデータ優先）
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [year, setYear] = useState(getCurrentFiscalYear())
  const [month, setMonth] = useState(getCurrentMonth())
  const [quarter, setQuarter] = useState(getCurrentQuarter())

  return (
    <PermissionGuard pageKey="dashboard">
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
    </PermissionGuard>
  )
}
