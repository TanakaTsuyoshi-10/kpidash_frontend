/**
 * 部門選択コンポーネント
 */
'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const departments = [
  { slug: 'store', name: '店舗部門' },
  { slug: 'online', name: '通販部門' },
  { slug: 'factory', name: '工場部門' },
  { slug: 'finance', name: '財務部門' },
]

interface Props {
  value: string
  onChange: (value: string) => void
}

export function DepartmentSelector({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="部門を選択" />
      </SelectTrigger>
      <SelectContent>
        {departments.map((dept) => (
          <SelectItem key={dept.slug} value={dept.slug}>
            {dept.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
