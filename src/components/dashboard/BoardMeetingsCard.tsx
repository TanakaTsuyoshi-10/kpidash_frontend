/**
 * 取締役会資料カード（ダッシュボード右カラム用）
 * 直近3件の取締役会を表示。役員・管理者のみ閲覧可能。
 */
'use client'

import Link from 'next/link'
import { Briefcase, Lock, Presentation } from 'lucide-react'
import { format } from 'date-fns'
import { TopicBadge } from '@/components/board/TopicBadge'
import { useBoardMeetings } from '@/hooks/useBoard'

interface Props {
  /** 役員・管理者かどうか。false の場合はカードを描画しない */
  enabled?: boolean
}

export function BoardMeetingsCard({ enabled = true }: Props) {
  const { data, loading } = useBoardMeetings(enabled)

  // 権限がない場合は何も表示しない
  if (!enabled) {
    return null
  }

  const meetings = (data?.meetings ?? []).slice(0, 3)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-slate-50">
        <h2 className="font-semibold flex items-center gap-2 text-slate-800">
          <Briefcase className="h-5 w-5" />
          取締役会資料
        </h2>
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <Lock className="h-3 w-3" />
          役員・管理者のみ
        </span>
      </div>

      {/* 一覧 */}
      {loading ? (
        <div className="px-5 py-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-5 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          取締役会の記録がありません
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="px-5 py-3.5 hover:bg-gray-50">
              <Link href="/board" className="block">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{meeting.title}</p>
                  <span className="text-xs text-gray-400">
                    {format(new Date(meeting.meeting_date), 'yyyy/MM/dd')}
                  </span>
                </div>
                {meeting.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {meeting.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 text-[11px] text-gray-700"
                      >
                        <TopicBadge category={topic.category} />
                        <span className="truncate max-w-[140px]">{topic.title}</span>
                      </span>
                    ))}
                  </div>
                )}
                <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                  <Presentation className="h-3.5 w-3.5" />
                  クリックで閲覧
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* フッター */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end">
        <Link
          href="/board"
          className="text-xs font-medium text-green-700 hover:underline"
        >
          取締役会ページへ
        </Link>
      </div>
    </div>
  )
}
