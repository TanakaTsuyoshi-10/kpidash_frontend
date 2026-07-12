/**
 * 申請種別マスタ管理ページ（admin のみ）
 * 種別の有効/無効・Slack投稿先バインディングの管理
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Hash, Star } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUserContext } from '@/contexts/UserContext'
import { useChannelBindings, useRequestTypes } from '@/hooks/useApprovals'
import {
  createChannelBinding,
  createRequestType,
  deleteChannelBinding,
  updateRequestType,
} from '@/lib/api/approvals'
import { APPROVAL_MODE_LABELS, type ApprovalMode } from '@/types/approval'

export default function ApprovalTypesPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useUserContext()
  const { types, mutate: mutateTypes } = useRequestTypes(true)
  const { bindings, mutate: mutateBindings } = useChannelBindings()

  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [newType, setNewType] = useState({ code: '', label: '', description: '' })
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [newBinding, setNewBinding] = useState({
    request_type: '',
    label: '',
    channel_id: '',
    is_default: false,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast.error('このページは管理者のみアクセスできます')
      router.replace('/dashboard')
    }
  }, [isLoading, isAdmin, router])

  if (!isAdmin) return null

  const handleCreateType = async () => {
    if (!newType.code || !newType.label) {
      toast.error('コードと表示名を入力してください')
      return
    }
    setSaving(true)
    try {
      await createRequestType(newType)
      toast.success('申請種別を追加しました')
      setTypeDialogOpen(false)
      setNewType({ code: '', label: '', description: '' })
      mutateTypes()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (code: string, isActive: boolean) => {
    try {
      await updateRequestType(code, { is_active: !isActive })
      mutateTypes()
      toast.success(isActive ? '無効化しました' : '有効化しました')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '更新に失敗しました')
    }
  }

  const handleModeChange = async (code: string, mode: string) => {
    try {
      await updateRequestType(code, { default_approval_mode: mode as ApprovalMode })
      mutateTypes()
      toast.success('既定の承認方式を変更しました')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '更新に失敗しました')
    }
  }

  const handleCreateBinding = async () => {
    if (!newBinding.request_type || !newBinding.label || !newBinding.channel_id) {
      toast.error('種別・表示名・チャンネルIDを入力してください')
      return
    }
    setSaving(true)
    try {
      await createChannelBinding(newBinding)
      toast.success('Slack投稿先を登録しました')
      setBindingDialogOpen(false)
      setNewBinding({ request_type: '', label: '', channel_id: '', is_default: false })
      mutateBindings()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '登録に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBinding = async (id: string) => {
    if (!confirm('この投稿先を削除しますか？')) return
    try {
      await deleteChannelBinding(id)
      mutateBindings()
      toast.success('削除しました')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '削除に失敗しました')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">申請種別マスタ</h1>
      </div>

      {/* 種別一覧 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">申請種別</CardTitle>
          <Button size="sm" onClick={() => setTypeDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            種別を追加
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {types.map((t) => (
            <div
              key={t.code}
              className={`rounded-md border px-4 py-3 ${t.is_active ? '' : 'opacity-50'}`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800">
                    {t.label}
                    <span className="ml-2 text-xs text-gray-400">{t.code}</span>
                  </p>
                  {t.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                  )}
                </div>
                <Select
                  value={t.default_approval_mode}
                  onValueChange={(v) => handleModeChange(t.code, v)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(APPROVAL_MODE_LABELS) as ApprovalMode[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {APPROVAL_MODE_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(t.code, t.is_active)}
                >
                  {t.is_active ? '無効化' : '有効化'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Slack 投稿先 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Slack投稿先チャンネル</CardTitle>
          <Button size="sm" onClick={() => setBindingDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            投稿先を追加
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {bindings.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">
              投稿先が未設定です。承認完了時のSlack自動投稿には設定が必要です
            </p>
          )}
          {bindings.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-md border px-4 py-2.5">
              <Hash className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800">
                  {b.label}
                  {b.channel_name && (
                    <span className="ml-2 text-xs text-gray-400">#{b.channel_name}</span>
                  )}
                  {b.is_default && (
                    <Star className="inline h-3.5 w-3.5 ml-1.5 text-amber-500 fill-amber-500" />
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {types.find((t) => t.code === b.request_type)?.label ?? b.request_type}
                  ・{b.channel_id}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteBinding(b.id)}>
                <Trash2 className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2">
            チャンネルIDは Slack のチャンネル詳細（チャンネル名クリック →
            最下部）で確認できます。Bot（kpidash）を対象チャンネルに /invite
            しておく必要があります。
          </p>
        </CardContent>
      </Card>

      {/* 種別追加ダイアログ */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申請種別を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">コード（半角英数とアンダースコア）</Label>
              <Input
                value={newType.code}
                onChange={(e) => setNewType({ ...newType, code: e.target.value })}
                placeholder="例: expense"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">表示名</Label>
              <Input
                value={newType.label}
                onChange={(e) => setNewType({ ...newType, label: e.target.value })}
                placeholder="例: 経費申請"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">説明（任意）</Label>
              <Input
                value={newType.description}
                onChange={(e) => setNewType({ ...newType, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateType} disabled={saving}>
              {saving ? '追加中...' : '追加する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 投稿先追加ダイアログ */}
      <Dialog open={bindingDialogOpen} onOpenChange={setBindingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Slack投稿先を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">申請種別</Label>
              <Select
                value={newBinding.request_type || undefined}
                onValueChange={(v) => setNewBinding({ ...newBinding, request_type: v })}
              >
                <SelectTrigger>
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
            </div>
            <div>
              <Label className="mb-1.5 block">表示名</Label>
              <Input
                value={newBinding.label}
                onChange={(e) => setNewBinding({ ...newBinding, label: e.target.value })}
                placeholder="例: LINE告知用チャンネル"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">SlackチャンネルID</Label>
              <Input
                value={newBinding.channel_id}
                onChange={(e) =>
                  setNewBinding({ ...newBinding, channel_id: e.target.value })
                }
                placeholder="例: C0XXXXXXXXX"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={newBinding.is_default}
                onChange={(e) =>
                  setNewBinding({ ...newBinding, is_default: e.target.checked })
                }
              />
              デフォルトの投稿先にする
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBindingDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreateBinding} disabled={saving}>
              {saving ? '登録中...' : '登録する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
