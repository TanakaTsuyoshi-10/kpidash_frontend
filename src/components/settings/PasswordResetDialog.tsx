/**
 * パスワード再設定ダイアログ（管理者用）
 *
 * 確認 → 実行 → 仮パスワードの一度きり表示、までを1つのダイアログで行う。
 * 仮パスワードはサーバーに保存されないため、閉じると再表示できない
 * （必要なら再度「パスワード再設定」を実行する）。
 */
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, KeyRound, Loader2 } from 'lucide-react'
import { resetUserPassword } from '@/lib/api/users'
import type { UserProfileResponse } from '@/types/user'

interface PasswordResetDialogProps {
  user: UserProfileResponse | null
  onOpenChange: (open: boolean) => void
}

export function PasswordResetDialog({ user, onOpenChange }: PasswordResetDialogProps) {
  const [processing, setProcessing] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const displayName = user?.display_name || user?.email.split('@')[0] || ''

  const handleClose = (open: boolean) => {
    if (processing) return
    if (!open) {
      setTempPassword(null)
    }
    onOpenChange(open)
  }

  const handleReset = async () => {
    if (!user) return
    setProcessing(true)
    try {
      const result = await resetUserPassword(user.id)
      setTempPassword(result.temp_password)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'パスワードの再設定に失敗しました')
    } finally {
      setProcessing(false)
    }
  }

  const handleCopy = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      toast.success('仮パスワードをコピーしました')
    } catch {
      toast.error('コピーに失敗しました。手動で選択してコピーしてください')
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-gray-500" />
            パスワード再設定
          </DialogTitle>
          <DialogDescription>
            {displayName}（{user?.email}）
          </DialogDescription>
        </DialogHeader>

        {tempPassword == null ? (
          <>
            <p className="text-sm text-gray-600">
              この利用者のパスワードを新しい仮パスワードに再設定します。
              現在のパスワードは使えなくなります。実行しますか？
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={processing}>
                キャンセル
              </Button>
              <Button onClick={handleReset} disabled={processing}>
                {processing && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                再設定する
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                仮パスワードを発行しました。本人に安全な方法（口頭など）で伝えてください。
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border bg-gray-50 px-3 py-2 font-mono text-base tracking-wide select-all">
                  {tempPassword}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" />
                  コピー
                </Button>
              </div>
              <p className="text-xs text-amber-600">
                ※ この仮パスワードは今回のみ表示されます。閉じると再表示できません
                （必要な場合は再度パスワード再設定を実行してください）。
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>閉じる</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
