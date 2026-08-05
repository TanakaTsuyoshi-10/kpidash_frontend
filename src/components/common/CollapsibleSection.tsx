/**
 * トグル開閉セクション
 *
 * ヘッダーカード＋開閉可能なコンテンツ領域。
 * 中身が複数のカードで構成されるセクション（曜日別分析など）を
 * 二重カードにせずトグル化するために使う。
 */
'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  title: React.ReactNode
  /** ヘッダー右側に常時表示するサマリー */
  summary?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

export function CollapsibleSection({ title, summary, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader
          onClick={() => setOpen(!open)}
          className="cursor-pointer select-none hover:bg-gray-50/60 transition-colors"
        >
          <CardTitle className="flex items-center gap-2 min-h-7">
            {open ? (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-500" />
            )}
            {title}
            {summary ? (
              <span className="ml-auto text-sm font-normal text-gray-500">{summary}</span>
            ) : (
              !open && (
                <span className="text-sm font-normal text-gray-400">（クリックで展開）</span>
              )
            )}
          </CardTitle>
        </CardHeader>
      </Card>
      {open && <div>{children}</div>}
    </div>
  )
}
