/**
 * データ出力ダイアログ
 * Excel出力の範囲選択と出力実行
 */
'use client'

import { useState } from 'react'
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

export type ExportScope = 'current' | 'fiscal_year'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  fiscalYear: number
  currentPeriodLabel: string
  onExport: (scope: ExportScope) => Promise<void>
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

  const handleExport = async () => {
    try {
      setExporting(true)
      await onExport(scope)
      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      alert('出力に失敗しました')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>データ出力</DialogTitle>
          <DialogDescription>
            {title}のデータをExcel形式で出力します
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-sm font-medium mb-3 block">出力範囲</Label>
          <div className="space-y-3">
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
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
