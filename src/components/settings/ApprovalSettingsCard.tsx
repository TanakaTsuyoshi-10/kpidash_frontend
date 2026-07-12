/**
 * 承認ワークフロー設定カード
 * - 代理承認設定: approvals 権限を持つ全員に表示
 * - 申請種別マスタ: 管理者のみに表示
 */
'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, ChevronRight } from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'

export function ApprovalSettingsCard() {
  const { isAdmin, allowedPages, isLoading } = useUserContext()

  const canViewApprovals = isAdmin || allowedPages.includes('approvals')
  if (isLoading || !canViewApprovals) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-gray-500" />
          <CardTitle className="text-lg">承認ワークフロー</CardTitle>
        </div>
        <CardDescription>
          不在時の代理承認者、申請種別・Slack投稿先の設定を行います
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href="/settings/delegates" className="block">
          <Button variant="outline" className="w-full justify-between">
            代理承認設定
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        {isAdmin && (
          <Link href="/settings/approval-types" className="block">
            <Button variant="outline" className="w-full justify-between">
              申請種別マスタ・Slack投稿先
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
