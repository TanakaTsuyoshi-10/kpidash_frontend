/**
 * データアップロードページ
 * CSV/Excelファイルのアップロードとテンプレートダウンロード
 */
'use client'

import { useState } from 'react'
import { FileUploader } from '@/components/upload/FileUploader'
import { TemplateDownload } from '@/components/upload/TemplateDownload'
import { UploadResultDisplay } from '@/components/upload/UploadResultDisplay'
import { UploadHistory } from '@/components/upload/UploadHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { UploadResult } from '@/types/upload'

export default function UploadPage() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result)
    setUploadError(null)
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setUploadResult(null)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold">データアップロード</h1>
        <p className="text-sm text-gray-500 mt-1">
          CSV/Excelファイルをアップロードしてデータを更新できます
        </p>
      </div>

      {/* タブ */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">アップロード</TabsTrigger>
          <TabsTrigger value="template">テンプレート</TabsTrigger>
          <TabsTrigger value="history">履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* ファイルアップローダー */}
          <FileUploader
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />

          {/* アップロード結果 */}
          {uploadResult && (
            <UploadResultDisplay result={uploadResult} />
          )}

          {/* エラー表示 */}
          {uploadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{uploadError}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="template">
          <TemplateDownload />
        </TabsContent>

        <TabsContent value="history">
          <UploadHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
