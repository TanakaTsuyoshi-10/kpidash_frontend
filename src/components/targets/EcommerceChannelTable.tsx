/**
 * 通販チャネル別目標設定テーブル
 */
'use client'

import { useState, useCallback, useMemo, useEffect, Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import type { EcommerceChannelTarget } from '@/types/target'
import { cn } from '@/lib/utils'

interface Props {
  channels: EcommerceChannelTarget[]
  onChange: (channels: EcommerceChannelTarget[]) => void
}

interface EditState {
  [key: string]: string
}

export function EcommerceChannelTable({ channels, onChange }: Props) {
  const [editState, setEditState] = useState<EditState>({})
  const [originalState, setOriginalState] = useState<EditState>({})

  // データ初期化
  useEffect(() => {
    const edit: EditState = {}
    const original: EditState = {}
    for (const ch of channels) {
      edit[`${ch.channel}-sales`] = ch.target_sales != null ? formatNumber(ch.target_sales) : ''
      edit[`${ch.channel}-buyers`] = ch.target_buyers != null ? formatNumber(ch.target_buyers) : ''
      original[`${ch.channel}-sales`] = edit[`${ch.channel}-sales`]
      original[`${ch.channel}-buyers`] = edit[`${ch.channel}-buyers`]
    }
    setEditState(edit)
    setOriginalState(original)
  }, [channels])

  // 値変更
  const handleChange = useCallback((key: string, value: string) => {
    const cleaned = value.replace(/[^0-9,]/g, '')
    setEditState((prev) => ({ ...prev, [key]: cleaned }))
  }, [])

  // ブラー時にフォーマットして親に通知
  const handleBlur = useCallback((channel: string, field: 'sales' | 'buyers') => {
    const key = `${channel}-${field}`
    const value = editState[key]
    if (value === '') return

    try {
      const num = parseInputValue(value)
      if (num !== null) {
        setEditState((prev) => ({ ...prev, [key]: formatNumber(num) }))

        // 親に更新を通知
        const updated = channels.map((ch) => {
          if (ch.channel === channel) {
            return {
              ...ch,
              [field === 'sales' ? 'target_sales' : 'target_buyers']: num,
            }
          }
          return ch
        })
        onChange(updated)
      }
    } catch {
      setEditState((prev) => ({ ...prev, [key]: originalState[key] || '' }))
    }
  }, [channels, editState, originalState, onChange])

  // セルが変更されているかチェック
  const isCellModified = useCallback(
    (channel: string, field: 'sales' | 'buyers') => {
      const key = `${channel}-${field}`
      return editState[key] !== originalState[key]
    },
    [editState, originalState]
  )

  // 現在の入力値から前年比を計算
  const getCurrentYoY = useCallback(
    (channel: string, field: 'sales' | 'buyers') => {
      const key = `${channel}-${field}`
      const current = editState[key] || ''
      const ch = channels.find((c) => c.channel === channel)
      if (!ch) return null

      const lastYear = field === 'sales' ? ch.last_year_sales : ch.last_year_buyers

      try {
        const value = parseInputValue(current)
        return calculateYoY(value, lastYear)
      } catch {
        return null
      }
    },
    [channels, editState]
  )

  if (channels.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-400">
            チャネルデータがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">チャネル別目標</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  rowSpan={2}
                  className="sticky left-0 z-10 bg-white min-w-[120px] border-r"
                >
                  チャネル
                </TableHead>
                <TableHead colSpan={3} className="text-center border-l border-gray-200">
                  売上目標(千円)
                </TableHead>
                <TableHead colSpan={3} className="text-center border-l border-gray-200">
                  購入者目標(人)
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-right text-xs min-w-[100px] bg-gray-50 border-l">
                  目標
                </TableHead>
                <TableHead className="text-right text-xs min-w-[80px] bg-gray-50">
                  前年
                </TableHead>
                <TableHead className="text-right text-xs min-w-[70px] bg-gray-50">
                  比
                </TableHead>
                <TableHead className="text-right text-xs min-w-[100px] bg-gray-50 border-l">
                  目標
                </TableHead>
                <TableHead className="text-right text-xs min-w-[80px] bg-gray-50">
                  前年
                </TableHead>
                <TableHead className="text-right text-xs min-w-[70px] bg-gray-50">
                  比
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((ch) => (
                <TableRow key={ch.channel}>
                  <TableCell className="sticky left-0 z-10 bg-white font-medium border-r">
                    {ch.channel}
                  </TableCell>
                  {/* 売上 */}
                  <TableCell className="p-1 border-l">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={editState[`${ch.channel}-sales`] ?? ''}
                      onChange={(e) => handleChange(`${ch.channel}-sales`, e.target.value)}
                      onBlur={() => handleBlur(ch.channel, 'sales')}
                      className={cn(
                        'text-right font-mono h-8 w-full',
                        isCellModified(ch.channel, 'sales') && 'bg-yellow-50 border-yellow-400'
                      )}
                      placeholder="-"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-500 bg-gray-50 px-2">
                    {ch.last_year_sales != null ? formatNumber(ch.last_year_sales) : '-'}
                  </TableCell>
                  <TableCell className="text-right px-2 bg-gray-50">
                    <YoYBadge rate={getCurrentYoY(ch.channel, 'sales')} />
                  </TableCell>
                  {/* 購入者 */}
                  <TableCell className="p-1 border-l">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={editState[`${ch.channel}-buyers`] ?? ''}
                      onChange={(e) => handleChange(`${ch.channel}-buyers`, e.target.value)}
                      onBlur={() => handleBlur(ch.channel, 'buyers')}
                      className={cn(
                        'text-right font-mono h-8 w-full',
                        isCellModified(ch.channel, 'buyers') && 'bg-yellow-50 border-yellow-400'
                      )}
                      placeholder="-"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-500 bg-gray-50 px-2">
                    {ch.last_year_buyers != null ? formatNumber(ch.last_year_buyers) : '-'}
                  </TableCell>
                  <TableCell className="text-right px-2 bg-gray-50">
                    <YoYBadge rate={getCurrentYoY(ch.channel, 'buyers')} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
