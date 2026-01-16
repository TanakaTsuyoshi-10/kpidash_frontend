/**
 * 通販顧客統計目標フォーム
 */
'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { YoYBadge } from './YoYBadge'
import {
  formatNumber,
  parseInputValue,
  calculateYoY,
} from '@/types/target'
import type { EcommerceCustomerTarget } from '@/types/target'
import { cn } from '@/lib/utils'

interface Props {
  data: EcommerceCustomerTarget | null
  onChange: (data: EcommerceCustomerTarget) => void
}

interface EditState {
  new_customers: string
  repeat_customers: string
}

export function EcommerceCustomerForm({ data, onChange }: Props) {
  const [editState, setEditState] = useState<EditState>({
    new_customers: '',
    repeat_customers: '',
  })
  const [originalState, setOriginalState] = useState<EditState>({
    new_customers: '',
    repeat_customers: '',
  })

  // データ初期化
  useEffect(() => {
    if (data) {
      const edit: EditState = {
        new_customers: data.new_customers != null ? formatNumber(data.new_customers) : '',
        repeat_customers: data.repeat_customers != null ? formatNumber(data.repeat_customers) : '',
      }
      setEditState(edit)
      setOriginalState(edit)
    }
  }, [data])

  // 値変更
  const handleChange = useCallback((field: keyof EditState, value: string) => {
    const cleaned = value.replace(/[^0-9,]/g, '')
    setEditState((prev) => ({ ...prev, [field]: cleaned }))
  }, [])

  // ブラー時にフォーマットして親に通知
  const handleBlur = useCallback((field: keyof EditState) => {
    const value = editState[field]
    if (value === '') return

    try {
      const num = parseInputValue(value)
      if (num !== null) {
        setEditState((prev) => ({ ...prev, [field]: formatNumber(num) }))

        // 親に更新を通知
        onChange({
          new_customers: field === 'new_customers' ? num : (data?.new_customers ?? null),
          repeat_customers: field === 'repeat_customers' ? num : (data?.repeat_customers ?? null),
          last_year_new: data?.last_year_new ?? null,
          last_year_repeat: data?.last_year_repeat ?? null,
          yoy_new_rate: null,
          yoy_repeat_rate: null,
        })
      }
    } catch {
      setEditState((prev) => ({ ...prev, [field]: originalState[field] || '' }))
    }
  }, [data, editState, originalState, onChange])

  // セルが変更されているかチェック
  const isCellModified = useCallback(
    (field: keyof EditState) => {
      return editState[field] !== originalState[field]
    },
    [editState, originalState]
  )

  // 現在の入力値から前年比を計算
  const getCurrentYoY = useCallback(
    (field: 'new' | 'repeat') => {
      const key = field === 'new' ? 'new_customers' : 'repeat_customers'
      const current = editState[key] || ''
      const lastYear = field === 'new' ? data?.last_year_new : data?.last_year_repeat

      try {
        const value = parseInputValue(current)
        return calculateYoY(value, lastYear ?? null)
      } catch {
        return null
      }
    },
    [data, editState]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">顧客統計目標</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>項目</TableHead>
              <TableHead className="text-right w-[150px]">目標(人)</TableHead>
              <TableHead className="text-right w-[100px]">前年実績</TableHead>
              <TableHead className="text-right w-[80px]">前年比</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 新規顧客 */}
            <TableRow>
              <TableCell className="font-medium">新規顧客数</TableCell>
              <TableCell className="p-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editState.new_customers}
                  onChange={(e) => handleChange('new_customers', e.target.value)}
                  onBlur={() => handleBlur('new_customers')}
                  className={cn(
                    'text-right font-mono h-8',
                    isCellModified('new_customers') && 'bg-yellow-50 border-yellow-400'
                  )}
                  placeholder="-"
                />
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-gray-500">
                {data?.last_year_new != null ? formatNumber(data.last_year_new) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <YoYBadge rate={getCurrentYoY('new')} />
              </TableCell>
            </TableRow>
            {/* リピーター */}
            <TableRow>
              <TableCell className="font-medium">リピーター数</TableCell>
              <TableCell className="p-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editState.repeat_customers}
                  onChange={(e) => handleChange('repeat_customers', e.target.value)}
                  onBlur={() => handleBlur('repeat_customers')}
                  className={cn(
                    'text-right font-mono h-8',
                    isCellModified('repeat_customers') && 'bg-yellow-50 border-yellow-400'
                  )}
                  placeholder="-"
                />
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-gray-500">
                {data?.last_year_repeat != null ? formatNumber(data.last_year_repeat) : '-'}
              </TableCell>
              <TableCell className="text-right">
                <YoYBadge rate={getCurrentYoY('repeat')} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
