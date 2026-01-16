/**
 * 財務部門 目標設定ページ
 */
'use client'

import { useState } from 'react'
import { TargetPageHeader } from '@/components/targets/TargetPageHeader'
import { FinancialTargetForm } from '@/components/targets/FinancialTargetForm'
import { getCurrentMonth } from '@/types/target'

export default function FinancialTargetsPage() {
  const [month, setMonth] = useState(getCurrentMonth())

  return (
    <div className="space-y-6">
      <TargetPageHeader
        title="財務部門 目標設定"
        month={month}
        onMonthChange={setMonth}
      />

      <FinancialTargetForm month={month} />
    </div>
  )
}
