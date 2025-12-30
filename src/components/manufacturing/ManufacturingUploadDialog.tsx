/**
 * 製造データアップロードダイアログ
 * Excelファイルのアップロードとテンプレートダウンロード
 */
'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useManufacturingUpload } from '@/hooks/useManufacturing'
import { getManufacturingTemplateUrl } from '@/lib/api/manufacturing'
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  month: number
  onUploadSuccess?: () => void
}

export function ManufacturingUploadDialog({
  open,
  onOpenChange,
  year,
  month,
  onUploadSuccess,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { upload, uploading, result, error, reset } = useManufacturingUpload()

  // ファイル選択
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      reset()
    }
  }

  // アップロード実行
  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await upload(selectedFile)
      onUploadSuccess?.()
    } catch {
      // エラーはhook側で処理
    }
  }

  // ダイアログを閉じる
  const handleClose = () => {
    setSelectedFile(null)
    reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  // テンプレートダウンロード
  const handleDownloadTemplate = () => {
    const url = getManufacturingTemplateUrl(year, month)
    window.open(url, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>製造データアップロード</DialogTitle>
          <DialogDescription>
            {year}年{month}月の製造データをExcelファイルでアップロードします
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* テンプレートダウンロード */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">テンプレート</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" />
                ダウンロード
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              テンプレートをダウンロードし、データを入力してからアップロードしてください
            </p>
          </div>

          {/* ファイル選択 */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              ファイルを選択
            </Button>
            {selectedFile && (
              <p className="text-sm text-gray-600 text-center">
                選択中: {selectedFile.name}
              </p>
            )}
          </div>

          {/* アップロードボタン */}
          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                アップロード中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                アップロード
              </>
            )}
          </Button>

          {/* 結果表示 */}
          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>{result.success ? '成功' : 'エラー'}</AlertTitle>
              <AlertDescription>
                <p>{result.message}</p>
                {result.success && result.summary && (
                  <div className="mt-2 text-sm">
                    <p>インポート件数: {result.imported_count}件</p>
                    <p>総生産量: {result.summary.total_batts.toLocaleString()}バット</p>
                    <p>稼働日数: {result.summary.working_days}日</p>
                  </div>
                )}
                {result.warnings.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-yellow-600">警告:</p>
                    <ul className="list-disc list-inside text-sm">
                      {result.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* エラー表示 */}
          {error && !result && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
