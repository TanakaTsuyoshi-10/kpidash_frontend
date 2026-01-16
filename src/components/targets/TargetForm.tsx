/**
 * 目標値入力フォームコンポーネント
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TargetFormData, KPI_OPTIONS } from '@/types/upload'
import { upsertTarget } from '@/lib/api/upload'

interface Props {
  fiscalYear: number
  departmentId?: string
  onSaveComplete?: () => void
  onError?: (error: string) => void
}

export function TargetForm({ fiscalYear, departmentId, onSaveComplete, onError }: Props) {
  const [kpiName, setKpiName] = useState<string>(KPI_OPTIONS[0].value)
  const [period, setPeriod] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [saving, setSaving] = useState(false)

  const generateMonthOptions = () => {
    const options = []
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0')
      options.push({
        value: `${fiscalYear}-${monthStr}-01`,
        label: `${fiscalYear}年${month}月`,
      })
    }
    return options
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!period || !targetValue) {
      onError?.('すべての項目を入力してください')
      return
    }

    const value = parseFloat(targetValue.replace(/,/g, ''))
    if (isNaN(value)) {
      onError?.('有効な数値を入力してください')
      return
    }

    setSaving(true)
    try {
      const data: TargetFormData = {
        kpi_name: kpiName,
        period,
        target_value: value,
        department_id: departmentId,
      }
      await upsertTarget(data)
      onSaveComplete?.()
      setTargetValue('')
    } catch (err) {
      onError?.(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (value: string) => {
    const num = value.replace(/,/g, '').replace(/[^0-9]/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>目標値を登録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>KPI項目</Label>
            <Select value={kpiName} onValueChange={setKpiName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KPI_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>対象月</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="月を選択" />
              </SelectTrigger>
              <SelectContent>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>目標値</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={targetValue}
              onChange={(e) => setTargetValue(formatNumber(e.target.value))}
              placeholder="例: 10,000,000"
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? '保存中...' : '保存'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
