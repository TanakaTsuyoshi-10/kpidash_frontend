/**
 * データアップロードページ
 */
'use client'

import { useState } from 'react'
import { FileUploader } from '@/components/upload/FileUploader'
import { UploadResultDisplay } from '@/components/upload/UploadResultDisplay'
import { UploadHistoryList } from '@/components/upload/UploadHistory'
import { UploadResult } from '@/types/upload'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function UploadPage() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result)
    setErrorMessage(null)
  }

  const handleUploadError = (error: string) => {
    setErrorMessage(error)
    setUploadResult(null)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">データアップロード</h1>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">アップロード</TabsTrigger>
          <TabsTrigger value="history">履歴</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileUploader
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />

            <div className="space-y-4">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <UploadResultDisplay result={uploadResult} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <UploadHistoryList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
