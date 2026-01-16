/**
 * レスポンシブカードグリッドコンポーネント
 */
import { ReactNode } from 'react'

interface CardGridProps {
  children: ReactNode
  className?: string
}

// 汎用グリッドコンポーネント
export function CardGrid({ children, className = '' }: CardGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  )
}

// サマリーカード用グリッド（4カラム）
export function SummaryCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {children}
    </div>
  )
}

// チャート用グリッド（2カラム）
export function ChartGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {children}
    </div>
  )
}

// 3カラムグリッド
export function ThreeColumnGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {children}
    </div>
  )
}
