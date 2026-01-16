/**
 * テンプレートダウンロードコンポーネント
 * 各種Excelテンプレートのダウンロードリンクを提供
 */
'use client'

import { useState } from 'react'
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
import { Download, FileSpreadsheet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// テンプレート定義
const TEMPLATES = [
  {
    id: 'financial',
    name: '財務データテンプレート',
    endpoint: '/api/v1/templates/financial',
    description: '月次財務データ、売上原価明細、販管費明細',
    filenamePrefix: 'financial_template',
  },
  {
    id: 'manufacturing',
    name: '製造データテンプレート',
    endpoint: '/api/v1/templates/manufacturing',
    description: '日次の製造量、出勤者数、有給取得時間',
    filenamePrefix: 'manufacturing_template',
  },
  {
    id: 'store-pl',
    name: '店舗別収支テンプレート',
    endpoint: '/api/v1/templates/store-pl',
    description: '店舗別の売上高、売上原価、販管費、営業利益',
    filenamePrefix: 'store_pl_template',
  },
] as const

// 年の選択肢を生成
function generateYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
}

// 月の選択肢
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)

export function TemplateDownload() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async (template: typeof TEMPLATES[number]) => {
    setDownloading(template.id)
    setError(null)

    try {
      // 認証トークンを取得
      const supabase = createClient()
      let { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        const { data } = await supabase.auth.refreshSession()
        session = data.session
      }

      if (!session?.access_token) {
        throw new Error('認証が必要です')
      }

      // テンプレートをダウンロード
      const url = `${API_URL}${template.endpoint}?year=${selectedYear}&month=${selectedMonth}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'ダウンロードに失敗しました')
      }

      // ファイルをダウンロード
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${template.filenamePrefix}_${selectedYear}${selectedMonth.toString().padStart(2, '0')}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err) {
      console.error('Download error:', err)
      setError(err instanceof Error ? err.message : 'ダウンロードに失敗しました')
    } finally {
      setDownloading(null)
    }
  }

  const yearOptions = generateYearOptions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          テンプレートダウンロード
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 年月選択 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>年</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>月</Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {month}月
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* テンプレート一覧 */}
        <div className="space-y-3">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="space-y-1">
                <div className="font-medium">{template.name}</div>
                <div className="text-sm text-gray-500">{template.description}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(template)}
                disabled={downloading === template.id}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {downloading === template.id ? 'ダウンロード中...' : 'ダウンロード'}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500">
          ※ テンプレートには選択した年月のデータが含まれます
        </p>
      </CardContent>
    </Card>
  )
}
