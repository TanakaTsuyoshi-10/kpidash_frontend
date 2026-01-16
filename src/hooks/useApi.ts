/**
 * API呼び出しフック
 */
'use client'

import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api/client'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const get = useCallback(async (endpoint: string) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await apiClient.get<T>(endpoint)
      setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setState({ data: null, loading: false, error: message })
      throw err
    }
  }, [])

  const post = useCallback(async (endpoint: string, body?: unknown) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await apiClient.post<T>(endpoint, body)
      setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setState({ data: null, loading: false, error: message })
      throw err
    }
  }, [])

  const uploadFile = useCallback(async (endpoint: string, file: File) => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await apiClient.uploadFile<T>(endpoint, file)
      setState({ data, loading: false, error: null })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました'
      setState({ data: null, loading: false, error: message })
      throw err
    }
  }, [])

  return {
    ...state,
    get,
    post,
    uploadFile,
  }
}
