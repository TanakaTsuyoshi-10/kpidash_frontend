'use client'

import useSWR from 'swr'
import { DashboardResponse, PeriodType } from '@/types/dashboard'

interface UseDashboardOptions {
  periodType: PeriodType
  year: number
  month?: number
  quarter?: number
}

export function useDashboardSWR(options: UseDashboardOptions) {
  const { periodType, year, month, quarter } = options

  const params = new URLSearchParams({
    period_type: periodType,
    year: year.toString(),
  })
  if (month) params.append('month', month.toString())
  if (quarter) params.append('quarter', quarter.toString())

  const { data, error, isLoading, mutate } = useSWR<DashboardResponse>(
    `/api/v1/dashboard?${params}`,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate
  }
}

export function useDashboardChartSWR(months: number = 12) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/v1/dashboard/chart?months=${months}`,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refetch: mutate
  }
}
