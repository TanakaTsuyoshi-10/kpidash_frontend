/**
 * 承認ワークフロー用フック
 */
'use client'

import useSWR from 'swr'
import type {
  ApprovalDelegate,
  ApprovalRequestDetail,
  ApprovalRequestListResponse,
  PendingCountResponse,
  RequestType,
  SlackChannelBinding,
} from '@/types/approval'

export function useApprovalRequests(tab: 'todo' | 'mine' | 'all') {
  const { data, error, isLoading, mutate } = useSWR<ApprovalRequestListResponse>(
    `/api/v1/approvals/?tab=${tab}`
  )
  return {
    requests: data?.requests ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  }
}

export function usePendingApprovalCount(enabled: boolean = true) {
  const { data } = useSWR<PendingCountResponse>(
    enabled ? '/api/v1/approvals/pending-count' : null,
    { refreshInterval: 5 * 60 * 1000 }
  )
  return data?.count ?? 0
}

export function useApprovalRequest(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApprovalRequestDetail>(
    id ? `/api/v1/approvals/${id}` : null
  )
  return { request: data ?? null, isLoading, error, mutate }
}

export function useRequestTypes(includeInactive = false) {
  const { data, error, isLoading, mutate } = useSWR<RequestType[]>(
    `/api/v1/approval-types/?include_inactive=${includeInactive}`
  )
  return { types: data ?? [], isLoading, error, mutate }
}

export function useChannelBindings(requestType?: string) {
  const q = requestType ? `?request_type=${encodeURIComponent(requestType)}` : ''
  const { data, error, isLoading, mutate } = useSWR<SlackChannelBinding[]>(
    `/api/v1/approval-types/channel-bindings${q}`
  )
  return { bindings: data ?? [], isLoading, error, mutate }
}

export function useAssignableUsers() {
  const { data, error, isLoading } = useSWR<
    Array<{ id: string; email: string; display_name: string }>
  >('/api/v1/approvals/assignable-users')
  return { users: data ?? [], isLoading, error }
}

export function useDelegates(allUsers = false) {
  const { data, error, isLoading, mutate } = useSWR<ApprovalDelegate[]>(
    `/api/v1/approval-delegates/?all_users=${allUsers}`
  )
  return { delegates: data ?? [], isLoading, error, mutate }
}
