/**
 * 代理承認設定ページ
 * 全員が自分の不在期間の代理承認者を設定できる。admin は全員分を閲覧・管理可能
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, UserCog } from 'lucide-react'
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
import { useAssignableUsers, useDelegates } from '@/hooks/useApprovals'
import { createDelegate, deleteDelegate } from '@/lib/api/approvals'

function formatPeriod(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt)
  const e = new Date(endsAt)
  const fmt = (d: Date) =>
    `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  return `${fmt(s)} 〜 ${fmt(e)}`
}

function isActiveNow(startsAt: string, endsAt: string): boolean {
  const now = Date.now()
  return new Date(startsAt).getTime() <= now && now <= new Date(endsAt).getTime()
}

export default function DelegatesPage() {
  const router = useRouter()
  const { user, isAdmin } = useUserContext()
  const [showAll, setShowAll] = useState(false)
  const { delegates, mutate } = useDelegates(showAll)
  const { users } = useAssignableUsers()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    user_id: '',
    delegate_id: '',
    starts_at: '',
    ends_at: '',
    note: '',
  })
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!form.delegate_id || !form.starts_at || !form.ends_at) {
      toast.error('代理人と期間を入力してください')
      return
    }
    if (new Date(form.starts_at) >= new Date(form.ends_at)) {
      toast.error('終了日は開始日より後にしてください')
      return
    }
    setSaving(true)
    try {
      await createDelegate({
        user_id: isAdmin && form.user_id ? form.user_id : undefined,
        delegate_id: form.delegate_id,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(`${form.ends_at}T23:59:59`).toISOString(),
        note: form.note || undefined,
      })
      toast.success('代理設定を追加しました')
      setDialogOpen(false)
      setForm({ user_id: '', delegate_id: '', starts_at: '', ends_at: '', note: '' })
      mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この代理設定を削除しますか？')) return
    try {
      await deleteDelegate(id)
      mutate()
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
        <h1 className="text-xl font-bold text-gray-900">代理承認設定</h1>
      </div>

      <p className="text-sm text-gray-500">
        不在期間中の代理承認者を事前に設定しておくと、期間中に申請された案件の承認担当が自動的に代理人へ切り替わります。
      </p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            {showAll ? '全ユーザーの代理設定' : '自分の代理設定'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)}>
                {showAll ? '自分の分のみ' : '全員分を表示'}
              </Button>
            )}
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              追加
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {delegates.length === 0 && (
            <p className="text-sm text-gray-400 py-6 text-center">
              代理設定はありません
            </p>
          )}
          {delegates.map((d) => {
            const active = isActiveNow(d.starts_at, d.ends_at)
            return (
              <div
                key={d.id}
                className={`flex items-center gap-3 rounded-md border px-4 py-2.5 ${
                  active ? 'border-purple-300 bg-purple-50' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800">
                    {showAll && (
                      <span className="font-medium">{d.user_name ?? d.user_email} → </span>
                    )}
                    <span className="font-medium">
                      {d.delegate_name ?? d.delegate_email}
                    </span>
                    さんへ委譲
                    {active && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-200 text-purple-800">
                        有効中
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPeriod(d.starts_at, d.ends_at)}
                    {d.note && ` ・ ${d.note}`}
                  </p>
                </div>
                {(isAdmin || d.user_id === user?.id) && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* 追加ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>代理設定を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isAdmin && showAll && (
              <div>
                <Label className="mb-1.5 block">委任元（不在になる人）</Label>
                <Select
                  value={form.user_id || undefined}
                  onValueChange={(v) => setForm({ ...form, user_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="省略時は自分" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name}（{u.email}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="mb-1.5 block">代理承認者</Label>
              <Select
                value={form.delegate_id || undefined}
                onValueChange={(v) => setForm({ ...form, delegate_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.id !== (form.user_id || user?.id))
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name}（{u.email}）
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block">開始日</Label>
                <Input
                  type="date"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">終了日</Label>
                <Input
                  type="date"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">メモ（任意）</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="例: 夏季休暇"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? '追加中...' : '追加する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
