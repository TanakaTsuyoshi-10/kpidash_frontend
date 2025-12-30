export interface User {
  id: string
  email: string
  department_id?: string
  department_name?: string
  role?: 'admin' | 'viewer' | 'editor'
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}
