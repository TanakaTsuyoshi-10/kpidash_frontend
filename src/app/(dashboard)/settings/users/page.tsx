/**
 * 利用者管理ページ
 * 管理者のみがアクセス可能
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Loader2 } from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import { useUserList } from '@/hooks/useUsers'
import { UserListTable } from '@/components/settings/UserListTable'
import { UserCreateModal } from '@/components/settings/UserCreateModal'
import { UserEditModal } from '@/components/settings/UserEditModal'
import type { UserProfileResponse } from '@/types/user'

export default function UsersPage() {
  const router = useRouter()
  const { isAdmin, isLoading: userLoading } = useUserContext()
  const { users, loading, fetchUsers } = useUserList()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfileResponse | null>(null)

  // 管理者以外はリダイレクト
  useEffect(() => {
    if (!userLoading && !isAdmin) {
      router.push('/settings')
    }
  }, [isAdmin, userLoading, router])

  // 初回読み込み
  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [isAdmin, fetchUsers])

  const handleEdit = (user: UserProfileResponse) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }

  const handleSuccess = () => {
    fetchUsers()
  }

  // ローディング中または管理者でない場合
  if (userLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/settings"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            設定に戻る
          </Link>
          <h1 className="text-2xl font-bold">利用者管理</h1>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規登録
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <UserListTable users={users} onEdit={handleEdit} />
      )}

      <UserCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleSuccess}
      />

      <UserEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
