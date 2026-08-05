/**
 * 承認ワークフロー 一覧ページ
 * タブ: 要対応（自分がpending）/ 申請中（自分が起票）/
 *       部署内（自部署の稟議。admin・役員・全社閲覧権限者は「全件」表示）
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Inbox, Send, Files, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useUserContext } from '@/contexts/UserContext'
import { useApprovalRequests } from '@/hooks/useApprovals'
import {
  REQUEST_STATUS_LABELS,
  type ApprovalRequestStatus,
  type ApprovalRequestSummary,
} from '@/types/approval'

const STATUS_COLORS: Record<ApprovalRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  published: 'bg-emerald-100 text-emerald-700',
  publish_failed: 'bg-red-100 text-red-700',
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function RequestList({ tab }: { tab: 'todo' | 'mine' | 'all' }) {
  const { requests, isLoading } = useApprovalRequests(tab)
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-12">
        {tab === 'todo'
          ? '承認待ちの申請はありません'
          : tab === 'mine'
            ? '申請はまだありません'
            : '閲覧できる申請がありません（自部署の稟議のみ表示されます）'}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {requests.map((r: ApprovalRequestSummary) => (
        <button
          key={r.id}
          type="button"
          className="w-full text-left rounded-lg border bg-white px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all"
          onClick={() => router.push(`/approvals/${r.id}`)}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status]}`}
            >
              {REQUEST_STATUS_LABELS[r.status]}
            </span>
            <span className="flex-shrink-0 text-xs text-gray-400">
              {r.request_type_label}
            </span>
            {r.stalled && (
              <span className="flex-shrink-0 flex items-center gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                停滞中
              </span>
            )}
          </div>
          <p className="mt-1 font-medium text-gray-900 truncate">{r.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            申請者: {r.requester_name ?? r.requester_email} ・ 申請日時:{' '}
            {formatDate(r.submitted_at)}
          </p>
        </button>
      ))}
    </div>
  )
}

export default function ApprovalsPage() {
  const { isAdmin, isExecutive, user } = useUserContext()
  // 稟議の全社閲覧: admin/役員/全社閲覧権限。それ以外は「部署内」として同じタブを表示
  const canViewAll = isAdmin || isExecutive || (user?.approval_view_all ?? false)
  const scopeTabLabel = canViewAll ? '全件' : '部署内'
  const [tab, setTab] = useState('todo')

  return (
    <PermissionGuard pageKey="approvals">
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">承認ワークフロー</h1>
          <Link href="/approvals/new">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              新規申請
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-4">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="todo" className="flex items-center gap-1.5">
                  <Inbox className="h-4 w-4" />
                  要対応
                </TabsTrigger>
                <TabsTrigger value="mine" className="flex items-center gap-1.5">
                  <Send className="h-4 w-4" />
                  申請中・下書き
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-1.5">
                  <Files className="h-4 w-4" />
                  {scopeTabLabel}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="todo" className="mt-4">
                <RequestList tab="todo" />
              </TabsContent>
              <TabsContent value="mine" className="mt-4">
                <RequestList tab="mine" />
              </TabsContent>
              <TabsContent value="all" className="mt-4">
                <RequestList tab="all" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
