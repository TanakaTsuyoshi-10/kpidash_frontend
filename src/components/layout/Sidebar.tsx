/**
 * デスクトップ用サイドバー（レスポンシブ対応）
 */
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  Target,
  Settings,
  Building2,
  Store,
  TrendingUp,
  ShoppingCart,
  Factory,
  AlertTriangle,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserContext } from '@/contexts/UserContext'
import type { PageKey } from '@/types/user'

// ナビゲーション項目の定義（エクスポートしてMobileSidebarでも使用）
export const menuItems: Array<{
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  pageKey?: PageKey
}> = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard, pageKey: 'dashboard' },
  { href: '/finance', label: '財務分析', icon: TrendingUp, pageKey: 'finance' },
  { href: '/products', label: '店舗分析', icon: Store, pageKey: 'products' },
  { href: '/ecommerce', label: '通販分析', icon: ShoppingCart, pageKey: 'ecommerce' },
  { href: '/manufacturing', label: '製造分析', icon: Factory, pageKey: 'manufacturing' },
  { href: '/manufacturing/complaints', label: 'クレーム管理', icon: AlertTriangle, pageKey: 'complaints' },
  { href: '/upload', label: 'データアップロード', icon: Upload, pageKey: 'upload' },
  { href: '/targets', label: '目標設定', icon: Target, pageKey: 'targets' },
  { href: '/settings', label: '設定', icon: Settings },
]

// MobileSidebar用のnavItems形式に変換（pageKeyを含める）
export const navItems = menuItems.map((item) => ({
  href: item.href,
  label: item.label,
  icon: <item.icon className="h-5 w-5" />,
  pageKey: item.pageKey,
}))

interface SidebarProps {
  userName?: string
  onLogout?: () => void
}

export function Sidebar({ userName, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const { allowedPages, isAdmin } = useUserContext()

  const visibleItems = menuItems.filter((item) => {
    // pageKeyなし（設定など）は常時表示
    if (!item.pageKey) return true
    // 管理者は全て表示
    if (isAdmin) return true
    return allowedPages.includes(item.pageKey)
  })

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-50 border-r border-gray-200">
      {/* ロゴ */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="h-8 w-8 text-green-600" />
          <span className="text-lg font-bold">KPI管理</span>
        </div>
        {userName && (
          <p className="text-sm text-gray-500 truncate">{userName}</p>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ログアウト */}
      {onLogout && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>ログアウト</span>
          </button>
        </div>
      )}
    </aside>
  )
}
