'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { gsap } from 'gsap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { login, getLoginCsrfToken } from '@/lib/auth/actions'

export default function LoginPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [csrfToken, setCsrfToken] = useState<string>('')

  // Fetch CSRF token on mount
  useEffect(() => {
    getLoginCsrfToken().then(setCsrfToken)
  }, [])

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' }
      )
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password, csrfToken)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Login failed')
      setLoading(false)
      
      // Refresh CSRF token after failed attempt
      getLoginCsrfToken().then(setCsrfToken)
      
      // Shake animation on error
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { x: -10 },
          { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' }
        )
      }
    }
  }

  return (
    <Card ref={cardRef} className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif">ALAIRE</CardTitle>
        <CardDescription>Admin Dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@alaire.in"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
