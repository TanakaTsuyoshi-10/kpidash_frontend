'use client'

import useSWR from 'swr'
import { ManufacturingAnalysisResponse } from '@/types/manufacturing'
import { PeriodType } from '@/types/dashboard'

interface UseManufacturingOptions {
  periodType: PeriodType
  year: number
  month?: number
}

export function useManufacturingSWR(options: UseManufacturingOptions) {
  const { periodType, year, month } = options

  const params = new URLSearchParams({
    period_type: periodType,
    year: year.toString(),
  })
  if (month) params.append('month', month.toString())

  const { data, error, isLoading, mutate } = useSWR<ManufacturingAnalysisResponse>(
    `/api/v1/manufacturing?${params}`,
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
