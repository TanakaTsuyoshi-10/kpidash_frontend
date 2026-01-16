/**
 * Excelアップロードモーダル
 */
'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { downloadEcommerceTemplate, uploadEcommerceExcel } from '@/lib/api/ecommerce'
import type { EcommerceBulkUploadResponse } from '@/types/ecommerce'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadSuccess?: () => void
}

export function ExcelUploadModal({ open, onOpenChange, onUploadSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [result, setResult] = useState<EcommerceBulkUploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile)
        setError(null)
        setResult(null)
      } else {
        setError('Excelファイル（.xlsx, .xls）を選択してください')
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true)
      setError(null)
      await downloadEcommerceTemplate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'テンプレートのダウンロードに失敗しました')
    } finally {
      setDownloading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      setResult(null)
      const response = await uploadEcommerceExcel(file)
      setResult(response)
      if (response.success) {
        onUploadSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>通販データ入力</DialogTitle>
          <DialogDescription>
            Excelテンプレートをダウンロードし、データを入力してアップロードしてください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* テンプレートダウンロード */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleDownloadTemplate}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            テンプレートをダウンロード
          </Button>

          {/* ファイルドロップエリア */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}
              ${file ? 'border-green-500 bg-green-50' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-10 w-10 text-green-600" />
                <p className="text-sm font-medium text-green-700">{file.name}</p>
                <p className="text-xs text-gray-500">クリックして変更</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Excelファイルをドラッグ＆ドロップ
                </p>
                <p className="text-xs text-gray-400">または クリックして選択</p>
              </div>
            )}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <XCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 成功表示 */}
          {result?.success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">アップロード完了</span>
              </div>
              <div className="text-green-600 space-y-1 pl-7">
                <p>対象月: {result.month}</p>
                <p>チャネル: {result.channel_records}件</p>
                <p>商品: {result.product_records}件</p>
                <p>顧客: {result.customer_records}件</p>
                <p>HP: {result.website_records}件</p>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              閉じる
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              アップロード
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
