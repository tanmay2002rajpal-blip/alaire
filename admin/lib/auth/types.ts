export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
  is_active: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AdminSession {
  id: string
  admin_id: string
  expires_at: string
  created_at: string
}

export interface JWTPayload {
  sub: string // admin_id
  email: string
  name: string
  role: 'admin' | 'staff'
  session_id: string
  iat: number
  exp: number
}
