/**
 * 承認申請 起票ページ
 * リッチテキスト＋画像添付＋承認ルート指定＋Slack投稿先選択＋下書き保存
 */
'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PermissionGuard } from '@/components/PermissionGuard'
import { LazyTiptapEditor } from '@/components/lazy'
import { ApprovalRouteEditor } from '@/components/approvals/ApprovalRouteEditor'
import { useChannelBindings, useRequestTypes } from '@/hooks/useApprovals'
import {
  createDraft,
  getApprovalRequest,
  submitRequest,
  updateDraft,
} from '@/lib/api/approvals'
import type {
  ApprovalAttachment,
  ApprovalMode,
  ApproverInput,
} from '@/types/approval'

function NewApprovalForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') ?? ''
  const editDraftId = searchParams.get('draft')

  const { types } = useRequestTypes()
  const [requestType, setRequestType] = useState(initialType)
  const { bindings } = useChannelBindings(requestType || undefined)

  const [title, setTitle] = useState('')
  const [captionHtml, setCaptionHtml] = useState('')
  const [captionPlain, setCaptionPlain] = useState('')
  const [attachments, setAttachments] = useState<ApprovalAttachment[]>([])
  const [channelId, setChannelId] = useState('')
  const [approvers, setApprovers] = useState<ApproverInput[]>([
    { step_no: 1, assignee_id: '' },
  ])
  const [mode, setMode] = useState<ApprovalMode>('sequential')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const draftLoadedRef = useRef(false)

  // ?draft=xxx で既存下書き（差戻し済み含む）を読み込む
  useEffect(() => {
    if (!editDraftId || draftLoadedRef.current) return
    draftLoadedRef.current = true
    getApprovalRequest(editDraftId)
      .then((d) => {
        if (!d.can_edit) {
          toast.error('この申請は編集できません')
          router.replace(`/approvals/${editDraftId}`)
          return
        }
        setDraftId(d.id)
        setRequestType(d.request_type)
        setTitle(d.title === '(無題)' ? '' : d.title)
        setCaptionHtml(d.content.caption_html ?? '')
        setCaptionPlain(d.content.caption_plain ?? '')
        setAttachments(d.content.attachments ?? [])
        setChannelId((d.metadata.slack_channel_id as string) ?? '')
        setMode(d.approval_mode)
        if (d.steps.length > 0) {
          setApprovers(
            d.steps.map((s) => ({ step_no: s.step_no, assignee_id: s.assignee_id }))
          )
        }
        setEditorKey((k) => k + 1) // エディタを初期HTMLで再マウント
      })
      .catch(() => toast.error('下書きの読み込みに失敗しました'))
  }, [editDraftId, router])

  // 種別変更時: デフォルト承認モードとチャンネルを適用
  useEffect(() => {
    if (editDraftId) return // 下書き編集時は下書きの値を優先
    const t = types.find((t) => t.code === requestType)
    if (t) setMode(t.default_approval_mode)
  }, [requestType, types, editDraftId])

  useEffect(() => {
    if (bindings.length > 0 && !channelId) {
      const def = bindings.find((b) => b.is_default) ?? bindings[0]
      setChannelId(def.channel_id)
    }
  }, [bindings, channelId])

  const onEditorChange = useCallback((html: string, plain: string) => {
    setCaptionHtml(html)
    setCaptionPlain(plain)
  }, [])

  const onImageUploaded = useCallback((att: ApprovalAttachment) => {
    setAttachments((prev) => [...prev, att])
  }, [])

  const buildPayload = () => ({
    request_type: requestType,
    title: title || '(無題)',
    content: {
      caption_html: captionHtml,
      caption_plain: captionPlain,
      attachments,
    },
    metadata: channelId ? { slack_channel_id: channelId } : {},
    approval_mode: mode,
    approvers: approvers.filter((a) => a.assignee_id),
  })

  const handleSaveDraft = async () => {
    if (!requestType) {
      toast.error('申請種別を選択してください')
      return
    }
    setSaving(true)
    try {
      if (draftId) {
        await updateDraft(draftId, buildPayload())
      } else {
        const created = await createDraft(buildPayload())
        setDraftId(created.id)
      }
      toast.success('下書きを保存しました')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '下書きの保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!requestType) {
      toast.error('申請種別を選択してください')
      return
    }
    if (!title.trim()) {
      toast.error('タイトルを入力してください')
      return
    }
    const validApprovers = approvers.filter((a) => a.assignee_id)
    if (validApprovers.length === 0) {
      toast.error('承認者を1名以上指定してください')
      return
    }

    setSubmitting(true)
    try {
      let id = draftId
      if (!id) {
        const created = await createDraft(buildPayload())
        id = created.id
      } else {
        await updateDraft(id, buildPayload())
      }
      await submitRequest(id, {
        title,
        content: {
          caption_html: captionHtml,
          caption_plain: captionPlain,
          attachments,
        },
        metadata: channelId ? { slack_channel_id: channelId } : {},
        approval_mode: mode,
        approvers: validApprovers,
      })
      toast.success('申請しました。承認者へ通知メールを送信しました')
      router.push('/approvals')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '申請に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/approvals')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">新規申請</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">申請内容</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5 block">申請種別</Label>
            <Select
              value={requestType || undefined}
              onValueChange={setRequestType}
              disabled={!!draftId}
            >
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue placeholder="種別を選択..." />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {requestType && (
              <p className="mt-1 text-xs text-gray-400">
                {types.find((t) => t.code === requestType)?.description}
              </p>
            )}
          </div>

          <div>
            <Label className="mb-1.5 block">タイトル</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 7月キャンペーン告知投稿"
            />
          </div>

          <div>
            <Label className="mb-1.5 block">本文（キャプション＋画像）</Label>
            <LazyTiptapEditor
              key={editorKey}
              initialHtml={captionHtml}
              onChange={onEditorChange}
              onImageUploaded={onImageUploaded}
            />
          </div>

          {bindings.length > 1 && (
            <div>
              <Label className="mb-1.5 block">Slack投稿先チャンネル</Label>
              <Select value={channelId || undefined} onValueChange={setChannelId}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue placeholder="投稿先を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {bindings.map((b) => (
                    <SelectItem key={b.id} value={b.channel_id}>
                      {b.label}
                      {b.channel_name ? `（#${b.channel_name}）` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {bindings.length === 1 && (
            <p className="text-xs text-gray-500">
              承認完了後、
              <span className="font-medium">
                {bindings[0].label}
                {bindings[0].channel_name ? `（#${bindings[0].channel_name}）` : ''}
              </span>
              に自動投稿されます
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">承認ルート</CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalRouteEditor
            approvers={approvers}
            mode={mode}
            onChange={(a, m) => {
              setApprovers(a)
              setMode(m)
            }}
          />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2 pb-8">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={saving || submitting}
        >
          <Save className="h-4 w-4 mr-1" />
          {saving ? '保存中...' : '下書き保存'}
        </Button>
        <Button onClick={handleSubmit} disabled={saving || submitting}>
          <SendHorizonal className="h-4 w-4 mr-1" />
          {submitting ? '申請中...' : '申請する'}
        </Button>
      </div>
    </div>
  )
}

export default function NewApprovalPage() {
  return (
    <PermissionGuard pageKey="approvals">
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-50 rounded-lg" />}>
        <NewApprovalForm />
      </Suspense>
    </PermissionGuard>
  )
}
