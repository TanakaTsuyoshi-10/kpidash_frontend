/**
 * 目標設定概要ページ
 */
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TargetOverviewCard } from '@/components/targets/TargetOverviewCard'
import { useTargetOverview } from '@/hooks/useTarget'
import { getCurrentMonth, generateMonthOptions, getCurrentFiscalYear } from '@/types/target'
import { Loader2, AlertCircle } from 'lucide-react'
import type { DepartmentTargetSummary } from '@/types/target'

// デフォルトの部門データ（APIがまだ実装されていない場合のフォールバック）
const defaultDepartments: DepartmentTargetSummary[] = [
  {
    department_type: 'store',
    department_name: '店舗部門',
    has_targets: false,
    target_count: 0,
    last_updated: null,
  },
  {
    department_type: 'financial',
    department_name: '財務部門',
    has_targets: false,
    target_count: 0,
    last_updated: null,
  },
  {
    department_type: 'ecommerce',
    department_name: '通販部門',
    has_targets: false,
    target_count: 0,
    last_updated: null,
  },
]

export default function TargetsOverviewPage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const { data, loading, error } = useTargetOverview(month)

  const fiscalYear = getCurrentFiscalYear()
  const monthOptions = generateMonthOptions(fiscalYear)

  // APIからのデータまたはデフォルト
  const departments = data?.departments || defaultDepartments

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">目標設定</h1>
        <Select value={month} onValueChange={setMonth}>
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

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ローディング */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>読み込み中...</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* 部門カード */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <TargetOverviewCard key={dept.department_type} department={dept} />
          ))}
        </div>
      )}
    </div>
  )
}
