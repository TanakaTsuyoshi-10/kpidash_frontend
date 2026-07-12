/**
 * 開発専用: TiptapEditor 単体検証ページ（本番では404）
 * 認証不要でエディタの挙動（連番・配置・インデント等）を検証するためのページ。
 */
'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { TiptapEditor } from '@/components/approvals/editor/TiptapEditor'

export default function DevEditorPage() {
  const [html, setHtml] = useState('')

  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-lg font-bold">TiptapEditor 検証（dev専用）</h1>
      <TiptapEditor
        onChange={(h) => setHtml(h)}
        placeholder="テスト入力..."
      />
      <div className="border rounded p-3 bg-gray-50">
        <p className="text-xs text-gray-500 mb-1">生成HTML:</p>
        <pre className="text-xs whitespace-pre-wrap break-all">{html}</pre>
      </div>
    </div>
  )
}
