/**
 * クレーム一覧コンポーネント
 * テーブル/カード表示切替対応
 */
'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ComplaintStatusBadge } from './ComplaintStatusBadge'
import { ComplaintTypeBadge } from './ComplaintTypeBadge'
import { ComplaintCard } from './ComplaintCard'
import { AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import type { ComplaintListItem } from '@/types/complaint'

export type ViewMode = 'table' | 'card'

interface Props {
  items: ComplaintListItem[]
  loading?: boolean
  viewMode: ViewMode
  onSelect: (complaint: ComplaintListItem) => void
}

export function ComplaintList({ items, loading, viewMode, onSelect }: Props) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-400">
            クレームデータがありません
          </div>
        </CardContent>
      </Card>
    )
  }

  if (viewMode === 'card') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            onClick={() => onSelect(complaint)}
          />
        ))}
      </div>
    )
  }

  // テーブル表示
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="w-[104px]">発生日</TableHead>
                <TableHead className="w-[140px]">発生部署</TableHead>
                <TableHead className="w-[112px]">種類</TableHead>
                <TableHead>内容</TableHead>
                <TableHead className="w-[112px]">対応者</TableHead>
                <TableHead className="w-[92px]">状況</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((complaint) => (
                <TableRow
                  key={complaint.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onSelect(complaint)}
                >
                  <TableCell className="px-2">
                    {!complaint.response_summary && (
                      <span title="対応結果が未入力です">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(complaint.incident_date), 'yyyy/MM/dd')}
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="line-clamp-1">
                      {complaint.department_type_name}
                      {complaint.segment_name && <span className="text-gray-500 ml-1">({complaint.segment_name})</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ComplaintTypeBadge complaintType={complaint.complaint_type} typeName={complaint.complaint_type_name} />
                  </TableCell>
                  <TableCell className="text-sm whitespace-normal">
                    <span className="line-clamp-2 break-words">
                      {complaint.complaint_content}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    <span className="line-clamp-1">{complaint.responder_name || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <ComplaintStatusBadge status={complaint.status} statusName={complaint.status_name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
