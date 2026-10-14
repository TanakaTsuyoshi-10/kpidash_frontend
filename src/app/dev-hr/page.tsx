/**
 * 開発専用: 人事分析ページの表示検証（本番では404）
 * SWR fallback で API 応答をモックし、認証なしでレイアウト・チャートを確認する。
 */
'use client'

import { notFound } from 'next/navigation'
import { SWRConfig } from 'swr'
import { UserProvider } from '@/contexts/UserContext'
import HrPage from '@/app/(dashboard)/hr/page'

const ME = {
  id: 'dev', email: 'dev@example.com', display_name: '開発確認', role: 'admin',
  is_admin: true, is_active: true,
  allowed_pages: ['dashboard', 'labor'],
}

const MONTHS = Array.from({ length: 36 }, (_, i) => {
  const d = new Date(2023, 10 + i, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
})

const FALLBACK = {
  '/api/v1/users/me': ME,
  '/hr/headcount': {
    as_of: '2026-10-14',
    stores: [
      { name: '三股店', total: 9, fulltime: 7, contract: 2, parttime: 0, unset: 0 },
      { name: '花山手東店', total: 7, fulltime: 7, contract: 0, parttime: 0, unset: 0 },
      { name: '春日店', total: 6, fulltime: 4, contract: 1, parttime: 1, unset: 0 },
    ],
    others: [
      { name: '製造部門', total: 103, fulltime: 80, contract: 5, parttime: 18, unset: 0 },
      { name: '本社', total: 11, fulltime: 10, contract: 0, parttime: 1, unset: 0 },
    ],
    company: { name: '全社', total: 223, fulltime: 179, contract: 13, parttime: 29, unset: 2 },
    is_sample: false,
  },
  '/hr/headcount-trend?months=36': {
    months: MONTHS,
    by_group: {
      '正社員': MONTHS.map((_, i) => 185 - Math.round(i / 6)),
      '契約社員': MONTHS.map((_, i) => 4 + Math.round(i / 4)),
      'パート・アルバイト': MONTHS.map(() => 30),
      '未設定': MONTHS.map(() => 2),
    },
    by_department: {
      '店舗部門': MONTHS.map(() => 87),
      '製造部門': MONTHS.map(() => 103),
      '通販部門': MONTHS.map(() => 10),
      '本社': MONTHS.map(() => 11),
      '部署未設定': MONTHS.map(() => 12),
    },
    is_sample: false,
  },
  '/hr/turnover?months=12': {
    monthly: MONTHS.slice(-12).map((m, i) => ({ month: m, hires: (i % 4), leavers: ((i + 1) % 3) })),
    hires_total: 30, leavers_total: 30, avg_headcount: 216.8, turnover_rate: 13.8,
    reasons: [{ reason: '未登録', count: 30 }],
    is_sample: false,
  },
  '/hr/org-health': {
    avg_age: 42.5, avg_tenure_years: 13.5,
    age_distribution: [
      { label: '〜19歳', count: 3 }, { label: '20代', count: 22 }, { label: '30代', count: 56 },
      { label: '40代', count: 83 }, { label: '50代', count: 43 }, { label: '60代', count: 16 },
    ],
    by_department: [
      { department: '店舗部門', headcount: 87, avg_age: 45.9, avg_tenure_years: 12.3 },
      { department: '製造部門', headcount: 103, avg_age: 40.4, avg_tenure_years: 15.1 },
    ],
    is_sample: false,
  },
  '/hr/store-labor?month=2026-09-01': {
    month: '2026-09',
    rows: [
      { store: '花山手東店', headcount: 7, labor_cost: 1869818, labor_cost_prev_year: 1700000, labor_cost_yoy: 10.0, sales: 16238578, labor_cost_ratio: 11.5, sales_per_head: 2319797, overtime_per_head: 16.1 },
      { store: '春日店', headcount: 6, labor_cost: 1319439, labor_cost_prev_year: 1400000, labor_cost_yoy: -5.8, sales: 13615556, labor_cost_ratio: 9.7, sales_per_head: 2269259, overtime_per_head: 11.2 },
      { store: '紫原店', headcount: 4, labor_cost: 900000, labor_cost_prev_year: 0, labor_cost_yoy: null, sales: null, labor_cost_ratio: null, sales_per_head: null, overtime_per_head: null },
    ],
    total: { store: '合計', headcount: 17, labor_cost: 4089257, labor_cost_prev_year: 3100000, labor_cost_yoy: 31.9, sales: 29854134, labor_cost_ratio: 13.7, sales_per_head: 1756125, overtime_per_head: null },
    unmatched_stores: [],
    is_sample: false,
  },
}

export default function DevHrPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }
  return (
    <SWRConfig value={{ fallback: FALLBACK, revalidateOnMount: false, revalidateOnFocus: false }}>
      <UserProvider>
        <div className="p-6">
          <HrPage />
        </div>
      </UserProvider>
    </SWRConfig>
  )
}
