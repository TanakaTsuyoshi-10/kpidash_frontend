/**
 * 財務データアップロードダイアログ
 * Excelファイルのアップロード機能を提供
 * 財務データ（/upload/financial）と店舗別収支（/upload/store-pl）の両方に対応
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Download, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react'
import { useFinancialUpload, useStorePLUpload } from '@/hooks/useFinancial'
import { getFinancialTemplateUrl, getStorePLTemplateUrl } from '@/lib/api/financial'
import { getCalendarYear } from '@/lib/fiscal-year'

type UploadType = 'financial' | 'store-pl'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  month: number
  onUploadSuccess: () => void
  uploadType?: UploadType
}

export function FinancialUploadDialog({
  open,
  onOpenChange,
  year,
  month,
  onUploadSuccess,
  uploadType = 'financial',
}: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // アップロードタイプに応じたフックを使用
  const financialUpload = useFinancialUpload()
  const storePLUpload = useStorePLUpload()

  // 現在のアップロードタイプに応じた値を選択
  const { upload, uploading, result, error, reset } = uploadType === 'store-pl'
    ? storePLUpload
    : financialUpload

  // タイトルと説明
  const title = uploadType === 'store-pl' ? '店舗別収支アップロード' : '財務データアップロード'
  const description = uploadType === 'store-pl'
    ? '店舗別収支Excelファイルをアップロードしてください'
    : '財務データExcelファイルをアップロードしてください'

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (
      droppedFile.name.endsWith('.xlsx') ||
      droppedFile.name.endsWith('.xls')
    )) {
      setFile(droppedFile)
      reset()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      reset()
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      await upload(file)
      onUploadSuccess()
    } catch {
      // エラーはuseFinancialUploadで処理
    }
  }

  const handleTemplateDownload = () => {
    const url = uploadType === 'store-pl'
      ? getStorePLTemplateUrl(year, month)
      : getFinancialTemplateUrl(year, month)
    window.open(url, '_blank')
  }

  const handleClose = () => {
    setFile(null)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* テンプレートダウンロード */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <div className="font-medium">テンプレートファイル</div>
              <div className="text-gray-500">{getCalendarYear(year, month)}年{month}月用</div>
            </div>
            <Button variant="outline" size="sm" onClick={handleTemplateDownload}>
              <Download className="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
          </div>

          {/* ドラッグ＆ドロップエリア */}
          <div
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              ${file ? 'bg-green-50 border-green-500' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="space-y-2">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-green-600" />
                <div className="text-green-600 font-medium">{file.name}</div>
                <div className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    reset()
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  ファイルを変更
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 mx-auto text-gray-400" />
                <div className="text-gray-500">
                  Excelファイルをドラッグ＆ドロップ
                </div>
                <div className="text-sm text-gray-400">
                  または クリックしてファイルを選択
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* 結果表示 */}
          {result && result.success && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                {result.message}
                {result.warnings && result.warnings.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-sm">
                    {result.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* アクションボタン */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? 'アップロード中...' : 'アップロード'}
            </Button>
            <Button variant="outline" onClick={handleClose}>
              閉じる
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
