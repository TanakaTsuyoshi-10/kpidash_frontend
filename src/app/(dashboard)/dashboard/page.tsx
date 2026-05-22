/**
 * 経営ダッシュボードページ
 *
 * 期間セレクタ（月次/四半期/年度）が業績データ全体を駆動する。
 * 初期表示は「最新確定月＝前月」。当月は業績データ（店舗・通販等）が
 * 未入力のことが多いため、データが揃う前月を既定とする。
 */
'use client'

import { useState } from 'react'
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard'
import { PermissionGuard } from '@/components/PermissionGuard'
import { getCurrentQuarter } from '@/lib/fiscal-year'
import type { PeriodType } from '@/types/dashboard'

/** 最新確定月（前月）の会計年度と月を返す */
function getDefaultMonthSelection(): { fiscalYear: number; month: number } {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const m = prev.getMonth() + 1
  const calYear = prev.getFullYear()
  // 会計年度は9月始まり: 9〜12月はカレンダー年+1が年度
  const fiscalYear = m >= 9 ? calYear + 1 : calYear
  return { fiscalYear, month: m }
}

export default function DashboardPage() {
  const defaultSelection = getDefaultMonthSelection()

  // 期間選択状態（最新確定月＝前月を初期表示）
  const [periodType, setPeriodType] = useState<PeriodType>('monthly')
  const [year, setYear] = useState(defaultSelection.fiscalYear)
  const [month, setMonth] = useState(defaultSelection.month)
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
