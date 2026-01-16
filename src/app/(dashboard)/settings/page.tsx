/**
 * 設定ページ
 * プロファイル設定と利用者管理（管理者のみ）
 */
'use client'

import { UserManagementCard } from '@/components/settings/UserManagementCard'
import { ProfileSettingsCard } from '@/components/settings/ProfileSettingsCard'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <div className="grid gap-6 max-w-2xl">
        <UserManagementCard />
        <ProfileSettingsCard />
      </div>
    </div>
  )
}
