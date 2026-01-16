/**
 * 未達アラート一覧
 */
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import { AlertItem } from '@/types/kpi'

interface Props {
  alerts: AlertItem[]
  loading?: boolean
}

export function AlertList({ alerts, loading }: Props) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            アラート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-4">読み込み中...</div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-500" />
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          アラート ({alerts.length}件)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <Alert
            key={index}
            variant={alert.alert_level === 'critical' ? 'destructive' : 'default'}
            className={alert.alert_level === 'warning' ? 'border-yellow-500 bg-yellow-50' : ''}
          >
            {alert.alert_level === 'critical' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            <AlertTitle>
              {alert.department_name} - {alert.kpi_name}
            </AlertTitle>
            <AlertDescription>
              {alert.segment_name && `${alert.segment_name}: `}
              達成率 {alert.achievement_rate.toFixed(1)}%
              （実績: ¥{alert.ytd_actual.toLocaleString()} / 目標: ¥{alert.ytd_target.toLocaleString()}）
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  )
}
