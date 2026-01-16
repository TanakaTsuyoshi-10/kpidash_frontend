/**
 * 利用者管理カード
 * 管理者のみに表示され、利用者管理画面へのリンクを提供
 */
'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ChevronRight } from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'

export function UserManagementCard() {
  const { isAdmin, isLoading } = useUserContext()

  // 管理者以外には表示しない
  if (isLoading || !isAdmin) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500" />
          <CardTitle className="text-lg">利用者管理</CardTitle>
        </div>
        <CardDescription>
          利用者の登録・編集・権限管理を行います
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/settings/users">
          <Button variant="outline" className="w-full justify-between">
            利用者管理
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
