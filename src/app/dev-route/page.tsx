/**
 * 開発専用: 承認ルートエディタ / ステップ表示の単体検証ページ（本番では404）
 * SWR fallback で承認者候補をモックし、認証なしで UI の挙動を検証する。
 */
'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { SWRConfig } from 'swr'
import { ApprovalRouteEditor } from '@/components/approvals/ApprovalRouteEditor'
import { ApprovalStepsView } from '@/components/approvals/ApprovalStepsView'
import { ApprovalStampBoard } from '@/components/approvals/ApprovalStampBoard'
import type { ApprovalMode, ApproverInput, ApprovalStep } from '@/types/approval'

const MOCK_USERS = [
  { id: 'u1', email: 'a@example.com', display_name: '営業A（課長）', department: '営業部' },
  { id: 'u2', email: 'b@example.com', display_name: '営業B（部長）', department: '営業部' },
  { id: 'u3', email: 'c@example.com', display_name: '製造C（部長）', department: '製造部' },
  { id: 'u4', email: 'd@example.com', display_name: '管理D（部長）', department: '管理部' },
  { id: 'u5', email: 'e@example.com', display_name: '社長E', department: '経営' },
]

const SAMPLE_STEPS: ApprovalStep[] = [
  { id: 's1', request_id: 'r', step_no: 1, assignee_id: 'u1', original_assignee_id: 'u1', assignee_email: 'a@example.com', assignee_name: '営業A', status: 'approved', acted_at: null, comment: null, notified_at: null, created_at: '', updated_at: '' },
  { id: 's2', request_id: 'r', step_no: 2, assignee_id: 'u3', original_assignee_id: 'u3', assignee_email: 'c@example.com', assignee_name: '製造C', status: 'approved', acted_at: null, comment: null, notified_at: null, created_at: '', updated_at: '' },
  { id: 's3', request_id: 'r', step_no: 2, assignee_id: 'u4', original_assignee_id: 'u4', assignee_email: 'd@example.com', assignee_name: '管理D', status: 'pending', acted_at: null, comment: null, notified_at: null, created_at: '', updated_at: '' },
  { id: 's4', request_id: 'r', step_no: 3, assignee_id: 'u5', original_assignee_id: 'u5', assignee_email: 'e@example.com', assignee_name: '社長E', status: 'pending', acted_at: null, comment: null, notified_at: null, created_at: '', updated_at: '' },
]

export default function DevRoutePage() {
  const [approvers, setApprovers] = useState<ApproverInput[]>([
    { step_no: 1, assignee_id: '' },
  ])
  const [mode, setMode] = useState<ApprovalMode>('sequential')

  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <SWRConfig value={{ fallback: { '/api/v1/approvals/assignable-users': MOCK_USERS }, revalidateOnMount: false, revalidateOnFocus: false }}>
      <div className="p-8 max-w-2xl space-y-8">
        <div>
          <h1 className="text-lg font-bold mb-3">承認ルートエディタ検証（dev専用）</h1>
          <ApprovalRouteEditor
            approvers={approvers}
            mode={mode}
            onChange={(a, m) => {
              setApprovers(a)
              setMode(m)
            }}
          />
          <pre id="route-state" className="mt-4 text-xs bg-gray-50 border rounded p-3">
            {JSON.stringify({ mode, approvers }, null, 2)}
          </pre>
        </div>
        <div>
          <h2 className="text-base font-bold mb-3">決裁欄（判子ボード）検証</h2>
          <div id="stamp-board-progress" className="mb-4">
            <ApprovalStampBoard
              steps={SAMPLE_STEPS}
              requesterName="田中 剛司"
              submittedAt="2026-09-15T09:00:00Z"
              requestStatus="pending"
              currentStepNo={2}
              mode="sequential"
            />
          </div>
          <div id="stamp-board-rejected">
            <ApprovalStampBoard
              steps={SAMPLE_STEPS.map((st) =>
                st.id === 's3' ? { ...st, status: 'rejected' as const, acted_at: '2026-09-17T10:00:00Z' } : st
              )}
              requesterName="田中 剛司"
              submittedAt="2026-09-15T09:00:00Z"
              requestStatus="rejected"
              currentStepNo={2}
              mode="sequential"
            />
          </div>
        </div>
        <div>
          <h2 className="text-base font-bold mb-3">ステップ表示検証（同時承認グループ）</h2>
          <ApprovalStepsView
            requestId="r"
            steps={SAMPLE_STEPS}
            mode="sequential"
            currentStepNo={2}
            requestStatus="pending"
            canReassign={false}
            onUpdated={() => {}}
          />
        </div>
      </div>
    </SWRConfig>
  )
}
