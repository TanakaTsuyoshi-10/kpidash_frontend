/**
 * クレームカードコンポーネント
 */
import { Card, CardContent } from '@/components/ui/card'
import { ComplaintStatusBadge } from './ComplaintStatusBadge'
import { ComplaintTypeBadge } from './ComplaintTypeBadge'
import { format } from 'date-fns'
import type { ComplaintListItem } from '@/types/complaint'

interface Props {
  complaint: ComplaintListItem
  onClick?: () => void
}

export function ComplaintCard({ complaint, onClick }: Props) {
  const incidentDate = format(new Date(complaint.incident_date), 'yyyy/MM/dd')

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* ヘッダー: バッジ */}
          <div className="flex items-center gap-2 flex-wrap">
            <ComplaintStatusBadge status={complaint.status} statusName={complaint.status_name} />
            <ComplaintTypeBadge complaintType={complaint.complaint_type} typeName={complaint.complaint_type_name} />
          </div>

          {/* 内容 */}
          <p className="text-sm line-clamp-2">{complaint.complaint_content}</p>

          {/* メタ情報 */}
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>発生日: {incidentDate}</span>
            </div>
            <div className="truncate">部署: {complaint.department_type_name}{complaint.segment_name ? ` (${complaint.segment_name})` : ''}</div>
            {complaint.responder_name && (
              <div className="truncate">対応者: {complaint.responder_name}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
