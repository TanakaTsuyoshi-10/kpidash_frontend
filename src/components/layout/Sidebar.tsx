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

// ナビゲーション項目の定義（エクスポートしてMobileSidebarでも使用）
export const menuItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/finance', label: '財務分析', icon: TrendingUp },
  { href: '/products', label: '店舗分析', icon: Store },
  { href: '/ecommerce', label: '通販分析', icon: ShoppingCart },
  { href: '/manufacturing', label: '製造分析', icon: Factory },
  { href: '/manufacturing/complaints', label: 'クレーム管理', icon: AlertTriangle },
  { href: '/upload', label: 'データアップロード', icon: Upload },
  { href: '/targets', label: '目標設定', icon: Target },
  { href: '/settings', label: '設定', icon: Settings },
]

// MobileSidebar用のnavItems形式に変換
export const navItems = menuItems.map((item) => ({
  href: item.href,
  label: item.label,
  icon: <item.icon className="h-5 w-5" />,
}))

interface SidebarProps {
  userName?: string
  onLogout?: () => void
}

export function Sidebar({ userName, onLogout }: SidebarProps) {
  const pathname = usePathname()

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
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  prefetch={item.href === '/dashboard'}
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
