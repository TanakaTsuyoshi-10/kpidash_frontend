/**
 * ページ閲覧権限ガード
 * 許可されていないページへのアクセスをリダイレクトする
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useUserContext } from '@/contexts/UserContext'
import type { PageKey } from '@/types/user'

interface PermissionGuardProps {
  pageKey: PageKey
  children: React.ReactNode
}

export function PermissionGuard({ pageKey, children }: PermissionGuardProps) {
  const { allowedPages, isLoading } = useUserContext()
  const router = useRouter()

  const hasPermission = allowedPages.includes(pageKey)

  useEffect(() => {
    if (!isLoading && !hasPermission) {
      toast.error('このページへのアクセス権限がありません')
      router.replace('/dashboard')
    }
  }, [isLoading, hasPermission, router])

  if (isLoading || !hasPermission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  return <>{children}</>
}
