/**
 * 承認履歴（監査証跡）タイムライン
 */
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, History } from 'lucide-react'
import { ACTION_LABELS, type ApprovalActionEntry } from '@/types/approval'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`
}

const ACTION_COLORS: Record<string, string> = {
  submit: 'bg-blue-100 text-blue-700',
  resubmit: 'bg-blue-100 text-blue-700',
  approve: 'bg-green-100 text-green-700',
  reject: 'bg-red-100 text-red-700',
  return_to_requester: 'bg-orange-100 text-orange-700',
  reassign: 'bg-purple-100 text-purple-700',
  delegate_auto: 'bg-purple-100 text-purple-700',
  cancel: 'bg-gray-100 text-gray-600',
  publish_success: 'bg-emerald-100 text-emerald-700',
  publish_failed: 'bg-red-100 text-red-700',
  notify_failed: 'bg-yellow-100 text-yellow-700',
}

export function ApprovalTimeline({ actions }: { actions: ApprovalActionEntry[] }) {
  const [open, setOpen] = useState(false)

  if (actions.length === 0) return null

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <History className="h-4 w-4" />
        承認履歴・監査証跡（{actions.length}件）
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2">
          {actions.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 text-sm border-l-2 border-gray-200 pl-3 py-1"
            >
              <span
                className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                  ACTION_COLORS[a.action] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {ACTION_LABELS[a.action] ?? a.action}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-gray-700">
                  {a.actor_name ?? a.actor_email}
                  {a.on_behalf_of_id && (
                    <span className="text-purple-600 text-xs ml-1">（代理）</span>
                  )}
                </p>
                {a.comment && (
                  <p className="text-gray-500 text-xs mt-0.5 whitespace-pre-line">
                    {a.comment}
                  </p>
                )}
              </div>
              <span className="flex-shrink-0 text-xs text-gray-400">
                {formatDateTime(a.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
