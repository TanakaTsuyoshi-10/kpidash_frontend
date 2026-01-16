/**
 * 利用者一覧テーブル
 */
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil } from 'lucide-react'
import type { UserProfileResponse } from '@/types/user'

interface UserListTableProps {
  users: UserProfileResponse[]
  onEdit: (user: UserProfileResponse) => void
}

function getRoleBadge(role: string, roleName: string | null) {
  const displayName = roleName || (role === 'admin' ? '管理者' : '一般利用者')

  if (role === 'admin') {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        {displayName}
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
      {displayName}
    </Badge>
  )
}

function getStatusBadge(isActive: boolean) {
  if (isActive) {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        有効
      </Badge>
    )
  }

  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
      無効
    </Badge>
  )
}

function getDisplayName(user: UserProfileResponse) {
  if (user.display_name) {
    return user.display_name
  }
  // メールアドレスの@前の部分をデフォルト表示名として使用
  return user.email.split('@')[0]
}

export function UserListTable({ users, onEdit }: UserListTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>利用者名</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>権限</TableHead>
            <TableHead>状態</TableHead>
            <TableHead className="w-[80px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                利用者が登録されていません
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {getDisplayName(user)}
                </TableCell>
                <TableCell className="text-gray-600">
                  {user.email}
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.role, user.role_name)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.is_active)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(user)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">編集</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
