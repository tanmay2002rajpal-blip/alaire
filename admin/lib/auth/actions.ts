'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { signToken, setSessionCookie, clearSessionCookie, getSession } from './jwt'
import type { AdminUser } from './types'

interface LoginResult {
  success: boolean
  error?: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const supabase = createAdminClient()

  // Get admin user
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !admin) {
    return { success: false, error: 'Invalid email or password' }
  }

  if (!admin.is_active) {
    return { success: false, error: 'Account is deactivated' }
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, admin.password_hash)
  if (!validPassword) {
    // Log failed attempt
    await supabase.from('activity_log').insert({
      action: 'login_failed',
      details: { email, reason: 'invalid_password' },
    })
    return { success: false, error: 'Invalid email or password' }
  }

  // Create session
  const sessionId = crypto.randomUUID()
  const tokenHash = crypto.createHash('sha256').update(sessionId).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await supabase.from('admin_sessions').insert({
    id: sessionId,
    admin_id: admin.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  // Create JWT
  const token = signToken({
    sub: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    session_id: sessionId,
  })

  await setSessionCookie(token)

  // Log successful login
  await supabase.from('activity_log').insert({
    admin_id: admin.id,
    admin_name: admin.name,
    action: 'login',
    details: { email },
  })

  return { success: true }
}

export async function logout(): Promise<void> {
  const session = await getSession()

  if (session) {
    const supabase = createAdminClient()

    // Delete session from database
    await supabase
      .from('admin_sessions')
      .delete()
      .eq('id', session.session_id)

    // Log logout
    await supabase.from('activity_log').insert({
      admin_id: session.sub,
      admin_name: session.name,
      action: 'logout',
    })
  }

  await clearSessionCookie()
  redirect('/login')
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const session = await getSession()
  if (!session) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('admin_users')
    .select('id, email, name, role, is_active, two_factor_enabled, created_at, updated_at')
    .eq('id', session.sub)
    .single()

  return data
}
