/**
 * 決裁欄（判子ボード）
 *
 * 稟議書の決裁欄のように、起案者と各承認ステップをBOXで横に並べ、
 * 承認が進むごとに赤い印影が「押印」されていく表示。詳細ページの
 * 最上部に置き、承認状況が一目でわかるようにする。
 * 同じステップ番号の承認者（同時承認グループ）は同じステップ枠内に並ぶ。
 */
'use client'

import { Users } from 'lucide-react'
import type { ApprovalStep } from '@/types/approval'
import { cn } from '@/lib/utils'

interface ApprovalStampBoardProps {
  steps: ApprovalStep[]
  requesterName: string
  submittedAt: string | null | undefined
  requestStatus: string
  currentStepNo: number
  mode: string
}

/** 印影に入れる文字（姓の先頭2文字。空白・全角空白は除去） */
function stampText(name: string | null | undefined): string {
  const cleaned = (name ?? '').replace(/[\s　]/g, '')
  if (!cleaned) return '印'
  return cleaned.slice(0, 2)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return ''
  try {
    const d = new Date(value)
    return `${d.getMonth() + 1}/${d.getDate()}`
  } catch {
    return ''
  }
}

/** 押印済みの赤印 */
function StampSeal({ text }: { text: string }) {
  return (
    <span className="flex items-center justify-center h-12 w-12 rounded-full border-2 border-red-500 text-red-600 font-bold text-sm font-serif rotate-[-8deg] bg-white shadow-sm">
      {text}
    </span>
  )
}

/** 未押印の空欄（破線サークル） */
function EmptySeal({ label, tone }: { label: string; tone: 'waiting' | 'future' | 'skipped' }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center h-12 w-12 rounded-full border-2 border-dashed text-[10px] leading-tight text-center',
        tone === 'waiting' && 'border-amber-400 text-amber-500',
        tone === 'future' && 'border-gray-300 text-gray-300',
        tone === 'skipped' && 'border-gray-300 text-gray-400',
      )}
    >
      {label}
    </span>
  )
}

/** 却下印（角ばった赤枠） */
function RejectSeal() {
  return (
    <span className="flex items-center justify-center h-12 w-12 rounded border-2 border-red-700 text-red-700 font-bold text-sm font-serif rotate-[-8deg] bg-white">
      却下
    </span>
  )
}

interface CellProps {
  header: string
  name: string
  date?: string
  active?: boolean
  rejected?: boolean
  children: React.ReactNode
}

function StampCell({ header, name, date, active, rejected, children }: CellProps) {
  return (
    <div
      className={cn(
        'w-[88px] shrink-0 rounded-md border overflow-hidden bg-white',
        rejected
          ? 'border-red-300'
          : active
            ? 'border-amber-300 ring-1 ring-amber-200'
            : 'border-gray-200',
      )}
    >
      <div
        className={cn(
          'px-1 py-0.5 text-[10px] text-center font-medium truncate',
          rejected
            ? 'bg-red-50 text-red-700'
            : active
              ? 'bg-amber-50 text-amber-700'
              : 'bg-gray-50 text-gray-500',
        )}
      >
        {header}
      </div>
      <div className="h-16 flex items-center justify-center">{children}</div>
      <div className="px-1 pb-1 text-center">
        <p className="text-[10px] text-gray-600 truncate" title={name}>
          {name}
        </p>
        <p className="text-[9px] text-gray-400 h-3">{date || ' '}</p>
      </div>
    </div>
  )
}

export function ApprovalStampBoard({
  steps,
  requesterName,
  submittedAt,
  requestStatus,
  currentStepNo,
  mode,
}: ApprovalStampBoardProps) {
  if (steps.length === 0) return null

  const stageNos = [...new Set(steps.map((s) => s.step_no))].sort((a, b) => a - b)
  const requesterStamped = !!submittedAt && requestStatus !== 'draft'

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 overflow-x-auto">
      <div className="flex items-stretch gap-2 min-w-max">
        {/* 起案者 */}
        <StampCell
          header="起案"
          name={requesterName}
          date={requesterStamped ? formatDate(submittedAt) : undefined}
        >
          {requesterStamped ? (
            <StampSeal text={stampText(requesterName)} />
          ) : (
            <EmptySeal label="未" tone="future" />
          )}
        </StampCell>

        {/* 各ステップ（同時承認グループは同じ枠内に並ぶ） */}
        {stageNos.map((stageNo) => {
          const group = steps.filter((s) => s.step_no === stageNo)
          const isCurrentStage =
            requestStatus === 'pending' &&
            group.some((s) => s.status === 'pending') &&
            (mode !== 'sequential' || stageNo === currentStepNo)
          const isGroup = group.length > 1

          const cells = group.map((step) => {
            const active = isCurrentStage && step.status === 'pending'
            const header = isGroup
              ? `${stageNo}` + '・同時'
              : `ステップ${stageNo}`
            return (
              <StampCell
                key={step.id}
                header={header}
                name={step.assignee_name ?? step.assignee_email}
                date={
                  step.status === 'approved' || step.status === 'rejected'
                    ? formatDate(step.acted_at)
                    : undefined
                }
                active={active}
                rejected={step.status === 'rejected'}
              >
                {step.status === 'approved' ? (
                  <StampSeal text={stampText(step.assignee_name ?? step.assignee_email)} />
                ) : step.status === 'rejected' ? (
                  <RejectSeal />
                ) : step.status === 'skipped' ? (
                  <EmptySeal label="省略" tone="skipped" />
                ) : active ? (
                  <EmptySeal label="承認待ち" tone="waiting" />
                ) : (
                  <EmptySeal label="未" tone="future" />
                )}
              </StampCell>
            )
          })

          if (!isGroup) return cells

          // 同時承認グループ: 枠でまとめてラベルを付ける
          return (
            <div
              key={stageNo}
              className={cn(
                'rounded-md border border-dashed p-1 pt-0',
                isCurrentStage ? 'border-amber-300' : 'border-indigo-200',
              )}
            >
              <div className="flex items-center justify-center gap-1 text-[9px] text-indigo-500 py-0.5">
                <Users className="h-2.5 w-2.5" />
                ステップ{stageNo}・全員承認
              </div>
              <div className="flex items-stretch gap-1">{cells}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
