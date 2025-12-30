/**
 * ダッシュボードアラートリスト
 * 予算未達項目のアラート表示
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { DashboardAlertItem } from '@/types/dashboard'

interface Props {
  alerts: DashboardAlertItem[]
  loading?: boolean
}

export function DashboardAlertList({ alerts, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            アラート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
            アラート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-green-600 py-4">
            未達項目はありません
          </div>
        </CardContent>
      </Card>
    )
  }

  // 深刻度でソート（criticalを先に）
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1
    if (a.severity !== 'critical' && b.severity === 'critical') return 1
    return a.achievement_rate - b.achievement_rate
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          アラート ({alerts.length}件)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedAlerts.map((alert, index) => (
          <Alert
            key={index}
            variant={alert.severity === 'critical' ? 'destructive' : 'default'}
            className={
              alert.severity === 'warning'
                ? 'border-yellow-500 bg-yellow-50'
                : ''
            }
          >
            {alert.severity === 'critical' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <AlertTitle className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                {alert.category}
              </span>
              {alert.name}
            </AlertTitle>
            <AlertDescription className="mt-1">
              <div className="flex flex-wrap gap-4 text-sm">
                <span>
                  達成率: <strong>{formatPercent(alert.achievement_rate)}</strong>
                </span>
                <span>
                  実績: {formatCurrency(alert.actual)}
                </span>
                <span>
                  目標: {formatCurrency(alert.target)}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
