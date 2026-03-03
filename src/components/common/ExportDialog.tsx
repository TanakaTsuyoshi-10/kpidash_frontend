/**
 * データ出力ダイアログ
 * Excel出力の範囲選択と出力実行（任意期間指定対応）
 */
'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ExportScope = 'current' | 'fiscal_year' | 'custom'

export interface ExportParams {
  scope: ExportScope
  startMonth?: string  // 'YYYY-MM-01'
  endMonth?: string    // 'YYYY-MM-01'
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fiscalYear: number
  currentPeriodLabel: string
  onExport: (params: ExportParams) => Promise<void>
}

/** 会計年度ベースの月選択肢を生成（前年度9月〜当年度8月） */
function generateMonthOptions(fiscalYear: number): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  // 9月〜12月（前年）
  for (let m = 9; m <= 12; m++) {
    const y = fiscalYear - 1
    options.push({
      value: `${y}-${String(m).padStart(2, '0')}-01`,
      label: `${y}年${m}月`,
    })
  }
  // 1月〜8月（当年）
  for (let m = 1; m <= 8; m++) {
    const y = fiscalYear
    options.push({
      value: `${y}-${String(m).padStart(2, '0')}-01`,
      label: `${y}年${m}月`,
    })
  }
  return options
}

export function ExportDialog({
  open,
  onOpenChange,
  title,
  fiscalYear,
  currentPeriodLabel,
  onExport,
}: Props) {
  const [scope, setScope] = useState<ExportScope>('current')
  const [exporting, setExporting] = useState(false)
  const monthOptions = useMemo(() => generateMonthOptions(fiscalYear), [fiscalYear])
  const [startMonth, setStartMonth] = useState(monthOptions[0]?.value ?? '')
  const [endMonth, setEndMonth] = useState(monthOptions[monthOptions.length - 1]?.value ?? '')

  const handleExport = async () => {
    try {
      setExporting(true)
      const params: ExportParams = { scope }
      if (scope === 'custom') {
        params.startMonth = startMonth
        params.endMonth = endMonth
      }
      await onExport(params)
      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('出力に失敗しました')
    } finally {
      setExporting(false)
    }
  }

  // バリデーション: 開始月 <= 終了月
  const isCustomValid = scope !== 'custom' || startMonth <= endMonth

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>データ出力</DialogTitle>
          <DialogDescription>
            {title}のデータをExcel形式で出力します
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block">出力範囲</Label>
          <div className="space-y-3">
            {/* 現在の表示期間 */}
            <label
              className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                scope === 'current'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <input
                type="radio"
                name="scope"
                value="current"
                checked={scope === 'current'}
                onChange={() => setScope('current')}
                className="mt-1"
              />
              <div>
                <span className="font-medium">現在の表示期間</span>
                <p className="text-sm text-gray-500">{currentPeriodLabel}</p>
              </div>
            </label>

            {/* 年度全体 */}
            <label
              className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                scope === 'fiscal_year'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <input
                type="radio"
                name="scope"
                value="fiscal_year"
                checked={scope === 'fiscal_year'}
                onChange={() => setScope('fiscal_year')}
                className="mt-1"
              />
              <div>
                <span className="font-medium">年度全体（月次データ）</span>
                <p className="text-sm text-gray-500">
                  {fiscalYear}年度（{fiscalYear - 1}年9月〜{fiscalYear}年8月）
                </p>
              </div>
            </label>

            {/* 期間指定 */}
            <label
              className={cn(
                'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                scope === 'custom'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <input
                type="radio"
                name="scope"
                value="custom"
                checked={scope === 'custom'}
                onChange={() => setScope('custom')}
                className="mt-1"
              />
              <div className="flex-1">
                <span className="font-medium">期間指定</span>
                <p className="text-sm text-gray-500">任意の開始月〜終了月を選択</p>
              </div>
            </label>

            {/* 期間指定のセレクトボックス */}
            {scope === 'custom' && (
              <div className="ml-8 flex items-center gap-2">
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="border rounded-md px-3 py-1.5 text-sm bg-white"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">〜</span>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="border rounded-md px-3 py-1.5 text-sm bg-white"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {!isCustomValid && (
                  <span className="text-xs text-red-500">開始月は終了月以前にしてください</span>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleExport} disabled={exporting || !isCustomValid}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                出力中...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Excel出力
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
