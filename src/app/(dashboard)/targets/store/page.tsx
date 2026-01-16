/**
 * 店舗部門 目標設定ページ
 */
'use client'

import { useState } from 'react'
import { TargetPageHeader } from '@/components/targets/TargetPageHeader'
import { StoreTargetTable } from '@/components/targets/StoreTargetTable'
import { getCurrentMonth } from '@/types/target'

export default function StoreTargetsPage() {
  const [month, setMonth] = useState(getCurrentMonth())

  return (
    <div className="space-y-6">
      <TargetPageHeader
        title="店舗部門 目標設定"
        month={month}
        onMonthChange={setMonth}
      />

      <StoreTargetTable month={month} />
    </div>
  )
}
