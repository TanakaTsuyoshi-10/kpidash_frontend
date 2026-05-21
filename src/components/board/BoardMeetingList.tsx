/**
 * 取締役会一覧
 * 月次カード形式で表示。クリックで詳細ダイアログを開く。
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TopicBadge } from './TopicBadge'
import { Briefcase, Presentation } from 'lucide-react'
import { format } from 'date-fns'
import type { BoardMeetingListItem } from '@/types/board'

interface Props {
  items: BoardMeetingListItem[]
  loading?: boolean
  onSelect: (meeting: BoardMeetingListItem) => void
}

export function BoardMeetingList({ items, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-6 bg-gray-200 rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-400">
            取締役会の記録がありません
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((meeting) => (
        <Card
          key={meeting.id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onSelect(meeting)}
        >
          <CardContent className="p-5 space-y-3">
            {/* タイトルと開催日 */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold flex items-center gap-1.5 text-slate-800">
                <Briefcase className="h-4 w-4 text-slate-500 shrink-0" />
                {meeting.title}
              </p>
              <span className="text-xs text-gray-400 shrink-0">
                {format(new Date(meeting.meeting_date), 'yyyy/MM/dd')}
              </span>
            </div>

            {/* トピックチップ */}
            {meeting.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {meeting.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-700"
                  >
                    <TopicBadge category={topic.category} />
                    <span className="truncate max-w-[180px]">{topic.title}</span>
                  </span>
                ))}
              </div>
            )}

            {/* 資料あり表示 */}
            <p className="flex items-center gap-1 text-[11px] text-slate-500">
              <Presentation className="h-3.5 w-3.5" />
              クリックで資料・議事録を閲覧
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
