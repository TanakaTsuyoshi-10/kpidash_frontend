/**
 * 目標設定ページ
 * 部門別の目標設定概要を表示
 */
'use client'

import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FiscalMonthSelector } from '@/components/dashboard/FiscalMonthSelector'
import { TargetOverviewCard } from '@/components/targets/TargetOverviewCard'
import { useTargetOverview } from '@/hooks/useTarget'
import { Loading } from '@/components/common/Loading'
import { ErrorMessage } from '@/components/common/ErrorMessage'

export default function TargetsPage() {
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'))
  const { data, loading, error, refetch } = useTargetOverview(month)

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">目標設定</h1>
          <p className="text-sm text-gray-500 mt-1">
            部門ごとの目標を設定・管理できます
          </p>
        </div>
        <FiscalMonthSelector value={month} onChange={setMonth} />
      </div>

      {/* コンテンツ */}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.departments.map((dept) => (
            <TargetOverviewCard key={dept.department_type} department={dept} />
          ))}

          {/* データがない場合のフォールバック */}
          {(!data?.departments || data.departments.length === 0) && (
            <>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">店舗目標</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="/targets/store" className="text-blue-600 hover:underline">
                    店舗別の売上目標を設定 →
                  </a>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">財務目標</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="/targets/financial" className="text-green-600 hover:underline">
                    財務指標の目標を設定 →
                  </a>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">通販目標</CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="/targets/ecommerce" className="text-purple-600 hover:underline">
                    通販チャネルの目標を設定 →
                  </a>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}
