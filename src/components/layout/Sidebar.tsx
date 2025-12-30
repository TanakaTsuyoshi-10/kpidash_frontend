/**
 * ダッシュボードサイドバー
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 shrink-0 bg-gray-50 border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-green-600" />
          <span className="text-lg font-bold">KPI管理</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
