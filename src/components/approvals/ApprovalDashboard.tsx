/**
 * 承認ワークフロー ダッシュボード（/approvals のタブ内に表示）
 *
 * - 部署別×フェーズ別の起票件数サマリー
 * - 全案件の一覧（起票者・部署・種別・フェーズ）
 * 閲覧範囲は一覧と同じ（全社閲覧権限がなければ自部署＋自分の起票分）。
 */
'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useApprovalDashboard } from '@/hooks/useApprovals'
import {
  REQUEST_STATUS_LABELS,
  type ApprovalRequestStatus,
} from '@/types/approval'
import { cn } from '@/lib/utils'

const PHASE_COLORS: Record<string, string> = {
  起票中: 'bg-gray-100 text-gray-600',
  承認待ち: 'bg-amber-100 text-amber-700',
  承認済み: 'bg-emerald-100 text-emerald-700',
  却下: 'bg-red-100 text-red-700',
  取下げ: 'bg-gray-100 text-gray-500',
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

export function ApprovalDashboard() {
  const router = useRouter()
  const { data, isLoading } = useApprovalDashboard()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-40 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm text-gray-400 py-12 text-center">データがありません</p>
  }

  return (
    <div className="space-y-4">
      {/* 部署別サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">部署別 起票状況</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">部署</TableHead>
                  <TableHead className="text-right">起票中</TableHead>
                  <TableHead className="text-right">申請中（承認待ち）</TableHead>
                  <TableHead className="text-right">承認済み</TableHead>
                  <TableHead className="text-right">却下・取下</TableHead>
                  <TableHead className="text-right">合計</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_department.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-400">
                      起票がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.by_department.map((d) => (
                      <TableRow key={d.department_name}>
                        <TableCell className="font-medium">{d.department_name}</TableCell>
                        <TableCell className="text-right tabular-nums">{d.draft}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium text-amber-700">
                          {d.pending}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-700">
                          {d.approved}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-gray-500">
                          {d.rejected}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-bold">
                          {d.total}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-bold">
                      <TableCell>合計</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {data.by_department.reduce((s, d) => s + d.draft, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {data.by_department.reduce((s, d) => s + d.pending, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {data.by_department.reduce((s, d) => s + d.approved, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {data.by_department.reduce((s, d) => s + d.rejected, 0)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{data.total}</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 案件一覧 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            案件一覧
            <span className="ml-2 text-sm font-normal text-gray-400">{data.total}件</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">タイトル（起票項目）</TableHead>
                  <TableHead>種別</TableHead>
                  <TableHead>部署</TableHead>
                  <TableHead>起票者</TableHead>
                  <TableHead>フェーズ</TableHead>
                  <TableHead>状態</TableHead>
                  <TableHead>申請日</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-400">
                      案件がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  data.requests.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/approvals/${r.id}`)}
                    >
                      <TableCell className="font-medium max-w-[320px] truncate">
                        {r.title}
                      </TableCell>
                      <TableCell className="text-gray-600 whitespace-nowrap">
                        {r.request_type_label}
                      </TableCell>
                      <TableCell className="text-gray-600 whitespace-nowrap">
                        {r.department_name}
                      </TableCell>
                      <TableCell className="text-gray-600 whitespace-nowrap">
                        {r.requester_name}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap',
                            PHASE_COLORS[r.phase] ?? 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {r.phase}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {REQUEST_STATUS_LABELS[r.status as ApprovalRequestStatus] ?? r.status}
                      </TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap tabular-nums">
                        {formatDate(r.submitted_at ?? r.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
