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
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile)
      // ファイル名から種別を自動判定
      if (droppedFile.name.includes('店舗別')) {
        setFileType('store')
      } else if (droppedFile.name.includes('商品別')) {
        setFileType('product')
      }
    } else {
      onUploadError?.('CSVファイルのみアップロード可能です')
    }
  }, [onUploadError])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // ファイル名から種別を自動判定
      if (selectedFile.name.includes('店舗別')) {
        setFileType('store')
      } else if (selectedFile.name.includes('商品別')) {
        setFileType('product')
      }
    }
  }, [])

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

        {/* ドラッグ＆ドロップエリア */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${file ? 'bg-green-50 border-green-500' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
                onClick={() => {
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
                CSVファイルをドラッグ＆ドロップ
              </div>
              <div className="text-gray-400 text-sm">または</div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                ファイルを選択
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
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
