/**
 * CSVファイルアップロードコンポーネント
 */
'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { FileType, FILE_TYPE_OPTIONS, UploadResult } from '@/types/upload'
import { uploadCSV } from '@/lib/api/upload'
import { validateFile } from '@/lib/validators'

interface Props {
  onUploadComplete?: (result: UploadResult) => void
  onUploadError?: (error: string) => void
}

export function FileUploader({ onUploadComplete, onUploadError }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<FileType>('store')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ファイル選択ダイアログを開く
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // ファイル名から種別を自動判定
  const detectFileType = (fileName: string) => {
    const lowerName = fileName.toLowerCase()
    if (lowerName.includes('店舗別収支') || lowerName.includes('store_pl')) {
      setFileType('store_pl')
    } else if (lowerName.includes('財務') || lowerName.includes('financial')) {
      setFileType('financial')
    } else if (lowerName.includes('製造') || lowerName.includes('manufacturing')) {
      setFileType('manufacturing')
    } else if (lowerName.includes('商品別') || lowerName.includes('product')) {
      setFileType('product')
    } else if (lowerName.includes('店舗別') || lowerName.includes('store')) {
      setFileType('store')
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      // バリデーション
      const validation = validateFile(droppedFile)
      if (!validation.valid) {
        onUploadError?.(validation.error || 'ファイルが無効です')
        return
      }

      setFile(droppedFile)
      // ファイル名から種別を自動判定
      detectFileType(droppedFile.name)
    }
  }, [onUploadError])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // バリデーション
      const validation = validateFile(selectedFile)
      if (!validation.valid) {
        onUploadError?.(validation.error || 'ファイルが無効です')
        return
      }

      setFile(selectedFile)
      // ファイル名から種別を自動判定
      detectFileType(selectedFile.name)
    }
  }, [onUploadError])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadCSV(file, fileType)
      onUploadComplete?.(result)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'アップロードに失敗しました')
    } finally {
      setUploading(false)
    }
  }

  const selectedOption = FILE_TYPE_OPTIONS.find(o => o.value === fileType)

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSVファイルアップロード</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ファイル種別選択 */}
        <div className="space-y-2">
          <Label>データ種別</Label>
          <Select value={fileType} onValueChange={(v) => setFileType(v as FileType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedOption && (
            <p className="text-xs text-gray-500">{selectedOption.description}</p>
          )}
        </div>

        {/* 非表示のファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* ドラッグ＆ドロップエリア */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${file ? 'bg-green-50 border-green-500' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={!file ? openFileDialog : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (!file && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              openFileDialog()
            }
          }}
        >
          {file ? (
            <div className="space-y-2">
              <div className="text-green-600 font-medium">{file.name}</div>
              <div className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
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
              <div className="text-gray-500">
                ファイルをドラッグ＆ドロップ
              </div>
              <div className="text-gray-400 text-sm">対応形式: .xlsx, .xls, .csv（10MB以下）</div>
              <div className="text-gray-400 text-sm">または</div>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }}
              >
                ファイルを選択
              </Button>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'アップロード中...' : 'アップロード'}
        </Button>
      </CardContent>
    </Card>
  )
}
