/**
 * 承認申請 詳細ページ
 * 内容確認＋承認/却下/差戻＋監査履歴
 */
'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Undo2,
  Ban,
  Pencil,
  RefreshCw,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PermissionGuard } from '@/components/PermissionGuard'
import { ApprovalStepsView } from '@/components/approvals/ApprovalStepsView'
import { ApprovalTimeline } from '@/components/approvals/ApprovalTimeline'
import { useUserContext } from '@/contexts/UserContext'
import { useApprovalRequest } from '@/hooks/useApprovals'
import {
  approveStep,
  cancelRequest,
  rejectStep,
  republish,
  returnToRequester,
} from '@/lib/api/approvals'
import {
  APPROVAL_MODE_LABELS,
  REQUEST_STATUS_LABELS,
  type ApprovalRequestStatus,
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

type ActionKind = 'approve' | 'reject' | 'return'

const ACTION_CONFIG: Record<
  ActionKind,
  { title: string; buttonLabel: string; variant: 'default' | 'destructive' | 'outline' }
> = {
  approve: { title: '承認', buttonLabel: '承認する', variant: 'default' },
  reject: { title: '却下', buttonLabel: '却下する', variant: 'destructive' },
  return: { title: '差戻し', buttonLabel: '差し戻す', variant: 'outline' },
}

export default function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isAdmin, isExecutive } = useUserContext()
  const { request, isLoading, mutate } = useApprovalRequest(id)

  const [actionDialog, setActionDialog] = useState<ActionKind | null>(null)
  const [comment, setComment] = useState('')
  const [processing, setProcessing] = useState(false)

  const canReassign = isAdmin || isExecutive

  const myStep = request?.steps.find(
    (s) =>
      s.status === 'pending' &&
      s.assignee_id === user?.id &&
      (request.approval_mode !== 'sequential' || s.step_no === request.current_step_no)
  )

  const handleAction = async () => {
    if (!request || !myStep || !actionDialog) return
    setProcessing(true)
    try {
      if (actionDialog === 'approve') {
        await approveStep(request.id, myStep.id, comment || undefined)
        toast.success('承認しました')
      } else if (actionDialog === 'reject') {
        await rejectStep(request.id, myStep.id, comment || undefined)
        toast.success('却下しました')
      } else {
        await returnToRequester(request.id, myStep.id, comment || undefined)
        toast.success('差し戻しました')
      }
      setActionDialog(null)
      setComment('')
      mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '操作に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!request) return
    if (!confirm('この申請を取り下げますか？')) return
    try {
      await cancelRequest(request.id)
      toast.success('取り下げました')
      mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '取下げに失敗しました')
    }
  }

  const handleRepublish = async () => {
    if (!request) return
    setProcessing(true)
    try {
      await republish(request.id)
      toast.success('Slackへ投稿しました')
      mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '再投稿に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  if (isLoading || !request) {
    return (
      <PermissionGuard pageKey="approvals">
        <div className="w-full space-y-4">
          <div className="h-8 w-64 bg-gray-100 rounded animate-pulse" />
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </PermissionGuard>
    )
  }

  const isRequester = request.requester_id === user?.id
  const channelId = request.metadata.slack_channel_id as string | undefined

  return (
    <PermissionGuard pageKey="approvals">
      <div className="w-full space-y-4 pb-12">
        {/* ヘッダー */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/approvals')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[request.status]}`}
          >
            {REQUEST_STATUS_LABELS[request.status]}
          </span>
          <span className="text-xs text-gray-400">{request.request_type_label}</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900">{request.title}</h1>
        <p className="text-sm text-gray-500">
          申請者: {request.requester_name ?? request.requester_email}
          {request.submitted_at &&
            ` ・ 申請日時: ${new Date(request.submitted_at).toLocaleString('ja-JP')}`}
        </p>

        {/* アクションバー */}
        {request.can_act && myStep && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4 flex flex-wrap items-center gap-2">
              <p className="text-sm text-amber-800 font-medium mr-auto">
                あなたの承認が必要です
              </p>
              <Button size="sm" onClick={() => setActionDialog('approve')}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                承認
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActionDialog('return')}
              >
                <Undo2 className="h-4 w-4 mr-1" />
                差戻し
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setActionDialog('reject')}
              >
                <XCircle className="h-4 w-4 mr-1" />
                却下
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 起票者向けアクション */}
        {isRequester && request.status === 'draft' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-4 flex flex-wrap items-center gap-2">
              <p className="text-sm text-blue-800 font-medium mr-auto">
                下書き状態です。編集して申請してください
              </p>
              <Button
                size="sm"
                onClick={() => router.push(`/approvals/new?draft=${request.id}`)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                編集して申請
              </Button>
            </CardContent>
          </Card>
        )}

        {request.status === 'publish_failed' && canReassign && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4 flex flex-wrap items-center gap-2">
              <p className="text-sm text-red-800 font-medium mr-auto">
                Slack投稿に失敗しました。チャンネル設定を確認して再試行してください
              </p>
              <Button size="sm" onClick={handleRepublish} disabled={processing}>
                <RefreshCw className="h-4 w-4 mr-1" />
                再投稿
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 本文 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">申請内容</CardTitle>
          </CardHeader>
          <CardContent>
            {request.content.caption_html ? (
              <div
                className="rich-content prose prose-sm max-w-none [&_img]:max-w-full [&_img]:rounded-md [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
                dangerouslySetInnerHTML={{ __html: request.content.caption_html }}
              />
            ) : (
              <p className="text-sm text-gray-400">本文がありません</p>
            )}
            {channelId && (
              <p className="mt-4 flex items-center gap-1 text-xs text-gray-500">
                <Hash className="h-3 w-3" />
                投稿先: {channelId}
              </p>
            )}
          </CardContent>
        </Card>

        {/* 承認ルート */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              承認ルート（{APPROVAL_MODE_LABELS[request.approval_mode]}）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalStepsView
              requestId={request.id}
              steps={request.steps}
              mode={request.approval_mode}
              currentStepNo={request.current_step_no}
              requestStatus={request.status}
              canReassign={canReassign}
              onUpdated={() => mutate()}
            />
          </CardContent>
        </Card>

        {/* 監査履歴 */}
        <ApprovalTimeline actions={request.actions} />

        {/* 取下げ */}
        {isRequester && ['draft', 'pending'].includes(request.status) && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-600"
              onClick={handleCancel}
            >
              <Ban className="h-4 w-4 mr-1" />
              申請を取り下げる
            </Button>
          </div>
        )}

        {/* 承認/却下/差戻ダイアログ */}
        <Dialog
          open={!!actionDialog}
          onOpenChange={(open) => !open && setActionDialog(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionDialog ? ACTION_CONFIG[actionDialog].title : ''}
              </DialogTitle>
            </DialogHeader>
            <div>
              <Label className="mb-1.5 block">
                コメント{actionDialog === 'approve' ? '（任意）' : ''}
              </Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={
                  actionDialog === 'approve'
                    ? '承認コメント（任意）'
                    : actionDialog === 'reject'
                      ? '却下理由を入力してください'
                      : '差戻し理由を入力してください'
                }
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                キャンセル
              </Button>
              {actionDialog && (
                <Button
                  variant={ACTION_CONFIG[actionDialog].variant}
                  onClick={handleAction}
                  disabled={processing}
                >
                  {processing ? '処理中...' : ACTION_CONFIG[actionDialog].buttonLabel}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  )
}
