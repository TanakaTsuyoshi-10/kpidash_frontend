/**
 * 人事分析ページ（SmartHR連携）
 *
 * 店舗別の人員構成・人件費×売上、在籍人数の推移、入退社、組織の健全性を表示する。
 * 個人を特定できる情報は表示せず、集計値のみを扱う。
 * 閲覧権限はページ権限「labor」（役員・管理者＋許可されたユーザー）で制御。
 */
'use client'

import { Fragment, useMemo, useState } from 'react'
import { format, subMonths } from 'date-fns'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChevronDown,
  ChevronRight,
  Users,
  TrendingUp,
  UserPlus,
  HeartPulse,
  Store,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PermissionGuard } from '@/components/PermissionGuard'
import { FiscalMonthSelector } from '@/components/dashboard/FiscalMonthSelector'
import {
  useHeadcount,
  useHeadcountTrend,
  useTurnover,
  useOrgHealth,
  useStoreLabor,
} from '@/hooks/useHr'
import { cn } from '@/lib/utils'

const GROUP_COLORS: Record<string, string> = {
  正社員: '#059669',
  契約社員: '#2563eb',
  'パート・アルバイト': '#d97706',
  未設定: '#9ca3af',
}

function yen(v: number | null | undefined): string {
  if (v == null) return '-'
  return `¥${Math.round(v).toLocaleString()}`
}

function SectionCard({
  title,
  icon,
  defaultOpen = true,
  summary,
  children,
}: {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  summary?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card>
      <CardHeader
        onClick={() => setOpen(!open)}
        className="cursor-pointer select-none hover:bg-gray-50/60 transition-colors"
      >
        <CardTitle className="flex items-center gap-2 min-h-7">
          {open ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
          {icon}
          {title}
          {summary && (
            <span className="ml-auto text-sm font-normal text-gray-500">{summary}</span>
          )}
        </CardTitle>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}

function LoadingBlock() {
  return <div className="h-40 rounded-lg bg-gray-100 animate-pulse" />
}

// =============================================================================
// 店舗別 人件費 × 売上
// =============================================================================

interface LaborAreaGroup {
  area: string | null
  rows: import('@/types/hr').StoreLaborRow[]
  headcount: number
  laborCost: number
  sales: number | null
}

function groupLaborByArea(rows: import('@/types/hr').StoreLaborRow[]): LaborAreaGroup[] {
  const groups: LaborAreaGroup[] = []
  for (const r of rows) {
    const area = r.area ?? null
    let g = groups[groups.length - 1]
    if (!g || g.area !== area) {
      g = { area, rows: [], headcount: 0, laborCost: 0, sales: null }
      groups.push(g)
    }
    g.rows.push(r)
    g.headcount += r.headcount
    g.laborCost += r.labor_cost
    if (r.sales != null) g.sales = (g.sales ?? 0) + r.sales
  }
  return groups
}

function StoreLaborSection({ month }: { month: string }) {
  const { data, loading, error } = useStoreLabor(month)
  const groups = useMemo(() => groupLaborByArea(data?.rows ?? []), [data])

  return (
    <SectionCard
      title="店舗別 人件費 × 売上"
      icon={<Store className="h-5 w-5 text-gray-500" />}
      summary={
        data?.total
          ? `人件費計 ${yen(data.total.labor_cost)}・人件費率 ${data.total.labor_cost_ratio ?? '-'}%`
          : undefined
      }
    >
      {loading && <LoadingBlock />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && data.is_sample && (
        <p className="text-sm text-gray-400">SmartHR未接続のため表示できません。</p>
      )}
      {data && !data.is_sample && (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">店舗</TableHead>
                  <TableHead className="text-right">在籍数</TableHead>
                  <TableHead className="text-right">人件費</TableHead>
                  <TableHead className="text-right">前年比</TableHead>
                  <TableHead className="text-right">売上高</TableHead>
                  <TableHead className="text-right">人件費率</TableHead>
                  <TableHead className="text-right">1人あたり売上</TableHead>
                  <TableHead className="text-right">残業 h/人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <Fragment key={g.area ?? '__none__'}>
                    {g.area && g.rows.length > 1 && (
                      <TableRow className="bg-gray-100/80">
                        <TableCell className="font-semibold text-gray-700">{g.area}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{g.headcount}人</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{yen(g.laborCost)}</TableCell>
                        <TableCell />
                        <TableCell className="text-right tabular-nums font-semibold">{yen(g.sales)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">
                          {g.sales ? `${((g.laborCost / g.sales) * 100).toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell />
                        <TableCell />
                      </TableRow>
                    )}
                    {g.rows.map((r) => (
                  <TableRow
                    key={r.store}
                    className={cn(r.store === '通販事業部' && 'bg-indigo-50/40')}
                  >
                    <TableCell className={cn('font-medium', g.area && 'pl-6')}>{r.store}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.headcount}人</TableCell>
                    <TableCell className="text-right tabular-nums">{yen(r.labor_cost)}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums text-sm',
                        r.labor_cost_yoy == null
                          ? 'text-gray-400'
                          : r.labor_cost_yoy > 0
                            ? 'text-red-600'
                            : 'text-green-600',
                      )}
                    >
                      {r.labor_cost_yoy != null
                        ? `${r.labor_cost_yoy > 0 ? '+' : ''}${r.labor_cost_yoy}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{yen(r.sales)}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right tabular-nums font-medium',
                        r.labor_cost_ratio != null && r.labor_cost_ratio >= 15 && 'text-red-600',
                      )}
                    >
                      {r.labor_cost_ratio != null ? `${r.labor_cost_ratio}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{yen(r.sales_per_head)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.overtime_per_head != null ? `${r.overtime_per_head}h` : '-'}
                    </TableCell>
                  </TableRow>
                    ))}
                  </Fragment>
                ))}
                {data.total && (
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell>合計</TableCell>
                    <TableCell className="text-right tabular-nums">{data.total.headcount}人</TableCell>
                    <TableCell className="text-right tabular-nums">{yen(data.total.labor_cost)}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {data.total.labor_cost_yoy != null ? `${data.total.labor_cost_yoy > 0 ? '+' : ''}${data.total.labor_cost_yoy}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{yen(data.total.sales)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {data.total.labor_cost_ratio != null ? `${data.total.labor_cost_ratio}%` : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{yen(data.total.sales_per_head)}</TableCell>
                    <TableCell className="text-right" />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            ※ 人件費はSmartHR給与明細の総支給額（支給月ベース）。売上は店舗が店舗別実績、
            通販事業部が通販チャネル合計の実績。在籍数は月末時点。残業は1人あたり平均（支給対象者ベース）。
            {data.unmatched_stores.length > 0 &&
              ` ⚠ 店舗名を対応づけできなかった部署: ${data.unmatched_stores.join('、')}`}
          </p>
        </>
      )}
    </SectionCard>
  )
}

// =============================================================================
// 所属人数（店舗別・部門別）
// =============================================================================

function HeadcountSection() {
  const { data, loading, error } = useHeadcount()

  const renderRows = (
    rows: { name: string; area?: string | null; total: number; fulltime: number; contract: number; parttime: number; unset: number }[],
    indent = false,
  ) =>
    rows.map((r) => (
      <TableRow key={r.name}>
        <TableCell className={cn('font-medium', indent && r.area && 'pl-6')}>{r.name}</TableCell>
        <TableCell className="text-right tabular-nums font-bold">{r.total}人</TableCell>
        <TableCell className="text-right tabular-nums">{r.fulltime}</TableCell>
        <TableCell className="text-right tabular-nums">{r.contract}</TableCell>
        <TableCell className="text-right tabular-nums">{r.parttime}</TableCell>
        <TableCell className="text-right tabular-nums text-gray-400">{r.unset || '-'}</TableCell>
      </TableRow>
    ))

  // 店舗をエリアごとにグループ化（並び順はAPIのエリア順を維持）
  const storeGroups = useMemo(() => {
    const rows = data?.stores ?? []
    const groups: { area: string | null; rows: typeof rows; total: number; fulltime: number; contract: number; parttime: number; unset: number }[] = []
    for (const r of rows) {
      const area = r.area ?? null
      let g = groups[groups.length - 1]
      if (!g || g.area !== area) {
        g = { area, rows: [], total: 0, fulltime: 0, contract: 0, parttime: 0, unset: 0 }
        groups.push(g)
      }
      g.rows.push(r)
      g.total += r.total
      g.fulltime += r.fulltime
      g.contract += r.contract
      g.parttime += r.parttime
      g.unset += r.unset
    }
    return groups
  }, [data])

  return (
    <SectionCard
      title="所属人数（店舗別・部門別）"
      icon={<Users className="h-5 w-5 text-gray-500" />}
      summary={data?.company ? `全社 ${data.company.total}人` : undefined}
    >
      {loading && <LoadingBlock />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && data.is_sample && (
        <p className="text-sm text-gray-400">SmartHR未接続のため表示できません。</p>
      )}
      {data && !data.is_sample && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-2">店舗</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>店舗</TableHead>
                  <TableHead className="text-right">計</TableHead>
                  <TableHead className="text-right">正社員</TableHead>
                  <TableHead className="text-right">契約</TableHead>
                  <TableHead className="text-right">パート</TableHead>
                  <TableHead className="text-right">未設定</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storeGroups.map((g) => (
                  <Fragment key={g.area ?? '__none__'}>
                    {g.area && (
                      <TableRow className="bg-gray-100/80">
                        <TableCell className="font-semibold text-gray-700">{g.area}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{g.total}人</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{g.fulltime}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{g.contract}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{g.parttime}</TableCell>
                        <TableCell className="text-right tabular-nums text-gray-400">{g.unset || '-'}</TableCell>
                      </TableRow>
                    )}
                    {renderRows(g.rows, true)}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="overflow-x-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-2">店舗以外・全社</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部門</TableHead>
                  <TableHead className="text-right">計</TableHead>
                  <TableHead className="text-right">正社員</TableHead>
                  <TableHead className="text-right">契約</TableHead>
                  <TableHead className="text-right">パート</TableHead>
                  <TableHead className="text-right">未設定</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renderRows(data.others)}
                {data.company && (
                  <TableRow className="bg-gray-50 font-bold">
                    <TableCell>全社</TableCell>
                    <TableCell className="text-right tabular-nums">{data.company.total}人</TableCell>
                    <TableCell className="text-right tabular-nums">{data.company.fulltime}</TableCell>
                    <TableCell className="text-right tabular-nums">{data.company.contract}</TableCell>
                    <TableCell className="text-right tabular-nums">{data.company.parttime}</TableCell>
                    <TableCell className="text-right tabular-nums">{data.company.unset}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <p className="mt-3 text-xs text-gray-400">
              ※ 在籍者のみ（{data.as_of} 時点）。正社員=正社員・役員、契約=契約社員・派遣・業務委託、
              パート=アルバイト・パート等（曜日限定・期間限定含む）。
            </p>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// =============================================================================
// 在籍人数の推移
// =============================================================================

function TrendSection() {
  const { data, loading, error } = useHeadcountTrend(36)
  const [mode, setMode] = useState<'group' | 'department'>('group')

  const chartData = useMemo(() => {
    if (!data) return []
    const series = mode === 'group' ? data.by_group : data.by_department
    return data.months.map((m, i) => ({
      month: m,
      ...Object.fromEntries(Object.entries(series).map(([k, v]) => [k, v[i]])),
    }))
  }, [data, mode])

  const keys = useMemo(() => {
    if (!data) return []
    return Object.keys(mode === 'group' ? data.by_group : data.by_department)
  }, [data, mode])

  const DEPT_COLORS = ['#059669', '#2563eb', '#d97706', '#7c3aed', '#9ca3af']

  const latestTotal = useMemo(() => {
    if (!data) return null
    return Object.values(data.by_group).reduce((acc, v) => acc + (v[v.length - 1] ?? 0), 0)
  }, [data])

  return (
    <SectionCard
      title="在籍人数の推移（過去3年）"
      icon={<TrendingUp className="h-5 w-5 text-gray-500" />}
      summary={latestTotal != null ? `現在 ${latestTotal}人` : undefined}
    >
      {loading && <LoadingBlock />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && !data.is_sample && (
        <>
          <div className="mb-3 flex gap-1">
            {(
              [
                { v: 'group', label: '雇用形態別' },
                { v: 'department', label: '部門別' },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                onClick={() => setMode(o.v)}
                className={cn(
                  'px-3 py-1 rounded text-sm border',
                  mode === o.v
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 hover:bg-gray-50',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={30} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {keys.map((k, i) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stackId="1"
                    stroke={GROUP_COLORS[k] ?? DEPT_COLORS[i % DEPT_COLORS.length]}
                    fill={GROUP_COLORS[k] ?? DEPT_COLORS[i % DEPT_COLORS.length]}
                    fillOpacity={0.5}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            ※ 各月末時点の在籍数（入社日・退職日から算出）。
          </p>
        </>
      )}
    </SectionCard>
  )
}

// =============================================================================
// 入退社サマリー
// =============================================================================

function TurnoverSection() {
  const { data, loading, error } = useTurnover(12)

  return (
    <SectionCard
      title="入退社の動き（直近12ヶ月）"
      icon={<UserPlus className="h-5 w-5 text-gray-500" />}
      summary={
        data && !data.is_sample
          ? `入社 ${data.hires_total}人・退職 ${data.leavers_total}人・離職率 ${data.turnover_rate ?? '-'}%`
          : undefined
      }
    >
      {loading && <LoadingBlock />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && !data.is_sample && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hires" name="入社" fill="#059669" />
                <Bar dataKey="leavers" name="退職" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <div className="space-y-2 mb-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-gray-500">年間離職率（退職者÷平均在籍 {data.avg_headcount}人）</p>
                <p className="text-2xl font-bold tabular-nums">
                  {data.turnover_rate != null ? `${data.turnover_rate}%` : '-'}
                </p>
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">退職理由</h3>
            {data.reasons.length === 0 ? (
              <p className="text-sm text-gray-400">退職者なし</p>
            ) : (
              <ul className="text-sm space-y-1">
                {data.reasons.map((r) => (
                  <li key={r.reason} className="flex justify-between border-b py-1">
                    <span className="text-gray-600">{r.reason}</span>
                    <span className="tabular-nums">{r.count}人</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-gray-400">
              ※ 理由はSmartHRの退職理由欄の登録内容。未入力は「未登録」。
            </p>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// =============================================================================
// 組織の健全性
// =============================================================================

function OrgHealthSection() {
  const { data, loading, error } = useOrgHealth()

  return (
    <SectionCard
      title="組織の健全性（年齢・勤続）"
      icon={<HeartPulse className="h-5 w-5 text-gray-500" />}
      summary={
        data && !data.is_sample
          ? `平均年齢 ${data.avg_age ?? '-'}歳・平均勤続 ${data.avg_tenure_years ?? '-'}年`
          : undefined
      }
      defaultOpen={false}
    >
      {loading && <LoadingBlock />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && !data.is_sample && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">年齢構成（在籍者）</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.age_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="人数" fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="overflow-x-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-2">部門別</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>部門</TableHead>
                  <TableHead className="text-right">在籍数</TableHead>
                  <TableHead className="text-right">平均年齢</TableHead>
                  <TableHead className="text-right">平均勤続</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_department.map((d) => (
                  <TableRow key={d.department}>
                    <TableCell className="font-medium">{d.department}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.headcount}人</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.avg_age != null ? `${d.avg_age}歳` : '-'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {d.avg_tenure_years != null ? `${d.avg_tenure_years}年` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// =============================================================================
// ページ本体
// =============================================================================

export default function HrPage() {
  // 店舗別人件費は給与確定済みの前月を初期表示
  const [month, setMonth] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-01'))

  return (
    <PermissionGuard pageKey="labor">
      <div className="w-full space-y-4 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">人事分析</h1>
            <p className="text-sm text-gray-600 mt-1">
              SmartHR連携による人員・人件費の分析（集計値のみ表示）
            </p>
          </div>
          <FiscalMonthSelector value={month} onChange={setMonth} />
        </div>

        <StoreLaborSection month={month} />
        <HeadcountSection />
        <TrendSection />
        <TurnoverSection />
        <OrgHealthSection />
      </div>
    </PermissionGuard>
  )
}
