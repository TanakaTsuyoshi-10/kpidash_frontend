/**
 * 目標設定概要カードコンポーネント
 */
'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Store, TrendingUp, ShoppingCart, ChevronRight, Check, Circle } from 'lucide-react'
import { format } from 'date-fns'
import type { DepartmentTargetSummary } from '@/types/target'

interface Props {
  department: DepartmentTargetSummary
}

const departmentConfig: Record<string, { icon: typeof Store; color: string; bgColor: string; href: string }> = {
  store: {
    icon: Store,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    href: '/targets/store',
  },
  financial: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    href: '/targets/financial',
  },
  ecommerce: {
    icon: ShoppingCart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    href: '/targets/ecommerce',
  },
}

export function TargetOverviewCard({ department }: Props) {
  const config = departmentConfig[department.department_type]
  const Icon = config?.icon || Store

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      return format(new Date(dateStr), 'yyyy/MM/dd HH:mm')
    } catch {
      return dateStr
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${config?.bgColor || 'bg-gray-50'}`}>
              <Icon className={`h-6 w-6 ${config?.color || 'text-gray-600'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{department.department_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {department.has_targets ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">
                      設定済み（{department.target_count}項目）
                    </span>
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">未設定</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {department.last_updated ? (
              <span>最終更新: {formatLastUpdated(department.last_updated)}</span>
            ) : (
              <span>-</span>
            )}
          </div>
          <Link href={config?.href || '/targets'}>
            <Button variant="outline" size="sm">
              目標を設定
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
