/**
 * 業績重点カード（汎用・コンパクト）
 *
 * design-demo/dashboard-demo.html の「業績重点カード行（3枚）」に準拠。
 * 店舗販売 / 通信販売 / クレーム状況 を共通レイアウトで表示する。
 */
'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** カードのアクセントカラー（アイコン背景・前年比バッジ） */
export type AccentColor = 'emerald' | 'sky' | 'amber' | 'green'

interface SubItem {
  label: string
  value: string
  /** 値の前に表示する小さなドット（クレーム状況のステータス表示用） */
  dotColor?: string
}

interface Props {
  /** カード見出し（例: 店舗販売） */
  title: string
  /** lucide アイコン */
  icon: LucideIcon
  /** メイン数値（整形済み文字列） */
  mainValue: string
  /** メイン数値の補足（例: 当月累計（営業日数 20日）） */
  caption?: string
  /** 前年比などのバッジ文言（例: 前年比 +8.2%） */
  yoyLabel: string
  /** バッジを良化色（true）／悪化色（false）にするか */
  yoyPositive: boolean
  /** 下部の補足項目（最大3件想定） */
  subItems: SubItem[]
  /** 遷移先 */
  href: string
  /** 遷移リンクのラベル（例: 店舗分析へ） */
  linkLabel: string
  /** アクセントカラー */
  accentColor: AccentColor
  /** ローディング状態 */
  loading?: boolean
}

// アクセントカラー → クラス対応
const ACCENT_CLASSES: Record<
  AccentColor,
  { iconBg: string; badgePositive: string; badgeNegative: string }
> = {
  emerald: {
    iconBg: 'bg-emerald-100 text-emerald-600',
    badgePositive: 'bg-emerald-50 text-emerald-700',
    badgeNegative: 'bg-red-50 text-red-600',
  },
  sky: {
    iconBg: 'bg-sky-100 text-sky-600',
    badgePositive: 'bg-sky-50 text-sky-700',
    badgeNegative: 'bg-red-50 text-red-600',
  },
  amber: {
    iconBg: 'bg-amber-100 text-amber-600',
    badgePositive: 'bg-green-50 text-green-700',
    badgeNegative: 'bg-red-50 text-red-600',
  },
  green: {
    iconBg: 'bg-green-100 text-green-600',
    badgePositive: 'bg-green-50 text-green-700',
    badgeNegative: 'bg-red-50 text-red-600',
  },
}

export function MetricSummaryCard({
  title,
  icon: Icon,
  mainValue,
  caption,
  yoyLabel,
  yoyPositive,
  subItems,
  href,
  linkLabel,
  accentColor,
  loading,
}: Props) {
  const accent = ACCENT_CLASSES[accentColor]

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gray-100 animate-pulse" />
            <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="h-5 w-24 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="h-8 w-40 rounded bg-gray-100 animate-pulse mt-3" />
        <div className="h-3 w-32 rounded bg-gray-100 animate-pulse mt-2" />
        <div className="h-3 w-full rounded bg-gray-100 animate-pulse mt-4" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center',
              accent.iconBg
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold text-gray-600">{title}</span>
        </div>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            yoyPositive ? accent.badgePositive : accent.badgeNegative
          )}
        >
          {yoyLabel}
        </span>
      </div>

      {/* メイン数値 */}
      <p className="text-3xl font-bold mt-3">{mainValue}</p>
      {caption && <p className="text-xs text-gray-500 mt-0.5">{caption}</p>}

      {/* 補足項目 */}
      {subItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
          {subItems.map((item) => (
            <span key={item.label} className="flex items-center gap-1">
              {item.dotColor && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.dotColor }}
                />
              )}
              {item.label} <b className="text-gray-900">{item.value}</b>
            </span>
          ))}
        </div>
      )}

      {/* 遷移リンク */}
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
